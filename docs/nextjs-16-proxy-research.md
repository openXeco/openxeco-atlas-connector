# Next.js 16.3.1 Proxy research

## Scope and sources

This note checks `packages/frontend/src/proxy.ts` against the documentation bundled with the installed `next@16.3.1` package and against first-party Next.js documentation, release notes, and source changes. No application code was changed.

Primary sources:

- [Proxy file convention and API](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Authentication guide, pinned to v16.3.1](https://github.com/vercel/next.js/blob/v16.3.1/docs/01-app/02-guides/authentication.mdx#L1048-L1151)
- [Next.js v16.3.1 release notes](https://github.com/vercel/next.js/releases/tag/v16.3.1)
- [Next.js v16.3.0 release notes](https://github.com/vercel/next.js/releases/tag/v16.3.0)
- [Turbopack proxy-matcher parity change](https://github.com/vercel/next.js/pull/93594)
- [v16.3.1 repeated-prefetch-loop fix](https://github.com/vercel/next.js/pull/97325)

## Verdict

The file is structurally valid for Next.js 16.3.1, and its two redirects do not directly redirect a URL to itself:

- `src/proxy.ts` is at the same level as `src/app`, which is a supported location.
- It exports one named `proxy` function and a static `config` object, both supported.
- Marking the function `async` is allowed, although this function has no `await` and does not need to be async.
- `NextResponse.redirect()` with a cloned `request.nextUrl`, and `NextResponse.next()` for the pass-through case, are supported.
- `request.cookies.has(name)` is a supported incoming-cookie operation.
- Proxy uses the Node.js runtime in Next.js 16 and cannot configure another runtime. This file does not attempt to configure one.

These conclusions follow the official [Proxy convention, exports, cookies, response, and runtime documentation](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) and the [version 16 migration guide](https://nextjs.org/docs/app/guides/upgrading/version-16#middleware-to-proxy).

The proxy is nevertheless not fully correct as an authentication boundary:

1. It treats the mere presence of `atlas-session` (or the configured name) as authenticated. A malformed, forged, or otherwise invalid cookie reaches protected pages. The official auth guide describes Proxy as an optimistic check, shows decrypting/validating session data, and says authorization must also be enforced near the data source. See the [v16.3.1 authentication guidance](https://github.com/vercel/next.js/blob/v16.3.1/docs/01-app/02-guides/authentication.mdx#L1048-L1151).
2. It protects every non-excluded pathname, rather than declaring protected and public routes. That is a valid policy for an app with only `/login` public, but every future public page must be added explicitly or it will redirect.
3. Exact comparison with `'/login'` does not treat `'/login/'` as public. Next.js normally canonicalizes trailing slashes before or around routing, but custom trailing-slash/URL-normalization settings or an upstream proxy can make exact-path assumptions fragile. There are no such custom settings in the current `next.config.ts`.

## Matcher review

Current matcher:

```ts
'/((?!api|favicon|_next/static|.well-known|_next/image|.*\\.png$).*)'
```

Official negative-matcher example:

```ts
'/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'
```

The official example and matcher semantics are documented in the [Proxy API reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#negative-matching).

Differences and consequences:

- `.well-known` does exclude the intended literal `/.well-known/...`, but the dot is a regular-expression wildcard. It should be escaped (`\\.well-known`) if retained; as written, it also excludes unrelated first segments such as `/xwell-known`.
- `favicon` excludes every path beginning with that text, while the documented form precisely excludes `favicon.ico`.
- `sitemap.xml` and `robots.txt` are not excluded, so an unauthenticated request for either is redirected to `/login`.
- Only `.png` files are excluded. Public `.svg`, `.jpg`, `.webmanifest`, and similar assets still execute Proxy and are redirected for unauthenticated users. Assets emitted under `/_next/static` remain excluded.
- `api`, as in the official example, also excludes any first segment beginning with `api`, not only `/api/`. This is normally acceptable but is worth knowing.
- `/login` itself intentionally matches. Loop avoidance therefore depends on the branch at lines 8-12 returning `NextResponse.next()` for an unauthenticated `/login` request. The current branch does that.

Without a matcher, Proxy runs for every request, including public and framework assets. Next.js explicitly recommends precise matchers to avoid blocking CSS, JavaScript, and images. Proxy also runs before filesystem routes. The documented order is: `next.config` headers, `next.config` redirects, Proxy, `beforeFiles` rewrites, filesystem routes, `afterFiles` rewrites, dynamic routes, then fallback rewrites. See [matcher](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher) and [execution order](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#execution-order).

## Redirect-loop analysis

For the two canonical paths and the cookie state visible to a single request, the state transitions are finite:

| Request | Cookie absent | Cookie present |
| --- | --- | --- |
| `/login` | pass through | redirect to `/` |
| `/` or another matched page | redirect to `/login` | pass through |

This differs from the known loop pattern where an authenticated request is unconditionally redirected to a destination that the same rule redirects again. The Next.js repository has an [official documentation issue demonstrating that self-redirect pattern](https://github.com/vercel/next.js/issues/62547).

A browser-visible loop can still happen if the cookie state differs between consecutive requests—for example, the cookie appears on `/login` but is missing on `/`, or another application layer redirects `/` back to `/login`. The cookie created by this repository uses `path: '/'`, so its configured path is consistent with both routes. Capturing the actual `Location` and `Cookie` headers across requests is necessary to prove such a loop.

## Relevance of the 16.3 update to timeouts

The [v16.3.1 release notes](https://github.com/vercel/next.js/releases/tag/v16.3.1) do not list a general Proxy render-timeout regression. They do include fixes for repeated prefetch loops, a navigation-inspector request loop, and dev compilation of middleware redirect routes. The [repeated-prefetch-loop PR](https://github.com/vercel/next.js/pull/97325) concerns optimistic routing with rewrite-based locale injection and a fully dynamic route; this proxy uses redirects, not rewrites, so that exact defect does not match the current code.

The more relevant behavior change landed in 16.3.0. Its [release notes](https://github.com/vercel/next.js/releases/tag/v16.3.0) include Turbopack matcher fixes and parity with webpack. The associated [matcher PR](https://github.com/vercel/next.js/pull/93594) says Proxy should match segment-prefetch canonical URLs and include `.rsc` handling. Consequently, a broad matcher can execute for more render/prefetch traffic after the upgrade. That can expose or amplify expensive Proxy work and redirect mistakes.

This particular Proxy does no network/database work and has no awaited operation; aside from logging, it only checks a cookie and constructs a response. On code inspection, it is therefore unlikely to be the direct source of a genuine server render timeout. Next.js also explicitly says Proxy should only perform optimistic cookie checks and should avoid slow data fetching because it runs on every route, including prefetches. See [Proxy use cases](https://nextjs.org/docs/app/getting-started/proxy#use-cases) and the [authentication guide](https://github.com/vercel/next.js/blob/v16.3.1/docs/01-app/02-guides/authentication.mdx#L1048-L1151).

The strongest version-specific hypothesis is therefore: 16.3's corrected matcher/request handling causes this broad Proxy to run on additional RSC or segment-prefetch requests, while the actual wait occurs later in route rendering, session validation, or backend access. Request logs and a redirect trace are needed to distinguish that from a changing-cookie redirect cycle.

## Recommended verification

Use the official testing helpers documented under [Unit testing Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#unit-testing-experimental) to assert representative paths and redirect destinations. Cover at least:

- `/`, `/login`, and `/login/`, with and without the named cookie
- `/api/auth/me`, `/_next/static/...`, `/_next/image/...`, and `/.well-known/...`
- `/robots.txt`, `/sitemap.xml`, and each public asset type
- an RSC request and a segment-prefetch request observed from the browser network trace

Also record, for every request in the failing sequence, method, pathname, relevant prefetch/RSC headers, whether the cookie is present, status, `Location`, and duration. Repeated alternating `307` responses indicate application redirect cycling; one long-running non-redirect response points to downstream rendering or data access instead.
