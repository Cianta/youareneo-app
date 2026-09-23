const { app, BrowserWindow, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const net = require('net');

// Prevent multiple instances — quit any duplicate immediately
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let nextProcess = null;
let serverPort = null;

const PREFERRED_PORT = 3579;

function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function tryPort(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.listen(port, '127.0.0.1', () => { srv.close(() => resolve(true)); });
  });
}

function waitForServer(port, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    function attempt() {
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) {
          return reject(new Error('Next.js server timed out after 60s'));
        }
        setTimeout(attempt, 500);
      });
      req.setTimeout(2000, () => { req.destroy(); });
    }
    attempt();
  });
}

function startNextServer(port) {
  const serverDir = app.isPackaged
    ? path.join(process.resourcesPath, 'nextjs')
    : path.join(__dirname, '..', '.next', 'standalone');

  const serverScript = path.join(serverDir, 'server.js');

  console.log('[electron] Starting Next.js from:', serverDir);
  console.log('[electron] Server script:', serverScript);

  nextProcess = spawn(process.execPath, [serverScript], {
    cwd: serverDir,
    env: {
      ...process.env,
      // ELECTRON_RUN_AS_NODE=1 makes the Electron binary behave as plain Node.js
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  });

  nextProcess.stdout?.on('data', d => console.log('[next]', d.toString().trim()));
  nextProcess.stderr?.on('data', d => console.error('[next]', d.toString().trim()));
  nextProcess.on('exit', code => console.log('[next] exited with code', code));
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      partition: 'persist:mission-control',
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// If a second instance tries to open, focus the existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  try {
    serverPort = (await tryPort(PREFERRED_PORT)) ? PREFERRED_PORT : await getFreePort();
    startNextServer(serverPort);
    console.log('[electron] Waiting for server on port', serverPort);
    await waitForServer(serverPort);
    console.log('[electron] Server ready, creating window');
    createWindow(serverPort);
  } catch (err) {
    console.error('[electron] Failed to start:', err);
    dialog.showErrorBox(
      'Mission Control – Startfehler',
      `Der interne Server konnte nicht gestartet werden.\n\n${err.message}\n\nBitte die App neu starten.`
    );
    app.quit();
  }

  app.on('activate', () => {
    if (!mainWindow && serverPort) createWindow(serverPort);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  nextProcess?.kill();
});
