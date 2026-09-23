#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd, label) {
  console.log(`\n▶ ${label}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ Skipping ${src} (not found)`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  execSync(`cp -r "${src}/." "${dest}"`, { stdio: 'inherit' });
}

// 1. Build Next.js
run('npm run build', 'Building Next.js (standalone)');

// 2. Copy static assets into standalone directory
console.log('\n▶ Copying static assets into standalone');
copyDir(
  path.join(ROOT, '.next', 'static'),
  path.join(ROOT, '.next', 'standalone', '.next', 'static')
);
copyDir(
  path.join(ROOT, 'public'),
  path.join(ROOT, '.next', 'standalone', 'public')
);
console.log('  ✓ Static assets ready');

// 3. Build a clean standalone directory with only what the server needs at runtime.
//    Next.js standalone sometimes traces the entire project (symlinks to app/, dist/, etc.)
//    We only need: server.js, node_modules/, .next/
console.log('\n▶ Building clean standalone bundle');
const standaloneDir = path.join(ROOT, '.next', 'standalone');
const cleanDir = path.join(ROOT, '.next', 'standalone-clean');

// Wipe previous clean build
if (fs.existsSync(cleanDir)) execSync(`rm -rf "${cleanDir}"`);
fs.mkdirSync(cleanDir);

const KEEP = ['server.js', 'node_modules', '.next', 'public', 'data'];
for (const name of KEEP) {
  const src = path.join(standaloneDir, name);
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ ${name} not found in standalone, skipping`);
    continue;
  }
  const dest = path.join(cleanDir, name);
  execSync(`cp -r "${src}" "${dest}"`, { stdio: 'inherit' });
  console.log(`  copied: ${name}`);
}
console.log('  ✓ Clean standalone ready');

// 4. Package with electron-builder (uses standalone-clean via extraResources)
run('npx electron-builder --mac --arm64', 'Packaging with electron-builder');

// 5. electron-builder excludes node_modules from extraResources by default (!**/node_modules/**).
//    Copy the standalone node_modules manually into the app bundle.
console.log('\n▶ Fixing node_modules in app bundle (electron-builder excludes them)');
const appBundle = path.join(ROOT, 'dist', 'mac-arm64', 'Mission Control.app');
const nextjsResources = path.join(appBundle, 'Contents', 'Resources', 'nextjs');
const srcNodeModules = path.join(cleanDir, 'node_modules');
const destNodeModules = path.join(nextjsResources, 'node_modules');

if (!fs.existsSync(appBundle)) {
  console.warn('  ⚠ App bundle not found — skipping node_modules fix');
} else if (!fs.existsSync(srcNodeModules)) {
  console.warn('  ⚠ Clean standalone node_modules not found — skipping');
} else if (fs.existsSync(destNodeModules)) {
  console.log('  ✓ node_modules already present');
} else {
  console.log('  Copying node_modules into app bundle...');
  execSync(`cp -r "${srcNodeModules}" "${destNodeModules}"`, { stdio: 'inherit' });
  console.log('  ✓ node_modules copied into app bundle');
}

console.log('\n✅ Build complete — check the dist/ folder');
