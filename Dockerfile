FROM node:21-alpine

WORKDIR /app

COPY . .

RUN apk add chromium

RUN npm i

CMD ["node", "server.js"]


