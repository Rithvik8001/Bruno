import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { easings, radii, typeScale } from "@/lib/design-system/tokens";

const keys = <T extends object>(o: T) => Object.keys(o) as Array<keyof T & string>;

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: keys(typeScale),
      radius: keys(radii),
      shadow: ["float", "thumb", "card-thumb", "track", "field", "field-focus", "field-error", "key", "key-primary"],
      ease: keys(easings),
      animate: ["pulse-soft", "rise", "pop-in", "print-in"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
