// ABS landing page — app catalog and list rendering.

const ABS_APPS = [
  {
    href: "diamond/",
    name: "Diamond",
    desc: "LCD geometric diamond lattice"
  },
  {
    href: "ripple/",
    name: "Ripple",
    desc: "Pulsing pixel wave backdrop"
  },
  {
    href: "voroni/",
    name: "Voroni",
    desc: "Voronoi pulse field with edge ripples"
  },
  {
    href: "coderain/",
    name: "Code Rain",
    desc: "Matrix code rain with optional overlay mode"
  },
  {
    href: "shard/",
    name: "Shard",
    desc: "Recursive stained-glass polygon mosaic"
  },
  {
    href: "fractals/",
    name: "Fractals",
    desc: "Classic fractal sets with infinite zoom"
  }
];

function renderAppList(root) {
  if (!root) return;

  const fragment = document.createDocumentFragment();

  for (const app of ABS_APPS) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = app.href;

    const name = document.createElement("span");
    name.className = "app-name";
    name.textContent = app.name;

    const desc = document.createElement("span");
    desc.className = "app-desc";
    desc.textContent = app.desc;

    link.append(name, desc);
    item.append(link);
    fragment.append(item);
  }

  root.replaceChildren(fragment);
}

renderAppList(document.getElementById("abs-app-list"));
