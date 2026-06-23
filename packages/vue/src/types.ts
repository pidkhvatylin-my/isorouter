import type { AnyRouter } from "@isorouter/core";
import type { Component } from "vue";

export type VueComponentType = Component;

export type AnyVueRouter = AnyRouter<VueComponentType>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type RegisteredRouter = Register extends {
  router: infer R extends AnyVueRouter;
}
  ? R
  : AnyVueRouter;
