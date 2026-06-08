INSERT INTO public.feature_flags (id, value, enabled, updated_at)
VALUES (
  'advisor_embed',
  '<div style="text-align:center;font-family:Arial,sans-serif;">
  <img src="https://app.rprx4life.com/__l5e/assets-v1/19383274-c5e1-4c47-aa9c-ec3b57eb4fa6/brian-advisor.png" alt="Brian — RPRx Virtual Advisor" style="width:140px;height:140px;border-radius:50%;object-fit:cover;border:4px solid #ffffff;box-shadow:0 4px 14px rgba(0,0,0,0.15);margin:0 auto 12px;display:block;" />
  <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:4px;">Brian</div>
  <div style="font-size:13px;color:#6b7280;margin-bottom:16px;">RPRx Virtual Advisor</div>
  <a href="tel:866-434-7779" style="display:inline-block;background-color:#ff0000;color:#ffffff;padding:14px 28px;font-size:20px;font-weight:bold;text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;">📞 866-434-7779</a>
</div>',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE
  SET value = EXCLUDED.value,
      enabled = true,
      updated_at = now();