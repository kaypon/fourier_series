import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { evaluate, recipeTerms } from "@/lib/fourier";

export const alt = "FOURIER: a chain of spinning circles drawing a square wave.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f2f2f0";
const INK = "#191611";
const MUTED = "#756b59";

/* A still of the playground: five circles mid-turn and the wave they've
   drawn, in the site's paper-and-ink look. */
function drawing() {
  const terms = recipeTerms("square", 5);
  const phase = 0.9;
  const scale = 112;
  const cx = 150;
  const cy = 160;
  const waveX = cx + scale + 46;
  const end = 1080;
  const pxPerRad = (end - waveX) / (4.4 * Math.PI);

  const circles: { x: number; y: number; r: number }[] = [];
  const arms: string[] = [];
  let x = cx;
  let y = cy;
  for (const { amp, freq } of terms) {
    circles.push({ x, y, r: amp * scale });
    const nx = x + amp * scale * Math.cos(freq * phase);
    const ny = y - amp * scale * Math.sin(freq * phase);
    arms.push(`M${x.toFixed(1)} ${y.toFixed(1)} L${nx.toFixed(1)} ${ny.toFixed(1)}`);
    x = nx;
    y = ny;
  }

  let wave = "";
  for (let px = waveX; px <= end; px += 2) {
    const py = cy - evaluate(terms, phase - (px - waveX) / pxPerRad) * scale;
    wave += `${px === waveX ? "M" : "L"}${px} ${py.toFixed(1)} `;
  }

  return { circles, arms, wave, tip: { x, y }, cy, waveX, end };
}

export default async function Image() {
  const [display, mono] = await Promise.all([
    readFile(join(process.cwd(), "assets/ArchivoBlack-Regular.ttf")),
    readFile(join(process.cwd(), "assets/DejaVuSansMono-Bold.ttf")),
  ]);
  const d = drawing();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 60px 50px",
          background: PAPER,
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Archivo Black", fontSize: 112, lineHeight: 0.9 }}>/FOURIER</div>
          <div style={{ fontFamily: "DejaVu Mono", fontSize: 24, color: MUTED, marginTop: 18, letterSpacing: 2 }}>
            SPINNING CIRCLES THAT ADD UP TO A SQUARE WAVE
          </div>
        </div>
        <svg width="1080" height="320" viewBox="0 0 1080 320">
          <line x1="0" y1={d.cy} x2="1080" y2={d.cy} stroke={MUTED} strokeOpacity="0.3" strokeWidth="1.5" />
          {d.circles.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="none" stroke={MUTED} strokeOpacity="0.55" strokeWidth="2" />
          ))}
          {d.arms.map((a, i) => (
            <path key={i} d={a} stroke={INK} strokeWidth="3" />
          ))}
          <line
            x1={d.tip.x}
            y1={d.tip.y}
            x2={d.waveX}
            y2={d.tip.y}
            stroke={MUTED}
            strokeOpacity="0.6"
            strokeWidth="2"
            strokeDasharray="6 7"
          />
          <path d={d.wave} fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <circle cx={d.tip.x} cy={d.tip.y} r="7" fill={INK} />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "DejaVu Mono", fontSize: 26 }}>
          <span>1·sin(1x) + 1/3·sin(3x) + 1/5·sin(5x) + …</span>
          <span style={{ color: MUTED }}>[ VAN ]</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo Black", data: display, style: "normal", weight: 400 },
        { name: "DejaVu Mono", data: mono, style: "normal", weight: 700 },
      ],
    },
  );
}
