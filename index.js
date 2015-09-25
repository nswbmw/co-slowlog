'use strict';

let _ = require('lodash');
let isGeneratorFn = require('is-generator').fn;
let bunyan = require('bunyan');
let merge = require('merge-descriptors');

/**
 * slowlog
 * 
 * @param {Object} defaultConfig
 * @return {Function}
 * @api public
 */

module.exports = function (defaultConfig) {
  defaultConfig = defaultConfig || {};
  if ('object' !== typeof defaultConfig) {
    throw new Error('`defaultConfig` must be object!');
  }
  defaultConfig.slow = defaultConfig.slow || 500; //ms
  defaultConfig.name = defaultConfig.name || module.parent.filename;

  let logger = bunyan.createLogger(defaultConfig);

  return function (fn, options) {
    options = options || {};
    merge(options, defaultConfig, false);

    if (isGeneratorFn(fn)) {
      // GeneratorFunction
      return function* () {
        let args =  [].slice.call(arguments);
        let start = Date.now();

        var result = yield fn.apply(fn, args);

        var slow = Date.now() - start;
        if (slow >= options.slow) {
          options = _.omit(options, 'stream', 'streams', 'serializers');
          let log = merge({ input: args, output: result, fn: fn.name, filename: module.parent.filename }, options);
          logger.info(log, slow + 'ms');
        }
        return result;
      };
    } else {
      // Promise
      return function () {
        let args =  [].slice.call(arguments);
        let start = Date.now();

        return fn.apply(fn, args)
          .then(function (result) {
            var slow = Date.now() - start;
            if (slow >= options.slow) {
              options = _.omit(options, 'stream', 'streams', 'serializers');
              let log = merge({ input: args, output: result, fn: fn.name, filename: module.parent.filename }, options);
              logger.info(log, slow + 'ms');
            }
            return result;
          });
      };
    }
  };
};