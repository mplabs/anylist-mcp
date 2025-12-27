FROM node:24.12-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV MCP_PORT=3333

EXPOSE 3333

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/index.ts"]
