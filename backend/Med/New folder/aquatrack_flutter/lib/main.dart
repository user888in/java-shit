import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'core/theme/app_theme.dart';
import 'data/datasources/local_database.dart';
import 'presentation/screens/splash_screen.dart';
import 'presentation/bloc/water/water_bloc.dart';
import 'presentation/bloc/exercise/exercise_bloc.dart';
import 'presentation/bloc/settings/settings_bloc.dart';
import 'data/repositories/water_repository_impl.dart';
import 'data/repositories/exercise_repository_impl.dart';
import 'data/repositories/settings_repository_impl.dart';
import 'services/notification_service.dart';
import 'services/achievement_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive
  await Hive.initFlutter();
  await LocalDatabase.init();
  
  // Initialize notifications
  await NotificationService().initialize();
  
  // Initialize achievements
  await AchievementService().initializeAchievements();
  
  runApp(const AquaTrackApp());
}

class AquaTrackApp extends StatelessWidget {
  const AquaTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) => WaterBloc(
            repository: WaterRepositoryImpl(),
          )..add(LoadWaterData()),
        ),
        BlocProvider(
          create: (context) => ExerciseBloc(
            repository: ExerciseRepositoryImpl(),
          )..add(LoadExercises()),
        ),
        BlocProvider(
          create: (context) => SettingsBloc(
            repository: SettingsRepositoryImpl(),
          )..add(LoadSettings()),
        ),
      ],
      child: MaterialApp(
        title: 'AquaTrack',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const SplashScreen(),
      ),
    );
  }
}
