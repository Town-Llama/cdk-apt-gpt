# Welcome to Town Llama -- helping you find your best apartment using AI!

## Pre-requisite
- create a .env file for both the backend & the frontend
- your file should contain the keys for each one specified in our github/workflows/cdk.yml

## Running the backend
- our backend is designed to be deployed on a combination of 1 lambda (using serverless) and ECS instances to host the models
- to launch locally, we will use 2 commands (one to launch an express server (the lmabda) and one to launch the ECS instances)
- from the root directory
```
cd backend
npm install
npm run start
```

## Running the frontend
- frontend is a react app
- this is deployed via a S3 bucket connected to cloudfront
- to launch locally, we will use npm
- from the root directory:
```
cd frontend/app
npm install
npm run start
```

## note our data scraping script is in a separate repo
- if you'd like to take a look please email us

