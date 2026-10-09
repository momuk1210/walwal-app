import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class RadarScreen extends StatefulWidget {
  const RadarScreen({super.key});

  @override
  State<RadarScreen> createState() => _RadarScreenState();
}

class _RadarScreenState extends State<RadarScreen> {
  late GoogleMapController _mapController;
  static const LatLng _seoulForestCenter = LatLng(37.5445, 127.0560);

  final Set<Marker> _markers = {};
  final Set<Circle> _circles = {};
  final double _radiusMeters = 500.0;

  @override
  void initState() {
    super.initState();
    _initMapDecorations();
  }

  void _initMapDecorations() {
    // 500m 반경 원
    _circles.add(
      Circle(
        circleId: const CircleId('radar_range'),
        center: _seoulForestCenter,
        radius: _radiusMeters,
        fillColor: const Color(0x222EC4B6),
        strokeColor: const Color(0xFF2EC4B6),
        strokeWidth: 2,
      ),
    );

    // 내 위치 마커
    _markers.add(
      const Marker(
        markerId: MarkerId('my_location'),
        position: _seoulForestCenter,
        infoWindow: InfoWindow(title: '내 위치 (서울숲 광장)'),
      ),
    );

    // 주변 강아지 마커
    _markers.add(
      const Marker(
        markerId: MarkerId('bori'),
        position: LatLng(37.5452, 127.0570),
        infoWindow: InfoWindow(
          title: '보리 (골든 리트리버)',
          snippet: '야호! 풀냄새 최고야! 여기서 매일 뛰놀고 싶어! ',
        ),
      ),
    );

    _markers.add(
      const Marker(
        markerId: MarkerId('peanut'),
        position: LatLng(37.5438, 127.0550),
        infoWindow: InfoWindow(
          title: '땅콩이 (포메라니안)',
          snippet: '다들 비켜! 내 꼬리모터는 지금 3000RPM이야!',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('동네 레이더 (Google Maps)'),
        backgroundColor: const Color(0xFF14171E),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location, color: Color(0xFFFF7E36)),
            onPressed: () {
              _mapController.animateCamera(
                CameraUpdate.newLatLng(_seoulForestCenter),
              );
            },
          )
        ],
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: const CameraPosition(
              target: _seoulForestCenter,
              zoom: 16.0,
            ),
            markers: _markers,
            circles: _circles,
            onMapCreated: (controller) => _mapController = controller,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
          ),
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xE61A1F29),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFF7E36), width: 2),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '근처 보리 (골든 리트리버) 약 85m 접근',
                    style: TextStyle(
                      color: Color(0xFFFF7E36),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    '"야호! 풀냄새 최고야! 친구 냄새가 난다! 인사하러 갈까?!"',
                    style: TextStyle(color: Colors.white, fontSize: 14),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
