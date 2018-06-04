# rust-plugin

> Rust plugin for Webpack

## Installation

```sh
yarn add rust-plugin
```

## Options

| name   | description |
|--------|-------------|
| `debug` | Enable debug mode |
| `wasmopt.level` | configure `wasm-opt` optimization level (default `z`) |
| `wasmopt.required` | throw if the binary is not available (default `false`: warn) |
| `wasmsnip.snipRustPanickingCode` | Snip Rust's `std::panicking` and `core::panicking` code |
| `wasmsnip.snipRustFmtCode` | Snip Rust's `std::fmt` and `core::fmt` code |
| `wasmsnip.functions` | Snip any function that matches the given regular expression or a string |

## Example

```js
const RustPlugin = require("rust-plugin");

module.exports = {
  entry: "./index.js",
  plugins: [
    new RustPlugin({
        debug: true,
        wasmopt: {
            level: '0'
        }
    })
  ]
};

```

