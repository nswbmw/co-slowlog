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
