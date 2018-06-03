const {exec} = require("child_process");
const which = require("which");

const cwd = process.cwd();

function wasmopt({options, filename, debug, warn}) {
  const {
    level = "z"
  } = options.wasmopt;

  const bin = which.sync("wasm-opt", {nothrow: true});

  if (bin === null) {
    return warn(
      "Could not find a suitable `wasm-opt` on $PATH. Install"
      + " `wasm-opt` from the `binaryen` suite to produce smaller"
      + " and faster `.wasm` binaries!"
      + "\n\n"
      + "See https://github.com/WebAssembly/binaryen"
    );
  }

  const command = [
    bin,
    "-O" + level,
    "-o", filename,
    filename
  ].join(" ");

  debug("command", command);

  return new Promise((resolve, reject) => {
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
