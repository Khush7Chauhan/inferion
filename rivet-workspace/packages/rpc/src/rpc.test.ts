import { afterEach, describe, expect, it, vi } from 'vitest';
import { object, string } from '../../schema/src/index.js';
import { createRivetClient, type RivetClient } from './client/create-client.js';
import { procedure } from './server/procedure.js';
import { router } from './server/router.js';

type Equal<Left, Right> = [Left] extends [Right]
	? [Right] extends [Left]
		? true
		: false
	: false;

type Assert<T extends true> = T;

const appRouter = router({
	users: router({
		get: procedure()
			.input(object({ id: string() }))
			.query(input => ({ id: input.id, name: 'Ada' })),
	}),
});

type Client = RivetClient<typeof appRouter>;
type ClientInputIsExact = Assert<Equal<Parameters<Client['users']['get']>[0], { id: string }>>;
type ClientOutputIsExact = Assert<Equal<Awaited<ReturnType<Client['users']['get']>>, { id: string; name: string }>>;

describe('Phase 2 RPC', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('parses nested procedure input and resolves output', async () => {
		await expect(appRouter.execute('users.get', { id: 'user-1', extra: true })).resolves.toEqual({
			id: 'user-1',
			name: 'Ada',
		});
	});

	it('rejects invalid procedure input before the resolver runs', async () => {
		await expect(appRouter.execute('users.get', { id: 42 })).rejects.toThrow(
			'Expected a string, received number',
		);
	});

	it('creates a typed client that builds the RPC request path', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'user-1', name: 'Ada' }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		const client = createRivetClient<typeof appRouter>({ url: 'https://api.example.com/api/rpc' });

		await expect(client.users.get({ id: 'user-1' })).resolves.toEqual({ id: 'user-1', name: 'Ada' });
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/api/rpc/users.get?id=user-1',
			expect.objectContaining({ method: 'GET' }),
		);
	});
});
