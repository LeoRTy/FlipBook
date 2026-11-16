# Montador de Catálogo com servidor. Sem dependências além do Node (o banco SQLite já vem nele).
FROM node:24-alpine
ENV NODE_ENV=production NODE_NO_WARNINGS=1 PORT=8080 DADOS=/dados
WORKDIR /app
COPY server.js VERSAO ./
COPY public ./public
RUN mkdir -p /dados && chown node:node /dados
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/saude || exit 1
CMD ["node", "server.js"]
