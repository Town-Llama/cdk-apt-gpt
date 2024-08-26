# setup frontend build environment
FROM node:20.13.1-alpine AS frontend

# Set the working directory in the container
WORKDIR /opt/app/apts-gpt
# Copy the frontend from github
# Need to figure out how to clone from github
# RUN git clone -b dev git@github.com:matthewjgunton/apts-gpt.git
COPY . .
WORKDIR /opt/app/apts-gpt/app
# Install dependencies
RUN npm install
# Define the command to run your app
CMD ["npm", "start"]