import { API_BASE_URL } from "./api.js";

const list = document.getElementById("worksList");
const status = document.getElementById("worksStatus");
const category = list.dataset.category;

function addText(parent, tag, value) {
    const element = document.createElement(tag);
    element.textContent = value;
    parent.append(element);
    return element;
}

function getHttpsUrl(value) {
    try {
        const url = new URL(value);

        if (
            url.protocol === "https:" &&
            !url.username &&
            !url.password
        ) {
            return url.href;
        }
    } catch {
        // 不是完整網址時，回傳 null。
    }

    return null;
}

function getImageUrl(value) {
    if (typeof value !== "string") {
        return null;
    }

    const httpsUrl = getHttpsUrl(value);

    if (httpsUrl) {
        return httpsUrl;
    }

    if (
        value.startsWith("images/") &&
        value.length > 7 &&
        !/[\\%?#]/.test(value) &&
        !value.includes("..")
    ) {
        return new URL(value, window.location.href).href;
    }

    return null;
}

function createCard(work) {
    const card = document.createElement("article");
    card.className = "work-card";

    addText(card, "h3", work.title);

    if (work.category === "game") {
        const imageUrl = getImageUrl(work.imageUrl);

        if (imageUrl) {
            const image = document.createElement("img");
            image.src = imageUrl;
            image.alt = work.title;
            image.loading = "lazy";
            card.append(image);
        }

        addText(card, "p", work.genre ?? "");
        addText(card, "p", String(work.year ?? ""));

        const externalUrl = getHttpsUrl(work.externalUrl);

        if (externalUrl) {
            const link = document.createElement("a");
            link.href = externalUrl;
            link.textContent = work.buttonText || "查看作品";
            link.className = "button";
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            card.append(link);
        }
    } else {
        const videoId = work.youTubeVideoId;

        if (/^[A-Za-z0-9_-]{11}$/.test(videoId ?? "")) {
            const iframe = document.createElement("iframe");

            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            iframe.title = work.title;
            iframe.loading = "lazy";
            iframe.allow =
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            iframe.allowFullscreen = true;

            card.append(iframe);
        } else {
            addText(card, "p", "這件作品尚無有效的影片資料。");
        }
    }

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