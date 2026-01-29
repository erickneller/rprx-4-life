

## Add Vertical Axis Spin Animation to Auth Logo

### Overview
Add a smooth, continuous 3D rotation animation to the RPRx logo on the Auth page using CSS `rotateY()` to create a subtle spinning effect around the vertical axis.

---

## Implementation

### 1. Add Keyframes to `tailwind.config.ts`

Add a new keyframe animation for the Y-axis rotation:

```ts
keyframes: {
  // ... existing keyframes
  "spin-y": {
    "0%": { transform: "rotateY(0deg)" },
    "100%": { transform: "rotateY(360deg)" }
  }
}
```

Add the animation definition:

```ts
animation: {
  // ... existing animations
  "spin-y": "spin-y 4s linear infinite"
}
```

### 2. Update Logo in `src/pages/Auth.tsx`

Apply the animation class and add `perspective` for proper 3D effect:

```tsx
<div className="flex justify-center mb-4" style={{ perspective: '1000px' }}>
  <img 
    src={rprxLogo} 
    alt="RPRx Logo" 
    className="h-24 w-24 object-contain animate-spin-y" 
    style={{ transformStyle: 'preserve-3d' }}
  />
</div>
```

---

## Technical Notes

| Property | Purpose |
|----------|---------|
| `rotateY()` | Rotates element around vertical axis |
| `perspective` | Creates depth for 3D effect (on parent) |
| `transformStyle: preserve-3d` | Ensures children maintain 3D positioning |
| `4s linear infinite` | Smooth, continuous 4-second rotation cycle |

---

## Files to Modify

| File | Change |
|------|--------|
| `tailwind.config.ts` | Add `spin-y` keyframe and animation |
| `src/pages/Auth.tsx` | Apply animation class and 3D perspective to logo |

