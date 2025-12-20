(() => {
  const data = window.SKILLS_DATA || {};
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];

  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");
  const featuredToggle = document.getElementById("featuredToggle");
  const skillsGrid = document.getElementById("skillsGrid");
  const noResults = document.getElementById("noResults");
  const skillTotal = document.getElementById("skillTotal");
  const skillCount = document.getElementById("skillCount");
  const skillTotalSide = document.getElementById("skillTotalSide");
  const skillCountSide = document.getElementById("skillCountSide");
  const skillsUpdated = document.getElementById("skillsUpdated");
  const tocList = document.getElementById("tocList");

  const categoryLabel = (id) => {
    const entry = categories.find((c) => c.id === id);
    if (entry && entry.name) return entry.name;
    return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const normalize = (value) => (value || "").toString().toLowerCase();

  const updateStats = (visibleCount) => {
    if (skillTotal) skillTotal.textContent = skills.length.toString();
    if (skillCount) skillCount.textContent = visibleCount.toString();
    if (skillTotalSide) skillTotalSide.textContent = skills.length.toString();
    if (skillCountSide) skillCountSide.textContent = visibleCount.toString();
    if (skillsUpdated) {
      const updated = data.updated ? new Date(data.updated) : null;
      skillsUpdated.textContent = updated && !isNaN(updated)
        ? updated.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        : "-";
    }
  };

  const buildCategoryOptions = () => {
    categories.forEach((cat) => {
      if (!cat || !cat.id) return;
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name || categoryLabel(cat.id);
      categorySelect.appendChild(option);
    });
  };

  const render = () => {
    const query = normalize(searchInput ? searchInput.value : "");
    const category = categorySelect ? categorySelect.value : "all";
    const featuredOnly = featuredToggle ? featuredToggle.checked : false;

    const filtered = skills.filter((skill) => {
      if (!skill) return false;
      if (featuredOnly && !skill.featured) return false;
      if (category !== "all" && (skill.category || "other") !== category) return false;

      if (!query) return true;
      const haystack = [
        skill.name,
        skill.description,
        skill.category,
        skill.author,
        skill.source
      ]
        .filter(Boolean)
        .map(normalize)
        .join(" ");
      return haystack.includes(query);
    });

    skillsGrid.innerHTML = "";
    filtered.forEach((skill, index) => {
      const card = document.createElement("article");
      card.className = "skill-card";
      card.style.animationDelay = `${Math.min(index, 12) * 0.04}s`;

      const title = document.createElement("h3");
      title.className = "skill-title";
      title.textContent = skill.name;

      const meta = document.createElement("div");
      meta.className = "skill-meta";
      const categoryBadge = document.createElement("span");
      categoryBadge.className = "badge";
      categoryBadge.textContent = categoryLabel(skill.category || "other");
      meta.appendChild(categoryBadge);

      if (skill.featured) {
        const featuredBadge = document.createElement("span");
        featuredBadge.className = "badge featured";
        featuredBadge.textContent = "Featured";
        meta.appendChild(featuredBadge);
      }

      if (skill.author) {
        const author = document.createElement("span");
        author.textContent = `Author: ${skill.author}`;
        meta.appendChild(author);
      }

      const description = document.createElement("p");
      description.className = "skill-description";
      description.textContent = skill.description || "No description provided.";

      const path = document.createElement("div");
      path.className = "skill-path";
      path.textContent = `Path: ${skill.path || skill.name}`;

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(description);
      card.appendChild(path);
      skillsGrid.appendChild(card);
    });

    noResults.hidden = filtered.length > 0;
    updateStats(filtered.length);
  };

  if (categorySelect) buildCategoryOptions();
  if (searchInput) searchInput.addEventListener("input", render);
  if (categorySelect) categorySelect.addEventListener("change", render);
  if (featuredToggle) featuredToggle.addEventListener("change", render);

  if (tocList) {
    const sections = document.querySelectorAll(".content section[id]");
    tocList.innerHTML = "";
    sections.forEach((section) => {
      const title = section.querySelector("h2, h1");
      if (!title) return;
      const item = document.createElement("a");
      item.href = `#${section.id}`;
      item.textContent = title.textContent;
      tocList.appendChild(item);
    });
  }

  render();
})();
