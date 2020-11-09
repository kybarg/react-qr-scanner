import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: [
      {
        file: pkg.main,
        format: 'cjs'
      },
      {
        file: pkg.module,
        format: 'esm'
      }
    ],
    plugins: [
      external(),
      webWorkerLoader({ targetPlatform: 'browser' }),
      babel({
        exclude: 'node_modules/**'
      }),
      resolve(), // so Rollup can find `ms`
      commonjs() // so Rollup can convert `ms` to an ES module
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  // {
  // 	input: 'src/index.js',
  // 	// external: ['ms'],
  // 	output: [
  // 		{ file: pkg.main, format: 'cjs' },
  // 		{ file: pkg.module, format: 'es' }
  // 	]
  // }
];
