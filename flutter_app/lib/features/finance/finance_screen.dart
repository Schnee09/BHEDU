/// Finance Screen - Tuition and Payment History
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/ui/ui_components.dart';
import 'package:intl/intl.dart';

class FinanceScreen extends ConsumerWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tài chính & Học phí'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Outstanding Balance Card
            _BalanceCard(),
            const SizedBox(height: 24),

            // Recent Transactions
            SectionHeader(title: 'Lịch sử giao dịch'),
            _TransactionList(),
            
            const SizedBox(height: 24),

            // Upcoming Fees
            SectionHeader(title: 'Khoản thu sắp tới'),
            _UpcomingFeesList(),
          ],
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GradientContainer(
      colors: const [AppColors.warning, Colors.orange],
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Text(
            'Số dư cần thanh toán',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            '2,500,000 ₫',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: Payment integration
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.warning,
                  ),
                  child: const Text('Thanh toán ngay'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TransactionList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: 3,
      itemBuilder: (context, index) {
        return AppCard(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.success.withAlpha(30),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: AppColors.success, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Học phí Tháng 12',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '15/12/2025',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Text(
                '-1,200,000 ₫',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ); // TODO: Add spacing between items
      },
    );
  }
}

class _UpcomingFeesList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.school, color: AppColors.primary),
            title: const Text('Học phí Học kỳ 2'),
            subtitle: const Text('Hạn: 15/02/2026'),
            trailing: const Text(
              '2,500,000 ₫',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.error),
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.book, color: AppColors.info),
            title: const Text('Phí tài liệu'),
            subtitle: const Text('Hạn: 01/02/2026'),
            trailing: const Text(
              '300,000 ₫',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
