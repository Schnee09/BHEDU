/**
 * Permission System Exports
 * Aligned with BH-EDU v5.0 Architecture
 */

export * from "./types";
export * from "./abilities";
export * from "./ability";

// Re-export commonly used functions
export { AbilityService, createAbility } from "./ability";
export { defineAbilitiesFor, getRoleDescription } from "./abilities";
export type { AbilityRule, Action, PermissionContext, Subject } from "./types";
