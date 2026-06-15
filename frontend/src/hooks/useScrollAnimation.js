import { useEffect, useRef, useState } from 'react';

export function useScrollAnimation(options = {}) {
  const ref = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isRevealed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, isRevealed]);

  return [ref, isRevealed];
}

export function ScrollReveal({ children, className = 'animate-fade-up', ...props }) {
  const [ref, isRevealed] = useScrollAnimation(props);

  return (
    <div ref={ref} className={`${className} ${isRevealed ? 'revealed' : ''}`}>
      {children}
    </div>
  );
}

export default useScrollAnimation;

