import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/finance_models.dart';
import 'dart:developer' as developer;

class FinanceRepository {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Get student account balance for current academic year
  Future<StudentAccountModel?> getStudentAccount(String studentId) async {
    try {
      final response = await _supabase
          .from('student_accounts')
          .select()
          .eq('student_id', studentId)
          .maybeSingle();

      if (response == null) return null;
      return StudentAccountModel.fromJson(response);
    } catch (e) {
      developer.log('Error fetching student account: $e', name: 'FinanceRepository');
      rethrow;
    }
  }

  /// Get invoices for a student
  Future<List<InvoiceModel>> getInvoices(String studentId) async {
    try {
      final response = await _supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('student_id', studentId)
          .order('due_date', ascending: false);

      return (response as List).map((json) => InvoiceModel.fromJson(json)).toList();
    } catch (e) {
      developer.log('Error fetching invoices: $e', name: 'FinanceRepository');
      rethrow;
    }
  }

  /// Get payment history for a student
  Future<List<PaymentModel>> getPayments(String studentId) async {
    try {
      final response = await _supabase
          .from('payments')
          .select('*, payment_methods(name)')
          .eq('student_id', studentId)
          .order('payment_date', ascending: false);

      return (response as List).map((json) => PaymentModel.fromJson(json)).toList();
    } catch (e) {
      developer.log('Error fetching payments: $e', name: 'FinanceRepository');
      rethrow;
    }
  }

  /// Get upcoming fees (pending or partial invoices)
  Future<List<InvoiceModel>> getUpcomingFees(String studentId) async {
    try {
      final response = await _supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('student_id', studentId)
          .inFilter('status', ['pending', 'partial', 'overdue'])
          .order('due_date', ascending: true);

      return (response as List).map((json) => InvoiceModel.fromJson(json)).toList();
    } catch (e) {
      developer.log('Error fetching upcoming fees: $e', name: 'FinanceRepository');
      rethrow;
    }
  }
}
