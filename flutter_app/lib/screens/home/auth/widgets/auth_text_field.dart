import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class AuthTextField extends StatefulWidget {
  const AuthTextField({
    super.key,
    required this.controller,
    required this.hint,
    required this.icon,
    this.label,
    this.isPassword = false,
    this.keyboardType,
    this.textInputAction,
    this.validator,
    this.onSubmitted,
    this.autofillHints,
  });

  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final String? label;
  final bool isPassword;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofillHints;

  @override
  State<AuthTextField> createState() => _AuthTextFieldState();
}

class _AuthTextFieldState extends State<AuthTextField> {
  bool _masque = true;

  OutlineInputBorder _border(Color color, [double width = 0]) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: width == 0 ? BorderSide.none : BorderSide(color: color, width: width),
      );

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
        ],
        TextFormField(
          controller: widget.controller,
          obscureText: widget.isPassword && _masque,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          autofillHints: widget.autofillHints,
          onFieldSubmitted: widget.onSubmitted,
          validator: widget.validator,
          style: const TextStyle(fontSize: 16),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: const TextStyle(color: AppColors.muted, fontSize: 16),
            prefixIcon: Icon(widget.icon, color: AppColors.muted),
            suffixIcon: widget.isPassword
                ? IconButton(
                    onPressed: () => setState(() => _masque = !_masque),
                    icon: Icon(
                      _masque ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      color: AppColors.muted,
                    ),
                  )
                : null,
            filled: true,
            fillColor: AppColors.field,
            contentPadding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            border: _border(Colors.transparent),
            enabledBorder: _border(Colors.transparent),
            focusedBorder: _border(AppColors.primary, 1.5),
            errorBorder: _border(Colors.redAccent, 1),
            focusedErrorBorder: _border(Colors.redAccent, 1.5),
          ),
        ),
      ],
    );
  }
}