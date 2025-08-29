// Polyfills for atob/btoa in Node test environment
if (typeof atob === 'undefined') {
  global.atob = (data) => Buffer.from(data, 'base64').toString('binary');
}
if (typeof btoa === 'undefined') {
  global.btoa = (data) => Buffer.from(data, 'binary').toString('base64');
}

// TextEncoder / TextDecoder (Node < 19 fallback)
if (typeof TextEncoder === 'undefined') {
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// crypto.subtle (use Node webcrypto)
if (typeof crypto === 'undefined' || !crypto.subtle) {
  // @ts-ignore
  global.crypto = require('crypto').webcrypto;
}
