import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/dog_profile.dart';

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
  double _radiusMeters = 500.0;

  @override
  void initState() {
    super.initState();
    _initMapDecorations();
  }

  void _initMapDecorations() {
    // 500m Radius Circle
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

    // My Location Marker
    _markers.add(
      const Marker(
        markerId: MarkerId('my_location'),
        position: _seoulForestCenter,
        infoWindow: InfoWindow(title: '내 위치 (성수동 서울숲)'),
      ),
    );

    // Dogs Markers
    _markers.add(
      const Marker(
        markerId: MarkerId('bori'),
        position: LatLng(37.5452, 127.0570),
        infoWindow: InfoWindow(title: '보리 (골든 리트리버)', snippet: '와! 새로운 친구다! 나랑 당장 놀자! ??'),
      ),
    );

    _markers.add(
      const Marker(
        markerId: MarkerId('peanut'),
        position: LatLng(37.5438, 127.0550),
        infoWindow: InfoWindow(title: '땅콩 (웰시코기)', snippet: '다리는 짧아도 내 엉덩이 모터는 3000RPM! ??'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('왈왈 레이더 (Google Maps)'),
        backgroundColor: const Color(0xFF14171E),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location, color: Color(0xFFFF7E36)),
            onPressed: () {
              _mapController.animateCamera(CameraUpdate.newLatLng(_seoulForestCenter));
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
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('?? 보리 (골든 리트리버) · 85m 인근', style: TextStyle(color: Color(0xFFFF7E36), fontWeight: FontWeight.bold)),
                  SizedBox(height: 6),
                  Text('"와! 새로운 친구다! 나랑 당장 놀자! 온몸으로 환영해!! ??"', style: TextStyle(color: Colors.white, fontSize: 14)),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
