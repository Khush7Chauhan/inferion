import type { AppRouter, Router } from '../server/router.js';
import type { Procedure } from '../server/procedure.js';

type ClientNode<T> = T extends Procedure<infer TInput, infer TOutput>
	? (input: TInput) => Promise<TOutput>
	: T extends Record<string, unknown>
		? { [Key in keyof T]: ClientNode<T[Key]> }
		: never;

type RouterShape<TRouter> = TRouter extends Router<infer TRoutes>
	? AppRouter<TRoutes>
	: TRouter;

export type RivetClient<TRouter> = ClientNode<RouterShape<TRouter>>;

export function createRivetClient<TRouter>({ url }: { url: string }): RivetClient<TRouter> {
	const rootUrl = url.replace(/\/$/, '');

	const createProxy = (path: string[]): object => new Proxy(() => undefined, {
		get(_target, property) {
			if (typeof property === 'symbol') {
				return undefined;
			}

			return createProxy([...path, property.toString()]);
		},
		apply(_target, _thisArg, [input]) {
			const operation = path.at(-1)?.toLowerCase();
			const method = operation === 'get' ? 'GET' : 'POST';
			const endpoint = `${rootUrl}/${path.join('.')}`;
			const query = method === 'GET' && input && typeof input === 'object'
				? `?${new URLSearchParams(input as Record<string, string>).toString()}`
				: '';

			return fetch(`${endpoint}${query}`, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: method === 'GET' ? undefined : JSON.stringify(input),
			}).then(async response => {
				if (!response.ok) {
					throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
				}

				return response.json();
			});
		},
	}) as unknown as RivetClient<TRouter>;

	return createProxy([]) as RivetClient<TRouter>;
}
