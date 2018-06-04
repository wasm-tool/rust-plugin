const {exec} = require("child_process");
const which = require("which");

const cwd = process.cwd();

const binaryNotFound = (
  "Could not find a suitable `wasm-opt` on $PATH. Install"
  + " `wasm-opt` from the `binaryen` suite to produce smaller"
  + " and faster `.wasm` binaries!"
  + "\n\n"
  + "See https://github.com/WebAssembly/binaryen"
);

function wasmopt({options, filename, debug, warn}) {
  const {
    required = false,
    level = "z"
  } = options.wasmopt;

  return new Promise((resolve, reject) => {

    const bin = which.sync("wasm-opt", {nothrow: true});

    if (bin === null) {
      if (required === true) {
        return reject(binaryNotFound);
      } else {
        return warn(binaryNotFound);
      }
    }

    const command = [
      bin,
      "-O" + level,
      "-o", filename,
      filename
    ].join(" ");

    debug("command", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      debug(stdout);
      debug(stderr);

      resolve();
    });
  });
}

module.exports = { wasmopt };
