import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/settings/settings_bloc.dart';
import '../bloc/settings/settings_event.dart';
import '../../data/models/app_settings.dart';
import 'home_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  
  int _waterGoal = 2000;
  TimeOfDay _wakeTime = const TimeOfDay(hour: 7, minute: 0);
  TimeOfDay _sleepTime = const TimeOfDay(hour: 23, minute: 0);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0A0E1A), Color(0xFF121827)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (page) => setState(() => _currentPage = page),
                  children: [
                    _buildWelcomePage(),
                    _buildGoalPage(),
                    _buildSchedulePage(),
                    _buildNotificationsPage(),
                  ],
                ),
              ),
              _buildBottomButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomePage() {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.water_drop,
            size: 100,
            color: Color(0xFF00D4FF),
          ),
          const SizedBox(height: 32),
          const Text(
            'Welcome to AquaTrack!',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00D4FF),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          const Text(
            'Track your hydration and maintain healthy habits with smart reminders',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white70,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 48),
          _buildFeatureItem(Icons.water_drop, 'Track water intake'),
          _buildFeatureItem(Icons.fitness_center, 'Log exercises'),
          _buildFeatureItem(Icons.notifications_active, 'Smart reminders'),
        ],
      ),
    );
  }

  Widget _buildGoalPage() {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'Set Your Daily Goal',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00D4FF),
            ),
          ),
          const SizedBox(height: 48),
          Text(
            '${_waterGoal}ml',
            style: const TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 32),
          Slider(
            value: _waterGoal.toDouble(),
            min: 500,
            max: 5000,
            divisions: 45,
            activeColor: const Color(0xFF00D4FF),
            onChanged: (value) => setState(() => _waterGoal = value.toInt()),
          ),
          const SizedBox(height: 16),
          const Text(
            'Recommended: 2000ml (2 liters) per day',
            style: TextStyle(color: Colors.white70),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSchedulePage() {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'Your Schedule',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00D4FF),
            ),
          ),
          const SizedBox(height: 48),
          _buildTimeSelector(
            'Wake Time',
            _wakeTime,
            (time) => setState(() => _wakeTime = time),
          ),
          const SizedBox(height: 32),
          _buildTimeSelector(
            'Sleep Time',
            _sleepTime,
            (time) => setState(() => _sleepTime = time),
          ),
          const SizedBox(height: 32),
          const Text(
            'We\'ll send reminders only during your waking hours',
            style: TextStyle(color: Colors.white70),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsPage() {
    return const Padding(
      padding: EdgeInsets.all(32.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_active,
            size: 100,
            color: Color(0xFF00D4FF),
          ),
          SizedBox(height: 32),
          Text(
            'Enable Notifications',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00D4FF),
            ),
          ),
          SizedBox(height: 16),
          Text(
            'Get gentle reminders to stay hydrated throughout the day',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white70,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF00D4FF)),
          const SizedBox(width: 16),
          Text(
            text,
            style: const TextStyle(fontSize: 16, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeSelector(
    String label,
    TimeOfDay time,
    Function(TimeOfDay) onChanged,
  ) {
    return InkWell(
      onTap: () async {
        final newTime = await showTimePicker(
          context: context,
          initialTime: time,
        );
        if (newTime != null) onChanged(newTime);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A2234),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 16, color: Colors.white),
            ),
            Text(
              time.format(context),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomButtons() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_currentPage > 0)
            TextButton(
              onPressed: () => _pageController.previousPage(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
              ),
              child: const Text('Previous'),
            )
          else
            const SizedBox(),
          if (_currentPage < 3)
            ElevatedButton(
              onPressed: () => _pageController.nextPage(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
              ),
              child: const Text('Next'),
            )
          else
            ElevatedButton(
              onPressed: _completeOnboarding,
              child: const Text('Get Started!'),
            ),
        ],
      ),
    );
  }

  void _completeOnboarding() {
    final settings = AppSettings(
      dailyWaterGoal: _waterGoal,
      wakeTime: '${_wakeTime.hour.toString().padLeft(2, '0')}:${_wakeTime.minute.toString().padLeft(2, '0')}',
      sleepTime: '${_sleepTime.hour.toString().padLeft(2, '0')}:${_sleepTime.minute.toString().padLeft(2, '0')}',
      onboardingComplete: true,
    );

    context.read<SettingsBloc>().add(UpdateSettings(settings));

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }
}
