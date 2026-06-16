export interface DecodedToken {
  id: number;
  role: string;
  exp: number;
  [key: string]: any;
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    let base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error('Invalid base64 string');
      }
      base64 += new Array(5 - pad).join('=');
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }
    
    let bufferLength = base64.length * 0.75;
    if (base64[base64.length - 1] === '=') {
      bufferLength--;
      if (base64[base64.length - 2] === '=') {
        bufferLength--;
      }
    }
    
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < base64.length; i += 4) {
      const encoded1 = lookup[base64.charCodeAt(i)];
      const encoded2 = lookup[base64.charCodeAt(i + 1)];
      const encoded3 = lookup[base64.charCodeAt(i + 2)];
      const encoded4 = lookup[base64.charCodeAt(i + 3)];
      
      const bytes1 = (encoded1 << 2) | (encoded2 >> 4);
      const bytes2 = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      const bytes3 = ((encoded3 & 3) << 6) | encoded4;
      
      bytes[p++] = bytes1;
      if (p < bufferLength) bytes[p++] = bytes2;
      if (p < bufferLength) bytes[p++] = bytes3;
    }
    
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    
    const utf8Str = decodeURIComponent(
      str
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(utf8Str);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}
