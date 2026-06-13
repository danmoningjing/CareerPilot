const form = document.querySelector("#profileForm");
const previewContent = document.querySelector("#previewContent");
const profileStatus = document.querySelector("#profileStatus");
const formHint = document.querySelector("#formHint");
const submitButton = form.querySelector('button[type="submit"]');

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
  previewContent.className = "recommendation-list";
  previewContent.innerHTML = jobs.map((job, index) => `
    <article class="job-card">
      <div class="job-card-header">
        <div>
          <span class="job-rank">TOP ${index + 1}</span>
          <h3>${escapeHtml(job.title)}</h3>
        </div>
        <strong class="match-score">${escapeHtml(job.match_score)}%</strong>
      </div>
      <p class="job-reason">${escapeHtml(job.reason)}</p>
      <div class="job-meta">
        <span>难度：${escapeHtml(job.difficulty)}</span>
      </div>
      <div class="job-section">
        <h4>需要补充的能力</h4>
        <div class="skill-tags">
          ${job.missing_skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}
        </div>
      </div>
      <div class="job-section">
        <h4>30天行动路线</h4>
        <ol>
          ${job.action_plan_30_days.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
    </article>
  `).join("");
}

function renderLoading() {
  previewContent.className = "empty-state loading-state";
  previewContent.innerHTML = `
    <strong>正在生成岗位 TOP5...</strong>
    <p>系统正在提交求职画像，并读取后端模拟推荐数据。</p>
  `;
}

function renderError(message) {
  previewContent.className = "empty-state error-state";
  previewContent.innerHTML = `
    <strong>${escapeHtml(message)}</strong>
    <p>请检查表单内容后重新提交。</p>
  `;
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
    profileStatus.textContent = "待填写";
    formHint.textContent = "提交后会调用 /api/recommend，当前返回模拟岗位推荐。";
    previewContent.className = "empty-state";
    previewContent.innerHTML = `
      <strong>填写左侧信息后，这里会展示岗位 TOP5。</strong>
      <p>当前阶段先使用模拟数据，后续可替换为真实 AI 推荐。</p>
    `;
  });
});
