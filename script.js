const storageKey = "lesson-feedback-records";
const authKey = "lesson-feedback-authenticated";
const pagePassword = "wangjianbo";
const authForm = document.querySelector("#authForm");
const passwordInput = document.querySelector("#passwordInput");
const authError = document.querySelector("#authError");
const lockPage = document.querySelector("#lockPage");
const form = document.querySelector("#lessonForm");
const timeline = document.querySelector("#timeline");
const template = document.querySelector("#lessonTemplate");
const search = document.querySelector("#search");
const resetForm = document.querySelector("#resetForm");
const exportData = document.querySelector("#exportData");
const courseCount = document.querySelector("#courseCount");
const latestDate = document.querySelector("#latestDate");
const familyDialog = document.querySelector("#familyDialog");
const closeDialog = document.querySelector("#closeDialog");
const printReport = document.querySelector("#printReport");
const reportTitle = document.querySelector("#reportTitle");
const reportMeta = document.querySelector("#reportMeta");
const reportGrid = document.querySelector("#reportGrid");

let editingId = null;
const imageFields = ["contentImages", "homeworkImages"];
const maxImagesPerField = 6;
const maxImageFileSize = 10 * 1024 * 1024;
const maxImageSide = 1600;
let draftImages = {
  contentImages: [],
  homeworkImages: [],
};

const lessonNoOptions = [
  "第一课",
  "第二课",
  "第三课",
  "第四课",
  "第五课",
  "第六课",
  "第七课",
  "第八课",
  "第九课",
  "第十课",
  "第十一课",
  "第十二课",
  "第十三课",
  "第十四课",
  "第十五课",
  "第十六课",
  "第十七课",
  "第十八课",
  "第十九课",
  "第二十课",
  "第二十一课",
  "第二十二课",
  "第二十三课",
  "第二十四课",
  "第二十五课",
  "第二十六课",
  "第二十七课",
  "第二十八课",
  "第二十九课",
  "第三十课",
  "第三十一课",
  "第三十二课",
  "第三十三课",
  "第三十四课",
  "第三十五课",
  "第三十六课",
  "第三十七课",
  "第三十八课",
  "第三十九课",
  "第四十课",
];

function defaultLessonNo(index = 0) {
  return lessonNoOptions[index] || `第${index + 1}课`;
}

function normalizePassword(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

function unlockPage() {
  sessionStorage.setItem(authKey, "true");
  document.body.classList.remove("auth-locked");
  authError.textContent = "";
  passwordInput.value = "";
}

function lockFeedbackPage() {
  sessionStorage.removeItem(authKey);
  document.body.classList.add("auth-locked");
  passwordInput.focus();
}

if (sessionStorage.getItem(authKey) === "true") {
  document.body.classList.remove("auth-locked");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `lesson-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const sampleLessons = [
  {
    id: createId(),
    date: "2026-07-15",
    student: "张同学",
    lessonNo: "第二课",
    content: "复习分数乘除法的数量关系\n讲解如何找单位“1”\n整理“已知部分求整体”和“已知整体求部分”的解题步骤",
    homework: "完成练习册 P21 第 1-6 题\n订正课堂错题，并写出错因",
  },
  {
    id: createId(),
    date: "2026-07-12",
    student: "张同学",
    lessonNo: "第一课",
    content: "讲解段落中心句的寻找方法\n练习用关键词压缩长句\n区分事实信息和作者观点",
    homework: "完成阅读训练一篇\n每段写一句段意，答案旁标原文依据",
  },
];

function normalizeLesson(lesson, index = 0) {
  return {
    id: lesson.id || createId(),
    date: lesson.date || new Date().toISOString().slice(0, 10),
    student: lesson.student || "未填写学生",
    lessonNo: lesson.lessonNo || lesson.courseNo || lesson.lessonCount || defaultLessonNo(index),
    content: lesson.content || "",
    contentImages: normalizeImages(lesson.contentImages),
    homework: lesson.homework || "",
    homeworkImages: normalizeImages(lesson.homeworkImages),
  };
}

function loadLessons() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    const defaultLessons = sampleLessons.map(normalizeLesson);
    saveLessons(defaultLessons);
    return defaultLessons;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeLesson) : sampleLessons.map(normalizeLesson);
  } catch {
    return sampleLessons.map(normalizeLesson);
  }
}

function saveLessons(lessons) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(lessons.map(normalizeLesson)));
    return true;
  } catch {
    window.alert("图片数据太大，当前浏览器保存不下。请删除几张图片，或换成更小的截图后再保存。");
    return false;
  }
}

function splitLines(value) {
  return String(value)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  const day = date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const weekday = date.toLocaleDateString("zh-CN", { weekday: "short" });
  return `${day} ${weekday}`;
}

function fillList(list, text, hasImages = false) {
  list.innerHTML = "";
  const lines = splitLines(text);
  if (!lines.length && hasImages) {
    const li = document.createElement("li");
    li.className = "empty-note";
    li.textContent = "见下方图片。";
    list.append(li);
    return;
  }

  lines.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
}

function listMarkup(text, images = []) {
  const lines = splitLines(text);
  if (!lines.length && normalizeImages(images).length) {
    return `<p class="empty-note">见下方图片。</p>`;
  }

  return `<ul>${lines
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function matchesLesson(lesson, keyword) {
  if (!keyword) return true;
  const haystack = [
    lesson.date,
    lesson.student,
    lesson.lessonNo,
    lesson.content,
    lesson.homework,
    ...normalizeImages(lesson.contentImages).map((image) => image.name),
    ...normalizeImages(lesson.homeworkImages).map((image) => image.name),
  ].join(" ");
  return haystack.toLowerCase().includes(keyword.toLowerCase());
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .filter((image) => image && typeof image.src === "string" && image.src.startsWith("data:image/"))
    .map((image) => ({
      id: image.id || createId(),
      name: image.name || "图片",
      src: image.src,
    }));
}

function setDraftImages(nextImages = {}) {
  draftImages = {
    contentImages: normalizeImages(nextImages.contentImages),
    homeworkImages: normalizeImages(nextImages.homeworkImages),
  };
  imageFields.forEach(renderImagePreview);
}

function fileToCompressedImage(file) {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error(`${file.name} 不是图片文件。`));
  }

  if (file.size > maxImageFileSize) {
    return Promise.reject(new Error(`${file.name} 超过 10MB，请先压缩后再上传。`));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`${file.name} 读取失败。`));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error(`${file.name} 无法识别，请换一张常见格式图片。`));
      image.onload = () => {
        const scale = Math.min(1, maxImageSide / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve({
          id: createId(),
          name: file.name || "图片",
          src: canvas.toDataURL("image/jpeg", 0.82),
        });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreview(field) {
  const preview = document.querySelector(`[data-preview="${field}"]`);
  if (!preview) return;

  preview.innerHTML = "";
  draftImages[field].forEach((image, index) => {
    const card = document.createElement("figure");
    card.className = "preview-card";

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.name;

    const remove = document.createElement("button");
    remove.className = "remove-image";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `删除${image.name}`);
    remove.addEventListener("click", () => {
      draftImages[field].splice(index, 1);
      renderImagePreview(field);
    });

    const caption = document.createElement("figcaption");
    caption.textContent = image.name;

    card.append(img, remove, caption);
    preview.append(card);
  });
}

function setupImageInput(field) {
  const input = document.querySelector(`#${field}`);
  if (!input) return;

  input.addEventListener("change", async () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const availableSlots = maxImagesPerField - draftImages[field].length;
    if (availableSlots <= 0) {
      window.alert("这一栏最多上传 6 张图片。");
      input.value = "";
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    try {
      const nextImages = [];
      for (const file of selectedFiles) {
        nextImages.push(await fileToCompressedImage(file));
      }
      draftImages[field] = [...draftImages[field], ...nextImages];
      if (files.length > availableSlots) {
        window.alert("这一栏最多上传 6 张图片，超出的图片没有加入。");
      }
    } catch (error) {
      window.alert(error.message || "图片上传失败，请换一张图片。");
    } finally {
      input.value = "";
      renderImagePreview(field);
    }
  });
}

function fillGallery(gallery, images) {
  const normalizedImages = normalizeImages(images);
  gallery.innerHTML = "";
  gallery.hidden = !normalizedImages.length;

  normalizedImages.forEach((image) => {
    const link = document.createElement("a");
    link.href = image.src;
    link.target = "_blank";
    link.rel = "noopener";
    link.title = "点击查看大图";

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.name;

    link.append(img);
    gallery.append(link);
  });
}

function galleryMarkup(images) {
  const normalizedImages = normalizeImages(images);
  if (!normalizedImages.length) return "";

  return `<div class="image-gallery report-gallery">${normalizedImages
    .map(
      (image) => `
        <a href="${escapeHtml(image.src)}" target="_blank" rel="noopener" title="点击查看大图">
          <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.name)}" />
        </a>
      `,
    )
    .join("")}</div>`;
}

function updateSummary(allLessons) {
  const sorted = [...allLessons].sort((a, b) => b.date.localeCompare(a.date));
  courseCount.textContent = `${allLessons.length} 节课`;
  latestDate.textContent = sorted.length ? `最近：${formatDate(sorted[0].date)}` : "暂无日期";
}

function renderLessons() {
  const allLessons = loadLessons();
  const lessons = allLessons
    .filter((lesson) => matchesLesson(lesson, search.value.trim()))
    .sort((a, b) => b.date.localeCompare(a.date));

  timeline.innerHTML = "";
  updateSummary(allLessons);

  if (!lessons.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = search.value.trim() ? "没有匹配的课堂反馈。" : "还没有课堂反馈，请先在左侧填写。";
    timeline.append(empty);
    return;
  }

  lessons.forEach((lesson, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.classList.toggle("open", index === 0);
    node.querySelector(".date").textContent = formatDate(lesson.date);
    node.querySelector(".lesson-no").textContent = lesson.lessonNo;
    node.querySelector(".student").textContent = lesson.student;
    fillList(node.querySelector(".content"), lesson.content, lesson.contentImages.length > 0);
    fillList(node.querySelector(".homework"), lesson.homework, lesson.homeworkImages.length > 0);
    fillGallery(node.querySelector('[data-gallery="contentImages"]'), lesson.contentImages);
    fillGallery(node.querySelector('[data-gallery="homeworkImages"]'), lesson.homeworkImages);

    node.querySelector(".lesson-toggle").addEventListener("click", () => {
      node.classList.toggle("open");
    });

    node.querySelector(".view-report").addEventListener("click", () => {
      openFamilyReport(lesson);
    });

    node.querySelector(".edit").addEventListener("click", () => {
      editingId = lesson.id;
      form.date.value = lesson.date;
      form.student.value = lesson.student;
      form.lessonNo.value = lesson.lessonNo;
      form.content.value = lesson.content;
      form.homework.value = lesson.homework;
      setDraftImages({
        contentImages: lesson.contentImages,
        homeworkImages: lesson.homeworkImages,
      });
      form.querySelector(".primary").textContent = "更新反馈";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    node.querySelector(".delete").addEventListener("click", () => {
      const confirmed = window.confirm(`确定删除 ${formatDate(lesson.date)} 的反馈吗？`);
      if (!confirmed) return;
      if (!saveLessons(loadLessons().filter((item) => item.id !== lesson.id))) return;
      if (editingId === lesson.id) clearForm();
      renderLessons();
    });

    timeline.append(node);
  });
}

function openFamilyReport(lesson) {
  reportTitle.textContent = `${lesson.student} · ${lesson.lessonNo}课后反馈`;
  reportMeta.innerHTML = `
    <span>${formatDate(lesson.date)}</span>
    <span>${escapeHtml(lesson.lessonNo)}</span>
    <span>本节课后反馈</span>
  `;
  reportGrid.innerHTML = `
    <section>
      <h3>课程反馈</h3>
      <p>这节课主要学习：</p>
      ${listMarkup(lesson.content, lesson.contentImages)}
      ${galleryMarkup(lesson.contentImages)}
    </section>
    <section>
      <h3>作业安排</h3>
      <p>课后需要完成：</p>
      ${listMarkup(lesson.homework, lesson.homeworkImages)}
      ${galleryMarkup(lesson.homeworkImages)}
    </section>
  `;
  familyDialog.showModal();
}

function clearForm() {
  editingId = null;
  form.reset();
  form.lessonNo.value = "第一课";
  form.date.valueAsDate = new Date();
  setDraftImages();
  form.querySelector(".primary").textContent = "保存反馈";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const content = formData.get("content").trim();
  const homework = formData.get("homework").trim();

  if (!content && !draftImages.contentImages.length) {
    window.alert("请填写课程反馈，或上传课程反馈图片。");
    return;
  }

  if (!homework && !draftImages.homeworkImages.length) {
    window.alert("请填写作业安排，或上传作业安排图片。");
    return;
  }

  const lesson = normalizeLesson({
    id: editingId || createId(),
    date: formData.get("date"),
    student: formData.get("student").trim(),
    lessonNo: formData.get("lessonNo"),
    content,
    contentImages: draftImages.contentImages,
    homework,
    homeworkImages: draftImages.homeworkImages,
  });

  const lessons = loadLessons();
  const nextLessons = editingId ? lessons.map((item) => (item.id === editingId ? lesson : item)) : [...lessons, lesson];
  if (!saveLessons(nextLessons)) return;
  clearForm();
  renderLessons();
});

resetForm.addEventListener("click", clearForm);
search.addEventListener("input", renderLessons);
closeDialog.addEventListener("click", () => familyDialog.close());
printReport.addEventListener("click", () => window.print());
lockPage.addEventListener("click", lockFeedbackPage);

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (normalizePassword(passwordInput.value) === pagePassword) {
    unlockPage();
    return;
  }

  authError.textContent = "密码不正确，请输入“王建博”的拼音。";
  passwordInput.select();
});

exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(loadLessons(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "课后学习反馈.json";
  link.click();
  URL.revokeObjectURL(url);
});

imageFields.forEach(setupImageInput);
clearForm();
renderLessons();
