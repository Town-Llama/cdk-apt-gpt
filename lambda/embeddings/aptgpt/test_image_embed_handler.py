import requests
from PIL import Image
import io
import base64

def get_test_data():
    image = Image.open("GoogleLogo.jpg")
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr = base64.b64encode(img_byte_arr.getvalue()).decode()

    test_data = """
                    {
                    "Records":[
                        {
                            "messageId":"b8613125-8f86-4953-858f-d0efb832b679",
                            "receiptHandle":"AQEBcVAidOC2pq6VQvfk/YcduB7+SMPkl12i1CiylVGeH3q09KfgQmiDSCzAukxos9G32rozG3kdAtO5h+B5Ij+1v+4nUDkWzFXR1IS982vBFTsUQ8WecYg+UjvkZVkhDcvHny2PviBQ9Aj2k0bUGpxxEROh6sEcGF9wbVvIf4btZHACisRvgXRJ/3Wp2Od/5pIMCOvlSkR/RTzDuRTBWs+/J64EqTy7XwRlsL0ug3AT2GGmoidGUNxGupUUTgUirNG9aLe8KHYYDZ3OAUbpdR0vG8OaLA0TkVrP1O7arclq+EXJep+xH5TgUueNCyi34HiNaDl59EM4+JPjxoLFX0mMZywk0JZ2pNMb1ULwfcuJvGPXbzhU2lc1CNt4HKVYVGnR6jhh/boqw4X2XiXiCB+T+2jBXDTptd7FBXkPA++cwjg=",
                            "body":"{\\"Records\\":[{\\"eventVersion\\":\\"2.1\\",\\"eventSource\\":\\"aws:s3\\",\\"awsRegion\\":\\"us-east-1\\",\\"eventTime\\":\\"2021-09-05T06:18:46.674Z\\",\\"eventName\\":\\"ObjectCreated:Put\\",\\"userIdentity\\":{\\"principalId\\":\\"AIXG3ZJ1Q2BEF\\"},\\"requestParameters\\":{\\"sourceIPAddress\\":\\"72.177.88.42\\"},\\"responseElements\\":{\\"x-amz-request-id\\":\\"X3H3P9JVHY20VTMA\\",\\"x-amz-id-2\\":\\"XNqqN6MsKOQ0wBpJb7u+M25PlECAxAF5Lj0uZxN7k0GU6sdL4dM61A9fD/6TrrX/ZWC8QkyEJmq4tZFgezu/dRkUKP5j3qVZ\\"},\\"s3\\":{\\"s3SchemaVersion\\":\\"1.0\\",\\"configurationId\\":\\"tf-s3-queue-20210905060130910100000001\\",\\"bucket\\":{\\"name\\":\\"aquinas-media-ingest-test\\",\\"ownerIdentity\\":{\\"principalId\\":\\"AIXG3ZJ1Q2BEF\\"},\\"arn\\":\\"arn:aws:s3:::aquinas-media-ingest-test\\"},\\"object\\":{\\"image\\":\\\"""" + img_byte_arr + """\\",\\"size\\":2232033,\\"eTag\\":\\"7d61f659a56c92e5116bc096e597c1a5\\",\\"sequencer\\":\\"006134614C78C43B39\\"}}}]}",
                            "attributes":{
                                "ApproximateReceiveCount":"3",
                                "SentTimestamp":"1630822733586",
                                "SenderId":"AIDAJHIPRHEMV73VRJEBU",
                                "ApproximateFirstReceiveTimestamp":"1630822733591"
                            },
                            "messageAttributes":{
                                
                            },
                            "md5OfBody":"df4086e19926a34f225af96464145873",
                            "eventSource":"aws:sqs",
                            "eventSourceARN":"arn:aws:sqs:us-east-1:696271319528:aquinas-media-ingest-image-queue-prod",
                            "awsRegion":"us-east-1"
                        }
                    ]
                    }
                    """
    return test_data

if __name__ == "__main__":  # pragma: no cover
    response = requests.post("http://localhost:9000/2015-03-31/functions/function/invocations", get_test_data())
    print(response)
    print(response.content)
