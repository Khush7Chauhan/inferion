import { describe, expect, it } from 'vitest';
import {
	array,
	boolean,
	Infer,
	literal,
	nullable,
	number,
	object,
	optional,
	string,
	union,
} from './index';

type Equal<Left, Right> = [Left] extends [Right]
	? [Right] extends [Left]
		? true
		: false
	: false;

type Assert<T extends true> = T;

describe('Phase 1 schema system', () => {
	it('derives static types and rejects invalid runtime data', () => {
		const userSchema = object({
			id: string(),
			age: number(),
			active: boolean(),
		});

		type User = Infer<typeof userSchema>;
		type UserTypeIsExact = Assert<Equal<User, {
			id: string;
			age: number;
			active: boolean;
		}>>;

		const user: User = { id: 'user-1', age: 30, active: true };
		expect(userSchema.parse(user)).toEqual(user);
		expect(() => userSchema.parse({ id: 'user-1', age: 'thirty', active: true })).toThrow(
			'age.Expected a number, received string',
		);
	});

	it('supports arrays, nested objects, and unknown-key stripping', () => {
		const schema = object({
			users: array(object({ name: string() })),
		});

		expect(schema.parse({ users: [{ name: 'Ada', ignored: true }], ignored: true })).toEqual({
			users: [{ name: 'Ada' }],
		});
		expect(() => schema.parse({ users: [{ name: 42 }] })).toThrow(
			'users.0.name.Expected a string, received number',
		);
	});

	it('supports optional and nullable values', () => {
		const schema = object({
			name: optional(string()),
			age: nullable(number()),
		});

		expect(schema.parse({ age: null })).toEqual({ name: undefined, age: null });
		expect(schema.parse({ name: 'Ada', age: 30 })).toEqual({ name: 'Ada', age: 30 });
	});

	it('supports unions and literals', () => {
		const schema = union(literal('draft'), literal('published'));

		expect(schema.parse('draft')).toBe('draft');
		expect(() => schema.parse('archived')).toThrow(
			'Expected a value matching one of the provided schemas',
		);
	});

	it('returns a discriminated safeParse result', () => {
		expect(string().safeParse('valid')).toEqual({ success: true, data: 'valid' });
		const result = number().safeParse('invalid');

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.name).toBe('ValidationError');
		}
	});
});
