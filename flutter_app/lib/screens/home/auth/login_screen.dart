import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../services/auth_service.dart';
import 'register_screen.dart';
import 'widgets/auth_text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _auth = AuthService();

  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _connecter() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      await _auth.signIn(_emailCtrl.text, _passCtrl.text);
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } catch (e) {
      if (mounted) _snack(AuthService.messageErreur(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _motDePasseOublie() async {
    final email = _emailCtrl.text.trim();
    if (!email.contains('@')) {
      _snack("Entrez d'abord votre adresse e-mail.");
      return;
    }
    try {
      await _auth.resetPassword(email);
      if (mounted) _snack('Un e-mail de réinitialisation vous a été envoyé.');
    } catch (e) {
      if (mounted) _snack(AuthService.messageErreur(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  padding: EdgeInsets.zero,
                  alignment: Alignment.centerLeft,
                  icon: const Icon(Icons.arrow_back, size: 28),
                ),
                const SizedBox(height: 28),
                const Text(
                  'ImmoBi',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
                const SizedBox(height: 40),
                const Text(
                  'Bon retour !',
                  style: TextStyle(fontSize: 38, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Connectez-vous pour retrouver vos annonces favorites.',
                  style: TextStyle(fontSize: 18, height: 1.5, color: AppColors.muted),
                ),
                const SizedBox(height: 40),
                AuthTextField(
                  controller: _emailCtrl,
                  label: 'Adresse e-mail',
                  hint: 'exemple@email.com',
                  icon: Icons.mail_outline_rounded,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  validator: (v) {
                    final value = v?.trim() ?? '';
                    if (value.isEmpty) return "Entrez votre adresse e-mail";
                    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value)) {
                      return "Adresse e-mail invalide";
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 22),
                AuthTextField(
                  controller: _passCtrl,
                  label: 'Mot de passe',
                  hint: 'Votre mot de passe',
                  icon: Icons.lock_outline_rounded,
                  isPassword: true,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.password],
                  onSubmitted: (_) => _connecter(),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Entrez votre mot de passe' : null,
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _motDePasseOublie,
                    child: const Text(
                      'Mot de passe oublié ?',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 58,
                  child: FilledButton(
                    onPressed: _loading ? null : _connecter,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                          )
                        : const Text(
                            'Se connecter',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
                Center(
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const RegisterScreen()),
                    ),
                    child: const Text.rich(
                      TextSpan(
                        text: 'Pas encore de compte ? ',
                        style: TextStyle(color: AppColors.muted, fontSize: 15),
                        children: [
                          TextSpan(
                            text: 'Créer un compte',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}