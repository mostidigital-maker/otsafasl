# Project Architecture Rules

- Store public clinic details, including experience years, in `site_settings` so one admin edit updates every public display.- Admin data lists use `useLiveRefresh` (realtime + polling + focus refetch) so changes by other staff appear without a page reload; never attach it to editable settings forms, which it would overwrite.
