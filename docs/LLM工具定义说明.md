# LLM 工具定义说明

实现见 `backend/app/llm/tools.py` 与 `backend/app/llm/agent.py`。

## 设计原则

1. **模型只选工具、填参数**，绝不生成串口字节，也不执行任意代码。
2. **参数双重校验**：先由 JSON Schema 约束（枚举 + 数值范围），
   服务端 `_validate()` 再校验一次，区间与固件从站的 `SETCFG` 检查完全一致。
3. **查询类直接执行；控制类走与手动操作同一条命令链路**，写入 `commands` 表，
   `source` 标记为 `ai`。
4. **不允许模型美化结果**。每个控制工具返回 `verdict` 字段，
   并附 `instruction_to_model` 明确要求如实转述。

## 工具清单

| 工具 | 类型 | 参数 | 服务端校验 |
|---|---|---|---|
| `get_system_status` | 查询 | 无 | — |
| `get_history` | 查询 | `metric` 枚举, `minutes` 1-1440 | 指标白名单 |
| `get_alarm_events` | 查询 | `minutes` 1-10080, `level` 枚举 | — |
| `set_fan` | 控制 | `mode` auto/manual, `duty_percent` 0-100 | 手动模式必须给占空比 |
| `set_temperature_threshold` | 控制 | `celsius` 10-40 | 与 NodeB `SETCFG` 区间一致 |
| `set_security_mode` | 控制·**敏感** | `mode` arm/disarm | 需用户二次确认 |
| `silence_alarm` | 控制·**敏感** | 无 | 需用户二次确认 |
| `set_window` | 控制 | `state` open/close/auto | NodeB 回执确认；auto 恢复温度闭环 |

## 敏感操作的二次确认流程

```
用户: "帮我撤防"
  ↓
模型调用 set_security_mode(mode="disarm")
  ↓
服务端检测到敏感工具且 confirmed=False
  → 不执行，返回 {needs_confirmation: true, tool, args}
  ↓
前端弹出确认对话框，显示工具名与参数
  ↓
用户点"确认执行"
  → 前端带 confirmed_tool 再次调用 /api/ai/chat
  → 服务端直接执行（不再过模型），写入 commands 表
```

**注意**：确认这一步在服务端强制，不是前端的礼貌提示。
即使模型自称"用户已经同意了"，没有 `confirmed_tool` 字段就不会执行。

## 系统提示词里的铁律

见 `agent.py` 的 `SYSTEM_PROMPT`：

1. 任何当前数值必须调工具获取，不得凭印象编造
2. 工具返回 `null` 要如实说"暂时拿不到"
3. 光照是未标定的 0-4 等级，不说 lux；风扇是 PWM 百分比，不说转速；
   通风窗和门锁只有软件状态，不说"已确认关好"
4. 控制命令后必须按 `verdict` 如实转述，未确认就说未确认
5. 遇到 `needs_confirmation` 要提示用户去界面确认

## 上下文控制

- `get_history` **不返回原始行**，只返回 min/max/avg/latest 加最多 12 个采样点。
  几千行 1Hz 数据直接喂给模型既费 token 又降低准确率。
- 对话历史只带最近 20 条。
- 工具调用轮次上限 4 轮，超过就让用户把问题拆细。

## 安全边界

| 边界 | 实现 |
|---|---|
| 密钥不出后端 | 只从环境变量读，前端接口从不返回 |
| 无密钥可降级 | `chat()` 直接返回说明文案，其余功能不受影响 |
| 值域夹紧 | Schema + 服务端 `_validate()` + 固件从站三重 |
| 执行器命令闭环 | `FUNC_ACT` 由 NodeA 转发，目标从站应答后才标记成功 |
| 全部留痕 | AI 发出的命令与手动命令进同一张 `commands` 表，可审计 |
| 调用超时 | 默认 30s，失败返回可读错误而不是卡死 |

## 配置

```ini
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1     # 任何兼容 OpenAI function calling 的服务
LLM_MODEL=gpt-4o-mini
LLM_TIMEOUT_S=30
```

留空 `LLM_API_KEY` 时，AI 助手页显示"未配置"，
监控、图表、事件、手动控制全部正常 —— 这条已由 `test_ai_disabled_gracefully` 覆盖。
