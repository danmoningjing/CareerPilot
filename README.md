# CareerPilot

CareerPilot 是一个 AI 求职导航网站，面向大三、大四、双非本科、大专生和普通求职者，帮助用户根据学历、专业、城市、技能、兴趣、经历和求职偏好，快速获得适合自己的岗位 TOP5。

当前版本已经支持填写求职画像、调用后端推荐接口、展示岗位推荐卡片，并支持真实 AI API 调用失败时自动回退到 mock 推荐。

## 功能

- 求职画像表单
  - 学历
  - 阶段
  - 专业
  - 当前城市
  - 目标城市
  - 期望行业
  - 已掌握技能
  - 兴趣方向
  - 实习 / 项目 / 校园经历
  - 求职偏好
- 岗位 TOP5 推荐
- 每个岗位展示：
  - 岗位名
  - 匹配度
  - 推荐理由
  - 岗位难度
  - 需要补充的能力
  - 30 天行动路线
- 推荐结果卡片展示
- 匹配度进度条
- 缺失能力标签
- 30 天行动路线按第 1 周到第 4 周展示
- 重新生成推荐
- 复制推荐结果
- loading 状态和错误提示
- AI API 失败时 fallback 到 mock 推荐

## 技术栈

- 后端：Flask
- 前端：HTML / CSS / JavaScript
- AI 调用：OpenAI 兼容 Chat Completions API
- HTTP 请求：requests
- 配置方式：环境变量 / 本地 `.env`

## 项目结构

```text
CareerPilot/
├── app.py
├── requirements.txt
├── README.md
├── .env.example
├── .gitignore
├── services/
│   ├── ai_client.py
│   └── job_matcher.py
├── utils/
│   ├── env_loader.py
│   └── validators.py
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── templates/
    └── index.html
```

## 本地运行

进入项目目录：

```powershell
cd C:\Users\lenovo\CareerPilot
```

安装依赖：

```powershell
py -m pip install -r requirements.txt
```

启动 Flask：

```powershell
py -m flask --app app run
```

打开浏览器访问：

```text
http://127.0.0.1:5000
```

## 环境变量配置

项目不会把真实 API Key 写死在代码里。AI API Key 通过环境变量读取。

本地可以复制 `.env.example` 为 `.env`：

```powershell
Copy-Item .env.example .env
```

然后在 `.env` 中填写自己的配置：

```text
AI_API_KEY=your_api_key_here
AI_MODEL=your_model_name_here
AI_API_BASE_URL=https://api.openai.com/v1/chat/completions
```

注意：

- 不要把真实 API Key 写进 README、代码或前端文件。
- 不要提交真实 `.env` 文件。
- `.gitignore` 已经忽略 `.env`。
- `AI_API_KEY` 只填写 Key 本身，不要加 `Bearer`。
- 中文 prompt 和用户输入只会放在 JSON body 中，不会放进 HTTP headers。

也可以在 PowerShell 中临时设置：

```powershell
$env:AI_API_KEY="your_api_key_here"
$env:AI_MODEL="your_model_name_here"
$env:AI_API_BASE_URL="https://api.openai.com/v1/chat/completions"
```

## API

### `POST /api/recommend`

请求示例：

```json
{
  "education": "双非本科",
  "stage": "大四",
  "major": "工商管理",
  "city": "武汉",
  "targetCity": "杭州",
  "industry": "互联网",
  "skills": "Excel、PPT、活动策划",
  "interests": "内容运营、用户增长",
  "experience": "做过社团活动策划，有一段新媒体实习",
  "preferences": ["入门门槛低", "成长空间"]
}
```

响应字段：

```json
{
  "profile": {},
  "source": "ai",
  "top_jobs": [
    {
      "title": "内容运营助理",
      "match_score": 88,
      "reason": "推荐理由",
      "difficulty": "中低",
      "missing_skills": ["内容选题", "数据复盘"],
      "action_plan_30_days": ["第1周：...", "第2周：...", "第3周：...", "第4周：..."]
    }
  ]
}
```

如果 AI API 调用失败，接口会返回：

```json
{
  "source": "mock_fallback",
  "notice": "AI 推荐暂时不可用，已返回模拟推荐。请稍后重试或检查本地 API 配置。",
  "top_jobs": []
}
```

## 开发进度

已完成：

- Flask 项目入口
- 单页前端表单
- `/api/recommend` 推荐接口
- mock 岗位 TOP5 推荐
- 服务层拆分
- 环境变量读取
- `.env.example`
- 真实 AI API 调用层
- AI 调用失败 fallback
- 推荐结果卡片优化
- 重新生成和复制推荐结果
- 移动端适配

待开发：

- 更稳定的 Prompt 版本管理
- 岗位知识库 `job_profiles.json`
- 基于规则的初筛 + AI 解释
- Render 部署配置
- 简历优化建议
- 岗位 JD 分析
- 用户结果保存

## 检查命令

Python 语法检查：

```powershell
py -m py_compile app.py services/ai_client.py services/job_matcher.py utils/validators.py
```

JavaScript 语法检查：

```powershell
node --check static/js/app.js
```

## Render 部署

Render 上建议创建 Web Service，并使用 Python 环境。

Build Command：

```text
pip install -r requirements.txt
```

Start Command：

```text
gunicorn app:app --bind 0.0.0.0:$PORT
```

需要在 Render Dashboard 的 Environment Variables 中配置：

```text
AI_API_KEY=your_api_key_here
AI_MODEL=your_model_name_here
AI_API_BASE_URL=https://api.openai.com/v1/chat/completions
```

注意：

- 不要把真实 API Key 写进代码、README 或 `render.yaml`。
- 不要提交真实 `.env` 文件。
- Render 线上环境变量应在 Dashboard 中填写。
- 如果 AI API 配置错误或调用失败，系统会 fallback 到 mock 推荐。

部署后可以测试健康检查：

```text
https://your-render-service.onrender.com/health
```

正常返回示例：

```json
{
  "service": "careerpilot",
  "status": "ok",
  "timestamp": "2026-06-14T00:00:00+00:00"
}
```
