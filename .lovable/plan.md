## Problem

The sidebar item the user sees ("Speak with an Advisor") is rendered from the `sidebar_nav_config` DB row `item:advisor_link`, not from the hardcoded Advisor CTA block I edited previously. That row currently has:
- `label`: "Speak with an Advisor"
- `url`: `null` (so clicking goes to `#` — does nothing)
- `icon`: `null`
- `link_type`: `route`

That's why the label and behavior haven't changed.

## Fix

Single migration to update that row:

```sql
update public.sidebar_nav_config
set label = 'Speak With A Virtual Advisor',
    url = '/virtual-advisor',
    icon = 'Mic',
    link_type = 'route',
    updated_at = now()
where id = 'item:advisor_link';
```

That's it — `NavItemRow` already renders DB-driven label/icon/url and uses `NavLink` for `route` type, so it will navigate internally to `/virtual-advisor` and show a microphone icon.

No component code changes needed.