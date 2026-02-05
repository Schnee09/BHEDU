import {
    apiPaginated,
    apiSuccess,
    createApiHandler,
    createGetHandler,
} from "@/lib/api/apiHandler";
import { linkService } from "@/lib/services/linkService";
import { parentStudentLinkSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/api/errors";

export const GET = createGetHandler(
    { allowedRoles: ["parent"] },
    async ({ user }) => {
        const { links, total } = await linkService.getLinks({
            parentId: user.id,
        });

        return apiPaginated(links, { page: 1, pageSize: total, total });
    },
);

export const POST = createApiHandler({
    allowedRoles: ["parent"],
    bodySchema: parentStudentLinkSchema.omit({ parent_id: true, status: true }),
}, async ({ body, user }) => {
    const link = await linkService.requestLink({
        ...body,
        parent_id: user.id,
        status: "pending",
    });

    return apiSuccess(link, {
        message: "Yêu cầu kết nối đã được gửi thành công",
    });
});
