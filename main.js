const { app, BrowserWindow, Tray, nativeImage, Menu, ipcMain } = require('electron')
const path = require('path')
const config = require('./config.json');

let mainWindow = null
let tray = null

function createWindow () {
  mainWindow = new BrowserWindow({
    width: config.app_width,
    height: config.app_height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.setAlwaysOnTop(true)
  mainWindow.loadFile('index.html')

  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })

  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'icon.png')))
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })

  // Create the context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow.show()
      }
    },
    {
      label: 'Hide',
      click: () => {
        mainWindow.hide()
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        const windows = BrowserWindow.getAllWindows()
        windows.forEach((win) => {
          win.close()
        })
        app.exit()
      }
    }
  ])

  tray.setToolTip('My App')
  tray.setContextMenu(contextMenu)
}

app.on('ready', () => {
  createWindow()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.exit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
})