/// Customization Provider for BH-EDU Flutter App
/// Mirrors the web CustomizationContext for cross-platform UI consistency
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Available accent color options matching web CustomizationContext
enum AccentColor {
  amber,
  blue,
  emerald,
  rose,
  slate,
}

/// UI density options
enum UIDensity {
  cozy,
  compact,
}

/// Accent color palette definition
class AccentColorPalette {
  final Color primary;
  final Color hover;
  final Color alpha10;
  
  const AccentColorPalette({
    required this.primary,
    required this.hover,
    required this.alpha10,
  });
}

/// Accent color palettes matching web CSS variables
const Map<AccentColor, AccentColorPalette> accentPalettes = {
  AccentColor.amber: AccentColorPalette(
    primary: Color(0xFFF59E0B),
    hover: Color(0xFFD97706),
    alpha10: Color(0x1AF59E0B),
  ),
  AccentColor.blue: AccentColorPalette(
    primary: Color(0xFF3B82F6),
    hover: Color(0xFF2563EB),
    alpha10: Color(0x1A3B82F6),
  ),
  AccentColor.emerald: AccentColorPalette(
    primary: Color(0xFF10B981),
    hover: Color(0xFF059669),
    alpha10: Color(0x1A10B981),
  ),
  AccentColor.rose: AccentColorPalette(
    primary: Color(0xFFF43F5E),
    hover: Color(0xFFE11D48),
    alpha10: Color(0x1AF43F5E),
  ),
  AccentColor.slate: AccentColorPalette(
    primary: Color(0xFF64748B),
    hover: Color(0xFF475569),
    alpha10: Color(0x1A64748B),
  ),
};

/// Customization state model
class CustomizationState {
  final AccentColor accentColor;
  final UIDensity density;
  final double glassOpacity;
  final double blurStrength;
  final ThemeMode themeMode;

  const CustomizationState({
    this.accentColor = AccentColor.amber,
    this.density = UIDensity.cozy,
    this.glassOpacity = 0.6,
    this.blurStrength = 16.0,
    this.themeMode = ThemeMode.dark,
  });

  /// Get current accent palette
  AccentColorPalette get palette => accentPalettes[accentColor]!;

  /// Get spacing multiplier based on density
  double get spacingMultiplier => density == UIDensity.compact ? 0.85 : 1.0;

  /// Get font size multiplier based on density
  double get fontSizeMultiplier => density == UIDensity.compact ? 0.9 : 1.0;

  CustomizationState copyWith({
    AccentColor? accentColor,
    UIDensity? density,
    double? glassOpacity,
    double? blurStrength,
    ThemeMode? themeMode,
  }) {
    return CustomizationState(
      accentColor: accentColor ?? this.accentColor,
      density: density ?? this.density,
      glassOpacity: glassOpacity ?? this.glassOpacity,
      blurStrength: blurStrength ?? this.blurStrength,
      themeMode: themeMode ?? this.themeMode,
    );
  }
}

/// Customization notifier for managing UI preferences
class CustomizationNotifier extends StateNotifier<CustomizationState> {
  CustomizationNotifier() : super(const CustomizationState()) {
    _loadPreferences();
  }

  static const String _keyAccentColor = 'bhedu_accent_color';
  static const String _keyDensity = 'bhedu_density';
  static const String _keyGlassOpacity = 'bhedu_glass_opacity';
  static const String _keyBlurStrength = 'bhedu_blur_strength';
  static const String _keyThemeMode = 'bhedu_theme_mode';

  /// Load preferences from SharedPreferences
  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final accentIndex = prefs.getInt(_keyAccentColor) ?? 0;
      final densityIndex = prefs.getInt(_keyDensity) ?? 0;
      final glassOpacity = prefs.getDouble(_keyGlassOpacity) ?? 0.6;
      final blurStrength = prefs.getDouble(_keyBlurStrength) ?? 16.0;
      final themeModeIndex = prefs.getInt(_keyThemeMode) ?? 2; // dark default

      state = CustomizationState(
        accentColor: AccentColor.values[accentIndex.clamp(0, AccentColor.values.length - 1)],
        density: UIDensity.values[densityIndex.clamp(0, UIDensity.values.length - 1)],
        glassOpacity: glassOpacity.clamp(0.3, 1.0),
        blurStrength: blurStrength.clamp(8.0, 32.0),
        themeMode: ThemeMode.values[themeModeIndex.clamp(0, ThemeMode.values.length - 1)],
      );
    } catch (e) {
      // Keep default state on error
      debugPrint('[CustomizationProvider] Error loading preferences: $e');
    }
  }

  /// Save preferences to SharedPreferences
  Future<void> _savePreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_keyAccentColor, state.accentColor.index);
      await prefs.setInt(_keyDensity, state.density.index);
      await prefs.setDouble(_keyGlassOpacity, state.glassOpacity);
      await prefs.setDouble(_keyBlurStrength, state.blurStrength);
      await prefs.setInt(_keyThemeMode, state.themeMode.index);
    } catch (e) {
      debugPrint('[CustomizationProvider] Error saving preferences: $e');
    }
  }

  /// Set accent color
  void setAccentColor(AccentColor color) {
    state = state.copyWith(accentColor: color);
    _savePreferences();
  }

  /// Set UI density
  void setDensity(UIDensity density) {
    state = state.copyWith(density: density);
    _savePreferences();
  }

  /// Set glass opacity (0.3 - 1.0)
  void setGlassOpacity(double opacity) {
    state = state.copyWith(glassOpacity: opacity.clamp(0.3, 1.0));
    _savePreferences();
  }

  /// Set blur strength (8 - 32)
  void setBlurStrength(double strength) {
    state = state.copyWith(blurStrength: strength.clamp(8.0, 32.0));
    _savePreferences();
  }

  /// Set theme mode
  void setThemeMode(ThemeMode mode) {
    state = state.copyWith(themeMode: mode);
    _savePreferences();
  }

  /// Reset to defaults
  void resetToDefaults() {
    state = const CustomizationState();
    _savePreferences();
  }
}

/// Main customization provider
final customizationProvider =
    StateNotifierProvider<CustomizationNotifier, CustomizationState>((ref) {
  return CustomizationNotifier();
});

/// Convenience providers for individual values
final accentColorProvider = Provider<AccentColorPalette>((ref) {
  return ref.watch(customizationProvider).palette;
});

final densityProvider = Provider<UIDensity>((ref) {
  return ref.watch(customizationProvider).density;
});

final glassOpacityProvider = Provider<double>((ref) {
  return ref.watch(customizationProvider).glassOpacity;
});

final blurStrengthProvider = Provider<double>((ref) {
  return ref.watch(customizationProvider).blurStrength;
});

final themeModeProvider = Provider<ThemeMode>((ref) {
  return ref.watch(customizationProvider).themeMode;
});
