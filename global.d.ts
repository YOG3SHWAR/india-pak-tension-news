// global.d.ts
export {};

declare global {
  interface Window {
    /** Google AdSense queue */
    adsbygoogle?: any[];
  }
}
