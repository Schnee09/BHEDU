/**
 * Admin Single Class API (REFACTORED)
 * CRUD operations for a specific class
 */

import { NextResponse } from "next/server";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { updateClassSchema } from "@/lib/schemas";
import { ClassService } from "@/lib/services/classService";
import { AuthorizationError, NotFoundError } from "@/lib/api/errors";
import { hasPermission } from "@/lib/auth/core";

// GET /api/admin/classes/[id]
export const GET = createGetHandler(
  { permission: "classes.view" },
  async ({ params, user }) => {
    const classData = await ClassService.getClassById(params.id);

    // Access Control Logic
    const canManageAll = hasPermission(user.role as any, "classes.manage");

    if (
      !canManageAll && user.role === "teacher" &&
      classData.teacher_id !== user.id
    ) {
      throw new AuthorizationError("Access denied - not your class");
    }

    return apiSuccess(classData);
  },
);

// PATCH /api/admin/classes/[id]
export const PATCH = createApiHandler(
  {
    permission: "classes.manage",
    bodySchema: updateClassSchema,
  },
  async ({ params, body }) => {
    // Check if class exists
    const existing = await ClassService.getClassById(params.id);
    if (!existing) {
      throw new NotFoundError("Class not found");
    }

    const updatedClass = await ClassService.updateClass(params.id, body);
    return apiSuccess(updatedClass);
  },
);

// DELETE /api/admin/classes/[id]
export const DELETE = createGetHandler(
  { permission: "classes.manage" },
  async ({ params }) => {
    await ClassService.deleteClass(params.id);
    return apiSuccess(null, { message: "Class deleted successfully" });
  },
);
