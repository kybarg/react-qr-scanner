import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import worker from "rollup-plugin-worker";

import pkg from "./package.json";

const INPUT_FILE_PATH = "src/index.js";
const OUTPUT_NAME = "RectQrScanner";

const PLUGINS = [
  peerDepsExternal(),
  babel({
    babelHelpers: "runtime",
    exclude: "node_modules/**",
  }),
  resolve({
    browser: true,
  }),
  commonjs(),
];

const EXTERNAL = ["react", "react-dom", "prop-types"];

// https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
const CJS_AND_ES_EXTERNALS = EXTERNAL.concat(/@baberk\/runtime/);

const OUTPUT_DATA = [
  {
    file: pkg.browser,
    format: "umd",
  },
  {
    file: pkg.main,
    format: "cjs",
    exports: "default",
  },
  {
    file: pkg.module,
    format: "esm",
  },
];

const config = OUTPUT_DATA.map(({ file, format, exports }) => ({
  input: INPUT_FILE_PATH,
  output: {
    file,
    format,
    exports,
    name: OUTPUT_NAME,
  },
  external: ["cjs", "esm"].includes(format) ? CJS_AND_ES_EXTERNALS : EXTERNAL,
  plugins: [
    worker({
      prefix: 'worker!',
      plugins: PLUGINS,
      uglify: true,
    }),
  ].concat(...PLUGINS),
}));

export default config;
