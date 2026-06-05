FROM node:20-alpine AS builder
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package*.json ./
RUN npm install --no-audit --no-fund --loglevel=error
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund --loglevel=error
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
