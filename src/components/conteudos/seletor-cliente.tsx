"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Escolha do cliente nas telas da agência. Troca o parâmetro ?cliente= da página. */
export function SeletorCliente({ clientes, atual }: { clientes: { id: string; nome: string }[]; atual: string }) {
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor="seletor-cliente" className="text-sm font-medium text-text">
        Cliente
      </label>
      <select
        id="seletor-cliente"
        value={atual}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString());
          p.set("cliente", e.target.value);
          router.push(`${caminho}?${p.toString()}`);
        }}
        className="min-h-11 rounded-md border border-line bg-card px-3 text-base text-text"
      >
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
