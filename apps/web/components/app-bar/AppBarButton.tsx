import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppBarButtonVariant = "primary" | "success" | "secondary";

interface AppBarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant: AppBarButtonVariant;
}

const variantStyles: Record<
    AppBarButtonVariant,
    { backgroundColor: string; borderColor: string; color: string }
> = {
    primary: {
        backgroundColor: "#111827",
        borderColor: "#111827",
        color: "#ffffff",
    },
    success: {
        backgroundColor: "#047857",
        borderColor: "#111827",
        color: "#ffffff",
    },
    secondary: {
        backgroundColor: "#ffffff",
        borderColor: "#6b7280",
        color: "#111827",
    },
};

export function AppBarButton({ children, disabled, variant, style, ...props }: AppBarButtonProps) {
    const colors = variantStyles[variant];

    return (
        <button
            type="button"
            disabled={disabled}
            {...props}
            style={{
                border: `1px solid ${colors.borderColor}`,
                backgroundColor: colors.backgroundColor,
                color: colors.color,
                borderRadius: "0.5rem",
                padding: "0.5rem 1rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.7 : 1,
                ...style,
            }}
        >
            {children}
        </button>
    );
}