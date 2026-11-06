// main.js - Electron MAIN process
// This file starts the app and creates the desktop window.
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'iMyBook - Reading Book Application',
    webPreferences: {
      // Security: the web pages cannot use Node.js directly
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);              // hide the default File/Edit menu
  win.loadFile(path.join(__dirname, 'index.html')); // first page = Book Search
}

// Create the window when Electron is ready
app.whenReady().then(() => {
  createWindow();
  // macOS: re-create a window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
