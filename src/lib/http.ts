import { NextResponse } from 'next/server'

export const DEFAULT_CACHE_CONTROL =
  'public, max-age=604800, s-maxage=604800, immutable'

function mergeHeaders(...headerInits: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers()
  for (const init of headerInits) {
    if (!init) continue
    const h = new Headers(init)
    h.forEach((value, key) => headers.set(key, value))
  }
  return headers
}

export function responseWithCache(
  body: BodyInit | null,
  init?: ResponseInit,
  cacheControl: string = DEFAULT_CACHE_CONTROL
): Response {
  const headers = mergeHeaders(init?.headers, {
    'Cache-Control': cacheControl,
  })
  return new Response(body, { ...init, headers })
}

export function jsonWithCache<T>(
  data: T,
  init?: ResponseInit,
  cacheControl: string = DEFAULT_CACHE_CONTROL
) {
  const headers = mergeHeaders(init?.headers, {
    'Cache-Control': cacheControl,
  })
  return NextResponse.json(data, { ...init, headers })
}

export function jsonError<T>(data: T, init?: ResponseInit) {
  const headers = mergeHeaders(init?.headers, {
    'Cache-Control': 'no-store',
  })
  return NextResponse.json(data, { ...init, headers })
}
