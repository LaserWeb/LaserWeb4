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
/******/ 	var hotCurrentHash = "6b5fc44a167d7c77f101"; // eslint-disable-line no-unused-vars
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
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var _camGcodeLathe = __webpack_require__(1);
	
	onmessage = event => {
	    var _event$data = event.data;
	    const settings = _event$data.settings,
	          opIndex = _event$data.opIndex,
	          op = _event$data.op;
	    var _event$data$geometry = _event$data.geometry;
	    const geometry = _event$data$geometry === undefined ? [] : _event$data$geometry;
	    var _event$data$openGeome = _event$data.openGeometry;
	    const openGeometry = _event$data$openGeome === undefined ? [] : _event$data$openGeome;
	    var _event$data$tabGeomet = _event$data.tabGeometry;
	    const tabGeometry = _event$data$tabGeomet === undefined ? [] : _event$data$tabGeomet;
	
	    const errors = [];
	
	    const showAlert = (message, level) => {
	        errors.push({ message, level });
	    };
	    const progress = () => {
	        postMessage(JSON.stringify({ event: "onProgress", gcode, errors }));
	    };
	    const done = gcode => {
	        if (gcode === false && errors.length) {
	            postMessage(JSON.stringify({ event: "onError", errors }));
	        } else {
	            postMessage(JSON.stringify({ event: "onDone", gcode }));
	        }
	    };
	
	    _camGcodeLathe.getLatheGcodeFromOp.apply(undefined, [settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert, done, progress]);
	};
	;

	var _temp = function () {
	    if (typeof __REACT_HOT_LOADER__ === 'undefined') {
	        return;
	    }
	}();

	;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	// Copyright 2017 Todd Fleming
	//
	// This program is free software: you can redistribute it and/or modify
	// it under the terms of the GNU Affero General Public License as published by
	// the Free Software Foundation, either version 3 of the License, or
	// (at your option) any later version.
	// 
	// This program is distributed in the hope that it will be useful,
	// but WITHOUT ANY WARRANTY; without even the implied warranty of
	// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	// GNU Affero General Public License for more details.
	// 
	// You should have received a copy of the GNU Affero General Public License
	// along with this program.  If not, see <http://www.gnu.org/licenses/>.
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	exports.getLatheGcodeFromOp = getLatheGcodeFromOp;
	let GcodeGenerator = class GcodeGenerator {
	    constructor(_ref) {
	        let decimal = _ref.decimal,
	            toolFeedUnits = _ref.toolFeedUnits;
	
	        Object.assign(this, { decimal, toolFeedUnits });
	        if (toolFeedUnits === 'mm/s') this.feedScale = 60;else this.feedScale = 1;
	        this.gcode = '';
	    }
	
	    getMotion(mode) {
	        if (this.motionMode === mode) return '';
	        this.motionMode = mode;
	        return mode + ' ';
	    }
	
	    getFeed(f) {
	        let strF = (f * this.feedScale).toFixed(this.decimal);
	        let roundedF = Number(strF);
	        if (this.f === roundedF) return '';
	        this.f = roundedF;
	        return 'F' + strF + ' ';
	    }
	
	    rapidZ(z) {
	        let strZ = z.toFixed(this.decimal);
	        let roundedZ = Number(strZ);
	        if (this.z === roundedZ) return;
	        this.z = roundedZ;
	        this.gcode += this.getMotion('G0') + 'Z' + strZ + '\n';
	    }
	
	    rapidXDia(xDia, backSide) {
	        if (!backSide) xDia = -xDia;
	        let strX = (xDia / 2).toFixed(this.decimal);
	        let roundedX = Number(strX);
	        if (this.x === roundedX) return;
	        this.x = roundedX;
	        this.gcode += this.getMotion('G0') + 'X' + strX + '\n';
	    }
	
	    moveZ(z, f) {
	        let strZ = z.toFixed(this.decimal);
	        let roundedZ = Number(strZ);
	        if (this.z === roundedZ) return;
	        this.z = roundedZ;
	        this.gcode += this.getMotion('G1') + this.getFeed(f) + 'Z' + strZ + '\n';
	    }
	
	    moveXDia(xDia, backSide, f) {
	        if (!backSide) xDia = -xDia;
	        let strX = (xDia / 2).toFixed(this.decimal);
	        let roundedX = Number(strX);
	        if (this.x === roundedX) return;
	        this.x = roundedX;
	        this.gcode += this.getMotion('G1') + this.getFeed(f) + 'X' + strX + '\n';
	    }
	};
	; // GcodeGenerator
	
	function latheConvFaceTurn(gen, showAlert, props) {
	    let latheToolBackSide = props.latheToolBackSide,
	        latheRapidToDiameter = props.latheRapidToDiameter,
	        latheRapidToZ = props.latheRapidToZ,
	        latheStartZ = props.latheStartZ,
	        latheRoughingFeed = props.latheRoughingFeed,
	        latheRoughingDepth = props.latheRoughingDepth,
	        latheFinishFeed = props.latheFinishFeed,
	        latheFinishDepth = props.latheFinishDepth,
	        latheFinishExtraPasses = props.latheFinishExtraPasses,
	        latheFace = props.latheFace,
	        latheFaceEndDiameter = props.latheFaceEndDiameter,
	        latheTurns = props.latheTurns;
	
	
	    if (latheRapidToDiameter <= 0) return showAlert('latheRapidToDiameter <= 0', 'danger');
	    if (latheStartZ > latheRapidToZ) return showAlert('latheStartZ > latheRapidToZ', 'danger');
	    if (latheRoughingFeed <= 0) return showAlert('latheRoughingFeed <= 0', 'danger');
	    if (latheRoughingDepth <= 0) return showAlert('latheRoughingDepth <= 0', 'danger');
	    if (latheFinishFeed <= 0) return showAlert('latheFinishFeed <= 0', 'danger');
	    if (latheFinishDepth < 0) return showAlert('latheFinishDepth < 0', 'danger');
	    if (latheStartZ + latheFinishDepth > latheRapidToZ) return showAlert('latheStartZ + latheFinishDepth > latheRapidToZ', 'danger');
	    if (latheFinishExtraPasses < 0) return showAlert('latheFinishExtraPasses < 0', 'danger');
	    if (latheFace && latheFaceEndDiameter >= latheRapidToDiameter) return showAlert('latheFace && latheFaceEndDiameter >= latheRapidToDiameter', 'danger');
	    if (!latheFace && !latheTurns.length) return showAlert('!latheFace && !latheTurns.length', 'danger');
	
	    for (let i = 0; i < latheTurns.length; ++i) {
	        if (latheTurns[i].startDiameter < 0) return showAlert('i=' + i + ': latheTurns[i].startDiameter < 0');
	        if (i > 0 && latheTurns[i].startDiameter < latheTurns[i - 1].endDiameter) return showAlert('i=' + i + ': i > 0 && latheTurns[i].startDiameter < latheTurns[i - 1].endDiameter');
	        if (latheTurns[i].startDiameter >= latheRapidToDiameter) return showAlert('i=' + i + ': latheTurns[i].startDiameter >= latheRapidToDiameter');
	        if (latheTurns[i].endDiameter <= 0) return showAlert('i=' + i + ': latheTurns[i].endDiameter <= 0');
	        if (latheTurns[i].endDiameter < latheTurns[i].startDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter < latheTurns[i].startDiameter');
	        if (latheTurns[i].endDiameter + latheFinishDepth >= latheRapidToDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter + latheFinishDepth >= latheRapidToDiameter');
	        if (latheTurns[i].endDiameter != latheTurns[i].startDiameter) return showAlert('i=' + i + ': latheTurns[i].endDiameter != latheTurns[i].startDiameter');
	        if (latheTurns[i].length <= 0) return showAlert('i=' + i + ': latheTurns[i].length <= 0');
	    }
	
	    gen.gcode += '\r\n; latheToolBackSide:       ' + latheToolBackSide + '\r\n; latheRapidToDiameter:    ' + latheRapidToDiameter + ' mm' + '\r\n; latheRapidToZ:           ' + latheRapidToZ + ' mm' + '\r\n; latheStartZ:             ' + latheStartZ + ' mm' + '\r\n; latheRoughingFeed:       ' + latheRoughingFeed + gen.toolFeedUnits + '\r\n; latheRoughingDepth:      ' + latheRoughingDepth + ' mm' + '\r\n; latheFinishFeed:         ' + latheFinishFeed + gen.toolFeedUnits + '\r\n; latheFinishDepth:        ' + latheFinishDepth + ' mm' + '\r\n; latheFinishExtraPasses:  ' + latheFinishExtraPasses + '\r\n; latheFace:               ' + latheFace + '\r\n; latheFaceEndDiameter:    ' + latheFaceEndDiameter + ' mm' + '';
	
	    if (latheTurns.length) {
	        gen.gcode += '\r\n; turns:';
	        for (let turn of latheTurns) gen.gcode += '\r\n;     startDiameter:       ' + turn.startDiameter + ' mm' + '\r\n;     endDiameter:         ' + turn.endDiameter + ' mm' + '\r\n;     length:              ' + turn.length + ' mm' + '';
	    }
	
	    gen.gcode += '\n\n; Rapid\n';
	    gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
	    gen.rapidZ(latheRapidToZ);
	
	    if (latheFace) {
	        gen.gcode += '\n; Face roughing\n';
	        let z = latheRapidToZ;
	        while (true) {
	            let nextZ = Math.max(z - latheRoughingDepth, latheStartZ + latheFinishDepth);
	            if (nextZ === z) break;
	            z = nextZ;
	            gen.moveZ(z, latheRoughingFeed);
	            gen.moveXDia(latheFaceEndDiameter, latheToolBackSide, latheRoughingFeed);
	            gen.moveZ(Math.min(z + latheRoughingDepth, latheRapidToZ), latheRoughingFeed);
	            gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
	        }
	        gen.gcode += '\n; Face finishing\n';
	        let n = latheFinishExtraPasses;
	        if (z > latheStartZ) {
	            ++n;
	            z = latheStartZ;
	        }
	        for (let i = 0; i < n; ++i) {
	            gen.moveZ(z, latheFinishFeed);
	            gen.moveXDia(latheFaceEndDiameter, latheToolBackSide, latheFinishFeed);
	            gen.moveZ(Math.min(z + latheRoughingDepth, latheRapidToZ), latheFinishFeed);
	            gen.rapidXDia(latheRapidToDiameter, latheToolBackSide);
	        }
	        latheRapidToZ = Math.min(z + latheRoughingDepth, latheRapidToZ);
	        gen.rapidZ(latheRapidToZ);
	    }
	
	    if (latheTurns.length) {
	        gen.gcode += '\n; Turn roughing\n';
	        let turnRapidToDiameter = latheRapidToDiameter;
	        let startX = turnRapidToDiameter - latheRoughingDepth;
	        while (true) {
	            let x = startX;
	            let z = latheRapidToZ;
	            let turnStartZ = latheStartZ + latheFinishDepth;
	            let done = false;
	            for (let turn of latheTurns) {
	                if (x < turn.startDiameter + latheFinishDepth && turn.startDiameter + latheFinishDepth < startX + latheRoughingDepth) x = turn.startDiameter + latheFinishDepth;
	                if (x < turn.startDiameter + latheFinishDepth) {
	                    if (turn === latheTurns[0]) {
	                        done = true;
	                        break;
	                    }
	                    gen.moveXDia(x, latheToolBackSide, latheRoughingFeed);
	                    z = turnStartZ;
	                    gen.moveZ(z, latheRoughingFeed);
	                    gen.moveXDia(Math.min(x + latheRoughingDepth, turnRapidToDiameter), latheToolBackSide, latheRoughingFeed);
	                    break;
	                } else {
	                    gen.moveXDia(x, latheToolBackSide, latheRoughingFeed);
	                    z = turnStartZ - turn.length;
	                    gen.moveZ(z, latheRoughingFeed);
	                }
	                turnStartZ -= turn.length;
	            }
	            if (done) break;
	            turnRapidToDiameter = Math.min(turnRapidToDiameter, x + latheRoughingDepth);
	            startX -= latheRoughingDepth;
	            gen.moveXDia(turnRapidToDiameter, latheToolBackSide, latheRoughingFeed);
	            gen.rapidZ(latheRapidToZ);
	        }
	
	        gen.gcode += '\n; Turn finishing\n';
	        gen.rapidXDia(latheTurns[0].startDiameter, latheToolBackSide);
	        let z = latheStartZ;
	        for (let turn of latheTurns) {
	            gen.moveXDia(turn.startDiameter, latheToolBackSide, latheFinishFeed);
	            z -= turn.length;
	            gen.moveZ(z, latheFinishFeed);
	        }
	        gen.moveXDia(latheRapidToDiameter, latheToolBackSide, latheFinishFeed);
	        gen.rapidZ(latheRapidToZ);
	    } // if(latheTurns.length)
	
	    gen.gcode += '\n';
	} // latheConvFaceTurn
	
	function getLatheGcodeFromOp(settings, opIndex, op, geometry, openGeometry, tabGeometry, showAlert, done, progress) {
	    let gen = new GcodeGenerator(_extends({}, settings, { decimal: 2 }));
	    gen.gcode = '\r\n;' + '\r\n; Operation:               ' + opIndex + '\r\n; Type:                    ' + op.type + '';
	    if (op.hookOperationStart.length) gen.gcode += op.hookOperationStart;
	    if (op.type === 'Lathe Conv Face/Turn') latheConvFaceTurn(gen, showAlert, op);
	    if (op.hookOperationEnd.length) gen.gcode += op.hookOperationEnd;
	    done(gen.gcode);
	} // getLatheGcodeFromOp
	
	;
	
	var _temp = function () {
	    if (typeof __REACT_HOT_LOADER__ === 'undefined') {
	        return;
	    }
	
	    __REACT_HOT_LOADER__.register(GcodeGenerator, 'GcodeGenerator', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/cam-gcode-lathe.js');
	
	    __REACT_HOT_LOADER__.register(latheConvFaceTurn, 'latheConvFaceTurn', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/cam-gcode-lathe.js');
	
	    __REACT_HOT_LOADER__.register(getLatheGcodeFromOp, 'getLatheGcodeFromOp', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/cam-gcode-lathe.js');
	}();

	;

/***/ })
/******/ ]);
//# sourceMappingURL=6b5fc44a167d7c77f101.worker.js.map