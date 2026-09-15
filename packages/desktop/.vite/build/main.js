"use strict";
const electron = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
electron.ipcMain.handle("save-pdf", async (event, defaultFilename) => {
  const win = electron.BrowserWindow.fromWebContents(event.sender);
  if (!win) return { saved: false, error: "No window" };
  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: "A4"
  });
  const { canceled, filePath } = await electron.dialog.showSaveDialog(win, {
    defaultPath: typeof defaultFilename === "string" && defaultFilename ? defaultFilename : "document.pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });
  if (canceled || !filePath) return { saved: false };
  await fs.writeFile(filePath, pdf);
  return { saved: true, filePath };
});
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, `preload.js`),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  }
}
electron.app.whenReady().then(createWindow);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
