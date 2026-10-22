import { apiSuccess, createGetHandler } from '@/lib/api';
import { financeService } from '@/lib/services';

export const GET = createGetHandler({ permission: 'finance.view' }, async () => {
  const methods = await financeService.getPaymentMethods();
  return apiSuccess(methods);
});
