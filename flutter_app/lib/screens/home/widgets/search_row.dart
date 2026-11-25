import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class SearchRow extends StatelessWidget {
  const SearchRow({
    super.key,
    required this.onChanged,
    required this.onMapTap,
    required this.onFilterTap,
  });

  final ValueChanged<String> onChanged;
  final VoidCallback onMapTap;
  final VoidCallback onFilterTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 52,
            child: TextField(
              onChanged: onChanged,
              style: const TextStyle(fontSize: 16),
              decoration: InputDecoration(
                hintText: 'Que recherchez-vous ?',
                hintStyle: const TextStyle(color: AppColors.muted, fontSize: 16),
                prefixIcon: const Icon(Icons.search, color: AppColors.muted),
                filled: true,
                fillColor: AppColors.field,
                contentPadding: EdgeInsets.zero,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        _SquareButton(
          icon: Icons.map_outlined,
          onTap: onMapTap,
          filled: false,
        ),
        const SizedBox(width: 10),
        _SquareButton(
          icon: Icons.tune_rounded,
          onTap: onFilterTap,
          filled: true,
        ),
      ],
    );
  }
}

class _SquareButton extends StatelessWidget {
  const _SquareButton({required this.icon, required this.onTap, required this.filled});

  final IconData icon;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: filled ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: filled ? null : Border.all(color: AppColors.primary, width: 2),
        ),
        child: Icon(icon, color: filled ? Colors.white : AppColors.primary, size: 26),
      ),
    );
  }
}