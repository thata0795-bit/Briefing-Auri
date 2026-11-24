import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";
import { DEMO } from "@/lib/demo/config";
import { criarClienteDemo } from "@/lib/demo/cliente-servidor";

async function clienteReal() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: o middleware já renova a sessão.
        }
      },
    },
  });
}

/** Cliente do Supabase com a sessão do usuário. Sempre sujeito ao RLS. */
export async function criarClienteServidor(): ReturnType<typeof clienteReal> {
  if (DEMO) return criarClienteDemo(false);
  return clienteReal();
}
