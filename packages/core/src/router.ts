/**
 * Framework-agnostic router implementation for @isorouter/core.
 *
 * Wires the Navigation API to the route-matching algorithm: intercepts
 * `navigate` events, runs `beforeLoad` guards (root → leaf), resolves lazy
 * components, and publishes immutable snapshots to subscribers so it can plug
 * directly into `useSyncExternalStore`, `createSubscriber`, `shallowRef`, etc.
 */

import { isLazy, type LazyComponent } from "./lazy";
import { matchRoutes } from "./matcher";

import type {
  GuardContext,
  NavTarget,
  NavigationKind,
  RouteConfig,
  RouterOptions,
  RouterSnapshot,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export type Unsubscribe = () => void;

const NOOP = () => undefined;
const SAFE_ORIGIN = "http://localhost/";

function initialUrl(): URL {
  return new URL(typeof location !== "undefined" ? location.href : SAFE_ORIGIN);
}

function normalizePath(p: string): string {
  return p.replace(/\/+$/, "") || "/";
}

/**
 * Navigations the router must leave to the browser: cross-document or otherwise
 * uninterceptable nav, in-page hash changes, downloads, and same-document form
 * submissions (which should reach the server). Cheap boolean checks only — the
 * origin check lives in #onNavigate since it needs the parsed destination URL.
 */
function shouldNotIntercept(e: NavigateEvent): boolean {
  return (
    !e.canIntercept ||
    e.hashChange ||
    e.downloadRequest != null || // download attr present: filename, or "" for bare `download`
    e.formData != null // POST form submission carries an entry list — let it reach the server
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Framework-agnostic router built on the Navigation API.
 * Generic over the component type `C`; adapters fix `C` (Svelte/React/Vue).
 * State is published as an immutable snapshot (stable reference until it changes).
 */
export class Router<const T extends readonly RouteConfig<C>[], C = unknown> {
  readonly routes: T;
  #options: RouterOptions;
  #snapshot: RouterSnapshot<C>;
  #subs = new Set<(s: RouterSnapshot<C>) => void>();
  #commitAbort: AbortController | null = null;
  #started = false;
  #listener = (e: NavigateEvent) => this.#onNavigate(e);

  constructor(routes: T, options: RouterOptions = {}) {
    this.routes = routes;
    this.#options = options;
    this.#snapshot = {
      components: [],
      params: {},
      url: initialUrl(),
      status: "idle",
      error: null,
    };
  }

  // ─── External-Store Contract ──────────────────────────────────────────────

  subscribe = (fn: (s: RouterSnapshot<C>) => void): Unsubscribe => {
    this.#subs.add(fn);

    return () => {
      this.#subs.delete(fn);
    };
  };

  /** Referentially stable between notifications (changes only inside #emit). */
  getSnapshot = (): RouterSnapshot<C> => this.#snapshot;

  #emit(patch: Partial<RouterSnapshot<C>>): void {
    this.#snapshot = { ...this.#snapshot, ...patch };

    for (const fn of this.#subs) fn(this.#snapshot);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  start(): void {
    if (this.#started || !globalThis.navigation) return;

    this.#started = true;

    navigation.addEventListener("navigate", this.#listener);
    void this.#commit(new URL(location.href), "reload");
  }

  stop(): void {
    if (!this.#started) return;

    this.#started = false;

    this.#commitAbort?.abort();
    globalThis.navigation?.removeEventListener("navigate", this.#listener);
  }

  // ─── Imperative Navigation ────────────────────────────────────────────────

  navigate(
    to: NavTarget<T>,
    opts: { replace?: boolean; state?: unknown } = {},
  ) {
    if (!globalThis.navigation)
      throw new Error(
        "[isorouter] Navigation API unavailable — load a polyfill",
      );

    return this.#navigateRaw(to, opts.replace ?? false, opts.state);
  }

  back(): void {
    globalThis.navigation?.back()?.finished?.catch(NOOP);
  }

  forward(): void {
    globalThis.navigation?.forward()?.finished?.catch(NOOP);
  }

  #navigateRaw(to: string, replace: boolean, state?: unknown, info?: unknown) {
    const result = navigation.navigate(to, {
      history: replace ? "replace" : "push",
      state,
      info,
    });

    result.finished?.catch(NOOP); // swallow AbortError when superseded/cancelled

    return result;
  }

  // ─── Active-Link Helper ───────────────────────────────────────────────────

  isActive(href: string, opts: { exact?: boolean } = {}): boolean {
    const target = normalizePath(
      new URL(href, this.#snapshot.url.origin).pathname,
    );
    const path = normalizePath(this.#snapshot.url.pathname);

    if (opts.exact || target === "/") return path === target;

    return path === target || path.startsWith(target + "/");
  }

  // ─── Interception ─────────────────────────────────────────────────────────

  #onNavigate(e: NavigateEvent): void {
    if (shouldNotIntercept(e)) return;

    const url = new URL(e.destination.url);

    if (url.origin !== location.origin) return;

    e.intercept({
      scroll: this.#options.scroll ?? "after-transition",
      handler: () => this.#commit(url, e.navigationType, e.signal),
    });
  }

  // ─── Commit State Machine ─────────────────────────────────────────────────

  async #commit(
    url: URL,
    navigationType: NavigationKind,
    external?: AbortSignal,
  ): Promise<void> {
    this.#commitAbort?.abort();

    const abortController = new AbortController();
    this.#commitAbort = abortController;

    external?.addEventListener("abort", () => abortController.abort(), {
      once: true,
    });
    this.#emit({ status: "navigating" });

    try {
      const matched = matchRoutes(this.routes, url.pathname);

      if (!matched) {
        this.#emit({
          components: [],
          params: {},
          url,
          status: "not-found",
          error: null,
        });
        return;
      }

      const ctx: GuardContext = {
        params: matched.params,
        url,
        pathname: url.pathname,
        signal: abortController.signal,
        navigationType,
      };

      for (const route of matched.chain) {
        if (!route.beforeLoad) continue;

        const result = await route.beforeLoad(ctx);

        if (abortController.signal.aborted) return;

        if (result === false) {
          this.#navigateRaw(this.#snapshot.url.href, true); // restore
          return;
        }

        if (typeof result === "string") {
          this.#navigateRaw(result, true); // redirect
          return;
        }
      }

      const components = await this.#resolve(matched.chain);
      if (abortController.signal.aborted) return;

      this.#emit({
        components,
        params: matched.params,
        url,
        status: "idle",
        error: null,
      });

      this.#applyTitle(matched.chain, ctx);
      this.#options.onCommit?.(this.#snapshot);
    } catch (err) {
      if (abortController.signal.aborted) return;

      this.#emit({
        components: [],
        params: {},
        url,
        status: "error",
        error: err,
      });
      this.#options.onError?.(err);
    }
  }

  async #resolve(chain: RouteConfig<C>[]): Promise<C[]> {
    const withComponent = chain.filter(
      (r): r is RouteConfig<C> & { component: C | LazyComponent<C> } =>
        r.component != null,
    );

    return Promise.all(
      withComponent.map(async (r) => {
        const comp = r.component;

        if (!isLazy(comp)) return comp;

        comp.resolved ??= (await comp.load()).default;

        return comp.resolved;
      }),
    );
  }

  #applyTitle(chain: RouteConfig<C>[], ctx: GuardContext): void {
    if (typeof document === "undefined") return;

    for (let i = chain.length - 1; i >= 0; i--) {
      const t = chain[i]!.title;

      if (t == null) continue;

      document.title = typeof t === "function" ? t(ctx) : t;

      return;
    }
  }
}

export function createCoreRouter<
  const T extends readonly RouteConfig<C>[],
  C = unknown,
>(routes: T, options?: RouterOptions): Router<T, C> {
  return new Router(routes, options);
}

export type AnyRouter<C = unknown> = Router<readonly RouteConfig<C>[], C>;
