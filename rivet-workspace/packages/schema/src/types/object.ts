import { ValidationError } from '../error.js';
import { Schema } from './primitives.js';

type InferShape<Shape extends Record<string, Schema<any>>> = {
	[Key in keyof Shape]: Shape[Key] extends Schema<infer Type> ? Type : never;
};

export class ObjectSchema<Shape extends Record<string, Schema<any>>> extends Schema<InferShape<Shape>> {
	constructor(private readonly shape: Shape) {
		super();
	}

	parse(value: unknown): InferShape<Shape> {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new ValidationError(`Expected an object, received ${value === null ? 'null' : typeof value}`);
		}

		const input = value as Record<string, unknown>;
		const result: Partial<InferShape<Shape>> = {};

		for (const key of Object.keys(this.shape)) {
			try {
				result[key as keyof Shape] = this.shape[key].parse(input[key]) as InferShape<Shape>[keyof Shape];
			} catch (error) {
				if (error instanceof ValidationError) {
					throw new ValidationError(`${key}.${error.message}`);
				}

				throw error;
			}
		}

		return result as InferShape<Shape>;
	}
}

export function object<Shape extends Record<string, Schema<any>>>(shape: Shape): ObjectSchema<Shape> {
	return new ObjectSchema(shape);
}
