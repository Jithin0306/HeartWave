const fs = require('fs');
const path = require('path');

const VERSION = '1.3.3';
const TAG = `v${VERSION}`;
const REPO = 'jithin0306/HeartWave';
const TOKEN = process.env.GITHUB_TOKEN || '';

const RELEASE_TITLE = `HeartWave v${VERSION} - Live Mobile Cam Percentage Bar & In-App Auto-Updater`;
const RELEASE_NOTES = `## HeartWave v${VERSION} Release Notes

### 📱 High-Definition Mobile Webcam Improvements
- **Real-Time Connection Percentage Bar**: Smooth progress indicator (15% -> 35% -> 55% -> 75% -> 90% -> 100%) showing real-time WebRTC negotiation stages.
- **Diagnostic Helper & Quick Reconnect**: In-stream troubleshooting hints with editable room code input to immediately re-attempt handshakes.
- **Always-On Desktop Server**: HeartWave desktop continuously warms up peer signaling on app startup so scanned mobile connections establish instantly.
- **Stable Room ID Preservation**: Preserves user's scanned room code across temporary network reconnects without mutating IDs.
- **Auto-Closing QR Code Modal**: Desktop QR code modal automatically dismisses the second your mobile camera stream is received.

### 🔄 In-App Auto-Updater Fixes
- **Pure UTF-8 (No-BOM) Manifest**: Completely fixed \`latest.json\` parsing issue by eliminating UTF-8 Byte Order Marks (BOM) that caused Rust \`serde_json\` deserialization errors.
- **Dynamic Version Reporting**: Synchronized \`env!("CARGO_PKG_VERSION")\` with the updater engine so updates are accurately detected and applied.

---
### 📦 Downloads
- **Setup Installer**: \`HeartWave_${VERSION}_x64-setup.exe\`
- **Portable Edition**: \`HeartWave-Portable.exe\`
- **Enterprise MSI**: \`HeartWave_${VERSION}_x64_en-US.msi\`
`;

async function main() {
  const nsisDir = path.resolve('src-tauri/target/release/bundle/nsis');
  const msiDir = path.resolve('src-tauri/target/release/bundle/msi');
  const bundleDir = path.resolve('src-tauri/target/release/bundle');
  const releaseDir = path.resolve('src-tauri/target/release');

  // Copy portable exe
  const rawExe = path.join(releaseDir, 'heartwave.exe');
  const portableExe = path.join(bundleDir, 'HeartWave-Portable.exe');
  if (fs.existsSync(rawExe)) {
    fs.copyFileSync(rawExe, portableExe);
    console.log('✓ Prepared HeartWave-Portable.exe');
  }

  const assetsToUpload = [
    { name: `HeartWave_${VERSION}_x64-setup.exe`, path: path.join(nsisDir, `HeartWave_${VERSION}_x64-setup.exe`) },
    { name: `HeartWave_${VERSION}_x64-setup.exe.sig`, path: path.join(nsisDir, `HeartWave_${VERSION}_x64-setup.exe.sig`) },
    { name: `HeartWave_${VERSION}_x64_en-US.msi`, path: path.join(msiDir, `HeartWave_${VERSION}_x64_en-US.msi`) },
    { name: 'HeartWave-Portable.exe', path: portableExe },
    { name: 'latest.json', path: path.join(bundleDir, 'latest.json') }
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
