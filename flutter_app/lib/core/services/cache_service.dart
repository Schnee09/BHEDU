/// Offline Cache Service - Local data caching with SharedPreferences
library;

import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Cache keys
class CacheKeys {
  static const userProfile = 'cache_user_profile';
  static const students = 'cache_students';
  static const classes = 'cache_classes';
  static const attendance = 'cache_attendance';
  static const grades = 'cache_grades';
  static const timetable = 'cache_timetable';
  static const lastSync = 'cache_last_sync';
}

/// Cache service for offline support
class CacheService {
  static SharedPreferences? _prefs;

  /// Initialize shared preferences
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// Get SharedPreferences instance
  static SharedPreferences get prefs {
    if (_prefs == null) {
      throw Exception('CacheService not initialized. Call CacheService.init() first.');
    }
    return _prefs!;
  }

  /// Save JSON data to cache
  static Future<bool> saveJson(String key, Map<String, dynamic> data) async {
    return prefs.setString(key, jsonEncode(data));
  }

  /// Save list to cache
  static Future<bool> saveList(String key, List<Map<String, dynamic>> data) async {
    return prefs.setString(key, jsonEncode(data));
  }

  /// Get JSON data from cache
  static Map<String, dynamic>? getJson(String key) {
    final data = prefs.getString(key);
    if (data == null) return null;
    return jsonDecode(data) as Map<String, dynamic>;
  }

  /// Get list from cache
  static List<Map<String, dynamic>>? getList(String key) {
    final data = prefs.getString(key);
    if (data == null) return null;
    final list = jsonDecode(data) as List;
    return list.map((e) => e as Map<String, dynamic>).toList();
  }

  /// Clear specific cache
  static Future<bool> clear(String key) async {
    return prefs.remove(key);
  }

  /// Clear all cache
  static Future<bool> clearAll() async {
    return prefs.clear();
  }

  /// Get last sync time
  static DateTime? getLastSync() {
    final timestamp = prefs.getInt(CacheKeys.lastSync);
    if (timestamp == null) return null;
    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }

  /// Update last sync time
  static Future<bool> updateLastSync() async {
    return prefs.setInt(CacheKeys.lastSync, DateTime.now().millisecondsSinceEpoch);
  }

  /// Check if cache is valid (within 1 hour)
  static bool isCacheValid() {
    final lastSync = getLastSync();
    if (lastSync == null) return false;
    return DateTime.now().difference(lastSync).inHours < 1;
  }
}

/// Network connectivity state
enum ConnectivityState { online, offline }

/// Connectivity provider (simplified - in production use connectivity_plus)
final connectivityProvider = StateProvider<ConnectivityState>((ref) {
  return ConnectivityState.online; // Default to online
});

/// Cache status provider
final cacheStatusProvider = Provider<CacheStatus>((ref) {
  final lastSync = CacheService.getLastSync();
  final isValid = CacheService.isCacheValid();
  
  return CacheStatus(
    lastSync: lastSync,
    isValid: isValid,
  );
});

class CacheStatus {
  final DateTime? lastSync;
  final bool isValid;

  CacheStatus({this.lastSync, required this.isValid});

  String get lastSyncText {
    if (lastSync == null) return 'Chưa đồng bộ';
    final diff = DateTime.now().difference(lastSync!);
    if (diff.inMinutes < 1) return 'Vừa đồng bộ';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    return '${diff.inDays} ngày trước';
  }
}
