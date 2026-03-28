import 'package:uuid/uuid.dart';
import '../models/standing_break.dart';
import '../datasources/local_database.dart';

class StandingBreakRepositoryImpl {
  final _uuid = const Uuid();

  Future<void> addStandingBreak() async {
    final entry = StandingBreak(
      id: _uuid.v4(),
      timestamp: DateTime.now(),
    );
    await LocalDatabase.standingBreaks.add(entry);
  }

  List<StandingBreak> getTodayBreaks() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    return LocalDatabase.standingBreaks.values
        .where((entry) => entry.timestamp.isAfter(today))
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  int getTodayCount() {
    return getTodayBreaks().length;
  }

  List<StandingBreak> getBreaksForDate(DateTime date) {
    final startOfDay = DateTime(date.year, date.month, date.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));
    
    return LocalDatabase.standingBreaks.values
        .where((entry) =>
            entry.timestamp.isAfter(startOfDay) &&
            entry.timestamp.isBefore(endOfDay))
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  Map<DateTime, int> getWeeklyData() {
    final now = DateTime.now();
    final weekAgo = now.subtract(const Duration(days: 7));
    final data = <DateTime, int>{};

    for (var i = 0; i < 7; i++) {
      final date = weekAgo.add(Duration(days: i));
      final dayStart = DateTime(date.year, date.month, date.day);
      final count = getBreaksForDate(dayStart).length;
      data[dayStart] = count;
    }

    return data;
  }
}
