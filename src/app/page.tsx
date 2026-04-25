import Image from "next/image";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#FDF6EC" }}
    >
      <div
        className="flex items-center justify-center mb-6 px-8 py-6 rounded-2xl"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <Image
          src="/logo-mounas.png"
          alt="Logo Les Mounas"
          width={400}
          height={200}
          className="w-[280px] sm:w-[400px] h-auto"
          priority
        />
      </div>

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
