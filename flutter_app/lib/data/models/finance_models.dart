
/// Student Account Model
class StudentAccountModel {
  final String id;
  final String studentId;
  final String academicYearId;
  final double balance;
  final double totalFees;
  final double totalPaid;
  final String status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  StudentAccountModel({
    required this.id,
    required this.studentId,
    required this.academicYearId,
    required this.balance,
    required this.totalFees,
    required this.totalPaid,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory StudentAccountModel.fromJson(Map<String, dynamic> json) {
    return StudentAccountModel(
      id: json['id'],
      studentId: json['student_id'],
      academicYearId: json['academic_year_id'],
      balance: (json['balance'] ?? 0).toDouble(),
      totalFees: (json['total_fees'] ?? 0).toDouble(),
      totalPaid: (json['total_paid'] ?? 0).toDouble(),
      status: json['status'] ?? 'active',
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}

/// Invoice Status Enum
enum InvoiceStatus {
  draft('draft', 'Nháp'),
  pending('pending', 'Chờ thanh toán'),
  partial('partial', 'Thanh toán một phần'),
  paid('paid', 'Đã thanh toán'),
  overdue('overdue', 'Quá hạn'),
  cancelled('cancelled', 'Đã hủy');

  const InvoiceStatus(this.value, this.labelVi);
  final String value;
  final String labelVi;

  static InvoiceStatus fromString(String status) {
    return InvoiceStatus.values.firstWhere(
      (s) => s.value == status.toLowerCase(),
      orElse: () => InvoiceStatus.pending,
    );
  }
}

/// Invoice Model
class InvoiceModel {
  final String id;
  final String invoiceNumber;
  final String studentId;
  final String? studentAccountId;
  final String academicYearId;
  final DateTime issueDate;
  final DateTime dueDate;
  final double totalAmount;
  final double paidAmount;
  final InvoiceStatus status;
  final String? notes;
  final List<InvoiceItemModel>? items;

  InvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.studentId,
    this.studentAccountId,
    required this.academicYearId,
    required this.issueDate,
    required this.dueDate,
    required this.totalAmount,
    required this.paidAmount,
    required this.status,
    this.notes,
    this.items,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      id: json['id'],
      invoiceNumber: json['invoice_number'],
      studentId: json['student_id'],
      studentAccountId: json['student_account_id'],
      academicYearId: json['academic_year_id'],
      issueDate: DateTime.parse(json['issue_date']),
      dueDate: DateTime.parse(json['due_date']),
      totalAmount: (json['total_amount'] ?? 0).toDouble(),
      paidAmount: (json['paid_amount'] ?? 0).toDouble(),
      status: InvoiceStatus.fromString(json['status']),
      notes: json['notes'],
      items: json['invoice_items'] != null
          ? (json['invoice_items'] as List)
              .map((i) => InvoiceItemModel.fromJson(i))
              .toList()
          : null,
    );
  }
}

/// Invoice Item Model
class InvoiceItemModel {
  final String id;
  final String invoiceId;
  final String? feeTypeId;
  final String description;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  InvoiceItemModel({
    required this.id,
    required this.invoiceId,
    this.feeTypeId,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory InvoiceItemModel.fromJson(Map<String, dynamic> json) {
    return InvoiceItemModel(
      id: json['id'],
      invoiceId: json['invoice_id'],
      feeTypeId: json['fee_type_id'],
      description: json['description'],
      quantity: json['quantity'] ?? 1,
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      totalPrice: (json['total_price'] ?? 0).toDouble(),
    );
  }
}

/// Payment Status Enum
enum PaymentStatus {
  pending('pending', 'Đang xử lý'),
  received('received', 'Đã nhận'),
  verified('verified', 'Đã xác minh'),
  cancelled('cancelled', 'Đã hủy');

  const PaymentStatus(this.value, this.labelVi);
  final String value;
  final String labelVi;

  static PaymentStatus fromString(String status) {
    return PaymentStatus.values.firstWhere(
      (s) => s.value == status.toLowerCase(),
      orElse: () => PaymentStatus.received,
    );
  }
}

/// Payment Model
class PaymentModel {
  final String id;
  final String studentId;
  final String? invoiceId;
  final String? paymentMethodId;
  final double amount;
  final String? referenceNumber;
  final DateTime paymentDate;
  final String? receivedBy;
  final String? notes;
  final PaymentStatus status;
  final String? paymentMethodName; // Joined from payment_methods

  PaymentModel({
    required this.id,
    required this.studentId,
    this.invoiceId,
    this.paymentMethodId,
    required this.amount,
    this.referenceNumber,
    required this.paymentDate,
    this.receivedBy,
    this.notes,
    required this.status,
    this.paymentMethodName,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'],
      studentId: json['student_id'],
      invoiceId: json['invoice_id'],
      paymentMethodId: json['payment_method_id'],
      amount: (json['amount'] ?? 0).toDouble(),
      referenceNumber: json['reference_number'],
      paymentDate: DateTime.parse(json['payment_date']),
      receivedBy: json['received_by'],
      notes: json['notes'],
      status: PaymentStatus.fromString(json['status']),
      paymentMethodName: json['payment_methods'] != null ? json['payment_methods']['name'] : null,
    );
  }
}
