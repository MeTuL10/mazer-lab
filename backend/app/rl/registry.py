from __future__ import annotations

from typing import Any, Dict, List, Type

from .base import BaseRLModel
from .monte_carlo import MonteCarloModel
from .q_learning import QLearningModel
from .sarsa import SARSAModel

MODEL_REGISTRY: Dict[str, Type[BaseRLModel]] = {
    QLearningModel.name: QLearningModel,
    SARSAModel.name: SARSAModel,
    MonteCarloModel.name: MonteCarloModel,
}


def list_models() -> List[Dict[str, str]]:
    output: List[Dict[str, str]] = []
    for key, model_cls in MODEL_REGISTRY.items():
        output.append({"id": key, "name": model_cls.label})
    return output


def make_model(model_id: str, **kwargs: Any) -> BaseRLModel:
    model_cls = MODEL_REGISTRY.get(model_id)
    if model_cls is None:
        valid = ", ".join(sorted(MODEL_REGISTRY.keys()))
        raise ValueError(f"Unknown model '{model_id}'. Valid model ids: {valid}")
    return model_cls(**kwargs)
