import { NavLink as RouterNavLink, NavLinkProps, useNavigate } from "react-router-dom";
import { forwardRef, useCallback, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { useNavigationBlockerOptional } from "@/contexts/NavigationBlockerContext";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onClick, ...props }, ref) => {
    const blocker = useNavigationBlockerOptional();
    const navigate = useNavigate();

    const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
      // If there's a blocker with dirty state, intercept navigation
      if (blocker) {
        const targetPath = typeof to === 'string' ? to : to.pathname || '/';
        const shouldProceed = blocker.attemptNavigation(targetPath);
        
        if (!shouldProceed) {
          e.preventDefault();
          return;
        }
      }

      // Call original onClick if provided
      onClick?.(e);
    }, [blocker, to, onClick]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onClick={handleClick}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
