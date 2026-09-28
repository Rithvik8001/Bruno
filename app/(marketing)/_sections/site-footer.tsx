import { BrunoLockup } from "@/components/brand/bruno-mark";
import { footerContent, navLinks } from "../_data";
import { Frame, NavLink } from "../_components/primitives";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <Frame className="grid justify-items-center gap-5 pt-14 pb-10 text-center">
        <BrunoLockup />
        <p className="m-0 text-small text-text-2">{footerContent.tagline}</p>
        <nav aria-label="Footer" className="mt-1 flex flex-wrap justify-center gap-1">
          {navLinks.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </Frame>
      <Frame className="border-t py-4 text-center text-footnote">
        <a
          href={footerContent.credit.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center text-muted no-underline hover:text-text"
        >
          {footerContent.credit.label}
        </a>
      </Frame>
    </footer>
  );
}
