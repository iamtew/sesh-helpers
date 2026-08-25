/**
 * Layout 2 — YouTube playlist helpers (scaffolding).
 * Real extract/API wiring is future work; plug in an existing impl here.
 */
(function (global) {
  "use strict";

  /**
   * Parse a YouTube playlist URL or bare list id.
   * @param {string} url
   * @returns {{ listId: string|null, raw: string }}
   */
  function parsePlaylistUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return { listId: null, raw: "" };

    try {
      const parsed = new URL(raw);
      const listId = parsed.searchParams.get("list");
      if (listId) return { listId, raw };
    } catch {
      // bare id or non-URL string
    }

    if (/^PL[\w-]+$/i.test(raw) || /^[\w-]{10,}$/i.test(raw)) {
      return { listId: raw, raw };
    }

    return { listId: null, raw };
  }

  /**
   * Fetch playlist metadata. Stub — returns null until implemented.
   * @param {string} url
   * @returns {Promise<null|{ title: string, videoCount: number, thumbnailUrl: string|null }>}
   */
  async function fetchPlaylistData(url) {
    const { listId, raw } = parsePlaylistUrl(url);
    console.info("[seshbanner/playlist] TODO: fetch playlist data", { listId, raw });
    return null;
  }

  /**
   * Apply stub / future data into layout-2 DOM nodes.
   * @param {{ titleEl: Element, metaEl: Element, thumbEl: Element }} els
   * @param {{ title?: string, videoCount?: number, thumbnailUrl?: string|null }|null} data
   * @param {string} playlistUrl
   */
  function applyPlaylistScaffold(els, data, playlistUrl) {
    const { listId } = parsePlaylistUrl(playlistUrl);

    if (data) {
      els.titleEl.textContent = data.title || "Untitled playlist";
      els.metaEl.textContent = `${data.videoCount ?? 0} videos`;
      if (data.thumbnailUrl) {
        els.thumbEl.style.backgroundImage = `url(${JSON.stringify(data.thumbnailUrl)})`;
        els.thumbEl.style.backgroundSize = "cover";
        els.thumbEl.style.backgroundPosition = "center";
      }
      return;
    }

    els.titleEl.textContent = listId
      ? `Playlist ${listId}`
      : "Playlist title";
    els.metaEl.textContent = listId
      ? "Scaffolding — extract pending"
      : "Paste a playlist URL";
    els.thumbEl.style.backgroundImage = "";
  }

  global.SeshBannerPlaylist = {
    parsePlaylistUrl,
    fetchPlaylistData,
    applyPlaylistScaffold
  };
})(window);
