import Image from "next/image";
import Link from "next/link";

export function AppBar() {
  return (
    <nav className="h-16 border-b border-white/5 bg-[#020817]/80 px-6 backdrop-blur-xl">
      <Link
        href="/"
        aria-label="Go to home"
        className="inline-flex h-full items-center transition-opacity hover:opacity-90"
      >
        <Image
          src="/brand-logo/logo-nobg-white.png"
          alt="Plut0x"
          width={200}
          height={40}
          priority
        />
      </Link>
    </nav>
  );
}
