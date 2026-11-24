"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { caminhoSeguro } from "@/lib/redirecionamento";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";

type Aba = "cliente" | "equipe";
type Estado = { tipo: "parado" } | { tipo: "enviando" } | { tipo: "enviado"; email: string } | { tipo: "erro"; mensagem: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mensagemDoErro(status?: number) {
  if (status === 429) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  return "";
}

export function FormularioEntrada({ voltar }: { voltar?: string }) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("cliente");
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });

  async function pedirLink(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const email = String(new FormData(evento.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (!EMAIL.test(email)) return setEstado({ tipo: "erro", mensagem: "Confira o e-mail digitado." });
    setEstado({ tipo: "enviando" });
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    const msg = mensagemDoErro(error?.status);
    if (msg) return setEstado({ tipo: "erro", mensagem: msg });
    // Mesmo se o e-mail não existir, a resposta é igual: não revelamos quem é cliente.
    setEstado({ tipo: "enviado", email });
  }

  async function entrarComSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const email = String(dados.get("email") ?? "").trim().toLowerCase();
    const senha = String(dados.get("senha") ?? "");
    if (!EMAIL.test(email) || !senha) return setEstado({ tipo: "erro", mensagem: "Preencha e-mail e senha." });
    setEstado({ tipo: "enviando" });
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      return setEstado({ tipo: "erro", mensagem: mensagemDoErro(error.status) || "E-mail ou senha incorretos." });
    }
    router.replace(caminhoSeguro(voltar));
    router.refresh();
  }

  async function esqueciSenha(email: string) {
    if (!EMAIL.test(email)) return setEstado({ tipo: "erro", mensagem: "Digite seu e-mail para receber o link de nova senha." });
    setEstado({ tipo: "enviando" });
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    const msg = mensagemDoErro(error?.status);
    if (msg) return setEstado({ tipo: "erro", mensagem: msg });
    setEstado({ tipo: "enviado", email });
  }

  if (estado.tipo === "enviado") {
    return (
      <div role="status" className="mt-8 rounded-lg border border-line bg-card p-6">
        <MailCheck aria-hidden className="size-7 text-brown" />
        <p className="mt-3 font-serif text-2xl text-brown-dark">Confira seu e-mail</p>
        <p className="mt-2 text-sm text-muted">
          Se <strong className="text-text">{estado.email}</strong> estiver cadastrado, o link chega em instantes. Ele vale
          por 1 hora. Veja também a caixa de spam.
        </p>
        <Botao variante="texto" className="mt-4 px-0" onClick={() => setEstado({ tipo: "parado" })}>
          Usar outro e-mail
        </Botao>
      </div>
    );
  }

  const enviando = estado.tipo === "enviando";

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Tipo de acesso" className="grid grid-cols-2 border-b border-line">
        {(["cliente", "equipe"] as const).map((a) => (
          <button
            key={a}
            role="tab"
            type="button"
            id={`aba-${a}`}
            aria-selected={aba === a}
            aria-controls={`painel-${a}`}
            onClick={() => {
              setAba(a);
              setEstado({ tipo: "parado" });
            }}
            className={`-mb-px min-h-11 border-b-2 text-sm font-medium transition-colors duration-200 ${
              aba === a ? "border-brown text-brown-dark" : "border-transparent text-muted hover:text-brown"
            }`}
          >
            {a === "cliente" ? "Sou cliente" : "Sou da equipe"}
          </button>
        ))}
      </div>

      {estado.tipo === "erro" && (
        <p role="alert" className="mt-5 text-sm text-danger">
          {estado.mensagem}
        </p>
      )}

      {aba === "cliente" ? (
        <form id="painel-cliente" role="tabpanel" aria-labelledby="aba-cliente" onSubmit={pedirLink} className="mt-6 flex flex-col gap-5" noValidate>
          <Campo
            rotulo="Seu e-mail"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            dica="Enviamos um link de acesso. Você não precisa de senha."
          />
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Receber link de acesso"}
          </Botao>
        </form>
      ) : (
        <form id="painel-equipe" role="tabpanel" aria-labelledby="aba-equipe" onSubmit={entrarComSenha} className="mt-6 flex flex-col gap-5" noValidate>
          <Campo rotulo="E-mail" name="email" type="email" autoComplete="username" inputMode="email" required />
          <Campo rotulo="Senha" name="senha" type="password" autoComplete="current-password" required />
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </Botao>
          <Botao
            type="button"
            variante="texto"
            className="self-start px-0"
            disabled={enviando}
            onClick={(e) => {
              const form = e.currentTarget.form;
              const email = String(new FormData(form ?? undefined).get("email") ?? "").trim().toLowerCase();
              void esqueciSenha(email);
            }}
          >
            Esqueci minha senha
          </Botao>
        </form>
      )}
    </div>
  );
}
