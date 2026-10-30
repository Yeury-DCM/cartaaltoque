# Carta al Toque: anuncio vertical (Remotion)

1080×1920 · 30 fps. `CartaAd` dura 18 s (E1–E5) y `CartaAd15`, 15,1 s (sin E4). Cada escena también es una composición propia para hacer QA (`E1-Gancho` … `E5-Cierre`).

Proyecto independiente: no importa nada de la app. Las pantallas (`src/ui/`) son copias adaptadas de `src/components/landing/` de la app, sin animaciones CSS: todo se calcula desde `useCurrentFrame`.

## Estructura

- `src/timeline.json`: fuente única de tiempos. Contiene la duración de cada escena, los `cues` (golpes visuales que usan las escenas y los SFX), los tramos de la voz, la música y los montajes. Lo leen Remotion y `scripts/build_audio.py`.
- `src/timeline.ts`: tipos, helpers y subtítulos palabra por palabra (máx. 7 palabras por página).
- `src/theme.ts`: tokens de marca y fuentes. `src/styles.css`: tokens de Tailwind copiados de la app.
- `src/scenes/`: las escenas E1…E5. `src/components/`: subtítulos, titulares y SFX (`SceneSfx.tsx` = efectos de cada escena).
- `assets-src/`: voz original (`voice/voz.mp3`, con sus tiempos por palabra en `words.json`) y música sin procesar. `public/audio/`: audio listo para el render.

## Comandos

```console
npm install
npm run dev
```

Tiempos por palabra de una voz nueva (faster-whisper con el modelo `small` local). Después hay que ajustar los inicios contra los silencios y pasarlos a `timeline.json` y `timeline.ts`:

```console
python scripts/words.py assets-src/voice/voz.mp3 > assets-src/voice/words.json
```

Audio (voz por tramos y música de cada montaje con ducking), después de cambiar `timeline.json`:

```console
python scripts/build_audio.py ffmpeg
```

Hace falta un ffmpeg completo, con `f32le` y `loudnorm`. El que trae `@remotion/compositor` no sirve.

Render y masterizado (−14 LUFS, −1 dBTP):

```console
npx remotion bundle
npx remotion render build CartaAd out/carta-al-toque-18s_raw.mp4 --codec=h264 --crf=15 --audio-bitrate=320k
python scripts/master.py ffmpeg out/carta-al-toque-18s_raw.mp4 out/carta-al-toque-18s.mp4
npx remotion render build CartaAd15 out/carta-al-toque-15s_raw.mp4 --codec=h264 --crf=15 --audio-bitrate=320k
python scripts/master.py ffmpeg out/carta-al-toque-15s_raw.mp4 out/carta-al-toque-15s.mp4
```

Fotogramas de QA (usan el bundle de `build/`):

```console
bash scripts/stills.sh E2-Dueno out/qa 20 45 90
```

Licencias en `ATTRIBUTIONS.md`.
