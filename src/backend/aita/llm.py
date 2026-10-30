"""Optional model access behind a provider interface.

No model endpoint is configured in this demonstration package. Without one,
the tools return retrieved context and a prompt for inspection.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


class ModelUnavailable(RuntimeError):
    """No model is configured or reachable."""


@runtime_checkable
class ModelProvider(Protocol):
    name: str
    available: bool

    def complete(self, system: str, user: str, *, max_tokens: int = 512) -> str: ...


@dataclass
class NullProvider:
    """Stands in when no model is configured."""

    name: str = "none"
    available: bool = False

    def complete(self, system: str, user: str, *, max_tokens: int = 512) -> str:
        raise ModelUnavailable(
            "No model configured. Set AITA_MODEL_BASE_URL and AITA_MODEL_NAME, "
            "or read the returned prompt and context directly."
        )


@dataclass
class OpenAICompatibleProvider:
    """
    Any endpoint speaking the OpenAI chat-completions protocol.

    Covers the configured model endpoint, a local Ollama (`http://localhost:11434/v1`),
    vLLM, LM Studio and the hosted APIs. Timeout is deliberately short: this
    sits inside a spoken-response budget, and a slow answer in conversation
    reads as broken rather than thoughtful.
    """

    base_url: str
    model: str
    api_key: str = ""
    timeout: float = 20.0
    name: str = "openai-compatible"
    available: bool = True

    def complete(self, system: str, user: str, *, max_tokens: int = 512) -> str:
        import httpx  # a dependency of the MCP SDK, so always present

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            response = httpx.post(
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "max_tokens": max_tokens,
                    # Low but not zero. This is explanation, not creative
                    # writing, and "explain it a different way" still needs
                    # room to actually differ.
                    "temperature": 0.3,
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as error:  # noqa: BLE001 - surfaced to the caller as one type
            raise ModelUnavailable(f"{self.name} call failed: {error}") from error


def provider_from_env() -> ModelProvider:
    """
    Build a provider from environment variables.

        AITA_MODEL_BASE_URL   e.g. http://localhost:11434/v1
        AITA_MODEL_NAME       e.g. demo-model
        AITA_MODEL_API_KEY    optional
        AITA_MODEL_TIMEOUT    seconds, default 20 (raise for CPU-only testing)

    Absent any of the first two, returns NullProvider.
    """
    base_url = os.environ.get("AITA_MODEL_BASE_URL", "").strip()
    model = os.environ.get("AITA_MODEL_NAME", "").strip()
    if not base_url or not model:
        return NullProvider()
    # The 20-second default is a voice-product budget: a slower answer reads
    # as broken in conversation. A small model on a laptop CPU cannot meet it,
    # so local testing can raise it without changing the production default.
    try:
        timeout = float(os.environ.get("AITA_MODEL_TIMEOUT", "20"))
    except ValueError:
        timeout = 20.0
    return OpenAICompatibleProvider(
        base_url=base_url,
        model=model,
        api_key=os.environ.get("AITA_MODEL_API_KEY", "").strip(),
        timeout=timeout,
    )
