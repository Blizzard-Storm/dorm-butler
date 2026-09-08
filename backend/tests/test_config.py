from __future__ import annotations

from app.config import Settings


def test_llm_trust_env_defaults_to_false(monkeypatch):
    monkeypatch.delenv("LLM_TRUST_ENV", raising=False)
    assert Settings(_env_file=None).llm_trust_env is False


def test_llm_trust_env_can_be_enabled(monkeypatch):
    monkeypatch.setenv("LLM_TRUST_ENV", "true")
    assert Settings(_env_file=None).llm_trust_env is True
