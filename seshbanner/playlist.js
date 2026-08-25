/**
 * Layout 3 — YouTube playlist extract + ticker formatting.
 * Public playlists via Invidious, with RSS relays as fallback (no API key).
 */
(function (global) {
  "use strict";

  const ITEM_DELIMITERS = [
    { id: "0", label: "Bullet ( • )", value: " • " },
    { id: "1", label: "Dash ( - )", value: " - " },
    { id: "2", label: "Pipe ( | )", value: " | " },
    { id: "3", label: "Middle dot ( · )", value: " · " },
    { id: "4", label: "Comma ( , )", value: ", " },
    { id: "5", label: "Custom", value: null }
  ];

  const DEFAULT_DELIMITER_ID = "0";
  const CUSTOM_DELIMITER_ID = "5";
  const DEFAULT_CUSTOM_DELIMITER = "•";

  function normalizeCustomDelimiterText(text) {
    const raw = String(text ?? "").trim();
    if (!raw) return DEFAULT_CUSTOM_DELIMITER;
    return raw.slice(0, 5);
  }

  function getDelimiterById(id, customText) {
    if (String(id) === CUSTOM_DELIMITER_ID) {
      const core = normalizeCustomDelimiterText(customText);
      return ` ${core} `;
    }
    const match = ITEM_DELIMITERS.find(entry => entry.id === String(id));
    return match && match.value ? match.value : ITEM_DELIMITERS[0].value;
  }

  function normalizeDelimiterId(id) {
    return ITEM_DELIMITERS.some(entry => entry.id === String(id))
      ? String(id)
      : DEFAULT_DELIMITER_ID;
  }

  const INVIDIOUS_HOSTS = [
    "https://inv.nadeko.net",
    "https://inv.tux.pizza",
    "https://invidious.f5.si"
  ];

  /**
   * Parse a YouTube playlist URL or bare list id.
   * @param {string} url
   * @returns {{ listId: string|null, raw: string }}
   */
  function parsePlaylistUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return { listId: null, raw: "" };

    if (/^[A-Za-z0-9_-]{10,}$/.test(raw) && !raw.includes("://") && !raw.includes(" ")) {
      return { listId: raw, raw };
    }

    try {
      const parsed = new URL(raw.startsWith("http") ? raw : "https://" + raw);
      const listId = parsed.searchParams.get("list");
      if (listId) return { listId, raw };
    } catch {
      /* fall through */
    }

    const match = raw.match(/[?&]list=([A-Za-z0-9_-]+)/);
    return { listId: match ? match[1] : null, raw };
  }

  function feedUrlFor(id) {
    return (
      "https://www.youtube.com/feeds/videos.xml?playlist_id=" +
      encodeURIComponent(id)
    );
  }

  function decodeHtmlEntities(str) {
    const el = document.createElement("textarea");
    el.innerHTML = String(str || "");
    return el.value;
  }

  function cleanText(str) {
    return decodeHtmlEntities(String(str || "").trim());
  }

  function normalizeInvidiousPayload(data) {
    if (!data || !Array.isArray(data.videos)) return null;

    const items = data.videos
      .map(video => ({
        channel: cleanText(video.author) || "Unknown channel",
        title: cleanText(video.title)
      }))
      .filter(item => item.title);

    if (!items.length) return null;

    return {
      playlistTitle: cleanText(data.title) || "Playlist",
      items
    };
  }

  function normalizeRelayPayload(data) {
    if (!data || typeof data !== "object") return null;

    // feed2json / JSON Feed: { title, items: [{ title, author: { name } }] }
    if (data.title && Array.isArray(data.items)) {
      const items = data.items
        .map(item => ({
          channel:
            cleanText(item.author && item.author.name) ||
            cleanText(item.author) ||
            "Unknown channel",
          title: cleanText(item.title)
        }))
        .filter(item => item.title);

      if (!items.length) return null;
      return {
        playlistTitle: cleanText(data.title) || "Playlist",
        items
      };
    }

    // rss2json: { status, feed: { title }, items: [{ title, author }] }
    if (data.status === "ok" && data.feed && Array.isArray(data.items)) {
      const items = data.items
        .map(item => ({
          channel: cleanText(item.author) || "Unknown channel",
          title: cleanText(item.title)
        }))
        .filter(item => item.title);

      if (!items.length) return null;
      return {
        playlistTitle: cleanText(data.feed.title) || "Playlist",
        items
      };
    }

    return null;
  }

  /**
   * Fetch playlist title + items. Throws if the playlist cannot be loaded.
   * @param {string} url
   * @returns {Promise<{ playlistTitle: string, items: { title: string, channel: string }[] }|null>}
   */
  async function fetchPlaylistData(url) {
    const { listId } = parsePlaylistUrl(url);
    if (!listId) return null;

    let lastError = null;

    for (const host of INVIDIOUS_HOSTS) {
      try {
        const res = await fetch(host + "/api/v1/playlists/" + encodeURIComponent(listId));
        if (!res.ok) {
          lastError = new Error("HTTP " + res.status);
          continue;
        }
        const data = await res.json();
        const parsed = normalizeInvidiousPayload(data);
        if (parsed) return parsed;
        lastError = new Error("Unexpected playlist shape");
      } catch (err) {
        lastError = err;
      }
    }

    const feedUrl = feedUrlFor(listId);
    const endpoints = [
      "https://feed2json.org/convert?url=" + encodeURIComponent(feedUrl),
      "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(feedUrl)
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) {
          lastError = new Error("HTTP " + res.status);
          continue;
        }
        const data = await res.json();
        const parsed = normalizeRelayPayload(data);
        if (parsed) return parsed;
        lastError = new Error("Unexpected feed shape");
      } catch (err) {
        lastError = err;
      }
    }

    throw new Error(
      (lastError && lastError.message ? lastError.message + " — " : "") +
        "Could not load playlist. Is it public?"
    );
  }

  /**
   * @param {{ title?: string, channel?: string }} item
   * @param {string} playlistLayout
   */
  function formatItem(item, playlistLayout) {
    const title = item && item.title ? String(item.title) : "";
    const channel = item && item.channel ? String(item.channel) : "";
    switch (String(playlistLayout)) {
      case "2":
        return channel;
      case "3":
        return title;
      case "4":
      default:
        return title && channel ? title + " by " + channel : title || channel;
    }
  }

  /**
   * @param {{ title?: string, channel?: string }[]} items
   * @param {string} playlistLayout
   * @returns {string[]}
   */
  function formatTickerItems(items, playlistLayout) {
    return (items || []).map(item => formatItem(item, playlistLayout)).filter(Boolean);
  }

  global.SeshBannerPlaylist = {
    ITEM_DELIMITERS,
    DEFAULT_DELIMITER_ID,
    CUSTOM_DELIMITER_ID,
    DEFAULT_CUSTOM_DELIMITER,
    normalizeCustomDelimiterText,
    getDelimiterById,
    normalizeDelimiterId,
    parsePlaylistUrl,
    fetchPlaylistData,
    formatTickerItems
  };
})(window);
