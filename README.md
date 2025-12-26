# WorldLynk University Admin Portal

A role-based, AI-driven command center that transforms universities from reactive institutions into predictive student success machines.

## Design System

**Visual Direction:** Swiss International meets HUD Glassmorphism — rational data density with futuristic AI intelligence overlays.

### Color Palette
- **Foundation:** Deep charcoal backgrounds (#0A0E14) with warm off-white text (#E8E6E3)
- **Primary Brand:** Electric cyan (#00D9FF) for AI intelligence indicators and primary actions
- **Accent Hierarchy:**
  - Neon green (#39FF14) for positive signals
  - Amber (#FFB800) for warnings
  - Crimson (#FF2E63) for critical alerts

### Typography
- **Display/Headers:** Space Grotesk (700-800 weight)
- **Body/Interface:** Inter (400-500 weight)
- **Data/Metrics:** JetBrains Mono (500 weight)

## Features Implemented

### ✅ Core Views
1. **Dashboard** - High-density metrics grid with AI intelligence feed and lifecycle funnel
2. **Student Lifecycle Manager** - Comprehensive student tracking across all stages
3. **Program Management** - Program catalog with enrollment tracking
4. **AI Intelligence Center** - Risk heatmaps, predictions, and AI insights
5. **Reports & Analytics** - Conversion funnels, geographic distribution, and trends

### ✅ Key Components
- **Sidebar Navigation** - Role-based dynamic navigation
- **Global Header** - Search bar and notification center
- **Metric Cards** - Animated cards with trend indicators
- **AI Alert Cards** - Severity-based alerts with recommendations
- **Student Detail Panel** - Comprehensive student profiles with risk analysis
- **Lifecycle Funnel** - Visual representation of student progression

### ✅ Design Features
- Glassmorphic cards with backdrop blur
- Neon glow effects for AI elements
- Pulse animations for critical alerts
- Stagger fade-in animations
- Shimmer loading states
- Noise texture overlay
- Grid underlays

## Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Type Safety:** TypeScript
- **Date Handling:** date-fns

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, Header
│   ├── dashboard/       # MetricCard, AIAlertCard, LifecycleFunnel
│   ├── students/        # StudentDetailPanel
│   ├── views/           # Main view components
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── mockData.ts      # Mock data for development
│   └── utils.ts         # Utility functions
└── types/
    └── index.ts         # TypeScript type definitions
```

## Future Enhancements

- Global search modal (Cmd+K)
- Notifications panel
- Communication Center
- Workflow Automation builder
- Counselor Management
- Finance tracking
- International Office features
- Real-time data integration
- Role-based access control
- Advanced filtering and sorting

## Design Philosophy

This is not a friendly consumer app — it is a **professional command center** that signals intelligence, control, and predictive power. Every element is precise, intentional, and unmistakably AI-driven.
