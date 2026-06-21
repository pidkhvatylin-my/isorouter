/**
 * Shared types for @isorouter/core: route config, guard context, router
 * options/snapshot, and compile-time path-template utilities.
 */

import type { LazyComponent } from "./lazy";

export type Awaitable<T> = T | Promise<T>;

export type NavigationKind = "reload" | "push" | "replace" | "traverse";

export interface GuardContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
  /** Aborts when this navigation is superseded by a newer one. */
  signal: AbortSignal;
  navigationType: NavigationKind;
}

/**
 * Navigation guard. Runs root → leaf before the matched components commit.
 *  - `undefined` / `true` → allow
 *  - `false`              → block (current URL is restored)
 *  - `string`             → redirect (replace) to that path
 */
export type BeforeLoad = (
  ctx: GuardContext,
) => Awaitable<void | boolean | string>;

export interface RouteConfig<C = unknown> {
  path?: string;
  index?: boolean;
  component?: C | LazyComponent<C>;
  beforeLoad?: BeforeLoad;
  /** Sets document.title on commit. Deepest title in the chain wins. */
  title?: string | ((ctx: GuardContext) => string);
  children?: readonly RouteConfig<C>[];
}

export interface RouterOptions {
  scroll?: "after-transition" | "manual";
  onError?: (err: unknown) => void;
  onCommit?: (snapshot: RouterSnapshot<unknown>) => void;
}

export interface RouterSnapshot<C> {
  /** Components for the matched chain, in render order (component-less routes removed). */
  components: C[];
  params: Record<string, string>;
  url: URL;
  status: "idle" | "navigating" | "not-found" | "error";
  error: unknown;
}

export interface RouteMatch<C = unknown> {
  chain: RouteConfig<C>[];
  params: Record<string, string>;
}

// ─── Compile-Time Path Templates ──────────────────────────────────────────────

type SegParam<Seg extends string> = Seg extends `:${infer P extends string}`
  ? Record<P, string>
  : Seg extends "*"
    ? Record<"*", string>
    : Record<never, never>;

/** `ExtractParams<'/concerts/:city'>` → `{ city: string }` */
export type ExtractParams<Path extends string> =
  Path extends `${infer Seg}/${infer Rest}`
    ? SegParam<Seg> & ExtractParams<Rest>
    : SegParam<Path>;

type StripLead<P extends string> = P extends `/${infer R}` ? R : P;

type JoinPath<Prefix extends string, P extends string> =
  StripLead<P> extends ""
    ? Prefix
    : Prefix extends "/"
      ? `/${StripLead<P>}`
      : `${Prefix}/${StripLead<P>}`;

type OneRoute<R extends RouteConfig<any>, Prefix extends string> = R extends {
  index: true;
}
  ? Prefix
  : R extends { path: infer P extends string }
    ? JoinPath<Prefix, P> extends infer Full extends string
      ? R extends { children: infer Ch extends readonly RouteConfig<any>[] }
        ?
            | (R extends { component: any } ? Full : never)
            | RouteTemplates<Ch, Full>
        : Full
      : never
    : never;

type RouteTemplates<
  T extends readonly RouteConfig<any>[],
  Prefix extends string = "/",
> = T extends readonly [
  infer H extends RouteConfig<any>,
  ...infer R extends readonly RouteConfig<any>[],
]
  ? OneRoute<H, Prefix> | RouteTemplates<R, Prefix>
  : never;

/** Union of every concrete path template in the config. */
export type RouteTemplate<T extends readonly RouteConfig<any>[]> =
  RouteTemplates<T>;

type ToHref<P extends string> = P extends `${infer A}/:${infer _}/${infer B}`
  ? ToHref<`${A}/${string}/${B}`>
  : P extends `${infer A}/:${infer _}`
    ? `${A}/${string}`
    : P extends `${infer A}/*`
      ? `${A}/${string}`
      : P;

/** Navigable href union: `"/" | "/about" | \`/concerts/${string}\` | ...` */
export type Href<T extends readonly RouteConfig<any>[]> = ToHref<
  RouteTemplate<T>
>;

/** A valid navigation target: a known path, optionally with `?query` or `#hash`. */
export type NavTarget<T extends readonly RouteConfig<any>[]> =
  | Href<T>
  | `${Href<T>}?${string}`
  | `${Href<T>}#${string}`;
