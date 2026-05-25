import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import type { FeatureKey } from '@/lib/upgradeFeatures';

type ButtonProps = ComponentPropsWithoutRef<typeof Button>;

interface LockedButtonProps extends ButtonProps {
  feature: FeatureKey;
  /** Hide the lock icon when locked. */
  hideLockIcon?: boolean;
}

/**
 * Drop-in <Button> replacement that:
 *  - Renders normally when the user has access to `feature`.
 *  - Shows a lock icon + opens the UpgradeModal on click when locked.
 */
export const LockedButton = forwardRef<HTMLButtonElement, LockedButtonProps>(
  ({ feature, hideLockIcon, onClick, children, ...rest }, ref) => {
    const { isLocked, requireUpgrade } = useUpgradeGate();
    const locked = isLocked(feature);

    if (!locked) {
      return (
        <Button ref={ref} onClick={onClick} {...rest}>
          {children}
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        {...rest}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          requireUpgrade({ feature });
        }}
      >
        {!hideLockIcon && <Lock className="h-3.5 w-3.5 mr-2 opacity-80" />}
        {children}
      </Button>
    );
  },
);

LockedButton.displayName = 'LockedButton';
