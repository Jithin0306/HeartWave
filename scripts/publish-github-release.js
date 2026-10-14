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

const VERSION = '1.3.8';
const TAG = `v${VERSION}`;
const REPO = 'jithin0306/HeartWave';
const TOKEN = getGithubToken();

const RELEASE_TITLE = `HeartWave v${VERSION} - Collapsible Effects Studio, Default Home Mode & Studio Command Center`;
const RELEASE_NOTES = `## HeartWave v${VERSION} Release Notes

### 🎛️ Collapsible Effects Studio (With 1-Click Restore)
- **Collapsible Sidebar**: Easily collapse the Effects Studio (and Streamer Hub) with a single click using the new header collapse button (\`PanelRightClose\`).
- **Panoramic 100% Viewport**: Collapsing the sidebar lets the camera preview expand to full screen width.
- **Instant Restore**: Restore the studio anytime via the top-bar "Open Studio" button or the floating glassmorphic pill in the top-right corner of the viewport.
- **Session Persistence**: Remembers your preferred layout via \`localStorage\` (\`hw_right_panel_collapsed\`).

### 🏠 Default Home Studio Landing Mode
- **Home by Default**: The software now automatically opens in **Home Studio** mode (\`activeNav: 'home'\`) on startup.

### 🚀 Distinctive & Unique Home Studio Experience
- **Studio Command Center**: Dedicated command deck with live hardware & pipeline readiness chips (Camera feed with live FPS/resolution, MediaPipe 21-3D landmark tracker with quick toggle, DirectShow 60FPS broadcast pipe, and Wireless Mobile Cam).
- **Quick-Fire Effects Shelf**: 6 instant 1-click effect trigger chips directly on the Home view with procedural harmonic sound feedback (Double Heart Glow, Rose Bloom Storm, Finger Heart Spark, Love Wave Ripple, Cupid's Golden Arrow, Angel Wings Aura).
- **Interactive Studio Hub Launchpad**: 4 interactive visual cards below the viewport to instantly jump into **Couples Duo Mode**, **Romantic Visual FX**, **Streamer Broadcast Hub**, or **Wireless Mobile Camera**.
- **Context-Specific Views**: When navigating to other tabs (\`couples\`, \`romantic\`, \`streamer\`, \`favorites\`), the launchpad cards tuck away to provide a focused workspace.

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
