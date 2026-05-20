const WORKER_URL = "https://xfarming-api.farsyagpt.workers.dev";

export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  const target = WORKER_URL + url.pathname + url.search;
  const req = new Request(target, {
    method: ctx.request.method,
    headers: ctx.request.headers,
    body: ["GET", "HEAD"].includes(ctx.request.method) ? undefined : ctx.request.body,
    redirect: "follow",
  });
  return fetch(req);
}
