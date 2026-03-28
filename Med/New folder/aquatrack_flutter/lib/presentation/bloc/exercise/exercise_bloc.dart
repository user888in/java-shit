import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/repositories/exercise_repository_impl.dart';
import 'exercise_event.dart';
import 'exercise_state.dart';

class ExerciseBloc extends Bloc<ExerciseEvent, ExerciseState> {
  final ExerciseRepositoryImpl repository;

  ExerciseBloc({required this.repository}) : super(ExerciseInitial()) {
    on<LoadExercises>(_onLoadExercises);
    on<AddExercise>(_onAddExercise);
  }

  Future<void> _onLoadExercises(
    LoadExercises event,
    Emitter<ExerciseState> emit,
  ) async {
    try {
      emit(ExerciseLoading());
      final exercises = repository.getTodayExercises();
      final totalMinutes = repository.getTodayTotalMinutes();

      emit(ExerciseLoaded(
        exercises: exercises,
        totalMinutes: totalMinutes,
      ));
    } catch (e) {
      emit(ExerciseError(e.toString()));
    }
  }

  Future<void> _onAddExercise(
    AddExercise event,
    Emitter<ExerciseState> emit,
  ) async {
    try {
      await repository.addExercise(
        type: event.type,
        duration: event.duration,
        notes: event.notes,
      );
      add(LoadExercises());
    } catch (e) {
      emit(ExerciseError(e.toString()));
    }
  }
}
