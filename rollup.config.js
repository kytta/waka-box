// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

export default {
  input: "index.js",
  output: {
    esModule: true,
    file: "dist/index.js",
    format: "es",
  },
  plugins: [json(), commonjs(), nodeResolve({ preferBuiltins: true })],
};
