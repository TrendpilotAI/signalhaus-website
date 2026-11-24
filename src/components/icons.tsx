import type { ReactNode, SVGProps } from "react";

/*
 * Line icons drawn for this site. One simple object each, outline only,
 * uniform thin stroke, round caps and joins, no fills. Colour comes from
 * the parent through currentColor.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconQuestions(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.5h16v10.5h-8.5L7 20v-4H4z" />
      <path d="M9.9 9.2a2.1 2.1 0 1 1 3 1.9c-.6.3-.9.7-.9 1.3" />
      <path d="M12 14.1v.1" />
    </Icon>
  );
}

export function IconCompass(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z" />
    </Icon>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 20.5v-17" />
      <path d="M5.5 4.5h11.5l-2.4 3.8 2.4 3.8H5.5" />
    </Icon>
  );
}

export function IconChart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4v16h16" />
      <path d="M7.5 15l3.5-4 3 2.5 4.5-6" />
    </Icon>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="1.5" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </Icon>
  );
}

export function IconAgent(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M12 8V4.5M9.5 12.5v1.5M14.5 12.5v1.5M2.5 12.5v3M21.5 12.5v3" />
      <circle cx="12" cy="3.6" r="0.9" />
    </Icon>
  );
}

export function IconSheet(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 9.5h16M4 14.5h16M10 4v16" />
    </Icon>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.5c-2-1.3-4.7-1.7-8-1.5v13c3.3-.2 6 .2 8 1.5 2-1.3 4.7-1.7 8-1.5v-13c-3.3-.2-6 .2-8 1.5z" />
      <path d="M12 6.5v13" />
    </Icon>
  );
}

export function IconTalk(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5h12v8.5H9.5L6 16.5v-3H4z" />
      <path d="M16 9h4v8h-1.5v2.5L15.5 17H11" />
    </Icon>
  );
}

export function IconWrench(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 5.2a4.3 4.3 0 0 0-5.3 5.6L4 16v4h4l5.2-5.2a4.3 4.3 0 0 0 5.6-5.3l-2.9 2.9-2.3-.6-.6-2.3z" />
    </Icon>
  );
}

export function IconHands(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 9.5l3.5-3 4 1.5 2-1.5 4 .5 3.5 3" />
      <path d="M3.5 9.5v6l5 4 3-1 2 1 7-5v-5" />
      <path d="M11 8l-2.5 3.5c1.5 1 3 .7 4-.5l4.5 3.5" />
    </Icon>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12h.01" />
    </Icon>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Icon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  );
}

export function IconArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17L17 7M8.5 7H17v8.5" />
    </Icon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </Icon>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function IconFeed(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" />
      <circle cx="6" cy="18" r="1" />
    </Icon>
  );
}

/** The Signalhaus mark: a small house with a signal coming off the roof. */
export function LogoMark(props: IconProps) {
  return (
    <Icon strokeWidth={1.6} {...props}>
      <path d="M4 20v-8.5L10 6l6 5.5V20z" />
      <path d="M8.5 20v-4.5h3V20" />
      <path d="M15.5 5.5a3.5 3.5 0 0 1 3 3M16 2.5a6.5 6.5 0 0 1 5.5 5.5" />
    </Icon>
  );
}
