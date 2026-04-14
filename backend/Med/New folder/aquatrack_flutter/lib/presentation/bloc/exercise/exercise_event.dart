import 'package:equatable/equatable.dart';

abstract class ExerciseEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadExercises extends ExerciseEvent {}

class AddExercise extends ExerciseEvent {
  final String type;
  final int duration;
  final String? notes;

  AddExercise({
    required this.type,
    required this.duration,
    this.notes,
  });

  @override
  List<Object?> get props => [type, duration, notes];
}
