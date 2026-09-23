import { API_BASE_URL } from "./api.js";

const form = document.getElementById("workForm");
const workFields = document.getElementById("workFields");
const category = document.getElementById("category");
const videoFields = document.getElementById("videoFields");
const gameFields = document.getElementById("gameFields");
const authStatus = document.getElementById("authStatus");
const saveStatus = document.getElementById("saveStatus");
const saveButton = document.getElementById("saveButton");
const manageWorks = document.getElementById("manageWorks");
const adminWorksList = document.getElementById("adminWorksList");
const manageStatus = document.getElementById("manageStatus");
const reloadWorksButton = document.getElementById("reloadWorksButton");

const deleteDialog = document.getElementById("deleteDialog");
const deleteDialogMessage = document.getElementById("deleteDialogMessage");
const deleteError = document.getElementById("deleteError");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");

let pendingDeleteWork = null;
let deleting = false;
let loadingWorks = false;
let deleteTrigger = null;

let saving = false;

function returnToLogin() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}

document.getElementById("logoutButton")
    .addEventListener("click", returnToLogin);

function updateFields() {
    const isGame = category.value === "game";

    videoFields.hidden = isGame;
    videoFields.disabled = isGame;

    gameFields.hidden = !isGame;
    gameFields.disabled = !isGame;

    document.getElementById("youtubeSrc").required = !isGame;

    for (const id of [
        "imageUrl",
        "genre",
        "year",
        "externalUrl",
        "buttonText"
    ]) {
        document.getElementById(id).required = isGame;
    }
}

category.addEventListener("change", updateFields);
updateFields();

async function checkLogin() {
    const token = localStorage.getItem("token");

    if (!token) {
        returnToLogin();
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/Author/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            returnToLogin();
            return;
        }

        if (!response.ok) {
            throw new Error(`驗證失敗：${response.status}`);
        }

        const author = await response.json();

        authStatus.textContent = `歡迎回來，${author.username}`;
        workFields.disabled = false;

        manageWorks.hidden = false;
        await loadAdminWorks();
    } catch (error) {
        console.error(error);
        authStatus.textContent =
            "無法確認登入狀態，請確認 API 已啟動後重新整理。";
    }
}

function textValue(id) {
    return document.getElementById(id).value.trim();
}

function extractYouTubeId(src) {
    let url;

    try {
        url = new URL(src);
    } catch {
        throw new Error("請輸入完整的 YouTube 嵌入式 src 網址。");
    }

    const allowedHosts = [
        "www.youtube.com",
        "youtube.com",
        "www.youtube-nocookie.com",
        "youtube-nocookie.com"
    ];

    if (
        url.protocol !== "https:" ||
        !allowedHosts.includes(url.hostname) ||
        url.username ||
        url.password ||
        url.port
    ) {
        throw new Error("請使用 YouTube 的 HTTPS 嵌入式網址。");
    }

    const match = url.pathname.match(
        /^\/embed\/([A-Za-z0-9_-]{11})\/?$/
    );

    if (!match) {
        throw new Error(
            "網址格式應為 https://www.youtube.com/embed/影片ID"
        );
    }

    return match[1];
}

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (saving) {
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        returnToLogin();
        return;
    }

    const isGame = category.value === "game";
    const title = textValue("title");

    if (!title) {
        saveStatus.textContent = "作品名稱不可只有空白。";
        document.getElementById("title").focus();
        return;
    }

    let videoId = null;

    if (!isGame) {
        try {
            videoId = extractYouTubeId(textValue("youtubeSrc"));
        } catch (error) {
            saveStatus.textContent = error.message;
            document.getElementById("youtubeSrc").focus();
            return;
        }
    }

    const payload = {
        title,
        category: category.value,
        youTubeVideoId: videoId,
        imageUrl: isGame ? textValue("imageUrl") : null,
        genre: isGame ? textValue("genre") : null,
        year: isGame ? Number(textValue("year")) : null,
        externalUrl: isGame ? textValue("externalUrl") : null,
        buttonText: isGame ? textValue("buttonText") : null,
        sortOrder: Number(textValue("sortOrder"))
    };

    saving = true;
    saveButton.disabled = true;
    saveButton.textContent = "儲存中…";
    saveStatus.textContent = "";

    try {
        const response = await fetch(`${API_BASE_URL}/api/Works`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            alert("登入已失效，請重新登入後再新增作品。");
            returnToLogin();
            return;
        }

        if (!response.ok) {
            const problem = await response.json().catch(() => null);

            const details = problem?.errors
                ? Object.values(problem.errors).flat().join("；")
                : problem?.message;

            throw new Error(
                details || `儲存失敗，HTTP ${response.status}`
            );
        }

        const savedWork = await response.json();

        form.reset();
        updateFields();

        saveStatus.textContent =
            `「${savedWork.title}」已儲存，作品編號：${savedWork.id}。`;
            await loadAdminWorks();
    } catch (error) {
        console.error(error);
        saveStatus.textContent =
            `${error.message} 若連線中斷，請先查看作品頁確認是否已新增，再決定是否重送。`;
    } finally {
        saving = false;
        saveButton.disabled = false;
        saveButton.textContent = "儲存作品";
    }
});

async function loadAdminWorks() {
    if (loadingWorks) {
        return;
    }

    loadingWorks = true;
    reloadWorksButton.disabled = true;
    manageStatus.textContent = "正在載入作品…";

    try {
        const response = await fetch(`${API_BASE_URL}/api/Works`, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`讀取失敗，HTTP ${response.status}`);
        }

        const works = await response.json();

        if (!Array.isArray(works)) {
            throw new Error("作品資料格式不正確");
        }

        adminWorksList.replaceChildren();

        const categoryNames = {
            animation: "動畫",
            video: "影音",
            game: "遊戲"
        };

        for (const work of works) {
            const item = document.createElement("li");
            item.className = "admin-work-item";

            const info = document.createElement("div");
            info.className = "admin-work-info";

            const title = document.createElement("h3");
            title.textContent = work.title;

            const details = document.createElement("p");
            details.textContent =
                `${categoryNames[work.category] ?? work.category}｜編號 ${work.id}`;

            info.append(title, details);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "刪除";
            deleteButton.setAttribute(
                "aria-label",
                `刪除作品：${work.title}`
            );

            deleteButton.addEventListener("click", () => {
                openDeleteDialog(work, deleteButton);
            });

            item.append(info, deleteButton);
            adminWorksList.append(item);
        }

        manageStatus.textContent = works.length === 0
            ? "目前沒有作品。"
            : `共 ${works.length} 件作品。`;

        return true;
    } catch (error) {
        console.error(error);
        manageStatus.textContent =
            "無法更新清單，畫面上的資料可能不是最新的，請按重新整理清單再試。";

        return false;
    } finally {
        loadingWorks = false;
        reloadWorksButton.disabled = false;
    }
}

reloadWorksButton.addEventListener("click", loadAdminWorks);

function openDeleteDialog(work, trigger) {
    if (deleting || deleteDialog.open) {
        return;
    }

    pendingDeleteWork = work;
    deleteTrigger = trigger;

    deleteDialogMessage.textContent =
        `你即將刪除「${work.title}」（編號 ${work.id}）。`;

    deleteError.textContent = "";
    confirmDeleteButton.disabled = false;
    cancelDeleteButton.disabled = false;
    confirmDeleteButton.textContent = "確認";

    deleteDialog.showModal();
    cancelDeleteButton.focus();
}

cancelDeleteButton.addEventListener("click", () => {
    if (!deleting) {
        deleteDialog.close();
    }
});

// 按 Esc 可以取消；刪除請求進行中則先禁止關閉。
deleteDialog.addEventListener("cancel", event => {
    if (deleting) {
        event.preventDefault();
    }
});

deleteDialog.addEventListener("close", () => {
    pendingDeleteWork = null;

    if (deleteTrigger?.isConnected) {
        deleteTrigger.focus();
    } else {
        document.getElementById("worksHeading").focus();
    }

    deleteTrigger = null;
});

confirmDeleteButton.addEventListener("click", async () => {
    if (!pendingDeleteWork || deleting) {
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        returnToLogin();
        return;
    }

    const work = pendingDeleteWork;

    deleting = true;
    confirmDeleteButton.disabled = true;
    cancelDeleteButton.disabled = true;
    confirmDeleteButton.textContent = "刪除中…";
    deleteError.textContent = "";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/Works/${work.id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            alert("登入已失效，請重新登入。");
            returnToLogin();
            return;
        }

        if (response.status === 404) {
            await loadAdminWorks();
            deleteDialog.close();

            saveStatus.textContent =
                `「${work.title}」已不存在，已重新查詢作品清單。`;

            return;
        }

        if (!response.ok) {
            throw new Error(`刪除失敗，HTTP ${response.status}`);
        }

        // HTTP 204 沒有 JSON 內容，不要呼叫 response.json()。
        const refreshed = await loadAdminWorks();

        deleteDialog.close();

        saveStatus.textContent = refreshed
            ? `「${work.title}」已刪除。`
            : `「${work.title}」已刪除，但清單更新失敗，請按重新整理清單。`;
    } catch (error) {
        console.error(error);

        deleteError.textContent =
            `${error.message}。若連線中斷，結果可能尚未確認；請取消並重新整理清單，確認作品是否仍存在。`;
    } finally {
        deleting = false;
        confirmDeleteButton.disabled = false;
        cancelDeleteButton.disabled = false;
        confirmDeleteButton.textContent = "確認";
    }
});

checkLogin();