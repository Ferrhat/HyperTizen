// Function to safely add debug messages (will be available after wsClient.js loads)
function safeAddDebugMessage(message, type = 'info') {
    if (typeof addDebugMessage === 'function') {
        addDebugMessage(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

let launchAttempts = 0;
const maxAttempts = 10;

const interval = setInterval(() => {
    launchAttempts++;
    
    try {
        safeAddDebugMessage(`🔍 Checking for HyperTizen service... (attempt ${launchAttempts}/${maxAttempts})`, 'info');
        tizen.application.getAppInfo('io.gh.reisxd.HyperTizen');
        
        safeAddDebugMessage('📱 HyperTizen service found, attempting to launch...', 'info');
        tizen.application.launch(
            'io.gh.reisxd.HyperTizen',
            function () {
                safeAddDebugMessage('✅ HyperTizen service launched successfully!', 'info');
                safeAddDebugMessage('🔌 WebSocket server should now be available on port 8086', 'info');
                clearInterval(interval);
            },
            function (e) {
                safeAddDebugMessage(`❌ Failed to launch HyperTizen service: ${e.message}`, 'error');
                safeAddDebugMessage('🔄 Will retry in 1 second...', 'warning');
            }
        );
    } catch (e) {
        safeAddDebugMessage(`⚠️ HyperTizen service not found: ${e.message}`, 'warning');
        
        if (launchAttempts >= maxAttempts) {
            safeAddDebugMessage(`❌ Stopped trying after ${maxAttempts} attempts`, 'error');
            safeAddDebugMessage('💡 The HyperTizen service may not be installed or accessible', 'error');
            clearInterval(interval);
        }
    }    
}, 1000);