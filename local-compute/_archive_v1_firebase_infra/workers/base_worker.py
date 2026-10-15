from abc import ABC, abstractmethod

class BaseWorker(ABC):
    def __init__(self, name: str, capabilities: list):
        self.name = name
        self.capabilities = capabilities

    def can_handle(self, job_type: str) -> bool:
        """
        Returns True if the worker's capabilities match the requested job type.
        """
        return job_type in self.capabilities

    @abstractmethod
    def execute(self, payload: dict) -> dict:
        """
        Executes the compute job payload.
        Must return a dictionary containing the output result.
        """
        pass
