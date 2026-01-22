/// Supabase configuration for BH-EDU Flutter app
library;

import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase credentials
const String _supabaseUrl = 'https://mwncwhkdimnjovxzhtjm.supabase.co';
const String _supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bmN3aGtkaW1uam92eHpodGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Mzg1MzAsImV4cCI6MjA3NjAxNDUzMH0.ICXEl60X70V8T7vwieDGXskvH5LPxkL29jPwC77TBAM';

/// Initialize Supabase client
Future<void> initSupabase() async {
  await Supabase.initialize(
    url: _supabaseUrl,
    anonKey: _supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );
}

/// Get Supabase client instance
SupabaseClient get supabase => Supabase.instance.client;

/// For admin queries - use the same client (RLS will be fixed via policies)
SupabaseClient get adminSupabase => supabase;

/// Get current auth user
User? get currentUser => supabase.auth.currentUser;

/// Get current session
Session? get currentSession => supabase.auth.currentSession;

/// Check if user is authenticated
bool get isAuthenticated => currentSession != null;


