// HyperTizen Service Launcher Background Service
// This service runs in the background and tries to launch the main HyperTizen service

console.log('[ServiceLauncher] Background service started');

let launchInterval;
let launchAttempts = 0;
const MAX_ATTEMPTS = 5;

// Function to attempt launching the main service
function attemptServiceLaunch() {
    launchAttempts++;
    console.log(`[ServiceLauncher] Launch attempt ${launchAttempts}/${MAX_ATTEMPTS}`);
    
    try {
        // Check if main service exists
        if (typeof tizen !== 'undefined' && tizen.application) {
            try {
                tizen.application.getAppInfo('io.gh.reisxd.HyperTizen');
                console.log('[ServiceLauncher] Main HyperTizen service found');
                
                // Try to launch it
                tizen.application.launch(
                    'io.gh.reisxd.HyperTizen',
                    function() {
                        console.log('[ServiceLauncher] Successfully launched main HyperTizen service!');
                        clearInterval(launchInterval);
                        
                        // Notify the UI if possible
                        if (typeof webapis !== 'undefined' && webapis.avplay) {
                            // Send message to UI that service was launched
                            setTimeout(() => {
                                console.log('[ServiceLauncher] Service should now be running');
                            }, 2000);
                        }
                    },
                    function(error) {
                        console.log(`[ServiceLauncher] Failed to launch service: ${error.message}`);
                        
                        if (launchAttempts >= MAX_ATTEMPTS) {
                            console.log('[ServiceLauncher] Max attempts reached, stopping');
                            clearInterval(launchInterval);
                        }
                    }
                );
            } catch (serviceError) {
                console.log(`[ServiceLauncher] Service not found: ${serviceError.message}`);
                
                if (launchAttempts >= MAX_ATTEMPTS) {
                    console.log('[ServiceLauncher] Max attempts reached, service not available');
                    clearInterval(launchInterval);
                }
            }
        } else {
            console.log('[ServiceLauncher] Tizen API not available');
            clearInterval(launchInterval);
        }
    } catch (error) {
        console.log(`[ServiceLauncher] Unexpected error: ${error.message}`);
        
        if (launchAttempts >= MAX_ATTEMPTS) {
            console.log('[ServiceLauncher] Max attempts reached due to errors');
            clearInterval(launchInterval);
        }
    }
}

// Start trying to launch the service every 3 seconds
launchInterval = setInterval(attemptServiceLaunch, 3000);

// Also try immediately
setTimeout(attemptServiceLaunch, 1000);

// Handle service lifecycle events
if (typeof tizen !== 'undefined' && tizen.application) {
    // Listen for application events if available
    try {
        console.log('[ServiceLauncher] Setting up application event listeners');
        
        // Clean up when this service is terminated
        tizen.application.getCurrentApplication().addEventListener('lowmemory', function() {
            console.log('[ServiceLauncher] Low memory - cleaning up');
            if (launchInterval) {
                clearInterval(launchInterval);
            }
        });
        
    } catch (e) {
        console.log(`[ServiceLauncher] Could not set up event listeners: ${e.message}`);
    }
}

// Export functions for potential UI communication
if (typeof module !== 'undefined') {
    module.exports = {
        attemptServiceLaunch: attemptServiceLaunch,
        getAttemptCount: function() { return launchAttempts; },
        getMaxAttempts: function() { return MAX_ATTEMPTS; }
    };
}
