import { useEffect, useRef, useState } from 'react';

/* IntersectionObserver-backed active-section tracker for a snap container.
   Returns [activeIndex, refsArray] — attach refsArray[i] to each section. */
export default function useActiveSection(count) {
  const [active, setActive] = useState(0);
  const refs = useRef(Array.from({ length: count }, () => ({ current: null })));

  useEffect(() => {
    const ratios = new Array(count).fill(0);
    const elements = refs.current.map((r) => r.current).filter(Boolean);
    if (elements.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = refs.current.findIndex((r) => r.current === e.target);
          if (i >= 0) ratios[i] = e.intersectionRatio;
        });
        let best = 0;
        let bestR = -1;
        for (let i = 0; i < count; i++) {
          if (ratios[i] > bestR) {
            bestR = ratios[i];
            best = i;
          }
        }
        setActive((prev) => (prev === best ? prev : best));
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [count]);

  return [active, refs.current];
}
