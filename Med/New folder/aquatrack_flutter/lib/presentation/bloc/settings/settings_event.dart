import 'package:equatable/equatable.dart';
import '../../../data/models/app_settings.dart';

abstract class SettingsEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadSettings extends SettingsEvent {}

class UpdateSettings extends SettingsEvent {
  final AppSettings settings;
  UpdateSettings(this.settings);
  
  @override
  List<Object?> get props => [settings];
}

class CompleteOnboarding extends SettingsEvent {}
