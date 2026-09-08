from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class MaterialClassifier(ABC):
    """
    Abstract Model-Agnostic Material Classifier Interface.
    Allows swappable computer vision backends:
    - Current: DemoMaterialClassifier (deterministic & transparent prototype)
    - Future: YOLOMaterialClassifier / TorchMaterialClassifier (fine-tuned on CPCB taxonomy)
    """

    @abstractmethod
    def predict(
        self,
        image_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        sample_key: Optional[str] = None,
        user_weight: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Predict e-waste material category and associated confidence score.
        Returns a structured dictionary with classification outputs.
        """
        pass
