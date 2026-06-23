import { forwardRef, type AnchorHTMLAttributes } from "react";

import { useRouterInstance } from "./context";
import { useRouterState } from "./hooks";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  activeClassName?: string;
  exact?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      className = "",
      activeClassName = "active",
      exact = false,
      children,
      ...rest
    },
    ref,
  ) => {
    const router = useRouterInstance();

    useRouterState(); // re-render on navigation to update active state

    const active = router.isActive(href, { exact });
    const classes = `${className} ${active ? activeClassName : ""}`.trim();

    return (
      <a
        ref={ref}
        href={href}
        className={classes || undefined}
        aria-current={active ? "page" : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  },
);

Link.displayName = "Link";
