import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import '../data/repositories/settings_repository_impl.dart';
import '../data/repositories/water_repository_impl.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  
  final SettingsRepositoryImpl _settingsRepo = SettingsRepositoryImpl();
  final WaterRepositoryImpl _waterRepo = WaterRepositoryImpl();

  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    _isInitialized = true;
  }

  void _onNotificationTapped(NotificationResponse response) {
    // Handle notification tap
    print('Notification tapped: ${response.payload}');
  }

  Future<bool> requestPermission() async {
    final status = await Permission.notification.request();
    return status.isGranted;
  }

  Future<void> scheduleWaterReminders() async {
    final settings = _settingsRepo.getSettings();
    
    if (!settings.notificationsEnabled) return;

    // Cancel existing reminders
    await _notifications.cancelAll();

    // Parse wake and sleep times
    final wakeHour = int.parse(settings.wakeTime.split(':')[0]);
    final sleepHour = int.parse(settings.sleepTime.split(':')[0]);

    // Schedule reminders every hour during waking hours
    final now = DateTime.now();
    int notificationId = 0;

    for (int hour = wakeHour; hour < sleepHour; hour++) {
      final scheduledTime = DateTime(
        now.year,
        now.month,
        now.day,
        hour,
        0,
      );

      if (scheduledTime.isAfter(now)) {
        await _scheduleNotification(
          id: notificationId++,
          title: _getContextualTitle(hour),
          body: _getContextualMessage(hour),
          scheduledTime: scheduledTime,
        );
      }
    }
  }

  String _getContextualTitle(int hour) {
    if (hour < 12) return '☀️ Morning Hydration';
    if (hour < 17) return '🌤️ Afternoon Reminder';
    return '🌙 Evening Hydration';
  }

  String _getContextualMessage(int hour) {
    final messages = [
      'Time to drink some water! Stay hydrated 💧',
      'Don\'t forget to hydrate! Your body needs it 🚰',
      'Quick reminder: Drink water to stay healthy 💙',
      'Hydration check! Have you had water recently? 💦',
      'Keep up the good work! Time for some water 🌊',
    ];
    
    return messages[hour % messages.length];
  }

  Future<void> _scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledTime,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'water_reminders',
      'Water Reminders',
      channelDescription: 'Reminders to drink water throughout the day',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFF00D4FF),
      enableVibration: true,
      playSound: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.zonedSchedule(
      id,
      title,
      body,
      scheduledTime,
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  Future<void> showInstantNotification({
    required String title,
    required String body,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'instant_notifications',
      'Instant Notifications',
      channelDescription: 'Immediate notifications',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFF00D4FF),
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch % 100000,
      title,
      body,
      details,
    );
  }

  Future<void> scheduleStandingReminder() async {
    final settings = _settingsRepo.getSettings();
    
    if (!settings.notificationsEnabled) return;

    const androidDetails = AndroidNotificationDetails(
      'standing_reminders',
      'Standing Break Reminders',
      channelDescription: 'Reminders to take standing breaks',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFF00D4FF),
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Schedule repeating notification every X minutes
    await _notifications.periodicallyShow(
      999,
      '🧍 Time for a Standing Break',
      'Stand up and stretch for better health!',
      RepeatInterval.everyMinute, // In production, use custom interval
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
    );
  }

  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }

  Future<void> showGoalAchievedNotification() async {
    await showInstantNotification(
      title: '🎉 Goal Achieved!',
      body: 'Congratulations! You\'ve reached your daily water goal!',
    );
  }
}
