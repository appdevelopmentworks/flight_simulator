# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Available npm scripts from package.json:
- `npm run dev` - Start Next.js development server
- `npm run build` - Build the production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linting
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage reports

## Architecture Overview

This is a WebFlight Simulator Pro built with Next.js 14 and React Three Fiber. The application simulates realistic flight dynamics for three aircraft types: Cessna 172, Boeing 737, and F-16 fighter jet.

### Core Architecture Components

**State Management** (`src/store/simulatorStore.ts`):
- Uses Zustand with persistence and subscription middleware
- Manages aircraft state, controls, weather, camera views, settings
- Integrated user profile system with flight recording capabilities
- Custom storage management with LocalStorage integration
- Real-time telemetry tracking for flight analysis

**3D Rendering System**:
- React Three Fiber (@react-three/fiber) with Three.js
- @react-three/drei utilities for camera controls and effects
- Scene orchestration in `src/components/Scene.tsx`
- Performance optimization with LOD system and memory management
- Auto-LOD manager for terrain and object culling

**Physics Engine** (`src/physics/aerodynamics.ts` + `src/physics/advancedAerodynamics.ts`):
- Comprehensive flight dynamics simulation with realistic lift, drag, thrust calculations
- Aircraft-specific aerodynamic modeling with performance envelopes
- Atmospheric density modeling with altitude and temperature effects
- Advanced aerodynamics: stall/spin modeling, ground effect, compressibility
- Autopilot integration with ILS guidance capabilities
- G-force simulation with G-LOC (G-force induced loss of consciousness) effects

**Aircraft Systems**:
- Three distinct aircraft with unique flight characteristics
- Detailed engine modeling (propeller vs jet vs afterburner)
- Individual cockpit instrumentation per aircraft type
- Realistic performance envelopes and operating limits

### Key Systems Integration

**Weather System** (`src/systems/WeatherSystem.ts`):
- Dynamic weather generation and real-time updates
- Position-based weather effects on flight dynamics
- Forecast generation system

**Audio System** (`src/systems/AudioSystem.ts`):
- Engine sound modeling with RPM-based audio
- Environmental audio effects

**Navigation System** (`src/systems/NavigationSystem.ts`):
- ILS (Instrument Landing System) with localizer/glideslope guidance
- VOR/DME navigation capabilities
- GPS waypoint system and flight planning
- Visual approach aids and runway alignment

**User Profile & Recording System**:
- Persistent user profiles with flight statistics
- Real-time flight recording with telemetry data
- Achievement system and performance tracking
- Flight replay capabilities

### Testing Framework

- Jest configured with Next.js integration
- jsdom environment for component testing
- Testing utilities: @testing-library/react, @testing-library/jest-dom
- Test files located in `__tests__` directories or `.test.tsx` files
- Coverage reporting configured for `src/**/*.{js,jsx,ts,tsx}`

### Performance Architecture

**Optimization Systems**:
- LOD (Level of Detail) system for 3D models and terrain
- Memory management with automatic cleanup
- Performance monitoring with configurable thresholds
- Dynamic quality adjustment based on frame rate

**Mobile Responsiveness**:
- Touch-optimized controls for mobile devices
- Responsive UI scaling across device sizes
- WebGL 2.0 compatibility checks

### Key Constants and Configuration

**Aircraft Specifications** (`src/constants/index.ts`):
- Detailed performance specs for each aircraft type
- Physics constants for realistic atmospheric modeling
- Control response rates and system timing

**Keyboard Controls**:
- Standard flight sim controls (WASD + arrow keys)
- System controls (landing gear, flaps, autopilot)
- Camera switching (1-4 keys for different views)

### Development Architecture Notes

- Client-side rendering required for 3D components ('use client' directive)
- SSR compatibility with proper hydration handling for React Three Fiber
- TypeScript with strict typing and path aliases (@/* for src/*)
- Three.js transpilation configured in next.config.js with `transpilePackages: ['three']`
- Jest testing environment with jsdom and React Testing Library integration
- Performance monitoring system with FPS tracking and memory usage alerts

### Important Codebase Patterns

1. **Error Handling**: Comprehensive error handling with custom error codes (`src/utils/errorHandler.ts`)
2. **Type Safety**: Strict TypeScript with custom aircraft and physics interfaces (`src/types/index.ts`)
3. **Performance Optimization**: Automatic LOD management, frame splitting, and memory monitoring
4. **State Persistence**: LocalStorage integration with versioning (`src/utils/storageManager.ts`)
5. **Real-time Physics**: 60 FPS physics loop with adaptive delta time and performance scaling
6. **Modular Systems**: Decoupled systems (Weather, Audio, Navigation) with clean interfaces
7. **Mobile Responsive**: Touch controls and responsive UI scaling for mobile devices

### Critical Implementation Details

- **Physics Loop**: Uses `useFrame` hook from React Three Fiber for 60 FPS updates
- **State Management**: Zustand with persistence middleware and subscription patterns
- **3D Audio**: Spatial audio system with position-based engine sounds and environmental effects
- **Weather Integration**: Real-time weather affects flight dynamics and visual systems
- **Advanced Flight Model**: Includes stall/spin recovery, ground effect, and compressibility modeling

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

      
      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.