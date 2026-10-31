FROM node:20-bookworm-slim

# Install native stockfish binary
RUN apt-get update && \
    apt-get install -y --no-install-recommends stockfish && \
    ln -sf /usr/games/stockfish /usr/local/bin/stockfish && \
    command -v stockfish && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build && test -f dist/index.js

EXPOSE 5000

CMD ["npm", "start"]