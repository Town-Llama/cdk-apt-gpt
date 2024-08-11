import json
import logging
import traceback

from aptgpt.test_image_embed_handler import get_descr_test_data

model = None
logger = logging.getLogger()

logger.info("hit")

def createEmbed(
    payload
):
    from txtai.vectors import VectorsFactory

    global model
    if model is None:
        model = VectorsFactory.create({'path': 'sentence-transformers/all-MiniLM-L6-v2', 'method': 'sentence-transformers', 'content': False})
    # Embed the payload
    embedding = model.encode(payload)
    return embedding

def handler(event, context):  # pragma: no cover
    try:
        logger.info(event)
        logger.info(context)
        
        # Parse the HTTP event
        body = json.loads(event["body"])
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
    logging.basicConfig(level=10)
    result = handler(
            json.loads(
                get_descr_test_data()
            ),
            None,
        )
    assert result["statusCode"] == 200, result
