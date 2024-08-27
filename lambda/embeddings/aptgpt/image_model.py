from base_model import BaseModel
import logging



model_cfg = {
    'path': 'sentence-transformers/clip-ViT-L-14', 
    'method': 'sentence-transformers', 
    'content': False
}
logger = logging.getLogger(__name__)


class ImageModel(BaseModel):
    
    def __init__(self, config: dict=model_cfg):
        """Initialize the model.
        
        Args:
            config (dict): The configuration of the model.
        """
        super().__init__(config)
    
    