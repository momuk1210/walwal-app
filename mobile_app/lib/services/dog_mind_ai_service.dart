import 'dart:convert';
import 'package:camera/camera.dart';
import 'package:http/http.dart' as http;
import 'package:image/image.dart' as img;

/// 로컬 AI 서버 (Ollama + LLaVA) 연동 실시간 강아지 속마음 통역 서비스
class DogMindAIService {
  static final DogMindAIService _instance = DogMindAIService._internal();
  factory DogMindAIService() => _instance;
  DogMindAIService._internal();

  // 기본 주소 설정:
  // - 안드로이드 에뮬레이터: http://10.0.2.2:11434
  // - iOS 시뮬레이터 / macOS: http://localhost:11434
  // - 실기기 (Wi-Fi): http://<PC_LOCAL_IP>:11434 (예: http://192.168.0.15:11434)
  String serverHost = 'http://10.0.2.2:11434';
  String modelName = 'llava';

  String get generateUrl => '$serverHost/api/generate';
  String get tagsUrl => '$serverHost/api/tags';

  /// Ollama 서버 연결 및 모델 상태 테스트
  Future<bool> testConnection() async {
    try {
      final response = await http
          .get(Uri.parse(tagsUrl))
          .timeout(const Duration(seconds: 4));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// 카메라 프레임을 받아 로컬 멀티모달 AI(LLaVA)에 전송하고 속마음 텍스트를 반환
  Future<String> fetchLiveDogThought(XFile capturedImage) async {
    try {
      // 1. 이미지를 바이트로 읽고 최적화 (대역폭 절약 및 추론 속도 대폭 향상)
      final imageBytes = await capturedImage.readAsBytes();
      final originalImage = img.decodeImage(imageBytes);

      List<int> compressedBytes;
      if (originalImage != null) {
        // AI 비전 분석에 충분한 해상도(가로 512px)로 리사이징
        final resizedImage = img.copyResize(originalImage, width: 512);
        compressedBytes = img.encodeJpg(resizedImage, quality: 85);
      } else {
        compressedBytes = imageBytes;
      }

      final base64Image = base64Encode(compressedBytes);

      // 2. 동적 프롬프트 (정형화된 템플릿 탈피, 실제 시각적 상황에 기반한 창의적 독백 유도)
      const prompt =
          "You are a witty, unpredictable dog captured in this exact camera frame. "
          "Look closely at the posture, face expression, eyes, environment, and background in this image. "
          "Never repeat cliché lines. Generate a totally unique, humorous, and vivid 1-sentence inner monologue in Korean "
          "representing what the dog is genuinely thinking at this very split second. "
          "Output ONLY the Korean monologue sentence with no quotes, translation, or extra explanation.";

      // 3. Ollama LLaVA API 규격 페이로드 구성
      final payload = {
        "model": modelName,
        "prompt": prompt,
        "images": [base64Image],
        "stream": false,
        "options": {
          "temperature": 0.95, // 창의성 및 변동성 극대화
          "num_predict": 120, // 1~2문장의 간결한 대사 생성
        }
      };

      // 4. HTTP POST 요청 전송
      final response = await http
          .post(
            Uri.parse(generateUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 25));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        final thought = data['response']?.toString().trim();
        if (thought != null && thought.isNotEmpty) {
          // 따옴표 정리
          return thought.replaceAll('"', '').replaceAll("'", '');
        }
        return "으음... 지금은 냄새 맡느라 머릿속이 새하얘!";
      } else {
        return "여기가 어디지? (AI 서버 응답 오류: ${response.statusCode})";
      }
    } catch (e) {
      // ignore: avoid_print
      print("Ollama AI 연동 에러: $e");
      return "앗, 순간 딴생각 하느라 멍때렸어! (서버 연결을 확인해주세요)";
    }
  }
}
