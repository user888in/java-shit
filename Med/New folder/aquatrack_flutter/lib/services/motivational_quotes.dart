class MotivationalQuotes {
  static const List<Map<String, String>> quotes = [
    {
      'quote': 'Water is the driving force of all nature.',
      'author': 'Leonardo da Vinci',
    },
    {
      'quote': 'Thousands have lived without love, not one without water.',
      'author': 'W. H. Auden',
    },
    {
      'quote': 'Water is life\'s matter and matrix, mother and medium.',
      'author': 'Albert Szent-Gyorgyi',
    },
    {
      'quote': 'The cure for anything is salt water: sweat, tears, or the sea.',
      'author': 'Isak Dinesen',
    },
    {
      'quote': 'A drop of water is worth more than a sack of gold to a thirsty man.',
      'author': 'Unknown',
    },
    {
      'quote': 'Hydration is the foundation of health.',
      'author': 'Unknown',
    },
    {
      'quote': 'Take care of your body. It\'s the only place you have to live.',
      'author': 'Jim Rohn',
    },
    {
      'quote': 'Movement is a medicine for creating change in a person\'s physical, emotional, and mental states.',
      'author': 'Carol Welch',
    },
    {
      'quote': 'The only bad workout is the one that didn\'t happen.',
      'author': 'Unknown',
    },
    {
      'quote': 'Your body is a temple, but only if you treat it as one.',
      'author': 'Astrid Alauda',
    },
  ];

  static Map<String, String> getRandomQuote() {
    final random = DateTime.now().millisecondsSinceEpoch % quotes.length;
    return quotes[random];
  }

  static Map<String, String> getDailyQuote() {
    final dayOfYear = DateTime.now().difference(DateTime(DateTime.now().year, 1, 1)).inDays;
    final index = dayOfYear % quotes.length;
    return quotes[index];
  }
}
