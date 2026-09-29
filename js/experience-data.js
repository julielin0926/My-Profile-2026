const dataUrl = new URL(
    "../Data/experiences.json",
    import.meta.url
);

const siteRoot = new URL("../", import.meta.url);

let experiencesPromise;

export function getExperiences() {
    if (!experiencesPromise) {
        experiencesPromise = fetch(dataUrl, {
            cache: "no-cache"
        }).then(async response => {
            if (!response.ok) {
                throw new Error(
                    `工作經驗資料讀取失敗：HTTP ${response.status}`
                );
            }

            const items = await response.json();

            if (
                !Array.isArray(items) ||
                items.some(item =>
                    !Number.isSafeInteger(item.id) ||
                    item.id <= 0 ||
                    typeof item.title !== "string" ||
                    !Array.isArray(item.images)
                )
            ) {
                throw new Error("工作經驗資料格式不正確。");
            }

            return [...items].sort((a, b) =>
                a.sortOrder - b.sortOrder || a.id - b.id
            );
        });
    }

    return experiencesPromise;
}

export function getExperienceImageUrl(value) {
    if (
        typeof value !== "string" ||
        !/^Data\/experience-images\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(value)
    ) {
        return null;
    }

    return new URL(value, siteRoot).href;
}

export function createExperienceImage(image, fallbackText) {
    const url = getExperienceImageUrl(image?.url);
    if (!url) return null;

    const element = document.createElement("img");

    element.src = url;
    element.alt = image.caption || fallbackText;
    element.loading = "lazy";

    element.addEventListener("error", () => {
        const message = document.createElement("p");
        message.className = "experience-image-error";
        message.textContent = `${fallbackText}暫時無法載入。`;

        element.replaceWith(message);
    }, { once: true });

    return element;
}