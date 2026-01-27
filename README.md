```text
    _    _           _   _      _    _           _   _ 
   / \  | | ___ _ __| |_| |    / \  | | ___ _ __| |_| |
  / _ \ | |/ _ \ '__| __| |   / _ \ | |/ _ \ '__| __| |
 / ___ \| |  __/ |  | |_|_|  / ___ \| |  __/ |  | |_|_|
/_/   \_\_|\___|_|   \__(_) /_/   \_\_|\___|_|   \__(_)
```

**The ultimate desktop tool for creating stream alerts from YouTube clips.**

Download any YouTube video segment, crop it to your desired aspect ratio, normalize audio, add end buffers, and export perfectly formatted alert videos — all in one streamlined workflow.

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-green?logo=flask&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Powered-orange?logo=ffmpeg&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 🎬 Video Processing
- **YouTube Download** — Download clips directly from YouTube with precise start/end timestamp selection
- **Live Video Preview** — Real-time video playback with audio in the crop preview (not just static images)
- **Precision Trimming** — Fine-tune start and end times with dual sliders after download
- **Multiple Aspect Ratios** — Export in 1:1 (square), 16:9 (widescreen), 9:16 (vertical/TikTok), or 4:3
- **Resolution Options** — Export at 480p, 720p, or 1080p
- **Interactive Crop** — Drag to position your crop area, zoom slider to adjust size

### 🔊 Audio
- **Audio Normalization** — Automatic loudness normalization (EBU R128, -16 LUFS) — toggleable
- **Separate Audio Source** — Use audio from a completely different YouTube video
- **High-Quality Output** — Lossless audio processing pipeline with single-encode AAC at 192kbps

### 🎨 User Experience
- **Dark Mode Interface** — Easy on the eyes during late-night editing sessions
- **End Buffer** — Configurable still frame buffer at the end (0-5 seconds) for smooth alert transitions
- **Smart Timestamps** — Type `90` and it auto-formats to `1:30`
- **Persistent Settings** — Your preferences (resolution, buffer, normalization) are saved locally
- **Standalone EXE** — Single executable file, no installation required

---

## 📋 Requirements

### System Dependencies

These must be installed on your system and available in PATH:

| Tool | Install Command (Windows) | Purpose |
|------|---------------------------|---------|
| **FFmpeg** | `winget install Gyan.FFmpeg` | Video/audio processing |
| **yt-dlp** | `pip install yt-dlp` | YouTube downloads |

### Python Dependencies (for running from source)

```bash
pip install -r requirements.txt
```

**Contents of `requirements.txt`:**
```
flask>=2.0.0
waitress>=2.0.0
yt-dlp>=2023.0.0
Pillow>=10.0
```

---

## 🚀 Quick Start

### Option 1: Download the EXE (Recommended)

1. Download `AlertAlert.exe` from [Releases](https://github.com/thedeutschmark/alert-alert/releases)
2. Double-click to run
3. Your browser will open automatically to the app interface
4. Keep the console window open while using the app

### Option 2: Run from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/thedeutschmark/alert-alert.git
   cd alert-alert
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the app**
   ```bash
   python app.py
   ```

4. **Open in browser** (should open automatically)
   ```
   http://127.0.0.1:5000
   ```

---

## 📖 How to Use

### Step 1: Enter YouTube URL
- Paste any YouTube video URL
- Optionally set start and end timestamps (e.g., `1:30` to `2:45`)
- Click **Validate** to check the URL

### Step 2: Download & Preview
- Click **Download Clip** to fetch the video segment
- Use the **Trim Sliders** for precise start/end adjustments
- Play/pause the preview with audio to verify your selection

### Step 3: Crop & Adjust
- **Drag** the video to position the crop area
- Use the **Zoom Slider** to adjust crop size
- Select your **Aspect Ratio** (1:1, 16:9, 9:16, 4:3)

### Step 4: Process & Export
- Choose your **Resolution** (480p, 720p, 1080p)
- Set **End Buffer** duration (0-5 seconds)
- Toggle **Audio Normalization** on/off
- Click **Process** and wait for the magic
- **Download** your finished alert video!

---

## ⚙️ Settings

Access settings via the gear icon in the top-right corner:

| Setting | Options | Description |
|---------|---------|-------------|
| **Resolution** | 480p, 720p, 1080p | Output video resolution |
| **Aspect Ratio** | 1:1, 16:9, 9:16, 4:3 | Crop shape |
| **End Buffer** | 0-5 seconds | Still frame at end of video |
| **Normalize Audio** | On/Off | EBU R128 loudness normalization |

All settings are saved to your browser's local storage.

---

## 🏗️ Building the EXE

To build your own executable:

```bash
pip install pyinstaller
python -m PyInstaller --name "AlertAlert" --add-data "static;static" --icon=static/favicon.ico --clean --onefile app.py
```

The output will be in the `dist/` folder.

---

## 📁 Project Structure

```
alert-alert/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css   # Dark mode styling
│   ├── js/
│   │   ├── app.js      # Main application logic
│   │   └── crop.js     # Crop preview functionality
│   ├── img/
│   │   └── logo.png    # App logo
│   ├── index.html      # Single-page application
│   └── favicon.ico     # App icon
├── output/             # Processed videos saved here
├── temp/               # Temporary processing files
└── README.md
```

---

## 🐛 Troubleshooting

### "FFmpeg not found"
Make sure FFmpeg is installed and in your PATH:
```bash
winget install Gyan.FFmpeg
```
Then restart the app.

### "yt-dlp not found"
Install yt-dlp:
```bash
pip install yt-dlp
```

### Video won't play in preview
- Ensure the clip downloaded successfully
- Try a different YouTube URL
- Check that FFmpeg is working

### Port 5000 already in use
Another application is using port 5000. Close it or modify `app.py` to use a different port.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

Created by **deutschmark**

Built with:
- [Flask](https://flask.palletsprojects.com/) — Web framework
- [FFmpeg](https://ffmpeg.org/) — Video processing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — YouTube downloads
- [Waitress](https://docs.pylonsproject.org/projects/waitress/) — Production WSGI server

---

**Made with ❤️ for streamers**
