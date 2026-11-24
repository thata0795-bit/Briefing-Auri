/** Entrada da demonstração: e-mail e senha de cada pessoa. Funciona sem JavaScript. */
export function EntradaDemo({ erro }: { erro?: string }) {
  return (
    <form action="/demo/entrar" method="post" className="mt-8 flex flex-col gap-5">
      {erro === "senha" && (
        <p role="alert" className="rounded-md border border-st-fix/40 bg-st-fix/10 px-4 py-3 text-sm text-text">
          E-mail ou senha incorretos. Confira e tente de novo.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-text">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          className="min-h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-text outline-none focus:border-brown"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-medium text-text">Senha</label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-text outline-none focus:border-brown"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-brown bg-brown px-5 text-sm font-medium text-bg hover:bg-brown-dark"
      >
        Entrar
      </button>
      <p className="text-xs text-muted">Cada pessoa recebe o próprio acesso da agência. Quem entra vê só o que é seu.</p>
    </form>
  );
}
