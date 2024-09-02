import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { FrontendStack } from "./frontend-stack";
import { LambdaStack } from "./lambda-stack";
import { EcsStack } from "./ecs-stack";

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const isProd = props?.env?.account === "021891618047";
    const domainName = isProd ? "townllama.ai" : "beta.townllama.ai";

    const ecsStack = new EcsStack(this, "ECSStack", {
      env: props?.env
    })

    // Create the Lambda Stack & API Gateway stack
    const lambdaStack = new LambdaStack(this, "LambdaStack", {
      env: props?.env,
      domainName: domainName,
      authorizerProps: {
        AUTH0_JWKS_URI: process.env.AUTH0_JWKS_URI!,
        AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE!,
        AUTH0_TOKEN_ISSUER: process.env.AUTH0_TOKEN_ISSUER!,
      },
    });

    // Add any necessary dependencies between stacks
    lambdaStack.addDependency(ecsStack);

    // Create the Frontend Stack
    const frontendStack = new FrontendStack(this, "FrontendStack", lambdaStack, {
      domainName,
      env: props?.env,
    });

    frontendStack.addDependency(lambdaStack);
  }
}
