FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 4200
CMD ["npm", "start", "--", "--configuration", "production", "--host", "0.0.0.0", "--disable-host-check", "--proxy-config", "proxy.conf.json"]