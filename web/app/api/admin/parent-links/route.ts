import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { linkService } from '@/lib/services/linkService';
import { updateLinkStatusSchema } from '@/lib/schemas';

export const GET = createGetHandler(
  { permission: 'parent_links.view' },
  async ({ searchParams }) => {
    const parsedPage = Number(searchParams.get('page'));
    const parsedLimit = Number(searchParams.get('limit'));
    const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit =
      Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
    const requestedStatus = searchParams.get('status');
    const status = ['pending', 'approved', 'rejected', 'revoked'].includes(requestedStatus ?? '')
      ? requestedStatus!
      : 'all';

    const { links, total } = await linkService.getLinks({
      page,
      pageSize: limit,
      status,
    });

    return apiPaginated(links, { page, pageSize: limit, total });
  }
);

export const PATCH = createApiHandler(
  {
    permission: 'parent_links.approve',
    bodySchema: updateLinkStatusSchema,
  },
  async ({ body, user }) => {
    const link = await linkService.updateLinkStatus(body, user.id);
    return apiSuccess(link, {
      message: 'Đã cập nhật trạng thái liên kết',
    });
  }
);
