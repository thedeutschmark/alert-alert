/**
 * Caption Editor — interactive UI for editing auto-generated captions.
 * Allows toggling lines, editing text, reassigning speakers, and changing colors.
 */
const CaptionEditor = (() => {
    let projectId = "";
    let words = [];
    let lines = [];
    let speakers = {};
    let style = {};
    let stylePresets = {};
    let dirty = false;
    let controlsBound = false;

    const $ = (id) => document.getElementById(id);

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function formatTime(seconds) {
        if (!seconds || seconds < 0) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    // ── Init ──────────────────────────────────────────────────────

    let activeCaptionLineIndex = -1;

    async function init(pId) {
        projectId = pId;
        dirty = false;
        bindStyleControls();
        bindCaptionKeyNav();
        bindPlaybackSync();
        await loadCaptions();
    }

    function bindPlaybackSync() {
        const video = document.getElementById("reel-preview-video");
        if (!video || video._captionSyncBound) return;
        video._captionSyncBound = true;
        video.addEventListener("timeupdate", () => {
            if (!lines.length) return;
            const t = video.currentTime;
            const idx = lines.findIndex((l) => t >= l.start - 0.05 && t <= l.end + 0.05);
            if (idx >= 0 && idx !== activeCaptionLineIndex) {
                activeCaptionLineIndex = idx;
                const container = $("reel-caption-lines");
                if (!container) return;
                container.querySelectorAll(".caption-line").forEach((el, i) => {
                    el.classList.toggle("caption-line-active", i === idx);
                });
                const activeEl = container.querySelectorAll(".caption-line")[idx];
                if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
            }
        });
    }

    function bindCaptionKeyNav() {
        document.addEventListener("keydown", (e) => {
            const editor = $("reel-caption-editor");
            if (!editor || editor.classList.contains("hidden")) return;
            const tag = (e.target.tagName || "").toUpperCase();
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                save();
                return;
            }

            if (e.key === "J" || e.key === "j") {
                e.preventDefault();
                seekToLine(activeCaptionLineIndex + 1);
            } else if (e.key === "K" || e.key === "k") {
                e.preventDefault();
                seekToLine(activeCaptionLineIndex - 1);
            } else if (e.key === "T" || e.key === "t") {
                e.preventDefault();
                if (activeCaptionLineIndex >= 0 && activeCaptionLineIndex < lines.length) {
                    toggleLine(activeCaptionLineIndex);
                }
            }
        });
    }

    function seekToLine(index) {
        if (lines.length === 0) return;
        index = Math.max(0, Math.min(lines.length - 1, index));
        activeCaptionLineIndex = index;
        const line = lines[index];
        const video = document.getElementById("reel-preview-video");
        if (video && Number.isFinite(line.start)) {
            video.currentTime = line.start;
        }
        // Highlight the active line
        const container = $("reel-caption-lines");
        if (container) {
            container.querySelectorAll(".caption-line").forEach((el, i) => {
                el.classList.toggle("caption-line-active", i === index);
            });
            const activeEl = container.querySelectorAll(".caption-line")[index];
            if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
        }
    }

    function reset() {
        projectId = "";
        words = [];
        lines = [];
        speakers = {};
        style = {};
        stylePresets = {};
        dirty = false;
        const speakerPanel = $("reel-speaker-panel");
        const linePanel = $("reel-caption-lines");
        if (speakerPanel) speakerPanel.innerHTML = "";
        if (linePanel) linePanel.innerHTML = "";
        const summary = $("caption-style-summary");
        if (summary) summary.textContent = "Saved with this project.";
    }

    async function loadCaptions() {
        try {
            const resp = await fetch(`/api/reel/captions/${projectId}`);
            const data = await resp.json();
            if (data.error) {
                console.error("Failed to load captions:", data.error);
                return;
            }
            words = data.words || [];
            speakers = data.speakers || {};
            style = data.style || {};
            stylePresets = data.style_presets || {};
            lines = data.lines || groupWordsIntoLines(words);
            renderStylePanel();
            renderSpeakerPanel();
            renderLineList();
            const srtLink = $("caption-srt-download");
            if (srtLink && projectId) {
                srtLink.href = `/api/reel/captions/${projectId}/srt`;
                srtLink.style.display = "";
            }
            const assLink = $("caption-ass-download");
            if (assLink && projectId) {
                assLink.href = `/api/reel/captions/${projectId}/ass`;
                assLink.style.display = "";
            }
        } catch (e) {
            console.error("Failed to load captions:", e);
        }
    }

    // ── Group words into lines (mirror backend logic) ─────────────

    function groupWordsIntoLines(words, maxWords = Number(style.max_words) || 6) {
        const result = [];
        let current = [];

        const flushCurrent = () => {
            if (current.length === 0) return;
            result.push({
                words: [...current],
                speaker: current[0].speaker || "SPEAKER_0",
                start: current[0].start,
                end: current[current.length - 1].end,
                enabled: current[0].enabled !== false,
            });
            current = [];
        };

        for (const word of words) {
            if (current.length > 0) {
                const currentEnabled = current[0].enabled !== false;
                const wordEnabled = word.enabled !== false;
                const currentSpeaker = current[0].speaker || "SPEAKER_0";
                const wordSpeaker = word.speaker || "SPEAKER_0";
                if (currentEnabled !== wordEnabled || currentSpeaker !== wordSpeaker) {
                    flushCurrent();
                }
            }

            current.push(word);
            const text = word.text.trim();
            const isSentenceEnd = text.endsWith(".") || text.endsWith("!") || text.endsWith("?") || text.endsWith(",");
            if (current.length >= maxWords || isSentenceEnd) {
                flushCurrent();
            }
        }
        flushCurrent();
        return result;
    }

    // ── Render speaker panel ──────────────────────────────────────

    function bindStyleControls() {
        if (controlsBound) return;
        controlsBound = true;

        $("caption-style-preset")?.addEventListener("change", (event) => {
            const preset = event.target.value;
            style = { ...(stylePresets[preset] || {}), ...style, ...(stylePresets[preset] || {}), preset };
            regroupLines();
            renderStylePanel();
            markDirty();
        });

        const numericFields = [
            ["caption-style-scale", "font_scale", Number.parseFloat],
            ["caption-style-max-words", "max_words", (value) => Number.parseInt(value, 10)],
            ["caption-style-margin", "margin_v", (value) => Number.parseInt(value, 10)],
            ["caption-style-outline", "outline", Number.parseFloat],
            ["caption-style-shadow", "shadow", Number.parseFloat],
            ["caption-style-background", "background_opacity", (value) => Number.parseInt(value, 10)],
        ];
        numericFields.forEach(([id, key, parser]) => {
            $(id)?.addEventListener("input", (event) => {
                style[key] = parser(event.target.value);
                if (key === "max_words") {
                    regroupLines();
                }
                renderStylePanel();
                markDirty();
            });
        });

        $("caption-style-font")?.addEventListener("change", (event) => {
            style.font_family = event.target.value;
            renderStylePanel();
            markDirty();
        });
        $("caption-style-bold")?.addEventListener("change", (event) => {
            style.bold = Boolean(event.target.checked);
            markDirty();
        });
        $("caption-style-karaoke")?.addEventListener("change", (event) => {
            style.karaoke = Boolean(event.target.checked);
            markDirty();
        });
        $("caption-style-all-caps")?.addEventListener("change", (event) => {
            style.all_caps = Boolean(event.target.checked);
            renderLineList();
            markDirty();
        });
    }

    function flattenLines() {
        const allWords = [];
        for (const line of lines) {
            for (const word of line.words) {
                allWords.push({
                    ...word,
                    enabled: line.enabled,
                    speaker: line.speaker,
                });
            }
        }
        return allWords;
    }

    function regroupLines() {
        words = flattenLines();
        lines = groupWordsIntoLines(words, Number(style.max_words) || 6);
        renderLineList();
    }

    function renderStylePanel() {
        const preset = style.preset || "pathos_clean";
        const summary = $("caption-style-summary");
        if ($("caption-style-preset")) $("caption-style-preset").value = preset;
        if ($("caption-style-font")) $("caption-style-font").value = style.font_family || "Arial";
        if ($("caption-style-scale")) $("caption-style-scale").value = String(style.font_scale ?? 1);
        if ($("caption-style-max-words")) $("caption-style-max-words").value = String(style.max_words ?? 6);
        if ($("caption-style-margin")) $("caption-style-margin").value = String(style.margin_v ?? 120);
        if ($("caption-style-outline")) $("caption-style-outline").value = String(style.outline ?? 4);
        if ($("caption-style-shadow")) $("caption-style-shadow").value = String(style.shadow ?? 2);
        if ($("caption-style-background")) $("caption-style-background").value = String(style.background_opacity ?? 50);
        if ($("caption-style-bold")) $("caption-style-bold").checked = Boolean(style.bold);
        if ($("caption-style-karaoke")) $("caption-style-karaoke").checked = Boolean(style.karaoke);
        if ($("caption-style-all-caps")) $("caption-style-all-caps").checked = Boolean(style.all_caps);

        if ($("caption-style-scale-value")) $("caption-style-scale-value").textContent = `${Number(style.font_scale || 1).toFixed(2)}x`;
        if ($("caption-style-max-words-value")) $("caption-style-max-words-value").textContent = `${Number(style.max_words || 6)} words`;
        if ($("caption-style-margin-value")) $("caption-style-margin-value").textContent = `${Number(style.margin_v || 120)}px`;
        if ($("caption-style-outline-value")) $("caption-style-outline-value").textContent = `${Number(style.outline || 0).toFixed(1)}`;
        if ($("caption-style-shadow-value")) $("caption-style-shadow-value").textContent = `${Number(style.shadow || 0).toFixed(1)}`;
        if ($("caption-style-background-value")) $("caption-style-background-value").textContent = `${Number(style.background_opacity || 0)}%`;

        if (summary) {
            const presetLabel = $("caption-style-preset")?.selectedOptions?.[0]?.textContent || "Custom";
            summary.textContent = `${presetLabel} · ${style.font_family || "Arial"} · ${Number(style.max_words || 6)} words/line`;
        }

        updateCaptionPreview();
    }

    function updateCaptionPreview() {
        const el = $("caption-preview-text");
        if (!el) return;

        const fontFamily = style.font_family || "Arial";
        const fontScale  = Number(style.font_scale ?? 1);
        const bold       = style.bold !== false;
        const allCaps    = Boolean(style.all_caps);
        const outline    = Number(style.outline ?? 4);
        const bgOpacity  = Number(style.background_opacity ?? 50) / 100;

        el.style.fontFamily  = fontFamily;
        el.style.fontSize    = `${Math.round(fontScale * 17)}px`;
        el.style.fontWeight  = bold ? "700" : "400";
        el.style.textTransform = allCaps ? "uppercase" : "none";
        el.style.backgroundColor = `rgba(0,0,0,${(bgOpacity * 0.85).toFixed(2)})`;
        el.style.padding     = bgOpacity > 0 ? "4px 10px" : "4px 2px";

        // Approximate outline with stacked text-shadow
        if (outline > 0) {
            const o = Math.max(1, Math.round(outline));
            el.style.textShadow = [
                `-${o}px -${o}px 0 #000`, `${o}px -${o}px 0 #000`,
                `-${o}px  ${o}px 0 #000`, `${o}px  ${o}px 0 #000`,
            ].join(", ");
        } else {
            el.style.textShadow = "none";
        }

        el.textContent = allCaps ? "SAMPLE CAPTION TEXT" : "Sample caption text";
    }

    function renderSpeakerPanel() {
        const container = $("reel-speaker-panel");
        if (!container) return;
        container.innerHTML = "";

        for (const [id, data] of Object.entries(speakers)) {
            const badge = document.createElement("div");
            badge.className = "speaker-badge";
            badge.innerHTML = `
                <input type="color" value="${data.color}"
                       onchange="CaptionEditor.updateSpeakerColor('${escapeHtml(id)}', this.value)">
                <span class="speaker-color-dot" style="background:${data.color}" data-speaker="${escapeHtml(id)}"></span>
                <input type="text" value="${escapeHtml(data.name)}"
                       onchange="CaptionEditor.updateSpeakerName('${escapeHtml(id)}', this.value)">
            `;
            container.appendChild(badge);
        }
    }

    // ── Render caption lines ──────────────────────────────────────

    function renderLineList() {
        const container = $("reel-caption-lines");
        if (!container) return;
        container.innerHTML = "";

        lines.forEach((line, i) => {
            const el = document.createElement("div");
            el.className = `caption-line${line.enabled ? "" : " disabled"}`;
            el.dataset.lineIndex = i;

            const speakerColor = speakers[line.speaker]?.color || "#fff";

            // Build speaker dropdown
            const speakerOptions = Object.entries(speakers)
                .map(([id, s]) =>
                    `<option value="${escapeHtml(id)}" ${id === line.speaker ? "selected" : ""}>${escapeHtml(s.name)}</option>`
                )
                .join("");

            const lineText = line.words.map((w) => style.all_caps ? w.text.toUpperCase() : w.text).join(" ");

            const wordChipParts = line.words.map((w, wIdx) => {
                const txt = style.all_caps ? w.text.toUpperCase() : w.text;
                const lowConf = typeof w.confidence === "number" && w.confidence < 0.7;
                const confClass = lowConf ? " word-chip-low-conf" : "";
                const confTitle = lowConf ? ` (confidence: ${Math.round(w.confidence * 100)}%)` : "";
                const splitBtn = wIdx > 0
                    ? `<button class="split-chip-btn" onclick="CaptionEditor.splitLineAt(${i},${wIdx})" title="Split line before '${escapeHtml(txt)}'">&#x2702;</button>`
                    : "";
                return splitBtn + `<span class="word-chip${confClass}" data-start="${w.start}" title="${formatTime(w.start)}${confTitle}">${escapeHtml(txt)}</span>`;
            }).join("");

            el.innerHTML = `
                <input type="checkbox" ${line.enabled ? "checked" : ""}
                       onchange="CaptionEditor.toggleLine(${i})">
                <span class="line-time">${formatTime(line.start)}</span>
                <input type="text" class="line-text" value="${escapeHtml(lineText)}"
                       onchange="CaptionEditor.editLineText(${i}, this.value)">
                <select class="line-speaker" onchange="CaptionEditor.assignSpeaker(${i}, this.value)">
                    ${speakerOptions}
                </select>
                <span class="speaker-color-dot" style="background:${speakerColor}"></span>
                ${i < lines.length - 1 ? `<button class="merge-line-btn" onclick="CaptionEditor.mergeWithNext(${i})" title="Merge with next line">⤵</button>` : ""}
                <div class="word-chips">${wordChipParts}</div>
            `;

            // Attach word-chip click handlers for seek-on-click
            el.querySelectorAll(".word-chip").forEach((chip) => {
                chip.addEventListener("click", () => {
                    const t = parseFloat(chip.dataset.start);
                    if (!Number.isFinite(t)) return;
                    const video = document.getElementById("reel-preview-video");
                    if (video) {
                        video.currentTime = t;
                        video.play().catch(() => {});
                    }
                });
            });

            container.appendChild(el);
        });

        updateCaptionStats();
    }

    // ── Actions ───────────────────────────────────────────────────

    function toggleLine(index) {
        if (index < 0 || index >= lines.length) return;
        lines[index].enabled = !lines[index].enabled;
        // Update the words in this line
        for (const word of lines[index].words) {
            word.enabled = lines[index].enabled;
        }
        renderLineList();
        markDirty();
    }

    function editLineText(index, newText) {
        if (index < 0 || index >= lines.length) return;
        const line = lines[index];
        const newWords = newText.split(/\s+/).filter(Boolean);
        if (newWords.length === 0) return;

        const totalDuration = line.end - line.start;
        const wordDuration = totalDuration / newWords.length;

        line.words = newWords.map((text, j) => ({
            text,
            start: line.start + j * wordDuration,
            end: line.start + (j + 1) * wordDuration,
            speaker: line.speaker,
            confidence: 1.0,
            enabled: line.enabled,
        }));
        markDirty();
    }

    function assignSpeaker(index, speakerId) {
        if (index < 0 || index >= lines.length) return;
        lines[index].speaker = speakerId;
        for (const word of lines[index].words) {
            word.speaker = speakerId;
        }
        renderLineList();
        markDirty();
    }

    function updateSpeakerColor(speakerId, color) {
        if (speakers[speakerId]) {
            speakers[speakerId].color = color;
            renderSpeakerPanel();
            renderLineList();
            markDirty();
        }
    }

    function updateSpeakerName(speakerId, name) {
        if (speakers[speakerId]) {
            speakers[speakerId].name = name;
            markDirty();
        }
    }

    function updateCaptionStats() {
        const el = $("caption-stats");
        if (!el) return;
        const total = lines.length;
        const enabled = lines.filter((l) => l.enabled !== false).length;
        const allWords = lines.flatMap((l) => l.words);
        const wordCount = allWords.length;
        const uncertain = allWords.filter((w) => typeof w.confidence === "number" && w.confidence < 0.7).length;
        el.textContent = `${enabled}/${total} lines · ${wordCount} words${uncertain > 0 ? ` · ⚠ ${uncertain} uncertain` : ""}`;
    }

    function filterLines(query) {
        const q = (query || "").toLowerCase().trim();
        const container = $("reel-caption-lines");
        if (!container) return;
        container.querySelectorAll(".caption-line").forEach((el) => {
            if (!q) {
                el.style.display = "";
                return;
            }
            const text = el.querySelector(".line-text")?.value?.toLowerCase() || "";
            el.style.display = text.includes(q) ? "" : "none";
        });
    }

    function mergeWithNext(index) {
        if (index < 0 || index >= lines.length - 1) return;
        const a = lines[index];
        const b = lines[index + 1];
        a.words = [...a.words, ...b.words];
        a.end = b.end;
        lines.splice(index + 1, 1);
        renderLineList();
        markDirty();
    }

    function splitLineAt(lineIndex, wordIndex) {
        if (lineIndex < 0 || lineIndex >= lines.length) return;
        const line = lines[lineIndex];
        if (wordIndex <= 0 || wordIndex >= line.words.length) return;
        const firstWords = line.words.slice(0, wordIndex);
        const secondWords = line.words.slice(wordIndex);
        const firstLine = {
            words: firstWords,
            speaker: line.speaker,
            start: firstWords[0].start,
            end: firstWords[firstWords.length - 1].end,
            enabled: line.enabled,
        };
        const secondLine = {
            words: secondWords,
            speaker: line.speaker,
            start: secondWords[0].start,
            end: secondWords[secondWords.length - 1].end,
            enabled: line.enabled,
        };
        lines.splice(lineIndex, 1, firstLine, secondLine);
        renderLineList();
        markDirty();
    }

    async function autoSync() {
        const btn = $("caption-auto-sync-btn");
        if (btn) { btn.disabled = true; btn.textContent = "Detecting..."; }
        try {
            const resp = await fetch(`/api/reel/captions/${projectId}/auto-sync`, { method: "POST" });
            const data = await resp.json();
            if (data.error) {
                alert("Auto-sync: " + data.error);
                return;
            }
            const shift = data.suggested_shift || 0;
            const shiftInput = $("caption-time-shift");
            if (shiftInput) shiftInput.value = shift.toFixed(2);
            if (Math.abs(shift) < 0.05) {
                alert("Captions appear well-synced (shift < 0.05s). No adjustment needed.");
            } else {
                const confirmed = confirm(
                    `${data.note}\n\nApply shift of ${shift > 0 ? "+" : ""}${shift.toFixed(2)}s to all captions?`
                );
                if (confirmed) applyTimeShift();
            }
        } catch (e) {
            alert("Auto-sync failed: " + e.message);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = "Auto-Sync"; }
        }
    }

    function replaceAll() {
        const findInput = $("caption-replace-find");
        const withInput = $("caption-replace-with");
        const find = (findInput?.value || "").trim();
        const replace = (withInput?.value ?? "").trim();
        if (!find) return;

        let count = 0;
        const findLower = find.toLowerCase();
        for (const line of lines) {
            for (const word of line.words) {
                if (word.text.toLowerCase() === findLower) {
                    // Preserve original casing style (all-caps / capitalized)
                    const wasCapitalized = word.text[0] === word.text[0].toUpperCase() && word.text.length > 1;
                    word.text = wasCapitalized && replace.length > 0
                        ? replace[0].toUpperCase() + replace.slice(1)
                        : replace;
                    count++;
                }
            }
        }
        if (count > 0) {
            renderLineList();
            markDirty();
        }
        if (findInput) findInput.value = "";
        if (withInput) withInput.value = "";
        // Show brief feedback in stats
        const statsEl = $("caption-stats");
        if (statsEl && count > 0) {
            const prev = statsEl.textContent;
            statsEl.textContent = `Replaced ${count} occurrence${count !== 1 ? "s" : ""} of "${find}"`;
            setTimeout(() => { if (statsEl.textContent.startsWith("Replaced")) updateCaptionStats(); }, 2500);
        }
    }

    function applyTimeShift() {
        const input = $("caption-time-shift");
        const shift = parseFloat(input?.value || "0");
        if (!Number.isFinite(shift) || shift === 0) return;
        for (const line of lines) {
            line.start = Math.max(0, line.start + shift);
            line.end   = Math.max(line.start + 0.01, line.end + shift);
            for (const word of line.words) {
                word.start = Math.max(0, word.start + shift);
                word.end   = Math.max(word.start + 0.01, word.end + shift);
            }
        }
        if (input) input.value = "";
        renderLineList();
        markDirty();
    }

    function enableAll() {
        lines.forEach((line) => {
            line.enabled = true;
            line.words.forEach((w) => { w.enabled = true; });
        });
        renderLineList();
        markDirty();
    }

    function disableAll() {
        lines.forEach((line) => {
            line.enabled = false;
            line.words.forEach((w) => { w.enabled = false; });
        });
        renderLineList();
        markDirty();
    }

    function markDirty() {
        dirty = true;
    }

    // ── Save ──────────────────────────────────────────────────────

    async function save() {
        if (!projectId) return;

        // Flatten lines back to words
        const allWords = [];
        for (const line of lines) {
            for (const word of line.words) {
                allWords.push({
                    ...word,
                    enabled: line.enabled,
                });
            }
        }

        try {
            const resp = await fetch(`/api/reel/captions/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ words: allWords, speakers, style }),
            });
            const data = await resp.json();
            if (data.error) {
                alert("Failed to save captions: " + data.error);
            } else {
                dirty = false;
                if (typeof ReelMaker !== "undefined" && typeof ReelMaker.markExportDirty === "function") {
                    ReelMaker.markExportDirty();
                }
                if (typeof ReelMaker !== "undefined" && typeof ReelMaker.refreshAssets === "function") {
                    ReelMaker.refreshAssets();
                }
                if (typeof ReelMaker !== "undefined" && typeof ReelMaker.attachCaptionTrack === "function") {
                    ReelMaker.attachCaptionTrack();
                }
            }
        } catch (e) {
            alert("Failed to save captions: " + e.message);
        }
    }

    // ── Public API ────────────────────────────────────────────────

    return {
        init,
        toggleLine,
        editLineText,
        assignSpeaker,
        updateSpeakerColor,
        updateSpeakerName,
        enableAll,
        disableAll,
        save,
        reset,
        filterLines,
        replaceAll,
        seekToLine,
        applyTimeShift,
        autoSync,
        mergeWithNext,
        splitLineAt,
        isDirty: () => dirty,
    };
})();
