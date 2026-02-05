import {
    apiPaginated,
    apiSuccess,
    createApiHandler,
    createGetHandler,
} from "@/lib/api/apiHandler";
import { linkService } from "@/lib/services/linkService";
import { paginationSchema, updateLinkStatusSchema } from "@/lib/schemas";

export const GET = createGetHandler(
    { permission: "users.view" },
    async ({ searchParams }) => {
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status") || "all";

        const { links, total } = await linkService.getLinks({
            page,
            pageSize: limit,
            status,
        });

        return apiPaginated(links, { page, pageSize: limit, total });
    },
);

export const PATCH = createApiHandler({
    permission: "users.create", // Permissions for approving links
    bodySchema: updateLinkStatusSchema,
}, async ({ body }) => {
    const link = await linkService.updateLinkStatus(body);
    return apiSuccess(link, {
        message: "Trạng thái liên kết đã được cập nhật",
    });
});

export const POST = createApiHandler({
    permission: "users.create",
    bodySchema: updateLinkStatusSchema.omit({ id: true }).extend({
        parent_id: updateLinkStatusSchema.shape.id,
        student_id: updateLinkStatusSchema.shape.id,
        relationship: updateLinkStatusSchema.shape.status.transform(() =>
            "other"
        ), // Placeholder logic
    }),
}, async ({ body }) => {
    // Not used via admin for now, but good to have standardized
    throw new Error("POST not implemented for admin links");
});
