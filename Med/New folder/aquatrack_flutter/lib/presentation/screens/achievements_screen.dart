import 'package:flutter/material.dart';
import '../../services/achievement_service.dart';
import '../../data/models/achievement.dart';

class AchievementsScreen extends StatelessWidget {
  const AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final service = AchievementService();
    final achievements = service.getAllAchievements();
    final unlockedCount = service.getUnlockedCount();
    final totalCount = service.getTotalCount();
    final percentage = service.getCompletionPercentage();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Achievements'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildProgressCard(unlockedCount, totalCount, percentage),
            const SizedBox(height: 24),
            const Text(
              'All Achievements',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00D4FF),
              ),
            ),
            const SizedBox(height: 16),
            ...achievements.map((achievement) => _buildAchievementCard(achievement)),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressCard(int unlocked, int total, double percentage) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Progress',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF00D4FF),
                  ),
                ),
                Text(
                  '$unlocked / $total',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: const Color(0xFF1A2234),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00D4FF)),
              minHeight: 8,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 8),
            Text(
              '${percentage.toStringAsFixed(1)}% Complete',
              style: const TextStyle(color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAchievementCard(Achievement achievement) {
    final isLocked = !achievement.isUnlocked;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Opacity(
        opacity: isLocked ? 0.5 : 1.0,
        child: ListTile(
          leading: Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isLocked
                  ? Colors.grey.withOpacity(0.3)
                  : const Color(0xFF00D4FF).withOpacity(0.2),
            ),
            child: Center(
              child: Text(
                isLocked ? '🔒' : achievement.icon,
                style: const TextStyle(fontSize: 24),
              ),
            ),
          ),
          title: Text(
            achievement.title,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isLocked ? Colors.white54 : Colors.white,
            ),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                achievement.description,
                style: TextStyle(
                  color: isLocked ? Colors.white38 : Colors.white70,
                ),
              ),
              if (!isLocked && achievement.unlockedAt != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    'Unlocked ${_formatDate(achievement.unlockedAt!)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF00D4FF),
                    ),
                  ),
                ),
            ],
          ),
          trailing: isLocked
              ? const Icon(Icons.lock, color: Colors.white38)
              : const Icon(Icons.check_circle, color: Color(0xFF00FF88)),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) return 'today';
    if (diff.inDays == 1) return 'yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}
