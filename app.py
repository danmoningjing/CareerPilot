from flask import Flask, jsonify, render_template, request


app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/recommend")
def recommend_jobs():
    profile = request.get_json(silent=True) or {}

    required_fields = ["education", "stage", "major", "city", "skills", "experience"]
    missing_fields = [field for field in required_fields if not profile.get(field)]
    if missing_fields:
        return jsonify({
            "error": "缺少必要字段",
            "missing_fields": missing_fields,
        }), 400

    major = profile.get("major", "你的专业")
    skills = profile.get("skills", "现有技能")
    target_city = profile.get("targetCity") or profile.get("city", "目标城市")
    preferences = profile.get("preferences") or []
    preference_text = "、".join(preferences) if preferences else "岗位匹配度和短期可执行性"

    recommendations = [
        {
            "title": "内容运营助理",
            "match_score": 88,
            "reason": f"你当前的{major}背景和{skills}可以迁移到内容策划、资料整理和用户沟通场景，适合作为互联网或本地生活岗位的入门方向。",
            "difficulty": "中低",
            "missing_skills": ["内容选题", "数据复盘", "平台规则理解"],
            "action_plan_30_days": [
                "第1-7天：拆解 20 个同城招聘 JD，整理内容运营高频能力关键词。",
                "第8-14天：完成 3 篇图文或短视频选题方案，补充到作品集中。",
                "第15-21天：学习基础数据指标，包括阅读量、转化率、留存和复盘模板。",
                f"第22-30天：围绕{target_city}每天投递 8-10 个内容运营、用户运营、新媒体运营岗位。",
            ],
        },
        {
            "title": "用户运营专员",
            "match_score": 84,
            "reason": f"你的求职偏好偏向{preference_text}，用户运营岗位对学历门槛相对友好，更看重沟通、执行、活动推进和复盘能力。",
            "difficulty": "中",
            "missing_skills": ["用户分层", "社群运营", "活动复盘"],
            "action_plan_30_days": [
                "第1-7天：学习用户运营基础概念，整理拉新、促活、留存案例。",
                "第8-14天：设计一个社群活动方案，包含目标、流程、话术和数据指标。",
                "第15-21天：把过往校园、社团、兼职经历改写成运营项目表达。",
                "第22-30天：重点投递用户运营、社群运营、活动运营岗位并记录反馈。",
            ],
        },
        {
            "title": "电商运营助理",
            "match_score": 80,
            "reason": "电商运营助理岗位入门路径清晰，适合从商品维护、活动配置、数据表格和客服协同开始积累商业经验。",
            "difficulty": "中",
            "missing_skills": ["Excel 数据处理", "电商平台规则", "商品与活动基础"],
            "action_plan_30_days": [
                "第1-7天：熟悉淘宝、京东、抖音电商的基础岗位 JD 和常见工作内容。",
                "第8-14天：练习 Excel 排序、筛选、透视表和简单销售数据分析。",
                "第15-21天：输出一份店铺活动复盘示例，包含问题、数据和改进动作。",
                "第22-30天：投递电商运营助理、商品运营助理、直播运营助理岗位。",
            ],
        },
        {
            "title": "数据分析助理",
            "match_score": 76,
            "reason": "如果你愿意补充 SQL、Excel 和基础可视化能力，数据分析助理可以成为更偏技能型的发展方向。",
            "difficulty": "中高",
            "missing_skills": ["SQL 基础", "Excel 函数", "数据可视化"],
            "action_plan_30_days": [
                "第1-7天：补齐 Excel 常用函数、透视表和图表制作。",
                "第8-14天：学习 SQL 查询基础，重点掌握 select、where、group by、join。",
                "第15-21天：用公开数据做一个简单分析报告，展示问题、过程和结论。",
                "第22-30天：投递数据运营、商业分析助理、数据分析实习岗位。",
            ],
        },
        {
            "title": "产品助理",
            "match_score": 72,
            "reason": "产品助理适合对互联网业务、用户体验和需求分析感兴趣的人，但需要补充文档表达、原型工具和业务拆解能力。",
            "difficulty": "中高",
            "missing_skills": ["需求文档", "Axure / Figma", "竞品分析"],
            "action_plan_30_days": [
                "第1-7天：拆解 3 个常用 App 的核心流程，写出用户目标和关键页面。",
                "第8-14天：学习产品需求文档结构，完成一个小功能 PRD。",
                "第15-21天：用 Figma 或 Axure 画出低保真原型。",
                "第22-30天：投递产品助理、产品运营、项目助理岗位。",
            ],
        },
    ]

    return jsonify({
        "profile": profile,
        "top_jobs": recommendations,
    })


if __name__ == "__main__":
    app.run(debug=True)
