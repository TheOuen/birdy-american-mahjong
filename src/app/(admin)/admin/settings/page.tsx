export default function AdminSettingsPage() {
  return (
    <div>
      <h1
        className="font-semibold mb-2"
        style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}
      >
        Settings
      </h1>
      <p
        className="mb-8"
        style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}
      >
        Configure game defaults and platform behavior.
      </p>

      <div className="flex flex-col gap-8" style={{ maxWidth: '640px' }}>
        {/* Turn Timer Section */}
        <section
          className="rounded-md p-6"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3 mb-1">
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--brand)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 6v6l4 2" />
            </svg>
            <h2
              className="font-semibold"
              style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
            >
              Turn Timer
            </h2>
          </div>
          <p
            className="mb-5 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Set the default time each player has to complete their turn.
          </p>

          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Default Turn Timer (seconds)
            </label>
            <div className="relative">
              <input
                type="number"
                defaultValue={60}
                disabled
                className="w-full rounded-md text-base outline-none cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  padding: '12px 16px',
                  minHeight: 'var(--touch-min)',
                  fontSize: 'var(--text-base)',
                  opacity: 0.7,
                }}
              />
              <span
                className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-medium px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: 'var(--accent-gold)',
                  color: 'var(--text-inverse)',
                }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </section>

        {/* Bot Settings Section */}
        <section
          className="rounded-md p-6"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3 mb-1">
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--brand)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="9" cy="16" r="1.5" fill="var(--brand)" stroke="none" />
              <circle cx="15" cy="16" r="1.5" fill="var(--brand)" stroke="none" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              <path d="M12 3v-1" />
            </svg>
            <h2
              className="font-semibold"
              style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
            >
              Bot Settings
            </h2>
          </div>
          <p
            className="mb-5 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Configure AI bot behavior for backfilling games.
          </p>

          {/* Bot Backfill Toggle */}
          <div className="mb-6">
            <label
              className="flex items-center justify-between"
              style={{ minHeight: 'var(--touch-min)' }}
            >
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Bot Backfill
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Automatically add bots when a game cannot fill with human players.
                </div>
              </div>
              <div className="relative shrink-0 ml-4">
                {/* Custom toggle switch */}
                <div
                  className="relative rounded-full cursor-not-allowed"
                  style={{
                    width: '52px',
                    height: '28px',
                    backgroundColor: 'var(--border-strong)',
                    opacity: 0.7,
                  }}
                >
                  <div
                    className="absolute top-1 left-1 rounded-full transition-transform"
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'var(--bg-elevated)',
                    }}
                  />
                </div>
                <span
                  className="absolute -top-2 -right-2 text-xs font-medium px-1.5 py-0.5 rounded-sm whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--accent-gold)',
                    color: 'var(--text-inverse)',
                    fontSize: '0.625rem',
                  }}
                >
                  Soon
                </span>
              </div>
            </label>
          </div>

          {/* Bot Difficulty */}
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Bot Difficulty
            </label>
            <div className="relative">
              <select
                disabled
                defaultValue="medium"
                className="w-full rounded-md text-base outline-none appearance-none cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  padding: '12px 40px 12px 16px',
                  minHeight: 'var(--touch-min)',
                  fontSize: 'var(--text-base)',
                  opacity: 0.7,
                }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              {/* Dropdown arrow */}
              <svg
                className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span
                className="absolute top-1/2 right-12 -translate-y-1/2 text-xs font-medium px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: 'var(--accent-gold)',
                  color: 'var(--text-inverse)',
                }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div>
          <button
            disabled
            className="inline-flex items-center justify-center rounded-md font-semibold cursor-not-allowed"
            style={{
              backgroundColor: 'var(--brand)',
              color: 'var(--text-inverse)',
              padding: '14px 32px',
              minHeight: 'var(--touch-min)',
              fontSize: 'var(--text-base)',
              opacity: 0.5,
            }}
          >
            Save Settings
          </button>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Settings will be available once the backend is connected.
          </p>
        </div>
      </div>
    </div>
  )
}
