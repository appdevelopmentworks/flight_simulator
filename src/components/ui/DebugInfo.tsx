import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

export const DebugInfo: React.FC = () => {
  const { aircraft, controls, cameraView } = useSimulatorStore();
  
  // 安全チェック
  if (!aircraft) {
    return (
      <div className="fixed top-4 left-4 bg-black/80 text-white p-4 rounded font-mono text-xs">
        <h3 className="font-bold mb-2">Debug Info</h3>
        <div>Loading aircraft data...</div>
      </div>
    );
  }
  
  return (
    <div className="fixed top-4 left-4 bg-black/80 text-green-400 p-4 rounded font-mono text-xs space-y-1">
      <h3 className="text-white font-bold mb-2">Debug Info</h3>
      
      <div>Camera: {cameraView}</div>
      <div>Position: ({(aircraft.position?.x || 0).toFixed(1)}, {(aircraft.position?.y || 0).toFixed(1)}, {(aircraft.position?.z || 0).toFixed(1)})</div>
      <div>Velocity: ({(aircraft.velocity?.x || 0).toFixed(1)}, {(aircraft.velocity?.y || 0).toFixed(1)}, {(aircraft.velocity?.z || 0).toFixed(1)})</div>
      <div className={(aircraft.airspeed || 0) > 0 ? 'text-yellow-400' : ''}>Speed: {(aircraft.airspeed || 0).toFixed(1)} km/h</div>
      <div>Altitude: {(aircraft.altitude || 0).toFixed(1)} m</div>
      <div>V/S: {(aircraft.verticalSpeed || 0).toFixed(1)} m/s</div>
      <div>Heading: {(aircraft.heading || 0).toFixed(0)}°</div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className={(controls.throttle || 0) > 0 ? 'text-yellow-400' : ''}>Throttle: {((controls.throttle || 0) * 100).toFixed(0)}%</div>
        <div>RPM: {(aircraft.engineRPM || 0).toFixed(0)}</div>
        <div>Flaps: {aircraft.flaps || 0}°</div>
        <div>Gear: {aircraft.landingGear ? 'DOWN' : 'UP'}</div>
        <div className={aircraft.brakes ? 'text-red-400' : 'text-green-400'}>Brakes: {aircraft.brakes ? 'ON' : 'OFF'}</div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div>Pitch: {((aircraft.rotation?.x || 0) * 180 / Math.PI).toFixed(1)}°</div>
        <div>Roll: {((aircraft.rotation?.z || 0) * 180 / Math.PI).toFixed(1)}°</div>
        <div>Yaw: {((aircraft.rotation?.y || 0) * 180 / Math.PI).toFixed(1)}°</div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div>Type: {aircraft.type}</div>
        <div>On Ground: {(aircraft.altitude || 0) < 0.5 ? 'YES' : 'NO'}</div>
        <div className="text-gray-300 mt-2">Keys: 1-4 Camera, WASD Flight</div>
      </div>
    </div>
  );
};
