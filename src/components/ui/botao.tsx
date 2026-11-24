import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "texto";

const classes: Record<Variante, string> = {
  primario:
    "bg-brown text-bg hover:bg-brown-dark disabled:opacity-60 border border-brown hover:border-brown-dark",
  secundario: "bg-card text-brown border border-line hover:border-brown disabled:opacity-60",
  texto: "text-brown underline-offset-4 hover:underline disabled:opacity-60",
};

export const Botao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }>(
  function Botao({ variante = "primario", className = "", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed ${classes[variante]} ${className}`}
        {...props}
      />
    );
  },
);
