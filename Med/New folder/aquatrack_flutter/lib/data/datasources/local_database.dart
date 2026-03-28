import '../models/water_entry.dart';
import '../models/exercise_entry.dart';
import '../models/app_settings.dart';
import '../models/standing_break.dart';
import '../models/achievement.dart';
import '../models/weekly_goal.dart';

class LocalDatabase {
  static const String waterBox = 'water_entries';
  static const String exerciseBox = 'exercise_entries';
  static const String settingsBox = 'app_settings';
  static const String standingBox = 'standing_breaks';
  static const String achievementsBox = 'achievements';
  static const String weeklyGoalsBox = 'weekly_goals';

  static Future<void> init() async {
    // Register adapters (will be generated)
    // Hive.registerAdapter(WaterEntryAdapter());
    // Hive.registerAdapter(ExerciseEntryAdapter());
    // Hive.registerAdapter(AppSettingsAdapter());
    // Hive.registerAdapter(StandingBreakAdapter());
    // Hive.registerAdapter(AchievementAdapter());
    // Hive.registerAdapter(WeeklyGoalAdapter());

    // Open boxes
    await Hive.openBox<WaterEntry>(waterBox);
    await Hive.openBox<ExerciseEntry>(exerciseBox);
    await Hive.openBox<AppSettings>(settingsBox);
    await Hive.openBox<StandingBreak>(standingBox);
    await Hive.openBox<Achievement>(achievementsBox);
    await Hive.openBox<WeeklyGoal>(weeklyGoalsBox);
  }

  static Box<WaterEntry> get waterEntries => Hive.box<WaterEntry>(waterBox);
  static Box<ExerciseEntry> get exercises => Hive.box<ExerciseEntry>(exerciseBox);
  static Box<AppSettings> get settings => Hive.box<AppSettings>(settingsBox);
  static Box<StandingBreak> get standingBreaks => Hive.box<StandingBreak>(standingBox);
  static Box<Achievement> get achievements => Hive.box<Achievement>(achievementsBox);
  static Box<WeeklyGoal> get weeklyGoals => Hive.box<WeeklyGoal>(weeklyGoalsBox);

  static Future<void> clearAll() async {
    await waterEntries.clear();
    await exercises.clear();
    await standingBreaks.clear();
  }

  static Future<Map<String, dynamic>> exportData() async {
    return {
      'water': waterEntries.values.map((e) => e.toJson()).toList(),
      'exercises': exercises.values.map((e) => e.toJson()).toList(),
      'standing': standingBreaks.values.map((e) => e.toIso8601String()).toList(),
      'exportDate': DateTime.now().toIso8601String(),
    };
  }
}
