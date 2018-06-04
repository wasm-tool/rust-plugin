const {extname} = require("path");
const tempy = require('tempy');
const {writeFileSync, readFileSync, unlinkSync} = require('fs');

const {wasmopt} = require("./passes/wasmopt.js");
const {wasmsnip} = require("./passes/wasmsnip.js");

const isWasm = n => extname(n) === ".wasm";

const defaultOpts = {
  debug: false,

  wasmopt: {},
  wasmsnip: false
};

function createRunner(compilation, options, bin /*: Buffer */) {
  const filename = tempy.file({extension: 'wasm'});

  writeFileSync(filename, new Buffer(bin));

  return {
    filename,
    options,

    debug(...msg /*: Array<string> */) {
      if (options.debug === true) {
        console.log(...msg);
      }
    },

    warn(msg /*: string */) {
      compilation.warnings.push(new Error(msg));
    },

    runPasses(passFn /*: Array<Function> */)/*: Promise */ {
      const promises = passFn.reduce((acc, fn) => {
        acc.push(fn(this));
        return acc;
      }, []);

      return Promise.all(promises);
    },

    get() /*: Buffer */ {
      const buff = readFileSync(filename, null);
      unlinkSync(filename);

      return buff;
    }
  }
}

module.exports = class {
  constructor(options = {}) {
    this._options = Object.assign({}, defaultOpts, options);
  }

  apply(compiler) {
    compiler.plugin("emit", (compilation, ok) => {
      const processes = [];

      for (const name in compilation.assets) {
        if (isWasm(name) === false) {
          continue;
        }

        const cachedSource = compilation.assets[name];

        const runner = createRunner(
          compilation,
          this._options,
          cachedSource.source()
        );

        const p = runner.runPasses([
          wasmopt,
          wasmsnip
        ])
          .then(runner.get)
          .then(newBin => {

            // Emit the new binary
            compilation.assets[name] = {
              source: () => newBin,
              size: () => newBin.byteLength
            };
          })
          .catch(err => {
            compilation.errors.push(err);
          });

        processes.push(p);
      }

      Promise.all(processes).then(() => ok()).catch(() => ok());
    });
  }
};
