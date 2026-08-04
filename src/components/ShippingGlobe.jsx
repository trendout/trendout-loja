import React from "react";
import { T } from "../lib/theme";

// Pontos aproximados, num layout estilizado (não é uma projeção geográfica
// exata — é uma ilustração, pensada para ficar bonita e clara, não um mapa).
const PORTO = { x: 150, y: 330 };
const DESTINATIONS = [
  { name: "Espanha", x: 240, y: 300 },
  { name: "França", x: 320, y: 220 },
  { name: "Alemanha", x: 420, y: 160 },
  { name: "Itália", x: 400, y: 300 },
  { name: "Países Baixos", x: 360, y: 120 },
];

function curvePath(from, to) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - 40; // arco para cima, como uma rota de avião
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

export default function ShippingGlobe() {
  return (
    <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 16, padding: "32px 16px", marginBottom: 32, overflow: "hidden", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
      <svg viewBox="0 0 600 420" style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <radialGradient id="globeGradient" cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor={T.bgRaised2} />
            <stop offset="100%" stopColor={T.bg} />
          </radialGradient>
        </defs>

        {/* o "globo" — um círculo com linhas de latitude/longitude, estilo wireframe */}
        <circle cx="300" cy="230" r="190" fill="url(#globeGradient)" stroke={T.border} strokeWidth="1.5" />
        {[-120, -60, 0, 60, 120].map((dx) => (
          <ellipse key={dx} cx="300" cy="230" rx={Math.abs(dx) < 190 ? Math.sqrt(190 * 190 - dx * dx) : 0} ry="190" fill="none" stroke={T.border} strokeWidth="0.7" opacity="0.5" transform={`translate(${dx} 0)`} />
        ))}
        {[-120, -60, 0, 60, 120].map((dy) => (
          <ellipse key={dy} cx="300" cy="230" rx="190" ry={Math.abs(dy) < 190 ? Math.sqrt(190 * 190 - dy * dy) * 0.35 : 0} fill="none" stroke={T.border} strokeWidth="0.7" opacity="0.5" transform={`translate(0 ${dy})`} />
        ))}

        {/* linhas animadas do Porto para cada mercado */}
        {DESTINATIONS.map((d, i) => (
          <path
            key={d.name}
            d={curvePath(PORTO, d)}
            fill="none"
            stroke={T.accent}
            strokeWidth="1.8"
            strokeDasharray="6 5"
            className="shipping-route"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}

        {/* ponto de origem — Porto */}
        <circle cx={PORTO.x} cy={PORTO.y} r="6" fill={T.accent} />
        <circle cx={PORTO.x} cy={PORTO.y} r="6" fill={T.accent} className="pulse-dot" />
        <text x={PORTO.x} y={PORTO.y + 24} textAnchor="middle" fill={T.text} fontSize="16" fontWeight="700">Porto</text>

        {/* pontos de destino */}
        {DESTINATIONS.map((d, i) => (
          <g key={d.name}>
            <circle cx={d.x} cy={d.y} r="4.5" fill={T.text} />
            <circle cx={d.x} cy={d.y} r="4.5" fill={T.text} className="pulse-dot" style={{ animationDelay: `${i * 0.3 + 1}s` }} />
            <text x={d.x} y={d.y - 12} textAnchor="middle" fill={T.muted} fontSize="14">{d.name}</text>
          </g>
        ))}
      </svg>

      <style>{`
        .shipping-route {
          animation: flow-dash 1.8s linear infinite;
        }
        @keyframes flow-dash {
          to { stroke-dashoffset: -22; }
        }
        .pulse-dot {
          animation: pulse-ring 2.4s ease-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes pulse-ring {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(3.2); }
        }
      `}</style>
    </div>
  );
}
