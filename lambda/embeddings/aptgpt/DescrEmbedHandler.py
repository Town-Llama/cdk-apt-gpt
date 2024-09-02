from flask import Flask, request, jsonify
import json
import logging
import traceback

from aptgpt.test_image_embed_handler import get_descr_test_data
from aptgpt.data import Data
from aptgpt.descr_model import DescrModel

app = Flask(__name__)

logger = logging.getLogger("DescrEmbedHandler")
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

@app.route('/text', methods=['POST'])
def process_request():
    try:
        # Parse the incoming JSON request
        body = request.get_json()
        should_load_model = body.get("load_model", False)
        
        if should_load_model:
            global model
            model.load()
            return jsonify({"model_status": True}), 200
        
        is_text = True
        payload = body["payload"]

        embedding = createEmbed(is_text, payload)

        return jsonify({"embedding": embedding.tolist()}), 200
    
    except Exception as e:
        logger.error(traceback.format_exc())
        return jsonify({"embedding": []}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return "Healthy", 200

if __name__ == "__main__":  # pragma: no cover
    app.run(host='0.0.0.0', port=80)
