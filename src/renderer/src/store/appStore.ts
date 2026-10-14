import { create } from 'zustand';
import { EffectItem, EffectCategory } from '../types/effect';
import {
  CameraDevice,
  ResolutionProfile,
  CameraStatus,
  VirtualCameraStatus,
  CameraErrorInfo,
  LiveStreamMetrics,
} from '../types/camera';
import { GestureEvent } from '../types/gesture';
import { INITIAL_EFFECTS } from '../data/initialEffects';
import { cameraManager } from '../services/cameraManager';
import { CompositorMetrics, VirtualOutputStatus } from '../types/compositor';
import { videoCompositor } from '../services/videoCompositor';
import { soundEngine } from '../services/soundEngine';
import { mobileCamService } from '../services/mobileCamService';

export const RESOLUTION_PRESETS: ResolutionProfile[] = [
  { id: '720p30', label: '720p 30fps', width: 1280, height: 720, fps: 30 },
  { id: '1080p30', label: '1080p 30fps', width: 1920, height: 1080, fps: 30 },
  { id: '720p60', label: '720p 60fps', width: 1280, height: 720, fps: 60 },
];

export type AppTheme = 'romantic' | 'studio' | 'cyber' | 'midnight';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  tagline: string;
  category: string;
  previewColor: string;
  accentColor: string;
  bgPreview: string;
  description: string;
  badge?: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'romantic',
    name: 'Romantic Velvet',
    tagline: 'Make every gesture mean something',
    category: 'Couples & Romantic',
    previewColor: '#E82C55',
    accentColor: '#B85C70',
    bgPreview: '#141211',
    description: 'Warm burgundy, rose gold & champagne luxury. Crafted for couples and romantic streaming.',
    badge: 'Couples',
  },
  {
    id: 'studio',
    name: 'Obsidian Studio',
    tagline: 'Precision broadcast & content creation',
    category: 'Pro Broadcasting',
    previewColor: '#E5A83B',
    accentColor: '#3B82F6',
    bgPreview: '#0C0E12',
    description: 'Neutral deep obsidian with titanium slate & amber gold. Clean, distraction-free OBS studio look.',
    badge: 'Pro Studio',
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    tagline: 'High-energy esports & gaming stream',
    category: 'Gaming & Twitch',
    previewColor: '#00E5FF',
    accentColor: '#7C3AED',
    bgPreview: '#07090E',
    description: 'Pitch black with electric cyan and neon violet. Built for gamers, Discord, and VTubing.',
    badge: 'Gamer',
  },
  {
    id: 'midnight',
    name: 'Midnight Mint',
    tagline: 'Stealth minimalist productivity',
    category: 'Minimalist Clean',
    previewColor: '#10B981',
    accentColor: '#14B8A6',
    bgPreview: '#090E0F',
    description: 'Deep midnight emerald with glacier mint highlights. Crisp, modern, and easy on the eyes.',
    badge: 'Minimal',
  },
];

export type AppFont = 'plus-jakarta' | 'inter' | 'outfit' | 'space-grotesk';

export interface FontConfig {
  id: AppFont;
  name: string;
  family: string;
  category: string;
  description: string;
}

export const FONTS: FontConfig[] = [
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    category: 'Modern Geometric (Recommended)',
    description: 'Sleek, high-precision typography used in modern creative & video tools.',
  },
  {
    id: 'inter',
    name: 'Inter',
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    category: 'Pro Broadcast UI',
    description: 'Crisp, ultra-legible interface font standard in OBS Studio & Discord.',
  },
  {
    id: 'outfit',
    name: 'Outfit',
    family: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    category: 'Contemporary Clean',
    description: 'Balanced modern sans with smooth contours and excellent contrast.',
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    family: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    category: 'Tech & Esports',
    description: 'Distinctive, futuristic tech feel designed for gaming and streaming setups.',
  },
];

interface AppState {
  // Theme State
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;

  // Font State
  currentFont: AppFont;
  setFont: (font: AppFont) => void;

  // Navigation
  activeNav: string;
  setActiveNav: (nav: string) => void;

  // Effects
  effects: EffectItem[];
  selectedEffectId: string;
  setSelectedEffectId: (id: string) => void;
  activeIntensity: number;
  setActiveIntensity: (val: number) => void;
  toggleFavorite: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: EffectCategory;
  setCategoryFilter: (cat: EffectCategory) => void;

  // Physical Camera State
  cameraStatus: CameraStatus;
  availableDevices: CameraDevice[];
  selectedDeviceId: string;
  selectedResolution: ResolutionProfile;
  activeStream: MediaStream | null;
  cameraMetrics: LiveStreamMetrics | null;
  cameraError: CameraErrorInfo | null;
  isMirrored: boolean;
  toggleMirror: () => void;

  // Camera Actions
  fetchDevices: () => Promise<void>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  selectDevice: (deviceId: string) => Promise<void>;
  selectResolution: (profile: ResolutionProfile) => Promise<void>;
  clearCameraError: () => void;

  // Hand Tracking & Gesture State
  isTrackingActive: boolean;
  toggleTracking: () => void;
  activeGestureEvent: GestureEvent | null;
  setActiveGestureEvent: (event: GestureEvent | null) => void;
  showSkeletonDiagnostics: boolean;
  setShowSkeletonDiagnostics: (show: boolean) => void;
  gestureHoldDuration: number;
  setGestureHoldDuration: (sec: number) => void;
  gestureConfidence: number;
  setGestureConfidence: (val: number) => void;

  // Virtual Camera State
  virtualCameraStatus: VirtualCameraStatus;
  toggleVirtualCamera: () => void;

  // Phase 5 Video Output Pipeline
  virtualOutputStatus: VirtualOutputStatus;
  isPrivacyShutterActive: boolean;
  isBypassActive: boolean;
  compositorMetrics: CompositorMetrics | null;
  toggleVirtualOutput: () => void;
  togglePrivacyShutter: () => void;
  toggleBypass: () => void;
  setCompositorMetrics: (metrics: CompositorMetrics) => void;

  // Modals & Panels
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
  isMobileCamModalOpen: boolean;
  setIsMobileCamModalOpen: (open: boolean) => void;

  // Wireless Mobile Camera Remote Controls
  isMobileConnected: boolean;
  mobileDeviceName: string | null;
  mobileZoom: number;
  mobileMinZoom: number;
  mobileMaxZoom: number;
  mobileTorch: boolean;
  mobileTorchSupported: boolean;
  mobileLens: 'user' | 'environment';
  attachMobileStream: (stream: MediaStream, deviceName?: string) => void;
  detachMobileStream: () => void;
  setMobileZoom: (zoom: number) => void;
  toggleMobileTorch: () => void;
  switchMobileLens: (lens?: 'user' | 'environment') => void;

  // Phase 7: Sound Feedback & Audio Engine
  isSoundEnabled: boolean;
  soundVolume: number;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme initialization with automatic persistence
  currentTheme: (() => {
    try {
      const saved = localStorage.getItem('hw_theme') as AppTheme;
      if (saved && ['romantic', 'studio', 'cyber', 'midnight'].includes(saved)) {
        document.documentElement.setAttribute('data-theme', saved);
        return saved;
      }
    } catch {}
    document.documentElement.setAttribute('data-theme', 'romantic');
    return 'romantic';
  })(),

  setTheme: (theme: AppTheme) => {
    try {
      localStorage.setItem('hw_theme', theme);
    } catch {}
    document.documentElement.setAttribute('data-theme', theme);
    set({ currentTheme: theme });
  },

  // Font initialization with automatic persistence
  currentFont: (() => {
    try {
      const saved = localStorage.getItem('hw_font') as AppFont;
      const found = FONTS.find((f) => f.id === saved);
      if (found) {
        document.documentElement.style.setProperty('--hw-font-sans', found.family);
        document.documentElement.style.setProperty('--hw-font-serif', found.family);
        return saved;
      }
    } catch {}
    document.documentElement.style.setProperty('--hw-font-sans', FONTS[0].family);
    document.documentElement.style.setProperty('--hw-font-serif', FONTS[0].family);
    return 'plus-jakarta';
  })(),

  setFont: (font: AppFont) => {
    const found = FONTS.find((f) => f.id === font);
    if (found) {
      try {
        localStorage.setItem('hw_font', font);
      } catch {}
      document.documentElement.style.setProperty('--hw-font-sans', found.family);
      document.documentElement.style.setProperty('--hw-font-serif', found.family);
      set({ currentFont: font });
    }
  },

  activeNav: 'romantic',
  setActiveNav: (nav) => set({ activeNav: nav }),

  effects: INITIAL_EFFECTS,
  selectedEffectId: INITIAL_EFFECTS[0].id,
  setSelectedEffectId: (id) => set({ selectedEffectId: id }),
  activeIntensity: INITIAL_EFFECTS[0].defaultIntensity,
  setActiveIntensity: (val) => set({ activeIntensity: val }),
  toggleFavorite: (id) =>
    set((state) => ({
      effects: state.effects.map((e) =>
        e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
      ),
    })),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  categoryFilter: 'all',
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),

  // Camera State
  cameraStatus: 'standby',
  availableDevices: [],
  selectedDeviceId: '',
  selectedResolution: RESOLUTION_PRESETS[0],
  activeStream: null,
  cameraMetrics: null,
  cameraError: null,
  isMirrored: false,
  toggleMirror: () => set((state) => ({ isMirrored: !state.isMirrored })),

  fetchDevices: async () => {
    try {
      const devices = await cameraManager.enumerateDevices();
      const currentSelected = get().selectedDeviceId;
      const deviceExists = devices.some((d) => d.id === currentSelected);

      set({
        availableDevices: devices,
        selectedDeviceId: deviceExists
          ? currentSelected
          : devices.length > 0
          ? devices[0].id
          : '',
      });
    } catch (err) {
      console.error('Failed to fetch camera devices:', err);
    }
  },

  startCamera: async () => {
    const { selectedDeviceId, selectedResolution } = get();
    if (selectedDeviceId === 'mobile-wireless') {
      const activeStream = mobileCamService.getTelemetry().stream;
      if (activeStream) {
        set({ activeStream, cameraStatus: 'active', cameraError: null });
      }
      return;
    }
    set({ cameraStatus: 'connecting', cameraError: null });

    try {
      const { stream, metrics } = await cameraManager.startStream(
        selectedDeviceId || undefined,
        selectedResolution
      );

      // Re-fetch devices in case labels were unlocked by user media permission
      const updatedDevices = await cameraManager.enumerateDevices();

      set({
        activeStream: stream,
        cameraMetrics: metrics,
        cameraStatus: 'active',
        cameraError: null,
        availableDevices: updatedDevices.length > 0 ? updatedDevices : get().availableDevices,
      });
    } catch (err) {
      const parsed = cameraManager.parseError(err);
      set({
        activeStream: null,
        cameraStatus: 'error',
        cameraError: parsed,
      });
    }
  },

  stopCamera: () => {
    cameraManager.stopStream();
    set({
      activeStream: null,
      cameraStatus: 'standby',
      cameraMetrics: null,
    });
  },

  selectDevice: async (deviceId: string) => {
    set({ selectedDeviceId: deviceId });
    if (deviceId !== 'mobile-wireless' && get().cameraStatus === 'active') {
      await get().startCamera();
    }
  },

  selectResolution: async (profile: ResolutionProfile) => {
    set({ selectedResolution: profile });
    if (get().selectedDeviceId === 'mobile-wireless') {
      // Mobile camera is active: smoothly request resolution change from phone without wiping stream!
      mobileCamService.sendResolutionRequest(profile.height >= 1080 ? '1080p' : '720p');
      return;
    }
    if (get().cameraStatus === 'active') {
      await get().startCamera();
    }
  },

  clearCameraError: () => set({ cameraError: null, cameraStatus: 'standby' }),

  // Hand Tracking & Gesture State
  isTrackingActive: true,
  toggleTracking: () => set((state) => ({ isTrackingActive: !state.isTrackingActive })),
  activeGestureEvent: null,
  setActiveGestureEvent: (event) => set({ activeGestureEvent: event }),
  showSkeletonDiagnostics: true,
  setShowSkeletonDiagnostics: (show) => set({ showSkeletonDiagnostics: show }),
  gestureHoldDuration: 0.5,
  setGestureHoldDuration: (sec) => set({ gestureHoldDuration: sec }),
  gestureConfidence: 65,
  setGestureConfidence: (val) => set({ gestureConfidence: val }),

  virtualCameraStatus: 'offline',
  toggleVirtualCamera: () =>
    set((state) => ({
      virtualCameraStatus:
        state.virtualCameraStatus === 'offline' ? 'driver_unregistered' : 'offline',
    })),

  // Phase 5 Video Output Pipeline Actions
  virtualOutputStatus: 'standby',
  isPrivacyShutterActive: false,
  isBypassActive: false,
  compositorMetrics: null,
  toggleVirtualOutput: () => {
    const isCurrentlyBroadcasting = get().virtualOutputStatus === 'broadcasting';
    const nextStatus = isCurrentlyBroadcasting ? 'standby' : 'broadcasting';
    if (isCurrentlyBroadcasting) {
      if (typeof window !== 'undefined' && window.heartwaveApi?.stopVirtualCamera) {
        window.heartwaveApi.stopVirtualCamera();
      }
      set({ virtualOutputStatus: 'standby' });
    } else {
      const compW = videoCompositor.getWidth();
      const compH = videoCompositor.getHeight();
      const res = get().selectedResolution;
      const width = compW > 0 ? compW : res.width;
      const height = compH > 0 ? compH : res.height;
      const fps = res.fps || 30;

      if (typeof window !== 'undefined' && window.heartwaveApi?.startVirtualCamera) {
        window.heartwaveApi.startVirtualCamera(width, height, fps);
      }
      set({ virtualOutputStatus: 'broadcasting' });
    }
    if (typeof window !== 'undefined' && window.heartwaveApi?.sendTrayState) {
      window.heartwaveApi.sendTrayState({
        isPrivacy: get().isPrivacyShutterActive,
        isBypass: get().isBypassActive,
        isVirtualOutput: nextStatus === 'broadcasting',
      });
    }
  },
  togglePrivacyShutter: () => {
    const nextPrivacy = !get().isPrivacyShutterActive;
    set({ isPrivacyShutterActive: nextPrivacy });
    if (typeof window !== 'undefined' && window.heartwaveApi?.sendTrayState) {
      window.heartwaveApi.sendTrayState({
        isPrivacy: nextPrivacy,
        isBypass: get().isBypassActive,
        isVirtualOutput: get().virtualOutputStatus === 'broadcasting',
      });
    }
  },
  toggleBypass: () => {
    const nextBypass = !get().isBypassActive;
    set({ isBypassActive: nextBypass });
    if (typeof window !== 'undefined' && window.heartwaveApi?.sendTrayState) {
      window.heartwaveApi.sendTrayState({
        isPrivacy: get().isPrivacyShutterActive,
        isBypass: nextBypass,
        isVirtualOutput: get().virtualOutputStatus === 'broadcasting',
      });
    }
  },
  setCompositorMetrics: (metrics) => set({ compositorMetrics: metrics }),

  // Phase 7: Sound Feedback & Audio Engine State
  isSoundEnabled: (() => {
    try {
      const saved = localStorage.getItem('hw_sound_enabled');
      const enabled = saved !== null ? saved === 'true' : true;
      soundEngine.setEnabled(enabled);
      return enabled;
    } catch {
      return true;
    }
  })(),
  soundVolume: (() => {
    try {
      const saved = localStorage.getItem('hw_sound_volume');
      const vol = saved !== null ? Number(saved) : 50;
      soundEngine.setVolume(vol / 100);
      return vol;
    } catch {
      return 50;
    }
  })(),
  setSoundEnabled: (enabled) => {
    try {
      localStorage.setItem('hw_sound_enabled', String(enabled));
    } catch {}
    soundEngine.setEnabled(enabled);
    set({ isSoundEnabled: enabled });
  },
  setSoundVolume: (vol) => {
    try {
      localStorage.setItem('hw_sound_volume', String(vol));
    } catch {}
    soundEngine.setVolume(vol / 100);
    set({ soundVolume: vol });
  },

  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isInspectorOpen: true,
  setIsInspectorOpen: (open) => set({ isInspectorOpen: open }),

  // Wireless Mobile Camera
  isMobileCamModalOpen: false,
  setIsMobileCamModalOpen: (open) => set({ isMobileCamModalOpen: open }),
  isMobileConnected: false,
  mobileDeviceName: null,
  mobileZoom: 1.0,
  mobileMinZoom: 1.0,
  mobileMaxZoom: 5.0,
  mobileTorch: false,
  mobileTorchSupported: false,
  mobileLens: 'environment',
  attachMobileStream: (stream, deviceName = '📱 Mobile Camera (Wireless)') => {
    const devices = get().availableDevices;
    const mobileId = 'mobile-wireless';
    const exists = devices.some((d) => d.id === mobileId);
    const updatedDevices = exists
      ? devices
      : [{ id: mobileId, label: `📱 ${deviceName}`, groupId: 'wireless', isDefault: false }, ...devices];

    set({
      availableDevices: updatedDevices,
      selectedDeviceId: mobileId,
      activeStream: stream,
      cameraStatus: 'active',
      isMobileConnected: true,
      mobileDeviceName: deviceName,
      isMobileCamModalOpen: false,
    });
  },
  detachMobileStream: () => {
    const devices = get().availableDevices.filter((d) => d.id !== 'mobile-wireless');
    set({
      availableDevices: devices,
      selectedDeviceId: devices[0]?.id || 'default',
      isMobileConnected: false,
      mobileDeviceName: null,
    });
    get().startCamera().catch(() => {});
  },
  setMobileZoom: (zoom: number) => {
    set({ mobileZoom: zoom });
    mobileCamService.sendZoomRequest(zoom);
  },
  toggleMobileTorch: () => {
    const next = !get().mobileTorch;
    set({ mobileTorch: next });
    mobileCamService.sendTorchRequest(next);
  },
  switchMobileLens: (lens) => {
    const next = lens || (get().mobileLens === 'environment' ? 'user' : 'environment');
    set({ mobileLens: next });
    mobileCamService.sendLensRequest(next);
  },
}));
