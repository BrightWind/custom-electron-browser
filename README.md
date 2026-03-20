# custom-electron-browser

Minimal Electron scaffold with a secure-by-default preload bridge for native access on Windows.

## What this includes

- `BrowserWindow` configured with `contextIsolation: true`, `nodeIntegration: false`, a preload script, and Electron sandboxing enabled.
- A preload API exposed with `contextBridge` so the renderer can request a small set of native capabilities without direct Node.js access.
- IPC handlers in the main process for:
	- `appInfo`
	- `platform`
	- `chooseDirectory`
	- `listDirectory`
	- `readTextFile`
	- `openExternal`
- A simple renderer UI that demonstrates directory-scoped native file access and opening external URLs.

## Native access model

This scaffold does not expose unrestricted file system access to the renderer.

- The renderer must call `chooseDirectory()` first.
- The main process stores that approved directory for the window.
- `listDirectory()` and `readTextFile()` only work for paths inside the approved directory.
- `readTextFile()` limits previews to files up to 1 MB.
- `openExternal()` only allows `http`, `https`, and `mailto` URLs.

## Getting started

```bash
npm install
npm run start
```

For local development, `npm run dev` starts the same Electron entry point.

## Build installer (Windows)

This project is configured with `electron-builder` for Windows NSIS installer output.

```bash
npm run dist
```

The installer and unpacked artifacts are written to the `release/` directory.

If you only want to package the app without creating an installer:

```bash
npm run pack
```

## Project structure

```text
.
|-- package.json
|-- src/
|   |-- index.html
|   |-- main.js
|   |-- preload.js
|   |-- renderer.js
|   `-- styles.css
`-- README.md
```

## Preload API

The renderer receives `window.nativeApi` with these methods:

```js
window.nativeApi.appInfo()
window.nativeApi.platform()
window.nativeApi.chooseDirectory()
window.nativeApi.listDirectory(directoryPath)
window.nativeApi.readTextFile(filePath)
window.nativeApi.openExternal(url)
```

The project uses plain JavaScript only. No TypeScript or extra runtime dependencies are included.

# Road Map