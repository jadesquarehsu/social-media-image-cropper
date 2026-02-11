/* ============================================================
   Social Media Image Cropper – app.js
   ============================================================ */
(() => {
    'use strict';

    // ── Format Definitions ──────────────────────────────────────
    const FORMATS = {
        'ig-story': { w: 1080, h: 1920, label: 'IG-Story' },
        'ig-post': { w: 1080, h: 1350, label: 'IG-Post' },
        'fb-standard': { w: 1200, h: 1200, label: 'FB-Standard' },
    };

    // ── State ───────────────────────────────────────────────────
    const state = {
        images: [],          // { file, img, name }
        activeIndex: 0,
        activeCrop: 'ig-story',
        outputFormat: 'jpeg', // 'jpeg' | 'webp'
        quality: 0.92,
        watermark: {
            enabled: false,
            text: '© My Brand',
            position: 'bottom-right',
            opacity: 0.4,
        },
        // Canvas pan/zoom
        zoom: 1,
        panX: 0,
        panY: 0,
        dragging: false,
        dragStart: { x: 0, y: 0 },
        panStart: { x: 0, y: 0 },
    };

    // ── DOM refs ────────────────────────────────────────────────
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const uploadZone = $('#uploadZone');
    const fileInput = $('#fileInput');
    const canvasWrapper = $('#canvasWrapper');
    const canvas = $('#cropCanvas');
    const ctx = canvas.getContext('2d');
    const thumbnailStrip = $('#thumbnailStrip');
    const zoomSlider = $('#zoomSlider');
    const zoomLabel = $('#zoomLabel');
    const btnZoomIn = $('#btnZoomIn');
    const btnZoomOut = $('#btnZoomOut');
    const btnResetView = $('#btnResetView');
    const btnExport = $('#btnExport');
    const btnExportAll = $('#btnExportAll');
    const btnNewImage = $('#btnNewImage');
    const watermarkToggle = $('#watermarkToggle');
    const watermarkOptions = $('#watermarkOptions');
    const watermarkText = $('#watermarkText');
    const watermarkPosition = $('#watermarkPosition');
    const watermarkOpacity = $('#watermarkOpacity');
    const opacityLabel = $('#opacityLabel');
    const qualitySlider = $('#qualitySlider');
    const qualityLabel = $('#qualityLabel');
    const toast = $('#toast');

    // ── Helpers ─────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
        toast.textContent = msg;
        toast.className = `toast ${type} show`;
        clearTimeout(toast._tid);
        toast._tid = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function stripExt(name) {
        return name.replace(/\.[^.]+$/, '');
    }

    function getSelectedFormats() {
        const checked = [];
        $$('input[name="format"]:checked').forEach(cb => checked.push(cb.value));
        return checked;
    }

    function enableExportButtons(en) {
        btnExport.disabled = !en;
        btnExportAll.disabled = !en;
    }

    // ── Upload ──────────────────────────────────────────────────
    uploadZone.addEventListener('click', () => fileInput.click());
    btnNewImage.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFiles(fileInput.files);
    });

    function handleFiles(files) {
        const imageFiles = [...files].filter(f => f.type.startsWith('image/'));
        if (!imageFiles.length) { showToast('請選擇圖片檔案', 'error'); return; }

        let loaded = 0;
        imageFiles.forEach(file => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = (e) => {
                img.onload = () => {
                    state.images.push({ file, img, name: stripExt(file.name) });
                    loaded++;
                    if (loaded === imageFiles.length) {
                        state.activeIndex = state.images.length - imageFiles.length;
                        onImagesReady();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function onImagesReady() {
        uploadZone.classList.add('hidden');
        canvasWrapper.classList.remove('hidden');
        btnNewImage.classList.remove('hidden');
        enableExportButtons(true);
        buildThumbnails();
        resetView();
        drawCanvas();
    }

    // ── Thumbnails ──────────────────────────────────────────────
    function buildThumbnails() {
        thumbnailStrip.innerHTML = '';
        if (state.images.length <= 1) {
            thumbnailStrip.classList.add('hidden');
            return;
        }
        thumbnailStrip.classList.remove('hidden');
        state.images.forEach((item, i) => {
            const el = document.createElement('img');
            el.src = item.img.src;
            el.className = `thumb${i === state.activeIndex ? ' active' : ''}`;
            el.addEventListener('click', () => {
                state.activeIndex = i;
                resetView();
                drawCanvas();
                $$('.thumb').forEach((t, j) => t.classList.toggle('active', j === i));
            });
            thumbnailStrip.appendChild(el);
        });
    }

    // ── Canvas Drawing ──────────────────────────────────────────
    function getAspect() {
        const f = FORMATS[state.activeCrop];
        return f.w / f.h;
    }

    function canvasSize() {
        const rect = canvasWrapper.getBoundingClientRect();
        const cw = rect.width;
        const aspect = getAspect();
        // Determine canvas height based on aspect, but cap it
        let ch = cw / aspect;
        if (ch > 700) { ch = 700; }
        return { cw, ch };
    }

    function resetView() {
        const { cw, ch } = canvasSize();
        const item = state.images[state.activeIndex];
        if (!item) return;
        const img = item.img;
        // Fit image to cover the canvas area
        const scaleX = cw / img.width;
        const scaleY = ch / img.height;
        const scale = Math.max(scaleX, scaleY);
        state.zoom = scale;
        state.panX = (cw - img.width * scale) / 2;
        state.panY = (ch - img.height * scale) / 2;
        zoomSlider.value = Math.round(scale * 100);
        zoomLabel.textContent = Math.round(scale * 100) + '%';
    }

    function drawCanvas() {
        const { cw, ch } = canvasSize();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        canvas.style.height = ch + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, cw, ch);

        const item = state.images[state.activeIndex];
        if (!item) return;
        const img = item.img;

        // Draw image
        const drawW = img.width * state.zoom;
        const drawH = img.height * state.zoom;
        ctx.drawImage(img, state.panX, state.panY, drawW, drawH);

        // Draw guide lines (rule of thirds) with shadow for contrast
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 2; i++) {
            // Vertical
            const x = Math.round((cw / 3) * i) + 0.5;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
            // Horizontal
            const y = Math.round((ch / 3) * i) + 0.5;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
        }

        // Center crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 5]);
        const midX = Math.round(cw / 2) + 0.5;
        const midY = Math.round(ch / 2) + 0.5;
        ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, ch); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(cw, midY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Border
        ctx.strokeStyle = 'rgba(138, 120, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);

        // Watermark preview
        if (state.watermark.enabled && state.watermark.text) {
            drawWatermark(ctx, cw, ch, state.watermark, 0.5);
        }
    }

    function drawWatermark(context, w, h, wm, previewScale = 1) {
        const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.04 * previewScale));
        context.save();
        context.font = `${fontSize}px Inter, sans-serif`;
        context.fillStyle = `rgba(255, 255, 255, ${wm.opacity})`;
        context.textBaseline = 'bottom';
        const pad = Math.round(fontSize * 1.2);
        const textW = context.measureText(wm.text).width;
        let tx, ty;
        switch (wm.position) {
            case 'bottom-right': tx = w - textW - pad; ty = h - pad; break;
            case 'bottom-left': tx = pad; ty = h - pad; break;
            case 'top-right': tx = w - textW - pad; ty = pad + fontSize; break;
            case 'top-left': tx = pad; ty = pad + fontSize; break;
            case 'center': tx = (w - textW) / 2; ty = h / 2 + fontSize / 2; break;
            default: tx = w - textW - pad; ty = h - pad;
        }
        context.fillText(wm.text, tx, ty);
        context.restore();
    }

    // ── Pan & Zoom ──────────────────────────────────────────────
    canvas.addEventListener('mousedown', (e) => {
        state.dragging = true;
        state.dragStart = { x: e.clientX, y: e.clientY };
        state.panStart = { x: state.panX, y: state.panY };
    });

    window.addEventListener('mousemove', (e) => {
        if (!state.dragging) return;
        state.panX = state.panStart.x + (e.clientX - state.dragStart.x);
        state.panY = state.panStart.y + (e.clientY - state.dragStart.y);
        drawCanvas();
    });

    window.addEventListener('mouseup', () => { state.dragging = false; });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            state.dragging = true;
            state.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            state.panStart = { x: state.panX, y: state.panY };
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!state.dragging || e.touches.length !== 1) return;
        state.panX = state.panStart.x + (e.touches[0].clientX - state.dragStart.x);
        state.panY = state.panStart.y + (e.touches[0].clientY - state.dragStart.y);
        drawCanvas();
    }, { passive: true });

    canvas.addEventListener('touchend', () => { state.dragging = false; });

    // Wheel zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        applyZoom(state.zoom * (1 + delta), e.offsetX, e.offsetY);
    }, { passive: false });

    function applyZoom(newZoom, cx, cy) {
        const { cw, ch } = canvasSize();
        cx = cx ?? cw / 2;
        cy = cy ?? ch / 2;
        newZoom = Math.max(0.1, Math.min(5, newZoom));
        // Zoom around cursor
        const ratio = newZoom / state.zoom;
        state.panX = cx - (cx - state.panX) * ratio;
        state.panY = cy - (cy - state.panY) * ratio;
        state.zoom = newZoom;
        zoomSlider.value = Math.round(newZoom * 100);
        zoomLabel.textContent = Math.round(newZoom * 100) + '%';
        drawCanvas();
    }

    zoomSlider.addEventListener('input', () => {
        const newZoom = parseInt(zoomSlider.value) / 100;
        applyZoom(newZoom);
    });

    btnZoomIn.addEventListener('click', () => applyZoom(state.zoom * 1.15));
    btnZoomOut.addEventListener('click', () => applyZoom(state.zoom / 1.15));
    btnResetView.addEventListener('click', () => { resetView(); drawCanvas(); });

    // ── Crop Selector ───────────────────────────────────────────
    $$('.crop-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.crop-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeCrop = btn.dataset.crop;
            resetView();
            drawCanvas();
        });
    });

    // ── Format Cards Toggle ────────────────────────────────────
    $$('.format-card').forEach(card => {
        card.addEventListener('click', () => {
            const cb = card.querySelector('input[type="checkbox"]');
            // toggle happens automatically, just update style
            requestAnimationFrame(() => {
                card.classList.toggle('active', cb.checked);
            });
        });
    });

    // ── Watermark Controls ─────────────────────────────────────
    watermarkToggle.addEventListener('change', () => {
        state.watermark.enabled = watermarkToggle.checked;
        watermarkOptions.classList.toggle('hidden', !watermarkToggle.checked);
        drawCanvas();
    });

    watermarkText.addEventListener('input', () => {
        state.watermark.text = watermarkText.value;
        drawCanvas();
    });

    watermarkPosition.addEventListener('change', () => {
        state.watermark.position = watermarkPosition.value;
        drawCanvas();
    });

    watermarkOpacity.addEventListener('input', () => {
        const v = parseInt(watermarkOpacity.value) / 100;
        state.watermark.opacity = v;
        opacityLabel.textContent = Math.round(v * 100) + '%';
        drawCanvas();
    });

    // ── Quality & Output Format ────────────────────────────────
    qualitySlider.addEventListener('input', () => {
        state.quality = parseInt(qualitySlider.value) / 100;
        qualityLabel.textContent = qualitySlider.value + '%';
    });

    $$('.fmt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.fmt-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.outputFormat = btn.dataset.fmt;
        });
    });

    // ── Export ──────────────────────────────────────────────────
    function renderExport(item, formatKey) {
        const fmt = FORMATS[formatKey];
        const offCanvas = document.createElement('canvas');
        offCanvas.width = fmt.w;
        offCanvas.height = fmt.h;
        const offCtx = offCanvas.getContext('2d');

        // We need to map the current view (panX, panY, zoom relative to the preview canvas)
        // to the export canvas (fmt.w × fmt.h).
        const { cw, ch } = canvasSize();
        const scaleX = fmt.w / cw;
        const scaleY = fmt.h / ch;

        // Source image drawing in export coords
        const img = item.img;
        const drawW = img.width * state.zoom * scaleX;
        const drawH = img.height * state.zoom * scaleY;
        const drawX = state.panX * scaleX;
        const drawY = state.panY * scaleY;

        offCtx.fillStyle = '#000';
        offCtx.fillRect(0, 0, fmt.w, fmt.h);
        offCtx.drawImage(img, drawX, drawY, drawW, drawH);

        // Watermark
        if (state.watermark.enabled && state.watermark.text) {
            drawWatermark(offCtx, fmt.w, fmt.h, state.watermark, 1);
        }

        return offCanvas;
    }

    function canvasToBlob(canvas) {
        return new Promise(resolve => {
            const mime = state.outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
            canvas.toBlob(blob => resolve(blob), mime, state.quality);
        });
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function getFilename(item, formatKey) {
        const ext = state.outputFormat === 'webp' ? 'webp' : 'jpg';
        return `${item.name}_${FORMATS[formatKey].label}.${ext}`;
    }

    // Export selected formats for current image
    btnExport.addEventListener('click', async () => {
        const formats = getSelectedFormats();
        if (!formats.length) { showToast('請至少選擇一種輸出格式', 'error'); return; }
        const item = state.images[state.activeIndex];
        if (!item) return;

        btnExport.disabled = true;
        btnExport.textContent = '匯出中…';

        if (formats.length === 1) {
            const c = renderExport(item, formats[0]);
            const blob = await canvasToBlob(c);
            downloadBlob(blob, getFilename(item, formats[0]));
            showToast('✓ 已下載 ' + getFilename(item, formats[0]));
        } else {
            // Multiple → zip
            const zip = new JSZip();
            for (const f of formats) {
                const c = renderExport(item, f);
                const blob = await canvasToBlob(c);
                zip.file(getFilename(item, f), blob);
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadBlob(zipBlob, `${item.name}_export.zip`);
            showToast(`✓ 已下載 ${formats.length} 張圖片 (ZIP)`);
        }

        btnExport.disabled = false;
        btnExport.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>匯出選取格式`;
    });

    // Export all images × all selected formats
    btnExportAll.addEventListener('click', async () => {
        const formats = getSelectedFormats();
        if (!formats.length) { showToast('請至少選擇一種輸出格式', 'error'); return; }
        if (!state.images.length) return;

        btnExportAll.disabled = true;
        btnExportAll.textContent = '打包中…';

        const zip = new JSZip();
        // We need to render each image with its own view settings.
        // For batch, we auto-fit each image.
        for (const item of state.images) {
            for (const f of formats) {
                const c = renderBatchExport(item, f);
                const blob = await canvasToBlob(c);
                zip.file(getFilename(item, f), blob);
            }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const totalFiles = state.images.length * formats.length;
        downloadBlob(zipBlob, `social_media_export.zip`);
        showToast(`✓ 已下載 ${totalFiles} 張圖片 (ZIP)`);

        btnExportAll.disabled = false;
        btnExportAll.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>全部匯出 (ZIP)`;
    });

    // Batch export: auto-fit (cover) for images other than the currently-viewed one
    function renderBatchExport(item, formatKey) {
        const fmt = FORMATS[formatKey];
        const offCanvas = document.createElement('canvas');
        offCanvas.width = fmt.w;
        offCanvas.height = fmt.h;
        const offCtx = offCanvas.getContext('2d');
        const img = item.img;

        // If this is the currently active image, use current view
        if (item === state.images[state.activeIndex]) {
            const { cw, ch } = canvasSize();
            const scaleX = fmt.w / cw;
            const scaleY = fmt.h / ch;
            const drawW = img.width * state.zoom * scaleX;
            const drawH = img.height * state.zoom * scaleY;
            const drawX = state.panX * scaleX;
            const drawY = state.panY * scaleY;
            offCtx.fillStyle = '#000';
            offCtx.fillRect(0, 0, fmt.w, fmt.h);
            offCtx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            // Auto-fit: cover
            const scale = Math.max(fmt.w / img.width, fmt.h / img.height);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            const drawX = (fmt.w - drawW) / 2;
            const drawY = (fmt.h - drawH) / 2;
            offCtx.fillStyle = '#000';
            offCtx.fillRect(0, 0, fmt.w, fmt.h);
            offCtx.drawImage(img, drawX, drawY, drawW, drawH);
        }

        // Watermark
        if (state.watermark.enabled && state.watermark.text) {
            drawWatermark(offCtx, fmt.w, fmt.h, state.watermark, 1);
        }

        return offCanvas;
    }

    // ── Window Resize ───────────────────────────────────────────
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (state.images.length) {
                resetView();
                drawCanvas();
            }
        }, 100);
    });

})();
