
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize state to a default (e.g., false).
  // This ensures server and initial client render are consistent.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // This effect runs only on the client side after hydration.
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check on mount to set the actual value based on client's window size.
    checkDevice();
    
    // Add event listener for resize
    window.addEventListener('resize', checkDevice);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []); // Empty dependency array: run once on mount, cleanup on unmount.

  return isMobile;
}
