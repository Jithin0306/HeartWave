const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGithubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const output = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf-8'
    });
    const match = output.match(/password=(.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (err) {
    console.warn('Could not read token from git credential helper:', err.message);
  }
  return '';
}

const VERSION = '1.3.19';
const TAG = `v${VERSION}`;
const REPO = 'jithin0306/HeartWave';
const TOKEN = getGithubToken();

const RELEASE_TITLE = `HeartWave v${VERSION} - High FPS Background Ticker & Foreground Segmentation Fix`;
const RELEASE_NOTES = `## HeartWave v${VERSION} Release Notes

### 🚀 High FPS When Minimized (Zero Lag Virtual Camera)
- **Dedicated Background Web Worker Ticker**: Chromium suspends \`requestAnimationFrame\` and clamps DOM timers when a window is minimized to the taskbar. We integrated an isolated Web Worker ticker that runs on an independent background thread and never sleeps, driving the composite broadcast pipeline at a rock-solid **30.0 FPS** regardless of window minimization or occlusion.
- **Unthrottled WebView2 Execution**: Configured \`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS\` with \`--disable-renderer-backgrounding\` and \`--disable-background-timer-throttling\` in Rust to prevent Windows EcoQoS power management from capping the application when minimized.

### 👤 Person Segmentation & Backdrop Foreground Fix
- **Subject Extraction Correction**: Fixed MediaPipe SelfieSegmenter category mask selection to extract the person confidence mask (category 1) rather than the background mask (category 0). The human subject is now rendered cleanly and sharply in front of virtual backdrops, green screen chroma keys, and DSLR blur layers.
- **Continuous Hardware Decoder Keep-Alive**: Replaced \`display: 'none'\` with layout-stable low opacity rendering for the physical camera video tag, preventing Chromium from detaching the element and freezing hardware video frame decoding.

---
### 📦 Windows Downloads
- **Setup Installer (NSIS)**: \`HeartWave_${VERSION}_x64-setup.exe\`
- **Portable Edition**: \`HeartWave-Portable.exe\`
- **Enterprise MSI**: \`HeartWave_${VERSION}_x64_en-US.msi\`
`;

async function main() {
  const releaseOutputDir = path.resolve(`release-${VERSION}`);
  const nsisDir = path.resolve('src-tauri/target/release/bundle/nsis');
  const msiDir = path.resolve('src-tauri/target/release/bundle/msi');
  const bundleDir = path.resolve('src-tauri/target/release/bundle');
  const releaseDir = path.resolve('src-tauri/target/release');

  // Copy standalone portable exe
  const rawExe = path.join(releaseDir, 'heartwave.exe');
  const portableExe = path.join(bundleDir, 'HeartWave-Portable.exe');
  if (fs.existsSync(rawExe)) {
    fs.copyFileSync(rawExe, portableExe);
    console.log('✓ Prepared HeartWave-Portable.exe');
  }

  const assetsToUpload = [
    {
      name: `HeartWave_${VERSION}_x64-setup.exe`,
      path: fs.existsSync(path.join(releaseOutputDir, `HeartWave_${VERSION}_x64-setup.exe`))
        ? path.join(releaseOutputDir, `HeartWave_${VERSION}_x64-setup.exe`)
        : path.join(nsisDir, `HeartWave_${VERSION}_x64-setup.exe`)
    },
    {
      name: `HeartWave_${VERSION}_x64-setup.exe.sig`,
      path: fs.existsSync(path.join(releaseOutputDir, `HeartWave_${VERSION}_x64-setup.exe.sig`))
        ? path.join(releaseOutputDir, `HeartWave_${VERSION}_x64-setup.exe.sig`)
        : path.join(nsisDir, `HeartWave_${VERSION}_x64-setup.exe.sig`)
    },
    {
      name: `HeartWave_${VERSION}_x64_en-US.msi`,
      path: fs.existsSync(path.join(releaseOutputDir, `HeartWave_${VERSION}_x64_en-US.msi`))
        ? path.join(releaseOutputDir, `HeartWave_${VERSION}_x64_en-US.msi`)
        : path.join(msiDir, `HeartWave_${VERSION}_x64_en-US.msi`)
    },
    {
      name: 'HeartWave-Portable.exe',
      path: fs.existsSync(path.join(releaseOutputDir, 'HeartWave-Portable.exe'))
        ? path.join(releaseOutputDir, 'HeartWave-Portable.exe')
        : path.join(bundleDir, 'HeartWave-Portable.exe')
    },
    {
      name: 'latest.json',
      path: fs.existsSync(path.join(releaseOutputDir, 'latest.json'))
        ? path.join(releaseOutputDir, 'latest.json')
        : path.join(bundleDir, 'latest.json')
    }
  ];

  console.log(`Checking build assets for v${VERSION}...`);
  for (const asset of assetsToUpload) {
    if (!fs.existsSync(asset.path)) {
      throw new Error(`Missing expected asset: ${asset.path}`);
    }
    const stat = fs.statSync(asset.path);
    console.log(`- ${asset.name} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  // 1. Check or Create Release
  console.log(`\nCreating release ${TAG} on GitHub...`);
  let releaseRes = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${TAG}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Node' }
  });

  let release;
  if (releaseRes.ok) {
    release = await releaseRes.json();
    console.log(`Release ${TAG} already exists (ID: ${release.id}). Updating notes...`);
    const patchRes = await fetch(`https://api.github.com/repos/${REPO}/releases/${release.id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Node', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: RELEASE_TITLE, body: RELEASE_NOTES })
    });
    release = await patchRes.json();
  } else {
    const postRes = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Node', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: TAG,
        target_commitish: 'main',
        name: RELEASE_TITLE,
        body: RELEASE_NOTES,
        draft: false,
        prerelease: false
      })
    });
    if (!postRes.ok) {
      const errText = await postRes.text();
      throw new Error(`Failed to create release: ${postRes.status} ${errText}`);
    }
    release = await postRes.json();
    console.log(`Created release ${TAG} (ID: ${release.id})`);
  }

  // 2. Upload Assets
  for (const asset of assetsToUpload) {
    console.log(`\nUploading ${asset.name}...`);
    // Delete existing asset if it exists
    const existing = (release.assets || []).find(a => a.name === asset.name);
    if (existing) {
      console.log(`Deleting existing ${asset.name} (Asset ID: ${existing.id})...`);
      await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${existing.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Node' }
      });
    }

    const fileBuffer = fs.readFileSync(asset.path);
    const contentType = asset.name.endsWith('.json')
      ? 'application/json'
      : asset.name.endsWith('.sig')
      ? 'text/plain'
      : 'application/octet-stream';

    const uploadRes = await fetch(`https://uploads.github.com/repos/${REPO}/releases/${release.id}/assets?name=${encodeURIComponent(asset.name)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'Node',
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length
      },
      body: fileBuffer
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Failed to upload ${asset.name}: ${uploadRes.status} ${err}`);
    }
    const uploaded = await uploadRes.json();
    console.log(`✓ Uploaded ${asset.name} successfully (ID: ${uploaded.id})`);
  }

  console.log('\n=========================================');
  console.log(`🎉 HeartWave v${VERSION} published successfully!`);
  console.log(`URL: https://github.com/${REPO}/releases/tag/${TAG}`);
  console.log('=========================================');
}

main().catch(err => {
  console.error('Fatal error during publish:', err);
  process.exit(1);
});
