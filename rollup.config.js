// See: https://rollupjs.org/introduction/

const commonjs = require('@rollup/plugin-commonjs')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const json = require('@rollup/plugin-json')

module.exports = {
  input: 'index.js',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'cjs'
  },
  plugins: [json(), commonjs(), nodeResolve({ preferBuiltins: true })]
}
