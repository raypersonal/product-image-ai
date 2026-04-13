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
            className={`flex flex-col items-center justify-center p-3 rounded-card transition-colors ${
              isSelected
                ? 'bg-accent-subtle border-l-2 border-primary text-foreground'
                : 'bg-surface text-muted border border-border hover:text-foreground hover:bg-surface-hover'
            }`}
            title={motion.description}
          >
            <span className="text-xl mb-1">{motion.icon}</span>
            <span className="text-caption font-medium">{motion.name}</span>
          </button>
        );
      })}
    </div>
  );
}
