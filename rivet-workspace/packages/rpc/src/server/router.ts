import type { Procedure } from './procedure';
import type { ProcedureMethod } from './procedure';
import { ValidationError } from '../../../schema/src/error';

export type RpcErrorCode = 'NOT_FOUND' | 'METHOD_NOT_ALLOWED' | 'VALIDATION_ERROR';

export class RpcError extends Error {
	constructor(
		public readonly code: RpcErrorCode,
		message: string,
		public readonly statusCode: 400 | 404 | 405,
	) {
		super(message);
		this.name = 'RpcError';
	}
}

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

	async execute(path: string, body: unknown, method?: ProcedureMethod): Promise<unknown> {
		const procedure = this.findProcedure(path.split('.'));

		if (!procedure) {
			throw new RpcError('NOT_FOUND', `Procedure not found: ${path}`, 404);
		}

		if (method && procedure.method !== method) {
			throw new RpcError('METHOD_NOT_ALLOWED', `${procedure.method} is required for ${path}`, 405);
		}

		try {
			const input = procedure.schema ? procedure.schema.parse(body) : undefined;
			return procedure.resolver(input);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new RpcError('VALIDATION_ERROR', error.message, 400);
			}

			throw error;
		}
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
