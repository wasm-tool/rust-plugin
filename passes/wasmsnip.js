const {exec} = require("child_process");
const which = require("which");

const cwd = process.cwd();

const binaryNotFound = (
  "Could not find a suitable `wasm-snip` on $PATH. Install"
  + " `wasm-snip` from https://github.com/rustwasm/wasm-snip#executable."
);

function wasmsnip({options, filename, debug, warn}) {

  // Plugin is not configured, ignore
  if (options.wasmsnip === false) {
    debug("wasmsnip is not configured; skipping");

    return Promise.resolve();
  }

  const {
    snipRustPanickingCode = false,
    snipRustFmtCode = false,
    functions = []
  } = options.wasmsnip;

  return new Promise((resolve, reject) => {
    const bin = which.sync("wasm-snip", {nothrow: true});

    if (bin === null) {
      return reject(binaryNotFound);
    }

    const splitedCommand = [
      bin,
      filename,
      "-o", filename
    ];

    if (snipRustPanickingCode === true) {
      splitedCommand.push("--snip-rust-panicking-code");
    }

    if (snipRustFmtCode === true) {
      splitedCommand.push("--snip-rust-fmt-code");
    }

    functions.forEach(fn => {
      if (fn instanceof RegExp === true) {
        let pattern = fn.toString();

        // remove fist / and end /
        pattern = pattern.slice(1).slice(0, -1);

        splitedCommand.push(`--pattern "${pattern}"`);
      }
    });

    functions.forEach(fn => {
      if (typeof fn === "string") {
        splitedCommand.push("--");
        splitedCommand.push('"' + fn + '"');
      }
    });

    const command = splitedCommand.join(" ")

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

module.exports = { wasmsnip };
