import React, { useEffect, useRef } from 'react';

const PaperBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { 
      alpha: false, 
      depth: false, 
      antialias: false, 
      preserveDrawingBuffer: false 
    });
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 resolution;
      uniform float time;

      // Optimized Simplex noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / resolution.xy;
        float t = time * 0.05; // Slower for elegance and performance perception
        
        float noise1 = snoise(st * 2.0 + t);
        float noise2 = snoise(st * 4.0 - t * 1.2);
        
        float finalNoise = (noise1 + noise2 * 0.5);
        
        vec3 color1 = vec3(0.04, 0.04, 0.06); 
        vec3 color2 = vec3(0.08, 0.1, 0.18);   
        vec3 color3 = vec3(0.0, 0.0, 0.0);    
        
        vec3 finalColor = mix(color1, color2, finalNoise * 0.4 + 0.4);
        finalColor = mix(finalColor, color3, st.y * 0.7);

        // Static grain is cheaper than dynamic grain
        float grain = fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453);
        finalColor += grain * 0.02;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const timeLocation = gl.getUniformLocation(program, 'time');

    let startTime = Date.now();
    let animationFrameId: number;

    const updateCanvasSize = () => {
      // PERFORMANCE OPTIMIZATION: Render at 1/2 resolution (4x fewer pixels)
      // For a blurred background, high pixel density is unnecessary.
      const scaleFactor = 0.5;
      const width = Math.floor(window.innerWidth * scaleFactor);
      const height = Math.floor(window.innerHeight * scaleFactor);
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const render = () => {
      updateCanvasSize();
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (Date.now() - startTime) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
       updateCanvasSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };

  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-50 pointer-events-none"
      style={{ imageRendering: 'auto' }} // Ensure smooth upscaling
    />
  );
};

export default PaperBackground;