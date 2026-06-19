/**
 * Stress / fuzz suite for the SPA matcher.
 *
 * Goal (per the Navigation API contract): the matcher is fed `url.pathname`
 * straight from the engine on every navigation. `URL` parsing does NOT validate
 * percent-encoding, normalize away `//`, strip control characters, or reject
 * astral/RTL/zero-width code points — all of that survives into `pathname`. So
 * the matcher must, for *any* string:
 *   1. terminate (never spin in an infinite loop), and
 *   2. return either `null` or a well-formed `RouteMatch` (never crash).
 *
 * The route table mirrors a realistic `as const` config: static, index, param,
 * nested, splat, and a root catch-all so hostile input has somewhere to land.
 */

import { describe, expect, it } from "vitest";
import { matchRoutes } from "../../../src/matcher";
import type { RouteConfig } from "../../../src/types";

const routes = [
  { path: "/", component: "home" },
  { path: "about", component: "about" },
  {
    path: "users",
    component: "usersLayout",
    children: [
      { index: true, component: "userList" },
      { path: ":id", component: "userDetail" },
    ],
  },
  { path: "files/*", component: "files" },
  { path: "*", component: "notFound" },
] as const satisfies readonly RouteConfig<string>[];

/** A result is well-formed when it is `null` or a non-empty chain + params object. */
function assertWellFormed(result: ReturnType<typeof matchRoutes>): void {
  if (result === null) return;
  expect(Array.isArray(result.chain)).toBe(true);
  expect(result.chain.length).toBeGreaterThan(0);
  expect(result.params).toBeTypeOf("object");
  expect(result.params).not.toBeNull();
}

/**
 * Inputs the matcher must survive without throwing. Each is a real-world way a
 * pathname turns adversarial: unicode/normalization, control & bidi code points,
 * XSS/template-injection literals, slash abuse, query/hash residue treated as
 * literal text, path-traversal sequences, and pathological size.
 */
const SAFE_PATHS: readonly (readonly [name: string, path: string])[] = [
  // --- Unicode, normalization & control characters ---
  ["NFC composed (café)", "/café"],
  ["NFD decomposed (cafe + combining acute)", "/café"],
  ["astral / surrogate pair (emoji)", "/😀"],
  ["percent-encoded emoji", "/%F0%9F%98%80"],
  ["percent-encoded snowman", "/%E2%98%83"],
  ["right-to-left override", "/‮evil"],
  ["zero-width space inside segment", "/a​b"],
  ["literal NUL code point", "/ "],
  ["percent-encoded NUL", "/%00"],
  ["ligature (fi)", "/ﬁle"],

  // --- XSS / injection literals (must be inert text, never executed) ---
  ["raw <script> tag", "/<script>alert(1)</script>"],
  ["encoded <script> tag", "/%3Cscript%3Ealert(1)%3C%2Fscript%3E"],
  ["javascript: pseudo-scheme", "/javascript:alert(document.cookie)"],
  ["img onerror breakout", '/"><img src=x onerror=alert(1)>'],
  ["svg onload breakout", "/'><svg/onload=alert(1)>"],
  ["__proto__ as param value", "/users/__proto__"],
  ["constructor as param value", "/users/constructor"],
  ["template-literal injection", "/${alert(1)}"],

  // --- Slash abuse, empties & trailing slashes ---
  ["empty string", ""],
  ["bare root", "/"],
  ["double slash", "//"],
  ["triple slash", "///"],
  ["empty interior segment", "/a//b"],
  ["slashes everywhere", "///a///b///"],
  ["many trailing slashes", "/a/b/////"],
  ["whitespace-only", "   "],

  // --- Query / hash residue (matcher must treat as literal, not parse) ---
  ["open-redirect-ish query", "/users/42?redirect=//evil.com"],
  ["hash fragment", "/path#section"],
  ["query + hash with slashes", "/a?b=c&d=e#f/g/h"],
  ["matrix parameter", "/users/42;jsessionid=abc123"],

  // --- Path traversal & encoded slashes (matched literally, never resolved) ---
  ["encoded double-slash param", "/users/%2F%2Fadmin"],
  ["encoded traversal in splat", "/files/..%2f..%2f..%2fetc%2fpasswd"],
  ["literal traversal in splat", "/files/../../../etc/passwd"],
  ["mixed encoded dot-segments", "/users/.%2e/.%2e/admin"],

  // --- Pathological size / depth (must stay fast, never hang) ---
  ["1k repeated segments", "/" + "a/".repeat(1000)],
  ["10k repeated segments", "/" + "seg/".repeat(10000)],
  ["100k-char single segment", "/" + "x".repeat(100000)],
  ["10k astral chars in a param", "/users/" + "💀".repeat(10000)],

  // --- Malformed percent-encoding (decoded leniently, never throws) ---
  // `decodeURIComponent` would raise URIError on these; the matcher guards it
  // and falls back to the raw segment, so matching still resolves. See the
  // `safeDecode` helper in matcher.ts.
  ["lone percent", "/%"],
  ["bad hex digits", "/%zz"],
  ["truncated escape", "/%2"],
  ["non-hex after percent", "/%G0"],
  ["overlong UTF-8", "/%C0%80"],
  ["truncated multibyte UTF-8", "/%E0%A4%A"],
  ["lone UTF-16 surrogate", "/%ED%A0%80"],
  ["invalid lead byte 0xFF", "/%FF"],
  ["malformed % in param position", "/users/%"],
  ["malformed % in splat position", "/files/a/%/b"],
  ["malformed % in query residue", "/search?q=%"],
  ["malformed % in hash residue", "/x#%"],
];

describe("matcher stress test", () => {
  describe("never crashes and returns a well-formed result on hostile input", () => {
    it.each(SAFE_PATHS)("survives: %s", (_name, path) => {
      let result: ReturnType<typeof matchRoutes> = null;
      expect(() => {
        result = matchRoutes(routes, path);
      }).not.toThrow();
      assertWellFormed(result);
    });
  });

  describe("terminates promptly on pathological input (no infinite loop)", () => {
    // Recursion is bounded by the (finite) route tree and path segments only
    // shrink, so a hang would signal a real regression. A generous wall-clock
    // budget catches accidental O(n²) blowups without being flaky.
    it.each(SAFE_PATHS.filter(([n]) => /repeated|char|astral/.test(n)))(
      "completes fast: %s",
      (_name, path) => {
        const start = performance.now();
        matchRoutes(routes, path);
        expect(performance.now() - start).toBeLessThan(1000);
      },
    );
  });
});
