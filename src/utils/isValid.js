// src/utils/isValid.js
export default function isValid(value) {
  if (value === null || value === undefined) return false;
  const v = String(value).trim().toLowerCase();
  return v !== '' && v !== 'n/a';
}
