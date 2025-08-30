import React from 'react';
import { render, screen } from '@testing-library/react';
import { HUD } from '../HUD';

// useSimulatorStoreをモック
const mockStoreState = {
  aircraft: {
    id: 'test-aircraft',
    type: 'cessna172' as const,
    position: { x: 0, y: 1000, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: -50 },
    fuel: 150,
    damage: 0,
    engineRPM: 2200,
    throttle: 0.75,
    altitude: 1000,
    airspeed: 180,
    verticalSpeed: 5.2,
    heading: 90,
    flaps: 0,
    landingGear: false,
    brakes: false,
    gForce: 1.2
  },
  hudSettings: {
    showAltitude: true,
    showAirspeed: true,
    showHeading: true,
    showVerticalSpeed: true,
    showFuel: true,
    showMap: true
  },
  gameSettings: {
    difficulty: 'normal' as const,
    graphics: 'high' as const,
    sound: 80,
    music: 50,
    controls: {
      invertY: false,
      sensitivity: 50,
      deadzone: 10
    },
    assists: {
      autopilot: true,
      landingGuide: true,
      stallWarning: true,
      collisionWarning: true
    }
  }
};

jest.mock('@/store/simulatorStore', () => ({
  useSimulatorStore: () => mockStoreState
}));

// checkStall関数をモック
jest.mock('@/physics/aerodynamics', () => ({
  checkStall: jest.fn(() => false)
}));

describe('HUD Component', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<HUD />);
    expect(screen.getByRole('region', { name: /hud/i })).toBeInTheDocument();
  });

  it('should display basic flight information', () => {
    render(<HUD />);
    
    // テキストが存在することを確認（正確なフォーマットではなく）
    expect(screen.getByText(/ALT/)).toBeInTheDocument();
    expect(screen.getByText(/SPD/)).toBeInTheDocument();
    expect(screen.getByText(/090°/)).toBeInTheDocument();
  });

});