/// Biometric Authentication Service
library;

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Biometric auth provider
final biometricServiceProvider = Provider((ref) => BiometricService());

/// Biometric enabled preference provider
final biometricEnabledProvider = StateProvider<bool>((ref) => false);

class BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();
  static const _biometricEnabledKey = 'biometric_enabled';

  /// Check if biometrics are available
  Future<bool> isBiometricAvailable() async {
    try {
      final canAuthenticate = await _auth.canCheckBiometrics;
      final isDeviceSupported = await _auth.isDeviceSupported();
      return canAuthenticate && isDeviceSupported;
    } on PlatformException {
      return false;
    }
  }

  /// Get available biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  /// Authenticate with biometrics
  Future<bool> authenticate({String reason = 'Vui lòng xác thực để tiếp tục'}) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } on PlatformException {
      return false;
    }
  }

  /// Check if biometric login is enabled
  Future<bool> isBiometricLoginEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_biometricEnabledKey) ?? false;
  }

  /// Enable/disable biometric login
  Future<void> setBiometricLoginEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_biometricEnabledKey, enabled);
  }

  /// Get friendly name for biometric type
  String getBiometricName(List<BiometricType> types) {
    if (types.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (types.contains(BiometricType.fingerprint)) {
      return 'Vân tay';
    } else if (types.contains(BiometricType.iris)) {
      return 'Mống mắt';
    }
    return 'Sinh trắc học';
  }
}
