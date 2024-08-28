import json
import logging
import traceback

from aptgpt.test_image_embed_handler import get_descr_test_data
from aptgpt.data import Data
from aptgpt.descr_model import DescrModel


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s'
)
logger = logging.getLogger("DescriptionEmbedHandler")
model = DescrModel()
logger.info("hit")


def createEmbed(
    is_text: bool, payload
):
    global model
    if not is_text:
        data = Data(image=payload)
    else:
        data = Data(text=payload)
    embedding = model.forward(data)
    return embedding


def handler(event, context):  # pragma: no cover
    try:
        # Parse the HTTP event
        body = json.loads(event["body"])
        should_load_model = body.get("load_model", False)
        if should_load_model:
            global model
            model.load()
            return {
                "statusCode": 200,
                "body": json.dumps({"model_status": True})
            }
        is_text = True
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

if __name__ == "__main__":  # pragma: no cover
    
    # Download the model
    _ = model.forward(Data(text="hello world"))
    
    result = handler(
            json.loads(
                get_descr_test_data()
            ),
            None,
        )
    assert result["statusCode"] == 200, result
