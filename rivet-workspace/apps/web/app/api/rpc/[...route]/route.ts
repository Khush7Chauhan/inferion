import { NextResponse } from 'next/server';
import { appRouter } from '../../../../server/root-router';
import { RpcError } from '../../../../../../packages/rpc/src/server/router';

type RouteContext = {
	params: Promise<{ route: string[] }>;
};

async function executeRpc(
	request: Request,
	params: Promise<{ route: string[] }>,
	payload: unknown,
): Promise<NextResponse> {
	const { route } = await params;
	const path = route.join('.');

	try {
		const data = await appRouter.execute(path, payload, request.method as 'GET' | 'POST');
		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof RpcError) {
			return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
		}

		return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal RPC error' } }, { status: 500 });
	}
}

export async function GET(request: Request, { params }: RouteContext): Promise<NextResponse> {
	const searchParams = new URL(request.url).searchParams;
	const payload = Object.fromEntries(searchParams.entries());

	return executeRpc(request, params, payload);
}

export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
	}

	return executeRpc(request, params, payload);
}
