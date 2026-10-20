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
