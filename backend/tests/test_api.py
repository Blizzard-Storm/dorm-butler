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


def test_window_command_lifecycle(client):
    body = client.post("/api/control/window", json={"state": "open"}).json()
    assert body["status"] == "pending"
    settled = _wait_settled(client, body["command_id"])
    assert settled["status"] == "confirmed"
    state = client.get("/api/status").json()
    assert state["env"]["window_state"] == "open"
    assert state["env"]["window_mode"] == "manual"

    body = client.post("/api/control/window", json={"state": "auto"}).json()
    assert _wait_settled(client, body["command_id"])["status"] == "confirmed"
    assert client.get("/api/status").json()["env"]["window_mode"] == "auto"


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
    assert all(
        point["temp_c"] is not None or point["fan_duty"] is not None
        for point in ok.json()["points"]
    )

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


def test_failed_command_does_not_persist_setting(client):
    """失败的命令绝不能把请求值记成"当前值"。

    这是实测踩到的坑：原来 REST 路由在提交【之前】就存盘，结果一条
    因从站离线而失败的命令，照样把 24℃ 写进了 settings，页面上
    "当前阈值"于是显示成用户请求过、但设备从没接受过的值。
    """
    import time

    from app.db import get_setting, set_setting
    from app.devices.base import CommandName, CommandStatus
    from app.db import recorder

    set_setting("temp_threshold", "28")

    # 直接喂一条失败的命令记录给记录器
    recorder._on_event("command", {
        "id": "failtest01", "name": str(CommandName.SET_TEMP_THRESHOLD),
        "params": {"celsius": 35}, "target_node": "B", "source": "user",
        "status": str(CommandStatus.FAILED), "created_at": None,
        "sent_at": None, "settled_at": None, "attempts": 1,
        "error": "目标节点离线",
    })
    assert get_setting("temp_threshold") == "28"      # 没被 35 覆盖

    # 确认成功的才写进去
    recorder._on_event("command", {
        "id": "oktest01", "name": str(CommandName.SET_TEMP_THRESHOLD),
        "params": {"celsius": 35}, "target_node": "B", "source": "user",
        "status": str(CommandStatus.CONFIRMED), "created_at": None,
        "sent_at": None, "settled_at": None, "attempts": 1, "error": None,
    })
    assert get_setting("temp_threshold") == "35"


def test_ai_command_persists_through_same_path(client):
    """AI 下发的命令走的是同一条持久化路径，行为必须与手动一致。"""
    from app.db import get_setting, set_setting
    from app.devices.base import CommandName, CommandStatus
    from app.db import recorder

    set_setting("near_threshold", "60")
    recorder._on_event("command", {
        "id": "aitest01", "name": str(CommandName.SET_NEAR_THRESHOLD),
        "params": {"cm": 90}, "target_node": "C", "source": "ai",
        "status": str(CommandStatus.CONFIRMED), "created_at": None,
        "sent_at": None, "settled_at": None, "attempts": 1, "error": None,
    })
    assert get_setting("near_threshold") == "90"


def test_metrics_endpoint_prometheus_format(client):
    """/metrics 要能被 Prometheus 解析，且拿不到的读数不能输出成 0。"""
    r = client.get("/metrics")
    assert r.status_code == 200
    assert "text/plain" in r.headers["content-type"]
    body = r.text

    # 每个指标都要有 HELP/TYPE 声明
    assert "# HELP dorm_temperature_celsius" in body
    assert "# TYPE dorm_bus_crc_errors_total counter" in body
    assert "# TYPE dorm_node_up gauge" in body

    # 带标签的指标
    assert 'dorm_node_up{node="A"}' in body
    assert 'dorm_commands_total{status="confirmed"}' in body

    # 计数器命名约定
    # "# TYPE dorm_xxx counter" -> 指标名在第 3 段
    for line in body.splitlines():
        if line.startswith("# TYPE") and line.endswith("counter"):
            assert line.split()[2].endswith("_total"), f"计数器必须以 _total 结尾: {line}"


def test_metrics_omits_unknown_readings_instead_of_zero(client):
    """节点离线时该指标必须【不出现】，而不是输出 0 ——
    在 Prometheus 里"没有数据点"和"值为 0"是两回事，后者会污染均值和告警。"""
    client.post("/api/mock/node-offline", json={"node": "B", "offline": True})
    body = client.get("/metrics").text
    values = [l for l in body.splitlines()
              if l.startswith("dorm_temperature_celsius")]
    assert values == [], f"节点B 离线时不该输出温度值，实际: {values}"
    assert "# HELP dorm_temperature_celsius" in body      # 声明还在，只是没有数据点
    client.post("/api/mock/node-offline", json={"node": "B", "offline": False})


def test_serial_pause_is_a_safe_noop_in_mock_mode(client):
    """模拟模式没有真实串口可放，接口要如实说明，不能报错也不能假装暂停了。"""
    r = client.post("/api/serial/pause")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["paused"] is False

    r = client.post("/api/serial/resume")
    assert r.status_code == 200
    assert r.json()["ok"] is True
