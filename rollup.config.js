import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import webWorkerLoader from "rollup-plugin-web-worker-loader";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

import pkg from "./package.json";

const INPUT_FILE_PATH = "src/index.js";
const OUTPUT_NAME = "RectQrScanner";

const PLUGINS = [
  webWorkerLoader({
    targetPlatform: "browser",
    inline: true,
    plugins: [
      peerDepsExternal(),
      babel({
        babelHelpers: "runtime",
        exclude: "node_modules/**",
      }),
      resolve({
        browser: true,
      }),
      commonjs()
    ],
  }),
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
  plugins: PLUGINS,
}));

export default config;
