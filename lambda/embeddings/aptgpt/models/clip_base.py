from PIL import Image
import numpy as np
from .imodel import IModel


class ClipBase(IModel):
    """A base model for CLIP."""
    name = 'clip-ViT-B-32'
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(self.name)

    def encode_image(self, image: Image) -> np.ndarray:
        """Encode the image into a feature vector.
        
        Args:
            image (Image): The image to encode.
            
        Returns:
            np.ndarray: The feature vector.
        """
        if not isinstance(image, Image.Image):
            raise ValueError("image must be a PIL Image")
        if image.mode != 'RGB':
            image = image.convert('RGB')
        embedding = self.model.encode(image)
        return embedding
    
    def encode_text(self, text: str) -> np.ndarray:
        """Encode the text into a feature vector.
        
        Args:
            text (str): The text to encode.
            
        Returns:
            np.ndarray: The feature vector.
        """
        if not isinstance(text, str) or len(text) == 0:
            raise ValueError("text must be a non-empty string")
        embedding = self.model.encode(text)
        return embedding
