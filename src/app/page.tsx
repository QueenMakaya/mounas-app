export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#FDF6EC" }}
    >
      <h1
        className="text-8xl font-black tracking-tight leading-none mb-4"
        style={{ color: "#1A1A1A", fontFamily: "var(--font-fraunces)" }}
      >
        MOUNAS
      </h1>

      <p
        className="text-lg mb-10 max-w-sm"
        style={{ color: "#1A1A1A", fontFamily: "var(--font-nunito)" }}
      >
        10 minutes par jour pour faire grandir ton enfant
      </p>

      <button
        className="rounded-full px-8 py-4 text-base font-semibold transition-opacity hover:opacity-90 cursor-default"
        style={{
          backgroundColor: "#E63946",
          color: "#FDF6EC",
          fontFamily: "var(--font-nunito)",
        }}
        disabled
      >
        Bientôt disponible
      </button>
    </main>
  );
}
