from aptgpt.base_model import BaseModel
import logging



model_cfg = {
    'model': 'clip-ViT-L-14'
}
logger = logging.getLogger(__name__)


class ImageModel(BaseModel):
    
    def __init__(self, config: dict=model_cfg):
        """Initialize the model.
        
        Args:
            config (dict): The configuration of the model.
        """
        super().__init__(config)
    
    