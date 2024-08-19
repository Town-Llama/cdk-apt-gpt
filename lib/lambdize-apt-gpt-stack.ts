import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Role, CompositePrincipal, ServicePrincipal, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as ses from 'aws-cdk-lib/aws-ses';

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
    const AUTH0_TOKEN_ISSUER = process.env.AUTH0_TOKEN_ISSUER!;
    const AUTH0_JWKS_URI = process.env.AUTH0_JWKS_URI!;

    const domainName = 'townllama.ai';
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${websiteBucket.bucketArn}/*`],
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
    }));

    // Look up the hosted zone for townllama.ai
    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
    });

    // SSL certificate for the domain
    const certificate = new certificatemanager.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: domainName,
      hostedZone: zone,
      region: 'us-east-1', // CloudFront requires the certificate to be in us-east-1
    });

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'WebsiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [domainName],
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        sslMethod: cloudfront.SSLMethod.SNI,
      }),
      errorConfigurations: [
        {
          errorCode: 403, // Forbidden errors
          responsePagePath: '/error.html',
          responseCode: 200,
          errorCachingMinTtl: 300
        },
        {
          errorCode: 404, // Not Found errors
          responsePagePath: '/error.html',
          responseCode: 200,
          errorCachingMinTtl: 300
        },
        {
          errorCode: 500, // Internal Server Errors
          responsePagePath: '/error.html',
          responseCode: 200,
          errorCachingMinTtl: 300
        },
        {
          errorCode: 502, // Bad Gateway errors
          responsePagePath: '/error.html',
          responseCode: 200,
          errorCachingMinTtl: 300
        },
        {
          errorCode: 503, // Service Unavailable errors
          responsePagePath: '/error.html',
          responseCode: 200,
          errorCachingMinTtl: 300
        },
        {
          errorCode: 504, // Gateway Timeout errors
          responsePagePath: '/error.html',
          responseCode: 200,
          errorCachingMinTtl: 300
        },
      ],
    });
    

    new s3deploy.BucketDeployment(this, 'DeployReactApp', {
      sources: [s3deploy.Source.asset('./react-app/build')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Route 53 alias record pointing to the CloudFront distribution
    new route53.ARecord(this, 'AliasRecord', {
      zone: zone,
      target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(distribution)),
      recordName: domainName,
    });

    // email setup
    const ses_identity = new ses.CfnEmailIdentity(this, 'EmailIdentity', {
      emailIdentity: 'seaholmdataco@gmail.com', // Replace with your email address
    });
    const sesIdentityArn = `arn:aws:ses:${this.region}:${this.account}:identity/${ses_identity.emailIdentity}`;



    /**
     * lambda layers
     */
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

    /*
    * custom authorizer auth0
    */
    const myRole = new Role(this, 'MyRole', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal('apigateway.amazonaws.com'),
        new ServicePrincipal('lambda.amazonaws.com')
      )
    });

    // Optional: Add any additional policies to the role
    myRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      resources: ['*'],
    }));

    const customAuthorizer = new lambda.Function(this, 'Auth0LambdaAuthorizer', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/authorizer')),
      environment: {
        "AUTH0_JWKS_URI": AUTH0_JWKS_URI,
        "AUTH0_AUDIENCE": AUTH0_AUDIENCE,
        "AUTH0_TOKEN_ISSUER": AUTH0_TOKEN_ISSUER
      },
      timeout: cdk.Duration.seconds(10)
    });
    const authorizer = new apigateway.TokenAuthorizer(this, 'MyCustomAuthorizer', {
      handler: customAuthorizer,
      resultsCacheTtl: cdk.Duration.seconds(3600),
      validationRegex: "^Bearer [-0-9a-zA-z\.]*$",
      assumeRole: myRole
    });


    // Lambda functions with environment variables
    const createNodeLambdaFunction = (name: string, handlerPath: string) =>
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
        layers: [dbLayer, llmLayer], // all of them will have auth protection for now
        timeout: cdk.Duration.seconds(90),
      });

    // Define Lambda functions
    const datas_route = createNodeLambdaFunction('Lambda-datas-route', '/datas/route');
    const datas_neighborhoods = createNodeLambdaFunction('Lambda-datas-neighborhoods', '/datas/neighborhood');
    const datas_chats = createNodeLambdaFunction('Lambda-datas-chats', '/datas/chats');
    const datas_chats_record = createNodeLambdaFunction('Lambda-datas-chats_record', '/datas/chats_record');
    const datas_cities = createNodeLambdaFunction('Lambda-datas-cities', '/datas/cities');
    const datas_waitlist = createNodeLambdaFunction('Lambda-datas-waitlist', '/datas/waitlist');
    const datas_book = createNodeLambdaFunction('Lambda-datas-book', '/datas/book');
    const datas_previouschat = createNodeLambdaFunction('Lambda-datas-previouschat', "/datas/previouschat");

    datas_book.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [sesIdentityArn], // Replace with your SES identity ARN
      })
    );

    const imageEmbeddingModel = new lambda.DockerImageFunction(this, 'Lambda-image-embedding-model', {
      functionName: 'Lambda-image-embedding-model',
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../lambda/embeddings'), {
        platform: Platform.LINUX_AMD64, // Specify the architecture
        buildArgs: {
          TARGET: 'image_embedding_handler'
        }
      }),
      timeout: cdk.Duration.seconds(90),
      memorySize: 3008 //once approved go to 10240
    });
    // const descrEmbeddingModel = new lambda.DockerImageFunction(this, 'Lambda-descr-embedding-model', {
    //   functionName: 'Lambda-descr-embedding-model',
    //   code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../lambda/embeddings'), {
    //     platform: Platform.LINUX_AMD64, // Specify the architecture
    //     buildArgs: {
    //       TARGET: 'descr_embedding_handler'
    //     }
    //   }),
    //   timeout: cdk.Duration.seconds(90),
    //   memorySize: 3008 //once approved go to 10240
    // });
    const datas_search = createNodeLambdaFunction('Lambda-datas-search', '/datas/search');
    const invokeLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:aws:lambda:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:function:Lambda-image-embedding-model`
      ],
      effect: iam.Effect.ALLOW,
    });
    datas_search.addToRolePolicy(invokeLambdaPolicyStatement);

    const chat_reviews = new lambda.DockerImageFunction(this, 'Lambda-chat-reviews', {
      functionName: 'Lambda-chat-reviews',
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../lambda/chat/reviews'), {
        platform: Platform.LINUX_AMD64, // Specify the architecture
      }),
      timeout: cdk.Duration.seconds(90),
      memorySize: 128 //once approved go to 10240
    });
    const chat_next = createNodeLambdaFunction("Lambda-chat-next", '/chat/next');
    const chat_pois = createNodeLambdaFunction("Lambda-chat-pois", '/chat/pois');
    const chat_suggestion = createNodeLambdaFunction("Lambda-chat-suggestion", '/chat/suggestion');
    const chat_suggestion_short = createNodeLambdaFunction("Lambda-chat-suggestion_short", '/chat/suggestion_short');

    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK, // Set retention period as needed
    });

    // API Gateway setup
    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'My Service',
      description: 'This service serves as an API Gateway example.',
      deployOptions: {
        stageName: 'prod'
      },
    });

    const methodResponse: apigateway.MethodResponse = {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
      },
    };

    const integrationResponse: apigateway.IntegrationResponse = {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'method.response.header.Access-Control-Allow-Methods': "'*'",
      },
    };

    const addCorsOptions = (apiResource: apigateway.IResource) => {
      apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
        integrationResponses: [
          { statusCode: '200', responseParameters: integrationResponse.responseParameters },
          { statusCode: '201', responseParameters: integrationResponse.responseParameters },
          { statusCode: '400', responseParameters: integrationResponse.responseParameters },
          { statusCode: '500', responseParameters: integrationResponse.responseParameters },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }), {
        methodResponses: [
          { statusCode: '200', responseParameters: methodResponse.responseParameters },
          { statusCode: '201', responseParameters: methodResponse.responseParameters },
          { statusCode: '400', responseParameters: methodResponse.responseParameters },
          { statusCode: '500', responseParameters: methodResponse.responseParameters },
        ],
      });
    };

    const createLambdaIntegration = (resource: apigateway.Resource, lambda_fn :lambda.IFunction, type: string) => {
      addCorsOptions(resource);
      resource.addMethod(type, new apigateway.LambdaIntegration(lambda_fn, {
        integrationResponses: [integrationResponse],
      }), {
        methodResponses: [methodResponse],
        authorizer: authorizer,
      });
    };

    addCorsOptions(api.root);
    const datasResource = api.root.addResource('datas');
    const datasCitiesResource = datasResource.addResource('cities');
    createLambdaIntegration(datasCitiesResource, datas_cities, "GET");

    const datasWaitlistResource = datasResource.addResource('waitlist');
    createLambdaIntegration(datasWaitlistResource, datas_waitlist, "POST");

    const datasRouteResource = datasResource.addResource('route');
    createLambdaIntegration(datasRouteResource, datas_route, "POST");

    const datasBookResource = datasResource.addResource('book');
    createLambdaIntegration(datasBookResource, datas_book, "POST");

    const datasNeighborhoodResource = datasResource.addResource('neighborhoods');
    createLambdaIntegration(datasNeighborhoodResource, datas_neighborhoods, "POST");

    const datasSearchResource = datasResource.addResource('search');
    createLambdaIntegration(datasSearchResource, datas_search, "POST");

    const datasPreviousChatResource = datasResource.addResource('previouschat');
    createLambdaIntegration(datasPreviousChatResource, datas_previouschat, "POST");

    const datasChatsResource = datasResource.addResource('chats');
    createLambdaIntegration(datasChatsResource, datas_chats, "POST");

    const datasChatRecordResource = datasChatsResource.addResource("record");
    createLambdaIntegration(datasChatRecordResource, datas_chats_record, "POST");

    const chatResource = api.root.addResource('chat');
    const chatReviewsResource = chatResource.addResource('reviews')
    createLambdaIntegration(chatReviewsResource, chat_reviews, "POST");

    const chatNextResource = chatResource.addResource('next')
    createLambdaIntegration(chatNextResource, chat_next, "POST");

    const chatPoisResource = chatResource.addResource('pois')
    createLambdaIntegration(chatPoisResource, chat_pois, "POST");

    const chatSuggestionResource = chatResource.addResource('suggestion');
    createLambdaIntegration(chatSuggestionResource, chat_suggestion, "POST");

    const chatSuggestionShortResource = chatSuggestionResource.addResource("short")
    createLambdaIntegration(chatSuggestionShortResource, chat_suggestion_short, "POST");

  }
}
