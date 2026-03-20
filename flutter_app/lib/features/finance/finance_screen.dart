import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../core/ui/ui_components.dart';
import '../../data/models/finance_models.dart';
import '../../data/repositories/finance_repository.dart';
import '../../shared/providers/auth_provider.dart';

final financeRepoProvider = Provider((ref) => FinanceRepository());

final studentAccountProvider = FutureProvider.autoDispose<StudentAccountModel?>((ref) async {
  final user = ref.watch(authNotifierProvider).value;
  if (user == null) return null;
  return ref.watch(financeRepoProvider).getStudentAccount(user.id);
});

final studentInvoicesProvider = FutureProvider.autoDispose<List<InvoiceModel>>((ref) async {
  final user = ref.watch(authNotifierProvider).value;
  if (user == null) return [];
  return ref.watch(financeRepoProvider).getInvoices(user.id);
});

final studentPaymentsProvider = FutureProvider.autoDispose<List<PaymentModel>>((ref) async {
  final user = ref.watch(authNotifierProvider).value;
  if (user == null) return [];
  return ref.watch(financeRepoProvider).getPayments(user.id);
});

class FinanceScreen extends ConsumerWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accountAsync = ref.watch(studentAccountProvider);
    final paymentsAsync = ref.watch(studentPaymentsProvider);

    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tài chính & Học phí'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(studentAccountProvider);
              ref.invalidate(studentPaymentsProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(studentAccountProvider);
          ref.invalidate(studentPaymentsProvider);
          await ref.read(studentAccountProvider.future);
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Outstanding Balance Card
              accountAsync.when(
                data: (account) => _BalanceCard(
                  balance: account?.balance ?? 0,
                  currencyFormat: currencyFormat,
                ),
                loading: () => const _LoadingCard(height: 180),
                error: (e, _) => Center(child: Text('Lỗi tải số dư: $e')),
              ),
              const SizedBox(height: 24),

              // Recent Transactions
              const SectionHeader(title: 'Lịch sử giao dịch'),
              paymentsAsync.when(
                data: (payments) => payments.isEmpty
                    ? const _EmptyFinanceState(message: 'Không có giao dịch nào')
                    : _TransactionList(payments: payments, currencyFormat: currencyFormat),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Lỗi tải giao dịch: $e')),
              ),

              const SizedBox(height: 24),

              // Future Improvements placeholder or summary
              const AppCard(
                padding: EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: AppColors.info),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Dữ liệu thanh toán được cập nhật sau khi bộ phận kế toán xác minh.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final double balance;
  final NumberFormat currencyFormat;

  const _BalanceCard({required this.balance, required this.currencyFormat});

  @override
  Widget build(BuildContext context) {
    return GradientContainer(
      colors: balance > 0
          ? const [AppColors.warning, Colors.orange]
          : const [AppColors.success, Colors.teal],
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text(
            balance > 0 ? 'Số dư cần thanh toán' : 'Số dư hiện tại',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            currencyFormat.format(balance),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          if (balance > 0)
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Tính năng thanh toán trực tuyến đang được phát triển')),
                      );
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
  final List<PaymentModel> payments;
  final NumberFormat currencyFormat;

  const _TransactionList({required this.payments, required this.currencyFormat});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: payments.length,
      itemBuilder: (context, index) {
        final payment = payments[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: AppCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _getStatusColor(payment.status).withAlpha(30),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _getStatusIcon(payment.status),
                    color: _getStatusColor(payment.status),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        payment.paymentMethodName ?? 'Thanh toán học phí',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        DateFormat('dd/MM/yyyy').format(payment.paymentDate),
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '-${currencyFormat.format(payment.amount)}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Color _getStatusColor(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.verified:
        return AppColors.success;
      case PaymentStatus.received:
        return AppColors.info;
      case PaymentStatus.pending:
        return AppColors.warning;
      case PaymentStatus.cancelled:
        return AppColors.error;
    }
  }

  IconData _getStatusIcon(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.verified:
        return Icons.verified;
      case PaymentStatus.received:
        return Icons.check_circle;
      case PaymentStatus.pending:
        return Icons.hourglass_empty;
      case PaymentStatus.cancelled:
        return Icons.cancel;
    }
  }
}

class _LoadingCard extends StatelessWidget {
  final double height;
  const _LoadingCard({required this.height});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(child: CircularProgressIndicator()),
    );
  }
}

class _EmptyFinanceState extends StatelessWidget {
  final String message;
  const _EmptyFinanceState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            const Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(message, style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
