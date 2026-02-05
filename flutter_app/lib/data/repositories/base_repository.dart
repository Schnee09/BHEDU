/// Base Repository
/// Provides common Supabase access and error handling
library;

import 'dart:developer' as developer;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/supabase_config.dart' as config;

export 'package:supabase_flutter/supabase_flutter.dart';

abstract class BaseRepository {
  /// Get Supabase client
  SupabaseClient get supabase => config.supabase;

  /// Get current user
  User? get currentUser => config.currentUser;

  /// Get current session
  Session? get currentSession => supabase.auth.currentSession;

  /// Handle Supabase errors
  T handleErrors<T>(T Function() action) {
    try {
      return action();
    } catch (e) {
      // Log error or rethrow custom exception
      developer.log('[Repository Error]', error: e);
      rethrow;
    }
  }

  /// Async error handler
  Future<T> handleAsyncErrors<T>(Future<T> Function() action) async {
    try {
      return await action();
    } catch (e) {
      if (e is PostgrestException) {
        developer.log('[Supabase Error]', error: e);
      } else {
        developer.log('[Repository Error]', error: e);
      }
      rethrow;
    }
  }
}
