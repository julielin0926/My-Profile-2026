const dataUrl = new URL("../data/works.json", import.meta.url);
const siteRoot = new URL("../", import.meta.url);

let worksPromise;

export function getPublicWorks() {
    if (!worksPromise) {
        worksPromise = fetch(dataUrl, { cache: "no-cache" })
            .then(async response => {
                if (!response.ok) {
                    throw new Error(
                        `公開作品資料讀取失敗：HTTP ${response.status}`
                    );
                }

                const works = await response.json();

                if (!Array.isArray(works)) {
                    throw new Error("公開作品資料格式不正確");
                }

                return works;
            });
    }

    return worksPromise;
}

export function getPublicImageUrl(path) {
    if (
        typeof path !== "string" ||
        !/^data\/work-images\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(path)
    ) {
        return null;
    }

    return new URL(path, siteRoot).href;
}