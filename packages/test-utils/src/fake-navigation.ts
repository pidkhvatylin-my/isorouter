/**
 * Minimal stand-in for `window.navigation`, covering only the surface
 * `Router` touches: a single "navigate" event, `navigate()` /`back()`
 * /`forward()` over an in-memory history stack, and the `NavigateEvent`
 * fields read by `#onNavigate` (`canIntercept`, `hashChange`,
 * `downloadRequest`, `formData`, `destination.url`, `navigationType`,
 * `signal`, `intercept()`).
 */

interface FakeNavigateEventInit {
  destinationUrl: string;
  navigationType: NavigationType;
  signal: AbortSignal;
  canIntercept?: boolean;
  hashChange?: boolean;
  downloadRequest?: string | null;
  formData?: FormData | null;
}

export class FakeNavigateEvent extends Event {
  readonly canIntercept: boolean;
  readonly hashChange: boolean;
  readonly downloadRequest: string | null;
  readonly formData: FormData | null;
  readonly destination: NavigationDestination;
  readonly navigationType: NavigationType;
  readonly signal: AbortSignal;
  #intercepted: NavigationInterceptOptions | null = null;

  constructor(init: FakeNavigateEventInit) {
    super("navigate", { cancelable: true });
    this.canIntercept = init.canIntercept ?? true;
    this.hashChange = init.hashChange ?? false;
    this.downloadRequest = init.downloadRequest ?? null;
    this.formData = init.formData ?? null;
    this.destination = {
      url: init.destinationUrl,
    } as unknown as NavigationDestination;
    this.navigationType = init.navigationType;
    this.signal = init.signal;
  }

  intercept(options: NavigationInterceptOptions = {}): void {
    this.#intercepted = options;
  }

  get intercepted(): NavigationInterceptOptions | null {
    return this.#intercepted;
  }
}

const FAKE_ENTRY = undefined as unknown as NavigationHistoryEntry;
const NOOP = () => undefined;

function resolved(): NavigationResult {
  return {
    committed: Promise.resolve(FAKE_ENTRY),
    finished: Promise.resolve(FAKE_ENTRY),
  };
}

function rejected(): NavigationResult {
  const error = new DOMException(
    "Cannot navigate further",
    "InvalidStateError",
  );
  // Per spec, callers may only consume one of `committed`/`finished`; mark
  // both as handled so the unconsumed one doesn't surface as an unhandled
  // rejection.
  const committed = Promise.reject(error);
  const finished = Promise.reject(error);
  committed.catch(NOOP);
  finished.catch(NOOP);
  return { committed, finished };
}

export class FakeNavigation extends EventTarget {
  #entries: string[];
  #index = 0;

  constructor(url: string) {
    super();
    this.#entries = [url];
  }

  get url(): string {
    return this.#entries[this.#index]!;
  }

  navigate(
    url: string | URL,
    options: NavigationNavigateOptions = {},
  ): NavigationResult {
    const dest = new URL(url, this.url);
    const navigationType: NavigationType =
      options.history === "replace" ? "replace" : "push";
    return this.#go(dest.href, navigationType);
  }

  back(): NavigationResult {
    if (this.#index === 0) return rejected();
    return this.#go(this.#entries[this.#index - 1]!, "traverse", -1);
  }

  forward(): NavigationResult {
    if (this.#index === this.#entries.length - 1) return rejected();
    return this.#go(this.#entries[this.#index + 1]!, "traverse", 1);
  }

  /**
   * Test-only: dispatch a "navigate" event for a browser-driven navigation
   * (link click, hash change, form submit, download, ...) that `Router`
   * never initiates itself, so its `NavigateEvent` fields are supplied
   * directly rather than derived from `navigate()`/`back()`/`forward()`.
   */
  dispatchNavigate(
    init: Partial<FakeNavigateEventInit> = {},
  ): FakeNavigateEvent {
    const ac = new AbortController();
    const event = new FakeNavigateEvent({
      destinationUrl: this.url,
      navigationType: "push",
      signal: ac.signal,
      ...init,
    });
    this.dispatchEvent(event);
    if (event.intercepted) {
      this.#entries = [
        ...this.#entries.slice(0, this.#index + 1),
        event.destination.url,
      ];
      this.#index++;
      void event.intercepted.handler?.();
    }
    return event;
  }

  #go(
    url: string,
    navigationType: NavigationType,
    delta = 0,
  ): NavigationResult {
    const ac = new AbortController();
    const event = new FakeNavigateEvent({
      destinationUrl: url,
      navigationType,
      signal: ac.signal,
    });
    this.dispatchEvent(event);

    const intercepted = event.intercepted;
    if (!intercepted) return resolved();

    if (navigationType === "push") {
      this.#entries = [...this.#entries.slice(0, this.#index + 1), url];
      this.#index++;
    } else if (navigationType === "replace") {
      this.#entries[this.#index] = url;
    } else {
      this.#index += delta;
    }

    // Per spec, `committed` settles as soon as the entry/URL update above
    // commits, independent of `finished` and the intercept handler: it
    // stays fulfilled even if the handler's promise goes on to reject.
    const committed = Promise.resolve(FAKE_ENTRY);
    const finished = Promise.resolve()
      .then(() => intercepted.handler?.())
      .then(() => FAKE_ENTRY);
    return { committed, finished };
  }
}
