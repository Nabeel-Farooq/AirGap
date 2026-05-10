const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
} = require('electron')

const isDevMode = require('electron-is-dev')
const {
  CapacitorSplashScreen,
  configCapacitor,
} = require('@capacitor/electron')

const path = require('path')

// Window references
let mainWindow = null
let splashScreen = null

// Enable/disable splash screen
const USE_SPLASH_SCREEN = false

// Shared menu items
const editSubmenu = [
  { role: 'minimize' },
  { type: 'separator' },
  { role: 'cut' },
  { role: 'copy' },
  { role: 'paste' },
]

// Production menu
const productionMenu = Menu.buildFromTemplate([
  {
    role: 'appMenu',
    submenu: [{ role: 'quit' }],
  },
  {
    role: 'window',
    submenu: editSubmenu,
  },
])

// Development menu
const developmentMenu = Menu.buildFromTemplate([
  {
    role: 'appMenu',
    submenu: [
      { role: 'toggleDevTools' },
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'quit' },
    ],
  },
  {
    role: 'window',
    submenu: editSubmenu,
  },
])

function registerShortcuts() {
  const blockedShortcuts = [
    'CommandOrControl+R',
    'CommandOrControl+Shift+R',
    'F5',
  ]

  blockedShortcuts.forEach((shortcut) => {
    globalShortcut.register(shortcut, () => {})
  })
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll()
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 920,
    show: false,

    icon: path.join(
      __dirname,
      'resources',
      'icons',
      'icon.png'
    ),

    webPreferences: {
      preload: path.join(
        __dirname,
        'node_modules',
        '@capacitor',
        'electron',
        'dist',
        'electron-bridge.js'
      ),

      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  configCapacitor(mainWindow)

  // Set app menu
  Menu.setApplicationMenu(
    isDevMode ? developmentMenu : productionMenu
  )

  if (isDevMode) {
    mainWindow.webContents.openDevTools({
      mode: 'detach',
    })
  }

  if (USE_SPLASH_SCREEN) {
    splashScreen = new CapacitorSplashScreen(
      mainWindow,
      {}
    )

    splashScreen.init(false)
  } else {
    await mainWindow.loadURL(
      `file://${__dirname}/app/index.html`
    )

    mainWindow.once('ready-to-show', () => {
      mainWindow.show()
    })
  }

  mainWindow.on('focus', registerShortcuts)

  mainWindow.on('blur', unregisterShortcuts)

  mainWindow.on('closed', () => {
    unregisterShortcuts()
    mainWindow = null
  })
}

// App ready
app.whenReady().then(createWindow)

// macOS behavior
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Quit app when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup shortcuts before quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
