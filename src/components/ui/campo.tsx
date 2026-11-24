import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { rotulo: string; dica?: string; erro?: string };

export const Campo = forwardRef<HTMLInputElement, Props>(function Campo({ rotulo, dica, erro, id, className = "", ...props }, ref) {
  const campoId = id ?? props.name;
  const dicaId = dica ? `${campoId}-dica` : undefined;
  const erroId = erro ? `${campoId}-erro` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={campoId} className="text-sm font-medium text-text">
        {rotulo}
      </label>
      {dica && (
        <p id={dicaId} className="text-xs text-muted">
          {dica}
        </p>
      )}
      <input
        ref={ref}
        id={campoId}
        aria-invalid={!!erro}
        aria-describedby={[dicaId, erroId].filter(Boolean).join(" ") || undefined}
        className={`min-h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-text outline-none transition-colors duration-200 placeholder:text-muted-soft focus:border-brown ${className}`}
        {...props}
      />
      {erro && (
        <p id={erroId} className="text-sm text-danger">
          {erro}
        </p>
      )}
    </div>
  );
});
