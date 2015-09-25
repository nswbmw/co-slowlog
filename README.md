## co-slowlog

slowlog for GeneratorFunction or function that return a Promise.

### Install

```
npm i co-slowlog --save
```

### Usage

```
var slowlog = require('co-slowlog')(defaultConfig);
slowlog(fn[, options]) => {GeneratorFunction|function->Promise}
```

defaultConfig {Object}:  
options {Object}:

- name: {String} slowlog name, default `module.parent.filename`.
- slow: {Number->ms} minimum execution time, default `500`ms.
- others options see [bunyan](https://www.npmjs.com/package/bunyan).

### Examples

print to process.stdout:

```
'use strict';

let co = require('co');
let wait = require('co-wait');
let slowlog = require('..')({
  name: 'example',
  slow: 500
});

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

  process.exit(0);
}).catch(function (e) {
  console.error(e.stack);
});
```

written to file:

```
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
```

written to redis:

```
'use strict';

let co = require('co');
let wait = require('co-wait');
let redis = new require('ioredis')();

function RedisLogger() {}
RedisLogger.prototype.write = function (rec) {
  redis.lpush('slowlogs', JSON.stringify(rec));
};

let slowlog = require('..')({
  name: 'example',
  slow: 500,
  streams: [
    {
      type: 'raw',
      stream: new RedisLogger()
    }
  ]
});

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

  console.log(yield redis.lrange('slowlogs', 0, -1));
  process.exit(0);
}).catch(function (e) {
  console.error(e.stack);
});
```
output:

```
{"name":"example","slow":500,"hostname":"nswbmw.local","pid":39933,"level":30,"input":["111","222"],"output":"genResult","fn":"delayGeneratorFunc","filename":"/Users/nswbmw/GitHub/co-slowlog/examples/stdout.js","msg":"1005ms","time":"2015-09-25T04:24:54.738Z","v":0}
{"name":"example","slow":500,"hostname":"nswbmw.local","pid":39933,"level":30,"input":["333","444"],"output":"promiseResult","fn":"delayPromiseFunc","filename":"/Users/nswbmw/GitHub/co-slowlog/examples/stdout.js","msg":"1006ms","time":"2015-09-25T04:24:55.747Z","v":0}
```

see [examples](./examples).

### License

MIT