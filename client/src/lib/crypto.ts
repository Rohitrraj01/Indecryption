import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from "tweetnacl-util";

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export function generateKeyPair(): KeyPair {
  const keypair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keypair.publicKey),
    secretKey: encodeBase64(keypair.secretKey),
  };
}

export function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderSecretKey: string
): { ciphertext: string; nonce: string } | null {
  try {
    const messageUint8 = encodeUTF8(message);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const recipientPublicKeyUint8 = decodeBase64(recipientPublicKey);
    const senderSecretKeyUint8 = decodeBase64(senderSecretKey);

    const encrypted = nacl.box(
      messageUint8,
      nonce,
      recipientPublicKeyUint8,
      senderSecretKeyUint8
    );

    if (!encrypted) return null;

    return {
      ciphertext: encodeBase64(encrypted),
      nonce: encodeBase64(nonce),
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
}

export function decryptMessage(
  ciphertext: string,
  nonce: string,
  senderPublicKey: string,
  recipientSecretKey: string
): string | null {
  try {
    const ciphertextUint8 = decodeBase64(ciphertext);
    const nonceUint8 = decodeBase64(nonce);
    const senderPublicKeyUint8 = decodeBase64(senderPublicKey);
    const recipientSecretKeyUint8 = decodeBase64(recipientSecretKey);

    const decrypted = nacl.box.open(
      ciphertextUint8,
      nonceUint8,
      senderPublicKeyUint8,
      recipientSecretKeyUint8
    );

    if (!decrypted) return null;

    return decodeUTF8(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

export function truncateKey(key: string, length: number = 8): string {
  if (key.length <= length * 2) return key;
  return `${key.slice(0, length)}...${key.slice(-length)}`;
}
