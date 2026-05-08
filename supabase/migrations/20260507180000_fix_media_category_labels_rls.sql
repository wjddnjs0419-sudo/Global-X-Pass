-- FOR ALL 정책을 SELECT와 분리하여 의도를 명확히 함
-- (SELECT는 공개 정책에만 위임, 쓰기는 별도 정책으로 제어)

DROP POLICY IF EXISTS "Only admins can modify media category labels"
  ON public.media_category_labels;

CREATE POLICY "Admins can insert media category labels"
  ON public.media_category_labels FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update media category labels"
  ON public.media_category_labels FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete media category labels"
  ON public.media_category_labels FOR DELETE
  USING (public.is_admin());
