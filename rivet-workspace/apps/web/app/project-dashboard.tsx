"use client";

import { FormEvent, useEffect, useState, startTransition } from 'react';
import { client } from '../lib/rpc-client';

type Projects = Awaited<ReturnType<typeof client.project.list>>;

type Project = Projects[number];

const priorityStyles = {
	low: 'bg-slate-100 text-slate-600',
	medium: 'bg-amber-100 text-amber-700',
	high: 'bg-rose-100 text-rose-700',
};

export function ProjectDashboard() {
	const [projects, setProjects] = useState<Projects>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

	useEffect(() => {
		client.project.list({})
			.then(setProjects)
			.catch(() => setError('Could not load projects. Check the API and try again.'))
			.finally(() => setIsLoading(false));
	}, []);

	async function createProject(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!name.trim()) {
			setError('Give the project a name before creating it.');
			return;
		}

		setError(null);
		setIsCreating(true);
		try {
			const project = await client.project.create({
				name: name.trim(),
				description: description.trim() || undefined,
			});
			startTransition(() => setProjects(current => [project, ...current]));
			setName('');
			setDescription('');
		} catch {
			setError('The project could not be created. Check the required fields.');
		} finally {
			setIsCreating(false);
		}
	}

	async function toggleTask(projectId: string, taskId: string) {
		try {
			const updatedProject = await client.project.toggleTask({ projectId, taskId });
			startTransition(() => {
				setProjects(current => current.map(project => (
					project.id === updatedProject.id ? updatedProject : project
				)));
			});
		} catch {
			setError('That task could not be updated. Refresh and try again.');
		}
	}

	const activeProjects = projects.filter(project => project.status === 'active').length;
	const openTasks = projects.reduce(
		(total, project) => total + project.tasks.filter(task => !task.done).length,
		0,
	);

	return (
		<div className="min-h-screen bg-[#f4f6f8] text-[#17212b]">
			<header className="border-b border-[#dfe5e9] bg-[#fbfcfd]">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center bg-[#163d3a] text-sm font-bold text-[#d7f2e8]">TF</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7e87]">TypeForge</p>
							<h1 className="text-lg font-semibold tracking-tight">Workboard</h1>
						</div>
					</div>
					<div className="hidden items-center gap-6 text-sm text-[#6f7e87] sm:flex">
						<span>Workspace / Product</span>
						<span className="h-2 w-2 bg-[#42a889]" />
						<span>Synced just now</span>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
				<section className="mb-10 flex flex-col justify-between gap-6 border-b border-[#dfe5e9] pb-8 md:flex-row md:items-end">
					<div>
						<p className="mb-3 text-sm font-medium text-[#42a889]">Monday, October 1, 2026</p>
						<h2 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-[#17212b] sm:text-5xl">Make the next move visible.</h2>
						<p className="mt-4 max-w-lg text-base leading-7 text-[#6f7e87]">A focused view of the work in motion, powered end to end by TypeForge schemas and typed RPC.</p>
					</div>
					<div className="grid grid-cols-2 gap-8 border-l border-[#dfe5e9] pl-6 sm:grid-cols-3">
						<div><p className="text-2xl font-semibold">{projects.length}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7d8b93]">Projects</p></div>
						<div><p className="text-2xl font-semibold">{activeProjects}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7d8b93]">Active</p></div>
						<div><p className="text-2xl font-semibold">{openTasks}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7d8b93]">Open tasks</p></div>
					</div>
				</section>

				{error && <div role="alert" className="mb-6 border border-[#efb4a8] bg-[#fff4f1] px-4 py-3 text-sm text-[#a4493e]">{error}</div>}

				<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
					<section>
						<div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-semibold tracking-tight">Projects</h3><span className="text-sm text-[#7d8b93]">{projects.length} tracked</span></div>
						{isLoading ? <div className="border border-[#dfe5e9] bg-white p-8 text-sm text-[#7d8b93]">Loading your workboard...</div> : projects.length === 0 ? <div className="border border-dashed border-[#b7c5ca] bg-white p-8 text-sm text-[#7d8b93]">No projects yet. Create the first one on the right.</div> : <div className="space-y-4">{projects.map(project => <ProjectCard key={project.id} project={project} onToggleTask={toggleTask} />)}</div>}
					</section>

					<aside className="h-fit border border-[#dfe5e9] bg-white p-6">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#42a889]">New workspace</p>
						<h3 className="mt-2 text-xl font-semibold tracking-tight">Start a project</h3>
						<p className="mt-2 text-sm leading-6 text-[#7d8b93]">Give the team a clear place to gather the next set of decisions.</p>
						<form className="mt-6 space-y-4" onSubmit={createProject}>
							<label className="block"><span className="mb-1.5 block text-sm font-medium">Project name</span><input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Mobile launch" className="w-full border border-[#cbd5d9] bg-[#fbfcfd] px-3 py-2.5 text-sm outline-none transition focus:border-[#42a889]" /></label>
							<label className="block"><span className="mb-1.5 block text-sm font-medium">Description <span className="font-normal text-[#9aa6ac]">(optional)</span></span><textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="What does success look like?" rows={3} className="w-full resize-none border border-[#cbd5d9] bg-[#fbfcfd] px-3 py-2.5 text-sm outline-none transition focus:border-[#42a889]" /></label>
							<button disabled={isCreating} className="w-full bg-[#163d3a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#245b53] disabled:cursor-wait disabled:opacity-60">{isCreating ? 'Creating...' : 'Create project'}</button>
						</form>
					</aside>
				</div>
			</main>
		</div>
	);
}

function ProjectCard({ project, onToggleTask }: { project: Project; onToggleTask: (projectId: string, taskId: string) => Promise<void> }) {
	const completedTasks = project.tasks.filter(task => task.done).length;

	return (
		<article className="border border-[#dfe5e9] bg-white p-5 sm:p-6">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
				<div><div className="mb-2 flex items-center gap-2"><span className={`h-2 w-2 ${project.status === 'active' ? 'bg-[#42a889]' : 'bg-[#d7a34b]'}`} /><span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8b93]">{project.status}</span></div><h4 className="text-xl font-semibold tracking-tight">{project.name}</h4><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d8b93]">{project.description}</p></div>
				<div className="text-left sm:text-right"><p className="text-2xl font-semibold">{completedTasks}/{project.tasks.length}</p><p className="text-xs uppercase tracking-[0.12em] text-[#9aa6ac]">complete</p></div>
			</div>
			<div className="mt-6 border-t border-[#edf0f1] pt-4">{project.tasks.length === 0 ? <p className="text-sm text-[#9aa6ac]">No tasks yet.</p> : <ul className="space-y-3">{project.tasks.map(task => <li key={task.id} className="flex items-center gap-3"><button type="button" aria-label={`${task.done ? 'Reopen' : 'Complete'} ${task.title}`} onClick={() => onToggleTask(project.id, task.id)} className={`flex h-5 w-5 shrink-0 items-center justify-center border ${task.done ? 'border-[#42a889] bg-[#42a889] text-white' : 'border-[#b7c5ca] bg-white'}`}>{task.done ? '✓' : ''}</button><span className={`min-w-0 flex-1 text-sm ${task.done ? 'text-[#9aa6ac] line-through' : 'text-[#35434c]'}`}>{task.title}</span><span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${priorityStyles[task.priority]}`}>{task.priority}</span></li>)}</ul>}</div>
		</article>
	);
}
