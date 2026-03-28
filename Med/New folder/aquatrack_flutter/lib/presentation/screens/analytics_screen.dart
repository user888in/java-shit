import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../bloc/water/water_bloc.dart';
import '../bloc/water/water_state.dart';
import '../../data/repositories/water_repository_impl.dart';
import '../../data/repositories/exercise_repository_impl.dart';
import '../../data/repositories/standing_break_repository_impl.dart';
import '../../data/repositories/settings_repository_impl.dart';
import '../../services/analytics_service.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final waterRepo = WaterRepositoryImpl();
    final exerciseRepo = ExerciseRepositoryImpl();
    final standingRepo = StandingBreakRepositoryImpl();
    final settingsRepo = SettingsRepositoryImpl();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics & Insights'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStreaksSection(waterRepo, exerciseRepo, standingRepo, settingsRepo),
            const SizedBox(height: 24),
            _buildWeeklyWaterChart(waterRepo),
            const SizedBox(height: 24),
            _buildWeeklyExerciseChart(exerciseRepo),
            const SizedBox(height: 24),
            _buildInsightsSection(waterRepo, exerciseRepo, settingsRepo),
          ],
        ),
      ),
    );
  }

  Widget _buildStreaksSection(
    WaterRepositoryImpl waterRepo,
    ExerciseRepositoryImpl exerciseRepo,
    StandingBreakRepositoryImpl standingRepo,
    SettingsRepositoryImpl settingsRepo,
  ) {
    // Calculate streaks (simplified - in production, fetch historical data)
    final waterStreak = 0; // AnalyticsService.calculateWaterStreak(...);
    final exerciseStreak = 0; // AnalyticsService.calculateExerciseStreak(...);
    final standingStreak = 0; // AnalyticsService.calculateStandingStreak(...);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Streaks 🔥',
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
                _buildStreakCard('💧 Water', waterStreak),
                _buildStreakCard('🏃 Exercise', exerciseStreak),
                _buildStreakCard('🧍 Standing', standingStreak),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStreakCard(String label, int days) {
    return Column(
      children: [
        Text(
          '$days',
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Color(0xFF00D4FF),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'days',
          style: const TextStyle(
            fontSize: 14,
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white54,
          ),
        ),
      ],
    );
  }

  Widget _buildWeeklyWaterChart(WaterRepositoryImpl waterRepo) {
    final weeklyData = waterRepo.getWeeklyData();
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Weekly Water Intake',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: 3000,
                  barTouchData: BarTouchData(enabled: true),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          final dates = weeklyData.keys.toList()..sort();
                          if (value.toInt() >= 0 && value.toInt() < dates.length) {
                            final date = dates[value.toInt()];
                            return Text(
                              DateFormat('E').format(date),
                              style: const TextStyle(fontSize: 10),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '${value.toInt()}ml',
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: _createWaterBarGroups(weeklyData),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<BarChartGroupData> _createWaterBarGroups(Map<DateTime, int> data) {
    final dates = data.keys.toList()..sort();
    return List.generate(dates.length, (index) {
      final amount = data[dates[index]] ?? 0;
      return BarChartGroupData(
        x: index,
        barRods: [
          BarChartRodData(
            toY: amount.toDouble(),
            color: const Color(0xFF00D4FF),
            width: 16,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
          ),
        ],
      );
    });
  }

  Widget _buildWeeklyExerciseChart(ExerciseRepositoryImpl exerciseRepo) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Weekly Exercise',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                  ),
                  titlesData: FlTitlesData(
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          if (value.toInt() >= 0 && value.toInt() < days.length) {
                            return Text(
                              days[value.toInt()],
                              style: const TextStyle(fontSize: 10),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '${value.toInt()}min',
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: [
                        const FlSpot(0, 30),
                        const FlSpot(1, 45),
                        const FlSpot(2, 20),
                        const FlSpot(3, 60),
                        const FlSpot(4, 40),
                        const FlSpot(5, 0),
                        const FlSpot(6, 25),
                      ],
                      isCurved: true,
                      color: const Color(0xFF00D4FF),
                      barWidth: 3,
                      dotData: const FlDotData(show: true),
                      belowBarData: BarAreaData(
                        show: true,
                        color: const Color(0xFF00D4FF).withOpacity(0.2),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightsSection(
    WaterRepositoryImpl waterRepo,
    ExerciseRepositoryImpl exerciseRepo,
    SettingsRepositoryImpl settingsRepo,
  ) {
    final todayWater = waterRepo.getTodayTotal();
    final todayExercise = exerciseRepo.getTodayTotalMinutes();
    final settings = settingsRepo.getSettings();

    final insights = AnalyticsService.generateInsights(
      waterStreak: 0,
      exerciseStreak: 0,
      todayWater: todayWater,
      dailyGoal: settings.dailyWaterGoal,
      todayExercise: todayExercise,
    );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Insights',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 16),
            ...insights.map((insight) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const Icon(Icons.lightbulb, color: Color(0xFF00D4FF), size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      insight,
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
}
