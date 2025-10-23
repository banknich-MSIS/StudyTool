const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
let backendProc;

function waitForHealth(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      fetch(url)
        .then((r) => (r.ok ? resolve() : Promise.reject()))
        .catch(() => {
          if (Date.now() - start > timeoutMs)
            return reject(new Error("Backend healthcheck timed out"));
          setTimeout(tick, 300);
        });
    };
    tick();
  });
}

async function createWindow() {
  // In a real build, compute a free port and spawn packaged backend binary.
  const backendPort = 8000; // TODO: dynamic free port + packaged path
  // Example spawn placeholder; adjust to packaged path in afterPack
  // backendProc = spawn(path.join(process.resourcesPath, 'backend', 'server-binary'), ['--port', backendPort]);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  await waitForHealth(`http://127.0.0.1:${backendPort}/api/health`).catch(
    () => {}
  );
  await win.loadFile(indexPath);

  win.on("closed", () => {
    if (backendProc) {
      try {
        backendProc.kill();
      } catch (_) {}
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
