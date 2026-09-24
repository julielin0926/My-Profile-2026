export function addText(parent, tag, value) {
    const element = document.createElement(tag);
    element.textContent = value;
    parent.append(element);
    return element;
}

export function getHttpsUrl(value) {
    try {
        const url = new URL(value);

        if (
            url.protocol === "https:" &&
            !url.username &&
            !url.password
        ) {
            return url.href;
        }
    } catch {
        // 不是完整網址時，回傳 null。
    }

    return null;
}

export function getImageUrl(value) {
    if (typeof value !== "string") {
        return null;
    }

    const httpsUrl = getHttpsUrl(value);

    if (httpsUrl) {
        return httpsUrl;
    }

    if (
        value.startsWith("images/") &&
        value.length > 7 &&
        !/[\\%?#]/.test(value) &&
        !value.includes("..")
    ) {
        return new URL(value, window.location.href).href;
    }

    return null;
}

