/// BH-EDU App Configuration
/// Cross-platform synchronized with web CustomizationContext
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
import '../core/providers/customization_provider.dart';
import 'routes.dart';

class BHEduApp extends ConsumerWidget {
  const BHEduApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final customization = ref.watch(customizationProvider);

    // Generate dynamic theme based on customization state
    final dynamicTheme = AppTheme.dynamicDarkTheme(customization);

    return MaterialApp.router(
      title: 'BH-EDU',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: dynamicTheme,
      themeMode: customization.themeMode,
      routerConfig: router,
    );
  }
}

