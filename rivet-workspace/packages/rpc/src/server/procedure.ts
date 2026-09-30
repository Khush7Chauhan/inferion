import type { Infer } from '../../../schema/src/infer.js';
import type { Schema } from '../../../schema/src/types/primitives.js';

export type ProcedureMethod = 'GET' | 'POST';

export type ProcedureResolver<TInput, TOutput> = (input: TInput) => TOutput | Promise<TOutput>;

export interface Procedure<TInput, TOutput> {
	schema?: Schema<TInput>;
	resolver: ProcedureResolver<TInput, TOutput>;
	method: ProcedureMethod;
}

export class ProcedureBuilder<TInput = undefined> {
	constructor(private readonly schema?: Schema<TInput>) {}

	input<TSchema extends Schema<any>>(schema: TSchema): ProcedureBuilder<Infer<TSchema>> {
		return new ProcedureBuilder(schema);
	}

	query<TOutput>(resolver: ProcedureResolver<TInput, TOutput>): Procedure<TInput, TOutput> {
		return {
			schema: this.schema,
			resolver,
			method: 'GET',
		};
	}

	mutation<TOutput>(resolver: ProcedureResolver<TInput, TOutput>): Procedure<TInput, TOutput> {
		return {
			schema: this.schema,
			resolver,
			method: 'POST',
		};
	}
}

export const procedure = new ProcedureBuilder();
