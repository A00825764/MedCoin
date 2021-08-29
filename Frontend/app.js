const { app, BrowserWindow } = require('electron')
//const server = require('./server/server.js')

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        backgroundColor: '#000000'
    })
    win.loadFile('./html/index.html')
}

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') 
        app.quit()
})

app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) 
            createWindow()
    })
})

