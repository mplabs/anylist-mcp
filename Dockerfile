FROM node:24.12-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV MCP_PORT=3333

EXPOSE 3333

CMD ["node", "src/index.ts"]
