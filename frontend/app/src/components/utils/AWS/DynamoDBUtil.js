import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const TABLENAME = "Recommendations";
const REGION = "us-east-2";

const credentials = {
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY, 
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY
};

class DynamoDBUtil {

  constructor() {
    this.client = new DynamoDBClient({ region: REGION, credentials });
    this.ddbDocClient = DynamoDBDocumentClient.from(this.client);
  }

  async save_email_list(item) {
    try {
      const params = {
        TableName: "WaitList",
        Item: item,
      }
      await this.ddbDocClient.send(new PutCommand(params));
      return item;
    } catch (err) {
      console.error('Error creating/updating item:', err, item);
    }
  }

  async putItem(item, table) {
    try {
      if (!item.hasOwnProperty('hash')) {
        item.hash = uuidv4(); // You can set a default value or generate one as needed
      }
      const params = {
        TableName: table,
        Item: item,
      };
      await this.ddbDocClient.send(new PutCommand(params));
      console.log('Item created/updated successfully');
      return item;
    } catch (err) {
      console.error('Error creating/updating item:', err, item, table);
      throw err;
    }
  }

  async getItem(email, hash) {
    try {
      const params = {
        TableName: TABLENAME,
        Key: {
          email, hash
        },
      };
      const data = await this.ddbDocClient.send(new GetCommand(params));
      console.log('Item read successfully:', data.Item);
      return data.Item;
    } catch (err) {
      console.error('Error reading item:', err, email, hash);
      throw err;
    }
  }

  async queryItems_shares(email, hash) {
    try {
      const params = {
        TableName: "Shares",
        KeyConditionExpression: 'ownerPlusHash = :emailValue',
        ExpressionAttributeValues: {
          ':emailValue': { S: email+hash } 
        }
      };
      const data = await this.ddbDocClient.send(new QueryCommand(params));
      console.log('Items queried successfully:', data.Items);
      return data.Items;
    } catch (err) {
      console.error('Error querying items:', err, email);
      throw err;
    }
  }

  async queryItems_shared(sharee) {
    try {
      const params = {
        TableName: "Shares",
        IndexName: "sharee-index",
        KeyConditionExpression: 'sharee = :sharee',
        ExpressionAttributeValues: {
          ':sharee': { S: sharee } 
        }
      };
      const data = await this.ddbDocClient.send(new QueryCommand(params));
      console.log('Items queried successfully:', data.Items);
      return data.Items;
    } catch (err) {
      console.error('Error querying items:', err, sharee);
      throw err;
    }
  }

  async queryItems(email) {
    try {
      const params = {
        TableName: TABLENAME,
        KeyConditionExpression: 'email = :emailValue',
        ExpressionAttributeValues: {
          ':emailValue': { S: email } 
        }
      };
      const data = await this.ddbDocClient.send(new QueryCommand(params));
      console.log('Items queried successfully:', data.Items);
      return data.Items;
    } catch (err) {
      console.error('Error querying items:', err, email);
      throw err;
    }
  }

  async queryItems_2(email) {
    try {
      const params = {
        TableName: "Shares",
        KeyConditionExpression: 'email = :emailValue',
        ExpressionAttributeValues: {
          ':emailValue': { S: email } 
        }
      };
      const data = await this.ddbDocClient.send(new QueryCommand(params));
      console.log('Items queried successfully:', data.Items);
      return data.Items;
    } catch (err) {
      console.error('Error querying items:', err, email);
      throw err;
    }
  }

  async deleteItem (tableName, key) {
    const params = {
      TableName: tableName,
      Key: key
    };
    try {
      const data = await this.ddbDocClient.send(new DeleteCommand(params));
      console.log('Item deleted successfully:', data);
      return data;
    } catch (error) {
      console.error('Unable to delete item', error, key);
      throw error;
    }
  };

}

export default DynamoDBUtil;
