'use strict';

const menuToggle = document.querySelector("#menu-toggle");
/* Elements */
const hamburger = document.querySelector(".hamburger");
const friendCountPanel = document.querySelector("#friend-count-panel");
const userProfileCard = document.querySelector("#current-user-card");
const profileEditButton = document.querySelector("#profile-edit-button");
const friendsPanel = document.querySelector("#friends");
const friendsList = document.querySelector("#friends-list");
const friendsOpenButton = document.querySelector("#friends-open-button");
const friendWindow = document.querySelector("#friend-window");
const friendWindowClose = document.querySelector("#friend-window-close");
const friendSearchInput = document.querySelector("#friend-search-input");
const friendWindowList = document.querySelector("#friend-window-list");
const friendWindowEmpty = document.querySelector("#friend-window-empty");
const friendFilterButtons = [...document.querySelectorAll(".friend-filter-button")];
const avatarList = document.querySelector("#avatar-list");
const avatarWindow = document.querySelector("#avatar-window");
const avatarWindowClose = document.querySelector("#avatar-window-close");
const avatarSearchInput = document.querySelector("#avatar-search-input");
const avatarWindowList = document.querySelector("#avatar-window-list");
const avatarWindowEmpty = document.querySelector("#avatar-window-empty");
const favoriteAvatarsPanel = document.querySelector("#favorite-avatars");
const favoriteAvatarList = document.querySelector("#favorite-avatar-list");
const favoriteAvatarEmpty = document.querySelector("#favorite-avatar-empty");
const favoriteAvatarCount = document.querySelector("#favorite-avatar-count");
const worldSearchForm = document.querySelector("#world-search-form");
const worldSearchKeyword = document.querySelector("#world-search-keyword");
const worldSearchSubmit = document.querySelector("#world-search-submit");
const worldSearchMessage = document.querySelector("#world-search-message");
const worldResults = document.querySelector("#world-results");
const worldFilterButtons = [...document.querySelectorAll(".world-filter-chip")];
const worldDetailWindow = document.querySelector("#world-detail-window");
const worldDetailClose = document.querySelector("#world-detail-close");
const worldDetailHero = document.querySelector("#world-detail-hero");
const worldDetailBadges = document.querySelector("#world-detail-badges");
const worldDetailTitle = document.querySelector("#world-detail-title");
const worldDetailAuthor = document.querySelector("#world-detail-author");
const worldDetailDescription = document.querySelector("#world-detail-description");
const worldDetailStats = document.querySelector("#world-detail-stats");
const worldDetailTags = document.querySelector("#world-detail-tags");
const contactForm = document.querySelector("#contact-form");
const contactSubmit = document.querySelector("#contact-submit");
const contactClear = document.querySelector("#contact-clear");
const contactReceipt = document.querySelector("#contact-receipt");
const contactReceiptTitle = document.querySelector("#contact-receipt-title");
const contactReceiptMessage = document.querySelector("#contact-receipt-message");
const contactReceiptMeta = document.querySelector("#contact-receipt-meta");
const contactAccordionToggle = document.querySelector("#contact-accordion-toggle");
const contactAccordionPanel = document.querySelector("#contact-accordion-panel");
const contactNavLinks = [...document.querySelectorAll('a[href="#contact"]')];
const vrchatAuthStatus = document.querySelector("#vrchat-auth-status");
const cookieConsent = document.querySelector("#cookie-consent");
const cookieAccept = document.querySelector("#cookie-accept");
const cookieDecline = document.querySelector("#cookie-decline");
const desktopLayoutQuery = window.matchMedia("(min-width: 769px)");
const mobileLayoutQuery = window.matchMedia("(max-width: 768px)");
const mobileAccordionButtons = [...document.querySelectorAll(".mobile-accordion-toggle")];
const profileFieldElements = {
    displayName: document.querySelector("#user-display-name"),
    bio: document.querySelector("#user-bio"),
    status: document.querySelector("#user-status"),
    currentAvatar: document.querySelector("#user-current-avatar")
};
const navProfileElements = {
    displayName: document.querySelector("#nav-display-name"),
    status: document.querySelector("#nav-status")
};
const friendCountElements = {
    online: document.querySelector("#friends-online-count"),
    busy: document.querySelector("#friends-busy-count"),
    offline: document.querySelector("#friends-offline-count")
};
const worldSearchDefaultLabel = worldSearchSubmit ? worldSearchSubmit.textContent : "検索";

const contactSubmitDefaultLabel = contactSubmit ? contactSubmit.textContent : "送信";

const revealSelector = [
    "header",
    "#friend-count-panel",
    ".page-title",
    ".user-profile-card",
    ".friends-panel",
    ".world-search",
    ".avatars-panel",
    ".favorite-avatars",
    ".contact-panel",
    ".contact-accordion-toggle",
    "#friends-list .friend-card",
    "#avatar-list .avatar-card",
    ".world-filter-chip",
    ".mobile-accordion-toggle",
    ".world-search-form > *",
    ".contact-form > *",
    ".contact-receipt"
].join(",");

const friendStatusLabels = {
    "join me": "だれでもおいで",
    online: "オンライン",
    "ask me": "きいてみてね",
    busy: "取り込み中",
    offline: "オフライン"
};

const friendStatusClasses = {
    "join me": "status-join-me",
    online: "status-online",
    "ask me": "status-ask-me",
    busy: "status-busy",
    offline: "status-offline"
};

const profileStorageKey = "vrcDashDemoProfile";
const contactStorageKey = "vrcDashDemoContactReceipt";
const avatarFavoritesStorageKey = "vrcDashDemoFavoriteAvatars";
const cookieConsentKey = "vrcDashDemoCookieConsent";
const cookieInputStateKey = "vrcDashDemoInputState";
const minimumVisibleFriendCount = 10;
const profileStatusOptions = [
    { value: "join me", label: "だれでもおいで" },
    { value: "online", label: "オンライン" },
    { value: "ask me", label: "きいてみてね" },
    { value: "busy", label: "取り込み中" },
    { value: "offline", label: "オフライン" }
];
const profileFieldConfig = {
    displayName: {
        label: "ユーザー名",
        type: "input",
        placeholder: "ユーザー名"
    },
    bio: {
        label: "自己紹介文",
        type: "textarea",
        placeholder: "自己紹介文"
    },
    status: {
        label: "ステータス",
        type: "select",
        placeholder: "ステータス"
    },
    currentAvatar: {
        label: "今のアバター",
        type: "input",
        placeholder: "今のアバター"
    }
};

const dummyDashboardData = {
    user: {
        displayName: "SampleUser",
        bio: "夜景ワールド巡りと写真撮影が好きです。\n週末は雑談ワールドでのんびり過ごしています。\n新しいアバターの表情確認もよくしています。\n見かけたら気軽に声をかけてください。",
        status: "online",
        currentAvatar: "Neon Traveler",
        currentAvatarImageUrl: ""
    },
    friendCounts: {
        online: 3,
        busy: 4,
        offline: 7
    },
    friends: [
        { id: "usr_dummy_01", displayName: "DemoFriend 01", status: "online", userIcon: "" },
        { id: "usr_dummy_02", displayName: "DemoFriend 02", status: "online", userIcon: "" },
        { id: "usr_dummy_03", displayName: "DemoFriend 03", status: "online", userIcon: "" },
        { id: "usr_dummy_04", displayName: "DemoFriend 04", status: "join me", userIcon: "" },
        { id: "usr_dummy_05", displayName: "DemoFriend 05", status: "ask me", userIcon: "" },
        { id: "usr_dummy_06", displayName: "DemoFriend 06", status: "busy", userIcon: "" },
        { id: "usr_dummy_07", displayName: "DemoFriend 07", status: "busy", userIcon: "" },
        { id: "usr_dummy_08", displayName: "DemoFriend 08", status: "offline", userIcon: "" },
        { id: "usr_dummy_09", displayName: "DemoFriend 09", status: "offline", userIcon: "" },
        { id: "usr_dummy_10", displayName: "DemoFriend 10", status: "offline", userIcon: "" },
        { id: "usr_dummy_11", displayName: "DemoFriend 11", status: "offline", userIcon: "" },
        { id: "usr_dummy_12", displayName: "DemoFriend 12", status: "offline", userIcon: "" },
        { id: "usr_dummy_13", displayName: "DemoFriend 13", status: "offline", userIcon: "" },
        { id: "usr_dummy_14", displayName: "DemoFriend 14", status: "offline", userIcon: "" }
    ],
    avatars: [
        { id: "avtr_dummy_01", name: "Neon Traveler", releaseStatus: "private", thumbnailImageUrl: "" },
        { id: "avtr_dummy_02", name: "Sky Voyager", releaseStatus: "private", thumbnailImageUrl: "" },
        { id: "avtr_dummy_03", name: "Cyber Hoodie", releaseStatus: "public", thumbnailImageUrl: "" },
        { id: "avtr_dummy_04", name: "Mirror Runner", releaseStatus: "private", thumbnailImageUrl: "" },
        { id: "avtr_dummy_05", name: "Pixel Cat", releaseStatus: "public", thumbnailImageUrl: "" },
        { id: "avtr_dummy_06", name: "Night Pilot", releaseStatus: "private", thumbnailImageUrl: "" },
        { id: "avtr_dummy_07", name: "Aqua Beat", releaseStatus: "private", thumbnailImageUrl: "" },
        { id: "avtr_dummy_08", name: "Cosmo Scout", releaseStatus: "public", thumbnailImageUrl: "" },
        { id: "avtr_dummy_09", name: "Glow Rabbit", releaseStatus: "private", thumbnailImageUrl: "" },
        { id: "avtr_dummy_10", name: "Studio Model", releaseStatus: "private", thumbnailImageUrl: "" }
    ]
};

const dummyWorldResults = [
    {
        id: "wrld_dummy_neon_grid",
        name: "Neon Grid Lounge",
        authorName: "DummyCreator",
        description: "ネオンのグリッド背景で雑談しやすいラウンジワールド。",
        capacity: 24,
        occupants: 8,
        visits: 12840,
        tags: ["chill", "night", "friends"],
        categories: ["talk"],
        theme: "neon",
        thumbnailLabel: "Neon Lounge",
        thumbnailImageUrl: ""
    },
    {
        id: "wrld_dummy_jp_talk",
        name: "JP Talk Square",
        authorName: "SampleJP",
        description: "日本語ユーザー向けの軽い交流スペース。",
        capacity: 32,
        occupants: 14,
        visits: 48620,
        tags: ["jp", "talk", "public"],
        categories: ["popular", "active", "talk", "jp"],
        theme: "jp",
        thumbnailLabel: "JP Talk",
        thumbnailImageUrl: ""
    },
    {
        id: "wrld_dummy_sky_mirror",
        name: "Skyline Mirror Room",
        authorName: "MirrorLab",
        description: "夜景とミラー確認に向いたコンパクトなワールド。",
        capacity: 16,
        occupants: 5,
        visits: 21400,
        tags: ["mirror", "avatar", "photo"],
        categories: ["photo"],
        theme: "sky",
        thumbnailLabel: "Sky Mirror",
        thumbnailImageUrl: ""
    },
    {
        id: "wrld_dummy_cyber_studio",
        name: "Cyber Avatar Studio",
        authorName: "StudioDummy",
        description: "アバター撮影や集合写真のテストに使いやすいスタジオ。",
        capacity: 20,
        occupants: 3,
        visits: 9360,
        tags: ["avatar", "studio", "photo"],
        categories: ["photo"],
        theme: "studio",
        thumbnailLabel: "Avatar Studio",
        thumbnailImageUrl: ""
    }
];

const worldThemeGradients = {
    neon: "linear-gradient(135deg, rgba(0, 188, 255, 0.9), rgba(4, 0, 255, 0.74) 52%, rgba(255, 139, 209, 0.58))",
    jp: "linear-gradient(135deg, rgba(105, 246, 255, 0.84), rgba(4, 0, 255, 0.66) 52%, rgba(141, 255, 176, 0.54))",
    sky: "linear-gradient(135deg, rgba(99, 160, 255, 0.9), rgba(0, 188, 255, 0.58) 50%, rgba(255, 255, 255, 0.24))",
    studio: "linear-gradient(135deg, rgba(255, 139, 209, 0.82), rgba(4, 0, 255, 0.72) 54%, rgba(105, 246, 255, 0.55))",
    default: "linear-gradient(135deg, rgba(0, 188, 255, 0.78), rgba(4, 0, 255, 0.72))"
};

let activeFriendFilter = "all";
let activeWorldFilter = "all";
let currentWorldResults = [];
let currentUserProfile = {};
let friendCountAnimationFrame = 0;
let friendListFitFrame = 0;
let currentVrchatFriends = [];
let renderedVrchatFriendCount = -1;
let hasVrchatFriendData = false;
let isProfileEditing = false;
let favoriteAvatarIds = new Set();

/* Browser-local input memory. */
const getCookieValue = (name) => {
    try {
        return localStorage.getItem(name) || "";
    } catch (error) {
        return "";
    }
};

const setCookieValue = (name, value) => {
    try {
        localStorage.setItem(name, value);
    } catch (error) {
        // Storage can be unavailable in some browser privacy modes.
    }
};

const deleteCookieValue = (name) => {
    try {
        localStorage.removeItem(name);
    } catch (error) {
        // Storage can be unavailable in some browser privacy modes.
    }
};

const hasCookieConsent = () => getCookieValue(cookieConsentKey) === "accepted";

const getCookieInputState = () => {
    if (!hasCookieConsent()) return {};

    try {
        return JSON.parse(getCookieValue(cookieInputStateKey) || "{}");
    } catch (error) {
        return {};
    }
};

const collectContactDraftForCookie = () => {
    if (!contactForm) return {};

    const draft = {};

    contactForm.querySelectorAll("input, select, textarea").forEach((field) => {
        if (!field.name) return;

        draft[field.name] = field.value;
    });

    return draft;
};

const collectInputStateForCookie = (profileOverride = {}) => ({
    profile: {
        ...currentUserProfile,
        ...profileOverride
    },
    worldKeyword: worldSearchKeyword?.value.trim() || "",
    contactDraft: collectContactDraftForCookie()
});

const saveInputStateToCookie = (profileOverride = {}) => {
    if (!hasCookieConsent()) return;

    setCookieValue(cookieInputStateKey, JSON.stringify(collectInputStateForCookie(profileOverride)));
};

const restoreInputStateFromCookie = () => {
    const state = getCookieInputState();

    if (state.worldKeyword && worldSearchKeyword) {
        worldSearchKeyword.value = state.worldKeyword;
    }

    if (state.contactDraft && contactForm) {
        Object.entries(state.contactDraft).forEach(([name, value]) => {
            const field = contactForm.elements[name];

            if (field && "value" in field) {
                field.value = value;
            }
        });
    }

    if (state.profile) {
        applyCurrentUserProfile(state.profile);
    }
};

const showCookieConsentIfNeeded = () => {
    if (!cookieConsent) return;

    cookieConsent.hidden = Boolean(getCookieValue(cookieConsentKey));
};

const acceptCookieConsent = () => {
    setCookieValue(cookieConsentKey, "accepted");
    saveInputStateToCookie();

    if (cookieConsent) cookieConsent.hidden = true;
};

const declineCookieConsent = () => {
    setCookieValue(cookieConsentKey, "declined", 60 * 60 * 24 * 7);
    deleteCookieValue(cookieInputStateKey);

    if (cookieConsent) cookieConsent.hidden = true;
};

/* Static dummy data rendering. */
const setDemoModeStatus = () => {
    document.body.dataset.vrchatAuth = "demo";

    if (vrchatAuthStatus) {
        vrchatAuthStatus.textContent = "ダミーデータ";
        vrchatAuthStatus.dataset.authConfigured = "false";
        vrchatAuthStatus.dataset.authLinked = "false";
    }
};

const setImageSource = (image, source) => {
    if (!image) return;

    const container = image.parentElement;
    const placeholder = image.parentElement?.querySelector(
        ".avatar-placeholder, .icon-placeholder, .avatar-thumbnail-placeholder, .world-thumbnail-placeholder"
    );
    const requestId = String((Number(image.dataset.loadRequest) || 0) + 1);

    image.dataset.loadRequest = requestId;
    image.onload = null;
    image.onerror = null;

    if (!source) {
        container?.classList.remove("is-image-loading");
        container?.removeAttribute("aria-busy");
        image.hidden = true;
        image.removeAttribute("src");
        if (placeholder) placeholder.hidden = false;
        return;
    }

    const finishLoading = (didLoad) => {
        if (image.dataset.loadRequest !== requestId) return;

        image.onload = null;
        image.onerror = null;
        container?.classList.remove("is-image-loading");
        container?.removeAttribute("aria-busy");
        image.hidden = !didLoad;
        if (placeholder) placeholder.hidden = didLoad;

        if (!didLoad) image.removeAttribute("src");
    };

    container?.classList.add("is-image-loading");
    container?.setAttribute("aria-busy", "true");
    if (placeholder) placeholder.hidden = true;
    image.hidden = false;
    image.decoding = "async";
    image.onload = () => finishLoading(true);
    image.onerror = () => finishLoading(false);
    image.src = source;

    if (image.complete) {
        window.queueMicrotask(() => finishLoading(image.naturalWidth > 0));
    }
};

const setVrchatImage = (image, url) => {
    setImageSource(image, String(url || ""));
};

const renderVrchatProfile = (user = {}) => {
    applyCurrentUserProfile({
        displayName: user.displayName || "-",
        bio: user.bio || user.statusDescription || "-",
        status: user.status || "offline",
        currentAvatar: user.currentAvatar || "-"
    });
    setVrchatImage(document.querySelector("#user-avatar-image"), user.currentAvatarImageUrl);
};

const createVrchatFriendCard = (friend) => {
    const card = document.createElement("li");
    const iconSlot = document.createElement("span");
    const image = document.createElement("img");
    const placeholder = document.createElement("span");
    const name = document.createElement("span");
    const status = document.createElement("span");
    const normalizedStatus = normalizeStatus(friend.status) || "offline";

    card.className = "friend-card";
    card.dataset.friendId = friend.id || "";
    card.dataset.status = normalizedStatus;
    iconSlot.className = "friend-icon-slot";
    image.className = "friend-icon-image";
    image.alt = `${friend.displayName || "フレンド"}のアイコン`;
    placeholder.className = "icon-placeholder";
    placeholder.textContent = "Icon";
    iconSlot.append(image, placeholder);
    setVrchatImage(image, friend.userIcon || friend.currentAvatarThumbnailImageUrl);

    name.className = "friend-name";
    name.textContent = friend.displayName || "Unknown User";
    status.className = `friend-status ${friendStatusClasses[normalizedStatus] || "status-offline"}`;
    status.textContent = friendStatusLabels[normalizedStatus] || normalizedStatus;
    card.append(iconSlot, name, status);

    return card;
};

const getVisibleFriendCount = () => {
    const total = currentVrchatFriends.length;
    const baseCount = Math.min(minimumVisibleFriendCount, total);
    const bio = profileFieldElements.bio;

    if (total <= baseCount || !bio || bio.hidden) return baseCount;

    const bioStyle = window.getComputedStyle(bio);
    const lineHeight = parseFloat(bioStyle.lineHeight) || parseFloat(bioStyle.fontSize) * 1.7;
    const extraBioHeight = Math.max(0, bio.getBoundingClientRect().height - lineHeight);
    const friendCard = friendsList?.querySelector(".friend-card");
    const listStyle = friendsList ? window.getComputedStyle(friendsList) : null;
    const rowGap = parseFloat(listStyle?.rowGap) || 0;
    const fallbackCardHeight = mobileLayoutQuery.matches ? 70 : 74;
    const cardHeight = friendCard?.getBoundingClientRect().height || fallbackCardHeight;
    const extraRows = Math.floor((extraBioHeight + rowGap) / (cardHeight + rowGap));
    const columnCount = mobileLayoutQuery.matches ? 1 : 2;

    return Math.min(total, baseCount + extraRows * columnCount);
};

const updateFriendListLabel = (visibleCount) => {
    const label = `フレンド一覧 ${visibleCount}人 / 全${currentVrchatFriends.length}人`;
    const mobileLabel = document.querySelector(".friends-accordion-toggle > span:first-child");

    if (friendsOpenButton) friendsOpenButton.textContent = label;
    if (mobileLabel) mobileLabel.textContent = label;
};

const updateFriendListHeight = (visibleCount) => {
    if (!friendsList) return;

    const baseCount = Math.min(minimumVisibleFriendCount, currentVrchatFriends.length);
    const columnCount = mobileLayoutQuery.matches ? 1 : 2;
    const extraRows = Math.ceil(Math.max(0, visibleCount - baseCount) / columnCount);
    const friendCard = friendsList.querySelector(".friend-card");
    const rowGap = parseFloat(window.getComputedStyle(friendsList).rowGap) || 0;
    const cardHeight = friendCard?.getBoundingClientRect().height || 74;

    friendsList.style.setProperty(
        "--friend-list-extra-height",
        `${extraRows * (cardHeight + rowGap)}px`
    );
};

const renderVisibleVrchatFriends = () => {
    if (!hasVrchatFriendData || !friendsList) return;

    const visibleCount = getVisibleFriendCount();
    updateFriendListLabel(visibleCount);
    updateFriendListHeight(visibleCount);
    if (visibleCount === renderedVrchatFriendCount) return;

    const visibleFriends = currentVrchatFriends.slice(0, visibleCount);
    friendsList.replaceChildren(...visibleFriends.map(createVrchatFriendCard));
    renderedVrchatFriendCount = visibleCount;
    setupScrollReveal();
    renderFriendWindow();
};

const scheduleFriendListFit = () => {
    if (!hasVrchatFriendData) return;

    if (friendListFitFrame && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(friendListFitFrame);
    }

    friendListFitFrame = window.requestAnimationFrame(() => {
        friendListFitFrame = 0;
        renderVisibleVrchatFriends();
    });
};

const renderVrchatFriends = (friends = [], counts = {}) => {
    currentVrchatFriends = [...friends];
    renderedVrchatFriendCount = -1;
    hasVrchatFriendData = true;
    renderVisibleVrchatFriends();
    scheduleFriendListFit();
    animateFriendCounts({
        online: Number(counts.online || 0),
        busy: Number(counts.busy || 0),
        offline: Number(counts.offline || 0)
    });
};

const createVrchatAvatarCard = (avatar) => {
    const card = document.createElement("li");
    const thumbnailSlot = document.createElement("span");
    const image = document.createElement("img");
    const placeholder = document.createElement("span");
    const name = document.createElement("span");
    const status = document.createElement("span");

    card.className = "avatar-card";
    card.dataset.avatarId = avatar.id || "";
    thumbnailSlot.className = "avatar-thumbnail-slot";
    image.className = "avatar-thumbnail-image";
    image.alt = `${avatar.name || "アバター"}のサムネイル`;
    placeholder.className = "avatar-thumbnail-placeholder";
    placeholder.textContent = "Avatar";
    thumbnailSlot.append(image, placeholder);
    setVrchatImage(image, avatar.thumbnailImageUrl || avatar.imageUrl);

    name.className = "avatar-name";
    name.textContent = avatar.name || "Avatar";
    status.className = "avatar-status";
    status.textContent = avatar.releaseStatus || "private";
    card.append(thumbnailSlot, name, status);

    return card;
};

const renderVrchatAvatars = (avatars = []) => {
    avatarList.replaceChildren(...avatars.slice(0, 10).map(createVrchatAvatarCard));
    syncAvatarFavoriteUi();
    setupScrollReveal();
    renderAvatarWindow();
};

const loadDummyDashboard = () => {
    renderVrchatProfile(dummyDashboardData.user);
    renderVrchatFriends(dummyDashboardData.friends, dummyDashboardData.friendCounts);
    renderVrchatAvatars(dummyDashboardData.avatars);
    renderWorldResults(dummyWorldResults);
    setDemoModeStatus();
};

/* Floating panels */
const updateFloatingPanels = () => {
    const floatStart = (friendCountPanel?.offsetHeight || 126) + 24;
    const shouldFloat = window.scrollY > floatStart;

    friendCountPanel?.classList.toggle("is-floating", shouldFloat);
    hamburger?.classList.toggle("is-floating", shouldFloat);
};

const updateScrollEffects = () => {
    updateFloatingPanels();
};

/* Profile editing */
const normalizeProfileStatus = (status) => {
    const rawStatus = (status || "").trim();
    const matchedOption = profileStatusOptions.find((option) => {
        return option.value === rawStatus || option.label === rawStatus;
    });

    return matchedOption ? matchedOption.value : rawStatus;
};

const getProfileDisplayValue = (field, value) => {
    const safeValue = (value || "").trim();

    if (field !== "status") return safeValue || "-";

    return friendStatusLabels[normalizeProfileStatus(safeValue)] || safeValue || "-";
};

const getProfileDataFromDom = () => {
    return Object.fromEntries(Object.entries(profileFieldElements).map(([field, element]) => {
        const value = element?.textContent || "";

        return [field, field === "status" ? normalizeProfileStatus(value) : value.trim()];
    }));
};

const getStoredProfileData = () => {
    const cookieProfile = getCookieInputState().profile || {};

    try {
        return {
            ...cookieProfile,
            ...JSON.parse(localStorage.getItem(profileStorageKey) || "{}")
        };
    } catch (error) {
        return cookieProfile;
    }
};

const applyCurrentUserProfile = (profileData) => {
    currentUserProfile = {
        ...currentUserProfile,
        ...profileData
    };

    Object.entries(profileFieldElements).forEach(([field, element]) => {
        if (!element) return;

        element.textContent = getProfileDisplayValue(field, currentUserProfile[field]);
    });

    if (navProfileElements.displayName) {
        navProfileElements.displayName.textContent = getProfileDisplayValue("displayName", currentUserProfile.displayName);
    }

    if (navProfileElements.status) {
        navProfileElements.status.textContent = getProfileDisplayValue("status", currentUserProfile.status);
    }

    scheduleFriendListFit();
};

const createProfileInput = (field, value) => {
    const config = profileFieldConfig[field];
    const normalizedValue = field === "status" ? normalizeProfileStatus(value) : value;
    const input = document.createElement(config.type === "textarea" ? "textarea" : config.type === "select" ? "select" : "input");

    input.className = "profile-edit-control";
    input.dataset.profileInput = field;
    input.id = `profile-edit-${field}`;

    if (config.type === "textarea") {
        input.rows = 3;
    }

    if (config.type === "select") {
        const hasCurrentOption = profileStatusOptions.some((option) => option.value === normalizedValue);

        if (normalizedValue && !hasCurrentOption) {
            input.appendChild(new Option(normalizedValue, normalizedValue));
        }

        profileStatusOptions.forEach((option) => {
            input.appendChild(new Option(option.label, option.value));
        });
    } else {
        if (config.type === "input") input.type = "text";
        input.placeholder = config.placeholder;
        input.autocomplete = "off";
    }

    input.value = normalizedValue || "";

    return input;
};

const setProfileEditMode = (shouldEdit) => {
    isProfileEditing = shouldEdit;
    userProfileCard?.classList.toggle("is-profile-editing", shouldEdit);

    if (profileEditButton) {
        profileEditButton.textContent = shouldEdit ? "完了" : "✦ 編集";
        profileEditButton.setAttribute("aria-pressed", String(shouldEdit));
    }
};

const enterProfileEditMode = () => {
    Object.entries(profileFieldElements).forEach(([field, element]) => {
        if (!element || element.parentElement?.querySelector(`[data-profile-input="${field}"]`)) return;

        const input = createProfileInput(field, currentUserProfile[field] || element.textContent);

        element.hidden = true;
        element.parentElement?.classList.add("is-profile-row-editing");
        element.insertAdjacentElement("afterend", input);
    });

    setProfileEditMode(true);
    userProfileCard?.querySelector("[data-profile-input]")?.focus();
};

const collectProfileFormData = () => {
    const profileData = {};

    Object.keys(profileFieldConfig).forEach((field) => {
        const input = userProfileCard?.querySelector(`[data-profile-input="${field}"]`);
        const value = input?.value.trim() || "";

        profileData[field] = field === "status" ? normalizeProfileStatus(value) : value;
    });

    return profileData;
};

const removeProfileInputs = () => {
    Object.values(profileFieldElements).forEach((element) => {
        if (!element) return;

        element.hidden = false;
        element.parentElement?.classList.remove("is-profile-row-editing");
    });

    userProfileCard?.querySelectorAll("[data-profile-input]").forEach((input) => input.remove());
};

const saveCurrentUserProfile = async (profileData) => {
    try {
        localStorage.setItem(profileStorageKey, JSON.stringify(profileData));
    } catch (error) {
        console.warn("Profile local save skipped.", error);
    }

    saveInputStateToCookie(profileData);

    return profileData;
};

const completeProfileEdit = async () => {
    const profileData = collectProfileFormData();

    if (profileEditButton) profileEditButton.disabled = true;

    try {
        const savedProfile = await saveCurrentUserProfile(profileData);

        applyCurrentUserProfile(savedProfile);
        removeProfileInputs();
        setProfileEditMode(false);
    } finally {
        if (profileEditButton) profileEditButton.disabled = false;
    }
};

const handleProfileEditClick = () => {
    if (!isProfileEditing) {
        enterProfileEditMode();
        return;
    }

    completeProfileEdit();
};

const initCurrentUserProfile = () => {
    applyCurrentUserProfile({
        ...getProfileDataFromDom(),
        ...getStoredProfileData()
    });
};

/* Mobile accordions */
const getAccordionPanel = (button) => document.querySelector(`#${button.dataset.accordionTarget}`);

const setAccordionExpanded = (button, isExpanded) => {
    const panel = getAccordionPanel(button);

    if (!panel) return;

    button.setAttribute("aria-expanded", String(isExpanded));
    panel.classList.toggle("is-accordion-collapsed", !isExpanded);
};

const setAccordionExpandedByPanelId = (panelId, isExpanded) => {
    const button = mobileAccordionButtons.find((item) => item.dataset.accordionTarget === panelId);

    if (!button) return;

    setAccordionExpanded(button, isExpanded);
};

const syncMobileAccordions = () => {
    mobileAccordionButtons.forEach((button) => {
        const shouldExpand = !mobileLayoutQuery.matches || button.getAttribute("aria-expanded") !== "false";

        setAccordionExpanded(button, shouldExpand);
    });
};

const handleMobileAccordionClick = (event) => {
    const button = event.currentTarget;

    if (!mobileLayoutQuery.matches) return;

    event.preventDefault();
    event.stopPropagation();
    setAccordionExpanded(button, button.getAttribute("aria-expanded") !== "true");
};

const revealContactAccordionContent = () => {
    contactAccordionPanel?.querySelectorAll(".scroll-reveal").forEach((item) => {
        item.classList.add("is-visible");
    });
};

const setContactAccordionExpanded = (isExpanded) => {
    if (!contactAccordionToggle) return;

    setAccordionExpanded(contactAccordionToggle, isExpanded);

    if (isExpanded) {
        window.requestAnimationFrame(revealContactAccordionContent);
    }
};

const handleContactAccordionClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setContactAccordionExpanded(contactAccordionToggle.getAttribute("aria-expanded") !== "true");
};

const scrollToContactAndOpen = ({ updateHash = true } = {}) => {
    const contactPanel = document.querySelector("#contact");

    if (!contactPanel) return;

    if (menuToggle) {
        menuToggle.checked = false;
    }

    if (updateHash && window.location.hash !== "#contact") {
        history.pushState(null, "", "#contact");
    }

    setContactAccordionExpanded(false);
    contactPanel.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
    });

    window.setTimeout(() => {
        setContactAccordionExpanded(true);
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520);
};

const handleContactNavClick = (event) => {
    event.preventDefault();
    scrollToContactAndOpen();
};

/* Friend counts */
const normalizeStatus = (status) => (status || "").trim().toLowerCase();

const getFriendCards = () => [...document.querySelectorAll("#friends-list .friend-card")];

const getFriendCounts = () => {
    const counts = {
        online: 0,
        busy: 0,
        offline: 0
    };

    getFriendCards().forEach((card) => {
        const status = normalizeStatus(card.dataset.status);

        if (status === "online") counts.online += 1;
        else if (status === "offline") counts.offline += 1;
        else counts.busy += 1;
    });

    return counts;
};

const setFriendCountValue = (key, value) => {
    if (!friendCountElements[key]) return;

    friendCountElements[key].textContent = value;
};

const setFriendCounts = (counts) => {
    Object.entries(counts).forEach(([key, value]) => setFriendCountValue(key, value));
};

const stopFriendCountAnimation = () => {
    if (friendCountAnimationFrame && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(friendCountAnimationFrame);
    }

    friendCountAnimationFrame = 0;
};

const animateFriendCounts = (counts) => {
    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    stopFriendCountAnimation();

    if (shouldReduceMotion || typeof window.requestAnimationFrame !== "function") {
        setFriendCounts(counts);
        return;
    }

    const duration = 900;
    const startTime = Date.now();

    setFriendCounts({
        online: 0,
        busy: 0,
        offline: 0
    });

    const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        Object.entries(counts).forEach(([key, target]) => {
            setFriendCountValue(key, Math.round(target * easedProgress));
        });

        if (progress < 1) {
            friendCountAnimationFrame = window.requestAnimationFrame(tick);
            return;
        }

        setFriendCounts(counts);
        friendCountAnimationFrame = 0;
    };

    friendCountAnimationFrame = window.requestAnimationFrame(tick);
};

const updateFriendCounts = (options = {}) => {
    const counts = getFriendCounts();

    if (options.animate) {
        animateFriendCounts(counts);
    } else {
        stopFriendCountAnimation();
        setFriendCounts(counts);
    }

    return counts;
};

/* Friend window */
const getFriendSearchText = (card) => {
    const status = normalizeStatus(card.dataset.status);
    const statusLabel = friendStatusLabels[status] || status;
    const name = card.querySelector(".friend-name")?.textContent || "";

    return `${name} ${status} ${statusLabel}`.toLowerCase();
};

const createFriendWindowItem = (card) => {
    const item = card.cloneNode(true);
    const status = normalizeStatus(item.dataset.status);
    const statusLabel = friendStatusLabels[status];
    const statusText = item.querySelector(".friend-status");

    item.classList.add("friend-window-item");

    if (statusText && statusLabel) {
        statusText.classList.remove("status-online", "status-ask-me", "status-join-me", "status-busy", "status-offline");
        statusText.classList.add(friendStatusClasses[status] || "status-offline");
        statusText.textContent = statusLabel;
    }

    return item;
};

const renderFriendWindow = () => {
    if (!friendWindowList || !friendWindowEmpty) return;

    const keyword = (friendSearchInput?.value || "").trim().toLowerCase();
    const filteredCards = getFriendCards().filter((card) => {
        const status = normalizeStatus(card.dataset.status);
        const matchesTab = activeFriendFilter === "all" || status === activeFriendFilter;
        const matchesSearch = !keyword || getFriendSearchText(card).includes(keyword);

        return matchesTab && matchesSearch;
    });

    friendWindowList.innerHTML = "";
    filteredCards.map(createFriendWindowItem).forEach((item) => friendWindowList.appendChild(item));
    friendWindowEmpty.hidden = filteredCards.length > 0;
};

const openFriendWindow = () => {
    if (!friendWindow) return;

    renderFriendWindow();
    friendWindow.hidden = false;
    document.body.classList.add("is-friend-window-open");
    friendsOpenButton?.setAttribute("aria-expanded", "true");
    friendSearchInput?.focus();
};

const closeFriendWindow = () => {
    if (!friendWindow) return;

    friendWindow.hidden = true;
    document.body.classList.remove("is-friend-window-open");
    friendsOpenButton?.setAttribute("aria-expanded", "false");
    friendsOpenButton?.focus();
};

const setFriendFilter = (filter) => {
    activeFriendFilter = filter;

    friendFilterButtons.forEach((button) => {
        const isActive = button.dataset.filter === activeFriendFilter;

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
    });

    renderFriendWindow();
};

const handleFriendOpenClick = (event) => {
    event?.stopPropagation();
    openFriendWindow();
};

/* Avatar favorites */
const getStoredFavoriteAvatarIds = () => {
    try {
        const storedValue = JSON.parse(localStorage.getItem(avatarFavoritesStorageKey) || "[]");

        return Array.isArray(storedValue) ? storedValue : [];
    } catch (error) {
        return [];
    }
};

const saveFavoriteAvatarIds = () => {
    try {
        localStorage.setItem(avatarFavoritesStorageKey, JSON.stringify([...favoriteAvatarIds]));
    } catch (error) {
        // Storage can be unavailable in some browser privacy modes.
    }
};

const createAvatarIdFromCard = (card, index) => {
    const name = (card.querySelector(".avatar-name")?.textContent || `avatar-${index + 1}`).trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    return `avatar-${index + 1}${slug ? `-${slug}` : ""}`;
};

const ensureAvatarCardId = (card, index = 0) => {
    const currentId = (card.dataset.avatarId || "").trim();

    if (currentId) return currentId;

    const generatedId = createAvatarIdFromCard(card, index);

    card.dataset.avatarId = generatedId;

    return generatedId;
};

const getAvatarDataFromCard = (card) => ({
    id: card.dataset.avatarId || "",
    name: (card.querySelector(".avatar-name")?.textContent || "Avatar").trim(),
    status: (card.querySelector(".avatar-status")?.textContent || "").trim(),
    thumbnailImageUrl: card.querySelector(".avatar-thumbnail-image")?.getAttribute("src") || ""
});

const createAvatarFavoriteButton = (card) => {
    const button = document.createElement("button");
    const avatarName = card.querySelector(".avatar-name")?.textContent?.trim() || "Avatar";

    button.className = "avatar-favorite-button";
    button.type = "button";
    button.dataset.favoriteAction = "toggle-avatar-favorite";
    button.setAttribute("aria-label", `${avatarName}をお気に入りに追加`);

    return button;
};

const updateAvatarFavoriteButton = (card) => {
    const button = card.querySelector(".avatar-favorite-button");
    const avatarData = getAvatarDataFromCard(card);
    const isFavorite = favoriteAvatarIds.has(avatarData.id);

    card.classList.toggle("is-favorite", isFavorite);

    if (!button) return;

    button.textContent = isFavorite ? "★" : "☆";
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute(
        "aria-label",
        `${avatarData.name}を${isFavorite ? "お気に入りから外す" : "お気に入りに追加"}`
    );
};

const decorateAvatarCard = (card, index = 0) => {
    ensureAvatarCardId(card, index);

    if (!card.querySelector(".avatar-favorite-button")) {
        card.appendChild(createAvatarFavoriteButton(card));
    }

    updateAvatarFavoriteButton(card);
};

const decorateAvatarCards = () => {
    getAvatarCards().forEach((card, index) => decorateAvatarCard(card, index));
};

const updateAvatarFavoriteStates = () => {
    document.querySelectorAll(".avatar-card").forEach((card) => updateAvatarFavoriteButton(card));
};

const getFavoriteAvatarCards = () => {
    return getAvatarCards().filter((card) => favoriteAvatarIds.has(card.dataset.avatarId));
};

const createFavoriteAvatarItem = (card) => {
    const avatarData = getAvatarDataFromCard(card);
    const item = document.createElement("li");
    const thumbnail = document.createElement("span");
    const info = document.createElement("span");
    const name = document.createElement("span");
    const status = document.createElement("span");
    const removeButton = document.createElement("button");
    const thumbnailPlaceholder = document.createElement("span");
    const image = card.querySelector(".avatar-thumbnail-image");

    item.className = "favorite-avatar-item";
    item.dataset.avatarId = avatarData.id;

    thumbnail.className = "favorite-avatar-thumbnail";
    thumbnailPlaceholder.className = "avatar-thumbnail-placeholder";
    thumbnailPlaceholder.textContent = "Avatar";
    thumbnail.appendChild(thumbnailPlaceholder);
    if (avatarData.thumbnailImageUrl && image && !image.hidden) {
        const thumbnailImage = document.createElement("img");

        thumbnailImage.className = "avatar-thumbnail-image";
        thumbnailImage.alt = `${avatarData.name}のサムネイル`;
        thumbnail.appendChild(thumbnailImage);
        setImageSource(thumbnailImage, avatarData.thumbnailImageUrl);
    }

    info.className = "favorite-avatar-info";
    name.className = "favorite-avatar-name";
    name.textContent = avatarData.name;
    status.className = "favorite-avatar-status";
    status.textContent = avatarData.status || "-";
    info.appendChild(name);
    info.appendChild(status);

    removeButton.className = "favorite-avatar-remove";
    removeButton.type = "button";
    removeButton.dataset.avatarId = avatarData.id;
    removeButton.setAttribute("aria-label", `${avatarData.name}をお気に入りから外す`);
    removeButton.textContent = "×";

    item.appendChild(thumbnail);
    item.appendChild(info);
    item.appendChild(removeButton);

    return item;
};

const renderFavoriteAvatars = () => {
    if (!favoriteAvatarList || !favoriteAvatarEmpty || !favoriteAvatarCount) return;

    const favoriteCards = getFavoriteAvatarCards();

    favoriteAvatarList.innerHTML = "";
    favoriteCards.forEach((card) => favoriteAvatarList.appendChild(createFavoriteAvatarItem(card)));
    favoriteAvatarEmpty.hidden = favoriteCards.length > 0;
    favoriteAvatarCount.textContent = String(favoriteCards.length);
    favoriteAvatarsPanel?.classList.toggle("has-favorites", favoriteCards.length > 0);
};

const syncAvatarFavoriteUi = () => {
    decorateAvatarCards();
    updateAvatarFavoriteStates();
    renderFavoriteAvatars();
};

const setAvatarFavorite = (avatarId, isFavorite) => {
    if (!avatarId) return;

    if (isFavorite) {
        favoriteAvatarIds.add(avatarId);
    } else {
        favoriteAvatarIds.delete(avatarId);
    }

    saveFavoriteAvatarIds();
    syncAvatarFavoriteUi();
    renderAvatarWindow();
};

const toggleAvatarFavorite = (card) => {
    if (!card) return;

    const avatarId = card.dataset.avatarId || ensureAvatarCardId(card);

    setAvatarFavorite(avatarId, !favoriteAvatarIds.has(avatarId));
};

const handleAvatarFavoriteClick = (event) => {
    const favoriteButton = event.target.closest(".avatar-favorite-button");

    if (!favoriteButton) return false;

    event.preventDefault();
    event.stopPropagation();
    toggleAvatarFavorite(favoriteButton.closest(".avatar-card"));

    return true;
};

const handleFavoriteAvatarListClick = (event) => {
    const removeButton = event.target.closest(".favorite-avatar-remove");

    if (!removeButton) return;

    event.preventDefault();
    setAvatarFavorite(removeButton.dataset.avatarId, false);
};

const initAvatarFavorites = () => {
    favoriteAvatarIds = new Set(getStoredFavoriteAvatarIds());
    syncAvatarFavoriteUi();
};

/* Avatar window */
const getAvatarCards = () => {
    return [...document.querySelectorAll("#avatar-list .avatar-card")].map((card, index) => {
        ensureAvatarCardId(card, index);

        return card;
    });
};

const getAvatarSearchText = (card) => {
    const name = card.querySelector(".avatar-name")?.textContent || "";
    const status = card.querySelector(".avatar-status")?.textContent || "";

    return `${name} ${status}`.toLowerCase();
};

const createAvatarWindowItem = (card) => {
    const item = card.cloneNode(true);

    item.classList.add("avatar-window-item");
    item.removeAttribute("tabindex");
    updateAvatarFavoriteButton(item);

    return item;
};

const renderAvatarWindow = () => {
    if (!avatarWindowList || !avatarWindowEmpty) return;

    const keyword = (avatarSearchInput?.value || "").trim().toLowerCase();
    const filteredCards = getAvatarCards().filter((card) => {
        return !keyword || getAvatarSearchText(card).includes(keyword);
    });

    avatarWindowList.innerHTML = "";
    filteredCards.map(createAvatarWindowItem).forEach((item) => avatarWindowList.appendChild(item));
    avatarWindowEmpty.hidden = filteredCards.length > 0;
};

const openAvatarWindow = () => {
    if (!avatarWindow) return;

    renderAvatarWindow();
    avatarWindow.hidden = false;
    document.body.classList.add("is-avatar-window-open");
    avatarList?.setAttribute("aria-expanded", "true");
    avatarSearchInput?.focus();
};

const closeAvatarWindow = () => {
    if (!avatarWindow) return;

    avatarWindow.hidden = true;
    document.body.classList.remove("is-avatar-window-open");
    avatarList?.setAttribute("aria-expanded", "false");
    avatarList?.focus();
};

const handleAvatarOpenClick = (event) => {
    if (handleAvatarFavoriteClick(event)) return;

    event?.stopPropagation();
    openAvatarWindow();
};

const handleAvatarListKeydown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openAvatarWindow();
};

/* World search */
const getWorldSearchText = (world) => [
    world.name,
    world.authorName,
    world.description,
    ...(Array.isArray(world.tags) ? world.tags : []),
    ...(Array.isArray(world.categories) ? world.categories : [])
].join(" ").toLowerCase();

const wait = (milliseconds) => new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
});

const fetchDummyWorldResults = async (keyword) => {
    const query = keyword.trim().toLowerCase();

    if (!query) {
        return dummyWorldResults;
    }

    return dummyWorldResults.filter((world) => getWorldSearchText(world).includes(query));
};

const fetchWorldResults = (keyword) => fetchDummyWorldResults(keyword);

const getWorldResultItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.results)) return payload.results;
    if (payload && Array.isArray(payload.worlds)) return payload.worlds;

    return [];
};

const normalizeWorldResult = (world) => ({
    id: world.id || world.worldId || "",
    name: world.name || world.worldName || "No Name",
    authorName: world.authorName || (world.author && world.author.name) || "Unknown",
    description: world.description || "",
    capacity: Number(world.capacity || world.recommendedCapacity || 0),
    occupants: Number(world.occupants || world.currentOccupants || 0),
    visits: Number(world.visits || world.visitCount || 0),
    tags: Array.isArray(world.tags) ? world.tags : [],
    categories: Array.isArray(world.categories) ? world.categories : [],
    theme: world.theme || "default",
    thumbnailLabel: world.thumbnailLabel || world.name || "World",
    thumbnailImageUrl: world.thumbnailImageUrl || world.imageUrl || world.thumbnailUrl || ""
});

const formatWorldNumber = (value) => Number(value || 0).toLocaleString("ja-JP");

const getWorldOccupancyRate = (world) => {
    if (!world.capacity) return 0;

    return world.occupants / world.capacity;
};

const hasWorldCategory = (world, category) => {
    const tags = world.tags.map((tag) => tag.toLowerCase());
    const categories = world.categories.map((item) => item.toLowerCase());

    if (categories.includes(category)) return true;

    if (category === "popular") return world.visits >= 30000;
    if (category === "active") return world.occupants >= 8;
    if (category === "photo") return tags.some((tag) => ["photo", "avatar", "studio", "mirror"].includes(tag));
    if (category === "talk") return tags.some((tag) => ["talk", "chill", "friends", "public"].includes(tag));
    if (category === "jp") return tags.includes("jp") || /日本語|jp/i.test(world.name + world.description);

    return false;
};

const getWorldBadges = (world) => {
    const badges = [];

    if (hasWorldCategory(world, "popular")) badges.push({ text: "HOT" });
    if (getWorldOccupancyRate(world) >= 0.55) badges.push({ text: "にぎわい" });
    else if (world.capacity - world.occupants >= 5) badges.push({ text: "空きあり", muted: true });
    if (hasWorldCategory(world, "photo")) badges.push({ text: "写真向け", muted: true });
    if (hasWorldCategory(world, "talk")) badges.push({ text: "雑談向け", muted: true });
    if (hasWorldCategory(world, "jp")) badges.push({ text: "日本語", muted: true });

    return badges.slice(0, 4);
};

const getWorldCardClasses = (world) => [
    "world-result-card",
    hasWorldCategory(world, "popular") ? "is-popular" : "",
    hasWorldCategory(world, "active") ? "is-active" : "",
    hasWorldCategory(world, "photo") ? "is-photo" : "",
    hasWorldCategory(world, "jp") ? "is-jp" : ""
].filter(Boolean).join(" ");

const setWorldVisualTheme = (element, world) => {
    element.style.setProperty(
        "--world-thumb-gradient",
        worldThemeGradients[world.theme] || worldThemeGradients.default
    );
};

const setWorldSearchMessage = (message, hidden = false) => {
    if (!worldSearchMessage) return;

    worldSearchMessage.textContent = message;
    worldSearchMessage.hidden = hidden;
};

const setWorldSearchLoading = (isLoading) => {
    if (!worldSearchSubmit) return;

    worldSearchSubmit.disabled = isLoading;
    worldSearchSubmit.textContent = isLoading ? "検索中" : worldSearchDefaultLabel;
};

const renderWorldLoading = () => {
    if (!worldResults) return;

    worldResults.innerHTML = "";

    for (let index = 0; index < 3; index += 1) {
        const item = document.createElement("li");

        item.className = "world-result-skeleton";
        item.setAttribute("aria-hidden", "true");
        item.innerHTML = `
            <div class="world-skeleton-thumb"></div>
            <div class="world-skeleton-line"></div>
            <div class="world-skeleton-line short"></div>
            <div class="world-skeleton-line"></div>
        `;
        worldResults.appendChild(item);
    }
};

const createWorldText = (tagName, className, text) => {
    const element = document.createElement(tagName);

    element.className = className;
    element.textContent = text;

    return element;
};

const createWorldBadge = (badge) => {
    const element = createWorldText("span", "world-badge", badge.text);

    if (badge.muted) {
        element.classList.add("is-muted");
    }

    return element;
};

const createWorldResultCard = (world) => {
    const item = document.createElement("li");
    const thumbnailSlot = document.createElement("span");
    const body = document.createElement("div");
    const badges = document.createElement("div");
    const meta = document.createElement("div");
    const tags = document.createElement("div");

    item.className = getWorldCardClasses(world);
    item.dataset.worldId = world.id;
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    item.setAttribute("aria-label", `${world.name}の詳細を開く`);
    setWorldVisualTheme(item, world);

    thumbnailSlot.className = "world-thumbnail-slot";
    setWorldVisualTheme(thumbnailSlot, world);

    if (world.thumbnailImageUrl) {
        const image = document.createElement("img");

        image.className = "world-thumbnail-image";
        image.alt = `${world.name}のサムネイル`;
        thumbnailSlot.appendChild(image);
        setImageSource(image, world.thumbnailImageUrl);
    } else {
        thumbnailSlot.appendChild(createWorldText("span", "world-thumbnail-label", world.thumbnailLabel));
    }

    body.className = "world-result-body";

    badges.className = "world-badges";
    getWorldBadges(world).forEach((badge) => badges.appendChild(createWorldBadge(badge)));
    body.appendChild(badges);

    body.appendChild(createWorldText("h4", "world-name", world.name));
    body.appendChild(createWorldText("p", "world-description", world.description || "説明文なし"));

    meta.className = "world-meta";
    meta.appendChild(createWorldText("span", "world-meta-item", `${world.occupants}/${world.capacity}人`));
    meta.appendChild(createWorldText("span", "world-meta-item", `${formatWorldNumber(world.visits)} visits`));
    meta.appendChild(createWorldText("span", "world-meta-item", world.authorName));

    tags.className = "world-tags";
    world.tags.slice(0, 4).forEach((tag) => {
        tags.appendChild(createWorldText("span", "world-tag", `#${tag}`));
    });

    body.appendChild(meta);
    body.appendChild(tags);
    item.appendChild(thumbnailSlot);
    item.appendChild(body);
    item.addEventListener("click", () => openWorldDetail(world));
    item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openWorldDetail(world);
        }
    });

    return item;
};

const applyWorldFilter = (worlds) => {
    if (activeWorldFilter === "popular") {
        return [...worlds].sort((a, b) => b.visits - a.visits);
    }

    if (activeWorldFilter === "active") {
        return [...worlds].sort((a, b) => b.occupants - a.occupants);
    }

    const filteredWorlds = activeWorldFilter === "all"
        ? [...worlds]
        : worlds.filter((world) => hasWorldCategory(world, activeWorldFilter));

    return filteredWorlds;
};

const renderFilteredWorldResults = () => {
    if (!worldResults) return;

    const worlds = applyWorldFilter(currentWorldResults);

    worldResults.innerHTML = "";

    if (!worlds.length) {
        setWorldSearchMessage("検索結果がありません");
        return;
    }

    setWorldSearchMessage(`検索結果 ${worlds.length}件`);
    worlds.forEach((world) => worldResults.appendChild(createWorldResultCard(world)));
};

const renderWorldResults = (results) => {
    currentWorldResults = getWorldResultItems(results).map(normalizeWorldResult);
    renderFilteredWorldResults();
};

const setWorldFilter = (filter) => {
    activeWorldFilter = filter;

    worldFilterButtons.forEach((button) => {
        const isActive = button.dataset.filter === activeWorldFilter;

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    if (currentWorldResults.length) {
        renderFilteredWorldResults();
        return;
    }

    handleWorldSearchSubmit({ preventDefault: () => {} });
};

const handleWorldSearchSubmit = async (event) => {
    event.preventDefault();

    const keyword = (worldSearchKeyword?.value || "").trim();
    const startedAt = Date.now();

    saveInputStateToCookie();
    setAccordionExpandedByPanelId("world-results-accordion-panel", true);
    setWorldSearchLoading(true);
    setWorldSearchMessage("検索中");
    renderWorldLoading();

    try {
        const results = await fetchWorldResults(keyword);
        const elapsed = Date.now() - startedAt;

        if (elapsed < 460) {
            await wait(460 - elapsed);
        }

        renderWorldResults(results);
    } catch (error) {
        if (worldResults) {
            worldResults.innerHTML = "";
        }

        setWorldSearchMessage("検索に失敗しました");
    } finally {
        setWorldSearchLoading(false);
    }
};

const openWorldDetail = (world) => {
    if (!worldDetailWindow) return;

    const badges = getWorldBadges(world);

    worldDetailWindow.hidden = false;
    document.body.classList.add("is-world-detail-open");

    if (worldDetailHero) {
        worldDetailHero.innerHTML = "";
        setWorldVisualTheme(worldDetailHero, world);

        if (world.thumbnailImageUrl) {
            const image = document.createElement("img");

            image.className = "world-thumbnail-image";
            image.alt = `${world.name}のサムネイル`;
            worldDetailHero.appendChild(image);
            setImageSource(image, world.thumbnailImageUrl);
        } else {
            worldDetailHero.appendChild(createWorldText("span", "world-thumbnail-label", world.thumbnailLabel));
        }
    }

    if (worldDetailBadges) {
        worldDetailBadges.innerHTML = "";
        badges.forEach((badge) => worldDetailBadges.appendChild(createWorldBadge(badge)));
    }

    if (worldDetailTitle) worldDetailTitle.textContent = world.name;
    if (worldDetailAuthor) worldDetailAuthor.textContent = `作者：${world.authorName}`;
    if (worldDetailDescription) worldDetailDescription.textContent = world.description || "説明文なし";

    if (worldDetailStats) {
        worldDetailStats.innerHTML = "";
        worldDetailStats.appendChild(createWorldText("span", "world-meta-item", `人数 ${world.occupants}/${world.capacity}`));
        worldDetailStats.appendChild(createWorldText("span", "world-meta-item", `${formatWorldNumber(world.visits)} visits`));
        worldDetailStats.appendChild(createWorldText("span", "world-meta-item", `空き ${Math.max(world.capacity - world.occupants, 0)}人`));
    }

    if (worldDetailTags) {
        worldDetailTags.innerHTML = "";
        world.tags.forEach((tag) => worldDetailTags.appendChild(createWorldText("span", "world-tag", `#${tag}`)));
    }

    worldDetailClose?.focus();
};

const closeWorldDetail = () => {
    if (!worldDetailWindow) return;

    worldDetailWindow.hidden = true;
    document.body.classList.remove("is-world-detail-open");
};

/* Contact form */
const clearContactErrors = () => {
    contactForm?.querySelectorAll(".contact-field.is-invalid").forEach((field) => {
        field.classList.remove("is-invalid");
    });
    contactForm?.querySelectorAll(".contact-error").forEach((error) => error.remove());
    contactForm?.querySelectorAll("[aria-invalid='true']").forEach((control) => {
        control.removeAttribute("aria-invalid");
        control.removeAttribute("aria-describedby");
    });
};

const setContactFieldError = (control, message) => {
    const field = control.closest(".contact-field");
    const error = document.createElement("span");

    if (!field) return;

    field.classList.add("is-invalid");
    error.className = "contact-error";
    error.id = `${control.id}-error`;
    error.textContent = message;
    control.setAttribute("aria-invalid", "true");
    control.setAttribute("aria-describedby", error.id);
    field.appendChild(error);
};

const validateContactForm = () => {
    if (!contactForm) return false;

    let firstInvalidControl = null;

    clearContactErrors();
    contactForm.querySelectorAll("[required]").forEach((control) => {
        if (control.value.trim()) return;

        if (!firstInvalidControl) {
            firstInvalidControl = control;
        }
        setContactFieldError(control, "この項目を入力してください");
    });

    firstInvalidControl?.focus();

    return !firstInvalidControl;
};

const collectContactFormData = () => {
    if (!contactForm) return {};

    const formData = new FormData(contactForm);

    return {
        title: (formData.get("title") || "").toString().trim(),
        category: (formData.get("category") || "").toString(),
        priority: (formData.get("priority") || "").toString(),
        name: (formData.get("name") || "").toString().trim(),
        replyMethod: (formData.get("replyMethod") || "").toString(),
        message: (formData.get("message") || "").toString().trim()
    };
};

const createContactTicketId = () => {
    const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `VRC-${datePart}-${randomPart}`;
};

const formatContactDate = (value) => {
    return new Intl.DateTimeFormat("ja-JP", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
};

const normalizeContactReceipt = (response, requestData) => {
    const receivedAt = response?.receivedAt || new Date().toISOString();

    return {
        ticketId: response?.ticketId || response?.id || createContactTicketId(),
        receivedAt,
        title: response?.title || requestData.title,
        category: response?.category || requestData.category,
        priority: response?.priority || requestData.priority,
        name: response?.name || requestData.name || "未入力",
        replyMethod: response?.replyMethod || requestData.replyMethod,
        message: response?.message || requestData.message,
        statusMessage: response?.statusMessage || "お問い合わせを受け付けました。"
    };
};

const setContactReceiptMeta = (items) => {
    if (!contactReceiptMeta) return;

    contactReceiptMeta.innerHTML = "";
    items.forEach(([label, value]) => {
        const term = document.createElement("dt");
        const detail = document.createElement("dd");

        term.textContent = label;
        detail.textContent = value;
        contactReceiptMeta.appendChild(term);
        contactReceiptMeta.appendChild(detail);
    });
    contactReceiptMeta.hidden = false;
};

const renderContactReceipt = (receipt) => {
    if (!contactReceipt) return;

    contactReceipt.classList.add("is-submitted");
    if (contactReceiptTitle) {
        contactReceiptTitle.textContent = `受付完了 ${receipt.ticketId}`;
    }
    if (contactReceiptMessage) {
        contactReceiptMessage.textContent = `「${receipt.title}」を受け付けました。控えはこの画面に残ります。`;
    }

    setContactReceiptMeta([
        ["カテゴリ", receipt.category],
        ["優先度", receipt.priority],
        ["返信方法", receipt.replyMethod],
        ["お名前", receipt.name],
        ["送信日時", formatContactDate(receipt.receivedAt)],
        ["内容", receipt.message]
    ]);
};

const resetContactReceipt = () => {
    contactReceipt?.classList.remove("is-submitted");
    if (contactReceiptTitle) contactReceiptTitle.textContent = "待機中";
    if (contactReceiptMessage) {
        contactReceiptMessage.textContent = "送信すると、このサイト内にお問い合わせ内容の控えが表示されます。";
    }
    if (contactReceiptMeta) {
        contactReceiptMeta.innerHTML = "";
        contactReceiptMeta.hidden = true;
    }
};

const getStoredContactReceipt = () => {
    try {
        return JSON.parse(localStorage.getItem(contactStorageKey) || "null");
    } catch (error) {
        return null;
    }
};

const saveContactReceipt = (receipt) => {
    try {
        localStorage.setItem(contactStorageKey, JSON.stringify(receipt));
    } catch (error) {
        // Storage can be unavailable in some browser privacy modes.
    }
};

const restoreContactReceipt = () => {
    const storedReceipt = getStoredContactReceipt();

    if (storedReceipt) {
        renderContactReceipt(storedReceipt);
    }
};

const setContactSubmitting = (isSubmitting) => {
    if (!contactSubmit) return;

    contactSubmit.disabled = isSubmitting;
    contactSubmit.textContent = isSubmitting ? "送信中" : contactSubmitDefaultLabel;
};

const submitContactRequest = async (requestData) => {
    await wait(320);

    return normalizeContactReceipt(null, requestData);
};

const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (!validateContactForm()) return;

    const requestData = collectContactFormData();

    setContactSubmitting(true);

    try {
        const receipt = await submitContactRequest(requestData);

        renderContactReceipt(receipt);
        saveContactReceipt(receipt);
        saveInputStateToCookie();
    } catch (error) {
        if (contactReceiptTitle) contactReceiptTitle.textContent = "送信エラー";
        if (contactReceiptMessage) {
            contactReceiptMessage.textContent = "送信に失敗しました。内容を確認してもう一度試してください。";
        }
        contactReceipt?.classList.remove("is-submitted");
    } finally {
        setContactSubmitting(false);
    }
};

const handleContactClear = () => {
    contactForm?.reset();
    clearContactErrors();
    resetContactReceipt();
    localStorage.removeItem(contactStorageKey);
    saveInputStateToCookie();
};

/* Reveal animation */
const setupScrollReveal = () => {
    const revealItems = [...document.querySelectorAll(revealSelector)];

    revealItems.forEach((item, index) => {
        const delay = Math.min(index % 10, 7) * 70;

        item.classList.add("scroll-reveal");
        item.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    if (typeof window.IntersectionObserver !== "function") {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12
    });

    revealItems.forEach((item) => observer.observe(item));
};

/* Init */
window.addEventListener("scroll", updateScrollEffects, { passive: true });
window.addEventListener("resize", updateScrollEffects);
window.addEventListener("resize", scheduleFriendListFit);
window.addEventListener("hashchange", () => {
    if (window.location.hash === "#contact") {
        scrollToContactAndOpen({ updateHash: false });
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !worldDetailWindow?.hidden) {
        closeWorldDetail();
        return;
    }

    if (event.key === "Escape" && !friendWindow?.hidden) {
        closeFriendWindow();
        return;
    }

    if (event.key === "Escape" && !avatarWindow?.hidden) {
        closeAvatarWindow();
    }
});

if (typeof desktopLayoutQuery.addEventListener === "function") {
    desktopLayoutQuery.addEventListener("change", updateFloatingPanels);
} else if (typeof desktopLayoutQuery.addListener === "function") {
    desktopLayoutQuery.addListener(updateFloatingPanels);
}
if (typeof mobileLayoutQuery.addEventListener === "function") {
    mobileLayoutQuery.addEventListener("change", syncMobileAccordions);
    mobileLayoutQuery.addEventListener("change", scheduleFriendListFit);
} else if (typeof mobileLayoutQuery.addListener === "function") {
    mobileLayoutQuery.addListener(syncMobileAccordions);
    mobileLayoutQuery.addListener(scheduleFriendListFit);
}
profileEditButton?.addEventListener("click", handleProfileEditClick);
friendsOpenButton?.addEventListener("click", handleFriendOpenClick);
friendsList?.addEventListener("click", handleFriendOpenClick);
friendWindowClose?.addEventListener("click", closeFriendWindow);
friendSearchInput?.addEventListener("input", renderFriendWindow);
friendWindow?.addEventListener("click", (event) => {
    if (event.target === friendWindow) {
        closeFriendWindow();
    }
});
avatarList?.addEventListener("click", handleAvatarOpenClick);
avatarList?.addEventListener("keydown", handleAvatarListKeydown);
favoriteAvatarList?.addEventListener("click", handleFavoriteAvatarListClick);
avatarWindowClose?.addEventListener("click", closeAvatarWindow);
avatarSearchInput?.addEventListener("input", renderAvatarWindow);
avatarWindowList?.addEventListener("click", handleAvatarFavoriteClick);
avatarWindow?.addEventListener("click", (event) => {
    if (event.target === avatarWindow) {
        closeAvatarWindow();
    }
});
worldSearchForm?.addEventListener("submit", handleWorldSearchSubmit);
worldDetailClose?.addEventListener("click", closeWorldDetail);
worldDetailWindow?.addEventListener("click", (event) => {
    if (event.target === worldDetailWindow) {
        closeWorldDetail();
    }
});
contactForm?.addEventListener("submit", handleContactSubmit);
contactClear?.addEventListener("click", handleContactClear);
contactAccordionToggle?.addEventListener("click", handleContactAccordionClick);
contactNavLinks.forEach((link) => {
    link.addEventListener("click", handleContactNavClick);
});
cookieAccept?.addEventListener("click", acceptCookieConsent);
cookieDecline?.addEventListener("click", declineCookieConsent);
worldSearchKeyword?.addEventListener("input", () => saveInputStateToCookie());
contactForm?.addEventListener("input", () => saveInputStateToCookie());
worldFilterButtons.forEach((button) => {
    button.addEventListener("click", () => setWorldFilter(button.dataset.filter || "all"));
});
mobileAccordionButtons.forEach((button) => {
    button.addEventListener("click", handleMobileAccordionClick);
});
friendFilterButtons.forEach((button) => {
    button.addEventListener("click", () => setFriendFilter(button.dataset.filter || "all"));
});

restoreInputStateFromCookie();
showCookieConsentIfNeeded();
loadDummyDashboard();
initAvatarFavorites();
setupScrollReveal();
initCurrentUserProfile();
updateScrollEffects();
syncMobileAccordions();
renderFriendWindow();
renderAvatarWindow();
restoreContactReceipt();
if (window.location.hash === "#contact") {
    window.setTimeout(() => scrollToContactAndOpen({ updateHash: false }), 0);
}

window.applyCurrentUserProfile = applyCurrentUserProfile;
window.collectProfileFormData = collectProfileFormData;
window.saveCurrentUserProfile = saveCurrentUserProfile;
window.updateFriendCounts = updateFriendCounts;
window.renderVrchatFriends = renderVrchatFriends;
window.renderWorldResults = renderWorldResults;
window.renderAvatarWindow = renderAvatarWindow;
window.setAvatarFavorite = setAvatarFavorite;
window.renderFavoriteAvatars = renderFavoriteAvatars;
window.collectContactFormData = collectContactFormData;
window.submitContactRequest = submitContactRequest;
window.renderContactReceipt = renderContactReceipt;
