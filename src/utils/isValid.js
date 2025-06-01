// src/utils/isValid.js
export default function isValid(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim().toLowerCase();
  return v !== '' && v !== 'n/a';
}
