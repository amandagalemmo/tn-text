###############################################################################
### Set up the node server                                                  ###
###############################################################################
# Establish the image
FROM node:20.12.2-alpine
# Set working directory
WORKDIR /home/node/app

RUN mkdir src
COPY ./src ./src
# Copy over .env file
COPY ./.env .
# Copy over migrations
RUN mkdir migrations
COPY ../migrations ./migrations
# Copy over package.json
COPY ./package.json .
RUN echo ls
# Install packages
RUN npm i
# RUN npm run migrate
# Copy over tsconfig
COPY ./tsconfig.json .
# Build typescript to js
RUN npm run build
# All other config handled via docker-compse.yml
CMD ["node", "--env-file=.env", "./dist/main.js"]
