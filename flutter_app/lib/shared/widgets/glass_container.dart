/// GlassContainer Widget for BH-EDU Flutter App
/// Provides glassmorphism effect matching web's .glass-premium class
/// Uses CustomizationProvider for dynamic blur and opacity
library;

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/customization_provider.dart';
import '../../config/theme.dart';

/// Premium glassmorphism container matching web design system
class GlassContainer extends ConsumerWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? borderRadius;
  final bool showBorder;
  final bool showGlow;
  final Color? glowColor;

  const GlassContainer({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.showBorder = true,
    this.showGlow = false,
    this.glowColor,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customization = ref.watch(customizationProvider);
    final palette = customization.palette;
    final blurStrength = customization.blurStrength;
    final glassOpacity = customization.glassOpacity;
    final densityMultiplier = customization.spacingMultiplier;

    final effectiveRadius = borderRadius ?? (16 * densityMultiplier);
    final effectiveGlowColor = glowColor ?? palette.primary;

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(effectiveRadius),
        boxShadow: showGlow
            ? [
                BoxShadow(
                  color: effectiveGlowColor.withAlpha(51), // 0.2 opacity
                  blurRadius: 24,
                  spreadRadius: -4,
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(effectiveRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: blurStrength,
            sigmaY: blurStrength,
          ),
          child: Container(
            padding: padding ?? EdgeInsets.all(16 * densityMultiplier),
            decoration: BoxDecoration(
              // Glass background with dynamic opacity
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.surface.withAlpha((glassOpacity * 255).toInt()),
                  AppColors.surfaceVariant.withAlpha(((glassOpacity - 0.1).clamp(0.0, 1.0) * 255).toInt()),
                ],
              ),
              borderRadius: BorderRadius.circular(effectiveRadius),
              border: showBorder
                  ? Border.all(
                      color: AppColors.borderSubtle.withAlpha(128),
                      width: 1,
                    )
                  : null,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Glass card variant with accent glow
class GlassCard extends ConsumerWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final bool isActive;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customization = ref.watch(customizationProvider);
    final palette = customization.palette;

    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        padding: padding,
        margin: margin,
        showGlow: isActive,
        glowColor: palette.primary,
        child: child,
      ),
    );
  }
}

/// Glass button with premium interaction
class GlassButton extends ConsumerWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final bool isLoading;
  final EdgeInsetsGeometry? padding;

  const GlassButton({
    super.key,
    required this.child,
    this.onPressed,
    this.isLoading = false,
    this.padding,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customization = ref.watch(customizationProvider);
    final palette = customization.palette;
    final densityMultiplier = customization.spacingMultiplier;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: isLoading ? null : onPressed,
        borderRadius: BorderRadius.circular(12 * densityMultiplier),
        child: GlassContainer(
          padding: padding ?? EdgeInsets.symmetric(
            horizontal: 20 * densityMultiplier,
            vertical: 12 * densityMultiplier,
          ),
          borderRadius: 12 * densityMultiplier,
          showBorder: true,
          child: isLoading
              ? SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation(palette.primary),
                  ),
                )
              : child,
        ),
      ),
    );
  }
}
