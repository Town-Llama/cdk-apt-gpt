import * as cdk from "aws-cdk-lib";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53_targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { LambdaStack } from "./lambda-stack";

interface FrontendStackProps extends cdk.StackProps {
  domainName: string;
}

export class FrontendStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    apiGatewayStack: LambdaStack,
    props: FrontendStackProps
  ) {
    super(scope, id, props);

    const domainName = props.domainName;

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${websiteBucket.bucketArn}/*`],
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
      })
    );

    const zone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: domainName,
    });

    const certificate = new certificatemanager.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: domainName,
        hostedZone: zone,
        region: "us-east-1",
      }
    );

    // Create a cache policy that includes the Authorization header
    const cachePolicy = new cloudfront.CachePolicy(
      this,
      "CachePolicyWithAuth",
      {
        cachePolicyName: "CachePolicyWithAuth",
        headerBehavior:
          cloudfront.CacheHeaderBehavior.allowList("Authorization"),
        defaultTtl: cdk.Duration.minutes(5),
        minTtl: cdk.Duration.seconds(0),
        maxTtl: cdk.Duration.minutes(10),
      }
    );

    const distribution = new cloudfront.Distribution(
      this,
      "WebsiteDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(websiteBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        domainNames: [domainName],
        certificate: certificate,
        errorResponses: [],
      }
    );

    distribution.addBehavior(
      "/blog/*",
      new origins.HttpOrigin(
        `${apiGatewayStack.api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
        {
          originPath: `/${apiGatewayStack.api.deploymentStage.stageName}`,
        }
      ),
      {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cachePolicy,
      }
    );

    // Add API Gateway behaviors with the cache policy
    distribution.addBehavior(
      "/datas/*",
      new origins.HttpOrigin(
        `${apiGatewayStack.api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
        {
          originPath: `/${apiGatewayStack.api.deploymentStage.stageName}`,
        }
      ),
      {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cachePolicy,
      }
    );

    distribution.addBehavior(
      "/api/*",
      new origins.HttpOrigin(
        `${apiGatewayStack.api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
        {
          originPath: `/${apiGatewayStack.api.deploymentStage.stageName}`,
        }
      ),
      {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cachePolicy,
      }
    );

    distribution.addBehavior(
      "/chat/*",
      new origins.HttpOrigin(
        `${apiGatewayStack.api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
        {
          originPath: `/${apiGatewayStack.api.deploymentStage.stageName}`,
        }
      ),
      {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cachePolicy,
      }
    );

    new s3deploy.BucketDeployment(this, "DeployReactApp", {
      sources: [s3deploy.Source.asset("./frontend/app/build")],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
      memoryLimit: 1024,
    });

    new route53.ARecord(this, "AliasRecord", {
      zone: zone,
      target: route53.RecordTarget.fromAlias(
        new route53_targets.CloudFrontTarget(distribution)
      ),
      recordName: domainName,
    });
  }
}
