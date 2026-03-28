"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  send: (channel, data) => electron.ipcRenderer.send(channel, data),
  on: (channel, callback) => electron.ipcRenderer.on(channel, (_event, ...args) => callback(...args)),
  invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args)
});
