import 'package:uuid/uuid.dart';
import '../models/water_entry.dart';
import '../datasources/local_database.dart';

class WaterRepositoryImpl {
  final _uuid = const Uuid();

  Future<void> addWaterIntake(int amount) async {
    final entry = WaterEntry(
      id: _uuid.v4(),
      amount: amount,
      timestamp: DateTime.now(),
    );
    await LocalDatabase.waterEntries.add(entry);
  }

  Future<void> removeLastEntry() async {
    if (LocalDatabase.waterEntries.isNotEmpty) {
      final lastKey = LocalDatabase.waterEntries.keys.last;
      await LocalDatabase.waterEntries.delete(lastKey);
    }
  }

  List<WaterEntry> getTodayEntries() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    return LocalDatabase.waterEntries.values
        .where((entry) => entry.timestamp.isAfter(today))
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  int getTodayTotal() {
    return getTodayEntries().fold<int>(
      0,
      (sum, entry) => sum + entry.amount,
    );
  }

  List<WaterEntry> getEntriesForDate(DateTime date) {
    final startOfDay = DateTime(date.year, date.month, date.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));
    
    return LocalDatabase.waterEntries.values
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
      final total = getEntriesForDate(dayStart).fold<int>(
        0,
        (sum, entry) => sum + entry.amount,
      );
      data[dayStart] = total;
    }

    return data;
  }
}
