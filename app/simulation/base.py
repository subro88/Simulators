"""
Base Simulation Engine Abstract Class
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
from pydantic import BaseModel


class BaseSimulationEngine(ABC):
    """Abstract base class for all physical and numerical simulation engines."""

    name: str = "base-simulation"
    description: str = "Base simulation engine"

    @abstractmethod
    def calculate(self, params: BaseModel) -> BaseModel:
        """Run physics calculation and return validated output telemetry."""
        pass

    @abstractmethod
    def get_presets(self) -> Dict[str, Dict[str, Any]]:
        """Return standardized educational presets for this simulation."""
        pass
