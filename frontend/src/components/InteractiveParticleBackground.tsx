import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
}

export const InteractiveParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 170, // expansive interaction radius
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // High density particle configuration
    const getParticleCount = () => {
      if (window.innerWidth < 768) return 80;
      if (window.innerWidth < 1200) return 140;
      return 210; // Rich, dense constellation
    };

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const count = getParticleCount();
      for (let i = 0; i < count; i++) {
        const radius = Math.random() * 2 + 0.8;
        const baseAlpha = Math.random() * 0.45 + 0.25;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.65,
          vy: (Math.random() - 0.5) * 0.65,
          radius,
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: (Math.random() - 0.5) * 0.015,
        });
      }
    };

    initParticles();

    // Helper: read CSS theme accent color from computed styles
    const getThemeColor = () => {
      const style = getComputedStyle(document.body);
      const accent = style.getPropertyValue('--accent-primary').trim();
      const logoIcon = style.getPropertyValue('--logo-icon').trim();
      return logoIcon || accent || '#3b82f6';
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const themeColor = getThemeColor();

      // Update & Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Subtle twinkling alpha oscillation
        p.baseAlpha += p.twinkleSpeed;
        if (p.baseAlpha > 0.75 || p.baseAlpha < 0.2) {
          p.twinkleSpeed = -p.twinkleSpeed;
        }

        // Bounce on boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse proximity interaction (elastic gravity / push)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          // Push gently away from mouse
          p.x -= Math.cos(angle) * force * 1.8;
          p.y -= Math.sin(angle) * force * 1.8;
          p.alpha = Math.min(1, p.baseAlpha + force * 0.55);

          // Draw laser line from mouse to particle
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = themeColor;
          ctx.globalAlpha = (1 - dist / mouse.radius) * 0.4;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        } else {
          p.alpha = p.baseAlpha;
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = themeColor;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Connect neighboring particles with constellation lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < 105) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = themeColor;
            ctx.globalAlpha = (1 - cdist / 105) * 0.16;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90"
      style={{ display: 'block' }}
    />
  );
};
export default InteractiveParticleBackground;
