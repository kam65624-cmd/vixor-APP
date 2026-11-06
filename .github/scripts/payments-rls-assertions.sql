-- Verify authenticated clients can read only their own rows and cannot mutate payment state.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

DO $$
DECLARE
  affected INTEGER;
  visible_rows INTEGER;
BEGIN
  SELECT count(*) INTO visible_rows FROM public.payments;
  IF visible_rows <> 1 THEN
    RAISE EXCEPTION 'RLS read isolation failed: expected one own payment row, got %', visible_rows;
  END IF;

  UPDATE public.payments SET status = 'confirmed' WHERE payload = 'payload-a';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN
    RAISE EXCEPTION 'authenticated role updated a payment row';
  END IF;

  DELETE FROM public.payments WHERE payload = 'payload-a';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN
    RAISE EXCEPTION 'authenticated role deleted a payment row';
  END IF;

  BEGIN
    INSERT INTO public.payments (user_id, payload, amount_stars, pack_id, status)
    VALUES (auth.uid(), 'forged-payload', 1, 'pack-a', 'confirmed');
    RAISE EXCEPTION 'authenticated role inserted a forged payment';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;
RESET ROLE;

SET ROLE service_role;
DO $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.payments SET status = 'confirmed' WHERE payload = 'payload-a';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN
    RAISE EXCEPTION 'service role cannot update payment state';
  END IF;
END $$;
RESET ROLE;
