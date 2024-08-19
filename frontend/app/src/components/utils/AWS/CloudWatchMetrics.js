import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

const credentials = {
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY, 
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY
};


class CloudWatchMetrics {
  constructor(namespace, region = 'us-east-2') {
    this.cloudWatchClient = new CloudWatchClient({ region, credentials });
    this.cloudWatchLogsClient = new CloudWatchLogsClient({ region, credentials });
    this.namespace = namespace || 'YourAppName';
    this.logGroupName = `/aws/lambda/${this.namespace}`;
  }

  emitErrorMetric(className, fn) {
    return this.emitMetric(`${className}.${fn}.Error`, 1);
  }

  async emitMetric(metricName, value, unit = 'Count', dimensions = []) {
    const params = {
      MetricData: [
        {
          MetricName: metricName,
          Dimensions: dimensions,
          Unit: unit,
          Value: value,
        },
      ],
      Namespace: this.namespace,
    };

    try {
      const command = new PutMetricDataCommand(params);
      const data = await this.cloudWatchClient.send(command);
      console.log('Metric sent successfully:', data);
    } catch (error) {
      console.error('Error sending metric:', error);
    }
  }

  async writeLog(message) {
    const logStreamName = new Date().toISOString().split('T')[0]; // Log stream for the current date

    try {
      // Ensure the log group exists
      await this.cloudWatchLogsClient.send(new CreateLogGroupCommand({ logGroupName: this.logGroupName }));
    } catch (error) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Error creating log group:', error);
      }
    }

    try {
      // Ensure the log stream exists
      await this.cloudWatchLogsClient.send(new CreateLogStreamCommand({ 
        logGroupName: this.logGroupName, 
        logStreamName 
      }));
    } catch (error) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Error creating log stream:', error);
      }
    }

    const params = {
      logGroupName: this.logGroupName,
      logStreamName: logStreamName,
      logEvents: [
        {
          message: message,
          timestamp: Date.now(),
        },
      ],
    };

    try {
      const command = new PutLogEventsCommand(params);
      const data = await this.cloudWatchLogsClient.send(command);
      console.log('Log sent successfully:', data);
    } catch (error) {
      console.error('Error sending log:', error);
    }
  }
}

export default CloudWatchMetrics;