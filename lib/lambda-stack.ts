import * as cdk from "aws-cdk-lib";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import * as ses from 'aws-cdk-lib/aws-ses';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";

interface LambdaProps extends cdk.StackProps {
  domainName: string;
  authorizerProps: {
    AUTH0_JWKS_URI: string;
    AUTH0_AUDIENCE: string;
    AUTH0_TOKEN_ISSUER: string;
  };
}

export class LambdaStack extends cdk.Stack {
  public readonly functions: { [key: string]: lambda.Function };
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.TokenAuthorizer;
  public readonly myRole: iam.Role;

  static methodResponse: apigateway.MethodResponse = {
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin": true,
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true,
    },
  };

  static integrationResponse: apigateway.IntegrationResponse = {
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin": "'*'",
      "method.response.header.Access-Control-Allow-Headers":
        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
      "method.response.header.Access-Control-Allow-Methods": "'*'",
    },
  };

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id, props);

    const dbLayer = new lambda.LayerVersion(this, "DbLayer", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/layers/db")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description:
        "A layer for PostgreSQL database connection using pg library",
    });

    const llmLayer = new lambda.LayerVersion(this, "LLMLayer", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/layers/llm")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer for LLM operations",
    });

    const loadBalancerDns = cdk.Fn.importValue('LoadBalancerDNS');

    const createNodeLambdaFunction = (name: string, handlerPath: string) =>
      new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(`lambda/${handlerPath}`),
        environment: {
          MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN!,
          GROQ_API_KEY: process.env.GROQ_API_KEY!,
          AUTH0_DOMAIN: process.env.AUTH0_DOMAIN!,
          AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE!,
          DB_USER: process.env.DB_USER!,
          DB_HOST: process.env.DB_HOST!,
          DB_PORT: process.env.DB_PORT!,
          DB_DATABASE: process.env.DB_DATABASE!,
          DB_PW: process.env.DB_PW!,
          DB_SSL: process.env.DB_SSL!,
          FIREWORKS_API_KEY: process.env.FIREWORKS_API_KEY!,
          OPEN_AI_KEY: process.env.OPEN_AI_KEY!,
          GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
          OUTSCRAPER_API_KEY: process.env.OUTSCRAPER_API_KEY!,
          LOAD_BALANCER_DNS: loadBalancerDns
        },
        layers: [dbLayer, llmLayer],
        timeout: cdk.Duration.seconds(90),
      });

    this.functions = {
      blog_entry: createNodeLambdaFunction(
        "Lambda-blog-entry",
        "/blog/entry"
      ),
      blog_all: createNodeLambdaFunction(
        "Lambda-blog-all",
        "/blog/all"
      ),
      datas_route: createNodeLambdaFunction(
        "Lambda-datas-route",
        "/datas/route"
      ),
      datas_neighborhoods: createNodeLambdaFunction(
        "Lambda-datas-neighborhoods",
        "/datas/neighborhood"
      ),
      datas_chats: createNodeLambdaFunction(
        "Lambda-datas-chats",
        "/datas/chats"
      ),
      datas_chats_record: createNodeLambdaFunction(
        "Lambda-datas-chats_record",
        "/datas/chats_record"
      ),
      datas_cities: createNodeLambdaFunction(
        "Lambda-datas-cities",
        "/datas/cities"
      ),
      datas_waitlist: createNodeLambdaFunction(
        "Lambda-datas-waitlist",
        "/datas/waitlist"
      ),
      datas_waitlist_record: createNodeLambdaFunction(
        "Lambda-datas-waitlist-record",
        "/datas/waitlist_record"
      ),
      datas_book: createNodeLambdaFunction("Lambda-datas-book", "/datas/book"),
      datas_previouschat: createNodeLambdaFunction(
        "Lambda-datas-previouschat",
        "/datas/previouschat"
      ),
      datas_search: createNodeLambdaFunction(
        "Lambda-datas-search",
        "/datas/search"
      ),
      fetch_apt: createNodeLambdaFunction(
        "Lambda-fetch-apt",
        "/datas/fetch_apt"
      ),
      chat_next: createNodeLambdaFunction("Lambda-chat-next", "/chat/next"),
      chat_pois: createNodeLambdaFunction("Lambda-chat-pois", "/chat/pois"),
      chat_suggestion: createNodeLambdaFunction(
        "Lambda-chat-suggestion",
        "/chat/suggestion"
      ),
      chat_suggestion_short: createNodeLambdaFunction(
        "Lambda-chat-suggestion_short",
        "/chat/suggestion_short"
      ),
      chat_reviews: new lambda.DockerImageFunction(
        this,
        "Lambda-chat-reviews",
        {
          functionName: "Lambda-chat-reviews",
          code: lambda.DockerImageCode.fromImageAsset(
            path.join(__dirname, "../lambda/chat/reviews"),
            {
              platform: Platform.LINUX_AMD64,
              target: "deploy"
            }
          ),
          timeout: cdk.Duration.seconds(90),
          memorySize: 128,
          environment: {
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
            OPEN_AI_KEY: process.env.OPEN_AI_KEY!,
            OUTSCRAPER_API_KEY: process.env.OUTSCRAPER_API_KEY!
          }
        }
      ),
    };

    // Special cases
    const ses_identity = new ses.CfnEmailIdentity(this, 'EmailIdentity', {
      emailIdentity: 'seaholmdataco@gmail.com', // Replace with your email address
    });
    const sesIdentityArn = `arn:aws:ses:${this.region}:${this.account}:identity/${ses_identity.emailIdentity}`;

    this.functions.datas_book.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [sesIdentityArn], // Replace with your SES identity ARN
      })
    );

    this.functions.datas_search.addToRolePolicy(new iam.PolicyStatement({
      actions: ['elasticloadbalancing:DescribeLoadBalancers'],
      resources: ['*']
    }));


    // now make API gaeteway
    const domainTld = "townllama.ai";
    const zone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: domainTld,
    });

    const certificate = new certificatemanager.DnsValidatedCertificate(
      this,
      "ApiCertificate",
      {
        domainName: domainTld,
        hostedZone: zone,
        region: this.region,
      }
    );

    this.api = new apigateway.RestApi(this, "MyApi", {
      restApiName: "My Service",
      description: "This service serves as an API Gateway example.",
      domainName: {
        domainName: domainTld,
        certificate: certificate,
      },
      deployOptions: {
        stageName: "prod",
      },
    });

    /*
    new route53.ARecord(this, 'ApiAliasRecord', {
      zone: zone,
      target: route53.RecordTarget.fromAlias(new route53_targets.ApiGateway(this.api)),
      recordName: domainTld,
    });
    */
    this.myRole = new iam.Role(this, "MyRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("apigateway.amazonaws.com"),
        new iam.ServicePrincipal("lambda.amazonaws.com")
      ),
    });
    this.myRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sts:AssumeRole"],
        resources: ["*"],
      })
    );
    const customAuthorizer = new lambda.Function(
      this,
      "Auth0LambdaAuthorizer",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lambda/authorizer")
        ),
        environment: props.authorizerProps,
        timeout: cdk.Duration.seconds(10),
      }
    );

    this.authorizer = new apigateway.TokenAuthorizer(
      this,
      "MyCustomAuthorizer",
      {
        handler: customAuthorizer,
        resultsCacheTtl: cdk.Duration.seconds(3600),
        validationRegex: "^Bearer [-0-9a-zA-z.]*$",
        assumeRole: this.myRole,
      }
    );


    /** tie the functions to our api gateway */
    Object.entries(this.functions).forEach(([name, fn]) => {
      console.log(!name.includes("blog"))
      const resourcePath = name.replace(/_/g, "/");
      const resource = this.api.root.resourceForPath(resourcePath);
      const method = name.includes("cities") ? "GET" : "POST";
      this.createLambdaIntegration(
        resource,
        fn,
        method,
        this.authorizer,
        !name.includes("blog") //determines if we protect the route (if true, then we do)
      );
    });
  }


  // Helper functions
  createLambdaIntegration = (
    resource: apigateway.Resource,
    lambda_fn: lambda.IFunction,
    type: string,
    authorizer: apigateway.IAuthorizer,
    useAuthorizer: boolean
  ) => {
    this.addCorsOptions(resource);
    resource.addMethod(
      type,
      new apigateway.LambdaIntegration(lambda_fn, {
        integrationResponses: [LambdaStack.integrationResponse],
      }),
      {
        methodResponses: [LambdaStack.methodResponse],
        authorizer: useAuthorizer ? authorizer : undefined,
      }
    );
  };

  addCorsOptions = (apiResource: apigateway.IResource) => {
    apiResource.addMethod(
      "OPTIONS",
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters:
              LambdaStack.integrationResponse.responseParameters,
          },
          {
            statusCode: "201",
            responseParameters:
              LambdaStack.integrationResponse.responseParameters,
          },
          {
            statusCode: "400",
            responseParameters:
              LambdaStack.integrationResponse.responseParameters,
          },
          {
            statusCode: "500",
            responseParameters:
              LambdaStack.integrationResponse.responseParameters,
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          "application/json": '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters:
              LambdaStack.methodResponse.responseParameters,
          },
          {
            statusCode: "201",
            responseParameters:
              LambdaStack.methodResponse.responseParameters,
          },
          {
            statusCode: "400",
            responseParameters:
              LambdaStack.methodResponse.responseParameters,
          },
          {
            statusCode: "500",
            responseParameters:
              LambdaStack.methodResponse.responseParameters,
          },
        ],
      }
    );
  };
}
