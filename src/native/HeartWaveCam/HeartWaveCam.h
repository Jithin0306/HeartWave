#pragma once

#include <windows.h>
#include <dshow.h>
#include <strmif.h>
#include <uuids.h>
#include <initguid.h>
#include <cstdint>
#include <string>
#include <vector>

// {A7B39E10-6C23-41D8-9274-1290EF927B50}
DEFINE_GUID(CLSID_HeartWaveVirtualCam,
    0xa7b39e10, 0x6c23, 0x41d8, 0x92, 0x74, 0x12, 0x90, 0xef, 0x92, 0x7b, 0x50);

#define HEARTWAVE_DEVICE_NAME L"Heartwave Virtual Camera"
#define HEARTWAVE_PIN_NAME L"Capture"
#define HEARTWAVE_MMF_NAME L"HeartWaveSharedVideo"
#define HEARTWAVE_EVENT_NAME L"HeartWaveNewFrameEvent"

#define HW_MAGIC 0x48574156 // 'HWAV'
#define HW_RING_BUFFER_SLOTS 3
#define HW_MAX_FRAME_SIZE (1920 * 1080 * 4) // 8,294,400 bytes per slot

#pragma pack(push, 1)
struct HeartWaveSharedHeader {
    uint32_t magic;             // 'HWAV'
    uint32_t version;           // 2 for ring buffer
    uint32_t width;             // e.g. 1920 or 1280
    uint32_t height;            // e.g. 1080 or 720
    uint32_t format;            // 0 = NV12, 1 = RGB32, 2 = YUY2
    volatile uint32_t writeIndex; // increments each frame (monotonic sequence)
    uint64_t timestamp;         // monotonic 100ns timestamp (QPC or Unix epoch)
    uint32_t frameSize;         // byte size of current frame in slot
    uint32_t isPrivacyMuted;    // 1 = muted slate
    // Ring buffer & format negotiation:
    uint32_t numSlots;          // 3 (triple buffer)
    uint32_t slotStride;        // byte stride per slot
    volatile uint32_t latestSlotIndex; // Index (0..2) of latest complete frame
    volatile uint32_t requestedFormat; // 0 = NV12, 1 = RGB32, 2 = YUY2
    volatile uint32_t consumerActive;  // 1 when DirectShow pin is streaming in Discord/OBS
    uint16_t consumerWidth;     // Negotiated width in DirectShow pin
    uint16_t consumerHeight;    // Negotiated height in DirectShow pin
};
#pragma pack(pop)
