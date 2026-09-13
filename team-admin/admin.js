const MEMBERS = [
  { id:"hod-faculty", name:"Dr. Animesh Tayal", role:"Head of Department (HOD)" },
  { id:"sarang-chakole", name:"Sarang Chakole", role:"Group Leader" },
  { id:"technical-advisor", name:"Prof. Sweta Bokade", role:"Technical Advisor" },
  { id:"faiz-shaikh", name:"Faiz Shaikh", role:"Head · Technical" },
  { id:"neeraj-khapre", name:"Neeraj Khapre", role:"Co-Head · Technical" },
  { id:"devanshu-kindarlaey", name:"Devanshu Kindarlaey", role:"Volunteer · Technical" },
  { id:"nivedita-nandurkar", name:"Nivedita Nandurkar", role:"Volunteer · Technical" },
  { id:"tanushree-saundarkar", name:"Tanushree Saundarkar", role:"Head · Design & Content" },
  { id:"sankalp-kadse", name:"Sankalp Kadse", role:"Design Co-Head" },
  { id:"anshul-motghare", name:"Anshul Motghare", role:"Content Co-Head" },
  { id:"pranav-vispute", name:"Pranav Vispute", role:"Head · Operations" },
  { id:"isha-dhok", name:"Isha Dhok", role:"Co-Head · Operations" },
  { id:"nutan-bhoyar", name:"Nutan Bhoyar", role:"Volunteer · Operations" },
  { id:"krutika-dhavde", name:"Krutika Dhavde", role:"Volunteer · Operations" },
  { id:"jiya-sathawane", name:"Jiya Sathawane", role:"Head · Marketing & PR" },
  { id:"anmol-chaubey", name:"Anmol Chaubey", role:"Co-Head · Marketing & PR" },
  { id:"vaishnavi-sathone", name:"Vaishnavi Sathone", role:"Volunteer · Marketing & PR" },
  { id:"gauri-sangewar", name:"Gauri Sangewar", role:"Volunteer · Marketing & PR" },
  { id:"areeba-qureshi", name:"Areeba Qureshi", role:"Head · Events" },
  { id:"vansh-lute", name:"Vansh Lute", role:"Co-Head · Events" },
  { id:"pushkar-meshram", name:"Pushkar Meshram", role:"Volunteer · Events" },
  { id:"shagun-harinkhede", name:"Shagun Harinkhede", role:"Volunteer · Events" }
];

const $ = (id) => document.getElementById(id);
const loginView = $("loginView");
const dashboardView = $("dashboardView");
const loginForm = $("loginForm");
const loginBtn = $("loginBtn");
const loginEmail = $("loginEmail");
const loginPassword = $("loginPassword");
const loginStatus = $("loginStatus");
const logoutBtn = $("logoutBtn");
const adminEmail = $("adminEmail");
const memberList = $("memberList");
const memberSearch = $("memberSearch");
const memberCount = $("memberCount");
const editorName = $("editorName");
const editorRole = $("editorRole");
const previewImg = $("previewImg");
const previewInitials = $("previewInitials");
const previewName = $("previewName");
const previewRole = $("previewRole");
const dropzone = $("dropzone");
const photoInput = $("photoInput");
const saveBtn = $("saveBtn");
const removeBtn = $("removeBtn");
const editorStatus = $("editorStatus");
const saveState = $("saveState");

let photos = {};
let selected = null;
let pendingPhoto = "";

function initials(name) {
  return String(name || "AWS").split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join("").toUpperCase();
}

function setStatus(el, message, type="") {
  el.textContent = message || "";
  el.className = "status" + (type ? " " + type : "");
}

function setAuthView(authenticated, email="") {
  loginView.hidden = authenticated;
  dashboardView.hidden = !authenticated;
  adminEmail.textContent = email || "—";
}

function showPreview(url) {
  if (url) {
    previewImg.src = url;
    previewImg.hidden = false;
    previewInitials.hidden = true;
  } else {
    previewImg.removeAttribute("src");
    previewImg.hidden = true;
    previewInitials.hidden = false;
    previewInitials.textContent = selected ? initials(selected.name) : "AWS";
  }
}

function renderMembers(filter="") {
  const q = filter.trim().toLowerCase();
  const filtered = MEMBERS.filter(m => !q || (m.name + " " + m.role).toLowerCase().includes(q));
  memberList.innerHTML = "";
  memberCount.textContent = String(filtered.length);

  filtered.forEach(member => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "member-item" + (selected?.id === member.id ? " active" : "");

    const thumb = document.createElement("span");
    thumb.className = "member-thumb";
    if (photos[member.id]) {
      const img = document.createElement("img");
      img.src = photos[member.id];
      img.alt = "";
      thumb.appendChild(img);
    } else {
      thumb.textContent = initials(member.name);
    }

    const meta = document.createElement("span");
    meta.className = "member-meta";
    const strong = document.createElement("strong");
    strong.textContent = member.name;
    const role = document.createElement("span");
    role.textContent = member.role;
    meta.append(strong, role);
    button.append(thumb, meta);
    button.addEventListener("click", () => selectMember(member));
    memberList.appendChild(button);
  });
}

function selectMember(member) {
  selected = member;
  pendingPhoto = "";
  editorName.textContent = member.name;
  editorRole.textContent = member.role;
  previewName.textContent = member.name;
  previewRole.textContent = member.role;
  showPreview(photos[member.id] || "");
  saveBtn.disabled = true;
  removeBtn.disabled = !photos[member.id];
  saveState.textContent = photos[member.id] ? "PHOTO LIVE" : "NO PHOTO";
  setStatus(editorStatus, "");
  renderMembers(memberSearch.value);
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("Please choose an image file."));
    if (file.size > 10 * 1024 * 1024) return reject(new Error("Please choose an image under 10 MB."));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Unsupported image."));
      image.onload = () => {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function chooseFile(file) {
  if (!selected) {
    setStatus(editorStatus, "Select a member first.", "error");
    return;
  }
  try {
    pendingPhoto = await compressImage(file);
    showPreview(pendingPhoto);
    saveBtn.disabled = false;
    saveState.textContent = "NEW PHOTO";
    setStatus(editorStatus, "Preview ready. Click Save photo to publish it.", "success");
  } catch (error) {
    setStatus(editorStatus, error.message || "Could not prepare image.", "error");
  }
}

async function loadPhotos() {
  const response = await fetch("/api/team-photos", { cache:"no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.error || "Could not load Team photos.");
  photos = data.photos || {};
  renderMembers();
  if (!selected && MEMBERS.length) selectMember(MEMBERS[0]);
}

async function checkSession() {
  try {
    const response = await fetch("/api/team-admin-auth", { cache:"no-store" });
    const data = await response.json().catch(() => ({}));
    if (data.authenticated) {
      setAuthView(true, data.email);
      await loadPhotos();
    } else {
      setAuthView(false);
    }
  } catch {
    setAuthView(false);
    setStatus(loginStatus, "Admin service is unavailable. Open this page from the Netlify site.", "error");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in…";
  setStatus(loginStatus, "");
  try {
    const response = await fetch("/api/team-admin-auth", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ email:loginEmail.value.trim(), password:loginPassword.value })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.error || "Sign in failed.");
    loginPassword.value = "";
    setAuthView(true, data.email);
    await loadPhotos();
  } catch (error) {
    setStatus(loginStatus, error.message || "Sign in failed.", "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign in securely";
  }
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/team-admin-auth", { method:"DELETE" }).catch(() => {});
  selected = null;
  photos = {};
  pendingPhoto = "";
  setAuthView(false);
});

memberSearch.addEventListener("input", () => renderMembers(memberSearch.value));

dropzone.addEventListener("click", () => photoInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    photoInput.click();
  }
});
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("drag");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag");
  chooseFile(e.dataTransfer.files?.[0]);
});
photoInput.addEventListener("change", () => chooseFile(photoInput.files?.[0]));

saveBtn.addEventListener("click", async () => {
  if (!selected || !pendingPhoto) return;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";
  setStatus(editorStatus, "");
  try {
    const response = await fetch("/api/team-photos", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ memberId:selected.id, photoData:pendingPhoto })
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      setAuthView(false);
      throw new Error("Your admin session expired. Sign in again.");
    }
    if (!response.ok || !data.success) throw new Error(data.error || "Could not save photo.");
    photos[selected.id] = data.photoUrl;
    pendingPhoto = "";
    showPreview(data.photoUrl);
    removeBtn.disabled = false;
    saveState.textContent = "PHOTO LIVE";
    renderMembers(memberSearch.value);
    setStatus(editorStatus, "Photo saved permanently. Visitors will see the new photo.", "success");
  } catch (error) {
    setStatus(editorStatus, error.message || "Could not save photo.", "error");
  } finally {
    saveBtn.textContent = "Save photo";
    saveBtn.disabled = !pendingPhoto;
  }
});

removeBtn.addEventListener("click", async () => {
  if (!selected || !photos[selected.id]) return;
  if (!confirm("Remove the current photo for " + selected.name + "?")) return;
  removeBtn.disabled = true;
  setStatus(editorStatus, "");
  try {
    const response = await fetch("/api/team-photos/" + encodeURIComponent(selected.id), { method:"DELETE" });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      setAuthView(false);
      throw new Error("Your admin session expired. Sign in again.");
    }
    if (!response.ok || !data.success) throw new Error(data.error || "Could not remove photo.");
    delete photos[selected.id];
    pendingPhoto = "";
    showPreview("");
    saveBtn.disabled = true;
    saveState.textContent = "NO PHOTO";
    renderMembers(memberSearch.value);
    setStatus(editorStatus, "Photo removed successfully.", "success");
  } catch (error) {
    setStatus(editorStatus, error.message || "Could not remove photo.", "error");
    removeBtn.disabled = !photos[selected?.id];
  }
});

if (location.hostname.endsWith("github.io")) {
  setStatus(loginStatus, "For security, use the Netlify Team Admin URL: https://aws-community-sbjit.netlify.app/team-admin/", "error");
}

checkSession();
