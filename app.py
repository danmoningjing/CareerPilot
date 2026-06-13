from flask import Flask, jsonify, render_template, request

from services.ai_client import AIClientError, generate_job_recommendations
from services.job_matcher import get_mock_recommendations
from utils.env_loader import load_env_file
from utils.validators import validate_profile


load_env_file()

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/recommend")
def recommend_jobs():
    profile = request.get_json(silent=True) or {}

    missing_fields = validate_profile(profile)
    if missing_fields:
        return jsonify({
            "error": "缺少必要字段",
            "missing_fields": missing_fields,
        }), 400

    try:
        recommendations = generate_job_recommendations(profile)
        return jsonify({
            "profile": profile,
            "source": "ai",
            "top_jobs": recommendations,
        })
    except AIClientError as error:
        recommendations = get_mock_recommendations(profile)
        return jsonify({
            "profile": profile,
            "source": "mock_fallback",
            "notice": f"AI 推荐暂时不可用，已返回模拟推荐：{error}",
            "top_jobs": recommendations,
        })


if __name__ == "__main__":
    app.run(debug=True)
