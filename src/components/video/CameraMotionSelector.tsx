'use client';

import { CAMERA_MOTIONS } from '@/lib/video/videoPromptGenerator';

interface CameraMotionSelectorProps {
  selected: string;
  onSelect: (motionId: string) => void;
}

export default function CameraMotionSelector({
  selected,
  onSelect,
}: CameraMotionSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CAMERA_MOTIONS.map((motion) => {
        const isSelected = selected === motion.id;
        return (
          <button
            key={motion.id}
            onClick={() => onSelect(motion.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
              isSelected
                ? 'bg-green-600 text-white ring-2 ring-green-400'
                : 'bg-secondary text-muted hover:text-foreground hover:bg-secondary-hover'
            }`}
            title={motion.description}
          >
            <span className="text-2xl mb-1">{motion.icon}</span>
            <span className="text-xs font-medium">{motion.name}</span>
          </button>
        );
      })}
    </div>
  );
}
