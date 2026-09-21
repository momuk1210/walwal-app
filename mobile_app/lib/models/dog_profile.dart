class DogProfile {
  final String id;
  final String name;
  final String breed;
  final String age;
  final String ownerName;
  final String avatarUrl;
  final List<String> personality;
  final double latitude;
  final double longitude;
  final String recentThought;
  final String soundPattern;

  DogProfile({
    required this.id,
    required this.name,
    required this.breed,
    required this.age,
    required this.ownerName,
    required this.avatarUrl,
    required this.personality,
    required this.latitude,
    required this.longitude,
    required this.recentThought,
    required this.soundPattern,
  });
}
