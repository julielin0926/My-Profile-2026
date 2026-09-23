const loginForm = document.getElementById("loginForm");
const accountInput = document.getElementById("account");
const passwordInput = document.getElementById("password");
const submitButton = loginForm.querySelector('button[type="submit"]');

let isSubmitting = false;

// 帳號欄按 Enter：
// 密碼未填 → 移到密碼欄。
// 帳密都填 → 走表單送出流程。
accountInput.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || event.isComposing) {
        return;
    }

    event.preventDefault();

    if (!accountInput.value.trim()) {
        accountInput.focus();
        return;
    }

    if (!passwordInput.value) {
        passwordInput.focus();
        return;
    }

    loginForm.requestSubmit();
});

// 密碼欄按 Enter 時，走相同的表單送出流程。
passwordInput.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || event.isComposing) {
        return;
    }

    event.preventDefault();

    if (!accountInput.value.trim()) {
        accountInput.focus();
        return;
    }

    loginForm.requestSubmit();
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (isSubmitting) {
        return;
    }

    const username = accountInput.value.trim();

    // 密碼不要 trim，空白可能是密碼的一部分。
    const password = passwordInput.value;

    if (!username) {
        accountInput.focus();
        return;
    }

    if (!password) {
        passwordInput.focus();
        return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "登入中…";

    try {
        const response = await fetch(
            "https://localhost:7272/api/Auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password
                })
            }
        );

        if (response.status === 401) {
            alert("帳號或密碼錯誤");
            passwordInput.focus();
            return;
        }

        if (!response.ok) {
            throw new Error(`登入 API 回傳 ${response.status}`);
        }

        const data = await response.json();

        if (typeof data.token !== "string" || !data.token) {
            throw new Error("API 沒有回傳有效的 Token");
        }

        localStorage.setItem("token", data.token);

        window.location.href = "admin.html";
    } catch (error) {
        console.error("登入失敗：", error);

        alert("目前無法完成登入，請確認 API 已啟動，並查看 Console 錯誤訊息。");
    } finally {
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.textContent = "登入";
    }
});