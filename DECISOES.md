# Decisões do projeto

Registro das decisões tomadas durante a construção do portal. Cada item diz o que foi decidido, por quê e se ainda depende de aprovação.

## 001. Logo salva a partir da foto enviada
- Arquivo: `public/brand/logo.png` (985 x 917, convertido do JPEG anexado).
- A imagem é uma foto de mockup em parede marrom, não um arquivo vetorial. Serve para a Fase 1, mas o ideal é receber o SVG ou PNG com fundo transparente para a tela de entrada, o menu e o ícone da aba.
- Status: provisório até chegar o arquivo original.

## 002. Pasta /referencia ausente
- O repositório tem só `Briefing Auri .html` (briefing de 5 seções da Auri Studio, paleta oliva). Os quatro protótipos citados no prompt, incluindo `portal-agencia-sistema-completo.html`, não foram enviados.
- Status: aguardando os arquivos. Sem eles, o briefing de 10 seções será montado a partir das 5 seções existentes mais as seções descritas no prompt.

## 003. Produto vendável para outras agências (multi-agência)
- Proposta: o sistema nasce como plataforma com várias agências (tenants). Toda tabela ganha `agencia_id` além de `cliente_id`, e o RLS isola agência de agência antes de isolar cliente de cliente.
- Marca por agência: logo, cores (os tokens da seção 2 viram o tema padrão), remetente de e-mail, chaves do Asaas e da ferramenta de assinatura guardadas por agência, criptografadas.
- Perfis: surge um quarto nível, dono da plataforma, acima do admin de cada agência.
- Status: aguardando aprovação antes da Fase 1, porque mudar isso depois exige migrar todo o banco.
