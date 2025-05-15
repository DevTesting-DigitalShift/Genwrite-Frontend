import { onCLS, onLCP, onINP, onTTFB } from "web-vitals";

function reportWebVitals(logFn = console.log) {
  onCLS(logFn);
  onLCP(logFn);
  onINP(logFn);
  onTTFB(logFn);
}

export default reportWebVitals;
