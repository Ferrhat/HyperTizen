let client;
let deviceIP;
const upnpDevices = [];
let canEnable = false;

// Debug message functions
function addDebugMessage(message, type = 'info') {
    const debugContainer = document.getElementById('debugMessages');
    if (!debugContainer) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const messageDiv = document.createElement('div');
    messageDiv.className = `debug-message ${type}`;
    messageDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    debugContainer.appendChild(messageDiv);
    debugContainer.scrollTop = debugContainer.scrollHeight;
    
    // Keep only last 50 messages to prevent memory issues
    const messages = debugContainer.children;
    if (messages.length > 50) {
        debugContainer.removeChild(messages[0]);
    }
}

function clearDebugMessages() {
    const debugContainer = document.getElementById('debugMessages');
    if (debugContainer) {
        debugContainer.innerHTML = '';
        addDebugMessage('Debug messages cleared', 'info');
    }
}

function open() {
    addDebugMessage(`Attempting to connect to WebSocket at ws://${deviceIP}:8086`, 'info');
    client = new WebSocket(`ws://${deviceIP}:8086`);
    client.onopen = onOpen;
    client.onmessage = onMessage;
    client.onerror = (error) => {
        addDebugMessage('WebSocket connection error occurred, reloading page...', 'error');
        location.reload();
    }
    client.onclose = (event) => {
        addDebugMessage(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`, 'warning');
    }
}

const events = {
    SetConfig: 0,
    ReadConfig: 1,
    ReadConfigResult: 2,
    ScanUPnP: 3,
    UPnPScanResult: 4
}

function send(json) {
    if (client && client.readyState === WebSocket.OPEN) {
        const message = JSON.stringify(json);
        addDebugMessage(`Sending: ${message}`, 'info');
        client.send(message);
    } else {
        addDebugMessage('Cannot send message: WebSocket not connected', 'error');
    }
}

function onOpen() {
    addDebugMessage('WebSocket connection established successfully', 'info');
    document.getElementById('status').innerHTML = 'Connected';
    document.getElementById('enabled').onchange = (e) => {
        if (!canEnable) {
            addDebugMessage('Cannot enable: No device selected', 'warning');
            alert('Please select a device first');
            return e.target.checked = false;
        }
        const enabledValue = e.target.checked.toString();
        addDebugMessage(`Setting enabled state to: ${enabledValue}`, 'info');
        send({ event: events.SetConfig, key: 'enabled', value: enabledValue });
    }
    
    addDebugMessage('Reading RPC server configuration...', 'info');
    send({ event: events.ReadConfig, key: 'rpcServer' });
    
    addDebugMessage('Reading enabled state configuration...', 'info');
    send({ event: events.ReadConfig, key: 'enabled' });
    
    addDebugMessage('Starting UPnP device scan...', 'info');
    send({ event: events.ScanUPnP });
    
    setInterval(() => {
        addDebugMessage('Performing periodic UPnP scan...', 'info');
        send({ event: events.ScanUPnP });
    }, 10000);
}

function onMessage(data) {
    const msg = JSON.parse(data.data);
    addDebugMessage(`Received: ${data.data}`, 'info');
    
    switch(msg.Event) {
        case events.ReadConfigResult:
            if(msg.key === 'rpcServer' && !msg.error) {
                canEnable = true;
                addDebugMessage(`RPC Server configured: ${msg.value}`, 'info');
                document.getElementById('upnpDeviceTitle').innerText = `UPnP Devices (Currently Connected to ${msg.value})`;
            } else if(msg.key === 'enabled' && !msg.error) {
                const enabledState = msg.value === 'true';
                addDebugMessage(`Current enabled state: ${enabledState}`, 'info');
                document.getElementById('enabled').checked = enabledState;
            } else if (msg.error) {
                addDebugMessage(`Config read error for key '${msg.key}': ${msg.error}`, 'error');
            }
            break;
        case events.UPnPScanResult: {
            addDebugMessage(`UPnP scan completed. Found ${msg.devices.length} devices`, 'info');
            for (const device of msg.devices) {
                const url = device.UrlBase.indexOf('https') === 0 ? device.UrlBase.replace('https', 'wss') : device.UrlBase.replace('http', 'ws');

                if (upnpDevices.some(d => d.url === url)) {
                    continue;
                }
                
                const friendlyName = device.FriendlyName;
                addDebugMessage(`Adding UPnP device: ${friendlyName} at ${url}`, 'info');
                document.getElementById('upnpItems').innerHTML += `
                <div class="upnpItem" data-uri="${url}" data-friendlyName="${friendlyName}" tabindex="0" onclick="setRPC('${url}')">
                    <a>${friendlyName}</a>
                </div>
                `;
                upnpDevices.push({ url, friendlyName });
            }
            break;
        }
        default:
            addDebugMessage(`Unknown event received: ${msg.Event}`, 'warning');
    }
}

window.setRPC = (url) =>  {
    addDebugMessage(`Setting RPC server to: ${url}`, 'info');
    canEnable = true;
    send({ event: events.SetConfig, key: 'rpcServer', value: url });
}