import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export class JsonStore<T> {
	private queue: Promise<void> = Promise.resolve();

	constructor(
		private readonly filePath: string,
		private readonly initialValue: T,
	) {}

	async read(): Promise<T> {
		await this.queue;
		return this.readFromDisk();
	}

	update(updater: (current: T) => T | Promise<T>): Promise<T> {
		const operation = this.queue.then(async () => {
			const current = await this.readFromDisk();
			const next = await updater(current);
			await this.writeToDisk(next);
			return next;
		});

		this.queue = operation.then(() => undefined, () => undefined);
		return operation;
	}

	private async readFromDisk(): Promise<T> {
		try {
			const contents = await readFile(this.filePath, 'utf8');
			return JSON.parse(contents) as T;
		} catch (error) {
			if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
				throw error;
			}

			await this.writeToDisk(this.initialValue);
			return this.initialValue;
		}
	}

	private async writeToDisk(value: T): Promise<void> {
		await mkdir(dirname(this.filePath), { recursive: true });
		const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
		await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
		await rename(temporaryPath, this.filePath);
	}
}
