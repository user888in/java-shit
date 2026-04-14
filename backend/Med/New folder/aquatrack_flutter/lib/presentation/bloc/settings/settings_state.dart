import 'package:equatable/equatable.dart';
import '../../../data/models/app_settings.dart';

abstract class SettingsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class SettingsInitial extends SettingsState {}

class SettingsLoading extends SettingsState {}

class SettingsLoaded extends SettingsState {
  final AppSettings settings;
  SettingsLoaded(this.settings);
  
  @override
  List<Object?> get props => [settings];
}

class SettingsError extends SettingsState {
  final String message;
  SettingsError(this.message);
  
  @override
  List<Object?> get props => [message];
}
