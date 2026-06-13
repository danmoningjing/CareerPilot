const form = document.querySelector("#profileForm");
const previewContent = document.querySelector("#previewContent");
const profileStatus = document.querySelector("#profileStatus");
const formHint = document.querySelector("#formHint");
const submitButton = form.querySelector('button[type="submit"]');
const resultActions = document.querySelector("#resultActions");
const regenerateButton = document.querySelector("#regenerateButton");
const copyButton = document.querySelector("#copyButton");
let latestRecommendations = [];

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map((input) => input.value);
}

function getProfile() {
  const data = new FormData(form);

  return {
    education: data.get("education"),
    stage: data.get("stage"),
    major: data.get("major"),
    city: data.get("city"),
    targetCity: data.get("targetCity") || "暂不确定",
    industry: data.get("industry") || "暂不确定",
    skills: data.get("skills"),
    interests: data.get("interests") || "暂不确定",
    experience: data.get("experience"),
    preferences: getCheckedValues("preferences"),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeScore(score) {
  const value = Number.parseInt(score, 10);
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function getDifficultyClass(difficulty) {
  if (String(difficulty).includes("高")) {
    return "difficulty-high";
  }
  if (String(difficulty).includes("低")) {
    return "difficulty-low";
  }

  return "difficulty-medium";
}

function groupActionPlanByWeek(steps) {
  const fallbackWeeks = ["第1周", "第2周", "第3周", "第4周"];

  return fallbackWeeks.map((week, index) => ({
    week,
    text: steps[index] || "根据岗位反馈调整学习和投递计划。",
  }));
}

function setResultActionsVisible(visible) {
  resultActions.hidden = !visible;
}

function renderProfile(profile) {
  const preferences = profile.preferences.length
    ? profile.preferences.join("、")
    : "暂不确定";

  previewContent.className = "profile-summary";
  previewContent.innerHTML = `
    <div class="summary-item">
      <span>基础背景</span>
      <strong>${escapeHtml(profile.education)} / ${escapeHtml(profile.stage)} / ${escapeHtml(profile.major)}</strong>
    </div>
    <div class="summary-item">
      <span>城市与行业</span>
      <strong>${escapeHtml(profile.city)} -> ${escapeHtml(profile.targetCity)} / ${escapeHtml(profile.industry)}</strong>
    </div>
    <div class="summary-item">
      <span>技能</span>
      <strong>${escapeHtml(profile.skills)}</strong>
    </div>
    <div class="summary-item">
      <span>兴趣方向</span>
      <strong>${escapeHtml(profile.interests)}</strong>
    </div>
    <div class="summary-item">
      <span>经历</span>
      <strong>${escapeHtml(profile.experience)}</strong>
    </div>
    <div class="summary-item">
      <span>求职偏好</span>
      <strong>${escapeHtml(preferences)}</strong>
    </div>
  `;
}

function renderRecommendations(jobs) {
  latestRecommendations = jobs;
  setResultActionsVisible(jobs.length > 0);

  previewContent.className = "recommendation-list";
  previewContent.innerHTML = jobs.map((job, index) => `
    <article class="job-card ${index === 0 ? "featured-job" : ""}">
      <div class="job-card-header">
        <div class="job-title-group">
          <span class="job-rank">TOP ${index + 1}</span>
          <h3>${escapeHtml(job.title)}</h3>
        </div>
        <div class="match-block" aria-label="匹配度 ${normalizeScore(job.match_score)}%">
          <strong>${normalizeScore(job.match_score)}%</strong>
          <span>匹配度</span>
        </div>
      </div>
      <div class="score-track">
        <span style="width: ${normalizeScore(job.match_score)}%"></span>
      </div>
      <div class="job-meta">
        <span class="difficulty-pill ${getDifficultyClass(job.difficulty)}">难度：${escapeHtml(job.difficulty)}</span>
      </div>
      <div class="job-section reason-section">
        <h4>推荐理由</h4>
        <p class="job-reason">${escapeHtml(job.reason)}</p>
      </div>
      <div class="job-section">
        <h4>需要补充的能力</h4>
        <div class="skill-tags">
          ${job.missing_skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}
        </div>
      </div>
      <div class="job-section">
        <h4>30天行动路线</h4>
        <div class="weekly-plan">
          ${groupActionPlanByWeek(job.action_plan_30_days).map((item) => `
            <div class="week-item">
              <span>${escapeHtml(item.week)}</span>
              <p>${escapeHtml(item.text)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </article>
  `).join("");
}

function renderLoading() {
  setResultActionsVisible(false);
  previewContent.className = "empty-state loading-state";
  previewContent.innerHTML = `
    <strong>正在生成岗位 TOP5...</strong>
    <p>系统正在提交求职画像，并读取后端模拟推荐数据。</p>
  `;
}

function renderError(message) {
  setResultActionsVisible(false);
  previewContent.className = "empty-state error-state";
  previewContent.innerHTML = `
    <strong>${escapeHtml(message)}</strong>
    <p>请检查表单内容后重新提交。</p>
  `;
}

function formatRecommendationsForCopy(jobs) {
  return jobs.map((job, index) => {
    const weeklyPlan = groupActionPlanByWeek(job.action_plan_30_days)
      .map((item) => `${item.week}：${item.text}`)
      .join("\n");

    return [
      `TOP ${index + 1} ${job.title}`,
      `匹配度：${job.match_score}%`,
      `岗位难度：${job.difficulty}`,
      `推荐理由：${job.reason}`,
      `需要补充的能力：${job.missing_skills.join("、")}`,
      `30天行动路线：\n${weeklyPlan}`,
    ].join("\n");
  }).join("\n\n");
}

async function copyRecommendations() {
  if (!latestRecommendations.length) {
    return;
  }

  const text = formatRecommendationsForCopy(latestRecommendations);

  try {
    await navigator.clipboard.writeText(text);
    formHint.textContent = "推荐结果已复制。";
  } catch (error) {
    renderError("复制失败，请在浏览器中允许剪贴板权限后重试。");
  }
}

async function requestRecommendations(profile) {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "生成推荐失败");
  }

  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const profile = getProfile();
  profileStatus.textContent = "生成中";
  formHint.textContent = "正在提交到 /api/recommend 并生成模拟推荐。";
  submitButton.disabled = true;
  submitButton.textContent = "生成中...";
  renderLoading();

  try {
    const data = await requestRecommendations(profile);
    renderRecommendations(data.top_jobs || []);
    profileStatus.textContent = "已生成";
    formHint.textContent = data.notice || (
      data.source === "ai"
        ? "已返回 AI 生成的岗位 TOP5。"
        : "已返回模拟岗位 TOP5。"
    );
  } catch (error) {
    renderError(error.message);
    profileStatus.textContent = "失败";
    formHint.textContent = "接口请求失败，请确认 Flask 服务正在运行。";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "生成岗位推荐";
  }
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    latestRecommendations = [];
    setResultActionsVisible(false);
    profileStatus.textContent = "待填写";
    formHint.textContent = "提交后会调用 /api/recommend，当前返回模拟岗位推荐。";
    previewContent.className = "empty-state";
    previewContent.innerHTML = `
      <strong>填写左侧信息后，这里会展示岗位 TOP5。</strong>
      <p>当前阶段先使用模拟数据，后续可替换为真实 AI 推荐。</p>
    `;
  });
});

regenerateButton.addEventListener("click", () => {
  form.requestSubmit();
});

copyButton.addEventListener("click", copyRecommendations);
