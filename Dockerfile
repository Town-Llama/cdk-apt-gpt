FROM node:20.13.1-alpine3.20 as base

RUN apk update && apk add --no-cache git
RUN npm install -g aws-cdk


FROM base as dev
# Create app directory
WORKDIR /opt/app
COPY . .
# Install app dependencies
RUN npm install
# CMD ["npx", "cdk", "deploy"]