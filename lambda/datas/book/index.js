const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-2' }); // Change the region if needed

const YOUR_EMAIL = 'seaholmdataco@gmail.com';

exports.handler = async (event) => {

    const body = JSON.parse(event.body);
    const { userid, ask, conversationid, aptId } = body;

    const msg = `${userid} looked for ${ask} with conversationid ${conversationid}. They want unit id: ${aptId}`;

    const params = {
        Destination: {
            ToAddresses: [YOUR_EMAIL] // Replace with your email address
        },
        Message: {
            Body: {
            Text: { Data: msg } // send the whole last chat
            },
            Subject: { Data: 'Lambda Function Triggered' }
        },
        Source: YOUR_EMAIL // Replace with your verified SES email
    };

    try {
        await ses.sendEmail(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify('Email sent successfully!'),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
            }
        };
        } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
            },
            body: JSON.stringify('Error sending email')
        };
    }
};