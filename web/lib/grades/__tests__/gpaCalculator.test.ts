/**
 * GPA Calculator Tests
 *
 * Tests for the Vietnamese education grading system:
 * - Subject average calculation with coefficients
 * - Semester GPA calculation
 * - Cumulative GPA calculation
 * - Academic standing classification
 * - 4-point scale conversion
 * - Letter grades
 * - Progress tracking
 * - Required grade calculation
 */

import {
    ACADEMIC_STANDINGS,
    calculateCumulativeGPA,
    calculateRequiredGrade,
    calculateSemesterGPA,
    calculateSubjectAverage,
    convertTo4PointScale,
    formatGPA,
    getAcademicStanding,
    getLetterGradeFromScore,
    getProgressToNextStanding,
    GRADE_COEFFICIENTS,
    SemesterGPA,
    SubjectGrade,
} from "../gpaCalculator";

// ============================================================================
// calculateSubjectAverage
// ============================================================================

describe("calculateSubjectAverage", () => {
    it("returns null when no scores are provided", () => {
        const grade: SubjectGrade = {
            subjectId: "s1",
            subjectName: "Toán",
            credits: 3,
        };
        expect(calculateSubjectAverage(grade)).toBeNull();
    });

    it("calculates average with only oral score (coefficient 1)", () => {
        const grade: SubjectGrade = {
            subjectId: "s1",
            subjectName: "Toán",
            credits: 3,
            oralScore: 8.0,
        };
        expect(calculateSubjectAverage(grade)).toBe(8.0);
    });

    it("correctly applies coefficients to all score types", () => {
        const grade: SubjectGrade = {
            subjectId: "s1",
            subjectName: "Toán",
            credits: 3,
            oralScore: 7.0, // coefficient 1 → 7
            fifteenMinScore: 8.0, // coefficient 1 → 8
            fortyFiveMinScore: 6.0, // coefficient 2 → 12
            midtermScore: 7.0, // coefficient 2 → 14
            finalScore: 9.0, // coefficient 3 → 27
        };

        // Total weight: 1+1+2+2+3 = 9
        // Weighted sum: 7+8+12+14+27 = 68
        // Average: 68/9 ≈ 7.56
        expect(calculateSubjectAverage(grade)).toBe(7.56);
    });

    it("handles partial scores (missing some components)", () => {
        const grade: SubjectGrade = {
            subjectId: "s1",
            subjectName: "Toán",
            credits: 3,
            oralScore: 8.0, // coefficient 1
            finalScore: 10.0, // coefficient 3
        };

        // Total weight: 1+3 = 4
        // Weighted sum: 8+30 = 38
        // Average: 38/4 = 9.5
        expect(calculateSubjectAverage(grade)).toBe(9.5);
    });

    it("handles perfect scores (all 10)", () => {
        const grade: SubjectGrade = {
            subjectId: "s1",
            subjectName: "Toán",
            credits: 3,
            oralScore: 10,
            fifteenMinScore: 10,
            fortyFiveMinScore: 10,
            midtermScore: 10,
            finalScore: 10,
        };
        expect(calculateSubjectAverage(grade)).toBe(10);
    });

    it("handles zero scores", () => {
        const grade: SubjectGrade = {
            subjectId: "s1",
            subjectName: "Toán",
            credits: 3,
            oralScore: 0,
            finalScore: 0,
        };
        expect(calculateSubjectAverage(grade)).toBe(0);
    });

    it("ignores null and undefined score values", () => {
        const grade: SubjectGrade = {
            subjectId: "s1",
            subjectName: "Toán",
            credits: 3,
            oralScore: 8.0,
            fifteenMinScore: undefined,
            fortyFiveMinScore: undefined,
            midtermScore: undefined,
            finalScore: undefined,
        };
        expect(calculateSubjectAverage(grade)).toBe(8.0);
    });
});

// ============================================================================
// calculateSemesterGPA
// ============================================================================

describe("calculateSemesterGPA", () => {
    it("returns zero GPA for empty grades array", () => {
        const result = calculateSemesterGPA([], "sem1", "HK1", "2025-2026");
        expect(result.gpa).toBe(0);
        expect(result.totalCredits).toBe(0);
        expect(result.subjectCount).toBe(0);
        expect(result.standing.code).toBe("failing");
    });

    it("calculates GPA weighted by credits", () => {
        const grades: SubjectGrade[] = [
            {
                subjectId: "s1",
                subjectName: "Toán",
                credits: 3,
                finalScore: 9.0,
            },
            {
                subjectId: "s2",
                subjectName: "Văn",
                credits: 2,
                finalScore: 7.0,
            },
        ];

        const result = calculateSemesterGPA(grades, "sem1", "HK1", "2025-2026");

        // Toán: 9.0 * 3 = 27
        // Văn: 7.0 * 2 = 14
        // Total: 41 / 5 = 8.2
        expect(result.gpa).toBe(8.2);
        expect(result.totalCredits).toBe(5);
        expect(result.subjectCount).toBe(2);
        expect(result.standing.code).toBe("good"); // >= 8.0
    });

    it("excludes subjects with no valid scores", () => {
        const grades: SubjectGrade[] = [
            {
                subjectId: "s1",
                subjectName: "Toán",
                credits: 3,
                finalScore: 8.0,
            },
            { subjectId: "s2", subjectName: "Văn", credits: 2 }, // no scores
        ];

        const result = calculateSemesterGPA(grades, "sem1", "HK1", "2025-2026");
        expect(result.subjectCount).toBe(1);
        expect(result.totalCredits).toBe(3);
    });
});

// ============================================================================
// calculateCumulativeGPA
// ============================================================================

describe("calculateCumulativeGPA", () => {
    it("returns zero for empty semesters", () => {
        const result = calculateCumulativeGPA([]);
        expect(result.gpa).toBe(0);
        expect(result.trend).toBe("stable");
    });

    it("calculates weighted average across semesters", () => {
        const semesters: SemesterGPA[] = [
            {
                semesterId: "s1",
                semesterName: "HK1",
                academicYear: "2025-2026",
                gpa: 8.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(8.0),
            },
            {
                semesterId: "s2",
                semesterName: "HK2",
                academicYear: "2025-2026",
                gpa: 9.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(9.0),
            },
        ];

        const result = calculateCumulativeGPA(semesters);
        // (8.0*15 + 9.0*15) / 30 = 8.5
        expect(result.gpa).toBe(8.5);
        expect(result.totalCredits).toBe(30);
    });

    it("detects improving trend", () => {
        const semesters: SemesterGPA[] = [
            {
                semesterId: "s1",
                semesterName: "HK1",
                academicYear: "24-25",
                gpa: 6.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(6.0),
            },
            {
                semesterId: "s2",
                semesterName: "HK2",
                academicYear: "24-25",
                gpa: 7.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(7.0),
            },
            {
                semesterId: "s3",
                semesterName: "HK1",
                academicYear: "25-26",
                gpa: 8.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(8.0),
            },
        ];

        const result = calculateCumulativeGPA(semesters);
        expect(result.trend).toBe("improving"); // +2.0 > 0.3
    });

    it("detects declining trend", () => {
        const semesters: SemesterGPA[] = [
            {
                semesterId: "s1",
                semesterName: "HK1",
                academicYear: "24-25",
                gpa: 9.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(9.0),
            },
            {
                semesterId: "s2",
                semesterName: "HK2",
                academicYear: "24-25",
                gpa: 8.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(8.0),
            },
            {
                semesterId: "s3",
                semesterName: "HK1",
                academicYear: "25-26",
                gpa: 7.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(7.0),
            },
        ];

        const result = calculateCumulativeGPA(semesters);
        expect(result.trend).toBe("declining"); // -2.0 < -0.3
    });

    it("detects stable trend for small changes", () => {
        const semesters: SemesterGPA[] = [
            {
                semesterId: "s1",
                semesterName: "HK1",
                academicYear: "24-25",
                gpa: 8.0,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(8.0),
            },
            {
                semesterId: "s2",
                semesterName: "HK2",
                academicYear: "24-25",
                gpa: 8.1,
                totalCredits: 15,
                subjectCount: 5,
                standing: getAcademicStanding(8.1),
            },
        ];

        const result = calculateCumulativeGPA(semesters);
        expect(result.trend).toBe("stable"); // +0.1 within ±0.3
    });
});

// ============================================================================
// getAcademicStanding
// ============================================================================

describe("getAcademicStanding", () => {
    it.each([
        [10.0, "excellent"],
        [9.0, "excellent"],
        [8.5, "good"],
        [8.0, "good"],
        [7.0, "fair"],
        [6.5, "fair"],
        [5.5, "average"],
        [5.0, "average"],
        [4.0, "weak"],
        [3.5, "weak"],
        [2.0, "failing"],
        [0, "failing"],
    ])('classifies GPA %s as "%s"', (gpa, expectedCode) => {
        expect(getAcademicStanding(gpa).code).toBe(expectedCode);
    });

    it("returns Vietnamese labels", () => {
        expect(getAcademicStanding(9.5).labelVi).toBe("Xuất sắc");
        expect(getAcademicStanding(5.0).labelVi).toBe("Trung bình");
        expect(getAcademicStanding(2.0).labelVi).toBe("Kém");
    });
});

// ============================================================================
// convertTo4PointScale
// ============================================================================

describe("convertTo4PointScale", () => {
    it.each([
        [10.0, 4.0],
        [9.0, 4.0],
        [8.5, 3.7],
        [8.0, 3.5],
        [7.0, 3.0],
        [6.5, 2.5],
        [5.5, 2.0],
        [5.0, 1.5],
        [4.0, 1.0],
        [3.0, 0.0],
        [0.0, 0.0],
    ])("converts Vietnamese %s → 4.0 scale %s", (vn, us) => {
        expect(convertTo4PointScale(vn)).toBe(us);
    });
});

// ============================================================================
// getLetterGradeFromScore
// ============================================================================

describe("getLetterGradeFromScore", () => {
    it.each([
        [10.0, "A+"],
        [9.0, "A+"],
        [8.5, "A"],
        [8.0, "A-"],
        [7.0, "B+"],
        [6.5, "B"],
        [5.5, "B-"],
        [5.0, "C+"],
        [4.5, "C"],
        [4.0, "C-"],
        [3.0, "D"],
        [2.0, "F"],
        [0, "F"],
    ])('maps score %s → "%s"', (score, letter) => {
        expect(getLetterGradeFromScore(score)).toBe(letter);
    });
});

// ============================================================================
// getProgressToNextStanding
// ============================================================================

describe("getProgressToNextStanding", () => {
    it("returns null nextStanding when already at highest", () => {
        const result = getProgressToNextStanding(9.5);
        expect(result.nextStanding).toBeNull();
        expect(result.progressPercent).toBe(100);
    });

    it("calculates points needed to reach next standing", () => {
        const result = getProgressToNextStanding(7.5); // currently "fair" (6.5-8.0)
        expect(result.nextStanding?.code).toBe("good");
        expect(result.pointsNeeded).toBe(0.5);
    });

    it("shows 0% progress at standing boundary", () => {
        const result = getProgressToNextStanding(5.0); // exactly at "average" boundary
        expect(result.progressPercent).toBe(0);
        expect(result.nextStanding?.code).toBe("fair");
    });
});

// ============================================================================
// calculateRequiredGrade
// ============================================================================

describe("calculateRequiredGrade", () => {
    it("calculates the score needed to reach target GPA", () => {
        // Current: 7.0 average with weight 6, target 8.0, remaining weight 3
        // 8.0 * 9 = 72 needed total, 7.0 * 6 = 42 already, need 30 / 3 = 10
        const result = calculateRequiredGrade(7.0, 6, 8.0, 3);
        expect(result).toBe(10);
    });

    it("returns null if remaining weight is 0", () => {
        expect(calculateRequiredGrade(7.0, 6, 8.0, 0)).toBeNull();
    });

    it("returns null if target is impossible (> 10)", () => {
        // Would need > 10.0 to reach target
        const result = calculateRequiredGrade(2.0, 6, 9.0, 3);
        expect(result).toBeNull();
    });

    it("returns 0 if target is already exceeded", () => {
        // needed = (4.0*9 - 9.0*6) / 3 = (36-54)/3 = -6 → clamped to 0
        const result = calculateRequiredGrade(9.0, 6, 4.0, 3);
        expect(result).toBe(0);
    });
});

// ============================================================================
// formatGPA
// ============================================================================

describe("formatGPA", () => {
    it("formats to 2 decimal places by default", () => {
        expect(formatGPA(8.123)).toBe("8.12");
    });

    it("formats to custom decimal places", () => {
        expect(formatGPA(8.1, 1)).toBe("8.1");
        expect(formatGPA(8.123, 0)).toBe("8");
    });
});

// ============================================================================
// Constants verification
// ============================================================================

describe("GRADE_COEFFICIENTS", () => {
    it("has correct Vietnamese system coefficients", () => {
        expect(GRADE_COEFFICIENTS.oral).toBe(1);
        expect(GRADE_COEFFICIENTS.fifteenMin).toBe(1);
        expect(GRADE_COEFFICIENTS.fortyFiveMin).toBe(2);
        expect(GRADE_COEFFICIENTS.midterm).toBe(2);
        expect(GRADE_COEFFICIENTS.final).toBe(3);
    });
});

describe("ACADEMIC_STANDINGS", () => {
    it("is sorted by minGpa descending", () => {
        for (let i = 1; i < ACADEMIC_STANDINGS.length; i++) {
            expect(ACADEMIC_STANDINGS[i - 1].minGpa).toBeGreaterThan(
                ACADEMIC_STANDINGS[i].minGpa,
            );
        }
    });
});
