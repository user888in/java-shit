import '../models/achievement.dart';
import '../datasources/local_database.dart';

class AchievementService {
  static const String achievementsKey = 'achievements';

  // Initialize default achievements
  Future<void> initializeAchievements() async {
    final box = LocalDatabase.achievements;
    
    if (box.isEmpty) {
      final defaults = Achievement.getDefaultAchievements();
      for (final achievement in defaults) {
        await box.put(achievement.id, achievement);
      }
    }
  }

  // Check and unlock achievements
  Future<List<Achievement>> checkAchievements({
    required int waterCount,
    required int waterStreak,
    required int exerciseMinutes,
    required int standingBreaks,
  }) async {
    final box = LocalDatabase.achievements;
    final newlyUnlocked = <Achievement>[];

    for (final achievement in box.values) {
      if (achievement.isUnlocked) continue;

      bool shouldUnlock = false;

      switch (achievement.category) {
        case 'water':
          shouldUnlock = waterCount >= achievement.targetValue;
          break;
        case 'exercise':
          shouldUnlock = exerciseMinutes >= achievement.targetValue;
          break;
        case 'standing':
          shouldUnlock = standingBreaks >= achievement.targetValue;
          break;
        case 'streak':
          shouldUnlock = waterStreak >= achievement.targetValue;
          break;
      }

      if (shouldUnlock) {
        final unlocked = achievement.copyWith(
          isUnlocked: true,
          unlockedAt: DateTime.now(),
        );
        await box.put(achievement.id, unlocked);
        newlyUnlocked.add(unlocked);
      }
    }

    return newlyUnlocked;
  }

  List<Achievement> getAllAchievements() {
    return LocalDatabase.achievements.values.toList();
  }

  List<Achievement> getUnlockedAchievements() {
    return LocalDatabase.achievements.values
        .where((a) => a.isUnlocked)
        .toList();
  }

  int getUnlockedCount() {
    return getUnlockedAchievements().length;
  }

  int getTotalCount() {
    return LocalDatabase.achievements.length;
  }

  double getCompletionPercentage() {
    final total = getTotalCount();
    if (total == 0) return 0;
    return (getUnlockedCount() / total * 100);
  }
}
