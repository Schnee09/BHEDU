/// Core UI Components
library;

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';

/// App stylized card with optional glass effect
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final bool isGlass;
  final double? width;
  final double? height;

  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.color,
    this.isGlass = false,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    if (isGlass) {
      return _buildGlassCard(context);
    }
    return _buildStandardCard(context);
  }

  Widget _buildStandardCard(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: color ?? Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10), // 0.04 * 255 ~= 10
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: Theme.of(context).dividerColor.withAlpha(20), // 0.08 * 255 ~= 20
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      ),
    );
  }

  Widget _buildGlassCard(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: (color ?? Theme.of(context).cardColor).withAlpha(150), // 0.6 * 255 ~= 153
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withAlpha(25), // 0.1 * 255 ~= 25
            ),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              child: Padding(
                padding: padding,
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Shimmer placeholder for loading states
class AppShimmer extends StatelessWidget {
  final double width;
  final double height;
  final double radius;
  final ShapeBorder? shape;

  const AppShimmer({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.radius = 8,
    this.shape,
  });

  const AppShimmer.circle({
    super.key,
    required double size,
  })  : width = size,
        height = size,
        radius = size / 2,
        shape = const CircleBorder();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Shimmer.fromColors(
      // Updated to match warm brown theme
      baseColor: isDark ? const Color(0xFF241E18) : const Color(0xFFE2E8F0),
      highlightColor: isDark ? const Color(0xFF3D3228) : const Color(0xFFF1F5F9),
      child: Container(
        width: width,
        height: height,
        decoration: shape != null 
          ? ShapeDecoration(color: Colors.white, shape: shape!)
          : BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(radius),
            ),
      ),
    );
  }
}

/// Helper to wrap a list of widgets with animations
class AnimatedListWrapper extends StatelessWidget {
  final List<Widget> children;
  final double interval;
  final Duration duration;

  const AnimatedListWrapper({
    super.key,
    required this.children,
    this.interval = 50,
    this.duration = const Duration(milliseconds: 300),
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: children
          .map((child) => child)
          .toList()
          .animate(interval: interval.ms)
          .fadeIn(duration: duration)
          .slideY(begin: 0.1, end: 0, duration: duration, curve: Curves.easeOutQuad),
    );
  }
}

/// Section Header
class SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onMore;

  const SectionHeader({
    super.key,
    required this.title,
    this.onMore,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          if (onMore != null)
            TextButton(
              onPressed: onMore,
              child: const Text('See all'),
            ),
        ],
      ),
    );
  }
}

/// A container with a colorful gradient background
class GradientContainer extends StatelessWidget {
  final Widget child;
  final List<Color> colors;
  final EdgeInsetsGeometry padding;
  final double? height;
  final VoidCallback? onTap;

  const GradientContainer({
    super.key,
    required this.child,
    required this.colors,
    this.padding = const EdgeInsets.all(16),
    this.height,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: colors.first.withAlpha(100), // 0.4 * 255 ~= 102
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      ),
    );
  }
}
