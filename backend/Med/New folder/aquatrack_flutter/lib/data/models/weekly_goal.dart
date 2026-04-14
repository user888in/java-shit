import 'package:hive/hive.dart';

part 'weekly_goal.g.dart';

@HiveType(typeId: 5)
class WeeklyGoal extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final DateTime weekStart;

  @HiveField(2)
  final int waterGoal; // ml per day average

  @HiveField(3)
  final int exerciseGoal; // minutes per week

  @HiveField(4)
  final int standingGoal; // breaks per week

  @HiveField(5)
  final bool isCompleted;

  WeeklyGoal({
    required this.id,
    required this.weekStart,
    required this.waterGoal,
    required this.exerciseGoal,
    required this.standingGoal,
    this.isCompleted = false,
  });

  WeeklyGoal copyWith({
    bool? isCompleted,
  }) {
    return WeeklyGoal(
      id: id,
      weekStart: weekStart,
      waterGoal: waterGoal,
      exerciseGoal: exerciseGoal,
      standingGoal: standingGoal,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }

  DateTime get weekEnd => weekStart.add(const Duration(days: 7));

  bool isCurrentWeek() {
    final now = DateTime.now();
    return now.isAfter(weekStart) && now.isBefore(weekEnd);
  }
}
