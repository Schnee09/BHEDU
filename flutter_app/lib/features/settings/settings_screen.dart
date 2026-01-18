/// Settings Screen - App settings and preferences
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/services/biometric_service.dart';
import '../../core/services/cache_service.dart';

/// Dark mode provider
final darkModeProvider = StateProvider<bool>((ref) => false);

/// Language provider
final languageProvider = StateProvider<String>((ref) => 'vi');

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;
  String _biometricName = 'Sinh trắc học';

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final service = ref.read(biometricServiceProvider);
    final available = await service.isBiometricAvailable();
    final enabled = await service.isBiometricLoginEnabled();
    final types = await service.getAvailableBiometrics();

    if (mounted) {
      setState(() {
        _biometricAvailable = available;
        _biometricEnabled = enabled;
        _biometricName = service.getBiometricName(types);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = ref.watch(darkModeProvider);
    final language = ref.watch(languageProvider);
    final cacheStatus = ref.watch(cacheStatusProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cài đặt'),
      ),
      body: ListView(
        children: [
          // Appearance section
          _SectionHeader(title: 'Giao diện'),
          _SettingsTile(
            icon: Icons.dark_mode,
            title: 'Chế độ tối',
            subtitle: isDarkMode ? 'Bật' : 'Tắt',
            trailing: Switch(
              value: isDarkMode,
              onChanged: (value) {
                ref.read(darkModeProvider.notifier).state = value;
                // TODO: Apply theme change
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Tính năng đang phát triển')),
                );
              },
            ),
          ),
          _SettingsTile(
            icon: Icons.language,
            title: 'Ngôn ngữ',
            subtitle: language == 'vi' ? 'Tiếng Việt' : 'English',
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showLanguageDialog(),
          ),

          // Security section
          _SectionHeader(title: 'Bảo mật'),
          if (_biometricAvailable)
            _SettingsTile(
              icon: Icons.fingerprint,
              title: 'Đăng nhập bằng $_biometricName',
              subtitle: _biometricEnabled ? 'Đã bật' : 'Đã tắt',
              trailing: Switch(
                value: _biometricEnabled,
                onChanged: (value) async {
                  final service = ref.read(biometricServiceProvider);
                  
                  if (value) {
                    // Authenticate first before enabling
                    final authenticated = await service.authenticate(
                      reason: 'Xác thực để bật đăng nhập sinh trắc học',
                    );
                    if (authenticated) {
                      await service.setBiometricLoginEnabled(true);
                      setState(() => _biometricEnabled = true);
                    }
                  } else {
                    await service.setBiometricLoginEnabled(false);
                    setState(() => _biometricEnabled = false);
                  }
                },
              ),
            ),
          _SettingsTile(
            icon: Icons.lock_outline,
            title: 'Đổi mật khẩu',
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // TODO: Navigate to change password
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Tính năng đang phát triển')),
              );
            },
          ),

          // Data section
          _SectionHeader(title: 'Dữ liệu'),
          _SettingsTile(
            icon: Icons.sync,
            title: 'Đồng bộ dữ liệu',
            subtitle: 'Lần cuối: ${cacheStatus.lastSyncText}',
            trailing: const Icon(Icons.chevron_right),
            onTap: () async {
              await CacheService.updateLastSync();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã đồng bộ dữ liệu')),
                );
              }
            },
          ),
          _SettingsTile(
            icon: Icons.delete_outline,
            title: 'Xóa bộ nhớ đệm',
            subtitle: 'Xóa dữ liệu lưu trữ cục bộ',
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showClearCacheDialog(),
          ),

          // About section
          _SectionHeader(title: 'Thông tin'),
          _SettingsTile(
            icon: Icons.info_outline,
            title: 'Phiên bản',
            subtitle: '1.0.0',
          ),
          _SettingsTile(
            icon: Icons.description_outlined,
            title: 'Điều khoản sử dụng',
            trailing: const Icon(Icons.chevron_right),
          ),
          _SettingsTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Chính sách bảo mật',
            trailing: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chọn ngôn ngữ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Tiếng Việt'),
              leading: Radio<String>(
                value: 'vi',
                groupValue: ref.read(languageProvider),
                onChanged: (value) {
                  ref.read(languageProvider.notifier).state = value!;
                  Navigator.pop(context);
                },
              ),
            ),
            ListTile(
              title: const Text('English'),
              leading: Radio<String>(
                value: 'en',
                groupValue: ref.read(languageProvider),
                onChanged: (value) {
                  ref.read(languageProvider.notifier).state = value!;
                  Navigator.pop(context);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa bộ nhớ đệm?'),
        content: const Text('Dữ liệu lưu trữ cục bộ sẽ bị xóa. Bạn sẽ cần kết nối internet để tải lại dữ liệu.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              await CacheService.clearAll();
              if (mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã xóa bộ nhớ đệm')),
                );
              }
            },
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: AppColors.textMuted,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: trailing,
      onTap: onTap,
    );
  }
}
