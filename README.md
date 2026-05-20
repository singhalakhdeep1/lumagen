# 🎨 AI Image Generator

A beautiful, production-ready AI image generation platform built with Next.js, Replicate AI, and Firebase. Generate stunning AI art with advanced prompting, multiple style presets, and image upscaling capabilities.

![AI Image Generator](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)
![Replicate](https://img.shields.io/badge/Replicate-AI-purple)

## ✨ Features

### 🎨 AI Image Generation

- **Advanced Prompting**: Describe your vision in detail
- **8 Style Presets**: Realistic, Artistic, Anime, Digital Art, 3D, Fantasy, Cyberpunk, Watercolor
- **Multiple Aspect Ratios**: Square (1:1), Landscape (16:9), Portrait (9:16)
- **High-Quality Output**: Powered by Stability AI's SDXL model

### 🚀 Generation Queue

- **Real-time Progress Tracking**: Monitor your generations
- **Queue Management**: Multiple images at once
- **Status Indicators**: Pending, Generating, Completed, Failed states

### 🖼️ Gallery Management

- **Persistent Storage**: All your images saved locally
- **Full-Screen Preview**: Click to view in detail
- **Download Images**: Save to your device
- **Delete Unwanted Images**: Clean up your gallery

### ⬆️ Image Upscaling

- **2x Resolution Enhancement**: Powered by Real-ESRGAN
- **Face Enhancement**: Automatic face detail improvement
- **One-Click Upscale**: Simple and fast

### 🎭 Beautiful UI

- **Modern Design**: Gradient backgrounds and smooth animations
- **Dark Mode Support**: Easy on the eyes
- **Responsive**: Works on all devices
- **Smooth Animations**: Framer Motion powered

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **AI**: Replicate API (Stability AI SDXL, Real-ESRGAN)
- **Storage**: Firebase Storage (optional)
- **State**: Zustand + Local Storage
- **Animations**: Framer Motion
- **UI Components**: Radix UI

## 📦 Installation

### Prerequisites

- Node.js 18+ installed
- Replicate API account
- Firebase project (optional, for cloud storage)

### 1. Clone the Repository

```bash
cd ai-image-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Replicate API (Required)
REPLICATE_API_TOKEN=your_replicate_api_token

# Firebase (Optional - for cloud storage)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🚀

## 🔑 Getting API Keys

### Replicate API (Required)

1. Go to [replicate.com](https://replicate.com)
2. Sign up / Log in
3. Navigate to **Account** → **API Tokens**
4. Click **Create Token**
5. Copy the token and paste in `.env.local` as `REPLICATE_API_TOKEN`

### Firebase (Optional)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project or use existing
3. Click **Project Settings** (gear icon)
4. Scroll to **Your apps** → Click **Web** icon
5. Register your app
6. Copy the configuration values to `.env.local`

**Note**: Firebase is optional. The app works without it using local storage.

## 📖 Usage Guide

### Generating Images

1. **Enter a Prompt**: Describe what you want to see
   - Example: "A serene mountain landscape at sunset with vibrant orange and purple skies"

2. **Select a Style**: Choose from 8 artistic styles
   - Realistic, Artistic, Anime, Digital Art, 3D, Fantasy, Cyberpunk, Watercolor

3. **Choose Aspect Ratio**: Pick from Square, Landscape, or Portrait

4. **Generate**: Click the generate button and wait 30-60 seconds

### Managing Your Gallery

- **View Full Size**: Click any image to see it full screen
- **Download**: Save images to your device
- **Upscale**: Enhance resolution with 2x upscaling
- **Delete**: Remove unwanted images

### Tips for Best Results

- **Be Specific**: More details = better results
- **Use Descriptive Language**: "vibrant", "detailed", "8k", etc.
- **Mention Style**: Even without presets, you can add style keywords
- **Experiment**: Try different combinations of prompts and styles

## 🎯 Project Structure

```
ai-image-generator/
├── app/
│   ├── api/
│   │   ├── generate/route.ts    # Image generation endpoint
│   │   └── upscale/route.ts     # Image upscaling endpoint
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/
│   ├── ui/                      # Shadcn UI components
│   ├── Gallery.tsx              # Gallery component
│   ├── GenerationQueue.tsx      # Queue component
│   ├── Header.tsx               # Header component
│   └── ImageGenerator.tsx       # Main generator component
├── lib/
│   ├── firebase.ts              # Firebase configuration
│   ├── store.ts                 # Zustand state management
│   └── utils.ts                 # Utility functions
└── hooks/
    └── use-toast.ts             # Toast notification hook
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Environment Variables for Production

Make sure to add all environment variables in your hosting platform:

- `REPLICATE_API_TOKEN` (required)
- Firebase variables (optional)

## 🎨 Customization

### Add New Styles

Edit `components/ImageGenerator.tsx`:

```typescript
const styles = [
  // Add your custom style
  { value: "custom", label: "Custom Style", emoji: "🎭" },
];
```

### Modify AI Models

Edit `app/api/generate/route.ts` to use different Replicate models.

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

## 🙏 Acknowledgments

- **Replicate** - AI model hosting
- **Stability AI** - SDXL model
- **Shadcn UI** - Beautiful components
- **Vercel** - Amazing hosting platform

## 📧 Support

Having issues? Check the [troubleshooting guide](#troubleshooting) or open an issue.

---

**Built with ❤️ using Next.js and AI**
