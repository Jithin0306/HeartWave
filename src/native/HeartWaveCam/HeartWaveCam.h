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

#pragma pack(push, 1)
struct HeartWaveSharedHeader {
    uint32_t magic;          // 'HWAV'
    uint32_t version;        // 1
    uint32_t width;          // e.g. 1920 or 1280
    uint32_t height;         // e.g. 1080 or 720
    uint32_t format;         // 0 = NV12, 1 = RGB32
    uint32_t writeIndex;     // increments each frame
    uint64_t timestamp;      // 100ns ticks
    uint32_t frameSize;      // width * height * 4 or width * height * 3/2
    uint32_t isPrivacyMuted; // 1 = muted slate
    uint32_t reserved[7];
};
#pragma pack(pop)
