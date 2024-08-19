FROM node:20.13.1-alpine3.20

# Create app directory
WORKDIR /opt/app
COPY . .
# Install app dependencies
# RUN npm install
CMD ["npx", "cdk", "deploy"]