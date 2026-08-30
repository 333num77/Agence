"""Genesis error taxonomy — shared by SDK, CLI and API (international contract).

Mapping: HTTP 404 -> JobNotFound · 409 -> JobNotFinished · 400 -> GenesisUsageError ·
5xx/connection -> TransportError. In-process provider failures -> ProviderError."""


class GenesisError(Exception):
    """Base class for all Genesis errors."""


class GenesisUsageError(GenesisError):
    """Invalid argument or request (empty idea, bad mode, bad prompt name)."""


class JobNotFound(GenesisError):
    """Unknown job_id (local or HTTP 404)."""


class JobNotFinished(GenesisError):
    """Result requested while the job is still running (HTTP 409)."""


class JobFailed(GenesisError):
    """Pipeline failed; the job is checkpointed and resumable."""

    def __init__(self, job_id: str, error: str) -> None:
        self.job_id, self.error = job_id, error
        super().__init__(f"job {job_id} failed: {error} (resumable)")


class ConfigError(GenesisError):
    """Configuration impossible (live mode without endpoint/key, etc.)."""


class ProviderError(GenesisError):
    """A live provider call failed after retries."""


class TransportError(GenesisError):
    """Network/HTTP failure against the remote server."""


class GenesisTimeout(GenesisError):
    """Timeout elapsed; the job keeps running server-side and stays resumable."""

    def __init__(self, job_id: str, timeout: float) -> None:
        self.job_id, self.timeout = job_id, timeout
        super().__init__(f"timed out after {timeout}s; job {job_id} still running (resumable)")
