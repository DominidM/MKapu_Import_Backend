FROM node:20-alpine As build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build administration
FROM node:20-alpine As production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 3002
CMD ["node", "dist/apps/administration/main.js"]