# List available project commands.
default:
    @just --list

# Start the Vite dev server on localhost.
dev:
    pnpm dev

# Run the dev server on this project's named tailnet route.
dev-share *name:
    #!/usr/bin/env bash
    set -euo pipefail
    port="$(dev-route port {{name}})"
    host="$(dev-route list-named | awk -v t="http://127.0.0.1:$port" '$2 == t { sub(/^https:\/\//, "", $1); print $1 }')"
    export __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="$host"
    exec pnpm dev --port "$port" --host 127.0.0.1 --strictPort

# Typecheck and build the static site into dist/.
build:
    pnpm build

# Serve the built dist/ locally to check the production build.
preview:
    pnpm preview

# Regenerate the bundled Material Symbols after using a new icon name.
icons:
    pnpm gen:icons

# Recapture the vision-api and viewport-find screenshots into /tmp/portfolio-shots.
capture *which:
    NODE_PATH="$HOME/projects/capital-crm/node_modules" node tools/capture.cjs {{which}}
