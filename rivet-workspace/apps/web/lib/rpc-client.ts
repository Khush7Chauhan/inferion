import { createRivetClient } from '../../../packages/rpc/src/client/create-client';
import { appRouter } from '../server/root-router';

export const client = createRivetClient<typeof appRouter>({ url: '/api/rpc' });
