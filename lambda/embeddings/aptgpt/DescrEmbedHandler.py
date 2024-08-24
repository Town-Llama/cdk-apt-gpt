import json
import logging
import time
import traceback

from aptgpt.test_image_embed_handler import get_descr_test_data
from aptgpt.utils import load_model

model = None
model_cfg = {
    'path': 'sentence-transformers/all-MiniLM-L6-v2', 
    'method': 'sentence-transformers',
    'content': False
}
logger = logging.getLogger()

logger.info("hit")

def createEmbed(
    payload
):

    global model
    if model is None:
        logger.info("The model is not initiallized. Loading model")
        model = download_model()
    # Embed the payload
    embedding = model.encode(payload)
    return embedding


def download_model():
    """Wrapper function to download the model."""
    return load_model(model_cfg)


def handler(event, context):  # pragma: no cover
    try:
        logger.info(event)
        logger.info(context)
        
        # Parse the HTTP event
        body = json.loads(event["body"])
        should_load_model = body.get("load_model", False)
        if should_load_model:
            global model
            if model is None:
                model = download_model()
            return {
                "statusCode": 200,
                "body": json.dumps({"model_status": True})
            }
        payload = body["payload"]

        embedding = createEmbed(payload)

        return {
            "statusCode": 200,
            "body": json.dumps({"embedding": embedding.tolist()})
        }
    except:
        logger.error(traceback.format_exc())
        assert False, traceback.format_exc()
        return {
            "statusCode": 500,
            "body": json.dumps({"embedding": []})
        }

if __name__ == "__main__":  # pragma: no cover
    
    # Download the model
    download_model()
    
    logging.basicConfig(level=10)
    result = handler(
            json.loads(
                get_descr_test_data()
            ),
            None,
        )
    assert result["statusCode"] == 200, result
