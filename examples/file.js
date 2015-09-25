'use strict';

let fs = require('fs');
let co = require('co');
let wait = require('co-wait');

let logPath = __dirname + '/file.log';
let slowlog = require('..')({
  name: 'example',
  slow: 500,
  streams: [
    {
      path: logPath
    }
  ]
});

function readFile() {
  return function (done) {
    fs.readFile(logPath, { encoding: 'utf8' }, done);
  };
}

let delayGeneratorFunc = slowlog(function* delayGeneratorFunc() {
  yield wait('1000');
  return 'genResult';
});

let delayPromiseFunc = slowlog(function delayPromiseFunc() {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve('promiseResult');
    }, 1000);
  });
});

co(function* () {
  yield delayGeneratorFunc('111', '222');
  yield delayPromiseFunc('333', '444');

  console.log(yield readFile());
  process.exit(0);
}).catch(function (e) {
  console.error(e.stack);
});
