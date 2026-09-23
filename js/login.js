const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {

    // 阻止 form 預設重新整理頁面
    event.preventDefault();

    const username = document.getElementById("account").value;
    const password = document.getElementById("password").value;

    const response = await fetch(
        "https://localhost:7272/api/Auth/login",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })
        }
    );
if (response.ok) {
    const data = await response.json();

    // 儲存登入後取得的 JWT Token
    localStorage.setItem("token", data.token);

    alert("登入成功");

    window.location.href = "admin.html";
} else {

        alert("帳號或密碼錯誤");

    }

});