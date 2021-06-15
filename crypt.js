export async function encrypt(message, password) {
  const encoded = getMessageEncoding(message);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const { salt, key } = await generateKey(password);
  const cipherArray = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded
  );
  return {
    salt: ab2str(salt),
    cipherText: ab2str(cipherArray),
    iv: ab2str(iv),
  };
}

export async function decrypt({ salt, cipherText, iv }, password) {
  const key = await getKey(password, str2ab(salt));
  const encodedMessage = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: str2ab(iv),
    },
    key,
    str2ab(cipherText)
  );
  return getMessage(encodedMessage);
}

async function generateKey(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await getKey(password, salt);
  return { salt, key };
}

async function getKey(password, salt) {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    getMessageEncoding(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 1000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

function getMessageEncoding(message) {
  const enc = new TextEncoder();
  return enc.encode(message);
}

function getMessage(encoded) {
  const dec = new TextDecoder();
  return dec.decode(encoded);
}

function str2ab(byteString) {
  byteString = atob(byteString);
  const byteArray = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.codePointAt(i);
  }
  return byteArray;
}

function ab2str(arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  let byteString = "";
  for (var i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCodePoint(byteArray[i]);
  }
  return btoa(byteString);
}
