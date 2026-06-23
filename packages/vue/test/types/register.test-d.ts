import { expectTypeOf } from "vitest";
import type { ResolveRegister, Router, NavTarget } from "@isorouter/core";
import type { Component } from "vue";
import type { AnyVueRouter, RegisteredRouter } from "../../src/types";

// ── Concrete router used throughout ──────────────────────────────────────────

type VueComponentType = Component;
type ConcreteRoutes = readonly [
  { readonly path: "/" },
  { readonly path: "/about" },
];
type ConcreteVueRouter = Router<ConcreteRoutes, VueComponentType>;

// ── 1. Fallback: empty Register resolves to AnyVueRouter ─────────────────────
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EmptyRegister {}
expectTypeOf<
  ResolveRegister<EmptyRegister, AnyVueRouter>
>().toEqualTypeOf<AnyVueRouter>();

// ── 2. Narrowing: populated Register resolves to the concrete router ─────────
expectTypeOf<
  ResolveRegister<{ router: ConcreteVueRouter }, AnyVueRouter>
>().toEqualTypeOf<ConcreteVueRouter>();

// ── 3. navigate() is narrowed — invalid paths are rejected ───────────────────
declare const vueRouter: ConcreteVueRouter;
vueRouter.navigate("/");
vueRouter.navigate("/about");
// @ts-expect-error - path not in route config
vueRouter.navigate("/nonexistent");

// ── 4. RegisteredRouter reflects module augmentation ─────────────────────────
declare module "../../src/types" {
  interface Register {
    router: ConcreteVueRouter;
  }
}

expectTypeOf<RegisteredRouter>().toEqualTypeOf<ConcreteVueRouter>();

type NavigateTarget = Parameters<ConcreteVueRouter["navigate"]>[0];
expectTypeOf<NavigateTarget>().toEqualTypeOf<NavTarget<ConcreteRoutes>>();
