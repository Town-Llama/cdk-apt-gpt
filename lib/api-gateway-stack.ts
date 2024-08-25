import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import * as path from "path";

interface ApiGatewayStackProps extends cdk.StackProps {
  domainName: string;
  authorizerProps: {
    AUTH0_JWKS_URI: string;
    AUTH0_AUDIENCE: string;
    AUTH0_TOKEN_ISSUER: string;
  };
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.TokenAuthorizer;
  public readonly myRole: iam.Role;
  // Define reusable method and integration responses
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
  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

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
  }
  // Helper functions
  createLambdaIntegration = (
    resource: apigateway.Resource,
    lambda_fn: lambda.IFunction,
    type: string,
    authorizer: apigateway.IAuthorizer
  ) => {
    this.addCorsOptions(resource);
    resource.addMethod(
      type,
      new apigateway.LambdaIntegration(lambda_fn, {
        integrationResponses: [ApiGatewayStack.integrationResponse],
      }),
      {
        methodResponses: [ApiGatewayStack.methodResponse],
        authorizer: authorizer,
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
              ApiGatewayStack.integrationResponse.responseParameters,
          },
          {
            statusCode: "201",
            responseParameters:
              ApiGatewayStack.integrationResponse.responseParameters,
          },
          {
            statusCode: "400",
            responseParameters:
              ApiGatewayStack.integrationResponse.responseParameters,
          },
          {
            statusCode: "500",
            responseParameters:
              ApiGatewayStack.integrationResponse.responseParameters,
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
              ApiGatewayStack.methodResponse.responseParameters,
          },
          {
            statusCode: "201",
            responseParameters:
              ApiGatewayStack.methodResponse.responseParameters,
          },
          {
            statusCode: "400",
            responseParameters:
              ApiGatewayStack.methodResponse.responseParameters,
          },
          {
            statusCode: "500",
            responseParameters:
              ApiGatewayStack.methodResponse.responseParameters,
          },
        ],
      }
    );
  };
}
