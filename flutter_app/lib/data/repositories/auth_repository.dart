/// Authentication Repository - handles Supabase auth operations
library;

import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/supabase_config.dart';
import '../models/user_model.dart';

class AuthRepository {
  AuthRepository();

  /// Get current auth user
  User? get currentAuthUser => supabase.auth.currentUser;

  /// Get current session
  Session? get currentSession => supabase.auth.currentSession;

  /// Check if user is authenticated
  bool get isAuthenticated => currentSession != null;

  /// Sign in with email and password
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return await supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  /// Sign out
  Future<void> signOut() async {
    await supabase.auth.signOut();
  }

  /// Get user profile from profiles table
  Future<UserModel?> getUserProfile(String userId) async {
    final response = await supabase
        .from('profiles')
        .select()
        .eq('user_id', userId)
        .maybeSingle();
    
    if (response == null) return null;
    return UserModel.fromJson(response);
  }

  /// Update user profile
  Future<UserModel?> updateProfile({
    required String profileId,
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) async {
    final updates = <String, dynamic>{
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (fullName != null) updates['full_name'] = fullName;
    if (phone != null) updates['phone'] = phone;
    if (avatarUrl != null) updates['avatar_url'] = avatarUrl;

    final response = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

    return UserModel.fromJson(response);
  }

  /// Reset password
  Future<void> resetPassword(String email) async {
    await supabase.auth.resetPasswordForEmail(email);
  }

  /// Listen to auth state changes
  Stream<AuthState> get authStateChanges => supabase.auth.onAuthStateChange;
}
