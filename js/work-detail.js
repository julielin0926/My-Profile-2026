import { API_BASE_URL } from "./api.js";
import { getHttpsUrl, getImageUrl } from "./work-media.js";

const status = document.getElementById("detailStatus");
const detail = document.getElementById("workDetail");
const id = new URLSearchParams(window.location.search).get("id");
const categories = {
    animation: { name: "動畫作品", page: "animations.html" },
    video: { name: "影音作品", page: "videos.html" },
    game: { name: "遊戲作品", page: "games.html" }
};

async function loadDetail() {
    if (!/^[1-9]\d*$/.test(id ?? "") || !Number.isSafeInteger(Number(id)) || Number(id) > 2147483647) {
        status.textContent = "作品網址不完整或編號無效，請從作品分類頁重新選擇。";
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/Works/${id}`);
        if (response.status === 404) {
            status.textContent = "找不到這件作品，可能已經被刪除。";
            return;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const work = await response.json();
        const category = categories[work.category];
        if (!category) throw new Error("作品分類無效");

        document.title = `${work.title} | My Profile`;
        document.getElementById("workTitle").textContent = work.title;
        document.getElementById("workMeta").textContent =
            [category.name, work.genre, work.year].filter(Boolean).join(" ｜ ");
        const back = document.getElementById("backToWorks");
        back.href = category.page;
        back.textContent = `← 返回${category.name}`;
        document.getElementById("workDescription").textContent =
            work.description?.trim() || "作者尚未填寫這件作品的介紹。";

        const media = document.getElementById("workMedia");
        if (work.category === "game") {
            const imageUrl = getImageUrl(work.imageUrl);
            if (imageUrl) {
                const image = document.createElement("img");
                image.src = imageUrl;
                image.alt = work.title;
                image.addEventListener("error", () => {
                    image.hidden = true;
                    const text = document.createElement("p");
                    text.textContent = "封面暫時無法顯示。";
                    media.append(text);
                }, { once: true });
                media.append(image);
            }
            const externalUrl = getHttpsUrl(work.externalUrl);
            if (externalUrl) {
                const link = document.createElement("a");
                link.href = externalUrl;
                link.textContent = work.buttonText || "前往作品";
                link.className = "button";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                document.getElementById("workLinks").append(link);
            }
        } else if (/^[A-Za-z0-9_-]{11}$/.test(work.youTubeVideoId ?? "")) {
            const iframe = document.createElement("iframe");
            iframe.src = `https://www.youtube.com/embed/${work.youTubeVideoId}`;
            iframe.title = work.title;
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            iframe.allowFullscreen = true;
            media.append(iframe);
        }
        status.textContent = "";
        detail.hidden = false;
    } catch (error) {
        console.error(error);
        status.textContent = "目前無法載入作品，請確認 API 已啟動後重新整理。";
    }
}
loadDetail();
