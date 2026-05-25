INSERT INTO public.feature_flags (id, enabled, value, updated_at)
VALUES (
  'billing_card',
  true,
  '{"title":"Billing & Subscription","description":"Manage your RPRx plan.","upgradeLabel":"Upgrade Plan","changeLabel":"Change Plan","supportLabel":"Manage via Support","supportEmail":"support@rprx4life.com","footerNote":"To cancel or change payment method, email {email}."}',
  now()
)
ON CONFLICT (id) DO NOTHING;