import { getPublicWorks } from "./public-data.js";

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
        const allWorks = await getPublicWorks();

        const works = allWorks.filter(
            work => work.category === category
        );

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
                    "目前無法載入公開作品資料，請稍後重新整理。";
            }
        }

loadWorks();