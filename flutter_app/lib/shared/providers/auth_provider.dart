/// Authentication Providers using Riverpod
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/models/profile_model.dart';
import '../../data/repositories/auth_repository.dart';

/// Auth repository provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

/// Current auth user provider (Stream of auth state changes)
final authStateProvider = StreamProvider<AuthState>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange;
});

/// Auth notifier for managing profile state and login actions
class AuthNotifier extends StateNotifier<AsyncValue<ProfileModel?>> {
  final AuthRepository _authRepo;

  AuthNotifier(this._authRepo) : super(const AsyncValue.loading()) {
    _init(); // Auto check session on start
  }

  Future<void> _init() async {
    try {
      final session = _authRepo.currentSession;
      if (session != null) {
        await refreshProfile();
      } else {
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Reload user profile from database
  Future<void> refreshProfile() async {
    try {
      // Don't set loading state here to avoid UI flickering on refresh
      final profile = await _authRepo.getCurrentProfile();
      state = AsyncValue.data(profile);
    } catch (e, st) {
      // Don't clear state on error, just log or show toast
      print('[Auth] Failed to refresh profile: $e');
      // Only set error if we really want to block UI
      if (state.value == null) {
         state = AsyncValue.error(e, st);
      }
    }
  }

  /// Login
  Future<void> login(String email, String password) async {
    try {
      state = const AsyncValue.loading();
      await _authRepo.login(email, password);
      // After login success, fetch profile
      await refreshProfile();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow; 
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _authRepo.logout();
      state = const AsyncValue.data(null);
    } catch (e) {
      // Force logout on UI even if api fails
      state = const AsyncValue.data(null);
    }
  }
  
  ProfileModel? get currentProfile => state.value;
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AsyncValue<ProfileModel?>>((ref) {
  final authRepo = ref.watch(authRepositoryProvider);
  return AuthNotifier(authRepo);
});
