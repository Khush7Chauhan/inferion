import { ValidationError } from '../error.js';
import type { Infer } from '../infer.js';
import { Schema } from './primitives.js';

export class ArraySchema<TSchema extends Schema<any>> extends Schema<Infer<TSchema>[]> {
	constructor(private readonly itemSchema: TSchema) {
		super();
	}

	parse(value: unknown): Infer<TSchema>[] {
		if (!Array.isArray(value)) {
			throw new ValidationError(`Expected an array, received ${value === null ? 'null' : typeof value}`);
		}

		return value.map((item, index) => {
			try {
				return this.itemSchema.parse(item);
			} catch (error) {
				if (error instanceof ValidationError) {
					throw new ValidationError(`${index}.${error.message}`);
				}

				throw error;
			}
		});
	}
}

export class OptionalSchema<TSchema extends Schema<any>> extends Schema<Infer<TSchema> | undefined> {
	constructor(private readonly innerSchema: TSchema) {
		super();
	}

	parse(value: unknown): Infer<TSchema> | undefined {
		return value === undefined ? undefined : this.innerSchema.parse(value);
	}
}

export class NullableSchema<TSchema extends Schema<any>> extends Schema<Infer<TSchema> | null> {
	constructor(private readonly innerSchema: TSchema) {
		super();
	}

	parse(value: unknown): Infer<TSchema> | null {
		return value === null ? null : this.innerSchema.parse(value);
	}
}

export class UnionSchema<TSchemas extends readonly Schema<any>[]> extends Schema<Infer<TSchemas[number]>> {
	constructor(private readonly schemas: TSchemas) {
		super();
	}

	parse(value: unknown): Infer<TSchemas[number]> {
		for (const schema of this.schemas) {
			try {
				return schema.parse(value) as Infer<TSchemas[number]>;
			} catch (error) {
				if (!(error instanceof ValidationError)) {
					throw error;
				}
			}
		}

		throw new ValidationError('Expected a value matching one of the provided schemas');
	}
}

export type LiteralValue = string | number | boolean | null;

export class LiteralSchema<TValue extends LiteralValue> extends Schema<TValue> {
	constructor(private readonly expectedValue: TValue) {
		super();
	}

	parse(value: unknown): TValue {
		if (!Object.is(value, this.expectedValue)) {
			throw new ValidationError(`Expected ${String(this.expectedValue)}, received ${String(value)}`);
		}

		return this.expectedValue;
	}
}

export function array<TSchema extends Schema<any>>(schema: TSchema): ArraySchema<TSchema> {
	return new ArraySchema(schema);
}

export function optional<TSchema extends Schema<any>>(schema: TSchema): OptionalSchema<TSchema> {
	return new OptionalSchema(schema);
}

export function nullable<TSchema extends Schema<any>>(schema: TSchema): NullableSchema<TSchema> {
	return new NullableSchema(schema);
}

export function union<TSchemas extends readonly Schema<any>[]>(...schemas: TSchemas): UnionSchema<TSchemas> {
	return new UnionSchema(schemas);
}

export function literal<TValue extends LiteralValue>(value: TValue): LiteralSchema<TValue> {
	return new LiteralSchema(value);
}
