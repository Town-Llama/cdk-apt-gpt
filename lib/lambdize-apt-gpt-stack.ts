import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN ?? 'default_mapbox_token'; // Use default if undefined

export class LambdizeAptGptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    // Lambda functions with environment variables
    const createLambdaFunction = (name: string, handlerPath: string) =>
      new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(`lambda/${handlerPath}`),
        environment: {
          MAPBOX_ACCESS_TOKEN, // Ensure the environment variable is passed
        },
      });

    // Define Lambda functions
    const datas_route = createLambdaFunction('Lambda-datas-route', 'route');
    const datas_neighborhood = createLambdaFunction('Lambda-datas-neighborhood', 'neighborhood');

    // API Gateway setup
    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'My Service',
      description: 'This service serves as an API Gateway example.',
      deployOptions: {
        stageName: 'prod',
      },
    });

    const datasResource = api.root.addResource('datas');
    datasResource.addResource('route').addMethod('GET', new apigateway.LambdaIntegration(datas_route));
    datasResource.addResource('neighborhood').addMethod('GET', new apigateway.LambdaIntegration(datas_neighborhood));
    // Add additional routes as needed
  }
}
