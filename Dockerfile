FROM node:boron
WORKDIR /app
ADD . /app
RUN npm install
EXPOSE 8080
ENV NODE_ENV dev
CMD [ "npm", "start" ]
