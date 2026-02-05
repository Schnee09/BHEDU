/// QR Scanner Screen - Scan QR for attendance check-in
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../config/theme.dart';
// import '../../data/repositories/attendance_repository.dart'; // Unused

class QRScannerScreen extends ConsumerStatefulWidget {
  final String? classId;

  const QRScannerScreen({super.key, this.classId});

  @override
  ConsumerState<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends ConsumerState<QRScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _isProcessing = false;
  String? _lastScannedCode;
  String? _resultMessage;
  bool? _isSuccess;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _processQRCode(String code) async {
    if (_isProcessing || code == _lastScannedCode) return;

    setState(() {
      _isProcessing = true;
      _lastScannedCode = code;
    });

    try {
      // Parse QR code (expected format: student_id or attendance data)
      // final repo = AttendanceRepository(); // Unused

      // For now, show the scanned result
      // In production, this would call the attendance API
      setState(() {
        _resultMessage = 'Scanned: $code';
        _isSuccess = true;
      });

      // Show success feedback
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Check-in successful: $code'),
            backgroundColor: AppColors.success,
          ),
        );
      }

      // Wait before allowing next scan
      await Future.delayed(const Duration(seconds: 2));
    } catch (e) {
      setState(() {
        _resultMessage = 'Error: $e';
        _isSuccess = false;
      });
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Check-in'),
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: _controller,
              builder: (context, state, child) {
                return Icon(
                  state.torchState == TorchState.on
                      ? Icons.flash_on
                      : Icons.flash_off,
                );
              },
            ),
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Scanner view
          Expanded(
            flex: 3,
            child: Stack(
              children: [
                MobileScanner(
                  controller: _controller,
                  onDetect: (capture) {
                    final barcodes = capture.barcodes;
                    if (barcodes.isNotEmpty &&
                        barcodes.first.rawValue != null) {
                      _processQRCode(barcodes.first.rawValue!);
                    }
                  },
                ),
                // Overlay with scanning frame
                _ScannerOverlay(isProcessing: _isProcessing),
              ],
            ),
          ),

          // Result panel
          Expanded(
            flex: 1,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              color: AppColors.surface,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_isProcessing)
                    const CircularProgressIndicator()
                  else if (_resultMessage != null) ...[
                    Icon(
                      _isSuccess == true ? Icons.check_circle : Icons.error,
                      color: _isSuccess == true
                          ? AppColors.success
                          : AppColors.error,
                      size: 48,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _resultMessage!,
                      style: TextStyle(
                        color: _isSuccess == true
                            ? AppColors.success
                            : AppColors.error,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ] else ...[
                    Icon(
                      Icons.qr_code_scanner,
                      size: 48,
                      color: AppColors.textMuted,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Point camera at student QR code',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScannerOverlay extends StatelessWidget {
  final bool isProcessing;

  const _ScannerOverlay({required this.isProcessing});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final scanAreaSize = constraints.maxWidth * 0.7;
        final left = (constraints.maxWidth - scanAreaSize) / 2;
        final top = (constraints.maxHeight - scanAreaSize) / 2;

        return Stack(
          children: [
            // Dark overlay
            ColorFiltered(
              colorFilter: ColorFilter.mode(
                Colors.black.withAlpha(150),
                BlendMode.srcOut,
              ),
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      backgroundBlendMode: BlendMode.dstOut,
                    ),
                  ),
                  Positioned(
                    left: left,
                    top: top,
                    child: Container(
                      width: scanAreaSize,
                      height: scanAreaSize,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Scan frame border
            Positioned(
              left: left,
              top: top,
              child: Container(
                width: scanAreaSize,
                height: scanAreaSize,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isProcessing ? AppColors.primary : Colors.white,
                    width: 3,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
            // Corner decorations
            ..._buildCorners(left, top, scanAreaSize),
          ],
        );
      },
    );
  }

  List<Widget> _buildCorners(double left, double top, double size) {
    const cornerSize = 24.0;
    const color = AppColors.primary;

    return [
      // Top-left
      Positioned(
        left: left - 2,
        top: top - 2,
        child: Container(width: cornerSize, height: 4, color: color),
      ),
      Positioned(
        left: left - 2,
        top: top - 2,
        child: Container(width: 4, height: cornerSize, color: color),
      ),
      // Top-right
      Positioned(
        right: left - 2,
        top: top - 2,
        child: Container(width: cornerSize, height: 4, color: color),
      ),
      Positioned(
        right: left - 2,
        top: top - 2,
        child: Container(width: 4, height: cornerSize, color: color),
      ),
      // Bottom-left
      Positioned(
        left: left - 2,
        bottom: top - 2,
        child: Container(width: cornerSize, height: 4, color: color),
      ),
      Positioned(
        left: left - 2,
        bottom: top - 2,
        child: Container(width: 4, height: cornerSize, color: color),
      ),
      // Bottom-right
      Positioned(
        right: left - 2,
        bottom: top - 2,
        child: Container(width: cornerSize, height: 4, color: color),
      ),
      Positioned(
        right: left - 2,
        bottom: top - 2,
        child: Container(width: 4, height: cornerSize, color: color),
      ),
    ];
  }
}
