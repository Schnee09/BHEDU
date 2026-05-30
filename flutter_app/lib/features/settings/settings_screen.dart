/// Settings Screen - App settings and preferences
/// Cross-platform synchronized with web Control Center
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/theme.dart';
import '../../core/providers/customization_provider.dart';
import '../../core/services/biometric_service.dart';
import '../../core/services/cache_service.dart';
import '../../shared/widgets/glass_container.dart';

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
    final customization = ref.watch(customizationProvider);
    final language = ref.watch(languageProvider);
    final cacheStatus = ref.watch(cacheStatusProvider);
    final palette = customization.palette;

    return Scaffold(
      appBar: AppBar(title: const Text('Cài đặt')),
      body: ListView(
        children: [
          // Customization section (Pro Max Control Center)
          _SectionHeader(title: 'Tùy chỉnh giao diện'),

          // Accent Color Picker
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.palette, color: palette.primary),
                      const SizedBox(width: 12),
                      const Text(
                        'Màu chủ đạo',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: AccentColor.values.map((color) {
                      final isSelected = customization.accentColor == color;
                      final colorPalette = accentPalettes[color]!;
                      return GestureDetector(
                        onTap: () => ref
                            .read(customizationProvider.notifier)
                            .setAccentColor(color),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: colorPalette.primary,
                            shape: BoxShape.circle,
                            border: isSelected
                                ? Border.all(color: Colors.white, width: 3)
                                : null,
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: colorPalette.primary.withAlpha(
                                        102,
                                      ),
                                      blurRadius: 12,
                                      spreadRadius: 2,
                                    ),
                                  ]
                                : null,
                          ),
                          child: isSelected
                              ? const Icon(
                                  Icons.check,
                                  color: Colors.white,
                                  size: 24,
                                )
                              : null,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),

          // Glass Effects Controls
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.blur_on, color: palette.primary),
                      const SizedBox(width: 12),
                      const Text(
                        'Hiệu ứng kính',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Glass Opacity
                  Row(
                    children: [
                      const SizedBox(width: 80, child: Text('Độ trong')),
                      Expanded(
                        child: Slider(
                          value: customization.glassOpacity,
                          min: 0.3,
                          max: 1.0,
                          activeColor: palette.primary,
                          onChanged: (value) => ref
                              .read(customizationProvider.notifier)
                              .setGlassOpacity(value),
                        ),
                      ),
                      SizedBox(
                        width: 40,
                        child: Text(
                          '${(customization.glassOpacity * 100).round()}%',
                        ),
                      ),
                    ],
                  ),
                  // Blur Strength
                  Row(
                    children: [
                      const SizedBox(width: 80, child: Text('Độ mờ')),
                      Expanded(
                        child: Slider(
                          value: customization.blurStrength,
                          min: 8,
                          max: 32,
                          activeColor: palette.primary,
                          onChanged: (value) => ref
                              .read(customizationProvider.notifier)
                              .setBlurStrength(value),
                        ),
                      ),
                      SizedBox(
                        width: 40,
                        child: Text('${customization.blurStrength.round()}px'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // UI Density Toggle
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(Icons.view_compact, color: palette.primary),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Giao diện thu gọn',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                  Switch(
                    value: customization.density == UIDensity.compact,
                    activeThumbColor: palette.primary,
                    onChanged: (value) => ref
                        .read(customizationProvider.notifier)
                        .setDensity(value ? UIDensity.compact : UIDensity.cozy),
                  ),
                ],
              ),
            ),
          ),

          // Theme Mode Toggle
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    customization.themeMode == ThemeMode.dark
                        ? Icons.dark_mode
                        : Icons.light_mode,
                    color: palette.primary,
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text('Chế độ tối', style: TextStyle(fontSize: 16)),
                  ),
                  Switch(
                    value: customization.themeMode == ThemeMode.dark,
                    activeThumbColor: palette.primary,
                    onChanged: (value) => ref
                        .read(customizationProvider.notifier)
                        .setThemeMode(value ? ThemeMode.dark : ThemeMode.light),
                  ),
                ],
              ),
            ),
          ),

          // Language
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
            onTap: () => _showChangePasswordDialog(),
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
              if (context.mounted) {
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
            Consumer(
              builder: (context, ref, child) {
                final currentLang = ref.watch(languageProvider);
                return RadioGroup<String>(
                  groupValue: currentLang,
                  onChanged: (value) {
                    if (value != null) {
                      ref.read(languageProvider.notifier).state = value;
                      Navigator.pop(context);
                    }
                  },
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      RadioListTile<String>(
                        title: Text('Tiếng Việt'),
                        value: 'vi',
                      ),
                      RadioListTile<String>(
                        title: Text('English'),
                        value: 'en',
                      ),
                    ],
                  ),
                );
              },
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
        content: const Text(
          'Dữ liệu lưu trữ cục bộ sẽ bị xóa. Bạn sẽ cần kết nối internet để tải lại dữ liệu.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              await CacheService.clearAll();
              if (context.mounted) {
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

  Future<void> _showChangePasswordDialog() async {
    final messenger = ScaffoldMessenger.of(context);
    final controller = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đổi mật khẩu'),
        content: TextField(
          controller: controller,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: 'Mật khẩu mới',
            hintText: 'Nhập ít nhất 6 ký tự',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cập nhật'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final password = controller.text.trim();
    if (password.length < 6) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Mật khẩu phải có ít nhất 6 ký tự')),
      );
      return;
    }

    try {
      await Supabase.instance.client.auth.updateUser(
        UserAttributes(password: password),
      );
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Đã đổi mật khẩu thành công'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(content: Text('Lỗi: $e'), backgroundColor: AppColors.error),
      );
    }
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
