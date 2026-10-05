import type { ReactNode } from "react";
import { shellTranslations } from "./i18n";

export type IconName =
  | "search"
  | "arrow"
  | "lock"
  | "check"
  | "star"
  | "sound"
  | "muted"
  | "sun"
  | "book"
  | "chevron"
  | "close"
  | "sparkle"
  | "home"
  | "leaf"
  | "help"
  | "undo"
  | "reset"
  | "hand"
  | "shield"
  | "settings";

const icons: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  star: (
    <path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9Z" />
  ),
  sound: (
    <>
      <path d="M11 4 5 9H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  muted: (
    <>
      <path d="M11 4 5 9H2v6h3l6 5ZM16 9l5 6m0-6-5 6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  book: (
    <>
      <path d="M12 6C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  sparkle: (
    <>
      <path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3ZM20 2v4m-2-2h4" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v10H3Z" />
      <path d="M9 20v-7h6v7" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 3C9 2 3 7 4 14c1 8 14 10 16-11ZM4 21 15 10" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2m0 3h.01" />
    </>
  ),
  undo: (
    <>
      <path
        d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14"
        transform="translate(0 -2)"
      />
    </>
  ),
  reset: (
    <>
      <path d="M3 10a9 9 0 1 1 1 7M3 4v6h6" />
    </>
  ),
  hand: (
    <path d="M8 12V5a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-5a2 2 0 0 1 4 0v8c0 5-3 7-7 7-3 0-5-2-7-5l-3-5c-1-2 1-4 3-2l2 2Z" />
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  settings: (
    <>
      <path d="m10 3-1 3-3 1-3-1-1 4 3 2v3l-1 3 3 3 3-2h3l3 1 3-3-1-3v-3l2-3-3-3-3 1-2-2Z" />
      <circle cx="11" cy="12" r="3" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

type Animal = "fox" | "cat" | "bear";
type Color = "teal" | "yellow" | "coral";

const palettes = {
  teal: { coat: "#17645f", hat: "#33746b", band: "#154a47" },
  yellow: { coat: "#e9b547", hat: "#f0c565", band: "#bd8934" },
  coral: { coat: "#c9785e", hat: "#d88d72", band: "#a55c47" },
};

function Detective({ animal, color }: { animal: Animal; color: Color }) {
  const palette = palettes[color];
  const fur =
    animal === "fox" ? "#df9a58" : animal === "cat" ? "#c6b39b" : "#a78364";
  return (
    <g
      stroke="#213b40"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M28 119c0-24 13-39 32-39s32 15 32 39" fill={palette.coat} />
      <path d="m45 83 15 17 15-17-4-5H49Z" fill="#fffcf4" />
      <path
        d="m47 84-7 8 12 7-4 9 12 10V98Zm26 0 7 8-12 7 4 9-12 10V98Z"
        fill={palette.hat}
      />
      {animal === "bear" ? (
        <>
          <circle cx="34" cy="39" r="13" fill={fur} />
          <circle cx="85" cy="39" r="13" fill={fur} />
          <circle cx="34" cy="39" r="7" fill="#cfb193" stroke="none" />
          <circle cx="85" cy="39" r="7" fill="#cfb193" stroke="none" />
        </>
      ) : (
        <>
          <path d="M32 49 28 18l26 20m12 0 25-20-3 33" fill={fur} />
          <path
            d="m34 39-2-14 14 13m28 0 12-12-2 15"
            fill="#edc7ad"
            stroke="none"
          />
        </>
      )}
      <path
        d={
          animal === "fox"
            ? "M31 41c4-12 54-12 58 0l6 19-35 31-35-31Z"
            : "M30 43c0-21 60-21 60 0v18c0 18-16 29-30 29S30 79 30 61Z"
        }
        fill={fur}
      />
      {animal === "fox" ? (
        <path
          d="M26 58c13-3 26 6 34 13 9-8 23-16 34-13L60 87Z"
          fill="#fff3da"
          stroke="none"
        />
      ) : (
        <ellipse cx="60" cy="72" rx="19" ry="14" fill="#ebd5b9" stroke="none" />
      )}
      <path d="M45 55v4m30-4v4" strokeWidth="3.2" />
      <path d="m55 69 5 4 5-4Z" fill="#213b40" />
      <path d="M60 73v4m-5 0q5 5 10 0" fill="none" />
      <ellipse
        cx="39"
        cy="66"
        rx="4"
        ry="2.2"
        fill="#d98269"
        stroke="none"
        opacity=".6"
      />
      <ellipse
        cx="81"
        cy="66"
        rx="4"
        ry="2.2"
        fill="#d98269"
        stroke="none"
        opacity=".6"
      />
      {animal === "cat" && (
        <path d="m35 68-14-3m14 8-13 2m63-7 14-3m-14 8 13 2" fill="none" />
      )}
      <path d="M31 40c1-17 13-25 29-25s28 8 29 25" fill={palette.hat} />
      <path
        d="M60 16v23m-5-23c-8 5-11 13-11 21m21-21c8 5 11 13 11 21"
        fill="none"
        opacity=".35"
      />
      <path d="M27 40c12-6 49-6 65 0l4 7H25Z" fill={palette.band} />
      <path d="M53 39h15l9 8H43Z" fill={palette.hat} />
      <circle cx="60" cy="15" r="3" fill={palette.band} />
      <circle cx="65" cy="108" r="1.7" fill="#fffcf4" stroke="none" />
    </g>
  );
}

export function Avatar({
  animal,
  color,
  className,
}: {
  animal: Animal;
  color: Color;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <Detective animal={animal} color={color} />
    </svg>
  );
}

export function Biscuit({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M33 5c5-1 7 4 11 4 5 1 5 6 9 9 4 3 1 8 4 12 1 5-3 8-3 12-1 5-6 5-9 9-4 4-8 1-12 3-5 1-8-3-12-3-5-1-6-6-10-9-3-4-1-8-3-12-1-5 4-7 4-12 1-4 6-5 9-9 4-3 8-1 12-4Z"
        fill="#d99c52"
      />
      <path
        d="M32 6c5-1 7 4 11 4 5 1 5 6 9 9 4 3 1 8 4 12 1 5-3 7-3 11-1 4-6 4-9 8-4 3-8 0-12 2-5 1-7-3-11-3-5-1-5-6-9-9-3-4 0-8-2-12-1-5 4-6 4-10 1-4 6-4 9-8 3-2 6-1 9-4Z"
        fill="#efbe73"
        stroke="#ba7c40"
        strokeWidth="1.2"
      />
      <circle
        cx="32"
        cy="29"
        r="20"
        stroke="#f8d899"
        strokeWidth="1.2"
        strokeDasharray="2 3"
      />
      <path
        d="m23 16 5 2-2 5-5-2Zm16 8 5-2 2 5-5 3Zm-15 9 4-1 2 5-5 2Zm11 10 2-5 5 2-1 5Z"
        fill="#825839"
      />
      <path
        d="m16 29 2 1m19-15 1 2m8 19-1 2m-13-9 1 1m-15 12 2 1"
        stroke="#c38e4e"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BakeryScene({
  className,
  language = "en",
}: {
  className?: string;
  language?: "en" | "id";
}) {
  const t = shellTranslations[language];
  return (
    <svg
      className={className}
      viewBox="0 0 600 300"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="470" cy="67" r="25" fill="#f2ce70" />
      <path
        d="M75 72c-10-15 11-29 22-19 9-21 36-10 32 4 19-4 27 15 17 20H77"
        fill="#fffcf4"
        opacity=".9"
      />
      <path
        d="M383 44c-6-10 7-19 15-13 6-13 22-5 20 4 11-3 17 9 10 13h-42"
        fill="#fffcf4"
        opacity=".7"
      />
      <path d="M67 242c94-14 381-15 469 2l-21 21H89Z" fill="#cdd6bf" />
      <path
        d="M85 247h431m-394 12h63m164 0h122"
        stroke="#a7b69b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M136 241V84l25-22h215l30 22v157"
        fill="#d3a879"
        stroke="#655642"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M376 63v178h30V85Z" fill="#b68c66" />
      <path
        d="M149 81h228v160H149Z"
        fill="#f1d2a1"
        stroke="#655642"
        strokeWidth="1.8"
      />
      <path
        d="M140 81h248l-13-23H160Z"
        fill="#37695d"
        stroke="#284c44"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m160 66 215 1m-9-1 7 10m-27-10 5 10m-26-10 3 10m-29-10 1 10m-30-10-1 10m-28-10-3 10m-28-10-5 10m-25-10-5 10"
        stroke="#538174"
        strokeWidth="1.5"
      />
      <rect
        x="193"
        y="82"
        width="141"
        height="34"
        rx="3"
        fill="#fff4d9"
        stroke="#8d7152"
        strokeWidth="1.4"
      />
      <path d="M201 89h125v20H201Z" stroke="#d9bd89" />
      <text
        x="263"
        y="103"
        textAnchor="middle"
        fill="#3c6051"
        fontFamily="Georgia, serif"
        fontSize="14"
        fontWeight="bold"
        letterSpacing="2.1"
      >
        {t.bakerySign}
      </text>
      <path
        d="M149 120h228l13 31H135Z"
        fill="#fff5da"
        stroke="#3e6251"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m150 121-11 29h28l8-29Zm51 0-6 29h28l3-29Zm50 0-1 29h28l-2-29Zm50 0 4 29h28l-7-29Zm50 0 9 29h27l-11-29Z"
        fill="#4a7c66"
      />
      <path
        d="M136 150v7c0 10 16 10 17 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0 1 10 17 10 18 0v-7Z"
        fill="#fff5da"
        stroke="#3e6251"
        strokeWidth="1.5"
      />
      <path
        d="M163 171h107v57H163Z"
        fill="#517566"
        stroke="#645c44"
        strokeWidth="2"
      />
      <path d="M168 176h97v47h-97Z" fill="#c4d3ac" />
      <path
        d="m172 178 24 0-24 30m25-29h6l-30 37"
        fill="#e9ecd0"
        opacity=".6"
      />
      <path d="M217 173v53m-52-24h103" stroke="#59705b" strokeWidth="3" />
      <path
        d="M159 227h115v6H159Z"
        fill="#eee0b7"
        stroke="#8d7152"
        strokeWidth="1.5"
      />
      <path
        d="M285 165h73v76h-73Z"
        fill="#3a6657"
        stroke="#344e3e"
        strokeWidth="1.8"
      />
      <path d="M293 173h57v44h-57Z" fill="#b8ceb3" stroke="#264d3f" />
      <path
        d="m297 176 19 0-19 25m21-25h6l-27 33"
        fill="#d9e2c5"
        opacity=".6"
      />
      <path
        d="M322 174v41m-27-19h53M293 226h57v10h-57Z"
        stroke="#567a61"
        strokeWidth="2"
      />
      <circle cx="347" cy="222" r="2" fill="#e8c985" />
      <path d="M311 193v-7m23 7v-7" stroke="#456651" strokeWidth="1" />
      <rect
        x="305"
        y="191"
        width="35"
        height="15"
        rx="1"
        fill="#fff1ce"
        stroke="#456651"
      />
      <text
        x="322.5"
        y="201.5"
        textAnchor="middle"
        fill="#416451"
        fontFamily="Georgia, serif"
        fontSize="8"
        letterSpacing="1"
      >
        {t.openSign}
      </text>
      <path d="M279 241h87v5h-87Z" fill="#9b967b" />
      <g fill="#d39a51" stroke="#aa7948" strokeWidth="1">
        <circle cx="181" cy="213" r="7" />
        <circle cx="198" cy="213" r="7" />
        <circle cx="230" cy="213" r="7" />
        <circle cx="247" cy="213" r="7" />
        <path d="M176 195q-3-10 5-10 7-1 9 10Zm17 0q-3-10 5-10 7-1 9 10Zm39 0q-4-11 5-11 8 0 10 11Z" />
      </g>
      <path
        d="m179 212 1 1m4 2h1m12-5v1m2 5h1m28-6 1 1m3 3h1m13-3v1m-2 4h1m-66-25 1 2m16-3 2 3m37-3 1 2"
        stroke="#855d39"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M170 221h39m15 0h32m-83-24h38m15 0h30"
        stroke="#f4e4bd"
        strokeWidth="2"
      />
      <path
        d="M149 239h17m2-76h14m82 74h11m90-59h10m-12 7h6m-215 31h7"
        stroke="#d3af7d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M107 224c1-22 0-44 6-60m-4 42c-12-6-20-5-21-19 14 0 21 8 21 19Zm1-16c-4-15 2-26 12-29 4 14-1 22-12 29Zm-1 24c13-3 23-14 21-26-15 3-22 12-21 26Z"
        fill="#5e8261"
        stroke="#496c50"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m95 218 5 26h22l5-26Z"
        fill="#c68260"
        stroke="#93684e"
        strokeWidth="1.5"
      />
      <path
        d="M92 218h37v6H92Z"
        fill="#dca47d"
        stroke="#93684e"
        strokeWidth="1.5"
      />
      <path
        d="M392 245c-5-10-2-16 4-20-1 9 3 12 4 18 0-10 4-17 11-18-2 9-5 15-11 21"
        fill="#718a62"
      />
      <ellipse cx="459" cy="247" rx="38" ry="7" fill="#acbca2" opacity=".65" />
      <path
        d="M460 221c32-3 37-27 24-32 4 14-16 10-21 19"
        fill="#dc9859"
        stroke="#5d5540"
        strokeWidth="1.3"
      />
      <path d="M484 189c7 4 9 12 2 20l-5-5c6-5 6-8 3-15" fill="#fff0d4" />
      <g transform="translate(414 133) scale(.76)">
        <path
          d="m44 114-1 22H29q-3-9 8-12v-12m39 2 3 22h14q3-9-8-12v-12"
          fill="#305448"
          stroke="#213b40"
          strokeWidth="1.7"
        />
        <Detective animal="fox" color="teal" />
        <path
          d="M34 95q-16 6-12 22l7 1 8-14m48-9 15-7 4 6-15 14"
          fill="#33746b"
          stroke="#213b40"
          strokeWidth="1.7"
        />
        <path
          d="m104 86 9-16"
          stroke="#213b40"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle
          cx="120"
          cy="58"
          r="17"
          fill="#eff3db"
          fillOpacity=".75"
          stroke="#213b40"
          strokeWidth="3.5"
        />
        <path
          d="m112 57 8-8m-6 14 12-12"
          stroke="#fffcf4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse
          cx="102"
          cy="91"
          rx="7"
          ry="6"
          fill="#df9a58"
          stroke="#213b40"
          strokeWidth="1.5"
        />
      </g>
      <path
        d="m492 128 3-9m8 18 8-4m-26-17-2-7"
        stroke="#dfb452"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m73 231 4-4m2 8 5-1m427-26 4 2m-7 4 2 4"
        stroke="#8fa082"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M192 249q2-3 5 0m8 3q2-3 5 0m9-4q2-3 5 0"
        stroke="#988a69"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
