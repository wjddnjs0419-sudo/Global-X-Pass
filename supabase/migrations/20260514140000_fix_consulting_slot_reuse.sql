ALTER TABLE public.consulting_reservations
  DROP CONSTRAINT IF EXISTS one_reservation_per_slot;

DO $$
DECLARE
  conflicting_group_count integer;
BEGIN
  SELECT count(*)
  INTO conflicting_group_count
  FROM (
    SELECT s.consultant_id, s.slot_date, s.slot_time
    FROM public.consulting_slots s
    LEFT JOIN public.consulting_reservations r
      ON r.slot_id = s.id
     AND r.status NOT IN ('cancelled', 'rejected')
    GROUP BY s.consultant_id, s.slot_date, s.slot_time
    HAVING count(r.id) > 1
  ) conflicting_groups;

  IF conflicting_group_count > 0 THEN
    RAISE EXCEPTION 'cannot deduplicate consulting_slots: % duplicate group(s) have multiple active reservations', conflicting_group_count;
  END IF;
END
$$;

WITH ranked_slots AS (
  SELECT
    s.id,
    s.consultant_id,
    s.slot_date,
    s.slot_time,
    row_number() OVER (
      PARTITION BY s.consultant_id, s.slot_date, s.slot_time
      ORDER BY
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM public.consulting_reservations r
            WHERE r.slot_id = s.id
              AND r.status NOT IN ('cancelled', 'rejected')
          ) THEN 0
          WHEN s.status = 'booked' THEN 1
          ELSE 2
        END,
        s.created_at,
        s.id
    ) AS rank_in_group
  FROM public.consulting_slots s
),
duplicate_slots AS (
  SELECT
    id,
    consultant_id,
    slot_date,
    slot_time
  FROM ranked_slots
  WHERE rank_in_group > 1
),
canonical_slots AS (
  SELECT
    consultant_id,
    slot_date,
    slot_time,
    id AS canonical_slot_id
  FROM ranked_slots
  WHERE rank_in_group = 1
)
UPDATE public.consulting_reservations r
SET slot_id = c.canonical_slot_id
FROM duplicate_slots d
JOIN canonical_slots c
  USING (consultant_id, slot_date, slot_time)
WHERE r.slot_id = d.id;

WITH ranked_slots AS (
  SELECT
    s.id,
    row_number() OVER (
      PARTITION BY s.consultant_id, s.slot_date, s.slot_time
      ORDER BY
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM public.consulting_reservations r
            WHERE r.slot_id = s.id
              AND r.status NOT IN ('cancelled', 'rejected')
          ) THEN 0
          WHEN s.status = 'booked' THEN 1
          ELSE 2
        END,
        s.created_at,
        s.id
    ) AS rank_in_group
  FROM public.consulting_slots s
)
DELETE FROM public.consulting_slots s
USING ranked_slots r
WHERE s.id = r.id
  AND r.rank_in_group > 1;

DROP INDEX IF EXISTS public.unique_active_consulting_reservation_per_slot;
CREATE UNIQUE INDEX unique_active_consulting_reservation_per_slot
  ON public.consulting_reservations (slot_id)
  WHERE status NOT IN ('cancelled', 'rejected');

DROP INDEX IF EXISTS public.unique_consultant_slot_time;
CREATE UNIQUE INDEX unique_consultant_slot_time
  ON public.consulting_slots (consultant_id, slot_date, slot_time);
