"""运行期配置。所有可变项来自环境变量或 .env，代码里不写死串口号和密钥。"""
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    # ---- 设备层 ----
    device_mode: Literal["mock", "serial"] = "mock"
    serial_port: str = "COM3"
    serial_baud: int = 9600
    # 命令回执等待时间。NodeA 轮询一圈约 180mS，留足重试余量。
    command_timeout_s: float = 3.0
    command_retries: int = 2

    # ---- 存储 ----
    db_url: str = f"sqlite:///{(BASE_DIR / 'data' / 'dorm.db').as_posix()}"
    telemetry_period_s: float = 1.0      # 落库节流：每 N 秒最多写一条遥测
    telemetry_keep_days: int = 14

    # ---- 服务 ----
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "*"

    # ---- LLM（留空则 AI 助手页显示未配置，其余功能不受影响）----
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"
    llm_timeout_s: float = 30.0
    # False 可绕开错误的校园网/系统代理；需要 HTTP(S)_PROXY 时可显式开启。
    llm_trust_env: bool = False

    @property
    def llm_enabled(self) -> bool:
        return bool(self.llm_api_key.strip())

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    Path(BASE_DIR / "data").mkdir(parents=True, exist_ok=True)
    return s
