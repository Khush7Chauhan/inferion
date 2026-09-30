import { ValidationError } from '../error.js';

export type SafeParseResult<T> =
	| { success: true; data: T }
	| { success: false; error: ValidationError };

export abstract class Schema<T> {
	protected _type!: T;

	abstract parse(value: unknown): T;

	safeParse(value: unknown): SafeParseResult<T> {
		try {
			return { success: true, data: this.parse(value) };
		} catch (error) {
			if (error instanceof ValidationError) {
				return { success: false, error };
			}

			const message = error instanceof Error ? error.message : 'Validation failed';
			return { success: false, error: new ValidationError(message) };
		}
	}
}

export class StringSchema extends Schema<string> {
	parse(value: unknown): string {
		if (typeof value !== 'string') {
			throw new ValidationError(`Expected a string, received ${typeof value}`);
		}

		return value;
	}
}

export class NumberSchema extends Schema<number> {
	parse(value: unknown): number {
		if (typeof value !== 'number') {
			throw new ValidationError(`Expected a number, received ${typeof value}`);
		}

		return value;
	}
}

export class BooleanSchema extends Schema<boolean> {
	parse(value: unknown): boolean {
		if (typeof value !== 'boolean') {
			throw new ValidationError(`Expected a boolean, received ${typeof value}`);
		}

		return value;
	}
}

export function string(): StringSchema {
	return new StringSchema();
}

export function number(): NumberSchema {
	return new NumberSchema();
}

export function boolean(): BooleanSchema {
	return new BooleanSchema();
}
