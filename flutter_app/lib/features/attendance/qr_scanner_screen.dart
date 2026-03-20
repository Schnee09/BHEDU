/// QR Scanner Screen - Scan QR for attendance check-in
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../core/constants/app_constants.dart';
import '../../shared/providers/auth_provider.dart';
import 'attendance_screen.dart';

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
      final repo = ref.read(attendanceRepositoryProvider);
      final profile = ref.read(authNotifierProvider).value;
      
      if (widget.classId == null) {
        throw 'Vui lòng chọn lớp học trước khi quét QR';
      }

      // code is expected to be student_id
      await repo.markAttendance(
        studentId: code,
        classId: widget.classId!,
        date: DateFormat('yyyy-MM-dd').format(DateTime.now()),
        status: AttendanceStatus.present.value, // Default to present for QR scan
        isQrCheckIn: true,
        markedBy: profile?.id,
      );

      setState(() {
        _resultMessage = 'Điểm danh thành công học sinh: $code';
        _isSuccess = true;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã điểm danh: $code'),
            backgroundColor: AppColors.success,
          ),
        );
      }

      // Wait before allowing next scan to avoid duplicates
      await Future.delayed(const Duration(seconds: 3));
      
      if (mounted) {
        setState(() {
          _lastScannedCode = null;
        });
      }
    } catch (e) {
      setState(() {
        _resultMessage = 'Lỗi: $e';
        _isSuccess = false;
      });
      
      // Allow re-scanning after an error
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        setState(() {
          _lastScannedCode = null;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Điểm danh QR'),
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
                    const Text(
                      'Hướng camera vào mã QR của học sinh',
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
