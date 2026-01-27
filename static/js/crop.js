/**
 * Interactive crop preview component.
 * Displays a video frame with a draggable, resizable square overlay.
 * The area outside the crop is darkened.
 * Zoom slider controls the crop square size (smaller = more zoomed in).
 */
class CropPreview {
    constructor() {
        this.container = document.getElementById("crop-container");
        this.image = document.getElementById("crop-image");
        this.overlay = document.getElementById("crop-overlay");
        this.coordsDisplay = document.getElementById("crop-coords");
        this.zoomSlider = document.getElementById("zoom-slider");
        this.zoomValue = document.getElementById("zoom-value");

        this.videoWidth = 0;
        this.videoHeight = 0;
        this.displayWidth = 0;
        this.displayHeight = 0;
        this.scale = 1;

        // Zoom: 100% = full min-dimension square, lower = smaller crop (more zoomed)
        this.zoomPct = 100;

        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.overlayStartX = 0;
        this.overlayStartY = 0;

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);

        this._setupEvents();
    }

    /**
     * Initialize with actual video dimensions.
     * Call after the preview image has loaded.
     */
    initialize(videoWidth, videoHeight) {
        this.videoWidth = videoWidth;
        this.videoHeight = videoHeight;

        // Wait for image to render, then measure
        requestAnimationFrame(() => {
            const rect = this.image.getBoundingClientRect();
            this.displayWidth = rect.width;
            this.displayHeight = rect.height;
            this.scale = this.displayWidth / this.videoWidth;

            // Set container size to match image
            this.container.style.width = this.displayWidth + "px";
            this.container.style.height = this.displayHeight + "px";

            // Apply current zoom
            this._applyZoom();
            this.overlay.style.display = "block";
        });
    }

    /**
     * Returns crop parameters in original video pixel coordinates.
     */
    getCropParams() {
        const cropDisplaySize = parseFloat(this.overlay.style.width);
        const displayX = parseFloat(this.overlay.style.left) || 0;
        const displayY = parseFloat(this.overlay.style.top) || 0;

        return {
            x: Math.round(displayX / this.scale),
            y: Math.round(displayY / this.scale),
            size: Math.round(cropDisplaySize / this.scale),
        };
    }

    _setupEvents() {
        // Mouse drag
        this.overlay.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this._startDrag(e.clientX, e.clientY);
        });
        document.addEventListener("mousemove", this._onMouseMove);
        document.addEventListener("mouseup", this._onMouseUp);

        // Touch drag
        this.overlay.addEventListener("touchstart", (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._startDrag(touch.clientX, touch.clientY);
        }, { passive: false });
        document.addEventListener("touchmove", this._onTouchMove, { passive: false });
        document.addEventListener("touchend", this._onTouchEnd);

        // Zoom slider
        if (this.zoomSlider) {
            this.zoomSlider.addEventListener("input", () => {
                this.zoomPct = parseInt(this.zoomSlider.value);
                if (this.zoomValue) {
                    this.zoomValue.textContent = this.zoomPct + "%";
                }
                if (this.displayWidth > 0) {
                    this._applyZoom();
                }
            });
        }
    }

    _applyZoom() {
        const maxCropDisplay = Math.min(this.displayWidth, this.displayHeight);
        const minCropDisplay = maxCropDisplay * 0.1; // 10% minimum
        const cropDisplaySize = minCropDisplay + (maxCropDisplay - minCropDisplay) * (this.zoomPct / 100);

        const oldSize = parseFloat(this.overlay.style.width) || cropDisplaySize;
        const oldX = parseFloat(this.overlay.style.left) || 0;
        const oldY = parseFloat(this.overlay.style.top) || 0;

        // Keep center position when resizing
        const oldCenterX = oldX + oldSize / 2;
        const oldCenterY = oldY + oldSize / 2;

        let newX = oldCenterX - cropDisplaySize / 2;
        let newY = oldCenterY - cropDisplaySize / 2;

        // Clamp to bounds
        const maxX = this.displayWidth - cropDisplaySize;
        const maxY = this.displayHeight - cropDisplaySize;
        newX = Math.max(0, Math.min(maxX, newX));
        newY = Math.max(0, Math.min(maxY, newY));

        this.overlay.style.width = cropDisplaySize + "px";
        this.overlay.style.height = cropDisplaySize + "px";
        this.overlay.style.left = newX + "px";
        this.overlay.style.top = newY + "px";

        this._updateCoords();
    }

    _startDrag(clientX, clientY) {
        this.isDragging = true;
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.overlayStartX = parseFloat(this.overlay.style.left) || 0;
        this.overlayStartY = parseFloat(this.overlay.style.top) || 0;
        this.overlay.classList.add("dragging");
    }

    _onMouseMove(e) {
        if (!this.isDragging) return;
        this._moveDrag(e.clientX, e.clientY);
    }

    _onMouseUp() {
        this._endDrag();
    }

    _onTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        this._moveDrag(touch.clientX, touch.clientY);
    }

    _onTouchEnd() {
        this._endDrag();
    }

    _moveDrag(clientX, clientY) {
        const dx = clientX - this.dragStartX;
        const dy = clientY - this.dragStartY;

        const cropSize = parseFloat(this.overlay.style.width);
        const maxX = this.displayWidth - cropSize;
        const maxY = this.displayHeight - cropSize;

        const newX = Math.max(0, Math.min(maxX, this.overlayStartX + dx));
        const newY = Math.max(0, Math.min(maxY, this.overlayStartY + dy));

        this.overlay.style.left = newX + "px";
        this.overlay.style.top = newY + "px";

        this._updateCoords();
    }

    _endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.overlay.classList.remove("dragging");
    }

    _updateCoords() {
        const params = this.getCropParams();
        if (this.coordsDisplay) {
            this.coordsDisplay.textContent = `Crop: X=${params.x} Y=${params.y} Size=${params.size}`;
        }
    }
}
