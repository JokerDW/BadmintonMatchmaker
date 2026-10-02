import type { ReactNode } from 'react';

function Svg({ size = 14, children, strokeWidth }: { size?: number; children: ReactNode; strokeWidth?: number }) {
  return (
    <svg className="svg-icon" width={size} height={size} viewBox="0 0 24 24" style={strokeWidth ? { strokeWidth } : undefined} aria-hidden="true">
      {children}
    </svg>
  );
}

type P = { size?: number };

export const PlusIcon = ({ size }: P) => <Svg size={size}><path d="M5 12h14" /><path d="M12 5v14" /></Svg>;
export const ArrowRightIcon = ({ size }: P) => <Svg size={size}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>;
export const XIcon = ({ size }: P) => <Svg size={size}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>;
export const CheckIcon = ({ size }: P) => <Svg size={size} strokeWidth={2.25}><path d="M20 6 9 17l-5-5" /></Svg>;
export const PencilIcon = ({ size }: P) => (
  <Svg size={size}><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></Svg>
);
export const LinkIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Svg>
);
export const TrashIcon = ({ size }: P) => (
  <Svg size={size}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></Svg>
);
export const FlagIcon = ({ size }: P) => (
  <Svg size={size}><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" /></Svg>
);
export const GearIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
