define([], function() {
  "use strict";
  var EventEmitter = (function() {
    function EventEmitter() {}
    var proto = EventEmitter.prototype,
        nativeIndexOf = Array.prototype.indexOf ? true : false;
    function indexOfListener(listener, listeners) {
      if (nativeIndexOf) {
        return listeners.indexOf(listener);
      }
      var i = listeners.length;
      while (i--) {
        if (listeners[i] === listener) {
          return i;
        }
      }
      return -1;
    }
    proto.getListeners = function(evt) {
      var events = this._events || (this._events = {});
      return events[evt] || (events[evt] = []);
    };
    proto.addListener = function(evt, listener) {
      var listeners = this.getListeners(evt);
      if (indexOfListener(listener, listeners) === -1) {
        listeners.push(listener);
      }
      return this;
    };
    proto.on = proto.addListener;
    proto.removeListener = function(evt, listener) {
      var listeners = this.getListeners(evt),
          index = indexOfListener(listener, listeners);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this._events[evt] = null;
        }
      }
      return this;
    };
    proto.off = proto.removeListener;
    proto.addListeners = function(evt, listeners) {
      return this.manipulateListeners(false, evt, listeners);
    };
    proto.removeListeners = function(evt, listeners) {
      return this.manipulateListeners(true, evt, listeners);
    };
    proto.manipulateListeners = function(remove, evt, listeners) {
      var i,
          value,
          single = remove ? this.removeListener : this.addListener,
          multiple = remove ? this.removeListeners : this.addListeners;
      if (typeof evt === 'object') {
        for (i in evt) {
          if (evt.hasOwnProperty(i) && (value = evt[i])) {
            if (typeof value === 'function') {
              single.call(this, i, value);
            } else {
              multiple.call(this, i, value);
            }
          }
        }
      } else {
        i = listeners.length;
        while (i--) {
          single.call(this, evt, listeners[i]);
        }
      }
      return this;
    };
    proto.removeEvent = function(evt) {
      if (evt) {
        this._events[evt] = null;
      } else {
        this._events = null;
      }
      return this;
    };
    proto.emitEvent = function(evt, args) {
      var listeners = this.getListeners(evt),
          i = listeners.length,
          response;
      while (i--) {
        response = args ? listeners[i].apply(null, args) : listeners[i]();
        if (response === true) {
          this.removeListener(evt, listeners[i]);
        }
      }
      return this;
    };
    proto.trigger = proto.emitEvent;
    proto.emit = proto.emitEvent;
    return EventEmitter;
  })();
  ;
  var async = (function() {
    var async = {};
    var root,
        previous_async;
    root = this;
    if (root != null) {
      previous_async = root.async;
    }
    async.noConflict = function() {
      root.async = previous_async;
      return async;
    };
    function only_once(fn) {
      var called = false;
      return function() {
        if (called)
          throw new Error("Callback was already called.");
        called = true;
        fn.apply(root, arguments);
      };
    }
    var _toString = Object.prototype.toString;
    var _isArray = Array.isArray || function(obj) {
      return _toString.call(obj) === '[object Array]';
    };
    var _each = function(arr, iterator) {
      if (arr.forEach) {
        return arr.forEach(iterator);
      }
      for (var i = 0; i < arr.length; i += 1) {
        iterator(arr[i], i, arr);
      }
    };
    var _map = function(arr, iterator) {
      if (arr.map) {
        return arr.map(iterator);
      }
      var results = [];
      _each(arr, function(x, i, a) {
        results.push(iterator(x, i, a));
      });
      return results;
    };
    var _reduce = function(arr, iterator, memo) {
      if (arr.reduce) {
        return arr.reduce(iterator, memo);
      }
      _each(arr, function(x, i, a) {
        memo = iterator(memo, x, i, a);
      });
      return memo;
    };
    var _keys = function(obj) {
      if (Object.keys) {
        return Object.keys(obj);
      }
      var keys = [];
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          keys.push(k);
        }
      }
      return keys;
    };
    if (typeof process === 'undefined' || !(process.nextTick)) {
      if (typeof setImmediate === 'function') {
        async.nextTick = function(fn) {
          setImmediate(fn);
        };
        async.setImmediate = async.nextTick;
      } else {
        async.nextTick = function(fn) {
          setTimeout(fn, 0);
        };
        async.setImmediate = async.nextTick;
      }
    } else {
      async.nextTick = process.nextTick;
      if (typeof setImmediate !== 'undefined') {
        async.setImmediate = function(fn) {
          setImmediate(fn);
        };
      } else {
        async.setImmediate = async.nextTick;
      }
    }
    async.each = function(arr, iterator, callback) {
      callback = callback || function() {};
      if (!arr.length) {
        return callback();
      }
      var completed = 0;
      _each(arr, function(x) {
        iterator(x, only_once(done));
      });
      function done(err) {
        if (err) {
          callback(err);
          callback = function() {};
        } else {
          completed += 1;
          if (completed >= arr.length) {
            callback();
          }
        }
      }
    };
    async.forEach = async.each;
    async.eachSeries = function(arr, iterator, callback) {
      callback = callback || function() {};
      if (!arr.length) {
        return callback();
      }
      var completed = 0;
      var iterate = function() {
        iterator(arr[completed], function(err) {
          if (err) {
            callback(err);
            callback = function() {};
          } else {
            completed += 1;
            if (completed >= arr.length) {
              callback();
            } else {
              iterate();
            }
          }
        });
      };
      iterate();
    };
    async.forEachSeries = async.eachSeries;
    async.eachLimit = function(arr, limit, iterator, callback) {
      var fn = _eachLimit(limit);
      fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;
    var _eachLimit = function(limit) {
      return function(arr, iterator, callback) {
        callback = callback || function() {};
        if (!arr.length || limit <= 0) {
          return callback();
        }
        var completed = 0;
        var started = 0;
        var running = 0;
        (function replenish() {
          if (completed >= arr.length) {
            return callback();
          }
          while (running < limit && started < arr.length) {
            started += 1;
            running += 1;
            iterator(arr[started - 1], function(err) {
              if (err) {
                callback(err);
                callback = function() {};
              } else {
                completed += 1;
                running -= 1;
                if (completed >= arr.length) {
                  callback();
                } else {
                  replenish();
                }
              }
            });
          }
        })();
      };
    };
    var doParallel = function(fn) {
      return function() {
        var args = Array.prototype.slice.call(arguments);
        return fn.apply(null, [async.each].concat(args));
      };
    };
    var doParallelLimit = function(limit, fn) {
      return function() {
        var args = Array.prototype.slice.call(arguments);
        return fn.apply(null, [_eachLimit(limit)].concat(args));
      };
    };
    var doSeries = function(fn) {
      return function() {
        var args = Array.prototype.slice.call(arguments);
        return fn.apply(null, [async.eachSeries].concat(args));
      };
    };
    var _asyncMap = function(eachfn, arr, iterator, callback) {
      arr = _map(arr, function(x, i) {
        return {
          index: i,
          value: x
        };
      });
      if (!callback) {
        eachfn(arr, function(x, callback) {
          iterator(x.value, function(err) {
            callback(err);
          });
        });
      } else {
        var results = [];
        eachfn(arr, function(x, callback) {
          iterator(x.value, function(err, v) {
            results[x.index] = v;
            callback(err);
          });
        }, function(err) {
          callback(err, results);
        });
      }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function(arr, limit, iterator, callback) {
      return _mapLimit(limit)(arr, iterator, callback);
    };
    var _mapLimit = function(limit) {
      return doParallelLimit(limit, _asyncMap);
    };
    async.reduce = function(arr, memo, iterator, callback) {
      async.eachSeries(arr, function(x, callback) {
        iterator(memo, x, function(err, v) {
          memo = v;
          callback(err);
        });
      }, function(err) {
        callback(err, memo);
      });
    };
    async.inject = async.reduce;
    async.foldl = async.reduce;
    async.reduceRight = function(arr, memo, iterator, callback) {
      var reversed = _map(arr, function(x) {
        return x;
      }).reverse();
      async.reduce(reversed, memo, iterator, callback);
    };
    async.foldr = async.reduceRight;
    var _filter = function(eachfn, arr, iterator, callback) {
      var results = [];
      arr = _map(arr, function(x, i) {
        return {
          index: i,
          value: x
        };
      });
      eachfn(arr, function(x, callback) {
        iterator(x.value, function(v) {
          if (v) {
            results.push(x);
          }
          callback();
        });
      }, function(err) {
        callback(_map(results.sort(function(a, b) {
          return a.index - b.index;
        }), function(x) {
          return x.value;
        }));
      });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    async.select = async.filter;
    async.selectSeries = async.filterSeries;
    var _reject = function(eachfn, arr, iterator, callback) {
      var results = [];
      arr = _map(arr, function(x, i) {
        return {
          index: i,
          value: x
        };
      });
      eachfn(arr, function(x, callback) {
        iterator(x.value, function(v) {
          if (!v) {
            results.push(x);
          }
          callback();
        });
      }, function(err) {
        callback(_map(results.sort(function(a, b) {
          return a.index - b.index;
        }), function(x) {
          return x.value;
        }));
      });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);
    var _detect = function(eachfn, arr, iterator, main_callback) {
      eachfn(arr, function(x, callback) {
        iterator(x, function(result) {
          if (result) {
            main_callback(x);
            main_callback = function() {};
          } else {
            callback();
          }
        });
      }, function(err) {
        main_callback();
      });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);
    async.some = function(arr, iterator, main_callback) {
      async.each(arr, function(x, callback) {
        iterator(x, function(v) {
          if (v) {
            main_callback(true);
            main_callback = function() {};
          }
          callback();
        });
      }, function(err) {
        main_callback(false);
      });
    };
    async.any = async.some;
    async.every = function(arr, iterator, main_callback) {
      async.each(arr, function(x, callback) {
        iterator(x, function(v) {
          if (!v) {
            main_callback(false);
            main_callback = function() {};
          }
          callback();
        });
      }, function(err) {
        main_callback(true);
      });
    };
    async.all = async.every;
    async.sortBy = function(arr, iterator, callback) {
      async.map(arr, function(x, callback) {
        iterator(x, function(err, criteria) {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              value: x,
              criteria: criteria
            });
          }
        });
      }, function(err, results) {
        if (err) {
          return callback(err);
        } else {
          var fn = function(left, right) {
            var a = left.criteria,
                b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
          };
          callback(null, _map(results.sort(fn), function(x) {
            return x.value;
          }));
        }
      });
    };
    async.auto = function(tasks, callback) {
      callback = callback || function() {};
      var keys = _keys(tasks);
      var remainingTasks = keys.length;
      if (!remainingTasks) {
        return callback();
      }
      var results = {};
      var listeners = [];
      var addListener = function(fn) {
        listeners.unshift(fn);
      };
      var removeListener = function(fn) {
        for (var i = 0; i < listeners.length; i += 1) {
          if (listeners[i] === fn) {
            listeners.splice(i, 1);
            return;
          }
        }
      };
      var taskComplete = function() {
        remainingTasks--;
        _each(listeners.slice(0), function(fn) {
          fn();
        });
      };
      addListener(function() {
        if (!remainingTasks) {
          var theCallback = callback;
          callback = function() {};
          theCallback(null, results);
        }
      });
      _each(keys, function(k) {
        var task = _isArray(tasks[k]) ? tasks[k] : [tasks[k]];
        var taskCallback = function(err) {
          var args = Array.prototype.slice.call(arguments, 1);
          if (args.length <= 1) {
            args = args[0];
          }
          if (err) {
            var safeResults = {};
            _each(_keys(results), function(rkey) {
              safeResults[rkey] = results[rkey];
            });
            safeResults[k] = args;
            callback(err, safeResults);
            callback = function() {};
          } else {
            results[k] = args;
            async.setImmediate(taskComplete);
          }
        };
        var requires = task.slice(0, Math.abs(task.length - 1)) || [];
        var ready = function() {
          return _reduce(requires, function(a, x) {
            return (a && results.hasOwnProperty(x));
          }, true) && !results.hasOwnProperty(k);
        };
        if (ready()) {
          task[task.length - 1](taskCallback, results);
        } else {
          var listener = function() {
            if (ready()) {
              removeListener(listener);
              task[task.length - 1](taskCallback, results);
            }
          };
          addListener(listener);
        }
      });
    };
    async.retry = function(times, task, callback) {
      var DEFAULT_TIMES = 5;
      var attempts = [];
      if (typeof times === 'function') {
        callback = task;
        task = times;
        times = DEFAULT_TIMES;
      }
      times = parseInt(times, 10) || DEFAULT_TIMES;
      var wrappedTask = function(wrappedCallback, wrappedResults) {
        var retryAttempt = function(task, finalAttempt) {
          return function(seriesCallback) {
            task(function(err, result) {
              seriesCallback(!err || finalAttempt, {
                err: err,
                result: result
              });
            }, wrappedResults);
          };
        };
        while (times) {
          attempts.push(retryAttempt(task, !(times -= 1)));
        }
        async.series(attempts, function(done, data) {
          data = data[data.length - 1];
          (wrappedCallback || callback)(data.err, data.result);
        });
      };
      return callback ? wrappedTask() : wrappedTask;
    };
    async.waterfall = function(tasks, callback) {
      callback = callback || function() {};
      if (!_isArray(tasks)) {
        var err = new Error('First argument to waterfall must be an array of functions');
        return callback(err);
      }
      if (!tasks.length) {
        return callback();
      }
      var wrapIterator = function(iterator) {
        return function(err) {
          if (err) {
            callback.apply(null, arguments);
            callback = function() {};
          } else {
            var args = Array.prototype.slice.call(arguments, 1);
            var next = iterator.next();
            if (next) {
              args.push(wrapIterator(next));
            } else {
              args.push(callback);
            }
            async.setImmediate(function() {
              iterator.apply(null, args);
            });
          }
        };
      };
      wrapIterator(async.iterator(tasks))();
    };
    var _parallel = function(eachfn, tasks, callback) {
      callback = callback || function() {};
      if (_isArray(tasks)) {
        eachfn.map(tasks, function(fn, callback) {
          if (fn) {
            fn(function(err) {
              var args = Array.prototype.slice.call(arguments, 1);
              if (args.length <= 1) {
                args = args[0];
              }
              callback.call(null, err, args);
            });
          }
        }, callback);
      } else {
        var results = {};
        eachfn.each(_keys(tasks), function(k, callback) {
          tasks[k](function(err) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (args.length <= 1) {
              args = args[0];
            }
            results[k] = args;
            callback(err);
          });
        }, function(err) {
          callback(err, results);
        });
      }
    };
    async.parallel = function(tasks, callback) {
      _parallel({
        map: async.map,
        each: async.each
      }, tasks, callback);
    };
    async.parallelLimit = function(tasks, limit, callback) {
      _parallel({
        map: _mapLimit(limit),
        each: _eachLimit(limit)
      }, tasks, callback);
    };
    async.series = function(tasks, callback) {
      callback = callback || function() {};
      if (_isArray(tasks)) {
        async.mapSeries(tasks, function(fn, callback) {
          if (fn) {
            fn(function(err) {
              var args = Array.prototype.slice.call(arguments, 1);
              if (args.length <= 1) {
                args = args[0];
              }
              callback.call(null, err, args);
            });
          }
        }, callback);
      } else {
        var results = {};
        async.eachSeries(_keys(tasks), function(k, callback) {
          tasks[k](function(err) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (args.length <= 1) {
              args = args[0];
            }
            results[k] = args;
            callback(err);
          });
        }, function(err) {
          callback(err, results);
        });
      }
    };
    async.iterator = function(tasks) {
      var makeCallback = function(index) {
        var fn = function() {
          if (tasks.length) {
            tasks[index].apply(null, arguments);
          }
          return fn.next();
        };
        fn.next = function() {
          return (index < tasks.length - 1) ? makeCallback(index + 1) : null;
        };
        return fn;
      };
      return makeCallback(0);
    };
    async.apply = function(fn) {
      var args = Array.prototype.slice.call(arguments, 1);
      return function() {
        return fn.apply(null, args.concat(Array.prototype.slice.call(arguments)));
      };
    };
    var _concat = function(eachfn, arr, fn, callback) {
      var r = [];
      eachfn(arr, function(x, cb) {
        fn(x, function(err, y) {
          r = r.concat(y || []);
          cb(err);
        });
      }, function(err) {
        callback(err, r);
      });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);
    async.whilst = function(test, iterator, callback) {
      if (test()) {
        iterator(function(err) {
          if (err) {
            return callback(err);
          }
          async.whilst(test, iterator, callback);
        });
      } else {
        callback();
      }
    };
    async.doWhilst = function(iterator, test, callback) {
      iterator(function(err) {
        if (err) {
          return callback(err);
        }
        var args = Array.prototype.slice.call(arguments, 1);
        if (test.apply(null, args)) {
          async.doWhilst(iterator, test, callback);
        } else {
          callback();
        }
      });
    };
    async.until = function(test, iterator, callback) {
      if (!test()) {
        iterator(function(err) {
          if (err) {
            return callback(err);
          }
          async.until(test, iterator, callback);
        });
      } else {
        callback();
      }
    };
    async.doUntil = function(iterator, test, callback) {
      iterator(function(err) {
        if (err) {
          return callback(err);
        }
        var args = Array.prototype.slice.call(arguments, 1);
        if (!test.apply(null, args)) {
          async.doUntil(iterator, test, callback);
        } else {
          callback();
        }
      });
    };
    async.queue = function(worker, concurrency) {
      if (concurrency === undefined) {
        concurrency = 1;
      }
      function _insert(q, data, pos, callback) {
        if (!q.started) {
          q.started = true;
        }
        if (!_isArray(data)) {
          data = [data];
        }
        if (data.length == 0) {
          return async.setImmediate(function() {
            if (q.drain) {
              q.drain();
            }
          });
        }
        _each(data, function(task) {
          var item = {
            data: task,
            callback: typeof callback === 'function' ? callback : null
          };
          if (pos) {
            q.tasks.unshift(item);
          } else {
            q.tasks.push(item);
          }
          if (q.saturated && q.tasks.length === q.concurrency) {
            q.saturated();
          }
          async.setImmediate(q.process);
        });
      }
      var workers = 0;
      var q = {
        tasks: [],
        concurrency: concurrency,
        saturated: null,
        empty: null,
        drain: null,
        started: false,
        paused: false,
        push: function(data, callback) {
          _insert(q, data, false, callback);
        },
        kill: function() {
          q.drain = null;
          q.tasks = [];
        },
        unshift: function(data, callback) {
          _insert(q, data, true, callback);
        },
        process: function() {
          if (!q.paused && workers < q.concurrency && q.tasks.length) {
            var task = q.tasks.shift();
            if (q.empty && q.tasks.length === 0) {
              q.empty();
            }
            workers += 1;
            var next = function() {
              workers -= 1;
              if (task.callback) {
                task.callback.apply(task, arguments);
              }
              if (q.drain && q.tasks.length + workers === 0) {
                q.drain();
              }
              q.process();
            };
            var cb = only_once(next);
            worker(task.data, cb);
          }
        },
        length: function() {
          return q.tasks.length;
        },
        running: function() {
          return workers;
        },
        idle: function() {
          return q.tasks.length + workers === 0;
        },
        pause: function() {
          if (q.paused === true) {
            return;
          }
          q.paused = true;
        },
        resume: function() {
          if (q.paused === false) {
            return;
          }
          q.paused = false;
          for (var w = 1; w <= q.concurrency; w++) {
            async.setImmediate(q.process);
          }
        }
      };
      return q;
    };
    async.priorityQueue = function(worker, concurrency) {
      function _compareTasks(a, b) {
        return a.priority - b.priority;
      }
      ;
      function _binarySearch(sequence, item, compare) {
        var beg = -1,
            end = sequence.length - 1;
        while (beg < end) {
          var mid = beg + ((end - beg + 1) >>> 1);
          if (compare(item, sequence[mid]) >= 0) {
            beg = mid;
          } else {
            end = mid - 1;
          }
        }
        return beg;
      }
      function _insert(q, data, priority, callback) {
        if (!q.started) {
          q.started = true;
        }
        if (!_isArray(data)) {
          data = [data];
        }
        if (data.length == 0) {
          return async.setImmediate(function() {
            if (q.drain) {
              q.drain();
            }
          });
        }
        _each(data, function(task) {
          var item = {
            data: task,
            priority: priority,
            callback: typeof callback === 'function' ? callback : null
          };
          q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);
          if (q.saturated && q.tasks.length === q.concurrency) {
            q.saturated();
          }
          async.setImmediate(q.process);
        });
      }
      var q = async.queue(worker, concurrency);
      q.push = function(data, priority, callback) {
        _insert(q, data, priority, callback);
      };
      delete q.unshift;
      return q;
    };
    async.cargo = function(worker, payload) {
      var working = false,
          tasks = [];
      var cargo = {
        tasks: tasks,
        payload: payload,
        saturated: null,
        empty: null,
        drain: null,
        drained: true,
        push: function(data, callback) {
          if (!_isArray(data)) {
            data = [data];
          }
          _each(data, function(task) {
            tasks.push({
              data: task,
              callback: typeof callback === 'function' ? callback : null
            });
            cargo.drained = false;
            if (cargo.saturated && tasks.length === payload) {
              cargo.saturated();
            }
          });
          async.setImmediate(cargo.process);
        },
        process: function process() {
          if (working)
            return;
          if (tasks.length === 0) {
            if (cargo.drain && !cargo.drained)
              cargo.drain();
            cargo.drained = true;
            return;
          }
          var ts = typeof payload === 'number' ? tasks.splice(0, payload) : tasks.splice(0, tasks.length);
          var ds = _map(ts, function(task) {
            return task.data;
          });
          if (cargo.empty)
            cargo.empty();
          working = true;
          worker(ds, function() {
            working = false;
            var args = arguments;
            _each(ts, function(data) {
              if (data.callback) {
                data.callback.apply(null, args);
              }
            });
            process();
          });
        },
        length: function() {
          return tasks.length;
        },
        running: function() {
          return working;
        }
      };
      return cargo;
    };
    var _console_fn = function(name) {
      return function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        fn.apply(null, args.concat([function(err) {
          var args = Array.prototype.slice.call(arguments, 1);
          if (typeof console !== 'undefined') {
            if (err) {
              if (console.error) {
                console.error(err);
              }
            } else if (console[name]) {
              _each(args, function(x) {
                console[name](x);
              });
            }
          }
        }]));
      };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    async.memoize = function(fn, hasher) {
      var memo = {};
      var queues = {};
      hasher = hasher || function(x) {
        return x;
      };
      var memoized = function() {
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        var key = hasher.apply(null, args);
        if (key in memo) {
          async.nextTick(function() {
            callback.apply(null, memo[key]);
          });
        } else if (key in queues) {
          queues[key].push(callback);
        } else {
          queues[key] = [callback];
          fn.apply(null, args.concat([function() {
            memo[key] = arguments;
            var q = queues[key];
            delete queues[key];
            for (var i = 0,
                l = q.length; i < l; i++) {
              q[i].apply(null, arguments);
            }
          }]));
        }
      };
      memoized.memo = memo;
      memoized.unmemoized = fn;
      return memoized;
    };
    async.unmemoize = function(fn) {
      return function() {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };
    async.times = function(count, iterator, callback) {
      var counter = [];
      for (var i = 0; i < count; i++) {
        counter.push(i);
      }
      return async.map(counter, iterator, callback);
    };
    async.timesSeries = function(count, iterator, callback) {
      var counter = [];
      for (var i = 0; i < count; i++) {
        counter.push(i);
      }
      return async.mapSeries(counter, iterator, callback);
    };
    async.seq = function() {
      var fns = arguments;
      return function() {
        var that = this;
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        async.reduce(fns, args, function(newargs, fn, cb) {
          fn.apply(that, newargs.concat([function() {
            var err = arguments[0];
            var nextargs = Array.prototype.slice.call(arguments, 1);
            cb(err, nextargs);
          }]));
        }, function(err, results) {
          callback.apply(that, [err].concat(results));
        });
      };
    };
    async.compose = function() {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };
    var _applyEach = function(eachfn, fns) {
      var go = function() {
        var that = this;
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        return eachfn(fns, function(fn, cb) {
          fn.apply(that, args.concat([cb]));
        }, callback);
      };
      if (arguments.length > 2) {
        var args = Array.prototype.slice.call(arguments, 2);
        return go.apply(this, args);
      } else {
        return go;
      }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);
    async.forever = function(fn, callback) {
      function next(err) {
        if (err) {
          if (callback) {
            return callback(err);
          }
          throw err;
        }
        fn(next);
      }
      next();
    };
    return async;
  }());
  ;
  var tv4 = (function() {
    if (!Object.keys) {
      Object.keys = (function() {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
            dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
            dontEnumsLength = dontEnums.length;
        return function(obj) {
          if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) {
            throw new TypeError('Object.keys called on non-object');
          }
          var result = [];
          for (var prop in obj) {
            if (hasOwnProperty.call(obj, prop)) {
              result.push(prop);
            }
          }
          if (hasDontEnumBug) {
            for (var i = 0; i < dontEnumsLength; i++) {
              if (hasOwnProperty.call(obj, dontEnums[i])) {
                result.push(dontEnums[i]);
              }
            }
          }
          return result;
        };
      })();
    }
    if (!Object.create) {
      Object.create = (function() {
        function F() {}
        return function(o) {
          if (arguments.length !== 1) {
            throw new Error('Object.create implementation only accepts one parameter.');
          }
          F.prototype = o;
          return new F();
        };
      })();
    }
    if (!Array.isArray) {
      Array.isArray = function(vArg) {
        return Object.prototype.toString.call(vArg) === "[object Array]";
      };
    }
    if (!Array.prototype.indexOf) {
      Array.prototype.indexOf = function(searchElement) {
        if (this === null) {
          throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
          return -1;
        }
        var n = 0;
        if (arguments.length > 1) {
          n = Number(arguments[1]);
          if (n !== n) {
            n = 0;
          } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
            n = (n > 0 || -1) * Math.floor(Math.abs(n));
          }
        }
        if (n >= len) {
          return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
          if (k in t && t[k] === searchElement) {
            return k;
          }
        }
        return -1;
      };
    }
    if (!Object.isFrozen) {
      Object.isFrozen = function(obj) {
        var key = "tv4_test_frozen_key";
        while (obj.hasOwnProperty(key)) {
          key += Math.random();
        }
        try {
          obj[key] = true;
          delete obj[key];
          return false;
        } catch (e) {
          return true;
        }
      };
    }
    var ValidatorContext = function ValidatorContext(parent, collectMultiple, errorMessages, checkRecursive, trackUnknownProperties) {
      this.missing = [];
      this.missingMap = {};
      this.formatValidators = parent ? Object.create(parent.formatValidators) : {};
      this.schemas = parent ? Object.create(parent.schemas) : {};
      this.collectMultiple = collectMultiple;
      this.errors = [];
      this.handleError = collectMultiple ? this.collectError : this.returnError;
      if (checkRecursive) {
        this.checkRecursive = true;
        this.scanned = [];
        this.scannedFrozen = [];
        this.scannedFrozenSchemas = [];
        this.scannedFrozenValidationErrors = [];
        this.validatedSchemasKey = 'tv4_validation_id';
        this.validationErrorsKey = 'tv4_validation_errors_id';
      }
      if (trackUnknownProperties) {
        this.trackUnknownProperties = true;
        this.knownPropertyPaths = {};
        this.unknownPropertyPaths = {};
      }
      this.errorMessages = errorMessages;
      this.definedKeywords = {};
      if (parent) {
        for (var key in parent.definedKeywords) {
          this.definedKeywords[key] = parent.definedKeywords[key].slice(0);
        }
      }
    };
    ValidatorContext.prototype.defineKeyword = function(keyword, keywordFunction) {
      this.definedKeywords[keyword] = this.definedKeywords[keyword] || [];
      this.definedKeywords[keyword].push(keywordFunction);
    };
    ValidatorContext.prototype.createError = function(code, messageParams, dataPath, schemaPath, subErrors) {
      var messageTemplate = this.errorMessages[code] || ErrorMessagesDefault[code];
      if (typeof messageTemplate !== 'string') {
        return new ValidationError(code, "Unknown error code " + code + ": " + JSON.stringify(messageParams), dataPath, schemaPath, subErrors);
      }
      var message = messageTemplate.replace(/\{([^{}]*)\}/g, function(whole, varName) {
        var subValue = messageParams[varName];
        return typeof subValue === 'string' || typeof subValue === 'number' ? subValue : whole;
      });
      return new ValidationError(code, message, dataPath, schemaPath, subErrors);
    };
    ValidatorContext.prototype.returnError = function(error) {
      return error;
    };
    ValidatorContext.prototype.collectError = function(error) {
      if (error) {
        this.errors.push(error);
      }
      return null;
    };
    ValidatorContext.prototype.prefixErrors = function(startIndex, dataPath, schemaPath) {
      for (var i = startIndex; i < this.errors.length; i++) {
        this.errors[i] = this.errors[i].prefixWith(dataPath, schemaPath);
      }
      return this;
    };
    ValidatorContext.prototype.banUnknownProperties = function() {
      for (var unknownPath in this.unknownPropertyPaths) {
        var error = this.createError(ErrorCodes.UNKNOWN_PROPERTY, {path: unknownPath}, unknownPath, "");
        var result = this.handleError(error);
        if (result) {
          return result;
        }
      }
      return null;
    };
    ValidatorContext.prototype.addFormat = function(format, validator) {
      if (typeof format === 'object') {
        for (var key in format) {
          this.addFormat(key, format[key]);
        }
        return this;
      }
      this.formatValidators[format] = validator;
    };
    ValidatorContext.prototype.resolveRefs = function(schema, urlHistory) {
      if (schema['$ref'] !== undefined) {
        urlHistory = urlHistory || {};
        if (urlHistory[schema['$ref']]) {
          return this.createError(ErrorCodes.CIRCULAR_REFERENCE, {urls: Object.keys(urlHistory).join(', ')}, '', '');
        }
        urlHistory[schema['$ref']] = true;
        schema = this.getSchema(schema['$ref'], urlHistory);
      }
      return schema;
    };
    ValidatorContext.prototype.getSchema = function(url, urlHistory) {
      var schema;
      if (this.schemas[url] !== undefined) {
        schema = this.schemas[url];
        return this.resolveRefs(schema, urlHistory);
      }
      var baseUrl = url;
      var fragment = "";
      if (url.indexOf('#') !== -1) {
        fragment = url.substring(url.indexOf("#") + 1);
        baseUrl = url.substring(0, url.indexOf("#"));
      }
      if (typeof this.schemas[baseUrl] === 'object') {
        schema = this.schemas[baseUrl];
        var pointerPath = decodeURIComponent(fragment);
        if (pointerPath === "") {
          return this.resolveRefs(schema, urlHistory);
        } else if (pointerPath.charAt(0) !== "/") {
          return undefined;
        }
        var parts = pointerPath.split("/").slice(1);
        for (var i = 0; i < parts.length; i++) {
          var component = parts[i].replace(/~1/g, "/").replace(/~0/g, "~");
          if (schema[component] === undefined) {
            schema = undefined;
            break;
          }
          schema = schema[component];
        }
        if (schema !== undefined) {
          return this.resolveRefs(schema, urlHistory);
        }
      }
      if (this.missing[baseUrl] === undefined) {
        this.missing.push(baseUrl);
        this.missing[baseUrl] = baseUrl;
        this.missingMap[baseUrl] = baseUrl;
      }
    };
    ValidatorContext.prototype.searchSchemas = function(schema, url) {
      if (schema && typeof schema === "object") {
        if (typeof schema.id === "string") {
          if (isTrustedUrl(url, schema.id)) {
            if (this.schemas[schema.id] === undefined) {
              this.schemas[schema.id] = schema;
            }
          }
        }
        for (var key in schema) {
          if (key !== "enum") {
            if (typeof schema[key] === "object") {
              this.searchSchemas(schema[key], url);
            } else if (key === "$ref") {
              var uri = getDocumentUri(schema[key]);
              if (uri && this.schemas[uri] === undefined && this.missingMap[uri] === undefined) {
                this.missingMap[uri] = uri;
              }
            }
          }
        }
      }
    };
    ValidatorContext.prototype.addSchema = function(url, schema) {
      if (typeof url !== 'string' || typeof schema === 'undefined') {
        if (typeof url === 'object' && typeof url.id === 'string') {
          schema = url;
          url = schema.id;
        } else {
          return;
        }
      }
      if (url === getDocumentUri(url) + "#") {
        url = getDocumentUri(url);
      }
      this.schemas[url] = schema;
      delete this.missingMap[url];
      normSchema(schema, url);
      this.searchSchemas(schema, url);
    };
    ValidatorContext.prototype.getSchemaMap = function() {
      var map = {};
      for (var key in this.schemas) {
        map[key] = this.schemas[key];
      }
      return map;
    };
    ValidatorContext.prototype.getSchemaUris = function(filterRegExp) {
      var list = [];
      for (var key in this.schemas) {
        if (!filterRegExp || filterRegExp.test(key)) {
          list.push(key);
        }
      }
      return list;
    };
    ValidatorContext.prototype.getMissingUris = function(filterRegExp) {
      var list = [];
      for (var key in this.missingMap) {
        if (!filterRegExp || filterRegExp.test(key)) {
          list.push(key);
        }
      }
      return list;
    };
    ValidatorContext.prototype.dropSchemas = function() {
      this.schemas = {};
      this.reset();
    };
    ValidatorContext.prototype.reset = function() {
      this.missing = [];
      this.missingMap = {};
      this.errors = [];
    };
    ValidatorContext.prototype.validateAll = function(data, schema, dataPathParts, schemaPathParts, dataPointerPath) {
      var topLevel;
      schema = this.resolveRefs(schema);
      if (!schema) {
        return null;
      } else if (schema instanceof ValidationError) {
        this.errors.push(schema);
        return schema;
      }
      var startErrorCount = this.errors.length;
      var frozenIndex,
          scannedFrozenSchemaIndex = null,
          scannedSchemasIndex = null;
      if (this.checkRecursive && data && typeof data === 'object') {
        topLevel = !this.scanned.length;
        if (data[this.validatedSchemasKey]) {
          var schemaIndex = data[this.validatedSchemasKey].indexOf(schema);
          if (schemaIndex !== -1) {
            this.errors = this.errors.concat(data[this.validationErrorsKey][schemaIndex]);
            return null;
          }
        }
        if (Object.isFrozen(data)) {
          frozenIndex = this.scannedFrozen.indexOf(data);
          if (frozenIndex !== -1) {
            var frozenSchemaIndex = this.scannedFrozenSchemas[frozenIndex].indexOf(schema);
            if (frozenSchemaIndex !== -1) {
              this.errors = this.errors.concat(this.scannedFrozenValidationErrors[frozenIndex][frozenSchemaIndex]);
              return null;
            }
          }
        }
        this.scanned.push(data);
        if (Object.isFrozen(data)) {
          if (frozenIndex === -1) {
            frozenIndex = this.scannedFrozen.length;
            this.scannedFrozen.push(data);
            this.scannedFrozenSchemas.push([]);
          }
          scannedFrozenSchemaIndex = this.scannedFrozenSchemas[frozenIndex].length;
          this.scannedFrozenSchemas[frozenIndex][scannedFrozenSchemaIndex] = schema;
          this.scannedFrozenValidationErrors[frozenIndex][scannedFrozenSchemaIndex] = [];
        } else {
          if (!data[this.validatedSchemasKey]) {
            try {
              Object.defineProperty(data, this.validatedSchemasKey, {
                value: [],
                configurable: true
              });
              Object.defineProperty(data, this.validationErrorsKey, {
                value: [],
                configurable: true
              });
            } catch (e) {
              data[this.validatedSchemasKey] = [];
              data[this.validationErrorsKey] = [];
            }
          }
          scannedSchemasIndex = data[this.validatedSchemasKey].length;
          data[this.validatedSchemasKey][scannedSchemasIndex] = schema;
          data[this.validationErrorsKey][scannedSchemasIndex] = [];
        }
      }
      var errorCount = this.errors.length;
      var error = this.validateBasic(data, schema, dataPointerPath) || this.validateNumeric(data, schema, dataPointerPath) || this.validateString(data, schema, dataPointerPath) || this.validateArray(data, schema, dataPointerPath) || this.validateObject(data, schema, dataPointerPath) || this.validateCombinations(data, schema, dataPointerPath) || this.validateFormat(data, schema, dataPointerPath) || this.validateDefinedKeywords(data, schema, dataPointerPath) || null;
      if (topLevel) {
        while (this.scanned.length) {
          var item = this.scanned.pop();
          delete item[this.validatedSchemasKey];
        }
        this.scannedFrozen = [];
        this.scannedFrozenSchemas = [];
      }
      if (error || errorCount !== this.errors.length) {
        while ((dataPathParts && dataPathParts.length) || (schemaPathParts && schemaPathParts.length)) {
          var dataPart = (dataPathParts && dataPathParts.length) ? "" + dataPathParts.pop() : null;
          var schemaPart = (schemaPathParts && schemaPathParts.length) ? "" + schemaPathParts.pop() : null;
          if (error) {
            error = error.prefixWith(dataPart, schemaPart);
          }
          this.prefixErrors(errorCount, dataPart, schemaPart);
        }
      }
      if (scannedFrozenSchemaIndex !== null) {
        this.scannedFrozenValidationErrors[frozenIndex][scannedFrozenSchemaIndex] = this.errors.slice(startErrorCount);
      } else if (scannedSchemasIndex !== null) {
        data[this.validationErrorsKey][scannedSchemasIndex] = this.errors.slice(startErrorCount);
      }
      return this.handleError(error);
    };
    ValidatorContext.prototype.validateFormat = function(data, schema) {
      if (typeof schema.format !== 'string' || !this.formatValidators[schema.format]) {
        return null;
      }
      var errorMessage = this.formatValidators[schema.format].call(null, data, schema);
      if (typeof errorMessage === 'string' || typeof errorMessage === 'number') {
        return this.createError(ErrorCodes.FORMAT_CUSTOM, {message: errorMessage}).prefixWith(null, "format");
      } else if (errorMessage && typeof errorMessage === 'object') {
        return this.createError(ErrorCodes.FORMAT_CUSTOM, {message: errorMessage.message || "?"}, errorMessage.dataPath || null, errorMessage.schemaPath || "/format");
      }
      return null;
    };
    ValidatorContext.prototype.validateDefinedKeywords = function(data, schema) {
      for (var key in this.definedKeywords) {
        if (typeof schema[key] === 'undefined') {
          continue;
        }
        var validationFunctions = this.definedKeywords[key];
        for (var i = 0; i < validationFunctions.length; i++) {
          var func = validationFunctions[i];
          var result = func(data, schema[key], schema);
          if (typeof result === 'string' || typeof result === 'number') {
            return this.createError(ErrorCodes.KEYWORD_CUSTOM, {
              key: key,
              message: result
            }).prefixWith(null, "format");
          } else if (result && typeof result === 'object') {
            var code = result.code || ErrorCodes.KEYWORD_CUSTOM;
            if (typeof code === 'string') {
              if (!ErrorCodes[code]) {
                throw new Error('Undefined error code (use defineError): ' + code);
              }
              code = ErrorCodes[code];
            }
            var messageParams = (typeof result.message === 'object') ? result.message : {
              key: key,
              message: result.message || "?"
            };
            var schemaPath = result.schemaPath || ("/" + key.replace(/~/g, '~0').replace(/\//g, '~1'));
            return this.createError(code, messageParams, result.dataPath || null, schemaPath);
          }
        }
      }
      return null;
    };
    function recursiveCompare(A, B) {
      if (A === B) {
        return true;
      }
      if (typeof A === "object" && typeof B === "object") {
        if (Array.isArray(A) !== Array.isArray(B)) {
          return false;
        } else if (Array.isArray(A)) {
          if (A.length !== B.length) {
            return false;
          }
          for (var i = 0; i < A.length; i++) {
            if (!recursiveCompare(A[i], B[i])) {
              return false;
            }
          }
        } else {
          var key;
          for (key in A) {
            if (B[key] === undefined && A[key] !== undefined) {
              return false;
            }
          }
          for (key in B) {
            if (A[key] === undefined && B[key] !== undefined) {
              return false;
            }
          }
          for (key in A) {
            if (!recursiveCompare(A[key], B[key])) {
              return false;
            }
          }
        }
        return true;
      }
      return false;
    }
    ValidatorContext.prototype.validateBasic = function validateBasic(data, schema, dataPointerPath) {
      var error;
      if (error = this.validateType(data, schema, dataPointerPath)) {
        return error.prefixWith(null, "type");
      }
      if (error = this.validateEnum(data, schema, dataPointerPath)) {
        return error.prefixWith(null, "type");
      }
      return null;
    };
    ValidatorContext.prototype.validateType = function validateType(data, schema) {
      if (schema.type === undefined) {
        return null;
      }
      var dataType = typeof data;
      if (data === null) {
        dataType = "null";
      } else if (Array.isArray(data)) {
        dataType = "array";
      }
      var allowedTypes = schema.type;
      if (typeof allowedTypes !== "object") {
        allowedTypes = [allowedTypes];
      }
      for (var i = 0; i < allowedTypes.length; i++) {
        var type = allowedTypes[i];
        if (type === dataType || (type === "integer" && dataType === "number" && (data % 1 === 0))) {
          return null;
        }
      }
      return this.createError(ErrorCodes.INVALID_TYPE, {
        type: dataType,
        expected: allowedTypes.join("/")
      });
    };
    ValidatorContext.prototype.validateEnum = function validateEnum(data, schema) {
      if (schema["enum"] === undefined) {
        return null;
      }
      for (var i = 0; i < schema["enum"].length; i++) {
        var enumVal = schema["enum"][i];
        if (recursiveCompare(data, enumVal)) {
          return null;
        }
      }
      return this.createError(ErrorCodes.ENUM_MISMATCH, {value: (typeof JSON !== 'undefined') ? JSON.stringify(data) : data});
    };
    ValidatorContext.prototype.validateNumeric = function validateNumeric(data, schema, dataPointerPath) {
      return this.validateMultipleOf(data, schema, dataPointerPath) || this.validateMinMax(data, schema, dataPointerPath) || null;
    };
    ValidatorContext.prototype.validateMultipleOf = function validateMultipleOf(data, schema) {
      var multipleOf = schema.multipleOf || schema.divisibleBy;
      if (multipleOf === undefined) {
        return null;
      }
      if (typeof data === "number") {
        if (data % multipleOf !== 0) {
          return this.createError(ErrorCodes.NUMBER_MULTIPLE_OF, {
            value: data,
            multipleOf: multipleOf
          });
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateMinMax = function validateMinMax(data, schema) {
      if (typeof data !== "number") {
        return null;
      }
      if (schema.minimum !== undefined) {
        if (data < schema.minimum) {
          return this.createError(ErrorCodes.NUMBER_MINIMUM, {
            value: data,
            minimum: schema.minimum
          }).prefixWith(null, "minimum");
        }
        if (schema.exclusiveMinimum && data === schema.minimum) {
          return this.createError(ErrorCodes.NUMBER_MINIMUM_EXCLUSIVE, {
            value: data,
            minimum: schema.minimum
          }).prefixWith(null, "exclusiveMinimum");
        }
      }
      if (schema.maximum !== undefined) {
        if (data > schema.maximum) {
          return this.createError(ErrorCodes.NUMBER_MAXIMUM, {
            value: data,
            maximum: schema.maximum
          }).prefixWith(null, "maximum");
        }
        if (schema.exclusiveMaximum && data === schema.maximum) {
          return this.createError(ErrorCodes.NUMBER_MAXIMUM_EXCLUSIVE, {
            value: data,
            maximum: schema.maximum
          }).prefixWith(null, "exclusiveMaximum");
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateString = function validateString(data, schema, dataPointerPath) {
      return this.validateStringLength(data, schema, dataPointerPath) || this.validateStringPattern(data, schema, dataPointerPath) || null;
    };
    ValidatorContext.prototype.validateStringLength = function validateStringLength(data, schema) {
      if (typeof data !== "string") {
        return null;
      }
      if (schema.minLength !== undefined) {
        if (data.length < schema.minLength) {
          return this.createError(ErrorCodes.STRING_LENGTH_SHORT, {
            length: data.length,
            minimum: schema.minLength
          }).prefixWith(null, "minLength");
        }
      }
      if (schema.maxLength !== undefined) {
        if (data.length > schema.maxLength) {
          return this.createError(ErrorCodes.STRING_LENGTH_LONG, {
            length: data.length,
            maximum: schema.maxLength
          }).prefixWith(null, "maxLength");
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateStringPattern = function validateStringPattern(data, schema) {
      if (typeof data !== "string" || schema.pattern === undefined) {
        return null;
      }
      var regexp = new RegExp(schema.pattern);
      if (!regexp.test(data)) {
        return this.createError(ErrorCodes.STRING_PATTERN, {pattern: schema.pattern}).prefixWith(null, "pattern");
      }
      return null;
    };
    ValidatorContext.prototype.validateArray = function validateArray(data, schema, dataPointerPath) {
      if (!Array.isArray(data)) {
        return null;
      }
      return this.validateArrayLength(data, schema, dataPointerPath) || this.validateArrayUniqueItems(data, schema, dataPointerPath) || this.validateArrayItems(data, schema, dataPointerPath) || null;
    };
    ValidatorContext.prototype.validateArrayLength = function validateArrayLength(data, schema) {
      var error;
      if (schema.minItems !== undefined) {
        if (data.length < schema.minItems) {
          error = (this.createError(ErrorCodes.ARRAY_LENGTH_SHORT, {
            length: data.length,
            minimum: schema.minItems
          })).prefixWith(null, "minItems");
          if (this.handleError(error)) {
            return error;
          }
        }
      }
      if (schema.maxItems !== undefined) {
        if (data.length > schema.maxItems) {
          error = (this.createError(ErrorCodes.ARRAY_LENGTH_LONG, {
            length: data.length,
            maximum: schema.maxItems
          })).prefixWith(null, "maxItems");
          if (this.handleError(error)) {
            return error;
          }
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateArrayUniqueItems = function validateArrayUniqueItems(data, schema) {
      if (schema.uniqueItems) {
        for (var i = 0; i < data.length; i++) {
          for (var j = i + 1; j < data.length; j++) {
            if (recursiveCompare(data[i], data[j])) {
              var error = (this.createError(ErrorCodes.ARRAY_UNIQUE, {
                match1: i,
                match2: j
              })).prefixWith(null, "uniqueItems");
              if (this.handleError(error)) {
                return error;
              }
            }
          }
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateArrayItems = function validateArrayItems(data, schema, dataPointerPath) {
      if (schema.items === undefined) {
        return null;
      }
      var error,
          i;
      if (Array.isArray(schema.items)) {
        for (i = 0; i < data.length; i++) {
          if (i < schema.items.length) {
            if (error = this.validateAll(data[i], schema.items[i], [i], ["items", i], dataPointerPath + "/" + i)) {
              return error;
            }
          } else if (schema.additionalItems !== undefined) {
            if (typeof schema.additionalItems === "boolean") {
              if (!schema.additionalItems) {
                error = (this.createError(ErrorCodes.ARRAY_ADDITIONAL_ITEMS, {})).prefixWith("" + i, "additionalItems");
                if (this.handleError(error)) {
                  return error;
                }
              }
            } else if (error = this.validateAll(data[i], schema.additionalItems, [i], ["additionalItems"], dataPointerPath + "/" + i)) {
              return error;
            }
          }
        }
      } else {
        for (i = 0; i < data.length; i++) {
          if (error = this.validateAll(data[i], schema.items, [i], ["items"], dataPointerPath + "/" + i)) {
            return error;
          }
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateObject = function validateObject(data, schema, dataPointerPath) {
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        return null;
      }
      return this.validateObjectMinMaxProperties(data, schema, dataPointerPath) || this.validateObjectRequiredProperties(data, schema, dataPointerPath) || this.validateObjectProperties(data, schema, dataPointerPath) || this.validateObjectDependencies(data, schema, dataPointerPath) || null;
    };
    ValidatorContext.prototype.validateObjectMinMaxProperties = function validateObjectMinMaxProperties(data, schema) {
      var keys = Object.keys(data);
      var error;
      if (schema.minProperties !== undefined) {
        if (keys.length < schema.minProperties) {
          error = this.createError(ErrorCodes.OBJECT_PROPERTIES_MINIMUM, {
            propertyCount: keys.length,
            minimum: schema.minProperties
          }).prefixWith(null, "minProperties");
          if (this.handleError(error)) {
            return error;
          }
        }
      }
      if (schema.maxProperties !== undefined) {
        if (keys.length > schema.maxProperties) {
          error = this.createError(ErrorCodes.OBJECT_PROPERTIES_MAXIMUM, {
            propertyCount: keys.length,
            maximum: schema.maxProperties
          }).prefixWith(null, "maxProperties");
          if (this.handleError(error)) {
            return error;
          }
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateObjectRequiredProperties = function validateObjectRequiredProperties(data, schema) {
      if (schema.required !== undefined) {
        for (var i = 0; i < schema.required.length; i++) {
          var key = schema.required[i];
          if (data[key] === undefined) {
            var error = this.createError(ErrorCodes.OBJECT_REQUIRED, {key: key}).prefixWith(null, "" + i).prefixWith(null, "required");
            if (this.handleError(error)) {
              return error;
            }
          }
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateObjectProperties = function validateObjectProperties(data, schema, dataPointerPath) {
      var error;
      for (var key in data) {
        var keyPointerPath = dataPointerPath + "/" + key.replace(/~/g, '~0').replace(/\//g, '~1');
        var foundMatch = false;
        if (schema.properties !== undefined && schema.properties[key] !== undefined) {
          foundMatch = true;
          if (error = this.validateAll(data[key], schema.properties[key], [key], ["properties", key], keyPointerPath)) {
            return error;
          }
        }
        if (schema.patternProperties !== undefined) {
          for (var patternKey in schema.patternProperties) {
            var regexp = new RegExp(patternKey);
            if (regexp.test(key)) {
              foundMatch = true;
              if (error = this.validateAll(data[key], schema.patternProperties[patternKey], [key], ["patternProperties", patternKey], keyPointerPath)) {
                return error;
              }
            }
          }
        }
        if (!foundMatch) {
          if (schema.additionalProperties !== undefined) {
            if (this.trackUnknownProperties) {
              this.knownPropertyPaths[keyPointerPath] = true;
              delete this.unknownPropertyPaths[keyPointerPath];
            }
            if (typeof schema.additionalProperties === "boolean") {
              if (!schema.additionalProperties) {
                error = this.createError(ErrorCodes.OBJECT_ADDITIONAL_PROPERTIES, {}).prefixWith(key, "additionalProperties");
                if (this.handleError(error)) {
                  return error;
                }
              }
            } else {
              if (error = this.validateAll(data[key], schema.additionalProperties, [key], ["additionalProperties"], keyPointerPath)) {
                return error;
              }
            }
          } else if (this.trackUnknownProperties && !this.knownPropertyPaths[keyPointerPath]) {
            this.unknownPropertyPaths[keyPointerPath] = true;
          }
        } else if (this.trackUnknownProperties) {
          this.knownPropertyPaths[keyPointerPath] = true;
          delete this.unknownPropertyPaths[keyPointerPath];
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateObjectDependencies = function validateObjectDependencies(data, schema, dataPointerPath) {
      var error;
      if (schema.dependencies !== undefined) {
        for (var depKey in schema.dependencies) {
          if (data[depKey] !== undefined) {
            var dep = schema.dependencies[depKey];
            if (typeof dep === "string") {
              if (data[dep] === undefined) {
                error = this.createError(ErrorCodes.OBJECT_DEPENDENCY_KEY, {
                  key: depKey,
                  missing: dep
                }).prefixWith(null, depKey).prefixWith(null, "dependencies");
                if (this.handleError(error)) {
                  return error;
                }
              }
            } else if (Array.isArray(dep)) {
              for (var i = 0; i < dep.length; i++) {
                var requiredKey = dep[i];
                if (data[requiredKey] === undefined) {
                  error = this.createError(ErrorCodes.OBJECT_DEPENDENCY_KEY, {
                    key: depKey,
                    missing: requiredKey
                  }).prefixWith(null, "" + i).prefixWith(null, depKey).prefixWith(null, "dependencies");
                  if (this.handleError(error)) {
                    return error;
                  }
                }
              }
            } else {
              if (error = this.validateAll(data, dep, [], ["dependencies", depKey], dataPointerPath)) {
                return error;
              }
            }
          }
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateCombinations = function validateCombinations(data, schema, dataPointerPath) {
      return this.validateAllOf(data, schema, dataPointerPath) || this.validateAnyOf(data, schema, dataPointerPath) || this.validateOneOf(data, schema, dataPointerPath) || this.validateNot(data, schema, dataPointerPath) || null;
    };
    ValidatorContext.prototype.validateAllOf = function validateAllOf(data, schema, dataPointerPath) {
      if (schema.allOf === undefined) {
        return null;
      }
      var error;
      for (var i = 0; i < schema.allOf.length; i++) {
        var subSchema = schema.allOf[i];
        if (error = this.validateAll(data, subSchema, [], ["allOf", i], dataPointerPath)) {
          return error;
        }
      }
      return null;
    };
    ValidatorContext.prototype.validateAnyOf = function validateAnyOf(data, schema, dataPointerPath) {
      if (schema.anyOf === undefined) {
        return null;
      }
      var errors = [];
      var startErrorCount = this.errors.length;
      var oldUnknownPropertyPaths,
          oldKnownPropertyPaths;
      if (this.trackUnknownProperties) {
        oldUnknownPropertyPaths = this.unknownPropertyPaths;
        oldKnownPropertyPaths = this.knownPropertyPaths;
      }
      var errorAtEnd = true;
      for (var i = 0; i < schema.anyOf.length; i++) {
        if (this.trackUnknownProperties) {
          this.unknownPropertyPaths = {};
          this.knownPropertyPaths = {};
        }
        var subSchema = schema.anyOf[i];
        var errorCount = this.errors.length;
        var error = this.validateAll(data, subSchema, [], ["anyOf", i], dataPointerPath);
        if (error === null && errorCount === this.errors.length) {
          this.errors = this.errors.slice(0, startErrorCount);
          if (this.trackUnknownProperties) {
            for (var knownKey in this.knownPropertyPaths) {
              oldKnownPropertyPaths[knownKey] = true;
              delete oldUnknownPropertyPaths[knownKey];
            }
            for (var unknownKey in this.unknownPropertyPaths) {
              if (!oldKnownPropertyPaths[unknownKey]) {
                oldUnknownPropertyPaths[unknownKey] = true;
              }
            }
            errorAtEnd = false;
            continue;
          }
          return null;
        }
        if (error) {
          errors.push(error.prefixWith(null, "" + i).prefixWith(null, "anyOf"));
        }
      }
      if (this.trackUnknownProperties) {
        this.unknownPropertyPaths = oldUnknownPropertyPaths;
        this.knownPropertyPaths = oldKnownPropertyPaths;
      }
      if (errorAtEnd) {
        errors = errors.concat(this.errors.slice(startErrorCount));
        this.errors = this.errors.slice(0, startErrorCount);
        return this.createError(ErrorCodes.ANY_OF_MISSING, {}, "", "/anyOf", errors);
      }
    };
    ValidatorContext.prototype.validateOneOf = function validateOneOf(data, schema, dataPointerPath) {
      if (schema.oneOf === undefined) {
        return null;
      }
      var validIndex = null;
      var errors = [];
      var startErrorCount = this.errors.length;
      var oldUnknownPropertyPaths,
          oldKnownPropertyPaths;
      if (this.trackUnknownProperties) {
        oldUnknownPropertyPaths = this.unknownPropertyPaths;
        oldKnownPropertyPaths = this.knownPropertyPaths;
      }
      for (var i = 0; i < schema.oneOf.length; i++) {
        if (this.trackUnknownProperties) {
          this.unknownPropertyPaths = {};
          this.knownPropertyPaths = {};
        }
        var subSchema = schema.oneOf[i];
        var errorCount = this.errors.length;
        var error = this.validateAll(data, subSchema, [], ["oneOf", i], dataPointerPath);
        if (error === null && errorCount === this.errors.length) {
          if (validIndex === null) {
            validIndex = i;
          } else {
            this.errors = this.errors.slice(0, startErrorCount);
            return this.createError(ErrorCodes.ONE_OF_MULTIPLE, {
              index1: validIndex,
              index2: i
            }, "", "/oneOf");
          }
          if (this.trackUnknownProperties) {
            for (var knownKey in this.knownPropertyPaths) {
              oldKnownPropertyPaths[knownKey] = true;
              delete oldUnknownPropertyPaths[knownKey];
            }
            for (var unknownKey in this.unknownPropertyPaths) {
              if (!oldKnownPropertyPaths[unknownKey]) {
                oldUnknownPropertyPaths[unknownKey] = true;
              }
            }
          }
        } else if (error) {
          errors.push(error.prefixWith(null, "" + i).prefixWith(null, "oneOf"));
        }
      }
      if (this.trackUnknownProperties) {
        this.unknownPropertyPaths = oldUnknownPropertyPaths;
        this.knownPropertyPaths = oldKnownPropertyPaths;
      }
      if (validIndex === null) {
        errors = errors.concat(this.errors.slice(startErrorCount));
        this.errors = this.errors.slice(0, startErrorCount);
        return this.createError(ErrorCodes.ONE_OF_MISSING, {}, "", "/oneOf", errors);
      } else {
        this.errors = this.errors.slice(0, startErrorCount);
      }
      return null;
    };
    ValidatorContext.prototype.validateNot = function validateNot(data, schema, dataPointerPath) {
      if (schema.not === undefined) {
        return null;
      }
      var oldErrorCount = this.errors.length;
      var oldUnknownPropertyPaths,
          oldKnownPropertyPaths;
      if (this.trackUnknownProperties) {
        oldUnknownPropertyPaths = this.unknownPropertyPaths;
        oldKnownPropertyPaths = this.knownPropertyPaths;
        this.unknownPropertyPaths = {};
        this.knownPropertyPaths = {};
      }
      var error = this.validateAll(data, schema.not, null, null, dataPointerPath);
      var notErrors = this.errors.slice(oldErrorCount);
      this.errors = this.errors.slice(0, oldErrorCount);
      if (this.trackUnknownProperties) {
        this.unknownPropertyPaths = oldUnknownPropertyPaths;
        this.knownPropertyPaths = oldKnownPropertyPaths;
      }
      if (error === null && notErrors.length === 0) {
        return this.createError(ErrorCodes.NOT_PASSED, {}, "", "/not");
      }
      return null;
    };
    function parseURI(url) {
      var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
      return (m ? {
        href: m[0] || '',
        protocol: m[1] || '',
        authority: m[2] || '',
        host: m[3] || '',
        hostname: m[4] || '',
        port: m[5] || '',
        pathname: m[6] || '',
        search: m[7] || '',
        hash: m[8] || ''
      } : null);
    }
    function resolveUrl(base, href) {
      function removeDotSegments(input) {
        var output = [];
        input.replace(/^(\.\.?(\/|$))+/, '').replace(/\/(\.(\/|$))+/g, '/').replace(/\/\.\.$/, '/../').replace(/\/?[^\/]*/g, function(p) {
          if (p === '/..') {
            output.pop();
          } else {
            output.push(p);
          }
        });
        return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
      }
      href = parseURI(href || '');
      base = parseURI(base || '');
      return !href || !base ? null : (href.protocol || base.protocol) + (href.protocol || href.authority ? href.authority : base.authority) + removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) + (href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) + href.hash;
    }
    function getDocumentUri(uri) {
      return uri.split('#')[0];
    }
    function normSchema(schema, baseUri) {
      if (schema && typeof schema === "object") {
        if (baseUri === undefined) {
          baseUri = schema.id;
        } else if (typeof schema.id === "string") {
          baseUri = resolveUrl(baseUri, schema.id);
          schema.id = baseUri;
        }
        if (Array.isArray(schema)) {
          for (var i = 0; i < schema.length; i++) {
            normSchema(schema[i], baseUri);
          }
        } else {
          if (typeof schema['$ref'] === "string") {
            schema['$ref'] = resolveUrl(baseUri, schema['$ref']);
          }
          for (var key in schema) {
            if (key !== "enum") {
              normSchema(schema[key], baseUri);
            }
          }
        }
      }
    }
    var ErrorCodes = {
      INVALID_TYPE: 0,
      ENUM_MISMATCH: 1,
      ANY_OF_MISSING: 10,
      ONE_OF_MISSING: 11,
      ONE_OF_MULTIPLE: 12,
      NOT_PASSED: 13,
      NUMBER_MULTIPLE_OF: 100,
      NUMBER_MINIMUM: 101,
      NUMBER_MINIMUM_EXCLUSIVE: 102,
      NUMBER_MAXIMUM: 103,
      NUMBER_MAXIMUM_EXCLUSIVE: 104,
      STRING_LENGTH_SHORT: 200,
      STRING_LENGTH_LONG: 201,
      STRING_PATTERN: 202,
      OBJECT_PROPERTIES_MINIMUM: 300,
      OBJECT_PROPERTIES_MAXIMUM: 301,
      OBJECT_REQUIRED: 302,
      OBJECT_ADDITIONAL_PROPERTIES: 303,
      OBJECT_DEPENDENCY_KEY: 304,
      ARRAY_LENGTH_SHORT: 400,
      ARRAY_LENGTH_LONG: 401,
      ARRAY_UNIQUE: 402,
      ARRAY_ADDITIONAL_ITEMS: 403,
      FORMAT_CUSTOM: 500,
      KEYWORD_CUSTOM: 501,
      CIRCULAR_REFERENCE: 600,
      UNKNOWN_PROPERTY: 1000
    };
    var ErrorCodeLookup = {};
    for (var key in ErrorCodes) {
      ErrorCodeLookup[ErrorCodes[key]] = key;
    }
    var ErrorMessagesDefault = {
      INVALID_TYPE: "invalid type: {type} (expected {expected})",
      ENUM_MISMATCH: "No enum match for: {value}",
      ANY_OF_MISSING: "Data does not match any schemas from \"anyOf\"",
      ONE_OF_MISSING: "Data does not match any schemas from \"oneOf\"",
      ONE_OF_MULTIPLE: "Data is valid against more than one schema from \"oneOf\": indices {index1} and {index2}",
      NOT_PASSED: "Data matches schema from \"not\"",
      NUMBER_MULTIPLE_OF: "Value {value} is not a multiple of {multipleOf}",
      NUMBER_MINIMUM: "Value {value} is less than minimum {minimum}",
      NUMBER_MINIMUM_EXCLUSIVE: "Value {value} is equal to exclusive minimum {minimum}",
      NUMBER_MAXIMUM: "Value {value} is greater than maximum {maximum}",
      NUMBER_MAXIMUM_EXCLUSIVE: "Value {value} is equal to exclusive maximum {maximum}",
      STRING_LENGTH_SHORT: "String is too short ({length} chars), minimum {minimum}",
      STRING_LENGTH_LONG: "String is too long ({length} chars), maximum {maximum}",
      STRING_PATTERN: "String does not match pattern: {pattern}",
      OBJECT_PROPERTIES_MINIMUM: "Too few properties defined ({propertyCount}), minimum {minimum}",
      OBJECT_PROPERTIES_MAXIMUM: "Too many properties defined ({propertyCount}), maximum {maximum}",
      OBJECT_REQUIRED: "Missing required property: {key}",
      OBJECT_ADDITIONAL_PROPERTIES: "Additional properties not allowed",
      OBJECT_DEPENDENCY_KEY: "Dependency failed - key must exist: {missing} (due to key: {key})",
      ARRAY_LENGTH_SHORT: "Array is too short ({length}), minimum {minimum}",
      ARRAY_LENGTH_LONG: "Array is too long ({length}), maximum {maximum}",
      ARRAY_UNIQUE: "Array items are not unique (indices {match1} and {match2})",
      ARRAY_ADDITIONAL_ITEMS: "Additional items not allowed",
      FORMAT_CUSTOM: "Format validation failed ({message})",
      KEYWORD_CUSTOM: "Keyword failed: {key} ({message})",
      CIRCULAR_REFERENCE: "Circular $refs: {urls}",
      UNKNOWN_PROPERTY: "Unknown property (not in schema)"
    };
    function ValidationError(code, message, dataPath, schemaPath, subErrors) {
      Error.call(this);
      if (code === undefined) {
        throw new Error("No code supplied for error: " + message);
      }
      this.message = message;
      this.code = code;
      this.dataPath = dataPath || "";
      this.schemaPath = schemaPath || "";
      this.subErrors = subErrors || null;
      var err = new Error(this.message);
      this.stack = err.stack || err.stacktrace;
      if (!this.stack) {
        try {
          throw err;
        } catch (err) {
          this.stack = err.stack || err.stacktrace;
        }
      }
    }
    ValidationError.prototype = Object.create(Error.prototype);
    ValidationError.prototype.constructor = ValidationError;
    ValidationError.prototype.name = 'ValidationError';
    ValidationError.prototype.prefixWith = function(dataPrefix, schemaPrefix) {
      if (dataPrefix !== null) {
        dataPrefix = dataPrefix.replace(/~/g, "~0").replace(/\//g, "~1");
        this.dataPath = "/" + dataPrefix + this.dataPath;
      }
      if (schemaPrefix !== null) {
        schemaPrefix = schemaPrefix.replace(/~/g, "~0").replace(/\//g, "~1");
        this.schemaPath = "/" + schemaPrefix + this.schemaPath;
      }
      if (this.subErrors !== null) {
        for (var i = 0; i < this.subErrors.length; i++) {
          this.subErrors[i].prefixWith(dataPrefix, schemaPrefix);
        }
      }
      return this;
    };
    function isTrustedUrl(baseUrl, testUrl) {
      if (testUrl.substring(0, baseUrl.length) === baseUrl) {
        var remainder = testUrl.substring(baseUrl.length);
        if ((testUrl.length > 0 && testUrl.charAt(baseUrl.length - 1) === "/") || remainder.charAt(0) === "#" || remainder.charAt(0) === "?") {
          return true;
        }
      }
      return false;
    }
    var languages = {};
    function createApi(language) {
      var globalContext = new ValidatorContext();
      var currentLanguage = language || 'en';
      var api = {
        addFormat: function() {
          globalContext.addFormat.apply(globalContext, arguments);
        },
        language: function(code) {
          if (!code) {
            return currentLanguage;
          }
          if (!languages[code]) {
            code = code.split('-')[0];
          }
          if (languages[code]) {
            currentLanguage = code;
            return code;
          }
          return false;
        },
        addLanguage: function(code, messageMap) {
          var key;
          for (key in ErrorCodes) {
            if (messageMap[key] && !messageMap[ErrorCodes[key]]) {
              messageMap[ErrorCodes[key]] = messageMap[key];
            }
          }
          var rootCode = code.split('-')[0];
          if (!languages[rootCode]) {
            languages[code] = messageMap;
            languages[rootCode] = messageMap;
          } else {
            languages[code] = Object.create(languages[rootCode]);
            for (key in messageMap) {
              if (typeof languages[rootCode][key] === 'undefined') {
                languages[rootCode][key] = messageMap[key];
              }
              languages[code][key] = messageMap[key];
            }
          }
          return this;
        },
        freshApi: function(language) {
          var result = createApi();
          if (language) {
            result.language(language);
          }
          return result;
        },
        validate: function(data, schema, checkRecursive, banUnknownProperties) {
          var context = new ValidatorContext(globalContext, false, languages[currentLanguage], checkRecursive, banUnknownProperties);
          if (typeof schema === "string") {
            schema = {"$ref": schema};
          }
          context.addSchema("", schema);
          var error = context.validateAll(data, schema, null, null, "");
          if (!error && banUnknownProperties) {
            error = context.banUnknownProperties();
          }
          this.error = error;
          this.missing = context.missing;
          this.valid = (error === null);
          return this.valid;
        },
        validateResult: function() {
          var result = {};
          this.validate.apply(result, arguments);
          return result;
        },
        validateMultiple: function(data, schema, checkRecursive, banUnknownProperties) {
          var context = new ValidatorContext(globalContext, true, languages[currentLanguage], checkRecursive, banUnknownProperties);
          if (typeof schema === "string") {
            schema = {"$ref": schema};
          }
          context.addSchema("", schema);
          context.validateAll(data, schema, null, null, "");
          if (banUnknownProperties) {
            context.banUnknownProperties();
          }
          var result = {};
          result.errors = context.errors;
          result.missing = context.missing;
          result.valid = (result.errors.length === 0);
          return result;
        },
        addSchema: function() {
          return globalContext.addSchema.apply(globalContext, arguments);
        },
        getSchema: function() {
          return globalContext.getSchema.apply(globalContext, arguments);
        },
        getSchemaMap: function() {
          return globalContext.getSchemaMap.apply(globalContext, arguments);
        },
        getSchemaUris: function() {
          return globalContext.getSchemaUris.apply(globalContext, arguments);
        },
        getMissingUris: function() {
          return globalContext.getMissingUris.apply(globalContext, arguments);
        },
        dropSchemas: function() {
          globalContext.dropSchemas.apply(globalContext, arguments);
        },
        defineKeyword: function() {
          globalContext.defineKeyword.apply(globalContext, arguments);
        },
        defineError: function(codeName, codeNumber, defaultMessage) {
          if (typeof codeName !== 'string' || !/^[A-Z]+(_[A-Z]+)*$/.test(codeName)) {
            throw new Error('Code name must be a string in UPPER_CASE_WITH_UNDERSCORES');
          }
          if (typeof codeNumber !== 'number' || codeNumber % 1 !== 0 || codeNumber < 10000) {
            throw new Error('Code number must be an integer > 10000');
          }
          if (typeof ErrorCodes[codeName] !== 'undefined') {
            throw new Error('Error already defined: ' + codeName + ' as ' + ErrorCodes[codeName]);
          }
          if (typeof ErrorCodeLookup[codeNumber] !== 'undefined') {
            throw new Error('Error code already used: ' + ErrorCodeLookup[codeNumber] + ' as ' + codeNumber);
          }
          ErrorCodes[codeName] = codeNumber;
          ErrorCodeLookup[codeNumber] = codeName;
          ErrorMessagesDefault[codeName] = ErrorMessagesDefault[codeNumber] = defaultMessage;
          for (var langCode in languages) {
            var language = languages[langCode];
            if (language[codeName]) {
              language[codeNumber] = language[codeNumber] || language[codeName];
            }
          }
        },
        reset: function() {
          globalContext.reset();
          this.error = null;
          this.missing = [];
          this.valid = true;
        },
        missing: [],
        error: null,
        valid: true,
        normSchema: normSchema,
        resolveUrl: resolveUrl,
        getDocumentUri: getDocumentUri,
        errorCodes: ErrorCodes
      };
      return api;
    }
    var tv4 = createApi();
    tv4.addLanguage('en-gb', ErrorMessagesDefault);
    tv4.tv4 = tv4;
    return tv4;
  })();
  ;
  var Utils = {
    isArray: function(obj) {
      return Array.isArray(obj);
    },
    isObject: function(obj) {
      return obj === Object(obj);
    },
    has: function(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    },
    pluck: function(obj, key) {
      return Utils.map(obj, Utils.property(key));
    },
    map: function(obj, iterator, context) {
      var results = [];
      if (obj === null)
        return results;
      return obj.map(iterator, context);
    },
    property: function(key) {
      return function(obj) {
        return obj[key];
      };
    },
    keys: function(obj) {
      if (!Utils.isObject(obj))
        return [];
      if (Object.keys)
        return Object.keys(obj);
      var keys = [];
      for (var key in obj)
        if (Utils.has(obj, key))
          keys.push(key);
      return keys;
    },
    defaults: function(obj) {
      var sources = Array.prototype.slice.call(arguments, 1);
      sources.forEach(function(source) {
        if (source) {
          for (var prop in source) {
            if (obj[prop] === undefined)
              obj[prop] = source[prop];
          }
        }
      });
      return obj;
    },
    extend: function(obj) {
      var sources = Array.prototype.slice.call(arguments, 1);
      sources.forEach(function(source) {
        if (source) {
          for (var prop in source) {
            obj[prop] = source[prop];
          }
        }
      });
      return obj;
    }
  };
  ;
  var ObjectDesc = function(obj, name, value, doDelete) {
    if (!obj || !name)
      return undefined;
    var objRef = obj;
    var nameParts = Utils.isArray(name) ? name : name.split(".");
    if (nameParts.length > 1) {
      while (nameParts.length > 1) {
        var curParent = objRef;
        var property = nameParts.shift();
        var index = parseInt(property);
        if (Utils.isArray(objRef) && !isNaN(index) && index.toString().length == property.length) {
          if (index < 0)
            property = objRef.length + index;
          else
            property = index;
        }
        objRef = objRef[property];
        if (objRef === undefined) {
          if (value === undefined) {
            return undefined;
          } else {
            objRef = curParent[property] = {};
          }
        }
      }
    }
    var finalProperty = nameParts.shift();
    if (doDelete === true)
      delete objRef[finalProperty];
    else if (value !== undefined)
      objRef[finalProperty] = value;
    else
      return objRef[finalProperty];
  };
  ;
  var Field = function(fieldDef) {
    this.fieldDef = fieldDef;
  };
  Field.prototype.getId = function() {
    return this.fieldDef.id;
  };
  Field.prototype.getSelector = function() {
    return this.fieldDef.selector;
  };
  Field.prototype.getType = function() {
    return this.fieldDef.type;
  };
  Field.prototype.getLabel = function() {
    return this.fieldDef.label || this.getId();
  };
  Field.prototype.getSubLabel = function() {
    return this.fieldDef.subLabel;
  };
  Field.prototype.getNumericPrecision = function() {
    return this.fieldDef.precision;
  };
  Field.prototype.getLinkText = function() {
    return this.fieldDef.linkText;
  };
  Field.prototype.getInputDesc = function() {
    return this.fieldDef.inputDesc;
  };
  Field.prototype.getOptions = function() {
    return this.fieldDef.options;
  };
  Field.prototype.getOptionsUrl = function() {
    return this.fieldDef.optionsUrl;
  };
  Field.prototype.isRequired = function() {
    return this.fieldDef.required === true;
  };
  Field.prototype.isHiddenInput = function() {
    return this.isOfType("hidden");
  };
  Field.prototype.isSubForm = function() {
    return this.isOfType("subForm");
  };
  Field.prototype.isCheckedField = function() {
    return this.isOfType("checkbox");
  };
  Field.prototype.isTextualField = function() {
    return this.isOfType(["text", "textarea", "number"]);
  };
  Field.prototype.isNumericField = function() {
    return this.isOfType("number");
  };
  Field.prototype.isRequiredTextField = function() {
    return this.isRequired() && this.isTextualField();
  };
  Field.prototype.isIntegerField = function() {
    var precision = this.getNumericPrecision();
    return this.isOfType("number") && (precision === undefined || precision === 0);
  };
  Field.prototype.isDecimalField = function() {
    var precision = this.getNumericPrecision();
    return this.isOfType("number") && (precision !== undefined && precision > 0);
  };
  Field.prototype.isOfType = function(types) {
    if (typeof types == "string")
      types = [types];
    return types.indexOf(this.getType()) >= 0;
  };
  ;
  var Form = function(formElement, loader, validator) {
    this.formElement = formElement;
    this.loader = loader;
    this.validator = validator;
    this.attachToSubmitButton();
    this.attachToCancelButton();
  };
  Form.prototype = Object.create(EventEmitter.prototype);
  Form.prototype.attachToSubmitButton = function() {
    var self = this;
    this.formElement.find("#submitButton").bind("click", function(e) {
      var values = self.loader.pullValues();
      var errors = self.validator.validate(values);
      if (Utils.keys(errors).length > 0)
        self.onInvalidForm(values, errors);
      else
        self.onSubmit(values);
    });
  };
  Form.prototype.attachToCancelButton = function() {
    var self = this;
    this.formElement.find("#cancelButton").bind("click", function(e) {
      self.onCancel();
    });
  };
  Form.prototype.getRecord = function() {
    return this.record;
  };
  Form.prototype.loadRecord = function(record) {
    this.record = record || {};
    this.loader.loadForm(this.record);
  };
  Form.prototype.updateRecord = function(record, values) {
    Utils.extend(record, values);
  };
  Form.prototype.onSubmit = function(values) {
    var self = this;
    if (this.record) {
      this.updateRecord(this.record, values);
      this.emit("submit", [this.record]);
    } else {
      this.emit("submit", [values]);
    }
  };
  Form.prototype.onCancel = function() {
    this.emit("cancel", [this.record]);
  };
  Form.prototype.onInvalidForm = function(values, errors) {
    this.emit("invalid", [this.record, values, errors]);
  };
  ;
  var FormBuilder = function(config) {
    this.fields = config.fields.map(function(fieldDef) {
      return new Field(fieldDef);
    });
    this.buttons = this.createButtonConfig(config.buttons || {});
  };
  FormBuilder.prototype = {};
  FormBuilder.prototype.buildForm = function(formSelector, cb) {
    var self = this;
    var formDiv = $(formSelector);
    var formLoader;
    var formValidator;
    formDiv.addClass("formBuilderForm");
    async.parallel([function(done) {
      async.forEachSeries(self.fields, function(field, next) {
        self.addField(formDiv, field, next);
      }, function() {
        self.addButtons(formDiv);
        done();
      });
    }, function(done) {
      self.buildLoader(formDiv, function(loader) {
        formLoader = loader;
        done();
      });
    }, function(done) {
      self.buildValidator(formDiv, function(validator) {
        formValidator = validator;
        done();
      });
    }], function() {
      var form = new Form(formDiv, formLoader, formValidator);
      cb(null, form);
    });
  };
  FormBuilder.prototype.addField = function(form, field, cb) {
    if (field.isHiddenInput()) {
      return this.buildInput(field, function(err, formInput) {
        form.append(formInput);
        cb();
      });
    } else {
      return this.buildField(field, function(err, formField) {
        form.append(formField);
        cb();
      });
    }
  };
  FormBuilder.prototype.addButtons = function(form) {
    var buttons = this.buildButtons();
    form.append(buttons);
  };
  FormBuilder.prototype.buildField = function(field, cb) {
    var self = this;
    var formField = $("<div></div>");
    formField.addClass("form-line");
    self.buildInput(field, function(err, input) {
      var label = self.buildLabel(field);
      var subLabel = self.buildSubLabel(field);
      if (label)
        formField.append(label);
      formField.append(input);
      if (subLabel)
        formField.append(subLabel);
      cb(null, formField);
    });
  };
  FormBuilder.prototype.buildLabel = function(field) {
    if (!field.getLabel())
      return undefined;
    var label = $("<label></label>");
    label.addClass("form-label-left");
    label.attr("for", field.getSelector());
    label.text(field.getLabel());
    if (field.isRequired())
      label.append("<span class='form-required'>*</span>");
    return label;
  };
  FormBuilder.prototype.buildSubLabel = function(field) {
    if (!field.getSubLabel())
      return undefined;
    var subLabel = $("<label></label>");
    subLabel.addClass("form-sub-label");
    subLabel.attr("for", field.getSelector());
    subLabel.html(field.getSubLabel());
    return subLabel;
  };
  FormBuilder.prototype.buildInput = function(field, cb) {
    var input = $("<div></div>");
    var control;
    input.addClass("form-input");
    switch (field.getType()) {
      case "checkbox":
        input = $("<span></span>").appendTo(input);
        input.addClass("form-checkbox-item");
        control = $("<input type='checkbox' />");
        control.addClass("form-checkbox");
        control.attr("value", "true");
        break;
      case "date":
        control = $("<input type='date' />");
        control.addClass("form-textbox");
        break;
      case "datetime":
        control = $("<input type='text' />");
        control.addClass("form-textbox");
        control.attr("size", "25");
        break;
      case "display":
        control = $("<span></span>");
        break;
      case "file":
        control = $("<input type='file' />");
        control.addClass("form-textbox");
        control.attr("size", "20");
        break;
      case "hidden":
        control = $("<input type='hidden' />");
        break;
      case "number":
        control = $("<input type='number' />");
        control.addClass("form-textbox");
        control.attr("size", "5");
        control.attr("min", "0");
        break;
      case "select":
        control = $("<select></select>");
        control.addClass("form-dropdown");
        control.css("width", "150px");
        break;
      case "subForm":
        control = $("<a href='javascript: void(0);'>" + field.getLinkText() + "</a>");
        control.attr("linkText", field.getLinkText());
        control.subform(field);
        break;
      case "text":
        control = $("<input type='text' />");
        control.addClass("form-textbox");
        control.attr("size", "25");
        break;
      case "textarea":
        control = $("<textarea></textarea>");
        control.addClass("form-textarea");
        control.attr("cols", "30");
        control.attr("rows", "6");
        break;
      default:
        throw new Error("[Form Builder] buildInput() error - unexpected field type: " + field.getType());
    }
    control.attr("id", field.getSelector());
    input.append(control);
    if (field.getInputDesc())
      input.append("<br />" + field.getInputDesc());
    if (field.getType() == "select") {
      this.addSelectOptions(field, control, function() {
        cb(null, input);
      });
    } else {
      cb(null, input);
    }
  };
  FormBuilder.prototype.addSelectOptions = function(field, select, cb) {
    this.getSelectOptions(field, function(err, options) {
      if (field.isRequired() === false) {
        select.append("<option></option>");
      }
      options.forEach(function(option) {
        var value = option.value;
        var label = option.label;
        select.append("<option value='" + value + "'>" + label + "</option>");
      });
      cb();
    });
  };
  FormBuilder.prototype.getSelectOptions = function(field, cb) {
    if (field.getOptions()) {
      cb(null, field.getOptions());
    } else if (field.getOptionsUrl()) {
      $.get(field.getOptionsUrl(), function(data) {
        cb(null, data);
      });
    }
  };
  FormBuilder.prototype.buildButtons = function() {
    var self = this;
    var buttons = $("<div></div>");
    buttons.addClass("form-line");
    if (this.buttons.submit.isVisible()) {
      var submitButton = $("<button type='submit'></button>");
      submitButton.attr("id", "submitButton");
      submitButton.addClass("form-submit-button");
      submitButton.text(this.buttons.submit.getLabel());
      buttons.append(submitButton);
    }
    if (this.buttons.cancel.isVisible()) {
      var cancelButton = $("<button type='submit'></button>");
      cancelButton.attr("id", "cancelButton");
      cancelButton.addClass("form-submit-button");
      cancelButton.text(this.buttons.cancel.getLabel());
      buttons.append(cancelButton);
    }
    return buttons;
  };
  FormBuilder.prototype.createButtonConfig = function(config) {
    return {
      submit: this.Button(Utils.defaults(config.submit || {}, {
        label: "Submit",
        visible: true
      })),
      cancel: this.Button(Utils.defaults(config.cancel || {}, {
        label: "Cancel",
        visible: true
      }))
    };
  };
  FormBuilder.prototype.Button = function(config) {
    return {
      isVisible: function() {
        return config.visible;
      },
      getLabel: function() {
        return config.label;
      }
    };
  };
  FormBuilder.prototype.buildLoader = function(formDivSelector, cb) {
    var formLoader = new FormLoader(this.fields, formDivSelector);
    cb(formLoader);
  };
  FormBuilder.prototype.buildValidator = function(formDivSelector, cb) {
    var formValidator = FormValidatorFactory.forFields(this.fields);
    cb(formValidator);
  };
  ;
  var FormConfig = {};
  FormConfig.fromSchema = function(schema) {
    var formConfig = {
      fields: [],
      buttons: {}
    };
    FormConfig.addSchemaToConfig(formConfig, schema, []);
    return FormConfig.validateConfig(formConfig);
  };
  FormConfig.validateConfig = function(config) {
    config.fields.forEach(function(field) {
      field.selector = field.id.replace(".", "_");
    });
    return config;
  };
  FormConfig.addSchemaToConfig = function(config, schema, path) {
    if (schema.type == "object") {
      FormConfig.addObjectToConfig(config, schema, path);
    } else if (schema.type == "string") {
      FormConfig.addStringToConfig(config, schema, path);
    } else {
      throw new Error("unsupported schema type: " + schema.type);
    }
  };
  FormConfig.addObjectToConfig = function(config, schema, path) {
    for (var key in schema.properties) {
      FormConfig.addSchemaToConfig(config, schema.properties[key], path.concat(key));
    }
    if (schema.required) {
      schema.required.forEach(function(requiredField) {
        var field = config.fields.filter(function(field) {
          return field.id == requiredField;
        })[0];
        field.required = true;
      });
    }
  };
  FormConfig.addStringToConfig = function(config, schema, path) {
    var id = path[path.length - 1];
    var field = {};
    field.id = path.join(".");
    field.type = schema.maxLength && schema.maxLength > 100 ? "textarea" : "text";
    field.label = schema.title || (id[0].toUpperCase() + id.substr(1));
    config.fields.push(field);
  };
  ;
  var FormLoader = function(fields, formDivSelector) {
    this.fields = fields;
    this.$form = $(formDivSelector);
  };
  FormLoader.prototype.loadForm = function(record) {
    var self = this;
    record = record || {};
    self.fields.forEach(function(field) {
      self.loadField(field, record);
    });
  };
  FormLoader.prototype.loadField = function(field, record) {
    var $form = this.$form;
    var fieldSelector = field.getSelector();
    var fieldId = field.getId();
    var $field = $form.find("#" + fieldSelector);
    var value = ObjectDesc(record, fieldId);
    switch (field.getType()) {
      case "checkbox":
        $field.attr("checked", (value == "true" || value === true) ? true : false);
        break;
      case "datetime":
        if (value)
          $field.datetimepicker({value: moment(value).format("MM/DD/YYYY h:mm a")});
        break;
      case "select":
        if (!value) {
          $field.val(null);
        } else {
          $field.val(value);
        }
        break;
      case "subForm":
        $field.subform('setValue', value);
        switch (field.valueType) {
          case "array.fk":
            if (value && value.length > 0)
              $field.text(_.pluck(value, "name").join(", "));
            else
              $field.text(field.attr("linkText"));
            break;
          case "fk":
            if (value)
              $field.text(value.name);
            else
              $field.text(field.attr("linkText"));
            break;
        }
        break;
      case "display":
        $field.text(value || null);
        break;
      case "number":
        $field.val(value || null);
        break;
      case "text":
        $field.val(value || null);
        break;
      case "textarea":
        $field.val(value || null);
        break;
      default:
        $field.val(value || null);
        break;
    }
  };
  FormLoader.prototype.pullValues = function() {
    var self = this;
    var $form = self.$form;
    var values = {};
    self.fields.forEach(function(field) {
      var fieldSelector = field.getSelector();
      var $field = $form.find("#" + fieldSelector);
      self.setValue(field, $field, values);
    });
    return values;
  };
  FormLoader.prototype.setValue = function(field, $field, values) {
    var value;
    switch (field.getType()) {
      case "checkbox":
      case "radio":
        value = $field.prop("checked");
        break;
      case "datetime":
        value = new Date($field.val()).getTime();
        break;
      case "display":
        value = undefined;
        break;
      case "number":
        value = $field.val();
        if (value) {
          if (field.isIntegerField()) {
            value = parseInt(value.trim());
          } else if (field.isDecimalField()) {
            value = parseFloat(value.trim());
          }
        }
        break;
      case "select":
        value = $field.val();
        break;
      case "subForm":
        value = $field.subform('getValue');
        if (value instanceof jQuery)
          value = undefined;
        break;
      case "text":
        value = $field.val();
        if (value)
          value = value.trim();
        break;
      case "textarea":
        value = $field.val();
        if (value)
          value = value.trim();
        break;
      default:
        value = $field.val();
        break;
    }
    if (value !== undefined)
      ObjectDesc(values, field.getId(), value);
  };
  ;
  var FieldValidator = function(fields) {
    this.fields = fields;
  };
  FieldValidator.prototype.validate = function(values) {
    var self = this;
    var validationErrors = {};
    values = values || {};
    self.fields.forEach(function(field) {
      var fieldErrors = self.validateField(field, values);
      if (fieldErrors.length > 0)
        validationErrors[field.getId()] = fieldErrors;
    });
    return validationErrors;
  };
  FieldValidator.prototype.validateField = function(field, values) {
    var value = ObjectDesc(values, field.getId());
    var validations = this.getValidations(field);
    var errors = [];
    validations.forEach(function(validation) {
      if (validation.fn.call(null, value) === false) {
        errors.push(validation.msg);
      }
    });
    return errors;
  };
  FieldValidator.prototype.getValidations = function(field) {
    var validations = [];
    if (field.isRequiredTextField()) {
      validations.push({
        fn: this.validateRequiredTextField,
        msg: field.getLabel() + " is required"
      });
    }
    if (field.isIntegerField()) {
      validations.push({
        fn: this.validateNumericField,
        msg: field.getLabel() + " must be a whole number"
      });
    }
    if (field.isDecimalField()) {
      validations.push({
        fn: this.validateNumericField,
        msg: field.getLabel() + " must be a number (with or without decimals)"
      });
    }
    return validations;
  };
  FieldValidator.prototype.validateRequiredTextField = function(value) {
    return (value !== undefined) && (value.toString().length > 0);
  };
  FieldValidator.prototype.validateNumericField = function(value) {
    return !isNaN(value);
  };
  ;
  var SchemaValidator = function(schema) {
    this.schema = schema;
  };
  SchemaValidator.prototype.validate = function(values) {
    var self = this;
    values = values || {};
    var result = tv4.validateMultiple(values, this.schema, true, true);
    if (result.valid)
      return [];
    var validationErrors = {};
    tv4.errors.forEach(function(error) {
      if (!validationErrors[error.dataPath])
        validationErrors[error.dataPath] = [];
      validationErrors[error.dataPath].push(error.message);
    });
    return validationErrors;
  };
  ;
  var FormValidatorFactory = {
    forFields: function(fields) {
      return new FieldValidator(fields);
    },
    forSchema: function(schema) {
      return new SchemaValidator(schema);
    }
  };
  return {
    get EventEmitter() {
      return EventEmitter;
    },
    get async() {
      return async;
    },
    get tv4() {
      return tv4;
    },
    get Utils() {
      return Utils;
    },
    get ObjectDesc() {
      return ObjectDesc;
    },
    get Form() {
      return Form;
    },
    get FormBuilder() {
      return FormBuilder;
    },
    get FormConfig() {
      return FormConfig;
    },
    get FormLoader() {
      return FormLoader;
    },
    get FieldValidator() {
      return FieldValidator;
    },
    get SchemaValidator() {
      return SchemaValidator;
    },
    get FormValidatorFactory() {
      return FormValidatorFactory;
    },
    __esModule: true
  };
});


