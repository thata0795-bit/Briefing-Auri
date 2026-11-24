import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";
import { DEMO } from "@/lib/demo/config";
import { criarClienteDemo } from "@/lib/demo/cliente-servidor";

function clienteReal() {
  return createClient(SUPABASE_URL(), SUPABASE_SERVICE_ROLE_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente com a chave de serviço. Ignora o RLS: use só em código de servidor,
 * depois de conferir quem está pedindo, e nunca exponha o resultado sem filtro.
 */
export function criarClienteAdmin(): ReturnType<typeof clienteReal> {
  if (DEMO) return criarClienteDemo(true);
  return clienteReal();
}
