import asyncio
import logging
import numpy as np
import time
from data import Data
from imodel import IModel


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
    
    
    def forward(self, data: Data) -> np.ndarray:
        """Embed the data.
        
        Returns:
            np.ndarray: The embedding of the data.
        """
        return asyncio.run(self._fwd(data))
        
    async def _fwd(self, data: Data) -> np.ndarray:
        if not self.load_task:
            self.load()
        
        await self.load_task
        data_obj = data.text if data.text else data.image
        start = time.time()
        embedding = self.model.encode(data_obj)
        end = time.time()
        logger.info(f"Embedding computed in {end-start:.2f} seconds")
        return embedding
    
    
    def load(self) -> None:
        """Load the model."""
        
        self.load_task = asyncio.create_task(self._load_model())
    
    async def _load_model(self) -> bool:
        start = time.time()
        from txtai.vectors import VectorsFactory
        self.model = VectorsFactory.create(self.config)
        end = time.time()
        logger.info(f"Model loaded in {end-start:.2f} seconds")
        return True
    
    