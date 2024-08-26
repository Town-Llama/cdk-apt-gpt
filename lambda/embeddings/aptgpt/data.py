import base64
import io
from PIL import Image


class Data(object):
    
    def __init__(self, text: str=None, image: bytes=None) -> None:
        self._text = text
        self._image = image
    
    @property
    def text(self) -> str:
        return self._text
    
    @property
    def image(self) -> Image.Image:
        image_bytes = base64.b64decode(self._image)
        img = Image.open(io.BytesIO(image_bytes))
        return img