FROM node:20.13.1-alpine3.20 AS base

RUN apk update && apk add alpine-sdk

# Setup an image for the backend
FROM base AS backend
# Create app directory
WORKDIR /opt/app
COPY . .
# Install app dependencies
RUN npm install
# CMD ["npx", "cdk", "deploy"]

# Setup an image for the Frontend
FROM base AS frontend
# Set the working directory in the container
WORKDIR /opt/app/apts-gpt
# Copy the frontend from github
# Need to figure out how to clone from github
# RUN git clone -b dev git@github.com:matthewjgunton/apts-gpt.git
COPY frontend .
WORKDIR /opt/app/apts-gpt/app
# Install dependencies
# RUN npm install && yarn && yarn build
# Define the command to run your app
# CMD ["npm", "start"]
