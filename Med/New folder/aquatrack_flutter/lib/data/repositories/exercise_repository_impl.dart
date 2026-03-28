import 'package:uuid/uuid.dart';
import '../models/exercise_entry.dart';
import '../datasources/local_database.dart';

class ExerciseRepositoryImpl {
  final _uuid = const Uuid();

  Future<void> addExercise({
    required String type,
    required int duration,
    String? notes,
  }) async {
    final entry = ExerciseEntry(
      id: _uuid.v4(),
      type: type,
      duration: duration,
      notes: notes,
      timestamp: DateTime.now(),
    );
    await LocalDatabase.exercises.add(entry);
  }

  List<ExerciseEntry> getTodayExercises() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    return LocalDatabase.exercises.values
        .where((entry) => entry.timestamp.isAfter(today))
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  int getTodayTotalMinutes() {
    return getTodayExercises().fold<int>(
      0,
      (sum, entry) => sum + entry.duration,
    );
  }

  List<ExerciseEntry> getExercisesForDate(DateTime date) {
    final startOfDay = DateTime(date.year, date.month, date.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));
    
    return LocalDatabase.exercises.values
        .where((entry) =>
            entry.timestamp.isAfter(startOfDay) &&
            entry.timestamp.isBefore(endOfDay))
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }
}
