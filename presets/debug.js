const {wasmopt} = require("../passes/wasmopt.js");
const {wasmsnip} = require("../passes/wasmsnip.js");

export function configureOptions(options = {}) {
  options.debug = true;
  options.wasmopt = {};
  options.wasmsnip = false;

  return options;
}

export function configurePasses(options = {}) {
  return [
    wasmopt,
    wasmsnip
  ];
}

