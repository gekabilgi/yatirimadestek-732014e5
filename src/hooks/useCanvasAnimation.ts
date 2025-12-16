import { RefObject, useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface MousePosition {
  x: number;
  y: number;
}

export const useCanvasAnimation = (canvasRef: RefObject<HTMLCanvasElement>, containerRef: RefObject<HTMLElement>) => {
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if mobile/tablet
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    // Adjust particle count based on device
    const particleCount = isMobile ? 40 : isTablet ? 80 : 150;
    const connectionDistance = isMobile ? 100 : isTablet ? 140 : 180;
    const mouseRadius = 150;

    // Initialize canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: Math.random() * 1.5 + 1.5,
        });
      }
    };

    initParticles();

    // Update particle position
    const updateParticle = (particle: Particle) => {
      // Apply velocity decay (friction for slow motion effect)
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      // Keep within bounds
      particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      
      // Limit base velocity to slow motion range (when mouse not hovering)
      const baseMaxVelocity = 0.3;
      if (Math.abs(particle.vx) > baseMaxVelocity) particle.vx *= 0.95;
      if (Math.abs(particle.vy) > baseMaxVelocity) particle.vy *= 0.95;
    };

    // Draw particle
    const drawParticle = (particle: Particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    };

    // Draw connections between nearby particles
    const drawConnections = () => {
      const particles = particlesRef.current;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Apply mouse interaction (only on desktop)
    const applyMouseForce = () => {
      if (isMobile) return;

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      particles.forEach((particle) => {
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseRadius) {
          // Draw connection to mouse
          const opacity = (1 - distance / mouseRadius) * 0.3;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();

          // Acceleration: repulsion + speed boost when mouse hovers
          const force = (mouseRadius - distance) / mouseRadius;
          const angle = Math.atan2(dy, dx);
          
          // Enhanced acceleration multiplier
          const accelerationMultiplier = 0.05;
          particle.vx += Math.cos(angle) * force * accelerationMultiplier;
          particle.vy += Math.sin(angle) * force * accelerationMultiplier;
          
          // Add tangential acceleration for swirling effect
          const tangentAngle = angle + Math.PI / 2;
          particle.vx += Math.cos(tangentAngle) * force * 0.02;
          particle.vy += Math.sin(tangentAngle) * force * 0.02;

          // Increased max velocity during mouse interaction (controlled acceleration)
          const maxVelocity = 1.5;
          particle.vx = Math.max(-maxVelocity, Math.min(maxVelocity, particle.vx));
          particle.vy = Math.max(-maxVelocity, Math.min(maxVelocity, particle.vy));
        }
      });
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update particles
      particlesRef.current.forEach(updateParticle);

      // Draw connections
      drawConnections();

      // Draw particles
      particlesRef.current.forEach(drawParticle);

      // Mouse interaction
      applyMouseForce();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      
      const canvasRect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top,
      };
    };

    // Resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        initParticles();
      }, 250);
    };

    // Event listeners - attach to container instead of canvas
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [canvasRef, containerRef]);
};
