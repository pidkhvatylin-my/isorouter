import { createSubscriber } from "svelte/reactivity";

import { Router } from "@isorouter/core";

import type { Component } from "svelte";
import type {
  NavTarget,
  RouteConfig,
  RouterOptions,
  RouterSnapshot,
} from "@isorouter/core";

export type SvelteComponentType = Component<any>;

/**
 * Svelte 5 wrapper. Bridges the core's PubSub snapshot into runes via
 * `createSubscriber`: the subscription is active only while `current` is read
 * in a reactive context, and is torn down automatically — no `$effect`, no leak.
 */
export class SvelteRouter<
  const T extends readonly RouteConfig<SvelteComponentType>[],
> {
  #core: Router<T, SvelteComponentType>;
  #track: () => void;

  constructor(routes: T, options?: RouterOptions) {
    this.#core = new Router<T, SvelteComponentType>(routes, options);
    this.#track = createSubscriber((update) =>
      this.#core.subscribe(() => update()),
    );
  }

  get current(): RouterSnapshot<SvelteComponentType> {
    this.#track();
    return this.#core.getSnapshot();
  }

  navigate(to: NavTarget<T>, opts?: { replace?: boolean; state?: unknown }) {
    return this.#core.navigate(to, opts);
  }
  back(): void {
    this.#core.back();
  }
  forward(): void {
    this.#core.forward();
  }
  isActive(href: string, opts?: { exact?: boolean }): boolean {
    void this.current; // establish the createSubscriber dependency
    return this.#core.isActive(href, opts);
  }
  start(): void {
    this.#core.start();
  }
  stop(): void {
    this.#core.stop();
  }
}

export function createRouter<
  const T extends readonly RouteConfig<SvelteComponentType>[],
>(routes: T, options?: RouterOptions): SvelteRouter<T> {
  return new SvelteRouter(routes, options);
}

export type AnySvelteRouter = SvelteRouter<
  readonly RouteConfig<SvelteComponentType>[]
>;
