"""接口与命令生命周期测试（模拟模式）。"""
from __future__ import annotations

import os
import tempfile

import pytest

# 测试用独立数据库，避免污染开发库。必须在导入 app 之前设置。
_tmp_db = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DB_URL"] = f"sqlite:///{_tmp_db.replace(os.sep, '/')}"
os.environ["DEVICE_MODE"] = "mock"
os.environ["LLM_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _wait_settled(client, command_id: str, tries: int = 60) -> dict:
    """轮询到命令进入终态。绝不能靠"提交成功"就认定执行成功。"""
    import time

    for _ in range(tries):
        data = client.get(f"/api/commands/{command_id}").json()
        if data["status"] in ("confirmed", "failed", "timeout", "unsupported"):
            return data
        time.sleep(0.1)
    raise AssertionError(f"命令 {command_id} 未在预期时间内进入终态")


def test_health_and_status(client):
    assert client.get("/api/health").json()["ok"] is True

    s = client.get("/api/status").json()
    assert s["link"]["mode"] == "mock"
    assert set(s["nodes"]) == {"A", "B", "C"}
    assert "temp_c" in s["env"]
    assert "capabilities" in s


def test_fan_command_lifecycle(client):
    r = client.post("/api/control/fan", json={"mode": "manual", "duty_percent": 50})
    assert r.status_code == 200
    body = r.json()
    assert body["command_id"]
    assert body["status"] == "pending"          # 提交时绝不是 confirmed

    settled = _wait_settled(client, body["command_id"])
    assert settled["status"] == "confirmed"

    state = client.get("/api/status").json()
    assert state["env"]["fan_mode"] == "manual"
    assert state["env"]["fan_duty"] == 50


def test_fan_manual_without_duty_rejected(client):
    r = client.post("/api/control/fan", json={"mode": "manual"})
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "missing_duty"


def test_threshold_out_of_range_rejected_by_schema(client):
    """值域由 Pydantic 与固件常量共同约束，越界请求根本进不来。"""
    assert client.post("/api/control/temperature-threshold", json={"celsius": 99}).status_code == 422
    assert client.post("/api/control/temperature-threshold", json={"celsius": 5}).status_code == 422


def test_threshold_persists_across_restart(client):
    cid = client.post("/api/control/temperature-threshold", json={"celsius": 31}).json()["command_id"]
    assert _wait_settled(client, cid)["status"] == "confirmed"
    assert client.get("/api/status").json()["settings"]["temp_threshold"] == 31
    # 已写入 settings 表，重启后由 restore_settings() 恢复
    assert client.get("/api/settings").json()["stored"]["temp_threshold"] == "31"


def test_window_is_reported_unsupported(client):
    """固件没有通风窗下发通道，必须明确返回 unsupported 而不是假装成功。"""
    body = client.post("/api/control/window", json={"state": "open"}).json()
    assert body["status"] == "unsupported"
    settled = _wait_settled(client, body["command_id"])
    assert settled["status"] == "unsupported"
    assert "固件" in settled["error"]


def test_security_arm_goes_through_arming_state(client):
    cid = client.post("/api/control/security", json={"mode": "arm"}).json()["command_id"]
    assert _wait_settled(client, cid)["status"] == "confirmed"
    assert client.get("/api/status").json()["security"]["security_state"] == "arming"


def test_door_alarm_creates_event(client):
    # 先撤防，确保状态干净
    _wait_settled(client, client.post("/api/control/security",
                                      json={"mode": "disarm"}).json()["command_id"])
    client.post("/api/mock/door", json={"opened": True})
    events = client.get("/api/events", params={"minutes": 5}).json()["events"]
    assert any(e["kind"] == "door" for e in events)


def test_node_offline_invalidates_readings(client):
    client.post("/api/mock/node-offline", json={"node": "B", "offline": True})
    s = client.get("/api/status").json()
    assert s["nodes"]["B"]["online"] is False
    assert s["env"]["temp_c"] is None          # 离线就是未知，不能留旧值
    client.post("/api/mock/node-offline", json={"node": "B", "offline": False})


def test_history_and_metric_validation(client):
    ok = client.get("/api/history", params={"minutes": 10, "metrics": "temp_c,fan_duty"})
    assert ok.status_code == 200
    assert ok.json()["metrics"] == ["temp_c", "fan_duty"]

    bad = client.get("/api/history", params={"minutes": 10, "metrics": "drop_table"})
    assert bad.status_code == 400
    assert bad.json()["detail"]["code"] == "bad_metric"


def test_commands_list_records_source(client):
    data = client.get("/api/commands", params={"limit": 50}).json()
    assert data["count"] > 0
    assert all(c["source"] in ("user", "ai", "system") for c in data["commands"])


def test_ai_disabled_gracefully(client):
    """没配密钥时 AI 不可用，但不能影响其它功能。"""
    st = client.get("/api/ai/status").json()
    assert st["enabled"] is False

    r = client.post("/api/ai/chat", json={"messages": [{"role": "user", "content": "几度"}]})
    assert r.status_code == 200
    assert r.json()["enabled"] is False
    # 手动控制照常可用
    assert client.post("/api/control/fan", json={"mode": "auto"}).status_code == 200


def test_websocket_pushes_state(client):
    with client.websocket_connect("/ws") as ws:
        first = ws.receive_json()
        assert first["topic"] == "state"
        assert "env" in first["payload"]
