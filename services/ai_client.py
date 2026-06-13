import json
import os


DEFAULT_API_BASE_URL = "https://api.openai.com/v1/chat/completions"
REQUIRED_JOB_FIELDS = [
    "title",
    "match_score",
    "reason",
    "difficulty",
    "missing_skills",
    "action_plan_30_days",
]


class AIClientError(Exception):
    pass


def generate_job_recommendations(profile):
    api_key = os.getenv("AI_API_KEY")
    model = os.getenv("AI_MODEL")
    api_base_url = os.getenv("AI_API_BASE_URL", DEFAULT_API_BASE_URL)

    if not api_key:
        raise AIClientError("未配置 AI_API_KEY")
    if not model:
        raise AIClientError("未配置 AI_MODEL")

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是一个务实的中文求职顾问。"
                    "你必须只输出 JSON，不要输出 Markdown、解释或代码块。"
                ),
            },
            {
                "role": "user",
                "content": build_recommendation_prompt(profile),
            },
        ],
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
    }

    response_data = _post_json(api_base_url, api_key, payload)
    content = _extract_message_content(response_data)
    recommendations = _parse_recommendations(content)
    return _validate_recommendations(recommendations)


def build_recommendation_prompt(profile):
    return f"""
请根据下面的求职者画像，推荐最适合的岗位 TOP5。

求职者画像：
- 学历：{profile.get("education")}
- 阶段：{profile.get("stage")}
- 专业：{profile.get("major")}
- 当前城市：{profile.get("city")}
- 目标城市：{profile.get("targetCity")}
- 期望行业：{profile.get("industry")}
- 已掌握技能：{profile.get("skills")}
- 兴趣方向：{profile.get("interests")}
- 实习 / 项目 / 校园经历：{profile.get("experience")}
- 求职偏好：{"、".join(profile.get("preferences") or [])}

输出要求：
1. 必须输出合法 JSON。
2. JSON 顶层必须是对象，包含 top_jobs 字段。
3. top_jobs 必须是长度为 5 的数组。
4. 每个岗位对象必须包含这些字段：
   - title: 岗位名，字符串
   - match_score: 匹配度，0-100 的数字
   - reason: 推荐理由，字符串
   - difficulty: 岗位难度，字符串，例如“低”“中低”“中”“中高”“高”
   - missing_skills: 需要补充的能力，字符串数组
   - action_plan_30_days: 30天行动路线，字符串数组，建议 4 条，覆盖第1周到第4周
5. 推荐要照顾普通本科、双非本科、大专生和普通求职者的现实情况，不要只推荐高门槛岗位。

示例结构：
{{
  "top_jobs": [
    {{
      "title": "内容运营助理",
      "match_score": 88,
      "reason": "推荐理由",
      "difficulty": "中低",
      "missing_skills": ["内容选题", "数据复盘"],
      "action_plan_30_days": ["第1周：...", "第2周：...", "第3周：...", "第4周：..."]
    }}
  ]
}}
""".strip()


def _post_json(url, api_key, payload):
    try:
        import requests
    except ImportError as error:
        raise AIClientError("缺少 requests 依赖，请先运行 pip install -r requirements.txt") from error

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    _validate_headers(headers)

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=45,
        )
        response.raise_for_status()
        return response.json()
    except requests.Timeout as error:
        raise AIClientError("AI 接口请求超时") from error
    except requests.RequestException as error:
        raise AIClientError("AI 接口请求失败") from error
    except json.JSONDecodeError as error:
        raise AIClientError("AI 接口返回了无法解析的 JSON") from error
    except UnicodeEncodeError as error:
        raise AIClientError("AI 请求头包含非 ASCII 字符，请检查 API Key 配置") from error


def _validate_headers(headers):
    for name, value in headers.items():
        try:
            name.encode("ascii")
            value.encode("latin-1")
        except UnicodeEncodeError as error:
            raise AIClientError("AI 请求头包含非 ASCII 字符，请检查 API Key 配置") from error


def _extract_message_content(response_data):
    try:
        return response_data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise AIClientError("AI 接口响应结构不符合预期") from error


def _parse_recommendations(content):
    try:
        data = json.loads(content)
    except json.JSONDecodeError as error:
        raise AIClientError("AI 输出不是合法 JSON") from error

    top_jobs = data.get("top_jobs")
    if not isinstance(top_jobs, list):
        raise AIClientError("AI 输出缺少 top_jobs 数组")

    return top_jobs


def _validate_recommendations(recommendations):
    if len(recommendations) != 5:
        raise AIClientError("AI 输出的岗位数量不是 5 个")

    validated_jobs = []
    for job in recommendations:
        if not isinstance(job, dict):
            raise AIClientError("AI 输出的岗位格式不正确")

        missing_fields = [field for field in REQUIRED_JOB_FIELDS if field not in job]
        if missing_fields:
            raise AIClientError(f"AI 输出缺少字段：{', '.join(missing_fields)}")

        if not isinstance(job["missing_skills"], list):
            raise AIClientError("missing_skills 必须是数组")
        if not isinstance(job["action_plan_30_days"], list):
            raise AIClientError("action_plan_30_days 必须是数组")

        validated_jobs.append({
            "title": str(job["title"]),
            "match_score": _normalize_score(job["match_score"]),
            "reason": str(job["reason"]),
            "difficulty": str(job["difficulty"]),
            "missing_skills": [str(skill) for skill in job["missing_skills"]],
            "action_plan_30_days": [str(step) for step in job["action_plan_30_days"]],
        })

    return validated_jobs


def _normalize_score(score):
    try:
        value = int(score)
    except (TypeError, ValueError) as error:
        raise AIClientError("match_score 必须是数字") from error

    return max(0, min(100, value))
