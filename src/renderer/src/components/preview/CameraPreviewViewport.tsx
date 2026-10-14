import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  FlipHorizontal,
  Layers,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  VideoOff,
  Hand,
  Sparkles,
  Radio,
  Users,
  Heart,
  Star,
  Smartphone,
  SwitchCamera,
  Zap,
  ZoomIn,
  Sliders,
  PanelRightClose,
  PanelRightOpen,
  Focus,
  Upload,
  X,
} from 'lucide-react';
import { useAppStore, RESOLUTION_PRESETS } from '../../store/appStore';
import { cameraManager } from '../../services/cameraManager';
import { handTracker } from '../../tracking/handTracker';
import { backgroundSegmenter } from '../../tracking/backgroundSegmenter';
import { BACKDROP_PRESETS, GREENSCREEN_PRESETS } from '../../data/initialBackdrops';
import { DiagnosticsRenderer } from '../../tracking/diagnosticsRenderer';
import { effectManager } from '../../effects/effectManager';
import { videoCompositor } from '../../services/videoCompositor';
import { VirtualOutputBar } from '../output/VirtualOutputBar';
import { AudioKeepAlive } from '../../services/audioKeepAlive';
import { soundEngine } from '../../services/soundEngine';
import { HomeStudioDeck } from '../home/HomeStudioDeck';
import logoIcon from '../../assets/logo-icon.png';

export const CameraPreviewViewport: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagnosticsRendererRef = useRef<DiagnosticsRenderer>(new DiagnosticsRenderer());
  const rafIdRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoopRunningRef = useRef<boolean>(false);
  const lastRenderTimeRef = useRef<number>(0);
  const lastMetricsTimeRef = useRef<number>(0);
  const lastTrackingTimeRef = useRef<number>(0);
  const lastGestureResultRef = useRef<any>(null);
  const lastReportedGestureRef = useRef<string | null>(null);
  const audioKeepAliveRef = useRef<AudioKeepAlive | null>(null);
  const framesSentCountRef = useRef<number>(0);
  const lastTelemetryLogRef = useRef<number>(0);

  const [isTrackerWarming, setIsTrackerWarming] = useState(false);

  const {
    cameraStatus,
    availableDevices,
    selectedDeviceId,
    selectedResolution,
    activeStream,
    cameraMetrics,
    cameraError,
    isMirrored,
    fetchDevices,
    startCamera,
    stopCamera,
    selectDevice,
    selectResolution,
    toggleMirror,
    clearCameraError,
    virtualCameraStatus,
    toggleVirtualCamera,
    isTrackingActive,
    toggleTracking,
    activeGestureEvent,
    setActiveGestureEvent,
    showSkeletonDiagnostics,
    setShowSkeletonDiagnostics,
    gestureHoldDuration,
    selectedEffectId,
    isPrivacyShutterActive,
    setCompositorMetrics,
    activeNav,
    virtualOutputStatus,
    isMobileConnected,
    mobileDeviceName,
    setIsMobileCamModalOpen,
    mobileZoom,
    mobileTorch,
    mobileLens,
    mobileMaxZoom,
    mobileMinZoom,
    setMobileZoom,
    toggleMobileTorch,
    switchMobileLens,
    isRightPanelCollapsed,
    toggleRightPanel,
    backgroundMode,
    bokehIntensity,
    selectedBackdropId,
    customBackdropUrl,
    greenscreenColor,
    edgeFeather,
    temporalSmoothing,
    setBackgroundMode,
    setBokehIntensity,
    setSelectedBackdropId,
    setCustomBackdropUrl,
    setGreenscreenColor,
    toggleDSLRBlur,
  } = useAppStore();

  // Initialize hardware enumeration and device change listeners
  useEffect(() => {
    fetchDevices();

    const cleanupDeviceListener = cameraManager.onDeviceChange(() => {
      fetchDevices();
    });

    cameraManager.setOnDisconnect(() => {
      stopCamera();
    });

    return () => {
      cleanupDeviceListener();
      cameraManager.setOnDisconnect(null);
    };
  }, [fetchDevices, stopCamera]);

  // Bind active media stream to the HTMLVideoElement
  useEffect(() => {
    if (videoRef.current) {
      if (activeStream) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.defaultMuted = true;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().catch((err) => {
          console.warn('Auto-play was interrupted:', err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [activeStream]);

  // Sync hold duration with tracker state machine
  useEffect(() => {
    handTracker.setHoldDuration(gestureHoldDuration);
  }, [gestureHoldDuration]);

  // Pre-initialize MediaPipe Hand Tracker
  useEffect(() => {
    setIsTrackerWarming(true);
    handTracker
      .initialize()
      .then(() => setIsTrackerWarming(false))
      .catch((err) => {
        console.warn('MediaPipe initialization warning:', err);
        setIsTrackerWarming(false);
      });

    return () => {
      handTracker.close();
    };
  }, []);

  // Pre-initialize MediaPipe Background Segmenter with GPU acceleration
  useEffect(() => {
    backgroundSegmenter.initialize().catch((err) => {
      console.warn('[BackgroundSegmenter] Initialization warning:', err);
    });

    return () => {
      backgroundSegmenter.close();
    };
  }, []);

  // Sync temporal smoothing & feathering with background segmenter
  useEffect(() => {
    backgroundSegmenter.setTemporalSmoothing(temporalSmoothing);
  }, [temporalSmoothing]);

  useEffect(() => {
    backgroundSegmenter.setEdgeFeather(edgeFeather);
  }, [edgeFeather]);

  // Global hotkey Ctrl+Shift+K to toggle AI DSLR Blur on the fly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
        e.preventDefault();
        toggleDSLRBlur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDSLRBlur]);

  // Custom Backdrop Upload Handler
  const handleCustomBackdropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomBackdropUrl(result);
        setSelectedBackdropId('custom');
        setBackgroundMode('backdrop');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sync active effect with selectedEffectId
  useEffect(() => {
    effectManager.setActiveEffect(selectedEffectId);
  }, [selectedEffectId]);

  // Initialize background keep-alive audio session
  useEffect(() => {
    audioKeepAliveRef.current = new AudioKeepAlive();

    return () => {
      audioKeepAliveRef.current?.stop();
      audioKeepAliveRef.current = null;
    };
  }, []);

  // Core unified frame renderer: processes tracking, renders procedural effects, composites and broadcasts
  const renderFrame = useCallback((now: number) => {
    try {
      const store = useAppStore.getState();
      const liveCameraStatus = store.cameraStatus;
      const liveVcamStatus = store.virtualOutputStatus;
      const liveTrackingActive = store.isTrackingActive;
      const liveBypassActive = store.isBypassActive;
      const livePrivacyActive = store.isPrivacyShutterActive;
      const liveMirrored = store.isMirrored;
      const liveDiagnostics = store.showSkeletonDiagnostics;
      const liveIntensity = store.activeIntensity;
      const liveResolution = store.selectedResolution;
      const liveBackgroundMode = store.backgroundMode;
      const liveBokehIntensity = store.bokehIntensity;
      const liveSelectedBackdropId = store.selectedBackdropId;
      const liveCustomBackdropUrl = store.customBackdropUrl;
      const liveGreenscreenColor = store.greenscreenColor;

      const video = videoRef.current;
      const hasValidFrame = livePrivacyActive || (video && video.readyState >= 2 && video.videoWidth > 0);

      if (liveCameraStatus === 'active' && hasValidFrame) {
        // 1. Gesture Tracking (only when tracking active, not in bypass mode, and privacy shutter is off)
        let gestureResult = null;
        if (liveTrackingActive && !liveBypassActive && !livePrivacyActive && video && video.readyState >= 2) {
          if (now - lastTrackingTimeRef.current >= 30) {
            lastTrackingTimeRef.current = now;
            try {
              lastGestureResultRef.current = handTracker.processVideoFrame(video, now);
            } catch (trackErr) {
              console.warn('[HandTracker] Frame tracking glitch:', trackErr);
            }
          }
          gestureResult = lastGestureResultRef.current;
        } else {
          lastGestureResultRef.current = null;
        }

        // Only update activeGestureEvent in store when gesture identity changes to prevent React re-render thrashing
        const curGestureName = gestureResult?.gestureEvent?.name || null;
        if (lastReportedGestureRef.current !== curGestureName) {
          lastReportedGestureRef.current = curGestureName;
          setActiveGestureEvent(gestureResult ? gestureResult.gestureEvent : null);
          if (curGestureName && gestureResult?.gestureEvent) {
            soundEngine.playForEffect(gestureResult.gestureEvent.type || curGestureName);
          }
        }

        if (gestureResult) {
          effectManager.handleGestureEvent(gestureResult.gestureEvent);

          if (liveDiagnostics && canvasRef.current && video) {
            const canvas = canvasRef.current;
            const targetW = video.videoWidth || liveResolution?.width || 1280;
            const targetH = video.videoHeight || liveResolution?.height || 720;
            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
            }
            const ctx = canvas.getContext('2d');
            if (ctx) {
              diagnosticsRendererRef.current.render(
                ctx,
                canvas.width,
                canvas.height,
                gestureResult.smoothedHands,
                gestureResult.gestureEvent,
                liveMirrored
              );
            }
          } else if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        } else {
          effectManager.handleGestureEvent(null);
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }

        // 2. Render romantic effects overlay (skip if in Bypass mode or Privacy mode)
        if (effectsCanvasRef.current && !liveBypassActive && !livePrivacyActive) {
          const effectsCanvas = effectsCanvasRef.current;
          const targetW = (video && video.videoWidth) || liveResolution?.width || 1280;
          const targetH = (video && video.videoHeight) || liveResolution?.height || 720;
          if (effectsCanvas.width !== targetW || effectsCanvas.height !== targetH) {
            effectsCanvas.width = targetW;
            effectsCanvas.height = targetH;
          }

          const eCtx = effectsCanvas.getContext('2d');
          if (eCtx) {
            effectManager.update(liveIntensity, gestureResult?.gestureEvent?.anchor, now);
            effectManager.render(eCtx, effectsCanvas.width, effectsCanvas.height, liveMirrored);
          }
        } else if (effectsCanvasRef.current) {
          const eCtx = effectsCanvasRef.current.getContext('2d');
          if (eCtx) eCtx.clearRect(0, 0, effectsCanvasRef.current.width, effectsCanvasRef.current.height);
        }

        // Keep physical video playing
        if (video && video.paused && liveCameraStatus === 'active') {
          video.play().catch(() => {});
        }

        // 3. AI Background Segmentation (only when DSLR Blur, Backdrop, or Green Screen is active)
        let maskCanvas: HTMLCanvasElement | null = null;
        if (liveBackgroundMode !== 'off' && !livePrivacyActive && video && video.readyState >= 2) {
          try {
            maskCanvas = backgroundSegmenter.segmentVideoFrame(video, now);
          } catch (segErr) {
            console.warn('[BackgroundSegmenter] Segmentation error:', segErr);
          }
        }

        // 4. Composite physical video + optics + effect overlay and stream to Virtual Camera
        const frameW = (video && video.videoWidth) || liveResolution?.width || 1280;
        const frameH = (video && video.videoHeight) || liveResolution?.height || 720;

        videoCompositor.setResolution(frameW, frameH);
        const compMetrics = videoCompositor.compositeFrame(
          video || videoCompositor.getCanvas(),
          effectsCanvasRef.current,
          liveMirrored,
          liveBypassActive,
          livePrivacyActive,
          liveBackgroundMode,
          liveBokehIntensity,
          maskCanvas,
          liveSelectedBackdropId,
          liveCustomBackdropUrl,
          liveGreenscreenColor
        );

        // Blit to output canvas for on-screen viewport preview when background optics is active
        if (outputCanvasRef.current && liveBackgroundMode !== 'off' && !livePrivacyActive) {
          const outCanvas = outputCanvasRef.current;
          if (outCanvas.width !== frameW || outCanvas.height !== frameH) {
            outCanvas.width = frameW;
            outCanvas.height = frameH;
          }
          const outCtx = outCanvas.getContext('2d');
          if (outCtx) {
            outCtx.drawImage(videoCompositor.getCanvas(), 0, 0);
          }
        }

        if (now - lastMetricsTimeRef.current >= 600) {
          lastMetricsTimeRef.current = now;
          setCompositorMetrics(compMetrics);
        }

        if (liveVcamStatus === 'broadcasting') {
          const frame = videoCompositor.extractFrameBuffer();
          if (frame && window.heartwaveApi?.sendFrame) {
            window.heartwaveApi.sendFrame(frame.data.buffer, frame.width, frame.height);
            framesSentCountRef.current++;
          }
        }

        if (now - lastTelemetryLogRef.current >= 1000) {
          console.log(`[Renderer Telemetry] Sent: ${framesSentCountRef.current} fps, Hidden: ${document.hidden}, Camera: ${liveCameraStatus}, Vcam: ${liveVcamStatus}, VideoReady: ${video?.readyState}`);
          framesSentCountRef.current = 0;
          lastTelemetryLogRef.current = now;
        }
      }
    } catch (err) {
      console.warn('[RenderLoop] Frame render error:', err);
    }
  }, [setActiveGestureEvent, setCompositorMetrics]);

  // Keep renderFrameRef updated
  const renderFrameRef = useRef(renderFrame);
  useEffect(() => {
    renderFrameRef.current = renderFrame;
  });

  // Master dual-clock loop: requestAnimationFrame continuously + 16ms fallback watchdog
  // Fully unthrottled and immune to window minimization, occlusion, or background state
  useEffect(() => {
    if (cameraStatus === 'active') {
      isLoopRunningRef.current = true;
      audioKeepAliveRef.current?.start();

      const fps = selectedResolution?.fps || 30;
      const targetInterval = 1000 / fps;

      const onRaf = () => {
        if (!isLoopRunningRef.current) return;
        const now = performance.now();
        if (now - lastRenderTimeRef.current >= targetInterval - 3) {
          lastRenderTimeRef.current = now;
          renderFrameRef.current(now);
        }
        rafIdRef.current = requestAnimationFrame(onRaf);
      };
      rafIdRef.current = requestAnimationFrame(onRaf);

      // Resilient watchdog ticker: if RAF is delayed or skipped by OS DWM when minimized, this ticker fires
      fallbackIntervalRef.current = setInterval(() => {
        if (!isLoopRunningRef.current) return;
        const now = performance.now();
        if (now - lastRenderTimeRef.current >= targetInterval - 3) {
          lastRenderTimeRef.current = now;
          renderFrameRef.current(now);
        }
      }, 16);
    } else {
      isLoopRunningRef.current = false;
      audioKeepAliveRef.current?.stop();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      setActiveGestureEvent(null);
      effectManager.resetAll();
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      if (effectsCanvasRef.current) {
        const eCtx = effectsCanvasRef.current.getContext('2d');
        if (eCtx) eCtx.clearRect(0, 0, effectsCanvasRef.current.width, effectsCanvasRef.current.height);
      }
    }

    return () => {
      isLoopRunningRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [cameraStatus, selectedResolution?.fps]);

  const handleToggleCamera = () => {
    if (cameraStatus === 'active') {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const selectedDevice = availableDevices.find((d) => d.id === selectedDeviceId);

  return (
    <section
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--hw-bg-primary)',
        padding: '16px 20px',
        overflowY: 'auto',
        overflowX: 'hidden',
        minWidth: '500px',
      }}
    >
      {/* Top Preview Header: Title & Device Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--hw-text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {activeNav === 'home' ? 'Studio Command Center' : 'Camera Preview'}
          </h2>

          {/* Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: 'var(--hw-radius-full)',
              backgroundColor:
                cameraStatus === 'active'
                  ? 'rgba(78, 170, 121, 0.15)'
                  : cameraStatus === 'error'
                  ? 'rgba(208, 93, 93, 0.15)'
                  : 'var(--hw-surface-elevated)',
              border: `1px solid ${
                cameraStatus === 'active'
                  ? 'rgba(78, 170, 121, 0.4)'
                  : cameraStatus === 'error'
                  ? 'rgba(208, 93, 93, 0.4)'
                  : 'var(--hw-border-subtle)'
              }`,
              fontSize: '11px',
              color:
                cameraStatus === 'active'
                  ? 'var(--hw-status-active)'
                  : cameraStatus === 'error'
                  ? 'var(--hw-status-error)'
                  : 'var(--hw-text-muted)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor:
                  cameraStatus === 'active'
                    ? 'var(--hw-status-active)'
                    : cameraStatus === 'error'
                    ? 'var(--hw-status-error)'
                    : 'var(--hw-status-idle)',
              }}
            />
            {cameraStatus === 'active'
              ? 'Live Webcam Active'
              : cameraStatus === 'connecting'
              ? 'Connecting...'
              : cameraStatus === 'error'
              ? 'Hardware Notice'
              : 'Standby Mode'}
          </div>

          {/* Hand Tracking Engine Status Badge */}
          {cameraStatus === 'active' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: 'var(--hw-radius-full)',
                backgroundColor: isTrackingActive ? 'rgba(214, 189, 145, 0.12)' : 'var(--hw-surface-elevated)',
                border: `1px solid ${isTrackingActive ? 'rgba(214, 189, 145, 0.35)' : 'var(--hw-border-subtle)'}`,
                fontSize: '10px',
                color: isTrackingActive ? 'var(--hw-accent-champagne)' : 'var(--hw-text-muted)',
              }}
            >
              <Hand size={11} strokeWidth={2} />
              {isTrackerWarming ? 'Loading Model...' : isTrackingActive ? 'MediaPipe Tracking On' : 'Tracking Off'}
            </div>
          )}

          {/* Active Mode Studio Chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: 'var(--hw-radius-full)',
              backgroundColor: 'var(--hw-surface-elevated)',
              border: '1px solid var(--hw-border-subtle)',
              fontSize: '10px',
              color: 'var(--hw-text-secondary)',
            }}
          >
            {activeNav === 'couples' && (
              <>
                <Users size={11} color="var(--hw-accent-rose)" />
                <span style={{ color: 'var(--hw-accent-rose)', fontWeight: 600 }}>Couples Mode</span>
              </>
            )}
            {activeNav === 'romantic' && (
              <>
                <Heart size={11} color="var(--hw-accent-champagne)" />
                <span style={{ color: 'var(--hw-accent-champagne)', fontWeight: 600 }}>Romantic FX</span>
              </>
            )}
            {activeNav === 'streamer' && (
              <>
                <Radio size={11} color={virtualOutputStatus === 'broadcasting' ? '#34c759' : 'var(--hw-accent-rose)'} />
                <span style={{ color: virtualOutputStatus === 'broadcasting' ? '#34c759' : 'var(--hw-accent-rose)', fontWeight: 600 }}>
                  {virtualOutputStatus === 'broadcasting' ? 'On-Air Stream' : 'Broadcast Hub'}
                </span>
              </>
            )}
            {activeNav === 'favorites' && (
              <>
                <Star size={11} color="#e5a83b" />
                <span style={{ color: '#e5a83b', fontWeight: 600 }}>Favorites</span>
              </>
            )}
            {(!activeNav || activeNav === 'home') && (
              <>
                <Sparkles size={11} color="var(--hw-accent-primary)" />
                <span>Home Studio</span>
              </>
            )}
          </div>
        </div>

        {/* Camera Device Controls & Mobile Phone Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Wireless Mobile Camera Trigger Button */}
          <button
            onClick={() => setIsMobileCamModalOpen(true)}
            title={isMobileConnected ? 'Wireless phone camera connected' : 'Use smartphone as wireless webcam via QR scan'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: isMobileConnected ? 'rgba(52, 199, 89, 0.15)' : 'var(--hw-bg-secondary)',
              border: isMobileConnected ? '1px solid #34c759' : '1px solid var(--hw-border-subtle)',
              fontSize: '11px',
              fontWeight: 600,
              color: isMobileConnected ? '#34c759' : 'var(--hw-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <Smartphone size={13} strokeWidth={2} color={isMobileConnected ? '#34c759' : 'var(--hw-accent-rose)'} />
            <span>{isMobileConnected ? (mobileDeviceName || 'Phone Connected') : 'Phone as Cam'}</span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isMobileConnected ? '#34c759' : 'var(--hw-status-idle)',
              }}
            />
          </button>

          {/* Real Device Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: 'var(--hw-bg-secondary)',
              border: '1px solid var(--hw-border-subtle)',
              fontSize: '11px',
              color: 'var(--hw-text-secondary)',
              maxWidth: '280px',
            }}
          >
            <Camera size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <select
              value={selectedDeviceId}
              onChange={(e) => selectDevice(e.target.value)}
              disabled={availableDevices.length === 0}
              style={{
                cursor: 'pointer',
                color: 'var(--hw-text-primary)',
                background: 'transparent',
                width: '100%',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {availableDevices.length > 0 ? (
                availableDevices.map((d) => (
                  <option key={d.id} value={d.id} style={{ backgroundColor: 'var(--hw-bg-secondary)', color: 'var(--hw-text-primary)' }}>
                    {d.label}
                  </option>
                ))
              ) : (
                <option value="" style={{ backgroundColor: 'var(--hw-bg-secondary)', color: 'var(--hw-text-primary)' }}>
                  No Cameras Detected
                </option>
              )}
            </select>
            <ChevronDown size={11} strokeWidth={2} style={{ color: 'var(--hw-text-muted)', flexShrink: 0 }} />
          </div>

          {/* Studio Panel Collapse / Expand Button */}
          <button
            onClick={toggleRightPanel}
            title={isRightPanelCollapsed ? 'Open Effects Studio Sidebar' : 'Collapse Effects Studio (Full Viewport)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: isRightPanelCollapsed
                ? 'var(--hw-surface-elevated)'
                : 'var(--hw-bg-secondary)',
              border: isRightPanelCollapsed
                ? '1px solid var(--hw-accent-rose)'
                : '1px solid var(--hw-border-subtle)',
              fontSize: '11px',
              fontWeight: 600,
              color: isRightPanelCollapsed ? 'var(--hw-accent-rose)' : 'var(--hw-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--hw-transition-fast)',
              boxShadow: isRightPanelCollapsed ? '0 0 10px rgba(215, 154, 166, 0.25)' : 'none',
              flexShrink: 0,
            }}
          >
            {isRightPanelCollapsed ? (
              <>
                <Sparkles size={13} color="var(--hw-accent-rose)" />
                <span>Open Studio</span>
                <PanelRightOpen size={13} />
              </>
            ) : (
              <>
                <PanelRightClose size={13} />
                <span>Hide Studio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 16:9 Aspect Ratio Viewport Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          backgroundColor: '#0A0909',
          borderRadius: 'var(--hw-radius-lg)',
          border: '1px solid var(--hw-border-subtle)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--hw-shadow-md)',
        }}
      >
        {/* Real HTML5 Video Element for Live Camera Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={true}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: cameraStatus === 'active' && backgroundMode === 'off' ? 'block' : 'none',
            transform: isMirrored ? 'scaleX(-1)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Hardware-accelerated Dual-Pass Optics Canvas (DSLR Blur / Backdrop / Green Screen) */}
        <canvas
          ref={outputCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 11,
            display: cameraStatus === 'active' && backgroundMode !== 'off' ? 'block' : 'none',
          }}
        />

        {/* Real-time Romantic Effects Canvas Overlay */}
        <canvas
          ref={effectsCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 12,
            display: cameraStatus === 'active' && backgroundMode === 'off' ? 'block' : 'none',
          }}
        />

        {/* Diagnostics Canvas Overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 15,
            display: cameraStatus === 'active' && showSkeletonDiagnostics ? 'block' : 'none',
          }}
        />

        {/* Active Mode Viewport HUD Banners */}
        {cameraStatus === 'active' && !isPrivacyShutterActive && activeNav === 'couples' && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(20, 18, 17, 0.78)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 'var(--hw-radius-full)',
              border: '1px solid rgba(232, 44, 85, 0.4)',
              fontSize: '11px',
              color: 'var(--hw-accent-rose)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
          >
            <Users size={12} />
            <span>Couples Mode: Dual-Hand Detection Active</span>
          </div>
        )}

        {cameraStatus === 'active' && !isPrivacyShutterActive && activeNav === 'streamer' && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(20, 18, 17, 0.78)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 'var(--hw-radius-full)',
              border: `1px solid ${virtualOutputStatus === 'broadcasting' ? 'rgba(52, 199, 89, 0.45)' : 'rgba(232, 44, 85, 0.4)'}`,
              fontSize: '11px',
              color: virtualOutputStatus === 'broadcasting' ? '#34c759' : 'var(--hw-accent-rose)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
          >
            <Radio size={12} />
            <span>{virtualOutputStatus === 'broadcasting' ? 'ON AIR: DirectShow Virtual Camera Broadcasting' : 'Streamer Hub: DirectShow Output Ready'}</span>
          </div>
        )}

        {/* Privacy Shutter Active Viewport Overlay */}
        {cameraStatus === 'active' && isPrivacyShutterActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--hw-bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 25,
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                border: '1px solid rgba(214, 189, 145, 0.4)',
                borderRadius: 'var(--hw-radius-md)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                backgroundColor: 'rgba(20, 18, 17, 0.85)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(103, 47, 64, 0.3)',
              }}
            >
              <img
                src={logoIcon}
                alt="Heartwave"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)', letterSpacing: '0.1em' }}>
              CAMERA MUTED
            </span>
            <span style={{ fontSize: '11px', color: 'var(--hw-accent-champagne)', marginTop: '4px' }}>
              Heartwave Privacy Shutter Active
            </span>
          </div>
        )}

        {/* Framing Reticle Corners */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            width: '18px',
            height: '18px',
            borderTop: '2px solid rgba(214, 189, 145, 0.4)',
            borderLeft: '2px solid rgba(214, 189, 145, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '18px',
            height: '18px',
            borderTop: '2px solid rgba(214, 189, 145, 0.4)',
            borderRight: '2px solid rgba(214, 189, 145, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            left: '14px',
            width: '18px',
            height: '18px',
            borderBottom: '2px solid rgba(214, 189, 145, 0.4)',
            borderLeft: '2px solid rgba(214, 189, 145, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            right: '14px',
            width: '18px',
            height: '18px',
            borderBottom: '2px solid rgba(214, 189, 145, 0.4)',
            borderRight: '2px solid rgba(214, 189, 145, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />

        {/* Top-left Viewport Badges */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 20,
          }}
        >
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--hw-radius-xs)',
              backgroundColor: 'rgba(29, 25, 24, 0.85)',
              border: '1px solid var(--hw-border-subtle)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--hw-text-secondary)',
              letterSpacing: '0.04em',
            }}
          >
            16:9
          </span>

          {cameraMetrics && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--hw-radius-xs)',
                backgroundColor: 'rgba(29, 25, 24, 0.85)',
                border: '1px solid var(--hw-border-subtle)',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--hw-status-active)',
              }}
            >
              {cameraMetrics.actualWidth}×{cameraMetrics.actualHeight} @ {cameraMetrics.actualFps}fps
            </span>
          )}

          {isMirrored && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--hw-radius-xs)',
                backgroundColor: 'rgba(103, 47, 64, 0.4)',
                border: '1px solid var(--hw-accent-burgundy)',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--hw-accent-rose)',
              }}
            >
              MIRRORED
            </span>
          )}
        </div>

        {/* Floating Mobile Camera Freedom Controls (Zoom, Flash, Lens Switch) */}
        {selectedDeviceId === 'mobile-wireless' && cameraStatus === 'active' && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 25,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--hw-radius-full)',
              backgroundColor: 'rgba(20, 18, 18, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--hw-border-subtle)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Camera Lens Switcher */}
            <button
              onClick={() => switchMobileLens()}
              title={`Switch camera lens (Current: ${mobileLens === 'environment' ? 'Rear Camera' : 'Front Selfie'})`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--hw-radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--hw-text-primary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <SwitchCamera size={13} color="var(--hw-accent-rose)" />
              <span>{mobileLens === 'environment' ? 'Rear Cam' : 'Selfie'}</span>
            </button>

            {/* Flash / Torch Toggle */}
            <button
              onClick={() => toggleMobileTorch()}
              title={mobileTorch ? 'Turn Off Phone Flash' : 'Turn On Phone Flash'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--hw-radius-full)',
                backgroundColor: mobileTorch ? 'rgba(255, 204, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: mobileTorch ? '1px solid #FFCC00' : '1px solid rgba(255, 255, 255, 0.12)',
                color: mobileTorch ? '#FFCC00' : 'var(--hw-text-primary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={13} fill={mobileTorch ? '#FFCC00' : 'none'} color={mobileTorch ? '#FFCC00' : 'currentColor'} />
              <span>Flash {mobileTorch ? 'ON' : 'OFF'}</span>
            </button>

            {/* Zoom Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
                paddingLeft: '8px',
              }}
            >
              <ZoomIn size={12} color="var(--hw-text-muted)" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--hw-accent-rose)', minWidth: '26px' }}>
                {mobileZoom.toFixed(1)}x
              </span>
              {[1, 2, 3].map((z) => (
                <button
                  key={z}
                  onClick={() => setMobileZoom(z)}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 'var(--hw-radius-xs)',
                    backgroundColor: Math.abs(mobileZoom - z) < 0.2 ? 'var(--hw-accent-rose)' : 'rgba(255, 255, 255, 0.06)',
                    color: Math.abs(mobileZoom - z) < 0.2 ? '#FFFFFF' : 'var(--hw-text-secondary)',
                    border: 'none',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {z}x
                </button>
              ))}
              <input
                type="range"
                min={mobileMinZoom || 1}
                max={mobileMaxZoom || 5}
                step={0.1}
                value={mobileZoom}
                onChange={(e) => setMobileZoom(parseFloat(e.target.value))}
                style={{
                  width: '55px',
                  height: '4px',
                  accentColor: 'var(--hw-accent-rose)',
                  cursor: 'pointer',
                }}
                title={`Zoom Slider (${mobileZoom.toFixed(1)}x)`}
              />
            </div>
          </div>
        )}

        {/* Top-right Resolution Selector Badge */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '24px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--hw-radius-sm)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-medium)',
            boxShadow: 'var(--hw-shadow-md)',
            fontSize: '11px',
            color: 'var(--hw-text-primary)',
            transition: 'all var(--hw-transition-fast)',
          }}
        >
          <Sliders size={12} strokeWidth={2.2} style={{ color: 'var(--hw-accent-primary)', flexShrink: 0 }} />
          <select
            value={selectedResolution.id}
            onChange={(e) => {
              const found = RESOLUTION_PRESETS.find((r) => r.id === e.target.value);
              if (found) selectResolution(found);
            }}
            style={{
              cursor: 'pointer',
              color: 'var(--hw-text-primary)',
              backgroundColor: 'transparent',
              fontWeight: 600,
              fontSize: '11px',
              fontFamily: 'inherit',
              paddingRight: '12px',
              appearance: 'none',
              WebkitAppearance: 'none',
              border: 'none',
              outline: 'none',
            }}
          >
            {RESOLUTION_PRESETS.map((res) => (
              <option
                key={res.id}
                value={res.id}
                style={{
                  backgroundColor: 'var(--hw-bg-secondary)',
                  color: 'var(--hw-text-primary)',
                  fontWeight: 500,
                }}
              >
                {res.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={11}
            strokeWidth={2}
            style={{
              color: 'var(--hw-text-muted)',
              flexShrink: 0,
              marginLeft: '-8px',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Active Gesture Detection Floating Feedback Pill */}
        {cameraStatus === 'active' && activeGestureEvent && activeGestureEvent.gesture !== 'none' && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: 'var(--hw-radius-full)',
              backgroundColor: 'rgba(29, 25, 24, 0.92)',
              border: `1px solid ${
                activeGestureEvent.isTriggered
                  ? 'var(--hw-accent-champagne)'
                  : activeGestureEvent.holdProgress > 0
                  ? 'var(--hw-accent-rose)'
                  : 'var(--hw-border-subtle)'
              }`,
              boxShadow: activeGestureEvent.isTriggered
                ? '0 0 20px rgba(214, 189, 145, 0.4)'
                : '0 4px 16px rgba(0, 0, 0, 0.6)',
              zIndex: 30,
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: activeGestureEvent.isTriggered
                  ? 'var(--hw-accent-champagne)'
                  : 'var(--hw-accent-burgundy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeGestureEvent.isTriggered ? 'var(--hw-bg-primary)' : 'var(--hw-accent-rose)',
              }}
            >
              {activeGestureEvent.isTriggered ? (
                <Sparkles size={12} strokeWidth={2.5} />
              ) : (
                <Hand size={12} strokeWidth={2} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: activeGestureEvent.isTriggered ? 'var(--hw-accent-champagne)' : 'var(--hw-text-primary)',
                  letterSpacing: '0.02em',
                }}
              >
                {activeGestureEvent.label}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--hw-text-muted)' }}>
                {activeGestureEvent.isTriggered
                  ? 'Gesture Activated!'
                  : `Hold progress: ${Math.round(activeGestureEvent.holdProgress * 100)}%`}
              </span>
            </div>

            {/* Progress Mini Bar */}
            <div
              style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                marginLeft: '4px',
              }}
            >
              <div
                style={{
                  width: `${activeGestureEvent.holdProgress * 100}%`,
                  height: '100%',
                  backgroundColor: activeGestureEvent.isTriggered
                    ? 'var(--hw-accent-champagne)'
                    : 'var(--hw-accent-rose)',
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          </div>
        )}

        {/* Floating Viewport Optics HUD Control Bar */}
        {cameraStatus === 'active' && !isPrivacyShutterActive && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              zIndex: 25,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: 'var(--hw-radius-md)',
              backgroundColor: 'rgba(16, 14, 14, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--hw-border-medium)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              maxWidth: '460px',
            }}
          >
            {/* Primary Mode Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  paddingRight: '6px',
                  borderRight: '1px solid var(--hw-border-subtle)',
                  marginRight: '2px',
                }}
              >
                <Focus size={13} color="var(--hw-accent-champagne)" />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--hw-text-secondary)',
                    textTransform: 'uppercase',
                  }}
                >
                  Optics
                </span>
              </div>

              {/* Off Mode */}
              <button
                onClick={() => setBackgroundMode('off')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--hw-radius-xs)',
                  backgroundColor: backgroundMode === 'off' ? 'var(--hw-surface-elevated)' : 'transparent',
                  border: backgroundMode === 'off' ? '1px solid var(--hw-border-focus)' : '1px solid transparent',
                  color: backgroundMode === 'off' ? 'var(--hw-text-primary)' : 'var(--hw-text-muted)',
                  fontSize: '11px',
                  fontWeight: backgroundMode === 'off' ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Off
              </button>

              {/* DSLR Bokeh Blur */}
              <button
                onClick={() => setBackgroundMode('blur')}
                style={{
                  padding: '3px 9px',
                  borderRadius: 'var(--hw-radius-xs)',
                  backgroundColor: backgroundMode === 'blur' ? 'var(--hw-accent-rose-soft)' : 'transparent',
                  border: backgroundMode === 'blur' ? '1px solid var(--hw-accent-rose)' : '1px solid transparent',
                  color: backgroundMode === 'blur' ? 'var(--hw-accent-rose)' : 'var(--hw-text-muted)',
                  fontSize: '11px',
                  fontWeight: backgroundMode === 'blur' ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>DSLR Blur</span>
                {backgroundMode === 'blur' && (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(232, 44, 85, 0.3)',
                      fontWeight: 700,
                    }}
                  >
                    {bokehIntensity >= 70 ? 'f/1.4' : bokehIntensity >= 40 ? 'f/2.8' : 'f/4.0'}
                  </span>
                )}
              </button>

              {/* Virtual Studio Backdrop */}
              <button
                onClick={() => setBackgroundMode('backdrop')}
                style={{
                  padding: '3px 9px',
                  borderRadius: 'var(--hw-radius-xs)',
                  backgroundColor: backgroundMode === 'backdrop' ? 'rgba(214, 189, 145, 0.15)' : 'transparent',
                  border: backgroundMode === 'backdrop' ? '1px solid var(--hw-accent-champagne)' : '1px solid transparent',
                  color: backgroundMode === 'backdrop' ? 'var(--hw-accent-champagne)' : 'var(--hw-text-muted)',
                  fontSize: '11px',
                  fontWeight: backgroundMode === 'backdrop' ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Backdrop
              </button>

              {/* Chroma Green Screen */}
              <button
                onClick={() => setBackgroundMode('greenscreen')}
                style={{
                  padding: '3px 9px',
                  borderRadius: 'var(--hw-radius-xs)',
                  backgroundColor: backgroundMode === 'greenscreen' ? 'rgba(52, 199, 89, 0.15)' : 'transparent',
                  border: backgroundMode === 'greenscreen' ? '1px solid #34c759' : '1px solid transparent',
                  color: backgroundMode === 'greenscreen' ? '#34c759' : 'var(--hw-text-muted)',
                  fontSize: '11px',
                  fontWeight: backgroundMode === 'greenscreen' ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Chroma Key
              </button>
            </div>

            {/* Mode-Specific Sub-Controls: DSLR Aperture Presets */}
            {backgroundMode === 'blur' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingTop: '4px',
                  borderTop: '1px solid var(--hw-border-subtle)',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--hw-text-muted)', fontWeight: 600 }}>Aperture:</span>
                {[
                  { label: 'f/1.4 Dreamy', val: 85 },
                  { label: 'f/2.8 Studio', val: 50 },
                  { label: 'f/4.0 Subtle', val: 25 },
                ].map((ap) => (
                  <button
                    key={ap.val}
                    onClick={() => setBokehIntensity(ap.val)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: 'var(--hw-radius-xs)',
                      backgroundColor: Math.abs(bokehIntensity - ap.val) < 12 ? 'var(--hw-accent-rose)' : 'rgba(255, 255, 255, 0.06)',
                      color: Math.abs(bokehIntensity - ap.val) < 12 ? '#FFFFFF' : 'var(--hw-text-secondary)',
                      border: 'none',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {ap.label}
                  </button>
                ))}
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={bokehIntensity}
                  onChange={(e) => setBokehIntensity(Number(e.target.value))}
                  style={{
                    width: '60px',
                    height: '4px',
                    accentColor: 'var(--hw-accent-rose)',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                  title={`Blur Depth (${bokehIntensity}%)`}
                />
              </div>
            )}

            {/* Mode-Specific Sub-Controls: Backdrop Gallery */}
            {backgroundMode === 'backdrop' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  paddingTop: '4px',
                  borderTop: '1px solid var(--hw-border-subtle)',
                  overflowX: 'auto',
                }}
              >
                {BACKDROP_PRESETS.map((bp) => (
                  <button
                    key={bp.id}
                    onClick={() => setSelectedBackdropId(bp.id)}
                    style={{
                      padding: '2px 7px',
                      borderRadius: 'var(--hw-radius-xs)',
                      backgroundColor: selectedBackdropId === bp.id ? 'var(--hw-accent-champagne)' : 'rgba(255, 255, 255, 0.06)',
                      color: selectedBackdropId === bp.id ? '#141211' : 'var(--hw-text-secondary)',
                      border: 'none',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bp.name.split(' ')[0]}
                  </button>
                ))}

                {customBackdropUrl && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 'var(--hw-radius-xs)',
                      backgroundColor: selectedBackdropId === 'custom' ? 'var(--hw-accent-rose)' : 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      border: selectedBackdropId === 'custom' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <button
                      onClick={() => setSelectedBackdropId('custom')}
                      title="Select uploaded photo backdrop"
                      style={{
                        padding: '2px 6px',
                        background: 'transparent',
                        color: selectedBackdropId === 'custom' ? '#FFFFFF' : 'var(--hw-text-secondary)',
                        border: 'none',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <img src={customBackdropUrl} alt="" style={{ width: '12px', height: '12px', borderRadius: '2px', objectFit: 'cover' }} />
                      <span>My Photo</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomBackdropUrl(null);
                        if (selectedBackdropId === 'custom') {
                          setSelectedBackdropId('penthouse');
                        }
                      }}
                      title="Remove uploaded backdrop photo"
                      style={{
                        padding: '2px 5px',
                        background: selectedBackdropId === 'custom' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: selectedBackdropId === 'custom' ? '#FFFFFF' : 'var(--hw-text-muted)',
                        border: 'none',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '2px 7px',
                    borderRadius: 'var(--hw-radius-xs)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--hw-text-secondary)',
                    border: 'none',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Upload size={10} />
                  <span>Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCustomBackdropUpload}
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {/* Mode-Specific Sub-Controls: Chroma Key Presets */}
            {backgroundMode === 'greenscreen' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingTop: '4px',
                  borderTop: '1px solid var(--hw-border-subtle)',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--hw-text-muted)', fontWeight: 600 }}>Chroma Color:</span>
                {GREENSCREEN_PRESETS.map((gp) => (
                  <button
                    key={gp.id}
                    onClick={() => setGreenscreenColor(gp.hex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: 'var(--hw-radius-xs)',
                      backgroundColor: greenscreenColor === gp.hex ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: greenscreenColor === gp.hex ? '1px solid var(--hw-border-focus)' : '1px solid transparent',
                      color: 'var(--hw-text-primary)',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: gp.hex,
                        boxShadow: `0 0 6px ${gp.hex}`,
                      }}
                    />
                    <span>{gp.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Center Overlay: Standby State */}
        {cameraStatus === 'standby' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '24px',
              maxWidth: '440px',
              zIndex: 10,
            }}
          >
            {/* Glowing Standby Device Indicator */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--hw-accent-rose-soft)',
                border: '1px solid var(--hw-border-focus)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
                boxShadow: 'var(--hw-shadow-accent)',
                color: 'var(--hw-accent-rose)',
              }}
            >
              <Camera size={26} strokeWidth={1.8} />
            </div>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--hw-text-muted)',
                lineHeight: 1.6,
                marginBottom: '20px',
              }}
            >
              {availableDevices.length > 0
                ? `Selected: ${selectedDevice?.label || 'Default Camera'}. MediaPipe Hand Tracking engine ready.`
                : 'No webcams detected yet. Connect a camera or check Windows device permissions.'}
            </p>

            <button
              onClick={handleToggleCamera}
              style={{
                padding: '9px 24px',
                borderRadius: 'var(--hw-radius-md)',
                backgroundColor: 'var(--hw-accent-primary)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--hw-shadow-accent)',
                transition: 'all var(--hw-transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hw-accent-primary-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--hw-accent-primary)')}
            >
              <Camera size={14} strokeWidth={2} />
              Start Live Camera
            </button>
          </div>
        )}

        {/* Center Overlay: Connecting State */}
        {cameraStatus === 'connecting' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '2px solid var(--hw-border-subtle)',
                borderTopColor: 'var(--hw-accent-rose)',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--hw-text-primary)' }}>
              Acquiring camera hardware stream...
            </span>
          </div>
        )}

        {/* Center Overlay: Hardware Error State */}
        {cameraStatus === 'error' && cameraError && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '28px',
              maxWidth: '460px',
              backgroundColor: 'rgba(29, 25, 24, 0.95)',
              borderRadius: 'var(--hw-radius-lg)',
              border: '1px solid rgba(208, 93, 93, 0.4)',
              zIndex: 30,
              boxShadow: 'var(--hw-shadow-lg)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(208, 93, 93, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: 'var(--hw-status-error)',
              }}
            >
              <AlertTriangle size={24} strokeWidth={1.8} />
            </div>

            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--hw-text-primary)',
                marginBottom: '6px',
              }}
            >
              {cameraError.message}
            </h4>

            <p
              style={{
                fontSize: '11px',
                color: 'var(--hw-text-muted)',
                lineHeight: 1.5,
                marginBottom: '18px',
              }}
            >
              {cameraError.recoveryHint}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleToggleCamera}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--hw-radius-sm)',
                  backgroundColor: 'var(--hw-accent-primary)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={12} strokeWidth={2} />
                Retry Connection
              </button>

              <button
                onClick={clearCameraError}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--hw-radius-sm)',
                  backgroundColor: 'var(--hw-surface-elevated)',
                  border: '1px solid var(--hw-border-subtle)',
                  color: 'var(--hw-text-secondary)',
                  fontSize: '11px',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Camera Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: 'var(--hw-bg-secondary)',
          borderRadius: 'var(--hw-radius-md)',
          border: '1px solid var(--hw-border-subtle)',
        }}
      >
        {/* Left: Mirror Video & Tracking Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleMirror}
            title="Mirror Camera Feed horizontally"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: isMirrored ? 'var(--hw-surface-elevated)' : 'transparent',
              border: `1px solid ${isMirrored ? 'var(--hw-accent-burgundy)' : 'var(--hw-border-subtle)'}`,
              color: isMirrored ? 'var(--hw-accent-rose)' : 'var(--hw-text-secondary)',
              fontSize: '11px',
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <FlipHorizontal size={13} strokeWidth={1.8} />
            Mirror Feed
          </button>

          <button
            onClick={toggleTracking}
            title="Enable or disable MediaPipe hand tracking"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: isTrackingActive ? 'var(--hw-surface-elevated)' : 'transparent',
              border: `1px solid ${isTrackingActive ? 'var(--hw-accent-champagne)' : 'var(--hw-border-subtle)'}`,
              color: isTrackingActive ? 'var(--hw-accent-champagne)' : 'var(--hw-text-muted)',
              fontSize: '11px',
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <Hand size={13} strokeWidth={1.8} />
            Tracking: {isTrackingActive ? 'On' : 'Off'}
          </button>

          <button
            onClick={() => setShowSkeletonDiagnostics(!showSkeletonDiagnostics)}
            title="Toggle landmark wireframe skeleton overlay"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: showSkeletonDiagnostics ? 'var(--hw-surface-elevated)' : 'transparent',
              border: `1px solid ${showSkeletonDiagnostics ? 'var(--hw-accent-rose)' : 'var(--hw-border-subtle)'}`,
              color: showSkeletonDiagnostics ? 'var(--hw-accent-rose)' : 'var(--hw-text-muted)',
              fontSize: '11px',
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <Sparkles size={13} strokeWidth={1.8} />
            Skeleton: {showSkeletonDiagnostics ? 'On' : 'Off'}
          </button>

          <button
            onClick={toggleDSLRBlur}
            title="Toggle AI DSLR Blur (Ctrl + Shift + K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: backgroundMode === 'blur' ? 'var(--hw-surface-elevated)' : 'transparent',
              border: `1px solid ${backgroundMode === 'blur' ? 'var(--hw-accent-rose)' : 'var(--hw-border-subtle)'}`,
              color: backgroundMode === 'blur' ? 'var(--hw-accent-rose)' : 'var(--hw-text-muted)',
              fontSize: '11px',
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <Focus size={13} strokeWidth={1.8} />
            <span>AI Blur: {backgroundMode === 'blur' ? 'On' : 'Off'}</span>
          </button>
        </div>

        {/* Center Primary Action: Start / Stop Camera */}
        <button
          onClick={handleToggleCamera}
          style={{
            padding: '7px 24px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor:
              cameraStatus === 'active'
                ? 'var(--hw-surface-elevated)'
                : 'var(--hw-accent-primary)',
            color: cameraStatus === 'active' ? 'var(--hw-text-primary)' : '#FFFFFF',
            border:
              cameraStatus === 'active'
                ? '1px solid var(--hw-border-subtle)'
                : 'none',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: cameraStatus === 'active' ? 'none' : 'var(--hw-shadow-accent)',
            transition: 'all var(--hw-transition-fast)',
          }}
        >
          {cameraStatus === 'active' ? (
            <>
              <VideoOff size={14} strokeWidth={2} />
              Stop Camera
            </>
          ) : (
            <>
              <Camera size={14} strokeWidth={2} />
              Start Camera
            </>
          )}
        </button>

        {/* Right Toggle: Virtual Camera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleVirtualCamera}
            title="Send composited feed to Windows Virtual Camera device"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor:
                virtualCameraStatus === 'offline'
                  ? 'var(--hw-surface-subtle)'
                  : 'rgba(214, 189, 145, 0.15)',
              border: `1px solid ${
                virtualCameraStatus === 'offline'
                  ? 'var(--hw-border-subtle)'
                  : 'var(--hw-accent-champagne)'
              }`,
              color:
                virtualCameraStatus === 'offline'
                  ? 'var(--hw-text-muted)'
                  : 'var(--hw-accent-champagne)',
              fontSize: '11px',
              fontWeight: 500,
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <Layers size={13} strokeWidth={1.8} />
            Virtual Camera: {virtualCameraStatus === 'offline' ? 'Off' : 'Driver Standby'}
          </button>
        </div>
      </div>

      {/* Streamer Broadcast Bar: Rendered specifically for Streamer mode */}
      {activeNav === 'streamer' && <VirtualOutputBar />}

      {/* Unique Home Studio Command Deck: Telemetry, Quick-Fire Shelf, and 4 Studio Launchpad Cards */}
      {activeNav === 'home' && <HomeStudioDeck />}
    </section>
  );
};
