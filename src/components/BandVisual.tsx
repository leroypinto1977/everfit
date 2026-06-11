"use client";

/**
 * Stylized EVHERFIT Pulse band rendered in SVG — indigo strap per the
 * brand book, pink (Palette W) accents on screen. `screen` switches what
 * the display shows so scroll sections can drive it.
 */
export type BandScreen = "heart" | "sleep" | "cycle" | "spo2" | "battery";

const ACCENT = "#ef6fa7";
const TEXT = "#f4f5fa";
const DIM = "#9aa0c3";

export default function BandVisual({
  screen = "heart",
  className,
}: {
  screen?: BandScreen;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="EVHERFIT Pulse fitness band"
    >
      <defs>
        <linearGradient id="strap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a4496" />
          <stop offset="50%" stopColor="#272e6b" />
          <stop offset="100%" stopColor="#323b88" />
        </linearGradient>
        <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a548f" />
          <stop offset="15%" stopColor="#1a2046" />
          <stop offset="85%" stopColor="#0d1129" />
          <stop offset="100%" stopColor="#39427c" />
        </linearGradient>
        <radialGradient id="screenGlow" cx="0.5" cy="0.35" r="0.9">
          <stop offset="0%" stopColor="#131735" />
          <stop offset="100%" stopColor="#06081a" />
        </radialGradient>
        <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* top strap */}
      <path d="M118 0 h84 c4 0 7 3 7 7 v118 h-98 V7 c0-4 3-7 7-7 Z" fill="url(#strap)" />
      {[24, 48, 72, 96].map((y) => (
        <rect key={y} x="138" y={y} width="44" height="5" rx="2.5" fill="#1f2557" />
      ))}
      {/* infinity mark embossed on strap */}
      <g transform="translate(141 58) scale(0.32)" opacity="0.55">
        <path
          d="M60 30 C 47 8 14 7 14 30 C 14 53 47 52 60 30 C 73 8 106 7 106 30 C 106 53 73 52 60 30"
          stroke="#ffffff"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* bottom strap */}
      <path d="M111 435 h98 v118 c0 4-3 7-7 7 h-84 c-4 0-7-3-7-7 V435 Z" fill="url(#strap)" />
      {[464, 488, 512, 536].map((y) => (
        <rect key={y} x="138" y={y} width="44" height="5" rx="2.5" fill="#1f2557" />
      ))}

      {/* watch body */}
      <rect x="76" y="108" width="168" height="344" rx="56" fill="url(#bezel)" />
      <rect x="86" y="118" width="148" height="324" rx="48" fill="#070a1d" />

      {/* side button */}
      <rect x="244" y="248" width="8" height="56" rx="4" fill="#4a548f" />

      {/* screen */}
      <rect x="98" y="132" width="124" height="296" rx="38" fill="url(#screenGlow)" />

      {screen === "heart" && (
        <g>
          <text x="160" y="200" textAnchor="middle" fill={DIM} fontSize="15" fontFamily="var(--font-display)" letterSpacing="3">
            HEART RATE
          </text>
          <text x="160" y="262" textAnchor="middle" fill={TEXT} fontSize="52" fontWeight="700" fontFamily="var(--font-display)">
            142
          </text>
          <text x="160" y="288" textAnchor="middle" fill={ACCENT} fontSize="14" fontFamily="var(--font-display)" letterSpacing="2">
            BPM · ZONE 4
          </text>
          <path
            className="ecg-path"
            d="M104 348 h22 l8 -14 l10 26 l12 -58 l12 74 l10 -42 l8 14 h22 l8 -12 l10 22 l12 -50"
            stroke={ACCENT}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {screen === "sleep" && (
        <g>
          <text x="160" y="196" textAnchor="middle" fill={DIM} fontSize="15" fontFamily="var(--font-display)" letterSpacing="3">
            SLEEP SCORE
          </text>
          <circle cx="160" cy="282" r="56" stroke="#23295c" strokeWidth="10" fill="none" />
          <circle
            cx="160"
            cy="282"
            r="56"
            stroke={ACCENT}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="352"
            strokeDashoffset="42"
            transform="rotate(-90 160 282)"
          />
          <text x="160" y="294" textAnchor="middle" fill={TEXT} fontSize="40" fontWeight="700" fontFamily="var(--font-display)">
            88
          </text>
          <text x="160" y="384" textAnchor="middle" fill={DIM} fontSize="14" fontFamily="var(--font-display)" letterSpacing="2">
            7H 42M · DEEP 22%
          </text>
        </g>
      )}

      {screen === "cycle" && (
        <g>
          <text x="160" y="196" textAnchor="middle" fill={DIM} fontSize="15" fontFamily="var(--font-display)" letterSpacing="3">
            CYCLE
          </text>
          {/* 28-day ring, phase arc highlighted */}
          <circle cx="160" cy="282" r="56" stroke="#23295c" strokeWidth="10" fill="none" />
          <circle
            cx="160"
            cy="282"
            r="56"
            stroke={ACCENT}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="352"
            strokeDashoffset="176"
            transform="rotate(-90 160 282)"
          />
          <text x="160" y="272" textAnchor="middle" fill={TEXT} fontSize="30" fontWeight="700" fontFamily="var(--font-display)">
            DAY 14
          </text>
          <text x="160" y="298" textAnchor="middle" fill={ACCENT} fontSize="13" fontFamily="var(--font-display)" letterSpacing="2">
            OVULATION
          </text>
          <text x="160" y="384" textAnchor="middle" fill={DIM} fontSize="13" fontFamily="var(--font-display)" letterSpacing="2">
            NEXT PHASE · 3 DAYS
          </text>
        </g>
      )}

      {screen === "spo2" && (
        <g>
          <text x="160" y="200" textAnchor="middle" fill={DIM} fontSize="15" fontFamily="var(--font-display)" letterSpacing="3">
            BLOOD OXYGEN
          </text>
          <text x="160" y="270" textAnchor="middle" fill={TEXT} fontSize="52" fontWeight="700" fontFamily="var(--font-display)">
            98%
          </text>
          <text x="160" y="298" textAnchor="middle" fill={ACCENT} fontSize="14" fontFamily="var(--font-display)" letterSpacing="2">
            SPO2 · NORMAL
          </text>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect
              key={i}
              x={112 + i * 14}
              y={356 - (i % 3) * 10 - 8}
              width="8"
              height={20 + (i % 3) * 10}
              rx="4"
              fill={i < 6 ? ACCENT : "#23295c"}
              opacity={0.4 + (i % 3) * 0.3}
            />
          ))}
        </g>
      )}

      {screen === "battery" && (
        <g>
          <text x="160" y="200" textAnchor="middle" fill={DIM} fontSize="15" fontFamily="var(--font-display)" letterSpacing="3">
            BATTERY
          </text>
          <text x="160" y="266" textAnchor="middle" fill={TEXT} fontSize="48" fontWeight="700" fontFamily="var(--font-display)">
            14
          </text>
          <text x="160" y="294" textAnchor="middle" fill={ACCENT} fontSize="14" fontFamily="var(--font-display)" letterSpacing="2">
            DAYS REMAINING
          </text>
          <rect x="118" y="330" width="84" height="34" rx="8" stroke="#4a548f" strokeWidth="3" fill="none" />
          <rect x="202" y="340" width="6" height="14" rx="2" fill="#4a548f" />
          <rect x="124" y="336" width="64" height="22" rx="5" fill={ACCENT} />
        </g>
      )}

      {/* glass reflection */}
      <path
        d="M110 150 q60 -16 100 8 q-10 60 -52 78 q-50 -18 -48 -86 Z"
        fill="#ffffff"
        opacity="0.045"
        filter="url(#soft)"
      />
    </svg>
  );
}
