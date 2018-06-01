const {extname, join} = require("path");
const tempy = require('tempy');
const {writeFile, readFileSync, unlinkSync} = require('fs');
const {exec} = require("child_process");

const cwd = process.cwd();
const isWasm = n => extname(n) === ".wasm";

const defaultOpts = {};

function formatMessage(msg) {
  let formatted = `(${msg.type}) ${msg.description}`;

  if (msg.file && msg.lineNo >= 0) {
    formatted = `${msg.file}:${msg.lineNo} ${formatted}`;
  }

  return formatted;
}

const compose = (...fns) =>
  fns.reverse().reduce((prevFn, nextFn) =>
    value => nextFn(prevFn(value)),
    value => value
  );

function emit(compilation, filename, bin) {
  compilation.assets[filename] = {
    source: () => bin,
    size: () => bin.byteLength
  };
}

function toTmpFile(buff) {
  const filename = tempy.file({extension: 'wasm'});

  return new Promise(resolve => {
    writeFile(filename, new Buffer(buff), () => resolve(filename));
  });
}

function wasmopt(filename) {
  return new Promise((resolve, reject) => {
    const command = [
      "wasm-opt",
      "-o", filename,
      filename
    ].join(" ");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      resolve(filename);
    });
  });
}

function readAndClean(filename) {
  const buff = readFileSync(filename, null);
  unlinkSync(filename);

  return Promise.resolve(buff);
}

function runPipeline(bin) {
  return toTmpFile(bin)
    .then(wasmopt)
    .then(readAndClean);
}

module.exports = class RustPlugin {
  construtor(options = {}) {
    this._options = Object.assign({}, defaultOpts, options);
  }

  apply(compiler) {
    compiler.plugin("emit", function(compilation, ok) {
      const processes = [];

      for (const name in compilation.assets) {
        if (isWasm(name) === false) {
          continue;
        }

        const cachedSource = compilation.assets[name];

        const p = runPipeline(cachedSource.source())
          .then(newBin => {
            emit(compilation, name, newBin);
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
