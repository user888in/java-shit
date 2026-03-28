import 'package:hive/hive.dart';

part 'exercise_entry.g.dart';

@HiveType(typeId: 1)
class ExerciseEntry extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String type;

  @HiveField(2)
  final int duration; // in minutes

  @HiveField(3)
  final String? notes;

  @HiveField(4)
  final DateTime timestamp;

  ExerciseEntry({
    required this.id,
    required this.type,
    required this.duration,
    this.notes,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'duration': duration,
        'notes': notes,
        'timestamp': timestamp.toIso8601String(),
      };

  factory ExerciseEntry.fromJson(Map<String, dynamic> json) => ExerciseEntry(
        id: json['id'],
        type: json['type'],
        duration: json['duration'],
        notes: json['notes'],
        timestamp: DateTime.parse(json['timestamp']),
      );
}
