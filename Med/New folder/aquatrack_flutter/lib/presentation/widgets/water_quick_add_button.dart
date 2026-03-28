import 'package:flutter/material.dart';

class WaterQuickAddButton extends StatelessWidget {
  final int amount;
  final VoidCallback onPressed;

  const WaterQuickAddButton({
    super.key,
    required this.amount,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      child: Text(
        amount >= 1000 ? '+${amount ~/ 1000}L' : '+${amount}ml',
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
