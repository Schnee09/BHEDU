import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const optionalDate = z
  .string()
  .trim()
  .refine((value) => !value || isValidIsoDate(value), {
    message: 'Ngày không hợp lệ hoặc không đúng định dạng YYYY-MM-DD',
  })
  .optional()
  .transform((value) => value || undefined);

function optionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z
    .union([z.enum(values), z.literal('')])
    .optional()
    .transform((value) => value || undefined);
}

export const studentImportRowSchema = z.object({
  firstName: z.string().trim().min(1, 'Tên không được để trống').max(100),
  lastName: z.string().trim().min(1, 'Họ và tên đệm không được để trống').max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Email không hợp lệ',
    })
    .max(254)
    .optional()
    .transform((value) => value || undefined),
  phone: optionalText(20),
  address: optionalText(500),
  dateOfBirth: optionalDate,
  gender: optionalEnum(['male', 'female', 'other', 'prefer_not_to_say']),
  studentId: optionalText(50),
  enrollmentDate: optionalDate,
  gradeLevel: optionalText(50),
  status: optionalEnum(['active', 'inactive', 'graduated', 'transferred', 'suspended']),
  guardianName: optionalText(200),
  guardianRelationship: optionalEnum([
    'father',
    'mother',
    'guardian',
    'grandparent',
    'sibling',
    'other',
  ]),
  guardianPhone: optionalText(20),
  guardianEmail: z
    .string()
    .trim()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Email phụ huynh không hợp lệ',
    })
    .max(254)
    .optional()
    .transform((value) => value || undefined),
  guardianAddress: optionalText(500),
  isPrimaryContact: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
});

export const studentImportRequestSchema = z
  .object({
    students: z
      .array(studentImportRowSchema)
      .min(1, 'Danh sách học sinh không được để trống')
      .max(1000, 'Mỗi lần chỉ được nhập tối đa 1.000 học sinh'),
  })
  .strict()
  .superRefine(({ students }, context) => {
    const emails = new Set<string>();
    const studentIds = new Set<string>();

    students.forEach((student, index) => {
      if (student.email) {
        if (emails.has(student.email)) {
          context.addIssue({
            code: 'custom',
            path: ['students', index, 'email'],
            message: 'Email bị trùng trong danh sách nhập',
          });
        }
        emails.add(student.email);
      }

      if (student.studentId) {
        if (studentIds.has(student.studentId)) {
          context.addIssue({
            code: 'custom',
            path: ['students', index, 'studentId'],
            message: 'Mã học sinh bị trùng trong danh sách nhập',
          });
        }
        studentIds.add(student.studentId);
      }
    });
  });

export type ValidatedStudentImportRow = z.infer<typeof studentImportRowSchema>;
