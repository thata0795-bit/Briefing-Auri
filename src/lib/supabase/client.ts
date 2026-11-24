"use client";

import { createBrowserClient } from "@supabase/ssr";
import { DEMO } from "@/lib/demo/config";
import { criarClienteNavegadorDemo } from "@/lib/demo/cliente-navegador";

function clienteReal() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function criarClienteNavegador(): ReturnType<typeof clienteReal> {
  if (DEMO) return criarClienteNavegadorDemo();
  return clienteReal();
}
