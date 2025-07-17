import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { ArtificialHorizon } from './instruments/ArtificialHorizon';
import { Altimeter } from './instruments/Altimeter';
import { Airspeed } from './instruments/Airspeed';
import { VerticalSpeed } from './instruments/VerticalSpeed';
import { Compass } from './instruments/Compass';
import { EngineGauges } from './instruments/EngineGauges';
import { Boeing737Panel } from './instruments/Boeing737Panel';

export const InstrumentPanel: React.FC = () => {
  const { aircraft } = useSimulatorStore();
  
  // Boeing 737の場合は専用パネルを表示
  if (aircraft.type === 'boeing737') {
    return <Boeing737Panel />;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none">
      <div className="h-full flex items-end justify-center pb-4">
        <div className="instrument-panel p-4 flex space-x-4 pointer-events-auto">
          {/* 左側計器群 */}
          <div className="flex flex-col space-y-4">
            <Airspeed speed={aircraft.airspeed} />
            <ArtificialHorizon 
              pitch={aircraft.rotation.x * 180 / Math.PI} 
              roll={aircraft.rotation.z * 180 / Math.PI} 
            />
          </div>
          
          {/* 中央計器群 */}
          <div className="flex flex-col space-y-4">
            <Altimeter altitude={aircraft.altitude} />
            <Compass heading={aircraft.heading} />
          </div>
          
          {/* 右側計器群 */}
          <div className="flex flex-col space-y-4">
            <VerticalSpeed speed={aircraft.verticalSpeed} />
            <EngineGauges 
              rpm={aircraft.engineRPM} 
              fuel={aircraft.fuel}
              throttle={aircraft.throttle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
