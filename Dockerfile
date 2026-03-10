FROM node:22-slim

# Install Python3 + pip for yt-dlp, and deno for yt-dlp JS runtime
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv curl unzip && \
    pip3 install --break-system-packages yt-dlp && \
    curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace root
COPY package.json package-lock.json* ./
COPY shared/ ./shared/
COPY server/ ./server/

# Install dependencies
RUN npm install --workspace=shared --workspace=server

# Build shared + server
RUN npm run build --workspace=shared 2>/dev/null || true
RUN cd server && npx tsc || true

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Start with tsx for ESM compatibility (tsc output can have .js extension issues)
CMD ["npx", "--workspace=server", "tsx", "server/src/index.ts"]
