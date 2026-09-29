import {
    getExperiences,
    createExperienceImage
} from "./experience-data.js";

const $ = id => document.getElementById(id);

function appendFigure(container, image, fallbackText) {
    const picture = createExperienceImage(image, fallbackText);

    if (!picture) return false;

    const figure = document.createElement("figure");
    figure.append(picture);

    if (image.caption) {
        const caption = document.createElement("figcaption");
        caption.textContent = image.caption;
        figure.append(caption);
    }

    container.append(figure);
    return true;
}

async function loadDetail() {
    const rawId = new URLSearchParams(
        window.location.search
    ).get("id");

    if (
        !rawId ||
        !/^[1-9]\d*$/.test(rawId) ||
        !Number.isSafeInteger(Number(rawId))
    ) {
        $("experienceDetailStatus").textContent =
            "工作經驗網址不正確，請返回總覽重新選擇。";
        return;
    }

    try {
        const items = await getExperiences();
        const item = items.find(item => item.id === Number(rawId));

        if (!item) {
            $("experienceDetailStatus").textContent =
                "這筆工作經驗尚未發布或已移除，請返回總覽。";
            return;
        }

        document.title = `${item.title} | My Profile`;

        $("experienceTitle").textContent = item.title;

        $("experienceMeta").textContent = [
            item.company,
            item.role,
            item.period
        ].filter(Boolean).join("｜");

        $("experienceWorkContent").textContent =
            item.workContent || "";

        $("experienceIntroductionHeading").textContent =
            item.introductionHeading || "工作介紹";

        $("experienceIntroduction").textContent =
            item.introduction || "";

        const cover = item.images.find(
            image => image.kind === "cover"
        );

        const coverImage = createExperienceImage(
            cover,
            `${item.title}主相片`
        );

        if (coverImage) {
            coverImage.loading = "eager";
            $("experienceCover").append(coverImage);
        }

        for (const [kind, label] of [
            ["company-logo", "公司 Logo"],
            ["activity-logo", "活動 Logo"]
        ]) {
            const logo = item.images.find(
                image => image.kind === kind
            );

            const element = createExperienceImage(logo, label);

            if (element) {
                $("experienceLogos").append(element);
            }
        }

        let photoCount = 0;

        for (const kind of ["work-1", "work-2", "work-3"]) {
            const image = item.images.find(
                image => image.kind === kind
            );

            if (image && appendFigure(
                $("experiencePhotos"),
                image,
                `${item.title}工作紀錄`
            )) {
                photoCount++;
            }
        }

        $("experiencePhotosSection").hidden = photoCount === 0;

        let reviewCount = 0;

        for (const image of item.images.filter(
            image => image.kind === "review"
        )) {
            if (appendFigure(
                $("experienceReviews"),
                image,
                `${item.title}活動好評`
            )) {
                reviewCount++;
            }
        }

        $("experienceReviewsSection").hidden = reviewCount === 0;

        $("experienceDetail").hidden = false;
        $("experienceDetailStatus").textContent = "";
    } catch (error) {
        $("experienceDetailStatus").textContent =
            `${error.message} 請稍後重新整理。`;
    }
}

loadDetail();