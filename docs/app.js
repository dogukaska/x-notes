import { readAll, readDrafts, write } from "./store.js?v=3";

const $ = (id) => document.getElementById(id);
const icons = {
  home: '<path d="m3 10 9-7 9 7v10H3zM9 20v-6h6v6"/>',
  bookmark: '<path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20 15A8 8 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m10 3-1 3-3 1-3 3 2 2-1 4 4 1 2 4h4l1-3 3-1 3-3-2-2 1-4-4-1-2-4z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m4 17 5-4 3 3 4-5 4 4"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  apps: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  tag: '<path d="M3 4h8l10 10-7 7L4 11z"/><circle cx="8" cy="8" r="1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  note: '<path d="M5 4h10l4 4v12H5zM14 4v5h5M8 12h8m-8 4h5"/>',
  pin: '<path d="m9 3 9 3-1 3-2 1v5l-2 2-7-2v-3l3-4-1-2zM9 16l-2 5"/>',
  reply: '<path d="M21 11a8 8 0 0 1-8 8H4l2-4a8 8 0 1 1 15-4Z"/>',
};

function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + '</svg>';
}

for (const slot of document.querySelectorAll("[data-icon]")) slot.innerHTML = icon(slot.dataset.icon);

const selfId = "self";
const draftRecoveryPrefix = "x-notes:draft:";
const defaultProfile = { id: selfId, name: "Benim notlarım", handle: "ben", bio: "", photo: null, banner: null };
const dateFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });
const profileDateFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });
const preferredTheme = matchMedia("(prefers-color-scheme: dark)");
let sessionTheme;
const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("x-notes") : null;
const routeTitles = {
  notes: ["Anasayfa", ""],
  saved: ["Yer imleri", "Daha sonra dönmek istediğin notlar."],
  profile: ["Profil", ""],
  category: ["Kategori profili", ""],
  following: ["Takip edilenler", ""],
  followers: ["Takipçiler", ""],
  thread: ["Konuşma", ""],
};

let notes = new Map();
let profiles = new Map([[selfId, defaultProfile]]);
let children = new Map();
let categories = [];
let route = { view: "notes", id: "" };
let query = "";
let filter = "all";
let tag = "";
let refreshVersion = 0;
let initialized = false;
let undoAction;
let toastTimeout;
let images = new Map();
let editingProfile;
let autoHandle = false;
let editingNote = null;
let replyParent = null;
let savingEditor = false;
let savingQuick = false;
let activeDraftId = null;
let pendingDraftWrite = null;
const draftImageIds = new WeakMap();
const noteEditor = $("note-form");
let quickUploads = [];
let noteUploads = [];
let photo;
let banner;

function node(tagName, className, value) {
  const item = document.createElement(tagName);
  if (className) item.className = className;
  if (value !== undefined) item.textContent = value;
  return item;
}

function button(label, className, action) {
  const item = node("button", className, label);
  item.type = "button";
  item.addEventListener("click", action);
  return item;
}

function iconButton(label, symbol, action, pressed) {
  const item = button(undefined, "icon-button", action);
  item.innerHTML = icon(symbol);
  item.setAttribute("aria-label", label);
  item.title = label;
  if (pressed !== undefined) item.setAttribute("aria-pressed", String(pressed));
  return item;
}

function normalize(value) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/\p{M}/gu, "").replaceAll("ı", "i");
}

function profileFor(id) {
  return profiles.get(id) ?? defaultProfile;
}

function imageFor(blob, alt = "") {
  if (!images.has(blob)) images.set(blob, URL.createObjectURL(blob));
  const img = node("img");
  img.src = images.get(blob);
  img.alt = alt;
  return img;
}

function cleanImages() {
  const liveUrls = new Set(Array.from(document.images, (img) => img.src));
  for (const [blob, url] of images) {
    if (liveUrls.has(url)) continue;
    URL.revokeObjectURL(url);
    images.delete(blob);
  }
}

function fillAvatar(avatar, profile) {
  const initials = profile.name.split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("tr-TR");
  avatar.replaceChildren(profile.photo ? imageFor(profile.photo) : initials);
  avatar.setAttribute("aria-hidden", "true");
  return avatar;
}

function currentProfile() {
  return route.view === "category" ? profileFor(route.id) : profileFor(selfId);
}

function readRoute() {
  const [view, id = ""] = location.hash.slice(1).split("/");
  if (!Object.hasOwn(routeTitles, view)) return { view: "notes", id: "" };
  return { view, id };
}

function navigate(view, id = "") {
  const hash = view === "notes" ? "" : "#" + view + (id ? "/" + id : "");
  if (location.hash !== hash) {
    history.pushState(null, "", location.pathname + location.search + hash);
  }
  applyRoute();
}

function applyRoute() {
  route = readRoute();
  query = "";
  tag = "";
  filter = "all";
  $("search").value = "";
  if (initialized) render();
  window.scrollTo(0, 0);
}

function openProfile(id) {
  if (id === selfId) navigate("profile");
  else navigate("category", id);
}

function rootOf(note) {
  let current = note;
  while (notes.has(current.parentId)) current = notes.get(current.parentId);
  return current;
}

function fail(error, area) {
  const message = error?.name === "QuotaExceededError"
    ? "Tarayıcı depolama alanı doldu. Biraz yer açıp tekrar dene."
    : error?.message ?? "İşlem tamamlanamadı.";
  if (area) {
    $(area).textContent = message;
    $(area).hidden = false;
  } else {
    toast(message);
  }
}

function toast(message, undo) {
  clearTimeout(toastTimeout);
  undoAction = undo;
  $("toast-text").textContent = message;
  $("undo").hidden = !undo;
  $("toast").hidden = false;
  toastTimeout = setTimeout(() => {
    $("toast").hidden = true;
    undoAction = null;
  }, undo ? 9000 : 4200);
}

async function refresh(onBlocked) {
  const version = ++refreshVersion;
  const fresh = await readAll(onBlocked);
  if (version !== refreshVersion) return;
  notes = new Map(fresh.notes.map((note) => [note.id, note]));
  profiles = new Map([[selfId, defaultProfile], ...fresh.profiles.map((profile) => [profile.id, profile])]);
  categories = [...profiles.values()].filter((profile) => profile.id !== selfId)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  children = new Map();
  for (const note of notes.values()) {
    if (!note.parentId) continue;
    if (!children.has(note.parentId)) children.set(note.parentId, []);
    children.get(note.parentId).push(note);
  }
  for (const replies of children.values()) replies.sort((a, b) => a.createdAt - b.createdAt);
  initialized = true;
  render();
}

async function persist(name, apply, related) {
  await write(name, apply, related);
  channel?.postMessage("changed");
  await refresh().catch(fail);
}

function identityLink(profile) {
  const item = button(undefined, "identity-link", () => openProfile(profile.id));
  item.append(node("strong", null, profile.name), node("small", null, "@" + profile.handle));
  return item;
}

function categoryButton(profile) {
  const item = button(undefined, "category-link", () => openProfile(profile.id));
  const identity = node("span", "note-identity");
  identity.append(node("strong", null, profile.name), node("small", null, "@" + profile.handle));
  item.append(fillAvatar(node("span", "avatar"), profile), identity);
  return item;
}

function renderCategoryOptions(select, requested) {
  const selected = requested ?? select.value;
  const options = [profileFor(selfId), ...categories].map((profile) => {
    const option = node("option", null, profile.name + " (@" + profile.handle + ")");
    option.value = profile.id;
    return option;
  });
  select.replaceChildren(...options);
  select.value = profiles.has(selected) ? selected : selfId;
}

function renderIdentity() {
  const shown = currentProfile();
  const own = profileFor(selfId);
  for (const item of document.querySelectorAll("[data-name], [data-handle], [data-avatar]")) {
    const profile = item.closest("#profile") ? shown : item.closest("#composer") ? profileFor($("quick-category").value) : own;
    if (item.hasAttribute("data-avatar")) fillAvatar(item, profile);
    else item.textContent = item.hasAttribute("data-name") ? profile.name : "@" + profile.handle;
  }
  $("profile-bio").textContent = shown.bio;
  $("profile-bio").hidden = !shown.bio;
  $("profile-cover").replaceChildren(...(shown.banner ? [imageFor(shown.banner)] : []));
  $("profile-created").hidden = !Number.isFinite(shown.createdAt);
  if (!$("profile-created").hidden) {
    const date = new Date(shown.createdAt);
    const label = $("profile-created-date");
    label.dateTime = date.toISOString();
    label.textContent = profileDateFormat.format(date) + " tarihinde oluşturuldu";
  }
  $("profile-links").hidden = shown.id !== selfId;
  $("new-category").hidden = shown.id !== selfId;
  $("following").replaceChildren(node("strong", null, String(categories.length)), " Takip edilen");
  $("followers").replaceChildren(node("strong", null, String(categories.length)), " Takipçi");
}

function renderConnections() {
  const list = node("div", "category-list");
  list.append(...(categories.length ? categories.map(categoryButton) : [node("p", null, "Henüz kategori eklemedin.")]));
  $("connections").replaceChildren(list);
}

function render() {
  const { view, id } = route;
  const [title, description] = routeTitles[view];
  const inProfile = view === "profile" || (view === "category" && profiles.has(id));
  const shown = currentProfile();
  const noteTotal = inProfile ? [...notes.values()].filter((note) => !note.deleted && note.authorId === shown.id && !note.parentId).length : 0;
  $("main").dataset.view = view;
  $("main").classList.toggle("profile-view", inProfile);
  $("page-title").textContent = inProfile ? shown.name : title;
  $("page-description").textContent = inProfile ? noteTotal + " not" : description;
  $("page-description").hidden = !inProfile && !description;
  const feedHeader = $("feed-header");
  const feedAnchor = view === "notes" ? $("composer") : inProfile ? $("feed-search") : $("filter-summary");
  if (feedHeader.nextElementSibling !== feedAnchor) feedAnchor.before(feedHeader);
  $("composer").hidden = view !== "notes";
  $("profile").hidden = !inProfile;
  const connectionView = view === "following" || view === "followers";
  $("connections").hidden = !connectionView;
  $("back-to-profile").hidden = !connectionView;
  $("back-to-notes").hidden = view !== "thread";
  $("feed-header").hidden = connectionView;
  $("feed").hidden = connectionView;
  if (connectionView) renderConnections();
  for (const nav of document.querySelectorAll(".nav [data-view]")) {
    const activeView = ["category", "following", "followers"].includes(view) ? "profile" : view;
    if (nav.dataset.view === activeView) nav.setAttribute("aria-current", "page");
    else nav.removeAttribute("aria-current");
  }
  renderCategoryOptions($("quick-category"));
  if ($("note-dialog").open || replyParent) {
    renderCategoryOptions($("note-category"));
    if ($("note-dialog").open) renderNoteIdentity();
  }
  renderIdentity();
  renderFeed();
}

function makeChip(value) {
  const item = button("#" + value, "chip", () => {
    if (!["notes", "saved", "profile", "category"].includes(route.view)) navigate("notes");
    tag = tag === value ? "" : value;
    renderFeed();
  });
  item.setAttribute("aria-pressed", String(tag === value));
  return item;
}

function renderTags() {
  const tags = new Set();
  for (const note of notes.values()) {
    if (note.deleted) continue;
    for (const value of note.tags) tags.add(value);
  }
  if (tag && !tags.has(tag)) tag = "";
  const sorted = [...tags].sort((a, b) => a.localeCompare(b, "tr"));
  $("tag-list").replaceChildren(...(sorted.length
    ? sorted.map(makeChip) : [node("p", null, "Bir nota etiket eklediğinde burada görünür.")]));
}

function listNotes() {
  const { view, id } = route;
  if (view === "thread") {
    const focus = notes.get(id);
    const root = focus && rootOf(focus);
    return root && hasVisibleNotes(root) ? [root] : [];
  }
  const term = normalize(query.trim());
  const inProfile = view === "profile" || view === "category";
  const useAllThreads = view === "notes" && !term && !tag && filter === "all";
  return [...notes.values()].filter((note) => {
    if (useAllThreads) return !notes.has(note.parentId) && hasVisibleNotes(note);
    if (note.deleted) return false;
    if (view === "saved" && !note.saved) return false;
    if (view === "profile" && note.authorId !== selfId) return false;
    if (view === "category" && note.authorId !== id) return false;
    if (filter === "pinned" && !note.pinned) return false;
    if (inProfile && filter === "all" && note.parentId) return false;
    if (inProfile && filter === "replies" && !note.parentId) return false;
    if (inProfile && filter === "media" && !note.images.length) return false;
    if (tag && !note.tags.includes(tag)) return false;
    const author = profileFor(note.authorId);
    return !term || normalize([note.content, ...note.tags, author.name, "@" + author.handle].join(" ")).includes(term);
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt);
}

function descendants(note) {
  const ordered = [];
  const pending = [...(children.get(note.id) ?? [])].reverse();
  while (pending.length) {
    const reply = pending.pop();
    ordered.push(reply);
    const replies = children.get(reply.id) ?? [];
    for (let i = replies.length - 1; i >= 0; i--) pending.push(replies[i]);
  }
  return ordered;
}

function hasVisibleNotes(note) {
  return !note.deleted || descendants(note).some((reply) => !reply.deleted);
}

function renderFeed() {
  const { view } = route;
  renderTags();
  const focused = ["thread", "following", "followers"].includes(view);
  const entries = listNotes();
  const showReplies = view === "thread" || (view === "notes" && !query.trim() && !tag && filter === "all");
  const activeInput = noteEditor.contains(document.activeElement) ? document.activeElement : null;
  const inProfile = view === "profile" || view === "category";
  if (replyParent) $("note-dialog").append(noteEditor);
  $("feed").replaceChildren();
  for (const item of document.querySelectorAll("[data-filter]")) {
    item.setAttribute("aria-pressed", String(item.dataset.filter === filter));
  }
  $("feed-filters").hidden = focused || inProfile;
  $("profile-filters").hidden = !inProfile;
  $("note-count").textContent = focused || inProfile ? "" : entries.length + " not";
  $("filter-summary").hidden = focused || (!tag && !query.trim());
  $("filter-summary").textContent = [tag && "#" + tag, query.trim() && "Arama: " + query.trim()].filter(Boolean).join(" · ");
  if (view === "following" || view === "followers") {
    cleanImages();
    return;
  }
  if (entries.length) {
    for (const entry of entries) {
      if (showReplies) $("feed").append(threadCard(entry));
      else $("feed").append(noteCard(entry));
    }
  } else {
    const empty = node("div", "empty");
    const filtering = Boolean(tag || query.trim() || filter === "pinned");
    const missing = view === "thread" || (view === "category" && !profiles.has(route.id));
    const title = filtering ? "Eşleşen not bulunamadı"
      : missing ? "Bu kayıt bulunamadı" : view === "saved" ? "Henüz yer imi yok"
      : filter === "replies" ? "Henüz yanıt yok" : filter === "media" ? "Henüz görsel yok" : "Henüz not yok";
    empty.append(node("h2", null, title));
    if (!filtering && view === "saved") {
      empty.append(node("p", null, "Bir notu yer imlerine eklediğinde burada görünür."));
    }
    $("feed").append(empty);
  }
  if (replyParent && mountReplyEditor()) activeInput?.focus({ preventScroll: true });
  cleanImages();
}

function threadCard(root) {
  const group = node("div", "thread-card");
  group.append(noteCard(root));
  const replies = descendants(root).filter(hasVisibleNotes);
  if (replies.length) {
    const container = node("div", "thread-replies");
    for (const reply of replies) container.append(noteCard(reply));
    group.append(container);
  }
  return group;
}

function noteCard(note) {
  const article = node("article", "note");
  article.id = "note-" + note.id;
  if (note.id === route.id && route.view === "thread") article.classList.add("focused-note");
  if (note.deleted) {
    article.append(node("p", "reply-to", "Bu not silindi."));
    return article;
  }

  const author = profileFor(note.authorId);
  const body = node("div", "note-body");
  article.append(fillAvatar(node("span", "avatar"), author), body);
  const header = node("header", "note-header");
  const identity = node("div", "note-identity");
  identity.append(identityLink(author));
  const date = node("div", "note-time");
  const time = node("time", null, dateFormat.format(note.createdAt));
  time.dateTime = new Date(note.createdAt).toISOString();
  date.append(time);
  if (note.editedAt) date.append(node("span", "edited-label", "Düzenlendi"));
  header.append(identity, date);
  body.append(header);

  if (note.parentId && notes.has(note.parentId)) {
    const parent = notes.get(note.parentId);
    const parentName = "@" + profileFor(parent.authorId).handle;
    const context = node("p", "reply-to");
    context.append(button(parentName + " adlı profile yanıt", "identity-link", () => openThread(parent)));
    body.append(context);
  }
  if (note.content) body.append(node("p", "note-text", note.content));
  if (note.images.length) {
    const attachmentList = node("div", "attachments");
    for (const image of note.images) {
      const figure = node("div", "attachment");
      const show = button(undefined, "image-open", () => openImage(image));
      show.setAttribute("aria-label", "Görseli büyüt");
      const img = imageFor(image, "Not görseli");
      img.loading = "lazy";
      show.append(img);
      figure.append(show);
      attachmentList.append(figure);
    }
    body.append(attachmentList);
  }
  if (note.tags.length) {
    const labels = node("div", "note-tags");
    labels.append(...note.tags.map(makeChip));
    body.append(labels);
  }

  const actions = node("div", "note-actions");
  const reply = iconButton("Yanıtla", "reply", () => openNoteEditor({ parent: note }));
  reply.setAttribute("aria-expanded", "false");
  reply.setAttribute("aria-controls", "note-form");
  reply.classList.add("reply-action");
  reply.append(node("span", null, "Yanıtla"));
  actions.append(reply);
  const visibleReplies = descendants(note).filter((child) => !child.deleted).length;
  if (visibleReplies) actions.append(button(visibleReplies + " yanıt", "filter", () => openThread(note)));
  actions.append(
    iconButton(note.pinned ? "Sabitlemeyi kaldır" : "Sabitle", "pin", () => toggleNote(note, "pinned"), note.pinned),
    iconButton(note.saved ? "Yer iminden kaldır" : "Yer imine ekle", "bookmark", () => toggleNote(note, "saved"), note.saved),
  );
  const menu = node("details", "note-menu");
  const trigger = node("summary", "icon-button");
  trigger.setAttribute("aria-label", "Not işlemleri");
  trigger.title = "Not işlemleri";
  trigger.textContent = "⋯";
  const menuItems = node("div", "note-menu-items");
  const edit = button("Düzenle", "menu-action", () => {
    menu.open = false;
    openNoteEditor({ note });
  });
  const remove = button("Sil", "menu-action", () => {
    menu.open = false;
    deleteNote(note);
  });
  menuItems.append(edit, remove);
  menu.append(trigger, menuItems);
  actions.append(menu);
  body.append(actions);
  return article;
}

function openThread(note) {
  navigate("thread", note.id);
  $("note-" + note.id)?.scrollIntoView({ block: "nearest" });
}

function openImage(blob) {
  $("full-image").src = imageFor(blob).src;
  $("image-dialog").showModal();
}

function parseTags(value) {
  return [...new Set(value.split(",").map((part) => part.trim().replace(/^#+/, "").trim()).filter(Boolean))];
}

function validImage(file) {
  const types = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];
  if (!types.includes(file.type)) throw new Error("Bir PNG, JPEG, WebP, GIF veya AVIF görseli seç.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Her görsel en fazla 20 MB olabilir.");
  return file;
}

const forms = {
  quick: { get images() { return quickUploads; }, set images(value) { quickUploads = value; }, text: $("quick-text") },
  note: { get images() { return noteUploads; }, set images(value) { noteUploads = value; }, text: $("note-text") },
};

function updateSave(prefix) {
  const { text, images: attachments } = forms[prefix];
  $(prefix + "-save").disabled = (prefix === "note" ? savingEditor : savingQuick) || (!text.value.trim() && !attachments.length);
}

function renderUploads(prefix) {
  const state = forms[prefix];
  const preview = $(prefix + "-attachments");
  preview.hidden = !state.images.length;
  preview.replaceChildren();
  state.images.forEach((blob, index) => {
    const figure = node("div", "attachment attachment-preview");
    figure.append(imageFor(blob, "Eklenecek görsel"), iconButton("Görseli kaldır", "close", () => {
      state.images.splice(index, 1);
      renderUploads(prefix);
      if (prefix === "note") autosaveDraft();
    }));
    preview.append(figure);
  });
  updateSave(prefix);
  cleanImages();
}

for (const prefix of Object.keys(forms)) {
  const input = $(prefix + "-files");
  forms[prefix].text.addEventListener("input", () => updateSave(prefix));
  $(prefix + "-upload").addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    try {
      const added = Array.from(input.files, validImage);
      if (forms[prefix].images.length + added.length > 4) throw new Error("Bir nota en fazla dört görsel ekleyebilirsin.");
      forms[prefix].images.push(...added);
      $(prefix + "-error").hidden = true;
      renderUploads(prefix);
      if (prefix === "note") autosaveDraft();
    } catch (error) {
      fail(error, prefix + "-error");
    }
    input.value = "";
  });
}

function renderNoteIdentity() {
  const select = $("note-category");
  const selected = profileFor(select.value);
  fillAvatar($("note-avatar"), selected);
  $("note-identity-trigger").setAttribute("aria-label", "Not kategorisini seç. Seçili: " + selected.name);
  const choices = [...select.options].map((option) => {
    const profile = profileFor(option.value);
    const choice = button(undefined, "category-link", () => {
      select.value = profile.id;
      $("note-identities").open = false;
      renderNoteIdentity();
      $("note-identity-trigger").focus();
      autosaveDraft();
    });
    choice.setAttribute("aria-pressed", String(profile.id === selected.id));
    const identity = node("span", "note-identity");
    identity.append(node("strong", null, profile.name), node("small", null, "@" + profile.handle));
    choice.append(fillAvatar(node("span", "avatar"), profile), identity);
    return choice;
  });
  $("note-identity-list").replaceChildren(...choices);
  cleanImages();
}

function setNoteTagsVisible(visible) {
  $("note-tags").hidden = !visible;
  $("note-tag").setAttribute("aria-expanded", String(visible));
}

function savedDraftImageIds(draft) {
  return draft.imageIds ?? draft.images.map((_, index) => draft.id + ":" + index);
}

function currentDraft() {
  const imageIds = noteUploads.map((image) => {
    if (!draftImageIds.has(image)) draftImageIds.set(image, crypto.randomUUID());
    return draftImageIds.get(image);
  });
  return {
    id: activeDraftId,
    content: $("note-text").value,
    tags: $("note-tags").value,
    images: [...noteUploads],
    imageIds,
    authorId: $("note-category").value,
    updatedAt: Date.now(),
  };
}

function hasDraftContent(draft) {
  return Boolean(draft.content.trim() || draft.tags.trim() || draft.images.length);
}

function clearDraftRecovery(id, snapshot) {
  try {
    const key = draftRecoveryPrefix + id;
    if (snapshot === undefined || localStorage.getItem(key) === snapshot) localStorage.removeItem(key);
  } catch {}
}

async function storeDraft(draft) {
  const { images, ...fields } = draft;
  const snapshot = JSON.stringify(fields);
  try { localStorage.setItem(draftRecoveryPrefix + draft.id, snapshot); } catch {}
  await write("drafts", (store, transaction) => {
    if (!hasDraftContent(draft)) {
      store.delete(draft.id);
      return;
    }
    const published = transaction.objectStore("notes").getKey(draft.id);
    published.onsuccess = () => {
      if (published.result === undefined) store.put(draft);
    };
  }, ["notes"]);
  clearDraftRecovery(draft.id, snapshot);
}

async function availableDrafts() {
  const recovery = [];
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith(draftRecoveryPrefix)) recovery.push(JSON.parse(localStorage.getItem(key)));
    }
  } catch {}
  const drafts = new Map((await readDrafts()).map((draft) => [draft.id, draft]));
  for (const snapshot of recovery) {
    if (!snapshot?.id || typeof snapshot.content !== "string" || typeof snapshot.tags !== "string") continue;
    if (notes.has(snapshot.id)) {
      clearDraftRecovery(snapshot.id);
      continue;
    }
    const stored = drafts.get(snapshot.id);
    if (stored && stored.updatedAt > snapshot.updatedAt) continue;
    const { imageCount, imageIds, ...fields } = snapshot;
    const storedImages = stored?.images ?? [];
    const storedIds = stored && savedDraftImageIds(stored);
    let images = storedImages;
    let recoveredIds = storedIds;
    if (Array.isArray(imageIds) && storedIds) {
      const imagesById = new Map(storedIds.map((id, index) => [id, storedImages[index]]));
      recoveredIds = imageIds.filter((id) => imagesById.has(id));
      images = recoveredIds.map((id) => imagesById.get(id));
    } else if (imageIds?.length === 0 || imageCount === 0) {
      images = [];
      recoveredIds = [];
    }
    const draft = { ...fields, images, imageIds: recoveredIds };
    if (hasDraftContent(draft)) drafts.set(draft.id, draft);
    else drafts.delete(draft.id);
  }
  return [...drafts.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

function autosaveDraft() {
  if (!activeDraftId || savingEditor) return;
  const draft = currentDraft();
  pendingDraftWrite = storeDraft(draft).catch((error) => {
    if (activeDraftId === draft.id) fail(error, "note-error");
  });
}

function requestEditorClose() {
  if (savingEditor) return;
  if (activeDraftId && hasDraftContent(currentDraft())) {
    $("draft-confirm-error").hidden = true;
    $("draft-confirm").showModal();
  } else {
    closeNoteEditor({ restoreFocus: true });
  }
}

async function finishDraft(keep) {
  if (savingEditor || !activeDraftId) return;
  savingEditor = true;
  $("draft-confirm-error").hidden = true;
  try {
    if (keep) await storeDraft(currentDraft());
    else {
      await write("drafts", (store) => store.delete(activeDraftId));
      clearDraftRecovery(activeDraftId);
    }
    $("draft-confirm").close();
    closeNoteEditor();
    if (keep) toast("Taslak kaydedildi.");
  } catch (error) {
    fail(error, "draft-confirm-error");
  } finally {
    savingEditor = false;
    updateSave("note");
  }
}

async function openDraftList() {
  if (savingEditor || $("drafts-dialog").open) return;
  savingEditor = true;
  const list = $("draft-list");
  $("draft-list-error").hidden = true;
  list.replaceChildren(node("p", null, "Taslaklar yükleniyor…"));
  $("drafts-dialog").showModal();
  try {
    await pendingDraftWrite;
    const drafts = await availableDrafts();
    const items = drafts.map((draft) => {
      const preview = draft.content.trim() || draft.tags.trim() || (draft.images.length + " görsel");
      const item = button(undefined, "draft-entry", () => {
        $("drafts-dialog").close();
        $("profile-drawer").close();
        openNoteEditor({ draft });
      });
      item.append(
        node("strong", null, preview),
        node("small", null, profileFor(draft.authorId).name + " · " + dateFormat.format(draft.updatedAt)),
      );
      return item;
    });
    list.replaceChildren(...(items.length ? items : [node("p", null, "Henüz taslak yok.")]));
  } catch (error) {
    list.replaceChildren();
    fail(error, "draft-list-error");
  } finally {
    savingEditor = false;
    updateSave("note");
  }
}

function mountReplyEditor() {
  const article = $("note-" + replyParent.id);
  const trigger = article?.querySelector(".reply-action");
  if (!trigger) return false;
  article.querySelector(".note-body").append(noteEditor);
  trigger.setAttribute("aria-expanded", "true");
  return true;
}

function closeNoteEditor({ restoreFocus = false } = {}) {
  const trigger = replyParent && $("note-" + replyParent.id)?.querySelector(".reply-action");
  trigger?.setAttribute("aria-expanded", "false");
  $("note-dialog").append(noteEditor);
  $("note-dialog").close();
  noteEditor.classList.remove("inline-reply");
  editingNote = null;
  replyParent = null;
  activeDraftId = null;
  pendingDraftWrite = null;
  $("note-identities").open = false;
  noteUploads = [];
  renderUploads("note");
  if (restoreFocus) trigger?.focus();
}

function openNoteEditor({ note = null, parent = null, draft = null } = {}) {
  if (savingEditor) return;
  if (replyParent && parent?.id === replyParent.id) {
    $("note-text").focus();
    return;
  }
  if (replyParent) {
    if (hasDraftContent(currentDraft()) && !window.confirm("Kaydedilmemiş yanıt silinsin mi?")) return;
    closeNoteEditor();
  }
  editingNote = note;
  replyParent = parent;
  activeDraftId = note || parent ? null : (draft?.id ?? crypto.randomUUID());
  pendingDraftWrite = null;
  $("show-drafts").hidden = Boolean(note || parent);
  $("note-identities").open = false;
  $("note-dialog-title").textContent = note ? "Notu düzenle" : parent ? "Yanıt yaz" : "Yeni not";
  $("note-text").setAttribute("aria-label", parent ? "Yanıt" : "Not metni");
  $("note-text").rows = parent ? 2 : 5;
  $("note-text").placeholder = parent ? "Yanıtını yaz" : "Aklından ne geçiyor?";
  $("note-text").value = draft?.content ?? note?.content ?? "";
  $("note-tags").value = draft?.tags ?? note?.tags.join(", ") ?? "";
  setNoteTagsVisible(Boolean($("note-tags").value));
  $("note-error").hidden = true;
  noteUploads = [...(draft?.images ?? note?.images ?? [])];
  if (draft) {
    const ids = savedDraftImageIds(draft);
    noteUploads.forEach((image, index) => draftImageIds.set(image, ids[index]));
  }
  const selected = draft?.authorId ?? note?.authorId ?? (route.view === "category" ? currentProfile().id : $("quick-category").value);
  renderCategoryOptions($("note-category"), selected);
  renderUploads("note");
  if (parent) {
    noteEditor.classList.add("inline-reply");
    $("note-dialog-title").textContent = "@" + profileFor(parent.authorId).handle + " adlı profile yanıt";
    if (!mountReplyEditor()) {
      closeNoteEditor();
      return;
    }
  } else {
    renderNoteIdentity();
    if (!$("note-dialog").open) $("note-dialog").showModal();
  }
  $("note-text").focus();
}

async function saveNote(event, prefix) {
  event.preventDefault();
  const { images: attachments, text } = forms[prefix];
  const content = text.value.trim();
  if (!content && !attachments.length) return;
  const originalRoute = route;
  const editing = prefix === "note" ? editingNote : null;
  const draftId = prefix === "note" ? activeDraftId : null;
  const parentId = prefix === "note" ? (replyParent?.id ?? editing?.parentId ?? null) : null;
  const changes = {
    content,
    images: [...attachments],
    tags: parseTags($(prefix + "-tags").value),
    authorId: $(prefix + "-category").value,
  };
  const save = $(prefix + "-save");
  if (save.disabled || (prefix === "note" ? savingEditor : savingQuick)) return;
  save.disabled = true;
  const form = event.currentTarget;
  form.inert = true;
  if (prefix === "note") savingEditor = true;
  else savingQuick = true;
  $(prefix + "-error").hidden = true;
  try {
    if (editing) {
      await changeNote(editing.id, (current) => {
        if ((current.editRevision ?? current.editedAt) !== (editing.editRevision ?? editing.editedAt)) {
          throw new Error("Bu not başka bir sekmede değiştirildi. Son sürümü açıp tekrar düzenle.");
        }
        return { ...current, ...changes, editedAt: Date.now(), editRevision: crypto.randomUUID() };
      });
    } else {
      const newNote = { id: draftId ?? crypto.randomUUID(), ...changes, parentId, createdAt: Date.now(), pinned: false, saved: false };
      await persist("notes", (store, transaction) => {
        store.add(newNote);
        if (draftId) transaction.objectStore("drafts").delete(draftId);
      }, draftId ? ["drafts"] : []);
      if (draftId) clearDraftRecovery(draftId);
    }
    if (prefix === "note") closeNoteEditor({ restoreFocus: Boolean(parentId) && !editing });
    else {
      $("composer").reset();
      $("quick-category").value = changes.authorId;
      quickUploads = [];
      renderIdentity();
      renderUploads("quick");
    }
    if (parentId && !editing && route === originalRoute && notes.has(parentId) && route.view !== "thread" &&
        (route.view !== "notes" || filter !== "all" || tag || query.trim())) {
      openThread(notes.get(parentId));
    }
    toast(editing ? "Not güncellendi." : parentId ? "Yanıt kaydedildi." : "Not kaydedildi.");
  } catch (error) {
    fail(error, prefix + "-error");
  } finally {
    form.inert = false;
    if (prefix === "note") savingEditor = false;
    else savingQuick = false;
    updateSave(prefix);
  }
}

async function changeNote(id, apply, allowDeleted = false) {
  let failure;
  try {
    await persist("notes", (store, transaction) => {
      const request = store.get(id);
      request.onsuccess = () => {
        try {
          const current = request.result;
          if (!current || (current.deleted && !allowDeleted)) throw new Error("Bu not artık kullanılamıyor.");
          store.put(apply(current));
        } catch (error) {
          failure = error;
          transaction.abort();
        }
      };
    });
  } catch (error) {
    throw failure ?? error;
  }
}

async function toggleNote(note, property) {
  try {
    await changeNote(note.id, (current) => ({ ...current, [property]: !note[property] }));
  } catch (error) {
    fail(error);
  }
}

async function deleteNote(note) {
  let removed;
  const deletionId = crypto.randomUUID();
  try {
    await changeNote(note.id, (current) => {
      removed = current;
      return { id: current.id, parentId: current.parentId, authorId: current.authorId, createdAt: current.createdAt, deleted: true, deletionId };
    });
    toast("Not silindi.", () => changeNote(note.id, (current) => {
      if (current.deletionId !== deletionId) throw new Error("Bu silme işlemi artık geri alınamıyor.");
      return removed;
    }, true));
  } catch (error) {
    fail(error);
  }
}

function suggestHandle(value) {
  return value.trim().replace(/[^\p{L}\p{N}_]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 40);
}

function openProfileEditor(profile) {
  editingProfile = profile;
  autoHandle = !profile;
  photo = profile?.photo ?? null;
  banner = profile?.banner ?? null;
  $("profile-dialog-title").textContent = profile ? "Profili düzenle" : "Yeni kategori";
  $("profile-name").value = profile?.name ?? "";
  $("profile-handle").value = profile?.handle ?? "";
  $("profile-description").value = profile?.bio ?? "";
  $("profile-error").hidden = true;
  $("profile-photo").value = "";
  $("profile-banner").value = "";
  $("clear-photo").hidden = !photo;
  $("clear-banner").hidden = !banner;
  $("profile-dialog").showModal();
}

function configureProfileImage(id, clear, setImage) {
  const input = $(id);
  const control = $(clear);
  input.addEventListener("change", () => {
    if (!input.files.length) return;
    try {
      setImage(validImage(input.files[0]));
      control.hidden = false;
      $("profile-error").hidden = true;
    } catch (error) {
      input.value = "";
      fail(error, "profile-error");
    }
  });
  control.addEventListener("click", () => {
    setImage(null);
    input.value = "";
    control.hidden = true;
  });
}

configureProfileImage("profile-photo", "clear-photo", (value) => { photo = value; });
configureProfileImage("profile-banner", "clear-banner", (value) => { banner = value; });

async function saveProfile(event) {
  event.preventDefault();
  const name = $("profile-name").value.trim();
  const handle = $("profile-handle").value.trim().replace(/^@/, "");
  if (!name || !/^[\p{L}\p{N}_]+$/u.test(handle)) {
    fail(new Error("Bir profil adı gir. Kullanıcı adında harf, sayı ve alt çizgi kullanabilirsin."), "profile-error");
    return;
  }
  const original = editingProfile;
  const profile = {
    id: original?.id ?? crypto.randomUUID(),
    name, handle, photo, banner, bio: $("profile-description").value.trim(),
  };
  const form = $("profile-form");
  if (form.inert) return;
  form.inert = true;
  let failure;
  try {
    await persist("profiles", (store, transaction) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const existing = request.result;
        const saved = existing.find((item) => item.id === profile.id);
        if (!existing.some((item) => item.id === selfId)) existing.push(defaultProfile);
        if (saved?.editRevision !== original?.editRevision) {
          failure = new Error("Bu profil başka bir sekmede değiştirildi. Son sürümü açıp tekrar düzenle.");
        } else if (existing.some((item) => item.id !== profile.id && normalize(item.handle) === normalize(handle))) {
          failure = new Error("Bu kullanıcı adı zaten kullanılıyor.");
        }
        if (failure) {
          transaction.abort();
          return;
        }
        profile.createdAt = saved ? saved.createdAt : Date.now();
        profile.editRevision = crypto.randomUUID();
        store.put(profile);
      };
    });
    $("profile-dialog").close();
    openProfile(profile.id);
    toast(original ? "Profil kaydedildi." : "Kategori eklendi.");
  } catch (error) {
    fail(failure ?? error, "profile-error");
  } finally {
    form.inert = false;
  }
}

function renderTheme() {
  let preference = sessionTheme;
  try { preference = localStorage.getItem("tema") ?? preference; } catch {}
  const theme = preference === "light" || preference === "dark" ? preference : preferredTheme.matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#000000" : "#ffffff";
  $("theme-label").textContent = theme === "light" ? "Koyu tema" : "Açık tema";
  $("theme").firstElementChild.innerHTML = icon(theme === "light" ? "moon" : "sun");
  $("mobile-theme").firstElementChild.innerHTML = icon(theme === "light" ? "moon" : "sun");
  $("mobile-theme-label").textContent = $("theme-label").textContent;
}

function toggleTheme() {
  sessionTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  try { localStorage.setItem("tema", sessionTheme); } catch {}
  renderTheme();
}

preferredTheme.addEventListener("change", renderTheme);
window.addEventListener("storage", (event) => {
  if (!event.key || event.key === "tema") renderTheme();
});
renderTheme();

for (const control of document.querySelectorAll("[data-view]")) {
  control.addEventListener("click", () => {
    if ($("profile-drawer").open) $("profile-drawer").close();
    navigate(control.dataset.view);
  });
}
$("open-drawer").addEventListener("click", () => $("profile-drawer").showModal());
$("profile-drawer").addEventListener("click", (event) => {
  if (event.target === $("profile-drawer")) {
    const rect = $("profile-drawer").getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right) $("profile-drawer").close();
  }
});
$("show-drafts").addEventListener("click", openDraftList);
$("drawer-drafts").addEventListener("click", openDraftList);
$("keep-draft").addEventListener("click", () => finishDraft(true));
$("discard-draft").addEventListener("click", () => finishDraft(false));
for (const field of ["note-text", "note-tags"]) $(field).addEventListener("input", autosaveDraft);
$("note-tag").addEventListener("click", () => {
  const show = $("note-tags").hidden;
  setNoteTagsVisible(show);
  if (show) $("note-tags").focus();
});
const viewport = window.visualViewport;
if (viewport) {
  const updateEditorViewport = () => {
    $("note-dialog").style.setProperty("--editor-height", viewport.height + "px");
    $("note-dialog").style.setProperty("--editor-top", viewport.offsetTop + "px");
  };
  viewport.addEventListener("resize", updateEditorViewport);
  viewport.addEventListener("scroll", updateEditorViewport);
  updateEditorViewport();
}
$("new-note").addEventListener("click", () => openNoteEditor());
$("new-category").addEventListener("click", () => openProfileEditor(null));
for (const control of document.querySelectorAll("[data-close]")) {
  control.addEventListener("click", () => {
    if (!noteEditor.contains(control)) control.closest("dialog").close();
    else requestEditorClose();
  });
}
$("note-dialog").addEventListener("cancel", (event) => {
  event.preventDefault();
  if ($("note-identities").open) {
    $("note-identities").open = false;
    $("note-identity-trigger").focus();
  } else {
    requestEditorClose();
  }
});
$("profile-dialog").addEventListener("cancel", (event) => {
  if ($("profile-form").inert) event.preventDefault();
});
$("draft-confirm").addEventListener("cancel", (event) => {
  if (savingEditor) event.preventDefault();
});
noteEditor.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && replyParent && !savingEditor) closeNoteEditor({ restoreFocus: true });
});
document.addEventListener("click", (event) => {
  if (!$("note-identities").contains(event.target)) $("note-identities").open = false;
  for (const menu of document.querySelectorAll(".note-menu[open]")) {
    if (!menu.contains(event.target)) menu.open = false;
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const menu = event.target.closest(".note-menu[open]");
  if (!menu) return;
  menu.open = false;
  menu.querySelector("summary").focus();
});
for (const control of document.querySelectorAll("[data-filter]")) {
  control.addEventListener("click", () => {
    filter = control.dataset.filter;
    renderFeed();
  });
}
$("quick-category").addEventListener("change", () => { renderIdentity(); cleanImages(); });
$("composer").addEventListener("submit", (event) => saveNote(event, "quick"));
$("note-form").addEventListener("submit", (event) => saveNote(event, "note"));
$("profile-form").addEventListener("submit", saveProfile);
$("profile-back").addEventListener("click", () => navigate("notes"));
$("edit-profile").addEventListener("click", () => openProfileEditor(currentProfile()));
$("following").addEventListener("click", () => navigate("following"));
$("followers").addEventListener("click", () => navigate("followers"));
$("back-to-profile").addEventListener("click", () => navigate("profile"));
$("back-to-notes").addEventListener("click", () => navigate("notes"));
$("theme").addEventListener("click", toggleTheme);
$("mobile-theme").addEventListener("click", toggleTheme);
$("search").addEventListener("input", () => {
  const term = $("search").value;
  if (["thread", "following", "followers"].includes(route.view)) navigate("notes");
  query = term;
  $("search").value = term;
  renderFeed();
});
$("quick-tag").addEventListener("click", () => {
  const input = $("quick-tags");
  input.hidden = !input.hidden;
  $("quick-tag").setAttribute("aria-expanded", String(!input.hidden));
  if (!input.hidden) input.focus();
});
$("profile-name").addEventListener("input", () => {
  if (autoHandle) $("profile-handle").value = suggestHandle($("profile-name").value);
});
$("profile-handle").addEventListener("input", () => { autoHandle = false; });
$("undo").addEventListener("click", async () => {
  const action = undoAction;
  if (!action) return;
  undoAction = null;
  try {
    await action();
    toast("Not geri alındı.");
  } catch (error) {
    fail(error);
  }
});
$("image-dialog").addEventListener("close", () => {
  $("full-image").removeAttribute("src");
  cleanImages();
});
window.addEventListener("popstate", applyRoute);
window.addEventListener("hashchange", applyRoute);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) refresh().catch(fail);
});
channel?.addEventListener("message", () => refresh().catch(fail));
route = readRoute();
refresh(() => {
  $("feed").replaceChildren(node("p", "loading", "Güncellemeyi tamamlamak için X Notes’un diğer sekmelerini kapat."));
  $("feed").setAttribute("aria-busy", "false");
}).catch((error) => {
  $("feed").replaceChildren(node("p", "form-error", "Tarayıcı depolaması açılamadı. Bu tarayıcıda site depolamasına izin verip sayfayı yenile."));
  fail(error);
}).finally(() => $("feed").setAttribute("aria-busy", "false"));
