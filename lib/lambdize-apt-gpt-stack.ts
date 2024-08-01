import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class LambdizeAptGptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN!; // Use default if undefined
    const GROQ_API_KEY = process.env.GROQ_API_KEY!;
    const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN!;
    const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE!;
    const DB_USER = process.env.DB_USER!;
    const DB_HOST = process.env.DB_HOST!;
    const DB_PORT = process.env.DB_PORT!;
    const DB_DATABASE = process.env.DB_DATABASE!;
    const DB_PW = process.env.DB_PW!;
    const DB_SSL = process.env.DB_SSL!;
    const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY!;
    const OPEN_AI_KEY = process.env.OPEN_AI_KEY!;
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
    const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY!;

    // S3 bucket for web hosting with proper public access settings
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, // Block ACL-based public access
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Allow public access to the bucket for web hosting
    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${websiteBucket.bucketArn}/*`],
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
    }));

    // CloudFront distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'WebsiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    // Deploy React app to S3
    new s3deploy.BucketDeployment(this, 'DeployReactApp', {
      sources: [s3deploy.Source.asset('./react-app/build')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });


    /**
     * lambda layers
     */
    const authLayer = new lambda.LayerVersion(this, 'AuthLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/layers/jwt')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'A layer for JWT authentication',
    });

    const dbLayer = new lambda.LayerVersion(this, 'DbLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/layers/db')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'A layer for PostgreSQL database connection using pg library',
    });

    const llmLayer = new lambda.LayerVersion(this, 'LLMLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/layers/llm')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'A layer for PostgreSQL database connection using pg library',
    });

    // Lambda functions with environment variables
    const createLambdaFunction = (name: string, handlerPath: string) =>
      new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(`lambda/${handlerPath}`),
        environment: {
          "MAPBOX_ACCESS_TOKEN": MAPBOX_ACCESS_TOKEN,
          "GROQ_API_KEY": GROQ_API_KEY,
          "AUTH0_DOMAIN": AUTH0_DOMAIN,
          "AUTH0_AUDIENCE": AUTH0_AUDIENCE,
          "DB_USER": DB_USER,
          "DB_HOST": DB_HOST,
          "DB_PORT": DB_PORT,
          "DB_DATABASE": DB_DATABASE,
          "DB_PW": DB_PW,
          "DB_SSL": DB_SSL,
          "FIREWORKS_API_KEY": FIREWORKS_API_KEY,
          "OPEN_AI_KEY": OPEN_AI_KEY,
          "GOOGLE_API_KEY": GOOGLE_API_KEY,
          "OUTSCRAPER_API_KEY": OUTSCRAPER_API_KEY
        },
        layers: [authLayer, dbLayer, llmLayer] // all of them will have auth protection for now
      });

    // Define Lambda functions
    const datas_route = createLambdaFunction('Lambda-datas-route', 'route');
    const datas_neighborhood = createLambdaFunction('Lambda-datas-neighborhood', 'neighborhood');
    const chat_chats = createLambdaFunction('Lambda-chat-chats', 'chats');

    // API Gateway setup
    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'My Service',
      description: 'This service serves as an API Gateway example.',
      deployOptions: {
        stageName: 'prod',
      },
    });

    const datasResource = api.root.addResource('datas');
    datasResource.addResource('route').addMethod('POST', new apigateway.LambdaIntegration(datas_route));
    datasResource.addResource('neighborhood').addMethod('GET', new apigateway.LambdaIntegration(datas_neighborhood));

    const chatResource = api.root.addResource('chat');
    chatResource.addResource('chats').addMethod('POST', new apigateway.LambdaIntegration(chat_chats));

  }
}
