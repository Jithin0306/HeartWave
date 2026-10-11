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
import { INITIAL_EFFECTS } from '../data/initialEffects';
import { cameraManager } from '../services/cameraManager';

export const RESOLUTION_PRESETS: ResolutionProfile[] = [
  { id: '1080p30', label: '1080p 30fps', width: 1920, height: 1080, fps: 30 },
  { id: '720p30', label: '720p 30fps', width: 1280, height: 720, fps: 30 },
  { id: '720p60', label: '720p 60fps', width: 1280, height: 720, fps: 60 },
];

interface AppState {
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

  // Virtual Camera State
  virtualCameraStatus: VirtualCameraStatus;
  toggleVirtualCamera: () => void;

  // Modals & Panels
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
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
    if (get().cameraStatus === 'active') {
      await get().startCamera();
    }
  },

  selectResolution: async (profile: ResolutionProfile) => {
    set({ selectedResolution: profile });
    if (get().cameraStatus === 'active') {
      await get().startCamera();
    }
  },

  clearCameraError: () => set({ cameraError: null, cameraStatus: 'standby' }),

  virtualCameraStatus: 'offline',
  toggleVirtualCamera: () =>
    set((state) => ({
      virtualCameraStatus:
        state.virtualCameraStatus === 'offline' ? 'driver_unregistered' : 'offline',
    })),

  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isInspectorOpen: true,
  setIsInspectorOpen: (open) => set({ isInspectorOpen: open }),
}));
