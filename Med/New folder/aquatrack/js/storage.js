// Production-Grade Data Persistence Layer

const Storage = {
    // Initialize storage with version check
    init() {
        try {
            if (!Utils.FeatureDetection.hasLocalStorageSupport()) {
                throw new StorageError('localStorage not supported');
            }

            // Check for data migration
            this.migrateIfNeeded();

            // Initialize default data if first time
            if (!this.get(CONFIG.STORAGE_KEYS.SETTINGS)) {
                this.set(CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.DEFAULTS);
            }

            if (!this.get(CONFIG.STORAGE_KEYS.DAILY_DATA)) {
                this.set(CONFIG.STORAGE_KEYS.DAILY_DATA, {});
            }

            if (!this.get(CONFIG.STORAGE_KEYS.STREAKS)) {
                this.set(CONFIG.STORAGE_KEYS.STREAKS, {
                    waterStreak: 0,
                    exerciseStreak: 0,
                    standingStreak: 0,
                    lastActiveDate: Utils.DateUtils.getCurrentDate(),
                    longestWaterStreak: 0,
                    longestExerciseStreak: 0,
                    longestStandingStreak: 0
                });
            }

            if (!this.get(CONFIG.STORAGE_KEYS.BACKUPS)) {
                this.set(CONFIG.STORAGE_KEYS.BACKUPS, []);
            }

            return true;
        } catch (error) {
            ErrorHandler.handle(new StorageError('Failed to initialize storage: ' + error.message));
            return false;
        }
    },

    // Get item from localStorage
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            ErrorHandler.handle(new StorageError('Failed to read from storage: ' + error.message));
            return null;
        }
    },

    // Set item in localStorage with automatic backup
    set(key, value) {
        try {
            // Create backup before write (except for backups themselves)
            if (key !== CONFIG.STORAGE_KEYS.BACKUPS) {
                this.createBackup();
            }

            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                // Try to free up space
                this.cleanup();
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (retryError) {
                    ErrorHandler.handle(new StorageError('Storage quota exceeded'));
                    return false;
                }
            }
            ErrorHandler.handle(new StorageError('Failed to write to storage: ' + error.message));
            return false;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            ErrorHandler.handle(new StorageError('Failed to remove from storage: ' + error.message));
            return false;
        }
    },

    // Create backup of current data
    createBackup() {
        try {
            const backups = this.get(CONFIG.STORAGE_KEYS.BACKUPS) || [];
            const backup = {
                timestamp: Utils.DateUtils.getCurrentTimestamp(),
                settings: this.get(CONFIG.STORAGE_KEYS.SETTINGS),
                dailyData: this.get(CONFIG.STORAGE_KEYS.DAILY_DATA),
                streaks: this.get(CONFIG.STORAGE_KEYS.STREAKS)
            };

            backups.push(backup);

            // Keep only last N backups
            if (backups.length > CONFIG.MAX_BACKUPS) {
                backups.shift();
            }

            localStorage.setItem(CONFIG.STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
        } catch (error) {
            // Silently fail backup creation to not block main operations
            console.warn('Backup creation failed:', error);
        }
    },

    // Restore from latest backup
    restoreFromBackup() {
        try {
            const backups = this.get(CONFIG.STORAGE_KEYS.BACKUPS);
            if (!backups || backups.length === 0) {
                throw new StorageError('No backups available');
            }

            const latestBackup = backups[backups.length - 1];

            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(latestBackup.settings));
            localStorage.setItem(CONFIG.STORAGE_KEYS.DAILY_DATA, JSON.stringify(latestBackup.dailyData));
            localStorage.setItem(CONFIG.STORAGE_KEYS.STREAKS, JSON.stringify(latestBackup.streaks));

            return true;
        } catch (error) {
            ErrorHandler.handle(new StorageError('Failed to restore from backup: ' + error.message));
            return false;
        }
    },

    // Data validation
    validateData(data, schema) {
        // Basic validation - can be extended
        if (schema === 'settings') {
            return data.dailyWaterGoal && data.wakeTime && data.sleepTime;
        }
        return true;
    },

    // Cleanup old data
    cleanup() {
        try {
            const dailyData = this.get(CONFIG.STORAGE_KEYS.DAILY_DATA) || {};
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - CONFIG.DATA_RETENTION_DAYS);

            let cleaned = false;
            Object.keys(dailyData).forEach(date => {
                if (new Date(date) < cutoffDate) {
                    delete dailyData[date];
                    cleaned = true;
                }
            });

            if (cleaned) {
                this.set(CONFIG.STORAGE_KEYS.DAILY_DATA, dailyData);
            }
        } catch (error) {
            console.warn('Cleanup failed:', error);
        }
    },

    // Schema migration
    migrateIfNeeded() {
        const currentVersion = localStorage.getItem('aquatrack_version');
        if (currentVersion !== CONFIG.VERSION) {
            // Perform migration if needed
            // For now, just update version
            localStorage.setItem('aquatrack_version', CONFIG.VERSION);
        }
    },

    // Export all data
    exportData() {
        try {
            const exportData = {
                version: CONFIG.VERSION,
                exportDate: Utils.DateUtils.getCurrentTimestamp(),
                settings: this.get(CONFIG.STORAGE_KEYS.SETTINGS),
                dailyData: this.get(CONFIG.STORAGE_KEYS.DAILY_DATA),
                streaks: this.get(CONFIG.STORAGE_KEYS.STREAKS)
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aquatrack-export-${Utils.DateUtils.getCurrentDate()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            ErrorHandler.handle(new StorageError('Failed to export data: ' + error.message));
            return false;
        }
    },

    // Import data
    importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Validate imported data
            if (!data.settings || !data.dailyData || !data.streaks) {
                throw new ValidationError('Invalid import data format');
            }

            // Create backup before import
            this.createBackup();

            // Import data
            this.set(CONFIG.STORAGE_KEYS.SETTINGS, data.settings);
            this.set(CONFIG.STORAGE_KEYS.DAILY_DATA, data.dailyData);
            this.set(CONFIG.STORAGE_KEYS.STREAKS, data.streaks);

            return true;
        } catch (error) {
            ErrorHandler.handle(new StorageError('Failed to import data: ' + error.message));
            return false;
        }
    },

    // Get settings
    getSettings() {
        return this.get(CONFIG.STORAGE_KEYS.SETTINGS) || CONFIG.DEFAULTS;
    },

    // Update settings
    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        return this.set(CONFIG.STORAGE_KEYS.SETTINGS, updatedSettings);
    },

    // Get today's data
    getTodayData() {
        const today = Utils.DateUtils.getCurrentDate();
        const allData = this.get(CONFIG.STORAGE_KEYS.DAILY_DATA) || {};

        if (!allData[today]) {
            allData[today] = {
                waterIntake: [],
                exercises: [],
                standingBreaks: [],
                goalsMet: { water: false, exercise: false, standing: false }
            };
            this.set(CONFIG.STORAGE_KEYS.DAILY_DATA, allData);
        }

        return allData[today];
    },

    // Add water intake
    addWaterIntake(amount) {
        try {
            if (!Utils.Validators.isValidWaterAmount(amount)) {
                throw new ValidationError('Invalid water amount');
            }

            const today = Utils.DateUtils.getCurrentDate();
            const allData = this.get(CONFIG.STORAGE_KEYS.DAILY_DATA) || {};
            const todayData = allData[today] || {
                waterIntake: [],
                exercises: [],
                standingBreaks: [],
                goalsMet: { water: false, exercise: false, standing: false }
            };

            const entry = {
                id: Utils.generateUUID(),
                timestamp: Utils.DateUtils.getCurrentTimestamp(),
                amount: amount
            };

            todayData.waterIntake.push(entry);
            allData[today] = todayData;

            this.set(CONFIG.STORAGE_KEYS.DAILY_DATA, allData);
            return entry;
        } catch (error) {
            ErrorHandler.handle(error);
            return null;
        }
    },

    // Remove last water intake (undo)
    removeLastWaterIntake() {
        try {
            const today = Utils.DateUtils.getCurrentDate();
            const allData = this.get(CONFIG.STORAGE_KEYS.DAILY_DATA) || {};
            const todayData = allData[today];

            if (todayData && todayData.waterIntake.length > 0) {
                const removed = todayData.waterIntake.pop();
                allData[today] = todayData;
                this.set(CONFIG.STORAGE_KEYS.DAILY_DATA, allData);
                return removed;
            }

            return null;
        } catch (error) {
            ErrorHandler.handle(error);
            return null;
        }
    },

    // Add exercise
    addExercise(type, duration, notes = '') {
        try {
            if (!Utils.Validators.isValidExerciseType(type)) {
                throw new ValidationError('Exercise type is required');
            }
            if (!Utils.Validators.isValidExerciseDuration(duration)) {
                throw new ValidationError('Invalid exercise duration');
            }

            const today = Utils.DateUtils.getCurrentDate();
            const allData = this.get(CONFIG.STORAGE_KEYS.DAILY_DATA) || {};
            const todayData = allData[today] || {
                waterIntake: [],
                exercises: [],
                standingBreaks: [],
                goalsMet: { water: false, exercise: false, standing: false }
            };

            const entry = {
                id: Utils.generateUUID(),
                timestamp: Utils.DateUtils.getCurrentTimestamp(),
                type: type.trim(),
                duration: duration,
                notes: notes.trim()
            };

            todayData.exercises.push(entry);
            allData[today] = todayData;

            this.set(CONFIG.STORAGE_KEYS.DAILY_DATA, allData);
            return entry;
        } catch (error) {
            ErrorHandler.handle(error);
            return null;
        }
    },

    // Add standing break
    addStandingBreak() {
        try {
            const today = Utils.DateUtils.getCurrentDate();
            const allData = this.get(CONFIG.STORAGE_KEYS.DAILY_DATA) || {};
            const todayData = allData[today] || {
                waterIntake: [],
                exercises: [],
                standingBreaks: [],
                goalsMet: { water: false, exercise: false, standing: false }
            };

            const entry = {
                id: Utils.generateUUID(),
                timestamp: Utils.DateUtils.getCurrentTimestamp()
            };

            todayData.standingBreaks.push(entry);
            allData[today] = todayData;

            this.set(CONFIG.STORAGE_KEYS.DAILY_DATA, allData);
            return entry;
        } catch (error) {
            ErrorHandler.handle(error);
            return null;
        }
    },

    // Get streaks
    getStreaks() {
        return this.get(CONFIG.STORAGE_KEYS.STREAKS) || {
            waterStreak: 0,
            exerciseStreak: 0,
            standingStreak: 0,
            lastActiveDate: Utils.DateUtils.getCurrentDate(),
            longestWaterStreak: 0,
            longestExerciseStreak: 0,
            longestStandingStreak: 0
        };
    },

    // Update streaks
    updateStreaks(streaks) {
        return this.set(CONFIG.STORAGE_KEYS.STREAKS, streaks);
    }
};

// Export Storage
window.Storage = Storage;
