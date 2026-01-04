const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile("index.html");
  
  // Open DevTools for debugging (remove in production)
   //mainWindow.webContents.openDevTools();
}

// Handle notification requests from renderer
ipcMain.on("notify", (event, title, body) => {
  console.log("Received notification request:", title, body);
  
  // Check if notifications are supported
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title,
      body: body,
      icon: path.join(__dirname, 'icon.png'), // Optional: add an icon
      silent: false
    });
    
    notification.show();
    
    notification.on('click', () => {
      console.log('Notification clicked');
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } else {
    console.log("Notifications are not supported on this system");
  }
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