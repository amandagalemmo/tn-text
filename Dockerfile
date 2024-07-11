###############################################################################
### Set up the node server                                                  ###
###############################################################################
# Establish the image
FROM node:20.12.2-alpine
# Set working directory
WORKDIR /home/node/app
# Copy over static assets
RUN mkdir public
COPY ./server/public ./public
# Copy over code
RUN mkdir src
COPY ./server/src ./src
# Copy over .env file
COPY ./server/.env .
# Copy over migrations
RUN mkdir migrations
COPY ./server/migrations ./migrations
# Copy over package.json
COPY ./server/package.json .
RUN echo ls
# Install packages
RUN npm i
# RUN npm run migrate
# Copy over tsconfig
COPY ./server/tsconfig.json .
# Build typescript to js
RUN npm run build
# All other config handled via docker-compse.yml
CMD ["node", "--env-file=.env", "./dist/main.js"]
