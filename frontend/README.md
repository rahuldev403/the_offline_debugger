# AutoFix AI - Frontend

A modern, cyberpunk-styled dashboard built with Next.js 14 (App Router) and Tailwind CSS.

## 🎨 Features

- **Cyberpunk/VS Code Dark Theme**: Sleek dark mode with neon accents
- **Live Repair Timeline**: Visual timeline showing AI's debugging process
- **Syntax-Highlighted Diffs**: Color-coded patches (green for additions, red for deletions)
- **Real-time Status Updates**: Loading states and execution feedback
- **Responsive Design**: Works on all screen sizes

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
cd frontend
npm install
```

### 2. Run Development Server

```powershell
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Ensure Backend is Running

Make sure the FastAPI backend is running on `http://localhost:8000`

## 📦 Installed Packages

- **next**: React framework with App Router
- **react** & **react-dom**: React library
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Beautiful icon library
- **typescript**: Type safety
- **JetBrains Mono**: Monospace font (via Google Fonts)

## 🎯 Usage

1. **Paste Code**: Enter your buggy Python code in the left editor
2. **Set Retries**: Choose max retry attempts (1-10)
3. **Start Repair**: Click "Start Autonomous Repair"
4. **Watch Magic**: View the live timeline as AI debugs your code

## 🎨 Color Scheme

- **Background**: Slate-950 (Deep dark)
- **Success**: Neon Green (#4ade80)
- **Error**: Neon Red (#f87171)
- **AI/Info**: Electric Cyan (#22d3ee)
- **Accent**: Purple (#a855f7)

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx         # Main dashboard component
│   ├── layout.tsx       # Root layout with fonts
│   └── globals.css      # Global styles + Tailwind
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## 🔧 Build for Production

```powershell
npm run build
npm start
```

## 🎭 Design Philosophy

- **Monospace Everything**: JetBrains Mono for that hacker aesthetic
- **Neon Accents**: Cyberpunk-inspired color palette
- **Visual Feedback**: Every action has clear visual response
- **Timeline UX**: Linear flow showing AI's thought process
