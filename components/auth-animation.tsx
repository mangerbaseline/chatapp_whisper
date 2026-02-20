"use client";

import { useState, useEffect } from "react";

export function AuthAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-muted flex items-center justify-center pointer-events-none select-none">
      <svg
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover opacity-80"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.6" />
            <stop
              offset="100%"
              stopColor="var(--secondary)"
              stopOpacity="0.6"
            />
          </linearGradient>
          <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.4" />
          </linearGradient>
          <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
          </filter>
        </defs>

        <circle
          cx="400"
          cy="400"
          r="300"
          fill="url(#grad1)"
          filter="url(#blur)"
        >
          <animate
            attributeName="cx"
            values="400;450;350;400"
            dur="20s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="400;350;450;400"
            dur="25s"
            repeatCount="indefinite"
          />
        </circle>

        <circle
          cx="200"
          cy="200"
          r="250"
          fill="url(#grad2)"
          filter="url(#blur)"
        >
          <animate
            attributeName="cx"
            values="200;150;250;200"
            dur="15s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="200;250;150;200"
            dur="18s"
            repeatCount="indefinite"
          />
        </circle>

        {/* The Lock and Key Animation */}
        <g transform="translate(400, 400)">
          {/* Lock Shackle */}
          <path
            d="M-50,0 V-60 A50,50 0 0,1 50,-60 V0"
            stroke="var(--primary)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            className="animate-[shackle_4s_ease-in-out_infinite]"
          />
          {/* Lock Body */}
          <rect
            x="-70"
            y="0"
            width="140"
            height="110"
            rx="12"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth="4"
            className="animate-[lock-pulse_4s_ease-in-out_infinite]"
          />
          {/* Keyhole */}
          <circle cx="0" cy="45" r="10" fill="var(--primary)" opacity="0.8" />
          <path
            d="M-5,45 L5,45 L8,75 L-8,75 Z"
            fill="var(--primary)"
            opacity="0.8"
          />

          {/* Key */}
          <g className="animate-[key-sequence_4s_ease-in-out_infinite]">
            <circle
              cx="55"
              cy="0"
              r="15"
              stroke="var(--accent)"
              strokeWidth="3"
              fill="none"
            />
            <rect x="0" y="-2" width="55" height="4" fill="var(--accent)" />
            <rect x="10" y="2" width="6" height="8" fill="var(--accent)" />
            <rect x="22" y="2" width="6" height="5" fill="var(--accent)" />
          </g>
        </g>

        <style jsx>{`
          @keyframes shackle {
            0%,
            25% {
              transform: translateY(0);
            }
            45%,
            65% {
              transform: translateY(-30px);
            }
            85%,
            100% {
              transform: translateY(0);
            }
          }
          @keyframes lock-pulse {
            40%,
            50% {
              transform: scale(1.08);
            }
            0%,
            35%,
            55%,
            100% {
              transform: scale(1);
            }
          }
          @keyframes key-sequence {
            0% {
              transform: translate(150px, 45px) rotate(0deg);
              opacity: 0;
            }
            15% {
              transform: translate(80px, 45px) rotate(0deg);
              opacity: 1;
            }
            30% {
              transform: translate(5px, 45px) rotate(0deg);
            }
            40% {
              transform: translate(5px, 45px) rotateX(70deg);
            }
            60% {
              transform: translate(5px, 45px) rotateX(70deg);
            }
            75% {
              transform: translate(5px, 45px) rotate(0deg);
            }
            85% {
              transform: translate(80px, 45px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translate(150px, 45px) rotate(0deg);
              opacity: 0;
            }
          }
        `}</style>

        {/* Abstract floating shapes */}
        <g opacity="0.5">
          <path
            d="M200,400 Q300,300 400,400 T600,400"
            stroke="var(--primary)"
            strokeWidth="2"
            fill="none"
          >
            <animate
              attributeName="d"
              values="M200,400 Q300,300 400,400 T600,400; M200,400 Q300,500 400,400 T600,400; M200,400 Q300,300 400,400 T600,400"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
          <circle
            cx="400"
            cy="400"
            r="100"
            stroke="var(--secondary)"
            strokeWidth="1"
            fill="none"
          >
            <animate
              attributeName="r"
              values="100;120;100"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="400"
            cy="400"
            r="150"
            stroke="var(--primary)"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          >
            <animate
              attributeName="r"
              values="150;140;150"
              dur="12s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Rotating Geometric patterns */}
        <g transform="translate(400,400)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="60s"
              repeatCount="indefinite"
            />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x="200"
                y="-1"
                width="40"
                height="2"
                fill="var(--primary)"
                opacity={0.3}
                transform={`rotate(${i * 30})`}
              />
            ))}
          </g>
        </g>

        {/* Particle-like elements */}
        {mounted &&
          Array.from({ length: 20 }).map((_, i) => (
            <circle
              key={i}
              r={Math.random() * 3}
              fill="var(--primary)"
              opacity="0.4"
            >
              <animate
                attributeName="cx"
                values={`${Math.random() * 800};${Math.random() * 800};${Math.random() * 800}`}
                dur={`${15 + Math.random() * 20}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values={`${Math.random() * 800};${Math.random() * 800};${Math.random() * 800}`}
                dur={`${15 + Math.random() * 20}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
      </svg>

      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-multiply"></div>

      {/* Glassmorphism Highlight */}
      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent"></div>
    </div>
  );
}
