import 'package:equatable/equatable.dart';
import '../../../data/models/water_entry.dart';

abstract class WaterEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadWaterData extends WaterEvent {}

class AddWaterIntake extends WaterEvent {
  final int amount;
  AddWaterIntake(this.amount);
  
  @override
  List<Object?> get props => [amount];
}

class RemoveLastWaterEntry extends WaterEvent {}

class RefreshWaterData extends WaterEvent {}
