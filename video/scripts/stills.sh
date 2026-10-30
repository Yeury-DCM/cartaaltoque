#!/usr/bin/env bash
# uso: scripts/stills.sh <Composicion> <outdir> <frame1> [frame2 ...]   (usa el bundle en ./build)
comp=$1; out=$2; shift 2
mkdir -p "$out"
for fr in "$@"; do
  npx remotion still build "$comp" "$out/${comp}_$fr.jpg" --frame=$fr --scale=0.5 --log=error >/dev/null 2>&1 || echo "fail $comp $fr"
done
