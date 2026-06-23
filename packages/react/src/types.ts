import type { Router } from "@isorouter/core";
import type { ComponentType } from "react";

export type ReactComponentType = ComponentType<any>;

export type AnyReactRouter = Router<readonly any[], ReactComponentType>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type RegisteredRouter = Register extends {
  router: infer R extends AnyReactRouter;
}
  ? R
  : AnyReactRouter;
