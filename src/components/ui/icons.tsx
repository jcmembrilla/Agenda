import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
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

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" />
      <path d="M6.5 7l.8 11.4A1.6 1.6 0 0 0 8.9 20h6.2a1.6 1.6 0 0 0 1.6-1.6L17.5 7" />
      <path d="M10.5 11v5M13.5 11v5" />
    </Icon>
  );
}

export function CheckSmallIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.4} {...props}>
      <path d="M5 12.5l4.4 4.4L19 7.4" />
    </Icon>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3.75h7.5L19 8.25v11A1.75 1.75 0 0 1 17.25 21h-10A1.75 1.75 0 0 1 5.5 19.25v-13A2.5 2.5 0 0 1 8 3.75Z" />
      <path d="M14 4v5h5M8.5 13h7M8.5 16.5h7" />
    </Icon>
  );
}

export function InstallIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.75v11.5M7.5 10.75 12 15.25l4.5-4.5" />
      <path d="M5 16v2.25A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </Icon>
  );
}
