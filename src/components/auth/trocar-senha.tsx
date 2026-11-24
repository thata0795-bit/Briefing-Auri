"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";

export function senhaValida(senha: string) {
  return senha.length >= 10 && /[a-zA-Z]/.test(senha) && /\d/.test(senha);
}

export function TrocarSenha({ destino }: { destino?: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<{ erro?: string; ok?: boolean; enviando?: boolean }>({});

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const dados = new FormData(form);
    const senha = String(dados.get("senha") ?? "");
    const repetir = String(dados.get("repetir") ?? "");
    if (!senhaValida(senha)) return setEstado({ erro: "A senha precisa de 10 caracteres ou mais, com letras e números." });
    if (senha !== repetir) return setEstado({ erro: "As duas senhas não são iguais." });
    setEstado({ enviando: true });
    const { error } = await criarClienteNavegador().auth.updateUser({ password: senha });
    if (error) {
      return setEstado({
        erro: error.code === "same_password" ? "A nova senha precisa ser diferente da atual." : "Não foi possível salvar. Tente de novo.",
      });
    }
    form.reset();
    setEstado({ ok: true });
    if (destino) {
      router.replace(destino);
      router.refresh();
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-5" noValidate>
      <Campo rotulo="Nova senha" name="senha" type="password" autoComplete="new-password" dica="Pelo menos 10 caracteres, com letras e números." />
      <Campo rotulo="Repita a nova senha" name="repetir" type="password" autoComplete="new-password" erro={estado.erro} />
      {estado.ok && (
        <p role="status" className="text-sm text-success">
          Senha atualizada.
        </p>
      )}
      <Botao type="submit" disabled={estado.enviando} className="self-start">
        {estado.enviando ? "Salvando..." : "Salvar senha"}
      </Botao>
    </form>
  );
}
