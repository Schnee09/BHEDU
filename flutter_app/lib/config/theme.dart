/// BH-EDU Theme Configuration
/// Golden Amber brand theme matching the web application
/// Using Be Vietnam Pro font and warm brown color palette
library;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// BH-EDU Color Palette - Matching Web Design System
class AppColors {
  AppColors._();
  
  // Primary - Golden Amber (from web --color-primary)
  static const Color primary50 = Color(0xFFFFFBEB);
  static const Color primary100 = Color(0xFFFEF3C7);
  static const Color primary200 = Color(0xFFFDE68A);
  static const Color primary300 = Color(0xFFFCD34D);
  static const Color primary400 = Color(0xFFFBBF24);
  static const Color primary = Color(0xFFF5A623);  // Main primary
  static const Color primary600 = Color(0xFFD97706);
  static const Color primary700 = Color(0xFFB45309);
  static const Color primaryLight = Color(0xFFFBBF24);
  static const Color primaryDark = Color(0xFFD97706);
  
  // Accent - Brown (from BH-EDU branding)
  static const Color accent = Color(0xFF8B5A2B);
  static const Color accentDark = Color(0xFF5D3E2A);
  
  // Background - Warm Brown (matching web dark mode)
  static const Color background = Color(0xFF1A1410);        // Warm brown-black
  static const Color backgroundSecondary = Color(0xFF241E18);
  static const Color surface = Color(0xFF241E18);           // Warm dark surface
  static const Color surfaceHover = Color(0xFF2E261E);
  static const Color surfaceVariant = Color(0xFF3D3228);
  
  // Text - Warm white tones
  static const Color textPrimary = Color(0xFFFDF8F3);       // Warm white
  static const Color textSecondary = Color(0xFFD4C4B0);     // Warm gray  
  static const Color textTertiary = Color(0xFFA89888);      // Muted brown
  static const Color textMuted = Color(0xFF786858);         // Dark muted
  
  // Borders
  static const Color borderSubtle = Color(0xFF2E261E);
  static const Color borderLight = Color(0xFF3D3228);
  static const Color borderDefault = Color(0xFF4D4238);
  
  // Semantic Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
  
  // Role Colors
  static const Color admin = Color(0xFFEF4444);
  static const Color staff = Color(0xFF8B5CF6);
  static const Color teacher = Color(0xFF3B82F6);
  static const Color student = Color(0xFF22C55E);
  
  // Attendance Status
  static const Color present = Color(0xFF10B981);
  static const Color absent = Color(0xFFEF4444);
  static const Color late = Color(0xFFF59E0B);
  static const Color excused = Color(0xFF3B82F6);
  
  // Chart Colors (matching web)
  static const Color chart1 = Color(0xFFFBBF24);
  static const Color chart2 = Color(0xFFF59E0B);
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
}
