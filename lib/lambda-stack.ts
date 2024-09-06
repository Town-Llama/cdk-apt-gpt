import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ses from "aws-cdk-lib/aws-ses";
import { Construct } from "constructs";
import * as path from "path";

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

    const loadBalancerDns = cdk.Fn.importValue("LoadBalancerDNS");

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
          LOAD_BALANCER_DNS: loadBalancerDns,
        },
        layers: [dbLayer, llmLayer],
        timeout: cdk.Duration.seconds(90),
      });

    this.functions = {
      api: new lambda.Function(this, "api", {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "src/lambdaServer.handler",
        code: lambda.AssetCode.fromAsset("./backend", {
          bundling: {
            image: lambda.Runtime.NODEJS_20_X.bundlingImage,
            command: [
              "bash",
              "-c",
              `
            export HOME=./ &&
            export npm_config_cache=/tmp/.npm &&
            mkdir /tmp/yarn && pushd /tmp/yarn &&
            npm install yarn &&
            popd &&
            mkdir -p node_modules &&
            mv node_modules /tmp/ &&
            /tmp/yarn/node_modules/.bin/yarn &&
            /tmp/yarn/node_modules/.bin/yarn build &&
            mv node_modules /asset-output &&
            mv /tmp/node_modules ./ &&
            cp -rf build/* /asset-output &&
            find /asset-output -name ".*" | grep .bin$ | xargs -I repme rm -rf repme
            `,
            ],
            //environment: props.bundleEnvironment,
          },
        }),
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
        },
        layers: [],
        timeout: cdk.Duration.seconds(90),
      }),
      chat_reviews: new lambda.DockerImageFunction(
        this,
        "Lambda-chat-reviews",
        {
          functionName: "Lambda-chat-reviews",
          code: lambda.DockerImageCode.fromImageAsset(
            path.join(__dirname, "../lambda/chat/reviews"),
            {
              platform: Platform.LINUX_AMD64,
              target: "deploy",
            }
          ),
          timeout: cdk.Duration.seconds(90),
          memorySize: 128,
          environment: {
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
            OPEN_AI_KEY: process.env.OPEN_AI_KEY!,
            OUTSCRAPER_API_KEY: process.env.OUTSCRAPER_API_KEY!,
          },
        }
      ),
    };

    // Special cases
    const ses_identity = new ses.CfnEmailIdentity(this, "EmailIdentity", {
      emailIdentity: "seaholmdataco@gmail.com", // Replace with your email address
    });

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
      var resourcePath = name.replace(/_/g, "/");
      console.log("Resource path: ", resourcePath);
      if (resourcePath === "api") {
        console.log("Got api path");
        resourcePath = "api/{proxy+}";
      }
      const resource = this.api.root.resourceForPath(resourcePath);
      const method = "ANY";
      this.createLambdaIntegration(
        resource,
        fn,
        method,
        this.authorizer,
        !name.includes("api") //determines if we protect the route (if true, then we do)
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
            responseParameters: LambdaStack.methodResponse.responseParameters,
          },
          {
            statusCode: "201",
            responseParameters: LambdaStack.methodResponse.responseParameters,
          },
          {
            statusCode: "400",
            responseParameters: LambdaStack.methodResponse.responseParameters,
          },
          {
            statusCode: "500",
            responseParameters: LambdaStack.methodResponse.responseParameters,
          },
        ],
      }
    );
  };
}
