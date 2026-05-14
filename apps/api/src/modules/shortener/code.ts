import { customAlphabet } from "nanoid";

const generateNanoCode = customAlphabet(
  "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  7,
);

export const generateCode = () => generateNanoCode();
