import Image from "next/image";

export function AppBarBrand() {
    return (
        <div
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
        </div>
    );
}