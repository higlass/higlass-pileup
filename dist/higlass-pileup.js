(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["higlass-pileup"] = factory();
	else
		root["higlass-pileup"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 227:
/***/ ((module, exports, __webpack_require__) => {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(447)(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),

/***/ 447:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(824);
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),

/***/ 898:
/***/ ((module) => {

"use strict";


module.exports = value => {
	if (!value) {
		return false;
	}

	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	if (typeof Symbol.observable === 'symbol' && typeof value[Symbol.observable] === 'function') {
		// eslint-disable-next-line no-use-extend-native/no-use-extend-native
		return value === value[Symbol.observable]();
	}

	if (typeof value['@@observable'] === 'function') {
		return value === value['@@observable']();
	}

	return false;
};


/***/ }),

/***/ 824:
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ 49:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Observable: () => (/* reexport */ dist_esm_observable),
  Subject: () => (/* reexport */ dist_esm_subject),
  filter: () => (/* reexport */ dist_esm_filter),
  flatMap: () => (/* reexport */ dist_esm_flatMap),
  interval: () => (/* reexport */ interval),
  map: () => (/* reexport */ dist_esm_map),
  merge: () => (/* reexport */ dist_esm_merge),
  multicast: () => (/* reexport */ dist_esm_multicast),
  scan: () => (/* reexport */ dist_esm_scan),
  unsubscribe: () => (/* reexport */ dist_esm_unsubscribe)
});

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/_scheduler.js
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class AsyncSerialScheduler {
    constructor(observer) {
        this._baseObserver = observer;
        this._pendingPromises = new Set();
    }
    complete() {
        Promise.all(this._pendingPromises)
            .then(() => this._baseObserver.complete())
            .catch(error => this._baseObserver.error(error));
    }
    error(error) {
        this._baseObserver.error(error);
    }
    schedule(task) {
        const prevPromisesCompletion = Promise.all(this._pendingPromises);
        const values = [];
        const next = (value) => values.push(value);
        const promise = Promise.resolve()
            .then(() => __awaiter(this, void 0, void 0, function* () {
            yield prevPromisesCompletion;
            yield task(next);
            this._pendingPromises.delete(promise);
            for (const value of values) {
                this._baseObserver.next(value);
            }
        }))
            .catch(error => {
            this._pendingPromises.delete(promise);
            this._baseObserver.error(error);
        });
        this._pendingPromises.add(promise);
    }
}

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/_symbols.js
const hasSymbols = () => typeof Symbol === "function";
const hasSymbol = (name) => hasSymbols() && Boolean(Symbol[name]);
const getSymbol = (name) => hasSymbol(name) ? Symbol[name] : "@@" + name;
function registerObservableSymbol() {
    if (hasSymbols() && !hasSymbol("observable")) {
        Symbol.observable = Symbol("observable");
    }
}
if (!hasSymbol("asyncIterator")) {
    Symbol.asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
}

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/observable.js
/**
 * Based on <https://raw.githubusercontent.com/zenparsing/zen-observable/master/src/Observable.js>
 * At commit: f63849a8c60af5d514efc8e9d6138d8273c49ad6
 */


const SymbolIterator = getSymbol("iterator");
const SymbolObservable = getSymbol("observable");
const SymbolSpecies = getSymbol("species");
// === Abstract Operations ===
function getMethod(obj, key) {
    const value = obj[key];
    if (value == null) {
        return undefined;
    }
    if (typeof value !== "function") {
        throw new TypeError(value + " is not a function");
    }
    return value;
}
function getSpecies(obj) {
    let ctor = obj.constructor;
    if (ctor !== undefined) {
        ctor = ctor[SymbolSpecies];
        if (ctor === null) {
            ctor = undefined;
        }
    }
    return ctor !== undefined ? ctor : Observable;
}
function isObservable(x) {
    return x instanceof Observable; // SPEC: Brand check
}
function hostReportError(error) {
    if (hostReportError.log) {
        hostReportError.log(error);
    }
    else {
        setTimeout(() => { throw error; }, 0);
    }
}
function enqueue(fn) {
    Promise.resolve().then(() => {
        try {
            fn();
        }
        catch (e) {
            hostReportError(e);
        }
    });
}
function cleanupSubscription(subscription) {
    const cleanup = subscription._cleanup;
    if (cleanup === undefined) {
        return;
    }
    subscription._cleanup = undefined;
    if (!cleanup) {
        return;
    }
    try {
        if (typeof cleanup === "function") {
            cleanup();
        }
        else {
            const unsubscribe = getMethod(cleanup, "unsubscribe");
            if (unsubscribe) {
                unsubscribe.call(cleanup);
            }
        }
    }
    catch (e) {
        hostReportError(e);
    }
}
function closeSubscription(subscription) {
    subscription._observer = undefined;
    subscription._queue = undefined;
    subscription._state = "closed";
}
function flushSubscription(subscription) {
    const queue = subscription._queue;
    if (!queue) {
        return;
    }
    subscription._queue = undefined;
    subscription._state = "ready";
    for (const item of queue) {
        notifySubscription(subscription, item.type, item.value);
        if (subscription._state === "closed") {
            break;
        }
    }
}
function notifySubscription(subscription, type, value) {
    subscription._state = "running";
    const observer = subscription._observer;
    try {
        const m = observer ? getMethod(observer, type) : undefined;
        switch (type) {
            case "next":
                if (m)
                    m.call(observer, value);
                break;
            case "error":
                closeSubscription(subscription);
                if (m)
                    m.call(observer, value);
                else
                    throw value;
                break;
            case "complete":
                closeSubscription(subscription);
                if (m)
                    m.call(observer);
                break;
        }
    }
    catch (e) {
        hostReportError(e);
    }
    if (subscription._state === "closed") {
        cleanupSubscription(subscription);
    }
    else if (subscription._state === "running") {
        subscription._state = "ready";
    }
}
function onNotify(subscription, type, value) {
    if (subscription._state === "closed") {
        return;
    }
    if (subscription._state === "buffering") {
        subscription._queue = subscription._queue || [];
        subscription._queue.push({ type, value });
        return;
    }
    if (subscription._state !== "ready") {
        subscription._state = "buffering";
        subscription._queue = [{ type, value }];
        enqueue(() => flushSubscription(subscription));
        return;
    }
    notifySubscription(subscription, type, value);
}
class Subscription {
    constructor(observer, subscriber) {
        // ASSERT: observer is an object
        // ASSERT: subscriber is callable
        this._cleanup = undefined;
        this._observer = observer;
        this._queue = undefined;
        this._state = "initializing";
        const subscriptionObserver = new SubscriptionObserver(this);
        try {
            this._cleanup = subscriber.call(undefined, subscriptionObserver);
        }
        catch (e) {
            subscriptionObserver.error(e);
        }
        if (this._state === "initializing") {
            this._state = "ready";
        }
    }
    get closed() {
        return this._state === "closed";
    }
    unsubscribe() {
        if (this._state !== "closed") {
            closeSubscription(this);
            cleanupSubscription(this);
        }
    }
}
class SubscriptionObserver {
    constructor(subscription) { this._subscription = subscription; }
    get closed() { return this._subscription._state === "closed"; }
    next(value) { onNotify(this._subscription, "next", value); }
    error(value) { onNotify(this._subscription, "error", value); }
    complete() { onNotify(this._subscription, "complete"); }
}
/**
 * The basic Observable class. This primitive is used to wrap asynchronous
 * data streams in a common standardized data type that is interoperable
 * between libraries and can be composed to represent more complex processes.
 */
class Observable {
    constructor(subscriber) {
        if (!(this instanceof Observable)) {
            throw new TypeError("Observable cannot be called as a function");
        }
        if (typeof subscriber !== "function") {
            throw new TypeError("Observable initializer must be a function");
        }
        this._subscriber = subscriber;
    }
    subscribe(nextOrObserver, onError, onComplete) {
        if (typeof nextOrObserver !== "object" || nextOrObserver === null) {
            nextOrObserver = {
                next: nextOrObserver,
                error: onError,
                complete: onComplete
            };
        }
        return new Subscription(nextOrObserver, this._subscriber);
    }
    pipe(first, ...mappers) {
        // tslint:disable-next-line no-this-assignment
        let intermediate = this;
        for (const mapper of [first, ...mappers]) {
            intermediate = mapper(intermediate);
        }
        return intermediate;
    }
    tap(nextOrObserver, onError, onComplete) {
        const tapObserver = typeof nextOrObserver !== "object" || nextOrObserver === null
            ? {
                next: nextOrObserver,
                error: onError,
                complete: onComplete
            }
            : nextOrObserver;
        return new Observable(observer => {
            return this.subscribe({
                next(value) {
                    tapObserver.next && tapObserver.next(value);
                    observer.next(value);
                },
                error(error) {
                    tapObserver.error && tapObserver.error(error);
                    observer.error(error);
                },
                complete() {
                    tapObserver.complete && tapObserver.complete();
                    observer.complete();
                },
                start(subscription) {
                    tapObserver.start && tapObserver.start(subscription);
                }
            });
        });
    }
    forEach(fn) {
        return new Promise((resolve, reject) => {
            if (typeof fn !== "function") {
                reject(new TypeError(fn + " is not a function"));
                return;
            }
            function done() {
                subscription.unsubscribe();
                resolve(undefined);
            }
            const subscription = this.subscribe({
                next(value) {
                    try {
                        fn(value, done);
                    }
                    catch (e) {
                        reject(e);
                        subscription.unsubscribe();
                    }
                },
                error(error) {
                    reject(error);
                },
                complete() {
                    resolve(undefined);
                }
            });
        });
    }
    map(fn) {
        if (typeof fn !== "function") {
            throw new TypeError(fn + " is not a function");
        }
        const C = getSpecies(this);
        return new C(observer => this.subscribe({
            next(value) {
                let propagatedValue = value;
                try {
                    propagatedValue = fn(value);
                }
                catch (e) {
                    return observer.error(e);
                }
                observer.next(propagatedValue);
            },
            error(e) { observer.error(e); },
            complete() { observer.complete(); },
        }));
    }
    filter(fn) {
        if (typeof fn !== "function") {
            throw new TypeError(fn + " is not a function");
        }
        const C = getSpecies(this);
        return new C(observer => this.subscribe({
            next(value) {
                try {
                    if (!fn(value))
                        return;
                }
                catch (e) {
                    return observer.error(e);
                }
                observer.next(value);
            },
            error(e) { observer.error(e); },
            complete() { observer.complete(); },
        }));
    }
    reduce(fn, seed) {
        if (typeof fn !== "function") {
            throw new TypeError(fn + " is not a function");
        }
        const C = getSpecies(this);
        const hasSeed = arguments.length > 1;
        let hasValue = false;
        let acc = seed;
        return new C(observer => this.subscribe({
            next(value) {
                const first = !hasValue;
                hasValue = true;
                if (!first || hasSeed) {
                    try {
                        acc = fn(acc, value);
                    }
                    catch (e) {
                        return observer.error(e);
                    }
                }
                else {
                    acc = value;
                }
            },
            error(e) { observer.error(e); },
            complete() {
                if (!hasValue && !hasSeed) {
                    return observer.error(new TypeError("Cannot reduce an empty sequence"));
                }
                observer.next(acc);
                observer.complete();
            },
        }));
    }
    concat(...sources) {
        const C = getSpecies(this);
        return new C(observer => {
            let subscription;
            let index = 0;
            function startNext(next) {
                subscription = next.subscribe({
                    next(v) { observer.next(v); },
                    error(e) { observer.error(e); },
                    complete() {
                        if (index === sources.length) {
                            subscription = undefined;
                            observer.complete();
                        }
                        else {
                            startNext(C.from(sources[index++]));
                        }
                    },
                });
            }
            startNext(this);
            return () => {
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = undefined;
                }
            };
        });
    }
    flatMap(fn) {
        if (typeof fn !== "function") {
            throw new TypeError(fn + " is not a function");
        }
        const C = getSpecies(this);
        return new C(observer => {
            const subscriptions = [];
            const outer = this.subscribe({
                next(value) {
                    let normalizedValue;
                    if (fn) {
                        try {
                            normalizedValue = fn(value);
                        }
                        catch (e) {
                            return observer.error(e);
                        }
                    }
                    else {
                        normalizedValue = value;
                    }
                    const inner = C.from(normalizedValue).subscribe({
                        next(innerValue) { observer.next(innerValue); },
                        error(e) { observer.error(e); },
                        complete() {
                            const i = subscriptions.indexOf(inner);
                            if (i >= 0)
                                subscriptions.splice(i, 1);
                            completeIfDone();
                        },
                    });
                    subscriptions.push(inner);
                },
                error(e) { observer.error(e); },
                complete() { completeIfDone(); },
            });
            function completeIfDone() {
                if (outer.closed && subscriptions.length === 0) {
                    observer.complete();
                }
            }
            return () => {
                subscriptions.forEach(s => s.unsubscribe());
                outer.unsubscribe();
            };
        });
    }
    [(Symbol.observable, SymbolObservable)]() { return this; }
    static from(x) {
        const C = (typeof this === "function" ? this : Observable);
        if (x == null) {
            throw new TypeError(x + " is not an object");
        }
        const observableMethod = getMethod(x, SymbolObservable);
        if (observableMethod) {
            const observable = observableMethod.call(x);
            if (Object(observable) !== observable) {
                throw new TypeError(observable + " is not an object");
            }
            if (isObservable(observable) && observable.constructor === C) {
                return observable;
            }
            return new C(observer => observable.subscribe(observer));
        }
        if (hasSymbol("iterator")) {
            const iteratorMethod = getMethod(x, SymbolIterator);
            if (iteratorMethod) {
                return new C(observer => {
                    enqueue(() => {
                        if (observer.closed)
                            return;
                        for (const item of iteratorMethod.call(x)) {
                            observer.next(item);
                            if (observer.closed)
                                return;
                        }
                        observer.complete();
                    });
                });
            }
        }
        if (Array.isArray(x)) {
            return new C(observer => {
                enqueue(() => {
                    if (observer.closed)
                        return;
                    for (const item of x) {
                        observer.next(item);
                        if (observer.closed)
                            return;
                    }
                    observer.complete();
                });
            });
        }
        throw new TypeError(x + " is not observable");
    }
    static of(...items) {
        const C = (typeof this === "function" ? this : Observable);
        return new C(observer => {
            enqueue(() => {
                if (observer.closed)
                    return;
                for (const item of items) {
                    observer.next(item);
                    if (observer.closed)
                        return;
                }
                observer.complete();
            });
        });
    }
    static get [SymbolSpecies]() { return this; }
}
if (hasSymbols()) {
    Object.defineProperty(Observable, Symbol("extensions"), {
        value: {
            symbol: SymbolObservable,
            hostReportError,
        },
        configurable: true,
    });
}
/* harmony default export */ const dist_esm_observable = (Observable);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/unsubscribe.js
/**
 * Unsubscribe from a subscription returned by something that looks like an observable,
 * but is not necessarily our observable implementation.
 */
function unsubscribe(subscription) {
    if (typeof subscription === "function") {
        subscription();
    }
    else if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
    }
}
/* harmony default export */ const dist_esm_unsubscribe = (unsubscribe);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/filter.js
var filter_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



/**
 * Filters the values emitted by another observable.
 * To be applied to an input observable using `pipe()`.
 */
function filter(test) {
    return (observable) => {
        return new dist_esm_observable(observer => {
            const scheduler = new AsyncSerialScheduler(observer);
            const subscription = observable.subscribe({
                complete() {
                    scheduler.complete();
                },
                error(error) {
                    scheduler.error(error);
                },
                next(input) {
                    scheduler.schedule((next) => filter_awaiter(this, void 0, void 0, function* () {
                        if (yield test(input)) {
                            next(input);
                        }
                    }));
                }
            });
            return () => dist_esm_unsubscribe(subscription);
        });
    };
}
/* harmony default export */ const dist_esm_filter = (filter);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/_util.js
/// <reference lib="es2018" />

function isAsyncIterator(thing) {
    return thing && hasSymbol("asyncIterator") && thing[Symbol.asyncIterator];
}
function isIterator(thing) {
    return thing && hasSymbol("iterator") && thing[Symbol.iterator];
}

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/flatMap.js
var flatMap_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (undefined && undefined.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};




/**
 * Maps the values emitted by another observable. In contrast to `map()`
 * the `mapper` function returns an array of values that will be emitted
 * separately.
 * Use `flatMap()` to map input values to zero, one or multiple output
 * values. To be applied to an input observable using `pipe()`.
 */
function flatMap(mapper) {
    return (observable) => {
        return new dist_esm_observable(observer => {
            const scheduler = new AsyncSerialScheduler(observer);
            const subscription = observable.subscribe({
                complete() {
                    scheduler.complete();
                },
                error(error) {
                    scheduler.error(error);
                },
                next(input) {
                    scheduler.schedule((next) => flatMap_awaiter(this, void 0, void 0, function* () {
                        var e_1, _a;
                        const mapped = yield mapper(input);
                        if (isIterator(mapped) || isAsyncIterator(mapped)) {
                            try {
                                for (var mapped_1 = __asyncValues(mapped), mapped_1_1; mapped_1_1 = yield mapped_1.next(), !mapped_1_1.done;) {
                                    const element = mapped_1_1.value;
                                    next(element);
                                }
                            }
                            catch (e_1_1) { e_1 = { error: e_1_1 }; }
                            finally {
                                try {
                                    if (mapped_1_1 && !mapped_1_1.done && (_a = mapped_1.return)) yield _a.call(mapped_1);
                                }
                                finally { if (e_1) throw e_1.error; }
                            }
                        }
                        else {
                            mapped.map(output => next(output));
                        }
                    }));
                }
            });
            return () => dist_esm_unsubscribe(subscription);
        });
    };
}
/* harmony default export */ const dist_esm_flatMap = (flatMap);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/interval.js

/**
 * Creates an observable that yields a new value every `period` milliseconds.
 * The first value emitted is 0, then 1, 2, etc. The first value is not emitted
 * immediately, but after the first interval.
 */
function interval(period) {
    return new Observable(observer => {
        let counter = 0;
        const handle = setInterval(() => {
            observer.next(counter++);
        }, period);
        return () => clearInterval(handle);
    });
}

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/map.js
var map_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



/**
 * Maps the values emitted by another observable to different values.
 * To be applied to an input observable using `pipe()`.
 */
function map(mapper) {
    return (observable) => {
        return new dist_esm_observable(observer => {
            const scheduler = new AsyncSerialScheduler(observer);
            const subscription = observable.subscribe({
                complete() {
                    scheduler.complete();
                },
                error(error) {
                    scheduler.error(error);
                },
                next(input) {
                    scheduler.schedule((next) => map_awaiter(this, void 0, void 0, function* () {
                        const mapped = yield mapper(input);
                        next(mapped);
                    }));
                }
            });
            return () => dist_esm_unsubscribe(subscription);
        });
    };
}
/* harmony default export */ const dist_esm_map = (map);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/merge.js


function merge(...observables) {
    if (observables.length === 0) {
        return Observable.from([]);
    }
    return new Observable(observer => {
        let completed = 0;
        const subscriptions = observables.map(input => {
            return input.subscribe({
                error(error) {
                    observer.error(error);
                    unsubscribeAll();
                },
                next(value) {
                    observer.next(value);
                },
                complete() {
                    if (++completed === observables.length) {
                        observer.complete();
                        unsubscribeAll();
                    }
                }
            });
        });
        const unsubscribeAll = () => {
            subscriptions.forEach(subscription => dist_esm_unsubscribe(subscription));
        };
        return unsubscribeAll;
    });
}
/* harmony default export */ const dist_esm_merge = (merge);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/subject.js

// TODO: This observer iteration approach looks inelegant and expensive
// Idea: Come up with super class for Subscription that contains the
//       notify*, ... methods and use it here
/**
 * A subject is a "hot" observable (see `multicast`) that has its observer
 * methods (`.next(value)`, `.error(error)`, `.complete()`) exposed.
 *
 * Be careful, though! With great power comes great responsibility. Only use
 * the `Subject` when you really need to trigger updates "from the outside" and
 * try to keep the code that can access it to a minimum. Return
 * `Observable.from(mySubject)` to not allow other code to mutate.
 */
class MulticastSubject extends dist_esm_observable {
    constructor() {
        super(observer => {
            this._observers.add(observer);
            return () => this._observers.delete(observer);
        });
        this._observers = new Set();
    }
    next(value) {
        for (const observer of this._observers) {
            observer.next(value);
        }
    }
    error(error) {
        for (const observer of this._observers) {
            observer.error(error);
        }
    }
    complete() {
        for (const observer of this._observers) {
            observer.complete();
        }
    }
}
/* harmony default export */ const dist_esm_subject = (MulticastSubject);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/multicast.js



// TODO: Subject already creates additional observables "under the hood",
//       now we introduce even more. A true native MulticastObservable
//       would be preferable.
/**
 * Takes a "cold" observable and returns a wrapping "hot" observable that
 * proxies the input observable's values and errors.
 *
 * An observable is called "cold" when its initialization function is run
 * for each new subscriber. This is how observable-fns's `Observable`
 * implementation works.
 *
 * A hot observable is an observable where new subscribers subscribe to
 * the upcoming values of an already-initialiazed observable.
 *
 * The multicast observable will lazily subscribe to the source observable
 * once it has its first own subscriber and will unsubscribe from the
 * source observable when its last own subscriber unsubscribed.
 */
function multicast(coldObservable) {
    const subject = new dist_esm_subject();
    let sourceSubscription;
    let subscriberCount = 0;
    return new dist_esm_observable(observer => {
        // Init source subscription lazily
        if (!sourceSubscription) {
            sourceSubscription = coldObservable.subscribe(subject);
        }
        // Pipe all events from `subject` into this observable
        const subscription = subject.subscribe(observer);
        subscriberCount++;
        return () => {
            subscriberCount--;
            subscription.unsubscribe();
            // Close source subscription once last subscriber has unsubscribed
            if (subscriberCount === 0) {
                dist_esm_unsubscribe(sourceSubscription);
                sourceSubscription = undefined;
            }
        };
    });
}
/* harmony default export */ const dist_esm_multicast = (multicast);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/scan.js
var scan_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



function scan(accumulator, seed) {
    return (observable) => {
        return new dist_esm_observable(observer => {
            let accumulated;
            let index = 0;
            const scheduler = new AsyncSerialScheduler(observer);
            const subscription = observable.subscribe({
                complete() {
                    scheduler.complete();
                },
                error(error) {
                    scheduler.error(error);
                },
                next(value) {
                    scheduler.schedule((next) => scan_awaiter(this, void 0, void 0, function* () {
                        const prevAcc = index === 0
                            ? (typeof seed === "undefined" ? value : seed)
                            : accumulated;
                        accumulated = yield accumulator(prevAcc, value, index++);
                        next(accumulated);
                    }));
                }
            });
            return () => dist_esm_unsubscribe(subscription);
        });
    };
}
/* harmony default export */ const dist_esm_scan = (scan);

;// CONCATENATED MODULE: ./node_modules/observable-fns/dist.esm/index.js












/***/ }),

/***/ 467:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.serialize = exports.deserialize = exports.registerSerializer = void 0;
const serializers_1 = __webpack_require__(381);
let registeredSerializer = serializers_1.DefaultSerializer;
function registerSerializer(serializer) {
    registeredSerializer = serializers_1.extendSerializer(registeredSerializer, serializer);
}
exports.registerSerializer = registerSerializer;
function deserialize(message) {
    return registeredSerializer.deserialize(message);
}
exports.deserialize = deserialize;
function serialize(input) {
    return registeredSerializer.serialize(input);
}
exports.serialize = serialize;


/***/ }),

/***/ 734:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Transfer = exports.DefaultSerializer = exports.expose = exports.registerSerializer = void 0;
var common_1 = __webpack_require__(467);
Object.defineProperty(exports, "registerSerializer", ({ enumerable: true, get: function () { return common_1.registerSerializer; } }));
__exportStar(__webpack_require__(63), exports);
var index_1 = __webpack_require__(934);
Object.defineProperty(exports, "expose", ({ enumerable: true, get: function () { return index_1.expose; } }));
var serializers_1 = __webpack_require__(381);
Object.defineProperty(exports, "DefaultSerializer", ({ enumerable: true, get: function () { return serializers_1.DefaultSerializer; } }));
var transferable_1 = __webpack_require__(180);
Object.defineProperty(exports, "Transfer", ({ enumerable: true, get: function () { return transferable_1.Transfer; } }));


/***/ }),

/***/ 211:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// Source: <https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/builtins/bundle-url.js>
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getBundleURL = exports.getBaseURL = void 0;
let bundleURL;
function getBundleURLCached() {
    if (!bundleURL) {
        bundleURL = getBundleURL();
    }
    return bundleURL;
}
exports.getBundleURL = getBundleURLCached;
function getBundleURL() {
    // Attempt to find the URL of the current script and use that as the base URL
    try {
        throw new Error;
    }
    catch (err) {
        const matches = ("" + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);
        if (matches) {
            return getBaseURL(matches[0]);
        }
    }
    return "/";
}
function getBaseURL(url) {
    return ("" + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)?\/[^/]+(?:\?.*)?$/, '$1') + '/';
}
exports.getBaseURL = getBaseURL;


/***/ }),

/***/ 390:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

// tslint:disable max-classes-per-file
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isWorkerRuntime = exports.getWorkerImplementation = exports.defaultPoolSize = void 0;
const get_bundle_url_browser_1 = __webpack_require__(211);
exports.defaultPoolSize = typeof navigator !== "undefined" && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 4;
const isAbsoluteURL = (value) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);
function createSourceBlobURL(code) {
    const blob = new Blob([code], { type: "application/javascript" });
    return URL.createObjectURL(blob);
}
function selectWorkerImplementation() {
    if (typeof Worker === "undefined") {
        // Might happen on Safari, for instance
        // The idea is to only fail if the constructor is actually used
        return class NoWebWorker {
            constructor() {
                throw Error("No web worker implementation available. You might have tried to spawn a worker within a worker in a browser that doesn't support workers in workers.");
            }
        };
    }
    class WebWorker extends Worker {
        constructor(url, options) {
            var _a, _b;
            if (typeof url === "string" && options && options._baseURL) {
                url = new URL(url, options._baseURL);
            }
            else if (typeof url === "string" && !isAbsoluteURL(url) && get_bundle_url_browser_1.getBundleURL().match(/^file:\/\//i)) {
                url = new URL(url, get_bundle_url_browser_1.getBundleURL().replace(/\/[^\/]+$/, "/"));
                if ((_a = options === null || options === void 0 ? void 0 : options.CORSWorkaround) !== null && _a !== void 0 ? _a : true) {
                    url = createSourceBlobURL(`importScripts(${JSON.stringify(url)});`);
                }
            }
            if (typeof url === "string" && isAbsoluteURL(url)) {
                // Create source code blob loading JS file via `importScripts()`
                // to circumvent worker CORS restrictions
                if ((_b = options === null || options === void 0 ? void 0 : options.CORSWorkaround) !== null && _b !== void 0 ? _b : true) {
                    url = createSourceBlobURL(`importScripts(${JSON.stringify(url)});`);
                }
            }
            super(url, options);
        }
    }
    class BlobWorker extends WebWorker {
        constructor(blob, options) {
            const url = window.URL.createObjectURL(blob);
            super(url, options);
        }
        static fromText(source, options) {
            const blob = new window.Blob([source], { type: "text/javascript" });
            return new BlobWorker(blob, options);
        }
    }
    return {
        blob: BlobWorker,
        default: WebWorker
    };
}
let implementation;
function getWorkerImplementation() {
    if (!implementation) {
        implementation = selectWorkerImplementation();
    }
    return implementation;
}
exports.getWorkerImplementation = getWorkerImplementation;
function isWorkerRuntime() {
    const isWindowContext = typeof self !== "undefined" && typeof Window !== "undefined" && self instanceof Window;
    return typeof self !== "undefined" && self.postMessage && !isWindowContext ? true : false;
}
exports.isWorkerRuntime = isWorkerRuntime;


/***/ }),

/***/ 63:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Worker = exports.BlobWorker = exports.isWorkerRuntime = exports.Thread = exports.spawn = exports.Pool = void 0;
const implementation_1 = __webpack_require__(390);
Object.defineProperty(exports, "isWorkerRuntime", ({ enumerable: true, get: function () { return implementation_1.isWorkerRuntime; } }));
var pool_1 = __webpack_require__(337);
Object.defineProperty(exports, "Pool", ({ enumerable: true, get: function () { return pool_1.Pool; } }));
var spawn_1 = __webpack_require__(264);
Object.defineProperty(exports, "spawn", ({ enumerable: true, get: function () { return spawn_1.spawn; } }));
var thread_1 = __webpack_require__(235);
Object.defineProperty(exports, "Thread", ({ enumerable: true, get: function () { return thread_1.Thread; } }));
/** Separate class to spawn workers from source code blobs or strings. */
exports.BlobWorker = implementation_1.getWorkerImplementation().blob;
/** Worker implementation. Either web worker or a node.js Worker class. */
exports.Worker = implementation_1.getWorkerImplementation().default;


/***/ }),

/***/ 891:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/*
 * This source file contains the code for proxying calls in the master thread to calls in the workers
 * by `.postMessage()`-ing.
 *
 * Keep in mind that this code can make or break the program's performance! Need to optimize more…
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createProxyModule = exports.createProxyFunction = void 0;
const debug_1 = __importDefault(__webpack_require__(227));
const observable_fns_1 = __webpack_require__(49);
const common_1 = __webpack_require__(467);
const observable_promise_1 = __webpack_require__(15);
const transferable_1 = __webpack_require__(180);
const messages_1 = __webpack_require__(229);
const debugMessages = debug_1.default("threads:master:messages");
let nextJobUID = 1;
const dedupe = (array) => Array.from(new Set(array));
const isJobErrorMessage = (data) => data && data.type === messages_1.WorkerMessageType.error;
const isJobResultMessage = (data) => data && data.type === messages_1.WorkerMessageType.result;
const isJobStartMessage = (data) => data && data.type === messages_1.WorkerMessageType.running;
function createObservableForJob(worker, jobUID) {
    return new observable_fns_1.Observable(observer => {
        let asyncType;
        const messageHandler = ((event) => {
            debugMessages("Message from worker:", event.data);
            if (!event.data || event.data.uid !== jobUID)
                return;
            if (isJobStartMessage(event.data)) {
                asyncType = event.data.resultType;
            }
            else if (isJobResultMessage(event.data)) {
                if (asyncType === "promise") {
                    if (typeof event.data.payload !== "undefined") {
                        observer.next(common_1.deserialize(event.data.payload));
                    }
                    observer.complete();
                    worker.removeEventListener("message", messageHandler);
                }
                else {
                    if (event.data.payload) {
                        observer.next(common_1.deserialize(event.data.payload));
                    }
                    if (event.data.complete) {
                        observer.complete();
                        worker.removeEventListener("message", messageHandler);
                    }
                }
            }
            else if (isJobErrorMessage(event.data)) {
                const error = common_1.deserialize(event.data.error);
                if (asyncType === "promise" || !asyncType) {
                    observer.error(error);
                }
                else {
                    observer.error(error);
                }
                worker.removeEventListener("message", messageHandler);
            }
        });
        worker.addEventListener("message", messageHandler);
        return () => {
            if (asyncType === "observable" || !asyncType) {
                const cancelMessage = {
                    type: messages_1.MasterMessageType.cancel,
                    uid: jobUID
                };
                worker.postMessage(cancelMessage);
            }
            worker.removeEventListener("message", messageHandler);
        };
    });
}
function prepareArguments(rawArgs) {
    if (rawArgs.length === 0) {
        // Exit early if possible
        return {
            args: [],
            transferables: []
        };
    }
    const args = [];
    const transferables = [];
    for (const arg of rawArgs) {
        if (transferable_1.isTransferDescriptor(arg)) {
            args.push(common_1.serialize(arg.send));
            transferables.push(...arg.transferables);
        }
        else {
            args.push(common_1.serialize(arg));
        }
    }
    return {
        args,
        transferables: transferables.length === 0 ? transferables : dedupe(transferables)
    };
}
function createProxyFunction(worker, method) {
    return ((...rawArgs) => {
        const uid = nextJobUID++;
        const { args, transferables } = prepareArguments(rawArgs);
        const runMessage = {
            type: messages_1.MasterMessageType.run,
            uid,
            method,
            args
        };
        debugMessages("Sending command to run function to worker:", runMessage);
        try {
            worker.postMessage(runMessage, transferables);
        }
        catch (error) {
            return observable_promise_1.ObservablePromise.from(Promise.reject(error));
        }
        return observable_promise_1.ObservablePromise.from(observable_fns_1.multicast(createObservableForJob(worker, uid)));
    });
}
exports.createProxyFunction = createProxyFunction;
function createProxyModule(worker, methodNames) {
    const proxy = {};
    for (const methodName of methodNames) {
        proxy[methodName] = createProxyFunction(worker, methodName);
    }
    return proxy;
}
exports.createProxyModule = createProxyModule;


/***/ }),

/***/ 774:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PoolEventType = void 0;
/** Pool event type. Specifies the type of each `PoolEvent`. */
var PoolEventType;
(function (PoolEventType) {
    PoolEventType["initialized"] = "initialized";
    PoolEventType["taskCanceled"] = "taskCanceled";
    PoolEventType["taskCompleted"] = "taskCompleted";
    PoolEventType["taskFailed"] = "taskFailed";
    PoolEventType["taskQueued"] = "taskQueued";
    PoolEventType["taskQueueDrained"] = "taskQueueDrained";
    PoolEventType["taskStart"] = "taskStart";
    PoolEventType["terminated"] = "terminated";
})(PoolEventType = exports.PoolEventType || (exports.PoolEventType = {}));


/***/ }),

/***/ 337:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Pool = exports.Thread = exports.PoolEventType = void 0;
const debug_1 = __importDefault(__webpack_require__(227));
const observable_fns_1 = __webpack_require__(49);
const ponyfills_1 = __webpack_require__(531);
const implementation_1 = __webpack_require__(390);
const pool_types_1 = __webpack_require__(774);
Object.defineProperty(exports, "PoolEventType", ({ enumerable: true, get: function () { return pool_types_1.PoolEventType; } }));
const thread_1 = __webpack_require__(235);
Object.defineProperty(exports, "Thread", ({ enumerable: true, get: function () { return thread_1.Thread; } }));
let nextPoolID = 1;
function createArray(size) {
    const array = [];
    for (let index = 0; index < size; index++) {
        array.push(index);
    }
    return array;
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function flatMap(array, mapper) {
    return array.reduce((flattened, element) => [...flattened, ...mapper(element)], []);
}
function slugify(text) {
    return text.replace(/\W/g, " ").trim().replace(/\s+/g, "-");
}
function spawnWorkers(spawnWorker, count) {
    return createArray(count).map(() => ({
        init: spawnWorker(),
        runningTasks: []
    }));
}
class WorkerPool {
    constructor(spawnWorker, optionsOrSize) {
        this.eventSubject = new observable_fns_1.Subject();
        this.initErrors = [];
        this.isClosing = false;
        this.nextTaskID = 1;
        this.taskQueue = [];
        const options = typeof optionsOrSize === "number"
            ? { size: optionsOrSize }
            : optionsOrSize || {};
        const { size = implementation_1.defaultPoolSize } = options;
        this.debug = debug_1.default(`threads:pool:${slugify(options.name || String(nextPoolID++))}`);
        this.options = options;
        this.workers = spawnWorkers(spawnWorker, size);
        this.eventObservable = observable_fns_1.multicast(observable_fns_1.Observable.from(this.eventSubject));
        Promise.all(this.workers.map(worker => worker.init)).then(() => this.eventSubject.next({
            type: pool_types_1.PoolEventType.initialized,
            size: this.workers.length
        }), error => {
            this.debug("Error while initializing pool worker:", error);
            this.eventSubject.error(error);
            this.initErrors.push(error);
        });
    }
    findIdlingWorker() {
        const { concurrency = 1 } = this.options;
        return this.workers.find(worker => worker.runningTasks.length < concurrency);
    }
    runPoolTask(worker, task) {
        return __awaiter(this, void 0, void 0, function* () {
            const workerID = this.workers.indexOf(worker) + 1;
            this.debug(`Running task #${task.id} on worker #${workerID}...`);
            this.eventSubject.next({
                type: pool_types_1.PoolEventType.taskStart,
                taskID: task.id,
                workerID
            });
            try {
                const returnValue = yield task.run(yield worker.init);
                this.debug(`Task #${task.id} completed successfully`);
                this.eventSubject.next({
                    type: pool_types_1.PoolEventType.taskCompleted,
                    returnValue,
                    taskID: task.id,
                    workerID
                });
            }
            catch (error) {
                this.debug(`Task #${task.id} failed`);
                this.eventSubject.next({
                    type: pool_types_1.PoolEventType.taskFailed,
                    taskID: task.id,
                    error,
                    workerID
                });
            }
        });
    }
    run(worker, task) {
        return __awaiter(this, void 0, void 0, function* () {
            const runPromise = (() => __awaiter(this, void 0, void 0, function* () {
                const removeTaskFromWorkersRunningTasks = () => {
                    worker.runningTasks = worker.runningTasks.filter(someRunPromise => someRunPromise !== runPromise);
                };
                // Defer task execution by one tick to give handlers time to subscribe
                yield delay(0);
                try {
                    yield this.runPoolTask(worker, task);
                }
                finally {
                    removeTaskFromWorkersRunningTasks();
                    if (!this.isClosing) {
                        this.scheduleWork();
                    }
                }
            }))();
            worker.runningTasks.push(runPromise);
        });
    }
    scheduleWork() {
        this.debug(`Attempt de-queueing a task in order to run it...`);
        const availableWorker = this.findIdlingWorker();
        if (!availableWorker)
            return;
        const nextTask = this.taskQueue.shift();
        if (!nextTask) {
            this.debug(`Task queue is empty`);
            this.eventSubject.next({ type: pool_types_1.PoolEventType.taskQueueDrained });
            return;
        }
        this.run(availableWorker, nextTask);
    }
    taskCompletion(taskID) {
        return new Promise((resolve, reject) => {
            const eventSubscription = this.events().subscribe(event => {
                if (event.type === pool_types_1.PoolEventType.taskCompleted && event.taskID === taskID) {
                    eventSubscription.unsubscribe();
                    resolve(event.returnValue);
                }
                else if (event.type === pool_types_1.PoolEventType.taskFailed && event.taskID === taskID) {
                    eventSubscription.unsubscribe();
                    reject(event.error);
                }
                else if (event.type === pool_types_1.PoolEventType.terminated) {
                    eventSubscription.unsubscribe();
                    reject(Error("Pool has been terminated before task was run."));
                }
            });
        });
    }
    settled(allowResolvingImmediately = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const getCurrentlyRunningTasks = () => flatMap(this.workers, worker => worker.runningTasks);
            const taskFailures = [];
            const failureSubscription = this.eventObservable.subscribe(event => {
                if (event.type === pool_types_1.PoolEventType.taskFailed) {
                    taskFailures.push(event.error);
                }
            });
            if (this.initErrors.length > 0) {
                return Promise.reject(this.initErrors[0]);
            }
            if (allowResolvingImmediately && this.taskQueue.length === 0) {
                yield ponyfills_1.allSettled(getCurrentlyRunningTasks());
                return taskFailures;
            }
            yield new Promise((resolve, reject) => {
                const subscription = this.eventObservable.subscribe({
                    next(event) {
                        if (event.type === pool_types_1.PoolEventType.taskQueueDrained) {
                            subscription.unsubscribe();
                            resolve(void 0);
                        }
                    },
                    error: reject // make a pool-wide error reject the completed() result promise
                });
            });
            yield ponyfills_1.allSettled(getCurrentlyRunningTasks());
            failureSubscription.unsubscribe();
            return taskFailures;
        });
    }
    completed(allowResolvingImmediately = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const settlementPromise = this.settled(allowResolvingImmediately);
            const earlyExitPromise = new Promise((resolve, reject) => {
                const subscription = this.eventObservable.subscribe({
                    next(event) {
                        if (event.type === pool_types_1.PoolEventType.taskQueueDrained) {
                            subscription.unsubscribe();
                            resolve(settlementPromise);
                        }
                        else if (event.type === pool_types_1.PoolEventType.taskFailed) {
                            subscription.unsubscribe();
                            reject(event.error);
                        }
                    },
                    error: reject // make a pool-wide error reject the completed() result promise
                });
            });
            const errors = yield Promise.race([
                settlementPromise,
                earlyExitPromise
            ]);
            if (errors.length > 0) {
                throw errors[0];
            }
        });
    }
    events() {
        return this.eventObservable;
    }
    queue(taskFunction) {
        const { maxQueuedJobs = Infinity } = this.options;
        if (this.isClosing) {
            throw Error(`Cannot schedule pool tasks after terminate() has been called.`);
        }
        if (this.initErrors.length > 0) {
            throw this.initErrors[0];
        }
        const taskID = this.nextTaskID++;
        const taskCompletion = this.taskCompletion(taskID);
        taskCompletion.catch((error) => {
            // Prevent unhandled rejections here as we assume the user will use
            // `pool.completed()`, `pool.settled()` or `task.catch()` to handle errors
            this.debug(`Task #${taskID} errored:`, error);
        });
        const task = {
            id: taskID,
            run: taskFunction,
            cancel: () => {
                if (this.taskQueue.indexOf(task) === -1)
                    return;
                this.taskQueue = this.taskQueue.filter(someTask => someTask !== task);
                this.eventSubject.next({
                    type: pool_types_1.PoolEventType.taskCanceled,
                    taskID: task.id
                });
            },
            then: taskCompletion.then.bind(taskCompletion)
        };
        if (this.taskQueue.length >= maxQueuedJobs) {
            throw Error("Maximum number of pool tasks queued. Refusing to queue another one.\n" +
                "This usually happens for one of two reasons: We are either at peak " +
                "workload right now or some tasks just won't finish, thus blocking the pool.");
        }
        this.debug(`Queueing task #${task.id}...`);
        this.taskQueue.push(task);
        this.eventSubject.next({
            type: pool_types_1.PoolEventType.taskQueued,
            taskID: task.id
        });
        this.scheduleWork();
        return task;
    }
    terminate(force) {
        return __awaiter(this, void 0, void 0, function* () {
            this.isClosing = true;
            if (!force) {
                yield this.completed(true);
            }
            this.eventSubject.next({
                type: pool_types_1.PoolEventType.terminated,
                remainingQueue: [...this.taskQueue]
            });
            this.eventSubject.complete();
            yield Promise.all(this.workers.map((worker) => __awaiter(this, void 0, void 0, function* () { return thread_1.Thread.terminate(yield worker.init); })));
        });
    }
}
WorkerPool.EventType = pool_types_1.PoolEventType;
/**
 * Thread pool constructor. Creates a new pool and spawns its worker threads.
 */
function PoolConstructor(spawnWorker, optionsOrSize) {
    // The function exists only so we don't need to use `new` to create a pool (we still can, though).
    // If the Pool is a class or not is an implementation detail that should not concern the user.
    return new WorkerPool(spawnWorker, optionsOrSize);
}
PoolConstructor.EventType = pool_types_1.PoolEventType;
/**
 * Thread pool constructor. Creates a new pool and spawns its worker threads.
 */
exports.Pool = PoolConstructor;


/***/ }),

/***/ 264:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.spawn = void 0;
const debug_1 = __importDefault(__webpack_require__(227));
const observable_fns_1 = __webpack_require__(49);
const common_1 = __webpack_require__(467);
const promise_1 = __webpack_require__(104);
const symbols_1 = __webpack_require__(258);
const master_1 = __webpack_require__(356);
const invocation_proxy_1 = __webpack_require__(891);
const debugMessages = debug_1.default("threads:master:messages");
const debugSpawn = debug_1.default("threads:master:spawn");
const debugThreadUtils = debug_1.default("threads:master:thread-utils");
const isInitMessage = (data) => data && data.type === "init";
const isUncaughtErrorMessage = (data) => data && data.type === "uncaughtError";
const initMessageTimeout = typeof process !== "undefined" && process.env.THREADS_WORKER_INIT_TIMEOUT
    ? Number.parseInt(process.env.THREADS_WORKER_INIT_TIMEOUT, 10)
    : 10000;
function withTimeout(promise, timeoutInMs, errorMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let timeoutHandle;
        const timeout = new Promise((resolve, reject) => {
            timeoutHandle = setTimeout(() => reject(Error(errorMessage)), timeoutInMs);
        });
        const result = yield Promise.race([
            promise,
            timeout
        ]);
        clearTimeout(timeoutHandle);
        return result;
    });
}
function receiveInitMessage(worker) {
    return new Promise((resolve, reject) => {
        const messageHandler = ((event) => {
            debugMessages("Message from worker before finishing initialization:", event.data);
            if (isInitMessage(event.data)) {
                worker.removeEventListener("message", messageHandler);
                resolve(event.data);
            }
            else if (isUncaughtErrorMessage(event.data)) {
                worker.removeEventListener("message", messageHandler);
                reject(common_1.deserialize(event.data.error));
            }
        });
        worker.addEventListener("message", messageHandler);
    });
}
function createEventObservable(worker, workerTermination) {
    return new observable_fns_1.Observable(observer => {
        const messageHandler = ((messageEvent) => {
            const workerEvent = {
                type: master_1.WorkerEventType.message,
                data: messageEvent.data
            };
            observer.next(workerEvent);
        });
        const rejectionHandler = ((errorEvent) => {
            debugThreadUtils("Unhandled promise rejection event in thread:", errorEvent);
            const workerEvent = {
                type: master_1.WorkerEventType.internalError,
                error: Error(errorEvent.reason)
            };
            observer.next(workerEvent);
        });
        worker.addEventListener("message", messageHandler);
        worker.addEventListener("unhandledrejection", rejectionHandler);
        workerTermination.then(() => {
            const terminationEvent = {
                type: master_1.WorkerEventType.termination
            };
            worker.removeEventListener("message", messageHandler);
            worker.removeEventListener("unhandledrejection", rejectionHandler);
            observer.next(terminationEvent);
            observer.complete();
        });
    });
}
function createTerminator(worker) {
    const [termination, resolver] = promise_1.createPromiseWithResolver();
    const terminate = () => __awaiter(this, void 0, void 0, function* () {
        debugThreadUtils("Terminating worker");
        // Newer versions of worker_threads workers return a promise
        yield worker.terminate();
        resolver();
    });
    return { terminate, termination };
}
function setPrivateThreadProps(raw, worker, workerEvents, terminate) {
    const workerErrors = workerEvents
        .filter(event => event.type === master_1.WorkerEventType.internalError)
        .map(errorEvent => errorEvent.error);
    // tslint:disable-next-line prefer-object-spread
    return Object.assign(raw, {
        [symbols_1.$errors]: workerErrors,
        [symbols_1.$events]: workerEvents,
        [symbols_1.$terminate]: terminate,
        [symbols_1.$worker]: worker
    });
}
/**
 * Spawn a new thread. Takes a fresh worker instance, wraps it in a thin
 * abstraction layer to provide the transparent API and verifies that
 * the worker has initialized successfully.
 *
 * @param worker Instance of `Worker`. Either a web worker, `worker_threads` worker or `tiny-worker` worker.
 * @param [options]
 * @param [options.timeout] Init message timeout. Default: 10000 or set by environment variable.
 */
function spawn(worker, options) {
    return __awaiter(this, void 0, void 0, function* () {
        debugSpawn("Initializing new thread");
        const timeout = options && options.timeout ? options.timeout : initMessageTimeout;
        const initMessage = yield withTimeout(receiveInitMessage(worker), timeout, `Timeout: Did not receive an init message from worker after ${timeout}ms. Make sure the worker calls expose().`);
        const exposed = initMessage.exposed;
        const { termination, terminate } = createTerminator(worker);
        const events = createEventObservable(worker, termination);
        if (exposed.type === "function") {
            const proxy = invocation_proxy_1.createProxyFunction(worker);
            return setPrivateThreadProps(proxy, worker, events, terminate);
        }
        else if (exposed.type === "module") {
            const proxy = invocation_proxy_1.createProxyModule(worker, exposed.methods);
            return setPrivateThreadProps(proxy, worker, events, terminate);
        }
        else {
            const type = exposed.type;
            throw Error(`Worker init message states unexpected type of expose(): ${type}`);
        }
    });
}
exports.spawn = spawn;


/***/ }),

/***/ 235:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Thread = void 0;
const symbols_1 = __webpack_require__(258);
function fail(message) {
    throw Error(message);
}
/** Thread utility functions. Use them to manage or inspect a `spawn()`-ed thread. */
exports.Thread = {
    /** Return an observable that can be used to subscribe to all errors happening in the thread. */
    errors(thread) {
        return thread[symbols_1.$errors] || fail("Error observable not found. Make sure to pass a thread instance as returned by the spawn() promise.");
    },
    /** Return an observable that can be used to subscribe to internal events happening in the thread. Useful for debugging. */
    events(thread) {
        return thread[symbols_1.$events] || fail("Events observable not found. Make sure to pass a thread instance as returned by the spawn() promise.");
    },
    /** Terminate a thread. Remember to terminate every thread when you are done using it. */
    terminate(thread) {
        return thread[symbols_1.$terminate]();
    }
};


/***/ }),

/***/ 15:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ObservablePromise = void 0;
const observable_fns_1 = __webpack_require__(49);
const doNothing = () => undefined;
const returnInput = (input) => input;
const runDeferred = (fn) => Promise.resolve().then(fn);
function fail(error) {
    throw error;
}
function isThenable(thing) {
    return thing && typeof thing.then === "function";
}
/**
 * Creates a hybrid, combining the APIs of an Observable and a Promise.
 *
 * It is used to proxy async process states when we are initially not sure
 * if that async process will yield values once (-> Promise) or multiple
 * times (-> Observable).
 *
 * Note that the observable promise inherits some of the observable's characteristics:
 * The `init` function will be called *once for every time anyone subscribes to it*.
 *
 * If this is undesired, derive a hot observable from it using `makeHot()` and
 * subscribe to that.
 */
class ObservablePromise extends observable_fns_1.Observable {
    constructor(init) {
        super((originalObserver) => {
            // tslint:disable-next-line no-this-assignment
            const self = this;
            const observer = Object.assign(Object.assign({}, originalObserver), { complete() {
                    originalObserver.complete();
                    self.onCompletion();
                }, error(error) {
                    originalObserver.error(error);
                    self.onError(error);
                },
                next(value) {
                    originalObserver.next(value);
                    self.onNext(value);
                } });
            try {
                this.initHasRun = true;
                return init(observer);
            }
            catch (error) {
                observer.error(error);
            }
        });
        this.initHasRun = false;
        this.fulfillmentCallbacks = [];
        this.rejectionCallbacks = [];
        this.firstValueSet = false;
        this.state = "pending";
    }
    onNext(value) {
        if (!this.firstValueSet) {
            this.firstValue = value;
            this.firstValueSet = true;
        }
    }
    onError(error) {
        this.state = "rejected";
        this.rejection = error;
        for (const onRejected of this.rejectionCallbacks) {
            // Promisifying the call to turn errors into unhandled promise rejections
            // instead of them failing sync and cancelling the iteration
            runDeferred(() => onRejected(error));
        }
    }
    onCompletion() {
        this.state = "fulfilled";
        for (const onFulfilled of this.fulfillmentCallbacks) {
            // Promisifying the call to turn errors into unhandled promise rejections
            // instead of them failing sync and cancelling the iteration
            runDeferred(() => onFulfilled(this.firstValue));
        }
    }
    then(onFulfilledRaw, onRejectedRaw) {
        const onFulfilled = onFulfilledRaw || returnInput;
        const onRejected = onRejectedRaw || fail;
        let onRejectedCalled = false;
        return new Promise((resolve, reject) => {
            const rejectionCallback = (error) => {
                if (onRejectedCalled)
                    return;
                onRejectedCalled = true;
                try {
                    resolve(onRejected(error));
                }
                catch (anotherError) {
                    reject(anotherError);
                }
            };
            const fulfillmentCallback = (value) => {
                try {
                    resolve(onFulfilled(value));
                }
                catch (error) {
                    rejectionCallback(error);
                }
            };
            if (!this.initHasRun) {
                this.subscribe({ error: rejectionCallback });
            }
            if (this.state === "fulfilled") {
                return resolve(onFulfilled(this.firstValue));
            }
            if (this.state === "rejected") {
                onRejectedCalled = true;
                return resolve(onRejected(this.rejection));
            }
            this.fulfillmentCallbacks.push(fulfillmentCallback);
            this.rejectionCallbacks.push(rejectionCallback);
        });
    }
    catch(onRejected) {
        return this.then(undefined, onRejected);
    }
    finally(onCompleted) {
        const handler = onCompleted || doNothing;
        return this.then((value) => {
            handler();
            return value;
        }, () => handler());
    }
    static from(thing) {
        if (isThenable(thing)) {
            return new ObservablePromise(observer => {
                const onFulfilled = (value) => {
                    observer.next(value);
                    observer.complete();
                };
                const onRejected = (error) => {
                    observer.error(error);
                };
                thing.then(onFulfilled, onRejected);
            });
        }
        else {
            return super.from(thing);
        }
    }
}
exports.ObservablePromise = ObservablePromise;


/***/ }),

/***/ 531:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.allSettled = void 0;
// Based on <https://github.com/es-shims/Promise.allSettled/blob/master/implementation.js>
function allSettled(values) {
    return Promise.all(values.map(item => {
        const onFulfill = (value) => {
            return { status: 'fulfilled', value };
        };
        const onReject = (reason) => {
            return { status: 'rejected', reason };
        };
        const itemPromise = Promise.resolve(item);
        try {
            return itemPromise.then(onFulfill, onReject);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }));
}
exports.allSettled = allSettled;


/***/ }),

/***/ 104:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createPromiseWithResolver = void 0;
const doNothing = () => undefined;
/**
 * Creates a new promise and exposes its resolver function.
 * Use with care!
 */
function createPromiseWithResolver() {
    let alreadyResolved = false;
    let resolvedTo;
    let resolver = doNothing;
    const promise = new Promise(resolve => {
        if (alreadyResolved) {
            resolve(resolvedTo);
        }
        else {
            resolver = resolve;
        }
    });
    const exposedResolver = (value) => {
        alreadyResolved = true;
        resolvedTo = value;
        resolver(resolvedTo);
    };
    return [promise, exposedResolver];
}
exports.createPromiseWithResolver = createPromiseWithResolver;


/***/ }),

/***/ 381:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DefaultSerializer = exports.extendSerializer = void 0;
function extendSerializer(extend, implementation) {
    const fallbackDeserializer = extend.deserialize.bind(extend);
    const fallbackSerializer = extend.serialize.bind(extend);
    return {
        deserialize(message) {
            return implementation.deserialize(message, fallbackDeserializer);
        },
        serialize(input) {
            return implementation.serialize(input, fallbackSerializer);
        }
    };
}
exports.extendSerializer = extendSerializer;
const DefaultErrorSerializer = {
    deserialize(message) {
        return Object.assign(Error(message.message), {
            name: message.name,
            stack: message.stack
        });
    },
    serialize(error) {
        return {
            __error_marker: "$$error",
            message: error.message,
            name: error.name,
            stack: error.stack
        };
    }
};
const isSerializedError = (thing) => thing && typeof thing === "object" && "__error_marker" in thing && thing.__error_marker === "$$error";
exports.DefaultSerializer = {
    deserialize(message) {
        if (isSerializedError(message)) {
            return DefaultErrorSerializer.deserialize(message);
        }
        else {
            return message;
        }
    },
    serialize(input) {
        if (input instanceof Error) {
            return DefaultErrorSerializer.serialize(input);
        }
        else {
            return input;
        }
    }
};


/***/ }),

/***/ 258:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.$worker = exports.$transferable = exports.$terminate = exports.$events = exports.$errors = void 0;
exports.$errors = Symbol("thread.errors");
exports.$events = Symbol("thread.events");
exports.$terminate = Symbol("thread.terminate");
exports.$transferable = Symbol("thread.transferable");
exports.$worker = Symbol("thread.worker");


/***/ }),

/***/ 180:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Transfer = exports.isTransferDescriptor = void 0;
const symbols_1 = __webpack_require__(258);
function isTransferable(thing) {
    if (!thing || typeof thing !== "object")
        return false;
    // Don't check too thoroughly, since the list of transferable things in JS might grow over time
    return true;
}
function isTransferDescriptor(thing) {
    return thing && typeof thing === "object" && thing[symbols_1.$transferable];
}
exports.isTransferDescriptor = isTransferDescriptor;
function Transfer(payload, transferables) {
    if (!transferables) {
        if (!isTransferable(payload))
            throw Error();
        transferables = [payload];
    }
    return {
        [symbols_1.$transferable]: true,
        send: payload,
        transferables
    };
}
exports.Transfer = Transfer;


/***/ }),

/***/ 356:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/// <reference lib="dom" />
// tslint:disable max-classes-per-file
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerEventType = void 0;
const symbols_1 = __webpack_require__(258);
/** Event as emitted by worker thread. Subscribe to using `Thread.events(thread)`. */
var WorkerEventType;
(function (WorkerEventType) {
    WorkerEventType["internalError"] = "internalError";
    WorkerEventType["message"] = "message";
    WorkerEventType["termination"] = "termination";
})(WorkerEventType = exports.WorkerEventType || (exports.WorkerEventType = {}));


/***/ }),

/***/ 229:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerMessageType = exports.MasterMessageType = void 0;
/////////////////////////////
// Messages sent by master:
var MasterMessageType;
(function (MasterMessageType) {
    MasterMessageType["cancel"] = "cancel";
    MasterMessageType["run"] = "run";
})(MasterMessageType = exports.MasterMessageType || (exports.MasterMessageType = {}));
////////////////////////////
// Messages sent by worker:
var WorkerMessageType;
(function (WorkerMessageType) {
    WorkerMessageType["error"] = "error";
    WorkerMessageType["init"] = "init";
    WorkerMessageType["result"] = "result";
    WorkerMessageType["running"] = "running";
    WorkerMessageType["uncaughtError"] = "uncaughtError";
})(WorkerMessageType = exports.WorkerMessageType || (exports.WorkerMessageType = {}));


/***/ }),

/***/ 398:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/// <reference lib="dom" />
// tslint:disable no-shadowed-variable
Object.defineProperty(exports, "__esModule", ({ value: true }));
const isWorkerRuntime = function isWorkerRuntime() {
    const isWindowContext = typeof self !== "undefined" && typeof Window !== "undefined" && self instanceof Window;
    return typeof self !== "undefined" && self.postMessage && !isWindowContext ? true : false;
};
const postMessageToMaster = function postMessageToMaster(data, transferList) {
    self.postMessage(data, transferList);
};
const subscribeToMasterMessages = function subscribeToMasterMessages(onMessage) {
    const messageHandler = (messageEvent) => {
        onMessage(messageEvent.data);
    };
    const unsubscribe = () => {
        self.removeEventListener("message", messageHandler);
    };
    self.addEventListener("message", messageHandler);
    return unsubscribe;
};
exports["default"] = {
    isWorkerRuntime,
    postMessageToMaster,
    subscribeToMasterMessages
};


/***/ }),

/***/ 934:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.expose = exports.isWorkerRuntime = exports.Transfer = exports.registerSerializer = void 0;
const is_observable_1 = __importDefault(__webpack_require__(898));
const common_1 = __webpack_require__(467);
const transferable_1 = __webpack_require__(180);
const messages_1 = __webpack_require__(229);
const implementation_1 = __importDefault(__webpack_require__(398));
var common_2 = __webpack_require__(467);
Object.defineProperty(exports, "registerSerializer", ({ enumerable: true, get: function () { return common_2.registerSerializer; } }));
var transferable_2 = __webpack_require__(180);
Object.defineProperty(exports, "Transfer", ({ enumerable: true, get: function () { return transferable_2.Transfer; } }));
/** Returns `true` if this code is currently running in a worker. */
exports.isWorkerRuntime = implementation_1.default.isWorkerRuntime;
let exposeCalled = false;
const activeSubscriptions = new Map();
const isMasterJobCancelMessage = (thing) => thing && thing.type === messages_1.MasterMessageType.cancel;
const isMasterJobRunMessage = (thing) => thing && thing.type === messages_1.MasterMessageType.run;
/**
 * There are issues with `is-observable` not recognizing zen-observable's instances.
 * We are using `observable-fns`, but it's based on zen-observable, too.
 */
const isObservable = (thing) => is_observable_1.default(thing) || isZenObservable(thing);
function isZenObservable(thing) {
    return thing && typeof thing === "object" && typeof thing.subscribe === "function";
}
function deconstructTransfer(thing) {
    return transferable_1.isTransferDescriptor(thing)
        ? { payload: thing.send, transferables: thing.transferables }
        : { payload: thing, transferables: undefined };
}
function postFunctionInitMessage() {
    const initMessage = {
        type: messages_1.WorkerMessageType.init,
        exposed: {
            type: "function"
        }
    };
    implementation_1.default.postMessageToMaster(initMessage);
}
function postModuleInitMessage(methodNames) {
    const initMessage = {
        type: messages_1.WorkerMessageType.init,
        exposed: {
            type: "module",
            methods: methodNames
        }
    };
    implementation_1.default.postMessageToMaster(initMessage);
}
function postJobErrorMessage(uid, rawError) {
    const { payload: error, transferables } = deconstructTransfer(rawError);
    const errorMessage = {
        type: messages_1.WorkerMessageType.error,
        uid,
        error: common_1.serialize(error)
    };
    implementation_1.default.postMessageToMaster(errorMessage, transferables);
}
function postJobResultMessage(uid, completed, resultValue) {
    const { payload, transferables } = deconstructTransfer(resultValue);
    const resultMessage = {
        type: messages_1.WorkerMessageType.result,
        uid,
        complete: completed ? true : undefined,
        payload
    };
    implementation_1.default.postMessageToMaster(resultMessage, transferables);
}
function postJobStartMessage(uid, resultType) {
    const startMessage = {
        type: messages_1.WorkerMessageType.running,
        uid,
        resultType
    };
    implementation_1.default.postMessageToMaster(startMessage);
}
function postUncaughtErrorMessage(error) {
    try {
        const errorMessage = {
            type: messages_1.WorkerMessageType.uncaughtError,
            error: common_1.serialize(error)
        };
        implementation_1.default.postMessageToMaster(errorMessage);
    }
    catch (subError) {
        // tslint:disable-next-line no-console
        console.error("Not reporting uncaught error back to master thread as it " +
            "occured while reporting an uncaught error already." +
            "\nLatest error:", subError, "\nOriginal error:", error);
    }
}
function runFunction(jobUID, fn, args) {
    return __awaiter(this, void 0, void 0, function* () {
        let syncResult;
        try {
            syncResult = fn(...args);
        }
        catch (error) {
            return postJobErrorMessage(jobUID, error);
        }
        const resultType = isObservable(syncResult) ? "observable" : "promise";
        postJobStartMessage(jobUID, resultType);
        if (isObservable(syncResult)) {
            const subscription = syncResult.subscribe(value => postJobResultMessage(jobUID, false, common_1.serialize(value)), error => {
                postJobErrorMessage(jobUID, common_1.serialize(error));
                activeSubscriptions.delete(jobUID);
            }, () => {
                postJobResultMessage(jobUID, true);
                activeSubscriptions.delete(jobUID);
            });
            activeSubscriptions.set(jobUID, subscription);
        }
        else {
            try {
                const result = yield syncResult;
                postJobResultMessage(jobUID, true, common_1.serialize(result));
            }
            catch (error) {
                postJobErrorMessage(jobUID, common_1.serialize(error));
            }
        }
    });
}
/**
 * Expose a function or a module (an object whose values are functions)
 * to the main thread. Must be called exactly once in every worker thread
 * to signal its API to the main thread.
 *
 * @param exposed Function or object whose values are functions
 */
function expose(exposed) {
    if (!implementation_1.default.isWorkerRuntime()) {
        throw Error("expose() called in the master thread.");
    }
    if (exposeCalled) {
        throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");
    }
    exposeCalled = true;
    if (typeof exposed === "function") {
        implementation_1.default.subscribeToMasterMessages(messageData => {
            if (isMasterJobRunMessage(messageData) && !messageData.method) {
                runFunction(messageData.uid, exposed, messageData.args.map(common_1.deserialize));
            }
        });
        postFunctionInitMessage();
    }
    else if (typeof exposed === "object" && exposed) {
        implementation_1.default.subscribeToMasterMessages(messageData => {
            if (isMasterJobRunMessage(messageData) && messageData.method) {
                runFunction(messageData.uid, exposed[messageData.method], messageData.args.map(common_1.deserialize));
            }
        });
        const methodNames = Object.keys(exposed).filter(key => typeof exposed[key] === "function");
        postModuleInitMessage(methodNames);
    }
    else {
        throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${exposed}`);
    }
    implementation_1.default.subscribeToMasterMessages(messageData => {
        if (isMasterJobCancelMessage(messageData)) {
            const jobUID = messageData.uid;
            const subscription = activeSubscriptions.get(jobUID);
            if (subscription) {
                subscription.unsubscribe();
                activeSubscriptions.delete(jobUID);
            }
        }
    });
}
exports.expose = expose;
if (typeof self !== "undefined" && typeof self.addEventListener === "function" && implementation_1.default.isWorkerRuntime()) {
    self.addEventListener("error", event => {
        // Post with some delay, so the master had some time to subscribe to messages
        setTimeout(() => postUncaughtErrorMessage(event.error || event), 250);
    });
    self.addEventListener("unhandledrejection", event => {
        const error = event.reason;
        if (error && typeof error.message === "string") {
            // Post with some delay, so the master had some time to subscribe to messages
            setTimeout(() => postUncaughtErrorMessage(error), 250);
        }
    });
}
if (typeof process !== "undefined" && typeof process.on === "function" && implementation_1.default.isWorkerRuntime()) {
    process.on("uncaughtException", (error) => {
        // Post with some delay, so the master had some time to subscribe to messages
        setTimeout(() => postUncaughtErrorMessage(error), 250);
    });
    process.on("unhandledRejection", (error) => {
        if (error && typeof error.message === "string") {
            // Post with some delay, so the master had some time to subscribe to messages
            setTimeout(() => postUncaughtErrorMessage(error), 250);
        }
    });
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ src_0)
});

;// CONCATENATED MODULE: ./node_modules/higlass-register/src/index.js
window.higlassTracks = window.higlassTracks || {};
window.higlassTracksByType = window.higlassTracksByType || {};

const getRandomName = () => Math.random().toString(36).substring(2, 8);

const register = (trackDef, { force = false } = {}) => {
  // The following is only needed for backward compatibility
  let name = getRandomName();
  while (window.higlassTracks[name]) {
    name = getRandomName();
  }

  trackDef.name = name;
  window.higlassTracks[trackDef.name] = trackDef;
  // backward compatibility: end

  if (window.higlassTracksByType[trackDef.config.type] && !force) {
    // eslint-disable-next-line
    console.warn(
      `A track with the same type (${trackDef.config.type}) was already ` +
      'registered. To override it, set force to true.',
    );
  } else {
    window.higlassTracksByType[trackDef.config.type] = trackDef;
  }
};

/* harmony default export */ const src = (register);

;// CONCATENATED MODULE: ./src/bam-fetcher.js
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var DEBOUNCE_TIME = 200;
var BAMDataFetcher = /*#__PURE__*/function () {
  function BAMDataFetcher(dataConfig, trackOptions, worker, HGC) {
    var _this = this;
    _classCallCheck(this, BAMDataFetcher);
    this.dataConfig = dataConfig;
    this.uid = HGC.libraries.slugid.nice();
    this.worker = worker;
    this.isServerFetcher = !(dataConfig.type && dataConfig.type === 'bam');
    this.prevRequestTime = 0;
    this.toFetch = new Set();
    this.fetchTimeout = null;
    this.initPromise = this.worker.then(function (tileFunctions) {
      if (_this.isServerFetcher) {
        return tileFunctions.serverInit(_this.uid, dataConfig.server, dataConfig.tilesetUid, HGC.services.authHeader).then(function () {
          return _this.worker;
        });
      }
      if (dataConfig.url && !dataConfig.bamUrl) {
        dataConfig["bamUrl"] = dataConfig.url;
      }
      if (!dataConfig.baiUrl) {
        dataConfig["baiUrl"] = dataConfig["bamUrl"] + ".bai";
      }
      return tileFunctions.init(_this.uid, dataConfig.bamUrl, dataConfig.baiUrl, dataConfig.fastaUrl, dataConfig.faiUrl, dataConfig.chromSizesUrl, dataConfig.options, trackOptions).then(function () {
        return _this.worker;
      });
    });
  }
  _createClass(BAMDataFetcher, [{
    key: "tilesetInfo",
    value: function tilesetInfo(callback) {
      var _this2 = this;
      this.worker.then(function (tileFunctions) {
        if (_this2.isServerFetcher) {
          tileFunctions.serverTilesetInfo(_this2.uid).then(callback);
        } else {
          tileFunctions.tilesetInfo(_this2.uid).then(callback);
        }
      });
    }
  }, {
    key: "fetchTilesDebounced",
    value: function fetchTilesDebounced(receivedTiles, tileIds) {
      var _this3 = this;
      var toFetch = this.toFetch;
      var thisZoomLevel = tileIds[0].split('.')[0];
      var toFetchZoomLevel = toFetch.size ? _toConsumableArray(toFetch)[0].split('.')[0] : null;
      if (thisZoomLevel !== toFetchZoomLevel) {
        var _iterator = _createForOfIteratorHelper(this.toFetch),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var tileId = _step.value;
            this.track.fetching["delete"](tileId);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        this.toFetch.clear();
      }
      tileIds.forEach(function (x) {
        return _this3.toFetch.add(x);
      });
      if (this.fetchTimeout) {
        clearTimeout(this.fetchTimeout);
      }
      this.fetchTimeout = setTimeout(function () {
        _this3.sendFetch(receivedTiles, _toConsumableArray(_this3.toFetch));
        _this3.toFetch.clear();
      }, DEBOUNCE_TIME);
    }
  }, {
    key: "sendFetch",
    value: function sendFetch(receivedTiles, tileIds) {
      var _this4 = this;
      this.track.updateLoadingText();
      this.worker.then(function (tileFunctions) {
        if (_this4.isServerFetcher) {
          tileFunctions.serverFetchTilesDebounced(_this4.uid, tileIds).then(receivedTiles);
        } else {
          tileFunctions.fetchTilesDebounced(_this4.uid, tileIds).then(receivedTiles);
        }
      });
    }
  }]);
  return BAMDataFetcher;
}();
/* harmony default export */ const bam_fetcher = (BAMDataFetcher);
// EXTERNAL MODULE: ./node_modules/threads/dist/index.js
var dist = __webpack_require__(734);
;// CONCATENATED MODULE: ./node_modules/threads/index.mjs


const registerSerializer = dist.registerSerializer
const spawn = dist.spawn
const BlobWorker = dist.BlobWorker
const DefaultSerializer = dist.DefaultSerializer
const Pool = dist.Pool
const Thread = dist.Thread
const Transfer = dist.Transfer
const Worker = dist.Worker

;// CONCATENATED MODULE: ./src/bam-utils.js
function bam_utils_typeof(o) { "@babel/helpers - typeof"; return bam_utils_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, bam_utils_typeof(o); }
function bam_utils_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = bam_utils_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = bam_utils_toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function bam_utils_toPropertyKey(arg) { var key = bam_utils_toPrimitive(arg, "string"); return bam_utils_typeof(key) === "symbol" ? key : String(key); }
function bam_utils_toPrimitive(input, hint) { if (bam_utils_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (bam_utils_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function bam_utils_toConsumableArray(arr) { return bam_utils_arrayWithoutHoles(arr) || bam_utils_iterableToArray(arr) || bam_utils_unsupportedIterableToArray(arr) || bam_utils_nonIterableSpread(); }
function bam_utils_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function bam_utils_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return bam_utils_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return bam_utils_arrayLikeToArray(o, minLen); }
function bam_utils_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function bam_utils_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return bam_utils_arrayLikeToArray(arr); }
function bam_utils_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
var PILEUP_COLORS = {
  BG: [0.89, 0.89, 0.89, 1],
  // gray for the read background
  BG2: [0.85, 0.85, 0.85, 1],
  // used as alternating color in the read counter band
  BG_MUTED: [0.92, 0.92, 0.92, 1],
  // coverage background, when it is not exact
  A: [0, 0, 1, 1],
  // blue for A
  C: [1, 0, 0, 1],
  // red for c
  G: [0, 1, 0, 1],
  // green for g
  T: [1, 1, 0, 1],
  // yellow for T
  S: [0, 0, 0, 0.4],
  // lighter grey for soft clipping
  H: [0, 0, 0, 0.5],
  // darker grey for hard clipping
  X: [0, 0, 0, 0.7],
  // black for unknown
  I: [1, 0, 1, 0.5],
  // purple for insertions
  D: [1, 0.5, 0.5, 0.5],
  // pink-ish for deletions
  N: [1, 1, 1, 1],
  LARGE_INSERT_SIZE: [1, 0, 0, 1],
  // Red for read pairs with large insert size
  SMALL_INSERT_SIZE: [0, 0.24, 0.48, 1],
  // Dark blue for read pairs with small insert size
  LL: [0.15, 0.75, 0.75, 1],
  // cyan for Left-Left reads (see https://software.broadinstitute.org/software/igv/interpreting_pair_orientations)
  RR: [0.18, 0.24, 0.8, 1],
  // darker blue for Right-Right reads
  RL: [0, 0.5, 0.02, 1],
  // darker green for Right-Left reads
  WHITE: [1, 1, 1, 1],
  BLACK: [0, 0, 0, 1],
  BLACK_05: [0, 0, 0, 0.5],
  PLUS_STRAND: [0.75, 0.75, 1, 1],
  MINUS_STRAND: [1, 0.75, 0.75, 1],
  MM_M6A_FOR: [0.4, 0.2, 0.6, 1],
  // purple for m6A methylation events
  MM_M6A_REV: [0.4, 0.2, 0.6, 1],
  // purple for m6A methylation events
  MM_M5C_FOR: [1, 0, 0, 1],
  // red for CpG events
  MM_M5C_REV: [1, 0, 0, 1],
  // red for CpG events
  HIGHLIGHTS_CG: [0.95, 0.84, 0.84, 1],
  // CG highlights
  HIGHLIGHTS_A: [0.95, 0.89, 0.71, 1],
  // A highlights
  HIGHLIGHTS_T: [0.95, 0.89, 0.71, 1],
  // T highlights
  HIGHLIGHTS_G: [0.95, 0.84, 0.84, 1],
  // G highlights
  HIGHLIGHTS_C: [0.95, 0.84, 0.84, 1],
  // C highlights
  HIGHLIGHTS_MZEROA: [0.89, 0.84, 0.96, 1],
  // m0A highlights
  INDEX_DHS_BG: [0, 0, 0, 0]
};
var PILEUP_COLOR_IXS = {};
Object.keys(PILEUP_COLORS).map(function (x, i) {
  PILEUP_COLOR_IXS[x] = i;
  return null;
});
function replaceColorIdxs(newColorIdxs) {
  PILEUP_COLOR_IXS = newColorIdxs;
}
var hexToRGBRawTriplet = function hexToRGBRawTriplet(hex) {
  hex = hex.toUpperCase();
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  return "".concat(r, ",").concat(g, ",").concat(b);
};
var indexDHSColors = function indexDHSColors(options) {
  if (!options.indexDHS) return {};
  // console.log(`options ${JSON.stringify(options)}`);
  // console.log(`options.indexDHS.itemRGBMap ${JSON.stringify(options.indexDHS.itemRGBMap)}`);]
  var colorTable = {};
  colorTable['INDEX_DHS_BG'] = [0, 0, 0, 0],
  // Index DHS background default
  Object.entries(options.indexDHS.itemRGBMap).map(function (o) {
    var k = o[0];
    // const v = o[1];
    var v = k.split(',').map(function (d) {
      return parseFloat((parseFloat(d) / 255).toFixed(2));
    });
    colorTable["INDEX_DHS_".concat(k)] = [].concat(bam_utils_toConsumableArray(v), [1.0]);
  });
  // console.log(`colorTable ${JSON.stringify(colorTable)}`);
  return _objectSpread(_objectSpread({}, PILEUP_COLORS), colorTable);
};
var cigarTypeToText = function cigarTypeToText(type) {
  if (type === 'D') {
    return 'Deletion';
  } else if (type === 'S') {
    return 'Soft clipping';
  } else if (type === 'H') {
    return 'Hard clipping';
  } else if (type === 'I') {
    return 'Insertion';
  } else if (type === 'N') {
    return 'Skipped region';
  }
  return type;
};
var parseMD = function parseMD(mdString, useCounts) {
  var currPos = 0;
  var currNum = 0;
  var deletionEncountered = false;
  var bamSeqShift = 0;
  var substitutions = [];
  for (var i = 0; i < mdString.length; i++) {
    if (mdString[i].match(/[0-9]/g)) {
      // a number, keep on going
      currNum = currNum * 10 + +mdString[i];
      deletionEncountered = false;
    } else if (mdString[i] === '^') {
      deletionEncountered = true;
    } else {
      currPos += currNum;
      if (useCounts) {
        substitutions.push({
          length: currNum,
          type: mdString[i]
        });
      } else if (deletionEncountered) {
        // Do nothing if there is a deletion and keep on going.
        // Note that there can be multiple deletions "^ATC"
        // Deletions are visualized using the CIGAR string
        // However, keep track of where in the bam seq we need to pull the variant.
        bamSeqShift -= 1;
      } else {
        substitutions.push({
          pos: currPos,
          base: mdString[i],
          length: 1,
          bamSeqShift: bamSeqShift
        });
      }
      currNum = 0;
      currPos += 1;
    }
  }
  return substitutions;
};

/**
 * Builds an array of all methylations in the segment, represented
 * as offsets from the 5' end of the sequence, using data available
 * in the read's MM and ML tags
 * 
 * ref. https://samtools.github.io/hts-specs/SAMtags.pdf
 * 
 * @param  {String} segment  Current segment
 * @param  {String} seq   Read sequence from bam file.
 * @return {Array}  Methylation offsets.
 */
var getMethylationOffsets = function getMethylationOffsets(segment, seq) {
  var methylationOffsets = [];
  var moSkeleton = {
    "unmodifiedBase": "",
    "code": "",
    "strand": "",
    "offsets": [],
    "probabilities": []
  };
  var getAllIndexes = function getAllIndexes(arr, val) {
    var indices = [],
      i;
    for (var _i = 0; _i < arr.length; ++_i) {
      if (arr[_i] === val) {
        indices.push(_i);
      }
    }
    return indices;
  };

  // include IUPAC degeneracies, to follow SAM specification
  var complementOf = {
    'A': 'T',
    'C': 'G',
    'G': 'C',
    'T': 'A',
    'U': 'A',
    'Y': 'R',
    'R': 'Y',
    'S': 'S',
    'W': 'W',
    'K': 'M',
    'M': 'K',
    'B': 'V',
    'V': 'B',
    'D': 'H',
    'H': 'D',
    'N': 'N'
  };
  // const reverseComplementString = (str) => str.split('').reduce((reversed, character) => complementOf[character] + reversed, '');
  // const reverseString = (str) => str.split('').reduce((reversed, character) => character + reversed, '');

  if (segment.mm && segment.ml) {
    var currentOffsetCount = 0;
    var baseModifications = segment.mm.split(';');
    var baseProbabilities = segment.ml.split(',');
    baseModifications.forEach(function (bm) {
      if (bm.length === 0) return;
      var mo = Object.assign({}, moSkeleton);
      var elems = bm.split(',');
      mo.unmodifiedBase = elems[0].charAt(0);
      mo.strand = elems[0].charAt(1);
      mo.code = elems[0].charAt(2);
      var nOffsets = elems.length - 1;
      var offsets = new Array(nOffsets);
      var probabilities = new Array(nOffsets);
      var baseIndices = segment.strand === '+' ? getAllIndexes(seq, mo.unmodifiedBase) : getAllIndexes(seq, complementOf[mo.unmodifiedBase]);

      //
      // build initial list of raw offsets
      //
      var offset = 0;
      if (segment.strand === '+') {
        for (var i = 1; i < elems.length; ++i) {
          var d = parseInt(elems[i]);
          offset += d;
          var strandedOffset = offset;
          var baseOffset = baseIndices[strandedOffset];
          var baseProbability = baseProbabilities[i - 1 + currentOffsetCount];
          offsets[i - 1] = baseOffset;
          probabilities[i - 1] = baseProbability;
          offset += 1;
        }
      } else {
        for (var _i2 = 1; _i2 < elems.length; ++_i2) {
          var _d = parseInt(elems[_i2]);
          offset += _d;
          var _strandedOffset = baseIndices.length - offset - 1;
          var _baseOffset = baseIndices[_strandedOffset];
          var _baseProbability = baseProbabilities[_i2 - 1 + currentOffsetCount];
          offsets[nOffsets - _i2] = _baseOffset; // reverse
          probabilities[nOffsets - _i2] = _baseProbability;
          offset += 1;
        }
      }

      //
      // modify raw offsets with CIGAR/substitution data
      //
      var offsetIdx = 0;
      var offsetModifier = 0;
      var clipLength = 0;
      var modifiedOffsets = new Array();
      var modifiedProbabilities = new Array();
      var _iterator = bam_utils_createForOfIteratorHelper(segment.substitutions),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var sub = _step.value;
          //
          // if the read starts or ends with soft or hard clipping
          //
          if (sub.type === 'S' || sub.type === 'H') {
            offsetModifier -= sub.length;
            clipLength = sub.length;
          }
          //
          // walk through offsets and include those less than the current substitution position
          //
          else if (sub.type === 'M' || sub.type === '=') {
            while (offsets[offsetIdx] + offsetModifier < sub.pos + sub.length) {
              if (offsets[offsetIdx] + offsetModifier >= sub.pos) {
                modifiedOffsets.push(offsets[offsetIdx] + offsetModifier - clipLength);
                modifiedProbabilities.push(probabilities[offsetIdx]);
              }
              offsetIdx++;
            }
          }
          //
          // filter out mismatches, else modify the offset padding
          //
          else if (sub.type === 'X') {
            if (offsets[offsetIdx] + offsetModifier === sub.pos) {
              offsetIdx++;
            }
          }
          //
          // handle substitution operations
          //
          else if (sub.type === 'D') {
            offsetModifier += sub.length;
          } else if (sub.type === 'I') {
            offsetModifier -= sub.length;
          } else if (sub.type === 'N') {
            offsetModifier += sub.length;
          }
          //
          // if the read ends with soft or hard clipping
          //
          if (sub.type === 'S' || sub.type === 'H') {
            offsetModifier += sub.length;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      ;
      mo.offsets = modifiedOffsets;
      mo.probabilities = modifiedProbabilities;

      // if (mo.unmodifiedBase === 'A') {
      //   console.log(`segment.substitutions ${JSON.stringify(segment.substitutions, null, 2)}`); 
      //   console.log(`${JSON.stringify(actions)}`);
      // }

      methylationOffsets.push(mo);
      currentOffsetCount += nOffsets;
    });
  }
  return methylationOffsets;
};

/**
 * Gets an array of all substitutions in the segment
 * @param  {String} segment  Current segment
 * @param  {String} seq   Read sequence from bam file.
 * @return {Boolean} includeClippingOps  Include soft or hard clipping operations in substitutions output.
 */
var getSubstitutions = function getSubstitutions(segment, seq, includeClippingOps) {
  var substitutions = [];
  var softClippingAtReadStart = null;
  if (segment.cigar) {
    var cigarSubs = parseMD(segment.cigar, true);
    var currPos = 0;
    var _iterator2 = bam_utils_createForOfIteratorHelper(cigarSubs),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var sub = _step2.value;
        if (includeClippingOps && (sub.type === 'S' || sub.type === 'H')) {
          substitutions.push({
            pos: currPos,
            length: sub.length,
            range: [currPos + segment.start, currPos + segment.start + sub.length],
            type: sub.type
          });
          currPos += sub.length;
        } else if (sub.type === 'X') {
          // sequence mismatch, no need to do anything
          substitutions.push({
            pos: currPos,
            length: sub.length,
            range: [currPos + segment.start, currPos + segment.start + sub.length],
            type: 'X'
          });
          currPos += sub.length;
        } else if (sub.type === 'I') {
          substitutions.push({
            pos: currPos,
            length: sub.length,
            range: [currPos + segment.start, currPos + segment.start + sub.length],
            type: 'I'
          });
          // currPos -= sub.length;
        } else if (sub.type === 'D') {
          substitutions.push({
            pos: currPos,
            length: sub.length,
            range: [currPos + segment.start, currPos + segment.start + sub.length],
            type: 'D'
          });
          currPos += sub.length;
        } else if (sub.type === 'N') {
          substitutions.push({
            pos: currPos,
            length: sub.length,
            range: [currPos + segment.start, currPos + segment.start + sub.length],
            type: 'N'
          });
          currPos += sub.length;
        } else if (sub.type === '=') {
          substitutions.push({
            pos: currPos,
            length: sub.length,
            range: [currPos + segment.start, currPos + segment.start + sub.length],
            type: '='
          });
          currPos += sub.length;
        } else if (sub.type === 'M') {
          substitutions.push({
            pos: currPos,
            length: sub.length,
            range: [currPos + segment.start, currPos + segment.start + sub.length],
            type: 'M'
          });
          currPos += sub.length;
        } else {
          // console.log('skipping:', sub.type);
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    var firstSub = cigarSubs[0];
    var lastSub = cigarSubs[cigarSubs.length - 1];

    // Soft clipping can happen at the beginning, at the end or both
    // positions are from the beginning of the read
    if (firstSub.type === 'S') {
      softClippingAtReadStart = firstSub;
      // soft clipping at the beginning
      substitutions.push({
        pos: -firstSub.length,
        type: 'S',
        length: firstSub.length
      });
    }
    // soft clipping at the end
    if (lastSub.type === 'S') {
      substitutions.push({
        pos: segment.to - segment.from,
        length: lastSub.length,
        type: 'S'
      });
    }

    // Hard clipping can happen at the beginning, at the end or both
    // positions are from the beginning of the read
    if (firstSub.type === 'H') {
      substitutions.push({
        pos: -firstSub.length,
        type: 'H',
        length: firstSub.length
      });
    }
    if (lastSub.type === 'H') {
      substitutions.push({
        pos: segment.to - segment.from,
        length: lastSub.length,
        type: 'H'
      });
    }
  }
  if (segment.md) {
    var mdSubstitutions = parseMD(segment.md, false);
    mdSubstitutions.forEach(function (substitution) {
      var posStart = substitution['pos'] + substitution['bamSeqShift'];
      var posEnd = posStart + substitution['length'];
      // When there is soft clipping at the beginning,
      // we need to shift the position where we read the variant from the sequence
      // not necessary when there is hard clipping
      if (softClippingAtReadStart !== null) {
        posStart += softClippingAtReadStart.length;
        posEnd += softClippingAtReadStart.length;
      }
      substitution['variant'] = seq.substring(posStart, posEnd);
      delete substitution['bamSeqShift'];
    });
    substitutions = mdSubstitutions.concat(substitutions);
  }
  return substitutions;
};

/**
 * Checks the track options and determines if mates need to be loaded
 */
var areMatesRequired = function areMatesRequired(trackOptions) {
  return trackOptions.highlightReadsBy.length > 0 || trackOptions.outlineMateOnHover;
};

/**
 * Calculates insert size between read segements
 */
var calculateInsertSize = function calculateInsertSize(segment1, segment2) {
  return segment1.from < segment2.from ? Math.max(0, segment2.from - segment1.to) : Math.max(0, segment1.from - segment2.to);
};
;// CONCATENATED MODULE: ./node_modules/raw-loader/dist/cjs.js!./dist/worker.js
/* harmony default export */ const cjs_js_dist_worker = ("function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }\nfunction _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }\nfunction _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }\nfunction _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function\"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, \"prototype\", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }\nfunction _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }\nfunction _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }\nfunction _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) { return call; } else if (call !== void 0) { throw new TypeError(\"Derived constructors may only return object or undefined\"); } return _assertThisInitialized(self); }\nfunction _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return self; }\nfunction _isNativeReflectConstruct() { if (typeof Reflect === \"undefined\" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === \"function\") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }\nfunction _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }\nfunction _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }\nfunction _nonIterableSpread() { throw new TypeError(\"Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\"); }\nfunction _iterableToArray(iter) { if (typeof Symbol !== \"undefined\" && iter[Symbol.iterator] != null || iter[\"@@iterator\"] != null) return Array.from(iter); }\nfunction _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }\nfunction _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== \"undefined\" && o[Symbol.iterator] || o[\"@@iterator\"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === \"number\") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e99) { throw _e99; }, f: F }; } throw new TypeError(\"Invalid attempt to iterate non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\"); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e100) { didErr = true; err = _e100; }, f: function f() { try { if (!normalCompletion && it[\"return\"] != null) it[\"return\"](); } finally { if (didErr) throw err; } } }; }\nfunction _typeof(o) { \"@babel/helpers - typeof\"; return _typeof = \"function\" == typeof Symbol && \"symbol\" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && \"function\" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? \"symbol\" : typeof o; }, _typeof(o); }\nfunction _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }\nfunction _nonIterableRest() { throw new TypeError(\"Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\"); }\nfunction _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === \"string\") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === \"Object\" && o.constructor) n = o.constructor.name; if (n === \"Map\" || n === \"Set\") return Array.from(o); if (n === \"Arguments\" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }\nfunction _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }\nfunction _iterableToArrayLimit(r, l) { var t = null == r ? null : \"undefined\" != typeof Symbol && r[Symbol.iterator] || r[\"@@iterator\"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t[\"return\"] && (u = t[\"return\"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }\nfunction _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }\nfunction _regeneratorRuntime() { \"use strict\"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = \"function\" == typeof Symbol ? Symbol : {}, a = i.iterator || \"@@iterator\", c = i.asyncIterator || \"@@asyncIterator\", u = i.toStringTag || \"@@toStringTag\"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, \"\"); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, \"_invoke\", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: \"normal\", arg: t.call(e, r) }; } catch (t) { return { type: \"throw\", arg: t }; } } e.wrap = wrap; var h = \"suspendedStart\", l = \"suspendedYield\", f = \"executing\", s = \"completed\", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { [\"next\", \"throw\", \"return\"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if (\"throw\" !== c.type) { var u = c.arg, h = u.value; return h && \"object\" == _typeof(h) && n.call(h, \"__await\") ? e.resolve(h.__await).then(function (t) { invoke(\"next\", t, i, a); }, function (t) { invoke(\"throw\", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke(\"throw\", t, i, a); }); } a(c.arg); } var r; o(this, \"_invoke\", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw new Error(\"Generator is already running\"); if (o === s) { if (\"throw\" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if (\"next\" === n.method) n.sent = n._sent = n.arg;else if (\"throw\" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else \"return\" === n.method && n.abrupt(\"return\", n.arg); o = f; var p = tryCatch(e, r, n); if (\"normal\" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } \"throw\" === p.type && (o = s, n.method = \"throw\", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, \"throw\" === n && e.iterator[\"return\"] && (r.method = \"return\", r.arg = t, maybeInvokeDelegate(e, r), \"throw\" === r.method) || \"return\" !== n && (r.method = \"throw\", r.arg = new TypeError(\"The iterator does not provide a '\" + n + \"' method\")), y; var i = tryCatch(o, e.iterator, r.arg); if (\"throw\" === i.type) return r.method = \"throw\", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, \"return\" !== r.method && (r.method = \"next\", r.arg = t), r.delegate = null, y) : a : (r.method = \"throw\", r.arg = new TypeError(\"iterator result is not an object\"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = \"normal\", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: \"root\" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || \"\" === e) { var r = e[a]; if (r) return r.call(e); if (\"function\" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + \" is not iterable\"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, \"constructor\", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, \"constructor\", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, \"GeneratorFunction\"), e.isGeneratorFunction = function (t) { var e = \"function\" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || \"GeneratorFunction\" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, \"GeneratorFunction\")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, \"Generator\"), define(g, a, function () { return this; }), define(g, \"toString\", function () { return \"[object Generator]\"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = \"next\", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) \"t\" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if (\"throw\" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = \"throw\", a.arg = e, r.next = n, o && (r.method = \"next\", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if (\"root\" === i.tryLoc) return handle(\"end\"); if (i.tryLoc <= this.prev) { var c = n.call(i, \"catchLoc\"), u = n.call(i, \"finallyLoc\"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw new Error(\"try statement without catch or finally\"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, \"finallyLoc\") && this.prev < o.finallyLoc) { var i = o; break; } } i && (\"break\" === t || \"continue\" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = \"next\", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if (\"throw\" === t.type) throw t.arg; return \"break\" === t.type || \"continue\" === t.type ? this.next = t.arg : \"return\" === t.type ? (this.rval = this.arg = t.arg, this.method = \"return\", this.next = \"end\") : \"normal\" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, \"catch\": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if (\"throw\" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw new Error(\"illegal catch attempt\"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, \"next\" === this.method && (this.arg = t), y; } }, e; }\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, \"prototype\", { writable: false }); return Constructor; }\nfunction _toPropertyKey(arg) { var key = _toPrimitive(arg, \"string\"); return _typeof(key) === \"symbol\" ? key : String(key); }\nfunction _toPrimitive(input, hint) { if (_typeof(input) !== \"object\" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || \"default\"); if (_typeof(res) !== \"object\") return res; throw new TypeError(\"@@toPrimitive must return a primitive value.\"); } return (hint === \"string\" ? String : Number)(input); }\nfunction asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }\nfunction _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err); } _next(undefined); }); }; }\nfunction _wrapAsyncGenerator(fn) { return function () { return new _AsyncGenerator(fn.apply(this, arguments)); }; }\nfunction _AsyncGenerator(e) { var r, t; function resume(r, t) { try { var n = e[r](t), o = n.value, u = o instanceof _OverloadYield; Promise.resolve(u ? o.v : o).then(function (t) { if (u) { var i = \"return\" === r ? \"return\" : \"next\"; if (!o.k || t.done) return resume(i, t); t = e[i](t).value; } settle(n.done ? \"return\" : \"normal\", t); }, function (e) { resume(\"throw\", e); }); } catch (e) { settle(\"throw\", e); } } function settle(e, n) { switch (e) { case \"return\": r.resolve({ value: n, done: !0 }); break; case \"throw\": r.reject(n); break; default: r.resolve({ value: n, done: !1 }); } (r = r.next) ? resume(r.key, r.arg) : t = null; } this._invoke = function (e, n) { return new Promise(function (o, u) { var i = { key: e, arg: n, resolve: o, reject: u, next: null }; t ? t = t.next = i : (r = t = i, resume(e, n)); }); }, \"function\" != typeof e[\"return\"] && (this[\"return\"] = void 0); }\n_AsyncGenerator.prototype[\"function\" == typeof Symbol && Symbol.asyncIterator || \"@@asyncIterator\"] = function () { return this; }, _AsyncGenerator.prototype.next = function (e) { return this._invoke(\"next\", e); }, _AsyncGenerator.prototype[\"throw\"] = function (e) { return this._invoke(\"throw\", e); }, _AsyncGenerator.prototype[\"return\"] = function (e) { return this._invoke(\"return\", e); };\nfunction _awaitAsyncGenerator(e) { return new _OverloadYield(e, 0); }\nfunction _asyncGeneratorDelegate(t) { var e = {}, n = !1; function pump(e, r) { return n = !0, r = new Promise(function (n) { n(t[e](r)); }), { done: !1, value: new _OverloadYield(r, 1) }; } return e[\"undefined\" != typeof Symbol && Symbol.iterator || \"@@iterator\"] = function () { return this; }, e.next = function (t) { return n ? (n = !1, t) : pump(\"next\", t); }, \"function\" == typeof t[\"throw\"] && (e[\"throw\"] = function (t) { if (n) throw n = !1, t; return pump(\"throw\", t); }), \"function\" == typeof t[\"return\"] && (e[\"return\"] = function (t) { return n ? (n = !1, t) : pump(\"return\", t); }), e; }\nfunction _OverloadYield(t, e) { this.v = t, this.k = e; }\nfunction _asyncIterator(r) { var n, t, o, e = 2; for (\"undefined\" != typeof Symbol && (t = Symbol.asyncIterator, o = Symbol.iterator); e--;) { if (t && null != (n = r[t])) return n.call(r); if (o && null != (n = r[o])) return new AsyncFromSyncIterator(n.call(r)); t = \"@@asyncIterator\", o = \"@@iterator\"; } throw new TypeError(\"Object is not async iterable\"); }\nfunction AsyncFromSyncIterator(r) { function AsyncFromSyncIteratorContinuation(r) { if (Object(r) !== r) return Promise.reject(new TypeError(r + \" is not an object.\")); var n = r.done; return Promise.resolve(r.value).then(function (r) { return { value: r, done: n }; }); } return AsyncFromSyncIterator = function AsyncFromSyncIterator(r) { this.s = r, this.n = r.next; }, AsyncFromSyncIterator.prototype = { s: null, n: null, next: function next() { return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments)); }, \"return\": function _return(r) { var n = this.s[\"return\"]; return void 0 === n ? Promise.resolve({ value: r, done: !0 }) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments)); }, \"throw\": function _throw(r) { var n = this.s[\"return\"]; return void 0 === n ? Promise.reject(r) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments)); } }, new AsyncFromSyncIterator(r); }\n/*! For license information please see worker.js.LICENSE.txt */\n(function () {\n  var t = {\n      290: function _(t, e, n) {\n        \"use strict\";\n\n        n.d(e, {\n          q5: function q5() {\n            return f;\n          },\n          Ri: function Ri() {\n            return s;\n          },\n          y$: function y$() {\n            return a;\n          }\n        });\n        var r = n(764),\n          i = n(949),\n          o = n(591);\n        function s(_x) {\n          return _s.apply(this, arguments);\n        }\n        function _s() {\n          _s = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(t) {\n            var _e4, _n2, _i2, _s2, _a2, _l, _a3, _r3, _h2, _t2, _e5;\n            return _regeneratorRuntime().wrap(function _callee8$(_context8) {\n              while (1) switch (_context8.prev = _context8.next) {\n                case 0:\n                  _context8.prev = 0;\n                  _n2 = 0, _i2 = 0;\n                  _s2 = [];\n                  _l = 0;\n                case 4:\n                  _r3 = t.subarray(_n2);\n                  if (!(_a2 = new o.Inflate(), (_a3 = _a2, _e4 = _a3.strm), _a2.push(_r3, o.Z_SYNC_FLUSH), _a2.err)) {\n                    _context8.next = 7;\n                    break;\n                  }\n                  throw new Error(_a2.msg);\n                case 7:\n                  _n2 += _e4.next_in, _s2[_i2] = _a2.result, _l += _s2[_i2].length, _i2 += 1;\n                case 8:\n                  if (_e4.avail_in) {\n                    _context8.next = 4;\n                    break;\n                  }\n                case 9:\n                  _h2 = new Uint8Array(_l);\n                  for (_t2 = 0, _e5 = 0; _t2 < _s2.length; _t2++) _h2.set(_s2[_t2], _e5), _e5 += _s2[_t2].length;\n                  return _context8.abrupt(\"return\", r.lW.from(_h2));\n                case 14:\n                  _context8.prev = 14;\n                  _context8.t0 = _context8[\"catch\"](0);\n                  if (!\"\".concat(_context8.t0).match(/incorrect header check/)) {\n                    _context8.next = 18;\n                    break;\n                  }\n                  throw new Error(\"problem decompressing block: incorrect gzip header check\");\n                case 18:\n                  throw _context8.t0;\n                case 19:\n                case \"end\":\n                  return _context8.stop();\n              }\n            }, _callee8, null, [[0, 14]]);\n          }));\n          return _s.apply(this, arguments);\n        }\n        function a(_x2, _x3) {\n          return _a.apply(this, arguments);\n        }\n        function _a() {\n          _a = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(t, e) {\n            var _n3, _i3, _s3, _a4, _l2, _h3, _u3, _f2, c, d, _e6, _r4, _g, p, m, g, _t3, _e7;\n            return _regeneratorRuntime().wrap(function _callee9$(_context9) {\n              while (1) switch (_context9.prev = _context9.next) {\n                case 0:\n                  _context9.prev = 0;\n                  _i3 = e.minv, _s3 = e.maxv;\n                  _a4 = _i3.blockPosition, _l2 = _i3.dataPosition;\n                  _h3 = [], _u3 = [], _f2 = [];\n                  c = 0, d = 0;\n                case 5:\n                  _e6 = t.subarray(_a4 - _i3.blockPosition), _r4 = new o.Inflate();\n                  if (!(_n3 = _r4.strm, _r4.push(_e6, o.Z_SYNC_FLUSH), _r4.err)) {\n                    _context9.next = 8;\n                    break;\n                  }\n                  throw new Error(_r4.msg);\n                case 8:\n                  _g = _r4.result;\n                  _h3.push(_g);\n                  p = _g.length;\n                  _u3.push(_a4), _f2.push(_l2), 1 === _h3.length && _i3.dataPosition && (_h3[0] = _h3[0].subarray(_i3.dataPosition), p = _h3[0].length);\n                  m = _a4;\n                  if (!(_a4 += _n3.next_in, _l2 += p, m >= _s3.blockPosition)) {\n                    _context9.next = 16;\n                    break;\n                  }\n                  _h3[d] = _h3[d].subarray(0, _s3.blockPosition === _i3.blockPosition ? _s3.dataPosition - _i3.dataPosition + 1 : _s3.dataPosition + 1), _u3.push(_a4), _f2.push(_l2), c += _h3[d].length;\n                  return _context9.abrupt(\"break\", 18);\n                case 16:\n                  c += _h3[d].length, d++;\n                case 17:\n                  if (_n3.avail_in) {\n                    _context9.next = 5;\n                    break;\n                  }\n                case 18:\n                  g = new Uint8Array(c);\n                  for (_t3 = 0, _e7 = 0; _t3 < _h3.length; _t3++) g.set(_h3[_t3], _e7), _e7 += _h3[_t3].length;\n                  return _context9.abrupt(\"return\", {\n                    buffer: r.lW.from(g),\n                    cpositions: _u3,\n                    dpositions: _f2\n                  });\n                case 23:\n                  _context9.prev = 23;\n                  _context9.t0 = _context9[\"catch\"](0);\n                  if (!\"\".concat(_context9.t0).match(/incorrect header check/)) {\n                    _context9.next = 27;\n                    break;\n                  }\n                  throw new Error(\"problem decompressing block: incorrect gzip header check\");\n                case 27:\n                  throw _context9.t0;\n                case 28:\n                case \"end\":\n                  return _context9.stop();\n              }\n            }, _callee9, null, [[0, 23]]);\n          }));\n          return _a.apply(this, arguments);\n        }\n        var l = n(720),\n          h = n.n(l);\n        var u = /*#__PURE__*/function () {\n          function u(_ref) {\n            var t = _ref.filehandle,\n              e = _ref.path;\n            _classCallCheck(this, u);\n            if (t) this.filehandle = t;else {\n              if (!e) throw new TypeError(\"either filehandle or path must be defined\");\n              this.filehandle = new i.S9(e);\n            }\n          }\n          _createClass(u, [{\n            key: \"_readLongWithOverflow\",\n            value: function _readLongWithOverflow(t) {\n              var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;\n              var n = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : !0;\n              var r = h().fromBytesLE(t.slice(e, e + 8), n);\n              if (r.greaterThan(Number.MAX_SAFE_INTEGER) || r.lessThan(Number.MIN_SAFE_INTEGER)) throw new TypeError(\"integer overflow\");\n              return r.toNumber();\n            }\n          }, {\n            key: \"_getIndex\",\n            value: function _getIndex() {\n              return this.index || (this.index = this._readIndex()), this.index;\n            }\n          }, {\n            key: \"_readIndex\",\n            value: function () {\n              var _readIndex2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {\n                var t, e, n, i, _r, _e2, _i;\n                return _regeneratorRuntime().wrap(function _callee$(_context) {\n                  while (1) switch (_context.prev = _context.next) {\n                    case 0:\n                      t = r.lW.allocUnsafe(8);\n                      _context.next = 3;\n                      return this.filehandle.read(t, 0, 8, 0);\n                    case 3:\n                      e = this._readLongWithOverflow(t, 0, !0);\n                      if (e) {\n                        _context.next = 6;\n                        break;\n                      }\n                      return _context.abrupt(\"return\", [[0, 0]]);\n                    case 6:\n                      n = new Array(e + 1);\n                      n[0] = [0, 0];\n                      i = 16 * e;\n                      if (!(i > Number.MAX_SAFE_INTEGER)) {\n                        _context.next = 11;\n                        break;\n                      }\n                      throw new TypeError(\"integer overflow\");\n                    case 11:\n                      t = r.lW.allocUnsafe(i);\n                      _context.next = 14;\n                      return this.filehandle.read(t, 0, i, 8);\n                    case 14:\n                      for (_r = 0; _r < e; _r += 1) {\n                        _e2 = this._readLongWithOverflow(t, 16 * _r), _i = this._readLongWithOverflow(t, 16 * _r + 8);\n                        n[_r + 1] = [_e2, _i];\n                      }\n                      return _context.abrupt(\"return\", n);\n                    case 16:\n                    case \"end\":\n                      return _context.stop();\n                  }\n                }, _callee, this);\n              }));\n              function _readIndex() {\n                return _readIndex2.apply(this, arguments);\n              }\n              return _readIndex;\n            }()\n          }, {\n            key: \"getLastBlock\",\n            value: function () {\n              var _getLastBlock = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {\n                var t;\n                return _regeneratorRuntime().wrap(function _callee2$(_context2) {\n                  while (1) switch (_context2.prev = _context2.next) {\n                    case 0:\n                      _context2.next = 2;\n                      return this._getIndex();\n                    case 2:\n                      t = _context2.sent;\n                      if (!t.length) {\n                        _context2.next = 5;\n                        break;\n                      }\n                      return _context2.abrupt(\"return\", t[t.length - 1]);\n                    case 5:\n                    case \"end\":\n                      return _context2.stop();\n                  }\n                }, _callee2, this);\n              }));\n              function getLastBlock() {\n                return _getLastBlock.apply(this, arguments);\n              }\n              return getLastBlock;\n            }()\n          }, {\n            key: \"getRelevantBlocksForRead\",\n            value: function () {\n              var _getRelevantBlocksForRead = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(t, e) {\n                var n, r, i, o, s, a, l, h, _u;\n                return _regeneratorRuntime().wrap(function _callee3$(_context3) {\n                  while (1) switch (_context3.prev = _context3.next) {\n                    case 0:\n                      n = e + t;\n                      if (!(0 === t)) {\n                        _context3.next = 3;\n                        break;\n                      }\n                      return _context3.abrupt(\"return\", []);\n                    case 3:\n                      _context3.next = 5;\n                      return this._getIndex();\n                    case 5:\n                      r = _context3.sent;\n                      i = [];\n                      o = function o(t, n) {\n                        var r = t[1],\n                          i = n ? n[1] : 1 / 0;\n                        return r <= e && i > e ? 0 : r < e ? -1 : 1;\n                      };\n                      s = 0, a = r.length - 1, l = Math.floor(r.length / 2), h = o(r[l], r[l + 1]);\n                      for (; 0 !== h;) h > 0 ? a = l - 1 : h < 0 && (s = l + 1), l = Math.ceil((a - s) / 2) + s, h = o(r[l], r[l + 1]);\n                      i.push(r[l]);\n                      _u = l + 1;\n                      for (; _u < r.length && (i.push(r[_u]), !(r[_u][1] >= n)); _u += 1);\n                      return _context3.abrupt(\"return\", (i[i.length - 1][1] < n && i.push([]), i));\n                    case 14:\n                    case \"end\":\n                      return _context3.stop();\n                  }\n                }, _callee3, this);\n              }));\n              function getRelevantBlocksForRead(_x4, _x5) {\n                return _getRelevantBlocksForRead.apply(this, arguments);\n              }\n              return getRelevantBlocksForRead;\n            }()\n          }]);\n          return u;\n        }();\n        var f = /*#__PURE__*/function () {\n          function f(_ref2) {\n            var t = _ref2.filehandle,\n              e = _ref2.path,\n              n = _ref2.gziFilehandle,\n              r = _ref2.gziPath;\n            _classCallCheck(this, f);\n            if (t) this.filehandle = t;else {\n              if (!e) throw new TypeError(\"either filehandle or path must be defined\");\n              this.filehandle = new i.S9(e);\n            }\n            if (!n && !r && !e) throw new TypeError(\"either gziFilehandle or gziPath must be defined\");\n            this.gzi = new u({\n              filehandle: n,\n              path: n || r || !e ? \"\".concat(e, \".gzi\") : r\n            });\n          }\n          _createClass(f, [{\n            key: \"stat\",\n            value: function () {\n              var _stat = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {\n                var t;\n                return _regeneratorRuntime().wrap(function _callee4$(_context4) {\n                  while (1) switch (_context4.prev = _context4.next) {\n                    case 0:\n                      _context4.next = 2;\n                      return this.filehandle.stat();\n                    case 2:\n                      t = _context4.sent;\n                      _context4.t0 = Object;\n                      _context4.t1 = t;\n                      _context4.next = 7;\n                      return this.getUncompressedFileSize();\n                    case 7:\n                      _context4.t2 = _context4.sent;\n                      _context4.t3 = void 0;\n                      _context4.t4 = void 0;\n                      _context4.t5 = {\n                        size: _context4.t2,\n                        blocks: _context4.t3,\n                        blksize: _context4.t4\n                      };\n                      return _context4.abrupt(\"return\", _context4.t0.assign.call(_context4.t0, _context4.t1, _context4.t5));\n                    case 12:\n                    case \"end\":\n                      return _context4.stop();\n                  }\n                }, _callee4, this);\n              }));\n              function stat() {\n                return _stat.apply(this, arguments);\n              }\n              return stat;\n            }()\n          }, {\n            key: \"getUncompressedFileSize\",\n            value: function () {\n              var _getUncompressedFileSize = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {\n                var _yield$this$gzi$getLa, _yield$this$gzi$getLa2, t, _yield$this$filehandl, e, n, _yield$this$filehandl2, i;\n                return _regeneratorRuntime().wrap(function _callee5$(_context5) {\n                  while (1) switch (_context5.prev = _context5.next) {\n                    case 0:\n                      _context5.next = 2;\n                      return this.gzi.getLastBlock();\n                    case 2:\n                      _yield$this$gzi$getLa = _context5.sent;\n                      _yield$this$gzi$getLa2 = _slicedToArray(_yield$this$gzi$getLa, 2);\n                      t = _yield$this$gzi$getLa2[1];\n                      _context5.next = 7;\n                      return this.filehandle.stat();\n                    case 7:\n                      _yield$this$filehandl = _context5.sent;\n                      e = _yield$this$filehandl.size;\n                      n = r.lW.allocUnsafe(4);\n                      _context5.next = 12;\n                      return this.filehandle.read(n, 0, 4, e - 28 - 4);\n                    case 12:\n                      _yield$this$filehandl2 = _context5.sent;\n                      i = _yield$this$filehandl2.bytesRead;\n                      if (!(4 !== i)) {\n                        _context5.next = 16;\n                        break;\n                      }\n                      throw new Error(\"read error\");\n                    case 16:\n                      return _context5.abrupt(\"return\", t + n.readUInt32LE(0));\n                    case 17:\n                    case \"end\":\n                      return _context5.stop();\n                  }\n                }, _callee5, this);\n              }));\n              function getUncompressedFileSize() {\n                return _getUncompressedFileSize.apply(this, arguments);\n              }\n              return getUncompressedFileSize;\n            }()\n          }, {\n            key: \"_readAndUncompressBlock\",\n            value: function () {\n              var _readAndUncompressBlock2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(t, _ref3, _ref4) {\n                var _ref5, e, _ref6, n, r, i;\n                return _regeneratorRuntime().wrap(function _callee6$(_context6) {\n                  while (1) switch (_context6.prev = _context6.next) {\n                    case 0:\n                      _ref5 = _slicedToArray(_ref3, 1), e = _ref5[0];\n                      _ref6 = _slicedToArray(_ref4, 1), n = _ref6[0];\n                      r = n;\n                      _context6.t0 = r;\n                      if (_context6.t0) {\n                        _context6.next = 8;\n                        break;\n                      }\n                      _context6.next = 7;\n                      return this.filehandle.stat();\n                    case 7:\n                      r = _context6.sent.size;\n                    case 8:\n                      i = r - e;\n                      _context6.next = 11;\n                      return this.filehandle.read(t, 0, i, e);\n                    case 11:\n                      _context6.next = 13;\n                      return s(t.slice(0, i));\n                    case 13:\n                      return _context6.abrupt(\"return\", _context6.sent);\n                    case 14:\n                    case \"end\":\n                      return _context6.stop();\n                  }\n                }, _callee6, this);\n              }));\n              function _readAndUncompressBlock(_x6, _x7, _x8) {\n                return _readAndUncompressBlock2.apply(this, arguments);\n              }\n              return _readAndUncompressBlock;\n            }()\n          }, {\n            key: \"read\",\n            value: function () {\n              var _read = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(t, e, n, i) {\n                var o, s, a, l, _e3, _r2, _o$_e, _h, _u2, _f;\n                return _regeneratorRuntime().wrap(function _callee7$(_context7) {\n                  while (1) switch (_context7.prev = _context7.next) {\n                    case 0:\n                      _context7.next = 2;\n                      return this.gzi.getRelevantBlocksForRead(n, i);\n                    case 2:\n                      o = _context7.sent;\n                      s = r.lW.allocUnsafe(65536);\n                      a = e, l = 0;\n                      _e3 = 0;\n                    case 6:\n                      if (!(_e3 < o.length - 1)) {\n                        _context7.next = 18;\n                        break;\n                      }\n                      _context7.next = 9;\n                      return this._readAndUncompressBlock(s, o[_e3], o[_e3 + 1]);\n                    case 9:\n                      _r2 = _context7.sent;\n                      _o$_e = _slicedToArray(o[_e3], 2);\n                      _h = _o$_e[1];\n                      _u2 = _h >= i ? 0 : i - _h;\n                      _f = Math.min(i + n, _h + _r2.length) - _h;\n                      _u2 >= 0 && _u2 < _r2.length && (_r2.copy(t, a, _u2, _f), a += _f - _u2, l += _f - _u2);\n                    case 15:\n                      _e3 += 1;\n                      _context7.next = 6;\n                      break;\n                    case 18:\n                      return _context7.abrupt(\"return\", {\n                        bytesRead: l,\n                        buffer: t\n                      });\n                    case 19:\n                    case \"end\":\n                      return _context7.stop();\n                  }\n                }, _callee7, this);\n              }));\n              function read(_x9, _x10, _x11, _x12) {\n                return _read.apply(this, arguments);\n              }\n              return read;\n            }()\n          }]);\n          return f;\n        }();\n      },\n      422: function _(t, e, n) {\n        \"use strict\";\n\n        var r = this && this.__importDefault || function (t) {\n          return t && t.__esModule ? t : {\n            \"default\": t\n          };\n        };\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        });\n        var i = n(904),\n          o = r(n(49)),\n          s = r(n(450));\n        var a = /*#__PURE__*/function () {\n          function a(_ref7) {\n            var t = _ref7.fill,\n              e = _ref7.cache;\n            _classCallCheck(this, a);\n            if (\"function\" != typeof t) throw new TypeError(\"must pass a fill function\");\n            if (\"object\" != _typeof(e)) throw new TypeError(\"must pass a cache object\");\n            if (\"function\" != typeof e.get || \"function\" != typeof e.set || \"function\" != typeof e[\"delete\"]) throw new TypeError(\"cache must implement get(key), set(key, val), and and delete(key)\");\n            this.cache = e, this.fillCallback = t;\n          }\n          _createClass(a, [{\n            key: \"evict\",\n            value: function evict(t, e) {\n              this.cache.get(t) === e && this.cache[\"delete\"](t);\n            }\n          }, {\n            key: \"fill\",\n            value: function fill(t, e, n, r) {\n              var _this3 = this;\n              var i = new o[\"default\"](),\n                _a5 = new s[\"default\"]();\n              _a5.addCallback(r);\n              var l = {\n                aborter: i,\n                promise: this.fillCallback(e, i.signal, function (t) {\n                  _a5.callback(t);\n                }),\n                settled: !1,\n                statusReporter: _a5,\n                get aborted() {\n                  return this.aborter.signal.aborted;\n                }\n              };\n              l.aborter.addSignal(n), l.aborter.signal.addEventListener(\"abort\", function () {\n                l.settled || _this3.evict(t, l);\n              }), l.promise.then(function () {\n                l.settled = !0;\n              }, function () {\n                l.settled = !0, _this3.evict(t, l);\n              })[\"catch\"](function (t) {\n                throw console.error(t), t;\n              }), this.cache.set(t, l);\n            }\n          }, {\n            key: \"has\",\n            value: function has(t) {\n              return this.cache.has(t);\n            }\n          }, {\n            key: \"get\",\n            value: function get(t, e, n, r) {\n              if (!n && e instanceof i.AbortSignal) throw new TypeError(\"second get argument appears to be an AbortSignal, perhaps you meant to pass `null` for the fill data?\");\n              var o = this.cache.get(t);\n              return o ? o.aborted && !o.settled ? (this.evict(t, o), this.get(t, e, n, r)) : o.settled ? o.promise : (o.aborter.addSignal(n), o.statusReporter.addCallback(r), a.checkSinglePromise(o.promise, n)) : (this.fill(t, e, n, r), a.checkSinglePromise(this.cache.get(t).promise, n));\n            }\n          }, {\n            key: \"delete\",\n            value: function _delete(t) {\n              var e = this.cache.get(t);\n              e && (e.settled || e.aborter.abort(), this.cache[\"delete\"](t));\n            }\n          }, {\n            key: \"clear\",\n            value: function clear() {\n              var t = this.cache.keys();\n              var e = 0;\n              for (var _n4 = t.next(); !_n4.done; _n4 = t.next()) this[\"delete\"](_n4.value), e += 1;\n              return e;\n            }\n          }], [{\n            key: \"isAbortException\",\n            value: function isAbortException(t) {\n              return \"AbortError\" === t.name || \"ERR_ABORTED\" === t.code || \"AbortError: aborted\" === t.message || \"Error: aborted\" === t.message;\n            }\n          }, {\n            key: \"checkSinglePromise\",\n            value: function checkSinglePromise(t, e) {\n              function n() {\n                if (e && e.aborted) throw Object.assign(new Error(\"aborted\"), {\n                  code: \"ERR_ABORTED\"\n                });\n              }\n              return t.then(function (t) {\n                return n(), t;\n              }, function (t) {\n                throw n(), t;\n              });\n            }\n          }]);\n          return a;\n        }();\n        e[\"default\"] = a;\n      },\n      49: function _(t, e, n) {\n        \"use strict\";\n\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        });\n        var r = n(904);\n        var i = /*#__PURE__*/_createClass(function i() {\n          _classCallCheck(this, i);\n        });\n        e[\"default\"] = /*#__PURE__*/function () {\n          function _class() {\n            _classCallCheck(this, _class);\n            this.signals = new Set(), this.abortController = new r.AbortController();\n          }\n          _createClass(_class, [{\n            key: \"addSignal\",\n            value: function addSignal() {\n              var _this4 = this;\n              var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new i();\n              if (this.signal.aborted) throw new Error(\"cannot add a signal, already aborted!\");\n              this.signals.add(t), t.aborted ? this.handleAborted(t) : \"function\" == typeof t.addEventListener && t.addEventListener(\"abort\", function () {\n                _this4.handleAborted(t);\n              });\n            }\n          }, {\n            key: \"handleAborted\",\n            value: function handleAborted(t) {\n              this.signals[\"delete\"](t), 0 === this.signals.size && this.abortController.abort();\n            }\n          }, {\n            key: \"signal\",\n            get: function get() {\n              return this.abortController.signal;\n            }\n          }, {\n            key: \"abort\",\n            value: function abort() {\n              this.abortController.abort();\n            }\n          }]);\n          return _class;\n        }();\n      },\n      450: function _(t, e) {\n        \"use strict\";\n\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e[\"default\"] = /*#__PURE__*/function () {\n          function _class2() {\n            _classCallCheck(this, _class2);\n            this.callbacks = new Set();\n          }\n          _createClass(_class2, [{\n            key: \"addCallback\",\n            value: function addCallback() {\n              var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};\n              this.callbacks.add(t), t(this.currentMessage);\n            }\n          }, {\n            key: \"callback\",\n            value: function callback(t) {\n              this.currentMessage = t, this.callbacks.forEach(function (e) {\n                e(t);\n              });\n            }\n          }]);\n          return _class2;\n        }();\n      },\n      904: function _(t, e, n) {\n        \"use strict\";\n\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e.AbortSignal = e.AbortController = void 0;\n        var r = n(988);\n        var i = function i() {\n          if (\"undefined\" != typeof self) return self;\n          if (\"undefined\" != typeof window) return window;\n          if (void 0 !== n.g) return n.g;\n          throw new Error(\"unable to locate global object\");\n        };\n        var o = void 0 === i().AbortController ? r.AbortController : i().AbortController;\n        e.AbortController = o;\n        var s = void 0 === i().AbortController ? r.AbortSignal : i().AbortSignal;\n        e.AbortSignal = s;\n      },\n      105: function _(t, e, n) {\n        \"use strict\";\n\n        var r = this && this.__importDefault || function (t) {\n          return t && t.__esModule ? t : {\n            \"default\": t\n          };\n        };\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        });\n        var i = r(n(422));\n        e[\"default\"] = i[\"default\"];\n      },\n      988: function _(t, e) {\n        \"use strict\";\n\n        function n(t, e) {\n          if (!(t instanceof e)) throw new TypeError(\"Cannot call a class as a function\");\n        }\n        function r(t, e) {\n          for (var n = 0; n < e.length; n++) {\n            var r = e[n];\n            r.enumerable = r.enumerable || !1, r.configurable = !0, \"value\" in r && (r.writable = !0), Object.defineProperty(t, r.key, r);\n          }\n        }\n        function i(t, e, n) {\n          return e && r(t.prototype, e), n && r(t, n), Object.defineProperty(t, \"prototype\", {\n            writable: !1\n          }), t;\n        }\n        function o(t) {\n          return o = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {\n            return t.__proto__ || Object.getPrototypeOf(t);\n          }, o(t);\n        }\n        function s(t, e) {\n          return s = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {\n            return t.__proto__ = e, t;\n          }, s(t, e);\n        }\n        function a(t) {\n          if (void 0 === t) throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\");\n          return t;\n        }\n        function l() {\n          return l = \"undefined\" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (t, e, n) {\n            var r = function (t, e) {\n              for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = o(t)););\n              return t;\n            }(t, e);\n            if (r) {\n              var i = Object.getOwnPropertyDescriptor(r, e);\n              return i.get ? i.get.call(arguments.length < 3 ? t : n) : i.value;\n            }\n          }, l.apply(this, arguments);\n        }\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        });\n        var h = function () {\n            function t() {\n              n(this, t), Object.defineProperty(this, \"listeners\", {\n                value: {},\n                writable: !0,\n                configurable: !0\n              });\n            }\n            return i(t, [{\n              key: \"addEventListener\",\n              value: function value(t, e, n) {\n                t in this.listeners || (this.listeners[t] = []), this.listeners[t].push({\n                  callback: e,\n                  options: n\n                });\n              }\n            }, {\n              key: \"removeEventListener\",\n              value: function value(t, e) {\n                if (t in this.listeners) for (var n = this.listeners[t], r = 0, i = n.length; r < i; r++) if (n[r].callback === e) return void n.splice(r, 1);\n              }\n            }, {\n              key: \"dispatchEvent\",\n              value: function value(t) {\n                var _this5 = this;\n                if (t.type in this.listeners) {\n                  var _loop = function _loop() {\n                      i = e[n];\n                      try {\n                        i.callback.call(_this5, t);\n                      } catch (t) {\n                        Promise.resolve().then(function () {\n                          throw t;\n                        });\n                      }\n                      i.options && i.options.once && _this5.removeEventListener(t.type, i.callback);\n                    },\n                    i;\n                  for (var e = this.listeners[t.type].slice(), n = 0, r = e.length; n < r; n++) {\n                    _loop();\n                  }\n                  return !t.defaultPrevented;\n                }\n              }\n            }]), t;\n          }(),\n          u = function (t) {\n            !function (t, e) {\n              if (\"function\" != typeof e && null !== e) throw new TypeError(\"Super expression must either be null or a function\");\n              t.prototype = Object.create(e && e.prototype, {\n                constructor: {\n                  value: t,\n                  writable: !0,\n                  configurable: !0\n                }\n              }), Object.defineProperty(t, \"prototype\", {\n                writable: !1\n              }), e && s(t, e);\n            }(f, t);\n            var e,\n              r,\n              u = (e = f, r = function () {\n                if (\"undefined\" == typeof Reflect || !Reflect.construct) return !1;\n                if (Reflect.construct.sham) return !1;\n                if (\"function\" == typeof Proxy) return !0;\n                try {\n                  return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})), !0;\n                } catch (t) {\n                  return !1;\n                }\n              }(), function () {\n                var t,\n                  n = o(e);\n                if (r) {\n                  var i = o(this).constructor;\n                  t = Reflect.construct(n, arguments, i);\n                } else t = n.apply(this, arguments);\n                return function (t, e) {\n                  if (e && (\"object\" == _typeof(e) || \"function\" == typeof e)) return e;\n                  if (void 0 !== e) throw new TypeError(\"Derived constructors may only return object or undefined\");\n                  return a(t);\n                }(this, t);\n              });\n            function f() {\n              var t;\n              return n(this, f), (t = u.call(this)).listeners || h.call(a(t)), Object.defineProperty(a(t), \"aborted\", {\n                value: !1,\n                writable: !0,\n                configurable: !0\n              }), Object.defineProperty(a(t), \"onabort\", {\n                value: null,\n                writable: !0,\n                configurable: !0\n              }), Object.defineProperty(a(t), \"reason\", {\n                value: void 0,\n                writable: !0,\n                configurable: !0\n              }), t;\n            }\n            return i(f, [{\n              key: \"toString\",\n              value: function value() {\n                return \"[object AbortSignal]\";\n              }\n            }, {\n              key: \"dispatchEvent\",\n              value: function value(t) {\n                \"abort\" === t.type && (this.aborted = !0, \"function\" == typeof this.onabort && this.onabort.call(this, t)), l(o(f.prototype), \"dispatchEvent\", this).call(this, t);\n              }\n            }]), f;\n          }(h),\n          f = function () {\n            function t() {\n              n(this, t), Object.defineProperty(this, \"signal\", {\n                value: new u(),\n                writable: !0,\n                configurable: !0\n              });\n            }\n            return i(t, [{\n              key: \"abort\",\n              value: function value(t) {\n                var e;\n                try {\n                  e = new Event(\"abort\");\n                } catch (t) {\n                  \"undefined\" != typeof document ? document.createEvent ? (e = document.createEvent(\"Event\")).initEvent(\"abort\", !1, !1) : (e = document.createEventObject()).type = \"abort\" : e = {\n                    type: \"abort\",\n                    bubbles: !1,\n                    cancelable: !1\n                  };\n                }\n                var n = t;\n                if (void 0 === n) if (\"undefined\" == typeof document) (n = new Error(\"This operation was aborted\")).name = \"AbortError\";else try {\n                  n = new DOMException(\"signal is aborted without reason\");\n                } catch (t) {\n                  (n = new Error(\"This operation was aborted\")).name = \"AbortError\";\n                }\n                this.signal.reason = n, this.signal.dispatchEvent(e);\n              }\n            }, {\n              key: \"toString\",\n              value: function value() {\n                return \"[object AbortController]\";\n              }\n            }]), t;\n          }();\n        \"undefined\" != typeof Symbol && Symbol.toStringTag && (f.prototype[Symbol.toStringTag] = \"AbortController\", u.prototype[Symbol.toStringTag] = \"AbortSignal\"), e.AbortController = f, e.AbortSignal = u, e.abortableFetch = function (t) {\n          \"function\" == typeof t && (t = {\n            fetch: t\n          });\n          var e = t,\n            n = e.fetch,\n            r = e.Request,\n            i = void 0 === r ? n.Request : r,\n            o = e.AbortController,\n            s = e.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL,\n            a = void 0 !== s && s;\n          if (!function (t) {\n            return t.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL ? (console.log(\"__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL=true is set, will force install polyfill\"), !0) : \"function\" == typeof t.Request && !t.Request.prototype.hasOwnProperty(\"signal\") || !t.AbortController;\n          }({\n            fetch: n,\n            Request: i,\n            AbortController: o,\n            __FORCE_INSTALL_ABORTCONTROLLER_POLYFILL: a\n          })) return {\n            fetch: n,\n            Request: l\n          };\n          var l = i;\n          (l && !l.prototype.hasOwnProperty(\"signal\") || a) && ((l = function l(t, e) {\n            var n;\n            e && e.signal && (n = e.signal, delete e.signal);\n            var r = new i(t, e);\n            return n && Object.defineProperty(r, \"signal\", {\n              writable: !1,\n              enumerable: !1,\n              configurable: !0,\n              value: n\n            }), r;\n          }).prototype = i.prototype);\n          var h = n;\n          return {\n            fetch: function fetch(t, e) {\n              var n = l && l.prototype.isPrototypeOf(t) ? t.signal : e ? e.signal : void 0;\n              if (n) {\n                var r;\n                try {\n                  r = new DOMException(\"Aborted\", \"AbortError\");\n                } catch (t) {\n                  (r = new Error(\"Aborted\")).name = \"AbortError\";\n                }\n                if (n.aborted) return Promise.reject(r);\n                var i = new Promise(function (t, e) {\n                  n.addEventListener(\"abort\", function () {\n                    return e(r);\n                  }, {\n                    once: !0\n                  });\n                });\n                return e && e.signal && delete e.signal, Promise.race([i, h(t, e)]);\n              }\n              return h(t, e);\n            },\n            Request: l\n          };\n        };\n      },\n      803: function _(t, e) {\n        \"use strict\";\n\n        e.eN = e.WI = e.eM = e.bP = void 0;\n        var n = function n(t, e) {\n          var n = 0;\n          var r = Math.min(t.length, e.length);\n          var i = 0;\n          for (; n < r;) i += (t[n] - e[n]) * (t[n] - e[n]), ++n;\n          return Math.sqrt(i);\n        };\n        e.WI = n, e.eN = function (t, e) {\n          var n = 0;\n          var r = Math.min(t.length, e.length);\n          var i = 0,\n            o = 0;\n          for (; n < r;) t[n] !== e[n] ? ++i : 0 !== t[n] && ++o, ++n;\n          return 0 !== i ? 1 - o / (o + 2 * i) : 0;\n        };\n        var r = function r(t, e, n) {\n          var r = 0;\n          var _iterator2 = _createForOfIteratorHelper(t),\n            _step2;\n          try {\n            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {\n              var _i4 = _step2.value;\n              var _iterator3 = _createForOfIteratorHelper(e),\n                _step3;\n              try {\n                for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {\n                  var _t4 = _step3.value;\n                  r += n[_i4][_t4];\n                }\n              } catch (err) {\n                _iterator3.e(err);\n              } finally {\n                _iterator3.f();\n              }\n            }\n          } catch (err) {\n            _iterator2.e(err);\n          } finally {\n            _iterator2.f();\n          }\n          return r / t.length / e.length;\n        };\n        e.bP = r;\n        var i = function i(t, e, n) {\n          var r = t / 2 + e / 2;\n          \"function\" == typeof n && n(r), \"undefined\" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope && postMessage(r);\n        };\n        e.eM = function (_ref8) {\n          var _ref8$data = _ref8.data,\n            t = _ref8$data === void 0 ? [] : _ref8$data,\n            _ref8$key = _ref8.key,\n            e = _ref8$key === void 0 ? \"\" : _ref8$key,\n            _ref8$distance = _ref8.distance,\n            o = _ref8$distance === void 0 ? n : _ref8$distance,\n            _ref8$linkage = _ref8.linkage,\n            s = _ref8$linkage === void 0 ? r : _ref8$linkage,\n            _ref8$onProgress = _ref8.onProgress,\n            a = _ref8$onProgress === void 0 ? null : _ref8$onProgress;\n          e && (t = t.map(function (t) {\n            return t[e];\n          }));\n          var l = t.map(function (e, n) {\n              return i(0, n / (t.length - 1), a), t.map(function (t) {\n                return o(e, t);\n              });\n            }),\n            h = t.map(function (t, e) {\n              return {\n                height: 0,\n                indexes: [Number(e)]\n              };\n            });\n          var u = [];\n          for (var _e8 = 0; _e8 < t.length && (i(1, (_e8 + 1) / t.length, a), u.push(h.map(function (t) {\n            return t.indexes;\n          })), !(_e8 >= t.length - 1)); _e8++) {\n            var _t5 = 1 / 0,\n              _e9 = 0,\n              _n5 = 0;\n            for (var _r5 = 0; _r5 < h.length; _r5++) for (var _i5 = _r5 + 1; _i5 < h.length; _i5++) {\n              var _o = s(h[_r5].indexes, h[_i5].indexes, l);\n              _o < _t5 && (_t5 = _o, _e9 = _r5, _n5 = _i5);\n            }\n            var _r6 = {\n              indexes: [].concat(_toConsumableArray(h[_e9].indexes), _toConsumableArray(h[_n5].indexes)),\n              height: _t5,\n              children: [h[_e9], h[_n5]]\n            };\n            h.splice(Math.max(_e9, _n5), 1), h.splice(Math.min(_e9, _n5), 1), h.push(_r6);\n          }\n          return u = [[]].concat(_toConsumableArray(u.reverse())), {\n            clusters: h[0],\n            distances: l,\n            order: h[0].indexes,\n            clustersGivenK: u\n          };\n        };\n      },\n      805: function _(t, e, n) {\n        \"use strict\";\n\n        n.r(e), n.d(e, {\n          BgzipIndexedFasta: function BgzipIndexedFasta() {\n            return l;\n          },\n          FetchableSmallFasta: function FetchableSmallFasta() {\n            return u;\n          },\n          IndexedFasta: function IndexedFasta() {\n            return a;\n          },\n          parseSmallFasta: function parseSmallFasta() {\n            return h;\n          }\n        });\n        var r = n(949),\n          i = n(290);\n        var o = n(764).lW;\n        function s(t, e) {\n          return t.offset + t.lineBytes * Math.floor(e / t.lineLength) + e % t.lineLength;\n        }\n        var a = /*#__PURE__*/function () {\n          function a(_ref9) {\n            var t = _ref9.fasta,\n              e = _ref9.fai,\n              n = _ref9.path,\n              i = _ref9.faiPath;\n            _classCallCheck(this, a);\n            if (t) this.fasta = t;else {\n              if (!n) throw new Error(\"Need to pass filehandle for fasta or path to localfile\");\n              this.fasta = new r.S9(n);\n            }\n            if (e) this.fai = e;else if (i) this.fai = new r.S9(i);else {\n              if (!n) throw new Error(\"Need to pass filehandle for  or path to localfile\");\n              this.fai = new r.S9(\"\".concat(n, \".fai\"));\n            }\n          }\n          _createClass(a, [{\n            key: \"_getIndexes\",\n            value: function () {\n              var _getIndexes2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11(t) {\n                return _regeneratorRuntime().wrap(function _callee11$(_context11) {\n                  while (1) switch (_context11.prev = _context11.next) {\n                    case 0:\n                      return _context11.abrupt(\"return\", (this.indexes || (this.indexes = function () {\n                        var _ref10 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(t, e) {\n                          var n, r, i, o;\n                          return _regeneratorRuntime().wrap(function _callee10$(_context10) {\n                            while (1) switch (_context10.prev = _context10.next) {\n                              case 0:\n                                _context10.next = 2;\n                                return t.readFile(e);\n                              case 2:\n                                n = _context10.sent;\n                                if (!(!n || !n.length)) {\n                                  _context10.next = 5;\n                                  break;\n                                }\n                                throw new Error(\"No data read from FASTA index (FAI) file\");\n                              case 5:\n                                i = 0;\n                                o = n.toString(\"utf8\").split(/\\r?\\n/).filter(function (t) {\n                                  return /\\S/.test(t);\n                                }).map(function (t) {\n                                  return t.split(\"\\t\");\n                                }).filter(function (t) {\n                                  return \"\" !== t[0];\n                                }).map(function (t) {\n                                  return r && r.name === t[0] || (r = {\n                                    name: t[0],\n                                    id: i\n                                  }, i += 1), {\n                                    id: r.id,\n                                    name: t[0],\n                                    length: +t[1],\n                                    start: 0,\n                                    end: +t[1],\n                                    offset: +t[2],\n                                    lineLength: +t[3],\n                                    lineBytes: +t[4]\n                                  };\n                                });\n                                return _context10.abrupt(\"return\", {\n                                  name: Object.fromEntries(o.map(function (t) {\n                                    return [t.name, t];\n                                  })),\n                                  id: Object.fromEntries(o.map(function (t) {\n                                    return [t.id, t];\n                                  }))\n                                });\n                              case 8:\n                              case \"end\":\n                                return _context10.stop();\n                            }\n                          }, _callee10);\n                        }));\n                        return function (_x14, _x15) {\n                          return _ref10.apply(this, arguments);\n                        };\n                      }()(this.fai, t)), this.indexes));\n                    case 1:\n                    case \"end\":\n                      return _context11.stop();\n                  }\n                }, _callee11, this);\n              }));\n              function _getIndexes(_x13) {\n                return _getIndexes2.apply(this, arguments);\n              }\n              return _getIndexes;\n            }()\n          }, {\n            key: \"getSequenceNames\",\n            value: function () {\n              var _getSequenceNames = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12(t) {\n                return _regeneratorRuntime().wrap(function _callee12$(_context12) {\n                  while (1) switch (_context12.prev = _context12.next) {\n                    case 0:\n                      _context12.t0 = Object;\n                      _context12.next = 3;\n                      return this._getIndexes(t);\n                    case 3:\n                      _context12.t1 = _context12.sent.name;\n                      return _context12.abrupt(\"return\", _context12.t0.keys.call(_context12.t0, _context12.t1));\n                    case 5:\n                    case \"end\":\n                      return _context12.stop();\n                  }\n                }, _callee12, this);\n              }));\n              function getSequenceNames(_x16) {\n                return _getSequenceNames.apply(this, arguments);\n              }\n              return getSequenceNames;\n            }()\n          }, {\n            key: \"getSequenceSizes\",\n            value: function () {\n              var _getSequenceSizes = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(t) {\n                var e, n, r, _t6;\n                return _regeneratorRuntime().wrap(function _callee13$(_context13) {\n                  while (1) switch (_context13.prev = _context13.next) {\n                    case 0:\n                      e = {};\n                      _context13.next = 3;\n                      return this._getIndexes(t);\n                    case 3:\n                      n = _context13.sent;\n                      r = Object.values(n.id);\n                      for (_t6 = 0; _t6 < r.length; _t6 += 1) e[r[_t6].name] = r[_t6].length;\n                      return _context13.abrupt(\"return\", e);\n                    case 7:\n                    case \"end\":\n                      return _context13.stop();\n                  }\n                }, _callee13, this);\n              }));\n              function getSequenceSizes(_x17) {\n                return _getSequenceSizes.apply(this, arguments);\n              }\n              return getSequenceSizes;\n            }()\n          }, {\n            key: \"getSequenceSize\",\n            value: function () {\n              var _getSequenceSize = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14(t, e) {\n                var n;\n                return _regeneratorRuntime().wrap(function _callee14$(_context14) {\n                  while (1) switch (_context14.prev = _context14.next) {\n                    case 0:\n                      _context14.next = 2;\n                      return this._getIndexes(e);\n                    case 2:\n                      _context14.t1 = t;\n                      _context14.t2 = n = _context14.sent.name[_context14.t1];\n                      _context14.t0 = null === _context14.t2;\n                      if (_context14.t0) {\n                        _context14.next = 7;\n                        break;\n                      }\n                      _context14.t0 = void 0 === n;\n                    case 7:\n                      if (!_context14.t0) {\n                        _context14.next = 11;\n                        break;\n                      }\n                      _context14.t3 = void 0;\n                      _context14.next = 12;\n                      break;\n                    case 11:\n                      _context14.t3 = n.length;\n                    case 12:\n                      return _context14.abrupt(\"return\", _context14.t3);\n                    case 13:\n                    case \"end\":\n                      return _context14.stop();\n                  }\n                }, _callee14, this);\n              }));\n              function getSequenceSize(_x18, _x19) {\n                return _getSequenceSize.apply(this, arguments);\n              }\n              return getSequenceSize;\n            }()\n          }, {\n            key: \"hasReferenceSequence\",\n            value: function () {\n              var _hasReferenceSequence = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15(t, e) {\n                return _regeneratorRuntime().wrap(function _callee15$(_context15) {\n                  while (1) switch (_context15.prev = _context15.next) {\n                    case 0:\n                      _context15.next = 2;\n                      return this._getIndexes(e);\n                    case 2:\n                      _context15.t0 = t;\n                      return _context15.abrupt(\"return\", !!_context15.sent.name[_context15.t0]);\n                    case 4:\n                    case \"end\":\n                      return _context15.stop();\n                  }\n                }, _callee15, this);\n              }));\n              function hasReferenceSequence(_x20, _x21) {\n                return _hasReferenceSequence.apply(this, arguments);\n              }\n              return hasReferenceSequence;\n            }()\n          }, {\n            key: \"getResiduesById\",\n            value: function () {\n              var _getResiduesById = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16(t, e, n, r) {\n                var i;\n                return _regeneratorRuntime().wrap(function _callee16$(_context16) {\n                  while (1) switch (_context16.prev = _context16.next) {\n                    case 0:\n                      _context16.next = 2;\n                      return this._getIndexes(r);\n                    case 2:\n                      _context16.t0 = t;\n                      i = _context16.sent.id[_context16.t0];\n                      if (!i) {\n                        _context16.next = 6;\n                        break;\n                      }\n                      return _context16.abrupt(\"return\", this._fetchFromIndexEntry(i, e, n, r));\n                    case 6:\n                    case \"end\":\n                      return _context16.stop();\n                  }\n                }, _callee16, this);\n              }));\n              function getResiduesById(_x22, _x23, _x24, _x25) {\n                return _getResiduesById.apply(this, arguments);\n              }\n              return getResiduesById;\n            }()\n          }, {\n            key: \"getResiduesByName\",\n            value: function () {\n              var _getResiduesByName = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17(t, e, n, r) {\n                var i;\n                return _regeneratorRuntime().wrap(function _callee17$(_context17) {\n                  while (1) switch (_context17.prev = _context17.next) {\n                    case 0:\n                      _context17.next = 2;\n                      return this._getIndexes(r);\n                    case 2:\n                      _context17.t0 = t;\n                      i = _context17.sent.name[_context17.t0];\n                      if (!i) {\n                        _context17.next = 6;\n                        break;\n                      }\n                      return _context17.abrupt(\"return\", this._fetchFromIndexEntry(i, e, n, r));\n                    case 6:\n                    case \"end\":\n                      return _context17.stop();\n                  }\n                }, _callee17, this);\n              }));\n              function getResiduesByName(_x26, _x27, _x28, _x29) {\n                return _getResiduesByName.apply(this, arguments);\n              }\n              return getResiduesByName;\n            }()\n          }, {\n            key: \"getSequence\",\n            value: function () {\n              var _getSequence = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18(t, e, n, r) {\n                return _regeneratorRuntime().wrap(function _callee18$(_context18) {\n                  while (1) switch (_context18.prev = _context18.next) {\n                    case 0:\n                      return _context18.abrupt(\"return\", this.getResiduesByName(t, e, n, r));\n                    case 1:\n                    case \"end\":\n                      return _context18.stop();\n                  }\n                }, _callee18, this);\n              }));\n              function getSequence(_x30, _x31, _x32, _x33) {\n                return _getSequence.apply(this, arguments);\n              }\n              return getSequence;\n            }()\n          }, {\n            key: \"_fetchFromIndexEntry\",\n            value: function () {\n              var _fetchFromIndexEntry2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19(t) {\n                var e,\n                  n,\n                  r,\n                  i,\n                  _a6,\n                  l,\n                  h,\n                  _args19 = arguments;\n                return _regeneratorRuntime().wrap(function _callee19$(_context19) {\n                  while (1) switch (_context19.prev = _context19.next) {\n                    case 0:\n                      e = _args19.length > 1 && _args19[1] !== undefined ? _args19[1] : 0;\n                      n = _args19.length > 2 ? _args19[2] : undefined;\n                      r = _args19.length > 3 ? _args19[3] : undefined;\n                      i = n;\n                      if (!(e < 0)) {\n                        _context19.next = 6;\n                        break;\n                      }\n                      throw new TypeError(\"regionStart cannot be less than 0\");\n                    case 6:\n                      if (!((void 0 === i || i > t.length) && (i = t.length), e >= i)) {\n                        _context19.next = 8;\n                        break;\n                      }\n                      return _context19.abrupt(\"return\", \"\");\n                    case 8:\n                      _a6 = s(t, e), l = s(t, i) - _a6, h = o.allocUnsafe(l);\n                      _context19.next = 11;\n                      return this.fasta.read(h, 0, l, _a6, r);\n                    case 11:\n                      return _context19.abrupt(\"return\", h.toString(\"utf8\").replace(/\\s+/g, \"\"));\n                    case 12:\n                    case \"end\":\n                      return _context19.stop();\n                  }\n                }, _callee19, this);\n              }));\n              function _fetchFromIndexEntry(_x34) {\n                return _fetchFromIndexEntry2.apply(this, arguments);\n              }\n              return _fetchFromIndexEntry;\n            }()\n          }]);\n          return a;\n        }();\n        var l = /*#__PURE__*/function (_a7) {\n          _inherits(l, _a7);\n          var _super = _createSuper(l);\n          function l(_ref11) {\n            var _this6;\n            var t = _ref11.fasta,\n              e = _ref11.path,\n              n = _ref11.fai,\n              r = _ref11.faiPath,\n              o = _ref11.gzi,\n              s = _ref11.gziPath;\n            _classCallCheck(this, l);\n            _this6 = _super.call(this, {\n              fasta: t,\n              path: e,\n              fai: n,\n              faiPath: r\n            }), t && o ? _this6.fasta = new i.q5({\n              filehandle: t,\n              gziFilehandle: o\n            }) : e && s && (_this6.fasta = new i.q5({\n              path: e,\n              gziPath: s\n            }));\n            return _this6;\n          }\n          return _createClass(l);\n        }(a);\n        function h(t) {\n          return t.split(\">\").filter(function (t) {\n            return /\\S/.test(t);\n          }).map(function (t) {\n            var _t$split = t.split(\"\\n\"),\n              _t$split2 = _toArray(_t$split),\n              e = _t$split2[0],\n              n = _t$split2.slice(1),\n              _e$split = e.split(\" \"),\n              _e$split2 = _toArray(_e$split),\n              r = _e$split2[0],\n              i = _e$split2.slice(1),\n              o = n.join(\"\").replace(/\\s/g, \"\");\n            return {\n              id: r,\n              description: i.join(\" \"),\n              sequence: o\n            };\n          });\n        }\n        var u = /*#__PURE__*/function () {\n          function u(_ref12) {\n            var t = _ref12.fasta,\n              e = _ref12.path;\n            _classCallCheck(this, u);\n            if (t) this.fasta = t;else {\n              if (!e) throw new Error(\"Need to pass fasta or path\");\n              this.fasta = new r.S9(e);\n            }\n            this.data = this.fasta.readFile().then(function (t) {\n              return h(t.toString(\"utf8\"));\n            });\n          }\n          _createClass(u, [{\n            key: \"fetch\",\n            value: function () {\n              var _fetch = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20(t, e, n) {\n                var r, i;\n                return _regeneratorRuntime().wrap(function _callee20$(_context20) {\n                  while (1) switch (_context20.prev = _context20.next) {\n                    case 0:\n                      _context20.next = 2;\n                      return this.data;\n                    case 2:\n                      r = _context20.sent.find(function (e) {\n                        return e.id === t;\n                      });\n                      i = n - e;\n                      if (r) {\n                        _context20.next = 6;\n                        break;\n                      }\n                      throw new Error(\"no sequence with id \".concat(t, \" exists\"));\n                    case 6:\n                      return _context20.abrupt(\"return\", r.sequence.substr(e, i));\n                    case 7:\n                    case \"end\":\n                      return _context20.stop();\n                  }\n                }, _callee20, this);\n              }));\n              function fetch(_x35, _x36, _x37) {\n                return _fetch.apply(this, arguments);\n              }\n              return fetch;\n            }()\n          }, {\n            key: \"getSequenceNames\",\n            value: function () {\n              var _getSequenceNames2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21() {\n                return _regeneratorRuntime().wrap(function _callee21$(_context21) {\n                  while (1) switch (_context21.prev = _context21.next) {\n                    case 0:\n                      _context21.next = 2;\n                      return this.data;\n                    case 2:\n                      return _context21.abrupt(\"return\", _context21.sent.map(function (t) {\n                        return t.id;\n                      }));\n                    case 3:\n                    case \"end\":\n                      return _context21.stop();\n                  }\n                }, _callee21, this);\n              }));\n              function getSequenceNames() {\n                return _getSequenceNames2.apply(this, arguments);\n              }\n              return getSequenceNames;\n            }()\n          }]);\n          return u;\n        }();\n      },\n      742: function _(t, e) {\n        \"use strict\";\n\n        e.byteLength = function (t) {\n          var e = a(t),\n            n = e[0],\n            r = e[1];\n          return 3 * (n + r) / 4 - r;\n        }, e.toByteArray = function (t) {\n          var e,\n            n,\n            o = a(t),\n            s = o[0],\n            l = o[1],\n            h = new i(function (t, e, n) {\n              return 3 * (e + n) / 4 - n;\n            }(0, s, l)),\n            u = 0,\n            f = l > 0 ? s - 4 : s;\n          for (n = 0; n < f; n += 4) e = r[t.charCodeAt(n)] << 18 | r[t.charCodeAt(n + 1)] << 12 | r[t.charCodeAt(n + 2)] << 6 | r[t.charCodeAt(n + 3)], h[u++] = e >> 16 & 255, h[u++] = e >> 8 & 255, h[u++] = 255 & e;\n          return 2 === l && (e = r[t.charCodeAt(n)] << 2 | r[t.charCodeAt(n + 1)] >> 4, h[u++] = 255 & e), 1 === l && (e = r[t.charCodeAt(n)] << 10 | r[t.charCodeAt(n + 1)] << 4 | r[t.charCodeAt(n + 2)] >> 2, h[u++] = e >> 8 & 255, h[u++] = 255 & e), h;\n        }, e.fromByteArray = function (t) {\n          for (var e, r = t.length, i = r % 3, o = [], s = 16383, a = 0, h = r - i; a < h; a += s) o.push(l(t, a, a + s > h ? h : a + s));\n          return 1 === i ? (e = t[r - 1], o.push(n[e >> 2] + n[e << 4 & 63] + \"==\")) : 2 === i && (e = (t[r - 2] << 8) + t[r - 1], o.push(n[e >> 10] + n[e >> 4 & 63] + n[e << 2 & 63] + \"=\")), o.join(\"\");\n        };\n        for (var n = [], r = [], i = \"undefined\" != typeof Uint8Array ? Uint8Array : Array, o = \"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\", s = 0; s < 64; ++s) n[s] = o[s], r[o.charCodeAt(s)] = s;\n        function a(t) {\n          var e = t.length;\n          if (e % 4 > 0) throw new Error(\"Invalid string. Length must be a multiple of 4\");\n          var n = t.indexOf(\"=\");\n          return -1 === n && (n = e), [n, n === e ? 0 : 4 - n % 4];\n        }\n        function l(t, e, r) {\n          for (var i, o, s = [], a = e; a < r; a += 3) i = (t[a] << 16 & 16711680) + (t[a + 1] << 8 & 65280) + (255 & t[a + 2]), s.push(n[(o = i) >> 18 & 63] + n[o >> 12 & 63] + n[o >> 6 & 63] + n[63 & o]);\n          return s.join(\"\");\n        }\n        r[\"-\".charCodeAt(0)] = 62, r[\"_\".charCodeAt(0)] = 63;\n      },\n      764: function _(t, e, n) {\n        \"use strict\";\n\n        var r = n(742),\n          i = n(645),\n          o = \"function\" == typeof Symbol && \"function\" == typeof Symbol[\"for\"] ? Symbol[\"for\"](\"nodejs.util.inspect.custom\") : null;\n        e.lW = l, e.h2 = 50;\n        var s = 2147483647;\n        function a(t) {\n          if (t > s) throw new RangeError('The value \"' + t + '\" is invalid for option \"size\"');\n          var e = new Uint8Array(t);\n          return Object.setPrototypeOf(e, l.prototype), e;\n        }\n        function l(t, e, n) {\n          if (\"number\" == typeof t) {\n            if (\"string\" == typeof e) throw new TypeError('The \"string\" argument must be of type string. Received type number');\n            return f(t);\n          }\n          return h(t, e, n);\n        }\n        function h(t, e, n) {\n          if (\"string\" == typeof t) return function (t, e) {\n            if (\"string\" == typeof e && \"\" !== e || (e = \"utf8\"), !l.isEncoding(e)) throw new TypeError(\"Unknown encoding: \" + e);\n            var n = 0 | p(t, e);\n            var r = a(n);\n            var i = r.write(t, e);\n            return i !== n && (r = r.slice(0, i)), r;\n          }(t, e);\n          if (ArrayBuffer.isView(t)) return function (t) {\n            if (V(t, Uint8Array)) {\n              var _e10 = new Uint8Array(t);\n              return d(_e10.buffer, _e10.byteOffset, _e10.byteLength);\n            }\n            return c(t);\n          }(t);\n          if (null == t) throw new TypeError(\"The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type \" + _typeof(t));\n          if (V(t, ArrayBuffer) || t && V(t.buffer, ArrayBuffer)) return d(t, e, n);\n          if (\"undefined\" != typeof SharedArrayBuffer && (V(t, SharedArrayBuffer) || t && V(t.buffer, SharedArrayBuffer))) return d(t, e, n);\n          if (\"number\" == typeof t) throw new TypeError('The \"value\" argument must not be of type number. Received type number');\n          var r = t.valueOf && t.valueOf();\n          if (null != r && r !== t) return l.from(r, e, n);\n          var i = function (t) {\n            if (l.isBuffer(t)) {\n              var _e11 = 0 | g(t.length),\n                _n6 = a(_e11);\n              return 0 === _n6.length || t.copy(_n6, 0, 0, _e11), _n6;\n            }\n            return void 0 !== t.length ? \"number\" != typeof t.length || Y(t.length) ? a(0) : c(t) : \"Buffer\" === t.type && Array.isArray(t.data) ? c(t.data) : void 0;\n          }(t);\n          if (i) return i;\n          if (\"undefined\" != typeof Symbol && null != Symbol.toPrimitive && \"function\" == typeof t[Symbol.toPrimitive]) return l.from(t[Symbol.toPrimitive](\"string\"), e, n);\n          throw new TypeError(\"The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type \" + _typeof(t));\n        }\n        function u(t) {\n          if (\"number\" != typeof t) throw new TypeError('\"size\" argument must be of type number');\n          if (t < 0) throw new RangeError('The value \"' + t + '\" is invalid for option \"size\"');\n        }\n        function f(t) {\n          return u(t), a(t < 0 ? 0 : 0 | g(t));\n        }\n        function c(t) {\n          var e = t.length < 0 ? 0 : 0 | g(t.length),\n            n = a(e);\n          for (var _r7 = 0; _r7 < e; _r7 += 1) n[_r7] = 255 & t[_r7];\n          return n;\n        }\n        function d(t, e, n) {\n          if (e < 0 || t.byteLength < e) throw new RangeError('\"offset\" is outside of buffer bounds');\n          if (t.byteLength < e + (n || 0)) throw new RangeError('\"length\" is outside of buffer bounds');\n          var r;\n          return r = void 0 === e && void 0 === n ? new Uint8Array(t) : void 0 === n ? new Uint8Array(t, e) : new Uint8Array(t, e, n), Object.setPrototypeOf(r, l.prototype), r;\n        }\n        function g(t) {\n          if (t >= s) throw new RangeError(\"Attempt to allocate Buffer larger than maximum size: 0x\" + s.toString(16) + \" bytes\");\n          return 0 | t;\n        }\n        function p(t, e) {\n          if (l.isBuffer(t)) return t.length;\n          if (ArrayBuffer.isView(t) || V(t, ArrayBuffer)) return t.byteLength;\n          if (\"string\" != typeof t) throw new TypeError('The \"string\" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + _typeof(t));\n          var n = t.length,\n            r = arguments.length > 2 && !0 === arguments[2];\n          if (!r && 0 === n) return 0;\n          var i = !1;\n          for (;;) switch (e) {\n            case \"ascii\":\n            case \"latin1\":\n            case \"binary\":\n              return n;\n            case \"utf8\":\n            case \"utf-8\":\n              return Z(t).length;\n            case \"ucs2\":\n            case \"ucs-2\":\n            case \"utf16le\":\n            case \"utf-16le\":\n              return 2 * n;\n            case \"hex\":\n              return n >>> 1;\n            case \"base64\":\n              return W(t).length;\n            default:\n              if (i) return r ? -1 : Z(t).length;\n              e = (\"\" + e).toLowerCase(), i = !0;\n          }\n        }\n        function m(t, e, n) {\n          var r = !1;\n          if ((void 0 === e || e < 0) && (e = 0), e > this.length) return \"\";\n          if ((void 0 === n || n > this.length) && (n = this.length), n <= 0) return \"\";\n          if ((n >>>= 0) <= (e >>>= 0)) return \"\";\n          for (t || (t = \"utf8\");;) switch (t) {\n            case \"hex\":\n              return B(this, e, n);\n            case \"utf8\":\n            case \"utf-8\":\n              return A(this, e, n);\n            case \"ascii\":\n              return I(this, e, n);\n            case \"latin1\":\n            case \"binary\":\n              return R(this, e, n);\n            case \"base64\":\n              return S(this, e, n);\n            case \"ucs2\":\n            case \"ucs-2\":\n            case \"utf16le\":\n            case \"utf-16le\":\n              return T(this, e, n);\n            default:\n              if (r) throw new TypeError(\"Unknown encoding: \" + t);\n              t = (t + \"\").toLowerCase(), r = !0;\n          }\n        }\n        function y(t, e, n) {\n          var r = t[e];\n          t[e] = t[n], t[n] = r;\n        }\n        function b(t, e, n, r, i) {\n          if (0 === t.length) return -1;\n          if (\"string\" == typeof n ? (r = n, n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648), Y(n = +n) && (n = i ? 0 : t.length - 1), n < 0 && (n = t.length + n), n >= t.length) {\n            if (i) return -1;\n            n = t.length - 1;\n          } else if (n < 0) {\n            if (!i) return -1;\n            n = 0;\n          }\n          if (\"string\" == typeof e && (e = l.from(e, r)), l.isBuffer(e)) return 0 === e.length ? -1 : w(t, e, n, r, i);\n          if (\"number\" == typeof e) return e &= 255, \"function\" == typeof Uint8Array.prototype.indexOf ? i ? Uint8Array.prototype.indexOf.call(t, e, n) : Uint8Array.prototype.lastIndexOf.call(t, e, n) : w(t, [e], n, r, i);\n          throw new TypeError(\"val must be string, number or Buffer\");\n        }\n        function w(t, e, n, r, i) {\n          var o,\n            s = 1,\n            a = t.length,\n            l = e.length;\n          if (void 0 !== r && (\"ucs2\" === (r = String(r).toLowerCase()) || \"ucs-2\" === r || \"utf16le\" === r || \"utf-16le\" === r)) {\n            if (t.length < 2 || e.length < 2) return -1;\n            s = 2, a /= 2, l /= 2, n /= 2;\n          }\n          function h(t, e) {\n            return 1 === s ? t[e] : t.readUInt16BE(e * s);\n          }\n          if (i) {\n            var _r8 = -1;\n            for (o = n; o < a; o++) if (h(t, o) === h(e, -1 === _r8 ? 0 : o - _r8)) {\n              if (-1 === _r8 && (_r8 = o), o - _r8 + 1 === l) return _r8 * s;\n            } else -1 !== _r8 && (o -= o - _r8), _r8 = -1;\n          } else for (n + l > a && (n = a - l), o = n; o >= 0; o--) {\n            var _n7 = !0;\n            for (var _r9 = 0; _r9 < l; _r9++) if (h(t, o + _r9) !== h(e, _r9)) {\n              _n7 = !1;\n              break;\n            }\n            if (_n7) return o;\n          }\n          return -1;\n        }\n        function v(t, e, n, r) {\n          n = Number(n) || 0;\n          var i = t.length - n;\n          r ? (r = Number(r)) > i && (r = i) : r = i;\n          var o = e.length;\n          var s;\n          for (r > o / 2 && (r = o / 2), s = 0; s < r; ++s) {\n            var _r10 = parseInt(e.substr(2 * s, 2), 16);\n            if (Y(_r10)) return s;\n            t[n + s] = _r10;\n          }\n          return s;\n        }\n        function _(t, e, n, r) {\n          return X(Z(e, t.length - n), t, n, r);\n        }\n        function x(t, e, n, r) {\n          return X(function (t) {\n            var e = [];\n            for (var _n8 = 0; _n8 < t.length; ++_n8) e.push(255 & t.charCodeAt(_n8));\n            return e;\n          }(e), t, n, r);\n        }\n        function k(t, e, n, r) {\n          return X(W(e), t, n, r);\n        }\n        function E(t, e, n, r) {\n          return X(function (t, e) {\n            var n, r, i;\n            var o = [];\n            for (var _s4 = 0; _s4 < t.length && !((e -= 2) < 0); ++_s4) n = t.charCodeAt(_s4), r = n >> 8, i = n % 256, o.push(i), o.push(r);\n            return o;\n          }(e, t.length - n), t, n, r);\n        }\n        function S(t, e, n) {\n          return 0 === e && n === t.length ? r.fromByteArray(t) : r.fromByteArray(t.slice(e, n));\n        }\n        function A(t, e, n) {\n          n = Math.min(t.length, n);\n          var r = [];\n          var i = e;\n          for (; i < n;) {\n            var _e12 = t[i];\n            var _o2 = null,\n              _s5 = _e12 > 239 ? 4 : _e12 > 223 ? 3 : _e12 > 191 ? 2 : 1;\n            if (i + _s5 <= n) {\n              var _n9 = void 0,\n                _r11 = void 0,\n                _a8 = void 0,\n                _l3 = void 0;\n              switch (_s5) {\n                case 1:\n                  _e12 < 128 && (_o2 = _e12);\n                  break;\n                case 2:\n                  _n9 = t[i + 1], 128 == (192 & _n9) && (_l3 = (31 & _e12) << 6 | 63 & _n9, _l3 > 127 && (_o2 = _l3));\n                  break;\n                case 3:\n                  _n9 = t[i + 1], _r11 = t[i + 2], 128 == (192 & _n9) && 128 == (192 & _r11) && (_l3 = (15 & _e12) << 12 | (63 & _n9) << 6 | 63 & _r11, _l3 > 2047 && (_l3 < 55296 || _l3 > 57343) && (_o2 = _l3));\n                  break;\n                case 4:\n                  _n9 = t[i + 1], _r11 = t[i + 2], _a8 = t[i + 3], 128 == (192 & _n9) && 128 == (192 & _r11) && 128 == (192 & _a8) && (_l3 = (15 & _e12) << 18 | (63 & _n9) << 12 | (63 & _r11) << 6 | 63 & _a8, _l3 > 65535 && _l3 < 1114112 && (_o2 = _l3));\n              }\n            }\n            null === _o2 ? (_o2 = 65533, _s5 = 1) : _o2 > 65535 && (_o2 -= 65536, r.push(_o2 >>> 10 & 1023 | 55296), _o2 = 56320 | 1023 & _o2), r.push(_o2), i += _s5;\n          }\n          return function (t) {\n            var e = t.length;\n            if (e <= M) return String.fromCharCode.apply(String, t);\n            var n = \"\",\n              r = 0;\n            for (; r < e;) n += String.fromCharCode.apply(String, t.slice(r, r += M));\n            return n;\n          }(r);\n        }\n        l.TYPED_ARRAY_SUPPORT = function () {\n          try {\n            var _t7 = new Uint8Array(1),\n              _e13 = {\n                foo: function foo() {\n                  return 42;\n                }\n              };\n            return Object.setPrototypeOf(_e13, Uint8Array.prototype), Object.setPrototypeOf(_t7, _e13), 42 === _t7.foo();\n          } catch (t) {\n            return !1;\n          }\n        }(), l.TYPED_ARRAY_SUPPORT || \"undefined\" == typeof console || \"function\" != typeof console.error || console.error(\"This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.\"), Object.defineProperty(l.prototype, \"parent\", {\n          enumerable: !0,\n          get: function get() {\n            if (l.isBuffer(this)) return this.buffer;\n          }\n        }), Object.defineProperty(l.prototype, \"offset\", {\n          enumerable: !0,\n          get: function get() {\n            if (l.isBuffer(this)) return this.byteOffset;\n          }\n        }), l.poolSize = 8192, l.from = function (t, e, n) {\n          return h(t, e, n);\n        }, Object.setPrototypeOf(l.prototype, Uint8Array.prototype), Object.setPrototypeOf(l, Uint8Array), l.alloc = function (t, e, n) {\n          return function (t, e, n) {\n            return u(t), t <= 0 ? a(t) : void 0 !== e ? \"string\" == typeof n ? a(t).fill(e, n) : a(t).fill(e) : a(t);\n          }(t, e, n);\n        }, l.allocUnsafe = function (t) {\n          return f(t);\n        }, l.allocUnsafeSlow = function (t) {\n          return f(t);\n        }, l.isBuffer = function (t) {\n          return null != t && !0 === t._isBuffer && t !== l.prototype;\n        }, l.compare = function (t, e) {\n          if (V(t, Uint8Array) && (t = l.from(t, t.offset, t.byteLength)), V(e, Uint8Array) && (e = l.from(e, e.offset, e.byteLength)), !l.isBuffer(t) || !l.isBuffer(e)) throw new TypeError('The \"buf1\", \"buf2\" arguments must be one of type Buffer or Uint8Array');\n          if (t === e) return 0;\n          var n = t.length,\n            r = e.length;\n          for (var _i6 = 0, _o3 = Math.min(n, r); _i6 < _o3; ++_i6) if (t[_i6] !== e[_i6]) {\n            n = t[_i6], r = e[_i6];\n            break;\n          }\n          return n < r ? -1 : r < n ? 1 : 0;\n        }, l.isEncoding = function (t) {\n          switch (String(t).toLowerCase()) {\n            case \"hex\":\n            case \"utf8\":\n            case \"utf-8\":\n            case \"ascii\":\n            case \"latin1\":\n            case \"binary\":\n            case \"base64\":\n            case \"ucs2\":\n            case \"ucs-2\":\n            case \"utf16le\":\n            case \"utf-16le\":\n              return !0;\n            default:\n              return !1;\n          }\n        }, l.concat = function (t, e) {\n          if (!Array.isArray(t)) throw new TypeError('\"list\" argument must be an Array of Buffers');\n          if (0 === t.length) return l.alloc(0);\n          var n;\n          if (void 0 === e) for (e = 0, n = 0; n < t.length; ++n) e += t[n].length;\n          var r = l.allocUnsafe(e);\n          var i = 0;\n          for (n = 0; n < t.length; ++n) {\n            var _e14 = t[n];\n            if (V(_e14, Uint8Array)) i + _e14.length > r.length ? (l.isBuffer(_e14) || (_e14 = l.from(_e14)), _e14.copy(r, i)) : Uint8Array.prototype.set.call(r, _e14, i);else {\n              if (!l.isBuffer(_e14)) throw new TypeError('\"list\" argument must be an Array of Buffers');\n              _e14.copy(r, i);\n            }\n            i += _e14.length;\n          }\n          return r;\n        }, l.byteLength = p, l.prototype._isBuffer = !0, l.prototype.swap16 = function () {\n          var t = this.length;\n          if (t % 2 != 0) throw new RangeError(\"Buffer size must be a multiple of 16-bits\");\n          for (var _e15 = 0; _e15 < t; _e15 += 2) y(this, _e15, _e15 + 1);\n          return this;\n        }, l.prototype.swap32 = function () {\n          var t = this.length;\n          if (t % 4 != 0) throw new RangeError(\"Buffer size must be a multiple of 32-bits\");\n          for (var _e16 = 0; _e16 < t; _e16 += 4) y(this, _e16, _e16 + 3), y(this, _e16 + 1, _e16 + 2);\n          return this;\n        }, l.prototype.swap64 = function () {\n          var t = this.length;\n          if (t % 8 != 0) throw new RangeError(\"Buffer size must be a multiple of 64-bits\");\n          for (var _e17 = 0; _e17 < t; _e17 += 8) y(this, _e17, _e17 + 7), y(this, _e17 + 1, _e17 + 6), y(this, _e17 + 2, _e17 + 5), y(this, _e17 + 3, _e17 + 4);\n          return this;\n        }, l.prototype.toString = function () {\n          var t = this.length;\n          return 0 === t ? \"\" : 0 === arguments.length ? A(this, 0, t) : m.apply(this, arguments);\n        }, l.prototype.toLocaleString = l.prototype.toString, l.prototype.equals = function (t) {\n          if (!l.isBuffer(t)) throw new TypeError(\"Argument must be a Buffer\");\n          return this === t || 0 === l.compare(this, t);\n        }, l.prototype.inspect = function () {\n          var t = \"\";\n          var n = e.h2;\n          return t = this.toString(\"hex\", 0, n).replace(/(.{2})/g, \"$1 \").trim(), this.length > n && (t += \" ... \"), \"<Buffer \" + t + \">\";\n        }, o && (l.prototype[o] = l.prototype.inspect), l.prototype.compare = function (t, e, n, r, i) {\n          if (V(t, Uint8Array) && (t = l.from(t, t.offset, t.byteLength)), !l.isBuffer(t)) throw new TypeError('The \"target\" argument must be one of type Buffer or Uint8Array. Received type ' + _typeof(t));\n          if (void 0 === e && (e = 0), void 0 === n && (n = t ? t.length : 0), void 0 === r && (r = 0), void 0 === i && (i = this.length), e < 0 || n > t.length || r < 0 || i > this.length) throw new RangeError(\"out of range index\");\n          if (r >= i && e >= n) return 0;\n          if (r >= i) return -1;\n          if (e >= n) return 1;\n          if (this === t) return 0;\n          var o = (i >>>= 0) - (r >>>= 0),\n            s = (n >>>= 0) - (e >>>= 0);\n          var a = Math.min(o, s),\n            h = this.slice(r, i),\n            u = t.slice(e, n);\n          for (var _t8 = 0; _t8 < a; ++_t8) if (h[_t8] !== u[_t8]) {\n            o = h[_t8], s = u[_t8];\n            break;\n          }\n          return o < s ? -1 : s < o ? 1 : 0;\n        }, l.prototype.includes = function (t, e, n) {\n          return -1 !== this.indexOf(t, e, n);\n        }, l.prototype.indexOf = function (t, e, n) {\n          return b(this, t, e, n, !0);\n        }, l.prototype.lastIndexOf = function (t, e, n) {\n          return b(this, t, e, n, !1);\n        }, l.prototype.write = function (t, e, n, r) {\n          if (void 0 === e) r = \"utf8\", n = this.length, e = 0;else if (void 0 === n && \"string\" == typeof e) r = e, n = this.length, e = 0;else {\n            if (!isFinite(e)) throw new Error(\"Buffer.write(string, encoding, offset[, length]) is no longer supported\");\n            e >>>= 0, isFinite(n) ? (n >>>= 0, void 0 === r && (r = \"utf8\")) : (r = n, n = void 0);\n          }\n          var i = this.length - e;\n          if ((void 0 === n || n > i) && (n = i), t.length > 0 && (n < 0 || e < 0) || e > this.length) throw new RangeError(\"Attempt to write outside buffer bounds\");\n          r || (r = \"utf8\");\n          var o = !1;\n          for (;;) switch (r) {\n            case \"hex\":\n              return v(this, t, e, n);\n            case \"utf8\":\n            case \"utf-8\":\n              return _(this, t, e, n);\n            case \"ascii\":\n            case \"latin1\":\n            case \"binary\":\n              return x(this, t, e, n);\n            case \"base64\":\n              return k(this, t, e, n);\n            case \"ucs2\":\n            case \"ucs-2\":\n            case \"utf16le\":\n            case \"utf-16le\":\n              return E(this, t, e, n);\n            default:\n              if (o) throw new TypeError(\"Unknown encoding: \" + r);\n              r = (\"\" + r).toLowerCase(), o = !0;\n          }\n        }, l.prototype.toJSON = function () {\n          return {\n            type: \"Buffer\",\n            data: Array.prototype.slice.call(this._arr || this, 0)\n          };\n        };\n        var M = 4096;\n        function I(t, e, n) {\n          var r = \"\";\n          n = Math.min(t.length, n);\n          for (var _i7 = e; _i7 < n; ++_i7) r += String.fromCharCode(127 & t[_i7]);\n          return r;\n        }\n        function R(t, e, n) {\n          var r = \"\";\n          n = Math.min(t.length, n);\n          for (var _i8 = e; _i8 < n; ++_i8) r += String.fromCharCode(t[_i8]);\n          return r;\n        }\n        function B(t, e, n) {\n          var r = t.length;\n          (!e || e < 0) && (e = 0), (!n || n < 0 || n > r) && (n = r);\n          var i = \"\";\n          for (var _r12 = e; _r12 < n; ++_r12) i += K[t[_r12]];\n          return i;\n        }\n        function T(t, e, n) {\n          var r = t.slice(e, n);\n          var i = \"\";\n          for (var _t9 = 0; _t9 < r.length - 1; _t9 += 2) i += String.fromCharCode(r[_t9] + 256 * r[_t9 + 1]);\n          return i;\n        }\n        function O(t, e, n) {\n          if (t % 1 != 0 || t < 0) throw new RangeError(\"offset is not uint\");\n          if (t + e > n) throw new RangeError(\"Trying to access beyond buffer length\");\n        }\n        function C(t, e, n, r, i, o) {\n          if (!l.isBuffer(t)) throw new TypeError('\"buffer\" argument must be a Buffer instance');\n          if (e > i || e < o) throw new RangeError('\"value\" argument is out of bounds');\n          if (n + r > t.length) throw new RangeError(\"Index out of range\");\n        }\n        function N(t, e, n, r, i) {\n          D(e, r, i, t, n, 7);\n          var o = Number(e & BigInt(4294967295));\n          t[n++] = o, o >>= 8, t[n++] = o, o >>= 8, t[n++] = o, o >>= 8, t[n++] = o;\n          var s = Number(e >> BigInt(32) & BigInt(4294967295));\n          return t[n++] = s, s >>= 8, t[n++] = s, s >>= 8, t[n++] = s, s >>= 8, t[n++] = s, n;\n        }\n        function z(t, e, n, r, i) {\n          D(e, r, i, t, n, 7);\n          var o = Number(e & BigInt(4294967295));\n          t[n + 7] = o, o >>= 8, t[n + 6] = o, o >>= 8, t[n + 5] = o, o >>= 8, t[n + 4] = o;\n          var s = Number(e >> BigInt(32) & BigInt(4294967295));\n          return t[n + 3] = s, s >>= 8, t[n + 2] = s, s >>= 8, t[n + 1] = s, s >>= 8, t[n] = s, n + 8;\n        }\n        function L(t, e, n, r, i, o) {\n          if (n + r > t.length) throw new RangeError(\"Index out of range\");\n          if (n < 0) throw new RangeError(\"Index out of range\");\n        }\n        function P(t, e, n, r, o) {\n          return e = +e, n >>>= 0, o || L(t, 0, n, 4), i.write(t, e, n, r, 23, 4), n + 4;\n        }\n        function U(t, e, n, r, o) {\n          return e = +e, n >>>= 0, o || L(t, 0, n, 8), i.write(t, e, n, r, 52, 8), n + 8;\n        }\n        l.prototype.slice = function (t, e) {\n          var n = this.length;\n          (t = ~~t) < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n), (e = void 0 === e ? n : ~~e) < 0 ? (e += n) < 0 && (e = 0) : e > n && (e = n), e < t && (e = t);\n          var r = this.subarray(t, e);\n          return Object.setPrototypeOf(r, l.prototype), r;\n        }, l.prototype.readUintLE = l.prototype.readUIntLE = function (t, e, n) {\n          t >>>= 0, e >>>= 0, n || O(t, e, this.length);\n          var r = this[t],\n            i = 1,\n            o = 0;\n          for (; ++o < e && (i *= 256);) r += this[t + o] * i;\n          return r;\n        }, l.prototype.readUintBE = l.prototype.readUIntBE = function (t, e, n) {\n          t >>>= 0, e >>>= 0, n || O(t, e, this.length);\n          var r = this[t + --e],\n            i = 1;\n          for (; e > 0 && (i *= 256);) r += this[t + --e] * i;\n          return r;\n        }, l.prototype.readUint8 = l.prototype.readUInt8 = function (t, e) {\n          return t >>>= 0, e || O(t, 1, this.length), this[t];\n        }, l.prototype.readUint16LE = l.prototype.readUInt16LE = function (t, e) {\n          return t >>>= 0, e || O(t, 2, this.length), this[t] | this[t + 1] << 8;\n        }, l.prototype.readUint16BE = l.prototype.readUInt16BE = function (t, e) {\n          return t >>>= 0, e || O(t, 2, this.length), this[t] << 8 | this[t + 1];\n        }, l.prototype.readUint32LE = l.prototype.readUInt32LE = function (t, e) {\n          return t >>>= 0, e || O(t, 4, this.length), (this[t] | this[t + 1] << 8 | this[t + 2] << 16) + 16777216 * this[t + 3];\n        }, l.prototype.readUint32BE = l.prototype.readUInt32BE = function (t, e) {\n          return t >>>= 0, e || O(t, 4, this.length), 16777216 * this[t] + (this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3]);\n        }, l.prototype.readBigUInt64LE = J(function (t) {\n          q(t >>>= 0, \"offset\");\n          var e = this[t],\n            n = this[t + 7];\n          void 0 !== e && void 0 !== n || H(t, this.length - 8);\n          var r = e + 256 * this[++t] + 65536 * this[++t] + this[++t] * Math.pow(2, 24),\n            i = this[++t] + 256 * this[++t] + 65536 * this[++t] + n * Math.pow(2, 24);\n          return BigInt(r) + (BigInt(i) << BigInt(32));\n        }), l.prototype.readBigUInt64BE = J(function (t) {\n          q(t >>>= 0, \"offset\");\n          var e = this[t],\n            n = this[t + 7];\n          void 0 !== e && void 0 !== n || H(t, this.length - 8);\n          var r = e * Math.pow(2, 24) + 65536 * this[++t] + 256 * this[++t] + this[++t],\n            i = this[++t] * Math.pow(2, 24) + 65536 * this[++t] + 256 * this[++t] + n;\n          return (BigInt(r) << BigInt(32)) + BigInt(i);\n        }), l.prototype.readIntLE = function (t, e, n) {\n          t >>>= 0, e >>>= 0, n || O(t, e, this.length);\n          var r = this[t],\n            i = 1,\n            o = 0;\n          for (; ++o < e && (i *= 256);) r += this[t + o] * i;\n          return i *= 128, r >= i && (r -= Math.pow(2, 8 * e)), r;\n        }, l.prototype.readIntBE = function (t, e, n) {\n          t >>>= 0, e >>>= 0, n || O(t, e, this.length);\n          var r = e,\n            i = 1,\n            o = this[t + --r];\n          for (; r > 0 && (i *= 256);) o += this[t + --r] * i;\n          return i *= 128, o >= i && (o -= Math.pow(2, 8 * e)), o;\n        }, l.prototype.readInt8 = function (t, e) {\n          return t >>>= 0, e || O(t, 1, this.length), 128 & this[t] ? -1 * (255 - this[t] + 1) : this[t];\n        }, l.prototype.readInt16LE = function (t, e) {\n          t >>>= 0, e || O(t, 2, this.length);\n          var n = this[t] | this[t + 1] << 8;\n          return 32768 & n ? 4294901760 | n : n;\n        }, l.prototype.readInt16BE = function (t, e) {\n          t >>>= 0, e || O(t, 2, this.length);\n          var n = this[t + 1] | this[t] << 8;\n          return 32768 & n ? 4294901760 | n : n;\n        }, l.prototype.readInt32LE = function (t, e) {\n          return t >>>= 0, e || O(t, 4, this.length), this[t] | this[t + 1] << 8 | this[t + 2] << 16 | this[t + 3] << 24;\n        }, l.prototype.readInt32BE = function (t, e) {\n          return t >>>= 0, e || O(t, 4, this.length), this[t] << 24 | this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3];\n        }, l.prototype.readBigInt64LE = J(function (t) {\n          q(t >>>= 0, \"offset\");\n          var e = this[t],\n            n = this[t + 7];\n          void 0 !== e && void 0 !== n || H(t, this.length - 8);\n          var r = this[t + 4] + 256 * this[t + 5] + 65536 * this[t + 6] + (n << 24);\n          return (BigInt(r) << BigInt(32)) + BigInt(e + 256 * this[++t] + 65536 * this[++t] + this[++t] * Math.pow(2, 24));\n        }), l.prototype.readBigInt64BE = J(function (t) {\n          q(t >>>= 0, \"offset\");\n          var e = this[t],\n            n = this[t + 7];\n          void 0 !== e && void 0 !== n || H(t, this.length - 8);\n          var r = (e << 24) + 65536 * this[++t] + 256 * this[++t] + this[++t];\n          return (BigInt(r) << BigInt(32)) + BigInt(this[++t] * Math.pow(2, 24) + 65536 * this[++t] + 256 * this[++t] + n);\n        }), l.prototype.readFloatLE = function (t, e) {\n          return t >>>= 0, e || O(t, 4, this.length), i.read(this, t, !0, 23, 4);\n        }, l.prototype.readFloatBE = function (t, e) {\n          return t >>>= 0, e || O(t, 4, this.length), i.read(this, t, !1, 23, 4);\n        }, l.prototype.readDoubleLE = function (t, e) {\n          return t >>>= 0, e || O(t, 8, this.length), i.read(this, t, !0, 52, 8);\n        }, l.prototype.readDoubleBE = function (t, e) {\n          return t >>>= 0, e || O(t, 8, this.length), i.read(this, t, !1, 52, 8);\n        }, l.prototype.writeUintLE = l.prototype.writeUIntLE = function (t, e, n, r) {\n          t = +t, e >>>= 0, n >>>= 0, r || C(this, t, e, n, Math.pow(2, 8 * n) - 1, 0);\n          var i = 1,\n            o = 0;\n          for (this[e] = 255 & t; ++o < n && (i *= 256);) this[e + o] = t / i & 255;\n          return e + n;\n        }, l.prototype.writeUintBE = l.prototype.writeUIntBE = function (t, e, n, r) {\n          t = +t, e >>>= 0, n >>>= 0, r || C(this, t, e, n, Math.pow(2, 8 * n) - 1, 0);\n          var i = n - 1,\n            o = 1;\n          for (this[e + i] = 255 & t; --i >= 0 && (o *= 256);) this[e + i] = t / o & 255;\n          return e + n;\n        }, l.prototype.writeUint8 = l.prototype.writeUInt8 = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 1, 255, 0), this[e] = 255 & t, e + 1;\n        }, l.prototype.writeUint16LE = l.prototype.writeUInt16LE = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 2, 65535, 0), this[e] = 255 & t, this[e + 1] = t >>> 8, e + 2;\n        }, l.prototype.writeUint16BE = l.prototype.writeUInt16BE = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 2, 65535, 0), this[e] = t >>> 8, this[e + 1] = 255 & t, e + 2;\n        }, l.prototype.writeUint32LE = l.prototype.writeUInt32LE = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 4, 4294967295, 0), this[e + 3] = t >>> 24, this[e + 2] = t >>> 16, this[e + 1] = t >>> 8, this[e] = 255 & t, e + 4;\n        }, l.prototype.writeUint32BE = l.prototype.writeUInt32BE = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 4, 4294967295, 0), this[e] = t >>> 24, this[e + 1] = t >>> 16, this[e + 2] = t >>> 8, this[e + 3] = 255 & t, e + 4;\n        }, l.prototype.writeBigUInt64LE = J(function (t) {\n          var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;\n          return N(this, t, e, BigInt(0), BigInt(\"0xffffffffffffffff\"));\n        }), l.prototype.writeBigUInt64BE = J(function (t) {\n          var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;\n          return z(this, t, e, BigInt(0), BigInt(\"0xffffffffffffffff\"));\n        }), l.prototype.writeIntLE = function (t, e, n, r) {\n          if (t = +t, e >>>= 0, !r) {\n            var _r13 = Math.pow(2, 8 * n - 1);\n            C(this, t, e, n, _r13 - 1, -_r13);\n          }\n          var i = 0,\n            o = 1,\n            s = 0;\n          for (this[e] = 255 & t; ++i < n && (o *= 256);) t < 0 && 0 === s && 0 !== this[e + i - 1] && (s = 1), this[e + i] = (t / o >> 0) - s & 255;\n          return e + n;\n        }, l.prototype.writeIntBE = function (t, e, n, r) {\n          if (t = +t, e >>>= 0, !r) {\n            var _r14 = Math.pow(2, 8 * n - 1);\n            C(this, t, e, n, _r14 - 1, -_r14);\n          }\n          var i = n - 1,\n            o = 1,\n            s = 0;\n          for (this[e + i] = 255 & t; --i >= 0 && (o *= 256);) t < 0 && 0 === s && 0 !== this[e + i + 1] && (s = 1), this[e + i] = (t / o >> 0) - s & 255;\n          return e + n;\n        }, l.prototype.writeInt8 = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 1, 127, -128), t < 0 && (t = 255 + t + 1), this[e] = 255 & t, e + 1;\n        }, l.prototype.writeInt16LE = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 2, 32767, -32768), this[e] = 255 & t, this[e + 1] = t >>> 8, e + 2;\n        }, l.prototype.writeInt16BE = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 2, 32767, -32768), this[e] = t >>> 8, this[e + 1] = 255 & t, e + 2;\n        }, l.prototype.writeInt32LE = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 4, 2147483647, -2147483648), this[e] = 255 & t, this[e + 1] = t >>> 8, this[e + 2] = t >>> 16, this[e + 3] = t >>> 24, e + 4;\n        }, l.prototype.writeInt32BE = function (t, e, n) {\n          return t = +t, e >>>= 0, n || C(this, t, e, 4, 2147483647, -2147483648), t < 0 && (t = 4294967295 + t + 1), this[e] = t >>> 24, this[e + 1] = t >>> 16, this[e + 2] = t >>> 8, this[e + 3] = 255 & t, e + 4;\n        }, l.prototype.writeBigInt64LE = J(function (t) {\n          var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;\n          return N(this, t, e, -BigInt(\"0x8000000000000000\"), BigInt(\"0x7fffffffffffffff\"));\n        }), l.prototype.writeBigInt64BE = J(function (t) {\n          var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;\n          return z(this, t, e, -BigInt(\"0x8000000000000000\"), BigInt(\"0x7fffffffffffffff\"));\n        }), l.prototype.writeFloatLE = function (t, e, n) {\n          return P(this, t, e, !0, n);\n        }, l.prototype.writeFloatBE = function (t, e, n) {\n          return P(this, t, e, !1, n);\n        }, l.prototype.writeDoubleLE = function (t, e, n) {\n          return U(this, t, e, !0, n);\n        }, l.prototype.writeDoubleBE = function (t, e, n) {\n          return U(this, t, e, !1, n);\n        }, l.prototype.copy = function (t, e, n, r) {\n          if (!l.isBuffer(t)) throw new TypeError(\"argument should be a Buffer\");\n          if (n || (n = 0), r || 0 === r || (r = this.length), e >= t.length && (e = t.length), e || (e = 0), r > 0 && r < n && (r = n), r === n) return 0;\n          if (0 === t.length || 0 === this.length) return 0;\n          if (e < 0) throw new RangeError(\"targetStart out of bounds\");\n          if (n < 0 || n >= this.length) throw new RangeError(\"Index out of range\");\n          if (r < 0) throw new RangeError(\"sourceEnd out of bounds\");\n          r > this.length && (r = this.length), t.length - e < r - n && (r = t.length - e + n);\n          var i = r - n;\n          return this === t && \"function\" == typeof Uint8Array.prototype.copyWithin ? this.copyWithin(e, n, r) : Uint8Array.prototype.set.call(t, this.subarray(n, r), e), i;\n        }, l.prototype.fill = function (t, e, n, r) {\n          if (\"string\" == typeof t) {\n            if (\"string\" == typeof e ? (r = e, e = 0, n = this.length) : \"string\" == typeof n && (r = n, n = this.length), void 0 !== r && \"string\" != typeof r) throw new TypeError(\"encoding must be a string\");\n            if (\"string\" == typeof r && !l.isEncoding(r)) throw new TypeError(\"Unknown encoding: \" + r);\n            if (1 === t.length) {\n              var _e18 = t.charCodeAt(0);\n              (\"utf8\" === r && _e18 < 128 || \"latin1\" === r) && (t = _e18);\n            }\n          } else \"number\" == typeof t ? t &= 255 : \"boolean\" == typeof t && (t = Number(t));\n          if (e < 0 || this.length < e || this.length < n) throw new RangeError(\"Out of range index\");\n          if (n <= e) return this;\n          var i;\n          if (e >>>= 0, n = void 0 === n ? this.length : n >>> 0, t || (t = 0), \"number\" == typeof t) for (i = e; i < n; ++i) this[i] = t;else {\n            var _o4 = l.isBuffer(t) ? t : l.from(t, r),\n              _s6 = _o4.length;\n            if (0 === _s6) throw new TypeError('The value \"' + t + '\" is invalid for argument \"value\"');\n            for (i = 0; i < n - e; ++i) this[i + e] = _o4[i % _s6];\n          }\n          return this;\n        };\n        var $ = {};\n        function j(t, e, n) {\n          $[t] = /*#__PURE__*/function (_n10) {\n            _inherits(_class3, _n10);\n            var _super2 = _createSuper(_class3);\n            function _class3() {\n              var _this7;\n              _classCallCheck(this, _class3);\n              _this7 = _super2.call(this), Object.defineProperty(_assertThisInitialized(_this7), \"message\", {\n                value: e.apply(_assertThisInitialized(_this7), arguments),\n                writable: !0,\n                configurable: !0\n              }), _this7.name = \"\".concat(_this7.name, \" [\").concat(t, \"]\"), _this7.stack, delete _this7.name;\n              return _this7;\n            }\n            _createClass(_class3, [{\n              key: \"code\",\n              get: function get() {\n                return t;\n              },\n              set: function set(t) {\n                Object.defineProperty(this, \"code\", {\n                  configurable: !0,\n                  enumerable: !0,\n                  value: t,\n                  writable: !0\n                });\n              }\n            }, {\n              key: \"toString\",\n              value: function toString() {\n                return \"\".concat(this.name, \" [\").concat(t, \"]: \").concat(this.message);\n              }\n            }]);\n            return _class3;\n          }(n);\n        }\n        function F(t) {\n          var e = \"\",\n            n = t.length;\n          var r = \"-\" === t[0] ? 1 : 0;\n          for (; n >= r + 4; n -= 3) e = \"_\".concat(t.slice(n - 3, n)).concat(e);\n          return \"\".concat(t.slice(0, n)).concat(e);\n        }\n        function D(t, e, n, r, i, o) {\n          if (t > n || t < e) {\n            var _r15 = \"bigint\" == typeof e ? \"n\" : \"\";\n            var _i9;\n            throw _i9 = o > 3 ? 0 === e || e === BigInt(0) ? \">= 0\".concat(_r15, \" and < 2\").concat(_r15, \" ** \").concat(8 * (o + 1)).concat(_r15) : \">= -(2\".concat(_r15, \" ** \").concat(8 * (o + 1) - 1).concat(_r15, \") and < 2 ** \").concat(8 * (o + 1) - 1).concat(_r15) : \">= \".concat(e).concat(_r15, \" and <= \").concat(n).concat(_r15), new $.ERR_OUT_OF_RANGE(\"value\", _i9, t);\n          }\n          !function (t, e, n) {\n            q(e, \"offset\"), void 0 !== t[e] && void 0 !== t[e + n] || H(e, t.length - (n + 1));\n          }(r, i, o);\n        }\n        function q(t, e) {\n          if (\"number\" != typeof t) throw new $.ERR_INVALID_ARG_TYPE(e, \"number\", t);\n        }\n        function H(t, e, n) {\n          if (Math.floor(t) !== t) throw q(t, n), new $.ERR_OUT_OF_RANGE(n || \"offset\", \"an integer\", t);\n          if (e < 0) throw new $.ERR_BUFFER_OUT_OF_BOUNDS();\n          throw new $.ERR_OUT_OF_RANGE(n || \"offset\", \">= \".concat(n ? 1 : 0, \" and <= \").concat(e), t);\n        }\n        j(\"ERR_BUFFER_OUT_OF_BOUNDS\", function (t) {\n          return t ? \"\".concat(t, \" is outside of buffer bounds\") : \"Attempt to access memory outside buffer bounds\";\n        }, RangeError), j(\"ERR_INVALID_ARG_TYPE\", function (t, e) {\n          return \"The \\\"\".concat(t, \"\\\" argument must be of type number. Received type \").concat(_typeof(e));\n        }, TypeError), j(\"ERR_OUT_OF_RANGE\", function (t, e, n) {\n          var r = \"The value of \\\"\".concat(t, \"\\\" is out of range.\"),\n            i = n;\n          return Number.isInteger(n) && Math.abs(n) > Math.pow(2, 32) ? i = F(String(n)) : \"bigint\" == typeof n && (i = String(n), (n > Math.pow(BigInt(2), BigInt(32)) || n < -Math.pow(BigInt(2), BigInt(32))) && (i = F(i)), i += \"n\"), r += \" It must be \".concat(e, \". Received \").concat(i), r;\n        }, RangeError);\n        var G = /[^+/0-9A-Za-z-_]/g;\n        function Z(t, e) {\n          var n;\n          e = e || 1 / 0;\n          var r = t.length;\n          var i = null;\n          var o = [];\n          for (var _s7 = 0; _s7 < r; ++_s7) {\n            if (n = t.charCodeAt(_s7), n > 55295 && n < 57344) {\n              if (!i) {\n                if (n > 56319) {\n                  (e -= 3) > -1 && o.push(239, 191, 189);\n                  continue;\n                }\n                if (_s7 + 1 === r) {\n                  (e -= 3) > -1 && o.push(239, 191, 189);\n                  continue;\n                }\n                i = n;\n                continue;\n              }\n              if (n < 56320) {\n                (e -= 3) > -1 && o.push(239, 191, 189), i = n;\n                continue;\n              }\n              n = 65536 + (i - 55296 << 10 | n - 56320);\n            } else i && (e -= 3) > -1 && o.push(239, 191, 189);\n            if (i = null, n < 128) {\n              if ((e -= 1) < 0) break;\n              o.push(n);\n            } else if (n < 2048) {\n              if ((e -= 2) < 0) break;\n              o.push(n >> 6 | 192, 63 & n | 128);\n            } else if (n < 65536) {\n              if ((e -= 3) < 0) break;\n              o.push(n >> 12 | 224, n >> 6 & 63 | 128, 63 & n | 128);\n            } else {\n              if (!(n < 1114112)) throw new Error(\"Invalid code point\");\n              if ((e -= 4) < 0) break;\n              o.push(n >> 18 | 240, n >> 12 & 63 | 128, n >> 6 & 63 | 128, 63 & n | 128);\n            }\n          }\n          return o;\n        }\n        function W(t) {\n          return r.toByteArray(function (t) {\n            if ((t = (t = t.split(\"=\")[0]).trim().replace(G, \"\")).length < 2) return \"\";\n            for (; t.length % 4 != 0;) t += \"=\";\n            return t;\n          }(t));\n        }\n        function X(t, e, n, r) {\n          var i;\n          for (i = 0; i < r && !(i + n >= e.length || i >= t.length); ++i) e[i + n] = t[i];\n          return i;\n        }\n        function V(t, e) {\n          return t instanceof e || null != t && null != t.constructor && null != t.constructor.name && t.constructor.name === e.name;\n        }\n        function Y(t) {\n          return t != t;\n        }\n        var K = function () {\n          var t = \"0123456789abcdef\",\n            e = new Array(256);\n          for (var _n11 = 0; _n11 < 16; ++_n11) {\n            var _r16 = 16 * _n11;\n            for (var _i10 = 0; _i10 < 16; ++_i10) e[_r16 + _i10] = t[_n11] + t[_i10];\n          }\n          return e;\n        }();\n        function J(t) {\n          return \"undefined\" == typeof BigInt ? Q : t;\n        }\n        function Q() {\n          throw new Error(\"BigInt not supported\");\n        }\n      },\n      949: function _(t, e, n) {\n        \"use strict\";\n\n        n.d(e, {\n          S9: function S9() {\n            return i();\n          },\n          kC: function kC() {\n            return s;\n          }\n        });\n        var r = n(67),\n          i = n.n(r),\n          o = n(764);\n        var s = /*#__PURE__*/function () {\n          function s(t) {\n            var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};\n            _classCallCheck(this, s);\n            this.baseOverrides = {}, this.url = t;\n            var n = e.fetch || globalThis.fetch.bind(globalThis);\n            if (!n) throw new TypeError(\"no fetch function supplied, and none found in global environment\");\n            e.overrides && (this.baseOverrides = e.overrides), this.fetchImplementation = n;\n          }\n          _createClass(s, [{\n            key: \"getBufferFromResponse\",\n            value: function () {\n              var _getBufferFromResponse = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22(t) {\n                var e;\n                return _regeneratorRuntime().wrap(function _callee22$(_context22) {\n                  while (1) switch (_context22.prev = _context22.next) {\n                    case 0:\n                      _context22.next = 2;\n                      return t.arrayBuffer();\n                    case 2:\n                      e = _context22.sent;\n                      return _context22.abrupt(\"return\", o.lW.from(e));\n                    case 4:\n                    case \"end\":\n                      return _context22.stop();\n                  }\n                }, _callee22);\n              }));\n              function getBufferFromResponse(_x38) {\n                return _getBufferFromResponse.apply(this, arguments);\n              }\n              return getBufferFromResponse;\n            }()\n          }, {\n            key: \"fetch\",\n            value: function () {\n              var _fetch2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23(t, e) {\n                var n;\n                return _regeneratorRuntime().wrap(function _callee23$(_context23) {\n                  while (1) switch (_context23.prev = _context23.next) {\n                    case 0:\n                      _context23.prev = 0;\n                      _context23.next = 3;\n                      return this.fetchImplementation(t, e);\n                    case 3:\n                      n = _context23.sent;\n                      _context23.next = 14;\n                      break;\n                    case 6:\n                      _context23.prev = 6;\n                      _context23.t0 = _context23[\"catch\"](0);\n                      if (\"\".concat(_context23.t0).includes(\"Failed to fetch\")) {\n                        _context23.next = 10;\n                        break;\n                      }\n                      throw _context23.t0;\n                    case 10:\n                      console.warn(\"generic-filehandle: refetching \".concat(t, \" to attempt to work around chrome CORS header caching bug\"));\n                      _context23.next = 13;\n                      return this.fetchImplementation(t, _objectSpread(_objectSpread({}, e), {}, {\n                        cache: \"reload\"\n                      }));\n                    case 13:\n                      n = _context23.sent;\n                    case 14:\n                      return _context23.abrupt(\"return\", n);\n                    case 15:\n                    case \"end\":\n                      return _context23.stop();\n                  }\n                }, _callee23, this, [[0, 6]]);\n              }));\n              function fetch(_x39, _x40) {\n                return _fetch2.apply(this, arguments);\n              }\n              return fetch;\n            }()\n          }, {\n            key: \"read\",\n            value: function () {\n              var _read2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24(t) {\n                var e,\n                  n,\n                  r,\n                  i,\n                  _i$headers,\n                  o,\n                  _s8,\n                  _i$overrides,\n                  a,\n                  l,\n                  h,\n                  _r17,\n                  _i11,\n                  _o5,\n                  _s9,\n                  _args24 = arguments;\n                return _regeneratorRuntime().wrap(function _callee24$(_context24) {\n                  while (1) switch (_context24.prev = _context24.next) {\n                    case 0:\n                      e = _args24.length > 1 && _args24[1] !== undefined ? _args24[1] : 0;\n                      n = _args24.length > 2 ? _args24[2] : undefined;\n                      r = _args24.length > 3 && _args24[3] !== undefined ? _args24[3] : 0;\n                      i = _args24.length > 4 && _args24[4] !== undefined ? _args24[4] : {};\n                      _i$headers = i.headers, o = _i$headers === void 0 ? {} : _i$headers, _s8 = i.signal, _i$overrides = i.overrides, a = _i$overrides === void 0 ? {} : _i$overrides;\n                      n < 1 / 0 ? o.range = \"bytes=\".concat(r, \"-\").concat(r + n) : n === 1 / 0 && 0 !== r && (o.range = \"bytes=\".concat(r, \"-\"));\n                      l = _objectSpread(_objectSpread(_objectSpread({}, this.baseOverrides), a), {}, {\n                        headers: _objectSpread(_objectSpread(_objectSpread({}, o), a.headers), this.baseOverrides.headers),\n                        method: \"GET\",\n                        redirect: \"follow\",\n                        mode: \"cors\",\n                        signal: _s8\n                      });\n                      _context24.next = 9;\n                      return this.fetch(this.url, l);\n                    case 9:\n                      h = _context24.sent;\n                      if (h.ok) {\n                        _context24.next = 12;\n                        break;\n                      }\n                      throw new Error(\"HTTP \".concat(h.status, \" \").concat(h.statusText, \" \").concat(this.url));\n                    case 12:\n                      if (!(200 === h.status && 0 === r || 206 === h.status)) {\n                        _context24.next = 20;\n                        break;\n                      }\n                      _context24.next = 15;\n                      return this.getBufferFromResponse(h);\n                    case 15:\n                      _r17 = _context24.sent;\n                      _i11 = _r17.copy(t, e, 0, Math.min(n, _r17.length));\n                      _o5 = h.headers.get(\"content-range\");\n                      _s9 = /\\/(\\d+)$/.exec(_o5 || \"\");\n                      return _context24.abrupt(\"return\", ((null == _s9 ? void 0 : _s9[1]) && (this._stat = {\n                        size: parseInt(_s9[1], 10)\n                      }), {\n                        bytesRead: _i11,\n                        buffer: t\n                      }));\n                    case 20:\n                      if (!(200 === h.status)) {\n                        _context24.next = 22;\n                        break;\n                      }\n                      throw new Error(\"${this.url} fetch returned status 200, expected 206\");\n                    case 22:\n                      throw new Error(\"HTTP \".concat(h.status, \" fetching \").concat(this.url));\n                    case 23:\n                    case \"end\":\n                      return _context24.stop();\n                  }\n                }, _callee24, this);\n              }));\n              function read(_x41) {\n                return _read2.apply(this, arguments);\n              }\n              return read;\n            }()\n          }, {\n            key: \"readFile\",\n            value: function () {\n              var _readFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25() {\n                var t,\n                  e,\n                  n,\n                  _n12,\n                  _n12$headers,\n                  r,\n                  i,\n                  _n12$overrides,\n                  o,\n                  _s10,\n                  a,\n                  _args25 = arguments;\n                return _regeneratorRuntime().wrap(function _callee25$(_context25) {\n                  while (1) switch (_context25.prev = _context25.next) {\n                    case 0:\n                      t = _args25.length > 0 && _args25[0] !== undefined ? _args25[0] : {};\n                      \"string\" == typeof t ? (e = t, n = {}) : (e = t.encoding, n = t, delete n.encoding);\n                      _n12 = n;\n                      _n12$headers = _n12.headers;\n                      r = _n12$headers === void 0 ? {} : _n12$headers;\n                      i = _n12.signal;\n                      _n12$overrides = _n12.overrides;\n                      o = _n12$overrides === void 0 ? {} : _n12$overrides;\n                      _s10 = _objectSpread(_objectSpread({\n                        headers: r,\n                        method: \"GET\",\n                        redirect: \"follow\",\n                        mode: \"cors\",\n                        signal: i\n                      }, this.baseOverrides), o);\n                      _context25.next = 11;\n                      return this.fetch(this.url, _s10);\n                    case 11:\n                      a = _context25.sent;\n                      if (a) {\n                        _context25.next = 14;\n                        break;\n                      }\n                      throw new Error(\"generic-filehandle failed to fetch\");\n                    case 14:\n                      if (!(200 !== a.status)) {\n                        _context25.next = 16;\n                        break;\n                      }\n                      throw Object.assign(new Error(\"HTTP \".concat(a.status, \" fetching \").concat(this.url)), {\n                        status: a.status\n                      });\n                    case 16:\n                      if (!(\"utf8\" === e)) {\n                        _context25.next = 18;\n                        break;\n                      }\n                      return _context25.abrupt(\"return\", a.text());\n                    case 18:\n                      if (!e) {\n                        _context25.next = 20;\n                        break;\n                      }\n                      throw new Error(\"unsupported encoding: \".concat(e));\n                    case 20:\n                      return _context25.abrupt(\"return\", this.getBufferFromResponse(a));\n                    case 21:\n                    case \"end\":\n                      return _context25.stop();\n                  }\n                }, _callee25, this);\n              }));\n              function readFile() {\n                return _readFile.apply(this, arguments);\n              }\n              return readFile;\n            }()\n          }, {\n            key: \"stat\",\n            value: function () {\n              var _stat2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26() {\n                var _t10;\n                return _regeneratorRuntime().wrap(function _callee26$(_context26) {\n                  while (1) switch (_context26.prev = _context26.next) {\n                    case 0:\n                      if (this._stat) {\n                        _context26.next = 6;\n                        break;\n                      }\n                      _t10 = o.lW.allocUnsafe(10);\n                      _context26.next = 4;\n                      return this.read(_t10, 0, 10, 0);\n                    case 4:\n                      if (this._stat) {\n                        _context26.next = 6;\n                        break;\n                      }\n                      throw new Error(\"unable to determine size of file at \".concat(this.url));\n                    case 6:\n                      return _context26.abrupt(\"return\", this._stat);\n                    case 7:\n                    case \"end\":\n                      return _context26.stop();\n                  }\n                }, _callee26, this);\n              }));\n              function stat() {\n                return _stat2.apply(this, arguments);\n              }\n              return stat;\n            }()\n          }, {\n            key: \"close\",\n            value: function () {\n              var _close = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee27() {\n                return _regeneratorRuntime().wrap(function _callee27$(_context27) {\n                  while (1) switch (_context27.prev = _context27.next) {\n                    case 0:\n                    case \"end\":\n                      return _context27.stop();\n                  }\n                }, _callee27);\n              }));\n              function close() {\n                return _close.apply(this, arguments);\n              }\n              return close;\n            }()\n          }]);\n          return s;\n        }();\n      },\n      645: function _(t, e) {\n        e.read = function (t, e, n, r, i) {\n          var o,\n            s,\n            a = 8 * i - r - 1,\n            l = (1 << a) - 1,\n            h = l >> 1,\n            u = -7,\n            f = n ? i - 1 : 0,\n            c = n ? -1 : 1,\n            d = t[e + f];\n          for (f += c, o = d & (1 << -u) - 1, d >>= -u, u += a; u > 0; o = 256 * o + t[e + f], f += c, u -= 8);\n          for (s = o & (1 << -u) - 1, o >>= -u, u += r; u > 0; s = 256 * s + t[e + f], f += c, u -= 8);\n          if (0 === o) o = 1 - h;else {\n            if (o === l) return s ? NaN : 1 / 0 * (d ? -1 : 1);\n            s += Math.pow(2, r), o -= h;\n          }\n          return (d ? -1 : 1) * s * Math.pow(2, o - r);\n        }, e.write = function (t, e, n, r, i, o) {\n          var s,\n            a,\n            l,\n            h = 8 * o - i - 1,\n            u = (1 << h) - 1,\n            f = u >> 1,\n            c = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0,\n            d = r ? 0 : o - 1,\n            g = r ? 1 : -1,\n            p = e < 0 || 0 === e && 1 / e < 0 ? 1 : 0;\n          for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (a = isNaN(e) ? 1 : 0, s = u) : (s = Math.floor(Math.log(e) / Math.LN2), e * (l = Math.pow(2, -s)) < 1 && (s--, l *= 2), (e += s + f >= 1 ? c / l : c * Math.pow(2, 1 - f)) * l >= 2 && (s++, l /= 2), s + f >= u ? (a = 0, s = u) : s + f >= 1 ? (a = (e * l - 1) * Math.pow(2, i), s += f) : (a = e * Math.pow(2, f - 1) * Math.pow(2, i), s = 0)); i >= 8; t[n + d] = 255 & a, d += g, a /= 256, i -= 8);\n          for (s = s << i | a, h += i; h > 0; t[n + d] = 255 & s, d += g, s /= 256, h -= 8);\n          t[n + d - g] |= 128 * p;\n        };\n      },\n      898: function _(t) {\n        \"use strict\";\n\n        t.exports = function (t) {\n          return !!t && (\"symbol\" == _typeof(Symbol.observable) && \"function\" == typeof t[Symbol.observable] ? t === t[Symbol.observable]() : \"function\" == typeof t[\"@@observable\"] && t === t[\"@@observable\"]());\n        };\n      },\n      720: function _(t) {\n        t.exports = n;\n        var e = null;\n        try {\n          e = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11])), {}).exports;\n        } catch (t) {}\n        function n(t, e, n) {\n          this.low = 0 | t, this.high = 0 | e, this.unsigned = !!n;\n        }\n        function r(t) {\n          return !0 === (t && t.__isLong__);\n        }\n        n.prototype.__isLong__, Object.defineProperty(n.prototype, \"__isLong__\", {\n          value: !0\n        }), n.isLong = r;\n        var i = {},\n          o = {};\n        function s(t, e) {\n          var n, r, s;\n          return e ? (s = 0 <= (t >>>= 0) && t < 256) && (r = o[t]) ? r : (n = l(t, (0 | t) < 0 ? -1 : 0, !0), s && (o[t] = n), n) : (s = -128 <= (t |= 0) && t < 128) && (r = i[t]) ? r : (n = l(t, t < 0 ? -1 : 0, !1), s && (i[t] = n), n);\n        }\n        function a(t, e) {\n          if (isNaN(t)) return e ? y : m;\n          if (e) {\n            if (t < 0) return y;\n            if (t >= d) return x;\n          } else {\n            if (t <= -g) return k;\n            if (t + 1 >= g) return _;\n          }\n          return t < 0 ? a(-t, e).neg() : l(t % c | 0, t / c | 0, e);\n        }\n        function l(t, e, r) {\n          return new n(t, e, r);\n        }\n        n.fromInt = s, n.fromNumber = a, n.fromBits = l;\n        var h = Math.pow;\n        function u(t, e, n) {\n          if (0 === t.length) throw Error(\"empty string\");\n          if (\"NaN\" === t || \"Infinity\" === t || \"+Infinity\" === t || \"-Infinity\" === t) return m;\n          if (\"number\" == typeof e ? (n = e, e = !1) : e = !!e, (n = n || 10) < 2 || 36 < n) throw RangeError(\"radix\");\n          var r;\n          if ((r = t.indexOf(\"-\")) > 0) throw Error(\"interior hyphen\");\n          if (0 === r) return u(t.substring(1), e, n).neg();\n          for (var i = a(h(n, 8)), o = m, s = 0; s < t.length; s += 8) {\n            var l = Math.min(8, t.length - s),\n              f = parseInt(t.substring(s, s + l), n);\n            if (l < 8) {\n              var c = a(h(n, l));\n              o = o.mul(c).add(a(f));\n            } else o = (o = o.mul(i)).add(a(f));\n          }\n          return o.unsigned = e, o;\n        }\n        function f(t, e) {\n          return \"number\" == typeof t ? a(t, e) : \"string\" == typeof t ? u(t, e) : l(t.low, t.high, \"boolean\" == typeof e ? e : t.unsigned);\n        }\n        n.fromString = u, n.fromValue = f;\n        var c = 4294967296,\n          d = c * c,\n          g = d / 2,\n          p = s(1 << 24),\n          m = s(0);\n        n.ZERO = m;\n        var y = s(0, !0);\n        n.UZERO = y;\n        var b = s(1);\n        n.ONE = b;\n        var w = s(1, !0);\n        n.UONE = w;\n        var v = s(-1);\n        n.NEG_ONE = v;\n        var _ = l(-1, 2147483647, !1);\n        n.MAX_VALUE = _;\n        var x = l(-1, -1, !0);\n        n.MAX_UNSIGNED_VALUE = x;\n        var k = l(0, -2147483648, !1);\n        n.MIN_VALUE = k;\n        var E = n.prototype;\n        E.toInt = function () {\n          return this.unsigned ? this.low >>> 0 : this.low;\n        }, E.toNumber = function () {\n          return this.unsigned ? (this.high >>> 0) * c + (this.low >>> 0) : this.high * c + (this.low >>> 0);\n        }, E.toString = function (t) {\n          if ((t = t || 10) < 2 || 36 < t) throw RangeError(\"radix\");\n          if (this.isZero()) return \"0\";\n          if (this.isNegative()) {\n            if (this.eq(k)) {\n              var e = a(t),\n                n = this.div(e),\n                r = n.mul(e).sub(this);\n              return n.toString(t) + r.toInt().toString(t);\n            }\n            return \"-\" + this.neg().toString(t);\n          }\n          for (var i = a(h(t, 6), this.unsigned), o = this, s = \"\";;) {\n            var l = o.div(i),\n              u = (o.sub(l.mul(i)).toInt() >>> 0).toString(t);\n            if ((o = l).isZero()) return u + s;\n            for (; u.length < 6;) u = \"0\" + u;\n            s = \"\" + u + s;\n          }\n        }, E.getHighBits = function () {\n          return this.high;\n        }, E.getHighBitsUnsigned = function () {\n          return this.high >>> 0;\n        }, E.getLowBits = function () {\n          return this.low;\n        }, E.getLowBitsUnsigned = function () {\n          return this.low >>> 0;\n        }, E.getNumBitsAbs = function () {\n          if (this.isNegative()) return this.eq(k) ? 64 : this.neg().getNumBitsAbs();\n          for (var t = 0 != this.high ? this.high : this.low, e = 31; e > 0 && 0 == (t & 1 << e); e--);\n          return 0 != this.high ? e + 33 : e + 1;\n        }, E.isZero = function () {\n          return 0 === this.high && 0 === this.low;\n        }, E.eqz = E.isZero, E.isNegative = function () {\n          return !this.unsigned && this.high < 0;\n        }, E.isPositive = function () {\n          return this.unsigned || this.high >= 0;\n        }, E.isOdd = function () {\n          return 1 == (1 & this.low);\n        }, E.isEven = function () {\n          return 0 == (1 & this.low);\n        }, E.equals = function (t) {\n          return r(t) || (t = f(t)), (this.unsigned === t.unsigned || this.high >>> 31 != 1 || t.high >>> 31 != 1) && this.high === t.high && this.low === t.low;\n        }, E.eq = E.equals, E.notEquals = function (t) {\n          return !this.eq(t);\n        }, E.neq = E.notEquals, E.ne = E.notEquals, E.lessThan = function (t) {\n          return this.comp(t) < 0;\n        }, E.lt = E.lessThan, E.lessThanOrEqual = function (t) {\n          return this.comp(t) <= 0;\n        }, E.lte = E.lessThanOrEqual, E.le = E.lessThanOrEqual, E.greaterThan = function (t) {\n          return this.comp(t) > 0;\n        }, E.gt = E.greaterThan, E.greaterThanOrEqual = function (t) {\n          return this.comp(t) >= 0;\n        }, E.gte = E.greaterThanOrEqual, E.ge = E.greaterThanOrEqual, E.compare = function (t) {\n          if (r(t) || (t = f(t)), this.eq(t)) return 0;\n          var e = this.isNegative(),\n            n = t.isNegative();\n          return e && !n ? -1 : !e && n ? 1 : this.unsigned ? t.high >>> 0 > this.high >>> 0 || t.high === this.high && t.low >>> 0 > this.low >>> 0 ? -1 : 1 : this.sub(t).isNegative() ? -1 : 1;\n        }, E.comp = E.compare, E.negate = function () {\n          return !this.unsigned && this.eq(k) ? k : this.not().add(b);\n        }, E.neg = E.negate, E.add = function (t) {\n          r(t) || (t = f(t));\n          var e = this.high >>> 16,\n            n = 65535 & this.high,\n            i = this.low >>> 16,\n            o = 65535 & this.low,\n            s = t.high >>> 16,\n            a = 65535 & t.high,\n            h = t.low >>> 16,\n            u = 0,\n            c = 0,\n            d = 0,\n            g = 0;\n          return d += (g += o + (65535 & t.low)) >>> 16, c += (d += i + h) >>> 16, u += (c += n + a) >>> 16, u += e + s, l((d &= 65535) << 16 | (g &= 65535), (u &= 65535) << 16 | (c &= 65535), this.unsigned);\n        }, E.subtract = function (t) {\n          return r(t) || (t = f(t)), this.add(t.neg());\n        }, E.sub = E.subtract, E.multiply = function (t) {\n          if (this.isZero()) return m;\n          if (r(t) || (t = f(t)), e) return l(e.mul(this.low, this.high, t.low, t.high), e.get_high(), this.unsigned);\n          if (t.isZero()) return m;\n          if (this.eq(k)) return t.isOdd() ? k : m;\n          if (t.eq(k)) return this.isOdd() ? k : m;\n          if (this.isNegative()) return t.isNegative() ? this.neg().mul(t.neg()) : this.neg().mul(t).neg();\n          if (t.isNegative()) return this.mul(t.neg()).neg();\n          if (this.lt(p) && t.lt(p)) return a(this.toNumber() * t.toNumber(), this.unsigned);\n          var n = this.high >>> 16,\n            i = 65535 & this.high,\n            o = this.low >>> 16,\n            s = 65535 & this.low,\n            h = t.high >>> 16,\n            u = 65535 & t.high,\n            c = t.low >>> 16,\n            d = 65535 & t.low,\n            g = 0,\n            y = 0,\n            b = 0,\n            w = 0;\n          return b += (w += s * d) >>> 16, y += (b += o * d) >>> 16, b &= 65535, y += (b += s * c) >>> 16, g += (y += i * d) >>> 16, y &= 65535, g += (y += o * c) >>> 16, y &= 65535, g += (y += s * u) >>> 16, g += n * d + i * c + o * u + s * h, l((b &= 65535) << 16 | (w &= 65535), (g &= 65535) << 16 | (y &= 65535), this.unsigned);\n        }, E.mul = E.multiply, E.divide = function (t) {\n          if (r(t) || (t = f(t)), t.isZero()) throw Error(\"division by zero\");\n          var n, i, o;\n          if (e) return this.unsigned || -2147483648 !== this.high || -1 !== t.low || -1 !== t.high ? l((this.unsigned ? e.div_u : e.div_s)(this.low, this.high, t.low, t.high), e.get_high(), this.unsigned) : this;\n          if (this.isZero()) return this.unsigned ? y : m;\n          if (this.unsigned) {\n            if (t.unsigned || (t = t.toUnsigned()), t.gt(this)) return y;\n            if (t.gt(this.shru(1))) return w;\n            o = y;\n          } else {\n            if (this.eq(k)) return t.eq(b) || t.eq(v) ? k : t.eq(k) ? b : (n = this.shr(1).div(t).shl(1)).eq(m) ? t.isNegative() ? b : v : (i = this.sub(t.mul(n)), o = n.add(i.div(t)));\n            if (t.eq(k)) return this.unsigned ? y : m;\n            if (this.isNegative()) return t.isNegative() ? this.neg().div(t.neg()) : this.neg().div(t).neg();\n            if (t.isNegative()) return this.div(t.neg()).neg();\n            o = m;\n          }\n          for (i = this; i.gte(t);) {\n            n = Math.max(1, Math.floor(i.toNumber() / t.toNumber()));\n            for (var s = Math.ceil(Math.log(n) / Math.LN2), u = s <= 48 ? 1 : h(2, s - 48), c = a(n), d = c.mul(t); d.isNegative() || d.gt(i);) d = (c = a(n -= u, this.unsigned)).mul(t);\n            c.isZero() && (c = b), o = o.add(c), i = i.sub(d);\n          }\n          return o;\n        }, E.div = E.divide, E.modulo = function (t) {\n          return r(t) || (t = f(t)), e ? l((this.unsigned ? e.rem_u : e.rem_s)(this.low, this.high, t.low, t.high), e.get_high(), this.unsigned) : this.sub(this.div(t).mul(t));\n        }, E.mod = E.modulo, E.rem = E.modulo, E.not = function () {\n          return l(~this.low, ~this.high, this.unsigned);\n        }, E.and = function (t) {\n          return r(t) || (t = f(t)), l(this.low & t.low, this.high & t.high, this.unsigned);\n        }, E.or = function (t) {\n          return r(t) || (t = f(t)), l(this.low | t.low, this.high | t.high, this.unsigned);\n        }, E.xor = function (t) {\n          return r(t) || (t = f(t)), l(this.low ^ t.low, this.high ^ t.high, this.unsigned);\n        }, E.shiftLeft = function (t) {\n          return r(t) && (t = t.toInt()), 0 == (t &= 63) ? this : t < 32 ? l(this.low << t, this.high << t | this.low >>> 32 - t, this.unsigned) : l(0, this.low << t - 32, this.unsigned);\n        }, E.shl = E.shiftLeft, E.shiftRight = function (t) {\n          return r(t) && (t = t.toInt()), 0 == (t &= 63) ? this : t < 32 ? l(this.low >>> t | this.high << 32 - t, this.high >> t, this.unsigned) : l(this.high >> t - 32, this.high >= 0 ? 0 : -1, this.unsigned);\n        }, E.shr = E.shiftRight, E.shiftRightUnsigned = function (t) {\n          if (r(t) && (t = t.toInt()), 0 == (t &= 63)) return this;\n          var e = this.high;\n          return t < 32 ? l(this.low >>> t | e << 32 - t, e >>> t, this.unsigned) : l(32 === t ? e : e >>> t - 32, 0, this.unsigned);\n        }, E.shru = E.shiftRightUnsigned, E.shr_u = E.shiftRightUnsigned, E.toSigned = function () {\n          return this.unsigned ? l(this.low, this.high, !1) : this;\n        }, E.toUnsigned = function () {\n          return this.unsigned ? this : l(this.low, this.high, !0);\n        }, E.toBytes = function (t) {\n          return t ? this.toBytesLE() : this.toBytesBE();\n        }, E.toBytesLE = function () {\n          var t = this.high,\n            e = this.low;\n          return [255 & e, e >>> 8 & 255, e >>> 16 & 255, e >>> 24, 255 & t, t >>> 8 & 255, t >>> 16 & 255, t >>> 24];\n        }, E.toBytesBE = function () {\n          var t = this.high,\n            e = this.low;\n          return [t >>> 24, t >>> 16 & 255, t >>> 8 & 255, 255 & t, e >>> 24, e >>> 16 & 255, e >>> 8 & 255, 255 & e];\n        }, n.fromBytes = function (t, e, r) {\n          return r ? n.fromBytesLE(t, e) : n.fromBytesBE(t, e);\n        }, n.fromBytesLE = function (t, e) {\n          return new n(t[0] | t[1] << 8 | t[2] << 16 | t[3] << 24, t[4] | t[5] << 8 | t[6] << 16 | t[7] << 24, e);\n        }, n.fromBytesBE = function (t, e) {\n          return new n(t[4] << 24 | t[5] << 16 | t[6] << 8 | t[7], t[0] << 24 | t[1] << 16 | t[2] << 8 | t[3], e);\n        };\n      },\n      593: function _(t, e, n) {\n        \"use strict\";\n\n        var r = n(411),\n          i = Symbol(\"max\"),\n          o = Symbol(\"length\"),\n          s = Symbol(\"lengthCalculator\"),\n          a = Symbol(\"allowStale\"),\n          l = Symbol(\"maxAge\"),\n          h = Symbol(\"dispose\"),\n          u = Symbol(\"noDisposeOnSet\"),\n          f = Symbol(\"lruList\"),\n          c = Symbol(\"cache\"),\n          d = Symbol(\"updateAgeOnGet\"),\n          g = function g() {\n            return 1;\n          },\n          p = function p(t, e, n) {\n            var r = t[c].get(e);\n            if (r) {\n              var _e19 = r.value;\n              if (m(t, _e19)) {\n                if (b(t, r), !t[a]) return;\n              } else n && (t[d] && (r.value.now = Date.now()), t[f].unshiftNode(r));\n              return _e19.value;\n            }\n          },\n          m = function m(t, e) {\n            if (!e || !e.maxAge && !t[l]) return !1;\n            var n = Date.now() - e.now;\n            return e.maxAge ? n > e.maxAge : t[l] && n > t[l];\n          },\n          y = function y(t) {\n            if (t[o] > t[i]) for (var _e20 = t[f].tail; t[o] > t[i] && null !== _e20;) {\n              var _n13 = _e20.prev;\n              b(t, _e20), _e20 = _n13;\n            }\n          },\n          b = function b(t, e) {\n            if (e) {\n              var _n14 = e.value;\n              t[h] && t[h](_n14.key, _n14.value), t[o] -= _n14.length, t[c][\"delete\"](_n14.key), t[f].removeNode(e);\n            }\n          };\n        var w = /*#__PURE__*/_createClass(function w(t, e, n, r, i) {\n          _classCallCheck(this, w);\n          this.key = t, this.value = e, this.length = n, this.now = r, this.maxAge = i || 0;\n        });\n        var v = function v(t, e, n, r) {\n          var i = n.value;\n          m(t, i) && (b(t, n), t[a] || (i = void 0)), i && e.call(r, i.value, i.key, t);\n        };\n        t.exports = /*#__PURE__*/function () {\n          function _class4(t) {\n            _classCallCheck(this, _class4);\n            if (\"number\" == typeof t && (t = {\n              max: t\n            }), t || (t = {}), t.max && (\"number\" != typeof t.max || t.max < 0)) throw new TypeError(\"max must be a non-negative number\");\n            this[i] = t.max || 1 / 0;\n            var e = t.length || g;\n            if (this[s] = \"function\" != typeof e ? g : e, this[a] = t.stale || !1, t.maxAge && \"number\" != typeof t.maxAge) throw new TypeError(\"maxAge must be a number\");\n            this[l] = t.maxAge || 0, this[h] = t.dispose, this[u] = t.noDisposeOnSet || !1, this[d] = t.updateAgeOnGet || !1, this.reset();\n          }\n          _createClass(_class4, [{\n            key: \"max\",\n            get: function get() {\n              return this[i];\n            },\n            set: function set(t) {\n              if (\"number\" != typeof t || t < 0) throw new TypeError(\"max must be a non-negative number\");\n              this[i] = t || 1 / 0, y(this);\n            }\n          }, {\n            key: \"allowStale\",\n            get: function get() {\n              return this[a];\n            },\n            set: function set(t) {\n              this[a] = !!t;\n            }\n          }, {\n            key: \"maxAge\",\n            get: function get() {\n              return this[l];\n            },\n            set: function set(t) {\n              if (\"number\" != typeof t) throw new TypeError(\"maxAge must be a non-negative number\");\n              this[l] = t, y(this);\n            }\n          }, {\n            key: \"lengthCalculator\",\n            get: function get() {\n              return this[s];\n            },\n            set: function set(t) {\n              var _this8 = this;\n              \"function\" != typeof t && (t = g), t !== this[s] && (this[s] = t, this[o] = 0, this[f].forEach(function (t) {\n                t.length = _this8[s](t.value, t.key), _this8[o] += t.length;\n              })), y(this);\n            }\n          }, {\n            key: \"length\",\n            get: function get() {\n              return this[o];\n            }\n          }, {\n            key: \"itemCount\",\n            get: function get() {\n              return this[f].length;\n            }\n          }, {\n            key: \"rforEach\",\n            value: function rforEach(t, e) {\n              e = e || this;\n              for (var _n15 = this[f].tail; null !== _n15;) {\n                var _r18 = _n15.prev;\n                v(this, t, _n15, e), _n15 = _r18;\n              }\n            }\n          }, {\n            key: \"forEach\",\n            value: function forEach(t, e) {\n              e = e || this;\n              for (var _n16 = this[f].head; null !== _n16;) {\n                var _r19 = _n16.next;\n                v(this, t, _n16, e), _n16 = _r19;\n              }\n            }\n          }, {\n            key: \"keys\",\n            value: function keys() {\n              return this[f].toArray().map(function (t) {\n                return t.key;\n              });\n            }\n          }, {\n            key: \"values\",\n            value: function values() {\n              return this[f].toArray().map(function (t) {\n                return t.value;\n              });\n            }\n          }, {\n            key: \"reset\",\n            value: function reset() {\n              var _this9 = this;\n              this[h] && this[f] && this[f].length && this[f].forEach(function (t) {\n                return _this9[h](t.key, t.value);\n              }), this[c] = new Map(), this[f] = new r(), this[o] = 0;\n            }\n          }, {\n            key: \"dump\",\n            value: function dump() {\n              var _this10 = this;\n              return this[f].map(function (t) {\n                return !m(_this10, t) && {\n                  k: t.key,\n                  v: t.value,\n                  e: t.now + (t.maxAge || 0)\n                };\n              }).toArray().filter(function (t) {\n                return t;\n              });\n            }\n          }, {\n            key: \"dumpLru\",\n            value: function dumpLru() {\n              return this[f];\n            }\n          }, {\n            key: \"set\",\n            value: function set(t, e, n) {\n              if ((n = n || this[l]) && \"number\" != typeof n) throw new TypeError(\"maxAge must be a number\");\n              var r = n ? Date.now() : 0,\n                a = this[s](e, t);\n              if (this[c].has(t)) {\n                if (a > this[i]) return b(this, this[c].get(t)), !1;\n                var _s11 = this[c].get(t).value;\n                return this[h] && (this[u] || this[h](t, _s11.value)), _s11.now = r, _s11.maxAge = n, _s11.value = e, this[o] += a - _s11.length, _s11.length = a, this.get(t), y(this), !0;\n              }\n              var d = new w(t, e, a, r, n);\n              return d.length > this[i] ? (this[h] && this[h](t, e), !1) : (this[o] += d.length, this[f].unshift(d), this[c].set(t, this[f].head), y(this), !0);\n            }\n          }, {\n            key: \"has\",\n            value: function has(t) {\n              if (!this[c].has(t)) return !1;\n              var e = this[c].get(t).value;\n              return !m(this, e);\n            }\n          }, {\n            key: \"get\",\n            value: function get(t) {\n              return p(this, t, !0);\n            }\n          }, {\n            key: \"peek\",\n            value: function peek(t) {\n              return p(this, t, !1);\n            }\n          }, {\n            key: \"pop\",\n            value: function pop() {\n              var t = this[f].tail;\n              return t ? (b(this, t), t.value) : null;\n            }\n          }, {\n            key: \"del\",\n            value: function del(t) {\n              b(this, this[c].get(t));\n            }\n          }, {\n            key: \"load\",\n            value: function load(t) {\n              this.reset();\n              var e = Date.now();\n              for (var _n17 = t.length - 1; _n17 >= 0; _n17--) {\n                var _r20 = t[_n17],\n                  _i12 = _r20.e || 0;\n                if (0 === _i12) this.set(_r20.k, _r20.v);else {\n                  var _t11 = _i12 - e;\n                  _t11 > 0 && this.set(_r20.k, _r20.v, _t11);\n                }\n              }\n            }\n          }, {\n            key: \"prune\",\n            value: function prune() {\n              var _this11 = this;\n              this[c].forEach(function (t, e) {\n                return p(_this11, e, !1);\n              });\n            }\n          }]);\n          return _class4;\n        }();\n      },\n      591: function _(t, e, n) {\n        \"use strict\";\n\n        var r = {};\n        (0, n(236).assign)(r, n(555), n(843), n(619)), t.exports = r;\n      },\n      555: function _(t, e, n) {\n        \"use strict\";\n\n        var r = n(405),\n          i = n(236),\n          o = n(373),\n          s = n(265),\n          a = n(292),\n          l = Object.prototype.toString,\n          h = 0,\n          u = -1,\n          f = 0,\n          c = 8;\n        function d(t) {\n          if (!(this instanceof d)) return new d(t);\n          this.options = i.assign({\n            level: u,\n            method: c,\n            chunkSize: 16384,\n            windowBits: 15,\n            memLevel: 8,\n            strategy: f,\n            to: \"\"\n          }, t || {});\n          var e = this.options;\n          e.raw && e.windowBits > 0 ? e.windowBits = -e.windowBits : e.gzip && e.windowBits > 0 && e.windowBits < 16 && (e.windowBits += 16), this.err = 0, this.msg = \"\", this.ended = !1, this.chunks = [], this.strm = new a(), this.strm.avail_out = 0;\n          var n = r.deflateInit2(this.strm, e.level, e.method, e.windowBits, e.memLevel, e.strategy);\n          if (n !== h) throw new Error(s[n]);\n          if (e.header && r.deflateSetHeader(this.strm, e.header), e.dictionary) {\n            var g;\n            if (g = \"string\" == typeof e.dictionary ? o.string2buf(e.dictionary) : \"[object ArrayBuffer]\" === l.call(e.dictionary) ? new Uint8Array(e.dictionary) : e.dictionary, (n = r.deflateSetDictionary(this.strm, g)) !== h) throw new Error(s[n]);\n            this._dict_set = !0;\n          }\n        }\n        function g(t, e) {\n          var n = new d(e);\n          if (n.push(t, !0), n.err) throw n.msg || s[n.err];\n          return n.result;\n        }\n        d.prototype.push = function (t, e) {\n          var n,\n            s,\n            a = this.strm,\n            u = this.options.chunkSize;\n          if (this.ended) return !1;\n          s = e === ~~e ? e : !0 === e ? 4 : 0, \"string\" == typeof t ? a.input = o.string2buf(t) : \"[object ArrayBuffer]\" === l.call(t) ? a.input = new Uint8Array(t) : a.input = t, a.next_in = 0, a.avail_in = a.input.length;\n          do {\n            if (0 === a.avail_out && (a.output = new i.Buf8(u), a.next_out = 0, a.avail_out = u), 1 !== (n = r.deflate(a, s)) && n !== h) return this.onEnd(n), this.ended = !0, !1;\n            0 !== a.avail_out && (0 !== a.avail_in || 4 !== s && 2 !== s) || (\"string\" === this.options.to ? this.onData(o.buf2binstring(i.shrinkBuf(a.output, a.next_out))) : this.onData(i.shrinkBuf(a.output, a.next_out)));\n          } while ((a.avail_in > 0 || 0 === a.avail_out) && 1 !== n);\n          return 4 === s ? (n = r.deflateEnd(this.strm), this.onEnd(n), this.ended = !0, n === h) : 2 !== s || (this.onEnd(h), a.avail_out = 0, !0);\n        }, d.prototype.onData = function (t) {\n          this.chunks.push(t);\n        }, d.prototype.onEnd = function (t) {\n          t === h && (\"string\" === this.options.to ? this.result = this.chunks.join(\"\") : this.result = i.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;\n        }, e.Deflate = d, e.deflate = g, e.deflateRaw = function (t, e) {\n          return (e = e || {}).raw = !0, g(t, e);\n        }, e.gzip = function (t, e) {\n          return (e = e || {}).gzip = !0, g(t, e);\n        };\n      },\n      843: function _(t, e, n) {\n        \"use strict\";\n\n        var r = n(948),\n          i = n(236),\n          o = n(373),\n          s = n(619),\n          a = n(265),\n          l = n(292),\n          h = n(401),\n          u = Object.prototype.toString;\n        function f(t) {\n          if (!(this instanceof f)) return new f(t);\n          this.options = i.assign({\n            chunkSize: 16384,\n            windowBits: 0,\n            to: \"\"\n          }, t || {});\n          var e = this.options;\n          e.raw && e.windowBits >= 0 && e.windowBits < 16 && (e.windowBits = -e.windowBits, 0 === e.windowBits && (e.windowBits = -15)), !(e.windowBits >= 0 && e.windowBits < 16) || t && t.windowBits || (e.windowBits += 32), e.windowBits > 15 && e.windowBits < 48 && 0 == (15 & e.windowBits) && (e.windowBits |= 15), this.err = 0, this.msg = \"\", this.ended = !1, this.chunks = [], this.strm = new l(), this.strm.avail_out = 0;\n          var n = r.inflateInit2(this.strm, e.windowBits);\n          if (n !== s.Z_OK) throw new Error(a[n]);\n          if (this.header = new h(), r.inflateGetHeader(this.strm, this.header), e.dictionary && (\"string\" == typeof e.dictionary ? e.dictionary = o.string2buf(e.dictionary) : \"[object ArrayBuffer]\" === u.call(e.dictionary) && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (n = r.inflateSetDictionary(this.strm, e.dictionary)) !== s.Z_OK)) throw new Error(a[n]);\n        }\n        function c(t, e) {\n          var n = new f(e);\n          if (n.push(t, !0), n.err) throw n.msg || a[n.err];\n          return n.result;\n        }\n        f.prototype.push = function (t, e) {\n          var n,\n            a,\n            l,\n            h,\n            f,\n            c = this.strm,\n            d = this.options.chunkSize,\n            g = this.options.dictionary,\n            p = !1;\n          if (this.ended) return !1;\n          a = e === ~~e ? e : !0 === e ? s.Z_FINISH : s.Z_NO_FLUSH, \"string\" == typeof t ? c.input = o.binstring2buf(t) : \"[object ArrayBuffer]\" === u.call(t) ? c.input = new Uint8Array(t) : c.input = t, c.next_in = 0, c.avail_in = c.input.length;\n          do {\n            if (0 === c.avail_out && (c.output = new i.Buf8(d), c.next_out = 0, c.avail_out = d), (n = r.inflate(c, s.Z_NO_FLUSH)) === s.Z_NEED_DICT && g && (n = r.inflateSetDictionary(this.strm, g)), n === s.Z_BUF_ERROR && !0 === p && (n = s.Z_OK, p = !1), n !== s.Z_STREAM_END && n !== s.Z_OK) return this.onEnd(n), this.ended = !0, !1;\n            c.next_out && (0 !== c.avail_out && n !== s.Z_STREAM_END && (0 !== c.avail_in || a !== s.Z_FINISH && a !== s.Z_SYNC_FLUSH) || (\"string\" === this.options.to ? (l = o.utf8border(c.output, c.next_out), h = c.next_out - l, f = o.buf2string(c.output, l), c.next_out = h, c.avail_out = d - h, h && i.arraySet(c.output, c.output, l, h, 0), this.onData(f)) : this.onData(i.shrinkBuf(c.output, c.next_out)))), 0 === c.avail_in && 0 === c.avail_out && (p = !0);\n          } while ((c.avail_in > 0 || 0 === c.avail_out) && n !== s.Z_STREAM_END);\n          return n === s.Z_STREAM_END && (a = s.Z_FINISH), a === s.Z_FINISH ? (n = r.inflateEnd(this.strm), this.onEnd(n), this.ended = !0, n === s.Z_OK) : a !== s.Z_SYNC_FLUSH || (this.onEnd(s.Z_OK), c.avail_out = 0, !0);\n        }, f.prototype.onData = function (t) {\n          this.chunks.push(t);\n        }, f.prototype.onEnd = function (t) {\n          t === s.Z_OK && (\"string\" === this.options.to ? this.result = this.chunks.join(\"\") : this.result = i.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;\n        }, e.Inflate = f, e.inflate = c, e.inflateRaw = function (t, e) {\n          return (e = e || {}).raw = !0, c(t, e);\n        }, e.ungzip = c;\n      },\n      236: function _(t, e) {\n        \"use strict\";\n\n        var n = \"undefined\" != typeof Uint8Array && \"undefined\" != typeof Uint16Array && \"undefined\" != typeof Int32Array;\n        function r(t, e) {\n          return Object.prototype.hasOwnProperty.call(t, e);\n        }\n        e.assign = function (t) {\n          for (var e = Array.prototype.slice.call(arguments, 1); e.length;) {\n            var n = e.shift();\n            if (n) {\n              if (\"object\" != _typeof(n)) throw new TypeError(n + \"must be non-object\");\n              for (var i in n) r(n, i) && (t[i] = n[i]);\n            }\n          }\n          return t;\n        }, e.shrinkBuf = function (t, e) {\n          return t.length === e ? t : t.subarray ? t.subarray(0, e) : (t.length = e, t);\n        };\n        var i = {\n            arraySet: function arraySet(t, e, n, r, i) {\n              if (e.subarray && t.subarray) t.set(e.subarray(n, n + r), i);else for (var o = 0; o < r; o++) t[i + o] = e[n + o];\n            },\n            flattenChunks: function flattenChunks(t) {\n              var e, n, r, i, o, s;\n              for (r = 0, e = 0, n = t.length; e < n; e++) r += t[e].length;\n              for (s = new Uint8Array(r), i = 0, e = 0, n = t.length; e < n; e++) o = t[e], s.set(o, i), i += o.length;\n              return s;\n            }\n          },\n          o = {\n            arraySet: function arraySet(t, e, n, r, i) {\n              for (var o = 0; o < r; o++) t[i + o] = e[n + o];\n            },\n            flattenChunks: function flattenChunks(t) {\n              return [].concat.apply([], t);\n            }\n          };\n        e.setTyped = function (t) {\n          t ? (e.Buf8 = Uint8Array, e.Buf16 = Uint16Array, e.Buf32 = Int32Array, e.assign(e, i)) : (e.Buf8 = Array, e.Buf16 = Array, e.Buf32 = Array, e.assign(e, o));\n        }, e.setTyped(n);\n      },\n      373: function _(t, e, n) {\n        \"use strict\";\n\n        var r = n(236),\n          i = !0,\n          o = !0;\n        try {\n          String.fromCharCode.apply(null, [0]);\n        } catch (t) {\n          i = !1;\n        }\n        try {\n          String.fromCharCode.apply(null, new Uint8Array(1));\n        } catch (t) {\n          o = !1;\n        }\n        for (var s = new r.Buf8(256), a = 0; a < 256; a++) s[a] = a >= 252 ? 6 : a >= 248 ? 5 : a >= 240 ? 4 : a >= 224 ? 3 : a >= 192 ? 2 : 1;\n        function l(t, e) {\n          if (e < 65534 && (t.subarray && o || !t.subarray && i)) return String.fromCharCode.apply(null, r.shrinkBuf(t, e));\n          for (var n = \"\", s = 0; s < e; s++) n += String.fromCharCode(t[s]);\n          return n;\n        }\n        s[254] = s[254] = 1, e.string2buf = function (t) {\n          var e,\n            n,\n            i,\n            o,\n            s,\n            a = t.length,\n            l = 0;\n          for (o = 0; o < a; o++) 55296 == (64512 & (n = t.charCodeAt(o))) && o + 1 < a && 56320 == (64512 & (i = t.charCodeAt(o + 1))) && (n = 65536 + (n - 55296 << 10) + (i - 56320), o++), l += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;\n          for (e = new r.Buf8(l), s = 0, o = 0; s < l; o++) 55296 == (64512 & (n = t.charCodeAt(o))) && o + 1 < a && 56320 == (64512 & (i = t.charCodeAt(o + 1))) && (n = 65536 + (n - 55296 << 10) + (i - 56320), o++), n < 128 ? e[s++] = n : n < 2048 ? (e[s++] = 192 | n >>> 6, e[s++] = 128 | 63 & n) : n < 65536 ? (e[s++] = 224 | n >>> 12, e[s++] = 128 | n >>> 6 & 63, e[s++] = 128 | 63 & n) : (e[s++] = 240 | n >>> 18, e[s++] = 128 | n >>> 12 & 63, e[s++] = 128 | n >>> 6 & 63, e[s++] = 128 | 63 & n);\n          return e;\n        }, e.buf2binstring = function (t) {\n          return l(t, t.length);\n        }, e.binstring2buf = function (t) {\n          for (var e = new r.Buf8(t.length), n = 0, i = e.length; n < i; n++) e[n] = t.charCodeAt(n);\n          return e;\n        }, e.buf2string = function (t, e) {\n          var n,\n            r,\n            i,\n            o,\n            a = e || t.length,\n            h = new Array(2 * a);\n          for (r = 0, n = 0; n < a;) if ((i = t[n++]) < 128) h[r++] = i;else if ((o = s[i]) > 4) h[r++] = 65533, n += o - 1;else {\n            for (i &= 2 === o ? 31 : 3 === o ? 15 : 7; o > 1 && n < a;) i = i << 6 | 63 & t[n++], o--;\n            o > 1 ? h[r++] = 65533 : i < 65536 ? h[r++] = i : (i -= 65536, h[r++] = 55296 | i >> 10 & 1023, h[r++] = 56320 | 1023 & i);\n          }\n          return l(h, r);\n        }, e.utf8border = function (t, e) {\n          var n;\n          for ((e = e || t.length) > t.length && (e = t.length), n = e - 1; n >= 0 && 128 == (192 & t[n]);) n--;\n          return n < 0 || 0 === n ? e : n + s[t[n]] > e ? n : e;\n        };\n      },\n      69: function _(t) {\n        \"use strict\";\n\n        t.exports = function (t, e, n, r) {\n          for (var i = 65535 & t | 0, o = t >>> 16 & 65535 | 0, s = 0; 0 !== n;) {\n            n -= s = n > 2e3 ? 2e3 : n;\n            do {\n              o = o + (i = i + e[r++] | 0) | 0;\n            } while (--s);\n            i %= 65521, o %= 65521;\n          }\n          return i | o << 16 | 0;\n        };\n      },\n      619: function _(t) {\n        \"use strict\";\n\n        t.exports = {\n          Z_NO_FLUSH: 0,\n          Z_PARTIAL_FLUSH: 1,\n          Z_SYNC_FLUSH: 2,\n          Z_FULL_FLUSH: 3,\n          Z_FINISH: 4,\n          Z_BLOCK: 5,\n          Z_TREES: 6,\n          Z_OK: 0,\n          Z_STREAM_END: 1,\n          Z_NEED_DICT: 2,\n          Z_ERRNO: -1,\n          Z_STREAM_ERROR: -2,\n          Z_DATA_ERROR: -3,\n          Z_BUF_ERROR: -5,\n          Z_NO_COMPRESSION: 0,\n          Z_BEST_SPEED: 1,\n          Z_BEST_COMPRESSION: 9,\n          Z_DEFAULT_COMPRESSION: -1,\n          Z_FILTERED: 1,\n          Z_HUFFMAN_ONLY: 2,\n          Z_RLE: 3,\n          Z_FIXED: 4,\n          Z_DEFAULT_STRATEGY: 0,\n          Z_BINARY: 0,\n          Z_TEXT: 1,\n          Z_UNKNOWN: 2,\n          Z_DEFLATED: 8\n        };\n      },\n      869: function _(t) {\n        \"use strict\";\n\n        var e = function () {\n          for (var t, e = [], n = 0; n < 256; n++) {\n            t = n;\n            for (var r = 0; r < 8; r++) t = 1 & t ? 3988292384 ^ t >>> 1 : t >>> 1;\n            e[n] = t;\n          }\n          return e;\n        }();\n        t.exports = function (t, n, r, i) {\n          var o = e,\n            s = i + r;\n          t ^= -1;\n          for (var a = i; a < s; a++) t = t >>> 8 ^ o[255 & (t ^ n[a])];\n          return -1 ^ t;\n        };\n      },\n      405: function _(t, e, n) {\n        \"use strict\";\n\n        var r,\n          i = n(236),\n          o = n(342),\n          s = n(69),\n          a = n(869),\n          l = n(265),\n          h = 0,\n          u = 0,\n          f = -2,\n          c = 2,\n          d = 8,\n          g = 286,\n          p = 30,\n          m = 19,\n          y = 2 * g + 1,\n          b = 15,\n          w = 3,\n          v = 258,\n          _ = v + w + 1,\n          x = 42,\n          k = 103,\n          E = 113,\n          S = 666;\n        function A(t, e) {\n          return t.msg = l[e], e;\n        }\n        function M(t) {\n          return (t << 1) - (t > 4 ? 9 : 0);\n        }\n        function I(t) {\n          for (var e = t.length; --e >= 0;) t[e] = 0;\n        }\n        function R(t) {\n          var e = t.state,\n            n = e.pending;\n          n > t.avail_out && (n = t.avail_out), 0 !== n && (i.arraySet(t.output, e.pending_buf, e.pending_out, n, t.next_out), t.next_out += n, e.pending_out += n, t.total_out += n, t.avail_out -= n, e.pending -= n, 0 === e.pending && (e.pending_out = 0));\n        }\n        function B(t, e) {\n          o._tr_flush_block(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, e), t.block_start = t.strstart, R(t.strm);\n        }\n        function T(t, e) {\n          t.pending_buf[t.pending++] = e;\n        }\n        function O(t, e) {\n          t.pending_buf[t.pending++] = e >>> 8 & 255, t.pending_buf[t.pending++] = 255 & e;\n        }\n        function C(t, e) {\n          var n,\n            r,\n            i = t.max_chain_length,\n            o = t.strstart,\n            s = t.prev_length,\n            a = t.nice_match,\n            l = t.strstart > t.w_size - _ ? t.strstart - (t.w_size - _) : 0,\n            h = t.window,\n            u = t.w_mask,\n            f = t.prev,\n            c = t.strstart + v,\n            d = h[o + s - 1],\n            g = h[o + s];\n          t.prev_length >= t.good_match && (i >>= 2), a > t.lookahead && (a = t.lookahead);\n          do {\n            if (h[(n = e) + s] === g && h[n + s - 1] === d && h[n] === h[o] && h[++n] === h[o + 1]) {\n              o += 2, n++;\n              do {} while (h[++o] === h[++n] && h[++o] === h[++n] && h[++o] === h[++n] && h[++o] === h[++n] && h[++o] === h[++n] && h[++o] === h[++n] && h[++o] === h[++n] && h[++o] === h[++n] && o < c);\n              if (r = v - (c - o), o = c - v, r > s) {\n                if (t.match_start = e, s = r, r >= a) break;\n                d = h[o + s - 1], g = h[o + s];\n              }\n            }\n          } while ((e = f[e & u]) > l && 0 != --i);\n          return s <= t.lookahead ? s : t.lookahead;\n        }\n        function N(t) {\n          var e,\n            n,\n            r,\n            o,\n            l,\n            h,\n            u,\n            f,\n            c,\n            d,\n            g = t.w_size;\n          do {\n            if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= g + (g - _)) {\n              i.arraySet(t.window, t.window, g, g, 0), t.match_start -= g, t.strstart -= g, t.block_start -= g, e = n = t.hash_size;\n              do {\n                r = t.head[--e], t.head[e] = r >= g ? r - g : 0;\n              } while (--n);\n              e = n = g;\n              do {\n                r = t.prev[--e], t.prev[e] = r >= g ? r - g : 0;\n              } while (--n);\n              o += g;\n            }\n            if (0 === t.strm.avail_in) break;\n            if (h = t.strm, u = t.window, f = t.strstart + t.lookahead, c = o, d = void 0, (d = h.avail_in) > c && (d = c), n = 0 === d ? 0 : (h.avail_in -= d, i.arraySet(u, h.input, h.next_in, d, f), 1 === h.state.wrap ? h.adler = s(h.adler, u, d, f) : 2 === h.state.wrap && (h.adler = a(h.adler, u, d, f)), h.next_in += d, h.total_in += d, d), t.lookahead += n, t.lookahead + t.insert >= w) for (l = t.strstart - t.insert, t.ins_h = t.window[l], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[l + 1]) & t.hash_mask; t.insert && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[l + w - 1]) & t.hash_mask, t.prev[l & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = l, l++, t.insert--, !(t.lookahead + t.insert < w)););\n          } while (t.lookahead < _ && 0 !== t.strm.avail_in);\n        }\n        function z(t, e) {\n          for (var n, r;;) {\n            if (t.lookahead < _) {\n              if (N(t), t.lookahead < _ && e === h) return 1;\n              if (0 === t.lookahead) break;\n            }\n            if (n = 0, t.lookahead >= w && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + w - 1]) & t.hash_mask, n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), 0 !== n && t.strstart - n <= t.w_size - _ && (t.match_length = C(t, n)), t.match_length >= w) {\n              if (r = o._tr_tally(t, t.strstart - t.match_start, t.match_length - w), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= w) {\n                t.match_length--;\n                do {\n                  t.strstart++, t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + w - 1]) & t.hash_mask, n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;\n                } while (0 != --t.match_length);\n                t.strstart++;\n              } else t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + 1]) & t.hash_mask;\n            } else r = o._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;\n            if (r && (B(t, !1), 0 === t.strm.avail_out)) return 1;\n          }\n          return t.insert = t.strstart < w - 1 ? t.strstart : w - 1, 4 === e ? (B(t, !0), 0 === t.strm.avail_out ? 3 : 4) : t.last_lit && (B(t, !1), 0 === t.strm.avail_out) ? 1 : 2;\n        }\n        function L(t, e) {\n          for (var n, r, i;;) {\n            if (t.lookahead < _) {\n              if (N(t), t.lookahead < _ && e === h) return 1;\n              if (0 === t.lookahead) break;\n            }\n            if (n = 0, t.lookahead >= w && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + w - 1]) & t.hash_mask, n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = w - 1, 0 !== n && t.prev_length < t.max_lazy_match && t.strstart - n <= t.w_size - _ && (t.match_length = C(t, n), t.match_length <= 5 && (1 === t.strategy || t.match_length === w && t.strstart - t.match_start > 4096) && (t.match_length = w - 1)), t.prev_length >= w && t.match_length <= t.prev_length) {\n              i = t.strstart + t.lookahead - w, r = o._tr_tally(t, t.strstart - 1 - t.prev_match, t.prev_length - w), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;\n              do {\n                ++t.strstart <= i && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + w - 1]) & t.hash_mask, n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);\n              } while (0 != --t.prev_length);\n              if (t.match_available = 0, t.match_length = w - 1, t.strstart++, r && (B(t, !1), 0 === t.strm.avail_out)) return 1;\n            } else if (t.match_available) {\n              if ((r = o._tr_tally(t, 0, t.window[t.strstart - 1])) && B(t, !1), t.strstart++, t.lookahead--, 0 === t.strm.avail_out) return 1;\n            } else t.match_available = 1, t.strstart++, t.lookahead--;\n          }\n          return t.match_available && (r = o._tr_tally(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < w - 1 ? t.strstart : w - 1, 4 === e ? (B(t, !0), 0 === t.strm.avail_out ? 3 : 4) : t.last_lit && (B(t, !1), 0 === t.strm.avail_out) ? 1 : 2;\n        }\n        function P(t, e, n, r, i) {\n          this.good_length = t, this.max_lazy = e, this.nice_length = n, this.max_chain = r, this.func = i;\n        }\n        function U() {\n          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = d, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new i.Buf16(2 * y), this.dyn_dtree = new i.Buf16(2 * (2 * p + 1)), this.bl_tree = new i.Buf16(2 * (2 * m + 1)), I(this.dyn_ltree), I(this.dyn_dtree), I(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new i.Buf16(b + 1), this.heap = new i.Buf16(2 * g + 1), I(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new i.Buf16(2 * g + 1), I(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;\n        }\n        function $(t) {\n          var e;\n          return t && t.state ? (t.total_in = t.total_out = 0, t.data_type = c, (e = t.state).pending = 0, e.pending_out = 0, e.wrap < 0 && (e.wrap = -e.wrap), e.status = e.wrap ? x : E, t.adler = 2 === e.wrap ? 0 : 1, e.last_flush = h, o._tr_init(e), u) : A(t, f);\n        }\n        function j(t) {\n          var e,\n            n = $(t);\n          return n === u && ((e = t.state).window_size = 2 * e.w_size, I(e.head), e.max_lazy_match = r[e.level].max_lazy, e.good_match = r[e.level].good_length, e.nice_match = r[e.level].nice_length, e.max_chain_length = r[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = w - 1, e.match_available = 0, e.ins_h = 0), n;\n        }\n        function F(t, e, n, r, o, s) {\n          if (!t) return f;\n          var a = 1;\n          if (-1 === e && (e = 6), r < 0 ? (a = 0, r = -r) : r > 15 && (a = 2, r -= 16), o < 1 || o > 9 || n !== d || r < 8 || r > 15 || e < 0 || e > 9 || s < 0 || s > 4) return A(t, f);\n          8 === r && (r = 9);\n          var l = new U();\n          return t.state = l, l.strm = t, l.wrap = a, l.gzhead = null, l.w_bits = r, l.w_size = 1 << l.w_bits, l.w_mask = l.w_size - 1, l.hash_bits = o + 7, l.hash_size = 1 << l.hash_bits, l.hash_mask = l.hash_size - 1, l.hash_shift = ~~((l.hash_bits + w - 1) / w), l.window = new i.Buf8(2 * l.w_size), l.head = new i.Buf16(l.hash_size), l.prev = new i.Buf16(l.w_size), l.lit_bufsize = 1 << o + 6, l.pending_buf_size = 4 * l.lit_bufsize, l.pending_buf = new i.Buf8(l.pending_buf_size), l.d_buf = 1 * l.lit_bufsize, l.l_buf = 3 * l.lit_bufsize, l.level = e, l.strategy = s, l.method = n, j(t);\n        }\n        r = [new P(0, 0, 0, 0, function (t, e) {\n          var n = 65535;\n          for (n > t.pending_buf_size - 5 && (n = t.pending_buf_size - 5);;) {\n            if (t.lookahead <= 1) {\n              if (N(t), 0 === t.lookahead && e === h) return 1;\n              if (0 === t.lookahead) break;\n            }\n            t.strstart += t.lookahead, t.lookahead = 0;\n            var r = t.block_start + n;\n            if ((0 === t.strstart || t.strstart >= r) && (t.lookahead = t.strstart - r, t.strstart = r, B(t, !1), 0 === t.strm.avail_out)) return 1;\n            if (t.strstart - t.block_start >= t.w_size - _ && (B(t, !1), 0 === t.strm.avail_out)) return 1;\n          }\n          return t.insert = 0, 4 === e ? (B(t, !0), 0 === t.strm.avail_out ? 3 : 4) : (t.strstart > t.block_start && (B(t, !1), t.strm.avail_out), 1);\n        }), new P(4, 4, 8, 4, z), new P(4, 5, 16, 8, z), new P(4, 6, 32, 32, z), new P(4, 4, 16, 16, L), new P(8, 16, 32, 32, L), new P(8, 16, 128, 128, L), new P(8, 32, 128, 256, L), new P(32, 128, 258, 1024, L), new P(32, 258, 258, 4096, L)], e.deflateInit = function (t, e) {\n          return F(t, e, d, 15, 8, 0);\n        }, e.deflateInit2 = F, e.deflateReset = j, e.deflateResetKeep = $, e.deflateSetHeader = function (t, e) {\n          return t && t.state ? 2 !== t.state.wrap ? f : (t.state.gzhead = e, u) : f;\n        }, e.deflate = function (t, e) {\n          var n, i, s, l;\n          if (!t || !t.state || e > 5 || e < 0) return t ? A(t, f) : f;\n          if (i = t.state, !t.output || !t.input && 0 !== t.avail_in || i.status === S && 4 !== e) return A(t, 0 === t.avail_out ? -5 : f);\n          if (i.strm = t, n = i.last_flush, i.last_flush = e, i.status === x) if (2 === i.wrap) t.adler = 0, T(i, 31), T(i, 139), T(i, 8), i.gzhead ? (T(i, (i.gzhead.text ? 1 : 0) + (i.gzhead.hcrc ? 2 : 0) + (i.gzhead.extra ? 4 : 0) + (i.gzhead.name ? 8 : 0) + (i.gzhead.comment ? 16 : 0)), T(i, 255 & i.gzhead.time), T(i, i.gzhead.time >> 8 & 255), T(i, i.gzhead.time >> 16 & 255), T(i, i.gzhead.time >> 24 & 255), T(i, 9 === i.level ? 2 : i.strategy >= 2 || i.level < 2 ? 4 : 0), T(i, 255 & i.gzhead.os), i.gzhead.extra && i.gzhead.extra.length && (T(i, 255 & i.gzhead.extra.length), T(i, i.gzhead.extra.length >> 8 & 255)), i.gzhead.hcrc && (t.adler = a(t.adler, i.pending_buf, i.pending, 0)), i.gzindex = 0, i.status = 69) : (T(i, 0), T(i, 0), T(i, 0), T(i, 0), T(i, 0), T(i, 9 === i.level ? 2 : i.strategy >= 2 || i.level < 2 ? 4 : 0), T(i, 3), i.status = E);else {\n            var c = d + (i.w_bits - 8 << 4) << 8;\n            c |= (i.strategy >= 2 || i.level < 2 ? 0 : i.level < 6 ? 1 : 6 === i.level ? 2 : 3) << 6, 0 !== i.strstart && (c |= 32), c += 31 - c % 31, i.status = E, O(i, c), 0 !== i.strstart && (O(i, t.adler >>> 16), O(i, 65535 & t.adler)), t.adler = 1;\n          }\n          if (69 === i.status) if (i.gzhead.extra) {\n            for (s = i.pending; i.gzindex < (65535 & i.gzhead.extra.length) && (i.pending !== i.pending_buf_size || (i.gzhead.hcrc && i.pending > s && (t.adler = a(t.adler, i.pending_buf, i.pending - s, s)), R(t), s = i.pending, i.pending !== i.pending_buf_size));) T(i, 255 & i.gzhead.extra[i.gzindex]), i.gzindex++;\n            i.gzhead.hcrc && i.pending > s && (t.adler = a(t.adler, i.pending_buf, i.pending - s, s)), i.gzindex === i.gzhead.extra.length && (i.gzindex = 0, i.status = 73);\n          } else i.status = 73;\n          if (73 === i.status) if (i.gzhead.name) {\n            s = i.pending;\n            do {\n              if (i.pending === i.pending_buf_size && (i.gzhead.hcrc && i.pending > s && (t.adler = a(t.adler, i.pending_buf, i.pending - s, s)), R(t), s = i.pending, i.pending === i.pending_buf_size)) {\n                l = 1;\n                break;\n              }\n              l = i.gzindex < i.gzhead.name.length ? 255 & i.gzhead.name.charCodeAt(i.gzindex++) : 0, T(i, l);\n            } while (0 !== l);\n            i.gzhead.hcrc && i.pending > s && (t.adler = a(t.adler, i.pending_buf, i.pending - s, s)), 0 === l && (i.gzindex = 0, i.status = 91);\n          } else i.status = 91;\n          if (91 === i.status) if (i.gzhead.comment) {\n            s = i.pending;\n            do {\n              if (i.pending === i.pending_buf_size && (i.gzhead.hcrc && i.pending > s && (t.adler = a(t.adler, i.pending_buf, i.pending - s, s)), R(t), s = i.pending, i.pending === i.pending_buf_size)) {\n                l = 1;\n                break;\n              }\n              l = i.gzindex < i.gzhead.comment.length ? 255 & i.gzhead.comment.charCodeAt(i.gzindex++) : 0, T(i, l);\n            } while (0 !== l);\n            i.gzhead.hcrc && i.pending > s && (t.adler = a(t.adler, i.pending_buf, i.pending - s, s)), 0 === l && (i.status = k);\n          } else i.status = k;\n          if (i.status === k && (i.gzhead.hcrc ? (i.pending + 2 > i.pending_buf_size && R(t), i.pending + 2 <= i.pending_buf_size && (T(i, 255 & t.adler), T(i, t.adler >> 8 & 255), t.adler = 0, i.status = E)) : i.status = E), 0 !== i.pending) {\n            if (R(t), 0 === t.avail_out) return i.last_flush = -1, u;\n          } else if (0 === t.avail_in && M(e) <= M(n) && 4 !== e) return A(t, -5);\n          if (i.status === S && 0 !== t.avail_in) return A(t, -5);\n          if (0 !== t.avail_in || 0 !== i.lookahead || e !== h && i.status !== S) {\n            var g = 2 === i.strategy ? function (t, e) {\n              for (var n;;) {\n                if (0 === t.lookahead && (N(t), 0 === t.lookahead)) {\n                  if (e === h) return 1;\n                  break;\n                }\n                if (t.match_length = 0, n = o._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, n && (B(t, !1), 0 === t.strm.avail_out)) return 1;\n              }\n              return t.insert = 0, 4 === e ? (B(t, !0), 0 === t.strm.avail_out ? 3 : 4) : t.last_lit && (B(t, !1), 0 === t.strm.avail_out) ? 1 : 2;\n            }(i, e) : 3 === i.strategy ? function (t, e) {\n              for (var n, r, i, s, a = t.window;;) {\n                if (t.lookahead <= v) {\n                  if (N(t), t.lookahead <= v && e === h) return 1;\n                  if (0 === t.lookahead) break;\n                }\n                if (t.match_length = 0, t.lookahead >= w && t.strstart > 0 && (r = a[i = t.strstart - 1]) === a[++i] && r === a[++i] && r === a[++i]) {\n                  s = t.strstart + v;\n                  do {} while (r === a[++i] && r === a[++i] && r === a[++i] && r === a[++i] && r === a[++i] && r === a[++i] && r === a[++i] && r === a[++i] && i < s);\n                  t.match_length = v - (s - i), t.match_length > t.lookahead && (t.match_length = t.lookahead);\n                }\n                if (t.match_length >= w ? (n = o._tr_tally(t, 1, t.match_length - w), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (n = o._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), n && (B(t, !1), 0 === t.strm.avail_out)) return 1;\n              }\n              return t.insert = 0, 4 === e ? (B(t, !0), 0 === t.strm.avail_out ? 3 : 4) : t.last_lit && (B(t, !1), 0 === t.strm.avail_out) ? 1 : 2;\n            }(i, e) : r[i.level].func(i, e);\n            if (3 !== g && 4 !== g || (i.status = S), 1 === g || 3 === g) return 0 === t.avail_out && (i.last_flush = -1), u;\n            if (2 === g && (1 === e ? o._tr_align(i) : 5 !== e && (o._tr_stored_block(i, 0, 0, !1), 3 === e && (I(i.head), 0 === i.lookahead && (i.strstart = 0, i.block_start = 0, i.insert = 0))), R(t), 0 === t.avail_out)) return i.last_flush = -1, u;\n          }\n          return 4 !== e ? u : i.wrap <= 0 ? 1 : (2 === i.wrap ? (T(i, 255 & t.adler), T(i, t.adler >> 8 & 255), T(i, t.adler >> 16 & 255), T(i, t.adler >> 24 & 255), T(i, 255 & t.total_in), T(i, t.total_in >> 8 & 255), T(i, t.total_in >> 16 & 255), T(i, t.total_in >> 24 & 255)) : (O(i, t.adler >>> 16), O(i, 65535 & t.adler)), R(t), i.wrap > 0 && (i.wrap = -i.wrap), 0 !== i.pending ? u : 1);\n        }, e.deflateEnd = function (t) {\n          var e;\n          return t && t.state ? (e = t.state.status) !== x && 69 !== e && 73 !== e && 91 !== e && e !== k && e !== E && e !== S ? A(t, f) : (t.state = null, e === E ? A(t, -3) : u) : f;\n        }, e.deflateSetDictionary = function (t, e) {\n          var n,\n            r,\n            o,\n            a,\n            l,\n            h,\n            c,\n            d,\n            g = e.length;\n          if (!t || !t.state) return f;\n          if (2 === (a = (n = t.state).wrap) || 1 === a && n.status !== x || n.lookahead) return f;\n          for (1 === a && (t.adler = s(t.adler, e, g, 0)), n.wrap = 0, g >= n.w_size && (0 === a && (I(n.head), n.strstart = 0, n.block_start = 0, n.insert = 0), d = new i.Buf8(n.w_size), i.arraySet(d, e, g - n.w_size, n.w_size, 0), e = d, g = n.w_size), l = t.avail_in, h = t.next_in, c = t.input, t.avail_in = g, t.next_in = 0, t.input = e, N(n); n.lookahead >= w;) {\n            r = n.strstart, o = n.lookahead - (w - 1);\n            do {\n              n.ins_h = (n.ins_h << n.hash_shift ^ n.window[r + w - 1]) & n.hash_mask, n.prev[r & n.w_mask] = n.head[n.ins_h], n.head[n.ins_h] = r, r++;\n            } while (--o);\n            n.strstart = r, n.lookahead = w - 1, N(n);\n          }\n          return n.strstart += n.lookahead, n.block_start = n.strstart, n.insert = n.lookahead, n.lookahead = 0, n.match_length = n.prev_length = w - 1, n.match_available = 0, t.next_in = h, t.input = c, t.avail_in = l, n.wrap = a, u;\n        }, e.deflateInfo = \"pako deflate (from Nodeca project)\";\n      },\n      401: function _(t) {\n        \"use strict\";\n\n        t.exports = function () {\n          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = \"\", this.comment = \"\", this.hcrc = 0, this.done = !1;\n        };\n      },\n      264: function _(t) {\n        \"use strict\";\n\n        t.exports = function (t, e) {\n          var n, r, i, o, s, a, l, h, u, f, c, d, g, p, m, y, b, w, v, _, x, k, E, S, A;\n          n = t.state, r = t.next_in, S = t.input, i = r + (t.avail_in - 5), o = t.next_out, A = t.output, s = o - (e - t.avail_out), a = o + (t.avail_out - 257), l = n.dmax, h = n.wsize, u = n.whave, f = n.wnext, c = n.window, d = n.hold, g = n.bits, p = n.lencode, m = n.distcode, y = (1 << n.lenbits) - 1, b = (1 << n.distbits) - 1;\n          t: do {\n            g < 15 && (d += S[r++] << g, g += 8, d += S[r++] << g, g += 8), w = p[d & y];\n            e: for (;;) {\n              if (d >>>= v = w >>> 24, g -= v, 0 == (v = w >>> 16 & 255)) A[o++] = 65535 & w;else {\n                if (!(16 & v)) {\n                  if (0 == (64 & v)) {\n                    w = p[(65535 & w) + (d & (1 << v) - 1)];\n                    continue e;\n                  }\n                  if (32 & v) {\n                    n.mode = 12;\n                    break t;\n                  }\n                  t.msg = \"invalid literal/length code\", n.mode = 30;\n                  break t;\n                }\n                _ = 65535 & w, (v &= 15) && (g < v && (d += S[r++] << g, g += 8), _ += d & (1 << v) - 1, d >>>= v, g -= v), g < 15 && (d += S[r++] << g, g += 8, d += S[r++] << g, g += 8), w = m[d & b];\n                n: for (;;) {\n                  if (d >>>= v = w >>> 24, g -= v, !(16 & (v = w >>> 16 & 255))) {\n                    if (0 == (64 & v)) {\n                      w = m[(65535 & w) + (d & (1 << v) - 1)];\n                      continue n;\n                    }\n                    t.msg = \"invalid distance code\", n.mode = 30;\n                    break t;\n                  }\n                  if (x = 65535 & w, g < (v &= 15) && (d += S[r++] << g, (g += 8) < v && (d += S[r++] << g, g += 8)), (x += d & (1 << v) - 1) > l) {\n                    t.msg = \"invalid distance too far back\", n.mode = 30;\n                    break t;\n                  }\n                  if (d >>>= v, g -= v, x > (v = o - s)) {\n                    if ((v = x - v) > u && n.sane) {\n                      t.msg = \"invalid distance too far back\", n.mode = 30;\n                      break t;\n                    }\n                    if (k = 0, E = c, 0 === f) {\n                      if (k += h - v, v < _) {\n                        _ -= v;\n                        do {\n                          A[o++] = c[k++];\n                        } while (--v);\n                        k = o - x, E = A;\n                      }\n                    } else if (f < v) {\n                      if (k += h + f - v, (v -= f) < _) {\n                        _ -= v;\n                        do {\n                          A[o++] = c[k++];\n                        } while (--v);\n                        if (k = 0, f < _) {\n                          _ -= v = f;\n                          do {\n                            A[o++] = c[k++];\n                          } while (--v);\n                          k = o - x, E = A;\n                        }\n                      }\n                    } else if (k += f - v, v < _) {\n                      _ -= v;\n                      do {\n                        A[o++] = c[k++];\n                      } while (--v);\n                      k = o - x, E = A;\n                    }\n                    for (; _ > 2;) A[o++] = E[k++], A[o++] = E[k++], A[o++] = E[k++], _ -= 3;\n                    _ && (A[o++] = E[k++], _ > 1 && (A[o++] = E[k++]));\n                  } else {\n                    k = o - x;\n                    do {\n                      A[o++] = A[k++], A[o++] = A[k++], A[o++] = A[k++], _ -= 3;\n                    } while (_ > 2);\n                    _ && (A[o++] = A[k++], _ > 1 && (A[o++] = A[k++]));\n                  }\n                  break;\n                }\n              }\n              break;\n            }\n          } while (r < i && o < a);\n          r -= _ = g >> 3, d &= (1 << (g -= _ << 3)) - 1, t.next_in = r, t.next_out = o, t.avail_in = r < i ? i - r + 5 : 5 - (r - i), t.avail_out = o < a ? a - o + 257 : 257 - (o - a), n.hold = d, n.bits = g;\n        };\n      },\n      948: function _(t, e, n) {\n        \"use strict\";\n\n        var r = n(236),\n          i = n(69),\n          o = n(869),\n          s = n(264),\n          a = n(241),\n          l = 0,\n          h = -2,\n          u = 1,\n          f = 12,\n          c = 30,\n          d = 852,\n          g = 592;\n        function p(t) {\n          return (t >>> 24 & 255) + (t >>> 8 & 65280) + ((65280 & t) << 8) + ((255 & t) << 24);\n        }\n        function m() {\n          this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new r.Buf16(320), this.work = new r.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;\n        }\n        function y(t) {\n          var e;\n          return t && t.state ? (e = t.state, t.total_in = t.total_out = e.total = 0, t.msg = \"\", e.wrap && (t.adler = 1 & e.wrap), e.mode = u, e.last = 0, e.havedict = 0, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new r.Buf32(d), e.distcode = e.distdyn = new r.Buf32(g), e.sane = 1, e.back = -1, l) : h;\n        }\n        function b(t) {\n          var e;\n          return t && t.state ? ((e = t.state).wsize = 0, e.whave = 0, e.wnext = 0, y(t)) : h;\n        }\n        function w(t, e) {\n          var n, r;\n          return t && t.state ? (r = t.state, e < 0 ? (n = 0, e = -e) : (n = 1 + (e >> 4), e < 48 && (e &= 15)), e && (e < 8 || e > 15) ? h : (null !== r.window && r.wbits !== e && (r.window = null), r.wrap = n, r.wbits = e, b(t))) : h;\n        }\n        function v(t, e) {\n          var n, r;\n          return t ? (r = new m(), t.state = r, r.window = null, (n = w(t, e)) !== l && (t.state = null), n) : h;\n        }\n        var _,\n          x,\n          k = !0;\n        function E(t) {\n          if (k) {\n            var e;\n            for (_ = new r.Buf32(512), x = new r.Buf32(32), e = 0; e < 144;) t.lens[e++] = 8;\n            for (; e < 256;) t.lens[e++] = 9;\n            for (; e < 280;) t.lens[e++] = 7;\n            for (; e < 288;) t.lens[e++] = 8;\n            for (a(1, t.lens, 0, 288, _, 0, t.work, {\n              bits: 9\n            }), e = 0; e < 32;) t.lens[e++] = 5;\n            a(2, t.lens, 0, 32, x, 0, t.work, {\n              bits: 5\n            }), k = !1;\n          }\n          t.lencode = _, t.lenbits = 9, t.distcode = x, t.distbits = 5;\n        }\n        function S(t, e, n, i) {\n          var o,\n            s = t.state;\n          return null === s.window && (s.wsize = 1 << s.wbits, s.wnext = 0, s.whave = 0, s.window = new r.Buf8(s.wsize)), i >= s.wsize ? (r.arraySet(s.window, e, n - s.wsize, s.wsize, 0), s.wnext = 0, s.whave = s.wsize) : ((o = s.wsize - s.wnext) > i && (o = i), r.arraySet(s.window, e, n - i, o, s.wnext), (i -= o) ? (r.arraySet(s.window, e, n - i, i, 0), s.wnext = i, s.whave = s.wsize) : (s.wnext += o, s.wnext === s.wsize && (s.wnext = 0), s.whave < s.wsize && (s.whave += o))), 0;\n        }\n        e.inflateReset = b, e.inflateReset2 = w, e.inflateResetKeep = y, e.inflateInit = function (t) {\n          return v(t, 15);\n        }, e.inflateInit2 = v, e.inflate = function (t, e) {\n          var n,\n            d,\n            g,\n            m,\n            y,\n            b,\n            w,\n            v,\n            _,\n            x,\n            k,\n            A,\n            M,\n            I,\n            R,\n            B,\n            T,\n            O,\n            C,\n            N,\n            z,\n            L,\n            P,\n            U,\n            $ = 0,\n            j = new r.Buf8(4),\n            F = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];\n          if (!t || !t.state || !t.output || !t.input && 0 !== t.avail_in) return h;\n          (n = t.state).mode === f && (n.mode = 13), y = t.next_out, g = t.output, w = t.avail_out, m = t.next_in, d = t.input, b = t.avail_in, v = n.hold, _ = n.bits, x = b, k = w, L = l;\n          t: for (;;) switch (n.mode) {\n            case u:\n              if (0 === n.wrap) {\n                n.mode = 13;\n                break;\n              }\n              for (; _ < 16;) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              if (2 & n.wrap && 35615 === v) {\n                n.check = 0, j[0] = 255 & v, j[1] = v >>> 8 & 255, n.check = o(n.check, j, 2, 0), v = 0, _ = 0, n.mode = 2;\n                break;\n              }\n              if (n.flags = 0, n.head && (n.head.done = !1), !(1 & n.wrap) || (((255 & v) << 8) + (v >> 8)) % 31) {\n                t.msg = \"incorrect header check\", n.mode = c;\n                break;\n              }\n              if (8 != (15 & v)) {\n                t.msg = \"unknown compression method\", n.mode = c;\n                break;\n              }\n              if (_ -= 4, z = 8 + (15 & (v >>>= 4)), 0 === n.wbits) n.wbits = z;else if (z > n.wbits) {\n                t.msg = \"invalid window size\", n.mode = c;\n                break;\n              }\n              n.dmax = 1 << z, t.adler = n.check = 1, n.mode = 512 & v ? 10 : f, v = 0, _ = 0;\n              break;\n            case 2:\n              for (; _ < 16;) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              if (n.flags = v, 8 != (255 & n.flags)) {\n                t.msg = \"unknown compression method\", n.mode = c;\n                break;\n              }\n              if (57344 & n.flags) {\n                t.msg = \"unknown header flags set\", n.mode = c;\n                break;\n              }\n              n.head && (n.head.text = v >> 8 & 1), 512 & n.flags && (j[0] = 255 & v, j[1] = v >>> 8 & 255, n.check = o(n.check, j, 2, 0)), v = 0, _ = 0, n.mode = 3;\n            case 3:\n              for (; _ < 32;) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              n.head && (n.head.time = v), 512 & n.flags && (j[0] = 255 & v, j[1] = v >>> 8 & 255, j[2] = v >>> 16 & 255, j[3] = v >>> 24 & 255, n.check = o(n.check, j, 4, 0)), v = 0, _ = 0, n.mode = 4;\n            case 4:\n              for (; _ < 16;) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              n.head && (n.head.xflags = 255 & v, n.head.os = v >> 8), 512 & n.flags && (j[0] = 255 & v, j[1] = v >>> 8 & 255, n.check = o(n.check, j, 2, 0)), v = 0, _ = 0, n.mode = 5;\n            case 5:\n              if (1024 & n.flags) {\n                for (; _ < 16;) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                n.length = v, n.head && (n.head.extra_len = v), 512 & n.flags && (j[0] = 255 & v, j[1] = v >>> 8 & 255, n.check = o(n.check, j, 2, 0)), v = 0, _ = 0;\n              } else n.head && (n.head.extra = null);\n              n.mode = 6;\n            case 6:\n              if (1024 & n.flags && ((A = n.length) > b && (A = b), A && (n.head && (z = n.head.extra_len - n.length, n.head.extra || (n.head.extra = new Array(n.head.extra_len)), r.arraySet(n.head.extra, d, m, A, z)), 512 & n.flags && (n.check = o(n.check, d, A, m)), b -= A, m += A, n.length -= A), n.length)) break t;\n              n.length = 0, n.mode = 7;\n            case 7:\n              if (2048 & n.flags) {\n                if (0 === b) break t;\n                A = 0;\n                do {\n                  z = d[m + A++], n.head && z && n.length < 65536 && (n.head.name += String.fromCharCode(z));\n                } while (z && A < b);\n                if (512 & n.flags && (n.check = o(n.check, d, A, m)), b -= A, m += A, z) break t;\n              } else n.head && (n.head.name = null);\n              n.length = 0, n.mode = 8;\n            case 8:\n              if (4096 & n.flags) {\n                if (0 === b) break t;\n                A = 0;\n                do {\n                  z = d[m + A++], n.head && z && n.length < 65536 && (n.head.comment += String.fromCharCode(z));\n                } while (z && A < b);\n                if (512 & n.flags && (n.check = o(n.check, d, A, m)), b -= A, m += A, z) break t;\n              } else n.head && (n.head.comment = null);\n              n.mode = 9;\n            case 9:\n              if (512 & n.flags) {\n                for (; _ < 16;) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                if (v !== (65535 & n.check)) {\n                  t.msg = \"header crc mismatch\", n.mode = c;\n                  break;\n                }\n                v = 0, _ = 0;\n              }\n              n.head && (n.head.hcrc = n.flags >> 9 & 1, n.head.done = !0), t.adler = n.check = 0, n.mode = f;\n              break;\n            case 10:\n              for (; _ < 32;) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              t.adler = n.check = p(v), v = 0, _ = 0, n.mode = 11;\n            case 11:\n              if (0 === n.havedict) return t.next_out = y, t.avail_out = w, t.next_in = m, t.avail_in = b, n.hold = v, n.bits = _, 2;\n              t.adler = n.check = 1, n.mode = f;\n            case f:\n              if (5 === e || 6 === e) break t;\n            case 13:\n              if (n.last) {\n                v >>>= 7 & _, _ -= 7 & _, n.mode = 27;\n                break;\n              }\n              for (; _ < 3;) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              switch (n.last = 1 & v, _ -= 1, 3 & (v >>>= 1)) {\n                case 0:\n                  n.mode = 14;\n                  break;\n                case 1:\n                  if (E(n), n.mode = 20, 6 === e) {\n                    v >>>= 2, _ -= 2;\n                    break t;\n                  }\n                  break;\n                case 2:\n                  n.mode = 17;\n                  break;\n                case 3:\n                  t.msg = \"invalid block type\", n.mode = c;\n              }\n              v >>>= 2, _ -= 2;\n              break;\n            case 14:\n              for (v >>>= 7 & _, _ -= 7 & _; _ < 32;) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              if ((65535 & v) != (v >>> 16 ^ 65535)) {\n                t.msg = \"invalid stored block lengths\", n.mode = c;\n                break;\n              }\n              if (n.length = 65535 & v, v = 0, _ = 0, n.mode = 15, 6 === e) break t;\n            case 15:\n              n.mode = 16;\n            case 16:\n              if (A = n.length) {\n                if (A > b && (A = b), A > w && (A = w), 0 === A) break t;\n                r.arraySet(g, d, m, A, y), b -= A, m += A, w -= A, y += A, n.length -= A;\n                break;\n              }\n              n.mode = f;\n              break;\n            case 17:\n              for (; _ < 14;) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              if (n.nlen = 257 + (31 & v), v >>>= 5, _ -= 5, n.ndist = 1 + (31 & v), v >>>= 5, _ -= 5, n.ncode = 4 + (15 & v), v >>>= 4, _ -= 4, n.nlen > 286 || n.ndist > 30) {\n                t.msg = \"too many length or distance symbols\", n.mode = c;\n                break;\n              }\n              n.have = 0, n.mode = 18;\n            case 18:\n              for (; n.have < n.ncode;) {\n                for (; _ < 3;) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                n.lens[F[n.have++]] = 7 & v, v >>>= 3, _ -= 3;\n              }\n              for (; n.have < 19;) n.lens[F[n.have++]] = 0;\n              if (n.lencode = n.lendyn, n.lenbits = 7, P = {\n                bits: n.lenbits\n              }, L = a(0, n.lens, 0, 19, n.lencode, 0, n.work, P), n.lenbits = P.bits, L) {\n                t.msg = \"invalid code lengths set\", n.mode = c;\n                break;\n              }\n              n.have = 0, n.mode = 19;\n            case 19:\n              for (; n.have < n.nlen + n.ndist;) {\n                for (; B = ($ = n.lencode[v & (1 << n.lenbits) - 1]) >>> 16 & 255, T = 65535 & $, !((R = $ >>> 24) <= _);) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                if (T < 16) v >>>= R, _ -= R, n.lens[n.have++] = T;else {\n                  if (16 === T) {\n                    for (U = R + 2; _ < U;) {\n                      if (0 === b) break t;\n                      b--, v += d[m++] << _, _ += 8;\n                    }\n                    if (v >>>= R, _ -= R, 0 === n.have) {\n                      t.msg = \"invalid bit length repeat\", n.mode = c;\n                      break;\n                    }\n                    z = n.lens[n.have - 1], A = 3 + (3 & v), v >>>= 2, _ -= 2;\n                  } else if (17 === T) {\n                    for (U = R + 3; _ < U;) {\n                      if (0 === b) break t;\n                      b--, v += d[m++] << _, _ += 8;\n                    }\n                    _ -= R, z = 0, A = 3 + (7 & (v >>>= R)), v >>>= 3, _ -= 3;\n                  } else {\n                    for (U = R + 7; _ < U;) {\n                      if (0 === b) break t;\n                      b--, v += d[m++] << _, _ += 8;\n                    }\n                    _ -= R, z = 0, A = 11 + (127 & (v >>>= R)), v >>>= 7, _ -= 7;\n                  }\n                  if (n.have + A > n.nlen + n.ndist) {\n                    t.msg = \"invalid bit length repeat\", n.mode = c;\n                    break;\n                  }\n                  for (; A--;) n.lens[n.have++] = z;\n                }\n              }\n              if (n.mode === c) break;\n              if (0 === n.lens[256]) {\n                t.msg = \"invalid code -- missing end-of-block\", n.mode = c;\n                break;\n              }\n              if (n.lenbits = 9, P = {\n                bits: n.lenbits\n              }, L = a(1, n.lens, 0, n.nlen, n.lencode, 0, n.work, P), n.lenbits = P.bits, L) {\n                t.msg = \"invalid literal/lengths set\", n.mode = c;\n                break;\n              }\n              if (n.distbits = 6, n.distcode = n.distdyn, P = {\n                bits: n.distbits\n              }, L = a(2, n.lens, n.nlen, n.ndist, n.distcode, 0, n.work, P), n.distbits = P.bits, L) {\n                t.msg = \"invalid distances set\", n.mode = c;\n                break;\n              }\n              if (n.mode = 20, 6 === e) break t;\n            case 20:\n              n.mode = 21;\n            case 21:\n              if (b >= 6 && w >= 258) {\n                t.next_out = y, t.avail_out = w, t.next_in = m, t.avail_in = b, n.hold = v, n.bits = _, s(t, k), y = t.next_out, g = t.output, w = t.avail_out, m = t.next_in, d = t.input, b = t.avail_in, v = n.hold, _ = n.bits, n.mode === f && (n.back = -1);\n                break;\n              }\n              for (n.back = 0; B = ($ = n.lencode[v & (1 << n.lenbits) - 1]) >>> 16 & 255, T = 65535 & $, !((R = $ >>> 24) <= _);) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              if (B && 0 == (240 & B)) {\n                for (O = R, C = B, N = T; B = ($ = n.lencode[N + ((v & (1 << O + C) - 1) >> O)]) >>> 16 & 255, T = 65535 & $, !(O + (R = $ >>> 24) <= _);) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                v >>>= O, _ -= O, n.back += O;\n              }\n              if (v >>>= R, _ -= R, n.back += R, n.length = T, 0 === B) {\n                n.mode = 26;\n                break;\n              }\n              if (32 & B) {\n                n.back = -1, n.mode = f;\n                break;\n              }\n              if (64 & B) {\n                t.msg = \"invalid literal/length code\", n.mode = c;\n                break;\n              }\n              n.extra = 15 & B, n.mode = 22;\n            case 22:\n              if (n.extra) {\n                for (U = n.extra; _ < U;) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                n.length += v & (1 << n.extra) - 1, v >>>= n.extra, _ -= n.extra, n.back += n.extra;\n              }\n              n.was = n.length, n.mode = 23;\n            case 23:\n              for (; B = ($ = n.distcode[v & (1 << n.distbits) - 1]) >>> 16 & 255, T = 65535 & $, !((R = $ >>> 24) <= _);) {\n                if (0 === b) break t;\n                b--, v += d[m++] << _, _ += 8;\n              }\n              if (0 == (240 & B)) {\n                for (O = R, C = B, N = T; B = ($ = n.distcode[N + ((v & (1 << O + C) - 1) >> O)]) >>> 16 & 255, T = 65535 & $, !(O + (R = $ >>> 24) <= _);) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                v >>>= O, _ -= O, n.back += O;\n              }\n              if (v >>>= R, _ -= R, n.back += R, 64 & B) {\n                t.msg = \"invalid distance code\", n.mode = c;\n                break;\n              }\n              n.offset = T, n.extra = 15 & B, n.mode = 24;\n            case 24:\n              if (n.extra) {\n                for (U = n.extra; _ < U;) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                n.offset += v & (1 << n.extra) - 1, v >>>= n.extra, _ -= n.extra, n.back += n.extra;\n              }\n              if (n.offset > n.dmax) {\n                t.msg = \"invalid distance too far back\", n.mode = c;\n                break;\n              }\n              n.mode = 25;\n            case 25:\n              if (0 === w) break t;\n              if (A = k - w, n.offset > A) {\n                if ((A = n.offset - A) > n.whave && n.sane) {\n                  t.msg = \"invalid distance too far back\", n.mode = c;\n                  break;\n                }\n                A > n.wnext ? (A -= n.wnext, M = n.wsize - A) : M = n.wnext - A, A > n.length && (A = n.length), I = n.window;\n              } else I = g, M = y - n.offset, A = n.length;\n              A > w && (A = w), w -= A, n.length -= A;\n              do {\n                g[y++] = I[M++];\n              } while (--A);\n              0 === n.length && (n.mode = 21);\n              break;\n            case 26:\n              if (0 === w) break t;\n              g[y++] = n.length, w--, n.mode = 21;\n              break;\n            case 27:\n              if (n.wrap) {\n                for (; _ < 32;) {\n                  if (0 === b) break t;\n                  b--, v |= d[m++] << _, _ += 8;\n                }\n                if (k -= w, t.total_out += k, n.total += k, k && (t.adler = n.check = n.flags ? o(n.check, g, k, y - k) : i(n.check, g, k, y - k)), k = w, (n.flags ? v : p(v)) !== n.check) {\n                  t.msg = \"incorrect data check\", n.mode = c;\n                  break;\n                }\n                v = 0, _ = 0;\n              }\n              n.mode = 28;\n            case 28:\n              if (n.wrap && n.flags) {\n                for (; _ < 32;) {\n                  if (0 === b) break t;\n                  b--, v += d[m++] << _, _ += 8;\n                }\n                if (v !== (4294967295 & n.total)) {\n                  t.msg = \"incorrect length check\", n.mode = c;\n                  break;\n                }\n                v = 0, _ = 0;\n              }\n              n.mode = 29;\n            case 29:\n              L = 1;\n              break t;\n            case c:\n              L = -3;\n              break t;\n            case 31:\n              return -4;\n            default:\n              return h;\n          }\n          return t.next_out = y, t.avail_out = w, t.next_in = m, t.avail_in = b, n.hold = v, n.bits = _, (n.wsize || k !== t.avail_out && n.mode < c && (n.mode < 27 || 4 !== e)) && S(t, t.output, t.next_out, k - t.avail_out) ? (n.mode = 31, -4) : (x -= t.avail_in, k -= t.avail_out, t.total_in += x, t.total_out += k, n.total += k, n.wrap && k && (t.adler = n.check = n.flags ? o(n.check, g, k, t.next_out - k) : i(n.check, g, k, t.next_out - k)), t.data_type = n.bits + (n.last ? 64 : 0) + (n.mode === f ? 128 : 0) + (20 === n.mode || 15 === n.mode ? 256 : 0), (0 === x && 0 === k || 4 === e) && L === l && (L = -5), L);\n        }, e.inflateEnd = function (t) {\n          if (!t || !t.state) return h;\n          var e = t.state;\n          return e.window && (e.window = null), t.state = null, l;\n        }, e.inflateGetHeader = function (t, e) {\n          var n;\n          return t && t.state ? 0 == (2 & (n = t.state).wrap) ? h : (n.head = e, e.done = !1, l) : h;\n        }, e.inflateSetDictionary = function (t, e) {\n          var n,\n            r = e.length;\n          return t && t.state ? 0 !== (n = t.state).wrap && 11 !== n.mode ? h : 11 === n.mode && i(1, e, r, 0) !== n.check ? -3 : S(t, e, r, r) ? (n.mode = 31, -4) : (n.havedict = 1, l) : h;\n        }, e.inflateInfo = \"pako inflate (from Nodeca project)\";\n      },\n      241: function _(t, e, n) {\n        \"use strict\";\n\n        var r = n(236),\n          i = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0],\n          o = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78],\n          s = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0],\n          a = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];\n        t.exports = function (t, e, n, l, h, u, f, c) {\n          var d,\n            g,\n            p,\n            m,\n            y,\n            b,\n            w,\n            v,\n            _,\n            x = c.bits,\n            k = 0,\n            E = 0,\n            S = 0,\n            A = 0,\n            M = 0,\n            I = 0,\n            R = 0,\n            B = 0,\n            T = 0,\n            O = 0,\n            C = null,\n            N = 0,\n            z = new r.Buf16(16),\n            L = new r.Buf16(16),\n            P = null,\n            U = 0;\n          for (k = 0; k <= 15; k++) z[k] = 0;\n          for (E = 0; E < l; E++) z[e[n + E]]++;\n          for (M = x, A = 15; A >= 1 && 0 === z[A]; A--);\n          if (M > A && (M = A), 0 === A) return h[u++] = 20971520, h[u++] = 20971520, c.bits = 1, 0;\n          for (S = 1; S < A && 0 === z[S]; S++);\n          for (M < S && (M = S), B = 1, k = 1; k <= 15; k++) if (B <<= 1, (B -= z[k]) < 0) return -1;\n          if (B > 0 && (0 === t || 1 !== A)) return -1;\n          for (L[1] = 0, k = 1; k < 15; k++) L[k + 1] = L[k] + z[k];\n          for (E = 0; E < l; E++) 0 !== e[n + E] && (f[L[e[n + E]]++] = E);\n          if (0 === t ? (C = P = f, b = 19) : 1 === t ? (C = i, N -= 257, P = o, U -= 257, b = 256) : (C = s, P = a, b = -1), O = 0, E = 0, k = S, y = u, I = M, R = 0, p = -1, m = (T = 1 << M) - 1, 1 === t && T > 852 || 2 === t && T > 592) return 1;\n          for (;;) {\n            w = k - R, f[E] < b ? (v = 0, _ = f[E]) : f[E] > b ? (v = P[U + f[E]], _ = C[N + f[E]]) : (v = 96, _ = 0), d = 1 << k - R, S = g = 1 << I;\n            do {\n              h[y + (O >> R) + (g -= d)] = w << 24 | v << 16 | _ | 0;\n            } while (0 !== g);\n            for (d = 1 << k - 1; O & d;) d >>= 1;\n            if (0 !== d ? (O &= d - 1, O += d) : O = 0, E++, 0 == --z[k]) {\n              if (k === A) break;\n              k = e[n + f[E]];\n            }\n            if (k > M && (O & m) !== p) {\n              for (0 === R && (R = M), y += S, B = 1 << (I = k - R); I + R < A && !((B -= z[I + R]) <= 0);) I++, B <<= 1;\n              if (T += 1 << I, 1 === t && T > 852 || 2 === t && T > 592) return 1;\n              h[p = O & m] = M << 24 | I << 16 | y - u | 0;\n            }\n          }\n          return 0 !== O && (h[y + O] = k - R << 24 | 64 << 16 | 0), c.bits = M, 0;\n        };\n      },\n      265: function _(t) {\n        \"use strict\";\n\n        t.exports = {\n          2: \"need dictionary\",\n          1: \"stream end\",\n          0: \"\",\n          \"-1\": \"file error\",\n          \"-2\": \"stream error\",\n          \"-3\": \"data error\",\n          \"-4\": \"insufficient memory\",\n          \"-5\": \"buffer error\",\n          \"-6\": \"incompatible version\"\n        };\n      },\n      342: function _(t, e, n) {\n        \"use strict\";\n\n        var r = n(236);\n        function i(t) {\n          for (var e = t.length; --e >= 0;) t[e] = 0;\n        }\n        var o = 256,\n          s = 286,\n          a = 30,\n          l = 15,\n          h = 16,\n          u = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0],\n          f = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],\n          c = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7],\n          d = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],\n          g = new Array(576);\n        i(g);\n        var p = new Array(60);\n        i(p);\n        var m = new Array(512);\n        i(m);\n        var y = new Array(256);\n        i(y);\n        var b = new Array(29);\n        i(b);\n        var w,\n          v,\n          _,\n          x = new Array(a);\n        function k(t, e, n, r, i) {\n          this.static_tree = t, this.extra_bits = e, this.extra_base = n, this.elems = r, this.max_length = i, this.has_stree = t && t.length;\n        }\n        function E(t, e) {\n          this.dyn_tree = t, this.max_code = 0, this.stat_desc = e;\n        }\n        function S(t) {\n          return t < 256 ? m[t] : m[256 + (t >>> 7)];\n        }\n        function A(t, e) {\n          t.pending_buf[t.pending++] = 255 & e, t.pending_buf[t.pending++] = e >>> 8 & 255;\n        }\n        function M(t, e, n) {\n          t.bi_valid > h - n ? (t.bi_buf |= e << t.bi_valid & 65535, A(t, t.bi_buf), t.bi_buf = e >> h - t.bi_valid, t.bi_valid += n - h) : (t.bi_buf |= e << t.bi_valid & 65535, t.bi_valid += n);\n        }\n        function I(t, e, n) {\n          M(t, n[2 * e], n[2 * e + 1]);\n        }\n        function R(t, e) {\n          var n = 0;\n          do {\n            n |= 1 & t, t >>>= 1, n <<= 1;\n          } while (--e > 0);\n          return n >>> 1;\n        }\n        function B(t, e, n) {\n          var r,\n            i,\n            o = new Array(l + 1),\n            s = 0;\n          for (r = 1; r <= l; r++) o[r] = s = s + n[r - 1] << 1;\n          for (i = 0; i <= e; i++) {\n            var a = t[2 * i + 1];\n            0 !== a && (t[2 * i] = R(o[a]++, a));\n          }\n        }\n        function T(t) {\n          var e;\n          for (e = 0; e < s; e++) t.dyn_ltree[2 * e] = 0;\n          for (e = 0; e < a; e++) t.dyn_dtree[2 * e] = 0;\n          for (e = 0; e < 19; e++) t.bl_tree[2 * e] = 0;\n          t.dyn_ltree[512] = 1, t.opt_len = t.static_len = 0, t.last_lit = t.matches = 0;\n        }\n        function O(t) {\n          t.bi_valid > 8 ? A(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;\n        }\n        function C(t, e, n, r) {\n          var i = 2 * e,\n            o = 2 * n;\n          return t[i] < t[o] || t[i] === t[o] && r[e] <= r[n];\n        }\n        function N(t, e, n) {\n          for (var r = t.heap[n], i = n << 1; i <= t.heap_len && (i < t.heap_len && C(e, t.heap[i + 1], t.heap[i], t.depth) && i++, !C(e, r, t.heap[i], t.depth));) t.heap[n] = t.heap[i], n = i, i <<= 1;\n          t.heap[n] = r;\n        }\n        function z(t, e, n) {\n          var r,\n            i,\n            s,\n            a,\n            l = 0;\n          if (0 !== t.last_lit) do {\n            r = t.pending_buf[t.d_buf + 2 * l] << 8 | t.pending_buf[t.d_buf + 2 * l + 1], i = t.pending_buf[t.l_buf + l], l++, 0 === r ? I(t, i, e) : (I(t, (s = y[i]) + o + 1, e), 0 !== (a = u[s]) && M(t, i -= b[s], a), I(t, s = S(--r), n), 0 !== (a = f[s]) && M(t, r -= x[s], a));\n          } while (l < t.last_lit);\n          I(t, 256, e);\n        }\n        function L(t, e) {\n          var n,\n            r,\n            i,\n            o = e.dyn_tree,\n            s = e.stat_desc.static_tree,\n            a = e.stat_desc.has_stree,\n            h = e.stat_desc.elems,\n            u = -1;\n          for (t.heap_len = 0, t.heap_max = 573, n = 0; n < h; n++) 0 !== o[2 * n] ? (t.heap[++t.heap_len] = u = n, t.depth[n] = 0) : o[2 * n + 1] = 0;\n          for (; t.heap_len < 2;) o[2 * (i = t.heap[++t.heap_len] = u < 2 ? ++u : 0)] = 1, t.depth[i] = 0, t.opt_len--, a && (t.static_len -= s[2 * i + 1]);\n          for (e.max_code = u, n = t.heap_len >> 1; n >= 1; n--) N(t, o, n);\n          i = h;\n          do {\n            n = t.heap[1], t.heap[1] = t.heap[t.heap_len--], N(t, o, 1), r = t.heap[1], t.heap[--t.heap_max] = n, t.heap[--t.heap_max] = r, o[2 * i] = o[2 * n] + o[2 * r], t.depth[i] = (t.depth[n] >= t.depth[r] ? t.depth[n] : t.depth[r]) + 1, o[2 * n + 1] = o[2 * r + 1] = i, t.heap[1] = i++, N(t, o, 1);\n          } while (t.heap_len >= 2);\n          t.heap[--t.heap_max] = t.heap[1], function (t, e) {\n            var n,\n              r,\n              i,\n              o,\n              s,\n              a,\n              h = e.dyn_tree,\n              u = e.max_code,\n              f = e.stat_desc.static_tree,\n              c = e.stat_desc.has_stree,\n              d = e.stat_desc.extra_bits,\n              g = e.stat_desc.extra_base,\n              p = e.stat_desc.max_length,\n              m = 0;\n            for (o = 0; o <= l; o++) t.bl_count[o] = 0;\n            for (h[2 * t.heap[t.heap_max] + 1] = 0, n = t.heap_max + 1; n < 573; n++) (o = h[2 * h[2 * (r = t.heap[n]) + 1] + 1] + 1) > p && (o = p, m++), h[2 * r + 1] = o, r > u || (t.bl_count[o]++, s = 0, r >= g && (s = d[r - g]), a = h[2 * r], t.opt_len += a * (o + s), c && (t.static_len += a * (f[2 * r + 1] + s)));\n            if (0 !== m) {\n              do {\n                for (o = p - 1; 0 === t.bl_count[o];) o--;\n                t.bl_count[o]--, t.bl_count[o + 1] += 2, t.bl_count[p]--, m -= 2;\n              } while (m > 0);\n              for (o = p; 0 !== o; o--) for (r = t.bl_count[o]; 0 !== r;) (i = t.heap[--n]) > u || (h[2 * i + 1] !== o && (t.opt_len += (o - h[2 * i + 1]) * h[2 * i], h[2 * i + 1] = o), r--);\n            }\n          }(t, e), B(o, u, t.bl_count);\n        }\n        function P(t, e, n) {\n          var r,\n            i,\n            o = -1,\n            s = e[1],\n            a = 0,\n            l = 7,\n            h = 4;\n          for (0 === s && (l = 138, h = 3), e[2 * (n + 1) + 1] = 65535, r = 0; r <= n; r++) i = s, s = e[2 * (r + 1) + 1], ++a < l && i === s || (a < h ? t.bl_tree[2 * i] += a : 0 !== i ? (i !== o && t.bl_tree[2 * i]++, t.bl_tree[32]++) : a <= 10 ? t.bl_tree[34]++ : t.bl_tree[36]++, a = 0, o = i, 0 === s ? (l = 138, h = 3) : i === s ? (l = 6, h = 3) : (l = 7, h = 4));\n        }\n        function U(t, e, n) {\n          var r,\n            i,\n            o = -1,\n            s = e[1],\n            a = 0,\n            l = 7,\n            h = 4;\n          for (0 === s && (l = 138, h = 3), r = 0; r <= n; r++) if (i = s, s = e[2 * (r + 1) + 1], !(++a < l && i === s)) {\n            if (a < h) do {\n              I(t, i, t.bl_tree);\n            } while (0 != --a);else 0 !== i ? (i !== o && (I(t, i, t.bl_tree), a--), I(t, 16, t.bl_tree), M(t, a - 3, 2)) : a <= 10 ? (I(t, 17, t.bl_tree), M(t, a - 3, 3)) : (I(t, 18, t.bl_tree), M(t, a - 11, 7));\n            a = 0, o = i, 0 === s ? (l = 138, h = 3) : i === s ? (l = 6, h = 3) : (l = 7, h = 4);\n          }\n        }\n        i(x);\n        var $ = !1;\n        function j(t, e, n, i) {\n          M(t, 0 + (i ? 1 : 0), 3), function (t, e, n, i) {\n            O(t), A(t, n), A(t, ~n), r.arraySet(t.pending_buf, t.window, e, n, t.pending), t.pending += n;\n          }(t, e, n);\n        }\n        e._tr_init = function (t) {\n          $ || (function () {\n            var t,\n              e,\n              n,\n              r,\n              i,\n              o = new Array(l + 1);\n            for (n = 0, r = 0; r < 28; r++) for (b[r] = n, t = 0; t < 1 << u[r]; t++) y[n++] = r;\n            for (y[n - 1] = r, i = 0, r = 0; r < 16; r++) for (x[r] = i, t = 0; t < 1 << f[r]; t++) m[i++] = r;\n            for (i >>= 7; r < a; r++) for (x[r] = i << 7, t = 0; t < 1 << f[r] - 7; t++) m[256 + i++] = r;\n            for (e = 0; e <= l; e++) o[e] = 0;\n            for (t = 0; t <= 143;) g[2 * t + 1] = 8, t++, o[8]++;\n            for (; t <= 255;) g[2 * t + 1] = 9, t++, o[9]++;\n            for (; t <= 279;) g[2 * t + 1] = 7, t++, o[7]++;\n            for (; t <= 287;) g[2 * t + 1] = 8, t++, o[8]++;\n            for (B(g, 287, o), t = 0; t < a; t++) p[2 * t + 1] = 5, p[2 * t] = R(t, 5);\n            w = new k(g, u, 257, s, l), v = new k(p, f, 0, a, l), _ = new k(new Array(0), c, 0, 19, 7);\n          }(), $ = !0), t.l_desc = new E(t.dyn_ltree, w), t.d_desc = new E(t.dyn_dtree, v), t.bl_desc = new E(t.bl_tree, _), t.bi_buf = 0, t.bi_valid = 0, T(t);\n        }, e._tr_stored_block = j, e._tr_flush_block = function (t, e, n, r) {\n          var i,\n            s,\n            a = 0;\n          t.level > 0 ? (2 === t.strm.data_type && (t.strm.data_type = function (t) {\n            var e,\n              n = 4093624447;\n            for (e = 0; e <= 31; e++, n >>>= 1) if (1 & n && 0 !== t.dyn_ltree[2 * e]) return 0;\n            if (0 !== t.dyn_ltree[18] || 0 !== t.dyn_ltree[20] || 0 !== t.dyn_ltree[26]) return 1;\n            for (e = 32; e < o; e++) if (0 !== t.dyn_ltree[2 * e]) return 1;\n            return 0;\n          }(t)), L(t, t.l_desc), L(t, t.d_desc), a = function (t) {\n            var e;\n            for (P(t, t.dyn_ltree, t.l_desc.max_code), P(t, t.dyn_dtree, t.d_desc.max_code), L(t, t.bl_desc), e = 18; e >= 3 && 0 === t.bl_tree[2 * d[e] + 1]; e--);\n            return t.opt_len += 3 * (e + 1) + 5 + 5 + 4, e;\n          }(t), i = t.opt_len + 3 + 7 >>> 3, (s = t.static_len + 3 + 7 >>> 3) <= i && (i = s)) : i = s = n + 5, n + 4 <= i && -1 !== e ? j(t, e, n, r) : 4 === t.strategy || s === i ? (M(t, 2 + (r ? 1 : 0), 3), z(t, g, p)) : (M(t, 4 + (r ? 1 : 0), 3), function (t, e, n, r) {\n            var i;\n            for (M(t, e - 257, 5), M(t, n - 1, 5), M(t, r - 4, 4), i = 0; i < r; i++) M(t, t.bl_tree[2 * d[i] + 1], 3);\n            U(t, t.dyn_ltree, e - 1), U(t, t.dyn_dtree, n - 1);\n          }(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, a + 1), z(t, t.dyn_ltree, t.dyn_dtree)), T(t), r && O(t);\n        }, e._tr_tally = function (t, e, n) {\n          return t.pending_buf[t.d_buf + 2 * t.last_lit] = e >>> 8 & 255, t.pending_buf[t.d_buf + 2 * t.last_lit + 1] = 255 & e, t.pending_buf[t.l_buf + t.last_lit] = 255 & n, t.last_lit++, 0 === e ? t.dyn_ltree[2 * n]++ : (t.matches++, e--, t.dyn_ltree[2 * (y[n] + o + 1)]++, t.dyn_dtree[2 * S(e)]++), t.last_lit === t.lit_bufsize - 1;\n        }, e._tr_align = function (t) {\n          M(t, 2, 3), I(t, 256, g), function (t) {\n            16 === t.bi_valid ? (A(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = 255 & t.bi_buf, t.bi_buf >>= 8, t.bi_valid -= 8);\n          }(t);\n        };\n      },\n      292: function _(t) {\n        \"use strict\";\n\n        t.exports = function () {\n          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = \"\", this.state = null, this.data_type = 2, this.adler = 0;\n        };\n      },\n      269: function _(t) {\n        \"use strict\";\n\n        var e = /*#__PURE__*/function (_Symbol$iterator) {\n          function e() {\n            var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};\n            _classCallCheck(this, e);\n            if (!(t.maxSize && t.maxSize > 0)) throw new TypeError(\"`maxSize` must be a number greater than 0\");\n            this.maxSize = t.maxSize, this.cache = new Map(), this.oldCache = new Map(), this._size = 0;\n          }\n          _createClass(e, [{\n            key: \"_set\",\n            value: function _set(t, _e21) {\n              this.cache.set(t, _e21), this._size++, this._size >= this.maxSize && (this._size = 0, this.oldCache = this.cache, this.cache = new Map());\n            }\n          }, {\n            key: \"get\",\n            value: function get(t) {\n              if (this.cache.has(t)) return this.cache.get(t);\n              if (this.oldCache.has(t)) {\n                var _e22 = this.oldCache.get(t);\n                return this.oldCache[\"delete\"](t), this._set(t, _e22), _e22;\n              }\n            }\n          }, {\n            key: \"set\",\n            value: function set(t, _e23) {\n              return this.cache.has(t) ? this.cache.set(t, _e23) : this._set(t, _e23), this;\n            }\n          }, {\n            key: \"has\",\n            value: function has(t) {\n              return this.cache.has(t) || this.oldCache.has(t);\n            }\n          }, {\n            key: \"peek\",\n            value: function peek(t) {\n              return this.cache.has(t) ? this.cache.get(t) : this.oldCache.has(t) ? this.oldCache.get(t) : void 0;\n            }\n          }, {\n            key: \"delete\",\n            value: function _delete(t) {\n              var _e24 = this.cache[\"delete\"](t);\n              return _e24 && this._size--, this.oldCache[\"delete\"](t) || _e24;\n            }\n          }, {\n            key: \"clear\",\n            value: function clear() {\n              this.cache.clear(), this.oldCache.clear(), this._size = 0;\n            }\n          }, {\n            key: \"keys\",\n            value: /*#__PURE__*/_regeneratorRuntime().mark(function keys() {\n              var _iterator4, _step4, _step4$value, _t12;\n              return _regeneratorRuntime().wrap(function keys$(_context28) {\n                while (1) switch (_context28.prev = _context28.next) {\n                  case 0:\n                    _iterator4 = _createForOfIteratorHelper(this);\n                    _context28.prev = 1;\n                    _iterator4.s();\n                  case 3:\n                    if ((_step4 = _iterator4.n()).done) {\n                      _context28.next = 9;\n                      break;\n                    }\n                    _step4$value = _slicedToArray(_step4.value, 1), _t12 = _step4$value[0];\n                    _context28.next = 7;\n                    return _t12;\n                  case 7:\n                    _context28.next = 3;\n                    break;\n                  case 9:\n                    _context28.next = 14;\n                    break;\n                  case 11:\n                    _context28.prev = 11;\n                    _context28.t0 = _context28[\"catch\"](1);\n                    _iterator4.e(_context28.t0);\n                  case 14:\n                    _context28.prev = 14;\n                    _iterator4.f();\n                    return _context28.finish(14);\n                  case 17:\n                  case \"end\":\n                    return _context28.stop();\n                }\n              }, keys, this, [[1, 11, 14, 17]]);\n            })\n          }, {\n            key: \"values\",\n            value: /*#__PURE__*/_regeneratorRuntime().mark(function values() {\n              var _iterator5, _step5, _step5$value, _t13;\n              return _regeneratorRuntime().wrap(function values$(_context29) {\n                while (1) switch (_context29.prev = _context29.next) {\n                  case 0:\n                    _iterator5 = _createForOfIteratorHelper(this);\n                    _context29.prev = 1;\n                    _iterator5.s();\n                  case 3:\n                    if ((_step5 = _iterator5.n()).done) {\n                      _context29.next = 9;\n                      break;\n                    }\n                    _step5$value = _slicedToArray(_step5.value, 2), _t13 = _step5$value[1];\n                    _context29.next = 7;\n                    return _t13;\n                  case 7:\n                    _context29.next = 3;\n                    break;\n                  case 9:\n                    _context29.next = 14;\n                    break;\n                  case 11:\n                    _context29.prev = 11;\n                    _context29.t0 = _context29[\"catch\"](1);\n                    _iterator5.e(_context29.t0);\n                  case 14:\n                    _context29.prev = 14;\n                    _iterator5.f();\n                    return _context29.finish(14);\n                  case 17:\n                  case \"end\":\n                    return _context29.stop();\n                }\n              }, values, this, [[1, 11, 14, 17]]);\n            })\n          }, {\n            key: _Symbol$iterator,\n            value: /*#__PURE__*/_regeneratorRuntime().mark(function value() {\n              var _iterator6, _step6, _t14, _iterator7, _step7, _t15, _t16, _e25;\n              return _regeneratorRuntime().wrap(function value$(_context30) {\n                while (1) switch (_context30.prev = _context30.next) {\n                  case 0:\n                    _iterator6 = _createForOfIteratorHelper(this.cache);\n                    _context30.prev = 1;\n                    _iterator6.s();\n                  case 3:\n                    if ((_step6 = _iterator6.n()).done) {\n                      _context30.next = 9;\n                      break;\n                    }\n                    _t14 = _step6.value;\n                    _context30.next = 7;\n                    return _t14;\n                  case 7:\n                    _context30.next = 3;\n                    break;\n                  case 9:\n                    _context30.next = 14;\n                    break;\n                  case 11:\n                    _context30.prev = 11;\n                    _context30.t0 = _context30[\"catch\"](1);\n                    _iterator6.e(_context30.t0);\n                  case 14:\n                    _context30.prev = 14;\n                    _iterator6.f();\n                    return _context30.finish(14);\n                  case 17:\n                    _iterator7 = _createForOfIteratorHelper(this.oldCache);\n                    _context30.prev = 18;\n                    _iterator7.s();\n                  case 20:\n                    if ((_step7 = _iterator7.n()).done) {\n                      _context30.next = 29;\n                      break;\n                    }\n                    _t15 = _step7.value;\n                    _t16 = _slicedToArray(_t15, 1), _e25 = _t16[0];\n                    _context30.t1 = this.cache.has(_e25);\n                    if (_context30.t1) {\n                      _context30.next = 27;\n                      break;\n                    }\n                    _context30.next = 27;\n                    return _t15;\n                  case 27:\n                    _context30.next = 20;\n                    break;\n                  case 29:\n                    _context30.next = 34;\n                    break;\n                  case 31:\n                    _context30.prev = 31;\n                    _context30.t2 = _context30[\"catch\"](18);\n                    _iterator7.e(_context30.t2);\n                  case 34:\n                    _context30.prev = 34;\n                    _iterator7.f();\n                    return _context30.finish(34);\n                  case 37:\n                  case \"end\":\n                    return _context30.stop();\n                }\n              }, value, this, [[1, 11, 14, 17], [18, 31, 34, 37]]);\n            })\n          }, {\n            key: \"size\",\n            get: function get() {\n              var t = 0;\n              var _iterator8 = _createForOfIteratorHelper(this.oldCache.keys()),\n                _step8;\n              try {\n                for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {\n                  var _e26 = _step8.value;\n                  this.cache.has(_e26) || t++;\n                }\n              } catch (err) {\n                _iterator8.e(err);\n              } finally {\n                _iterator8.f();\n              }\n              return this._size + t;\n            }\n          }]);\n          return e;\n        }(Symbol.iterator);\n        t.exports = e;\n      },\n      467: function _(t, e, n) {\n        \"use strict\";\n\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e.serialize = e.deserialize = e.registerSerializer = void 0;\n        var r = n(381);\n        var i = r.DefaultSerializer;\n        e.registerSerializer = function (t) {\n          i = r.extendSerializer(i, t);\n        }, e.deserialize = function (t) {\n          return i.deserialize(t);\n        }, e.serialize = function (t) {\n          return i.serialize(t);\n        };\n      },\n      381: function _(t, e) {\n        \"use strict\";\n\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e.DefaultSerializer = e.extendSerializer = void 0, e.extendSerializer = function (t, e) {\n          var n = t.deserialize.bind(t),\n            r = t.serialize.bind(t);\n          return {\n            deserialize: function deserialize(t) {\n              return e.deserialize(t, n);\n            },\n            serialize: function serialize(t) {\n              return e.serialize(t, r);\n            }\n          };\n        };\n        var n = function n(t) {\n            return Object.assign(Error(t.message), {\n              name: t.name,\n              stack: t.stack\n            });\n          },\n          r = function r(t) {\n            return {\n              __error_marker: \"$$error\",\n              message: t.message,\n              name: t.name,\n              stack: t.stack\n            };\n          };\n        e.DefaultSerializer = {\n          deserialize: function deserialize(t) {\n            return (e = t) && \"object\" == _typeof(e) && \"__error_marker\" in e && \"$$error\" === e.__error_marker ? n(t) : t;\n            var e;\n          },\n          serialize: function serialize(t) {\n            return t instanceof Error ? r(t) : t;\n          }\n        };\n      },\n      258: function _(t, e) {\n        \"use strict\";\n\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e.$worker = e.$transferable = e.$terminate = e.$events = e.$errors = void 0, e.$errors = Symbol(\"thread.errors\"), e.$events = Symbol(\"thread.events\"), e.$terminate = Symbol(\"thread.terminate\"), e.$transferable = Symbol(\"thread.transferable\"), e.$worker = Symbol(\"thread.worker\");\n      },\n      180: function _(t, e, n) {\n        \"use strict\";\n\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e.Transfer = e.isTransferDescriptor = void 0;\n        var r = n(258);\n        e.isTransferDescriptor = function (t) {\n          return t && \"object\" == _typeof(t) && t[r.$transferable];\n        }, e.Transfer = function (t, e) {\n          if (!e) {\n            if (!(n = t) || \"object\" != _typeof(n)) throw Error();\n            e = [t];\n          }\n          var n;\n          return _defineProperty(_defineProperty(_defineProperty({}, r.$transferable, !0), \"send\", t), \"transferables\", e);\n        };\n      },\n      229: function _(t, e) {\n        \"use strict\";\n\n        var n, r;\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e.WorkerMessageType = e.MasterMessageType = void 0, (r = e.MasterMessageType || (e.MasterMessageType = {})).cancel = \"cancel\", r.run = \"run\", (n = e.WorkerMessageType || (e.WorkerMessageType = {})).error = \"error\", n.init = \"init\", n.result = \"result\", n.running = \"running\", n.uncaughtError = \"uncaughtError\";\n      },\n      447: function _(t, e) {\n        \"use strict\";\n\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e[\"default\"] = {\n          isWorkerRuntime: function isWorkerRuntime() {\n            var t = \"undefined\" != typeof self && \"undefined\" != typeof Window && self instanceof Window;\n            return !(\"undefined\" == typeof self || !self.postMessage || t);\n          },\n          postMessageToMaster: function postMessageToMaster(t, e) {\n            self.postMessage(t, e);\n          },\n          subscribeToMasterMessages: function subscribeToMasterMessages(t) {\n            var e = function e(_e27) {\n              t(_e27.data);\n            };\n            return self.addEventListener(\"message\", e), function () {\n              self.removeEventListener(\"message\", e);\n            };\n          }\n        };\n      },\n      934: function _(t, e, n) {\n        \"use strict\";\n\n        var r = this && this.__awaiter || function (t, e, n, r) {\n            return new (n || (n = Promise))(function (i, o) {\n              function s(t) {\n                try {\n                  l(r.next(t));\n                } catch (t) {\n                  o(t);\n                }\n              }\n              function a(t) {\n                try {\n                  l(r[\"throw\"](t));\n                } catch (t) {\n                  o(t);\n                }\n              }\n              function l(t) {\n                var e;\n                t.done ? i(t.value) : (e = t.value, e instanceof n ? e : new n(function (t) {\n                  t(e);\n                })).then(s, a);\n              }\n              l((r = r.apply(t, e || [])).next());\n            });\n          },\n          i = this && this.__importDefault || function (t) {\n            return t && t.__esModule ? t : {\n              \"default\": t\n            };\n          };\n        Object.defineProperty(e, \"__esModule\", {\n          value: !0\n        }), e.expose = e.isWorkerRuntime = e.Transfer = e.registerSerializer = void 0;\n        var o = i(n(898)),\n          s = n(467),\n          a = n(180),\n          l = n(229),\n          h = i(n(447));\n        var u = n(467);\n        Object.defineProperty(e, \"registerSerializer\", {\n          enumerable: !0,\n          get: function get() {\n            return u.registerSerializer;\n          }\n        });\n        var f = n(180);\n        Object.defineProperty(e, \"Transfer\", {\n          enumerable: !0,\n          get: function get() {\n            return f.Transfer;\n          }\n        }), e.isWorkerRuntime = h[\"default\"].isWorkerRuntime;\n        var c = !1;\n        var d = new Map(),\n          g = function g(t) {\n            return t && t.type === l.MasterMessageType.run;\n          },\n          p = function p(t) {\n            return o[\"default\"](t) || function (t) {\n              return t && \"object\" == _typeof(t) && \"function\" == typeof t.subscribe;\n            }(t);\n          };\n        function m(t) {\n          return a.isTransferDescriptor(t) ? {\n            payload: t.send,\n            transferables: t.transferables\n          } : {\n            payload: t,\n            transferables: void 0\n          };\n        }\n        function y(t, e) {\n          var _m = m(e),\n            n = _m.payload,\n            r = _m.transferables,\n            i = {\n              type: l.WorkerMessageType.error,\n              uid: t,\n              error: s.serialize(n)\n            };\n          h[\"default\"].postMessageToMaster(i, r);\n        }\n        function b(t, e, n) {\n          var _m2 = m(n),\n            r = _m2.payload,\n            i = _m2.transferables,\n            o = {\n              type: l.WorkerMessageType.result,\n              uid: t,\n              complete: !!e || void 0,\n              payload: r\n            };\n          h[\"default\"].postMessageToMaster(o, i);\n        }\n        function w(t) {\n          try {\n            var _e28 = {\n              type: l.WorkerMessageType.uncaughtError,\n              error: s.serialize(t)\n            };\n            h[\"default\"].postMessageToMaster(_e28);\n          } catch (e) {\n            console.error(\"Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\\nLatest error:\", e, \"\\nOriginal error:\", t);\n          }\n        }\n        function v(t, e, n) {\n          return r(this, void 0, void 0, /*#__PURE__*/_regeneratorRuntime().mark(function _callee28() {\n            var r, i, _e29, _e30;\n            return _regeneratorRuntime().wrap(function _callee28$(_context31) {\n              while (1) switch (_context31.prev = _context31.next) {\n                case 0:\n                  _context31.prev = 0;\n                  r = e.apply(void 0, _toConsumableArray(n));\n                  _context31.next = 7;\n                  break;\n                case 4:\n                  _context31.prev = 4;\n                  _context31.t0 = _context31[\"catch\"](0);\n                  return _context31.abrupt(\"return\", y(t, _context31.t0));\n                case 7:\n                  i = p(r) ? \"observable\" : \"promise\";\n                  if (!(function (t, e) {\n                    var n = {\n                      type: l.WorkerMessageType.running,\n                      uid: t,\n                      resultType: e\n                    };\n                    h[\"default\"].postMessageToMaster(n);\n                  }(t, i), p(r))) {\n                    _context31.next = 13;\n                    break;\n                  }\n                  _e29 = r.subscribe(function (e) {\n                    return b(t, !1, s.serialize(e));\n                  }, function (e) {\n                    y(t, s.serialize(e)), d[\"delete\"](t);\n                  }, function () {\n                    b(t, !0), d[\"delete\"](t);\n                  });\n                  d.set(t, _e29);\n                  _context31.next = 23;\n                  break;\n                case 13:\n                  _context31.prev = 13;\n                  _context31.next = 16;\n                  return r;\n                case 16:\n                  _e30 = _context31.sent;\n                  b(t, !0, s.serialize(_e30));\n                  _context31.next = 23;\n                  break;\n                case 20:\n                  _context31.prev = 20;\n                  _context31.t1 = _context31[\"catch\"](13);\n                  y(t, s.serialize(_context31.t1));\n                case 23:\n                case \"end\":\n                  return _context31.stop();\n              }\n            }, _callee28, null, [[0, 4], [13, 20]]);\n          }));\n        }\n        e.expose = function (t) {\n          if (!h[\"default\"].isWorkerRuntime()) throw Error(\"expose() called in the master thread.\");\n          if (c) throw Error(\"expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.\");\n          if (c = !0, \"function\" == typeof t) h[\"default\"].subscribeToMasterMessages(function (e) {\n            g(e) && !e.method && v(e.uid, t, e.args.map(s.deserialize));\n          }), function () {\n            var t = {\n              type: l.WorkerMessageType.init,\n              exposed: {\n                type: \"function\"\n              }\n            };\n            h[\"default\"].postMessageToMaster(t);\n          }();else {\n            if (\"object\" != _typeof(t) || !t) throw Error(\"Invalid argument passed to expose(). Expected a function or an object, got: \".concat(t));\n            h[\"default\"].subscribeToMasterMessages(function (e) {\n              g(e) && e.method && v(e.uid, t[e.method], e.args.map(s.deserialize));\n            }), function (t) {\n              var e = {\n                type: l.WorkerMessageType.init,\n                exposed: {\n                  type: \"module\",\n                  methods: t\n                }\n              };\n              h[\"default\"].postMessageToMaster(e);\n            }(Object.keys(t).filter(function (e) {\n              return \"function\" == typeof t[e];\n            }));\n          }\n          h[\"default\"].subscribeToMasterMessages(function (t) {\n            if ((e = t) && e.type === l.MasterMessageType.cancel) {\n              var _e31 = t.uid,\n                _n18 = d.get(_e31);\n              _n18 && (_n18.unsubscribe(), d[\"delete\"](_e31));\n            }\n            var e;\n          });\n        }, \"undefined\" != typeof self && \"function\" == typeof self.addEventListener && h[\"default\"].isWorkerRuntime() && (self.addEventListener(\"error\", function (t) {\n          setTimeout(function () {\n            return w(t.error || t);\n          }, 250);\n        }), self.addEventListener(\"unhandledrejection\", function (t) {\n          var e = t.reason;\n          e && \"string\" == typeof e.message && setTimeout(function () {\n            return w(e);\n          }, 250);\n        })), \"undefined\" != typeof process && \"function\" == typeof process.on && h[\"default\"].isWorkerRuntime() && (process.on(\"uncaughtException\", function (t) {\n          setTimeout(function () {\n            return w(t);\n          }, 250);\n        }), process.on(\"unhandledRejection\", function (t) {\n          t && \"string\" == typeof t.message && setTimeout(function () {\n            return w(t);\n          }, 250);\n        }));\n      },\n      602: function _(t) {\n        \"use strict\";\n\n        t.exports = function (t) {\n          t.prototype[Symbol.iterator] = /*#__PURE__*/_regeneratorRuntime().mark(function _callee29() {\n            var _t17;\n            return _regeneratorRuntime().wrap(function _callee29$(_context32) {\n              while (1) switch (_context32.prev = _context32.next) {\n                case 0:\n                  _t17 = this.head;\n                case 1:\n                  if (!_t17) {\n                    _context32.next = 7;\n                    break;\n                  }\n                  _context32.next = 4;\n                  return _t17.value;\n                case 4:\n                  _t17 = _t17.next;\n                  _context32.next = 1;\n                  break;\n                case 7:\n                case \"end\":\n                  return _context32.stop();\n              }\n            }, _callee29, this);\n          });\n        };\n      },\n      411: function _(t, e, n) {\n        \"use strict\";\n\n        function r(t) {\n          var e = this;\n          if (e instanceof r || (e = new r()), e.tail = null, e.head = null, e.length = 0, t && \"function\" == typeof t.forEach) t.forEach(function (t) {\n            e.push(t);\n          });else if (arguments.length > 0) for (var n = 0, i = arguments.length; n < i; n++) e.push(arguments[n]);\n          return e;\n        }\n        function i(t, e, n) {\n          var r = e === t.head ? new a(n, null, e, t) : new a(n, e, e.next, t);\n          return null === r.next && (t.tail = r), null === r.prev && (t.head = r), t.length++, r;\n        }\n        function o(t, e) {\n          t.tail = new a(e, t.tail, null, t), t.head || (t.head = t.tail), t.length++;\n        }\n        function s(t, e) {\n          t.head = new a(e, null, t.head, t), t.tail || (t.tail = t.head), t.length++;\n        }\n        function a(t, e, n, r) {\n          if (!(this instanceof a)) return new a(t, e, n, r);\n          this.list = r, this.value = t, e ? (e.next = this, this.prev = e) : this.prev = null, n ? (n.prev = this, this.next = n) : this.next = null;\n        }\n        t.exports = r, r.Node = a, r.create = r, r.prototype.removeNode = function (t) {\n          if (t.list !== this) throw new Error(\"removing node which does not belong to this list\");\n          var e = t.next,\n            n = t.prev;\n          return e && (e.prev = n), n && (n.next = e), t === this.head && (this.head = e), t === this.tail && (this.tail = n), t.list.length--, t.next = null, t.prev = null, t.list = null, e;\n        }, r.prototype.unshiftNode = function (t) {\n          if (t !== this.head) {\n            t.list && t.list.removeNode(t);\n            var e = this.head;\n            t.list = this, t.next = e, e && (e.prev = t), this.head = t, this.tail || (this.tail = t), this.length++;\n          }\n        }, r.prototype.pushNode = function (t) {\n          if (t !== this.tail) {\n            t.list && t.list.removeNode(t);\n            var e = this.tail;\n            t.list = this, t.prev = e, e && (e.next = t), this.tail = t, this.head || (this.head = t), this.length++;\n          }\n        }, r.prototype.push = function () {\n          for (var t = 0, e = arguments.length; t < e; t++) o(this, arguments[t]);\n          return this.length;\n        }, r.prototype.unshift = function () {\n          for (var t = 0, e = arguments.length; t < e; t++) s(this, arguments[t]);\n          return this.length;\n        }, r.prototype.pop = function () {\n          if (this.tail) {\n            var t = this.tail.value;\n            return this.tail = this.tail.prev, this.tail ? this.tail.next = null : this.head = null, this.length--, t;\n          }\n        }, r.prototype.shift = function () {\n          if (this.head) {\n            var t = this.head.value;\n            return this.head = this.head.next, this.head ? this.head.prev = null : this.tail = null, this.length--, t;\n          }\n        }, r.prototype.forEach = function (t, e) {\n          e = e || this;\n          for (var n = this.head, r = 0; null !== n; r++) t.call(e, n.value, r, this), n = n.next;\n        }, r.prototype.forEachReverse = function (t, e) {\n          e = e || this;\n          for (var n = this.tail, r = this.length - 1; null !== n; r--) t.call(e, n.value, r, this), n = n.prev;\n        }, r.prototype.get = function (t) {\n          for (var e = 0, n = this.head; null !== n && e < t; e++) n = n.next;\n          if (e === t && null !== n) return n.value;\n        }, r.prototype.getReverse = function (t) {\n          for (var e = 0, n = this.tail; null !== n && e < t; e++) n = n.prev;\n          if (e === t && null !== n) return n.value;\n        }, r.prototype.map = function (t, e) {\n          e = e || this;\n          for (var n = new r(), i = this.head; null !== i;) n.push(t.call(e, i.value, this)), i = i.next;\n          return n;\n        }, r.prototype.mapReverse = function (t, e) {\n          e = e || this;\n          for (var n = new r(), i = this.tail; null !== i;) n.push(t.call(e, i.value, this)), i = i.prev;\n          return n;\n        }, r.prototype.reduce = function (t, e) {\n          var n,\n            r = this.head;\n          if (arguments.length > 1) n = e;else {\n            if (!this.head) throw new TypeError(\"Reduce of empty list with no initial value\");\n            r = this.head.next, n = this.head.value;\n          }\n          for (var i = 0; null !== r; i++) n = t(n, r.value, i), r = r.next;\n          return n;\n        }, r.prototype.reduceReverse = function (t, e) {\n          var n,\n            r = this.tail;\n          if (arguments.length > 1) n = e;else {\n            if (!this.tail) throw new TypeError(\"Reduce of empty list with no initial value\");\n            r = this.tail.prev, n = this.tail.value;\n          }\n          for (var i = this.length - 1; null !== r; i--) n = t(n, r.value, i), r = r.prev;\n          return n;\n        }, r.prototype.toArray = function () {\n          for (var t = new Array(this.length), e = 0, n = this.head; null !== n; e++) t[e] = n.value, n = n.next;\n          return t;\n        }, r.prototype.toArrayReverse = function () {\n          for (var t = new Array(this.length), e = 0, n = this.tail; null !== n; e++) t[e] = n.value, n = n.prev;\n          return t;\n        }, r.prototype.slice = function (t, e) {\n          (e = e || this.length) < 0 && (e += this.length), (t = t || 0) < 0 && (t += this.length);\n          var n = new r();\n          if (e < t || e < 0) return n;\n          t < 0 && (t = 0), e > this.length && (e = this.length);\n          for (var i = 0, o = this.head; null !== o && i < t; i++) o = o.next;\n          for (; null !== o && i < e; i++, o = o.next) n.push(o.value);\n          return n;\n        }, r.prototype.sliceReverse = function (t, e) {\n          (e = e || this.length) < 0 && (e += this.length), (t = t || 0) < 0 && (t += this.length);\n          var n = new r();\n          if (e < t || e < 0) return n;\n          t < 0 && (t = 0), e > this.length && (e = this.length);\n          for (var i = this.length, o = this.tail; null !== o && i > e; i--) o = o.prev;\n          for (; null !== o && i > t; i--, o = o.prev) n.push(o.value);\n          return n;\n        }, r.prototype.splice = function (t, e) {\n          t > this.length && (t = this.length - 1), t < 0 && (t = this.length + t);\n          for (var r = 0, o = this.head; null !== o && r < t; r++) o = o.next;\n          var s = [];\n          for (r = 0; o && r < e; r++) s.push(o.value), o = this.removeNode(o);\n          for (null === o && (o = this.tail), o !== this.head && o !== this.tail && (o = o.prev), r = 0; r < (arguments.length <= 2 ? 0 : arguments.length - 2); r++) o = i(this, o, r + 2 < 2 || arguments.length <= r + 2 ? undefined : arguments[r + 2]);\n          return s;\n        }, r.prototype.reverse = function () {\n          for (var t = this.head, e = this.tail, n = t; null !== n; n = n.prev) {\n            var r = n.prev;\n            n.prev = n.next, n.next = r;\n          }\n          return this.head = e, this.tail = t, this;\n        };\n        try {\n          n(602)(r);\n        } catch (t) {}\n      },\n      67: function _() {}\n    },\n    e = {};\n  function n(r) {\n    var i = e[r];\n    if (void 0 !== i) return i.exports;\n    var o = e[r] = {\n      exports: {}\n    };\n    return t[r].call(o.exports, o, o.exports, n), o.exports;\n  }\n  n.n = function (t) {\n    var e = t && t.__esModule ? function () {\n      return t[\"default\"];\n    } : function () {\n      return t;\n    };\n    return n.d(e, {\n      a: e\n    }), e;\n  }, n.d = function (t, e) {\n    for (var r in e) n.o(e, r) && !n.o(t, r) && Object.defineProperty(t, r, {\n      enumerable: !0,\n      get: e[r]\n    });\n  }, n.g = function () {\n    if (\"object\" == (typeof globalThis === \"undefined\" ? \"undefined\" : _typeof(globalThis))) return globalThis;\n    try {\n      return this || new Function(\"return this\")();\n    } catch (t) {\n      if (\"object\" == (typeof window === \"undefined\" ? \"undefined\" : _typeof(window))) return window;\n    }\n  }(), n.o = function (t, e) {\n    return Object.prototype.hasOwnProperty.call(t, e);\n  }, n.r = function (t) {\n    \"undefined\" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {\n      value: \"Module\"\n    }), Object.defineProperty(t, \"__esModule\", {\n      value: !0\n    });\n  }, function () {\n    \"use strict\";\n\n    function t(t, e, n) {\n      t = +t, e = +e, n = (i = arguments.length) < 2 ? (e = t, t = 0, 1) : i < 3 ? 1 : +n;\n      for (var r = -1, i = 0 | Math.max(0, Math.ceil((e - t) / n)), o = new Array(i); ++r < i;) o[r] = t + r * n;\n      return o;\n    }\n    function e(t, e) {\n      switch (arguments.length) {\n        case 0:\n          break;\n        case 1:\n          this.range(t);\n          break;\n        default:\n          this.range(e).domain(t);\n      }\n      return this;\n    }\n    var r = Symbol(\"implicit\");\n    function i() {\n      var t = new Map(),\n        n = [],\n        o = [],\n        s = r;\n      function a(e) {\n        var i = e + \"\",\n          a = t.get(i);\n        if (!a) {\n          if (s !== r) return s;\n          t.set(i, a = n.push(e));\n        }\n        return o[(a - 1) % o.length];\n      }\n      return a.domain = function (e) {\n        if (!arguments.length) return n.slice();\n        n = [], t = new Map();\n        var _iterator9 = _createForOfIteratorHelper(e),\n          _step9;\n        try {\n          for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {\n            var _r21 = _step9.value;\n            var _e32 = _r21 + \"\";\n            t.has(_e32) || t.set(_e32, n.push(_r21));\n          }\n        } catch (err) {\n          _iterator9.e(err);\n        } finally {\n          _iterator9.f();\n        }\n        return a;\n      }, a.range = function (t) {\n        return arguments.length ? (o = Array.from(t), a) : o.slice();\n      }, a.unknown = function (t) {\n        return arguments.length ? (s = t, a) : s;\n      }, a.copy = function () {\n        return i(n, o).unknown(s);\n      }, e.apply(a, arguments), a;\n    }\n    function o() {\n      var n,\n        r,\n        s = i().unknown(void 0),\n        a = s.domain,\n        l = s.range,\n        h = 0,\n        u = 1,\n        f = !1,\n        c = 0,\n        d = 0,\n        g = .5;\n      function p() {\n        var e = a().length,\n          i = u < h,\n          o = i ? u : h,\n          s = i ? h : u;\n        n = (s - o) / Math.max(1, e - c + 2 * d), f && (n = Math.floor(n)), o += (s - o - n * (e - c)) * g, r = n * (1 - c), f && (o = Math.round(o), r = Math.round(r));\n        var p = t(e).map(function (t) {\n          return o + n * t;\n        });\n        return l(i ? p.reverse() : p);\n      }\n      return delete s.unknown, s.domain = function (t) {\n        return arguments.length ? (a(t), p()) : a();\n      }, s.range = function (t) {\n        var _t18;\n        return arguments.length ? ((_t18 = _slicedToArray(t, 2), h = _t18[0], u = _t18[1]), h = +h, u = +u, p()) : [h, u];\n      }, s.rangeRound = function (t) {\n        var _t19;\n        return (_t19 = _slicedToArray(t, 2), h = _t19[0], u = _t19[1]), h = +h, u = +u, f = !0, p();\n      }, s.bandwidth = function () {\n        return r;\n      }, s.step = function () {\n        return n;\n      }, s.round = function (t) {\n        return arguments.length ? (f = !!t, p()) : f;\n      }, s.padding = function (t) {\n        return arguments.length ? (c = Math.min(1, d = +t), p()) : c;\n      }, s.paddingInner = function (t) {\n        return arguments.length ? (c = Math.min(1, t), p()) : c;\n      }, s.paddingOuter = function (t) {\n        return arguments.length ? (d = +t, p()) : d;\n      }, s.align = function (t) {\n        return arguments.length ? (g = Math.max(0, Math.min(1, t)), p()) : g;\n      }, s.copy = function () {\n        return o(a(), [h, u]).round(f).paddingInner(c).paddingOuter(d).align(g);\n      }, e.apply(p(), arguments);\n    }\n    var s = Math.sqrt(50),\n      a = Math.sqrt(10),\n      l = Math.sqrt(2);\n    function h(t, e, n) {\n      var r = (e - t) / Math.max(0, n),\n        i = Math.floor(Math.log(r) / Math.LN10),\n        o = r / Math.pow(10, i);\n      return i >= 0 ? (o >= s ? 10 : o >= a ? 5 : o >= l ? 2 : 1) * Math.pow(10, i) : -Math.pow(10, -i) / (o >= s ? 10 : o >= a ? 5 : o >= l ? 2 : 1);\n    }\n    function u(t, e) {\n      return t < e ? -1 : t > e ? 1 : t >= e ? 0 : NaN;\n    }\n    function f(t) {\n      var e = t,\n        n = t;\n      function r(t, e, r, i) {\n        for (null == r && (r = 0), null == i && (i = t.length); r < i;) {\n          var _o6 = r + i >>> 1;\n          n(t[_o6], e) < 0 ? r = _o6 + 1 : i = _o6;\n        }\n        return r;\n      }\n      return 1 === t.length && (e = function e(_e33, n) {\n        return t(_e33) - n;\n      }, n = function (t) {\n        return function (e, n) {\n          return u(t(e), n);\n        };\n      }(t)), {\n        left: r,\n        center: function center(t, n, i, o) {\n          null == i && (i = 0), null == o && (o = t.length);\n          var s = r(t, n, i, o - 1);\n          return s > i && e(t[s - 1], n) > -e(t[s], n) ? s - 1 : s;\n        },\n        right: function right(t, e, r, i) {\n          for (null == r && (r = 0), null == i && (i = t.length); r < i;) {\n            var _o7 = r + i >>> 1;\n            n(t[_o7], e) > 0 ? i = _o7 : r = _o7 + 1;\n          }\n          return r;\n        }\n      };\n    }\n    var c = f(u),\n      d = c.right,\n      g = (c.left, f(function (t) {\n        return null === t ? NaN : +t;\n      }).center, d);\n    function p(t, e, n) {\n      t.prototype = e.prototype = n, n.constructor = t;\n    }\n    function m(t, e) {\n      var n = Object.create(t.prototype);\n      for (var r in e) n[r] = e[r];\n      return n;\n    }\n    function y() {}\n    var b = .7,\n      w = 1 / b,\n      v = \"\\\\s*([+-]?\\\\d+)\\\\s*\",\n      _ = \"\\\\s*([+-]?\\\\d*\\\\.?\\\\d+(?:[eE][+-]?\\\\d+)?)\\\\s*\",\n      x = \"\\\\s*([+-]?\\\\d*\\\\.?\\\\d+(?:[eE][+-]?\\\\d+)?)%\\\\s*\",\n      k = /^#([0-9a-f]{3,8})$/,\n      E = new RegExp(\"^rgb\\\\(\" + [v, v, v] + \"\\\\)$\"),\n      S = new RegExp(\"^rgb\\\\(\" + [x, x, x] + \"\\\\)$\"),\n      A = new RegExp(\"^rgba\\\\(\" + [v, v, v, _] + \"\\\\)$\"),\n      M = new RegExp(\"^rgba\\\\(\" + [x, x, x, _] + \"\\\\)$\"),\n      I = new RegExp(\"^hsl\\\\(\" + [_, x, x] + \"\\\\)$\"),\n      R = new RegExp(\"^hsla\\\\(\" + [_, x, x, _] + \"\\\\)$\"),\n      B = {\n        aliceblue: 15792383,\n        antiquewhite: 16444375,\n        aqua: 65535,\n        aquamarine: 8388564,\n        azure: 15794175,\n        beige: 16119260,\n        bisque: 16770244,\n        black: 0,\n        blanchedalmond: 16772045,\n        blue: 255,\n        blueviolet: 9055202,\n        brown: 10824234,\n        burlywood: 14596231,\n        cadetblue: 6266528,\n        chartreuse: 8388352,\n        chocolate: 13789470,\n        coral: 16744272,\n        cornflowerblue: 6591981,\n        cornsilk: 16775388,\n        crimson: 14423100,\n        cyan: 65535,\n        darkblue: 139,\n        darkcyan: 35723,\n        darkgoldenrod: 12092939,\n        darkgray: 11119017,\n        darkgreen: 25600,\n        darkgrey: 11119017,\n        darkkhaki: 12433259,\n        darkmagenta: 9109643,\n        darkolivegreen: 5597999,\n        darkorange: 16747520,\n        darkorchid: 10040012,\n        darkred: 9109504,\n        darksalmon: 15308410,\n        darkseagreen: 9419919,\n        darkslateblue: 4734347,\n        darkslategray: 3100495,\n        darkslategrey: 3100495,\n        darkturquoise: 52945,\n        darkviolet: 9699539,\n        deeppink: 16716947,\n        deepskyblue: 49151,\n        dimgray: 6908265,\n        dimgrey: 6908265,\n        dodgerblue: 2003199,\n        firebrick: 11674146,\n        floralwhite: 16775920,\n        forestgreen: 2263842,\n        fuchsia: 16711935,\n        gainsboro: 14474460,\n        ghostwhite: 16316671,\n        gold: 16766720,\n        goldenrod: 14329120,\n        gray: 8421504,\n        green: 32768,\n        greenyellow: 11403055,\n        grey: 8421504,\n        honeydew: 15794160,\n        hotpink: 16738740,\n        indianred: 13458524,\n        indigo: 4915330,\n        ivory: 16777200,\n        khaki: 15787660,\n        lavender: 15132410,\n        lavenderblush: 16773365,\n        lawngreen: 8190976,\n        lemonchiffon: 16775885,\n        lightblue: 11393254,\n        lightcoral: 15761536,\n        lightcyan: 14745599,\n        lightgoldenrodyellow: 16448210,\n        lightgray: 13882323,\n        lightgreen: 9498256,\n        lightgrey: 13882323,\n        lightpink: 16758465,\n        lightsalmon: 16752762,\n        lightseagreen: 2142890,\n        lightskyblue: 8900346,\n        lightslategray: 7833753,\n        lightslategrey: 7833753,\n        lightsteelblue: 11584734,\n        lightyellow: 16777184,\n        lime: 65280,\n        limegreen: 3329330,\n        linen: 16445670,\n        magenta: 16711935,\n        maroon: 8388608,\n        mediumaquamarine: 6737322,\n        mediumblue: 205,\n        mediumorchid: 12211667,\n        mediumpurple: 9662683,\n        mediumseagreen: 3978097,\n        mediumslateblue: 8087790,\n        mediumspringgreen: 64154,\n        mediumturquoise: 4772300,\n        mediumvioletred: 13047173,\n        midnightblue: 1644912,\n        mintcream: 16121850,\n        mistyrose: 16770273,\n        moccasin: 16770229,\n        navajowhite: 16768685,\n        navy: 128,\n        oldlace: 16643558,\n        olive: 8421376,\n        olivedrab: 7048739,\n        orange: 16753920,\n        orangered: 16729344,\n        orchid: 14315734,\n        palegoldenrod: 15657130,\n        palegreen: 10025880,\n        paleturquoise: 11529966,\n        palevioletred: 14381203,\n        papayawhip: 16773077,\n        peachpuff: 16767673,\n        peru: 13468991,\n        pink: 16761035,\n        plum: 14524637,\n        powderblue: 11591910,\n        purple: 8388736,\n        rebeccapurple: 6697881,\n        red: 16711680,\n        rosybrown: 12357519,\n        royalblue: 4286945,\n        saddlebrown: 9127187,\n        salmon: 16416882,\n        sandybrown: 16032864,\n        seagreen: 3050327,\n        seashell: 16774638,\n        sienna: 10506797,\n        silver: 12632256,\n        skyblue: 8900331,\n        slateblue: 6970061,\n        slategray: 7372944,\n        slategrey: 7372944,\n        snow: 16775930,\n        springgreen: 65407,\n        steelblue: 4620980,\n        tan: 13808780,\n        teal: 32896,\n        thistle: 14204888,\n        tomato: 16737095,\n        turquoise: 4251856,\n        violet: 15631086,\n        wheat: 16113331,\n        white: 16777215,\n        whitesmoke: 16119285,\n        yellow: 16776960,\n        yellowgreen: 10145074\n      };\n    function T() {\n      return this.rgb().formatHex();\n    }\n    function O() {\n      return this.rgb().formatRgb();\n    }\n    function C(t) {\n      var e, n;\n      return t = (t + \"\").trim().toLowerCase(), (e = k.exec(t)) ? (n = e[1].length, e = parseInt(e[1], 16), 6 === n ? N(e) : 3 === n ? new P(e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | 240 & e, (15 & e) << 4 | 15 & e, 1) : 8 === n ? z(e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, (255 & e) / 255) : 4 === n ? z(e >> 12 & 15 | e >> 8 & 240, e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | 240 & e, ((15 & e) << 4 | 15 & e) / 255) : null) : (e = E.exec(t)) ? new P(e[1], e[2], e[3], 1) : (e = S.exec(t)) ? new P(255 * e[1] / 100, 255 * e[2] / 100, 255 * e[3] / 100, 1) : (e = A.exec(t)) ? z(e[1], e[2], e[3], e[4]) : (e = M.exec(t)) ? z(255 * e[1] / 100, 255 * e[2] / 100, 255 * e[3] / 100, e[4]) : (e = I.exec(t)) ? F(e[1], e[2] / 100, e[3] / 100, 1) : (e = R.exec(t)) ? F(e[1], e[2] / 100, e[3] / 100, e[4]) : B.hasOwnProperty(t) ? N(B[t]) : \"transparent\" === t ? new P(NaN, NaN, NaN, 0) : null;\n    }\n    function N(t) {\n      return new P(t >> 16 & 255, t >> 8 & 255, 255 & t, 1);\n    }\n    function z(t, e, n, r) {\n      return r <= 0 && (t = e = n = NaN), new P(t, e, n, r);\n    }\n    function L(t, e, n, r) {\n      return 1 === arguments.length ? ((i = t) instanceof y || (i = C(i)), i ? new P((i = i.rgb()).r, i.g, i.b, i.opacity) : new P()) : new P(t, e, n, null == r ? 1 : r);\n      var i;\n    }\n    function P(t, e, n, r) {\n      this.r = +t, this.g = +e, this.b = +n, this.opacity = +r;\n    }\n    function U() {\n      return \"#\" + j(this.r) + j(this.g) + j(this.b);\n    }\n    function $() {\n      var t = this.opacity;\n      return (1 === (t = isNaN(t) ? 1 : Math.max(0, Math.min(1, t))) ? \"rgb(\" : \"rgba(\") + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + \", \" + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + \", \" + Math.max(0, Math.min(255, Math.round(this.b) || 0)) + (1 === t ? \")\" : \", \" + t + \")\");\n    }\n    function j(t) {\n      return ((t = Math.max(0, Math.min(255, Math.round(t) || 0))) < 16 ? \"0\" : \"\") + t.toString(16);\n    }\n    function F(t, e, n, r) {\n      return r <= 0 ? t = e = n = NaN : n <= 0 || n >= 1 ? t = e = NaN : e <= 0 && (t = NaN), new q(t, e, n, r);\n    }\n    function D(t) {\n      if (t instanceof q) return new q(t.h, t.s, t.l, t.opacity);\n      if (t instanceof y || (t = C(t)), !t) return new q();\n      if (t instanceof q) return t;\n      var e = (t = t.rgb()).r / 255,\n        n = t.g / 255,\n        r = t.b / 255,\n        i = Math.min(e, n, r),\n        o = Math.max(e, n, r),\n        s = NaN,\n        a = o - i,\n        l = (o + i) / 2;\n      return a ? (s = e === o ? (n - r) / a + 6 * (n < r) : n === o ? (r - e) / a + 2 : (e - n) / a + 4, a /= l < .5 ? o + i : 2 - o - i, s *= 60) : a = l > 0 && l < 1 ? 0 : s, new q(s, a, l, t.opacity);\n    }\n    function q(t, e, n, r) {\n      this.h = +t, this.s = +e, this.l = +n, this.opacity = +r;\n    }\n    function H(t, e, n) {\n      return 255 * (t < 60 ? e + (n - e) * t / 60 : t < 180 ? n : t < 240 ? e + (n - e) * (240 - t) / 60 : e);\n    }\n    function G(t, e, n, r, i) {\n      var o = t * t,\n        s = o * t;\n      return ((1 - 3 * t + 3 * o - s) * e + (4 - 6 * o + 3 * s) * n + (1 + 3 * t + 3 * o - 3 * s) * r + s * i) / 6;\n    }\n    p(y, C, {\n      copy: function copy(t) {\n        return Object.assign(new this.constructor(), this, t);\n      },\n      displayable: function displayable() {\n        return this.rgb().displayable();\n      },\n      hex: T,\n      formatHex: T,\n      formatHsl: function formatHsl() {\n        return D(this).formatHsl();\n      },\n      formatRgb: O,\n      toString: O\n    }), p(P, L, m(y, {\n      brighter: function brighter(t) {\n        return t = null == t ? w : Math.pow(w, t), new P(this.r * t, this.g * t, this.b * t, this.opacity);\n      },\n      darker: function darker(t) {\n        return t = null == t ? b : Math.pow(b, t), new P(this.r * t, this.g * t, this.b * t, this.opacity);\n      },\n      rgb: function rgb() {\n        return this;\n      },\n      displayable: function displayable() {\n        return -.5 <= this.r && this.r < 255.5 && -.5 <= this.g && this.g < 255.5 && -.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;\n      },\n      hex: U,\n      formatHex: U,\n      formatRgb: $,\n      toString: $\n    })), p(q, function (t, e, n, r) {\n      return 1 === arguments.length ? D(t) : new q(t, e, n, null == r ? 1 : r);\n    }, m(y, {\n      brighter: function brighter(t) {\n        return t = null == t ? w : Math.pow(w, t), new q(this.h, this.s, this.l * t, this.opacity);\n      },\n      darker: function darker(t) {\n        return t = null == t ? b : Math.pow(b, t), new q(this.h, this.s, this.l * t, this.opacity);\n      },\n      rgb: function rgb() {\n        var t = this.h % 360 + 360 * (this.h < 0),\n          e = isNaN(t) || isNaN(this.s) ? 0 : this.s,\n          n = this.l,\n          r = n + (n < .5 ? n : 1 - n) * e,\n          i = 2 * n - r;\n        return new P(H(t >= 240 ? t - 240 : t + 120, i, r), H(t, i, r), H(t < 120 ? t + 240 : t - 120, i, r), this.opacity);\n      },\n      displayable: function displayable() {\n        return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;\n      },\n      formatHsl: function formatHsl() {\n        var t = this.opacity;\n        return (1 === (t = isNaN(t) ? 1 : Math.max(0, Math.min(1, t))) ? \"hsl(\" : \"hsla(\") + (this.h || 0) + \", \" + 100 * (this.s || 0) + \"%, \" + 100 * (this.l || 0) + \"%\" + (1 === t ? \")\" : \", \" + t + \")\");\n      }\n    }));\n    var Z = function Z(t) {\n      return function () {\n        return t;\n      };\n    };\n    function W(t, e) {\n      var n = e - t;\n      return n ? function (t, e) {\n        return function (n) {\n          return t + n * e;\n        };\n      }(t, n) : Z(isNaN(t) ? e : t);\n    }\n    var X = function t(e) {\n      var n = function (t) {\n        return 1 == (t = +t) ? W : function (e, n) {\n          return n - e ? function (t, e, n) {\n            return t = Math.pow(t, n), e = Math.pow(e, n) - t, n = 1 / n, function (r) {\n              return Math.pow(t + r * e, n);\n            };\n          }(e, n, t) : Z(isNaN(e) ? n : e);\n        };\n      }(e);\n      function r(t, e) {\n        var r = n((t = L(t)).r, (e = L(e)).r),\n          i = n(t.g, e.g),\n          o = n(t.b, e.b),\n          s = W(t.opacity, e.opacity);\n        return function (e) {\n          return t.r = r(e), t.g = i(e), t.b = o(e), t.opacity = s(e), t + \"\";\n        };\n      }\n      return r.gamma = t, r;\n    }(1);\n    function V(t) {\n      return function (e) {\n        var n,\n          r,\n          i = e.length,\n          o = new Array(i),\n          s = new Array(i),\n          a = new Array(i);\n        for (n = 0; n < i; ++n) r = L(e[n]), o[n] = r.r || 0, s[n] = r.g || 0, a[n] = r.b || 0;\n        return o = t(o), s = t(s), a = t(a), r.opacity = 1, function (t) {\n          return r.r = o(t), r.g = s(t), r.b = a(t), r + \"\";\n        };\n      };\n    }\n    function Y(t, e) {\n      var n,\n        r = e ? e.length : 0,\n        i = t ? Math.min(r, t.length) : 0,\n        o = new Array(i),\n        s = new Array(r);\n      for (n = 0; n < i; ++n) o[n] = it(t[n], e[n]);\n      for (; n < r; ++n) s[n] = e[n];\n      return function (t) {\n        for (n = 0; n < i; ++n) s[n] = o[n](t);\n        return s;\n      };\n    }\n    function K(t, e) {\n      var n = new Date();\n      return t = +t, e = +e, function (r) {\n        return n.setTime(t * (1 - r) + e * r), n;\n      };\n    }\n    function J(t, e) {\n      return t = +t, e = +e, function (n) {\n        return t * (1 - n) + e * n;\n      };\n    }\n    function Q(t, e) {\n      var n,\n        r = {},\n        i = {};\n      for (n in null !== t && \"object\" == _typeof(t) || (t = {}), null !== e && \"object\" == _typeof(e) || (e = {}), e) n in t ? r[n] = it(t[n], e[n]) : i[n] = e[n];\n      return function (t) {\n        for (n in r) i[n] = r[n](t);\n        return i;\n      };\n    }\n    V(function (t) {\n      var e = t.length - 1;\n      return function (n) {\n        var r = n <= 0 ? n = 0 : n >= 1 ? (n = 1, e - 1) : Math.floor(n * e),\n          i = t[r],\n          o = t[r + 1],\n          s = r > 0 ? t[r - 1] : 2 * i - o,\n          a = r < e - 1 ? t[r + 2] : 2 * o - i;\n        return G((n - r / e) * e, s, i, o, a);\n      };\n    }), V(function (t) {\n      var e = t.length;\n      return function (n) {\n        var r = Math.floor(((n %= 1) < 0 ? ++n : n) * e),\n          i = t[(r + e - 1) % e],\n          o = t[r % e],\n          s = t[(r + 1) % e],\n          a = t[(r + 2) % e];\n        return G((n - r / e) * e, i, o, s, a);\n      };\n    });\n    var tt = /[-+]?(?:\\d+\\.?\\d*|\\.?\\d+)(?:[eE][-+]?\\d+)?/g,\n      et = new RegExp(tt.source, \"g\");\n    function nt(t, e) {\n      var n,\n        r,\n        i,\n        o = tt.lastIndex = et.lastIndex = 0,\n        s = -1,\n        a = [],\n        l = [];\n      for (t += \"\", e += \"\"; (n = tt.exec(t)) && (r = et.exec(e));) (i = r.index) > o && (i = e.slice(o, i), a[s] ? a[s] += i : a[++s] = i), (n = n[0]) === (r = r[0]) ? a[s] ? a[s] += r : a[++s] = r : (a[++s] = null, l.push({\n        i: s,\n        x: J(n, r)\n      })), o = et.lastIndex;\n      return o < e.length && (i = e.slice(o), a[s] ? a[s] += i : a[++s] = i), a.length < 2 ? l[0] ? function (t) {\n        return function (e) {\n          return t(e) + \"\";\n        };\n      }(l[0].x) : function (t) {\n        return function () {\n          return t;\n        };\n      }(e) : (e = l.length, function (t) {\n        for (var n, r = 0; r < e; ++r) a[(n = l[r]).i] = n.x(t);\n        return a.join(\"\");\n      });\n    }\n    function rt(t, e) {\n      e || (e = []);\n      var n,\n        r = t ? Math.min(e.length, t.length) : 0,\n        i = e.slice();\n      return function (o) {\n        for (n = 0; n < r; ++n) i[n] = t[n] * (1 - o) + e[n] * o;\n        return i;\n      };\n    }\n    function it(t, e) {\n      var n,\n        r,\n        i = _typeof(e);\n      return null == e || \"boolean\" === i ? Z(e) : (\"number\" === i ? J : \"string\" === i ? (n = C(e)) ? (e = n, X) : nt : e instanceof C ? X : e instanceof Date ? K : (r = e, !ArrayBuffer.isView(r) || r instanceof DataView ? Array.isArray(e) ? Y : \"function\" != typeof e.valueOf && \"function\" != typeof e.toString || isNaN(e) ? Q : J : rt))(t, e);\n    }\n    function ot(t, e) {\n      return t = +t, e = +e, function (n) {\n        return Math.round(t * (1 - n) + e * n);\n      };\n    }\n    function st(t) {\n      return +t;\n    }\n    var at = [0, 1];\n    function lt(t) {\n      return t;\n    }\n    function ht(t, e) {\n      return (e -= t = +t) ? function (n) {\n        return (n - t) / e;\n      } : (n = isNaN(e) ? NaN : .5, function () {\n        return n;\n      });\n      var n;\n    }\n    function ut(t, e, n) {\n      var r = t[0],\n        i = t[1],\n        o = e[0],\n        s = e[1];\n      return i < r ? (r = ht(i, r), o = n(s, o)) : (r = ht(r, i), o = n(o, s)), function (t) {\n        return o(r(t));\n      };\n    }\n    function ft(t, e, n) {\n      var r = Math.min(t.length, e.length) - 1,\n        i = new Array(r),\n        o = new Array(r),\n        s = -1;\n      for (t[r] < t[0] && (t = t.slice().reverse(), e = e.slice().reverse()); ++s < r;) i[s] = ht(t[s], t[s + 1]), o[s] = n(e[s], e[s + 1]);\n      return function (e) {\n        var n = g(t, e, 1, r) - 1;\n        return o[n](i[n](e));\n      };\n    }\n    var ct,\n      dt = /^(?:(.)?([<>=^]))?([+\\-( ])?([$#])?(0)?(\\d+)?(,)?(\\.\\d+)?(~)?([a-z%])?$/i;\n    function gt(t) {\n      if (!(e = dt.exec(t))) throw new Error(\"invalid format: \" + t);\n      var e;\n      return new pt({\n        fill: e[1],\n        align: e[2],\n        sign: e[3],\n        symbol: e[4],\n        zero: e[5],\n        width: e[6],\n        comma: e[7],\n        precision: e[8] && e[8].slice(1),\n        trim: e[9],\n        type: e[10]\n      });\n    }\n    function pt(t) {\n      this.fill = void 0 === t.fill ? \" \" : t.fill + \"\", this.align = void 0 === t.align ? \">\" : t.align + \"\", this.sign = void 0 === t.sign ? \"-\" : t.sign + \"\", this.symbol = void 0 === t.symbol ? \"\" : t.symbol + \"\", this.zero = !!t.zero, this.width = void 0 === t.width ? void 0 : +t.width, this.comma = !!t.comma, this.precision = void 0 === t.precision ? void 0 : +t.precision, this.trim = !!t.trim, this.type = void 0 === t.type ? \"\" : t.type + \"\";\n    }\n    function mt(t, e) {\n      if ((n = (t = e ? t.toExponential(e - 1) : t.toExponential()).indexOf(\"e\")) < 0) return null;\n      var n,\n        r = t.slice(0, n);\n      return [r.length > 1 ? r[0] + r.slice(2) : r, +t.slice(n + 1)];\n    }\n    function yt(t) {\n      return (t = mt(Math.abs(t))) ? t[1] : NaN;\n    }\n    function bt(t, e) {\n      var n = mt(t, e);\n      if (!n) return t + \"\";\n      var r = n[0],\n        i = n[1];\n      return i < 0 ? \"0.\" + new Array(-i).join(\"0\") + r : r.length > i + 1 ? r.slice(0, i + 1) + \".\" + r.slice(i + 1) : r + new Array(i - r.length + 2).join(\"0\");\n    }\n    gt.prototype = pt.prototype, pt.prototype.toString = function () {\n      return this.fill + this.align + this.sign + this.symbol + (this.zero ? \"0\" : \"\") + (void 0 === this.width ? \"\" : Math.max(1, 0 | this.width)) + (this.comma ? \",\" : \"\") + (void 0 === this.precision ? \"\" : \".\" + Math.max(0, 0 | this.precision)) + (this.trim ? \"~\" : \"\") + this.type;\n    };\n    var wt = {\n      \"%\": function _(t, e) {\n        return (100 * t).toFixed(e);\n      },\n      b: function b(t) {\n        return Math.round(t).toString(2);\n      },\n      c: function c(t) {\n        return t + \"\";\n      },\n      d: function d(t) {\n        return Math.abs(t = Math.round(t)) >= 1e21 ? t.toLocaleString(\"en\").replace(/,/g, \"\") : t.toString(10);\n      },\n      e: function e(t, _e34) {\n        return t.toExponential(_e34);\n      },\n      f: function f(t, e) {\n        return t.toFixed(e);\n      },\n      g: function g(t, e) {\n        return t.toPrecision(e);\n      },\n      o: function o(t) {\n        return Math.round(t).toString(8);\n      },\n      p: function p(t, e) {\n        return bt(100 * t, e);\n      },\n      r: bt,\n      s: function s(t, e) {\n        var n = mt(t, e);\n        if (!n) return t + \"\";\n        var r = n[0],\n          i = n[1],\n          o = i - (ct = 3 * Math.max(-8, Math.min(8, Math.floor(i / 3)))) + 1,\n          s = r.length;\n        return o === s ? r : o > s ? r + new Array(o - s + 1).join(\"0\") : o > 0 ? r.slice(0, o) + \".\" + r.slice(o) : \"0.\" + new Array(1 - o).join(\"0\") + mt(t, Math.max(0, e + o - 1))[0];\n      },\n      X: function X(t) {\n        return Math.round(t).toString(16).toUpperCase();\n      },\n      x: function x(t) {\n        return Math.round(t).toString(16);\n      }\n    };\n    function vt(t) {\n      return t;\n    }\n    var _t,\n      xt,\n      kt,\n      Et = Array.prototype.map,\n      St = [\"y\", \"z\", \"a\", \"f\", \"p\", \"n\", \"µ\", \"m\", \"\", \"k\", \"M\", \"G\", \"T\", \"P\", \"E\", \"Z\", \"Y\"];\n    function At(t) {\n      var e = t.domain;\n      return t.ticks = function (t) {\n        var n = e();\n        return function (t, e, n) {\n          var r,\n            i,\n            o,\n            s,\n            a = -1;\n          if (n = +n, (t = +t) == (e = +e) && n > 0) return [t];\n          if ((r = e < t) && (i = t, t = e, e = i), 0 === (s = h(t, e, n)) || !isFinite(s)) return [];\n          if (s > 0) {\n            var _n19 = Math.round(t / s),\n              _r22 = Math.round(e / s);\n            for (_n19 * s < t && ++_n19, _r22 * s > e && --_r22, o = new Array(i = _r22 - _n19 + 1); ++a < i;) o[a] = (_n19 + a) * s;\n          } else {\n            s = -s;\n            var _n20 = Math.round(t * s),\n              _r23 = Math.round(e * s);\n            for (_n20 / s < t && ++_n20, _r23 / s > e && --_r23, o = new Array(i = _r23 - _n20 + 1); ++a < i;) o[a] = (_n20 + a) / s;\n          }\n          return r && o.reverse(), o;\n        }(n[0], n[n.length - 1], null == t ? 10 : t);\n      }, t.tickFormat = function (t, n) {\n        var r = e();\n        return function (t, e, n, r) {\n          var i,\n            o = function (t, e, n) {\n              var r = Math.abs(e - t) / Math.max(0, n),\n                i = Math.pow(10, Math.floor(Math.log(r) / Math.LN10)),\n                o = r / i;\n              return o >= s ? i *= 10 : o >= a ? i *= 5 : o >= l && (i *= 2), e < t ? -i : i;\n            }(t, e, n);\n          switch ((r = gt(null == r ? \",f\" : r)).type) {\n            case \"s\":\n              var h = Math.max(Math.abs(t), Math.abs(e));\n              return null != r.precision || isNaN(i = function (t, e) {\n                return Math.max(0, 3 * Math.max(-8, Math.min(8, Math.floor(yt(e) / 3))) - yt(Math.abs(t)));\n              }(o, h)) || (r.precision = i), kt(r, h);\n            case \"\":\n            case \"e\":\n            case \"g\":\n            case \"p\":\n            case \"r\":\n              null != r.precision || isNaN(i = function (t, e) {\n                return t = Math.abs(t), e = Math.abs(e) - t, Math.max(0, yt(e) - yt(t)) + 1;\n              }(o, Math.max(Math.abs(t), Math.abs(e)))) || (r.precision = i - (\"e\" === r.type));\n              break;\n            case \"f\":\n            case \"%\":\n              null != r.precision || isNaN(i = function (t) {\n                return Math.max(0, -yt(Math.abs(t)));\n              }(o)) || (r.precision = i - 2 * (\"%\" === r.type));\n          }\n          return xt(r);\n        }(r[0], r[r.length - 1], null == t ? 10 : t, n);\n      }, t.nice = function (n) {\n        null == n && (n = 10);\n        var r,\n          i,\n          o = e(),\n          s = 0,\n          a = o.length - 1,\n          l = o[s],\n          u = o[a],\n          f = 10;\n        for (u < l && (i = l, l = u, u = i, i = s, s = a, a = i); f-- > 0;) {\n          if ((i = h(l, u, n)) === r) return o[s] = l, o[a] = u, e(o);\n          if (i > 0) l = Math.floor(l / i) * i, u = Math.ceil(u / i) * i;else {\n            if (!(i < 0)) break;\n            l = Math.ceil(l * i) / i, u = Math.floor(u * i) / i;\n          }\n          r = i;\n        }\n        return t;\n      }, t;\n    }\n    function Mt() {\n      var t = function () {\n        var t,\n          e,\n          n,\n          r,\n          i,\n          o,\n          s = at,\n          a = at,\n          l = it,\n          h = lt;\n        function u() {\n          var t,\n            e,\n            n,\n            l = Math.min(s.length, a.length);\n          return h !== lt && (t = s[0], e = s[l - 1], t > e && (n = t, t = e, e = n), h = function h(n) {\n            return Math.max(t, Math.min(e, n));\n          }), r = l > 2 ? ft : ut, i = o = null, f;\n        }\n        function f(e) {\n          return null == e || isNaN(e = +e) ? n : (i || (i = r(s.map(t), a, l)))(t(h(e)));\n        }\n        return f.invert = function (n) {\n          return h(e((o || (o = r(a, s.map(t), J)))(n)));\n        }, f.domain = function (t) {\n          return arguments.length ? (s = Array.from(t, st), u()) : s.slice();\n        }, f.range = function (t) {\n          return arguments.length ? (a = Array.from(t), u()) : a.slice();\n        }, f.rangeRound = function (t) {\n          return a = Array.from(t), l = ot, u();\n        }, f.clamp = function (t) {\n          return arguments.length ? (h = !!t || lt, u()) : h !== lt;\n        }, f.interpolate = function (t) {\n          return arguments.length ? (l = t, u()) : l;\n        }, f.unknown = function (t) {\n          return arguments.length ? (n = t, f) : n;\n        }, function (n, r) {\n          return t = n, e = r, u();\n        };\n      }()(lt, lt);\n      return t.copy = function () {\n        return e = t, Mt().domain(e.domain()).range(e.range()).interpolate(e.interpolate()).clamp(e.clamp()).unknown(e.unknown());\n        var e;\n      }, e.apply(t, arguments), At(t);\n    }\n    function It(t, e) {\n      if ((n = (t = e ? t.toExponential(e - 1) : t.toExponential()).indexOf(\"e\")) < 0) return null;\n      var n,\n        r = t.slice(0, n);\n      return [r.length > 1 ? r[0] + r.slice(2) : r, +t.slice(n + 1)];\n    }\n    _t = function (t) {\n      var e,\n        n,\n        r = void 0 === t.grouping || void 0 === t.thousands ? vt : (e = Et.call(t.grouping, Number), n = t.thousands + \"\", function (t, r) {\n          for (var i = t.length, o = [], s = 0, a = e[0], l = 0; i > 0 && a > 0 && (l + a + 1 > r && (a = Math.max(1, r - l)), o.push(t.substring(i -= a, i + a)), !((l += a + 1) > r));) a = e[s = (s + 1) % e.length];\n          return o.reverse().join(n);\n        }),\n        i = void 0 === t.currency ? \"\" : t.currency[0] + \"\",\n        o = void 0 === t.currency ? \"\" : t.currency[1] + \"\",\n        s = void 0 === t.decimal ? \".\" : t.decimal + \"\",\n        a = void 0 === t.numerals ? vt : function (t) {\n          return function (e) {\n            return e.replace(/[0-9]/g, function (e) {\n              return t[+e];\n            });\n          };\n        }(Et.call(t.numerals, String)),\n        l = void 0 === t.percent ? \"%\" : t.percent + \"\",\n        h = void 0 === t.minus ? \"−\" : t.minus + \"\",\n        u = void 0 === t.nan ? \"NaN\" : t.nan + \"\";\n      function f(t) {\n        var e = (t = gt(t)).fill,\n          n = t.align,\n          f = t.sign,\n          c = t.symbol,\n          d = t.zero,\n          g = t.width,\n          p = t.comma,\n          m = t.precision,\n          y = t.trim,\n          b = t.type;\n        \"n\" === b ? (p = !0, b = \"g\") : wt[b] || (void 0 === m && (m = 12), y = !0, b = \"g\"), (d || \"0\" === e && \"=\" === n) && (d = !0, e = \"0\", n = \"=\");\n        var w = \"$\" === c ? i : \"#\" === c && /[boxX]/.test(b) ? \"0\" + b.toLowerCase() : \"\",\n          v = \"$\" === c ? o : /[%p]/.test(b) ? l : \"\",\n          _ = wt[b],\n          x = /[defgprs%]/.test(b);\n        function k(t) {\n          var i,\n            o,\n            l,\n            c = w,\n            k = v;\n          if (\"c\" === b) k = _(t) + k, t = \"\";else {\n            var E = (t = +t) < 0 || 1 / t < 0;\n            if (t = isNaN(t) ? u : _(Math.abs(t), m), y && (t = function (t) {\n              t: for (var e, n = t.length, r = 1, i = -1; r < n; ++r) switch (t[r]) {\n                case \".\":\n                  i = e = r;\n                  break;\n                case \"0\":\n                  0 === i && (i = r), e = r;\n                  break;\n                default:\n                  if (!+t[r]) break t;\n                  i > 0 && (i = 0);\n              }\n              return i > 0 ? t.slice(0, i) + t.slice(e + 1) : t;\n            }(t)), E && 0 == +t && \"+\" !== f && (E = !1), c = (E ? \"(\" === f ? f : h : \"-\" === f || \"(\" === f ? \"\" : f) + c, k = (\"s\" === b ? St[8 + ct / 3] : \"\") + k + (E && \"(\" === f ? \")\" : \"\"), x) for (i = -1, o = t.length; ++i < o;) if (48 > (l = t.charCodeAt(i)) || l > 57) {\n              k = (46 === l ? s + t.slice(i + 1) : t.slice(i)) + k, t = t.slice(0, i);\n              break;\n            }\n          }\n          p && !d && (t = r(t, 1 / 0));\n          var S = c.length + t.length + k.length,\n            A = S < g ? new Array(g - S + 1).join(e) : \"\";\n          switch (p && d && (t = r(A + t, A.length ? g - k.length : 1 / 0), A = \"\"), n) {\n            case \"<\":\n              t = c + t + k + A;\n              break;\n            case \"=\":\n              t = c + A + t + k;\n              break;\n            case \"^\":\n              t = A.slice(0, S = A.length >> 1) + c + t + k + A.slice(S);\n              break;\n            default:\n              t = A + c + t + k;\n          }\n          return a(t);\n        }\n        return m = void 0 === m ? 6 : /[gprs]/.test(b) ? Math.max(1, Math.min(21, m)) : Math.max(0, Math.min(20, m)), k.toString = function () {\n          return t + \"\";\n        }, k;\n      }\n      return {\n        format: f,\n        formatPrefix: function formatPrefix(t, e) {\n          var n = f(((t = gt(t)).type = \"f\", t)),\n            r = 3 * Math.max(-8, Math.min(8, Math.floor(yt(e) / 3))),\n            i = Math.pow(10, -r),\n            o = St[8 + r / 3];\n          return function (t) {\n            return n(i * t) + o;\n          };\n        }\n      };\n    }({\n      thousands: \",\",\n      grouping: [3],\n      currency: [\"$\", \"\"]\n    }), xt = _t.format, kt = _t.formatPrefix;\n    var Rt,\n      Bt = /^(?:(.)?([<>=^]))?([+\\-( ])?([$#])?(0)?(\\d+)?(,)?(\\.\\d+)?(~)?([a-z%])?$/i;\n    function Tt(t) {\n      if (!(e = Bt.exec(t))) throw new Error(\"invalid format: \" + t);\n      var e;\n      return new Ot({\n        fill: e[1],\n        align: e[2],\n        sign: e[3],\n        symbol: e[4],\n        zero: e[5],\n        width: e[6],\n        comma: e[7],\n        precision: e[8] && e[8].slice(1),\n        trim: e[9],\n        type: e[10]\n      });\n    }\n    function Ot(t) {\n      this.fill = void 0 === t.fill ? \" \" : t.fill + \"\", this.align = void 0 === t.align ? \">\" : t.align + \"\", this.sign = void 0 === t.sign ? \"-\" : t.sign + \"\", this.symbol = void 0 === t.symbol ? \"\" : t.symbol + \"\", this.zero = !!t.zero, this.width = void 0 === t.width ? void 0 : +t.width, this.comma = !!t.comma, this.precision = void 0 === t.precision ? void 0 : +t.precision, this.trim = !!t.trim, this.type = void 0 === t.type ? \"\" : t.type + \"\";\n    }\n    function Ct(t, e) {\n      var n = It(t, e);\n      if (!n) return t + \"\";\n      var r = n[0],\n        i = n[1];\n      return i < 0 ? \"0.\" + new Array(-i).join(\"0\") + r : r.length > i + 1 ? r.slice(0, i + 1) + \".\" + r.slice(i + 1) : r + new Array(i - r.length + 2).join(\"0\");\n    }\n    Tt.prototype = Ot.prototype, Ot.prototype.toString = function () {\n      return this.fill + this.align + this.sign + this.symbol + (this.zero ? \"0\" : \"\") + (void 0 === this.width ? \"\" : Math.max(1, 0 | this.width)) + (this.comma ? \",\" : \"\") + (void 0 === this.precision ? \"\" : \".\" + Math.max(0, 0 | this.precision)) + (this.trim ? \"~\" : \"\") + this.type;\n    };\n    var Nt = {\n      \"%\": function _(t, e) {\n        return (100 * t).toFixed(e);\n      },\n      b: function b(t) {\n        return Math.round(t).toString(2);\n      },\n      c: function c(t) {\n        return t + \"\";\n      },\n      d: function d(t) {\n        return Math.abs(t = Math.round(t)) >= 1e21 ? t.toLocaleString(\"en\").replace(/,/g, \"\") : t.toString(10);\n      },\n      e: function e(t, _e35) {\n        return t.toExponential(_e35);\n      },\n      f: function f(t, e) {\n        return t.toFixed(e);\n      },\n      g: function g(t, e) {\n        return t.toPrecision(e);\n      },\n      o: function o(t) {\n        return Math.round(t).toString(8);\n      },\n      p: function p(t, e) {\n        return Ct(100 * t, e);\n      },\n      r: Ct,\n      s: function s(t, e) {\n        var n = It(t, e);\n        if (!n) return t + \"\";\n        var r = n[0],\n          i = n[1],\n          o = i - (Rt = 3 * Math.max(-8, Math.min(8, Math.floor(i / 3)))) + 1,\n          s = r.length;\n        return o === s ? r : o > s ? r + new Array(o - s + 1).join(\"0\") : o > 0 ? r.slice(0, o) + \".\" + r.slice(o) : \"0.\" + new Array(1 - o).join(\"0\") + It(t, Math.max(0, e + o - 1))[0];\n      },\n      X: function X(t) {\n        return Math.round(t).toString(16).toUpperCase();\n      },\n      x: function x(t) {\n        return Math.round(t).toString(16);\n      }\n    };\n    function zt(t) {\n      return t;\n    }\n    var Lt,\n      Pt,\n      Ut = Array.prototype.map,\n      $t = [\"y\", \"z\", \"a\", \"f\", \"p\", \"n\", \"µ\", \"m\", \"\", \"k\", \"M\", \"G\", \"T\", \"P\", \"E\", \"Z\", \"Y\"];\n    Lt = function (t) {\n      var e,\n        n,\n        r = void 0 === t.grouping || void 0 === t.thousands ? zt : (e = Ut.call(t.grouping, Number), n = t.thousands + \"\", function (t, r) {\n          for (var i = t.length, o = [], s = 0, a = e[0], l = 0; i > 0 && a > 0 && (l + a + 1 > r && (a = Math.max(1, r - l)), o.push(t.substring(i -= a, i + a)), !((l += a + 1) > r));) a = e[s = (s + 1) % e.length];\n          return o.reverse().join(n);\n        }),\n        i = void 0 === t.currency ? \"\" : t.currency[0] + \"\",\n        o = void 0 === t.currency ? \"\" : t.currency[1] + \"\",\n        s = void 0 === t.decimal ? \".\" : t.decimal + \"\",\n        a = void 0 === t.numerals ? zt : function (t) {\n          return function (e) {\n            return e.replace(/[0-9]/g, function (e) {\n              return t[+e];\n            });\n          };\n        }(Ut.call(t.numerals, String)),\n        l = void 0 === t.percent ? \"%\" : t.percent + \"\",\n        h = void 0 === t.minus ? \"−\" : t.minus + \"\",\n        u = void 0 === t.nan ? \"NaN\" : t.nan + \"\";\n      function f(t) {\n        var e = (t = Tt(t)).fill,\n          n = t.align,\n          f = t.sign,\n          c = t.symbol,\n          d = t.zero,\n          g = t.width,\n          p = t.comma,\n          m = t.precision,\n          y = t.trim,\n          b = t.type;\n        \"n\" === b ? (p = !0, b = \"g\") : Nt[b] || (void 0 === m && (m = 12), y = !0, b = \"g\"), (d || \"0\" === e && \"=\" === n) && (d = !0, e = \"0\", n = \"=\");\n        var w = \"$\" === c ? i : \"#\" === c && /[boxX]/.test(b) ? \"0\" + b.toLowerCase() : \"\",\n          v = \"$\" === c ? o : /[%p]/.test(b) ? l : \"\",\n          _ = Nt[b],\n          x = /[defgprs%]/.test(b);\n        function k(t) {\n          var i,\n            o,\n            l,\n            c = w,\n            k = v;\n          if (\"c\" === b) k = _(t) + k, t = \"\";else {\n            var E = (t = +t) < 0 || 1 / t < 0;\n            if (t = isNaN(t) ? u : _(Math.abs(t), m), y && (t = function (t) {\n              t: for (var e, n = t.length, r = 1, i = -1; r < n; ++r) switch (t[r]) {\n                case \".\":\n                  i = e = r;\n                  break;\n                case \"0\":\n                  0 === i && (i = r), e = r;\n                  break;\n                default:\n                  if (!+t[r]) break t;\n                  i > 0 && (i = 0);\n              }\n              return i > 0 ? t.slice(0, i) + t.slice(e + 1) : t;\n            }(t)), E && 0 == +t && \"+\" !== f && (E = !1), c = (E ? \"(\" === f ? f : h : \"-\" === f || \"(\" === f ? \"\" : f) + c, k = (\"s\" === b ? $t[8 + Rt / 3] : \"\") + k + (E && \"(\" === f ? \")\" : \"\"), x) for (i = -1, o = t.length; ++i < o;) if (48 > (l = t.charCodeAt(i)) || l > 57) {\n              k = (46 === l ? s + t.slice(i + 1) : t.slice(i)) + k, t = t.slice(0, i);\n              break;\n            }\n          }\n          p && !d && (t = r(t, 1 / 0));\n          var S = c.length + t.length + k.length,\n            A = S < g ? new Array(g - S + 1).join(e) : \"\";\n          switch (p && d && (t = r(A + t, A.length ? g - k.length : 1 / 0), A = \"\"), n) {\n            case \"<\":\n              t = c + t + k + A;\n              break;\n            case \"=\":\n              t = c + A + t + k;\n              break;\n            case \"^\":\n              t = A.slice(0, S = A.length >> 1) + c + t + k + A.slice(S);\n              break;\n            default:\n              t = A + c + t + k;\n          }\n          return a(t);\n        }\n        return m = void 0 === m ? 6 : /[gprs]/.test(b) ? Math.max(1, Math.min(21, m)) : Math.max(0, Math.min(20, m)), k.toString = function () {\n          return t + \"\";\n        }, k;\n      }\n      return {\n        format: f,\n        formatPrefix: function formatPrefix(t, e) {\n          var n,\n            r = f(((t = Tt(t)).type = \"f\", t)),\n            i = 3 * Math.max(-8, Math.min(8, Math.floor((n = e, ((n = It(Math.abs(n))) ? n[1] : NaN) / 3)))),\n            o = Math.pow(10, -i),\n            s = $t[8 + i / 3];\n          return function (t) {\n            return r(o * t) + s;\n          };\n        }\n      };\n    }({\n      thousands: \",\",\n      grouping: [3],\n      currency: [\"$\", \"\"]\n    }), Pt = Lt.format, Lt.formatPrefix;\n    var jt = n(934);\n    var Ft = jt.expose,\n      Dt = (jt.registerSerializer, jt.Transfer);\n    var qt = /*#__PURE__*/function () {\n      function qt(t, e) {\n        _classCallCheck(this, qt);\n        this.blockPosition = t, this.dataPosition = e;\n      }\n      _createClass(qt, [{\n        key: \"toString\",\n        value: function toString() {\n          return \"\".concat(this.blockPosition, \":\").concat(this.dataPosition);\n        }\n      }, {\n        key: \"compareTo\",\n        value: function compareTo(t) {\n          return this.blockPosition - t.blockPosition || this.dataPosition - t.dataPosition;\n        }\n      }], [{\n        key: \"min\",\n        value: function min() {\n          var e,\n            n = 0;\n          for (var _len = arguments.length, t = new Array(_len), _key = 0; _key < _len; _key++) {\n            t[_key] = arguments[_key];\n          }\n          for (; !e; n += 1) e = t[n];\n          for (; n < t.length; n += 1) e.compareTo(t[n]) > 0 && (e = t[n]);\n          return e;\n        }\n      }]);\n      return qt;\n    }();\n    function Ht(t) {\n      var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;\n      var n = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : !1;\n      if (n) throw new Error(\"big-endian virtual file offsets not implemented\");\n      return new qt(1099511627776 * t[e + 7] + 4294967296 * t[e + 6] + 16777216 * t[e + 5] + 65536 * t[e + 4] + 256 * t[e + 3] + t[e + 2], t[e + 1] << 8 | t[e]);\n    }\n    var Gt = /*#__PURE__*/function () {\n      function Gt(t, e, n, r) {\n        _classCallCheck(this, Gt);\n        this.minv = t, this.maxv = e, this.bin = n, this._fetchedSize = r;\n      }\n      _createClass(Gt, [{\n        key: \"toUniqueString\",\n        value: function toUniqueString() {\n          return \"\".concat(this.minv.toString(), \"..\").concat(this.maxv.toString(), \" (bin \").concat(this.bin, \", fetchedSize \").concat(this.fetchedSize(), \")\");\n        }\n      }, {\n        key: \"toString\",\n        value: function toString() {\n          return this.toUniqueString();\n        }\n      }, {\n        key: \"compareTo\",\n        value: function compareTo(t) {\n          return this.minv.compareTo(t.minv) || this.maxv.compareTo(t.maxv) || this.bin - t.bin;\n        }\n      }, {\n        key: \"fetchedSize\",\n        value: function fetchedSize() {\n          return void 0 !== this._fetchedSize ? this._fetchedSize : this.maxv.blockPosition + 65536 - this.minv.blockPosition;\n        }\n      }]);\n      return Gt;\n    }();\n    var Zt = n(720),\n      Wt = n.n(Zt);\n    function Xt(t) {\n      return new Promise(function (e) {\n        return setTimeout(e, t);\n      });\n    }\n    function Vt(t, e) {\n      var n = [];\n      var r;\n      if (0 === t.length) return t;\n      t.sort(function (t, e) {\n        var n = t.minv.blockPosition - e.minv.blockPosition;\n        return 0 === n ? t.minv.dataPosition - e.minv.dataPosition : n;\n      });\n      var _iterator10 = _createForOfIteratorHelper(t),\n        _step10;\n      try {\n        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {\n          var _s12 = _step10.value;\n          (!e || _s12.maxv.compareTo(e) > 0) && (void 0 === r ? (n.push(_s12), r = _s12) : (i = r, (o = _s12).minv.blockPosition - i.maxv.blockPosition < 65e3 && o.maxv.blockPosition - i.minv.blockPosition < 5e6 ? _s12.maxv.compareTo(r.maxv) > 0 && (r.maxv = _s12.maxv) : (n.push(_s12), r = _s12)));\n        }\n      } catch (err) {\n        _iterator10.e(err);\n      } finally {\n        _iterator10.f();\n      }\n      var i, o;\n      return n;\n    }\n    function Yt(t, e) {\n      return {\n        lineCount: function (t) {\n          if (t.greaterThan(Number.MAX_SAFE_INTEGER) || t.lessThan(Number.MIN_SAFE_INTEGER)) throw new Error(\"integer overflow\");\n          return t.toNumber();\n        }(Wt().fromBytesLE(Array.prototype.slice.call(t, e, e + 8), !0))\n      };\n    }\n    function Kt(t, e) {\n      return t ? t.compareTo(e) > 0 ? e : t : e;\n    }\n    function Jt(t) {\n      var e = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (t) {\n        return t;\n      };\n      var n = 0,\n        r = 0;\n      var i = [],\n        o = {};\n      for (var _s13 = 0; _s13 < t.length; _s13 += 1) if (!t[_s13]) {\n        if (r < _s13) {\n          var _a9 = t.toString(\"utf8\", r, _s13);\n          _a9 = e(_a9), i[n] = _a9, o[_a9] = n;\n        }\n        r = _s13 + 1, n += 1;\n      }\n      return {\n        refNameToId: o,\n        refIdToName: i\n      };\n    }\n    var Qt = /*#__PURE__*/_createClass(function Qt(_ref14) {\n      var t = _ref14.filehandle,\n        _ref14$renameRefSeq = _ref14.renameRefSeq,\n        e = _ref14$renameRefSeq === void 0 ? function (t) {\n          return t;\n        } : _ref14$renameRefSeq;\n      _classCallCheck(this, Qt);\n      this.filehandle = t, this.renameRefSeq = e;\n    });\n    var te = /*#__PURE__*/function (_Qt) {\n      _inherits(te, _Qt);\n      var _super3 = _createSuper(te);\n      function te() {\n        _classCallCheck(this, te);\n        return _super3.apply(this, arguments);\n      }\n      _createClass(te, [{\n        key: \"lineCount\",\n        value: function () {\n          var _lineCount = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee30(t, e) {\n            var n, r;\n            return _regeneratorRuntime().wrap(function _callee30$(_context33) {\n              while (1) switch (_context33.prev = _context33.next) {\n                case 0:\n                  _context33.next = 2;\n                  return this.parse(e);\n                case 2:\n                  _context33.t3 = t;\n                  _context33.t4 = n = _context33.sent.indices[_context33.t3];\n                  _context33.t2 = null === _context33.t4;\n                  if (_context33.t2) {\n                    _context33.next = 7;\n                    break;\n                  }\n                  _context33.t2 = void 0 === n;\n                case 7:\n                  if (!_context33.t2) {\n                    _context33.next = 11;\n                    break;\n                  }\n                  _context33.t5 = void 0;\n                  _context33.next = 12;\n                  break;\n                case 11:\n                  _context33.t5 = n.stats;\n                case 12:\n                  _context33.t6 = r = _context33.t5;\n                  _context33.t1 = null === _context33.t6;\n                  if (_context33.t1) {\n                    _context33.next = 16;\n                    break;\n                  }\n                  _context33.t1 = void 0 === r;\n                case 16:\n                  if (!_context33.t1) {\n                    _context33.next = 20;\n                    break;\n                  }\n                  _context33.t7 = void 0;\n                  _context33.next = 21;\n                  break;\n                case 20:\n                  _context33.t7 = r.lineCount;\n                case 21:\n                  _context33.t0 = _context33.t7;\n                  if (_context33.t0) {\n                    _context33.next = 24;\n                    break;\n                  }\n                  _context33.t0 = 0;\n                case 24:\n                  return _context33.abrupt(\"return\", _context33.t0);\n                case 25:\n                case \"end\":\n                  return _context33.stop();\n              }\n            }, _callee30, this);\n          }));\n          function lineCount(_x42, _x43) {\n            return _lineCount.apply(this, arguments);\n          }\n          return lineCount;\n        }()\n      }, {\n        key: \"_parse\",\n        value: function () {\n          var _parse2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee31(t) {\n            var e, n, r, i, o, _t20, _n21, _s14, _a10, _t21, _t22, _n22, _o8, _s15, _n23, _a11, _l4, _h4, _t23, _n24;\n            return _regeneratorRuntime().wrap(function _callee31$(_context34) {\n              while (1) switch (_context34.prev = _context34.next) {\n                case 0:\n                  _context34.next = 2;\n                  return this.filehandle.readFile(t);\n                case 2:\n                  e = _context34.sent;\n                  if (!(21578050 !== e.readUInt32LE(0))) {\n                    _context34.next = 5;\n                    break;\n                  }\n                  throw new Error(\"Not a BAI file\");\n                case 5:\n                  n = e.readInt32LE(4);\n                  i = 8;\n                  o = new Array(n);\n                  _t20 = 0;\n                case 9:\n                  if (!(_t20 < n)) {\n                    _context34.next = 39;\n                    break;\n                  }\n                  _n21 = e.readInt32LE(i);\n                  _s14 = void 0;\n                  i += 4;\n                  _a10 = {};\n                  _t21 = 0;\n                case 15:\n                  if (!(_t21 < _n21)) {\n                    _context34.next = 31;\n                    break;\n                  }\n                  _t22 = e.readUInt32LE(i);\n                  if (!(i += 4, 37450 === _t22)) {\n                    _context34.next = 21;\n                    break;\n                  }\n                  i += 4, _s14 = Yt(e, i + 16), i += 32;\n                  _context34.next = 28;\n                  break;\n                case 21:\n                  if (!(_t22 > 37450)) {\n                    _context34.next = 23;\n                    break;\n                  }\n                  throw new Error(\"bai index contains too many bins, please use CSI\");\n                case 23:\n                  _n22 = e.readInt32LE(i);\n                  i += 4;\n                  _o8 = new Array(_n22);\n                  for (_s15 = 0; _s15 < _n22; _s15++) {\n                    _n23 = Ht(e, i);\n                    i += 8;\n                    _a11 = Ht(e, i);\n                    i += 8, r = Kt(r, _n23), _o8[_s15] = new Gt(_n23, _a11, _t22);\n                  }\n                  _a10[_t22] = _o8;\n                case 28:\n                  _t21 += 1;\n                  _context34.next = 15;\n                  break;\n                case 31:\n                  _l4 = e.readInt32LE(i);\n                  i += 4;\n                  _h4 = new Array(_l4);\n                  for (_t23 = 0; _t23 < _l4; _t23++) {\n                    _n24 = Ht(e, i);\n                    i += 8, r = Kt(r, _n24), _h4[_t23] = _n24;\n                  }\n                  o[_t20] = {\n                    binIndex: _a10,\n                    linearIndex: _h4,\n                    stats: _s14\n                  };\n                case 36:\n                  _t20++;\n                  _context34.next = 9;\n                  break;\n                case 39:\n                  return _context34.abrupt(\"return\", {\n                    bai: !0,\n                    firstDataLine: r,\n                    maxBlockSize: 65536,\n                    indices: o,\n                    refCount: n\n                  });\n                case 40:\n                case \"end\":\n                  return _context34.stop();\n              }\n            }, _callee31, this);\n          }));\n          function _parse(_x44) {\n            return _parse2.apply(this, arguments);\n          }\n          return _parse;\n        }()\n      }, {\n        key: \"indexCov\",\n        value: function () {\n          var _indexCov = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee32(t, e, n) {\n            var r,\n              i,\n              o,\n              s,\n              _s$linearIndex,\n              a,\n              l,\n              h,\n              u,\n              f,\n              c,\n              d,\n              g,\n              _t24,\n              _e36,\n              _args35 = arguments;\n            return _regeneratorRuntime().wrap(function _callee32$(_context35) {\n              while (1) switch (_context35.prev = _context35.next) {\n                case 0:\n                  r = _args35.length > 3 && _args35[3] !== undefined ? _args35[3] : {};\n                  i = 16384;\n                  o = void 0 !== e;\n                  _context35.next = 5;\n                  return this.parse(r);\n                case 5:\n                  _context35.t0 = t;\n                  s = _context35.sent.indices[_context35.t0];\n                  if (s) {\n                    _context35.next = 9;\n                    break;\n                  }\n                  return _context35.abrupt(\"return\", []);\n                case 9:\n                  _s$linearIndex = s.linearIndex, a = _s$linearIndex === void 0 ? [] : _s$linearIndex, l = s.stats;\n                  if (!(0 === a.length)) {\n                    _context35.next = 12;\n                    break;\n                  }\n                  return _context35.abrupt(\"return\", []);\n                case 12:\n                  h = void 0 === n ? (a.length - 1) * i : (u = n) - u % i + 16384;\n                  f = void 0 === e ? 0 : function (t, e) {\n                    return t - t % 16384;\n                  }(e), c = new Array(o ? (h - f) / i : a.length - 1), d = a[a.length - 1].blockPosition;\n                  if (!(h > (a.length - 1) * i)) {\n                    _context35.next = 16;\n                    break;\n                  }\n                  throw new Error(\"query outside of range of linear index\");\n                case 16:\n                  g = a[f / i].blockPosition;\n                  for (_t24 = f / i, _e36 = 0; _t24 < h / i; _t24++, _e36++) c[_e36] = {\n                    score: a[_t24 + 1].blockPosition - g,\n                    start: _t24 * i,\n                    end: _t24 * i + i\n                  }, g = a[_t24 + 1].blockPosition;\n                  return _context35.abrupt(\"return\", c.map(function (t) {\n                    return _objectSpread(_objectSpread({}, t), {}, {\n                      score: t.score * ((null == l ? void 0 : l.lineCount) || 0) / d\n                    });\n                  }));\n                case 19:\n                case \"end\":\n                  return _context35.stop();\n              }\n            }, _callee32, this);\n          }));\n          function indexCov(_x45, _x46, _x47) {\n            return _indexCov.apply(this, arguments);\n          }\n          return indexCov;\n        }()\n      }, {\n        key: \"blocksForRange\",\n        value: function () {\n          var _blocksForRange = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee33(t, e, n) {\n            var r,\n              i,\n              o,\n              s,\n              a,\n              l,\n              h,\n              _i13,\n              _s16,\n              _s16$_i,\n              _t25,\n              _e37,\n              _n25,\n              _t26,\n              _iterator11,\n              _step11,\n              _e38,\n              u,\n              f,\n              c,\n              d,\n              _t27,\n              _e39,\n              _args36 = arguments;\n            return _regeneratorRuntime().wrap(function _callee33$(_context36) {\n              while (1) switch (_context36.prev = _context36.next) {\n                case 0:\n                  r = _args36.length > 3 && _args36[3] !== undefined ? _args36[3] : {};\n                  e < 0 && (e = 0);\n                  _context36.next = 4;\n                  return this.parse(r);\n                case 4:\n                  i = _context36.sent;\n                  if (i) {\n                    _context36.next = 7;\n                    break;\n                  }\n                  return _context36.abrupt(\"return\", []);\n                case 7:\n                  o = i.indices[t];\n                  if (o) {\n                    _context36.next = 10;\n                    break;\n                  }\n                  return _context36.abrupt(\"return\", []);\n                case 10:\n                  s = (l = n, [[0, 0], [1 + ((a = e) >> 26), 1 + ((l -= 1) >> 26)], [9 + (a >> 23), 9 + (l >> 23)], [73 + (a >> 20), 73 + (l >> 20)], [585 + (a >> 17), 585 + (l >> 17)], [4681 + (a >> 14), 4681 + (l >> 14)]]);\n                  h = [];\n                  for (_i13 = 0, _s16 = s; _i13 < _s16.length; _i13++) {\n                    _s16$_i = _slicedToArray(_s16[_i13], 2), _t25 = _s16$_i[0], _e37 = _s16$_i[1];\n                    for (_n25 = _t25; _n25 <= _e37; _n25++) if (o.binIndex[_n25]) {\n                      _t26 = o.binIndex[_n25];\n                      _iterator11 = _createForOfIteratorHelper(_t26);\n                      try {\n                        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {\n                          _e38 = _step11.value;\n                          h.push(_e38);\n                        }\n                      } catch (err) {\n                        _iterator11.e(err);\n                      } finally {\n                        _iterator11.f();\n                      }\n                    }\n                  }\n                  u = o.linearIndex.length;\n                  c = Math.min(e >> 14, u - 1), d = Math.min(n >> 14, u - 1);\n                  for (_t27 = c; _t27 <= d; ++_t27) {\n                    _e39 = o.linearIndex[_t27];\n                    _e39 && (!f || _e39.compareTo(f) < 0) && (f = _e39);\n                  }\n                  return _context36.abrupt(\"return\", Vt(h, f));\n                case 17:\n                case \"end\":\n                  return _context36.stop();\n              }\n            }, _callee33, this);\n          }));\n          function blocksForRange(_x48, _x49, _x50) {\n            return _blocksForRange.apply(this, arguments);\n          }\n          return blocksForRange;\n        }()\n      }, {\n        key: \"parse\",\n        value: function () {\n          var _parse3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee34() {\n            var _this12 = this;\n            var t,\n              _args37 = arguments;\n            return _regeneratorRuntime().wrap(function _callee34$(_context37) {\n              while (1) switch (_context37.prev = _context37.next) {\n                case 0:\n                  t = _args37.length > 0 && _args37[0] !== undefined ? _args37[0] : {};\n                  return _context37.abrupt(\"return\", (this.setupP || (this.setupP = this._parse(t)[\"catch\"](function (t) {\n                    throw _this12.setupP = void 0, t;\n                  })), this.setupP));\n                case 2:\n                case \"end\":\n                  return _context37.stop();\n              }\n            }, _callee34, this);\n          }));\n          function parse() {\n            return _parse3.apply(this, arguments);\n          }\n          return parse;\n        }()\n      }, {\n        key: \"hasRefSeq\",\n        value: function () {\n          var _hasRefSeq = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee35(t) {\n            var e,\n              n,\n              _args38 = arguments;\n            return _regeneratorRuntime().wrap(function _callee35$(_context38) {\n              while (1) switch (_context38.prev = _context38.next) {\n                case 0:\n                  e = _args38.length > 1 && _args38[1] !== undefined ? _args38[1] : {};\n                  _context38.next = 3;\n                  return this.parse(e);\n                case 3:\n                  _context38.t1 = t;\n                  _context38.t2 = n = _context38.sent.indices[_context38.t1];\n                  _context38.t0 = null === _context38.t2;\n                  if (_context38.t0) {\n                    _context38.next = 8;\n                    break;\n                  }\n                  _context38.t0 = void 0 === n;\n                case 8:\n                  if (!_context38.t0) {\n                    _context38.next = 12;\n                    break;\n                  }\n                  _context38.t3 = void 0;\n                  _context38.next = 13;\n                  break;\n                case 12:\n                  _context38.t3 = n.binIndex;\n                case 13:\n                  return _context38.abrupt(\"return\", !!_context38.t3);\n                case 14:\n                case \"end\":\n                  return _context38.stop();\n              }\n            }, _callee35, this);\n          }));\n          function hasRefSeq(_x51) {\n            return _hasRefSeq.apply(this, arguments);\n          }\n          return hasRefSeq;\n        }()\n      }]);\n      return te;\n    }(Qt);\n    var ee = n(764);\n    function ne(t) {\n      return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, \"default\") ? t[\"default\"] : t;\n    }\n    var re = new Int32Array([0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918e3, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117]);\n    function ie(t) {\n      if (Buffer.isBuffer(t)) return t;\n      if (\"number\" == typeof t) return Buffer.alloc(t);\n      if (\"string\" == typeof t) return Buffer.from(t);\n      throw new Error(\"input must be buffer, number, or string, received \" + _typeof(t));\n    }\n    function oe(t, e) {\n      t = ie(t), Buffer.isBuffer(e) && (e = e.readUInt32BE(0));\n      var n = -1 ^ ~~e;\n      for (var r = 0; r < t.length; r++) n = re[255 & (n ^ t[r])] ^ n >>> 8;\n      return -1 ^ n;\n    }\n    function se() {\n      return function (t) {\n        var e = ie(4);\n        return e.writeInt32BE(t, 0), e;\n      }(oe.apply(null, arguments));\n    }\n    se.signed = function () {\n      return oe.apply(null, arguments);\n    }, se.unsigned = function () {\n      return oe.apply(null, arguments) >>> 0;\n    };\n    var ae = ne(se);\n    var le = n(290),\n      he = n(949),\n      ue = n(105),\n      fe = n.n(ue),\n      ce = n(269),\n      de = n.n(ce);\n    function ge(t, e) {\n      return Math.floor(t / Math.pow(2, e));\n    }\n    var pe = /*#__PURE__*/function (_Qt2) {\n      _inherits(pe, _Qt2);\n      var _super4 = _createSuper(pe);\n      function pe() {\n        var _this13;\n        _classCallCheck(this, pe);\n        _this13 = _super4.apply(this, arguments), _this13.maxBinNumber = 0, _this13.depth = 0, _this13.minShift = 0;\n        return _this13;\n      }\n      _createClass(pe, [{\n        key: \"lineCount\",\n        value: function () {\n          var _lineCount2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee36(t, e) {\n            var n, r;\n            return _regeneratorRuntime().wrap(function _callee36$(_context39) {\n              while (1) switch (_context39.prev = _context39.next) {\n                case 0:\n                  _context39.next = 2;\n                  return this.parse(e);\n                case 2:\n                  _context39.t3 = t;\n                  _context39.t4 = n = _context39.sent.indices[_context39.t3];\n                  _context39.t2 = null === _context39.t4;\n                  if (_context39.t2) {\n                    _context39.next = 7;\n                    break;\n                  }\n                  _context39.t2 = void 0 === n;\n                case 7:\n                  if (!_context39.t2) {\n                    _context39.next = 11;\n                    break;\n                  }\n                  _context39.t5 = void 0;\n                  _context39.next = 12;\n                  break;\n                case 11:\n                  _context39.t5 = n.stats;\n                case 12:\n                  _context39.t6 = r = _context39.t5;\n                  _context39.t1 = null === _context39.t6;\n                  if (_context39.t1) {\n                    _context39.next = 16;\n                    break;\n                  }\n                  _context39.t1 = void 0 === r;\n                case 16:\n                  if (!_context39.t1) {\n                    _context39.next = 20;\n                    break;\n                  }\n                  _context39.t7 = void 0;\n                  _context39.next = 21;\n                  break;\n                case 20:\n                  _context39.t7 = r.lineCount;\n                case 21:\n                  _context39.t0 = _context39.t7;\n                  if (_context39.t0) {\n                    _context39.next = 24;\n                    break;\n                  }\n                  _context39.t0 = 0;\n                case 24:\n                  return _context39.abrupt(\"return\", _context39.t0);\n                case 25:\n                case \"end\":\n                  return _context39.stop();\n              }\n            }, _callee36, this);\n          }));\n          function lineCount(_x52, _x53) {\n            return _lineCount2.apply(this, arguments);\n          }\n          return lineCount;\n        }()\n      }, {\n        key: \"indexCov\",\n        value: function () {\n          var _indexCov2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee37() {\n            return _regeneratorRuntime().wrap(function _callee37$(_context40) {\n              while (1) switch (_context40.prev = _context40.next) {\n                case 0:\n                  return _context40.abrupt(\"return\", []);\n                case 1:\n                case \"end\":\n                  return _context40.stop();\n              }\n            }, _callee37);\n          }));\n          function indexCov() {\n            return _indexCov2.apply(this, arguments);\n          }\n          return indexCov;\n        }()\n      }, {\n        key: \"parseAuxData\",\n        value: function parseAuxData(t, e) {\n          var n = t.readInt32LE(e),\n            r = 65536 & n ? \"zero-based-half-open\" : \"1-based-closed\",\n            i = {\n              0: \"generic\",\n              1: \"SAM\",\n              2: \"VCF\"\n            }[15 & n];\n          if (!i) throw new Error(\"invalid Tabix preset format flags \".concat(n));\n          var o = {\n              ref: t.readInt32LE(e + 4),\n              start: t.readInt32LE(e + 8),\n              end: t.readInt32LE(e + 12)\n            },\n            s = t.readInt32LE(e + 16),\n            a = s ? String.fromCharCode(s) : \"\",\n            l = t.readInt32LE(e + 20),\n            h = t.readInt32LE(e + 24);\n          return _objectSpread({\n            columnNumbers: o,\n            coordinateType: r,\n            metaValue: s,\n            metaChar: a,\n            skipLines: l,\n            format: i,\n            formatFlags: n\n          }, Jt(t.subarray(e + 28, e + 28 + h), this.renameRefSeq));\n        }\n      }, {\n        key: \"_parse\",\n        value: function () {\n          var _parse4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee38(t) {\n            var e, n, r, i, o, s, a, l, h, _t28, _e40, _r24, _i14, _t29, _t30, _e41, _i15, _r25, _e42, _o9;\n            return _regeneratorRuntime().wrap(function _callee38$(_context41) {\n              while (1) switch (_context41.prev = _context41.next) {\n                case 0:\n                  _context41.next = 2;\n                  return this.filehandle.readFile(t);\n                case 2:\n                  e = _context41.sent;\n                  _context41.next = 5;\n                  return (0, le.Ri)(e);\n                case 5:\n                  n = _context41.sent;\n                  if (!(21582659 === n.readUInt32LE(0))) {\n                    _context41.next = 10;\n                    break;\n                  }\n                  r = 1;\n                  _context41.next = 13;\n                  break;\n                case 10:\n                  if (!(38359875 !== n.readUInt32LE(0))) {\n                    _context41.next = 12;\n                    break;\n                  }\n                  throw new Error(\"Not a CSI file\");\n                case 12:\n                  r = 2;\n                case 13:\n                  this.minShift = n.readInt32LE(4), this.depth = n.readInt32LE(8), this.maxBinNumber = ((1 << 3 * (this.depth + 1)) - 1) / 7;\n                  i = n.readInt32LE(12), o = i >= 30 ? this.parseAuxData(n, 16) : void 0, s = n.readInt32LE(16 + i);\n                  l = 16 + i + 4;\n                  h = new Array(s);\n                  for (_t28 = 0; _t28 < s; _t28++) {\n                    _e40 = n.readInt32LE(l);\n                    l += 4;\n                    _r24 = {};\n                    _i14 = void 0;\n                    for (_t29 = 0; _t29 < _e40; _t29++) {\n                      _t30 = n.readUInt32LE(l);\n                      if (l += 4, _t30 > this.maxBinNumber) _i14 = Yt(n, l + 28), l += 44;else {\n                        a = Kt(a, Ht(n, l)), l += 8;\n                        _e41 = n.readInt32LE(l);\n                        l += 4;\n                        _i15 = new Array(_e41);\n                        for (_r25 = 0; _r25 < _e41; _r25 += 1) {\n                          _e42 = Ht(n, l);\n                          l += 8;\n                          _o9 = Ht(n, l);\n                          l += 8, a = Kt(a, _e42), _i15[_r25] = new Gt(_e42, _o9, _t30);\n                        }\n                        _r24[_t30] = _i15;\n                      }\n                    }\n                    h[_t28] = {\n                      binIndex: _r24,\n                      stats: _i14\n                    };\n                  }\n                  return _context41.abrupt(\"return\", _objectSpread({\n                    csiVersion: r,\n                    firstDataLine: a,\n                    indices: h,\n                    refCount: s,\n                    csi: !0,\n                    maxBlockSize: 65536\n                  }, o));\n                case 19:\n                case \"end\":\n                  return _context41.stop();\n              }\n            }, _callee38, this);\n          }));\n          function _parse(_x54) {\n            return _parse4.apply(this, arguments);\n          }\n          return _parse;\n        }()\n      }, {\n        key: \"blocksForRange\",\n        value: function () {\n          var _blocksForRange2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee39(t, e, n) {\n            var r,\n              i,\n              o,\n              s,\n              a,\n              _iterator12,\n              _step12,\n              _step12$value,\n              _t31,\n              _e43,\n              _n26,\n              _t32,\n              _iterator13,\n              _step13,\n              _e44,\n              _args42 = arguments;\n            return _regeneratorRuntime().wrap(function _callee39$(_context42) {\n              while (1) switch (_context42.prev = _context42.next) {\n                case 0:\n                  r = _args42.length > 3 && _args42[3] !== undefined ? _args42[3] : {};\n                  e < 0 && (e = 0);\n                  _context42.next = 4;\n                  return this.parse(r);\n                case 4:\n                  i = _context42.sent;\n                  o = null == i ? void 0 : i.indices[t];\n                  if (o) {\n                    _context42.next = 8;\n                    break;\n                  }\n                  return _context42.abrupt(\"return\", []);\n                case 8:\n                  s = this.reg2bins(e, n);\n                  if (!(0 === s.length)) {\n                    _context42.next = 11;\n                    break;\n                  }\n                  return _context42.abrupt(\"return\", []);\n                case 11:\n                  a = [];\n                  _iterator12 = _createForOfIteratorHelper(s);\n                  try {\n                    for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {\n                      _step12$value = _slicedToArray(_step12.value, 2), _t31 = _step12$value[0], _e43 = _step12$value[1];\n                      for (_n26 = _t31; _n26 <= _e43; _n26++) if (o.binIndex[_n26]) {\n                        _t32 = o.binIndex[_n26];\n                        _iterator13 = _createForOfIteratorHelper(_t32);\n                        try {\n                          for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {\n                            _e44 = _step13.value;\n                            a.push(_e44);\n                          }\n                        } catch (err) {\n                          _iterator13.e(err);\n                        } finally {\n                          _iterator13.f();\n                        }\n                      }\n                    }\n                  } catch (err) {\n                    _iterator12.e(err);\n                  } finally {\n                    _iterator12.f();\n                  }\n                  return _context42.abrupt(\"return\", Vt(a, new qt(0, 0)));\n                case 15:\n                case \"end\":\n                  return _context42.stop();\n              }\n            }, _callee39, this);\n          }));\n          function blocksForRange(_x55, _x56, _x57) {\n            return _blocksForRange2.apply(this, arguments);\n          }\n          return blocksForRange;\n        }()\n      }, {\n        key: \"reg2bins\",\n        value: function reg2bins(t, e) {\n          (t -= 1) < 1 && (t = 1), e > Math.pow(2, 50) && (e = Math.pow(2, 34)), e -= 1;\n          var n = 0,\n            r = 0,\n            i = this.minShift + 3 * this.depth;\n          var o = [];\n          for (; n <= this.depth; i -= 3, r += 1 * Math.pow(2, 3 * n), n += 1) {\n            var _n27 = r + ge(t, i),\n              _s17 = r + ge(e, i);\n            if (_s17 - _n27 + o.length > this.maxBinNumber) throw new Error(\"query \".concat(t, \"-\").concat(e, \" is too large for current binning scheme (shift \").concat(this.minShift, \", depth \").concat(this.depth, \"), try a smaller query or a coarser index binning scheme\"));\n            o.push([_n27, _s17]);\n          }\n          return o;\n        }\n      }, {\n        key: \"parse\",\n        value: function () {\n          var _parse5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee40() {\n            var _this14 = this;\n            var t,\n              _args43 = arguments;\n            return _regeneratorRuntime().wrap(function _callee40$(_context43) {\n              while (1) switch (_context43.prev = _context43.next) {\n                case 0:\n                  t = _args43.length > 0 && _args43[0] !== undefined ? _args43[0] : {};\n                  return _context43.abrupt(\"return\", (this.setupP || (this.setupP = this._parse(t)[\"catch\"](function (t) {\n                    throw _this14.setupP = void 0, t;\n                  })), this.setupP));\n                case 2:\n                case \"end\":\n                  return _context43.stop();\n              }\n            }, _callee40, this);\n          }));\n          function parse() {\n            return _parse5.apply(this, arguments);\n          }\n          return parse;\n        }()\n      }, {\n        key: \"hasRefSeq\",\n        value: function () {\n          var _hasRefSeq2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee41(t) {\n            var e,\n              n,\n              _args44 = arguments;\n            return _regeneratorRuntime().wrap(function _callee41$(_context44) {\n              while (1) switch (_context44.prev = _context44.next) {\n                case 0:\n                  e = _args44.length > 1 && _args44[1] !== undefined ? _args44[1] : {};\n                  _context44.next = 3;\n                  return this.parse(e);\n                case 3:\n                  _context44.t1 = t;\n                  _context44.t2 = n = _context44.sent.indices[_context44.t1];\n                  _context44.t0 = null === _context44.t2;\n                  if (_context44.t0) {\n                    _context44.next = 8;\n                    break;\n                  }\n                  _context44.t0 = void 0 === n;\n                case 8:\n                  if (!_context44.t0) {\n                    _context44.next = 12;\n                    break;\n                  }\n                  _context44.t3 = void 0;\n                  _context44.next = 13;\n                  break;\n                case 12:\n                  _context44.t3 = n.binIndex;\n                case 13:\n                  return _context44.abrupt(\"return\", !!_context44.t3);\n                case 14:\n                case \"end\":\n                  return _context44.stop();\n              }\n            }, _callee41, this);\n          }));\n          function hasRefSeq(_x58) {\n            return _hasRefSeq2.apply(this, arguments);\n          }\n          return hasRefSeq;\n        }()\n      }]);\n      return pe;\n    }(Qt);\n    var me = \"=ACMGRSVTWYHKDBN\".split(\"\"),\n      ye = \"MIDNSHP=X???????\".split(\"\");\n    var be = /*#__PURE__*/function () {\n      function be(t) {\n        _classCallCheck(this, be);\n        this.data = {}, this._tagList = [], this._allTagsParsed = !1;\n        var e = t.bytes,\n          n = t.fileOffset,\n          r = e.byteArray,\n          i = e.start;\n        this.data = {}, this.bytes = e, this._id = n, this._refID = r.readInt32LE(i + 4), this.data.start = r.readInt32LE(i + 8), this.flags = (4294901760 & r.readInt32LE(i + 16)) >> 16;\n      }\n      _createClass(be, [{\n        key: \"get\",\n        value: function get(t) {\n          return this[t] ? (this.data[t] || (this.data[t] = this[t]()), this.data[t]) : this._get(t.toLowerCase());\n        }\n      }, {\n        key: \"end\",\n        value: function end() {\n          return this.get(\"start\") + this.get(\"length_on_ref\");\n        }\n      }, {\n        key: \"seq_id\",\n        value: function seq_id() {\n          return this._refID;\n        }\n      }, {\n        key: \"_get\",\n        value: function _get(t) {\n          return t in this.data || (this.data[t] = this._parseTag(t)), this.data[t];\n        }\n      }, {\n        key: \"_tags\",\n        value: function _tags() {\n          var _this15 = this;\n          this._parseAllTags();\n          var t = [\"seq\"];\n          this.isSegmentUnmapped() || t.push(\"start\", \"end\", \"strand\", \"score\", \"qual\", \"MQ\", \"CIGAR\", \"length_on_ref\", \"template_length\"), this.isPaired() && t.push(\"next_segment_position\", \"pair_orientation\"), t = t.concat(this._tagList || []);\n          for (var _i16 = 0, _Object$keys = Object.keys(this.data); _i16 < _Object$keys.length; _i16++) {\n            var _e45 = _Object$keys[_i16];\n            _e45.startsWith(\"_\") || \"next_seq_id\" === _e45 || t.push(_e45);\n          }\n          var e = {};\n          return t.filter(function (t) {\n            if (t in _this15.data && void 0 === _this15.data[t] || \"CG\" === t || \"cg\" === t) return !1;\n            var n = t.toLowerCase(),\n              r = e[n];\n            return e[n] = !0, !r;\n          });\n        }\n      }, {\n        key: \"parent\",\n        value: function parent() {}\n      }, {\n        key: \"children\",\n        value: function children() {\n          return this.get(\"subfeatures\");\n        }\n      }, {\n        key: \"id\",\n        value: function id() {\n          return this._id;\n        }\n      }, {\n        key: \"mq\",\n        value: function mq() {\n          var t = (65280 & this.get(\"_bin_mq_nl\")) >> 8;\n          return 255 === t ? void 0 : t;\n        }\n      }, {\n        key: \"score\",\n        value: function score() {\n          return this.get(\"mq\");\n        }\n      }, {\n        key: \"qual\",\n        value: function qual() {\n          var t;\n          return null === (t = this.qualRaw()) || void 0 === t ? void 0 : t.join(\" \");\n        }\n      }, {\n        key: \"qualRaw\",\n        value: function qualRaw() {\n          if (this.isSegmentUnmapped()) return;\n          var _this$bytes = this.bytes,\n            t = _this$bytes.start,\n            e = _this$bytes.byteArray,\n            n = t + 36 + this.get(\"_l_read_name\") + 4 * this.get(\"_n_cigar_op\") + this.get(\"_seq_bytes\"),\n            r = this.get(\"seq_length\");\n          return e.subarray(n, n + r);\n        }\n      }, {\n        key: \"strand\",\n        value: function strand() {\n          return this.isReverseComplemented() ? -1 : 1;\n        }\n      }, {\n        key: \"multi_segment_next_segment_strand\",\n        value: function multi_segment_next_segment_strand() {\n          if (!this.isMateUnmapped()) return this.isMateReverseComplemented() ? -1 : 1;\n        }\n      }, {\n        key: \"name\",\n        value: function name() {\n          return this.get(\"_read_name\");\n        }\n      }, {\n        key: \"_read_name\",\n        value: function _read_name() {\n          var t = this.get(\"_l_read_name\"),\n            _this$bytes2 = this.bytes,\n            e = _this$bytes2.byteArray,\n            n = _this$bytes2.start;\n          return e.toString(\"ascii\", n + 36, n + 36 + t - 1);\n        }\n      }, {\n        key: \"_parseTag\",\n        value: function _parseTag(t) {\n          if (this._allTagsParsed) return;\n          var _this$bytes3 = this.bytes,\n            e = _this$bytes3.byteArray,\n            n = _this$bytes3.start;\n          var r = this._tagOffset || n + 36 + this.get(\"_l_read_name\") + 4 * this.get(\"_n_cigar_op\") + this.get(\"_seq_bytes\") + this.get(\"seq_length\");\n          var i = this.bytes.end;\n          var o;\n          for (; r < i && o !== t;) {\n            var _n28 = String.fromCharCode(e[r], e[r + 1]);\n            o = _n28.toLowerCase();\n            var _s18 = String.fromCharCode(e[r + 2]);\n            var a = void 0;\n            switch (r += 3, _s18) {\n              case \"A\":\n                a = String.fromCharCode(e[r]), r += 1;\n                break;\n              case \"i\":\n                a = e.readInt32LE(r), r += 4;\n                break;\n              case \"I\":\n                a = e.readUInt32LE(r), r += 4;\n                break;\n              case \"c\":\n                a = e.readInt8(r), r += 1;\n                break;\n              case \"C\":\n                a = e.readUInt8(r), r += 1;\n                break;\n              case \"s\":\n                a = e.readInt16LE(r), r += 2;\n                break;\n              case \"S\":\n                a = e.readUInt16LE(r), r += 2;\n                break;\n              case \"f\":\n                a = e.readFloatLE(r), r += 4;\n                break;\n              case \"Z\":\n              case \"H\":\n                for (a = \"\"; r <= i;) {\n                  var _t33 = e[r++];\n                  if (0 === _t33) break;\n                  a += String.fromCharCode(_t33);\n                }\n                break;\n              case \"B\":\n                {\n                  a = \"\";\n                  var _t34 = e[r++],\n                    _i17 = String.fromCharCode(_t34),\n                    _o10 = e.readInt32LE(r);\n                  if (r += 4, \"i\" === _i17) if (\"CG\" === _n28) for (var _t35 = 0; _t35 < _o10; _t35++) {\n                    var _t36 = e.readInt32LE(r);\n                    a += (_t36 >> 4) + ye[15 & _t36], r += 4;\n                  } else for (var _t37 = 0; _t37 < _o10; _t37++) a += e.readInt32LE(r), _t37 + 1 < _o10 && (a += \",\"), r += 4;\n                  if (\"I\" === _i17) if (\"CG\" === _n28) for (var _t38 = 0; _t38 < _o10; _t38++) {\n                    var _t39 = e.readUInt32LE(r);\n                    a += (_t39 >> 4) + ye[15 & _t39], r += 4;\n                  } else for (var _t40 = 0; _t40 < _o10; _t40++) a += e.readUInt32LE(r), _t40 + 1 < _o10 && (a += \",\"), r += 4;\n                  if (\"s\" === _i17) for (var _t41 = 0; _t41 < _o10; _t41++) a += e.readInt16LE(r), _t41 + 1 < _o10 && (a += \",\"), r += 2;\n                  if (\"S\" === _i17) for (var _t42 = 0; _t42 < _o10; _t42++) a += e.readUInt16LE(r), _t42 + 1 < _o10 && (a += \",\"), r += 2;\n                  if (\"c\" === _i17) for (var _t43 = 0; _t43 < _o10; _t43++) a += e.readInt8(r), _t43 + 1 < _o10 && (a += \",\"), r += 1;\n                  if (\"C\" === _i17) for (var _t44 = 0; _t44 < _o10; _t44++) a += e.readUInt8(r), _t44 + 1 < _o10 && (a += \",\"), r += 1;\n                  if (\"f\" === _i17) for (var _t45 = 0; _t45 < _o10; _t45++) a += e.readFloatLE(r), _t45 + 1 < _o10 && (a += \",\"), r += 4;\n                  break;\n                }\n              default:\n                console.warn(\"Unknown BAM tag type '\".concat(_s18, \"', tags may be incomplete\")), a = void 0, r = i;\n            }\n            if (this._tagOffset = r, this._tagList.push(_n28), o === t) return a;\n            this.data[o] = a;\n          }\n          this._allTagsParsed = !0;\n        }\n      }, {\n        key: \"_parseAllTags\",\n        value: function _parseAllTags() {\n          this._parseTag(\"\");\n        }\n      }, {\n        key: \"_parseCigar\",\n        value: function _parseCigar(t) {\n          return t.match(/\\d+\\D/g).map(function (t) {\n            return [t.match(/\\D/)[0].toUpperCase(), Number.parseInt(t, 10)];\n          });\n        }\n      }, {\n        key: \"isPaired\",\n        value: function isPaired() {\n          return !!(1 & this.flags);\n        }\n      }, {\n        key: \"isProperlyPaired\",\n        value: function isProperlyPaired() {\n          return !!(2 & this.flags);\n        }\n      }, {\n        key: \"isSegmentUnmapped\",\n        value: function isSegmentUnmapped() {\n          return !!(4 & this.flags);\n        }\n      }, {\n        key: \"isMateUnmapped\",\n        value: function isMateUnmapped() {\n          return !!(8 & this.flags);\n        }\n      }, {\n        key: \"isReverseComplemented\",\n        value: function isReverseComplemented() {\n          return !!(16 & this.flags);\n        }\n      }, {\n        key: \"isMateReverseComplemented\",\n        value: function isMateReverseComplemented() {\n          return !!(32 & this.flags);\n        }\n      }, {\n        key: \"isRead1\",\n        value: function isRead1() {\n          return !!(64 & this.flags);\n        }\n      }, {\n        key: \"isRead2\",\n        value: function isRead2() {\n          return !!(128 & this.flags);\n        }\n      }, {\n        key: \"isSecondary\",\n        value: function isSecondary() {\n          return !!(256 & this.flags);\n        }\n      }, {\n        key: \"isFailedQc\",\n        value: function isFailedQc() {\n          return !!(512 & this.flags);\n        }\n      }, {\n        key: \"isDuplicate\",\n        value: function isDuplicate() {\n          return !!(1024 & this.flags);\n        }\n      }, {\n        key: \"isSupplementary\",\n        value: function isSupplementary() {\n          return !!(2048 & this.flags);\n        }\n      }, {\n        key: \"cigar\",\n        value: function cigar() {\n          if (this.isSegmentUnmapped()) return;\n          var _this$bytes4 = this.bytes,\n            t = _this$bytes4.byteArray,\n            e = _this$bytes4.start,\n            n = this.get(\"_n_cigar_op\");\n          var r = e + 36 + this.get(\"_l_read_name\");\n          var i = this.get(\"seq_length\");\n          var o = \"\",\n            s = 0,\n            a = t.readInt32LE(r),\n            l = a >> 4,\n            h = ye[15 & a];\n          if (\"S\" === h && l === i) return r += 4, a = t.readInt32LE(r), l = a >> 4, h = ye[15 & a], \"N\" !== h && console.warn(\"CG tag with no N tag\"), this.data.length_on_ref = l, this.get(\"CG\");\n          for (var _e46 = 0; _e46 < n; ++_e46) a = t.readInt32LE(r), l = a >> 4, h = ye[15 & a], o += l + h, \"H\" !== h && \"S\" !== h && \"I\" !== h && (s += l), r += 4;\n          return this.data.length_on_ref = s, o;\n        }\n      }, {\n        key: \"length_on_ref\",\n        value: function length_on_ref() {\n          return this.data.length_on_ref || this.get(\"cigar\"), this.data.length_on_ref;\n        }\n      }, {\n        key: \"_n_cigar_op\",\n        value: function _n_cigar_op() {\n          return 65535 & this.get(\"_flag_nc\");\n        }\n      }, {\n        key: \"_l_read_name\",\n        value: function _l_read_name() {\n          return 255 & this.get(\"_bin_mq_nl\");\n        }\n      }, {\n        key: \"_seq_bytes\",\n        value: function _seq_bytes() {\n          return this.get(\"seq_length\") + 1 >> 1;\n        }\n      }, {\n        key: \"getReadBases\",\n        value: function getReadBases() {\n          return this.seq();\n        }\n      }, {\n        key: \"seq\",\n        value: function seq() {\n          var _this$bytes5 = this.bytes,\n            t = _this$bytes5.byteArray,\n            e = _this$bytes5.start,\n            n = e + 36 + this.get(\"_l_read_name\") + 4 * this.get(\"_n_cigar_op\"),\n            r = this.get(\"_seq_bytes\"),\n            i = this.get(\"seq_length\");\n          var o = \"\",\n            s = 0;\n          for (var _e47 = 0; _e47 < r; ++_e47) {\n            var _r26 = t[n + _e47];\n            o += me[(240 & _r26) >> 4], s++, s < i && (o += me[15 & _r26], s++);\n          }\n          return o;\n        }\n      }, {\n        key: \"getPairOrientation\",\n        value: function getPairOrientation() {\n          if (!this.isSegmentUnmapped() && !this.isMateUnmapped() && this._refID === this._next_refid()) {\n            var _t46 = this.isReverseComplemented() ? \"R\" : \"F\",\n              _e48 = this.isMateReverseComplemented() ? \"R\" : \"F\";\n            var n = \" \",\n              r = \" \";\n            this.isRead1() ? (n = \"1\", r = \"2\") : this.isRead2() && (n = \"2\", r = \"1\");\n            var _i18 = [];\n            return this.template_length() > 0 ? (_i18[0] = _t46, _i18[1] = n, _i18[2] = _e48, _i18[3] = r) : (_i18[2] = _t46, _i18[3] = n, _i18[0] = _e48, _i18[1] = r), _i18.join(\"\");\n          }\n          return \"\";\n        }\n      }, {\n        key: \"_bin_mq_nl\",\n        value: function _bin_mq_nl() {\n          return this.bytes.byteArray.readInt32LE(this.bytes.start + 12);\n        }\n      }, {\n        key: \"_flag_nc\",\n        value: function _flag_nc() {\n          return this.bytes.byteArray.readInt32LE(this.bytes.start + 16);\n        }\n      }, {\n        key: \"seq_length\",\n        value: function seq_length() {\n          return this.bytes.byteArray.readInt32LE(this.bytes.start + 20);\n        }\n      }, {\n        key: \"_next_refid\",\n        value: function _next_refid() {\n          return this.bytes.byteArray.readInt32LE(this.bytes.start + 24);\n        }\n      }, {\n        key: \"_next_pos\",\n        value: function _next_pos() {\n          return this.bytes.byteArray.readInt32LE(this.bytes.start + 28);\n        }\n      }, {\n        key: \"template_length\",\n        value: function template_length() {\n          return this.bytes.byteArray.readInt32LE(this.bytes.start + 32);\n        }\n      }, {\n        key: \"toJSON\",\n        value: function toJSON() {\n          var t = {};\n          for (var _i19 = 0, _Object$keys2 = Object.keys(this); _i19 < _Object$keys2.length; _i19++) {\n            var _e49 = _Object$keys2[_i19];\n            _e49.startsWith(\"_\") || \"bytes\" === _e49 || (t[_e49] = this[_e49]);\n          }\n          return t;\n        }\n      }]);\n      return be;\n    }();\n    var we = /*#__PURE__*/function () {\n      function we() {\n        _classCallCheck(this, we);\n      }\n      _createClass(we, [{\n        key: \"read\",\n        value: function read() {\n          throw new Error(\"never called\");\n        }\n      }, {\n        key: \"stat\",\n        value: function stat() {\n          throw new Error(\"never called\");\n        }\n      }, {\n        key: \"readFile\",\n        value: function readFile() {\n          throw new Error(\"never called\");\n        }\n      }, {\n        key: \"close\",\n        value: function close() {\n          throw new Error(\"never called\");\n        }\n      }]);\n      return we;\n    }();\n    var ve = /*#__PURE__*/function () {\n      function ve(_ref15) {\n        var _this16 = this;\n        var t = _ref15.bamFilehandle,\n          e = _ref15.bamPath,\n          n = _ref15.bamUrl,\n          r = _ref15.baiPath,\n          i = _ref15.baiFilehandle,\n          o = _ref15.baiUrl,\n          s = _ref15.csiPath,\n          a = _ref15.csiFilehandle,\n          l = _ref15.csiUrl,\n          h = _ref15.htsget,\n          _ref15$yieldThreadTim = _ref15.yieldThreadTime,\n          u = _ref15$yieldThreadTim === void 0 ? 100 : _ref15$yieldThreadTim,\n          _ref15$renameRefSeqs = _ref15.renameRefSeqs,\n          f = _ref15$renameRefSeqs === void 0 ? function (t) {\n            return t;\n          } : _ref15$renameRefSeqs;\n        _classCallCheck(this, ve);\n        if (this.htsget = !1, this.featureCache = new (fe())({\n          cache: new (de())({\n            maxSize: 50\n          }),\n          fill: function () {\n            var _fill = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee42(t, e) {\n              var n, r, _yield$_this16$_readC, i, o, s;\n              return _regeneratorRuntime().wrap(function _callee42$(_context45) {\n                while (1) switch (_context45.prev = _context45.next) {\n                  case 0:\n                    n = t.chunk;\n                    r = t.opts;\n                    _context45.next = 4;\n                    return _this16._readChunk({\n                      chunk: n,\n                      opts: _objectSpread(_objectSpread({}, r), {}, {\n                        signal: e\n                      })\n                    });\n                  case 4:\n                    _yield$_this16$_readC = _context45.sent;\n                    i = _yield$_this16$_readC.data;\n                    o = _yield$_this16$_readC.cpositions;\n                    s = _yield$_this16$_readC.dpositions;\n                    return _context45.abrupt(\"return\", _this16.readBamFeatures(i, o, s, n));\n                  case 9:\n                  case \"end\":\n                    return _context45.stop();\n                }\n              }, _callee42);\n            }));\n            function fill(_x59, _x60) {\n              return _fill.apply(this, arguments);\n            }\n            return fill;\n          }()\n        }), this.renameRefSeq = f, t) this.bam = t;else if (e) this.bam = new he.S9(e);else if (n) this.bam = new he.kC(n);else {\n          if (!h) throw new Error(\"unable to initialize bam\");\n          this.htsget = !0, this.bam = new we();\n        }\n        if (a) this.index = new pe({\n          filehandle: a\n        });else if (s) this.index = new pe({\n          filehandle: new he.S9(s)\n        });else if (l) this.index = new pe({\n          filehandle: new he.kC(l)\n        });else if (i) this.index = new te({\n          filehandle: i\n        });else if (r) this.index = new te({\n          filehandle: new he.S9(r)\n        });else if (o) this.index = new te({\n          filehandle: new he.kC(o)\n        });else if (e) this.index = new te({\n          filehandle: new he.S9(\"\".concat(e, \".bai\"))\n        });else if (n) this.index = new te({\n          filehandle: new he.kC(\"\".concat(n, \".bai\"))\n        });else {\n          if (!h) throw new Error(\"unable to infer index format\");\n          this.htsget = !0;\n        }\n        this.yieldThreadTime = u;\n      }\n      _createClass(ve, [{\n        key: \"getHeaderPre\",\n        value: function () {\n          var _getHeaderPre = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee43(t) {\n            var e, n, r, i, _t47, _n29, o, s, _yield$this$_readRefS, a, l;\n            return _regeneratorRuntime().wrap(function _callee43$(_context46) {\n              while (1) switch (_context46.prev = _context46.next) {\n                case 0:\n                  e = function () {\n                    var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};\n                    return \"aborted\" in t ? {\n                      signal: t\n                    } : t;\n                  }(t);\n                  if (this.index) {\n                    _context46.next = 3;\n                    break;\n                  }\n                  return _context46.abrupt(\"return\");\n                case 3:\n                  _context46.next = 5;\n                  return this.index.parse(e);\n                case 5:\n                  n = _context46.sent;\n                  r = n.firstDataLine ? n.firstDataLine.blockPosition + 65535 : void 0;\n                  if (!r) {\n                    _context46.next = 17;\n                    break;\n                  }\n                  _t47 = r + 65536;\n                  _context46.next = 11;\n                  return this.bam.read(ee.lW.alloc(_t47), 0, _t47, 0, e);\n                case 11:\n                  _n29 = _context46.sent;\n                  if (_n29.bytesRead) {\n                    _context46.next = 14;\n                    break;\n                  }\n                  throw new Error(\"Error reading header\");\n                case 14:\n                  i = _n29.buffer.subarray(0, Math.min(_n29.bytesRead, r));\n                  _context46.next = 20;\n                  break;\n                case 17:\n                  _context46.next = 19;\n                  return this.bam.readFile(e);\n                case 19:\n                  i = _context46.sent;\n                case 20:\n                  _context46.next = 22;\n                  return (0, le.Ri)(i);\n                case 22:\n                  o = _context46.sent;\n                  if (!(21840194 !== o.readInt32LE(0))) {\n                    _context46.next = 25;\n                    break;\n                  }\n                  throw new Error(\"Not a BAM file\");\n                case 25:\n                  s = o.readInt32LE(4);\n                  this.header = o.toString(\"utf8\", 8, 8 + s);\n                  _context46.next = 29;\n                  return this._readRefSeqs(s + 8, 65535, e);\n                case 29:\n                  _yield$this$_readRefS = _context46.sent;\n                  a = _yield$this$_readRefS.chrToIndex;\n                  l = _yield$this$_readRefS.indexToChr;\n                  return _context46.abrupt(\"return\", (this.chrToIndex = a, this.indexToChr = l, function (t) {\n                    var e = t.split(/\\r?\\n/),\n                      n = [];\n                    var _iterator14 = _createForOfIteratorHelper(e),\n                      _step14;\n                    try {\n                      for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {\n                        var _t48 = _step14.value;\n                        var _t48$split = _t48.split(/\\t/),\n                          _t48$split2 = _toArray(_t48$split),\n                          _e50 = _t48$split2[0],\n                          _r27 = _t48$split2.slice(1);\n                        _e50 && n.push({\n                          tag: _e50.slice(1),\n                          data: _r27.map(function (t) {\n                            var e = t.indexOf(\":\");\n                            return {\n                              tag: t.slice(0, e),\n                              value: t.slice(e + 1)\n                            };\n                          })\n                        });\n                      }\n                    } catch (err) {\n                      _iterator14.e(err);\n                    } finally {\n                      _iterator14.f();\n                    }\n                    return n;\n                  }(this.header)));\n                case 33:\n                case \"end\":\n                  return _context46.stop();\n              }\n            }, _callee43, this);\n          }));\n          function getHeaderPre(_x61) {\n            return _getHeaderPre.apply(this, arguments);\n          }\n          return getHeaderPre;\n        }()\n      }, {\n        key: \"getHeader\",\n        value: function getHeader(t) {\n          var _this17 = this;\n          return this.headerP || (this.headerP = this.getHeaderPre(t)[\"catch\"](function (t) {\n            throw _this17.headerP = void 0, t;\n          })), this.headerP;\n        }\n      }, {\n        key: \"getHeaderText\",\n        value: function () {\n          var _getHeaderText = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee44() {\n            var t,\n              _args47 = arguments;\n            return _regeneratorRuntime().wrap(function _callee44$(_context47) {\n              while (1) switch (_context47.prev = _context47.next) {\n                case 0:\n                  t = _args47.length > 0 && _args47[0] !== undefined ? _args47[0] : {};\n                  _context47.next = 3;\n                  return this.getHeader(t);\n                case 3:\n                  return _context47.abrupt(\"return\", this.header);\n                case 4:\n                case \"end\":\n                  return _context47.stop();\n              }\n            }, _callee44, this);\n          }));\n          function getHeaderText() {\n            return _getHeaderText.apply(this, arguments);\n          }\n          return getHeaderText;\n        }()\n      }, {\n        key: \"_readRefSeqs\",\n        value: function () {\n          var _readRefSeqs2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee45(t, e, n) {\n            var r, _yield$this$bam$read, i, o, s, a, l, h, u, _r28, _i20, _o11, _a12;\n            return _regeneratorRuntime().wrap(function _callee45$(_context48) {\n              while (1) switch (_context48.prev = _context48.next) {\n                case 0:\n                  if (!(t > e)) {\n                    _context48.next = 2;\n                    break;\n                  }\n                  return _context48.abrupt(\"return\", this._readRefSeqs(t, 2 * e, n));\n                case 2:\n                  r = e + 65536;\n                  _context48.next = 5;\n                  return this.bam.read(ee.lW.alloc(r), 0, e, 0, n);\n                case 5:\n                  _yield$this$bam$read = _context48.sent;\n                  i = _yield$this$bam$read.bytesRead;\n                  o = _yield$this$bam$read.buffer;\n                  if (i) {\n                    _context48.next = 10;\n                    break;\n                  }\n                  throw new Error(\"Error reading refseqs from header\");\n                case 10:\n                  _context48.next = 12;\n                  return (0, le.Ri)(o.subarray(0, Math.min(i, e)));\n                case 12:\n                  s = _context48.sent;\n                  a = s.readInt32LE(t);\n                  l = t + 4;\n                  h = {}, u = [];\n                  _r28 = 0;\n                case 17:\n                  if (!(_r28 < a)) {\n                    _context48.next = 24;\n                    break;\n                  }\n                  _i20 = s.readInt32LE(l), _o11 = this.renameRefSeq(s.toString(\"utf8\", l + 4, l + 4 + _i20 - 1)), _a12 = s.readInt32LE(l + _i20 + 4);\n                  if (!(h[_o11] = _r28, u.push({\n                    refName: _o11,\n                    length: _a12\n                  }), l = l + 8 + _i20, l > s.length)) {\n                    _context48.next = 21;\n                    break;\n                  }\n                  return _context48.abrupt(\"return\", (console.warn(\"BAM header is very big.  Re-fetching \".concat(e, \" bytes.\")), this._readRefSeqs(t, 2 * e, n)));\n                case 21:\n                  _r28 += 1;\n                  _context48.next = 17;\n                  break;\n                case 24:\n                  return _context48.abrupt(\"return\", {\n                    chrToIndex: h,\n                    indexToChr: u\n                  });\n                case 25:\n                case \"end\":\n                  return _context48.stop();\n              }\n            }, _callee45, this);\n          }));\n          function _readRefSeqs(_x62, _x63, _x64) {\n            return _readRefSeqs2.apply(this, arguments);\n          }\n          return _readRefSeqs;\n        }()\n      }, {\n        key: \"getRecordsForRange\",\n        value: function () {\n          var _getRecordsForRange = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee47(t, e, n, r) {\n            return _regeneratorRuntime().wrap(function _callee47$(_context50) {\n              while (1) switch (_context50.prev = _context50.next) {\n                case 0:\n                  return _context50.abrupt(\"return\", function () {\n                    var _ref16 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee46(t) {\n                      var e, _iteratorAbruptCompletion, _didIteratorError, _iteratorError, _iterator, _step, _n30;\n                      return _regeneratorRuntime().wrap(function _callee46$(_context49) {\n                        while (1) switch (_context49.prev = _context49.next) {\n                          case 0:\n                            e = [];\n                            _iteratorAbruptCompletion = false;\n                            _didIteratorError = false;\n                            _context49.prev = 3;\n                            _iterator = _asyncIterator(t);\n                          case 5:\n                            _context49.next = 7;\n                            return _iterator.next();\n                          case 7:\n                            if (!(_iteratorAbruptCompletion = !(_step = _context49.sent).done)) {\n                              _context49.next = 13;\n                              break;\n                            }\n                            _n30 = _step.value;\n                            e = e.concat(_n30);\n                          case 10:\n                            _iteratorAbruptCompletion = false;\n                            _context49.next = 5;\n                            break;\n                          case 13:\n                            _context49.next = 19;\n                            break;\n                          case 15:\n                            _context49.prev = 15;\n                            _context49.t0 = _context49[\"catch\"](3);\n                            _didIteratorError = true;\n                            _iteratorError = _context49.t0;\n                          case 19:\n                            _context49.prev = 19;\n                            _context49.prev = 20;\n                            if (!(_iteratorAbruptCompletion && _iterator[\"return\"] != null)) {\n                              _context49.next = 24;\n                              break;\n                            }\n                            _context49.next = 24;\n                            return _iterator[\"return\"]();\n                          case 24:\n                            _context49.prev = 24;\n                            if (!_didIteratorError) {\n                              _context49.next = 27;\n                              break;\n                            }\n                            throw _iteratorError;\n                          case 27:\n                            return _context49.finish(24);\n                          case 28:\n                            return _context49.finish(19);\n                          case 29:\n                            return _context49.abrupt(\"return\", e);\n                          case 30:\n                          case \"end\":\n                            return _context49.stop();\n                        }\n                      }, _callee46, null, [[3, 15, 19, 29], [20,, 24, 28]]);\n                    }));\n                    return function (_x69) {\n                      return _ref16.apply(this, arguments);\n                    };\n                  }()(this.streamRecordsForRange(t, e, n, r)));\n                case 1:\n                case \"end\":\n                  return _context50.stop();\n              }\n            }, _callee47, this);\n          }));\n          function getRecordsForRange(_x65, _x66, _x67, _x68) {\n            return _getRecordsForRange.apply(this, arguments);\n          }\n          return getRecordsForRange;\n        }()\n      }, {\n        key: \"streamRecordsForRange\",\n        value: function streamRecordsForRange(t, e, n, r) {\n          var _this = this;\n          return _wrapAsyncGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee48() {\n            var i, o, _t49;\n            return _regeneratorRuntime().wrap(function _callee48$(_context51) {\n              while (1) switch (_context51.prev = _context51.next) {\n                case 0:\n                  _context51.next = 2;\n                  return _awaitAsyncGenerator(_this.getHeader(r));\n                case 2:\n                  o = null === (i = _this.chrToIndex) || void 0 === i ? void 0 : i[t];\n                  if (!(void 0 !== o && _this.index)) {\n                    _context51.next = 10;\n                    break;\n                  }\n                  _context51.next = 6;\n                  return _awaitAsyncGenerator(_this.index.blocksForRange(o, e - 1, n, r));\n                case 6:\n                  _t49 = _context51.sent;\n                  return _context51.delegateYield(_asyncGeneratorDelegate(_asyncIterator(_this._fetchChunkFeatures(_t49, o, e, n, r)), _awaitAsyncGenerator), \"t0\", 8);\n                case 8:\n                  _context51.next = 12;\n                  break;\n                case 10:\n                  _context51.next = 12;\n                  return [];\n                case 12:\n                case \"end\":\n                  return _context51.stop();\n              }\n            }, _callee48);\n          }))();\n        }\n      }, {\n        key: \"_fetchChunkFeatures\",\n        value: function _fetchChunkFeatures(t, e, n, r) {\n          var _this2 = this;\n          var i = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};\n          return _wrapAsyncGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee49() {\n            var o, s, a, _iterator15, _step15, _o12, _t51, l, _iterator16, _step16, _i21;\n            return _regeneratorRuntime().wrap(function _callee49$(_context52) {\n              while (1) switch (_context52.prev = _context52.next) {\n                case 0:\n                  o = i.viewAsPairs, s = [];\n                  a = !1;\n                  _iterator15 = _createForOfIteratorHelper(t);\n                  _context52.prev = 3;\n                  _iterator15.s();\n                case 5:\n                  if ((_step15 = _iterator15.n()).done) {\n                    _context52.next = 38;\n                    break;\n                  }\n                  _o12 = _step15.value;\n                  _context52.next = 9;\n                  return _awaitAsyncGenerator(_this2.featureCache.get(_o12.toString(), {\n                    chunk: _o12,\n                    opts: i\n                  }, i.signal));\n                case 9:\n                  _t51 = _context52.sent;\n                  l = [];\n                  _iterator16 = _createForOfIteratorHelper(_t51);\n                  _context52.prev = 12;\n                  _iterator16.s();\n                case 14:\n                  if ((_step16 = _iterator16.n()).done) {\n                    _context52.next = 23;\n                    break;\n                  }\n                  _i21 = _step16.value;\n                  if (!(_i21.seq_id() === e)) {\n                    _context52.next = 21;\n                    break;\n                  }\n                  if (!(_i21.get(\"start\") >= r)) {\n                    _context52.next = 20;\n                    break;\n                  }\n                  a = !0;\n                  return _context52.abrupt(\"break\", 23);\n                case 20:\n                  _i21.get(\"end\") >= n && l.push(_i21);\n                case 21:\n                  _context52.next = 14;\n                  break;\n                case 23:\n                  _context52.next = 28;\n                  break;\n                case 25:\n                  _context52.prev = 25;\n                  _context52.t0 = _context52[\"catch\"](12);\n                  _iterator16.e(_context52.t0);\n                case 28:\n                  _context52.prev = 28;\n                  _iterator16.f();\n                  return _context52.finish(28);\n                case 31:\n                  s.push(l);\n                  _context52.next = 34;\n                  return l;\n                case 34:\n                  if (!a) {\n                    _context52.next = 36;\n                    break;\n                  }\n                  return _context52.abrupt(\"break\", 38);\n                case 36:\n                  _context52.next = 5;\n                  break;\n                case 38:\n                  _context52.next = 43;\n                  break;\n                case 40:\n                  _context52.prev = 40;\n                  _context52.t1 = _context52[\"catch\"](3);\n                  _iterator15.e(_context52.t1);\n                case 43:\n                  _context52.prev = 43;\n                  _iterator15.f();\n                  return _context52.finish(43);\n                case 46:\n                  (function (t) {\n                    if (t && t.aborted) {\n                      if (\"undefined\" == typeof DOMException) {\n                        var _t50 = new Error(\"aborted\");\n                        throw _t50.code = \"ERR_ABORTED\", _t50;\n                      }\n                      throw new DOMException(\"aborted\", \"AbortError\");\n                    }\n                  })(i.signal);\n                  _context52.t2 = o;\n                  if (!_context52.t2) {\n                    _context52.next = 51;\n                    break;\n                  }\n                  _context52.next = 51;\n                  return _this2.fetchPairs(e, s, i);\n                case 51:\n                case \"end\":\n                  return _context52.stop();\n              }\n            }, _callee49, null, [[3, 40, 43, 46], [12, 25, 28, 31]]);\n          }))();\n        }\n      }, {\n        key: \"fetchPairs\",\n        value: function () {\n          var _fetchPairs = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee51(t, e, n) {\n            var _this18 = this;\n            var r, _n$maxInsertSize, i, o, s, a, l, h, _iterator19, _step19, _t55;\n            return _regeneratorRuntime().wrap(function _callee51$(_context54) {\n              while (1) switch (_context54.prev = _context54.next) {\n                case 0:\n                  r = n.pairAcrossChr, _n$maxInsertSize = n.maxInsertSize, i = _n$maxInsertSize === void 0 ? 2e5 : _n$maxInsertSize, o = {}, s = {};\n                  e.map(function (t) {\n                    var e = {};\n                    var _iterator17 = _createForOfIteratorHelper(t),\n                      _step17;\n                    try {\n                      for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {\n                        var _n32 = _step17.value;\n                        var _t53 = _n32.name(),\n                          _r29 = _n32.id();\n                        e[_t53] || (e[_t53] = 0), e[_t53]++, s[_r29] = 1;\n                      }\n                    } catch (err) {\n                      _iterator17.e(err);\n                    } finally {\n                      _iterator17.f();\n                    }\n                    for (var _i22 = 0, _Object$entries = Object.entries(e); _i22 < _Object$entries.length; _i22++) {\n                      var _Object$entries$_i = _slicedToArray(_Object$entries[_i22], 2),\n                        _t52 = _Object$entries$_i[0],\n                        _n31 = _Object$entries$_i[1];\n                      1 === _n31 && (o[_t52] = !0);\n                    }\n                  });\n                  a = [];\n                  e.map(function (e) {\n                    var _iterator18 = _createForOfIteratorHelper(e),\n                      _step18;\n                    try {\n                      for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {\n                        var _s19 = _step18.value;\n                        var _e51 = _s19.name(),\n                          _l5 = _s19.get(\"start\"),\n                          _h5 = _s19._next_pos(),\n                          u = _s19._next_refid();\n                        _this18.index && o[_e51] && (r || u === t && Math.abs(_l5 - _h5) < i) && a.push(_this18.index.blocksForRange(u, _h5, _h5 + 1, n));\n                      }\n                    } catch (err) {\n                      _iterator18.e(err);\n                    } finally {\n                      _iterator18.f();\n                    }\n                  });\n                  l = new Map();\n                  _context54.next = 7;\n                  return Promise.all(a);\n                case 7:\n                  h = _context54.sent;\n                  _iterator19 = _createForOfIteratorHelper(h.flat());\n                  try {\n                    for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {\n                      _t55 = _step19.value;\n                      l.has(_t55.toString()) || l.set(_t55.toString(), _t55);\n                    }\n                  } catch (err) {\n                    _iterator19.e(err);\n                  } finally {\n                    _iterator19.f();\n                  }\n                  _context54.next = 12;\n                  return Promise.all(_toConsumableArray(l.values()).map( /*#__PURE__*/function () {\n                    var _ref17 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee50(t) {\n                      var _yield$_this18$_readC, e, r, i, a, l, _iterator20, _step20, _t54;\n                      return _regeneratorRuntime().wrap(function _callee50$(_context53) {\n                        while (1) switch (_context53.prev = _context53.next) {\n                          case 0:\n                            _context53.next = 2;\n                            return _this18._readChunk({\n                              chunk: t,\n                              opts: n\n                            });\n                          case 2:\n                            _yield$_this18$_readC = _context53.sent;\n                            e = _yield$_this18$_readC.data;\n                            r = _yield$_this18$_readC.cpositions;\n                            i = _yield$_this18$_readC.dpositions;\n                            a = _yield$_this18$_readC.chunk;\n                            l = [];\n                            _context53.t0 = _createForOfIteratorHelper;\n                            _context53.next = 11;\n                            return _this18.readBamFeatures(e, r, i, a);\n                          case 11:\n                            _context53.t1 = _context53.sent;\n                            _iterator20 = (0, _context53.t0)(_context53.t1);\n                            try {\n                              for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {\n                                _t54 = _step20.value;\n                                o[_t54.get(\"name\")] && !s[_t54.id()] && l.push(_t54);\n                              }\n                            } catch (err) {\n                              _iterator20.e(err);\n                            } finally {\n                              _iterator20.f();\n                            }\n                            return _context53.abrupt(\"return\", l);\n                          case 15:\n                          case \"end\":\n                            return _context53.stop();\n                        }\n                      }, _callee50);\n                    }));\n                    return function (_x73) {\n                      return _ref17.apply(this, arguments);\n                    };\n                  }()));\n                case 12:\n                  return _context54.abrupt(\"return\", _context54.sent.flat());\n                case 13:\n                case \"end\":\n                  return _context54.stop();\n              }\n            }, _callee51);\n          }));\n          function fetchPairs(_x70, _x71, _x72) {\n            return _fetchPairs.apply(this, arguments);\n          }\n          return fetchPairs;\n        }()\n      }, {\n        key: \"_readRegion\",\n        value: function () {\n          var _readRegion2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee52(t, e) {\n            var n,\n              _yield$this$bam$read2,\n              r,\n              i,\n              _args55 = arguments;\n            return _regeneratorRuntime().wrap(function _callee52$(_context55) {\n              while (1) switch (_context55.prev = _context55.next) {\n                case 0:\n                  n = _args55.length > 2 && _args55[2] !== undefined ? _args55[2] : {};\n                  _context55.next = 3;\n                  return this.bam.read(ee.lW.alloc(e), 0, e, t, n);\n                case 3:\n                  _yield$this$bam$read2 = _context55.sent;\n                  r = _yield$this$bam$read2.bytesRead;\n                  i = _yield$this$bam$read2.buffer;\n                  return _context55.abrupt(\"return\", i.subarray(0, Math.min(r, e)));\n                case 7:\n                case \"end\":\n                  return _context55.stop();\n              }\n            }, _callee52, this);\n          }));\n          function _readRegion(_x74, _x75) {\n            return _readRegion2.apply(this, arguments);\n          }\n          return _readRegion;\n        }()\n      }, {\n        key: \"_readChunk\",\n        value: function () {\n          var _readChunk2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee53(_ref18) {\n            var t, e, n, _yield, r, i, o;\n            return _regeneratorRuntime().wrap(function _callee53$(_context56) {\n              while (1) switch (_context56.prev = _context56.next) {\n                case 0:\n                  t = _ref18.chunk, e = _ref18.opts;\n                  _context56.next = 3;\n                  return this._readRegion(t.minv.blockPosition, t.fetchedSize(), e);\n                case 3:\n                  n = _context56.sent;\n                  _context56.next = 6;\n                  return (0, le.y$)(n, t);\n                case 6:\n                  _yield = _context56.sent;\n                  r = _yield.buffer;\n                  i = _yield.cpositions;\n                  o = _yield.dpositions;\n                  return _context56.abrupt(\"return\", {\n                    data: r,\n                    cpositions: i,\n                    dpositions: o,\n                    chunk: t\n                  });\n                case 11:\n                case \"end\":\n                  return _context56.stop();\n              }\n            }, _callee53, this);\n          }));\n          function _readChunk(_x76) {\n            return _readChunk2.apply(this, arguments);\n          }\n          return _readChunk;\n        }()\n      }, {\n        key: \"readBamFeatures\",\n        value: function () {\n          var _readBamFeatures = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee54(t, e, n, r) {\n            var i, o, s, a, l, _h6;\n            return _regeneratorRuntime().wrap(function _callee54$(_context57) {\n              while (1) switch (_context57.prev = _context57.next) {\n                case 0:\n                  i = 0;\n                  o = [];\n                  s = 0, a = +Date.now();\n                case 3:\n                  if (!(i + 4 < t.length)) {\n                    _context57.next = 17;\n                    break;\n                  }\n                  l = i + 4 + t.readInt32LE(i) - 1;\n                  if (n) {\n                    for (; i + r.minv.dataPosition >= n[s++];);\n                    s--;\n                  }\n                  if (!(l < t.length)) {\n                    _context57.next = 14;\n                    break;\n                  }\n                  _h6 = new be({\n                    bytes: {\n                      byteArray: t,\n                      start: i,\n                      end: l\n                    },\n                    fileOffset: e.length > 0 ? 256 * e[s] + (i - n[s]) + r.minv.dataPosition + 1 : ae.signed(t.slice(i, l))\n                  });\n                  o.push(_h6);\n                  _context57.t0 = this.yieldThreadTime && +Date.now() - a > this.yieldThreadTime;\n                  if (!_context57.t0) {\n                    _context57.next = 14;\n                    break;\n                  }\n                  _context57.next = 13;\n                  return Xt(1);\n                case 13:\n                  a = +Date.now();\n                case 14:\n                  i = l + 1;\n                case 15:\n                  _context57.next = 3;\n                  break;\n                case 17:\n                  return _context57.abrupt(\"return\", o);\n                case 18:\n                case \"end\":\n                  return _context57.stop();\n              }\n            }, _callee54, this);\n          }));\n          function readBamFeatures(_x77, _x78, _x79, _x80) {\n            return _readBamFeatures.apply(this, arguments);\n          }\n          return readBamFeatures;\n        }()\n      }, {\n        key: \"hasRefSeq\",\n        value: function () {\n          var _hasRefSeq3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee55(t) {\n            var e, n, r;\n            return _regeneratorRuntime().wrap(function _callee55$(_context58) {\n              while (1) switch (_context58.prev = _context58.next) {\n                case 0:\n                  r = null === (e = this.chrToIndex) || void 0 === e ? void 0 : e[t];\n                  return _context58.abrupt(\"return\", void 0 !== r && (null === (n = this.index) || void 0 === n ? void 0 : n.hasRefSeq(r)));\n                case 2:\n                case \"end\":\n                  return _context58.stop();\n              }\n            }, _callee55, this);\n          }));\n          function hasRefSeq(_x81) {\n            return _hasRefSeq3.apply(this, arguments);\n          }\n          return hasRefSeq;\n        }()\n      }, {\n        key: \"lineCount\",\n        value: function () {\n          var _lineCount3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee56(t) {\n            var e, n;\n            return _regeneratorRuntime().wrap(function _callee56$(_context59) {\n              while (1) switch (_context59.prev = _context59.next) {\n                case 0:\n                  n = null === (e = this.chrToIndex) || void 0 === e ? void 0 : e[t];\n                  return _context59.abrupt(\"return\", void 0 !== n && this.index ? this.index.lineCount(n) : 0);\n                case 2:\n                case \"end\":\n                  return _context59.stop();\n              }\n            }, _callee56, this);\n          }));\n          function lineCount(_x82) {\n            return _lineCount3.apply(this, arguments);\n          }\n          return lineCount;\n        }()\n      }, {\n        key: \"indexCov\",\n        value: function () {\n          var _indexCov3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee57(t, e, n) {\n            var r, i;\n            return _regeneratorRuntime().wrap(function _callee57$(_context60) {\n              while (1) switch (_context60.prev = _context60.next) {\n                case 0:\n                  if (this.index) {\n                    _context60.next = 2;\n                    break;\n                  }\n                  return _context60.abrupt(\"return\", []);\n                case 2:\n                  _context60.next = 4;\n                  return this.index.parse();\n                case 4:\n                  i = null === (r = this.chrToIndex) || void 0 === r ? void 0 : r[t];\n                  return _context60.abrupt(\"return\", void 0 === i ? [] : this.index.indexCov(i, e, n));\n                case 6:\n                case \"end\":\n                  return _context60.stop();\n              }\n            }, _callee57, this);\n          }));\n          function indexCov(_x83, _x84, _x85) {\n            return _indexCov3.apply(this, arguments);\n          }\n          return indexCov;\n        }()\n      }, {\n        key: \"blocksForRange\",\n        value: function () {\n          var _blocksForRange3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee58(t, e, n, r) {\n            var i, o;\n            return _regeneratorRuntime().wrap(function _callee58$(_context61) {\n              while (1) switch (_context61.prev = _context61.next) {\n                case 0:\n                  if (this.index) {\n                    _context61.next = 2;\n                    break;\n                  }\n                  return _context61.abrupt(\"return\", []);\n                case 2:\n                  _context61.next = 4;\n                  return this.index.parse();\n                case 4:\n                  o = null === (i = this.chrToIndex) || void 0 === i ? void 0 : i[t];\n                  return _context61.abrupt(\"return\", void 0 === o ? [] : this.index.blocksForRange(o, e, n, r));\n                case 6:\n                case \"end\":\n                  return _context61.stop();\n              }\n            }, _callee58, this);\n          }));\n          function blocksForRange(_x86, _x87, _x88, _x89) {\n            return _blocksForRange3.apply(this, arguments);\n          }\n          return blocksForRange;\n        }()\n      }]);\n      return ve;\n    }();\n    var _e = {\n      BG: [.89, .89, .89, 1],\n      BG2: [.85, .85, .85, 1],\n      BG_MUTED: [.92, .92, .92, 1],\n      A: [0, 0, 1, 1],\n      C: [1, 0, 0, 1],\n      G: [0, 1, 0, 1],\n      T: [1, 1, 0, 1],\n      S: [0, 0, 0, .4],\n      H: [0, 0, 0, .5],\n      X: [0, 0, 0, .7],\n      I: [1, 0, 1, .5],\n      D: [1, .5, .5, .5],\n      N: [1, 1, 1, 1],\n      LARGE_INSERT_SIZE: [1, 0, 0, 1],\n      SMALL_INSERT_SIZE: [0, .24, .48, 1],\n      LL: [.15, .75, .75, 1],\n      RR: [.18, .24, .8, 1],\n      RL: [0, .5, .02, 1],\n      WHITE: [1, 1, 1, 1],\n      BLACK: [0, 0, 0, 1],\n      BLACK_05: [0, 0, 0, .5],\n      PLUS_STRAND: [.75, .75, 1, 1],\n      MINUS_STRAND: [1, .75, .75, 1],\n      MM_M6A_FOR: [.4, .2, .6, 1],\n      MM_M6A_REV: [.4, .2, .6, 1],\n      MM_M5C_FOR: [1, 0, 0, 1],\n      MM_M5C_REV: [1, 0, 0, 1],\n      HIGHLIGHTS_CG: [.95, .84, .84, 1],\n      HIGHLIGHTS_A: [.95, .89, .71, 1],\n      HIGHLIGHTS_T: [.95, .89, .71, 1],\n      HIGHLIGHTS_G: [.95, .84, .84, 1],\n      HIGHLIGHTS_C: [.95, .84, .84, 1],\n      HIGHLIGHTS_MZEROA: [.89, .84, .96, 1],\n      INDEX_DHS_BG: [0, 0, 0, 0]\n    };\n    var xe = {};\n    Object.keys(_e).map(function (t, e) {\n      return xe[t] = e, null;\n    });\n    var ke = function ke(t) {\n        return t = t.toUpperCase(), \"\".concat(parseInt(t.slice(1, 3), 16), \",\").concat(parseInt(t.slice(3, 5), 16), \",\").concat(parseInt(t.slice(5, 7), 16));\n      },\n      Ee = function Ee(t, e) {\n        var n = 0,\n          r = 0,\n          i = !1,\n          o = 0;\n        var s = [];\n        for (var a = 0; a < t.length; a++) t[a].match(/[0-9]/g) ? (r = 10 * r + +t[a], i = !1) : \"^\" === t[a] ? i = !0 : (n += r, e ? s.push({\n          length: r,\n          type: t[a]\n        }) : i ? o -= 1 : s.push({\n          pos: n,\n          base: t[a],\n          length: 1,\n          bamSeqShift: o\n        }), r = 0, n += 1);\n        return s;\n      },\n      Se = function Se(t) {\n        return t.highlightReadsBy.length > 0 || t.outlineMateOnHover;\n      };\n    var Ae = n(593),\n      Me = n.n(Ae),\n      Ie = \"$\";\n    function Re() {}\n    function Be(t, e) {\n      var n = new Re();\n      if (t instanceof Re) t.each(function (t, e) {\n        n.set(e, t);\n      });else if (Array.isArray(t)) {\n        var r,\n          i = -1,\n          o = t.length;\n        if (null == e) for (; ++i < o;) n.set(i, t[i]);else for (; ++i < o;) n.set(e(r = t[i], i, t), r);\n      } else if (t) for (var s in t) n.set(s, t[s]);\n      return n;\n    }\n    Re.prototype = Be.prototype = {\n      constructor: Re,\n      has: function has(t) {\n        return Ie + t in this;\n      },\n      get: function get(t) {\n        return this[Ie + t];\n      },\n      set: function set(t, e) {\n        return this[Ie + t] = e, this;\n      },\n      remove: function remove(t) {\n        var e = Ie + t;\n        return e in this && delete this[e];\n      },\n      clear: function clear() {\n        for (var t in this) t[0] === Ie && delete this[t];\n      },\n      keys: function keys() {\n        var t = [];\n        for (var e in this) e[0] === Ie && t.push(e.slice(1));\n        return t;\n      },\n      values: function values() {\n        var t = [];\n        for (var e in this) e[0] === Ie && t.push(this[e]);\n        return t;\n      },\n      entries: function entries() {\n        var t = [];\n        for (var e in this) e[0] === Ie && t.push({\n          key: e.slice(1),\n          value: this[e]\n        });\n        return t;\n      },\n      size: function size() {\n        var t = 0;\n        for (var e in this) e[0] === Ie && ++t;\n        return t;\n      },\n      empty: function empty() {\n        for (var t in this) if (t[0] === Ie) return !1;\n        return !0;\n      },\n      each: function each(t) {\n        for (var e in this) e[0] === Ie && t(this[e], e.slice(1), this);\n      }\n    };\n    var Te = Be;\n    function Oe() {}\n    var Ce = Te.prototype;\n    Oe.prototype = function (t, e) {\n      var n = new Oe();\n      if (t instanceof Oe) t.each(function (t) {\n        n.add(t);\n      });else if (t) {\n        var r = -1,\n          i = t.length;\n        if (null == e) for (; ++r < i;) n.add(t[r]);else for (; ++r < i;) n.add(e(t[r], r, t));\n      }\n      return n;\n    }.prototype = {\n      constructor: Oe,\n      has: Ce.has,\n      add: function add(t) {\n        return this[Ie + (t += \"\")] = t, this;\n      },\n      remove: Ce.remove,\n      clear: Ce.clear,\n      values: Ce.keys,\n      size: Ce.size,\n      empty: Ce.empty,\n      each: Ce.each\n    };\n    var Ne = {\n      value: function value() {}\n    };\n    function ze() {\n      for (var t, e = 0, n = arguments.length, r = {}; e < n; ++e) {\n        if (!(t = arguments[e] + \"\") || t in r || /[\\s.]/.test(t)) throw new Error(\"illegal type: \" + t);\n        r[t] = [];\n      }\n      return new Le(r);\n    }\n    function Le(t) {\n      this._ = t;\n    }\n    function Pe(t, e) {\n      for (var n, r = 0, i = t.length; r < i; ++r) if ((n = t[r]).name === e) return n.value;\n    }\n    function Ue(t, e, n) {\n      for (var r = 0, i = t.length; r < i; ++r) if (t[r].name === e) {\n        t[r] = Ne, t = t.slice(0, r).concat(t.slice(r + 1));\n        break;\n      }\n      return null != n && t.push({\n        name: e,\n        value: n\n      }), t;\n    }\n    Le.prototype = ze.prototype = {\n      constructor: Le,\n      on: function on(t, e) {\n        var n,\n          r,\n          i = this._,\n          o = (r = i, (t + \"\").trim().split(/^|\\s+/).map(function (t) {\n            var e = \"\",\n              n = t.indexOf(\".\");\n            if (n >= 0 && (e = t.slice(n + 1), t = t.slice(0, n)), t && !r.hasOwnProperty(t)) throw new Error(\"unknown type: \" + t);\n            return {\n              type: t,\n              name: e\n            };\n          })),\n          s = -1,\n          a = o.length;\n        if (!(arguments.length < 2)) {\n          if (null != e && \"function\" != typeof e) throw new Error(\"invalid callback: \" + e);\n          for (; ++s < a;) if (n = (t = o[s]).type) i[n] = Ue(i[n], t.name, e);else if (null == e) for (n in i) i[n] = Ue(i[n], t.name, null);\n          return this;\n        }\n        for (; ++s < a;) if ((n = (t = o[s]).type) && (n = Pe(i[n], t.name))) return n;\n      },\n      copy: function copy() {\n        var t = {},\n          e = this._;\n        for (var n in e) t[n] = e[n].slice();\n        return new Le(t);\n      },\n      call: function call(t, e) {\n        if ((n = arguments.length - 2) > 0) for (var n, r, i = new Array(n), o = 0; o < n; ++o) i[o] = arguments[o + 2];\n        if (!this._.hasOwnProperty(t)) throw new Error(\"unknown type: \" + t);\n        for (o = 0, n = (r = this._[t]).length; o < n; ++o) r[o].value.apply(e, i);\n      },\n      apply: function apply(t, e, n) {\n        if (!this._.hasOwnProperty(t)) throw new Error(\"unknown type: \" + t);\n        for (var r = this._[t], i = 0, o = r.length; i < o; ++i) r[i].value.apply(e, n);\n      }\n    };\n    var $e = ze;\n    function je(t, e) {\n      var n,\n        r,\n        i,\n        o,\n        s = $e(\"beforesend\", \"progress\", \"load\", \"error\"),\n        a = Te(),\n        l = new XMLHttpRequest(),\n        h = null,\n        u = null,\n        f = 0;\n      function c(t) {\n        var e,\n          r = l.status;\n        if (!r && function (t) {\n          var e = t.responseType;\n          return e && \"text\" !== e ? t.response : t.responseText;\n        }(l) || r >= 200 && r < 300 || 304 === r) {\n          if (i) try {\n            e = i.call(n, l);\n          } catch (t) {\n            return void s.call(\"error\", n, t);\n          } else e = l;\n          s.call(\"load\", n, e);\n        } else s.call(\"error\", n, t);\n      }\n      if (\"undefined\" != typeof XDomainRequest && !(\"withCredentials\" in l) && /^(http(s)?:)?\\/\\//.test(t) && (l = new XDomainRequest()), \"onload\" in l ? l.onload = l.onerror = l.ontimeout = c : l.onreadystatechange = function (t) {\n        l.readyState > 3 && c(t);\n      }, l.onprogress = function (t) {\n        s.call(\"progress\", n, t);\n      }, n = {\n        header: function header(t, e) {\n          return t = (t + \"\").toLowerCase(), arguments.length < 2 ? a.get(t) : (null == e ? a.remove(t) : a.set(t, e + \"\"), n);\n        },\n        mimeType: function mimeType(t) {\n          return arguments.length ? (r = null == t ? null : t + \"\", n) : r;\n        },\n        responseType: function responseType(t) {\n          return arguments.length ? (o = t, n) : o;\n        },\n        timeout: function timeout(t) {\n          return arguments.length ? (f = +t, n) : f;\n        },\n        user: function user(t) {\n          return arguments.length < 1 ? h : (h = null == t ? null : t + \"\", n);\n        },\n        password: function password(t) {\n          return arguments.length < 1 ? u : (u = null == t ? null : t + \"\", n);\n        },\n        response: function response(t) {\n          return i = t, n;\n        },\n        get: function get(t, e) {\n          return n.send(\"GET\", t, e);\n        },\n        post: function post(t, e) {\n          return n.send(\"POST\", t, e);\n        },\n        send: function send(e, i, c) {\n          return l.open(e, t, !0, h, u), null == r || a.has(\"accept\") || a.set(\"accept\", r + \",*/*\"), l.setRequestHeader && a.each(function (t, e) {\n            l.setRequestHeader(e, t);\n          }), null != r && l.overrideMimeType && l.overrideMimeType(r), null != o && (l.responseType = o), f > 0 && (l.timeout = f), null == c && \"function\" == typeof i && (c = i, i = null), null != c && 1 === c.length && (c = function (t) {\n            return function (e, n) {\n              t(null == e ? n : null);\n            };\n          }(c)), null != c && n.on(\"error\", c).on(\"load\", function (t) {\n            c(null, t);\n          }), s.call(\"beforesend\", n, l), l.send(null == i ? null : i), n;\n        },\n        abort: function abort() {\n          return l.abort(), n;\n        },\n        on: function on() {\n          var t = s.on.apply(s, arguments);\n          return t === s ? n : t;\n        }\n      }, null != e) {\n        if (\"function\" != typeof e) throw new Error(\"invalid callback: \" + e);\n        return n.get(e);\n      }\n      return n;\n    }\n    function Fe(t, e) {\n      return function (n, r) {\n        var i = je(n).mimeType(t).response(e);\n        if (null != r) {\n          if (\"function\" != typeof r) throw new Error(\"invalid callback: \" + r);\n          return i.get(r);\n        }\n        return i;\n      };\n    }\n    Fe(\"text/html\", function (t) {\n      return document.createRange().createContextualFragment(t.responseText);\n    }), Fe(\"application/json\", function (t) {\n      return JSON.parse(t.responseText);\n    });\n    var De = Fe(\"text/plain\", function (t) {\n      return t.responseText;\n    });\n    Fe(\"application/xml\", function (t) {\n      var e = t.responseXML;\n      if (!e) throw new Error(\"parse error\");\n      return e;\n    });\n    var qe = {},\n      He = {};\n    function Ge(t) {\n      return new Function(\"d\", \"return {\" + t.map(function (t, e) {\n        return JSON.stringify(t) + \": d[\" + e + '] || \"\"';\n      }).join(\",\") + \"}\");\n    }\n    function Ze(t) {\n      var e = Object.create(null),\n        n = [];\n      return t.forEach(function (t) {\n        for (var r in t) r in e || n.push(e[r] = r);\n      }), n;\n    }\n    function We(t, e) {\n      var n = t + \"\",\n        r = n.length;\n      return r < e ? new Array(e - r + 1).join(0) + n : n;\n    }\n    function Xe(t) {\n      var e = new RegExp('[\"' + t + \"\\n\\r]\"),\n        n = t.charCodeAt(0);\n      function r(t, e) {\n        var r,\n          i = [],\n          o = t.length,\n          s = 0,\n          a = 0,\n          l = o <= 0,\n          h = !1;\n        function u() {\n          if (l) return He;\n          if (h) return h = !1, qe;\n          var e,\n            r,\n            i = s;\n          if (34 === t.charCodeAt(i)) {\n            for (; s++ < o && 34 !== t.charCodeAt(s) || 34 === t.charCodeAt(++s););\n            return (e = s) >= o ? l = !0 : 10 === (r = t.charCodeAt(s++)) ? h = !0 : 13 === r && (h = !0, 10 === t.charCodeAt(s) && ++s), t.slice(i + 1, e - 1).replace(/\"\"/g, '\"');\n          }\n          for (; s < o;) {\n            if (10 === (r = t.charCodeAt(e = s++))) h = !0;else if (13 === r) h = !0, 10 === t.charCodeAt(s) && ++s;else if (r !== n) continue;\n            return t.slice(i, e);\n          }\n          return l = !0, t.slice(i, o);\n        }\n        for (10 === t.charCodeAt(o - 1) && --o, 13 === t.charCodeAt(o - 1) && --o; (r = u()) !== He;) {\n          for (var f = []; r !== qe && r !== He;) f.push(r), r = u();\n          e && null == (f = e(f, a++)) || i.push(f);\n        }\n        return i;\n      }\n      function i(e, n) {\n        return e.map(function (e) {\n          return n.map(function (t) {\n            return s(e[t]);\n          }).join(t);\n        });\n      }\n      function o(e) {\n        return e.map(s).join(t);\n      }\n      function s(t) {\n        return null == t ? \"\" : t instanceof Date ? function (t) {\n          var e,\n            n = t.getUTCHours(),\n            r = t.getUTCMinutes(),\n            i = t.getUTCSeconds(),\n            o = t.getUTCMilliseconds();\n          return isNaN(t) ? \"Invalid Date\" : ((e = t.getUTCFullYear()) < 0 ? \"-\" + We(-e, 6) : e > 9999 ? \"+\" + We(e, 6) : We(e, 4)) + \"-\" + We(t.getUTCMonth() + 1, 2) + \"-\" + We(t.getUTCDate(), 2) + (o ? \"T\" + We(n, 2) + \":\" + We(r, 2) + \":\" + We(i, 2) + \".\" + We(o, 3) + \"Z\" : i ? \"T\" + We(n, 2) + \":\" + We(r, 2) + \":\" + We(i, 2) + \"Z\" : r || n ? \"T\" + We(n, 2) + \":\" + We(r, 2) + \"Z\" : \"\");\n        }(t) : e.test(t += \"\") ? '\"' + t.replace(/\"/g, '\"\"') + '\"' : t;\n      }\n      return {\n        parse: function parse(t, e) {\n          var n,\n            i,\n            o = r(t, function (t, r) {\n              if (n) return n(t, r - 1);\n              i = t, n = e ? function (t, e) {\n                var n = Ge(t);\n                return function (r, i) {\n                  return e(n(r), i, t);\n                };\n              }(t, e) : Ge(t);\n            });\n          return o.columns = i || [], o;\n        },\n        parseRows: r,\n        format: function format(e, n) {\n          return null == n && (n = Ze(e)), [n.map(s).join(t)].concat(i(e, n)).join(\"\\n\");\n        },\n        formatBody: function formatBody(t, e) {\n          return null == e && (e = Ze(t)), i(t, e).join(\"\\n\");\n        },\n        formatRows: function formatRows(t) {\n          return t.map(o).join(\"\\n\");\n        },\n        formatRow: o,\n        formatValue: s\n      };\n    }\n    var Ve = Xe(\",\"),\n      Ye = Ve.parse;\n    function Ke(t, e) {\n      return function (n, r, i) {\n        arguments.length < 3 && (i = r, r = null);\n        var o = je(n).mimeType(t);\n        return o.row = function (t) {\n          return arguments.length ? o.response(function (t, e) {\n            return function (n) {\n              return t(n.responseText, e);\n            };\n          }(e, r = t)) : r;\n        }, o.row(r), i ? o.get(i) : o;\n      };\n    }\n    Ve.parseRows, Ve.format, Ve.formatBody, Ve.formatRows, Ve.formatRow, Ve.formatValue, Ke(\"text/csv\", Ye);\n    var Je = Xe(\"\\t\"),\n      Qe = Je.parse,\n      tn = Je.parseRows;\n    Je.format, Je.formatBody, Je.formatRows, Je.formatRow, Je.formatValue, Ke(\"text/tab-separated-values\", Qe);\n    var en = f(function (t) {\n      return t.pos;\n    }).left;\n    function nn(t) {\n      var e = [],\n        n = {},\n        r = {};\n      var i = 0;\n      for (var _o13 = 0; _o13 < t.length; _o13++) {\n        var _s20 = Number(t[_o13][1]);\n        i += _s20;\n        var a = {\n          id: _o13,\n          chr: t[_o13][0],\n          pos: i - _s20\n        };\n        e.push(a), r[a.chr] = a, n[t[_o13][0]] = _s20;\n      }\n      return {\n        cumPositions: e,\n        chrPositions: r,\n        totalLength: i,\n        chromLengths: n\n      };\n    }\n    f(function (t) {\n      return t.from;\n    }).right;\n    var rn = n(803);\n    var on = function on(t, e) {\n      return t.reduce(function (t, n) {\n        return (t[n[e]] = t[n[e]] || []).push(n), t;\n      }, {});\n    };\n    function sn(t, e) {\n      var n = t[0],\n        r = e[0];\n      if (n.indexOf(\"_\") >= 0) {\n        var _t56 = n.split(\"_\");\n        if (r.indexOf(\"_\") >= 0) {\n          var _e52 = r.split(\"_\");\n          return sn(_t56[1], _e52[1]);\n        }\n        return 1;\n      }\n      if (r.indexOf(\"_\") >= 0) return -1;\n      var i = [],\n        o = [];\n      var _iterator21 = _createForOfIteratorHelper(n.match(/(\\d+|[^\\d]+)/g)),\n        _step21;\n      try {\n        for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {\n          var _t58 = _step21.value;\n          i.push(Number.isNaN(_t58) ? _t58.toLowerCase() : +_t58);\n        }\n      } catch (err) {\n        _iterator21.e(err);\n      } finally {\n        _iterator21.f();\n      }\n      var _iterator22 = _createForOfIteratorHelper(r.match(/(\\d+|[^\\d]+)/g)),\n        _step22;\n      try {\n        for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {\n          var _t59 = _step22.value;\n          i.push(Number.isNaN(_t59) ? _t59.toLowerCase() : +_t59);\n        }\n      } catch (err) {\n        _iterator22.e(err);\n      } finally {\n        _iterator22.f();\n      }\n      for (var _i23 = 0, _arr = [\"m\", \"y\", \"x\"]; _i23 < _arr.length; _i23++) {\n        var _t57 = _arr[_i23];\n        if (r.toLowerCase().includes(_t57)) return -1;\n        if (n.toLowerCase().includes(_t57)) return 1;\n      }\n      return i < o ? -1 : o > i ? 1 : 0;\n    }\n    var an = function an(t, e, n, r) {\n        var i = t.get(\"seq\"),\n          o = +t.get(\"start\") + 1 + n,\n          s = +t.get(\"end\") + 1 + n,\n          a = {\n            id: t.get(\"id\"),\n            mate_ids: [],\n            start: +t.get(\"start\") + 1,\n            from: o,\n            to: s,\n            fromWithClipping: o,\n            toWithClipping: s,\n            md: t.get(\"MD\"),\n            sa: t.get(\"SA\"),\n            chrName: e,\n            chrOffset: n,\n            cigar: t.get(\"cigar\"),\n            mapq: t.get(\"mq\"),\n            strand: 1 === t.get(\"strand\") ? \"+\" : \"-\",\n            row: null,\n            readName: t.get(\"name\"),\n            color: xe.BG,\n            colorOverride: null,\n            mappingOrientation: null,\n            substitutions: [],\n            mm: t.get(\"MM\"),\n            ml: t.get(\"ML\"),\n            methylationOffsets: []\n          };\n        if (\"+\" === a.strand && r && r.plusStrandColor ? a.color = xe.PLUS_STRAND : \"-\" === a.strand && r && r.minusStrandColor && (a.color = xe.MINUS_STRAND), a.substitutions = function (t, e, n) {\n          var r = [],\n            i = null;\n          if (t.cigar) {\n            var _e53 = Ee(t.cigar, !0);\n            var _n33 = 0;\n            var _iterator23 = _createForOfIteratorHelper(_e53),\n              _step23;\n            try {\n              for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {\n                var _i24 = _step23.value;\n                \"S\" !== _i24.type && \"H\" !== _i24.type ? \"X\" === _i24.type ? (r.push({\n                  pos: _n33,\n                  length: _i24.length,\n                  range: [_n33 + t.start, _n33 + t.start + _i24.length],\n                  type: \"X\"\n                }), _n33 += _i24.length) : \"I\" === _i24.type ? r.push({\n                  pos: _n33,\n                  length: _i24.length,\n                  range: [_n33 + t.start, _n33 + t.start + _i24.length],\n                  type: \"I\"\n                }) : \"D\" === _i24.type ? (r.push({\n                  pos: _n33,\n                  length: _i24.length,\n                  range: [_n33 + t.start, _n33 + t.start + _i24.length],\n                  type: \"D\"\n                }), _n33 += _i24.length) : \"N\" === _i24.type ? (r.push({\n                  pos: _n33,\n                  length: _i24.length,\n                  range: [_n33 + t.start, _n33 + t.start + _i24.length],\n                  type: \"N\"\n                }), _n33 += _i24.length) : \"=\" === _i24.type ? (r.push({\n                  pos: _n33,\n                  length: _i24.length,\n                  range: [_n33 + t.start, _n33 + t.start + _i24.length],\n                  type: \"=\"\n                }), _n33 += _i24.length) : \"M\" === _i24.type && (r.push({\n                  pos: _n33,\n                  length: _i24.length,\n                  range: [_n33 + t.start, _n33 + t.start + _i24.length],\n                  type: \"M\"\n                }), _n33 += _i24.length) : (r.push({\n                  pos: _n33,\n                  length: _i24.length,\n                  range: [_n33 + t.start, _n33 + t.start + _i24.length],\n                  type: _i24.type\n                }), _n33 += _i24.length);\n              }\n            } catch (err) {\n              _iterator23.e(err);\n            } finally {\n              _iterator23.f();\n            }\n            var _o14 = _e53[0],\n              _s21 = _e53[_e53.length - 1];\n            \"S\" === _o14.type && (i = _o14, r.push({\n              pos: -_o14.length,\n              type: \"S\",\n              length: _o14.length\n            })), \"S\" === _s21.type && r.push({\n              pos: t.to - t.from,\n              length: _s21.length,\n              type: \"S\"\n            }), \"H\" === _o14.type && r.push({\n              pos: -_o14.length,\n              type: \"H\",\n              length: _o14.length\n            }), \"H\" === _s21.type && r.push({\n              pos: t.to - t.from,\n              length: _s21.length,\n              type: \"H\"\n            });\n          }\n          if (t.md) {\n            var _n34 = Ee(t.md, !1);\n            _n34.forEach(function (t) {\n              var n = t.pos + t.bamSeqShift,\n                r = n + t.length;\n              null !== i && (n += i.length, r += i.length), t.variant = e.substring(n, r), delete t.bamSeqShift;\n            }), r = _n34.concat(r);\n          }\n          return r;\n        }(a, i), r.methylation && (a.methylationOffsets = function (t, e) {\n          var n = [];\n          var r = {\n              unmodifiedBase: \"\",\n              code: \"\",\n              strand: \"\",\n              offsets: [],\n              probabilities: []\n            },\n            i = function i(t, e) {\n              var n = [];\n              for (var _r30 = 0; _r30 < t.length; ++_r30) t[_r30] === e && n.push(_r30);\n              return n;\n            },\n            o = {\n              A: \"T\",\n              C: \"G\",\n              G: \"C\",\n              T: \"A\",\n              U: \"A\",\n              Y: \"R\",\n              R: \"Y\",\n              S: \"S\",\n              W: \"W\",\n              K: \"M\",\n              M: \"K\",\n              B: \"V\",\n              V: \"B\",\n              D: \"H\",\n              H: \"D\",\n              N: \"N\"\n            };\n          if (t.mm && t.ml) {\n            var _s22 = 0;\n            var _a13 = t.mm.split(\";\"),\n              _l6 = t.ml.split(\",\");\n            _a13.forEach(function (a) {\n              if (0 === a.length) return;\n              var h = Object.assign({}, r),\n                u = a.split(\",\");\n              h.unmodifiedBase = u[0].charAt(0), h.strand = u[0].charAt(1), h.code = u[0].charAt(2);\n              var f = u.length - 1,\n                c = new Array(f),\n                d = new Array(f),\n                g = \"+\" === t.strand ? i(e, h.unmodifiedBase) : i(e, o[h.unmodifiedBase]);\n              var p = 0;\n              if (\"+\" === t.strand) for (var _t60 = 1; _t60 < u.length; ++_t60) {\n                p += parseInt(u[_t60]);\n                var _e54 = g[p],\n                  _n35 = _l6[_t60 - 1 + _s22];\n                c[_t60 - 1] = _e54, d[_t60 - 1] = _n35, p += 1;\n              } else for (var _t61 = 1; _t61 < u.length; ++_t61) {\n                p += parseInt(u[_t61]);\n                var _e55 = g[g.length - p - 1],\n                  _n36 = _l6[_t61 - 1 + _s22];\n                c[f - _t61] = _e55, d[f - _t61] = _n36, p += 1;\n              }\n              var m = 0,\n                y = 0,\n                b = 0;\n              var w = new Array(),\n                v = new Array();\n              var _iterator24 = _createForOfIteratorHelper(t.substitutions),\n                _step24;\n              try {\n                for (_iterator24.s(); !(_step24 = _iterator24.n()).done;) {\n                  var _e56 = _step24.value;\n                  if (\"S\" === _e56.type || \"H\" === _e56.type) y -= _e56.length, b = _e56.length;else if (\"M\" === _e56.type || \"=\" === _e56.type) for (; c[m] + y < _e56.pos + _e56.length;) c[m] + y >= _e56.pos && (w.push(c[m] + y - b), v.push(d[m])), m++;else \"X\" === _e56.type ? c[m] + y === _e56.pos && m++ : \"D\" === _e56.type ? y += _e56.length : \"I\" === _e56.type ? y -= _e56.length : \"N\" === _e56.type && (y += _e56.length);\n                  \"S\" !== _e56.type && \"H\" !== _e56.type || (y += _e56.length);\n                }\n              } catch (err) {\n                _iterator24.e(err);\n              } finally {\n                _iterator24.f();\n              }\n              h.offsets = w, h.probabilities = v, n.push(h), _s22 += f;\n            });\n          }\n          return n;\n        }(a, i)), r.indexDHS) {\n          a.metadata = JSON.parse(t.get(\"CO\")), a.indexDHSColors = function (t) {\n            if (!t.indexDHS) return {};\n            var e = {\n              INDEX_DHS_BG: [0, 0, 0, 0]\n            };\n            return Object.entries(t.indexDHS.itemRGBMap).map(function (t) {\n              var n = t[0],\n                r = n.split(\",\").map(function (t) {\n                  return parseFloat((parseFloat(t) / 255).toFixed(2));\n                });\n              e[\"INDEX_DHS_\".concat(n)] = [].concat(_toConsumableArray(r), [1]);\n            }), _objectSpread(_objectSpread({}, _e), e);\n          }(r);\n          var _e57 = {};\n          Object.keys(a.indexDHSColors).map(function (t, n) {\n            return _e57[t] = n, null;\n          }), xe = _e57, a.color = xe.INDEX_DHS_BG;\n        }\n        var l = 0,\n          h = 0;\n        var _iterator25 = _createForOfIteratorHelper(a.substitutions),\n          _step25;\n        try {\n          for (_iterator25.s(); !(_step25 = _iterator25.n()).done;) {\n            var _t62 = _step25.value;\n            (\"S\" === _t62.type || \"H\" === _t62.type) && _t62.pos < 0 ? l = -_t62.length : (\"S\" === _t62.type || \"H\" === _t62.type) && _t62.pos > 0 && (h = _t62.length);\n          }\n        } catch (err) {\n          _iterator25.e(err);\n        } finally {\n          _iterator25.f();\n        }\n        return a.fromWithClipping += l, a.toWithClipping += h, a;\n      },\n      ln = function ln(t) {\n        var e = on(t, \"readName\");\n        return Object.entries(e).forEach(function (_ref19) {\n          var _ref20 = _slicedToArray(_ref19, 2),\n            t = _ref20[0],\n            e = _ref20[1];\n          if (2 === e.length) {\n            var _t63 = e[0],\n              n = e[1];\n            _t63.mate_ids = [n.id], n.mate_ids = [_t63.id];\n          } else if (e.length > 2) {\n            var _t64 = e.map(function (t) {\n              return t.id;\n            });\n            e.forEach(function (e) {\n              e.mate_ids = _t64;\n            });\n          }\n        }), e;\n      },\n      hn = function hn(t) {\n        var e = [],\n          n = Object.keys(t);\n        var _loop2 = function _loop2() {\n          var i = {\n            row: null,\n            substitutions: []\n          };\n          for (var _e58 = 0; _e58 < n.length; _e58++) i[n[_e58]] = t[n[_e58]][r];\n          if (i.from += 1, i.to += 1, i.variants && (i.substitutions = i.variants.map(function (t) {\n            return {\n              pos: t[1] - (i.from - i.chrOffset) + 1,\n              variant: t[2].toUpperCase(),\n              length: 1\n            };\n          })), i.cigars) {\n            var _iterator26 = _createForOfIteratorHelper(i.cigars),\n              _step26;\n            try {\n              for (_iterator26.s(); !(_step26 = _iterator26.n()).done;) {\n                var _t65 = _step26.value;\n                i.substitutions.push({\n                  pos: _t65[0] - (i.from - i.chrOffset) + 1,\n                  type: _t65[1].toUpperCase(),\n                  length: _t65[2]\n                });\n              }\n            } catch (err) {\n              _iterator26.e(err);\n            } finally {\n              _iterator26.f();\n            }\n          }\n          e.push(i);\n        };\n        for (var r = 0; r < t[n[0]].length; r++) {\n          _loop2();\n        }\n        return e;\n      },\n      un = {},\n      fn = {},\n      cn = {},\n      dn = {},\n      gn = {},\n      pn = {},\n      mn = new (Me())({\n        max: 20\n      }),\n      yn = {},\n      bn = {},\n      wn = new (Me())({\n        max: 20\n      }),\n      vn = {},\n      _n = {};\n    function xn(t, e) {\n      var n = dn[e].authHeader,\n        r = {\n          headers: {}\n        };\n      return n && (r.headers.Authorization = n), fetch(t, r);\n    }\n    var kn = {\n        maxTileWidth: 2e5\n      },\n      En = function En(t) {\n        var _vn$t = vn[t],\n          e = _vn$t.chromSizesUrl,\n          n = _vn$t.bamUrl,\n          r = e ? [fn[n], gn[e]] : [fn[n]];\n        return Promise.all(r).then(function (r) {\n          var i = 1024;\n          var o = null;\n          if (r.length > 1) o = r[1];else {\n            var _t66 = [];\n            var _iterator27 = _createForOfIteratorHelper(un[n].indexToChr),\n              _step27;\n            try {\n              for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {\n                var _step27$value = _step27.value,\n                  _e59 = _step27$value.refName,\n                  _r31 = _step27$value.length;\n                _t66.push([_e59, _r31]);\n              }\n            } catch (err) {\n              _iterator27.e(err);\n            } finally {\n              _iterator27.f();\n            }\n            _t66.sort(sn), o = nn(_t66);\n          }\n          pn[e] = o;\n          var s = {\n            tile_size: i,\n            bins_per_dimension: i,\n            max_zoom: Math.ceil(Math.log(o.totalLength / i) / Math.log(2)),\n            max_width: o.totalLength,\n            min_pos: [0],\n            max_pos: [o.totalLength]\n          };\n          return yn[t] = s, s;\n        });\n      },\n      Sn = /*#__PURE__*/function () {\n        var _ref21 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee59(t, e, n) {\n          var _cn$t, r, i, _vn$t2, o, s, a, l, h;\n          return _regeneratorRuntime().wrap(function _callee59$(_context62) {\n            while (1) switch (_context62.prev = _context62.next) {\n              case 0:\n                _cn$t = cn[t], r = _cn$t.maxTileWidth, i = _cn$t.maxSampleSize, _vn$t2 = vn[t], o = _vn$t2.bamUrl, s = _vn$t2.fastaUrl, a = _vn$t2.chromSizesUrl, l = un[o], h = s && bn[s] ? bn[s] : null;\n                return _context62.abrupt(\"return\", En(t).then(function (o) {\n                  var s = +o.max_width / Math.pow(2, +e),\n                    u = [];\n                  if (s > r) return new Promise(function (t) {\n                    return t([]);\n                  });\n                  var f = o.min_pos[0] + n * s;\n                  var c = o.min_pos[0] + (n + 1) * s,\n                    d = pn[a],\n                    g = d.chromLengths,\n                    p = d.cumPositions;\n                  var _loop3 = function _loop3(_r32) {\n                    var o = p[_r32].chr,\n                      s = p[_r32].pos,\n                      a = p[_r32].pos + g[o];\n                    if (mn.set(\"\".concat(t, \".\").concat(e, \".\").concat(n), []), wn.set(\"\".concat(t, \".\").concat(e, \".\").concat(n), []), s <= f && f < a) {\n                      var _d = {\n                        viewAsPairs: Se(_n[t]),\n                        maxSampleSize: i || 1e3,\n                        maxInsertSize: 1e3\n                      };\n                      if (!(c > a)) {\n                        var _i25 = Math.ceil(c - s),\n                          _a14 = Math.floor(f - s);\n                        u.push(l.getRecordsForRange(o, _a14, _i25, _d).then(function (i) {\n                          var s = i.map(function (e) {\n                            return an(e, o, p[_r32].pos, _n[t]);\n                          });\n                          return mn.set(\"\".concat(t, \".\").concat(e, \".\").concat(n), mn.get(\"\".concat(t, \".\").concat(e, \".\").concat(n)).concat(s)), [];\n                        })), h && u.push(h.getSequence(o, _a14, _i25).then(function (s) {\n                          var l = {\n                            id: \"\".concat(o, \":\").concat(_a14, \"-\").concat(_i25),\n                            chrom: o,\n                            start: _a14,\n                            stop: _i25,\n                            chromOffset: p[_r32].pos,\n                            data: s\n                          };\n                          return wn.set(\"\".concat(t, \".\").concat(e, \".\").concat(n), wn.get(\"\".concat(t, \".\").concat(e, \".\").concat(n)).concat(l)), [];\n                        }));\n                        return 1; // break\n                      }\n                      u.push(l.getRecordsForRange(o, f - s, a - s, _d).then(function (i) {\n                        var s = i.map(function (e) {\n                          return an(e, o, p[_r32].pos, _n[t]);\n                        });\n                        mn.set(\"\".concat(t, \".\").concat(e, \".\").concat(n), mn.get(\"\".concat(t, \".\").concat(e, \".\").concat(n)).concat(s));\n                      })), h && u.push(h.getSequence(o, f - s, a - s).then(function (i) {\n                        var l = {\n                          id: \"\".concat(o, \":\").concat(f - s, \"-\").concat(a - s),\n                          chrom: o,\n                          start: f - s,\n                          stop: a - s,\n                          chromOffset: p[_r32].pos,\n                          data: i\n                        };\n                        wn.set(\"\".concat(t, \".\").concat(e, \".\").concat(n), wn.get(\"\".concat(t, \".\").concat(e, \".\").concat(n)).concat(l));\n                      })), f = a;\n                    }\n                  };\n                  for (var _r32 = 0; _r32 < p.length; _r32++) {\n                    if (_loop3(_r32)) break;\n                  }\n                  return Promise.all(u).then(function (t) {\n                    return t.flat();\n                  });\n                }));\n              case 2:\n              case \"end\":\n                return _context62.stop();\n            }\n          }, _callee59);\n        }));\n        return function Sn(_x90, _x91, _x92) {\n          return _ref21.apply(this, arguments);\n        };\n      }(),\n      An = function An(t, e, n) {\n        var r = t.max_width / Math.pow(2, e);\n        return [n * r, (n + 1) * r];\n      };\n    function Mn(t, e, n) {\n      var r = t.fromWithClipping - n,\n        i = t.toWithClipping + n;\n      if (null === t.row || void 0 === t.row) {\n        for (var _n37 = 0; _n37 < e.length; _n37++) {\n          if (!e[_n37]) return;\n          var _o15 = e[_n37].from,\n            _s23 = e[_n37].to;\n          if (i < _o15) return t.row = _n37, void (e[_n37] = {\n            from: r,\n            to: _s23\n          });\n          if (r > _s23) return t.row = _n37, void (e[_n37] = {\n            from: _o15,\n            to: i\n          });\n        }\n        t.row = e.length, e.push({\n          from: r,\n          to: i\n        });\n      } else {\n        var _n38 = t.row;\n        if (e[_n38]) {\n          var _t67 = e[_n38].from,\n            _o16 = e[_n38].to;\n          e[_n38] = {\n            from: Math.min(r, _t67),\n            to: Math.max(i, _o16)\n          };\n        } else e[_n38] = {\n          from: r,\n          to: i\n        };\n      }\n    }\n    function In(t, e) {\n      var _Object$assign = Object.assign({\n          prevRows: [],\n          padding: 5\n        }, e || {}),\n        n = _Object$assign.prevRows,\n        r = _Object$assign.padding;\n      var i = [];\n      var o = new Set(t.map(function (t) {\n          return t.id;\n        })),\n        s = n.flat().filter(function (t) {\n          return o.has(t.id);\n        });\n      e.maxRows && e.maxRows;\n      for (var _t68 = 0; _t68 < s.length; _t68++) Mn(s[_t68], i, r);\n      var a = new Set(s.map(function (t) {\n        return t.id;\n      }));\n      var l = [];\n      var h = t.filter(function (t) {\n        return !a.has(t.id);\n      });\n      if (0 === s.length) {\n        h.sort(function (t, e) {\n          return t.fromWithClipping - e.fromWithClipping;\n        });\n        var _iterator28 = _createForOfIteratorHelper(h),\n          _step28;\n        try {\n          for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {\n            var _t69 = _step28.value;\n            Mn(_t69, i, r);\n          }\n        } catch (err) {\n          _iterator28.e(err);\n        } finally {\n          _iterator28.f();\n        }\n        l = h;\n      } else {\n        var _t70 = (s[0].fromWithClipping + s[s.length - 1].to) / 2,\n          _e60 = h.filter(function (e) {\n            return e.fromWithClipping <= _t70;\n          });\n        _e60.sort(function (t, e) {\n          return e.fromWithClipping - t.fromWithClipping;\n        });\n        var _iterator29 = _createForOfIteratorHelper(_e60),\n          _step29;\n        try {\n          for (_iterator29.s(); !(_step29 = _iterator29.n()).done;) {\n            var _t71 = _step29.value;\n            Mn(_t71, i, r);\n          }\n        } catch (err) {\n          _iterator29.e(err);\n        } finally {\n          _iterator29.f();\n        }\n        var _n39 = h.filter(function (e) {\n          return e.fromWithClipping > _t70;\n        });\n        _n39.sort(function (t, e) {\n          return t.fromWithClipping - e.fromWithClipping;\n        });\n        var _iterator30 = _createForOfIteratorHelper(_n39),\n          _step30;\n        try {\n          for (_iterator30.s(); !(_step30 = _iterator30.n()).done;) {\n            var _t72 = _step30.value;\n            Mn(_t72, i, r);\n          }\n        } catch (err) {\n          _iterator30.e(err);\n        } finally {\n          _iterator30.f();\n        }\n        l = _e60.concat(s, _n39);\n      }\n      var u = [];\n      var _loop4 = function _loop4(_t73) {\n        u[_t73] = l.filter(function (e) {\n          return e.row === _t73;\n        });\n      };\n      for (var _t73 = 0; _t73 < i.length; _t73++) {\n        _loop4(_t73);\n      }\n      return u;\n    }\n    var Rn = Math.pow(2, 20),\n      Bn = Math.pow(2, 21),\n      Tn = Math.pow(2, 21),\n      On = new Float32Array(Rn),\n      Cn = new Float32Array(Bn),\n      Nn = new Int32Array(Tn);\n    function zn(t) {\n      for (var e in t) return !1;\n      return !0;\n    }\n    var Ln = {\n      init: function init(t, e, r, i, o, s, a, l) {\n        if (cn[t] = a ? _objectSpread(_objectSpread({}, kn), a) : kn, i && o) {\n          var _t74 = new he.kC(i),\n            _e61 = new he.kC(o),\n            _n40 = n(805),\n            _r33 = _n40.IndexedFasta;\n          bn[i] = new _r33({\n            fasta: _t74,\n            fai: _e61\n          });\n        }\n        s && (gn[s] = gn[s] || new Promise(function (t) {\n          !function (t, e) {\n            var n = {\n              absToChr: function absToChr(t) {\n                return n.chrPositions ? function (t, e) {\n                  if (!e || !e.cumPositions || !e.cumPositions.length) return null;\n                  var n = en(e.cumPositions, t);\n                  var r = e.cumPositions[e.cumPositions.length - 1].chr,\n                    i = e.chromLengths[r];\n                  n -= n > 0 && 1;\n                  var o = Math.floor(t - e.cumPositions[n].pos),\n                    s = 0;\n                  return o < 0 && (s = o - 1, o = 1), n === e.cumPositions.length - 1 && o > i && (s = o - i, o = i), [e.cumPositions[n].chr, o, s, n];\n                }(t, n) : null;\n              },\n              chrToAbs: function chrToAbs() {\n                var _ref22 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [],\n                  _ref23 = _slicedToArray(_ref22, 2),\n                  t = _ref23[0],\n                  e = _ref23[1];\n                return n.chrPositions ? (r = t, i = e, n.chrPositions[r].pos + i) : null;\n                var r, i;\n              }\n            };\n            De(t, function (t, r) {\n              if (t) e && e(null);else {\n                var _t75 = nn(tn(r));\n                Object.keys(_t75).forEach(function (e) {\n                  n[e] = _t75[e];\n                }), e && e(n);\n              }\n            });\n          }(s, t);\n        })), un[e] || (un[e] = new ve({\n          bamUrl: e,\n          baiUrl: r\n        }), fn[e] = un[e].getHeader()), vn[t] = {\n          bamUrl: e,\n          fastaUrl: i,\n          chromSizesUrl: s\n        }, _n[t] = l;\n      },\n      serverInit: function serverInit(t, e, n, r) {\n        dn[t] = {\n          server: e,\n          tilesetUid: n,\n          authHeader: r\n        };\n      },\n      tilesetInfo: En,\n      serverTilesetInfo: function serverTilesetInfo(t) {\n        return xn(\"\".concat(dn[t].server, \"/tileset_info/?d=\").concat(dn[t].tilesetUid), t).then(function (t) {\n          return t.json();\n        }).then(function (e) {\n          var n = e[dn[t].tilesetUid];\n          return yn[t] = n, n;\n        });\n      },\n      serverFetchTilesDebounced: function () {\n        var _serverFetchTilesDebounced = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee60(t, e) {\n          var n, r, i, _iterator31, _step31, _loop5, o;\n          return _regeneratorRuntime().wrap(function _callee60$(_context64) {\n            while (1) switch (_context64.prev = _context64.next) {\n              case 0:\n                n = dn[t], r = {}, i = [];\n                _iterator31 = _createForOfIteratorHelper(e);\n                _context64.prev = 2;\n                _loop5 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop5() {\n                  var n, _n$split, _n$split2, e, o, s, a, _An, _An2, l, h, _i26;\n                  return _regeneratorRuntime().wrap(function _loop5$(_context63) {\n                    while (1) switch (_context63.prev = _context63.next) {\n                      case 0:\n                        n = _step31.value;\n                        _n$split = n.split(\".\"), _n$split2 = _slicedToArray(_n$split, 2), e = _n$split2[0], o = _n$split2[1];\n                        s = yn[t];\n                        a = !1;\n                        _An = An(s, e, o), _An2 = _slicedToArray(_An, 2), l = _An2[0], h = _An2[1];\n                      case 5:\n                        if (!(e > 0)) {\n                          _context63.next = 13;\n                          break;\n                        }\n                        _i26 = \"\".concat(t, \".\").concat(e, \".\").concat(o);\n                        if (!mn.has(_i26)) {\n                          _context63.next = 10;\n                          break;\n                        }\n                        r[n] = mn.get(_i26).filter(function (t) {\n                          return l < t.to && h > t.from;\n                        }), r[n].tilePositionId = n, mn.set(\"\".concat(t, \".\").concat(n), r[n]), a = !0;\n                        return _context63.abrupt(\"break\", 13);\n                      case 10:\n                        e -= 1, o = Math.floor(o / 2);\n                      case 11:\n                        _context63.next = 5;\n                        break;\n                      case 13:\n                        a || i.push(n);\n                      case 14:\n                      case \"end\":\n                        return _context63.stop();\n                    }\n                  }, _loop5);\n                });\n                _iterator31.s();\n              case 5:\n                if ((_step31 = _iterator31.n()).done) {\n                  _context64.next = 9;\n                  break;\n                }\n                return _context64.delegateYield(_loop5(), \"t0\", 7);\n              case 7:\n                _context64.next = 5;\n                break;\n              case 9:\n                _context64.next = 14;\n                break;\n              case 11:\n                _context64.prev = 11;\n                _context64.t1 = _context64[\"catch\"](2);\n                _iterator31.e(_context64.t1);\n              case 14:\n                _context64.prev = 14;\n                _iterator31.f();\n                return _context64.finish(14);\n              case 17:\n                o = i.map(function (t) {\n                  return \"d=\".concat(n.tilesetUid, \".\").concat(t);\n                });\n                return _context64.abrupt(\"return\", xn(\"\".concat(dn[t].server, \"/tiles/?\").concat(o.join(\"&\")), t).then(function (t) {\n                  return t.json();\n                }).then(function (i) {\n                  var o = {};\n                  var _iterator32 = _createForOfIteratorHelper(e),\n                    _step32;\n                  try {\n                    for (_iterator32.s(); !(_step32 = _iterator32.n()).done;) {\n                      var _r34 = _step32.value;\n                      var _e62 = \"\".concat(t, \".\").concat(_r34),\n                        _s24 = \"\".concat(n.tilesetUid, \".\").concat(_r34);\n                      if (i[_s24]) {\n                        var _t76 = i[_s24];\n                        i[_s24].error || (_t76 = hn(i[_s24])), _t76.tilePositionId = _r34, o[_r34] = _t76, mn.set(_e62, _t76);\n                      }\n                    }\n                  } catch (err) {\n                    _iterator32.e(err);\n                  } finally {\n                    _iterator32.f();\n                  }\n                  return _objectSpread(_objectSpread({}, r), o);\n                }));\n              case 19:\n              case \"end\":\n                return _context64.stop();\n            }\n          }, _callee60, null, [[2, 11, 14, 17]]);\n        }));\n        function serverFetchTilesDebounced(_x93, _x94) {\n          return _serverFetchTilesDebounced.apply(this, arguments);\n        }\n        return serverFetchTilesDebounced;\n      }(),\n      fetchTilesDebounced: function () {\n        var _fetchTilesDebounced = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee61(t, e) {\n          var n, r, i, _iterator33, _step33, _n41, _e64, _o17, _s25;\n          return _regeneratorRuntime().wrap(function _callee61$(_context65) {\n            while (1) switch (_context65.prev = _context65.next) {\n              case 0:\n                n = {}, r = [], i = [];\n                _iterator33 = _createForOfIteratorHelper(e);\n                try {\n                  for (_iterator33.s(); !(_step33 = _iterator33.n()).done;) {\n                    _n41 = _step33.value;\n                    _e64 = _n41.split(\".\"), _o17 = parseInt(_e64[0], 10), _s25 = parseInt(_e64[1], 10);\n                    Number.isNaN(_s25) || Number.isNaN(_o17) ? console.warn(\"Invalid tile zoom or position:\", _o17, _s25) : (r.push(_n41), i.push(Sn(t, _o17, _s25)));\n                  }\n                } catch (err) {\n                  _iterator33.e(err);\n                } finally {\n                  _iterator33.f();\n                }\n                return _context65.abrupt(\"return\", Promise.all(i).then(function (t) {\n                  for (var _e63 = 0; _e63 < t.length; _e63++) {\n                    var _i27 = r[_e63];\n                    n[_i27] = t[_e63], n[_i27].tilePositionId = _i27;\n                  }\n                  return n;\n                }));\n              case 4:\n              case \"end\":\n                return _context65.stop();\n            }\n          }, _callee61);\n        }));\n        function fetchTilesDebounced(_x95, _x96) {\n          return _fetchTilesDebounced.apply(this, arguments);\n        }\n        return fetchTilesDebounced;\n      }(),\n      tile: Sn,\n      renderSegments: function renderSegments(e, n, r, i, s, a, l, h, u) {\n        var f = {},\n          c = {};\n        var d,\n          g = {},\n          p = null;\n        var _iterator34 = _createForOfIteratorHelper(n),\n          _step34;\n        try {\n          for (_iterator34.s(); !(_step34 = _iterator34.n()).done;) {\n            var _t98 = _step34.value;\n            var _n49 = null;\n            try {\n              if (_n49 = mn.get(\"\".concat(e, \".\").concat(_t98)), _n49.error) continue;\n            } catch (t) {\n              continue;\n            }\n            if (!_n49) continue;\n            var _iterator43 = _createForOfIteratorHelper(_n49),\n              _step43;\n            try {\n              for (_iterator43.s(); !(_step43 = _iterator43.n()).done;) {\n                var _t102 = _step43.value;\n                f[_t102.id] = _t102;\n              }\n            } catch (err) {\n              _iterator43.e(err);\n            } finally {\n              _iterator43.f();\n            }\n            var _r44 = wn.get(\"\".concat(e, \".\").concat(_t98));\n            if (_r44 && h.methylation && h.methylation.highlights) {\n              var _t99 = Object.keys(h.methylation.highlights);\n              var _iterator44 = _createForOfIteratorHelper(_r44),\n                _step44;\n              try {\n                for (_iterator44.s(); !(_step44 = _iterator44.n()).done;) {\n                  var _e89 = _step44.value;\n                  var _n50 = parseInt(_e89.start) + parseInt(_e89.chromOffset),\n                    _r45 = _e89.data.toUpperCase();\n                  var _iterator45 = _createForOfIteratorHelper(_t99),\n                    _step45;\n                  try {\n                    for (_iterator45.s(); !(_step45 = _iterator45.n()).done;) {\n                      var _e90 = _step45.value;\n                      if (\"M0A\" !== _e90) {\n                        var _t100 = _e90.toUpperCase(),\n                          _i45 = _e90.length;\n                        var _o28 = _r45.indexOf(_t100);\n                        for (!zn(c) && c[_e90] || (c[_e90] = new Array()); _o28 > -1;) c[_e90].push(_o28 + _n50 + 1), _o28 = _r45.indexOf(_t100, _o28 + _i45);\n                      } else if (\"M0A\" === _e90) {\n                        var _t101 = _r45.indexOf(\"A\"),\n                          _i46 = _r45.indexOf(\"T\"),\n                          _o29 = Math.min(_t101, _i46);\n                        for (!zn(c) && c[_e90] || (c[_e90] = new Array()); _o29 > -1;) c[_e90].push(_o29 + _n50 + 1), _t101 = _r45.indexOf(\"A\", _o29 + 1), _i46 = _r45.indexOf(\"T\", _o29 + 1), _o29 = -1 !== _t101 && -1 !== _i46 ? Math.min(_t101, _i46) : -1 === _t101 ? _i46 : -1 === _i46 ? _t101 : -1;\n                        p = new Set(_toConsumableArray(c[_e90]));\n                      }\n                    }\n                  } catch (err) {\n                    _iterator45.e(err);\n                  } finally {\n                    _iterator45.f();\n                  }\n                }\n              } catch (err) {\n                _iterator44.e(err);\n              } finally {\n                _iterator44.f();\n              }\n            }\n          }\n        } catch (err) {\n          _iterator34.e(err);\n        } finally {\n          _iterator34.f();\n        }\n        var m = Object.values(f);\n        if (h.minMappingQuality > 0 && (m = m.filter(function (t) {\n          return t.mapq >= h.minMappingQuality;\n        })), function (t, e) {\n          var n = e.outlineMateOnHover,\n            r = e.highlightReadsBy.includes(\"insertSize\"),\n            i = e.highlightReadsBy.includes(\"pairOrientation\"),\n            o = e.highlightReadsBy.includes(\"insertSizeAndPairOrientation\");\n          var s;\n          if (!(r || i || o)) return n ? void ln(t) : void 0;\n          s = ln(t), Object.entries(s).forEach(function (_ref24) {\n            var _ref25 = _slicedToArray(_ref24, 2),\n              t = _ref25[0],\n              n = _ref25[1];\n            if (2 === n.length) {\n              var _t77 = n[0],\n                _l7 = n[1];\n              _t77.colorOverride = null, _l7.colorOverride = null;\n              var _h7 = (a = _l7, (s = _t77).from < a.from ? Math.max(0, a.from - s.to) : Math.max(0, s.from - a.to)),\n                _u4 = e.largeInsertSizeThreshold && _h7 > e.largeInsertSizeThreshold,\n                _f3 = e.smallInsertSizeThreshold && _h7 < e.smallInsertSizeThreshold,\n                _c = \"+\" === _t77.strand && \"+\" === _l7.strand,\n                _d2 = \"-\" === _t77.strand && \"-\" === _l7.strand,\n                _g2 = _t77.from < _l7.from && \"-\" === _t77.strand;\n              r && (_u4 ? _t77.colorOverride = xe.LARGE_INSERT_SIZE : _f3 && (_t77.colorOverride = xe.SMALL_INSERT_SIZE)), (i || o && (_u4 || _f3)) && (_c ? (_t77.colorOverride = xe.LL, _t77.mappingOrientation = \"++\") : _d2 ? (_t77.colorOverride = xe.RR, _t77.mappingOrientation = \"--\") : _g2 && (_t77.colorOverride = xe.RL, _t77.mappingOrientation = \"-+\")), _l7.colorOverride = _t77.colorOverride, _l7.mappingOrientation = _t77.mappingOrientation;\n            }\n            var s, a;\n          });\n        }(m, h), Se(h) && !u) {\n          var _t78 = Number.MAX_VALUE,\n            _r35 = -Number.MAX_VALUE;\n          var _i28 = yn[e];\n          var _iterator35 = _createForOfIteratorHelper(n),\n            _step35;\n          try {\n            for (_iterator35.s(); !(_step35 = _iterator35.n()).done;) {\n              var _e65 = _step35.value;\n              var _n42 = _e65.split(\".\")[0],\n                _o18 = _e65.split(\".\")[1],\n                _s26 = An(_i28, +_n42, +_o18);\n              _t78 = Math.min(_t78, _s26[0]), _r35 = Math.max(_r35, _s26[1]);\n            }\n          } catch (err) {\n            _iterator35.e(err);\n          } finally {\n            _iterator35.f();\n          }\n          m = m.filter(function (e) {\n            return e.to >= _t78 && e.from <= _r35;\n          });\n        }\n        var _ref26 = [Number.MAX_VALUE, -Number.MAX_VALUE],\n          y = _ref26[0],\n          b = _ref26[1];\n        for (var _t79 = 0; _t79 < m.length; _t79++) m[_t79].from < y && (y = m[_t79].from), m[_t79].to > b && (b = m[_t79].to);\n        var w = null;\n        if (on) {\n          var _t80 = h && h.groupBy;\n          _t80 = _t80 || null, w = on(m, _t80);\n        } else w = {\n          \"null\": m\n        };\n        if (u && h.methylation) {\n          var _t81 = u.range.left.start,\n            _e66 = u.range.right.stop,\n            _n43 = u.distanceFn;\n          var _r36 = null;\n          var _i29 = _e66 - _t81,\n            _o19 = m.length,\n            _s27 = new Array();\n          var _a15 = 0;\n          var _h8 = {};\n          switch (_n43) {\n            case \"Euclidean\":\n              _r36 = rn.WI;\n              for (var _n44 = 0; _n44 < _o19; ++_n44) {\n                var _r37 = m[_n44],\n                  _o20 = (_r37.to, _r37.from, new Array(_i29).fill(-255)),\n                  _l8 = _r37.from - _r37.chrOffset,\n                  _u5 = _r37.to - _r37.chrOffset;\n                if (_l8 < _t81 && _u5 > _e66) {\n                  var _e67 = _t81 - _l8,\n                    _u6 = _e67 + _i29,\n                    _f4 = _r37.methylationOffsets;\n                  var _iterator36 = _createForOfIteratorHelper(_f4),\n                    _step36;\n                  try {\n                    for (_iterator36.s(); !(_step36 = _iterator36.n()).done;) {\n                      var _t82 = _step36.value;\n                      var _n45 = _t82.offsets,\n                        _r38 = _t82.probabilities;\n                      if (\"A\" === _t82.unmodifiedBase || \"T\" === _t82.unmodifiedBase || \"C\" === _t82.unmodifiedBase) for (var _t83 = 0; _t83 < _n45.length; _t83++) {\n                        var _i30 = _n45[_t83],\n                          _s28 = _r38[_t83];\n                        _i30 >= _e67 && _i30 < _u6 && (_o20[_i30 - _e67] = parseInt(_s28));\n                      }\n                    }\n                  } catch (err) {\n                    _iterator36.e(err);\n                  } finally {\n                    _iterator36.f();\n                  }\n                  _h8[_a15] = _n44, _s27[_a15++] = _o20;\n                }\n              }\n              break;\n            case \"Jaccard\":\n              _r36 = rn.eN;\n              var _loop6 = function _loop6() {\n                var n = m[_e68],\n                  r = (n.to, n.from, new Array(_i29).fill(0)),\n                  o = n.start - _t81,\n                  l = n.methylationOffsets;\n                var u = !0;\n                var _iterator37 = _createForOfIteratorHelper(l),\n                  _step37;\n                try {\n                  for (_iterator37.s(); !(_step37 = _iterator37.n()).done;) {\n                    var _t84 = _step37.value;\n                    \"A\" !== _t84.unmodifiedBase && \"T\" !== _t84.unmodifiedBase && \"C\" !== _t84.unmodifiedBase || _t84.offsets.map(function (t) {\n                      return t + o;\n                    }).forEach(function (t, e) {\n                      t >= 0 && t < _i29 && (r[t] = 1, u = !1);\n                    });\n                  }\n                } catch (err) {\n                  _iterator37.e(err);\n                } finally {\n                  _iterator37.f();\n                }\n                u || (_h8[_a15] = _e68, _s27[_a15++] = r);\n              };\n              for (var _e68 = 0; _e68 < _o19; ++_e68) {\n                _loop6();\n              }\n              break;\n            default:\n              throw new Error(\"Render cluster data object is missing distance function\");\n          }\n          if (_s27.length > 0) {\n            var _ref27 = (0, rn.eM)({\n                data: _s27,\n                distance: _r36,\n                linkage: rn.bP\n              }),\n              _t85 = _ref27.clusters,\n              _e69 = _ref27.distances,\n              _n46 = _ref27.order,\n              _i31 = _ref27.clustersGivenK,\n              _o21 = _n46.map(function (t) {\n                var e = _h8[t];\n                return [m[e]];\n              });\n            for (var _i32 = 0, _Object$keys3 = Object.keys(w); _i32 < _Object$keys3.length; _i32++) {\n              var _t86 = _Object$keys3[_i32];\n              var _e70 = _o21;\n              w[_t86] = {}, w[_t86].rows = _e70;\n            }\n          } else for (var _i33 = 0, _Object$keys4 = Object.keys(w); _i33 < _Object$keys4.length; _i33++) {\n            var _t87 = _Object$keys4[_i33];\n            var _e71 = In(w[_t87], {\n              prevRows: l[_t87] && l[_t87].rows || []\n            });\n            w[_t87] = {}, w[_t87].rows = _e71;\n          }\n        } else for (var _i34 = 0, _Object$keys5 = Object.keys(w); _i34 < _Object$keys5.length; _i34++) {\n          var _t88 = _Object$keys5[_i34];\n          var _e72 = In(w[_t88], {\n            prevRows: l[_t88] && l[_t88].rows || []\n          });\n          w[_t88] = {}, w[_t88].rows = _e72;\n        }\n        var v = Object.values(w).map(function (t) {\n          return t.rows.length;\n        }).reduce(function (t, e) {\n          return t + e;\n        }, 0);\n        var _ = h.showCoverage ? h.coverageHeight : 0;\n        var x = o().domain(t(0, v + _)).range([0, a[1]]).paddingInner(.2);\n        var k = 0,\n          E = 0,\n          S = 0;\n        var A = function A(t, e) {\n            if (k > Rn - 2) {\n              Rn *= 2;\n              var _t89 = On;\n              On = new Float32Array(Rn), On.set(_t89);\n            }\n            return On[k++] = t, On[k++] = e, k / 2 - 1;\n          },\n          M = function M(t, e, n) {\n            if (S >= Tn - 3) {\n              Tn *= 2;\n              var _t90 = Nn;\n              Nn = new Int32Array(Tn), Nn.set(_t90);\n            }\n            Nn[S++] = t, Nn[S++] = e, Nn[S++] = n;\n          },\n          I = function I(t, e, n, r, i) {\n            var o = t,\n              s = o + n,\n              a = e,\n              l = e + r,\n              h = A(o, a),\n              u = A(s, a),\n              f = A(o, l),\n              c = A(s, l);\n            (function (t, e) {\n              if (E >= Bn - 4) {\n                Bn *= 2;\n                var _t91 = Cn;\n                Cn = new Float32Array(Bn), Cn.set(_t91);\n              }\n              for (var _e73 = 0; _e73 < 4; _e73++) Cn[E++] = t;\n            })(i), M(h, u, f), M(f, c, u);\n          },\n          R = Mt().domain(r).range(i);\n        var B = 0;\n        var T = Object.keys(w).sort();\n        var _iterator38 = _createForOfIteratorHelper(T),\n          _step38;\n        try {\n          for (_iterator38.s(); !(_step38 = _iterator38.n()).done;) {\n            var _t103 = _step38.value;\n            w[_t103].start = x(_), _ += w[_t103].rows.length, w[_t103].end = x(_ - 1) + x.bandwidth(), x.step(), x.bandwidth(), B += 1;\n          }\n        } catch (err) {\n          _iterator38.e(err);\n        } finally {\n          _iterator38.f();\n        }\n        if (I(0, 0, a[0], a[1], xe.WHITE), h.showCoverage) {\n          var _n47 = 1e4;\n          d = Math.max(Math.floor((b - y) / _n47), 1);\n          var _r39 = function (t, e, n) {\n            var r = {};\n            var i = 0;\n            var _vn$t3 = vn[t],\n              o = _vn$t3.chromSizesUrl,\n              s = _vn$t3.bamUrl;\n            if (!pn[o]) return {\n              coverage: r,\n              maxCoverage: i\n            };\n            var _loop7 = function _loop7() {\n              var o = e[_t92].from,\n                s = e[_t92].to;\n              for (var _t93 = o - o % n + n; _t93 < s; _t93 += n) r[_t93] || (r[_t93] = {\n                reads: 0,\n                matches: 0,\n                variants: {\n                  A: 0,\n                  C: 0,\n                  G: 0,\n                  T: 0,\n                  N: 0\n                },\n                range: \"\"\n              }), r[_t93].reads++, r[_t93].matches++, i = Math.max(i, r[_t93].reads);\n              e[_t92].substitutions.forEach(function (t) {\n                if (t.variant) {\n                  var _e75 = o + t.pos;\n                  if (!r[_e75]) return;\n                  r[_e75].matches--, r[_e75].variants[t.variant] || (r[_e75].variants[t.variant] = 0), r[_e75].variants[t.variant]++;\n                }\n              });\n            };\n            for (var _t92 = 0; _t92 < e.length; _t92++) {\n              _loop7();\n            }\n            var a = pn[o].absToChr;\n            return Object.entries(r).forEach(function (_ref28) {\n              var _ref29 = _slicedToArray(_ref28, 2),\n                t = _ref29[0],\n                e = _ref29[1];\n              var r = a(t);\n              var i = r[0] + \":\" + Pt(\",\")(r[1]);\n              if (n > 1) {\n                var _e74 = a(parseInt(t, 10) + n - 1);\n                i += \"-\" + Pt(\",\")(_e74[1]);\n              }\n              e.range = i;\n            }), {\n              coverage: r,\n              maxCoverage: i\n            };\n          }(e, m, d);\n          g = _r39.coverage;\n          var _i35 = _r39.maxCoverage,\n            _s29 = t(0, h.coverageHeight),\n            _a16 = [x(0), x(h.coverageHeight - 1) + x.bandwidth()],\n            _l9 = o().domain(_s29).range(_a16).paddingInner(.05);\n          var _u7,\n            _f5,\n            _c2,\n            _p = xe.BG_MUTED;\n          var _w = (R(1) - R(0)) * d,\n            _v = _l9.bandwidth() * h.coverageHeight,\n            _2 = _v / _i35;\n          for (var _i36 = 0, _Object$keys6 = Object.keys(g); _i36 < _Object$keys6.length; _i36++) {\n            var _t94 = _Object$keys6[_i36];\n            _u7 = R(_t94), _f5 = _v;\n            for (var _i37 = 0, _Object$keys7 = Object.keys(g[_t94].variants); _i37 < _Object$keys7.length; _i37++) {\n              var _e76 = _Object$keys7[_i37];\n              _c2 = g[_t94].variants[_e76] * _2, _f5 -= _c2;\n              var _n48 = 1 === d ? xe[_e76] : _p;\n              I(_u7, _f5, _w, _c2, _n48);\n            }\n            _c2 = g[_t94].matches * _2, _f5 -= _c2, 1 === d && (_p = _t94 % 2 == 0 ? xe.BG : xe.BG2), I(_u7, _f5, _w, _c2, _p);\n          }\n        }\n        var _loop8 = function _loop8() {\n          var e = _Object$values[_i38];\n          var n = e.rows,\n            r = t(0, n.length),\n            i = [e.start, e.end],\n            s = h && h.indexDHS ? .25 : h && h.methylation && h.methylation.hasOwnProperty(\"fiberPadding\") ? h.methylation.fiberPadding : .25,\n            a = o().domain(r).range(i).paddingInner(s);\n          var l, u, f, d;\n          n.map(function (t, e) {\n            f = a(e);\n            var n = a.bandwidth();\n            d = f + n, t.map(function (t, e) {\n              var r = R(t.from),\n                i = R(t.to);\n              if (l = r, u = i, h && h.indexDHS ? I(l, f, u - l, n, xe.INDEX_DHS_BG) : I(l, f, u - l, n, t.colorOverride || t.color), h && h.methylation && h.methylation.hideSubstitutions) {\n                if (!zn(c)) {\n                  var _e77 = Object.keys(c);\n                  for (var _i39 = 0, _e78 = _e77; _i39 < _e78.length; _i39++) {\n                    var _r40 = _e78[_i39];\n                    var _e79 = _r40.length,\n                      _i40 = Math.max(1, R(_e79) - R(0)),\n                      _o22 = xe[\"HIGHLIGHTS_\".concat(_r40)],\n                      _s30 = c[_r40];\n                    if (\"M0A\" !== _r40) {\n                      var _iterator39 = _createForOfIteratorHelper(_s30),\n                        _step39;\n                      try {\n                        for (_iterator39.s(); !(_step39 = _iterator39.n()).done;) {\n                          var _e80 = _step39.value;\n                          _e80 >= t.from && _e80 < t.to && (l = R(_e80), u = l + _i40, I(l, f, _i40, n, _o22));\n                        }\n                      } catch (err) {\n                        _iterator39.e(err);\n                      } finally {\n                        _iterator39.f();\n                      }\n                    }\n                  }\n                }\n                var _e81 = h && h.methylation && h.methylation.categoryAbbreviations && h.methylation.categoryAbbreviations.includes(\"5mC+\"),\n                  _r41 = h && h.methylation && h.methylation.categoryAbbreviations && h.methylation.categoryAbbreviations.includes(\"5mC-\"),\n                  _i41 = h && h.methylation && h.methylation.categoryAbbreviations && h.methylation.categoryAbbreviations.includes(\"m6A+\"),\n                  _o23 = h && h.methylation && h.methylation.categoryAbbreviations && h.methylation.categoryAbbreviations.includes(\"m6A-\"),\n                  _s31 = h && h.methylation && h.methylation.probabilityThresholdRange ? h.methylation.probabilityThresholdRange[0] : 0,\n                  _a17 = h && h.methylation && h.methylation.probabilityThresholdRange ? h.methylation.probabilityThresholdRange[1] + 1 : 256;\n                var _d3 = null;\n                var _iterator40 = _createForOfIteratorHelper(t.methylationOffsets),\n                  _step40;\n                try {\n                  var _loop9 = function _loop9() {\n                    var h = _step40.value;\n                    var g = h.offsets,\n                      m = h.probabilities,\n                      y = 1;\n                    switch (h.unmodifiedBase) {\n                      case \"C\":\n                        \"m\" === h.code && \"+\" === h.strand && _e81 && (_d3 = xe.MM_M5C_FOR);\n                        break;\n                      case \"G\":\n                        \"m\" === h.code && \"-\" === h.strand && _r41 && (_d3 = xe.MM_M5C_REV);\n                        break;\n                      case \"A\":\n                        \"a\" === h.code && \"+\" === h.strand && _i41 && (_d3 = xe.MM_M6A_FOR);\n                        break;\n                      case \"T\":\n                        \"a\" === h.code && \"-\" === h.strand && _o23 && (_d3 = xe.MM_M6A_REV);\n                    }\n                    if (_d3) {\n                      if (\"a\" === h.code && \"M0A\" in c) {\n                        var _e82 = new Set(g.filter(function (t, e) {\n                            return m[e] < _s31;\n                          }).map(function (e) {\n                            return e + t.from;\n                          })),\n                          _r42 = 1,\n                          _i42 = Math.max(1, R(_r42) - R(0)),\n                          _o24 = xe.HIGHLIGHTS_MZEROA,\n                          _a18 = _toConsumableArray(p).filter(function (t) {\n                            return !_e82.has(t);\n                          });\n                        var _iterator41 = _createForOfIteratorHelper(_a18),\n                          _step41;\n                        try {\n                          for (_iterator41.s(); !(_step41 = _iterator41.n()).done;) {\n                            var _e83 = _step41.value;\n                            _e83 >= t.from && _e83 <= t.to && (l = R(_e83), u = l + _i42, I(l, f, _i42, n, _o24));\n                          }\n                        } catch (err) {\n                          _iterator41.e(err);\n                        } finally {\n                          _iterator41.f();\n                        }\n                      }\n                      var _e84 = Math.max(1, R(y) - R(0));\n                      g.filter(function (t, e) {\n                        return m[e] >= _s31 && m[e] < _a17;\n                      }).map(function (r) {\n                        l = R(t.from + r), u = l + _e84, I(l, f, _e84, n, _d3);\n                      });\n                    }\n                  };\n                  for (_iterator40.s(); !(_step40 = _iterator40.n()).done;) {\n                    _loop9();\n                  }\n                } catch (err) {\n                  _iterator40.e(err);\n                } finally {\n                  _iterator40.f();\n                }\n              }\n              if (h && h.indexDHS) {\n                var _e85 = h.indexDHS ? t.metadata : {};\n                var _r43 = xe.BLACK;\n                h.indexDHS && (_r43 = xe[\"INDEX_DHS_\".concat(_e85.rgb)]);\n                var _iterator42 = _createForOfIteratorHelper(t.substitutions),\n                  _step42;\n                try {\n                  for (_iterator42.s(); !(_step42 = _iterator42.n()).done;) {\n                    var _e86 = _step42.value;\n                    l = R(t.from + _e86.pos);\n                    var _i44 = Math.max(1, R(_e86.length) - R(0)),\n                      _o26 = Math.max(1, R(.1) - R(0));\n                    if (u = l + _i44, \"A\" === _e86.variant) I(l, f, _i44, n, xe.A);else if (\"C\" === _e86.variant) I(l, f, _i44, n, xe.C);else if (\"G\" === _e86.variant) I(l, f, _i44, n, xe.G);else if (\"T\" === _e86.variant) I(l, f, _i44, n, xe.T);else if (\"S\" === _e86.type) I(l, f, _i44, n, xe.S);else if (\"H\" === _e86.type) I(l, f, _i44, n, xe.H);else if (\"X\" === _e86.type) I(l, f, _i44, n, xe.X);else if (\"I\" === _e86.type) I(l, f, _o26, n, xe.I);else if (\"D\" === _e86.type) {\n                      I(l, f, _i44, n, xe.D);\n                      var _t95 = 6,\n                        _e87 = .1;\n                      for (var _o27 = 0; _o27 <= _t95; _o27++) I(l + _o27 * _i44 / _t95, f, _e87, n, _r43);\n                    } else if (\"N\" === _e86.type) {\n                      var _t96 = (f + d) / 2,\n                        _e88 = Math.min((d - f) / 4.5, 1);\n                      I(l, _t96 + _e88 / 2, u - l, _e88, _r43);\n                    } else {\n                      var _t97 = .5 * a.bandwidth();\n                      I(l, f + .25 * (d - f), _i44, _t97, _r43);\n                    }\n                  }\n                } catch (err) {\n                  _iterator42.e(err);\n                } finally {\n                  _iterator42.f();\n                }\n                if (h && h.indexDHS) {\n                  var _i43 = t.from - t.chrOffset,\n                    _o25 = _e85.summit.start,\n                    _s32 = _e85.summit.end - _o25,\n                    _a19 = _o25 - _i43,\n                    _l10 = R(t.from + _a19),\n                    _h9 = f,\n                    _u8 = Math.max(1, R(_s32) - R(0));\n                  I(_l10, _h9, _u8, n, _r43);\n                }\n              }\n            });\n          });\n        };\n        for (var _i38 = 0, _Object$values = Object.values(w); _i38 < _Object$values.length; _i38++) {\n          _loop8();\n        }\n        var O = On.slice(0, k).buffer,\n          C = Cn.slice(0, E).buffer,\n          N = Nn.slice(0, S).buffer,\n          z = {\n            rows: w,\n            tileIds: n,\n            coverage: g,\n            coverageSamplingDistance: d,\n            positionsBuffer: O,\n            colorsBuffer: C,\n            ixBuffer: N,\n            xScaleDomain: r,\n            xScaleRange: i\n          };\n        return Dt(z, [z.positionsBuffer, C, N]);\n      },\n      exportSegmentsAsBED12: function exportSegmentsAsBED12(t, e, n, r, i, o, s, a, l) {\n        var h = {},\n          u = [];\n        var _iterator46 = _createForOfIteratorHelper(e),\n          _step46;\n        try {\n          for (_iterator46.s(); !(_step46 = _iterator46.n()).done;) {\n            var _n55 = _step46.value;\n            var _e98 = mn.get(\"\".concat(t, \".\").concat(_n55));\n            if (_e98.error) throw new Error(_e98.error);\n            var _iterator49 = _createForOfIteratorHelper(_e98),\n              _step49;\n            try {\n              for (_iterator49.s(); !(_step49 = _iterator49.n()).done;) {\n                var _t115 = _step49.value;\n                h[_t115.id] = _t115;\n              }\n            } catch (err) {\n              _iterator49.e(err);\n            } finally {\n              _iterator49.f();\n            }\n          }\n        } catch (err) {\n          _iterator46.e(err);\n        } finally {\n          _iterator46.f();\n        }\n        var f = Object.values(h);\n        a.minMappingQuality > 0 && (f = f.filter(function (t) {\n          return t.mapq >= a.minMappingQuality;\n        }));\n        var _ref30 = [Number.MAX_VALUE, -Number.MAX_VALUE],\n          c = _ref30[0],\n          d = _ref30[1];\n        for (var _t104 = 0; _t104 < f.length; _t104++) f[_t104].from < c && (c = f[_t104].from), f[_t104].to > d && (d = f[_t104].to);\n        var g = null;\n        if (on) {\n          var _t105 = a && a.groupBy;\n          _t105 = _t105 || null, g = on(f, _t105);\n        } else g = {\n          \"null\": f\n        };\n        if (l && a.methylation) {\n          var _t106 = l.range.left.chrom,\n            _e91 = l.range.left.start,\n            _n51 = l.range.right.stop,\n            _r46 = l.distanceFn;\n          var _i47 = null;\n          var _o30 = _n51 - _e91,\n            _h10 = f.length,\n            _c3 = new Array();\n          var _d4 = 0;\n          var _p2 = {};\n          switch (_r46) {\n            case \"Euclidean\":\n              _i47 = rn.WI;\n              var _loop10 = function _loop10() {\n                var n = f[_t107],\n                  r = n.to - n.from,\n                  i = new Array(_o30).fill(-255),\n                  s = n.start - _e91;\n                for (var _t108 = s < 0 ? 0 : s; _t108 < r + s && _t108 !== _o30; ++_t108) i[_t108] = 0;\n                var a = n.methylationOffsets;\n                var l = !0;\n                a.forEach(function (t) {\n                  \"A\" !== t.unmodifiedBase && \"T\" !== t.unmodifiedBase && \"C\" !== t.unmodifiedBase || t.offsets.map(function (t) {\n                    return t + s;\n                  }).forEach(function (e, n) {\n                    e >= 0 && e < _o30 && (i[e] = parseInt(t.probabilities[n]), l = !1);\n                  });\n                }), l || (_p2[_d4] = _t107, _c3[_d4++] = i);\n              };\n              for (var _t107 = 0; _t107 < _h10; ++_t107) {\n                _loop10();\n              }\n              break;\n            case \"Jaccard\":\n              _i47 = rn.eN;\n              var _loop11 = function _loop11() {\n                var n = f[_t109],\n                  r = (n.to, n.from, new Array(_o30).fill(0)),\n                  i = n.start - _e91,\n                  s = n.methylationOffsets;\n                var a = !0;\n                s.forEach(function (t) {\n                  \"A\" !== t.unmodifiedBase && \"T\" !== t.unmodifiedBase && \"C\" !== t.unmodifiedBase || t.offsets.map(function (t) {\n                    return t + i;\n                  }).forEach(function (t, e) {\n                    t >= 0 && t < _o30 && (r[t] = 1, a = !1);\n                  });\n                }), a || (_p2[_d4] = _t109, _c3[_d4++] = r);\n              };\n              for (var _t109 = 0; _t109 < _h10; ++_t109) {\n                _loop11();\n              }\n              break;\n            default:\n              throw new Error(\"Render cluster data object is missing distance function\");\n          }\n          if (_c3.length > 0) {\n            var _ref31 = (0, rn.eM)({\n                data: _c3,\n                distance: _i47,\n                linkage: rn.bP,\n                onProgress: null\n              }),\n              _t110 = _ref31.clusters,\n              _e92 = _ref31.distances,\n              _n52 = _ref31.order,\n              _r47 = _ref31.clustersGivenK,\n              _o31 = _n52.map(function (t) {\n                var e = _p2[t];\n                return [f[e]];\n              });\n            for (var _i48 = 0, _Object$keys8 = Object.keys(g); _i48 < _Object$keys8.length; _i48++) {\n              var _t111 = _Object$keys8[_i48];\n              var _e93 = _o31;\n              g[_t111] = {}, g[_t111].rows = _e93;\n            }\n          } else for (var _i49 = 0, _Object$keys9 = Object.keys(g); _i49 < _Object$keys9.length; _i49++) {\n            var _t112 = _Object$keys9[_i49];\n            var _e94 = In(g[_t112], {\n              prevRows: s[_t112] && s[_t112].rows || []\n            });\n            g[_t112] = {}, g[_t112].rows = _e94;\n          }\n          Object.values(g).map(function (t) {\n            return t.rows.length;\n          }).reduce(function (t, e) {\n            return t + e;\n          }, 0);\n          for (var _i50 = 0, _Object$values2 = Object.values(g); _i50 < _Object$values2.length; _i50++) {\n            var _e95 = _Object$values2[_i50];\n            var _n53 = _e95.rows;\n            _n53.map(function (e, n) {\n              e.map(function (e, n) {\n                var r = a && a.methylation && a.methylation.categoryAbbreviations && a.methylation.categoryAbbreviations.includes(\"5mC+\"),\n                  i = a && a.methylation && a.methylation.categoryAbbreviations && a.methylation.categoryAbbreviations.includes(\"5mC-\"),\n                  o = a && a.methylation && a.methylation.categoryAbbreviations && a.methylation.categoryAbbreviations.includes(\"m6A+\"),\n                  s = a && a.methylation && a.methylation.categoryAbbreviations && a.methylation.categoryAbbreviations.includes(\"m6A-\"),\n                  h = a && a.methylation && a.methylation.probabilityThresholdRange ? a.methylation.probabilityThresholdRange[0] : 0,\n                  f = a && a.methylation && a.methylation.probabilityThresholdRange ? a.methylation.probabilityThresholdRange[1] + 1 : 255;\n                var c = null;\n                var d = {\n                  chrom: _t106,\n                  chromStart: e.start - 1,\n                  chromEnd: e.start + (e.to - e.from) - 1,\n                  name: \"\".concat(l.name, \"__\").concat(e.readName),\n                  score: 1e3,\n                  strand: e.strand,\n                  thickStart: e.start - 1,\n                  thickEnd: e.start + (e.to - e.from) - 1,\n                  itemRgb: ke(l.colors[0]),\n                  blockCount: 0,\n                  blockSizes: [],\n                  blockStarts: []\n                };\n                var _iterator47 = _createForOfIteratorHelper(e.methylationOffsets),\n                  _step47;\n                try {\n                  for (_iterator47.s(); !(_step47 = _iterator47.n()).done;) {\n                    var _t113 = _step47.value;\n                    var _e96 = _t113.offsets,\n                      _n54 = _t113.probabilities,\n                      _a20 = 1;\n                    switch (_t113.unmodifiedBase) {\n                      case \"C\":\n                        \"m\" === _t113.code && \"+\" === _t113.strand && r && (c = null);\n                        break;\n                      case \"G\":\n                        \"m\" === _t113.code && \"-\" === _t113.strand && i && (c = null);\n                        break;\n                      case \"A\":\n                        \"a\" === _t113.code && \"+\" === _t113.strand && o && (c = xe.MM_M6A_FOR);\n                        break;\n                      case \"T\":\n                        \"a\" === _t113.code && \"-\" === _t113.strand && s && (c = xe.MM_M6A_REV);\n                    }\n                    if (c) {\n                      var _t114 = 0;\n                      var _iterator48 = _createForOfIteratorHelper(_e96),\n                        _step48;\n                      try {\n                        for (_iterator48.s(); !(_step48 = _iterator48.n()).done;) {\n                          var _r48 = _step48.value;\n                          var _e97 = _n54[_t114];\n                          _e97 >= h && _e97 < f && (d.blockCount++, d.blockSizes.push(_a20), d.blockStarts.push(_r48 - 1)), _t114++;\n                        }\n                      } catch (err) {\n                        _iterator48.e(err);\n                      } finally {\n                        _iterator48.f();\n                      }\n                      d.blockStarts.sort(function (t, e) {\n                        return t - e;\n                      });\n                    }\n                  }\n                } catch (err) {\n                  _iterator47.e(err);\n                } finally {\n                  _iterator47.f();\n                }\n                u.push(d);\n              });\n            });\n          }\n        }\n        return {\n          uid: l.uid,\n          bed12Elements: u\n        };\n      }\n    };\n    Ft(Ln);\n  }();\n})();");
;// CONCATENATED MODULE: ./src/PileupTrack.js
function PileupTrack_typeof(o) { "@babel/helpers - typeof"; return PileupTrack_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, PileupTrack_typeof(o); }
function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct.bind(); } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }
function PileupTrack_toConsumableArray(arr) { return PileupTrack_arrayWithoutHoles(arr) || PileupTrack_iterableToArray(arr) || PileupTrack_unsupportedIterableToArray(arr) || PileupTrack_nonIterableSpread(); }
function PileupTrack_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function PileupTrack_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function PileupTrack_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return PileupTrack_arrayLikeToArray(arr); }
function PileupTrack_ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function PileupTrack_objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? PileupTrack_ownKeys(Object(t), !0).forEach(function (r) { PileupTrack_defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : PileupTrack_ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function PileupTrack_defineProperty(obj, key, value) { key = PileupTrack_toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function PileupTrack_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function PileupTrack_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, PileupTrack_toPropertyKey(descriptor.key), descriptor); } }
function PileupTrack_createClass(Constructor, protoProps, staticProps) { if (protoProps) PileupTrack_defineProperties(Constructor.prototype, protoProps); if (staticProps) PileupTrack_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function PileupTrack_toPropertyKey(arg) { var key = PileupTrack_toPrimitive(arg, "string"); return PileupTrack_typeof(key) === "symbol" ? key : String(key); }
function PileupTrack_toPrimitive(input, hint) { if (PileupTrack_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (PileupTrack_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get.bind(); } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }
function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (PileupTrack_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function PileupTrack_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = PileupTrack_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || PileupTrack_unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function PileupTrack_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return PileupTrack_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return PileupTrack_arrayLikeToArray(o, minLen); }
function PileupTrack_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }




var createColorTexture = function createColorTexture(PIXI, colors) {
  var colorTexRes = Math.max(2, Math.ceil(Math.sqrt(colors.length)));
  var rgba = new Float32Array(Math.pow(colorTexRes, 2) * 4);
  colors.forEach(function (color, i) {
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4] = color[0]; // r
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 1] = color[1]; // g
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 2] = color[2]; // b
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 3] = color[3]; // a
  });
  return [PIXI.Texture.fromBuffer(rgba, colorTexRes, colorTexRes), colorTexRes];
};
function transformY(p, t) {
  return p * t.k + t.y;
}
function invY(p, t) {
  return (p - t.y) / t.k;
}
function subPos(read, sub) {
  var subStart = read.from + sub.pos;
  var subEnd = read.from + sub.pos + sub.length;
  return [subStart, subEnd];
}

/** The distance between a substitution and the mouse position */
function calcSubDistance(mousePos, read, sub) {
  var _subPos = subPos(read, sub),
    _subPos2 = _slicedToArray(_subPos, 2),
    subStart = _subPos2[0],
    subEnd = _subPos2[1];
  var subDistance = null;
  if (mousePos < subStart) {
    subDistance = subStart - mousePos;
  } else if (mousePos > subEnd) {
    subDistance = mousePos - subEnd;
  } else {
    subDistance = 0;
  }
  return subDistance;
}

/** Find the thearest substition to the mouse position */
function findNearestSub(mousePos, read, nearestDistance) {
  var subs = read.substitutions;
  var nearestSub = null;
  var nearestSubDistance = Number.MAX_VALUE;
  var _iterator = PileupTrack_createForOfIteratorHelper(subs),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var sub = _step.value;
      var subDistance = calcSubDistance(mousePos, read, sub);
      if (subDistance < nearestSubDistance) {
        nearestSub = sub;
        nearestSubDistance = subDistance;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  if (nearestSubDistance < nearestDistance) {
    return nearestSub;
  }
  return null;
}
var scaleScalableGraphics = function scaleScalableGraphics(graphics, xScale, drawnAtScale) {
  var tileK = (drawnAtScale.domain()[1] - drawnAtScale.domain()[0]) / (xScale.domain()[1] - xScale.domain()[0]);
  var newRange = xScale.domain().map(drawnAtScale);
  var posOffset = newRange[0];
  graphics.scale.x = tileK;
  graphics.position.x = -posOffset * tileK;
};
var getTilePosAndDimensions = function getTilePosAndDimensions(zoomLevel, tilePos, binsPerTileIn, tilesetInfo) {
  /**
   * Get the tile's position in its coordinate system.
   *
   * TODO: Replace this function with one imported from
   * HGC.utils.trackUtils
   */
  var xTilePos = tilePos[0];
  var yTilePos = tilePos[1];
  if (tilesetInfo.resolutions) {
    // the default bins per tile which should
    // not be used because the right value should be in the tileset info

    var binsPerTile = binsPerTileIn;
    var sortedResolutions = tilesetInfo.resolutions.map(function (x) {
      return +x;
    }).sort(function (a, b) {
      return b - a;
    });
    var chosenResolution = sortedResolutions[zoomLevel];
    var _tileWidth = chosenResolution * binsPerTile;
    var _tileHeight = _tileWidth;
    var _tileX = chosenResolution * binsPerTile * tilePos[0];
    var _tileY = chosenResolution * binsPerTile * tilePos[1];
    return {
      tileX: _tileX,
      tileY: _tileY,
      tileWidth: _tileWidth,
      tileHeight: _tileHeight
    };
  }

  // max_width should be substitutable with 2 ** tilesetInfo.max_zoom
  var totalWidth = tilesetInfo.max_width;
  var totalHeight = tilesetInfo.max_width;
  var minX = tilesetInfo.min_pos[0];
  var minY = tilesetInfo.min_pos[1];
  var tileWidth = totalWidth / Math.pow(2, zoomLevel);
  var tileHeight = totalHeight / Math.pow(2, zoomLevel);
  var tileX = minX + xTilePos * tileWidth;
  var tileY = minY + yTilePos * tileHeight;
  return {
    tileX: tileX,
    tileY: tileY,
    tileWidth: tileWidth,
    tileHeight: tileHeight
  };
};
var toVoid = function toVoid() {};
function eqSet(as, bs) {
  return as.size === bs.size && PileupTrack_all(isIn(bs), as);
}
function PileupTrack_all(pred, as) {
  var _iterator2 = PileupTrack_createForOfIteratorHelper(as),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var a = _step2.value;
      if (!pred(a)) return false;
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return true;
}
function isIn(as) {
  return function (a) {
    return as.has(a);
  };
}
var PileupTrack = function PileupTrack(HGC) {
  /**
     if (!new.target) {
       throw new Error(
         'Uncaught TypeError: Class constructor cannot be invoked without "new"',
       );
     }
    */
  var PileupTrackClass = /*#__PURE__*/function (_HGC$tracks$Tiled1DPi) {
    _inherits(PileupTrackClass, _HGC$tracks$Tiled1DPi);
    var _super = _createSuper(PileupTrackClass);
    function PileupTrackClass(context, options) {
      var _this;
      PileupTrack_classCallCheck(this, PileupTrackClass);
      var worker = spawn(BlobWorker.fromText(cjs_js_dist_worker));

      // this is where the threaded tile fetcher is called
      // We also need to pass the track options as some of them influence how the data needs to be loaded
      context.dataFetcher = new bam_fetcher(context.dataConfig, options, worker, HGC);
      _this = _super.call(this, context, options);
      context.dataFetcher.track = _assertThisInitialized(_this);

      // console.log(`${this.id} | options ${JSON.stringify(options)}`);

      _this.trackId = _this.id;
      _this.viewId = context.viewUid;
      _this.originalHeight = context.definition.height;
      _this.worker = worker;
      _this.isShowGlobalMousePosition = context.isShowGlobalMousePosition;
      _this.valueScaleTransform = HGC.libraries.d3Zoom.zoomIdentity;

      // this.optionsDict = {};
      // this.optionsDict[trackId] = options;

      // this.backgroundColor = (options.methylation) ? '#1c1c1cff' : (options.indexDHS) '#00000000';

      _this.maxTileWidthReached = false;
      _this.loadingText = new HGC.libraries.PIXI.Text('Loading', {
        fontSize: '12px',
        fontFamily: 'Arial',
        fill: 'grey'
      });
      _this.loadingText.x = 100;
      _this.loadingText.y = 100;
      _this.loadingText.anchor.x = 0;
      _this.loadingText.anchor.y = 0;
      if (_this.options.showLoadingText) {
        _this.pLabel.addChild(_this.loadingText);
      }
      _this.externalInit(options);

      // console.log(`setting up pileup-track: ${this.id}`);

      _this.bc = new BroadcastChannel("pileup-track-".concat(_this.id));
      _this.bc.postMessage({
        state: 'loading',
        msg: _this.loadingText.text,
        uid: _this.id
      });
      _this.monitor = new BroadcastChannel("pileup-track-viewer");
      _this.monitor.onmessage = function (event) {
        return _this.handlePileupTrackViewerMessage(event.data);
      };

      // this.handlePileupMessage = this.handlePileupTrackViewerMessage;
      return _this;
    }

    // Some of the initialization code is factored out, so that we can 
    // reset/reinitialize if an option change requires it
    PileupTrack_createClass(PileupTrackClass, [{
      key: "externalInit",
      value: function externalInit(options) {
        // we scale the entire view up until a certain point
        // at which point we redraw everything to get rid of
        // artifacts
        // this.drawnAtScale keeps track of the scale at which
        // we last rendered everything
        this.drawnAtScale = HGC.libraries.d3Scale.scaleLinear();
        this.prevRows = [];
        this.coverage = {};
        this.yScaleBands = {};

        // The bp distance for which the samples are chosen for the coverage.
        this.coverageSamplingDistance = 1;
        this.loadMates = areMatesRequired(this.options);
        // The following will be used to quickly find the mate when hovering over a read.
        // It will only be populated if this.loadMates==true to save memory
        this.readsById = {};
        this.previousTileIdsUsedForRendering = {};
        this.prevOptions = Object.assign({}, options);

        // graphics for highliting reads under the cursor
        this.mouseOverGraphics = new HGC.libraries.PIXI.Graphics();
        this.fetching = new Set();
        this.rendering = new Set();
        if (this.options.showMousePosition && !this.hideMousePosition) {
          this.hideMousePosition = HGC.utils.showMousePosition(this, this.is2d, this.isShowGlobalMousePosition());
        }
        this.clusterData = null;
        this.bed12ExportData = null;
        this.setUpShaderAndTextures(options);
      }
    }, {
      key: "initTile",
      value: function initTile() {}
    }, {
      key: "colorToArray",
      value: function colorToArray(color) {
        var rgb = HGC.libraries.d3Color.rgb(color);
        var array = [rgb.r / 255, rgb.g / 255, rgb.b / 255, rgb.opacity];
        return array;
      }
    }, {
      key: "colorArrayToString",
      value: function colorArrayToString(colorArray) {
        var r = Math.round(colorArray[0] * 255);
        var g = Math.round(colorArray[1] * 255);
        var b = Math.round(colorArray[2] * 255);
        var rgbaString = "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(colorArray[3], ")");
        var color = HGC.libraries.d3Color.color(rgbaString);
        return color.hex();
      }
    }, {
      key: "setUpShaderAndTextures",
      value: function setUpShaderAndTextures(options) {
        var _this2 = this;
        // console.log(`setUpShaderAndTextures`);

        // console.log(`setUpShaderAndTextures | ${this.id} | options ${JSON.stringify(options)}`);

        var colorDict = PILEUP_COLORS;
        if (options && options.colorScale && options.colorScale.length == 6) {
          var _options$colorScale$m = options.colorScale.map(function (x) {
            return _this2.colorToArray(x);
          });
          var _options$colorScale$m2 = _slicedToArray(_options$colorScale$m, 6);
          colorDict.A = _options$colorScale$m2[0];
          colorDict.T = _options$colorScale$m2[1];
          colorDict.G = _options$colorScale$m2[2];
          colorDict.C = _options$colorScale$m2[3];
          colorDict.N = _options$colorScale$m2[4];
          colorDict.X = _options$colorScale$m2[5];
        } else if (options && options.colorScale && options.colorScale.length == 11) {
          var _options$colorScale$m3 = options.colorScale.map(function (x) {
            return _this2.colorToArray(x);
          });
          var _options$colorScale$m4 = _slicedToArray(_options$colorScale$m3, 11);
          colorDict.A = _options$colorScale$m4[0];
          colorDict.T = _options$colorScale$m4[1];
          colorDict.G = _options$colorScale$m4[2];
          colorDict.C = _options$colorScale$m4[3];
          colorDict.N = _options$colorScale$m4[4];
          colorDict.X = _options$colorScale$m4[5];
          colorDict.LARGE_INSERT_SIZE = _options$colorScale$m4[6];
          colorDict.SMALL_INSERT_SIZE = _options$colorScale$m4[7];
          colorDict.LL = _options$colorScale$m4[8];
          colorDict.RR = _options$colorScale$m4[9];
          colorDict.RL = _options$colorScale$m4[10];
        } else if (options && options.colorScale) {
          console.error("colorScale must contain 6 or 11 entries. See https://github.com/higlass/higlass-pileup#options.");
        }

        // console.log(`this.options.methylationTagColor ${this.options.methylationTagColor}`);
        // if (this.options && this.options.methylationTagColor) {
        //   colorDict.MM = this.colorToArray(this.options.methylationTagColor);
        // }
        if (options && options.methylation && options.methylation.categories && options.methylation.colors) {
          options.methylation.categories.forEach(function (category, index) {
            if (category.unmodifiedBase === 'A' && category.code === 'a' && category.strand === '+') {
              colorDict.MM_M6A_FOR = _this2.colorToArray(options.methylation.colors[index]);
            } else if (category.unmodifiedBase === 'T' && category.code === 'a' && category.strand === '-') {
              colorDict.MM_M6A_REV = _this2.colorToArray(options.methylation.colors[index]);
            } else if (category.unmodifiedBase === 'C' && category.code === 'm' && category.strand === '+') {
              colorDict.MM_M5C_FOR = _this2.colorToArray(options.methylation.colors[index]);
            } else if (category.unmodifiedBase === 'G' && category.code === 'm' && category.strand === '-') {
              colorDict.MM_M5C_REV = _this2.colorToArray(options.methylation.colors[index]);
            }
          });
        }
        if (options && options.methylation && options.methylation.highlights) {
          var highlights = Object.keys(options.methylation.highlights);
          highlights.forEach(function (highlight) {
            colorDict["HIGHLIGHTS_".concat(highlight)] = _this2.colorToArray(options.methylation.highlights[highlight]);
          });
        }
        if (options && typeof options.plusStrandColor !== 'undefined') {
          colorDict.PLUS_STRAND = this.colorToArray(options.plusStrandColor);
        }
        if (options && typeof options.minusStrandColor !== 'undefined') {
          colorDict.MINUS_STRAND = this.colorToArray(options.minusStrandColor);
        }

        //
        // add Index DHS color table data, if available
        //
        if (options && options.indexDHS) {
          var indexDHSColorDict = indexDHSColors(options);
          colorDict = PileupTrack_objectSpread(PileupTrack_objectSpread({}, colorDict), indexDHSColorDict);
          if (options.indexDHS.backgroundColor) {
            // console.log(`[PileupTrack] options.indexDHS.backgroundColor ${options.indexDHS.backgroundColor}`);
            colorDict.INDEX_DHS_BG = this.colorToArray(options.indexDHS.backgroundColor);
          }
        }
        var colors = Object.values(colorDict);
        var _createColorTexture = createColorTexture(HGC.libraries.PIXI, colors),
          _createColorTexture2 = _slicedToArray(_createColorTexture, 2),
          colorMapTex = _createColorTexture2[0],
          colorMapTexRes = _createColorTexture2[1];
        var uniforms = new HGC.libraries.PIXI.UniformGroup({
          uColorMapTex: colorMapTex,
          uColorMapTexRes: colorMapTexRes
        });
        this.shader = HGC.libraries.PIXI.Shader.from("\n    attribute vec2 position;\n    attribute float aColorIdx;\n\n    uniform mat3 projectionMatrix;\n    uniform mat3 translationMatrix;\n\n    uniform sampler2D uColorMapTex;\n    uniform float uColorMapTexRes;\n\n    varying vec4 vColor;\n\n    void main(void)\n    {\n        // Half a texel (i.e., pixel in texture coordinates)\n        float eps = 0.5 / uColorMapTexRes;\n        float colorRowIndex = floor((aColorIdx + eps) / uColorMapTexRes);\n        vec2 colorTexIndex = vec2(\n          (aColorIdx / uColorMapTexRes) - colorRowIndex + eps,\n          (colorRowIndex / uColorMapTexRes) + eps\n        );\n        vColor = texture2D(uColorMapTex, colorTexIndex);\n\n        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);\n    }\n\n", "\nvarying vec4 vColor;\n\n    void main(void) {\n        gl_FragColor = vColor;\n    }\n", uniforms);
      }
    }, {
      key: "handlePileupTrackViewerMessage",
      value: function handlePileupTrackViewerMessage(data) {
        // console.log(`data ${JSON.stringify(data)} | ${JSON.stringify(this.options)}`);
        if (data.state === 'mouseover') {
          if (this.id !== data.uid) {
            this.clearMouseOver();
          }
        }
        if (data.state === 'request') {
          switch (data.msg) {
            case "refresh-layout":
              if (!this.options.methylation) break;
              // this.dataFetcher = new BAMDataFetcher(
              //   this.dataFetcher.dataConfig,
              //   this.options,
              //   this.worker,
              //   HGC,
              // );
              // this.dataFetcher.track = this;
              for (var key in this.prevRows) {
                var _iterator3 = PileupTrack_createForOfIteratorHelper(this.prevRows[key].rows),
                  _step3;
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    var row = _step3.value;
                    var _iterator4 = PileupTrack_createForOfIteratorHelper(row),
                      _step4;
                    try {
                      for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                        var segment = _step4.value;
                        // console.log(`rerender > segment.id ${segment.id} | ${Object.getOwnPropertyNames(segment)}`);
                        segment.methylationOffsets = [];
                      }
                    } catch (err) {
                      _iterator4.e(err);
                    } finally {
                      _iterator4.f();
                    }
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
              }
              this.prevRows = [];
              this.removeTiles(Object.keys(this.fetchedTiles));
              this.fetching.clear();
              this.refreshTiles();
              this.externalInit(this.options);
              // this.updateExistingGraphics();
              this.prevOptions = Object.assign({}, this.options);
              break;
            case "sorted-cluster-layout":
              if (!this.options.methylation || this.clusterData) break;
              this.dataFetcher = new bam_fetcher(this.dataFetcher.dataConfig, this.options, this.worker, HGC);
              this.dataFetcher.track = this;
              this.prevRows = [];
              this.removeTiles(Object.keys(this.fetchedTiles));
              this.fetching.clear();
              this.refreshTiles();
              this.externalInit(this.options);
              this.clusterData = null;
              this.updateExistingGraphics();
              this.prevOptions = Object.assign({}, this.options);
              break;
            case "cluster-layout":
              if (!this.options.methylation || this.clusterData) break;
              this.dataFetcher = new bam_fetcher(this.dataFetcher.dataConfig, this.options, this.worker, HGC);
              this.dataFetcher.track = this;
              this.prevRows = [];
              this.removeTiles(Object.keys(this.fetchedTiles));
              this.fetching.clear();
              this.refreshTiles();
              this.externalInit(this.options);
              this.clusterData = {
                range: data.range,
                distanceFn: data.distanceFn
              };
              this.updateExistingGraphics();
              this.prevOptions = Object.assign({}, this.options);
              break;
            case "bed12-layout":
              if (!this.options.methylation) break;
              var bed12Name = "".concat(this.options.methylation.group, "/").concat(this.options.methylation.set);
              var bed12Colors = this.options.methylation.colors;
              this.bed12ExportData = {
                range: data.range,
                distanceFn: data.distanceFn,
                uid: this.id,
                name: bed12Name,
                colors: bed12Colors
              };
              this.exportBED12Layout();
              break;
            default:
              break;
          }
        }
      }
    }, {
      key: "rerender",
      value: function rerender(options) {
        _get(_getPrototypeOf(PileupTrackClass.prototype), "rerender", this).call(this, options);
        this.options = options;
        if (this.options.showMousePosition && !this.hideMousePosition) {
          this.hideMousePosition = HGC.utils.showMousePosition(this, this.is2d, this.isShowGlobalMousePosition());
        }
        if (!this.options.showMousePosition && this.hideMousePosition) {
          this.hideMousePosition();
          this.hideMousePosition = undefined;
        }
        this.setUpShaderAndTextures(options);
        // Reset the following, so the graphic actually updates
        this.previousTileIdsUsedForRendering = {};

        // Reset everything and overwrite the datafetcher if the data needs to be loaded differently,
        // we need to realign or we need to recolor. Expensive, but only happens if options change.
        if (areMatesRequired(options) !== this.loadMates || JSON.stringify(this.prevOptions.highlightReadsBy) !== JSON.stringify(options.highlightReadsBy) || this.prevOptions.largeInsertSizeThreshold !== options.largeInsertSizeThreshold || this.prevOptions.smallInsertSizeThreshold !== options.smallInsertSizeThreshold || this.prevOptions.minMappingQuality !== options.minMappingQuality) {
          this.dataFetcher = new bam_fetcher(this.dataFetcher.dataConfig, options, this.worker, HGC);
          this.dataFetcher.track = this;
          this.prevRows = [];
          this.removeTiles(Object.keys(this.fetchedTiles));
          this.fetching.clear();
          this.refreshTiles();
          this.externalInit(options);
        }
        this.updateExistingGraphics();
        this.prevOptions = Object.assign({}, options);
      }
    }, {
      key: "exportBED12Layout",
      value: function exportBED12Layout() {
        var _this3 = this;
        // console.log(`exportBED12Layout called`);
        this.bc.postMessage({
          state: 'export_bed12_start',
          msg: 'Begin BED12 export worker processing',
          uid: this.id
        });
        this.worker.then(function (tileFunctions) {
          tileFunctions.exportSegmentsAsBED12(_this3.dataFetcher.uid, Object.values(_this3.fetchedTiles).map(function (x) {
            return x.remoteId;
          }), _this3._xScale.domain(), _this3._xScale.range(), _this3.position, _this3.dimensions, _this3.prevRows, _this3.options, _this3.bed12ExportData).then(function (toExport) {
            // console.log(`toExport ${JSON.stringify(toExport)}`);

            if (_this3.clusterData) {
              _this3.clusterData = null;
            }
            if (_this3.bed12ExportData) {
              _this3.bed12ExportData = null;
            }
            _this3.bc.postMessage({
              state: 'export_bed12_end',
              msg: 'Completed (exportBED12Layout Promise fulfillment)',
              uid: _this3.id,
              data: toExport
            });
          });
        });
      }
    }, {
      key: "updateExistingGraphics",
      value: function updateExistingGraphics() {
        var _this4 = this;
        var updateExistingGraphicsStart = performance.now();
        if (!this.maxTileWidthReached) {
          this.loadingText.text = 'Rendering...';
          this.bc.postMessage({
            state: 'update_start',
            msg: this.loadingText.text,
            uid: this.id
          });
        } else {
          this.worker.then(function (tileFunctions) {
            tileFunctions.renderSegments(_this4.dataFetcher.uid, Object.values(_this4.fetchedTiles).map(function (x) {
              return x.remoteId;
            }), _this4._xScale.domain(), _this4._xScale.range(), _this4.position, _this4.dimensions, _this4.prevRows, _this4.options, _this4.clusterData).then(function (toRender) {
              // console.log(`toRender (maxTileWidthReached) ${JSON.stringify(toRender)}`);
              if (_this4.segmentGraphics) {
                _this4.pMain.removeChild(_this4.segmentGraphics);
              }
              _this4.draw();
              _this4.animate();
              var updateExistingGraphicsEndA = performance.now();
              var elapsedTimeA = updateExistingGraphicsEndA - updateExistingGraphicsStart;
              var msg = {
                state: 'update_end',
                msg: 'Completed (maxTileWidthReached)',
                uid: _this4.id,
                elapsedTime: elapsedTimeA
              };
              // console.log(`${JSON.stringify(msg)}`);
              _this4.bc.postMessage(msg);
            });
          });
          return;
        }
        var fetchedTileIds = new Set(Object.keys(this.fetchedTiles));
        if (!eqSet(this.visibleTileIds, fetchedTileIds)) {
          this.updateLoadingText();
          return;
        }

        // Prevent multiple renderings with the same tiles. This can happen when multiple new tiles come in at once
        if (eqSet(this.previousTileIdsUsedForRendering, fetchedTileIds)) {
          return;
        }
        this.previousTileIdsUsedForRendering = fetchedTileIds;
        var fetchedTileKeys = Object.keys(this.fetchedTiles);
        for (var _i = 0, _fetchedTileKeys = fetchedTileKeys; _i < _fetchedTileKeys.length; _i++) {
          var fetchedTileKey = _fetchedTileKeys[_i];
          this.fetching["delete"](fetchedTileKey);
          this.rendering.add(fetchedTileKey);
        }
        // fetchedTileKeys.forEach((x) => {
        //   this.fetching.delete(x);
        //   this.rendering.add(x);
        // });

        this.updateLoadingText();
        this.worker.then(function (tileFunctions) {
          tileFunctions.renderSegments(_this4.dataFetcher.uid, Object.values(_this4.fetchedTiles).map(function (x) {
            return x.remoteId;
          }), _this4._xScale.domain(), _this4._xScale.range(), _this4.position, _this4.dimensions, _this4.prevRows, _this4.options, _this4.clusterData).then(function (toRender) {
            // console.log(`toRender.tileIds ${JSON.stringify(toRender.tileIds)}`);

            _this4.loadingText.visible = false;
            for (var _i2 = 0, _fetchedTileKeys2 = fetchedTileKeys; _i2 < _fetchedTileKeys2.length; _i2++) {
              var _fetchedTileKey = _fetchedTileKeys2[_i2];
              _this4.rendering["delete"](_fetchedTileKey);
            }
            // fetchedTileKeys.forEach((x) => {
            //   this.rendering.delete(x);
            // });

            _this4.updateLoadingText();
            if (_this4.maxTileWidthReached) {
              // if (
              //   this.segmentGraphics &&
              //   this.options.collapseWhenMaxTileWidthReached
              // ) {
              //   this.pMain.removeChild(this.segmentGraphics);
              // }
              if (_this4.segmentGraphics) {
                _this4.segmentGraphics.clear();
                _this4.pMain.removeChild(_this4.segmentGraphics);
                _this4.pBorder.clear();
              }
              if (_this4.mouseOverGraphics) {
                requestAnimationFrame(_this4.animate);
                _this4.mouseOverGraphics.clear();
                _this4.pMain.removeChild(_this4.mouseOverGraphics);
                _this4.pBorder.clear();
              }
              _this4.loadingText.visible = false;
              _this4.draw();
              _this4.animate();
              requestAnimationFrame(_this4.animate);
              var updateExistingGraphicsEndB = performance.now();
              var elapsedTimeB = updateExistingGraphicsEndB - updateExistingGraphicsStart;
              var _msg = {
                state: 'update_end',
                msg: 'Completed (maxTileWidthReached)',
                uid: _this4.id,
                elapsedTime: elapsedTimeB
              };
              // console.log(`${JSON.stringify(msg)}`);
              _this4.bc.postMessage(_msg);
              return;
            }
            _this4.errorTextText = null;
            _this4.pBorder.clear();
            _this4.drawError();
            _this4.animate();
            _this4.positions = new Float32Array(toRender.positionsBuffer);
            _this4.colors = new Float32Array(toRender.colorsBuffer);
            _this4.ixs = new Int32Array(toRender.ixBuffer);
            var newGraphics = new HGC.libraries.PIXI.Graphics();
            _this4.prevRows = toRender.rows;
            _this4.coverage = toRender.coverage;
            _this4.coverageSamplingDistance = toRender.coverageSamplingDistance;
            if (_this4.loadMates) {
              _this4.readsById = {};
              for (var key in _this4.prevRows) {
                var _iterator5 = PileupTrack_createForOfIteratorHelper(_this4.prevRows[key].rows),
                  _step5;
                try {
                  for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                    var row = _step5.value;
                    var _iterator6 = PileupTrack_createForOfIteratorHelper(row),
                      _step6;
                    try {
                      for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                        var segment = _step6.value;
                        if (segment.id in _this4.readsById) return;
                        _this4.readsById[segment.id] = segment;
                        _this4.readsById[segment.id]['groupKey'] = key;
                      }
                    } catch (err) {
                      _iterator6.e(err);
                    } finally {
                      _iterator6.f();
                    }
                  }
                  // this.prevRows[key].rows.forEach((row) => {
                  //   row.forEach((segment) => {
                  //     if (segment.id in this.readsById) return;
                  //     this.readsById[segment.id] = segment;
                  //     // Will be needed later in the mouseover to determine the correct yPos for the mate
                  //     this.readsById[segment.id]['groupKey'] = key;
                  //   });
                  // });
                } catch (err) {
                  _iterator5.e(err);
                } finally {
                  _iterator5.f();
                }
              }
            }
            var geometry = new HGC.libraries.PIXI.Geometry().addAttribute('position', _this4.positions, 2); // x,y
            geometry.addAttribute('aColorIdx', _this4.colors, 1);
            geometry.addIndex(_this4.ixs);
            if (_this4.positions.length) {
              var state = new HGC.libraries.PIXI.State();
              var mesh = new HGC.libraries.PIXI.Mesh(geometry, _this4.shader, state);
              newGraphics.addChild(mesh);
            }
            _this4.pMain.x = _this4.position[0];
            if (_this4.segmentGraphics) {
              _this4.pMain.removeChild(_this4.segmentGraphics);
            }
            _this4.pMain.addChild(newGraphics);
            _this4.segmentGraphics = newGraphics;

            // remove and add again to place on top
            _this4.pMain.removeChild(_this4.mouseOverGraphics);
            _this4.pMain.addChild(_this4.mouseOverGraphics);
            _this4.yScaleBands = {};
            for (var _key2 in _this4.prevRows) {
              _this4.yScaleBands[_key2] = HGC.libraries.d3Scale.scaleBand().domain(HGC.libraries.d3Array.range(0, _this4.prevRows[_key2].rows.length)).range([_this4.prevRows[_key2].start, _this4.prevRows[_key2].end]).paddingInner(0.2);
            }
            _this4.drawnAtScale = HGC.libraries.d3Scale.scaleLinear().domain(toRender.xScaleDomain).range(toRender.xScaleRange);
            scaleScalableGraphics(_this4.segmentGraphics, _this4._xScale, _this4.drawnAtScale);

            // if somebody zoomed vertically, we want to readjust so that
            // they're still zoomed in vertically
            _this4.segmentGraphics.scale.y = _this4.valueScaleTransform.k;
            _this4.segmentGraphics.position.y = _this4.valueScaleTransform.y;
            _this4.draw();
            _this4.animate();
            if (_this4.clusterData) {
              _this4.clusterData = null;
            }
            if (_this4.bed12ExportData) {
              _this4.bed12ExportData = null;
            }
            var updateExistingGraphicsEndC = performance.now();
            var elapsedTimeC = updateExistingGraphicsEndC - updateExistingGraphicsStart;
            var msg = {
              state: 'update_end',
              msg: 'Completed (renderSegments Promise fulfillment)',
              uid: _this4.id,
              elapsedTime: elapsedTimeC
            };
            // console.log(`${JSON.stringify(msg)}`);
            _this4.bc.postMessage(msg);
          });
          // .catch(err => {
          //   // console.log('err:', err);
          //   // console.log('err:', err.message);
          //   this.errorTextText = err.message;

          //   // console.log('errorTextText:', this.errorTextText);
          //   // this.draw();
          //   // this.animate();
          //   this.drawError();
          //   this.animate();

          //   // console.log('this.pBorder:', this.pBorder);
          // });
        });
      }
    }, {
      key: "updateLoadingText",
      value: function updateLoadingText() {
        this.loadingText.visible = true;
        this.loadingText.text = '';
        if (this.maxTileWidthReached) return;
        if (!this.tilesetInfo) {
          this.loadingText.text = 'Fetching tileset info...';
          this.bc.postMessage({
            state: 'fetching_tileset_info',
            msg: this.loadingText.text,
            uid: this.id
          });
          return;
        }
        if (this.fetching.size) {
          this.loadingText.text = "Fetching... ".concat(PileupTrack_toConsumableArray(this.fetching).map(function (x) {
            return x.split('|')[0];
          }).join(' '));
          this.bc.postMessage({
            state: 'fetching',
            msg: this.loadingText.text,
            uid: this.id
          });
        }
        if (this.rendering.size) {
          this.loadingText.text = "Rendering... ".concat(PileupTrack_toConsumableArray(this.rendering).join(' '));
          this.bc.postMessage({
            state: 'rendering',
            msg: this.loadingText.text,
            uid: this.id
          });
        }
        if (!this.fetching.size && !this.rendering.size && this.tilesetInfo) {
          this.loadingText.visible = false;
          // this.bc.postMessage({state: 'update_end', msg: 'Completed',  uid: this.id});
        }
      }
    }, {
      key: "draw",
      value: function draw() {
        // const valueScale = HGC.libraries.d3Scale
        //   .scaleLinear()
        //   .domain([0, this.prevRows.length])
        //   .range([0, this.dimensions[1]]);
        // HGC.utils.trackUtils.drawAxis(this, valueScale);
        this.trackNotFoundText.text = 'Track not found';
        this.trackNotFoundText.visible = true;
      }
    }, {
      key: "indexDHSElementCategory",
      value: function indexDHSElementCategory(colormap, rgb) {
        return "<div style=\"display:inline-block; position:relative; top:-2px;\">\n        <svg width=\"10\" height=\"10\">\n          <rect width=\"10\" height=\"10\" rx=\"2\" ry=\"2\" style=\"fill:rgb(".concat(rgb, ");stroke:black;stroke-width:2;\" />\n        </svg>\n        <span style=\"position:relative; top:1px; font-weight:600;\">").concat(colormap[rgb], "</span>\n      </div>");
      }
    }, {
      key: "indexDHSElementCartoon",
      value: function indexDHSElementCartoon(elementStart, elementEnd, rgb, subs, summitStart, summitEnd, elementId) {
        var elementCartoon = '';
        var elementCartoonWidth = 200;
        var elementCartoonGeneHeight = 30;
        var elementCartoonHeight = elementCartoonGeneHeight + 10;
        var elementCartoonMiddle = elementCartoonHeight / 2;
        function pos2pixel(pos) {
          return (pos - elementStart) / ((elementEnd - elementStart) * 1.0) * elementCartoonWidth;
        }
        var blockCount = 0;
        var blockStarts = [];
        var blockSizes = [];
        var _iterator7 = PileupTrack_createForOfIteratorHelper(subs),
          _step7;
        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var sub = _step7.value;
            if (sub.type === 'M') {
              blockCount++;
              blockStarts.push(sub.pos);
              blockSizes.push(sub.length);
            }
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
        if (blockCount > 0) {
          elementCartoon += "<svg width=\"".concat(elementCartoonWidth, "\" height=\"").concat(elementCartoonHeight, "\">\n          <style type=\"text/css\">\n            .ticks {stroke:rgb(").concat(rgb, ");stroke-width:1px;fill:none;}\n            .gene {stroke:rgb(").concat(rgb, ");stroke-width:1px;fill:none;}\n            .translate { fill:rgb(").concat(rgb, ");fill-opacity:1;}\n            .exon { fill:rgb(").concat(rgb, ");fill-opacity:1;}\n            .score { fill:rgb(").concat(rgb, ");fill-opacity:1;font:bold 12px sans-serif;}\n            .id { fill:rgb(").concat(rgb, ");fill-opacity:1;font:bold 12px sans-serif;}\n          </style>\n          <defs>\n            <path id=\"ft\" class=\"ticks\" d=\"m -3 -3  l 3 3  l -3 3\" />\n            <path id=\"rt\" class=\"ticks\" d=\"m 3 -3  l -3 3  l 3 3\" />\n          </defs>\n        ");
          var isElementBarPlotLike = true;
          var ecStart = pos2pixel(elementStart);
          var ecEnd = pos2pixel(elementEnd);
          elementCartoon += "<line class=\"gene\" x1=".concat(ecStart, " x2=").concat(ecEnd, " y1=").concat(elementCartoonMiddle, " y2=").concat(elementCartoonMiddle, " />");
          var ecThickStart = pos2pixel(summitStart);
          var ecThickEnd = pos2pixel(summitEnd);
          var ecThickY = elementCartoonMiddle - elementCartoonGeneHeight / 4;
          var ecThickHeight = elementCartoonGeneHeight / 2;
          var ecThickWidth = ecThickEnd - ecThickStart;
          if (isElementBarPlotLike) {
            ecThickWidth = ecThickWidth !== 1 ? 1 : ecThickWidth;
          }
          var realIdTextAnchor = '';
          if (ecThickStart < 0.15 * elementCartoonWidth) {
            realIdTextAnchor = 'start';
          } else if (ecThickStart >= 0.15 * elementCartoonWidth && ecThickStart <= 0.85 * elementCartoonWidth) {
            realIdTextAnchor = 'middle';
          } else {
            realIdTextAnchor = 'end';
          }
          elementCartoon += "<rect class=\"translate\" x=".concat(ecThickStart, " y=").concat(ecThickY, " width=").concat(ecThickWidth, " height=").concat(ecThickHeight, " />");
          var ecLabelDy = '-0.25em';
          elementCartoon += "<text class=\"id\" text-anchor=\"".concat(realIdTextAnchor, "\" x=").concat(ecThickStart, " y=").concat(ecThickY, " dy=").concat(ecLabelDy, ">").concat(elementId, "</text>");
          var ecExonStart = 0;
          var ecExonWidth = 0;
          var ecExonY = elementCartoonMiddle - elementCartoonGeneHeight / 8;
          var ecExonHeight = elementCartoonGeneHeight / 4;
          for (var i = 0; i < blockCount; i++) {
            ecExonStart = pos2pixel(elementStart + +blockStarts[i]);
            ecExonWidth = pos2pixel(elementStart + +blockSizes[i]);
            elementCartoon += "<rect class=\"exon\" x=".concat(ecExonStart, " y=").concat(ecExonY, " width=").concat(ecExonWidth, " height=").concat(ecExonHeight, " />");
          }
          // add whiskers separately
          if (isElementBarPlotLike) {
            // leftmost whisker
            ecExonStart = ecStart;
            ecExonWidth = ecStart + 1;
            elementCartoon += "<rect class=\"exon\" x=".concat(ecExonStart, " y=").concat(ecExonY, " width=").concat(ecExonWidth, " height=").concat(ecExonHeight, " />");
            // rightmost whisker
            ecExonStart = ecEnd - 1;
            ecExonWidth = ecEnd;
            elementCartoon += "<rect class=\"exon\" x=".concat(ecExonStart, " y=").concat(ecExonY, " width=").concat(ecExonWidth, " height=").concat(ecExonHeight, " />");
          }
          elementCartoon += '</svg>';
        }
        return elementCartoon;
      }
    }, {
      key: "clearMouseOver",
      value: function clearMouseOver() {
        this.mouseOverGraphics.clear();
        requestAnimationFrame(this.animate);
      }
    }, {
      key: "getMouseOverHtml",
      value: function getMouseOverHtml(trackX, trackYIn) {
        if (this.maxTileWidthReached) return;

        // const trackY = this.valueScaleTransform.invert(track)
        this.mouseOverGraphics.clear();
        // Prevents 'stuck' read outlines when hovering quickly
        requestAnimationFrame(this.animate);
        var msg = {
          state: 'mouseover',
          msg: 'mouseover event',
          uid: this.id
        };
        this.monitor.postMessage(msg);
        var trackY = invY(trackYIn, this.valueScaleTransform);
        var bandCoverageStart = 0;
        var bandCoverageEnd = Number.MAX_SAFE_INTEGER;
        if (this.yScaleBands) {
          for (var _i3 = 0, _Object$keys = Object.keys(this.yScaleBands); _i3 < _Object$keys.length; _i3++) {
            var key = _Object$keys[_i3];
            var yScaleBand = this.yScaleBands[key];
            var _yScaleBand$range = yScaleBand.range(),
              _yScaleBand$range2 = _slicedToArray(_yScaleBand$range, 2),
              start = _yScaleBand$range2[0],
              end = _yScaleBand$range2[1];
            bandCoverageEnd = Math.min(start, bandCoverageEnd);
            if (start <= trackY && trackY <= end) {
              var eachBand = yScaleBand.step();
              var index = Math.floor((trackY - start) / eachBand);
              var rows = this.prevRows[key].rows;
              if (index >= 0 && index < rows.length) {
                var row = rows[index];
                var _iterator8 = PileupTrack_createForOfIteratorHelper(row),
                  _step8;
                try {
                  for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                    var read = _step8.value;
                    var readTrackFrom = this._xScale(read.from);
                    var readTrackTo = this._xScale(read.to);
                    if (readTrackFrom <= trackX && trackX <= readTrackTo) {
                      var xPos = this._xScale(read.from);
                      var yPos = transformY(yScaleBand(index), this.valueScaleTransform);
                      var MAX_DIST = 10;
                      var nearestDistance = this._xScale.invert(MAX_DIST) - this._xScale.invert(0);
                      var mousePos = this._xScale.invert(trackX);
                      // find the nearest substitution (or indel)
                      var nearestSub = findNearestSub(mousePos, read, nearestDistance);
                      if (this.options.outlineReadOnHover) {
                        var width = this._xScale(read.to) - this._xScale(read.from);
                        var height = yScaleBand.bandwidth() * this.valueScaleTransform.k;
                        this.mouseOverGraphics.lineStyle({
                          width: 1,
                          color: 0
                        });
                        this.mouseOverGraphics.drawRect(xPos, yPos, width, height);
                        this.animate();
                      }
                      if (this.options.outlineMateOnHover) {
                        this.outlineMate(read, yScaleBand);
                      }
                      var insertSizeHtml = this.getInsertSizeMouseoverHtml(read);
                      var chimericReadHtml = read.mate_ids.length > 1 ? "<span style=\"color:red;\">Chimeric alignment</span><br>" : "";
                      var mappingOrientationHtml = "";
                      if (read.mappingOrientation) {
                        var style = "";
                        if (read.colorOverride) {
                          var color = Object.keys(PILEUP_COLORS)[read.colorOverride];
                          var htmlColor = this.colorArrayToString(PILEUP_COLORS[color]);
                          style = "style=\"color:".concat(htmlColor, ";\"");
                        }
                        mappingOrientationHtml = "<span ".concat(style, "> Mapping orientation: ").concat(read.mappingOrientation, "</span><br>");
                      }

                      // let mouseOverHtml =
                      //   `Name: ${read.readName}<br>` +
                      //   `Position: ${read.chrName}:${
                      //     read.from - read.chrOffset
                      //   }<br>` +
                      //   `Read length: ${read.to - read.from}<br>` +
                      //   `MAPQ: ${read.mapq}<br>` +
                      //   `Strand: ${read.strand}<br>` +
                      //   insertSizeHtml +
                      //   chimericReadHtml +
                      //   mappingOrientationHtml;

                      // if (nearestSub && nearestSub.type) {
                      //   mouseOverHtml += `Nearest operation: ${cigarTypeToText(
                      //     nearestSub.type,
                      //   )} (${nearestSub.length})`;
                      // } else if (nearestSub && nearestSub.variant) {
                      //   mouseOverHtml += `Nearest operation: ${nearestSub.base} &rarr; ${nearestSub.variant}`;
                      // }

                      var dataX = this._xScale.invert(trackX);
                      var positionText = null;
                      var eventText = null;
                      var eventProbability = null;
                      if (this.options.chromInfo) {
                        var atcX = HGC.utils.absToChr(dataX, this.options.chromInfo);
                        var chrom = atcX[0];
                        var position = Math.ceil(atcX[1]);
                        positionText = "".concat(chrom, ":").concat(position);
                        var methylationOffset = position - (read.from - read.chrOffset);
                        var _iterator9 = PileupTrack_createForOfIteratorHelper(read.methylationOffsets),
                          _step9;
                        try {
                          for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                            var mo = _step9.value;
                            var moQuery = mo.offsets.indexOf(methylationOffset);
                            if (moQuery !== -1) {
                              // console.log(`mo @ ${methylationOffset} ${moQuery} | ${mo.unmodifiedBase} ${mo.strand} ${mo.probabilities[moQuery]}`);
                              eventText = mo.unmodifiedBase === 'A' || mo.unmodifiedBase === 'T' ? 'm6A' : '5mC';
                              eventProbability = parseInt(mo.probabilities[moQuery]);
                              if (eventProbability < this.options.methylation.probabilityThresholdRange[0]) {
                                eventProbability = null;
                              }
                              break;
                            }
                          }
                        } catch (err) {
                          _iterator9.e(err);
                        } finally {
                          _iterator9.f();
                        }
                      }
                      var output = "<div class=\"track-mouseover-menu-table\">";
                      if (positionText) {
                        output += "\n                    <div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"position\" class=\"track-mouseover-menu-table-item-label\">Position</label>\n                      <div name=\"position\" class=\"track-mouseover-menu-table-item-value\">".concat(positionText, "</div>\n                    </div>\n                    ");
                      }
                      if (eventText && eventProbability) {
                        output += "\n                    <div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"eventType\" class=\"track-mouseover-menu-table-item-label\">Event</label>\n                      <div name=\"eventType\" class=\"track-mouseover-menu-table-item-value\">".concat(eventText, "</div>\n                    </div>\n                    <div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"eventProbability\" class=\"track-mouseover-menu-table-item-label\">Probability (ML)</label>\n                      <div name=\"eventProbability\" class=\"track-mouseover-menu-table-item-value\">").concat(eventProbability, "</div>\n                    </div>\n                    ");
                      }

                      // let cellLineText = null;
                      // if (this.options.methylation && this.options.methylation.group && this.options.methylation.set) {
                      //   groupText = `${this.options.methylation.group}/${this.options.methylation.set}`;
                      //   if (this.options.methylation.haplotype) {
                      //     groupText += ` (${this.options.methylation.haplotype})`;
                      //   }
                      // }

                      // let cellLineText = null;
                      // if (this.options.methylation && this.options.methylation.group) {
                      //   cellLineText = `${this.options.methylation.group}`;
                      // }

                      // if (cellLineText) {
                      //   output += `
                      //   <div class="track-mouseover-menu-table-item">
                      //     <label for="cell_line" class="track-mouseover-menu-table-item-label">Cell line</label>
                      //     <div name="cell_line" class="track-mouseover-menu-table-item-value">${cellLineText}</div>
                      //   </div>
                      //   `;
                      // }

                      // let conditionText = null;
                      // if (this.options.methylation && this.options.methylation.set) {
                      //   conditionText = `${this.options.methylation.set}`;
                      // }

                      // if (conditionText) {
                      //   output += `
                      //   <div class="track-mouseover-menu-table-item">
                      //     <label for="condition" class="track-mouseover-menu-table-item-label">Condition</label>
                      //     <div name="condition" class="track-mouseover-menu-table-item-value">${conditionText}</div>
                      //   </div>
                      //   `;
                      // }

                      // let donorText = null;
                      // if (this.options.methylation && this.options.methylation.donor) {
                      //   donorText = `${this.options.methylation.donor}`;
                      // }

                      // if (donorText) {
                      //   output += `
                      //   <div class="track-mouseover-menu-table-item">
                      //     <label for="donor" class="track-mouseover-menu-table-item-label">Donor</label>
                      //     <div name="donor" class="track-mouseover-menu-table-item-value">${donorText}</div>
                      //   </div>
                      //   `;
                      // }

                      // let haplotypeText = null;
                      // if (this.options.methylation && this.options.methylation.haplotype) {
                      //   haplotypeText = `${this.options.methylation.haplotype}`;
                      // }

                      // if (haplotypeText) {
                      //   output += `
                      //   <div class="track-mouseover-menu-table-item">
                      //     <label for="haplotype" class="track-mouseover-menu-table-item-label">Haplotype</label>
                      //     <div name="haplotype" class="track-mouseover-menu-table-item-value">${haplotypeText}</div>
                      //   </div>
                      //   `;
                      // }

                      if (this.options.indexDHS) {
                        var readNameLabel = 'Index DHS';
                        var readNameValue = "".concat(read.readName, " | ").concat(this.options.name);
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readName\" class=\"track-mouseover-menu-table-item-label\">".concat(readNameLabel, "</label>\n                      <div name=\"readName\" class=\"track-mouseover-menu-table-item-value\">").concat(readNameValue, "</div>\n                    </div>");
                      } else {
                        var _readNameLabel = 'Name';
                        var _readNameValue = read.readName;
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readName\" class=\"track-mouseover-menu-table-item-label\">".concat(_readNameLabel, "</label>\n                      <div name=\"readName\" class=\"track-mouseover-menu-table-item-value\">").concat(_readNameValue, "</div>\n                    </div>");
                      }
                      var readIntervalLabel = this.options.methylation ? 'Interval' : this.options.indexDHS ? 'Range' : 'Interval';
                      var readIntervalValue = "".concat(read.chrName, ":").concat(read.from - read.chrOffset, "-").concat(read.to - read.chrOffset - 1);
                      readIntervalValue += this.options.methylation ? " (".concat(read.strand, ")") : '';
                      output += "<div class=\"track-mouseover-menu-table-item\">\n                    <label for=\"readInterval\" class=\"track-mouseover-menu-table-item-label\">".concat(readIntervalLabel, "</label>\n                    <div name=\"readInterval\" class=\"track-mouseover-menu-table-item-value\">").concat(readIntervalValue, "</div>\n                  </div>");
                      if (this.options.methylation) {
                        var readLength = "".concat(read.to - read.from);
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readLength\" class=\"track-mouseover-menu-table-item-label\">Length</label>\n                      <div name=\"readLength\" class=\"track-mouseover-menu-table-item-value\">".concat(readLength, "</div>\n                    </div>");
                      }
                      if (this.options.indexDHS) {
                        var metadata = read.metadata;
                        // const realId = metadata.dhs.id;
                        var elementSummit = "".concat(read.chrName, ":").concat(parseInt(metadata.summit.start + (metadata.summit.end - metadata.summit.start) / 2));
                        var elementScorePrecision = 4;
                        var elementScore = Number.parseFloat(metadata.dhs.score).toPrecision(elementScorePrecision);
                        var elementBiosampleCount = Number.parseInt(metadata.dhs.n);
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readSummit\" class=\"track-mouseover-menu-table-item-label\">Summit</label>\n                      <div name=\"readSummit\" class=\"track-mouseover-menu-table-item-value\">".concat(elementSummit, "</div>\n                    </div>");
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readScore\" class=\"track-mouseover-menu-table-item-label\">Score</label>\n                      <div name=\"readScore\" class=\"track-mouseover-menu-table-item-value\">".concat(elementScore, "</div>\n                    </div>");
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readCategory\" class=\"track-mouseover-menu-table-item-label\">Category</label>\n                      <div name=\"readCategory\" class=\"track-mouseover-menu-table-item-value\">".concat(this.indexDHSElementCategory(this.options.indexDHS.itemRGBMap, metadata.rgb), "</div>\n                    </div>");
                        var indexDHSStart = read.from - read.chrOffset;
                        var indexDHSEnd = read.to - read.chrOffset - 1;
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readStructure\" class=\"track-mouseover-menu-table-item-label\">Structure</label>\n                      <div name=\"readStructure\" class=\"track-mouseover-menu-table-item-value track-mouseover-menu-table-item-value-svg\">".concat(this.indexDHSElementCartoon(indexDHSStart, indexDHSEnd, metadata.rgb, read.substitutions, metadata.summit.start, metadata.summit.end, metadata.dhs.id), "</div>\n                    </div>");
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readSamples\" class=\"track-mouseover-menu-table-item-label\">Samples</label>\n                      <div name=\"readSamples\" class=\"track-mouseover-menu-table-item-value\">Found in <span style=\"font-weight: 900; padding-left:5px; padding-right:5px;\">".concat(elementBiosampleCount, "</span> / ").concat(this.options.indexDHS.biosampleCount, " biosamples</div>\n                    </div>");
                      }

                      // if (nearestSub && nearestSub.type) {
                      //   const readNearestOp = `${nearestSub.length}${cigarTypeToText(nearestSub.type)}`;
                      //   output += `<div class="track-mouseover-menu-table-item">
                      //     <label for="readNearestOp" class="track-mouseover-menu-table-item-label">Nearest op</label>
                      //     <div name="readNearestOp" class="track-mouseover-menu-table-item-value">${readNearestOp}</div>
                      //   </div>`;
                      // }
                      // else if (nearestSub && nearestSub.variant) {
                      //   const readNearestOp = `${nearestSub.length} (${nearestSub.variant})`;
                      //   output += `<div class="track-mouseover-menu-table-item">
                      //     <label for="readNearestOp" class="track-mouseover-menu-table-item-label">Nearest op</label>
                      //     <div name="readNearestOp" class="track-mouseover-menu-table-item-value">${readNearestOp}</div>
                      //   </div>`;
                      // }

                      output += "</div>";
                      return output;
                      // + `CIGAR: ${read.cigar || ''} MD: ${read.md || ''}`);
                    }
                  }
                } catch (err) {
                  _iterator8.e(err);
                } finally {
                  _iterator8.f();
                }
              }
            }
          }

          // var val = self.yScale.domain()[index];
          if (this.options.showCoverage && bandCoverageStart <= trackY && trackY <= bandCoverageEnd) {
            var _mousePos = this._xScale.invert(trackX);
            var bpIndex = Math.floor(_mousePos);
            bpIndex = bpIndex - bpIndex % this.coverageSamplingDistance;
            if (this.coverage[bpIndex]) {
              var readCount = this.coverage[bpIndex];
              var matchPercent = readCount.matches / readCount.reads * 100;
              var range = readCount.range.includes('-') ? "Range: ".concat(readCount.range, "<br>") : "Position: ".concat(readCount.range, "<br>");
              var mouseOverHtml = "Reads: ".concat(readCount.reads, "<br>") + "Matches: ".concat(readCount.matches, " (").concat(matchPercent.toFixed(2), "%)<br>") + range;
              for (var _i4 = 0, _Object$keys2 = Object.keys(readCount.variants); _i4 < _Object$keys2.length; _i4++) {
                var variant = _Object$keys2[_i4];
                if (readCount.variants[variant] > 0) {
                  var variantPercent = readCount.variants[variant] / readCount.reads * 100;
                  mouseOverHtml += "".concat(variant, ": ").concat(readCount.variants[variant], " (").concat(variantPercent.toFixed(2), "%)<br>");
                }
              }
              return mouseOverHtml;
            }
          }
        }
        return '';
      }
    }, {
      key: "getInsertSizeMouseoverHtml",
      value: function getInsertSizeMouseoverHtml(read) {
        var insertSizeHtml = "";
        if (this.options.highlightReadsBy.includes('insertSize') || this.options.highlightReadsBy.includes('insertSizeAndPairOrientation')) {
          if (read.mate_ids.length === 1 && read.mate_ids[0] && read.mate_ids[0] in this.readsById) {
            var mate = this.readsById[read.mate_ids[0]];
            var insertSize = calculateInsertSize(read, mate);
            var style = "";
            if ('largeInsertSizeThreshold' in this.options && insertSize > this.options.largeInsertSizeThreshold || 'smallInsertSizeThreshold' in this.options && insertSize < this.options.smallInsertSizeThreshold) {
              var color = Object.keys(PILEUP_COLORS)[read.colorOverride || read.color];
              var htmlColor = this.colorArrayToString(PILEUP_COLORS[color]);
              style = "style=\"color:".concat(htmlColor, ";\"");
            }
            insertSizeHtml = "Insert size: <span ".concat(style, ">").concat(insertSize, "</span><br>");
          }
        }
        return insertSizeHtml;
      }
    }, {
      key: "outlineMate",
      value: function outlineMate(read, yScaleBand) {
        var _iterator10 = PileupTrack_createForOfIteratorHelper(read.mate_ids),
          _step10;
        try {
          for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
            var mate_id = _step10.value;
            if (!this.readsById[mate_id]) {
              return;
            }
            var mate = this.readsById[mate_id];
            // We assume the mate height is the same, but width might be different
            var mate_width = this._xScale(mate.to) - this._xScale(mate.from);
            var mate_height = yScaleBand.bandwidth() * this.valueScaleTransform.k;
            var mate_xPos = this._xScale(mate.from);
            var mate_yPos = transformY(this.yScaleBands[mate.groupKey](mate.row), this.valueScaleTransform);
            this.mouseOverGraphics.lineStyle({
              width: 1,
              color: 0
            });
            this.mouseOverGraphics.drawRect(mate_xPos, mate_yPos, mate_width, mate_height);
          }
          // read.mate_ids.forEach((mate_id) => {
          //   if (!this.readsById[mate_id]) {
          //     return;
          //   }
          //   const mate = this.readsById[mate_id];
          //   // We assume the mate height is the same, but width might be different
          //   const mate_width =
          //     this._xScale(mate.to) - this._xScale(mate.from);
          //   const mate_height =
          //     yScaleBand.bandwidth() * this.valueScaleTransform.k;
          //   const mate_xPos = this._xScale(mate.from);
          //   const mate_yPos = transformY(
          //     this.yScaleBands[mate.groupKey](mate.row),
          //     this.valueScaleTransform,
          //   );
          //   this.mouseOverGraphics.lineStyle({
          //     width: 1,
          //     color: 0,
          //   });
          //   this.mouseOverGraphics.drawRect(
          //     mate_xPos,
          //     mate_yPos,
          //     mate_width,
          //     mate_height,
          //   );
          // });
        } catch (err) {
          _iterator10.e(err);
        } finally {
          _iterator10.f();
        }
        this.animate();
      }
    }, {
      key: "calculateZoomLevel",
      value: function calculateZoomLevel() {
        return HGC.utils.trackUtils.calculate1DZoomLevel(this.tilesetInfo, this._xScale, this.maxZoom);
      }
    }, {
      key: "calculateVisibleTiles",
      value: function calculateVisibleTiles() {
        var tiles = HGC.utils.trackUtils.calculate1DVisibleTiles(this.tilesetInfo, this._xScale);
        var _iterator11 = PileupTrack_createForOfIteratorHelper(tiles),
          _step11;
        try {
          for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
            var tile = _step11.value;
            var _getTilePosAndDimensi = getTilePosAndDimensions(tile[0], [tile[1]], this.tilesetInfo.tile_size, this.tilesetInfo),
              tileX = _getTilePosAndDimensi.tileX,
              tileWidth = _getTilePosAndDimensi.tileWidth;
            var DEFAULT_MAX_TILE_WIDTH = 2e5;
            if (tileWidth > (this.tilesetInfo.max_tile_width || this.dataFetcher.dataConfig.options && this.dataFetcher.dataConfig.options.maxTileWidth || this.options.maxTileWidth || DEFAULT_MAX_TILE_WIDTH)) {
              if (this.options.collapseWhenMaxTileWidthReached) {
                this.pubSub.publish('trackDimensionsModified', {
                  height: 20,
                  resizeParentDiv: true,
                  trackId: this.trackId,
                  viewId: this.viewId
                });
              }
              this.errorTextText = this.dataFetcher.dataConfig.options && this.dataFetcher.dataConfig.options.maxTileWidthReachedMessage ? this.dataFetcher.dataConfig.options.maxTileWidthReachedMessage : "Zoom in to load data";
              this.drawError();
              this.animate();
              this.maxTileWidthReached = true;
              var msg = {
                state: 'update_end',
                msg: 'Completed (calculateVisibleTiles)',
                uid: this.id
              };
              // console.log(`${JSON.stringify(msg)}`);
              this.bc.postMessage(msg);
              return;
            } else {
              this.maxTileWidthReached = false;
              if (this.options.collapseWhenMaxTileWidthReached) {
                this.pubSub.publish('trackDimensionsModified', {
                  height: this.originalHeight,
                  resizeParentDiv: true,
                  trackId: this.trackId,
                  viewId: this.viewId
                });
              }
            }
            this.errorTextText = null;
            this.pBorder.clear();
            this.drawError();
            this.animate();
          }
          // const { tileX, tileWidth } = getTilePosAndDimensions(
          //   this.calculateZoomLevel(),
          // )
        } catch (err) {
          _iterator11.e(err);
        } finally {
          _iterator11.f();
        }
        this.setVisibleTiles(tiles);
      }
    }, {
      key: "setPosition",
      value: function setPosition(newPosition) {
        _get(_getPrototypeOf(PileupTrackClass.prototype), "setPosition", this).call(this, newPosition);
        var _this$position = _slicedToArray(this.position, 2);
        this.pMain.position.x = _this$position[0];
        this.pMain.position.y = _this$position[1];
        var _this$position2 = _slicedToArray(this.position, 2);
        this.pMouseOver.position.x = _this$position2[0];
        this.pMouseOver.position.y = _this$position2[1];
        var _newPosition = _slicedToArray(newPosition, 2);
        this.loadingText.x = _newPosition[0];
        this.loadingText.y = _newPosition[1];
      }
    }, {
      key: "movedY",
      value: function movedY(dY) {
        var vst = this.valueScaleTransform;
        var height = this.dimensions[1];

        // clamp at the bottom and top
        if (vst.y + dY / vst.k > -(vst.k - 1) * height && vst.y + dY / vst.k < 0) {
          this.valueScaleTransform = vst.translate(0, dY / vst.k);
        }

        // this.segmentGraphics may not have been initialized if the user
        // was zoomed out too far
        if (this.segmentGraphics) {
          this.segmentGraphics.position.y = this.valueScaleTransform.y;
        }
        this.animate();
      }
    }, {
      key: "zoomedY",
      value: function zoomedY(yPos, kMultiplier) {
        var newTransform = HGC.utils.trackUtils.zoomedY(yPos, kMultiplier, this.valueScaleTransform, this.dimensions[1]);
        this.valueScaleTransform = newTransform;
        this.segmentGraphics.scale.y = newTransform.k;
        this.segmentGraphics.position.y = newTransform.y;
        this.mouseOverGraphics.clear();
        this.animate();
      }
    }, {
      key: "zoomed",
      value: function zoomed(newXScale, newYScale) {
        _get(_getPrototypeOf(PileupTrackClass.prototype), "zoomed", this).call(this, newXScale, newYScale);
        if (this.segmentGraphics) {
          scaleScalableGraphics(this.segmentGraphics, newXScale, this.drawnAtScale);
        }
        this.mouseOverGraphics.clear();
        this.animate();
      }
    }, {
      key: "exportSVG",
      value: function exportSVG() {
        var track = null;
        var base = null;
        this.clearMouseOver();
        if (_get(_getPrototypeOf(PileupTrackClass.prototype), "exportSVG", this)) {
          var _get$call = _get(_getPrototypeOf(PileupTrackClass.prototype), "exportSVG", this).call(this);
          var _get$call2 = _slicedToArray(_get$call, 2);
          base = _get$call2[0];
          track = _get$call2[1];
        } else {
          base = document.createElement('g');
          track = base;
        }
        this.mouseOverGraphics.clear();
        this.animate();

        // base = document.createElement('g');
        // track = base;

        var output = document.createElement('g');
        track.appendChild(output);
        output.setAttribute('transform', "translate(".concat(this.pMain.position.x, ",").concat(this.pMain.position.y, ") scale(").concat(this.pMain.scale.x, ",").concat(this.pMain.scale.y, ")"));
        var gSegment = document.createElement('g');
        output.appendChild(gSegment);
        if (this.segmentGraphics) {
          var b64string = HGC.services.pixiRenderer.plugins.extract.base64(
          // this.segmentGraphics, 'image/png', 1,
          this.pMain.parent.parent);

          // const xPositions = this.positions.filter((x,i) => i%2 == 0);
          // let minX = Number.MAX_SAFE_INTEGER;

          // for (let i = 0; i < xPositions.length; i++) {
          //   if (xPositions[i] < minX) {
          //     minX = xPositions[i];
          //   }
          // }
          var gImage = document.createElement('g');
          gImage.setAttribute('transform', "translate(0,0)");
          var image = document.createElement('image');
          image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', b64string);
          gImage.appendChild(image);
          gSegment.appendChild(gImage);

          // gSegment.appendChild(image);
        }
        // if (this.positions) {
        //   // short for colorIndex
        //   let ci = 0;

        //   for (let i = 0; i < this.positions.length; i += 12) {
        //     const rect = document.createElement('rect');

        //     rect.setAttribute('x', this.positions[i]);
        //     rect.setAttribute('y', this.positions[i + 1]);

        //     rect.setAttribute(
        //       'width',
        //       this.positions[i + 10] - this.positions[i]
        //     );

        //     rect.setAttribute(
        //       'height',
        //       this.positions[i + 11] - this.positions[i + 1]
        //     );

        //     const red = Math.ceil(255 * this.colors[ci]);
        //     const green = Math.ceil(255 * this.colors[ci + 1]);
        //     const blue = Math.ceil(255 * this.colors[ci + 2]);
        //     const alpha = this.colors[ci + 3];

        //     rect.setAttribute('fill', `rgba(${red},${green},${blue},${alpha})`);
        //     gSegment.appendChild(rect);
        //     ci += 24;
        //   }
        // }

        return [base, base];
      }
    }]);
    return PileupTrackClass;
  }(HGC.tracks.Tiled1DPixiTrack);
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  return _construct(PileupTrackClass, args);
};
var icon = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="1.5"><path d="M4 2.1L.5 3.5v12l5-2 5 2 5-2v-12l-5 2-3.17-1.268" fill="none" stroke="currentColor"/><path d="M10.5 3.5v12" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-dasharray="1,2,0,0"/><path d="M5.5 13.5V6" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-width=".9969299999999999" stroke-dasharray="1.71,3.43,0,0"/><path d="M9.03 5l.053.003.054.006.054.008.054.012.052.015.052.017.05.02.05.024 4 2 .048.026.048.03.046.03.044.034.042.037.04.04.037.04.036.042.032.045.03.047.028.048.025.05.022.05.02.053.016.053.014.055.01.055.007.055.005.055v.056l-.002.056-.005.055-.008.055-.01.055-.015.054-.017.054-.02.052-.023.05-.026.05-.028.048-.03.046-.035.044-.035.043-.038.04-4 4-.04.037-.04.036-.044.032-.045.03-.046.03-.048.024-.05.023-.05.02-.052.016-.052.015-.053.012-.054.01-.054.005-.055.003H8.97l-.053-.003-.054-.006-.054-.008-.054-.012-.052-.015-.052-.017-.05-.02-.05-.024-4-2-.048-.026-.048-.03-.046-.03-.044-.034-.042-.037-.04-.04-.037-.04-.036-.042-.032-.045-.03-.047-.028-.048-.025-.05-.022-.05-.02-.053-.016-.053-.014-.055-.01-.055-.007-.055L4 10.05v-.056l.002-.056.005-.055.008-.055.01-.055.015-.054.017-.054.02-.052.023-.05.026-.05.028-.048.03-.046.035-.044.035-.043.038-.04 4-4 .04-.037.04-.036.044-.032.045-.03.046-.03.048-.024.05-.023.05-.02.052-.016.052-.015.053-.012.054-.01.054-.005L8.976 5h.054zM5 10l4 2 4-4-4-2-4 4z" fill="currentColor"/><path d="M7.124 0C7.884 0 8.5.616 8.5 1.376v3.748c0 .76-.616 1.376-1.376 1.376H3.876c-.76 0-1.376-.616-1.376-1.376V1.376C2.5.616 3.116 0 3.876 0h3.248zm.56 5.295L5.965 1H5.05L3.375 5.295h.92l.354-.976h1.716l.375.975h.945zm-1.596-1.7l-.592-1.593-.58 1.594h1.172z" fill="currentColor"/></svg>';
PileupTrack.config = {
  type: 'pileup',
  datatype: ['reads'],
  orientation: '1d-horizontal',
  name: 'Pileup Track',
  thumbnail: new DOMParser().parseFromString(icon, 'text/xml').documentElement,
  availableOptions: ['axisPositionHorizontal', 'axisLabelFormatting', 'colorScale', 'groupBy', 'labelPosition', 'labelLeftMargin', 'labelRightMargin', 'labelTopMargin', 'labelBottomMargin', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'outlineReadOnHover', 'outlineMateOnHover', 'showMousePosition', 'workerScriptLocation', 'plusStrandColor', 'minusStrandColor', 'showCoverage', 'coverageHeight', 'maxTileWidth', 'collapseWhenMaxTileWidthReached', 'minMappingQuality', 'highlightReadsBy', 'smallInsertSizeThreshold', 'largeInsertSizeThreshold',
  // 'minZoom',
  'showLoadingText'],
  defaultOptions: {
    // minZoom: null,
    axisPositionHorizontal: 'right',
    axisLabelFormatting: 'normal',
    colorScale: [
    // A T G C N other
    '#08519c', '#6baed6', '#993404', '#fe9929', '#808080', '#DCDCDC'],
    outlineReadOnHover: false,
    outlineMateOnHover: false,
    showMousePosition: false,
    showCoverage: false,
    coverageHeight: 10,
    // unit: number of rows
    maxTileWidth: 2e5,
    collapseWhenMaxTileWidthReached: false,
    minMappingQuality: 0,
    highlightReadsBy: [],
    largeInsertSizeThreshold: 1000,
    showLoadingText: false
  },
  optionsInfo: {
    outlineReadOnHover: {
      name: 'Outline read on hover',
      inlineOptions: {
        yes: {
          value: true,
          name: 'Yes'
        },
        no: {
          value: false,
          name: 'No'
        }
      }
    },
    outlineMateOnHover: {
      name: 'Outline read mate on hover',
      inlineOptions: {
        yes: {
          value: true,
          name: 'Yes'
        },
        no: {
          value: false,
          name: 'No'
        }
      }
    },
    highlightReadsBy: {
      name: 'Highlight reads by',
      inlineOptions: {
        none: {
          value: [],
          name: 'None'
        },
        insertSize: {
          value: ["insertSize"],
          name: 'Insert size'
        },
        pairOrientation: {
          value: ["pairOrientation"],
          name: 'Pair orientation'
        },
        insertSizeAndPairOrientation: {
          value: ["insertSizeAndPairOrientation"],
          name: 'Insert size and pair orientation'
        },
        insertSizeOrPairOrientation: {
          value: ["insertSize", "pairOrientation"],
          name: 'Insert size or pair orientation'
        }
      }
    },
    minMappingQuality: {
      name: 'Minimal read mapping quality',
      inlineOptions: {
        zero: {
          value: 0,
          name: '0'
        },
        one: {
          value: 1,
          name: '1'
        },
        five: {
          value: 5,
          name: '5'
        },
        ten: {
          value: 10,
          name: '10'
        },
        twentyfive: {
          value: 25,
          name: '25'
        },
        fifty: {
          value: 50,
          name: '50'
        }
      }
    },
    showCoverage: {
      name: 'Show coverage',
      inlineOptions: {
        yes: {
          value: true,
          name: 'Yes'
        },
        no: {
          value: false,
          name: 'No'
        }
      }
    },
    groupBy: {
      name: 'Group by',
      inlineOptions: {
        strand: {
          value: 'strand',
          name: 'Strand'
        },
        hpTag: {
          value: 'tags.HP',
          name: 'HP tag'
        },
        nothing: {
          value: null,
          name: 'Nothing'
        }
      }
    },
    colorScale: {
      name: 'Color scheme',
      inlineOptions: {
        drums: {
          value: [
          // A T G C N other
          '#007FFF', '#e8e500', '#008000', '#FF0038', '#800080', '#DCDCDC'],
          name: 'DRuMS'
        },
        logos: {
          value: [
          // A T G C N other
          '#22ca03', '#c40003', '#f6af08', '#0000c7', '#808080', '#DCDCDC'],
          name: 'Logos / IGV'
        },
        bluesGreens: {
          value: [
          // A T G C N other
          '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#808080', '#DCDCDC'],
          name: 'Blues / Greens  (CB friendly)'
        },
        bluesBeiges: {
          value: ['#08519c', '#6baed6', '#993404', '#fe9929', '#808080', '#DCDCDC'],
          name: 'Blues / Beiges (CB friendly, default)'
        }
      }
    }
  }
};
/* harmony default export */ const src_PileupTrack = (PileupTrack);
;// CONCATENATED MODULE: ./src/index.js


src({
  name: 'PileupTrack',
  track: src_PileupTrack,
  config: src_PileupTrack.config
});
/* harmony default export */ const src_0 = (src_PileupTrack);
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});