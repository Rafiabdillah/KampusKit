const { app, BrowserWindow, Menu, dialog, screen, session, shell } = require('electron');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const SERVER_PORT = 39217;
const SERVER_HOST = '127.0.0.1';
const APP_ORIGIN = `http://${SERVER_HOST}:${SERVER_PORT}`;

let mainWindow = null;
let serverProcess = null;
let isQuitting = false;

function resourcesRoot() {
  return app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..');
}

function waitForServer(timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const attempt = () => {
      const req = http.get(`${APP_ORIGIN}/`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error('Server lokal tidak merespons.'));
          return;
        }
        setTimeout(attempt, 250);
      });
      req.setTimeout(2000, () => req.destroy());
    };

    attempt();
  });
}

function startServer() {
  const root = resourcesRoot();
  const entry = path.join(root, 'dist', 'server-pack.cjs');

  serverProcess = spawn(process.execPath, [entry], {
    cwd: root,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(SERVER_PORT),
      HOST: SERVER_HOST,
    },
  });

  serverProcess.stdout.on('data', (chunk) => console.log('[server]', chunk.toString().trim()));
  serverProcess.stderr.on('data', (chunk) => console.error('[server]', chunk.toString().trim()));

  serverProcess.on('exit', (code) => {
    if (!isQuitting && code !== 0) {
      console.error(`[server] exited with code ${code}`);
    }
  });
}

function stopServer() {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill();
  serverProcess = null;
}

function allowPermissions() {
  const allowed = new Set([
    'clipboard-read',
    'clipboard-sanitized-write',
    'geolocation',
    'media',
    'notifications',
  ]);

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(allowed.has(permission));
  });
}

function createWindow() {
  const { width: areaWidth, height: areaHeight } = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.min(1440, areaWidth);
  const height = Math.min(900, areaHeight);

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: Math.min(1024, width),
    minHeight: Math.min(680, height),
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    title: 'KampusKit',
    icon: path.join(resourcesRoot(), 'dist', 'icon-512.png'),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: 'persist:kampuskit',
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_ORIGIN)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`${APP_ORIGIN}/`);
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    allowPermissions();
    startServer();

    try {
      await waitForServer();
      createWindow();
    } catch (error) {
      dialog.showErrorBox(
        'KampusKit tidak dapat dimulai',
        [
          'Server lokal gagal dijalankan.',
          `Port ${SERVER_PORT} mungkin sedang dipakai aplikasi lain.`,
          'Tutup aplikasi tersebut lalu buka KampusKit kembali.',
          '',
          String(error && error.message ? error.message : error),
        ].join('\n')
      );
      app.quit();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopServer();
});

process.on('exit', stopServer);
