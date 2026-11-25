import 'package:go_router/go_router.dart';

import 'app_shell.dart';
import 'features/auth/login_page.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (context, state) => const AppShell()),
    GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
  ],
);