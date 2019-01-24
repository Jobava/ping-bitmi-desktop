const electron = require('electron');
const url = require('url');
const path = require('path');
const ip = require('ip');
const fetch = require('electron-fetch').default;

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;

process.env.NODE_ENV = 'production';
//process.env.NODE_ENV = 'development';

const ipComponents = ip.address().split(".").slice(0, 3);

const pingBitmis = () => {
    const ips_to_ping = [...Array(255).keys()].map((i) => "http://" + ipComponents.join(".") + "." + i.toString());
    const errors = [];
    for (const i of ips_to_ping) {
        console.log("Pinging " + i);
        fetch(i)
        .then(r => r.text())
        .then(b => {
            let title_line = b.split(/\n/).filter((x) => x.includes("<title>"));
            if (title_line.length >= 1) {
                title_line = title_line[0].toLowerCase();
                if (title_line.includes("bitmi")) {
                    console.log("Found a bitmit at: " + i);
                    mainWindow.webContents.send('item:add', i);
                } else  {
                    console.log("Not a bitmi: " + i);
                }
            }
        })
        .catch(e => { errors.push(e.message); });
    }
}

app.on('ready', () => {
    mainWindow = new BrowserWindow({});
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file',
        slashes: true
    }));
    mainWindow.on('closed', () => { app.quit(); });
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

ipcMain.on('ping', () => {
    console.log("From ipcMain: ping");
    mainWindow.webContents.send('item:clear');
    pingBitmis();
});

const mainMenuTemplate = []

if(process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

if(process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push(
        {
            label: 'Developer Tools',
            submenu: [
                {
                    label: 'Toggle DevTools',
                    accelerator: process.platform == 'darwin' ? 'Command+I': 'Ctrl+I',
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                },
                {
                    role: 'reload'
                }
            ]
        }
    )
}
