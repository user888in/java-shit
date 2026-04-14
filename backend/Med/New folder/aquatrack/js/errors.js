// Error Handling and Logging

// Custom Error Classes
class StorageError extends Error {
    constructor(message) {
        super(message);
        this.name = 'StorageError';
    }
}

class NotificationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotificationError';
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Error Logger
const ErrorLogger = {
    logs: [],
    maxLogs: 100,

    log(error, context = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            name: error.name || 'Error',
            message: error.message,
            stack: error.stack,
            context,
            userAgent: navigator.userAgent
        };

        this.logs.push(logEntry);

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Log to console in development
        if (CONFIG.ENV === 'development') {
            console.error('Error logged:', logEntry);
        }

        // Store in localStorage for debugging
        try {
            localStorage.setItem('aquatrack_error_logs', JSON.stringify(this.logs.slice(-10)));
        } catch (e) {
            // Ignore if localStorage is full
        }
    },

    getLogs() {
        return this.logs;
    },

    clearLogs() {
        this.logs = [];
        try {
            localStorage.removeItem('aquatrack_error_logs');
        } catch (e) {
            // Ignore
        }
    }
};

// User-Friendly Error Messages
const ErrorMessages = {
    STORAGE_FULL: 'Storage is full. Please export your data and clear old entries.',
    STORAGE_CORRUPTED: 'Data corruption detected. Attempting to recover from backup.',
    NOTIFICATION_DENIED: 'Notifications are blocked. Enable them in your browser settings to receive reminders.',
    NOTIFICATION_UNSUPPORTED: 'Your browser doesn\'t support notifications.',
    INVALID_INPUT: 'Please enter a valid value.',
    NETWORK_ERROR: 'Network error. The app works offline, but some features may be limited.',
    GENERIC_ERROR: 'Something went wrong. Please try again.',
    SERVICE_WORKER_ERROR: 'Failed to register offline support. The app will still work but may not be available offline.'
};

// Error Handler
const ErrorHandler = {
    handle(error, context = {}) {
        ErrorLogger.log(error, context);

        // Determine user-friendly message
        let userMessage = ErrorMessages.GENERIC_ERROR;

        if (error instanceof StorageError) {
            if (error.message.includes('quota')) {
                userMessage = ErrorMessages.STORAGE_FULL;
            } else if (error.message.includes('corrupt')) {
                userMessage = ErrorMessages.STORAGE_CORRUPTED;
            }
        } else if (error instanceof NotificationError) {
            if (error.message.includes('denied')) {
                userMessage = ErrorMessages.NOTIFICATION_DENIED;
            } else if (error.message.includes('unsupported')) {
                userMessage = ErrorMessages.NOTIFICATION_UNSUPPORTED;
            }
        } else if (error instanceof ValidationError) {
            userMessage = error.message || ErrorMessages.INVALID_INPUT;
        }

        // Show error to user (will be implemented in ui.js)
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(userMessage, 'error');
        }

        return userMessage;
    },

    // Retry logic for transient failures
    async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }
};

// Global Error Boundary
window.addEventListener('error', (event) => {
    ErrorLogger.log(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    ErrorLogger.log(new Error(event.reason), {
        type: 'unhandledRejection'
    });
});

// Graceful Degradation Strategies
const GracefulDegradation = {
    // Fallback if localStorage is unavailable
    useMemoryStorage() {
        const memoryStorage = {};
        return {
            getItem: (key) => memoryStorage[key] || null,
            setItem: (key, value) => { memoryStorage[key] = value; },
            removeItem: (key) => { delete memoryStorage[key]; },
            clear: () => { Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]); }
        };
    },

    // Fallback if notifications are unavailable
    useFallbackNotifications() {
        return {
            show: (title, options) => {
                if (window.UI && window.UI.showToast) {
                    window.UI.showToast(options.body || title, 'info');
                }
            }
        };
    }
};

// Export error handling utilities
window.ErrorHandler = ErrorHandler;
window.ErrorLogger = ErrorLogger;
window.ErrorMessages = ErrorMessages;
window.GracefulDegradation = GracefulDegradation;
window.StorageError = StorageError;
window.NotificationError = NotificationError;
window.ValidationError = ValidationError;
