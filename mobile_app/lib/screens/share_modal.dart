import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
// Removed social_share due to build errors
import 'package:url_launcher/url_launcher.dart';
// Removed share_plus due to compileSdk conflicts during release build

class ShareExportModal extends StatefulWidget {
  final String dogName;
  final String breedKr;
  final String thought;
  final String avatarPath; // 로컬 이미지 경로

  const ShareExportModal({
    super.key,
    required this.dogName,
    required this.breedKr,
    required this.thought,
    required this.avatarPath,
  });

  @override
  State<ShareExportModal> createState() => _ShareExportModalState();
}

class _ShareExportModalState extends State<ShareExportModal> {
  final ScreenshotController screenshotController = ScreenshotController();
  bool isExporting = false;

  Future<String?> _captureAndSaveImage() async {
    try {
      final directory = (await getApplicationDocumentsDirectory()).path;
      final fileName = 'walwal_${DateTime.now().millisecondsSinceEpoch}.png';
      final path = '$directory/$fileName';

      final Uint8List? image = await screenshotController.capture();
      if (image == null) return null;

      final File file = File(path);
      await file.writeAsBytes(image);
      return path;
    } catch (e) {
      return null;
    }
  }

  void _shareToInstagram() async {
    setState(() => isExporting = true);
    final imagePath = await _captureAndSaveImage();
    if (!mounted) return;
    setState(() => isExporting = false);

    if (imagePath != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('공유 기능이 호출되었습니다 (테스트 모드)')),
      );
    }
  }

  void _shareToTikTok() async {
    setState(() => isExporting = true);
    final imagePath = await _captureAndSaveImage();
    if (!mounted) return;
    setState(() => isExporting = false);

    if (imagePath != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('TikTok 공유 준비 완료 (테스트 모드)')),
      );
    }
  }

  void _shareToYouTube() async {
    setState(() => isExporting = true);
    final imagePath = await _captureAndSaveImage();
    if (!mounted) return;
    setState(() => isExporting = false);

    if (imagePath != null) {
      final Uri youtubeUri = Uri.parse("youtube://");
      if (await canLaunchUrl(youtubeUri)) {
        await launchUrl(youtubeUri);
      }
    }
  }

  void _shareMore() async {
    setState(() => isExporting = true);
    final imagePath = await _captureAndSaveImage();
    if (!mounted) return;
    setState(() => isExporting = false);

    if (imagePath != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('기타 공유 준비 완료 (테스트 모드)')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 24, left: 16, right: 16, bottom: 40),
      decoration: const BoxDecoration(
        color: Color(0xFFF8F9FB), // Light background
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(32)), // More rounded
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const Text(
            "공유 위치 선택",
            style: TextStyle(
                color: Color(0xFF2D3748),
                fontSize: 20,
                fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "클릭 시 플랫폼 화면으로 바로 이동하여 즉시 등록할 수 있습니다.",
            style: TextStyle(color: Color(0xFFA0AEC0), fontSize: 12),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // 렌더링될 숏폼 카드 영역 (Screenshot)
          Screenshot(
            controller: screenshotController,
            child: Container(
              width: 240,
              height: 400,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  )
                ],
              ),
              child: Column(
                children: [
                  Expanded(
                    flex: 6,
                    child: ClipRRect(
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(24)),
                      child: widget.avatarPath.isNotEmpty
                          ? Image.file(File(widget.avatarPath),
                              fit: BoxFit.cover, width: double.infinity)
                          : Container(
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.pets,
                                  color: Colors.grey, size: 48)),
                    ),
                  ),
                  Expanded(
                    flex: 4,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius:
                            BorderRadius.vertical(bottom: Radius.circular(24)),
                      ),
                      width: double.infinity,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("💬 ${widget.dogName}",
                              style: const TextStyle(
                                  color: Color(0xFFFFB320),
                                  fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('"${widget.thought}"',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF2D3748))),
                          const Spacer(),
                          const Align(
                            alignment: Alignment.center,
                            child: Text("⚡ WalWal AI 반려견 실시간 속마음 번역기",
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 10)),
                          ),
                        ],
                      ),
                    ),
                  )
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          if (isExporting)
            const CircularProgressIndicator(color: Color(0xFFFFB320))
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildShareButton("Instagram", Icons.camera_alt,
                    Colors.pink.shade400, _shareToInstagram),
                _buildShareButton(
                    "TikTok", Icons.music_note, Colors.black87, _shareToTikTok),
                _buildShareButton("YouTube", Icons.play_arrow,
                    Colors.red.shade500, _shareToYouTube),
                _buildShareButton(
                    "더 보기", Icons.more_horiz, Colors.white, _shareMore,
                    isWhite: true),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildShareButton(
      String label, IconData icon, Color bgColor, VoidCallback onTap,
      {bool isWhite = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: isWhite
                        ? Colors.black.withValues(alpha: 0.05)
                        : bgColor.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ]),
            child: Icon(icon,
                color: isWhite ? Colors.black87 : Colors.white, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label,
              style: const TextStyle(
                  color: Color(0xFF2D3748),
                  fontSize: 12,
                  fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
