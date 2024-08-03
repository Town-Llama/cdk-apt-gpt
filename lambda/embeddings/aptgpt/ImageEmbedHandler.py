import json
import logging
import os

import boto3
from aptgpt.db import Database
from aptgpt.test_image_embed_handler import get_test_data
from PIL import Image
import numpy as np
import base64
import io

logger = logging.getLogger()

def image_embed(
    s3, s3_resource, bucket: str, image: Image, stage: str
):
    # Embed the image
    embedding:np.ndarray = np.ones(512, dtype=float)

    return embedding

def image_embed_handler(event, context):  # pragma: no cover
    logger.info("EVENT")
    logger.info(event)
    logger.info("CONTEXT")
    logger.info(context)
    logger.info("KEYS")
    logger.info(event.keys())
    embeddings = []
    for record in event["Records"]:
        print(record)
        print("RECORD", record.keys())

        body = json.loads(record["body"])

        for body_record in body["Records"]:

            # Unpack S3 event from SQS
            
            print("BODY", body_record.keys())
            if "Event" in body and body["Event"] == "s3:TestEvent":
                return {"statusCode": 200, "body": {}}

            s3Event = body_record["s3"]
            bucket = s3Event["bucket"]["name"]
            image_b64_string = s3Event["object"]["image"]
            image_bytes = base64.b64decode(image_b64_string)
            image = Image.open(io.BytesIO(image_bytes))

            s3 = boto3.client("s3")
            s3_resource = boto3.resource("s3")

            if context is None:
                stage = "dev"
            else:
                stage = "prod" if "-prod-" in context.function_name else "dev"

            embedding = image_embed(s3, s3_resource, bucket, image, stage)
            embeddings.append(embedding.tolist())
    return {"statusCode": 200, "body": {"embeddings": json.dumps(embeddings)}}


if __name__ == "__main__":  # pragma: no cover
    logging.basicConfig(level=10)
    logger.info(
        image_embed_handler(
            json.loads(
                get_test_data()
            ),
            None,
        )
    )