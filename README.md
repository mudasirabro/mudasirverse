# 🎬 MudasirVerse

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/mudasirabro/mudasirverse?style=social)](https://github.com/mudasirabro/mudasirverse/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mudasirabro/mudasirverse?style=social)](https://github.com/mudasirabro/mudasirverse/network/members)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://mudasirverse.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A modern Movies & TV Series Exploration Application with AI-Powered Recommendations**

[🌐 Live Demo](https://mudasirverse.vercel.app) · [📖 Documentation](#-features) · [🐛 Report Bug](https://github.com/mudasirabro/mudasirverse/issues) · [💡 Request Feature](https://github.com/mudasirabro/mudasirverse/issues)

</div>

---

## ✨ Features

### 🎯 Core Features
- 🔍 **Advanced Search** - Real-time search with auto-suggestions
- 🎭 **Smart Filtering** - Filter by genre, rating, year, platform
- 📱 **Responsive Design** - Works perfectly on all devices
- 🎬 **Rich Media Details** - Cast, crew, seasons, episodes
- 🌟 **User Ratings & Reviews** - Community feedback system

### 🤖 AI Integration
- 🧠 **AI Matchmaker** - Powered by Google Gemini
- 📊 **Smart Recommendations** - Personalized suggestions
- 🎨 **Mood-Based Search** - Find content based on your mood
- 💬 **AI Review Summaries** - Quick sentiment analysis

### 📚 Personal Features
- 🔖 **Watchlist** - Save titles for later
- 📂 **Custom Collections** - Create themed lists
- ⭐ **Personal Ratings** - Rate what you watch
- 📝 **User Reviews** - Share your thoughts

### 🎥 Media Experience
- 🎞️ **Official Trailers** - YouTube integration
- 🖼️ **High-Quality Posters** - TMDB image delivery
- 📺 **Streaming Info** - Where to watch
- 🎬 **Season Guides** - Episode-by-episode breakdown

---

## 🛠️ Technology Stack

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

### AI & APIs
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![TMDB](https://img.shields.io/badge/TMDB-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)
![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)

### Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TMDB API Key
- Google Gemini API Key (optional)
- YouTube API Key (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mudasirabro/mudasirverse.git
cd mudasirverse
```

2. **Install dependencies**
```bash
npm install
cd client && npm install
cd ..
```

3. **Set up environment variables**

Create a `.env` file:
```env
TMDB_API_KEY=your_tmdb_api_key
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
PORT=3000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

---

## 🎯 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/media` | GET | Get all media with filters |
| `/api/media/:id` | GET | Get specific media details |
| `/api/search` | GET | Search across catalog |
| `/api/recommendations/ai` | POST | AI-powered recommendations |
| `/api/reviews` | POST | Add user review |
| `/api/genres` | GET | Get all genres |

---

## 🗺️ Project Structure

```
mudasirverse/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── MediaCard.tsx
│   │   │   ├── MediaGrid.tsx
│   │   │   ├── MediaDetailModal.tsx
│   │   │   ├── AiMatchmakerSection.tsx
│   │   │   └── TrailerModal.tsx
│   │   ├── hooks/
│   │   │   └── useWatchlist.ts
│   │   ├── services/
│   │   │   ├── realtimeApi.ts
│   │   │   └── tmdbApi.ts
│   │   ├── data/
│   │   │   └── mockCatalog.ts
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── index.html
│   └── package.json
├── server.ts
├── package.json
├── vercel.json
└── README.md
```

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push
```

2. **Deploy on Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

**Live Demo:** [https://mudasirverse.vercel.app](https://mudasirverse.vercel.app)

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📸 Screenshots

<div align="center">

| Home Page | Movie Detail |
|-----------|--------------|
| ![Home Page](./screenshots/home.png) | ![Movie Detail](./screenshots/detail.png) |

| AI Matchmaker | Watchlist |
|---------------|-----------|
| ![AI Matchmaker](./screenshots/matchmaker.png) | ![Watchlist](./screenshots/watchlist.png) |

</div>

*Add your own screenshots in the `screenshots/` folder!*

---

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for movie/series data
- [Google Gemini](https://ai.google.dev/) for AI recommendations
- [React](https://react.dev/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vercel](https://vercel.com/) for hosting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Mudasir** - [@mudasirabro](https://github.com/mudasirabro)

Project Link: [https://github.com/mudasirabro/mudasirverse](https://github.com/mudasirabro/mudasirverse)

Live Demo: [https://mudasirverse.vercel.app](https://mudasirverse.vercel.app)

---

<div align="center">

Made with ❤️ by Mudasir

⭐ Star this repo if you like it!

</div>
