/**
 * Ability Service - Instance-based Permission Checker
 * Aligned with BH-EDU v5.0 Architecture (Instance-based Services)
 */

import { AbilityRule, Action, PermissionContext, Subject } from "./types";
import { defineAbilitiesFor } from "./abilities";

/**
 * Ability class for checking permissions
 * Follows instance-based service pattern
 */
export class AbilityService {
    private rules: AbilityRule[];
    private context: PermissionContext;

    constructor(context: PermissionContext) {
        this.context = context;
        this.rules = defineAbilitiesFor(context);
    }

    /**
     * Check if user can perform action on subject
     *
     * @example
     * ability.can('update', grade)
     * ability.can('delete', 'Grade')
     */
    can(action: Action, subject: Subject | object, field?: string): boolean {
        // Find matching rules
        const matchingRules = this.rules.filter((rule) => {
            // Check action
            const actions = Array.isArray(rule.action)
                ? rule.action
                : [rule.action];
            if (!actions.includes(action) && !actions.includes("manage")) {
                return false;
            }

            // Check subject
            const subjects = Array.isArray(rule.subject)
                ? rule.subject
                : [rule.subject];
            const subjectType = typeof subject === "string"
                ? subject
                : (subject as any).constructor?.name || "Unknown";

            if (
                !subjects.includes(subjectType as Subject) &&
                !subjects.includes("all")
            ) {
                return false;
            }

            // Check field restrictions
            if (rule.fields && field && !rule.fields.includes(field)) {
                return false;
            }

            // Check conditions (if subject is an object)
            if (rule.conditions && typeof subject === "object") {
                return this.matchesConditions(subject, rule.conditions);
            }

            return true;
        });

        // Check if any rule allows (and none explicitly denies)
        const allowed = matchingRules.some((r) => !r.inverted);
        const denied = matchingRules.some((r) => r.inverted);

        return allowed && !denied;
    }

    /**
     * Inverse of can()
     */
    cannot(action: Action, subject: Subject | object, field?: string): boolean {
        return !this.can(action, subject, field);
    }

    /**
     * Get reason why action is not allowed
     */
    reasonFor(action: Action, subject: Subject | object): string | null {
        const denyingRule = this.rules.find((rule) => {
            const actions = Array.isArray(rule.action)
                ? rule.action
                : [rule.action];
            const subjects = Array.isArray(rule.subject)
                ? rule.subject
                : [rule.subject];
            const subjectType = typeof subject === "string"
                ? subject
                : (subject as any).constructor?.name || "Unknown";

            return rule.inverted &&
                actions.includes(action) &&
                subjects.includes(subjectType as Subject);
        });

        if (denyingRule?.reason) {
            return denyingRule.reason;
        }

        // Check if there's a matching allow rule with a reason
        const allowRule = this.rules.find((rule) => {
            const actions = Array.isArray(rule.action)
                ? rule.action
                : [rule.action];
            const subjects = Array.isArray(rule.subject)
                ? rule.subject
                : [rule.subject];
            const subjectType = typeof subject === "string"
                ? subject
                : (subject as any).constructor?.name || "Unknown";

            return !rule.inverted &&
                actions.includes(action) &&
                subjects.includes(subjectType as Subject) &&
                rule.reason;
        });

        if (allowRule && !this.can(action, subject)) {
            return `You do not meet the conditions: ${allowRule.reason}`;
        }

        return "You do not have permission to perform this action";
    }

    /**
     * Filter array based on permissions
     *
     * @example
     * const editableGrades = ability.filter('update', allGrades);
     */
    filter<T extends object>(action: Action, subjects: T[]): T[] {
        return subjects.filter((subject) => this.can(action, subject));
    }

    /**
     * Get all rules for debugging
     */
    getRules(): AbilityRule[] {
        return [...this.rules];
    }

    /**
     * Get user context
     */
    getContext(): PermissionContext {
        return { ...this.context };
    }

    /**
     * Check if conditions match the subject
     * Supports nested conditions and operators
     */
    private matchesConditions(
        subject: object,
        conditions: Record<string, any>,
    ): boolean {
        return Object.entries(conditions).every(([key, value]) => {
            const subjectValue = this.getNestedValue(subject, key);

            // Handle operators
            if (
                typeof value === "object" && value !== null &&
                !Array.isArray(value)
            ) {
                // Check for condition operators
                if ("$in" in value) {
                    return Array.isArray(value.$in) &&
                        value.$in.includes(subjectValue);
                }
                if ("$nin" in value) {
                    return Array.isArray(value.$nin) &&
                        !value.$nin.includes(subjectValue);
                }
                if ("$ne" in value) {
                    return subjectValue !== value.$ne;
                }
                if ("$eq" in value) {
                    return subjectValue === value.$eq;
                }
                if ("$gt" in value) {
                    return typeof subjectValue === "number" &&
                        subjectValue > value.$gt;
                }
                if ("$gte" in value) {
                    return typeof subjectValue === "number" &&
                        subjectValue >= value.$gte;
                }
                if ("$lt" in value) {
                    return typeof subjectValue === "number" &&
                        subjectValue < value.$lt;
                }
                if ("$lte" in value) {
                    return typeof subjectValue === "number" &&
                        subjectValue <= value.$lte;
                }

                // Nested object conditions
                if (subjectValue && typeof subjectValue === "object") {
                    return this.matchesConditions(subjectValue, value);
                }
            }

            // Direct equality
            return subjectValue === value;
        });
    }

    /**
     * Get nested value from object using dot notation
     * e.g., 'student.parent_links.parent_id'
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split(".").reduce((current, key) => {
            if (current === null || current === undefined) {
                return undefined;
            }
            return current[key];
        }, obj);
    }
}

/**
 * Create ability instance for a user
 * Factory function following architecture pattern
 */
export function createAbility(context: PermissionContext): AbilityService {
    return new AbilityService(context);
}

/**
 * Type guard to check if subject is an object
 */
export function isSubjectObject(subject: Subject | object): subject is object {
    return typeof subject === "object";
}
