import React, { useEffect, useRef } from "react";

interface AsciiPyramidProps {
  fillLevels?: { es: number; nq: number; gc: number; other: number };
}

export default function AsciiPyramid({
  fillLevels = { es: 0, nq: 0, gc: 0, other: 0 }
}: AsciiPyramidProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fillLevelsRef = useRef(fillLevels);

  // Update ref when props change to maintain animation continuity
  useEffect(() => {
    fillLevelsRef.current = fillLevels;
  }, [fillLevels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Configuration
    const W = 60; // Grid Width
    const H = 40; // Grid Height
    const FONT_SIZE = 10;
    const CHAR_WIDTH = 6;
    const SCALE = 2.2;
    const SPEED = 0.02;

    // Setup Canvas Resolution
    canvas.width = W * CHAR_WIDTH;
    canvas.height = H * FONT_SIZE;
    ctx.font = `bold ${FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';

    // Updated Colors: Gold (GC), Red (ES), Blue (NQ)
    const faceColors = [
      '#fbbf24', // Gold
      '#ef4444', // Red
      '#3b82f6', // Blue
    ];

    const faceSymbols = ['$', '#', '%'];

    // Tetrahedron Geometry - Apex Up (Standard Pyramid)
    // Apex at -SCALE (Top), Base at SCALE (Bottom)
    const vertices = [
       [0, -SCALE, 0], // 0: Apex (Top)
       [SCALE * Math.cos(0), SCALE, SCALE * Math.sin(0)],           // 1: Right Base (Bottom)
       [SCALE * Math.cos(2 * Math.PI / 3), SCALE, SCALE * Math.sin(2 * Math.PI / 3)], // 2: Back Left Base (Bottom)
       [SCALE * Math.cos(4 * Math.PI / 3), SCALE, SCALE * Math.sin(4 * Math.PI / 3)], // 3: Front Left Base (Bottom)
    ];

    // Faces defined by vertex indices
    // Face 0: Gold (GC)
    // Face 1: Red (ES)
    // Face 2: Blue (NQ)
    const faces = [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 1]
    ];

    let theta = 0;
    let animationId: number;

    const render = () => {
      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Z-Buffer and Frame Buffer
      const zBuffer = new Float32Array(W * H).fill(-Infinity);
      const charBuffer = new Int32Array(W * H).fill(-1); // Stores face index or special code

      // Rotation Matrix (Y-axis)
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Current Fill Levels
      const currentLevels = fillLevelsRef.current;
      const faceFillValues = [currentLevels.gc, currentLevels.es, currentLevels.nq];

      // Rasterize Faces
      faces.forEach((face, faceIndex) => {
          const v0 = vertices[face[0]];
          const v1 = vertices[face[1]];
          const v2 = vertices[face[2]];

          // Sampling density
          const step = 0.02;

          for (let u = 0; u <= 1; u += step) {
             for (let v = 0; u + v <= 1; v += step) {
                 const w = 1 - u - v;

                 // Interpolate Point
                 const x = w*v0[0] + u*v1[0] + v*v2[0];
                 const y = w*v0[1] + u*v1[1] + v*v2[1];
                 const z = w*v0[2] + u*v1[2] + v*v2[2];

                 // Rotate Point
                 const rx = x * cosT - z * sinT;
                 const ry = y;
                 const rz = x * sinT + z * cosT;

                 // Check fill status
                 // Distance from base (y = SCALE) to top (y = -SCALE)
                 // dist = SCALE - y; ranges from 0 (base) to 2*SCALE (apex)
                 const distFromBase = SCALE - y;
                 const totalHeight = 2 * SCALE;
                 const threshold = faceFillValues[faceIndex] * totalHeight;
                 const isFilled = distFromBase <= threshold;

                 // Project (Perspective)
                 const camDist = 5;
                 const pz = 1 / (camDist - rz);
                 
                 const yOffset = 5;
                 
                 const sx = Math.floor(W/2 + rx * pz * 30);
                 const sy = Math.floor(H/2 + ry * pz * 15 + yOffset);

                 if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
                     const idx = sy * W + sx;
                     if (pz > zBuffer[idx]) {
                         zBuffer[idx] = pz;
                         // Store faceIndex if filled, faceIndex + 3 if empty
                         charBuffer[idx] = isFilled ? faceIndex : (faceIndex + 3);
                     }
                 }
             }
          }
      });

      // Draw Edges (for definition)
      faces.forEach((face, faceIndex) => {
         const edges = [[face[0], face[1]], [face[1], face[2]], [face[2], face[0]]];
         edges.forEach(edge => {
            const vA = vertices[edge[0]];
            const vB = vertices[edge[1]];
            
            const steps = 50;
            for(let i=0; i<=steps; i++) {
                const t = i/steps;
                const x = vA[0] + (vB[0]-vA[0])*t;
                const y = vA[1] + (vB[1]-vA[1])*t;
                const z = vA[2] + (vB[2]-vA[2])*t;

                const rx = x * cosT - z * sinT;
                const ry = y;
                const rz = x * sinT + z * cosT;

                const camDist = 5;
                const pz = 1 / (camDist - rz);
                const yOffset = 5;

                const sx = Math.floor(W/2 + rx * pz * 30);
                const sy = Math.floor(H/2 + ry * pz * 15 + yOffset);

                if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
                    const idx = sy * W + sx;
                    if (pz + 0.01 > zBuffer[idx]) {
                        zBuffer[idx] = pz + 0.01;
                        charBuffer[idx] = 10 + faceIndex; // Edge
                    }
                }
            }
         });
      });


      // Render Buffer to Canvas
      for (let i = 0; i < W * H; i++) {
         const val = charBuffer[i];
         if (val !== -1) {
             const x = (i % W) * CHAR_WIDTH;
             const y = Math.floor(i / W) * FONT_SIZE;
             
             let char = '';
             let color = '';

             if (val >= 10) {
                 // Edge
                 char = '+';
                 color = '#ffffff'; 
             } else if (val < 3) {
                 // Filled Face
                 char = faceSymbols[val];
                 color = faceColors[val];
             } else {
                 // Empty Face (val 3, 4, 5)
                 // Use a subtle character and dark color for "empty" scaffold look
                 char = '·'; 
                 color = '#333333';
             }

             ctx.fillStyle = color;
             ctx.fillText(char, x, y);
         }
      }

      theta += SPEED;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, []); // Run once, use ref for updates

  return (
    <div className="w-full h-full flex items-center justify-center relative select-none pointer-events-none overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {/* Glow effect underneath */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 blur-xl rounded-full pointer-events-none" />
    </div>
  );
}