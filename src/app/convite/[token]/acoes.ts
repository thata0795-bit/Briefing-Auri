"use server";

import { redirect } from "next/navigation";
import { consumirConvite, ErroConvite } from "@/lib/convites";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function aceitarConvite(dados: FormData) {
  const token = String(dados.get("token") ?? "");
  let destino: string;
  try {
    const { tokenHash, papel } = await consumirConvite(token);
    const supabase = await criarClienteServidor();
    await supabase.auth.signOut();
    const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (error) throw error;
    destino = papel === "cliente" ? "/entrada" : "/conta/senha?primeiro=1";
  } catch (e) {
    const msg = e instanceof ErroConvite ? e.message : "Não foi possível abrir o convite. Tente de novo.";
    if (!(e instanceof ErroConvite)) console.error("[convite]", e);
    redirect(`/convite/${encodeURIComponent(token)}?erro=${encodeURIComponent(msg)}`);
  }
  redirect(destino);
}
