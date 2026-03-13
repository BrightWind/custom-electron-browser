const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nativeApi', {
  appInfo: () => ipcRenderer.invoke('native:app-info'),
  platform: () => ipcRenderer.invoke('native:platform'),
  chooseDirectory: () => ipcRenderer.invoke('native:choose-directory'),
  listDirectory: (directoryPath) => ipcRenderer.invoke('native:list-directory', directoryPath),
  readTextFile: (filePath) => ipcRenderer.invoke('native:read-text-file', filePath),
  openExternal: (targetUrl) => ipcRenderer.invoke('native:open-external', targetUrl),
  openBrowserPane: (url, itemId, barBottom) => ipcRenderer.invoke('browser-pane:open', url, itemId, barBottom),
  closeBrowserPane: () => ipcRenderer.invoke('browser-pane:close'),
  resizeBrowserPane: (barBottom) => ipcRenderer.invoke('browser-pane:resize', barBottom),
  reloadBrowserPane: (itemId, ignoreCache = false) => ipcRenderer.invoke('browser-pane:reload', itemId, ignoreCache),
  destroyBrowserPane: (itemId) => ipcRenderer.invoke('browser-pane:destroy', itemId),
  destroyAllBrowserPanes: () => ipcRenderer.invoke('browser-pane:destroy-all')
});