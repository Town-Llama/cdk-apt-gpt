from .imodel import IModel
from .clip_base import ClipBase
from .clip_large import ClipLarge
from .mini_lm import MiniLM


REGISTRY = {
    'clip-ViT-L-14': ClipLarge,
    'clip-ViT-B-32': ClipBase,
    'all-MiniLM-L6-v2': MiniLM
}


def model_factory(model: str) -> IModel:
    """Build a model by name.
    
    Args:
        model (str): The name of the model to build.
        
    Returns:
        IModel: The built model.
    """
    if model not in REGISTRY:
        raise ValueError(f"Unknown model: {model}")
    contructor = REGISTRY[model]
    model_obj = contructor()
    if not isinstance(model_obj, IModel):
        raise ValueError(f"Model {model} is not an IModel")
    return model_obj
    