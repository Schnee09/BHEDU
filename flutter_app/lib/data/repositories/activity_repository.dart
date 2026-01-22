/// Activity Repository - handles audit log data from Supabase
library;

import '../../config/supabase_config.dart';
import '../models/activity_model.dart';

class ActivityRepository {
  ActivityRepository();

  /// Get recent activities from audit_log table
  Future<List<ActivityModel>> getRecentActivities({int limit = 10}) async {
    try {
      final response = await supabase
          .from('audit_log')
          .select()
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => ActivityModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      // If audit_log table doesn't exist or error, return empty list
      return [];
    }
  }

  /// Get activities for a specific resource
  Future<List<ActivityModel>> getActivitiesForResource(String resourceType, String resourceId) async {
    try {
      final response = await supabase
          .from('audit_log')
          .select()
          .eq('resource_type', resourceType)
          .eq('resource_id', resourceId)
          .order('created_at', ascending: false)
          .limit(20);

      return (response as List)
          .map((json) => ActivityModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }
}
