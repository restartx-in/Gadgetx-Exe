const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
  const isDev = !app.isPackaged;
  const serverPath = isDev 
    ? path.join(__dirname, '../gadgetx-server/server.js')
    : path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'gadgetx-server', 'server.js');

  const dbPath = isDev
    ? path.join(__dirname, '../gadgetx-server/gadgetx.db')
    : path.join(app.getPath('userData'), 'gadgetx.db');

  // Copy DB to userData if it doesn't exist (packaged only)
  if (!isDev) {
    const fs = require('fs');
    const bundledDbPath = path.join(app.getAppPath(), '..', 'gadgetx-server', 'gadgetx.db');
    if (!fs.existsSync(dbPath) && fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, dbPath);
    }
  }

  console.log('Starting server at:', serverPath);
  
  serverProcess = fork(serverPath, [], {
    env: { 
      ...process.env, 
      PORT: '5000',
      DB_FILE: dbPath,
      ACCESS_TOKEN_SECRET: 'access123',
      REFRESH_TOKEN_SECRET: 'refresh123',
    },
    silent: false
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Gadget X Desktop",
    autoHideMenuBar: true
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../gadgetx/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
