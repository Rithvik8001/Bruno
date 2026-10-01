import type { ReactNode } from "react";
import { Body, Head, Html, Img, Preview } from "react-email";
import type { EmailChrome } from "./chrome";
import { emailColors, emailCss, emailFont } from "./tokens";

export interface EmailShellProps {
  preview: string;
  chrome: EmailChrome;
  reason: string;
  children: ReactNode;
}

const footerText = {
  margin: 0,
  fontFamily: emailFont,
  fontSize: 13,
  lineHeight: "20px",
  color: emailColors.muted,
} as const;

const footerLink = { color: emailColors.text2, textDecoration: "underline" } as const;

export function EmailShell({ preview, chrome, reason, children }: EmailShellProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style dangerouslySetInnerHTML={{ __html: emailCss }} />
      </Head>
      <Body className="e-page" style={{ margin: 0, padding: 0, backgroundColor: emailColors.page }}>
        <Preview>{preview}</Preview>
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          width="100%"
          className="e-page"
          style={{ backgroundColor: emailColors.page }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 12px" }}>
                <table
                  role="presentation"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  width="100%"
                  className="e-card e-wrap"
                  style={{ maxWidth: 600, width: "100%", backgroundColor: emailColors.card, borderRadius: 20 }}
                >
                  <tbody>
                    <tr>
                      <td className="e-px" align="left" style={{ padding: "36px 40px 40px" }}>
                        <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                          <tbody>
                            <tr>
                              <td width={28} height={28} style={{ width: 28, height: 28 }}>
                                <Img
                                  src={chrome.markUrl}
                                  width={28}
                                  height={28}
                                  alt="Bruno"
                                  style={{ display: "block", width: 28, height: 28, borderRadius: 8 }}
                                />
                              </td>
                              <td
                                className="e-text"
                                style={{
                                  paddingLeft: 10,
                                  fontFamily: emailFont,
                                  fontSize: 17,
                                  lineHeight: "28px",
                                  fontWeight: 600,
                                  letterSpacing: "-0.01em",
                                  color: emailColors.text,
                                }}
                              >
                                Bruno
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ height: 40, lineHeight: "40px", fontSize: 0 }}>&nbsp;</div>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td className="e-px" align="left" style={{ padding: "0 40px 36px" }}>
                        <div className="e-line" style={{ height: 1, lineHeight: "1px", fontSize: 0, backgroundColor: emailColors.line }}>
                          &nbsp;
                        </div>
                        <div style={{ height: 24, lineHeight: "24px", fontSize: 0 }}>&nbsp;</div>
                        <p style={footerText}>{reason}</p>
                        <p style={{ ...footerText, marginTop: 8 }}>
                          <a href={chrome.settingsUrl} className="e-text2" style={footerLink}>
                            Notification settings
                          </a>
                          {chrome.unsubscribeUrl && (
                            <>
                              &nbsp;&nbsp;·&nbsp;&nbsp;
                              <a href={chrome.unsubscribeUrl} className="e-text2" style={footerLink}>
                                Unsubscribe
                              </a>
                            </>
                          )}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}
