import Image from "next/image";
import Link from "next/link";

export function AppBarBrand() {
    return (
        <Link
            href="/"
            aria-label="Go to home"
            className="inline-flex items-center transition-opacity hover:opacity-90"
            style={{
                fontSize: "2rem",
                fontWeight: 600,
                lineHeight: 1,
                color: "#111827",
            }}
        >
            <Image
                src="/brand-logo/logo-nobg-white.png"
                alt="Plut0x"
                width={200}
                height={40}
            />
        </Link>
    );
}
