import { getPublicWorks } from "./public-data.js";
import { getExperiences, getExperienceImageUrl } from "./experience-data.js";
import { getImageUrl } from "./work-media.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function createCard(item) {
    const card = document.createElement("article");
    card.className = "carousel-card";
    const media = document.createElement("div");
    media.className = "carousel-media";
    if (item.image) {
        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.title;
        image.loading = "lazy";
        image.addEventListener("error", () => {
            image.remove();
            media.textContent = item.title;
        }, { once: true });
        media.append(image);
    } else {
        media.textContent = item.title;
    }
    const title = document.createElement("h3");
    title.textContent = item.title;
    const summary = document.createElement("p");
    summary.textContent = item.summary || "";
    const link = document.createElement("a");
    link.className = "home-text-link";
    link.href = item.href;
    link.textContent = "了解更多 ↗";
    link.setAttribute("aria-label", `了解更多：${item.title}`);
    card.append(media, title, summary, link);
    return card;
}

function activateCarousel(root, items) {
    const track = root.querySelector(".carousel-track");
    const status = root.querySelector(".carousel-status");
    const previous = root.querySelector("[data-prev]");
    const next = root.querySelector("[data-next]");
    const cards = items.map(createCard);
    track.replaceChildren(...cards);
    if (!cards.length) {
        status.textContent = "目前沒有公開資料。";
        return;
    }
    status.textContent = "";
    let active = -1;
    let queued = false;
    function update() {
        queued = false;
        const bounds = track.getBoundingClientRect();
        const center = bounds.left + track.clientWidth / 2;
        let nearest = 0;
        let distance = Infinity;
        cards.forEach((card, index) => {
            const box = card.getBoundingClientRect();
            const delta = Math.abs(box.left + box.width / 2 - center);
            if (delta < distance) { distance = delta; nearest = index; }
        });
        if (nearest !== active) {
            active = nearest;
            cards.forEach((card, index) => card.classList.toggle("is-center", index === active));
        }
        previous.disabled = active === 0;
        next.disabled = active === cards.length - 1;
    }
    function schedule() {
        if (!queued) { queued = true; requestAnimationFrame(update); }
    }
    let wheelFrame = 0;
    let wheelTarget = 0;
    let wheelTime = 0;
    function stopWheel() {
        cancelAnimationFrame(wheelFrame);
        wheelFrame = 0;
    }
    function glide(time) {
        const elapsed = Math.min(time - wheelTime, 50);
        wheelTime = time;
        wheelTarget = Math.max(0, Math.min(wheelTarget, track.scrollWidth - track.clientWidth));
        const remaining = wheelTarget - track.scrollLeft;
        if (Math.abs(remaining) < 0.75) {
            track.scrollTo({ left: wheelTarget, behavior: "instant" });
            wheelFrame = 0;
            return;
        }
        track.scrollBy({ left: remaining * (1 - Math.exp(-elapsed / 70)), behavior: "instant" });
        wheelFrame = requestAnimationFrame(glide);
    }
    function centerCard(index, animate = true) {
        stopWheel();
        const card = cards[Math.max(0, Math.min(index, cards.length - 1))];
        const box = card.getBoundingClientRect();
        const bounds = track.getBoundingClientRect();
        track.scrollTo({
            left: track.scrollLeft + box.left + box.width / 2 - bounds.left - track.clientWidth / 2,
            behavior: animate && !reducedMotion.matches ? "smooth" : "instant"
        });
        schedule();
    }
    previous.addEventListener("click", () => centerCard(active - 1));
    next.addEventListener("click", () => centerCard(active + 1));
    track.addEventListener("scroll", schedule, { passive: true });
    track.addEventListener("wheel", event => {
        // 保留縮放手勢與觸控板原生的橫向捲動。
        if (event.ctrlKey) return;
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            stopWheel();
            return;
        }
        if (!event.deltaY) return;
        const maximum = track.scrollWidth - track.clientWidth;
        const direction = Math.sign(event.deltaY);
        if (maximum <= 1 ||
            (direction < 0 && track.scrollLeft <= 1) ||
            (direction > 0 && track.scrollLeft >= maximum - 1)) return;

        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1;
        track.classList.add("is-wheeling");
        if (!wheelFrame) {
            wheelTarget = track.scrollLeft;
            // 停止可能仍在進行的箭頭平滑捲動。
            track.scrollTo({ left: wheelTarget, behavior: "instant" });
        }
        // 反向滾動時立即跟隨新方向，不先消耗舊方向的餘量。
        if (Math.sign(wheelTarget - track.scrollLeft) !== direction) wheelTarget = track.scrollLeft;
        wheelTarget = Math.max(0, Math.min(maximum, wheelTarget + event.deltaY * unit));
        if (reducedMotion.matches) {
            stopWheel();
            track.scrollTo({ left: wheelTarget, behavior: "instant" });
        } else if (!wheelFrame) {
            wheelTime = performance.now();
            wheelFrame = requestAnimationFrame(glide);
        }
    }, { passive: false });
    track.addEventListener("pointerdown", event => {
        stopWheel();
        if (event.pointerType === "touch") track.classList.remove("is-wheeling");
    });
    track.addEventListener("keydown", event => {
        if (event.target !== track) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            centerCard(active + (event.key === "ArrowRight" ? 1 : -1));
        }
    });
    cards.forEach((card, index) => card.addEventListener("focusin", () => centerCard(index)));
    new ResizeObserver(() => centerCard(active < 0 ? 0 : active, false)).observe(track);
    centerCard(0, false);
}

async function loadCarousel(root) {
    try {
        let items;
        if (root.dataset.carousel === "works") {
            const works = await getPublicWorks();
            // 首頁依公開排序取前六件；分類頁仍展示全部。
            items = [...works].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
                .filter(work => Number.isSafeInteger(work.id) && work.id > 0).slice(0, 6)
                .map(work => ({
                    title: work.title,
                    summary: work.genre || ({ animation: "動畫作品", video: "影音作品", game: "遊戲作品" }[work.category]),
                    href: `work.html?id=${work.id}`,
                    image: work.category === "game" ? getImageUrl(work.imageUrl)
                        : /^[A-Za-z0-9_-]{11}$/.test(work.youTubeVideoId || "")
                            ? `https://i.ytimg.com/vi/${work.youTubeVideoId}/hqdefault.jpg` : null
                }));
        } else {
            items = (await getExperiences()).map(item => ({
                title: item.title,
                summary: item.summary,
                href: `experience-detail.html?id=${item.id}`,
                image: getExperienceImageUrl(item.images.find(image => image.kind === "cover")?.url)
            }));
        }
        activateCarousel(root, items);
    } catch (error) {
        root.querySelector(".carousel-status").textContent = `資料載入失敗：${error.message}`;
    }
}

document.querySelectorAll(".home-carousel").forEach(loadCarousel);
