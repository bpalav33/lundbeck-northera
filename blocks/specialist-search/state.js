// Shared state for the specialist-search block. Both specialist-search.js
// and form.js need to read/write `config` and `resultSection`; importing
// them directly from each other created a circular dependency, so this
// module exists purely to hold that shared state without either file
// depending on the other.

let config = {};
let resultSection;

export function getConfig() {
  return config;
}

export function setConfig(value) {
  config = value;
}

export function getResultSection() {
  return resultSection;
}

export function setResultSection(value) {
  resultSection = value;
}
