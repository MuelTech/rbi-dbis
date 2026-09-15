import { app, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "node:fs/promises";
import path from "node:path";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Render the current page to a PDF and let the user save it with a
// pre-filled file name (Electron's print dialog can't set that name).
ipcMain.handle("save-pdf", async (event, defaultFilename: unknown) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { saved: false, error: "No window" };

  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: "A4",
  });

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath:
      typeof defaultFilename === "string" && defaultFilename
        ? defaultFilename
        : "document.pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (canceled || !filePath) return { saved: false };
  await fs.writeFile(filePath, pdf);
  return { saved: true, filePath };
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, `preload.js`),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
