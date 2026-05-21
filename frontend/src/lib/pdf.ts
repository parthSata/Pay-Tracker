// @ts-ignore
import html2pdf from "html2pdf.js";
import { toast } from "sonner";

const colorCache = new Map<string, string>();
let tempCanvas: HTMLCanvasElement | null = null;
let tempCtx: CanvasRenderingContext2D | null = null;

/**
 * Converts any oklch(...), oklab(...), lch(...), or lab(...) color values in a CSS property string
 * to rgba(...) format by drawing them on a temporary 1x1 canvas and reading back the computed RGBA values.
 */
function convertUnsupportedColorsToRgba(cssValue: string): string {
  if (!cssValue || typeof cssValue !== "string") {
    return cssValue;
  }

  if (
    !cssValue.includes("oklch") &&
    !cssValue.includes("oklab") &&
    !cssValue.includes("lch") &&
    !cssValue.includes("lab")
  ) {
    return cssValue;
  }

  // Replace all occurrences of modern color functions in the string
  return cssValue.replace(/(oklch|oklab|lch|lab)\([^)]+\)/g, (match) => {
    if (colorCache.has(match)) {
      return colorCache.get(match)!;
    }

    try {
      if (!tempCanvas) {
        tempCanvas = document.createElement("canvas");
        tempCanvas.width = 1;
        tempCanvas.height = 1;
        tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
      }

      if (!tempCtx) return match;

      // Clear the 1x1 pixel to correctly capture transparency
      tempCtx.clearRect(0, 0, 1, 1);
      tempCtx.fillStyle = match;
      tempCtx.fillRect(0, 0, 1, 1);

      const [r, g, b, a] = tempCtx.getImageData(0, 0, 1, 1).data;
      const rgbaColor = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
      colorCache.set(match, rgbaColor);
      return rgbaColor;
    } catch (e) {
      console.warn("Failed to convert unsupported color match:", match, e);
      return match;
    }
  });
}

export function downloadInvoicePDF(elementId: string, invoiceNumber: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error("Invoice display element not found.");
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  toast.info("Generating PDF, please wait...");

  const opt = {
    margin:       0,
    filename:     `Invoice_${invoiceNumber}.pdf`,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { 
      scale: 2.5, 
      useCORS: true, 
      letterRendering: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      backgroundColor: null // Keep the background transparent
    },
    jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
  };

  // Intercept window.getComputedStyle to translate modern colors into standard RGBA.
  // html2canvas relies on computed styles, which crash on modern color formats.
  const originalGetComputedStyle = window.getComputedStyle;
  const restore = () => {
    (window as any).getComputedStyle = originalGetComputedStyle;
  };

  (window as any).getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const style = originalGetComputedStyle(elt, pseudoElt);

    return new Proxy(style, {
      get(target, prop) {
        // Access directly from target instead of using receiver to avoid "Illegal invocation" errors on built-in getters
        const value = (target as any)[prop];

        // Intercept function calls like getPropertyValue(...)
        if (typeof value === "function") {
          return function (...args: any[]) {
            const res = value.apply(target, args);
            if (typeof res === "string") {
              return convertUnsupportedColorsToRgba(res);
            }
            return res;
          };
        }

        // Intercept direct property accesses
        if (typeof value === "string") {
          return convertUnsupportedColorsToRgba(value);
        }

        return value;
      }
    });
  };

  try {
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        restore();
        toast.success("Invoice PDF downloaded successfully!");
      })
      .catch((err: any) => {
        restore();
        toast.error("Failed to generate PDF.");
        console.error("PDF generation error:", err);
      });
  } catch (err: any) {
    restore();
    toast.error("Failed to generate PDF.");
    console.error("PDF generation error:", err);
  }
}
