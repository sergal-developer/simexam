const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let win;
function createWindow() {
  win = new BrowserWindow({ 
    width: 360, 
    height: 740,
    minWidth: 360,
    minHeight: 740,
    autoHideMenuBar: true,
    titleBarOverlay: true
    });
  // load the dist folder from Angular
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, '/build/index.html'), // compiled verion of our app
      protocol: 'file:',
      slashes: false
    })
  );
  // The following is optional and will open the DevTools:
  // win.webContents.openDevTools()
  win.on('closed', () => {
    win = null;
  });
}
app.on('ready', createWindow);
// on macOS, closing the window doesn't quit the app
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});