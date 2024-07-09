###############################################################################
### Set up the node server                                                  ###
###############################################################################
# Establish the image
FROM node:20.12.2-alpine
# Set working directory, should docker-compose.yml
WORKDIR /home/node/app

COPY ./server/src .
# Copy over .env file
COPY ./server/.env .
# Copy over package.json
COPY ./server/package.json .
# Install packages
RUN npm i
# Copy over tsconfig
COPY ./server/tsconfig.json .
# Build typescript to js
RUN npm run build
# All other config handled via docker-compse.yml
CMD npm start