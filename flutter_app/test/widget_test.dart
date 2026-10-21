import 'package:bh_edu/app/app.dart';
import 'package:bh_edu/app/routes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('BHEduApp renders with its required providers', (tester) async {
    SharedPreferences.setMockInitialValues({});

    final router = GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const Scaffold(
            body: Center(child: Text('BH-EDU smoke test')),
          ),
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [routerProvider.overrideWithValue(router)],
        child: const BHEduApp(),
      ),
    );
    await tester.pump();

    expect(find.text('BH-EDU smoke test'), findsOneWidget);
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
