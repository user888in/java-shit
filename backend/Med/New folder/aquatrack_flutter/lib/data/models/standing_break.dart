import 'package:hive/hive.dart';

part 'standing_break.g.dart';

@HiveType(typeId: 3)
class StandingBreak extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final DateTime timestamp;

  StandingBreak({
    required this.id,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'timestamp': timestamp.toIso8601String(),
      };

  factory StandingBreak.fromJson(Map<String, dynamic> json) => StandingBreak(
        id: json['id'],
        timestamp: DateTime.parse(json['timestamp']),
      );
}
