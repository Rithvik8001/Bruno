import { buildThemeCss } from "@/lib/design-system/theme-css";
import { themeInitScript } from "@/lib/theme/theme";

const themeCss = buildThemeCss();

export function ThemeHead() {
  return (
    <>
      <style id="bruno-tokens" dangerouslySetInnerHTML={{ __html: themeCss }} />
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
    </>
  );
}
