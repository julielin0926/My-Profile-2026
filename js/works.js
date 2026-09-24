import { API_BASE_URL } from "./api.js";

const list = document.getElementById("worksList");
const status = document.getElementById("worksStatus");
const category = list.dataset.category;

import { addText, getImageUrl } from "./work-media.js";

function createCard(work) {
    const card = document.createElement("article");
    card.className = "work-card";
    addText(card, "h3", work.title);

    const videoId = work.youTubeVideoId;
    const imageUrl = work.category === "game"
        ? getImageUrl(work.imageUrl)
        : (/^[A-Za-z0-9_-]{11}$/.test(videoId ?? "")
            ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

    if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = work.title;
        image.loading = "lazy";
        image.addEventListener("error", () => {
            image.hidden = true;
            const fallback = document.createElement("p");
            fallback.className = "work-cover-placeholder";
            fallback.textContent = "封面暫時無法顯示";
            image.after(fallback);
        }, { once: true });
        card.append(image);
    } else {
        addText(card, "p", "尚未提供封面").className = "work-cover-placeholder";
    }
    if (work.category === "game") {
        addText(card, "p", work.genre ?? "");
        addText(card, "p", String(work.year ?? ""));
    }
    const link = document.createElement("a");
    link.href = `work.html?id=${encodeURIComponent(work.id)}`;
    link.textContent = "了解更多";
    link.className = "button";
    link.setAttribute("aria-label", `了解更多：${work.title}`);
    card.append(link);
    return card;
}

async function loadWorks() {
    status.textContent = "作品載入中…";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/Works?category=${encodeURIComponent(category)}`
        );

        if (!response.ok) {
            throw new Error(`讀取失敗，HTTP ${response.status}`);
        }

        const works = await response.json();

        if (!Array.isArray(works)) {
            throw new Error("API 回傳的作品格式不正確");
        }

        list.replaceChildren();

        for (const work of works) {
            list.append(createCard(work));
        }

        status.textContent = works.length === 0
            ? "目前還沒有作品。"
            : "";
    } catch (error) {
        console.error(error);
        status.textContent =
            "目前無法載入作品，請確認 API 已啟動後重新整理。";
    }
}

loadWorks();