FROM node:20-alpine AS builder
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package*.json ./
RUN npm install --no-audit --no-fund --loglevel=error
COPY . .
ARG BACKEND_URL=http://qw-app-backend:3001
ENV BACKEND_URL=$BACKEND_URL
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund --loglevel=error
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
