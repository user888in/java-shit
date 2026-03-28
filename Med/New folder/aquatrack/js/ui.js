// UI Update and DOM Manipulation Layer

const UI = {
    // Toast notification system
    toastContainer: null,

    // Initialize UI
    init() {
        this.createToastContainer();
        this.setupEventListeners();
    },

    // Create toast container
    createToastContainer() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    },

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        }[type] || 'ℹ';

        toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

        this.toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Update water progress
    updateWaterProgress() {
        const summary = Analytics.getDailySummary();
        const progressCircle = document.querySelector('.progress-circle-fill');
        const progressText = document.querySelector('.progress-text');
        const currentAmount = document.querySelector('.current-amount');
        const goalAmount = document.querySelector('.goal-amount');

        if (progressCircle) {
            const circumference = 2 * Math.PI * 90; // radius = 90
            const offset = circumference - (summary.water.progress / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        if (progressText) {
            progressText.textContent = `${summary.water.progress}%`;
        }

        if (currentAmount) {
            currentAmount.textContent = Utils.NumberUtils.formatWaterAmount(summary.water.total);
        }

        if (goalAmount) {
            goalAmount.textContent = Utils.NumberUtils.formatWaterAmount(summary.water.goal);
        }

        // Show celebration if goal met
        if (summary.water.goalMet && summary.water.progress === 100) {
            this.showCelebration();
        }
    },

    // Update daily summary
    updateDailySummary() {
        const summary = Analytics.getDailySummary();

        // Update stats
        const waterStat = document.querySelector('.stat-water');
        const exerciseStat = document.querySelector('.stat-exercise');
        const standingStat = document.querySelector('.stat-standing');

        if (waterStat) {
            waterStat.textContent = Utils.NumberUtils.formatWaterAmount(summary.water.total);
        }

        if (exerciseStat) {
            exerciseStat.textContent = summary.exercise.count;
        }

        if (standingStat) {
            standingStat.textContent = summary.standing.count;
        }

        // Update streaks
        const waterStreak = document.querySelector('.streak-water');
        const exerciseStreak = document.querySelector('.streak-exercise');

        if (waterStreak) {
            waterStreak.textContent = `${summary.streaks.waterStreak} days`;
        }

        if (exerciseStreak) {
            exerciseStreak.textContent = `${summary.streaks.exerciseStreak} days`;
        }

        // Update insights
        this.updateInsights(summary.insights);
    },

    // Update insights section
    updateInsights(insights) {
        const insightsContainer = document.querySelector('.insights-container');
        if (!insightsContainer) return;

        insightsContainer.innerHTML = '';

        insights.forEach(insight => {
            const insightEl = document.createElement('div');
            insightEl.className = `insight insight-${insight.type}`;
            insightEl.innerHTML = `
        <span class="insight-icon">${insight.icon}</span>
        <span class="insight-message">${insight.message}</span>
      `;
            insightsContainer.appendChild(insightEl);
        });
    },

    // Update exercise list
    updateExerciseList() {
        const todayData = Storage.getTodayData();
        const exerciseList = document.querySelector('.exercise-list');

        if (!exerciseList) return;

        if (todayData.exercises.length === 0) {
            exerciseList.innerHTML = '<p class="empty-state">No exercises logged today</p>';
            return;
        }

        exerciseList.innerHTML = todayData.exercises.map(exercise => `
      <div class="exercise-item">
        <div class="exercise-info">
          <span class="exercise-type">${exercise.type}</span>
          <span class="exercise-duration">${exercise.duration} min</span>
        </div>
        <span class="exercise-time">${Utils.DateUtils.getRelativeTime(exercise.timestamp)}</span>
      </div>
    `).join('');
    },

    // Show celebration animation
    showCelebration() {
        if (!CONFIG.FEATURES.celebrations) return;

        // Create confetti effect
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.innerHTML = '<div class="confetti">🎉 Goal Achieved! 🎉</div>';
        document.body.appendChild(celebration);

        setTimeout(() => celebration.classList.add('show'), 10);

        setTimeout(() => {
            celebration.classList.remove('show');
            setTimeout(() => celebration.remove(), 500);
        }, 3000);

        // Play sound if enabled
        const settings = Storage.getSettings();
        if (settings.soundEnabled) {
            this.playSound('success');
        }
    },

    // Play sound
    playSound(type) {
        // Placeholder for sound playback
        console.log(`Playing sound: ${type}`);
    },

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    },

    // Show loading state
    showLoading() {
        const loading = document.querySelector('.loading-overlay');
        if (loading) {
            loading.classList.add('show');
        }
    },

    // Hide loading state
    hideLoading() {
        const loading = document.querySelector('.loading-overlay');
        if (loading) {
            loading.classList.remove('show');
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Close modals on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });

        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.show').forEach(modal => {
                    this.hideModal(modal.id);
                });
            }
        });
    },

    // Announce to screen readers
    announce(message, priority = 'polite') {
        const announcer = document.getElementById('aria-announcer');
        if (announcer) {
            announcer.setAttribute('aria-live', priority);
            announcer.textContent = message;

            // Clear after announcement
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    },

    // Update all UI elements
    updateAll() {
        this.updateWaterProgress();
        this.updateDailySummary();
        this.updateExerciseList();
    }
};

// Export UI
window.UI = UI;
