import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/repositories/water_repository_impl.dart';
import '../../../data/repositories/settings_repository_impl.dart';
import 'water_event.dart';
import 'water_state.dart';

class WaterBloc extends Bloc<WaterEvent, WaterState> {
  final WaterRepositoryImpl repository;
  final SettingsRepositoryImpl settingsRepository = SettingsRepositoryImpl();

  WaterBloc({required this.repository}) : super(WaterInitial()) {
    on<LoadWaterData>(_onLoadWaterData);
    on<AddWaterIntake>(_onAddWaterIntake);
    on<RemoveLastWaterEntry>(_onRemoveLastEntry);
    on<RefreshWaterData>(_onRefreshWaterData);
  }

  Future<void> _onLoadWaterData(
    LoadWaterData event,
    Emitter<WaterState> emit,
  ) async {
    try {
      emit(WaterLoading());
      final entries = repository.getTodayEntries();
      final total = repository.getTodayTotal();
      final goal = settingsRepository.getSettings().dailyWaterGoal;
      final progress = (total / goal * 100).clamp(0, 100);

      emit(WaterLoaded(
        entries: entries,
        todayTotal: total,
        dailyGoal: goal,
        progress: progress,
      ));
    } catch (e) {
      emit(WaterError(e.toString()));
    }
  }

  Future<void> _onAddWaterIntake(
    AddWaterIntake event,
    Emitter<WaterState> emit,
  ) async {
    try {
      await repository.addWaterIntake(event.amount);
      add(RefreshWaterData());
    } catch (e) {
      emit(WaterError(e.toString()));
    }
  }

  Future<void> _onRemoveLastEntry(
    RemoveLastWaterEntry event,
    Emitter<WaterState> emit,
  ) async {
    try {
      await repository.removeLastEntry();
      add(RefreshWaterData());
    } catch (e) {
      emit(WaterError(e.toString()));
    }
  }

  Future<void> _onRefreshWaterData(
    RefreshWaterData event,
    Emitter<WaterState> emit,
  ) async {
    final entries = repository.getTodayEntries();
    final total = repository.getTodayTotal();
    final goal = settingsRepository.getSettings().dailyWaterGoal;
    final progress = (total / goal * 100).clamp(0, 100);

    emit(WaterLoaded(
      entries: entries,
      todayTotal: total,
      dailyGoal: goal,
      progress: progress,
    ));
  }
}
