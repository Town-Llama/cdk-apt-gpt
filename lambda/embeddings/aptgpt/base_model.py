import threading
import logging
import numpy as np
import time
from aptgpt.data import Data
from aptgpt.imodel import IModel
from aptgpt import models


logger = logging.getLogger(__name__)


class BaseModel(IModel):
    
    def __init__(self, config: dict):
        """Initialize the model.
        
        Args:
            config (dict): The configuration of the model.
        """
        self.config = config
        self.model = None
        self.load_task = None
        self.load_event = threading.Event()
    
    
    def forward(self, data: Data) -> np.ndarray:
        """Embed the data.
        
        Returns:
            np.ndarray: The embedding of the data.
        """
        if self.load_task is None:
            self.load()
        
        self.load_event.wait()
        
        start = time.time()
        if data.text:
            embedding = self.model.encode_text(data.text)
        else:
            embedding = self.model.encode_image(data.image)
        end = time.time()
        logger.info(f"Embedding computed in {end-start:.2f} seconds")
        return embedding
    
    
    def load(self) -> None:
        """Load the model."""
        if self.load_task is None:
            self.load_task = threading.Thread(target=self._load_model)
            self.load_task.start()
        return None
    
    def _load_model(self) -> bool:
        start = time.time()
        self.model = models.model_factory(**self.config)
        end = time.time()
        logger.info(f"Model loaded in {end-start:.2f} seconds")
        self.load_event.set()
        return True
    
    