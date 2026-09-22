import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import { emailCopy } from "./copy";
import { mail } from "./theme";

export type LayoutProps = {
  preview: string;
  children: ReactNode;
};

export const bodyStyle = {
  margin: "0 0 16px 0",
  fontSize: mail.bodySize,
  lineHeight: mail.bodyLine,
  color: mail.ink2,
} as const;

export const strongStyle = { color: mail.ink, fontWeight: 600 } as const;

export const captionStyle = {
  margin: 0,
  fontSize: mail.captionSize,
  lineHeight: mail.captionLine,
  color: mail.ink3,
} as const;

export const hrStyle = {
  borderColor: mail.hair,
  borderTop: `1px solid ${mail.hair}`,
  margin: `${mail.gap} 0`,
} as const;

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: mail.bodyPadding,
          backgroundColor: mail.paper,
          fontFamily: mail.font,
        }}
      >
        <Container
          style={{
            maxWidth: mail.width,
            margin: "0 auto",
            padding: mail.containerPadding,
            backgroundColor: mail.paper,
          }}
        >
          <Heading
            as="h1"
            style={{
              margin: 0,
              fontSize: mail.wordmarkSize,
              lineHeight: mail.bodyLine,
              fontWeight: 600,
              color: mail.ink,
            }}
          >
            {emailCopy.wordmark}
          </Heading>
          <Hr style={hrStyle} />
          {children}
          <Hr style={hrStyle} />
          <Text style={captionStyle}>{emailCopy.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <Text
      style={{
        margin: `0 0 ${mail.gap} 0`,
        fontSize: mail.codeSize,
        lineHeight: "36px",
        fontWeight: 600,
        letterSpacing: mail.codeTracking,
        color: mail.ink,
      }}
    >
      {code}
    </Text>
  );
}

export function FactRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        borderBottom: last ? undefined : `1px solid ${mail.hair}`,
      }}
    >
      <tbody>
        <tr>
          <td
            style={{
              padding: mail.rowPadding,
              fontSize: mail.bodySize,
              lineHeight: mail.bodyLine,
              color: mail.ink2,
            }}
          >
            {label}
          </td>
          <td
            align="right"
            style={{
              padding: mail.rowPadding,
              fontSize: mail.bodySize,
              lineHeight: mail.bodyLine,
              color: mail.ink,
              fontWeight: 500,
            }}
          >
            {value}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
