import type { Procedure } from './procedure.js';

export type RouterRecord = Record<string, Procedure<any, any> | Router<any>>;

export type AppRouter<TRoutes extends RouterRecord> = {
	[Key in keyof TRoutes]: TRoutes[Key] extends Router<infer NestedRoutes>
		? AppRouter<NestedRoutes>
		: TRoutes[Key] extends Procedure<any, any>
			? TRoutes[Key]
			: never;
};

function isProcedure(value: unknown): value is Procedure<any, any> {
	return typeof value === 'object' && value !== null && 'resolver' in value && typeof value.resolver === 'function';
}

export class Router<TRoutes extends RouterRecord> {
	constructor(public readonly routes: TRoutes) {}

	async execute(path: string, body: unknown): Promise<unknown> {
		const procedure = this.findProcedure(path.split('.'));

		if (!procedure) {
			throw new Error(`Procedure not found: ${path}`);
		}

		const input = procedure.schema ? procedure.schema.parse(body) : undefined;
		return procedure.resolver(input);
	}

	private findProcedure(path: string[]): Procedure<any, any> | undefined {
		let current: unknown = this;

		for (const segment of path) {
			if (!(current instanceof Router)) {
				return undefined;
			}

			current = current.routes[segment];
		}

		return isProcedure(current) ? current : undefined;
	}
}

export function router<TRoutes extends RouterRecord>(routes: TRoutes): Router<TRoutes> {
	return new Router(routes);
}
