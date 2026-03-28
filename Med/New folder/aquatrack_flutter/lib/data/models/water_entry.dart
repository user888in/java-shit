import 'package:hive/hive.dart';

part 'water_entry.g.dart';

@HiveType(typeId: 0)
class WaterEntry extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final int amount; // in ml

  @HiveField(2)
  final DateTime timestamp;

  WaterEntry({
    required this.id,
    required this.amount,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'amount': amount,
        'timestamp': timestamp.toIso8601String(),
      };

  factory WaterEntry.fromJson(Map<String, dynamic> json) => WaterEntry(
        id: json['id'],
        amount: json['amount'],
        timestamp: DateTime.parse(json['timestamp']),
      );
}
