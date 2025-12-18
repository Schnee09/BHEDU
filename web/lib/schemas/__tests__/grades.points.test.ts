import { createGradeSchema, bulkGradeEntrySchema } from '../grades'

describe('grades schemas (points-based)', () => {
  test('createGradeSchema accepts decimal points_earned', () => {
    const parsed = createGradeSchema.parse({
      student_id: '11111111-1111-4111-8111-111111111111',
      assignment_id: '22222222-2222-4222-8222-222222222222',
      points_earned: 7.5,
      late: false,
      excused: false,
      missing: false,
    })

    expect(parsed.points_earned).toBe(7.5)
  })

  test('bulkGradeEntrySchema accepts decimal points_earned entries', () => {
    const parsed = bulkGradeEntrySchema.parse({
      assignment_id: '22222222-2222-4222-8222-222222222222',
      grades: [
        {
          student_id: '11111111-1111-4111-8111-111111111111',
          points_earned: 9.25,
          missing: false,
          excused: false,
        },
      ],
    })

    expect(parsed.grades[0]?.points_earned).toBe(9.25)
  })
})
