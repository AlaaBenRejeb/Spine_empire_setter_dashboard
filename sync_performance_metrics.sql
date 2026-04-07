-- ================================================================
-- Spine Empire: Canonical Performance Sync Trigger
-- Version: 2.0 | 2026-04-07
--
-- Canonical source for all repos:
--   spine-empire-admin-ops/sync_performance_metrics.sql
--
-- FULL_CONTEXT.md alignment:
--   Setter efficiency: bookings / total leads
--   Setter power: (conversion_rate * 0.7) + (volume_factor * 0.3)
--     volume_factor = min(bookings / 10, 1)
--   Closer efficiency: wins / total demos
--   Closer power: (win_rate * 0.8) + (win_factor * 0.2)
--     win_factor = min(wins / 5, 1)
--
-- Canonical status contract:
--   new, called, contacted, booked, closed_won, closed_lost,
--   active_client, won, lost, followup, noshow, ignored
-- ================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.recalculate_setter_metrics(p_setter_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_leads   INT := 0;
  v_bookings      INT := 0;
  v_revenue       NUMERIC := 0;
  v_conv_rate     NUMERIC := 0;
  v_power_score   INT := 0;
BEGIN
  IF p_setter_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (
      WHERE status IN ('booked', 'won', 'lost', 'followup', 'noshow', 'closed_won', 'closed_lost', 'active_client')
    ),
    COALESCE(
      SUM(
        CASE
          WHEN status IN ('won', 'closed_won', 'active_client')
          THEN COALESCE((metadata->>'deal_value')::NUMERIC, 6500)
          ELSE 0
        END
      ),
      0
    )
  INTO v_total_leads, v_bookings, v_revenue
  FROM public.leads
  WHERE setter_id = p_setter_id;

  v_conv_rate := CASE
    WHEN v_total_leads > 0 THEN ROUND((v_bookings::NUMERIC / v_total_leads) * 100, 1)
    ELSE 0
  END;

  v_power_score := LEAST(
    ROUND(
      (v_conv_rate * 0.7)
      + (LEAST(v_bookings::NUMERIC / 10, 1.0) * 100 * 0.3)
    )::INT,
    100
  );

  INSERT INTO public.performance_metrics (
    profile_id,
    role,
    period,
    bookings,
    wins,
    win_rate,
    revenue,
    power_score,
    synced_at
  )
  VALUES (
    p_setter_id,
    'setter',
    'current',
    v_bookings,
    0,
    v_conv_rate,
    v_revenue,
    v_power_score,
    NOW()
  )
  ON CONFLICT ON CONSTRAINT profile_period_unique
  DO UPDATE SET
    role = 'setter',
    bookings = EXCLUDED.bookings,
    wins = 0,
    win_rate = EXCLUDED.win_rate,
    revenue = EXCLUDED.revenue,
    power_score = EXCLUDED.power_score,
    synced_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_closer_metrics(p_closer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_demos   INT := 0;
  v_wins          INT := 0;
  v_revenue       NUMERIC := 0;
  v_win_rate      NUMERIC := 0;
  v_power_score   INT := 0;
BEGIN
  IF p_closer_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*) FILTER (
      WHERE status IN ('won', 'lost', 'noshow', 'closed_won', 'closed_lost', 'active_client')
    ),
    COUNT(*) FILTER (
      WHERE status IN ('won', 'closed_won', 'active_client')
    ),
    COALESCE(
      SUM(
        CASE
          WHEN status IN ('won', 'closed_won', 'active_client')
          THEN COALESCE((metadata->>'deal_value')::NUMERIC, 6500)
          ELSE 0
        END
      ),
      0
    )
  INTO v_total_demos, v_wins, v_revenue
  FROM public.leads
  WHERE closer_id = p_closer_id;

  v_win_rate := CASE
    WHEN v_total_demos > 0 THEN ROUND((v_wins::NUMERIC / v_total_demos) * 100, 1)
    ELSE 0
  END;

  v_power_score := LEAST(
    ROUND(
      (v_win_rate * 0.8)
      + (LEAST(v_wins::NUMERIC / 5, 1.0) * 100 * 0.2)
    )::INT,
    100
  );

  INSERT INTO public.performance_metrics (
    profile_id,
    role,
    period,
    bookings,
    wins,
    win_rate,
    revenue,
    power_score,
    synced_at
  )
  VALUES (
    p_closer_id,
    'closer',
    'current',
    v_total_demos,
    v_wins,
    v_win_rate,
    v_revenue,
    v_power_score,
    NOW()
  )
  ON CONFLICT ON CONSTRAINT profile_period_unique
  DO UPDATE SET
    role = 'closer',
    bookings = EXCLUDED.bookings,
    wins = EXCLUDED.wins,
    win_rate = EXCLUDED.win_rate,
    revenue = EXCLUDED.revenue,
    power_score = EXCLUDED.power_score,
    synced_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_performance_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.recalculate_setter_metrics(NEW.setter_id);
    PERFORM public.recalculate_closer_metrics(NEW.closer_id);

    IF TG_OP = 'UPDATE' THEN
      IF OLD.setter_id IS DISTINCT FROM NEW.setter_id THEN
        PERFORM public.recalculate_setter_metrics(OLD.setter_id);
      END IF;

      IF OLD.closer_id IS DISTINCT FROM NEW.closer_id THEN
        PERFORM public.recalculate_closer_metrics(OLD.closer_id);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_setter_metrics(OLD.setter_id);
    PERFORM public.recalculate_closer_metrics(OLD.closer_id);
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_performance_metrics ON public.leads;

CREATE TRIGGER trg_sync_performance_metrics
AFTER INSERT OR UPDATE OF status, setter_id, closer_id, metadata OR DELETE
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.sync_performance_metrics();

-- Backfill canonical metrics from current lead state
DELETE FROM public.performance_metrics
WHERE period = 'current'
  AND role IN ('setter', 'closer');

INSERT INTO public.performance_metrics (
  profile_id,
  role,
  period,
  bookings,
  wins,
  win_rate,
  revenue,
  power_score,
  synced_at
)
SELECT
  setter_id AS profile_id,
  'setter' AS role,
  'current' AS period,
  COUNT(*) FILTER (
    WHERE status IN ('booked', 'won', 'lost', 'followup', 'noshow', 'closed_won', 'closed_lost', 'active_client')
  ) AS bookings,
  0 AS wins,
  CASE
    WHEN COUNT(*) > 0 THEN ROUND((
      COUNT(*) FILTER (
        WHERE status IN ('booked', 'won', 'lost', 'followup', 'noshow', 'closed_won', 'closed_lost', 'active_client')
      )::NUMERIC / COUNT(*)
    ) * 100, 1)
    ELSE 0
  END AS win_rate,
  COALESCE(
    SUM(
      CASE
        WHEN status IN ('won', 'closed_won', 'active_client')
        THEN COALESCE((metadata->>'deal_value')::NUMERIC, 6500)
        ELSE 0
      END
    ),
    0
  ) AS revenue,
  LEAST(
    ROUND(
      (
        CASE
          WHEN COUNT(*) > 0 THEN (
            COUNT(*) FILTER (
              WHERE status IN ('booked', 'won', 'lost', 'followup', 'noshow', 'closed_won', 'closed_lost', 'active_client')
            )::NUMERIC / COUNT(*)
          ) * 100
          ELSE 0
        END * 0.7
      )
      + (
        LEAST(
          COUNT(*) FILTER (
            WHERE status IN ('booked', 'won', 'lost', 'followup', 'noshow', 'closed_won', 'closed_lost', 'active_client')
          )::NUMERIC / 10,
          1.0
        ) * 100 * 0.3
      )
    )::INT,
    100
  ) AS power_score,
  NOW() AS synced_at
FROM public.leads
WHERE setter_id IS NOT NULL
GROUP BY setter_id
ON CONFLICT ON CONSTRAINT profile_period_unique
DO UPDATE SET
  role = 'setter',
  bookings = EXCLUDED.bookings,
  wins = 0,
  win_rate = EXCLUDED.win_rate,
  revenue = EXCLUDED.revenue,
  power_score = EXCLUDED.power_score,
  synced_at = NOW();

INSERT INTO public.performance_metrics (
  profile_id,
  role,
  period,
  bookings,
  wins,
  win_rate,
  revenue,
  power_score,
  synced_at
)
SELECT
  closer_id AS profile_id,
  'closer' AS role,
  'current' AS period,
  COUNT(*) FILTER (
    WHERE status IN ('won', 'lost', 'noshow', 'closed_won', 'closed_lost', 'active_client')
  ) AS bookings,
  COUNT(*) FILTER (
    WHERE status IN ('won', 'closed_won', 'active_client')
  ) AS wins,
  CASE
    WHEN COUNT(*) FILTER (
      WHERE status IN ('won', 'lost', 'noshow', 'closed_won', 'closed_lost', 'active_client')
    ) > 0
    THEN ROUND((
      COUNT(*) FILTER (
        WHERE status IN ('won', 'closed_won', 'active_client')
      )::NUMERIC
      /
      COUNT(*) FILTER (
        WHERE status IN ('won', 'lost', 'noshow', 'closed_won', 'closed_lost', 'active_client')
      )
    ) * 100, 1)
    ELSE 0
  END AS win_rate,
  COALESCE(
    SUM(
      CASE
        WHEN status IN ('won', 'closed_won', 'active_client')
        THEN COALESCE((metadata->>'deal_value')::NUMERIC, 6500)
        ELSE 0
      END
    ),
    0
  ) AS revenue,
  LEAST(
    ROUND(
      (
        CASE
          WHEN COUNT(*) FILTER (
            WHERE status IN ('won', 'lost', 'noshow', 'closed_won', 'closed_lost', 'active_client')
          ) > 0
          THEN (
            COUNT(*) FILTER (
              WHERE status IN ('won', 'closed_won', 'active_client')
            )::NUMERIC
            /
            COUNT(*) FILTER (
              WHERE status IN ('won', 'lost', 'noshow', 'closed_won', 'closed_lost', 'active_client')
            )
          ) * 100
          ELSE 0
        END * 0.8
      )
      + (
        LEAST(
          COUNT(*) FILTER (
            WHERE status IN ('won', 'closed_won', 'active_client')
          )::NUMERIC / 5,
          1.0
        ) * 100 * 0.2
      )
    )::INT,
    100
  ) AS power_score,
  NOW() AS synced_at
FROM public.leads
WHERE closer_id IS NOT NULL
GROUP BY closer_id
ON CONFLICT ON CONSTRAINT profile_period_unique
DO UPDATE SET
  role = 'closer',
  bookings = EXCLUDED.bookings,
  wins = EXCLUDED.wins,
  win_rate = EXCLUDED.win_rate,
  revenue = EXCLUDED.revenue,
  power_score = EXCLUDED.power_score,
  synced_at = NOW();

COMMIT;
