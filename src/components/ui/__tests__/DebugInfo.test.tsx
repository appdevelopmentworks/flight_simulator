import React from 'react';
import { render, screen } from '@testing-library/react';
import { DebugInfo } from '../DebugInfo';

// useSimulatorStoreをモック
const mockStoreState = {
  aircraft: {
    id: 'test-aircraft',
    type: 'cessna172' as const,
    position: { x: 123.45, y: 1000.67, z: -456.78 },
    rotation: { x: 0.1, y: 1.57, z: 0.05 },
    velocity: { x: 5.2, y: 2.1, z: -45.8 },
    fuel: 150,
    damage: 0,
    engineRPM: 2200,
    throttle: 0.75,
    altitude: 1000.67,
    airspeed: 180.5,
    verticalSpeed: 2.1,
    heading: 90,
    flaps: 10,
    landingGear: false,
    brakes: false,
    gForce: 1.15
  },
  controls: {
    pitch: 0.2,
    roll: -0.1,
    yaw: 0.05,
    throttle: 0.75,
    flaps: 10,
    landingGear: false,
    brakes: false,
    autopilot: false
  },
  weather: {
    windDirection: 270,
    windSpeed: 15.5,
    visibility: 10,
    cloudCover: 0.3,
    precipitation: 'none' as const,
    turbulence: 0.2,
    temperature: 15,
    pressure: 1013
  }
};

jest.mock('@/store/simulatorStore', () => ({
  useSimulatorStore: () => mockStoreState
}));

describe('DebugInfo Component', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<DebugInfo />);
  });

  it('should display aircraft information in development', () => {
    process.env.NODE_ENV = 'development';
    render(<DebugInfo />);
    
    expect(screen.getByText(/Position:/)).toBeInTheDocument();
    expect(screen.getByText(/Velocity:/)).toBeInTheDocument();
    expect(screen.getByText(/cessna172/)).toBeInTheDocument();
  });

});