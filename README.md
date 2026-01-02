# StreamWing 🎬

A peer-to-peer video streaming application that lets you watch videos together in real-time. Built with WebRTC for direct browser-to-browser streaming with no server processing.

![StreamWing](https://img.shields.io/badge/Built%20with-WebRTC-blue)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android-green)

## ✨ Features

### Core Streaming
- **P2P Video Streaming**: Direct WebRTC connections between host and viewers
- **Real-time Synchronization**: Playback controls (play/pause/seek) sync across all viewers
- **Low Latency**: Sub-second delay using peer-to-peer connections
- **Multiple Viewers**: Support for multiple simultaneous viewers per stream

### Video Playback Controls
- **Advanced Controls**: Play/pause, seek, skip forward/backward (10s)
- **Volume Control**: Individual volume control for each viewer
- **Fullscreen/Immersive Mode**: Native fullscreen on web, landscape lock on mobile
- **Double-tap Skip**: Quick 10-second skip via double-tap gestures
- **Progress Bar**: Draggable progress bar with live preview

### Quality & Media Features
- **Manual Quality Selection**: Viewers choose between High (10 Mbps), SD (1.5 Mbps), Low (500 Kbps)
- **Embedded Subtitle Support**: Auto-detects and displays subtitles from video files (MKV, MP4, WebM)
- **Multi-Audio Track**: Auto-detects multiple audio tracks and allows switching between them
- **Codec Detection**: Alerts users when unsupported audio codecs are detected

### Mobile & Android
- **Native Android App**: Full Capacitor-based Android application
- **Deep Linking**: Open streams directly in the Android app from web links
- **Adaptive UI**: Mobile-optimized controls with touch gestures
- **Open App Banner**: Web viewers can easily switch to the native app
- **Landscape Lock**: Force landscape orientation for video playback

### Performance
- **Real-time Ping Display**: Shows connection quality (host upload, viewer download)
- **Buffering Indicators**: Visual feedback during buffering
- **Connection Status**: Live connection status badges
- **Stats Monitoring**: Built-in WebRTC stats tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- (For Android) Android Studio & SDK

### Installation

```bash
# Clone the repository
git clone https://github.com/tishbian-meshach/Stream-Wing.git
cd Stream-Wing

# Install dependencies
npm install

# Run development server
npm run dev
```

### Building for Production

```bash
# Build web app
npm run build

# Build Android app
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

## 📱 Usage

### Host a Stream
1. Open the app and click "Create Room"
2. Select a video file from your device
3. Share the room ID with viewers
4. Controls sync automatically with all connected viewers

### Join as Viewer
1. Enter the room ID or use the shared link
2. Wait for host to start streaming
3. Adjust quality settings based on your connection
4. Toggle subtitles/audio tracks if available

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **WebRTC**: Peer-to-peer video streaming
- **Signaling**: Supabase Realtime
- **Mobile**: Capacitor (Android)
- **Deployment**: Vercel (Web)

## 📂 Project Structure

```
streamwing/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Main pages (Home, HostRoom, ViewerRoom)
│   ├── webrtc/         # WebRTC peer management
│   ├── services/       # Signaling service
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities (platform, subtitles)
├── android/            # Capacitor Android project
└── public/            # Static assets
```

## 🎯 Key Features Deep Dive

### Quality Control
Viewers have full control over video quality with three presets:
- **High Quality**: 10 Mbps, no resolution scaling, unlimited FPS (1:1 with host)
- **SD Quality**: 1.5 Mbps, 1.5x scaling, 30 FPS
- **Low Quality**: 500 Kbps, 2x scaling, 24 FPS

Quality selection is remembered across sessions and allows buffering if network can't handle selected quality.

### Subtitle Support
- Automatically detects embedded subtitles in video files
- Supports SRT and WebVTT formats
- Toggle on/off via "CC" button
- No manual upload required - reads directly from video file

### Audio Track Switching
- Auto-detects multiple audio tracks (e.g., different languages)
- Allows cycling through available tracks
- Best-effort support (depends on browser capabilities)

## 🌐 Browser Support

- Chrome/Edge 90+ (Recommended)
- Firefox 88+
- Safari 15+
- Mobile browsers (Android Chrome, Safari iOS)

**Note**: Best experience on Chrome/Chromium-based browsers due to WebRTC codec support.

## 📝 Known Limitations

- **Codec Support**: MKV files with AC3/DTS audio won't play (use AAC/MP3 audio)
- **Audio Tracks API**: Limited browser support for multiple audio tracks
- **File Size**: Large files may take time to load into browser memory
- **Bandwidth**: High quality requires stable 10+ Mbps upload from host

## 🐛 Troubleshooting

### No Audio on MKV Files
**Solution**: Re-encode audio to AAC
```bash
ffmpeg -i input.mkv -c:v copy -c:a aac output.mp4
```

### Can't Connect to Room
- Check if both devices are on stable internet
- Disable VPN/proxy if connection fails
- Ensure browser has camera/microphone permissions (may help STUN/TURN)

### Low Quality Even on "High"
- Check host's upload bandwidth (needs 10+ Mbps)
- Verify viewer's download bandwidth
- Check `chrome://webrtc-internals` for actual bitrate stats

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Links

- **Live Demo**: [stream-wing.vercel.app](https://stream-wing.vercel.app)
- **GitHub**: [github.com/tishbian-meshach/Stream-Wing](https://github.com/tishbian-meshach/Stream-Wing)

## 👨‍💻 Author

Built with ❤️ for seamless video watching experiences.

---

**StreamWing** - Watch Together, Anywhere
