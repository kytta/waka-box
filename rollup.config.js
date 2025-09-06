// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "index.js",
  output: {
    esModule: true,
    file: "dist/index.js",
    format: "es",
  },
  plugins: [commonjs(), nodeResolve({ preferBuiltins: true })],
};
