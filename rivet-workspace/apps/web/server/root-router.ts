import { router } from '../../../packages/rpc/src/server/router';
import { procedure } from '../../../packages/rpc/src/server/procedure';
import { object } from '../../../packages/schema/src/types/object';
import { array, boolean, literal, optional, string, union } from '../../../packages/schema/src/index';
import { JsonStore } from '../../../packages/db/src/json-store';
import { join } from 'node:path';

const taskSchema = object({
	id: string(),
	title: string(),
	done: boolean(),
	priority: union(literal('low'), literal('medium'), literal('high')),
});

const projectSchema = object({
	id: string(),
	name: string(),
	description: string(),
	status: union(literal('active'), literal('paused'), literal('completed')),
	updatedAt: string(),
	tasks: array(taskSchema),
});

type Project = ReturnType<typeof projectSchema.parse>;

const initialProjects: Project[] = [
	{
		id: 'proj-1',
		name: 'TypeForge launch',
		description: 'Shape the first public release of the typed backend toolkit.',
		status: 'active',
		updatedAt: '2026-10-01T08:30:00.000Z',
		tasks: [
			{ id: 'task-1', title: 'Finish schema modifiers', done: true, priority: 'high' },
			{ id: 'task-2', title: 'Document the RPC contract', done: false, priority: 'medium' },
			{ id: 'task-3', title: 'Ship the first dashboard slice', done: false, priority: 'high' },
		],
	},
	{
		id: 'proj-2',
		name: 'Design system audit',
		description: 'Bring the product surface into one calm, consistent visual language.',
		status: 'paused',
		updatedAt: '2026-09-28T14:10:00.000Z',
		tasks: [
			{ id: 'task-4', title: 'Review empty states', done: true, priority: 'low' },
			{ id: 'task-5', title: 'Define dashboard spacing', done: false, priority: 'medium' },
		],
	},
];

const projectStore = new JsonStore(join(process.cwd(), '.data', 'projects.json'), initialProjects);

export const appRouter = router({
	project: router({
		list: procedure().input(object({})).query(() => projectStore.read()),
		create: procedure()
			.input(object({ name: string(), description: optional(string()) }))
			.mutation(async input => {
				const project: Project = {
					id: `proj-${Date.now()}`,
					name: input.name,
					description: input.description ?? 'A new project ready for planning.',
					status: 'active',
					updatedAt: new Date().toISOString(),
					tasks: [],
				};

				const projects = await projectStore.update(current => [project, ...current]);
				return projects[0];
			}),
		toggleTask: procedure()
			.input(object({ projectId: string(), taskId: string() }))
			.mutation(async input => {
				const projects = await projectStore.update(current => {
					const project = current.find(item => item.id === input.projectId);

					if (!project) {
						throw new Error('Project not found');
					}

					const task = project.tasks.find(item => item.id === input.taskId);

					if (!task) {
						throw new Error('Task not found');
					}

					return current.map(item => item.id === project.id
						? {
							...item,
							updatedAt: new Date().toISOString(),
							tasks: item.tasks.map(candidate => candidate.id === task.id
								? { ...candidate, done: !candidate.done }
								: candidate),
						}
						: item);
				});

				return projects.find(item => item.id === input.projectId)!;
			}),
	}),
});
