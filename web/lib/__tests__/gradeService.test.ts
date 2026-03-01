/**
 * Grade Service Utility Tests
 * Tests for percentageToLetterGrade and getLetterGradeColor
 */

import { getLetterGradeColor, percentageToLetterGrade } from "../gradeService";

describe("percentageToLetterGrade", () => {
    it.each([
        [100, "A+"], // 100/10 = 10.0
        [95, "A+"], // 9.5
        [90, "A+"], // 9.0
        [85, "A"], // 8.5
        [80, "A-"], // 8.0
        [75, "B+"], // 7.5
        [70, "B"], // 7.0
        [65, "B-"], // 6.5
        [60, "C+"], // 6.0
        [55, "C"], // 5.5
        [50, "C-"], // 5.0
        [40, "D"], // 4.0
        [30, "F"], // 3.0
        [0, "F"], // 0.0
    ])('converts %d%% → "%s"', (pct, expected) => {
        expect(percentageToLetterGrade(pct)).toBe(expected);
    });
});

describe("getLetterGradeColor", () => {
    it("returns green for A grades", () => {
        expect(getLetterGradeColor("A+")).toContain("green");
        expect(getLetterGradeColor("A")).toContain("green");
        expect(getLetterGradeColor("A-")).toContain("green");
    });

    it("returns emerald for B grades", () => {
        expect(getLetterGradeColor("B+")).toContain("emerald");
        expect(getLetterGradeColor("B")).toContain("emerald");
    });

    it("returns amber for C grades", () => {
        expect(getLetterGradeColor("C+")).toContain("amber");
    });

    it("returns orange for D grades", () => {
        expect(getLetterGradeColor("D")).toContain("orange");
    });

    it("returns red for F", () => {
        expect(getLetterGradeColor("F")).toContain("red");
    });

    it("returns gray for empty/unknown grades", () => {
        expect(getLetterGradeColor("")).toContain("gray");
        expect(getLetterGradeColor("X")).toContain("gray");
    });

    it("handles lowercase input", () => {
        expect(getLetterGradeColor("a+")).toContain("green");
        expect(getLetterGradeColor("f")).toContain("red");
    });
});
