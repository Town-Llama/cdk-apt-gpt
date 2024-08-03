import json
import logging
import os

from PIL import Image
import numpy as np
import base64
import io
import traceback

from txtai.vectors import VectorsFactory

model = VectorsFactory.create({'path': 'sentence-transformers/clip-ViT-B-32', 'method': 'sentence-transformers', 'content': False})

logger = logging.getLogger()

def createEmbed(
    is_text: bool, payload
):
    # Decode the base64 payload
    if not is_text:
        image_bytes = base64.b64decode(payload)
        image = Image.open(io.BytesIO(image_bytes))
    # Embed the payload
    processed_payload = payload if is_text else image
    embedding = model.encode(processed_payload)
    return embedding

def handler(event, context):  # pragma: no cover
    try:
        logger.info(event)
        logger.info(context)
        
        # Parse the HTTP event
        body = json.loads(event["body"])
        is_text = body["isText"]
        payload = body["payload"]

        embedding = createEmbed(is_text, payload)

        return {
            "statusCode": 200,
            "body": json.dumps({"embedding": embedding.tolist()})
        }
    except:
        logger.error(traceback.format_exc())
        return {
            "statusCode": 500,
            "body": json.dumps({"embedding": []})
        }