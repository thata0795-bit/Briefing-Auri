import type { ReactNode } from "react";
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from "@react-email/components";

export type MarcaEmail = { nomeAgencia: string; siteUrl: string; contato?: string | null };

const cor = { bg: "#FAF6EE", card: "#FFFFFF", brown: "#5F3C26", brownDark: "#3F2616", text: "#2B1A10", muted: "#6E5B48", line: "#E6DCC8" };

/** Moldura padrão dos e-mails: cabeçalho marrom com o monograma, corpo branco, rodapé com contato. */
export function EmailBase({
  marca,
  previa,
  titulo,
  children,
  botao,
}: {
  marca: MarcaEmail;
  previa: string;
  titulo: string;
  children: ReactNode;
  botao?: { texto: string; href: string };
}) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{previa}</Preview>
      <Body style={{ backgroundColor: cor.bg, margin: 0, padding: "32px 16px", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <Container style={{ maxWidth: 520, backgroundColor: cor.card, border: `1px solid ${cor.line}`, borderRadius: 6 }}>
          <Section style={{ backgroundColor: cor.brown, padding: "28px 24px", textAlign: "center", borderRadius: "6px 6px 0 0" }}>
            <Img src={`${marca.siteUrl}/brand/monograma-dourado.png`} width="64" alt={marca.nomeAgencia} style={{ margin: "0 auto" }} />
          </Section>
          <Section style={{ padding: "32px 28px 8px" }}>
            <Heading as="h1" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 26, lineHeight: 1.25, color: cor.brownDark, margin: 0, fontWeight: 600 }}>
              {titulo}
            </Heading>
          </Section>
          <Section style={{ padding: "8px 28px 8px", color: cor.text, fontSize: 15, lineHeight: 1.6 }}>{children}</Section>
          {botao && (
            <Section style={{ padding: "16px 28px 28px" }}>
              <Button
                href={botao.href}
                style={{ backgroundColor: cor.brown, color: cor.bg, padding: "14px 28px", borderRadius: 4, fontSize: 15, fontWeight: "bold", textDecoration: "none" }}
              >
                {botao.texto}
              </Button>
            </Section>
          )}
          <Section style={{ padding: "16px 28px 28px", borderTop: `1px solid ${cor.line}` }}>
            <Text style={{ color: cor.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {marca.nomeAgencia}
              {marca.contato ? ` · ${marca.contato}` : ""}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const estiloTexto = { margin: "0 0 14px", color: cor.text, fontSize: 15, lineHeight: 1.6 } as const;
export const estiloMudo = { margin: "0 0 10px", color: cor.muted, fontSize: 13, lineHeight: 1.6 } as const;
