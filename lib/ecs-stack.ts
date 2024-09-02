import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as path from 'path';

export class EcsStack extends cdk.Stack {
    public readonly vpc: ec2.IVpc;
    public readonly textService: ecs.FargateService;
    public readonly imageService: ecs.FargateService;
    public readonly cluster: ecs.ICluster;
    public readonly textServiceContainer: ecs.ContainerDefinition;
    public readonly imageServiceContainer: ecs.ContainerDefinition;
    public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create a VPC
        this.vpc = new ec2.Vpc(this, 'MyVPC', {
            maxAzs: 2
        });

        // Create an ECS cluster
        this.cluster = new ecs.Cluster(this, 'ModelCluster', {
            vpc: this.vpc
        });

        // Create a load balancer
        this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ModelLoadBalancer', {
            vpc: this.vpc,
            internetFacing: true
        });

        // Create a task definition for Image
        const imageServiceTaskDefinition = new ecs.FargateTaskDefinition(this, 'ImageServiceTaskDef', {
            memoryLimitMiB: 4096,
            cpu: 1024,
        });

        this.imageServiceContainer = imageServiceTaskDefinition.addContainer('ImageServiceContainer', {
            image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../lambda/embeddings'), {
                target: 'image_embedding_handler'
            }),
            logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'imageService' }),
            portMappings: [{ containerPort: 80 }]
        });

        imageServiceTaskDefinition.executionRole?.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
        );

        // Create Image Service
        this.imageService = new ecs.FargateService(this, 'ImageService', {
            cluster: this.cluster,
            taskDefinition: imageServiceTaskDefinition,
            desiredCount: 1,
            assignPublicIp: false,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            serviceName: 'image-service',
        });

        // Create a task definition for Description
        const textServiceTaskDefinition = new ecs.FargateTaskDefinition(this, 'TextServiceTaskDef', {
            memoryLimitMiB: 4096,
            cpu: 1024,
        });

        this.textServiceContainer = textServiceTaskDefinition.addContainer('TextServiceContainer', {
            image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../lambda/embeddings'), {
                target: 'descr_embedding_handler'
            }),
            logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'textService' }),
            portMappings: [{ containerPort: 80 }]
        });

        textServiceTaskDefinition.executionRole?.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
        );

        // Create Text Service
        this.textService = new ecs.FargateService(this, 'TextService', {
            cluster: this.cluster,
            taskDefinition: textServiceTaskDefinition,
            desiredCount: 1,
            assignPublicIp: false,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            serviceName: 'text-service'
        });

        // Create target groups
        const imageTargetGroup = new elbv2.ApplicationTargetGroup(this, 'ImageTargetGroup', {
            vpc: this.vpc,
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targetType: elbv2.TargetType.IP,
            healthCheck: { path: '/health' },
            targetGroupName: cdk.Fn.join('-', ['TG1', cdk.Fn.select(2, cdk.Fn.split('-', this.loadBalancer.loadBalancerName))]),
        });

        const textTargetGroup = new elbv2.ApplicationTargetGroup(this, 'TextTargetGroup', {
            vpc: this.vpc,
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targetType: elbv2.TargetType.IP,
            healthCheck: { path: '/health' },
            targetGroupName: cdk.Fn.join('-', ['TG2', cdk.Fn.select(2, cdk.Fn.split('-', this.loadBalancer.loadBalancerName))]),
        });

        // Attach services to target groups
        this.imageService.attachToApplicationTargetGroup(imageTargetGroup);
        this.textService.attachToApplicationTargetGroup(textTargetGroup);

        // Add listener with rules
        const listener = this.loadBalancer.addListener('Listener', {
            port: 80,
            defaultTargetGroups: [textTargetGroup]  // Add default target group
        });

        listener.addAction('ImageAction', {
            priority: 1,
            conditions: [
                elbv2.ListenerCondition.pathPatterns(['/image/*']),
            ],
            action: elbv2.ListenerAction.forward([imageTargetGroup]),
        });

        listener.addAction('TextAction', {
            priority: 2,
            conditions: [
                elbv2.ListenerCondition.pathPatterns(['/text/*']),
            ],
            action: elbv2.ListenerAction.forward([textTargetGroup]),
        });

        const customResource = new cr.AwsCustomResource(this, 'LoadBalancerDnsExport', {
            onCreate: {
                service: 'CloudFormation',
                action: 'createStack',
                parameters: {
                    StackName: 'LoadBalancerDnsExport',
                    TemplateBody: JSON.stringify({
                        Resources: {
                            DummyResource: {
                                Type: 'AWS::CloudFormation::WaitConditionHandle'
                            }
                        },
                        Outputs: {
                            LoadBalancerDNS: {
                                Value: this.loadBalancer.loadBalancerDnsName,
                                Export: { Name: 'LoadBalancerDNS' }
                            }
                        }
                    })
                },
                physicalResourceId: cr.PhysicalResourceId.of('LoadBalancerDnsExport')
            },
            onUpdate: {
                service: 'CloudFormation',
                action: 'updateStack',
                parameters: {
                    StackName: 'LoadBalancerDnsExport',
                    TemplateBody: JSON.stringify({
                        Resources: {
                            DummyResource: {
                                Type: 'AWS::CloudFormation::WaitConditionHandle'
                            }
                        },
                        Outputs: {
                            LoadBalancerDNS: {
                                Value: this.loadBalancer.loadBalancerDnsName,
                                Export: { Name: 'LoadBalancerDNS' }
                            }
                        }
                    })
                },
                physicalResourceId: cr.PhysicalResourceId.of('LoadBalancerDnsExport')
            },
            onDelete: {
                service: 'CloudFormation',
                action: 'deleteStack',
                parameters: {
                    StackName: 'LoadBalancerDnsExport'
                }
            },
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
                resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE
            })
        });
        customResource.node.addDependency(this.loadBalancer);


        // Output the load balancer DNS name
        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: this.loadBalancer.loadBalancerDnsName,
            description: 'Load Balancer DNS Name',
        });
    }
}