import type { ReactNode, SVGProps } from "react";
import type { Categoria, Modelo } from "@/data/vagas";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 18, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
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

const CATEGORIA_PATHS: Record<Categoria, ReactNode> = {
  // Shop with awning
  comercio: (
    <>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  // Office tower
  escritorio: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M11 21v-3h2v3" />
    </>
  ),
  // Medical cross
  saude: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 7v10M7 12h10" />
    </>
  ),
  // Warehouse
  galpao: (
    <>
      <path d="M3 10l9-6 9 6v10H3z" />
      <path d="M7 20v-6h10v6M7 17h10" />
    </>
  ),
  // Hard hat
  obra: (
    <>
      <path d="M4 17a8 8 0 0 1 16 0" />
      <path d="M2 17h20v2H2zM10 9V6h4v3" />
    </>
  ),
  // Book
  escola: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
      <path d="M4 20a2 2 0 0 0 2 1h13v-3M9 8h6" />
    </>
  ),
  // Corner store / house
  bairro: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10M10 20v-6h4v6" />
    </>
  ),
};

export function CategoriaIcon({ categoria, ...props }: IconProps & { categoria: Categoria }) {
  return <Svg {...props}>{CATEGORIA_PATHS[categoria]}</Svg>;
}

const MODELO_PATHS: Record<Modelo, ReactNode> = {
  // Map pin
  presencial: (
    <>
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  // Two-way arrows (office ⇄ home)
  hibrido: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  // Wi-fi
  remoto: (
    <>
      <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="0.8" fill="currentColor" />
    </>
  ),
};

export function ModeloIcon({ modelo, ...props }: IconProps & { modelo: Modelo }) {
  return <Svg {...props}>{MODELO_PATHS[modelo]}</Svg>;
}

export function CoinIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="#f6c343" stroke="#b07a12" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#d99a1e" strokeWidth="1.2" />
      <path d="M12 8v8M9.8 10.2c0-1 1-1.6 2.2-1.6s2.2.6 2.2 1.5c0 2-4.4 1-4.4 3.2 0 .9 1 1.6 2.2 1.6s2.2-.6 2.2-1.6" fill="none" stroke="#9a6a0c" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function CityIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 21V10h5V5h6v6h7v10z" />
      <path d="M10 8h2M10 11h2M16 14h2M5 14h1M5 17h1M16 17h2" />
    </Svg>
  );
}

export function VillageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 13l5-4 5 4M3.5 12v8h7v-8M12 11l5-4 5 4M13.5 10v10h7V10" />
      <path d="M6 20v-3h2v3M16 20v-3h2v3" />
    </Svg>
  );
}

export function JoystickIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" />
    </Svg>
  );
}

export function TapIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 11V5a2 2 0 0 1 4 0v5l4.5 1a2 2 0 0 1 1.5 2.3L18 20H10l-4-5a1.6 1.6 0 0 1 2.4-2z" />
      <path d="M5 5a5 5 0 0 1 2-3" />
    </Svg>
  );
}

export function DragIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3" />
    </Svg>
  );
}
