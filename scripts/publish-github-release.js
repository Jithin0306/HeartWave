const fs = require('fs');
const path = require('path');

const VERSION = '1.3.5';
const TAG = `v${VERSION}`;
const REPO = 'jithin0306/HeartWave';
const TOKEN = process.env.GITHUB_TOKEN || '';

const RELEASE_TITLE = `HeartWave v${VERSION} - Remote Camera Freedom Controls & Orientation Guidance`;
const RELEASE_NOTES = `## HeartWave v${VERSION} Release Notes

### 🎛️ Full Remote Smartphone Camera Controls
- **Remote Camera Freedom Controls**: Control your phone camera hardware directly from the PC desktop HUD or Settings panel.
- **Remote Optical/Digital Zoom**: Smooth zoom slider (1.0x to 5.0x) with instant 1x, 2x, 3x presets communicated via WebRTC data channel.
- **Remote Flashlight / Torch Toggle**: Turn your phone's camera flash on and off remotely from your PC with a single click.
- **Rear Camera / Selfie Lens Switcher**: Effortlessly switch between rear back camera and front selfie camera from desktop with zero stream interruption.
- **Mobile Zoom Shelf**: Added floating on-screen zoom slider and preset pills directly onto the smartphone web interface.

### 📱 16:9 Widescreen Landscape Guidance
- **Orientation Lock Notice**: Prominent visual tips on both the mobile start screen and desktop QR pairing modal instructing users to turn **OFF Auto-Rotate Lock** for widescreen 16:9 landscape streaming.

### ⚙️ Version Synchronization Fix
- **Dynamic Version Reporting**: Resolved the static version display in Settings & Preferences dialog—now dynamically reads the live package and runtime version.

---
### 📦 Downloads
- **Setup Installer**: \`HeartWave_${VERSION}_x64-setup.exe\`
- **Portable Edition**: \`HeartWave-Portable.exe\`
- **Enterprise MSI**: \`HeartWave_${VERSION}_x64_en-US.msi\`
`;

async function main() {
  const releaseOutputDir = path.resolve(`release-${VERSION}`);
  const nsisDir = path.resolve('src-tauri/target/release/bundle/nsis');
  const msiDir = path.resolve('src-tauri/target/release/bundle/msi');
  const bundleDir = path.resolve('src-tauri/target/release/bundle');

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
