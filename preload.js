const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  notify: (title, body) => {
    console.log("Preload: Sending notification to main process", title, body);
    ipcRenderer.send("notify", title, body);
  }
});

// Log when preload script loads
console.log("Preload script loaded successfully");