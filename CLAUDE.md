# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Available npm scripts:
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

**Physics Engine** (`src/physics/aerodynamics.ts`):
- Comprehensive flight dynamics simulation
- Realistic calculations: lift, drag, thrust, ground forces
- Aircraft-specific aerodynamic modeling
- Atmospheric density modeling with altitude effects
- Advanced features: stall detection, autopilot, ILS guidance

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
- ILS approach guidance
- GPS navigation capabilities

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
- SSR compatibility with proper hydration handling
- TypeScript with path aliases (@/* for src/*)
- Three.js transpilation configured in next.config.js
- Jest configured with proper ES6 module handling for Three.js libraries

### Important Codebase Patterns

1. **Error Handling**: Comprehensive error handling with error codes and logging
2. **Type Safety**: Strict TypeScript with validation functions
3. **Performance**: Automatic memory management and performance monitoring
4. **State Persistence**: Settings and profiles automatically saved to LocalStorage
5. **Real-time Updates**: Physics calculations at 60 FPS with delta time handling