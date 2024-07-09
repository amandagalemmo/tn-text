###############################################################################
### Set up the node server                                                  ###
###############################################################################
# Establish the image
FROM node:20.12.2-alpine
# Set working directory, should docker-compose.yml
WORKDIR /home/node/app
# Copy over js code. Assumes tsc has been run locally
COPY ./server/dist .
# Copy over .env file
COPY ./server/.env .
# Install packages
RUN npm i
# All other config handled via docker-compse.yml
