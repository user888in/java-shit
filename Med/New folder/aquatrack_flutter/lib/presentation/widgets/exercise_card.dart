import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../data/models/exercise_entry.dart';

class ExerciseCard extends StatelessWidget {
  final ExerciseEntry exercise;

  const ExerciseCard({super.key, required this.exercise});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Color(0xFF00D4FF),
          child: Icon(Icons.fitness_center, color: Colors.white),
        ),
        title: Text(
          exercise.type,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${exercise.duration} minutes'),
            if (exercise.notes != null) Text(exercise.notes!),
          ],
        ),
        trailing: Text(
          DateFormat.jm().format(exercise.timestamp),
          style: const TextStyle(color: Colors.white54, fontSize: 12),
        ),
      ),
    );
  }
}
