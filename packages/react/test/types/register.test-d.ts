import { expectTypeOf } from "vitest";
import type { ResolveRegister, Router, NavTarget } from "@isorouter/core";
import type { ComponentType } from "react";
import type { AnyReactRouter, RegisteredRouter } from "../../src/types";

// ── Concrete router used throughout ──────────────────────────────────────────

type ConcreteRoutes = readonly [
  { readonly path: "/" },
  { readonly path: "/about" },
];
type ConcreteRouter = Router<ConcreteRoutes, ComponentType>;

// ── 1. Fallback: empty Register resolves to AnyReactRouter ───────────────────
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EmptyRegister {}
expectTypeOf<
  ResolveRegister<EmptyRegister, AnyReactRouter>
>().toEqualTypeOf<AnyReactRouter>();

// ── 2. Narrowing: populated Register resolves to the concrete router ─────────
expectTypeOf<
  ResolveRegister<{ router: ConcreteRouter }, AnyReactRouter>
>().toEqualTypeOf<ConcreteRouter>();

// ── 3. navigate() is narrowed — invalid paths are rejected ───────────────────
declare const router: ConcreteRouter;
router.navigate("/");
router.navigate("/about");
// @ts-expect-error - path not in route config
router.navigate("/nonexistent");

// ── 4. RegisteredRouter reflects module augmentation ─────────────────────────
declare module "../../src/types" {
  interface Register {
    router: ConcreteRouter;
  }
}

expectTypeOf<RegisteredRouter>().toEqualTypeOf<ConcreteRouter>();

// useNavigate() parameter type matches NavTarget of the augmented router
type NavigateTarget = Parameters<ConcreteRouter["navigate"]>[0];
expectTypeOf<NavigateTarget>().toEqualTypeOf<NavTarget<ConcreteRoutes>>();
