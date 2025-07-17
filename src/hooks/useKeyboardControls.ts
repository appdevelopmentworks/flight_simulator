import { useEffect, useRef } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { KEYBOARD_CONTROLS, CONTROL_SETTINGS } from '@/constants';

export const useKeyboardControls = () => {
  const { 
    controls, 
    setControls, 
    setCameraView, 
    isPaused, 
    setPaused,
    aircraft,
    setAircraft
  } = useSimulatorStore();
  
  const keysPressed = useRef<Set<string>>(new Set());
  const controlUpdateInterval = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keysPressed.current.has(e.key)) return;
      keysPressed.current.add(e.key);
      
      // カメラビューの切り替え
      switch (e.key) {
        case KEYBOARD_CONTROLS.CAMERA_COCKPIT:
          setCameraView('cockpit');
          break;
        case KEYBOARD_CONTROLS.CAMERA_EXTERNAL:
          setCameraView('external');
          break;
        case KEYBOARD_CONTROLS.CAMERA_TOWER:
          setCameraView('tower');
          break;
        case KEYBOARD_CONTROLS.CAMERA_FREE:
          setCameraView('free');
          break;
        case KEYBOARD_CONTROLS.PAUSE:
          setPaused(!isPaused);
          break;
      }
      
      // トグル系のコントロール
      if (e.key === KEYBOARD_CONTROLS.LANDING_GEAR) {
        setControls({ landingGear: !controls.landingGear });
      }
      if (e.key === KEYBOARD_CONTROLS.BRAKES) {
        setControls({ brakes: !controls.brakes });
      }
      if (e.key === KEYBOARD_CONTROLS.AUTOPILOT) {
        setControls({ autopilot: !controls.autopilot });
      }
      
      // スロットルの即座の設定
      if (e.key === KEYBOARD_CONTROLS.THROTTLE_IDLE) {
        setControls({ throttle: 0 });
      }
      if (e.key === KEYBOARD_CONTROLS.THROTTLE_FULL) {
        setControls({ throttle: 1 });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    
    // 継続的なコントロール更新
    const updateControls = () => {
      const newControls = { ...controls };
      let hasChanges = false;
      
      // ピッチ
      if (keysPressed.current.has(KEYBOARD_CONTROLS.PITCH_UP)) {
        newControls.pitch = Math.min(1, newControls.pitch + 0.02);
        hasChanges = true;
      } else if (keysPressed.current.has(KEYBOARD_CONTROLS.PITCH_DOWN)) {
        newControls.pitch = Math.max(-1, newControls.pitch - 0.02);
        hasChanges = true;
      } else if (Math.abs(newControls.pitch) > 0.01) {
        newControls.pitch *= 0.95; // 自動センタリング
        hasChanges = true;
      }
      
      // ロール
      if (keysPressed.current.has(KEYBOARD_CONTROLS.ROLL_LEFT)) {
        newControls.roll = Math.max(-1, newControls.roll - 0.02);
        hasChanges = true;
      } else if (keysPressed.current.has(KEYBOARD_CONTROLS.ROLL_RIGHT)) {
        newControls.roll = Math.min(1, newControls.roll + 0.02);
        hasChanges = true;
      } else if (Math.abs(newControls.roll) > 0.01) {
        newControls.roll *= 0.95; // 自動センタリング
        hasChanges = true;
      }
      
      // ヨー
      if (keysPressed.current.has(KEYBOARD_CONTROLS.YAW_LEFT)) {
        newControls.yaw = Math.max(-1, newControls.yaw - 0.02);
        hasChanges = true;
      } else if (keysPressed.current.has(KEYBOARD_CONTROLS.YAW_RIGHT)) {
        newControls.yaw = Math.min(1, newControls.yaw + 0.02);
        hasChanges = true;
      } else if (Math.abs(newControls.yaw) > 0.01) {
        newControls.yaw *= 0.95; // 自動センタリング
        hasChanges = true;
      }
      
      // スロットル
      if (keysPressed.current.has(KEYBOARD_CONTROLS.THROTTLE_UP)) {
        newControls.throttle = Math.min(1, newControls.throttle + 0.01);
        hasChanges = true;
      } else if (keysPressed.current.has(KEYBOARD_CONTROLS.THROTTLE_DOWN)) {
        newControls.throttle = Math.max(0, newControls.throttle - 0.01);
        hasChanges = true;
      }
      
      // フラップ
      if (keysPressed.current.has(KEYBOARD_CONTROLS.FLAPS_DOWN)) {
        const newFlaps = Math.min(40, aircraft.flaps + 1);
        setAircraft({ flaps: newFlaps });
        hasChanges = true;
      } else if (keysPressed.current.has(KEYBOARD_CONTROLS.FLAPS_UP)) {
        const newFlaps = Math.max(0, aircraft.flaps - 1);
        setAircraft({ flaps: newFlaps });
        hasChanges = true;
      }
      
      if (hasChanges) {
        setControls(newControls);
      }
    };
    
    // イベントリスナーの登録
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // コントロール更新のインターバル設定
    controlUpdateInterval.current = setInterval(updateControls, 16); // 60fps
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (controlUpdateInterval.current) {
        clearInterval(controlUpdateInterval.current);
      }
    };
  }, [controls, setControls, setCameraView, isPaused, setPaused, aircraft, setAircraft]);
  
  return keysPressed.current;
};
