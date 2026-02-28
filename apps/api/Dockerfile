FROM node:22-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install

COPY . .
RUN npm run build:shared && npm run build:api

EXPOSE 3001
CMD ["npm", "--workspace", "@hangul-quest/api", "run", "start"]
