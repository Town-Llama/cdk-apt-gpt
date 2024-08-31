import logging
import numpy as np
import time
import threading
import traceback
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
        if (self.load_task is None) or \
            (not self.load_task.is_alive() and not self.load_event.is_set()):
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
    
    
    def load(self, wait_sec: float = 15.0) -> None:
        """Load the model asynchronously.

        This method starts a new thread to load the model if it is not already 
        being loaded. It starts of the model loading process and waits for the model
        to be loaded or until the specified wait time has elapsed.

        Args:
            wait (float): The maximum time to wait for the model to load, in seconds. 
                Default is 15.0 seconds.

        Returns:
            None
        """
        if (self.load_task is None) or \
            (not self.load_task.is_alive() and not self.load_event.is_set()):
            self.load_task = threading.Thread(target=self.async_load_model)
            self.load_task.start()
            logger.info(
                "Start model loading.",
                extra={"config": self.config}
                )
            start = time.time()
            while not self.load_event.is_set():
                time.sleep(0.5)
                if time.time()-start < wait_sec:
                    logger.warn(
                        f"Model loading took longer than {wait_sec:.1f} sec.",
                        extra={"config": self.config}
                        )
                    break
        return None
    
    def async_load_model(self) -> bool:
        """
        Asynchronously worker method to load the model.

        This method initializes the model using the configuration provided in 
        `self.config`. It logs the time taken to load the model and sets the 
        `load_event` to signal that the model has been loaded.

        Returns:
            bool: True if the model is loaded successfully.
        """
        
        try:
            start = time.time()
            self.model = models.model_factory(**self.config)
            end = time.time()
            logger.info(
                "Model loaded successfully.",
                extra={
                    "config": self.config,
                    "duration_sec": round(end-start, 2)
                })
            self.load_event.set()
            return True
        except Exception as ex:
            logger.error(
                "Model loading failed", 
                extra={
                    "error": str(ex),
                    "traceback": traceback.format_exc()
                })
        return False
    
    