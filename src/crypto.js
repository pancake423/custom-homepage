const {
  createHash,
  randomBytes,
  pbkdf2Sync,
  createCipheriv,
  createDecipheriv,
} = await import("node:crypto");

export const config = {
  hashAlg: "sha512",
  cipherAlg: "aes-256-cbc",
  encoding: "base64",
  saltLen: 16,
  ivLen: 16,
  tokenLen: 32,
  keyLen: 32,
  rounds: 100000,
};

/**
 * hashes the given string.
 *
 * @param {string} str - the string to hash.
 * @returns {string} base64 hash of the content.
 */
export function hash(str) {
  const h = createHash(config.hashAlg);

  h.update(str);
  return h.digest(config.encoding);
}

/**
 * generates a cryptographically secure random string.
 *
 * @param {number} size - size of the random data in bytes. resulting length depends on the encoding format.
 * @returns {string}
 */
export function randomString(size = 256) {
  return randomBytes(size).toString(config.encoding);
}

/**
 * generates a random salt of the correct length.
 *
 * @returns {string}
 */
export function salt() {
  return randomString(config.saltLen);
}

/**
 * generates a random iv of the correct length.
 *
 * @returns {string}
 */
export function iv() {
  return randomString(config.ivLen);
}

/**
 * generates a random token of the correct length.
 *
 * @returns {string}
 */
export function token() {
  return randomString(config.tokenLen);
}

/**
 * symmetrically encrypts a string.
 *
 * @param {string} string
 * @param {string} token
 * @param {string} salt
 * @param {string} iv
 * @returns encrypted string.
 */
export function encrypt(string, token, salt, iv) {
  // pwbkdf to convert our token + salt into a key
  // cipher encrypt the text using that key
  const key = pbkdf2Sync(
    token,
    salt,
    config.rounds,
    config.keyLen,
    config.hashAlg,
  );

  let cipher = createCipheriv(
    config.cipherAlg,
    key,
    Buffer.from(iv, config.encoding),
  );
  let encrypted = cipher.update(string);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return encrypted.toString(config.encoding);
}

/**
 * symmetrically decrypts a string.
 *
 * @param {string} string
 * @param {string} token
 * @param {string} salt
 * @param {string} iv
 * @returns encrypted string.
 */
export function decrypt(string, token, salt, iv) {
  // pwbkdf to convert our token + salt into a key
  // cipher encrypt the text using that key
  const key = pbkdf2Sync(
    token,
    salt,
    config.rounds,
    config.keyLen,
    config.hashAlg,
  );

  let encryptedText = Buffer.from(string, config.encoding);
  let decipher = createDecipheriv(
    config.cipherAlg,
    key,
    Buffer.from(iv, config.encoding),
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  // returns data after decryption
  return decrypted.toString();
}
