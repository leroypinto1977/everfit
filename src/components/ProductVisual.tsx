"use client";

/**
 * The EVHERFIT Infinity Band — a weighted resistance band (pair), drawn in
 * SVG. `view` switches the angle so scroll sections can drive it:
 *   loop  — wrapped as worn (wrist/ankle)
 *   core  — cutaway showing the iron-sand fill
 *   strap — flat band showing the D-ring + velcro lock
 *   pair  — both bands of the pair
 */
export type ProductView = "loop" | "core" | "strap" | "pair";

const INDIGO = "#2b337d";
const INDIGO_DARK = "#232a68";
const INDIGO_LIGHT = "#3a4496";
const INK = "#282828";
const PINK = "#e56ca5";

// Round trig-derived coordinates so SSR and client serialize identically
// (raw doubles differ in their last digits and cause hydration mismatches).
const round = (n: number) => Math.round(n * 100) / 100;

function Pods({ count = 6, y = 200, w = 360, x = 60 }: { count?: number; y?: number; w?: number; x?: number }) {
  const podW = (w / count) * 0.78;
  const gap = (w - podW * count) / (count - 1);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={x + i * (podW + gap)}
          y={y}
          width={podW}
          height={80}
          rx={20}
          fill="url(#podGrad)"
        />
      ))}
    </g>
  );
}

function FlatBand({ children }: { children?: React.ReactNode }) {
  return (
    <g filter="url(#drop)">
      {/* velcro tail */}
      <rect x="300" y="208" width="150" height="64" rx="18" fill={INDIGO_DARK} />
      {Array.from({ length: 5 }, (_, i) => (
        <line key={i} x1={318 + i * 26} y1="216" x2={318 + i * 26} y2="264" stroke={INDIGO_LIGHT} strokeWidth="3" strokeDasharray="4 5" />
      ))}
      {/* D-ring */}
      <rect x="20" y="206" width="34" height="68" rx="14" fill="none" stroke="#9aa1b8" strokeWidth="9" />
      {/* main band */}
      <rect x="48" y="192" width="312" height="96" rx="26" fill="url(#bandGrad)" />
      {/* pink stitching */}
      <rect x="56" y="200" width="296" height="80" rx="20" fill="none" stroke={PINK} strokeWidth="2" strokeDasharray="7 6" opacity="0.85" />
      {/* weight pods */}
      <Pods count={5} x={72} w={264} y={208} />
      {/* wordmark */}
      <text x="204" y="246" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="700" fontStyle="italic" fontFamily="var(--font-display)" letterSpacing="2">
        EVHERFIT
      </text>
      {children}
    </g>
  );
}

export default function ProductVisual({
  view = "loop",
  className,
}: {
  view?: ProductView;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="EVHERFIT Infinity Band weighted resistance band"
    >
      <defs>
        <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={INDIGO_LIGHT} />
          <stop offset="55%" stopColor={INDIGO} />
          <stop offset="100%" stopColor={INDIGO_DARK} />
        </linearGradient>
        <linearGradient id="podGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a55a8" />
          <stop offset="100%" stopColor={INDIGO_DARK} />
        </linearGradient>
        <radialGradient id="sandGrad" cx="0.4" cy="0.35" r="1">
          <stop offset="0%" stopColor="#56586a" />
          <stop offset="100%" stopColor={INK} />
        </radialGradient>
        <filter id="drop" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor={INDIGO} floodOpacity="0.22" />
        </filter>
      </defs>

      {view === "loop" && (
        <g filter="url(#drop)">
          {/* wrapped band as a ring of pods */}
          <path
            fillRule="evenodd"
            d="M240 70 a170 160 0 1 0 0.01 0 Z M240 152 a88 80 0 1 1 -0.01 0 Z"
            fill="url(#bandGrad)"
          />
          {/* segment pods around the ring */}
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const cx = round(240 + Math.cos(a) * 129);
            const cy = round(230 + Math.sin(a) * 120);
            return (
              <ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx="30"
                ry="44"
                fill="url(#podGrad)"
                transform={`rotate(${round((a * 180) / Math.PI + 90)} ${cx} ${cy})`}
              />
            );
          })}
          {/* pink stitch rings */}
          <ellipse cx="240" cy="230" rx="153" ry="143" fill="none" stroke={PINK} strokeWidth="2" strokeDasharray="8 7" opacity="0.7" />
          {/* clasp with infinity mark */}
          <rect x="196" y="348" width="88" height="48" rx="16" fill={INK} />
          <path
            transform="translate(216 363) scale(0.14)"
            fill="#ffffff"
            d="M50.78,98.93c10.25,12.74,30.72,14.23,48.44,6,31.39-14.59,81.6-63.9,114.97-84.7,85.17-53.09,167.38,23.35,108.98,94.2-44.3,53.74-123.8,46.32-150.24-1.91l34.94-27.37c16.77,17.04,38.11,41.42,70.54,18.9,40.57-28.18,9.96-82.3-40.21-54.24-43.14,24.13-97.67,86.57-145.25,97.07C-.43,167.48-35.92,65.34,45.16,15.76c49.97-30.56,102.88-13.81,123.69,25.49l-34.63,25.85c-4.24.59-15.63-16.64-20.11-19.87-35.76-25.85-87.59,21.52-63.33,51.69Z"
          />
        </g>
      )}

      {view === "strap" && <FlatBand />}

      {view === "core" && (
        <g>
          <FlatBand />
          {/* magnified cutaway of one pod */}
          <g filter="url(#drop)">
            <circle cx="240" cy="356" r="86" fill="url(#sandGrad)" stroke="#ffffff" strokeWidth="8" />
            {/* iron sand grains */}
            {Array.from({ length: 64 }, (_, i) => {
              const a = (i * 137.5 * Math.PI) / 180; // golden-angle spiral
              const r = 8 + (i / 64) * 68;
              return (
                <circle
                  key={i}
                  cx={round(240 + Math.cos(a) * r)}
                  cy={round(356 + Math.sin(a) * r * 0.92)}
                  r={2.4 + (i % 3)}
                  fill={i % 4 === 0 ? "#8d93ad" : "#5a5d6e"}
                />
              );
            })}
          </g>
          {/* callout line from pod to magnifier */}
          <line x1="204" y1="282" x2="222" y2="300" stroke={INK} strokeWidth="2.5" strokeDasharray="5 5" />
        </g>
      )}

      {view === "pair" && (
        <g>
          {/* back band (ink colorway, rotated) */}
          <g transform="rotate(-10 240 200) translate(0 -64)" filter="url(#drop)">
            <rect x="48" y="192" width="312" height="96" rx="26" fill={INK} />
            <rect x="56" y="200" width="296" height="80" rx="20" fill="none" stroke={PINK} strokeWidth="2" strokeDasharray="7 6" opacity="0.7" />
            {Array.from({ length: 5 }, (_, i) => (
              <rect key={i} x={72 + i * 56} y={208} width={44} height={80} rx={20} fill="#3a3a3a" />
            ))}
            <text x="204" y="246" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="700" fontStyle="italic" fontFamily="var(--font-display)" letterSpacing="2">
              EVHERFIT
            </text>
          </g>
          {/* front band (indigo) */}
          <g transform="rotate(6 240 320) translate(0 96)">
            <FlatBand />
          </g>
        </g>
      )}
    </svg>
  );
}
