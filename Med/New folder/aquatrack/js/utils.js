// Utility Functions

// Date/Time Helpers
const DateUtils = {
    // Get current date in YYYY-MM-DD format
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    },

    // Get current timestamp in ISO format
    getCurrentTimestamp() {
        return new Date().toISOString();
    },

    // Format time as HH:MM
    formatTime(date) {
        return date.toTimeString().slice(0, 5);
    },

    // Parse time string (HH:MM) to minutes since midnight
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },

    // Convert minutes since midnight to HH:MM
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    },

    // Get relative time (e.g., "2 hours ago")
    getRelativeTime(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    },

    // Check if current time is within wake/sleep schedule
    isAwakeTime(wakeTime, sleepTime) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const wakeMinutes = this.timeToMinutes(wakeTime);
        const sleepMinutes = this.timeToMinutes(sleepTime);

        if (wakeMinutes < sleepMinutes) {
            return currentMinutes >= wakeMinutes && currentMinutes < sleepMinutes;
        } else {
            // Handle overnight sleep (e.g., 23:00 to 07:00)
            return currentMinutes >= wakeMinutes || currentMinutes < sleepMinutes;
        }
    },

    // Check if it's a new day (for midnight rollover)
    isNewDay(lastDate) {
        return this.getCurrentDate() !== lastDate;
    }
};

// Validation Functions
const Validators = {
    isValidWaterAmount(amount) {
        return amount >= CONFIG.CONSTRAINTS.waterAmount.min &&
            amount <= CONFIG.CONSTRAINTS.waterAmount.max;
    },

    isValidWaterGoal(goal) {
        return goal >= CONFIG.CONSTRAINTS.waterGoal.min &&
            goal <= CONFIG.CONSTRAINTS.waterGoal.max;
    },

    isValidTime(timeStr) {
        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return regex.test(timeStr);
    },

    isValidReminderFrequency(freq) {
        return freq >= CONFIG.CONSTRAINTS.reminderFrequency.min &&
            freq <= CONFIG.CONSTRAINTS.reminderFrequency.max;
    },

    isValidExerciseDuration(duration) {
        return duration >= CONFIG.CONSTRAINTS.exerciseDuration.min &&
            duration <= CONFIG.CONSTRAINTS.exerciseDuration.max;
    },

    isValidExerciseType(type) {
        return type && type.trim().length > 0;
    }
};

// Number Formatting
const NumberUtils = {
    // Format number with commas (1000 -> 1,000)
    formatNumber(num) {
        return num.toLocaleString();
    },

    // Format water amount (2000ml -> 2L)
    formatWaterAmount(ml) {
        if (ml >= 1000) {
            return `${(ml / 1000).toFixed(1)}L`;
        }
        return `${ml}ml`;
    },

    // Calculate percentage
    calculatePercentage(current, goal) {
        if (goal === 0) return 0;
        return Math.min(Math.round((current / goal) * 100), 100);
    },

    // Clamp number between min and max
    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }
};

// UUID Generation
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Deep Clone
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Debounce Function
const debounce = (func, delay = CONFIG.DEBOUNCE_DELAY) => {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

// Throttle Function
const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Browser Feature Detection
const FeatureDetection = {
    hasNotificationSupport() {
        return 'Notification' in window;
    },

    hasServiceWorkerSupport() {
        return 'serviceWorker' in navigator;
    },

    hasLocalStorageSupport() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }
};

// Color Utilities
const ColorUtils = {
    // Convert hex to rgba
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

// Export utilities
window.Utils = {
    DateUtils,
    Validators,
    NumberUtils,
    generateUUID,
    deepClone,
    debounce,
    throttle,
    FeatureDetection,
    ColorUtils
};
