#include "HeartWaveCam.h"
#include <shlwapi.h>
#include <strsafe.h>
#include <mmsystem.h>

#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")
#pragma comment(lib, "advapi32.lib")
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "strmiids.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "winmm.lib")

static HINSTANCE g_hModule = NULL;
static volatile LONG g_cServerLocks = 0;

class HeartWaveFilter;

// Forward declaration
class HeartWavePin : public IPin, public IAMStreamConfig, public IKsPropertySet {
private:
    volatile LONG m_cRef;
    HeartWaveFilter* m_pFilter;
    IPin* m_pConnectedPin;
    IMemAllocator* m_pAllocator;
    IMemInputPin* m_pMemInputPin;
    AM_MEDIA_TYPE m_currentMediaType;
    bool m_bConnected;

    int m_width;
    int m_height;
    REFERENCE_TIME m_avgTimePerFrame;
    GUID m_subType;

public:
    HeartWavePin(HeartWaveFilter* pFilter);
    virtual ~HeartWavePin();

    // IUnknown
    STDMETHODIMP QueryInterface(REFIID riid, void** ppv);
    STDMETHODIMP_(ULONG) AddRef();
    STDMETHODIMP_(ULONG) Release();

    // IPin
    STDMETHODIMP Connect(IPin* pReceivePin, const AM_MEDIA_TYPE* pmt);
    STDMETHODIMP ReceiveConnection(IPin* pConnector, const AM_MEDIA_TYPE* pmt);
    STDMETHODIMP Disconnect();
    STDMETHODIMP ConnectedTo(IPin** pPin);
    STDMETHODIMP ConnectionMediaType(AM_MEDIA_TYPE* pmt);
    STDMETHODIMP QueryPinInfo(PIN_INFO* pInfo);
    STDMETHODIMP QueryDirection(PIN_DIRECTION* pPinDir);
    STDMETHODIMP QueryId(LPWSTR* Id);
    STDMETHODIMP QueryAccept(const AM_MEDIA_TYPE* pmt);
    STDMETHODIMP EnumMediaTypes(IEnumMediaTypes** ppEnum);
    STDMETHODIMP QueryInternalConnections(IPin** apPin, ULONG* nPin);
    STDMETHODIMP EndOfStream();
    STDMETHODIMP BeginFlush();
    STDMETHODIMP EndFlush();
    STDMETHODIMP NewSegment(REFERENCE_TIME tStart, REFERENCE_TIME tStop, double dRate);

    // IAMStreamConfig
    STDMETHODIMP SetFormat(AM_MEDIA_TYPE* pmt);
    STDMETHODIMP GetFormat(AM_MEDIA_TYPE** ppmt);
    STDMETHODIMP GetNumberOfCapabilities(int* piCount, int* piSize);
    STDMETHODIMP GetStreamCaps(int iIndex, AM_MEDIA_TYPE** ppmt, BYTE* pSCC);

    // IKsPropertySet
    STDMETHODIMP Set(REFGUID guidPropSet, DWORD dwPropID, void* pInstanceData, DWORD cbInstanceData, void* pPropData, DWORD cbPropData);
    STDMETHODIMP Get(REFGUID guidPropSet, DWORD dwPropID, void* pInstanceData, DWORD cbInstanceData, void* pPropData, DWORD cbPropData, DWORD* pcbReturned);
    STDMETHODIMP QuerySupported(REFGUID guidPropSet, DWORD dwPropID, DWORD* pTypeSupport);

    // Helper methods
    HRESULT BuildMediaType(int index, AM_MEDIA_TYPE* pmt);
    int GetWidth() const { return m_width; }
    int GetHeight() const { return m_height; }
    REFERENCE_TIME GetInterval() const { return m_avgTimePerFrame; }
    GUID GetSubType() const { return m_subType; }
    IMemAllocator* GetAllocator() { return m_pAllocator; }
    IMemInputPin* GetMemInputPin() { return m_pMemInputPin; }
    bool IsConnected() const { return m_bConnected; }
};

class HeartWaveFilter : public IBaseFilter, public IAMFilterMiscFlags {
private:
    volatile LONG m_cRef;
    FILTER_STATE m_state;
    IFilterGraph* m_pGraph;
    IReferenceClock* m_pClock;
    REFERENCE_TIME m_tStart;
    ULONGLONG m_startTick;
    HeartWavePin* m_pPin;

    HANDLE m_hThread;
    HANDLE m_hStopEvent;
    HANDLE m_hNewFrameEvent;
    volatile bool m_bStreaming;

    HANDLE m_hMMF;
    HeartWaveSharedHeader* m_pSharedHeader;
    uint8_t* m_pSharedData;

    static DWORD WINAPI ThreadProc(LPVOID lpParam);
    void DoStream();
    void RenderDefaultFrame(uint8_t* pDst, int width, int height, GUID subType);

public:
    HeartWaveFilter();
    virtual ~HeartWaveFilter();

    // IUnknown
    STDMETHODIMP QueryInterface(REFIID riid, void** ppv);
    STDMETHODIMP_(ULONG) AddRef();
    STDMETHODIMP_(ULONG) Release();

    // IPersist
    STDMETHODIMP GetClassID(CLSID* pClsID);

    // IMediaFilter
    STDMETHODIMP Stop();
    STDMETHODIMP Pause();
    STDMETHODIMP Run(REFERENCE_TIME tStart);
    STDMETHODIMP GetState(DWORD dwMilliSecsTimeout, FILTER_STATE* State);
    STDMETHODIMP SetSyncSource(IReferenceClock* pClock);
    STDMETHODIMP GetSyncSource(IReferenceClock** pClock);

    // IBaseFilter
    STDMETHODIMP EnumPins(IEnumPins** ppEnum);
    STDMETHODIMP FindPin(LPCWSTR Id, IPin** ppPin);
    STDMETHODIMP QueryFilterInfo(FILTER_INFO* pInfo);
    STDMETHODIMP JoinFilterGraph(IFilterGraph* pGraph, LPCWSTR pName);
    STDMETHODIMP QueryVendorInfo(LPWSTR* pVendorInfo);

    // IAMFilterMiscFlags
    STDMETHODIMP_(ULONG) GetMiscFlags();

    HeartWavePin* GetPin() { return m_pPin; }
    HeartWaveSharedHeader* GetSharedHeader() { return m_pSharedHeader; }
};

// =========================================================================
// EnumPins & EnumMediaTypes Helpers
// =========================================================================

class HeartWaveEnumPins : public IEnumPins {
private:
    volatile LONG m_cRef;
    HeartWaveFilter* m_pFilter;
    ULONG m_iIndex;

public:
    HeartWaveEnumPins(HeartWaveFilter* pFilter, ULONG index = 0)
        : m_cRef(1), m_pFilter(pFilter), m_iIndex(index) {
        if (m_pFilter) m_pFilter->AddRef();
    }
    virtual ~HeartWaveEnumPins() {
        if (m_pFilter) m_pFilter->Release();
    }

    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) {
        if (!ppv) return E_POINTER;
        if (riid == IID_IUnknown || riid == IID_IEnumPins) {
            *ppv = this;
            AddRef();
            return S_OK;
        }
        *ppv = NULL;
        return E_NOINTERFACE;
    }
    STDMETHODIMP_(ULONG) AddRef() { return InterlockedIncrement(&m_cRef); }
    STDMETHODIMP_(ULONG) Release() {
        LONG c = InterlockedDecrement(&m_cRef);
        if (c == 0) delete this;
        return c;
    }

    STDMETHODIMP Next(ULONG cPins, IPin** ppPins, ULONG* pcFetched) {
        if (!ppPins) return E_POINTER;
        if (cPins == 0) return S_OK;
        ULONG fetched = 0;
        if (m_iIndex == 0 && cPins > 0) {
            ppPins[0] = m_pFilter->GetPin();
            ppPins[0]->AddRef();
            fetched = 1;
            m_iIndex++;
        }
        if (pcFetched) *pcFetched = fetched;
        return (fetched == cPins) ? S_OK : S_FALSE;
    }
    STDMETHODIMP Skip(ULONG cPins) {
        m_iIndex += cPins;
        return (m_iIndex <= 1) ? S_OK : S_FALSE;
    }
    STDMETHODIMP Reset() { m_iIndex = 0; return S_OK; }
    STDMETHODIMP Clone(IEnumPins** ppEnum) {
        if (!ppEnum) return E_POINTER;
        *ppEnum = new HeartWaveEnumPins(m_pFilter, m_iIndex);
        return S_OK;
    }
};

class HeartWaveEnumMediaTypes : public IEnumMediaTypes {
private:
    volatile LONG m_cRef;
    HeartWavePin* m_pPin;
    ULONG m_iIndex;

public:
    HeartWaveEnumMediaTypes(HeartWavePin* pPin, ULONG index = 0)
        : m_cRef(1), m_pPin(pPin), m_iIndex(index) {
        if (m_pPin) m_pPin->AddRef();
    }
    virtual ~HeartWaveEnumMediaTypes() {
        if (m_pPin) m_pPin->Release();
    }

    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) {
        if (!ppv) return E_POINTER;
        if (riid == IID_IUnknown || riid == IID_IEnumMediaTypes) {
            *ppv = this;
            AddRef();
            return S_OK;
        }
        *ppv = NULL;
        return E_NOINTERFACE;
    }
    STDMETHODIMP_(ULONG) AddRef() { return InterlockedIncrement(&m_cRef); }
    STDMETHODIMP_(ULONG) Release() {
        LONG c = InterlockedDecrement(&m_cRef);
        if (c == 0) delete this;
        return c;
    }

    STDMETHODIMP Next(ULONG cMediaTypes, AM_MEDIA_TYPE** ppMediaTypes, ULONG* pcFetched) {
        if (!ppMediaTypes) return E_POINTER;
        ULONG fetched = 0;
        for (ULONG i = 0; i < cMediaTypes; i++) {
            AM_MEDIA_TYPE* pmt = (AM_MEDIA_TYPE*)CoTaskMemAlloc(sizeof(AM_MEDIA_TYPE));
            if (!pmt) break;
            ZeroMemory(pmt, sizeof(AM_MEDIA_TYPE));
            if (FAILED(m_pPin->BuildMediaType(m_iIndex + i, pmt))) {
                CoTaskMemFree(pmt);
                break;
            }
            ppMediaTypes[fetched++] = pmt;
        }
        m_iIndex += fetched;
        if (pcFetched) *pcFetched = fetched;
        return (fetched == cMediaTypes) ? S_OK : S_FALSE;
    }
    STDMETHODIMP Skip(ULONG cMediaTypes) {
        m_iIndex += cMediaTypes;
        return (m_iIndex < 12) ? S_OK : S_FALSE;
    }
    STDMETHODIMP Reset() { m_iIndex = 0; return S_OK; }
    STDMETHODIMP Clone(IEnumMediaTypes** ppEnum) {
        if (!ppEnum) return E_POINTER;
        *ppEnum = new HeartWaveEnumMediaTypes(m_pPin, m_iIndex);
        return S_OK;
    }
};

// =========================================================================
// HeartWavePin Implementation
// =========================================================================

HeartWavePin::HeartWavePin(HeartWaveFilter* pFilter)
    : m_cRef(1), m_pFilter(pFilter), m_pConnectedPin(NULL),
      m_pAllocator(NULL), m_pMemInputPin(NULL), m_bConnected(false),
      m_width(1280), m_height(720), m_avgTimePerFrame(333333), // 30 FPS
      m_subType(MEDIASUBTYPE_YUY2) {
    ZeroMemory(&m_currentMediaType, sizeof(m_currentMediaType));
    BuildMediaType(0, &m_currentMediaType);
}

HeartWavePin::~HeartWavePin() {
    Disconnect();
    if (m_currentMediaType.pbFormat) {
        CoTaskMemFree(m_currentMediaType.pbFormat);
    }
}

STDMETHODIMP HeartWavePin::QueryInterface(REFIID riid, void** ppv) {
    if (!ppv) return E_POINTER;
    if (riid == IID_IUnknown || riid == IID_IPin) {
        *ppv = static_cast<IPin*>(this);
        AddRef();
        return S_OK;
    } else if (riid == IID_IAMStreamConfig) {
        *ppv = static_cast<IAMStreamConfig*>(this);
        AddRef();
        return S_OK;
    } else if (riid == IID_IKsPropertySet) {
        *ppv = static_cast<IKsPropertySet*>(this);
        AddRef();
        return S_OK;
    }
    *ppv = NULL;
    return E_NOINTERFACE;
}

STDMETHODIMP_(ULONG) HeartWavePin::AddRef() { return InterlockedIncrement(&m_cRef); }
STDMETHODIMP_(ULONG) HeartWavePin::Release() {
    LONG c = InterlockedDecrement(&m_cRef);
    if (c == 0) delete this;
    return c;
}

HRESULT HeartWavePin::BuildMediaType(int index, AM_MEDIA_TYPE* pmt) {
    if (!pmt) return E_POINTER;
    ZeroMemory(pmt, sizeof(AM_MEDIA_TYPE));

    int w = 1280;
    int h = 720;
    GUID sub = MEDIASUBTYPE_YUY2;
    WORD bpp = 16;

    switch (index) {
        // YUY2 (Index 0-3) - Discord / Zoom / Chrome native DirectShow formats
        case 0: w = 1280; h = 720;  sub = MEDIASUBTYPE_YUY2; bpp = 16; break;
        case 1: w = 1920; h = 1080; sub = MEDIASUBTYPE_YUY2; bpp = 16; break;
        case 2: w = 640;  h = 480;  sub = MEDIASUBTYPE_YUY2; bpp = 16; break;
        case 3: w = 640;  h = 360;  sub = MEDIASUBTYPE_YUY2; bpp = 16; break;

        // NV12 (Index 4-7)
        case 4: w = 1280; h = 720;  sub = MEDIASUBTYPE_NV12; bpp = 12; break;
        case 5: w = 1920; h = 1080; sub = MEDIASUBTYPE_NV12; bpp = 12; break;
        case 6: w = 640;  h = 480;  sub = MEDIASUBTYPE_NV12; bpp = 12; break;
        case 7: w = 640;  h = 360;  sub = MEDIASUBTYPE_NV12; bpp = 12; break;

        // RGB32 (Index 8-11)
        case 8:  w = 1280; h = 720;  sub = MEDIASUBTYPE_RGB32; bpp = 32; break;
        case 9:  w = 1920; h = 1080; sub = MEDIASUBTYPE_RGB32; bpp = 32; break;
        case 10: w = 640;  h = 480;  sub = MEDIASUBTYPE_RGB32; bpp = 32; break;
        case 11: w = 640;  h = 360;  sub = MEDIASUBTYPE_RGB32; bpp = 32; break;

        default: return S_FALSE;
    }

    pmt->majortype = MEDIATYPE_Video;
    pmt->subtype = sub;
    pmt->bFixedSizeSamples = TRUE;
    pmt->bTemporalCompression = FALSE;
    pmt->formattype = FORMAT_VideoInfo;

    DWORD imgSize = (DWORD)(w * h * bpp / 8);
    pmt->lSampleSize = imgSize;

    VIDEOINFOHEADER* vih = (VIDEOINFOHEADER*)CoTaskMemAlloc(sizeof(VIDEOINFOHEADER));
    if (!vih) return E_OUTOFMEMORY;
    ZeroMemory(vih, sizeof(VIDEOINFOHEADER));

    vih->rcSource.right = w;
    vih->rcSource.bottom = h;
    vih->rcTarget = vih->rcSource;
    vih->AvgTimePerFrame = 333333; // 30 FPS
    vih->dwBitRate = (DWORD)((uint64_t)imgSize * 10000000ULL / vih->AvgTimePerFrame * 8ULL);

    vih->bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    vih->bmiHeader.biWidth = w;
    vih->bmiHeader.biHeight = h; // Standard DirectShow positive height for uncompressed video
    vih->bmiHeader.biPlanes = 1;
    vih->bmiHeader.biBitCount = bpp;
    vih->bmiHeader.biCompression = (sub == MEDIASUBTYPE_NV12) ? MAKEFOURCC('N','V','1','2') :
                                   (sub == MEDIASUBTYPE_YUY2) ? MAKEFOURCC('Y','U','Y','2') : BI_RGB;
    vih->bmiHeader.biSizeImage = imgSize;

    pmt->cbFormat = sizeof(VIDEOINFOHEADER);
    pmt->pbFormat = (BYTE*)vih;

    return S_OK;
}

STDMETHODIMP HeartWavePin::Connect(IPin* pReceivePin, const AM_MEDIA_TYPE* pmt) {
    if (!pReceivePin) return E_POINTER;
    if (m_bConnected) return VFW_E_ALREADY_CONNECTED;

    HRESULT hr = E_FAIL;

    if (pmt != NULL) {
        if (QueryAccept(pmt) == S_OK) {
            hr = pReceivePin->ReceiveConnection(this, pmt);
            if (SUCCEEDED(hr)) {
                SetFormat((AM_MEDIA_TYPE*)pmt);
            }
        }
        if (FAILED(hr)) return hr;
    } else {
        hr = pReceivePin->ReceiveConnection(this, &m_currentMediaType);
        if (FAILED(hr)) {
            for (int i = 0; i < 12; i++) {
                AM_MEDIA_TYPE tryMt;
                if (SUCCEEDED(BuildMediaType(i, &tryMt))) {
                    hr = pReceivePin->ReceiveConnection(this, &tryMt);
                    if (SUCCEEDED(hr)) {
                        SetFormat(&tryMt);
                        if (tryMt.pbFormat) CoTaskMemFree(tryMt.pbFormat);
                        break;
                    }
                    if (tryMt.pbFormat) CoTaskMemFree(tryMt.pbFormat);
                }
            }
        }
        if (FAILED(hr)) return hr;
    }

    hr = pReceivePin->QueryInterface(IID_IMemInputPin, (void**)&m_pMemInputPin);
    if (FAILED(hr)) {
        pReceivePin->Disconnect();
        return hr;
    }

    hr = m_pMemInputPin->GetAllocator(&m_pAllocator);
    if (FAILED(hr) || !m_pAllocator) {
        hr = CoCreateInstance(CLSID_MemoryAllocator, NULL, CLSCTX_INPROC_SERVER, IID_IMemAllocator, (void**)&m_pAllocator);
        if (FAILED(hr)) {
            m_pMemInputPin->Release();
            m_pMemInputPin = NULL;
            pReceivePin->Disconnect();
            return hr;
        }
    }

    ALLOCATOR_PROPERTIES propReq = {0};
    ALLOCATOR_PROPERTIES propActual = {0};
    propReq.cBuffers = 4;
    DWORD neededSize = (DWORD)(m_width * m_height * 4);
    if (m_currentMediaType.lSampleSize > neededSize) {
        neededSize = m_currentMediaType.lSampleSize;
    }
    propReq.cbBuffer = neededSize;
    propReq.cbAlign = 32;

    hr = m_pAllocator->SetProperties(&propReq, &propActual);
    if (FAILED(hr)) {
        m_pAllocator->Release();
        m_pAllocator = NULL;
        m_pMemInputPin->Release();
        m_pMemInputPin = NULL;
        pReceivePin->Disconnect();
        return hr;
    }

    hr = m_pMemInputPin->NotifyAllocator(m_pAllocator, FALSE);
    if (FAILED(hr)) {
        m_pAllocator->Release();
        m_pAllocator = NULL;
        m_pMemInputPin->Release();
        m_pMemInputPin = NULL;
        pReceivePin->Disconnect();
        return hr;
    }

    m_pConnectedPin = pReceivePin;
    m_pConnectedPin->AddRef();
    m_bConnected = true;

    return S_OK;
}

STDMETHODIMP HeartWavePin::ReceiveConnection(IPin* pConnector, const AM_MEDIA_TYPE* pmt) {
    return E_UNEXPECTED; // Output pins don't receive connections
}

STDMETHODIMP HeartWavePin::Disconnect() {
    if (!m_bConnected) return S_FALSE;
    if (m_pAllocator) {
        m_pAllocator->Decommit();
        m_pAllocator->Release();
        m_pAllocator = NULL;
    }
    if (m_pMemInputPin) {
        m_pMemInputPin->Release();
        m_pMemInputPin = NULL;
    }
    if (m_pConnectedPin) {
        m_pConnectedPin->Release();
        m_pConnectedPin = NULL;
    }
    m_bConnected = false;
    return S_OK;
}

STDMETHODIMP HeartWavePin::ConnectedTo(IPin** pPin) {
    if (!pPin) return E_POINTER;
    if (!m_bConnected) return VFW_E_NOT_CONNECTED;
    *pPin = m_pConnectedPin;
    (*pPin)->AddRef();
    return S_OK;
}

STDMETHODIMP HeartWavePin::ConnectionMediaType(AM_MEDIA_TYPE* pmt) {
    if (!pmt) return E_POINTER;
    if (!m_bConnected) return VFW_E_NOT_CONNECTED;
    *pmt = m_currentMediaType;
    if (m_currentMediaType.cbFormat > 0 && m_currentMediaType.pbFormat) {
        pmt->pbFormat = (BYTE*)CoTaskMemAlloc(m_currentMediaType.cbFormat);
        memcpy(pmt->pbFormat, m_currentMediaType.pbFormat, m_currentMediaType.cbFormat);
    }
    return S_OK;
}

STDMETHODIMP HeartWavePin::QueryPinInfo(PIN_INFO* pInfo) {
    if (!pInfo) return E_POINTER;
    pInfo->pFilter = m_pFilter;
    if (m_pFilter) m_pFilter->AddRef();
    pInfo->dir = PINDIR_OUTPUT;
    StringCbCopyW(pInfo->achName, sizeof(pInfo->achName), HEARTWAVE_PIN_NAME);
    return S_OK;
}

STDMETHODIMP HeartWavePin::QueryDirection(PIN_DIRECTION* pPinDir) {
    if (!pPinDir) return E_POINTER;
    *pPinDir = PINDIR_OUTPUT;
    return S_OK;
}

STDMETHODIMP HeartWavePin::QueryId(LPWSTR* Id) {
    if (!Id) return E_POINTER;
    *Id = (LPWSTR)CoTaskMemAlloc((wcslen(HEARTWAVE_PIN_NAME) + 1) * sizeof(WCHAR));
    StringCbCopyW(*Id, (wcslen(HEARTWAVE_PIN_NAME) + 1) * sizeof(WCHAR), HEARTWAVE_PIN_NAME);
    return S_OK;
}

STDMETHODIMP HeartWavePin::QueryAccept(const AM_MEDIA_TYPE* pmt) {
    if (!pmt) return E_POINTER;
    if (pmt->majortype != MEDIATYPE_Video) return S_FALSE;
    if (pmt->subtype != MEDIASUBTYPE_NV12 &&
        pmt->subtype != MEDIASUBTYPE_YUY2 &&
        pmt->subtype != MEDIASUBTYPE_RGB32) return S_FALSE;
    return S_OK;
}

STDMETHODIMP HeartWavePin::EnumMediaTypes(IEnumMediaTypes** ppEnum) {
    if (!ppEnum) return E_POINTER;
    *ppEnum = new HeartWaveEnumMediaTypes(this, 0);
    return S_OK;
}

STDMETHODIMP HeartWavePin::QueryInternalConnections(IPin** apPin, ULONG* nPin) { return E_NOTIMPL; }
STDMETHODIMP HeartWavePin::EndOfStream() { return S_OK; }
STDMETHODIMP HeartWavePin::BeginFlush() { return S_OK; }
STDMETHODIMP HeartWavePin::EndFlush() { return S_OK; }
STDMETHODIMP HeartWavePin::NewSegment(REFERENCE_TIME, REFERENCE_TIME, double) { return S_OK; }

// IAMStreamConfig
STDMETHODIMP HeartWavePin::SetFormat(AM_MEDIA_TYPE* pmt) {
    if (!pmt) return E_POINTER;
    if (pmt->formattype == FORMAT_VideoInfo && pmt->pbFormat) {
        VIDEOINFOHEADER* vih = (VIDEOINFOHEADER*)pmt->pbFormat;
        m_width = vih->bmiHeader.biWidth;
        m_height = abs(vih->bmiHeader.biHeight);
        m_avgTimePerFrame = (vih->AvgTimePerFrame > 0) ? vih->AvgTimePerFrame : 333333;
        m_subType = pmt->subtype;

        DWORD bpp = 16;
        if (m_subType == MEDIASUBTYPE_NV12) bpp = 12;
        else if (m_subType == MEDIASUBTYPE_RGB32) bpp = 32;
        DWORD expectedSize = (DWORD)(m_width * m_height * bpp / 8);

        if (m_currentMediaType.pbFormat) CoTaskMemFree(m_currentMediaType.pbFormat);
        m_currentMediaType = *pmt;
        m_currentMediaType.lSampleSize = expectedSize;
        m_currentMediaType.bFixedSizeSamples = TRUE;
        m_currentMediaType.bTemporalCompression = FALSE;

        m_currentMediaType.pbFormat = (BYTE*)CoTaskMemAlloc(pmt->cbFormat);
        if (m_currentMediaType.pbFormat) {
            memcpy(m_currentMediaType.pbFormat, pmt->pbFormat, pmt->cbFormat);
            VIDEOINFOHEADER* localVih = (VIDEOINFOHEADER*)m_currentMediaType.pbFormat;
            localVih->bmiHeader.biSizeImage = expectedSize;
            localVih->bmiHeader.biHeight = m_height;
        }
        if (m_pFilter && m_pFilter->GetSharedHeader()) {
            HeartWaveSharedHeader* h = m_pFilter->GetSharedHeader();
            h->requestedFormat = (m_subType == MEDIASUBTYPE_YUY2) ? 2 : (m_subType == MEDIASUBTYPE_NV12) ? 0 : 1;
            h->consumerWidth = (uint16_t)m_width;
            h->consumerHeight = (uint16_t)m_height;
        }
        return S_OK;
    }
    return E_INVALIDARG;
}

STDMETHODIMP HeartWavePin::GetFormat(AM_MEDIA_TYPE** ppmt) {
    if (!ppmt) return E_POINTER;
    *ppmt = (AM_MEDIA_TYPE*)CoTaskMemAlloc(sizeof(AM_MEDIA_TYPE));
    if (!*ppmt) return E_OUTOFMEMORY;
    **ppmt = m_currentMediaType;
    if (m_currentMediaType.cbFormat > 0 && m_currentMediaType.pbFormat) {
        (*ppmt)->pbFormat = (BYTE*)CoTaskMemAlloc(m_currentMediaType.cbFormat);
        memcpy((*ppmt)->pbFormat, m_currentMediaType.pbFormat, m_currentMediaType.cbFormat);
    }
    return S_OK;
}

STDMETHODIMP HeartWavePin::GetNumberOfCapabilities(int* piCount, int* piSize) {
    if (!piCount || !piSize) return E_POINTER;
    *piCount = 12;
    *piSize = sizeof(VIDEO_STREAM_CONFIG_CAPS);
    return S_OK;
}

STDMETHODIMP HeartWavePin::GetStreamCaps(int iIndex, AM_MEDIA_TYPE** ppmt, BYTE* pSCC) {
    if (!ppmt || !pSCC) return E_POINTER;
    if (iIndex < 0 || iIndex >= 12) return S_FALSE;

    AM_MEDIA_TYPE* pmt = (AM_MEDIA_TYPE*)CoTaskMemAlloc(sizeof(AM_MEDIA_TYPE));
    if (FAILED(BuildMediaType(iIndex, pmt))) {
        CoTaskMemFree(pmt);
        return E_FAIL;
    }
    *ppmt = pmt;

    VIDEO_STREAM_CONFIG_CAPS* caps = (VIDEO_STREAM_CONFIG_CAPS*)pSCC;
    ZeroMemory(caps, sizeof(VIDEO_STREAM_CONFIG_CAPS));
    caps->guid = FORMAT_VideoInfo;
    VIDEOINFOHEADER* vih = (VIDEOINFOHEADER*)pmt->pbFormat;
    caps->MinOutputSize.cx = vih->bmiHeader.biWidth;
    caps->MinOutputSize.cy = abs(vih->bmiHeader.biHeight);
    caps->MaxOutputSize = caps->MinOutputSize;
    caps->InputSize = caps->MinOutputSize;
    caps->MinFrameInterval = 166666; // Up to 60 FPS
    caps->MaxFrameInterval = 1000000; // Down to 10 FPS
    caps->MinBitsPerSecond = vih->dwBitRate;
    caps->MaxBitsPerSecond = vih->dwBitRate * 2;

    return S_OK;
}

// IKsPropertySet
STDMETHODIMP HeartWavePin::Set(REFGUID, DWORD, void*, DWORD, void*, DWORD) { return E_NOTIMPL; }
STDMETHODIMP HeartWavePin::Get(REFGUID guidPropSet, DWORD dwPropID, void*, DWORD, void* pPropData, DWORD cbPropData, DWORD* pcbReturned) {
    if (guidPropSet == AMPROPSETID_Pin && dwPropID == AMPROPERTY_PIN_CATEGORY) {
        if (pcbReturned) *pcbReturned = sizeof(GUID);
        if (!pPropData) return S_OK;
        if (cbPropData < sizeof(GUID)) return E_UNEXPECTED;
        *(GUID*)pPropData = PIN_CATEGORY_CAPTURE;
        return S_OK;
    }
    return E_PROP_SET_UNSUPPORTED;
}
STDMETHODIMP HeartWavePin::QuerySupported(REFGUID guidPropSet, DWORD dwPropID, DWORD* pTypeSupport) {
    if (guidPropSet == AMPROPSETID_Pin && dwPropID == AMPROPERTY_PIN_CATEGORY) {
        if (pTypeSupport) *pTypeSupport = KSPROPERTY_SUPPORT_GET;
        return S_OK;
    }
    return E_PROP_SET_UNSUPPORTED;
}

// =========================================================================
// HeartWaveFilter Implementation
// =========================================================================

HeartWaveFilter::HeartWaveFilter()
    : m_cRef(1), m_state(State_Stopped), m_pGraph(NULL), m_pClock(NULL), m_tStart(0), m_startTick(0),
      m_hThread(NULL), m_hStopEvent(NULL), m_hNewFrameEvent(NULL), m_bStreaming(false),
      m_hMMF(NULL), m_pSharedHeader(NULL), m_pSharedData(NULL) {
    timeBeginPeriod(1);
    m_pPin = new HeartWavePin(this);
    m_hStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
    InterlockedIncrement(&g_cServerLocks);
}

HeartWaveFilter::~HeartWaveFilter() {
    Stop();
    if (m_hStopEvent) CloseHandle(m_hStopEvent);
    if (m_hNewFrameEvent) CloseHandle(m_hNewFrameEvent);
    if (m_pPin) m_pPin->Release();
    timeEndPeriod(1);
    InterlockedDecrement(&g_cServerLocks);
}

STDMETHODIMP HeartWaveFilter::QueryInterface(REFIID riid, void** ppv) {
    if (!ppv) return E_POINTER;
    if (riid == IID_IUnknown || riid == IID_IBaseFilter || riid == IID_IMediaFilter) {
        *ppv = static_cast<IBaseFilter*>(this);
        AddRef();
        return S_OK;
    } else if (riid == IID_IPersist) {
        *ppv = static_cast<IPersist*>(this);
        AddRef();
        return S_OK;
    } else if (riid == IID_IAMFilterMiscFlags) {
        *ppv = static_cast<IAMFilterMiscFlags*>(this);
        AddRef();
        return S_OK;
    }
    *ppv = NULL;
    return E_NOINTERFACE;
}

STDMETHODIMP_(ULONG) HeartWaveFilter::AddRef() { return InterlockedIncrement(&m_cRef); }
STDMETHODIMP_(ULONG) HeartWaveFilter::Release() {
    LONG c = InterlockedDecrement(&m_cRef);
    if (c == 0) delete this;
    return c;
}

STDMETHODIMP HeartWaveFilter::GetClassID(CLSID* pClsID) {
    if (!pClsID) return E_POINTER;
    *pClsID = CLSID_HeartWaveVirtualCam;
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::Stop() {
    if (m_state != State_Stopped) {
        m_bStreaming = false;
        if (m_hStopEvent) SetEvent(m_hStopEvent);
        if (m_hThread) {
            WaitForSingleObject(m_hThread, 2000);
            CloseHandle(m_hThread);
            m_hThread = NULL;
        }
        if (m_hNewFrameEvent) {
            CloseHandle(m_hNewFrameEvent);
            m_hNewFrameEvent = NULL;
        }
        if (m_pPin->GetAllocator()) {
            m_pPin->GetAllocator()->Decommit();
        }
        if (m_pSharedHeader) {
            UnmapViewOfFile(m_pSharedHeader);
            m_pSharedHeader = NULL;
            m_pSharedData = NULL;
        }
        if (m_hMMF) {
            CloseHandle(m_hMMF);
            m_hMMF = NULL;
        }
    }
    m_state = State_Stopped;
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::Pause() {
    if (m_state == State_Stopped) {
        if (m_pPin->GetAllocator()) {
            m_pPin->GetAllocator()->Commit();
        }
        ResetEvent(m_hStopEvent);
        m_bStreaming = true;
        m_hThread = CreateThread(NULL, 0, ThreadProc, this, 0, NULL);
    }
    m_state = State_Paused;
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::Run(REFERENCE_TIME tStart) {
    if (m_state == State_Stopped) {
        Pause();
    }
    m_tStart = tStart;
    m_startTick = GetTickCount64();
    m_state = State_Running;
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::GetState(DWORD, FILTER_STATE* State) {
    if (!State) return E_POINTER;
    *State = m_state;
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::SetSyncSource(IReferenceClock* pClock) {
    if (m_pClock) m_pClock->Release();
    m_pClock = pClock;
    if (m_pClock) m_pClock->AddRef();
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::GetSyncSource(IReferenceClock** pClock) {
    if (!pClock) return E_POINTER;
    *pClock = m_pClock;
    if (*pClock) (*pClock)->AddRef();
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::EnumPins(IEnumPins** ppEnum) {
    if (!ppEnum) return E_POINTER;
    *ppEnum = new HeartWaveEnumPins(this, 0);
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::FindPin(LPCWSTR Id, IPin** ppPin) {
    if (!Id || !ppPin) return E_POINTER;
    if (wcscmp(Id, HEARTWAVE_PIN_NAME) == 0) {
        *ppPin = m_pPin;
        m_pPin->AddRef();
        return S_OK;
    }
    *ppPin = NULL;
    return VFW_E_NOT_FOUND;
}

STDMETHODIMP HeartWaveFilter::QueryFilterInfo(FILTER_INFO* pInfo) {
    if (!pInfo) return E_POINTER;
    StringCbCopyW(pInfo->achName, sizeof(pInfo->achName), HEARTWAVE_DEVICE_NAME);
    pInfo->pGraph = m_pGraph;
    if (m_pGraph) m_pGraph->AddRef();
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::JoinFilterGraph(IFilterGraph* pGraph, LPCWSTR) {
    m_pGraph = pGraph;
    return S_OK;
}

STDMETHODIMP HeartWaveFilter::QueryVendorInfo(LPWSTR*) { return E_NOTIMPL; }
STDMETHODIMP_(ULONG) HeartWaveFilter::GetMiscFlags() { return AM_FILTER_MISC_FLAGS_IS_SOURCE; }

DWORD WINAPI HeartWaveFilter::ThreadProc(LPVOID lpParam) {
    HeartWaveFilter* pThis = (HeartWaveFilter*)lpParam;
    pThis->DoStream();
    return 0;
}

void HeartWaveFilter::RenderDefaultFrame(uint8_t* pDst, int width, int height, GUID subType) {
    int frameBytes = (subType == MEDIASUBTYPE_NV12) ? (width * height * 3 / 2) :
                     (subType == MEDIASUBTYPE_YUY2) ? (width * height * 2) : (width * height * 4);
    if (subType == MEDIASUBTYPE_NV12) {
        // Luxury dark base Y: 26, U: 132, V: 126
        int ySize = width * height;
        memset(pDst, 26, ySize);
        // Center subtle rose-tint glow in Y
        int cx = width / 2;
        int cy = height / 2;
        int rSq = (height * height) / 4;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int dx = x - cx;
                int dy = y - cy;
                int dSq = dx * dx + dy * dy;
                if (dSq < rSq) {
                    pDst[y * width + x] = (uint8_t)(26 + (rSq - dSq) * 35 / rSq);
                }
            }
        }
        for (int i = ySize; i < frameBytes; i += 2) {
            pDst[i] = 132;     // U
            pDst[i + 1] = 126; // V
        }
    } else if (subType == MEDIASUBTYPE_YUY2) {
        // YUY2 luxury dark velvet: Y=26, U=132, Y=26, V=126
        for (int i = 0; i < frameBytes; i += 4) {
            pDst[i]     = 26;
            pDst[i + 1] = 132;
            pDst[i + 2] = 26;
            pDst[i + 3] = 126;
        }
    } else {
        // RGB32 luxury dark velvet background #141211 (B=17, G=18, R=20, A=255)
        uint32_t* pPix = (uint32_t*)pDst;
        int count = width * height;
        for (int i = 0; i < count; i++) {
            pPix[i] = 0xFF141211;
        }
    }
}

static void ScaleNV12(const uint8_t* pSrc, int srcW, int srcH, uint8_t* pDst, int dstW, int dstH) {
    if (!pSrc || !pDst || srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return;

    // 1. Scale Y plane
    const uint8_t* pSrcY = pSrc;
    uint8_t* pDstY = pDst;
    for (int y = 0; y < dstH; y++) {
        int sy = (y * srcH) / dstH;
        const uint8_t* pSrcRow = pSrcY + sy * srcW;
        uint8_t* pDstRow = pDstY + y * dstW;
        for (int x = 0; x < dstW; x++) {
            int sx = (x * srcW) / dstW;
            pDstRow[x] = pSrcRow[sx];
        }
    }

    // 2. Scale UV plane (interleaved pairs)
    const uint8_t* pSrcUV = pSrc + (srcW * srcH);
    uint8_t* pDstUV = pDst + (dstW * dstH);
    int srcHalfH = srcH / 2;
    int srcHalfW = srcW / 2;
    int dstHalfH = dstH / 2;
    int dstHalfW = dstW / 2;

    for (int y = 0; y < dstHalfH; y++) {
        int sy = (y * srcHalfH) / dstHalfH;
        const uint8_t* pSrcUVRow = pSrcUV + sy * srcW;
        uint8_t* pDstUVRow = pDstUV + y * dstW;
        for (int x = 0; x < dstHalfW; x++) {
            int sx = (x * srcHalfW) / dstHalfW;
            pDstUVRow[x * 2]     = pSrcUVRow[sx * 2];
            pDstUVRow[x * 2 + 1] = pSrcUVRow[sx * 2 + 1];
        }
    }
}

static void NV12ToRGB32(const uint8_t* pSrc, int srcW, int srcH, uint8_t* pDst, int dstW, int dstH) {
    if (!pSrc || !pDst || srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return;
    const uint8_t* pSrcY = pSrc;
    const uint8_t* pSrcUV = pSrc + (srcW * srcH);
    uint32_t* pDstPix = (uint32_t*)pDst;

    for (int y = 0; y < dstH; y++) {
        int sy = (y * srcH) / dstH;
        int suv_y = sy / 2;
        const uint8_t* pYRow = pSrcY + sy * srcW;
        const uint8_t* pUVRow = pSrcUV + suv_y * srcW;
        uint32_t* pDstRow = pDstPix + y * dstW;

        for (int x = 0; x < dstW; x++) {
            int sx = (x * srcW) / dstW;
            int suv_x = (sx / 2) * 2;
            int Y = (int)pYRow[sx] - 16;
            int U = (int)pUVRow[suv_x] - 128;
            int V = (int)pUVRow[suv_x + 1] - 128;

            int R = (298 * Y + 409 * V + 128) >> 8;
            int G = (298 * Y - 100 * U - 208 * V + 128) >> 8;
            int B = (298 * Y + 516 * U + 128) >> 8;

            if (R < 0) R = 0; else if (R > 255) R = 255;
            if (G < 0) G = 0; else if (G > 255) G = 255;
            if (B < 0) B = 0; else if (B > 255) B = 255;

            pDstRow[x] = 0xFF000000 | ((uint32_t)R << 16) | ((uint32_t)G << 8) | (uint32_t)B;
        }
    }
}

static void NV12ToYUY2(const uint8_t* pSrc, int srcW, int srcH, uint8_t* pDst, int dstW, int dstH) {
    if (!pSrc || !pDst || srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return;
    const uint8_t* pSrcY = pSrc;
    const uint8_t* pSrcUV = pSrc + (srcW * srcH);

    // Fast path: 1:1 direct copy without scaling overhead (<0.4ms)
    if (srcW == dstW && srcH == dstH) {
        for (int y = 0; y < dstH; y++) {
            const uint8_t* pYRow = pSrcY + y * dstW;
            const uint8_t* pUVRow = pSrcUV + (y / 2) * dstW;
            uint8_t* pDstRow = pDst + y * (dstW * 2);
            for (int x = 0; x < dstW; x += 2) {
                pDstRow[x * 2]     = pYRow[x];
                pDstRow[x * 2 + 1] = pUVRow[x];
                pDstRow[x * 2 + 2] = pYRow[x + 1];
                pDstRow[x * 2 + 3] = pUVRow[x + 1];
            }
        }
        return;
    }

    // Scaled conversion path
    for (int y = 0; y < dstH; y++) {
        int sy = (y * srcH) / dstH;
        int suv_y = sy / 2;
        const uint8_t* pYRow = pSrcY + sy * srcW;
        const uint8_t* pUVRow = pSrcUV + suv_y * srcW;
        uint8_t* pDstRow = pDst + y * (dstW * 2);

        for (int x = 0; x < dstW; x += 2) {
            int sx0 = (x * srcW) / dstW;
            int sx1 = ((x + 1) * srcW) / dstW;
            int suv_x = (sx0 / 2) * 2;

            uint8_t y0 = pYRow[sx0];
            uint8_t y1 = (sx1 < srcW) ? pYRow[sx1] : y0;
            uint8_t u  = pUVRow[suv_x];
            uint8_t v  = pUVRow[suv_x + 1];

            int dstIdx = x * 2;
            pDstRow[dstIdx]     = y0;
            pDstRow[dstIdx + 1] = u;
            pDstRow[dstIdx + 2] = y1;
            pDstRow[dstIdx + 3] = v;
        }
    }
}

static void ScaleYUY2(const uint8_t* pSrc, int srcW, int srcH, uint8_t* pDst, int dstW, int dstH) {
    if (!pSrc || !pDst || srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return;
    int srcStride = srcW * 2;
    int dstStride = dstW * 2;

    for (int y = 0; y < dstH; y++) {
        int sy = (y * srcH) / dstH;
        const uint8_t* pSrcRow = pSrc + sy * srcStride;
        uint8_t* pDstRow = pDst + y * dstStride;

        for (int x = 0; x < dstW; x += 2) {
            int sx0 = (x * srcW) / dstW;
            int sx1 = ((x + 1) * srcW) / dstW;
            int sx0_pair = (sx0 / 2) * 4;

            pDstRow[x * 2]     = pSrcRow[sx0_pair + ((sx0 & 1) ? 2 : 0)];
            pDstRow[x * 2 + 1] = pSrcRow[sx0_pair + 1];
            pDstRow[x * 2 + 2] = pSrcRow[sx0_pair + ((sx1 & 1) ? 2 : 0)];
            pDstRow[x * 2 + 3] = pSrcRow[sx0_pair + 3];
        }
    }
}

static void YUY2ToNV12(const uint8_t* pSrc, int srcW, int srcH, uint8_t* pDst, int dstW, int dstH) {
    if (!pSrc || !pDst || srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return;
    uint8_t* pDstY = pDst;
    uint8_t* pDstUV = pDst + (dstW * dstH);
    int srcStride = srcW * 2;

    for (int y = 0; y < dstH; y++) {
        int sy = (y * srcH) / dstH;
        const uint8_t* pSrcRow = pSrc + sy * srcStride;
        uint8_t* pDstYRow = pDstY + y * dstW;
        bool isEven = (y & 1) == 0;
        uint8_t* pDstUVRow = isEven ? (pDstUV + (y / 2) * dstW) : NULL;

        for (int x = 0; x < dstW; x += 2) {
            int sx = (x * srcW) / dstW;
            int sPair = (sx / 2) * 4;

            pDstYRow[x]     = pSrcRow[sPair];
            pDstYRow[x + 1] = pSrcRow[sPair + 2];

            if (isEven && pDstUVRow) {
                pDstUVRow[x]     = pSrcRow[sPair + 1]; // U
                pDstUVRow[x + 1] = pSrcRow[sPair + 3]; // V
            }
        }
    }
}

static void YUY2ToRGB32(const uint8_t* pSrc, int srcW, int srcH, uint8_t* pDst, int dstW, int dstH) {
    if (!pSrc || !pDst || srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return;
    int srcStride = srcW * 2;
    uint32_t* pDstPix = (uint32_t*)pDst;

    for (int y = 0; y < dstH; y++) {
        int sy = (y * srcH) / dstH;
        const uint8_t* pSrcRow = pSrc + sy * srcStride;
        uint32_t* pDstRow = pDstPix + y * dstW;

        for (int x = 0; x < dstW; x += 2) {
            int sx = (x * srcW) / dstW;
            int sPair = (sx / 2) * 4;

            int Y0 = (int)pSrcRow[sPair] - 16;
            int U  = (int)pSrcRow[sPair + 1] - 128;
            int Y1 = (int)pSrcRow[sPair + 2] - 16;
            int V  = (int)pSrcRow[sPair + 3] - 128;

            int R0 = (298 * Y0 + 409 * V + 128) >> 8;
            int G0 = (298 * Y0 - 100 * U - 208 * V + 128) >> 8;
            int B0 = (298 * Y0 + 516 * U + 128) >> 8;

            int R1 = (298 * Y1 + 409 * V + 128) >> 8;
            int G1 = (298 * Y1 - 100 * U - 208 * V + 128) >> 8;
            int B1 = (298 * Y1 + 516 * U + 128) >> 8;

            if (R0 < 0) R0 = 0; else if (R0 > 255) R0 = 255;
            if (G0 < 0) G0 = 0; else if (G0 > 255) G0 = 255;
            if (B0 < 0) B0 = 0; else if (B0 > 255) B0 = 255;

            if (R1 < 0) R1 = 0; else if (R1 > 255) R1 = 255;
            if (G1 < 0) G1 = 0; else if (G1 > 255) G1 = 255;
            if (B1 < 0) B1 = 0; else if (B1 > 255) B1 = 255;

            pDstRow[x]     = 0xFF000000 | ((uint32_t)R0 << 16) | ((uint32_t)G0 << 8) | (uint32_t)B0;
            pDstRow[x + 1] = 0xFF000000 | ((uint32_t)R1 << 16) | ((uint32_t)G1 << 8) | (uint32_t)B1;
        }
    }
}

void HeartWaveFilter::DoStream() {
    IMemAllocator* pAlloc = m_pPin->GetAllocator();
    IMemInputPin* pInputPin = m_pPin->GetMemInputPin();
    if (!pAlloc || !pInputPin) return;

    int width = m_pPin->GetWidth();
    int height = m_pPin->GetHeight();
    REFERENCE_TIME interval = m_pPin->GetInterval();
    if (interval <= 0) interval = 333333; // 30 FPS default
    GUID subType = m_pPin->GetSubType();
    int frameSize = (subType == MEDIASUBTYPE_NV12) ? (width * height * 3 / 2) :
                    (subType == MEDIASUBTYPE_YUY2) ? (width * height * 2) : (width * height * 4);

    LARGE_INTEGER qpcFreq;
    QueryPerformanceFrequency(&qpcFreq);
    LONGLONG qpcInterval = (LONGLONG)((double)interval * (double)qpcFreq.QuadPart / 10000000.0);
    if (qpcInterval <= 0) qpcInterval = qpcFreq.QuadPart / 30;

    LARGE_INTEGER qpcTarget;
    QueryPerformanceCounter(&qpcTarget);
    qpcTarget.QuadPart += qpcInterval;

    while (m_bStreaming) {
        // Ensure new frame event is opened
        if (!m_hNewFrameEvent) {
            m_hNewFrameEvent = OpenEventW(SYNCHRONIZE, FALSE, HEARTWAVE_EVENT_NAME);
        }

        // Calculate time remaining until next frame presentation deadline
        LARGE_INTEGER qpcNow;
        QueryPerformanceCounter(&qpcNow);
        LONGLONG diffTicks = qpcTarget.QuadPart - qpcNow.QuadPart;

        DWORD waitTime = 1;
        if (diffTicks > 0) {
            waitTime = (DWORD)((diffTicks * 1000) / qpcFreq.QuadPart);
            if (waitTime > 50) waitTime = 50;
        } else {
            waitTime = 0;
        }

        HANDLE waitHandles[2] = { m_hStopEvent, m_hNewFrameEvent };
        DWORD handleCount = m_hNewFrameEvent ? 2 : 1;

        if (waitTime > 0) {
            DWORD waitRes = WaitForMultipleObjects(handleCount, waitHandles, FALSE, waitTime);
            if (waitRes == WAIT_OBJECT_0) {
                break; // Stop event signaled
            }
        } else {
            if (WaitForSingleObject(m_hStopEvent, 0) == WAIT_OBJECT_0) {
                break;
            }
        }

        if (!m_bStreaming) break;

        // Schedule next presentation tick strictly monotonically
        qpcTarget.QuadPart += qpcInterval;
        QueryPerformanceCounter(&qpcNow);
        if (qpcNow.QuadPart - qpcTarget.QuadPart > qpcInterval * 2) {
            qpcTarget.QuadPart = qpcNow.QuadPart + qpcInterval;
        }

        // Try open or read MMF
        if (!m_hMMF) {
            m_hMMF = OpenFileMappingW(FILE_MAP_ALL_ACCESS, FALSE, HEARTWAVE_MMF_NAME);
            if (!m_hMMF) {
                m_hMMF = OpenFileMappingW(FILE_MAP_READ, FALSE, HEARTWAVE_MMF_NAME);
            }
            if (m_hMMF) {
                m_pSharedHeader = (HeartWaveSharedHeader*)MapViewOfFile(m_hMMF, FILE_MAP_ALL_ACCESS, 0, 0, 0);
                if (!m_pSharedHeader) {
                    m_pSharedHeader = (HeartWaveSharedHeader*)MapViewOfFile(m_hMMF, FILE_MAP_READ, 0, 0, 0);
                }
                if (m_pSharedHeader) {
                    m_pSharedData = ((uint8_t*)m_pSharedHeader) + sizeof(HeartWaveSharedHeader);
                    m_pSharedHeader->consumerActive = 1;
                    m_pSharedHeader->requestedFormat = (subType == MEDIASUBTYPE_YUY2) ? 2 :
                                                       (subType == MEDIASUBTYPE_NV12) ? 0 : 1;
                    m_pSharedHeader->consumerWidth = (uint16_t)width;
                    m_pSharedHeader->consumerHeight = (uint16_t)height;
                }
            }
        }

        IMediaSample* pSample = NULL;
        HRESULT hr = pAlloc->GetBuffer(&pSample, NULL, NULL, 0);
        if (SUCCEEDED(hr) && pSample) {
            BYTE* pData = NULL;
            pSample->GetPointer(&pData);
            if (pData) {
                bool hasFrame = false;

                if (m_pSharedHeader && m_pSharedHeader->magic == HW_MAGIC) {
                    if (m_pSharedHeader->isPrivacyMuted == 1) {
                        RenderDefaultFrame(pData, width, height, subType);
                        hasFrame = true;
                    } else if (m_pSharedData && m_pSharedHeader->frameSize > 0) {
                        uint32_t slot = 0;
                        uint32_t stride = m_pSharedHeader->slotStride;
                        if (m_pSharedHeader->numSlots > 1 && stride > 0) {
                            slot = m_pSharedHeader->latestSlotIndex % m_pSharedHeader->numSlots;
                        }
                        const uint8_t* pSlot = m_pSharedData + (slot * stride);
                        int srcW = (int)m_pSharedHeader->width;
                        int srcH = (int)m_pSharedHeader->height;
                        uint32_t srcFmt = m_pSharedHeader->format;

                        if (srcW > 0 && srcH > 0) {
                            if (subType == MEDIASUBTYPE_YUY2) {
                                if (srcFmt == 2) {
                                    // Direct zero-copy fast path for Discord/WebRTC:
                                    // Format matches 1:1, direct memcpy with zero CPU conversion latency (<0.08ms)!
                                    if (srcW == width && srcH == height) {
                                        memcpy(pData, pSlot, width * height * 2);
                                    } else {
                                        ScaleYUY2(pSlot, srcW, srcH, pData, width, height);
                                    }
                                } else if (srcFmt == 0) {
                                    NV12ToYUY2(pSlot, srcW, srcH, pData, width, height);
                                }
                                hasFrame = true;
                            } else if (subType == MEDIASUBTYPE_NV12) {
                                if (srcFmt == 0) {
                                    // Direct zero-copy fast path for OBS NV12
                                    if (srcW == width && srcH == height) {
                                        memcpy(pData, pSlot, width * height * 3 / 2);
                                    } else {
                                        ScaleNV12(pSlot, srcW, srcH, pData, width, height);
                                    }
                                } else if (srcFmt == 2) {
                                    YUY2ToNV12(pSlot, srcW, srcH, pData, width, height);
                                }
                                hasFrame = true;
                            } else if (subType == MEDIASUBTYPE_RGB32) {
                                if (srcFmt == 0) {
                                    NV12ToRGB32(pSlot, srcW, srcH, pData, width, height);
                                } else if (srcFmt == 2) {
                                    YUY2ToRGB32(pSlot, srcW, srcH, pData, width, height);
                                }
                                hasFrame = true;
                            }
                        }
                    }
                }
                if (!hasFrame) {
                    RenderDefaultFrame(pData, width, height, subType);
                }

                // Reference-clock aligned timestamps matching Discord's WebRTC capture clock
                if (m_pClock) {
                    REFERENCE_TIME rtNow = 0;
                    if (SUCCEEDED(m_pClock->GetTime(&rtNow))) {
                        REFERENCE_TIME rtStart = rtNow;
                        REFERENCE_TIME rtEnd = rtNow + interval;
                        pSample->SetTime(&rtStart, &rtEnd);
                    } else {
                        pSample->SetTime(NULL, NULL);
                    }
                } else {
                    pSample->SetTime(NULL, NULL);
                }

                pSample->SetMediaTime(NULL, NULL);
                pSample->SetSyncPoint(TRUE);
                pSample->SetPreroll(FALSE);
                pSample->SetDiscontinuity(FALSE);
                pSample->SetActualDataLength(frameSize);

                pInputPin->Receive(pSample);
            }
            pSample->Release();
        }
    }

    if (m_pSharedHeader) {
        m_pSharedHeader->consumerActive = 0;
    }
}

// =========================================================================
// Class Factory & COM Exports
// =========================================================================

class HeartWaveClassFactory : public IClassFactory {
private:
    volatile LONG m_cRef;
public:
    HeartWaveClassFactory() : m_cRef(1) {}
    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) {
        if (!ppv) return E_POINTER;
        if (riid == IID_IUnknown || riid == IID_IClassFactory) {
            *ppv = this;
            AddRef();
            return S_OK;
        }
        *ppv = NULL;
        return E_NOINTERFACE;
    }
    STDMETHODIMP_(ULONG) AddRef() { return InterlockedIncrement(&m_cRef); }
    STDMETHODIMP_(ULONG) Release() {
        LONG c = InterlockedDecrement(&m_cRef);
        if (c == 0) delete this;
        return c;
    }
    STDMETHODIMP CreateInstance(IUnknown* pUnkOuter, REFIID riid, void** ppv) {
        if (pUnkOuter) return CLASS_E_NOAGGREGATION;
        HeartWaveFilter* pFilter = new HeartWaveFilter();
        return pFilter->QueryInterface(riid, ppv);
    }
    STDMETHODIMP LockServer(BOOL fLock) {
        if (fLock) InterlockedIncrement(&g_cServerLocks);
        else InterlockedDecrement(&g_cServerLocks);
        return S_OK;
    }
};

STDAPI DllGetClassObject(REFCLSID rclsid, REFIID riid, void** ppv) {
    if (!ppv) return E_POINTER;
    *ppv = NULL;
    if (rclsid == CLSID_HeartWaveVirtualCam) {
        HeartWaveClassFactory* pFactory = new HeartWaveClassFactory();
        return pFactory->QueryInterface(riid, ppv);
    }
    return CLASS_E_CLASSNOTAVAILABLE;
}

STDAPI DllCanUnloadNow() {
    return (g_cServerLocks == 0) ? S_OK : S_FALSE;
}

STDAPI DllRegisterServer() {
    WCHAR szModule[MAX_PATH];
    GetModuleFileNameW(g_hModule, szModule, MAX_PATH);

    // 1. Register CLSID in HKCU\Software\Classes\CLSID\{A7B39E10-6C23-41D8-9274-1290EF927B50}
    HKEY hKey = NULL;
    WCHAR szClsidKey[256];
    StringCbPrintfW(szClsidKey, sizeof(szClsidKey), L"Software\\Classes\\CLSID\\{A7B39E10-6C23-41D8-9274-1290EF927B50}");
    if (RegCreateKeyExW(HKEY_CURRENT_USER, szClsidKey, 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)HEARTWAVE_DEVICE_NAME, (wcslen(HEARTWAVE_DEVICE_NAME) + 1) * sizeof(WCHAR));

        HKEY hInproc = NULL;
        if (RegCreateKeyExW(hKey, L"InprocServer32", 0, NULL, 0, KEY_WRITE, NULL, &hInproc, NULL) == ERROR_SUCCESS) {
            RegSetValueExW(hInproc, NULL, 0, REG_SZ, (const BYTE*)szModule, (wcslen(szModule) + 1) * sizeof(WCHAR));
            const WCHAR* szModel = L"Both";
            RegSetValueExW(hInproc, L"ThreadingModel", 0, REG_SZ, (const BYTE*)szModel, (wcslen(szModel) + 1) * sizeof(WCHAR));
            RegCloseKey(hInproc);
        }
        RegCloseKey(hKey);
    }

    // 2. Register DirectShow Video Capture Device Category in HKCU
    WCHAR szCategoryKey[512];
    StringCbPrintfW(szCategoryKey, sizeof(szCategoryKey),
        L"Software\\Classes\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{A7B39E10-6C23-41D8-9274-1290EF927B50}");
    if (RegCreateKeyExW(HKEY_CURRENT_USER, szCategoryKey, 0, NULL, 0, KEY_WRITE, NULL, &hKey, NULL) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, L"FriendlyName", 0, REG_SZ, (const BYTE*)HEARTWAVE_DEVICE_NAME, (wcslen(HEARTWAVE_DEVICE_NAME) + 1) * sizeof(WCHAR));
        const WCHAR* szClsidStr = L"{A7B39E10-6C23-41D8-9274-1290EF927B50}";
        RegSetValueExW(hKey, L"CLSID", 0, REG_SZ, (const BYTE*)szClsidStr, (wcslen(szClsidStr) + 1) * sizeof(WCHAR));

        // Binary FilterData: standard DirectShow filter merit & pin registration (YUY2 format)
        BYTE filterData[] = {
            0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x30, 0x70, 0x69, 0x33, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x74, 0x79, 0x33, 0x00, 0x00, 0x00, 0x00,
            0x38, 0x00, 0x00, 0x00, 0x48, 0x00, 0x00, 0x00, 0x76, 0x69, 0x64, 0x73, 0x00, 0x00, 0x10, 0x00,
            0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71, 0x59, 0x55, 0x59, 0x32, 0x00, 0x00, 0x10, 0x00,
            0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71
        };
        RegSetValueExW(hKey, L"FilterData", 0, REG_BINARY, filterData, sizeof(filterData));
        RegCloseKey(hKey);
    }

    return S_OK;
}

STDAPI DllUnregisterServer() {
    WCHAR szClsidKey[256];
    StringCbPrintfW(szClsidKey, sizeof(szClsidKey), L"Software\\Classes\\CLSID\\{A7B39E10-6C23-41D8-9274-1290EF927B50}");
    RegDeleteTreeW(HKEY_CURRENT_USER, szClsidKey);

    WCHAR szCategoryKey[512];
    StringCbPrintfW(szCategoryKey, sizeof(szCategoryKey),
        L"Software\\Classes\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{A7B39E10-6C23-41D8-9274-1290EF927B50}");
    RegDeleteTreeW(HKEY_CURRENT_USER, szCategoryKey);

    return S_OK;
}

STDAPI DllInstall(BOOL bInstall, LPCWSTR) {
    return bInstall ? DllRegisterServer() : DllUnregisterServer();
}

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID) {
    if (fdwReason == DLL_PROCESS_ATTACH) {
        g_hModule = hinstDLL;
        DisableThreadLibraryCalls(hinstDLL);
    }
    return TRUE;
}
