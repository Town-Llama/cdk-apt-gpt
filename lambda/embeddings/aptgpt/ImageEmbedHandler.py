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
    logger.info(event)
    logger.info(context)
    logger.info(event.keys())
    embeddings = []
    for record in event["Records"]:

        # Unpack S3 event from SQS
        event = json.loads(record["body"])
        if "Event" in event and event["Event"] == "s3:TestEvent":
            return {"statusCode": 200, "body": {}}
        assert len(event["Records"]) == 1

        s3Event = record["s3"]
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
    logger.info(
        image_embed_handler(
            json.loads(
                get_test_data()
            ),
            None,
        )
    )