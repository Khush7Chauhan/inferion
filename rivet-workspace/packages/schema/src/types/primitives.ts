import { ValidationError } from '../error.js';

export abstract class Schema<T> {
	protected _type!: T;

	abstract parse(value: unknown): T;
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
