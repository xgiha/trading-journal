import React from "react";
import { ChevronUp } from "lucide-react";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isSpeaking?: boolean;
}

const participants: Participant[] = [
  { id: "1", name: "Oğuz", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/man-with-sunglasses-profile-artistic-3Q0PBah5WBqwZeeWGCWABFOpCyhcmD.jpg", isSpeaking: true },
  { id: "2", name: "Ashish", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/man-with-cap-colorful-gradient-background-k6UaFzKucKJ2tzaK32l1XFTkv5dPAS.jpg" },
  { id: "3", name: "Mariana", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/person-with-winter-hat-scarf-cold-5KFfWSpCqM4Ksf7yXgiVhxSweVw5tH.jpg" },
  { id: "4", name: "MDS", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/silhouette-dark-artistic-portrait-HUaRj3gVUuhrGF2L8HaOGlawK4EAfZ.jpg" },
  { id: "5", name: "Ana", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/woman-smiling-outdoor-background-M1BHNIp7XAzAPWwbIbY47V6WEFk703.jpg" },
  { id: "6", name: "Natko", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/man-with-beard-hoodie-casual-tx32EFYsG69NBSuftk3cN16mOegxOe.jpg", isSpeaking: true },
  { id: "7", name: "Afshin", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/man-with-sunglasses-red-shirt-blue-background-KvK2BMFg07EE8rLsTSQ8891UfCcSIV.jpg" },
];

const COLLAPSED_WIDTH = 220; 
const EXPANDED_WIDTH = 220; 
const EXPANDED_HEIGHT = 320;

const AVATAR_SIZE_COLLAPSED = 34;
const AVATAR_SIZE_EXPANDED = 48;
const AVATAR_OVERLAP = -10;

function SpeakingIndicator({ show }: { show: boolean }) {
  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 bg-black rounded-full p-1 shadow-md border border-white/10",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        show ? "opacity-100 scale-100" : "opacity-0 scale-0",
      )}
    >
      <div className="flex items-center justify-center gap-[2px]">
        <span className="w-[2px] bg-white rounded-full animate-wave-1" />
        <span className="w-[2px] bg-white rounded-full animate-wave-2" />
        <span className="w-[2px] bg-white rounded-full animate-wave-3" />
      </div>
    </div>
  )
}

function AudioWaveIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div
      className={cn(
        "absolute w-8 h-8 rounded-full bg-white flex items-center justify-center",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isExpanded ? "opacity-0 scale-75" : "opacity-100 scale-100",
      )}
      style={{
        left: 10,
        top: "50%",
        transform: `translateY(-50%) ${isExpanded ? "scale(0.75)" : "scale(1)"}`,
      }}
    >
      <div className="flex items-center justify-center gap-[1.5px]">
        <span className="w-[2px] bg-black rounded-full animate-wave-1" />
        <span className="w-[2px] bg-black rounded-full animate-wave-2" />
        <span className="w-[2px] bg-black rounded-full animate-wave-3" />
      </div>
    </div>
  )
}

function getAvatarPosition(index: number, isExpanded: boolean) {
  if (!isExpanded) {
    const startX = 50;
    return {
      x: startX + index * (AVATAR_SIZE_COLLAPSED + AVATAR_OVERLAP),
      y: 11,
      size: AVATAR_SIZE_COLLAPSED,
      opacity: index < 4 ? 1 : 0,
      scale: 1,
    }
  } else {
    const gridStartX = 24;
    const gridStartY = 70;
    const colWidth = 60;
    const rowHeight = 80;

    const col = index % 3;
    const row = Math.floor(index / 3);

    return {
      x: gridStartX + col * colWidth,
      y: gridStartY + row * rowHeight,
      size: AVATAR_SIZE_EXPANDED,
      opacity: index < 6 ? 1 : 0, 
      scale: 1,
    }
  }
}

interface VoiceChatProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function VoiceChat({ isOpen, onToggle }: VoiceChatProps) {
  return (
    <div
      onClick={() => !isOpen && onToggle()}
      className={cn(
        "relative bg-[#0c0c0e]/80 backdrop-blur-3xl shadow-2xl border border-white/5 overflow-hidden isolate",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        !isOpen && "cursor-pointer hover:border-white/10 hover:bg-[#111113]",
      )}
      style={{
        width: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        height: isOpen ? EXPANDED_HEIGHT : 56,
        borderRadius: isOpen ? 32 : 999,
        zIndex: 100,
      }}
    >
      <AudioWaveIcon isExpanded={isOpen} />

      <div
        className={cn(
          "absolute flex items-center gap-0.5 text-nexus-muted",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
        style={{
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <span className="text-xs font-bold font-mono">+3</span>
        <ChevronUp className="w-3 h-3 rotate-180" />
      </div>

      <div
        className={cn(
          "absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-5 pb-3",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        style={{
          transitionDelay: isOpen ? "100ms" : "0ms",
        }}
      >
        <div className="w-6" />
        <h2 className="text-[11px] font-bold text-white uppercase tracking-widest">Live Voice</h2>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ChevronUp 
            className={cn(
              "w-3 h-3 text-nexus-muted transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isOpen ? "rotate-0" : "rotate-180"
            )} 
          />
        </button>
      </div>

      <div
        className={cn(
          "absolute left-6 right-6 h-px bg-white/5",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        style={{ top: 58 }}
      />

      {participants.map((participant, index) => {
        const pos = getAvatarPosition(index, isOpen);
        const delay = isOpen ? index * 30 : (participants.length - 1 - index) * 20;

        return (
          <div
            key={participant.id}
            className="absolute transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              left: pos.x,
              top: pos.y,
              width: pos.size,
              height: isOpen ? pos.size + 20 : pos.size,
              opacity: pos.opacity,
              zIndex: isOpen ? 1 : participants.length - index,
              transitionDelay: `${delay}ms`,
            }}
          >
            <div className="relative flex flex-col items-center">
              <div
                className="rounded-full overflow-hidden ring-[2px] ring-[#0c0c0e] shadow-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  width: pos.size,
                  height: pos.size,
                }}
              >
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <SpeakingIndicator show={isOpen && !!participant.isSpeaking} />

              <span
                className={cn(
                  "absolute text-[9px] font-bold text-nexus-muted whitespace-nowrap",
                  "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  isOpen ? "opacity-100" : "opacity-0",
                )}
                style={{
                  top: pos.size + 4,
                  transitionDelay: isOpen ? `${150 + index * 30}ms` : "0ms",
                }}
              >
                {participant.name}
              </span>
            </div>
          </div>
        )
      })}

      <button
        className={cn(
          "absolute left-4 right-4 bg-nexus-accent text-black py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest",
          "shadow-xl hover:brightness-110 active:scale-[0.98]",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        )}
        style={{
          bottom: 40,
          transitionDelay: isOpen ? "200ms" : "0ms",
        }}
      >
        Join Session
      </button>

      <p
        className={cn(
          "absolute inset-x-0 text-center text-[8px] text-nexus-muted/60 font-bold uppercase tracking-widest",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        style={{
          bottom: 16,
          transitionDelay: isOpen ? "250ms" : "0ms",
        }}
      >
        Nexus Stream Active
      </p>
    </div>
  );
}
