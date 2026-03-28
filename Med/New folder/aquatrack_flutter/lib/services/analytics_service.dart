class AnalyticsService {
  // Calculate water streak
  static int calculateWaterStreak(Map<DateTime, int> dailyTotals, int dailyGoal) {
    int streak = 0;
    final today = DateTime.now();
    
    for (int i = 0; i < 365; i++) {
      final date = DateTime(today.year, today.month, today.day).subtract(Duration(days: i));
      final total = dailyTotals[date] ?? 0;
      
      if (total >= dailyGoal) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Calculate exercise streak
  static int calculateExerciseStreak(Map<DateTime, int> dailyMinutes) {
    int streak = 0;
    final today = DateTime.now();
    
    for (int i = 0; i < 365; i++) {
      final date = DateTime(today.year, today.month, today.day).subtract(Duration(days: i));
      final minutes = dailyMinutes[date] ?? 0;
      
      if (minutes > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Calculate standing break streak
  static int calculateStandingStreak(Map<DateTime, int> dailyBreaks) {
    int streak = 0;
    final today = DateTime.now();
    
    for (int i = 0; i < 365; i++) {
      final date = DateTime(today.year, today.month, today.day).subtract(Duration(days: i));
      final breaks = dailyBreaks[date] ?? 0;
      
      if (breaks >= 3) { // At least 3 breaks per day
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Generate insights
  static List<String> generateInsights({
    required int waterStreak,
    required int exerciseStreak,
    required int todayWater,
    required int dailyGoal,
    required int todayExercise,
  }) {
    final insights = <String>[];

    // Water insights
    if (waterStreak >= 7) {
      insights.add('🔥 Amazing! ${waterStreak} day water streak!');
    }
    
    final progress = (todayWater / dailyGoal * 100).round();
    if (progress >= 50 && progress < 100) {
      insights.add('💪 You\'re ${100 - progress}% away from your goal!');
    }

    // Exercise insights
    if (exerciseStreak >= 3) {
      insights.add('🏃 Great consistency! ${exerciseStreak} days of exercise!');
    }

    if (todayExercise >= 30) {
      insights.add('✨ Excellent! You\'ve exercised for $todayExercise minutes today!');
    }

    // Motivational messages
    if (insights.isEmpty) {
      insights.add('💧 Start your hydration journey today!');
    }

    return insights;
  }

  // Calculate best hydration time
  static String getBestHydrationTime(List<DateTime> waterTimestamps) {
    if (waterTimestamps.isEmpty) return 'No data yet';

    final hourCounts = <int, int>{};
    
    for (final timestamp in waterTimestamps) {
      final hour = timestamp.hour;
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }

    final bestHour = hourCounts.entries
        .reduce((a, b) => a.value > b.value ? a : b)
        .key;

    if (bestHour < 12) return 'Morning (${bestHour}:00)';
    if (bestHour < 17) return 'Afternoon (${bestHour}:00)';
    return 'Evening (${bestHour}:00)';
  }

  // Predict goal completion
  static double predictGoalCompletion({
    required int currentAmount,
    required int dailyGoal,
    required DateTime now,
  }) {
    final hour = now.hour;
    final minuteOfDay = hour * 60 + now.minute;
    final totalMinutesInDay = 24 * 60;
    
    final expectedProgress = minuteOfDay / totalMinutesInDay;
    final actualProgress = currentAmount / dailyGoal;
    
    if (actualProgress >= expectedProgress) {
      return 90.0; // High likelihood
    } else if (actualProgress >= expectedProgress * 0.7) {
      return 60.0; // Medium likelihood
    } else {
      return 30.0; // Low likelihood
    }
  }
}
