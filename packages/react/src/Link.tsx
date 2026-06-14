import { forwardRef, type AnchorHTMLAttributes } from "react";

import { useRouterInstance } from "./context";
import { useRouterState } from "./hooks";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  activeClassName?: string;
  exact?: boolean;
}

/**
 * Plain <a>. The Navigation API intercepts the click; modifier-clicks,
 * target=_blank and downloads are handled natively, so no extra logic needed.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    className = "",
    activeClassName = "active",
    exact = false,
    children,
    ...rest
  },
  ref,
) {
  const router = useRouterInstance();
  useRouterState(); // re-render on navigation to update active state
  const active = router.isActive(href, { exact });
  const cls = `${className} ${active ? activeClassName : ""}`.trim();
  return (
    <a
      ref={ref}
      href={href}
      className={cls || undefined}
      aria-current={active ? "page" : undefined}
      {...rest}
    >
      {children}
    </a>
  );
});
