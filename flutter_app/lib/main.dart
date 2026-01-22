/// BH-EDU Mobile App - Main Entry Point
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'config/supabase_config.dart';
import 'core/services/cache_service.dart';
import 'app/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Set system UI style - Warm Brown theme
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF1A1410),  // Matching AppColors.background
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  // Initialize cache service
  await CacheService.init();
  
  // Initialize Vietnamese locale for timeago
  timeago.setLocaleMessages('vi', timeago.ViMessages());
  timeago.setDefaultLocale('vi');
  
  // Initialize Supabase
  await initSupabase();
  
  // Run app with Riverpod
  runApp(
    const ProviderScope(
      child: BHEduApp(),
    ),
  );
}
