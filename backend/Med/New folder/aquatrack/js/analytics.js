// Comprehensive Analytics and Insights Engine

const Analytics = {
    // Calculate total water intake for today
    getTotalWaterToday() {
        const todayData = Storage.getTodayData();
        return todayData.waterIntake.reduce((total, entry) => total + entry.amount, 0);
    },

    // Calculate water progress percentage
    getWaterProgress() {
        const total = this.getTotalWaterToday();
        const goal = Storage.getSettings().dailyWaterGoal;
        return Utils.NumberUtils.calculatePercentage(total, goal);
    },

    // Check if water goal is met
    isWaterGoalMet() {
        return this.getWaterProgress() >= 100;
    },

    // Get exercise count for today
    getExerciseCount() {
        const todayData = Storage.getTodayData();
        return todayData.exercises.length;
    },

    // Get total exercise duration for today
    getTotalExerciseDuration() {
        const todayData = Storage.getTodayData();
        return todayData.exercises.reduce((total, entry) => total + entry.duration, 0);
    },

    // Get standing breaks count for today
    getStandingBreaksCount() {
        const todayData = Storage.getTodayData();
        return todayData.standingBreaks.length;
    },

    // Calculate hourly water intake breakdown
    getHourlyWaterBreakdown() {
        const todayData = Storage.getTodayData();
        const hourly = Array(24).fill(0);

        todayData.waterIntake.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            hourly[hour] += entry.amount;
        });

        return hourly;
    },

    // Get best hydration time (hour with most water intake)
    getBestHydrationTime() {
        const hourly = this.getHourlyWaterBreakdown();
        const maxAmount = Math.max(...hourly);
        const bestHour = hourly.indexOf(maxAmount);

        if (maxAmount === 0) return null;

        return {
            hour: bestHour,
            amount: maxAmount,
            timeStr: `${String(bestHour).padStart(2, '0')}:00`
        };
    },

    // Calculate streaks
    calculateStreaks() {
        const dailyData = Storage.get(CONFIG.STORAGE_KEYS.DAILY_DATA) || {};
        const settings = Storage.getSettings();
        const streaks = Storage.getStreaks();
        const today = Utils.DateUtils.getCurrentDate();

        // Check if we need to update streaks
        if (streaks.lastActiveDate === today) {
            return streaks; // Already updated today
        }

        // Check if yesterday's goals were met
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayData = dailyData[yesterdayStr];

        if (yesterdayData) {
            // Water streak
            const waterTotal = yesterdayData.waterIntake.reduce((sum, e) => sum + e.amount, 0);
            if (waterTotal >= settings.dailyWaterGoal) {
                streaks.waterStreak++;
                streaks.longestWaterStreak = Math.max(streaks.longestWaterStreak, streaks.waterStreak);
            } else {
                streaks.waterStreak = 0;
            }

            // Exercise streak
            if (yesterdayData.exercises.length > 0) {
                streaks.exerciseStreak++;
                streaks.longestExerciseStreak = Math.max(streaks.longestExerciseStreak, streaks.exerciseStreak);
            } else {
                streaks.exerciseStreak = 0;
            }

            // Standing streak
            if (yesterdayData.standingBreaks.length > 0) {
                streaks.standingStreak++;
                streaks.longestStandingStreak = Math.max(streaks.longestStandingStreak, streaks.standingStreak);
            } else {
                streaks.standingStreak = 0;
            }
        }

        streaks.lastActiveDate = today;
        Storage.updateStreaks(streaks);

        return streaks;
    },

    // Get weekly summary
    getWeeklySummary() {
        const dailyData = Storage.get(CONFIG.STORAGE_KEYS.DAILY_DATA) || {};
        const settings = Storage.getSettings();
        const summary = {
            totalWater: 0,
            totalExercises: 0,
            totalStandingBreaks: 0,
            daysWithGoalMet: 0,
            averageWater: 0,
            days: []
        };

        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayData = dailyData[dateStr];

            if (dayData) {
                const waterTotal = dayData.waterIntake.reduce((sum, e) => sum + e.amount, 0);
                summary.totalWater += waterTotal;
                summary.totalExercises += dayData.exercises.length;
                summary.totalStandingBreaks += dayData.standingBreaks.length;

                if (waterTotal >= settings.dailyWaterGoal) {
                    summary.daysWithGoalMet++;
                }

                summary.days.push({
                    date: dateStr,
                    water: waterTotal,
                    exercises: dayData.exercises.length,
                    standingBreaks: dayData.standingBreaks.length,
                    goalMet: waterTotal >= settings.dailyWaterGoal
                });
            } else {
                summary.days.push({
                    date: dateStr,
                    water: 0,
                    exercises: 0,
                    standingBreaks: 0,
                    goalMet: false
                });
            }
        }

        summary.averageWater = Math.round(summary.totalWater / 7);

        return summary;
    },

    // Generate insights
    generateInsights() {
        const insights = [];
        const todayData = Storage.getTodayData();
        const settings = Storage.getSettings();
        const streaks = this.calculateStreaks();
        const weeklySummary = this.getWeeklySummary();

        // Streak insights
        if (streaks.waterStreak >= 7) {
            insights.push({
                type: 'achievement',
                icon: '🔥',
                message: `Amazing! ${streaks.waterStreak} day water streak!`
            });
        }

        // Best time insight
        const bestTime = this.getBestHydrationTime();
        if (bestTime) {
            insights.push({
                type: 'info',
                icon: '⏰',
                message: `You drink most water around ${bestTime.timeStr}`
            });
        }

        // Weekly compliance
        const complianceRate = (weeklySummary.daysWithGoalMet / 7) * 100;
        if (complianceRate >= 80) {
            insights.push({
                type: 'success',
                icon: '✨',
                message: `${Math.round(complianceRate)}% goal completion this week!`
            });
        }

        // Improvement suggestion
        if (weeklySummary.averageWater < settings.dailyWaterGoal) {
            const deficit = settings.dailyWaterGoal - weeklySummary.averageWater;
            insights.push({
                type: 'tip',
                icon: '💡',
                message: `Try drinking ${Utils.NumberUtils.formatWaterAmount(deficit)} more daily`
            });
        }

        // Personal record
        if (streaks.waterStreak === streaks.longestWaterStreak && streaks.waterStreak > 0) {
            insights.push({
                type: 'achievement',
                icon: '🏆',
                message: 'New personal record streak!'
            });
        }

        return insights;
    },

    // Predictive analytics - likelihood of meeting today's goal
    predictGoalCompletion() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const minutesSinceMidnight = currentHour * 60 + currentMinutes;
        const minutesInDay = 24 * 60;
        const dayProgress = minutesSinceMidnight / minutesInDay;

        const currentWater = this.getTotalWaterToday();
        const goal = Storage.getSettings().dailyWaterGoal;
        const waterProgress = currentWater / goal;

        // If water progress is ahead of day progress, likely to meet goal
        if (waterProgress >= dayProgress) {
            return {
                likelihood: 'high',
                percentage: Math.min(Math.round((waterProgress / dayProgress) * 100), 100),
                message: 'You\'re on track to meet your goal!'
            };
        } else if (waterProgress >= dayProgress * 0.7) {
            return {
                likelihood: 'medium',
                percentage: Math.round((waterProgress / dayProgress) * 100),
                message: 'Keep going! You can still make it.'
            };
        } else {
            return {
                likelihood: 'low',
                percentage: Math.round((waterProgress / dayProgress) * 100),
                message: 'Time to hydrate more!'
            };
        }
    },

    // Recommend next intake time
    recommendNextIntake() {
        const todayData = Storage.getTodayData();
        const settings = Storage.getSettings();

        if (todayData.waterIntake.length === 0) {
            return {
                time: 'now',
                message: 'Start your day with a glass of water!'
            };
        }

        const lastIntake = todayData.waterIntake[todayData.waterIntake.length - 1];
        const lastTime = new Date(lastIntake.timestamp);
        const now = new Date();
        const minutesSinceLastIntake = (now - lastTime) / 60000;

        if (minutesSinceLastIntake >= settings.reminderFrequency) {
            return {
                time: 'now',
                message: 'Time for some water!'
            };
        } else {
            const minutesUntilNext = settings.reminderFrequency - minutesSinceLastIntake;
            return {
                time: Math.round(minutesUntilNext),
                message: `Next intake in ${Math.round(minutesUntilNext)} minutes`
            };
        }
    },

    // Get daily summary
    getDailySummary() {
        const todayData = Storage.getTodayData();
        const settings = Storage.getSettings();
        const streaks = this.calculateStreaks();

        const waterTotal = this.getTotalWaterToday();
        const waterProgress = this.getWaterProgress();
        const exerciseCount = this.getExerciseCount();
        const exerciseDuration = this.getTotalExerciseDuration();
        const standingCount = this.getStandingBreaksCount();

        return {
            water: {
                total: waterTotal,
                goal: settings.dailyWaterGoal,
                progress: waterProgress,
                remaining: Math.max(0, settings.dailyWaterGoal - waterTotal),
                goalMet: waterProgress >= 100,
                entries: todayData.waterIntake.length
            },
            exercise: {
                count: exerciseCount,
                totalDuration: exerciseDuration,
                entries: todayData.exercises
            },
            standing: {
                count: standingCount,
                entries: todayData.standingBreaks
            },
            streaks: streaks,
            insights: this.generateInsights(),
            prediction: this.predictGoalCompletion()
        };
    }
};

// Export Analytics
window.Analytics = Analytics;
