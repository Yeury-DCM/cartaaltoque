import React, { useMemo } from "react";
import QRCode from "qrcode";

/** QR real (síncrono, en SVG) para que se vea nítido a cualquier escala. */
export const Qr: React.FC<{ text: string; size: number; dark?: string; light?: string }> = ({
  text,
  size,
  dark = "#0D0D0D",
  light = "#FFFFFF",
}) => {
  const { n, cells } = useMemo(() => {
    const q = QRCode.create(text, { errorCorrectionLevel: "M" });
    const n = q.modules.size;
    const cells: [number, number][] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules.get(x, y)) cells.push([x, y]);
    return { n, cells };
  }, [text]);
  const m = 1; // margen en módulos
  return (
    <svg width={size} height={size} viewBox={`${-m} ${-m} ${n + 2 * m} ${n + 2 * m}`} shapeRendering="crispEdges">
      <rect x={-m} y={-m} width={n + 2 * m} height={n + 2 * m} fill={light} />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={dark} />
      ))}
    </svg>
  );
};
