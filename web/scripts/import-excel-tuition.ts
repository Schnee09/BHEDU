/**
 * Excel Tuition Importer
 *
 * Reads docs/Tổng_Hợp_HP.xlsx and imports teachers, classes, students,
 * enrollments, invoices, and payment history into Supabase.
 *
 * Run with: npx tsx scripts/import-excel-tuition.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase URL or Service Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper: Excel date serial to string (YYYY-MM-DD)
function excelSerialToDate(serial: any): string {
  if (typeof serial !== "number") {
    // If it's already a date-like string
    if (typeof serial === "string" && serial.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return serial;
    }
    return new Date().toISOString().split("T")[0] || "";
  }
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split("T")[0] || "";
}

// Convert username string to slug (e.g. "Thầy_Quý" -> "thay_quy")
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9_]/g, "")
    .trim();
}

async function main() {
  console.log("🚀 Starting Excel Tuition Import...\n");

  const filePath = path.resolve(__dirname, "../../docs/Tổng_Hợp_HP.xlsx");
  const workbook = XLSX.readFile(filePath);

  // 1. Get current academic year
  console.log("📅 Fetching current academic year...");
  const { data: academicYear, error: ayError } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("is_current", true)
    .maybeSingle();

  if (ayError || !academicYear) {
    console.error("❌ No current academic year configured. Run seeding first.");
    process.exit(1);
  }
  console.log(`   Academic Year: ${academicYear.name} (ID: ${academicYear.id})`);

  // Get cash payment method
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("type", "cash")
    .eq("is_active", true)
    .limit(1);

  const cashMethodId = paymentMethods?.[0]?.id;
  if (!cashMethodId) {
    console.error("❌ Cash payment method is not configured. Run migrations/seed first.");
    process.exit(1);
  }

  // 2. Load CẤU HÌNH sheet
  const configSheet = workbook.Sheets["CẤU HÌNH"];
  if (!configSheet) {
    console.error("❌ Sheet 'CẤU HÌNH' not found in Excel workbook.");
    process.exit(1);
  }

  const configData: any[] = XLSX.utils.sheet_to_json(configSheet, { header: 1 });
  
  // Maps teacher names to their profiles
  const teacherMap = new Map<string, string>(); // name -> id

  // Map to hold classes mapped to monthly fees
  const classFeeMap = new Map<string, number>(); // className -> amount

  console.log("\n👤 Syncing Teachers...");
  for (let i = 1; i < configData.length; i++) {
    const row = configData[i];
    if (!row || !row[0]) continue;

    const teacherName = row[0].toString().trim();
    const slug = toSlug(teacherName);
    const email = `${slug}@bhedu.vn`;
    const password = `${slug}123`;

    console.log(`   Processing: ${teacherName} (${email})`);

    // Find or create auth user
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let teacherId = existingUser?.id;

    if (!teacherId) {
      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: teacherName.replace(/_/g, " "), role: "teacher" },
      });

      if (authErr) {
        console.error(`   ❌ Auth Error for ${teacherName}: ${authErr.message}`);
        continue;
      }

      teacherId = authData.user?.id;

      if (teacherId) {
        // Create profile
        const { error: profileErr } = await supabase.from("profiles").insert({
          id: teacherId,
          email,
          full_name: teacherName.replace(/_/g, " "),
          role: "teacher",
          status: "active",
          is_active: true,
        });

        if (profileErr) {
          console.error(`   ❌ Profile Insert Error for ${teacherName}: ${profileErr.message}`);
          continue;
        }

        // Create teacher profile
        await supabase.from("teacher_profiles").insert({
          profile_id: teacherId,
          teacher_type: "full_time",
          department: "Học vụ",
        });
      }
    }

    if (teacherId) {
      teacherMap.set(teacherName, teacherId);
      console.log(`   ✅ Synced teacher ID: ${teacherId}`);
    }
  }

  // 3. Process teacher sheets & sub-tables (Classes & Students)
  for (const sheetName of workbook.SheetNames) {
    if (["Trang tính1", "CẤU HÌNH", "NHẬT KÝ_HỆ THỐNG", "BIẾN ĐỘNG DỮ LIỆU"].includes(sheetName)) {
      continue;
    }

    const teacherId = teacherMap.get(sheetName);
    if (!teacherId) {
      console.warn(`   ⚠️ Skipping sheet ${sheetName}: no teacher profile found.`);
      continue;
    }

    console.log(`\n📚 Processing sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(`   ⚠️ Sheet ${sheetName} not found, skipping.`);
      continue;
    }
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let currentClassId: string | null = null;
    let currentClassName = "";
    let currentMonthlyFee = 1200000; // Default 1.2M VND
    let monthColumns: Array<{ index: number; dateStr: string }> = [];

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;

      // Detect Class Title Row (e.g. [ '9T2 (1400k)', 'TÊN LỚP: 9T2 (1200K)' ])
      const cell1 = row[1]?.toString().trim() || "";
      if (cell1.startsWith("TÊN LỚP:")) {
        currentClassName = cell1.replace("TÊN LỚP:", "").trim();
        
        // Extract fee from class name (e.g. 1200K -> 1.2M, or class name short code)
        const match = currentClassName.match(/(\d+)\s*k/i) || row[0]?.toString().match(/(\d+)\s*k/i);
        if (match && match[1]) {
          currentMonthlyFee = parseInt(match[1], 10) * 1000;
        } else {
          currentMonthlyFee = 1200000;
        }

        console.log(`   Class detected: ${currentClassName} (Fee: ${currentMonthlyFee.toLocaleString()} VND)`);

        // Find or create class
        const { data: existingClass } = await supabase
          .from("classes")
          .select("id")
          .eq("name", currentClassName)
          .maybeSingle();

        if (existingClass) {
          currentClassId = existingClass.id;
          console.log(`     Using existing class: ${currentClassName} (${currentClassId})`);
        } else {
          const { data: newClass, error: classErr } = await supabase
            .from("classes")
            .insert({
              name: currentClassName,
              teacher_id: teacherId,
              class_type: "group",
              max_capacity: 40,
              sessions_per_week: 3,
              academic_year_id: academicYear.id,
            })
            .select()
            .single();

          if (classErr) {
            console.error(`     ❌ Failed to create class ${currentClassName}: ${classErr.message}`);
            currentClassId = null;
          } else {
            currentClassId = newClass.id;
            console.log(`     ✅ Created class: ${currentClassName} (${currentClassId})`);
          }
        }
        continue;
      }

      // Detect Header Row (e.g. [ 'STT', 'HỌ VÀ TÊN', 'ĐỊA CHỈ', 'SĐT PH', 'MÃ ĐỊNH DANH', 'NHẬP HỌC', 'KẾT THÚC', 46174, 46204, 46235 ])
      if (row[0]?.toString().trim() === "STT" && row[1]?.toString().trim() === "HỌ VÀ TÊN") {
        monthColumns = [];
        for (let c = 7; c < row.length; c++) {
          const val = row[c];
          if (typeof val === "number" || (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}$/))) {
            const dateStr = excelSerialToDate(val);
            monthColumns.push({ index: c, dateStr });
          }
        }
        console.log(`     Billing months detected:`, monthColumns.map((m) => m.dateStr));
        continue;
      }

      // Process Student Row (e.g. index 0 is a number, index 1 is name)
      const stt = parseInt(row[0]?.toString().trim(), 10);
      const studentName = row[1]?.toString().trim();

      if (!isNaN(stt) && studentName && currentClassId) {
        const address = row[2]?.toString().trim() || null;
        const phone = row[3]?.toString().trim() || null;
        const studentCode = row[4]?.toString().trim() || null;
        const enrollDate = row[5] ? excelSerialToDate(row[5]) : new Date().toISOString().split("T")[0];
        const endDate = row[6] ? excelSerialToDate(row[6]) : null;

        // Try to find existing student profile (de-duplicate)
        let studentProfileId: string | null = null;

        if (studentCode) {
          const { data: existingByCode } = await supabase
            .from("profiles")
            .select("id")
            .eq("student_code", studentCode)
            .maybeSingle();
          studentProfileId = existingByCode?.id || null;
        }

        if (!studentProfileId) {
          // Try to match by full_name and phone
          const { data: existingByNamePhone } = await supabase
            .from("profiles")
            .select("id")
            .eq("full_name", studentName)
            .eq("phone", phone)
            .maybeSingle();
          studentProfileId = existingByNamePhone?.id || null;
        }

        if (!studentProfileId) {
          // Create student auth user
          const generatedCode = studentCode || `HS${Date.now()}${Math.floor(Math.random() * 100)}`;
          const email = `${generatedCode}@bhedu.vn`;
          const password = `student123`;

          const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: studentName, role: "student" },
          });

          if (authErr) {
            console.error(`     ❌ Auth Error for student ${studentName}: ${authErr.message}`);
            continue;
          }

          studentProfileId = authData.user?.id || null;

          if (studentProfileId) {
            // Create profile
            await supabase.from("profiles").insert({
              id: studentProfileId,
              email,
              full_name: studentName,
              role: "student",
              phone,
              address,
              student_code: generatedCode,
              status: "active",
              is_active: true,
            });

            // Create student profile
            await supabase.from("student_profiles").insert({
              profile_id: studentProfileId,
              student_code: generatedCode,
              grade_level: "Lớp học",
              enrollment_date: enrollDate,
            });
          }
        }

        if (studentProfileId) {
          // Sync enrollment
          const { data: enrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("student_id", studentProfileId)
            .eq("class_id", currentClassId)
            .maybeSingle();

          if (!enrollment) {
            await supabase.from("enrollments").insert({
              student_id: studentProfileId,
              class_id: currentClassId,
              enrollment_date: enrollDate,
              status: "active",
            });
          }

          // Get or create student account totals
          const { data: existingAccount } = await supabase
            .from("student_accounts")
            .select("id")
            .eq("student_id", studentProfileId)
            .eq("academic_year_id", academicYear.id)
            .maybeSingle();

          let accountId = existingAccount?.id;
          if (!accountId) {
            const { data: newAccount } = await supabase
              .from("student_accounts")
              .insert({
                student_id: studentProfileId,
                academic_year_id: academicYear.id,
                balance: 0,
                total_fees: 0,
                total_paid: 0,
                status: "active",
              })
              .select("id")
              .single();
            accountId = newAccount?.id;
          }

          // Process billing columns for this student
          for (const monthCol of monthColumns) {
            const val = row[monthCol.index];
            const isPaid = val === true || val === "true" || val === 1;

            // Generate/retrieve invoice
            const { data: existingInvoice } = await supabase
              .from("invoices")
              .select("id, status")
              .eq("student_id", studentProfileId)
              .eq("academic_year_id", academicYear.id)
              .eq("issue_date", monthCol.dateStr)
              .maybeSingle();

            let invoiceId = existingInvoice?.id;

            if (!invoiceId) {
              // Create invoice
              const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
              const dueDate = new Date(new Date(monthCol.dateStr).getTime() + 15 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]; // Due 15 days later

              const { data: newInvoice } = await supabase
                .from("invoices")
                .insert({
                  invoice_number: invoiceNumber,
                  student_id: studentProfileId,
                  student_account_id: accountId,
                  academic_year_id: academicYear.id,
                  issue_date: monthCol.dateStr,
                  due_date: dueDate,
                  total_amount: currentMonthlyFee,
                  paid_amount: 0,
                  status: "pending",
                })
                .select("id")
                .single();

              invoiceId = newInvoice?.id;

              if (invoiceId) {
                // Insert item line
                const descMonth = new Date(monthCol.dateStr).getMonth() + 1;
                const descYear = new Date(monthCol.dateStr).getFullYear();
                await supabase.from("invoice_items").insert({
                  invoice_id: invoiceId,
                  description: `Học phí Lớp ${currentClassName} - Tháng ${descMonth}/${descYear}`,
                  quantity: 1,
                  unit_price: currentMonthlyFee,
                  total_price: currentMonthlyFee,
                });

                // Update account total fees
                const { data: accountData } = await supabase
                  .from("student_accounts")
                  .select("total_fees, balance")
                  .eq("id", accountId)
                  .single();

                if (accountData) {
                  await supabase
                    .from("student_accounts")
                    .update({
                      total_fees: Number(accountData.total_fees) + currentMonthlyFee,
                      balance: Number(accountData.balance) + currentMonthlyFee,
                    })
                    .eq("id", accountId);
                }
              }
            }

            // Record payment if checked in Excel
            if (invoiceId && isPaid && existingInvoice?.status !== "paid") {
              // Record payment
              const { data: payment } = await supabase
                .from("payments")
                .insert({
                  student_id: studentProfileId,
                  invoice_id: invoiceId,
                  payment_method_id: cashMethodId,
                  amount: currentMonthlyFee,
                  payment_date: monthCol.dateStr,
                  notes: "Thanh toán học phí import từ Excel gốc",
                  status: "completed",
                })
                .select("id")
                .single();

              if (payment) {
                // Record allocation
                await supabase.from("payment_allocations").insert({
                  payment_id: payment.id,
                  invoice_id: invoiceId,
                  amount: currentMonthlyFee,
                });

                // Update invoice
                await supabase
                  .from("invoices")
                  .update({
                    paid_amount: currentMonthlyFee,
                    status: "paid",
                  })
                  .eq("id", invoiceId);

                // Update student account
                const { data: accountData } = await supabase
                  .from("student_accounts")
                  .select("total_paid, balance")
                  .eq("id", accountId)
                  .single();

                if (accountData) {
                  await supabase
                    .from("student_accounts")
                    .update({
                      total_paid: Number(accountData.total_paid) + currentMonthlyFee,
                      balance: Math.max(0, Number(accountData.balance) - currentMonthlyFee),
                    })
                    .eq("id", accountId);
                }
              }
            }
          }
        }
      }
    }
  }

  console.log("\n🎉 Excel Tuition Import Completed Successfully!");
}

main().catch((err) => {
  console.error("❌ Fatal Error in import script:", err);
  process.exit(1);
});
