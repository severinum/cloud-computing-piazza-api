FROM node:18-alpine

RUN addgroup -S piazzagroup && adduser -S piazzauser -G piazzagroup
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

USER piazzauser

CMD [ "npm", "start" ]