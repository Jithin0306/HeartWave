#define HEARTWAVEENGINE_EXPORTS
#include "HeartWaveEngine.h"
#include "D3D11Context.h"
#include <memory>
#include <vector>
#include <cmath>
#include <string>

// Win32 Shared Memory Header (matching HeartWaveCam.h exactly)
#pragma pack(push, 1)
struct HeartWaveSharedHeader {
    uint32_t magic;
    uint32_t version;
    uint32_t width;
    uint32_t height;
    uint32_t format;
    volatile uint32_t writeIndex;
    uint64_t timestamp;
    uint32_t frameSize;
    uint32_t isPrivacyMuted;
    uint32_t numSlots;
    uint32_t slotStride;
    volatile uint32_t latestSlotIndex;
    volatile uint32_t requestedFormat;
    volatile uint32_t consumerActive;
    uint16_t consumerWidth;
    uint16_t consumerHeight;
};
#pragma pack(pop)

static const uint32_t HW_MAGIC = 0x48574156;
static const size_t HEADER_SIZE = 64;
static const size_t NUM_SLOTS = 3;
static const size_t MAX_SLOT_SIZE = 1920 * 1080 * 4;
static const size_t TOTAL_MMF_SIZE = HEADER_SIZE + NUM_SLOTS * MAX_SLOT_SIZE;

class NativeEngineManager {
public:
    NativeEngineManager()
        : m_width(1280), m_height(720),
          m_hMMF(nullptr), m_pSharedHeader(nullptr), m_pSharedData(nullptr),
          m_hNewFrameEvent(nullptr), m_latestSlot(0), m_writeIndex(0),
          m_isHolding(false), m_spawnTimer(0.0f), m_activeAnchor{ 0.5f, 0.5f } {}

    ~NativeEngineManager() {
        Shutdown();
    }

    bool Initialize(uint32_t width, uint32_t height) {
        Shutdown();
        m_width = width;
        m_height = height;

        if (!m_d3dContext.Initialize(width, height)) {
            return false;
        }

        // Open or Create Shared Memory MMF
        m_hMMF = CreateFileMappingW(INVALID_HANDLE_VALUE, nullptr, PAGE_READWRITE, 0, (DWORD)TOTAL_MMF_SIZE, L"HeartWaveSharedVideo");
        if (m_hMMF) {
            m_pSharedHeader = (HeartWaveSharedHeader*)MapViewOfFile(m_hMMF, FILE_MAP_ALL_ACCESS, 0, 0, TOTAL_MMF_SIZE);
            if (m_pSharedHeader) {
                m_pSharedData = ((uint8_t*)m_pSharedHeader) + HEADER_SIZE;
                m_pSharedHeader->magic = HW_MAGIC;
                m_pSharedHeader->version = 2;
                m_pSharedHeader->width = width;
                m_pSharedHeader->height = height;
                m_pSharedHeader->numSlots = NUM_SLOTS;
                m_pSharedHeader->slotStride = (uint32_t)MAX_SLOT_SIZE;
                m_pSharedHeader->format = 2; // Default to YUY2 for Discord
            }
        }

        // Create or Open Frame Sync Event
        m_hNewFrameEvent = CreateEventW(nullptr, FALSE, FALSE, L"HeartWaveNewFrameEvent");

        return true;
    }

    void TriggerEffect(const std::string& effectId, float anchorX, float anchorY, float confidence) {
        if (effectId.empty() || effectId == "none" || effectId == "all") {
            m_isHolding = false;
            m_particles.clear();
            return;
        }

        m_activeEffect = effectId;
        m_activeAnchor = { anchorX, anchorY };
        m_isHolding = true;

        // Instant burst of romantic particles (restrained & fluid)
        if (m_particles.empty()) {
            for (int i = 0; i < 4; ++i) {
                ParticleInstance p = {};
                float offsetX = ((float)rand() / (float)RAND_MAX - 0.5f) * 0.04f;
                float offsetY = ((float)rand() / (float)RAND_MAX - 0.5f) * 0.03f;
                p.position = { anchorX + offsetX, anchorY + offsetY };
                p.velocity = {
                    ((float)rand() / (float)RAND_MAX - 0.5f) * 0.06f,
                    -0.06f - ((float)rand() / (float)RAND_MAX) * 0.08f
                };
                float s = 0.035f + ((float)rand() / (float)RAND_MAX) * 0.02f;
                p.size = { s, s * ((float)m_width / (float)m_height) };
                p.color = (i % 2 == 0) ? XMFLOAT4(0.85f, 0.60f, 0.65f, 1.0f) : XMFLOAT4(0.92f, 0.78f, 0.55f, 1.0f);
                p.rotation = ((float)rand() / (float)RAND_MAX - 0.5f) * 0.3f;
                p.alpha = 0.95f;
                p.life = 0.0f;
                p.maxLife = 2.0f + ((float)rand() / (float)RAND_MAX) * 0.8f;
                m_particles.push_back(p);
            }
        }
    }

    void UpdateEffectAnchor(const std::string& effectId, float anchorX, float anchorY) {
        if (effectId.empty() || effectId == "none" || effectId == "all") {
            m_isHolding = false;
            return;
        }
        m_activeEffect = effectId;
        m_activeAnchor = { anchorX, anchorY };
        m_isHolding = true;
    }

    void ReleaseEffect(const std::string& effectId) {
        m_isHolding = false;
        m_particles.clear();
    }

    void Update(float dt) {
        // Continuous spawn while holding gesture (capped to 10 particles)
        if (m_isHolding && m_particles.size() < 10) {
            m_spawnTimer += dt;
            if (m_spawnTimer >= 0.35f) {
                m_spawnTimer = 0.0f;
                ParticleInstance p = {};
                float offsetX = ((float)rand() / (float)RAND_MAX - 0.5f) * 0.04f;
                p.position = { m_activeAnchor.x + offsetX, m_activeAnchor.y };
                p.velocity = {
                    ((float)rand() / (float)RAND_MAX - 0.5f) * 0.04f,
                    -0.07f - ((float)rand() / (float)RAND_MAX) * 0.06f
                };
                float s = 0.03f + ((float)rand() / (float)RAND_MAX) * 0.02f;
                p.size = { s, s * ((float)m_width / (float)m_height) };
                p.color = XMFLOAT4(0.85f, 0.60f, 0.65f, 1.0f);
                p.rotation = 0.0f;
                p.alpha = 0.9f;
                p.life = 0.0f;
                p.maxLife = 2.2f;
                m_particles.push_back(p);
            }
        }

        // Advance particle physics on GPU
        for (auto it = m_particles.begin(); it != m_particles.end();) {
            it->life += dt;
            it->position.x += it->velocity.x * dt + sinf(it->life * 3.0f) * 0.0008f;
            it->position.y += it->velocity.y * dt;
            it->alpha = max(0.0f, 1.0f - (it->life / it->maxLife));

            if (it->life >= it->maxLife || it->position.y < -0.1f) {
                it = m_particles.erase(it);
            } else {
                ++it;
            }
        }
    }

    void Render() {
        m_d3dContext.BeginRender();
        if (!m_particles.empty()) {
            m_d3dContext.RenderParticles(m_particles, 0);
        }
        m_d3dContext.EndRender();

        // Push composited GPU frame to Shared Memory Ring Buffer for Virtual Camera
        if (m_pSharedHeader && m_pSharedData) {
            uint32_t reqFormat = m_pSharedHeader->requestedFormat;
            bool useYUY2 = (reqFormat != 0);
            uint32_t frameSize = useYUY2 ? (m_width * m_height * 2) : (m_width * m_height * 3 / 2);

            uint32_t nextSlot = (m_latestSlot + 1) % NUM_SLOTS;
            uint8_t* pSlotDest = m_pSharedData + nextSlot * MAX_SLOT_SIZE;

            bool ok = useYUY2 ? m_d3dContext.ReadbackYUY2(pSlotDest, frameSize) : m_d3dContext.ReadbackNV12(pSlotDest, frameSize);

            if (ok) {
                m_pSharedHeader->width = m_width;
                m_pSharedHeader->height = m_height;
                m_pSharedHeader->format = useYUY2 ? 2 : 0;
                m_pSharedHeader->writeIndex = ++m_writeIndex;
                m_pSharedHeader->frameSize = frameSize;
                m_pSharedHeader->latestSlotIndex = nextSlot;
                m_latestSlot = nextSlot;

                // Signal DirectShow DoStream thread
                if (m_hNewFrameEvent) {
                    SetEvent(m_hNewFrameEvent);
                }
            }
        }
    }

    bool PushRgba(const uint8_t* pRgba, uint32_t width, uint32_t height, bool isMirrored) {
        return m_d3dContext.UploadRgba(pRgba, width, height, isMirrored);
    }

    HANDLE GetSharedHandle() const {
        return m_d3dContext.GetSharedHandle();
    }

    bool GetOutputFrame(uint8_t* pDest, uint32_t destSize, uint32_t format) {
        if (format == 2) {
            return m_d3dContext.ReadbackYUY2(pDest, destSize);
        } else {
            return m_d3dContext.ReadbackNV12(pDest, destSize);
        }
    }

    void Shutdown() {
        m_d3dContext.Shutdown();
        if (m_pSharedHeader) {
            UnmapViewOfFile(m_pSharedHeader);
            m_pSharedHeader = nullptr;
            m_pSharedData = nullptr;
        }
        if (m_hMMF) {
            CloseHandle(m_hMMF);
            m_hMMF = nullptr;
        }
        if (m_hNewFrameEvent) {
            CloseHandle(m_hNewFrameEvent);
            m_hNewFrameEvent = nullptr;
        }
        m_particles.clear();
    }

private:
    uint32_t m_width;
    uint32_t m_height;
    D3D11Context m_d3dContext;

    // Shared Memory & Event
    HANDLE m_hMMF;
    HeartWaveSharedHeader* m_pSharedHeader;
    uint8_t* m_pSharedData;
    HANDLE m_hNewFrameEvent;
    uint32_t m_latestSlot;
    uint32_t m_writeIndex;

    // Effect State
    std::string m_activeEffect;
    DirectX::XMFLOAT2 m_activeAnchor;
    bool m_isHolding;
    float m_spawnTimer;
    std::vector<ParticleInstance> m_particles;
};

static std::unique_ptr<NativeEngineManager> g_pEngine = nullptr;

extern "C" {

HW_API bool HeartWaveEngine_Initialize(uint32_t width, uint32_t height) {
    if (!g_pEngine) {
        g_pEngine = std::make_unique<NativeEngineManager>();
    }
    return g_pEngine->Initialize(width, height);
}

HW_API void HeartWaveEngine_Update(float dt) {
    if (g_pEngine) g_pEngine->Update(dt);
}

HW_API void HeartWaveEngine_Render() {
    if (g_pEngine) g_pEngine->Render();
}

HW_API void HeartWaveEngine_TriggerEffect(const char* effectId, float anchorX, float anchorY, float confidence) {
    if (g_pEngine && effectId) {
        g_pEngine->TriggerEffect(effectId, anchorX, anchorY, confidence);
    }
}

HW_API void HeartWaveEngine_UpdateEffectAnchor(const char* effectId, float anchorX, float anchorY) {
    if (g_pEngine && effectId) {
        g_pEngine->UpdateEffectAnchor(effectId, anchorX, anchorY);
    }
}

HW_API void HeartWaveEngine_ReleaseEffect(const char* effectId) {
    if (g_pEngine && effectId) {
        g_pEngine->ReleaseEffect(effectId);
    }
}

HW_API bool HeartWaveEngine_PushRgbaFrame(const uint8_t* pRgba, uint32_t width, uint32_t height, bool isMirrored) {
    if (g_pEngine) {
        return g_pEngine->PushRgba(pRgba, width, height, isMirrored);
    }
    return false;
}

HW_API HANDLE HeartWaveEngine_GetSharedTextureHandle() {
    if (g_pEngine) {
        return g_pEngine->GetSharedHandle();
    }
    return nullptr;
}

HW_API bool HeartWaveEngine_GetOutputFrame(uint8_t* pDest, uint32_t destSize, uint32_t format) {
    if (g_pEngine) {
        return g_pEngine->GetOutputFrame(pDest, destSize, format);
    }
    return false;
}

HW_API void HeartWaveEngine_Shutdown() {
    if (g_pEngine) {
        g_pEngine->Shutdown();
        g_pEngine.reset();
    }
}

}
