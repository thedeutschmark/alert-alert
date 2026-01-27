# deutschmark's Alert Creator

A desktop tool for creating stream alerts from YouTube clips. Download, crop to square, normalize audio, and export perfectly formatted alert videos.

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-green?logo=flask&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **YouTube Download** - Download clips directly from YouTube with precise timestamp selection
- **Square Crop** - Interactive crop preview to select the perfect 720×720 square region
- **Audio Normalization** - Automatic loudness normalization (EBU R128 compliant, -16 LUFS)
- **Separate Audio Source** - Optionally use audio from a different YouTube video
- **High-Quality Output** - Lossless audio processing with single-encode AAC output at 192kbps
- **End Buffer** - Automatic 2-second still frame buffer at the end of each clip

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

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/deutschmarks-alert-creator.git
   cd deutschmarks-alert-creator
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

## 📖 Usage

### Basic Workflow

1. **Video Source** - Paste a YouTube URL and click Validate
2. **Timestamps** - Enter start/end times for your clip (e.g., `1:23` to `1:45`)
3. **Crop Preview** - Drag to position the 720×720 crop area, use the zoom slider to adjust
4. **Process & Export** - Click Process Video, then download your alert

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

## 📁 Project Structure

```
deutschmarks-alert-creator/
├── app.py              # Flask backend & FFmpeg pipeline
├── requirements.txt    # Python dependencies
├── static/
│   ├── index.html      # Main UI
│   ├── css/
│   │   └── style.css   # Styling
│   └── js/
│       ├── app.js      # Main application logic
│       └── crop.js     # Crop preview functionality
├── temp/               # Temporary processing files (auto-created)
│   ├── downloads/      # Downloaded clips
│   └── processing/     # Intermediate files
└── output/             # Final exported alerts
```

## ⚙️ Configuration

The application uses sensible defaults:

| Setting | Value | Description |
|---------|-------|-------------|
| Output size | 720×720 | Square format for alerts |
| Audio loudness | -16 LUFS | Broadcast standard |
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
