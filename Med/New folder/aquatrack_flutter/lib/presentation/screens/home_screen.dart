import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../bloc/water/water_bloc.dart';
import '../bloc/water/water_event.dart';
import '../bloc/water/water_state.dart';
import '../bloc/exercise/exercise_bloc.dart';
import '../bloc/exercise/exercise_event.dart';
import '../bloc/exercise/exercise_state.dart';
import '../widgets/water_quick_add_button.dart';
import '../widgets/exercise_card.dart';
import '../widgets/standing_break_widget.dart';
import '../widgets/daily_quote_widget.dart';
import 'analytics_screen.dart';
import 'settings_screen.dart';
import 'achievements_screen.dart';
import 'history_calendar_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.water_drop, color: Color(0xFF00D4FF)),
            const SizedBox(width: 8),
            const Text('AquaTrack'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AnalyticsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      drawer: _buildDrawer(context),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const DailyQuoteWidget(),
            const SizedBox(height: 24),
            _buildWaterSection(context),
            const SizedBox(height: 32),
            _buildExerciseSection(context),
            const SizedBox(height: 32),
            const StandingBreakWidget(),
            const SizedBox(height: 32),
            _buildDailySummary(context),
          ],
        ),
      ),
    );
  }

  Widget _buildWaterSection(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'Water Intake',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 24),
            BlocBuilder<WaterBloc, WaterState>(
              builder: (context, state) {
                if (state is WaterLoaded) {
                  return Column(
                    children: [
                      CircularPercentIndicator(
                        radius: 100,
                        lineWidth: 12,
                        percent: state.progress / 100,
                        center: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '${state.progress.toInt()}%',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00D4FF),
                              ),
                            ),
                            Text(
                              '${state.todayTotal}ml / ${state.dailyGoal}ml',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                        progressColor: const Color(0xFF00D4FF),
                        backgroundColor: const Color(0xFF1A2234),
                        circularStrokeCap: CircularStrokeCap.round,
                      ),
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          WaterQuickAddButton(
                            amount: 250,
                            onPressed: () => context
                                .read<WaterBloc>()
                                .add(AddWaterIntake(250)),
                          ),
                          WaterQuickAddButton(
                            amount: 500,
                            onPressed: () => context
                                .read<WaterBloc>()
                                .add(AddWaterIntake(500)),
                          ),
                          WaterQuickAddButton(
                            amount: 1000,
                            onPressed: () => context
                                .read<WaterBloc>()
                                .add(AddWaterIntake(1000)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                hintText: 'Custom amount (ml)',
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                              ),
                              onSubmitted: (value) {
                                final amount = int.tryParse(value);
                                if (amount != null && amount > 0) {
                                  context
                                      .read<WaterBloc>()
                                      .add(AddWaterIntake(amount));
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () {
                              context
                                  .read<WaterBloc>()
                                  .add(RemoveLastWaterEntry());
                            },
                            child: const Text('Undo'),
                          ),
                        ],
                      ),
                    ],
                  );
                }
                return const CircularProgressIndicator();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExerciseSection(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Exercise & Movement',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => _showAddExerciseDialog(context),
              icon: const Icon(Icons.add),
              label: const Text('Log Exercise'),
            ),
            const SizedBox(height: 16),
            BlocBuilder<ExerciseBloc, ExerciseState>(
              builder: (context, state) {
                if (state is ExerciseLoaded) {
                  if (state.exercises.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Text(
                          'No exercises logged today',
                          style: TextStyle(color: Colors.white54),
                        ),
                      ),
                    );
                  }
                  return Column(
                    children: state.exercises
                        .map((exercise) => ExerciseCard(exercise: exercise))
                        .toList(),
                  );
                }
                return const CircularProgressIndicator();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDailySummary(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Daily Summary',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatCard(
                  icon: Icons.water_drop,
                  label: 'Water',
                  value: '0ml',
                ),
                _buildStatCard(
                  icon: Icons.fitness_center,
                  label: 'Exercise',
                  value: '0 min',
                ),
                _buildStatCard(
                  icon: Icons.accessibility_new,
                  label: 'Breaks',
                  value: '0',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, size: 32, color: const Color(0xFF00D4FF)),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  void _showAddExerciseDialog(BuildContext context) {
    final typeController = TextEditingController();
    final durationController = TextEditingController();
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Log Exercise'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: typeController,
              decoration: const InputDecoration(
                labelText: 'Type (e.g., Walking, Yoga)',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: durationController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Duration (minutes)',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final type = typeController.text.trim();
              final duration = int.tryParse(durationController.text);
              final notes = notesController.text.trim();

              if (type.isNotEmpty && duration != null && duration > 0) {
                context.read<ExerciseBloc>().add(
                      AddExercise(
                        type: type,
                        duration: duration,
                        notes: notes.isEmpty ? null : notes,
                      ),
                    );
                Navigator.pop(dialogContext);
              }
            },
            child: const Text('Log'),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: Container(
        color: const Color(0xFF0A0E1A),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFF00D4FF).withOpacity(0.3),
                    const Color(0xFF0099FF).withOpacity(0.3),
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFF00D4FF).withOpacity(0.2),
                    ),
                    child: const Icon(
                      Icons.water_drop,
                      size: 30,
                      color: Color(0xFF00D4FF),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'AquaTrack',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00D4FF),
                    ),
                  ),
                  const Text(
                    'Stay Hydrated, Stay Healthy',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home, color: Color(0xFF00D4FF)),
              title: const Text('Home'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.bar_chart, color: Color(0xFF00D4FF)),
              title: const Text('Analytics'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AnalyticsScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_month, color: Color(0xFF00D4FF)),
              title: const Text('History Calendar'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const HistoryCalendarScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.emoji_events, color: Color(0xFF00D4FF)),
              title: const Text('Achievements'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AchievementsScreen()),
                );
              },
            ),
            const Divider(color: Colors.white24),
            ListTile(
              leading: const Icon(Icons.settings, color: Color(0xFF00D4FF)),
              title: const Text('Settings'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.info_outline, color: Color(0xFF00D4FF)),
              title: const Text('About'),
              onTap: () {
                Navigator.pop(context);
                _showAboutDialog(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About AquaTrack'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Version 1.0.0',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              'A native Flutter app for tracking hydration, exercise, and healthy habits.',
            ),
            SizedBox(height: 16),
            Text(
              'Features:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            Text('• Water intake tracking'),
            Text('• Exercise logging'),
            Text('• Standing break reminders'),
            Text('• Analytics & insights'),
            Text('• Achievements system'),
            Text('• Data export/import'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
