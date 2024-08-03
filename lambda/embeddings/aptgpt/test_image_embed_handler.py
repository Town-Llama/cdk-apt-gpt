import base64
import io
import json

import requests
from PIL import Image


def get_test_data():
    image = Image.open("GoogleLogo.jpg")
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr = base64.b64encode(img_byte_arr.getvalue()).decode()

    body_data = {
                            "isText":True,
                            "payload":"Embed this text please"
                        }
    test_data = {
                    "body":json.dumps(body_data)
                }
    return json.dumps(test_data)

if __name__ == "__main__":  # pragma: no cover
    response = requests.post("http://localhost:9000/2015-03-31/functions/function/invocations", get_test_data())
    print(response)
    print(response.content)
