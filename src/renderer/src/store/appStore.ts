import { create } from 'zustand';
import { EffectItem, EffectCategory } from '../types/effect';
import { CameraDevice, ResolutionProfile, CameraStatus, VirtualCameraStatus } from '../types/camera';
import { INITIAL_EFFECTS } from '../data/initialEffects';

export const RESOLUTION_PRESETS: ResolutionProfile[] = [
  { id: '1080p30', label: '1080p 30fps', width: 1920, height: 1080, fps: 30 },
  { id: '720p30', label: '720p 30fps', width: 1280, height: 720, fps: 30 },
  { id: '720p60', label: '720p 60fps', width: 1280, height: 720, fps: 60 },
];

export const MOCK_DEVICES: CameraDevice[] = [
  { id: 'cam-1', label: 'Integrated HD Webcam', isDefault: true },
  { id: 'cam-2', label: 'Logitech Brio 4K / StreamCam' },
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

  // Camera State (Honest Standby / Phase 1 UI state)
  cameraStatus: CameraStatus;
  setCameraStatus: (status: CameraStatus) => void;
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  selectedResolution: ResolutionProfile;
  setSelectedResolution: (profile: ResolutionProfile) => void;
  isMirrored: boolean;
  toggleMirror: () => void;

  // Virtual Camera State
  virtualCameraStatus: VirtualCameraStatus;
  toggleVirtualCamera: () => void;

  // Modals & Panels
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
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

  cameraStatus: 'standby',
  setCameraStatus: (status) => set({ cameraStatus: status }),
  selectedDeviceId: MOCK_DEVICES[0].id,
  setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
  selectedResolution: RESOLUTION_PRESETS[0],
  setSelectedResolution: (profile) => set({ selectedResolution: profile }),
  isMirrored: false,
  toggleMirror: () => set((state) => ({ isMirrored: !state.isMirrored })),

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
