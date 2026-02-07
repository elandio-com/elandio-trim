import { IRequest } from 'itty-router';

export async function healthCheck(request: IRequest): Promise<Response> {
    return new Response('OK', { status: 200 });
}
