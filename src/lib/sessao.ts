import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Agencia, Perfil } from "@/lib/tipos";

export type Sessao = {
  userId: string;
  perfil: Perfil;
  agencia: Agencia;
  donoPlataforma: boolean;
};

/** Carrega usuário, perfil e agência. Redireciona para a entrada se faltar algo. */
export const obterSessao = cache(async (): Promise<Sessao> => {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const [{ data: perfil }, { data: dono }] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, agencia_id, papel, funcao, nome, email, ativo")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("plataforma_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  if (!perfil || !perfil.ativo) redirect("/entrar?erro=sem-acesso");

  const { data: agencia } = await supabase
    .from("agencias")
    .select("id, nome, slug, marca, email_contato, telefone")
    .eq("id", perfil.agencia_id)
    .single();
  if (!agencia) redirect("/entrar?erro=sem-acesso");

  return { userId: user.id, perfil: perfil as Perfil, agencia: agencia as Agencia, donoPlataforma: !!dono };
});

/** Garante que o usuário tem um dos papéis aceitos; senão volta para o início. */
export async function exigirPapel(...papeis: Perfil["papel"][]) {
  const sessao = await obterSessao();
  if (!papeis.includes(sessao.perfil.papel)) redirect("/inicio");
  return sessao;
}
