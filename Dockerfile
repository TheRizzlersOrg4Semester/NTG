FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/storage/ntg-smart-checkpoints.sqlite

EXPOSE 3000

CMD ["npm", "start"]
