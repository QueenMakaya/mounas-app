import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#FDF6EC" }}
    >
      <Image
        src="/logo-mounas.png"
        alt="Logo Les Mounas"
        width={400}
        height={400}
        style={{ mixBlendMode: "multiply", height: "auto" }}
        className="w-[280px] sm:w-[400px] mb-6"
        priority
      />

      <p
        className="text-lg mb-10 max-w-sm"
        style={{ color: "#1A1A1A", fontFamily: "var(--font-nunito)" }}
      >
        10 minutes par jour pour faire grandir ton enfant
      </p>

      <Link
        href="/activity"
        className="rounded-full px-8 py-4 text-base font-semibold transition-colors duration-200 bg-[#E63946] hover:bg-[#c1121f]"
        style={{
          color: "#FDF6EC",
          fontFamily: "var(--font-nunito)",
        }}
      >
        Voir l'activité du jour →
      </Link>

      <p className="mt-4 text-sm" style={{ color: "#5F5E5A" }}>
        10 minutes de qualité · en français + culture afro
      </p>
    </main>
  );
}
