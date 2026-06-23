---
"@isorouter/core": patch
---

Export `ResolveRegister<Reg, Fallback>` utility type.

This is the conditional type that backs the `Register`/`RegisteredRouter` pattern in all framework adapters. Exporting it from core lets adapters share the same implementation instead of each defining their own copy.

```ts
// Used internally by adapters as:
export type RegisteredRouter = ResolveRegister<Register, AnyReactRouter>;
```
