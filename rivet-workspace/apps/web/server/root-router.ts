import { router } from '../../../packages/rpc/src/server/router';
import { procedure } from '../../../packages/rpc/src/server/procedure';
import { object } from '../../../packages/schema/src/types/object';
import { string } from '../../../packages/schema/src/types/primitives';

export const appRouter = router({
	user: router({
		get: procedure
			.input(object({ id: string() }))
			.query(input => ({ id: input.id })),
	}),
});
