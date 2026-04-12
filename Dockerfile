FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --build-from-source=false

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build



FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --build-from-source=false --omit=dev

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
