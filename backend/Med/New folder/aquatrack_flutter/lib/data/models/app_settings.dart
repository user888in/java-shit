import 'package:hive/hive.dart';

part 'app_settings.g.dart';

@HiveType(typeId: 2)
class AppSettings extends HiveObject {
  @HiveField(0)
  final int dailyWaterGoal; // in ml

  @HiveField(1)
  final String wakeTime; // HH:mm format

  @HiveField(2)
  final String sleepTime; // HH:mm format

  @HiveField(3)
  final int reminderFrequency; // in minutes

  @HiveField(4)
  final int standingReminderInterval; // in minutes

  @HiveField(5)
  final bool notificationsEnabled;

  @HiveField(6)
  final bool soundEnabled;

  @HiveField(7)
  final bool onboardingComplete;

  AppSettings({
    this.dailyWaterGoal = 2000,
    this.wakeTime = '07:00',
    this.sleepTime = '23:00',
    this.reminderFrequency = 60,
    this.standingReminderInterval = 30,
    this.notificationsEnabled = true,
    this.soundEnabled = false,
    this.onboardingComplete = false,
  });

  AppSettings copyWith({
    int? dailyWaterGoal,
    String? wakeTime,
    String? sleepTime,
    int? reminderFrequency,
    int? standingReminderInterval,
    bool? notificationsEnabled,
    bool? soundEnabled,
    bool? onboardingComplete,
  }) {
    return AppSettings(
      dailyWaterGoal: dailyWaterGoal ?? this.dailyWaterGoal,
      wakeTime: wakeTime ?? this.wakeTime,
      sleepTime: sleepTime ?? this.sleepTime,
      reminderFrequency: reminderFrequency ?? this.reminderFrequency,
      standingReminderInterval: standingReminderInterval ?? this.standingReminderInterval,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      soundEnabled: soundEnabled ?? this.soundEnabled,
      onboardingComplete: onboardingComplete ?? this.onboardingComplete,
    );
  }
}
