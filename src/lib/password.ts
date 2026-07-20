import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const keyLength = 64;
const cost = 16384;
const blockSize = 8;
const parallelization = 1;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await deriveKey(password, salt);

  return [
    "scrypt",
    cost,
    blockSize,
    parallelization,
    salt.toString("hex"),
    hash.toString("hex"),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, rawCost, rawBlockSize, rawParallelization, rawSalt, rawHash] =
    storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    Number(rawCost) !== cost ||
    Number(rawBlockSize) !== blockSize ||
    Number(rawParallelization) !== parallelization ||
    !rawSalt ||
    !rawHash
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(rawHash, "hex");
    const actual = await deriveKey(password, Buffer.from(rawSalt, "hex"));

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      { N: cost, r: blockSize, p: parallelization, maxmem: 32 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}
