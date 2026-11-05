import { useId } from "react";

type Body = "sedan" | "suv" | "hatch" | "van";

const BODY: Record<Body, { body: string; win1: string; win2: string; wheels: [number, number] }> = {
  sedan: {
    body: "M18,86 L18,70 Q20,61 38,59 L92,55 L124,35 Q131,31 144,31 L204,31 Q214,31 222,37 L252,55 L290,60 Q303,62 303,74 L303,86 Z",
    win1: "M102,55 L128,38 L168,38 L168,55 Z",
    win2: "M175,38 L204,38 Q211,38 216,42 L238,55 L175,55 Z",
    wheels: [78, 244],
  },
  suv: {
    body: "M18,88 L18,62 Q19,54 30,52 L40,24 Q43,20 52,20 L210,20 Q222,20 230,28 L256,50 L292,56 Q304,58 304,70 L304,88 Z",
    win1: "M48,50 L56,27 L118,27 L118,50 Z",
    win2: "M125,27 L208,27 Q216,27 222,33 L242,50 L125,50 Z",
    wheels: [78, 246],
  },
  van: {
    body: "M16,88 L16,30 Q16,16 32,16 L218,16 Q232,16 242,28 L266,52 L294,58 Q305,60 305,72 L305,88 Z",
    win1: "M30,48 L30,28 Q30,23 36,23 L150,23 L150,48 Z",
    win2: "M224,24 Q232,24 238,31 L258,52 L224,52 Z",
    wheels: [72, 250],
  },
  hatch: {
    body: "M20,86 L20,58 Q21,50 32,47 L84,30 Q90,28 98,28 L190,28 Q204,28 214,36 L250,56 L290,61 Q303,63 303,74 L303,86 Z",
    win1: "M50,53 L56,48 L90,36 L120,36 L120,53 Z",
    win2: "M127,36 L196,36 Q205,36 212,42 L234,54 L127,54 Z",
    wheels: [78, 244],
  },
};

export function CarArt({ color, body = "sedan", className = "" }: { color: string; body?: Body; className?: string }) {
  const id = useId().replace(/:/g, "");
  const b = BODY[body];
  return (
    <svg viewBox="0 0 320 112" className={className} role="img" aria-label="Maşın təsviri">
      <defs>
        <linearGradient id={`hl${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`gl${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9fb7cc" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0b1220" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`sh${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.7" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="100" rx="150" ry="9" fill={`url(#sh${id})`} />
      {b.wheels.map((x) => (
        <circle key={`a${x}`} cx={x} cy={84} r={25} fill="#07080a" />
      ))}
      <path d={b.body} fill={color} />
      <path d={b.body} fill={`url(#hl${id})`} />
      <path d={b.win1} fill={`url(#gl${id})`} />
      <path d={b.win2} fill={`url(#gl${id})`} />
      {/* door line + handle */}
      <path d="M172,58 L172,84" stroke="#000" strokeOpacity="0.25" strokeWidth="1.2" />
      <rect x="150" y="63" width="12" height="2.5" rx="1.2" fill="#000" fillOpacity="0.3" />
      <rect x="194" y="63" width="12" height="2.5" rx="1.2" fill="#000" fillOpacity="0.3" />
      {/* lights */}
      <path d="M292,64 L303,66 L303,72 L290,70 Z" fill="#fff6d5" />
      <rect x="18" y="64" width="7" height="8" rx="2" fill="#e11d2e" />
      {b.wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy={86} r={20} fill="#111" />
          <circle cx={x} cy={86} r={13} fill="#7d8590" />
          <circle cx={x} cy={86} r={13} fill="none" stroke="#2b3036" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx={x} cy={86} r={4} fill="#2b3036" />
        </g>
      ))}
    </svg>
  );
}
