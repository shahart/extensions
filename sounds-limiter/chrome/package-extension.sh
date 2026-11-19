#!/bin/sh
set -eu

version=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -n 1)
if [ -z "$version" ]; then
  echo "Could not read version from manifest.json" >&2
  exit 1
fi

output="url-volume-limiter-v${version}.zip"
zip -q -FS "$output" manifest.json service-worker.js volume-limiter.js volume-limiter-main.js popup.html popup.css popup.js icons/icon-128.png
echo "Created $output"
