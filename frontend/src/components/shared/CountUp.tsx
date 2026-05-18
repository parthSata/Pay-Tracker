import { useEffect, useState } from "react";

export function CountUp({
  to,
  duration = 1200,
  prefix = "",
  format,
}: {
  to: number;
  duration?: number;
  prefix?: string;
  format?: (n: number) => string;
}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(to * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  const display = format ? format(val) : Math.round(val).toLocaleString();
  return (
    <span className="tabular-nums">
      {prefix}
      {display}
    </span>
  );
}
