/// Auth Repository
/// Handles authentication and user profile loading
library;

import '../models/profile_model.dart';
import 'base_repository.dart';

class AuthRepository extends BaseRepository {
  AuthRepository();

  /// Login with email and password
  Future<AuthResponse> login(String email, String password) async {
    return handleAsyncErrors(() async {
      return await supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
    });
  }

  /// Logout
  Future<void> logout() async {
    return handleAsyncErrors(() async {
      await supabase.auth.signOut();
    });
  }

  /// Get current user profile
  Future<ProfileModel?> getCurrentProfile() async {
    return handleAsyncErrors(() async {
      final user = currentUser;
      if (user == null) return null;

      print('[AuthRepository] Fetching profile for user: ${user.id}');

      final response = await supabase
          .from('profiles')
          .select()
          .eq('user_id', user.id) // Or 'id' depending on if PK is uuid or user_id
          // Web schema usually links profiles.id to auth.users.id
          // or profiles.user_id to auth.users.id
          // Let's rely on standard Supabase pattern: profiles.id matches auth.uid
          .maybeSingle();

      if (response == null) {
        // Fallback: try querying by id directly if user_id column doesn't exist/work
        final responseById = await supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();
        
         if (responseById != null) {
            return ProfileModel.fromJson(responseById);
         }
         return null;
      }
      
      return ProfileModel.fromJson(response);
    });
  }
}
