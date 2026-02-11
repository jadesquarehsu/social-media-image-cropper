/**
 * Social Image Cropper — Frontend Logic
 * Two modes: Social Media (multi-select) and Web/Amazon (single-select).
 * Batch processing: upload multiple images, adjust each, download all.
 * Accurate crop guides, pan clamping, resolution-aware output.
 */

(() => {
    "use strict";

    // ── Format definitions ──
    const SOCIAL_FORMATS = {
        ig: { w: 1080, h: 1350, label: "IG 4:5", color: "rgba(225, 48, 108, 0.8)", prefix: "IG-" },
        igstory: { w: 1080, h: 1920, label: "IG Story", color: "rgba(193, 53, 132, 0.8)", prefix: "IGStory-" },
        fb: { w: 1200, h: 1200, label: "FB 1:1", color: "rgba(24, 119, 242, 0.8)", prefix: "FB-" },
        fb43: { w: 1200, h: 900, label: "FB 4:3", color: "rgba(24, 119, 242, 0.8)", prefix: "FB43-" },
    };

    // Custom format (user-defined)
    let CUSTOM_FORMAT = { w: 1000, h: 1000, label: "自訂", color: "rgba(168, 85, 247, 0.8)", prefix: "CUSTOM-" };

    const WEB_FORMATS = {
        w800x880: { w: 800, h: 880, label: "Shopline 800×880", prefix: "SL-" },
        w2560x2560: { w: 2560, h: 2560, label: "2560×2560", prefix: "WEB-2560x2560-" },
        w2560x1920: { w: 2560, h: 1920, label: "2560×1920", prefix: "WEB-2560x1920-" },
        w2560x1440: { w: 2560, h: 1440, label: "2560×1440", prefix: "WEB-2560x1440-" },
        w1440x2560: { w: 1440, h: 2560, label: "1440×2560", prefix: "WEB-1440x2560-" },
        w970x600: { w: 970, h: 600, label: "970×600", prefix: "WEB-970x600-" },
        w970x300: { w: 970, h: 300, label: "970×300", prefix: "WEB-970x300-" },
        w600x180: { w: 600, h: 180, label: "600×180", prefix: "WEB-600x180-" },
        w350x175: { w: 350, h: 175, label: "350×175", prefix: "WEB-350x175-" },
        w300x400: { w: 300, h: 400, label: "300×400", prefix: "WEB-300x400-" },
        w300x300: { w: 300, h: 300, label: "300×300", prefix: "WEB-300x300-" },
        w200x200: { w: 200, h: 200, label: "200×200", prefix: "WEB-200x200-" },
        w150x300: { w: 150, h: 300, label: "150×300", prefix: "WEB-150x300-" },
    };

    const WEB_GUIDE_COLOR = "rgba(245, 158, 11, 0.8)";
    const SHOPLINE_GUIDE_COLOR = "rgba(16, 185, 129, 0.8)";

    // ── DOM refs ──
    const uploadSection = document.getElementById("uploadSection");
    const editorSection = document.getElementById("editorSection");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const zoomSlider = document.getElementById("zoomSlider");
    const zoomValue = document.getElementById("zoomValue");
    const sourceViewport = document.getElementById("sourceViewport");
    const sourceCanvas = document.getElementById("sourceCanvas");
    const btnReset = document.getElementById("btnReset");
    const btnChangeImage = document.getElementById("btnChangeImage");
    const btnDownloadAll = document.getElementById("btnDownloadAll");
    const downloadAllWrap = document.getElementById("downloadAllWrap");

    // Watermark
    const btnUploadWatermark = document.getElementById("btnUploadWatermark");
    const btnRemoveWatermark = document.getElementById("btnRemoveWatermark");
    const watermarkInput = document.getElementById("watermarkInput");
    const watermarkName = document.getElementById("watermarkName");
    const watermarkControls = document.getElementById("watermarkControls");
    const watermarkPosition = document.getElementById("watermarkPosition");
    const wmOpacity = document.getElementById("wmOpacity");
    const wmOpacityValue = document.getElementById("wmOpacityValue");
    const wmScale = document.getElementById("wmScale");
    const wmScaleValue = document.getElementById("wmScaleValue");
    const watermarkPreview = document.getElementById("watermarkPreview");

    // Social
    const igCanvas = document.getElementById("igCanvas");
    const igStoryCanvas = document.getElementById("igStoryCanvas");
    const fbCanvas = document.getElementById("fbCanvas");
    const btnDownloadIG = document.getElementById("btnDownloadIG");
    const btnDownloadIGStory = document.getElementById("btnDownloadIGStory");
    const btnDownloadFB = document.getElementById("btnDownloadFB");
    const toggleIG = document.getElementById("toggleIG");
    const toggleIGStory = document.getElementById("toggleIGStory");
    const toggleFB = document.getElementById("toggleFB");
    const cardIG = document.getElementById("cardIG");
    const cardIGStory = document.getElementById("cardIGStory");
    const cardFB = document.getElementById("cardFB");
    const socialToggles = document.getElementById("socialToggles");
    const socialOutputFormat = document.getElementById("socialOutputFormat");
    const socialPreviews = document.getElementById("socialPreviews");

    // FB 4:3
    const fb43Canvas = document.getElementById("fb43Canvas");
    const toggleFB43 = document.getElementById("toggleFB43");
    const cardFB43 = document.getElementById("cardFB43");
    const btnDownloadFB43 = document.getElementById("btnDownloadFB43");
    const warnFB43 = document.getElementById("warnFB43");
    const warnFB43Size = document.getElementById("warnFB43Size");

    // Custom format
    const toggleCustom = document.getElementById("toggleCustom");
    const cardCustom = document.getElementById("cardCustom");
    const customCanvas = document.getElementById("customCanvas");
    const customCanvasWrap = document.getElementById("customCanvasWrap");
    const customSizeLabel = document.getElementById("customSizeLabel");
    const customBadge = document.getElementById("customBadge");
    const btnDownloadCustom = document.getElementById("btnDownloadCustom");
    const warnCustom = document.getElementById("warnCustom");
    const warnCustomSize = document.getElementById("warnCustomSize");
    const customSizeSection = document.getElementById("customSizeSection");
    const customW = document.getElementById("customW");
    const customH = document.getElementById("customH");
    const btnApplyCustom = document.getElementById("btnApplyCustom");
    const customToggleSize = document.getElementById("customToggleSize");

    // Web/Amazon
    const webToggles = document.getElementById("webToggles");
    const webOutputFormat = document.getElementById("webOutputFormat");
    const webPreviews = document.getElementById("webPreviews");
    const webCanvas = document.getElementById("webCanvas");
    const webCanvasWrap = document.getElementById("webCanvasWrap");
    const webSizeLabel = document.getElementById("webSizeLabel");
    const webBadge = document.getElementById("webBadge");
    const btnDownloadWeb = document.getElementById("btnDownloadWeb");

    // Warning elements
    const warnIG = document.getElementById("warnIG");
    const warnIGSize = document.getElementById("warnIGSize");
    const warnIGStory = document.getElementById("warnIGStory");
    const warnIGStorySize = document.getElementById("warnIGStorySize");
    const warnFB = document.getElementById("warnFB");
    const warnFBSize = document.getElementById("warnFBSize");
    const warnWeb = document.getElementById("warnWeb");
    const warnWebSize = document.getElementById("warnWebSize");

    // Batch navigation
    const imageNav = document.getElementById("imageNav");
    const imageCounter = document.getElementById("imageCounter");
    const thumbnailStrip = document.getElementById("thumbnailStrip");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    const batchDownloadWrap = document.getElementById("batchDownloadWrap");
    const btnBatchDownload = document.getElementById("btnBatchDownload");
    const batchHint = document.getElementById("batchHint");

    // Mode tabs
    const tabSocial = document.getElementById("tabSocial");
    const tabWeb = document.getElementById("tabWeb");

    const sourceCtx = sourceCanvas.getContext("2d");
    const igCtx = igCanvas.getContext("2d");
    const igStoryCtx = igStoryCanvas.getContext("2d");
    const fbCtx = fbCanvas.getContext("2d");
    const fb43Ctx = fb43Canvas.getContext("2d");
    const customCtx = customCanvas.getContext("2d");
    const webCtx = webCanvas.getContext("2d");

    // Social format map
    const SOCIAL_MAP = {
        ig: { canvas: igCanvas, ctx: igCtx, card: cardIG, toggle: toggleIG },
        igstory: { canvas: igStoryCanvas, ctx: igStoryCtx, card: cardIGStory, toggle: toggleIGStory },
        fb: { canvas: fbCanvas, ctx: fbCtx, card: cardFB, toggle: toggleFB },
        fb43: { canvas: fb43Canvas, ctx: fb43Ctx, card: cardFB43, toggle: toggleFB43 },
        custom: { canvas: customCanvas, ctx: customCtx, card: cardCustom, toggle: toggleCustom },
    };

    // ── State ──
    let imageQueue = [];
    let currentIndex = 0;
    let img = null;
    let fileName = "";
    let fileExt = "";
    let fileMime = "";
    let zoom = 1;
    let panX = 0, panY = 0;
    let dragging = false;
    let dragStartX = 0, dragStartY = 0;
    let dragStartPanX = 0, dragStartPanY = 0;
    let currentMode = "social";

    // Watermark state
    let watermarkImg = null;
    let wmPos = "bottom-right";
    let wmOpacityVal = 0.5;
    let wmScaleVal = 0.20;

    // ── Helpers ──
    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

    function mimeFromExt(ext) {
        const map = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
        return map[ext.toLowerCase()] || "image/png";
    }

    function activeFormats() {
        if (currentMode === "social") {
            return Object.keys(SOCIAL_MAP)
                .filter(k => SOCIAL_MAP[k].toggle.checked)
                .map(k => SOCIAL_FORMATS[k]);
        } else {
            const selected = document.querySelector('input[name="webFormat"]:checked');
            if (!selected) return [];
            const f = WEB_FORMATS[selected.value];
            const isShopline = selected.value === "w800x880";
            return f ? [{ ...f, color: isShopline ? SHOPLINE_GUIDE_COLOR : WEB_GUIDE_COLOR }] : [];
        }
    }

    function selectedWebFormatKey() {
        const selected = document.querySelector('input[name="webFormat"]:checked');
        return selected ? selected.value : null;
    }

    function clampPan() {
        if (!img) return;
        const formats = activeFormats();
        if (formats.length === 0) return;

        let maxPanX = Infinity, maxPanY = Infinity;
        for (const f of formats) {
            const baseScale = Math.max(f.w / img.width, f.h / img.height);
            const cropW = f.w / (baseScale * zoom);
            const cropH = f.h / (baseScale * zoom);
            const mpx = Math.max(0, (img.width - cropW) / 2);
            const mpy = Math.max(0, (img.height - cropH) / 2);
            maxPanX = Math.min(maxPanX, mpx);
            maxPanY = Math.min(maxPanY, mpy);
        }

        panX = clamp(panX, -maxPanX, maxPanX);
        panY = clamp(panY, -maxPanY, maxPanY);
    }

    // ── File handling (batch) ──
    function handleFiles(files) {
        const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
        if (validFiles.length === 0) return;

        imageQueue = [];
        let loaded = 0;

        validFiles.forEach((file, i) => {
            const dotIdx = file.name.lastIndexOf(".");
            const name = dotIdx > 0 ? file.name.substring(0, dotIdx) : file.name;
            const ext = dotIdx > 0 ? file.name.substring(dotIdx) : ".png";

            const reader = new FileReader();
            reader.onload = (e) => {
                const image = new Image();
                image.onload = () => {
                    imageQueue[i] = {
                        img: image,
                        fileName: name,
                        fileExt: ext,
                        zoom: 1,
                        panX: 0,
                        panY: 0,
                        dataUrl: e.target.result
                    };
                    loaded++;
                    if (loaded === validFiles.length) {
                        currentIndex = 0;
                        loadImageAtIndex(0);
                        buildThumbnails();
                        updateBatchUI();
                    }
                };
                image.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function saveCurrentState() {
        if (imageQueue.length === 0) return;
        const entry = imageQueue[currentIndex];
        if (!entry) return;
        entry.zoom = zoom;
        entry.panX = panX;
        entry.panY = panY;
    }

    function loadImageAtIndex(idx) {
        if (idx < 0 || idx >= imageQueue.length) return;
        saveCurrentState();
        currentIndex = idx;
        const entry = imageQueue[idx];

        img = entry.img;
        fileName = entry.fileName;
        fileExt = entry.fileExt;
        fileMime = mimeFromExt(fileExt);
        zoom = entry.zoom;
        panX = entry.panX;
        panY = entry.panY;

        zoomSlider.value = Math.round(zoom * 100);
        zoomValue.textContent = Math.round(zoom * 100) + "%";

        uploadSection.style.display = "none";
        editorSection.style.display = "block";

        const maxW = sourceViewport.clientWidth || 800;
        const maxH = 500;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        sourceCanvas.width = Math.round(img.width * scale);
        sourceCanvas.height = Math.round(img.height * scale);

        igCanvas.width = SOCIAL_FORMATS.ig.w; igCanvas.height = SOCIAL_FORMATS.ig.h;
        igStoryCanvas.width = SOCIAL_FORMATS.igstory.w; igStoryCanvas.height = SOCIAL_FORMATS.igstory.h;
        fbCanvas.width = SOCIAL_FORMATS.fb.w; fbCanvas.height = SOCIAL_FORMATS.fb.h;
        fb43Canvas.width = SOCIAL_FORMATS.fb43.w; fb43Canvas.height = SOCIAL_FORMATS.fb43.h;
        customCanvas.width = CUSTOM_FORMAT.w; customCanvas.height = CUSTOM_FORMAT.h;

        updateWebCanvas();
        updateVisibility();
        updateImageCounter();
        highlightThumbnail();
        render();
    }

    // ── Thumbnail strip ──
    function buildThumbnails() {
        thumbnailStrip.innerHTML = "";
        imageQueue.forEach((entry, i) => {
            const div = document.createElement("div");
            div.className = "thumbnail" + (i === currentIndex ? " active" : "");
            div.addEventListener("click", () => loadImageAtIndex(i));

            const imgEl = document.createElement("img");
            imgEl.src = entry.dataUrl;
            imgEl.alt = entry.fileName;
            div.appendChild(imgEl);

            const idx = document.createElement("span");
            idx.className = "thumbnail__index";
            idx.textContent = i + 1;
            div.appendChild(idx);

            thumbnailStrip.appendChild(div);
        });
    }

    function highlightThumbnail() {
        const thumbs = thumbnailStrip.querySelectorAll(".thumbnail");
        thumbs.forEach((t, i) => t.classList.toggle("active", i === currentIndex));
        if (thumbs[currentIndex]) {
            thumbs[currentIndex].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }

    function updateImageCounter() {
        imageCounter.textContent = (currentIndex + 1) + " / " + imageQueue.length;
    }

    function updateBatchUI() {
        const isBatch = imageQueue.length > 1;
        imageNav.style.display = isBatch ? "flex" : "none";
        thumbnailStrip.style.display = isBatch ? "flex" : "none";
        batchDownloadWrap.style.display = isBatch ? "block" : "none";
        if (isBatch) {
            batchHint.textContent = "共 " + imageQueue.length + " 張圖片";
        }
    }

    function updateWebCanvas() {
        const key = selectedWebFormatKey();
        if (!key) return;
        const f = WEB_FORMATS[key];
        webCanvas.width = f.w;
        webCanvas.height = f.h;
        webCanvasWrap.style.aspectRatio = f.w + " / " + f.h;
        webSizeLabel.textContent = f.w + " × " + f.h;
        // Update badge for Shopline vs generic WEB
        if (key === "w800x880") {
            webBadge.textContent = "🛍️ Shopline";
            webBadge.className = "preview-card__badge preview-card__badge--shopline";
        } else {
            webBadge.textContent = "WEB";
            webBadge.className = "preview-card__badge preview-card__badge--web";
        }
    }

    function webOutputInfo() {
        const sel = document.querySelector('input[name="webOutputType"]:checked');
        const val = sel ? sel.value : "jpg";
        return val === "webp"
            ? { mime: "image/webp", ext: ".webp" }
            : { mime: "image/jpeg", ext: ".jpg" };
    }

    function socialOutputInfo() {
        const sel = document.querySelector('input[name="socialOutputType"]:checked');
        const val = sel ? sel.value : "jpg";
        return val === "webp"
            ? { mime: "image/webp", ext: ".webp" }
            : { mime: "image/jpeg", ext: ".jpg" };
    }

    function updateVisibility() {
        const isSocial = currentMode === "social";
        socialToggles.style.display = isSocial ? "flex" : "none";
        socialOutputFormat.style.display = isSocial ? "flex" : "none";
        webToggles.style.display = isSocial ? "none" : "flex";
        webOutputFormat.style.display = isSocial ? "none" : "flex";
        socialPreviews.style.display = isSocial ? "grid" : "none";
        webPreviews.style.display = isSocial ? "none" : "grid";
        downloadAllWrap.style.display = isSocial ? "block" : "none";

        tabSocial.classList.toggle("active", isSocial);
        tabWeb.classList.toggle("active", !isSocial);

        if (isSocial) {
            for (const key of Object.keys(SOCIAL_MAP)) {
                SOCIAL_MAP[key].card.classList.toggle("hidden", !SOCIAL_MAP[key].toggle.checked);
            }
        }
    }

    // ── Resolution check ──
    function getActualOutputSize(outW, outH, targetImg) {
        const i = targetImg || img;
        if (!i) return { w: outW, h: outH, insufficient: false };
        const baseScale = Math.max(outW / i.width, outH / i.height);
        const z = targetImg ? (imageQueue.find(e => e.img === targetImg)?.zoom || zoom) : zoom;
        const effectiveScale = baseScale * z;
        if (effectiveScale > 1) {
            return {
                w: Math.round(outW / effectiveScale),
                h: Math.round(outH / effectiveScale),
                insufficient: true
            };
        }
        return { w: outW, h: outH, insufficient: false };
    }

    function updateWarnings() {
        if (!img) return;
        const WARN_MAP = {
            ig: { el: warnIG, sizeEl: warnIGSize },
            igstory: { el: warnIGStory, sizeEl: warnIGStorySize },
            fb: { el: warnFB, sizeEl: warnFBSize },
            fb43: { el: warnFB43, sizeEl: warnFB43Size },
        };
        for (const key of Object.keys(WARN_MAP)) {
            const f = SOCIAL_FORMATS[key];
            const actual = getActualOutputSize(f.w, f.h);
            const w = WARN_MAP[key];
            if (actual.insufficient && SOCIAL_MAP[key].toggle.checked) {
                w.el.style.display = "block";
                w.sizeEl.textContent = actual.w + " × " + actual.h;
            } else {
                w.el.style.display = "none";
            }
        }
        // Custom warning
        if (toggleCustom.checked) {
            const actualC = getActualOutputSize(CUSTOM_FORMAT.w, CUSTOM_FORMAT.h);
            if (actualC.insufficient) {
                warnCustom.style.display = "block";
                warnCustomSize.textContent = actualC.w + " × " + actualC.h;
            } else {
                warnCustom.style.display = "none";
            }
        } else {
            warnCustom.style.display = "none";
        }
        const webKey = selectedWebFormatKey();
        if (webKey) {
            const wf = WEB_FORMATS[webKey];
            const actual = getActualOutputSize(wf.w, wf.h);
            if (actual.insufficient) {
                warnWeb.style.display = "block";
                warnWebSize.textContent = actual.w + " × " + actual.h;
            } else {
                warnWeb.style.display = "none";
            }
        }
    }

    // ── Render ──
    function render() {
        if (!img) return;
        clampPan();
        renderSource();

        if (currentMode === "social") {
            for (const key of Object.keys(SOCIAL_MAP)) {
                if (SOCIAL_MAP[key].toggle.checked) {
                    const fmt = key === "custom" ? CUSTOM_FORMAT : SOCIAL_FORMATS[key];
                    renderPreview(SOCIAL_MAP[key].ctx, fmt.w, fmt.h);
                }
            }
        } else {
            const key = selectedWebFormatKey();
            if (key) {
                const f = WEB_FORMATS[key];
                renderPreview(webCtx, f.w, f.h);
            }
        }
        updateWarnings();
    }

    function renderSource() {
        const cw = sourceCanvas.width;
        const ch = sourceCanvas.height;
        const sourceScale = Math.min(cw / img.width, ch / img.height, 1);
        const ss = sourceScale * zoom;

        sourceCtx.fillStyle = "#000";
        sourceCtx.fillRect(0, 0, cw, ch);

        const drawW = img.width * ss;
        const drawH = img.height * ss;
        const dx = (cw - drawW) / 2 + panX * ss;
        const dy = (ch - drawH) / 2 + panY * ss;
        sourceCtx.drawImage(img, dx, dy, drawW, drawH);

        const formats = activeFormats();
        for (const f of formats) {
            drawCropGuide(sourceCtx, cw, ch, f, sourceScale);
        }
    }

    function drawCropGuide(ctx, cw, ch, format, sourceScale) {
        const baseScale = Math.max(format.w / img.width, format.h / img.height);
        const gw = format.w * sourceScale / baseScale;
        const gh = format.h * sourceScale / baseScale;
        const gx = (cw - gw) / 2;
        const gy = (ch - gh) / 2;

        ctx.save();
        ctx.strokeStyle = format.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(gx, gy, gw, gh);
        ctx.setLineDash([]);

        ctx.fillStyle = format.color;
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillText(format.label, gx + 6, gy + 16);
        ctx.restore();
    }

    function renderPreview(ctx, outW, outH) {
        ctx.clearRect(0, 0, outW, outH);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, outW, outH);

        const baseScale = Math.max(outW / img.width, outH / img.height);
        const scaledW = img.width * baseScale * zoom;
        const scaledH = img.height * baseScale * zoom;
        const panScale = baseScale * zoom;
        const dx = (outW - scaledW) / 2 + panX * panScale;
        const dy = (outH - scaledH) / 2 + panY * panScale;

        ctx.drawImage(img, dx, dy, scaledW, scaledH);

        // Draw watermark on preview
        if (watermarkImg) {
            drawWatermark(ctx, outW, outH);
        }
    }

    /** Draw watermark on a canvas */
    function drawWatermark(ctx, canvasW, canvasH) {
        if (!watermarkImg) return;
        const wmW = canvasW * wmScaleVal;
        const wmH = wmW * (watermarkImg.height / watermarkImg.width);
        const padding = canvasW * 0.03;

        let x, y;
        switch (wmPos) {
            case "top-left": x = padding; y = padding; break;
            case "top-right": x = canvasW - wmW - padding; y = padding; break;
            case "bottom-left": x = padding; y = canvasH - wmH - padding; break;
            case "center": x = (canvasW - wmW) / 2; y = (canvasH - wmH) / 2; break;
            case "bottom-right":
            default: x = canvasW - wmW - padding; y = canvasH - wmH - padding; break;
        }

        ctx.save();
        ctx.globalAlpha = wmOpacityVal;
        ctx.drawImage(watermarkImg, x, y, wmW, wmH);
        ctx.restore();
    }

    // ── Download (resolution-aware) ──
    function downloadFormat(outW, outH, prefix, overrideMime, overrideExt, targetImg, targetZoom, targetPanX, targetPanY) {
        const mime = overrideMime || fileMime;
        const ext = overrideExt || fileExt;
        const i = targetImg || img;
        const z = targetZoom != null ? targetZoom : zoom;
        const px = targetPanX != null ? targetPanX : panX;
        const py = targetPanY != null ? targetPanY : panY;

        const baseScale = Math.max(outW / i.width, outH / i.height);
        const effectiveScale = baseScale * z;

        let actualW, actualH;
        if (effectiveScale > 1) {
            actualW = Math.round(outW / effectiveScale);
            actualH = Math.round(outH / effectiveScale);
        } else {
            actualW = outW;
            actualH = outH;
        }

        const tmp = document.createElement("canvas");
        tmp.width = actualW;
        tmp.height = actualH;
        const tmpCtx = tmp.getContext("2d");

        tmpCtx.fillStyle = "#000";
        tmpCtx.fillRect(0, 0, actualW, actualH);
        const bs = Math.max(actualW / i.width, actualH / i.height);
        const sw = i.width * bs * z;
        const sh = i.height * bs * z;
        const ps = bs * z;
        const dx = (actualW - sw) / 2 + px * ps;
        const dy = (actualH - sh) / 2 + py * ps;
        tmpCtx.drawImage(i, dx, dy, sw, sh);

        // Apply watermark to download
        if (watermarkImg) {
            drawWatermark(tmpCtx, actualW, actualH);
        }

        return new Promise(resolve => {
            tmp.toBlob((blob) => {
                if (!blob) { resolve(); return; }
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = prefix + (targetImg ? (imageQueue.find(e => e.img === targetImg)?.fileName || fileName) : fileName) + ext;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                resolve();
            }, mime, 0.95);
        });
    }

    // ── Batch download ──
    async function batchDownloadAll() {
        saveCurrentState();
        let delay = 0;

        for (let i = 0; i < imageQueue.length; i++) {
            const entry = imageQueue[i];

            if (currentMode === "social") {
                const out = socialOutputInfo();
                for (const key of Object.keys(SOCIAL_MAP)) {
                    if (SOCIAL_MAP[key].toggle.checked) {
                        const f = key === "custom" ? CUSTOM_FORMAT : SOCIAL_FORMATS[key];
                        await new Promise(r => setTimeout(r, delay));
                        await downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext, entry.img, entry.zoom, entry.panX, entry.panY);
                        delay = 300;
                    }
                }
            } else {
                const webKey = selectedWebFormatKey();
                if (webKey) {
                    const out = webOutputInfo();
                    const f = WEB_FORMATS[webKey];
                    await new Promise(r => setTimeout(r, delay));
                    await downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext, entry.img, entry.zoom, entry.panX, entry.panY);
                    delay = 300;
                }
            }
        }
    }

    // ── Event Listeners ──

    dropzone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) handleFiles(e.target.files);
    });

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-over");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });

    // Watermark upload
    btnUploadWatermark.addEventListener("click", () => watermarkInput.click());
    watermarkInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const image = new Image();
            image.onload = () => {
                watermarkImg = image;
                watermarkName.textContent = file.name;
                watermarkControls.style.display = "flex";
                btnRemoveWatermark.style.display = "inline-flex";
                watermarkPreview.style.display = "inline-block";
                watermarkPreview.innerHTML = "";
                const previewImg = document.createElement("img");
                previewImg.src = ev.target.result;
                watermarkPreview.appendChild(previewImg);
                render();
            };
            image.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    btnRemoveWatermark.addEventListener("click", () => {
        watermarkImg = null;
        watermarkInput.value = "";
        watermarkName.textContent = "尚未選擇";
        watermarkControls.style.display = "none";
        btnRemoveWatermark.style.display = "none";
        watermarkPreview.style.display = "none";
        watermarkPreview.innerHTML = "";
        render();
    });

    watermarkPosition.addEventListener("change", (e) => {
        wmPos = e.target.value;
        render();
    });

    wmOpacity.addEventListener("input", (e) => {
        wmOpacityVal = parseInt(e.target.value) / 100;
        wmOpacityValue.textContent = e.target.value + "%";
        render();
    });

    wmScale.addEventListener("input", (e) => {
        wmScaleVal = parseInt(e.target.value) / 100;
        wmScaleValue.textContent = e.target.value + "%";
        render();
    });

    // Custom format toggle
    toggleCustom.addEventListener("change", () => {
        customSizeSection.style.display = toggleCustom.checked ? "flex" : "none";
        cardCustom.style.display = toggleCustom.checked ? "block" : "none";
        render();
    });

    btnApplyCustom.addEventListener("click", () => {
        const w = parseInt(customW.value) || 1000;
        const h = parseInt(customH.value) || 1000;
        CUSTOM_FORMAT.w = Math.max(50, Math.min(10000, w));
        CUSTOM_FORMAT.h = Math.max(50, Math.min(10000, h));
        customCanvas.width = CUSTOM_FORMAT.w;
        customCanvas.height = CUSTOM_FORMAT.h;
        customCanvasWrap.style.aspectRatio = CUSTOM_FORMAT.w + " / " + CUSTOM_FORMAT.h;
        customSizeLabel.textContent = CUSTOM_FORMAT.w + " × " + CUSTOM_FORMAT.h;
        customToggleSize.textContent = CUSTOM_FORMAT.w + "×" + CUSTOM_FORMAT.h;
        render();
    });

    // Format toggles re-render
    [toggleIG, toggleIGStory, toggleFB, toggleFB43].forEach(t => {
        t.addEventListener("change", () => {
            updateVisibility();
            render();
        });
    });

    tabSocial.addEventListener("click", () => {
        currentMode = "social";
        updateVisibility();
        render();
    });
    tabWeb.addEventListener("click", () => {
        currentMode = "web";
        updateWebCanvas();
        updateVisibility();
        render();
    });

    [toggleIG, toggleIGStory, toggleFB].forEach(t => {
        t.addEventListener("change", () => { updateVisibility(); render(); });
    });

    document.querySelectorAll('input[name="webFormat"]').forEach(radio => {
        radio.addEventListener("change", () => {
            updateWebCanvas();
            render();
        });
    });

    zoomSlider.addEventListener("input", (e) => {
        zoom = parseInt(e.target.value) / 100;
        zoomValue.textContent = e.target.value + "%";
        render();
    });

    sourceViewport.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -5 : 5;
        const newVal = clamp(parseInt(zoomSlider.value) + delta, 100, 300);
        zoomSlider.value = newVal;
        zoom = newVal / 100;
        zoomValue.textContent = newVal + "%";
        render();
    }, { passive: false });

    sourceViewport.addEventListener("mousedown", (e) => {
        dragging = true;
        dragStartX = e.clientX; dragStartY = e.clientY;
        dragStartPanX = panX; dragStartPanY = panY;
    });
    window.addEventListener("mousemove", (e) => {
        if (!dragging || !img) return;
        const sourceScale = Math.min(sourceCanvas.width / img.width, sourceCanvas.height / img.height, 1);
        const factor = 1 / (sourceScale * zoom);
        panX = dragStartPanX + (e.clientX - dragStartX) * factor;
        panY = dragStartPanY + (e.clientY - dragStartY) * factor;
        render();
    });
    window.addEventListener("mouseup", () => { dragging = false; });

    sourceViewport.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        dragging = true;
        dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY;
        dragStartPanX = panX; dragStartPanY = panY;
    }, { passive: true });
    sourceViewport.addEventListener("touchmove", (e) => {
        if (!dragging || e.touches.length !== 1 || !img) return;
        e.preventDefault();
        const sourceScale = Math.min(sourceCanvas.width / img.width, sourceCanvas.height / img.height, 1);
        const factor = 1 / (sourceScale * zoom);
        panX = dragStartPanX + (e.touches[0].clientX - dragStartX) * factor;
        panY = dragStartPanY + (e.touches[0].clientY - dragStartY) * factor;
        render();
    }, { passive: false });
    sourceViewport.addEventListener("touchend", () => { dragging = false; });

    btnReset.addEventListener("click", () => {
        zoom = 1; panX = 0; panY = 0;
        zoomSlider.value = 100;
        zoomValue.textContent = "100%";
        render();
    });

    btnChangeImage.addEventListener("click", () => {
        saveCurrentState();
        editorSection.style.display = "none";
        uploadSection.style.display = "block";
        fileInput.value = "";
        imageQueue = [];
        img = null;
    });

    btnPrev.addEventListener("click", () => {
        if (currentIndex > 0) loadImageAtIndex(currentIndex - 1);
    });
    btnNext.addEventListener("click", () => {
        if (currentIndex < imageQueue.length - 1) loadImageAtIndex(currentIndex + 1);
    });

    btnDownloadIG.addEventListener("click", () => {
        const out = socialOutputInfo();
        const f = SOCIAL_FORMATS.ig;
        downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext);
    });
    btnDownloadIGStory.addEventListener("click", () => {
        const out = socialOutputInfo();
        const f = SOCIAL_FORMATS.igstory;
        downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext);
    });
    btnDownloadFB.addEventListener("click", () => {
        const out = socialOutputInfo();
        const f = SOCIAL_FORMATS.fb;
        downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext);
    });
    btnDownloadFB43.addEventListener("click", () => {
        const out = socialOutputInfo();
        const f = SOCIAL_FORMATS.fb43;
        downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext);
    });
    btnDownloadCustom.addEventListener("click", () => {
        const out = socialOutputInfo();
        downloadFormat(CUSTOM_FORMAT.w, CUSTOM_FORMAT.h, CUSTOM_FORMAT.prefix, out.mime, out.ext);
    });

    btnDownloadAll.addEventListener("click", () => {
        saveCurrentState();
        if (currentMode === "social") {
            const out = socialOutputInfo();
            let delay = 0;
            for (const key of Object.keys(SOCIAL_MAP)) {
                if (SOCIAL_MAP[key].toggle.checked) {
                    const f = key === "custom" ? CUSTOM_FORMAT : SOCIAL_FORMATS[key];
                    setTimeout(() => downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext), delay);
                    delay += 300;
                }
            }
        } else {
            const webKey = selectedWebFormatKey();
            if (!webKey) return;
            const out = webOutputInfo();
            const f = WEB_FORMATS[webKey];
            downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext);
        }
    });

    btnDownloadWeb.addEventListener("click", () => {
        const key = selectedWebFormatKey();
        if (!key) return;
        const out = webOutputInfo();
        const f = WEB_FORMATS[key];
        downloadFormat(f.w, f.h, f.prefix, out.mime, out.ext);
    });

    btnBatchDownload.addEventListener("click", () => {
        batchDownloadAll();
    });

})();
