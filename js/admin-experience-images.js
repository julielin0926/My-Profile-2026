import { API_BASE_URL } from "./api.js";

export function createExperienceImageManager({
    request,
    run,
    askConfirmation,
    getCurrentId
}) {
    const $ = id => document.getElementById(id);

    const imageFields = $("experienceImageFields");
    const imageForm = $("experienceImageForm");
    const imageList = $("experienceImages");
    const imageStatus = $("imageStatus");
    const reloadButton = $("reloadImagesButton");

    const labels = {
        "cover": "主相片／小卡封面",
        "company-logo": "公司 Logo",
        "activity-logo": "活動 Logo",
        "work-1": "工作內容照片 1",
        "work-2": "工作內容照片 2",
        "work-3": "工作內容照片 3",
        "review": "好評截圖"
    };

    const kinds = Object.keys(labels);

    let images = [];
    let ready = false;

    function reset() {
        images = [];
        ready = false;

        imageForm.reset();
        imageList.replaceChildren();
        imageStatus.textContent = "";
        imageFields.disabled = true;

        const hasExperience = getCurrentId() !== null;

        reloadButton.disabled = !hasExperience;

        $("imageHint").textContent = hasExperience
            ? "圖片操作會套用至目前正在編輯的工作經驗。"
            : "請先儲存工作經驗，或從清單選擇一筆資料編輯。";
    }

    function render() {
        imageList.replaceChildren();

        const sortedImages = [...images].sort((a, b) =>
            kinds.indexOf(a.kind) - kinds.indexOf(b.kind) ||
            a.id - b.id
        );

        for (const image of sortedImages) {
            const card = document.createElement("article");
            card.className = "experience-image-card";

            const heading = document.createElement("h3");
            heading.textContent = labels[image.kind] || image.kind;

            const preview = document.createElement("img");
            preview.src = new URL(image.url, API_BASE_URL).href;
            preview.alt = image.caption || heading.textContent;
            preview.loading = "lazy";

            const caption = document.createElement("p");
            caption.textContent = image.caption || "未填寫圖片說明";

            preview.addEventListener("error", () => {
                caption.textContent =
                    "圖片讀取失敗，請確認 API 與原始圖片檔案。";
            });

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "移除此圖片";

            remove.addEventListener("click", () => run(async () => {
                if (!ready) return;

                const experienceId = getCurrentId();
                if (experienceId === null) return;

                const confirmed = await askConfirmation(
                    "確認移除圖片",
                    `確定移除「${labels[image.kind] || image.kind}」嗎？`
                );

                if (!confirmed) return;

                try {
                    await request(
                        `/api/Experiences/${experienceId}/images/${image.id}`,
                        { method: "DELETE" }
                    );
                } catch (error) {
                    await recoverAfterError(error);
                    return;
                }

                await reloadAfterChange("圖片已移除。");
            }));

            card.append(heading, preview, caption, remove);
            imageList.append(card);
        }
    }

    async function load() {
        const experienceId = getCurrentId();
        if (experienceId === null) return;

        ready = false;
        imageFields.disabled = true;
        imageStatus.textContent = "圖片載入中…";

        try {
            const result = await request(
                `/api/Experiences/${experienceId}/images`
            );

            if (getCurrentId() !== experienceId) return;

            if (!Array.isArray(result)) {
                throw new Error("圖片清單格式不正確。");
            }

            images = result;
            render();

            ready = true;
            imageFields.disabled = false;

            imageStatus.textContent = images.length === 0
                ? "目前尚未上傳圖片。"
                : `目前有 ${images.length} 張圖片。`;
        } catch (error) {
            imageStatus.textContent =
                `圖片載入失敗：${error.message}\n` +
                "請按「重新載入圖片」再試。";

            throw error;
        }
    }

    async function reloadAfterChange(message) {
        try {
            await load();
            imageStatus.textContent = message;
        } catch (error) {
            imageStatus.textContent =
                `${message}\n但圖片清單更新失敗：${error.message}\n` +
                "請重新載入圖片，不需要重複上傳。";
        }
    }

    async function recoverAfterError(error) {
        try {
            await load();
        } catch {
            // 保留下面的操作錯誤，使用者仍可重新載入。
        }

        imageStatus.textContent =
            `${error.message}\n` +
            "若是連線中斷，操作可能已完成。" +
            "請先確認圖片清單，再決定是否重試。";
    }

    imageForm.addEventListener("submit", event => {
        event.preventDefault();

        run(async () => {
            if (!ready) return;

            const experienceId = getCurrentId();
            if (experienceId === null) return;

            const file = $("experienceImageFile").files[0];
            const kind = $("imageKind").value;
            const caption = $("imageCaption").value.trim();

            if (!file) {
                imageStatus.textContent = "請先選擇圖片。";
                return;
            }

            if (file.size === 0 || file.size > 5 * 1024 * 1024) {
                imageStatus.textContent =
                    "圖片不可為空，每張不得超過 5 MB。";
                return;
            }

            const replacesExisting = kind !== "review" &&
                images.some(image => image.kind === kind);

            if (replacesExisting) {
                const confirmed = await askConfirmation(
                    "確認更換圖片",
                    `「${labels[kind]}」已有圖片，確定改用新圖片嗎？`
                );

                if (!confirmed) return;
            }

            const data = new FormData();
            data.append("file", file);
            data.append("kind", kind);
            data.append("caption", caption);

            imageStatus.textContent = "圖片上傳中…";

            try {
                await request(
                    `/api/Experiences/${experienceId}/images`,
                    {
                        method: "POST",
                        body: data
                    }
                );
            } catch (error) {
                await recoverAfterError(error);
                return;
            }

            $("experienceImageFile").value = "";
            $("imageCaption").value = "";

            await reloadAfterChange(
                replacesExisting
                    ? `「${labels[kind]}」已更換。`
                    : `「${labels[kind]}」已上傳。`
            );
        });
    });

    reloadButton.addEventListener("click", () => run(load));

    return { reset, load };
}
