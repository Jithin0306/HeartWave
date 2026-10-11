import type { HeartwaveApi } from './index';

declare global {
  interface Window {
    heartwaveApi: HeartwaveApi;
  }
}

export {};
