// 與 responsive.css 的導覽斷點保持一致。
const compactNavigation = window.matchMedia(
    "(max-width: 767px), (max-width: 1024px) and (orientation: portrait)"
);

document.querySelectorAll("nav").forEach((nav, navIndex) => {
    const menu = nav.querySelector(":scope > ul");
    if (!menu) return;

    nav.classList.add("site-nav");
    if (!nav.hasAttribute("aria-label")) nav.setAttribute("aria-label", "主要導覽");
    menu.id ||= `site-menu-${navIndex}`;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-controls", menu.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "開啟導覽選單");
    for (let i = 0; i < 2; i++) {
        const line = document.createElement("span");
        line.setAttribute("aria-hidden", "true");
        toggle.append(line);
    }
    nav.prepend(toggle);

    // 記錄導覽高度，供錨點留白及手機選單高度使用。
    function reserveNavigationSpace() {
        const styles = getComputedStyle(nav);
        const height = compactNavigation.matches
            ? toggle.getBoundingClientRect().height + parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom) + 1
            : nav.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--site-nav-height", `${Math.ceil(height)}px`);
    }
    new ResizeObserver(reserveNavigationSpace).observe(nav);
    reserveNavigationSpace();
    const currentPage = location.pathname.split("/").pop() || "index.html";
    menu.querySelectorAll(":scope > li > a").forEach(link => {
        if (link.getAttribute("href") === currentPage) link.setAttribute("aria-current", "page");
    });

    const submenus = [];
    function setSubmenu(entry, open) {
        entry.item.classList.toggle("submenu-open", open);
        entry.button.setAttribute("aria-expanded", String(open));
        entry.button.setAttribute("aria-label", `${open ? "收合" : "展開"}${entry.label}細分類`);
        entry.button.textContent = open ? "−" : "+";
    }

    [...menu.children].forEach((item, index) => {
        const submenu = item.querySelector(":scope > ul");
        const link = item.querySelector(":scope > a");
        if (!submenu || !link) return;

        submenu.id ||= `site-submenu-${navIndex}-${index}`;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "submenu-toggle";
        button.setAttribute("aria-controls", submenu.id);
        link.after(button);

        const entry = { item, button, label: link.textContent.trim() };
        submenus.push(entry);
        setSubmenu(entry, false);

        button.addEventListener("click", () => {
            const open = button.getAttribute("aria-expanded") !== "true";
            submenus.forEach(other => {
                if (other !== entry) setSubmenu(other, false);
            });
            setSubmenu(entry, open);
        });
    });

    function setMenu(open, restoreFocus = false) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "關閉導覽選單" : "開啟導覽選單");
        if (!open) submenus.forEach(entry => setSubmenu(entry, false));
        if (restoreFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => {
        setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("keydown", event => {
        if (!compactNavigation.matches || event.key !== "Escape") return;
        const entry = submenus.find(entry =>
            entry.item.contains(document.activeElement) &&
            entry.button.getAttribute("aria-expanded") === "true"
        );
        if (entry) {
            setSubmenu(entry, false);
            entry.button.focus();
        } else {
            setMenu(false, true);
        }
        event.preventDefault();
    });

    nav.addEventListener("click", event => {
        if (compactNavigation.matches && event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", event => {
        if (compactNavigation.matches && !nav.contains(event.target)) {
            setMenu(false, nav.contains(document.activeElement));
        }
    });

    compactNavigation.addEventListener("change", () => {
        const active = document.activeElement;
        if (!compactNavigation.matches && (active === toggle ||
            submenus.some(entry => entry.button === active))) {
            menu.querySelector("a")?.focus();
        }
        setMenu(false, compactNavigation.matches && menu.contains(active));
    });
});

async function updateExperienceMenus() {
    const menus = [
        ...document.querySelectorAll(
            'nav > ul > li > a[href="experience.html"]'
        )
    ].map(link =>
        link.parentElement.querySelector(":scope > ul")
    ).filter(Boolean);

    if (menus.length === 0) return;

    function showOverviewLink(menu) {
        const item = document.createElement("li");
        const link = document.createElement("a");

        link.href = "experience.html";
        link.textContent = "查看所有工作經驗";

        item.append(link);
        menu.replaceChildren(item);
    }

    // 載入期間先提供可使用的總覽連結。
    menus.forEach(showOverviewLink);

    try {
        const { getExperiences } = await import(
            "./experience-data.js"
        );

        const experiences = await getExperiences();

        if (experiences.length === 0) return;

        for (const menu of menus) {
            const fragment = document.createDocumentFragment();

            for (const experience of experiences) {
                const item = document.createElement("li");
                const link = document.createElement("a");

                link.href =
                    `experience-detail.html?id=${experience.id}`;

                link.textContent = experience.title;

                item.append(link);
                fragment.append(item);
            }

            menu.replaceChildren(fragment);
        }
    } catch (error) {
        // 資料載入失敗時，保留可前往總覽的連結。
        console.warn("工作經驗選單載入失敗：", error);
    }
}

updateExperienceMenus();
