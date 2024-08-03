import pytest
from PIL import Image
import io
import base64
import numpy as np

from .ImageEmbedHandler import createEmbed


def get_img() -> str:
    
    image = Image.open("./GoogleLogo.jpg")
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr = base64.b64encode(img_byte_arr.getvalue()).decode()
    return img_byte_arr
    
    
def get_text() -> str:
    return "Google logo."


@pytest.mark.parametrize("is_text", [True, False])
def test_createEmbed(is_text: bool):
    if is_text:
        text = get_text()
        embd = createEmbed(True, text)
    else:
        img = get_img()
        embd = createEmbed(False, img)
    assert isinstance(embd, np.ndarray)
    assert embd.shape == (512,)
