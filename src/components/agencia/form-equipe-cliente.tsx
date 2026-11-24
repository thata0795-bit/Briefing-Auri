import { atualizarEquipeDoCliente } from "@/app/(painel)/clientes/acoes";
import { BotaoEnviar } from "@/components/ui/botao-enviar";

export function FormEquipeCliente({
  clienteId,
  pessoas,
  responsavelId,
  equipe,
}: {
  clienteId: string;
  pessoas: { id: string; nome: string; papel: string }[];
  responsavelId: string | null;
  equipe: string[];
}) {
  return (
    <form action={atualizarEquipeDoCliente} className="flex flex-col gap-5">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <div className="flex max-w-sm flex-col gap-1.5">
        <label htmlFor="responsavel_id" className="text-sm font-medium text-text">
          Responsável
        </label>
        <select id="responsavel_id" name="responsavel_id" defaultValue={responsavelId ?? ""} className="min-h-11 rounded-md border border-line bg-bg px-3 text-base">
          <option value="">Sem responsável</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text">Equipe atribuída</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {pessoas
            .filter((p) => p.papel === "equipe")
            .map((p) => (
              <label key={p.id} className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-bg px-3 text-sm">
                <input type="checkbox" name="equipe" value={p.id} defaultChecked={equipe.includes(p.id)} className="size-5 accent-brown" />
                {p.nome}
              </label>
            ))}
        </div>
      </fieldset>
      <BotaoEnviar variante="secundario" className="self-start">
        Salvar equipe
      </BotaoEnviar>
    </form>
  );
}
