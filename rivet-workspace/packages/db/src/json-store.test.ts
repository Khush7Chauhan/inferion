import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { JsonStore } from './json-store';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

describe('JsonStore', () => {
	it('persists values across store instances', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'typeforge-store-'));
		temporaryDirectories.push(directory);
		const filePath = join(directory, 'projects.json');
		const firstStore = new JsonStore(filePath, { count: 0 });

		await firstStore.update(value => ({ count: value.count + 1 }));

		const secondStore = new JsonStore(filePath, { count: 0 });
		expect(await secondStore.read()).toEqual({ count: 1 });
	});

	it('serializes concurrent updates', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'typeforge-store-'));
		temporaryDirectories.push(directory);
		const store = new JsonStore<string[]>(join(directory, 'items.json'), []);

		await Promise.all([
			store.update(items => [...items, 'first']),
			store.update(items => [...items, 'second']),
		]);

		expect(await store.read()).toEqual(['first', 'second']);
	});
});
