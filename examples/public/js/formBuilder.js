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
    var formValidator = new FormValidator(this.fields, formDivSelector);
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
        field.attr("checked", (value == "true" || value === true) ? true : false);
        break;
      case "datetime":
        if (value)
          field.datetimepicker({value: moment(value).format("MM/DD/YYYY h:mm a")});
        break;
      case "select":
        if (!value) {
          field.val(null);
        } else {
          field.val(value);
        }
        break;
      case "subForm":
        field.subform('setValue', value);
        switch (field.valueType) {
          case "array.fk":
            if (value && value.length > 0)
              field.text(_.pluck(value, "name").join(", "));
            else
              field.text(field.attr("linkText"));
            break;
          case "fk":
            if (value)
              field.text(value.name);
            else
              field.text(field.attr("linkText"));
            break;
        }
        break;
      case "display":
        field.text(value || null);
        break;
      case "number":
        field.val(value || null);
        break;
      case "text":
        field.val(value || null);
        break;
      case "textarea":
        field.val(value || null);
        break;
      default:
        field.val(value || null);
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
  var FormValidator = function(fields, formDivSelector) {
    this.fields = fields;
    this.formDiv = $(formDivSelector);
  };
  FormValidator.prototype.validate = function(values) {
    var self = this;
    var validationErrors = {};
    values = values || {};
    self.fields.forEach(function(field) {
      var fieldErrors = self.validateField(field, values);
      if (fieldErrors.length > 0)
        validationErrors[field.id] = fieldErrors;
    });
    return validationErrors;
  };
  FormValidator.prototype.validateField = function(fieldDef, values) {
    var value = values[fieldDef.id];
    var validations = this.getValidations(fieldDef);
    var errors = [];
    validations.forEach(function(validation) {
      if (validation.fn.call(null, value) === false) {
        errors.push(validation.msg);
      }
    });
    return errors;
  };
  FormValidator.prototype.getValidations = function(field) {
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
  FormValidator.prototype.validateRequiredTextField = function(value) {
    return (value !== undefined) && (value.toString().length > 0);
  };
  FormValidator.prototype.validateNumericField = function(value) {
    return !isNaN(value);
  };
  return {
    get EventEmitter() {
      return EventEmitter;
    },
    get async() {
      return async;
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
    get FormValidator() {
      return FormValidator;
    },
    __esModule: true
  };
});


