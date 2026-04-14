import 'package:equatable/equatable.dart';
import '../../../data/models/water_entry.dart';

abstract class WaterState extends Equatable {
  @override
  List<Object?> get props => [];
}

class WaterInitial extends WaterState {}

class WaterLoading extends WaterState {}

class WaterLoaded extends WaterState {
  final List<WaterEntry> entries;
  final int todayTotal;
  final int dailyGoal;
  final double progress;

  WaterLoaded({
    required this.entries,
    required this.todayTotal,
    required this.dailyGoal,
    required this.progress,
  });

  @override
  List<Object?> get props => [entries, todayTotal, dailyGoal, progress];
}

class WaterError extends WaterState {
  final String message;
  WaterError(this.message);
  
  @override
  List<Object?> get props => [message];
}
