import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "react-email";

export const emailTokens = {
  bg: "#FFFFFF",
  surface: "#F7F7F5",
  text: "#1A1917",
  text2: "#5F5E5A",
  muted: "#8A8985",
  brand: "#6D3CF5",
  font: "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
} as const;

export interface EmailShellProps {
  preview: string;
  title: string;
  children: ReactNode;
}

export function EmailShell({ preview, title, children }: EmailShellProps) {
  return (
    <Html lang="en">
      <Head />
      <Body
        style={{
          margin: 0,
          backgroundColor: emailTokens.bg,
          fontFamily: emailTokens.font,
          color: emailTokens.text,
        }}
      >
        <Preview>{preview}</Preview>
        <Container
          style={{ maxWidth: 480, margin: "0 auto", padding: "40px 24px" }}
        >
          <Text
            style={{
              margin: "0 0 32px",
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Bruno
          </Text>
          <Heading
            as="h1"
            style={{
              margin: "0 0 12px",
              fontSize: 24,
              lineHeight: "30px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </Heading>
          {children}
          <Text
            style={{
              margin: "40px 0 0",
              fontSize: 13,
              lineHeight: "18px",
              color: emailTokens.muted,
            }}
          >
            Bruno · Split the bill, not friendships.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
