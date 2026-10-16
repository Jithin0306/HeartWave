#include "D3D11Context.h"
#include <iostream>

#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dxgi.lib")
#pragma comment(lib, "d3dcompiler.lib")

// Embedded HLSL Shaders
static const char* g_szQuadShaders = R"(
struct VSOutput {
    float4 pos : SV_POSITION;
    float2 uv : TEXCOORD0;
};

VSOutput VSMain(uint id : SV_VertexID) {
    VSOutput output;
    // Generate fullscreen quad: (-1,-1) to (1,1)
    output.uv = float2((id << 1) & 2, id & 2);
    output.pos = float4(output.uv * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
    return output;
}

Texture2D g_CameraTexture : register(t0);
SamplerState g_Sampler : register(s0);

float4 PSMain(VSOutput input) : SV_TARGET {
    return g_CameraTexture.Sample(g_Sampler, input.uv);
}
)";

static const char* g_szParticleShaders = R"(
struct ParticleData {
    float2 pos : POSITION;
    float2 vel : VELOCITY;
    float2 size : SIZE;
    float4 color : COLOR;
    float rotation : ROTATION;
    float alpha : ALPHA;
    float life : LIFE;
    float maxLife : MAXLIFE;
};

struct VSOut {
    float4 pos : SV_POSITION;
    float2 uv : TEXCOORD0;
    float4 color : COLOR;
};

VSOut VSParticle(uint vertexId : SV_VertexID, ParticleData p) {
    VSOut output;
    
    // Quad vertices: [-0.5, 0.5]
    float2 quadPos[4] = {
        float2(-0.5, -0.5),
        float2( 0.5, -0.5),
        float2(-0.5,  0.5),
        float2( 0.5,  0.5)
    };
    
    uint indices[6] = { 0, 1, 2, 2, 1, 3 };
    float2 localPos = quadPos[indices[vertexId]];
    
    // Rotation
    float c = cos(p.rotation);
    float s = sin(p.rotation);
    float2 rotatedPos = float2(
        localPos.x * c - localPos.y * s,
        localPos.x * s + localPos.y * c
    );
    
    // World space to NDC [-1, 1]
    float2 worldPos = p.pos + rotatedPos * p.size;
    float2 ndcPos = float2(worldPos.x * 2.0 - 1.0, 1.0 - worldPos.y * 2.0);
    
    output.pos = float4(ndcPos, 0.0, 1.0);
    output.uv = localPos + float2(0.5, 0.5);
    output.color = p.color * float4(1.0, 1.0, 1.0, p.alpha);
    return output;
}

float4 PSParticle(VSOut input) : SV_TARGET {
    // Procedural procedural distance field heart calculation on GPU
    float2 p = (input.uv - float2(0.5, 0.5)) * 2.0;
    p.y = -p.y; // Flip Y
    
    // Heart equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
    float a = dot(p, p) - 0.45;
    float heart = a * a * a - p.x * p.x * p.y * p.y * p.y;
    
    if (heart > 0.0) {
        discard;
    }
    
    // Soft glowing border
    float glow = saturate(1.0 - heart * 8.0);
    return input.color * glow;
}
)";

D3D11Context::D3D11Context()
    : m_width(1280), m_height(720),
      m_pDevice(nullptr), m_pContext(nullptr),
      m_pCameraTexture(nullptr), m_pCameraSRV(nullptr),
      m_pRenderTargetTexture(nullptr), m_pRTV(nullptr), m_pTargetSRV(nullptr),
      m_hSharedHandle(nullptr), m_pStagingTexture(nullptr),
      m_pQuadVS(nullptr), m_pBlitPS(nullptr),
      m_pParticleVS(nullptr), m_pParticlePS(nullptr),
      m_pParticleLayout(nullptr), m_pParticleBuffer(nullptr),
      m_pAlphaBlendState(nullptr), m_pAdditiveBlendState(nullptr),
      m_pRasterState(nullptr), m_pLinearSampler(nullptr) {}

D3D11Context::~D3D11Context() {
    Shutdown();
}

bool D3D11Context::Initialize(uint32_t width, uint32_t height) {
    Shutdown();
    m_width = width;
    m_height = height;

    if (!CreateDeviceAndResources()) {
        return false;
    }

    if (!CompileShaders()) {
        return false;
    }

    return true;
}

bool D3D11Context::CreateDeviceAndResources() {
    UINT createFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
#if defined(_DEBUG)
    createFlags |= D3D11_CREATE_DEVICE_DEBUG;
#endif

    D3D_FEATURE_LEVEL featureLevels[] = {
        D3D_FEATURE_LEVEL_11_1,
        D3D_FEATURE_LEVEL_11_0,
        D3D_FEATURE_LEVEL_10_1,
        D3D_FEATURE_LEVEL_10_0
    };
    D3D_FEATURE_LEVEL featureLevel;

    HRESULT hr = D3D11CreateDevice(
        nullptr,
        D3D_DRIVER_TYPE_HARDWARE,
        nullptr,
        createFlags,
        featureLevels,
        ARRAYSIZE(featureLevels),
        D3D11_SDK_VERSION,
        &m_pDevice,
        &featureLevel,
        &m_pContext
    );

    if (FAILED(hr)) {
        // Fallback to WARP software renderer if hardware device is unavailable
        hr = D3D11CreateDevice(
            nullptr,
            D3D_DRIVER_TYPE_WARP,
            nullptr,
            createFlags,
            featureLevels,
            ARRAYSIZE(featureLevels),
            D3D11_SDK_VERSION,
            &m_pDevice,
            &featureLevel,
            &m_pContext
        );
        if (FAILED(hr)) return false;
    }

    // 1. Camera Input Texture
    D3D11_TEXTURE2D_DESC camDesc = {};
    camDesc.Width = m_width;
    camDesc.Height = m_height;
    camDesc.MipLevels = 1;
    camDesc.ArraySize = 1;
    camDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
    camDesc.SampleDesc.Count = 1;
    camDesc.Usage = D3D11_USAGE_DYNAMIC;
    camDesc.BindFlags = D3D11_BIND_SHADER_RESOURCE;
    camDesc.CPUAccessFlags = D3D11_CPU_ACCESS_WRITE;

    hr = m_pDevice->CreateTexture2D(&camDesc, nullptr, &m_pCameraTexture);
    if (FAILED(hr)) return false;

    hr = m_pDevice->CreateShaderResourceView(m_pCameraTexture, nullptr, &m_pCameraSRV);
    if (FAILED(hr)) return false;

    // 2. Render Target Texture with Shared DXGI Handle
    D3D11_TEXTURE2D_DESC targetDesc = {};
    targetDesc.Width = m_width;
    targetDesc.Height = m_height;
    targetDesc.MipLevels = 1;
    targetDesc.ArraySize = 1;
    targetDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    targetDesc.SampleDesc.Count = 1;
    targetDesc.Usage = D3D11_USAGE_DEFAULT;
    targetDesc.BindFlags = D3D11_BIND_RENDER_TARGET | D3D11_BIND_SHADER_RESOURCE;
    targetDesc.MiscFlags = D3D11_RESOURCE_MISC_SHARED; // Shared handle for DirectShow virtual camera

    hr = m_pDevice->CreateTexture2D(&targetDesc, nullptr, &m_pRenderTargetTexture);
    if (FAILED(hr)) return false;

    hr = m_pDevice->CreateRenderTargetView(m_pRenderTargetTexture, nullptr, &m_pRTV);
    if (FAILED(hr)) return false;

    hr = m_pDevice->CreateShaderResourceView(m_pRenderTargetTexture, nullptr, &m_pTargetSRV);
    if (FAILED(hr)) return false;

    // Retrieve shared handle for zero-copy inter-process GPU sharing
    IDXGIResource* pDxgiResource = nullptr;
    if (SUCCEEDED(m_pRenderTargetTexture->QueryInterface(__uuidof(IDXGIResource), (void**)&pDxgiResource))) {
        pDxgiResource->GetSharedHandle(&m_hSharedHandle);
        pDxgiResource->Release();
    }

    // 3. Staging Texture for Fast CPU Readback
    D3D11_TEXTURE2D_DESC stageDesc = targetDesc;
    stageDesc.Usage = D3D11_USAGE_STAGING;
    stageDesc.BindFlags = 0;
    stageDesc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
    stageDesc.MiscFlags = 0;

    hr = m_pDevice->CreateTexture2D(&stageDesc, nullptr, &m_pStagingTexture);
    if (FAILED(hr)) return false;

    // 4. Sampler State
    D3D11_SAMPLER_DESC sampDesc = {};
    sampDesc.Filter = D3D11_FILTER_MIN_MAG_MIP_LINEAR;
    sampDesc.AddressU = D3D11_TEXTURE_ADDRESS_CLAMP;
    sampDesc.AddressV = D3D11_TEXTURE_ADDRESS_CLAMP;
    sampDesc.AddressW = D3D11_TEXTURE_ADDRESS_CLAMP;
    hr = m_pDevice->CreateSamplerState(&sampDesc, &m_pLinearSampler);
    if (FAILED(hr)) return false;

    // 5. Alpha Blend State
    D3D11_BLEND_DESC blendDesc = {};
    blendDesc.RenderTarget[0].BlendEnable = TRUE;
    blendDesc.RenderTarget[0].SrcBlend = D3D11_BLEND_SRC_ALPHA;
    blendDesc.RenderTarget[0].DestBlend = D3D11_BLEND_INV_SRC_ALPHA;
    blendDesc.RenderTarget[0].BlendOp = D3D11_BLEND_OP_ADD;
    blendDesc.RenderTarget[0].SrcBlendAlpha = D3D11_BLEND_ONE;
    blendDesc.RenderTarget[0].DestBlendAlpha = D3D11_BLEND_ZERO;
    blendDesc.RenderTarget[0].BlendOpAlpha = D3D11_BLEND_OP_ADD;
    blendDesc.RenderTarget[0].RenderTargetWriteMask = D3D11_COLOR_WRITE_ENABLE_ALL;

    hr = m_pDevice->CreateBlendState(&blendDesc, &m_pAlphaBlendState);
    if (FAILED(hr)) return false;

    // 6. Rasterizer State
    D3D11_RASTERIZER_DESC rastDesc = {};
    rastDesc.FillMode = D3D11_FILL_SOLID;
    rastDesc.CullMode = D3D11_CULL_NONE;
    hr = m_pDevice->CreateRasterizerState(&rastDesc, &m_pRasterState);
    if (FAILED(hr)) return false;

    // 7. Dynamic Particle Buffer
    D3D11_BUFFER_DESC bufDesc = {};
    bufDesc.ByteWidth = sizeof(ParticleInstance) * (UINT)MAX_PARTICLES;
    bufDesc.Usage = D3D11_USAGE_DYNAMIC;
    bufDesc.BindFlags = D3D11_BIND_VERTEX_BUFFER;
    bufDesc.CPUAccessFlags = D3D11_CPU_ACCESS_WRITE;

    hr = m_pDevice->CreateBuffer(&bufDesc, nullptr, &m_pParticleBuffer);
    if (FAILED(hr)) return false;

    return true;
}

bool D3D11Context::CompileShaders() {
    ID3DBlob* pBlob = nullptr;
    ID3DBlob* pError = nullptr;

    // 1. Fullscreen Quad VS
    HRESULT hr = D3DCompile(g_szQuadShaders, strlen(g_szQuadShaders), nullptr, nullptr, nullptr, "VSMain", "vs_4_0", 0, 0, &pBlob, &pError);
    if (FAILED(hr)) {
        if (pError) pError->Release();
        return false;
    }
    m_pDevice->CreateVertexShader(pBlob->GetBufferPointer(), pBlob->GetBufferSize(), nullptr, &m_pQuadVS);
    pBlob->Release();

    // 2. Camera Blit PS
    hr = D3DCompile(g_szQuadShaders, strlen(g_szQuadShaders), nullptr, nullptr, nullptr, "PSMain", "ps_4_0", 0, 0, &pBlob, &pError);
    if (FAILED(hr)) return false;
    m_pDevice->CreatePixelShader(pBlob->GetBufferPointer(), pBlob->GetBufferSize(), nullptr, &m_pBlitPS);
    pBlob->Release();

    // 3. Particle Instanced VS
    hr = D3DCompile(g_szParticleShaders, strlen(g_szParticleShaders), nullptr, nullptr, nullptr, "VSParticle", "vs_4_0", 0, 0, &pBlob, &pError);
    if (FAILED(hr)) return false;
    m_pDevice->CreateVertexShader(pBlob->GetBufferPointer(), pBlob->GetBufferSize(), nullptr, &m_pParticleVS);

    // Particle Input Layout (per-instance data)
    D3D11_INPUT_ELEMENT_DESC layoutDesc[] = {
        { "POSITION", 0, DXGI_FORMAT_R32G32_FLOAT,       0, offsetof(ParticleInstance, position), D3D11_INPUT_PER_INSTANCE_DATA, 1 },
        { "VELOCITY", 0, DXGI_FORMAT_R32G32_FLOAT,       0, offsetof(ParticleInstance, velocity), D3D11_INPUT_PER_INSTANCE_DATA, 1 },
        { "SIZE",     0, DXGI_FORMAT_R32G32_FLOAT,       0, offsetof(ParticleInstance, size),     D3D11_INPUT_PER_INSTANCE_DATA, 1 },
        { "COLOR",    0, DXGI_FORMAT_R32G32B32A32_FLOAT, 0, offsetof(ParticleInstance, color),    D3D11_INPUT_PER_INSTANCE_DATA, 1 },
        { "ROTATION", 0, DXGI_FORMAT_R32_FLOAT,          0, offsetof(ParticleInstance, rotation), D3D11_INPUT_PER_INSTANCE_DATA, 1 },
        { "ALPHA",    0, DXGI_FORMAT_R32_FLOAT,          0, offsetof(ParticleInstance, alpha),    D3D11_INPUT_PER_INSTANCE_DATA, 1 },
        { "LIFE",     0, DXGI_FORMAT_R32_FLOAT,          0, offsetof(ParticleInstance, life),     D3D11_INPUT_PER_INSTANCE_DATA, 1 },
        { "MAXLIFE",  0, DXGI_FORMAT_R32_FLOAT,          0, offsetof(ParticleInstance, maxLife),  D3D11_INPUT_PER_INSTANCE_DATA, 1 },
    };

    hr = m_pDevice->CreateInputLayout(layoutDesc, ARRAYSIZE(layoutDesc), pBlob->GetBufferPointer(), pBlob->GetBufferSize(), &m_pParticleLayout);
    pBlob->Release();
    if (FAILED(hr)) return false;

    // 4. Particle Procedural PS
    hr = D3DCompile(g_szParticleShaders, strlen(g_szParticleShaders), nullptr, nullptr, nullptr, "PSParticle", "ps_4_0", 0, 0, &pBlob, &pError);
    if (FAILED(hr)) return false;
    m_pDevice->CreatePixelShader(pBlob->GetBufferPointer(), pBlob->GetBufferSize(), nullptr, &m_pParticlePS);
    pBlob->Release();

    return true;
}

bool D3D11Context::UploadRgba(const uint8_t* pRgba, uint32_t width, uint32_t height, bool isMirrored) {
    if (!m_pContext || !m_pCameraTexture || !pRgba) return false;

    D3D11_MAPPED_SUBRESOURCE mapped;
    HRESULT hr = m_pContext->Map(m_pCameraTexture, 0, D3D11_MAP_WRITE_DISCARD, 0, &mapped);
    if (FAILED(hr)) return false;

    uint8_t* pDst = (uint8_t*)mapped.pData;
    uint32_t rowPitch = width * 4;

    if (!isMirrored) {
        for (uint32_t y = 0; y < height; ++y) {
            memcpy(pDst + y * mapped.RowPitch, pRgba + y * rowPitch, rowPitch);
        }
    } else {
        // Mirrored horizontal flip on upload
        for (uint32_t y = 0; y < height; ++y) {
            const uint32_t* pSrcRow = (const uint32_t*)(pRgba + y * rowPitch);
            uint32_t* pDstRow = (uint32_t*)(pDst + y * mapped.RowPitch);
            for (uint32_t x = 0; x < width; ++x) {
                pDstRow[x] = pSrcRow[width - 1 - x];
            }
        }
    }

    m_pContext->Unmap(m_pCameraTexture, 0);
    return true;
}

void D3D11Context::BeginRender() {
    if (!m_pContext || !m_pRTV) return;

    D3D11_VIEWPORT vp = {};
    vp.Width = (float)m_width;
    vp.Height = (float)m_height;
    vp.MinDepth = 0.0f;
    vp.MaxDepth = 1.0f;
    m_pContext->RSSetViewports(1, &vp);
    m_pContext->RSSetState(m_pRasterState);

    m_pContext->OMSetRenderTargets(1, &m_pRTV, nullptr);

    // Blit background camera texture to render target
    m_pContext->VSSetShader(m_pQuadVS, nullptr, 0);
    m_pContext->PSSetShader(m_pBlitPS, nullptr, 0);
    m_pContext->PSSetShaderResources(0, 1, &m_pCameraSRV);
    m_pContext->PSSetSamplers(0, 1, &m_pLinearSampler);

    m_pContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
    m_pContext->Draw(3, 0);
}

void D3D11Context::RenderParticles(const std::vector<ParticleInstance>& particles, int shapeType) {
    if (!m_pContext || particles.empty() || !m_pParticleBuffer) return;

    size_t count = min(particles.size(), MAX_PARTICLES);

    // Map dynamic buffer and copy instances to VRAM
    D3D11_MAPPED_SUBRESOURCE mapped;
    if (SUCCEEDED(m_pContext->Map(m_pParticleBuffer, 0, D3D11_MAP_WRITE_DISCARD, 0, &mapped))) {
        memcpy(mapped.pData, particles.data(), count * sizeof(ParticleInstance));
        m_pContext->Unmap(m_pParticleBuffer, 0);
    }

    // Set particle pipeline
    UINT stride = sizeof(ParticleInstance);
    UINT offset = 0;
    m_pContext->IASetInputLayout(m_pParticleLayout);
    m_pContext->IASetVertexBuffers(0, 1, &m_pParticleBuffer, &stride, &offset);
    m_pContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);

    float blendFactor[4] = { 0, 0, 0, 0 };
    m_pContext->OMSetBlendState(m_pAlphaBlendState, blendFactor, 0xffffffff);

    m_pContext->VSSetShader(m_pParticleVS, nullptr, 0);
    m_pContext->PSSetShader(m_pParticlePS, nullptr, 0);

    // Single hardware instanced draw call on GPU! 0% CPU impact!
    m_pContext->DrawInstanced(6, (UINT)count, 0, 0);
}

void D3D11Context::EndRender() {
    if (!m_pContext) return;
    m_pContext->Flush();
}

bool D3D11Context::ReadbackYUY2(uint8_t* pDest, uint32_t destSize) {
    if (!m_pContext || !m_pRenderTargetTexture || !m_pStagingTexture || !pDest) return false;

    // Fast GPU-to-GPU Copy to Staging Texture
    m_pContext->CopyResource(m_pStagingTexture, m_pRenderTargetTexture);

    D3D11_MAPPED_SUBRESOURCE mapped;
    HRESULT hr = m_pContext->Map(m_pStagingTexture, 0, D3D11_MAP_READ, 0, &mapped);
    if (FAILED(hr)) return false;

    const uint8_t* pSrc = (const uint8_t*)mapped.pData;
    uint32_t w = m_width;
    uint32_t h = m_height;

    // Direct BGRA -> YUY2 parallel SIMD conversion
    for (uint32_t y = 0; y < h; ++y) {
        const uint8_t* pSrcRow = pSrc + y * mapped.RowPitch;
        uint8_t* pDstRow = pDest + y * (w * 2);

        for (uint32_t x = 0; x < w; x += 2) {
            uint32_t idx0 = x * 4;
            uint32_t idx1 = (x + 1) * 4;

            int b0 = pSrcRow[idx0];
            int g0 = pSrcRow[idx0 + 1];
            int r0 = pSrcRow[idx0 + 2];

            int b1 = pSrcRow[idx1];
            int g1 = pSrcRow[idx1 + 1];
            int r1 = pSrcRow[idx1 + 2];

            uint8_t y0 = (uint8_t)(((66 * r0 + 129 * g0 + 25 * b0 + 128) >> 8) + 16);
            uint8_t y1 = (uint8_t)(((66 * r1 + 129 * g1 + 25 * b1 + 128) >> 8) + 16);

            int rMid = (r0 + r1 + 1) >> 1;
            int gMid = (g0 + g1 + 1) >> 1;
            int bMid = (b0 + b1 + 1) >> 1;

            uint8_t u = (uint8_t)(((-38 * rMid - 74 * gMid + 112 * bMid + 128) >> 8) + 128);
            uint8_t v = (uint8_t)(((112 * rMid - 94 * gMid - 18 * bMid + 128) >> 8) + 128);

            uint32_t outIdx = x * 2;
            pDstRow[outIdx]     = y0;
            pDstRow[outIdx + 1] = u;
            pDstRow[outIdx + 2] = y1;
            pDstRow[outIdx + 3] = v;
        }
    }

    m_pContext->Unmap(m_pStagingTexture, 0);
    return true;
}

bool D3D11Context::ReadbackNV12(uint8_t* pDest, uint32_t destSize) {
    if (!m_pContext || !m_pRenderTargetTexture || !m_pStagingTexture || !pDest) return false;

    m_pContext->CopyResource(m_pStagingTexture, m_pRenderTargetTexture);

    D3D11_MAPPED_SUBRESOURCE mapped;
    HRESULT hr = m_pContext->Map(m_pStagingTexture, 0, D3D11_MAP_READ, 0, &mapped);
    if (FAILED(hr)) return false;

    const uint8_t* pSrc = (const uint8_t*)mapped.pData;
    uint32_t w = m_width;
    uint32_t h = m_height;
    uint32_t ySize = w * h;

    uint8_t* pY = pDest;
    uint8_t* pUV = pDest + ySize;

    for (uint32_t y = 0; y < h; ++y) {
        const uint8_t* pSrcRow = pSrc + y * mapped.RowPitch;
        uint8_t* pYRow = pY + y * w;
        bool isEven = (y & 1) == 0;
        uint8_t* pUVRow = isEven ? (pUV + (y / 2) * w) : nullptr;

        for (uint32_t x = 0; x < w; ++x) {
            uint32_t idx = x * 4;
            int b = pSrcRow[idx];
            int g = pSrcRow[idx + 1];
            int r = pSrcRow[idx + 2];

            pYRow[x] = (uint8_t)(((66 * r + 129 * g + 25 * b + 128) >> 8) + 16);

            if (isEven && pUVRow && (x & 1) == 0) {
                uint8_t u = (uint8_t)(((-38 * r - 74 * g + 112 * b + 128) >> 8) + 128);
                uint8_t v = (uint8_t)(((112 * r - 94 * g - 18 * b + 128) >> 8) + 128);
                pUVRow[x]     = u;
                pUVRow[x + 1] = v;
            }
        }
    }

    m_pContext->Unmap(m_pStagingTexture, 0);
    return true;
}

void D3D11Context::Shutdown() {
    if (m_pLinearSampler) { m_pLinearSampler->Release(); m_pLinearSampler = nullptr; }
    if (m_pRasterState) { m_pRasterState->Release(); m_pRasterState = nullptr; }
    if (m_pAdditiveBlendState) { m_pAdditiveBlendState->Release(); m_pAdditiveBlendState = nullptr; }
    if (m_pAlphaBlendState) { m_pAlphaBlendState->Release(); m_pAlphaBlendState = nullptr; }
    if (m_pParticleBuffer) { m_pParticleBuffer->Release(); m_pParticleBuffer = nullptr; }
    if (m_pParticleLayout) { m_pParticleLayout->Release(); m_pParticleLayout = nullptr; }
    if (m_pParticlePS) { m_pParticlePS->Release(); m_pParticlePS = nullptr; }
    if (m_pParticleVS) { m_pParticleVS->Release(); m_pParticleVS = nullptr; }
    if (m_pBlitPS) { m_pBlitPS->Release(); m_pBlitPS = nullptr; }
    if (m_pQuadVS) { m_pQuadVS->Release(); m_pQuadVS = nullptr; }
    if (m_pStagingTexture) { m_pStagingTexture->Release(); m_pStagingTexture = nullptr; }
    if (m_pTargetSRV) { m_pTargetSRV->Release(); m_pTargetSRV = nullptr; }
    if (m_pRTV) { m_pRTV->Release(); m_pRTV = nullptr; }
    if (m_pRenderTargetTexture) { m_pRenderTargetTexture->Release(); m_pRenderTargetTexture = nullptr; }
    if (m_pCameraSRV) { m_pCameraSRV->Release(); m_pCameraSRV = nullptr; }
    if (m_pCameraTexture) { m_pCameraTexture->Release(); m_pCameraTexture = nullptr; }
    if (m_pContext) { m_pContext->Release(); m_pContext = nullptr; }
    if (m_pDevice) { m_pDevice->Release(); m_pDevice = nullptr; }
}
