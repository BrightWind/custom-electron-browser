const { app, BrowserWindow, WebContentsView, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const approvedDirectories = new Map();
const MAX_TEXT_FILE_SIZE_BYTES = 1024 * 1024;

let mainWindow = null;
const browserPaneViews = new Map(); // itemId -> WebContentsView
let activePaneItemId = null;
let lastBarBottom = 0;

function setupPopupWindow(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    let parsed;
    try { parsed = new URL(url); } catch { return { action: 'deny' }; }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      }
    };
  });
  win.webContents.on('did-create-window', (newWin) => {
    setupPopupWindow(newWin);
  });
  win.webContents.on('will-navigate', (event, url) => {
    let parsed;
    try { parsed = new URL(url); } catch { event.preventDefault(); return; }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createPaneView() {
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  view.webContents.setWindowOpenHandler(({ url }) => {
    let parsed;
    try { parsed = new URL(url); } catch { return { action: 'deny' }; }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      }
    };
  });
  view.webContents.on('did-create-window', (newWin) => {
    setupPopupWindow(newWin);
  });
  view.webContents.on('will-navigate', (event, url) => {
    let parsed;
    try { parsed = new URL(url); } catch { event.preventDefault(); return; }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  return view;
}

function isBrowserPaneVisible() {
  if (!mainWindow || activePaneItemId === null) return false;
  const view = browserPaneViews.get(activePaneItemId);
  return !!(view && mainWindow.contentView.children.includes(view));
}

function openBrowserPane(url, itemId, barBottom) {
  if (!mainWindow) return;
  lastBarBottom = barBottom;
  // Detach the previously active view when switching to a different item
  if (activePaneItemId !== null && activePaneItemId !== itemId) {
    const prev = browserPaneViews.get(activePaneItemId);
    if (prev && mainWindow.contentView.children.includes(prev)) {
      mainWindow.contentView.removeChildView(prev);
    }
  }
  activePaneItemId = itemId;
  let view = browserPaneViews.get(itemId);
  if (!view) {
    view = createPaneView();
    browserPaneViews.set(itemId, view);
    view.webContents.loadURL(url);
  }
  const [w, h] = mainWindow.getContentSize();
  const y = Math.round(barBottom);
  view.setBounds({ x: 0, y, width: w, height: Math.max(0, h - y) });
  if (!mainWindow.contentView.children.includes(view)) {
    mainWindow.contentView.addChildView(view);
  }
}

function closeBrowserPane() {
  if (activePaneItemId === null) return;
  const view = browserPaneViews.get(activePaneItemId);
  if (view && mainWindow && mainWindow.contentView.children.includes(view)) {
    mainWindow.contentView.removeChildView(view);
  }
  activePaneItemId = null;
}

function resizeBrowserPane(barBottom) {
  if (!isBrowserPaneVisible() || !mainWindow) return;
  lastBarBottom = barBottom;
  const view = browserPaneViews.get(activePaneItemId);
  const [w, h] = mainWindow.getContentSize();
  const y = Math.round(barBottom);
  view.setBounds({ x: 0, y, width: w, height: Math.max(0, h - y) });
}

function destroyBrowserPane(itemId) {
  const view = browserPaneViews.get(itemId);
  if (!view) return;
  if (mainWindow && mainWindow.contentView.children.includes(view)) {
    mainWindow.contentView.removeChildView(view);
  }
  view.webContents.close();
  browserPaneViews.delete(itemId);
  if (activePaneItemId === itemId) activePaneItemId = null;
}

function destroyAllBrowserPanes() {
  for (const itemId of [...browserPaneViews.keys()]) {
    destroyBrowserPane(itemId);
  }
}

function isWithinDirectory(rootPath, targetPath) {
  const relativePath = path.relative(rootPath, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function getApprovedDirectory(webContentsId) {
  return approvedDirectories.get(webContentsId) || null;
}

function resolveApprovedPath(webContentsId, requestedPath) {
  if (typeof requestedPath !== 'string' || requestedPath.trim() === '') {
    throw new Error('A path is required.');
  }

  const approvedDirectory = getApprovedDirectory(webContentsId);

  if (!approvedDirectory) {
    throw new Error('Choose a directory before requesting file system access.');
  }

  const resolvedPath = path.resolve(requestedPath);

  if (!isWithinDirectory(approvedDirectory, resolvedPath)) {
    throw new Error('Requested path is outside the approved directory.');
  }

  return resolvedPath;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && !input.alt && !input.meta) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('resize', () => {
    if (!isBrowserPaneVisible() || activePaneItemId === null) return;
    const view = browserPaneViews.get(activePaneItemId);
    if (!view) return;
    const [w, h] = mainWindow.getContentSize();
    const y = Math.round(lastBarBottom);
    view.setBounds({ x: 0, y, width: w, height: Math.max(0, h - y) });
  });

  mainWindow.webContents.on('destroyed', () => {
    approvedDirectories.delete(mainWindow.webContents.id);
  });

  mainWindow.on('closed', () => {
    destroyAllBrowserPanes();
    mainWindow = null;
  });
}

ipcMain.handle('native:app-info', () => ({
  name: app.getName(),
  version: app.getVersion(),
  userDataPath: app.getPath('userData')
}));

ipcMain.handle('native:platform', () => process.platform);

ipcMain.handle('native:choose-directory', async (event) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(browserWindow, {
    title: 'Choose a directory',
    properties: ['openDirectory']
  });

  if (result.canceled || !result.filePaths[0]) {
    return null;
  }

  const selectedPath = path.resolve(result.filePaths[0]);
  approvedDirectories.set(event.sender.id, selectedPath);

  return {
    name: path.basename(selectedPath) || selectedPath,
    path: selectedPath
  };
});

ipcMain.handle('native:list-directory', async (event, directoryPath) => {
  const resolvedDirectory = resolveApprovedPath(event.sender.id, directoryPath);
  const directoryEntries = await fs.readdir(resolvedDirectory, { withFileTypes: true });

  return directoryEntries
    .map((entry) => ({
      name: entry.name,
      path: path.join(resolvedDirectory, entry.name),
      kind: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other'
    }))
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'directory' ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
});

ipcMain.handle('native:read-text-file', async (event, filePath) => {
  const resolvedFilePath = resolveApprovedPath(event.sender.id, filePath);
  const fileStat = await fs.stat(resolvedFilePath);

  if (!fileStat.isFile()) {
    throw new Error('Only files can be read.');
  }

  if (fileStat.size > MAX_TEXT_FILE_SIZE_BYTES) {
    throw new Error('Only text files up to 1 MB can be previewed.');
  }

  const content = await fs.readFile(resolvedFilePath, 'utf8');

  return {
    path: resolvedFilePath,
    content
  };
});

ipcMain.handle('native:open-external', async (_event, targetUrl) => {
  if (typeof targetUrl !== 'string' || targetUrl.trim() === '') {
    throw new Error('A URL is required.');
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    throw new Error('Invalid URL.');
  }

  if (!['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
    throw new Error('Only http, https, and mailto URLs are allowed.');
  }

  await shell.openExternal(parsedUrl.toString());
  return true;
});

ipcMain.handle('browser-pane:open', (_event, url, itemId, barBottom) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid URL.');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only http and https URLs are allowed in the browser pane.');
  }
  openBrowserPane(parsedUrl.toString(), itemId, barBottom);
  return true;
});

ipcMain.handle('browser-pane:close', () => {
  closeBrowserPane();
  return true;
});

ipcMain.handle('browser-pane:resize', (_event, barBottom) => {
  resizeBrowserPane(barBottom);
  return true;
});

ipcMain.handle('browser-pane:destroy', (_event, itemId) => {
  destroyBrowserPane(itemId);
  return true;
});

ipcMain.handle('browser-pane:destroy-all', () => {
  destroyAllBrowserPanes();
  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});