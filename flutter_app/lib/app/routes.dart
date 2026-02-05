/// App Router with GoRouter
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../core/constants/app_constants.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/forgot_password_screen.dart';
// import '../features/finance/finance_screen.dart'; // Unused
// import '../features/search/search_screen.dart'; // Unused
import '../features/attendance/attendance_screen.dart';
import '../features/attendance/attendance_marking_screen.dart';
import '../features/attendance/qr_scanner_screen.dart';
import '../features/calendar/calendar_screen.dart';
import '../features/classes/classes_screen.dart';
import '../features/classes/class_detail_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/grades/grades_screen.dart';
import '../features/grades/grade_entry_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/reports/reports_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/students/students_screen.dart';
import '../features/students/student_detail_screen.dart';
import '../features/timetable/timetable_screen.dart';
import '../shared/providers/auth_provider.dart';

final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// Router provider
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: '/login',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authState.value != null;
      final isLoggingIn = state.matchedLocation == '/login';

      // If not logged in, redirect to login
      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      // If logged in but on login page, redirect to dashboard
      if (isLoggedIn && isLoggingIn) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),

      // Dashboard shell with bottom navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => DashboardShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/attendance',
            name: 'attendance',
            builder: (context, state) => const AttendanceScreen(),
          ),
          GoRoute(
            path: '/grades',
            name: 'grades',
            builder: (context, state) => const GradesScreen(),
          ),
          GoRoute(
            path: '/students',
            name: 'students',
            builder: (context, state) => const StudentsScreen(),
            routes: [
              GoRoute(
                path: ':id',
                name: 'student-detail',
                builder: (context, state) =>
                    StudentDetailScreen(studentId: state.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(
            path: '/classes',
            name: 'classes',
            builder: (context, state) => const ClassesScreen(),
            routes: [
              GoRoute(
                path: ':id',
                name: 'class-detail',
                builder: (context, state) =>
                    ClassDetailScreen(classId: state.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(
            path: '/timetable',
            name: 'timetable',
            builder: (context, state) => const TimetableScreen(),
          ),
          GoRoute(
            path: '/qr-scanner',
            name: 'qr-scanner',
            builder: (context, state) =>
                QRScannerScreen(classId: state.uri.queryParameters['classId']),
          ),
          GoRoute(
            path: '/attendance-marking',
            name: 'attendance-marking',
            builder: (context, state) => AttendanceMarkingScreen(
              classId: state.uri.queryParameters['classId'] ?? '',
              className: state.uri.queryParameters['className'] ?? 'Class',
            ),
          ),
          GoRoute(
            path: '/grade-entry',
            name: 'grade-entry',
            builder: (context, state) => GradeEntryScreen(
              classId: state.uri.queryParameters['classId'] ?? '',
              className: state.uri.queryParameters['className'] ?? 'Class',
              subjectId: state.uri.queryParameters['subjectId'],
            ),
          ),
          GoRoute(
            path: '/notifications',
            name: 'notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/calendar',
            name: 'calendar',
            builder: (context, state) => const CalendarScreen(),
          ),
          GoRoute(
            path: '/reports',
            name: 'reports',
            builder: (context, state) => const ReportsScreen(),
          ),
          GoRoute(
            path: '/settings',
            name: 'settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              'Page Not Found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.uri.toString(),
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/dashboard'),
              child: const Text('Go to Dashboard'),
            ),
          ],
        ),
      ),
    ),
  );
});

/// Dashboard shell with bottom navigation
class DashboardShell extends ConsumerWidget {
  final Widget child;

  const DashboardShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authNotifierProvider).value;
    final currentIndex = _calculateSelectedIndex(context);

    // Get navigation items based on role
    final navItems = _getNavItems(profile?.role ?? UserRole.student);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          final item = navItems[index];
          context.goNamed(item.route);
        },
        destinations: navItems
            .map(
              (item) => NavigationDestination(
                icon: Icon(item.icon),
                selectedIcon: Icon(item.selectedIcon),
                label: item.label,
              ),
            )
            .toList(),
      ),
    );
  }

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/dashboard')) {
      return 0;
    }
    if (location.startsWith('/attendance')) {
      return 1;
    }
    if (location.startsWith('/grades')) {
      return 2;
    }
    if (location.startsWith('/timetable')) {
      return 3;
    }
    if (location.startsWith('/students') || location.startsWith('/classes')) {
      return 4;
    }
    if (location.startsWith('/profile')) {
      return 5;
    }
    return 0;
  }

  List<_NavItem> _getNavItems(UserRole role) {
    // Common items for all roles
    final items = <_NavItem>[
      _NavItem(
        icon: Icons.dashboard_outlined,
        selectedIcon: Icons.dashboard,
        label: 'Home',
        route: 'dashboard',
      ),
      _NavItem(
        icon: Icons.calendar_today_outlined,
        selectedIcon: Icons.calendar_today,
        label: 'Attendance',
        route: 'attendance',
      ),
      _NavItem(
        icon: Icons.grade_outlined,
        selectedIcon: Icons.grade,
        label: 'Grades',
        route: 'grades',
      ),
      _NavItem(
        icon: Icons.schedule_outlined,
        selectedIcon: Icons.schedule,
        label: 'Timetable',
        route: 'timetable',
      ),
    ];

    // Admin/Staff see Students, Teacher sees Classes
    if (role == UserRole.admin || role == UserRole.staff) {
      items.add(
        _NavItem(
          icon: Icons.people_outlined,
          selectedIcon: Icons.people,
          label: 'Students',
          route: 'students',
        ),
      );
    } else if (role == UserRole.teacher) {
      items.add(
        _NavItem(
          icon: Icons.class_outlined,
          selectedIcon: Icons.class_,
          label: 'Classes',
          route: 'classes',
        ),
      );
    }

    // Profile for all
    items.add(
      _NavItem(
        icon: Icons.person_outlined,
        selectedIcon: Icons.person,
        label: 'Profile',
        route: 'profile',
      ),
    );

    return items;
  }
}

class _NavItem {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final String route;

  _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.route,
  });
}

// _PlaceholderScreen removed
