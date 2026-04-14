// Main Application Controller

const App = {
    initialized: false,

    // Initialize application
    async init() {
        if (this.initialized) return;

        try {
            // Show loading
            UI.showLoading();

            // Initialize storage
            const storageInit = Storage.init();
            if (!storageInit) {
                throw new Error('Failed to initialize storage');
            }

            // Initialize UI
            UI.init();

            // Check if first launch
            const onboardingComplete = localStorage.getItem(CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETE);
            if (!onboardingComplete) {
                this.showOnboarding();
                UI.hideLoading();
                return;
            }

            // Initialize reminders
            await Reminders.init();

            // Setup event handlers
            this.setupEventHandlers();

            // Register service worker
            this.registerServiceWorker();

            // Initial UI update
            UI.updateAll();

            // Check for new day
            this.checkNewDay();

            // Setup visibility change handler
            this.setupVisibilityHandler();

            // Hide loading
            UI.hideLoading();

            this.initialized = true;

            console.log('AquaTrack initialized successfully');
        } catch (error) {
            ErrorHandler.handle(error);
            UI.hideLoading();
        }
    },

    // Setup event handlers
    setupEventHandlers() {
        // Water intake buttons
        document.querySelectorAll('.quick-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                this.addWater(amount);
            });
        });

        // Custom water amount
        const customBtn = document.getElementById('custom-water-btn');
        const customInput = document.getElementById('custom-water-input');
        if (customBtn && customInput) {
            customBtn.addEventListener('click', () => {
                const amount = parseInt(customInput.value);
                if (amount && amount > 0) {
                    this.addWater(amount);
                    customInput.value = '';
                }
            });
        }

        // Undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoLastWater());
        }

        // Exercise form
        const exerciseForm = document.getElementById('exercise-form');
        if (exerciseForm) {
            exerciseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addExercise();
            });
        }

        // Standing break button
        const standingBtn = document.getElementById('standing-break-btn');
        if (standingBtn) {
            standingBtn.addEventListener('click', () => this.addStandingBreak());
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => UI.showModal('settings-modal'));
        }

        // Settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        // Export data button
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Import data button
        const importBtn = document.getElementById('import-data-btn');
        const importInput = document.getElementById('import-data-input');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', (e) => this.importData(e));
        }

        // Notification permission button
        const notifBtn = document.getElementById('enable-notifications-btn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => this.enableNotifications());
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) UI.hideModal(modal.id);
            });
        });
    },

    // Add water intake
    addWater(amount) {
        const entry = Storage.addWaterIntake(amount);
        if (entry) {
            UI.updateAll();
            UI.showToast(`Added ${Utils.NumberUtils.formatWaterAmount(amount)}`, 'success');
            UI.announce(`Added ${amount} milliliters of water`);

            // Mark reminder as complied
            Reminders.markComplied();
        }
    },

    // Undo last water intake
    undoLastWater() {
        const removed = Storage.removeLastWaterIntake();
        if (removed) {
            UI.updateAll();
            UI.showToast(`Removed ${Utils.NumberUtils.formatWaterAmount(removed.amount)}`, 'info');
            UI.announce(`Removed last water entry`);
        } else {
            UI.showToast('No water entries to undo', 'warning');
        }
    },

    // Add exercise
    addExercise() {
        const typeInput = document.getElementById('exercise-type');
        const durationInput = document.getElementById('exercise-duration');
        const notesInput = document.getElementById('exercise-notes');

        const type = typeInput.value.trim();
        const duration = parseInt(durationInput.value);
        const notes = notesInput.value.trim();

        const entry = Storage.addExercise(type, duration, notes);
        if (entry) {
            UI.updateAll();
            UI.showToast(`Logged ${type} for ${duration} minutes`, 'success');
            UI.announce(`Logged ${type} exercise for ${duration} minutes`);

            // Clear form
            typeInput.value = '';
            durationInput.value = '';
            notesInput.value = '';
        }
    },

    // Add standing break
    addStandingBreak() {
        const entry = Storage.addStandingBreak();
        if (entry) {
            UI.updateAll();
            UI.showToast('Standing break logged!', 'success');
            UI.announce('Standing break logged');
        }
    },

    // Save settings
    saveSettings() {
        const form = document.getElementById('settings-form');
        const formData = new FormData(form);

        const newSettings = {
            dailyWaterGoal: parseInt(formData.get('waterGoal')),
            wakeTime: formData.get('wakeTime'),
            sleepTime: formData.get('sleepTime'),
            reminderFrequency: parseInt(formData.get('reminderFrequency')),
            standingReminderInterval: parseInt(formData.get('standingInterval')),
            notificationsEnabled: formData.get('notificationsEnabled') === 'on',
            soundEnabled: formData.get('soundEnabled') === 'on'
        };

        const success = Storage.updateSettings(newSettings);
        if (success) {
            UI.showToast('Settings saved!', 'success');
            UI.hideModal('settings-modal');
            UI.updateAll();

            // Restart reminders with new settings
            if (newSettings.notificationsEnabled) {
                Reminders.restart();
            } else {
                Reminders.stop();
            }
        }
    },

    // Export data
    exportData() {
        const success = Storage.exportData();
        if (success) {
            UI.showToast('Data exported successfully!', 'success');
        }
    },

    // Import data
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const success = Storage.importData(data);
                if (success) {
                    UI.showToast('Data imported successfully!', 'success');
                    UI.updateAll();

                    // Reset file input
                    event.target.value = '';
                }
            } catch (error) {
                ErrorHandler.handle(new ValidationError('Invalid import file'));
            }
        };
        reader.readAsText(file);
    },

    // Enable notifications
    async enableNotifications() {
        const granted = await Reminders.requestPermission();
        if (granted) {
            UI.showToast('Notifications enabled!', 'success');

            // Update settings
            Storage.updateSettings({ notificationsEnabled: true });

            // Start reminders
            Reminders.start();
        }
    },

    // Show onboarding
    showOnboarding() {
        UI.showModal('onboarding-modal');

        // Setup onboarding navigation
        let currentStep = 0;
        const steps = document.querySelectorAll('.onboarding-step');
        const nextBtn = document.getElementById('onboarding-next');
        const prevBtn = document.getElementById('onboarding-prev');
        const finishBtn = document.getElementById('onboarding-finish');

        const showStep = (index) => {
            steps.forEach((step, i) => {
                step.style.display = i === index ? 'block' : 'none';
            });

            prevBtn.style.display = index === 0 ? 'none' : 'inline-block';
            nextBtn.style.display = index === steps.length - 1 ? 'none' : 'inline-block';
            finishBtn.style.display = index === steps.length - 1 ? 'inline-block' : 'none';
        };

        nextBtn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                showStep(currentStep);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });

        finishBtn.addEventListener('click', () => {
            this.completeOnboarding();
        });

        showStep(0);
    },

    // Complete onboarding
    async completeOnboarding() {
        // Save onboarding settings
        const waterGoal = document.getElementById('onboarding-water-goal').value;
        const wakeTime = document.getElementById('onboarding-wake-time').value;
        const sleepTime = document.getElementById('onboarding-sleep-time').value;

        Storage.updateSettings({
            dailyWaterGoal: parseInt(waterGoal),
            wakeTime: wakeTime,
            sleepTime: sleepTime
        });

        // Request notification permission
        await Reminders.requestPermission();

        // Mark onboarding complete
        localStorage.setItem(CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');

        // Hide onboarding
        UI.hideModal('onboarding-modal');

        // Initialize app
        await this.init();
    },

    // Check for new day (midnight rollover)
    checkNewDay() {
        const streaks = Storage.getStreaks();
        if (Utils.DateUtils.isNewDay(streaks.lastActiveDate)) {
            // Calculate streaks for yesterday
            Analytics.calculateStreaks();
            UI.updateAll();
        }

        // Check every minute
        setInterval(() => {
            const currentStreaks = Storage.getStreaks();
            if (Utils.DateUtils.isNewDay(currentStreaks.lastActiveDate)) {
                Analytics.calculateStreaks();
                UI.updateAll();
            }
        }, 60000);
    },

    // Setup visibility change handler
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // App became visible, update UI
                UI.updateAll();
            }
        });
    },

    // Register service worker
    async registerServiceWorker() {
        if (!Utils.FeatureDetection.hasServiceWorkerSupport()) {
            console.warn('Service workers not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service worker registered:', registration);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        UI.showToast('New version available! Refresh to update.', 'info', 5000);
                    }
                });
            });
        } catch (error) {
            console.warn('Service worker registration failed:', error);
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Export App
window.App = App;
