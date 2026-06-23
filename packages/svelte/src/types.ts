import type { ResolveRegister, RouteConfig } from "@isorouter/core";
import type { Component } from "svelte";

import type { SvelteRouter } from "./reactive.svelte";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SvelteComponentType = Component<any>;

export type AnySvelteRouter = SvelteRouter<
  readonly RouteConfig<SvelteComponentType>[]
>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type RegisteredRouter = ResolveRegister<Register, AnySvelteRouter>;
