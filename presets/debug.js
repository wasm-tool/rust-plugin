const {wasmopt} = require("../passes/wasmopt.js");
const {wasmsnip} = require("../passes/wasmsnip.js");

function configureOptions(options = {}) {
  return options;
}

function configurePasses(options = {}) {
  return [
    wasmsnip
  ];
}

module.exports = { configureOptions, configurePasses };
