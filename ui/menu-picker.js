// Custom menu picker — native <select> popups fail in OBS Interact (CEF).
// In-DOM button + listbox; list portals to document.body so settings-menu
// overflow / backdrop-filter cannot clip it.
(function () {
  const pickers = [];
  let listenersBound = false;

  function closeAll(exceptRoot) {
    for (const picker of pickers) {
      if (picker.root !== exceptRoot) picker.close();
    }
  }

  function ensureListeners() {
    if (listenersBound) return;
    listenersBound = true;

    document.addEventListener("click", (e) => {
      if (!(e.target instanceof Element)) {
        closeAll();
        return;
      }
      if (e.target.closest(".menu-picker") || e.target.closest(".menu-picker-list")) return;
      closeAll();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });

    document.addEventListener(
      "scroll",
      () => {
        for (const picker of pickers) {
          if (picker.root.dataset.open === "true") picker.reposition();
        }
      },
      { passive: true, capture: true }
    );
  }

  function createMenuPicker({
    root,
    options,
    labelledBy,
    getValue,
    setValue,
    renderValue,
    renderOption
  }) {
    if (!root) throw new Error("createMenuPicker: root required");

    ensureListeners();
    root.innerHTML = "";
    root.classList.add("menu-picker");
    root.dataset.open = "false";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "menu-picker-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    if (labelledBy) trigger.setAttribute("aria-labelledby", labelledBy);

    const valueEl = document.createElement("span");
    valueEl.className = "menu-picker-value";
    const caret = document.createElement("span");
    caret.className = "menu-picker-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.textContent = "▾";
    trigger.append(valueEl, caret);

    const list = document.createElement("ul");
    list.className = "menu-picker-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;

    const optionButtons = [];
    const optionByValue = new Map();

    for (const entry of options) {
      const value = String(entry.value);
      const label = entry.label != null ? String(entry.label) : value;
      optionByValue.set(value, { value, label });

      const li = document.createElement("li");
      li.setAttribute("role", "presentation");
      const option = document.createElement("button");
      option.type = "button";
      option.className = "menu-picker-option";
      option.setAttribute("role", "option");
      option.dataset.value = value;
      if (typeof renderOption === "function") {
        renderOption(option, { value, label });
      } else {
        option.textContent = label;
      }
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        setValue(value);
        close();
        trigger.focus();
      });
      li.appendChild(option);
      list.appendChild(li);
      optionButtons.push(option);
    }

    function sync() {
      const value = String(getValue());
      const entry = optionByValue.get(value);
      if (typeof renderValue === "function") {
        renderValue(valueEl, value, entry || { value, label: value });
      } else {
        valueEl.textContent = entry ? entry.label : value;
      }
      for (const option of optionButtons) {
        option.setAttribute("aria-selected", String(option.dataset.value === value));
      }
    }

    function positionList() {
      const rect = trigger.getBoundingClientRect();
      const maxHeight = Math.min(14 * 16, window.innerHeight * 0.42);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openUp = spaceBelow < Math.min(maxHeight, 160) && spaceAbove > spaceBelow;
      const height = Math.min(maxHeight, openUp ? spaceAbove : spaceBelow);

      list.style.left = `${Math.round(rect.left)}px`;
      list.style.width = `${Math.round(rect.width)}px`;
      list.style.maxHeight = `${Math.max(120, Math.round(height))}px`;

      if (openUp) {
        list.style.top = "auto";
        list.style.bottom = `${Math.round(window.innerHeight - rect.top + 4)}px`;
      } else {
        list.style.bottom = "auto";
        list.style.top = `${Math.round(rect.bottom + 4)}px`;
      }
    }

    function open() {
      closeAll(root);
      root.dataset.open = "true";
      // Portal outside #settings-menu — backdrop-filter creates a fixed containing block
      // and overflow clips the list if it stays nested.
      document.body.appendChild(list);
      list.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      positionList();
      const selected = optionButtons.find((o) => o.getAttribute("aria-selected") === "true");
      (selected || optionButtons[0])?.focus();
    }

    function close() {
      root.dataset.open = "false";
      list.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      if (list.parentElement !== root) root.appendChild(list);
    }

    function toggle() {
      if (root.dataset.open === "true") close();
      else open();
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    list.addEventListener("keydown", (e) => {
      const current = document.activeElement;
      const index = optionButtons.indexOf(current);
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        trigger.focus();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        optionButtons[Math.min(index + 1, optionButtons.length - 1)]?.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        optionButtons[Math.max(index - 1, 0)]?.focus();
      }
      if (e.key === "Home") {
        e.preventDefault();
        optionButtons[0]?.focus();
      }
      if (e.key === "End") {
        e.preventDefault();
        optionButtons[optionButtons.length - 1]?.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (root.dataset.open === "true") positionList();
    });

    root.append(trigger, list);
    sync();

    const api = { sync, close, reposition: positionList, root };
    pickers.push(api);
    return api;
  }

  window.SeshMenuPicker = {
    create: createMenuPicker,
    closeAll
  };
})();
