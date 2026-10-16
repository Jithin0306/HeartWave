#pragma once

#include <windows.h>
#include <d3d11.h>
#include <dxgi.h>
#include <d3dcompiler.h>
#include <directxmath.h>
#include <cstdint>
#include <vector>

using namespace DirectX;

struct ParticleInstance {
    XMFLOAT2 position;
    XMFLOAT2 velocity;
    XMFLOAT2 size;
    XMFLOAT4 color;
    float rotation;
    float alpha;
    float life;
    float maxLife;
};

class D3D11Context {
public:
    D3D11Context();
    ~D3D11Context();

    bool Initialize(uint32_t width, uint32_t height);
    void Shutdown();

    bool UploadRgba(const uint8_t* pRgba, uint32_t width, uint32_t height, bool isMirrored);
    void BeginRender();
    void RenderParticles(const std::vector<ParticleInstance>& particles, int shapeType);
    void EndRender();

    HANDLE GetSharedHandle() const { return m_hSharedHandle; }
    bool ReadbackYUY2(uint8_t* pDest, uint32_t destSize);
    bool ReadbackNV12(uint8_t* pDest, uint32_t destSize);

    uint32_t GetWidth() const { return m_width; }
    uint32_t GetHeight() const { return m_height; }

private:
    bool CreateDeviceAndResources();
    bool CompileShaders();

    uint32_t m_width;
    uint32_t m_height;

    ID3D11Device* m_pDevice;
    ID3D11DeviceContext* m_pContext;

    // Camera Input Texture
    ID3D11Texture2D* m_pCameraTexture;
    ID3D11ShaderResourceView* m_pCameraSRV;

    // Render Target Texture (with Shared DXGI Handle for Virtual Camera interop)
    ID3D11Texture2D* m_pRenderTargetTexture;
    ID3D11RenderTargetView* m_pRTV;
    ID3D11ShaderResourceView* m_pTargetSRV;
    HANDLE m_hSharedHandle;

    // CPU Readback Staging Texture
    ID3D11Texture2D* m_pStagingTexture;

    // Shaders & States
    ID3D11VertexShader* m_pQuadVS;
    ID3D11PixelShader* m_pBlitPS;
    ID3D11VertexShader* m_pParticleVS;
    ID3D11PixelShader* m_pParticlePS;
    ID3D11InputLayout* m_pParticleLayout;
    ID3D11Buffer* m_pParticleBuffer;
    ID3D11BlendState* m_pAlphaBlendState;
    ID3D11BlendState* m_pAdditiveBlendState;
    ID3D11RasterizerState* m_pRasterState;
    ID3D11SamplerState* m_pLinearSampler;

    static const size_t MAX_PARTICLES = 16384;
};
