const {wasmopt} = require("../passes/wasmopt.js");
const {wasmsnip} = require("../passes/wasmsnip.js");

function configureOptions(options = {}) {
  options.wasmopt.required = true;

  return options;
}

function configurePasses(options = {}) {
  return [
    wasmopt,
    wasmsnip
  ];
}

module.exports = { configureOptions, configurePasses };
