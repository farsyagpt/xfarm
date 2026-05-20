/**
 * CF Pages Function — reverse proxy semua /api/* ke Worker
 * Ini menggantikan _redirects yang tidak support POST proxy.
 */

const WORKER_URL = 'https://xfarming-api.farsyagpt.workers.dev';

export async function onRequest(ctx: EventContext<Record<string, unknown>, string, Record<string, unknown>>) {
  const url = new URL(ctx.request.url);
  const target = `${WORKER_URL}${url.pathname}${url.search}`;

  // Forward request as-is ke Worker, termasuk body, headers, method
  const req = new Request(target, {
    method: ctx.request.method,
    headers: ctx.request.headers,
    body: ['GET', 'HEAD'].includes(ctx.request.method) ? undefined : ctx.request.body,
    redirect: 'follow',
  });

  return fetch(req);
}
