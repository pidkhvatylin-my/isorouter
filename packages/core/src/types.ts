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
  /** Static or computed metadata; shallow-merged root → leaf (child wins). */
  metadata?: RouteMetadataInput;
  children?: readonly RouteConfig<C>[];
}

/**
 * Per-route metadata — carried and merged by the router, never interpreted by it.
 * Empty by design: declare your own schema via module augmentation (always
 * against `@isorouter/core`, even when using an adapter):
 *
 *   declare module "@isorouter/core" {
 *     interface RouteMetadata {
 *       title?: string;
 *       description?: string;
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RouteMetadata {}

/** Context for a metadata function. Narrower than `GuardContext` by design. */
export interface MetadataContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
}

export type RouteMetadataInput =
  | RouteMetadata
  | ((ctx: MetadataContext) => RouteMetadata);

/** Scroll handling after a committed navigation, forwarded to `intercept`. */
export type ScrollMode = "after-transition" | "manual";

export interface RouterOptions {
  scroll?: ScrollMode;
  onError?: (err: unknown) => void;
  onCommit?: (snapshot: RouterSnapshot<unknown>) => void;
}

/** Lifecycle state of the current navigation. */
export type RouterStatus = "idle" | "navigating" | "not-found" | "error";

export interface RouterSnapshot<C> {
  /** Components for the matched chain, in render order (component-less routes removed). */
  components: C[];
  params: Record<string, string>;
  url: URL;
  status: RouterStatus;
  error: unknown;
  metadata: RouteMetadata;
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

/**
 * Resolves a `Register` interface to its `router` type when augmented,
 * or falls back to `Fallback` when the interface is empty.
 * Used by framework adapters to implement the module-augmentation pattern.
 */
export type ResolveRegister<Reg, Fallback> = Reg extends {
  router: infer R extends Fallback;
}
  ? R
  : Fallback;
