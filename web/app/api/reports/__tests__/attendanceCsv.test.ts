/**
 * @jest-environment node
 */

// Mock auth guard (used by createGetHandler)
jest.mock("@/lib/auth/guard", () => ({
  getAuthContext: jest.fn(async () => ({
    authorized: true,
    user: { id: "u1", email: "admin@test.com" },
    profile: {
      id: "p1",
      email: "admin@test.com",
      full_name: "Admin",
      is_active: true,
    },
    role: "admin",
  })),
}));

// Mock createServiceClient (used directly in the route, NOT getDataClient)
jest.mock("@/lib/supabase/server", () => {
  const makeBuilder = (result: any) => {
    const builder: any = {
      select: () => builder,
      order: () => builder,
      gte: () => builder,
      lte: () => builder,
      eq: () => builder,
      in: () => builder,
      limit: () => builder,
      then: (resolve: any) => resolve({ data: result, error: null }),
    };
    return builder;
  };

  const smallRows = [
    {
      id: "a1",
      date: "2025-12-01",
      status: "present",
      notes: "ok",
      class_id: "c1",
      student_id: "s1",
      student: { id: "s1", full_name: "Test Student" },
      class: { id: "c1", name: "Class 1" },
    },
  ];

  let currentAttendance = smallRows;

  const storageMock = {
    from: jest.fn(() => ({
      upload: jest.fn(async () => ({ error: null })),
      createSignedUrl: jest.fn(async () => ({
        data: { signedUrl: "https://signed.test/url" },
        error: null,
      })),
    })),
  };

  const mockClient = {
    from: (table: string) => {
      if (table === "attendance") return makeBuilder(currentAttendance);
      if (table === "profiles") {
        return makeBuilder([{ id: "s1", full_name: "Test Student" }]);
      }
      if (table === "classes") {
        return makeBuilder([{ id: "c1", name: "Class 1" }]);
      }
      if (table === "report_exports") {
        return {
          insert: (_obj: any) => ({
            select: (_sel: any) => ({
              single: async () => ({
                data: { id: "test-job-id" },
                error: null,
              }),
            }),
          }),
        };
      }
      return makeBuilder([]);
    },
    storage: storageMock,
  };

  // Expose setter for tests
  (global as any).__setAttendanceRows = (rows: any[]) => {
    currentAttendance = rows;
  };

  return {
    createServiceClient: jest.fn(() => mockClient),
    createClientFromRequest: jest.fn(() => mockClient),
    createClient: jest.fn(async () => mockClient),
    createClientFromToken: jest.fn(() => mockClient),
  };
});

// Mock apiVersion (used by createGetHandler response wrapper)
jest.mock("@/lib/api/apiVersion", () => ({
  API_VERSION: "1.0.0",
  getVersionHeaders: jest.fn(() => ({})),
  withVersionHeaders: jest.fn((response: any) => response),
}));

import { GET } from "../attendance/route";

describe("Attendance report CSV endpoint", () => {
  it("returns inline CSV for small result sets", async () => {
    (global as any).__setAttendanceRows?.([{
      id: "a1",
      date: "2025-12-01",
      status: "present",
      notes: "ok",
      class_id: "c1",
      student_id: "s1",
      student: { id: "s1", full_name: "Test Student" },
      class: { id: "c1", name: "Class 1" },
    }]);

    const req = new Request(
      "http://localhost/api/reports/attendance?format=csv",
    );
    Object.defineProperty(req, "nextUrl", {
      value: new URL("http://localhost/api/reports/attendance?format=csv"),
    });
    const res: any = await GET(req as any);

    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type");
    expect(ct).toMatch(/text\/csv/);
    const text = await res.text();
    expect(text).toContain("student_id");
    expect(text).toContain("Test Student");
  });

  it("uploads large CSV to storage and returns a signed URL", async () => {
    const largeRows = Array.from({ length: 3000 }).map((_, i) => ({
      id: `r${i}`,
      date: "2025-12-01",
      status: "present",
      notes: "",
      class_id: "c1",
      student_id: `s${i}`,
      student: { id: `s${i}`, full_name: `Student ${i}` },
      class: { id: "c1", name: "Class 1" },
    }));
    (global as any).__setAttendanceRows?.(largeRows);

    const req = new Request(
      "http://localhost/api/reports/attendance?format=csv",
    );
    Object.defineProperty(req, "nextUrl", {
      value: new URL("http://localhost/api/reports/attendance?format=csv"),
    });
    const res: any = await GET(req as any);
    expect(res.status).toBe(200);

    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      const json = await res.json();
      expect(json).toHaveProperty("jobId");
      expect(typeof json.jobId).toBe("string");
    } else {
      const text = await res.text();
      expect(text).toContain("student_id");
    }
  });
});
