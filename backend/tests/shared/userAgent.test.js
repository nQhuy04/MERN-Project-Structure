import { describe, expect, it } from 'vitest';
import { parseUserAgent } from '../../src/shared/utils/userAgent.js';

const USER_AGENTS = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  chromeAndroidPhone:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  samsungTablet:
    'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Safari/537.36',
  safariIpad:
    'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
};

describe('[bai-07] parseUserAgent — nhận diện thiết bị cho danh sách phiên', () => {
  it.each([
    ['chromeWindows', 'Chrome', 'Windows', 'desktop'],
    ['edgeWindows', 'Edge', 'Windows', 'desktop'],
    ['safariMac', 'Safari', 'macOS', 'desktop'],
    ['firefoxLinux', 'Firefox', 'Linux', 'desktop'],
    ['safariIphone', 'Safari', 'iOS', 'mobile'],
    ['chromeIphone', 'Chrome', 'iOS', 'mobile'],
    ['chromeAndroidPhone', 'Chrome', 'Android', 'mobile'],
    ['samsungTablet', 'Samsung Internet', 'Android', 'tablet'],
    ['safariIpad', 'Safari', 'iOS', 'tablet'],
  ])('%s → %s / %s / %s', (key, browser, os, deviceType) => {
    expect(parseUserAgent(USER_AGENTS[key])).toEqual({ browser, os, deviceType });
  });

  it('chuỗi rỗng hoặc lạ → "Không xác định"', () => {
    expect(parseUserAgent('')).toEqual({
      browser: 'Không xác định',
      os: 'Không xác định',
      deviceType: 'desktop',
    });
    expect(parseUserAgent('curl/8.6.0').browser).toBe('Không xác định');
  });
});
