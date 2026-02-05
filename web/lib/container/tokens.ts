/**
 * Service Tokens
 *
 * Type-safe dependency injection tokens for all services.
 * Tokens are simple string-based identifiers with phantom types.
 */

// Service Token Type (phantom type pattern)
export interface ServiceToken<T> {
    readonly _type?: T; // Phantom type for type inference
    readonly name: string;
}

// Token factory
function createToken<T>(name: string): ServiceToken<T> {
    return { name } as ServiceToken<T>;
}

/**
 * Service Tokens Registry
 *
 * Usage:
 * ```typescript
 * const classService = container.get(TOKENS.ClassService);
 * ```
 */
export const TOKENS = {
    // Core Services (typed as 'any' for now, will be refined when services become instance-based)
    ClassService: createToken<any>("ClassService"),
    StudentService: createToken<any>("StudentService"),
    EnrollmentService: createToken<any>("EnrollmentService"),
    SubjectService: createToken<any>("SubjectService"),
    CourseService: createToken<any>("CourseService"),
    TuitionService: createToken<any>("TuitionService"),

    // Infrastructure
    SupabaseClient: createToken<any>("SupabaseClient"),
    Logger: createToken<any>("Logger"),
    Cache: createToken<any>("Cache"),
} as const;

export type TokenRegistry = typeof TOKENS;
