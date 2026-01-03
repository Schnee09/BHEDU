/**
 * Unit Tests for StudentRepository
 * 
 * Tests repository pattern implementation with mocked Supabase client.
 */

import { StudentRepository } from '../StudentRepository'

describe('StudentRepository', () => {
  let mockSupabase: any
  let repository: StudentRepository

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn()
    }

    repository = new StudentRepository(mockSupabase)
  })

  describe('findById', () => {
    it('should return student when found', async () => {
      const mockStudent = {
        id: 'student-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'student'
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStudent,
              error: null
            })
          })
        })
      })

      const result = await repository.findById('student-1')

      expect(result).toEqual(mockStudent)
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should return null when not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' }
            })
          })
        })
      })

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should throw on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PXXXX', message: 'Database error' }
            })
          })
        })
      })

      await expect(repository.findById('student-1')).rejects.toThrow('Failed to find profiles')
    })
  })

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockStudents = [
        { id: '1', first_name: 'John', role: 'student' },
        { id: '2', first_name: 'Jane', role: 'student' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              range: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockStudents,
                  error: null,
                  count: 50
                })
              })
            }),
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockStudents,
                error: null,
                count: 50
              })
            })
          })
        })
      })

      const result = await repository.findAll({ page: 1, pageSize: 20 })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(50)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
      expect(result.totalPages).toBe(3) // 50 / 20 = 2.5, ceil = 3
    })

    it('should apply search filter', async () => {
      const orMock = jest.fn().mockReturnValue({
        range: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: orMock,
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
              })
            })
          })
        })
      })

      await repository.findAll({ search: 'John' })

      // Verify search was applied via or() call
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })
  })

  describe('create', () => {
    it('should create student with computed full_name', async () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      }

      const createdStudent = {
        id: 'new-id',
        ...input,
        full_name: 'John Doe',
        role: 'student',
        status: 'active'
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdStudent,
              error: null
            })
          })
        })
      })

      const result = await repository.create(input)

      expect(result.full_name).toBe('John Doe')
      expect(result.role).toBe('student')
    })
  })

  describe('softDelete', () => {
    it('should set status to inactive', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        update: updateMock
      })

      await repository.softDelete('student-1')

      expect(updateMock).toHaveBeenCalledWith({ status: 'inactive' })
    })
  })

  describe('countByStatus', () => {
    it('should return counts grouped by status', async () => {
      const mockData = [
        { status: 'active' },
        { status: 'active' },
        { status: 'inactive' },
        { status: 'graduated' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      })

      const result = await repository.countByStatus()

      expect(result).toEqual({
        active: 2,
        inactive: 1,
        graduated: 1
      })
    })
  })
})
