/// BH-EDU Theme Configuration
/// Golden Amber brand theme matching the web application
/// Using Be Vietnam Pro font and warm brown color palette
/// Supports dynamic accent colors via CustomizationProvider
library;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/providers/customization_provider.dart';
import 'design_tokens.dart';

/// BH-EDU Color Palette - Matching Web Design System
class AppColors {
  AppColors._();

  // Primary - Golden Amber (from web --color-primary)
  static const Color primary50 = DesignTokens.primary50;
  static const Color primary100 = DesignTokens.primary100;
  static const Color primary200 = DesignTokens.primary200;
  static const Color primary300 = DesignTokens.primary300;
  static const Color primary400 = DesignTokens.primary400;
  static const Color primary = DesignTokens.primaryMain; // Main primary
  static const Color primary600 = DesignTokens.primary600;
  static const Color primary700 = DesignTokens.primary700;
  static const Color primaryLight = DesignTokens.primary400;
  static const Color primaryDark = DesignTokens.primary600;

  // Accent - Brown (from BH-EDU branding)
  static const Color accent = DesignTokens
      .primaryMain; // Using primary as accent for now or define specifically
  static const Color accentDark = Color(0xFF5D3E2A);

  // Background - Warm Brown (matching web dark mode)
  static const Color background =
      DesignTokens.darkBackground; // Warm brown-black
  static const Color backgroundSecondary = DesignTokens.darkSurface;
  static const Color surface = DesignTokens.darkSurface; // Warm dark surface
  static const Color surfaceHover = Color(0xFF2E261E);
  static const Color surfaceVariant = Color(0xFF3D3228);

  // Text - Warm white tones
  static const Color textPrimary = Color(0xFFFDF8F3); // Warm white
  static const Color textSecondary = Color(0xFFD4C4B0); // Warm gray
  static const Color textTertiary = Color(0xFFA89888); // Muted brown
  static const Color textMuted = Color(0xFF786858); // Dark muted

  // Borders
  static const Color borderSubtle = Color(0xFF2E261E);
  static const Color borderLight = Color(0xFF3D3228);
  static const Color borderDefault = Color(0xFF4D4238);

  // Semantic Colors
  static const Color success = DesignTokens.success;
  static const Color warning = DesignTokens.warning;
  static const Color error = DesignTokens.error;
  static const Color info = DesignTokens.info;

  // Role Colors
  static const Color admin = DesignTokens.error;
  static const Color staff = Color(0xFF8B5CF6);
  static const Color teacher = DesignTokens.info;
  static const Color student = DesignTokens.success;

  // Attendance Status
  static const Color present = DesignTokens.success;
  static const Color absent = DesignTokens.error;
  static const Color late = DesignTokens.warning;
  static const Color excused = DesignTokens.info;

  // Chart Colors (matching web)
  static const Color chart1 = DesignTokens.primary400;
  static const Color chart2 = DesignTokens.warning;
  static const Color chart3 = Color(0xFF34D399);
  static const Color chart4 = Color(0xFF60A5FA);
  static const Color chart5 = Color(0xFFF472B6);
}

/// BH-EDU Theme Data
class AppTheme {
  AppTheme._();

  /// Dark theme (primary)
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        primaryContainer: AppColors.primaryDark,
        secondary: AppColors.primaryLight,
        surface: AppColors.surface,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSurface: AppColors.textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.beVietnamPro(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.surfaceVariant),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.beVietnamPro(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        hintStyle: const TextStyle(color: AppColors.textMuted),
        labelStyle: const TextStyle(color: AppColors.textSecondary),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      textTheme: GoogleFonts.beVietnamProTextTheme().apply(
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.surfaceVariant,
        thickness: 1,
      ),
    );
  }

  /// Light theme (optional)
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: Colors.white,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        primaryContainer: AppColors.primaryLight,
        secondary: AppColors.primaryDark,
        surface: Color(0xFFF8FAFC),
        error: AppColors.error,
      ),
      textTheme: GoogleFonts.beVietnamProTextTheme(),
    );
  }

  /// Dynamic dark theme based on CustomizationState
  /// Used for cross-platform consistency with web CustomizationContext
  static ThemeData dynamicDarkTheme(CustomizationState customization) {
    final palette = customization.palette;
    final densityMultiplier = customization.spacingMultiplier;

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: ColorScheme.dark(
        primary: palette.primary,
        primaryContainer: palette.hover,
        secondary: palette.primary.withAlpha(179),
        surface: AppColors.surface,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSurface: AppColors.textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.beVietnamPro(
          fontSize: 18 * customization.fontSizeMultiplier,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12 * densityMultiplier),
          side: const BorderSide(color: AppColors.surfaceVariant),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: palette.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: EdgeInsets.symmetric(
            horizontal: 24 * densityMultiplier,
            vertical: 14 * densityMultiplier,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10 * densityMultiplier),
          ),
          textStyle: GoogleFonts.beVietnamPro(
            fontSize: 16 * customization.fontSizeMultiplier,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10 * densityMultiplier),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10 * densityMultiplier),
          borderSide: BorderSide(color: palette.primary, width: 2),
        ),
        hintStyle: const TextStyle(color: AppColors.textMuted),
        labelStyle: const TextStyle(color: AppColors.textSecondary),
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16 * densityMultiplier,
          vertical: 16 * densityMultiplier,
        ),
      ),
      textTheme: GoogleFonts.beVietnamProTextTheme().apply(
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: palette.primary,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: palette.primary,
        foregroundColor: Colors.white,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.surfaceVariant,
        thickness: 1,
      ),
    );
  }
}
