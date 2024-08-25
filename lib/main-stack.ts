import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiGatewayStack } from "./api-gateway-stack";
import { FrontendStack } from "./frontend-stack";
import { LambdaStack } from "./lambda-stack";

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const isProd = props?.env?.account === "021891618047";
    const domainName = isProd ? "townllama.ai" : "beta.townllama.ai";

    // Create the Lambda Stack
    const lambdaStack = new LambdaStack(this, "LambdaStack", {
      env: props?.env,
    });

    // Create the API Gateway Stack
    const apiGatewayStack = new ApiGatewayStack(this, "ApiGatewayStack", {
      env: props?.env,
      domainName: domainName,
      authorizerProps: {
        AUTH0_JWKS_URI: process.env.AUTH0_JWKS_URI!,
        AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE!,
        AUTH0_TOKEN_ISSUER: process.env.AUTH0_TOKEN_ISSUER!,
      },
    });

    // Add the Lambda functions to the API Gateway
    Object.entries(lambdaStack.functions).forEach(([name, fn]) => {
      const resourcePath = name.replace(/_/g, "/");
      const resource = apiGatewayStack.api.root.resourceForPath(resourcePath);
      const method = name.includes("cities") ? "GET" : "POST";
      apiGatewayStack.createLambdaIntegration(
        resource,
        fn,
        method,
        apiGatewayStack.authorizer
      );
    });

    // Add any necessary dependencies between stacks
    apiGatewayStack.addDependency(lambdaStack);

    // Create the Frontend Stack
    const frontendStack = new FrontendStack(this, "FrontendStack", {
      domainName,
      env: props?.env,
    });
  }
}
