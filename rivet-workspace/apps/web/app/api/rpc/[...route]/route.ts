import { NextResponse } from 'next/server';
import { appRouter } from '../../../../server/root-router';

type RouteContext = {
	params: Promise<{ route: string[] }>;
};

async function executeRpc(
	params: Promise<{ route: string[] }>,
	payload: unknown,
): Promise<NextResponse> {
	const { route } = await params;
	const path = route.join('.');

	try {
		const data = await appRouter.execute(path, payload);
		return NextResponse.json(data);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'RPC request failed';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

export async function GET(request: Request, { params }: RouteContext): Promise<NextResponse> {
	const searchParams = new URL(request.url).searchParams;
	const payload = Object.fromEntries(searchParams.entries());

	return executeRpc(params, payload);
}

export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
	}

	return executeRpc(params, payload);
}
