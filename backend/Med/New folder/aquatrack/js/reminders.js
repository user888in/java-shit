// Intelligent Adaptive Reminder System

const Reminders = {
    notificationPermission: 'default',
    reminderInterval: null,
    standingInterval: null,
    lastWaterReminder: null,
    reminderHistory: [],
    complianceRate: 1.0,

    // Initialize reminder system
    async init() {
        // Check notification support
        if (!Utils.FeatureDetection.hasNotificationSupport()) {
            console.warn('Notifications not supported');
            return false;
        }

        this.notificationPermission = Notification.permission;

        // Start reminder system if enabled
        const settings = Storage.getSettings();
        if (settings.notificationsEnabled) {
            this.start();
        }

        return true;
    },

    // Request notification permission with user education
    async requestPermission() {
        if (!Utils.FeatureDetection.hasNotificationSupport()) {
            throw new NotificationError('Notifications unsupported');
        }

        if (this.notificationPermission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;

            if (permission === 'granted') {
                // Show welcome notification
                this.showNotification('AquaTrack Reminders Enabled', {
                    body: 'You\'ll receive gentle reminders to stay hydrated!',
                    icon: '/assets/icons/icon-192.png'
                });
                return true;
            } else if (permission === 'denied') {
                throw new NotificationError('Notifications denied');
            }

            return false;
        } catch (error) {
            ErrorHandler.handle(new NotificationError('Failed to request permission: ' + error.message));
            return false;
        }
    },

    // Show notification with fallback
    showNotification(title, options = {}) {
        const settings = Storage.getSettings();

        // Check if notifications are enabled
        if (!settings.notificationsEnabled) {
            return;
        }

        // Try browser notification first
        if (this.notificationPermission === 'granted') {
            try {
                const notification = new Notification(title, {
                    icon: '/assets/icons/icon-192.png',
                    badge: '/assets/icons/icon-72.png',
                    vibrate: [200, 100, 200],
                    ...options
                });

                // Auto-close after 5 seconds
                setTimeout(() => notification.close(), 5000);

                return notification;
            } catch (error) {
                console.warn('Failed to show notification:', error);
            }
        }

        // Fallback to in-app toast
        if (window.UI && window.UI.showToast) {
            window.UI.showToast(options.body || title, 'info');
        }
    },

    // Calculate adaptive reminder frequency
    calculateAdaptiveFrequency() {
        const settings = Storage.getSettings();
        let baseFrequency = settings.reminderFrequency;

        // Adjust based on compliance rate
        if (this.complianceRate > 0.8) {
            // User is compliant, reduce frequency slightly
            baseFrequency = Math.min(baseFrequency * 1.2, CONFIG.CONSTRAINTS.reminderFrequency.max);
        } else if (this.complianceRate < 0.5) {
            // User is not compliant, increase frequency
            baseFrequency = Math.max(baseFrequency * 0.8, CONFIG.CONSTRAINTS.reminderFrequency.min);
        }

        return Math.round(baseFrequency);
    },

    // Update compliance rate based on user behavior
    updateComplianceRate() {
        const recentHistory = this.reminderHistory.slice(-10);
        if (recentHistory.length === 0) return;

        const compliedCount = recentHistory.filter(h => h.complied).length;
        this.complianceRate = compliedCount / recentHistory.length;
    },

    // Check if should send reminder now
    shouldSendReminder() {
        const settings = Storage.getSettings();

        // Check if within wake/sleep schedule
        if (!Utils.DateUtils.isAwakeTime(settings.wakeTime, settings.sleepTime)) {
            return false;
        }

        // Check if user is actively using the app (heuristic DND)
        if (this.isUserActive()) {
            return false;
        }

        // Check time since last reminder
        if (this.lastWaterReminder) {
            const minutesSinceLastReminder = (Date.now() - this.lastWaterReminder) / 60000;
            const adaptiveFrequency = this.calculateAdaptiveFrequency();

            if (minutesSinceLastReminder < adaptiveFrequency) {
                return false;
            }
        }

        return true;
    },

    // Detect if user is actively using the app
    isUserActive() {
        // Check if last water intake was within last 5 minutes
        const todayData = Storage.getTodayData();
        if (todayData.waterIntake.length > 0) {
            const lastIntake = todayData.waterIntake[todayData.waterIntake.length - 1];
            const minutesSinceIntake = (Date.now() - new Date(lastIntake.timestamp)) / 60000;

            if (minutesSinceIntake < 5) {
                return true;
            }
        }

        return false;
    },

    // Get context-aware message
    getContextAwareMessage() {
        const hour = new Date().getHours();
        const progress = Analytics.getWaterProgress();

        const messages = {
            morning: [
                '🌅 Good morning! Start your day with some water',
                '☀️ Rise and hydrate! Your body needs water',
                '🌤️ Morning hydration time!'
            ],
            afternoon: [
                '🌞 Afternoon reminder: Time to drink water',
                '💧 Stay hydrated this afternoon',
                '⏰ Don\'t forget your water break'
            ],
            evening: [
                '🌆 Evening hydration check!',
                '🌙 Wind down with some water',
                '✨ Almost bedtime - have some water'
            ]
        };

        let timeMessages;
        if (hour < 12) {
            timeMessages = messages.morning;
        } else if (hour < 18) {
            timeMessages = messages.afternoon;
        } else {
            timeMessages = messages.evening;
        }

        // Add progress-based messages
        if (progress < 30) {
            timeMessages.push('🚀 Let\'s get started on that water goal!');
        } else if (progress >= 80) {
            timeMessages.push('🎯 Almost there! Just a bit more water');
        }

        return timeMessages[Math.floor(Math.random() * timeMessages.length)];
    },

    // Send water reminder
    sendWaterReminder() {
        if (!this.shouldSendReminder()) {
            return;
        }

        const message = this.getContextAwareMessage();
        const remaining = Storage.getSettings().dailyWaterGoal - Analytics.getTotalWaterToday();

        this.showNotification('Time to Hydrate! 💧', {
            body: message + (remaining > 0 ? ` (${Utils.NumberUtils.formatWaterAmount(remaining)} to go)` : ''),
            tag: 'water-reminder',
            requireInteraction: false
        });

        this.lastWaterReminder = Date.now();

        // Track reminder
        this.reminderHistory.push({
            timestamp: Date.now(),
            type: 'water',
            complied: false // Will be updated if user logs water soon
        });
    },

    // Send standing reminder
    sendStandingReminder() {
        const settings = Storage.getSettings();

        // Check if within wake/sleep schedule
        if (!Utils.DateUtils.isAwakeTime(settings.wakeTime, settings.sleepTime)) {
            return;
        }

        this.showNotification('Time to Stand! 🧍', {
            body: 'Take a quick break and stretch your legs',
            tag: 'standing-reminder',
            requireInteraction: false
        });
    },

    // Start reminder system
    start() {
        this.stop(); // Clear any existing intervals

        const settings = Storage.getSettings();

        // Water reminders
        const waterFrequency = this.calculateAdaptiveFrequency();
        this.reminderInterval = setInterval(() => {
            this.sendWaterReminder();
            this.updateComplianceRate();
        }, waterFrequency * 60 * 1000);

        // Standing reminders
        this.standingInterval = setInterval(() => {
            this.sendStandingReminder();
        }, settings.standingReminderInterval * 60 * 1000);

        console.log('Reminder system started');
    },

    // Stop reminder system
    stop() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }

        if (this.standingInterval) {
            clearInterval(this.standingInterval);
            this.standingInterval = null;
        }

        console.log('Reminder system stopped');
    },

    // Restart reminder system (when settings change)
    restart() {
        this.start();
    },

    // Mark last reminder as complied
    markComplied() {
        if (this.reminderHistory.length > 0) {
            const lastReminder = this.reminderHistory[this.reminderHistory.length - 1];
            const timeSinceReminder = (Date.now() - lastReminder.timestamp) / 60000;

            // If user logged water within 10 minutes of reminder, mark as complied
            if (timeSinceReminder < 10) {
                lastReminder.complied = true;
                this.updateComplianceRate();
            }
        }
    }
};

// Export Reminders
window.Reminders = Reminders;
