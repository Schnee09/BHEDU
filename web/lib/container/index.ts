/**
 * Container Module
 *
 * Dependency Injection Container for BH-EDU.
 * Provides centralized service management with type-safe tokens.
 *
 * @example
 * ```typescript
 * import { container, TOKENS } from '@/lib/container';
 *
 * // Get a service instance
 * const classService = container.get(TOKENS.ClassService);
 * ```
 */

export { container, ServiceContainer } from "./ServiceContainer";
export { type ServiceToken, type TokenRegistry, TOKENS } from "./tokens";

// Local imports for bootstrap
import { container } from "./ServiceContainer";
import { TOKENS } from "./tokens";

// Import singleton instances from services
import { classService } from "@/lib/services/classService";
import { studentService } from "@/lib/services/studentService";
import { courseService } from "@/lib/services/courseService";
import { tuitionService } from "@/lib/services/tuitionService";
import { enrollmentService, subjectService } from "@/lib/services";

/**
 * Bootstrap the container with default service registrations.
 * Registers singleton instances for all services.
 */
export function bootstrapContainer(): void {
    // Core Services - use pre-created singletons
    container.registerSingleton(TOKENS.ClassService, () => classService);
    container.registerSingleton(TOKENS.StudentService, () => studentService);
    container.registerSingleton(TOKENS.CourseService, () => courseService);
    container.registerSingleton(TOKENS.TuitionService, () => tuitionService);
    container.registerSingleton(
        TOKENS.EnrollmentService,
        () => enrollmentService,
    );
    container.registerSingleton(TOKENS.SubjectService, () => subjectService);
}

// Auto-initialization
let initialized = false;

export function ensureContainerInitialized(): void {
    if (!initialized) {
        bootstrapContainer();
        initialized = true;
    }
}

// Initialize on first import
ensureContainerInitialized();
