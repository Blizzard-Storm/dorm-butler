#!/usr/bin/env python3
"""Interactive acceptance test for the real three-board system.

The script never changes wiring by itself. It guides an operator through each
physical fault, observes the running backend through its public API, and writes
an auditable Markdown/JSON report.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable


TERMINAL = {"confirmed", "failed", "timeout", "unsupported"}
UNKNOWN_ENV = (
    "temp_c", "temp_high", "lux_level", "lux_adc", "temp_adc", "fan_duty",
    "fan_mode", "window_state", "window_mode",
)
UNKNOWN_SECURITY = (
    "distance_cm", "door_state", "security_state", "alarm_level", "lock_state",
    "vib_count", "door_count", "near", "silenced",
)


@dataclass
class Result:
    name: str
    status: str
    detail: str


class Acceptance:
    def __init__(self, base_url: str, timeout: float, output_dir: Path) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.output_dir = output_dir
        self.started_at = datetime.now()
        self.results: list[Result] = []
        self.snapshots: dict[str, Any] = {}

    def request(self, path: str, method: str = "GET", body: dict | None = None) -> Any:
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            self.base_url + path,
            data=data,
            method=method,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            payload = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {exc.code}: {payload}") from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            raise RuntimeError(f"无法访问 {self.base_url}: {exc}") from exc

    def status(self) -> dict:
        return self.request("/api/status")

    def add(self, name: str, status: str, detail: str) -> None:
        self.results.append(Result(name, status, detail))
        icon = {"PASS": "[PASS]", "FAIL": "[FAIL]", "SKIP": "[SKIP]", "INFO": "[INFO]"}[status]
        print(f"{icon} {name}: {detail}")

    def prompt(self, text: str) -> bool:
        print("\n" + text)
        while True:
            answer = input("完成后按 Enter；输入 s 跳过，输入 q 结束验收：").strip().lower()
            if answer == "q":
                raise KeyboardInterrupt
            if answer == "s":
                return False
            if answer == "":
                return True
            print("请输入 Enter、s 或 q。")

    def wait_for(self, predicate: Callable[[dict], bool], seconds: float | None = None) -> dict | None:
        deadline = time.monotonic() + (seconds or self.timeout)
        last: dict | None = None
        while time.monotonic() < deadline:
            try:
                last = self.status()
                if predicate(last):
                    return last
            except RuntimeError:
                pass
            time.sleep(0.5)
        return last

    @staticmethod
    def all_online(state: dict) -> bool:
        return state["link"]["connected"] and all(
            state["nodes"][node]["online"] for node in "ABC"
        )

    @staticmethod
    def node_offline(state: dict, node: str) -> bool:
        return not state["nodes"][node]["online"]

    @staticmethod
    def fields_are_unknown(state: dict, section: str, fields: tuple[str, ...]) -> tuple[bool, str]:
        values = {field: state[section].get(field) for field in fields}
        bad = {key: value for key, value in values.items() if value is not None}
        if section == "security" and state[section].get("distance_valid") is not False:
            bad["distance_valid"] = state[section].get("distance_valid")
        return not bad, json.dumps(values, ensure_ascii=False)

    def wait_command(self, path: str, body: dict | None = None) -> dict:
        submitted = self.request(path, "POST", body)
        command_id = submitted["command_id"]
        deadline = time.monotonic() + max(self.timeout, 15.0)
        current = submitted
        while time.monotonic() < deadline:
            current = self.request(f"/api/commands/{command_id}")
            if current.get("status") in TERMINAL:
                return current
            time.sleep(0.4)
        return current

    def assert_offline_command(self, name: str, path: str, body: dict | None = None) -> None:
        try:
            command = self.wait_command(path, body)
            status = command.get("status", "unknown")
            detail = f"status={status}, attempts={command.get('attempts')}, error={command.get('error')}"
            self.add(name, "PASS" if status in {"failed", "timeout"} else "FAIL", detail)
        except RuntimeError as exc:
            self.add(name, "FAIL", str(exc))

    def require_baseline(self) -> bool:
        try:
            state = self.status()
        except RuntimeError as exc:
            self.add("后端可访问", "FAIL", str(exc))
            return False
        self.snapshots["baseline"] = state
        serial = state.get("link", {}).get("mode") == "serial"
        self.add("真实串口模式", "PASS" if serial else "FAIL",
                 f"mode={state.get('link', {}).get('mode')}")
        if not serial:
            return False
        state = self.wait_for(self.all_online, 15)
        online = state is not None and self.all_online(state)
        self.add("三节点基线在线", "PASS" if online else "FAIL", self.summary(state))
        if online:
            self.snapshots["online"] = state
        return online

    @staticmethod
    def summary(state: dict | None) -> str:
        if not state:
            return "未取得状态"
        nodes = state.get("nodes", {})
        online = "/".join(f"{n}:{'on' if nodes.get(n, {}).get('online') else 'off'}" for n in "ABC")
        diag = state.get("diagnostics", {})
        return (
            f"link={'on' if state.get('link', {}).get('connected') else 'off'}, {online}, "
            f"crc={diag.get('crc_errors')}, frames_bad={diag.get('frames_bad')}"
        )

    def test_node_b(self) -> None:
        if not self.prompt("[NodeB 断线] 仅断开 NodeB 的电源或 485 接口，保留 NodeA 与 NodeC。"):
            self.add("NodeB 断线", "SKIP", "操作者跳过")
            return
        state = self.wait_for(lambda s: self.node_offline(s, "B"))
        detected = state is not None and self.node_offline(state, "B")
        self.add("NodeB 离线识别", "PASS" if detected else "FAIL", self.summary(state))
        if detected:
            ok, detail = self.fields_are_unknown(state, "env", UNKNOWN_ENV)
            self.add("NodeB 旧数据作废", "PASS" if ok else "FAIL", detail)
            self.assert_offline_command(
                "NodeB 离线命令不误报成功", "/api/control/fan",
                {"mode": "manual", "duty_percent": 35},
            )
        if self.prompt("恢复 NodeB 原接线并上电。"):
            recovered = self.wait_for(self.all_online)
            self.add("NodeB 自动恢复", "PASS" if recovered else "FAIL", self.summary(recovered))

    def test_node_c(self) -> None:
        if not self.prompt("[NodeC 断线] 仅断开 NodeC 的电源或 485 接口，保留 NodeA 与 NodeB。"):
            self.add("NodeC 断线", "SKIP", "操作者跳过")
            return
        state = self.wait_for(lambda s: self.node_offline(s, "C"))
        detected = state is not None and self.node_offline(state, "C")
        self.add("NodeC 离线识别", "PASS" if detected else "FAIL", self.summary(state))
        if detected:
            ok, detail = self.fields_are_unknown(state, "security", UNKNOWN_SECURITY)
            self.add("NodeC 旧数据作废", "PASS" if ok else "FAIL", detail)
            self.assert_offline_command("NodeC 离线命令不误报成功", "/api/control/silence")
        if self.prompt("恢复 NodeC 原接线并上电。"):
            recovered = self.wait_for(self.all_online)
            self.add("NodeC 自动恢复", "PASS" if recovered else "FAIL", self.summary(recovered))

    def test_master_link(self) -> None:
        if not self.prompt("[NodeA/PC 断线] 拔掉 NodeA 与电脑之间的 USB 串口线，至少等待 6 秒。"):
            self.add("NodeA/PC 断线", "SKIP", "操作者跳过")
            return
        state = self.wait_for(
            lambda s: not s["link"]["connected"] and not any(
                s["nodes"][node]["online"] for node in "ABC"
            ),
            max(self.timeout, 8),
        )
        detected = state is not None and not state["link"]["connected"]
        self.add("NodeA/PC 断线识别", "PASS" if detected else "FAIL", self.summary(state))
        if detected:
            env_ok, env_detail = self.fields_are_unknown(state, "env", UNKNOWN_ENV)
            sec_ok, sec_detail = self.fields_are_unknown(state, "security", UNKNOWN_SECURITY)
            self.add("主链路断开后全部旧数据作废", "PASS" if env_ok and sec_ok else "FAIL",
                     f"env={env_detail}; security={sec_detail}")
            self.assert_offline_command(
                "PC 串口断开时命令不误报成功", "/api/control/fan",
                {"mode": "manual", "duty_percent": 35},
            )
        if self.prompt("重新插好 NodeA 的 USB 串口线，不要重启后端。"):
            recovered = self.wait_for(self.all_online, max(self.timeout, 15))
            self.add("串口自动重连并恢复三节点", "PASS" if recovered else "FAIL",
                     self.summary(recovered))

    def test_rs485_fault(self) -> None:
        before = self.status()
        if not self.prompt(
            "[485 异常] 先关闭三块板电源，再将总线 A/B 对调，然后重新上电。"
            "不要带电改线；此项中 CRC 计数未增长也可能只是完全收不到帧。"
        ):
            self.add("485 A/B 对调", "SKIP", "操作者跳过")
            return
        state = self.wait_for(
            lambda s: not s["nodes"]["B"]["online"] or not s["nodes"]["C"]["online"]
        )
        offline = state is not None and (
            not state["nodes"]["B"]["online"] or not state["nodes"]["C"]["online"]
        )
        self.add("485 异常不保留虚假在线", "PASS" if offline else "FAIL", self.summary(state))
        if state:
            before_crc = before["diagnostics"].get("crc_errors") or 0
            after_crc = state["diagnostics"].get("crc_errors") or 0
            before_bad = before["diagnostics"].get("frames_bad") or 0
            after_bad = state["diagnostics"].get("frames_bad") or 0
            changed = after_crc > before_crc or after_bad > before_bad
            self.add("CRC/坏帧诊断", "PASS" if changed else "INFO",
                     f"crc {before_crc}->{after_crc}, frames_bad {before_bad}->{after_bad}; "
                     "A/B 对调若形成静默而非坏帧，计数不增长属于正常现象")
        if self.prompt("关闭三块板电源，将 A/B 恢复原接法，再重新上电。"):
            recovered = self.wait_for(self.all_online, max(self.timeout, 20))
            self.add("485 接线恢复后自动上线", "PASS" if recovered else "FAIL",
                     self.summary(recovered))

    def write_report(self) -> tuple[Path, Path]:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        stamp = self.started_at.strftime("%Y%m%d-%H%M%S")
        json_path = self.output_dir / f"hardware-acceptance-{stamp}.json"
        md_path = self.output_dir / f"hardware-acceptance-{stamp}.md"
        payload = {
            "started_at": self.started_at.isoformat(timespec="seconds"),
            "finished_at": datetime.now().isoformat(timespec="seconds"),
            "base_url": self.base_url,
            "results": [asdict(item) for item in self.results],
            "snapshots": self.snapshots,
        }
        json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        rows = [
            "# 真实硬件异常验收报告",
            "",
            f"- 开始时间：{payload['started_at']}",
            f"- 完成时间：{payload['finished_at']}",
            f"- 上位机：{self.base_url}",
            "",
            "| 验收项 | 结果 | 证据 |",
            "|---|---|---|",
        ]
        for item in self.results:
            detail = item.detail.replace("|", "\\|").replace("\n", " ")
            rows.append(f"| {item.name} | {item.status} | {detail} |")
        passed = sum(item.status == "PASS" for item in self.results)
        failed = sum(item.status == "FAIL" for item in self.results)
        skipped = sum(item.status == "SKIP" for item in self.results)
        rows.extend(["", f"汇总：PASS {passed}，FAIL {failed}，SKIP {skipped}。", ""])
        md_path.write_text("\n".join(rows), encoding="utf-8")
        return md_path, json_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="寝室管家三板真实硬件异常验收")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000",
                        help="已启动的后端地址")
    parser.add_argument("--timeout", type=float, default=12.0,
                        help="每个状态变化的最长等待秒数")
    parser.add_argument("--output-dir", type=Path,
                        default=Path(__file__).resolve().parents[1] / "artifacts",
                        help="验收报告输出目录")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    test = Acceptance(args.base_url, args.timeout, args.output_dir)
    print("寝室管家真实硬件异常验收")
    print("本工具只读取状态并在离线时发送安全的验证命令；物理接线由操作者完成。")
    try:
        if test.require_baseline():
            test.test_node_b()
            test.test_node_c()
            test.test_master_link()
            test.test_rs485_fault()
    except (KeyboardInterrupt, EOFError):
        print("\n验收提前结束，已保留当前结果。")
    finally:
        md_path, json_path = test.write_report()
        print(f"\n报告已保存：\n{md_path}\n{json_path}")
    return 1 if any(item.status == "FAIL" for item in test.results) else 0


if __name__ == "__main__":
    sys.exit(main())
