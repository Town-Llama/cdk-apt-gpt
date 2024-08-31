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
    def load(self, wait_sec: float = 15.0) -> None:
        """Load the model asynchronously.

        This method starts a new thread to load the model if it is not already 
        being loaded. It starts of the model loading process and waits for the model
        to be loaded or until the specified wait time has elapsed.

        Args:
            wait_sec (float): The maximum time to wait for the model to load,
                in seconds. Default is 15.0 seconds.

        Returns:
            None
        """
        
        pass