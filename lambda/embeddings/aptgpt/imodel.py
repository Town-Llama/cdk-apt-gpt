import abc
import numpy as np
from aptgpt.data import Data


class IModel(abc.ABC):
    
    
    @abc.abstractmethod
    def __init__(self, config: dict):
        """Initialize the model.
        
        Args:
            config (dict): The configuration of the model.
        """
        pass
    
    
    @abc.abstractmethod
    def forward(self, data: Data) -> np.ndarray:
        """Embed the data.
        
        Returns:
            np.ndarray: The embedding of the data.
        """
        pass
    
    
    @abc.abstractmethod
    def load(self) -> None:
        """Load the model."""
        
        pass