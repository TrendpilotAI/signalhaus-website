import type { SVGProps } from "react";

/*
 * Pencil-line illustrations drawn for this site. Thin dark line on the cream
 * page, no shading, a little hand-drawn wobble, and a sparse terracotta spot
 * on one or two small objects. They sit straight on the paper with no tile,
 * border or shadow behind them.
 */

const LINE = "#242A36";
const SPOT = "#A84D34";

type IllustrationProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: LINE,
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/** A small house on a hill with a signal mast, a signpost and one chart. */
export function SignalHouse(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 560 430" {...base} {...props}>
      {/* loose background marks */}
      <path d="M70 122c30-50 100-40 90 10s-70 38-50-12" opacity="0.55" />
      <path d="M382 70c40-20 90-10 120 20" opacity="0.55" />
      <circle cx="424" cy="112" r="7" opacity="0.7" />
      <circle cx="474" cy="162" r="4" opacity="0.7" />
      <path d="M150 182l8 10-8 10-8-10z" opacity="0.7" />
      <circle cx="204" cy="120" r="3" fill={SPOT} stroke="none" />
      <circle cx="522" cy="212" r="3" fill={SPOT} stroke="none" />
      <circle cx="90" cy="232" r="2.5" fill={SPOT} stroke="none" />

      {/* hill */}
      <path d="M36 340c84-18 164-6 254-9s172-5 236 10" />

      {/* signal mast */}
      <path d="M290 150V97" />
      <circle cx="290" cy="90" r="5.5" fill={SPOT} stroke={SPOT} />
      <path d="M301.6 76.2a18 18 0 0 1 0 27.6" />
      <path d="M310.6 65.5a32 32 0 0 1 0 49" />
      <path d="M319.6 54.8a46 46 0 0 1 0 70.4" opacity="0.7" />
      <path d="M278.4 76.2a18 18 0 0 0 0 27.6" />
      <path d="M269.4 65.5a32 32 0 0 0 0 49" />
      <path d="M260.4 54.8a46 46 0 0 0 0 70.4" opacity="0.7" />

      {/* house */}
      <path d="M191 225l99-75 99 75" />
      <path d="M211 211v120M369 211v119" />
      <path d="M330 180v-21h17v34" />
      <path d="M270 331v-62h37v61z" fill={SPOT} stroke={SPOT} />
      <circle cx="299" cy="302" r="1.6" fill="#F5EFE3" stroke="none" />
      <path d="M226 250h31v33h-31zM241.5 250v33M226 266.5h31" />
      <path d="M322 250h31v33h-31zM337.5 250v33M322 266.5h31" />

      {/* path to the door */}
      <path d="M279 332c-4 26-30 42-44 74" />
      <path d="M301 331c4 30-10 50-14 75" />

      {/* signpost */}
      <path d="M120 338v-90" />
      <path d="M120 257h50l10 9-10 9h-50z" />
      <path d="M120 286H86l-10 9 10 9h34" />

      {/* one chart on an easel */}
      <path d="M424 238l80-3 2 60-80 3z" />
      <path d="M435 285l18-16 14 8 25-28" />
      <circle cx="492" cy="249" r="3.5" fill={SPOT} stroke="none" />
      <path d="M441 298l-10 41M489 296l10 42M465 297v37" />

      {/* grass ticks */}
      <path d="M160 338l3-8M168 338l1-6M396 334l2-7M404 335l4-7M330 372l3-7" opacity="0.7" />
    </svg>
  );
}

/** A sheet with three columns: the date, the number, and why it moved. */
export function OneNumberSheet(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 220 180" {...base} {...props}>
      <path d="M38 28l146-6 6 128-146 8z" />
      <path d="M40 58l146-6M86 26l5 131M130 24l5 131" />
      <path d="M48 44h26M98 42h20M142 40h32" />
      <path d="M48 76h24M48 98h24M48 120h24" opacity="0.7" />
      <path d="M144 73h30M144 95h26M144 117h32" opacity="0.7" />
      <path d="M98 122l8-20 9 6 10-30" stroke={SPOT} strokeWidth={1.8} />
      <circle cx="125" cy="78" r="3.5" fill={SPOT} stroke="none" />
      <circle cx="200" cy="34" r="3" opacity="0.7" />
      <circle cx="24" cy="120" r="2.5" fill={SPOT} stroke="none" />
      <path d="M18 60l5 6-5 6-5-6z" opacity="0.7" />
    </svg>
  );
}

/** A note on its way: an envelope with a terracotta seal. */
export function NoteOnItsWay(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 320 230" {...base} {...props}>
      <path d="M30 60c20-34 70-30 66 4s-48 28-36-6" opacity="0.55" />
      <circle cx="276" cy="48" r="6" opacity="0.7" />
      <path d="M268 176l7 9-7 9-7-9z" opacity="0.7" />
      <circle cx="44" cy="170" r="3" fill={SPOT} stroke="none" />
      <circle cx="292" cy="112" r="2.5" fill={SPOT} stroke="none" />

      <path d="M92 84l-2-42 138-4 3 44" />
      <path d="M110 58h64M110 70h92" opacity="0.7" />
      <path d="M66 86l190-4 4 112-190 5z" />
      <path d="M66 86l97 62 93-66" />
      <path d="M70 199l70-66M260 194l-74-62" opacity="0.7" />
      <circle cx="163" cy="150" r="11" fill={SPOT} stroke={SPOT} />
    </svg>
  );
}

/** Four question cards laid out on a table, one of them still open. */
export function QuestionCards(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 320 240" {...base} {...props}>
      <path d="M40 58l104-7 5 66-104 8z" />
      <path d="M56 76l58-4M57 91l72-5" opacity="0.7" />
      <path d="M170 46l106 5-4 68-105-5z" />
      <path d="M185 66l62 3M184 81l76 4" opacity="0.7" />
      <path d="M48 140l104 5-4 66-104-6z" />
      <path d="M63 160l60 3M62 175l74 4" opacity="0.7" />
      <path d="M172 136l104-8 6 68-104 8z" />
      <path d="M214 160c-1-11 17-13 18-2 1 8-9 8-8 17" stroke={SPOT} strokeWidth={1.8} />
      <circle cx="224.5" cy="184" r="2.3" fill={SPOT} stroke="none" />
      <circle cx="158" cy="26" r="5" opacity="0.7" />
      <path d="M22 122l6 8-6 8-6-8z" opacity="0.7" />
      <circle cx="298" cy="128" r="2.5" fill={SPOT} stroke="none" />
      <circle cx="30" cy="200" r="2.5" fill={SPOT} stroke="none" />
    </svg>
  );
}

/** A signpost with nothing written on it, for the page that isn't there. */
export function BlankSignpost(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 240 220" {...base} {...props}>
      <path d="M24 196c50-12 130-10 192 0" />
      <path d="M120 196V44" />
      <path d="M120 60h62l12 11-12 11h-62z" />
      <path d="M120 98H62l-12 11 12 11h58" />
      <path d="M120 136h46l12 11-12 11h-46z" opacity="0.7" />
      <circle cx="120" cy="38" r="5" fill={SPOT} stroke={SPOT} />
      <circle cx="40" cy="60" r="5" opacity="0.7" />
      <path d="M204 120l6 8-6 8-6-8z" opacity="0.7" />
      <circle cx="210" cy="56" r="2.5" fill={SPOT} stroke="none" />
      <path d="M84 194l3-8M150 194l3-7M158 195l1-6" opacity="0.7" />
    </svg>
  );
}
