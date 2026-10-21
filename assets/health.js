(() => {
  "use strict";

  const selfCheck = document.querySelector("#self-check-form");
  const calculateButton = document.querySelector("#calculate-score");
  const scoreContent = document.querySelector("#score-content");
  const scoreValue = document.querySelector("#score-value");
  const scoreHeading = document.querySelector("#score-heading");
  const scoreDescription = document.querySelector("#score-description");

  calculateButton.disabled = false;

  selfCheck.addEventListener("submit", (event) => {
    event.preventDefault();

    const score = selfCheck.querySelectorAll('input[name="self_check"]:checked').length * 10;
    scoreValue.textContent = String(score);

    if (score >= 80) {
      scoreHeading.textContent = "基礎很好";
      scoreDescription.textContent = "你的文件已有骨架，完整健檢可以幫你抓最後的盲點";
    } else if (score >= 50) {
      scoreHeading.textContent = "方向有了，故事還沒成形";
      scoreDescription.textContent = "這正是轉領域申請最常見的卡點，建議送完整健檢";
    } else {
      scoreHeading.textContent = "建議盡快健檢";
      scoreDescription.textContent = "先把主線和時程拉出來，比自己摸索快很多";
    }

    scoreContent.hidden = false;
  });

  selfCheck.addEventListener("change", () => {
    scoreContent.hidden = true;
  });

  if (new URLSearchParams(window.location.search).get("sent") === "1") {
    document.querySelector("#submission-success").hidden = false;
  }
})();

// ===== AI SOP 健檢 =====
(() => {
  const ENDPOINT = "https://pivot-checker.vercel.app/api/check";
  const MAX_BYTES = 2 * 1024 * 1024;
  const DIMS = [
    ["narrative", "主線敘事"],
    ["fit", "科系連結"],
    ["evidence", "具體證據"],
    ["structure", "結構"],
    ["english", "英文表達"],
  ];
  const form = document.getElementById("ai-check-form");
  if (!form) return;
  const fileInput = document.getElementById("ai-file");
  const fileName = document.getElementById("ai-file-name");
  const textArea = document.getElementById("ai-text");
  const status = document.getElementById("ai-status");
  const submitBtn = document.getElementById("ai-submit");
  const resultBox = document.getElementById("ai-result");
  let mode = "file";
  let filePayload = null;

  document.querySelectorAll(".ai-mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      mode = tab.dataset.mode;
      document.querySelectorAll(".ai-mode-tab").forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      document.getElementById("ai-file-panel").hidden = mode !== "file";
      document.getElementById("ai-paste-panel").hidden = mode !== "paste";
      status.textContent = "";
    });
  });

  fileInput.addEventListener("change", () => {
    filePayload = null;
    const f = fileInput.files[0];
    if (!f) { fileName.textContent = "尚未選擇檔案"; return; }
    if (f.size > MAX_BYTES) {
      fileName.textContent = `「${f.name}」超過 2MB 上限，請換小一點的檔案。`;
      return;
    }
    if (!/\.(pdf|docx|txt)$/i.test(f.name)) {
      fileName.textContent = "只支援 PDF、DOCX、TXT 檔案。";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      filePayload = {
        dataBase64: String(reader.result).split(",")[1],
        fileName: f.name,
        mimeType: f.type || "",
      };
      fileName.textContent = `已選擇：${f.name}（${(f.size / 1024).toFixed(0)} KB）`;
    };
    reader.onerror = () => { fileName.textContent = "讀取檔案失敗，請再試一次。"; };
    reader.readAsDataURL(f);
  });

  function renderResult(data) {
    const r = data.result || {};
    document.getElementById("ai-overall").textContent = r.overall || "";
    const scoresBox = document.getElementById("ai-scores");
    scoresBox.innerHTML = "";
    DIMS.forEach(([key, label]) => {
      const item = (r.scores || {})[key] || {};
      const score = Math.max(1, Math.min(5, Number(item.score) || 1));
      const row = document.createElement("div");
      row.className = "ai-score-row";
      const dots = "●".repeat(score) + "○".repeat(5 - score);
      row.innerHTML = `<div class="ai-score-head"><span class="ai-score-label"></span><span class="ai-score-dots" aria-label="${score} / 5 分">${dots}</span></div><p class="ai-score-comment"></p>`;
      row.querySelector(".ai-score-label").textContent = label;
      row.querySelector(".ai-score-comment").textContent = item.comment || "";
      scoresBox.appendChild(row);
    });
    const list = document.getElementById("ai-priorities");
    list.innerHTML = "";
    (r.priorities || []).forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      list.appendChild(li);
    });
    document.getElementById("ai-priorities-wrap").hidden = !(r.priorities || []).length;
    document.getElementById("ai-truncated").hidden = !data.truncated;
    resultBox.hidden = false;
    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    resultBox.hidden = true;
    const payload = {
      targetSchool: document.getElementById("ai-school").value.trim(),
      targetProgramme: document.getElementById("ai-programme").value.trim(),
    };
    if (mode === "file") {
      if (!filePayload) { status.textContent = "請先選擇一個 SOP 檔案。"; return; }
      Object.assign(payload, filePayload);
    } else {
      const t = textArea.value.trim();
      if (t.length < 200) { status.textContent = "貼上的文字太短（至少約 200 字），無法健檢。"; return; }
      payload.text = t;
    }
    if (!ENDPOINT || ENDPOINT.startsWith("__")) {
      status.textContent = "AI 健檢即將上線，請先使用下方的人工完整健檢。";
      return;
    }
    submitBtn.disabled = true;
    status.textContent = "AI 分析中，約需 10–30 秒，請稍候……";
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        status.textContent = data.message || "健檢暫時無法完成，請稍後再試，或使用人工完整健檢。";
        return;
      }
      status.textContent = "";
      renderResult(data);
    } catch {
      status.textContent = "連線失敗，請檢查網路後再試一次。";
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
