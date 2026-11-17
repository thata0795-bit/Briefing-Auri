#!/usr/bin/env bash
# Valida cada skill em skills/ contra a especificação de Agent Skills.
# Confere: frontmatter YAML, campos obrigatórios, nome igual ao da pasta, tamanho da descrição,
# tamanho do arquivo e estrutura padrão de pastas.

set -u

SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills"
PASS=0
WARN=0
FAIL=0
SKILL_COUNT=0

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

err()  { printf "  ${RED}x${NC} %s\n" "$1"; FAIL=$((FAIL+1)); }
warn() { printf "  ${YELLOW}!${NC} %s\n" "$1"; WARN=$((WARN+1)); }
ok()   { printf "  ${GREEN}v${NC} %s\n" "$1"; PASS=$((PASS+1)); }

printf "${CYAN}Validando skills em %s${NC}\n\n" "$SKILLS_DIR"

if [[ ! -d "$SKILLS_DIR" ]]; then
  printf "${RED}Pasta skills/ não encontrada.${NC}\n"
  exit 1
fi

for skill_dir in "$SKILLS_DIR"/*/; do
  [[ -d "$skill_dir" ]] || continue
  SKILL_COUNT=$((SKILL_COUNT+1))
  skill_name="$(basename "$skill_dir")"
  skill_md="${skill_dir}SKILL.md"

  printf "${CYAN}%s${NC}\n" "$skill_name"

  # SKILL.md existe
  if [[ ! -f "$skill_md" ]]; then
    err "SKILL.md ausente"
    continue
  fi

  # Formato do nome da pasta
  if [[ ! "$skill_name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    err "o nome da pasta deve ter apenas letras minúsculas, números e hífens"
  else
    ok "nome da pasta válido"
  fi

  # Frontmatter presente
  first_line="$(head -n1 "$skill_md")"
  if [[ "$first_line" != "---" ]]; then
    err "SKILL.md deve começar com frontmatter YAML (---)"
    continue
  fi

  # Extrai o frontmatter (entre os dois primeiros delimitadores ---)
  frontmatter="$(awk '/^---[[:space:]]*$/{n++; next} n==1{print} n==2{exit}' "$skill_md")"

  # campo name
  yaml_name="$(printf "%s" "$frontmatter" | awk -F': ' '/^name:/{print $2; exit}' | tr -d '"' | tr -d "'" | tr -d '[:space:]')"
  if [[ -z "$yaml_name" ]]; then
    err "campo name ausente no frontmatter"
  elif [[ "$yaml_name" != "$skill_name" ]]; then
    err "name '$yaml_name' não corresponde à pasta '$skill_name'"
  else
    ok "name corresponde à pasta"
  fi

  if [[ ${#yaml_name} -gt 64 ]]; then
    err "name passa de 64 caracteres"
  fi

  # campo description: analisa apenas o frontmatter já extraído (não o corpo)
  desc_block="$(printf "%s\n" "$frontmatter" | awk '
    BEGIN{in_desc=0}
    /^description:/{
      sub(/^description:[ \t]*/, "")
      if ($0 ~ /^>/ || $0 ~ /^\|/) { in_desc=1; next }
      print; exit
    }
    in_desc==1 {
      if ($0 ~ /^[a-zA-Z_-]+:/) exit
      sub(/^[ \t]+/, "")
      printf "%s ", $0
    }
  ')"

  desc_len=${#desc_block}
  if [[ $desc_len -eq 0 ]]; then
    err "campo description ausente ou vazio"
  elif [[ $desc_len -gt 1024 ]]; then
    warn "description tem $desc_len caracteres, considere reduzir para menos de 1024"
  else
    ok "description presente ($desc_len caracteres)"
  fi

  # Dica de frase de acionamento
  if [[ "$desc_block" == *"when"* || "$desc_block" == *"quando"* || "$desc_block" == *"Use"* || "$desc_block" == *"use"* ]]; then
    ok "description tem frases de acionamento"
  else
    warn "description deve incluir frases de acionamento com 'use' ou 'quando'"
  fi

  # Tamanho do arquivo
  line_count=$(wc -l < "$skill_md" | tr -d '[:space:]')
  if [[ $line_count -gt 500 ]]; then
    warn "SKILL.md tem $line_count linhas, considere mover detalhes para references/"
  else
    ok "tamanho do SKILL.md OK ($line_count linhas)"
  fi

  # Pastas padrão opcionais
  for sub in references scripts assets; do
    if [[ -d "${skill_dir}${sub}" ]]; then
      ok "tem a pasta ${sub}/"
    fi
  done

  printf "\n"
done

printf "${CYAN}Resumo${NC}\n"
printf "  Skills conferidas: %d\n" "$SKILL_COUNT"
printf "  ${GREEN}Aprovadas:${NC} %d\n" "$PASS"
printf "  ${YELLOW}Avisos:${NC}    %d\n" "$WARN"
printf "  ${RED}Falhas:${NC}    %d\n" "$FAIL"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
exit 0
