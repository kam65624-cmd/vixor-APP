
REVOKE EXECUTE ON FUNCTION public.spend_points(UUID, INT, public.points_reason, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_points(UUID, INT, public.points_reason, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_points(UUID, INT, public.points_reason, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_points(UUID, INT, public.points_reason, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.gen_referral_code() TO service_role;
