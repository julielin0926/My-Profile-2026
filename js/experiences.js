import {
    getExperiences,
    createExperienceImage
} from "./experience-data.js";

const grid = document.getElementById("experienceGrid");
const status = document.getElementById("experienceStatus");

async function loadExperiences() {
    try {
        const items = await getExperiences();

        grid.replaceChildren();

        for (const item of items) {
            const card = document.createElement("article");
            card.className = "experience-card";

            const title = document.createElement("h3");
            title.textContent = item.title;
            card.append(title);

            const cover = item.images.find(
                image => image.kind === "cover"
            );

            const image = createExperienceImage(
                cover,
                `${item.title}主相片`
            );

            if (image) card.append(image);

            const meta = document.createElement("p");
            meta.className = "experience-meta";
            meta.textContent = [
                item.company,
                item.role,
                item.period
            ].filter(Boolean).join("｜");

            if (meta.textContent) card.append(meta);

            const summary = document.createElement("p");
            summary.textContent = item.summary || "";
            card.append(summary);

            const link = document.createElement("a");
            link.className = "button";
            link.href = `experience-detail.html?id=${item.id}`;
            link.textContent = "了解更多";
            link.setAttribute(
                "aria-label",
                `了解更多：${item.title}`
            );

            card.append(link);
            grid.append(card);
        }

        status.textContent = items.length === 0
            ? "目前尚無公開的工作經驗。"
            : "";
    } catch (error) {
        status.textContent =
            `${error.message} 請確認已匯出工作經驗資料。`;
    }
}

loadExperiences();