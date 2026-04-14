  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: Container(
        color: const Color(0xFF0A0E1A),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFF00D4FF).withOpacity(0.3),
                    const Color(0xFF0099FF).withOpacity(0.3),
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFF00D4FF).withOpacity(0.2),
                    ),
                    child: const Icon(
                      Icons.water_drop,
                      size: 30,
                      color: Color(0xFF00D4FF),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'AquaTrack',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00D4FF),
                    ),
                  ),
                  const Text(
                    'Stay Hydrated, Stay Healthy',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home, color: Color(0xFF00D4FF)),
              title: const Text('Home'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.bar_chart, color: Color(0xFF00D4FF)),
              title: const Text('Analytics'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AnalyticsScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_month, color: Color(0xFF00D4FF)),
              title: const Text('History Calendar'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const HistoryCalendarScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.emoji_events, color: Color(0xFF00D4FF)),
              title: const Text('Achievements'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AchievementsScreen()),
                );
              },
            ),
            const Divider(color: Colors.white24),
            ListTile(
              leading: const Icon(Icons.settings, color: Color(0xFF00D4FF)),
              title: const Text('Settings'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.info_outline, color: Color(0xFF00D4FF)),
              title: const Text('About'),
              onTap: () {
                Navigator.pop(context);
                _showAboutDialog(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About AquaTrack'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Version 1.0.0',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              'A native Flutter app for tracking hydration, exercise, and healthy habits.',
            ),
            SizedBox(height: 16),
            Text(
              'Features:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            Text('• Water intake tracking'),
            Text('• Exercise logging'),
            Text('• Standing break reminders'),
            Text('• Analytics & insights'),
            Text('• Achievements system'),
            Text('• Data export/import'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
