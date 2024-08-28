import abc
from PIL import Image
import numpy as np


class IModel(abc.ABC):
    @abc.abstractmethod
    def encode_image(self, image: Image) -> np.ndarray:
        """Encode the image into a feature vector.
        
        Args:
            image (Image): The image to encode.
            
        Returns:
            np.ndarray: The feature vector.
        """
        ...
        
    @abc.abstractmethod
    def encode_text(self, text: str) -> np.ndarray:
        """Encode the text into a feature vector.
        
        Args:
            text (str): The text to encode.
            
        Returns:
            np.ndarray: The feature vector.
        """
        ...