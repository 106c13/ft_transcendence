FROM node:20-bookworm-slim

# Install native stockfish binary
RUN apt-get update && apt-get install -y --no-install-recommends stockfish && \
    ln -sf /usr/games/stockfish /usr/local/bin/stockfish || true && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
