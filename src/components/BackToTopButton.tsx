import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-16 right-5 z-30 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-600/30 dark:border-emerald-500/40 bg-white dark:bg-[#111827] text-emerald-700 dark:text-emerald-300 shadow-sm hover:bg-emerald-50 dark:hover:bg-slate-800 transition-[opacity,transform] duration-200 cursor-pointer ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-3.5 h-3.5" />
      Top
    </button>
  );
}
