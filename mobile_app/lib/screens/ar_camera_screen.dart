import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import '../services/dog_mind_ai_service.dart';

class ARCameraScreen extends StatefulWidget {
  const ARCameraScreen({super.key});

  @override
  State<ARCameraScreen> createState() => _ARCameraScreenState();
}

class _ARCameraScreenState extends State<ARCameraScreen>
    with WidgetsBindingObserver {
  final DogMindAIService _aiService = DogMindAIService();

  List<CameraDescription> _cameras = [];
  CameraController? _cameraController;
  int _selectedCameraIndex = 0;
  bool _isCameraInitialized = false;

  // 실시간 분석 상태
  bool _isAutoTranslating = true;
  bool _isAnalyzing = false;
  Timer? _autoTranslateTimer;

  // AI 번역 결과
  String _currentThought = "주인님을 바라보며 무슨 생각을 하고 있을까요? ";
  String _currentEmotion = "호기심 가득";
  DateTime? _lastAnalyzedAt;
  bool _isServerConnected = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initCameras();
    _checkServerStatus();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _autoTranslateTimer?.cancel();
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    if (state == AppLifecycleState.inactive) {
      _stopAutoTranslate();
      _cameraController?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initCameraController(_cameras[_selectedCameraIndex]);
    }
  }

  Future<void> _checkServerStatus() async {
    final connected = await _aiService.testConnection();
    if (mounted) {
      setState(() => _isServerConnected = connected);
    }
  }

  Future<void> _initCameras() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        await _initCameraController(_cameras[_selectedCameraIndex]);
      }
    } catch (e) {
      // ignore: avoid_print
      print("카메라 목록 로드 실패: $e");
    }
  }

  Future<void> _initCameraController(CameraDescription description) async {
    final controller = CameraController(
      description,
      ResolutionPreset.medium,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    _cameraController = controller;

    try {
      await controller.initialize();
      if (mounted) {
        setState(() => _isCameraInitialized = true);
        if (_isAutoTranslating) {
          _startAutoTranslate();
        }
      }
    } catch (e) {
      // ignore: avoid_print
      print("카메라 초기화 에러: $e");
    }
  }

  void _startAutoTranslate() {
    _autoTranslateTimer?.cancel();
    // 3.5초 주기로 프레임 캡처 및 AI 분석
    _autoTranslateTimer =
        Timer.periodic(const Duration(milliseconds: 3500), (_) {
      if (_isAutoTranslating && !_isAnalyzing && mounted) {
        _captureAndAnalyzeFrame();
      }
    });
  }

  void _stopAutoTranslate() {
    _autoTranslateTimer?.cancel();
    _autoTranslateTimer = null;
  }

  Future<void> _captureAndAnalyzeFrame() async {
    if (_cameraController == null ||
        !_cameraController!.value.isInitialized ||
        _cameraController!.value.isTakingPicture ||
        _isAnalyzing) {
      return;
    }

    setState(() => _isAnalyzing = true);

    try {
      // 1. 현재 카메라 화면 프레임 캡처
      final XFile imageFile = await _cameraController!.takePicture();

      // 2. Ollama LLaVA AI에 전송하여 실시간 속마음 받아오기
      final thought = await _aiService.fetchLiveDogThought(imageFile);

      if (mounted) {
        setState(() {
          _currentThought = thought;
          _lastAnalyzedAt = DateTime.now();
          _isServerConnected = true;
          // 감정 태그 자동 매핑
          if (thought.contains('간식') ||
              thought.contains('배고') ||
              thought.contains('밥')) {
            _currentEmotion = "식탐 폭발 🍖";
          } else if (thought.contains('산책') ||
              thought.contains('나가') ||
              thought.contains('뛰')) {
            _currentEmotion = "에너지 넘침 ⚡";
          } else if (thought.contains('졸려') ||
              thought.contains('자고') ||
              thought.contains('하품')) {
            _currentEmotion = "나른한 휴식 💤";
          } else if (thought.contains('사랑') ||
              thought.contains('주인') ||
              thought.contains('좋아')) {
            _currentEmotion = "무한 애정 💖";
          } else {
            _currentEmotion = "초집중 탐색 중 🔍";
          }
        });
      }
    } catch (e) {
      // ignore: avoid_print
      print("프레임 캡처 및 분석 오류: $e");
    } finally {
      if (mounted) {
        setState(() => _isAnalyzing = false);
      }
    }
  }

  void _toggleCameraLens() async {
    if (_cameras.length < 2) return;
    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    setState(() => _isCameraInitialized = false);
    await _cameraController?.dispose();
    await _initCameraController(_cameras[_selectedCameraIndex]);
  }

  void _openSettingsDialog() {
    final hostController = TextEditingController(text: _aiService.serverHost);
    final modelController = TextEditingController(text: _aiService.modelName);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (dialogContext, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(dialogContext).viewInsets.bottom + 28,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "🤖 로컬 Ollama AI 서버 설정",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  )
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                "• 안드로이드 에뮬레이터: http://10.0.2.2:11434\n"
                "• iOS 시뮬레이터: http://localhost:11434\n"
                "• 실제 스마트폰(Wi-Fi): PC IP 주소 (예: http://192.168.0.x:11434)",
                style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: hostController,
                decoration: const InputDecoration(
                  labelText: "서버 주소 (Host URL)",
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(14))),
                  prefixIcon: Icon(Icons.dns),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: modelController,
                decoration: const InputDecoration(
                  labelText: "멀티모달 모델명 (Model)",
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(14))),
                  prefixIcon: Icon(Icons.psychology),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () async {
                        _aiService.serverHost = hostController.text.trim();
                        final isOk = await _aiService.testConnection();
                        setModalState(() {});
                        if (!mounted) return;
                        setState(() => _isServerConnected = isOk);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              isOk
                                  ? "✅ Ollama 서버 연결 성공!"
                                  : "❌ 서버에 연결할 수 없습니다. (IP/포트 확인)",
                            ),
                            backgroundColor:
                                isOk ? Colors.green : Colors.redAccent,
                          ),
                        );
                      },
                      icon: const Icon(Icons.wifi_find),
                      label: const Text("연결 테스트"),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFFB320),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () {
                        _aiService.serverHost = hostController.text.trim();
                        _aiService.modelName = modelController.text.trim();
                        Navigator.pop(ctx);
                        _captureAndAnalyzeFrame();
                      },
                      child: const Text("저장 및 적용",
                          style: TextStyle(
                              color: Colors.black87,
                              fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isCameraInitialized || _cameraController == null) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Color(0xFFFFB320)),
              SizedBox(height: 16),
              Text(
                "카메라 렌즈 준비 중... 📸",
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. 카메라 뷰파인더
          CameraPreview(_cameraController!),

          // 2. 상단 AR 상태바 & 서버 인디케이터
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // 서버 상태 뱃지
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _isServerConnected
                          ? Colors.greenAccent
                          : Colors.orangeAccent,
                      width: 1.2,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _isServerConnected
                              ? Colors.greenAccent
                              : Colors.orangeAccent,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isServerConnected
                            ? (_lastAnalyzedAt != null
                                ? "Ollama LLaVA (${_lastAnalyzedAt!.second}s)"
                                : "Ollama LLaVA 실시간")
                            : "AI 대기 중",
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),

                // 설정 & 카메라 회전 버튼
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.flip_camera_ios,
                          color: Colors.white),
                      onPressed: _toggleCameraLens,
                    ),
                    IconButton(
                      icon: const Icon(Icons.settings, color: Colors.white),
                      onPressed: _openSettingsDialog,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // 3. 중앙/상단 AR 강아지 속마음 말풍선
          Positioned(
            top: MediaQuery.of(context).size.height * 0.18,
            left: 20,
            right: 20,
            child: Column(
              children: [
                // 감정 뱃지
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFB320),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(
                        color: Color.fromRGBO(0, 0, 0, 0.2),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      )
                    ],
                  ),
                  child: Text(
                    _currentEmotion,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // 속마음 말풍선 카드
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: const Color.fromRGBO(255, 255, 255, 0.95),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: const [
                      BoxShadow(
                        color: Color.fromRGBO(0, 0, 0, 0.25),
                        blurRadius: 16,
                        offset: Offset(0, 6),
                      ),
                    ],
                    border: Border.all(
                      color: _isAnalyzing
                          ? const Color(0xFFFFB320)
                          : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("💭", style: TextStyle(fontSize: 24)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _currentThought,
                              style: const TextStyle(
                                color: Color(0xFF1E293B),
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                height: 1.45,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (_isAnalyzing) ...[
                        const SizedBox(height: 10),
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Color(0xFFFFB320)),
                            ),
                            SizedBox(width: 8),
                            Text(
                              "시선과 표정 읽는 중...",
                              style: TextStyle(
                                  fontSize: 11, color: Colors.black54),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 4. 하단 컨트롤 바
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Column(
              children: [
                // 자동 통역 토글 칩
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _isAutoTranslating = !_isAutoTranslating;
                      if (_isAutoTranslating) {
                        _startAutoTranslate();
                      } else {
                        _stopAutoTranslate();
                      }
                    });
                  },
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: _isAutoTranslating
                          ? const Color.fromRGBO(46, 125, 50, 0.88)
                          : Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _isAutoTranslating ? Icons.sync : Icons.sync_disabled,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _isAutoTranslating
                              ? "실시간 자동 통역 (3.5초 주기)"
                              : "수동 촬영 모드",
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // 촬영 버튼
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    InkWell(
                      onTap: _isAnalyzing ? null : _captureAndAnalyzeFrame,
                      borderRadius: BorderRadius.circular(40),
                      child: Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          border: Border.all(
                              color: const Color(0xFFFFB320), width: 5),
                          boxShadow: const [
                            BoxShadow(
                              color: Color.fromRGBO(255, 179, 32, 0.4),
                              blurRadius: 18,
                              spreadRadius: 2,
                            )
                          ],
                        ),
                        child: Center(
                          child: _isAnalyzing
                              ? const SizedBox(
                                  width: 28,
                                  height: 28,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 3, color: Color(0xFFFFB320)),
                                )
                              : const Icon(Icons.pets,
                                  size: 36, color: Color(0xFFFFB320)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
