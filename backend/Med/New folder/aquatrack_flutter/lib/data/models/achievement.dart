import 'package:hive/hive.dart';

part 'achievement.g.dart';

@HiveType(typeId: 4)
class Achievement extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String description;

  @HiveField(3)
  final String icon;

  @HiveField(4)
  final int targetValue;

  @HiveField(5)
  final String category; // water, exercise, standing, streak

  @HiveField(6)
  final DateTime? unlockedAt;

  @HiveField(7)
  final bool isUnlocked;

  Achievement({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.targetValue,
    required this.category,
    this.unlockedAt,
    this.isUnlocked = false,
  });

  Achievement copyWith({
    DateTime? unlockedAt,
    bool? isUnlocked,
  }) {
    return Achievement(
      id: id,
      title: title,
      description: description,
      icon: icon,
      targetValue: targetValue,
      category: category,
      unlockedAt: unlockedAt ?? this.unlockedAt,
      isUnlocked: isUnlocked ?? this.isUnlocked,
    );
  }

  static List<Achievement> getDefaultAchievements() {
    return [
      // Water achievements
      Achievement(
        id: 'first_drop',
        title: 'First Drop',
        description: 'Log your first water intake',
        icon: '💧',
        targetValue: 1,
        category: 'water',
      ),
      Achievement(
        id: 'hydration_hero',
        title: 'Hydration Hero',
        description: 'Reach your daily goal',
        icon: '🏆',
        targetValue: 1,
        category: 'water',
      ),
      Achievement(
        id: 'week_warrior',
        title: 'Week Warrior',
        description: '7 day water streak',
        icon: '🔥',
        targetValue: 7,
        category: 'streak',
      ),
      Achievement(
        id: 'month_master',
        title: 'Month Master',
        description: '30 day water streak',
        icon: '👑',
        targetValue: 30,
        category: 'streak',
      ),
      
      // Exercise achievements
      Achievement(
        id: 'first_workout',
        title: 'First Workout',
        description: 'Log your first exercise',
        icon: '🏃',
        targetValue: 1,
        category: 'exercise',
      ),
      Achievement(
        id: 'fitness_fan',
        title: 'Fitness Fan',
        description: 'Exercise for 30 minutes',
        icon: '💪',
        targetValue: 30,
        category: 'exercise',
      ),
      Achievement(
        id: 'marathon_runner',
        title: 'Marathon Runner',
        description: 'Exercise for 100 minutes total',
        icon: '🎯',
        targetValue: 100,
        category: 'exercise',
      ),
      
      // Standing achievements
      Achievement(
        id: 'stand_up',
        title: 'Stand Up!',
        description: 'Take your first standing break',
        icon: '🧍',
        targetValue: 1,
        category: 'standing',
      ),
      Achievement(
        id: 'break_master',
        title: 'Break Master',
        description: 'Take 10 standing breaks',
        icon: '⭐',
        targetValue: 10,
        category: 'standing',
      ),
    ];
  }
}
