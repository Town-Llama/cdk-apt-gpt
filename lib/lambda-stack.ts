import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class LambdaStack extends cdk.Stack {
  public readonly functions: { [key: string]: lambda.Function };

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dbLayer = new lambda.LayerVersion(this, 'DbLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/layers/db')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'A layer for PostgreSQL database connection using pg library',
    });

    const llmLayer = new lambda.LayerVersion(this, 'LLMLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/layers/llm')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'A layer for LLM operations',
    });

    const createNodeLambdaFunction = (name: string, handlerPath: string) =>
      new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(`lambda/${handlerPath}`),
        environment: {
          "MAPBOX_ACCESS_TOKEN": process.env.MAPBOX_ACCESS_TOKEN!,
          "GROQ_API_KEY": process.env.GROQ_API_KEY!,
          "AUTH0_DOMAIN": process.env.AUTH0_DOMAIN!,
          "AUTH0_AUDIENCE": process.env.AUTH0_AUDIENCE!,
          "DB_USER": process.env.DB_USER!,
          "DB_HOST": process.env.DB_HOST!,
          "DB_PORT": process.env.DB_PORT!,
          "DB_DATABASE": process.env.DB_DATABASE!,
          "DB_PW": process.env.DB_PW!,
          "DB_SSL": process.env.DB_SSL!,
          "FIREWORKS_API_KEY": process.env.FIREWORKS_API_KEY!,
          "OPEN_AI_KEY": process.env.OPEN_AI_KEY!,
          "GOOGLE_API_KEY": process.env.GOOGLE_API_KEY!,
          "OUTSCRAPER_API_KEY": process.env.OUTSCRAPER_API_KEY!
        },
        layers: [dbLayer, llmLayer],
        timeout: cdk.Duration.seconds(90),
      });

    this.functions = {
      datas_route: createNodeLambdaFunction('Lambda-datas-route', '/datas/route'),
      datas_neighborhoods: createNodeLambdaFunction('Lambda-datas-neighborhoods', '/datas/neighborhood'),
      datas_chats: createNodeLambdaFunction('Lambda-datas-chats', '/datas/chats'),
      datas_chats_record: createNodeLambdaFunction('Lambda-datas-chats_record', '/datas/chats_record'),
      datas_cities: createNodeLambdaFunction('Lambda-datas-cities', '/datas/cities'),
      datas_waitlist: createNodeLambdaFunction('Lambda-datas-waitlist', '/datas/waitlist'),
      datas_waitlist_record: createNodeLambdaFunction('Lambda-datas-waitlist-record', '/datas/waitlist_record'),
      datas_book: createNodeLambdaFunction('Lambda-datas-book', '/datas/book'),
      datas_previouschat: createNodeLambdaFunction('Lambda-datas-previouschat', "/datas/previouschat"),
      datas_search: createNodeLambdaFunction('Lambda-datas-search', '/datas/search'),
      chat_next: createNodeLambdaFunction("Lambda-chat-next", '/chat/next'),
      chat_pois: createNodeLambdaFunction("Lambda-chat-pois", '/chat/pois'),
      chat_suggestion: createNodeLambdaFunction("Lambda-chat-suggestion", '/chat/suggestion'),
      chat_suggestion_short: createNodeLambdaFunction("Lambda-chat-suggestion_short", '/chat/suggestion_short'),
      chat_reviews : new lambda.DockerImageFunction(this, 'Lambda-chat-reviews', {
        functionName: 'Lambda-chat-reviews',
        code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../lambda/chat/reviews'), {
          platform: Platform.LINUX_AMD64,
        }),
        timeout: cdk.Duration.seconds(90),
        memorySize: 128,
        environment: {
          "DB_USER": process.env.DB_USER!,
          "DB_HOST": process.env.DB_HOST!,
          "DB_PORT": process.env.DB_PORT!,
          "DB_DATABASE": process.env.DB_DATABASE!,
          "DB_PW": process.env.DB_PW!,
          "DB_SSL": process.env.DB_SSL!,
        }
      })
    };

    // Special cases
    // Image embedding model is NOT accessible directly from API Gateway
    const embeddingImageModel = new lambda.DockerImageFunction(this, 'Lambda-image-embedding-model', {
      functionName: 'Lambda-image-embedding-model',
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../lambda/embeddings'), {
        platform: Platform.LINUX_AMD64,
        buildArgs: {
          TARGET: 'image_embedding_handler'
        }
      }),
      timeout: cdk.Duration.seconds(90),
      memorySize: 3008
    });
    const invokeLambdaPolicyStatementImage = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:aws:lambda:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:function:Lambda-image-embedding-model`
      ],
      effect: iam.Effect.ALLOW,
    });
    this.functions.datas_search.addToRolePolicy(invokeLambdaPolicyStatementImage);


    // Descr embedding model is NOT accessible directly from API Gateway
    const embeddingDescrModel = new lambda.DockerImageFunction(this, 'Lambda-descr-embedding-model', {
      functionName: 'Lambda-descr-embedding-model',
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../lambda/embeddings'), {
        platform: Platform.LINUX_AMD64,
        buildArgs: {
          TARGET: 'descr_embedding_handler'
        }
      }),
      timeout: cdk.Duration.seconds(90),
      memorySize: 3008
    });
    const invokeLambdaPolicyStatementDescription = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:aws:lambda:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:function:Lambda-descr-embedding-model`
      ],
      effect: iam.Effect.ALLOW,
    });
    this.functions.datas_search.addToRolePolicy(invokeLambdaPolicyStatementDescription);
  }
}
