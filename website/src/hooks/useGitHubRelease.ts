import { useState, useEffect, useCallback } from 'react';

export interface ReleaseAsset {
  name: string;
  downloadUrl: string;
  fastMirrorUrl?: string;
  sizeBytes: number;
  sizeFormatted: string;
  type: 'win-setup' | 'win-portable' | 'win-msi' | 'mac-dmg' | 'linux-appimage' | 'linux-deb' | 'other';
  label: string;
  os: 'windows' | 'macos' | 'linux' | 'other';
}

export interface ReleaseInfo {
  version: string;
  name: string;
  publishedAt: string;
  htmlUrl: string;
  assets: ReleaseAsset[];
  recommendedAsset: Record<'windows' | 'macos' | 'linux', ReleaseAsset>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Fallback baseline directly pointing to release v1.3.30 without redirect hops
const FALLBACK_VERSION = 'v1.3.30';
const GITHUB_REPO = 'Jithin0306/HeartWave';
const BASE_DIRECT = `https://github.com/${GITHUB_REPO}/releases/download/${FALLBACK_VERSION}`;

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const defaultRecommended: Record<'windows' | 'macos' | 'linux', ReleaseAsset> = {
  windows: {
    name: 'HeartWave_1.3.30_x64-setup.exe',
    downloadUrl: `${BASE_DIRECT}/HeartWave_1.3.30_x64-setup.exe`,
    fastMirrorUrl: '/downloads/HeartWave-Setup.exe',
    sizeBytes: 22827685,
    sizeFormatted: '22.8 MB',
    type: 'win-setup',
    label: 'Windows 10/11 Setup (NSIS)',
    os: 'windows',
  },
  macos: {
    name: 'HeartWave_1.3.30_aarch64.dmg',
    downloadUrl: `${BASE_DIRECT}/HeartWave_1.3.30_aarch64.dmg`,
    sizeBytes: 27300865,
    sizeFormatted: '27.3 MB',
    type: 'mac-dmg',
    label: 'macOS Universal Disk Image (.dmg)',
    os: 'macos',
  },
  linux: {
    name: 'HeartWave_1.3.30_amd64.AppImage',
    downloadUrl: `${BASE_DIRECT}/HeartWave_1.3.30_amd64.AppImage`,
    sizeBytes: 102590968,
    sizeFormatted: '102.6 MB',
    type: 'linux-appimage',
    label: 'Linux Universal (.AppImage)',
    os: 'linux',
  },
};

const defaultAssets: ReleaseAsset[] = [
  defaultRecommended.windows,
  {
    name: 'HeartWave-Portable.exe',
    downloadUrl: `${BASE_DIRECT}/HeartWave-Portable.exe`,
    fastMirrorUrl: '/downloads/HeartWave-Portable.exe',
    sizeBytes: 31866368,
    sizeFormatted: '31.9 MB',
    type: 'win-portable',
    label: 'Windows Standalone (Portable EXE)',
    os: 'windows',
  },
  {
    name: 'HeartWave_1.3.30_x64_en-US.msi',
    downloadUrl: `${BASE_DIRECT}/HeartWave_1.3.30_x64_en-US.msi`,
    sizeBytes: 23998464,
    sizeFormatted: '24.0 MB',
    type: 'win-msi',
    label: 'Windows Enterprise (.msi Package)',
    os: 'windows',
  },
  defaultRecommended.macos,
  defaultRecommended.linux,
  {
    name: 'HeartWave_1.3.30_amd64.deb',
    downloadUrl: `${BASE_DIRECT}/HeartWave_1.3.30_amd64.deb`,
    sizeBytes: 24166196,
    sizeFormatted: '24.2 MB',
    type: 'linux-deb',
    label: 'Debian / Ubuntu (.deb)',
    os: 'linux',
  },
];

const CACHE_KEY = 'hw_release_info_v3';
const CACHE_TIME_KEY = 'hw_release_timestamp_v3';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

export function useGitHubRelease(): ReleaseInfo {
  const [release, setRelease] = useState<ReleaseInfo>({
    version: FALLBACK_VERSION,
    name: `HeartWave ${FALLBACK_VERSION}`,
    publishedAt: 'October 2026',
    htmlUrl: `https://github.com/${GITHUB_REPO}/releases/latest`,
    assets: defaultAssets,
    recommendedAsset: defaultRecommended,
    isLoading: true,
    error: null,
    refresh: async () => {},
  });

  const fetchLatestRelease = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        if (cached && cachedTime) {
          const age = Date.now() - parseInt(cachedTime, 10);
          const parsed = JSON.parse(cached);
          setRelease((prev) => ({ ...prev, ...parsed, isLoading: false }));
          if (age < CACHE_TTL_MS) {
            return;
          }
        }
      }

      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!res.ok) {
        // If rate-limited (HTTP 403), use cached or fallback without throwing an unhandled exception
        if (res.status === 403) {
          console.warn('[HeartWave] GitHub API rate limit reached, using cached/fallback release data.');
          setRelease((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        throw new Error(`GitHub API HTTP ${res.status}`);
      }

      const data = await res.json();
      const parsedAssets: ReleaseAsset[] = [];

      let recWin: ReleaseAsset | null = null;
      let recMac: ReleaseAsset | null = null;
      let recLinux: ReleaseAsset | null = null;

      const tag = data.tag_name || FALLBACK_VERSION;
      const isBundledVersion = tag === FALLBACK_VERSION;

      if (Array.isArray(data.assets)) {
        for (const a of data.assets) {
          const fileName = (a.name || '').toLowerCase();
          const url = a.browser_download_url;
          const size = a.size || 0;
          const formatted = formatBytes(size);

          if (fileName.endsWith('.sig') || fileName.endsWith('.json') || fileName.endsWith('.tar.gz')) {
            continue;
          }

          if (fileName.includes('setup') && fileName.endsWith('.exe')) {
            const item: ReleaseAsset = {
              name: a.name,
              downloadUrl: url,
              fastMirrorUrl: isBundledVersion ? '/downloads/HeartWave-Setup.exe' : undefined,
              sizeBytes: size,
              sizeFormatted: formatted,
              type: 'win-setup',
              label: 'Windows 10/11 Setup (NSIS)',
              os: 'windows',
            };
            parsedAssets.push(item);
            if (!recWin) recWin = item;
          } else if (fileName.includes('portable') && fileName.endsWith('.exe')) {
            parsedAssets.push({
              name: a.name,
              downloadUrl: url,
              fastMirrorUrl: isBundledVersion ? '/downloads/HeartWave-Portable.exe' : undefined,
              sizeBytes: size,
              sizeFormatted: formatted,
              type: 'win-portable',
              label: 'Windows Standalone (Portable EXE)',
              os: 'windows',
            });
          } else if (fileName.endsWith('.msi')) {
            parsedAssets.push({
              name: a.name,
              downloadUrl: url,
              sizeBytes: size,
              sizeFormatted: formatted,
              type: 'win-msi',
              label: 'Windows Enterprise (.msi Package)',
              os: 'windows',
            });
          } else if (fileName.endsWith('.dmg')) {
            const item: ReleaseAsset = {
              name: a.name,
              downloadUrl: url,
              sizeBytes: size,
              sizeFormatted: formatted,
              type: 'mac-dmg',
              label: 'macOS Universal Disk Image (.dmg)',
              os: 'macos',
            };
            parsedAssets.push(item);
            if (!recMac) recMac = item;
          } else if (fileName.endsWith('.appimage')) {
            const item: ReleaseAsset = {
              name: a.name,
              downloadUrl: url,
              sizeBytes: size,
              sizeFormatted: formatted,
              type: 'linux-appimage',
              label: 'Linux Universal (.AppImage)',
              os: 'linux',
            };
            parsedAssets.push(item);
            if (!recLinux) recLinux = item;
          } else if (fileName.endsWith('.deb')) {
            parsedAssets.push({
              name: a.name,
              downloadUrl: url,
              sizeBytes: size,
              sizeFormatted: formatted,
              type: 'linux-deb',
              label: 'Debian / Ubuntu (.deb)',
              os: 'linux',
            });
          }
        }
      }

      const newReleaseData = {
        version: tag,
        name: data.name || `HeartWave ${tag}`,
        publishedAt: data.published_at
          ? new Date(data.published_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recent',
        htmlUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`,
        assets: parsedAssets.length > 0 ? parsedAssets : defaultAssets,
        recommendedAsset: {
          windows: recWin || defaultRecommended.windows,
          macos: recMac || defaultRecommended.macos,
          linux: recLinux || defaultRecommended.linux,
        },
        isLoading: false,
        error: null,
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(newReleaseData));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } catch {
        // Ignore localStorage quota errors
      }

      setRelease((prev) => ({ ...prev, ...newReleaseData }));
    } catch (err: any) {
      setRelease((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to fetch release',
      }));
    }
  }, []);

  useEffect(() => {
    fetchLatestRelease();
  }, [fetchLatestRelease]);

  return {
    ...release,
    refresh: () => fetchLatestRelease(true),
  };
}

