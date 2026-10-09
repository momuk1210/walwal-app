import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
// TODO: Uncomment the next line after running `flutterfire configure`
// import 'firebase_options.dart';
import 'package:walwal_app/screens/radar_screen.dart';
import 'package:walwal_app/screens/ar_camera_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // For Android, it uses google-services.json automatically.
  await Firebase.initializeApp();

  runApp(const WalWalApp());
}

class WalWalApp extends StatelessWidget {
  const WalWalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WalWal - 왈왈',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8F9FB),
        primaryColor: const Color(0xFFFFB320),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFFB320),
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          iconTheme: IconThemeData(color: Colors.black87),
          titleTextStyle: TextStyle(color: Colors.black87, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        cardTheme: const CardThemeData(
          color: Colors.white,
          elevation: 2,
          shadowColor: Color(0x19000000),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(24))),
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0; // Default to AR Camera

  final List<Widget> _screens = const [
    ARCameraScreen(),
    RadarScreen(),
    Center(child: Text('📸 숏폼 & 피드 스튜디오', style: TextStyle(fontSize: 16, color: Colors.black87))),
    Center(child: Text('🐶 산책 커뮤니티 & 매칭', style: TextStyle(fontSize: 16, color: Colors.black87))),
    Center(child: Text('⚙️ 설정 & 마이 프로필', style: TextStyle(fontSize: 16, color: Colors.black87))),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFFFFB320),
        unselectedItemColor: const Color(0xFFA0AEC0),
        elevation: 16,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.camera_alt), label: 'AR 통역'),
          BottomNavigationBarItem(icon: Icon(Icons.radar), label: '레이더'),
          BottomNavigationBarItem(icon: Icon(Icons.auto_stories), label: '숏폼컷'),
          BottomNavigationBarItem(icon: Icon(Icons.pets), label: '산책모임'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: '프로필'),
        ],
      ),
    );
  }
}
