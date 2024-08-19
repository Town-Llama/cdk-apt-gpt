"""Module to facilitate the loading of the model.
"""


def load_model(model_cfg: dict):
    from txtai.vectors import VectorsFactory
    model = VectorsFactory.create(model_cfg)
    return model