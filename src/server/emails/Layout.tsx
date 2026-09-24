import {
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

import { emailCopy } from "./copy";
import { emailLogoUrl, initial, markUrl } from "./format";
import { mail } from "./theme";

type TypeToken = keyof typeof mail.type;
type Tone = "ink" | "ink2" | "ink3";

const light = mail.light;
const dark = mail.dark;

const darkCss = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .b-canvas { background-color: ${dark.canvas} !important; }
  .b-ink { color: ${dark.ink} !important; }
  .b-ink2 { color: ${dark.ink2} !important; }
  .b-ink3 { color: ${dark.ink3} !important; }
  .b-surface { background-color: ${dark.surface} !important; }
  .b-border { border-color: ${dark.border} !important; }
}
`;

function text(token: TypeToken, tone: Tone): CSSProperties {
  const style = mail.type[token];
  return {
    margin: 0,
    fontFamily: mail.font,
    fontSize: style.size,
    lineHeight: style.line,
    fontWeight: style.weight,
    letterSpacing: style.tracking,
    color: light[tone],
  };
}

function gap(size: string): CSSProperties {
  return { height: size, lineHeight: size, fontSize: "1px" };
}

export function Gap({ size }: { size: keyof typeof mail.space }) {
  return <div style={gap(mail.space[size])} />;
}

export type FooterKind = "reminders" | "account" | null;

export type LayoutProps = {
  preview: string;
  eyebrow: string;
  title: string;
  footer: FooterKind;
  children: ReactNode;
};

export function Layout({ preview, eyebrow, title, footer, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{darkCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <body
        className="b-canvas"
        style={{ margin: 0, backgroundColor: light.canvas, fontFamily: mail.font }}
      >
        <Container
          className="b-canvas"
          style={{
            maxWidth: mail.width,
            margin: "0 auto",
            padding: mail.pagePadding,
            backgroundColor: light.canvas,
          }}
        >
          <Img
            src={markUrl()}
            width={mail.mark.size}
            height={mail.mark.size}
            alt={emailCopy.brand}
            style={{ display: "block", borderRadius: mail.mark.radius }}
          />
          <Gap size="s24" />
          <Text className="b-ink3" style={text("label", "ink3")}>
            {eyebrow}
          </Text>
          <Gap size="s8" />
          <Text className="b-ink" style={text("title", "ink")}>
            {title}
          </Text>
          <Gap size="s24" />
          {children}
          <Divider />
          <Text className="b-ink3" style={text("caption", "ink3")}>
            {footer === null ? emailCopy.brand : emailCopy.footer[footer]}
          </Text>
        </Container>
      </body>
    </Html>
  );
}

export function Paragraph({
  children,
  tone = "ink2",
  strong = false,
}: {
  children: ReactNode;
  tone?: Tone;
  strong?: boolean;
}) {
  return (
    <>
      <Text className={`b-${tone}`} style={text(strong ? "bodyStrong" : "body", tone)}>
        {children}
      </Text>
      <Gap size="s16" />
    </>
  );
}

export function Divider() {
  return (
    <Hr
      className="b-border"
      style={{
        border: "none",
        borderTop: `1px solid ${light.border}`,
        margin: mail.divider.margin,
      }}
    />
  );
}

export function LogoCircle({
  name,
  serviceKey,
  size,
}: {
  name: string;
  serviceKey: string | null;
  size: number;
}) {
  const uri = emailLogoUrl(serviceKey);
  if (uri !== null) {
    return (
      <Img
        src={uri}
        width={size}
        height={size}
        alt={name}
        className="b-surface"
        style={{
          display: "block",
          borderRadius: mail.pill,
          backgroundColor: light.surface,
        }}
      />
    );
  }
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td
            className="b-surface b-ink"
            align="center"
            valign="middle"
            style={{
              ...text("bodyStrong", "ink"),
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: mail.pill,
              backgroundColor: light.surface,
            }}
          >
            {initial(name)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        ...text("label", "ink"),
        display: "inline-block",
        height: mail.chip.height,
        lineHeight: mail.chip.height,
        padding: mail.chip.padding,
        borderRadius: mail.pill,
        backgroundColor: light.accent,
        color: light.onAccent,
      }}
    >
      {label}
    </span>
  );
}

export function Hero({
  name,
  serviceKey,
  chip,
  amount,
  per,
}: {
  name: string;
  serviceKey: string | null;
  chip: string;
  amount: string;
  per: string;
}) {
  return (
    <>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td width={mail.logo.hero + mail.logo.gap} valign="middle">
              <LogoCircle name={name} serviceKey={serviceKey} size={mail.logo.hero} />
            </td>
            <td valign="middle">
              <Text className="b-ink" style={text("bodyStrong", "ink")}>
                {name}
              </Text>
            </td>
            <td align="right" valign="middle">
              <Chip label={chip} />
            </td>
          </tr>
        </tbody>
      </table>
      <Gap size="s16" />
      <Figure amount={amount} caption={per} />
    </>
  );
}

export function Figure({ amount, caption }: { amount: string; caption: string }) {
  return (
    <>
      <Text className="b-ink" style={text("display", "ink")}>
        {amount}
      </Text>
      <Gap size="s4" />
      <Text className="b-ink3" style={text("caption", "ink3")}>
        {caption}
      </Text>
      <Gap size="s24" />
    </>
  );
}

export function Facts({ rows }: { rows: readonly { label: string; value: string }[] }) {
  return (
    <>
      {rows.map((row) => (
        <table key={row.label} role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td className="b-ink3" style={{ ...text("body", "ink3"), padding: mail.row.padding }}>
                {row.label}
              </td>
              <td width={mail.logo.gap}>&nbsp;</td>
              <td
                align="right"
                className="b-ink"
                style={{ ...text("bodyStrong", "ink"), padding: mail.row.padding }}
              >
                {row.value}
              </td>
            </tr>
          </tbody>
        </table>
      ))}
      <Gap size="s16" />
    </>
  );
}

export type LogoListRow = {
  key: string;
  name: string;
  serviceKey: string | null;
  sub: string;
  amount: string;
};

export function LogoList({ rows }: { rows: readonly LogoListRow[] }) {
  return (
    <>
      {rows.map((row) => (
        <table key={row.key} role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td width={mail.logo.row + mail.logo.gap} valign="middle" style={{ padding: mail.row.padding }}>
                <LogoCircle name={row.name} serviceKey={row.serviceKey} size={mail.logo.row} />
              </td>
              <td valign="middle" style={{ padding: mail.row.padding }}>
                <Text className="b-ink" style={text("bodyStrong", "ink")}>
                  {row.name}
                </Text>
                <Text className="b-ink3" style={text("caption", "ink3")}>
                  {row.sub}
                </Text>
              </td>
              <td width={mail.logo.gap}>&nbsp;</td>
              <td
                align="right"
                valign="middle"
                className="b-ink"
                style={{ ...text("bodyStrong", "ink"), padding: mail.row.padding }}
              >
                {row.amount}
              </td>
            </tr>
          </tbody>
        </table>
      ))}
      <Gap size="s16" />
    </>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return (
    <>
      <Text className="b-ink3" style={text("caption", "ink3")}>
        {children}
      </Text>
      <Gap size="s16" />
    </>
  );
}

export function Code({ code }: { code: string }) {
  return (
    <>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        className="b-border"
        style={{
          border: `1px solid ${light.border}`,
          borderRadius: mail.code.radius,
          borderCollapse: "separate",
        }}
      >
        <tbody>
          <tr>
            <td
              align="center"
              valign="middle"
              className="b-ink"
              style={{
                ...text("code", "ink"),
                height: mail.code.height,
                paddingLeft: mail.type.code.tracking,
              }}
            >
              {code}
            </td>
          </tr>
        </tbody>
      </table>
      <Gap size="s24" />
    </>
  );
}
