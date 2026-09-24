import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
);

const output = path.join(root, "_site");

const works = JSON.parse(
    fs.readFileSync(path.join(root, "Data", "works.json"), "utf8")
);

if (!Array.isArray(works)) {
    throw new Error("Data/works.json 格式不正確");
}

const pages = [
    "index.html",
    "about.html",
    "animations.html",
    "videos.html",
    "games.html",
    "experience.html",
    "contact.html",
    "work.html"
];

const scripts = [
    "navigation.js",
    "works.js",
    "work-detail.js",
    "work-media.js",
    "public-data.js",
    "main.js"
];

// 先確認公開圖片存在，再開始重建輸出。
const publicImagePaths = new Set();

for (const work of works) {
    for (const image of work.images ?? []) {
        if (
            typeof image.url !== "string" ||
            !/^Data\/work-images\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(image.url)
        ) {
            throw new Error(`作品 ${work.id} 的圖片路徑不正確`);
        }

        if (!fs.existsSync(path.join(root, image.url))) {
            throw new Error(`缺少圖片：${image.url}`);
        }

        publicImagePaths.add(image.url);
    }
}

// _site 是此程式專用的產生目錄，不要放手寫檔案。
if (
    path.dirname(output) !== root ||
    path.basename(output) !== "_site"
) {
    throw new Error("輸出目錄檢查失敗");
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

function copyFile(relativePath) {
    const destination = path.join(output, relativePath);

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, relativePath), destination);
}

const existingIds = new Set(works.map(work => String(work.id)));

for (const page of pages) {
    let html = fs.readFileSync(path.join(root, page), "utf8");

    // 不讓已刪除作品的固定導覽連結留在公開版。
    html = html.replace(
        /<li>\s*<a href="work\.html\?id=(\d+)">[^<]*<\/a>\s*<\/li>/g,
        (entry, id) => existingIds.has(id) ? entry : ""
    );

    fs.writeFileSync(path.join(output, page), html);
}

for (const script of scripts) {
    copyFile(`js/${script}`);
}

fs.cpSync(
    path.join(root, "css"),
    path.join(output, "css"),
    { recursive: true }
);

fs.cpSync(
    path.join(root, "images"),
    path.join(output, "images"),
    { recursive: true }
);

copyFile("Data/works.json");

for (const imagePath of publicImagePaths) {
    copyFile(imagePath);
}

// 公開版不提供呼叫訪客 localhost 的登入程式。
// 本機原本的 login.html、admin.html 不會被修改。
fs.writeFileSync(
    path.join(output, "login.html"),
    `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>作者專區 | My Profile</title>
    <link rel="stylesheet" href="css/common.css">
    <link rel="stylesheet" href="css/responsive.css">
</head>
<body>
    <main>
        <section class="login">
            <h1>作者專區</h1>
            <p>作品管理目前於作者本機環境進行。</p>
            <p>公開作品已獨立發布，可正常瀏覽。</p>
            <a class="button" href="index.html">返回首頁</a>
        </section>
    </main>
</body>
</html>`
);

fs.writeFileSync(path.join(output, ".nojekyll"), "");

console.log(
    `公開網站已產生：${works.length} 件作品、` +
    `${publicImagePaths.size} 張精華圖片。`
);
console.log(output);