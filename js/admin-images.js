import { API_BASE_URL } from "./api.js";

const imageList = document.getElementById("existingWorkImages");
const fileInput = document.getElementById("editWorkImages");
const uploadButton = document.getElementById("uploadWorkImagesButton");
const imageStatus = document.getElementById("editImagesStatus");
const imageFields = document.getElementById("editImagesFields");
const dialog = document.getElementById("descriptionDialog");

let currentWorkId = null;
let busy = false;

export function imagesAreBusy() {
    return busy;
}

function setBusy(value) {
    busy = value;
    imageFields.disabled = value;

    document.getElementById("cancelDescription").disabled = value;
    document.getElementById("saveDescription").disabled = value;
}

async function checkedResponse(response) {
    if (response.status === 401) {
        throw new Error("登入已失效，請關閉視窗並重新登入。");
    }

    if (!response.ok) {
        const problem = await response.json().catch(() => null);

        throw new Error(
            problem?.message || `操作失敗，HTTP ${response.status}`
        );
    }

    return response;
}

// 新增作品流程也可以重用這個函式。
export async function uploadImages(workId, files) {
    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("請先登入。");
    }

    let uploaded = 0;

    for (const file of files) {
        try {
            if (file.size === 0 || file.size > 5 * 1024 * 1024) {
                throw new Error("圖片不可為空，且每張不得超過 5 MB。");
            }

            const data = new FormData();
            data.append("file", file);

            const response = await fetch(
                `${API_BASE_URL}/api/Works/${workId}/images`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: data
                }
            );

            await checkedResponse(response);
            uploaded++;
        } catch (error) {
            throw new Error(
                `已確認上傳 ${uploaded} 張；「${file.name}」未能確認成功：` +
                `${error.message}。請先查看圖片清單再重試，避免重複上傳。`
            );
        }
    }

    return uploaded;
}

async function renderImages(workId) {
    const response = await fetch(
        `${API_BASE_URL}/api/Works/${workId}/images`,
        { cache: "no-store" }
    );

    await checkedResponse(response);
    const images = await response.json();

    // 避免舊請求更新到另一件作品的視窗。
    if (currentWorkId !== workId) return;

    imageList.replaceChildren();

    if (images.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "目前沒有精華圖片。";
        imageList.append(empty);
        return;
    }

    for (const image of images) {
        const item = document.createElement("div");

        const preview = document.createElement("img");
        preview.src = new URL(image.url, API_BASE_URL).href;
        preview.alt = image.caption || "作品精華畫面";
        preview.loading = "lazy";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "移除此圖片";

        removeButton.addEventListener("click", async () => {
            if (busy) return;

            if (!window.confirm("確定要從這件作品移除這張圖片嗎？")) {
                return;
            }

            setBusy(true);
            imageStatus.textContent = "";

            try {
                const token = localStorage.getItem("token");

                if (!token) throw new Error("請先登入。");

                const response = await fetch(
                    `${API_BASE_URL}/api/Works/${workId}/images/${image.id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.status !== 404) {
                    await checkedResponse(response);
                }

                await renderImages(workId);
                imageStatus.textContent = "圖片已移除。";
            } catch (error) {
                imageStatus.textContent = error.message;
            } finally {
                setBusy(false);
            }
        });

        item.append(preview, removeButton);
        imageList.append(item);
    }
}

export async function openWorkImages(workId) {
    currentWorkId = workId;
    fileInput.value = "";
    imageList.replaceChildren();
    imageStatus.textContent = "圖片載入中…";
    setBusy(true);

    try {
        await renderImages(workId);
        imageStatus.textContent = "";
    } catch (error) {
        imageStatus.textContent = error.message;
    } finally {
        setBusy(false);
    }
}

uploadButton.addEventListener("click", async () => {
    if (busy || currentWorkId === null) return;

    const files = [...fileInput.files];

    if (files.length === 0) {
        imageStatus.textContent = "請先選擇圖片。";
        return;
    }

    setBusy(true);
    imageStatus.textContent = "圖片上傳中…";

    try {
        const count = await uploadImages(currentWorkId, files);
        fileInput.value = "";

        await renderImages(currentWorkId);
        imageStatus.textContent = `已上傳 ${count} 張圖片。`;
    } catch (error) {
        imageStatus.textContent = error.message;

        // 即使部分失敗，也嘗試呈現已上傳成功的圖片。
        try {
            await renderImages(currentWorkId);
        } catch {
            // 保留原本的上傳錯誤訊息。
        }
    } finally {
        setBusy(false);
    }
});

dialog.addEventListener("cancel", event => {
    if (busy) event.preventDefault();
});