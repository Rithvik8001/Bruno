import { Fragment, type CSSProperties, type ReactNode } from "react";
import { emailColors, emailFont, emailTints, type EmailTint } from "./tokens";

const type = (size: number, lineHeight: number, color: string, weight: number = 400): CSSProperties => ({
  margin: 0,
  fontFamily: emailFont,
  fontSize: size,
  lineHeight: `${lineHeight}px`,
  color,
  fontWeight: weight,
});

const cell = (first: boolean): CSSProperties => ({ padding: first ? 0 : "10px 0 0" });

function Table({ children, width, className, style }: { children: ReactNode; width?: string; className?: string; style?: CSSProperties }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width={width} className={className} style={style}>
      <tbody>{children}</tbody>
    </table>
  );
}

export function Gap({ size }: { size: number }) {
  return <div style={{ height: size, lineHeight: `${size}px`, fontSize: 0 }}>&nbsp;</div>;
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="e-text" style={{ ...type(28, 34, emailColors.text, 600), letterSpacing: "-0.02em" }}>
      {children}
    </h1>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="e-text2" style={{ ...type(14, 20, emailColors.text2), margin: "0 0 8px" }}>
      {children}
    </p>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="e-text2" style={type(15, 24, emailColors.text2)}>
      {children}
    </p>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <p className="e-text" style={type(15, 22, emailColors.text, 600)}>
      {children}
    </p>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p style={type(13, 20, emailColors.muted)}>{children}</p>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="e-link" style={{ color: emailColors.brand, textDecoration: "none", fontWeight: 600 }}>
      {children}
    </a>
  );
}

export function Chip({ tint, dot = true, children }: { tint: EmailTint; dot?: boolean; children: ReactNode }) {
  const { bg, fg } = emailTints[tint];
  return (
    <span
      className={`e-bg-${tint} e-fg-${tint}`}
      style={{
        ...type(13, 18, fg, 600),
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 7,
        backgroundColor: bg,
        whiteSpace: "nowrap",
      }}
    >
      {dot && <>&#9679;&nbsp;</>}
      {children}
    </span>
  );
}

export function AmountPill({ tint, label, children }: { tint: EmailTint; label: string; children: ReactNode }) {
  const { bg, fg } = emailTints[tint];
  return (
    <>
      <Eyebrow>{label}</Eyebrow>
      <span
        className={`e-bg-${tint} e-fg-${tint}`}
        style={{
          ...type(40, 52, fg, 600),
          display: "inline-block",
          padding: "4px 14px",
          borderRadius: 12,
          backgroundColor: bg,
          letterSpacing: "-0.02em",
          fontFeatureSettings: "'tnum'",
        }}
      >
        {children}
      </span>
    </>
  );
}

export function Card({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <Table width="100%">
      <tr>
        <td className="e-surface" style={{ backgroundColor: emailColors.surface, borderRadius: 20, padding: 24 }}>
          {label && <p style={{ ...type(13, 18, emailColors.muted, 500), margin: "0 0 10px", textTransform: "uppercase" }}>{label}</p>}
          {children}
        </td>
      </tr>
    </Table>
  );
}

export interface DetailRow {
  label: string;
  value: string;
  strong?: boolean;
  labelStrong?: boolean;
  valueTint?: EmailTint;
  chip?: { label: string; tint: EmailTint };
}

export function Rows({ rows }: { rows: readonly DetailRow[] }) {
  const hasChips = rows.some((row) => row.chip !== undefined);
  return (
    <Table width="100%">
      {rows.map((row, index) => {
        const strong = row.strong === true;
        const labelStrong = strong || row.labelStrong === true;
        return (
          <tr key={`${row.label}-${index}`}>
            <td
              className={labelStrong ? "e-text" : "e-text2"}
              style={{
                ...type(labelStrong ? 15 : 14, 20, labelStrong ? emailColors.text : emailColors.text2, labelStrong ? 600 : 400),
                ...cell(index === 0),
              }}
            >
              {row.label}
            </td>
            {hasChips && (
              <td align="right" style={{ ...cell(index === 0), paddingLeft: 12, paddingRight: 12, whiteSpace: "nowrap" }}>
                {row.chip && (
                  <Chip tint={row.chip.tint} dot={false}>
                    {row.chip.label}
                  </Chip>
                )}
              </td>
            )}
            <td
              align="right"
              className={row.valueTint ? `e-fg-${row.valueTint}` : "e-text"}
              style={{
                ...type(strong ? 15 : 14, 20, row.valueTint ? emailTints[row.valueTint].fg : emailColors.text, strong ? 600 : 500),
                ...cell(index === 0),
                whiteSpace: "nowrap",
              }}
            >
              {row.value}
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

export function CtaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Table>
      <tr>
        <td align="center" style={{ borderRadius: 10, backgroundColor: emailColors.brand }}>
          <a
            href={href}
            style={{
              ...type(15, 20, emailColors.onBrand, 600),
              display: "block",
              padding: "14px 24px",
              textDecoration: "none",
              borderRadius: 10,
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </Table>
  );
}

export interface StepItem {
  title: string;
  body: string;
  tint: EmailTint;
}

export function Steps({ steps }: { steps: readonly StepItem[] }) {
  return (
    <>
      {steps.map((step, index) => (
        <Fragment key={step.title}>
          {index > 0 && <Gap size={18} />}
          <Table width="100%">
            <tr>
              <td width={40} valign="top" style={{ width: 40 }}>
                <span
                  className={`e-bg-${step.tint} e-fg-${step.tint}`}
                  style={{
                    ...type(12, 32, emailTints[step.tint].fg, 600),
                    display: "inline-block",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: emailTints[step.tint].bg,
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </span>
              </td>
              <td style={{ paddingLeft: 14 }}>
                <Heading>{step.title}</Heading>
                <p className="e-text2" style={{ ...type(14, 20, emailColors.text2), marginTop: 2 }}>
                  {step.body}
                </p>
              </td>
            </tr>
          </Table>
        </Fragment>
      ))}
    </>
  );
}

export interface Stat {
  label: string;
  value: string;
  tint?: EmailTint;
}

function StatCell({ stat }: { stat: Stat }) {
  const tint = stat.tint;
  return (
    <td
      width="50%"
      valign="top"
      className={tint ? `e-bg-${tint}` : "e-surface"}
      style={{ backgroundColor: tint ? emailTints[tint].bg : emailColors.surface, borderRadius: 20, padding: 20 }}
    >
      <p className={tint ? `e-fg-${tint}` : "e-text2"} style={type(13, 18, tint ? emailTints[tint].fg : emailColors.text2)}>
        {stat.label}
      </p>
      <p
        className={tint ? `e-fg-${tint}` : "e-text"}
        style={{ ...type(26, 32, tint ? emailTints[tint].fg : emailColors.text, 600), marginTop: 6, letterSpacing: "-0.02em" }}
      >
        {stat.value}
      </p>
    </td>
  );
}

export function StatCards({ left, right }: { left: Stat; right: Stat }) {
  return (
    <Table width="100%">
      <tr>
        <StatCell stat={left} />
        <td width={12} style={{ width: 12 }}>
          &nbsp;
        </td>
        <StatCell stat={right} />
      </tr>
    </Table>
  );
}

export interface BarItem {
  name: string;
  amount: string;
  tint: EmailTint;
  percent: number;
}

export function Bars({ items }: { items: readonly BarItem[] }) {
  return (
    <Table width="100%">
      {items.map((item) => (
        <Fragment key={item.name}>
          <tr>
            <td style={{ padding: "14px 0 6px" }}>
              <Chip tint={item.tint}>{item.name}</Chip>
            </td>
            <td align="right" className="e-text" style={{ ...type(14, 20, emailColors.text, 600), padding: "14px 0 6px", whiteSpace: "nowrap" }}>
              {item.amount}
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <Table width="100%">
                <tr>
                  <td className="e-track" style={{ backgroundColor: emailColors.track, borderRadius: 4, height: 8, fontSize: 0, lineHeight: 0 }}>
                    <Table width={`${Math.max(4, Math.min(100, Math.round(item.percent)))}%`}>
                      <tr>
                        <td
                          className={`e-fill-${item.tint}`}
                          style={{ backgroundColor: emailTints[item.tint].fg, borderRadius: 4, height: 8, fontSize: 0, lineHeight: 0 }}
                        >
                          &nbsp;
                        </td>
                      </tr>
                    </Table>
                  </td>
                </tr>
              </Table>
            </td>
          </tr>
        </Fragment>
      ))}
    </Table>
  );
}

export function CodeTiles({ code }: { code: string }) {
  const digits = [...code];
  const half = Math.ceil(digits.length / 2);
  return (
    <Table>
      <tr>
        {digits.map((digit, index) => (
          <Fragment key={index}>
            {index > 0 &&
              (index === half ? (
                <td width={16} align="center" style={{ ...type(24, 56, emailColors.muted), width: 16 }}>
                  &middot;
                </td>
              ) : (
                <td width={8} style={{ width: 8 }}>
                  &nbsp;
                </td>
              ))}
            <td
              width={48}
              height={60}
              align="center"
              className="e-tile e-brandtint e-link"
              style={{
                ...type(28, 60, emailColors.brand, 600),
                width: 48,
                height: 60,
                borderRadius: 10,
                backgroundColor: emailColors.brandTint,
                fontFeatureSettings: "'tnum'",
              }}
            >
              {digit}
            </td>
          </Fragment>
        ))}
      </tr>
    </Table>
  );
}

export interface EmailPerson {
  initials: string;
  tint: EmailTint;
}

function AvatarDot({ person, overlap }: { person: EmailPerson; overlap: boolean }) {
  return (
    <span
      className={`e-bg-${person.tint} e-fg-${person.tint} e-ring`}
      style={{
        ...type(12, 32, emailTints[person.tint].fg, 600),
        display: "inline-block",
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: `2px solid ${emailColors.card}`,
        backgroundColor: emailTints[person.tint].bg,
        textAlign: "center",
        verticalAlign: "middle",
        marginLeft: overlap ? -8 : 0,
      }}
    >
      {person.initials}
    </span>
  );
}

export function AvatarStack({ people }: { people: readonly EmailPerson[] }) {
  return (
    <div>
      {people.map((person, index) => (
        <AvatarDot key={`${person.initials}-${index}`} person={person} overlap={index > 0} />
      ))}
    </div>
  );
}

export function PersonCard({ person, title, body }: { person: EmailPerson; title: string; body: string }) {
  return (
    <Card>
      <Table width="100%">
        <tr>
          <td width={40} valign="top" style={{ width: 40 }}>
            <AvatarDot person={person} overlap={false} />
          </td>
          <td style={{ paddingLeft: 12 }}>
            <Heading>{title}</Heading>
            <p className="e-text2" style={{ ...type(14, 20, emailColors.text2), marginTop: 2 }}>
              {body}
            </p>
          </td>
        </tr>
      </Table>
    </Card>
  );
}
