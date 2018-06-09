const {extname} = require("path");
const tempy = require('tempy');
const {writeFileSync, readFileSync, unlinkSync} = require('fs');

const getPreset = n => require(`./presets/${n}.js`);

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
        console.log("debug", ...msg);
      }
    },

    warn(msg /*: string */) {
      // warnings are not showned by Webpack is production, so we log directly instead
      if (options.env === "production") {
        console.warn(msg);
      } else {
        compilation.warnings.push(new Error(msg));
      }
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

  _configure(webpackMode, warn) {
    let env = "production";

    if (webpackMode === "development") {
      env = "debug";
    }

    if (env === "production" && this._options.profiling === true) {
      warn("You are profiling a production build, this might not be intended.");
    }

    if (this._options.profiling === true) {
      env = "profiling";
    }

    const {configureOptions, configurePasses} = getPreset(env);

    this._options.env = env;

    this._options = configureOptions(this._options);
    this._passes = configurePasses(this._options);
  }

  apply(compiler) {
    compiler.plugin("emit", (compilation, ok) => {

      this._configure(
        compiler.options.mode,
        msg => compilation.warnings.push(new Error(msg))
      );

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

        const p = runner.runPasses(this._passes)
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
