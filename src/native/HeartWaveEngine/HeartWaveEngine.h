#pragma once

#include <windows.h>
#include <d3d11.h>
#include <dxgi.h>
#include <cstdint>

#ifdef HEARTWAVEENGINE_EXPORTS
#define HW_API __declspec(dllexport)
#else
#define HW_API __declspec(dllimport)
#endif

extern "C" {

/**
 * Initialize the native DirectX 11 video and effect compositing engine.
 * Creates D3D11 hardware device, shared texture handles, and GPU shader pipelines.
 */
HW_API bool HeartWaveEngine_Initialize(uint32_t width, uint32_t height);

/**
 * Update engine state and advance particle physics on GPU.
 */
HW_API void HeartWaveEngine_Update(float dt);

/**
 * Execute GPU render pass: compositing, particle rendering, and format conversion.
 */
HW_API void HeartWaveEngine_Render();

/**
 * Trigger romantic particle effect anchored to normalized hand coordinates (0.0 - 1.0).
 */
HW_API void HeartWaveEngine_TriggerEffect(const char* effectId, float anchorX, float anchorY, float confidence);

/**
 * Update active effect anchor position while gesture is sustained.
 */
HW_API void HeartWaveEngine_UpdateEffectAnchor(const char* effectId, float anchorX, float anchorY);

/**
 * Release holding state on active effect.
 */
HW_API void HeartWaveEngine_ReleaseEffect(const char* effectId);

/**
 * Ingest external RGBA frame (e.g. from WebRTC mobile camera) into GPU texture.
 */
HW_API bool HeartWaveEngine_PushRgbaFrame(const uint8_t* pRgba, uint32_t width, uint32_t height, bool isMirrored);

/**
 * Get shared DXGI texture handle for zero-copy interop with DirectShow / Media Foundation.
 */
HW_API HANDLE HeartWaveEngine_GetSharedTextureHandle();

/**
 * Acquire latest YUY2 / NV12 frame buffer rendered on GPU.
 */
HW_API bool HeartWaveEngine_GetOutputFrame(uint8_t* pDest, uint32_t destSize, uint32_t format);

/**
 * Shutdown engine and release all Direct3D 11 resources.
 */
HW_API void HeartWaveEngine_Shutdown();

}
