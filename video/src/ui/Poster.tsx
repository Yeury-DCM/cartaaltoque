import React from "react";
import { Img, staticFile } from "remotion";
import { FONT } from "../theme";
import { Qr } from "./Qr";
import { RESTAURANT } from "./data";

export const POSTER = { w: 1240, h: 1748, qr: { x: 210, y: 422, size: 820 } } as const;
export const MENU_URL = "https://cartaaltoque.com/r/demo";

/**
 * Afiche A5 de la mesa: el mismo que genera la app en app.qr.tsx (renderPoster), sin logo
 * del restaurante, dibujado con DOM en 1240×1748 lógicos.
 */
export const Poster: React.FC<{ color?: string }> = ({ color = "#FF7101" }) => (
  <div style={{ position: "relative", width: POSTER.w, height: POSTER.h, background: "#FFFFFF", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: POSTER.w, height: 90, background: color }} />
    <div
      style={{
        position: "absolute",
        top: 190,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT.display,
        fontSize: 132,
        lineHeight: 1,
        color: "#111111",
      }}
    >
      {RESTAURANT.toUpperCase()}
    </div>
    <div style={{ position: "absolute", top: 340, width: "100%", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 44, color: "#444444" }}>
      Escanea para ver el menú
    </div>
    <div style={{ position: "absolute", left: POSTER.qr.x, top: POSTER.qr.y }}>
      <Qr text={MENU_URL} size={POSTER.qr.size} />
    </div>
    <div style={{ position: "absolute", top: POSTER.qr.y + POSTER.qr.size + 36, width: "100%", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color }}>
      y mira todo lo que tenemos
    </div>
    <div style={{ position: "absolute", top: POSTER.h - 136, width: "100%", textAlign: "center", fontFamily: FONT.body, fontSize: 24, color: "#999999" }}>
      Menú hecho con
    </div>
    <Img
      src={staticFile("brand/logo-claro.png")}
      style={{ position: "absolute", top: POSTER.h - 98, left: (POSTER.w - (900 / 319) * 64) / 2, height: 64 }}
    />
  </div>
);
