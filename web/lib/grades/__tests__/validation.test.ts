/**
 * Grade Validation Tests
 */

import { validateGrade, validatePayload } from "../validation";

describe("validateGrade", () => {
    it("accepts null and undefined as valid", () => {
        expect(validateGrade(null)).toEqual({ valid: true });
        expect(validateGrade(undefined)).toEqual({ valid: true });
    });

    it("accepts values in 0-10 range", () => {
        expect(validateGrade(0)).toEqual({ valid: true });
        expect(validateGrade(5)).toEqual({ valid: true });
        expect(validateGrade(10)).toEqual({ valid: true });
        expect(validateGrade(7.5)).toEqual({ valid: true });
    });

    it("rejects values outside 0-10 range", () => {
        expect(validateGrade(-1)).toEqual({
            valid: false,
            error: "Must be 0-10",
        });
        expect(validateGrade(11)).toEqual({
            valid: false,
            error: "Must be 0-10",
        });
        expect(validateGrade(100)).toEqual({
            valid: false,
            error: "Must be 0-10",
        });
    });

    it("rejects NaN", () => {
        expect(validateGrade(NaN)).toEqual({
            valid: false,
            error: "Must be a number",
        });
    });
});

describe("validatePayload", () => {
    const validPayload = {
        class_id: "cls1",
        subject_code: "MATH",
        semester: "HK1",
        students: [{ id: "s1" }],
    };

    it("accepts valid payload", () => {
        expect(validatePayload(validPayload)).toEqual({ valid: true });
    });

    it("rejects missing class_id", () => {
        const { class_id, ...rest } = validPayload;
        expect(validatePayload(rest)).toEqual({
            valid: false,
            error: "Missing class_id",
        });
    });

    it("rejects missing subject_code", () => {
        const { subject_code, ...rest } = validPayload;
        expect(validatePayload(rest)).toEqual({
            valid: false,
            error: "Missing subject_code",
        });
    });

    it("rejects missing semester", () => {
        const { semester, ...rest } = validPayload;
        expect(validatePayload(rest)).toEqual({
            valid: false,
            error: "Missing semester",
        });
    });

    it("rejects non-array students", () => {
        expect(validatePayload({ ...validPayload, students: "invalid" }))
            .toEqual({
                valid: false,
                error: "Invalid students list",
            });
    });
});
