import 'package:equatable/equatable.dart';
import '../../../data/models/exercise_entry.dart';

abstract class ExerciseState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ExerciseInitial extends ExerciseState {}

class ExerciseLoading extends ExerciseState {}

class ExerciseLoaded extends ExerciseState {
  final List<ExerciseEntry> exercises;
  final int totalMinutes;

  ExerciseLoaded({
    required this.exercises,
    required this.totalMinutes,
  });

  @override
  List<Object?> get props => [exercises, totalMinutes];
}

class ExerciseError extends ExerciseState {
  final String message;
  ExerciseError(this.message);
  
  @override
  List<Object?> get props => [message];
}
