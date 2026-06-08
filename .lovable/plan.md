## Goal

Add Brian's headshot (centered, above the red "📞 866-434-7779" button) plus the label "Brian — RPRx Virtual Advisor" to the Virtual Advisor embed snippet stored in `feature_flags.advisor_embed`.

## Steps

1. **Upload the headshot to the Lovable CDN** (no binary in repo)
   - `lovable-assets create --file /mnt/user-uploads/ChatGPT_Image_Jun_8_2026_01_46_35_PM.png --filename brian-advisor.png > src/assets/brian-advisor.png.asset.json`
   - Capture the resulting `/__l5e/assets-v1/{asset_id}/brian-advisor.png` URL.

2. **Update the `advisor_embed` feature flag** via a Supabase migration that upserts the new HTML into `feature_flags` where `id = 'advisor_embed'`. New snippet (inline styles only, so it works wherever it's pasted):

   ```html
   <div style="text-align:center;font-family:Arial,sans-serif;">
     <img src="https://<project>.lovable.app/__l5e/assets-v1/<asset_id>/brian-advisor.png"
          alt="Brian — RPRx Virtual Advisor"
          style="width:140px;height:140px;border-radius:50%;object-fit:cover;
                 border:4px solid #ffffff;box-shadow:0 4px 14px rgba(0,0,0,0.15);
                 margin:0 auto 12px;display:block;" />
     <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:4px;">Brian</div>
     <div style="font-size:13px;color:#6b7280;margin-bottom:16px;">RPRx Virtual Advisor</div>
     <a href="tel:866-434-7779"
        style="display:inline-block;background-color:#ff0000;color:#ffffff;
               padding:14px 28px;font-size:20px;font-weight:bold;
               text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;">
       📞 866-434-7779
     </a>
   </div>
   ```

   The CDN URL is absolute so the headshot loads identically whether the embed is rendered inside the app or pasted into any external page.

3. **No frontend code changes.** `VirtualAdvisorCard` and `pages/VirtualAdvisor.tsx` already render `feature_flags.advisor_embed` HTML verbatim — they'll pick up the new markup automatically.

4. **Verify**: open `/virtual-advisor` (and the dashboard advisor card) — confirm the round headshot appears centered above the red call button with the name/title underneath.

## Notes

- If you'd later prefer to swap the headshot or change the name/title without a migration, do it from **Admin → Virtual Advisor embed** (the same field this migration writes to).
- The image is stored on the CDN; the repo only gains a small `src/assets/brian-advisor.png.asset.json` pointer file.
