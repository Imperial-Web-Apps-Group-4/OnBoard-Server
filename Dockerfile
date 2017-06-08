FROM node:boron
WORKDIR /app
COPY package.json /app/package.json
RUN npm install
COPY . /app
EXPOSE 8080
ENV NODE_ENV dev
CMD [ "npm", "start" ]
