import Link from "next/link";

export const metadata = {
  title: "About — Birdy American Mahjong",
  description:
    "Learn about Birdy American Mahjong, a free online platform for playing American Mahjong with friends.",
};

export default function AboutPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-[var(--space-lg)] py-[var(--space-2xl)]"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <article
        className="w-full max-w-2xl rounded-md p-[var(--space-2xl)] flex flex-col items-center gap-[var(--space-xl)]"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <h1
          className="font-bold text-center"
          style={{
            fontSize: "var(--text-3xl)",
            color: "var(--text-primary)",
          }}
        >
          About Birdy American Mahjong
        </h1>

        <p
          className="leading-relaxed text-center"
          style={{
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
          }}
        >
          Birdy American Mahjong is a free online platform for playing American
          Mahjong with friends. No ads, no subscriptions — just the game you
          love, made accessible and welcoming for everyone.
        </p>

        <p
          className="leading-relaxed text-center"
          style={{
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
          }}
        >
          American Mahjong is a beloved tile game played by millions. Our
          platform supports the official NMJL 2025 card and follows standard
          American Mahjong rules.
        </p>

        <p
          className="leading-relaxed text-center"
          style={{
            fontSize: "var(--text-base)",
            color: "var(--text-muted)",
          }}
        >
          Built with care for players of all ages and abilities. Large text,
          clear buttons, and a warm design make it easy to focus on what matters
          — enjoying the game with friends.
        </p>

        <Link
          href="/lobby"
          className="inline-block rounded-md font-semibold text-center no-underline"
          style={{
            backgroundColor: "var(--brand)",
            color: "var(--text-inverse)",
            fontSize: "var(--text-lg)",
            padding: "var(--space-md) var(--space-2xl)",
            minHeight: "var(--touch-min)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Ready to play?
        </Link>
      </article>
    </main>
  );
}
