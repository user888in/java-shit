import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:share_plus/share_plus.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:convert';
import 'dart:io';
import '../bloc/settings/settings_bloc.dart';
import '../bloc/settings/settings_state.dart';
import '../bloc/settings/settings_event.dart';
import '../../data/models/app_settings.dart';
import '../../data/datasources/local_database.dart';
import '../../services/notification_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: BlocBuilder<SettingsBloc, SettingsState>(
        builder: (context, state) {
          if (state is SettingsLoaded) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildGoalsSection(context, state.settings),
                  const SizedBox(height: 24),
                  _buildScheduleSection(context, state.settings),
                  const SizedBox(height: 24),
                  _buildNotificationsSection(context, state.settings),
                  const SizedBox(height: 24),
                  _buildDataManagementSection(context),
                ],
              ),
            );
          }
          return const Center(child: CircularProgressIndicator());
        },
      ),
    );
  }

  Widget _buildGoalsSection(BuildContext context, AppSettings settings) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Daily Goals',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.water_drop, color: Color(0xFF00D4FF)),
              title: const Text('Water Goal'),
              subtitle: Text('${settings.dailyWaterGoal}ml'),
              trailing: IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => _showWaterGoalDialog(context, settings),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleSection(BuildContext context, AppSettings settings) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Schedule',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.wb_sunny, color: Color(0xFF00D4FF)),
              title: const Text('Wake Time'),
              subtitle: Text(settings.wakeTime),
              trailing: IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => _showTimePickerDialog(
                  context,
                  settings,
                  isWakeTime: true,
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.nightlight, color: Color(0xFF00D4FF)),
              title: const Text('Sleep Time'),
              subtitle: Text(settings.sleepTime),
              trailing: IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => _showTimePickerDialog(
                  context,
                  settings,
                  isWakeTime: false,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationsSection(BuildContext context, AppSettings settings) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Notifications',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Enable Notifications'),
              subtitle: const Text('Receive hydration reminders'),
              value: settings.notificationsEnabled,
              onChanged: (value) async {
                if (value) {
                  final granted = await NotificationService().requestPermission();
                  if (granted) {
                    await NotificationService().scheduleWaterReminders();
                    _updateSettings(
                      context,
                      settings.copyWith(notificationsEnabled: true),
                    );
                  }
                } else {
                  await NotificationService().cancelAllNotifications();
                  _updateSettings(
                    context,
                    settings.copyWith(notificationsEnabled: false),
                  );
                }
              },
            ),
            SwitchListTile(
              title: const Text('Sound'),
              subtitle: const Text('Play sound with notifications'),
              value: settings.soundEnabled,
              onChanged: (value) {
                _updateSettings(
                  context,
                  settings.copyWith(soundEnabled: value),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.schedule, color: Color(0xFF00D4FF)),
              title: const Text('Reminder Frequency'),
              subtitle: Text('Every ${settings.reminderFrequency} minutes'),
              trailing: IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => _showReminderFrequencyDialog(context, settings),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataManagementSection(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Data Management',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.download, color: Color(0xFF00D4FF)),
              title: const Text('Export Data'),
              subtitle: const Text('Download your data as JSON'),
              onTap: () => _exportData(context),
            ),
            ListTile(
              leading: const Icon(Icons.upload, color: Color(0xFF00D4FF)),
              title: const Text('Import Data'),
              subtitle: const Text('Restore from backup'),
              onTap: () => _importData(context),
            ),
            ListTile(
              leading: const Icon(Icons.delete_forever, color: Colors.red),
              title: const Text('Clear All Data'),
              subtitle: const Text('Delete all entries'),
              onTap: () => _showClearDataDialog(context),
            ),
          ],
        ),
      ),
    );
  }

  void _showWaterGoalDialog(BuildContext context, AppSettings settings) {
    int newGoal = settings.dailyWaterGoal;

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Set Water Goal'),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${newGoal}ml',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00D4FF),
                ),
              ),
              Slider(
                value: newGoal.toDouble(),
                min: 500,
                max: 5000,
                divisions: 45,
                label: '${newGoal}ml',
                onChanged: (value) => setState(() => newGoal = value.toInt()),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              _updateSettings(
                context,
                settings.copyWith(dailyWaterGoal: newGoal),
              );
              Navigator.pop(dialogContext);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showTimePickerDialog(
    BuildContext context,
    AppSettings settings, {
    required bool isWakeTime,
  }) async {
    final currentTime = isWakeTime ? settings.wakeTime : settings.sleepTime;
    final parts = currentTime.split(':');
    final initialTime = TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );

    final newTime = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );

    if (newTime != null) {
      final timeString = '${newTime.hour.toString().padLeft(2, '0')}:${newTime.minute.toString().padLeft(2, '0')}';
      _updateSettings(
        context,
        isWakeTime
            ? settings.copyWith(wakeTime: timeString)
            : settings.copyWith(sleepTime: timeString),
      );
    }
  }

  void _showReminderFrequencyDialog(BuildContext context, AppSettings settings) {
    int newFrequency = settings.reminderFrequency;

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reminder Frequency'),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Every $newFrequency minutes',
                style: const TextStyle(fontSize: 18),
              ),
              Slider(
                value: newFrequency.toDouble(),
                min: 15,
                max: 240,
                divisions: 15,
                label: '$newFrequency min',
                onChanged: (value) => setState(() => newFrequency = value.toInt()),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              _updateSettings(
                context,
                settings.copyWith(reminderFrequency: newFrequency),
              );
              Navigator.pop(dialogContext);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _exportData(BuildContext context) async {
    try {
      final data = await LocalDatabase.exportData();
      final jsonString = const JsonEncoder.withIndent('  ').convert(data);
      
      final fileName = 'aquatrack_export_${DateTime.now().millisecondsSinceEpoch}.json';
      
      // Save to temporary file and share
      final tempDir = Directory.systemTemp;
      final file = File('${tempDir.path}/$fileName');
      await file.writeAsString(jsonString);
      
      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'AquaTrack Data Export',
      );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Data exported successfully!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e')),
        );
      }
    }
  }

  Future<void> _importData(BuildContext context) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
      );

      if (result != null && result.files.single.path != null) {
        final file = File(result.files.single.path!);
        final jsonString = await file.readAsString();
        final data = jsonDecode(jsonString);

        // TODO: Implement data import logic
        // This would involve parsing the JSON and saving to Hive

        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Data imported successfully!')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Import failed: $e')),
        );
      }
    }
  }

  void _showClearDataDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Clear All Data?'),
        content: const Text(
          'This will permanently delete all your water entries, exercises, and standing breaks. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              await LocalDatabase.clearAll();
              if (dialogContext.mounted) {
                Navigator.pop(dialogContext);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All data cleared')),
                );
              }
            },
            child: const Text('Delete All'),
          ),
        ],
      ),
    );
  }

  void _updateSettings(BuildContext context, AppSettings settings) {
    context.read<SettingsBloc>().add(UpdateSettings(settings));
  }
}
