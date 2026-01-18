/// Authentication Providers using Riverpod
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/auth_repository.dart';

/// Auth repository provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

/// Current auth user provider
final authUserProvider = StreamProvider<AuthState>((ref) {
  final authRepo = ref.watch(authRepositoryProvider);
  return authRepo.authStateChanges;
});

/// User profile provider - fetches and caches the profile
final userProfileProvider = FutureProvider<UserModel?>((ref) async {
  final authState = ref.watch(authUserProvider);
  
  return authState.when(
    data: (state) async {
      final user = state.session?.user;
      if (user == null) return null;
      
      final authRepo = ref.read(authRepositoryProvider);
      return await authRepo.getUserProfile(user.id);
    },
    loading: () => null,
    error: (_, __) => null,
  );
});

/// Auth state notifier for login/logout actions
class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _authRepo;

  AuthNotifier(this._authRepo) : super(const AsyncValue.loading()) {
    _init();
  }

  Future<void> _init() async {
    final user = _authRepo.currentAuthUser;
    if (user != null) {
      await _loadProfile(user.id);
    } else {
      state = const AsyncValue.data(null);
    }
  }

  Future<void> _loadProfile(String userId) async {
    try {
      state = const AsyncValue.loading();
      final profile = await _authRepo.getUserProfile(userId);
      state = AsyncValue.data(profile);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Sign in with email and password
  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    try {
      state = const AsyncValue.loading();
      
      final response = await _authRepo.signInWithEmail(
        email: email,
        password: password,
      );

      if (response.user != null) {
        await _loadProfile(response.user!.id);
      } else {
        state = AsyncValue.error(
          'Login failed. Please check your credentials.',
          StackTrace.current,
        );
      }
    } on AuthException catch (e) {
      state = AsyncValue.error(e.message, StackTrace.current);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      await _authRepo.signOut();
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Get current profile
  UserModel? get currentProfile => state.value;

  /// Check if user has specific role
  bool hasRole(String role) => currentProfile?.role.value == role;
}

/// Auth notifier provider
final authNotifierProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  final authRepo = ref.watch(authRepositoryProvider);
  return AuthNotifier(authRepo);
});
