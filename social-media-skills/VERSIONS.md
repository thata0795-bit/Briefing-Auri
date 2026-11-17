# Versões

## 1.1.0-pt (17/11/2026)

- Tradução completa para o português do Brasil das 17 skills, das referências, do README, do CONTRIBUTING, das mensagens do validador e dos testes.
- Nomes das skills e das pastas mantidos em inglês para compatibilidade com o plugin original.
- Regra de idioma das skills trocada de inglês britânico para português do Brasil.
- Manifesto de plugin (`.claude-plugin/plugin.json`) e marketplace na raiz do repositório para instalar via `/plugin`.

## 1.1.0 (15/09/2026)

- Suporte explícito ao Codex nas 17 skills públicas existentes, preservando o Claude e os caminhos com Gemini e HTML.
- Correção da descoberta de skills no projeto e preservação de instalações existentes durante a cópia.
- Uso do perfil e das evidências de cada pessoa, com estados corretos de fonte ou provedor ausente e sem coleta de comentários.
- Distinção entre prompts visuais e exportações geradas e inspecionadas.
- Inclusão de `python3 tests/test-codex-portability.py --codex` para verificações isoladas de instalação e de descoberta local ao vivo. Acesso a provedores ao vivo e ativação pela pessoa continuam sendo verificações separadas.

## 1.0.0 (22/04/2026)

Lançamento inicial. 17 skills cobrindo todo o sistema de conteúdo documentado na newsletter MarTech AI.

**Base de voz**
- voice-builder
- newsletter-voice

**LinkedIn**
- profile-optimizer
- post-writer
- graphic-designer
- post-scorer
- post-formatter
- hook-generator
- content-matrix
- niche-research
- gemini-infographic
- gemini-carousel
- quote-post

**Reels do Instagram**
- reels-scripting

**YouTube**
- youtube-thumbnail

**Comunidade**
- pinned-comment

**Analytics**
- analytics-dashboard
