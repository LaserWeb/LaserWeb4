/******/ (function(modules) { // webpackBootstrap
/******/ 	// Copied from https://github.com/facebook/react/blob/bef45b0/src/shared/utils/canDefineProperty.js
/******/ 	var canDefineProperty = false;
/******/ 	try {
/******/ 		Object.defineProperty({}, "x", {
/******/ 			get: function() {}
/******/ 		});
/******/ 		canDefineProperty = true;
/******/ 	} catch(x) {
/******/ 		// IE will fail on defineProperty
/******/ 	}
/******/ 	
/******/ 	var hotApplyOnUpdate = true;
/******/ 	var hotCurrentHash = "d16e03e3d050164ff11a"; // eslint-disable-line no-unused-vars
/******/ 	var hotCurrentModuleData = {};
/******/ 	var hotCurrentParents = []; // eslint-disable-line no-unused-vars
/******/ 	
/******/ 	function hotCreateRequire(moduleId) { // eslint-disable-line no-unused-vars
/******/ 		var me = installedModules[moduleId];
/******/ 		if(!me) return __webpack_require__;
/******/ 		var fn = function(request) {
/******/ 			if(me.hot.active) {
/******/ 				if(installedModules[request]) {
/******/ 					if(installedModules[request].parents.indexOf(moduleId) < 0)
/******/ 						installedModules[request].parents.push(moduleId);
/******/ 					if(me.children.indexOf(request) < 0)
/******/ 						me.children.push(request);
/******/ 				} else hotCurrentParents = [moduleId];
/******/ 			} else {
/******/ 				console.warn("[HMR] unexpected require(" + request + ") from disposed module " + moduleId);
/******/ 				hotCurrentParents = [];
/******/ 			}
/******/ 			return __webpack_require__(request);
/******/ 		};
/******/ 		for(var name in __webpack_require__) {
/******/ 			if(Object.prototype.hasOwnProperty.call(__webpack_require__, name)) {
/******/ 				if(canDefineProperty) {
/******/ 					Object.defineProperty(fn, name, (function(name) {
/******/ 						return {
/******/ 							configurable: true,
/******/ 							enumerable: true,
/******/ 							get: function() {
/******/ 								return __webpack_require__[name];
/******/ 							},
/******/ 							set: function(value) {
/******/ 								__webpack_require__[name] = value;
/******/ 							}
/******/ 						};
/******/ 					}(name)));
/******/ 				} else {
/******/ 					fn[name] = __webpack_require__[name];
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		function ensure(chunkId, callback) {
/******/ 			if(hotStatus === "ready")
/******/ 				hotSetStatus("prepare");
/******/ 			hotChunksLoading++;
/******/ 			__webpack_require__.e(chunkId, function() {
/******/ 				try {
/******/ 					callback.call(null, fn);
/******/ 				} finally {
/******/ 					finishChunkLoading();
/******/ 				}
/******/ 	
/******/ 				function finishChunkLoading() {
/******/ 					hotChunksLoading--;
/******/ 					if(hotStatus === "prepare") {
/******/ 						if(!hotWaitingFilesMap[chunkId]) {
/******/ 							hotEnsureUpdateChunk(chunkId);
/******/ 						}
/******/ 						if(hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 							hotUpdateDownloaded();
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			});
/******/ 		}
/******/ 		if(canDefineProperty) {
/******/ 			Object.defineProperty(fn, "e", {
/******/ 				enumerable: true,
/******/ 				value: ensure
/******/ 			});
/******/ 		} else {
/******/ 			fn.e = ensure;
/******/ 		}
/******/ 		return fn;
/******/ 	}
/******/ 	
/******/ 	function hotCreateModule(moduleId) { // eslint-disable-line no-unused-vars
/******/ 		var hot = {
/******/ 			// private stuff
/******/ 			_acceptedDependencies: {},
/******/ 			_declinedDependencies: {},
/******/ 			_selfAccepted: false,
/******/ 			_selfDeclined: false,
/******/ 			_disposeHandlers: [],
/******/ 	
/******/ 			// Module API
/******/ 			active: true,
/******/ 			accept: function(dep, callback) {
/******/ 				if(typeof dep === "undefined")
/******/ 					hot._selfAccepted = true;
/******/ 				else if(typeof dep === "function")
/******/ 					hot._selfAccepted = dep;
/******/ 				else if(typeof dep === "object")
/******/ 					for(var i = 0; i < dep.length; i++)
/******/ 						hot._acceptedDependencies[dep[i]] = callback;
/******/ 				else
/******/ 					hot._acceptedDependencies[dep] = callback;
/******/ 			},
/******/ 			decline: function(dep) {
/******/ 				if(typeof dep === "undefined")
/******/ 					hot._selfDeclined = true;
/******/ 				else if(typeof dep === "number")
/******/ 					hot._declinedDependencies[dep] = true;
/******/ 				else
/******/ 					for(var i = 0; i < dep.length; i++)
/******/ 						hot._declinedDependencies[dep[i]] = true;
/******/ 			},
/******/ 			dispose: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			addDisposeHandler: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			removeDisposeHandler: function(callback) {
/******/ 				var idx = hot._disposeHandlers.indexOf(callback);
/******/ 				if(idx >= 0) hot._disposeHandlers.splice(idx, 1);
/******/ 			},
/******/ 	
/******/ 			// Management API
/******/ 			check: hotCheck,
/******/ 			apply: hotApply,
/******/ 			status: function(l) {
/******/ 				if(!l) return hotStatus;
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			addStatusHandler: function(l) {
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			removeStatusHandler: function(l) {
/******/ 				var idx = hotStatusHandlers.indexOf(l);
/******/ 				if(idx >= 0) hotStatusHandlers.splice(idx, 1);
/******/ 			},
/******/ 	
/******/ 			//inherit from previous dispose call
/******/ 			data: hotCurrentModuleData[moduleId]
/******/ 		};
/******/ 		return hot;
/******/ 	}
/******/ 	
/******/ 	var hotStatusHandlers = [];
/******/ 	var hotStatus = "idle";
/******/ 	
/******/ 	function hotSetStatus(newStatus) {
/******/ 		hotStatus = newStatus;
/******/ 		for(var i = 0; i < hotStatusHandlers.length; i++)
/******/ 			hotStatusHandlers[i].call(null, newStatus);
/******/ 	}
/******/ 	
/******/ 	// while downloading
/******/ 	var hotWaitingFiles = 0;
/******/ 	var hotChunksLoading = 0;
/******/ 	var hotWaitingFilesMap = {};
/******/ 	var hotRequestedFilesMap = {};
/******/ 	var hotAvailibleFilesMap = {};
/******/ 	var hotCallback;
/******/ 	
/******/ 	// The update info
/******/ 	var hotUpdate, hotUpdateNewHash;
/******/ 	
/******/ 	function toModuleId(id) {
/******/ 		var isNumber = (+id) + "" === id;
/******/ 		return isNumber ? +id : id;
/******/ 	}
/******/ 	
/******/ 	function hotCheck(apply, callback) {
/******/ 		if(hotStatus !== "idle") throw new Error("check() is only allowed in idle status");
/******/ 		if(typeof apply === "function") {
/******/ 			hotApplyOnUpdate = false;
/******/ 			callback = apply;
/******/ 		} else {
/******/ 			hotApplyOnUpdate = apply;
/******/ 			callback = callback || function(err) {
/******/ 				if(err) throw err;
/******/ 			};
/******/ 		}
/******/ 		hotSetStatus("check");
/******/ 		hotDownloadManifest(function(err, update) {
/******/ 			if(err) return callback(err);
/******/ 			if(!update) {
/******/ 				hotSetStatus("idle");
/******/ 				callback(null, null);
/******/ 				return;
/******/ 			}
/******/ 	
/******/ 			hotRequestedFilesMap = {};
/******/ 			hotAvailibleFilesMap = {};
/******/ 			hotWaitingFilesMap = {};
/******/ 			for(var i = 0; i < update.c.length; i++)
/******/ 				hotAvailibleFilesMap[update.c[i]] = true;
/******/ 			hotUpdateNewHash = update.h;
/******/ 	
/******/ 			hotSetStatus("prepare");
/******/ 			hotCallback = callback;
/******/ 			hotUpdate = {};
/******/ 			var chunkId = 0;
/******/ 			{ // eslint-disable-line no-lone-blocks
/******/ 				/*globals chunkId */
/******/ 				hotEnsureUpdateChunk(chunkId);
/******/ 			}
/******/ 			if(hotStatus === "prepare" && hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 				hotUpdateDownloaded();
/******/ 			}
/******/ 		});
/******/ 	}
/******/ 	
/******/ 	function hotAddUpdateChunk(chunkId, moreModules) { // eslint-disable-line no-unused-vars
/******/ 		if(!hotAvailibleFilesMap[chunkId] || !hotRequestedFilesMap[chunkId])
/******/ 			return;
/******/ 		hotRequestedFilesMap[chunkId] = false;
/******/ 		for(var moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				hotUpdate[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(--hotWaitingFiles === 0 && hotChunksLoading === 0) {
/******/ 			hotUpdateDownloaded();
/******/ 		}
/******/ 	}
/******/ 	
/******/ 	function hotEnsureUpdateChunk(chunkId) {
/******/ 		if(!hotAvailibleFilesMap[chunkId]) {
/******/ 			hotWaitingFilesMap[chunkId] = true;
/******/ 		} else {
/******/ 			hotRequestedFilesMap[chunkId] = true;
/******/ 			hotWaitingFiles++;
/******/ 			hotDownloadUpdateChunk(chunkId);
/******/ 		}
/******/ 	}
/******/ 	
/******/ 	function hotUpdateDownloaded() {
/******/ 		hotSetStatus("ready");
/******/ 		var callback = hotCallback;
/******/ 		hotCallback = null;
/******/ 		if(!callback) return;
/******/ 		if(hotApplyOnUpdate) {
/******/ 			hotApply(hotApplyOnUpdate, callback);
/******/ 		} else {
/******/ 			var outdatedModules = [];
/******/ 			for(var id in hotUpdate) {
/******/ 				if(Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 					outdatedModules.push(toModuleId(id));
/******/ 				}
/******/ 			}
/******/ 			callback(null, outdatedModules);
/******/ 		}
/******/ 	}
/******/ 	
/******/ 	function hotApply(options, callback) {
/******/ 		if(hotStatus !== "ready") throw new Error("apply() is only allowed in ready status");
/******/ 		if(typeof options === "function") {
/******/ 			callback = options;
/******/ 			options = {};
/******/ 		} else if(options && typeof options === "object") {
/******/ 			callback = callback || function(err) {
/******/ 				if(err) throw err;
/******/ 			};
/******/ 		} else {
/******/ 			options = {};
/******/ 			callback = callback || function(err) {
/******/ 				if(err) throw err;
/******/ 			};
/******/ 		}
/******/ 	
/******/ 		function getAffectedStuff(module) {
/******/ 			var outdatedModules = [module];
/******/ 			var outdatedDependencies = {};
/******/ 	
/******/ 			var queue = outdatedModules.slice();
/******/ 			while(queue.length > 0) {
/******/ 				var moduleId = queue.pop();
/******/ 				var module = installedModules[moduleId];
/******/ 				if(!module || module.hot._selfAccepted)
/******/ 					continue;
/******/ 				if(module.hot._selfDeclined) {
/******/ 					return new Error("Aborted because of self decline: " + moduleId);
/******/ 				}
/******/ 				if(moduleId === 0) {
/******/ 					return;
/******/ 				}
/******/ 				for(var i = 0; i < module.parents.length; i++) {
/******/ 					var parentId = module.parents[i];
/******/ 					var parent = installedModules[parentId];
/******/ 					if(parent.hot._declinedDependencies[moduleId]) {
/******/ 						return new Error("Aborted because of declined dependency: " + moduleId + " in " + parentId);
/******/ 					}
/******/ 					if(outdatedModules.indexOf(parentId) >= 0) continue;
/******/ 					if(parent.hot._acceptedDependencies[moduleId]) {
/******/ 						if(!outdatedDependencies[parentId])
/******/ 							outdatedDependencies[parentId] = [];
/******/ 						addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 						continue;
/******/ 					}
/******/ 					delete outdatedDependencies[parentId];
/******/ 					outdatedModules.push(parentId);
/******/ 					queue.push(parentId);
/******/ 				}
/******/ 			}
/******/ 	
/******/ 			return [outdatedModules, outdatedDependencies];
/******/ 		}
/******/ 	
/******/ 		function addAllToSet(a, b) {
/******/ 			for(var i = 0; i < b.length; i++) {
/******/ 				var item = b[i];
/******/ 				if(a.indexOf(item) < 0)
/******/ 					a.push(item);
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// at begin all updates modules are outdated
/******/ 		// the "outdated" status can propagate to parents if they don't accept the children
/******/ 		var outdatedDependencies = {};
/******/ 		var outdatedModules = [];
/******/ 		var appliedUpdate = {};
/******/ 		for(var id in hotUpdate) {
/******/ 			if(Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 				var moduleId = toModuleId(id);
/******/ 				var result = getAffectedStuff(moduleId);
/******/ 				if(!result) {
/******/ 					if(options.ignoreUnaccepted)
/******/ 						continue;
/******/ 					hotSetStatus("abort");
/******/ 					return callback(new Error("Aborted because " + moduleId + " is not accepted"));
/******/ 				}
/******/ 				if(result instanceof Error) {
/******/ 					hotSetStatus("abort");
/******/ 					return callback(result);
/******/ 				}
/******/ 				appliedUpdate[moduleId] = hotUpdate[moduleId];
/******/ 				addAllToSet(outdatedModules, result[0]);
/******/ 				for(var moduleId in result[1]) {
/******/ 					if(Object.prototype.hasOwnProperty.call(result[1], moduleId)) {
/******/ 						if(!outdatedDependencies[moduleId])
/******/ 							outdatedDependencies[moduleId] = [];
/******/ 						addAllToSet(outdatedDependencies[moduleId], result[1][moduleId]);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// Store self accepted outdated modules to require them later by the module system
/******/ 		var outdatedSelfAcceptedModules = [];
/******/ 		for(var i = 0; i < outdatedModules.length; i++) {
/******/ 			var moduleId = outdatedModules[i];
/******/ 			if(installedModules[moduleId] && installedModules[moduleId].hot._selfAccepted)
/******/ 				outdatedSelfAcceptedModules.push({
/******/ 					module: moduleId,
/******/ 					errorHandler: installedModules[moduleId].hot._selfAccepted
/******/ 				});
/******/ 		}
/******/ 	
/******/ 		// Now in "dispose" phase
/******/ 		hotSetStatus("dispose");
/******/ 		var queue = outdatedModules.slice();
/******/ 		while(queue.length > 0) {
/******/ 			var moduleId = queue.pop();
/******/ 			var module = installedModules[moduleId];
/******/ 			if(!module) continue;
/******/ 	
/******/ 			var data = {};
/******/ 	
/******/ 			// Call dispose handlers
/******/ 			var disposeHandlers = module.hot._disposeHandlers;
/******/ 			for(var j = 0; j < disposeHandlers.length; j++) {
/******/ 				var cb = disposeHandlers[j];
/******/ 				cb(data);
/******/ 			}
/******/ 			hotCurrentModuleData[moduleId] = data;
/******/ 	
/******/ 			// disable module (this disables requires from this module)
/******/ 			module.hot.active = false;
/******/ 	
/******/ 			// remove module from cache
/******/ 			delete installedModules[moduleId];
/******/ 	
/******/ 			// remove "parents" references from all children
/******/ 			for(var j = 0; j < module.children.length; j++) {
/******/ 				var child = installedModules[module.children[j]];
/******/ 				if(!child) continue;
/******/ 				var idx = child.parents.indexOf(moduleId);
/******/ 				if(idx >= 0) {
/******/ 					child.parents.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// remove outdated dependency from module children
/******/ 		for(var moduleId in outdatedDependencies) {
/******/ 			if(Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)) {
/******/ 				var module = installedModules[moduleId];
/******/ 				var moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 				for(var j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 					var dependency = moduleOutdatedDependencies[j];
/******/ 					var idx = module.children.indexOf(dependency);
/******/ 					if(idx >= 0) module.children.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// Not in "apply" phase
/******/ 		hotSetStatus("apply");
/******/ 	
/******/ 		hotCurrentHash = hotUpdateNewHash;
/******/ 	
/******/ 		// insert new code
/******/ 		for(var moduleId in appliedUpdate) {
/******/ 			if(Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
/******/ 				modules[moduleId] = appliedUpdate[moduleId];
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// call accept handlers
/******/ 		var error = null;
/******/ 		for(var moduleId in outdatedDependencies) {
/******/ 			if(Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)) {
/******/ 				var module = installedModules[moduleId];
/******/ 				var moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 				var callbacks = [];
/******/ 				for(var i = 0; i < moduleOutdatedDependencies.length; i++) {
/******/ 					var dependency = moduleOutdatedDependencies[i];
/******/ 					var cb = module.hot._acceptedDependencies[dependency];
/******/ 					if(callbacks.indexOf(cb) >= 0) continue;
/******/ 					callbacks.push(cb);
/******/ 				}
/******/ 				for(var i = 0; i < callbacks.length; i++) {
/******/ 					var cb = callbacks[i];
/******/ 					try {
/******/ 						cb(outdatedDependencies);
/******/ 					} catch(err) {
/******/ 						if(!error)
/******/ 							error = err;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// Load self accepted modules
/******/ 		for(var i = 0; i < outdatedSelfAcceptedModules.length; i++) {
/******/ 			var item = outdatedSelfAcceptedModules[i];
/******/ 			var moduleId = item.module;
/******/ 			hotCurrentParents = [moduleId];
/******/ 			try {
/******/ 				__webpack_require__(moduleId);
/******/ 			} catch(err) {
/******/ 				if(typeof item.errorHandler === "function") {
/******/ 					try {
/******/ 						item.errorHandler(err);
/******/ 					} catch(err) {
/******/ 						if(!error)
/******/ 							error = err;
/******/ 					}
/******/ 				} else if(!error)
/******/ 					error = err;
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// handle errors in accept handlers and self accepted module load
/******/ 		if(error) {
/******/ 			hotSetStatus("fail");
/******/ 			return callback(error);
/******/ 		}
/******/ 	
/******/ 		hotSetStatus("idle");
/******/ 		callback(null, outdatedModules);
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			hot: hotCreateModule(moduleId),
/******/ 			parents: hotCurrentParents,
/******/ 			children: []
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, hotCreateRequire(moduleId));
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// __webpack_hash__
/******/ 	__webpack_require__.h = function() { return hotCurrentHash; };
/******/
/******/ 	// Load entry module and return exports
/******/ 	return hotCreateRequire(0)(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _lw = __webpack_require__(1);
	
	// On messsage received
	self.onmessage = function (event) {
	    if (event.data.cmd === 'start') {
	        start(event.data);
	    }
	};
	
	// Start job
	function start(data) {
	
	    // Create RasterToGcode object
	    var rasterToGcode = new _lw.RasterToGcode(data.settings);
	    Object.assign(rasterToGcode, data.properties);
	    // Register events callbacks
	    rasterToGcode.on('progress', function (event) {
	        self.postMessage(_extends({ event: 'onProgress' }, event));
	    }).on('done', function (event) {
	        self.postMessage(_extends({ event: 'onDone' }, event));
	    }).on('abort', function () {
	        self.postMessage({ event: 'onAbort' });
	    });
	
	    self.postMessage({ event: 'start' });
	    rasterToGcode.run();
	}
	
	// Abort job
	function abort() {
	    rasterToGcode.abort();
	}

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define("RasterToGcode", [], factory);
		else if(typeof exports === 'object')
			exports["RasterToGcode"] = factory();
		else
			root["RasterToGcode"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	/******/
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = __webpack_require__(1);
	
	
	/***/ },
	/* 1 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		
		Object.defineProperty(exports, "__esModule", {
		    value: true
		});
		exports.RasterToGcode = undefined;
		
		var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
		
		var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
		
		var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
		
		var _lw = __webpack_require__(2);
		
		var _lw2 = _interopRequireDefault(_lw);
		
		function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
		
		function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
		
		function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
		
		function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
		
		// RasterToGcode class
		var RasterToGcode = function (_CanvasGrid) {
		    _inherits(RasterToGcode, _CanvasGrid);
		
		    // Class constructor...
		    function RasterToGcode(settings) {
		        _classCallCheck(this, RasterToGcode);
		
		        // Defaults settings
		        settings = Object.assign({
		            ppi: { x: 254, y: 254 }, // Pixel Per Inch (25.4 ppi == 1 ppm)
		
		            toolDiameter: 0.1, // Tool diameter in millimeters
		            rapidRate: 1500, // Rapid rate in mm/min (G0 F value) nullish value to disable
		            feedRate: 500, // Feed rate in mm/min (G1 F value)
		            rateUnit: 'mm/min', // Rapid/Feed rate unit [mm/min, mm/sec]
		
		            beamRange: { min: 0, max: 1 }, // Beam power range (Firmware value)
		            beamPower: { min: 0, max: 100 }, // Beam power (S value) as percentage of beamRange
		
		            milling: false, // EXPERIMENTAL
		            zSafe: 5, // Safe Z for fast move
		            zSurface: 0, // Usinable surface (white pixels)
		            zDepth: -10, // Z depth (black pixels)
		            passDepth: 1, // Pass depth in millimeters
		
		            offsets: { X: 0, Y: 0 }, // Global coordinates offsets
		            trimLine: true, // Trim trailing white pixels
		            joinPixel: true, // Join consecutive pixels with same intensity
		            burnWhite: true, // [true = G1 S0 | false = G0] on inner white pixels
		            verboseG: false, // Output verbose GCode (print each commands)
		            diagonal: false, // Go diagonally (increase the distance between points)
		            overscan: 0, // Add some extra white space (in millimeters) before and after each line
		
		            precision: { X: 2, Y: 2, S: 4 }, // Number of decimals for each commands
		
		            nonBlocking: true, // Use setTimeout to avoid blocking the UI
		
		            filters: {
		                smoothing: 0, // Smoothing the input image ?
		                brightness: 0, // Image brightness [-255 to +255]
		                contrast: 0, // Image contrast [-255 to +255]
		                gamma: 0, // Image gamma correction [0.01 to 7.99]
		                grayscale: 'none', // Graysale algorithm [average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
		                shadesOfGray: 256, // Number of shades of gray [2-256]
		                invertColor: false // Invert color...
		            },
		
		            onProgress: null, // On progress callbacks
		            onProgressContext: null, // On progress callback context
		
		            onDone: null, // On done callback
		            onDoneContext: null, // On done callback context
		
		            onAbort: null, // On abort callback
		            onAbortContext: null // On abort callback context
		        }, settings || {});
		
		        // Init properties
		
		        // Milling settings
		        var _this = _possibleConstructorReturn(this, (RasterToGcode.__proto__ || Object.getPrototypeOf(RasterToGcode)).call(this, settings));
		
		        if (_this.milling) {
		            if (_this.zSafe < _this.zSurface) {
		                throw new Error('"zSafe" must be greater to "zSurface"');
		            }
		
		            _this.passes = Math.abs(Math.floor(_this.zDepth / _this.passDepth));
		        }
		
		        // Negative beam size ?
		        if (_this.toolDiameter <= 0) {
		            throw new Error('"toolDiameter" must be positive');
		        }
		
		        // Uniforme ppi
		        if (!_this.ppi.x) {
		            _this.ppi = { x: _this.ppi, y: _this.ppi };
		        }
		
		        // Calculate PPM = Pixel Per Millimeters
		        _this.ppm = {
		            x: parseFloat((2540 / (_this.ppi.x * 100)).toFixed(10)),
		            y: parseFloat((2540 / (_this.ppi.y * 100)).toFixed(10))
		        };
		
		        // Calculate scale ratio
		        _this.scaleRatio = {
		            x: _this.ppm.x / _this.toolDiameter,
		            y: _this.ppm.y / _this.toolDiameter
		        };
		
		        // State...
		        _this.running = false;
		        _this.gcode = null;
		        _this.gcodes = null;
		        _this.currentLine = null;
		        _this.lastCommands = null;
		
		        // Output size in millimeters
		        _this.outputSize = { width: 0, height: 0 };
		
		        // G0 command
		        _this.G1 = ['G', 1];
		        _this.G0 = ['G', _this.burnWhite ? 1 : 0];
		
		        // Calculate beam offset
		        _this.beamOffset = _this.toolDiameter * 1000 / 2000;
		
		        // Calculate real beam range
		        _this.realBeamRange = {
		            min: _this.beamRange.max / 100 * _this.beamPower.min,
		            max: _this.beamRange.max / 100 * _this.beamPower.max
		        };
		
		        // Adjuste feed rate to mm/min
		        if (_this.rateUnit === 'mm/sec') {
		            _this.feedRate *= 60;
		
		            if (_this.rapidRate) {
		                _this.rapidRate *= 60;
		            }
		        }
		
		        // Register user callbacks
		        _this._registerUserCallbacks(_this);
		        return _this;
		    }
		
		    // Register user callbacks
		
		
		    _createClass(RasterToGcode, [{
		        key: '_registerUserCallbacks',
		        value: function _registerUserCallbacks(callbacks) {
		            // Register user callbacks
		            callbacks.onProgress && this.on('progress', callbacks.onProgress, callbacks.onProgressContext);
		            callbacks.onAbort && this.on('abort', callbacks.onAbort, callbacks.onAbortContext);
		            callbacks.onDone && this.on('done', callbacks.onDone, callbacks.onDoneContext);
		        }
		
		        // Process image
		
		    }, {
		        key: '_processImage',
		        value: function _processImage() {
		            // Call parent method
		            _get(RasterToGcode.prototype.__proto__ || Object.getPrototypeOf(RasterToGcode.prototype), '_processImage', this).call(this);
		
		            // Calculate output size
		            this.outputSize = {
		                width: this.size.width * (this.toolDiameter * 1000) / 1000,
		                height: this.size.height * (this.toolDiameter * 1000) / 1000
		            };
		        }
		
		        // Abort job
		
		    }, {
		        key: 'abort',
		        value: function abort() {
		            this.running = false;
		        }
		
		        // Process image and return gcode string
		
		    }, {
		        key: 'run',
		        value: function run(settings) {
		            if (this.running) {
		                return;
		            }
		
		            // Reset state
		            this.running = true;
		            this.gcode = [];
		            this.gcodes = [];
		            this.lastCommands = {};
		            this.currentLine = null;
		
		            // Defaults settings
		            settings = settings || {};
		
		            // Register user callbacks
		            this._registerUserCallbacks(settings);
		
		            // Non blocking mode ?
		            var nonBlocking = this.nonBlocking;
		
		            if (settings.nonBlocking !== undefined) {
		                nonBlocking = settings.nonBlocking;
		            }
		
		            // Add gcode header
		            this._addHeader();
		
		            // Scan type ?
		            if (this.diagonal) {
		                this._scanDiagonally(nonBlocking);
		            } else {
		                this._scanHorizontally(nonBlocking);
		            }
		
		            if (!nonBlocking) {
		                return this.gcode;
		            }
		        }
		    }, {
		        key: '_addHeader',
		        value: function _addHeader() {
		            // Base headers
		            this.gcode.push('; Generated by LaserWeb (lw.raster-to-gcode.js)', '; Size       : ' + this.outputSize.width + ' x ' + this.outputSize.height + ' mm', '; PPI        : x: ' + this.ppi.x + ' - y: ' + this.ppi.y, '; PPM        : x: ' + this.ppm.x + ' - y: ' + this.ppm.y, '; Tool diam. : ' + this.toolDiameter + ' mm', '; Feed rate  : ' + this.feedRate + ' ' + this.rateUnit);
		
		            if (this.rapidRate) {
		                this.gcode.push('; Rapid rate  : ' + this.rapidRate + ' ' + this.rateUnit);
		            }
		
		            if (this.milling) {
		                this.gcode.push('; Z safe     : ' + this.zSafe, '; Z surface  : ' + this.zSurface, '; Z depth    : ' + this.zDepth);
		            } else {
		                this.gcode.push('; Beam range : ' + this.beamRange.min + ' to ' + this.beamRange.max, '; Beam power : ' + this.beamPower.min + ' to ' + this.beamPower.max + ' %');
		            }
		
		            // Print activated options
		            var options = ['smoothing', 'trimLine', 'joinPixel', 'burnWhite', 'verboseG', 'diagonal'];
		
		            for (var i = options.length - 1; i >= 0; i--) {
		                if (!this[options[i]]) {
		                    options.splice(i, 1);
		                }
		            }
		
		            if (options.length) {
		                this.gcode.push('; Options    : ' + options.join(', '));
		            }
		
		            // Set feed rates
		            this.gcode.push('');
		
		            if (this.rapidRate) {
		                this.gcode.push('G0 F' + this.rapidRate);
		            }
		
		            this.gcode.push('G1 F' + this.feedRate);
		            this.gcode.push('');
		        }
		
		        // Map S value to pixel power
		
		    }, {
		        key: '_mapPixelPower',
		        value: function _mapPixelPower(value) {
		            var range = this.milling ? { min: 0, max: this.zDepth } : this.realBeamRange;
		            return value * (range.max - range.min) / 255 + range.min;
		        }
		
		        // Compute and return a command, return null if not changed
		
		    }, {
		        key: '_command',
		        value: function _command(name, value) {
		            // If the value argument is an object
		            if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
		                // Computed commands line
		                var commands = Array.prototype.slice.call(arguments);
		                var command = void 0,
		                    line = [];
		
		                // for each command
		                for (var i = 0, il = commands.length; i < il; i++) {
		                    command = this._command.apply(this, commands[i]);
		                    command && line.push(command);
		                }
		
		                // Return the line if not empty
		                return line.length ? line.join(' ') : null;
		            }
		
		            // Format the value
		            value = value.toFixed(this.precision[name] || 0);
		
		            // If the value was changed or if verbose mode on
		            if (this.verboseG || value !== this.lastCommands[name]) {
		                this.lastCommands[name] = value;
		                return name + value;
		            }
		
		            // No change
		            return null;
		        }
		
		        // Get a pixel power value from the canvas data grid
		
		    }, {
		        key: '_getPixelPower',
		        value: function _getPixelPower(x, y, defaultValue) {
		            try {
		                // Reverse Y value since canvas as top/left origin
		                y = this.size.height - y - 1;
		
		                // Get pixel info
		                var pixel = this.getPixel(x, y);
		
		                // Reversed gray value [ 0 = white | 255 = black ]
		                return 255 - pixel.gray;
		            } catch (error) {
		                if (arguments.length === 3) {
		                    return defaultValue;
		                }
		                throw error;
		            }
		        }
		
		        // Get a point from the current line with real world coordinates
		
		    }, {
		        key: '_getPoint',
		        value: function _getPoint(index) {
		            // Get the point object from the current line
		            var point = this.currentLine[index];
		
		            // No point
		            if (!point) {
		                return null;
		            }
		
		            // Commands
		            point.G = point.s ? ['G', 1] : this.G0;
		            point.X = point.x * this.toolDiameter + this.offsets.X;
		            point.Y = point.y * this.toolDiameter + this.offsets.Y;
		            point.S = this._mapPixelPower(point.s);
		
		            // Offsets
		            if (this.diagonal) {
		                // Vertical offset
		                point.Y += this.toolDiameter;
		
		                // Horizontal offset
		                if (point.first || point.lastWhite) {
		                    point.X += this.beamOffset;
		                    point.Y -= this.beamOffset;
		                } else if (point.last || point.lastColored) {
		                    point.X -= this.beamOffset;
		                    point.Y += this.beamOffset;
		                }
		            } else {
		                // Vertical offset
		                point.Y += this.beamOffset;
		
		                // Horizontal offset
		                if (point.first || point.lastWhite) {
		                    point.X += this.beamOffset;
		                } else if (point.last || point.lastColored) {
		                    point.X -= this.beamOffset;
		                }
		            }
		
		            // Return the point
		            return point;
		        }
		
		        // Remove all trailing white spaces from the current line
		
		    }, {
		        key: '_trimCurrentLine',
		        value: function _trimCurrentLine() {
		            // Remove white spaces from the left
		            var point = this.currentLine[0];
		
		            while (point && !point.p) {
		                this.currentLine.shift();
		                point = this.currentLine[0];
		            }
		
		            // Remove white spaces from the right
		            point = this.currentLine[this.currentLine.length - 2];
		
		            while (point && !point.p) {
		                this.currentLine.pop();
		                point = this.currentLine[this.currentLine.length - 2];
		            }
		
		            // Return the new line length
		            return this.currentLine.length;
		        }
		
		        // Join pixel with same power
		
		    }, {
		        key: '_reduceCurrentLine',
		        value: function _reduceCurrentLine() {
		            // Line too short to be reduced
		            if (this.currentLine.length < 3) {
		                return this.currentLine.length;
		            }
		
		            // Extract all points exept the first one
		            var points = this.currentLine.splice(1);
		
		            // Get current power
		            var power = this.currentLine[0].p;
		
		            // For each extracted point
		            for (var point, i = 0, il = points.length - 1; i < il; i++) {
		                // Current point
		                point = points[i];
		
		                // On power change
		                if (power !== point.p) {
		                    this.currentLine.push(point);
		                }
		
		                // Update power
		                power = point.p;
		            }
		
		            // Add last point
		            this.currentLine.push(points[i]);
		        }
		
		        // Add extra white pixels at the ends
		
		    }, {
		        key: '_overscanCurrentLine',
		        value: function _overscanCurrentLine(reversed) {
		            // Number of pixels to add on each side
		            var pixels = this.overscan / this.ppm.x;
		
		            // Get first/last point
		            var firstPoint = this.currentLine[0];
		            var lastPoint = this.currentLine[this.currentLine.length - 1];
		
		            // Is last white/colored point ?
		            firstPoint.s && (firstPoint.lastWhite = true);
		            lastPoint.s && (lastPoint.lastColored = true);
		
		            // Reversed line ?
		            reversed ? lastPoint.s = 0 : firstPoint.s = 0;
		
		            // Create left/right points
		            var rightPoint = { x: lastPoint.x + pixels, y: lastPoint.y, s: 0, p: 0 };
		            var leftPoint = { x: firstPoint.x - pixels, y: firstPoint.y, s: 0, p: 0 };
		
		            if (this.diagonal) {
		                leftPoint.y += pixels;
		                rightPoint.y -= pixels;
		            }
		
		            // Add left/right points to current line
		            this.currentLine.unshift(leftPoint);
		            this.currentLine.push(rightPoint);
		        }
		
		        // Process current line and return an array of GCode text lines
		
		    }, {
		        key: '_processCurrentLine',
		        value: function _processCurrentLine(reversed) {
		            if (this.milling) {
		                return this._processMillingLine(reversed);
		            }
		
		            return this._processLaserLine(reversed);
		        }
		
		        // Process current line and return an array of GCode text lines
		
		    }, {
		        key: '_processMillingLine',
		        value: function _processMillingLine(reversed) {
		            var _this2 = this;
		
		            // Skip empty line
		            if (!this._trimCurrentLine()) {
		                return null;
		            }
		
		            // Join pixel with same power
		            if (this.joinPixel) {
		                this._reduceCurrentLine();
		            }
		
		            // Mark first and last point on the current line
		            this.currentLine[0].first = true;
		            this.currentLine[this.currentLine.length - 1].last = true;
		
		            // Reversed line ?
		            if (reversed) {
		                this.currentLine = this.currentLine.reverse();
		            }
		
		            // Point index
		            var point = void 0,
		                index = 0;
		
		            // Init loop vars...
		            var command = void 0,
		                gcode = [];
		
		            var addCommand = function addCommand() {
		                command = _this2._command.apply(_this2, arguments);
		                command && gcode.push(command);
		            };
		
		            // Get first point
		            point = this._getPoint(index);
		
		            var plung = false;
		            var Z = void 0,
		                zMax = void 0;
		
		            var pass = function pass(passNum) {
		                // Move to start of the line
		                addCommand(['G', 0], ['Z', _this2.zSafe]);
		                addCommand(['G', 0], ['X', point.X], ['Y', point.Y]);
		                addCommand(['G', 0], ['Z', _this2.zSurface]);
		
		                // For each point on the line
		                while (point) {
		                    if (point.S) {
		                        if (plung) {
		                            addCommand(['G', 0], ['Z', _this2.zSurface]);
		                            plung = false;
		                        }
		
		                        Z = point.S;
		                        zMax = _this2.passDepth * passNum;
		
		                        // Last pass
		                        if (passNum < _this2.passes) {
		                            Z = Math.max(Z, -zMax);
		                        }
		
		                        addCommand(['G', 1], ['Z', _this2.zSurface + Z]);
		                        addCommand(['G', 1], ['X', point.X], ['Y', point.Y]);
		                    } else {
		                        if (plung) {
		                            addCommand(['G', 1], ['Z', _this2.zSurface]);
		                            plung = false;
		                        }
		
		                        addCommand(['G', 0], ['Z', _this2.zSafe]);
		                        addCommand(['G', 0], ['X', point.X], ['Y', point.Y]);
		                    }
		
		                    if (point.lastWhite || point.lastColored) {
		                        plung = true;
		                    }
		
		                    // Get next point
		                    point = _this2._getPoint(++index);
		                }
		
		                // Move to Z safe
		                addCommand(['G', 1], ['Z', _this2.zSurface]);
		                addCommand(['G', 0], ['Z', _this2.zSafe]);
		            };
		
		            for (var i = 1; i <= this.passes; i++) {
		                pass(i);
		
		                if (!gcode.length) {
		                    break;
		                }
		
		                if (this.gcodes.length < i) {
		                    this.gcodes.push([]);
		                } else {
		                    this.gcodes[i - 1].push.apply(this.gcodes[i - 1], gcode);
		                }
		
		                index = 0;
		                gcode = [];
		                point = this._getPoint(index);
		
		                this.lastCommands = {};
		            }
		
		            // Not sure what to return...
		            return null;
		        }
		
		        // Process current line and return an array of GCode text lines
		
		    }, {
		        key: '_processLaserLine',
		        value: function _processLaserLine(reversed) {
		            var _this3 = this;
		
		            // Trim trailing white spaces ?
		            if (this.trimLine && !this._trimCurrentLine()) {
		                // Skip empty line
		                return null;
		            }
		
		            // Join pixel with same power
		            if (this.joinPixel) {
		                this._reduceCurrentLine();
		            }
		
		            // Overscan ?
		            if (this.overscan) {
		                this._overscanCurrentLine(reversed);
		            }
		
		            // Mark first and last point on the current line
		            this.currentLine[0].first = true;
		            this.currentLine[this.currentLine.length - 1].last = true;
		
		            // Reversed line ?
		            if (reversed) {
		                this.currentLine = this.currentLine.reverse();
		            }
		
		            // Point index
		            var point = void 0,
		                index = 0;
		
		            // Init loop vars...
		            var command = void 0,
		                gcode = [];
		
		            var addCommand = function addCommand() {
		                command = _this3._command.apply(_this3, arguments);
		                command && gcode.push(command);
		            };
		
		            // Get first point
		            point = this._getPoint(index);
		
		            // Move to start of the line
		            addCommand(this.G0, ['X', point.X], ['Y', point.Y], ['S', 0]);
		
		            // Get next point
		            point = this._getPoint(++index);
		
		            // For each point on the line
		            while (point) {
		                // Burn to next point
		                addCommand(point.G, ['X', point.X], ['Y', point.Y], ['S', point.S]);
		
		                // Get next point
		                point = this._getPoint(++index);
		            }
		
		            // Return gcode commands array
		            if (gcode.length) {
		                return gcode;
		            }
		
		            // Empty line
		            return null;
		        }
		
		        // Parse horizontally
		
		    }, {
		        key: '_scanHorizontally',
		        value: function _scanHorizontally(nonBlocking) {
		            var _this4 = this;
		
		            // Init loop vars
		            var x = 0,
		                y = 0;
		            var s = void 0,
		                p = void 0,
		                point = void 0,
		                gcode = void 0;
		            var w = this.size.width;
		            var h = this.size.height;
		
		            var reversed = false;
		            var lastWhite = false;
		            var lastColored = false;
		
		            var computeCurrentLine = function computeCurrentLine() {
		                // Reset current line
		                _this4.currentLine = [];
		
		                // Reset point object
		                point = null;
		
		                // For each pixel on the line
		                for (x = 0; x <= w; x++) {
		                    // Get pixel power
		                    s = p = _this4._getPixelPower(x, y, p);
		
		                    // Is last white/colored pixel
		                    lastWhite = point && !point.p && p;
		                    lastColored = point && point.p && !p;
		
		                    // Pixel color from last one on normal line
		                    if (!reversed && point) {
		                        s = point.p;
		                    }
		
		                    // Create point object
		                    point = { x: x, y: y, s: s, p: p };
		
		                    // Set last white/colored pixel
		                    lastWhite && (point.lastWhite = true);
		                    lastColored && (point.lastColored = true);
		
		                    // Add point to current line
		                    _this4.currentLine.push(point);
		                }
		            };
		
		            var percent = 0;
		            var lastPercent = 0;
		
		            var processCurrentLine = function processCurrentLine() {
		                // Process pixels line
		                gcode = _this4._processCurrentLine(reversed);
		
		                // Call progress callback
		                percent = Math.round(y / h * 100);
		
		                if (percent > lastPercent) {
		                    _this4._onProgress({ gcode: gcode, percent: percent });
		                }
		
		                lastPercent = percent;
		
		                // Skip empty gcode line
		                if (!gcode) {
		                    return;
		                }
		
		                // Toggle line state
		                reversed = !reversed;
		
		                // Concat line
		                _this4.gcode.push.apply(_this4.gcode, gcode);
		            };
		
		            var processNextLine = function processNextLine() {
		                // Aborted ?
		                if (!_this4.running) {
		                    return _this4._onAbort();
		                }
		
		                // Process line...
		                computeCurrentLine();
		                processCurrentLine();
		
		                y++;
		
		                if (y < h) {
		                    if (nonBlocking) {
		                        setTimeout(processNextLine, 0);
		                    } else {
		                        processNextLine();
		                    }
		                } else {
		                    if (_this4.milling) {
		                        _this4.gcodes.forEach(function (gcode) {
		                            _this4.gcode.push.apply(_this4.gcode, gcode);
		                        });
		                    }
		
		                    _this4._onDone({ gcode: _this4.gcode });
		                    _this4.running = false;
		                }
		            };
		
		            processNextLine();
		        }
		
		        // Parse diagonally
		
		    }, {
		        key: '_scanDiagonally',
		        value: function _scanDiagonally(nonBlocking) {
		            var _this5 = this;
		
		            // Init loop vars
		            var x = 0,
		                y = 0;
		            var s = void 0,
		                p = void 0,
		                point = void 0,
		                gcode = void 0;
		            var w = this.size.width;
		            var h = this.size.height;
		
		            var totalLines = w + h - 1;
		            var lineNum = 0;
		            var reversed = false;
		            var lastWhite = false;
		            var lastColored = false;
		
		            var computeCurrentLine = function computeCurrentLine(x, y) {
		                // Reset current line
		                _this5.currentLine = [];
		
		                // Reset point object
		                point = null;
		
		                // Increment line num
		                lineNum++;
		
		                while (true) {
		                    // Y limit reached !
		                    if (y < -1 || y == h) {
		                        break;
		                    }
		
		                    // X limit reached !
		                    if (x < 0 || x > w) {
		                        break;
		                    }
		
		                    // Get pixel power
		                    s = p = _this5._getPixelPower(x, y, p);
		
		                    // Is last white/colored pixel
		                    lastWhite = point && !point.p && p;
		                    lastColored = point && point.p && !p;
		
		                    // Pixel color from last one on normal line
		                    if (!reversed && point) {
		                        s = point.p;
		                    }
		
		                    // Create point object
		                    point = { x: x, y: y, s: s, p: p };
		
		                    // Set last white/colored pixel
		                    lastWhite && (point.lastWhite = true);
		                    lastColored && (point.lastColored = true);
		
		                    // Add the new point
		                    _this5.currentLine.push(point);
		
		                    // Next coords
		                    x++;
		                    y--;
		                }
		            };
		
		            var percent = 0;
		            var lastPercent = 0;
		
		            var processCurrentLine = function processCurrentLine() {
		                // Process pixels line
		                gcode = _this5._processCurrentLine(reversed);
		
		                // Call progress callback
		                percent = Math.round(lineNum / totalLines * 100);
		
		                if (percent > lastPercent) {
		                    _this5._onProgress({ gcode: gcode, percent: percent });
		                }
		
		                lastPercent = percent;
		
		                // Skip empty gcode line
		                if (!gcode) {
		                    return;
		                }
		
		                // Toggle line state
		                reversed = !reversed;
		
		                // Concat line
		                _this5.gcode.push.apply(_this5.gcode, gcode);
		            };
		
		            var processNextLine = function processNextLine() {
		                // Aborted ?
		                if (!_this5.running) {
		                    return _this5._onAbort();
		                }
		
		                // Process line...
		                computeCurrentLine(x, y);
		                processCurrentLine();
		
		                if (!x) y++;else x++;
		
		                if (y === h) {
		                    x++;
		                    y--;
		                }
		
		                if (y < h && x < w) {
		                    if (nonBlocking) {
		                        setTimeout(processNextLine, 0);
		                    } else {
		                        processNextLine();
		                    }
		                } else {
		                    _this5._onDone({ gcode: _this5.gcode });
		                    _this5.running = false;
		                }
		            };
		
		            processNextLine();
		        }
		    }, {
		        key: '_onProgress',
		        value: function _onProgress(event) {
		            //console.log('progress:', event.percent)
		        }
		    }, {
		        key: '_onDone',
		        value: function _onDone(event) {
		            //console.log('done:', event.gcode.length)
		        }
		    }, {
		        key: '_onAbort',
		        value: function _onAbort() {
		            //console.log('abort')
		        }
		    }, {
		        key: 'on',
		        value: function on(event, callback, context) {
		            var _this6 = this;
		
		            var method = '_on' + event[0].toUpperCase() + event.slice(1);
		
		            if (!this[method] || typeof this[method] !== 'function') {
		                throw new Error('Undefined event: ' + event);
		            }
		
		            this[method] = function (event) {
		                return callback.call(context || _this6, event);
		            };
		
		            return this;
		        }
		
		        // Return the bitmap height-map
		
		    }, {
		        key: 'getHeightMap',
		        value: function getHeightMap(settings) {
		            var _this7 = this;
		
		            if (this.running) {
		                return;
		            }
		
		            // Init loop vars
		            this.running = true;
		            var heightMap = [];
		
		            var x = 0;
		            var y = 0;
		            var w = this.size.width;
		            var h = this.size.height;
		
		            var percent = 0;
		            var lastPercent = 0;
		
		            // Defaults settings
		            settings = settings || {};
		
		            // Register user callbacks
		            this._registerUserCallbacks(settings);
		
		            // Non blocking mode ?
		            var nonBlocking = this.nonBlocking;
		
		            if (settings.nonBlocking !== undefined) {
		                nonBlocking = settings.nonBlocking;
		            }
		
		            var computeCurrentLine = function computeCurrentLine() {
		                // Reset current line
		                var pixels = [];
		
		                // For each pixel on the line
		                for (x = 0; x < w; x++) {
		                    pixels.push(_this7._mapPixelPower(_this7._getPixelPower(x, y)));
		                }
		
		                // Call progress callback
		                percent = Math.round(y / h * 100);
		
		                if (percent > lastPercent) {
		                    //onProgress.call(settings.progressContext || this, { pixels, percent })
		                    _this7._onProgress({ pixels: pixels, percent: percent });
		                }
		
		                lastPercent = percent;
		
		                // Add pixels line
		                heightMap.push(pixels);
		            };
		
		            var processNextLine = function processNextLine() {
		                // Aborted ?
		                if (!_this7.running) {
		                    return _this7._onAbort();
		                }
		
		                // Process line...
		                computeCurrentLine();
		
		                y++;
		
		                if (y < h) {
		                    if (nonBlocking) {
		                        setTimeout(processNextLine, 0);
		                    } else {
		                        processNextLine();
		                    }
		                } else {
		                    //onDone.call(settings.doneContext || this, { heightMap })
		                    _this7._onDone({ heightMap: heightMap });
		                    _this7.running = false;
		                }
		            };
		
		            processNextLine();
		
		            if (!nonBlocking) {
		                return heightMap;
		            }
		        }
		    }]);
		
		    return RasterToGcode;
		}(_lw2.default);
		
		// Exports
		
		
		exports.RasterToGcode = RasterToGcode;
		exports.default = RasterToGcode;
	
	/***/ },
	/* 2 */
	/***/ function(module, exports, __webpack_require__) {
	
		(function webpackUniversalModuleDefinition(root, factory) {
			if(true)
				module.exports = factory();
			else if(typeof define === 'function' && define.amd)
				define("CanvasGrid", [], factory);
			else if(typeof exports === 'object')
				exports["CanvasGrid"] = factory();
			else
				root["CanvasGrid"] = factory();
		})(this, function() {
		return /******/ (function(modules) { // webpackBootstrap
		/******/ 	// The module cache
		/******/ 	var installedModules = {};
		/******/
		/******/ 	// The require function
		/******/ 	function __webpack_require__(moduleId) {
		/******/
		/******/ 		// Check if module is in cache
		/******/ 		if(installedModules[moduleId])
		/******/ 			return installedModules[moduleId].exports;
		/******/
		/******/ 		// Create a new module (and put it into the cache)
		/******/ 		var module = installedModules[moduleId] = {
		/******/ 			exports: {},
		/******/ 			id: moduleId,
		/******/ 			loaded: false
		/******/ 		};
		/******/
		/******/ 		// Execute the module function
		/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
		/******/
		/******/ 		// Flag the module as loaded
		/******/ 		module.loaded = true;
		/******/
		/******/ 		// Return the exports of the module
		/******/ 		return module.exports;
		/******/ 	}
		/******/
		/******/
		/******/ 	// expose the modules object (__webpack_modules__)
		/******/ 	__webpack_require__.m = modules;
		/******/
		/******/ 	// expose the module cache
		/******/ 	__webpack_require__.c = installedModules;
		/******/
		/******/ 	// __webpack_public_path__
		/******/ 	__webpack_require__.p = "";
		/******/
		/******/ 	// Load entry module and return exports
		/******/ 	return __webpack_require__(0);
		/******/ })
		/************************************************************************/
		/******/ ([
		/* 0 */
		/***/ function(module, exports, __webpack_require__) {
		
			module.exports = __webpack_require__(1);
		
		
		/***/ },
		/* 1 */
		/***/ function(module, exports, __webpack_require__) {
		
			'use strict';
			
			Object.defineProperty(exports, "__esModule", {
			    value: true
			});
			exports.CanvasGrid = undefined;
			
			var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
			
			var _lw = __webpack_require__(2);
			
			var _lw2 = _interopRequireDefault(_lw);
			
			function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
			
			function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
			
			// CanvasGrid class
			var CanvasGrid = function () {
			    // Class constructor...
			    function CanvasGrid(settings) {
			        _classCallCheck(this, CanvasGrid);
			
			        // Init properties
			        this.cellSize = 1024;
			        this.scaleRatio = { x: 1, y: 1 };
			        this.filters = {};
			
			        Object.assign(this, settings || {});
			
			        if (!this.scaleRatio.x) {
			            this.scaleRatio = { x: this.scaleRatio, y: this.scaleRatio };
			        }
			
			        this.size = { width: 0, height: 0, cols: 0, rows: 0 };
			        this.file = null;
			        this.image = null;
			        this.url = null;
			        this.canvas = [];
			        this.pixels = [];
			    }
			
			    // <input> can be Image, File, URL object or URL string (http://* or data:image/*)
			
			
			    _createClass(CanvasGrid, [{
			        key: 'load',
			        value: function load(input) {
			            // Load File object
			            if (input instanceof File) {
			                return this.loadFromFile(input);
			            }
			
			            // Load Image object
			            if (input instanceof Image) {
			                return this.loadFromImage(input);
			            }
			
			            // Load URL object
			            if (typeof input === 'string' || input instanceof URL) {
			                return this.loadFromURL(input.trim());
			            }
			
			            // Return rejected promise with an Error object
			            return Promise.reject(new Error('Unsupported input format.'));
			        }
			
			        // Load image
			
			    }, {
			        key: '_loadImage',
			        value: function _loadImage(src, reject, resolve) {
			            var _this = this;
			
			            // Create Image object
			            var image = new Image();
			
			            // Register for load and error events
			            image.onload = function (event) {
			                _this.loadFromImage(image).then(resolve).catch(reject);
			            };
			
			            image.onerror = function (event) {
			                reject(new Error('An error occurred while loading the image : ' + src));
			            };
			
			            // Load the image from File url
			            image.src = src;
			        }
			
			        // Load from File object
			
			    }, {
			        key: 'loadFromFile',
			        value: function loadFromFile(input) {
			            var _this2 = this;
			
			            return new Promise(function (resolve, reject) {
			                // Bad input type
			                if (!(input instanceof File)) {
			                    reject(new Error('Input param must be a File object.'));
			                }
			
			                // Set input file
			                _this2.file = input;
			
			                // Load image
			                _this2._loadImage(URL.createObjectURL(input), reject, resolve);
			            });
			        }
			
			        // Load from URL object or string
			
			    }, {
			        key: 'loadFromURL',
			        value: function loadFromURL(input) {
			            var _this3 = this;
			
			            return new Promise(function (resolve, reject) {
			                // Bad input type
			                if (!(input instanceof URL) && typeof input !== 'string') {
			                    reject(new Error('Input param must be a URL string or object.'));
			                }
			
			                // Create url object
			                var url = input instanceof URL ? input : new URL(input);
			
			                // Set url
			                _this3.url = url;
			
			                // Load image
			                _this3._loadImage(url, reject, resolve);
			            });
			        }
			
			        // Load from Image object
			
			    }, {
			        key: 'loadFromImage',
			        value: function loadFromImage(input) {
			            var _this4 = this;
			
			            return new Promise(function (resolve, reject) {
			                // Bad input type
			                if (!(input instanceof Image)) {
			                    reject(new Error('Input param must be a Image object.'));
			                }
			
			                // Set input image
			                _this4.image = input;
			
			                // Process image
			                _this4._processImage();
			
			                // Resolve the promise
			                resolve(_this4);
			            });
			        }
			    }, {
			        key: '_processImage',
			        value: function _processImage() {
			            // Reset canvas grid
			            this.canvas = [];
			            this.pixels = [];
			
			            // Calculate grid size
			            var width = Math.round(this.image.width * this.scaleRatio.x);
			            var height = Math.round(this.image.height * this.scaleRatio.y);
			            var cols = Math.ceil(width / this.cellSize);
			            var rows = Math.ceil(height / this.cellSize);
			
			            this.size = { width: width, height: height, cols: cols, rows: rows };
			
			            // Create canvas grid
			            var line = null;
			            var canvas = null;
			            var pixels = null;
			            var context = null;
			
			            var x = null; // cols
			            var y = null; // rows
			            var sx = null; // scaled cols
			            var sy = null; // scaled rows
			            var sw = null; // scaled width
			            var sh = null; // scaled height
			
			            // For each line
			            for (y = 0; y < this.size.rows; y++) {
			                // Reset current line
			                line = [];
			                pixels = [];
			
			                // For each column
			                for (x = 0; x < this.size.cols; x++) {
			                    // Create canvas element
			                    canvas = document.createElement('canvas');
			
			                    // Set canvas size
			                    if (x === 0 || x < this.size.cols - 1) {
			                        canvas.width = this.size.width < this.cellSize ? this.size.width : this.cellSize;
			                    } else {
			                        // Get the rest for the last item (except the first one)
			                        canvas.width = this.size.width % this.cellSize;
			                    }
			
			                    if (y === 0 || y < this.size.rows - 1) {
			                        canvas.height = this.size.height < this.cellSize ? this.size.height : this.cellSize;
			                    } else {
			                        // Get the rest for the last item (except the first one)
			                        canvas.height = this.size.height % this.cellSize;
			                    }
			
			                    // Get canvas 2d context
			                    context = canvas.getContext('2d');
			
			                    // Fill withe background (avoid alpha chanel calculation)
			                    context.fillStyle = 'white';
			                    context.fillRect(0, 0, canvas.width, canvas.height);
			
			                    // Draw the part of image in the canvas (scale)
			                    sw = canvas.width / this.scaleRatio.x;
			                    sh = canvas.height / this.scaleRatio.y;
			                    sx = x * this.cellSize / this.scaleRatio.x;
			                    sy = y * this.cellSize / this.scaleRatio.y;
			
			                    context.drawImage(this.image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
			
			                    // Apply image filters
			                    (0, _lw2.default)(canvas, this.filters);
			
			                    // Add the canvas to current line
			                    line.push(canvas);
			
			                    // Add the canvas image data to current line
			                    pixels.push(context.getImageData(0, 0, canvas.width, canvas.height).data);
			                }
			
			                // Add the line to canvas grid
			                this.pixels.push(pixels);
			                this.canvas.push(line);
			            }
			        }
			    }, {
			        key: 'getPixel',
			        value: function getPixel(x, y) {
			            // Test coords validity
			            x = parseInt(x);
			            y = parseInt(y);
			
			            if (isNaN(x) || isNaN(y)) {
			                throw new Error('[x, y] params must be Integer.');
			            }
			
			            // Test coords range
			            if (x < 0 || x >= this.size.width) {
			                throw new Error('Out of range: x = ' + x + ', max: ' + this.size.width);
			            }
			
			            if (y < 0 || y >= this.size.height) {
			                throw new Error('Out of range: y = ' + y + ', max: ' + this.size.height);
			            }
			
			            // Calculate target canvas coords
			            var col = parseInt(x / this.cellSize);
			            var row = parseInt(y / this.cellSize);
			
			            // Adjuste x/y values relative to canvas origin
			            col && (x -= this.cellSize * col);
			            row && (y -= this.cellSize * row);
			
			            // Get pixel data
			            var cellSize = this.cellSize;
			
			            if (this.size.width < cellSize) {
			                cellSize = this.size.width;
			            } else if (this.size.width < cellSize * (col + 1)) {
			                cellSize = this.size.width % cellSize;
			            }
			
			            var i = y * (cellSize * 4) + x * 4;
			            var pixels = this.pixels[row][col];
			            var pixelData = pixels.slice(i, i + 4);
			
			            return {
			                color: { r: pixelData[0], g: pixelData[1], b: pixelData[2], a: pixelData[3] },
			                gray: (pixelData[0] + pixelData[1] + pixelData[2]) / 3,
			                grid: { col: col, row: row },
			                coords: { x: x, y: y }
			            };
			        }
			    }]);
			
			    return CanvasGrid;
			}();
			
			// Exports
			
			
			exports.CanvasGrid = CanvasGrid;
			exports.default = CanvasGrid;
		
		/***/ },
		/* 2 */
		/***/ function(module, exports, __webpack_require__) {
		
			(function webpackUniversalModuleDefinition(root, factory) {
				if(true)
					module.exports = factory();
				else if(typeof define === 'function' && define.amd)
					define("CanvasFilter", [], factory);
				else if(typeof exports === 'object')
					exports["CanvasFilter"] = factory();
				else
					root["CanvasFilter"] = factory();
			})(this, function() {
			return /******/ (function(modules) { // webpackBootstrap
			/******/ 	// The module cache
			/******/ 	var installedModules = {};
			/******/
			/******/ 	// The require function
			/******/ 	function __webpack_require__(moduleId) {
			/******/
			/******/ 		// Check if module is in cache
			/******/ 		if(installedModules[moduleId])
			/******/ 			return installedModules[moduleId].exports;
			/******/
			/******/ 		// Create a new module (and put it into the cache)
			/******/ 		var module = installedModules[moduleId] = {
			/******/ 			exports: {},
			/******/ 			id: moduleId,
			/******/ 			loaded: false
			/******/ 		};
			/******/
			/******/ 		// Execute the module function
			/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
			/******/
			/******/ 		// Flag the module as loaded
			/******/ 		module.loaded = true;
			/******/
			/******/ 		// Return the exports of the module
			/******/ 		return module.exports;
			/******/ 	}
			/******/
			/******/
			/******/ 	// expose the modules object (__webpack_modules__)
			/******/ 	__webpack_require__.m = modules;
			/******/
			/******/ 	// expose the module cache
			/******/ 	__webpack_require__.c = installedModules;
			/******/
			/******/ 	// __webpack_public_path__
			/******/ 	__webpack_require__.p = "";
			/******/
			/******/ 	// Load entry module and return exports
			/******/ 	return __webpack_require__(0);
			/******/ })
			/************************************************************************/
			/******/ ([
			/* 0 */
			/***/ function(module, exports, __webpack_require__) {
			
				module.exports = __webpack_require__(1);
			
			
			/***/ },
			/* 1 */
			/***/ function(module, exports) {
			
				'use strict';
				
				Object.defineProperty(exports, "__esModule", {
				    value: true
				});
				// Grayscale algorithms
				var grayscaleAlgorithms = ['none', 'average', 'desaturation', 'decomposition-min', 'decomposition-max', 'luma', 'luma-601', 'luma-709', 'luma-240', 'red-chanel', 'green-chanel', 'blue-chanel'];
				
				// Trucate color value in the 0-255 range
				function color(color) {
				    return color < 0 ? 0 : color > 255 ? 255 : color;
				}
				
				// Filters ...
				function invertColor(data, i, value) {
				    if (value) {
				        data[i] = color(255 - data[i]);
				        data[i + 1] = color(255 - data[i + 1]);
				        data[i + 2] = color(255 - data[i + 2]);
				    }
				}
				
				function brightness(data, i, value) {
				    if (value !== undefined) {
				        data[i] = color(data[i] + value);
				        data[i + 1] = color(data[i + 1] + value);
				        data[i + 2] = color(data[i + 2] + value);
				    }
				}
				
				function contrast(data, i, value) {
				    if (value !== undefined) {
				        data[i] = color(value * (data[i] - 128) + 128);
				        data[i + 1] = color(value * (data[i + 1] - 128) + 128);
				        data[i + 2] = color(value * (data[i + 2] - 128) + 128);
				    }
				}
				
				function gamma(data, i, value) {
				    if (value !== undefined) {
				        data[i] = color(Math.exp(Math.log(255 * (data[i] / 255)) * value));
				        data[i + 1] = color(Math.exp(Math.log(255 * (data[i + 1] / 255)) * value));
				        data[i + 2] = color(Math.exp(Math.log(255 * (data[i + 2] / 255)) * value));
				    }
				}
				
				function grayscale(data, i, algorithm, shades) {
				    // Graysale
				    // http://www.tannerhelland.com/3643/grayscale-image-algorithm-vb6/
				
				    // Unsupported algorithm
				    if (grayscaleAlgorithms.indexOf(algorithm) === -1) {
				        throw new Error('Unsupported grayscale algorithm: ' + algorithm);
				    }
				
				    // None
				    if (algorithm === 'none') {
				        return null;
				    }
				
				    // Get Red/Green/Blue values
				    var gray = void 0;
				    var r = data[i];
				    var g = data[i + 1];
				    var b = data[i + 2];
				
				    switch (algorithm) {
				        case 'average':
				            gray = (r + g + b) / 3;
				            break;
				
				        case 'luma':
				            // Default
				            gray = r * 0.3 + g * 0.59 + b * 0.11;
				            break;
				
				        case 'luma-601':
				            // CCIR-601
				            gray = r * 0.299 + g * 0.587 + b * 0.114;
				            break;
				
				        case 'luma-709':
				            // ITU-R-709
				            gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
				            break;
				
				        case 'luma-240':
				            // SMPTE-240M
				            gray = r * 0.212 + g * 0.701 + b * 0.087;
				            break;
				
				        case 'desaturation':
				            gray = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
				            break;
				
				        case 'decomposition-min':
				            gray = Math.min(r, g, b);
				            break;
				
				        case 'decomposition-max':
				            gray = Math.max(r, g, b);
				            break;
				
				        case 'red-chanel':
				            gray = r;
				            break;
				
				        case 'green-chanel':
				            gray = g;
				            break;
				
				        case 'blue-chanel':
				            gray = b;
				            break;
				    }
				
				    // Shades of gray
				    if (shades !== undefined) {
				        gray = parseInt(gray / shades) * shades;
				    }
				
				    // Force integer
				    gray = parseInt(gray);
				
				    // Set new r/g/b values
				    data[i] = color(gray);
				    data[i + 1] = color(gray);
				    data[i + 2] = color(gray);
				}
				
				// Apply filters on provided canvas
				function canvasFilters(canvas, settings) {
				    settings = Object.assign({}, {
				        smoothing: false, // Smoothing [true|fale]
				        brightness: 0, // Image brightness [-255 to +255]
				        contrast: 0, // Image contrast [-255 to +255]
				        gamma: 0, // Image gamma correction [0.01 to 7.99]
				        grayscale: 'none', // Graysale algorithm [average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
				        shadesOfGray: 256, // Number of shades of gray [2-256]
				        invertColor: false // Invert color...
				    }, settings || {});
				
				    // Get canvas 2d context
				    var context = canvas.getContext('2d');
				
				    // Smoothing
				    if (context.imageSmoothingEnabled !== undefined) {
				        context.imageSmoothingEnabled = settings.smoothing;
				    } else {
				        context.mozImageSmoothingEnabled = settings.smoothing;
				        context.webkitImageSmoothingEnabled = settings.smoothing;
				        context.msImageSmoothingEnabled = settings.smoothing;
				        context.oImageSmoothingEnabled = settings.smoothing;
				    }
				
				    // Get image data
				    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
				    var data = imageData.data;
				
				    var contrastFactor = void 0,
				        brightnessOffset = void 0,
				        gammaCorrection = void 0,
				        shadesOfGrayFactor = void 0;
				
				    if (settings.contrast !== 0) {
				        contrastFactor = 259 * (settings.contrast + 255) / (255 * (259 - settings.contrast));
				    }
				
				    if (settings.brightness !== 0) {
				        brightnessOffset = settings.brightness;
				    }
				
				    if (settings.gamma !== 0) {
				        gammaCorrection = 1 / settings.gamma;
				    }
				
				    // Shades of gray
				    if (settings.shadesOfGray > 1 && settings.shadesOfGray < 256) {
				        shadesOfGrayFactor = 255 / (settings.shadesOfGray - 1);
				    }
				
				    // For each pixel
				    for (var i = 0, il = data.length; i < il; i += 4) {
				        // Apply filters
				        invertColor(data, i, settings.invertColor);
				        brightness(data, i, brightnessOffset);
				        contrast(data, i, contrastFactor);
				        gamma(data, i, gammaCorrection);
				        grayscale(data, i, settings.grayscale, shadesOfGrayFactor);
				    }
				
				    // Write new image data on the context
				    context.putImageData(imageData, 0, 0);
				}
				
				// Exports
				exports.canvasFilters = canvasFilters;
				exports.default = canvasFilters;
			
			/***/ }
			/******/ ])
			});
			;
			//# sourceMappingURL=lw.canvas-filters.js.map
		
		/***/ }
		/******/ ])
		});
		;
		//# sourceMappingURL=lw.canvas-grid.js.map
	
	/***/ }
	/******/ ])
	});
	;
	//# sourceMappingURL=lw.raster-to-gcode.js.map

/***/ }
/******/ ]);
//# sourceMappingURL=d16e03e3d050164ff11a.worker.js.map