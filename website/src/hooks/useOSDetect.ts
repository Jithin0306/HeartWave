import { useState, useEffect } from 'react';

export type UserOS = 'windows' | 'macos' | 'linux' | 'mobile';

export function useOSDetect(): { os: UserOS; osName: string } {
  const [os, setOS] = useState<UserOS>('windows');
  const [osName, setOSName] = useState<string>('Windows');

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      setOS('mobile');
      setOSName('Mobile');
    } else if (ua.includes('mac') || ua.includes('darwin')) {
      setOS('macos');
      setOSName('macOS');
    } else if (ua.includes('linux') || ua.includes('x11')) {
      setOS('linux');
      setOSName('Linux');
    } else {
      setOS('windows');
      setOSName('Windows');
    }
  }, []);

  return { os, osName };
}
