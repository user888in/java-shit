import '../models/app_settings.dart';
import '../datasources/local_database.dart';

class SettingsRepositoryImpl {
  static const String settingsKey = 'app_settings';

  AppSettings getSettings() {
    final box = LocalDatabase.settings;
    return box.get(settingsKey) ?? AppSettings();
  }

  Future<void> updateSettings(AppSettings settings) async {
    await LocalDatabase.settings.put(settingsKey, settings);
  }

  Future<void> completeOnboarding() async {
    final current = getSettings();
    await updateSettings(current.copyWith(onboardingComplete: true));
  }

  bool isOnboardingComplete() {
    return getSettings().onboardingComplete;
  }
}
