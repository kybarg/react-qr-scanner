import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

import pkg from './package.json';

const INPUT_FILE_PATH = 'src/index.js';
const OUTPUT_NAME = 'RectQrScanner';

const GLOBALS = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'prop-types': 'PropTypes',
};

const PLUGINS = [
  babel({
    babelHelpers: 'runtime',
    exclude: 'node_modules/**',
  }),
  resolve({
    browser: true,
    resolveOnly: [
      /^(?!react$)/,
      /^(?!react-dom$)/,
      /^(?!prop-types)/,
    ],
  }),
  commonjs(),
];

const EXTERNAL = [
  'react',
  'react-dom',
  'prop-types',
];

// https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
const CJS_AND_ES_EXTERNALS = EXTERNAL.concat(/@baberk\/runtime/, /@zxing\/library/);

const OUTPUT_DATA = [
  {
    file: pkg.browser,
    format: 'umd',
  },
  {
    file: pkg.main,
    format: 'cjs',
    exports: 'default',
  },
  {
    file: pkg.module,
    format: 'es',
  },
];

const config = OUTPUT_DATA.map(({ file, format, exports }) => ({
  input: INPUT_FILE_PATH,
  output: {
    file,
    format,
    exports,
    name: OUTPUT_NAME,
    globals: GLOBALS,
  },
  // external: ['cjs', 'es'].includes(format) ? CJS_AND_ES_EXTERNALS : EXTERNAL,
  plugins: [webWorkerLoader({
    targetPlatform: 'browser',
    // external: ['cjs', 'es'].includes(format) ? CJS_AND_ES_EXTERNALS : EXTERNAL,
    // inline: !['cjs', 'es'].includes(format),
  })].concat(...PLUGINS),
}));

export default config;
