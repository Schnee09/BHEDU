import {
    calculateRequiredGrade,
    calculateSemesterGPA,
    calculateSubjectAverage,
    calculateTrend,
    convertTo4PointScale,
    getAcademicStanding,
    GRADE_COEFFICIENTS,
    SemesterGPA,
    SubjectGrade,
} from "../gpaCalculator";

describe("GPA Calculator (Vietnamese System)", () => {
    describe("calculateSubjectAverage", () => {
        it("calculates weighted average correctly", () => {
            const grade: SubjectGrade = {
                subjectId: "MATH",
                subjectName: "Toán",
                credits: 3,
                oralScore: 8, // w: 1
                fifteenMinScore: 9, // w: 1
                fortyFiveMinScore: 7, // w: 2
                midtermScore: 8.5, // w: 2
                finalScore: 8.25, // w: 3
            };
            // (8*1 + 9*1 + 7*2 + 8.5*2 + 8.25*3) / (1+1+2+2+3)
            // (8 + 9 + 14 + 17 + 24.75) / 9 = 72.75 / 9 = 8.0833...
            const result = calculateSubjectAverage(grade);
            expect(result).toBeCloseTo(8.08, 2);
        });

        it("returns null if no scores are present", () => {
            const grade: SubjectGrade = {
                subjectId: "1",
                subjectName: "Toán",
                credits: 2,
            };
            expect(calculateSubjectAverage(grade)).toBeNull();
        });

        it("handles missing intermediate scores", () => {
            const grade: SubjectGrade = {
                subjectId: "1",
                subjectName: "Toán",
                credits: 2,
                finalScore: 9, // only final score present
            };
            // 9 * 3 / 3 = 9
            const result = calculateSubjectAverage(grade);
            expect(result).toBeCloseTo(9.0, 2);
        });

        it("handles all zero scores", () => {
            const grade: SubjectGrade = {
                subjectId: "1",
                subjectName: "Toán",
                credits: 2,
                oralScore: 0,
                finalScore: 0,
            };
            const result = calculateSubjectAverage(grade);
            expect(result).toBe(0);
        });
    });

    describe("calculateSemesterGPA", () => {
        it("calculates credit-weighted semester GPA accurately", () => {
            const grades: SubjectGrade[] = [
                {
                    subjectId: "1",
                    subjectName: "Toán",
                    credits: 3,
                    finalScore: 8,
                }, // avg: 8.0
                {
                    subjectId: "2",
                    subjectName: "Văn",
                    credits: 2,
                    finalScore: 7,
                }, // avg: 7.0
            ];
            // (8.0 * 3 + 7.0 * 2) / (3 + 2) = (24 + 14) / 5 = 38 / 5 = 7.6
            const result = calculateSemesterGPA(
                grades,
                "sem1",
                "HK1",
                "2023-2024",
            );

            expect(result.gpa).toBeCloseTo(7.6, 2);
            expect(result.totalCredits).toBe(5);
            expect(result.subjectCount).toBe(2);
            expect(result.standing.code).toBe("fair"); // Khá
        });

        it("returns zero for empty grades array", () => {
            const result = calculateSemesterGPA([], "sem1", "HK1", "2023-2024");
            expect(result.gpa).toBe(0);
            expect(result.totalCredits).toBe(0);
        });
    });

    describe("getAcademicStanding", () => {
        it("correctly classifies boundary values", () => {
            expect(getAcademicStanding(10).code).toBe("excellent");
            expect(getAcademicStanding(9.0).code).toBe("excellent");
            expect(getAcademicStanding(8.99).code).toBe("good");
            expect(getAcademicStanding(8.0).code).toBe("good");
            expect(getAcademicStanding(6.5).code).toBe("fair");
            expect(getAcademicStanding(5.0).code).toBe("average");
            expect(getAcademicStanding(4.99).code).toBe("weak");
            expect(getAcademicStanding(0).code).toBe("failing");
        });
    });

    describe("convertTo4PointScale", () => {
        it("maps Vietnamese 10-point scale to US 4.0 scale", () => {
            expect(convertTo4PointScale(8.5)).toBeCloseTo(3.7, 1);
            expect(convertTo4PointScale(5.0)).toBeCloseTo(1.5, 1);
            expect(convertTo4PointScale(10.0)).toBeCloseTo(4.0, 1);
            expect(convertTo4PointScale(0)).toBe(0);
        });
    });

    describe("calculateTrend", () => {
        it("identifies improving trend", () => {
            const semesters: SemesterGPA[] = [
                { semesterId: "1", gpa: 6.0 } as SemesterGPA,
                { semesterId: "2", gpa: 7.0 } as SemesterGPA,
                { semesterId: "3", gpa: 8.0 } as SemesterGPA,
            ];
            expect(calculateTrend(semesters)).toBe("improving");
        });

        it("identifies declining trend", () => {
            const semesters: SemesterGPA[] = [
                { semesterId: "1", gpa: 8.0 } as SemesterGPA,
                { semesterId: "2", gpa: 7.0 } as SemesterGPA,
            ];
            expect(calculateTrend(semesters)).toBe("declining");
        });

        it("identifies stable trend", () => {
            const semesters: SemesterGPA[] = [
                { semesterId: "1", gpa: 7.0 } as SemesterGPA,
                { semesterId: "2", gpa: 7.0 } as SemesterGPA,
            ];
            expect(calculateTrend(semesters)).toBe("stable");
        });
    });

    describe("calculateRequiredGrade", () => {
        it("calculates needed grade accurately", () => {
            // Current avg: 7.0 with weight 4. Target: 8.0 overall. Remaining weight: 3
            // Required = (8.0 * 7 - 7.0 * 4) / 3 = (56 - 28) / 3 = 28 / 3 = 9.33...
            expect(calculateRequiredGrade(7.0, 4, 8.0, 3)).toBeCloseTo(9.33, 2);
        });

        it("returns null if target is impossible (>10)", () => {
            // Current avg: 5.0 with weight 5. Target: 9.0. Remaining weight: 1.
            // Needs (9*6 - 25)/1 = 29 (impossible)
            expect(calculateRequiredGrade(5.0, 5, 9.0, 1)).toBeNull();
        });

        it("returns 1 if target requires minimal effort", () => {
            expect(calculateRequiredGrade(9.0, 5, 5.0, 5)).toBe(1);
        });
    });
});
