FROM node:20-alpine

WORKDIR /app

COPY srcs/package.json ./
RUN npm install

COPY srcs/ ./

CMD ["npm", "start"]
