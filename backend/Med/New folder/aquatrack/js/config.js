// AquaTrack Configuration
const CONFIG = {
  APP_NAME: 'AquaTrack',
  VERSION: '1.0.0',
  
  // Storage keys
  STORAGE_KEYS: {
    SETTINGS: 'aquatrack_settings',
    DAILY_DATA: 'aquatrack_daily_data',
    STREAKS: 'aquatrack_streaks',
    BACKUPS: 'aquatrack_backups',
    ONBOARDING_COMPLETE: 'aquatrack_onboarding_complete'
  },
  
  // Default settings
  DEFAULTS: {
    dailyWaterGoal: 2000, // ml
    wakeTime: '07:00',
    sleepTime: '23:00',
    reminderFrequency: 60, // minutes
    standingReminderInterval: 30, // minutes
    notificationsEnabled: true,
    soundEnabled: false,
    theme: 'dark'
  },
  
  // Validation constraints
  CONSTRAINTS: {
    waterGoal: { min: 500, max: 5000 },
    reminderFrequency: { min: 15, max: 240 },
    standingInterval: { min: 15, max: 120 },
    waterAmount: { min: 50, max: 2000 },
    exerciseDuration: { min: 1, max: 300 }
  },
  
  // Quick add amounts (ml)
  QUICK_ADD_AMOUNTS: [250, 500, 1000],
  
  // Data retention (days)
  DATA_RETENTION_DAYS: 365,
  
  // Backup settings
  MAX_BACKUPS: 7,
  
  // Performance
  ANIMATION_DURATION: 300, // ms
  DEBOUNCE_DELAY: 300, // ms
  
  // Feature flags
  FEATURES: {
    exportData: true,
    importData: true,
    insights: true,
    predictions: true,
    celebrations: true
  },
  
  // Cache version for service worker
  CACHE_VERSION: 'v1.0.0',
  
  // Environment
  ENV: window.location.hostname === 'localhost' ? 'development' : 'production'
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
