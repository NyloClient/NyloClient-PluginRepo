(function () {

if (window.__AVIA_OFFICIAL_REPO__) return;
window.__AVIA_OFFICIAL_REPO__ = true;

const STORAGE_KEY = "avia_plugins";
const BACKEND_FILE = "pluginrepobackend.js";

let repoWindow = null;
let repoContent = null;

function getInstalled() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function isInstalled(link) {
    return getInstalled().some(p => p.link === link);
}

function triggerManagerRefresh() {
    const refreshBtn = document.querySelector("[data-avia-refresh]");
    if (refreshBtn) refreshBtn.click();
    window.dispatchEvent(new Event("storage"));
}

function installPlugin(plugin) {
    const installed = getInstalled();
    if (installed.some(p => p.link === plugin.link)) return;

    installed.push(plugin);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installed));

    triggerManagerRefresh();
    renderRepo(window.__AVIA_REPO_CACHE__);
}

function uninstallPlugin(link) {
    const installed = getInstalled().filter(p => p.link !== link);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installed));

    triggerManagerRefresh();
    renderRepo(window.__AVIA_REPO_CACHE__);
}

function safeParse(text) {
    try {
        if (!text) return null;
        text = text.replace(/^\uFEFF/, "");
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function loadBackendLocal() {
    try {
        if (typeof require === "undefined") return null;

        const fs = require("fs");
        const path = require("path");

        const possiblePaths = [
            path.join(__dirname, BACKEND_FILE),
            path.join(process.cwd(), BACKEND_FILE)
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                const raw = fs.readFileSync(p, "utf8");
                return safeParse(raw);
            }
        }

        return null;
    } catch {
        return null;
    }
}

async function loadBackendBrowser() {
    try {
        const res = await fetch("./" + BACKEND_FILE + "?t=" + Date.now(), {
            cache: "no-store"
        });
        const text = await res.text();
        return safeParse(text);
    } catch {
        return null;
    }
}

async function refetchRepo() {
    if (!repoContent) return;

    repoContent.innerHTML = "Loading...";

    let data = loadBackendLocal();

    if (!data) {
        data = await loadBackendBrowser();
    }

    if (!data || !data.plugins) {
        repoContent.innerHTML = "Invalid repo JSON.";
        return;
    }

    window.__AVIA_REPO_CACHE__ = data;
    renderRepo(data);
}

function renderRepo(data) {
    if (!repoContent) return;

    repoContent.innerHTML = "";

    data.plugins.forEach(plugin => {

        const card = document.createElement("div");
        card.style.padding = "10px";
        card.style.marginBottom = "10px";
        card.style.border = "1px solid var(--md-sys-color-outline)";
        card.style.borderRadius = "8px";

        const title = document.createElement("div");
        title.textContent = plugin.name;
        title.style.fontWeight = "bold";

        const author = document.createElement("div");
        author.textContent = "by " + (plugin.author || "Unknown");
        author.style.fontSize = "12px";
        author.style.opacity = "0.7";

        const desc = document.createElement("div");
        desc.textContent = plugin.description;
        desc.style.margin = "6px 0";

        const btn = document.createElement("button");
        btn.style.padding = "6px 10px";
        btn.style.cursor = "pointer";

        if (isInstalled(plugin.link)) {
            btn.textContent = "Remove";
            btn.onclick = () => uninstallPlugin(plugin.link);
        } else {
            btn.textContent = "Install";
            btn.onclick = () => installPlugin(plugin);
        }

        card.appendChild(title);
        card.appendChild(author);
        card.appendChild(desc);
        card.appendChild(btn);

        repoContent.appendChild(card);
    });
}

function createRepoWindow() {
    if (repoWindow) {
        repoWindow.style.display = "block";
        return;
    }

    repoWindow = document.createElement("div");
    repoWindow.style.position = "fixed";
    repoWindow.style.top = "50%";
    repoWindow.style.left = "50%";
    repoWindow.style.transform = "translate(-50%, -50%)";
    repoWindow.style.width = "500px";
    repoWindow.style.height = "600px";
    repoWindow.style.background = "var(--md-sys-color-surface-container)";
    repoWindow.style.border = "1px solid var(--md-sys-color-outline)";
    repoWindow.style.borderRadius = "12px";
    repoWindow.style.display = "flex";
    repoWindow.style.flexDirection = "column";
    repoWindow.style.zIndex = "999999";

    const header = document.createElement("div");
    header.style.padding = "10px";
    header.style.fontWeight = "bold";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.textContent = "Official Repo";

    const close = document.createElement("button");
    close.textContent = "X";
    close.onclick = () => repoWindow.style.display = "none";
    header.appendChild(close);

    repoContent = document.createElement("div");
    repoContent.style.flex = "1";
    repoContent.style.overflow = "auto";
    repoContent.style.padding = "10px";

    const refetch = document.createElement("button");
    refetch.textContent = "Refetch";
    refetch.style.position = "absolute";
    refetch.style.bottom = "10px";
    refetch.style.left = "10px";
    refetch.onclick = refetchRepo;

    repoWindow.appendChild(header);
    repoWindow.appendChild(repoContent);
    repoWindow.appendChild(refetch);

    document.body.appendChild(repoWindow);

    refetchRepo();
}

function injectButtonIntoManager() {
    const interval = setInterval(() => {
        const panel = document.querySelector("[data-avia-plugin-panel]");
        if (!panel) return;

        if (panel.querySelector("[data-avia-official-repo-btn]")) {
            clearInterval(interval);
            return;
        }

        const btn = document.createElement("button");
        btn.textContent = "Official Repo";
        btn.dataset.aviaOfficialRepoBtn = "true";
        btn.style.position = "absolute";
        btn.style.bottom = "10px";
        btn.style.left = "10px";
        btn.onclick = createRepoWindow;

        panel.appendChild(btn);
        clearInterval(interval);
    }, 500);
}

window.addEventListener("storage", () => {
    if (window.__AVIA_REPO_CACHE__) {
        renderRepo(window.__AVIA_REPO_CACHE__);
    }
});

injectButtonIntoManager();

})();
