type OfflineBannerProps = { thing: string }

// Shown when an admin page can't reach the database - the panel stays
// navigable and explains itself instead of crashing.
export function OfflineBanner({ thing }: OfflineBannerProps) {
  return (
    <div
      role="status"
      className="rounded-[var(--radius-lg)] border border-[var(--warning)] bg-[var(--warning-light)] px-5 py-4 text-base text-[var(--text-primary)]"
    >
      Couldn&apos;t load {thing} - the database isn&apos;t reachable right now.
      Connect the Supabase project (and run the migrations) and this page fills in.
    </div>
  )
}
