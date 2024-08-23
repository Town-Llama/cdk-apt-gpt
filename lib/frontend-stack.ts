import * as cdk from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

interface FrontendStackProps extends cdk.StackProps {
  domainName: string;
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const domainName = props.domainName;

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

    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
    });

    const certificate = new certificatemanager.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: domainName,
      hostedZone: zone,
      region: 'us-east-1',
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
      sources: [s3deploy.Source.asset('./frontend/app/build')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new route53.ARecord(this, 'AliasRecord', {
      zone: zone,
      target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(distribution)),
      recordName: domainName,
    });
  }
}
