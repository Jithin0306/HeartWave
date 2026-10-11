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
} from 'lucide-react';
import { useAppStore, RESOLUTION_PRESETS } from '../../store/appStore';
import { cameraManager } from '../../services/cameraManager';
import { handTracker } from '../../tracking/handTracker';
import { DiagnosticsRenderer } from '../../tracking/diagnosticsRenderer';
import { effectManager } from '../../effects/effectManager';
import { videoCompositor } from '../../services/videoCompositor';
import { VirtualOutputBar } from '../output/VirtualOutputBar';

export const CameraPreviewViewport: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
  const diagnosticsRendererRef = useRef<DiagnosticsRenderer>(new DiagnosticsRenderer());
  const rafIdRef = useRef<number | null>(null);

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
    activeIntensity,
    isPrivacyShutterActive,
    isBypassActive,
    setCompositorMetrics,
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

  // Sync active effect with selectedEffectId
  useEffect(() => {
    effectManager.setActiveEffect(selectedEffectId);
  }, [selectedEffectId]);

  // Main Hand Tracking and Romantic Effect Render Loop via requestAnimationFrame
  const runTrackingLoop = useCallback(() => {
    if (
      cameraStatus === 'active' &&
      videoRef.current &&
      videoRef.current.readyState >= 2
    ) {
      const video = videoRef.current;
      const now = performance.now();

      let gestureResult = null;
      if (isTrackingActive) {
        gestureResult = handTracker.processVideoFrame(video, now);
      }

      if (gestureResult) {
        setActiveGestureEvent(gestureResult.gestureEvent);
        effectManager.handleGestureEvent(gestureResult.gestureEvent);

        // Render diagnostics wireframe if enabled in settings
        if (showSkeletonDiagnostics && canvasRef.current) {
          const canvas = canvasRef.current;
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            diagnosticsRendererRef.current.render(
              ctx,
              canvas.width,
              canvas.height,
              gestureResult.smoothedHands,
              gestureResult.gestureEvent,
              isMirrored
            );
          }
        } else if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      } else {
        setActiveGestureEvent(null);
        effectManager.handleGestureEvent(null);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }

      // Update and render active Romantic Effects on effects canvas
      if (effectsCanvasRef.current) {
        const effectsCanvas = effectsCanvasRef.current;
        if (effectsCanvas.width !== video.videoWidth || effectsCanvas.height !== video.videoHeight) {
          effectsCanvas.width = video.videoWidth || 1280;
          effectsCanvas.height = video.videoHeight || 720;
        }

        const eCtx = effectsCanvas.getContext('2d');
        if (eCtx) {
          effectManager.update(activeIntensity, gestureResult?.gestureEvent?.anchor, now);
          effectManager.render(eCtx, effectsCanvas.width, effectsCanvas.height, isMirrored);
        }

        // Phase 5: Composite physical video + effect overlay onto offscreen compositor
        videoCompositor.setResolution(video.videoWidth || 1280, video.videoHeight || 720);
        const compMetrics = videoCompositor.compositeFrame(
          video,
          effectsCanvas,
          isMirrored,
          isBypassActive,
          isPrivacyShutterActive
        );
        setCompositorMetrics(compMetrics);
      }
    } else {
      setActiveGestureEvent(null);
    }

    if (cameraStatus === 'active') {
      rafIdRef.current = requestAnimationFrame(runTrackingLoop);
    }
  }, [
    cameraStatus,
    isTrackingActive,
    isMirrored,
    showSkeletonDiagnostics,
    activeIntensity,
    isPrivacyShutterActive,
    isBypassActive,
    setCompositorMetrics,
    setActiveGestureEvent,
  ]);

  // Start / Stop tracking RAF loop
  useEffect(() => {
    if (cameraStatus === 'active') {
      rafIdRef.current = requestAnimationFrame(runTrackingLoop);
    } else {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
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
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [cameraStatus, runTrackingLoop, setActiveGestureEvent]);

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
        overflow: 'hidden',
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
            Camera Preview
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
        </div>

        {/* Real Device Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <option key={d.id} value={d.id} style={{ background: '#1D1918' }}>
                    {d.label}
                  </option>
                ))
              ) : (
                <option value="" style={{ background: '#1D1918' }}>
                  No Cameras Detected
                </option>
              )}
            </select>
            <ChevronDown size={11} strokeWidth={2} style={{ color: 'var(--hw-text-muted)', flexShrink: 0 }} />
          </div>
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
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: cameraStatus === 'active' ? 'block' : 'none',
            transform: isMirrored ? 'scaleX(-1)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
            display: cameraStatus === 'active' ? 'block' : 'none',
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

        {/* Privacy Shutter Active Viewport Overlay */}
        {cameraStatus === 'active' && isPrivacyShutterActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#141211',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 25,
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                border: '1px solid rgba(214, 189, 145, 0.4)',
                borderRadius: 'var(--hw-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                backgroundColor: 'rgba(38, 32, 31, 0.6)',
              }}
            >
              <span style={{ color: '#D6BD91', fontSize: '22px', fontWeight: 600, fontFamily: 'serif' }}>HW</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)', letterSpacing: '0.1em' }}>
              CAMERA MUTED
            </span>
            <span style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginTop: '4px' }}>
              Privacy Shutter Active • Video stream obscured
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

        {/* Top-right Resolution Selector Badge */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '36px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: 'var(--hw-radius-sm)',
            backgroundColor: 'rgba(29, 25, 24, 0.85)',
            border: '1px solid var(--hw-border-subtle)',
            fontSize: '11px',
            color: 'var(--hw-text-secondary)',
          }}
        >
          <select
            value={selectedResolution.id}
            onChange={(e) => {
              const found = RESOLUTION_PRESETS.find((r) => r.id === e.target.value);
              if (found) selectResolution(found);
            }}
            style={{
              cursor: 'pointer',
              color: 'var(--hw-text-primary)',
              background: 'transparent',
            }}
          >
            {RESOLUTION_PRESETS.map((res) => (
              <option key={res.id} value={res.id} style={{ background: '#1D1918' }}>
                {res.label}
              </option>
            ))}
          </select>
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
                color: activeGestureEvent.isTriggered ? '#141211' : 'var(--hw-accent-rose)',
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
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--hw-surface-elevated)',
                border: '1px solid var(--hw-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: 'var(--hw-accent-rose)',
              }}
            >
              <Camera size={26} strokeWidth={1.6} />
            </div>

            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--hw-text-primary)',
                marginBottom: '6px',
              }}
            >
              Ready to Stream Video
            </h3>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--hw-text-muted)',
                lineHeight: 1.6,
                marginBottom: '20px',
              }}
            >
              {availableDevices.length > 0
                ? `Selected: ${selectedDevice?.label || 'Default Camera'}. MediaPipe Hand Tracking is pre-warmed and ready.`
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
            Virtual Camera: {virtualCameraStatus === 'offline' ? 'Off' : 'Driver Standby (Phase 6)'}
          </button>
        </div>
      </div>

      {/* Phase 5: Processed Video Output Pipeline Control Bar */}
      <VirtualOutputBar />
    </section>
  );
};
