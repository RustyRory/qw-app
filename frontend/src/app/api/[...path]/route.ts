import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

async function handler(request: NextRequest) {
  const { pathname, search } = new URL(request.url);
  const backendUrl = BACKEND_URL + pathname + search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: hasBody ? request.body : null,
    // @ts-expect-error - duplex needed for streaming request body
    duplex: "half",
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
