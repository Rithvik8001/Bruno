import type { CSSProperties, ReactNode } from "react";
import {
  BUDDY_BLUSH_MIN_SIZE,
  buddyBlink,
  buddyShapeFor,
  type BuddyShape,
} from "@/lib/design-system/buddies";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";

const HAPPY_MIN_SIZE = 26;

interface HairParts {
  readonly back?: ReactNode;
  readonly front: ReactNode;
}

const hair: Readonly<Record<BuddyShape, HairParts>> = {
  mochi: {
    front: (
      <path
        className="fill-tint"
        d="M11 60C10 30 28 15 50 15s40 15 39 45c-7-12-18-19-30-20-4 5-12 8-20 8 3-3 4-6 4-9-14 2-25 9-31 21z"
      />
    ),
  },
  miso: {
    back: (
      <>
        <path className="fill-tint" d="M15 44 20 8l24 20z" />
        <path className="fill-tint" d="M85 44 80 8 56 28z" />
        <path className="fill-tint-bg" d="M21 34 23 17l11 10z" />
        <path className="fill-tint-bg" d="M79 34 77 17 66 27z" />
      </>
    ),
    front: <path className="fill-tint" d="M13 56c1-22 17-34 37-34s36 12 37 34c-9-9-22-13-37-13S22 47 13 56z" />,
  },
  bun: {
    back: (
      <>
        <ellipse className="fill-tint" cx="33" cy="16" rx="9" ry="22" transform="rotate(-12 33 16)" />
        <ellipse className="fill-tint" cx="66" cy="14" rx="9" ry="22" transform="rotate(10 66 14)" />
        <ellipse className="fill-tint-bg" cx="33" cy="18" rx="4" ry="14" transform="rotate(-12 33 18)" />
        <ellipse className="fill-tint-bg" cx="66" cy="16" rx="4" ry="14" transform="rotate(10 66 16)" />
      </>
    ),
    front: <path className="fill-tint" d="M20 44c6-12 17-18 30-18s24 6 30 18c-9-4-19-6-30-6s-21 2-30 6z" />,
  },
  bolt: {
    back: (
      <>
        <path className="fill-none stroke-tint" d="M50 28 57 7" strokeWidth={4} strokeLinecap="round" />
        <circle className="fill-tint" cx="57" cy="7" r="6" />
        <circle className="fill-tint" cx="12" cy="62" r="10" />
        <circle className="fill-tint" cx="88" cy="62" r="10" />
      </>
    ),
    front: (
      <path
        className="fill-none stroke-tint"
        d="M16 50c3-17 17-27 34-27s31 10 34 27"
        strokeWidth={7}
        strokeLinecap="round"
      />
    ),
  },
  bruin: {
    back: (
      <>
        <circle className="fill-tint" cx="20" cy="30" r="14" />
        <circle className="fill-tint" cx="80" cy="30" r="14" />
        <circle className="fill-tint-bg" cx="21" cy="31" r="6.5" />
        <circle className="fill-tint-bg" cx="79" cy="31" r="6.5" />
      </>
    ),
    front: <path className="fill-tint" d="M14 52c4-18 18-29 36-29s32 11 36 29c-10-6-22-9-36-9s-26 3-36 9z" />,
  },
  sprout: {
    back: (
      <>
        <path className="fill-none stroke-tint" d="M50 28c0-8 1-13 3-17" strokeWidth={3.5} strokeLinecap="round" />
        <path className="fill-tint" d="M53 12c3-9 13-12 21-9-2 9-12 14-21 9z" />
        <path className="fill-tint" d="M51 16c-4-8-13-10-20-6 3 8 12 11 20 6z" />
      </>
    ),
    front: <path className="fill-tint" d="M20 46c7-11 17-17 30-17s23 6 30 17c-8-3-18-5-30-5s-22 2-30 5z" />,
  },
  swoop: {
    front: <path className="fill-tint" d="M10 62C7 30 32 13 57 16c20 2 33 17 33 38-14-16-36-20-56-10-9 4-17 11-24 18z" />,
  },
  pom: {
    front: (
      <>
        <path className="fill-tint" d="M13 46c0-22 17-34 37-34s37 12 37 34z" />
        <rect className="fill-tint" x="10" y="40" width="80" height="13" rx="6.5" />
        <rect className="fill-white" x="10" y="40" width="80" height="13" rx="6.5" opacity={0.22} />
        <circle className="fill-tint" cx="50" cy="11" r="8" />
        <circle className="fill-white" cx="50" cy="11" r="8" opacity={0.3} />
      </>
    ),
  },
};

const EYE_XS = [35.5, 56] as const;

export interface BuddyProps {
  seed: string;
  tint: Tint;
  size: number;
  shape?: BuddyShape | null;
  happy?: boolean;
  className?: string;
}

export function Buddy({ seed, tint, size, shape, happy = false, className }: BuddyProps) {
  const resolved = buddyShapeFor(seed, shape);
  const parts = hair[resolved];
  const { delaySeconds, durationSeconds } = buddyBlink(seed, resolved);
  const canSmile = happy || size >= HAPPY_MIN_SIZE;
  const blink = {
    "--buddy-blink-delay": `${delaySeconds}s`,
    "--buddy-blink-duration": `${durationSeconds}s`,
  } as CSSProperties;

  return (
    <svg
      aria-hidden
      data-tint={tint}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={blink}
      className={cn("group/buddy block", className)}
    >
      <rect className="fill-tint-bg" width="100" height="100" />
      <g transform="translate(-4 6) rotate(-10 50 60) translate(50 60) scale(1.07) translate(-50 -60)">
        {parts.back}
        <ellipse className="fill-buddy-face" cx="50" cy="63" rx="38" ry="36" />
        {parts.front}
        {size >= BUDDY_BLUSH_MIN_SIZE && (
          <g
            className={cn(
              "fill-buddy-blush transition-opacity duration-200",
              happy ? "opacity-70" : "opacity-42 group-hover/buddy:opacity-70",
            )}
          >
            <ellipse cx="27" cy="73" rx="7" ry="4" />
            <ellipse cx="73" cy="73" rx="7" ry="4" />
          </g>
        )}
        <g className={cn(happy ? "hidden" : canSmile && "group-hover/buddy:hidden")}>
          {EYE_XS.map((x) => (
            <rect
              key={x}
              className="animate-buddy-blink fill-buddy-ink [transform-box:fill-box] [transform-origin:center]"
              x={x}
              y="50"
              width="7.5"
              height="19"
              rx="3.75"
            />
          ))}
        </g>
        {canSmile && (
          <path
            className={cn("fill-none stroke-buddy-ink", happy ? "block" : "hidden group-hover/buddy:block")}
            d="M34 62q5-8 10 0M55 62q5-8 10 0"
            strokeWidth={4}
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
}
