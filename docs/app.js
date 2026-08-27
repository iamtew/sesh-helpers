(function () {
  "use strict";

  /* Legacy #fragment URLs → ?h= (fragments lock browser scroll — meat bags get stuck). */
  if (window.location.hash) {
    const migrate = new URL(window.location.href);
    const section = migrate.hash.slice(1);
    migrate.hash = "";
    const params = new URLSearchParams(migrate.search);
    if (section) params.set("h", section);
    migrate.search = params.toString();
    location.replace(migrate.href);
    return;
  }

  const FILE_ENTRIES = [
    { slug: "readme", path: "docs/README.md", fetch: "README.md", label: "Index" },
    { slug: "init", path: "docs/001_CLANKER_INIT.md", fetch: "001_CLANKER_INIT.md", label: "CLANKER INIT" },
    { slug: "control-ui", path: "docs/Control_UI.md", fetch: "Control_UI.md", label: "Control UI" },
    { slug: "themes", path: "docs/THEMES.md", fetch: "THEMES.md", label: "Themes" },
    { slug: "typography", path: "docs/TYPOGRAPHY.md", fetch: "TYPOGRAPHY.md", label: "Typography" },
    { slug: "root-readme", path: "README.md", fetch: "../README.md", label: "Repo overview" },
    { slug: "spotsmoke/notes", path: "spotsmoke/notes.md", fetch: "../spotsmoke/notes.md", label: "Spot Smoke" },
    { slug: "spotsmoke/poster", path: "spotsmoke/poster.md", fetch: "../spotsmoke/poster.md", label: "Poster" },
    { slug: "seshbanner/notes", path: "seshbanner/notes.md", fetch: "../seshbanner/notes.md", label: "Sesh Banner" },
    { slug: "trbanner/notes", path: "trbanner/notes.md", fetch: "../trbanner/notes.md", label: "Trick Request Banner" },
    { slug: "abs/diamond/notes", path: "abs/diamond/notes.md", fetch: "../abs/diamond/notes.md", label: "Diamond" },
    { slug: "abs/voroni/notes", path: "abs/voroni/notes.md", fetch: "../abs/voroni/notes.md", label: "Voroni" },
    { slug: "abs/ripple/notes", path: "abs/ripple/notes.md", fetch: "../abs/ripple/notes.md", label: "Ripple" }
  ];

  const ROOT_FOLDER_ORDER = ["docs", "abs", "seshbanner", "spotsmoke", "trbanner"];
  const DEFAULT_SLUG = "readme";
  const DEFAULT_THEME = "lcd-glass";
  const GITHUB_REPO = "https://github.com/iamtew/sesh-helpers";
  const GITHUB_DOCS = `${GITHUB_REPO}/tree/master/docs`;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fileBySlug = Object.create(null);
  const entryByPath = Object.create(null);
  for (const entry of FILE_ENTRIES) {
    fileBySlug[entry.slug.toLowerCase()] = entry;
    entryByPath[entry.path.toLowerCase()] = entry;
    entryByPath[entry.path.replace(/\.md$/i, "").toLowerCase()] = entry;
  }

  const fileListEl = document.getElementById("file-list");
  const docTitleEl = document.getElementById("doc-title");
  const docStatsEl = document.getElementById("doc-stats");
  const docContentEl = document.getElementById("doc-content");
  const tocListEl = document.getElementById("toc-list");
  const tocEmptyEl = document.getElementById("toc-empty");
  const tabFilesEl = document.getElementById("tab-files");
  const tabContentsEl = document.getElementById("tab-contents");
  const panelFilesEl = document.getElementById("panel-files");
  const panelContentsEl = document.getElementById("panel-contents");
  const githubLinkEl = document.getElementById("github-link");
  const githubFileLinkEl = document.getElementById("github-file-link");
  const themeSelectEl = document.getElementById("theme-select");
  const topBarEl = document.querySelector(".top-bar");

  let state = {
    slug: DEFAULT_SLUG,
    theme: DEFAULT_THEME,
    section: "",
    sidebarTab: "files"
  };

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  function getThemeCatalog() {
    const catalog = window.SeshThemes && Array.isArray(window.SeshThemes.catalog)
      ? window.SeshThemes.catalog
      : [];
    if (catalog.length) return catalog;
    return [
      { id: "lcd-glass", name: "LCD Glass" },
      { id: "sesh-glass", name: "Sesh Glass" },
      { id: "3026-d3c0", name: "3026 D3C0" }
    ];
  }

  function normalizeSlug(value) {
    const raw = decodeURIComponent(String(value || "").trim());
    if (!raw) return DEFAULT_SLUG;
    const lower = raw.toLowerCase();
    if (fileBySlug[lower]) return fileBySlug[lower].slug;
    const asPath = lower.endsWith(".md") ? lower : `${lower}.md`;
    if (entryByPath[asPath]) return entryByPath[asPath].slug;
    return DEFAULT_SLUG;
  }

  function getEntry(slug) {
    return fileBySlug[normalizeSlug(slug).toLowerCase()];
  }

  function basename(path) {
    const parts = path.split("/");
    return parts[parts.length - 1] || path;
  }

  function dirname(path) {
    const index = path.lastIndexOf("/");
    return index >= 0 ? path.slice(0, index) : "";
  }

  function resolveRepoPath(basePath, href) {
    const raw = href.split("#")[0].trim();
    if (!raw || /^https?:\/\//i.test(raw) || raw.startsWith("mailto:")) return null;

    const decoded = decodeURIComponent(raw);
    const baseDir = dirname(basePath);
    const stack = baseDir ? baseDir.split("/") : [];

    for (const part of decoded.replace(/^(\.\/)+/, "").split("/")) {
      if (part === "..") stack.pop();
      else if (part !== "." && part) stack.push(part);
    }

    return stack.join("/");
  }

  function normalizeTheme(value) {
    const id = String(value || "");
    return getThemeCatalog().some(theme => theme.id === id) ? id : DEFAULT_THEME;
  }

  function parseURL() {
    const params = new URLSearchParams(window.location.search);
    state.slug = normalizeSlug(params.get("f"));
    state.theme = normalizeTheme(params.get("theme"));
    state.section = params.get("h") || "";
    if (!state.section && window.location.hash) {
      state.section = window.location.hash.slice(1);
    }
  }

  function updateURL(options) {
    const opts = options || {};
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    if (state.slug !== DEFAULT_SLUG) params.set("f", state.slug);
    if (state.theme !== DEFAULT_THEME) params.set("theme", state.theme);
    const section = opts.section !== undefined ? opts.section : state.section;
    if (section) params.set("h", section);
    url.search = params.toString();
    url.hash = "";
    history.replaceState(null, "", url);
  }

  function scrollToSection(sectionId, behavior) {
    const id = String(sectionId || "").replace(/^#/, "");
    if (!id) return false;
    const target = document.getElementById(id);
    if (!target) return false;

    const topBar = document.querySelector(".top-bar");
    const offset = (topBar ? topBar.getBoundingClientRect().height : 0) + 16;
    const top = window.scrollY + target.getBoundingClientRect().top - offset;
    const scrollBehavior = behavior === "instant" ? "auto" : (behavior || (reduceMotion ? "auto" : "smooth"));

    window.scrollTo({ top: Math.max(0, top), behavior: scrollBehavior });
    return true;
  }

  function slugify(text) {
    return String(text)
      .replace(/<[^>]+>/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function countWords(text) {
    const stripped = text.replace(/```[\s\S]*?```/g, " ").replace(/[^\w\s'-]/g, " ");
    const words = stripped.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  function computeStats(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text).length;
    const lines = text ? text.split(/\r?\n/).length : 0;
    const words = countWords(text);
    return { bytes, lines, words };
  }

  function resolveSlugFromHref(href) {
    const current = getEntry(state.slug);
    if (!current) return null;
    const repoPath = resolveRepoPath(current.path, href);
    if (!repoPath) return null;
    const entry = entryByPath[repoPath.toLowerCase()] || entryByPath[repoPath.replace(/\.md$/i, "").toLowerCase()];
    return entry ? entry.slug : null;
  }

  function compareFolderNames(a, b) {
    const ai = ROOT_FOLDER_ORDER.indexOf(a);
    const bi = ROOT_FOLDER_ORDER.indexOf(b);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.localeCompare(b);
  }

  function compareFileEntries(a, b) {
    const aName = basename(a.path);
    const bName = basename(b.path);
    const aReadme = aName.toLowerCase() === "readme.md";
    const bReadme = bName.toLowerCase() === "readme.md";
    if (aReadme && !bReadme) return -1;
    if (bReadme && !aReadme) return 1;
    return aName.localeCompare(bName);
  }

  function buildFileTree(entries) {
    const root = { folders: new Map(), files: [] };

    for (const entry of entries) {
      const parts = entry.path.split("/");
      const fileName = parts.pop();
      let node = root;

      for (const part of parts) {
        if (!node.folders.has(part)) {
          node.folders.set(part, { name: part, folders: new Map(), files: [] });
        }
        node = node.folders.get(part);
      }

      node.files.push({ ...entry, fileName });
    }

    return root;
  }

  function folderPathSegments(parentPath, name) {
    return parentPath ? `${parentPath}/${name}` : name;
  }

  function shouldFolderStartOpen(folderPath, activePath) {
    if (folderPath === "docs") return true;
    return activePath === folderPath || activePath.startsWith(`${folderPath}/`);
  }

  function createFileLink(entry) {
    const link = document.createElement("a");
    link.href = entry.slug === DEFAULT_SLUG ? "?" : `?f=${encodeURIComponent(entry.slug)}`;
    link.className = "file-item";
    link.dataset.slug = entry.slug;
    link.title = entry.path;
    link.innerHTML =
      `<span class="file-icon" aria-hidden="true"></span>` +
      `<span class="file-meta">` +
      `<span class="file-name">${escapeHtml(basename(entry.path))}</span>` +
      `</span>`;
    if (entry.slug === state.slug) link.setAttribute("aria-current", "page");
    link.addEventListener("click", event => {
      event.preventDefault();
      loadDoc(entry.slug);
    });
    return link;
  }

  function renderTreeNode(node, parentPath, container) {
    const folders = [...node.folders.values()].sort((a, b) => compareFolderNames(a.name, b.name));
    const files = [...node.files].sort(compareFileEntries);

    if (!parentPath) {
      const docsFolder = folders.find(folder => folder.name === "docs");
      const otherFolders = folders.filter(folder => folder.name !== "docs");

      if (docsFolder) {
        appendFolderNode(docsFolder, parentPath, container);
      }

      for (const entry of files) {
        const li = document.createElement("li");
        li.className = "tree-file";
        li.appendChild(createFileLink(entry));
        container.appendChild(li);
      }

      for (const folder of otherFolders) {
        appendFolderNode(folder, parentPath, container);
      }
      return;
    }

    for (const folder of folders) {
      appendFolderNode(folder, parentPath, container);
    }

    for (const entry of files) {
      const li = document.createElement("li");
      li.className = "tree-file";
      li.appendChild(createFileLink(entry));
      container.appendChild(li);
    }
  }

  function appendFolderNode(folder, parentPath, container) {
    const folderPath = folderPathSegments(parentPath, folder.name);
    const li = document.createElement("li");
    li.className = "tree-folder";

    const details = document.createElement("details");
    if (shouldFolderStartOpen(folderPath, getEntry(state.slug).path)) {
      details.open = true;
    }

    const summary = document.createElement("summary");
    summary.innerHTML = `<span class="tree-folder-name">${escapeHtml(folder.name)}/</span>`;
    details.appendChild(summary);

    const childList = document.createElement("ul");
    renderTreeNode(folder, folderPath, childList);
    details.appendChild(childList);

    li.appendChild(details);
    container.appendChild(li);
  }

  function buildFileNav() {
    fileListEl.innerHTML = "";
    renderTreeNode(buildFileTree(FILE_ENTRIES), "", fileListEl);
  }

  function configureMarked() {
    if (!window.marked) return;
    window.marked.use({
      gfm: true,
      breaks: false,
      renderer: {
        heading(token) {
          const text = this.parser.parseInline(token.tokens);
          const plain = text.replace(/<[^>]+>/g, "");
          const id = slugify(plain);
          return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
        }
      }
    });
  }

  function updateGithubLinks(entry) {
    if (githubLinkEl) githubLinkEl.href = GITHUB_DOCS;
    if (githubFileLinkEl) {
      githubFileLinkEl.href = `${GITHUB_REPO}/blob/master/${entry.path}`;
      githubFileLinkEl.title = `View ${entry.path} on GitHub`;
    }
  }

  function setSidebarTab(tab) {
    const nextTab = tab === "contents" ? "contents" : "files";
    state.sidebarTab = nextTab;

    const filesActive = nextTab === "files";
    tabFilesEl.setAttribute("aria-selected", filesActive ? "true" : "false");
    tabFilesEl.tabIndex = filesActive ? 0 : -1;
    tabContentsEl.setAttribute("aria-selected", filesActive ? "false" : "true");
    tabContentsEl.tabIndex = filesActive ? -1 : 0;

    panelFilesEl.hidden = !filesActive;
    panelContentsEl.hidden = filesActive;
  }

  function buildTocLists(headings) {
    tocListEl.innerHTML = "";

    const hasHeadings = headings.length > 0;
    tocEmptyEl.hidden = hasHeadings;
    tabContentsEl.disabled = !hasHeadings;

    if (!hasHeadings) {
      if (state.sidebarTab === "contents") setSidebarTab("files");
      return;
    }

    for (const heading of headings) {
      const li = document.createElement("li");
      li.className = `toc-depth-${heading.depth}`;
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.text;
      link.addEventListener("click", event => {
        event.preventDefault();
        state.section = heading.id;
        scrollToSection(heading.id);
        updateURL({ section: heading.id });
      });
      li.appendChild(link);
      tocListEl.appendChild(li);
    }
  }

  function buildTocFromContent() {
    const headings = docContentEl.querySelectorAll("h2, h3, h4");
    const items = [];
    for (const heading of headings) {
      if (!heading.id) heading.id = slugify(heading.textContent);
      items.push({
        id: heading.id,
        depth: Number(heading.tagName.slice(1)),
        text: heading.textContent.trim()
      });
    }
    buildTocLists(items);
  }

  function showError(message) {
    docContentEl.innerHTML = `<p class="doc-error">${message}</p>`;
    buildTocLists([]);
  }

  async function loadDoc(slug, options) {
    const opts = options || {};
    const entry = getEntry(slug);

    state.slug = entry.slug;
    state.section = opts.section !== undefined ? String(opts.section || "") : "";
    buildFileNav();
    updateURL({ section: state.section });

    docTitleEl.textContent = entry.path;
    updateGithubLinks(entry);
    docStatsEl.textContent = "Loading…";
    docContentEl.innerHTML = '<p class="loading">Loading…</p>';

    try {
      const response = await fetch(entry.fetch);
      if (!response.ok) throw new Error(`Could not load ${entry.path} (${response.status})`);
      const text = await response.text();
      const stats = computeStats(text);

      docStatsEl.textContent =
        `${formatBytes(stats.bytes)} · ${stats.lines.toLocaleString()} lines · ${stats.words.toLocaleString()} words`;

      if (window.marked) {
        docContentEl.innerHTML = window.marked.parse(text);
      } else {
        docContentEl.innerHTML = `<pre class="fallback-md">${escapeHtml(text)}</pre>`;
      }

      buildTocFromContent();
      applyTheme();

      if (state.section) {
        setSidebarTab("contents");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToSection(state.section, "instant"));
        });
      } else if (!opts.skipScroll) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    } catch (err) {
      docStatsEl.textContent = "";
      showError(err.message || "Failed to load document.");
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    themeSelectEl.value = state.theme;

    const effects = (window.SeshThemes && window.SeshThemes.effects) || {};
    for (const [id, effect] of Object.entries(effects)) {
      if (typeof effect.stop === "function") {
        if (topBarEl) effect.stop(topBarEl);
        if (id !== state.theme) effect.stop(docTitleEl);
      }
    }

    if (!reduceMotion) {
      const active = effects[state.theme];
      if (topBarEl && active && typeof active.start === "function") {
        active.start(topBarEl);
      }
    }
  }

  function populateThemeSelect() {
    themeSelectEl.innerHTML = "";
    for (const theme of getThemeCatalog()) {
      const option = document.createElement("option");
      option.value = theme.id;
      option.textContent = theme.name;
      themeSelectEl.appendChild(option);
    }
    themeSelectEl.value = state.theme;
  }

  function onDocLinkClick(event) {
    const anchor = event.target.closest("a");
    if (!anchor || !docContentEl.contains(anchor)) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    if (href.startsWith("#")) {
      event.preventDefault();
      const id = href.slice(1);
      state.section = id;
      scrollToSection(id);
      updateURL({ section: id });
      return;
    }

    const slug = resolveSlugFromHref(href);
    if (!slug) return;

    event.preventDefault();
    const section = href.includes("#") ? href.slice(href.indexOf("#") + 1) : "";
    loadDoc(slug, { section, skipScroll: !section });
  }

  function onPopState() {
    parseURL();
    populateThemeSelect();
    applyTheme();
    if (state.section) setSidebarTab("contents");
    loadDoc(state.slug, { section: state.section });
  }

  themeSelectEl.addEventListener("change", () => {
    state.theme = normalizeTheme(themeSelectEl.value);
    applyTheme();
    updateURL({ section: state.section });
  });

  tabFilesEl.addEventListener("click", () => setSidebarTab("files"));
  tabContentsEl.addEventListener("click", () => {
    if (!tabContentsEl.disabled) setSidebarTab("contents");
  });

  docContentEl.addEventListener("click", onDocLinkClick);

  configureMarked();
  parseURL();
  buildFileNav();
  populateThemeSelect();
  applyTheme();
  if (state.section) setSidebarTab("contents");
  loadDoc(state.slug, { section: state.section });

  window.addEventListener("popstate", onPopState);
})();
