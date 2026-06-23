import { expectTypeOf } from "vitest";
import type { ResolveRegister, RouteConfig, NavTarget } from "@isorouter/core";
import type {
  AnySvelteRouter,
  RegisteredRouter,
  SvelteComponentType,
} from "../../src/types";
import type { SvelteRouter } from "../../src/reactive.svelte";

// ── Concrete router used throughout ──────────────────────────────────────────

type ConcreteRoutes = readonly [
  RouteConfig<SvelteComponentType> & { readonly path: "/" },
  RouteConfig<SvelteComponentType> & { readonly path: "/about" },
];
type ConcreteSvelteRouter = SvelteRouter<ConcreteRoutes>;

// ── 1. Fallback: empty Register resolves to AnySvelteRouter ──────────────────
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EmptyRegister {}
expectTypeOf<
  ResolveRegister<EmptyRegister, AnySvelteRouter>
>().toEqualTypeOf<AnySvelteRouter>();

// ── 2. Narrowing: populated Register resolves to the concrete router ──────────
expectTypeOf<
  ResolveRegister<{ router: ConcreteSvelteRouter }, AnySvelteRouter>
>().toEqualTypeOf<ConcreteSvelteRouter>();

// ── 3. navigate() is narrowed — invalid paths are rejected ───────────────────
declare const svelteRouter: ConcreteSvelteRouter;
svelteRouter.navigate("/");
svelteRouter.navigate("/about");
// @ts-expect-error - path not in route config
svelteRouter.navigate("/nonexistent");

// ── 4. RegisteredRouter reflects module augmentation ─────────────────────────
declare module "../../src/types" {
  interface Register {
    router: ConcreteSvelteRouter;
  }
}

expectTypeOf<RegisteredRouter>().toEqualTypeOf<ConcreteSvelteRouter>();

type NavigateTarget = Parameters<ConcreteSvelteRouter["navigate"]>[0];
expectTypeOf<NavigateTarget>().toEqualTypeOf<NavTarget<ConcreteRoutes>>();
