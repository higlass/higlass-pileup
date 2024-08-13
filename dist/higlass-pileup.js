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
    key: "cleanup",
    value: function cleanup() {
      this.initPromise = this.worker.then(function (tileFunctions) {
        tileFunctions.cleanup();
      });
    }
  }, {
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
function bam_utils_toConsumableArray(arr) { return bam_utils_arrayWithoutHoles(arr) || bam_utils_iterableToArray(arr) || bam_utils_unsupportedIterableToArray(arr) || bam_utils_nonIterableSpread(); }
function bam_utils_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function bam_utils_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return bam_utils_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return bam_utils_arrayLikeToArray(o, minLen); }
function bam_utils_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function bam_utils_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return bam_utils_arrayLikeToArray(arr); }
function bam_utils_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = bam_utils_toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function bam_utils_toPropertyKey(arg) { var key = bam_utils_toPrimitive(arg, "string"); return bam_utils_typeof(key) === "symbol" ? key : String(key); }
function bam_utils_toPrimitive(input, hint) { if (bam_utils_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (bam_utils_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
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
  INDEX_DHS_BG: [0, 0, 0, 0],
  FIRE_SEGMENT_BG: [0, 0, 0, 0],
  FIRE_BG: [0.88, 0.88, 0.88, 1],
  TFBS_SEGMENT_BG: [0, 0, 0, 1],
  TFBS_BG: [1, 1, 1, 1],
  GENERIC_BED_SEGMENT_BG: [0, 0, 0, 1],
  GENERIC_BED_SEGMENT_RED_BG: [1, 0, 0, 1],
  "FIRE_169,169,169": [0.66, 0.66, 0.66],
  "FIRE_147,112,219": [0.58, 0.44, 0.86],
  "FIRE_255,0,0": [1, 0, 0],
  "FIRE_200,0,0": [0.78, 0, 0],
  "FIRE_255,140,0": [1, 0.55, 0],
  "FIRE_175,0,0": [0.68, 0, 0],
  "FIRE_225,0,0": [0.88, 0, 0],
  "FIRE_139,0,0": [0.54, 0, 0]
};
var PILEUP_COLOR_IXS = {};
Object.keys(PILEUP_COLORS).map(function (x, i) {
  PILEUP_COLOR_IXS[x] = i;
  return null;
});
function replaceColorIdxs(newColorIdxs) {
  PILEUP_COLOR_IXS = newColorIdxs;
}
function appendColorIdxs(newColorIdxs) {
  var currentColorTableLength = Object.keys(PILEUP_COLOR_IXS).length;
  Object.keys(newColorIdxs).map(function (x, i) {
    newColorIdxs[x] = i + currentColorTableLength;
  });
  PILEUP_COLOR_IXS = _objectSpread(_objectSpread({}, PILEUP_COLOR_IXS), newColorIdxs);
}
var hexToRGBRawTriplet = function hexToRGBRawTriplet(hex) {
  hex = hex.toUpperCase();
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  return "".concat(r, ",").concat(g, ",").concat(b);
};
var genericBedColors = function genericBedColors(options) {
  if (!options.genericBed) return {};
  var colorTable = {};
  colorTable['GENERIC_BED_BG'] = [0, 0, 0, 0],
  // Generic BED background default
  // Object.entries(options.genericBed.colors).map((o) => {
  //   const c = o[0];
  //   console.log(`c ${c}`);
  //   const v = c.split(',').map(d => parseFloat((parseFloat(d)/255).toFixed(2)));
  //   colorTable[`GENERIC_BED_${c}`] = [...v, 1.0];
  // });
  options.genericBed.colors.forEach(function (c, i) {
    // console.log(`c ${c} | i ${i}`);
    var v = c.split(',').map(function (d) {
      return parseFloat((parseFloat(d) / 255).toFixed(2));
    });
    colorTable["GENERIC_BED_".concat(c)] = [].concat(bam_utils_toConsumableArray(v), [1.0]);
  });
  // console.log(`colorTable ${JSON.stringify({...PILEUP_COLORS, ...colorTable})}`);
  return _objectSpread(_objectSpread({}, PILEUP_COLORS), colorTable);
};
var indexDHSColors = function indexDHSColors(options) {
  if (!options.indexDHS) return {};
  // console.log(`options ${JSON.stringify(options)}`);
  // console.log(`options.indexDHS.itemRGBMap ${JSON.stringify(options.indexDHS.itemRGBMap)}`);
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
var fireColors = function fireColors(options) {
  if (!options.fire) return {};
  // console.log(`options.fire ${JSON.stringify(options.fire)}`);
  var colorTable = {};
  colorTable['FIRE_BG_TEST'] = [0.89, 0.89, 0.89, 1],
  // FIRE background default
  Object.entries(options.fire.metadata.itemRGBMap).map(function (o) {
    var k = o[0];
    // const v = o[1];
    var v = k.split(',').map(function (d) {
      return parseFloat((parseFloat(d) / 255).toFixed(2));
    });
    colorTable["FIRE_".concat(k)] = [].concat(bam_utils_toConsumableArray(v), [1.0]);
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
 * @param  {Boolean} alignCpGEvents  Align stranded CpG events at the methylation offset level.
 * @return {Array}  Methylation offsets.
 */
var getMethylationOffsets = function getMethylationOffsets(segment, seq, alignCpGEvents) {
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
      // shift reverse-stranded CpG events upstream by one bases
      //
      // console.log(`alignCpGEvents ${alignCpGEvents}`);
      // if (mo.unmodifiedBase === 'C' && segment.strand === '-' && alignCpGEvents) {
      //   for (let i = 0; i < nOffsets; ++i) {
      //     offsets[i] -= 1;
      //   }
      // }

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
/* harmony default export */ const cjs_js_dist_worker = ("function ownKeys(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);r&&(o=o.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable;})),t.push.apply(t,o);}return t;}function _objectSpread(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?ownKeys(Object(t),!0).forEach(function(r){_defineProperty(e,r,t[r]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):ownKeys(Object(t)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r));});}return e;}function _defineProperty(obj,key,value){key=_toPropertyKey(key);if(key in obj){Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true});}else{obj[key]=value;}return obj;}function _toArray(arr){return _arrayWithHoles(arr)||_iterableToArray(arr)||_unsupportedIterableToArray(arr)||_nonIterableRest();}function _inherits(subClass,superClass){if(typeof superClass!==\"function\"&&superClass!==null){throw new TypeError(\"Super expression must either be null or a function\");}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,writable:true,configurable:true}});Object.defineProperty(subClass,\"prototype\",{writable:false});if(superClass)_setPrototypeOf(subClass,superClass);}function _setPrototypeOf(o,p){_setPrototypeOf=Object.setPrototypeOf?Object.setPrototypeOf.bind():function _setPrototypeOf(o,p){o.__proto__=p;return o;};return _setPrototypeOf(o,p);}function _createSuper(Derived){var hasNativeReflectConstruct=_isNativeReflectConstruct();return function _createSuperInternal(){var Super=_getPrototypeOf(Derived),result;if(hasNativeReflectConstruct){var NewTarget=_getPrototypeOf(this).constructor;result=Reflect.construct(Super,arguments,NewTarget);}else{result=Super.apply(this,arguments);}return _possibleConstructorReturn(this,result);};}function _possibleConstructorReturn(self,call){if(call&&(_typeof(call)===\"object\"||typeof call===\"function\")){return call;}else if(call!==void 0){throw new TypeError(\"Derived constructors may only return object or undefined\");}return _assertThisInitialized(self);}function _assertThisInitialized(self){if(self===void 0){throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\");}return self;}function _isNativeReflectConstruct(){if(typeof Reflect===\"undefined\"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy===\"function\")return true;try{Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}));return true;}catch(e){return false;}}function _getPrototypeOf(o){_getPrototypeOf=Object.setPrototypeOf?Object.getPrototypeOf.bind():function _getPrototypeOf(o){return o.__proto__||Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function asyncGeneratorStep(gen,resolve,reject,_next,_throw,key,arg){try{var info=gen[key](arg);var value=info.value;}catch(error){reject(error);return;}if(info.done){resolve(value);}else{Promise.resolve(value).then(_next,_throw);}}function _asyncToGenerator(fn){return function(){var self=this,args=arguments;return new Promise(function(resolve,reject){var gen=fn.apply(self,args);function _next(value){asyncGeneratorStep(gen,resolve,reject,_next,_throw,\"next\",value);}function _throw(err){asyncGeneratorStep(gen,resolve,reject,_next,_throw,\"throw\",err);}_next(undefined);});};}function _toConsumableArray(arr){return _arrayWithoutHoles(arr)||_iterableToArray(arr)||_unsupportedIterableToArray(arr)||_nonIterableSpread();}function _nonIterableSpread(){throw new TypeError(\"Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\");}function _iterableToArray(iter){if(typeof Symbol!==\"undefined\"&&iter[Symbol.iterator]!=null||iter[\"@@iterator\"]!=null)return Array.from(iter);}function _arrayWithoutHoles(arr){if(Array.isArray(arr))return _arrayLikeToArray(arr);}function _regeneratorRuntime(){\"use strict\";/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */_regeneratorRuntime=function _regeneratorRuntime(){return e;};var t,e={},r=Object.prototype,n=r.hasOwnProperty,o=Object.defineProperty||function(t,e,r){t[e]=r.value;},i=\"function\"==typeof Symbol?Symbol:{},a=i.iterator||\"@@iterator\",c=i.asyncIterator||\"@@asyncIterator\",u=i.toStringTag||\"@@toStringTag\";function define(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e];}try{define({},\"\");}catch(t){define=function define(t,e,r){return t[e]=r;};}function wrap(t,e,r,n){var i=e&&e.prototype instanceof Generator?e:Generator,a=Object.create(i.prototype),c=new Context(n||[]);return o(a,\"_invoke\",{value:makeInvokeMethod(t,r,c)}),a;}function tryCatch(t,e,r){try{return{type:\"normal\",arg:t.call(e,r)};}catch(t){return{type:\"throw\",arg:t};}}e.wrap=wrap;var h=\"suspendedStart\",l=\"suspendedYield\",f=\"executing\",s=\"completed\",y={};function Generator(){}function GeneratorFunction(){}function GeneratorFunctionPrototype(){}var p={};define(p,a,function(){return this;});var d=Object.getPrototypeOf,v=d&&d(d(values([])));v&&v!==r&&n.call(v,a)&&(p=v);var g=GeneratorFunctionPrototype.prototype=Generator.prototype=Object.create(p);function defineIteratorMethods(t){[\"next\",\"throw\",\"return\"].forEach(function(e){define(t,e,function(t){return this._invoke(e,t);});});}function AsyncIterator(t,e){function invoke(r,o,i,a){var c=tryCatch(t[r],t,o);if(\"throw\"!==c.type){var u=c.arg,h=u.value;return h&&\"object\"==_typeof(h)&&n.call(h,\"__await\")?e.resolve(h.__await).then(function(t){invoke(\"next\",t,i,a);},function(t){invoke(\"throw\",t,i,a);}):e.resolve(h).then(function(t){u.value=t,i(u);},function(t){return invoke(\"throw\",t,i,a);});}a(c.arg);}var r;o(this,\"_invoke\",{value:function value(t,n){function callInvokeWithMethodAndArg(){return new e(function(e,r){invoke(t,n,e,r);});}return r=r?r.then(callInvokeWithMethodAndArg,callInvokeWithMethodAndArg):callInvokeWithMethodAndArg();}});}function makeInvokeMethod(e,r,n){var o=h;return function(i,a){if(o===f)throw new Error(\"Generator is already running\");if(o===s){if(\"throw\"===i)throw a;return{value:t,done:!0};}for(n.method=i,n.arg=a;;){var c=n.delegate;if(c){var u=maybeInvokeDelegate(c,n);if(u){if(u===y)continue;return u;}}if(\"next\"===n.method)n.sent=n._sent=n.arg;else if(\"throw\"===n.method){if(o===h)throw o=s,n.arg;n.dispatchException(n.arg);}else\"return\"===n.method&&n.abrupt(\"return\",n.arg);o=f;var p=tryCatch(e,r,n);if(\"normal\"===p.type){if(o=n.done?s:l,p.arg===y)continue;return{value:p.arg,done:n.done};}\"throw\"===p.type&&(o=s,n.method=\"throw\",n.arg=p.arg);}};}function maybeInvokeDelegate(e,r){var n=r.method,o=e.iterator[n];if(o===t)return r.delegate=null,\"throw\"===n&&e.iterator[\"return\"]&&(r.method=\"return\",r.arg=t,maybeInvokeDelegate(e,r),\"throw\"===r.method)||\"return\"!==n&&(r.method=\"throw\",r.arg=new TypeError(\"The iterator does not provide a '\"+n+\"' method\")),y;var i=tryCatch(o,e.iterator,r.arg);if(\"throw\"===i.type)return r.method=\"throw\",r.arg=i.arg,r.delegate=null,y;var a=i.arg;return a?a.done?(r[e.resultName]=a.value,r.next=e.nextLoc,\"return\"!==r.method&&(r.method=\"next\",r.arg=t),r.delegate=null,y):a:(r.method=\"throw\",r.arg=new TypeError(\"iterator result is not an object\"),r.delegate=null,y);}function pushTryEntry(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e);}function resetTryEntry(t){var e=t.completion||{};e.type=\"normal\",delete e.arg,t.completion=e;}function Context(t){this.tryEntries=[{tryLoc:\"root\"}],t.forEach(pushTryEntry,this),this.reset(!0);}function values(e){if(e||\"\"===e){var r=e[a];if(r)return r.call(e);if(\"function\"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,i=function next(){for(;++o<e.length;)if(n.call(e,o))return next.value=e[o],next.done=!1,next;return next.value=t,next.done=!0,next;};return i.next=i;}}throw new TypeError(_typeof(e)+\" is not iterable\");}return GeneratorFunction.prototype=GeneratorFunctionPrototype,o(g,\"constructor\",{value:GeneratorFunctionPrototype,configurable:!0}),o(GeneratorFunctionPrototype,\"constructor\",{value:GeneratorFunction,configurable:!0}),GeneratorFunction.displayName=define(GeneratorFunctionPrototype,u,\"GeneratorFunction\"),e.isGeneratorFunction=function(t){var e=\"function\"==typeof t&&t.constructor;return!!e&&(e===GeneratorFunction||\"GeneratorFunction\"===(e.displayName||e.name));},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,GeneratorFunctionPrototype):(t.__proto__=GeneratorFunctionPrototype,define(t,u,\"GeneratorFunction\")),t.prototype=Object.create(g),t;},e.awrap=function(t){return{__await:t};},defineIteratorMethods(AsyncIterator.prototype),define(AsyncIterator.prototype,c,function(){return this;}),e.AsyncIterator=AsyncIterator,e.async=function(t,r,n,o,i){void 0===i&&(i=Promise);var a=new AsyncIterator(wrap(t,r,n,o),i);return e.isGeneratorFunction(r)?a:a.next().then(function(t){return t.done?t.value:a.next();});},defineIteratorMethods(g),define(g,u,\"Generator\"),define(g,a,function(){return this;}),define(g,\"toString\",function(){return\"[object Generator]\";}),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function next(){for(;r.length;){var t=r.pop();if(t in e)return next.value=t,next.done=!1,next;}return next.done=!0,next;};},e.values=values,Context.prototype={constructor:Context,reset:function reset(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method=\"next\",this.arg=t,this.tryEntries.forEach(resetTryEntry),!e)for(var r in this)\"t\"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t);},stop:function stop(){this.done=!0;var t=this.tryEntries[0].completion;if(\"throw\"===t.type)throw t.arg;return this.rval;},dispatchException:function dispatchException(e){if(this.done)throw e;var r=this;function handle(n,o){return a.type=\"throw\",a.arg=e,r.next=n,o&&(r.method=\"next\",r.arg=t),!!o;}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],a=i.completion;if(\"root\"===i.tryLoc)return handle(\"end\");if(i.tryLoc<=this.prev){var c=n.call(i,\"catchLoc\"),u=n.call(i,\"finallyLoc\");if(c&&u){if(this.prev<i.catchLoc)return handle(i.catchLoc,!0);if(this.prev<i.finallyLoc)return handle(i.finallyLoc);}else if(c){if(this.prev<i.catchLoc)return handle(i.catchLoc,!0);}else{if(!u)throw new Error(\"try statement without catch or finally\");if(this.prev<i.finallyLoc)return handle(i.finallyLoc);}}}},abrupt:function abrupt(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var o=this.tryEntries[r];if(o.tryLoc<=this.prev&&n.call(o,\"finallyLoc\")&&this.prev<o.finallyLoc){var i=o;break;}}i&&(\"break\"===t||\"continue\"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=t,a.arg=e,i?(this.method=\"next\",this.next=i.finallyLoc,y):this.complete(a);},complete:function complete(t,e){if(\"throw\"===t.type)throw t.arg;return\"break\"===t.type||\"continue\"===t.type?this.next=t.arg:\"return\"===t.type?(this.rval=this.arg=t.arg,this.method=\"return\",this.next=\"end\"):\"normal\"===t.type&&e&&(this.next=e),y;},finish:function finish(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),resetTryEntry(r),y;}},\"catch\":function _catch(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if(\"throw\"===n.type){var o=n.arg;resetTryEntry(r);}return o;}}throw new Error(\"illegal catch attempt\");},delegateYield:function delegateYield(e,r,n){return this.delegate={iterator:values(e),resultName:r,nextLoc:n},\"next\"===this.method&&(this.arg=t),y;}},e;}function _slicedToArray(arr,i){return _arrayWithHoles(arr)||_iterableToArrayLimit(arr,i)||_unsupportedIterableToArray(arr,i)||_nonIterableRest();}function _nonIterableRest(){throw new TypeError(\"Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\");}function _iterableToArrayLimit(r,l){var t=null==r?null:\"undefined\"!=typeof Symbol&&r[Symbol.iterator]||r[\"@@iterator\"];if(null!=t){var e,n,i,u,a=[],f=!0,o=!1;try{if(i=(t=t.call(r)).next,0===l){if(Object(t)!==t)return;f=!1;}else for(;!(f=(e=i.call(t)).done)&&(a.push(e.value),a.length!==l);f=!0);}catch(r){o=!0,n=r;}finally{try{if(!f&&null!=t[\"return\"]&&(u=t[\"return\"](),Object(u)!==u))return;}finally{if(o)throw n;}}return a;}}function _arrayWithHoles(arr){if(Array.isArray(arr))return arr;}function _createForOfIteratorHelper(o,allowArrayLike){var it=typeof Symbol!==\"undefined\"&&o[Symbol.iterator]||o[\"@@iterator\"];if(!it){if(Array.isArray(o)||(it=_unsupportedIterableToArray(o))||allowArrayLike&&o&&typeof o.length===\"number\"){if(it)o=it;var i=0;var F=function F(){};return{s:F,n:function n(){if(i>=o.length)return{done:true};return{done:false,value:o[i++]};},e:function e(_e160){throw _e160;},f:F};}throw new TypeError(\"Invalid attempt to iterate non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\");}var normalCompletion=true,didErr=false,err;return{s:function s(){it=it.call(o);},n:function n(){var step=it.next();normalCompletion=step.done;return step;},e:function e(_e161){didErr=true;err=_e161;},f:function f(){try{if(!normalCompletion&&it[\"return\"]!=null)it[\"return\"]();}finally{if(didErr)throw err;}}};}function _unsupportedIterableToArray(o,minLen){if(!o)return;if(typeof o===\"string\")return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);if(n===\"Object\"&&o.constructor)n=o.constructor.name;if(n===\"Map\"||n===\"Set\")return Array.from(o);if(n===\"Arguments\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen);}function _arrayLikeToArray(arr,len){if(len==null||len>arr.length)len=arr.length;for(var i=0,arr2=new Array(len);i<len;i++)arr2[i]=arr[i];return arr2;}function _typeof(o){\"@babel/helpers - typeof\";return _typeof=\"function\"==typeof Symbol&&\"symbol\"==typeof Symbol.iterator?function(o){return typeof o;}:function(o){return o&&\"function\"==typeof Symbol&&o.constructor===Symbol&&o!==Symbol.prototype?\"symbol\":typeof o;},_typeof(o);}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError(\"Cannot call a class as a function\");}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if(\"value\"in descriptor)descriptor.writable=true;Object.defineProperty(target,_toPropertyKey(descriptor.key),descriptor);}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);Object.defineProperty(Constructor,\"prototype\",{writable:false});return Constructor;}function _toPropertyKey(arg){var key=_toPrimitive(arg,\"string\");return _typeof(key)===\"symbol\"?key:String(key);}function _toPrimitive(input,hint){if(_typeof(input)!==\"object\"||input===null)return input;var prim=input[Symbol.toPrimitive];if(prim!==undefined){var res=prim.call(input,hint||\"default\");if(_typeof(res)!==\"object\")return res;throw new TypeError(\"@@toPrimitive must return a primitive value.\");}return(hint===\"string\"?String:Number)(input);}function _wrapAsyncGenerator(fn){return function(){return new _AsyncGenerator(fn.apply(this,arguments));};}function _AsyncGenerator(e){var r,t;function resume(r,t){try{var n=e[r](t),o=n.value,u=o instanceof _OverloadYield;Promise.resolve(u?o.v:o).then(function(t){if(u){var i=\"return\"===r?\"return\":\"next\";if(!o.k||t.done)return resume(i,t);t=e[i](t).value;}settle(n.done?\"return\":\"normal\",t);},function(e){resume(\"throw\",e);});}catch(e){settle(\"throw\",e);}}function settle(e,n){switch(e){case\"return\":r.resolve({value:n,done:!0});break;case\"throw\":r.reject(n);break;default:r.resolve({value:n,done:!1});}(r=r.next)?resume(r.key,r.arg):t=null;}this._invoke=function(e,n){return new Promise(function(o,u){var i={key:e,arg:n,resolve:o,reject:u,next:null};t?t=t.next=i:(r=t=i,resume(e,n));});},\"function\"!=typeof e[\"return\"]&&(this[\"return\"]=void 0);}_AsyncGenerator.prototype[\"function\"==typeof Symbol&&Symbol.asyncIterator||\"@@asyncIterator\"]=function(){return this;},_AsyncGenerator.prototype.next=function(e){return this._invoke(\"next\",e);},_AsyncGenerator.prototype[\"throw\"]=function(e){return this._invoke(\"throw\",e);},_AsyncGenerator.prototype[\"return\"]=function(e){return this._invoke(\"return\",e);};function _awaitAsyncGenerator(e){return new _OverloadYield(e,0);}function _asyncGeneratorDelegate(t){var e={},n=!1;function pump(e,r){return n=!0,r=new Promise(function(n){n(t[e](r));}),{done:!1,value:new _OverloadYield(r,1)};}return e[\"undefined\"!=typeof Symbol&&Symbol.iterator||\"@@iterator\"]=function(){return this;},e.next=function(t){return n?(n=!1,t):pump(\"next\",t);},\"function\"==typeof t[\"throw\"]&&(e[\"throw\"]=function(t){if(n)throw n=!1,t;return pump(\"throw\",t);}),\"function\"==typeof t[\"return\"]&&(e[\"return\"]=function(t){return n?(n=!1,t):pump(\"return\",t);}),e;}function _OverloadYield(t,e){this.v=t,this.k=e;}function _asyncIterator(r){var n,t,o,e=2;for(\"undefined\"!=typeof Symbol&&(t=Symbol.asyncIterator,o=Symbol.iterator);e--;){if(t&&null!=(n=r[t]))return n.call(r);if(o&&null!=(n=r[o]))return new AsyncFromSyncIterator(n.call(r));t=\"@@asyncIterator\",o=\"@@iterator\";}throw new TypeError(\"Object is not async iterable\");}function AsyncFromSyncIterator(r){function AsyncFromSyncIteratorContinuation(r){if(Object(r)!==r)return Promise.reject(new TypeError(r+\" is not an object.\"));var n=r.done;return Promise.resolve(r.value).then(function(r){return{value:r,done:n};});}return AsyncFromSyncIterator=function AsyncFromSyncIterator(r){this.s=r,this.n=r.next;},AsyncFromSyncIterator.prototype={s:null,n:null,next:function next(){return AsyncFromSyncIteratorContinuation(this.n.apply(this.s,arguments));},\"return\":function _return(r){var n=this.s[\"return\"];return void 0===n?Promise.resolve({value:r,done:!0}):AsyncFromSyncIteratorContinuation(n.apply(this.s,arguments));},\"throw\":function _throw(r){var n=this.s[\"return\"];return void 0===n?Promise.reject(r):AsyncFromSyncIteratorContinuation(n.apply(this.s,arguments));}},new AsyncFromSyncIterator(r);}/*! For license information please see worker.js.LICENSE.txt */(function(){var t={7036:function _(t,e,n){\"use strict\";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{\"default\":t};};Object.defineProperty(e,\"__esModule\",{value:!0});var i=n(4950),o=r(n(5389)),s=r(n(4697));var a=/*#__PURE__*/function(){function a(_ref){var t=_ref.fill,e=_ref.cache;_classCallCheck(this,a);if(\"function\"!=typeof t)throw new TypeError(\"must pass a fill function\");if(\"object\"!=_typeof(e))throw new TypeError(\"must pass a cache object\");if(\"function\"!=typeof e.get||\"function\"!=typeof e.set||\"function\"!=typeof e[\"delete\"])throw new TypeError(\"cache must implement get(key), set(key, val), and and delete(key)\");this.cache=e,this.fillCallback=t;}_createClass(a,[{key:\"evict\",value:function evict(t,e){this.cache.get(t)===e&&this.cache[\"delete\"](t);}},{key:\"fill\",value:function fill(t,e,n,r){var _this3=this;var i=new o[\"default\"](),_a2=new s[\"default\"]();_a2.addCallback(r);var u={aborter:i,promise:this.fillCallback(e,i.signal,function(t){_a2.callback(t);}),settled:!1,statusReporter:_a2,get aborted(){return this.aborter.signal.aborted;}};u.aborter.addSignal(n),u.aborter.signal.addEventListener(\"abort\",function(){u.settled||_this3.evict(t,u);}),u.promise.then(function(){u.settled=!0;},function(){u.settled=!0,_this3.evict(t,u);})[\"catch\"](function(t){throw console.error(t),t;}),this.cache.set(t,u);}},{key:\"has\",value:function has(t){return this.cache.has(t);}},{key:\"get\",value:function get(t,e,n,r){if(!n&&e instanceof i.AbortSignal)throw new TypeError(\"second get argument appears to be an AbortSignal, perhaps you meant to pass `null` for the fill data?\");var o=this.cache.get(t);return o?o.aborted&&!o.settled?(this.evict(t,o),this.get(t,e,n,r)):o.settled?o.promise:(o.aborter.addSignal(n),o.statusReporter.addCallback(r),a.checkSinglePromise(o.promise,n)):(this.fill(t,e,n,r),a.checkSinglePromise(this.cache.get(t).promise,n));}},{key:\"delete\",value:function _delete(t){var e=this.cache.get(t);e&&(e.settled||e.aborter.abort(),this.cache[\"delete\"](t));}},{key:\"clear\",value:function clear(){var t=this.cache.keys();var e=0;for(var _n2=t.next();!_n2.done;_n2=t.next())this[\"delete\"](_n2.value),e+=1;return e;}}],[{key:\"isAbortException\",value:function isAbortException(t){return\"AbortError\"===t.name||\"ERR_ABORTED\"===t.code||\"AbortError: aborted\"===t.message||\"Error: aborted\"===t.message;}},{key:\"checkSinglePromise\",value:function checkSinglePromise(t,e){function n(){if(e&&e.aborted)throw Object.assign(new Error(\"aborted\"),{code:\"ERR_ABORTED\"});}return t.then(function(t){return n(),t;},function(t){throw n(),t;});}}]);return a;}();e[\"default\"]=a;},5389:function _(t,e,n){\"use strict\";Object.defineProperty(e,\"__esModule\",{value:!0});var r=n(4950);var i=/*#__PURE__*/_createClass(function i(){_classCallCheck(this,i);});e[\"default\"]=/*#__PURE__*/function(){function _class(){_classCallCheck(this,_class);this.signals=new Set(),this.abortController=new r.AbortController();}_createClass(_class,[{key:\"addSignal\",value:function addSignal(){var _this4=this;var t=arguments.length>0&&arguments[0]!==undefined?arguments[0]:new i();if(this.signal.aborted)throw new Error(\"cannot add a signal, already aborted!\");this.signals.add(t),t.aborted?this.handleAborted(t):\"function\"==typeof t.addEventListener&&t.addEventListener(\"abort\",function(){_this4.handleAborted(t);});}},{key:\"handleAborted\",value:function handleAborted(t){this.signals[\"delete\"](t),0===this.signals.size&&this.abortController.abort();}},{key:\"signal\",get:function get(){return this.abortController.signal;}},{key:\"abort\",value:function abort(){this.abortController.abort();}}]);return _class;}();},4697:function _(t,e){\"use strict\";Object.defineProperty(e,\"__esModule\",{value:!0}),e[\"default\"]=/*#__PURE__*/function(){function _class2(){_classCallCheck(this,_class2);this.callbacks=new Set();}_createClass(_class2,[{key:\"addCallback\",value:function addCallback(){var t=arguments.length>0&&arguments[0]!==undefined?arguments[0]:function(){};this.callbacks.add(t),t(this.currentMessage);}},{key:\"callback\",value:function callback(t){this.currentMessage=t,this.callbacks.forEach(function(e){e(t);});}}]);return _class2;}();},4950:function _(t,e,n){\"use strict\";Object.defineProperty(e,\"__esModule\",{value:!0}),e.AbortSignal=e.AbortController=void 0;var r=n(1730);var i=function i(){if(\"undefined\"!=typeof self)return self;if(\"undefined\"!=typeof window)return window;if(void 0!==n.g)return n.g;throw new Error(\"unable to locate global object\");};var o=void 0===i().AbortController?r.AbortController:i().AbortController;e.AbortController=o;var s=void 0===i().AbortController?r.AbortSignal:i().AbortSignal;e.AbortSignal=s;},5237:function _(t,e,n){\"use strict\";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{\"default\":t};};Object.defineProperty(e,\"__esModule\",{value:!0});var i=r(n(7036));e[\"default\"]=i[\"default\"];},1730:function _(t,e){\"use strict\";function n(t,e){if(!(t instanceof e))throw new TypeError(\"Cannot call a class as a function\");}function r(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,\"value\"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r);}}function i(t,e,n){return e&&r(t.prototype,e),n&&r(t,n),Object.defineProperty(t,\"prototype\",{writable:!1}),t;}function o(t){return o=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t);},o(t);}function s(t,e){return s=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t;},s(t,e);}function a(t){if(void 0===t)throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\");return t;}function u(){return u=\"undefined\"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(t,e,n){var r=function(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&null!==(t=o(t)););return t;}(t,e);if(r){var i=Object.getOwnPropertyDescriptor(r,e);return i.get?i.get.call(arguments.length<3?t:n):i.value;}},u.apply(this,arguments);}Object.defineProperty(e,\"__esModule\",{value:!0});var l=function(){function t(){n(this,t),Object.defineProperty(this,\"listeners\",{value:{},writable:!0,configurable:!0});}return i(t,[{key:\"addEventListener\",value:function value(t,e,n){t in this.listeners||(this.listeners[t]=[]),this.listeners[t].push({callback:e,options:n});}},{key:\"removeEventListener\",value:function value(t,e){if(t in this.listeners)for(var n=this.listeners[t],r=0,i=n.length;r<i;r++)if(n[r].callback===e)return void n.splice(r,1);}},{key:\"dispatchEvent\",value:function value(t){var _this5=this;if(t.type in this.listeners){var _loop=function _loop(){i=e[n];try{i.callback.call(_this5,t);}catch(t){Promise.resolve().then(function(){throw t;});}i.options&&i.options.once&&_this5.removeEventListener(t.type,i.callback);},i;for(var e=this.listeners[t.type].slice(),n=0,r=e.length;n<r;n++){_loop();}return!t.defaultPrevented;}}}]),t;}(),h=function(t){!function(t,e){if(\"function\"!=typeof e&&null!==e)throw new TypeError(\"Super expression must either be null or a function\");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,\"prototype\",{writable:!1}),e&&s(t,e);}(c,t);var e,r,h=(e=c,r=function(){if(\"undefined\"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if(\"function\"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0;}catch(t){return!1;}}(),function(){var t,n=o(e);if(r){var i=o(this).constructor;t=Reflect.construct(n,arguments,i);}else t=n.apply(this,arguments);return function(t,e){if(e&&(\"object\"==_typeof(e)||\"function\"==typeof e))return e;if(void 0!==e)throw new TypeError(\"Derived constructors may only return object or undefined\");return a(t);}(this,t);});function c(){var t;return n(this,c),(t=h.call(this)).listeners||l.call(a(t)),Object.defineProperty(a(t),\"aborted\",{value:!1,writable:!0,configurable:!0}),Object.defineProperty(a(t),\"onabort\",{value:null,writable:!0,configurable:!0}),Object.defineProperty(a(t),\"reason\",{value:void 0,writable:!0,configurable:!0}),t;}return i(c,[{key:\"toString\",value:function value(){return\"[object AbortSignal]\";}},{key:\"dispatchEvent\",value:function value(t){\"abort\"===t.type&&(this.aborted=!0,\"function\"==typeof this.onabort&&this.onabort.call(this,t)),u(o(c.prototype),\"dispatchEvent\",this).call(this,t);}}]),c;}(l),c=function(){function t(){n(this,t),Object.defineProperty(this,\"signal\",{value:new h(),writable:!0,configurable:!0});}return i(t,[{key:\"abort\",value:function value(t){var e;try{e=new Event(\"abort\");}catch(t){\"undefined\"!=typeof document?document.createEvent?(e=document.createEvent(\"Event\")).initEvent(\"abort\",!1,!1):(e=document.createEventObject()).type=\"abort\":e={type:\"abort\",bubbles:!1,cancelable:!1};}var n=t;if(void 0===n)if(\"undefined\"==typeof document)(n=new Error(\"This operation was aborted\")).name=\"AbortError\";else try{n=new DOMException(\"signal is aborted without reason\");}catch(t){(n=new Error(\"This operation was aborted\")).name=\"AbortError\";}this.signal.reason=n,this.signal.dispatchEvent(e);}},{key:\"toString\",value:function value(){return\"[object AbortController]\";}}]),t;}();\"undefined\"!=typeof Symbol&&Symbol.toStringTag&&(c.prototype[Symbol.toStringTag]=\"AbortController\",h.prototype[Symbol.toStringTag]=\"AbortSignal\"),e.AbortController=c,e.AbortSignal=h,e.abortableFetch=function(t){\"function\"==typeof t&&(t={fetch:t});var e=t,n=e.fetch,r=e.Request,i=void 0===r?n.Request:r,o=e.AbortController,s=e.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL,a=void 0!==s&&s;if(!function(t){return t.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL?(console.log(\"__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL=true is set, will force install polyfill\"),!0):\"function\"==typeof t.Request&&!t.Request.prototype.hasOwnProperty(\"signal\")||!t.AbortController;}({fetch:n,Request:i,AbortController:o,__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL:a}))return{fetch:n,Request:u};var u=i;(u&&!u.prototype.hasOwnProperty(\"signal\")||a)&&((u=function u(t,e){var n;e&&e.signal&&(n=e.signal,delete e.signal);var r=new i(t,e);return n&&Object.defineProperty(r,\"signal\",{writable:!1,enumerable:!1,configurable:!0,value:n}),r;}).prototype=i.prototype);var l=n;return{fetch:function fetch(t,e){var n=u&&u.prototype.isPrototypeOf(t)?t.signal:e?e.signal:void 0;if(n){var r;try{r=new DOMException(\"Aborted\",\"AbortError\");}catch(t){(r=new Error(\"Aborted\")).name=\"AbortError\";}if(n.aborted)return Promise.reject(r);var i=new Promise(function(t,e){n.addEventListener(\"abort\",function(){return e(r);},{once:!0});});return e&&e.signal&&delete e.signal,Promise.race([i,l(t,e)]);}return l(t,e);},Request:u};};},8806:function _(t){t.exports=n;var e=null;try{e=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports;}catch(t){}function n(t,e,n){this.low=0|t,this.high=0|e,this.unsigned=!!n;}function r(t){return!0===(t&&t.__isLong__);}n.prototype.__isLong__,Object.defineProperty(n.prototype,\"__isLong__\",{value:!0}),n.isLong=r;var i={},o={};function s(t,e){var n,r,s;return e?(s=0<=(t>>>=0)&&t<256)&&(r=o[t])?r:(n=u(t,(0|t)<0?-1:0,!0),s&&(o[t]=n),n):(s=-128<=(t|=0)&&t<128)&&(r=i[t])?r:(n=u(t,t<0?-1:0,!1),s&&(i[t]=n),n);}function a(t,e){if(isNaN(t))return e?m:_;if(e){if(t<0)return m;if(t>=d)return x;}else{if(t<=-p)return k;if(t+1>=p)return w;}return t<0?a(-t,e).neg():u(t%f|0,t/f|0,e);}function u(t,e,r){return new n(t,e,r);}n.fromInt=s,n.fromNumber=a,n.fromBits=u;var l=Math.pow;function h(t,e,n){if(0===t.length)throw Error(\"empty string\");if(\"NaN\"===t||\"Infinity\"===t||\"+Infinity\"===t||\"-Infinity\"===t)return _;if(\"number\"==typeof e?(n=e,e=!1):e=!!e,(n=n||10)<2||36<n)throw RangeError(\"radix\");var r;if((r=t.indexOf(\"-\"))>0)throw Error(\"interior hyphen\");if(0===r)return h(t.substring(1),e,n).neg();for(var i=a(l(n,8)),o=_,s=0;s<t.length;s+=8){var u=Math.min(8,t.length-s),c=parseInt(t.substring(s,s+u),n);if(u<8){var f=a(l(n,u));o=o.mul(f).add(a(c));}else o=(o=o.mul(i)).add(a(c));}return o.unsigned=e,o;}function c(t,e){return\"number\"==typeof t?a(t,e):\"string\"==typeof t?h(t,e):u(t.low,t.high,\"boolean\"==typeof e?e:t.unsigned);}n.fromString=h,n.fromValue=c;var f=4294967296,d=f*f,p=d/2,g=s(1<<24),_=s(0);n.ZERO=_;var m=s(0,!0);n.UZERO=m;var v=s(1);n.ONE=v;var y=s(1,!0);n.UONE=y;var b=s(-1);n.NEG_ONE=b;var w=u(-1,2147483647,!1);n.MAX_VALUE=w;var x=u(-1,-1,!0);n.MAX_UNSIGNED_VALUE=x;var k=u(0,-2147483648,!1);n.MIN_VALUE=k;var A=n.prototype;A.toInt=function(){return this.unsigned?this.low>>>0:this.low;},A.toNumber=function(){return this.unsigned?(this.high>>>0)*f+(this.low>>>0):this.high*f+(this.low>>>0);},A.toString=function(t){if((t=t||10)<2||36<t)throw RangeError(\"radix\");if(this.isZero())return\"0\";if(this.isNegative()){if(this.eq(k)){var e=a(t),n=this.div(e),r=n.mul(e).sub(this);return n.toString(t)+r.toInt().toString(t);}return\"-\"+this.neg().toString(t);}for(var i=a(l(t,6),this.unsigned),o=this,s=\"\";;){var u=o.div(i),h=(o.sub(u.mul(i)).toInt()>>>0).toString(t);if((o=u).isZero())return h+s;for(;h.length<6;)h=\"0\"+h;s=\"\"+h+s;}},A.getHighBits=function(){return this.high;},A.getHighBitsUnsigned=function(){return this.high>>>0;},A.getLowBits=function(){return this.low;},A.getLowBitsUnsigned=function(){return this.low>>>0;},A.getNumBitsAbs=function(){if(this.isNegative())return this.eq(k)?64:this.neg().getNumBitsAbs();for(var t=0!=this.high?this.high:this.low,e=31;e>0&&0==(t&1<<e);e--);return 0!=this.high?e+33:e+1;},A.isZero=function(){return 0===this.high&&0===this.low;},A.eqz=A.isZero,A.isNegative=function(){return!this.unsigned&&this.high<0;},A.isPositive=function(){return this.unsigned||this.high>=0;},A.isOdd=function(){return 1==(1&this.low);},A.isEven=function(){return 0==(1&this.low);},A.equals=function(t){return r(t)||(t=c(t)),(this.unsigned===t.unsigned||this.high>>>31!=1||t.high>>>31!=1)&&this.high===t.high&&this.low===t.low;},A.eq=A.equals,A.notEquals=function(t){return!this.eq(t);},A.neq=A.notEquals,A.ne=A.notEquals,A.lessThan=function(t){return this.comp(t)<0;},A.lt=A.lessThan,A.lessThanOrEqual=function(t){return this.comp(t)<=0;},A.lte=A.lessThanOrEqual,A.le=A.lessThanOrEqual,A.greaterThan=function(t){return this.comp(t)>0;},A.gt=A.greaterThan,A.greaterThanOrEqual=function(t){return this.comp(t)>=0;},A.gte=A.greaterThanOrEqual,A.ge=A.greaterThanOrEqual,A.compare=function(t){if(r(t)||(t=c(t)),this.eq(t))return 0;var e=this.isNegative(),n=t.isNegative();return e&&!n?-1:!e&&n?1:this.unsigned?t.high>>>0>this.high>>>0||t.high===this.high&&t.low>>>0>this.low>>>0?-1:1:this.sub(t).isNegative()?-1:1;},A.comp=A.compare,A.negate=function(){return!this.unsigned&&this.eq(k)?k:this.not().add(v);},A.neg=A.negate,A.add=function(t){r(t)||(t=c(t));var e=this.high>>>16,n=65535&this.high,i=this.low>>>16,o=65535&this.low,s=t.high>>>16,a=65535&t.high,l=t.low>>>16,h=0,f=0,d=0,p=0;return d+=(p+=o+(65535&t.low))>>>16,f+=(d+=i+l)>>>16,h+=(f+=n+a)>>>16,h+=e+s,u((d&=65535)<<16|(p&=65535),(h&=65535)<<16|(f&=65535),this.unsigned);},A.subtract=function(t){return r(t)||(t=c(t)),this.add(t.neg());},A.sub=A.subtract,A.multiply=function(t){if(this.isZero())return _;if(r(t)||(t=c(t)),e)return u(e.mul(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned);if(t.isZero())return _;if(this.eq(k))return t.isOdd()?k:_;if(t.eq(k))return this.isOdd()?k:_;if(this.isNegative())return t.isNegative()?this.neg().mul(t.neg()):this.neg().mul(t).neg();if(t.isNegative())return this.mul(t.neg()).neg();if(this.lt(g)&&t.lt(g))return a(this.toNumber()*t.toNumber(),this.unsigned);var n=this.high>>>16,i=65535&this.high,o=this.low>>>16,s=65535&this.low,l=t.high>>>16,h=65535&t.high,f=t.low>>>16,d=65535&t.low,p=0,m=0,v=0,y=0;return v+=(y+=s*d)>>>16,m+=(v+=o*d)>>>16,v&=65535,m+=(v+=s*f)>>>16,p+=(m+=i*d)>>>16,m&=65535,p+=(m+=o*f)>>>16,m&=65535,p+=(m+=s*h)>>>16,p+=n*d+i*f+o*h+s*l,u((v&=65535)<<16|(y&=65535),(p&=65535)<<16|(m&=65535),this.unsigned);},A.mul=A.multiply,A.divide=function(t){if(r(t)||(t=c(t)),t.isZero())throw Error(\"division by zero\");var n,i,o;if(e)return this.unsigned||-2147483648!==this.high||-1!==t.low||-1!==t.high?u((this.unsigned?e.div_u:e.div_s)(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned):this;if(this.isZero())return this.unsigned?m:_;if(this.unsigned){if(t.unsigned||(t=t.toUnsigned()),t.gt(this))return m;if(t.gt(this.shru(1)))return y;o=m;}else{if(this.eq(k))return t.eq(v)||t.eq(b)?k:t.eq(k)?v:(n=this.shr(1).div(t).shl(1)).eq(_)?t.isNegative()?v:b:(i=this.sub(t.mul(n)),o=n.add(i.div(t)));if(t.eq(k))return this.unsigned?m:_;if(this.isNegative())return t.isNegative()?this.neg().div(t.neg()):this.neg().div(t).neg();if(t.isNegative())return this.div(t.neg()).neg();o=_;}for(i=this;i.gte(t);){n=Math.max(1,Math.floor(i.toNumber()/t.toNumber()));for(var s=Math.ceil(Math.log(n)/Math.LN2),h=s<=48?1:l(2,s-48),f=a(n),d=f.mul(t);d.isNegative()||d.gt(i);)d=(f=a(n-=h,this.unsigned)).mul(t);f.isZero()&&(f=v),o=o.add(f),i=i.sub(d);}return o;},A.div=A.divide,A.modulo=function(t){return r(t)||(t=c(t)),e?u((this.unsigned?e.rem_u:e.rem_s)(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned):this.sub(this.div(t).mul(t));},A.mod=A.modulo,A.rem=A.modulo,A.not=function(){return u(~this.low,~this.high,this.unsigned);},A.and=function(t){return r(t)||(t=c(t)),u(this.low&t.low,this.high&t.high,this.unsigned);},A.or=function(t){return r(t)||(t=c(t)),u(this.low|t.low,this.high|t.high,this.unsigned);},A.xor=function(t){return r(t)||(t=c(t)),u(this.low^t.low,this.high^t.high,this.unsigned);},A.shiftLeft=function(t){return r(t)&&(t=t.toInt()),0==(t&=63)?this:t<32?u(this.low<<t,this.high<<t|this.low>>>32-t,this.unsigned):u(0,this.low<<t-32,this.unsigned);},A.shl=A.shiftLeft,A.shiftRight=function(t){return r(t)&&(t=t.toInt()),0==(t&=63)?this:t<32?u(this.low>>>t|this.high<<32-t,this.high>>t,this.unsigned):u(this.high>>t-32,this.high>=0?0:-1,this.unsigned);},A.shr=A.shiftRight,A.shiftRightUnsigned=function(t){if(r(t)&&(t=t.toInt()),0==(t&=63))return this;var e=this.high;return t<32?u(this.low>>>t|e<<32-t,e>>>t,this.unsigned):u(32===t?e:e>>>t-32,0,this.unsigned);},A.shru=A.shiftRightUnsigned,A.shr_u=A.shiftRightUnsigned,A.toSigned=function(){return this.unsigned?u(this.low,this.high,!1):this;},A.toUnsigned=function(){return this.unsigned?this:u(this.low,this.high,!0);},A.toBytes=function(t){return t?this.toBytesLE():this.toBytesBE();},A.toBytesLE=function(){var t=this.high,e=this.low;return[255&e,e>>>8&255,e>>>16&255,e>>>24,255&t,t>>>8&255,t>>>16&255,t>>>24];},A.toBytesBE=function(){var t=this.high,e=this.low;return[t>>>24,t>>>16&255,t>>>8&255,255&t,e>>>24,e>>>16&255,e>>>8&255,255&e];},n.fromBytes=function(t,e,r){return r?n.fromBytesLE(t,e):n.fromBytesBE(t,e);},n.fromBytesLE=function(t,e){return new n(t[0]|t[1]<<8|t[2]<<16|t[3]<<24,t[4]|t[5]<<8|t[6]<<16|t[7]<<24,e);},n.fromBytesBE=function(t,e){return new n(t[4]<<24|t[5]<<16|t[6]<<8|t[7],t[0]<<24|t[1]<<16|t[2]<<8|t[3],e);};},9777:function _(t,e,n){\"use strict\";var r={};(0,n(9639).assign)(r,n(2365),n(6187),n(2890)),t.exports=r;},2365:function _(t,e,n){\"use strict\";var r=n(9573),i=n(9639),o=n(2653),s=n(5837),a=n(6916),u=Object.prototype.toString,l=0,h=-1,c=0,f=8;function d(t){if(!(this instanceof d))return new d(t);this.options=i.assign({level:h,method:f,chunkSize:16384,windowBits:15,memLevel:8,strategy:c,to:\"\"},t||{});var e=this.options;e.raw&&e.windowBits>0?e.windowBits=-e.windowBits:e.gzip&&e.windowBits>0&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg=\"\",this.ended=!1,this.chunks=[],this.strm=new a(),this.strm.avail_out=0;var n=r.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(n!==l)throw new Error(s[n]);if(e.header&&r.deflateSetHeader(this.strm,e.header),e.dictionary){var p;if(p=\"string\"==typeof e.dictionary?o.string2buf(e.dictionary):\"[object ArrayBuffer]\"===u.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,(n=r.deflateSetDictionary(this.strm,p))!==l)throw new Error(s[n]);this._dict_set=!0;}}function p(t,e){var n=new d(e);if(n.push(t,!0),n.err)throw n.msg||s[n.err];return n.result;}d.prototype.push=function(t,e){var n,s,a=this.strm,h=this.options.chunkSize;if(this.ended)return!1;s=e===~~e?e:!0===e?4:0,\"string\"==typeof t?a.input=o.string2buf(t):\"[object ArrayBuffer]\"===u.call(t)?a.input=new Uint8Array(t):a.input=t,a.next_in=0,a.avail_in=a.input.length;do{if(0===a.avail_out&&(a.output=new i.Buf8(h),a.next_out=0,a.avail_out=h),1!==(n=r.deflate(a,s))&&n!==l)return this.onEnd(n),this.ended=!0,!1;0!==a.avail_out&&(0!==a.avail_in||4!==s&&2!==s)||(\"string\"===this.options.to?this.onData(o.buf2binstring(i.shrinkBuf(a.output,a.next_out))):this.onData(i.shrinkBuf(a.output,a.next_out)));}while((a.avail_in>0||0===a.avail_out)&&1!==n);return 4===s?(n=r.deflateEnd(this.strm),this.onEnd(n),this.ended=!0,n===l):2!==s||(this.onEnd(l),a.avail_out=0,!0);},d.prototype.onData=function(t){this.chunks.push(t);},d.prototype.onEnd=function(t){t===l&&(\"string\"===this.options.to?this.result=this.chunks.join(\"\"):this.result=i.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg;},e.Deflate=d,e.deflate=p,e.deflateRaw=function(t,e){return(e=e||{}).raw=!0,p(t,e);},e.gzip=function(t,e){return(e=e||{}).gzip=!0,p(t,e);};},6187:function _(t,e,n){\"use strict\";var r=n(3519),i=n(9639),o=n(2653),s=n(2890),a=n(5837),u=n(6916),l=n(3677),h=Object.prototype.toString;function c(t){if(!(this instanceof c))return new c(t);this.options=i.assign({chunkSize:16384,windowBits:0,to:\"\"},t||{});var e=this.options;e.raw&&e.windowBits>=0&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(e.windowBits>=0&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),e.windowBits>15&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg=\"\",this.ended=!1,this.chunks=[],this.strm=new u(),this.strm.avail_out=0;var n=r.inflateInit2(this.strm,e.windowBits);if(n!==s.Z_OK)throw new Error(a[n]);if(this.header=new l(),r.inflateGetHeader(this.strm,this.header),e.dictionary&&(\"string\"==typeof e.dictionary?e.dictionary=o.string2buf(e.dictionary):\"[object ArrayBuffer]\"===h.call(e.dictionary)&&(e.dictionary=new Uint8Array(e.dictionary)),e.raw&&(n=r.inflateSetDictionary(this.strm,e.dictionary))!==s.Z_OK))throw new Error(a[n]);}function f(t,e){var n=new c(e);if(n.push(t,!0),n.err)throw n.msg||a[n.err];return n.result;}c.prototype.push=function(t,e){var n,a,u,l,c,f=this.strm,d=this.options.chunkSize,p=this.options.dictionary,g=!1;if(this.ended)return!1;a=e===~~e?e:!0===e?s.Z_FINISH:s.Z_NO_FLUSH,\"string\"==typeof t?f.input=o.binstring2buf(t):\"[object ArrayBuffer]\"===h.call(t)?f.input=new Uint8Array(t):f.input=t,f.next_in=0,f.avail_in=f.input.length;do{if(0===f.avail_out&&(f.output=new i.Buf8(d),f.next_out=0,f.avail_out=d),(n=r.inflate(f,s.Z_NO_FLUSH))===s.Z_NEED_DICT&&p&&(n=r.inflateSetDictionary(this.strm,p)),n===s.Z_BUF_ERROR&&!0===g&&(n=s.Z_OK,g=!1),n!==s.Z_STREAM_END&&n!==s.Z_OK)return this.onEnd(n),this.ended=!0,!1;f.next_out&&(0!==f.avail_out&&n!==s.Z_STREAM_END&&(0!==f.avail_in||a!==s.Z_FINISH&&a!==s.Z_SYNC_FLUSH)||(\"string\"===this.options.to?(u=o.utf8border(f.output,f.next_out),l=f.next_out-u,c=o.buf2string(f.output,u),f.next_out=l,f.avail_out=d-l,l&&i.arraySet(f.output,f.output,u,l,0),this.onData(c)):this.onData(i.shrinkBuf(f.output,f.next_out)))),0===f.avail_in&&0===f.avail_out&&(g=!0);}while((f.avail_in>0||0===f.avail_out)&&n!==s.Z_STREAM_END);return n===s.Z_STREAM_END&&(a=s.Z_FINISH),a===s.Z_FINISH?(n=r.inflateEnd(this.strm),this.onEnd(n),this.ended=!0,n===s.Z_OK):a!==s.Z_SYNC_FLUSH||(this.onEnd(s.Z_OK),f.avail_out=0,!0);},c.prototype.onData=function(t){this.chunks.push(t);},c.prototype.onEnd=function(t){t===s.Z_OK&&(\"string\"===this.options.to?this.result=this.chunks.join(\"\"):this.result=i.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg;},e.Inflate=c,e.inflate=f,e.inflateRaw=function(t,e){return(e=e||{}).raw=!0,f(t,e);},e.ungzip=f;},9639:function _(t,e){\"use strict\";var n=\"undefined\"!=typeof Uint8Array&&\"undefined\"!=typeof Uint16Array&&\"undefined\"!=typeof Int32Array;function r(t,e){return Object.prototype.hasOwnProperty.call(t,e);}e.assign=function(t){for(var e=Array.prototype.slice.call(arguments,1);e.length;){var n=e.shift();if(n){if(\"object\"!=_typeof(n))throw new TypeError(n+\"must be non-object\");for(var i in n)r(n,i)&&(t[i]=n[i]);}}return t;},e.shrinkBuf=function(t,e){return t.length===e?t:t.subarray?t.subarray(0,e):(t.length=e,t);};var i={arraySet:function arraySet(t,e,n,r,i){if(e.subarray&&t.subarray)t.set(e.subarray(n,n+r),i);else for(var o=0;o<r;o++)t[i+o]=e[n+o];},flattenChunks:function flattenChunks(t){var e,n,r,i,o,s;for(r=0,e=0,n=t.length;e<n;e++)r+=t[e].length;for(s=new Uint8Array(r),i=0,e=0,n=t.length;e<n;e++)o=t[e],s.set(o,i),i+=o.length;return s;}},o={arraySet:function arraySet(t,e,n,r,i){for(var o=0;o<r;o++)t[i+o]=e[n+o];},flattenChunks:function flattenChunks(t){return[].concat.apply([],t);}};e.setTyped=function(t){t?(e.Buf8=Uint8Array,e.Buf16=Uint16Array,e.Buf32=Int32Array,e.assign(e,i)):(e.Buf8=Array,e.Buf16=Array,e.Buf32=Array,e.assign(e,o));},e.setTyped(n);},2653:function _(t,e,n){\"use strict\";var r=n(9639),i=!0,o=!0;try{String.fromCharCode.apply(null,[0]);}catch(t){i=!1;}try{String.fromCharCode.apply(null,new Uint8Array(1));}catch(t){o=!1;}for(var s=new r.Buf8(256),a=0;a<256;a++)s[a]=a>=252?6:a>=248?5:a>=240?4:a>=224?3:a>=192?2:1;function u(t,e){if(e<65534&&(t.subarray&&o||!t.subarray&&i))return String.fromCharCode.apply(null,r.shrinkBuf(t,e));for(var n=\"\",s=0;s<e;s++)n+=String.fromCharCode(t[s]);return n;}s[254]=s[254]=1,e.string2buf=function(t){var e,n,i,o,s,a=t.length,u=0;for(o=0;o<a;o++)55296==(64512&(n=t.charCodeAt(o)))&&o+1<a&&56320==(64512&(i=t.charCodeAt(o+1)))&&(n=65536+(n-55296<<10)+(i-56320),o++),u+=n<128?1:n<2048?2:n<65536?3:4;for(e=new r.Buf8(u),s=0,o=0;s<u;o++)55296==(64512&(n=t.charCodeAt(o)))&&o+1<a&&56320==(64512&(i=t.charCodeAt(o+1)))&&(n=65536+(n-55296<<10)+(i-56320),o++),n<128?e[s++]=n:n<2048?(e[s++]=192|n>>>6,e[s++]=128|63&n):n<65536?(e[s++]=224|n>>>12,e[s++]=128|n>>>6&63,e[s++]=128|63&n):(e[s++]=240|n>>>18,e[s++]=128|n>>>12&63,e[s++]=128|n>>>6&63,e[s++]=128|63&n);return e;},e.buf2binstring=function(t){return u(t,t.length);},e.binstring2buf=function(t){for(var e=new r.Buf8(t.length),n=0,i=e.length;n<i;n++)e[n]=t.charCodeAt(n);return e;},e.buf2string=function(t,e){var n,r,i,o,a=e||t.length,l=new Array(2*a);for(r=0,n=0;n<a;)if((i=t[n++])<128)l[r++]=i;else if((o=s[i])>4)l[r++]=65533,n+=o-1;else{for(i&=2===o?31:3===o?15:7;o>1&&n<a;)i=i<<6|63&t[n++],o--;o>1?l[r++]=65533:i<65536?l[r++]=i:(i-=65536,l[r++]=55296|i>>10&1023,l[r++]=56320|1023&i);}return u(l,r);},e.utf8border=function(t,e){var n;for((e=e||t.length)>t.length&&(e=t.length),n=e-1;n>=0&&128==(192&t[n]);)n--;return n<0||0===n?e:n+s[t[n]]>e?n:e;};},2084:function _(t){\"use strict\";t.exports=function(t,e,n,r){for(var i=65535&t|0,o=t>>>16&65535|0,s=0;0!==n;){n-=s=n>2e3?2e3:n;do{o=o+(i=i+e[r++]|0)|0;}while(--s);i%=65521,o%=65521;}return i|o<<16|0;};},2890:function _(t){\"use strict\";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};},1647:function _(t){\"use strict\";var e=function(){for(var t,e=[],n=0;n<256;n++){t=n;for(var r=0;r<8;r++)t=1&t?3988292384^t>>>1:t>>>1;e[n]=t;}return e;}();t.exports=function(t,n,r,i){var o=e,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^o[255&(t^n[a])];return-1^t;};},9573:function _(t,e,n){\"use strict\";var r,i=n(9639),o=n(2169),s=n(2084),a=n(1647),u=n(5837),l=0,h=0,c=-2,f=2,d=8,p=286,g=30,_=19,m=2*p+1,v=15,y=3,b=258,w=b+y+1,x=42,k=103,A=113,E=666;function S(t,e){return t.msg=u[e],e;}function M(t){return(t<<1)-(t>4?9:0);}function B(t){for(var e=t.length;--e>=0;)t[e]=0;}function T(t){var e=t.state,n=e.pending;n>t.avail_out&&(n=t.avail_out),0!==n&&(i.arraySet(t.output,e.pending_buf,e.pending_out,n,t.next_out),t.next_out+=n,e.pending_out+=n,t.total_out+=n,t.avail_out-=n,e.pending-=n,0===e.pending&&(e.pending_out=0));}function z(t,e){o._tr_flush_block(t,t.block_start>=0?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,T(t.strm);}function C(t,e){t.pending_buf[t.pending++]=e;}function N(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e;}function I(t,e){var n,r,i=t.max_chain_length,o=t.strstart,s=t.prev_length,a=t.nice_match,u=t.strstart>t.w_size-w?t.strstart-(t.w_size-w):0,l=t.window,h=t.w_mask,c=t.prev,f=t.strstart+b,d=l[o+s-1],p=l[o+s];t.prev_length>=t.good_match&&(i>>=2),a>t.lookahead&&(a=t.lookahead);do{if(l[(n=e)+s]===p&&l[n+s-1]===d&&l[n]===l[o]&&l[++n]===l[o+1]){o+=2,n++;do{}while(l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&o<f);if(r=b-(f-o),o=f-b,r>s){if(t.match_start=e,s=r,r>=a)break;d=l[o+s-1],p=l[o+s];}}}while((e=c[e&h])>u&&0!=--i);return s<=t.lookahead?s:t.lookahead;}function O(t){var e,n,r,o,u,l,h,c,f,d,p=t.w_size;do{if(o=t.window_size-t.lookahead-t.strstart,t.strstart>=p+(p-w)){i.arraySet(t.window,t.window,p,p,0),t.match_start-=p,t.strstart-=p,t.block_start-=p,e=n=t.hash_size;do{r=t.head[--e],t.head[e]=r>=p?r-p:0;}while(--n);e=n=p;do{r=t.prev[--e],t.prev[e]=r>=p?r-p:0;}while(--n);o+=p;}if(0===t.strm.avail_in)break;if(l=t.strm,h=t.window,c=t.strstart+t.lookahead,f=o,d=void 0,(d=l.avail_in)>f&&(d=f),n=0===d?0:(l.avail_in-=d,i.arraySet(h,l.input,l.next_in,d,c),1===l.state.wrap?l.adler=s(l.adler,h,d,c):2===l.state.wrap&&(l.adler=a(l.adler,h,d,c)),l.next_in+=d,l.total_in+=d,d),t.lookahead+=n,t.lookahead+t.insert>=y)for(u=t.strstart-t.insert,t.ins_h=t.window[u],t.ins_h=(t.ins_h<<t.hash_shift^t.window[u+1])&t.hash_mask;t.insert&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[u+y-1])&t.hash_mask,t.prev[u&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=u,u++,t.insert--,!(t.lookahead+t.insert<y)););}while(t.lookahead<w&&0!==t.strm.avail_in);}function R(t,e){for(var n,r;;){if(t.lookahead<w){if(O(t),t.lookahead<w&&e===l)return 1;if(0===t.lookahead)break;}if(n=0,t.lookahead>=y&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+y-1])&t.hash_mask,n=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==n&&t.strstart-n<=t.w_size-w&&(t.match_length=I(t,n)),t.match_length>=y){if(r=o._tr_tally(t,t.strstart-t.match_start,t.match_length-y),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=y){t.match_length--;do{t.strstart++,t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+y-1])&t.hash_mask,n=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart;}while(0!=--t.match_length);t.strstart++;}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+1])&t.hash_mask;}else r=o._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(r&&(z(t,!1),0===t.strm.avail_out))return 1;}return t.insert=t.strstart<y-1?t.strstart:y-1,4===e?(z(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(z(t,!1),0===t.strm.avail_out)?1:2;}function L(t,e){for(var n,r,i;;){if(t.lookahead<w){if(O(t),t.lookahead<w&&e===l)return 1;if(0===t.lookahead)break;}if(n=0,t.lookahead>=y&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+y-1])&t.hash_mask,n=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=y-1,0!==n&&t.prev_length<t.max_lazy_match&&t.strstart-n<=t.w_size-w&&(t.match_length=I(t,n),t.match_length<=5&&(1===t.strategy||t.match_length===y&&t.strstart-t.match_start>4096)&&(t.match_length=y-1)),t.prev_length>=y&&t.match_length<=t.prev_length){i=t.strstart+t.lookahead-y,r=o._tr_tally(t,t.strstart-1-t.prev_match,t.prev_length-y),t.lookahead-=t.prev_length-1,t.prev_length-=2;do{++t.strstart<=i&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+y-1])&t.hash_mask,n=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart);}while(0!=--t.prev_length);if(t.match_available=0,t.match_length=y-1,t.strstart++,r&&(z(t,!1),0===t.strm.avail_out))return 1;}else if(t.match_available){if((r=o._tr_tally(t,0,t.window[t.strstart-1]))&&z(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return 1;}else t.match_available=1,t.strstart++,t.lookahead--;}return t.match_available&&(r=o._tr_tally(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<y-1?t.strstart:y-1,4===e?(z(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(z(t,!1),0===t.strm.avail_out)?1:2;}function U(t,e,n,r,i){this.good_length=t,this.max_lazy=e,this.nice_length=n,this.max_chain=r,this.func=i;}function j(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=d,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new i.Buf16(2*m),this.dyn_dtree=new i.Buf16(2*(2*g+1)),this.bl_tree=new i.Buf16(2*(2*_+1)),B(this.dyn_ltree),B(this.dyn_dtree),B(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new i.Buf16(v+1),this.heap=new i.Buf16(2*p+1),B(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new i.Buf16(2*p+1),B(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0;}function P(t){var e;return t&&t.state?(t.total_in=t.total_out=0,t.data_type=f,(e=t.state).pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?x:A,t.adler=2===e.wrap?0:1,e.last_flush=l,o._tr_init(e),h):S(t,c);}function D(t){var e,n=P(t);return n===h&&((e=t.state).window_size=2*e.w_size,B(e.head),e.max_lazy_match=r[e.level].max_lazy,e.good_match=r[e.level].good_length,e.nice_match=r[e.level].nice_length,e.max_chain_length=r[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=y-1,e.match_available=0,e.ins_h=0),n;}function F(t,e,n,r,o,s){if(!t)return c;var a=1;if(-1===e&&(e=6),r<0?(a=0,r=-r):r>15&&(a=2,r-=16),o<1||o>9||n!==d||r<8||r>15||e<0||e>9||s<0||s>4)return S(t,c);8===r&&(r=9);var u=new j();return t.state=u,u.strm=t,u.wrap=a,u.gzhead=null,u.w_bits=r,u.w_size=1<<u.w_bits,u.w_mask=u.w_size-1,u.hash_bits=o+7,u.hash_size=1<<u.hash_bits,u.hash_mask=u.hash_size-1,u.hash_shift=~~((u.hash_bits+y-1)/y),u.window=new i.Buf8(2*u.w_size),u.head=new i.Buf16(u.hash_size),u.prev=new i.Buf16(u.w_size),u.lit_bufsize=1<<o+6,u.pending_buf_size=4*u.lit_bufsize,u.pending_buf=new i.Buf8(u.pending_buf_size),u.d_buf=1*u.lit_bufsize,u.l_buf=3*u.lit_bufsize,u.level=e,u.strategy=s,u.method=n,D(t);}r=[new U(0,0,0,0,function(t,e){var n=65535;for(n>t.pending_buf_size-5&&(n=t.pending_buf_size-5);;){if(t.lookahead<=1){if(O(t),0===t.lookahead&&e===l)return 1;if(0===t.lookahead)break;}t.strstart+=t.lookahead,t.lookahead=0;var r=t.block_start+n;if((0===t.strstart||t.strstart>=r)&&(t.lookahead=t.strstart-r,t.strstart=r,z(t,!1),0===t.strm.avail_out))return 1;if(t.strstart-t.block_start>=t.w_size-w&&(z(t,!1),0===t.strm.avail_out))return 1;}return t.insert=0,4===e?(z(t,!0),0===t.strm.avail_out?3:4):(t.strstart>t.block_start&&(z(t,!1),t.strm.avail_out),1);}),new U(4,4,8,4,R),new U(4,5,16,8,R),new U(4,6,32,32,R),new U(4,4,16,16,L),new U(8,16,32,32,L),new U(8,16,128,128,L),new U(8,32,128,256,L),new U(32,128,258,1024,L),new U(32,258,258,4096,L)],e.deflateInit=function(t,e){return F(t,e,d,15,8,0);},e.deflateInit2=F,e.deflateReset=D,e.deflateResetKeep=P,e.deflateSetHeader=function(t,e){return t&&t.state?2!==t.state.wrap?c:(t.state.gzhead=e,h):c;},e.deflate=function(t,e){var n,i,s,u;if(!t||!t.state||e>5||e<0)return t?S(t,c):c;if(i=t.state,!t.output||!t.input&&0!==t.avail_in||i.status===E&&4!==e)return S(t,0===t.avail_out?-5:c);if(i.strm=t,n=i.last_flush,i.last_flush=e,i.status===x)if(2===i.wrap)t.adler=0,C(i,31),C(i,139),C(i,8),i.gzhead?(C(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),C(i,255&i.gzhead.time),C(i,i.gzhead.time>>8&255),C(i,i.gzhead.time>>16&255),C(i,i.gzhead.time>>24&255),C(i,9===i.level?2:i.strategy>=2||i.level<2?4:0),C(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(C(i,255&i.gzhead.extra.length),C(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(t.adler=a(t.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(C(i,0),C(i,0),C(i,0),C(i,0),C(i,0),C(i,9===i.level?2:i.strategy>=2||i.level<2?4:0),C(i,3),i.status=A);else{var f=d+(i.w_bits-8<<4)<<8;f|=(i.strategy>=2||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(f|=32),f+=31-f%31,i.status=A,N(i,f),0!==i.strstart&&(N(i,t.adler>>>16),N(i,65535&t.adler)),t.adler=1;}if(69===i.status)if(i.gzhead.extra){for(s=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),T(t),s=i.pending,i.pending!==i.pending_buf_size));)C(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73);}else i.status=73;if(73===i.status)if(i.gzhead.name){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),T(t),s=i.pending,i.pending===i.pending_buf_size)){u=1;break;}u=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,C(i,u);}while(0!==u);i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),0===u&&(i.gzindex=0,i.status=91);}else i.status=91;if(91===i.status)if(i.gzhead.comment){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),T(t),s=i.pending,i.pending===i.pending_buf_size)){u=1;break;}u=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,C(i,u);}while(0!==u);i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),0===u&&(i.status=k);}else i.status=k;if(i.status===k&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&T(t),i.pending+2<=i.pending_buf_size&&(C(i,255&t.adler),C(i,t.adler>>8&255),t.adler=0,i.status=A)):i.status=A),0!==i.pending){if(T(t),0===t.avail_out)return i.last_flush=-1,h;}else if(0===t.avail_in&&M(e)<=M(n)&&4!==e)return S(t,-5);if(i.status===E&&0!==t.avail_in)return S(t,-5);if(0!==t.avail_in||0!==i.lookahead||e!==l&&i.status!==E){var p=2===i.strategy?function(t,e){for(var n;;){if(0===t.lookahead&&(O(t),0===t.lookahead)){if(e===l)return 1;break;}if(t.match_length=0,n=o._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,n&&(z(t,!1),0===t.strm.avail_out))return 1;}return t.insert=0,4===e?(z(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(z(t,!1),0===t.strm.avail_out)?1:2;}(i,e):3===i.strategy?function(t,e){for(var n,r,i,s,a=t.window;;){if(t.lookahead<=b){if(O(t),t.lookahead<=b&&e===l)return 1;if(0===t.lookahead)break;}if(t.match_length=0,t.lookahead>=y&&t.strstart>0&&(r=a[i=t.strstart-1])===a[++i]&&r===a[++i]&&r===a[++i]){s=t.strstart+b;do{}while(r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&i<s);t.match_length=b-(s-i),t.match_length>t.lookahead&&(t.match_length=t.lookahead);}if(t.match_length>=y?(n=o._tr_tally(t,1,t.match_length-y),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(n=o._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),n&&(z(t,!1),0===t.strm.avail_out))return 1;}return t.insert=0,4===e?(z(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(z(t,!1),0===t.strm.avail_out)?1:2;}(i,e):r[i.level].func(i,e);if(3!==p&&4!==p||(i.status=E),1===p||3===p)return 0===t.avail_out&&(i.last_flush=-1),h;if(2===p&&(1===e?o._tr_align(i):5!==e&&(o._tr_stored_block(i,0,0,!1),3===e&&(B(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),T(t),0===t.avail_out))return i.last_flush=-1,h;}return 4!==e?h:i.wrap<=0?1:(2===i.wrap?(C(i,255&t.adler),C(i,t.adler>>8&255),C(i,t.adler>>16&255),C(i,t.adler>>24&255),C(i,255&t.total_in),C(i,t.total_in>>8&255),C(i,t.total_in>>16&255),C(i,t.total_in>>24&255)):(N(i,t.adler>>>16),N(i,65535&t.adler)),T(t),i.wrap>0&&(i.wrap=-i.wrap),0!==i.pending?h:1);},e.deflateEnd=function(t){var e;return t&&t.state?(e=t.state.status)!==x&&69!==e&&73!==e&&91!==e&&e!==k&&e!==A&&e!==E?S(t,c):(t.state=null,e===A?S(t,-3):h):c;},e.deflateSetDictionary=function(t,e){var n,r,o,a,u,l,f,d,p=e.length;if(!t||!t.state)return c;if(2===(a=(n=t.state).wrap)||1===a&&n.status!==x||n.lookahead)return c;for(1===a&&(t.adler=s(t.adler,e,p,0)),n.wrap=0,p>=n.w_size&&(0===a&&(B(n.head),n.strstart=0,n.block_start=0,n.insert=0),d=new i.Buf8(n.w_size),i.arraySet(d,e,p-n.w_size,n.w_size,0),e=d,p=n.w_size),u=t.avail_in,l=t.next_in,f=t.input,t.avail_in=p,t.next_in=0,t.input=e,O(n);n.lookahead>=y;){r=n.strstart,o=n.lookahead-(y-1);do{n.ins_h=(n.ins_h<<n.hash_shift^n.window[r+y-1])&n.hash_mask,n.prev[r&n.w_mask]=n.head[n.ins_h],n.head[n.ins_h]=r,r++;}while(--o);n.strstart=r,n.lookahead=y-1,O(n);}return n.strstart+=n.lookahead,n.block_start=n.strstart,n.insert=n.lookahead,n.lookahead=0,n.match_length=n.prev_length=y-1,n.match_available=0,t.next_in=l,t.input=f,t.avail_in=u,n.wrap=a,h;},e.deflateInfo=\"pako deflate (from Nodeca project)\";},3677:function _(t){\"use strict\";t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name=\"\",this.comment=\"\",this.hcrc=0,this.done=!1;};},7424:function _(t){\"use strict\";t.exports=function(t,e){var n,r,i,o,s,a,u,l,h,c,f,d,p,g,_,m,v,y,b,w,x,k,A,E,S;n=t.state,r=t.next_in,E=t.input,i=r+(t.avail_in-5),o=t.next_out,S=t.output,s=o-(e-t.avail_out),a=o+(t.avail_out-257),u=n.dmax,l=n.wsize,h=n.whave,c=n.wnext,f=n.window,d=n.hold,p=n.bits,g=n.lencode,_=n.distcode,m=(1<<n.lenbits)-1,v=(1<<n.distbits)-1;t:do{p<15&&(d+=E[r++]<<p,p+=8,d+=E[r++]<<p,p+=8),y=g[d&m];e:for(;;){if(d>>>=b=y>>>24,p-=b,0==(b=y>>>16&255))S[o++]=65535&y;else{if(!(16&b)){if(0==(64&b)){y=g[(65535&y)+(d&(1<<b)-1)];continue e;}if(32&b){n.mode=12;break t;}t.msg=\"invalid literal/length code\",n.mode=30;break t;}w=65535&y,(b&=15)&&(p<b&&(d+=E[r++]<<p,p+=8),w+=d&(1<<b)-1,d>>>=b,p-=b),p<15&&(d+=E[r++]<<p,p+=8,d+=E[r++]<<p,p+=8),y=_[d&v];n:for(;;){if(d>>>=b=y>>>24,p-=b,!(16&(b=y>>>16&255))){if(0==(64&b)){y=_[(65535&y)+(d&(1<<b)-1)];continue n;}t.msg=\"invalid distance code\",n.mode=30;break t;}if(x=65535&y,p<(b&=15)&&(d+=E[r++]<<p,(p+=8)<b&&(d+=E[r++]<<p,p+=8)),(x+=d&(1<<b)-1)>u){t.msg=\"invalid distance too far back\",n.mode=30;break t;}if(d>>>=b,p-=b,x>(b=o-s)){if((b=x-b)>h&&n.sane){t.msg=\"invalid distance too far back\",n.mode=30;break t;}if(k=0,A=f,0===c){if(k+=l-b,b<w){w-=b;do{S[o++]=f[k++];}while(--b);k=o-x,A=S;}}else if(c<b){if(k+=l+c-b,(b-=c)<w){w-=b;do{S[o++]=f[k++];}while(--b);if(k=0,c<w){w-=b=c;do{S[o++]=f[k++];}while(--b);k=o-x,A=S;}}}else if(k+=c-b,b<w){w-=b;do{S[o++]=f[k++];}while(--b);k=o-x,A=S;}for(;w>2;)S[o++]=A[k++],S[o++]=A[k++],S[o++]=A[k++],w-=3;w&&(S[o++]=A[k++],w>1&&(S[o++]=A[k++]));}else{k=o-x;do{S[o++]=S[k++],S[o++]=S[k++],S[o++]=S[k++],w-=3;}while(w>2);w&&(S[o++]=S[k++],w>1&&(S[o++]=S[k++]));}break;}}break;}}while(r<i&&o<a);r-=w=p>>3,d&=(1<<(p-=w<<3))-1,t.next_in=r,t.next_out=o,t.avail_in=r<i?i-r+5:5-(r-i),t.avail_out=o<a?a-o+257:257-(o-a),n.hold=d,n.bits=p;};},3519:function _(t,e,n){\"use strict\";var r=n(9639),i=n(2084),o=n(1647),s=n(7424),a=n(8035),u=0,l=-2,h=1,c=12,f=30,d=852,p=592;function g(t){return(t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24);}function _(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new r.Buf16(320),this.work=new r.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0;}function m(t){var e;return t&&t.state?(e=t.state,t.total_in=t.total_out=e.total=0,t.msg=\"\",e.wrap&&(t.adler=1&e.wrap),e.mode=h,e.last=0,e.havedict=0,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new r.Buf32(d),e.distcode=e.distdyn=new r.Buf32(p),e.sane=1,e.back=-1,u):l;}function v(t){var e;return t&&t.state?((e=t.state).wsize=0,e.whave=0,e.wnext=0,m(t)):l;}function y(t,e){var n,r;return t&&t.state?(r=t.state,e<0?(n=0,e=-e):(n=1+(e>>4),e<48&&(e&=15)),e&&(e<8||e>15)?l:(null!==r.window&&r.wbits!==e&&(r.window=null),r.wrap=n,r.wbits=e,v(t))):l;}function b(t,e){var n,r;return t?(r=new _(),t.state=r,r.window=null,(n=y(t,e))!==u&&(t.state=null),n):l;}var w,x,k=!0;function A(t){if(k){var e;for(w=new r.Buf32(512),x=new r.Buf32(32),e=0;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(a(1,t.lens,0,288,w,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;a(2,t.lens,0,32,x,0,t.work,{bits:5}),k=!1;}t.lencode=w,t.lenbits=9,t.distcode=x,t.distbits=5;}function E(t,e,n,i){var o,s=t.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new r.Buf8(s.wsize)),i>=s.wsize?(r.arraySet(s.window,e,n-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):((o=s.wsize-s.wnext)>i&&(o=i),r.arraySet(s.window,e,n-i,o,s.wnext),(i-=o)?(r.arraySet(s.window,e,n-i,i,0),s.wnext=i,s.whave=s.wsize):(s.wnext+=o,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=o))),0;}e.inflateReset=v,e.inflateReset2=y,e.inflateResetKeep=m,e.inflateInit=function(t){return b(t,15);},e.inflateInit2=b,e.inflate=function(t,e){var n,d,p,_,m,v,y,b,w,x,k,S,M,B,T,z,C,N,I,O,R,L,U,j,P=0,D=new r.Buf8(4),F=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!t||!t.state||!t.output||!t.input&&0!==t.avail_in)return l;(n=t.state).mode===c&&(n.mode=13),m=t.next_out,p=t.output,y=t.avail_out,_=t.next_in,d=t.input,v=t.avail_in,b=n.hold,w=n.bits,x=v,k=y,L=u;t:for(;;)switch(n.mode){case h:if(0===n.wrap){n.mode=13;break;}for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(2&n.wrap&&35615===b){n.check=0,D[0]=255&b,D[1]=b>>>8&255,n.check=o(n.check,D,2,0),b=0,w=0,n.mode=2;break;}if(n.flags=0,n.head&&(n.head.done=!1),!(1&n.wrap)||(((255&b)<<8)+(b>>8))%31){t.msg=\"incorrect header check\",n.mode=f;break;}if(8!=(15&b)){t.msg=\"unknown compression method\",n.mode=f;break;}if(w-=4,R=8+(15&(b>>>=4)),0===n.wbits)n.wbits=R;else if(R>n.wbits){t.msg=\"invalid window size\",n.mode=f;break;}n.dmax=1<<R,t.adler=n.check=1,n.mode=512&b?10:c,b=0,w=0;break;case 2:for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(n.flags=b,8!=(255&n.flags)){t.msg=\"unknown compression method\",n.mode=f;break;}if(57344&n.flags){t.msg=\"unknown header flags set\",n.mode=f;break;}n.head&&(n.head.text=b>>8&1),512&n.flags&&(D[0]=255&b,D[1]=b>>>8&255,n.check=o(n.check,D,2,0)),b=0,w=0,n.mode=3;case 3:for(;w<32;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.head&&(n.head.time=b),512&n.flags&&(D[0]=255&b,D[1]=b>>>8&255,D[2]=b>>>16&255,D[3]=b>>>24&255,n.check=o(n.check,D,4,0)),b=0,w=0,n.mode=4;case 4:for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.head&&(n.head.xflags=255&b,n.head.os=b>>8),512&n.flags&&(D[0]=255&b,D[1]=b>>>8&255,n.check=o(n.check,D,2,0)),b=0,w=0,n.mode=5;case 5:if(1024&n.flags){for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.length=b,n.head&&(n.head.extra_len=b),512&n.flags&&(D[0]=255&b,D[1]=b>>>8&255,n.check=o(n.check,D,2,0)),b=0,w=0;}else n.head&&(n.head.extra=null);n.mode=6;case 6:if(1024&n.flags&&((S=n.length)>v&&(S=v),S&&(n.head&&(R=n.head.extra_len-n.length,n.head.extra||(n.head.extra=new Array(n.head.extra_len)),r.arraySet(n.head.extra,d,_,S,R)),512&n.flags&&(n.check=o(n.check,d,S,_)),v-=S,_+=S,n.length-=S),n.length))break t;n.length=0,n.mode=7;case 7:if(2048&n.flags){if(0===v)break t;S=0;do{R=d[_+S++],n.head&&R&&n.length<65536&&(n.head.name+=String.fromCharCode(R));}while(R&&S<v);if(512&n.flags&&(n.check=o(n.check,d,S,_)),v-=S,_+=S,R)break t;}else n.head&&(n.head.name=null);n.length=0,n.mode=8;case 8:if(4096&n.flags){if(0===v)break t;S=0;do{R=d[_+S++],n.head&&R&&n.length<65536&&(n.head.comment+=String.fromCharCode(R));}while(R&&S<v);if(512&n.flags&&(n.check=o(n.check,d,S,_)),v-=S,_+=S,R)break t;}else n.head&&(n.head.comment=null);n.mode=9;case 9:if(512&n.flags){for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(b!==(65535&n.check)){t.msg=\"header crc mismatch\",n.mode=f;break;}b=0,w=0;}n.head&&(n.head.hcrc=n.flags>>9&1,n.head.done=!0),t.adler=n.check=0,n.mode=c;break;case 10:for(;w<32;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}t.adler=n.check=g(b),b=0,w=0,n.mode=11;case 11:if(0===n.havedict)return t.next_out=m,t.avail_out=y,t.next_in=_,t.avail_in=v,n.hold=b,n.bits=w,2;t.adler=n.check=1,n.mode=c;case c:if(5===e||6===e)break t;case 13:if(n.last){b>>>=7&w,w-=7&w,n.mode=27;break;}for(;w<3;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}switch(n.last=1&b,w-=1,3&(b>>>=1)){case 0:n.mode=14;break;case 1:if(A(n),n.mode=20,6===e){b>>>=2,w-=2;break t;}break;case 2:n.mode=17;break;case 3:t.msg=\"invalid block type\",n.mode=f;}b>>>=2,w-=2;break;case 14:for(b>>>=7&w,w-=7&w;w<32;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if((65535&b)!=(b>>>16^65535)){t.msg=\"invalid stored block lengths\",n.mode=f;break;}if(n.length=65535&b,b=0,w=0,n.mode=15,6===e)break t;case 15:n.mode=16;case 16:if(S=n.length){if(S>v&&(S=v),S>y&&(S=y),0===S)break t;r.arraySet(p,d,_,S,m),v-=S,_+=S,y-=S,m+=S,n.length-=S;break;}n.mode=c;break;case 17:for(;w<14;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(n.nlen=257+(31&b),b>>>=5,w-=5,n.ndist=1+(31&b),b>>>=5,w-=5,n.ncode=4+(15&b),b>>>=4,w-=4,n.nlen>286||n.ndist>30){t.msg=\"too many length or distance symbols\",n.mode=f;break;}n.have=0,n.mode=18;case 18:for(;n.have<n.ncode;){for(;w<3;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.lens[F[n.have++]]=7&b,b>>>=3,w-=3;}for(;n.have<19;)n.lens[F[n.have++]]=0;if(n.lencode=n.lendyn,n.lenbits=7,U={bits:n.lenbits},L=a(0,n.lens,0,19,n.lencode,0,n.work,U),n.lenbits=U.bits,L){t.msg=\"invalid code lengths set\",n.mode=f;break;}n.have=0,n.mode=19;case 19:for(;n.have<n.nlen+n.ndist;){for(;z=(P=n.lencode[b&(1<<n.lenbits)-1])>>>16&255,C=65535&P,!((T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(C<16)b>>>=T,w-=T,n.lens[n.have++]=C;else{if(16===C){for(j=T+2;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(b>>>=T,w-=T,0===n.have){t.msg=\"invalid bit length repeat\",n.mode=f;break;}R=n.lens[n.have-1],S=3+(3&b),b>>>=2,w-=2;}else if(17===C){for(j=T+3;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}w-=T,R=0,S=3+(7&(b>>>=T)),b>>>=3,w-=3;}else{for(j=T+7;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}w-=T,R=0,S=11+(127&(b>>>=T)),b>>>=7,w-=7;}if(n.have+S>n.nlen+n.ndist){t.msg=\"invalid bit length repeat\",n.mode=f;break;}for(;S--;)n.lens[n.have++]=R;}}if(n.mode===f)break;if(0===n.lens[256]){t.msg=\"invalid code -- missing end-of-block\",n.mode=f;break;}if(n.lenbits=9,U={bits:n.lenbits},L=a(1,n.lens,0,n.nlen,n.lencode,0,n.work,U),n.lenbits=U.bits,L){t.msg=\"invalid literal/lengths set\",n.mode=f;break;}if(n.distbits=6,n.distcode=n.distdyn,U={bits:n.distbits},L=a(2,n.lens,n.nlen,n.ndist,n.distcode,0,n.work,U),n.distbits=U.bits,L){t.msg=\"invalid distances set\",n.mode=f;break;}if(n.mode=20,6===e)break t;case 20:n.mode=21;case 21:if(v>=6&&y>=258){t.next_out=m,t.avail_out=y,t.next_in=_,t.avail_in=v,n.hold=b,n.bits=w,s(t,k),m=t.next_out,p=t.output,y=t.avail_out,_=t.next_in,d=t.input,v=t.avail_in,b=n.hold,w=n.bits,n.mode===c&&(n.back=-1);break;}for(n.back=0;z=(P=n.lencode[b&(1<<n.lenbits)-1])>>>16&255,C=65535&P,!((T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(z&&0==(240&z)){for(N=T,I=z,O=C;z=(P=n.lencode[O+((b&(1<<N+I)-1)>>N)])>>>16&255,C=65535&P,!(N+(T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}b>>>=N,w-=N,n.back+=N;}if(b>>>=T,w-=T,n.back+=T,n.length=C,0===z){n.mode=26;break;}if(32&z){n.back=-1,n.mode=c;break;}if(64&z){t.msg=\"invalid literal/length code\",n.mode=f;break;}n.extra=15&z,n.mode=22;case 22:if(n.extra){for(j=n.extra;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.length+=b&(1<<n.extra)-1,b>>>=n.extra,w-=n.extra,n.back+=n.extra;}n.was=n.length,n.mode=23;case 23:for(;z=(P=n.distcode[b&(1<<n.distbits)-1])>>>16&255,C=65535&P,!((T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(0==(240&z)){for(N=T,I=z,O=C;z=(P=n.distcode[O+((b&(1<<N+I)-1)>>N)])>>>16&255,C=65535&P,!(N+(T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}b>>>=N,w-=N,n.back+=N;}if(b>>>=T,w-=T,n.back+=T,64&z){t.msg=\"invalid distance code\",n.mode=f;break;}n.offset=C,n.extra=15&z,n.mode=24;case 24:if(n.extra){for(j=n.extra;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.offset+=b&(1<<n.extra)-1,b>>>=n.extra,w-=n.extra,n.back+=n.extra;}if(n.offset>n.dmax){t.msg=\"invalid distance too far back\",n.mode=f;break;}n.mode=25;case 25:if(0===y)break t;if(S=k-y,n.offset>S){if((S=n.offset-S)>n.whave&&n.sane){t.msg=\"invalid distance too far back\",n.mode=f;break;}S>n.wnext?(S-=n.wnext,M=n.wsize-S):M=n.wnext-S,S>n.length&&(S=n.length),B=n.window;}else B=p,M=m-n.offset,S=n.length;S>y&&(S=y),y-=S,n.length-=S;do{p[m++]=B[M++];}while(--S);0===n.length&&(n.mode=21);break;case 26:if(0===y)break t;p[m++]=n.length,y--,n.mode=21;break;case 27:if(n.wrap){for(;w<32;){if(0===v)break t;v--,b|=d[_++]<<w,w+=8;}if(k-=y,t.total_out+=k,n.total+=k,k&&(t.adler=n.check=n.flags?o(n.check,p,k,m-k):i(n.check,p,k,m-k)),k=y,(n.flags?b:g(b))!==n.check){t.msg=\"incorrect data check\",n.mode=f;break;}b=0,w=0;}n.mode=28;case 28:if(n.wrap&&n.flags){for(;w<32;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(b!==(4294967295&n.total)){t.msg=\"incorrect length check\",n.mode=f;break;}b=0,w=0;}n.mode=29;case 29:L=1;break t;case f:L=-3;break t;case 31:return-4;default:return l;}return t.next_out=m,t.avail_out=y,t.next_in=_,t.avail_in=v,n.hold=b,n.bits=w,(n.wsize||k!==t.avail_out&&n.mode<f&&(n.mode<27||4!==e))&&E(t,t.output,t.next_out,k-t.avail_out)?(n.mode=31,-4):(x-=t.avail_in,k-=t.avail_out,t.total_in+=x,t.total_out+=k,n.total+=k,n.wrap&&k&&(t.adler=n.check=n.flags?o(n.check,p,k,t.next_out-k):i(n.check,p,k,t.next_out-k)),t.data_type=n.bits+(n.last?64:0)+(n.mode===c?128:0)+(20===n.mode||15===n.mode?256:0),(0===x&&0===k||4===e)&&L===u&&(L=-5),L);},e.inflateEnd=function(t){if(!t||!t.state)return l;var e=t.state;return e.window&&(e.window=null),t.state=null,u;},e.inflateGetHeader=function(t,e){var n;return t&&t.state?0==(2&(n=t.state).wrap)?l:(n.head=e,e.done=!1,u):l;},e.inflateSetDictionary=function(t,e){var n,r=e.length;return t&&t.state?0!==(n=t.state).wrap&&11!==n.mode?l:11===n.mode&&i(1,e,r,0)!==n.check?-3:E(t,e,r,r)?(n.mode=31,-4):(n.havedict=1,u):l;},e.inflateInfo=\"pako inflate (from Nodeca project)\";},8035:function _(t,e,n){\"use strict\";var r=n(9639),i=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],o=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],s=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],a=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(t,e,n,u,l,h,c,f){var d,p,g,_,m,v,y,b,w,x=f.bits,k=0,A=0,E=0,S=0,M=0,B=0,T=0,z=0,C=0,N=0,I=null,O=0,R=new r.Buf16(16),L=new r.Buf16(16),U=null,j=0;for(k=0;k<=15;k++)R[k]=0;for(A=0;A<u;A++)R[e[n+A]]++;for(M=x,S=15;S>=1&&0===R[S];S--);if(M>S&&(M=S),0===S)return l[h++]=20971520,l[h++]=20971520,f.bits=1,0;for(E=1;E<S&&0===R[E];E++);for(M<E&&(M=E),z=1,k=1;k<=15;k++)if(z<<=1,(z-=R[k])<0)return-1;if(z>0&&(0===t||1!==S))return-1;for(L[1]=0,k=1;k<15;k++)L[k+1]=L[k]+R[k];for(A=0;A<u;A++)0!==e[n+A]&&(c[L[e[n+A]]++]=A);if(0===t?(I=U=c,v=19):1===t?(I=i,O-=257,U=o,j-=257,v=256):(I=s,U=a,v=-1),N=0,A=0,k=E,m=h,B=M,T=0,g=-1,_=(C=1<<M)-1,1===t&&C>852||2===t&&C>592)return 1;for(;;){y=k-T,c[A]<v?(b=0,w=c[A]):c[A]>v?(b=U[j+c[A]],w=I[O+c[A]]):(b=96,w=0),d=1<<k-T,E=p=1<<B;do{l[m+(N>>T)+(p-=d)]=y<<24|b<<16|w|0;}while(0!==p);for(d=1<<k-1;N&d;)d>>=1;if(0!==d?(N&=d-1,N+=d):N=0,A++,0==--R[k]){if(k===S)break;k=e[n+c[A]];}if(k>M&&(N&_)!==g){for(0===T&&(T=M),m+=E,z=1<<(B=k-T);B+T<S&&!((z-=R[B+T])<=0);)B++,z<<=1;if(C+=1<<B,1===t&&C>852||2===t&&C>592)return 1;l[g=N&_]=M<<24|B<<16|m-h|0;}}return 0!==N&&(l[m+N]=k-T<<24|64<<16|0),f.bits=M,0;};},5837:function _(t){\"use strict\";t.exports={2:\"need dictionary\",1:\"stream end\",0:\"\",\"-1\":\"file error\",\"-2\":\"stream error\",\"-3\":\"data error\",\"-4\":\"insufficient memory\",\"-5\":\"buffer error\",\"-6\":\"incompatible version\"};},2169:function _(t,e,n){\"use strict\";var r=n(9639);function i(t){for(var e=t.length;--e>=0;)t[e]=0;}var o=256,s=286,a=30,u=15,l=16,h=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],c=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],f=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],d=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],p=new Array(576);i(p);var g=new Array(60);i(g);var _=new Array(512);i(_);var m=new Array(256);i(m);var v=new Array(29);i(v);var y,b,w,x=new Array(a);function k(t,e,n,r,i){this.static_tree=t,this.extra_bits=e,this.extra_base=n,this.elems=r,this.max_length=i,this.has_stree=t&&t.length;}function A(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e;}function E(t){return t<256?_[t]:_[256+(t>>>7)];}function S(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255;}function M(t,e,n){t.bi_valid>l-n?(t.bi_buf|=e<<t.bi_valid&65535,S(t,t.bi_buf),t.bi_buf=e>>l-t.bi_valid,t.bi_valid+=n-l):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=n);}function B(t,e,n){M(t,n[2*e],n[2*e+1]);}function T(t,e){var n=0;do{n|=1&t,t>>>=1,n<<=1;}while(--e>0);return n>>>1;}function z(t,e,n){var r,i,o=new Array(u+1),s=0;for(r=1;r<=u;r++)o[r]=s=s+n[r-1]<<1;for(i=0;i<=e;i++){var a=t[2*i+1];0!==a&&(t[2*i]=T(o[a]++,a));}}function C(t){var e;for(e=0;e<s;e++)t.dyn_ltree[2*e]=0;for(e=0;e<a;e++)t.dyn_dtree[2*e]=0;for(e=0;e<19;e++)t.bl_tree[2*e]=0;t.dyn_ltree[512]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0;}function N(t){t.bi_valid>8?S(t,t.bi_buf):t.bi_valid>0&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0;}function I(t,e,n,r){var i=2*e,o=2*n;return t[i]<t[o]||t[i]===t[o]&&r[e]<=r[n];}function O(t,e,n){for(var r=t.heap[n],i=n<<1;i<=t.heap_len&&(i<t.heap_len&&I(e,t.heap[i+1],t.heap[i],t.depth)&&i++,!I(e,r,t.heap[i],t.depth));)t.heap[n]=t.heap[i],n=i,i<<=1;t.heap[n]=r;}function R(t,e,n){var r,i,s,a,u=0;if(0!==t.last_lit)do{r=t.pending_buf[t.d_buf+2*u]<<8|t.pending_buf[t.d_buf+2*u+1],i=t.pending_buf[t.l_buf+u],u++,0===r?B(t,i,e):(B(t,(s=m[i])+o+1,e),0!==(a=h[s])&&M(t,i-=v[s],a),B(t,s=E(--r),n),0!==(a=c[s])&&M(t,r-=x[s],a));}while(u<t.last_lit);B(t,256,e);}function L(t,e){var n,r,i,o=e.dyn_tree,s=e.stat_desc.static_tree,a=e.stat_desc.has_stree,l=e.stat_desc.elems,h=-1;for(t.heap_len=0,t.heap_max=573,n=0;n<l;n++)0!==o[2*n]?(t.heap[++t.heap_len]=h=n,t.depth[n]=0):o[2*n+1]=0;for(;t.heap_len<2;)o[2*(i=t.heap[++t.heap_len]=h<2?++h:0)]=1,t.depth[i]=0,t.opt_len--,a&&(t.static_len-=s[2*i+1]);for(e.max_code=h,n=t.heap_len>>1;n>=1;n--)O(t,o,n);i=l;do{n=t.heap[1],t.heap[1]=t.heap[t.heap_len--],O(t,o,1),r=t.heap[1],t.heap[--t.heap_max]=n,t.heap[--t.heap_max]=r,o[2*i]=o[2*n]+o[2*r],t.depth[i]=(t.depth[n]>=t.depth[r]?t.depth[n]:t.depth[r])+1,o[2*n+1]=o[2*r+1]=i,t.heap[1]=i++,O(t,o,1);}while(t.heap_len>=2);t.heap[--t.heap_max]=t.heap[1],function(t,e){var n,r,i,o,s,a,l=e.dyn_tree,h=e.max_code,c=e.stat_desc.static_tree,f=e.stat_desc.has_stree,d=e.stat_desc.extra_bits,p=e.stat_desc.extra_base,g=e.stat_desc.max_length,_=0;for(o=0;o<=u;o++)t.bl_count[o]=0;for(l[2*t.heap[t.heap_max]+1]=0,n=t.heap_max+1;n<573;n++)(o=l[2*l[2*(r=t.heap[n])+1]+1]+1)>g&&(o=g,_++),l[2*r+1]=o,r>h||(t.bl_count[o]++,s=0,r>=p&&(s=d[r-p]),a=l[2*r],t.opt_len+=a*(o+s),f&&(t.static_len+=a*(c[2*r+1]+s)));if(0!==_){do{for(o=g-1;0===t.bl_count[o];)o--;t.bl_count[o]--,t.bl_count[o+1]+=2,t.bl_count[g]--,_-=2;}while(_>0);for(o=g;0!==o;o--)for(r=t.bl_count[o];0!==r;)(i=t.heap[--n])>h||(l[2*i+1]!==o&&(t.opt_len+=(o-l[2*i+1])*l[2*i],l[2*i+1]=o),r--);}}(t,e),z(o,h,t.bl_count);}function U(t,e,n){var r,i,o=-1,s=e[1],a=0,u=7,l=4;for(0===s&&(u=138,l=3),e[2*(n+1)+1]=65535,r=0;r<=n;r++)i=s,s=e[2*(r+1)+1],++a<u&&i===s||(a<l?t.bl_tree[2*i]+=a:0!==i?(i!==o&&t.bl_tree[2*i]++,t.bl_tree[32]++):a<=10?t.bl_tree[34]++:t.bl_tree[36]++,a=0,o=i,0===s?(u=138,l=3):i===s?(u=6,l=3):(u=7,l=4));}function j(t,e,n){var r,i,o=-1,s=e[1],a=0,u=7,l=4;for(0===s&&(u=138,l=3),r=0;r<=n;r++)if(i=s,s=e[2*(r+1)+1],!(++a<u&&i===s)){if(a<l)do{B(t,i,t.bl_tree);}while(0!=--a);else 0!==i?(i!==o&&(B(t,i,t.bl_tree),a--),B(t,16,t.bl_tree),M(t,a-3,2)):a<=10?(B(t,17,t.bl_tree),M(t,a-3,3)):(B(t,18,t.bl_tree),M(t,a-11,7));a=0,o=i,0===s?(u=138,l=3):i===s?(u=6,l=3):(u=7,l=4);}}i(x);var P=!1;function D(t,e,n,i){M(t,0+(i?1:0),3),function(t,e,n,i){N(t),S(t,n),S(t,~n),r.arraySet(t.pending_buf,t.window,e,n,t.pending),t.pending+=n;}(t,e,n);}e._tr_init=function(t){P||(function(){var t,e,n,r,i,o=new Array(u+1);for(n=0,r=0;r<28;r++)for(v[r]=n,t=0;t<1<<h[r];t++)m[n++]=r;for(m[n-1]=r,i=0,r=0;r<16;r++)for(x[r]=i,t=0;t<1<<c[r];t++)_[i++]=r;for(i>>=7;r<a;r++)for(x[r]=i<<7,t=0;t<1<<c[r]-7;t++)_[256+i++]=r;for(e=0;e<=u;e++)o[e]=0;for(t=0;t<=143;)p[2*t+1]=8,t++,o[8]++;for(;t<=255;)p[2*t+1]=9,t++,o[9]++;for(;t<=279;)p[2*t+1]=7,t++,o[7]++;for(;t<=287;)p[2*t+1]=8,t++,o[8]++;for(z(p,287,o),t=0;t<a;t++)g[2*t+1]=5,g[2*t]=T(t,5);y=new k(p,h,257,s,u),b=new k(g,c,0,a,u),w=new k(new Array(0),f,0,19,7);}(),P=!0),t.l_desc=new A(t.dyn_ltree,y),t.d_desc=new A(t.dyn_dtree,b),t.bl_desc=new A(t.bl_tree,w),t.bi_buf=0,t.bi_valid=0,C(t);},e._tr_stored_block=D,e._tr_flush_block=function(t,e,n,r){var i,s,a=0;t.level>0?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,n=4093624447;for(e=0;e<=31;e++,n>>>=1)if(1&n&&0!==t.dyn_ltree[2*e])return 0;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return 1;for(e=32;e<o;e++)if(0!==t.dyn_ltree[2*e])return 1;return 0;}(t)),L(t,t.l_desc),L(t,t.d_desc),a=function(t){var e;for(U(t,t.dyn_ltree,t.l_desc.max_code),U(t,t.dyn_dtree,t.d_desc.max_code),L(t,t.bl_desc),e=18;e>=3&&0===t.bl_tree[2*d[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e;}(t),i=t.opt_len+3+7>>>3,(s=t.static_len+3+7>>>3)<=i&&(i=s)):i=s=n+5,n+4<=i&&-1!==e?D(t,e,n,r):4===t.strategy||s===i?(M(t,2+(r?1:0),3),R(t,p,g)):(M(t,4+(r?1:0),3),function(t,e,n,r){var i;for(M(t,e-257,5),M(t,n-1,5),M(t,r-4,4),i=0;i<r;i++)M(t,t.bl_tree[2*d[i]+1],3);j(t,t.dyn_ltree,e-1),j(t,t.dyn_dtree,n-1);}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,a+1),R(t,t.dyn_ltree,t.dyn_dtree)),C(t),r&&N(t);},e._tr_tally=function(t,e,n){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&n,t.last_lit++,0===e?t.dyn_ltree[2*n]++:(t.matches++,e--,t.dyn_ltree[2*(m[n]+o+1)]++,t.dyn_dtree[2*E(e)]++),t.last_lit===t.lit_bufsize-1;},e._tr_align=function(t){M(t,2,3),B(t,256,p),function(t){16===t.bi_valid?(S(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):t.bi_valid>=8&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8);}(t);};},6916:function _(t){\"use strict\";t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg=\"\",this.state=null,this.data_type=2,this.adler=0;};},7298:function _(t){\"use strict\";var e=/*#__PURE__*/function(_Symbol$iterator){function e(){var t=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};_classCallCheck(this,e);if(!(t.maxSize&&t.maxSize>0))throw new TypeError(\"`maxSize` must be a number greater than 0\");this.maxSize=t.maxSize,this.cache=new Map(),this.oldCache=new Map(),this._size=0;}_createClass(e,[{key:\"_set\",value:function _set(t,_e2){this.cache.set(t,_e2),this._size++,this._size>=this.maxSize&&(this._size=0,this.oldCache=this.cache,this.cache=new Map());}},{key:\"get\",value:function get(t){if(this.cache.has(t))return this.cache.get(t);if(this.oldCache.has(t)){var _e3=this.oldCache.get(t);return this.oldCache[\"delete\"](t),this._set(t,_e3),_e3;}}},{key:\"set\",value:function set(t,_e4){return this.cache.has(t)?this.cache.set(t,_e4):this._set(t,_e4),this;}},{key:\"has\",value:function has(t){return this.cache.has(t)||this.oldCache.has(t);}},{key:\"peek\",value:function peek(t){return this.cache.has(t)?this.cache.get(t):this.oldCache.has(t)?this.oldCache.get(t):void 0;}},{key:\"delete\",value:function _delete(t){var _e5=this.cache[\"delete\"](t);return _e5&&this._size--,this.oldCache[\"delete\"](t)||_e5;}},{key:\"clear\",value:function clear(){this.cache.clear(),this.oldCache.clear(),this._size=0;}},{key:\"keys\",value:/*#__PURE__*/_regeneratorRuntime().mark(function keys(){var _iterator2,_step2,_step2$value,_t2;return _regeneratorRuntime().wrap(function keys$(_context){while(1)switch(_context.prev=_context.next){case 0:_iterator2=_createForOfIteratorHelper(this);_context.prev=1;_iterator2.s();case 3:if((_step2=_iterator2.n()).done){_context.next=9;break;}_step2$value=_slicedToArray(_step2.value,1),_t2=_step2$value[0];_context.next=7;return _t2;case 7:_context.next=3;break;case 9:_context.next=14;break;case 11:_context.prev=11;_context.t0=_context[\"catch\"](1);_iterator2.e(_context.t0);case 14:_context.prev=14;_iterator2.f();return _context.finish(14);case 17:case\"end\":return _context.stop();}},keys,this,[[1,11,14,17]]);})},{key:\"values\",value:/*#__PURE__*/_regeneratorRuntime().mark(function values(){var _iterator3,_step3,_step3$value,_t3;return _regeneratorRuntime().wrap(function values$(_context2){while(1)switch(_context2.prev=_context2.next){case 0:_iterator3=_createForOfIteratorHelper(this);_context2.prev=1;_iterator3.s();case 3:if((_step3=_iterator3.n()).done){_context2.next=9;break;}_step3$value=_slicedToArray(_step3.value,2),_t3=_step3$value[1];_context2.next=7;return _t3;case 7:_context2.next=3;break;case 9:_context2.next=14;break;case 11:_context2.prev=11;_context2.t0=_context2[\"catch\"](1);_iterator3.e(_context2.t0);case 14:_context2.prev=14;_iterator3.f();return _context2.finish(14);case 17:case\"end\":return _context2.stop();}},values,this,[[1,11,14,17]]);})},{key:_Symbol$iterator,value:/*#__PURE__*/_regeneratorRuntime().mark(function value(){var _iterator4,_step4,_t4,_iterator5,_step5,_t5,_t6,_e6;return _regeneratorRuntime().wrap(function value$(_context3){while(1)switch(_context3.prev=_context3.next){case 0:_iterator4=_createForOfIteratorHelper(this.cache);_context3.prev=1;_iterator4.s();case 3:if((_step4=_iterator4.n()).done){_context3.next=9;break;}_t4=_step4.value;_context3.next=7;return _t4;case 7:_context3.next=3;break;case 9:_context3.next=14;break;case 11:_context3.prev=11;_context3.t0=_context3[\"catch\"](1);_iterator4.e(_context3.t0);case 14:_context3.prev=14;_iterator4.f();return _context3.finish(14);case 17:_iterator5=_createForOfIteratorHelper(this.oldCache);_context3.prev=18;_iterator5.s();case 20:if((_step5=_iterator5.n()).done){_context3.next=29;break;}_t5=_step5.value;_t6=_slicedToArray(_t5,1),_e6=_t6[0];_context3.t1=this.cache.has(_e6);if(_context3.t1){_context3.next=27;break;}_context3.next=27;return _t5;case 27:_context3.next=20;break;case 29:_context3.next=34;break;case 31:_context3.prev=31;_context3.t2=_context3[\"catch\"](18);_iterator5.e(_context3.t2);case 34:_context3.prev=34;_iterator5.f();return _context3.finish(34);case 37:case\"end\":return _context3.stop();}},value,this,[[1,11,14,17],[18,31,34,37]]);})},{key:\"size\",get:function get(){var t=0;var _iterator6=_createForOfIteratorHelper(this.oldCache.keys()),_step6;try{for(_iterator6.s();!(_step6=_iterator6.n()).done;){var _e7=_step6.value;this.cache.has(_e7)||t++;}}catch(err){_iterator6.e(err);}finally{_iterator6.f();}return this._size+t;}}]);return e;}(Symbol.iterator);t.exports=e;},6248:function _(t){t.exports=function(_ref2){var t=_ref2.dataset,e=_ref2.epsilon,n=_ref2.epsilonCompare,r=_ref2.minimumPoints,i=_ref2.distanceFunction;e=e||1,n=n||function(t,e){return t<e;},r=r||2,i=i||function(t,e){return Math.abs(t-e);};var o={},s=function s(t){return o[t];},a=function a(t){o[t]=!0;},u={},l=function l(t){return u[t];},h=function h(t,e){for(var n=0;n<e.length;n+=1){var r=e[n];t.indexOf(r)<0&&t.push(r);}},c=function c(r){for(var o=[],s=0;s<t.length;s+=1){var a=i(t[r],t[s]);n(a,e)&&o.push(s);}return o;},f=[],d=[],p=function p(t,e){d[t].push(e),function(t){u[t]=!0;}(e);};return t.forEach(function(t,e){if(!s(e)){a(e);var n=c(e);if(n.length<r)f.push(e);else{var i=d.push([])-1;p(i,e),function(t,e){for(var n=0;n<e.length;n+=1){var i=e[n];if(!s(i)){a(i);var o=c(i);o.length>=r&&h(e,o);}l(i)||p(t,i);}}(i,n);}}}),{clusters:d,noise:f};};},4803:function _(t,e){\"use strict\";e.eN=e.WI=e.eM=e.bP=void 0;var n=function n(t,e){var n=0;var r=Math.min(t.length,e.length);var i=0;for(;n<r;)i+=(t[n]-e[n])*(t[n]-e[n]),++n;return Math.sqrt(i);};e.WI=n,e.eN=function(t,e){var n=0;var r=Math.min(t.length,e.length);var i=0,o=0;for(;n<r;)t[n]!==e[n]?++i:0!==t[n]&&++o,++n;return 0!==i?1-o/(o+2*i):0;};var r=function r(t,e,n){var r=0;var _iterator7=_createForOfIteratorHelper(t),_step7;try{for(_iterator7.s();!(_step7=_iterator7.n()).done;){var _i2=_step7.value;var _iterator8=_createForOfIteratorHelper(e),_step8;try{for(_iterator8.s();!(_step8=_iterator8.n()).done;){var _t7=_step8.value;r+=n[_i2][_t7];}}catch(err){_iterator8.e(err);}finally{_iterator8.f();}}}catch(err){_iterator7.e(err);}finally{_iterator7.f();}return r/t.length/e.length;};e.bP=r;var i=function i(t,e,n){var r=t/2+e/2;\"function\"==typeof n&&n(r),\"undefined\"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope&&postMessage(r);};e.eM=function(_ref3){var _ref3$data=_ref3.data,t=_ref3$data===void 0?[]:_ref3$data,_ref3$key=_ref3.key,e=_ref3$key===void 0?\"\":_ref3$key,_ref3$distance=_ref3.distance,o=_ref3$distance===void 0?n:_ref3$distance,_ref3$linkage=_ref3.linkage,s=_ref3$linkage===void 0?r:_ref3$linkage,_ref3$onProgress=_ref3.onProgress,a=_ref3$onProgress===void 0?null:_ref3$onProgress;e&&(t=t.map(function(t){return t[e];}));var u=t.map(function(e,n){return i(0,n/(t.length-1),a),t.map(function(t){return o(e,t);});}),l=t.map(function(t,e){return{height:0,indexes:[Number(e)]};});var h=[];for(var _e8=0;_e8<t.length&&(i(1,(_e8+1)/t.length,a),h.push(l.map(function(t){return t.indexes;})),!(_e8>=t.length-1));_e8++){var _t8=1/0,_e9=0,_n3=0;for(var _r2=0;_r2<l.length;_r2++)for(var _i3=_r2+1;_i3<l.length;_i3++){var _o2=s(l[_r2].indexes,l[_i3].indexes,u);_o2<_t8&&(_t8=_o2,_e9=_r2,_n3=_i3);}var _r3={indexes:[].concat(_toConsumableArray(l[_e9].indexes),_toConsumableArray(l[_n3].indexes)),height:_t8,children:[l[_e9],l[_n3]]};l.splice(Math.max(_e9,_n3),1),l.splice(Math.min(_e9,_n3),1),l.push(_r3);}return h=[[]].concat(_toConsumableArray(h.reverse())),{clusters:l[0],distances:u,order:l[0].indexes,clustersGivenK:h};};},496:function _(t,e,n){\"use strict\";n.r(e),n.d(e,{BgzipIndexedFasta:function BgzipIndexedFasta(){return d;},FetchableSmallFasta:function FetchableSmallFasta(){return g;},IndexedFasta:function IndexedFasta(){return f;},parseSmallFasta:function parseSmallFasta(){return p;}});var r=n(2949),i=n(8764),o=n(9591),s=n(3720),a=n.n(s);var u=/*#__PURE__*/function(){function u(_ref4){var t=_ref4.filehandle,e=_ref4.path;_classCallCheck(this,u);if(t)this.filehandle=t;else{if(!e)throw new TypeError(\"either filehandle or path must be defined\");this.filehandle=new r.S9(e);}}_createClass(u,[{key:\"_readLongWithOverflow\",value:function _readLongWithOverflow(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;var n=arguments.length>2&&arguments[2]!==undefined?arguments[2]:!0;var r=a().fromBytesLE(t.slice(e,e+8),n);if(r.greaterThan(Number.MAX_SAFE_INTEGER)||r.lessThan(Number.MIN_SAFE_INTEGER))throw new TypeError(\"integer overflow\");return r.toNumber();}},{key:\"_getIndex\",value:function _getIndex(){return this.index||(this.index=this._readIndex()),this.index;}},{key:\"_readIndex\",value:function(){var _readIndex2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(){var t,e,n,r,_r4,_e10,_i4;return _regeneratorRuntime().wrap(function _callee$(_context4){while(1)switch(_context4.prev=_context4.next){case 0:t=i.lW.allocUnsafe(8);_context4.next=3;return this.filehandle.read(t,0,8,0);case 3:e=this._readLongWithOverflow(t,0,!0);if(e){_context4.next=6;break;}return _context4.abrupt(\"return\",[[0,0]]);case 6:n=new Array(e+1);n[0]=[0,0];r=16*e;if(!(r>Number.MAX_SAFE_INTEGER)){_context4.next=11;break;}throw new TypeError(\"integer overflow\");case 11:t=i.lW.allocUnsafe(r);_context4.next=14;return this.filehandle.read(t,0,r,8);case 14:for(_r4=0;_r4<e;_r4+=1){_e10=this._readLongWithOverflow(t,16*_r4),_i4=this._readLongWithOverflow(t,16*_r4+8);n[_r4+1]=[_e10,_i4];}return _context4.abrupt(\"return\",n);case 16:case\"end\":return _context4.stop();}},_callee,this);}));function _readIndex(){return _readIndex2.apply(this,arguments);}return _readIndex;}()},{key:\"getLastBlock\",value:function(){var _getLastBlock=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(){var t;return _regeneratorRuntime().wrap(function _callee2$(_context5){while(1)switch(_context5.prev=_context5.next){case 0:_context5.next=2;return this._getIndex();case 2:t=_context5.sent;if(!t.length){_context5.next=5;break;}return _context5.abrupt(\"return\",t[t.length-1]);case 5:case\"end\":return _context5.stop();}},_callee2,this);}));function getLastBlock(){return _getLastBlock.apply(this,arguments);}return getLastBlock;}()},{key:\"getRelevantBlocksForRead\",value:function(){var _getRelevantBlocksForRead=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(t,e){var n,r,i,o,s,a,_u2,l,h;return _regeneratorRuntime().wrap(function _callee3$(_context6){while(1)switch(_context6.prev=_context6.next){case 0:n=e+t;if(!(0===t)){_context6.next=3;break;}return _context6.abrupt(\"return\",[]);case 3:_context6.next=5;return this._getIndex();case 5:r=_context6.sent;i=[];o=function o(t,n){var r=t[1],i=n?n[1]:1/0;return r<=e&&i>e?0:r<e?-1:1;};s=0,a=r.length-1,_u2=Math.floor(r.length/2),l=o(r[_u2],r[_u2+1]);for(;0!==l;)l>0?a=_u2-1:l<0&&(s=_u2+1),_u2=Math.ceil((a-s)/2)+s,l=o(r[_u2],r[_u2+1]);i.push(r[_u2]);h=_u2+1;for(;h<r.length&&(i.push(r[h]),!(r[h][1]>=n));h+=1);return _context6.abrupt(\"return\",(i[i.length-1][1]<n&&i.push([]),i));case 14:case\"end\":return _context6.stop();}},_callee3,this);}));function getRelevantBlocksForRead(_x,_x2){return _getRelevantBlocksForRead.apply(this,arguments);}return getRelevantBlocksForRead;}()}]);return u;}();var l=/*#__PURE__*/function(){function l(_ref5){var t=_ref5.filehandle,e=_ref5.path,n=_ref5.gziFilehandle,i=_ref5.gziPath;_classCallCheck(this,l);if(t)this.filehandle=t;else{if(!e)throw new TypeError(\"either filehandle or path must be defined\");this.filehandle=new r.S9(e);}if(!n&&!i&&!e)throw new TypeError(\"either gziFilehandle or gziPath must be defined\");this.gzi=new u({filehandle:n,path:n||i||!e?\"\".concat(e,\".gzi\"):i});}_createClass(l,[{key:\"stat\",value:function(){var _stat=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(){var t;return _regeneratorRuntime().wrap(function _callee4$(_context7){while(1)switch(_context7.prev=_context7.next){case 0:_context7.next=2;return this.filehandle.stat();case 2:t=_context7.sent;_context7.t0=Object;_context7.t1=t;_context7.next=7;return this.getUncompressedFileSize();case 7:_context7.t2=_context7.sent;_context7.t3=void 0;_context7.t4=void 0;_context7.t5={size:_context7.t2,blocks:_context7.t3,blksize:_context7.t4};return _context7.abrupt(\"return\",_context7.t0.assign.call(_context7.t0,_context7.t1,_context7.t5));case 12:case\"end\":return _context7.stop();}},_callee4,this);}));function stat(){return _stat.apply(this,arguments);}return stat;}()},{key:\"getUncompressedFileSize\",value:function(){var _getUncompressedFileSize=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(){var _yield$this$gzi$getLa,_yield$this$gzi$getLa2,t,_yield$this$filehandl,e,n,_yield$this$filehandl2,r;return _regeneratorRuntime().wrap(function _callee5$(_context8){while(1)switch(_context8.prev=_context8.next){case 0:_context8.next=2;return this.gzi.getLastBlock();case 2:_yield$this$gzi$getLa=_context8.sent;_yield$this$gzi$getLa2=_slicedToArray(_yield$this$gzi$getLa,2);t=_yield$this$gzi$getLa2[1];_context8.next=7;return this.filehandle.stat();case 7:_yield$this$filehandl=_context8.sent;e=_yield$this$filehandl.size;n=i.lW.allocUnsafe(4);_context8.next=12;return this.filehandle.read(n,0,4,e-28-4);case 12:_yield$this$filehandl2=_context8.sent;r=_yield$this$filehandl2.bytesRead;if(!(4!==r)){_context8.next=16;break;}throw new Error(\"read error\");case 16:return _context8.abrupt(\"return\",t+n.readUInt32LE(0));case 17:case\"end\":return _context8.stop();}},_callee5,this);}));function getUncompressedFileSize(){return _getUncompressedFileSize.apply(this,arguments);}return getUncompressedFileSize;}()},{key:\"_readAndUncompressBlock\",value:function(){var _readAndUncompressBlock2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(t,_ref6,_ref7){var _ref8,e,_ref9,n,r,s;return _regeneratorRuntime().wrap(function _callee7$(_context10){while(1)switch(_context10.prev=_context10.next){case 0:_ref8=_slicedToArray(_ref6,1),e=_ref8[0];_ref9=_slicedToArray(_ref7,1),n=_ref9[0];r=n;_context10.t0=r;if(_context10.t0){_context10.next=8;break;}_context10.next=7;return this.filehandle.stat();case 7:r=_context10.sent.size;case 8:s=r-e;_context10.next=11;return this.filehandle.read(t,0,s,e);case 11:_context10.next=13;return function(){var _ref10=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(t){var _e11,_n4,_r5,_s2,_a3,_u3,_a4,_i5,_l3,_t9,_e12;return _regeneratorRuntime().wrap(function _callee6$(_context9){while(1)switch(_context9.prev=_context9.next){case 0:_context9.prev=0;_n4=0,_r5=0;_s2=[];_u3=0;case 4:_i5=t.subarray(_n4);if(!(_a3=new o.Inflate(),(_a4=_a3,_e11=_a4.strm),_a3.push(_i5,o.Z_SYNC_FLUSH),_a3.err)){_context9.next=7;break;}throw new Error(_a3.msg);case 7:_n4+=_e11.next_in,_s2[_r5]=_a3.result,_u3+=_s2[_r5].length,_r5+=1;case 8:if(_e11.avail_in){_context9.next=4;break;}case 9:_l3=new Uint8Array(_u3);for(_t9=0,_e12=0;_t9<_s2.length;_t9++)_l3.set(_s2[_t9],_e12),_e12+=_s2[_t9].length;return _context9.abrupt(\"return\",i.lW.from(_l3));case 14:_context9.prev=14;_context9.t0=_context9[\"catch\"](0);if(!\"\".concat(_context9.t0).match(/incorrect header check/)){_context9.next=18;break;}throw new Error(\"problem decompressing block: incorrect gzip header check\");case 18:throw _context9.t0;case 19:case\"end\":return _context9.stop();}},_callee6,null,[[0,14]]);}));return function(_x6){return _ref10.apply(this,arguments);};}()(t.slice(0,s));case 13:return _context10.abrupt(\"return\",_context10.sent);case 14:case\"end\":return _context10.stop();}},_callee7,this);}));function _readAndUncompressBlock(_x3,_x4,_x5){return _readAndUncompressBlock2.apply(this,arguments);}return _readAndUncompressBlock;}()},{key:\"read\",value:function(){var _read=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(t,e,n,r){var o,s,a,u,_e13,_i6,_o$_e,_l2,_h2,_c2;return _regeneratorRuntime().wrap(function _callee8$(_context11){while(1)switch(_context11.prev=_context11.next){case 0:_context11.next=2;return this.gzi.getRelevantBlocksForRead(n,r);case 2:o=_context11.sent;s=i.lW.allocUnsafe(65536);a=e,u=0;_e13=0;case 6:if(!(_e13<o.length-1)){_context11.next=18;break;}_context11.next=9;return this._readAndUncompressBlock(s,o[_e13],o[_e13+1]);case 9:_i6=_context11.sent;_o$_e=_slicedToArray(o[_e13],2);_l2=_o$_e[1];_h2=_l2>=r?0:r-_l2;_c2=Math.min(r+n,_l2+_i6.length)-_l2;_h2>=0&&_h2<_i6.length&&(_i6.copy(t,a,_h2,_c2),a+=_c2-_h2,u+=_c2-_h2);case 15:_e13+=1;_context11.next=6;break;case 18:return _context11.abrupt(\"return\",{bytesRead:u,buffer:t});case 19:case\"end\":return _context11.stop();}},_callee8,this);}));function read(_x7,_x8,_x9,_x10){return _read.apply(this,arguments);}return read;}()}]);return l;}();var h=n(8764).lW;function c(t,e){return t.offset+t.lineBytes*Math.floor(e/t.lineLength)+e%t.lineLength;}var f=/*#__PURE__*/function(){function f(_ref11){var t=_ref11.fasta,e=_ref11.fai,n=_ref11.path,i=_ref11.faiPath;_classCallCheck(this,f);if(t)this.fasta=t;else{if(!n)throw new Error(\"Need to pass filehandle for fasta or path to localfile\");this.fasta=new r.S9(n);}if(e)this.fai=e;else if(i)this.fai=new r.S9(i);else{if(!n)throw new Error(\"Need to pass filehandle for  or path to localfile\");this.fai=new r.S9(\"\".concat(n,\".fai\"));}}_createClass(f,[{key:\"_getIndexes\",value:function(){var _getIndexes2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(t){return _regeneratorRuntime().wrap(function _callee10$(_context13){while(1)switch(_context13.prev=_context13.next){case 0:return _context13.abrupt(\"return\",(this.indexes||(this.indexes=function(){var _ref12=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(t,e){var n,r,i,o;return _regeneratorRuntime().wrap(function _callee9$(_context12){while(1)switch(_context12.prev=_context12.next){case 0:_context12.next=2;return t.readFile(e);case 2:n=_context12.sent;if(!(!n||!n.length)){_context12.next=5;break;}throw new Error(\"No data read from FASTA index (FAI) file\");case 5:i=0;o=n.toString(\"utf8\").split(/\\r?\\n/).filter(function(t){return /\\S/.test(t);}).map(function(t){return t.split(\"\\t\");}).filter(function(t){return\"\"!==t[0];}).map(function(t){return r&&r.name===t[0]||(r={name:t[0],id:i},i+=1),{id:r.id,name:t[0],length:+t[1],start:0,end:+t[1],offset:+t[2],lineLength:+t[3],lineBytes:+t[4]};});return _context12.abrupt(\"return\",{name:Object.fromEntries(o.map(function(t){return[t.name,t];})),id:Object.fromEntries(o.map(function(t){return[t.id,t];}))});case 8:case\"end\":return _context12.stop();}},_callee9);}));return function(_x12,_x13){return _ref12.apply(this,arguments);};}()(this.fai,t)),this.indexes));case 1:case\"end\":return _context13.stop();}},_callee10,this);}));function _getIndexes(_x11){return _getIndexes2.apply(this,arguments);}return _getIndexes;}()},{key:\"getSequenceNames\",value:function(){var _getSequenceNames=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(t){return _regeneratorRuntime().wrap(function _callee11$(_context14){while(1)switch(_context14.prev=_context14.next){case 0:_context14.t0=Object;_context14.next=3;return this._getIndexes(t);case 3:_context14.t1=_context14.sent.name;return _context14.abrupt(\"return\",_context14.t0.keys.call(_context14.t0,_context14.t1));case 5:case\"end\":return _context14.stop();}},_callee11,this);}));function getSequenceNames(_x14){return _getSequenceNames.apply(this,arguments);}return getSequenceNames;}()},{key:\"getSequenceSizes\",value:function(){var _getSequenceSizes=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(t){var e,n,r,_t10;return _regeneratorRuntime().wrap(function _callee12$(_context15){while(1)switch(_context15.prev=_context15.next){case 0:e={};_context15.next=3;return this._getIndexes(t);case 3:n=_context15.sent;r=Object.values(n.id);for(_t10=0;_t10<r.length;_t10+=1)e[r[_t10].name]=r[_t10].length;return _context15.abrupt(\"return\",e);case 7:case\"end\":return _context15.stop();}},_callee12,this);}));function getSequenceSizes(_x15){return _getSequenceSizes.apply(this,arguments);}return getSequenceSizes;}()},{key:\"getSequenceSize\",value:function(){var _getSequenceSize=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(t,e){var n;return _regeneratorRuntime().wrap(function _callee13$(_context16){while(1)switch(_context16.prev=_context16.next){case 0:_context16.next=2;return this._getIndexes(e);case 2:_context16.t1=t;_context16.t2=n=_context16.sent.name[_context16.t1];_context16.t0=null===_context16.t2;if(_context16.t0){_context16.next=7;break;}_context16.t0=void 0===n;case 7:if(!_context16.t0){_context16.next=11;break;}_context16.t3=void 0;_context16.next=12;break;case 11:_context16.t3=n.length;case 12:return _context16.abrupt(\"return\",_context16.t3);case 13:case\"end\":return _context16.stop();}},_callee13,this);}));function getSequenceSize(_x16,_x17){return _getSequenceSize.apply(this,arguments);}return getSequenceSize;}()},{key:\"hasReferenceSequence\",value:function(){var _hasReferenceSequence=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(t,e){return _regeneratorRuntime().wrap(function _callee14$(_context17){while(1)switch(_context17.prev=_context17.next){case 0:_context17.next=2;return this._getIndexes(e);case 2:_context17.t0=t;return _context17.abrupt(\"return\",!!_context17.sent.name[_context17.t0]);case 4:case\"end\":return _context17.stop();}},_callee14,this);}));function hasReferenceSequence(_x18,_x19){return _hasReferenceSequence.apply(this,arguments);}return hasReferenceSequence;}()},{key:\"getResiduesById\",value:function(){var _getResiduesById=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee15(t,e,n,r){var i;return _regeneratorRuntime().wrap(function _callee15$(_context18){while(1)switch(_context18.prev=_context18.next){case 0:_context18.next=2;return this._getIndexes(r);case 2:_context18.t0=t;i=_context18.sent.id[_context18.t0];if(!i){_context18.next=6;break;}return _context18.abrupt(\"return\",this._fetchFromIndexEntry(i,e,n,r));case 6:case\"end\":return _context18.stop();}},_callee15,this);}));function getResiduesById(_x20,_x21,_x22,_x23){return _getResiduesById.apply(this,arguments);}return getResiduesById;}()},{key:\"getResiduesByName\",value:function(){var _getResiduesByName=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee16(t,e,n,r){var i;return _regeneratorRuntime().wrap(function _callee16$(_context19){while(1)switch(_context19.prev=_context19.next){case 0:_context19.next=2;return this._getIndexes(r);case 2:_context19.t0=t;i=_context19.sent.name[_context19.t0];if(!i){_context19.next=6;break;}return _context19.abrupt(\"return\",this._fetchFromIndexEntry(i,e,n,r));case 6:case\"end\":return _context19.stop();}},_callee16,this);}));function getResiduesByName(_x24,_x25,_x26,_x27){return _getResiduesByName.apply(this,arguments);}return getResiduesByName;}()},{key:\"getSequence\",value:function(){var _getSequence=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee17(t,e,n,r){return _regeneratorRuntime().wrap(function _callee17$(_context20){while(1)switch(_context20.prev=_context20.next){case 0:return _context20.abrupt(\"return\",this.getResiduesByName(t,e,n,r));case 1:case\"end\":return _context20.stop();}},_callee17,this);}));function getSequence(_x28,_x29,_x30,_x31){return _getSequence.apply(this,arguments);}return getSequence;}()},{key:\"_fetchFromIndexEntry\",value:function(){var _fetchFromIndexEntry2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee18(t){var e,n,r,i,o,s,a,_args21=arguments;return _regeneratorRuntime().wrap(function _callee18$(_context21){while(1)switch(_context21.prev=_context21.next){case 0:e=_args21.length>1&&_args21[1]!==undefined?_args21[1]:0;n=_args21.length>2?_args21[2]:undefined;r=_args21.length>3?_args21[3]:undefined;i=n;if(!(e<0)){_context21.next=6;break;}throw new TypeError(\"regionStart cannot be less than 0\");case 6:if(!((void 0===i||i>t.length)&&(i=t.length),e>=i)){_context21.next=8;break;}return _context21.abrupt(\"return\",\"\");case 8:o=c(t,e),s=c(t,i)-o,a=h.allocUnsafe(s);_context21.next=11;return this.fasta.read(a,0,s,o,r);case 11:return _context21.abrupt(\"return\",a.toString(\"utf8\").replace(/\\s+/g,\"\"));case 12:case\"end\":return _context21.stop();}},_callee18,this);}));function _fetchFromIndexEntry(_x32){return _fetchFromIndexEntry2.apply(this,arguments);}return _fetchFromIndexEntry;}()}]);return f;}();var d=/*#__PURE__*/function(_f2){_inherits(d,_f2);var _super=_createSuper(d);function d(_ref13){var _this6;var t=_ref13.fasta,e=_ref13.path,n=_ref13.fai,r=_ref13.faiPath,i=_ref13.gzi,o=_ref13.gziPath;_classCallCheck(this,d);_this6=_super.call(this,{fasta:t,path:e,fai:n,faiPath:r}),t&&i?_this6.fasta=new l({filehandle:t,gziFilehandle:i}):e&&o&&(_this6.fasta=new l({path:e,gziPath:o}));return _this6;}return _createClass(d);}(f);function p(t){return t.split(\">\").filter(function(t){return /\\S/.test(t);}).map(function(t){var _t$split=t.split(\"\\n\"),_t$split2=_toArray(_t$split),e=_t$split2[0],n=_t$split2.slice(1),_e$split=e.split(\" \"),_e$split2=_toArray(_e$split),r=_e$split2[0],i=_e$split2.slice(1),o=n.join(\"\").replace(/\\s/g,\"\");return{id:r,description:i.join(\" \"),sequence:o};});}var g=/*#__PURE__*/function(){function g(_ref14){var t=_ref14.fasta,e=_ref14.path;_classCallCheck(this,g);if(t)this.fasta=t;else{if(!e)throw new Error(\"Need to pass fasta or path\");this.fasta=new r.S9(e);}this.data=this.fasta.readFile().then(function(t){return p(t.toString(\"utf8\"));});}_createClass(g,[{key:\"fetch\",value:function(){var _fetch=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee19(t,e,n){var r,i;return _regeneratorRuntime().wrap(function _callee19$(_context22){while(1)switch(_context22.prev=_context22.next){case 0:_context22.next=2;return this.data;case 2:r=_context22.sent.find(function(e){return e.id===t;});i=n-e;if(r){_context22.next=6;break;}throw new Error(\"no sequence with id \".concat(t,\" exists\"));case 6:return _context22.abrupt(\"return\",r.sequence.substr(e,i));case 7:case\"end\":return _context22.stop();}},_callee19,this);}));function fetch(_x33,_x34,_x35){return _fetch.apply(this,arguments);}return fetch;}()},{key:\"getSequenceNames\",value:function(){var _getSequenceNames2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee20(){return _regeneratorRuntime().wrap(function _callee20$(_context23){while(1)switch(_context23.prev=_context23.next){case 0:_context23.next=2;return this.data;case 2:return _context23.abrupt(\"return\",_context23.sent.map(function(t){return t.id;}));case 3:case\"end\":return _context23.stop();}},_callee20,this);}));function getSequenceNames(){return _getSequenceNames2.apply(this,arguments);}return getSequenceNames;}()}]);return g;}();},9742:function _(t,e){\"use strict\";e.byteLength=function(t){var e=a(t),n=e[0],r=e[1];return 3*(n+r)/4-r;},e.toByteArray=function(t){var e,n,o=a(t),s=o[0],u=o[1],l=new i(function(t,e,n){return 3*(e+n)/4-n;}(0,s,u)),h=0,c=u>0?s-4:s;for(n=0;n<c;n+=4)e=r[t.charCodeAt(n)]<<18|r[t.charCodeAt(n+1)]<<12|r[t.charCodeAt(n+2)]<<6|r[t.charCodeAt(n+3)],l[h++]=e>>16&255,l[h++]=e>>8&255,l[h++]=255&e;return 2===u&&(e=r[t.charCodeAt(n)]<<2|r[t.charCodeAt(n+1)]>>4,l[h++]=255&e),1===u&&(e=r[t.charCodeAt(n)]<<10|r[t.charCodeAt(n+1)]<<4|r[t.charCodeAt(n+2)]>>2,l[h++]=e>>8&255,l[h++]=255&e),l;},e.fromByteArray=function(t){for(var e,r=t.length,i=r%3,o=[],s=16383,a=0,l=r-i;a<l;a+=s)o.push(u(t,a,a+s>l?l:a+s));return 1===i?(e=t[r-1],o.push(n[e>>2]+n[e<<4&63]+\"==\")):2===i&&(e=(t[r-2]<<8)+t[r-1],o.push(n[e>>10]+n[e>>4&63]+n[e<<2&63]+\"=\")),o.join(\"\");};for(var n=[],r=[],i=\"undefined\"!=typeof Uint8Array?Uint8Array:Array,o=\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\",s=0;s<64;++s)n[s]=o[s],r[o.charCodeAt(s)]=s;function a(t){var e=t.length;if(e%4>0)throw new Error(\"Invalid string. Length must be a multiple of 4\");var n=t.indexOf(\"=\");return-1===n&&(n=e),[n,n===e?0:4-n%4];}function u(t,e,r){for(var i,o,s=[],a=e;a<r;a+=3)i=(t[a]<<16&16711680)+(t[a+1]<<8&65280)+(255&t[a+2]),s.push(n[(o=i)>>18&63]+n[o>>12&63]+n[o>>6&63]+n[63&o]);return s.join(\"\");}r[\"-\".charCodeAt(0)]=62,r[\"_\".charCodeAt(0)]=63;},8764:function _(t,e,n){\"use strict\";var r=n(9742),i=n(645),o=\"function\"==typeof Symbol&&\"function\"==typeof Symbol[\"for\"]?Symbol[\"for\"](\"nodejs.util.inspect.custom\"):null;e.lW=u,e.h2=50;var s=2147483647;function a(t){if(t>s)throw new RangeError('The value \"'+t+'\" is invalid for option \"size\"');var e=new Uint8Array(t);return Object.setPrototypeOf(e,u.prototype),e;}function u(t,e,n){if(\"number\"==typeof t){if(\"string\"==typeof e)throw new TypeError('The \"string\" argument must be of type string. Received type number');return c(t);}return l(t,e,n);}function l(t,e,n){if(\"string\"==typeof t)return function(t,e){if(\"string\"==typeof e&&\"\"!==e||(e=\"utf8\"),!u.isEncoding(e))throw new TypeError(\"Unknown encoding: \"+e);var n=0|g(t,e);var r=a(n);var i=r.write(t,e);return i!==n&&(r=r.slice(0,i)),r;}(t,e);if(ArrayBuffer.isView(t))return function(t){if(V(t,Uint8Array)){var _e14=new Uint8Array(t);return d(_e14.buffer,_e14.byteOffset,_e14.byteLength);}return f(t);}(t);if(null==t)throw new TypeError(\"The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type \"+_typeof(t));if(V(t,ArrayBuffer)||t&&V(t.buffer,ArrayBuffer))return d(t,e,n);if(\"undefined\"!=typeof SharedArrayBuffer&&(V(t,SharedArrayBuffer)||t&&V(t.buffer,SharedArrayBuffer)))return d(t,e,n);if(\"number\"==typeof t)throw new TypeError('The \"value\" argument must not be of type number. Received type number');var r=t.valueOf&&t.valueOf();if(null!=r&&r!==t)return u.from(r,e,n);var i=function(t){if(u.isBuffer(t)){var _e15=0|p(t.length),_n5=a(_e15);return 0===_n5.length||t.copy(_n5,0,0,_e15),_n5;}return void 0!==t.length?\"number\"!=typeof t.length||X(t.length)?a(0):f(t):\"Buffer\"===t.type&&Array.isArray(t.data)?f(t.data):void 0;}(t);if(i)return i;if(\"undefined\"!=typeof Symbol&&null!=Symbol.toPrimitive&&\"function\"==typeof t[Symbol.toPrimitive])return u.from(t[Symbol.toPrimitive](\"string\"),e,n);throw new TypeError(\"The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type \"+_typeof(t));}function h(t){if(\"number\"!=typeof t)throw new TypeError('\"size\" argument must be of type number');if(t<0)throw new RangeError('The value \"'+t+'\" is invalid for option \"size\"');}function c(t){return h(t),a(t<0?0:0|p(t));}function f(t){var e=t.length<0?0:0|p(t.length),n=a(e);for(var _r6=0;_r6<e;_r6+=1)n[_r6]=255&t[_r6];return n;}function d(t,e,n){if(e<0||t.byteLength<e)throw new RangeError('\"offset\" is outside of buffer bounds');if(t.byteLength<e+(n||0))throw new RangeError('\"length\" is outside of buffer bounds');var r;return r=void 0===e&&void 0===n?new Uint8Array(t):void 0===n?new Uint8Array(t,e):new Uint8Array(t,e,n),Object.setPrototypeOf(r,u.prototype),r;}function p(t){if(t>=s)throw new RangeError(\"Attempt to allocate Buffer larger than maximum size: 0x\"+s.toString(16)+\" bytes\");return 0|t;}function g(t,e){if(u.isBuffer(t))return t.length;if(ArrayBuffer.isView(t)||V(t,ArrayBuffer))return t.byteLength;if(\"string\"!=typeof t)throw new TypeError('The \"string\" argument must be one of type string, Buffer, or ArrayBuffer. Received type '+_typeof(t));var n=t.length,r=arguments.length>2&&!0===arguments[2];if(!r&&0===n)return 0;var i=!1;for(;;)switch(e){case\"ascii\":case\"latin1\":case\"binary\":return n;case\"utf8\":case\"utf-8\":return W(t).length;case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return 2*n;case\"hex\":return n>>>1;case\"base64\":return G(t).length;default:if(i)return r?-1:W(t).length;e=(\"\"+e).toLowerCase(),i=!0;}}function _(t,e,n){var r=!1;if((void 0===e||e<0)&&(e=0),e>this.length)return\"\";if((void 0===n||n>this.length)&&(n=this.length),n<=0)return\"\";if((n>>>=0)<=(e>>>=0))return\"\";for(t||(t=\"utf8\");;)switch(t){case\"hex\":return z(this,e,n);case\"utf8\":case\"utf-8\":return S(this,e,n);case\"ascii\":return B(this,e,n);case\"latin1\":case\"binary\":return T(this,e,n);case\"base64\":return E(this,e,n);case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return C(this,e,n);default:if(r)throw new TypeError(\"Unknown encoding: \"+t);t=(t+\"\").toLowerCase(),r=!0;}}function m(t,e,n){var r=t[e];t[e]=t[n],t[n]=r;}function v(t,e,n,r,i){if(0===t.length)return-1;if(\"string\"==typeof n?(r=n,n=0):n>2147483647?n=2147483647:n<-2147483648&&(n=-2147483648),X(n=+n)&&(n=i?0:t.length-1),n<0&&(n=t.length+n),n>=t.length){if(i)return-1;n=t.length-1;}else if(n<0){if(!i)return-1;n=0;}if(\"string\"==typeof e&&(e=u.from(e,r)),u.isBuffer(e))return 0===e.length?-1:y(t,e,n,r,i);if(\"number\"==typeof e)return e&=255,\"function\"==typeof Uint8Array.prototype.indexOf?i?Uint8Array.prototype.indexOf.call(t,e,n):Uint8Array.prototype.lastIndexOf.call(t,e,n):y(t,[e],n,r,i);throw new TypeError(\"val must be string, number or Buffer\");}function y(t,e,n,r,i){var o,s=1,a=t.length,u=e.length;if(void 0!==r&&(\"ucs2\"===(r=String(r).toLowerCase())||\"ucs-2\"===r||\"utf16le\"===r||\"utf-16le\"===r)){if(t.length<2||e.length<2)return-1;s=2,a/=2,u/=2,n/=2;}function l(t,e){return 1===s?t[e]:t.readUInt16BE(e*s);}if(i){var _r7=-1;for(o=n;o<a;o++)if(l(t,o)===l(e,-1===_r7?0:o-_r7)){if(-1===_r7&&(_r7=o),o-_r7+1===u)return _r7*s;}else-1!==_r7&&(o-=o-_r7),_r7=-1;}else for(n+u>a&&(n=a-u),o=n;o>=0;o--){var _n6=!0;for(var _r8=0;_r8<u;_r8++)if(l(t,o+_r8)!==l(e,_r8)){_n6=!1;break;}if(_n6)return o;}return-1;}function b(t,e,n,r){n=Number(n)||0;var i=t.length-n;r?(r=Number(r))>i&&(r=i):r=i;var o=e.length;var s;for(r>o/2&&(r=o/2),s=0;s<r;++s){var _r9=parseInt(e.substr(2*s,2),16);if(X(_r9))return s;t[n+s]=_r9;}return s;}function w(t,e,n,r){return Y(W(e,t.length-n),t,n,r);}function x(t,e,n,r){return Y(function(t){var e=[];for(var _n7=0;_n7<t.length;++_n7)e.push(255&t.charCodeAt(_n7));return e;}(e),t,n,r);}function k(t,e,n,r){return Y(G(e),t,n,r);}function A(t,e,n,r){return Y(function(t,e){var n,r,i;var o=[];for(var _s3=0;_s3<t.length&&!((e-=2)<0);++_s3)n=t.charCodeAt(_s3),r=n>>8,i=n%256,o.push(i),o.push(r);return o;}(e,t.length-n),t,n,r);}function E(t,e,n){return 0===e&&n===t.length?r.fromByteArray(t):r.fromByteArray(t.slice(e,n));}function S(t,e,n){n=Math.min(t.length,n);var r=[];var i=e;for(;i<n;){var _e16=t[i];var _o3=null,_s4=_e16>239?4:_e16>223?3:_e16>191?2:1;if(i+_s4<=n){var _n8=void 0,_r10=void 0,_a5=void 0,_u4=void 0;switch(_s4){case 1:_e16<128&&(_o3=_e16);break;case 2:_n8=t[i+1],128==(192&_n8)&&(_u4=(31&_e16)<<6|63&_n8,_u4>127&&(_o3=_u4));break;case 3:_n8=t[i+1],_r10=t[i+2],128==(192&_n8)&&128==(192&_r10)&&(_u4=(15&_e16)<<12|(63&_n8)<<6|63&_r10,_u4>2047&&(_u4<55296||_u4>57343)&&(_o3=_u4));break;case 4:_n8=t[i+1],_r10=t[i+2],_a5=t[i+3],128==(192&_n8)&&128==(192&_r10)&&128==(192&_a5)&&(_u4=(15&_e16)<<18|(63&_n8)<<12|(63&_r10)<<6|63&_a5,_u4>65535&&_u4<1114112&&(_o3=_u4));}}null===_o3?(_o3=65533,_s4=1):_o3>65535&&(_o3-=65536,r.push(_o3>>>10&1023|55296),_o3=56320|1023&_o3),r.push(_o3),i+=_s4;}return function(t){var e=t.length;if(e<=M)return String.fromCharCode.apply(String,t);var n=\"\",r=0;for(;r<e;)n+=String.fromCharCode.apply(String,t.slice(r,r+=M));return n;}(r);}u.TYPED_ARRAY_SUPPORT=function(){try{var _t11=new Uint8Array(1),_e17={foo:function foo(){return 42;}};return Object.setPrototypeOf(_e17,Uint8Array.prototype),Object.setPrototypeOf(_t11,_e17),42===_t11.foo();}catch(t){return!1;}}(),u.TYPED_ARRAY_SUPPORT||\"undefined\"==typeof console||\"function\"!=typeof console.error||console.error(\"This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.\"),Object.defineProperty(u.prototype,\"parent\",{enumerable:!0,get:function get(){if(u.isBuffer(this))return this.buffer;}}),Object.defineProperty(u.prototype,\"offset\",{enumerable:!0,get:function get(){if(u.isBuffer(this))return this.byteOffset;}}),u.poolSize=8192,u.from=function(t,e,n){return l(t,e,n);},Object.setPrototypeOf(u.prototype,Uint8Array.prototype),Object.setPrototypeOf(u,Uint8Array),u.alloc=function(t,e,n){return function(t,e,n){return h(t),t<=0?a(t):void 0!==e?\"string\"==typeof n?a(t).fill(e,n):a(t).fill(e):a(t);}(t,e,n);},u.allocUnsafe=function(t){return c(t);},u.allocUnsafeSlow=function(t){return c(t);},u.isBuffer=function(t){return null!=t&&!0===t._isBuffer&&t!==u.prototype;},u.compare=function(t,e){if(V(t,Uint8Array)&&(t=u.from(t,t.offset,t.byteLength)),V(e,Uint8Array)&&(e=u.from(e,e.offset,e.byteLength)),!u.isBuffer(t)||!u.isBuffer(e))throw new TypeError('The \"buf1\", \"buf2\" arguments must be one of type Buffer or Uint8Array');if(t===e)return 0;var n=t.length,r=e.length;for(var _i7=0,_o4=Math.min(n,r);_i7<_o4;++_i7)if(t[_i7]!==e[_i7]){n=t[_i7],r=e[_i7];break;}return n<r?-1:r<n?1:0;},u.isEncoding=function(t){switch(String(t).toLowerCase()){case\"hex\":case\"utf8\":case\"utf-8\":case\"ascii\":case\"latin1\":case\"binary\":case\"base64\":case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return!0;default:return!1;}},u.concat=function(t,e){if(!Array.isArray(t))throw new TypeError('\"list\" argument must be an Array of Buffers');if(0===t.length)return u.alloc(0);var n;if(void 0===e)for(e=0,n=0;n<t.length;++n)e+=t[n].length;var r=u.allocUnsafe(e);var i=0;for(n=0;n<t.length;++n){var _e18=t[n];if(V(_e18,Uint8Array))i+_e18.length>r.length?(u.isBuffer(_e18)||(_e18=u.from(_e18)),_e18.copy(r,i)):Uint8Array.prototype.set.call(r,_e18,i);else{if(!u.isBuffer(_e18))throw new TypeError('\"list\" argument must be an Array of Buffers');_e18.copy(r,i);}i+=_e18.length;}return r;},u.byteLength=g,u.prototype._isBuffer=!0,u.prototype.swap16=function(){var t=this.length;if(t%2!=0)throw new RangeError(\"Buffer size must be a multiple of 16-bits\");for(var _e19=0;_e19<t;_e19+=2)m(this,_e19,_e19+1);return this;},u.prototype.swap32=function(){var t=this.length;if(t%4!=0)throw new RangeError(\"Buffer size must be a multiple of 32-bits\");for(var _e20=0;_e20<t;_e20+=4)m(this,_e20,_e20+3),m(this,_e20+1,_e20+2);return this;},u.prototype.swap64=function(){var t=this.length;if(t%8!=0)throw new RangeError(\"Buffer size must be a multiple of 64-bits\");for(var _e21=0;_e21<t;_e21+=8)m(this,_e21,_e21+7),m(this,_e21+1,_e21+6),m(this,_e21+2,_e21+5),m(this,_e21+3,_e21+4);return this;},u.prototype.toString=function(){var t=this.length;return 0===t?\"\":0===arguments.length?S(this,0,t):_.apply(this,arguments);},u.prototype.toLocaleString=u.prototype.toString,u.prototype.equals=function(t){if(!u.isBuffer(t))throw new TypeError(\"Argument must be a Buffer\");return this===t||0===u.compare(this,t);},u.prototype.inspect=function(){var t=\"\";var n=e.h2;return t=this.toString(\"hex\",0,n).replace(/(.{2})/g,\"$1 \").trim(),this.length>n&&(t+=\" ... \"),\"<Buffer \"+t+\">\";},o&&(u.prototype[o]=u.prototype.inspect),u.prototype.compare=function(t,e,n,r,i){if(V(t,Uint8Array)&&(t=u.from(t,t.offset,t.byteLength)),!u.isBuffer(t))throw new TypeError('The \"target\" argument must be one of type Buffer or Uint8Array. Received type '+_typeof(t));if(void 0===e&&(e=0),void 0===n&&(n=t?t.length:0),void 0===r&&(r=0),void 0===i&&(i=this.length),e<0||n>t.length||r<0||i>this.length)throw new RangeError(\"out of range index\");if(r>=i&&e>=n)return 0;if(r>=i)return-1;if(e>=n)return 1;if(this===t)return 0;var o=(i>>>=0)-(r>>>=0),s=(n>>>=0)-(e>>>=0);var a=Math.min(o,s),l=this.slice(r,i),h=t.slice(e,n);for(var _t12=0;_t12<a;++_t12)if(l[_t12]!==h[_t12]){o=l[_t12],s=h[_t12];break;}return o<s?-1:s<o?1:0;},u.prototype.includes=function(t,e,n){return-1!==this.indexOf(t,e,n);},u.prototype.indexOf=function(t,e,n){return v(this,t,e,n,!0);},u.prototype.lastIndexOf=function(t,e,n){return v(this,t,e,n,!1);},u.prototype.write=function(t,e,n,r){if(void 0===e)r=\"utf8\",n=this.length,e=0;else if(void 0===n&&\"string\"==typeof e)r=e,n=this.length,e=0;else{if(!isFinite(e))throw new Error(\"Buffer.write(string, encoding, offset[, length]) is no longer supported\");e>>>=0,isFinite(n)?(n>>>=0,void 0===r&&(r=\"utf8\")):(r=n,n=void 0);}var i=this.length-e;if((void 0===n||n>i)&&(n=i),t.length>0&&(n<0||e<0)||e>this.length)throw new RangeError(\"Attempt to write outside buffer bounds\");r||(r=\"utf8\");var o=!1;for(;;)switch(r){case\"hex\":return b(this,t,e,n);case\"utf8\":case\"utf-8\":return w(this,t,e,n);case\"ascii\":case\"latin1\":case\"binary\":return x(this,t,e,n);case\"base64\":return k(this,t,e,n);case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return A(this,t,e,n);default:if(o)throw new TypeError(\"Unknown encoding: \"+r);r=(\"\"+r).toLowerCase(),o=!0;}},u.prototype.toJSON=function(){return{type:\"Buffer\",data:Array.prototype.slice.call(this._arr||this,0)};};var M=4096;function B(t,e,n){var r=\"\";n=Math.min(t.length,n);for(var _i8=e;_i8<n;++_i8)r+=String.fromCharCode(127&t[_i8]);return r;}function T(t,e,n){var r=\"\";n=Math.min(t.length,n);for(var _i9=e;_i9<n;++_i9)r+=String.fromCharCode(t[_i9]);return r;}function z(t,e,n){var r=t.length;(!e||e<0)&&(e=0),(!n||n<0||n>r)&&(n=r);var i=\"\";for(var _r11=e;_r11<n;++_r11)i+=K[t[_r11]];return i;}function C(t,e,n){var r=t.slice(e,n);var i=\"\";for(var _t13=0;_t13<r.length-1;_t13+=2)i+=String.fromCharCode(r[_t13]+256*r[_t13+1]);return i;}function N(t,e,n){if(t%1!=0||t<0)throw new RangeError(\"offset is not uint\");if(t+e>n)throw new RangeError(\"Trying to access beyond buffer length\");}function I(t,e,n,r,i,o){if(!u.isBuffer(t))throw new TypeError('\"buffer\" argument must be a Buffer instance');if(e>i||e<o)throw new RangeError('\"value\" argument is out of bounds');if(n+r>t.length)throw new RangeError(\"Index out of range\");}function O(t,e,n,r,i){$(e,r,i,t,n,7);var o=Number(e&BigInt(4294967295));t[n++]=o,o>>=8,t[n++]=o,o>>=8,t[n++]=o,o>>=8,t[n++]=o;var s=Number(e>>BigInt(32)&BigInt(4294967295));return t[n++]=s,s>>=8,t[n++]=s,s>>=8,t[n++]=s,s>>=8,t[n++]=s,n;}function R(t,e,n,r,i){$(e,r,i,t,n,7);var o=Number(e&BigInt(4294967295));t[n+7]=o,o>>=8,t[n+6]=o,o>>=8,t[n+5]=o,o>>=8,t[n+4]=o;var s=Number(e>>BigInt(32)&BigInt(4294967295));return t[n+3]=s,s>>=8,t[n+2]=s,s>>=8,t[n+1]=s,s>>=8,t[n]=s,n+8;}function L(t,e,n,r,i,o){if(n+r>t.length)throw new RangeError(\"Index out of range\");if(n<0)throw new RangeError(\"Index out of range\");}function U(t,e,n,r,o){return e=+e,n>>>=0,o||L(t,0,n,4),i.write(t,e,n,r,23,4),n+4;}function j(t,e,n,r,o){return e=+e,n>>>=0,o||L(t,0,n,8),i.write(t,e,n,r,52,8),n+8;}u.prototype.slice=function(t,e){var n=this.length;(t=~~t)<0?(t+=n)<0&&(t=0):t>n&&(t=n),(e=void 0===e?n:~~e)<0?(e+=n)<0&&(e=0):e>n&&(e=n),e<t&&(e=t);var r=this.subarray(t,e);return Object.setPrototypeOf(r,u.prototype),r;},u.prototype.readUintLE=u.prototype.readUIntLE=function(t,e,n){t>>>=0,e>>>=0,n||N(t,e,this.length);var r=this[t],i=1,o=0;for(;++o<e&&(i*=256);)r+=this[t+o]*i;return r;},u.prototype.readUintBE=u.prototype.readUIntBE=function(t,e,n){t>>>=0,e>>>=0,n||N(t,e,this.length);var r=this[t+--e],i=1;for(;e>0&&(i*=256);)r+=this[t+--e]*i;return r;},u.prototype.readUint8=u.prototype.readUInt8=function(t,e){return t>>>=0,e||N(t,1,this.length),this[t];},u.prototype.readUint16LE=u.prototype.readUInt16LE=function(t,e){return t>>>=0,e||N(t,2,this.length),this[t]|this[t+1]<<8;},u.prototype.readUint16BE=u.prototype.readUInt16BE=function(t,e){return t>>>=0,e||N(t,2,this.length),this[t]<<8|this[t+1];},u.prototype.readUint32LE=u.prototype.readUInt32LE=function(t,e){return t>>>=0,e||N(t,4,this.length),(this[t]|this[t+1]<<8|this[t+2]<<16)+16777216*this[t+3];},u.prototype.readUint32BE=u.prototype.readUInt32BE=function(t,e){return t>>>=0,e||N(t,4,this.length),16777216*this[t]+(this[t+1]<<16|this[t+2]<<8|this[t+3]);},u.prototype.readBigUInt64LE=J(function(t){H(t>>>=0,\"offset\");var e=this[t],n=this[t+7];void 0!==e&&void 0!==n||q(t,this.length-8);var r=e+256*this[++t]+65536*this[++t]+this[++t]*Math.pow(2,24),i=this[++t]+256*this[++t]+65536*this[++t]+n*Math.pow(2,24);return BigInt(r)+(BigInt(i)<<BigInt(32));}),u.prototype.readBigUInt64BE=J(function(t){H(t>>>=0,\"offset\");var e=this[t],n=this[t+7];void 0!==e&&void 0!==n||q(t,this.length-8);var r=e*Math.pow(2,24)+65536*this[++t]+256*this[++t]+this[++t],i=this[++t]*Math.pow(2,24)+65536*this[++t]+256*this[++t]+n;return(BigInt(r)<<BigInt(32))+BigInt(i);}),u.prototype.readIntLE=function(t,e,n){t>>>=0,e>>>=0,n||N(t,e,this.length);var r=this[t],i=1,o=0;for(;++o<e&&(i*=256);)r+=this[t+o]*i;return i*=128,r>=i&&(r-=Math.pow(2,8*e)),r;},u.prototype.readIntBE=function(t,e,n){t>>>=0,e>>>=0,n||N(t,e,this.length);var r=e,i=1,o=this[t+--r];for(;r>0&&(i*=256);)o+=this[t+--r]*i;return i*=128,o>=i&&(o-=Math.pow(2,8*e)),o;},u.prototype.readInt8=function(t,e){return t>>>=0,e||N(t,1,this.length),128&this[t]?-1*(255-this[t]+1):this[t];},u.prototype.readInt16LE=function(t,e){t>>>=0,e||N(t,2,this.length);var n=this[t]|this[t+1]<<8;return 32768&n?4294901760|n:n;},u.prototype.readInt16BE=function(t,e){t>>>=0,e||N(t,2,this.length);var n=this[t+1]|this[t]<<8;return 32768&n?4294901760|n:n;},u.prototype.readInt32LE=function(t,e){return t>>>=0,e||N(t,4,this.length),this[t]|this[t+1]<<8|this[t+2]<<16|this[t+3]<<24;},u.prototype.readInt32BE=function(t,e){return t>>>=0,e||N(t,4,this.length),this[t]<<24|this[t+1]<<16|this[t+2]<<8|this[t+3];},u.prototype.readBigInt64LE=J(function(t){H(t>>>=0,\"offset\");var e=this[t],n=this[t+7];void 0!==e&&void 0!==n||q(t,this.length-8);var r=this[t+4]+256*this[t+5]+65536*this[t+6]+(n<<24);return(BigInt(r)<<BigInt(32))+BigInt(e+256*this[++t]+65536*this[++t]+this[++t]*Math.pow(2,24));}),u.prototype.readBigInt64BE=J(function(t){H(t>>>=0,\"offset\");var e=this[t],n=this[t+7];void 0!==e&&void 0!==n||q(t,this.length-8);var r=(e<<24)+65536*this[++t]+256*this[++t]+this[++t];return(BigInt(r)<<BigInt(32))+BigInt(this[++t]*Math.pow(2,24)+65536*this[++t]+256*this[++t]+n);}),u.prototype.readFloatLE=function(t,e){return t>>>=0,e||N(t,4,this.length),i.read(this,t,!0,23,4);},u.prototype.readFloatBE=function(t,e){return t>>>=0,e||N(t,4,this.length),i.read(this,t,!1,23,4);},u.prototype.readDoubleLE=function(t,e){return t>>>=0,e||N(t,8,this.length),i.read(this,t,!0,52,8);},u.prototype.readDoubleBE=function(t,e){return t>>>=0,e||N(t,8,this.length),i.read(this,t,!1,52,8);},u.prototype.writeUintLE=u.prototype.writeUIntLE=function(t,e,n,r){t=+t,e>>>=0,n>>>=0,r||I(this,t,e,n,Math.pow(2,8*n)-1,0);var i=1,o=0;for(this[e]=255&t;++o<n&&(i*=256);)this[e+o]=t/i&255;return e+n;},u.prototype.writeUintBE=u.prototype.writeUIntBE=function(t,e,n,r){t=+t,e>>>=0,n>>>=0,r||I(this,t,e,n,Math.pow(2,8*n)-1,0);var i=n-1,o=1;for(this[e+i]=255&t;--i>=0&&(o*=256);)this[e+i]=t/o&255;return e+n;},u.prototype.writeUint8=u.prototype.writeUInt8=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,1,255,0),this[e]=255&t,e+1;},u.prototype.writeUint16LE=u.prototype.writeUInt16LE=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,2,65535,0),this[e]=255&t,this[e+1]=t>>>8,e+2;},u.prototype.writeUint16BE=u.prototype.writeUInt16BE=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,2,65535,0),this[e]=t>>>8,this[e+1]=255&t,e+2;},u.prototype.writeUint32LE=u.prototype.writeUInt32LE=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,4,4294967295,0),this[e+3]=t>>>24,this[e+2]=t>>>16,this[e+1]=t>>>8,this[e]=255&t,e+4;},u.prototype.writeUint32BE=u.prototype.writeUInt32BE=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,4,4294967295,0),this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t,e+4;},u.prototype.writeBigUInt64LE=J(function(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;return O(this,t,e,BigInt(0),BigInt(\"0xffffffffffffffff\"));}),u.prototype.writeBigUInt64BE=J(function(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;return R(this,t,e,BigInt(0),BigInt(\"0xffffffffffffffff\"));}),u.prototype.writeIntLE=function(t,e,n,r){if(t=+t,e>>>=0,!r){var _r12=Math.pow(2,8*n-1);I(this,t,e,n,_r12-1,-_r12);}var i=0,o=1,s=0;for(this[e]=255&t;++i<n&&(o*=256);)t<0&&0===s&&0!==this[e+i-1]&&(s=1),this[e+i]=(t/o>>0)-s&255;return e+n;},u.prototype.writeIntBE=function(t,e,n,r){if(t=+t,e>>>=0,!r){var _r13=Math.pow(2,8*n-1);I(this,t,e,n,_r13-1,-_r13);}var i=n-1,o=1,s=0;for(this[e+i]=255&t;--i>=0&&(o*=256);)t<0&&0===s&&0!==this[e+i+1]&&(s=1),this[e+i]=(t/o>>0)-s&255;return e+n;},u.prototype.writeInt8=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,1,127,-128),t<0&&(t=255+t+1),this[e]=255&t,e+1;},u.prototype.writeInt16LE=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,2,32767,-32768),this[e]=255&t,this[e+1]=t>>>8,e+2;},u.prototype.writeInt16BE=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,2,32767,-32768),this[e]=t>>>8,this[e+1]=255&t,e+2;},u.prototype.writeInt32LE=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,4,2147483647,-2147483648),this[e]=255&t,this[e+1]=t>>>8,this[e+2]=t>>>16,this[e+3]=t>>>24,e+4;},u.prototype.writeInt32BE=function(t,e,n){return t=+t,e>>>=0,n||I(this,t,e,4,2147483647,-2147483648),t<0&&(t=4294967295+t+1),this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t,e+4;},u.prototype.writeBigInt64LE=J(function(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;return O(this,t,e,-BigInt(\"0x8000000000000000\"),BigInt(\"0x7fffffffffffffff\"));}),u.prototype.writeBigInt64BE=J(function(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;return R(this,t,e,-BigInt(\"0x8000000000000000\"),BigInt(\"0x7fffffffffffffff\"));}),u.prototype.writeFloatLE=function(t,e,n){return U(this,t,e,!0,n);},u.prototype.writeFloatBE=function(t,e,n){return U(this,t,e,!1,n);},u.prototype.writeDoubleLE=function(t,e,n){return j(this,t,e,!0,n);},u.prototype.writeDoubleBE=function(t,e,n){return j(this,t,e,!1,n);},u.prototype.copy=function(t,e,n,r){if(!u.isBuffer(t))throw new TypeError(\"argument should be a Buffer\");if(n||(n=0),r||0===r||(r=this.length),e>=t.length&&(e=t.length),e||(e=0),r>0&&r<n&&(r=n),r===n)return 0;if(0===t.length||0===this.length)return 0;if(e<0)throw new RangeError(\"targetStart out of bounds\");if(n<0||n>=this.length)throw new RangeError(\"Index out of range\");if(r<0)throw new RangeError(\"sourceEnd out of bounds\");r>this.length&&(r=this.length),t.length-e<r-n&&(r=t.length-e+n);var i=r-n;return this===t&&\"function\"==typeof Uint8Array.prototype.copyWithin?this.copyWithin(e,n,r):Uint8Array.prototype.set.call(t,this.subarray(n,r),e),i;},u.prototype.fill=function(t,e,n,r){if(\"string\"==typeof t){if(\"string\"==typeof e?(r=e,e=0,n=this.length):\"string\"==typeof n&&(r=n,n=this.length),void 0!==r&&\"string\"!=typeof r)throw new TypeError(\"encoding must be a string\");if(\"string\"==typeof r&&!u.isEncoding(r))throw new TypeError(\"Unknown encoding: \"+r);if(1===t.length){var _e22=t.charCodeAt(0);(\"utf8\"===r&&_e22<128||\"latin1\"===r)&&(t=_e22);}}else\"number\"==typeof t?t&=255:\"boolean\"==typeof t&&(t=Number(t));if(e<0||this.length<e||this.length<n)throw new RangeError(\"Out of range index\");if(n<=e)return this;var i;if(e>>>=0,n=void 0===n?this.length:n>>>0,t||(t=0),\"number\"==typeof t)for(i=e;i<n;++i)this[i]=t;else{var _o5=u.isBuffer(t)?t:u.from(t,r),_s5=_o5.length;if(0===_s5)throw new TypeError('The value \"'+t+'\" is invalid for argument \"value\"');for(i=0;i<n-e;++i)this[i+e]=_o5[i%_s5];}return this;};var P={};function D(t,e,n){P[t]=/*#__PURE__*/function(_n9){_inherits(_class3,_n9);var _super2=_createSuper(_class3);function _class3(){var _this7;_classCallCheck(this,_class3);_this7=_super2.call(this),Object.defineProperty(_assertThisInitialized(_this7),\"message\",{value:e.apply(_assertThisInitialized(_this7),arguments),writable:!0,configurable:!0}),_this7.name=\"\".concat(_this7.name,\" [\").concat(t,\"]\"),_this7.stack,delete _this7.name;return _this7;}_createClass(_class3,[{key:\"code\",get:function get(){return t;},set:function set(t){Object.defineProperty(this,\"code\",{configurable:!0,enumerable:!0,value:t,writable:!0});}},{key:\"toString\",value:function toString(){return\"\".concat(this.name,\" [\").concat(t,\"]: \").concat(this.message);}}]);return _class3;}(n);}function F(t){var e=\"\",n=t.length;var r=\"-\"===t[0]?1:0;for(;n>=r+4;n-=3)e=\"_\".concat(t.slice(n-3,n)).concat(e);return\"\".concat(t.slice(0,n)).concat(e);}function $(t,e,n,r,i,o){if(t>n||t<e){var _r14=\"bigint\"==typeof e?\"n\":\"\";var _i10;throw _i10=o>3?0===e||e===BigInt(0)?\">= 0\".concat(_r14,\" and < 2\").concat(_r14,\" ** \").concat(8*(o+1)).concat(_r14):\">= -(2\".concat(_r14,\" ** \").concat(8*(o+1)-1).concat(_r14,\") and < 2 ** \").concat(8*(o+1)-1).concat(_r14):\">= \".concat(e).concat(_r14,\" and <= \").concat(n).concat(_r14),new P.ERR_OUT_OF_RANGE(\"value\",_i10,t);}!function(t,e,n){H(e,\"offset\"),void 0!==t[e]&&void 0!==t[e+n]||q(e,t.length-(n+1));}(r,i,o);}function H(t,e){if(\"number\"!=typeof t)throw new P.ERR_INVALID_ARG_TYPE(e,\"number\",t);}function q(t,e,n){if(Math.floor(t)!==t)throw H(t,n),new P.ERR_OUT_OF_RANGE(n||\"offset\",\"an integer\",t);if(e<0)throw new P.ERR_BUFFER_OUT_OF_BOUNDS();throw new P.ERR_OUT_OF_RANGE(n||\"offset\",\">= \".concat(n?1:0,\" and <= \").concat(e),t);}D(\"ERR_BUFFER_OUT_OF_BOUNDS\",function(t){return t?\"\".concat(t,\" is outside of buffer bounds\"):\"Attempt to access memory outside buffer bounds\";},RangeError),D(\"ERR_INVALID_ARG_TYPE\",function(t,e){return\"The \\\"\".concat(t,\"\\\" argument must be of type number. Received type \").concat(_typeof(e));},TypeError),D(\"ERR_OUT_OF_RANGE\",function(t,e,n){var r=\"The value of \\\"\".concat(t,\"\\\" is out of range.\"),i=n;return Number.isInteger(n)&&Math.abs(n)>Math.pow(2,32)?i=F(String(n)):\"bigint\"==typeof n&&(i=String(n),(n>Math.pow(BigInt(2),BigInt(32))||n<-Math.pow(BigInt(2),BigInt(32)))&&(i=F(i)),i+=\"n\"),r+=\" It must be \".concat(e,\". Received \").concat(i),r;},RangeError);var Z=/[^+/0-9A-Za-z-_]/g;function W(t,e){var n;e=e||1/0;var r=t.length;var i=null;var o=[];for(var _s6=0;_s6<r;++_s6){if(n=t.charCodeAt(_s6),n>55295&&n<57344){if(!i){if(n>56319){(e-=3)>-1&&o.push(239,191,189);continue;}if(_s6+1===r){(e-=3)>-1&&o.push(239,191,189);continue;}i=n;continue;}if(n<56320){(e-=3)>-1&&o.push(239,191,189),i=n;continue;}n=65536+(i-55296<<10|n-56320);}else i&&(e-=3)>-1&&o.push(239,191,189);if(i=null,n<128){if((e-=1)<0)break;o.push(n);}else if(n<2048){if((e-=2)<0)break;o.push(n>>6|192,63&n|128);}else if(n<65536){if((e-=3)<0)break;o.push(n>>12|224,n>>6&63|128,63&n|128);}else{if(!(n<1114112))throw new Error(\"Invalid code point\");if((e-=4)<0)break;o.push(n>>18|240,n>>12&63|128,n>>6&63|128,63&n|128);}}return o;}function G(t){return r.toByteArray(function(t){if((t=(t=t.split(\"=\")[0]).trim().replace(Z,\"\")).length<2)return\"\";for(;t.length%4!=0;)t+=\"=\";return t;}(t));}function Y(t,e,n,r){var i;for(i=0;i<r&&!(i+n>=e.length||i>=t.length);++i)e[i+n]=t[i];return i;}function V(t,e){return t instanceof e||null!=t&&null!=t.constructor&&null!=t.constructor.name&&t.constructor.name===e.name;}function X(t){return t!=t;}var K=function(){var t=\"0123456789abcdef\",e=new Array(256);for(var _n10=0;_n10<16;++_n10){var _r15=16*_n10;for(var _i11=0;_i11<16;++_i11)e[_r15+_i11]=t[_n10]+t[_i11];}return e;}();function J(t){return\"undefined\"==typeof BigInt?Q:t;}function Q(){throw new Error(\"BigInt not supported\");}},2949:function _(t,e,n){\"use strict\";n.d(e,{S9:function S9(){return i();},kC:function kC(){return s;}});var r=n(7067),i=n.n(r),o=n(8764);var s=/*#__PURE__*/function(){function s(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};_classCallCheck(this,s);this.baseOverrides={},this.url=t;var n=e.fetch||globalThis.fetch.bind(globalThis);if(!n)throw new TypeError(\"no fetch function supplied, and none found in global environment\");e.overrides&&(this.baseOverrides=e.overrides),this.fetchImplementation=n;}_createClass(s,[{key:\"getBufferFromResponse\",value:function(){var _getBufferFromResponse=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee21(t){var e;return _regeneratorRuntime().wrap(function _callee21$(_context24){while(1)switch(_context24.prev=_context24.next){case 0:_context24.next=2;return t.arrayBuffer();case 2:e=_context24.sent;return _context24.abrupt(\"return\",o.lW.from(e));case 4:case\"end\":return _context24.stop();}},_callee21);}));function getBufferFromResponse(_x36){return _getBufferFromResponse.apply(this,arguments);}return getBufferFromResponse;}()},{key:\"fetch\",value:function(){var _fetch2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee22(t,e){var n;return _regeneratorRuntime().wrap(function _callee22$(_context25){while(1)switch(_context25.prev=_context25.next){case 0:_context25.prev=0;_context25.next=3;return this.fetchImplementation(t,e);case 3:n=_context25.sent;_context25.next=14;break;case 6:_context25.prev=6;_context25.t0=_context25[\"catch\"](0);if(\"\".concat(_context25.t0).includes(\"Failed to fetch\")){_context25.next=10;break;}throw _context25.t0;case 10:console.warn(\"generic-filehandle: refetching \".concat(t,\" to attempt to work around chrome CORS header caching bug\"));_context25.next=13;return this.fetchImplementation(t,_objectSpread(_objectSpread({},e),{},{cache:\"reload\"}));case 13:n=_context25.sent;case 14:return _context25.abrupt(\"return\",n);case 15:case\"end\":return _context25.stop();}},_callee22,this,[[0,6]]);}));function fetch(_x37,_x38){return _fetch2.apply(this,arguments);}return fetch;}()},{key:\"read\",value:function(){var _read2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee23(t){var e,n,r,i,_i$headers,o,_s7,_i$overrides,a,u,l,_r16,_i12,_o6,_s8,_args26=arguments;return _regeneratorRuntime().wrap(function _callee23$(_context26){while(1)switch(_context26.prev=_context26.next){case 0:e=_args26.length>1&&_args26[1]!==undefined?_args26[1]:0;n=_args26.length>2?_args26[2]:undefined;r=_args26.length>3&&_args26[3]!==undefined?_args26[3]:0;i=_args26.length>4&&_args26[4]!==undefined?_args26[4]:{};_i$headers=i.headers,o=_i$headers===void 0?{}:_i$headers,_s7=i.signal,_i$overrides=i.overrides,a=_i$overrides===void 0?{}:_i$overrides;n<1/0?o.range=\"bytes=\".concat(r,\"-\").concat(r+n):n===1/0&&0!==r&&(o.range=\"bytes=\".concat(r,\"-\"));u=_objectSpread(_objectSpread(_objectSpread({},this.baseOverrides),a),{},{headers:_objectSpread(_objectSpread(_objectSpread({},o),a.headers),this.baseOverrides.headers),method:\"GET\",redirect:\"follow\",mode:\"cors\",signal:_s7});_context26.next=9;return this.fetch(this.url,u);case 9:l=_context26.sent;if(l.ok){_context26.next=12;break;}throw new Error(\"HTTP \".concat(l.status,\" \").concat(l.statusText,\" \").concat(this.url));case 12:if(!(200===l.status&&0===r||206===l.status)){_context26.next=20;break;}_context26.next=15;return this.getBufferFromResponse(l);case 15:_r16=_context26.sent;_i12=_r16.copy(t,e,0,Math.min(n,_r16.length));_o6=l.headers.get(\"content-range\");_s8=/\\/(\\d+)$/.exec(_o6||\"\");return _context26.abrupt(\"return\",((null==_s8?void 0:_s8[1])&&(this._stat={size:parseInt(_s8[1],10)}),{bytesRead:_i12,buffer:t}));case 20:if(!(200===l.status)){_context26.next=22;break;}throw new Error(\"${this.url} fetch returned status 200, expected 206\");case 22:throw new Error(\"HTTP \".concat(l.status,\" fetching \").concat(this.url));case 23:case\"end\":return _context26.stop();}},_callee23,this);}));function read(_x39){return _read2.apply(this,arguments);}return read;}()},{key:\"readFile\",value:function(){var _readFile=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee24(){var t,e,n,_n11,_n11$headers,r,i,_n11$overrides,o,_s9,a,_args27=arguments;return _regeneratorRuntime().wrap(function _callee24$(_context27){while(1)switch(_context27.prev=_context27.next){case 0:t=_args27.length>0&&_args27[0]!==undefined?_args27[0]:{};\"string\"==typeof t?(e=t,n={}):(e=t.encoding,n=t,delete n.encoding);_n11=n;_n11$headers=_n11.headers;r=_n11$headers===void 0?{}:_n11$headers;i=_n11.signal;_n11$overrides=_n11.overrides;o=_n11$overrides===void 0?{}:_n11$overrides;_s9=_objectSpread(_objectSpread({headers:r,method:\"GET\",redirect:\"follow\",mode:\"cors\",signal:i},this.baseOverrides),o);_context27.next=11;return this.fetch(this.url,_s9);case 11:a=_context27.sent;if(a){_context27.next=14;break;}throw new Error(\"generic-filehandle failed to fetch\");case 14:if(!(200!==a.status)){_context27.next=16;break;}throw Object.assign(new Error(\"HTTP \".concat(a.status,\" fetching \").concat(this.url)),{status:a.status});case 16:if(!(\"utf8\"===e)){_context27.next=18;break;}return _context27.abrupt(\"return\",a.text());case 18:if(!e){_context27.next=20;break;}throw new Error(\"unsupported encoding: \".concat(e));case 20:return _context27.abrupt(\"return\",this.getBufferFromResponse(a));case 21:case\"end\":return _context27.stop();}},_callee24,this);}));function readFile(){return _readFile.apply(this,arguments);}return readFile;}()},{key:\"stat\",value:function(){var _stat2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee25(){var _t14;return _regeneratorRuntime().wrap(function _callee25$(_context28){while(1)switch(_context28.prev=_context28.next){case 0:if(this._stat){_context28.next=6;break;}_t14=o.lW.allocUnsafe(10);_context28.next=4;return this.read(_t14,0,10,0);case 4:if(this._stat){_context28.next=6;break;}throw new Error(\"unable to determine size of file at \".concat(this.url));case 6:return _context28.abrupt(\"return\",this._stat);case 7:case\"end\":return _context28.stop();}},_callee25,this);}));function stat(){return _stat2.apply(this,arguments);}return stat;}()},{key:\"close\",value:function(){var _close=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee26(){return _regeneratorRuntime().wrap(function _callee26$(_context29){while(1)switch(_context29.prev=_context29.next){case 0:case\"end\":return _context29.stop();}},_callee26);}));function close(){return _close.apply(this,arguments);}return close;}()}]);return s;}();},645:function _(t,e){e.read=function(t,e,n,r,i){var o,s,a=8*i-r-1,u=(1<<a)-1,l=u>>1,h=-7,c=n?i-1:0,f=n?-1:1,d=t[e+c];for(c+=f,o=d&(1<<-h)-1,d>>=-h,h+=a;h>0;o=256*o+t[e+c],c+=f,h-=8);for(s=o&(1<<-h)-1,o>>=-h,h+=r;h>0;s=256*s+t[e+c],c+=f,h-=8);if(0===o)o=1-l;else{if(o===u)return s?NaN:1/0*(d?-1:1);s+=Math.pow(2,r),o-=l;}return(d?-1:1)*s*Math.pow(2,o-r);},e.write=function(t,e,n,r,i,o){var s,a,u,l=8*o-i-1,h=(1<<l)-1,c=h>>1,f=23===i?Math.pow(2,-24)-Math.pow(2,-77):0,d=r?0:o-1,p=r?1:-1,g=e<0||0===e&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(a=isNaN(e)?1:0,s=h):(s=Math.floor(Math.log(e)/Math.LN2),e*(u=Math.pow(2,-s))<1&&(s--,u*=2),(e+=s+c>=1?f/u:f*Math.pow(2,1-c))*u>=2&&(s++,u/=2),s+c>=h?(a=0,s=h):s+c>=1?(a=(e*u-1)*Math.pow(2,i),s+=c):(a=e*Math.pow(2,c-1)*Math.pow(2,i),s=0));i>=8;t[n+d]=255&a,d+=p,a/=256,i-=8);for(s=s<<i|a,l+=i;l>0;t[n+d]=255&s,d+=p,s/=256,l-=8);t[n+d-p]|=128*g;};},6898:function _(t){\"use strict\";t.exports=function(t){return!!t&&(\"symbol\"==_typeof(Symbol.observable)&&\"function\"==typeof t[Symbol.observable]?t===t[Symbol.observable]():\"function\"==typeof t[\"@@observable\"]&&t===t[\"@@observable\"]());};},6486:function _(t,e,n){var r;t=n.nmd(t),function(){var i,o=\"Expected a function\",s=\"__lodash_hash_undefined__\",a=\"__lodash_placeholder__\",u=32,l=128,h=1/0,c=9007199254740991,f=NaN,d=4294967295,p=[[\"ary\",l],[\"bind\",1],[\"bindKey\",2],[\"curry\",8],[\"curryRight\",16],[\"flip\",512],[\"partial\",u],[\"partialRight\",64],[\"rearg\",256]],g=\"[object Arguments]\",_=\"[object Array]\",m=\"[object Boolean]\",v=\"[object Date]\",y=\"[object Error]\",b=\"[object Function]\",w=\"[object GeneratorFunction]\",x=\"[object Map]\",k=\"[object Number]\",A=\"[object Object]\",E=\"[object Promise]\",S=\"[object RegExp]\",M=\"[object Set]\",B=\"[object String]\",T=\"[object Symbol]\",z=\"[object WeakMap]\",C=\"[object ArrayBuffer]\",N=\"[object DataView]\",I=\"[object Float32Array]\",O=\"[object Float64Array]\",R=\"[object Int8Array]\",L=\"[object Int16Array]\",U=\"[object Int32Array]\",j=\"[object Uint8Array]\",P=\"[object Uint8ClampedArray]\",D=\"[object Uint16Array]\",F=\"[object Uint32Array]\",$=/\\b__p \\+= '';/g,H=/\\b(__p \\+=) '' \\+/g,q=/(__e\\(.*?\\)|\\b__t\\)) \\+\\n'';/g,Z=/&(?:amp|lt|gt|quot|#39);/g,W=/[&<>\"']/g,G=RegExp(Z.source),Y=RegExp(W.source),V=/<%-([\\s\\S]+?)%>/g,X=/<%([\\s\\S]+?)%>/g,K=/<%=([\\s\\S]+?)%>/g,J=/\\.|\\[(?:[^[\\]]*|([\"'])(?:(?!\\1)[^\\\\]|\\\\.)*?\\1)\\]/,Q=/^\\w*$/,tt=/[^.[\\]]+|\\[(?:(-?\\d+(?:\\.\\d+)?)|([\"'])((?:(?!\\2)[^\\\\]|\\\\.)*?)\\2)\\]|(?=(?:\\.|\\[\\])(?:\\.|\\[\\]|$))/g,et=/[\\\\^$.*+?()[\\]{}|]/g,nt=RegExp(et.source),rt=/^\\s+/,it=/\\s/,ot=/\\{(?:\\n\\/\\* \\[wrapped with .+\\] \\*\\/)?\\n?/,st=/\\{\\n\\/\\* \\[wrapped with (.+)\\] \\*/,at=/,? & /,ut=/[^\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\x7f]+/g,lt=/[()=,{}\\[\\]\\/\\s]/,ht=/\\\\(\\\\)?/g,ct=/\\$\\{([^\\\\}]*(?:\\\\.[^\\\\}]*)*)\\}/g,ft=/\\w*$/,dt=/^[-+]0x[0-9a-f]+$/i,pt=/^0b[01]+$/i,gt=/^\\[object .+?Constructor\\]$/,_t=/^0o[0-7]+$/i,mt=/^(?:0|[1-9]\\d*)$/,vt=/[\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\xff\\u0100-\\u017f]/g,yt=/($^)/,bt=/['\\n\\r\\u2028\\u2029\\\\]/g,wt=\"\\\\ud800-\\\\udfff\",xt=\"\\\\u0300-\\\\u036f\\\\ufe20-\\\\ufe2f\\\\u20d0-\\\\u20ff\",kt=\"\\\\u2700-\\\\u27bf\",At=\"a-z\\\\xdf-\\\\xf6\\\\xf8-\\\\xff\",Et=\"A-Z\\\\xc0-\\\\xd6\\\\xd8-\\\\xde\",St=\"\\\\ufe0e\\\\ufe0f\",Mt=\"\\\\xac\\\\xb1\\\\xd7\\\\xf7\\\\x00-\\\\x2f\\\\x3a-\\\\x40\\\\x5b-\\\\x60\\\\x7b-\\\\xbf\\\\u2000-\\\\u206f \\\\t\\\\x0b\\\\f\\\\xa0\\\\ufeff\\\\n\\\\r\\\\u2028\\\\u2029\\\\u1680\\\\u180e\\\\u2000\\\\u2001\\\\u2002\\\\u2003\\\\u2004\\\\u2005\\\\u2006\\\\u2007\\\\u2008\\\\u2009\\\\u200a\\\\u202f\\\\u205f\\\\u3000\",Bt=\"[\"+wt+\"]\",Tt=\"[\"+Mt+\"]\",zt=\"[\"+xt+\"]\",Ct=\"\\\\d+\",Nt=\"[\"+kt+\"]\",It=\"[\"+At+\"]\",Ot=\"[^\"+wt+Mt+Ct+kt+At+Et+\"]\",Rt=\"\\\\ud83c[\\\\udffb-\\\\udfff]\",Lt=\"[^\"+wt+\"]\",Ut=\"(?:\\\\ud83c[\\\\udde6-\\\\uddff]){2}\",jt=\"[\\\\ud800-\\\\udbff][\\\\udc00-\\\\udfff]\",Pt=\"[\"+Et+\"]\",Dt=\"\\\\u200d\",Ft=\"(?:\"+It+\"|\"+Ot+\")\",$t=\"(?:\"+Pt+\"|\"+Ot+\")\",Ht=\"(?:['’](?:d|ll|m|re|s|t|ve))?\",qt=\"(?:['’](?:D|LL|M|RE|S|T|VE))?\",Zt=\"(?:\"+zt+\"|\"+Rt+\")?\",Wt=\"[\"+St+\"]?\",Gt=Wt+Zt+\"(?:\"+Dt+\"(?:\"+[Lt,Ut,jt].join(\"|\")+\")\"+Wt+Zt+\")*\",Yt=\"(?:\"+[Nt,Ut,jt].join(\"|\")+\")\"+Gt,Vt=\"(?:\"+[Lt+zt+\"?\",zt,Ut,jt,Bt].join(\"|\")+\")\",Xt=RegExp(\"['’]\",\"g\"),Kt=RegExp(zt,\"g\"),Jt=RegExp(Rt+\"(?=\"+Rt+\")|\"+Vt+Gt,\"g\"),Qt=RegExp([Pt+\"?\"+It+\"+\"+Ht+\"(?=\"+[Tt,Pt,\"$\"].join(\"|\")+\")\",$t+\"+\"+qt+\"(?=\"+[Tt,Pt+Ft,\"$\"].join(\"|\")+\")\",Pt+\"?\"+Ft+\"+\"+Ht,Pt+\"+\"+qt,\"\\\\d*(?:1ST|2ND|3RD|(?![123])\\\\dTH)(?=\\\\b|[a-z_])\",\"\\\\d*(?:1st|2nd|3rd|(?![123])\\\\dth)(?=\\\\b|[A-Z_])\",Ct,Yt].join(\"|\"),\"g\"),te=RegExp(\"[\"+Dt+wt+xt+St+\"]\"),ee=/[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,ne=[\"Array\",\"Buffer\",\"DataView\",\"Date\",\"Error\",\"Float32Array\",\"Float64Array\",\"Function\",\"Int8Array\",\"Int16Array\",\"Int32Array\",\"Map\",\"Math\",\"Object\",\"Promise\",\"RegExp\",\"Set\",\"String\",\"Symbol\",\"TypeError\",\"Uint8Array\",\"Uint8ClampedArray\",\"Uint16Array\",\"Uint32Array\",\"WeakMap\",\"_\",\"clearTimeout\",\"isFinite\",\"parseInt\",\"setTimeout\"],re=-1,ie={};ie[I]=ie[O]=ie[R]=ie[L]=ie[U]=ie[j]=ie[P]=ie[D]=ie[F]=!0,ie[g]=ie[_]=ie[C]=ie[m]=ie[N]=ie[v]=ie[y]=ie[b]=ie[x]=ie[k]=ie[A]=ie[S]=ie[M]=ie[B]=ie[z]=!1;var oe={};oe[g]=oe[_]=oe[C]=oe[N]=oe[m]=oe[v]=oe[I]=oe[O]=oe[R]=oe[L]=oe[U]=oe[x]=oe[k]=oe[A]=oe[S]=oe[M]=oe[B]=oe[T]=oe[j]=oe[P]=oe[D]=oe[F]=!0,oe[y]=oe[b]=oe[z]=!1;var se={\"\\\\\":\"\\\\\",\"'\":\"'\",\"\\n\":\"n\",\"\\r\":\"r\",\"\\u2028\":\"u2028\",\"\\u2029\":\"u2029\"},ae=parseFloat,ue=parseInt,le=\"object\"==_typeof(n.g)&&n.g&&n.g.Object===Object&&n.g,he=\"object\"==(typeof self===\"undefined\"?\"undefined\":_typeof(self))&&self&&self.Object===Object&&self,ce=le||he||Function(\"return this\")(),fe=e&&!e.nodeType&&e,de=fe&&t&&!t.nodeType&&t,pe=de&&de.exports===fe,ge=pe&&le.process,_e=function(){try{return de&&de.require&&de.require(\"util\").types||ge&&ge.binding&&ge.binding(\"util\");}catch(t){}}(),me=_e&&_e.isArrayBuffer,ve=_e&&_e.isDate,ye=_e&&_e.isMap,be=_e&&_e.isRegExp,we=_e&&_e.isSet,xe=_e&&_e.isTypedArray;function ke(t,e,n){switch(n.length){case 0:return t.call(e);case 1:return t.call(e,n[0]);case 2:return t.call(e,n[0],n[1]);case 3:return t.call(e,n[0],n[1],n[2]);}return t.apply(e,n);}function Ae(t,e,n,r){for(var i=-1,o=null==t?0:t.length;++i<o;){var s=t[i];e(r,s,n(s),t);}return r;}function Ee(t,e){for(var n=-1,r=null==t?0:t.length;++n<r&&!1!==e(t[n],n,t););return t;}function Se(t,e){for(var n=null==t?0:t.length;n--&&!1!==e(t[n],n,t););return t;}function Me(t,e){for(var n=-1,r=null==t?0:t.length;++n<r;)if(!e(t[n],n,t))return!1;return!0;}function Be(t,e){for(var n=-1,r=null==t?0:t.length,i=0,o=[];++n<r;){var s=t[n];e(s,n,t)&&(o[i++]=s);}return o;}function Te(t,e){return!(null==t||!t.length)&&Pe(t,e,0)>-1;}function ze(t,e,n){for(var r=-1,i=null==t?0:t.length;++r<i;)if(n(e,t[r]))return!0;return!1;}function Ce(t,e){for(var n=-1,r=null==t?0:t.length,i=Array(r);++n<r;)i[n]=e(t[n],n,t);return i;}function Ne(t,e){for(var n=-1,r=e.length,i=t.length;++n<r;)t[i+n]=e[n];return t;}function Ie(t,e,n,r){var i=-1,o=null==t?0:t.length;for(r&&o&&(n=t[++i]);++i<o;)n=e(n,t[i],i,t);return n;}function Oe(t,e,n,r){var i=null==t?0:t.length;for(r&&i&&(n=t[--i]);i--;)n=e(n,t[i],i,t);return n;}function Re(t,e){for(var n=-1,r=null==t?0:t.length;++n<r;)if(e(t[n],n,t))return!0;return!1;}var Le=He(\"length\");function Ue(t,e,n){var r;return n(t,function(t,n,i){if(e(t,n,i))return r=n,!1;}),r;}function je(t,e,n,r){for(var i=t.length,o=n+(r?1:-1);r?o--:++o<i;)if(e(t[o],o,t))return o;return-1;}function Pe(t,e,n){return e==e?function(t,e,n){for(var r=n-1,i=t.length;++r<i;)if(t[r]===e)return r;return-1;}(t,e,n):je(t,Fe,n);}function De(t,e,n,r){for(var i=n-1,o=t.length;++i<o;)if(r(t[i],e))return i;return-1;}function Fe(t){return t!=t;}function $e(t,e){var n=null==t?0:t.length;return n?We(t,e)/n:f;}function He(t){return function(e){return null==e?i:e[t];};}function qe(t){return function(e){return null==t?i:t[e];};}function Ze(t,e,n,r,i){return i(t,function(t,i,o){n=r?(r=!1,t):e(n,t,i,o);}),n;}function We(t,e){for(var n,r=-1,o=t.length;++r<o;){var s=e(t[r]);s!==i&&(n=n===i?s:n+s);}return n;}function Ge(t,e){for(var n=-1,r=Array(t);++n<t;)r[n]=e(n);return r;}function Ye(t){return t?t.slice(0,fn(t)+1).replace(rt,\"\"):t;}function Ve(t){return function(e){return t(e);};}function Xe(t,e){return Ce(e,function(e){return t[e];});}function Ke(t,e){return t.has(e);}function Je(t,e){for(var n=-1,r=t.length;++n<r&&Pe(e,t[n],0)>-1;);return n;}function Qe(t,e){for(var n=t.length;n--&&Pe(e,t[n],0)>-1;);return n;}var tn=qe({À:\"A\",Á:\"A\",Â:\"A\",Ã:\"A\",Ä:\"A\",Å:\"A\",à:\"a\",á:\"a\",â:\"a\",ã:\"a\",ä:\"a\",å:\"a\",Ç:\"C\",ç:\"c\",Ð:\"D\",ð:\"d\",È:\"E\",É:\"E\",Ê:\"E\",Ë:\"E\",è:\"e\",é:\"e\",ê:\"e\",ë:\"e\",Ì:\"I\",Í:\"I\",Î:\"I\",Ï:\"I\",ì:\"i\",í:\"i\",î:\"i\",ï:\"i\",Ñ:\"N\",ñ:\"n\",Ò:\"O\",Ó:\"O\",Ô:\"O\",Õ:\"O\",Ö:\"O\",Ø:\"O\",ò:\"o\",ó:\"o\",ô:\"o\",õ:\"o\",ö:\"o\",ø:\"o\",Ù:\"U\",Ú:\"U\",Û:\"U\",Ü:\"U\",ù:\"u\",ú:\"u\",û:\"u\",ü:\"u\",Ý:\"Y\",ý:\"y\",ÿ:\"y\",Æ:\"Ae\",æ:\"ae\",Þ:\"Th\",þ:\"th\",ß:\"ss\",Ā:\"A\",Ă:\"A\",Ą:\"A\",ā:\"a\",ă:\"a\",ą:\"a\",Ć:\"C\",Ĉ:\"C\",Ċ:\"C\",Č:\"C\",ć:\"c\",ĉ:\"c\",ċ:\"c\",č:\"c\",Ď:\"D\",Đ:\"D\",ď:\"d\",đ:\"d\",Ē:\"E\",Ĕ:\"E\",Ė:\"E\",Ę:\"E\",Ě:\"E\",ē:\"e\",ĕ:\"e\",ė:\"e\",ę:\"e\",ě:\"e\",Ĝ:\"G\",Ğ:\"G\",Ġ:\"G\",Ģ:\"G\",ĝ:\"g\",ğ:\"g\",ġ:\"g\",ģ:\"g\",Ĥ:\"H\",Ħ:\"H\",ĥ:\"h\",ħ:\"h\",Ĩ:\"I\",Ī:\"I\",Ĭ:\"I\",Į:\"I\",İ:\"I\",ĩ:\"i\",ī:\"i\",ĭ:\"i\",į:\"i\",ı:\"i\",Ĵ:\"J\",ĵ:\"j\",Ķ:\"K\",ķ:\"k\",ĸ:\"k\",Ĺ:\"L\",Ļ:\"L\",Ľ:\"L\",Ŀ:\"L\",Ł:\"L\",ĺ:\"l\",ļ:\"l\",ľ:\"l\",ŀ:\"l\",ł:\"l\",Ń:\"N\",Ņ:\"N\",Ň:\"N\",Ŋ:\"N\",ń:\"n\",ņ:\"n\",ň:\"n\",ŋ:\"n\",Ō:\"O\",Ŏ:\"O\",Ő:\"O\",ō:\"o\",ŏ:\"o\",ő:\"o\",Ŕ:\"R\",Ŗ:\"R\",Ř:\"R\",ŕ:\"r\",ŗ:\"r\",ř:\"r\",Ś:\"S\",Ŝ:\"S\",Ş:\"S\",Š:\"S\",ś:\"s\",ŝ:\"s\",ş:\"s\",š:\"s\",Ţ:\"T\",Ť:\"T\",Ŧ:\"T\",ţ:\"t\",ť:\"t\",ŧ:\"t\",Ũ:\"U\",Ū:\"U\",Ŭ:\"U\",Ů:\"U\",Ű:\"U\",Ų:\"U\",ũ:\"u\",ū:\"u\",ŭ:\"u\",ů:\"u\",ű:\"u\",ų:\"u\",Ŵ:\"W\",ŵ:\"w\",Ŷ:\"Y\",ŷ:\"y\",Ÿ:\"Y\",Ź:\"Z\",Ż:\"Z\",Ž:\"Z\",ź:\"z\",ż:\"z\",ž:\"z\",Ĳ:\"IJ\",ĳ:\"ij\",Œ:\"Oe\",œ:\"oe\",ŉ:\"'n\",ſ:\"s\"}),en=qe({\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#39;\"});function nn(t){return\"\\\\\"+se[t];}function rn(t){return te.test(t);}function on(t){var e=-1,n=Array(t.size);return t.forEach(function(t,r){n[++e]=[r,t];}),n;}function sn(t,e){return function(n){return t(e(n));};}function an(t,e){for(var n=-1,r=t.length,i=0,o=[];++n<r;){var s=t[n];s!==e&&s!==a||(t[n]=a,o[i++]=n);}return o;}function un(t){var e=-1,n=Array(t.size);return t.forEach(function(t){n[++e]=t;}),n;}function ln(t){var e=-1,n=Array(t.size);return t.forEach(function(t){n[++e]=[t,t];}),n;}function hn(t){return rn(t)?function(t){for(var e=Jt.lastIndex=0;Jt.test(t);)++e;return e;}(t):Le(t);}function cn(t){return rn(t)?function(t){return t.match(Jt)||[];}(t):function(t){return t.split(\"\");}(t);}function fn(t){for(var e=t.length;e--&&it.test(t.charAt(e)););return e;}var dn=qe({\"&amp;\":\"&\",\"&lt;\":\"<\",\"&gt;\":\">\",\"&quot;\":'\"',\"&#39;\":\"'\"}),pn=function t(e){var n,r=(e=null==e?ce:pn.defaults(ce.Object(),e,pn.pick(ce,ne))).Array,it=e.Date,wt=e.Error,xt=e.Function,kt=e.Math,At=e.Object,Et=e.RegExp,St=e.String,Mt=e.TypeError,Bt=r.prototype,Tt=xt.prototype,zt=At.prototype,Ct=e[\"__core-js_shared__\"],Nt=Tt.toString,It=zt.hasOwnProperty,Ot=0,Rt=(n=/[^.]+$/.exec(Ct&&Ct.keys&&Ct.keys.IE_PROTO||\"\"))?\"Symbol(src)_1.\"+n:\"\",Lt=zt.toString,Ut=Nt.call(At),jt=ce._,Pt=Et(\"^\"+Nt.call(It).replace(et,\"\\\\$&\").replace(/hasOwnProperty|(function).*?(?=\\\\\\()| for .+?(?=\\\\\\])/g,\"$1.*?\")+\"$\"),Dt=pe?e.Buffer:i,Ft=e.Symbol,$t=e.Uint8Array,Ht=Dt?Dt.allocUnsafe:i,qt=sn(At.getPrototypeOf,At),Zt=At.create,Wt=zt.propertyIsEnumerable,Gt=Bt.splice,Yt=Ft?Ft.isConcatSpreadable:i,Vt=Ft?Ft.iterator:i,Jt=Ft?Ft.toStringTag:i,te=function(){try{var t=uo(At,\"defineProperty\");return t({},\"\",{}),t;}catch(t){}}(),se=e.clearTimeout!==ce.clearTimeout&&e.clearTimeout,le=it&&it.now!==ce.Date.now&&it.now,he=e.setTimeout!==ce.setTimeout&&e.setTimeout,fe=kt.ceil,de=kt.floor,ge=At.getOwnPropertySymbols,_e=Dt?Dt.isBuffer:i,Le=e.isFinite,qe=Bt.join,gn=sn(At.keys,At),_n=kt.max,mn=kt.min,vn=it.now,yn=e.parseInt,bn=kt.random,wn=Bt.reverse,xn=uo(e,\"DataView\"),kn=uo(e,\"Map\"),An=uo(e,\"Promise\"),En=uo(e,\"Set\"),Sn=uo(e,\"WeakMap\"),Mn=uo(At,\"create\"),Bn=Sn&&new Sn(),Tn={},zn=Uo(xn),Cn=Uo(kn),Nn=Uo(An),In=Uo(En),On=Uo(Sn),Rn=Ft?Ft.prototype:i,Ln=Rn?Rn.valueOf:i,Un=Rn?Rn.toString:i;function jn(t){if(ta(t)&&!Hs(t)&&!(t instanceof $n)){if(t instanceof Fn)return t;if(It.call(t,\"__wrapped__\"))return jo(t);}return new Fn(t);}var Pn=function(){function t(){}return function(e){if(!Qs(e))return{};if(Zt)return Zt(e);t.prototype=e;var n=new t();return t.prototype=i,n;};}();function Dn(){}function Fn(t,e){this.__wrapped__=t,this.__actions__=[],this.__chain__=!!e,this.__index__=0,this.__values__=i;}function $n(t){this.__wrapped__=t,this.__actions__=[],this.__dir__=1,this.__filtered__=!1,this.__iteratees__=[],this.__takeCount__=d,this.__views__=[];}function Hn(t){var e=-1,n=null==t?0:t.length;for(this.clear();++e<n;){var r=t[e];this.set(r[0],r[1]);}}function qn(t){var e=-1,n=null==t?0:t.length;for(this.clear();++e<n;){var r=t[e];this.set(r[0],r[1]);}}function Zn(t){var e=-1,n=null==t?0:t.length;for(this.clear();++e<n;){var r=t[e];this.set(r[0],r[1]);}}function Wn(t){var e=-1,n=null==t?0:t.length;for(this.__data__=new Zn();++e<n;)this.add(t[e]);}function Gn(t){var e=this.__data__=new qn(t);this.size=e.size;}function Yn(t,e){var n=Hs(t),r=!n&&$s(t),i=!n&&!r&&Gs(t),o=!n&&!r&&!i&&ua(t),s=n||r||i||o,a=s?Ge(t.length,St):[],u=a.length;for(var l in t)!e&&!It.call(t,l)||s&&(\"length\"==l||i&&(\"offset\"==l||\"parent\"==l)||o&&(\"buffer\"==l||\"byteLength\"==l||\"byteOffset\"==l)||_o(l,u))||a.push(l);return a;}function Vn(t){var e=t.length;return e?t[Zr(0,e-1)]:i;}function Xn(t,e){return No(Si(t),or(e,0,t.length));}function Kn(t){return No(Si(t));}function Jn(t,e,n){(n!==i&&!Ps(t[e],n)||n===i&&!(e in t))&&rr(t,e,n);}function Qn(t,e,n){var r=t[e];It.call(t,e)&&Ps(r,n)&&(n!==i||e in t)||rr(t,e,n);}function tr(t,e){for(var n=t.length;n--;)if(Ps(t[n][0],e))return n;return-1;}function er(t,e,n,r){return hr(t,function(t,i,o){e(r,t,n(t),o);}),r;}function nr(t,e){return t&&Mi(e,za(e),t);}function rr(t,e,n){\"__proto__\"==e&&te?te(t,e,{configurable:!0,enumerable:!0,value:n,writable:!0}):t[e]=n;}function ir(t,e){for(var n=-1,o=e.length,s=r(o),a=null==t;++n<o;)s[n]=a?i:Ea(t,e[n]);return s;}function or(t,e,n){return t==t&&(n!==i&&(t=t<=n?t:n),e!==i&&(t=t>=e?t:e)),t;}function sr(t,e,n,r,o,s){var a,u=1&e,l=2&e,h=4&e;if(n&&(a=o?n(t,r,o,s):n(t)),a!==i)return a;if(!Qs(t))return t;var c=Hs(t);if(c){if(a=function(t){var e=t.length,n=new t.constructor(e);return e&&\"string\"==typeof t[0]&&It.call(t,\"index\")&&(n.index=t.index,n.input=t.input),n;}(t),!u)return Si(t,a);}else{var f=co(t),d=f==b||f==w;if(Gs(t))return bi(t,u);if(f==A||f==g||d&&!o){if(a=l||d?{}:po(t),!u)return l?function(t,e){return Mi(t,ho(t),e);}(t,function(t,e){return t&&Mi(e,Ca(e),t);}(a,t)):function(t,e){return Mi(t,lo(t),e);}(t,nr(a,t));}else{if(!oe[f])return o?t:{};a=function(t,e,n){var r,i=t.constructor;switch(e){case C:return wi(t);case m:case v:return new i(+t);case N:return function(t,e){var n=e?wi(t.buffer):t.buffer;return new t.constructor(n,t.byteOffset,t.byteLength);}(t,n);case I:case O:case R:case L:case U:case j:case P:case D:case F:return xi(t,n);case x:return new i();case k:case B:return new i(t);case S:return function(t){var e=new t.constructor(t.source,ft.exec(t));return e.lastIndex=t.lastIndex,e;}(t);case M:return new i();case T:return r=t,Ln?At(Ln.call(r)):{};}}(t,f,u);}}s||(s=new Gn());var p=s.get(t);if(p)return p;s.set(t,a),oa(t)?t.forEach(function(r){a.add(sr(r,e,n,r,t,s));}):ea(t)&&t.forEach(function(r,i){a.set(i,sr(r,e,n,i,t,s));});var _=c?i:(h?l?eo:to:l?Ca:za)(t);return Ee(_||t,function(r,i){_&&(r=t[i=r]),Qn(a,i,sr(r,e,n,i,t,s));}),a;}function ar(t,e,n){var r=n.length;if(null==t)return!r;for(t=At(t);r--;){var o=n[r],s=e[o],a=t[o];if(a===i&&!(o in t)||!s(a))return!1;}return!0;}function ur(t,e,n){if(\"function\"!=typeof t)throw new Mt(o);return Bo(function(){t.apply(i,n);},e);}function lr(t,e,n,r){var i=-1,o=Te,s=!0,a=t.length,u=[],l=e.length;if(!a)return u;n&&(e=Ce(e,Ve(n))),r?(o=ze,s=!1):e.length>=200&&(o=Ke,s=!1,e=new Wn(e));t:for(;++i<a;){var h=t[i],c=null==n?h:n(h);if(h=r||0!==h?h:0,s&&c==c){for(var f=l;f--;)if(e[f]===c)continue t;u.push(h);}else o(e,c,r)||u.push(h);}return u;}jn.templateSettings={escape:V,evaluate:X,interpolate:K,variable:\"\",imports:{_:jn}},jn.prototype=Dn.prototype,jn.prototype.constructor=jn,Fn.prototype=Pn(Dn.prototype),Fn.prototype.constructor=Fn,$n.prototype=Pn(Dn.prototype),$n.prototype.constructor=$n,Hn.prototype.clear=function(){this.__data__=Mn?Mn(null):{},this.size=0;},Hn.prototype[\"delete\"]=function(t){var e=this.has(t)&&delete this.__data__[t];return this.size-=e?1:0,e;},Hn.prototype.get=function(t){var e=this.__data__;if(Mn){var n=e[t];return n===s?i:n;}return It.call(e,t)?e[t]:i;},Hn.prototype.has=function(t){var e=this.__data__;return Mn?e[t]!==i:It.call(e,t);},Hn.prototype.set=function(t,e){var n=this.__data__;return this.size+=this.has(t)?0:1,n[t]=Mn&&e===i?s:e,this;},qn.prototype.clear=function(){this.__data__=[],this.size=0;},qn.prototype[\"delete\"]=function(t){var e=this.__data__,n=tr(e,t);return!(n<0||(n==e.length-1?e.pop():Gt.call(e,n,1),--this.size,0));},qn.prototype.get=function(t){var e=this.__data__,n=tr(e,t);return n<0?i:e[n][1];},qn.prototype.has=function(t){return tr(this.__data__,t)>-1;},qn.prototype.set=function(t,e){var n=this.__data__,r=tr(n,t);return r<0?(++this.size,n.push([t,e])):n[r][1]=e,this;},Zn.prototype.clear=function(){this.size=0,this.__data__={hash:new Hn(),map:new(kn||qn)(),string:new Hn()};},Zn.prototype[\"delete\"]=function(t){var e=so(this,t)[\"delete\"](t);return this.size-=e?1:0,e;},Zn.prototype.get=function(t){return so(this,t).get(t);},Zn.prototype.has=function(t){return so(this,t).has(t);},Zn.prototype.set=function(t,e){var n=so(this,t),r=n.size;return n.set(t,e),this.size+=n.size==r?0:1,this;},Wn.prototype.add=Wn.prototype.push=function(t){return this.__data__.set(t,s),this;},Wn.prototype.has=function(t){return this.__data__.has(t);},Gn.prototype.clear=function(){this.__data__=new qn(),this.size=0;},Gn.prototype[\"delete\"]=function(t){var e=this.__data__,n=e[\"delete\"](t);return this.size=e.size,n;},Gn.prototype.get=function(t){return this.__data__.get(t);},Gn.prototype.has=function(t){return this.__data__.has(t);},Gn.prototype.set=function(t,e){var n=this.__data__;if(n instanceof qn){var r=n.__data__;if(!kn||r.length<199)return r.push([t,e]),this.size=++n.size,this;n=this.__data__=new Zn(r);}return n.set(t,e),this.size=n.size,this;};var hr=zi(vr),cr=zi(yr,!0);function fr(t,e){var n=!0;return hr(t,function(t,r,i){return n=!!e(t,r,i);}),n;}function dr(t,e,n){for(var r=-1,o=t.length;++r<o;){var s=t[r],a=e(s);if(null!=a&&(u===i?a==a&&!aa(a):n(a,u)))var u=a,l=s;}return l;}function pr(t,e){var n=[];return hr(t,function(t,r,i){e(t,r,i)&&n.push(t);}),n;}function gr(t,e,n,r,i){var o=-1,s=t.length;for(n||(n=go),i||(i=[]);++o<s;){var a=t[o];e>0&&n(a)?e>1?gr(a,e-1,n,r,i):Ne(i,a):r||(i[i.length]=a);}return i;}var _r=Ci(),mr=Ci(!0);function vr(t,e){return t&&_r(t,e,za);}function yr(t,e){return t&&mr(t,e,za);}function br(t,e){return Be(e,function(e){return Xs(t[e]);});}function wr(t,e){for(var n=0,r=(e=_i(e,t)).length;null!=t&&n<r;)t=t[Lo(e[n++])];return n&&n==r?t:i;}function xr(t,e,n){var r=e(t);return Hs(t)?r:Ne(r,n(t));}function kr(t){return null==t?t===i?\"[object Undefined]\":\"[object Null]\":Jt&&Jt in At(t)?function(t){var e=It.call(t,Jt),n=t[Jt];try{t[Jt]=i;var r=!0;}catch(t){}var o=Lt.call(t);return r&&(e?t[Jt]=n:delete t[Jt]),o;}(t):function(t){return Lt.call(t);}(t);}function Ar(t,e){return t>e;}function Er(t,e){return null!=t&&It.call(t,e);}function Sr(t,e){return null!=t&&e in At(t);}function Mr(t,e,n){for(var o=n?ze:Te,s=t[0].length,a=t.length,u=a,l=r(a),h=1/0,c=[];u--;){var f=t[u];u&&e&&(f=Ce(f,Ve(e))),h=mn(f.length,h),l[u]=!n&&(e||s>=120&&f.length>=120)?new Wn(u&&f):i;}f=t[0];var d=-1,p=l[0];t:for(;++d<s&&c.length<h;){var g=f[d],_=e?e(g):g;if(g=n||0!==g?g:0,!(p?Ke(p,_):o(c,_,n))){for(u=a;--u;){var m=l[u];if(!(m?Ke(m,_):o(t[u],_,n)))continue t;}p&&p.push(_),c.push(g);}}return c;}function Br(t,e,n){var r=null==(t=Eo(t,e=_i(e,t)))?t:t[Lo(Vo(e))];return null==r?i:ke(r,t,n);}function Tr(t){return ta(t)&&kr(t)==g;}function zr(t,e,n,r,o){return t===e||(null==t||null==e||!ta(t)&&!ta(e)?t!=t&&e!=e:function(t,e,n,r,o,s){var a=Hs(t),u=Hs(e),l=a?_:co(t),h=u?_:co(e),c=(l=l==g?A:l)==A,f=(h=h==g?A:h)==A,d=l==h;if(d&&Gs(t)){if(!Gs(e))return!1;a=!0,c=!1;}if(d&&!c)return s||(s=new Gn()),a||ua(t)?Ji(t,e,n,r,o,s):function(t,e,n,r,i,o,s){switch(n){case N:if(t.byteLength!=e.byteLength||t.byteOffset!=e.byteOffset)return!1;t=t.buffer,e=e.buffer;case C:return!(t.byteLength!=e.byteLength||!o(new $t(t),new $t(e)));case m:case v:case k:return Ps(+t,+e);case y:return t.name==e.name&&t.message==e.message;case S:case B:return t==e+\"\";case x:var a=on;case M:var u=1&r;if(a||(a=un),t.size!=e.size&&!u)return!1;var l=s.get(t);if(l)return l==e;r|=2,s.set(t,e);var h=Ji(a(t),a(e),r,i,o,s);return s[\"delete\"](t),h;case T:if(Ln)return Ln.call(t)==Ln.call(e);}return!1;}(t,e,l,n,r,o,s);if(!(1&n)){var p=c&&It.call(t,\"__wrapped__\"),b=f&&It.call(e,\"__wrapped__\");if(p||b){var w=p?t.value():t,E=b?e.value():e;return s||(s=new Gn()),o(w,E,n,r,s);}}return!!d&&(s||(s=new Gn()),function(t,e,n,r,o,s){var a=1&n,u=to(t),l=u.length;if(l!=to(e).length&&!a)return!1;for(var h=l;h--;){var c=u[h];if(!(a?c in e:It.call(e,c)))return!1;}var f=s.get(t),d=s.get(e);if(f&&d)return f==e&&d==t;var p=!0;s.set(t,e),s.set(e,t);for(var g=a;++h<l;){var _=t[c=u[h]],m=e[c];if(r)var v=a?r(m,_,c,e,t,s):r(_,m,c,t,e,s);if(!(v===i?_===m||o(_,m,n,r,s):v)){p=!1;break;}g||(g=\"constructor\"==c);}if(p&&!g){var y=t.constructor,b=e.constructor;y==b||!(\"constructor\"in t)||!(\"constructor\"in e)||\"function\"==typeof y&&y instanceof y&&\"function\"==typeof b&&b instanceof b||(p=!1);}return s[\"delete\"](t),s[\"delete\"](e),p;}(t,e,n,r,o,s));}(t,e,n,r,zr,o));}function Cr(t,e,n,r){var o=n.length,s=o,a=!r;if(null==t)return!s;for(t=At(t);o--;){var u=n[o];if(a&&u[2]?u[1]!==t[u[0]]:!(u[0]in t))return!1;}for(;++o<s;){var l=(u=n[o])[0],h=t[l],c=u[1];if(a&&u[2]){if(h===i&&!(l in t))return!1;}else{var f=new Gn();if(r)var d=r(h,c,l,t,e,f);if(!(d===i?zr(c,h,3,r,f):d))return!1;}}return!0;}function Nr(t){return!(!Qs(t)||(e=t,Rt&&Rt in e))&&(Xs(t)?Pt:gt).test(Uo(t));var e;}function Ir(t){return\"function\"==typeof t?t:null==t?nu:\"object\"==_typeof(t)?Hs(t)?jr(t[0],t[1]):Ur(t):cu(t);}function Or(t){if(!wo(t))return gn(t);var e=[];for(var n in At(t))It.call(t,n)&&\"constructor\"!=n&&e.push(n);return e;}function Rr(t,e){return t<e;}function Lr(t,e){var n=-1,i=Zs(t)?r(t.length):[];return hr(t,function(t,r,o){i[++n]=e(t,r,o);}),i;}function Ur(t){var e=ao(t);return 1==e.length&&e[0][2]?ko(e[0][0],e[0][1]):function(n){return n===t||Cr(n,t,e);};}function jr(t,e){return vo(t)&&xo(e)?ko(Lo(t),e):function(n){var r=Ea(n,t);return r===i&&r===e?Sa(n,t):zr(e,r,3);};}function Pr(t,e,n,r,o){t!==e&&_r(e,function(s,a){if(o||(o=new Gn()),Qs(s))!function(t,e,n,r,o,s,a){var u=So(t,n),l=So(e,n),h=a.get(l);if(h)Jn(t,n,h);else{var c=s?s(u,l,n+\"\",t,e,a):i,f=c===i;if(f){var d=Hs(l),p=!d&&Gs(l),g=!d&&!p&&ua(l);c=l,d||p||g?Hs(u)?c=u:Ws(u)?c=Si(u):p?(f=!1,c=bi(l,!0)):g?(f=!1,c=xi(l,!0)):c=[]:ra(l)||$s(l)?(c=u,$s(u)?c=_a(u):Qs(u)&&!Xs(u)||(c=po(l))):f=!1;}f&&(a.set(l,c),o(c,l,r,s,a),a[\"delete\"](l)),Jn(t,n,c);}}(t,e,a,n,Pr,r,o);else{var u=r?r(So(t,a),s,a+\"\",t,e,o):i;u===i&&(u=s),Jn(t,a,u);}},Ca);}function Dr(t,e){var n=t.length;if(n)return _o(e+=e<0?n:0,n)?t[e]:i;}function Fr(t,e,n){e=e.length?Ce(e,function(t){return Hs(t)?function(e){return wr(e,1===t.length?t[0]:t);}:t;}):[nu];var r=-1;e=Ce(e,Ve(oo()));var i=Lr(t,function(t,n,i){var o=Ce(e,function(e){return e(t);});return{criteria:o,index:++r,value:t};});return function(t,e){var r=t.length;for(t.sort(function(t,e){return function(t,e,n){for(var r=-1,i=t.criteria,o=e.criteria,s=i.length,a=n.length;++r<s;){var u=ki(i[r],o[r]);if(u)return r>=a?u:u*(\"desc\"==n[r]?-1:1);}return t.index-e.index;}(t,e,n);});r--;)t[r]=t[r].value;return t;}(i);}function $r(t,e,n){for(var r=-1,i=e.length,o={};++r<i;){var s=e[r],a=wr(t,s);n(a,s)&&Xr(o,_i(s,t),a);}return o;}function Hr(t,e,n,r){var i=r?De:Pe,o=-1,s=e.length,a=t;for(t===e&&(e=Si(e)),n&&(a=Ce(t,Ve(n)));++o<s;)for(var u=0,l=e[o],h=n?n(l):l;(u=i(a,h,u,r))>-1;)a!==t&&Gt.call(a,u,1),Gt.call(t,u,1);return t;}function qr(t,e){for(var n=t?e.length:0,r=n-1;n--;){var i=e[n];if(n==r||i!==o){var o=i;_o(i)?Gt.call(t,i,1):ui(t,i);}}return t;}function Zr(t,e){return t+de(bn()*(e-t+1));}function Wr(t,e){var n=\"\";if(!t||e<1||e>c)return n;do{e%2&&(n+=t),(e=de(e/2))&&(t+=t);}while(e);return n;}function Gr(t,e){return To(Ao(t,e,nu),t+\"\");}function Yr(t){return Vn(Pa(t));}function Vr(t,e){var n=Pa(t);return No(n,or(e,0,n.length));}function Xr(t,e,n,r){if(!Qs(t))return t;for(var o=-1,s=(e=_i(e,t)).length,a=s-1,u=t;null!=u&&++o<s;){var l=Lo(e[o]),h=n;if(\"__proto__\"===l||\"constructor\"===l||\"prototype\"===l)return t;if(o!=a){var c=u[l];(h=r?r(c,l,u):i)===i&&(h=Qs(c)?c:_o(e[o+1])?[]:{});}Qn(u,l,h),u=u[l];}return t;}var Kr=Bn?function(t,e){return Bn.set(t,e),t;}:nu,Jr=te?function(t,e){return te(t,\"toString\",{configurable:!0,enumerable:!1,value:Qa(e),writable:!0});}:nu;function Qr(t){return No(Pa(t));}function ti(t,e,n){var i=-1,o=t.length;e<0&&(e=-e>o?0:o+e),(n=n>o?o:n)<0&&(n+=o),o=e>n?0:n-e>>>0,e>>>=0;for(var s=r(o);++i<o;)s[i]=t[i+e];return s;}function ei(t,e){var n;return hr(t,function(t,r,i){return!(n=e(t,r,i));}),!!n;}function ni(t,e,n){var r=0,i=null==t?r:t.length;if(\"number\"==typeof e&&e==e&&i<=2147483647){for(;r<i;){var o=r+i>>>1,s=t[o];null!==s&&!aa(s)&&(n?s<=e:s<e)?r=o+1:i=o;}return i;}return ri(t,e,nu,n);}function ri(t,e,n,r){var o=0,s=null==t?0:t.length;if(0===s)return 0;for(var a=(e=n(e))!=e,u=null===e,l=aa(e),h=e===i;o<s;){var c=de((o+s)/2),f=n(t[c]),d=f!==i,p=null===f,g=f==f,_=aa(f);if(a)var m=r||g;else m=h?g&&(r||d):u?g&&d&&(r||!p):l?g&&d&&!p&&(r||!_):!p&&!_&&(r?f<=e:f<e);m?o=c+1:s=c;}return mn(s,4294967294);}function ii(t,e){for(var n=-1,r=t.length,i=0,o=[];++n<r;){var s=t[n],a=e?e(s):s;if(!n||!Ps(a,u)){var u=a;o[i++]=0===s?0:s;}}return o;}function oi(t){return\"number\"==typeof t?t:aa(t)?f:+t;}function si(t){if(\"string\"==typeof t)return t;if(Hs(t))return Ce(t,si)+\"\";if(aa(t))return Un?Un.call(t):\"\";var e=t+\"\";return\"0\"==e&&1/t==-1/0?\"-0\":e;}function ai(t,e,n){var r=-1,i=Te,o=t.length,s=!0,a=[],u=a;if(n)s=!1,i=ze;else if(o>=200){var l=e?null:Wi(t);if(l)return un(l);s=!1,i=Ke,u=new Wn();}else u=e?[]:a;t:for(;++r<o;){var h=t[r],c=e?e(h):h;if(h=n||0!==h?h:0,s&&c==c){for(var f=u.length;f--;)if(u[f]===c)continue t;e&&u.push(c),a.push(h);}else i(u,c,n)||(u!==a&&u.push(c),a.push(h));}return a;}function ui(t,e){return null==(t=Eo(t,e=_i(e,t)))||delete t[Lo(Vo(e))];}function li(t,e,n,r){return Xr(t,e,n(wr(t,e)),r);}function hi(t,e,n,r){for(var i=t.length,o=r?i:-1;(r?o--:++o<i)&&e(t[o],o,t););return n?ti(t,r?0:o,r?o+1:i):ti(t,r?o+1:0,r?i:o);}function ci(t,e){var n=t;return n instanceof $n&&(n=n.value()),Ie(e,function(t,e){return e.func.apply(e.thisArg,Ne([t],e.args));},n);}function fi(t,e,n){var i=t.length;if(i<2)return i?ai(t[0]):[];for(var o=-1,s=r(i);++o<i;)for(var a=t[o],u=-1;++u<i;)u!=o&&(s[o]=lr(s[o]||a,t[u],e,n));return ai(gr(s,1),e,n);}function di(t,e,n){for(var r=-1,o=t.length,s=e.length,a={};++r<o;){var u=r<s?e[r]:i;n(a,t[r],u);}return a;}function pi(t){return Ws(t)?t:[];}function gi(t){return\"function\"==typeof t?t:nu;}function _i(t,e){return Hs(t)?t:vo(t,e)?[t]:Ro(ma(t));}var mi=Gr;function vi(t,e,n){var r=t.length;return n=n===i?r:n,!e&&n>=r?t:ti(t,e,n);}var yi=se||function(t){return ce.clearTimeout(t);};function bi(t,e){if(e)return t.slice();var n=t.length,r=Ht?Ht(n):new t.constructor(n);return t.copy(r),r;}function wi(t){var e=new t.constructor(t.byteLength);return new $t(e).set(new $t(t)),e;}function xi(t,e){var n=e?wi(t.buffer):t.buffer;return new t.constructor(n,t.byteOffset,t.length);}function ki(t,e){if(t!==e){var n=t!==i,r=null===t,o=t==t,s=aa(t),a=e!==i,u=null===e,l=e==e,h=aa(e);if(!u&&!h&&!s&&t>e||s&&a&&l&&!u&&!h||r&&a&&l||!n&&l||!o)return 1;if(!r&&!s&&!h&&t<e||h&&n&&o&&!r&&!s||u&&n&&o||!a&&o||!l)return-1;}return 0;}function Ai(t,e,n,i){for(var o=-1,s=t.length,a=n.length,u=-1,l=e.length,h=_n(s-a,0),c=r(l+h),f=!i;++u<l;)c[u]=e[u];for(;++o<a;)(f||o<s)&&(c[n[o]]=t[o]);for(;h--;)c[u++]=t[o++];return c;}function Ei(t,e,n,i){for(var o=-1,s=t.length,a=-1,u=n.length,l=-1,h=e.length,c=_n(s-u,0),f=r(c+h),d=!i;++o<c;)f[o]=t[o];for(var p=o;++l<h;)f[p+l]=e[l];for(;++a<u;)(d||o<s)&&(f[p+n[a]]=t[o++]);return f;}function Si(t,e){var n=-1,i=t.length;for(e||(e=r(i));++n<i;)e[n]=t[n];return e;}function Mi(t,e,n,r){var o=!n;n||(n={});for(var s=-1,a=e.length;++s<a;){var u=e[s],l=r?r(n[u],t[u],u,n,t):i;l===i&&(l=t[u]),o?rr(n,u,l):Qn(n,u,l);}return n;}function Bi(t,e){return function(n,r){var i=Hs(n)?Ae:er,o=e?e():{};return i(n,t,oo(r,2),o);};}function Ti(t){return Gr(function(e,n){var r=-1,o=n.length,s=o>1?n[o-1]:i,a=o>2?n[2]:i;for(s=t.length>3&&\"function\"==typeof s?(o--,s):i,a&&mo(n[0],n[1],a)&&(s=o<3?i:s,o=1),e=At(e);++r<o;){var u=n[r];u&&t(e,u,r,s);}return e;});}function zi(t,e){return function(n,r){if(null==n)return n;if(!Zs(n))return t(n,r);for(var i=n.length,o=e?i:-1,s=At(n);(e?o--:++o<i)&&!1!==r(s[o],o,s););return n;};}function Ci(t){return function(e,n,r){for(var i=-1,o=At(e),s=r(e),a=s.length;a--;){var u=s[t?a:++i];if(!1===n(o[u],u,o))break;}return e;};}function Ni(t){return function(e){var n=rn(e=ma(e))?cn(e):i,r=n?n[0]:e.charAt(0),o=n?vi(n,1).join(\"\"):e.slice(1);return r[t]()+o;};}function Ii(t){return function(e){return Ie(Xa($a(e).replace(Xt,\"\")),t,\"\");};}function Oi(t){return function(){var e=arguments;switch(e.length){case 0:return new t();case 1:return new t(e[0]);case 2:return new t(e[0],e[1]);case 3:return new t(e[0],e[1],e[2]);case 4:return new t(e[0],e[1],e[2],e[3]);case 5:return new t(e[0],e[1],e[2],e[3],e[4]);case 6:return new t(e[0],e[1],e[2],e[3],e[4],e[5]);case 7:return new t(e[0],e[1],e[2],e[3],e[4],e[5],e[6]);}var n=Pn(t.prototype),r=t.apply(n,e);return Qs(r)?r:n;};}function Ri(t){return function(e,n,r){var o=At(e);if(!Zs(e)){var s=oo(n,3);e=za(e),n=function n(t){return s(o[t],t,o);};}var a=t(e,n,r);return a>-1?o[s?e[a]:a]:i;};}function Li(t){return Qi(function(e){var n=e.length,r=n,s=Fn.prototype.thru;for(t&&e.reverse();r--;){var a=e[r];if(\"function\"!=typeof a)throw new Mt(o);if(s&&!u&&\"wrapper\"==ro(a))var u=new Fn([],!0);}for(r=u?r:n;++r<n;){var l=ro(a=e[r]),h=\"wrapper\"==l?no(a):i;u=h&&yo(h[0])&&424==h[1]&&!h[4].length&&1==h[9]?u[ro(h[0])].apply(u,h[3]):1==a.length&&yo(a)?u[l]():u.thru(a);}return function(){var t=arguments,r=t[0];if(u&&1==t.length&&Hs(r))return u.plant(r).value();for(var i=0,o=n?e[i].apply(this,t):r;++i<n;)o=e[i].call(this,o);return o;};});}function Ui(t,e,n,o,s,a,u,h,c,f){var d=e&l,p=1&e,g=2&e,_=24&e,m=512&e,v=g?i:Oi(t);return function l(){for(var y=arguments.length,b=r(y),w=y;w--;)b[w]=arguments[w];if(_)var x=io(l),k=function(t,e){for(var n=t.length,r=0;n--;)t[n]===e&&++r;return r;}(b,x);if(o&&(b=Ai(b,o,s,_)),a&&(b=Ei(b,a,u,_)),y-=k,_&&y<f){var A=an(b,x);return qi(t,e,Ui,l.placeholder,n,b,A,h,c,f-y);}var E=p?n:this,S=g?E[t]:t;return y=b.length,h?b=function(t,e){for(var n=t.length,r=mn(e.length,n),o=Si(t);r--;){var s=e[r];t[r]=_o(s,n)?o[s]:i;}return t;}(b,h):m&&y>1&&b.reverse(),d&&c<y&&(b.length=c),this&&this!==ce&&this instanceof l&&(S=v||Oi(S)),S.apply(E,b);};}function ji(t,e){return function(n,r){return function(t,e,n,r){return vr(t,function(t,i,o){e(r,n(t),i,o);}),r;}(n,t,e(r),{});};}function Pi(t,e){return function(n,r){var o;if(n===i&&r===i)return e;if(n!==i&&(o=n),r!==i){if(o===i)return r;\"string\"==typeof n||\"string\"==typeof r?(n=si(n),r=si(r)):(n=oi(n),r=oi(r)),o=t(n,r);}return o;};}function Di(t){return Qi(function(e){return e=Ce(e,Ve(oo())),Gr(function(n){var r=this;return t(e,function(t){return ke(t,r,n);});});});}function Fi(t,e){var n=(e=e===i?\" \":si(e)).length;if(n<2)return n?Wr(e,t):e;var r=Wr(e,fe(t/hn(e)));return rn(e)?vi(cn(r),0,t).join(\"\"):r.slice(0,t);}function $i(t){return function(e,n,o){return o&&\"number\"!=typeof o&&mo(e,n,o)&&(n=o=i),e=fa(e),n===i?(n=e,e=0):n=fa(n),function(t,e,n,i){for(var o=-1,s=_n(fe((e-t)/(n||1)),0),a=r(s);s--;)a[i?s:++o]=t,t+=n;return a;}(e,n,o=o===i?e<n?1:-1:fa(o),t);};}function Hi(t){return function(e,n){return\"string\"==typeof e&&\"string\"==typeof n||(e=ga(e),n=ga(n)),t(e,n);};}function qi(t,e,n,r,o,s,a,l,h,c){var f=8&e;e|=f?u:64,4&(e&=~(f?64:u))||(e&=-4);var d=[t,e,o,f?s:i,f?a:i,f?i:s,f?i:a,l,h,c],p=n.apply(i,d);return yo(t)&&Mo(p,d),p.placeholder=r,zo(p,t,e);}function Zi(t){var e=kt[t];return function(t,n){if(t=ga(t),(n=null==n?0:mn(da(n),292))&&Le(t)){var r=(ma(t)+\"e\").split(\"e\");return+((r=(ma(e(r[0]+\"e\"+(+r[1]+n)))+\"e\").split(\"e\"))[0]+\"e\"+(+r[1]-n));}return e(t);};}var Wi=En&&1/un(new En([,-0]))[1]==h?function(t){return new En(t);}:au;function Gi(t){return function(e){var n=co(e);return n==x?on(e):n==M?ln(e):function(t,e){return Ce(e,function(e){return[e,t[e]];});}(e,t(e));};}function Yi(t,e,n,s,h,c,f,d){var p=2&e;if(!p&&\"function\"!=typeof t)throw new Mt(o);var g=s?s.length:0;if(g||(e&=-97,s=h=i),f=f===i?f:_n(da(f),0),d=d===i?d:da(d),g-=h?h.length:0,64&e){var _=s,m=h;s=h=i;}var v=p?i:no(t),y=[t,e,n,s,h,_,m,c,f,d];if(v&&function(t,e){var n=t[1],r=e[1],i=n|r,o=i<131,s=r==l&&8==n||r==l&&256==n&&t[7].length<=e[8]||384==r&&e[7].length<=e[8]&&8==n;if(!o&&!s)return t;1&r&&(t[2]=e[2],i|=1&n?0:4);var u=e[3];if(u){var h=t[3];t[3]=h?Ai(h,u,e[4]):u,t[4]=h?an(t[3],a):e[4];}(u=e[5])&&(h=t[5],t[5]=h?Ei(h,u,e[6]):u,t[6]=h?an(t[5],a):e[6]),(u=e[7])&&(t[7]=u),r&l&&(t[8]=null==t[8]?e[8]:mn(t[8],e[8])),null==t[9]&&(t[9]=e[9]),t[0]=e[0],t[1]=i;}(y,v),t=y[0],e=y[1],n=y[2],s=y[3],h=y[4],!(d=y[9]=y[9]===i?p?0:t.length:_n(y[9]-g,0))&&24&e&&(e&=-25),e&&1!=e)b=8==e||16==e?function(t,e,n){var o=Oi(t);return function s(){for(var a=arguments.length,u=r(a),l=a,h=io(s);l--;)u[l]=arguments[l];var c=a<3&&u[0]!==h&&u[a-1]!==h?[]:an(u,h);return(a-=c.length)<n?qi(t,e,Ui,s.placeholder,i,u,c,i,i,n-a):ke(this&&this!==ce&&this instanceof s?o:t,this,u);};}(t,e,d):e!=u&&33!=e||h.length?Ui.apply(i,y):function(t,e,n,i){var o=1&e,s=Oi(t);return function e(){for(var a=-1,u=arguments.length,l=-1,h=i.length,c=r(h+u),f=this&&this!==ce&&this instanceof e?s:t;++l<h;)c[l]=i[l];for(;u--;)c[l++]=arguments[++a];return ke(f,o?n:this,c);};}(t,e,n,s);else var b=function(t,e,n){var r=1&e,i=Oi(t);return function e(){return(this&&this!==ce&&this instanceof e?i:t).apply(r?n:this,arguments);};}(t,e,n);return zo((v?Kr:Mo)(b,y),t,e);}function Vi(t,e,n,r){return t===i||Ps(t,zt[n])&&!It.call(r,n)?e:t;}function Xi(t,e,n,r,o,s){return Qs(t)&&Qs(e)&&(s.set(e,t),Pr(t,e,i,Xi,s),s[\"delete\"](e)),t;}function Ki(t){return ra(t)?i:t;}function Ji(t,e,n,r,o,s){var a=1&n,u=t.length,l=e.length;if(u!=l&&!(a&&l>u))return!1;var h=s.get(t),c=s.get(e);if(h&&c)return h==e&&c==t;var f=-1,d=!0,p=2&n?new Wn():i;for(s.set(t,e),s.set(e,t);++f<u;){var g=t[f],_=e[f];if(r)var m=a?r(_,g,f,e,t,s):r(g,_,f,t,e,s);if(m!==i){if(m)continue;d=!1;break;}if(p){if(!Re(e,function(t,e){if(!Ke(p,e)&&(g===t||o(g,t,n,r,s)))return p.push(e);})){d=!1;break;}}else if(g!==_&&!o(g,_,n,r,s)){d=!1;break;}}return s[\"delete\"](t),s[\"delete\"](e),d;}function Qi(t){return To(Ao(t,i,qo),t+\"\");}function to(t){return xr(t,za,lo);}function eo(t){return xr(t,Ca,ho);}var no=Bn?function(t){return Bn.get(t);}:au;function ro(t){for(var e=t.name+\"\",n=Tn[e],r=It.call(Tn,e)?n.length:0;r--;){var i=n[r],o=i.func;if(null==o||o==t)return i.name;}return e;}function io(t){return(It.call(jn,\"placeholder\")?jn:t).placeholder;}function oo(){var t=jn.iteratee||ru;return t=t===ru?Ir:t,arguments.length?t(arguments[0],arguments[1]):t;}function so(t,e){var n,r,i=t.__data__;return(\"string\"==(r=_typeof(n=e))||\"number\"==r||\"symbol\"==r||\"boolean\"==r?\"__proto__\"!==n:null===n)?i[\"string\"==typeof e?\"string\":\"hash\"]:i.map;}function ao(t){for(var e=za(t),n=e.length;n--;){var r=e[n],i=t[r];e[n]=[r,i,xo(i)];}return e;}function uo(t,e){var n=function(t,e){return null==t?i:t[e];}(t,e);return Nr(n)?n:i;}var lo=ge?function(t){return null==t?[]:(t=At(t),Be(ge(t),function(e){return Wt.call(t,e);}));}:pu,ho=ge?function(t){for(var e=[];t;)Ne(e,lo(t)),t=qt(t);return e;}:pu,co=kr;function fo(t,e,n){for(var r=-1,i=(e=_i(e,t)).length,o=!1;++r<i;){var s=Lo(e[r]);if(!(o=null!=t&&n(t,s)))break;t=t[s];}return o||++r!=i?o:!!(i=null==t?0:t.length)&&Js(i)&&_o(s,i)&&(Hs(t)||$s(t));}function po(t){return\"function\"!=typeof t.constructor||wo(t)?{}:Pn(qt(t));}function go(t){return Hs(t)||$s(t)||!!(Yt&&t&&t[Yt]);}function _o(t,e){var n=_typeof(t);return!!(e=null==e?c:e)&&(\"number\"==n||\"symbol\"!=n&&mt.test(t))&&t>-1&&t%1==0&&t<e;}function mo(t,e,n){if(!Qs(n))return!1;var r=_typeof(e);return!!(\"number\"==r?Zs(n)&&_o(e,n.length):\"string\"==r&&e in n)&&Ps(n[e],t);}function vo(t,e){if(Hs(t))return!1;var n=_typeof(t);return!(\"number\"!=n&&\"symbol\"!=n&&\"boolean\"!=n&&null!=t&&!aa(t))||Q.test(t)||!J.test(t)||null!=e&&t in At(e);}function yo(t){var e=ro(t),n=jn[e];if(\"function\"!=typeof n||!(e in $n.prototype))return!1;if(t===n)return!0;var r=no(n);return!!r&&t===r[0];}(xn&&co(new xn(new ArrayBuffer(1)))!=N||kn&&co(new kn())!=x||An&&co(An.resolve())!=E||En&&co(new En())!=M||Sn&&co(new Sn())!=z)&&(co=function co(t){var e=kr(t),n=e==A?t.constructor:i,r=n?Uo(n):\"\";if(r)switch(r){case zn:return N;case Cn:return x;case Nn:return E;case In:return M;case On:return z;}return e;});var bo=Ct?Xs:gu;function wo(t){var e=t&&t.constructor;return t===(\"function\"==typeof e&&e.prototype||zt);}function xo(t){return t==t&&!Qs(t);}function ko(t,e){return function(n){return null!=n&&n[t]===e&&(e!==i||t in At(n));};}function Ao(t,e,n){return e=_n(e===i?t.length-1:e,0),function(){for(var i=arguments,o=-1,s=_n(i.length-e,0),a=r(s);++o<s;)a[o]=i[e+o];o=-1;for(var u=r(e+1);++o<e;)u[o]=i[o];return u[e]=n(a),ke(t,this,u);};}function Eo(t,e){return e.length<2?t:wr(t,ti(e,0,-1));}function So(t,e){if((\"constructor\"!==e||\"function\"!=typeof t[e])&&\"__proto__\"!=e)return t[e];}var Mo=Co(Kr),Bo=he||function(t,e){return ce.setTimeout(t,e);},To=Co(Jr);function zo(t,e,n){var r=e+\"\";return To(t,function(t,e){var n=e.length;if(!n)return t;var r=n-1;return e[r]=(n>1?\"& \":\"\")+e[r],e=e.join(n>2?\", \":\" \"),t.replace(ot,\"{\\n/* [wrapped with \"+e+\"] */\\n\");}(r,function(t,e){return Ee(p,function(n){var r=\"_.\"+n[0];e&n[1]&&!Te(t,r)&&t.push(r);}),t.sort();}(function(t){var e=t.match(st);return e?e[1].split(at):[];}(r),n)));}function Co(t){var e=0,n=0;return function(){var r=vn(),o=16-(r-n);if(n=r,o>0){if(++e>=800)return arguments[0];}else e=0;return t.apply(i,arguments);};}function No(t,e){var n=-1,r=t.length,o=r-1;for(e=e===i?r:e;++n<e;){var s=Zr(n,o),a=t[s];t[s]=t[n],t[n]=a;}return t.length=e,t;}var Io,Oo,Ro=(Io=Is(function(t){var e=[];return 46===t.charCodeAt(0)&&e.push(\"\"),t.replace(tt,function(t,n,r,i){e.push(r?i.replace(ht,\"$1\"):n||t);}),e;},function(t){return 500===Oo.size&&Oo.clear(),t;}),Oo=Io.cache,Io);function Lo(t){if(\"string\"==typeof t||aa(t))return t;var e=t+\"\";return\"0\"==e&&1/t==-1/0?\"-0\":e;}function Uo(t){if(null!=t){try{return Nt.call(t);}catch(t){}try{return t+\"\";}catch(t){}}return\"\";}function jo(t){if(t instanceof $n)return t.clone();var e=new Fn(t.__wrapped__,t.__chain__);return e.__actions__=Si(t.__actions__),e.__index__=t.__index__,e.__values__=t.__values__,e;}var Po=Gr(function(t,e){return Ws(t)?lr(t,gr(e,1,Ws,!0)):[];}),Do=Gr(function(t,e){var n=Vo(e);return Ws(n)&&(n=i),Ws(t)?lr(t,gr(e,1,Ws,!0),oo(n,2)):[];}),Fo=Gr(function(t,e){var n=Vo(e);return Ws(n)&&(n=i),Ws(t)?lr(t,gr(e,1,Ws,!0),i,n):[];});function $o(t,e,n){var r=null==t?0:t.length;if(!r)return-1;var i=null==n?0:da(n);return i<0&&(i=_n(r+i,0)),je(t,oo(e,3),i);}function Ho(t,e,n){var r=null==t?0:t.length;if(!r)return-1;var o=r-1;return n!==i&&(o=da(n),o=n<0?_n(r+o,0):mn(o,r-1)),je(t,oo(e,3),o,!0);}function qo(t){return null!=t&&t.length?gr(t,1):[];}function Zo(t){return t&&t.length?t[0]:i;}var Wo=Gr(function(t){var e=Ce(t,pi);return e.length&&e[0]===t[0]?Mr(e):[];}),Go=Gr(function(t){var e=Vo(t),n=Ce(t,pi);return e===Vo(n)?e=i:n.pop(),n.length&&n[0]===t[0]?Mr(n,oo(e,2)):[];}),Yo=Gr(function(t){var e=Vo(t),n=Ce(t,pi);return(e=\"function\"==typeof e?e:i)&&n.pop(),n.length&&n[0]===t[0]?Mr(n,i,e):[];});function Vo(t){var e=null==t?0:t.length;return e?t[e-1]:i;}var Xo=Gr(Ko);function Ko(t,e){return t&&t.length&&e&&e.length?Hr(t,e):t;}var Jo=Qi(function(t,e){var n=null==t?0:t.length,r=ir(t,e);return qr(t,Ce(e,function(t){return _o(t,n)?+t:t;}).sort(ki)),r;});function Qo(t){return null==t?t:wn.call(t);}var ts=Gr(function(t){return ai(gr(t,1,Ws,!0));}),es=Gr(function(t){var e=Vo(t);return Ws(e)&&(e=i),ai(gr(t,1,Ws,!0),oo(e,2));}),ns=Gr(function(t){var e=Vo(t);return e=\"function\"==typeof e?e:i,ai(gr(t,1,Ws,!0),i,e);});function rs(t){if(!t||!t.length)return[];var e=0;return t=Be(t,function(t){if(Ws(t))return e=_n(t.length,e),!0;}),Ge(e,function(e){return Ce(t,He(e));});}function is(t,e){if(!t||!t.length)return[];var n=rs(t);return null==e?n:Ce(n,function(t){return ke(e,i,t);});}var os=Gr(function(t,e){return Ws(t)?lr(t,e):[];}),ss=Gr(function(t){return fi(Be(t,Ws));}),as=Gr(function(t){var e=Vo(t);return Ws(e)&&(e=i),fi(Be(t,Ws),oo(e,2));}),us=Gr(function(t){var e=Vo(t);return e=\"function\"==typeof e?e:i,fi(Be(t,Ws),i,e);}),ls=Gr(rs),hs=Gr(function(t){var e=t.length,n=e>1?t[e-1]:i;return n=\"function\"==typeof n?(t.pop(),n):i,is(t,n);});function cs(t){var e=jn(t);return e.__chain__=!0,e;}function fs(t,e){return e(t);}var ds=Qi(function(t){var e=t.length,n=e?t[0]:0,r=this.__wrapped__,o=function o(e){return ir(e,t);};return!(e>1||this.__actions__.length)&&r instanceof $n&&_o(n)?((r=r.slice(n,+n+(e?1:0))).__actions__.push({func:fs,args:[o],thisArg:i}),new Fn(r,this.__chain__).thru(function(t){return e&&!t.length&&t.push(i),t;})):this.thru(o);}),ps=Bi(function(t,e,n){It.call(t,n)?++t[n]:rr(t,n,1);}),gs=Ri($o),_s=Ri(Ho);function ms(t,e){return(Hs(t)?Ee:hr)(t,oo(e,3));}function vs(t,e){return(Hs(t)?Se:cr)(t,oo(e,3));}var ys=Bi(function(t,e,n){It.call(t,n)?t[n].push(e):rr(t,n,[e]);}),bs=Gr(function(t,e,n){var i=-1,o=\"function\"==typeof e,s=Zs(t)?r(t.length):[];return hr(t,function(t){s[++i]=o?ke(e,t,n):Br(t,e,n);}),s;}),ws=Bi(function(t,e,n){rr(t,n,e);});function xs(t,e){return(Hs(t)?Ce:Lr)(t,oo(e,3));}var ks=Bi(function(t,e,n){t[n?0:1].push(e);},function(){return[[],[]];}),As=Gr(function(t,e){if(null==t)return[];var n=e.length;return n>1&&mo(t,e[0],e[1])?e=[]:n>2&&mo(e[0],e[1],e[2])&&(e=[e[0]]),Fr(t,gr(e,1),[]);}),Es=le||function(){return ce.Date.now();};function Ss(t,e,n){return e=n?i:e,e=t&&null==e?t.length:e,Yi(t,l,i,i,i,i,e);}function Ms(t,e){var n;if(\"function\"!=typeof e)throw new Mt(o);return t=da(t),function(){return--t>0&&(n=e.apply(this,arguments)),t<=1&&(e=i),n;};}var Bs=Gr(function(t,e,n){var r=1;if(n.length){var i=an(n,io(Bs));r|=u;}return Yi(t,r,e,n,i);}),Ts=Gr(function(t,e,n){var r=3;if(n.length){var i=an(n,io(Ts));r|=u;}return Yi(e,r,t,n,i);});function zs(t,e,n){var r,s,a,u,l,h,c=0,f=!1,d=!1,p=!0;if(\"function\"!=typeof t)throw new Mt(o);function g(e){var n=r,o=s;return r=s=i,c=e,u=t.apply(o,n);}function _(t){var n=t-h;return h===i||n>=e||n<0||d&&t-c>=a;}function m(){var t=Es();if(_(t))return v(t);l=Bo(m,function(t){var n=e-(t-h);return d?mn(n,a-(t-c)):n;}(t));}function v(t){return l=i,p&&r?g(t):(r=s=i,u);}function y(){var t=Es(),n=_(t);if(r=arguments,s=this,h=t,n){if(l===i)return function(t){return c=t,l=Bo(m,e),f?g(t):u;}(h);if(d)return yi(l),l=Bo(m,e),g(h);}return l===i&&(l=Bo(m,e)),u;}return e=ga(e)||0,Qs(n)&&(f=!!n.leading,a=(d=\"maxWait\"in n)?_n(ga(n.maxWait)||0,e):a,p=\"trailing\"in n?!!n.trailing:p),y.cancel=function(){l!==i&&yi(l),c=0,r=h=s=l=i;},y.flush=function(){return l===i?u:v(Es());},y;}var Cs=Gr(function(t,e){return ur(t,1,e);}),Ns=Gr(function(t,e,n){return ur(t,ga(e)||0,n);});function Is(t,e){if(\"function\"!=typeof t||null!=e&&\"function\"!=typeof e)throw new Mt(o);var n=function n(){var r=arguments,i=e?e.apply(this,r):r[0],o=n.cache;if(o.has(i))return o.get(i);var s=t.apply(this,r);return n.cache=o.set(i,s)||o,s;};return n.cache=new(Is.Cache||Zn)(),n;}function Os(t){if(\"function\"!=typeof t)throw new Mt(o);return function(){var e=arguments;switch(e.length){case 0:return!t.call(this);case 1:return!t.call(this,e[0]);case 2:return!t.call(this,e[0],e[1]);case 3:return!t.call(this,e[0],e[1],e[2]);}return!t.apply(this,e);};}Is.Cache=Zn;var Rs=mi(function(t,e){var n=(e=1==e.length&&Hs(e[0])?Ce(e[0],Ve(oo())):Ce(gr(e,1),Ve(oo()))).length;return Gr(function(r){for(var i=-1,o=mn(r.length,n);++i<o;)r[i]=e[i].call(this,r[i]);return ke(t,this,r);});}),Ls=Gr(function(t,e){var n=an(e,io(Ls));return Yi(t,u,i,e,n);}),Us=Gr(function(t,e){var n=an(e,io(Us));return Yi(t,64,i,e,n);}),js=Qi(function(t,e){return Yi(t,256,i,i,i,e);});function Ps(t,e){return t===e||t!=t&&e!=e;}var Ds=Hi(Ar),Fs=Hi(function(t,e){return t>=e;}),$s=Tr(function(){return arguments;}())?Tr:function(t){return ta(t)&&It.call(t,\"callee\")&&!Wt.call(t,\"callee\");},Hs=r.isArray,qs=me?Ve(me):function(t){return ta(t)&&kr(t)==C;};function Zs(t){return null!=t&&Js(t.length)&&!Xs(t);}function Ws(t){return ta(t)&&Zs(t);}var Gs=_e||gu,Ys=ve?Ve(ve):function(t){return ta(t)&&kr(t)==v;};function Vs(t){if(!ta(t))return!1;var e=kr(t);return e==y||\"[object DOMException]\"==e||\"string\"==typeof t.message&&\"string\"==typeof t.name&&!ra(t);}function Xs(t){if(!Qs(t))return!1;var e=kr(t);return e==b||e==w||\"[object AsyncFunction]\"==e||\"[object Proxy]\"==e;}function Ks(t){return\"number\"==typeof t&&t==da(t);}function Js(t){return\"number\"==typeof t&&t>-1&&t%1==0&&t<=c;}function Qs(t){var e=_typeof(t);return null!=t&&(\"object\"==e||\"function\"==e);}function ta(t){return null!=t&&\"object\"==_typeof(t);}var ea=ye?Ve(ye):function(t){return ta(t)&&co(t)==x;};function na(t){return\"number\"==typeof t||ta(t)&&kr(t)==k;}function ra(t){if(!ta(t)||kr(t)!=A)return!1;var e=qt(t);if(null===e)return!0;var n=It.call(e,\"constructor\")&&e.constructor;return\"function\"==typeof n&&n instanceof n&&Nt.call(n)==Ut;}var ia=be?Ve(be):function(t){return ta(t)&&kr(t)==S;},oa=we?Ve(we):function(t){return ta(t)&&co(t)==M;};function sa(t){return\"string\"==typeof t||!Hs(t)&&ta(t)&&kr(t)==B;}function aa(t){return\"symbol\"==_typeof(t)||ta(t)&&kr(t)==T;}var ua=xe?Ve(xe):function(t){return ta(t)&&Js(t.length)&&!!ie[kr(t)];},la=Hi(Rr),ha=Hi(function(t,e){return t<=e;});function ca(t){if(!t)return[];if(Zs(t))return sa(t)?cn(t):Si(t);if(Vt&&t[Vt])return function(t){for(var e,n=[];!(e=t.next()).done;)n.push(e.value);return n;}(t[Vt]());var e=co(t);return(e==x?on:e==M?un:Pa)(t);}function fa(t){return t?(t=ga(t))===h||t===-1/0?17976931348623157e292*(t<0?-1:1):t==t?t:0:0===t?t:0;}function da(t){var e=fa(t),n=e%1;return e==e?n?e-n:e:0;}function pa(t){return t?or(da(t),0,d):0;}function ga(t){if(\"number\"==typeof t)return t;if(aa(t))return f;if(Qs(t)){var e=\"function\"==typeof t.valueOf?t.valueOf():t;t=Qs(e)?e+\"\":e;}if(\"string\"!=typeof t)return 0===t?t:+t;t=Ye(t);var n=pt.test(t);return n||_t.test(t)?ue(t.slice(2),n?2:8):dt.test(t)?f:+t;}function _a(t){return Mi(t,Ca(t));}function ma(t){return null==t?\"\":si(t);}var va=Ti(function(t,e){if(wo(e)||Zs(e))Mi(e,za(e),t);else for(var n in e)It.call(e,n)&&Qn(t,n,e[n]);}),ya=Ti(function(t,e){Mi(e,Ca(e),t);}),ba=Ti(function(t,e,n,r){Mi(e,Ca(e),t,r);}),wa=Ti(function(t,e,n,r){Mi(e,za(e),t,r);}),xa=Qi(ir),ka=Gr(function(t,e){t=At(t);var n=-1,r=e.length,o=r>2?e[2]:i;for(o&&mo(e[0],e[1],o)&&(r=1);++n<r;)for(var s=e[n],a=Ca(s),u=-1,l=a.length;++u<l;){var h=a[u],c=t[h];(c===i||Ps(c,zt[h])&&!It.call(t,h))&&(t[h]=s[h]);}return t;}),Aa=Gr(function(t){return t.push(i,Xi),ke(Ia,i,t);});function Ea(t,e,n){var r=null==t?i:wr(t,e);return r===i?n:r;}function Sa(t,e){return null!=t&&fo(t,e,Sr);}var Ma=ji(function(t,e,n){null!=e&&\"function\"!=typeof e.toString&&(e=Lt.call(e)),t[e]=n;},Qa(nu)),Ba=ji(function(t,e,n){null!=e&&\"function\"!=typeof e.toString&&(e=Lt.call(e)),It.call(t,e)?t[e].push(n):t[e]=[n];},oo),Ta=Gr(Br);function za(t){return Zs(t)?Yn(t):Or(t);}function Ca(t){return Zs(t)?Yn(t,!0):function(t){if(!Qs(t))return function(t){var e=[];if(null!=t)for(var n in At(t))e.push(n);return e;}(t);var e=wo(t),n=[];for(var r in t)(\"constructor\"!=r||!e&&It.call(t,r))&&n.push(r);return n;}(t);}var Na=Ti(function(t,e,n){Pr(t,e,n);}),Ia=Ti(function(t,e,n,r){Pr(t,e,n,r);}),Oa=Qi(function(t,e){var n={};if(null==t)return n;var r=!1;e=Ce(e,function(e){return e=_i(e,t),r||(r=e.length>1),e;}),Mi(t,eo(t),n),r&&(n=sr(n,7,Ki));for(var i=e.length;i--;)ui(n,e[i]);return n;}),Ra=Qi(function(t,e){return null==t?{}:function(t,e){return $r(t,e,function(e,n){return Sa(t,n);});}(t,e);});function La(t,e){if(null==t)return{};var n=Ce(eo(t),function(t){return[t];});return e=oo(e),$r(t,n,function(t,n){return e(t,n[0]);});}var Ua=Gi(za),ja=Gi(Ca);function Pa(t){return null==t?[]:Xe(t,za(t));}var Da=Ii(function(t,e,n){return e=e.toLowerCase(),t+(n?Fa(e):e);});function Fa(t){return Va(ma(t).toLowerCase());}function $a(t){return(t=ma(t))&&t.replace(vt,tn).replace(Kt,\"\");}var Ha=Ii(function(t,e,n){return t+(n?\"-\":\"\")+e.toLowerCase();}),qa=Ii(function(t,e,n){return t+(n?\" \":\"\")+e.toLowerCase();}),Za=Ni(\"toLowerCase\"),Wa=Ii(function(t,e,n){return t+(n?\"_\":\"\")+e.toLowerCase();}),Ga=Ii(function(t,e,n){return t+(n?\" \":\"\")+Va(e);}),Ya=Ii(function(t,e,n){return t+(n?\" \":\"\")+e.toUpperCase();}),Va=Ni(\"toUpperCase\");function Xa(t,e,n){return t=ma(t),(e=n?i:e)===i?function(t){return ee.test(t);}(t)?function(t){return t.match(Qt)||[];}(t):function(t){return t.match(ut)||[];}(t):t.match(e)||[];}var Ka=Gr(function(t,e){try{return ke(t,i,e);}catch(t){return Vs(t)?t:new wt(t);}}),Ja=Qi(function(t,e){return Ee(e,function(e){e=Lo(e),rr(t,e,Bs(t[e],t));}),t;});function Qa(t){return function(){return t;};}var tu=Li(),eu=Li(!0);function nu(t){return t;}function ru(t){return Ir(\"function\"==typeof t?t:sr(t,1));}var iu=Gr(function(t,e){return function(n){return Br(n,t,e);};}),ou=Gr(function(t,e){return function(n){return Br(t,n,e);};});function su(t,e,n){var r=za(e),i=br(e,r);null!=n||Qs(e)&&(i.length||!r.length)||(n=e,e=t,t=this,i=br(e,za(e)));var o=!(Qs(n)&&\"chain\"in n&&!n.chain),s=Xs(t);return Ee(i,function(n){var r=e[n];t[n]=r,s&&(t.prototype[n]=function(){var e=this.__chain__;if(o||e){var n=t(this.__wrapped__);return(n.__actions__=Si(this.__actions__)).push({func:r,args:arguments,thisArg:t}),n.__chain__=e,n;}return r.apply(t,Ne([this.value()],arguments));});}),t;}function au(){}var uu=Di(Ce),lu=Di(Me),hu=Di(Re);function cu(t){return vo(t)?He(Lo(t)):function(t){return function(e){return wr(e,t);};}(t);}var fu=$i(),du=$i(!0);function pu(){return[];}function gu(){return!1;}var _u,mu=Pi(function(t,e){return t+e;},0),vu=Zi(\"ceil\"),yu=Pi(function(t,e){return t/e;},1),bu=Zi(\"floor\"),wu=Pi(function(t,e){return t*e;},1),xu=Zi(\"round\"),ku=Pi(function(t,e){return t-e;},0);return jn.after=function(t,e){if(\"function\"!=typeof e)throw new Mt(o);return t=da(t),function(){if(--t<1)return e.apply(this,arguments);};},jn.ary=Ss,jn.assign=va,jn.assignIn=ya,jn.assignInWith=ba,jn.assignWith=wa,jn.at=xa,jn.before=Ms,jn.bind=Bs,jn.bindAll=Ja,jn.bindKey=Ts,jn.castArray=function(){if(!arguments.length)return[];var t=arguments[0];return Hs(t)?t:[t];},jn.chain=cs,jn.chunk=function(t,e,n){e=(n?mo(t,e,n):e===i)?1:_n(da(e),0);var o=null==t?0:t.length;if(!o||e<1)return[];for(var s=0,a=0,u=r(fe(o/e));s<o;)u[a++]=ti(t,s,s+=e);return u;},jn.compact=function(t){for(var e=-1,n=null==t?0:t.length,r=0,i=[];++e<n;){var o=t[e];o&&(i[r++]=o);}return i;},jn.concat=function(){var t=arguments.length;if(!t)return[];for(var e=r(t-1),n=arguments[0],i=t;i--;)e[i-1]=arguments[i];return Ne(Hs(n)?Si(n):[n],gr(e,1));},jn.cond=function(t){var e=null==t?0:t.length,n=oo();return t=e?Ce(t,function(t){if(\"function\"!=typeof t[1])throw new Mt(o);return[n(t[0]),t[1]];}):[],Gr(function(n){for(var r=-1;++r<e;){var i=t[r];if(ke(i[0],this,n))return ke(i[1],this,n);}});},jn.conforms=function(t){return function(t){var e=za(t);return function(n){return ar(n,t,e);};}(sr(t,1));},jn.constant=Qa,jn.countBy=ps,jn.create=function(t,e){var n=Pn(t);return null==e?n:nr(n,e);},jn.curry=function t(e,n,r){var o=Yi(e,8,i,i,i,i,i,n=r?i:n);return o.placeholder=t.placeholder,o;},jn.curryRight=function t(e,n,r){var o=Yi(e,16,i,i,i,i,i,n=r?i:n);return o.placeholder=t.placeholder,o;},jn.debounce=zs,jn.defaults=ka,jn.defaultsDeep=Aa,jn.defer=Cs,jn.delay=Ns,jn.difference=Po,jn.differenceBy=Do,jn.differenceWith=Fo,jn.drop=function(t,e,n){var r=null==t?0:t.length;return r?ti(t,(e=n||e===i?1:da(e))<0?0:e,r):[];},jn.dropRight=function(t,e,n){var r=null==t?0:t.length;return r?ti(t,0,(e=r-(e=n||e===i?1:da(e)))<0?0:e):[];},jn.dropRightWhile=function(t,e){return t&&t.length?hi(t,oo(e,3),!0,!0):[];},jn.dropWhile=function(t,e){return t&&t.length?hi(t,oo(e,3),!0):[];},jn.fill=function(t,e,n,r){var o=null==t?0:t.length;return o?(n&&\"number\"!=typeof n&&mo(t,e,n)&&(n=0,r=o),function(t,e,n,r){var o=t.length;for((n=da(n))<0&&(n=-n>o?0:o+n),(r=r===i||r>o?o:da(r))<0&&(r+=o),r=n>r?0:pa(r);n<r;)t[n++]=e;return t;}(t,e,n,r)):[];},jn.filter=function(t,e){return(Hs(t)?Be:pr)(t,oo(e,3));},jn.flatMap=function(t,e){return gr(xs(t,e),1);},jn.flatMapDeep=function(t,e){return gr(xs(t,e),h);},jn.flatMapDepth=function(t,e,n){return n=n===i?1:da(n),gr(xs(t,e),n);},jn.flatten=qo,jn.flattenDeep=function(t){return null!=t&&t.length?gr(t,h):[];},jn.flattenDepth=function(t,e){return null!=t&&t.length?gr(t,e=e===i?1:da(e)):[];},jn.flip=function(t){return Yi(t,512);},jn.flow=tu,jn.flowRight=eu,jn.fromPairs=function(t){for(var e=-1,n=null==t?0:t.length,r={};++e<n;){var i=t[e];r[i[0]]=i[1];}return r;},jn.functions=function(t){return null==t?[]:br(t,za(t));},jn.functionsIn=function(t){return null==t?[]:br(t,Ca(t));},jn.groupBy=ys,jn.initial=function(t){return null!=t&&t.length?ti(t,0,-1):[];},jn.intersection=Wo,jn.intersectionBy=Go,jn.intersectionWith=Yo,jn.invert=Ma,jn.invertBy=Ba,jn.invokeMap=bs,jn.iteratee=ru,jn.keyBy=ws,jn.keys=za,jn.keysIn=Ca,jn.map=xs,jn.mapKeys=function(t,e){var n={};return e=oo(e,3),vr(t,function(t,r,i){rr(n,e(t,r,i),t);}),n;},jn.mapValues=function(t,e){var n={};return e=oo(e,3),vr(t,function(t,r,i){rr(n,r,e(t,r,i));}),n;},jn.matches=function(t){return Ur(sr(t,1));},jn.matchesProperty=function(t,e){return jr(t,sr(e,1));},jn.memoize=Is,jn.merge=Na,jn.mergeWith=Ia,jn.method=iu,jn.methodOf=ou,jn.mixin=su,jn.negate=Os,jn.nthArg=function(t){return t=da(t),Gr(function(e){return Dr(e,t);});},jn.omit=Oa,jn.omitBy=function(t,e){return La(t,Os(oo(e)));},jn.once=function(t){return Ms(2,t);},jn.orderBy=function(t,e,n,r){return null==t?[]:(Hs(e)||(e=null==e?[]:[e]),Hs(n=r?i:n)||(n=null==n?[]:[n]),Fr(t,e,n));},jn.over=uu,jn.overArgs=Rs,jn.overEvery=lu,jn.overSome=hu,jn.partial=Ls,jn.partialRight=Us,jn.partition=ks,jn.pick=Ra,jn.pickBy=La,jn.property=cu,jn.propertyOf=function(t){return function(e){return null==t?i:wr(t,e);};},jn.pull=Xo,jn.pullAll=Ko,jn.pullAllBy=function(t,e,n){return t&&t.length&&e&&e.length?Hr(t,e,oo(n,2)):t;},jn.pullAllWith=function(t,e,n){return t&&t.length&&e&&e.length?Hr(t,e,i,n):t;},jn.pullAt=Jo,jn.range=fu,jn.rangeRight=du,jn.rearg=js,jn.reject=function(t,e){return(Hs(t)?Be:pr)(t,Os(oo(e,3)));},jn.remove=function(t,e){var n=[];if(!t||!t.length)return n;var r=-1,i=[],o=t.length;for(e=oo(e,3);++r<o;){var s=t[r];e(s,r,t)&&(n.push(s),i.push(r));}return qr(t,i),n;},jn.rest=function(t,e){if(\"function\"!=typeof t)throw new Mt(o);return Gr(t,e=e===i?e:da(e));},jn.reverse=Qo,jn.sampleSize=function(t,e,n){return e=(n?mo(t,e,n):e===i)?1:da(e),(Hs(t)?Xn:Vr)(t,e);},jn.set=function(t,e,n){return null==t?t:Xr(t,e,n);},jn.setWith=function(t,e,n,r){return r=\"function\"==typeof r?r:i,null==t?t:Xr(t,e,n,r);},jn.shuffle=function(t){return(Hs(t)?Kn:Qr)(t);},jn.slice=function(t,e,n){var r=null==t?0:t.length;return r?(n&&\"number\"!=typeof n&&mo(t,e,n)?(e=0,n=r):(e=null==e?0:da(e),n=n===i?r:da(n)),ti(t,e,n)):[];},jn.sortBy=As,jn.sortedUniq=function(t){return t&&t.length?ii(t):[];},jn.sortedUniqBy=function(t,e){return t&&t.length?ii(t,oo(e,2)):[];},jn.split=function(t,e,n){return n&&\"number\"!=typeof n&&mo(t,e,n)&&(e=n=i),(n=n===i?d:n>>>0)?(t=ma(t))&&(\"string\"==typeof e||null!=e&&!ia(e))&&!(e=si(e))&&rn(t)?vi(cn(t),0,n):t.split(e,n):[];},jn.spread=function(t,e){if(\"function\"!=typeof t)throw new Mt(o);return e=null==e?0:_n(da(e),0),Gr(function(n){var r=n[e],i=vi(n,0,e);return r&&Ne(i,r),ke(t,this,i);});},jn.tail=function(t){var e=null==t?0:t.length;return e?ti(t,1,e):[];},jn.take=function(t,e,n){return t&&t.length?ti(t,0,(e=n||e===i?1:da(e))<0?0:e):[];},jn.takeRight=function(t,e,n){var r=null==t?0:t.length;return r?ti(t,(e=r-(e=n||e===i?1:da(e)))<0?0:e,r):[];},jn.takeRightWhile=function(t,e){return t&&t.length?hi(t,oo(e,3),!1,!0):[];},jn.takeWhile=function(t,e){return t&&t.length?hi(t,oo(e,3)):[];},jn.tap=function(t,e){return e(t),t;},jn.throttle=function(t,e,n){var r=!0,i=!0;if(\"function\"!=typeof t)throw new Mt(o);return Qs(n)&&(r=\"leading\"in n?!!n.leading:r,i=\"trailing\"in n?!!n.trailing:i),zs(t,e,{leading:r,maxWait:e,trailing:i});},jn.thru=fs,jn.toArray=ca,jn.toPairs=Ua,jn.toPairsIn=ja,jn.toPath=function(t){return Hs(t)?Ce(t,Lo):aa(t)?[t]:Si(Ro(ma(t)));},jn.toPlainObject=_a,jn.transform=function(t,e,n){var r=Hs(t),i=r||Gs(t)||ua(t);if(e=oo(e,4),null==n){var o=t&&t.constructor;n=i?r?new o():[]:Qs(t)&&Xs(o)?Pn(qt(t)):{};}return(i?Ee:vr)(t,function(t,r,i){return e(n,t,r,i);}),n;},jn.unary=function(t){return Ss(t,1);},jn.union=ts,jn.unionBy=es,jn.unionWith=ns,jn.uniq=function(t){return t&&t.length?ai(t):[];},jn.uniqBy=function(t,e){return t&&t.length?ai(t,oo(e,2)):[];},jn.uniqWith=function(t,e){return e=\"function\"==typeof e?e:i,t&&t.length?ai(t,i,e):[];},jn.unset=function(t,e){return null==t||ui(t,e);},jn.unzip=rs,jn.unzipWith=is,jn.update=function(t,e,n){return null==t?t:li(t,e,gi(n));},jn.updateWith=function(t,e,n,r){return r=\"function\"==typeof r?r:i,null==t?t:li(t,e,gi(n),r);},jn.values=Pa,jn.valuesIn=function(t){return null==t?[]:Xe(t,Ca(t));},jn.without=os,jn.words=Xa,jn.wrap=function(t,e){return Ls(gi(e),t);},jn.xor=ss,jn.xorBy=as,jn.xorWith=us,jn.zip=ls,jn.zipObject=function(t,e){return di(t||[],e||[],Qn);},jn.zipObjectDeep=function(t,e){return di(t||[],e||[],Xr);},jn.zipWith=hs,jn.entries=Ua,jn.entriesIn=ja,jn.extend=ya,jn.extendWith=ba,su(jn,jn),jn.add=mu,jn.attempt=Ka,jn.camelCase=Da,jn.capitalize=Fa,jn.ceil=vu,jn.clamp=function(t,e,n){return n===i&&(n=e,e=i),n!==i&&(n=(n=ga(n))==n?n:0),e!==i&&(e=(e=ga(e))==e?e:0),or(ga(t),e,n);},jn.clone=function(t){return sr(t,4);},jn.cloneDeep=function(t){return sr(t,5);},jn.cloneDeepWith=function(t,e){return sr(t,5,e=\"function\"==typeof e?e:i);},jn.cloneWith=function(t,e){return sr(t,4,e=\"function\"==typeof e?e:i);},jn.conformsTo=function(t,e){return null==e||ar(t,e,za(e));},jn.deburr=$a,jn.defaultTo=function(t,e){return null==t||t!=t?e:t;},jn.divide=yu,jn.endsWith=function(t,e,n){t=ma(t),e=si(e);var r=t.length,o=n=n===i?r:or(da(n),0,r);return(n-=e.length)>=0&&t.slice(n,o)==e;},jn.eq=Ps,jn.escape=function(t){return(t=ma(t))&&Y.test(t)?t.replace(W,en):t;},jn.escapeRegExp=function(t){return(t=ma(t))&&nt.test(t)?t.replace(et,\"\\\\$&\"):t;},jn.every=function(t,e,n){var r=Hs(t)?Me:fr;return n&&mo(t,e,n)&&(e=i),r(t,oo(e,3));},jn.find=gs,jn.findIndex=$o,jn.findKey=function(t,e){return Ue(t,oo(e,3),vr);},jn.findLast=_s,jn.findLastIndex=Ho,jn.findLastKey=function(t,e){return Ue(t,oo(e,3),yr);},jn.floor=bu,jn.forEach=ms,jn.forEachRight=vs,jn.forIn=function(t,e){return null==t?t:_r(t,oo(e,3),Ca);},jn.forInRight=function(t,e){return null==t?t:mr(t,oo(e,3),Ca);},jn.forOwn=function(t,e){return t&&vr(t,oo(e,3));},jn.forOwnRight=function(t,e){return t&&yr(t,oo(e,3));},jn.get=Ea,jn.gt=Ds,jn.gte=Fs,jn.has=function(t,e){return null!=t&&fo(t,e,Er);},jn.hasIn=Sa,jn.head=Zo,jn.identity=nu,jn.includes=function(t,e,n,r){t=Zs(t)?t:Pa(t),n=n&&!r?da(n):0;var i=t.length;return n<0&&(n=_n(i+n,0)),sa(t)?n<=i&&t.indexOf(e,n)>-1:!!i&&Pe(t,e,n)>-1;},jn.indexOf=function(t,e,n){var r=null==t?0:t.length;if(!r)return-1;var i=null==n?0:da(n);return i<0&&(i=_n(r+i,0)),Pe(t,e,i);},jn.inRange=function(t,e,n){return e=fa(e),n===i?(n=e,e=0):n=fa(n),function(t,e,n){return t>=mn(e,n)&&t<_n(e,n);}(t=ga(t),e,n);},jn.invoke=Ta,jn.isArguments=$s,jn.isArray=Hs,jn.isArrayBuffer=qs,jn.isArrayLike=Zs,jn.isArrayLikeObject=Ws,jn.isBoolean=function(t){return!0===t||!1===t||ta(t)&&kr(t)==m;},jn.isBuffer=Gs,jn.isDate=Ys,jn.isElement=function(t){return ta(t)&&1===t.nodeType&&!ra(t);},jn.isEmpty=function(t){if(null==t)return!0;if(Zs(t)&&(Hs(t)||\"string\"==typeof t||\"function\"==typeof t.splice||Gs(t)||ua(t)||$s(t)))return!t.length;var e=co(t);if(e==x||e==M)return!t.size;if(wo(t))return!Or(t).length;for(var n in t)if(It.call(t,n))return!1;return!0;},jn.isEqual=function(t,e){return zr(t,e);},jn.isEqualWith=function(t,e,n){var r=(n=\"function\"==typeof n?n:i)?n(t,e):i;return r===i?zr(t,e,i,n):!!r;},jn.isError=Vs,jn.isFinite=function(t){return\"number\"==typeof t&&Le(t);},jn.isFunction=Xs,jn.isInteger=Ks,jn.isLength=Js,jn.isMap=ea,jn.isMatch=function(t,e){return t===e||Cr(t,e,ao(e));},jn.isMatchWith=function(t,e,n){return n=\"function\"==typeof n?n:i,Cr(t,e,ao(e),n);},jn.isNaN=function(t){return na(t)&&t!=+t;},jn.isNative=function(t){if(bo(t))throw new wt(\"Unsupported core-js use. Try https://npms.io/search?q=ponyfill.\");return Nr(t);},jn.isNil=function(t){return null==t;},jn.isNull=function(t){return null===t;},jn.isNumber=na,jn.isObject=Qs,jn.isObjectLike=ta,jn.isPlainObject=ra,jn.isRegExp=ia,jn.isSafeInteger=function(t){return Ks(t)&&t>=-9007199254740991&&t<=c;},jn.isSet=oa,jn.isString=sa,jn.isSymbol=aa,jn.isTypedArray=ua,jn.isUndefined=function(t){return t===i;},jn.isWeakMap=function(t){return ta(t)&&co(t)==z;},jn.isWeakSet=function(t){return ta(t)&&\"[object WeakSet]\"==kr(t);},jn.join=function(t,e){return null==t?\"\":qe.call(t,e);},jn.kebabCase=Ha,jn.last=Vo,jn.lastIndexOf=function(t,e,n){var r=null==t?0:t.length;if(!r)return-1;var o=r;return n!==i&&(o=(o=da(n))<0?_n(r+o,0):mn(o,r-1)),e==e?function(t,e,n){for(var r=n+1;r--;)if(t[r]===e)return r;return r;}(t,e,o):je(t,Fe,o,!0);},jn.lowerCase=qa,jn.lowerFirst=Za,jn.lt=la,jn.lte=ha,jn.max=function(t){return t&&t.length?dr(t,nu,Ar):i;},jn.maxBy=function(t,e){return t&&t.length?dr(t,oo(e,2),Ar):i;},jn.mean=function(t){return $e(t,nu);},jn.meanBy=function(t,e){return $e(t,oo(e,2));},jn.min=function(t){return t&&t.length?dr(t,nu,Rr):i;},jn.minBy=function(t,e){return t&&t.length?dr(t,oo(e,2),Rr):i;},jn.stubArray=pu,jn.stubFalse=gu,jn.stubObject=function(){return{};},jn.stubString=function(){return\"\";},jn.stubTrue=function(){return!0;},jn.multiply=wu,jn.nth=function(t,e){return t&&t.length?Dr(t,da(e)):i;},jn.noConflict=function(){return ce._===this&&(ce._=jt),this;},jn.noop=au,jn.now=Es,jn.pad=function(t,e,n){t=ma(t);var r=(e=da(e))?hn(t):0;if(!e||r>=e)return t;var i=(e-r)/2;return Fi(de(i),n)+t+Fi(fe(i),n);},jn.padEnd=function(t,e,n){t=ma(t);var r=(e=da(e))?hn(t):0;return e&&r<e?t+Fi(e-r,n):t;},jn.padStart=function(t,e,n){t=ma(t);var r=(e=da(e))?hn(t):0;return e&&r<e?Fi(e-r,n)+t:t;},jn.parseInt=function(t,e,n){return n||null==e?e=0:e&&(e=+e),yn(ma(t).replace(rt,\"\"),e||0);},jn.random=function(t,e,n){if(n&&\"boolean\"!=typeof n&&mo(t,e,n)&&(e=n=i),n===i&&(\"boolean\"==typeof e?(n=e,e=i):\"boolean\"==typeof t&&(n=t,t=i)),t===i&&e===i?(t=0,e=1):(t=fa(t),e===i?(e=t,t=0):e=fa(e)),t>e){var r=t;t=e,e=r;}if(n||t%1||e%1){var o=bn();return mn(t+o*(e-t+ae(\"1e-\"+((o+\"\").length-1))),e);}return Zr(t,e);},jn.reduce=function(t,e,n){var r=Hs(t)?Ie:Ze,i=arguments.length<3;return r(t,oo(e,4),n,i,hr);},jn.reduceRight=function(t,e,n){var r=Hs(t)?Oe:Ze,i=arguments.length<3;return r(t,oo(e,4),n,i,cr);},jn.repeat=function(t,e,n){return e=(n?mo(t,e,n):e===i)?1:da(e),Wr(ma(t),e);},jn.replace=function(){var t=arguments,e=ma(t[0]);return t.length<3?e:e.replace(t[1],t[2]);},jn.result=function(t,e,n){var r=-1,o=(e=_i(e,t)).length;for(o||(o=1,t=i);++r<o;){var s=null==t?i:t[Lo(e[r])];s===i&&(r=o,s=n),t=Xs(s)?s.call(t):s;}return t;},jn.round=xu,jn.runInContext=t,jn.sample=function(t){return(Hs(t)?Vn:Yr)(t);},jn.size=function(t){if(null==t)return 0;if(Zs(t))return sa(t)?hn(t):t.length;var e=co(t);return e==x||e==M?t.size:Or(t).length;},jn.snakeCase=Wa,jn.some=function(t,e,n){var r=Hs(t)?Re:ei;return n&&mo(t,e,n)&&(e=i),r(t,oo(e,3));},jn.sortedIndex=function(t,e){return ni(t,e);},jn.sortedIndexBy=function(t,e,n){return ri(t,e,oo(n,2));},jn.sortedIndexOf=function(t,e){var n=null==t?0:t.length;if(n){var r=ni(t,e);if(r<n&&Ps(t[r],e))return r;}return-1;},jn.sortedLastIndex=function(t,e){return ni(t,e,!0);},jn.sortedLastIndexBy=function(t,e,n){return ri(t,e,oo(n,2),!0);},jn.sortedLastIndexOf=function(t,e){if(null!=t&&t.length){var n=ni(t,e,!0)-1;if(Ps(t[n],e))return n;}return-1;},jn.startCase=Ga,jn.startsWith=function(t,e,n){return t=ma(t),n=null==n?0:or(da(n),0,t.length),e=si(e),t.slice(n,n+e.length)==e;},jn.subtract=ku,jn.sum=function(t){return t&&t.length?We(t,nu):0;},jn.sumBy=function(t,e){return t&&t.length?We(t,oo(e,2)):0;},jn.template=function(t,e,n){var r=jn.templateSettings;n&&mo(t,e,n)&&(e=i),t=ma(t),e=ba({},e,r,Vi);var o,s,a=ba({},e.imports,r.imports,Vi),u=za(a),l=Xe(a,u),h=0,c=e.interpolate||yt,f=\"__p += '\",d=Et((e.escape||yt).source+\"|\"+c.source+\"|\"+(c===K?ct:yt).source+\"|\"+(e.evaluate||yt).source+\"|$\",\"g\"),p=\"//# sourceURL=\"+(It.call(e,\"sourceURL\")?(e.sourceURL+\"\").replace(/\\s/g,\" \"):\"lodash.templateSources[\"+ ++re+\"]\")+\"\\n\";t.replace(d,function(e,n,r,i,a,u){return r||(r=i),f+=t.slice(h,u).replace(bt,nn),n&&(o=!0,f+=\"' +\\n__e(\"+n+\") +\\n'\"),a&&(s=!0,f+=\"';\\n\"+a+\";\\n__p += '\"),r&&(f+=\"' +\\n((__t = (\"+r+\")) == null ? '' : __t) +\\n'\"),h=u+e.length,e;}),f+=\"';\\n\";var g=It.call(e,\"variable\")&&e.variable;if(g){if(lt.test(g))throw new wt(\"Invalid `variable` option passed into `_.template`\");}else f=\"with (obj) {\\n\"+f+\"\\n}\\n\";f=(s?f.replace($,\"\"):f).replace(H,\"$1\").replace(q,\"$1;\"),f=\"function(\"+(g||\"obj\")+\") {\\n\"+(g?\"\":\"obj || (obj = {});\\n\")+\"var __t, __p = ''\"+(o?\", __e = _.escape\":\"\")+(s?\", __j = Array.prototype.join;\\nfunction print() { __p += __j.call(arguments, '') }\\n\":\";\\n\")+f+\"return __p\\n}\";var _=Ka(function(){return xt(u,p+\"return \"+f).apply(i,l);});if(_.source=f,Vs(_))throw _;return _;},jn.times=function(t,e){if((t=da(t))<1||t>c)return[];var n=d,r=mn(t,d);e=oo(e),t-=d;for(var i=Ge(r,e);++n<t;)e(n);return i;},jn.toFinite=fa,jn.toInteger=da,jn.toLength=pa,jn.toLower=function(t){return ma(t).toLowerCase();},jn.toNumber=ga,jn.toSafeInteger=function(t){return t?or(da(t),-9007199254740991,c):0===t?t:0;},jn.toString=ma,jn.toUpper=function(t){return ma(t).toUpperCase();},jn.trim=function(t,e,n){if((t=ma(t))&&(n||e===i))return Ye(t);if(!t||!(e=si(e)))return t;var r=cn(t),o=cn(e);return vi(r,Je(r,o),Qe(r,o)+1).join(\"\");},jn.trimEnd=function(t,e,n){if((t=ma(t))&&(n||e===i))return t.slice(0,fn(t)+1);if(!t||!(e=si(e)))return t;var r=cn(t);return vi(r,0,Qe(r,cn(e))+1).join(\"\");},jn.trimStart=function(t,e,n){if((t=ma(t))&&(n||e===i))return t.replace(rt,\"\");if(!t||!(e=si(e)))return t;var r=cn(t);return vi(r,Je(r,cn(e))).join(\"\");},jn.truncate=function(t,e){var n=30,r=\"...\";if(Qs(e)){var o=\"separator\"in e?e.separator:o;n=\"length\"in e?da(e.length):n,r=\"omission\"in e?si(e.omission):r;}var s=(t=ma(t)).length;if(rn(t)){var a=cn(t);s=a.length;}if(n>=s)return t;var u=n-hn(r);if(u<1)return r;var l=a?vi(a,0,u).join(\"\"):t.slice(0,u);if(o===i)return l+r;if(a&&(u+=l.length-u),ia(o)){if(t.slice(u).search(o)){var h,c=l;for(o.global||(o=Et(o.source,ma(ft.exec(o))+\"g\")),o.lastIndex=0;h=o.exec(c);)var f=h.index;l=l.slice(0,f===i?u:f);}}else if(t.indexOf(si(o),u)!=u){var d=l.lastIndexOf(o);d>-1&&(l=l.slice(0,d));}return l+r;},jn.unescape=function(t){return(t=ma(t))&&G.test(t)?t.replace(Z,dn):t;},jn.uniqueId=function(t){var e=++Ot;return ma(t)+e;},jn.upperCase=Ya,jn.upperFirst=Va,jn.each=ms,jn.eachRight=vs,jn.first=Zo,su(jn,(_u={},vr(jn,function(t,e){It.call(jn.prototype,e)||(_u[e]=t);}),_u),{chain:!1}),jn.VERSION=\"4.17.21\",Ee([\"bind\",\"bindKey\",\"curry\",\"curryRight\",\"partial\",\"partialRight\"],function(t){jn[t].placeholder=jn;}),Ee([\"drop\",\"take\"],function(t,e){$n.prototype[t]=function(n){n=n===i?1:_n(da(n),0);var r=this.__filtered__&&!e?new $n(this):this.clone();return r.__filtered__?r.__takeCount__=mn(n,r.__takeCount__):r.__views__.push({size:mn(n,d),type:t+(r.__dir__<0?\"Right\":\"\")}),r;},$n.prototype[t+\"Right\"]=function(e){return this.reverse()[t](e).reverse();};}),Ee([\"filter\",\"map\",\"takeWhile\"],function(t,e){var n=e+1,r=1==n||3==n;$n.prototype[t]=function(t){var e=this.clone();return e.__iteratees__.push({iteratee:oo(t,3),type:n}),e.__filtered__=e.__filtered__||r,e;};}),Ee([\"head\",\"last\"],function(t,e){var n=\"take\"+(e?\"Right\":\"\");$n.prototype[t]=function(){return this[n](1).value()[0];};}),Ee([\"initial\",\"tail\"],function(t,e){var n=\"drop\"+(e?\"\":\"Right\");$n.prototype[t]=function(){return this.__filtered__?new $n(this):this[n](1);};}),$n.prototype.compact=function(){return this.filter(nu);},$n.prototype.find=function(t){return this.filter(t).head();},$n.prototype.findLast=function(t){return this.reverse().find(t);},$n.prototype.invokeMap=Gr(function(t,e){return\"function\"==typeof t?new $n(this):this.map(function(n){return Br(n,t,e);});}),$n.prototype.reject=function(t){return this.filter(Os(oo(t)));},$n.prototype.slice=function(t,e){t=da(t);var n=this;return n.__filtered__&&(t>0||e<0)?new $n(n):(t<0?n=n.takeRight(-t):t&&(n=n.drop(t)),e!==i&&(n=(e=da(e))<0?n.dropRight(-e):n.take(e-t)),n);},$n.prototype.takeRightWhile=function(t){return this.reverse().takeWhile(t).reverse();},$n.prototype.toArray=function(){return this.take(d);},vr($n.prototype,function(t,e){var n=/^(?:filter|find|map|reject)|While$/.test(e),r=/^(?:head|last)$/.test(e),o=jn[r?\"take\"+(\"last\"==e?\"Right\":\"\"):e],s=r||/^find/.test(e);o&&(jn.prototype[e]=function(){var e=this.__wrapped__,a=r?[1]:arguments,u=e instanceof $n,l=a[0],h=u||Hs(e),c=function c(t){var e=o.apply(jn,Ne([t],a));return r&&f?e[0]:e;};h&&n&&\"function\"==typeof l&&1!=l.length&&(u=h=!1);var f=this.__chain__,d=!!this.__actions__.length,p=s&&!f,g=u&&!d;if(!s&&h){e=g?e:new $n(this);var _=t.apply(e,a);return _.__actions__.push({func:fs,args:[c],thisArg:i}),new Fn(_,f);}return p&&g?t.apply(this,a):(_=this.thru(c),p?r?_.value()[0]:_.value():_);});}),Ee([\"pop\",\"push\",\"shift\",\"sort\",\"splice\",\"unshift\"],function(t){var e=Bt[t],n=/^(?:push|sort|unshift)$/.test(t)?\"tap\":\"thru\",r=/^(?:pop|shift)$/.test(t);jn.prototype[t]=function(){var t=arguments;if(r&&!this.__chain__){var i=this.value();return e.apply(Hs(i)?i:[],t);}return this[n](function(n){return e.apply(Hs(n)?n:[],t);});};}),vr($n.prototype,function(t,e){var n=jn[e];if(n){var r=n.name+\"\";It.call(Tn,r)||(Tn[r]=[]),Tn[r].push({name:e,func:n});}}),Tn[Ui(i,2).name]=[{name:\"wrapper\",func:i}],$n.prototype.clone=function(){var t=new $n(this.__wrapped__);return t.__actions__=Si(this.__actions__),t.__dir__=this.__dir__,t.__filtered__=this.__filtered__,t.__iteratees__=Si(this.__iteratees__),t.__takeCount__=this.__takeCount__,t.__views__=Si(this.__views__),t;},$n.prototype.reverse=function(){if(this.__filtered__){var t=new $n(this);t.__dir__=-1,t.__filtered__=!0;}else(t=this.clone()).__dir__*=-1;return t;},$n.prototype.value=function(){var t=this.__wrapped__.value(),e=this.__dir__,n=Hs(t),r=e<0,i=n?t.length:0,o=function(t,e,n){for(var r=-1,i=n.length;++r<i;){var o=n[r],s=o.size;switch(o.type){case\"drop\":t+=s;break;case\"dropRight\":e-=s;break;case\"take\":e=mn(e,t+s);break;case\"takeRight\":t=_n(t,e-s);}}return{start:t,end:e};}(0,i,this.__views__),s=o.start,a=o.end,u=a-s,l=r?a:s-1,h=this.__iteratees__,c=h.length,f=0,d=mn(u,this.__takeCount__);if(!n||!r&&i==u&&d==u)return ci(t,this.__actions__);var p=[];t:for(;u--&&f<d;){for(var g=-1,_=t[l+=e];++g<c;){var m=h[g],v=m.iteratee,y=m.type,b=v(_);if(2==y)_=b;else if(!b){if(1==y)continue t;break t;}}p[f++]=_;}return p;},jn.prototype.at=ds,jn.prototype.chain=function(){return cs(this);},jn.prototype.commit=function(){return new Fn(this.value(),this.__chain__);},jn.prototype.next=function(){this.__values__===i&&(this.__values__=ca(this.value()));var t=this.__index__>=this.__values__.length;return{done:t,value:t?i:this.__values__[this.__index__++]};},jn.prototype.plant=function(t){for(var e,n=this;n instanceof Dn;){var r=jo(n);r.__index__=0,r.__values__=i,e?o.__wrapped__=r:e=r;var o=r;n=n.__wrapped__;}return o.__wrapped__=t,e;},jn.prototype.reverse=function(){var t=this.__wrapped__;if(t instanceof $n){var e=t;return this.__actions__.length&&(e=new $n(this)),(e=e.reverse()).__actions__.push({func:fs,args:[Qo],thisArg:i}),new Fn(e,this.__chain__);}return this.thru(Qo);},jn.prototype.toJSON=jn.prototype.valueOf=jn.prototype.value=function(){return ci(this.__wrapped__,this.__actions__);},jn.prototype.first=jn.prototype.head,Vt&&(jn.prototype[Vt]=function(){return this;}),jn;}();ce._=pn,(r=function(){return pn;}.call(e,n,e,t))===i||(t.exports=r);}.call(this);},3720:function _(t){t.exports=n;var e=null;try{e=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports;}catch(t){}function n(t,e,n){this.low=0|t,this.high=0|e,this.unsigned=!!n;}function r(t){return!0===(t&&t.__isLong__);}n.prototype.__isLong__,Object.defineProperty(n.prototype,\"__isLong__\",{value:!0}),n.isLong=r;var i={},o={};function s(t,e){var n,r,s;return e?(s=0<=(t>>>=0)&&t<256)&&(r=o[t])?r:(n=u(t,(0|t)<0?-1:0,!0),s&&(o[t]=n),n):(s=-128<=(t|=0)&&t<128)&&(r=i[t])?r:(n=u(t,t<0?-1:0,!1),s&&(i[t]=n),n);}function a(t,e){if(isNaN(t))return e?m:_;if(e){if(t<0)return m;if(t>=d)return x;}else{if(t<=-p)return k;if(t+1>=p)return w;}return t<0?a(-t,e).neg():u(t%f|0,t/f|0,e);}function u(t,e,r){return new n(t,e,r);}n.fromInt=s,n.fromNumber=a,n.fromBits=u;var l=Math.pow;function h(t,e,n){if(0===t.length)throw Error(\"empty string\");if(\"NaN\"===t||\"Infinity\"===t||\"+Infinity\"===t||\"-Infinity\"===t)return _;if(\"number\"==typeof e?(n=e,e=!1):e=!!e,(n=n||10)<2||36<n)throw RangeError(\"radix\");var r;if((r=t.indexOf(\"-\"))>0)throw Error(\"interior hyphen\");if(0===r)return h(t.substring(1),e,n).neg();for(var i=a(l(n,8)),o=_,s=0;s<t.length;s+=8){var u=Math.min(8,t.length-s),c=parseInt(t.substring(s,s+u),n);if(u<8){var f=a(l(n,u));o=o.mul(f).add(a(c));}else o=(o=o.mul(i)).add(a(c));}return o.unsigned=e,o;}function c(t,e){return\"number\"==typeof t?a(t,e):\"string\"==typeof t?h(t,e):u(t.low,t.high,\"boolean\"==typeof e?e:t.unsigned);}n.fromString=h,n.fromValue=c;var f=4294967296,d=f*f,p=d/2,g=s(1<<24),_=s(0);n.ZERO=_;var m=s(0,!0);n.UZERO=m;var v=s(1);n.ONE=v;var y=s(1,!0);n.UONE=y;var b=s(-1);n.NEG_ONE=b;var w=u(-1,2147483647,!1);n.MAX_VALUE=w;var x=u(-1,-1,!0);n.MAX_UNSIGNED_VALUE=x;var k=u(0,-2147483648,!1);n.MIN_VALUE=k;var A=n.prototype;A.toInt=function(){return this.unsigned?this.low>>>0:this.low;},A.toNumber=function(){return this.unsigned?(this.high>>>0)*f+(this.low>>>0):this.high*f+(this.low>>>0);},A.toString=function(t){if((t=t||10)<2||36<t)throw RangeError(\"radix\");if(this.isZero())return\"0\";if(this.isNegative()){if(this.eq(k)){var e=a(t),n=this.div(e),r=n.mul(e).sub(this);return n.toString(t)+r.toInt().toString(t);}return\"-\"+this.neg().toString(t);}for(var i=a(l(t,6),this.unsigned),o=this,s=\"\";;){var u=o.div(i),h=(o.sub(u.mul(i)).toInt()>>>0).toString(t);if((o=u).isZero())return h+s;for(;h.length<6;)h=\"0\"+h;s=\"\"+h+s;}},A.getHighBits=function(){return this.high;},A.getHighBitsUnsigned=function(){return this.high>>>0;},A.getLowBits=function(){return this.low;},A.getLowBitsUnsigned=function(){return this.low>>>0;},A.getNumBitsAbs=function(){if(this.isNegative())return this.eq(k)?64:this.neg().getNumBitsAbs();for(var t=0!=this.high?this.high:this.low,e=31;e>0&&0==(t&1<<e);e--);return 0!=this.high?e+33:e+1;},A.isZero=function(){return 0===this.high&&0===this.low;},A.eqz=A.isZero,A.isNegative=function(){return!this.unsigned&&this.high<0;},A.isPositive=function(){return this.unsigned||this.high>=0;},A.isOdd=function(){return 1==(1&this.low);},A.isEven=function(){return 0==(1&this.low);},A.equals=function(t){return r(t)||(t=c(t)),(this.unsigned===t.unsigned||this.high>>>31!=1||t.high>>>31!=1)&&this.high===t.high&&this.low===t.low;},A.eq=A.equals,A.notEquals=function(t){return!this.eq(t);},A.neq=A.notEquals,A.ne=A.notEquals,A.lessThan=function(t){return this.comp(t)<0;},A.lt=A.lessThan,A.lessThanOrEqual=function(t){return this.comp(t)<=0;},A.lte=A.lessThanOrEqual,A.le=A.lessThanOrEqual,A.greaterThan=function(t){return this.comp(t)>0;},A.gt=A.greaterThan,A.greaterThanOrEqual=function(t){return this.comp(t)>=0;},A.gte=A.greaterThanOrEqual,A.ge=A.greaterThanOrEqual,A.compare=function(t){if(r(t)||(t=c(t)),this.eq(t))return 0;var e=this.isNegative(),n=t.isNegative();return e&&!n?-1:!e&&n?1:this.unsigned?t.high>>>0>this.high>>>0||t.high===this.high&&t.low>>>0>this.low>>>0?-1:1:this.sub(t).isNegative()?-1:1;},A.comp=A.compare,A.negate=function(){return!this.unsigned&&this.eq(k)?k:this.not().add(v);},A.neg=A.negate,A.add=function(t){r(t)||(t=c(t));var e=this.high>>>16,n=65535&this.high,i=this.low>>>16,o=65535&this.low,s=t.high>>>16,a=65535&t.high,l=t.low>>>16,h=0,f=0,d=0,p=0;return d+=(p+=o+(65535&t.low))>>>16,f+=(d+=i+l)>>>16,h+=(f+=n+a)>>>16,h+=e+s,u((d&=65535)<<16|(p&=65535),(h&=65535)<<16|(f&=65535),this.unsigned);},A.subtract=function(t){return r(t)||(t=c(t)),this.add(t.neg());},A.sub=A.subtract,A.multiply=function(t){if(this.isZero())return _;if(r(t)||(t=c(t)),e)return u(e.mul(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned);if(t.isZero())return _;if(this.eq(k))return t.isOdd()?k:_;if(t.eq(k))return this.isOdd()?k:_;if(this.isNegative())return t.isNegative()?this.neg().mul(t.neg()):this.neg().mul(t).neg();if(t.isNegative())return this.mul(t.neg()).neg();if(this.lt(g)&&t.lt(g))return a(this.toNumber()*t.toNumber(),this.unsigned);var n=this.high>>>16,i=65535&this.high,o=this.low>>>16,s=65535&this.low,l=t.high>>>16,h=65535&t.high,f=t.low>>>16,d=65535&t.low,p=0,m=0,v=0,y=0;return v+=(y+=s*d)>>>16,m+=(v+=o*d)>>>16,v&=65535,m+=(v+=s*f)>>>16,p+=(m+=i*d)>>>16,m&=65535,p+=(m+=o*f)>>>16,m&=65535,p+=(m+=s*h)>>>16,p+=n*d+i*f+o*h+s*l,u((v&=65535)<<16|(y&=65535),(p&=65535)<<16|(m&=65535),this.unsigned);},A.mul=A.multiply,A.divide=function(t){if(r(t)||(t=c(t)),t.isZero())throw Error(\"division by zero\");var n,i,o;if(e)return this.unsigned||-2147483648!==this.high||-1!==t.low||-1!==t.high?u((this.unsigned?e.div_u:e.div_s)(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned):this;if(this.isZero())return this.unsigned?m:_;if(this.unsigned){if(t.unsigned||(t=t.toUnsigned()),t.gt(this))return m;if(t.gt(this.shru(1)))return y;o=m;}else{if(this.eq(k))return t.eq(v)||t.eq(b)?k:t.eq(k)?v:(n=this.shr(1).div(t).shl(1)).eq(_)?t.isNegative()?v:b:(i=this.sub(t.mul(n)),o=n.add(i.div(t)));if(t.eq(k))return this.unsigned?m:_;if(this.isNegative())return t.isNegative()?this.neg().div(t.neg()):this.neg().div(t).neg();if(t.isNegative())return this.div(t.neg()).neg();o=_;}for(i=this;i.gte(t);){n=Math.max(1,Math.floor(i.toNumber()/t.toNumber()));for(var s=Math.ceil(Math.log(n)/Math.LN2),h=s<=48?1:l(2,s-48),f=a(n),d=f.mul(t);d.isNegative()||d.gt(i);)d=(f=a(n-=h,this.unsigned)).mul(t);f.isZero()&&(f=v),o=o.add(f),i=i.sub(d);}return o;},A.div=A.divide,A.modulo=function(t){return r(t)||(t=c(t)),e?u((this.unsigned?e.rem_u:e.rem_s)(this.low,this.high,t.low,t.high),e.get_high(),this.unsigned):this.sub(this.div(t).mul(t));},A.mod=A.modulo,A.rem=A.modulo,A.not=function(){return u(~this.low,~this.high,this.unsigned);},A.and=function(t){return r(t)||(t=c(t)),u(this.low&t.low,this.high&t.high,this.unsigned);},A.or=function(t){return r(t)||(t=c(t)),u(this.low|t.low,this.high|t.high,this.unsigned);},A.xor=function(t){return r(t)||(t=c(t)),u(this.low^t.low,this.high^t.high,this.unsigned);},A.shiftLeft=function(t){return r(t)&&(t=t.toInt()),0==(t&=63)?this:t<32?u(this.low<<t,this.high<<t|this.low>>>32-t,this.unsigned):u(0,this.low<<t-32,this.unsigned);},A.shl=A.shiftLeft,A.shiftRight=function(t){return r(t)&&(t=t.toInt()),0==(t&=63)?this:t<32?u(this.low>>>t|this.high<<32-t,this.high>>t,this.unsigned):u(this.high>>t-32,this.high>=0?0:-1,this.unsigned);},A.shr=A.shiftRight,A.shiftRightUnsigned=function(t){if(r(t)&&(t=t.toInt()),0==(t&=63))return this;var e=this.high;return t<32?u(this.low>>>t|e<<32-t,e>>>t,this.unsigned):u(32===t?e:e>>>t-32,0,this.unsigned);},A.shru=A.shiftRightUnsigned,A.shr_u=A.shiftRightUnsigned,A.toSigned=function(){return this.unsigned?u(this.low,this.high,!1):this;},A.toUnsigned=function(){return this.unsigned?this:u(this.low,this.high,!0);},A.toBytes=function(t){return t?this.toBytesLE():this.toBytesBE();},A.toBytesLE=function(){var t=this.high,e=this.low;return[255&e,e>>>8&255,e>>>16&255,e>>>24,255&t,t>>>8&255,t>>>16&255,t>>>24];},A.toBytesBE=function(){var t=this.high,e=this.low;return[t>>>24,t>>>16&255,t>>>8&255,255&t,e>>>24,e>>>16&255,e>>>8&255,255&e];},n.fromBytes=function(t,e,r){return r?n.fromBytesLE(t,e):n.fromBytesBE(t,e);},n.fromBytesLE=function(t,e){return new n(t[0]|t[1]<<8|t[2]<<16|t[3]<<24,t[4]|t[5]<<8|t[6]<<16|t[7]<<24,e);},n.fromBytesBE=function(t,e){return new n(t[4]<<24|t[5]<<16|t[6]<<8|t[7],t[0]<<24|t[1]<<16|t[2]<<8|t[3],e);};},9593:function _(t,e,n){\"use strict\";var r=n(4411),i=Symbol(\"max\"),o=Symbol(\"length\"),s=Symbol(\"lengthCalculator\"),a=Symbol(\"allowStale\"),u=Symbol(\"maxAge\"),l=Symbol(\"dispose\"),h=Symbol(\"noDisposeOnSet\"),c=Symbol(\"lruList\"),f=Symbol(\"cache\"),d=Symbol(\"updateAgeOnGet\"),p=function p(){return 1;},g=function g(t,e,n){var r=t[f].get(e);if(r){var _e23=r.value;if(_(t,_e23)){if(v(t,r),!t[a])return;}else n&&(t[d]&&(r.value.now=Date.now()),t[c].unshiftNode(r));return _e23.value;}},_=function _(t,e){if(!e||!e.maxAge&&!t[u])return!1;var n=Date.now()-e.now;return e.maxAge?n>e.maxAge:t[u]&&n>t[u];},m=function m(t){if(t[o]>t[i])for(var _e24=t[c].tail;t[o]>t[i]&&null!==_e24;){var _n12=_e24.prev;v(t,_e24),_e24=_n12;}},v=function v(t,e){if(e){var _n13=e.value;t[l]&&t[l](_n13.key,_n13.value),t[o]-=_n13.length,t[f][\"delete\"](_n13.key),t[c].removeNode(e);}};var y=/*#__PURE__*/_createClass(function y(t,e,n,r,i){_classCallCheck(this,y);this.key=t,this.value=e,this.length=n,this.now=r,this.maxAge=i||0;});var b=function b(t,e,n,r){var i=n.value;_(t,i)&&(v(t,n),t[a]||(i=void 0)),i&&e.call(r,i.value,i.key,t);};t.exports=/*#__PURE__*/function(){function _class4(t){_classCallCheck(this,_class4);if(\"number\"==typeof t&&(t={max:t}),t||(t={}),t.max&&(\"number\"!=typeof t.max||t.max<0))throw new TypeError(\"max must be a non-negative number\");this[i]=t.max||1/0;var e=t.length||p;if(this[s]=\"function\"!=typeof e?p:e,this[a]=t.stale||!1,t.maxAge&&\"number\"!=typeof t.maxAge)throw new TypeError(\"maxAge must be a number\");this[u]=t.maxAge||0,this[l]=t.dispose,this[h]=t.noDisposeOnSet||!1,this[d]=t.updateAgeOnGet||!1,this.reset();}_createClass(_class4,[{key:\"max\",get:function get(){return this[i];},set:function set(t){if(\"number\"!=typeof t||t<0)throw new TypeError(\"max must be a non-negative number\");this[i]=t||1/0,m(this);}},{key:\"allowStale\",get:function get(){return this[a];},set:function set(t){this[a]=!!t;}},{key:\"maxAge\",get:function get(){return this[u];},set:function set(t){if(\"number\"!=typeof t)throw new TypeError(\"maxAge must be a non-negative number\");this[u]=t,m(this);}},{key:\"lengthCalculator\",get:function get(){return this[s];},set:function set(t){var _this8=this;\"function\"!=typeof t&&(t=p),t!==this[s]&&(this[s]=t,this[o]=0,this[c].forEach(function(t){t.length=_this8[s](t.value,t.key),_this8[o]+=t.length;})),m(this);}},{key:\"length\",get:function get(){return this[o];}},{key:\"itemCount\",get:function get(){return this[c].length;}},{key:\"rforEach\",value:function rforEach(t,e){e=e||this;for(var _n14=this[c].tail;null!==_n14;){var _r17=_n14.prev;b(this,t,_n14,e),_n14=_r17;}}},{key:\"forEach\",value:function forEach(t,e){e=e||this;for(var _n15=this[c].head;null!==_n15;){var _r18=_n15.next;b(this,t,_n15,e),_n15=_r18;}}},{key:\"keys\",value:function keys(){return this[c].toArray().map(function(t){return t.key;});}},{key:\"values\",value:function values(){return this[c].toArray().map(function(t){return t.value;});}},{key:\"reset\",value:function reset(){var _this9=this;this[l]&&this[c]&&this[c].length&&this[c].forEach(function(t){return _this9[l](t.key,t.value);}),this[f]=new Map(),this[c]=new r(),this[o]=0;}},{key:\"dump\",value:function dump(){var _this10=this;return this[c].map(function(t){return!_(_this10,t)&&{k:t.key,v:t.value,e:t.now+(t.maxAge||0)};}).toArray().filter(function(t){return t;});}},{key:\"dumpLru\",value:function dumpLru(){return this[c];}},{key:\"set\",value:function set(t,e,n){if((n=n||this[u])&&\"number\"!=typeof n)throw new TypeError(\"maxAge must be a number\");var r=n?Date.now():0,a=this[s](e,t);if(this[f].has(t)){if(a>this[i])return v(this,this[f].get(t)),!1;var _s10=this[f].get(t).value;return this[l]&&(this[h]||this[l](t,_s10.value)),_s10.now=r,_s10.maxAge=n,_s10.value=e,this[o]+=a-_s10.length,_s10.length=a,this.get(t),m(this),!0;}var d=new y(t,e,a,r,n);return d.length>this[i]?(this[l]&&this[l](t,e),!1):(this[o]+=d.length,this[c].unshift(d),this[f].set(t,this[c].head),m(this),!0);}},{key:\"has\",value:function has(t){if(!this[f].has(t))return!1;var e=this[f].get(t).value;return!_(this,e);}},{key:\"get\",value:function get(t){return g(this,t,!0);}},{key:\"peek\",value:function peek(t){return g(this,t,!1);}},{key:\"pop\",value:function pop(){var t=this[c].tail;return t?(v(this,t),t.value):null;}},{key:\"del\",value:function del(t){v(this,this[f].get(t));}},{key:\"load\",value:function load(t){this.reset();var e=Date.now();for(var _n16=t.length-1;_n16>=0;_n16--){var _r19=t[_n16],_i13=_r19.e||0;if(0===_i13)this.set(_r19.k,_r19.v);else{var _t15=_i13-e;_t15>0&&this.set(_r19.k,_r19.v,_t15);}}}},{key:\"prune\",value:function prune(){var _this11=this;this[f].forEach(function(t,e){return g(_this11,e,!1);});}}]);return _class4;}();},9591:function _(t,e,n){\"use strict\";var r={};(0,n(4236).assign)(r,n(4555),n(8843),n(1619)),t.exports=r;},4555:function _(t,e,n){\"use strict\";var r=n(405),i=n(4236),o=n(9373),s=n(8898),a=n(2292),u=Object.prototype.toString,l=0,h=-1,c=0,f=8;function d(t){if(!(this instanceof d))return new d(t);this.options=i.assign({level:h,method:f,chunkSize:16384,windowBits:15,memLevel:8,strategy:c,to:\"\"},t||{});var e=this.options;e.raw&&e.windowBits>0?e.windowBits=-e.windowBits:e.gzip&&e.windowBits>0&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg=\"\",this.ended=!1,this.chunks=[],this.strm=new a(),this.strm.avail_out=0;var n=r.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(n!==l)throw new Error(s[n]);if(e.header&&r.deflateSetHeader(this.strm,e.header),e.dictionary){var p;if(p=\"string\"==typeof e.dictionary?o.string2buf(e.dictionary):\"[object ArrayBuffer]\"===u.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,(n=r.deflateSetDictionary(this.strm,p))!==l)throw new Error(s[n]);this._dict_set=!0;}}function p(t,e){var n=new d(e);if(n.push(t,!0),n.err)throw n.msg||s[n.err];return n.result;}d.prototype.push=function(t,e){var n,s,a=this.strm,h=this.options.chunkSize;if(this.ended)return!1;s=e===~~e?e:!0===e?4:0,\"string\"==typeof t?a.input=o.string2buf(t):\"[object ArrayBuffer]\"===u.call(t)?a.input=new Uint8Array(t):a.input=t,a.next_in=0,a.avail_in=a.input.length;do{if(0===a.avail_out&&(a.output=new i.Buf8(h),a.next_out=0,a.avail_out=h),1!==(n=r.deflate(a,s))&&n!==l)return this.onEnd(n),this.ended=!0,!1;0!==a.avail_out&&(0!==a.avail_in||4!==s&&2!==s)||(\"string\"===this.options.to?this.onData(o.buf2binstring(i.shrinkBuf(a.output,a.next_out))):this.onData(i.shrinkBuf(a.output,a.next_out)));}while((a.avail_in>0||0===a.avail_out)&&1!==n);return 4===s?(n=r.deflateEnd(this.strm),this.onEnd(n),this.ended=!0,n===l):2!==s||(this.onEnd(l),a.avail_out=0,!0);},d.prototype.onData=function(t){this.chunks.push(t);},d.prototype.onEnd=function(t){t===l&&(\"string\"===this.options.to?this.result=this.chunks.join(\"\"):this.result=i.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg;},e.Deflate=d,e.deflate=p,e.deflateRaw=function(t,e){return(e=e||{}).raw=!0,p(t,e);},e.gzip=function(t,e){return(e=e||{}).gzip=!0,p(t,e);};},8843:function _(t,e,n){\"use strict\";var r=n(7948),i=n(4236),o=n(9373),s=n(1619),a=n(8898),u=n(2292),l=n(2401),h=Object.prototype.toString;function c(t){if(!(this instanceof c))return new c(t);this.options=i.assign({chunkSize:16384,windowBits:0,to:\"\"},t||{});var e=this.options;e.raw&&e.windowBits>=0&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(e.windowBits>=0&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),e.windowBits>15&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg=\"\",this.ended=!1,this.chunks=[],this.strm=new u(),this.strm.avail_out=0;var n=r.inflateInit2(this.strm,e.windowBits);if(n!==s.Z_OK)throw new Error(a[n]);if(this.header=new l(),r.inflateGetHeader(this.strm,this.header),e.dictionary&&(\"string\"==typeof e.dictionary?e.dictionary=o.string2buf(e.dictionary):\"[object ArrayBuffer]\"===h.call(e.dictionary)&&(e.dictionary=new Uint8Array(e.dictionary)),e.raw&&(n=r.inflateSetDictionary(this.strm,e.dictionary))!==s.Z_OK))throw new Error(a[n]);}function f(t,e){var n=new c(e);if(n.push(t,!0),n.err)throw n.msg||a[n.err];return n.result;}c.prototype.push=function(t,e){var n,a,u,l,c,f=this.strm,d=this.options.chunkSize,p=this.options.dictionary,g=!1;if(this.ended)return!1;a=e===~~e?e:!0===e?s.Z_FINISH:s.Z_NO_FLUSH,\"string\"==typeof t?f.input=o.binstring2buf(t):\"[object ArrayBuffer]\"===h.call(t)?f.input=new Uint8Array(t):f.input=t,f.next_in=0,f.avail_in=f.input.length;do{if(0===f.avail_out&&(f.output=new i.Buf8(d),f.next_out=0,f.avail_out=d),(n=r.inflate(f,s.Z_NO_FLUSH))===s.Z_NEED_DICT&&p&&(n=r.inflateSetDictionary(this.strm,p)),n===s.Z_BUF_ERROR&&!0===g&&(n=s.Z_OK,g=!1),n!==s.Z_STREAM_END&&n!==s.Z_OK)return this.onEnd(n),this.ended=!0,!1;f.next_out&&(0!==f.avail_out&&n!==s.Z_STREAM_END&&(0!==f.avail_in||a!==s.Z_FINISH&&a!==s.Z_SYNC_FLUSH)||(\"string\"===this.options.to?(u=o.utf8border(f.output,f.next_out),l=f.next_out-u,c=o.buf2string(f.output,u),f.next_out=l,f.avail_out=d-l,l&&i.arraySet(f.output,f.output,u,l,0),this.onData(c)):this.onData(i.shrinkBuf(f.output,f.next_out)))),0===f.avail_in&&0===f.avail_out&&(g=!0);}while((f.avail_in>0||0===f.avail_out)&&n!==s.Z_STREAM_END);return n===s.Z_STREAM_END&&(a=s.Z_FINISH),a===s.Z_FINISH?(n=r.inflateEnd(this.strm),this.onEnd(n),this.ended=!0,n===s.Z_OK):a!==s.Z_SYNC_FLUSH||(this.onEnd(s.Z_OK),f.avail_out=0,!0);},c.prototype.onData=function(t){this.chunks.push(t);},c.prototype.onEnd=function(t){t===s.Z_OK&&(\"string\"===this.options.to?this.result=this.chunks.join(\"\"):this.result=i.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg;},e.Inflate=c,e.inflate=f,e.inflateRaw=function(t,e){return(e=e||{}).raw=!0,f(t,e);},e.ungzip=f;},4236:function _(t,e){\"use strict\";var n=\"undefined\"!=typeof Uint8Array&&\"undefined\"!=typeof Uint16Array&&\"undefined\"!=typeof Int32Array;function r(t,e){return Object.prototype.hasOwnProperty.call(t,e);}e.assign=function(t){for(var e=Array.prototype.slice.call(arguments,1);e.length;){var n=e.shift();if(n){if(\"object\"!=_typeof(n))throw new TypeError(n+\"must be non-object\");for(var i in n)r(n,i)&&(t[i]=n[i]);}}return t;},e.shrinkBuf=function(t,e){return t.length===e?t:t.subarray?t.subarray(0,e):(t.length=e,t);};var i={arraySet:function arraySet(t,e,n,r,i){if(e.subarray&&t.subarray)t.set(e.subarray(n,n+r),i);else for(var o=0;o<r;o++)t[i+o]=e[n+o];},flattenChunks:function flattenChunks(t){var e,n,r,i,o,s;for(r=0,e=0,n=t.length;e<n;e++)r+=t[e].length;for(s=new Uint8Array(r),i=0,e=0,n=t.length;e<n;e++)o=t[e],s.set(o,i),i+=o.length;return s;}},o={arraySet:function arraySet(t,e,n,r,i){for(var o=0;o<r;o++)t[i+o]=e[n+o];},flattenChunks:function flattenChunks(t){return[].concat.apply([],t);}};e.setTyped=function(t){t?(e.Buf8=Uint8Array,e.Buf16=Uint16Array,e.Buf32=Int32Array,e.assign(e,i)):(e.Buf8=Array,e.Buf16=Array,e.Buf32=Array,e.assign(e,o));},e.setTyped(n);},9373:function _(t,e,n){\"use strict\";var r=n(4236),i=!0,o=!0;try{String.fromCharCode.apply(null,[0]);}catch(t){i=!1;}try{String.fromCharCode.apply(null,new Uint8Array(1));}catch(t){o=!1;}for(var s=new r.Buf8(256),a=0;a<256;a++)s[a]=a>=252?6:a>=248?5:a>=240?4:a>=224?3:a>=192?2:1;function u(t,e){if(e<65534&&(t.subarray&&o||!t.subarray&&i))return String.fromCharCode.apply(null,r.shrinkBuf(t,e));for(var n=\"\",s=0;s<e;s++)n+=String.fromCharCode(t[s]);return n;}s[254]=s[254]=1,e.string2buf=function(t){var e,n,i,o,s,a=t.length,u=0;for(o=0;o<a;o++)55296==(64512&(n=t.charCodeAt(o)))&&o+1<a&&56320==(64512&(i=t.charCodeAt(o+1)))&&(n=65536+(n-55296<<10)+(i-56320),o++),u+=n<128?1:n<2048?2:n<65536?3:4;for(e=new r.Buf8(u),s=0,o=0;s<u;o++)55296==(64512&(n=t.charCodeAt(o)))&&o+1<a&&56320==(64512&(i=t.charCodeAt(o+1)))&&(n=65536+(n-55296<<10)+(i-56320),o++),n<128?e[s++]=n:n<2048?(e[s++]=192|n>>>6,e[s++]=128|63&n):n<65536?(e[s++]=224|n>>>12,e[s++]=128|n>>>6&63,e[s++]=128|63&n):(e[s++]=240|n>>>18,e[s++]=128|n>>>12&63,e[s++]=128|n>>>6&63,e[s++]=128|63&n);return e;},e.buf2binstring=function(t){return u(t,t.length);},e.binstring2buf=function(t){for(var e=new r.Buf8(t.length),n=0,i=e.length;n<i;n++)e[n]=t.charCodeAt(n);return e;},e.buf2string=function(t,e){var n,r,i,o,a=e||t.length,l=new Array(2*a);for(r=0,n=0;n<a;)if((i=t[n++])<128)l[r++]=i;else if((o=s[i])>4)l[r++]=65533,n+=o-1;else{for(i&=2===o?31:3===o?15:7;o>1&&n<a;)i=i<<6|63&t[n++],o--;o>1?l[r++]=65533:i<65536?l[r++]=i:(i-=65536,l[r++]=55296|i>>10&1023,l[r++]=56320|1023&i);}return u(l,r);},e.utf8border=function(t,e){var n;for((e=e||t.length)>t.length&&(e=t.length),n=e-1;n>=0&&128==(192&t[n]);)n--;return n<0||0===n?e:n+s[t[n]]>e?n:e;};},6069:function _(t){\"use strict\";t.exports=function(t,e,n,r){for(var i=65535&t|0,o=t>>>16&65535|0,s=0;0!==n;){n-=s=n>2e3?2e3:n;do{o=o+(i=i+e[r++]|0)|0;}while(--s);i%=65521,o%=65521;}return i|o<<16|0;};},1619:function _(t){\"use strict\";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};},2869:function _(t){\"use strict\";var e=function(){for(var t,e=[],n=0;n<256;n++){t=n;for(var r=0;r<8;r++)t=1&t?3988292384^t>>>1:t>>>1;e[n]=t;}return e;}();t.exports=function(t,n,r,i){var o=e,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^o[255&(t^n[a])];return-1^t;};},405:function _(t,e,n){\"use strict\";var r,i=n(4236),o=n(342),s=n(6069),a=n(2869),u=n(8898),l=0,h=0,c=-2,f=2,d=8,p=286,g=30,_=19,m=2*p+1,v=15,y=3,b=258,w=b+y+1,x=42,k=103,A=113,E=666;function S(t,e){return t.msg=u[e],e;}function M(t){return(t<<1)-(t>4?9:0);}function B(t){for(var e=t.length;--e>=0;)t[e]=0;}function T(t){var e=t.state,n=e.pending;n>t.avail_out&&(n=t.avail_out),0!==n&&(i.arraySet(t.output,e.pending_buf,e.pending_out,n,t.next_out),t.next_out+=n,e.pending_out+=n,t.total_out+=n,t.avail_out-=n,e.pending-=n,0===e.pending&&(e.pending_out=0));}function z(t,e){o._tr_flush_block(t,t.block_start>=0?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,T(t.strm);}function C(t,e){t.pending_buf[t.pending++]=e;}function N(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e;}function I(t,e){var n,r,i=t.max_chain_length,o=t.strstart,s=t.prev_length,a=t.nice_match,u=t.strstart>t.w_size-w?t.strstart-(t.w_size-w):0,l=t.window,h=t.w_mask,c=t.prev,f=t.strstart+b,d=l[o+s-1],p=l[o+s];t.prev_length>=t.good_match&&(i>>=2),a>t.lookahead&&(a=t.lookahead);do{if(l[(n=e)+s]===p&&l[n+s-1]===d&&l[n]===l[o]&&l[++n]===l[o+1]){o+=2,n++;do{}while(l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&l[++o]===l[++n]&&o<f);if(r=b-(f-o),o=f-b,r>s){if(t.match_start=e,s=r,r>=a)break;d=l[o+s-1],p=l[o+s];}}}while((e=c[e&h])>u&&0!=--i);return s<=t.lookahead?s:t.lookahead;}function O(t){var e,n,r,o,u,l,h,c,f,d,p=t.w_size;do{if(o=t.window_size-t.lookahead-t.strstart,t.strstart>=p+(p-w)){i.arraySet(t.window,t.window,p,p,0),t.match_start-=p,t.strstart-=p,t.block_start-=p,e=n=t.hash_size;do{r=t.head[--e],t.head[e]=r>=p?r-p:0;}while(--n);e=n=p;do{r=t.prev[--e],t.prev[e]=r>=p?r-p:0;}while(--n);o+=p;}if(0===t.strm.avail_in)break;if(l=t.strm,h=t.window,c=t.strstart+t.lookahead,f=o,d=void 0,(d=l.avail_in)>f&&(d=f),n=0===d?0:(l.avail_in-=d,i.arraySet(h,l.input,l.next_in,d,c),1===l.state.wrap?l.adler=s(l.adler,h,d,c):2===l.state.wrap&&(l.adler=a(l.adler,h,d,c)),l.next_in+=d,l.total_in+=d,d),t.lookahead+=n,t.lookahead+t.insert>=y)for(u=t.strstart-t.insert,t.ins_h=t.window[u],t.ins_h=(t.ins_h<<t.hash_shift^t.window[u+1])&t.hash_mask;t.insert&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[u+y-1])&t.hash_mask,t.prev[u&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=u,u++,t.insert--,!(t.lookahead+t.insert<y)););}while(t.lookahead<w&&0!==t.strm.avail_in);}function R(t,e){for(var n,r;;){if(t.lookahead<w){if(O(t),t.lookahead<w&&e===l)return 1;if(0===t.lookahead)break;}if(n=0,t.lookahead>=y&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+y-1])&t.hash_mask,n=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==n&&t.strstart-n<=t.w_size-w&&(t.match_length=I(t,n)),t.match_length>=y){if(r=o._tr_tally(t,t.strstart-t.match_start,t.match_length-y),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=y){t.match_length--;do{t.strstart++,t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+y-1])&t.hash_mask,n=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart;}while(0!=--t.match_length);t.strstart++;}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+1])&t.hash_mask;}else r=o._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(r&&(z(t,!1),0===t.strm.avail_out))return 1;}return t.insert=t.strstart<y-1?t.strstart:y-1,4===e?(z(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(z(t,!1),0===t.strm.avail_out)?1:2;}function L(t,e){for(var n,r,i;;){if(t.lookahead<w){if(O(t),t.lookahead<w&&e===l)return 1;if(0===t.lookahead)break;}if(n=0,t.lookahead>=y&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+y-1])&t.hash_mask,n=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=y-1,0!==n&&t.prev_length<t.max_lazy_match&&t.strstart-n<=t.w_size-w&&(t.match_length=I(t,n),t.match_length<=5&&(1===t.strategy||t.match_length===y&&t.strstart-t.match_start>4096)&&(t.match_length=y-1)),t.prev_length>=y&&t.match_length<=t.prev_length){i=t.strstart+t.lookahead-y,r=o._tr_tally(t,t.strstart-1-t.prev_match,t.prev_length-y),t.lookahead-=t.prev_length-1,t.prev_length-=2;do{++t.strstart<=i&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+y-1])&t.hash_mask,n=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart);}while(0!=--t.prev_length);if(t.match_available=0,t.match_length=y-1,t.strstart++,r&&(z(t,!1),0===t.strm.avail_out))return 1;}else if(t.match_available){if((r=o._tr_tally(t,0,t.window[t.strstart-1]))&&z(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return 1;}else t.match_available=1,t.strstart++,t.lookahead--;}return t.match_available&&(r=o._tr_tally(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<y-1?t.strstart:y-1,4===e?(z(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(z(t,!1),0===t.strm.avail_out)?1:2;}function U(t,e,n,r,i){this.good_length=t,this.max_lazy=e,this.nice_length=n,this.max_chain=r,this.func=i;}function j(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=d,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new i.Buf16(2*m),this.dyn_dtree=new i.Buf16(2*(2*g+1)),this.bl_tree=new i.Buf16(2*(2*_+1)),B(this.dyn_ltree),B(this.dyn_dtree),B(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new i.Buf16(v+1),this.heap=new i.Buf16(2*p+1),B(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new i.Buf16(2*p+1),B(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0;}function P(t){var e;return t&&t.state?(t.total_in=t.total_out=0,t.data_type=f,(e=t.state).pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?x:A,t.adler=2===e.wrap?0:1,e.last_flush=l,o._tr_init(e),h):S(t,c);}function D(t){var e,n=P(t);return n===h&&((e=t.state).window_size=2*e.w_size,B(e.head),e.max_lazy_match=r[e.level].max_lazy,e.good_match=r[e.level].good_length,e.nice_match=r[e.level].nice_length,e.max_chain_length=r[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=y-1,e.match_available=0,e.ins_h=0),n;}function F(t,e,n,r,o,s){if(!t)return c;var a=1;if(-1===e&&(e=6),r<0?(a=0,r=-r):r>15&&(a=2,r-=16),o<1||o>9||n!==d||r<8||r>15||e<0||e>9||s<0||s>4)return S(t,c);8===r&&(r=9);var u=new j();return t.state=u,u.strm=t,u.wrap=a,u.gzhead=null,u.w_bits=r,u.w_size=1<<u.w_bits,u.w_mask=u.w_size-1,u.hash_bits=o+7,u.hash_size=1<<u.hash_bits,u.hash_mask=u.hash_size-1,u.hash_shift=~~((u.hash_bits+y-1)/y),u.window=new i.Buf8(2*u.w_size),u.head=new i.Buf16(u.hash_size),u.prev=new i.Buf16(u.w_size),u.lit_bufsize=1<<o+6,u.pending_buf_size=4*u.lit_bufsize,u.pending_buf=new i.Buf8(u.pending_buf_size),u.d_buf=1*u.lit_bufsize,u.l_buf=3*u.lit_bufsize,u.level=e,u.strategy=s,u.method=n,D(t);}r=[new U(0,0,0,0,function(t,e){var n=65535;for(n>t.pending_buf_size-5&&(n=t.pending_buf_size-5);;){if(t.lookahead<=1){if(O(t),0===t.lookahead&&e===l)return 1;if(0===t.lookahead)break;}t.strstart+=t.lookahead,t.lookahead=0;var r=t.block_start+n;if((0===t.strstart||t.strstart>=r)&&(t.lookahead=t.strstart-r,t.strstart=r,z(t,!1),0===t.strm.avail_out))return 1;if(t.strstart-t.block_start>=t.w_size-w&&(z(t,!1),0===t.strm.avail_out))return 1;}return t.insert=0,4===e?(z(t,!0),0===t.strm.avail_out?3:4):(t.strstart>t.block_start&&(z(t,!1),t.strm.avail_out),1);}),new U(4,4,8,4,R),new U(4,5,16,8,R),new U(4,6,32,32,R),new U(4,4,16,16,L),new U(8,16,32,32,L),new U(8,16,128,128,L),new U(8,32,128,256,L),new U(32,128,258,1024,L),new U(32,258,258,4096,L)],e.deflateInit=function(t,e){return F(t,e,d,15,8,0);},e.deflateInit2=F,e.deflateReset=D,e.deflateResetKeep=P,e.deflateSetHeader=function(t,e){return t&&t.state?2!==t.state.wrap?c:(t.state.gzhead=e,h):c;},e.deflate=function(t,e){var n,i,s,u;if(!t||!t.state||e>5||e<0)return t?S(t,c):c;if(i=t.state,!t.output||!t.input&&0!==t.avail_in||i.status===E&&4!==e)return S(t,0===t.avail_out?-5:c);if(i.strm=t,n=i.last_flush,i.last_flush=e,i.status===x)if(2===i.wrap)t.adler=0,C(i,31),C(i,139),C(i,8),i.gzhead?(C(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),C(i,255&i.gzhead.time),C(i,i.gzhead.time>>8&255),C(i,i.gzhead.time>>16&255),C(i,i.gzhead.time>>24&255),C(i,9===i.level?2:i.strategy>=2||i.level<2?4:0),C(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(C(i,255&i.gzhead.extra.length),C(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(t.adler=a(t.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(C(i,0),C(i,0),C(i,0),C(i,0),C(i,0),C(i,9===i.level?2:i.strategy>=2||i.level<2?4:0),C(i,3),i.status=A);else{var f=d+(i.w_bits-8<<4)<<8;f|=(i.strategy>=2||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(f|=32),f+=31-f%31,i.status=A,N(i,f),0!==i.strstart&&(N(i,t.adler>>>16),N(i,65535&t.adler)),t.adler=1;}if(69===i.status)if(i.gzhead.extra){for(s=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),T(t),s=i.pending,i.pending!==i.pending_buf_size));)C(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73);}else i.status=73;if(73===i.status)if(i.gzhead.name){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),T(t),s=i.pending,i.pending===i.pending_buf_size)){u=1;break;}u=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,C(i,u);}while(0!==u);i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),0===u&&(i.gzindex=0,i.status=91);}else i.status=91;if(91===i.status)if(i.gzhead.comment){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),T(t),s=i.pending,i.pending===i.pending_buf_size)){u=1;break;}u=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,C(i,u);}while(0!==u);i.gzhead.hcrc&&i.pending>s&&(t.adler=a(t.adler,i.pending_buf,i.pending-s,s)),0===u&&(i.status=k);}else i.status=k;if(i.status===k&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&T(t),i.pending+2<=i.pending_buf_size&&(C(i,255&t.adler),C(i,t.adler>>8&255),t.adler=0,i.status=A)):i.status=A),0!==i.pending){if(T(t),0===t.avail_out)return i.last_flush=-1,h;}else if(0===t.avail_in&&M(e)<=M(n)&&4!==e)return S(t,-5);if(i.status===E&&0!==t.avail_in)return S(t,-5);if(0!==t.avail_in||0!==i.lookahead||e!==l&&i.status!==E){var p=2===i.strategy?function(t,e){for(var n;;){if(0===t.lookahead&&(O(t),0===t.lookahead)){if(e===l)return 1;break;}if(t.match_length=0,n=o._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,n&&(z(t,!1),0===t.strm.avail_out))return 1;}return t.insert=0,4===e?(z(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(z(t,!1),0===t.strm.avail_out)?1:2;}(i,e):3===i.strategy?function(t,e){for(var n,r,i,s,a=t.window;;){if(t.lookahead<=b){if(O(t),t.lookahead<=b&&e===l)return 1;if(0===t.lookahead)break;}if(t.match_length=0,t.lookahead>=y&&t.strstart>0&&(r=a[i=t.strstart-1])===a[++i]&&r===a[++i]&&r===a[++i]){s=t.strstart+b;do{}while(r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&r===a[++i]&&i<s);t.match_length=b-(s-i),t.match_length>t.lookahead&&(t.match_length=t.lookahead);}if(t.match_length>=y?(n=o._tr_tally(t,1,t.match_length-y),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(n=o._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),n&&(z(t,!1),0===t.strm.avail_out))return 1;}return t.insert=0,4===e?(z(t,!0),0===t.strm.avail_out?3:4):t.last_lit&&(z(t,!1),0===t.strm.avail_out)?1:2;}(i,e):r[i.level].func(i,e);if(3!==p&&4!==p||(i.status=E),1===p||3===p)return 0===t.avail_out&&(i.last_flush=-1),h;if(2===p&&(1===e?o._tr_align(i):5!==e&&(o._tr_stored_block(i,0,0,!1),3===e&&(B(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),T(t),0===t.avail_out))return i.last_flush=-1,h;}return 4!==e?h:i.wrap<=0?1:(2===i.wrap?(C(i,255&t.adler),C(i,t.adler>>8&255),C(i,t.adler>>16&255),C(i,t.adler>>24&255),C(i,255&t.total_in),C(i,t.total_in>>8&255),C(i,t.total_in>>16&255),C(i,t.total_in>>24&255)):(N(i,t.adler>>>16),N(i,65535&t.adler)),T(t),i.wrap>0&&(i.wrap=-i.wrap),0!==i.pending?h:1);},e.deflateEnd=function(t){var e;return t&&t.state?(e=t.state.status)!==x&&69!==e&&73!==e&&91!==e&&e!==k&&e!==A&&e!==E?S(t,c):(t.state=null,e===A?S(t,-3):h):c;},e.deflateSetDictionary=function(t,e){var n,r,o,a,u,l,f,d,p=e.length;if(!t||!t.state)return c;if(2===(a=(n=t.state).wrap)||1===a&&n.status!==x||n.lookahead)return c;for(1===a&&(t.adler=s(t.adler,e,p,0)),n.wrap=0,p>=n.w_size&&(0===a&&(B(n.head),n.strstart=0,n.block_start=0,n.insert=0),d=new i.Buf8(n.w_size),i.arraySet(d,e,p-n.w_size,n.w_size,0),e=d,p=n.w_size),u=t.avail_in,l=t.next_in,f=t.input,t.avail_in=p,t.next_in=0,t.input=e,O(n);n.lookahead>=y;){r=n.strstart,o=n.lookahead-(y-1);do{n.ins_h=(n.ins_h<<n.hash_shift^n.window[r+y-1])&n.hash_mask,n.prev[r&n.w_mask]=n.head[n.ins_h],n.head[n.ins_h]=r,r++;}while(--o);n.strstart=r,n.lookahead=y-1,O(n);}return n.strstart+=n.lookahead,n.block_start=n.strstart,n.insert=n.lookahead,n.lookahead=0,n.match_length=n.prev_length=y-1,n.match_available=0,t.next_in=l,t.input=f,t.avail_in=u,n.wrap=a,h;},e.deflateInfo=\"pako deflate (from Nodeca project)\";},2401:function _(t){\"use strict\";t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name=\"\",this.comment=\"\",this.hcrc=0,this.done=!1;};},4264:function _(t){\"use strict\";t.exports=function(t,e){var n,r,i,o,s,a,u,l,h,c,f,d,p,g,_,m,v,y,b,w,x,k,A,E,S;n=t.state,r=t.next_in,E=t.input,i=r+(t.avail_in-5),o=t.next_out,S=t.output,s=o-(e-t.avail_out),a=o+(t.avail_out-257),u=n.dmax,l=n.wsize,h=n.whave,c=n.wnext,f=n.window,d=n.hold,p=n.bits,g=n.lencode,_=n.distcode,m=(1<<n.lenbits)-1,v=(1<<n.distbits)-1;t:do{p<15&&(d+=E[r++]<<p,p+=8,d+=E[r++]<<p,p+=8),y=g[d&m];e:for(;;){if(d>>>=b=y>>>24,p-=b,0==(b=y>>>16&255))S[o++]=65535&y;else{if(!(16&b)){if(0==(64&b)){y=g[(65535&y)+(d&(1<<b)-1)];continue e;}if(32&b){n.mode=12;break t;}t.msg=\"invalid literal/length code\",n.mode=30;break t;}w=65535&y,(b&=15)&&(p<b&&(d+=E[r++]<<p,p+=8),w+=d&(1<<b)-1,d>>>=b,p-=b),p<15&&(d+=E[r++]<<p,p+=8,d+=E[r++]<<p,p+=8),y=_[d&v];n:for(;;){if(d>>>=b=y>>>24,p-=b,!(16&(b=y>>>16&255))){if(0==(64&b)){y=_[(65535&y)+(d&(1<<b)-1)];continue n;}t.msg=\"invalid distance code\",n.mode=30;break t;}if(x=65535&y,p<(b&=15)&&(d+=E[r++]<<p,(p+=8)<b&&(d+=E[r++]<<p,p+=8)),(x+=d&(1<<b)-1)>u){t.msg=\"invalid distance too far back\",n.mode=30;break t;}if(d>>>=b,p-=b,x>(b=o-s)){if((b=x-b)>h&&n.sane){t.msg=\"invalid distance too far back\",n.mode=30;break t;}if(k=0,A=f,0===c){if(k+=l-b,b<w){w-=b;do{S[o++]=f[k++];}while(--b);k=o-x,A=S;}}else if(c<b){if(k+=l+c-b,(b-=c)<w){w-=b;do{S[o++]=f[k++];}while(--b);if(k=0,c<w){w-=b=c;do{S[o++]=f[k++];}while(--b);k=o-x,A=S;}}}else if(k+=c-b,b<w){w-=b;do{S[o++]=f[k++];}while(--b);k=o-x,A=S;}for(;w>2;)S[o++]=A[k++],S[o++]=A[k++],S[o++]=A[k++],w-=3;w&&(S[o++]=A[k++],w>1&&(S[o++]=A[k++]));}else{k=o-x;do{S[o++]=S[k++],S[o++]=S[k++],S[o++]=S[k++],w-=3;}while(w>2);w&&(S[o++]=S[k++],w>1&&(S[o++]=S[k++]));}break;}}break;}}while(r<i&&o<a);r-=w=p>>3,d&=(1<<(p-=w<<3))-1,t.next_in=r,t.next_out=o,t.avail_in=r<i?i-r+5:5-(r-i),t.avail_out=o<a?a-o+257:257-(o-a),n.hold=d,n.bits=p;};},7948:function _(t,e,n){\"use strict\";var r=n(4236),i=n(6069),o=n(2869),s=n(4264),a=n(9241),u=0,l=-2,h=1,c=12,f=30,d=852,p=592;function g(t){return(t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24);}function _(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new r.Buf16(320),this.work=new r.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0;}function m(t){var e;return t&&t.state?(e=t.state,t.total_in=t.total_out=e.total=0,t.msg=\"\",e.wrap&&(t.adler=1&e.wrap),e.mode=h,e.last=0,e.havedict=0,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new r.Buf32(d),e.distcode=e.distdyn=new r.Buf32(p),e.sane=1,e.back=-1,u):l;}function v(t){var e;return t&&t.state?((e=t.state).wsize=0,e.whave=0,e.wnext=0,m(t)):l;}function y(t,e){var n,r;return t&&t.state?(r=t.state,e<0?(n=0,e=-e):(n=1+(e>>4),e<48&&(e&=15)),e&&(e<8||e>15)?l:(null!==r.window&&r.wbits!==e&&(r.window=null),r.wrap=n,r.wbits=e,v(t))):l;}function b(t,e){var n,r;return t?(r=new _(),t.state=r,r.window=null,(n=y(t,e))!==u&&(t.state=null),n):l;}var w,x,k=!0;function A(t){if(k){var e;for(w=new r.Buf32(512),x=new r.Buf32(32),e=0;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(a(1,t.lens,0,288,w,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;a(2,t.lens,0,32,x,0,t.work,{bits:5}),k=!1;}t.lencode=w,t.lenbits=9,t.distcode=x,t.distbits=5;}function E(t,e,n,i){var o,s=t.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new r.Buf8(s.wsize)),i>=s.wsize?(r.arraySet(s.window,e,n-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):((o=s.wsize-s.wnext)>i&&(o=i),r.arraySet(s.window,e,n-i,o,s.wnext),(i-=o)?(r.arraySet(s.window,e,n-i,i,0),s.wnext=i,s.whave=s.wsize):(s.wnext+=o,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=o))),0;}e.inflateReset=v,e.inflateReset2=y,e.inflateResetKeep=m,e.inflateInit=function(t){return b(t,15);},e.inflateInit2=b,e.inflate=function(t,e){var n,d,p,_,m,v,y,b,w,x,k,S,M,B,T,z,C,N,I,O,R,L,U,j,P=0,D=new r.Buf8(4),F=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!t||!t.state||!t.output||!t.input&&0!==t.avail_in)return l;(n=t.state).mode===c&&(n.mode=13),m=t.next_out,p=t.output,y=t.avail_out,_=t.next_in,d=t.input,v=t.avail_in,b=n.hold,w=n.bits,x=v,k=y,L=u;t:for(;;)switch(n.mode){case h:if(0===n.wrap){n.mode=13;break;}for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(2&n.wrap&&35615===b){n.check=0,D[0]=255&b,D[1]=b>>>8&255,n.check=o(n.check,D,2,0),b=0,w=0,n.mode=2;break;}if(n.flags=0,n.head&&(n.head.done=!1),!(1&n.wrap)||(((255&b)<<8)+(b>>8))%31){t.msg=\"incorrect header check\",n.mode=f;break;}if(8!=(15&b)){t.msg=\"unknown compression method\",n.mode=f;break;}if(w-=4,R=8+(15&(b>>>=4)),0===n.wbits)n.wbits=R;else if(R>n.wbits){t.msg=\"invalid window size\",n.mode=f;break;}n.dmax=1<<R,t.adler=n.check=1,n.mode=512&b?10:c,b=0,w=0;break;case 2:for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(n.flags=b,8!=(255&n.flags)){t.msg=\"unknown compression method\",n.mode=f;break;}if(57344&n.flags){t.msg=\"unknown header flags set\",n.mode=f;break;}n.head&&(n.head.text=b>>8&1),512&n.flags&&(D[0]=255&b,D[1]=b>>>8&255,n.check=o(n.check,D,2,0)),b=0,w=0,n.mode=3;case 3:for(;w<32;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.head&&(n.head.time=b),512&n.flags&&(D[0]=255&b,D[1]=b>>>8&255,D[2]=b>>>16&255,D[3]=b>>>24&255,n.check=o(n.check,D,4,0)),b=0,w=0,n.mode=4;case 4:for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.head&&(n.head.xflags=255&b,n.head.os=b>>8),512&n.flags&&(D[0]=255&b,D[1]=b>>>8&255,n.check=o(n.check,D,2,0)),b=0,w=0,n.mode=5;case 5:if(1024&n.flags){for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.length=b,n.head&&(n.head.extra_len=b),512&n.flags&&(D[0]=255&b,D[1]=b>>>8&255,n.check=o(n.check,D,2,0)),b=0,w=0;}else n.head&&(n.head.extra=null);n.mode=6;case 6:if(1024&n.flags&&((S=n.length)>v&&(S=v),S&&(n.head&&(R=n.head.extra_len-n.length,n.head.extra||(n.head.extra=new Array(n.head.extra_len)),r.arraySet(n.head.extra,d,_,S,R)),512&n.flags&&(n.check=o(n.check,d,S,_)),v-=S,_+=S,n.length-=S),n.length))break t;n.length=0,n.mode=7;case 7:if(2048&n.flags){if(0===v)break t;S=0;do{R=d[_+S++],n.head&&R&&n.length<65536&&(n.head.name+=String.fromCharCode(R));}while(R&&S<v);if(512&n.flags&&(n.check=o(n.check,d,S,_)),v-=S,_+=S,R)break t;}else n.head&&(n.head.name=null);n.length=0,n.mode=8;case 8:if(4096&n.flags){if(0===v)break t;S=0;do{R=d[_+S++],n.head&&R&&n.length<65536&&(n.head.comment+=String.fromCharCode(R));}while(R&&S<v);if(512&n.flags&&(n.check=o(n.check,d,S,_)),v-=S,_+=S,R)break t;}else n.head&&(n.head.comment=null);n.mode=9;case 9:if(512&n.flags){for(;w<16;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(b!==(65535&n.check)){t.msg=\"header crc mismatch\",n.mode=f;break;}b=0,w=0;}n.head&&(n.head.hcrc=n.flags>>9&1,n.head.done=!0),t.adler=n.check=0,n.mode=c;break;case 10:for(;w<32;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}t.adler=n.check=g(b),b=0,w=0,n.mode=11;case 11:if(0===n.havedict)return t.next_out=m,t.avail_out=y,t.next_in=_,t.avail_in=v,n.hold=b,n.bits=w,2;t.adler=n.check=1,n.mode=c;case c:if(5===e||6===e)break t;case 13:if(n.last){b>>>=7&w,w-=7&w,n.mode=27;break;}for(;w<3;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}switch(n.last=1&b,w-=1,3&(b>>>=1)){case 0:n.mode=14;break;case 1:if(A(n),n.mode=20,6===e){b>>>=2,w-=2;break t;}break;case 2:n.mode=17;break;case 3:t.msg=\"invalid block type\",n.mode=f;}b>>>=2,w-=2;break;case 14:for(b>>>=7&w,w-=7&w;w<32;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if((65535&b)!=(b>>>16^65535)){t.msg=\"invalid stored block lengths\",n.mode=f;break;}if(n.length=65535&b,b=0,w=0,n.mode=15,6===e)break t;case 15:n.mode=16;case 16:if(S=n.length){if(S>v&&(S=v),S>y&&(S=y),0===S)break t;r.arraySet(p,d,_,S,m),v-=S,_+=S,y-=S,m+=S,n.length-=S;break;}n.mode=c;break;case 17:for(;w<14;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(n.nlen=257+(31&b),b>>>=5,w-=5,n.ndist=1+(31&b),b>>>=5,w-=5,n.ncode=4+(15&b),b>>>=4,w-=4,n.nlen>286||n.ndist>30){t.msg=\"too many length or distance symbols\",n.mode=f;break;}n.have=0,n.mode=18;case 18:for(;n.have<n.ncode;){for(;w<3;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.lens[F[n.have++]]=7&b,b>>>=3,w-=3;}for(;n.have<19;)n.lens[F[n.have++]]=0;if(n.lencode=n.lendyn,n.lenbits=7,U={bits:n.lenbits},L=a(0,n.lens,0,19,n.lencode,0,n.work,U),n.lenbits=U.bits,L){t.msg=\"invalid code lengths set\",n.mode=f;break;}n.have=0,n.mode=19;case 19:for(;n.have<n.nlen+n.ndist;){for(;z=(P=n.lencode[b&(1<<n.lenbits)-1])>>>16&255,C=65535&P,!((T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(C<16)b>>>=T,w-=T,n.lens[n.have++]=C;else{if(16===C){for(j=T+2;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(b>>>=T,w-=T,0===n.have){t.msg=\"invalid bit length repeat\",n.mode=f;break;}R=n.lens[n.have-1],S=3+(3&b),b>>>=2,w-=2;}else if(17===C){for(j=T+3;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}w-=T,R=0,S=3+(7&(b>>>=T)),b>>>=3,w-=3;}else{for(j=T+7;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}w-=T,R=0,S=11+(127&(b>>>=T)),b>>>=7,w-=7;}if(n.have+S>n.nlen+n.ndist){t.msg=\"invalid bit length repeat\",n.mode=f;break;}for(;S--;)n.lens[n.have++]=R;}}if(n.mode===f)break;if(0===n.lens[256]){t.msg=\"invalid code -- missing end-of-block\",n.mode=f;break;}if(n.lenbits=9,U={bits:n.lenbits},L=a(1,n.lens,0,n.nlen,n.lencode,0,n.work,U),n.lenbits=U.bits,L){t.msg=\"invalid literal/lengths set\",n.mode=f;break;}if(n.distbits=6,n.distcode=n.distdyn,U={bits:n.distbits},L=a(2,n.lens,n.nlen,n.ndist,n.distcode,0,n.work,U),n.distbits=U.bits,L){t.msg=\"invalid distances set\",n.mode=f;break;}if(n.mode=20,6===e)break t;case 20:n.mode=21;case 21:if(v>=6&&y>=258){t.next_out=m,t.avail_out=y,t.next_in=_,t.avail_in=v,n.hold=b,n.bits=w,s(t,k),m=t.next_out,p=t.output,y=t.avail_out,_=t.next_in,d=t.input,v=t.avail_in,b=n.hold,w=n.bits,n.mode===c&&(n.back=-1);break;}for(n.back=0;z=(P=n.lencode[b&(1<<n.lenbits)-1])>>>16&255,C=65535&P,!((T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(z&&0==(240&z)){for(N=T,I=z,O=C;z=(P=n.lencode[O+((b&(1<<N+I)-1)>>N)])>>>16&255,C=65535&P,!(N+(T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}b>>>=N,w-=N,n.back+=N;}if(b>>>=T,w-=T,n.back+=T,n.length=C,0===z){n.mode=26;break;}if(32&z){n.back=-1,n.mode=c;break;}if(64&z){t.msg=\"invalid literal/length code\",n.mode=f;break;}n.extra=15&z,n.mode=22;case 22:if(n.extra){for(j=n.extra;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.length+=b&(1<<n.extra)-1,b>>>=n.extra,w-=n.extra,n.back+=n.extra;}n.was=n.length,n.mode=23;case 23:for(;z=(P=n.distcode[b&(1<<n.distbits)-1])>>>16&255,C=65535&P,!((T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(0==(240&z)){for(N=T,I=z,O=C;z=(P=n.distcode[O+((b&(1<<N+I)-1)>>N)])>>>16&255,C=65535&P,!(N+(T=P>>>24)<=w);){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}b>>>=N,w-=N,n.back+=N;}if(b>>>=T,w-=T,n.back+=T,64&z){t.msg=\"invalid distance code\",n.mode=f;break;}n.offset=C,n.extra=15&z,n.mode=24;case 24:if(n.extra){for(j=n.extra;w<j;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}n.offset+=b&(1<<n.extra)-1,b>>>=n.extra,w-=n.extra,n.back+=n.extra;}if(n.offset>n.dmax){t.msg=\"invalid distance too far back\",n.mode=f;break;}n.mode=25;case 25:if(0===y)break t;if(S=k-y,n.offset>S){if((S=n.offset-S)>n.whave&&n.sane){t.msg=\"invalid distance too far back\",n.mode=f;break;}S>n.wnext?(S-=n.wnext,M=n.wsize-S):M=n.wnext-S,S>n.length&&(S=n.length),B=n.window;}else B=p,M=m-n.offset,S=n.length;S>y&&(S=y),y-=S,n.length-=S;do{p[m++]=B[M++];}while(--S);0===n.length&&(n.mode=21);break;case 26:if(0===y)break t;p[m++]=n.length,y--,n.mode=21;break;case 27:if(n.wrap){for(;w<32;){if(0===v)break t;v--,b|=d[_++]<<w,w+=8;}if(k-=y,t.total_out+=k,n.total+=k,k&&(t.adler=n.check=n.flags?o(n.check,p,k,m-k):i(n.check,p,k,m-k)),k=y,(n.flags?b:g(b))!==n.check){t.msg=\"incorrect data check\",n.mode=f;break;}b=0,w=0;}n.mode=28;case 28:if(n.wrap&&n.flags){for(;w<32;){if(0===v)break t;v--,b+=d[_++]<<w,w+=8;}if(b!==(4294967295&n.total)){t.msg=\"incorrect length check\",n.mode=f;break;}b=0,w=0;}n.mode=29;case 29:L=1;break t;case f:L=-3;break t;case 31:return-4;default:return l;}return t.next_out=m,t.avail_out=y,t.next_in=_,t.avail_in=v,n.hold=b,n.bits=w,(n.wsize||k!==t.avail_out&&n.mode<f&&(n.mode<27||4!==e))&&E(t,t.output,t.next_out,k-t.avail_out)?(n.mode=31,-4):(x-=t.avail_in,k-=t.avail_out,t.total_in+=x,t.total_out+=k,n.total+=k,n.wrap&&k&&(t.adler=n.check=n.flags?o(n.check,p,k,t.next_out-k):i(n.check,p,k,t.next_out-k)),t.data_type=n.bits+(n.last?64:0)+(n.mode===c?128:0)+(20===n.mode||15===n.mode?256:0),(0===x&&0===k||4===e)&&L===u&&(L=-5),L);},e.inflateEnd=function(t){if(!t||!t.state)return l;var e=t.state;return e.window&&(e.window=null),t.state=null,u;},e.inflateGetHeader=function(t,e){var n;return t&&t.state?0==(2&(n=t.state).wrap)?l:(n.head=e,e.done=!1,u):l;},e.inflateSetDictionary=function(t,e){var n,r=e.length;return t&&t.state?0!==(n=t.state).wrap&&11!==n.mode?l:11===n.mode&&i(1,e,r,0)!==n.check?-3:E(t,e,r,r)?(n.mode=31,-4):(n.havedict=1,u):l;},e.inflateInfo=\"pako inflate (from Nodeca project)\";},9241:function _(t,e,n){\"use strict\";var r=n(4236),i=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],o=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],s=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],a=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(t,e,n,u,l,h,c,f){var d,p,g,_,m,v,y,b,w,x=f.bits,k=0,A=0,E=0,S=0,M=0,B=0,T=0,z=0,C=0,N=0,I=null,O=0,R=new r.Buf16(16),L=new r.Buf16(16),U=null,j=0;for(k=0;k<=15;k++)R[k]=0;for(A=0;A<u;A++)R[e[n+A]]++;for(M=x,S=15;S>=1&&0===R[S];S--);if(M>S&&(M=S),0===S)return l[h++]=20971520,l[h++]=20971520,f.bits=1,0;for(E=1;E<S&&0===R[E];E++);for(M<E&&(M=E),z=1,k=1;k<=15;k++)if(z<<=1,(z-=R[k])<0)return-1;if(z>0&&(0===t||1!==S))return-1;for(L[1]=0,k=1;k<15;k++)L[k+1]=L[k]+R[k];for(A=0;A<u;A++)0!==e[n+A]&&(c[L[e[n+A]]++]=A);if(0===t?(I=U=c,v=19):1===t?(I=i,O-=257,U=o,j-=257,v=256):(I=s,U=a,v=-1),N=0,A=0,k=E,m=h,B=M,T=0,g=-1,_=(C=1<<M)-1,1===t&&C>852||2===t&&C>592)return 1;for(;;){y=k-T,c[A]<v?(b=0,w=c[A]):c[A]>v?(b=U[j+c[A]],w=I[O+c[A]]):(b=96,w=0),d=1<<k-T,E=p=1<<B;do{l[m+(N>>T)+(p-=d)]=y<<24|b<<16|w|0;}while(0!==p);for(d=1<<k-1;N&d;)d>>=1;if(0!==d?(N&=d-1,N+=d):N=0,A++,0==--R[k]){if(k===S)break;k=e[n+c[A]];}if(k>M&&(N&_)!==g){for(0===T&&(T=M),m+=E,z=1<<(B=k-T);B+T<S&&!((z-=R[B+T])<=0);)B++,z<<=1;if(C+=1<<B,1===t&&C>852||2===t&&C>592)return 1;l[g=N&_]=M<<24|B<<16|m-h|0;}}return 0!==N&&(l[m+N]=k-T<<24|64<<16|0),f.bits=M,0;};},8898:function _(t){\"use strict\";t.exports={2:\"need dictionary\",1:\"stream end\",0:\"\",\"-1\":\"file error\",\"-2\":\"stream error\",\"-3\":\"data error\",\"-4\":\"insufficient memory\",\"-5\":\"buffer error\",\"-6\":\"incompatible version\"};},342:function _(t,e,n){\"use strict\";var r=n(4236);function i(t){for(var e=t.length;--e>=0;)t[e]=0;}var o=256,s=286,a=30,u=15,l=16,h=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],c=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],f=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],d=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],p=new Array(576);i(p);var g=new Array(60);i(g);var _=new Array(512);i(_);var m=new Array(256);i(m);var v=new Array(29);i(v);var y,b,w,x=new Array(a);function k(t,e,n,r,i){this.static_tree=t,this.extra_bits=e,this.extra_base=n,this.elems=r,this.max_length=i,this.has_stree=t&&t.length;}function A(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e;}function E(t){return t<256?_[t]:_[256+(t>>>7)];}function S(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255;}function M(t,e,n){t.bi_valid>l-n?(t.bi_buf|=e<<t.bi_valid&65535,S(t,t.bi_buf),t.bi_buf=e>>l-t.bi_valid,t.bi_valid+=n-l):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=n);}function B(t,e,n){M(t,n[2*e],n[2*e+1]);}function T(t,e){var n=0;do{n|=1&t,t>>>=1,n<<=1;}while(--e>0);return n>>>1;}function z(t,e,n){var r,i,o=new Array(u+1),s=0;for(r=1;r<=u;r++)o[r]=s=s+n[r-1]<<1;for(i=0;i<=e;i++){var a=t[2*i+1];0!==a&&(t[2*i]=T(o[a]++,a));}}function C(t){var e;for(e=0;e<s;e++)t.dyn_ltree[2*e]=0;for(e=0;e<a;e++)t.dyn_dtree[2*e]=0;for(e=0;e<19;e++)t.bl_tree[2*e]=0;t.dyn_ltree[512]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0;}function N(t){t.bi_valid>8?S(t,t.bi_buf):t.bi_valid>0&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0;}function I(t,e,n,r){var i=2*e,o=2*n;return t[i]<t[o]||t[i]===t[o]&&r[e]<=r[n];}function O(t,e,n){for(var r=t.heap[n],i=n<<1;i<=t.heap_len&&(i<t.heap_len&&I(e,t.heap[i+1],t.heap[i],t.depth)&&i++,!I(e,r,t.heap[i],t.depth));)t.heap[n]=t.heap[i],n=i,i<<=1;t.heap[n]=r;}function R(t,e,n){var r,i,s,a,u=0;if(0!==t.last_lit)do{r=t.pending_buf[t.d_buf+2*u]<<8|t.pending_buf[t.d_buf+2*u+1],i=t.pending_buf[t.l_buf+u],u++,0===r?B(t,i,e):(B(t,(s=m[i])+o+1,e),0!==(a=h[s])&&M(t,i-=v[s],a),B(t,s=E(--r),n),0!==(a=c[s])&&M(t,r-=x[s],a));}while(u<t.last_lit);B(t,256,e);}function L(t,e){var n,r,i,o=e.dyn_tree,s=e.stat_desc.static_tree,a=e.stat_desc.has_stree,l=e.stat_desc.elems,h=-1;for(t.heap_len=0,t.heap_max=573,n=0;n<l;n++)0!==o[2*n]?(t.heap[++t.heap_len]=h=n,t.depth[n]=0):o[2*n+1]=0;for(;t.heap_len<2;)o[2*(i=t.heap[++t.heap_len]=h<2?++h:0)]=1,t.depth[i]=0,t.opt_len--,a&&(t.static_len-=s[2*i+1]);for(e.max_code=h,n=t.heap_len>>1;n>=1;n--)O(t,o,n);i=l;do{n=t.heap[1],t.heap[1]=t.heap[t.heap_len--],O(t,o,1),r=t.heap[1],t.heap[--t.heap_max]=n,t.heap[--t.heap_max]=r,o[2*i]=o[2*n]+o[2*r],t.depth[i]=(t.depth[n]>=t.depth[r]?t.depth[n]:t.depth[r])+1,o[2*n+1]=o[2*r+1]=i,t.heap[1]=i++,O(t,o,1);}while(t.heap_len>=2);t.heap[--t.heap_max]=t.heap[1],function(t,e){var n,r,i,o,s,a,l=e.dyn_tree,h=e.max_code,c=e.stat_desc.static_tree,f=e.stat_desc.has_stree,d=e.stat_desc.extra_bits,p=e.stat_desc.extra_base,g=e.stat_desc.max_length,_=0;for(o=0;o<=u;o++)t.bl_count[o]=0;for(l[2*t.heap[t.heap_max]+1]=0,n=t.heap_max+1;n<573;n++)(o=l[2*l[2*(r=t.heap[n])+1]+1]+1)>g&&(o=g,_++),l[2*r+1]=o,r>h||(t.bl_count[o]++,s=0,r>=p&&(s=d[r-p]),a=l[2*r],t.opt_len+=a*(o+s),f&&(t.static_len+=a*(c[2*r+1]+s)));if(0!==_){do{for(o=g-1;0===t.bl_count[o];)o--;t.bl_count[o]--,t.bl_count[o+1]+=2,t.bl_count[g]--,_-=2;}while(_>0);for(o=g;0!==o;o--)for(r=t.bl_count[o];0!==r;)(i=t.heap[--n])>h||(l[2*i+1]!==o&&(t.opt_len+=(o-l[2*i+1])*l[2*i],l[2*i+1]=o),r--);}}(t,e),z(o,h,t.bl_count);}function U(t,e,n){var r,i,o=-1,s=e[1],a=0,u=7,l=4;for(0===s&&(u=138,l=3),e[2*(n+1)+1]=65535,r=0;r<=n;r++)i=s,s=e[2*(r+1)+1],++a<u&&i===s||(a<l?t.bl_tree[2*i]+=a:0!==i?(i!==o&&t.bl_tree[2*i]++,t.bl_tree[32]++):a<=10?t.bl_tree[34]++:t.bl_tree[36]++,a=0,o=i,0===s?(u=138,l=3):i===s?(u=6,l=3):(u=7,l=4));}function j(t,e,n){var r,i,o=-1,s=e[1],a=0,u=7,l=4;for(0===s&&(u=138,l=3),r=0;r<=n;r++)if(i=s,s=e[2*(r+1)+1],!(++a<u&&i===s)){if(a<l)do{B(t,i,t.bl_tree);}while(0!=--a);else 0!==i?(i!==o&&(B(t,i,t.bl_tree),a--),B(t,16,t.bl_tree),M(t,a-3,2)):a<=10?(B(t,17,t.bl_tree),M(t,a-3,3)):(B(t,18,t.bl_tree),M(t,a-11,7));a=0,o=i,0===s?(u=138,l=3):i===s?(u=6,l=3):(u=7,l=4);}}i(x);var P=!1;function D(t,e,n,i){M(t,0+(i?1:0),3),function(t,e,n,i){N(t),S(t,n),S(t,~n),r.arraySet(t.pending_buf,t.window,e,n,t.pending),t.pending+=n;}(t,e,n);}e._tr_init=function(t){P||(function(){var t,e,n,r,i,o=new Array(u+1);for(n=0,r=0;r<28;r++)for(v[r]=n,t=0;t<1<<h[r];t++)m[n++]=r;for(m[n-1]=r,i=0,r=0;r<16;r++)for(x[r]=i,t=0;t<1<<c[r];t++)_[i++]=r;for(i>>=7;r<a;r++)for(x[r]=i<<7,t=0;t<1<<c[r]-7;t++)_[256+i++]=r;for(e=0;e<=u;e++)o[e]=0;for(t=0;t<=143;)p[2*t+1]=8,t++,o[8]++;for(;t<=255;)p[2*t+1]=9,t++,o[9]++;for(;t<=279;)p[2*t+1]=7,t++,o[7]++;for(;t<=287;)p[2*t+1]=8,t++,o[8]++;for(z(p,287,o),t=0;t<a;t++)g[2*t+1]=5,g[2*t]=T(t,5);y=new k(p,h,257,s,u),b=new k(g,c,0,a,u),w=new k(new Array(0),f,0,19,7);}(),P=!0),t.l_desc=new A(t.dyn_ltree,y),t.d_desc=new A(t.dyn_dtree,b),t.bl_desc=new A(t.bl_tree,w),t.bi_buf=0,t.bi_valid=0,C(t);},e._tr_stored_block=D,e._tr_flush_block=function(t,e,n,r){var i,s,a=0;t.level>0?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,n=4093624447;for(e=0;e<=31;e++,n>>>=1)if(1&n&&0!==t.dyn_ltree[2*e])return 0;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return 1;for(e=32;e<o;e++)if(0!==t.dyn_ltree[2*e])return 1;return 0;}(t)),L(t,t.l_desc),L(t,t.d_desc),a=function(t){var e;for(U(t,t.dyn_ltree,t.l_desc.max_code),U(t,t.dyn_dtree,t.d_desc.max_code),L(t,t.bl_desc),e=18;e>=3&&0===t.bl_tree[2*d[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e;}(t),i=t.opt_len+3+7>>>3,(s=t.static_len+3+7>>>3)<=i&&(i=s)):i=s=n+5,n+4<=i&&-1!==e?D(t,e,n,r):4===t.strategy||s===i?(M(t,2+(r?1:0),3),R(t,p,g)):(M(t,4+(r?1:0),3),function(t,e,n,r){var i;for(M(t,e-257,5),M(t,n-1,5),M(t,r-4,4),i=0;i<r;i++)M(t,t.bl_tree[2*d[i]+1],3);j(t,t.dyn_ltree,e-1),j(t,t.dyn_dtree,n-1);}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,a+1),R(t,t.dyn_ltree,t.dyn_dtree)),C(t),r&&N(t);},e._tr_tally=function(t,e,n){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&n,t.last_lit++,0===e?t.dyn_ltree[2*n]++:(t.matches++,e--,t.dyn_ltree[2*(m[n]+o+1)]++,t.dyn_dtree[2*E(e)]++),t.last_lit===t.lit_bufsize-1;},e._tr_align=function(t){M(t,2,3),B(t,256,p),function(t){16===t.bi_valid?(S(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):t.bi_valid>=8&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8);}(t);};},2292:function _(t){\"use strict\";t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg=\"\",this.state=null,this.data_type=2,this.adler=0;};},2467:function _(t,e,n){\"use strict\";Object.defineProperty(e,\"__esModule\",{value:!0}),e.serialize=e.deserialize=e.registerSerializer=void 0;var r=n(7381);var i=r.DefaultSerializer;e.registerSerializer=function(t){i=r.extendSerializer(i,t);},e.deserialize=function(t){return i.deserialize(t);},e.serialize=function(t){return i.serialize(t);};},7381:function _(t,e){\"use strict\";Object.defineProperty(e,\"__esModule\",{value:!0}),e.DefaultSerializer=e.extendSerializer=void 0,e.extendSerializer=function(t,e){var n=t.deserialize.bind(t),r=t.serialize.bind(t);return{deserialize:function deserialize(t){return e.deserialize(t,n);},serialize:function serialize(t){return e.serialize(t,r);}};};var n=function n(t){return Object.assign(Error(t.message),{name:t.name,stack:t.stack});},r=function r(t){return{__error_marker:\"$$error\",message:t.message,name:t.name,stack:t.stack};};e.DefaultSerializer={deserialize:function deserialize(t){return(e=t)&&\"object\"==_typeof(e)&&\"__error_marker\"in e&&\"$$error\"===e.__error_marker?n(t):t;var e;},serialize:function serialize(t){return t instanceof Error?r(t):t;}};},8258:function _(t,e){\"use strict\";Object.defineProperty(e,\"__esModule\",{value:!0}),e.$worker=e.$transferable=e.$terminate=e.$events=e.$errors=void 0,e.$errors=Symbol(\"thread.errors\"),e.$events=Symbol(\"thread.events\"),e.$terminate=Symbol(\"thread.terminate\"),e.$transferable=Symbol(\"thread.transferable\"),e.$worker=Symbol(\"thread.worker\");},8180:function _(t,e,n){\"use strict\";Object.defineProperty(e,\"__esModule\",{value:!0}),e.Transfer=e.isTransferDescriptor=void 0;var r=n(8258);e.isTransferDescriptor=function(t){return t&&\"object\"==_typeof(t)&&t[r.$transferable];},e.Transfer=function(t,e){if(!e){if(!(n=t)||\"object\"!=_typeof(n))throw Error();e=[t];}var n;return _defineProperty(_defineProperty(_defineProperty({},r.$transferable,!0),\"send\",t),\"transferables\",e);};},3229:function _(t,e){\"use strict\";var n,r;Object.defineProperty(e,\"__esModule\",{value:!0}),e.WorkerMessageType=e.MasterMessageType=void 0,(r=e.MasterMessageType||(e.MasterMessageType={})).cancel=\"cancel\",r.run=\"run\",(n=e.WorkerMessageType||(e.WorkerMessageType={})).error=\"error\",n.init=\"init\",n.result=\"result\",n.running=\"running\",n.uncaughtError=\"uncaughtError\";},3447:function _(t,e){\"use strict\";Object.defineProperty(e,\"__esModule\",{value:!0}),e[\"default\"]={isWorkerRuntime:function isWorkerRuntime(){var t=\"undefined\"!=typeof self&&\"undefined\"!=typeof Window&&self instanceof Window;return!(\"undefined\"==typeof self||!self.postMessage||t);},postMessageToMaster:function postMessageToMaster(t,e){self.postMessage(t,e);},subscribeToMasterMessages:function subscribeToMasterMessages(t){var e=function e(_e25){t(_e25.data);};return self.addEventListener(\"message\",e),function(){self.removeEventListener(\"message\",e);};}};},1934:function _(t,e,n){\"use strict\";var r=this&&this.__awaiter||function(t,e,n,r){return new(n||(n=Promise))(function(i,o){function s(t){try{u(r.next(t));}catch(t){o(t);}}function a(t){try{u(r[\"throw\"](t));}catch(t){o(t);}}function u(t){var e;t.done?i(t.value):(e=t.value,e instanceof n?e:new n(function(t){t(e);})).then(s,a);}u((r=r.apply(t,e||[])).next());});},i=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{\"default\":t};};Object.defineProperty(e,\"__esModule\",{value:!0}),e.expose=e.isWorkerRuntime=e.Transfer=e.registerSerializer=void 0;var o=i(n(6898)),s=n(2467),a=n(8180),u=n(3229),l=i(n(3447));var h=n(2467);Object.defineProperty(e,\"registerSerializer\",{enumerable:!0,get:function get(){return h.registerSerializer;}});var c=n(8180);Object.defineProperty(e,\"Transfer\",{enumerable:!0,get:function get(){return c.Transfer;}}),e.isWorkerRuntime=l[\"default\"].isWorkerRuntime;var f=!1;var d=new Map(),p=function p(t){return t&&t.type===u.MasterMessageType.run;},g=function g(t){return o[\"default\"](t)||function(t){return t&&\"object\"==_typeof(t)&&\"function\"==typeof t.subscribe;}(t);};function _(t){return a.isTransferDescriptor(t)?{payload:t.send,transferables:t.transferables}:{payload:t,transferables:void 0};}function m(t,e){var _ref16=_(e),n=_ref16.payload,r=_ref16.transferables,i={type:u.WorkerMessageType.error,uid:t,error:s.serialize(n)};l[\"default\"].postMessageToMaster(i,r);}function v(t,e,n){var _ref17=_(n),r=_ref17.payload,i=_ref17.transferables,o={type:u.WorkerMessageType.result,uid:t,complete:!!e||void 0,payload:r};l[\"default\"].postMessageToMaster(o,i);}function y(t){try{var _e26={type:u.WorkerMessageType.uncaughtError,error:s.serialize(t)};l[\"default\"].postMessageToMaster(_e26);}catch(e){console.error(\"Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\\nLatest error:\",e,\"\\nOriginal error:\",t);}}function b(t,e,n){return r(this,void 0,void 0,/*#__PURE__*/_regeneratorRuntime().mark(function _callee27(){var r,i,_e27,_e28;return _regeneratorRuntime().wrap(function _callee27$(_context30){while(1)switch(_context30.prev=_context30.next){case 0:_context30.prev=0;r=e.apply(void 0,_toConsumableArray(n));_context30.next=7;break;case 4:_context30.prev=4;_context30.t0=_context30[\"catch\"](0);return _context30.abrupt(\"return\",m(t,_context30.t0));case 7:i=g(r)?\"observable\":\"promise\";if(!(function(t,e){var n={type:u.WorkerMessageType.running,uid:t,resultType:e};l[\"default\"].postMessageToMaster(n);}(t,i),g(r))){_context30.next=13;break;}_e27=r.subscribe(function(e){return v(t,!1,s.serialize(e));},function(e){m(t,s.serialize(e)),d[\"delete\"](t);},function(){v(t,!0),d[\"delete\"](t);});d.set(t,_e27);_context30.next=23;break;case 13:_context30.prev=13;_context30.next=16;return r;case 16:_e28=_context30.sent;v(t,!0,s.serialize(_e28));_context30.next=23;break;case 20:_context30.prev=20;_context30.t1=_context30[\"catch\"](13);m(t,s.serialize(_context30.t1));case 23:case\"end\":return _context30.stop();}},_callee27,null,[[0,4],[13,20]]);}));}e.expose=function(t){if(!l[\"default\"].isWorkerRuntime())throw Error(\"expose() called in the master thread.\");if(f)throw Error(\"expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.\");if(f=!0,\"function\"==typeof t)l[\"default\"].subscribeToMasterMessages(function(e){p(e)&&!e.method&&b(e.uid,t,e.args.map(s.deserialize));}),function(){var t={type:u.WorkerMessageType.init,exposed:{type:\"function\"}};l[\"default\"].postMessageToMaster(t);}();else{if(\"object\"!=_typeof(t)||!t)throw Error(\"Invalid argument passed to expose(). Expected a function or an object, got: \".concat(t));l[\"default\"].subscribeToMasterMessages(function(e){p(e)&&e.method&&b(e.uid,t[e.method],e.args.map(s.deserialize));}),function(t){var e={type:u.WorkerMessageType.init,exposed:{type:\"module\",methods:t}};l[\"default\"].postMessageToMaster(e);}(Object.keys(t).filter(function(e){return\"function\"==typeof t[e];}));}l[\"default\"].subscribeToMasterMessages(function(t){if((e=t)&&e.type===u.MasterMessageType.cancel){var _e29=t.uid,_n17=d.get(_e29);_n17&&(_n17.unsubscribe(),d[\"delete\"](_e29));}var e;});},\"undefined\"!=typeof self&&\"function\"==typeof self.addEventListener&&l[\"default\"].isWorkerRuntime()&&(self.addEventListener(\"error\",function(t){setTimeout(function(){return y(t.error||t);},250);}),self.addEventListener(\"unhandledrejection\",function(t){var e=t.reason;e&&\"string\"==typeof e.message&&setTimeout(function(){return y(e);},250);})),\"undefined\"!=typeof process&&\"function\"==typeof process.on&&l[\"default\"].isWorkerRuntime()&&(process.on(\"uncaughtException\",function(t){setTimeout(function(){return y(t);},250);}),process.on(\"unhandledRejection\",function(t){t&&\"string\"==typeof t.message&&setTimeout(function(){return y(t);},250);}));},9602:function _(t){\"use strict\";t.exports=function(t){t.prototype[Symbol.iterator]=/*#__PURE__*/_regeneratorRuntime().mark(function _callee28(){var _t16;return _regeneratorRuntime().wrap(function _callee28$(_context31){while(1)switch(_context31.prev=_context31.next){case 0:_t16=this.head;case 1:if(!_t16){_context31.next=7;break;}_context31.next=4;return _t16.value;case 4:_t16=_t16.next;_context31.next=1;break;case 7:case\"end\":return _context31.stop();}},_callee28,this);});};},4411:function _(t,e,n){\"use strict\";function r(t){var e=this;if(e instanceof r||(e=new r()),e.tail=null,e.head=null,e.length=0,t&&\"function\"==typeof t.forEach)t.forEach(function(t){e.push(t);});else if(arguments.length>0)for(var n=0,i=arguments.length;n<i;n++)e.push(arguments[n]);return e;}function i(t,e,n){var r=e===t.head?new a(n,null,e,t):new a(n,e,e.next,t);return null===r.next&&(t.tail=r),null===r.prev&&(t.head=r),t.length++,r;}function o(t,e){t.tail=new a(e,t.tail,null,t),t.head||(t.head=t.tail),t.length++;}function s(t,e){t.head=new a(e,null,t.head,t),t.tail||(t.tail=t.head),t.length++;}function a(t,e,n,r){if(!(this instanceof a))return new a(t,e,n,r);this.list=r,this.value=t,e?(e.next=this,this.prev=e):this.prev=null,n?(n.prev=this,this.next=n):this.next=null;}t.exports=r,r.Node=a,r.create=r,r.prototype.removeNode=function(t){if(t.list!==this)throw new Error(\"removing node which does not belong to this list\");var e=t.next,n=t.prev;return e&&(e.prev=n),n&&(n.next=e),t===this.head&&(this.head=e),t===this.tail&&(this.tail=n),t.list.length--,t.next=null,t.prev=null,t.list=null,e;},r.prototype.unshiftNode=function(t){if(t!==this.head){t.list&&t.list.removeNode(t);var e=this.head;t.list=this,t.next=e,e&&(e.prev=t),this.head=t,this.tail||(this.tail=t),this.length++;}},r.prototype.pushNode=function(t){if(t!==this.tail){t.list&&t.list.removeNode(t);var e=this.tail;t.list=this,t.prev=e,e&&(e.next=t),this.tail=t,this.head||(this.head=t),this.length++;}},r.prototype.push=function(){for(var t=0,e=arguments.length;t<e;t++)o(this,arguments[t]);return this.length;},r.prototype.unshift=function(){for(var t=0,e=arguments.length;t<e;t++)s(this,arguments[t]);return this.length;},r.prototype.pop=function(){if(this.tail){var t=this.tail.value;return this.tail=this.tail.prev,this.tail?this.tail.next=null:this.head=null,this.length--,t;}},r.prototype.shift=function(){if(this.head){var t=this.head.value;return this.head=this.head.next,this.head?this.head.prev=null:this.tail=null,this.length--,t;}},r.prototype.forEach=function(t,e){e=e||this;for(var n=this.head,r=0;null!==n;r++)t.call(e,n.value,r,this),n=n.next;},r.prototype.forEachReverse=function(t,e){e=e||this;for(var n=this.tail,r=this.length-1;null!==n;r--)t.call(e,n.value,r,this),n=n.prev;},r.prototype.get=function(t){for(var e=0,n=this.head;null!==n&&e<t;e++)n=n.next;if(e===t&&null!==n)return n.value;},r.prototype.getReverse=function(t){for(var e=0,n=this.tail;null!==n&&e<t;e++)n=n.prev;if(e===t&&null!==n)return n.value;},r.prototype.map=function(t,e){e=e||this;for(var n=new r(),i=this.head;null!==i;)n.push(t.call(e,i.value,this)),i=i.next;return n;},r.prototype.mapReverse=function(t,e){e=e||this;for(var n=new r(),i=this.tail;null!==i;)n.push(t.call(e,i.value,this)),i=i.prev;return n;},r.prototype.reduce=function(t,e){var n,r=this.head;if(arguments.length>1)n=e;else{if(!this.head)throw new TypeError(\"Reduce of empty list with no initial value\");r=this.head.next,n=this.head.value;}for(var i=0;null!==r;i++)n=t(n,r.value,i),r=r.next;return n;},r.prototype.reduceReverse=function(t,e){var n,r=this.tail;if(arguments.length>1)n=e;else{if(!this.tail)throw new TypeError(\"Reduce of empty list with no initial value\");r=this.tail.prev,n=this.tail.value;}for(var i=this.length-1;null!==r;i--)n=t(n,r.value,i),r=r.prev;return n;},r.prototype.toArray=function(){for(var t=new Array(this.length),e=0,n=this.head;null!==n;e++)t[e]=n.value,n=n.next;return t;},r.prototype.toArrayReverse=function(){for(var t=new Array(this.length),e=0,n=this.tail;null!==n;e++)t[e]=n.value,n=n.prev;return t;},r.prototype.slice=function(t,e){(e=e||this.length)<0&&(e+=this.length),(t=t||0)<0&&(t+=this.length);var n=new r();if(e<t||e<0)return n;t<0&&(t=0),e>this.length&&(e=this.length);for(var i=0,o=this.head;null!==o&&i<t;i++)o=o.next;for(;null!==o&&i<e;i++,o=o.next)n.push(o.value);return n;},r.prototype.sliceReverse=function(t,e){(e=e||this.length)<0&&(e+=this.length),(t=t||0)<0&&(t+=this.length);var n=new r();if(e<t||e<0)return n;t<0&&(t=0),e>this.length&&(e=this.length);for(var i=this.length,o=this.tail;null!==o&&i>e;i--)o=o.prev;for(;null!==o&&i>t;i--,o=o.prev)n.push(o.value);return n;},r.prototype.splice=function(t,e){t>this.length&&(t=this.length-1),t<0&&(t=this.length+t);for(var r=0,o=this.head;null!==o&&r<t;r++)o=o.next;var s=[];for(r=0;o&&r<e;r++)s.push(o.value),o=this.removeNode(o);for(null===o&&(o=this.tail),o!==this.head&&o!==this.tail&&(o=o.prev),r=0;r<(arguments.length<=2?0:arguments.length-2);r++)o=i(this,o,r+2<2||arguments.length<=r+2?undefined:arguments[r+2]);return s;},r.prototype.reverse=function(){for(var t=this.head,e=this.tail,n=t;null!==n;n=n.prev){var r=n.prev;n.prev=n.next,n.next=r;}return this.head=e,this.tail=t,this;};try{n(9602)(r);}catch(t){}},1334:function _(){},7067:function _(){}},e={};function n(r){var i=e[r];if(void 0!==i)return i.exports;var o=e[r]={id:r,loaded:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.loaded=!0,o.exports;}n.n=function(t){var e=t&&t.__esModule?function(){return t[\"default\"];}:function(){return t;};return n.d(e,{a:e}),e;},n.d=function(t,e){for(var r in e)n.o(e,r)&&!n.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:e[r]});},n.g=function(){if(\"object\"==(typeof globalThis===\"undefined\"?\"undefined\":_typeof(globalThis)))return globalThis;try{return this||new Function(\"return this\")();}catch(t){if(\"object\"==(typeof window===\"undefined\"?\"undefined\":_typeof(window)))return window;}}(),n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e);},n.r=function(t){\"undefined\"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:\"Module\"}),Object.defineProperty(t,\"__esModule\",{value:!0});},n.nmd=function(t){return t.paths=[],t.children||(t.children=[]),t;},function(){\"use strict\";var t={};n.r(t),n.d(t,{VERSION:function VERSION(){return bu;},after:function after(){return Xh;},all:function all(){return _c;},allKeys:function allKeys(){return Nl;},any:function any(){return mc;},assign:function assign(){return Xl;},before:function before(){return Kh;},bind:function bind(){return jh;},bindAll:function bindAll(){return Fh;},chain:function chain(){return Oh;},chunk:function chunk(){return Qc;},clone:function clone(){return th;},collect:function collect(){return hc;},compact:function compact(){return $c;},compose:function compose(){return Vh;},constant:function constant(){return pl;},contains:function contains(){return vc;},countBy:function countBy(){return Nc;},create:function create(){return Ql;},debounce:function debounce(){return Wh;},\"default\":function _default(){return nf;},defaults:function defaults(){return Kl;},defer:function defer(){return qh;},delay:function delay(){return Hh;},detect:function detect(){return ac;},difference:function difference(){return qc;},drop:function drop(){return Dc;},each:function each(){return lc;},escape:function escape(){return xh;},every:function every(){return _c;},extend:function extend(){return Vl;},extendOwn:function extendOwn(){return Xl;},filter:function filter(){return pc;},find:function find(){return ac;},findIndex:function findIndex(){return ec;},findKey:function findKey(){return Qh;},findLastIndex:function findLastIndex(){return nc;},findWhere:function findWhere(){return uc;},first:function first(){return Pc;},flatten:function flatten(){return Hc;},foldl:function foldl(){return fc;},foldr:function foldr(){return dc;},forEach:function forEach(){return lc;},functions:function functions(){return Gl;},get:function get(){return oh;},groupBy:function groupBy(){return zc;},has:function has(){return sh;},head:function head(){return Pc;},identity:function identity(){return ah;},include:function include(){return vc;},includes:function includes(){return vc;},indexBy:function indexBy(){return Cc;},indexOf:function indexOf(){return oc;},initial:function initial(){return jc;},inject:function inject(){return fc;},intersection:function intersection(){return Yc;},invert:function invert(){return Wl;},invoke:function invoke(){return yc;},isArguments:function isArguments(){return cl;},isArray:function isArray(){return ul;},isArrayBuffer:function isArrayBuffer(){return Qu;},isBoolean:function isBoolean(){return qu;},isDataView:function isDataView(){return al;},isDate:function isDate(){return Vu;},isElement:function isElement(){return Zu;},isEmpty:function isEmpty(){return Al;},isEqual:function isEqual(){return Cl;},isError:function isError(){return Ku;},isFinite:function isFinite(){return fl;},isFunction:function isFunction(){return nl;},isMap:function isMap(){return Dl;},isMatch:function isMatch(){return El;},isNaN:function isNaN(){return dl;},isNull:function isNull(){return $u;},isNumber:function isNumber(){return Yu;},isObject:function isObject(){return Fu;},isRegExp:function isRegExp(){return Xu;},isSet:function isSet(){return $l;},isString:function isString(){return Gu;},isSymbol:function isSymbol(){return Ju;},isTypedArray:function isTypedArray(){return bl;},isUndefined:function isUndefined(){return Hu;},isWeakMap:function isWeakMap(){return Fl;},isWeakSet:function isWeakSet(){return Hl;},iteratee:function iteratee(){return fh;},keys:function keys(){return kl;},last:function last(){return Fc;},lastIndexOf:function lastIndexOf(){return sc;},map:function map(){return hc;},mapObject:function mapObject(){return ph;},matcher:function matcher(){return uh;},matches:function matches(){return uh;},max:function max(){return xc;},memoize:function memoize(){return $h;},methods:function methods(){return Gl;},min:function min(){return kc;},mixin:function mixin(){return ef;},negate:function negate(){return Yh;},noop:function noop(){return gh;},now:function now(){return yh;},object:function object(){return Kc;},omit:function omit(){return Uc;},once:function once(){return Jh;},pairs:function pairs(){return Zl;},partial:function partial(){return Uh;},partition:function partition(){return Ic;},pick:function pick(){return Lc;},pluck:function pluck(){return bc;},property:function property(){return lh;},propertyOf:function propertyOf(){return _h;},random:function random(){return vh;},range:function range(){return Jc;},reduce:function reduce(){return fc;},reduceRight:function reduceRight(){return dc;},reject:function reject(){return gc;},rest:function rest(){return Dc;},restArguments:function restArguments(){return Du;},result:function result(){return Ch;},sample:function sample(){return Sc;},select:function select(){return pc;},shuffle:function shuffle(){return Mc;},size:function size(){return Oc;},some:function some(){return mc;},sortBy:function sortBy(){return Bc;},sortedIndex:function sortedIndex(){return rc;},tail:function tail(){return Dc;},take:function take(){return Pc;},tap:function tap(){return eh;},template:function template(){return zh;},templateSettings:function templateSettings(){return Ah;},throttle:function throttle(){return Zh;},times:function times(){return mh;},toArray:function toArray(){return Ec;},toPath:function toPath(){return nh;},transpose:function transpose(){return Vc;},unescape:function unescape(){return kh;},union:function union(){return Gc;},uniq:function uniq(){return Wc;},unique:function unique(){return Wc;},uniqueId:function uniqueId(){return Ih;},unzip:function unzip(){return Vc;},values:function values(){return ql;},where:function where(){return wc;},without:function without(){return Zc;},wrap:function wrap(){return Gh;},zip:function zip(){return Xc;}});var e={};n.r(e),n.d(e,{addChild:function addChild(){return sf;},assignAttributes:function assignAttributes(){return pf;},clearInternalNodes:function clearInternalNodes(){return mf;},createNode:function createNode(){return af;},deleteANode:function deleteANode(){return uf;},getInternals:function getInternals(){return hf;},getNodeByName:function getNodeByName(){return df;},getNodes:function getNodes(){return ff;},getRootNode:function getRootNode(){return cf;},getTips:function getTips(){return lf;},graftANode:function graftANode(){return of;},isLeafNode:function isLeafNode(){return gf;},selectAllDescendants:function selectAllDescendants(){return vf;},updateKeyName:function updateKeyName(){return _f;}});var r={};n.r(r),n.d(r,{\"default\":function _default(){return xf;},loadAnnotations:function loadAnnotations(){return wf;},parseAnnotations:function parseAnnotations(){return bf;}});var i={};n.r(i),n.d(i,{pathToRoot:function pathToRoot(){return Cf;},reroot:function reroot(){return Tf;},rootpath:function rootpath(){return zf;}});var o={};n.r(o),n.d(o,{alignTips:function alignTips(){return Zf;},css_classes:function css_classes(){return $f;},internalNames:function internalNames(){return Hf;},layoutHandler:function layoutHandler(){return Yf;},nodeBubbleSize:function nodeBubbleSize(){return Wf;},nodeSpan:function nodeSpan(){return Xf;},predefined_selecters:function predefined_selecters(){return Kf;},radial:function radial(){return qf;},selectionCallback:function selectionCallback(){return Jf;},selectionLabel:function selectionLabel(){return Vf;},shiftTip:function shiftTip(){return Gf;}});var s={};n.r(s),n.d(s,{defNodeLabel:function defNodeLabel(){return cd;},drawNode:function drawNode(){return td;},hasHiddenNodes:function hasHiddenNodes(){return ad;},internalLabel:function internalLabel(){return hd;},isNodeCollapsed:function isNodeCollapsed(){return ud;},nodeCssSelectors:function nodeCssSelectors(){return ld;},nodeLabel:function nodeLabel(){return fd;},nodeNotshown:function nodeNotshown(){return sd;},nodeSpan:function nodeSpan(){return rd;},nodeVisible:function nodeVisible(){return od;},reclassNode:function reclassNode(){return id;},shiftTip:function shiftTip(){return Qf;},showInternalName:function showInternalName(){return nd;},updateHasHiddenNodes:function updateHasHiddenNodes(){return ed;}});var a={};n.r(a),n.d(a,{cladeCssSelectors:function cladeCssSelectors(){return dd;},updateCollapsedClades:function updateCollapsedClades(){return pd;}});var u={};n.r(u),n.d(u,{drawEdge:function drawEdge(){return gd;},edgeCssSelectors:function edgeCssSelectors(){return bd;},edgeVisible:function edgeVisible(){return yd;},initializeEdgeLabels:function initializeEdgeLabels(){return md;},placeAlongAnEdge:function placeAlongAnEdge(){return wd;},reclassEdge:function reclassEdge(){return _d;},syncEdgeLabels:function syncEdgeLabels(){return vd;}});var l={};n.r(l),n.d(l,{countUpdate:function countUpdate(){return Md;},d3PhylotreeAddEventListener:function d3PhylotreeAddEventListener(){return zd;},d3PhylotreeEventListener:function d3PhylotreeEventListener(){return Td;},d3PhylotreeSvgRotate:function d3PhylotreeSvgRotate(){return Nd;},d3PhylotreeSvgTranslate:function d3PhylotreeSvgTranslate(){return Cd;},d3PhylotreeTriggerLayout:function d3PhylotreeTriggerLayout(){return Bd;},rescale:function rescale(){return Ed;},resizeSvg:function resizeSvg(){return Ad;},toggleCollapse:function toggleCollapse(){return kd;},triggerRefresh:function triggerRefresh(){return Sd;}});var h={};function c(t,e,n){t=+t,e=+e,n=(i=arguments.length)<2?(e=t,t=0,1):i<3?1:+n;for(var r=-1,i=0|Math.max(0,Math.ceil((e-t)/n)),o=new Array(i);++r<i;)o[r]=t+r*n;return o;}function f(t,e){switch(arguments.length){case 0:break;case 1:this.range(t);break;default:this.range(e).domain(t);}return this;}n.r(h),n.d(h,{addCustomMenu:function addCustomMenu(){return Rd;},getSelection:function getSelection(){return Ud;},modifySelection:function modifySelection(){return Ld;},nodeDropdownMenu:function nodeDropdownMenu(){return Od;},selectAllDescendants:function selectAllDescendants(){return jd;},selectionCallback:function selectionCallback(){return Pd;}});var d=Symbol(\"implicit\");function p(){var t=new Map(),e=[],n=[],r=d;function i(i){var o=i+\"\",s=t.get(o);if(!s){if(r!==d)return r;t.set(o,s=e.push(i));}return n[(s-1)%n.length];}return i.domain=function(n){if(!arguments.length)return e.slice();e=[],t=new Map();var _iterator9=_createForOfIteratorHelper(n),_step9;try{for(_iterator9.s();!(_step9=_iterator9.n()).done;){var _r20=_step9.value;var _n18=_r20+\"\";t.has(_n18)||t.set(_n18,e.push(_r20));}}catch(err){_iterator9.e(err);}finally{_iterator9.f();}return i;},i.range=function(t){return arguments.length?(n=Array.from(t),i):n.slice();},i.unknown=function(t){return arguments.length?(r=t,i):r;},i.copy=function(){return p(e,n).unknown(r);},f.apply(i,arguments),i;}function g(){var t,e,n=p().unknown(void 0),r=n.domain,i=n.range,o=0,s=1,a=!1,u=0,l=0,h=.5;function d(){var n=r().length,f=s<o,d=f?s:o,p=f?o:s;t=(p-d)/Math.max(1,n-u+2*l),a&&(t=Math.floor(t)),d+=(p-d-t*(n-u))*h,e=t*(1-u),a&&(d=Math.round(d),e=Math.round(e));var g=c(n).map(function(e){return d+t*e;});return i(f?g.reverse():g);}return delete n.unknown,n.domain=function(t){return arguments.length?(r(t),d()):r();},n.range=function(t){var _t17;return arguments.length?((_t17=_slicedToArray(t,2),o=_t17[0],s=_t17[1]),o=+o,s=+s,d()):[o,s];},n.rangeRound=function(t){var _t18;return(_t18=_slicedToArray(t,2),o=_t18[0],s=_t18[1]),o=+o,s=+s,a=!0,d();},n.bandwidth=function(){return e;},n.step=function(){return t;},n.round=function(t){return arguments.length?(a=!!t,d()):a;},n.padding=function(t){return arguments.length?(u=Math.min(1,l=+t),d()):u;},n.paddingInner=function(t){return arguments.length?(u=Math.min(1,t),d()):u;},n.paddingOuter=function(t){return arguments.length?(l=+t,d()):l;},n.align=function(t){return arguments.length?(h=Math.max(0,Math.min(1,t)),d()):h;},n.copy=function(){return g(r(),[o,s]).round(a).paddingInner(u).paddingOuter(l).align(h);},f.apply(d(),arguments);}var _=Math.sqrt(50),m=Math.sqrt(10),v=Math.sqrt(2);function y(t,e,n){var r=(e-t)/Math.max(0,n),i=Math.floor(Math.log(r)/Math.LN10),o=r/Math.pow(10,i);return i>=0?(o>=_?10:o>=m?5:o>=v?2:1)*Math.pow(10,i):-Math.pow(10,-i)/(o>=_?10:o>=m?5:o>=v?2:1);}function b(t,e){return t<e?-1:t>e?1:t>=e?0:NaN;}function w(t){var e=t,n=t;function r(t,e,r,i){for(null==r&&(r=0),null==i&&(i=t.length);r<i;){var _o7=r+i>>>1;n(t[_o7],e)<0?r=_o7+1:i=_o7;}return r;}return 1===t.length&&(e=function e(_e30,n){return t(_e30)-n;},n=function(t){return function(e,n){return b(t(e),n);};}(t)),{left:r,center:function center(t,n,i,o){null==i&&(i=0),null==o&&(o=t.length);var s=r(t,n,i,o-1);return s>i&&e(t[s-1],n)>-e(t[s],n)?s-1:s;},right:function right(t,e,r,i){for(null==r&&(r=0),null==i&&(i=t.length);r<i;){var _o8=r+i>>>1;n(t[_o8],e)>0?i=_o8:r=_o8+1;}return r;}};}var x=w(b),k=x.right,A=(x.left,w(function(t){return null===t?NaN:+t;}).center,k);function E(t,e,n){t.prototype=e.prototype=n,n.constructor=t;}function S(t,e){var n=Object.create(t.prototype);for(var r in e)n[r]=e[r];return n;}function M(){}var B=.7,T=1/B,z=\"\\\\s*([+-]?\\\\d+)\\\\s*\",C=\"\\\\s*([+-]?\\\\d*\\\\.?\\\\d+(?:[eE][+-]?\\\\d+)?)\\\\s*\",N=\"\\\\s*([+-]?\\\\d*\\\\.?\\\\d+(?:[eE][+-]?\\\\d+)?)%\\\\s*\",I=/^#([0-9a-f]{3,8})$/,O=new RegExp(\"^rgb\\\\(\"+[z,z,z]+\"\\\\)$\"),R=new RegExp(\"^rgb\\\\(\"+[N,N,N]+\"\\\\)$\"),L=new RegExp(\"^rgba\\\\(\"+[z,z,z,C]+\"\\\\)$\"),U=new RegExp(\"^rgba\\\\(\"+[N,N,N,C]+\"\\\\)$\"),j=new RegExp(\"^hsl\\\\(\"+[C,N,N]+\"\\\\)$\"),P=new RegExp(\"^hsla\\\\(\"+[C,N,N,C]+\"\\\\)$\"),D={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};function F(){return this.rgb().formatHex();}function $(){return this.rgb().formatRgb();}function H(t){var e,n;return t=(t+\"\").trim().toLowerCase(),(e=I.exec(t))?(n=e[1].length,e=parseInt(e[1],16),6===n?q(e):3===n?new G(e>>8&15|e>>4&240,e>>4&15|240&e,(15&e)<<4|15&e,1):8===n?Z(e>>24&255,e>>16&255,e>>8&255,(255&e)/255):4===n?Z(e>>12&15|e>>8&240,e>>8&15|e>>4&240,e>>4&15|240&e,((15&e)<<4|15&e)/255):null):(e=O.exec(t))?new G(e[1],e[2],e[3],1):(e=R.exec(t))?new G(255*e[1]/100,255*e[2]/100,255*e[3]/100,1):(e=L.exec(t))?Z(e[1],e[2],e[3],e[4]):(e=U.exec(t))?Z(255*e[1]/100,255*e[2]/100,255*e[3]/100,e[4]):(e=j.exec(t))?K(e[1],e[2]/100,e[3]/100,1):(e=P.exec(t))?K(e[1],e[2]/100,e[3]/100,e[4]):D.hasOwnProperty(t)?q(D[t]):\"transparent\"===t?new G(NaN,NaN,NaN,0):null;}function q(t){return new G(t>>16&255,t>>8&255,255&t,1);}function Z(t,e,n,r){return r<=0&&(t=e=n=NaN),new G(t,e,n,r);}function W(t,e,n,r){return 1===arguments.length?((i=t)instanceof M||(i=H(i)),i?new G((i=i.rgb()).r,i.g,i.b,i.opacity):new G()):new G(t,e,n,null==r?1:r);var i;}function G(t,e,n,r){this.r=+t,this.g=+e,this.b=+n,this.opacity=+r;}function Y(){return\"#\"+X(this.r)+X(this.g)+X(this.b);}function V(){var t=this.opacity;return(1===(t=isNaN(t)?1:Math.max(0,Math.min(1,t)))?\"rgb(\":\"rgba(\")+Math.max(0,Math.min(255,Math.round(this.r)||0))+\", \"+Math.max(0,Math.min(255,Math.round(this.g)||0))+\", \"+Math.max(0,Math.min(255,Math.round(this.b)||0))+(1===t?\")\":\", \"+t+\")\");}function X(t){return((t=Math.max(0,Math.min(255,Math.round(t)||0)))<16?\"0\":\"\")+t.toString(16);}function K(t,e,n,r){return r<=0?t=e=n=NaN:n<=0||n>=1?t=e=NaN:e<=0&&(t=NaN),new Q(t,e,n,r);}function J(t){if(t instanceof Q)return new Q(t.h,t.s,t.l,t.opacity);if(t instanceof M||(t=H(t)),!t)return new Q();if(t instanceof Q)return t;var e=(t=t.rgb()).r/255,n=t.g/255,r=t.b/255,i=Math.min(e,n,r),o=Math.max(e,n,r),s=NaN,a=o-i,u=(o+i)/2;return a?(s=e===o?(n-r)/a+6*(n<r):n===o?(r-e)/a+2:(e-n)/a+4,a/=u<.5?o+i:2-o-i,s*=60):a=u>0&&u<1?0:s,new Q(s,a,u,t.opacity);}function Q(t,e,n,r){this.h=+t,this.s=+e,this.l=+n,this.opacity=+r;}function tt(t,e,n){return 255*(t<60?e+(n-e)*t/60:t<180?n:t<240?e+(n-e)*(240-t)/60:e);}function et(t,e,n,r,i){var o=t*t,s=o*t;return((1-3*t+3*o-s)*e+(4-6*o+3*s)*n+(1+3*t+3*o-3*s)*r+s*i)/6;}E(M,H,{copy:function copy(t){return Object.assign(new this.constructor(),this,t);},displayable:function displayable(){return this.rgb().displayable();},hex:F,formatHex:F,formatHsl:function formatHsl(){return J(this).formatHsl();},formatRgb:$,toString:$}),E(G,W,S(M,{brighter:function brighter(t){return t=null==t?T:Math.pow(T,t),new G(this.r*t,this.g*t,this.b*t,this.opacity);},darker:function darker(t){return t=null==t?B:Math.pow(B,t),new G(this.r*t,this.g*t,this.b*t,this.opacity);},rgb:function rgb(){return this;},displayable:function displayable(){return-.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1;},hex:Y,formatHex:Y,formatRgb:V,toString:V})),E(Q,function(t,e,n,r){return 1===arguments.length?J(t):new Q(t,e,n,null==r?1:r);},S(M,{brighter:function brighter(t){return t=null==t?T:Math.pow(T,t),new Q(this.h,this.s,this.l*t,this.opacity);},darker:function darker(t){return t=null==t?B:Math.pow(B,t),new Q(this.h,this.s,this.l*t,this.opacity);},rgb:function rgb(){var t=this.h%360+360*(this.h<0),e=isNaN(t)||isNaN(this.s)?0:this.s,n=this.l,r=n+(n<.5?n:1-n)*e,i=2*n-r;return new G(tt(t>=240?t-240:t+120,i,r),tt(t,i,r),tt(t<120?t+240:t-120,i,r),this.opacity);},displayable:function displayable(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1;},formatHsl:function formatHsl(){var t=this.opacity;return(1===(t=isNaN(t)?1:Math.max(0,Math.min(1,t)))?\"hsl(\":\"hsla(\")+(this.h||0)+\", \"+100*(this.s||0)+\"%, \"+100*(this.l||0)+\"%\"+(1===t?\")\":\", \"+t+\")\");}}));var nt=function nt(t){return function(){return t;};};function rt(t,e){var n=e-t;return n?function(t,e){return function(n){return t+n*e;};}(t,n):nt(isNaN(t)?e:t);}var it=function t(e){var n=function(t){return 1==(t=+t)?rt:function(e,n){return n-e?function(t,e,n){return t=Math.pow(t,n),e=Math.pow(e,n)-t,n=1/n,function(r){return Math.pow(t+r*e,n);};}(e,n,t):nt(isNaN(e)?n:e);};}(e);function r(t,e){var r=n((t=W(t)).r,(e=W(e)).r),i=n(t.g,e.g),o=n(t.b,e.b),s=rt(t.opacity,e.opacity);return function(e){return t.r=r(e),t.g=i(e),t.b=o(e),t.opacity=s(e),t+\"\";};}return r.gamma=t,r;}(1);function ot(t){return function(e){var n,r,i=e.length,o=new Array(i),s=new Array(i),a=new Array(i);for(n=0;n<i;++n)r=W(e[n]),o[n]=r.r||0,s[n]=r.g||0,a[n]=r.b||0;return o=t(o),s=t(s),a=t(a),r.opacity=1,function(t){return r.r=o(t),r.g=s(t),r.b=a(t),r+\"\";};};}function st(t,e){var n,r=e?e.length:0,i=t?Math.min(r,t.length):0,o=new Array(i),s=new Array(r);for(n=0;n<i;++n)o[n]=pt(t[n],e[n]);for(;n<r;++n)s[n]=e[n];return function(t){for(n=0;n<i;++n)s[n]=o[n](t);return s;};}function at(t,e){var n=new Date();return t=+t,e=+e,function(r){return n.setTime(t*(1-r)+e*r),n;};}function ut(t,e){return t=+t,e=+e,function(n){return t*(1-n)+e*n;};}function lt(t,e){var n,r={},i={};for(n in null!==t&&\"object\"==_typeof(t)||(t={}),null!==e&&\"object\"==_typeof(e)||(e={}),e)n in t?r[n]=pt(t[n],e[n]):i[n]=e[n];return function(t){for(n in r)i[n]=r[n](t);return i;};}ot(function(t){var e=t.length-1;return function(n){var r=n<=0?n=0:n>=1?(n=1,e-1):Math.floor(n*e),i=t[r],o=t[r+1],s=r>0?t[r-1]:2*i-o,a=r<e-1?t[r+2]:2*o-i;return et((n-r/e)*e,s,i,o,a);};}),ot(function(t){var e=t.length;return function(n){var r=Math.floor(((n%=1)<0?++n:n)*e),i=t[(r+e-1)%e],o=t[r%e],s=t[(r+1)%e],a=t[(r+2)%e];return et((n-r/e)*e,i,o,s,a);};});var ht=/[-+]?(?:\\d+\\.?\\d*|\\.?\\d+)(?:[eE][-+]?\\d+)?/g,ct=new RegExp(ht.source,\"g\");function ft(t,e){var n,r,i,o=ht.lastIndex=ct.lastIndex=0,s=-1,a=[],u=[];for(t+=\"\",e+=\"\";(n=ht.exec(t))&&(r=ct.exec(e));)(i=r.index)>o&&(i=e.slice(o,i),a[s]?a[s]+=i:a[++s]=i),(n=n[0])===(r=r[0])?a[s]?a[s]+=r:a[++s]=r:(a[++s]=null,u.push({i:s,x:ut(n,r)})),o=ct.lastIndex;return o<e.length&&(i=e.slice(o),a[s]?a[s]+=i:a[++s]=i),a.length<2?u[0]?function(t){return function(e){return t(e)+\"\";};}(u[0].x):function(t){return function(){return t;};}(e):(e=u.length,function(t){for(var n,r=0;r<e;++r)a[(n=u[r]).i]=n.x(t);return a.join(\"\");});}function dt(t,e){e||(e=[]);var n,r=t?Math.min(e.length,t.length):0,i=e.slice();return function(o){for(n=0;n<r;++n)i[n]=t[n]*(1-o)+e[n]*o;return i;};}function pt(t,e){var n,r,i=_typeof(e);return null==e||\"boolean\"===i?nt(e):(\"number\"===i?ut:\"string\"===i?(n=H(e))?(e=n,it):ft:e instanceof H?it:e instanceof Date?at:(r=e,!ArrayBuffer.isView(r)||r instanceof DataView?Array.isArray(e)?st:\"function\"!=typeof e.valueOf&&\"function\"!=typeof e.toString||isNaN(e)?lt:ut:dt))(t,e);}function gt(t,e){return t=+t,e=+e,function(n){return Math.round(t*(1-n)+e*n);};}function _t(t){return+t;}var mt=[0,1];function vt(t){return t;}function yt(t,e){return(e-=t=+t)?function(n){return(n-t)/e;}:(n=isNaN(e)?NaN:.5,function(){return n;});var n;}function bt(t,e,n){var r=t[0],i=t[1],o=e[0],s=e[1];return i<r?(r=yt(i,r),o=n(s,o)):(r=yt(r,i),o=n(o,s)),function(t){return o(r(t));};}function wt(t,e,n){var r=Math.min(t.length,e.length)-1,i=new Array(r),o=new Array(r),s=-1;for(t[r]<t[0]&&(t=t.slice().reverse(),e=e.slice().reverse());++s<r;)i[s]=yt(t[s],t[s+1]),o[s]=n(e[s],e[s+1]);return function(e){var n=A(t,e,1,r)-1;return o[n](i[n](e));};}var xt,kt=/^(?:(.)?([<>=^]))?([+\\-( ])?([$#])?(0)?(\\d+)?(,)?(\\.\\d+)?(~)?([a-z%])?$/i;function At(t){if(!(e=kt.exec(t)))throw new Error(\"invalid format: \"+t);var e;return new Et({fill:e[1],align:e[2],sign:e[3],symbol:e[4],zero:e[5],width:e[6],comma:e[7],precision:e[8]&&e[8].slice(1),trim:e[9],type:e[10]});}function Et(t){this.fill=void 0===t.fill?\" \":t.fill+\"\",this.align=void 0===t.align?\">\":t.align+\"\",this.sign=void 0===t.sign?\"-\":t.sign+\"\",this.symbol=void 0===t.symbol?\"\":t.symbol+\"\",this.zero=!!t.zero,this.width=void 0===t.width?void 0:+t.width,this.comma=!!t.comma,this.precision=void 0===t.precision?void 0:+t.precision,this.trim=!!t.trim,this.type=void 0===t.type?\"\":t.type+\"\";}function St(t,e){if((n=(t=e?t.toExponential(e-1):t.toExponential()).indexOf(\"e\"))<0)return null;var n,r=t.slice(0,n);return[r.length>1?r[0]+r.slice(2):r,+t.slice(n+1)];}function Mt(t){return(t=St(Math.abs(t)))?t[1]:NaN;}function Bt(t,e){var n=St(t,e);if(!n)return t+\"\";var r=n[0],i=n[1];return i<0?\"0.\"+new Array(-i).join(\"0\")+r:r.length>i+1?r.slice(0,i+1)+\".\"+r.slice(i+1):r+new Array(i-r.length+2).join(\"0\");}At.prototype=Et.prototype,Et.prototype.toString=function(){return this.fill+this.align+this.sign+this.symbol+(this.zero?\"0\":\"\")+(void 0===this.width?\"\":Math.max(1,0|this.width))+(this.comma?\",\":\"\")+(void 0===this.precision?\"\":\".\"+Math.max(0,0|this.precision))+(this.trim?\"~\":\"\")+this.type;};var Tt={\"%\":function _(t,e){return(100*t).toFixed(e);},b:function b(t){return Math.round(t).toString(2);},c:function c(t){return t+\"\";},d:function d(t){return Math.abs(t=Math.round(t))>=1e21?t.toLocaleString(\"en\").replace(/,/g,\"\"):t.toString(10);},e:function e(t,_e31){return t.toExponential(_e31);},f:function f(t,e){return t.toFixed(e);},g:function g(t,e){return t.toPrecision(e);},o:function o(t){return Math.round(t).toString(8);},p:function p(t,e){return Bt(100*t,e);},r:Bt,s:function s(t,e){var n=St(t,e);if(!n)return t+\"\";var r=n[0],i=n[1],o=i-(xt=3*Math.max(-8,Math.min(8,Math.floor(i/3))))+1,s=r.length;return o===s?r:o>s?r+new Array(o-s+1).join(\"0\"):o>0?r.slice(0,o)+\".\"+r.slice(o):\"0.\"+new Array(1-o).join(\"0\")+St(t,Math.max(0,e+o-1))[0];},X:function X(t){return Math.round(t).toString(16).toUpperCase();},x:function x(t){return Math.round(t).toString(16);}};function zt(t){return t;}var Ct,Nt,It,Ot=Array.prototype.map,Rt=[\"y\",\"z\",\"a\",\"f\",\"p\",\"n\",\"µ\",\"m\",\"\",\"k\",\"M\",\"G\",\"T\",\"P\",\"E\",\"Z\",\"Y\"];function Lt(t){var e=t.domain;return t.ticks=function(t){var n=e();return function(t,e,n){var r,i,o,s,a=-1;if(n=+n,(t=+t)==(e=+e)&&n>0)return[t];if((r=e<t)&&(i=t,t=e,e=i),0===(s=y(t,e,n))||!isFinite(s))return[];if(s>0){var _n19=Math.round(t/s),_r21=Math.round(e/s);for(_n19*s<t&&++_n19,_r21*s>e&&--_r21,o=new Array(i=_r21-_n19+1);++a<i;)o[a]=(_n19+a)*s;}else{s=-s;var _n20=Math.round(t*s),_r22=Math.round(e*s);for(_n20/s<t&&++_n20,_r22/s>e&&--_r22,o=new Array(i=_r22-_n20+1);++a<i;)o[a]=(_n20+a)/s;}return r&&o.reverse(),o;}(n[0],n[n.length-1],null==t?10:t);},t.tickFormat=function(t,n){var r=e();return function(t,e,n,r){var i,o=function(t,e,n){var r=Math.abs(e-t)/Math.max(0,n),i=Math.pow(10,Math.floor(Math.log(r)/Math.LN10)),o=r/i;return o>=_?i*=10:o>=m?i*=5:o>=v&&(i*=2),e<t?-i:i;}(t,e,n);switch((r=At(null==r?\",f\":r)).type){case\"s\":var s=Math.max(Math.abs(t),Math.abs(e));return null!=r.precision||isNaN(i=function(t,e){return Math.max(0,3*Math.max(-8,Math.min(8,Math.floor(Mt(e)/3)))-Mt(Math.abs(t)));}(o,s))||(r.precision=i),It(r,s);case\"\":case\"e\":case\"g\":case\"p\":case\"r\":null!=r.precision||isNaN(i=function(t,e){return t=Math.abs(t),e=Math.abs(e)-t,Math.max(0,Mt(e)-Mt(t))+1;}(o,Math.max(Math.abs(t),Math.abs(e))))||(r.precision=i-(\"e\"===r.type));break;case\"f\":case\"%\":null!=r.precision||isNaN(i=function(t){return Math.max(0,-Mt(Math.abs(t)));}(o))||(r.precision=i-2*(\"%\"===r.type));}return Nt(r);}(r[0],r[r.length-1],null==t?10:t,n);},t.nice=function(n){null==n&&(n=10);var r,i,o=e(),s=0,a=o.length-1,u=o[s],l=o[a],h=10;for(l<u&&(i=u,u=l,l=i,i=s,s=a,a=i);h-->0;){if((i=y(u,l,n))===r)return o[s]=u,o[a]=l,e(o);if(i>0)u=Math.floor(u/i)*i,l=Math.ceil(l/i)*i;else{if(!(i<0))break;u=Math.ceil(u*i)/i,l=Math.floor(l*i)/i;}r=i;}return t;},t;}function Ut(){var t=function(){var t,e,n,r,i,o,s=mt,a=mt,u=pt,l=vt;function h(){var t,e,n,u=Math.min(s.length,a.length);return l!==vt&&(t=s[0],e=s[u-1],t>e&&(n=t,t=e,e=n),l=function l(n){return Math.max(t,Math.min(e,n));}),r=u>2?wt:bt,i=o=null,c;}function c(e){return null==e||isNaN(e=+e)?n:(i||(i=r(s.map(t),a,u)))(t(l(e)));}return c.invert=function(n){return l(e((o||(o=r(a,s.map(t),ut)))(n)));},c.domain=function(t){return arguments.length?(s=Array.from(t,_t),h()):s.slice();},c.range=function(t){return arguments.length?(a=Array.from(t),h()):a.slice();},c.rangeRound=function(t){return a=Array.from(t),u=gt,h();},c.clamp=function(t){return arguments.length?(l=!!t||vt,h()):l!==vt;},c.interpolate=function(t){return arguments.length?(u=t,h()):u;},c.unknown=function(t){return arguments.length?(n=t,c):n;},function(n,r){return t=n,e=r,h();};}()(vt,vt);return t.copy=function(){return e=t,Ut().domain(e.domain()).range(e.range()).interpolate(e.interpolate()).clamp(e.clamp()).unknown(e.unknown());var e;},f.apply(t,arguments),Lt(t);}function jt(t,e){if((n=(t=e?t.toExponential(e-1):t.toExponential()).indexOf(\"e\"))<0)return null;var n,r=t.slice(0,n);return[r.length>1?r[0]+r.slice(2):r,+t.slice(n+1)];}Ct=function(t){var e,n,r=void 0===t.grouping||void 0===t.thousands?zt:(e=Ot.call(t.grouping,Number),n=t.thousands+\"\",function(t,r){for(var i=t.length,o=[],s=0,a=e[0],u=0;i>0&&a>0&&(u+a+1>r&&(a=Math.max(1,r-u)),o.push(t.substring(i-=a,i+a)),!((u+=a+1)>r));)a=e[s=(s+1)%e.length];return o.reverse().join(n);}),i=void 0===t.currency?\"\":t.currency[0]+\"\",o=void 0===t.currency?\"\":t.currency[1]+\"\",s=void 0===t.decimal?\".\":t.decimal+\"\",a=void 0===t.numerals?zt:function(t){return function(e){return e.replace(/[0-9]/g,function(e){return t[+e];});};}(Ot.call(t.numerals,String)),u=void 0===t.percent?\"%\":t.percent+\"\",l=void 0===t.minus?\"−\":t.minus+\"\",h=void 0===t.nan?\"NaN\":t.nan+\"\";function c(t){var e=(t=At(t)).fill,n=t.align,c=t.sign,f=t.symbol,d=t.zero,p=t.width,g=t.comma,_=t.precision,m=t.trim,v=t.type;\"n\"===v?(g=!0,v=\"g\"):Tt[v]||(void 0===_&&(_=12),m=!0,v=\"g\"),(d||\"0\"===e&&\"=\"===n)&&(d=!0,e=\"0\",n=\"=\");var y=\"$\"===f?i:\"#\"===f&&/[boxX]/.test(v)?\"0\"+v.toLowerCase():\"\",b=\"$\"===f?o:/[%p]/.test(v)?u:\"\",w=Tt[v],x=/[defgprs%]/.test(v);function k(t){var i,o,u,f=y,k=b;if(\"c\"===v)k=w(t)+k,t=\"\";else{var A=(t=+t)<0||1/t<0;if(t=isNaN(t)?h:w(Math.abs(t),_),m&&(t=function(t){t:for(var e,n=t.length,r=1,i=-1;r<n;++r)switch(t[r]){case\".\":i=e=r;break;case\"0\":0===i&&(i=r),e=r;break;default:if(!+t[r])break t;i>0&&(i=0);}return i>0?t.slice(0,i)+t.slice(e+1):t;}(t)),A&&0==+t&&\"+\"!==c&&(A=!1),f=(A?\"(\"===c?c:l:\"-\"===c||\"(\"===c?\"\":c)+f,k=(\"s\"===v?Rt[8+xt/3]:\"\")+k+(A&&\"(\"===c?\")\":\"\"),x)for(i=-1,o=t.length;++i<o;)if(48>(u=t.charCodeAt(i))||u>57){k=(46===u?s+t.slice(i+1):t.slice(i))+k,t=t.slice(0,i);break;}}g&&!d&&(t=r(t,1/0));var E=f.length+t.length+k.length,S=E<p?new Array(p-E+1).join(e):\"\";switch(g&&d&&(t=r(S+t,S.length?p-k.length:1/0),S=\"\"),n){case\"<\":t=f+t+k+S;break;case\"=\":t=f+S+t+k;break;case\"^\":t=S.slice(0,E=S.length>>1)+f+t+k+S.slice(E);break;default:t=S+f+t+k;}return a(t);}return _=void 0===_?6:/[gprs]/.test(v)?Math.max(1,Math.min(21,_)):Math.max(0,Math.min(20,_)),k.toString=function(){return t+\"\";},k;}return{format:c,formatPrefix:function formatPrefix(t,e){var n=c(((t=At(t)).type=\"f\",t)),r=3*Math.max(-8,Math.min(8,Math.floor(Mt(e)/3))),i=Math.pow(10,-r),o=Rt[8+r/3];return function(t){return n(i*t)+o;};}};}({thousands:\",\",grouping:[3],currency:[\"$\",\"\"]}),Nt=Ct.format,It=Ct.formatPrefix;var Pt,Dt=/^(?:(.)?([<>=^]))?([+\\-( ])?([$#])?(0)?(\\d+)?(,)?(\\.\\d+)?(~)?([a-z%])?$/i;function Ft(t){if(!(e=Dt.exec(t)))throw new Error(\"invalid format: \"+t);var e;return new $t({fill:e[1],align:e[2],sign:e[3],symbol:e[4],zero:e[5],width:e[6],comma:e[7],precision:e[8]&&e[8].slice(1),trim:e[9],type:e[10]});}function $t(t){this.fill=void 0===t.fill?\" \":t.fill+\"\",this.align=void 0===t.align?\">\":t.align+\"\",this.sign=void 0===t.sign?\"-\":t.sign+\"\",this.symbol=void 0===t.symbol?\"\":t.symbol+\"\",this.zero=!!t.zero,this.width=void 0===t.width?void 0:+t.width,this.comma=!!t.comma,this.precision=void 0===t.precision?void 0:+t.precision,this.trim=!!t.trim,this.type=void 0===t.type?\"\":t.type+\"\";}function Ht(t,e){var n=jt(t,e);if(!n)return t+\"\";var r=n[0],i=n[1];return i<0?\"0.\"+new Array(-i).join(\"0\")+r:r.length>i+1?r.slice(0,i+1)+\".\"+r.slice(i+1):r+new Array(i-r.length+2).join(\"0\");}Ft.prototype=$t.prototype,$t.prototype.toString=function(){return this.fill+this.align+this.sign+this.symbol+(this.zero?\"0\":\"\")+(void 0===this.width?\"\":Math.max(1,0|this.width))+(this.comma?\",\":\"\")+(void 0===this.precision?\"\":\".\"+Math.max(0,0|this.precision))+(this.trim?\"~\":\"\")+this.type;};var qt={\"%\":function _(t,e){return(100*t).toFixed(e);},b:function b(t){return Math.round(t).toString(2);},c:function c(t){return t+\"\";},d:function d(t){return Math.abs(t=Math.round(t))>=1e21?t.toLocaleString(\"en\").replace(/,/g,\"\"):t.toString(10);},e:function e(t,_e32){return t.toExponential(_e32);},f:function f(t,e){return t.toFixed(e);},g:function g(t,e){return t.toPrecision(e);},o:function o(t){return Math.round(t).toString(8);},p:function p(t,e){return Ht(100*t,e);},r:Ht,s:function s(t,e){var n=jt(t,e);if(!n)return t+\"\";var r=n[0],i=n[1],o=i-(Pt=3*Math.max(-8,Math.min(8,Math.floor(i/3))))+1,s=r.length;return o===s?r:o>s?r+new Array(o-s+1).join(\"0\"):o>0?r.slice(0,o)+\".\"+r.slice(o):\"0.\"+new Array(1-o).join(\"0\")+jt(t,Math.max(0,e+o-1))[0];},X:function X(t){return Math.round(t).toString(16).toUpperCase();},x:function x(t){return Math.round(t).toString(16);}};function Zt(t){return t;}var Wt,Gt,Yt=Array.prototype.map,Vt=[\"y\",\"z\",\"a\",\"f\",\"p\",\"n\",\"µ\",\"m\",\"\",\"k\",\"M\",\"G\",\"T\",\"P\",\"E\",\"Z\",\"Y\"];Wt=function(t){var e,n,r=void 0===t.grouping||void 0===t.thousands?Zt:(e=Yt.call(t.grouping,Number),n=t.thousands+\"\",function(t,r){for(var i=t.length,o=[],s=0,a=e[0],u=0;i>0&&a>0&&(u+a+1>r&&(a=Math.max(1,r-u)),o.push(t.substring(i-=a,i+a)),!((u+=a+1)>r));)a=e[s=(s+1)%e.length];return o.reverse().join(n);}),i=void 0===t.currency?\"\":t.currency[0]+\"\",o=void 0===t.currency?\"\":t.currency[1]+\"\",s=void 0===t.decimal?\".\":t.decimal+\"\",a=void 0===t.numerals?Zt:function(t){return function(e){return e.replace(/[0-9]/g,function(e){return t[+e];});};}(Yt.call(t.numerals,String)),u=void 0===t.percent?\"%\":t.percent+\"\",l=void 0===t.minus?\"−\":t.minus+\"\",h=void 0===t.nan?\"NaN\":t.nan+\"\";function c(t){var e=(t=Ft(t)).fill,n=t.align,c=t.sign,f=t.symbol,d=t.zero,p=t.width,g=t.comma,_=t.precision,m=t.trim,v=t.type;\"n\"===v?(g=!0,v=\"g\"):qt[v]||(void 0===_&&(_=12),m=!0,v=\"g\"),(d||\"0\"===e&&\"=\"===n)&&(d=!0,e=\"0\",n=\"=\");var y=\"$\"===f?i:\"#\"===f&&/[boxX]/.test(v)?\"0\"+v.toLowerCase():\"\",b=\"$\"===f?o:/[%p]/.test(v)?u:\"\",w=qt[v],x=/[defgprs%]/.test(v);function k(t){var i,o,u,f=y,k=b;if(\"c\"===v)k=w(t)+k,t=\"\";else{var A=(t=+t)<0||1/t<0;if(t=isNaN(t)?h:w(Math.abs(t),_),m&&(t=function(t){t:for(var e,n=t.length,r=1,i=-1;r<n;++r)switch(t[r]){case\".\":i=e=r;break;case\"0\":0===i&&(i=r),e=r;break;default:if(!+t[r])break t;i>0&&(i=0);}return i>0?t.slice(0,i)+t.slice(e+1):t;}(t)),A&&0==+t&&\"+\"!==c&&(A=!1),f=(A?\"(\"===c?c:l:\"-\"===c||\"(\"===c?\"\":c)+f,k=(\"s\"===v?Vt[8+Pt/3]:\"\")+k+(A&&\"(\"===c?\")\":\"\"),x)for(i=-1,o=t.length;++i<o;)if(48>(u=t.charCodeAt(i))||u>57){k=(46===u?s+t.slice(i+1):t.slice(i))+k,t=t.slice(0,i);break;}}g&&!d&&(t=r(t,1/0));var E=f.length+t.length+k.length,S=E<p?new Array(p-E+1).join(e):\"\";switch(g&&d&&(t=r(S+t,S.length?p-k.length:1/0),S=\"\"),n){case\"<\":t=f+t+k+S;break;case\"=\":t=f+S+t+k;break;case\"^\":t=S.slice(0,E=S.length>>1)+f+t+k+S.slice(E);break;default:t=S+f+t+k;}return a(t);}return _=void 0===_?6:/[gprs]/.test(v)?Math.max(1,Math.min(21,_)):Math.max(0,Math.min(20,_)),k.toString=function(){return t+\"\";},k;}return{format:c,formatPrefix:function formatPrefix(t,e){var n,r=c(((t=Ft(t)).type=\"f\",t)),i=3*Math.max(-8,Math.min(8,Math.floor((n=e,((n=jt(Math.abs(n)))?n[1]:NaN)/3)))),o=Math.pow(10,-i),s=Vt[8+i/3];return function(t){return r(o*t)+s;};}};}({thousands:\",\",grouping:[3],currency:[\"$\",\"\"]}),Gt=Wt.format,Wt.formatPrefix;var Xt=n(1934);var Kt=Xt.expose,Jt=(Xt.registerSerializer,Xt.Transfer);var Qt=/*#__PURE__*/function(){function Qt(t,e){_classCallCheck(this,Qt);this.blockPosition=t,this.dataPosition=e;}_createClass(Qt,[{key:\"toString\",value:function toString(){return\"\".concat(this.blockPosition,\":\").concat(this.dataPosition);}},{key:\"compareTo\",value:function compareTo(t){return this.blockPosition-t.blockPosition||this.dataPosition-t.dataPosition;}}],[{key:\"min\",value:function min(){var e,n=0;for(var _len=arguments.length,t=new Array(_len),_key=0;_key<_len;_key++){t[_key]=arguments[_key];}for(;!e;n+=1)e=t[n];for(;n<t.length;n+=1)e.compareTo(t[n])>0&&(e=t[n]);return e;}}]);return Qt;}();function te(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;var n=arguments.length>2&&arguments[2]!==undefined?arguments[2]:!1;if(n)throw new Error(\"big-endian virtual file offsets not implemented\");return new Qt(1099511627776*t[e+7]+4294967296*t[e+6]+16777216*t[e+5]+65536*t[e+4]+256*t[e+3]+t[e+2],t[e+1]<<8|t[e]);}var ee=/*#__PURE__*/function(){function ee(t,e,n,r){_classCallCheck(this,ee);this.minv=t,this.maxv=e,this.bin=n,this._fetchedSize=r;}_createClass(ee,[{key:\"toUniqueString\",value:function toUniqueString(){return\"\".concat(this.minv.toString(),\"..\").concat(this.maxv.toString(),\" (bin \").concat(this.bin,\", fetchedSize \").concat(this.fetchedSize(),\")\");}},{key:\"toString\",value:function toString(){return this.toUniqueString();}},{key:\"compareTo\",value:function compareTo(t){return this.minv.compareTo(t.minv)||this.maxv.compareTo(t.maxv)||this.bin-t.bin;}},{key:\"fetchedSize\",value:function fetchedSize(){return void 0!==this._fetchedSize?this._fetchedSize:this.maxv.blockPosition+65536-this.minv.blockPosition;}}]);return ee;}();var ne=n(8806),re=n.n(ne);function ie(t){return new Promise(function(e){return setTimeout(e,t);});}function oe(t,e){var n=[];var r;if(0===t.length)return t;t.sort(function(t,e){var n=t.minv.blockPosition-e.minv.blockPosition;return 0===n?t.minv.dataPosition-e.minv.dataPosition:n;});var _iterator10=_createForOfIteratorHelper(t),_step10;try{for(_iterator10.s();!(_step10=_iterator10.n()).done;){var _s11=_step10.value;(!e||_s11.maxv.compareTo(e)>0)&&(void 0===r?(n.push(_s11),r=_s11):(i=r,(o=_s11).minv.blockPosition-i.maxv.blockPosition<65e3&&o.maxv.blockPosition-i.minv.blockPosition<5e6?_s11.maxv.compareTo(r.maxv)>0&&(r.maxv=_s11.maxv):(n.push(_s11),r=_s11)));}}catch(err){_iterator10.e(err);}finally{_iterator10.f();}var i,o;return n;}function se(t,e){return{lineCount:function(t){if(t.greaterThan(Number.MAX_SAFE_INTEGER)||t.lessThan(Number.MIN_SAFE_INTEGER))throw new Error(\"integer overflow\");return t.toNumber();}(re().fromBytesLE(Array.prototype.slice.call(t,e,e+8),!0))};}function ae(t,e){return t?t.compareTo(e)>0?e:t:e;}function ue(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:function(t){return t;};var n=0,r=0;var i=[],o={};for(var _s12=0;_s12<t.length;_s12+=1)if(!t[_s12]){if(r<_s12){var _a6=t.toString(\"utf8\",r,_s12);_a6=e(_a6),i[n]=_a6,o[_a6]=n;}r=_s12+1,n+=1;}return{refNameToId:o,refIdToName:i};}var le=/*#__PURE__*/_createClass(function le(_ref18){var t=_ref18.filehandle,_ref18$renameRefSeq=_ref18.renameRefSeq,e=_ref18$renameRefSeq===void 0?function(t){return t;}:_ref18$renameRefSeq;_classCallCheck(this,le);this.filehandle=t,this.renameRefSeq=e;});var he=/*#__PURE__*/function(_le){_inherits(he,_le);var _super3=_createSuper(he);function he(){_classCallCheck(this,he);return _super3.apply(this,arguments);}_createClass(he,[{key:\"lineCount\",value:function(){var _lineCount=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee29(t,e){var n,r;return _regeneratorRuntime().wrap(function _callee29$(_context32){while(1)switch(_context32.prev=_context32.next){case 0:_context32.next=2;return this.parse(e);case 2:_context32.t3=t;_context32.t4=n=_context32.sent.indices[_context32.t3];_context32.t2=null===_context32.t4;if(_context32.t2){_context32.next=7;break;}_context32.t2=void 0===n;case 7:if(!_context32.t2){_context32.next=11;break;}_context32.t5=void 0;_context32.next=12;break;case 11:_context32.t5=n.stats;case 12:_context32.t6=r=_context32.t5;_context32.t1=null===_context32.t6;if(_context32.t1){_context32.next=16;break;}_context32.t1=void 0===r;case 16:if(!_context32.t1){_context32.next=20;break;}_context32.t7=void 0;_context32.next=21;break;case 20:_context32.t7=r.lineCount;case 21:_context32.t0=_context32.t7;if(_context32.t0){_context32.next=24;break;}_context32.t0=0;case 24:return _context32.abrupt(\"return\",_context32.t0);case 25:case\"end\":return _context32.stop();}},_callee29,this);}));function lineCount(_x40,_x41){return _lineCount.apply(this,arguments);}return lineCount;}()},{key:\"_parse\",value:function(){var _parse2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee30(t){var e,n,r,i,o,_t19,_n21,_s13,_a7,_t20,_t21,_n22,_o9,_s14,_n23,_a8,_u5,_l4,_t22,_n24;return _regeneratorRuntime().wrap(function _callee30$(_context33){while(1)switch(_context33.prev=_context33.next){case 0:_context33.next=2;return this.filehandle.readFile(t);case 2:e=_context33.sent;if(!(21578050!==e.readUInt32LE(0))){_context33.next=5;break;}throw new Error(\"Not a BAI file\");case 5:n=e.readInt32LE(4);i=8;o=new Array(n);_t19=0;case 9:if(!(_t19<n)){_context33.next=39;break;}_n21=e.readInt32LE(i);_s13=void 0;i+=4;_a7={};_t20=0;case 15:if(!(_t20<_n21)){_context33.next=31;break;}_t21=e.readUInt32LE(i);if(!(i+=4,37450===_t21)){_context33.next=21;break;}i+=4,_s13=se(e,i+16),i+=32;_context33.next=28;break;case 21:if(!(_t21>37450)){_context33.next=23;break;}throw new Error(\"bai index contains too many bins, please use CSI\");case 23:_n22=e.readInt32LE(i);i+=4;_o9=new Array(_n22);for(_s14=0;_s14<_n22;_s14++){_n23=te(e,i);i+=8;_a8=te(e,i);i+=8,r=ae(r,_n23),_o9[_s14]=new ee(_n23,_a8,_t21);}_a7[_t21]=_o9;case 28:_t20+=1;_context33.next=15;break;case 31:_u5=e.readInt32LE(i);i+=4;_l4=new Array(_u5);for(_t22=0;_t22<_u5;_t22++){_n24=te(e,i);i+=8,r=ae(r,_n24),_l4[_t22]=_n24;}o[_t19]={binIndex:_a7,linearIndex:_l4,stats:_s13};case 36:_t19++;_context33.next=9;break;case 39:return _context33.abrupt(\"return\",{bai:!0,firstDataLine:r,maxBlockSize:65536,indices:o,refCount:n});case 40:case\"end\":return _context33.stop();}},_callee30,this);}));function _parse(_x42){return _parse2.apply(this,arguments);}return _parse;}()},{key:\"indexCov\",value:function(){var _indexCov=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee31(t,e,n){var r,i,o,s,_s$linearIndex,a,u,l,h,c,f,d,p,_t23,_e33,_args34=arguments;return _regeneratorRuntime().wrap(function _callee31$(_context34){while(1)switch(_context34.prev=_context34.next){case 0:r=_args34.length>3&&_args34[3]!==undefined?_args34[3]:{};i=16384;o=void 0!==e;_context34.next=5;return this.parse(r);case 5:_context34.t0=t;s=_context34.sent.indices[_context34.t0];if(s){_context34.next=9;break;}return _context34.abrupt(\"return\",[]);case 9:_s$linearIndex=s.linearIndex,a=_s$linearIndex===void 0?[]:_s$linearIndex,u=s.stats;if(!(0===a.length)){_context34.next=12;break;}return _context34.abrupt(\"return\",[]);case 12:l=void 0===n?(a.length-1)*i:(h=n)-h%i+16384;c=void 0===e?0:function(t,e){return t-t%16384;}(e),f=new Array(o?(l-c)/i:a.length-1),d=a[a.length-1].blockPosition;if(!(l>(a.length-1)*i)){_context34.next=16;break;}throw new Error(\"query outside of range of linear index\");case 16:p=a[c/i].blockPosition;for(_t23=c/i,_e33=0;_t23<l/i;_t23++,_e33++)f[_e33]={score:a[_t23+1].blockPosition-p,start:_t23*i,end:_t23*i+i},p=a[_t23+1].blockPosition;return _context34.abrupt(\"return\",f.map(function(t){return _objectSpread(_objectSpread({},t),{},{score:t.score*((null==u?void 0:u.lineCount)||0)/d});}));case 19:case\"end\":return _context34.stop();}},_callee31,this);}));function indexCov(_x43,_x44,_x45){return _indexCov.apply(this,arguments);}return indexCov;}()},{key:\"blocksForRange\",value:function(){var _blocksForRange=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee32(t,e,n){var r,i,o,s,a,u,l,_i14,_s15,_s15$_i,_t24,_e34,_n25,_t25,_iterator11,_step11,_e35,h,c,f,d,_t26,_e36,_args35=arguments;return _regeneratorRuntime().wrap(function _callee32$(_context35){while(1)switch(_context35.prev=_context35.next){case 0:r=_args35.length>3&&_args35[3]!==undefined?_args35[3]:{};e<0&&(e=0);_context35.next=4;return this.parse(r);case 4:i=_context35.sent;if(i){_context35.next=7;break;}return _context35.abrupt(\"return\",[]);case 7:o=i.indices[t];if(o){_context35.next=10;break;}return _context35.abrupt(\"return\",[]);case 10:s=(l=n,[[0,0],[1+((u=e)>>26),1+((l-=1)>>26)],[9+(u>>23),9+(l>>23)],[73+(u>>20),73+(l>>20)],[585+(u>>17),585+(l>>17)],[4681+(u>>14),4681+(l>>14)]]),a=[];for(_i14=0,_s15=s;_i14<_s15.length;_i14++){_s15$_i=_slicedToArray(_s15[_i14],2),_t24=_s15$_i[0],_e34=_s15$_i[1];for(_n25=_t24;_n25<=_e34;_n25++)if(o.binIndex[_n25]){_t25=o.binIndex[_n25];_iterator11=_createForOfIteratorHelper(_t25);try{for(_iterator11.s();!(_step11=_iterator11.n()).done;){_e35=_step11.value;a.push(_e35);}}catch(err){_iterator11.e(err);}finally{_iterator11.f();}}}h=o.linearIndex.length;f=Math.min(e>>14,h-1),d=Math.min(n>>14,h-1);for(_t26=f;_t26<=d;++_t26){_e36=o.linearIndex[_t26];_e36&&(!c||_e36.compareTo(c)<0)&&(c=_e36);}return _context35.abrupt(\"return\",oe(a,c));case 16:case\"end\":return _context35.stop();}},_callee32,this);}));function blocksForRange(_x46,_x47,_x48){return _blocksForRange.apply(this,arguments);}return blocksForRange;}()},{key:\"parse\",value:function(){var _parse3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee33(){var _this12=this;var t,_args36=arguments;return _regeneratorRuntime().wrap(function _callee33$(_context36){while(1)switch(_context36.prev=_context36.next){case 0:t=_args36.length>0&&_args36[0]!==undefined?_args36[0]:{};return _context36.abrupt(\"return\",(this.setupP||(this.setupP=this._parse(t)[\"catch\"](function(t){throw _this12.setupP=void 0,t;})),this.setupP));case 2:case\"end\":return _context36.stop();}},_callee33,this);}));function parse(){return _parse3.apply(this,arguments);}return parse;}()},{key:\"hasRefSeq\",value:function(){var _hasRefSeq=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee34(t){var e,n,_args37=arguments;return _regeneratorRuntime().wrap(function _callee34$(_context37){while(1)switch(_context37.prev=_context37.next){case 0:e=_args37.length>1&&_args37[1]!==undefined?_args37[1]:{};_context37.next=3;return this.parse(e);case 3:_context37.t1=t;_context37.t2=n=_context37.sent.indices[_context37.t1];_context37.t0=null===_context37.t2;if(_context37.t0){_context37.next=8;break;}_context37.t0=void 0===n;case 8:if(!_context37.t0){_context37.next=12;break;}_context37.t3=void 0;_context37.next=13;break;case 12:_context37.t3=n.binIndex;case 13:return _context37.abrupt(\"return\",!!_context37.t3);case 14:case\"end\":return _context37.stop();}},_callee34,this);}));function hasRefSeq(_x49){return _hasRefSeq.apply(this,arguments);}return hasRefSeq;}()}]);return he;}(le);var ce=n(8764);function fe(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,\"default\")?t[\"default\"]:t;}var de=new Int32Array([0,1996959894,3993919788,2567524794,124634137,1886057615,3915621685,2657392035,249268274,2044508324,3772115230,2547177864,162941995,2125561021,3887607047,2428444049,498536548,1789927666,4089016648,2227061214,450548861,1843258603,4107580753,2211677639,325883990,1684777152,4251122042,2321926636,335633487,1661365465,4195302755,2366115317,997073096,1281953886,3579855332,2724688242,1006888145,1258607687,3524101629,2768942443,901097722,1119000684,3686517206,2898065728,853044451,1172266101,3705015759,2882616665,651767980,1373503546,3369554304,3218104598,565507253,1454621731,3485111705,3099436303,671266974,1594198024,3322730930,2970347812,795835527,1483230225,3244367275,3060149565,1994146192,31158534,2563907772,4023717930,1907459465,112637215,2680153253,3904427059,2013776290,251722036,2517215374,3775830040,2137656763,141376813,2439277719,3865271297,1802195444,476864866,2238001368,4066508878,1812370925,453092731,2181625025,4111451223,1706088902,314042704,2344532202,4240017532,1658658271,366619977,2362670323,4224994405,1303535960,984961486,2747007092,3569037538,1256170817,1037604311,2765210733,3554079995,1131014506,879679996,2909243462,3663771856,1141124467,855842277,2852801631,3708648649,1342533948,654459306,3188396048,3373015174,1466479909,544179635,3110523913,3462522015,1591671054,702138776,2966460450,3352799412,1504918807,783551873,3082640443,3233442989,3988292384,2596254646,62317068,1957810842,3939845945,2647816111,81470997,1943803523,3814918930,2489596804,225274430,2053790376,3826175755,2466906013,167816743,2097651377,4027552580,2265490386,503444072,1762050814,4150417245,2154129355,426522225,1852507879,4275313526,2312317920,282753626,1742555852,4189708143,2394877945,397917763,1622183637,3604390888,2714866558,953729732,1340076626,3518719985,2797360999,1068828381,1219638859,3624741850,2936675148,906185462,1090812512,3747672003,2825379669,829329135,1181335161,3412177804,3160834842,628085408,1382605366,3423369109,3138078467,570562233,1426400815,3317316542,2998733608,733239954,1555261956,3268935591,3050360625,752459403,1541320221,2607071920,3965973030,1969922972,40735498,2617837225,3943577151,1913087877,83908371,2512341634,3803740692,2075208622,213261112,2463272603,3855990285,2094854071,198958881,2262029012,4057260610,1759359992,534414190,2176718541,4139329115,1873836001,414664567,2282248934,4279200368,1711684554,285281116,2405801727,4167216745,1634467795,376229701,2685067896,3608007406,1308918612,956543938,2808555105,3495958263,1231636301,1047427035,2932959818,3654703836,1088359270,936918e3,2847714899,3736837829,1202900863,817233897,3183342108,3401237130,1404277552,615818150,3134207493,3453421203,1423857449,601450431,3009837614,3294710456,1567103746,711928724,3020668471,3272380065,1510334235,755167117]);function pe(t){if(Buffer.isBuffer(t))return t;if(\"number\"==typeof t)return Buffer.alloc(t);if(\"string\"==typeof t)return Buffer.from(t);throw new Error(\"input must be buffer, number, or string, received \"+_typeof(t));}function ge(t,e){t=pe(t),Buffer.isBuffer(e)&&(e=e.readUInt32BE(0));var n=-1^~~e;for(var r=0;r<t.length;r++)n=de[255&(n^t[r])]^n>>>8;return-1^n;}function _e(){return function(t){var e=pe(4);return e.writeInt32BE(t,0),e;}(ge.apply(null,arguments));}_e.signed=function(){return ge.apply(null,arguments);},_e.unsigned=function(){return ge.apply(null,arguments)>>>0;};var me=fe(_e);var ve=n(1334),ye=n.n(ve);var be=/*#__PURE__*/function(){function be(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};_classCallCheck(this,be);this.baseOverrides={},this.url=t;var n=e.fetch||globalThis.fetch.bind(globalThis);if(!n)throw new TypeError(\"no fetch function supplied, and none found in global environment\");e.overrides&&(this.baseOverrides=e.overrides),this.fetchImplementation=n;}_createClass(be,[{key:\"getBufferFromResponse\",value:function(){var _getBufferFromResponse2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee35(t){var e;return _regeneratorRuntime().wrap(function _callee35$(_context38){while(1)switch(_context38.prev=_context38.next){case 0:_context38.next=2;return t.arrayBuffer();case 2:e=_context38.sent;return _context38.abrupt(\"return\",ce.lW.from(e));case 4:case\"end\":return _context38.stop();}},_callee35);}));function getBufferFromResponse(_x50){return _getBufferFromResponse2.apply(this,arguments);}return getBufferFromResponse;}()},{key:\"fetch\",value:function(){var _fetch3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee36(t,e){var n;return _regeneratorRuntime().wrap(function _callee36$(_context39){while(1)switch(_context39.prev=_context39.next){case 0:_context39.prev=0;_context39.next=3;return this.fetchImplementation(t,e);case 3:n=_context39.sent;_context39.next=14;break;case 6:_context39.prev=6;_context39.t0=_context39[\"catch\"](0);if(\"\".concat(_context39.t0).includes(\"Failed to fetch\")){_context39.next=10;break;}throw _context39.t0;case 10:console.warn(\"generic-filehandle: refetching \".concat(t,\" to attempt to work around chrome CORS header caching bug\"));_context39.next=13;return this.fetchImplementation(t,_objectSpread(_objectSpread({},e),{},{cache:\"reload\"}));case 13:n=_context39.sent;case 14:return _context39.abrupt(\"return\",n);case 15:case\"end\":return _context39.stop();}},_callee36,this,[[0,6]]);}));function fetch(_x51,_x52){return _fetch3.apply(this,arguments);}return fetch;}()},{key:\"read\",value:function(){var _read3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee37(t){var e,n,r,i,_i$headers2,o,s,_i$overrides2,a,u,l,_r23,_i15,_o10,_s16,_args40=arguments;return _regeneratorRuntime().wrap(function _callee37$(_context40){while(1)switch(_context40.prev=_context40.next){case 0:e=_args40.length>1&&_args40[1]!==undefined?_args40[1]:0;n=_args40.length>2?_args40[2]:undefined;r=_args40.length>3&&_args40[3]!==undefined?_args40[3]:0;i=_args40.length>4&&_args40[4]!==undefined?_args40[4]:{};_i$headers2=i.headers,o=_i$headers2===void 0?{}:_i$headers2,s=i.signal,_i$overrides2=i.overrides,a=_i$overrides2===void 0?{}:_i$overrides2;n<1/0?o.range=\"bytes=\".concat(r,\"-\").concat(r+n):n===1/0&&0!==r&&(o.range=\"bytes=\".concat(r,\"-\"));u=_objectSpread(_objectSpread(_objectSpread({},this.baseOverrides),a),{},{headers:_objectSpread(_objectSpread(_objectSpread({},o),a.headers),this.baseOverrides.headers),method:\"GET\",redirect:\"follow\",mode:\"cors\",signal:s});_context40.next=9;return this.fetch(this.url,u);case 9:l=_context40.sent;if(l.ok){_context40.next=12;break;}throw new Error(\"HTTP \".concat(l.status,\" \").concat(l.statusText,\" \").concat(this.url));case 12:if(!(200===l.status&&0===r||206===l.status)){_context40.next=20;break;}_context40.next=15;return this.getBufferFromResponse(l);case 15:_r23=_context40.sent;_i15=_r23.copy(t,e,0,Math.min(n,_r23.length));_o10=l.headers.get(\"content-range\");_s16=/\\/(\\d+)$/.exec(_o10||\"\");return _context40.abrupt(\"return\",((null==_s16?void 0:_s16[1])&&(this._stat={size:parseInt(_s16[1],10)}),{bytesRead:_i15,buffer:t}));case 20:if(!(200===l.status)){_context40.next=22;break;}throw new Error(\"${this.url} fetch returned status 200, expected 206\");case 22:throw new Error(\"HTTP \".concat(l.status,\" fetching \").concat(this.url));case 23:case\"end\":return _context40.stop();}},_callee37,this);}));function read(_x53){return _read3.apply(this,arguments);}return read;}()},{key:\"readFile\",value:function(){var _readFile2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee38(){var t,e,n,_n26,_n26$headers,r,i,_n26$overrides,o,s,a,_args41=arguments;return _regeneratorRuntime().wrap(function _callee38$(_context41){while(1)switch(_context41.prev=_context41.next){case 0:t=_args41.length>0&&_args41[0]!==undefined?_args41[0]:{};\"string\"==typeof t?(e=t,n={}):(e=t.encoding,n=t,delete n.encoding);_n26=n;_n26$headers=_n26.headers;r=_n26$headers===void 0?{}:_n26$headers;i=_n26.signal;_n26$overrides=_n26.overrides;o=_n26$overrides===void 0?{}:_n26$overrides;s=_objectSpread(_objectSpread({headers:r,method:\"GET\",redirect:\"follow\",mode:\"cors\",signal:i},this.baseOverrides),o);_context41.next=11;return this.fetch(this.url,s);case 11:a=_context41.sent;if(a){_context41.next=14;break;}throw new Error(\"generic-filehandle failed to fetch\");case 14:if(!(200!==a.status)){_context41.next=16;break;}throw Object.assign(new Error(\"HTTP \".concat(a.status,\" fetching \").concat(this.url)),{status:a.status});case 16:if(!(\"utf8\"===e)){_context41.next=18;break;}return _context41.abrupt(\"return\",a.text());case 18:if(!e){_context41.next=20;break;}throw new Error(\"unsupported encoding: \".concat(e));case 20:return _context41.abrupt(\"return\",this.getBufferFromResponse(a));case 21:case\"end\":return _context41.stop();}},_callee38,this);}));function readFile(){return _readFile2.apply(this,arguments);}return readFile;}()},{key:\"stat\",value:function(){var _stat3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee39(){var _t27;return _regeneratorRuntime().wrap(function _callee39$(_context42){while(1)switch(_context42.prev=_context42.next){case 0:if(this._stat){_context42.next=6;break;}_t27=ce.lW.allocUnsafe(10);_context42.next=4;return this.read(_t27,0,10,0);case 4:if(this._stat){_context42.next=6;break;}throw new Error(\"unable to determine size of file at \".concat(this.url));case 6:return _context42.abrupt(\"return\",this._stat);case 7:case\"end\":return _context42.stop();}},_callee39,this);}));function stat(){return _stat3.apply(this,arguments);}return stat;}()},{key:\"close\",value:function(){var _close2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee40(){return _regeneratorRuntime().wrap(function _callee40$(_context43){while(1)switch(_context43.prev=_context43.next){case 0:case\"end\":return _context43.stop();}},_callee40);}));function close(){return _close2.apply(this,arguments);}return close;}()}]);return be;}();var we=n(9777);function xe(_x54){return _xe.apply(this,arguments);}function _xe(){_xe=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee70(t){var _e158,_n129,_r103,_i83,_o59,_s53,_o60,_a28,_a29,_t145,_e159;return _regeneratorRuntime().wrap(function _callee70$(_context74){while(1)switch(_context74.prev=_context74.next){case 0:_context74.prev=0;_n129=0,_r103=0;_i83=[];_s53=0;case 4:_a28=t.subarray(_n129);if(!(_o59=new we.Inflate(),(_o60=_o59,_e158=_o60.strm),_o59.push(_a28,we.Z_SYNC_FLUSH),_o59.err)){_context74.next=7;break;}throw new Error(_o59.msg);case 7:_n129+=_e158.next_in,_i83[_r103]=_o59.result,_s53+=_i83[_r103].length,_r103+=1;case 8:if(_e158.avail_in){_context74.next=4;break;}case 9:_a29=new Uint8Array(_s53);for(_t145=0,_e159=0;_t145<_i83.length;_t145++)_a29.set(_i83[_t145],_e159),_e159+=_i83[_t145].length;return _context74.abrupt(\"return\",ce.lW.from(_a29));case 14:_context74.prev=14;_context74.t0=_context74[\"catch\"](0);if(!\"\".concat(_context74.t0).match(/incorrect header check/)){_context74.next=18;break;}throw new Error(\"problem decompressing block: incorrect gzip header check\");case 18:throw _context74.t0;case 19:case\"end\":return _context74.stop();}},_callee70,null,[[0,14]]);}));return _xe.apply(this,arguments);}var ke=n(5237),Ae=n.n(ke),Ee=n(7298),Se=n.n(Ee);function Me(t,e){return Math.floor(t/Math.pow(2,e));}var Be=/*#__PURE__*/function(_le2){_inherits(Be,_le2);var _super4=_createSuper(Be);function Be(){var _this13;_classCallCheck(this,Be);_this13=_super4.apply(this,arguments),_this13.maxBinNumber=0,_this13.depth=0,_this13.minShift=0;return _this13;}_createClass(Be,[{key:\"lineCount\",value:function(){var _lineCount2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee41(t,e){var n,r;return _regeneratorRuntime().wrap(function _callee41$(_context44){while(1)switch(_context44.prev=_context44.next){case 0:_context44.next=2;return this.parse(e);case 2:_context44.t3=t;_context44.t4=n=_context44.sent.indices[_context44.t3];_context44.t2=null===_context44.t4;if(_context44.t2){_context44.next=7;break;}_context44.t2=void 0===n;case 7:if(!_context44.t2){_context44.next=11;break;}_context44.t5=void 0;_context44.next=12;break;case 11:_context44.t5=n.stats;case 12:_context44.t6=r=_context44.t5;_context44.t1=null===_context44.t6;if(_context44.t1){_context44.next=16;break;}_context44.t1=void 0===r;case 16:if(!_context44.t1){_context44.next=20;break;}_context44.t7=void 0;_context44.next=21;break;case 20:_context44.t7=r.lineCount;case 21:_context44.t0=_context44.t7;if(_context44.t0){_context44.next=24;break;}_context44.t0=0;case 24:return _context44.abrupt(\"return\",_context44.t0);case 25:case\"end\":return _context44.stop();}},_callee41,this);}));function lineCount(_x55,_x56){return _lineCount2.apply(this,arguments);}return lineCount;}()},{key:\"indexCov\",value:function(){var _indexCov2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee42(){return _regeneratorRuntime().wrap(function _callee42$(_context45){while(1)switch(_context45.prev=_context45.next){case 0:return _context45.abrupt(\"return\",[]);case 1:case\"end\":return _context45.stop();}},_callee42);}));function indexCov(){return _indexCov2.apply(this,arguments);}return indexCov;}()},{key:\"parseAuxData\",value:function parseAuxData(t,e){var n=t.readInt32LE(e),r=65536&n?\"zero-based-half-open\":\"1-based-closed\",i={0:\"generic\",1:\"SAM\",2:\"VCF\"}[15&n];if(!i)throw new Error(\"invalid Tabix preset format flags \".concat(n));var o={ref:t.readInt32LE(e+4),start:t.readInt32LE(e+8),end:t.readInt32LE(e+12)},s=t.readInt32LE(e+16),a=s?String.fromCharCode(s):\"\",u=t.readInt32LE(e+20),l=t.readInt32LE(e+24);return _objectSpread({columnNumbers:o,coordinateType:r,metaValue:s,metaChar:a,skipLines:u,format:i,formatFlags:n},ue(t.subarray(e+28,e+28+l),this.renameRefSeq));}},{key:\"_parse\",value:function(){var _parse4=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee43(t){var e,n,r,i,o,s,a,u,l,_t28,_e37,_r24,_i16,_t29,_t30,_e38,_i17,_r25,_e39,_o11;return _regeneratorRuntime().wrap(function _callee43$(_context46){while(1)switch(_context46.prev=_context46.next){case 0:_context46.next=2;return this.filehandle.readFile(t);case 2:e=_context46.sent;_context46.next=5;return xe(e);case 5:n=_context46.sent;if(!(21582659===n.readUInt32LE(0))){_context46.next=10;break;}r=1;_context46.next=13;break;case 10:if(!(38359875!==n.readUInt32LE(0))){_context46.next=12;break;}throw new Error(\"Not a CSI file\");case 12:r=2;case 13:this.minShift=n.readInt32LE(4),this.depth=n.readInt32LE(8),this.maxBinNumber=((1<<3*(this.depth+1))-1)/7;i=n.readInt32LE(12),o=i>=30?this.parseAuxData(n,16):void 0,s=n.readInt32LE(16+i);u=16+i+4;l=new Array(s);for(_t28=0;_t28<s;_t28++){_e37=n.readInt32LE(u);u+=4;_r24={};_i16=void 0;for(_t29=0;_t29<_e37;_t29++){_t30=n.readUInt32LE(u);if(u+=4,_t30>this.maxBinNumber)_i16=se(n,u+28),u+=44;else{a=ae(a,te(n,u)),u+=8;_e38=n.readInt32LE(u);u+=4;_i17=new Array(_e38);for(_r25=0;_r25<_e38;_r25+=1){_e39=te(n,u);u+=8;_o11=te(n,u);u+=8,a=ae(a,_e39),_i17[_r25]=new ee(_e39,_o11,_t30);}_r24[_t30]=_i17;}}l[_t28]={binIndex:_r24,stats:_i16};}return _context46.abrupt(\"return\",_objectSpread({csiVersion:r,firstDataLine:a,indices:l,refCount:s,csi:!0,maxBlockSize:65536},o));case 19:case\"end\":return _context46.stop();}},_callee43,this);}));function _parse(_x57){return _parse4.apply(this,arguments);}return _parse;}()},{key:\"blocksForRange\",value:function(){var _blocksForRange2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee44(t,e,n){var r,i,o,s,a,_iterator12,_step12,_step12$value,_t31,_e40,_n27,_t32,_iterator13,_step13,_e41,_args47=arguments;return _regeneratorRuntime().wrap(function _callee44$(_context47){while(1)switch(_context47.prev=_context47.next){case 0:r=_args47.length>3&&_args47[3]!==undefined?_args47[3]:{};e<0&&(e=0);_context47.next=4;return this.parse(r);case 4:i=_context47.sent;o=null==i?void 0:i.indices[t];if(o){_context47.next=8;break;}return _context47.abrupt(\"return\",[]);case 8:s=this.reg2bins(e,n);if(!(0===s.length)){_context47.next=11;break;}return _context47.abrupt(\"return\",[]);case 11:a=[];_iterator12=_createForOfIteratorHelper(s);try{for(_iterator12.s();!(_step12=_iterator12.n()).done;){_step12$value=_slicedToArray(_step12.value,2),_t31=_step12$value[0],_e40=_step12$value[1];for(_n27=_t31;_n27<=_e40;_n27++)if(o.binIndex[_n27]){_t32=o.binIndex[_n27];_iterator13=_createForOfIteratorHelper(_t32);try{for(_iterator13.s();!(_step13=_iterator13.n()).done;){_e41=_step13.value;a.push(_e41);}}catch(err){_iterator13.e(err);}finally{_iterator13.f();}}}}catch(err){_iterator12.e(err);}finally{_iterator12.f();}return _context47.abrupt(\"return\",oe(a,new Qt(0,0)));case 15:case\"end\":return _context47.stop();}},_callee44,this);}));function blocksForRange(_x58,_x59,_x60){return _blocksForRange2.apply(this,arguments);}return blocksForRange;}()},{key:\"reg2bins\",value:function reg2bins(t,e){(t-=1)<1&&(t=1),e>Math.pow(2,50)&&(e=Math.pow(2,34)),e-=1;var n=0,r=0,i=this.minShift+3*this.depth;var o=[];for(;n<=this.depth;i-=3,r+=1*Math.pow(2,3*n),n+=1){var _n28=r+Me(t,i),_s17=r+Me(e,i);if(_s17-_n28+o.length>this.maxBinNumber)throw new Error(\"query \".concat(t,\"-\").concat(e,\" is too large for current binning scheme (shift \").concat(this.minShift,\", depth \").concat(this.depth,\"), try a smaller query or a coarser index binning scheme\"));o.push([_n28,_s17]);}return o;}},{key:\"parse\",value:function(){var _parse5=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee45(){var _this14=this;var t,_args48=arguments;return _regeneratorRuntime().wrap(function _callee45$(_context48){while(1)switch(_context48.prev=_context48.next){case 0:t=_args48.length>0&&_args48[0]!==undefined?_args48[0]:{};return _context48.abrupt(\"return\",(this.setupP||(this.setupP=this._parse(t)[\"catch\"](function(t){throw _this14.setupP=void 0,t;})),this.setupP));case 2:case\"end\":return _context48.stop();}},_callee45,this);}));function parse(){return _parse5.apply(this,arguments);}return parse;}()},{key:\"hasRefSeq\",value:function(){var _hasRefSeq2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee46(t){var e,n,_args49=arguments;return _regeneratorRuntime().wrap(function _callee46$(_context49){while(1)switch(_context49.prev=_context49.next){case 0:e=_args49.length>1&&_args49[1]!==undefined?_args49[1]:{};_context49.next=3;return this.parse(e);case 3:_context49.t1=t;_context49.t2=n=_context49.sent.indices[_context49.t1];_context49.t0=null===_context49.t2;if(_context49.t0){_context49.next=8;break;}_context49.t0=void 0===n;case 8:if(!_context49.t0){_context49.next=12;break;}_context49.t3=void 0;_context49.next=13;break;case 12:_context49.t3=n.binIndex;case 13:return _context49.abrupt(\"return\",!!_context49.t3);case 14:case\"end\":return _context49.stop();}},_callee46,this);}));function hasRefSeq(_x61){return _hasRefSeq2.apply(this,arguments);}return hasRefSeq;}()}]);return Be;}(le);var Te=\"=ACMGRSVTWYHKDBN\".split(\"\"),ze=\"MIDNSHP=X???????\".split(\"\");var Ce=/*#__PURE__*/function(){function Ce(t){_classCallCheck(this,Ce);this.data={},this._tagList=[],this._allTagsParsed=!1;var e=t.bytes,n=t.fileOffset,r=e.byteArray,i=e.start;this.data={},this.bytes=e,this._id=n,this._refID=r.readInt32LE(i+4),this.data.start=r.readInt32LE(i+8),this.flags=(4294901760&r.readInt32LE(i+16))>>16;}_createClass(Ce,[{key:\"get\",value:function get(t){return this[t]?(this.data[t]||(this.data[t]=this[t]()),this.data[t]):this._get(t.toLowerCase());}},{key:\"end\",value:function end(){return this.get(\"start\")+this.get(\"length_on_ref\");}},{key:\"seq_id\",value:function seq_id(){return this._refID;}},{key:\"_get\",value:function _get(t){return t in this.data||(this.data[t]=this._parseTag(t)),this.data[t];}},{key:\"_tags\",value:function _tags(){var _this15=this;this._parseAllTags();var t=[\"seq\"];this.isSegmentUnmapped()||t.push(\"start\",\"end\",\"strand\",\"score\",\"qual\",\"MQ\",\"CIGAR\",\"length_on_ref\",\"template_length\"),this.isPaired()&&t.push(\"next_segment_position\",\"pair_orientation\"),t=t.concat(this._tagList||[]);for(var _i18=0,_Object$keys=Object.keys(this.data);_i18<_Object$keys.length;_i18++){var _e42=_Object$keys[_i18];_e42.startsWith(\"_\")||\"next_seq_id\"===_e42||t.push(_e42);}var e={};return t.filter(function(t){if(t in _this15.data&&void 0===_this15.data[t]||\"CG\"===t||\"cg\"===t)return!1;var n=t.toLowerCase(),r=e[n];return e[n]=!0,!r;});}},{key:\"parent\",value:function parent(){}},{key:\"children\",value:function children(){return this.get(\"subfeatures\");}},{key:\"id\",value:function id(){return this._id;}},{key:\"mq\",value:function mq(){var t=(65280&this.get(\"_bin_mq_nl\"))>>8;return 255===t?void 0:t;}},{key:\"score\",value:function score(){return this.get(\"mq\");}},{key:\"qual\",value:function qual(){var t;return null===(t=this.qualRaw())||void 0===t?void 0:t.join(\" \");}},{key:\"qualRaw\",value:function qualRaw(){if(this.isSegmentUnmapped())return;var _this$bytes=this.bytes,t=_this$bytes.start,e=_this$bytes.byteArray,n=t+36+this.get(\"_l_read_name\")+4*this.get(\"_n_cigar_op\")+this.get(\"_seq_bytes\"),r=this.get(\"seq_length\");return e.subarray(n,n+r);}},{key:\"strand\",value:function strand(){return this.isReverseComplemented()?-1:1;}},{key:\"multi_segment_next_segment_strand\",value:function multi_segment_next_segment_strand(){if(!this.isMateUnmapped())return this.isMateReverseComplemented()?-1:1;}},{key:\"name\",value:function name(){return this.get(\"_read_name\");}},{key:\"_read_name\",value:function _read_name(){var t=this.get(\"_l_read_name\"),_this$bytes2=this.bytes,e=_this$bytes2.byteArray,n=_this$bytes2.start;return e.toString(\"ascii\",n+36,n+36+t-1);}},{key:\"_parseTag\",value:function _parseTag(t){if(this._allTagsParsed)return;var _this$bytes3=this.bytes,e=_this$bytes3.byteArray,n=_this$bytes3.start;var r=this._tagOffset||n+36+this.get(\"_l_read_name\")+4*this.get(\"_n_cigar_op\")+this.get(\"_seq_bytes\")+this.get(\"seq_length\");var i=this.bytes.end;var o;for(;r<i&&o!==t;){var _n29=String.fromCharCode(e[r],e[r+1]);o=_n29.toLowerCase();var _s18=String.fromCharCode(e[r+2]);var _a9=void 0;switch(r+=3,_s18){case\"A\":_a9=String.fromCharCode(e[r]),r+=1;break;case\"i\":_a9=e.readInt32LE(r),r+=4;break;case\"I\":_a9=e.readUInt32LE(r),r+=4;break;case\"c\":_a9=e.readInt8(r),r+=1;break;case\"C\":_a9=e.readUInt8(r),r+=1;break;case\"s\":_a9=e.readInt16LE(r),r+=2;break;case\"S\":_a9=e.readUInt16LE(r),r+=2;break;case\"f\":_a9=e.readFloatLE(r),r+=4;break;case\"Z\":case\"H\":for(_a9=\"\";r<=i;){var _t33=e[r++];if(0===_t33)break;_a9+=String.fromCharCode(_t33);}break;case\"B\":{_a9=\"\";var _t34=e[r++],_i19=String.fromCharCode(_t34),_o12=e.readInt32LE(r);if(r+=4,\"i\"===_i19)if(\"CG\"===_n29)for(var _t35=0;_t35<_o12;_t35++){var _t36=e.readInt32LE(r);_a9+=(_t36>>4)+ze[15&_t36],r+=4;}else for(var _t37=0;_t37<_o12;_t37++)_a9+=e.readInt32LE(r),_t37+1<_o12&&(_a9+=\",\"),r+=4;if(\"I\"===_i19)if(\"CG\"===_n29)for(var _t38=0;_t38<_o12;_t38++){var _t39=e.readUInt32LE(r);_a9+=(_t39>>4)+ze[15&_t39],r+=4;}else for(var _t40=0;_t40<_o12;_t40++)_a9+=e.readUInt32LE(r),_t40+1<_o12&&(_a9+=\",\"),r+=4;if(\"s\"===_i19)for(var _t41=0;_t41<_o12;_t41++)_a9+=e.readInt16LE(r),_t41+1<_o12&&(_a9+=\",\"),r+=2;if(\"S\"===_i19)for(var _t42=0;_t42<_o12;_t42++)_a9+=e.readUInt16LE(r),_t42+1<_o12&&(_a9+=\",\"),r+=2;if(\"c\"===_i19)for(var _t43=0;_t43<_o12;_t43++)_a9+=e.readInt8(r),_t43+1<_o12&&(_a9+=\",\"),r+=1;if(\"C\"===_i19)for(var _t44=0;_t44<_o12;_t44++)_a9+=e.readUInt8(r),_t44+1<_o12&&(_a9+=\",\"),r+=1;if(\"f\"===_i19)for(var _t45=0;_t45<_o12;_t45++)_a9+=e.readFloatLE(r),_t45+1<_o12&&(_a9+=\",\"),r+=4;break;}default:console.warn(\"Unknown BAM tag type '\".concat(_s18,\"', tags may be incomplete\")),_a9=void 0,r=i;}if(this._tagOffset=r,this._tagList.push(_n29),o===t)return _a9;this.data[o]=_a9;}this._allTagsParsed=!0;}},{key:\"_parseAllTags\",value:function _parseAllTags(){this._parseTag(\"\");}},{key:\"_parseCigar\",value:function _parseCigar(t){return t.match(/\\d+\\D/g).map(function(t){return[t.match(/\\D/)[0].toUpperCase(),Number.parseInt(t,10)];});}},{key:\"isPaired\",value:function isPaired(){return!!(1&this.flags);}},{key:\"isProperlyPaired\",value:function isProperlyPaired(){return!!(2&this.flags);}},{key:\"isSegmentUnmapped\",value:function isSegmentUnmapped(){return!!(4&this.flags);}},{key:\"isMateUnmapped\",value:function isMateUnmapped(){return!!(8&this.flags);}},{key:\"isReverseComplemented\",value:function isReverseComplemented(){return!!(16&this.flags);}},{key:\"isMateReverseComplemented\",value:function isMateReverseComplemented(){return!!(32&this.flags);}},{key:\"isRead1\",value:function isRead1(){return!!(64&this.flags);}},{key:\"isRead2\",value:function isRead2(){return!!(128&this.flags);}},{key:\"isSecondary\",value:function isSecondary(){return!!(256&this.flags);}},{key:\"isFailedQc\",value:function isFailedQc(){return!!(512&this.flags);}},{key:\"isDuplicate\",value:function isDuplicate(){return!!(1024&this.flags);}},{key:\"isSupplementary\",value:function isSupplementary(){return!!(2048&this.flags);}},{key:\"cigar\",value:function cigar(){if(this.isSegmentUnmapped())return;var _this$bytes4=this.bytes,t=_this$bytes4.byteArray,e=_this$bytes4.start,n=this.get(\"_n_cigar_op\");var r=e+36+this.get(\"_l_read_name\");var i=this.get(\"seq_length\");var o=\"\",s=0,a=t.readInt32LE(r),u=a>>4,l=ze[15&a];if(\"S\"===l&&u===i)return r+=4,a=t.readInt32LE(r),u=a>>4,l=ze[15&a],\"N\"!==l&&console.warn(\"CG tag with no N tag\"),this.data.length_on_ref=u,this.get(\"CG\");for(var _e43=0;_e43<n;++_e43)a=t.readInt32LE(r),u=a>>4,l=ze[15&a],o+=u+l,\"H\"!==l&&\"S\"!==l&&\"I\"!==l&&(s+=u),r+=4;return this.data.length_on_ref=s,o;}},{key:\"length_on_ref\",value:function length_on_ref(){return this.data.length_on_ref||this.get(\"cigar\"),this.data.length_on_ref;}},{key:\"_n_cigar_op\",value:function _n_cigar_op(){return 65535&this.get(\"_flag_nc\");}},{key:\"_l_read_name\",value:function _l_read_name(){return 255&this.get(\"_bin_mq_nl\");}},{key:\"_seq_bytes\",value:function _seq_bytes(){return this.get(\"seq_length\")+1>>1;}},{key:\"getReadBases\",value:function getReadBases(){return this.seq();}},{key:\"seq\",value:function seq(){var _this$bytes5=this.bytes,t=_this$bytes5.byteArray,e=_this$bytes5.start,n=e+36+this.get(\"_l_read_name\")+4*this.get(\"_n_cigar_op\"),r=this.get(\"_seq_bytes\"),i=this.get(\"seq_length\");var o=\"\",s=0;for(var _e44=0;_e44<r;++_e44){var _r26=t[n+_e44];o+=Te[(240&_r26)>>4],s++,s<i&&(o+=Te[15&_r26],s++);}return o;}},{key:\"getPairOrientation\",value:function getPairOrientation(){if(!this.isSegmentUnmapped()&&!this.isMateUnmapped()&&this._refID===this._next_refid()){var _t46=this.isReverseComplemented()?\"R\":\"F\",_e45=this.isMateReverseComplemented()?\"R\":\"F\";var n=\" \",r=\" \";this.isRead1()?(n=\"1\",r=\"2\"):this.isRead2()&&(n=\"2\",r=\"1\");var _i20=[];return this.template_length()>0?(_i20[0]=_t46,_i20[1]=n,_i20[2]=_e45,_i20[3]=r):(_i20[2]=_t46,_i20[3]=n,_i20[0]=_e45,_i20[1]=r),_i20.join(\"\");}return\"\";}},{key:\"_bin_mq_nl\",value:function _bin_mq_nl(){return this.bytes.byteArray.readInt32LE(this.bytes.start+12);}},{key:\"_flag_nc\",value:function _flag_nc(){return this.bytes.byteArray.readInt32LE(this.bytes.start+16);}},{key:\"seq_length\",value:function seq_length(){return this.bytes.byteArray.readInt32LE(this.bytes.start+20);}},{key:\"_next_refid\",value:function _next_refid(){return this.bytes.byteArray.readInt32LE(this.bytes.start+24);}},{key:\"_next_pos\",value:function _next_pos(){return this.bytes.byteArray.readInt32LE(this.bytes.start+28);}},{key:\"template_length\",value:function template_length(){return this.bytes.byteArray.readInt32LE(this.bytes.start+32);}},{key:\"toJSON\",value:function toJSON(){var t={};for(var _i21=0,_Object$keys2=Object.keys(this);_i21<_Object$keys2.length;_i21++){var _e46=_Object$keys2[_i21];_e46.startsWith(\"_\")||\"bytes\"===_e46||(t[_e46]=this[_e46]);}return t;}}]);return Ce;}();var Ne=/*#__PURE__*/function(){function Ne(){_classCallCheck(this,Ne);}_createClass(Ne,[{key:\"read\",value:function read(){throw new Error(\"never called\");}},{key:\"stat\",value:function stat(){throw new Error(\"never called\");}},{key:\"readFile\",value:function readFile(){throw new Error(\"never called\");}},{key:\"close\",value:function close(){throw new Error(\"never called\");}}]);return Ne;}();var Ie=/*#__PURE__*/function(){function Ie(_ref19){var _this16=this;var t=_ref19.bamFilehandle,e=_ref19.bamPath,n=_ref19.bamUrl,r=_ref19.baiPath,i=_ref19.baiFilehandle,o=_ref19.baiUrl,s=_ref19.csiPath,a=_ref19.csiFilehandle,u=_ref19.csiUrl,l=_ref19.htsget,_ref19$yieldThreadTim=_ref19.yieldThreadTime,h=_ref19$yieldThreadTim===void 0?100:_ref19$yieldThreadTim,_ref19$renameRefSeqs=_ref19.renameRefSeqs,c=_ref19$renameRefSeqs===void 0?function(t){return t;}:_ref19$renameRefSeqs;_classCallCheck(this,Ie);if(this.htsget=!1,this.featureCache=new(Ae())({cache:new(Se())({maxSize:50}),fill:function(){var _fill=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee47(t,e){var n,r,_yield$_this16$_readC,i,o,s;return _regeneratorRuntime().wrap(function _callee47$(_context50){while(1)switch(_context50.prev=_context50.next){case 0:n=t.chunk;r=t.opts;_context50.next=4;return _this16._readChunk({chunk:n,opts:_objectSpread(_objectSpread({},r),{},{signal:e})});case 4:_yield$_this16$_readC=_context50.sent;i=_yield$_this16$_readC.data;o=_yield$_this16$_readC.cpositions;s=_yield$_this16$_readC.dpositions;return _context50.abrupt(\"return\",_this16.readBamFeatures(i,o,s,n));case 9:case\"end\":return _context50.stop();}},_callee47);}));function fill(_x62,_x63){return _fill.apply(this,arguments);}return fill;}()}),this.renameRefSeq=c,t)this.bam=t;else if(e)this.bam=new(ye())(e);else if(n){var _t47=new URL(n),_e47=_t47.username,_r27=_t47.password;_e47&&_r27?(n=\"\".concat(_t47.protocol,\"//\").concat(_t47.host).concat(_t47.pathname).concat(_t47.search),this.bam=new be(n,{overrides:{credentials:\"include\",headers:{Authorization:\"Basic \"+btoa(_e47+\":\"+_r27)}}})):this.bam=new be(n);}else{if(!l)throw new Error(\"unable to initialize bam\");this.htsget=!0,this.bam=new Ne();}if(a)this.index=new Be({filehandle:a});else if(s)this.index=new Be({filehandle:new(ye())(s)});else if(u)this.index=new Be({filehandle:new be(u)});else if(i)this.index=new he({filehandle:i});else if(r)this.index=new he({filehandle:new(ye())(r)});else if(o){var _t48=new URL(o),_e48=_t48.username,_n30=_t48.password;_e48&&_n30?(o=\"\".concat(_t48.protocol,\"//\").concat(_t48.host).concat(_t48.pathname).concat(_t48.search),this.index=new he({filehandle:new be(o,{overrides:{credentials:\"include\",headers:{Authorization:\"Basic \"+btoa(_e48+\":\"+_n30)}}})})):this.index=new he({filehandle:new be(o)});}else if(e)this.index=new he({filehandle:new(ye())(\"\".concat(e,\".bai\"))});else if(n){var _t49=new URL(n),_e49=_t49.username,_r28=_t49.password;if(_e49&&_r28){var _n31=\"\".concat(_t49.protocol,\"//\").concat(_t49.host).concat(_t49.pathname,\".bai\").concat(_t49.search);this.index=new he({filehandle:new be(_n31,{overrides:{credentials:\"include\",headers:{Authorization:\"Basic \"+btoa(_e49+\":\"+_r28)}}})});}else this.index=new he({filehandle:new be(\"\".concat(n,\".bai\"))});}else{if(!l)throw new Error(\"unable to infer index format\");this.htsget=!0;}this.yieldThreadTime=h;}_createClass(Ie,[{key:\"getHeaderPre\",value:function(){var _getHeaderPre=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee48(t){var e,n,r,i,_t50,_n32,o,s,_yield$this$_readRefS,a,u;return _regeneratorRuntime().wrap(function _callee48$(_context51){while(1)switch(_context51.prev=_context51.next){case 0:e=function(){var t=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};return\"aborted\"in t?{signal:t}:t;}(t);if(!(e.assemblyName&&\"hg38\"===e.assemblyName)){_context51.next=3;break;}return _context51.abrupt(\"return\",(this.chrToIndex={chr1:0,chr10:1,chr11:2,chr12:3,chr13:4,chr14:5,chr15:6,chr16:7,chr17:8,chr18:9,chr19:10,chr2:11,chr20:12,chr21:13,chr22:14,chr3:15,chr4:16,chr5:17,chr6:18,chr7:19,chr8:20,chr9:21,chrM:22,chrX:23,chrY:24},void(this.indexToChr=[{refName:\"chr1\",length:248956422},{refName:\"chr10\",length:133797422},{refName:\"chr11\",length:135086622},{refName:\"chr12\",length:133275309},{refName:\"chr13\",length:114364328},{refName:\"chr14\",length:107043718},{refName:\"chr15\",length:101991189},{refName:\"chr16\",length:90338345},{refName:\"chr17\",length:83257441},{refName:\"chr18\",length:80373285},{refName:\"chr19\",length:58617616},{refName:\"chr2\",length:242193529},{refName:\"chr20\",length:64444167},{refName:\"chr21\",length:46709983},{refName:\"chr22\",length:50818468},{refName:\"chr3\",length:198295559},{refName:\"chr4\",length:190214555},{refName:\"chr5\",length:181538259},{refName:\"chr6\",length:170805979},{refName:\"chr7\",length:159345973},{refName:\"chr8\",length:145138636},{refName:\"chr9\",length:138394717},{refName:\"chrM\",length:16569},{refName:\"chrX\",length:156040895},{refName:\"chrY\",length:57227415}])));case 3:if(this.index){_context51.next=5;break;}return _context51.abrupt(\"return\");case 5:_context51.next=7;return this.index.parse(e);case 7:n=_context51.sent;r=n.firstDataLine?n.firstDataLine.blockPosition+65535:void 0;if(!r){_context51.next=19;break;}_t50=r+65536;_context51.next=13;return this.bam.read(ce.lW.alloc(_t50),0,_t50,0,e);case 13:_n32=_context51.sent;if(_n32.bytesRead){_context51.next=16;break;}throw new Error(\"Error reading header\");case 16:i=_n32.buffer.subarray(0,Math.min(_n32.bytesRead,r));_context51.next=22;break;case 19:_context51.next=21;return this.bam.readFile(e);case 21:i=_context51.sent;case 22:_context51.next=24;return xe(i);case 24:o=_context51.sent;if(!(21840194!==o.readInt32LE(0))){_context51.next=27;break;}throw new Error(\"Not a BAM file\");case 27:s=o.readInt32LE(4);this.header=o.toString(\"utf8\",8,8+s);_context51.next=31;return this._readRefSeqs(s+8,65535,e);case 31:_yield$this$_readRefS=_context51.sent;a=_yield$this$_readRefS.chrToIndex;u=_yield$this$_readRefS.indexToChr;return _context51.abrupt(\"return\",(this.chrToIndex=a,this.indexToChr=u,function(t){var e=t.split(/\\r?\\n/),n=[];var _iterator14=_createForOfIteratorHelper(e),_step14;try{for(_iterator14.s();!(_step14=_iterator14.n()).done;){var _t51=_step14.value;var _t51$split=_t51.split(/\\t/),_t51$split2=_toArray(_t51$split),_e50=_t51$split2[0],_r29=_t51$split2.slice(1);_e50&&n.push({tag:_e50.slice(1),data:_r29.map(function(t){var e=t.indexOf(\":\");return{tag:t.slice(0,e),value:t.slice(e+1)};})});}}catch(err){_iterator14.e(err);}finally{_iterator14.f();}return n;}(this.header)));case 35:case\"end\":return _context51.stop();}},_callee48,this);}));function getHeaderPre(_x64){return _getHeaderPre.apply(this,arguments);}return getHeaderPre;}()},{key:\"getHeader\",value:function getHeader(t){var _this17=this;return this.headerP||(this.headerP=this.getHeaderPre(t)[\"catch\"](function(t){throw _this17.headerP=void 0,t;})),this.headerP;}},{key:\"getHeaderText\",value:function(){var _getHeaderText=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee49(){var t,_args52=arguments;return _regeneratorRuntime().wrap(function _callee49$(_context52){while(1)switch(_context52.prev=_context52.next){case 0:t=_args52.length>0&&_args52[0]!==undefined?_args52[0]:{};_context52.next=3;return this.getHeader(t);case 3:return _context52.abrupt(\"return\",this.header);case 4:case\"end\":return _context52.stop();}},_callee49,this);}));function getHeaderText(){return _getHeaderText.apply(this,arguments);}return getHeaderText;}()},{key:\"_readRefSeqs\",value:function(){var _readRefSeqs2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee50(t,e,n){var r,_yield$this$bam$read,i,o,s,a,u,l,h,_r30,_i22,_o13,_a10;return _regeneratorRuntime().wrap(function _callee50$(_context53){while(1)switch(_context53.prev=_context53.next){case 0:if(!(t>e)){_context53.next=2;break;}return _context53.abrupt(\"return\",this._readRefSeqs(t,2*e,n));case 2:r=e+65536;_context53.next=5;return this.bam.read(ce.lW.alloc(r),0,e,0,n);case 5:_yield$this$bam$read=_context53.sent;i=_yield$this$bam$read.bytesRead;o=_yield$this$bam$read.buffer;if(i){_context53.next=10;break;}throw new Error(\"Error reading refseqs from header\");case 10:_context53.next=12;return xe(o.subarray(0,Math.min(i,e)));case 12:s=_context53.sent;a=s.readInt32LE(t);u=t+4;l={},h=[];_r30=0;case 17:if(!(_r30<a)){_context53.next=24;break;}_i22=s.readInt32LE(u),_o13=this.renameRefSeq(s.toString(\"utf8\",u+4,u+4+_i22-1)),_a10=s.readInt32LE(u+_i22+4);if(!(l[_o13]=_r30,h.push({refName:_o13,length:_a10}),u=u+8+_i22,u>s.length)){_context53.next=21;break;}return _context53.abrupt(\"return\",(console.warn(\"BAM header is very big.  Re-fetching \".concat(e,\" bytes.\")),this._readRefSeqs(t,2*e,n)));case 21:_r30+=1;_context53.next=17;break;case 24:return _context53.abrupt(\"return\",{chrToIndex:l,indexToChr:h});case 25:case\"end\":return _context53.stop();}},_callee50,this);}));function _readRefSeqs(_x65,_x66,_x67){return _readRefSeqs2.apply(this,arguments);}return _readRefSeqs;}()},{key:\"getRecordsForRange\",value:function(){var _getRecordsForRange=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee52(t,e,n,r){return _regeneratorRuntime().wrap(function _callee52$(_context55){while(1)switch(_context55.prev=_context55.next){case 0:return _context55.abrupt(\"return\",function(){var _ref20=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee51(t){var e,_iteratorAbruptCompletion,_didIteratorError,_iteratorError,_iterator,_step,_n33;return _regeneratorRuntime().wrap(function _callee51$(_context54){while(1)switch(_context54.prev=_context54.next){case 0:e=[];_iteratorAbruptCompletion=false;_didIteratorError=false;_context54.prev=3;_iterator=_asyncIterator(t);case 5:_context54.next=7;return _iterator.next();case 7:if(!(_iteratorAbruptCompletion=!(_step=_context54.sent).done)){_context54.next=13;break;}_n33=_step.value;e=e.concat(_n33);case 10:_iteratorAbruptCompletion=false;_context54.next=5;break;case 13:_context54.next=19;break;case 15:_context54.prev=15;_context54.t0=_context54[\"catch\"](3);_didIteratorError=true;_iteratorError=_context54.t0;case 19:_context54.prev=19;_context54.prev=20;if(!(_iteratorAbruptCompletion&&_iterator[\"return\"]!=null)){_context54.next=24;break;}_context54.next=24;return _iterator[\"return\"]();case 24:_context54.prev=24;if(!_didIteratorError){_context54.next=27;break;}throw _iteratorError;case 27:return _context54.finish(24);case 28:return _context54.finish(19);case 29:return _context54.abrupt(\"return\",e);case 30:case\"end\":return _context54.stop();}},_callee51,null,[[3,15,19,29],[20,,24,28]]);}));return function(_x72){return _ref20.apply(this,arguments);};}()(this.streamRecordsForRange(t,e,n,r)));case 1:case\"end\":return _context55.stop();}},_callee52,this);}));function getRecordsForRange(_x68,_x69,_x70,_x71){return _getRecordsForRange.apply(this,arguments);}return getRecordsForRange;}()},{key:\"streamRecordsForRange\",value:function streamRecordsForRange(t,e,n,r){var _this=this;return _wrapAsyncGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee53(){var i,o,_t52;return _regeneratorRuntime().wrap(function _callee53$(_context56){while(1)switch(_context56.prev=_context56.next){case 0:_context56.t0=(null==r?void 0:r.assemblyName)&&\"hg38\"!==(null==r?void 0:r.assemblyName);if(!_context56.t0){_context56.next=4;break;}_context56.next=4;return _awaitAsyncGenerator(_this.getHeader(r));case 4:o=null===(i=_this.chrToIndex)||void 0===i?void 0:i[t];if(!(void 0!==o&&_this.index)){_context56.next=12;break;}_context56.next=8;return _awaitAsyncGenerator(_this.index.blocksForRange(o,e-1,n,r));case 8:_t52=_context56.sent;return _context56.delegateYield(_asyncGeneratorDelegate(_asyncIterator(_this._fetchChunkFeatures(_t52,o,e,n,r)),_awaitAsyncGenerator),\"t1\",10);case 10:_context56.next=14;break;case 12:_context56.next=14;return[];case 14:case\"end\":return _context56.stop();}},_callee53);}))();}},{key:\"_fetchChunkFeatures\",value:function _fetchChunkFeatures(t,e,n,r){var _this2=this;var i=arguments.length>4&&arguments[4]!==undefined?arguments[4]:{};return _wrapAsyncGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee54(){var o,s,a,_iterator15,_step15,_o14,_t54,u,_iterator16,_step16,_i23;return _regeneratorRuntime().wrap(function _callee54$(_context57){while(1)switch(_context57.prev=_context57.next){case 0:o=i.viewAsPairs,s=[];a=!1;_iterator15=_createForOfIteratorHelper(t);_context57.prev=3;_iterator15.s();case 5:if((_step15=_iterator15.n()).done){_context57.next=38;break;}_o14=_step15.value;_context57.next=9;return _awaitAsyncGenerator(_this2.featureCache.get(_o14.toString(),{chunk:_o14,opts:i},i.signal));case 9:_t54=_context57.sent;u=[];_iterator16=_createForOfIteratorHelper(_t54);_context57.prev=12;_iterator16.s();case 14:if((_step16=_iterator16.n()).done){_context57.next=23;break;}_i23=_step16.value;if(!(_i23.seq_id()===e)){_context57.next=21;break;}if(!(_i23.get(\"start\")>=r)){_context57.next=20;break;}a=!0;return _context57.abrupt(\"break\",23);case 20:_i23.get(\"end\")>=n&&u.push(_i23);case 21:_context57.next=14;break;case 23:_context57.next=28;break;case 25:_context57.prev=25;_context57.t0=_context57[\"catch\"](12);_iterator16.e(_context57.t0);case 28:_context57.prev=28;_iterator16.f();return _context57.finish(28);case 31:s.push(u);_context57.next=34;return u;case 34:if(!a){_context57.next=36;break;}return _context57.abrupt(\"break\",38);case 36:_context57.next=5;break;case 38:_context57.next=43;break;case 40:_context57.prev=40;_context57.t1=_context57[\"catch\"](3);_iterator15.e(_context57.t1);case 43:_context57.prev=43;_iterator15.f();return _context57.finish(43);case 46:(function(t){if(t&&t.aborted){if(\"undefined\"==typeof DOMException){var _t53=new Error(\"aborted\");throw _t53.code=\"ERR_ABORTED\",_t53;}throw new DOMException(\"aborted\",\"AbortError\");}})(i.signal);_context57.t2=o;if(!_context57.t2){_context57.next=51;break;}_context57.next=51;return _this2.fetchPairs(e,s,i);case 51:case\"end\":return _context57.stop();}},_callee54,null,[[3,40,43,46],[12,25,28,31]]);}))();}},{key:\"fetchPairs\",value:function(){var _fetchPairs=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee56(t,e,n){var _this18=this;var r,_n$maxInsertSize,i,o,s,a,u,l,_iterator19,_step19,_t58,h;return _regeneratorRuntime().wrap(function _callee56$(_context59){while(1)switch(_context59.prev=_context59.next){case 0:r=n.pairAcrossChr,_n$maxInsertSize=n.maxInsertSize,i=_n$maxInsertSize===void 0?2e5:_n$maxInsertSize,o={},s={};e.map(function(t){var e={};var _iterator17=_createForOfIteratorHelper(t),_step17;try{for(_iterator17.s();!(_step17=_iterator17.n()).done;){var _n35=_step17.value;var _t56=_n35.name(),_r31=_n35.id();e[_t56]||(e[_t56]=0),e[_t56]++,s[_r31]=1;}}catch(err){_iterator17.e(err);}finally{_iterator17.f();}for(var _i24=0,_Object$entries=Object.entries(e);_i24<_Object$entries.length;_i24++){var _Object$entries$_i=_slicedToArray(_Object$entries[_i24],2),_t55=_Object$entries$_i[0],_n34=_Object$entries$_i[1];1===_n34&&(o[_t55]=!0);}});a=[];e.map(function(e){var _iterator18=_createForOfIteratorHelper(e),_step18;try{for(_iterator18.s();!(_step18=_iterator18.n()).done;){var _s19=_step18.value;var _e51=_s19.name(),_u6=_s19.get(\"start\"),_l5=_s19._next_pos(),_h3=_s19._next_refid();_this18.index&&o[_e51]&&(r||_h3===t&&Math.abs(_u6-_l5)<i)&&a.push(_this18.index.blocksForRange(_h3,_l5,_l5+1,n));}}catch(err){_iterator18.e(err);}finally{_iterator18.f();}});u=new Map();_context59.next=7;return Promise.all(a);case 7:l=_context59.sent;_iterator19=_createForOfIteratorHelper(l.flat());try{for(_iterator19.s();!(_step19=_iterator19.n()).done;){_t58=_step19.value;u.has(_t58.toString())||u.set(_t58.toString(),_t58);}}catch(err){_iterator19.e(err);}finally{_iterator19.f();}_context59.next=12;return Promise.all(_toConsumableArray(u.values()).map(/*#__PURE__*/function(){var _ref21=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee55(t){var _yield$_this18$_readC,e,r,i,a,u,_iterator20,_step20,_t57;return _regeneratorRuntime().wrap(function _callee55$(_context58){while(1)switch(_context58.prev=_context58.next){case 0:_context58.next=2;return _this18._readChunk({chunk:t,opts:n});case 2:_yield$_this18$_readC=_context58.sent;e=_yield$_this18$_readC.data;r=_yield$_this18$_readC.cpositions;i=_yield$_this18$_readC.dpositions;a=_yield$_this18$_readC.chunk;u=[];_context58.t0=_createForOfIteratorHelper;_context58.next=11;return _this18.readBamFeatures(e,r,i,a);case 11:_context58.t1=_context58.sent;_iterator20=(0,_context58.t0)(_context58.t1);try{for(_iterator20.s();!(_step20=_iterator20.n()).done;){_t57=_step20.value;o[_t57.get(\"name\")]&&!s[_t57.id()]&&u.push(_t57);}}catch(err){_iterator20.e(err);}finally{_iterator20.f();}return _context58.abrupt(\"return\",u);case 15:case\"end\":return _context58.stop();}},_callee55);}));return function(_x76){return _ref21.apply(this,arguments);};}()));case 12:h=_context59.sent;return _context59.abrupt(\"return\",h.flat());case 14:case\"end\":return _context59.stop();}},_callee56);}));function fetchPairs(_x73,_x74,_x75){return _fetchPairs.apply(this,arguments);}return fetchPairs;}()},{key:\"_readRegion\",value:function(){var _readRegion2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee57(t,e){var n,_yield$this$bam$read2,r,i,_args60=arguments;return _regeneratorRuntime().wrap(function _callee57$(_context60){while(1)switch(_context60.prev=_context60.next){case 0:n=_args60.length>2&&_args60[2]!==undefined?_args60[2]:{};_context60.next=3;return this.bam.read(ce.lW.alloc(e),0,e,t,n);case 3:_yield$this$bam$read2=_context60.sent;r=_yield$this$bam$read2.bytesRead;i=_yield$this$bam$read2.buffer;return _context60.abrupt(\"return\",i.subarray(0,Math.min(r,e)));case 7:case\"end\":return _context60.stop();}},_callee57,this);}));function _readRegion(_x77,_x78){return _readRegion2.apply(this,arguments);}return _readRegion;}()},{key:\"_readChunk\",value:function(){var _readChunk2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee59(_ref22){var t,e,n,_yield,r,i,o;return _regeneratorRuntime().wrap(function _callee59$(_context62){while(1)switch(_context62.prev=_context62.next){case 0:t=_ref22.chunk,e=_ref22.opts;_context62.next=3;return this._readRegion(t.minv.blockPosition,t.fetchedSize(),e);case 3:n=_context62.sent;_context62.next=6;return function(){var _ref23=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee58(t,e){var _n36,_r32,_i25,_o15,_s20,_a11,u,l,h,c,_e52,_f3,_d2,_p2,_g,_f4,_t59,_e53;return _regeneratorRuntime().wrap(function _callee58$(_context61){while(1)switch(_context61.prev=_context61.next){case 0:_context61.prev=0;_r32=e.minv,_i25=e.maxv;_o15=_r32.blockPosition,_s20=_r32.dataPosition;_a11=[],u=[],l=[];h=0,c=0;case 5:_e52=t.subarray(_o15-_r32.blockPosition),_f3=new we.Inflate();if(!(_n36=_f3.strm,_f3.push(_e52,we.Z_SYNC_FLUSH),_f3.err)){_context61.next=8;break;}throw new Error(_f3.msg);case 8:_d2=_f3.result;_a11.push(_d2);_p2=_d2.length;u.push(_o15),l.push(_s20),1===_a11.length&&_r32.dataPosition&&(_a11[0]=_a11[0].subarray(_r32.dataPosition),_p2=_a11[0].length);_g=_o15;if(!(_o15+=_n36.next_in,_s20+=_p2,_g>=_i25.blockPosition)){_context61.next=16;break;}_a11[c]=_a11[c].subarray(0,_i25.blockPosition===_r32.blockPosition?_i25.dataPosition-_r32.dataPosition+1:_i25.dataPosition+1),u.push(_o15),l.push(_s20),h+=_a11[c].length;return _context61.abrupt(\"break\",18);case 16:h+=_a11[c].length,c++;case 17:if(_n36.avail_in){_context61.next=5;break;}case 18:_f4=new Uint8Array(h);for(_t59=0,_e53=0;_t59<_a11.length;_t59++)_f4.set(_a11[_t59],_e53),_e53+=_a11[_t59].length;return _context61.abrupt(\"return\",{buffer:ce.lW.from(_f4),cpositions:u,dpositions:l});case 23:_context61.prev=23;_context61.t0=_context61[\"catch\"](0);if(!\"\".concat(_context61.t0).match(/incorrect header check/)){_context61.next=27;break;}throw new Error(\"problem decompressing block: incorrect gzip header check\");case 27:throw _context61.t0;case 28:case\"end\":return _context61.stop();}},_callee58,null,[[0,23]]);}));return function(_x80,_x81){return _ref23.apply(this,arguments);};}()(n,t);case 6:_yield=_context62.sent;r=_yield.buffer;i=_yield.cpositions;o=_yield.dpositions;return _context62.abrupt(\"return\",{data:r,cpositions:i,dpositions:o,chunk:t});case 11:case\"end\":return _context62.stop();}},_callee59,this);}));function _readChunk(_x79){return _readChunk2.apply(this,arguments);}return _readChunk;}()},{key:\"readBamFeatures\",value:function(){var _readBamFeatures=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee60(t,e,n,r){var i,o,s,a,u,l;return _regeneratorRuntime().wrap(function _callee60$(_context63){while(1)switch(_context63.prev=_context63.next){case 0:i=0;o=[];s=0,a=+Date.now();case 3:if(!(i+4<t.length)){_context63.next=17;break;}u=i+4+t.readInt32LE(i)-1;if(n){for(;i+r.minv.dataPosition>=n[s++];);s--;}if(!(u<t.length)){_context63.next=14;break;}l=new Ce({bytes:{byteArray:t,start:i,end:u},fileOffset:e.length>0?256*e[s]+(i-n[s])+r.minv.dataPosition+1:me.signed(t.slice(i,u))});o.push(l);_context63.t0=this.yieldThreadTime&&+Date.now()-a>this.yieldThreadTime;if(!_context63.t0){_context63.next=14;break;}_context63.next=13;return ie(1);case 13:a=+Date.now();case 14:i=u+1;case 15:_context63.next=3;break;case 17:return _context63.abrupt(\"return\",o);case 18:case\"end\":return _context63.stop();}},_callee60,this);}));function readBamFeatures(_x82,_x83,_x84,_x85){return _readBamFeatures.apply(this,arguments);}return readBamFeatures;}()},{key:\"hasRefSeq\",value:function(){var _hasRefSeq3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee61(t){var e,n,r;return _regeneratorRuntime().wrap(function _callee61$(_context64){while(1)switch(_context64.prev=_context64.next){case 0:r=null===(e=this.chrToIndex)||void 0===e?void 0:e[t];return _context64.abrupt(\"return\",void 0!==r&&(null===(n=this.index)||void 0===n?void 0:n.hasRefSeq(r)));case 2:case\"end\":return _context64.stop();}},_callee61,this);}));function hasRefSeq(_x86){return _hasRefSeq3.apply(this,arguments);}return hasRefSeq;}()},{key:\"lineCount\",value:function(){var _lineCount3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee62(t){var e,n;return _regeneratorRuntime().wrap(function _callee62$(_context65){while(1)switch(_context65.prev=_context65.next){case 0:n=null===(e=this.chrToIndex)||void 0===e?void 0:e[t];return _context65.abrupt(\"return\",void 0!==n&&this.index?this.index.lineCount(n):0);case 2:case\"end\":return _context65.stop();}},_callee62,this);}));function lineCount(_x87){return _lineCount3.apply(this,arguments);}return lineCount;}()},{key:\"indexCov\",value:function(){var _indexCov3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee63(t,e,n){var r,i;return _regeneratorRuntime().wrap(function _callee63$(_context66){while(1)switch(_context66.prev=_context66.next){case 0:if(this.index){_context66.next=2;break;}return _context66.abrupt(\"return\",[]);case 2:_context66.next=4;return this.index.parse();case 4:i=null===(r=this.chrToIndex)||void 0===r?void 0:r[t];return _context66.abrupt(\"return\",void 0===i?[]:this.index.indexCov(i,e,n));case 6:case\"end\":return _context66.stop();}},_callee63,this);}));function indexCov(_x88,_x89,_x90){return _indexCov3.apply(this,arguments);}return indexCov;}()},{key:\"blocksForRange\",value:function(){var _blocksForRange3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee64(t,e,n,r){var i,o;return _regeneratorRuntime().wrap(function _callee64$(_context67){while(1)switch(_context67.prev=_context67.next){case 0:if(this.index){_context67.next=2;break;}return _context67.abrupt(\"return\",[]);case 2:_context67.next=4;return this.index.parse();case 4:o=null===(i=this.chrToIndex)||void 0===i?void 0:i[t];return _context67.abrupt(\"return\",void 0===o?[]:this.index.blocksForRange(o,e,n,r));case 6:case\"end\":return _context67.stop();}},_callee64,this);}));function blocksForRange(_x91,_x92,_x93,_x94){return _blocksForRange3.apply(this,arguments);}return blocksForRange;}()}]);return Ie;}();var Oe={BG:[.89,.89,.89,1],BG2:[.85,.85,.85,1],BG_MUTED:[.92,.92,.92,1],A:[0,0,1,1],C:[1,0,0,1],G:[0,1,0,1],T:[1,1,0,1],S:[0,0,0,.4],H:[0,0,0,.5],X:[0,0,0,.7],I:[1,0,1,.5],D:[1,.5,.5,.5],N:[1,1,1,1],LARGE_INSERT_SIZE:[1,0,0,1],SMALL_INSERT_SIZE:[0,.24,.48,1],LL:[.15,.75,.75,1],RR:[.18,.24,.8,1],RL:[0,.5,.02,1],WHITE:[1,1,1,1],BLACK:[0,0,0,1],BLACK_05:[0,0,0,.5],PLUS_STRAND:[.75,.75,1,1],MINUS_STRAND:[1,.75,.75,1],MM_M6A_FOR:[.4,.2,.6,1],MM_M6A_REV:[.4,.2,.6,1],MM_M5C_FOR:[1,0,0,1],MM_M5C_REV:[1,0,0,1],HIGHLIGHTS_CG:[.95,.84,.84,1],HIGHLIGHTS_A:[.95,.89,.71,1],HIGHLIGHTS_T:[.95,.89,.71,1],HIGHLIGHTS_G:[.95,.84,.84,1],HIGHLIGHTS_C:[.95,.84,.84,1],HIGHLIGHTS_MZEROA:[.89,.84,.96,1],INDEX_DHS_BG:[0,0,0,0],FIRE_SEGMENT_BG:[0,0,0,0],FIRE_BG:[.88,.88,.88,1],TFBS_SEGMENT_BG:[0,0,0,1],TFBS_BG:[1,1,1,1],GENERIC_BED_SEGMENT_BG:[0,0,0,1],GENERIC_BED_SEGMENT_RED_BG:[1,0,0,1],\"FIRE_169,169,169\":[.66,.66,.66],\"FIRE_147,112,219\":[.58,.44,.86],\"FIRE_255,0,0\":[1,0,0],\"FIRE_200,0,0\":[.78,0,0],\"FIRE_255,140,0\":[1,.55,0],\"FIRE_175,0,0\":[.68,0,0],\"FIRE_225,0,0\":[.88,0,0],\"FIRE_139,0,0\":[.54,0,0]};var Re={};function Le(t){Re=t;}Object.keys(Oe).map(function(t,e){return Re[t]=e,null;});var Ue=function Ue(t){return t=t.toUpperCase(),\"\".concat(parseInt(t.slice(1,3),16),\",\").concat(parseInt(t.slice(3,5),16),\",\").concat(parseInt(t.slice(5,7),16));},je=function je(t,e){var n=0,r=0,i=!1,o=0;var s=[];for(var _a12=0;_a12<t.length;_a12++)t[_a12].match(/[0-9]/g)?(r=10*r+ +t[_a12],i=!1):\"^\"===t[_a12]?i=!0:(n+=r,e?s.push({length:r,type:t[_a12]}):i?o-=1:s.push({pos:n,base:t[_a12],length:1,bamSeqShift:o}),r=0,n+=1);return s;},Pe=function Pe(t){return t.highlightReadsBy.length>0||t.outlineMateOnHover;};var De=n(9593),Fe=n.n(De),$e=\"$\";function He(){}function qe(t,e){var n=new He();if(t instanceof He)t.each(function(t,e){n.set(e,t);});else if(Array.isArray(t)){var r,i=-1,o=t.length;if(null==e)for(;++i<o;)n.set(i,t[i]);else for(;++i<o;)n.set(e(r=t[i],i,t),r);}else if(t)for(var s in t)n.set(s,t[s]);return n;}He.prototype=qe.prototype={constructor:He,has:function has(t){return $e+t in this;},get:function get(t){return this[$e+t];},set:function set(t,e){return this[$e+t]=e,this;},remove:function remove(t){var e=$e+t;return e in this&&delete this[e];},clear:function clear(){for(var t in this)t[0]===$e&&delete this[t];},keys:function keys(){var t=[];for(var e in this)e[0]===$e&&t.push(e.slice(1));return t;},values:function values(){var t=[];for(var e in this)e[0]===$e&&t.push(this[e]);return t;},entries:function entries(){var t=[];for(var e in this)e[0]===$e&&t.push({key:e.slice(1),value:this[e]});return t;},size:function size(){var t=0;for(var e in this)e[0]===$e&&++t;return t;},empty:function empty(){for(var t in this)if(t[0]===$e)return!1;return!0;},each:function each(t){for(var e in this)e[0]===$e&&t(this[e],e.slice(1),this);}};var Ze=qe;function We(){}var Ge=Ze.prototype;We.prototype=function(t,e){var n=new We();if(t instanceof We)t.each(function(t){n.add(t);});else if(t){var r=-1,i=t.length;if(null==e)for(;++r<i;)n.add(t[r]);else for(;++r<i;)n.add(e(t[r],r,t));}return n;}.prototype={constructor:We,has:Ge.has,add:function add(t){return this[$e+(t+=\"\")]=t,this;},remove:Ge.remove,clear:Ge.clear,values:Ge.keys,size:Ge.size,empty:Ge.empty,each:Ge.each};var Ye={value:function value(){}};function Ve(){for(var t,e=0,n=arguments.length,r={};e<n;++e){if(!(t=arguments[e]+\"\")||t in r||/[\\s.]/.test(t))throw new Error(\"illegal type: \"+t);r[t]=[];}return new Xe(r);}function Xe(t){this._=t;}function Ke(t,e){for(var n,r=0,i=t.length;r<i;++r)if((n=t[r]).name===e)return n.value;}function Je(t,e,n){for(var r=0,i=t.length;r<i;++r)if(t[r].name===e){t[r]=Ye,t=t.slice(0,r).concat(t.slice(r+1));break;}return null!=n&&t.push({name:e,value:n}),t;}Xe.prototype=Ve.prototype={constructor:Xe,on:function on(t,e){var n,r,i=this._,o=(r=i,(t+\"\").trim().split(/^|\\s+/).map(function(t){var e=\"\",n=t.indexOf(\".\");if(n>=0&&(e=t.slice(n+1),t=t.slice(0,n)),t&&!r.hasOwnProperty(t))throw new Error(\"unknown type: \"+t);return{type:t,name:e};})),s=-1,a=o.length;if(!(arguments.length<2)){if(null!=e&&\"function\"!=typeof e)throw new Error(\"invalid callback: \"+e);for(;++s<a;)if(n=(t=o[s]).type)i[n]=Je(i[n],t.name,e);else if(null==e)for(n in i)i[n]=Je(i[n],t.name,null);return this;}for(;++s<a;)if((n=(t=o[s]).type)&&(n=Ke(i[n],t.name)))return n;},copy:function copy(){var t={},e=this._;for(var n in e)t[n]=e[n].slice();return new Xe(t);},call:function call(t,e){if((n=arguments.length-2)>0)for(var n,r,i=new Array(n),o=0;o<n;++o)i[o]=arguments[o+2];if(!this._.hasOwnProperty(t))throw new Error(\"unknown type: \"+t);for(o=0,n=(r=this._[t]).length;o<n;++o)r[o].value.apply(e,i);},apply:function apply(t,e,n){if(!this._.hasOwnProperty(t))throw new Error(\"unknown type: \"+t);for(var r=this._[t],i=0,o=r.length;i<o;++i)r[i].value.apply(e,n);}};var Qe=Ve;function tn(t,e){var n,r,i,o,s=Qe(\"beforesend\",\"progress\",\"load\",\"error\"),a=Ze(),u=new XMLHttpRequest(),l=null,h=null,c=0;function f(t){var e,r=u.status;if(!r&&function(t){var e=t.responseType;return e&&\"text\"!==e?t.response:t.responseText;}(u)||r>=200&&r<300||304===r){if(i)try{e=i.call(n,u);}catch(t){return void s.call(\"error\",n,t);}else e=u;s.call(\"load\",n,e);}else s.call(\"error\",n,t);}if(\"undefined\"!=typeof XDomainRequest&&!(\"withCredentials\"in u)&&/^(http(s)?:)?\\/\\//.test(t)&&(u=new XDomainRequest()),\"onload\"in u?u.onload=u.onerror=u.ontimeout=f:u.onreadystatechange=function(t){u.readyState>3&&f(t);},u.onprogress=function(t){s.call(\"progress\",n,t);},n={header:function header(t,e){return t=(t+\"\").toLowerCase(),arguments.length<2?a.get(t):(null==e?a.remove(t):a.set(t,e+\"\"),n);},mimeType:function mimeType(t){return arguments.length?(r=null==t?null:t+\"\",n):r;},responseType:function responseType(t){return arguments.length?(o=t,n):o;},timeout:function timeout(t){return arguments.length?(c=+t,n):c;},user:function user(t){return arguments.length<1?l:(l=null==t?null:t+\"\",n);},password:function password(t){return arguments.length<1?h:(h=null==t?null:t+\"\",n);},response:function response(t){return i=t,n;},get:function get(t,e){return n.send(\"GET\",t,e);},post:function post(t,e){return n.send(\"POST\",t,e);},send:function send(e,i,f){return u.open(e,t,!0,l,h),null==r||a.has(\"accept\")||a.set(\"accept\",r+\",*/*\"),u.setRequestHeader&&a.each(function(t,e){u.setRequestHeader(e,t);}),null!=r&&u.overrideMimeType&&u.overrideMimeType(r),null!=o&&(u.responseType=o),c>0&&(u.timeout=c),null==f&&\"function\"==typeof i&&(f=i,i=null),null!=f&&1===f.length&&(f=function(t){return function(e,n){t(null==e?n:null);};}(f)),null!=f&&n.on(\"error\",f).on(\"load\",function(t){f(null,t);}),s.call(\"beforesend\",n,u),u.send(null==i?null:i),n;},abort:function abort(){return u.abort(),n;},on:function on(){var t=s.on.apply(s,arguments);return t===s?n:t;}},null!=e){if(\"function\"!=typeof e)throw new Error(\"invalid callback: \"+e);return n.get(e);}return n;}function en(t,e){return function(n,r){var i=tn(n).mimeType(t).response(e);if(null!=r){if(\"function\"!=typeof r)throw new Error(\"invalid callback: \"+r);return i.get(r);}return i;};}en(\"text/html\",function(t){return document.createRange().createContextualFragment(t.responseText);}),en(\"application/json\",function(t){return JSON.parse(t.responseText);});var nn=en(\"text/plain\",function(t){return t.responseText;});en(\"application/xml\",function(t){var e=t.responseXML;if(!e)throw new Error(\"parse error\");return e;});var rn={},on={};function sn(t){return new Function(\"d\",\"return {\"+t.map(function(t,e){return JSON.stringify(t)+\": d[\"+e+'] || \"\"';}).join(\",\")+\"}\");}function an(t){var e=Object.create(null),n=[];return t.forEach(function(t){for(var r in t)r in e||n.push(e[r]=r);}),n;}function un(t,e){var n=t+\"\",r=n.length;return r<e?new Array(e-r+1).join(0)+n:n;}function ln(t){var e=new RegExp('[\"'+t+\"\\n\\r]\"),n=t.charCodeAt(0);function r(t,e){var r,i=[],o=t.length,s=0,a=0,u=o<=0,l=!1;function h(){if(u)return on;if(l)return l=!1,rn;var e,r,i=s;if(34===t.charCodeAt(i)){for(;s++<o&&34!==t.charCodeAt(s)||34===t.charCodeAt(++s););return(e=s)>=o?u=!0:10===(r=t.charCodeAt(s++))?l=!0:13===r&&(l=!0,10===t.charCodeAt(s)&&++s),t.slice(i+1,e-1).replace(/\"\"/g,'\"');}for(;s<o;){if(10===(r=t.charCodeAt(e=s++)))l=!0;else if(13===r)l=!0,10===t.charCodeAt(s)&&++s;else if(r!==n)continue;return t.slice(i,e);}return u=!0,t.slice(i,o);}for(10===t.charCodeAt(o-1)&&--o,13===t.charCodeAt(o-1)&&--o;(r=h())!==on;){for(var c=[];r!==rn&&r!==on;)c.push(r),r=h();e&&null==(c=e(c,a++))||i.push(c);}return i;}function i(e,n){return e.map(function(e){return n.map(function(t){return s(e[t]);}).join(t);});}function o(e){return e.map(s).join(t);}function s(t){return null==t?\"\":t instanceof Date?function(t){var e=t.getUTCHours(),n=t.getUTCMinutes(),r=t.getUTCSeconds(),i=t.getUTCMilliseconds();return isNaN(t)?\"Invalid Date\":function(t){return t<0?\"-\"+un(-t,6):t>9999?\"+\"+un(t,6):un(t,4);}(t.getUTCFullYear())+\"-\"+un(t.getUTCMonth()+1,2)+\"-\"+un(t.getUTCDate(),2)+(i?\"T\"+un(e,2)+\":\"+un(n,2)+\":\"+un(r,2)+\".\"+un(i,3)+\"Z\":r?\"T\"+un(e,2)+\":\"+un(n,2)+\":\"+un(r,2)+\"Z\":n||e?\"T\"+un(e,2)+\":\"+un(n,2)+\"Z\":\"\");}(t):e.test(t+=\"\")?'\"'+t.replace(/\"/g,'\"\"')+'\"':t;}return{parse:function parse(t,e){var n,i,o=r(t,function(t,r){if(n)return n(t,r-1);i=t,n=e?function(t,e){var n=sn(t);return function(r,i){return e(n(r),i,t);};}(t,e):sn(t);});return o.columns=i||[],o;},parseRows:r,format:function format(e,n){return null==n&&(n=an(e)),[n.map(s).join(t)].concat(i(e,n)).join(\"\\n\");},formatBody:function formatBody(t,e){return null==e&&(e=an(t)),i(t,e).join(\"\\n\");},formatRows:function formatRows(t){return t.map(o).join(\"\\n\");},formatRow:o,formatValue:s};}var hn=ln(\",\"),cn=hn.parse;function fn(t,e){return function(n,r,i){arguments.length<3&&(i=r,r=null);var o=tn(n).mimeType(t);return o.row=function(t){return arguments.length?o.response(function(t,e){return function(n){return t(n.responseText,e);};}(e,r=t)):r;},o.row(r),i?o.get(i):o;};}hn.parseRows,hn.format,hn.formatBody,hn.formatRows,hn.formatRow,hn.formatValue,fn(\"text/csv\",cn);var dn=ln(\"\\t\"),pn=dn.parse,gn=dn.parseRows;dn.format,dn.formatBody,dn.formatRows,dn.formatRow,dn.formatValue,fn(\"text/tab-separated-values\",pn);var _n=w(function(t){return t.pos;}).left;function mn(t){var e=[],n={},r={};var i=0;for(var _o16=0;_o16<t.length;_o16++){var _s21=Number(t[_o16][1]);i+=_s21;var _a13={id:_o16,chr:t[_o16][0],pos:i-_s21};e.push(_a13),r[_a13.chr]=_a13,n[t[_o16][0]]=_s21;}return{cumPositions:e,chrPositions:r,totalLength:i,chromLengths:n};}w(function(t){return t.from;}).right;var vn=n(4803),yn=n(2949),bn=Array.prototype.slice;function wn(t){return t;}var xn=1e-6;function kn(t){return\"translate(\"+t+\",0)\";}function An(t){return\"translate(0,\"+t+\")\";}function En(t){return function(e){return+t(e);};}function Sn(t,e){return e=Math.max(0,t.bandwidth()-2*e)/2,t.round()&&(e=Math.round(e)),function(n){return+t(n)+e;};}function Mn(){return!this.__axis;}function Bn(t,e){var n=[],r=null,i=null,o=6,s=6,a=3,u=\"undefined\"!=typeof window&&window.devicePixelRatio>1?0:.5,l=1===t||4===t?-1:1,h=4===t||2===t?\"x\":\"y\",c=1===t||3===t?kn:An;function f(f){var d=null==r?e.ticks?e.ticks.apply(e,n):e.domain():r,p=null==i?e.tickFormat?e.tickFormat.apply(e,n):wn:i,g=Math.max(o,0)+a,_=e.range(),m=+_[0]+u,v=+_[_.length-1]+u,y=(e.bandwidth?Sn:En)(e.copy(),u),b=f.selection?f.selection():f,w=b.selectAll(\".domain\").data([null]),x=b.selectAll(\".tick\").data(d,e).order(),k=x.exit(),A=x.enter().append(\"g\").attr(\"class\",\"tick\"),E=x.select(\"line\"),S=x.select(\"text\");w=w.merge(w.enter().insert(\"path\",\".tick\").attr(\"class\",\"domain\").attr(\"stroke\",\"currentColor\")),x=x.merge(A),E=E.merge(A.append(\"line\").attr(\"stroke\",\"currentColor\").attr(h+\"2\",l*o)),S=S.merge(A.append(\"text\").attr(\"fill\",\"currentColor\").attr(h,l*g).attr(\"dy\",1===t?\"0em\":3===t?\"0.71em\":\"0.32em\")),f!==b&&(w=w.transition(f),x=x.transition(f),E=E.transition(f),S=S.transition(f),k=k.transition(f).attr(\"opacity\",xn).attr(\"transform\",function(t){return isFinite(t=y(t))?c(t+u):this.getAttribute(\"transform\");}),A.attr(\"opacity\",xn).attr(\"transform\",function(t){var e=this.parentNode.__axis;return c((e&&isFinite(e=e(t))?e:y(t))+u);})),k.remove(),w.attr(\"d\",4===t||2===t?s?\"M\"+l*s+\",\"+m+\"H\"+u+\"V\"+v+\"H\"+l*s:\"M\"+u+\",\"+m+\"V\"+v:s?\"M\"+m+\",\"+l*s+\"V\"+u+\"H\"+v+\"V\"+l*s:\"M\"+m+\",\"+u+\"H\"+v),x.attr(\"opacity\",1).attr(\"transform\",function(t){return c(y(t)+u);}),E.attr(h+\"2\",l*o),S.attr(h,l*g).text(p),b.filter(Mn).attr(\"fill\",\"none\").attr(\"font-size\",10).attr(\"font-family\",\"sans-serif\").attr(\"text-anchor\",2===t?\"start\":4===t?\"end\":\"middle\"),b.each(function(){this.__axis=y;});}return f.scale=function(t){return arguments.length?(e=t,f):e;},f.ticks=function(){return n=bn.call(arguments),f;},f.tickArguments=function(t){return arguments.length?(n=null==t?[]:bn.call(t),f):n.slice();},f.tickValues=function(t){return arguments.length?(r=null==t?null:bn.call(t),f):r&&r.slice();},f.tickFormat=function(t){return arguments.length?(i=t,f):i;},f.tickSize=function(t){return arguments.length?(o=s=+t,f):o;},f.tickSizeInner=function(t){return arguments.length?(o=+t,f):o;},f.tickSizeOuter=function(t){return arguments.length?(s=+t,f):s;},f.tickPadding=function(t){return arguments.length?(a=+t,f):a;},f.offset=function(t){return arguments.length?(u=+t,f):u;},f;}function Tn(){}function zn(t){return null==t?Tn:function(){return this.querySelector(t);};}function Cn(t){return\"object\"==_typeof(t)&&\"length\"in t?t:Array.from(t);}function Nn(){return[];}function In(t){return null==t?Nn:function(){return this.querySelectorAll(t);};}function On(t){return function(){return this.matches(t);};}function Rn(t){return function(e){return e.matches(t);};}var Ln=Array.prototype.find;function Un(){return this.firstElementChild;}var jn=Array.prototype.filter;function Pn(){return this.children;}function Dn(t){return new Array(t.length);}function Fn(t,e){this.ownerDocument=t.ownerDocument,this.namespaceURI=t.namespaceURI,this._next=null,this._parent=t,this.__data__=e;}function $n(t,e,n,r,i,o){for(var s,a=0,u=e.length,l=o.length;a<l;++a)(s=e[a])?(s.__data__=o[a],r[a]=s):n[a]=new Fn(t,o[a]);for(;a<u;++a)(s=e[a])&&(i[a]=s);}function Hn(t,e,n,r,i,o,s){var a,u,l,h=new Map(),c=e.length,f=o.length,d=new Array(c);for(a=0;a<c;++a)(u=e[a])&&(d[a]=l=s.call(u,u.__data__,a,e)+\"\",h.has(l)?i[a]=u:h.set(l,u));for(a=0;a<f;++a)l=s.call(t,o[a],a,o)+\"\",(u=h.get(l))?(r[a]=u,u.__data__=o[a],h[\"delete\"](l)):n[a]=new Fn(t,o[a]);for(a=0;a<c;++a)(u=e[a])&&h.get(d[a])===u&&(i[a]=u);}function qn(t){return t.__data__;}function Zn(t,e){return t<e?-1:t>e?1:t>=e?0:NaN;}Fn.prototype={constructor:Fn,appendChild:function appendChild(t){return this._parent.insertBefore(t,this._next);},insertBefore:function insertBefore(t,e){return this._parent.insertBefore(t,e);},querySelector:function querySelector(t){return this._parent.querySelector(t);},querySelectorAll:function querySelectorAll(t){return this._parent.querySelectorAll(t);}};var Wn=\"http://www.w3.org/1999/xhtml\";var Gn={svg:\"http://www.w3.org/2000/svg\",xhtml:Wn,xlink:\"http://www.w3.org/1999/xlink\",xml:\"http://www.w3.org/XML/1998/namespace\",xmlns:\"http://www.w3.org/2000/xmlns/\"};function Yn(t){var e=t+=\"\",n=e.indexOf(\":\");return n>=0&&\"xmlns\"!==(e=t.slice(0,n))&&(t=t.slice(n+1)),Gn.hasOwnProperty(e)?{space:Gn[e],local:t}:t;}function Vn(t){return function(){this.removeAttribute(t);};}function Xn(t){return function(){this.removeAttributeNS(t.space,t.local);};}function Kn(t,e){return function(){this.setAttribute(t,e);};}function Jn(t,e){return function(){this.setAttributeNS(t.space,t.local,e);};}function Qn(t,e){return function(){var n=e.apply(this,arguments);null==n?this.removeAttribute(t):this.setAttribute(t,n);};}function tr(t,e){return function(){var n=e.apply(this,arguments);null==n?this.removeAttributeNS(t.space,t.local):this.setAttributeNS(t.space,t.local,n);};}function er(t){return t.ownerDocument&&t.ownerDocument.defaultView||t.document&&t||t.defaultView;}function nr(t){return function(){this.style.removeProperty(t);};}function rr(t,e,n){return function(){this.style.setProperty(t,e,n);};}function ir(t,e,n){return function(){var r=e.apply(this,arguments);null==r?this.style.removeProperty(t):this.style.setProperty(t,r,n);};}function or(t,e){return t.style.getPropertyValue(e)||er(t).getComputedStyle(t,null).getPropertyValue(e);}function sr(t){return function(){delete this[t];};}function ar(t,e){return function(){this[t]=e;};}function ur(t,e){return function(){var n=e.apply(this,arguments);null==n?delete this[t]:this[t]=n;};}function lr(t){return t.trim().split(/^|\\s+/);}function hr(t){return t.classList||new cr(t);}function cr(t){this._node=t,this._names=lr(t.getAttribute(\"class\")||\"\");}function fr(t,e){for(var n=hr(t),r=-1,i=e.length;++r<i;)n.add(e[r]);}function dr(t,e){for(var n=hr(t),r=-1,i=e.length;++r<i;)n.remove(e[r]);}function pr(t){return function(){fr(this,t);};}function gr(t){return function(){dr(this,t);};}function _r(t,e){return function(){(e.apply(this,arguments)?fr:dr)(this,t);};}function mr(){this.textContent=\"\";}function vr(t){return function(){this.textContent=t;};}function yr(t){return function(){var e=t.apply(this,arguments);this.textContent=null==e?\"\":e;};}function br(){this.innerHTML=\"\";}function wr(t){return function(){this.innerHTML=t;};}function xr(t){return function(){var e=t.apply(this,arguments);this.innerHTML=null==e?\"\":e;};}function kr(){this.nextSibling&&this.parentNode.appendChild(this);}function Ar(){this.previousSibling&&this.parentNode.insertBefore(this,this.parentNode.firstChild);}function Er(t){return function(){var e=this.ownerDocument,n=this.namespaceURI;return n===Wn&&e.documentElement.namespaceURI===Wn?e.createElement(t):e.createElementNS(n,t);};}function Sr(t){return function(){return this.ownerDocument.createElementNS(t.space,t.local);};}function Mr(t){var e=Yn(t);return(e.local?Sr:Er)(e);}function Br(){return null;}function Tr(){var t=this.parentNode;t&&t.removeChild(this);}function zr(){var t=this.cloneNode(!1),e=this.parentNode;return e?e.insertBefore(t,this.nextSibling):t;}function Cr(){var t=this.cloneNode(!0),e=this.parentNode;return e?e.insertBefore(t,this.nextSibling):t;}function Nr(t){return function(){var e=this.__on;if(e){for(var n,r=0,i=-1,o=e.length;r<o;++r)n=e[r],t.type&&n.type!==t.type||n.name!==t.name?e[++i]=n:this.removeEventListener(n.type,n.listener,n.options);++i?e.length=i:delete this.__on;}};}function Ir(t,e,n){return function(){var r,i=this.__on,o=function(t){return function(e){t.call(this,e,this.__data__);};}(e);if(i)for(var s=0,a=i.length;s<a;++s)if((r=i[s]).type===t.type&&r.name===t.name)return this.removeEventListener(r.type,r.listener,r.options),this.addEventListener(r.type,r.listener=o,r.options=n),void(r.value=e);this.addEventListener(t.type,o,n),r={type:t.type,name:t.name,value:e,listener:o,options:n},i?i.push(r):this.__on=[r];};}function Or(t,e,n){var r=er(t),i=r.CustomEvent;\"function\"==typeof i?i=new i(e,n):(i=r.document.createEvent(\"Event\"),n?(i.initEvent(e,n.bubbles,n.cancelable),i.detail=n.detail):i.initEvent(e,!1,!1)),t.dispatchEvent(i);}function Rr(t,e){return function(){return Or(this,t,e);};}function Lr(t,e){return function(){return Or(this,t,e.apply(this,arguments));};}cr.prototype={add:function add(t){this._names.indexOf(t)<0&&(this._names.push(t),this._node.setAttribute(\"class\",this._names.join(\" \")));},remove:function remove(t){var e=this._names.indexOf(t);e>=0&&(this._names.splice(e,1),this._node.setAttribute(\"class\",this._names.join(\" \")));},contains:function contains(t){return this._names.indexOf(t)>=0;}};var Ur=[null];function jr(t,e){this._groups=t,this._parents=e;}function Pr(){return new jr([[document.documentElement]],Ur);}jr.prototype=Pr.prototype=_defineProperty({constructor:jr,select:function select(t){\"function\"!=typeof t&&(t=zn(t));for(var e=this._groups,n=e.length,r=new Array(n),i=0;i<n;++i)for(var o,s,a=e[i],u=a.length,l=r[i]=new Array(u),h=0;h<u;++h)(o=a[h])&&(s=t.call(o,o.__data__,h,a))&&(\"__data__\"in o&&(s.__data__=o.__data__),l[h]=s);return new jr(r,this._parents);},selectAll:function selectAll(t){t=\"function\"==typeof t?function(t){return function(){var e=t.apply(this,arguments);return null==e?[]:Cn(e);};}(t):In(t);for(var e=this._groups,n=e.length,r=[],i=[],o=0;o<n;++o)for(var s,a=e[o],u=a.length,l=0;l<u;++l)(s=a[l])&&(r.push(t.call(s,s.__data__,l,a)),i.push(s));return new jr(r,i);},selectChild:function selectChild(t){return this.select(null==t?Un:function(t){return function(){return Ln.call(this.children,t);};}(\"function\"==typeof t?t:Rn(t)));},selectChildren:function selectChildren(t){return this.selectAll(null==t?Pn:function(t){return function(){return jn.call(this.children,t);};}(\"function\"==typeof t?t:Rn(t)));},filter:function filter(t){\"function\"!=typeof t&&(t=On(t));for(var e=this._groups,n=e.length,r=new Array(n),i=0;i<n;++i)for(var o,s=e[i],a=s.length,u=r[i]=[],l=0;l<a;++l)(o=s[l])&&t.call(o,o.__data__,l,s)&&u.push(o);return new jr(r,this._parents);},data:function data(t,e){if(!arguments.length)return Array.from(this,qn);var n,r=e?Hn:$n,i=this._parents,o=this._groups;\"function\"!=typeof t&&(n=t,t=function t(){return n;});for(var s=o.length,a=new Array(s),u=new Array(s),l=new Array(s),h=0;h<s;++h){var c=i[h],f=o[h],d=f.length,p=Cn(t.call(c,c&&c.__data__,h,i)),g=p.length,_=u[h]=new Array(g),m=a[h]=new Array(g);r(c,f,_,m,l[h]=new Array(d),p,e);for(var v,y,b=0,w=0;b<g;++b)if(v=_[b]){for(b>=w&&(w=b+1);!(y=m[w])&&++w<g;);v._next=y||null;}}return(a=new jr(a,i))._enter=u,a._exit=l,a;},enter:function enter(){return new jr(this._enter||this._groups.map(Dn),this._parents);},exit:function exit(){return new jr(this._exit||this._groups.map(Dn),this._parents);},join:function join(t,e,n){var r=this.enter(),i=this,o=this.exit();return r=\"function\"==typeof t?t(r):r.append(t+\"\"),null!=e&&(i=e(i)),null==n?o.remove():n(o),r&&i?r.merge(i).order():i;},merge:function merge(t){if(!(t instanceof jr))throw new Error(\"invalid merge\");for(var e=this._groups,n=t._groups,r=e.length,i=n.length,o=Math.min(r,i),s=new Array(r),a=0;a<o;++a)for(var u,l=e[a],h=n[a],c=l.length,f=s[a]=new Array(c),d=0;d<c;++d)(u=l[d]||h[d])&&(f[d]=u);for(;a<r;++a)s[a]=e[a];return new jr(s,this._parents);},selection:function selection(){return this;},order:function order(){for(var t=this._groups,e=-1,n=t.length;++e<n;)for(var r,i=t[e],o=i.length-1,s=i[o];--o>=0;)(r=i[o])&&(s&&4^r.compareDocumentPosition(s)&&s.parentNode.insertBefore(r,s),s=r);return this;},sort:function sort(t){function e(e,n){return e&&n?t(e.__data__,n.__data__):!e-!n;}t||(t=Zn);for(var n=this._groups,r=n.length,i=new Array(r),o=0;o<r;++o){for(var s,a=n[o],u=a.length,l=i[o]=new Array(u),h=0;h<u;++h)(s=a[h])&&(l[h]=s);l.sort(e);}return new jr(i,this._parents).order();},call:function call(){var t=arguments[0];return arguments[0]=this,t.apply(null,arguments),this;},nodes:function nodes(){return Array.from(this);},node:function node(){for(var t=this._groups,e=0,n=t.length;e<n;++e)for(var r=t[e],i=0,o=r.length;i<o;++i){var s=r[i];if(s)return s;}return null;},size:function size(){var t=0;var _iterator21=_createForOfIteratorHelper(this),_step21;try{for(_iterator21.s();!(_step21=_iterator21.n()).done;){var e=_step21.value;++t;}}catch(err){_iterator21.e(err);}finally{_iterator21.f();}return t;},empty:function empty(){return!this.node();},each:function each(t){for(var e=this._groups,n=0,r=e.length;n<r;++n)for(var i,o=e[n],s=0,a=o.length;s<a;++s)(i=o[s])&&t.call(i,i.__data__,s,o);return this;},attr:function attr(t,e){var n=Yn(t);if(arguments.length<2){var r=this.node();return n.local?r.getAttributeNS(n.space,n.local):r.getAttribute(n);}return this.each((null==e?n.local?Xn:Vn:\"function\"==typeof e?n.local?tr:Qn:n.local?Jn:Kn)(n,e));},style:function style(t,e,n){return arguments.length>1?this.each((null==e?nr:\"function\"==typeof e?ir:rr)(t,e,null==n?\"\":n)):or(this.node(),t);},property:function property(t,e){return arguments.length>1?this.each((null==e?sr:\"function\"==typeof e?ur:ar)(t,e)):this.node()[t];},classed:function classed(t,e){var n=lr(t+\"\");if(arguments.length<2){for(var r=hr(this.node()),i=-1,o=n.length;++i<o;)if(!r.contains(n[i]))return!1;return!0;}return this.each((\"function\"==typeof e?_r:e?pr:gr)(n,e));},text:function text(t){return arguments.length?this.each(null==t?mr:(\"function\"==typeof t?yr:vr)(t)):this.node().textContent;},html:function html(t){return arguments.length?this.each(null==t?br:(\"function\"==typeof t?xr:wr)(t)):this.node().innerHTML;},raise:function raise(){return this.each(kr);},lower:function lower(){return this.each(Ar);},append:function append(t){var e=\"function\"==typeof t?t:Mr(t);return this.select(function(){return this.appendChild(e.apply(this,arguments));});},insert:function insert(t,e){var n=\"function\"==typeof t?t:Mr(t),r=null==e?Br:\"function\"==typeof e?e:zn(e);return this.select(function(){return this.insertBefore(n.apply(this,arguments),r.apply(this,arguments)||null);});},remove:function remove(){return this.each(Tr);},clone:function clone(t){return this.select(t?Cr:zr);},datum:function datum(t){return arguments.length?this.property(\"__data__\",t):this.node().__data__;},on:function on(t,e,n){var r,i,o=function(t){return t.trim().split(/^|\\s+/).map(function(t){var e=\"\",n=t.indexOf(\".\");return n>=0&&(e=t.slice(n+1),t=t.slice(0,n)),{type:t,name:e};});}(t+\"\"),s=o.length;if(!(arguments.length<2)){for(a=e?Ir:Nr,r=0;r<s;++r)this.each(a(o[r],e,n));return this;}var a=this.node().__on;if(a)for(var u,l=0,h=a.length;l<h;++l)for(r=0,u=a[l];r<s;++r)if((i=o[r]).type===u.type&&i.name===u.name)return u.value;},dispatch:function dispatch(t,e){return this.each((\"function\"==typeof e?Lr:Rr)(t,e));}},Symbol.iterator,/*#__PURE__*/_regeneratorRuntime().mark(function _callee65(){var t,e,n,r,i,o,s;return _regeneratorRuntime().wrap(function _callee65$(_context68){while(1)switch(_context68.prev=_context68.next){case 0:t=this._groups,e=0,n=t.length;case 1:if(!(e<n)){_context68.next=14;break;}i=t[e],o=0,s=i.length;case 3:if(!(o<s)){_context68.next=11;break;}_context68.t0=r=i[o];if(!_context68.t0){_context68.next=8;break;}_context68.next=8;return r;case 8:++o;_context68.next=3;break;case 11:++e;_context68.next=1;break;case 14:case\"end\":return _context68.stop();}},_callee65,this);}));var Dr=Pr;function Fr(t){return\"string\"==typeof t?new jr([[document.querySelector(t)]],[document.documentElement]):new jr([[t]],Ur);}function $r(t){t.preventDefault(),t.stopImmediatePropagation();}function Hr(t){var e=t.document.documentElement,n=Fr(t).on(\"dragstart.drag\",$r,!0);\"onselectstart\"in e?n.on(\"selectstart.drag\",$r,!0):(e.__noselect=e.style.MozUserSelect,e.style.MozUserSelect=\"none\");}function qr(t,e){var n=t.document.documentElement,r=Fr(t).on(\"dragstart.drag\",null);e&&(r.on(\"click.drag\",$r,!0),setTimeout(function(){r.on(\"click.drag\",null);},0)),\"onselectstart\"in n?r.on(\"selectstart.drag\",null):(n.style.MozUserSelect=n.__noselect,delete n.__noselect);}function Zr(t,e){if(t=function(t){var e;for(;e=t.sourceEvent;)t=e;return t;}(t),void 0===e&&(e=t.currentTarget),e){var n=e.ownerSVGElement||e;if(n.createSVGPoint){var r=n.createSVGPoint();return r.x=t.clientX,r.y=t.clientY,[(r=r.matrixTransform(e.getScreenCTM().inverse())).x,r.y];}if(e.getBoundingClientRect){var i=e.getBoundingClientRect();return[t.clientX-i.left-e.clientLeft,t.clientY-i.top-e.clientTop];}}return[t.pageX,t.pageY];}var Wr,Gr,Yr=0,Vr=0,Xr=0,Kr=1e3,Jr=0,Qr=0,ti=0,ei=\"object\"==(typeof performance===\"undefined\"?\"undefined\":_typeof(performance))&&performance.now?performance:Date,ni=\"object\"==(typeof window===\"undefined\"?\"undefined\":_typeof(window))&&window.requestAnimationFrame?window.requestAnimationFrame.bind(window):function(t){setTimeout(t,17);};function ri(){return Qr||(ni(ii),Qr=ei.now()+ti);}function ii(){Qr=0;}function oi(){this._call=this._time=this._next=null;}function si(t,e,n){var r=new oi();return r.restart(t,e,n),r;}function ai(){Qr=(Jr=ei.now())+ti,Yr=Vr=0;try{!function(){ri(),++Yr;for(var t,e=Wr;e;)(t=Qr-e._time)>=0&&e._call.call(null,t),e=e._next;--Yr;}();}finally{Yr=0,function(){for(var t,e,n=Wr,r=1/0;n;)n._call?(r>n._time&&(r=n._time),t=n,n=n._next):(e=n._next,n._next=null,n=t?t._next=e:Wr=e);Gr=t,li(r);}(),Qr=0;}}function ui(){var t=ei.now(),e=t-Jr;e>Kr&&(ti-=e,Jr=t);}function li(t){Yr||(Vr&&(Vr=clearTimeout(Vr)),t-Qr>24?(t<1/0&&(Vr=setTimeout(ai,t-ei.now()-ti)),Xr&&(Xr=clearInterval(Xr))):(Xr||(Jr=ei.now(),Xr=setInterval(ui,Kr)),Yr=1,ni(ai)));}function hi(t,e,n){var r=new oi();return e=null==e?0:+e,r.restart(function(n){r.stop(),t(n+e);},e,n),r;}oi.prototype=si.prototype={constructor:oi,restart:function restart(t,e,n){if(\"function\"!=typeof t)throw new TypeError(\"callback is not a function\");n=(null==n?ri():+n)+(null==e?0:+e),this._next||Gr===this||(Gr?Gr._next=this:Wr=this,Gr=this),this._call=t,this._time=n,li();},stop:function stop(){this._call&&(this._call=null,this._time=1/0,li());}};var ci=Qe(\"start\",\"end\",\"cancel\",\"interrupt\"),fi=[],di=0,pi=2,gi=3,_i=5,mi=6;function vi(t,e,n,r,i,o){var s=t.__transition;if(s){if(n in s)return;}else t.__transition={};!function(t,e,n){var r,i=t.__transition;function o(u){var l,h,c,f;if(1!==n.state)return a();for(l in i)if((f=i[l]).name===n.name){if(f.state===gi)return hi(o);4===f.state?(f.state=mi,f.timer.stop(),f.on.call(\"interrupt\",t,t.__data__,f.index,f.group),delete i[l]):+l<e&&(f.state=mi,f.timer.stop(),f.on.call(\"cancel\",t,t.__data__,f.index,f.group),delete i[l]);}if(hi(function(){n.state===gi&&(n.state=4,n.timer.restart(s,n.delay,n.time),s(u));}),n.state=pi,n.on.call(\"start\",t,t.__data__,n.index,n.group),n.state===pi){for(n.state=gi,r=new Array(c=n.tween.length),l=0,h=-1;l<c;++l)(f=n.tween[l].value.call(t,t.__data__,n.index,n.group))&&(r[++h]=f);r.length=h+1;}}function s(e){for(var i=e<n.duration?n.ease.call(null,e/n.duration):(n.timer.restart(a),n.state=_i,1),o=-1,s=r.length;++o<s;)r[o].call(t,i);n.state===_i&&(n.on.call(\"end\",t,t.__data__,n.index,n.group),a());}function a(){for(var r in n.state=mi,n.timer.stop(),delete i[e],i)return;delete t.__transition;}i[e]=n,n.timer=si(function(t){n.state=1,n.timer.restart(o,n.delay,n.time),n.delay<=t&&o(t-n.delay);},0,n.time);}(t,n,{name:e,index:r,group:i,on:ci,tween:fi,time:o.time,delay:o.delay,duration:o.duration,ease:o.ease,timer:null,state:di});}function yi(t,e){var n=wi(t,e);if(n.state>di)throw new Error(\"too late; already scheduled\");return n;}function bi(t,e){var n=wi(t,e);if(n.state>gi)throw new Error(\"too late; already running\");return n;}function wi(t,e){var n=t.__transition;if(!n||!(n=n[e]))throw new Error(\"transition not found\");return n;}function xi(t,e){var n,r,i,o=t.__transition,s=!0;if(o){for(i in e=null==e?null:e+\"\",o)(n=o[i]).name===e?(r=n.state>pi&&n.state<_i,n.state=mi,n.timer.stop(),n.on.call(r?\"interrupt\":\"cancel\",t,t.__data__,n.index,n.group),delete o[i]):s=!1;s&&delete t.__transition;}}var ki,Ai=180/Math.PI,Ei={translateX:0,translateY:0,rotate:0,skewX:0,scaleX:1,scaleY:1};function Si(t,e,n,r,i,o){var s,a,u;return(s=Math.sqrt(t*t+e*e))&&(t/=s,e/=s),(u=t*n+e*r)&&(n-=t*u,r-=e*u),(a=Math.sqrt(n*n+r*r))&&(n/=a,r/=a,u/=a),t*r<e*n&&(t=-t,e=-e,u=-u,s=-s),{translateX:i,translateY:o,rotate:Math.atan2(e,t)*Ai,skewX:Math.atan(u)*Ai,scaleX:s,scaleY:a};}function Mi(t,e,n,r){function i(t){return t.length?t.pop()+\" \":\"\";}return function(o,s){var a=[],u=[];return o=t(o),s=t(s),function(t,r,i,o,s,a){if(t!==i||r!==o){var u=s.push(\"translate(\",null,e,null,n);a.push({i:u-4,x:ut(t,i)},{i:u-2,x:ut(r,o)});}else(i||o)&&s.push(\"translate(\"+i+e+o+n);}(o.translateX,o.translateY,s.translateX,s.translateY,a,u),function(t,e,n,o){t!==e?(t-e>180?e+=360:e-t>180&&(t+=360),o.push({i:n.push(i(n)+\"rotate(\",null,r)-2,x:ut(t,e)})):e&&n.push(i(n)+\"rotate(\"+e+r);}(o.rotate,s.rotate,a,u),function(t,e,n,o){t!==e?o.push({i:n.push(i(n)+\"skewX(\",null,r)-2,x:ut(t,e)}):e&&n.push(i(n)+\"skewX(\"+e+r);}(o.skewX,s.skewX,a,u),function(t,e,n,r,o,s){if(t!==n||e!==r){var a=o.push(i(o)+\"scale(\",null,\",\",null,\")\");s.push({i:a-4,x:ut(t,n)},{i:a-2,x:ut(e,r)});}else 1===n&&1===r||o.push(i(o)+\"scale(\"+n+\",\"+r+\")\");}(o.scaleX,o.scaleY,s.scaleX,s.scaleY,a,u),o=s=null,function(t){for(var e,n=-1,r=u.length;++n<r;)a[(e=u[n]).i]=e.x(t);return a.join(\"\");};};}var Bi=Mi(function(t){var e=new(\"function\"==typeof DOMMatrix?DOMMatrix:WebKitCSSMatrix)(t+\"\");return e.isIdentity?Ei:Si(e.a,e.b,e.c,e.d,e.e,e.f);},\"px, \",\"px)\",\"deg)\"),Ti=Mi(function(t){return null==t?Ei:(ki||(ki=document.createElementNS(\"http://www.w3.org/2000/svg\",\"g\")),ki.setAttribute(\"transform\",t),(t=ki.transform.baseVal.consolidate())?Si((t=t.matrix).a,t.b,t.c,t.d,t.e,t.f):Ei);},\", \",\")\",\")\");function zi(t,e){var n,r;return function(){var i=bi(this,t),o=i.tween;if(o!==n)for(var s=0,a=(r=n=o).length;s<a;++s)if(r[s].name===e){(r=r.slice()).splice(s,1);break;}i.tween=r;};}function Ci(t,e,n){var r,i;if(\"function\"!=typeof n)throw new Error();return function(){var o=bi(this,t),s=o.tween;if(s!==r){i=(r=s).slice();for(var a={name:e,value:n},u=0,l=i.length;u<l;++u)if(i[u].name===e){i[u]=a;break;}u===l&&i.push(a);}o.tween=i;};}function Ni(t,e,n){var r=t._id;return t.each(function(){var t=bi(this,r);(t.value||(t.value={}))[e]=n.apply(this,arguments);}),function(t){return wi(t,r).value[e];};}function Ii(t,e){var n;return(\"number\"==typeof e?ut:e instanceof H?it:(n=H(e))?(e=n,it):ft)(t,e);}function Oi(t){return function(){this.removeAttribute(t);};}function Ri(t){return function(){this.removeAttributeNS(t.space,t.local);};}function Li(t,e,n){var r,i,o=n+\"\";return function(){var s=this.getAttribute(t);return s===o?null:s===r?i:i=e(r=s,n);};}function Ui(t,e,n){var r,i,o=n+\"\";return function(){var s=this.getAttributeNS(t.space,t.local);return s===o?null:s===r?i:i=e(r=s,n);};}function ji(t,e,n){var r,i,o;return function(){var s,a,u=n(this);if(null!=u)return(s=this.getAttribute(t))===(a=u+\"\")?null:s===r&&a===i?o:(i=a,o=e(r=s,u));this.removeAttribute(t);};}function Pi(t,e,n){var r,i,o;return function(){var s,a,u=n(this);if(null!=u)return(s=this.getAttributeNS(t.space,t.local))===(a=u+\"\")?null:s===r&&a===i?o:(i=a,o=e(r=s,u));this.removeAttributeNS(t.space,t.local);};}function Di(t,e){var n,r;function i(){var i=e.apply(this,arguments);return i!==r&&(n=(r=i)&&function(t,e){return function(n){this.setAttributeNS(t.space,t.local,e.call(this,n));};}(t,i)),n;}return i._value=e,i;}function Fi(t,e){var n,r;function i(){var i=e.apply(this,arguments);return i!==r&&(n=(r=i)&&function(t,e){return function(n){this.setAttribute(t,e.call(this,n));};}(t,i)),n;}return i._value=e,i;}function $i(t,e){return function(){yi(this,t).delay=+e.apply(this,arguments);};}function Hi(t,e){return e=+e,function(){yi(this,t).delay=e;};}function qi(t,e){return function(){bi(this,t).duration=+e.apply(this,arguments);};}function Zi(t,e){return e=+e,function(){bi(this,t).duration=e;};}var Wi=Dr.prototype.constructor;function Gi(t){return function(){this.style.removeProperty(t);};}var Yi=0;function Vi(t,e,n,r){this._groups=t,this._parents=e,this._name=n,this._id=r;}function Xi(){return++Yi;}var Ki=Dr.prototype;Vi.prototype=function(t){return Dr().transition(t);}.prototype=_defineProperty({constructor:Vi,select:function select(t){var e=this._name,n=this._id;\"function\"!=typeof t&&(t=zn(t));for(var r=this._groups,i=r.length,o=new Array(i),s=0;s<i;++s)for(var a,u,l=r[s],h=l.length,c=o[s]=new Array(h),f=0;f<h;++f)(a=l[f])&&(u=t.call(a,a.__data__,f,l))&&(\"__data__\"in a&&(u.__data__=a.__data__),c[f]=u,vi(c[f],e,n,f,c,wi(a,n)));return new Vi(o,this._parents,e,n);},selectAll:function selectAll(t){var e=this._name,n=this._id;\"function\"!=typeof t&&(t=In(t));for(var r=this._groups,i=r.length,o=[],s=[],a=0;a<i;++a)for(var u,l=r[a],h=l.length,c=0;c<h;++c)if(u=l[c]){for(var f,d=t.call(u,u.__data__,c,l),p=wi(u,n),g=0,_=d.length;g<_;++g)(f=d[g])&&vi(f,e,n,g,d,p);o.push(d),s.push(u);}return new Vi(o,s,e,n);},filter:function filter(t){\"function\"!=typeof t&&(t=On(t));for(var e=this._groups,n=e.length,r=new Array(n),i=0;i<n;++i)for(var o,s=e[i],a=s.length,u=r[i]=[],l=0;l<a;++l)(o=s[l])&&t.call(o,o.__data__,l,s)&&u.push(o);return new Vi(r,this._parents,this._name,this._id);},merge:function merge(t){if(t._id!==this._id)throw new Error();for(var e=this._groups,n=t._groups,r=e.length,i=n.length,o=Math.min(r,i),s=new Array(r),a=0;a<o;++a)for(var u,l=e[a],h=n[a],c=l.length,f=s[a]=new Array(c),d=0;d<c;++d)(u=l[d]||h[d])&&(f[d]=u);for(;a<r;++a)s[a]=e[a];return new Vi(s,this._parents,this._name,this._id);},selection:function selection(){return new Wi(this._groups,this._parents);},transition:function transition(){for(var t=this._name,e=this._id,n=Xi(),r=this._groups,i=r.length,o=0;o<i;++o)for(var s,a=r[o],u=a.length,l=0;l<u;++l)if(s=a[l]){var h=wi(s,e);vi(s,t,n,l,a,{time:h.time+h.delay+h.duration,delay:0,duration:h.duration,ease:h.ease});}return new Vi(r,this._parents,t,n);},call:Ki.call,nodes:Ki.nodes,node:Ki.node,size:Ki.size,empty:Ki.empty,each:Ki.each,on:function on(t,e){var n=this._id;return arguments.length<2?wi(this.node(),n).on.on(t):this.each(function(t,e,n){var r,i,o=function(t){return(t+\"\").trim().split(/^|\\s+/).every(function(t){var e=t.indexOf(\".\");return e>=0&&(t=t.slice(0,e)),!t||\"start\"===t;});}(e)?yi:bi;return function(){var s=o(this,t),a=s.on;a!==r&&(i=(r=a).copy()).on(e,n),s.on=i;};}(n,t,e));},attr:function attr(t,e){var n=Yn(t),r=\"transform\"===n?Ti:Ii;return this.attrTween(t,\"function\"==typeof e?(n.local?Pi:ji)(n,r,Ni(this,\"attr.\"+t,e)):null==e?(n.local?Ri:Oi)(n):(n.local?Ui:Li)(n,r,e));},attrTween:function attrTween(t,e){var n=\"attr.\"+t;if(arguments.length<2)return(n=this.tween(n))&&n._value;if(null==e)return this.tween(n,null);if(\"function\"!=typeof e)throw new Error();var r=Yn(t);return this.tween(n,(r.local?Di:Fi)(r,e));},style:function style(t,e,n){var r=\"transform\"==(t+=\"\")?Bi:Ii;return null==e?this.styleTween(t,function(t,e){var n,r,i;return function(){var o=or(this,t),s=(this.style.removeProperty(t),or(this,t));return o===s?null:o===n&&s===r?i:i=e(n=o,r=s);};}(t,r)).on(\"end.style.\"+t,Gi(t)):\"function\"==typeof e?this.styleTween(t,function(t,e,n){var r,i,o;return function(){var s=or(this,t),a=n(this),u=a+\"\";return null==a&&(this.style.removeProperty(t),u=a=or(this,t)),s===u?null:s===r&&u===i?o:(i=u,o=e(r=s,a));};}(t,r,Ni(this,\"style.\"+t,e))).each(function(t,e){var n,r,i,o,s=\"style.\"+e,a=\"end.\"+s;return function(){var u=bi(this,t),l=u.on,h=null==u.value[s]?o||(o=Gi(e)):void 0;l===n&&i===h||(r=(n=l).copy()).on(a,i=h),u.on=r;};}(this._id,t)):this.styleTween(t,function(t,e,n){var r,i,o=n+\"\";return function(){var s=or(this,t);return s===o?null:s===r?i:i=e(r=s,n);};}(t,r,e),n).on(\"end.style.\"+t,null);},styleTween:function styleTween(t,e,n){var r=\"style.\"+(t+=\"\");if(arguments.length<2)return(r=this.tween(r))&&r._value;if(null==e)return this.tween(r,null);if(\"function\"!=typeof e)throw new Error();return this.tween(r,function(t,e,n){var r,i;function o(){var o=e.apply(this,arguments);return o!==i&&(r=(i=o)&&function(t,e,n){return function(r){this.style.setProperty(t,e.call(this,r),n);};}(t,o,n)),r;}return o._value=e,o;}(t,e,null==n?\"\":n));},text:function text(t){return this.tween(\"text\",\"function\"==typeof t?function(t){return function(){var e=t(this);this.textContent=null==e?\"\":e;};}(Ni(this,\"text\",t)):function(t){return function(){this.textContent=t;};}(null==t?\"\":t+\"\"));},textTween:function textTween(t){var e=\"text\";if(arguments.length<1)return(e=this.tween(e))&&e._value;if(null==t)return this.tween(e,null);if(\"function\"!=typeof t)throw new Error();return this.tween(e,function(t){var e,n;function r(){var r=t.apply(this,arguments);return r!==n&&(e=(n=r)&&function(t){return function(e){this.textContent=t.call(this,e);};}(r)),e;}return r._value=t,r;}(t));},remove:function remove(){return this.on(\"end.remove\",function(t){return function(){var e=this.parentNode;for(var n in this.__transition)if(+n!==t)return;e&&e.removeChild(this);};}(this._id));},tween:function tween(t,e){var n=this._id;if(t+=\"\",arguments.length<2){for(var r,i=wi(this.node(),n).tween,o=0,s=i.length;o<s;++o)if((r=i[o]).name===t)return r.value;return null;}return this.each((null==e?zi:Ci)(n,t,e));},delay:function delay(t){var e=this._id;return arguments.length?this.each((\"function\"==typeof t?$i:Hi)(e,t)):wi(this.node(),e).delay;},duration:function duration(t){var e=this._id;return arguments.length?this.each((\"function\"==typeof t?qi:Zi)(e,t)):wi(this.node(),e).duration;},ease:function ease(t){var e=this._id;return arguments.length?this.each(function(t,e){if(\"function\"!=typeof e)throw new Error();return function(){bi(this,t).ease=e;};}(e,t)):wi(this.node(),e).ease;},easeVarying:function easeVarying(t){if(\"function\"!=typeof t)throw new Error();return this.each(function(t,e){return function(){var n=e.apply(this,arguments);if(\"function\"!=typeof n)throw new Error();bi(this,t).ease=n;};}(this._id,t));},end:function end(){var t,e,n=this,r=n._id,i=n.size();return new Promise(function(o,s){var a={value:s},u={value:function value(){0==--i&&o();}};n.each(function(){var n=bi(this,r),i=n.on;i!==t&&((e=(t=i).copy())._.cancel.push(a),e._.interrupt.push(a),e._.end.push(u)),n.on=e;}),0===i&&o();});}},Symbol.iterator,Ki[Symbol.iterator]);var Ji={time:null,delay:0,duration:250,ease:function ease(t){return((t*=2)<=1?t*t*t:(t-=2)*t*t+2)/2;}};function Qi(t,e){for(var n;!(n=t.__transition)||!(n=n[e]);)if(!(t=t.parentNode))throw new Error(\"transition \".concat(e,\" not found\"));return n;}Dr.prototype.interrupt=function(t){return this.each(function(){xi(this,t);});},Dr.prototype.transition=function(t){var e,n;t instanceof Vi?(e=t._id,t=t._name):(e=Xi(),(n=Ji).time=ri(),t=null==t?null:t+\"\");for(var r=this._groups,i=r.length,o=0;o<i;++o)for(var s,a=r[o],u=a.length,l=0;l<u;++l)(s=a[l])&&vi(s,t,e,l,a,n||Qi(s,e));return new Vi(r,this._parents,t,e);};var to=function to(t){return function(){return t;};};function eo(t,_ref24){var e=_ref24.sourceEvent,n=_ref24.target,r=_ref24.selection,i=_ref24.mode,o=_ref24.dispatch;Object.defineProperties(this,{type:{value:t,enumerable:!0,configurable:!0},sourceEvent:{value:e,enumerable:!0,configurable:!0},target:{value:n,enumerable:!0,configurable:!0},selection:{value:r,enumerable:!0,configurable:!0},mode:{value:i,enumerable:!0,configurable:!0},_:{value:o}});}function no(t){t.preventDefault(),t.stopImmediatePropagation();}var ro={name:\"drag\"},io={name:\"space\"},oo={name:\"handle\"},so={name:\"center\"};var ao=Math.abs,uo=Math.max,lo=Math.min;function ho(t){return[+t[0],+t[1]];}function co(t){return[ho(t[0]),ho(t[1])];}var fo={name:\"x\",handles:[\"w\",\"e\"].map(wo),input:function input(t,e){return null==t?null:[[+t[0],e[0][1]],[+t[1],e[1][1]]];},output:function output(t){return t&&[t[0][0],t[1][0]];}},po={name:\"y\",handles:[\"n\",\"s\"].map(wo),input:function input(t,e){return null==t?null:[[e[0][0],+t[0]],[e[1][0],+t[1]]];},output:function output(t){return t&&[t[0][1],t[1][1]];}},go={name:\"xy\",handles:[\"n\",\"w\",\"e\",\"s\",\"nw\",\"ne\",\"sw\",\"se\"].map(wo),input:function input(t){return null==t?null:co(t);},output:function output(t){return t;}},_o={overlay:\"crosshair\",selection:\"move\",n:\"ns-resize\",e:\"ew-resize\",s:\"ns-resize\",w:\"ew-resize\",nw:\"nwse-resize\",ne:\"nesw-resize\",se:\"nwse-resize\",sw:\"nesw-resize\"},mo={e:\"w\",w:\"e\",nw:\"ne\",ne:\"nw\",se:\"sw\",sw:\"se\"},vo={n:\"s\",s:\"n\",nw:\"sw\",ne:\"se\",se:\"ne\",sw:\"nw\"},yo={overlay:1,selection:1,n:null,e:1,s:null,w:-1,nw:-1,ne:1,se:1,sw:-1},bo={overlay:1,selection:1,n:-1,e:null,s:1,w:null,nw:-1,ne:-1,se:1,sw:1};function wo(t){return{type:t};}function xo(t){return!t.ctrlKey&&!t.button;}function ko(){var t=this.ownerSVGElement||this;return t.hasAttribute(\"viewBox\")?[[(t=t.viewBox.baseVal).x,t.y],[t.x+t.width,t.y+t.height]]:[[0,0],[t.width.baseVal.value,t.height.baseVal.value]];}function Ao(){return navigator.maxTouchPoints||\"ontouchstart\"in this;}function Eo(t){for(;!t.__brush;)if(!(t=t.parentNode))return;return t.__brush;}function So(){return function(t){var e,n=ko,r=xo,i=Ao,o=!0,s=Qe(\"start\",\"brush\",\"end\"),a=6;function u(e){var n=e.property(\"__brush\",g).selectAll(\".overlay\").data([wo(\"overlay\")]);n.enter().append(\"rect\").attr(\"class\",\"overlay\").attr(\"pointer-events\",\"all\").attr(\"cursor\",_o.overlay).merge(n).each(function(){var t=Eo(this).extent;Fr(this).attr(\"x\",t[0][0]).attr(\"y\",t[0][1]).attr(\"width\",t[1][0]-t[0][0]).attr(\"height\",t[1][1]-t[0][1]);}),e.selectAll(\".selection\").data([wo(\"selection\")]).enter().append(\"rect\").attr(\"class\",\"selection\").attr(\"cursor\",_o.selection).attr(\"fill\",\"#777\").attr(\"fill-opacity\",.3).attr(\"stroke\",\"#fff\").attr(\"shape-rendering\",\"crispEdges\");var r=e.selectAll(\".handle\").data(t.handles,function(t){return t.type;});r.exit().remove(),r.enter().append(\"rect\").attr(\"class\",function(t){return\"handle handle--\"+t.type;}).attr(\"cursor\",function(t){return _o[t.type];}),e.each(l).attr(\"fill\",\"none\").attr(\"pointer-events\",\"all\").on(\"mousedown.brush\",f).filter(i).on(\"touchstart.brush\",f).on(\"touchmove.brush\",d).on(\"touchend.brush touchcancel.brush\",p).style(\"touch-action\",\"none\").style(\"-webkit-tap-highlight-color\",\"rgba(0,0,0,0)\");}function l(){var t=Fr(this),e=Eo(this).selection;e?(t.selectAll(\".selection\").style(\"display\",null).attr(\"x\",e[0][0]).attr(\"y\",e[0][1]).attr(\"width\",e[1][0]-e[0][0]).attr(\"height\",e[1][1]-e[0][1]),t.selectAll(\".handle\").style(\"display\",null).attr(\"x\",function(t){return\"e\"===t.type[t.type.length-1]?e[1][0]-a/2:e[0][0]-a/2;}).attr(\"y\",function(t){return\"s\"===t.type[0]?e[1][1]-a/2:e[0][1]-a/2;}).attr(\"width\",function(t){return\"n\"===t.type||\"s\"===t.type?e[1][0]-e[0][0]+a:a;}).attr(\"height\",function(t){return\"e\"===t.type||\"w\"===t.type?e[1][1]-e[0][1]+a:a;})):t.selectAll(\".selection,.handle\").style(\"display\",\"none\").attr(\"x\",null).attr(\"y\",null).attr(\"width\",null).attr(\"height\",null);}function h(t,e,n){var r=t.__brush.emitter;return!r||n&&r.clean?new c(t,e,n):r;}function c(t,e,n){this.that=t,this.args=e,this.state=t.__brush,this.active=0,this.clean=n;}function f(n){if((!e||n.touches)&&r.apply(this,arguments)){var i,s,a,u,c,f,d,p,g,_,m,v=this,y=n.target.__data__.type,b=\"selection\"===(o&&n.metaKey?y=\"overlay\":y)?ro:o&&n.altKey?so:oo,w=t===po?null:yo[y],x=t===fo?null:bo[y],k=Eo(v),A=k.extent,E=k.selection,S=A[0][0],M=A[0][1],B=A[1][0],T=A[1][1],z=0,C=0,N=w&&x&&o&&n.shiftKey,I=Array.from(n.touches||[n],function(t){var e=t.identifier;return(t=Zr(t,v)).point0=t.slice(),t.identifier=e,t;});if(\"overlay\"===y){E&&(g=!0);var _e54=[I[0],I[1]||I[0]];k.selection=E=[[i=t===po?S:lo(_e54[0][0],_e54[1][0]),a=t===fo?M:lo(_e54[0][1],_e54[1][1])],[c=t===po?B:uo(_e54[0][0],_e54[1][0]),d=t===fo?T:uo(_e54[0][1],_e54[1][1])]],I.length>1&&P();}else i=E[0][0],a=E[0][1],c=E[1][0],d=E[1][1];s=i,u=a,f=c,p=d;var O=Fr(v).attr(\"pointer-events\",\"none\"),R=O.selectAll(\".overlay\").attr(\"cursor\",_o[y]);xi(v);var L=h(v,arguments,!0).beforestart();if(n.touches)L.moved=j,L.ended=D;else{var U=Fr(n.view).on(\"mousemove.brush\",j,!0).on(\"mouseup.brush\",D,!0);o&&U.on(\"keydown.brush\",function(t){switch(t.keyCode){case 16:N=w&&x;break;case 18:b===oo&&(w&&(c=f-z*w,i=s+z*w),x&&(d=p-C*x,a=u+C*x),b=so,P());break;case 32:b!==oo&&b!==so||(w<0?c=f-z:w>0&&(i=s-z),x<0?d=p-C:x>0&&(a=u-C),b=io,R.attr(\"cursor\",_o.selection),P());break;default:return;}no(t);},!0).on(\"keyup.brush\",function(t){switch(t.keyCode){case 16:N&&(_=m=N=!1,P());break;case 18:b===so&&(w<0?c=f:w>0&&(i=s),x<0?d=p:x>0&&(a=u),b=oo,P());break;case 32:b===io&&(t.altKey?(w&&(c=f-z*w,i=s+z*w),x&&(d=p-C*x,a=u+C*x),b=so):(w<0?c=f:w>0&&(i=s),x<0?d=p:x>0&&(a=u),b=oo),R.attr(\"cursor\",_o[y]),P());break;default:return;}no(t);},!0),Hr(n.view);}l.call(v),L.start(n,b.name);}function j(t){var _iterator22=_createForOfIteratorHelper(t.changedTouches||[t]),_step22;try{for(_iterator22.s();!(_step22=_iterator22.n()).done;){var _e55=_step22.value;var _iterator24=_createForOfIteratorHelper(I),_step24;try{for(_iterator24.s();!(_step24=_iterator24.n()).done;){var _t61=_step24.value;_t61.identifier===_e55.identifier&&(_t61.cur=Zr(_e55,v));}}catch(err){_iterator24.e(err);}finally{_iterator24.f();}}}catch(err){_iterator22.e(err);}finally{_iterator22.f();}if(N&&!_&&!m&&1===I.length){var _t60=I[0];ao(_t60.cur[0]-_t60[0])>ao(_t60.cur[1]-_t60[1])?m=!0:_=!0;}var _iterator23=_createForOfIteratorHelper(I),_step23;try{for(_iterator23.s();!(_step23=_iterator23.n()).done;){var _t62=_step23.value;_t62.cur&&(_t62[0]=_t62.cur[0],_t62[1]=_t62.cur[1]);}}catch(err){_iterator23.e(err);}finally{_iterator23.f();}g=!0,no(t),P(t);}function P(t){var e=I[0],n=e.point0;var r;switch(z=e[0]-n[0],C=e[1]-n[1],b){case io:case ro:w&&(z=uo(S-i,lo(B-c,z)),s=i+z,f=c+z),x&&(C=uo(M-a,lo(T-d,C)),u=a+C,p=d+C);break;case oo:I[1]?(w&&(s=uo(S,lo(B,I[0][0])),f=uo(S,lo(B,I[1][0])),w=1),x&&(u=uo(M,lo(T,I[0][1])),p=uo(M,lo(T,I[1][1])),x=1)):(w<0?(z=uo(S-i,lo(B-i,z)),s=i+z,f=c):w>0&&(z=uo(S-c,lo(B-c,z)),s=i,f=c+z),x<0?(C=uo(M-a,lo(T-a,C)),u=a+C,p=d):x>0&&(C=uo(M-d,lo(T-d,C)),u=a,p=d+C));break;case so:w&&(s=uo(S,lo(B,i-z*w)),f=uo(S,lo(B,c+z*w))),x&&(u=uo(M,lo(T,a-C*x)),p=uo(M,lo(T,d+C*x)));}f<s&&(w*=-1,r=i,i=c,c=r,r=s,s=f,f=r,y in mo&&R.attr(\"cursor\",_o[y=mo[y]])),p<u&&(x*=-1,r=a,a=d,d=r,r=u,u=p,p=r,y in vo&&R.attr(\"cursor\",_o[y=vo[y]])),k.selection&&(E=k.selection),_&&(s=E[0][0],f=E[1][0]),m&&(u=E[0][1],p=E[1][1]),E[0][0]===s&&E[0][1]===u&&E[1][0]===f&&E[1][1]===p||(k.selection=[[s,u],[f,p]],l.call(v),L.brush(t,b.name));}function D(t){if(function(t){t.stopImmediatePropagation();}(t),t.touches){if(t.touches.length)return;e&&clearTimeout(e),e=setTimeout(function(){e=null;},500);}else qr(t.view,g),U.on(\"keydown.brush keyup.brush mousemove.brush mouseup.brush\",null);O.attr(\"pointer-events\",\"all\"),R.attr(\"cursor\",_o.overlay),k.selection&&(E=k.selection),function(t){return t[0][0]===t[1][0]||t[0][1]===t[1][1];}(E)&&(k.selection=null,l.call(v)),L.end(t,b.name);}}function d(t){h(this,arguments).moved(t);}function p(t){h(this,arguments).ended(t);}function g(){var e=this.__brush||{selection:null};return e.extent=co(n.apply(this,arguments)),e.dim=t,e;}return u.move=function(e,n){e.tween?e.on(\"start.brush\",function(t){h(this,arguments).beforestart().start(t);}).on(\"interrupt.brush end.brush\",function(t){h(this,arguments).end(t);}).tween(\"brush\",function(){var e=this,r=e.__brush,i=h(e,arguments),o=r.selection,s=t.input(\"function\"==typeof n?n.apply(this,arguments):n,r.extent),a=pt(o,s);function u(t){r.selection=1===t&&null===s?null:a(t),l.call(e),i.brush();}return null!==o&&null!==s?u:u(1);}):e.each(function(){var e=this,r=arguments,i=e.__brush,o=t.input(\"function\"==typeof n?n.apply(e,r):n,i.extent),s=h(e,r).beforestart();xi(e),i.selection=null===o?null:o,l.call(e),s.start().brush().end();});},u.clear=function(t){u.move(t,null);},c.prototype={beforestart:function beforestart(){return 1==++this.active&&(this.state.emitter=this,this.starting=!0),this;},start:function start(t,e){return this.starting?(this.starting=!1,this.emit(\"start\",t,e)):this.emit(\"brush\",t),this;},brush:function brush(t,e){return this.emit(\"brush\",t,e),this;},end:function end(t,e){return 0==--this.active&&(delete this.state.emitter,this.emit(\"end\",t,e)),this;},emit:function emit(e,n,r){var i=Fr(this.that).datum();s.call(e,this.that,new eo(e,{sourceEvent:n,target:u,selection:t.output(this.state.selection),mode:r,dispatch:s}),i);}},u.extent=function(t){return arguments.length?(n=\"function\"==typeof t?t:to(co(t)),u):n;},u.filter=function(t){return arguments.length?(r=\"function\"==typeof t?t:to(!!t),u):r;},u.touchable=function(t){return arguments.length?(i=\"function\"==typeof t?t:to(!!t),u):i;},u.handleSize=function(t){return arguments.length?(a=+t,u):a;},u.keyModifiers=function(t){return arguments.length?(o=!!t,u):o;},u.on=function(){var t=s.on.apply(s,arguments);return t===s?u:t;},u;}(go);}function Mo(t,e){if((n=(t=e?t.toExponential(e-1):t.toExponential()).indexOf(\"e\"))<0)return null;var n,r=t.slice(0,n);return[r.length>1?r[0]+r.slice(2):r,+t.slice(n+1)];}var Bo,To=/^(?:(.)?([<>=^]))?([+\\-( ])?([$#])?(0)?(\\d+)?(,)?(\\.\\d+)?(~)?([a-z%])?$/i;function zo(t){if(!(e=To.exec(t)))throw new Error(\"invalid format: \"+t);var e;return new Co({fill:e[1],align:e[2],sign:e[3],symbol:e[4],zero:e[5],width:e[6],comma:e[7],precision:e[8]&&e[8].slice(1),trim:e[9],type:e[10]});}function Co(t){this.fill=void 0===t.fill?\" \":t.fill+\"\",this.align=void 0===t.align?\">\":t.align+\"\",this.sign=void 0===t.sign?\"-\":t.sign+\"\",this.symbol=void 0===t.symbol?\"\":t.symbol+\"\",this.zero=!!t.zero,this.width=void 0===t.width?void 0:+t.width,this.comma=!!t.comma,this.precision=void 0===t.precision?void 0:+t.precision,this.trim=!!t.trim,this.type=void 0===t.type?\"\":t.type+\"\";}function No(t,e){var n=Mo(t,e);if(!n)return t+\"\";var r=n[0],i=n[1];return i<0?\"0.\"+new Array(-i).join(\"0\")+r:r.length>i+1?r.slice(0,i+1)+\".\"+r.slice(i+1):r+new Array(i-r.length+2).join(\"0\");}zo.prototype=Co.prototype,Co.prototype.toString=function(){return this.fill+this.align+this.sign+this.symbol+(this.zero?\"0\":\"\")+(void 0===this.width?\"\":Math.max(1,0|this.width))+(this.comma?\",\":\"\")+(void 0===this.precision?\"\":\".\"+Math.max(0,0|this.precision))+(this.trim?\"~\":\"\")+this.type;};var Io={\"%\":function _(t,e){return(100*t).toFixed(e);},b:function b(t){return Math.round(t).toString(2);},c:function c(t){return t+\"\";},d:function d(t){return Math.abs(t=Math.round(t))>=1e21?t.toLocaleString(\"en\").replace(/,/g,\"\"):t.toString(10);},e:function e(t,_e56){return t.toExponential(_e56);},f:function f(t,e){return t.toFixed(e);},g:function g(t,e){return t.toPrecision(e);},o:function o(t){return Math.round(t).toString(8);},p:function p(t,e){return No(100*t,e);},r:No,s:function s(t,e){var n=Mo(t,e);if(!n)return t+\"\";var r=n[0],i=n[1],o=i-(Bo=3*Math.max(-8,Math.min(8,Math.floor(i/3))))+1,s=r.length;return o===s?r:o>s?r+new Array(o-s+1).join(\"0\"):o>0?r.slice(0,o)+\".\"+r.slice(o):\"0.\"+new Array(1-o).join(\"0\")+Mo(t,Math.max(0,e+o-1))[0];},X:function X(t){return Math.round(t).toString(16).toUpperCase();},x:function x(t){return Math.round(t).toString(16);}};function Oo(t){return t;}var Ro,Lo,Uo=Array.prototype.map,jo=[\"y\",\"z\",\"a\",\"f\",\"p\",\"n\",\"µ\",\"m\",\"\",\"k\",\"M\",\"G\",\"T\",\"P\",\"E\",\"Z\",\"Y\"];function Po(t){var e=0,n=t.children,r=n&&n.length;if(r)for(;--r>=0;)e+=n[r].value;else e=1;t.value=e;}function Do(t,e){t instanceof Map?(t=[void 0,t],void 0===e&&(e=$o)):void 0===e&&(e=Fo);for(var n,r,i,o,s,a=new Zo(t),u=[a];n=u.pop();)if((i=e(n.data))&&(s=(i=Array.from(i)).length))for(n.children=i,o=s-1;o>=0;--o)u.push(r=i[o]=new Zo(i[o])),r.parent=n,r.depth=n.depth+1;return a.eachBefore(qo);}function Fo(t){return t.children;}function $o(t){return Array.isArray(t)?t[1]:null;}function Ho(t){void 0!==t.data.value&&(t.value=t.data.value),t.data=t.data.data;}function qo(t){var e=0;do{t.height=e;}while((t=t.parent)&&t.height<++e);}function Zo(t){this.data=t,this.depth=this.height=0,this.parent=null;}Ro=function(t){var e,n,r=void 0===t.grouping||void 0===t.thousands?Oo:(e=Uo.call(t.grouping,Number),n=t.thousands+\"\",function(t,r){for(var i=t.length,o=[],s=0,a=e[0],u=0;i>0&&a>0&&(u+a+1>r&&(a=Math.max(1,r-u)),o.push(t.substring(i-=a,i+a)),!((u+=a+1)>r));)a=e[s=(s+1)%e.length];return o.reverse().join(n);}),i=void 0===t.currency?\"\":t.currency[0]+\"\",o=void 0===t.currency?\"\":t.currency[1]+\"\",s=void 0===t.decimal?\".\":t.decimal+\"\",a=void 0===t.numerals?Oo:function(t){return function(e){return e.replace(/[0-9]/g,function(e){return t[+e];});};}(Uo.call(t.numerals,String)),u=void 0===t.percent?\"%\":t.percent+\"\",l=void 0===t.minus?\"−\":t.minus+\"\",h=void 0===t.nan?\"NaN\":t.nan+\"\";function c(t){var e=(t=zo(t)).fill,n=t.align,c=t.sign,f=t.symbol,d=t.zero,p=t.width,g=t.comma,_=t.precision,m=t.trim,v=t.type;\"n\"===v?(g=!0,v=\"g\"):Io[v]||(void 0===_&&(_=12),m=!0,v=\"g\"),(d||\"0\"===e&&\"=\"===n)&&(d=!0,e=\"0\",n=\"=\");var y=\"$\"===f?i:\"#\"===f&&/[boxX]/.test(v)?\"0\"+v.toLowerCase():\"\",b=\"$\"===f?o:/[%p]/.test(v)?u:\"\",w=Io[v],x=/[defgprs%]/.test(v);function k(t){var i,o,u,f=y,k=b;if(\"c\"===v)k=w(t)+k,t=\"\";else{var A=(t=+t)<0||1/t<0;if(t=isNaN(t)?h:w(Math.abs(t),_),m&&(t=function(t){t:for(var e,n=t.length,r=1,i=-1;r<n;++r)switch(t[r]){case\".\":i=e=r;break;case\"0\":0===i&&(i=r),e=r;break;default:if(!+t[r])break t;i>0&&(i=0);}return i>0?t.slice(0,i)+t.slice(e+1):t;}(t)),A&&0==+t&&\"+\"!==c&&(A=!1),f=(A?\"(\"===c?c:l:\"-\"===c||\"(\"===c?\"\":c)+f,k=(\"s\"===v?jo[8+Bo/3]:\"\")+k+(A&&\"(\"===c?\")\":\"\"),x)for(i=-1,o=t.length;++i<o;)if(48>(u=t.charCodeAt(i))||u>57){k=(46===u?s+t.slice(i+1):t.slice(i))+k,t=t.slice(0,i);break;}}g&&!d&&(t=r(t,1/0));var E=f.length+t.length+k.length,S=E<p?new Array(p-E+1).join(e):\"\";switch(g&&d&&(t=r(S+t,S.length?p-k.length:1/0),S=\"\"),n){case\"<\":t=f+t+k+S;break;case\"=\":t=f+S+t+k;break;case\"^\":t=S.slice(0,E=S.length>>1)+f+t+k+S.slice(E);break;default:t=S+f+t+k;}return a(t);}return _=void 0===_?6:/[gprs]/.test(v)?Math.max(1,Math.min(21,_)):Math.max(0,Math.min(20,_)),k.toString=function(){return t+\"\";},k;}return{format:c,formatPrefix:function formatPrefix(t,e){var n,r=c(((t=zo(t)).type=\"f\",t)),i=3*Math.max(-8,Math.min(8,Math.floor((n=e,((n=Mo(Math.abs(n)))?n[1]:NaN)/3)))),o=Math.pow(10,-i),s=jo[8+i/3];return function(t){return r(o*t)+s;};}};}({thousands:\",\",grouping:[3],currency:[\"$\",\"\"]}),Lo=Ro.format,Ro.formatPrefix,Zo.prototype=Do.prototype=_defineProperty({constructor:Zo,count:function count(){return this.eachAfter(Po);},each:function each(t,e){var n=-1;var _iterator25=_createForOfIteratorHelper(this),_step25;try{for(_iterator25.s();!(_step25=_iterator25.n()).done;){var _r33=_step25.value;t.call(e,_r33,++n,this);}}catch(err){_iterator25.e(err);}finally{_iterator25.f();}return this;},eachAfter:function eachAfter(t,e){for(var n,r,i,o=this,s=[o],a=[],u=-1;o=s.pop();)if(a.push(o),n=o.children)for(r=0,i=n.length;r<i;++r)s.push(n[r]);for(;o=a.pop();)t.call(e,o,++u,this);return this;},eachBefore:function eachBefore(t,e){for(var n,r,i=this,o=[i],s=-1;i=o.pop();)if(t.call(e,i,++s,this),n=i.children)for(r=n.length-1;r>=0;--r)o.push(n[r]);return this;},find:function find(t,e){var n=-1;var _iterator26=_createForOfIteratorHelper(this),_step26;try{for(_iterator26.s();!(_step26=_iterator26.n()).done;){var _r34=_step26.value;if(t.call(e,_r34,++n,this))return _r34;}}catch(err){_iterator26.e(err);}finally{_iterator26.f();}},sum:function sum(t){return this.eachAfter(function(e){for(var n=+t(e.data)||0,r=e.children,i=r&&r.length;--i>=0;)n+=r[i].value;e.value=n;});},sort:function sort(t){return this.eachBefore(function(e){e.children&&e.children.sort(t);});},path:function path(t){for(var e=this,n=function(t,e){if(t===e)return t;var n=t.ancestors(),r=e.ancestors(),i=null;for(t=n.pop(),e=r.pop();t===e;)i=t,t=n.pop(),e=r.pop();return i;}(e,t),r=[e];e!==n;)e=e.parent,r.push(e);for(var i=r.length;t!==n;)r.splice(i,0,t),t=t.parent;return r;},ancestors:function ancestors(){for(var t=this,e=[t];t=t.parent;)e.push(t);return e;},descendants:function descendants(){return Array.from(this);},leaves:function leaves(){var t=[];return this.eachBefore(function(e){e.children||t.push(e);}),t;},links:function links(){var t=this,e=[];return t.each(function(n){n!==t&&e.push({source:n.parent,target:n});}),e;},copy:function copy(){return Do(this).eachBefore(Ho);}},Symbol.iterator,/*#__PURE__*/_regeneratorRuntime().mark(function _callee66(){var t,e,n,r,i,o;return _regeneratorRuntime().wrap(function _callee66$(_context69){while(1)switch(_context69.prev=_context69.next){case 0:i=this,o=[i];case 1:t=o.reverse(),o=[];case 2:if(!(i=t.pop())){_context69.next=9;break;}_context69.next=5;return i;case 5:if(!(e=i.children)){_context69.next=7;break;}for(n=0,r=e.length;n<r;++n)o.push(e[n]);case 7:_context69.next=2;break;case 9:if(o.length){_context69.next=1;break;}case 10:case\"end\":return _context69.stop();}},_callee66,this);}));var Wo=Math.PI,Go=2*Wo,Yo=1e-6,Vo=Go-Yo;function Xo(){this._x0=this._y0=this._x1=this._y1=null,this._=\"\";}function Ko(){return new Xo();}Xo.prototype=Ko.prototype={constructor:Xo,moveTo:function moveTo(t,e){this._+=\"M\"+(this._x0=this._x1=+t)+\",\"+(this._y0=this._y1=+e);},closePath:function closePath(){null!==this._x1&&(this._x1=this._x0,this._y1=this._y0,this._+=\"Z\");},lineTo:function lineTo(t,e){this._+=\"L\"+(this._x1=+t)+\",\"+(this._y1=+e);},quadraticCurveTo:function quadraticCurveTo(t,e,n,r){this._+=\"Q\"+ +t+\",\"+ +e+\",\"+(this._x1=+n)+\",\"+(this._y1=+r);},bezierCurveTo:function bezierCurveTo(t,e,n,r,i,o){this._+=\"C\"+ +t+\",\"+ +e+\",\"+ +n+\",\"+ +r+\",\"+(this._x1=+i)+\",\"+(this._y1=+o);},arcTo:function arcTo(t,e,n,r,i){t=+t,e=+e,n=+n,r=+r,i=+i;var o=this._x1,s=this._y1,a=n-t,u=r-e,l=o-t,h=s-e,c=l*l+h*h;if(i<0)throw new Error(\"negative radius: \"+i);if(null===this._x1)this._+=\"M\"+(this._x1=t)+\",\"+(this._y1=e);else if(c>Yo)if(Math.abs(h*a-u*l)>Yo&&i){var f=n-o,d=r-s,p=a*a+u*u,g=f*f+d*d,_=Math.sqrt(p),m=Math.sqrt(c),v=i*Math.tan((Wo-Math.acos((p+c-g)/(2*_*m)))/2),y=v/m,b=v/_;Math.abs(y-1)>Yo&&(this._+=\"L\"+(t+y*l)+\",\"+(e+y*h)),this._+=\"A\"+i+\",\"+i+\",0,0,\"+ +(h*f>l*d)+\",\"+(this._x1=t+b*a)+\",\"+(this._y1=e+b*u);}else this._+=\"L\"+(this._x1=t)+\",\"+(this._y1=e);},arc:function arc(t,e,n,r,i,o){t=+t,e=+e,o=!!o;var s=(n=+n)*Math.cos(r),a=n*Math.sin(r),u=t+s,l=e+a,h=1^o,c=o?r-i:i-r;if(n<0)throw new Error(\"negative radius: \"+n);null===this._x1?this._+=\"M\"+u+\",\"+l:(Math.abs(this._x1-u)>Yo||Math.abs(this._y1-l)>Yo)&&(this._+=\"L\"+u+\",\"+l),n&&(c<0&&(c=c%Go+Go),c>Vo?this._+=\"A\"+n+\",\"+n+\",0,1,\"+h+\",\"+(t-s)+\",\"+(e-a)+\"A\"+n+\",\"+n+\",0,1,\"+h+\",\"+(this._x1=u)+\",\"+(this._y1=l):c>Yo&&(this._+=\"A\"+n+\",\"+n+\",0,\"+ +(c>=Wo)+\",\"+h+\",\"+(this._x1=t+n*Math.cos(i))+\",\"+(this._y1=e+n*Math.sin(i))));},rect:function rect(t,e,n,r){this._+=\"M\"+(this._x0=this._x1=+t)+\",\"+(this._y0=this._y1=+e)+\"h\"+ +n+\"v\"+ +r+\"h\"+-n+\"Z\";},toString:function toString(){return this._;}};var Jo=Ko;function Qo(t){return function(){return t;};}function ts(t){this._context=t;}function es(t){return new ts(t);}function ns(t){return t[0];}function rs(t){return t[1];}function is(t,e){var n=Qo(!0),r=null,i=es,o=null;function s(s){var a,u,l,h=(s=function(t){return\"object\"==_typeof(t)&&\"length\"in t?t:Array.from(t);}(s)).length,c=!1;for(null==r&&(o=i(l=Jo())),a=0;a<=h;++a)!(a<h&&n(u=s[a],a,s))===c&&((c=!c)?o.lineStart():o.lineEnd()),c&&o.point(+t(u,a,s),+e(u,a,s));if(l)return o=null,l+\"\"||null;}return t=\"function\"==typeof t?t:void 0===t?ns:Qo(t),e=\"function\"==typeof e?e:void 0===e?rs:Qo(e),s.x=function(e){return arguments.length?(t=\"function\"==typeof e?e:Qo(+e),s):t;},s.y=function(t){return arguments.length?(e=\"function\"==typeof t?t:Qo(+t),s):e;},s.defined=function(t){return arguments.length?(n=\"function\"==typeof t?t:Qo(!!t),s):n;},s.curve=function(t){return arguments.length?(i=t,null!=r&&(o=i(r)),s):i;},s.context=function(t){return arguments.length?(null==t?r=o=null:o=i(r=t),s):r;},s;}function os(t,e,n){t._context.bezierCurveTo((2*t._x0+t._x1)/3,(2*t._y0+t._y1)/3,(t._x0+2*t._x1)/3,(t._y0+2*t._y1)/3,(t._x0+4*t._x1+e)/6,(t._y0+4*t._y1+n)/6);}function ss(t){this._context=t;}function as(t){return new ss(t);}function us(t,e){this._context=t,this._t=e;}Array.prototype.slice,ts.prototype={areaStart:function areaStart(){this._line=0;},areaEnd:function areaEnd(){this._line=NaN;},lineStart:function lineStart(){this._point=0;},lineEnd:function lineEnd(){(this._line||0!==this._line&&1===this._point)&&this._context.closePath(),this._line=1-this._line;},point:function point(t,e){switch(t=+t,e=+e,this._point){case 0:this._point=1,this._line?this._context.lineTo(t,e):this._context.moveTo(t,e);break;case 1:this._point=2;default:this._context.lineTo(t,e);}}},ss.prototype={areaStart:function areaStart(){this._line=0;},areaEnd:function areaEnd(){this._line=NaN;},lineStart:function lineStart(){this._x0=this._x1=this._y0=this._y1=NaN,this._point=0;},lineEnd:function lineEnd(){switch(this._point){case 3:os(this,this._x1,this._y1);case 2:this._context.lineTo(this._x1,this._y1);}(this._line||0!==this._line&&1===this._point)&&this._context.closePath(),this._line=1-this._line;},point:function point(t,e){switch(t=+t,e=+e,this._point){case 0:this._point=1,this._line?this._context.lineTo(t,e):this._context.moveTo(t,e);break;case 1:this._point=2;break;case 2:this._point=3,this._context.lineTo((5*this._x0+this._x1)/6,(5*this._y0+this._y1)/6);default:os(this,t,e);}this._x0=this._x1,this._x1=t,this._y0=this._y1,this._y1=e;}},us.prototype={areaStart:function areaStart(){this._line=0;},areaEnd:function areaEnd(){this._line=NaN;},lineStart:function lineStart(){this._x=this._y=NaN,this._point=0;},lineEnd:function lineEnd(){0<this._t&&this._t<1&&2===this._point&&this._context.lineTo(this._x,this._y),(this._line||0!==this._line&&1===this._point)&&this._context.closePath(),this._line>=0&&(this._t=1-this._t,this._line=1-this._line);},point:function point(t,e){switch(t=+t,e=+e,this._point){case 0:this._point=1,this._line?this._context.lineTo(t,e):this._context.moveTo(t,e);break;case 1:this._point=2;default:if(this._t<=0)this._context.lineTo(this._x,e),this._context.lineTo(t,e);else{var n=this._x*(1-this._t)+t*this._t;this._context.lineTo(n,this._y),this._context.lineTo(n,e);}}this._x=t,this._y=e;}};var ls=new Date(),hs=new Date();function cs(t,e,n,r){function i(e){return t(e=0===arguments.length?new Date():new Date(+e)),e;}return i.floor=function(e){return t(e=new Date(+e)),e;},i.ceil=function(n){return t(n=new Date(n-1)),e(n,1),t(n),n;},i.round=function(t){var e=i(t),n=i.ceil(t);return t-e<n-t?e:n;},i.offset=function(t,n){return e(t=new Date(+t),null==n?1:Math.floor(n)),t;},i.range=function(n,r,o){var s,a=[];if(n=i.ceil(n),o=null==o?1:Math.floor(o),!(n<r&&o>0))return a;do{a.push(s=new Date(+n)),e(n,o),t(n);}while(s<n&&n<r);return a;},i.filter=function(n){return cs(function(e){if(e>=e)for(;t(e),!n(e);)e.setTime(e-1);},function(t,r){if(t>=t)if(r<0)for(;++r<=0;)for(;e(t,-1),!n(t););else for(;--r>=0;)for(;e(t,1),!n(t););});},n&&(i.count=function(e,r){return ls.setTime(+e),hs.setTime(+r),t(ls),t(hs),Math.floor(n(ls,hs));},i.every=function(t){return t=Math.floor(t),isFinite(t)&&t>0?t>1?i.filter(r?function(e){return r(e)%t==0;}:function(e){return i.count(0,e)%t==0;}):i:null;}),i;}var fs=864e5,ds=6048e5;function ps(t){return cs(function(e){e.setUTCDate(e.getUTCDate()-(e.getUTCDay()+7-t)%7),e.setUTCHours(0,0,0,0);},function(t,e){t.setUTCDate(t.getUTCDate()+7*e);},function(t,e){return(e-t)/ds;});}var gs=ps(0),_s=ps(1),ms=ps(2),vs=ps(3),ys=ps(4),bs=ps(5),ws=ps(6),xs=(gs.range,_s.range,ms.range,vs.range,ys.range,bs.range,ws.range,cs(function(t){t.setUTCHours(0,0,0,0);},function(t,e){t.setUTCDate(t.getUTCDate()+e);},function(t,e){return(e-t)/fs;},function(t){return t.getUTCDate()-1;}));var ks=xs;function As(t){return cs(function(e){e.setDate(e.getDate()-(e.getDay()+7-t)%7),e.setHours(0,0,0,0);},function(t,e){t.setDate(t.getDate()+7*e);},function(t,e){return(e-t-6e4*(e.getTimezoneOffset()-t.getTimezoneOffset()))/ds;});}xs.range;var Es=As(0),Ss=As(1),Ms=As(2),Bs=As(3),Ts=As(4),zs=As(5),Cs=As(6),Ns=(Es.range,Ss.range,Ms.range,Bs.range,Ts.range,zs.range,Cs.range,cs(function(t){return t.setHours(0,0,0,0);},function(t,e){return t.setDate(t.getDate()+e);},function(t,e){return(e-t-6e4*(e.getTimezoneOffset()-t.getTimezoneOffset()))/fs;},function(t){return t.getDate()-1;}));var Is=Ns;Ns.range;var Os=cs(function(t){t.setMonth(0,1),t.setHours(0,0,0,0);},function(t,e){t.setFullYear(t.getFullYear()+e);},function(t,e){return e.getFullYear()-t.getFullYear();},function(t){return t.getFullYear();});Os.every=function(t){return isFinite(t=Math.floor(t))&&t>0?cs(function(e){e.setFullYear(Math.floor(e.getFullYear()/t)*t),e.setMonth(0,1),e.setHours(0,0,0,0);},function(e,n){e.setFullYear(e.getFullYear()+n*t);}):null;};var Rs=Os;Os.range;var Ls=cs(function(t){t.setUTCMonth(0,1),t.setUTCHours(0,0,0,0);},function(t,e){t.setUTCFullYear(t.getUTCFullYear()+e);},function(t,e){return e.getUTCFullYear()-t.getUTCFullYear();},function(t){return t.getUTCFullYear();});Ls.every=function(t){return isFinite(t=Math.floor(t))&&t>0?cs(function(e){e.setUTCFullYear(Math.floor(e.getUTCFullYear()/t)*t),e.setUTCMonth(0,1),e.setUTCHours(0,0,0,0);},function(e,n){e.setUTCFullYear(e.getUTCFullYear()+n*t);}):null;};var Us=Ls;function js(t){if(0<=t.y&&t.y<100){var e=new Date(-1,t.m,t.d,t.H,t.M,t.S,t.L);return e.setFullYear(t.y),e;}return new Date(t.y,t.m,t.d,t.H,t.M,t.S,t.L);}function Ps(t){if(0<=t.y&&t.y<100){var e=new Date(Date.UTC(-1,t.m,t.d,t.H,t.M,t.S,t.L));return e.setUTCFullYear(t.y),e;}return new Date(Date.UTC(t.y,t.m,t.d,t.H,t.M,t.S,t.L));}function Ds(t,e,n){return{y:t,m:e,d:n,H:0,M:0,S:0,L:0};}Ls.range;var Fs,$s,Hs={\"-\":\"\",_:\" \",0:\"0\"},qs=/^\\s*\\d+/,Zs=/^%/,Ws=/[\\\\^$*+?|[\\]().{}]/g;function Gs(t,e,n){var r=t<0?\"-\":\"\",i=(r?-t:t)+\"\",o=i.length;return r+(o<n?new Array(n-o+1).join(e)+i:i);}function Ys(t){return t.replace(Ws,\"\\\\$&\");}function Vs(t){return new RegExp(\"^(?:\"+t.map(Ys).join(\"|\")+\")\",\"i\");}function Xs(t){return new Map(t.map(function(t,e){return[t.toLowerCase(),e];}));}function Ks(t,e,n){var r=qs.exec(e.slice(n,n+1));return r?(t.w=+r[0],n+r[0].length):-1;}function Js(t,e,n){var r=qs.exec(e.slice(n,n+1));return r?(t.u=+r[0],n+r[0].length):-1;}function Qs(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.U=+r[0],n+r[0].length):-1;}function ta(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.V=+r[0],n+r[0].length):-1;}function ea(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.W=+r[0],n+r[0].length):-1;}function na(t,e,n){var r=qs.exec(e.slice(n,n+4));return r?(t.y=+r[0],n+r[0].length):-1;}function ra(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.y=+r[0]+(+r[0]>68?1900:2e3),n+r[0].length):-1;}function ia(t,e,n){var r=/^(Z)|([+-]\\d\\d)(?::?(\\d\\d))?/.exec(e.slice(n,n+6));return r?(t.Z=r[1]?0:-(r[2]+(r[3]||\"00\")),n+r[0].length):-1;}function oa(t,e,n){var r=qs.exec(e.slice(n,n+1));return r?(t.q=3*r[0]-3,n+r[0].length):-1;}function sa(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.m=r[0]-1,n+r[0].length):-1;}function aa(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.d=+r[0],n+r[0].length):-1;}function ua(t,e,n){var r=qs.exec(e.slice(n,n+3));return r?(t.m=0,t.d=+r[0],n+r[0].length):-1;}function la(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.H=+r[0],n+r[0].length):-1;}function ha(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.M=+r[0],n+r[0].length):-1;}function ca(t,e,n){var r=qs.exec(e.slice(n,n+2));return r?(t.S=+r[0],n+r[0].length):-1;}function fa(t,e,n){var r=qs.exec(e.slice(n,n+3));return r?(t.L=+r[0],n+r[0].length):-1;}function da(t,e,n){var r=qs.exec(e.slice(n,n+6));return r?(t.L=Math.floor(r[0]/1e3),n+r[0].length):-1;}function pa(t,e,n){var r=Zs.exec(e.slice(n,n+1));return r?n+r[0].length:-1;}function ga(t,e,n){var r=qs.exec(e.slice(n));return r?(t.Q=+r[0],n+r[0].length):-1;}function _a(t,e,n){var r=qs.exec(e.slice(n));return r?(t.s=+r[0],n+r[0].length):-1;}function ma(t,e){return Gs(t.getDate(),e,2);}function va(t,e){return Gs(t.getHours(),e,2);}function ya(t,e){return Gs(t.getHours()%12||12,e,2);}function ba(t,e){return Gs(1+Is.count(Rs(t),t),e,3);}function wa(t,e){return Gs(t.getMilliseconds(),e,3);}function xa(t,e){return wa(t,e)+\"000\";}function ka(t,e){return Gs(t.getMonth()+1,e,2);}function Aa(t,e){return Gs(t.getMinutes(),e,2);}function Ea(t,e){return Gs(t.getSeconds(),e,2);}function Sa(t){var e=t.getDay();return 0===e?7:e;}function Ma(t,e){return Gs(Es.count(Rs(t)-1,t),e,2);}function Ba(t){var e=t.getDay();return e>=4||0===e?Ts(t):Ts.ceil(t);}function Ta(t,e){return t=Ba(t),Gs(Ts.count(Rs(t),t)+(4===Rs(t).getDay()),e,2);}function za(t){return t.getDay();}function Ca(t,e){return Gs(Ss.count(Rs(t)-1,t),e,2);}function Na(t,e){return Gs(t.getFullYear()%100,e,2);}function Ia(t,e){return Gs((t=Ba(t)).getFullYear()%100,e,2);}function Oa(t,e){return Gs(t.getFullYear()%1e4,e,4);}function Ra(t,e){var n=t.getDay();return Gs((t=n>=4||0===n?Ts(t):Ts.ceil(t)).getFullYear()%1e4,e,4);}function La(t){var e=t.getTimezoneOffset();return(e>0?\"-\":(e*=-1,\"+\"))+Gs(e/60|0,\"0\",2)+Gs(e%60,\"0\",2);}function Ua(t,e){return Gs(t.getUTCDate(),e,2);}function ja(t,e){return Gs(t.getUTCHours(),e,2);}function Pa(t,e){return Gs(t.getUTCHours()%12||12,e,2);}function Da(t,e){return Gs(1+ks.count(Us(t),t),e,3);}function Fa(t,e){return Gs(t.getUTCMilliseconds(),e,3);}function $a(t,e){return Fa(t,e)+\"000\";}function Ha(t,e){return Gs(t.getUTCMonth()+1,e,2);}function qa(t,e){return Gs(t.getUTCMinutes(),e,2);}function Za(t,e){return Gs(t.getUTCSeconds(),e,2);}function Wa(t){var e=t.getUTCDay();return 0===e?7:e;}function Ga(t,e){return Gs(gs.count(Us(t)-1,t),e,2);}function Ya(t){var e=t.getUTCDay();return e>=4||0===e?ys(t):ys.ceil(t);}function Va(t,e){return t=Ya(t),Gs(ys.count(Us(t),t)+(4===Us(t).getUTCDay()),e,2);}function Xa(t){return t.getUTCDay();}function Ka(t,e){return Gs(_s.count(Us(t)-1,t),e,2);}function Ja(t,e){return Gs(t.getUTCFullYear()%100,e,2);}function Qa(t,e){return Gs((t=Ya(t)).getUTCFullYear()%100,e,2);}function tu(t,e){return Gs(t.getUTCFullYear()%1e4,e,4);}function eu(t,e){var n=t.getUTCDay();return Gs((t=n>=4||0===n?ys(t):ys.ceil(t)).getUTCFullYear()%1e4,e,4);}function nu(){return\"+0000\";}function ru(){return\"%\";}function iu(t){return+t;}function ou(t){return Math.floor(+t/1e3);}function su(t){return((t=Math.exp(t))+1/t)/2;}Fs=function(t){var e=t.dateTime,n=t.date,r=t.time,i=t.periods,o=t.days,s=t.shortDays,a=t.months,u=t.shortMonths,l=Vs(i),h=Xs(i),c=Vs(o),f=Xs(o),d=Vs(s),p=Xs(s),g=Vs(a),_=Xs(a),m=Vs(u),v=Xs(u),y={a:function a(t){return s[t.getDay()];},A:function A(t){return o[t.getDay()];},b:function b(t){return u[t.getMonth()];},B:function B(t){return a[t.getMonth()];},c:null,d:ma,e:ma,f:xa,g:Ia,G:Ra,H:va,I:ya,j:ba,L:wa,m:ka,M:Aa,p:function p(t){return i[+(t.getHours()>=12)];},q:function q(t){return 1+~~(t.getMonth()/3);},Q:iu,s:ou,S:Ea,u:Sa,U:Ma,V:Ta,w:za,W:Ca,x:null,X:null,y:Na,Y:Oa,Z:La,\"%\":ru},b={a:function a(t){return s[t.getUTCDay()];},A:function A(t){return o[t.getUTCDay()];},b:function b(t){return u[t.getUTCMonth()];},B:function B(t){return a[t.getUTCMonth()];},c:null,d:Ua,e:Ua,f:$a,g:Qa,G:eu,H:ja,I:Pa,j:Da,L:Fa,m:Ha,M:qa,p:function p(t){return i[+(t.getUTCHours()>=12)];},q:function q(t){return 1+~~(t.getUTCMonth()/3);},Q:iu,s:ou,S:Za,u:Wa,U:Ga,V:Va,w:Xa,W:Ka,x:null,X:null,y:Ja,Y:tu,Z:nu,\"%\":ru},w={a:function a(t,e,n){var r=d.exec(e.slice(n));return r?(t.w=p.get(r[0].toLowerCase()),n+r[0].length):-1;},A:function A(t,e,n){var r=c.exec(e.slice(n));return r?(t.w=f.get(r[0].toLowerCase()),n+r[0].length):-1;},b:function b(t,e,n){var r=m.exec(e.slice(n));return r?(t.m=v.get(r[0].toLowerCase()),n+r[0].length):-1;},B:function B(t,e,n){var r=g.exec(e.slice(n));return r?(t.m=_.get(r[0].toLowerCase()),n+r[0].length):-1;},c:function c(t,n,r){return A(t,e,n,r);},d:aa,e:aa,f:da,g:ra,G:na,H:la,I:la,j:ua,L:fa,m:sa,M:ha,p:function p(t,e,n){var r=l.exec(e.slice(n));return r?(t.p=h.get(r[0].toLowerCase()),n+r[0].length):-1;},q:oa,Q:ga,s:_a,S:ca,u:Js,U:Qs,V:ta,w:Ks,W:ea,x:function x(t,e,r){return A(t,n,e,r);},X:function X(t,e,n){return A(t,r,e,n);},y:ra,Y:na,Z:ia,\"%\":pa};function x(t,e){return function(n){var r,i,o,s=[],a=-1,u=0,l=t.length;for(n instanceof Date||(n=new Date(+n));++a<l;)37===t.charCodeAt(a)&&(s.push(t.slice(u,a)),null!=(i=Hs[r=t.charAt(++a)])?r=t.charAt(++a):i=\"e\"===r?\" \":\"0\",(o=e[r])&&(r=o(n,i)),s.push(r),u=a+1);return s.push(t.slice(u,a)),s.join(\"\");};}function k(t,e){return function(n){var r,i,o=Ds(1900,void 0,1);if(A(o,t,n+=\"\",0)!=n.length)return null;if(\"Q\"in o)return new Date(o.Q);if(\"s\"in o)return new Date(1e3*o.s+(\"L\"in o?o.L:0));if(e&&!(\"Z\"in o)&&(o.Z=0),\"p\"in o&&(o.H=o.H%12+12*o.p),void 0===o.m&&(o.m=\"q\"in o?o.q:0),\"V\"in o){if(o.V<1||o.V>53)return null;\"w\"in o||(o.w=1),\"Z\"in o?(i=(r=Ps(Ds(o.y,0,1))).getUTCDay(),r=i>4||0===i?_s.ceil(r):_s(r),r=ks.offset(r,7*(o.V-1)),o.y=r.getUTCFullYear(),o.m=r.getUTCMonth(),o.d=r.getUTCDate()+(o.w+6)%7):(i=(r=js(Ds(o.y,0,1))).getDay(),r=i>4||0===i?Ss.ceil(r):Ss(r),r=Is.offset(r,7*(o.V-1)),o.y=r.getFullYear(),o.m=r.getMonth(),o.d=r.getDate()+(o.w+6)%7);}else(\"W\"in o||\"U\"in o)&&(\"w\"in o||(o.w=\"u\"in o?o.u%7:\"W\"in o?1:0),i=\"Z\"in o?Ps(Ds(o.y,0,1)).getUTCDay():js(Ds(o.y,0,1)).getDay(),o.m=0,o.d=\"W\"in o?(o.w+6)%7+7*o.W-(i+5)%7:o.w+7*o.U-(i+6)%7);return\"Z\"in o?(o.H+=o.Z/100|0,o.M+=o.Z%100,Ps(o)):js(o);};}function A(t,e,n,r){for(var i,o,s=0,a=e.length,u=n.length;s<a;){if(r>=u)return-1;if(37===(i=e.charCodeAt(s++))){if(i=e.charAt(s++),!(o=w[i in Hs?e.charAt(s++):i])||(r=o(t,n,r))<0)return-1;}else if(i!=n.charCodeAt(r++))return-1;}return r;}return y.x=x(n,y),y.X=x(r,y),y.c=x(e,y),b.x=x(n,b),b.X=x(r,b),b.c=x(e,b),{format:function format(t){var e=x(t+=\"\",y);return e.toString=function(){return t;},e;},parse:function parse(t){var e=k(t+=\"\",!1);return e.toString=function(){return t;},e;},utcFormat:function utcFormat(t){var e=x(t+=\"\",b);return e.toString=function(){return t;},e;},utcParse:function utcParse(t){var e=k(t+=\"\",!0);return e.toString=function(){return t;},e;}};}({dateTime:\"%x, %X\",date:\"%-m/%-d/%Y\",time:\"%-I:%M:%S %p\",periods:[\"AM\",\"PM\"],days:[\"Sunday\",\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\",\"Saturday\"],shortDays:[\"Sun\",\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\"],months:[\"January\",\"February\",\"March\",\"April\",\"May\",\"June\",\"July\",\"August\",\"September\",\"October\",\"November\",\"December\"],shortMonths:[\"Jan\",\"Feb\",\"Mar\",\"Apr\",\"May\",\"Jun\",\"Jul\",\"Aug\",\"Sep\",\"Oct\",\"Nov\",\"Dec\"]}),Fs.format,$s=Fs.parse,Fs.utcFormat,Fs.utcParse;var au=function t(e,n,r){function i(t,i){var o,s,a=t[0],u=t[1],l=t[2],h=i[0],c=i[1],f=i[2],d=h-a,p=c-u,g=d*d+p*p;if(g<1e-12)s=Math.log(f/l)/e,o=function o(t){return[a+t*d,u+t*p,l*Math.exp(e*t*s)];};else{var _=Math.sqrt(g),m=(f*f-l*l+r*g)/(2*l*n*_),v=(f*f-l*l-r*g)/(2*f*n*_),y=Math.log(Math.sqrt(m*m+1)-m),b=Math.log(Math.sqrt(v*v+1)-v);s=(b-y)/e,o=function o(t){var r,i=t*s,o=su(y),h=l/(n*_)*(o*(r=e*i+y,((r=Math.exp(2*r))-1)/(r+1))-function(t){return((t=Math.exp(t))-1/t)/2;}(y));return[a+h*d,u+h*p,l*o/su(e*i+y)];};}return o.duration=1e3*s*e/Math.SQRT2,o;}return i.rho=function(e){var n=Math.max(.001,+e),r=n*n;return t(n,r,r*r);},i;}(Math.SQRT2,2,4),uu=function uu(t){return function(){return t;};};function lu(t,_ref25){var e=_ref25.sourceEvent,n=_ref25.target,r=_ref25.transform,i=_ref25.dispatch;Object.defineProperties(this,{type:{value:t,enumerable:!0,configurable:!0},sourceEvent:{value:e,enumerable:!0,configurable:!0},target:{value:n,enumerable:!0,configurable:!0},transform:{value:r,enumerable:!0,configurable:!0},_:{value:i}});}function hu(t,e,n){this.k=t,this.x=e,this.y=n;}hu.prototype={constructor:hu,scale:function scale(t){return 1===t?this:new hu(this.k*t,this.x,this.y);},translate:function translate(t,e){return 0===t&0===e?this:new hu(this.k,this.x+this.k*t,this.y+this.k*e);},apply:function apply(t){return[t[0]*this.k+this.x,t[1]*this.k+this.y];},applyX:function applyX(t){return t*this.k+this.x;},applyY:function applyY(t){return t*this.k+this.y;},invert:function invert(t){return[(t[0]-this.x)/this.k,(t[1]-this.y)/this.k];},invertX:function invertX(t){return(t-this.x)/this.k;},invertY:function invertY(t){return(t-this.y)/this.k;},rescaleX:function rescaleX(t){return t.copy().domain(t.range().map(this.invertX,this).map(t.invert,t));},rescaleY:function rescaleY(t){return t.copy().domain(t.range().map(this.invertY,this).map(t.invert,t));},toString:function toString(){return\"translate(\"+this.x+\",\"+this.y+\") scale(\"+this.k+\")\";}};var cu=new hu(1,0,0);function fu(t){t.stopImmediatePropagation();}function du(t){t.preventDefault(),t.stopImmediatePropagation();}function pu(t){return!(t.ctrlKey&&\"wheel\"!==t.type||t.button);}function gu(){var t=this;return t instanceof SVGElement?(t=t.ownerSVGElement||t).hasAttribute(\"viewBox\")?[[(t=t.viewBox.baseVal).x,t.y],[t.x+t.width,t.y+t.height]]:[[0,0],[t.width.baseVal.value,t.height.baseVal.value]]:[[0,0],[t.clientWidth,t.clientHeight]];}function _u(){return this.__zoom||cu;}function mu(t){return-t.deltaY*(1===t.deltaMode?.05:t.deltaMode?1:.002)*(t.ctrlKey?10:1);}function vu(){return navigator.maxTouchPoints||\"ontouchstart\"in this;}function yu(t,e,n){var r=t.invertX(e[0][0])-n[0][0],i=t.invertX(e[1][0])-n[1][0],o=t.invertY(e[0][1])-n[0][1],s=t.invertY(e[1][1])-n[1][1];return t.translate(i>r?(r+i)/2:Math.min(0,r)||Math.max(0,i),s>o?(o+s)/2:Math.min(0,o)||Math.max(0,s));}hu.prototype;var bu=\"1.13.6\",wu=\"object\"==(typeof self===\"undefined\"?\"undefined\":_typeof(self))&&self.self===self&&self||\"object\"==(typeof global===\"undefined\"?\"undefined\":_typeof(global))&&global.global===global&&global||Function(\"return this\")()||{},xu=Array.prototype,ku=Object.prototype,Au=\"undefined\"!=typeof Symbol?Symbol.prototype:null,Eu=xu.push,Su=xu.slice,Mu=ku.toString,Bu=ku.hasOwnProperty,Tu=\"undefined\"!=typeof ArrayBuffer,zu=\"undefined\"!=typeof DataView,Cu=Array.isArray,Nu=Object.keys,Iu=Object.create,Ou=Tu&&ArrayBuffer.isView,Ru=isNaN,Lu=isFinite,Uu=!{toString:null}.propertyIsEnumerable(\"toString\"),ju=[\"valueOf\",\"isPrototypeOf\",\"toString\",\"propertyIsEnumerable\",\"hasOwnProperty\",\"toLocaleString\"],Pu=Math.pow(2,53)-1;function Du(t,e){return e=null==e?t.length-1:+e,function(){for(var n=Math.max(arguments.length-e,0),r=Array(n),i=0;i<n;i++)r[i]=arguments[i+e];switch(e){case 0:return t.call(this,r);case 1:return t.call(this,arguments[0],r);case 2:return t.call(this,arguments[0],arguments[1],r);}var o=Array(e+1);for(i=0;i<e;i++)o[i]=arguments[i];return o[e]=r,t.apply(this,o);};}function Fu(t){var e=_typeof(t);return\"function\"===e||\"object\"===e&&!!t;}function $u(t){return null===t;}function Hu(t){return void 0===t;}function qu(t){return!0===t||!1===t||\"[object Boolean]\"===Mu.call(t);}function Zu(t){return!(!t||1!==t.nodeType);}function Wu(t){var e=\"[object \"+t+\"]\";return function(t){return Mu.call(t)===e;};}var Gu=Wu(\"String\"),Yu=Wu(\"Number\"),Vu=Wu(\"Date\"),Xu=Wu(\"RegExp\"),Ku=Wu(\"Error\"),Ju=Wu(\"Symbol\"),Qu=Wu(\"ArrayBuffer\");var tl=Wu(\"Function\"),el=wu.document&&wu.document.childNodes;\"object\"!=(typeof Int8Array===\"undefined\"?\"undefined\":_typeof(Int8Array))&&\"function\"!=typeof el&&(tl=function tl(t){return\"function\"==typeof t||!1;});var nl=tl,rl=Wu(\"Object\");var il=zu&&rl(new DataView(new ArrayBuffer(8))),ol=\"undefined\"!=typeof Map&&rl(new Map()),sl=Wu(\"DataView\");var al=il?function(t){return null!=t&&nl(t.getInt8)&&Qu(t.buffer);}:sl,ul=Cu||Wu(\"Array\");function ll(t,e){return null!=t&&Bu.call(t,e);}var hl=Wu(\"Arguments\");!function(){hl(arguments)||(hl=function hl(t){return ll(t,\"callee\");});}();var cl=hl;function fl(t){return!Ju(t)&&Lu(t)&&!isNaN(parseFloat(t));}function dl(t){return Yu(t)&&Ru(t);}function pl(t){return function(){return t;};}function gl(t){return function(e){var n=t(e);return\"number\"==typeof n&&n>=0&&n<=Pu;};}function _l(t){return function(e){return null==e?void 0:e[t];};}var ml=_l(\"byteLength\"),vl=gl(ml);var yl=/\\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\\]/;var bl=Tu?function(t){return Ou?Ou(t)&&!al(t):vl(t)&&yl.test(Mu.call(t));}:pl(!1),wl=_l(\"length\");function xl(t,e){e=function(t){for(var e={},n=t.length,r=0;r<n;++r)e[t[r]]=!0;return{contains:function contains(t){return!0===e[t];},push:function push(n){return e[n]=!0,t.push(n);}};}(e);var n=ju.length,r=t.constructor,i=nl(r)&&r.prototype||ku,o=\"constructor\";for(ll(t,o)&&!e.contains(o)&&e.push(o);n--;)(o=ju[n])in t&&t[o]!==i[o]&&!e.contains(o)&&e.push(o);}function kl(t){if(!Fu(t))return[];if(Nu)return Nu(t);var e=[];for(var n in t)ll(t,n)&&e.push(n);return Uu&&xl(t,e),e;}function Al(t){if(null==t)return!0;var e=wl(t);return\"number\"==typeof e&&(ul(t)||Gu(t)||cl(t))?0===e:0===wl(kl(t));}function El(t,e){var n=kl(e),r=n.length;if(null==t)return!r;for(var i=Object(t),o=0;o<r;o++){var s=n[o];if(e[s]!==i[s]||!(s in i))return!1;}return!0;}function Sl(t){return t instanceof Sl?t:this instanceof Sl?void(this._wrapped=t):new Sl(t);}function Ml(t){return new Uint8Array(t.buffer||t,t.byteOffset||0,ml(t));}Sl.VERSION=bu,Sl.prototype.value=function(){return this._wrapped;},Sl.prototype.valueOf=Sl.prototype.toJSON=Sl.prototype.value,Sl.prototype.toString=function(){return String(this._wrapped);};var Bl=\"[object DataView]\";function Tl(t,e,n,r){if(t===e)return 0!==t||1/t==1/e;if(null==t||null==e)return!1;if(t!=t)return e!=e;var i=_typeof(t);return(\"function\"===i||\"object\"===i||\"object\"==_typeof(e))&&zl(t,e,n,r);}function zl(t,e,n,r){t instanceof Sl&&(t=t._wrapped),e instanceof Sl&&(e=e._wrapped);var i=Mu.call(t);if(i!==Mu.call(e))return!1;if(il&&\"[object Object]\"==i&&al(t)){if(!al(e))return!1;i=Bl;}switch(i){case\"[object RegExp]\":case\"[object String]\":return\"\"+t==\"\"+e;case\"[object Number]\":return+t!=+t?+e!=+e:0==+t?1/+t==1/e:+t==+e;case\"[object Date]\":case\"[object Boolean]\":return+t==+e;case\"[object Symbol]\":return Au.valueOf.call(t)===Au.valueOf.call(e);case\"[object ArrayBuffer]\":case Bl:return zl(Ml(t),Ml(e),n,r);}var o=\"[object Array]\"===i;if(!o&&bl(t)){if(ml(t)!==ml(e))return!1;if(t.buffer===e.buffer&&t.byteOffset===e.byteOffset)return!0;o=!0;}if(!o){if(\"object\"!=_typeof(t)||\"object\"!=_typeof(e))return!1;var s=t.constructor,a=e.constructor;if(s!==a&&!(nl(s)&&s instanceof s&&nl(a)&&a instanceof a)&&\"constructor\"in t&&\"constructor\"in e)return!1;}r=r||[];for(var u=(n=n||[]).length;u--;)if(n[u]===t)return r[u]===e;if(n.push(t),r.push(e),o){if((u=t.length)!==e.length)return!1;for(;u--;)if(!Tl(t[u],e[u],n,r))return!1;}else{var l,h=kl(t);if(u=h.length,kl(e).length!==u)return!1;for(;u--;)if(!ll(e,l=h[u])||!Tl(t[l],e[l],n,r))return!1;}return n.pop(),r.pop(),!0;}function Cl(t,e){return Tl(t,e);}function Nl(t){if(!Fu(t))return[];var e=[];for(var n in t)e.push(n);return Uu&&xl(t,e),e;}function Il(t){var e=wl(t);return function(n){if(null==n)return!1;var r=Nl(n);if(wl(r))return!1;for(var i=0;i<e;i++)if(!nl(n[t[i]]))return!1;return t!==jl||!nl(n[Ol]);};}var Ol=\"forEach\",Rl=[\"clear\",\"delete\"],Ll=[\"get\",\"has\",\"set\"],Ul=Rl.concat(Ol,Ll),jl=Rl.concat(Ll),Pl=[\"add\"].concat(Rl,Ol,\"has\");var Dl=ol?Il(Ul):Wu(\"Map\"),Fl=ol?Il(jl):Wu(\"WeakMap\"),$l=ol?Il(Pl):Wu(\"Set\"),Hl=Wu(\"WeakSet\");function ql(t){for(var e=kl(t),n=e.length,r=Array(n),i=0;i<n;i++)r[i]=t[e[i]];return r;}function Zl(t){for(var e=kl(t),n=e.length,r=Array(n),i=0;i<n;i++)r[i]=[e[i],t[e[i]]];return r;}function Wl(t){for(var e={},n=kl(t),r=0,i=n.length;r<i;r++)e[t[n[r]]]=n[r];return e;}function Gl(t){var e=[];for(var n in t)nl(t[n])&&e.push(n);return e.sort();}function Yl(t,e){return function(n){var r=arguments.length;if(e&&(n=Object(n)),r<2||null==n)return n;for(var i=1;i<r;i++)for(var o=arguments[i],s=t(o),a=s.length,u=0;u<a;u++){var l=s[u];e&&void 0!==n[l]||(n[l]=o[l]);}return n;};}var Vl=Yl(Nl),Xl=Yl(kl),Kl=Yl(Nl,!0);function Jl(t){if(!Fu(t))return{};if(Iu)return Iu(t);var e=function e(){};e.prototype=t;var n=new e();return e.prototype=null,n;}function Ql(t,e){var n=Jl(t);return e&&Xl(n,e),n;}function th(t){return Fu(t)?ul(t)?t.slice():Vl({},t):t;}function eh(t,e){return e(t),t;}function nh(t){return ul(t)?t:[t];}function rh(t){return Sl.toPath(t);}function ih(t,e){for(var n=e.length,r=0;r<n;r++){if(null==t)return;t=t[e[r]];}return n?t:void 0;}function oh(t,e,n){var r=ih(t,rh(e));return Hu(r)?n:r;}function sh(t,e){for(var n=(e=rh(e)).length,r=0;r<n;r++){var i=e[r];if(!ll(t,i))return!1;t=t[i];}return!!n;}function ah(t){return t;}function uh(t){return t=Xl({},t),function(e){return El(e,t);};}function lh(t){return t=rh(t),function(e){return ih(e,t);};}function hh(t,e,n){if(void 0===e)return t;switch(null==n?3:n){case 1:return function(n){return t.call(e,n);};case 3:return function(n,r,i){return t.call(e,n,r,i);};case 4:return function(n,r,i,o){return t.call(e,n,r,i,o);};}return function(){return t.apply(e,arguments);};}function ch(t,e,n){return null==t?ah:nl(t)?hh(t,e,n):Fu(t)&&!ul(t)?uh(t):lh(t);}function fh(t,e){return ch(t,e,1/0);}function dh(t,e,n){return Sl.iteratee!==fh?Sl.iteratee(t,e):ch(t,e,n);}function ph(t,e,n){e=dh(e,n);for(var r=kl(t),i=r.length,o={},s=0;s<i;s++){var a=r[s];o[a]=e(t[a],a,t);}return o;}function gh(){}function _h(t){return null==t?gh:function(e){return oh(t,e);};}function mh(t,e,n){var r=Array(Math.max(0,t));e=hh(e,n,1);for(var i=0;i<t;i++)r[i]=e(i);return r;}function vh(t,e){return null==e&&(e=t,t=0),t+Math.floor(Math.random()*(e-t+1));}Sl.toPath=nh,Sl.iteratee=fh;var yh=Date.now||function(){return new Date().getTime();};function bh(t){var e=function e(_e57){return t[_e57];},n=\"(?:\"+kl(t).join(\"|\")+\")\",r=RegExp(n),i=RegExp(n,\"g\");return function(t){return t=null==t?\"\":\"\"+t,r.test(t)?t.replace(i,e):t;};}var wh={\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#x27;\",\"`\":\"&#x60;\"},xh=bh(wh),kh=bh(Wl(wh)),Ah=Sl.templateSettings={evaluate:/<%([\\s\\S]+?)%>/g,interpolate:/<%=([\\s\\S]+?)%>/g,escape:/<%-([\\s\\S]+?)%>/g};var Eh=/(.)^/,Sh={\"'\":\"'\",\"\\\\\":\"\\\\\",\"\\r\":\"r\",\"\\n\":\"n\",\"\\u2028\":\"u2028\",\"\\u2029\":\"u2029\"},Mh=/\\\\|'|\\r|\\n|\\u2028|\\u2029/g;function Bh(t){return\"\\\\\"+Sh[t];}var Th=/^\\s*(\\w|\\$)+\\s*$/;function zh(t,e,n){!e&&n&&(e=n),e=Kl({},e,Sl.templateSettings);var r=RegExp([(e.escape||Eh).source,(e.interpolate||Eh).source,(e.evaluate||Eh).source].join(\"|\")+\"|$\",\"g\"),i=0,o=\"__p+='\";t.replace(r,function(e,n,r,s,a){return o+=t.slice(i,a).replace(Mh,Bh),i=a+e.length,n?o+=\"'+\\n((__t=(\"+n+\"))==null?'':_.escape(__t))+\\n'\":r?o+=\"'+\\n((__t=(\"+r+\"))==null?'':__t)+\\n'\":s&&(o+=\"';\\n\"+s+\"\\n__p+='\"),e;}),o+=\"';\\n\";var s,a=e.variable;if(a){if(!Th.test(a))throw new Error(\"variable is not a bare identifier: \"+a);}else o=\"with(obj||{}){\\n\"+o+\"}\\n\",a=\"obj\";o=\"var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\\n\"+o+\"return __p;\\n\";try{s=new Function(a,\"_\",o);}catch(t){throw t.source=o,t;}var u=function u(t){return s.call(this,t,Sl);};return u.source=\"function(\"+a+\"){\\n\"+o+\"}\",u;}function Ch(t,e,n){var r=(e=rh(e)).length;if(!r)return nl(n)?n.call(t):n;for(var i=0;i<r;i++){var o=null==t?void 0:t[e[i]];void 0===o&&(o=n,i=r),t=nl(o)?o.call(t):o;}return t;}var Nh=0;function Ih(t){var e=++Nh+\"\";return t?t+e:e;}function Oh(t){var e=Sl(t);return e._chain=!0,e;}function Rh(t,e,n,r,i){if(!(r instanceof e))return t.apply(n,i);var o=Jl(t.prototype),s=t.apply(o,i);return Fu(s)?s:o;}var Lh=Du(function(t,e){var n=Lh.placeholder,r=function r(){for(var i=0,o=e.length,s=Array(o),a=0;a<o;a++)s[a]=e[a]===n?arguments[i++]:e[a];for(;i<arguments.length;)s.push(arguments[i++]);return Rh(t,r,this,this,s);};return r;});Lh.placeholder=Sl;var Uh=Lh,jh=Du(function(t,e,n){if(!nl(t))throw new TypeError(\"Bind must be called on a function\");var r=Du(function(i){return Rh(t,r,e,this,n.concat(i));});return r;}),Ph=gl(wl);function Dh(t,e,n,r){if(r=r||[],e||0===e){if(e<=0)return r.concat(t);}else e=1/0;for(var i=r.length,o=0,s=wl(t);o<s;o++){var a=t[o];if(Ph(a)&&(ul(a)||cl(a))){if(e>1)Dh(a,e-1,n,r),i=r.length;else for(var u=0,l=a.length;u<l;)r[i++]=a[u++];}else n||(r[i++]=a);}return r;}var Fh=Du(function(t,e){var n=(e=Dh(e,!1,!1)).length;if(n<1)throw new Error(\"bindAll must be passed function names\");for(;n--;){var r=e[n];t[r]=jh(t[r],t);}return t;});function $h(t,e){var n=function n(r){var i=n.cache,o=\"\"+(e?e.apply(this,arguments):r);return ll(i,o)||(i[o]=t.apply(this,arguments)),i[o];};return n.cache={},n;}var Hh=Du(function(t,e,n){return setTimeout(function(){return t.apply(null,n);},e);}),qh=Uh(Hh,Sl,1);function Zh(t,e,n){var r,i,o,s,a=0;n||(n={});var u=function u(){a=!1===n.leading?0:yh(),r=null,s=t.apply(i,o),r||(i=o=null);},l=function l(){var l=yh();a||!1!==n.leading||(a=l);var h=e-(l-a);return i=this,o=arguments,h<=0||h>e?(r&&(clearTimeout(r),r=null),a=l,s=t.apply(i,o),r||(i=o=null)):r||!1===n.trailing||(r=setTimeout(u,h)),s;};return l.cancel=function(){clearTimeout(r),a=0,r=i=o=null;},l;}function Wh(t,e,n){var r,i,o,s,a,u=function u(){var l=yh()-i;e>l?r=setTimeout(u,e-l):(r=null,n||(s=t.apply(a,o)),r||(o=a=null));},l=Du(function(l){return a=this,o=l,i=yh(),r||(r=setTimeout(u,e),n&&(s=t.apply(a,o))),s;});return l.cancel=function(){clearTimeout(r),r=o=a=null;},l;}function Gh(t,e){return Uh(e,t);}function Yh(t){return function(){return!t.apply(this,arguments);};}function Vh(){var t=arguments,e=t.length-1;return function(){for(var n=e,r=t[e].apply(this,arguments);n--;)r=t[n].call(this,r);return r;};}function Xh(t,e){return function(){if(--t<1)return e.apply(this,arguments);};}function Kh(t,e){var n;return function(){return--t>0&&(n=e.apply(this,arguments)),t<=1&&(e=null),n;};}var Jh=Uh(Kh,2);function Qh(t,e,n){e=dh(e,n);for(var r,i=kl(t),o=0,s=i.length;o<s;o++)if(e(t[r=i[o]],r,t))return r;}function tc(t){return function(e,n,r){n=dh(n,r);for(var i=wl(e),o=t>0?0:i-1;o>=0&&o<i;o+=t)if(n(e[o],o,e))return o;return-1;};}var ec=tc(1),nc=tc(-1);function rc(t,e,n,r){for(var i=(n=dh(n,r,1))(e),o=0,s=wl(t);o<s;){var a=Math.floor((o+s)/2);n(t[a])<i?o=a+1:s=a;}return o;}function ic(t,e,n){return function(r,i,o){var s=0,a=wl(r);if(\"number\"==typeof o)t>0?s=o>=0?o:Math.max(o+a,s):a=o>=0?Math.min(o+1,a):o+a+1;else if(n&&o&&a)return r[o=n(r,i)]===i?o:-1;if(i!=i)return(o=e(Su.call(r,s,a),dl))>=0?o+s:-1;for(o=t>0?s:a-1;o>=0&&o<a;o+=t)if(r[o]===i)return o;return-1;};}var oc=ic(1,ec,rc),sc=ic(-1,nc);function ac(t,e,n){var r=(Ph(t)?ec:Qh)(t,e,n);if(void 0!==r&&-1!==r)return t[r];}function uc(t,e){return ac(t,uh(e));}function lc(t,e,n){var r,i;if(e=hh(e,n),Ph(t))for(r=0,i=t.length;r<i;r++)e(t[r],r,t);else{var o=kl(t);for(r=0,i=o.length;r<i;r++)e(t[o[r]],o[r],t);}return t;}function hc(t,e,n){e=dh(e,n);for(var r=!Ph(t)&&kl(t),i=(r||t).length,o=Array(i),s=0;s<i;s++){var a=r?r[s]:s;o[s]=e(t[a],a,t);}return o;}function cc(t){return function(e,n,r,i){var o=arguments.length>=3;return function(e,n,r,i){var o=!Ph(e)&&kl(e),s=(o||e).length,a=t>0?0:s-1;for(i||(r=e[o?o[a]:a],a+=t);a>=0&&a<s;a+=t){var u=o?o[a]:a;r=n(r,e[u],u,e);}return r;}(e,hh(n,i,4),r,o);};}var fc=cc(1),dc=cc(-1);function pc(t,e,n){var r=[];return e=dh(e,n),lc(t,function(t,n,i){e(t,n,i)&&r.push(t);}),r;}function gc(t,e,n){return pc(t,Yh(dh(e)),n);}function _c(t,e,n){e=dh(e,n);for(var r=!Ph(t)&&kl(t),i=(r||t).length,o=0;o<i;o++){var s=r?r[o]:o;if(!e(t[s],s,t))return!1;}return!0;}function mc(t,e,n){e=dh(e,n);for(var r=!Ph(t)&&kl(t),i=(r||t).length,o=0;o<i;o++){var s=r?r[o]:o;if(e(t[s],s,t))return!0;}return!1;}function vc(t,e,n,r){return Ph(t)||(t=ql(t)),(\"number\"!=typeof n||r)&&(n=0),oc(t,e,n)>=0;}var yc=Du(function(t,e,n){var r,i;return nl(e)?i=e:(e=rh(e),r=e.slice(0,-1),e=e[e.length-1]),hc(t,function(t){var o=i;if(!o){if(r&&r.length&&(t=ih(t,r)),null==t)return;o=t[e];}return null==o?o:o.apply(t,n);});});function bc(t,e){return hc(t,lh(e));}function wc(t,e){return pc(t,uh(e));}function xc(t,e,n){var r,i,o=-1/0,s=-1/0;if(null==e||\"number\"==typeof e&&\"object\"!=_typeof(t[0])&&null!=t)for(var a=0,u=(t=Ph(t)?t:ql(t)).length;a<u;a++)null!=(r=t[a])&&r>o&&(o=r);else e=dh(e,n),lc(t,function(t,n,r){((i=e(t,n,r))>s||i===-1/0&&o===-1/0)&&(o=t,s=i);});return o;}function kc(t,e,n){var r,i,o=1/0,s=1/0;if(null==e||\"number\"==typeof e&&\"object\"!=_typeof(t[0])&&null!=t)for(var a=0,u=(t=Ph(t)?t:ql(t)).length;a<u;a++)null!=(r=t[a])&&r<o&&(o=r);else e=dh(e,n),lc(t,function(t,n,r){((i=e(t,n,r))<s||i===1/0&&o===1/0)&&(o=t,s=i);});return o;}var Ac=/[^\\ud800-\\udfff]|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\ud800-\\udfff]/g;function Ec(t){return t?ul(t)?Su.call(t):Gu(t)?t.match(Ac):Ph(t)?hc(t,ah):ql(t):[];}function Sc(t,e,n){if(null==e||n)return Ph(t)||(t=ql(t)),t[vh(t.length-1)];var r=Ec(t),i=wl(r);e=Math.max(Math.min(e,i),0);for(var o=i-1,s=0;s<e;s++){var a=vh(s,o),u=r[s];r[s]=r[a],r[a]=u;}return r.slice(0,e);}function Mc(t){return Sc(t,1/0);}function Bc(t,e,n){var r=0;return e=dh(e,n),bc(hc(t,function(t,n,i){return{value:t,index:r++,criteria:e(t,n,i)};}).sort(function(t,e){var n=t.criteria,r=e.criteria;if(n!==r){if(n>r||void 0===n)return 1;if(n<r||void 0===r)return-1;}return t.index-e.index;}),\"value\");}function Tc(t,e){return function(n,r,i){var o=e?[[],[]]:{};return r=dh(r,i),lc(n,function(e,i){var s=r(e,i,n);t(o,e,s);}),o;};}var zc=Tc(function(t,e,n){ll(t,n)?t[n].push(e):t[n]=[e];}),Cc=Tc(function(t,e,n){t[n]=e;}),Nc=Tc(function(t,e,n){ll(t,n)?t[n]++:t[n]=1;}),Ic=Tc(function(t,e,n){t[n?0:1].push(e);},!0);function Oc(t){return null==t?0:Ph(t)?t.length:kl(t).length;}function Rc(t,e,n){return e in n;}var Lc=Du(function(t,e){var n={},r=e[0];if(null==t)return n;nl(r)?(e.length>1&&(r=hh(r,e[1])),e=Nl(t)):(r=Rc,e=Dh(e,!1,!1),t=Object(t));for(var i=0,o=e.length;i<o;i++){var s=e[i],a=t[s];r(a,s,t)&&(n[s]=a);}return n;}),Uc=Du(function(t,e){var n,r=e[0];return nl(r)?(r=Yh(r),e.length>1&&(n=e[1])):(e=hc(Dh(e,!1,!1),String),r=function r(t,n){return!vc(e,n);}),Lc(t,r,n);});function jc(t,e,n){return Su.call(t,0,Math.max(0,t.length-(null==e||n?1:e)));}function Pc(t,e,n){return null==t||t.length<1?null==e||n?void 0:[]:null==e||n?t[0]:jc(t,t.length-e);}function Dc(t,e,n){return Su.call(t,null==e||n?1:e);}function Fc(t,e,n){return null==t||t.length<1?null==e||n?void 0:[]:null==e||n?t[t.length-1]:Dc(t,Math.max(0,t.length-e));}function $c(t){return pc(t,Boolean);}function Hc(t,e){return Dh(t,e,!1);}var qc=Du(function(t,e){return e=Dh(e,!0,!0),pc(t,function(t){return!vc(e,t);});}),Zc=Du(function(t,e){return qc(t,e);});function Wc(t,e,n,r){qu(e)||(r=n,n=e,e=!1),null!=n&&(n=dh(n,r));for(var i=[],o=[],s=0,a=wl(t);s<a;s++){var u=t[s],l=n?n(u,s,t):u;e&&!n?(s&&o===l||i.push(u),o=l):n?vc(o,l)||(o.push(l),i.push(u)):vc(i,u)||i.push(u);}return i;}var Gc=Du(function(t){return Wc(Dh(t,!0,!0));});function Yc(t){for(var e=[],n=arguments.length,r=0,i=wl(t);r<i;r++){var o=t[r];if(!vc(e,o)){var s;for(s=1;s<n&&vc(arguments[s],o);s++);s===n&&e.push(o);}}return e;}function Vc(t){for(var e=t&&xc(t,wl).length||0,n=Array(e),r=0;r<e;r++)n[r]=bc(t,r);return n;}var Xc=Du(Vc);function Kc(t,e){for(var n={},r=0,i=wl(t);r<i;r++)e?n[t[r]]=e[r]:n[t[r][0]]=t[r][1];return n;}function Jc(t,e,n){null==e&&(e=t||0,t=0),n||(n=e<t?-1:1);for(var r=Math.max(Math.ceil((e-t)/n),0),i=Array(r),o=0;o<r;o++,t+=n)i[o]=t;return i;}function Qc(t,e){if(null==e||e<1)return[];for(var n=[],r=0,i=t.length;r<i;)n.push(Su.call(t,r,r+=e));return n;}function tf(t,e){return t._chain?Sl(e).chain():e;}function ef(t){return lc(Gl(t),function(e){var n=Sl[e]=t[e];Sl.prototype[e]=function(){var t=[this._wrapped];return Eu.apply(t,arguments),tf(this,n.apply(Sl,t));};}),Sl;}lc([\"pop\",\"push\",\"reverse\",\"shift\",\"sort\",\"splice\",\"unshift\"],function(t){var e=xu[t];Sl.prototype[t]=function(){var n=this._wrapped;return null!=n&&(e.apply(n,arguments),\"shift\"!==t&&\"splice\"!==t||0!==n.length||delete n[0]),tf(this,n);};}),lc([\"concat\",\"join\",\"slice\"],function(t){var e=xu[t];Sl.prototype[t]=function(){var t=this._wrapped;return null!=t&&(t=e.apply(t,arguments)),tf(this,t);};});var nf=Sl;var rf=ef(t);rf._=rf;function of(t,e,n,r){var i=this.nodes.descendants();if(t.parent&&i.indexOf(t)>=0){var _i26=t.parent.children.indexOf(t),_o17={name:n,parent:t.parent,attribute:r?r[2]:null,original_child_order:t.original_child_order},_s22={name:e,parent:_o17,attribute:r?r[1]:null,original_child_order:2};_o17.children=[t,_s22],t.parent.children[_i26]=_o17,t.parent=_o17,t.attribute=r?r[0]:null,t.original_child_order=1;}return this;}function sf(t,e){return t.children?t.children.push(e):t.children=[e],t;}function af(t,e){return{data:{name:t,attribute:e?e[1]:null},parent:\"\"};}function uf(t){var e=this.nodes.descendants();if(\"number\"!=typeof t)return this.deleteANode(e.indexOf(t));if(t>0&&t<e.length){var _n37=e[t];if(_n37.parent){var _r35=_n37.parent.children.indexOf(_n37);_r35>=0&&(e.splice(t,1),_n37.children&&_n37.children.forEach(function(t){t.original_child_order=_n37.parent.children.length,_n37.parent.children.push(t),t.parent=_n37.parent;}),_n37.parent.children.length>2?_n37.parent.children.splice(_r35,1):_n37.parent.parent?(_n37.parent.parent.children[_n37.parent.parent.children.indexOf(_n37.parent)]=_n37.parent.children[1-_r35],_n37.parent.children[1-_r35].parent=_n37.parent.parent,e.splice(e.indexOf(_n37.parent),1)):(e.splice(0,1),e.parent=null,delete e.data.attribute,delete e.data.annotation,delete e.data.original_child_order,e.name=\"root\",e.data.name=\"root\"));}}return this;}function lf(){return pc(this.nodes.descendants(),function(t){return!sh(t,\"children\");});}function hf(){return pc(this.nodes.descendants(),function(t){return sh(t,\"children\");});}function cf(){return this.nodes;}function ff(){return this.nodes;}function df(t){return pc(this.nodes.descendants(),function(e){return e.data.name==t;})[0];}function pf(t){lc(this.nodes.descendants(),function(e){e.data&&e.data.name in t&&(e.annotations=t[e.data.name]);});}function gf(t){return!sh(t,\"children\");}function _f(t,e){return this.nodes.each(function(n){t in n&&(e&&(n[e]=n[t]),delete n[t]);}),this;}function mf(t){var _this19=this;t||this.nodes.each(function(t){gf(t)||(t[_this19.selection_attribute_name]=!1,t.data.traits||(t.data.traits={}),t.data.traits[_this19.selection_attribute_name]=t[_this19.selection_attribute_name]);});}function vf(t,e,n){var r=[];return function i(o){gf(o)?e&&o!=t&&r.push(o):(n&&o!=t&&r.push(o),o.children.forEach(i));}(t),r;}var yf=function yf(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};var n=/^-?\\d+(\\.\\d+)?$/;var r=e.left_delimiter||\"{\",i=e.right_delimiter||\"}\",o=[];function s(){var t=o[o.length-1];\"children\"in t||(t.children=[]),o.push({name:null}),t.children.push(o[o.length-1]),o[o.length-1].original_child_order=t.children.length;}function a(){var t=o.pop();t.name=h,\"children\"in t?t.bootstrap_values=h:t.name=h,t.attribute=c,\"[\"==r&&f.includes(\"&&NHX\")?f.split(\":\").slice(1).forEach(function(e){var _e$split3=e.split(\"=\"),_e$split4=_slicedToArray(_e$split3,2),r=_e$split4[0],i=_e$split4[1];t[r]=n.test(i)?+i:i;}):t.annotation=f,h=\"\",c=\"\",f=\"\";}function u(e){return{json:null,error:\"Unexpected '\"+t[e]+\"' in '\"+t.substring(e-20,e+1)+\"[ERROR HERE]\"+t.substring(e+1,e+20)+\"'\"};}var l=0,h=\"\",c=\"\",f=\"\",d=null,p={\"'\":1,'\"':1},g={name:\"root\"};o.push(g);for(var _=/\\s/,m=0;m<t.length;m++)try{var v=t[m];switch(l){case 0:\"(\"==v&&(s(),l=1);break;case 1:case 3:if(\":\"==v)l=3;else if(\",\"==v||\")\"==v)try{a(),l=1,\",\"==v&&s();}catch(t){return u(m);}else if(\"(\"==v){if(h.length>0)return u(m);s();}else{if(v in p){if(1==l&&0===h.length&&0===c.length&&0===f.length){l=2,d=v;continue;}return u(m);}if(v==r){if(f.length)return u(m);l=4;}else if(3==l)c+=v;else{if(_.test(v))continue;if(\";\"==v){m=t.length;break;}h+=v;}}break;case 2:if(v==d){if(m<t.length-1&&t[m+1]==d){m++,h+=d;continue;}d=0,l=1;continue;}h+=v;break;case 4:if(v==i)l=3;else{if(v==r)return u(m);f+=v;}}}catch(t){return u(m);}return 1!=o.length?u(t.length-1):{json:g,error:null};};function bf(t){var e=t,n=e.toUpperCase().indexOf(\"BEGIN DATA;\"),r=e.slice(n);if(r.length<2)return\"\";n=r.toUpperCase().indexOf(\"END;\");var i=r.slice(0,n);r=hc(i.split(\";\"),function(t){return t.trim();});var o=pc(r,function(t){return t.toUpperCase().startsWith(\"DIMENSION\");});o=o[0].split(\" \"),o=Kc(hc(Dc(o),function(t){return t.split(\"=\");}));var s=pc(r,function(t){return t.toUpperCase().startsWith(\"FORMAT\");});s=s[0].split(\" \"),s=Kc(hc(Dc(s),function(t){return t.split(\"=\");})),s.symbols=gc(s.symbols.split(\"\"),function(t){return'\"'==t;});var a=pc(r,function(t){return t.toUpperCase().startsWith(\"MATRIX\");});return a=a[0].split(\"\\n\"),a=Kc(hc(Dc(a),function(t){return $c(t.split(\" \"));})),a=ph(a,function(t,e){return\"?\"==t?s.symbols:Array(t);}),{dimensions:o,format:s,matrix:a};}function wf(t,e,n){lc(t.getTips(),function(t){t.data.test=n.matrix[t.data.name];});}function xf(t){var e=t,n=e.toUpperCase().indexOf(\"BEGIN TREES;\"),r=e.slice(n);if(r.length<2)return\"\";n=r.toUpperCase().indexOf(\"END;\");var i=r.slice(0,n).split(\"\\n\");return i=pc(i,function(t){return t.trim().toUpperCase().startsWith(\"TREE\");}),yf(i[0]);}function kf(t){var e={};if(1==t.nodeType){if(t.attributes.length>0){e[\"@attributes\"]={};for(var n=0;n<t.attributes.length;n++){var r=t.attributes.item(n);e[\"@attributes\"][r.nodeName]=r.nodeValue;}}}else 3==t.nodeType&&(e=t.nodeValue);if(t.hasChildNodes()&&1===t.childNodes.length&&3===t.childNodes[0].nodeType)e=t.childNodes[0].nodeValue;else if(t.hasChildNodes())for(var i=0;i<t.childNodes.length;i++){var o=t.childNodes.item(i),s=o.nodeName;if(void 0===e[s])e[s]=kf(o);else{if(void 0===e[s].push){var a=e[s];e[s]=[],e[s].push(a);}e[s].push(kf(o));}}return e;}var Af=function Af(t,e){var n;return(n=(t=kf(t)).phyloxml.phylogeny.clade).name=\"root\",function t(e,n){e.clade&&(e.clade.forEach(t),e.children=e.clade,delete e.clade),e.annotation=1,e.attribute=\"0.01\",e.branch_length&&(e.attribute=e.branch_length),e.taxonomy&&(e.name=e.taxonomy.scientific_name),e.annotation=\"\";}(n),{json:n,error:null};};var Ef={nexml:function nexml(t,e){var n;return parseString(t,function(t,e){n=e[\"nex:nexml\"].trees[0].tree.map(function(t){var e=t.node.map(function(t){return t.$;}),n=e.reduce(function(t,e){return e.edges=[],e.name=e.id,t[e.id]=e,t;},{}),r=e.filter(function(t){return t.root;}),i=r>0?r[0].id:e[0].id;return n[i].name=\"root\",t.edge.map(function(t){return t.$;}).forEach(function(t){n[t.source].edges.push(t);}),function t(e,r){if(e.edges){var i=bc(e.edges,\"target\");e.children=ql(Lc(n,i)),e.children.forEach(function(t,n){t.attribute=e.edges[n].length||\"\";}),e.children.forEach(t),e.annotation=\"\";}}(n[i]),n[i];});}),n;},phyloxml:Af,nexus:xf,nwk:yf,nhx:yf,beast:function beast(t,e){e.left_delimiter=\"[\",e.right_delimiter=\"]\";var n=yf(t,e);return function t(e){if(e.annotation){e.beast={};var _t63=e.annotation.split(/=|,|{|}/).filter(function(t){return t;});for(var n=0;n<_t63.length;n+=2){var _r36=_t63[n].replace(/&|%/g,\"\");/[a-df-zA-DF-Z]+/.test(_t63[n+2])?e.beast[_r36]=+_t63[n+1]:(e.beast[_r36]=[+_t63[n+1],+_t63[n+2]],n++);}}e.annotation=void 0,e.children&&e.children.forEach(t);}(n.json),n;}};var Sf=n(6486);function Mf(t,e,n){var r,i,o,s=[t],a=[];for(;t=s.pop();)if((!n||!n(t))&&(a.push(t),r=t.children,r))for(i=0,o=r.length;i<o;++i)s.push(r[i]);for(;t=a.pop();)e(t);return t;}function Bf(t,e){var n=t.data;if(\"attribute\"in n&&n.attribute&&n.attribute.length){e>0&&(n.attribute=String(e));var _t64=parseFloat(n.attribute);if(!isNaN(_t64))return Math.max(0,_t64);}if(\"root\"==n.name)return 0;console.warn(\"Undefined branch length at \"+n.name+\"!\");}function Tf(t,e){var _this20=this;if(!(t instanceof Do))throw new Error(\"node needs to be an instance of a d3.hierarchy node!\");var n=this.nodes.copy();if(e=void 0!==e?e:.5,t.parent){var r=Do({name:\"new_root\"});r.children=[t.copy()],r.data.__mapped_bl=void 0,n.each(function(t){t.data.__mapped_bl=_this20.branch_length_accessor(t);}),this.setBranchLength(function(t){return t.data.__mapped_bl;});var _o18,_s23=t,_a14=t.parent,_u7=void 0===t.data.__mapped_bl?void 0:t.data.__mapped_bl*e;var i;if(_o18=_a14.data.__mapped_bl,_a14.data.__mapped_bl=void 0===t.data.__mapped_bl?void 0:t.data.__mapped_bl-_u7,t.data.__mapped_bl=_u7,_a14.parent){for(r.children.push(_a14);_a14.parent;){i=_a14.children.indexOf(_s23),_a14.parent.parent?_a14.children.splice(i,1,_a14.parent):_a14.children.splice(i,1);var _t65=_a14.parent.data.__mapped_bl;void 0!==_t65&&(_a14.parent.data.__mapped_bl=_o18,_o18=_t65),_s23=_a14,_a14=_a14.parent;}i=_a14.children.indexOf(_s23),_a14.children.splice(i,1);}else i=_a14.children.indexOf(_s23),_a14.children.splice(i,1),_o18=_a14.data.__mapped_bl,_s23=r;if(1==_a14.children.length)_o18&&(_a14.children[0].data.__mapped_bl+=_o18),_s23.children=_s23.children.concat(_a14.children);else{var _e58=new Do({name:\"__reroot_top_clade\",__mapped_bl:_o18});Xl(r.children[0],t),_e58.data.__mapped_bl=_o18,_e58.children=_a14.children.map(function(t){return t.parent=_e58,t;}),_e58.parent=_s23,_s23.children.push(_e58);}}if(this.update(r),this.traverse_and_compute(function(t){lc(t.children,function(e){e.parent=t;});},\"pre-order\"),!Hu(this.display)){var _t66=this.display.options;Fr(this.display.container).select(\"svg\").remove();var _e59=this.display.selection_attribute_name;delete this.display;var _n38=this.render(_t66);_n38.selectionLabel(_e59),_n38.update(),Fr(_n38.container).node().appendChild(_n38.show()),Fr(this.display.container).dispatch(\"reroot\");}return this;}function zf(t,e){if(t=t||\"attribute\",e=e||\"y_scaled\",\"parent\"in this){var _n39=parseFloat(this[t]);this[e]=this.parent[e]+(isNaN(_n39)?.1:_n39);}else this[e]=0;return this[e];}function Cf(t){var e=[];for(;t;)e.push(t),t=t.parent;return e;}function Nf(t){return t.y;}function If(t){return t.x;}function Of(t,e,n){return{x:n+t*Math.sin(e),y:n+t*Math.cos(e)};}function Rf(t,e,n,r,i,o){t.radius=e*(t.radius+n),t.angle=2*Math.PI*t.x*i[0]/o[0];var s=Of(t.radius,t.angle,r);return t.x=s.x,t.y=s.y,t;}function Lf(t,e){var n=Of(e[0].radius,e[0].angle,t),r=Of(e[0].radius,e[1].angle,t);return\"M \"+Nf(n)+\",\"+If(n)+\" A \"+e[0].radius+\",\"+e[0].radius+\" 0,0, \"+(e[1].angle>e[0].angle?1:0)+\" \"+Nf(r)+\",\"+If(r)+\" L \"+Nf(e[1])+\",\"+If(e[1]);}function Uf(t,e,n){var r=Of(t.target.radius+(t.source.radius-t.target.radius)*e,t.target.angle,n);return{x:Nf(r),y:If(r)};}function jf(t,e){return{x:Nf(t.target)+(Nf(t.source)-Nf(t.target))*e,y:If(t.target)};}var Pf=is().x(function(t){return Nf(t);}).y(function(t){return If(t);}).curve(function(t){return new us(t,0);});function Df(t){return t.tag||!1;}function Ff(t,e){return t[e]||!1;}var $f={\"tree-container\":\"phylotree-container\",\"tree-scale-bar\":\"tree-scale-bar\",node:\"node\",\"internal-node\":\"internal-node\",\"tagged-node\":\"node-tagged\",\"selected-node\":\"node-selected\",\"collapsed-node\":\"node-collapsed\",\"root-node\":\"root-node\",branch:\"branch\",\"selected-branch\":\"branch-selected\",\"tagged-branch\":\"branch-tagged\",\"tree-selection-brush\":\"tree-selection-brush\",\"branch-tracer\":\"branch-tracer\",clade:\"clade\",node_text:\"phylotree-node-text\"};function Hf(t){return arguments.length?(this.options[\"internal-names\"]=t,this):this.options[\"internal-names\"];}function qf(t){return arguments.length?(this.options[\"is-radial\"]=t,this):this.options[\"is-radial\"];}function Zf(t){return arguments.length?(this.options[\"align-tips\"]=t,this):this.options[\"align-tips\"];}function Wf(t){return this.options[\"draw-size-bubbles\"]&&this.options[\"bubble-styler\"]?this.options[\"bubble-styler\"](t):this.options[\"draw-size-bubbles\"]?this.relative_nodeSpan(t)*this.scales[0]*.25:0;}function Gf(t){return this.options[\"is-radial\"]?[(\"end\"==t.text_align?-1:1)*(this.radius_pad_for_bubbles-t.radius),0]:(this.options[\"right-to-left\"],[this.right_most_leaf-t.screen_x,0]);}function Yf(t){return arguments.length?(this.layout_listener_handler=t,this):this.layout_listener_handler;}function Vf(t){return arguments.length?(this.selection_attribute_name=t,this.syncEdgeLabels(),this):this.selection_attribute_name;}function Xf(t){return arguments.length?(Xf=\"string\"==typeof t&&\"equal\"==t?function(t){return 1;}:t,this):Xf;}var Kf={all:function all(t){return!0;},none:function none(t){return!1;},\"all-leaf-nodes\":function allLeafNodes(t){return gf(t.target);},\"all-internal-nodes\":function allInternalNodes(t){return!gf(t.target);}};function Jf(t){return t?(this.selectionCallback=t,this):this.selectionCallback;}function Qf(t){return this.radial()?[(\"end\"==t.text_align?-1:1)*(this.radius_pad_for_bubbles-t.radius),0]:(this.options[\"right-to-left\"],[this.right_most_leaf-t.screen_x,0]);}function td(t,e,n){var _this21=this;t=Fr(t);var r=gf(e);r&&(t=t.attr(\"data-node-name\",e.data.name));var i=t.selectAll(\"text\").data([e]),o=t.selectAll(\"line\");if(r||this.showInternalName(e)&&!ud(e))if(i=i.enter().append(\"text\").classed(this.css_classes.node_text,!0).merge(i).on(\"click\",function(t){_this21.handle_node_click(e,t);}).attr(\"dy\",function(t){return .33*_this21.shown_font_size;}).text(function(t){return _this21.options[\"show-labels\"]?_this21._nodeLabel(t):\"\";}).style(\"font-size\",function(t){return _this21.ensure_size_is_in_px(_this21.shown_font_size);}),i=this.radial()?i.attr(\"transform\",function(t){return _this21.d3PhylotreeSvgRotate(t.text_angle)+_this21.d3PhylotreeSvgTranslate(_this21.alignTips()?_this21.shiftTip(t):null);}).attr(\"text-anchor\",function(t){return t.text_align;}):i.attr(\"text-anchor\",\"start\").attr(\"transform\",function(t){return\"right-to-left\"==_this21.options.layout?_this21.d3PhylotreeSvgTranslate([-20,0]):_this21.d3PhylotreeSvgTranslate(_this21.alignTips()?_this21.shiftTip(t):null);}),this.alignTips()?(o=o.data([e]),n?o=o.enter().append(\"line\").classed(this.css_classes[\"branch-tracer\"],!0).merge(o).attr(\"x1\",function(t){return(\"end\"==t.text_align?-1:1)*_this21.nodeBubbleSize(e);}).attr(\"x2\",0).attr(\"y1\",0).attr(\"y2\",0).attr(\"x2\",function(t){return\"right-to-left\"==_this21.options.layout?t.screen_x:_this21.shiftTip(t)[0];}).attr(\"transform\",function(t){return _this21.d3PhylotreeSvgRotate(t.text_angle);}).attr(\"x2\",function(t){return\"right-to-left\"==_this21.options.layout?t.screen_x:_this21.shiftTip(t)[0];}).attr(\"transform\",function(t){return _this21.d3PhylotreeSvgRotate(t.text_angle);}):(o=o.enter().append(\"line\").classed(this.css_classes[\"branch-tracer\"],!0).merge(o).attr(\"x1\",function(t){return(\"end\"==t.text_align?-1:1)*_this21.nodeBubbleSize(e);}).attr(\"y2\",0).attr(\"y1\",0).attr(\"x2\",function(t){return _this21.shiftTip(t)[0];})).attr(\"transform\",function(t){return _this21.d3PhylotreeSvgRotate(t.text_angle);})):o.remove(),this.options[\"draw-size-bubbles\"]){var s=this.nodeBubbleSize(e);t.selectAll(\"circle\").data([s]).enter().append(\"circle\").attr(\"r\",function(t){return t;}),this.shown_font_size>=5&&(i=i.attr(\"dx\",function(t){return(\"end\"==t.text_align?-1:1)*((_this21.alignTips()?0:s)+.33*_this21.shown_font_size);}));}else this.shown_font_size>=5&&(i=i.attr(\"dx\",function(t){return(\"end\"==t.text_align?-1:1)*_this21.shown_font_size*.33;}));if(!r){var _n40=t.selectAll(\"circle\").data([e]).enter().append(\"circle\"),_r37=this.node_circle_size()(e);_r37>0?_n40.merge(_n40).attr(\"r\",function(t){return Math.min(.75*_this21.shown_font_size,_r37);}).on(\"click\",function(t){_this21.handle_node_click(e,t);}):_n40.remove();}return this.node_styler&&this.node_styler(t,e),e;}function ed(){var t=this.phylotree.nodes.descendants();for(var _e60=t.length-1;_e60>=0;_e60-=1)gf(t[_e60])?t[_e60].hasHiddenNodes=t[_e60].notshown:t[_e60].hasHiddenNodes=t[_e60].children.reduce(function(t,e){return e.notshown||t;},!1);return this;}function nd(t){var e=this.internalNames();return!!e&&(\"function\"==typeof e?e(t):e);}function rd(t){return arguments.length?(this.nodeSpan=\"string\"==typeof t&&\"equal\"==t?function(t){return 1;}:t,this):this.nodeSpan;}function id(t){var e=$f[gf(t)?\"node\":\"internal-node\"];return Df(t)&&(e+=\" \"+$f[\"tagged-node\"]),Ff(t,this.selection_attribute_name)&&(e+=\" \"+$f[\"selected-node\"]),t.parent||(e+=\" \"+$f[\"root-node\"]),(ud(t)||ad(t))&&(e+=\" \"+$f[\"collapsed-node\"]),e;}function od(t){return!(t.hidden||t.notshown);}function sd(t){return t.notshown;}function ad(t){return t.hasHiddenNodes||!1;}function ud(t){return t.collapsed||!1;}function ld(t){return[t.node,t[\"internal-node\"],t[\"collapsed-node\"],t[\"tagged-node\"],t[\"root-node\"]].reduce(function(t,e,n,r){return t+\"g.\"+e+(n<r.length-1?\",\":\"\");},\"\");}function hd(t,e){var _this22=this;this.phylotree.clearInternalNodes(e);for(var n=this.phylotree.nodes.descendants().length-1;n>=0;n--){var r=this.phylotree.nodes.descendants()[n];gf(r)||Ff(r,this.selection_attribute_name)||(r[this.selection_attribute_name]=t(r.children));}this.modifySelection(function(t,e){return gf(t.target),t.target[_this22.selection_attribute_name];});}function cd(t){return gf(t=t.data)?t.name||\"\":this.showInternalName(t)?t.name:\"\";}function fd(t){return arguments.length?(this._nodeLabel=t||cd,this.update(),this):this._nodeLabel;}function dd(t){return[t.clade].reduce(function(t,e,n,r){return t+\"path.\"+e+(n<r.length-1?\",\":\"\");},\"\");}function pd(t){var e=this.svg.selectAll(\".\"+this.css_classes[\"tree-container\"]);var n=0;var r,i=e.selectAll(dd(this.css_classes)).data(this.phylotree.nodes.descendants().filter(ud),function(t){return t.id||(t.id=++n);}),o=function o(){};this.radial()?(o=is().curve(as).y(function(t){return t[0];}).x(function(t){return t[1];}),r=function r(t,e,n,_r38,i){return e?[n.screen_y+(t[0]-_r38)/50,n.screen_x+(t[1]-i)/50]:[n.screen_y,n.screen_x];}):(o=is().y(function(t){return t[0];}).x(function(t){return t[1];}).curve(as),r=function r(t,e,n,_r39,i){return e?[n.screen_y+(t[0]-_r39)/50,n.screen_x+(t[1]-i)/50]:[n.screen_y,n.screen_x];}),i.exit().each(function(t){t.collapsed_clade=null;}).remove(),t?i.enter().insert(\"path\",\":first-child\").attr(\"class\",this.css_classes.clade).merge(i).attr(\"d\",function(t){if(t.collapsed_clade)return t.collapsed_clade;var e=t.collapsed[0][0],n=t.collapsed[0][1];return o(t.collapsed.map(function(i,o){return r(i,o,t,e,n);}));}).attr(\"d\",function(t){return t.collapsed_clade=o(t.collapsed);}):i.enter().insert(\"path\",\":first-child\").attr(\"class\",this.css_classes.clade).merge(i).attr(\"d\",function(t){return t.collapsed_clade?t.collapsed_clade:t.collapsed_clade=o(t.collapsed);});}function gd(t,e,n){var _this23=this;t=(t=Fr(t)).attr(\"class\",function(t){return _this23.reclassEdge(t);}).on(\"click\",function(t){_this23.modifySelection([e.target],_this23.selection_attribute_name),_this23.update();});var r=this.draw_branch([e.source,e.target]);n?(t.datum().existing_path&&(t=t.attr(\"d\",function(t){return t.existing_path;})),t=t.attr(\"d\",r)):t=t.attr(\"d\",r),e.existing_path=r;var i=this.phylotree.branch_length_accessor(e.target);if(void 0!==i){var o=t.selectAll(\"title\");o.empty()&&(o=t.append(\"title\")),o.text(\"Length = \"+i);}else t.selectAll(\"title\").remove();return this.edge_styler&&this.edge_styler(t,e,n),this.phylotree;}function _d(t){var e=$f.branch;return Df(t)&&(e+=\" \"+$f[\"tagged-branch\"]),Ff(t,this.selection_attribute_name)&&(e+=\" \"+$f[\"selected-branch\"]),e;}function md(){this.links.forEach(function(t){t.target.data.annotation&&(t.target[t.target.data.annotation]=t.target.data.annotation);});}function vd(){var _this24=this;if(this.links.forEach(function(t){t[_this24.selection_attribute_name]=t.target[_this24.selection_attribute_name]||!1,t.tag=t.target.tag||!1;}),this.countHandler()){var _t67={};_t67[this.selection_attribute_name]=this.links.reduce(function(t,e){return t+(e[_this24.selection_attribute_name]?1:0);},0),_t67.tagged=this.links.reduce(function(t,e){return t+(Df(e)?1:0);},0),this.countUpdate(this,_t67,this.countHandler());}}function yd(t){return!(t.target.hidden||t.target.notshown);}function bd(t){return[t.branch,t[\"selected-branch\"],t[\"tagged-branch\"]].reduce(function(t,e,n,r){return t+\"path.\"+e+(n<r.length-1?\",\":\"\");},\"\");}function wd(t,e){return this.edge_placer(t,e);}var xd=\"phylotree.event\";function kd(t){if(t.collapsed){t.collapsed=!1;var _e61=function _e61(t){gf(t)||t.collapsed||t.children.forEach(_e61),t.hidden=!1;};_e61(t);}else t.collapsed=!0;return this.placenodes(),this;}function Ad(t,e,n){var r=this.size;if(this.radial()){var _t68=this.pad_width(),_n41=\"fit-to-size\"!=this.options[\"top-bottom-spacing\"]?this.pad_height():0;r=[r[1]+2*_t68,r[0]+2*_t68+_n41],e&&e.selectAll(\".\"+$f[\"tree-container\"]).attr(\"transform\",\"translate (\"+_t68+\",\"+(_t68+_n41)+\")\");}else r=[r[0]+(\"fit-to-size\"!=this.options[\"top-bottom-spacing\"]?this.pad_height():0),r[1]+(\"fit-to-size\"!=this.options[\"left-right-spacing\"]?this.pad_width():0)];return e&&(n&&(e=e.transition(100)),e.attr(\"height\",r[0]).attr(\"width\",r[1])),this.size=r,r;}function Ed(t,e){(e=e||\"y_scaled\")in this&&(this[e]*=t);}function Sd(t){var e=new CustomEvent(xd,{detail:[\"refresh\",t]});document.dispatchEvent(e);}function Md(t,e){var n=new CustomEvent(xd,{detail:[\"countUpdate\",e,t.countHandler()]});document.dispatchEvent(n);}function Bd(t){var e=new CustomEvent(xd,{detail:[\"layout\",t,t.layoutHandler()]});document.dispatchEvent(e);}function Td(t){switch(t.detail[0]){case\"refresh\":t.detail[1].refresh();break;case\"countUpdate\":case\"layout\":t.detail[2](t.detail[1]);}return!0;}function zd(){document.addEventListener(xd,Td,!1);}function Cd(t){return!t||null===t[0]&&null===t[1]?\"\":\"translate (\"+(null!==t[0]?t[0]:0)+\",\"+(null!==t[1]?t[1]:0)+\") \";}function Nd(t){return null!==t?\"rotate (\"+t+\") \":\"\";}var Id=\"d3_layout_phylotree_context_menu\";function Od(t,e,n,r,i){var _this25=this;var o=Fr(e).select(\"#\"+Id);if(o.empty()&&(o=Fr(e).append(\"div\").attr(\"id\",Id).attr(\"class\",\"dropdown-menu\").attr(\"role\",\"menu\")),o.selectAll(\"a\").remove(),o.selectAll(\"h6\").remove(),o.selectAll(\"div\").remove(),t){if(!mc([Boolean(t.menu_items),r.hide,r.selectable,r.collapsible])||!r[\"show-menu\"])return;gf(t)||(r.collapsible&&(o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(ud(t)?\"Expand Subtree\":\"Collapse Subtree\").on(\"click\",function(e){o.style(\"display\",\"none\"),_this25.toggleCollapse(t).update();}),r.selectable&&(o.append(\"div\").attr(\"class\",\"dropdown-divider\"),o.append(\"h6\").attr(\"class\",\"dropdown-header\").text(\"Toggle selection\"))),r.selectable&&(o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(\"All descendant branches\").on(\"click\",function(e){o.style(\"display\",\"none\"),n.modifySelection(n.selectAllDescendants(t,!0,!0));}),o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(\"All terminal branches\").on(\"click\",function(e){o.style(\"display\",\"none\"),n.modifySelection(n.selectAllDescendants(t,!0,!1));}),o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(\"All internal branches\").on(\"click\",function(e){o.style(\"display\",\"none\"),n.modifySelection(n.selectAllDescendants(t,!1,!0));}))),t.parent&&(r.selectable&&(o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(\"Incident branch\").on(\"click\",function(e){o.style(\"display\",\"none\"),n.modifySelection([t]);}),o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(\"Path to root\").on(\"click\",function(e){o.style(\"display\",\"none\"),_this25.modifySelection(_this25.phylotree.pathToRoot(t));}),(r.reroot||r.hide)&&o.append(\"div\").attr(\"class\",\"dropdown-divider\")),r.reroot&&o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(\"Reroot on this node\").on(\"click\",function(e){o.style(\"display\",\"none\"),_this25.phylotree.reroot(t),_this25.update();}),r.hide&&o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(\"Hide this \"+(gf(t)?\"node\":\"subtree\")).on(\"click\",function(e){o.style(\"display\",\"none\"),_this25.modifySelection([t],\"notshown\",!0,!0).updateHasHiddenNodes().update();})),ad(t)&&o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(\"Show all descendant nodes\").on(\"click\",function(e){o.style(\"display\",\"none\"),n.modifySelection(n.selectAllDescendants(t,!0,!0),\"notshown\",!0,!0,\"false\").updateHasHiddenNodes().update();});var s=[];\"menu_items\"in t&&\"object\"==_typeof(t.menu_items)&&t.menu_items.forEach(function(e){3==e.length&&(e[2]&&!e[2](t)||s.push([e[0],e[1]]));}),s.length&&(mc([r.hide,r.selectable,r.collapsible])&&o.append(\"div\").attr(\"class\",\"dropdown-divider\"),s.forEach(function(e){o.append(\"a\").attr(\"class\",\"dropdown-item\").attr(\"tabindex\",\"-1\").text(e[0](t)).on(\"click\",Uh(e[1],t));}));var _a15=document.querySelector(e).getBoundingClientRect();o.style(\"position\",\"absolute\").style(\"left\",i.clientX-_a15.x+12+\"px\").style(\"top\",i.clientY-_a15.y+\"px\").style(\"display\",\"block\");}else o.style(\"display\",\"none\");}function Rd(t,e,n,r){\"menu_items\"in t||(t.menu_items=[]),t.menu_items.some(function(t){return t[0]==e&&t[1]==n&&t[2]==r;})||t.menu_items.push([e,n,r]);}function Ld(t,e,n,r,i){if(e=e||this.selection_attribute_name,i=i||\"toggle\",this.options[\"restricted-selectable\"].length){if(!vc(kl(Kf),t))return;t=Kf[t];}if(!this.options[\"restricted-selectable\"]&&!this.options.selectable||this.options[\"binary-selectable\"])this.options[\"binary-selectable\"]&&(\"function\"==typeof t?this.links.forEach(function(n){var r=t(n);n[e]=n[e]||!1,n[e]!=r&&(n[e]=r,s=!0,n.target[e]=r),this.options[\"attribute-list\"].forEach(function(t){t!=e&&!0===n[e]&&(n[t]=!1,n.target[t]=!1);});}):(t.forEach(function(t){var n;n=!t[e],t[e]!=n&&(t[e]=n,s=!0);}),this.links.forEach(function(t){t[e]=t.target[e],this.options[\"attribute-list\"].forEach(function(n){n!=e&&!0!==t[e]&&(t[n]=!1,t.target[n]=!1);});})),s&&(r||Sd(this),this.countHandler()&&((o={})[e]=this.links.reduce(function(t,n){return t+(n[e]?1:0);},0),this.countUpdate(this,o,this.countHandler())),n&&this.placenodes()));else{var o,s=!1;\"function\"==typeof t?this.links.forEach(function(n){var r=t(n);n[e]=n[e]||!1,n[e]!=r&&(n[e]=r,s=!0,n.target[e]=r);}):(t.forEach(function(t){var n;switch(i){case\"true\":n=!0;break;case\"false\":n=!1;break;default:n=!t[e];}t[e]!=n&&(t[e]=n,s=!0);}),this.links.forEach(function(t){t[e]=t.target[e];})),s&&(r||Sd(this),this.countHandler&&((o={})[e]=this.links.reduce(function(t,n){return t+(n[e]?1:0);},0),Md(this,o,this.countHandler)),n&&this.placenodes());}return this.selectionCallback&&\"tag\"!=e&&this.selectionCallback(this.getSelection()),this.refresh(),this.update(),this;}function Ud(){var _this26=this;return this.nodes.filter(function(t){return t[_this26.selection_attribute_name];});}function jd(t,e,n){var r=[];return function i(o){gf(o)?e&&o!=t&&r.push(o):(n&&o!=t&&r.push(o),o.children.forEach(i));}(t),r;}function Pd(t){return t?(this.selectionCallback=t,this):this.selectionCallback;}function Dd(t){return function(){return t;};}var Fd=/*#__PURE__*/function(){function Fd(t){var _this27=this;var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};_classCallCheck(this,Fd);this.css_classes=$f,this.phylotree=t,this.container=e.container,this.separation=function(t,e){return 0;},this._nodeLabel=this.defNodeLabel,this.svg=null,this.selectionCallback=null,this.scales=[1,1],this.size=[1,1],this.fixed_width=[14,30],this.scale_bar_font_size=12,this.draw_branch=Pf,this.draw_scale_bar=null,this.edge_placer=jf,this.count_listener_handler=function(){},this.layout_listener_handler=function(){},this.node_styler=void 0,this.edge_styler=void 0,this.selection_attribute_name=\"selected\",this.right_most_leaf=0,this.label_width=0,this.radial_center=0,this.radius=1,this.radius_pad_for_bubbles=0,this.rescale_nodeSpan=1,this.relative_nodeSpan=function(t){return this.nodeSpan(t)/this.rescale_nodeSpan;};var n={layout:\"left-to-right\",logger:console,branches:\"step\",scaling:!0,bootstrap:!1,\"color-fill\":!0,\"font-size\":14,\"internal-names\":!1,selectable:!0,\"restricted-selectable\":!1,collapsible:!0,\"left-right-spacing\":\"fixed-step\",\"top-bottom-spacing\":\"fixed-step\",\"left-offset\":0,\"show-scale\":\"top\",\"draw-size-bubbles\":!1,\"bubble-styler\":this.radius_pad_for_bubbles,\"binary-selectable\":!1,\"is-radial\":!1,\"attribute-list\":[],\"max-radius\":768,\"annular-limit\":.38196601125010515,compression:.2,\"align-tips\":!1,\"maximum-per-node-spacing\":100,\"minimum-per-node-spacing\":2,\"maximum-per-level-spacing\":100,\"minimum-per-level-spacing\":10,node_circle_size:Dd(3),transitions:null,brush:!0,reroot:!0,hide:!0,\"label-nodes-with-name\":!1,zoom:!1,\"show-menu\":!0,\"show-labels\":!0,\"node-styler\":null,\"edge-styler\":null,\"node-span\":null};this.ensure_size_is_in_px=function(t){return\"number\"==typeof t?t+\"px\":t;},this.options=Kl(e,n),this.font_size=this.options[\"font-size\"],this.offsets=[0,this.font_size/2],this.shown_font_size=this.font_size,this.width=this.options.width||800,this.height=this.options.height||600,this.node_styler=this.options[\"node-styler\"],this.edge_styler=this.options[\"edge-styler\"],this.nodeSpan=this.options[\"node-span\"],this.nodeSpan||(this.nodeSpan=function(t){return 1;}),this.rescale_nodeSpan=this.phylotree.nodes.children.map(function(t){if(gf(t)||_this27.showInternalName(t))return _this27.nodeSpan(t);}).reduce(function(t,e){return Math.min(e,t||1e200);},null)||1,this.initialize_svg(this.container),this.links=this.phylotree.nodes.links(),this.initializeEdgeLabels(),this.update(),zd();}_createClass(Fd,[{key:\"pad_height\",value:function pad_height(){return this.draw_scale_bar?this.scale_bar_font_size+25:0;}},{key:\"pad_width\",value:function pad_width(){this.label_width=this._label_width(this.shown_font_size);var t=this.options[\"show-labels\"]?this.label_width:0;return this.offsets[1]+this.options[\"left-offset\"]+t;}},{key:\"collapse_node\",value:function collapse_node(t){ud(t)||(t.collapsed=!0);}},{key:\"set_size\",value:function set_size(t){if(!arguments.length)return this.size;var e=t;return\"fixed-step\"!=this.options[\"top-bottom-spacing\"]&&(this.size[0]=e[0]),\"fixed-step\"!=this.options[\"left-right-spacing\"]&&(this.size[1]=e[1]),this;}},{key:\"initialize_svg\",value:function initialize_svg(t){var _this28=this;return this.svg!==t&&(Fr(t).select(\"svg\").remove(),this.svg=(\"svg\",Fr(Mr(\"svg\").call(document.documentElement))).attr(\"width\",this.width).attr(\"height\",this.height),this.set_size([this.height,this.width]),\"phylotree-container\"==this.css_classes[\"tree-container\"]&&(this.svg.selectAll(\"*\").remove(),this.svg.append(\"defs\")),Fr(this.container).on(\"click\",function(t){_this28.handle_node_click(null);},!0)),this;}},{key:\"update_layout\",value:function update_layout(t,e){e&&(this.nodes=Do(t),this.nodes.each(function(t){t.id=null;})),this.update(),this.syncEdgeLabels();}},{key:\"update\",value:function update(t){var _this29=this;var e=this;this.placenodes(),t=this.transitions(t);var n=0,r=this.svg.selectAll(\".\"+$f[\"tree-container\"]).data([0]);if(r=r.enter().append(\"g\").attr(\"class\",$f[\"tree-container\"]).merge(r).attr(\"transform\",function(t){return _this29.d3PhylotreeSvgTranslate([_this29.offsets[1]+_this29.options[\"left-offset\"],_this29.pad_height()]);}),this.draw_scale_bar){var _t69=this.svg.selectAll(\".\"+$f[\"tree-scale-bar\"]).data([0]);_t69.enter().append(\"g\").attr(\"class\",$f[\"tree-scale-bar\"]).style(\"font-size\",this.ensure_size_is_in_px(this.scale_bar_font_size)).merge(_t69).attr(\"transform\",function(t){return _this29.d3PhylotreeSvgTranslate([_this29.offsets[1]+_this29.options[\"left-offset\"],_this29.pad_height()-10]);}).call(this.draw_scale_bar),_t69.selectAll(\"text\").style(\"text-anchor\",\"end\");}else this.svg.selectAll(\".\"+$f[\"tree-scale-bar\"]).remove();r=this.svg.selectAll(\".\"+$f[\"tree-container\"]).data([0]),this.updateCollapsedClades(t);var i=r.selectAll(bd($f)).data(this.links.filter(yd),function(t){return t.target.id||(t.target.id=++n);});i.exit().remove(),i=i.enter().insert(\"path\",\":first-child\").merge(i).each(function(n){e.drawEdge(this,n,t);});var o=r.selectAll(ld($f)).data(this.phylotree.nodes.descendants().filter(od),function(t){return t.id||(t.id=++n);});if(o.exit().remove(),o=o.enter().append(\"g\").attr(\"class\",this.reclassNode).merge(o).attr(\"transform\",function(t){var e=\"right-to-left\"==_this29.options.layout&&gf(t);return t.screen_x=Nf(t),t.screen_y=If(t),_this29.d3PhylotreeSvgTranslate([e?0:t.screen_x,t.screen_y]);}).each(function(n){e.drawNode(this,n,t);}).attr(\"transform\",function(t){if(!Hu(t.screen_x)&&!Hu(t.screen_y))return\"translate(\"+t.screen_x+\",\"+t.screen_y+\")\";}),this.options[\"label-nodes-with-name\"]&&(o=o.attr(\"id\",function(t){return\"node-\"+t.name;})),this.resizeSvg(this.phylotree,this.svg,t),this.options.brush){var s=r.selectAll(\".\"+$f[\"tree-selection-brush\"]).data([0]).enter().insert(\"g\",\":first-child\").attr(\"class\",$f[\"tree-selection-brush\"]),a=So().on(\"brush\",function(t,e){var n=t.selection,r=_this29.links.filter(yd).filter(function(t,e){return t.source.screen_x>=n[0][0]&&t.source.screen_x<=n[1][0]&&t.source.screen_y>=n[0][1]&&t.source.screen_y<=n[1][1]&&t.target.screen_x>=n[0][0]&&t.target.screen_x<=n[1][0]&&t.target.screen_y>=n[0][1]&&t.target.screen_y<=n[1][1];}).map(function(t){return t.target;});_this29.modifySelection(_this29.phylotree.links.map(function(t){return t.target;}),\"tag\",!1,r.length>0,\"false\"),_this29.modifySelection(r,\"tag\",!1,!1,\"true\");}).on(\"end\",function(){});s.call(a);}if(this.syncEdgeLabels(),this.options.zoom){var _t70=function(){var t,e,n,r=pu,i=gu,o=yu,s=mu,a=vu,u=[0,1/0],l=[[-1/0,-1/0],[1/0,1/0]],h=250,c=au,f=Qe(\"start\",\"zoom\",\"end\"),d=500,p=150,g=0,_=10;function m(t){t.property(\"__zoom\",_u).on(\"wheel.zoom\",A).on(\"mousedown.zoom\",E).on(\"dblclick.zoom\",S).filter(a).on(\"touchstart.zoom\",M).on(\"touchmove.zoom\",B).on(\"touchend.zoom touchcancel.zoom\",T).style(\"-webkit-tap-highlight-color\",\"rgba(0,0,0,0)\");}function v(t,e){return(e=Math.max(u[0],Math.min(u[1],e)))===t.k?t:new hu(e,t.x,t.y);}function y(t,e,n){var r=e[0]-n[0]*t.k,i=e[1]-n[1]*t.k;return r===t.x&&i===t.y?t:new hu(t.k,r,i);}function b(t){return[(+t[0][0]+ +t[1][0])/2,(+t[0][1]+ +t[1][1])/2];}function w(t,e,n,r){t.on(\"start.zoom\",function(){x(this,arguments).event(r).start();}).on(\"interrupt.zoom end.zoom\",function(){x(this,arguments).event(r).end();}).tween(\"zoom\",function(){var t=this,o=arguments,s=x(t,o).event(r),a=i.apply(t,o),u=null==n?b(a):\"function\"==typeof n?n.apply(t,o):n,l=Math.max(a[1][0]-a[0][0],a[1][1]-a[0][1]),h=t.__zoom,f=\"function\"==typeof e?e.apply(t,o):e,d=c(h.invert(u).concat(l/h.k),f.invert(u).concat(l/f.k));return function(t){if(1===t)t=f;else{var e=d(t),n=l/e[2];t=new hu(n,u[0]-e[0]*n,u[1]-e[1]*n);}s.zoom(null,t);};});}function x(t,e,n){return!n&&t.__zooming||new k(t,e);}function k(t,e){this.that=t,this.args=e,this.active=0,this.sourceEvent=null,this.extent=i.apply(t,e),this.taps=0;}function A(t){for(var _len2=arguments.length,e=new Array(_len2>1?_len2-1:0),_key2=1;_key2<_len2;_key2++){e[_key2-1]=arguments[_key2];}if(r.apply(this,arguments)){var n=x(this,e).event(t),i=this.__zoom,a=Math.max(u[0],Math.min(u[1],i.k*Math.pow(2,s.apply(this,arguments)))),h=Zr(t);if(n.wheel)n.mouse[0][0]===h[0]&&n.mouse[0][1]===h[1]||(n.mouse[1]=i.invert(n.mouse[0]=h)),clearTimeout(n.wheel);else{if(i.k===a)return;n.mouse=[h,i.invert(h)],xi(this),n.start();}du(t),n.wheel=setTimeout(function(){n.wheel=null,n.end();},p),n.zoom(\"mouse\",o(y(v(i,a),n.mouse[0],n.mouse[1]),n.extent,l));}}function E(t){for(var _len3=arguments.length,e=new Array(_len3>1?_len3-1:0),_key3=1;_key3<_len3;_key3++){e[_key3-1]=arguments[_key3];}if(!n&&r.apply(this,arguments)){var i=x(this,e,!0).event(t),s=Fr(t.view).on(\"mousemove.zoom\",function(t){if(du(t),!i.moved){var e=t.clientX-h,n=t.clientY-c;i.moved=e*e+n*n>g;}i.event(t).zoom(\"mouse\",o(y(i.that.__zoom,i.mouse[0]=Zr(t,u),i.mouse[1]),i.extent,l));},!0).on(\"mouseup.zoom\",function(t){s.on(\"mousemove.zoom mouseup.zoom\",null),qr(t.view,i.moved),du(t),i.event(t).end();},!0),a=Zr(t,u),u=t.currentTarget,h=t.clientX,c=t.clientY;Hr(t.view),fu(t),i.mouse=[a,this.__zoom.invert(a)],xi(this),i.start();}}function S(t){for(var _len4=arguments.length,e=new Array(_len4>1?_len4-1:0),_key4=1;_key4<_len4;_key4++){e[_key4-1]=arguments[_key4];}if(r.apply(this,arguments)){var n=this.__zoom,s=Zr(t.changedTouches?t.changedTouches[0]:t,this),a=n.invert(s),u=n.k*(t.shiftKey?.5:2),c=o(y(v(n,u),s,a),i.apply(this,e),l);du(t),h>0?Fr(this).transition().duration(h).call(w,c,s,t):Fr(this).call(m.transform,c,s,t);}}function M(n){for(var _len5=arguments.length,i=new Array(_len5>1?_len5-1:0),_key5=1;_key5<_len5;_key5++){i[_key5-1]=arguments[_key5];}if(r.apply(this,arguments)){var o,s,a,u,l=n.touches,h=l.length,c=x(this,i,n.changedTouches.length===h).event(n);for(fu(n),s=0;s<h;++s)u=[u=Zr(a=l[s],this),this.__zoom.invert(u),a.identifier],c.touch0?c.touch1||c.touch0[2]===u[2]||(c.touch1=u,c.taps=0):(c.touch0=u,o=!0,c.taps=1+!!t);t&&(t=clearTimeout(t)),o&&(c.taps<2&&(e=u[0],t=setTimeout(function(){t=null;},d)),xi(this),c.start());}}function B(t){if(this.__zooming){for(var _len6=arguments.length,e=new Array(_len6>1?_len6-1:0),_key6=1;_key6<_len6;_key6++){e[_key6-1]=arguments[_key6];}var n,r,i,s,a=x(this,e).event(t),u=t.changedTouches,h=u.length;for(du(t),n=0;n<h;++n)i=Zr(r=u[n],this),a.touch0&&a.touch0[2]===r.identifier?a.touch0[0]=i:a.touch1&&a.touch1[2]===r.identifier&&(a.touch1[0]=i);if(r=a.that.__zoom,a.touch1){var c=a.touch0[0],f=a.touch0[1],d=a.touch1[0],p=a.touch1[1],g=(g=d[0]-c[0])*g+(g=d[1]-c[1])*g,_=(_=p[0]-f[0])*_+(_=p[1]-f[1])*_;r=v(r,Math.sqrt(g/_)),i=[(c[0]+d[0])/2,(c[1]+d[1])/2],s=[(f[0]+p[0])/2,(f[1]+p[1])/2];}else{if(!a.touch0)return;i=a.touch0[0],s=a.touch0[1];}a.zoom(\"touch\",o(y(r,i,s),a.extent,l));}}function T(t){for(var _len7=arguments.length,r=new Array(_len7>1?_len7-1:0),_key7=1;_key7<_len7;_key7++){r[_key7-1]=arguments[_key7];}if(this.__zooming){var i,o,s=x(this,r).event(t),a=t.changedTouches,u=a.length;for(fu(t),n&&clearTimeout(n),n=setTimeout(function(){n=null;},d),i=0;i<u;++i)o=a[i],s.touch0&&s.touch0[2]===o.identifier?delete s.touch0:s.touch1&&s.touch1[2]===o.identifier&&delete s.touch1;if(s.touch1&&!s.touch0&&(s.touch0=s.touch1,delete s.touch1),s.touch0)s.touch0[1]=this.__zoom.invert(s.touch0[0]);else if(s.end(),2===s.taps&&(o=Zr(o,this),Math.hypot(e[0]-o[0],e[1]-o[1])<_)){var l=Fr(this).on(\"dblclick.zoom\");l&&l.apply(this,arguments);}}}return m.transform=function(t,e,n,r){var i=t.selection?t.selection():t;i.property(\"__zoom\",_u),t!==i?w(t,e,n,r):i.interrupt().each(function(){x(this,arguments).event(r).start().zoom(null,\"function\"==typeof e?e.apply(this,arguments):e).end();});},m.scaleBy=function(t,e,n,r){m.scaleTo(t,function(){return this.__zoom.k*(\"function\"==typeof e?e.apply(this,arguments):e);},n,r);},m.scaleTo=function(t,e,n,r){m.transform(t,function(){var t=i.apply(this,arguments),r=this.__zoom,s=null==n?b(t):\"function\"==typeof n?n.apply(this,arguments):n,a=r.invert(s),u=\"function\"==typeof e?e.apply(this,arguments):e;return o(y(v(r,u),s,a),t,l);},n,r);},m.translateBy=function(t,e,n,r){m.transform(t,function(){return o(this.__zoom.translate(\"function\"==typeof e?e.apply(this,arguments):e,\"function\"==typeof n?n.apply(this,arguments):n),i.apply(this,arguments),l);},null,r);},m.translateTo=function(t,e,n,r,s){m.transform(t,function(){var t=i.apply(this,arguments),s=this.__zoom,a=null==r?b(t):\"function\"==typeof r?r.apply(this,arguments):r;return o(cu.translate(a[0],a[1]).scale(s.k).translate(\"function\"==typeof e?-e.apply(this,arguments):-e,\"function\"==typeof n?-n.apply(this,arguments):-n),t,l);},r,s);},k.prototype={event:function event(t){return t&&(this.sourceEvent=t),this;},start:function start(){return 1==++this.active&&(this.that.__zooming=this,this.emit(\"start\")),this;},zoom:function zoom(t,e){return this.mouse&&\"mouse\"!==t&&(this.mouse[1]=e.invert(this.mouse[0])),this.touch0&&\"touch\"!==t&&(this.touch0[1]=e.invert(this.touch0[0])),this.touch1&&\"touch\"!==t&&(this.touch1[1]=e.invert(this.touch1[0])),this.that.__zoom=e,this.emit(\"zoom\"),this;},end:function end(){return 0==--this.active&&(delete this.that.__zooming,this.emit(\"end\")),this;},emit:function emit(t){var e=Fr(this.that).datum();f.call(t,this.that,new lu(t,{sourceEvent:this.sourceEvent,target:m,type:t,transform:this.that.__zoom,dispatch:f}),e);}},m.wheelDelta=function(t){return arguments.length?(s=\"function\"==typeof t?t:uu(+t),m):s;},m.filter=function(t){return arguments.length?(r=\"function\"==typeof t?t:uu(!!t),m):r;},m.touchable=function(t){return arguments.length?(a=\"function\"==typeof t?t:uu(!!t),m):a;},m.extent=function(t){return arguments.length?(i=\"function\"==typeof t?t:uu([[+t[0][0],+t[0][1]],[+t[1][0],+t[1][1]]]),m):i;},m.scaleExtent=function(t){return arguments.length?(u[0]=+t[0],u[1]=+t[1],m):[u[0],u[1]];},m.translateExtent=function(t){return arguments.length?(l[0][0]=+t[0][0],l[1][0]=+t[1][0],l[0][1]=+t[0][1],l[1][1]=+t[1][1],m):[[l[0][0],l[0][1]],[l[1][0],l[1][1]]];},m.constrain=function(t){return arguments.length?(o=t,m):o;},m.duration=function(t){return arguments.length?(h=+t,m):h;},m.interpolate=function(t){return arguments.length?(c=t,m):c;},m.on=function(){var t=f.on.apply(f,arguments);return t===f?m:t;},m.clickDistance=function(t){return arguments.length?(g=(t=+t)*t,m):Math.sqrt(g);},m.tapDistance=function(t){return arguments.length?(_=+t,m):_;},m;}().scaleExtent([.1,10]).on(\"zoom\",function(t){Fr(\".\"+$f[\"tree-container\"]).attr(\"transform\",function(e){return t.transform;}),Fr(\".\"+$f[\"tree-scale-bar\"]).attr(\"transform\",function(e){var n=t.transform;return n.y-=10,n;});});this.svg.call(_t70);}return this;}},{key:\"_handle_single_node_layout\",value:function _handle_single_node_layout(t){var e=this.nodeSpan(t)/this.rescale_nodeSpan;this.x=t.x=this.x+this.separation(this.last_node,t)+.5*(this.last_span+e),this._extents[1][1]=Math.max(this._extents[1][1],t.y),this._extents[1][0]=Math.min(this._extents[1][0],t.y-.5*e),this.is_under_collapsed_parent?this._extents[0][1]=Math.max(this._extents[0][1],this.save_x+(t.x-this.save_x)*this.options.compression+this.save_span+(.5*e+this.separation(this.last_node,t))*this.options.compression):this._extents[0][1]=Math.max(this._extents[0][1],this.x+.5*e+this.separation(this.last_node,t)),this.last_node=t,this.last_span=e;}},{key:\"tree_layout\",value:function tree_layout(t){var _this30=this;if(sd(t))return;var e=gf(t);t.text_angle=null,t.text_align=null,t.radius=null,t.angle=null;var n=!1;if(t.parent){if(this.do_scaling){if(n)return 0;if(t.y=this.phylotree.branch_length_accessor(t),void 0===t.y)return n=!0,0;t.y+=t.parent.y;}else t.y=e?this.max_depth:t.depth;}else this.x=0,t.y=0,this.last_node=null,this.last_span=0,this._extents=[[0,0],[0,0]];if(e&&this._handle_single_node_layout(t),!e)if(ud(t)&&!this.is_under_collapsed_parent){if(this.save_x=this.x,this.save_span=.5*this.last_span,this.is_under_collapsed_parent=!0,this.process_internal_node(t),this.is_under_collapsed_parent=!1,\"number\"==typeof t.x){t.x=this.save_x+(t.x-this.save_x)*this.options.compression+this.save_span,t.collapsed=[[t.x,t.y]];var r=function r(e){e.hidden=!0,gf(e)?(_this30.x=e.x=_this30.save_x+(e.x-_this30.save_x)*_this30.options.compression+_this30.save_span,t.collapsed.push([e.x,e.y])):e.children.map(r);};this.x=this.save_x,r(t),t.collapsed.splice(1,0,[this.save_x,t.y]),t.collapsed.push([this.x,t.y]),t.collapsed.push([t.x,t.y]),t.hidden=!1;}}else this.process_internal_node(t);return t.x;}},{key:\"process_internal_node\",value:function process_internal_node(t){var e=0;if(this.showInternalName(t)){var _e62=t.children.length/2>>0,_n42=0,_r40=!1;for(var _i27=0;_i27<t.children.length;_i27++)\"number\"==typeof this.tree_layout(t.children[_i27])&&_n42++,_n42>=_e62&&!_r40&&(this._handle_single_node_layout(t),_r40=!0);0==_n42?(t.notshown=!0,t.x=void 0):_r40||this._handle_single_node_layout(t);}else t.x=t.children.map(this.tree_layout.bind(this)).reduce(function(t,n){return\"number\"==typeof n?t+n:(e+=1,t);},0),e==t.children.length?(t.notshown=!0,t.x=void 0):t.x/=t.children.length-e;}},{key:\"do_lr\",value:function do_lr(t){if(this.radial()&&t&&(this.offsets[1]=0),\"fixed-step\"==this.options[\"left-right-spacing\"])this.size[1]=this.max_depth*this.fixed_width[1],this.scales[1]=(this.size[1]-this.offsets[1]-this.options[\"left-offset\"])/this._extents[1][1],this.label_width=this._label_width(this.shown_font_size),this.radial()&&(this.label_width*=2);else{this.label_width=this._label_width(this.shown_font_size),t=!0;var _e63=this.size[1]-this.offsets[1]-this.options[\"left-offset\"];.5*_e63<this.label_width&&(this.shown_font_size*=.5*_e63/this.label_width,this.label_width=.5*_e63),this.scales[1]=(this.size[1]-this.offsets[1]-this.options[\"left-offset\"]-this.label_width)/this._extents[1][1];}}},{key:\"placenodes\",value:function placenodes(){var _this31=this;this._extents=[[0,0],[0,0]],this.x=0,this.last_span=0,this.last_node=null,this.last_span=0,this.save_x=this.x,this.save_span=.5*this.last_span,this.do_scaling=this.options.scaling,this.is_under_collapsed_parent=!1,this.max_depth=1,this.phylotree.nodes.x=this.tree_layout(this.phylotree.nodes,this.do_scaling),this.max_depth=function(t,e){var n;if(void 0===e){var _iterator27=_createForOfIteratorHelper(t),_step27;try{for(_iterator27.s();!(_step27=_iterator27.n()).done;){var _e64=_step27.value;null!=_e64&&(n<_e64||void 0===n&&_e64>=_e64)&&(n=_e64);}}catch(err){_iterator27.e(err);}finally{_iterator27.f();}}else{var _r41=-1;var _iterator28=_createForOfIteratorHelper(t),_step28;try{for(_iterator28.s();!(_step28=_iterator28.n()).done;){var _i28=_step28.value;null!=(_i28=e(_i28,++_r41))&&(n<_i28||void 0===n&&_i28>=_i28)&&(n=_i28);}}catch(err){_iterator28.e(err);}finally{_iterator28.f();}}return n;}(this.phylotree.nodes.descendants(),function(t){return t.depth;}),this.do_scaling;var t=!1;if(this.draw_scale_bar=this.options[\"show-scale\"]&&this.do_scaling,this.offsets[1]=Math.max(this.font_size,-this._extents[1][0]*this.fixed_width[0]),\"fixed-step\"==this.options[\"top-bottom-spacing\"]?(this.size[0]=this._extents[0][1]*this.fixed_width[0],this.scales[0]=this.fixed_width[0]):(this.scales[0]=(this.size[0]-this.pad_height())/this._extents[0][1],t=!0),this.shown_font_size=Math.min(this.font_size,this.scales[0]),this.radial()){this.draw_branch=Uh(Lf,this.radial_center),this.edge_placer=Uf;var _e65=null,_n43=null,_r42=null,_i29=0,_o19=this._extents[0][1]*this.scales[0],_s24=function _s24(t,e,n,r,i){return i=i||0,Math.sqrt((e-t)*(e-t)+2*(t+i)*(e+i)*(1-Math.cos(n-r)));},_a16=0;this.phylotree.nodes.each(function(t){var e=t.x*_this31.scales[0];t.angle=2*Math.PI*e/_o19,t.text_angle=t.angle-Math.PI/2,t.text_angle=t.text_angle>0&&t.text_angle<Math.PI,t.text_align=t.text_angle?\"end\":\"start\",t.text_angle=(t.text_angle?180:0)+180*t.angle/Math.PI;}),this.do_lr(t),this.phylotree.nodes.each(function(t){t.radius=t.y*_this31.scales[1]/_this31.size[1],_a16=Math.max(t.radius,_a16);});var _u8=0;this.phylotree.nodes.each(function(t){if(!t.children){var _o20=t.x*_this31.scales[0];if(null!==_e65){var _l6=_o20-_n43,_h4=_s24(t.radius,_r42,t.angle,_e65,_u8),_c3=_h4>0?_l6/_h4:10*_this31.options[\"max-radius\"];if(_c3>_this31.options[\"max-radius\"]){var _n44=_l6/_this31.options[\"max-radius\"],_o21=t.radius+_r42,_s25=t.radius*_r42-(_n44*_n44-(_r42-t.radius)*(_r42-t.radius))/2/(1-Math.cos(_e65-t.angle)),_h5=Math.sqrt(_o21*_o21-4*_s25);_u8=Math.min(_this31.options[\"annular-limit\"]*_a16,(-_o21+_h5)/2),_i29=_this31.options[\"max-radius\"];}else _i29=Math.max(_i29,_c3);}_e65=t.angle,_n43=_o20,_r42=t.radius;}}),this.radius=Math.min(this.options[\"max-radius\"],Math.max(_o19/2/Math.PI,_i29)),t&&(this.radius=Math.min(this.radius,.5*(Math.min(_o19,this._extents[1][1]*this.scales[1])-this.label_width)-this.radius*_u8)),this.radial_center=this.radius_pad_for_bubbles=this.radius,this.draw_branch=Uh(Lf,this.radial_center);var _l7=1;_u8&&(_l7=_a16/(_a16+_u8),this.radius*=_l7),this.phylotree.nodes.each(function(t){if(Rf(t,_this31.radius,_u8,_this31.radial_center,_this31.scales,_this31.size),_a16=Math.max(_a16,t.radius),_this31.options[\"draw-size-bubbles\"]?_this31.radius_pad_for_bubbles=Math.max(_this31.radius_pad_for_bubbles,t.radius+_this31.nodeBubbleSize(t)):_this31.radius_pad_for_bubbles=Math.max(_this31.radius_pad_for_bubbles,t.radius),t.collapsed){t.collapsed=t.collapsed.map(function(t){var e={};return e.x=t[0],e.y=t[1],e=Rf(e,_this31.radius,_u8,_this31.radial_center,_this31.scales,_this31.size),[e.x,e.y];});var _e66=t.collapsed[1];t.collapsed=t.collapsed.filter(function(n,r){return r<3||r>t.collapsed.length-4||Math.sqrt(Math.pow(n[0]-_e66[0],2)+Math.pow(n[1]-_e66[1],2))>3&&(_e66=n,!0);});}}),this.size[0]=this.radial_center+this.radius/_l7,this.size[1]=this.radial_center+this.radius/_l7;}else this.do_lr(),this.draw_branch=Pf,this.edge_placer=jf,this.right_most_leaf=0,this.phylotree.nodes.each(function(t){if(t.x*=_this31.scales[0],t.y*=.8*_this31.scales[1],\"right-to-left\"==_this31.options.layout&&(t.y=_this31._extents[1][1]*_this31.scales[1]-t.y),gf(t)&&(_this31.right_most_leaf=Math.max(_this31.right_most_leaf,t.y+_this31.nodeBubbleSize(t))),t.collapsed){t.collapsed.forEach(function(t){t[0]*=_this31.scales[0],t[1]*=.8*_this31.scales[1];});var _e67=t.collapsed[1][0];t.collapsed=t.collapsed.filter(function(n,r){return r<3||r>t.collapsed.length-4||n[0]-_e67>3&&(_e67=n[0],!0);});}});if(this.draw_scale_bar){var _t71,_e68;if(this.radial()){if(_e68=Math.min(this.radius/5,50),_t71=Math.pow(10,Math.ceil(Math.log(this._extents[1][1]*_e68/this.radius)/Math.log(10))),_e68=_t71*(this.radius/this._extents[1][1]),_e68<30){var _n45=Math.ceil(30/_e68);_e68*=_n45,_t71*=_n45;}}else _t71=this._extents[1][1],_e68=this.size[1]-this.offsets[1]-this.options[\"left-offset\"]-this.shown_font_size;var _n46=Ut().domain([0,_t71]).range([0,_e68]),_r43=Lo(\".2f\");if(this.draw_scale_bar=Bn(1,void 0).scale(_n46).tickFormat(function(t){return 0===t?\"\":_r43(t);}),this.radial())this.draw_scale_bar.tickValues([_t71]);else{var _t72=function _t72(t,e){return e?Math.round(t*(e=Math.pow(10,e)))/e:Math.round(t);},_i30=_n46.ticks();_i30=_i30.length>1?_i30[1]:_i30[0],this.draw_scale_bar.ticks(Math.min(10,_t72(_e68/(this.shown_font_size*_r43(_i30).length*2),0)));}}else this.draw_scale_bar=null;return this;}},{key:\"spacing_x\",value:function spacing_x(t,e){return arguments.length?(this.fixed_width[0]!=t&&t>=this.options[\"minimum-per-node-spacing\"]&&t<=this.options[\"maximum-per-node-spacing\"]&&(this.fixed_width[0]=t,e||this.placenodes()),this):this.fixed_width[0];}},{key:\"spacing_y\",value:function spacing_y(t,e){return arguments.length?(this.fixed_width[1]!=t&&t>=this.options[\"minimum-per-level-spacing\"]&&t<=this.options[\"maximum-per-level-spacing\"]&&(this.fixed_width[1]=t,e||this.placenodes()),this):this.fixed_width[1];}},{key:\"_label_width\",value:function _label_width(t){var _this32=this;t=t||this.shown_font_size;var e=0;return this.phylotree.nodes.descendants().filter(od).forEach(function(n){var r=12+_this32._nodeLabel(n).length*t*.8;null!==n.angle&&(r*=Math.max(Math.abs(Math.cos(n.angle)),Math.abs(Math.sin(n.angle)))),e=Math.max(r,e);}),e;}},{key:\"font_size\",value:function font_size(t){return arguments.length?(this.font_size=void 0===t?12:t,this):this.font_size;}},{key:\"scale_bar_font_size\",value:function scale_bar_font_size(t){return arguments.length?(this.scale_bar_font_size=void 0===t?12:t,this):this.scale_bar_font_size;}},{key:\"node_circle_size\",value:function node_circle_size(t,e){return arguments.length?(this.options.node_circle_size=Dd(void 0===t?3:t),this):this.options.node_circle_size;}},{key:\"css\",value:function css(t){if(0===arguments.length)return this.css_classes;if(arguments.length>2){var e={};return e[t[0]]=t[1],this.css(e);}for(var n in $f)n in t&&t[n]!=$f[n]&&($f[n]=t[n]);return this;}},{key:\"transitions\",value:function transitions(t){return void 0!==t?t:null!==this.options.transitions?this.options.transitions:this.phylotree.nodes.descendants().length<=300;}},{key:\"css_classes\",value:function css_classes(t,e){if(!arguments.length)return this.css_classes;var n=!1;for(var r in $f)r in t&&t[r]!=this.css_classes[r]&&(n=!0,this.css_classes[r]=t[r]);return e&&n&&this.layout(),this;}},{key:\"layout\",value:function layout(t){return this.svg?(this.svg.selectAll(\".\"+this.css_classes[\"tree-container\"]+\",.\"+this.css_classes[\"tree-scale-bar\"]+\",.\"+this.css_classes[\"tree-selection-brush\"]),this.d3PhylotreeTriggerLayout(this),this.update()):(this.d3PhylotreeTriggerLayout(this),this);}},{key:\"handle_node_click\",value:function handle_node_click(t,e){this.nodeDropdownMenu(t,this.container,this,this.options,e);}},{key:\"refresh\",value:function refresh(){var _this33=this;if(this.svg){var _t73=this.svg.selectAll(\".\"+this.css_classes[\"tree-container\"]).selectAll(bd(this.css_classes)).attr(\"class\",this.reclassEdge.bind(this));this.edge_styler&&_t73.each(function(t){_this33.edge_styler(Fr(_this33),t);});}return this;}},{key:\"countHandler\",value:function countHandler(t){return arguments.length?(this.count_listener_handler=t,this):this.count_listener_handler;}},{key:\"style_nodes\",value:function style_nodes(t){return arguments.length?(this.node_styler=t,this):this.node_styler;}},{key:\"style_edges\",value:function style_edges(t){return arguments.length?(this.edge_styler=t.bind(this),this):this.edge_styler;}},{key:\"itemSelected\",value:function itemSelected(t,e){return t[e]||!1;}},{key:\"show\",value:function show(){return this.svg.node();}}]);return Fd;}();Vl(Fd.prototype,a),Vl(Fd.prototype,s),Vl(Fd.prototype,u),Vl(Fd.prototype,l),Vl(Fd.prototype,h),Vl(Fd.prototype,o);var $d=Fd;var Hd=/*#__PURE__*/function(){function Hd(t){var e=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};_classCallCheck(this,Hd);this.newick_string=\"\",this.nodes=[],this.links=[],this.parsed_tags=[],this.partitions=[],this.branch_length_accessor=Bf,this.branch_length=Bf,this.logger=e.logger||console,this.selection_attribute_name=\"selected\";var n=e.type||void 0,r=[],i=this;if(Gu(n))n in Ef?r=Ef[n](t,e):i.logger.error(\"type \"+n+\" not in registry! Available types are \"+kl(Ef));else if(nl(n))try{r=n(t,e);}catch(t){i.logger.error(\"Could not parse custom format!\");}else\"root\"==t.name?r={json:t,error:null}:\"string\"!=typeof t?r=t:\"application/xml\"==t.contentType?r=Af(t):(this.newick_string=t,r=yf(t,e));if(r.json){i.nodes=Do(r.json);var _t74={};i.nodes.each(function(e){e.data.annotation&&(_t74[e.data.annotation]=!0);}),i.parsed_tags=Object.keys(_t74);}else i.nodes=[];return i.links=i.nodes.links(),this.hasBranchLengths()||(console.warn(\"Phylotree User Warning : NO BRANCH LENGTHS DETECTED, SETTING ALL LENGTHS TO 1\"),this.setBranchLength(function(t){return 1;})),i;}_createClass(Hd,[{key:\"json\",value:function json(t){var e=0;this.traverse_and_compute(function(t){t.json_export_index=e++;},t);var n=new Array(e);return e=0,this.traverse_and_compute(function(t){var r=th(t);delete r.json_export_index,t.parent&&(r.parent=t.parent.json_export_index),t.children&&(r.children=hc(t.children,function(t){return t.json_export_index;})),n[e++]=r;},t),this.traverse_and_compute(function(t){delete t.json_export_index;},t),JSON.stringify(n);}},{key:\"traverse_and_compute\",value:function traverse_and_compute(t,e,n,r){return e=\"pre-order\"==(e=e||\"post-order\")?function(e){!function(t,e,n){var r,i,o=[t];for(;t=o.pop();)if((!n||!n(t))&&(e(t),r=t.children,r))for(i=r.length-1;i>=0;--i)o.push(r[i]);}(e,t,r);}:\"in-order\"==e?function(e){!function(t,e,n){var r,i,o,s,a=[t];do{for(r=a.reverse(),a=[];t=r.pop();)if((!n||!n(t))&&(e(t),i=t.children,i))for(o=0,s=i.length;o<s;++o)a.push(i[o]);}while(a.length);}(e,t,r);}:function(e){Hu(e)||Mf(e,t,r);},e(n||this.nodes),this;}},{key:\"get_parsed_tags\",value:function get_parsed_tags(){return this.parsed_tags;}},{key:\"update\",value:function update(t){this.nodes=t;}},{key:\"render\",value:function render(t){return this.display=new $d(this,t),this.display;}}]);return Hd;}();Hd.prototype.isLeafNode=gf,Hd.prototype.selectAllDescendants=vf,Hd.prototype.mrca=function(t){var e;return t=t.map(function(t){return\"string\"==typeof t?t:t.data.name;}),this.traverse_and_compute(function(n){n.children?n.parent?(n.data.mrca=Gc.apply(void 0,_toConsumableArray(n.descendants().map(function(t){return t.data.mrca;}))),e||n.data.mrca.length!=t.length||(e=n)):e||(e=n):n.data.mrca=Yc([n.data.name],t);}),e;},Hd.prototype.hasBranchLengths=function(){var t=this.branch_length;return!!t&&_c(this.nodes.descendants(),function(e){return!e.parent||!Hu(t(e));});},Hd.prototype.getBranchLengths=function(){var t=this.branch_length;return hc(this.nodes.descendants(),function(e){return t(e);});},Hd.prototype.branchName=function(t){return arguments.length?(this.nodeLabel=t,this):this.nodeLabel;},Hd.prototype.normalizeBranchLengths=function(t){var e=this.branch_length,n=hc(this.nodes.descendants(),function(t){return e(t)?e(t):null;});var r=xc(n),i=kc(n);return lc(this.nodes.descendants(),function(t){var n=e(t);n&&e(t,(n-i)/(r-i));}),this;},Hd.prototype.scaleBranchLengths=function(t){var e=this.branch_length;return lc(this.nodes.descendants(),function(n){var r=e(n);r&&e(n,t(r));}),this;},Hd.prototype.getNewick=function(t,e){var n=this;t||(t=function t(_t75){return\"\";});var r=[];return t=t||\"\",function e(i){if(i.notshown)return;if(gf(i)||(r.push(\"(\"),i.children.forEach(function(t,n){n&&r.push(\",\"),e(t);}),r.push(\")\")),\"root\"!==i.data.name){var _t76=i.data.name.replaceAll(\"'\",\"''\");/\\W/.test(_t76)?r.push(\"'\"+_t76+\"'\"):r.push(_t76);}r.push(t(i));var o=n.branch_length_accessor(i);void 0!==o&&r.push(\":\"+o);}(e||this.nodes),r.join(\"\")+\";\";},Hd.prototype.resortChildren=function(t,e,n){return this.nodes.sum(function(t){return t.value;}).sort(t),this.display&&(this.display.update_layout(this.nodes),this.display.update()),this;},Hd.prototype.setBranchLength=function(t){return arguments.length?(this.branch_length_accessor=t||Bf,this):this.branch_length_accessor;},Hd.prototype.maxParsimony=function(t,e){var n=Uh(function(t,e){if(e.mp=[[0,0],[!1,!1]],gf(e))e.mp[1][0]=e.mp[1][1]=e[t]||!1,e.mp[0][0]=e.mp[1][0]?1:0,e.mp[0][1]=1-e.mp[0][0];else{e.children.forEach(n);var r=e.children.reduce(function(t,e){return e.mp[0][0]+t;},0),i=e.children.reduce(function(t,e){return e.mp[0][1]+t;},0);e[t]?(e.mp[0][0]=i+1,e.mp[1][0]=!0,e.mp[0][1]=i,e.mp[1][1]=!0):(r<i+1?(e.mp[0][0]=r,e.mp[1][0]=!1):(e.mp[0][0]=i+1,e.mp[1][0]=!0),i<r+1?(e.mp[0][1]=i,e.mp[1][1]=!0):(e.mp[0][1]=r+1,e.mp[1][1]=!1));}},e);n(this.nodes),this.nodes.each(function(t){t.parent?t.mp=t.mp[1][t.parent.mp?1:0]:t.mp=t.mp[1][t.mp[0][0]<t.mp[0][1]?0:1];}),this.display.modifySelection(function(t,n){return gf(t.target)?t.target[e]:t.target.mp;});},Hd.prototype.getTipLengths=function(){var t=hc(this.getTips(),function(t){return{name:t.data.name,length:parseFloat(t.data.attribute)};});return t=Bc(t,function(t){return-t.length;}),t;},Hd.prototype.leftChildRightSibling=function(t){return Mf(t,function(t){t.children&&(t.children[0].data.multiway_parent=t,t.children[1].data.multiway_parent=t.parent);}),Sf.map(t.descendants(),function(t){var e=t.data.multiway_parent,n=\"unknown\";return e&&(n=e.data.name),{source:t.data.multiway_parent,target:t,name:n};});},Vl(Hd.prototype,e),Vl(Hd.prototype,i),Vl(Hd.prototype,r);var qd=Hd;$s(\"%Y%m%d\");var Zd=n(6248);var Wd=function Wd(t,e){return t.reduce(function(t,n){return(t[n[e]]=t[n[e]]||[]).push(n),t;},{});};function Gd(t,e){var n=t[0],r=e[0];if(n.indexOf(\"_\")>=0){var _t77=n.split(\"_\");if(r.indexOf(\"_\")>=0){var _e69=r.split(\"_\");return Gd(_t77[1],_e69[1]);}return 1;}if(r.indexOf(\"_\")>=0)return-1;var i=[],o=[];var _iterator29=_createForOfIteratorHelper(n.match(/(\\d+|[^\\d]+)/g)),_step29;try{for(_iterator29.s();!(_step29=_iterator29.n()).done;){var _t79=_step29.value;i.push(Number.isNaN(_t79)?_t79.toLowerCase():+_t79);}}catch(err){_iterator29.e(err);}finally{_iterator29.f();}var _iterator30=_createForOfIteratorHelper(r.match(/(\\d+|[^\\d]+)/g)),_step30;try{for(_iterator30.s();!(_step30=_iterator30.n()).done;){var _t80=_step30.value;i.push(Number.isNaN(_t80)?_t80.toLowerCase():+_t80);}}catch(err){_iterator30.e(err);}finally{_iterator30.f();}for(var _i31=0,_arr=[\"m\",\"y\",\"x\"];_i31<_arr.length;_i31++){var _t78=_arr[_i31];if(r.toLowerCase().includes(_t78))return-1;if(n.toLowerCase().includes(_t78))return 1;}return i<o?-1:o>i?1:0;}var Yd=function Yd(t,e,n,r,i){var o=t.get(\"seq\"),s=+t.get(\"start\")+1+n,a=+t.get(\"end\")+1+n,u={id:t.get(\"id\"),mate_ids:[],start:+t.get(\"start\")+1,from:s,to:a,fromWithClipping:s,toWithClipping:a,md:t.get(\"MD\"),sa:t.get(\"SA\"),chrName:e,chrOffset:n,cigar:t.get(\"cigar\"),mapq:t.get(\"mq\"),strand:1===t.get(\"strand\")?\"+\":\"-\",row:null,readName:t.get(\"name\"),seq:o,color:Re.BG,colorOverride:null,mappingOrientation:null,substitutions:[],mm:t.get(\"MM\"),ml:t.get(\"ML\"),methylationOffsets:[]};if(i)return u;if(\"+\"===u.strand&&r&&r.plusStrandColor?u.color=Re.PLUS_STRAND:\"-\"===u.strand&&r&&r.minusStrandColor&&(u.color=Re.MINUS_STRAND),u.substitutions=function(t,e,n){var r=[],i=null;if(t.cigar){var _e70=je(t.cigar,!0);var _n47=0;var _iterator31=_createForOfIteratorHelper(_e70),_step31;try{for(_iterator31.s();!(_step31=_iterator31.n()).done;){var _i32=_step31.value;\"S\"!==_i32.type&&\"H\"!==_i32.type?\"X\"===_i32.type?(r.push({pos:_n47,length:_i32.length,range:[_n47+t.start,_n47+t.start+_i32.length],type:\"X\"}),_n47+=_i32.length):\"I\"===_i32.type?r.push({pos:_n47,length:_i32.length,range:[_n47+t.start,_n47+t.start+_i32.length],type:\"I\"}):\"D\"===_i32.type?(r.push({pos:_n47,length:_i32.length,range:[_n47+t.start,_n47+t.start+_i32.length],type:\"D\"}),_n47+=_i32.length):\"N\"===_i32.type?(r.push({pos:_n47,length:_i32.length,range:[_n47+t.start,_n47+t.start+_i32.length],type:\"N\"}),_n47+=_i32.length):\"=\"===_i32.type?(r.push({pos:_n47,length:_i32.length,range:[_n47+t.start,_n47+t.start+_i32.length],type:\"=\"}),_n47+=_i32.length):\"M\"===_i32.type&&(r.push({pos:_n47,length:_i32.length,range:[_n47+t.start,_n47+t.start+_i32.length],type:\"M\"}),_n47+=_i32.length):(r.push({pos:_n47,length:_i32.length,range:[_n47+t.start,_n47+t.start+_i32.length],type:_i32.type}),_n47+=_i32.length);}}catch(err){_iterator31.e(err);}finally{_iterator31.f();}var _o22=_e70[0],_s26=_e70[_e70.length-1];\"S\"===_o22.type&&(i=_o22,r.push({pos:-_o22.length,type:\"S\",length:_o22.length})),\"S\"===_s26.type&&r.push({pos:t.to-t.from,length:_s26.length,type:\"S\"}),\"H\"===_o22.type&&r.push({pos:-_o22.length,type:\"H\",length:_o22.length}),\"H\"===_s26.type&&r.push({pos:t.to-t.from,length:_s26.length,type:\"H\"});}if(t.md){var _n48=je(t.md,!1);_n48.forEach(function(t){var n=t.pos+t.bamSeqShift,r=n+t.length;null!==i&&(n+=i.length,r+=i.length),t.variant=e.substring(n,r),delete t.bamSeqShift;}),r=_n48.concat(r);}return r;}(u,o),r.methylation&&(u.methylationOffsets=function(t,e,n){var r=[];var i={unmodifiedBase:\"\",code:\"\",strand:\"\",offsets:[],probabilities:[]},o=function o(t,e){var n=[];for(var _r44=0;_r44<t.length;++_r44)t[_r44]===e&&n.push(_r44);return n;},s={A:\"T\",C:\"G\",G:\"C\",T:\"A\",U:\"A\",Y:\"R\",R:\"Y\",S:\"S\",W:\"W\",K:\"M\",M:\"K\",B:\"V\",V:\"B\",D:\"H\",H:\"D\",N:\"N\"};if(t.mm&&t.ml){var _n49=0;var _a17=t.mm.split(\";\"),_u9=t.ml.split(\",\");_a17.forEach(function(a){if(0===a.length)return;var l=Object.assign({},i),h=a.split(\",\");l.unmodifiedBase=h[0].charAt(0),l.strand=h[0].charAt(1),l.code=h[0].charAt(2);var c=h.length-1,f=new Array(c),d=new Array(c),p=\"+\"===t.strand?o(e,l.unmodifiedBase):o(e,s[l.unmodifiedBase]);var g=0;if(\"+\"===t.strand)for(var _t81=1;_t81<h.length;++_t81){g+=parseInt(h[_t81]);var _e71=p[g],_r45=_u9[_t81-1+_n49];f[_t81-1]=_e71,d[_t81-1]=_r45,g+=1;}else for(var _t82=1;_t82<h.length;++_t82){g+=parseInt(h[_t82]);var _e72=p[p.length-g-1],_r46=_u9[_t82-1+_n49];f[c-_t82]=_e72,d[c-_t82]=_r46,g+=1;}var _=0,m=0,v=0;var y=new Array(),b=new Array();var _iterator32=_createForOfIteratorHelper(t.substitutions),_step32;try{for(_iterator32.s();!(_step32=_iterator32.n()).done;){var _e73=_step32.value;if(\"S\"===_e73.type||\"H\"===_e73.type)m-=_e73.length,v=_e73.length;else if(\"M\"===_e73.type||\"=\"===_e73.type)for(;f[_]+m<_e73.pos+_e73.length;)f[_]+m>=_e73.pos&&(y.push(f[_]+m-v),b.push(d[_])),_++;else\"X\"===_e73.type?f[_]+m===_e73.pos&&_++:\"D\"===_e73.type?m+=_e73.length:\"I\"===_e73.type?m-=_e73.length:\"N\"===_e73.type&&(m+=_e73.length);\"S\"!==_e73.type&&\"H\"!==_e73.type||(m+=_e73.length);}}catch(err){_iterator32.e(err);}finally{_iterator32.f();}l.offsets=y,l.probabilities=b,r.push(l),_n49+=c;});}return r;}(u,o,r.methylation.alignCpGEvents)),r.fire&&(u.metadata=JSON.parse(t.get(\"CO\")),u.color=Re.FIRE_BG),r.tfbs&&(u.metadata=JSON.parse(t.get(\"CO\"))),r.genericBed){u.metadata=JSON.parse(t.get(\"CO\")),u.genericBedColors=function(t){if(!t.genericBed)return{};var e={GENERIC_BED_BG:[0,0,0,0]};return t.genericBed.colors.forEach(function(t,n){var r=t.split(\",\").map(function(t){return parseFloat((parseFloat(t)/255).toFixed(2));});e[\"GENERIC_BED_\".concat(t)]=[].concat(_toConsumableArray(r),[1]);}),_objectSpread(_objectSpread({},Oe),e);}(r);var _e74={};Object.keys(u.genericBedColors).map(function(t,n){return _e74[t]=n,null;}),Le(_e74);}if(r.indexDHS){u.metadata=JSON.parse(t.get(\"CO\")),u.indexDHSColors=function(t){if(!t.indexDHS)return{};var e={INDEX_DHS_BG:[0,0,0,0]};return Object.entries(t.indexDHS.itemRGBMap).map(function(t){var n=t[0],r=n.split(\",\").map(function(t){return parseFloat((parseFloat(t)/255).toFixed(2));});e[\"INDEX_DHS_\".concat(n)]=[].concat(_toConsumableArray(r),[1]);}),_objectSpread(_objectSpread({},Oe),e);}(r);var _e75={};Object.keys(u.indexDHSColors).map(function(t,n){return _e75[t]=n,null;}),Le(_e75),u.color=Re.INDEX_DHS_BG;}var l=0,h=0;var _iterator33=_createForOfIteratorHelper(u.substitutions),_step33;try{for(_iterator33.s();!(_step33=_iterator33.n()).done;){var _t83=_step33.value;(\"S\"===_t83.type||\"H\"===_t83.type)&&_t83.pos<0?l=-_t83.length:(\"S\"===_t83.type||\"H\"===_t83.type)&&_t83.pos>0&&(h=_t83.length);}}catch(err){_iterator33.e(err);}finally{_iterator33.f();}return u.fromWithClipping+=l,u.toWithClipping+=h,u;},Vd=function Vd(t){var e=Wd(t,\"readName\");return Object.entries(e).forEach(function(_ref26){var _ref27=_slicedToArray(_ref26,2),t=_ref27[0],e=_ref27[1];if(2===e.length){var _t84=e[0],_n50=e[1];_t84.mate_ids=[_n50.id],_n50.mate_ids=[_t84.id];}else if(e.length>2){var _t85=e.map(function(t){return t.id;});e.forEach(function(e){e.mate_ids=_t85;});}}),e;},Xd=function Xd(t){var e=[],n=Object.keys(t);var _loop2=function _loop2(){var i={row:null,substitutions:[]};for(var _e76=0;_e76<n.length;_e76++)i[n[_e76]]=t[n[_e76]][_r47];if(i.from+=1,i.to+=1,i.variants&&(i.substitutions=i.variants.map(function(t){return{pos:t[1]-(i.from-i.chrOffset)+1,variant:t[2].toUpperCase(),length:1};})),i.cigars){var _iterator34=_createForOfIteratorHelper(i.cigars),_step34;try{for(_iterator34.s();!(_step34=_iterator34.n()).done;){var _t86=_step34.value;i.substitutions.push({pos:_t86[0]-(i.from-i.chrOffset)+1,type:_t86[1].toUpperCase(),length:_t86[2]});}}catch(err){_iterator34.e(err);}finally{_iterator34.f();}}e.push(i);};for(var _r47=0;_r47<t[n[0]].length;_r47++){_loop2();}return e;},Kd={},Jd={},Qd={},tp={},ep={},np={},rp=new(Fe())({max:20}),ip={},op={},sp=new(Fe())({max:20}),ap={},up={};function lp(t,e){var n=tp[e].authHeader,r={headers:{}};return n&&(r.headers.Authorization=n),fetch(t,r);}var hp={maxTileWidth:2e5},cp=function cp(t){var _ap$t=ap[t],e=_ap$t.chromSizesUrl,n=_ap$t.bamUrl,r=e?[Jd[n],ep[e]]:[Jd[n]];return Promise.all(r).then(function(r){var i=1024;var o=null;if(r.length>1)o=r[1];else{var _t87=[];var _iterator35=_createForOfIteratorHelper(Kd[n].indexToChr),_step35;try{for(_iterator35.s();!(_step35=_iterator35.n()).done;){var _step35$value=_step35.value,_e77=_step35$value.refName,_r48=_step35$value.length;_t87.push([_e77,_r48]);}}catch(err){_iterator35.e(err);}finally{_iterator35.f();}_t87.sort(Gd),o=mn(_t87);}np[e]=o;var s={tile_size:i,bins_per_dimension:i,max_zoom:Math.ceil(Math.log(o.totalLength/i)/Math.log(2)),max_width:o.totalLength,min_pos:[0],max_pos:[o.totalLength]};return ip[t]=s,s;});},fp=/*#__PURE__*/function(){var _ref28=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee67(t,e,n){var _Qd$t,r,i,o,s,a,_ap$t2,u,l,h,c,f;return _regeneratorRuntime().wrap(function _callee67$(_context70){while(1)switch(_context70.prev=_context70.next){case 0:if(!(!t||!Qd[t]||!Qd[t].maxTileWidth)){_context70.next=2;break;}return _context70.abrupt(\"return\");case 2:_Qd$t=Qd[t],r=_Qd$t.maxTileWidth,i=_Qd$t.maxSampleSize,o=_Qd$t.fiberMinLength,s=_Qd$t.fiberMaxLength,a=_Qd$t.fiberStrands,_ap$t2=ap[t],u=_ap$t2.bamUrl,l=_ap$t2.fastaUrl,h=_ap$t2.chromSizesUrl,c=Kd[u],f=l&&op[l]?op[l]:null;return _context70.abrupt(\"return\",cp(t).then(function(u){var l=+u.max_width/Math.pow(2,+e),d=[];if(l>r)return new Promise(function(t){return t([]);});var p=u.min_pos[0]+n*l;var g=u.min_pos[0]+(n+1)*l,_=np[h],m=_.chromLengths,v=_.cumPositions;var _loop3=function _loop3(_r49){var u=v[_r49].chr,l=v[_r49].pos,h=v[_r49].pos+m[u];if(rp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),[]),sp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),[]),l<=p&&p<h){var _2={viewAsPairs:Pe(up[t]),maxSampleSize:i||1e3,maxInsertSize:1e3,assemblyName:\"hg38\"};if(!(g>h)){var _i33=Math.ceil(g-l),_h6=Math.floor(p-l);d.push(c.getRecordsForRange(u,_h6,_i33,_2).then(function(i){var l=i.map(function(e){return Yd(e,u,v[_r49].pos,up[t],!1);});if(up[t].methylation){var _r50=l.filter(function(t){return Math.abs(t.to-t.from)>=o&&Math.abs(t.to-t.from)<=s;}).filter(function(t){return a.includes(t.strand);});rp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),rp.get(\"\".concat(t,\".\").concat(e,\".\").concat(n)).concat(_r50));}else if(up[t].fire){var _r51=l.filter(function(t){return Math.abs(t.to-t.from)>=o&&Math.abs(t.to-t.from)<=s;}).filter(function(t){return a.includes(t.strand);});rp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),rp.get(\"\".concat(t,\".\").concat(e,\".\").concat(n)).concat(_r51));}else rp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),rp.get(\"\".concat(t,\".\").concat(e,\".\").concat(n)).concat(l));return[];})),f&&d.push(f.getSequence(u,_h6,_i33).then(function(o){var s={id:\"\".concat(u,\":\").concat(_h6,\"-\").concat(_i33),chrom:u,start:_h6,stop:_i33,chromOffset:v[_r49].pos,data:o};return sp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),sp.get(\"\".concat(t,\".\").concat(e,\".\").concat(n)).concat(s)),[];}));return 1;// break\n}d.push(c.getRecordsForRange(u,p-l,h-l,_2).then(function(i){var l=i.map(function(e){return Yd(e,u,v[_r49].pos,up[t],!1);});if(up[t].methylation||up[t].fire){var _r52=l.filter(function(t){return Math.abs(t.to-t.from)>=o&&Math.abs(t.to-t.from)<=s;}).filter(function(t){return a.includes(t.strand);});rp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),rp.get(\"\".concat(t,\".\").concat(e,\".\").concat(n)).concat(_r52));}else rp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),rp.get(\"\".concat(t,\".\").concat(e,\".\").concat(n)).concat(l));})),f&&d.push(f.getSequence(u,p-l,h-l).then(function(i){var o={id:\"\".concat(u,\":\").concat(p-l,\"-\").concat(h-l),chrom:u,start:p-l,stop:h-l,chromOffset:v[_r49].pos,data:i};sp.set(\"\".concat(t,\".\").concat(e,\".\").concat(n),sp.get(\"\".concat(t,\".\").concat(e,\".\").concat(n)).concat(o));})),p=h;}};for(var _r49=0;_r49<v.length;_r49++){if(_loop3(_r49))break;}return Promise.all(d).then(function(t){return t.flat();});}));case 4:case\"end\":return _context70.stop();}},_callee67);}));return function fp(_x95,_x96,_x97){return _ref28.apply(this,arguments);};}(),dp=function dp(t,e,n){var r=t.max_width/Math.pow(2,e);return[n*r,(n+1)*r];};function pp(t,e,n){var r=t.fromWithClipping-n,i=t.toWithClipping+n;if(null===t.row||void 0===t.row){for(var _n51=0;_n51<e.length;_n51++){if(!e[_n51])return;var _o23=e[_n51].from,_s27=e[_n51].to;if(i<_o23)return t.row=_n51,void(e[_n51]={from:r,to:_s27});if(r>_s27)return t.row=_n51,void(e[_n51]={from:_o23,to:i});}t.row=e.length,e.push({from:r,to:i});}else{var _n52=t.row;if(e[_n52]){var _t88=e[_n52].from,_o24=e[_n52].to;e[_n52]={from:Math.min(r,_t88),to:Math.max(i,_o24)};}else e[_n52]={from:r,to:i};}}function gp(t,e){var _Object$assign=Object.assign({prevRows:[],padding:5,readNamesToFilterOn:[]},e||{}),n=_Object$assign.prevRows,r=_Object$assign.padding,i=_Object$assign.readNamesToFilterOn;var o=[];var s=new Set(t.map(function(t){return t.id;})),a=n.flat().filter(function(t){return s.has(t.id);});e.maxRows&&e.maxRows;for(var _t89=0;_t89<a.length;_t89++)pp(a[_t89],o,r);var u=new Set(a.map(function(t){return t.id;}));var l=[];var h=t.filter(function(t){return!u.has(t.id);});if(0===a.length){h.sort(function(t,e){return t.fromWithClipping-e.fromWithClipping;});var _iterator36=_createForOfIteratorHelper(h),_step36;try{for(_iterator36.s();!(_step36=_iterator36.n()).done;){var _t90=_step36.value;pp(_t90,o,r);}}catch(err){_iterator36.e(err);}finally{_iterator36.f();}l=h;}else{var _t91=(a[0].fromWithClipping+a[a.length-1].to)/2,_e78=h.filter(function(e){return e.fromWithClipping<=_t91;});_e78.sort(function(t,e){return e.fromWithClipping-t.fromWithClipping;});var _iterator37=_createForOfIteratorHelper(_e78),_step37;try{for(_iterator37.s();!(_step37=_iterator37.n()).done;){var _t92=_step37.value;pp(_t92,o,r);}}catch(err){_iterator37.e(err);}finally{_iterator37.f();}var _n53=h.filter(function(e){return e.fromWithClipping>_t91;});_n53.sort(function(t,e){return t.fromWithClipping-e.fromWithClipping;});var _iterator38=_createForOfIteratorHelper(_n53),_step38;try{for(_iterator38.s();!(_step38=_iterator38.n()).done;){var _t93=_step38.value;pp(_t93,o,r);}}catch(err){_iterator38.e(err);}finally{_iterator38.f();}l=_e78.concat(a,_n53);}var c=[];if(i&&i.length>0){var _loop4=function _loop4(_t94){c[_t94]=l.filter(function(e){return e.readName===i[_t94];});};for(var _t94=0;_t94<i.length;_t94++){_loop4(_t94);}}else{var _loop5=function _loop5(_t95){c[_t95]=l.filter(function(e){return e.row===_t95;});};for(var _t95=0;_t95<o.length;_t95++){_loop5(_t95);}}return c;}var _p=Math.pow(2,20),mp=Math.pow(2,21),vp=Math.pow(2,21),yp=new Float32Array(_p),bp=new Float32Array(mp),wp=new Int32Array(vp);function xp(t){for(var e in t)return!1;return!0;}var kp=function kp(t,e,n,r,i,o,s,a,u,l){var h={};var _iterator39=_createForOfIteratorHelper(n),_step39;try{for(_iterator39.s();!(_step39=_iterator39.n()).done;){var _t118=_step39.value;var _n118=null;try{if(_n118=rp.get(\"\".concat(e,\".\").concat(_t118)),_n118.error)continue;}catch(t){continue;}if(_n118){var _iterator58=_createForOfIteratorHelper(_n118),_step58;try{for(_iterator58.s();!(_step58=_iterator58.n()).done;){var _t119=_step58.value;h[_t119.id]=_t119;}}catch(err){_iterator58.e(err);}finally{_iterator58.f();}}}}catch(err){_iterator39.e(err);}finally{_iterator39.f();}var c=Object.hasOwn(Qd[e],c)?Qd[e].fiberMinLength:0,f=Object.hasOwn(Qd[e],f)?Qd[e].fiberMaxLength:3e4,d=Object.hasOwn(Qd[e],d)?Qd[e].fiberStrands:[\"+\",\"-\"];var p=Object.values(h),g=null;if(l&&u.methylation){var _t96=l,_e79=_t96.range.left.start,_n54=_t96.range.right.stop,_r53=_t96.viewportRange.left.start,_i34=_t96.viewportRange.right.stop,_o25=_t96.method,_s28=_t96.distanceFn,_a18=_t96.eventCategories,_u10=(_t96.linkage,_t96.epsilon,_t96.minimumPoints,_t96.probabilityThresholdRange[0],_t96.probabilityThresholdRange[1],_t96.eventOverlapType),_h7=_t96.filterFiberMinLength,_c4=_t96.filterFiberMaxLength,_f5=_t96.filterFiberStrands,_d3=Math.floor(_t96.basesPerPixel);_t96.viewportWidthInPixels;var _3=null;var _m=_i34-_r53,_v=_d3>0?Math.floor(_m/_d3):_m,_y=p.length,_b=_v?new Array():[],_w=new Array();var _x98=0;switch(_o25){case\"AGNES\":switch(_s28){case\"Euclidean\":_3=vn.WI;for(var _t97=0;_t97<_y;++_t97){var _o26=p[_t97],_s29=_o26.strand,_l8=_o26.to-_o26.from,_g2=_o26.from-_o26.chrOffset,_4=_o26.to-_o26.chrOffset,_v2=_o26.methylationOffsets;if(!(_l8<_h7||_l8>_c4)&&(!_f5||_f5.includes(_s29)))switch(_u10){case\"Full viewport\":if(_g2<_r53&&_4>_i34){if(_w.push(_o26.readName),_m){var _t98=new Array(_m);for(var _e80=0;_e80<_m;_e80++)_t98[_e80]=0;var _e81=_r53-_g2,_n55=_e81+_m;var _iterator40=_createForOfIteratorHelper(_v2),_step40;try{for(_iterator40.s();!(_step40=_iterator40.n()).done;){var _r54=_step40.value;var _i35=_r54.offsets,_o27=_r54.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_r54.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_r54.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_r54.unmodifiedBase)for(var _r55=0;_r55<_i35.length;_r55++){var _s30=_i35[_r55],_a19=_o27[_r55];_s30>=_e81&&_s30<=_n55&&(_t98[_s30-_e81]=parseInt(_a19));}}}catch(err){_iterator40.e(err);}finally{_iterator40.f();}_b[_x98]=_d3>1?Ap(_t98,_t98.length,0,_d3-1,_d3):_t98;}_x98++;}break;case\"Full subregion\":if(_g2<_e79&&_4>_n54){if(_w.push(_o26.readName),_m){var _t99=new Array(_m);for(var _e82=0;_e82<_m;_e82++)_t99[_e82]=-255;var _e83=_r53-_g2;if(_g2<_r53&&_4>_i34)for(var _e84=0;_e84<_m;_e84++)_t99[_e84]=0;else if(_g2>=_r53&&_4>_i34)for(var _n56=_e83;_n56<_m;_n56++)_t99[_n56]=0;else if(_g2>=_r53&&_4<=_i34){var _n57=_m-(_i34-_4);for(var _r56=_e83;_r56<_n57;_r56++)_t99[_r56]=0;}var _iterator41=_createForOfIteratorHelper(_v2),_step41;try{for(_iterator41.s();!(_step41=_iterator41.n()).done;){var _n58=_step41.value;var _r57=_n58.offsets,_i36=_n58.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n58.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n58.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n58.unmodifiedBase)for(var _n59=0;_n59<_r57.length;_n59++){var _o28=_r57[_n59]-_e83,_s31=_i36[_n59];_o28>=0&&_o28<_m&&(_t99[_o28]=parseInt(_s31));}}}catch(err){_iterator41.e(err);}finally{_iterator41.f();}_b[_x98]=_d3>1?Ap(_t99,_t99.length,0,_d3-1,_d3):_t99;}_x98++;}break;case\"Partial subregion\":if(_g2<_e79&&_4>_n54){if(_w.push(_o26.readName),_m){var _t100=new Array(_m);for(var _e85=0;_e85<_m;_e85++)_t100[_e85]=-255;var _e86=_r53-_g2;if(_g2<_r53&&_4>_i34)for(var _e87=0;_e87<_m;_e87++)_t100[_e87]=0;else if(_g2>=_r53&&_4>_i34)for(var _n60=_e86;_n60<_m;_n60++)_t100[_n60]=0;else if(_g2>=_r53&&_4<=_i34){var _n61=_m-(_i34-_4);for(var _r58=_e86;_r58<_n61;_r58++)_t100[_r58]=0;}var _iterator42=_createForOfIteratorHelper(_v2),_step42;try{for(_iterator42.s();!(_step42=_iterator42.n()).done;){var _n62=_step42.value;var _r59=_n62.offsets,_i37=_n62.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n62.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n62.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n62.unmodifiedBase)for(var _n63=0;_n63<_r59.length;_n63++){var _o29=_r59[_n63]-_e86,_s32=_i37[_n63];_o29>=0&&_o29<_m&&(_t100[_o29]=parseInt(_s32));}}}catch(err){_iterator42.e(err);}finally{_iterator42.f();}_b[_x98]=_d3>1?Ap(_t100,_t100.length,0,_d3-1,_d3):_t100;}_x98++;}else if(_g2>=_e79&&_4<=_n54){if(_w.push(_o26.readName),_m){var _t101=new Array(_m);for(var _e88=0;_e88<_m;_e88++)_t101[_e88]=-255;var _e89=_r53-_g2;if(_g2<_r53&&_4>_i34)for(var _e90=0;_e90<_m;_e90++)_t101[_e90]=0;else if(_g2>=_r53&&_4>_i34)for(var _n64=_e89;_n64<_m;_n64++)_t101[_n64]=0;else if(_g2>=_r53&&_4<=_i34){var _n65=_m-(_i34-_4);for(var _r60=_e89;_r60<_n65;_r60++)_t101[_r60]=0;}var _iterator43=_createForOfIteratorHelper(_v2),_step43;try{for(_iterator43.s();!(_step43=_iterator43.n()).done;){var _n66=_step43.value;var _r61=_n66.offsets,_i38=_n66.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n66.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n66.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n66.unmodifiedBase)for(var _n67=0;_n67<_r61.length;_n67++){var _o30=_r61[_n67]-_e89,_s33=_i38[_n67];_o30>=0&&_o30<_m&&(_t101[_o30]=parseInt(_s33));}}}catch(err){_iterator43.e(err);}finally{_iterator43.f();}_b[_x98]=_d3>1?Ap(_t101,_t101.length,0,_d3-1,_d3):_t101;}_x98++;}else if(_g2<_e79&&_4<=_n54&&_4>_e79){if(_w.push(_o26.readName),_m){var _t102=new Array(_m);for(var _e91=0;_e91<_m;_e91++)_t102[_e91]=-255;var _e92=_r53-_g2;if(_g2<_r53&&_4>_i34)for(var _e93=0;_e93<_m;_e93++)_t102[_e93]=0;else if(_g2>=_r53&&_4>_i34)for(var _n68=_e92;_n68<_m;_n68++)_t102[_n68]=0;else if(_g2>=_r53&&_4<=_i34){var _n69=_m-(_i34-_4);for(var _r62=_e92;_r62<_n69;_r62++)_t102[_r62]=0;}var _iterator44=_createForOfIteratorHelper(_v2),_step44;try{for(_iterator44.s();!(_step44=_iterator44.n()).done;){var _n70=_step44.value;var _r63=_n70.offsets,_i39=_n70.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n70.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n70.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n70.unmodifiedBase)for(var _n71=0;_n71<_r63.length;_n71++){var _o31=_r63[_n71]-_e92,_s34=_i39[_n71];_o31>=0&&_o31<_m&&(_t102[_o31]=parseInt(_s34));}}}catch(err){_iterator44.e(err);}finally{_iterator44.f();}_b[_x98]=_d3>1?Ap(_t102,_t102.length,0,_d3-1,_d3):_t102;}_x98++;}else if(_g2>=_e79&&_g2<_n54&&_4>_n54){if(_w.push(_o26.readName),_m){var _t103=new Array(_m);for(var _e94=0;_e94<_m;_e94++)_t103[_e94]=-255;var _e95=_r53-_g2;if(_g2<_r53&&_4>_i34)for(var _e96=0;_e96<_m;_e96++)_t103[_e96]=0;else if(_g2>=_r53&&_4>_i34)for(var _n72=_e95;_n72<_m;_n72++)_t103[_n72]=0;else if(_g2>=_r53&&_4<=_i34){var _n73=_m-(_i34-_4);for(var _r64=_e95;_r64<_n73;_r64++)_t103[_r64]=0;}var _iterator45=_createForOfIteratorHelper(_v2),_step45;try{for(_iterator45.s();!(_step45=_iterator45.n()).done;){var _n74=_step45.value;var _r65=_n74.offsets,_i40=_n74.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n74.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n74.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n74.unmodifiedBase)for(var _n75=0;_n75<_r65.length;_n75++){var _o32=_r65[_n75]-_e95,_s35=_i40[_n75];_o32>=0&&_o32<_m&&(_t103[_o32]=parseInt(_s35));}}}catch(err){_iterator45.e(err);}finally{_iterator45.f();}_b[_x98]=_d3>1?Ap(_t103,_t103.length,0,_d3-1,_d3):_t103;}_x98++;}break;default:throw new Error(\"Event overlap type [\".concat(_u10,\"] is unknown or unsupported for cluster matrix generation\"));}}break;case\"Jaccard\":_3=vn.eN;for(var _t104=0;_t104<_y;++_t104){var _o33=p[_t104],_s36=_o33.strand,_l9=_o33.to-_o33.from,_g3=_o33.from-_o33.chrOffset,_5=_o33.to-_o33.chrOffset,_v3=_o33.methylationOffsets;if(!(_l9<_h7||_l9>_c4)&&(!_f5||_f5.includes(_s36)))switch(_u10){case\"Full viewport\":if(_g3<_r53&&_5>_i34){if(_w.push(_o33.readName),_m){var _t105=new Array(_m);for(var _e97=0;_e97<_m;_e97++)_t105[_e97]=0;var _e98=_r53-_g3,_n76=_e98+_m;var _iterator46=_createForOfIteratorHelper(_v3),_step46;try{for(_iterator46.s();!(_step46=_iterator46.n()).done;){var _r66=_step46.value;var _i41=_r66.offsets,_o34=_r66.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_r66.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_r66.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_r66.unmodifiedBase)for(var _r67=0;_r67<_i41.length;_r67++){var _s37=_i41[_r67];_o34[_r67],_s37>=_e98&&_s37<=_n76&&(_t105[_s37-_e98]=1);}}}catch(err){_iterator46.e(err);}finally{_iterator46.f();}_b[_x98]=_d3>1?Ap(_t105,_t105.length,0,_d3-1,_d3):_t105;}_x98++;}break;case\"Full subregion\":if(_g3<_e79&&_5>_n54){if(_w.push(_o33.readName),_m){var _t106=new Array(_m);for(var _e99=0;_e99<_m;_e99++)_t106[_e99]=-255;var _e100=_r53-_g3;if(_g3<_r53&&_5>_i34)for(var _e101=0;_e101<_m;_e101++)_t106[_e101]=0;else if(_g3>=_r53&&_5>_i34)for(var _n77=_e100;_n77<_m;_n77++)_t106[_n77]=0;else if(_g3>=_r53&&_5<=_i34){var _n78=_m-(_i34-_5);for(var _r68=_e100;_r68<_n78;_r68++)_t106[_r68]=0;}var _iterator47=_createForOfIteratorHelper(_v3),_step47;try{for(_iterator47.s();!(_step47=_iterator47.n()).done;){var _n79=_step47.value;var _r69=_n79.offsets,_i42=_n79.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n79.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n79.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n79.unmodifiedBase)for(var _n80=0;_n80<_r69.length;_n80++){var _o35=_r69[_n80]-_e100;_i42[_n80],_o35>=0&&_o35<_m&&(_t106[_o35]=1);}}}catch(err){_iterator47.e(err);}finally{_iterator47.f();}_b[_x98]=_d3>1?Ap(_t106,_t106.length,0,_d3-1,_d3):_t106;}_x98++;}break;case\"Partial subregion\":if(_g3<_e79&&_5>_n54){if(_w.push(_o33.readName),_m){var _t107=new Array(_m);for(var _e102=0;_e102<_m;_e102++)_t107[_e102]=-255;var _e103=_r53-_g3;if(_g3<_r53&&_5>_i34)for(var _e104=0;_e104<_m;_e104++)_t107[_e104]=0;else if(_g3>=_r53&&_5>_i34)for(var _n81=_e103;_n81<_m;_n81++)_t107[_n81]=0;else if(_g3>=_r53&&_5<=_i34){var _n82=_m-(_i34-_5);for(var _r70=_e103;_r70<_n82;_r70++)_t107[_r70]=0;}var _iterator48=_createForOfIteratorHelper(_v3),_step48;try{for(_iterator48.s();!(_step48=_iterator48.n()).done;){var _n83=_step48.value;var _r71=_n83.offsets,_i43=_n83.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n83.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n83.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n83.unmodifiedBase)for(var _n84=0;_n84<_r71.length;_n84++){var _o36=_r71[_n84]-_e103;_i43[_n84],_o36>=0&&_o36<_m&&(_t107[_o36]=1);}}}catch(err){_iterator48.e(err);}finally{_iterator48.f();}_b[_x98]=_d3>1?Ap(_t107,_t107.length,0,_d3-1,_d3):_t107;}_x98++;}else if(_g3>=_e79&&_5<=_n54){if(_w.push(_o33.readName),_m){var _t108=new Array(_m);for(var _e105=0;_e105<_m;_e105++)_t108[_e105]=-255;var _e106=_r53-_g3;if(_g3<_r53&&_5>_i34)for(var _e107=0;_e107<_m;_e107++)_t108[_e107]=0;else if(_g3>=_r53&&_5>_i34)for(var _n85=_e106;_n85<_m;_n85++)_t108[_n85]=0;else if(_g3>=_r53&&_5<=_i34){var _n86=_m-(_i34-_5);for(var _r72=_e106;_r72<_n86;_r72++)_t108[_r72]=0;}var _iterator49=_createForOfIteratorHelper(_v3),_step49;try{for(_iterator49.s();!(_step49=_iterator49.n()).done;){var _n87=_step49.value;var _r73=_n87.offsets,_i44=_n87.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n87.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n87.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n87.unmodifiedBase)for(var _n88=0;_n88<_r73.length;_n88++){var _o37=_r73[_n88]-_e106;_i44[_n88],_o37>=0&&_o37<_m&&(_t108[_o37]=1);}}}catch(err){_iterator49.e(err);}finally{_iterator49.f();}_b[_x98]=_d3>1?Ap(_t108,_t108.length,0,_d3-1,_d3):_t108;}_x98++;}else if(_g3<_e79&&_5<=_n54&&_5>_e79){if(_w.push(_o33.readName),_m){var _t109=new Array(_m);for(var _e108=0;_e108<_m;_e108++)_t109[_e108]=-255;var _e109=_r53-_g3;if(_g3<_r53&&_5>_i34)for(var _e110=0;_e110<_m;_e110++)_t109[_e110]=0;else if(_g3>=_r53&&_5>_i34)for(var _n89=_e109;_n89<_m;_n89++)_t109[_n89]=0;else if(_g3>=_r53&&_5<=_i34){var _n90=_m-(_i34-_5);for(var _r74=_e109;_r74<_n90;_r74++)_t109[_r74]=0;}var _iterator50=_createForOfIteratorHelper(_v3),_step50;try{for(_iterator50.s();!(_step50=_iterator50.n()).done;){var _n91=_step50.value;var _r75=_n91.offsets,_i45=_n91.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n91.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n91.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n91.unmodifiedBase)for(var _n92=0;_n92<_r75.length;_n92++){var _o38=_r75[_n92]-_e109;_i45[_n92],_o38>=0&&_o38<_m&&(_t109[_o38]=1);}}}catch(err){_iterator50.e(err);}finally{_iterator50.f();}_b[_x98]=_d3>1?Ap(_t109,_t109.length,0,_d3-1,_d3):_t109;}_x98++;}else if(_g3>=_e79&&_g3<_n54&&_5>_n54){if(_w.push(_o33.readName),_m){var _t110=new Array(_m);for(var _e111=0;_e111<_m;_e111++)_t110[_e111]=-255;var _e112=_r53-_g3;if(_g3<_r53&&_5>_i34)for(var _e113=0;_e113<_m;_e113++)_t110[_e113]=0;else if(_g3>=_r53&&_5>_i34)for(var _n93=_e112;_n93<_m;_n93++)_t110[_n93]=0;else if(_g3>=_r53&&_5<=_i34){var _n94=_m-(_i34-_5);for(var _r76=_e112;_r76<_n94;_r76++)_t110[_r76]=0;}var _iterator51=_createForOfIteratorHelper(_v3),_step51;try{for(_iterator51.s();!(_step51=_iterator51.n()).done;){var _n95=_step51.value;var _r77=_n95.offsets,_i46=_n95.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n95.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n95.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n95.unmodifiedBase)for(var _n96=0;_n96<_r77.length;_n96++){var _o39=_r77[_n96]-_e112;_i46[_n96],_o39>=0&&_o39<_m&&(_t110[_o39]=1);}}}catch(err){_iterator51.e(err);}finally{_iterator51.f();}_b[_x98]=_d3>1?Ap(_t110,_t110.length,0,_d3-1,_d3):_t110;}_x98++;}break;default:throw new Error(\"Event overlap type [\".concat(_u10,\"] is unknown or unsupported for cluster matrix generation\"));}}break;default:throw new Error(\"Cluster distance function [\".concat(_s28,\"] is unknown or unsupported for subregion cluster matrix construction\"));}break;case\"DBSCAN\":if(\"Euclidean\"!==_s28)throw new Error(\"Cluster distance function [\".concat(_s28,\"] is unknown or unsupported for subregion cluster matrix construction\"));_3=function _3(t,e){return Math.hypot.apply(Math,_toConsumableArray(Object.keys(t).map(function(n){return e[n]-t[n];})));};for(var _t111=0;_t111<_y;++_t111){var _o40=p[_t111],_s38=_o40.strand,_l10=_o40.to-_o40.from,_g4=_o40.from-_o40.chrOffset,_6=_o40.to-_o40.chrOffset,_v4=_o40.methylationOffsets;if(!(_l10<_h7||_l10>_c4)&&(!_f5||_f5.includes(_s38)))switch(_u10){case\"Full viewport\":if(_g4<_r53&&_6>_i34){if(_w.push(_o40.readName),_m){var _t112=new Array(_m);for(var _e114=0;_e114<_m;_e114++)_t112[_e114]=0;var _e115=_r53-_g4,_n97=_e115+_m;var _iterator52=_createForOfIteratorHelper(_v4),_step52;try{for(_iterator52.s();!(_step52=_iterator52.n()).done;){var _r78=_step52.value;var _i47=_r78.offsets,_o41=_r78.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_r78.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_r78.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_r78.unmodifiedBase)for(var _r79=0;_r79<_i47.length;_r79++){var _s39=_i47[_r79],_a20=_o41[_r79];_s39>=_e115&&_s39<=_n97&&(_t112[_s39-_e115]=parseInt(_a20));}}}catch(err){_iterator52.e(err);}finally{_iterator52.f();}_b[_x98]=_d3>1?Ap(_t112,_t112.length,0,_d3-1,_d3):_t112;}_x98++;}break;case\"Full subregion\":if(_g4<_e79&&_6>_n54){if(_w.push(_o40.readName),_m){var _t113=new Array(_m);for(var _e116=0;_e116<_m;_e116++)_t113[_e116]=-255;var _e117=_r53-_g4;if(_g4<_r53&&_6>_i34)for(var _e118=0;_e118<_m;_e118++)_t113[_e118]=0;else if(_g4>=_r53&&_6>_i34)for(var _n98=_e117;_n98<_m;_n98++)_t113[_n98]=0;else if(_g4>=_r53&&_6<=_i34){var _n99=_m-(_i34-_6);for(var _r80=_e117;_r80<_n99;_r80++)_t113[_r80]=0;}var _iterator53=_createForOfIteratorHelper(_v4),_step53;try{for(_iterator53.s();!(_step53=_iterator53.n()).done;){var _n100=_step53.value;var _r81=_n100.offsets,_i48=_n100.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n100.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n100.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n100.unmodifiedBase)for(var _n101=0;_n101<_r81.length;_n101++){var _o42=_r81[_n101]-_e117,_s40=_i48[_n101];_o42>=0&&_o42<_m&&(_t113[_o42]=parseInt(_s40));}}}catch(err){_iterator53.e(err);}finally{_iterator53.f();}_b[_x98]=_d3>1?Ap(_t113,_t113.length,0,_d3-1,_d3):_t113;}_x98++;}break;case\"Partial subregion\":if(_g4<_e79&&_6>_n54){if(_w.push(_o40.readName),_m){var _t114=new Array(_m);for(var _e119=0;_e119<_m;_e119++)_t114[_e119]=-255;var _e120=_r53-_g4;if(_g4<_r53&&_6>_i34)for(var _e121=0;_e121<_m;_e121++)_t114[_e121]=0;else if(_g4>=_r53&&_6>_i34)for(var _n102=_e120;_n102<_m;_n102++)_t114[_n102]=0;else if(_g4>=_r53&&_6<=_i34){var _n103=_m-(_i34-_6);for(var _r82=_e120;_r82<_n103;_r82++)_t114[_r82]=0;}var _iterator54=_createForOfIteratorHelper(_v4),_step54;try{for(_iterator54.s();!(_step54=_iterator54.n()).done;){var _n104=_step54.value;var _r83=_n104.offsets,_i49=_n104.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n104.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n104.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n104.unmodifiedBase)for(var _n105=0;_n105<_r83.length;_n105++){var _o43=_r83[_n105]-_e120,_s41=_i49[_n105];_o43>=0&&_o43<_m&&(_t114[_o43]=parseInt(_s41));}}}catch(err){_iterator54.e(err);}finally{_iterator54.f();}_b[_x98]=_d3>1?Ap(_t114,_t114.length,0,_d3-1,_d3):_t114;}_x98++;}else if(_g4>=_e79&&_6<=_n54){if(_w.push(_o40.readName),_m){var _t115=new Array(_m);for(var _e122=0;_e122<_m;_e122++)_t115[_e122]=-255;var _e123=_r53-_g4;if(_g4<_r53&&_6>_i34)for(var _e124=0;_e124<_m;_e124++)_t115[_e124]=0;else if(_g4>=_r53&&_6>_i34)for(var _n106=_e123;_n106<_m;_n106++)_t115[_n106]=0;else if(_g4>=_r53&&_6<=_i34){var _n107=_m-(_i34-_6);for(var _r84=_e123;_r84<_n107;_r84++)_t115[_r84]=0;}var _iterator55=_createForOfIteratorHelper(_v4),_step55;try{for(_iterator55.s();!(_step55=_iterator55.n()).done;){var _n108=_step55.value;var _r85=_n108.offsets,_i50=_n108.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n108.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n108.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n108.unmodifiedBase)for(var _n109=0;_n109<_r85.length;_n109++){var _o44=_r85[_n109]-_e123,_s42=_i50[_n109];_o44>=0&&_o44<_m&&(_t115[_o44]=parseInt(_s42));}}}catch(err){_iterator55.e(err);}finally{_iterator55.f();}_b[_x98]=_d3>1?Ap(_t115,_t115.length,0,_d3-1,_d3):_t115;}_x98++;}else if(_g4<_e79&&_6<=_n54&&_6>_e79){if(_w.push(_o40.readName),_m){var _t116=new Array(_m);for(var _e125=0;_e125<_m;_e125++)_t116[_e125]=-255;var _e126=_r53-_g4;if(_g4<_r53&&_6>_i34)for(var _e127=0;_e127<_m;_e127++)_t116[_e127]=0;else if(_g4>=_r53&&_6>_i34)for(var _n110=_e126;_n110<_m;_n110++)_t116[_n110]=0;else if(_g4>=_r53&&_6<=_i34){var _n111=_m-(_i34-_6);for(var _r86=_e126;_r86<_n111;_r86++)_t116[_r86]=0;}var _iterator56=_createForOfIteratorHelper(_v4),_step56;try{for(_iterator56.s();!(_step56=_iterator56.n()).done;){var _n112=_step56.value;var _r87=_n112.offsets,_i51=_n112.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n112.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n112.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n112.unmodifiedBase)for(var _n113=0;_n113<_r87.length;_n113++){var _o45=_r87[_n113]-_e126,_s43=_i51[_n113];_o45>=0&&_o45<_m&&(_t116[_o45]=parseInt(_s43));}}}catch(err){_iterator56.e(err);}finally{_iterator56.f();}_b[_x98]=_d3>1?Ap(_t116,_t116.length,0,_d3-1,_d3):_t116;}_x98++;}else if(_g4>=_e79&&_g4<_n54&&_6>_n54){if(_w.push(_o40.readName),_m){var _t117=new Array(_m);for(var _e128=0;_e128<_m;_e128++)_t117[_e128]=-255;var _e129=_r53-_g4;if(_g4<_r53&&_6>_i34)for(var _e130=0;_e130<_m;_e130++)_t117[_e130]=0;else if(_g4>=_r53&&_6>_i34)for(var _n114=_e129;_n114<_m;_n114++)_t117[_n114]=0;else if(_g4>=_r53&&_6<=_i34){var _n115=_m-(_i34-_6);for(var _r88=_e129;_r88<_n115;_r88++)_t117[_r88]=0;}var _iterator57=_createForOfIteratorHelper(_v4),_step57;try{for(_iterator57.s();!(_step57=_iterator57.n()).done;){var _n116=_step57.value;var _r89=_n116.offsets,_i52=_n116.probabilities;if(_a18.includes(\"m6A+\")&&\"A\"===_n116.unmodifiedBase||_a18.includes(\"m6A-\")&&\"T\"===_n116.unmodifiedBase||_a18.includes(\"5mC\")&&\"C\"===_n116.unmodifiedBase)for(var _n117=0;_n117<_r89.length;_n117++){var _o46=_r89[_n117]-_e129,_s44=_i52[_n117];_o46>=0&&_o46<_m&&(_t117[_o46]=parseInt(_s44));}}}catch(err){_iterator57.e(err);}finally{_iterator57.f();}_b[_x98]=_d3>1?Ap(_t117,_t117.length,0,_d3-1,_d3):_t117;}_x98++;}break;default:throw new Error(\"Event overlap type [\".concat(_u10,\"] is unknown or unsupported for cluster matrix generation\"));}}break;default:throw new Error(\"Cluster method [\".concat(_o25,\"] is unknown or unsupported for subregion cluster matrix construction\"));}return _b.length>0&&(g={reducedEventViewportSignal:_b,reducedEventPerVectorLength:_v,identifiers:_w}),{uid:l.uid,signalMatrices:g};}},Ap=function Ap(t,e,n,r,i){void 0===r&&(r=0),void 0===i&&(i=1);var o=[];for(var _s45=0;_s45<e;_s45+=i){var _i53=t.slice(Math.max(_s45-n,0),Math.min(_s45+r+1,e)).map(function(t){return isNaN(t)||t<0?-255:t;}),_a21=Math.max.apply(Math,_toConsumableArray(_i53));o.push(_a21);}return o;},Ep={init:function init(t,e,r,i,o,s,a,u){if(Qd[t]=a?_objectSpread(_objectSpread({},hp),a):hp,i&&o){var _t120=new yn.kC(i),_e131=new yn.kC(o),_n119=n(496),_r90=_n119.IndexedFasta;op[i]=new _r90({fasta:_t120,fai:_e131});}s&&(ep[s]=ep[s]||new Promise(function(t){!function(t,e){var n={absToChr:function absToChr(t){return n.chrPositions?function(t,e){if(!e||!e.cumPositions||!e.cumPositions.length)return null;var n=_n(e.cumPositions,t);var r=e.cumPositions[e.cumPositions.length-1].chr,i=e.chromLengths[r];n-=n>0&&1;var o=Math.floor(t-e.cumPositions[n].pos),s=0;return o<0&&(s=o-1,o=1),n===e.cumPositions.length-1&&o>i&&(s=o-i,o=i),[e.cumPositions[n].chr,o,s,n];}(t,n):null;},chrToAbs:function chrToAbs(){var _ref29=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[],_ref30=_slicedToArray(_ref29,2),t=_ref30[0],e=_ref30[1];return n.chrPositions?(r=t,i=e,n.chrPositions[r].pos+i):null;var r,i;}};nn(t,function(t,r){if(t)e&&e(null);else{var _t121=mn(gn(r));Object.keys(_t121).forEach(function(e){n[e]=_t121[e];}),e&&e(n);}});}(s,t);})),Kd[e]||(Kd[e]=new Ie({bamUrl:e,baiUrl:r}),Jd[e]=Kd[e].getHeader({assemblyName:\"hg38\"})),ap[t]={bamUrl:e,fastaUrl:i,chromSizesUrl:s},up[t]=u;},serverInit:function serverInit(t,e,n,r){tp[t]={server:e,tilesetUid:n,authHeader:r};},tilesetInfo:cp,serverTilesetInfo:function serverTilesetInfo(t){return lp(\"\".concat(tp[t].server,\"/tileset_info/?d=\").concat(tp[t].tilesetUid),t).then(function(t){return t.json();}).then(function(e){var n=e[tp[t].tilesetUid];return ip[t]=n,n;});},serverFetchTilesDebounced:function(){var _serverFetchTilesDebounced=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee68(t,e){var n,r,i,_iterator59,_step59,_loop6,o;return _regeneratorRuntime().wrap(function _callee68$(_context72){while(1)switch(_context72.prev=_context72.next){case 0:n=tp[t],r={},i=[];_iterator59=_createForOfIteratorHelper(e);_context72.prev=2;_loop6=/*#__PURE__*/_regeneratorRuntime().mark(function _loop6(){var n,_n$split,_n$split2,e,o,s,a,_dp,_dp2,u,l,_i54;return _regeneratorRuntime().wrap(function _loop6$(_context71){while(1)switch(_context71.prev=_context71.next){case 0:n=_step59.value;_n$split=n.split(\".\"),_n$split2=_slicedToArray(_n$split,2),e=_n$split2[0],o=_n$split2[1];s=ip[t];a=!1;_dp=dp(s,e,o),_dp2=_slicedToArray(_dp,2),u=_dp2[0],l=_dp2[1];case 5:if(!(e>0)){_context71.next=13;break;}_i54=\"\".concat(t,\".\").concat(e,\".\").concat(o);if(!rp.has(_i54)){_context71.next=10;break;}r[n]=rp.get(_i54).filter(function(t){return u<t.to&&l>t.from;}),r[n].tilePositionId=n,rp.set(\"\".concat(t,\".\").concat(n),r[n]),a=!0;return _context71.abrupt(\"break\",13);case 10:e-=1,o=Math.floor(o/2);case 11:_context71.next=5;break;case 13:a||i.push(n);case 14:case\"end\":return _context71.stop();}},_loop6);});_iterator59.s();case 5:if((_step59=_iterator59.n()).done){_context72.next=9;break;}return _context72.delegateYield(_loop6(),\"t0\",7);case 7:_context72.next=5;break;case 9:_context72.next=14;break;case 11:_context72.prev=11;_context72.t1=_context72[\"catch\"](2);_iterator59.e(_context72.t1);case 14:_context72.prev=14;_iterator59.f();return _context72.finish(14);case 17:o=i.map(function(t){return\"d=\".concat(n.tilesetUid,\".\").concat(t);});return _context72.abrupt(\"return\",lp(\"\".concat(tp[t].server,\"/tiles/?\").concat(o.join(\"&\")),t).then(function(t){return t.json();}).then(function(i){var o={};var _iterator60=_createForOfIteratorHelper(e),_step60;try{for(_iterator60.s();!(_step60=_iterator60.n()).done;){var _r91=_step60.value;var _e132=\"\".concat(t,\".\").concat(_r91),_s46=\"\".concat(n.tilesetUid,\".\").concat(_r91);if(i[_s46]){var _t122=i[_s46];i[_s46].error||(_t122=Xd(i[_s46])),_t122.tilePositionId=_r91,o[_r91]=_t122,rp.set(_e132,_t122);}}}catch(err){_iterator60.e(err);}finally{_iterator60.f();}return _objectSpread(_objectSpread({},r),o);}));case 19:case\"end\":return _context72.stop();}},_callee68,null,[[2,11,14,17]]);}));function serverFetchTilesDebounced(_x99,_x100){return _serverFetchTilesDebounced.apply(this,arguments);}return serverFetchTilesDebounced;}(),fetchTilesDebounced:function(){var _fetchTilesDebounced=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee69(t,e){var n,r,i,_iterator61,_step61,_n120,_e134,_o47,_s47;return _regeneratorRuntime().wrap(function _callee69$(_context73){while(1)switch(_context73.prev=_context73.next){case 0:n={},r=[],i=[];_iterator61=_createForOfIteratorHelper(e);try{for(_iterator61.s();!(_step61=_iterator61.n()).done;){_n120=_step61.value;_e134=_n120.split(\".\"),_o47=parseInt(_e134[0],10),_s47=parseInt(_e134[1],10);Number.isNaN(_s47)||Number.isNaN(_o47)?console.warn(\"Invalid tile zoom or position:\",_o47,_s47):(r.push(_n120),i.push(fp(t,_o47,_s47)));}}catch(err){_iterator61.e(err);}finally{_iterator61.f();}return _context73.abrupt(\"return\",Promise.all(i).then(function(t){for(var _e133=0;_e133<t.length;_e133++){var _i55=r[_e133];n[_i55]=t[_e133],n[_i55].tilePositionId=_i55;}return n;}));case 4:case\"end\":return _context73.stop();}},_callee69);}));function fetchTilesDebounced(_x101,_x102){return _fetchTilesDebounced.apply(this,arguments);}return fetchTilesDebounced;}(),tile:fp,cleanup:function cleanup(){console.log(\"[higlass-pileup] deleting data in the Dedicated Worker\"),Object.keys(Kd).forEach(function(t){return delete Kd[t];}),Object.keys(Jd).forEach(function(t){return delete Jd[t];}),Object.keys(Qd).forEach(function(t){return delete Qd[t];}),Object.keys(tp).forEach(function(t){return delete tp[t];}),Object.keys(ep).forEach(function(t){return delete ep[t];}),Object.keys(np).forEach(function(t){return delete np[t];}),Object.keys(rp).forEach(function(t){return delete rp[t];}),Object.keys(ip).forEach(function(t){return delete ip[t];}),Object.keys(ap).forEach(function(t){return delete ap[t];}),Object.keys(up).forEach(function(t){return delete up[t];});},renderSegments:function renderSegments(t,e,n,r,i,o,s,a,u,l,h,f,d){var p={},_={};var m,v={},y=null;var _iterator62=_createForOfIteratorHelper(n),_step62;try{for(_iterator62.s();!(_step62=_iterator62.n()).done;){var _Z=_step62.value;var _W=null;try{if(_W=rp.get(\"\".concat(e,\".\").concat(_Z)),_W.error)continue;}catch(Y){continue;}if(!_W)continue;if(u.methylation&&l){var _iterator88=_createForOfIteratorHelper(_W),_step88;try{for(_iterator88.s();!(_step88=_iterator88.n()).done;){var _V=_step88.value;var _iterator89=_createForOfIteratorHelper(_V.methylationOffsets),_step89;try{for(_iterator89.s();!(_step89=_iterator89.n()).done;){var _X=_step89.value;\"C\"===_X.unmodifiedBase&&\"-\"===_V.strand&&(_X.offsets=_X.offsets.map(function(t){return t-1;}));}}catch(err){_iterator89.e(err);}finally{_iterator89.f();}}}catch(err){_iterator88.e(err);}finally{_iterator88.f();}}var _iterator90=_createForOfIteratorHelper(_W),_step90;try{for(_iterator90.s();!(_step90=_iterator90.n()).done;){var _K=_step90.value;p[_K.id]=_K;}}catch(err){_iterator90.e(err);}finally{_iterator90.f();}var _G=sp.get(\"\".concat(e,\".\").concat(_Z));if(_G&&u.methylation&&u.methylation.highlights){var _J=Object.keys(u.methylation.highlights);var _iterator91=_createForOfIteratorHelper(_G),_step91;try{for(_iterator91.s();!(_step91=_iterator91.n()).done;){var _Q=_step91.value;var _tt=parseInt(_Q.start)+parseInt(_Q.chromOffset),_et=_Q.data.toUpperCase();var _iterator92=_createForOfIteratorHelper(_J),_step92;try{for(_iterator92.s();!(_step92=_iterator92.n()).done;){var _nt=_step92.value;if(\"M0A\"!==_nt){var _rt=_nt.toUpperCase(),_it=_nt.length;var _ot=_et.indexOf(_rt);for(!xp(_)&&_[_nt]||(_[_nt]=new Array());_ot>-1;)_[_nt].push(_ot+_tt+1),_ot=_et.indexOf(_rt,_ot+_it);}else if(\"M0A\"===_nt){var _st=_et.indexOf(\"A\"),_at=_et.indexOf(\"T\"),_ut=Math.min(_st,_at);for(!xp(_)&&_[_nt]||(_[_nt]=new Array());_ut>-1;)_[_nt].push(_ut+_tt+1),_st=_et.indexOf(\"A\",_ut+1),_at=_et.indexOf(\"T\",_ut+1),_ut=-1!==_st&&-1!==_at?Math.min(_st,_at):-1===_st?_at:-1===_at?_st:-1;y=new Set(_toConsumableArray(_[_nt]));}}}catch(err){_iterator92.e(err);}finally{_iterator92.f();}}}catch(err){_iterator91.e(err);}finally{_iterator91.f();}}}}catch(err){_iterator62.e(err);}finally{_iterator62.f();}var b=Object.values(p);var w=_defineProperty({},h,{methylation:[],fire:[],indexDHS:[]}),x=Object.hasOwn(Qd[e],x)?Qd[e].fiberMinLength:0,k=Object.hasOwn(Qd[e],k)?Qd[e].fiberMaxLength:3e4,A=Object.hasOwn(Qd[e],A)?Qd[e].fiberStrands:[\"+\",\"-\"];if(u.minMappingQuality>0&&(b=b.filter(function(t){return t.mapq>=u.minMappingQuality;})),function(t,e){var n=e.outlineMateOnHover,r=e.highlightReadsBy.includes(\"insertSize\"),i=e.highlightReadsBy.includes(\"pairOrientation\"),o=e.highlightReadsBy.includes(\"insertSizeAndPairOrientation\");var s;if(!(r||i||o))return n?void Vd(t):void 0;s=Vd(t),Object.entries(s).forEach(function(_ref31){var _ref32=_slicedToArray(_ref31,2),t=_ref32[0],n=_ref32[1];if(2===n.length){var _t123=n[0],_u11=n[1];_t123.colorOverride=null,_u11.colorOverride=null;var _l11=(a=_u11,(s=_t123).from<a.from?Math.max(0,a.from-s.to):Math.max(0,s.from-a.to)),_h8=e.largeInsertSizeThreshold&&_l11>e.largeInsertSizeThreshold,_c5=e.smallInsertSizeThreshold&&_l11<e.smallInsertSizeThreshold,_f6=\"+\"===_t123.strand&&\"+\"===_u11.strand,_d4=\"-\"===_t123.strand&&\"-\"===_u11.strand,_p3=_t123.from<_u11.from&&\"-\"===_t123.strand;r&&(_h8?_t123.colorOverride=Re.LARGE_INSERT_SIZE:_c5&&(_t123.colorOverride=Re.SMALL_INSERT_SIZE)),(i||o&&(_h8||_c5))&&(_f6?(_t123.colorOverride=Re.LL,_t123.mappingOrientation=\"++\"):_d4?(_t123.colorOverride=Re.RR,_t123.mappingOrientation=\"--\"):_p3&&(_t123.colorOverride=Re.RL,_t123.mappingOrientation=\"-+\")),_u11.colorOverride=_t123.colorOverride,_u11.mappingOrientation=_t123.mappingOrientation;}var s,a;});}(b,u),Pe(u)&&!f){var _lt=Number.MAX_VALUE,_ht=-Number.MAX_VALUE;var _ct=ip[e];var _iterator63=_createForOfIteratorHelper(n),_step63;try{for(_iterator63.s();!(_step63=_iterator63.n()).done;){var _ft=_step63.value;var _dt=_ft.split(\".\")[0],_pt=_ft.split(\".\")[1],_gt=dp(_ct,+_dt,+_pt);_lt=Math.min(_lt,_gt[0]),_ht=Math.max(_ht,_gt[1]);}}catch(err){_iterator63.e(err);}finally{_iterator63.f();}b=b.filter(function(t){return t.to>=_lt&&t.from<=_ht;});}var _ref33=[Number.MAX_VALUE,-Number.MAX_VALUE],E=_ref33[0],S=_ref33[1];for(var _t124=0;_t124<b.length;_t124++)b[_t124].from<E&&(E=b[_t124].from),b[_t124].to>S&&(S=b[_t124].to);var M=null;if(Wd){var _mt=u&&u.groupBy;_mt=_mt||null,M=Wd(b,_mt);}else M={\"null\":b};var B=null;if(f&&u.methylation){var _vt=f,_yt=_vt.range.left.start,_bt=_vt.range.right.stop,_wt=_vt.viewportRange.left.start,_xt=_vt.viewportRange.right.stop,_kt=_vt.method,_At=_vt.distanceFn,_Et=_vt.eventCategories,_St=(_vt.linkage,_vt.epsilon),_Mt=_vt.minimumPoints,_Bt={min:_vt.probabilityThresholdRange[0],max:_vt.probabilityThresholdRange[1]},_Tt=_vt.eventOverlapType,_zt=_vt.filterFiberMinLength,_Ct=_vt.filterFiberMaxLength,_Nt=_vt.filterFiberStrands;Math.floor(_vt.basesPerPixel),_vt.viewportWidthInPixels;var _It=null;var _Ot=_bt-_yt,_Rt=b.length,_Lt=new Array(),_jt=new Array();var _Pt=0;var _Dt={};switch(_kt){case\"AGNES\":switch(_At){case\"Euclidean\":_It=vn.WI;for(var _Ft=0;_Ft<_Rt;++_Ft){var _$t=b[_Ft],_Ht=_$t.strand,_qt=_$t.to-_$t.from,_Zt=new Array(_Ot).fill(-255),_Wt=_$t.from-_$t.chrOffset,_Yt=_$t.to-_$t.chrOffset,_Vt=_$t.methylationOffsets;if(!(_qt<_zt||_qt>_Ct)&&(!_Nt||_Nt.includes(_Ht)))switch(_Tt){case\"Full viewport\":if(_Wt<_wt&&_Yt>_xt){var _Xt=_yt-_Wt,_Kt=_Xt+_Ot;var _iterator64=_createForOfIteratorHelper(_Vt),_step64;try{for(_iterator64.s();!(_step64=_iterator64.n()).done;){var _Qt=_step64.value;var _te=_Qt.offsets,_ee=_Qt.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_Qt.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_Qt.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_Qt.unmodifiedBase)for(var _ne=0;_ne<_te.length;_ne++){var _re=_te[_ne],_ie=_ee[_ne];_re>=_Xt&&_re<=_Kt&&_Bt.min<=_ie&&_Bt.max>=_ie&&(_Zt[_re-_Xt]=parseInt(_ie));}}}catch(err){_iterator64.e(err);}finally{_iterator64.f();}_Dt[_Pt]=_Ft,_Lt[_Pt]=_Zt,_jt.push(_$t.readName),_Pt++;}break;case\"Full subregion\":if(_Wt<_yt&&_Yt>_bt){var _oe=_yt-_Wt,_se=_oe+_Ot;var _iterator65=_createForOfIteratorHelper(_Vt),_step65;try{for(_iterator65.s();!(_step65=_iterator65.n()).done;){var _ae=_step65.value;var _ue=_ae.offsets,_le3=_ae.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_ae.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_ae.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_ae.unmodifiedBase)for(var _he=0;_he<_ue.length;_he++){var _ce=_ue[_he],_fe=_le3[_he];_ce>=_oe&&_ce<=_se&&_Bt.min<=_fe&&_Bt.max>=_fe&&(_Zt[_ce-_oe]=parseInt(_fe));}}}catch(err){_iterator65.e(err);}finally{_iterator65.f();}_Dt[_Pt]=_Ft,_Lt[_Pt]=_Zt,_jt.push(_$t.readName),_Pt++;}break;case\"Partial subregion\":if(_Wt<_yt&&_Yt>_bt){var _de=_yt-_Wt,_pe=_de+_Ot;var _iterator66=_createForOfIteratorHelper(_Vt),_step66;try{for(_iterator66.s();!(_step66=_iterator66.n()).done;){var _ge=_step66.value;var _e135=_ge.offsets,_me=_ge.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_ge.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_ge.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_ge.unmodifiedBase)for(var _ve=0;_ve<_e135.length;_ve++){var _ye=_e135[_ve],_be=_me[_ve];_ye>=_de&&_ye<=_pe&&_Bt.min<=_be&&_Bt.max>=_be&&(_Zt[_ye-_de]=parseInt(_be));}}}catch(err){_iterator66.e(err);}finally{_iterator66.f();}_Dt[_Pt]=_Ft,_Lt[_Pt]=_Zt,_jt.push(_$t.readName),_Pt++;}else if(_Wt>=_yt&&_Yt<=_bt){var _we=_Wt-_yt;var _iterator67=_createForOfIteratorHelper(_Vt),_step67;try{for(_iterator67.s();!(_step67=_iterator67.n()).done;){var _xe2=_step67.value;var _ke=_xe2.offsets,_Ae=_xe2.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_xe2.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_xe2.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_xe2.unmodifiedBase)for(var _Ee=0;_Ee<_ke.length;_Ee++){var _Se=_ke[_Ee],_Me=parseInt(_Ae[_Ee]);_we+_Se<_Ot&&_Bt.min<=_Me&&_Bt.max>=_Me&&(_Zt[_we+_Se]=_Me);}}}catch(err){_iterator67.e(err);}finally{_iterator67.f();}_Dt[_Pt]=_Ft,_Lt[_Pt]=_Zt,_jt.push(_$t.readName),_Pt++;}else if(_Wt<_yt&&_Yt<=_bt&&_Yt>_yt){var _Be=_yt-_Wt,_Te=_Yt-_Wt;var _iterator68=_createForOfIteratorHelper(_Vt),_step68;try{for(_iterator68.s();!(_step68=_iterator68.n()).done;){var _ze=_step68.value;var _Ce=_ze.offsets,_Ne=_ze.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_ze.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_ze.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_ze.unmodifiedBase)for(var _Ie=0;_Ie<_Ce.length;_Ie++){var _Oe=_Ce[_Ie],_Le=parseInt(_Ne[_Ie]);_Oe>=_Be&&_Oe<=_Te&&_Bt.min<=_Le&&_Bt.max>=_Le&&(_Zt[_Oe-_Be]=_Le);}}}catch(err){_iterator68.e(err);}finally{_iterator68.f();}_Dt[_Pt]=_Ft,_Lt[_Pt]=_Zt,_jt.push(_$t.readName),_Pt++;}else if(_Wt>=_yt&&_Wt<_bt&&_Yt>_bt){var _Ue=_Wt-_yt,_je=_bt-_Wt+_Ue;var _iterator69=_createForOfIteratorHelper(_Vt),_step69;try{for(_iterator69.s();!(_step69=_iterator69.n()).done;){var _De=_step69.value;var _Fe=_De.offsets,_$e=_De.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_De.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_De.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_De.unmodifiedBase)for(var _He=0;_He<_Fe.length;_He++){var _qe=_Fe[_He],_Ze=parseInt(_$e[_He]);_qe>=_Ue&&_qe<_je&&_Bt.min<=_Ze&&_Bt.max>=_Ze&&(_Zt[_qe]=_Ze);}}}catch(err){_iterator69.e(err);}finally{_iterator69.f();}_Dt[_Pt]=_Ft,_Lt[_Pt]=_Zt,_jt.push(_$t.readName),_Pt++;}break;default:throw new Error(\"Event overlap type [\".concat(_Tt,\"] is unknown or unsupported for cluster matrix generation\"));}}break;case\"Jaccard\":_It=vn.eN;for(var _We=0;_We<_Rt;++_We){var _Ge=b[_We],_Ye=_Ge.strand,_Ve=_Ge.to-_Ge.from,_Xe=new Array(_Ot).fill(0),_Ke=_Ge.from-_Ge.chrOffset,_Je=_Ge.to-_Ge.chrOffset,_Qe=_Ge.methylationOffsets;if(!(_Ve<_zt||_Ve>_Ct)&&(!_Nt||_Nt.includes(_Ye)))switch(_Tt){case\"Full viewport\":if(_Ke<_wt&&_Je>_xt){var _tn=_yt-_Ke,_en=_tn+_Ot;var _iterator70=_createForOfIteratorHelper(_Qe),_step70;try{for(_iterator70.s();!(_step70=_iterator70.n()).done;){var _nn=_step70.value;var _rn=_nn.offsets,_on=_nn.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_nn.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_nn.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_nn.unmodifiedBase)for(var _sn=0;_sn<_rn.length;_sn++){var _an=_rn[_sn],_un=_on[_sn];_an>=_tn&&_an<=_en&&_Bt.min<=_un&&_Bt.max>=_un&&(_Xe[_an-_tn]=1);}}}catch(err){_iterator70.e(err);}finally{_iterator70.f();}_Dt[_Pt]=_We,_Lt[_Pt]=_Xe,_jt.push(_Ge.readName),_Pt++;}break;case\"Full subregion\":if(_Ke<_yt&&_Je>_bt){var _ln=_yt-_Ke,_hn=_ln+_Ot;var _iterator71=_createForOfIteratorHelper(_Qe),_step71;try{for(_iterator71.s();!(_step71=_iterator71.n()).done;){var _cn=_step71.value;var _fn=_cn.offsets,_dn=_cn.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_cn.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_cn.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_cn.unmodifiedBase)for(var _pn=0;_pn<_fn.length;_pn++){var _gn=_fn[_pn],_n121=_dn[_pn];_gn>=_ln&&_gn<=_hn&&_Bt.min<=_n121&&_Bt.max>=_n121&&(_Xe[_gn-_ln]=1);}}}catch(err){_iterator71.e(err);}finally{_iterator71.f();}_Dt[_Pt]=_We,_Lt[_Pt]=_Xe,_jt.push(_Ge.readName),_Pt++;}break;case\"Partial subregion\":if(_Ke<_yt&&_Je>_bt){var _mn=_yt-_Ke,_yn=_mn+_Ot;var _iterator72=_createForOfIteratorHelper(_Qe),_step72;try{for(_iterator72.s();!(_step72=_iterator72.n()).done;){var _bn=_step72.value;var _wn=_bn.offsets,_xn=_bn.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_bn.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_bn.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_bn.unmodifiedBase)for(var _kn=0;_kn<_wn.length;_kn++){var _An=_wn[_kn],_En=_xn[_kn];_An>=_mn&&_An<=_yn&&_Bt.min<=_En&&_Bt.max>=_En&&(_Xe[_An-_mn]=1);}}}catch(err){_iterator72.e(err);}finally{_iterator72.f();}_Dt[_Pt]=_We,_Lt[_Pt]=_Xe,_jt.push(_Ge.readName),_Pt++;}else if(_Ke>=_yt&&_Je<=_bt){var _Sn=_Ke-_yt;var _iterator73=_createForOfIteratorHelper(_Qe),_step73;try{for(_iterator73.s();!(_step73=_iterator73.n()).done;){var _Mn=_step73.value;var _Bn=_Mn.offsets,_Tn=_Mn.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_Mn.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_Mn.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_Mn.unmodifiedBase)for(var _zn=0;_zn<_Bn.length;_zn++){var _Cn=_Bn[_zn],_Nn=parseInt(_Tn[_zn]);_Sn+_Cn<_Ot&&_Bt.min<=_Nn&&_Bt.max>=_Nn&&(_Xe[_Sn+_Cn]=1);}}}catch(err){_iterator73.e(err);}finally{_iterator73.f();}_Dt[_Pt]=_We,_Lt[_Pt]=_Xe,_jt.push(_Ge.readName),_Pt++;}else if(_Ke<_yt&&_Je<=_bt&&_Je>_yt){var _In=_yt-_Ke,_On=_Je-_Ke;var _iterator74=_createForOfIteratorHelper(_Qe),_step74;try{for(_iterator74.s();!(_step74=_iterator74.n()).done;){var _Rn=_step74.value;var _Ln=_Rn.offsets,_Un=_Rn.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_Rn.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_Rn.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_Rn.unmodifiedBase)for(var _jn=0;_jn<_Ln.length;_jn++){var _Pn=_Ln[_jn],_Dn=parseInt(_Un[_jn]);_Pn>=_In&&_Pn<=_On&&_Bt.min<=_Dn&&_Bt.max>=_Dn&&(_Xe[_Pn-_In]=1);}}}catch(err){_iterator74.e(err);}finally{_iterator74.f();}_Dt[_Pt]=_We,_Lt[_Pt]=_Xe,_jt.push(_Ge.readName),_Pt++;}else if(_Ke>=_yt&&_Ke<_bt&&_Je>_bt){var _Fn=_Ke-_yt,_$n=_bt-_Ke+_Fn;var _iterator75=_createForOfIteratorHelper(_Qe),_step75;try{for(_iterator75.s();!(_step75=_iterator75.n()).done;){var _Hn=_step75.value;var _qn=_Hn.offsets,_Zn=_Hn.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_Hn.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_Hn.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_Hn.unmodifiedBase)for(var _Wn=0;_Wn<_qn.length;_Wn++){var _Gn=_qn[_Wn],_Yn=parseInt(_Zn[_Wn]);_Gn>=_Fn&&_Gn<_$n&&_Bt.min<=_Yn&&_Bt.max>=_Yn&&(_Xe[_Gn]=1);}}}catch(err){_iterator75.e(err);}finally{_iterator75.f();}_Dt[_Pt]=_We,_Lt[_Pt]=_Xe,_jt.push(_Ge.readName),_Pt++;}break;default:throw new Error(\"Event overlap type [\".concat(_Tt,\"] is unknown or unsupported for cluster matrix generation\"));}}break;default:throw new Error(\"Cluster distance function [\".concat(_At,\"] is unknown or unsupported for subregion cluster matrix construction\"));}break;case\"DBSCAN\":if(\"Euclidean\"!==_At)throw new Error(\"Cluster distance function [\".concat(_At,\"] is unknown or unsupported for subregion cluster matrix construction\"));_It=function _It(t,e){return Math.hypot.apply(Math,_toConsumableArray(Object.keys(t).map(function(n){return e[n]-t[n];})));};for(var _Vn=0;_Vn<_Rt;++_Vn){var _Xn=b[_Vn],_Kn=_Xn.strand,_Jn=_Xn.to-_Xn.from,_Qn=new Array(_Ot).fill(-255),_tr=_Xn.from-_Xn.chrOffset,_er=_Xn.to-_Xn.chrOffset,_nr=_Xn.methylationOffsets;if(!(_Jn<_zt||_Jn>_Ct)&&(!_Nt||_Nt.includes(_Kn)))switch(_Tt){case\"Full viewport\":if(_tr<_wt&&_er>_xt){var _rr=_yt-_tr,_ir=_rr+_Ot;var _iterator76=_createForOfIteratorHelper(_nr),_step76;try{for(_iterator76.s();!(_step76=_iterator76.n()).done;){var _or=_step76.value;var _sr=_or.offsets,_ar=_or.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_or.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_or.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_or.unmodifiedBase)for(var _ur=0;_ur<_sr.length;_ur++){var _lr=_sr[_ur],_hr=_ar[_ur];_lr>=_rr&&_lr<=_ir&&_Bt.min<=_hr&&_Bt.max>=_hr&&(_Qn[_lr-_rr]=parseInt(_hr));}}}catch(err){_iterator76.e(err);}finally{_iterator76.f();}_Dt[_Pt]=_Vn,_Lt[_Pt]=_Qn,_jt.push(_Xn.readName),_Pt++;}break;case\"Full subregion\":if(_tr<_yt&&_er>_bt){var _cr=_yt-_tr,_fr=_cr+_Ot;var _iterator77=_createForOfIteratorHelper(_nr),_step77;try{for(_iterator77.s();!(_step77=_iterator77.n()).done;){var _dr=_step77.value;var _pr=_dr.offsets,_gr=_dr.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_dr.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_dr.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_dr.unmodifiedBase)for(var _r92=0;_r92<_pr.length;_r92++){var _mr=_pr[_r92],_vr=_gr[_r92];_mr>=_cr&&_mr<=_fr&&_Bt.min<=_vr&&_Bt.max>=_vr&&(_Qn[_mr-_cr]=parseInt(_vr));}}}catch(err){_iterator77.e(err);}finally{_iterator77.f();}_Dt[_Pt]=_Vn,_Lt[_Pt]=_Qn,_jt.push(_Xn.readName),_Pt++;}break;case\"Partial subregion\":if(_tr<_yt&&_er>_bt){var _yr=_yt-_tr,_br=_yr+_Ot;var _iterator78=_createForOfIteratorHelper(_nr),_step78;try{for(_iterator78.s();!(_step78=_iterator78.n()).done;){var _wr=_step78.value;var _xr=_wr.offsets,_kr=_wr.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_wr.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_wr.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_wr.unmodifiedBase)for(var _Ar=0;_Ar<_xr.length;_Ar++){var _Er=_xr[_Ar],_Sr=_kr[_Ar];_Er>=_yr&&_Er<=_br&&_Bt.min<=_Sr&&_Bt.max>=_Sr&&(_Qn[_Er-_yr]=parseInt(_Sr));}}}catch(err){_iterator78.e(err);}finally{_iterator78.f();}_Dt[_Pt]=_Vn,_Lt[_Pt]=_Qn,_jt.push(_Xn.readName),_Pt++;}else if(_tr>=_yt&&_er<=_bt){var _Mr=_tr-_yt;var _iterator79=_createForOfIteratorHelper(_nr),_step79;try{for(_iterator79.s();!(_step79=_iterator79.n()).done;){var _Br=_step79.value;var _Tr=_Br.offsets,_zr=_Br.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_Br.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_Br.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_Br.unmodifiedBase)for(var _Cr=0;_Cr<_Tr.length;_Cr++){var _Nr=_Tr[_Cr],_Ir=parseInt(_zr[_Cr]);_Mr+_Nr<_Ot&&_Bt.min<=_Ir&&_Bt.max>=_Ir&&(_Qn[_Mr+_Nr]=_Ir);}}}catch(err){_iterator79.e(err);}finally{_iterator79.f();}_Dt[_Pt]=_Vn,_Lt[_Pt]=_Qn,_jt.push(_Xn.readName),_Pt++;}else if(_tr<_yt&&_er<=_bt&&_er>_yt){var _Or=_yt-_tr,_Rr=_er-_tr;var _iterator80=_createForOfIteratorHelper(_nr),_step80;try{for(_iterator80.s();!(_step80=_iterator80.n()).done;){var _Lr=_step80.value;var _Ur=_Lr.offsets,_jr=_Lr.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_Lr.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_Lr.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_Lr.unmodifiedBase)for(var _Pr=0;_Pr<_Ur.length;_Pr++){var _Dr=_Ur[_Pr],_Fr=parseInt(_jr[_Pr]);_Dr>=_Or&&_Dr<=_Rr&&_Bt.min<=_Fr&&_Bt.max>=_Fr&&(_Qn[_Dr-_Or]=_Fr);}}}catch(err){_iterator80.e(err);}finally{_iterator80.f();}_Dt[_Pt]=_Vn,_Lt[_Pt]=_Qn,_jt.push(_Xn.readName),_Pt++;}else if(_tr>=_yt&&_tr<_bt&&_er>_bt){var _$r=_tr-_yt,_Hr=_bt-_tr+_$r;var _iterator81=_createForOfIteratorHelper(_nr),_step81;try{for(_iterator81.s();!(_step81=_iterator81.n()).done;){var _qr=_step81.value;var _Zr=_qr.offsets,_Wr=_qr.probabilities;if(_Et.includes(\"m6A+\")&&\"A\"===_qr.unmodifiedBase||_Et.includes(\"m6A-\")&&\"T\"===_qr.unmodifiedBase||_Et.includes(\"5mC\")&&\"C\"===_qr.unmodifiedBase)for(var _Gr=0;_Gr<_Zr.length;_Gr++){var _Yr=_Zr[_Gr],_Vr=parseInt(_Wr[_Gr]);_Yr>=_$r&&_Yr<_Hr&&_Bt.min<=_Vr&&_Bt.max>=_Vr&&(_Qn[_Yr]=_Vr);}}}catch(err){_iterator81.e(err);}finally{_iterator81.f();}_Dt[_Pt]=_Vn,_Lt[_Pt]=_Qn,_jt.push(_Xn.readName),_Pt++;}break;default:throw new Error(\"Event overlap type [\".concat(_Tt,\"] is unknown or unsupported for cluster matrix generation\"));}}break;default:throw new Error(\"Cluster method [\".concat(_kt,\"] is unknown or unsupported for subregion cluster matrix construction\"));}if(_Lt.length>0){var _Xr=kp(0,e,n,0,0,0,0,0,u,f).signalMatrices.reducedEventViewportSignal;switch(_kt){case\"AGNES\":var _ref34=(0,vn.eM)({data:_Lt,distance:_It,linkage:vn.bP}),_Kr=_ref34.clusters,_Jr=_ref34.distances,_Qr=_ref34.order,_ti=_ref34.clustersGivenK,_ei=function(t){var e=function e(t,n){var r=\"\";var i=t.children;var o=!1,s=[];for(var _t125=0;_t125<i.length;_t125++)i[_t125].children?r+=e(i[_t125],\":\".concat(i[_t125].height)):(s.push(i[_t125]),o=!0);if(o){r+=\"(\";for(var _t126=0;_t126<s.length;_t126++)for(var _e136=0;_e136<s[_t126].indexes.length;_e136++)r+=\"'\".concat(s[_t126].indexes[_e136],\"':\").concat(s[_t126].height,\",\");r=r.slice(0,-1),r+=\")\",s.length=0;}return\"(\".concat(r).concat(n,\")\");};return e(t,\":\".concat(t.height));}(_Kr),_ni=function(t){var e=[],n=[t];for(;n.length>0;){var _t127=n.pop();_t127.children&&n.push.apply(n,_toConsumableArray(_t127.children)),r=_t127.name,/^[\"|']{0,1}[-]{0,1}\\d{0,}(\\.{0,1}\\d+)[\"|']{0,1}$/.test(r)&&!(r-parseInt(r))&&e.push(parseInt(_t127.name));}var r;return e;}(new qd(_ei).nodes.data).reverse();B={clusters:_Kr,order:_ni,reducedEventViewportSignal:_Xr,newickString:_ei,identifiers:_ni.map(function(t){return _jt[t];})};var _ri=_ni.map(function(t){var e=_Dt[t];return[b[e]];});for(var _i56=0,_Object$keys3=Object.keys(M);_i56<_Object$keys3.length;_i56++){var _si=_Object$keys3[_i56];var _ai=_ri;M[_si]={},M[_si].rows=_ai;}break;case\"DBSCAN\":var _ii=function _ii(t){var e=[],n=[];for(var _r93=0;_r93<t.length;_r93++){var _i57=t[_r93];if(Array.isArray(_i57))n.push(t,_r93),_r93=-1,t=_i57;else for(e.push(_i57);_r93===t.length-1&&n.length;)_r93=n.pop(),t=n.pop();}return e;};var _oi=Zd({dataset:_Lt,epsilon:_St,minimumPoints:_Mt,distanceFunction:_It});if(_oi.clusters.length>0){var _ui=_ii(_oi.clusters.concat(_oi.noise));B={clusters:_oi,order:_ui,reducedEventViewportSignal:_Xr,newickString:null,identifiers:_ui.map(function(t){return _jt[t];})};var _li=_ui.map(function(t){var e=_Dt[t];return[b[e]];});for(var _i58=0,_Object$keys4=Object.keys(M);_i58<_Object$keys4.length;_i58++){var _hi=_Object$keys4[_i58];var _ci=_li;M[_hi]={},M[_hi].rows=_ci;}}else for(var _i59=0,_Object$keys5=Object.keys(M);_i59<_Object$keys5.length;_i59++){var _fi=_Object$keys5[_i59];var _di=gp(M[_fi],{prevRows:a[_fi]&&a[_fi].rows||[]});M[_fi]={},M[_fi].rows=_di;}break;default:throw new Error(\"Cluster method [\".concat(_kt,\"] is unknown or unsupported for subregion clustering\"));}}else for(var _i60=0,_Object$keys6=Object.keys(M);_i60<_Object$keys6.length;_i60++){var _pi=_Object$keys6[_i60];var _gi=gp(M[_pi],{prevRows:a[_pi]&&a[_pi].rows||[]});M[_pi]={},M[_pi].rows=_gi;}}else if(d&&u.fire)for(var _i61=0,_Object$keys7=Object.keys(M);_i61<_Object$keys7.length;_i61++){var _i62=_Object$keys7[_i61];var _mi=gp(M[_i62],{prevRows:a[_i62]&&a[_i62].rows||[],readNamesToFilterOn:d.identifiers||[]});M[_i62]={},M[_i62].rows=_mi;}else for(var _i63=0,_Object$keys8=Object.keys(M);_i63<_Object$keys8.length;_i63++){var _vi=_Object$keys8[_i63];var _yi=gp(M[_vi],{prevRows:a[_vi]&&a[_vi].rows||[]});M[_vi]={},M[_vi].rows=_yi;}var T=Object.values(M).map(function(t){return t.rows.length;}).reduce(function(t,e){return t+e;},0);var z=u.showCoverage?u.coverageHeight:0;var C=g().domain(c(0,T+z)).range([0,s[1]]).paddingInner(.2);var N=0,I=0,O=0;var R=function R(t,e){if(N>_p-2){_p*=2;var _t128=yp;yp=new Float32Array(_p),yp.set(_t128);}return yp[N++]=t,yp[N++]=e,N/2-1;},L=function L(t,e,n){if(O>=vp-3){vp*=2;var _t129=wp;wp=new Int32Array(vp),wp.set(_t129);}wp[O++]=t,wp[O++]=e,wp[O++]=n;},U=function U(t,e,n,r,i){var o=t,s=o+n,a=e,u=e+r,l=R(o,a),h=R(s,a),c=R(o,u),f=R(s,u);(function(t,e){if(I>=mp-4){mp*=2;var _t130=bp;bp=new Float32Array(mp),bp.set(_t130);}for(var _e137=0;_e137<4;_e137++)bp[I++]=t;})(i),L(l,h,c),L(c,f,h);},j=Ut().domain(r).range(i);var P=0;var D=Object.keys(M).sort();var _iterator82=_createForOfIteratorHelper(D),_step82;try{for(_iterator82.s();!(_step82=_iterator82.n()).done;){var _bi=_step82.value;M[_bi].start=C(z),z+=M[_bi].rows.length,M[_bi].end=C(z-1)+C.bandwidth(),C.step(),C.bandwidth(),P+=1;}}catch(err){_iterator82.e(err);}finally{_iterator82.f();}if(U(0,0,s[0],s[1],Re.WHITE),u.showCoverage){var _wi=1e4;m=Math.max(Math.floor((S-E)/_wi),1);var _xi=function(t,e,n){var r={};var i=0;var _ap$t3=ap[t],o=_ap$t3.chromSizesUrl,s=_ap$t3.bamUrl;if(!np[o])return{coverage:r,maxCoverage:i};var _loop7=function _loop7(){var o=e[_t131].from,s=e[_t131].to;for(var _t132=o-o%n+n;_t132<s;_t132+=n)r[_t132]||(r[_t132]={reads:0,matches:0,variants:{A:0,C:0,G:0,T:0,N:0},range:\"\"}),r[_t132].reads++,r[_t132].matches++,i=Math.max(i,r[_t132].reads);e[_t131].substitutions.forEach(function(t){if(t.variant){var _e139=o+t.pos;if(!r[_e139])return;r[_e139].matches--,r[_e139].variants[t.variant]||(r[_e139].variants[t.variant]=0),r[_e139].variants[t.variant]++;}});};for(var _t131=0;_t131<e.length;_t131++){_loop7();}var a=np[o].absToChr;return Object.entries(r).forEach(function(_ref35){var _ref36=_slicedToArray(_ref35,2),t=_ref36[0],e=_ref36[1];var r=a(t);var i=r[0]+\":\"+Gt(\",\")(r[1]);if(n>1){var _e138=a(parseInt(t,10)+n-1);i+=\"-\"+Gt(\",\")(_e138[1]);}e.range=i;}),{coverage:r,maxCoverage:i};}(e,b,m);v=_xi.coverage;var _ki=_xi.maxCoverage,_Ai=c(0,u.coverageHeight),_Ei=[C(0),C(u.coverageHeight-1)+C.bandwidth()],_Si=g().domain(_Ai).range(_Ei).paddingInner(.05);var _Mi,_Bi,_Ti,_zi=Re.BG_MUTED;var _Ci=(j(1)-j(0))*m,_Ni=_Si.bandwidth()*u.coverageHeight,_Ii=_Ni/_ki;for(var _i64=0,_Object$keys9=Object.keys(v);_i64<_Object$keys9.length;_i64++){var _Oi=_Object$keys9[_i64];_Mi=j(_Oi),_Bi=_Ni;for(var _i65=0,_Object$keys10=Object.keys(v[_Oi].variants);_i65<_Object$keys10.length;_i65++){var _Ri=_Object$keys10[_i65];_Ti=v[_Oi].variants[_Ri]*_Ii,_Bi-=_Ti;var _Li=1===m?Re[_Ri]:_zi;U(_Mi,_Bi,_Ci,_Ti,_Li);}_Ti=v[_Oi].matches*_Ii,_Bi-=_Ti,1===m&&(_zi=_Oi%2==0?Re.BG:Re.BG2),U(_Mi,_Bi,_Ci,_Ti,_zi);}}var _loop8=function _loop8(){var Ui=_Object$values[_i66];var ji=Ui.rows,Pi=c(0,ji.length),Di=[Ui.start,Ui.end],Fi=u&&u.indexDHS?.25:u&&u.methylation&&u.methylation.hasOwnProperty(\"fiberPadding\")?u.methylation.fiberPadding:0,$i=g().domain(Pi).range(Di).paddingInner(Fi);var Hi,qi,Zi,Wi;ji.map(function(t,e){var n=$i.bandwidth();Zi=$i(e),Wi=Zi+n,t.map(function(t,e){if(!t.from||!t.to)return;var r=j(t.from),i=j(t.to);if(Hi=r,qi=i,u&&u.methylation)U(Hi,Zi,qi-Hi,n,t.colorOverride||t.color);else if(u&&u.indexDHS)U(Hi,Zi,qi-Hi,n,Re.INDEX_DHS_BG);else if(u&&u.tfbs)U(Hi,Zi+.125*n,qi-Hi,.75*n,Re.TFBS_SEGMENT_BG);else if(u&&u.genericBed){var _t133=Re.GENERIC_BED_SEGMENT_BG;U(Hi,Zi+.125*n,qi-Hi,.75*n,_t133);}if(u&&u.methylation&&u.methylation.hideSubstitutions){if(!xp(_)){var _e140=Object.keys(_);for(var _i67=0,_e141=_e140;_i67<_e141.length;_i67++){var _r94=_e141[_i67];var _e142=_r94.length,_i68=Math.max(1,j(_e142)-j(0)),_o48=Re[\"HIGHLIGHTS_\".concat(_r94)],_s48=_[_r94];if(\"M0A\"!==_r94){var _iterator83=_createForOfIteratorHelper(_s48),_step83;try{for(_iterator83.s();!(_step83=_iterator83.n()).done;){var _e143=_step83.value;_e143>=t.from&&_e143<t.to&&(Hi=j(_e143),qi=Hi+_i68,U(Hi,Zi,_i68,n,_o48));}}catch(err){_iterator83.e(err);}finally{_iterator83.f();}}}}var _e144=u&&u.methylation&&u.methylation.categoryAbbreviations&&u.methylation.categoryAbbreviations.includes(\"5mC+\"),_r95=u&&u.methylation&&u.methylation.categoryAbbreviations&&u.methylation.categoryAbbreviations.includes(\"5mC-\"),_i69=u&&u.methylation&&u.methylation.categoryAbbreviations&&u.methylation.categoryAbbreviations.includes(\"m6A+\"),_o49=u&&u.methylation&&u.methylation.categoryAbbreviations&&u.methylation.categoryAbbreviations.includes(\"m6A-\"),_s49=u&&u.methylation&&u.methylation.probabilityThresholdRange?u.methylation.probabilityThresholdRange[0]:0,_a22=u&&u.methylation&&u.methylation.probabilityThresholdRange?u.methylation.probabilityThresholdRange[1]+1:256;var _l12=null;var _iterator84=_createForOfIteratorHelper(t.methylationOffsets),_step84;try{var _loop9=function _loop9(){var u=_step84.value;var h=u.offsets,c=u.probabilities,f=1;switch(u.unmodifiedBase){case\"C\":\"m\"===u.code&&\"+\"===u.strand&&_e144&&(_l12=Re.MM_M5C_FOR);break;case\"G\":\"m\"===u.code&&\"-\"===u.strand&&_r95&&(_l12=Re.MM_M5C_REV);break;case\"A\":\"a\"===u.code&&\"+\"===u.strand&&_i69&&(_l12=Re.MM_M6A_FOR);break;case\"T\":\"a\"===u.code&&\"-\"===u.strand&&_o49&&(_l12=Re.MM_M6A_REV);}if(_l12){if(\"a\"===u.code&&\"M0A\"in _){var _e145=new Set(h.filter(function(t,e){return c[e]<_s49;}).map(function(e){return e+t.from;})),_r96=1,_i70=Math.max(1,j(_r96)-j(0)),_o50=Re.HIGHLIGHTS_MZEROA,_a23=_toConsumableArray(y).filter(function(t){return!_e145.has(t);});var _iterator85=_createForOfIteratorHelper(_a23),_step85;try{for(_iterator85.s();!(_step85=_iterator85.n()).done;){var _e146=_step85.value;_e146>=t.from&&_e146<=t.to&&(Hi=j(_e146),qi=Hi+_i70,U(Hi,Zi,_i70,n,_o50));}}catch(err){_iterator85.e(err);}finally{_iterator85.f();}}var _e147=Math.max(1,j(f)-j(0));h.filter(function(t,e){return c[e]>=_s49&&c[e]<_a22;}).map(function(r){Hi=j(t.from+r),qi=Hi+_e147,U(Hi,Zi,_e147,n,_l12);});}};for(_iterator84.s();!(_step84=_iterator84.n()).done;){_loop9();}}catch(err){_iterator84.e(err);}finally{_iterator84.f();}}else if(u&&u.indexDHS){var _e148=u.indexDHS?t.metadata:{};var _r97=Re.BLACK;u.indexDHS&&(_r97=Re[\"INDEX_DHS_\".concat(_e148.rgb)]);var _iterator86=_createForOfIteratorHelper(t.substitutions),_step86;try{for(_iterator86.s();!(_step86=_iterator86.n()).done;){var _e149=_step86.value;Hi=j(t.from+_e149.pos);var _i72=Math.max(1,j(_e149.length)-j(0)),_o52=Math.max(1,j(.1)-j(0));if(qi=Hi+_i72,\"A\"===_e149.variant)U(Hi,Zi,_i72,n,Re.A);else if(\"C\"===_e149.variant)U(Hi,Zi,_i72,n,Re.C);else if(\"G\"===_e149.variant)U(Hi,Zi,_i72,n,Re.G);else if(\"T\"===_e149.variant)U(Hi,Zi,_i72,n,Re.T);else if(\"S\"===_e149.type)U(Hi,Zi,_i72,n,Re.S);else if(\"H\"===_e149.type)U(Hi,Zi,_i72,n,Re.H);else if(\"X\"===_e149.type)U(Hi,Zi,_i72,n,Re.X);else if(\"I\"===_e149.type)U(Hi,Zi,_o52,n,Re.I);else if(\"D\"===_e149.type){U(Hi,Zi,_i72,n,Re.D);var _t134=6,_e150=.1;for(var _o53=0;_o53<=_t134;_o53++)U(Hi+_o53*_i72/_t134,Zi,_e150,n,_r97);}else if(\"N\"===_e149.type){var _t135=(Zi+Wi)/2,_e151=Math.min((Wi-Zi)/4.5,1);U(Hi,_t135+_e151/2,qi-Hi,_e151,_r97);}else{var _t136=.5*$i.bandwidth();U(Hi,Zi+.25*(Wi-Zi),_i72,_t136,_r97);}}}catch(err){_iterator86.e(err);}finally{_iterator86.f();}var _i71=t.from-t.chrOffset,_o51=_e148.summit.start,_s50=_e148.summit.end-_o51,_a24=_o51-_i71,_l13=j(t.from+_a24),_h9=Zi,_c6=Math.max(1,j(_s50)-j(0));U(_l13,_h9,_c6,n,_r97);}else if(u&&u.fire){u.fire&&u.fire.metadata&&t.metadata;var _e152=u.fire&&u.fire.enabledCategories?u.fire.enabledCategories:[];var _n122=Re.FIRE_BG;var _r98=.25*$i.bandwidth(),_i73=1.75*_r98;var _iterator87=_createForOfIteratorHelper(t.substitutions),_step87;try{var _loop10=function _loop10(){var o=_step87.value;Hi=j(t.from+o.pos);var s=Math.max(1,j(o.length)-j(0));Math.max(1,j(.1)-j(0)),qi=Hi+s,U(Hi,Zi+.5*(Wi-Zi)-_i73,s,_r98,_n122);var a=t.metadata.colors,l=t.metadata.blocks,h=l.sizes,c=l.offsets,f=l.colors.map(function(t){return a[t];}),d=l.colors.map(function(t){return Re[\"FIRE_\".concat(a[t])];}),p=l.colors.map(function(t){return u.fire.metadata.itemRGBMap[a[t]].heightFactor;});for(var _n123=0;_n123<l.count;_n123++){var _o54=f[_n123];if(_e152.includes(_o54)){var _e153=h[_n123],_o55=c[_n123],_s51=d[_n123],_a25=Math.max(1,j(_e153)-j(0)),_u12=j(t.from+_o55),_l14=Zi+(Wi-Zi)*(1-.125*p[_n123])-_i73;U(_u12,_l14,_a25,_r98*p[_n123],_s51);}}};for(_iterator87.s();!(_step87=_iterator87.n()).done;){_loop10();}}catch(err){_iterator87.e(err);}finally{_iterator87.f();}}});});};for(var _i66=0,_Object$values=Object.values(M);_i66<_Object$values.length;_i66++){_loop8();}var F=yp.slice(0,N).buffer,$=bp.slice(0,I).buffer,H=wp.slice(0,O).buffer,q={rows:M,tileIds:n,coverage:v,coverageSamplingDistance:m,positionsBuffer:F,colorsBuffer:$,ixBuffer:H,xScaleDomain:r,xScaleRange:i,clusterResultsToExport:B,drawnSegmentIdentifiers:w};return Jt(q,[q.positionsBuffer,$,H]);},exportSegmentsAsBED12:function exportSegmentsAsBED12(t,e,n,r,i,o,s,a,u,l){var h={},c=[];var _iterator93=_createForOfIteratorHelper(n),_step93;try{for(_iterator93.s();!(_step93=_iterator93.n()).done;){var _7=_step93.value;var _m2=rp.get(\"\".concat(e,\".\").concat(_7));if(_m2.error)throw new Error(_m2.error);var _iterator111=_createForOfIteratorHelper(_m2),_step111;try{for(_iterator111.s();!(_step111=_iterator111.n()).done;){var _v5=_step111.value;h[_v5.id]=_v5;}}catch(err){_iterator111.e(err);}finally{_iterator111.f();}}}catch(err){_iterator93.e(err);}finally{_iterator93.f();}var f=Object.values(h);u.minMappingQuality>0&&(f=f.filter(function(t){return t.mapq>=u.minMappingQuality;}));var _ref37=[Number.MAX_VALUE,-Number.MAX_VALUE],d=_ref37[0],p=_ref37[1];for(var _y2=0;_y2<f.length;_y2++)f[_y2].from<d&&(d=f[_y2].from),f[_y2].to>p&&(p=f[_y2].to);var g=null;if(Wd){var _b2=u&&u.groupBy;_b2=_b2||null,g=Wd(f,_b2);}else g={\"null\":f};if(l&&u.methylation){var _w3=l.range.left.chrom,_x103=l.range.left.start,_k=l.range.right.stop,_A=l.method,_E=l.distanceFn,_S=l.eventCategories,_M=(l.linkage,l.epsilon),_B=l.minimumPoints,_T={min:l.probabilityThresholdRange[0],max:l.probabilityThresholdRange[1]};var _z=null;var _C=_k-_x103,_N=f.length,_I=new Array();var _O=0;var _R={};switch(_A){case\"AGNES\":switch(_E){case\"Euclidean\":_z=vn.WI;for(var _L=0;_L<_N;++_L){var _U=f[_L],_j=(_U.to,_U.from,new Array(_C).fill(-255)),_P=_U.from-_U.chrOffset,_D=_U.to-_U.chrOffset;switch(eventOverlapType){case\"Full subregion\":if(_P<_x103&&_D>_k){var _F=_x103-_P,_$=_F+_C;var _iterator94=_createForOfIteratorHelper(mos),_step94;try{for(_iterator94.s();!(_step94=_iterator94.n()).done;){var _H=_step94.value;var _q=_H.offsets,_Z2=_H.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_H.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_H.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_H.unmodifiedBase)for(var _W2=0;_W2<_q.length;_W2++){var _G2=_q[_W2],_Y=_Z2[_W2];_G2>=_F&&_G2<=_$&&_T.min<=_Y&&_T.max>=_Y&&(_j[_G2-_F]=parseInt(_Y));}}}catch(err){_iterator94.e(err);}finally{_iterator94.f();}_R[_O]=_L,_I[_O++]=_j;}break;case\"Partial subregion\":if(_P<_x103&&_D>_k){var _V2=_x103-_P,_X2=_V2+_C;var _iterator95=_createForOfIteratorHelper(mos),_step95;try{for(_iterator95.s();!(_step95=_iterator95.n()).done;){var _K2=_step95.value;var _J2=_K2.offsets,_Q2=_K2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_K2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_K2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_K2.unmodifiedBase)for(var _tt2=0;_tt2<_J2.length;_tt2++){var _et2=_J2[_tt2],_nt2=_Q2[_tt2];_et2>=_V2&&_et2<=_X2&&_T.min<=_nt2&&_T.max>=_nt2&&(_j[_et2-_V2]=parseInt(_nt2));}}}catch(err){_iterator95.e(err);}finally{_iterator95.f();}_R[_O]=_L,_I[_O++]=_j;}else if(_P>=_x103&&_D<=_k){var _rt2=_P-_x103;var _iterator96=_createForOfIteratorHelper(mos),_step96;try{for(_iterator96.s();!(_step96=_iterator96.n()).done;){var _it2=_step96.value;var _ot2=_it2.offsets,_st2=_it2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_it2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_it2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_it2.unmodifiedBase)for(var _at2=0;_at2<_ot2.length;_at2++){var _ut2=_ot2[_at2],_lt2=parseInt(_st2[_at2]);_rt2+_ut2<_C&&_T.min<=_lt2&&_T.max>=_lt2&&(_j[_rt2+_ut2]=_lt2);}}}catch(err){_iterator96.e(err);}finally{_iterator96.f();}_R[_O]=_L,_I[_O++]=_j;}else if(_P<_x103&&_D<=_k&&_D>_x103){var _ht2=_x103-_P,_ct2=_D-_P;var _iterator97=_createForOfIteratorHelper(mos),_step97;try{for(_iterator97.s();!(_step97=_iterator97.n()).done;){var _ft2=_step97.value;var _dt2=_ft2.offsets,_pt2=_ft2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_ft2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_ft2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_ft2.unmodifiedBase)for(var _gt2=0;_gt2<_dt2.length;_gt2++){var _t137=_dt2[_gt2],_mt2=parseInt(_pt2[_gt2]);_t137>=_ht2&&_t137<=_ct2&&_T.min<=_mt2&&_T.max>=_mt2&&(_j[_t137-_ht2]=_mt2);}}}catch(err){_iterator97.e(err);}finally{_iterator97.f();}_R[_O]=_L,_I[_O++]=_j;}else if(_P>=_x103&&_P<_k&&_D>_k){var _vt2=_P-_x103,_yt2=_k-_P+_vt2;var _iterator98=_createForOfIteratorHelper(mos),_step98;try{for(_iterator98.s();!(_step98=_iterator98.n()).done;){var _bt2=_step98.value;var _wt2=_bt2.offsets,_xt2=_bt2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_bt2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_bt2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_bt2.unmodifiedBase)for(var _kt2=0;_kt2<_wt2.length;_kt2++){var _At2=_wt2[_kt2],_Et2=parseInt(_xt2[_kt2]);_At2>=_vt2&&_At2<_yt2&&_T.min<=_Et2&&_T.max>=_Et2&&(_j[_At2]=_Et2);}}}catch(err){_iterator98.e(err);}finally{_iterator98.f();}_R[_O]=_L,_I[_O++]=_j;}break;default:throw new Error(\"Event overlap type [\".concat(eventOverlapType,\"] is unknown or unsupported for cluster matrix generation\"));}}break;case\"Jaccard\":_z=vn.eN;for(var _St2=0;_St2<_N;++_St2){var _Mt2=f[_St2],_Bt2=(_Mt2.to,_Mt2.from,new Array(_C).fill(0)),_Tt2=_Mt2.from-_Mt2.chrOffset,_zt2=_Mt2.to-_Mt2.chrOffset;switch(eventOverlapType){case\"Full subregion\":if(_Tt2<_x103&&_zt2>_k){var _Ct2=_x103-_Tt2,_Nt2=_Ct2+_C;var _iterator99=_createForOfIteratorHelper(mos),_step99;try{for(_iterator99.s();!(_step99=_iterator99.n()).done;){var _It2=_step99.value;var _Ot2=_It2.offsets,_Rt2=_It2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_It2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_It2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_It2.unmodifiedBase)for(var _Lt2=0;_Lt2<_Ot2.length;_Lt2++){var _Ut=_Ot2[_Lt2],_jt2=_Rt2[_Lt2];_Ut>=_Ct2&&_Ut<=_Nt2&&_T.min<=_jt2&&_T.max>=_jt2&&(_Bt2[_Ut-_Ct2]=1);}}}catch(err){_iterator99.e(err);}finally{_iterator99.f();}_R[_O]=_St2,_I[_O++]=_Bt2;}break;case\"Partial subregion\":if(_Tt2<_x103&&_zt2>_k){var _Pt2=_x103-_Tt2,_Dt2=_Pt2+_C;var _iterator100=_createForOfIteratorHelper(mos),_step100;try{for(_iterator100.s();!(_step100=_iterator100.n()).done;){var _Ft2=_step100.value;var _$t2=_Ft2.offsets,_Ht2=_Ft2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_Ft2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_Ft2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_Ft2.unmodifiedBase)for(var _qt2=0;_qt2<_$t2.length;_qt2++){var _Zt2=_$t2[_qt2],_Wt2=_Ht2[_qt2];_Zt2>=_Pt2&&_Zt2<=_Dt2&&_T.min<=_Wt2&&_T.max>=_Wt2&&(_Bt2[_Zt2-_Pt2]=1);}}}catch(err){_iterator100.e(err);}finally{_iterator100.f();}_R[_O]=_St2,_I[_O++]=_Bt2;}else if(_Tt2>=_x103&&_zt2<=_k){var _Gt=_Tt2-_x103;var _iterator101=_createForOfIteratorHelper(mos),_step101;try{for(_iterator101.s();!(_step101=_iterator101.n()).done;){var _Yt2=_step101.value;var _Vt2=_Yt2.offsets,_Xt2=_Yt2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_Yt2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_Yt2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_Yt2.unmodifiedBase)for(var _Kt2=0;_Kt2<_Vt2.length;_Kt2++){var _Jt=_Vt2[_Kt2],_Qt2=parseInt(_Xt2[_Kt2]);_Gt+_Jt<_C&&_T.min<=_Qt2&&_T.max>=_Qt2&&(_Bt2[_Gt+_Jt]=1);}}}catch(err){_iterator101.e(err);}finally{_iterator101.f();}_R[_O]=_St2,_I[_O++]=_Bt2;}else if(_Tt2<_x103&&_zt2<=_k&&_zt2>_x103){var _te2=_x103-_Tt2,_ee2=_zt2-_Tt2;var _iterator102=_createForOfIteratorHelper(mos),_step102;try{for(_iterator102.s();!(_step102=_iterator102.n()).done;){var _ne2=_step102.value;var _re2=_ne2.offsets,_ie2=_ne2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_ne2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_ne2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_ne2.unmodifiedBase)for(var _oe2=0;_oe2<_re2.length;_oe2++){var _se2=_re2[_oe2],_ae2=parseInt(_ie2[_oe2]);_se2>=_te2&&_se2<=_ee2&&_T.min<=_ae2&&_T.max>=_ae2&&(_Bt2[_se2-_te2]=1);}}}catch(err){_iterator102.e(err);}finally{_iterator102.f();}_R[_O]=_St2,_I[_O++]=_Bt2;}else if(_Tt2>=_x103&&_Tt2<_k&&_zt2>_k){var _ue2=_Tt2-_x103,_le4=_k-_Tt2+_ue2;var _iterator103=_createForOfIteratorHelper(mos),_step103;try{for(_iterator103.s();!(_step103=_iterator103.n()).done;){var _he2=_step103.value;var _ce2=_he2.offsets,_fe2=_he2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_he2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_he2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_he2.unmodifiedBase)for(var _de2=0;_de2<_ce2.length;_de2++){var _pe2=_ce2[_de2],_ge2=parseInt(_fe2[_de2]);_pe2>=_ue2&&_pe2<_le4&&_T.min<=_ge2&&_T.max>=_ge2&&(_Bt2[_pe2]=1);}}}catch(err){_iterator103.e(err);}finally{_iterator103.f();}_R[_O]=_St2,_I[_O++]=_Bt2;}break;default:throw new Error(\"Event overlap type [\".concat(eventOverlapType,\"] is unknown or unsupported for cluster matrix generation\"));}}break;default:throw new Error(\"Cluster distance function [\".concat(_E,\"] is unknown or unsupported for BED12 export cluster matrix generation\"));}break;case\"DBSCAN\":if(\"Euclidean\"!==_E)throw new Error(\"Cluster distance function [\".concat(_E,\"] is unknown or unsupported for subregion cluster matrix construction\"));_z=function _z(t,e){return Math.hypot.apply(Math,_toConsumableArray(Object.keys(t).map(function(n){return e[n]-t[n];})));};for(var _e154=0;_e154<_N;++_e154){var _me2=f[_e154],_ve2=(_me2.to,_me2.from,new Array(_C).fill(-255)),_ye2=_me2.from-_me2.chrOffset,_be2=_me2.to-_me2.chrOffset;switch(eventOverlapType){case\"Full subregion\":if(_ye2<_x103&&_be2>_k){var _we2=_x103-_ye2,_xe3=_we2+_C;var _iterator104=_createForOfIteratorHelper(mos),_step104;try{for(_iterator104.s();!(_step104=_iterator104.n()).done;){var _ke2=_step104.value;var _Ae2=_ke2.offsets,_Ee2=_ke2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_ke2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_ke2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_ke2.unmodifiedBase)for(var _Se2=0;_Se2<_Ae2.length;_Se2++){var _Me2=_Ae2[_Se2],_Be2=_Ee2[_Se2];_Me2>=_we2&&_Me2<=_xe3&&_T.min<=_Be2&&_T.max>=_Be2&&(_ve2[_Me2-_we2]=parseInt(_Be2));}}}catch(err){_iterator104.e(err);}finally{_iterator104.f();}_R[_O]=_e154,_I[_O++]=_ve2;}break;case\"Partial subregion\":if(_ye2<_x103&&_be2>_k){var _Te2=_x103-_ye2,_ze2=_Te2+_C;var _iterator105=_createForOfIteratorHelper(mos),_step105;try{for(_iterator105.s();!(_step105=_iterator105.n()).done;){var _Ce2=_step105.value;var _Ne2=_Ce2.offsets,_Ie2=_Ce2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_Ce2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_Ce2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_Ce2.unmodifiedBase)for(var _Oe2=0;_Oe2<_Ne2.length;_Oe2++){var _Le2=_Ne2[_Oe2],_je2=_Ie2[_Oe2];_Le2>=_Te2&&_Le2<=_ze2&&_T.min<=_je2&&_T.max>=_je2&&(_ve2[_Le2-_Te2]=parseInt(_je2));}}}catch(err){_iterator105.e(err);}finally{_iterator105.f();}_R[_O]=_e154,_I[_O++]=_ve2;}else if(_ye2>=_x103&&_be2<=_k){var _Pe=_ye2-_x103;var _iterator106=_createForOfIteratorHelper(mos),_step106;try{for(_iterator106.s();!(_step106=_iterator106.n()).done;){var _De2=_step106.value;var _Fe2=_De2.offsets,_$e2=_De2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_De2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_De2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_De2.unmodifiedBase)for(var _He2=0;_He2<_Fe2.length;_He2++){var _qe2=_Fe2[_He2],_Ze2=parseInt(_$e2[_He2]);_Pe+_qe2<_C&&_T.min<=_Ze2&&_T.max>=_Ze2&&(_ve2[_Pe+_qe2]=_Ze2);}}}catch(err){_iterator106.e(err);}finally{_iterator106.f();}_R[_O]=_e154,_I[_O++]=_ve2;}else if(_ye2<_x103&&_be2<=_k&&_be2>_x103){var _We2=_x103-_ye2,_Ge2=_be2-_ye2;var _iterator107=_createForOfIteratorHelper(mos),_step107;try{for(_iterator107.s();!(_step107=_iterator107.n()).done;){var _Ye2=_step107.value;var _Ve2=_Ye2.offsets,_Xe2=_Ye2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_Ye2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_Ye2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_Ye2.unmodifiedBase)for(var _Ke2=0;_Ke2<_Ve2.length;_Ke2++){var _Je2=_Ve2[_Ke2],_Qe2=parseInt(_Xe2[_Ke2]);_Je2>=_We2&&_Je2<=_Ge2&&_T.min<=_Qe2&&_T.max>=_Qe2&&(_ve2[_Je2-_We2]=_Qe2);}}}catch(err){_iterator107.e(err);}finally{_iterator107.f();}_R[_O]=_e154,_I[_O++]=_ve2;}else if(_ye2>=_x103&&_ye2<_k&&_be2>_k){var _tn2=_ye2-_x103,_en2=_k-_ye2+_tn2;var _iterator108=_createForOfIteratorHelper(mos),_step108;try{for(_iterator108.s();!(_step108=_iterator108.n()).done;){var _nn2=_step108.value;var _rn2=_nn2.offsets,_on2=_nn2.probabilities;if(_S.includes(\"m6A+\")&&\"A\"===_nn2.unmodifiedBase||_S.includes(\"m6A-\")&&\"T\"===_nn2.unmodifiedBase||_S.includes(\"5mC\")&&\"C\"===_nn2.unmodifiedBase)for(var _sn2=0;_sn2<_rn2.length;_sn2++){var _an2=_rn2[_sn2],_un2=parseInt(_on2[_sn2]);_an2>=_tn2&&_an2<_en2&&_T.min<=_un2&&_T.max>=_un2&&(_ve2[_an2]=_un2);}}}catch(err){_iterator108.e(err);}finally{_iterator108.f();}_R[_O]=_e154,_I[_O++]=_ve2;}break;default:throw new Error(\"Event overlap type [\".concat(eventOverlapType,\"] is unknown or unsupported for cluster matrix generation\"));}}break;default:throw new Error(\"Cluster method [\".concat(_A,\"] is unknown or unsupported for BED12 export cluster matrix generation\"));}if(_I.length>0)switch(_A){case\"AGNES\":var _ref38=(0,vn.eM)({data:_I,distance:_z,linkage:vn.bP,onProgress:null}),_ln2=_ref38.clusters,_hn2=_ref38.distances,_cn2=_ref38.order,_fn2=_ref38.clustersGivenK,_dn2=_cn2.map(function(t){var e=_R[t];return[f[e]];});for(var _i74=0,_Object$keys11=Object.keys(g);_i74<_Object$keys11.length;_i74++){var _n124=_Object$keys11[_i74];var _mn2=_dn2;g[_n124]={},g[_n124].rows=_mn2;}break;case\"DBSCAN\":var _pn2=function _pn2(t){var e=[],n=[];for(var _r99=0;_r99<t.length;_r99++){var _i75=t[_r99];if(Array.isArray(_i75))n.push(t,_r99),_r99=-1,t=_i75;else for(e.push(_i75);_r99===t.length-1&&n.length;)_r99=n.pop(),t=n.pop();}return e;};var _gn2=Zd({dataset:_I,epsilon:_M,minimumPoints:_B,distanceFunction:_z});if(_gn2.clusters.length>0){var _yn2=_pn2(_gn2.clusters.concat(_gn2.noise)).map(function(t){var e=_R[t];return[f[e]];});for(var _i76=0,_Object$keys12=Object.keys(g);_i76<_Object$keys12.length;_i76++){var _bn2=_Object$keys12[_i76];var _wn2=_yn2;g[_bn2]={},g[_bn2].rows=_wn2;}}else for(var _i77=0,_Object$keys13=Object.keys(g);_i77<_Object$keys13.length;_i77++){var _xn2=_Object$keys13[_i77];var _kn2=gp(g[_xn2],{prevRows:a[_xn2]&&a[_xn2].rows||[]});g[_xn2]={},g[_xn2].rows=_kn2;}break;default:throw new Error(\"Cluster method [\".concat(_A,\"] is unknown or unsupported for BED12 export clustering\"));}else for(var _i78=0,_Object$keys14=Object.keys(g);_i78<_Object$keys14.length;_i78++){var _An2=_Object$keys14[_i78];var _En2=gp(g[_An2],{prevRows:a[_An2]&&a[_An2].rows||[]});g[_An2]={},g[_An2].rows=_En2;}Object.values(g).map(function(t){return t.rows.length;}).reduce(function(t,e){return t+e;},0);for(var _i79=0,_Object$values2=Object.values(g);_i79<_Object$values2.length;_i79++){var _Sn2=_Object$values2[_i79];var _Mn2=_Sn2.rows;_Mn2.map(function(t,e){t.map(function(t,e){var n=u&&u.methylation&&u.methylation.categoryAbbreviations&&u.methylation.categoryAbbreviations.includes(\"5mC+\"),r=u&&u.methylation&&u.methylation.categoryAbbreviations&&u.methylation.categoryAbbreviations.includes(\"5mC-\"),i=u&&u.methylation&&u.methylation.categoryAbbreviations&&u.methylation.categoryAbbreviations.includes(\"m6A+\"),o=u&&u.methylation&&u.methylation.categoryAbbreviations&&u.methylation.categoryAbbreviations.includes(\"m6A-\"),s=u&&u.methylation&&u.methylation.probabilityThresholdRange?u.methylation.probabilityThresholdRange[0]:0,a=u&&u.methylation&&u.methylation.probabilityThresholdRange?u.methylation.probabilityThresholdRange[1]+1:255;var h=null;var f={chrom:_w3,chromStart:t.start-1,chromEnd:t.start+(t.to-t.from)-1,name:\"\".concat(l.name,\"__\").concat(t.readName),score:1e3,strand:t.strand,thickStart:t.start-1,thickEnd:t.start+(t.to-t.from)-1,itemRgb:Ue(l.colors[0]),blockCount:0,blockSizes:[],blockStarts:[]};var _iterator109=_createForOfIteratorHelper(t.methylationOffsets),_step109;try{for(_iterator109.s();!(_step109=_iterator109.n()).done;){var _e155=_step109.value;var _t138=_e155.offsets,_u13=_e155.probabilities,_l15=1;switch(_e155.unmodifiedBase){case\"C\":\"m\"===_e155.code&&\"+\"===_e155.strand&&n&&(h=null);break;case\"G\":\"m\"===_e155.code&&\"-\"===_e155.strand&&r&&(h=null);break;case\"A\":\"a\"===_e155.code&&\"+\"===_e155.strand&&i&&(h=Re.MM_M6A_FOR);break;case\"T\":\"a\"===_e155.code&&\"-\"===_e155.strand&&o&&(h=Re.MM_M6A_REV);}if(h){var _e156=0;var _iterator110=_createForOfIteratorHelper(_t138),_step110;try{for(_iterator110.s();!(_step110=_iterator110.n()).done;){var _n125=_step110.value;var _t139=_u13[_e156];_t139>=s&&_t139<a&&(f.blockCount++,f.blockSizes.push(_l15),f.blockStarts.push(_n125-1)),_e156++;}}catch(err){_iterator110.e(err);}finally{_iterator110.f();}f.blockStarts.sort(function(t,e){return t-e;});}}}catch(err){_iterator109.e(err);}finally{_iterator109.f();}c.push(f);});});}}return{uid:l.uid,bed12Elements:c};},exportTFBSOverlaps:function exportTFBSOverlaps(t,e,n,r,i,o,s,a,u,l){var h={},c=[];var _iterator112=_createForOfIteratorHelper(n),_step112;try{for(_iterator112.s();!(_step112=_iterator112.n()).done;){var _t141=_step112.value;var _n127=rp.get(\"\".concat(e,\".\").concat(_t141));if(_n127.error)throw new Error(_n127.error);var _iterator113=_createForOfIteratorHelper(_n127),_step113;try{for(_iterator113.s();!(_step113=_iterator113.n()).done;){var _t142=_step113.value;h[_t142.id]=_t142;}}catch(err){_iterator113.e(err);}finally{_iterator113.f();}}}catch(err){_iterator112.e(err);}finally{_iterator112.f();}var f=Object.values(h);if(l&&u.tfbs){var _t140=l.range.left.start,_e157=l.range.right.stop;for(var _n126=0;_n126<f.length;_n126++){var _r100=f[_n126],_i80=_r100.from-_r100.chrOffset,_o56=_r100.to-_r100.chrOffset;(_i80<=_t140&&_i80<_e157&&_o56>_t140||_i80>=_t140&&_i80<_e157&&_o56>=_e157||_i80>=_t140&&_i80<_e157&&_o56>=_t140&&_o56<_e157)&&c.push(_r100.readName);}}return{uid:l.uid,tfbsOverlaps:c};},exportSignalMatrices:kp,exportUidTrackElements:function exportUidTrackElements(t,e,n,r,i,o,s,a,u,l){var h=[];if(l&&u.genericBed){var _t143=ap[e].bamUrl,_n128=Kd[_t143],_r101=l.range.left.chrom,_i81=l.range.left.start,_o57=l.range.right.stop,_s52=Math.floor((_i81+_o57)/2),_a26={viewAsPairs:!1,maxSampleSize:1e3,maxInsertSize:1e3,assemblyName:\"hg38\"},_c7=!0;h.push(_n128.getRecordsForRange(_r101,_i81,_o57,_a26).then(function(t){var e=[],n=t.map(function(t){return Yd(t,_r101,_i81,u,_c7);});for(var _t144=0;_t144<n.length;_t144++){var _r102=n[_t144],_i82=_r102.from-_r102.chrOffset,_o58=_r102.to-_r102.chrOffset,_a27=Math.floor((_i82+_o58)/2);e.push({absDistanceFromMidpoint:Math.abs(_s52-_a27),signedDistanceFromMidpoint:_s52>_a27?Math.abs(_s52-_a27):-Math.abs(_s52-_a27),viewportRange:l.range,segment:{chrName:_r102.chrName,start:_i82,end:_o58}});}switch(l.offset){case-1:case 0:case 1:e.sort(function(t,e){return t.absDistanceFromMidpoint-e.absDistanceFromMidpoint;});}return e;}));}return Promise.all(h).then(function(t){return{uid:l.uid,overlaps:t.flat(),offset:l.offset};});}};Kt(Ep);}();})();");
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
function debounce(callback, wait) {
  var timeoutId = null;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(function () {
      callback.apply(null, args);
    }, wait);
  };
}
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

  var worker = spawn(BlobWorker.fromText(cjs_js_dist_worker));
  var PileupTrackClass = /*#__PURE__*/function (_HGC$tracks$Tiled1DPi) {
    _inherits(PileupTrackClass, _HGC$tracks$Tiled1DPi);
    var _super = _createSuper(PileupTrackClass);
    function PileupTrackClass(context, options) {
      var _this;
      PileupTrack_classCallCheck(this, PileupTrackClass);
      // const worker = spawn(BlobWorker.fromText(MyWorkerWeb)); 

      // this is where the threaded tile fetcher is called
      // We also need to pass the track options as some of them influence how the data needs to be loaded
      context.dataFetcher = new bam_fetcher(context.dataConfig, options, worker, HGC);
      _this = _super.call(this, context, options);
      context.dataFetcher.track = _assertThisInitialized(_this);

      // console.log(`${this.id} | context.dataConfig ${JSON.stringify(context.dataConfig)}`);

      _this.sessionId = context.dataConfig.sid;
      _this.originatingTrackId = JSON.parse(JSON.stringify(_this.id));
      _this.trackId = _this.id;
      _this.viewId = context.viewUid;
      _this.originalHeight = context.definition.height;
      _this.worker = worker;
      _this.isShowGlobalMousePosition = context.isShowGlobalMousePosition;
      _this.valueScaleTransform = HGC.libraries.d3Zoom.zoomIdentity;
      _this.trackUpdatesAreFrozen = false;
      _this.alignCpGEvents = true;
      _this.clusterResultsReadyToExport = {};

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

      // const debounce = (callback, wait) => {
      //   let timeoutId = null;
      //   return (...args) => {
      //     window.clearTimeout(timeoutId);
      //     timeoutId = window.setTimeout(() => {
      //       callback(...args);
      //     }, wait);
      //   };
      // };
      //
      // this.monitor = new BroadcastChannel(`pileup-track-viewer`);
      // this.monitor.onmessage = debounce((event) => this.handlePileupTrackViewerMessage(event.data), 500);

      _this.monitor = new BroadcastChannel("pileup-track-viewer-".concat(_this.sessionId));
      _this.monitor.onmessage = function (event) {
        return _this.handlePileupTrackViewerMessage(event.data);
      };
      _this.bc = new BroadcastChannel("pileup-track-".concat(_this.id));
      _this.bc.postMessage({
        state: 'loading',
        msg: _this.loadingText.text,
        uid: _this.id,
        sid: _this.sessionId
      });

      // this.handlePileupMessage = this.handlePileupTrackViewerMessage;
      return _this;
    }
    PileupTrack_createClass(PileupTrackClass, [{
      key: "remove",
      value: function remove() {
        console.log(this);
        console.log("[higlass-pileup] REMOVE");
        this.pLabel.destroy(true); // clean up pixi stuff
        this.dataFetcher.cleanup();
        this.fetching.clear();
        _get(_getPrototypeOf(PileupTrackClass.prototype), "remove", this).call(this);
      }
    }, {
      key: "externalInit",
      value:
      // Some of the initialization code is factored out, so that we can 
      // reset/reinitialize if an option change requires it
      function externalInit(options) {
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
        this.fireIdentifierData = null;
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

        //
        // add FIRE color table data, if available
        //
        if (options && options.fire) {
          var fireColorDict = fireColors(options);
          colorDict = PileupTrack_objectSpread(PileupTrack_objectSpread({}, colorDict), fireColorDict);
          if (options.fire.metadata && options.fire.metadata.backgroundColor) {
            // console.log(`[PileupTrack] options.fire.metadata.backgroundColor ${options.fire.metadata.backgroundColor}`);
            colorDict.FIRE_BG = this.colorToArray(options.fire.metadata.backgroundColor);
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
        // console.log(`handlePileupTrackViewerMessage [${data.state} : ${data.sid}]`);
        if (data.state === 'mouseover') {
          if (this.id !== data.uid) {
            this.clearMouseOver();
          }
        }
        if (data.state === 'initialize_session_id') {
          // console.log(`loading | ${this.id} | ${this.sessionId} | ${data.sid}`);
          if (!this.sessionId) {
            // console.log(`updating ${this.id} session id to ${data.sid}`);
            this.sessionId = data.sid;
          }
        }
        if (data.state === 'request') {
          // console.log(`request | ${this.id} | ${this.sessionId} | ${data.sid}`);
          if (!this.sessionId && data.sid) {
            // console.log(`updating ${this.id} session id to ${data.sid}`);
            this.sessionId = data.sid;
          }
          if (this.sessionId !== data.sid) {
            // console.log(`${data.msg} | session id mismatch ${this.sessionId} !== ${data.sid}`);
            return;
          }
          switch (data.msg) {
            case "track-updates-freeze":
              if (data.sid !== this.sessionId) break;
              this.trackUpdatesAreFrozen = true;
              break;
            case "track-updates-unfreeze":
              if (data.sid !== this.sessionId) break;
              this.trackUpdatesAreFrozen = false;
              break;
            case "refresh-layout":
              if (!this.options.methylation || this.trackUpdatesAreFrozen) break;
              // console.log(`refresh-layout | ${this.id} | ${this.sessionId} | ${JSON.stringify(data)}`)
              // if (this.options.fire) 
              //   break;
              if (data.sid !== this.sessionId) break;
              // this.dataFetcher = new BAMDataFetcher(
              //   this.dataFetcher.dataConfig,
              //   this.options,
              //   this.worker,
              //   HGC,
              // );
              // this.dataFetcher.track = this;
              // console.log(`refresh-layout | id ${this.id} | sessionId ${this.sessionId} | recalculateOffsets ${data.recalculateOffsets}`);
              if (data.recalculateOffsets) {
                this.alignCpGEvents = data.alignCpGEvents;
                this.removeTiles(Object.keys(this.fetchedTiles));
                this.fetching.clear();
                this.refreshTiles();
                this.externalInit(this.options);
                this.updateExistingGraphics();
                this.prevOptions = Object.assign({}, this.options);
              } else {
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
                this.updateExistingGraphics();
                this.prevOptions = Object.assign({}, this.options);
              }
              this.bc.postMessage({
                state: 'refresh_layout_end',
                uid: this.id,
                sid: this.sessionId
              });
              break;
            case "refresh-fire-layout":
              if (!this.options.fire || this.trackUpdatesAreFrozen) break;
              if (data.sid !== this.sessionId) break;
              // console.log(`refresh-fire-layout | ${this.id} | ${this.sessionId}`);
              this.dataFetcher = new bam_fetcher(this.dataFetcher.dataConfig, this.options, this.worker, HGC);
              this.dataFetcher.track = this;
              this.prevRows = [];
              this.removeTiles(Object.keys(this.fetchedTiles));
              this.fetching.clear();
              this.refreshTiles();
              this.externalInit(this.options);
              // this.fireIdentifierData = {
              //   identifiers: data.identifiers,
              // };
              // this.updateExistingGraphics();
              this.prevOptions = Object.assign({}, this.options);
              break;
            case "refresh-fire-layout-post-clustering":
              if (!this.options.fire || this.trackUpdatesAreFrozen) return;
              // console.log(`refresh-fire-layout-post-clustering | ${this.id} | ${this.sessionId} | ${JSON.stringify(data)}`);
              if (data.sid !== this.sessionId) break;
              this.dataFetcher = new bam_fetcher(this.dataFetcher.dataConfig, this.options, this.worker, HGC);
              this.dataFetcher.track = this;
              this.prevRows = [];
              this.removeTiles(Object.keys(this.fetchedTiles));
              this.fetching.clear();
              this.refreshTiles();
              this.externalInit(this.options);
              this.fireIdentifierData = {
                sourceTrackUid: data.sourceTrackUid,
                identifiers: data.identifiers
              };
              this.clusterResultsReadyToExport[this.id] = false;
              this.updateExistingGraphics();
              this.prevOptions = Object.assign({}, this.options);
              break;
            case "cluster-layout":
              if (!this.options.methylation || this.clusterData || this.trackUpdatesAreFrozen) break;
              if (data.sid !== this.sessionId) break;
              this.dataFetcher = new bam_fetcher(this.dataFetcher.dataConfig, this.options, this.worker, HGC);
              this.dataFetcher.track = this;
              this.prevRows = [];
              this.removeTiles(Object.keys(this.fetchedTiles));
              this.fetching.clear();
              this.refreshTiles();
              this.externalInit(this.options);
              this.clusterData = {
                range: data.range,
                viewportRange: data.viewportRange,
                method: data.method,
                distanceFn: data.distanceFn,
                eventCategories: data.eventCategories,
                linkage: data.linkage,
                epsilon: data.epsilon,
                minimumPoints: data.minimumPoints,
                probabilityThresholdRange: data.probabilityThresholdRange,
                eventOverlapType: data.eventOverlapType,
                filterFiberMinLength: data.filterFiberMinLength,
                filterFiberMaxLength: data.filterFiberMaxLength,
                filterFiberStrands: data.filterFiberStrands,
                basesPerPixel: data.basesPerPixel,
                viewportWidthInPixels: data.viewportWidthInPixels
              };
              this.updateExistingGraphics();
              this.prevOptions = Object.assign({}, this.options);
              break;
            case "bed12-layout":
              if (!this.options.methylation) break;
              if (data.sid !== this.sessionId) break;
              var bed12Name = "".concat(this.options.methylation.group, "/").concat(this.options.methylation.set);
              var bed12Colors = this.options.methylation.colors;
              this.bed12ExportData = {
                range: data.range,
                method: data.method,
                distanceFn: data.distanceFn,
                eventCategories: data.eventCategories,
                linkage: data.linkage,
                epsilon: data.epsilon,
                minimumPoints: data.minimumPoints,
                probabilityThresholdRange: data.probabilityThresholdRange,
                eventOverlapType: data.eventOverlapType,
                uid: this.id,
                name: bed12Name,
                colors: bed12Colors
              };
              this.exportBED12Layout();
              break;
            case "retrieve-tfbs-overlaps":
              if (!this.options.tfbs) break;
              if (data.sid !== this.sessionId) break;
              this.tfbsExportData = {
                range: data.range,
                uid: this.id
              };
              this.exportTFBSOverlaps();
              break;
            case "recalculate-signal-matrices":
              // console.log(`recalculate-signal-matrices (A) ${data.sid} | ${this.sessionId} | ${this.options.methylation} | ${this.trackUpdatesAreFrozen}`);
              if (typeof this.options.methylation === 'undefined') break;
              if (!this.trackUpdatesAreFrozen) break;
              if (data.sid !== this.sessionId) break;
              // console.log(`recalculate-signal-matrices (B)`);
              this.signalMatrixExportData = {
                uid: this.id,
                range: data.range,
                viewportRange: data.viewportRange,
                method: data.method,
                distanceFn: data.distanceFn,
                eventCategories: data.eventCategories,
                linkage: data.linkage,
                epsilon: data.epsilon,
                minimumPoints: data.minimumPoints,
                probabilityThresholdRange: data.probabilityThresholdRange,
                eventOverlapType: data.eventOverlapType,
                filterFiberMinLength: data.filterFiberMinLength,
                filterFiberMaxLength: data.filterFiberMaxLength,
                filterFiberStrands: data.filterFiberStrands,
                basesPerPixel: data.basesPerPixel,
                viewportWidthInPixels: data.viewportWidthInPixels
              };
              this.exportSignalMatrices();
              break;
            case 'get-uid-track-element-midpoint':
              if (typeof this.options.genericBed === 'undefined') break;
              if (data.sid !== this.sessionId) break;
              if (data.trackUid !== this.id) break;
              this.uidTrackElementMidpointExportData = {
                uid: this.id,
                trackUid: data.trackUid,
                range: data.viewportRange,
                offset: data.offset
              };
              this.exportUidTrackElements();
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
      key: "exportSignalMatrices",
      value: function exportSignalMatrices() {
        var _this3 = this;
        this.bc.postMessage({
          state: 'export_signal_matrices_start',
          msg: 'Begin signal matrix export worker processing',
          uid: this.id,
          sid: this.sessionId
        });
        this.worker.then(function (tileFunctions) {
          tileFunctions.exportSignalMatrices(_this3.sessionId, _this3.dataFetcher.uid, Object.values(_this3.fetchedTiles).map(function (x) {
            return x.remoteId;
          }), _this3._xScale.domain(), _this3._xScale.range(), _this3.position, _this3.dimensions, _this3.prevRows, _this3.options, _this3.signalMatrixExportData).then(function (toExport) {
            if (_this3.clusterData) {
              _this3.clusterData = null;
            }
            if (_this3.bed12ExportData) {
              _this3.bed12ExportData = null;
            }
            if (_this3.fireIdentifierData) {
              _this3.fireIdentifierData = null;
            }
            if (_this3.tfbsExportData) {
              _this3.tfbsExportData = null;
            }
            if (_this3.signalMatrixExportData) {
              _this3.signalMatrixExportData = null;
            }
            if (_this3.uidTrackElementMidpointExportData) {
              _this3.uidTrackElementMidpointExportData = null;
            }
            _this3.bc.postMessage({
              state: 'export_signal_matrices_end',
              msg: 'Completed (exportSignalMatrices Promise fulfillment)',
              uid: _this3.id,
              sid: _this3.sessionId,
              data: toExport
            });
          });
        });
      }
    }, {
      key: "exportTFBSOverlaps",
      value: function exportTFBSOverlaps() {
        var _this4 = this;
        this.bc.postMessage({
          state: 'export_tfbs_overlaps_start',
          msg: 'Begin TFBS overlap export worker processing',
          uid: this.id,
          sid: this.sessionId
        });
        this.worker.then(function (tileFunctions) {
          tileFunctions.exportTFBSOverlaps(_this4.sessionId, _this4.dataFetcher.uid, Object.values(_this4.fetchedTiles).map(function (x) {
            return x.remoteId;
          }), _this4._xScale.domain(), _this4._xScale.range(), _this4.position, _this4.dimensions, _this4.prevRows, _this4.options, _this4.tfbsExportData).then(function (toExport) {
            if (_this4.clusterData) {
              _this4.clusterData = null;
            }
            if (_this4.bed12ExportData) {
              _this4.bed12ExportData = null;
            }
            if (_this4.fireIdentifierData) {
              _this4.fireIdentifierData = null;
            }
            if (_this4.tfbsExportData) {
              _this4.tfbsExportData = null;
            }
            if (_this4.signalMatrixExportData) {
              _this4.signalMatrixExportData = null;
            }
            if (_this4.uidTrackElementMidpointExportData) {
              _this4.uidTrackElementMidpointExportData = null;
            }
            _this4.bc.postMessage({
              state: 'export_tfbs_overlaps_end',
              msg: 'Completed (exportTFBSOverlaps Promise fulfillment)',
              uid: _this4.id,
              sid: _this4.sessionId,
              data: toExport
            });
          });
        });
      }
    }, {
      key: "exportUidTrackElements",
      value: function exportUidTrackElements() {
        var _this5 = this;
        this.bc.postMessage({
          state: 'export_uid_track_element_midpoint_start',
          msg: 'Begin UID track element midpoint export worker processing',
          uid: this.id,
          sid: this.sessionId
        });
        this.worker.then(function (tileFunctions) {
          tileFunctions.exportUidTrackElements(_this5.sessionId, _this5.dataFetcher.uid, Object.values(_this5.fetchedTiles).map(function (x) {
            return x.remoteId;
          }), _this5._xScale.domain(), _this5._xScale.range(), _this5.position, _this5.dimensions, _this5.prevRows, _this5.options, _this5.uidTrackElementMidpointExportData).then(function (toExport) {
            if (_this5.clusterData) {
              _this5.clusterData = null;
            }
            if (_this5.bed12ExportData) {
              _this5.bed12ExportData = null;
            }
            if (_this5.fireIdentifierData) {
              _this5.fireIdentifierData = null;
            }
            if (_this5.tfbsExportData) {
              _this5.tfbsExportData = null;
            }
            if (_this5.signalMatrixExportData) {
              _this5.signalMatrixExportData = null;
            }
            _this5.bc.postMessage({
              state: 'export_uid_track_element_midpoint_end',
              msg: 'Completed (exportUidTrackElementMidpoint Promise fulfillment)',
              uid: _this5.id,
              sid: _this5.sessionId,
              data: toExport
            });
          });
        });
      }
    }, {
      key: "exportBED12Layout",
      value: function exportBED12Layout() {
        var _this6 = this;
        // console.log(`exportBED12Layout called`);
        this.bc.postMessage({
          state: 'export_bed12_start',
          msg: 'Begin BED12 export worker processing',
          uid: this.id,
          sid: this.sessionId
        });
        this.worker.then(function (tileFunctions) {
          tileFunctions.exportSegmentsAsBED12(_this6.sessionId, _this6.dataFetcher.uid, Object.values(_this6.fetchedTiles).map(function (x) {
            return x.remoteId;
          }), _this6._xScale.domain(), _this6._xScale.range(), _this6.position, _this6.dimensions, _this6.prevRows, _this6.options, _this6.bed12ExportData).then(function (toExport) {
            // console.log(`toExport ${JSON.stringify(toExport)}`);

            if (_this6.clusterData) {
              _this6.clusterData = null;
            }
            if (_this6.bed12ExportData) {
              _this6.bed12ExportData = null;
            }
            if (_this6.fireIdentifierData) {
              _this6.fireIdentifierData = null;
            }
            if (_this6.tfbsExportData) {
              _this6.tfbsExportData = null;
            }
            if (_this6.signalMatrixExportData) {
              _this6.signalMatrixExportData = null;
            }
            if (_this6.uidTrackElementMidpointExportData) {
              _this6.uidTrackElementMidpointExportData = null;
            }
            _this6.bc.postMessage({
              state: 'export_bed12_end',
              msg: 'Completed (exportBED12Layout Promise fulfillment)',
              uid: _this6.id,
              sid: _this6.sessionId,
              data: toExport
            });
          });
        });
      }
    }, {
      key: "updateExistingGraphics",
      value: function updateExistingGraphics() {
        var _this7 = this;
        // console.log(`updateExistingGraphics (start) | ${this.id}`);

        if (this.trackUpdatesAreFrozen && (this.options.fire || this.options.methylation)) return;
        var updateExistingGraphicsStart = performance.now();
        if (!this.maxTileWidthReached) {
          this.loadingText.text = 'Rendering...';
          this.bc.postMessage({
            state: 'update_start',
            msg: this.loadingText.text,
            uid: this.id,
            sid: this.sessionId
          });
        } else {
          // console.log(`updateExistingGraphics (A) | ${this.id}`);
          this.worker.then(function (tileFunctions) {
            tileFunctions.renderSegments(_this7.sessionId, _this7.dataFetcher.uid, Object.values(_this7.fetchedTiles).map(function (x) {
              return x.remoteId;
            }), _this7._xScale.domain(), _this7._xScale.range(), _this7.position, _this7.dimensions, _this7.prevRows, _this7.options, _this7.alignCpGEvents, _this7.clusterData, _this7.fireIdentifierData).then(function (toRender) {
              // console.log(`toRender (maxTileWidthReached) ${JSON.stringify(toRender)}`);

              if (_this7.segmentGraphics) {
                _this7.pMain.removeChild(_this7.segmentGraphics);
              }
              _this7.draw();
              _this7.animate();
              var updateExistingGraphicsEndA = performance.now();
              var elapsedTimeA = updateExistingGraphicsEndA - updateExistingGraphicsStart;
              var msg = {
                state: 'update_end',
                msg: 'Completed (maxTileWidthReached)',
                uid: _this7.id,
                sid: _this7.sessionId,
                elapsedTime: elapsedTimeA
              };
              // console.log(`${JSON.stringify(msg)}`);
              _this7.bc.postMessage(msg);
            });
          });
          return;
        }

        // console.log(`updateExistingGraphics (B1) | ${this.id}`);
        var fetchedTileIds = new Set(Object.keys(this.fetchedTiles));
        if (!eqSet(this.visibleTileIds, fetchedTileIds)) {
          this.updateLoadingText();
          return;
        }

        // Prevent multiple renderings with the same tiles. This can happen when multiple new tiles come in at once
        // console.log(`updateExistingGraphics (B2) | ${this.id}`);
        if (eqSet(this.previousTileIdsUsedForRendering, fetchedTileIds)) {
          return;
        }
        this.previousTileIdsUsedForRendering = fetchedTileIds;

        // console.log(`updateExistingGraphics (B2+) | ${this.id}`);

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

        // console.log(`updateExistingGraphics (B3) | ${this.id}`);

        this.worker.then(function (tileFunctions) {
          tileFunctions.renderSegments(_this7.sessionId, _this7.dataFetcher.uid, Object.values(_this7.fetchedTiles).map(function (x) {
            return x.remoteId;
          }), _this7._xScale.domain(), _this7._xScale.range(), _this7.position, _this7.dimensions, _this7.prevRows, _this7.options, _this7.alignCpGEvents, _this7.id, _this7.clusterData, _this7.fireIdentifierData).then(function (toRender) {
            // console.log(`toRender.tileIds ${JSON.stringify(toRender.tileIds)}`);

            if (!toRender) return;
            if (_this7.fireIdentifierData) {
              _this7.fireIdentifierData = null;
            }

            // console.log(`this.clusterResultsReadyToExport[${this.id}] ${JSON.stringify(this.clusterResultsReadyToExport[this.id])}`);
            if (toRender.clusterResultsToExport) {
              _this7.clusterResultsReadyToExport[_this7.id] = true;
              _this7.bc.postMessage({
                state: 'export_subregion_clustering_results',
                msg: 'Completed subregion clustering',
                uid: _this7.id,
                sid: _this7.sessionId,
                data: toRender.clusterResultsToExport
              });
              toRender.clusterResultsToExport = null;
            }
            if (toRender.clusterResultsToExport && !_this7.clusterResultsReadyToExport[_this7.id]) return;

            // if (toRender.drawnSegmentIdentifiers) {
            //   this.bc.postMessage({
            //     state: 'drawn_segment_identifiers',
            //     msg: 'Completed segment identifier drawing', 
            //     uid: this.id,
            //     sid: this.sessionId,
            //     data: toRender.drawnSegmentIdentifiers,
            //   });
            // }

            _this7.loadingText.visible = false;
            for (var _i2 = 0, _fetchedTileKeys2 = fetchedTileKeys; _i2 < _fetchedTileKeys2.length; _i2++) {
              var _fetchedTileKey = _fetchedTileKeys2[_i2];
              _this7.rendering["delete"](_fetchedTileKey);
            }
            // fetchedTileKeys.forEach((x) => {
            //   this.rendering.delete(x);
            // });

            _this7.updateLoadingText();
            if (_this7.maxTileWidthReached) {
              // if (
              //   this.segmentGraphics &&
              //   this.options.collapseWhenMaxTileWidthReached
              // ) {
              //   this.pMain.removeChild(this.segmentGraphics);
              // }
              if (_this7.segmentGraphics) {
                _this7.segmentGraphics.clear();
                _this7.pMain.removeChild(_this7.segmentGraphics);
                _this7.pBorder.clear();
              }
              if (_this7.mouseOverGraphics) {
                requestAnimationFrame(_this7.animate);
                _this7.mouseOverGraphics.clear();
                _this7.pMain.removeChild(_this7.mouseOverGraphics);
                _this7.pBorder.clear();
              }
              _this7.loadingText.visible = false;
              _this7.draw();
              _this7.animate();
              requestAnimationFrame(_this7.animate);
              var updateExistingGraphicsEndB = performance.now();
              var elapsedTimeB = updateExistingGraphicsEndB - updateExistingGraphicsStart;
              var _msg = {
                state: 'update_end',
                msg: 'Completed (maxTileWidthReached)',
                uid: _this7.id,
                sid: _this7.sessionId,
                elapsedTime: elapsedTimeB
              };
              // console.log(`${JSON.stringify(msg)}`);
              _this7.bc.postMessage(_msg);
              return;
            }
            _this7.errorTextText = null;
            _this7.pBorder.clear();
            _this7.drawError();
            _this7.animate();
            _this7.positions = new Float32Array(toRender.positionsBuffer);
            _this7.colors = new Float32Array(toRender.colorsBuffer);
            _this7.ixs = new Int32Array(toRender.ixBuffer);
            var newGraphics = new HGC.libraries.PIXI.Graphics();
            _this7.prevRows = toRender.rows;
            _this7.coverage = toRender.coverage;
            _this7.coverageSamplingDistance = toRender.coverageSamplingDistance;
            if (_this7.loadMates) {
              _this7.readsById = {};
              for (var key in _this7.prevRows) {
                var _iterator5 = PileupTrack_createForOfIteratorHelper(_this7.prevRows[key].rows),
                  _step5;
                try {
                  for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                    var row = _step5.value;
                    var _iterator6 = PileupTrack_createForOfIteratorHelper(row),
                      _step6;
                    try {
                      for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                        var segment = _step6.value;
                        if (segment.id in _this7.readsById) return;
                        _this7.readsById[segment.id] = segment;
                        _this7.readsById[segment.id]['groupKey'] = key;
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
            var geometry = new HGC.libraries.PIXI.Geometry().addAttribute('position', _this7.positions, 2); // x,y
            geometry.addAttribute('aColorIdx', _this7.colors, 1);
            geometry.addIndex(_this7.ixs);
            if (_this7.positions.length) {
              var state = new HGC.libraries.PIXI.State();
              var mesh = new HGC.libraries.PIXI.Mesh(geometry, _this7.shader, state);
              newGraphics.addChild(mesh);
            }
            _this7.pMain.x = _this7.position[0];
            if (_this7.segmentGraphics) {
              _this7.pMain.removeChild(_this7.segmentGraphics);
            }
            _this7.pMain.addChild(newGraphics);
            _this7.segmentGraphics = newGraphics;

            // remove and add again to place on top
            _this7.pMain.removeChild(_this7.mouseOverGraphics);
            _this7.pMain.addChild(_this7.mouseOverGraphics);
            _this7.yScaleBands = {};
            for (var _key3 in _this7.prevRows) {
              _this7.yScaleBands[_key3] = HGC.libraries.d3Scale.scaleBand().domain(HGC.libraries.d3Array.range(0, _this7.prevRows[_key3].rows.length)).range([_this7.prevRows[_key3].start, _this7.prevRows[_key3].end]).paddingInner(0.2);
            }
            _this7.drawnAtScale = HGC.libraries.d3Scale.scaleLinear().domain(toRender.xScaleDomain).range(toRender.xScaleRange);
            scaleScalableGraphics(_this7.segmentGraphics, _this7._xScale, _this7.drawnAtScale);

            // if somebody zoomed vertically, we want to readjust so that
            // they're still zoomed in vertically
            _this7.segmentGraphics.scale.y = _this7.valueScaleTransform.k;
            _this7.segmentGraphics.position.y = _this7.valueScaleTransform.y;
            _this7.draw();
            _this7.animate();
            if (_this7.clusterData) {
              _this7.clusterData = null;
            }
            if (_this7.bed12ExportData) {
              _this7.bed12ExportData = null;
            }
            if (_this7.fireIdentifierData) {
              _this7.fireIdentifierData = null;
            }
            if (_this7.tfbsExportData) {
              _this7.tfbsExportData = null;
            }
            if (_this7.signalMatrixExportData) {
              _this7.signalMatrixExportData = null;
            }

            // if (this.fireIdentifierData) {
            //   this.fireIdentifierData = null;
            // }

            var updateExistingGraphicsEndC = performance.now();
            var elapsedTimeC = updateExistingGraphicsEndC - updateExistingGraphicsStart;
            var msg = {
              state: 'update_end',
              msg: 'Completed (renderSegments Promise fulfillment)',
              uid: _this7.id,
              sid: _this7.sessionId,
              elapsedTime: elapsedTimeC
            };
            // console.log(`${JSON.stringify(msg)}`);
            // this.bc.postMessage(msg);
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
            uid: this.id,
            sid: this.sessionId
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
            uid: this.id,
            sid: this.sessionId
          });
        }
        if (this.rendering.size) {
          this.loadingText.text = "Rendering... ".concat(PileupTrack_toConsumableArray(this.rendering).join(' '));
          this.bc.postMessage({
            state: 'rendering',
            msg: this.loadingText.text,
            uid: this.id,
            sid: this.sessionId
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
          uid: this.id,
          sid: this.sessionId
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
                      var position = null;
                      var positionText = null;
                      var eventText = null;
                      var eventProbability = null;
                      if (this.options.chromInfo) {
                        var atcX = HGC.utils.absToChr(dataX, this.options.chromInfo);
                        var chrom = atcX[0];
                        position = Math.ceil(atcX[1]);
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

                      if (this.options.genericBed) {
                        var genericBedNameLabel = 'Name';
                        var genericBedNameValue = read.readName !== '.' ? read.readName : this.options.name;
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readName\" class=\"track-mouseover-menu-table-item-label\">".concat(genericBedNameLabel, "</label>\n                      <div name=\"readName\" class=\"track-mouseover-menu-table-item-value\">").concat(genericBedNameValue, "</div>\n                    </div>");
                      } else if (this.options.tfbs) {
                        var tfbsValue = read.readName;
                        var _tfbsValue$split = tfbsValue.split('%%'),
                          _tfbsValue$split2 = _slicedToArray(_tfbsValue$split, 2),
                          tfbsClusterName = _tfbsValue$split2[0],
                          tfbsModelName = _tfbsValue$split2[1];
                        var tfbsClusterNameLabel = 'Cluster';
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"tfbs\" class=\"track-mouseover-menu-table-item-label\">".concat(tfbsClusterNameLabel, "</label>\n                      <div name=\"tfbs\" class=\"track-mouseover-menu-table-item-value\">").concat(tfbsClusterName, "</div>\n                    </div>");
                        var tfbsModelNameLabel = 'Model';
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"tfbs\" class=\"track-mouseover-menu-table-item-label\">".concat(tfbsModelNameLabel, "</label>\n                      <div name=\"tfbs\" class=\"track-mouseover-menu-table-item-value\">").concat(tfbsModelName, "</div>\n                    </div>");
                      } else if (this.options.indexDHS) {
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
                      readIntervalValue += this.options.methylation || this.options.tfbs ? " (".concat(read.strand, ")") : '';
                      output += "<div class=\"track-mouseover-menu-table-item\">\n                    <label for=\"readInterval\" class=\"track-mouseover-menu-table-item-label\">".concat(readIntervalLabel, "</label>\n                    <div name=\"readInterval\" class=\"track-mouseover-menu-table-item-value\">").concat(readIntervalValue, "</div>\n                  </div>");
                      if (this.options.methylation) {
                        var readLength = "".concat(read.to - read.from);
                        output += "<div class=\"track-mouseover-menu-table-item\">\n                      <label for=\"readLength\" class=\"track-mouseover-menu-table-item-label\">Length</label>\n                      <div name=\"readLength\" class=\"track-mouseover-menu-table-item-value\">".concat(readLength, "</div>\n                    </div>");
                      }
                      if (this.options.tfbs) {
                        var tfbsScore = read.metadata.score;
                        if (tfbsScore) {
                          output += "<div class=\"track-mouseover-menu-table-item\">\n                        <label for=\"tfbsScore\" class=\"track-mouseover-menu-table-item-label\">Score</label>\n                        <div name=\"tfbsScore\" class=\"track-mouseover-menu-table-item-value\">".concat(tfbsScore, "</div>\n                      </div>");
                        }
                        var tfbsSequence = read.seq;
                        if (position) {
                          var tfbsSequencePositionToHighlight = position - (read.from - read.chrOffset) + 1;
                          // console.log(`tfbsSequencePositionToHighlight ${tfbsSequencePositionToHighlight} | ${position} | ${read.from} | ${read.chrOffset} | ${tfbsSequence}`);
                          if (tfbsSequence && tfbsSequencePositionToHighlight >= 1 && tfbsSequencePositionToHighlight <= tfbsSequence.length) {
                            var tfbsSequencePieces = '';
                            if (tfbsSequencePositionToHighlight === 1) {
                              tfbsSequencePieces += "<span class=\"track-mouseover-menu-table-item-value-sequence-highlight\">".concat(tfbsSequence.substring(0, 1), "</span>");
                              tfbsSequencePieces += "<span class=\"track-mouseover-menu-table-item-value-sequence\">".concat(tfbsSequence.substring(1, tfbsSequence.length), "</span>");
                            } else if (tfbsSequencePositionToHighlight === tfbsSequence.length) {
                              tfbsSequencePieces += "<span class=\"track-mouseover-menu-table-item-value-sequence\">".concat(tfbsSequence.substring(0, tfbsSequence.length - 1), "</span>");
                              tfbsSequencePieces += "<span class=\"track-mouseover-menu-table-item-value-sequence-highlight\">".concat(tfbsSequence.substring(tfbsSequence.length - 1, tfbsSequence.length), "</span>");
                            } else {
                              tfbsSequencePieces += "<span class=\"track-mouseover-menu-table-item-value-sequence\">".concat(tfbsSequence.substring(0, tfbsSequencePositionToHighlight - 1), "</span>");
                              tfbsSequencePieces += "<span class=\"track-mouseover-menu-table-item-value-sequence-highlight\">".concat(tfbsSequence.substring(tfbsSequencePositionToHighlight - 1, tfbsSequencePositionToHighlight), "</span>");
                              tfbsSequencePieces += "<span class=\"track-mouseover-menu-table-item-value-sequence\">".concat(tfbsSequence.substring(tfbsSequencePositionToHighlight, tfbsSequence.length), "</span>");
                            }
                            // console.log(`tfbsSequencePieces ${tfbsSequencePieces}`);
                            output += "<div class=\"track-mouseover-menu-table-item\">\n                          <label for=\"tfbsSequence\" class=\"track-mouseover-menu-table-item-label\">Sequence</label>\n                          <div name=\"tfbsSequence\" class=\"track-mouseover-menu-table-item-value\">".concat(tfbsSequencePieces, "</div>\n                        </div>");
                          }
                        } else {
                          if (tfbsSequence) {
                            output += "<div class=\"track-mouseover-menu-table-item\">\n                          <label for=\"tfbsSequence\" class=\"track-mouseover-menu-table-item-label\">Sequence</label>\n                          <div name=\"tfbsSequence\" class=\"track-mouseover-menu-table-item-value track-mouseover-menu-table-item-value-sequence\">".concat(tfbsSequence, "</div>\n                        </div>");
                          }
                        }
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
          image.setAttribute('width', window.innerWidth);
          image.setAttribute('height', this.pMain.height);
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
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
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