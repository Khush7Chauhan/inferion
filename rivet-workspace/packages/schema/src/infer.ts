import type { ObjectSchema } from './types/object';
import type { Schema } from './types/primitives';
import { number, string } from './types/primitives';
import { object } from './types/object';

export type Infer<T> = T extends ObjectSchema<infer Shape>
	? { [Key in keyof Shape]: Infer<Shape[Key]> }
	: T extends Schema<infer U>
		? U
		: never;

type Equal<Left, Right> = [Left] extends [Right]
	? [Right] extends [Left]
		? true
		: false
	: false;

type Assert<T extends true> = T;

const inferObjectTestSchema = object({
	name: string(),
	age: number(),
});

type InferObjectTest = Assert<Equal<
	Infer<typeof inferObjectTestSchema>,
	{ name: string; age: number }
>>;

const inferNestedObjectTestSchema = object({
	user: inferObjectTestSchema,
});

type InferNestedObjectTest = Assert<Equal<
	Infer<typeof inferNestedObjectTestSchema>,
	{ user: { name: string; age: number } }
>>;
