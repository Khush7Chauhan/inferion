import { object, string } from '../../schema/src/index.js';
import { type RivetClient } from './client/create-client.js';
import { procedure } from './server/procedure.js';
import { router } from './server/router.js';

const appRouter = router({
	users: router({
		get: procedure().input(object({ id: string() })).query(input => input.id),
	}),
});

declare const client: RivetClient<typeof appRouter>;

client.users.get({ id: 'valid' });
// @ts-expect-error IDs are schema-defined strings, not numbers.
client.users.get({ id: 42 });
