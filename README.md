# deutschmark's Alert! Alert!

```text
    _    _           _   _      _    _           _   _ 
   / \  | | ___ _ __| |_| |    / \  | | ___ _ __| |_| |
  / _ \ | |/ _ \ '__| __| |   / _ \ | |/ _ \ '__| __| |
 / ___ \| |  __/ |  | |_|_|  / ___ \| |  __/ |  | |_|_|
/_/   \_\_|\___|_|   \__(_) /_/   \_\_|\___|_|   \__(_)
```

**The ultimate desktop tool for creating stream alerts from YouTube clips.**

Now featuring a sleek, native GUI, live video previews, and precision trimming controls. Download, crop, normalize audio, and export perfectly formatted alert videos in seconds.

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-green?logo=flask&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **YouTube Download** - Download clips directly from YouTube with precise timestamp selection
- **Native Desktop App** - Standalone GUI window (dark mode) for a premium experience
- **Live Video Preview** - Verify crops with real-time video playback and audio (no more static images)
- **Precision Trimming** - Fine-tune start and end times with dual sliders
- **Multiple Aspect Ratios** - 1:1, 16:9, 9:16, 4:3
- **Resolution Options** - Export at 480p, 720p, or 1080p
- **Interactive Crop** - Drag to position, zoom slider to adjust crop size
- **Audio Normalization** - Automatic loudness normalization (EBU R128, -16 LUFS) - toggleable
- **Separate Audio Source** - Use audio from a different YouTube video
- **High-Quality Output** - Lossless audio processing with single-encode AAC at 192kbps
- **End Buffer** - Configurable still frame buffer at the end (0-5 seconds)
- **Smart Timestamps** - Type `90` and it auto-formats to `1:30`
- **Persistent Settings** - Your preferences are saved locally

## 📋 Requirements

### System Dependencies

These must be installed on your system:

| Tool | Install Command (Windows) | Purpose |
|------|--------------------------|---------|
| **FFmpeg** | `winget install Gyan.FFmpeg` | Video/audio processing |
| **yt-dlp** | `pip install yt-dlp` | YouTube downloads |

### Python Dependencies

```bash
pip install -r requirements.txt
```

## 🚀 Quick Start

### Option 1: Run from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/thedeutschmark/alert-alert.git
   cd alert-alert
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open in browser**
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000)

### Option 2: Standalone EXE

1. Build the executable:
   ```bash
   pip install pyinstaller
   python -m PyInstaller --onefile --windowed --name "AlertCreator" --add-data "static;static" --add-data "temp;temp" --add-data "output;output" app.py
   ```

2. Run `dist/AlertCreator.exe`

## 📖 Usage

### Basic Workflow

1. **Video Source** - Paste a YouTube URL and click Validate
2. **Timestamps** - Enter start/end times (e.g., `1:23` to `1:45` or just `90` for 1:30)
3. **Crop Preview** - Select aspect ratio, drag to position, zoom slider to adjust
4. **Settings** - Choose resolution, buffer duration, and audio normalization
5. **Process & Export** - Click Process Video, then download your alert

### Settings

| Setting | Options | Default |
|---------|---------|---------|
| **Output Resolution** | 480p, 720p, 1080p | 720p |
| **End Buffer** | None, 1-5 seconds | 2 seconds |
| **Audio Normalization** | On/Off | On |

### Aspect Ratios

| Ratio | Use Case |
|-------|----------|
| **1:1** | Square stream alerts |
| **16:9** | Widescreen/landscape |
| **9:16** | Vertical (TikTok, Stories) |
| **4:3** | Traditional format |

### Using Separate Audio Source

If you want to use audio from a different video (e.g., a music video for visuals + a high-quality audio source):

1. Check **"Use separate audio source"** in the Timestamps section
2. Paste the audio source YouTube URL and validate
3. Enter audio start/end timestamps
4. Download and process as usual

## 🎵 Audio Quality

The application is designed for maximum audio quality:

- Audio is extracted to **lossless PCM WAV** for all processing
- Loudness normalization is applied on PCM (no generation loss)
- Audio is encoded to **AAC only once** at the final output stage
- Final bitrate: **192 kbps** (broadcast quality)
- Normalization can be disabled to preserve original audio levels

## 📁 Project Structure

```
deutschmark-s-alert-creator/
├── app.py              # Flask backend & FFmpeg pipeline
├── requirements.txt    # Python dependencies
├── static/
│   ├── index.html      # Main UI
│   ├── img/
│   │   └── logo.png    # App logo
│   ├── css/
│   │   └── style.css   # Styling
│   └── js/
│       ├── app.js      # Main application logic
│       └── crop.js     # Crop preview with aspect ratios
├── temp/               # Temporary processing files
│   ├── downloads/      # Downloaded clips
│   └── processing/     # Intermediate files
└── output/             # Final exported alerts
```

## ⚙️ Default Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Output resolution | 720p | Scales based on aspect ratio |
| Audio loudness | -16 LUFS | EBU R128 broadcast standard |
| Audio bitrate | 192 kbps | High quality AAC |
| End buffer | 2 seconds | Still frame at end |
| Video CRF | 23 | Balanced quality/size |

## 🐛 Troubleshooting

### "Missing dependencies" banner appears
- Install FFmpeg: `winget install Gyan.FFmpeg`
- Install yt-dlp: `pip install yt-dlp`
- Restart the application

### Download fails
- Check that the YouTube URL is valid and the video is accessible
- Ensure yt-dlp is up to date: `pip install -U yt-dlp`

### Processing fails with audio error
- Make sure FFmpeg is properly installed and accessible
- Check that the video has an audio track

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Thank me

I stream on Twitch! Come say hi and tell me if you are using this tool
**[Twitch](https://twitch.tv/thedeutschmark)**
