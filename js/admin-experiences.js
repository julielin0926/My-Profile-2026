import { API_BASE_URL } from "./api.js";
import {
    createExperienceImageManager
} from "./admin-experience-images.js";

const $ = id => document.getElementById(id);

const form = $("experienceForm");
const fields = $("managementFields");
const status = $("operationStatus");
const list = $("experienceList");
const dialog = $("confirmDialog");

const textFields = [
    "title",
    "summary",
    "company",
    "role",
    "period",
    "workContent",
    "introductionHeading",
    "introduction"
];

let currentId = null;
let busy = false;
let dirty = false;
let authenticated = false;

const imageManager = createExperienceImageManager({
    request,
    run,
    askConfirmation,
    getCurrentId: () => currentId
});

function returnToLogin() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}

function setBusy(value) {
    busy = value;
    fields.disabled = value || !authenticated;
    $("logoutButton").disabled = value;
}

async function request(path, options = {}) {
    const token = localStorage.getItem("token");

    if (!token) {
        returnToLogin();
        throw new Error("請先登入。");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        cache: "no-store"
    });

    if (response.status === 401) {
        returnToLogin();
        throw new Error("登入已失效，請重新登入。");
    }

    if (!response.ok) {
        const problem = await response.json().catch(() => null);

        const validationErrors = problem?.errors
            ? Object.values(problem.errors).flat().join("；")
            : "";

        throw new Error(
            problem?.message ||
            validationErrors ||
            `操作失敗，HTTP ${response.status}`
        );
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function run(action) {
    if (busy || !authenticated) return;

    setBusy(true);
    status.textContent = "";

    try {
        await action();
    } catch (error) {
        status.textContent = error.message;
    } finally {
        setBusy(false);
    }
}

function askConfirmation(title, message) {
    $("confirmTitle").textContent = title;
    $("confirmMessage").textContent = message;

    dialog.returnValue = "";

    return new Promise(resolve => {
        dialog.addEventListener("close", () => {
            resolve(dialog.returnValue === "confirm");
        }, { once: true });

        dialog.showModal();
    });
}

async function mayDiscardChanges() {
    if (!dirty) return true;

    return askConfirmation(
        "尚有未儲存的修改",
        "繼續會放棄表單內尚未儲存的修改，確定要繼續嗎？"
    );
}

function fillForm(item) {
    currentId = item?.id ?? null;

    for (const name of textFields) {
        $(name).value = item?.[name] ?? "";
    }

    // 保留 API 已存在、但不在預設選項裡的介紹標題。
    const heading =
        item?.introductionHeading || "活動介紹";

    const select = $("introductionHeading");

    if (![...select.options].some(option => option.value === heading)) {
        select.add(new Option(heading, heading));
    }

    select.value = heading;
    $("sortOrder").value = item?.sortOrder ?? 10;

    $("editorHeading").textContent = currentId === null
        ? "新增工作經驗"
        : `編輯工作經驗：${item.title}`;

    $("editingHint").textContent = currentId === null
        ? "儲存後會建立一筆新的工作經驗。"
        : `目前正在編輯 ID：${currentId}，儲存會更新這一筆資料。`;

    $("saveButton").textContent = currentId === null
        ? "新增工作經驗"
        : "儲存修改";

        dirty = false;
    imageManager.reset();

}

form.addEventListener("input", () => {
    dirty = true;
});

form.addEventListener("change", () => {
    dirty = true;
});

window.addEventListener("beforeunload", event => {
    if (!dirty && !busy) return;

    event.preventDefault();
    event.returnValue = "";
});

async function loadList() {
    const items = await request("/api/Experiences");

    if (!Array.isArray(items)) {
        throw new Error("工作經驗清單格式不正確。");
    }

    list.replaceChildren();

    $("listStatus").textContent = items.length === 0
        ? "目前尚未新增工作經驗。"
        : `目前有 ${items.length} 筆工作經驗。`;

    for (const item of items) {
        const li = document.createElement("li");

        const title = document.createElement("h3");
        title.textContent = item.title;

        const meta = document.createElement("p");
        meta.textContent = [
            item.company,
            item.role,
            item.period,
            `排序：${item.sortOrder}`
        ].filter(Boolean).join("｜");

        const summary = document.createElement("p");
        summary.textContent = item.summary || "尚未填寫小卡摘要。";

        const actions = document.createElement("div");
        actions.className = "actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "編輯";

        editButton.addEventListener("click", () => run(async () => {
            if (!await mayDiscardChanges()) return;

            const detail = await request(
                `/api/Experiences/${item.id}`
            );

            fillForm(detail);
            status.textContent = `已載入「${detail.title}」。`;

            try {
                await imageManager.load();
            } catch {
                status.textContent +=
                    " 文字已載入，但圖片載入失敗，請查看圖片區的訊息。";
            }
        }));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "刪除";

        deleteButton.addEventListener("click", () => run(async () => {
            const confirmed = await askConfirmation(
                "確認刪除工作經驗",
                `確定刪除「${item.title}」嗎？\n` +
                "這筆經驗與其圖片紀錄將被移除，無法從網頁復原。" +
                (currentId === item.id && dirty
                    ? "\n目前表單內尚未儲存的修改也會被清除。"
                    : "")
            );

            if (!confirmed) return;

            try {
                await request(`/api/Experiences/${item.id}`, {
                    method: "DELETE"
                });
            } catch (error) {
                throw new Error(
                    `${error.message}\n` +
                    "若是連線中斷，請先重新整理清單確認結果。"
                );
            }

            if (currentId === item.id) {
                fillForm(null);
            }

            await refreshAfterChange(
                `已刪除「${item.title}」。`
            );
        }));

        actions.append(editButton, deleteButton);
        li.append(title, meta, summary, actions);
        list.append(li);
    }
}

async function refreshAfterChange(message) {
    try {
        await loadList();
        status.textContent = message;
    } catch (error) {
        status.textContent =
            `${message}\n但清單更新失敗：${error.message}\n` +
            "請按「重新整理清單」，不需要重複儲存。";
    }
}

form.addEventListener("submit", event => {
    event.preventDefault();

    if (busy || !authenticated) return;
    if (!form.reportValidity()) return;

    const payload = {};

    for (const name of textFields) {
        payload[name] = $(name).value.trim();
    }

    payload.sortOrder = Number($("sortOrder").value);

    if (
        !payload.title ||
        !payload.workContent ||
        !payload.introductionHeading ||
        !payload.introduction
    ) {
        status.textContent =
            "標題、工作內容及介紹內容不可只填空白。";
        return;
    }

    if (
        !Number.isInteger(payload.sortOrder) ||
        payload.sortOrder < 0 ||
        payload.sortOrder > 100000
    ) {
        status.textContent = "排序請填 0～100000 的整數。";
        return;
    }

    run(async () => {
        const isNew = currentId === null;

        const path = isNew
            ? "/api/Experiences"
            : `/api/Experiences/${currentId}`;

        let saved;

        try {
            saved = await request(path, {
                method: isNew ? "POST" : "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            throw new Error(
                `${error.message}\n` +
                "若是連線中斷，請先重新整理清單確認是否已儲存，" +
                "避免重複新增。"
            );
        }

        // 新增成功後立刻切換成編輯，避免再次按儲存又新增一筆。
        fillForm(saved);

        await refreshAfterChange(
            isNew
                ? `已新增「${saved.title}」，現在可繼續編輯這一筆。`
                : `已儲存「${saved.title}」的修改。`
        );

        try {
            await imageManager.load();
        } catch {
            status.textContent +=
                "\n文字已儲存，但圖片載入失敗，請查看圖片區的訊息。";
        }
            });
        });

$("newButton").addEventListener("click", () => run(async () => {
    if (!await mayDiscardChanges()) return;

    fillForm(null);
    status.textContent = "已切換到新增模式。";
}));

$("reloadButton").addEventListener("click", () => run(async () => {
    await loadList();
    status.textContent = "清單已更新，表單內的文字維持不變。";
}));

$("logoutButton").addEventListener("click", async () => {
    if (busy) return;

    setBusy(true);

    try {
        if (!await mayDiscardChanges()) return;

        dirty = false;
        returnToLogin();
    } finally {
        setBusy(false);
    }
});

async function initialize() {
    setBusy(true);

    try {
        const author = await request("/api/Author/me");

        authenticated = true;
        $("authStatus").textContent =
            `歡迎回來，${author.username}`;

        fillForm(null);

        try {
            await loadList();
        } catch (error) {
            $("listStatus").textContent =
                `清單載入失敗：${error.message}`;
        }
    } catch (error) {
        $("authStatus").textContent =
            `${error.message} 請確認 API 已啟動後重新整理。`;
    } finally {
        setBusy(false);
    }
}

initialize();