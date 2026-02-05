/**
 * Services Module Exports
 */

export {
  type Class as ClassType,
  ClassService,
  classService,
  type ClassWithDetails,
} from "./classService";

export { EnrollmentService, enrollmentService } from "./enrollmentService";
export type { Enrollment } from "./enrollmentService";

export { SubjectService, subjectService } from "./subjectService";
export type {
  CreateSubjectInput,
  Subject,
  SubjectListOptions,
  UpdateSubjectInput,
} from "./subjectService";

export { StudentService, studentService } from "./studentService";
export type { Student, StudentWithEnrollments } from "./studentService";

export { TeacherService, teacherService } from "./teacherService";
export type { TeacherProfile } from "./teacherService";

export { UserService, userService } from "./userService";
export type { UserProfile } from "./userService";

export { CourseService, courseService } from "./courseService";
export type { Course } from "./courseService";

export { TuitionService, tuitionService } from "./tuitionService";
export type { ClassTuitionInfo, TuitionRate } from "./tuitionService";

export { LinkService, linkService } from "./linkService";
export type { ParentStudentLink } from "./linkService";

// export { AttendanceService, attendanceService } from "./attendanceService";
export { SettingsService, settingsService } from "./settingsService";
export type { AcademicYear } from "./settingsService";

export { GradeService, gradeService } from "./gradeService";
export type { GradeEntry, SaveGradesInput } from "./gradeService";
