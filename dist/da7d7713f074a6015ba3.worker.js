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
/******/ 	var hotCurrentHash = "da7d7713f074a6015ba3"; // eslint-disable-line no-unused-vars
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

	'use strict';
	
	var _mesh = __webpack_require__(1);
	
	self.onmessage = event => {
	
	    const jobs = [];
	
	    var _event$data = event.data;
	    let settings = _event$data.settings,
	        opIndex = _event$data.opIndex,
	        op = _event$data.op,
	        geometry = _event$data.geometry,
	        openGeometry = _event$data.openGeometry,
	        tabGeometry = _event$data.tabGeometry,
	        documents = _event$data.documents;
	
	
	    const filteredDocIds = new Set();
	    const docsWithImages = [];
	
	    function matchColor(filterColor, color) {
	        if (!filterColor) return true;
	        if (!color) return false;
	        return filterColor[0] == color[0] && filterColor[1] == color[1] && filterColor[2] == color[2] && filterColor[3] == color[3];
	    }
	
	    function examineDocTree(isTab, id) {
	        let doc = documents.find(d => d.id === id);
	        if (doc.rawPaths) {
	            jobs.push(cb => {
	                if (isTab) {
	                    tabGeometry = (0, _mesh.union)(tabGeometry, (0, _mesh.rawPathsToClipperPaths)(doc.rawPaths, doc.transform2d));
	                } else if (matchColor(op.filterFillColor, doc.fillColor) && matchColor(op.filterStrokeColor, doc.strokeColor)) {
	                    filteredDocIds.add(doc.id);
	                    if (!op.type.includes('Raster')) {
	                        let isClosed = false;
	                        for (let rawPath of doc.rawPaths) if (rawPath.length >= 4 && rawPath[0] == rawPath[rawPath.length - 2] && rawPath[1] == rawPath[rawPath.length - 1]) isClosed = true;
	                        let clipperPaths = (0, _mesh.rawPathsToClipperPaths)(doc.rawPaths, doc.transform2d);
	                        if (isClosed) geometry = (0, _mesh.xor)(geometry, clipperPaths);else if (!op.filterFillColor) openGeometry = openGeometry.concat(clipperPaths);
	                    }
	                }
	                cb();
	            });
	        }
	        if (doc.type === 'image' && !isTab) {
	            filteredDocIds.add(doc.id);
	            docsWithImages.push(doc);
	        }
	        for (let child of doc.children) examineDocTree(isTab, child);
	    }
	    for (let id of op.documents) examineDocTree(false, id);
	    for (let id of op.tabDocuments) examineDocTree(true, id);
	
	    let chunk = 100 / jobs.length;
	    var percent = 0;
	
	    while (jobs.length) {
	        try {
	            let job = jobs.shift();
	            if (job) job(() => {
	                percent = percent + chunk;
	                postMessage({ event: "onProgress", percent: parseInt(percent) });
	            });
	        } catch (error) {
	            console.error(error);
	            postMessage({ event: "onError", message: "Something wrong has happened, sorry.", level: "error", error: error.toString() });
	        }
	    }
	
	    postMessage({ event: "onDone", settings, opIndex, op, geometry, openGeometry, tabGeometry, filteredDocIds, docsWithImages });
	    self.close();
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
/***/ (function(module, exports, __webpack_require__) {

	// Copyright 2014-2016 Todd Fleming
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
	
	// TODO: pass React elements to alertFn
	
	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.arcTolerance = exports.cleanPolyDist = exports.clipperToCppScale = exports.mmToClipperScale = exports.inchToClipperScale = undefined;
	exports.elementToRawPaths = elementToRawPaths;
	exports.pathStrToRawPaths = pathStrToRawPaths;
	exports.flipY = flipY;
	exports.hasClosedRawPaths = hasClosedRawPaths;
	exports.filterClosedRawPaths = filterClosedRawPaths;
	exports.rawPathsToClipperPaths = rawPathsToClipperPaths;
	exports.triangulateRawPaths = triangulateRawPaths;
	exports.clipperPathsToCPaths = clipperPathsToCPaths;
	exports.cPathsToClipperPaths = cPathsToClipperPaths;
	exports.cPathsToCamPaths = cPathsToCamPaths;
	exports.clipperBounds = clipperBounds;
	exports.clip = clip;
	exports.union = union;
	exports.diff = diff;
	exports.xor = xor;
	exports.offset = offset;
	
	var _clipperLib = __webpack_require__(2);
	
	var _clipperLib2 = _interopRequireDefault(_clipperLib);
	
	var _sweepcontext = __webpack_require__(3);
	
	var _sweepcontext2 = _interopRequireDefault(_sweepcontext);
	
	var _snapsvg = __webpack_require__(12);
	
	var _snapsvg2 = _interopRequireDefault(_snapsvg);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	const inchToClipperScale = exports.inchToClipperScale = 1270000000;
	const mmToClipperScale = exports.mmToClipperScale = inchToClipperScale / 25.4; // 50000000;
	const clipperToCppScale = exports.clipperToCppScale = 1 / 128; // Prevent overflow for coordinates up to ~1000 mm
	const cleanPolyDist = exports.cleanPolyDist = 100;
	const arcTolerance = exports.arcTolerance = 10000;
	
	// Linearize a cubic bezier. Returns ['L', x2, y2, x3, y3, ...]. The return value doesn't
	// include (p1x, p1y); it's part of the previous segment.
	function linearizeCubicBezier(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, minNumSegments, minSegmentLength) {
	    function bez(p0, p1, p2, p3, t) {
	        return (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3;
	    }
	
	    if (p1x == c1x && p1y == c1y && p2x == c2x && p2y == c2y) return ['L', p2x, p2y];
	
	    let numSegments = minNumSegments;
	    while (true) {
	        let x = p1x;
	        let y = p1y;
	        let result = ['L'];
	        for (let i = 1; i <= numSegments; ++i) {
	            let t = 1.0 * i / numSegments;
	            let nextX = bez(p1x, c1x, c2x, p2x, t);
	            let nextY = bez(p1y, c1y, c2y, p2y, t);
	            if ((nextX - x) * (nextX - x) + (nextY - y) * (nextY - y) > minSegmentLength * minSegmentLength) {
	                numSegments *= 2;
	                result = null;
	                break;
	            }
	            result.push(nextX, nextY);
	            x = nextX;
	            y = nextY;
	        }
	        if (result) return result;
	    }
	}
	
	// Linearize a path. Both the input path and the returned path are in snap.svg's format.
	// Calls alertFn with an error message and returns null if there's a problem.
	function linearizeSnapPath(path, minNumSegments, minSegmentLength, alertFn) {
	    if (path.length < 2 || path[0].length != 3 || path[0][0] != 'M') {
	        alertFn('Path does not begin with M');
	        return null;
	    }
	    let x = path[0][1];
	    let y = path[0][2];
	    let result = [path[0]];
	    for (let i = 1; i < path.length; ++i) {
	        let subpath = path[i];
	        if (subpath[0] == 'C' && subpath.length == 7) {
	            result.push(linearizeCubicBezier(x, y, subpath[1], subpath[2], subpath[3], subpath[4], subpath[5], subpath[6], minNumSegments, minSegmentLength));
	            x = subpath[5];
	            y = subpath[6];
	        } else if (subpath[0] == 'M' && subpath.length == 3) {
	            result.push(subpath);
	            x = subpath[1];
	            y = subpath[2];
	        } else {
	            alertFn('Subpath has an unknown prefix: ' + subpath[0]);
	            return null;
	        }
	    }
	    return result;
	};
	
	// Get linear paths (snap format) from an SVG element. Calls alertFn with an 
	// error message and returns null if there's a problem.
	function elementToLinearSnapPaths(element, minNumSegments, minSegmentLength, alertFn) {
	    let path = null;
	    let snapElement = (0, _snapsvg2.default)(element);
	
	    if (snapElement.type == 'path') path = snapElement.attr('d');else if (snapElement.type == 'rect') {
	        let x = Number(snapElement.attr('x'));
	        let y = Number(snapElement.attr('y'));
	        let w = Number(snapElement.attr('width'));
	        let h = Number(snapElement.attr('height'));
	        path = 'm' + x + ',' + y + ' ' + w + ',' + 0 + ' ' + 0 + ',' + h + ' ' + -w + ',' + 0 + ' ' + 0 + ',' + -h + ' ';
	    } else {
	        alertFn('<b>' + snapElement.type + "</b> is not supported; try Inkscape's <strong>Object to Path</strong> command");
	        return null;
	    }
	
	    if (snapElement.attr('clip-path') != '') {
	        alertFn('clip-path is not supported');
	        return null;
	    }
	
	    if (snapElement.attr('mask') != '') {
	        alertFn('mask is not supported');
	        return null;
	    }
	
	    if (path == null) {
	        alertFn('path is missing');
	        return;
	    }
	
	    path = _snapsvg2.default.path.map(path, snapElement.transform().globalMatrix);
	    path = _snapsvg2.default.parsePathString(path);
	    path = linearizeSnapPath(path, minNumSegments, minSegmentLength, alertFn);
	    return path;
	};
	
	// Convert a path in snap.svg format to [[x0, y0, x1, y1, ...], ...].
	// Result is in mm. Returns multiple paths. Only supports linear paths.
	// Calls alertFn with an error message and returns null if there's a problem.
	function snapPathToRawPaths(snapPath, pxPerInch, alertFn) {
	    let factor = 25.4 / pxPerInch;
	    if (snapPath.length < 2 || snapPath[0].length != 3 || snapPath[0][0] != 'M') {
	        alertFn('Path does not begin with M');
	        return null;
	    }
	    let currentPath = [snapPath[0][1] * factor, snapPath[0][2] * factor];
	    let result = [currentPath];
	    for (let i = 1; i < snapPath.length; ++i) {
	        let subpath = snapPath[i];
	        if (subpath[0] == 'M' && subpath.length == 3) {
	            currentPath = [subpath[1] * factor, subpath[2] * factor];
	            result.push(currentPath);
	        } else if (subpath[0] == 'L') {
	            for (let j = 0; j < (subpath.length - 1) / 2; ++j) currentPath.push(subpath[1 + j * 2] * factor, subpath[2 + j * 2] * factor);
	        } else {
	            alertFn('Subpath has a non-linear prefix: ' + subpath[0]);
	            return null;
	        }
	    }
	    return result;
	};
	
	// Convert a path in an SVG element to [[x0, y0, x1, y1, ...], ...].
	// Result is in mm. Returns multiple paths. Converts curves.
	// Calls alertFn with an error message and returns null if there's a problem.
	function elementToRawPaths(element, pxPerInch, minNumSegments, minSegmentLength, alertFn) {
	    let path = elementToLinearSnapPaths(element, minNumSegments, minSegmentLength, alertFn);
	    if (path !== null) return snapPathToRawPaths(path, pxPerInch, alertFn);
	    return null;
	}
	
	// Convert an SVG path string to [[x0, y0, x1, y1, ...], ...].
	// Result is in mm. Returns multiple paths. Converts curves.
	// Calls alertFn with an error message and returns null if there's a problem.
	function pathStrToRawPaths(str, pxPerInch, minNumSegments, minSegmentLength, alertFn) {
	    let path = _snapsvg2.default.parsePathString(str);
	    path = _snapsvg2.default.path.toCubic(path);
	    path = linearizeSnapPath(path, minNumSegments, minSegmentLength, alertFn);
	    if (path !== null) return snapPathToRawPaths(path, pxPerInch, alertFn);
	    return null;
	}
	
	// [[[x0, y0, x1, y1, ...], ...], ...]
	function flipY(allRawPaths, deltaY) {
	    for (let rawPaths of allRawPaths) for (let rawPath of rawPaths) for (let i = 0; i < rawPath.length; i += 2) rawPath[i + 1] = deltaY - rawPath[i + 1];
	}
	
	function hasClosedRawPaths(rawPaths) {
	    for (let path of rawPaths) if (path.length >= 4 && path[0] == path[path.length - 2] && path[1] == path[path.length - 1]) return true;
	    return false;
	}
	
	function filterClosedRawPaths(rawPaths) {
	    let result = [];
	    for (let path of rawPaths) if (path.length >= 4 && path[0] == path[path.length - 2] && path[1] == path[path.length - 1]) result.push(path);
	    return result;
	}
	
	function rawPathsToClipperPaths(rawPaths, transform) {
	    let result = rawPaths.map(p => {
	        let result = [];
	        for (let i = 0; i < p.length; i += 2) {
	            result.push({
	                X: (transform[0] * p[i] + transform[2] * p[i + 1] + transform[4]) * mmToClipperScale,
	                Y: (transform[1] * p[i] + transform[3] * p[i + 1] + transform[5]) * mmToClipperScale
	            });
	        }
	        return result;
	    });
	    if (hasClosedRawPaths(rawPaths)) {
	        result = _clipperLib2.default.Clipper.CleanPolygons(result, cleanPolyDist);
	        result = _clipperLib2.default.Clipper.SimplifyPolygons(result, _clipperLib2.default.PolyFillType.pftEvenOdd);
	    }
	    return result;
	}
	
	function clipperPathsToPolyTree(paths) {
	    let c = new _clipperLib2.default.Clipper();
	    c.AddPaths(paths, _clipperLib2.default.PolyType.ptSubject, true);
	    let polyTree = new _clipperLib2.default.PolyTree();
	    c.Execute(_clipperLib2.default.ClipType.ctUnion, polyTree, _clipperLib2.default.PolyFillType.pftEvenOdd, _clipperLib2.default.PolyFillType.pftEvenOdd);
	    return polyTree;
	}
	
	function triangulatePolyTree(polyTree) {
	    let result = [];
	    let pointToVertex = point => ({ x: point.X / mmToClipperScale, y: point.Y / mmToClipperScale });
	    let contourToVertexes = path => path.map(pointToVertex);
	    let nodesToVertexes = nodes => nodes.map(node => contourToVertexes(node.Contour()));
	    let processNode = node => {
	        let vertexes = contourToVertexes(node.Contour());
	        let holes = nodesToVertexes(node.Childs());
	        let context = new _sweepcontext2.default(vertexes);
	        context.addHoles(holes);
	        context.triangulate();
	        let triangles = context.getTriangles();
	        for (let t of triangles) {
	            let p = t.getPoints();
	            result.push(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y);
	        }
	        for (let hole of node.Childs()) {
	            for (let next of hole.Childs()) {
	                processNode(next);
	            }
	        }
	    };
	    for (let node of polyTree.Childs()) {
	        processNode(node);
	    }
	    return result;
	}
	
	function triangulateRawPaths(rawPaths) {
	    return triangulatePolyTree(clipperPathsToPolyTree(rawPathsToClipperPaths(rawPaths, [1, 0, 0, 1, 0, 0])));
	}
	
	// Convert Clipper paths to C. Returns [double** cPaths, int cNumPaths, int* cPathSizes].
	function clipperPathsToCPaths(memoryBlocks, clipperPaths) {
	    let doubleSize = 8;
	
	    let cPaths = Module._malloc(clipperPaths.length * 4);
	    memoryBlocks.push(cPaths);
	    let cPathsBase = cPaths >> 2;
	
	    let cPathSizes = Module._malloc(clipperPaths.length * 4);
	    memoryBlocks.push(cPathSizes);
	    let cPathSizesBase = cPathSizes >> 2;
	
	    for (let i = 0; i < clipperPaths.length; ++i) {
	        let clipperPath = clipperPaths[i];
	
	        let cPath = Module._malloc(clipperPath.length * 2 * doubleSize + 4);
	        memoryBlocks.push(cPath);
	        if (cPath & 4) cPath += 4;
	        //console.log("-> " + cPath.toString(16));
	        let pathArray = new Float64Array(Module.HEAPU32.buffer, Module.HEAPU32.byteOffset + cPath);
	
	        for (let j = 0; j < clipperPath.length; ++j) {
	            let point = clipperPath[j];
	            pathArray[j * 2] = point.X * clipperToCppScale;
	            pathArray[j * 2 + 1] = point.Y * clipperToCppScale;
	        }
	
	        Module.HEAPU32[cPathsBase + i] = cPath;
	        Module.HEAPU32[cPathSizesBase + i] = clipperPath.length;
	    }
	
	    return [cPaths, clipperPaths.length, cPathSizes];
	}
	
	// Convert C paths to Clipper paths. double**& cPathsRef, int& cNumPathsRef, int*& cPathSizesRef
	// Each point has X, Y (stride = 2).
	function cPathsToClipperPaths(memoryBlocks, cPathsRef, cNumPathsRef, cPathSizesRef) {
	    let cPaths = Module.HEAPU32[cPathsRef >> 2];
	    memoryBlocks.push(cPaths);
	    let cPathsBase = cPaths >> 2;
	
	    let cNumPaths = Module.HEAPU32[cNumPathsRef >> 2];
	
	    let cPathSizes = Module.HEAPU32[cPathSizesRef >> 2];
	    memoryBlocks.push(cPathSizes);
	    let cPathSizesBase = cPathSizes >> 2;
	
	    let clipperPaths = [];
	    for (let i = 0; i < cNumPaths; ++i) {
	        let pathSize = Module.HEAPU32[cPathSizesBase + i];
	        let cPath = Module.HEAPU32[cPathsBase + i];
	        // cPath contains value to pass to Module._free(). The aligned version contains the actual data.
	        memoryBlocks.push(cPath);
	        if (cPath & 4) cPath += 4;
	        let pathArray = new Float64Array(Module.HEAPU32.buffer, Module.HEAPU32.byteOffset + cPath);
	
	        let clipperPath = [];
	        clipperPaths.push(clipperPath);
	        for (let j = 0; j < pathSize; ++j) clipperPath.push({
	            X: pathArray[j * 2] / clipperToCppScale,
	            Y: pathArray[j * 2 + 1] / clipperToCppScale
	        });
	    }
	
	    return clipperPaths;
	}
	
	// Convert C paths to array of CamPath. double**& cPathsRef, int& cNumPathsRef, int*& cPathSizesRef
	// Each point has X, Y, Z (stride = 3).
	function cPathsToCamPaths(memoryBlocks, cPathsRef, cNumPathsRef, cPathSizesRef) {
	    let cPaths = Module.HEAPU32[cPathsRef >> 2];
	    memoryBlocks.push(cPaths);
	    let cPathsBase = cPaths >> 2;
	
	    let cNumPaths = Module.HEAPU32[cNumPathsRef >> 2];
	
	    let cPathSizes = Module.HEAPU32[cPathSizesRef >> 2];
	    memoryBlocks.push(cPathSizes);
	    let cPathSizesBase = cPathSizes >> 2;
	
	    let convertedPaths = [];
	    for (let i = 0; i < cNumPaths; ++i) {
	        let pathSize = Module.HEAPU32[cPathSizesBase + i];
	        let cPath = Module.HEAPU32[cPathsBase + i];
	        // cPath contains value to pass to Module._free(). The aligned version contains the actual data.
	        memoryBlocks.push(cPath);
	        if (cPath & 4) cPath += 4;
	        let pathArray = new Float64Array(Module.HEAPU32.buffer, Module.HEAPU32.byteOffset + cPath);
	
	        let convertedPath = [];
	        convertedPaths.push({ path: convertedPath, safeToClose: false });
	        for (let j = 0; j < pathSize; ++j) convertedPath.push({
	            X: pathArray[j * 3] / clipperToCppScale,
	            Y: pathArray[j * 3 + 1] / clipperToCppScale,
	            Z: pathArray[j * 3 + 2] / clipperToCppScale
	        });
	
	        //console.log('got: path', i, ':', pathArray[0], pathArray[1], pathArray[2]);
	    }
	
	    return convertedPaths;
	}
	
	function clipperBounds(paths) {
	    let minX = Number.MAX_VALUE;
	    let minY = Number.MAX_VALUE;
	    let maxX = -Number.MAX_VALUE;
	    let maxY = -Number.MAX_VALUE;
	    for (let path of paths) {
	        for (let pt of path) {
	            minX = Math.min(minX, pt.X);
	            maxX = Math.max(maxX, pt.X);
	            minY = Math.min(minY, pt.Y);
	            maxY = Math.max(maxY, pt.Y);
	        }
	    }
	    return { minX, minY, maxX, maxY };
	}
	
	// Clip Clipper geometry. clipType is a ClipperLib.ClipType constant. Returns new geometry.
	function clip(paths1, paths2, clipType) {
	    var clipper = new _clipperLib2.default.Clipper();
	    clipper.AddPaths(paths1, _clipperLib2.default.PolyType.ptSubject, true);
	    clipper.AddPaths(paths2, _clipperLib2.default.PolyType.ptClip, true);
	    var result = [];
	    clipper.Execute(clipType, result, _clipperLib2.default.PolyFillType.pftEvenOdd, _clipperLib2.default.PolyFillType.pftEvenOdd);
	    return result;
	}
	
	// Return union of two Clipper geometries. Returns new geometry.
	function union(paths1, paths2) {
	    return clip(paths1, paths2, _clipperLib2.default.ClipType.ctUnion);
	}
	
	// Return difference between two Clipper geometries. Returns new geometry.
	function diff(paths1, paths2) {
	    return clip(paths1, paths2, _clipperLib2.default.ClipType.ctDifference);
	}
	
	// Return xor of two Clipper geometries. Returns new geometry.
	function xor(paths1, paths2) {
	    return clip(paths1, paths2, _clipperLib2.default.ClipType.ctXor);
	}
	
	// Offset Clipper geometries by amount (positive expands, negative shrinks). Returns new geometry.
	function offset(paths, amount, joinType, endType) {
	    if (joinType === undefined) joinType = _clipperLib2.default.JoinType.jtRound;
	    if (endType === undefined) endType = _clipperLib2.default.EndType.etClosedPolygon;
	
	    // bug workaround: join types are swapped in ClipperLib 6.1.3.2
	    if (joinType === _clipperLib2.default.JoinType.jtSquare) joinType = _clipperLib2.default.JoinType.jtMiter;else if (joinType === _clipperLib2.default.JoinType.jtMiter) joinType = _clipperLib2.default.JoinType.jtSquare;
	
	    var co = new _clipperLib2.default.ClipperOffset(2, arcTolerance);
	    co.AddPaths(paths, joinType, endType);
	    var offsetted = [];
	    co.Execute(offsetted, amount);
	    return offsetted;
	}
	;
	
	var _temp = function () {
	    if (typeof __REACT_HOT_LOADER__ === 'undefined') {
	        return;
	    }
	
	    __REACT_HOT_LOADER__.register(inchToClipperScale, 'inchToClipperScale', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(mmToClipperScale, 'mmToClipperScale', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(clipperToCppScale, 'clipperToCppScale', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(cleanPolyDist, 'cleanPolyDist', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(arcTolerance, 'arcTolerance', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(linearizeCubicBezier, 'linearizeCubicBezier', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(linearizeSnapPath, 'linearizeSnapPath', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(elementToLinearSnapPaths, 'elementToLinearSnapPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(snapPathToRawPaths, 'snapPathToRawPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(elementToRawPaths, 'elementToRawPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(pathStrToRawPaths, 'pathStrToRawPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(flipY, 'flipY', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(hasClosedRawPaths, 'hasClosedRawPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(filterClosedRawPaths, 'filterClosedRawPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(rawPathsToClipperPaths, 'rawPathsToClipperPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(clipperPathsToPolyTree, 'clipperPathsToPolyTree', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(triangulatePolyTree, 'triangulatePolyTree', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(triangulateRawPaths, 'triangulateRawPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(clipperPathsToCPaths, 'clipperPathsToCPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(cPathsToClipperPaths, 'cPathsToClipperPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(cPathsToCamPaths, 'cPathsToCamPaths', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(clipperBounds, 'clipperBounds', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(clip, 'clip', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(union, 'union', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(diff, 'diff', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(xor, 'xor', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	
	    __REACT_HOT_LOADER__.register(offset, 'offset', 'C:/Users/Todd/Desktop/LW/LaserWeb4/src/lib/mesh.js');
	}();

	;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;// rev 482
	/********************************************************************************
	 *                                                                              *
	 * Author    :  Angus Johnson                                                   *
	 * Version   :  6.2.1                                                          *
	 * Date      :  31 October 2014                                                 *
	 * Website   :  http://www.angusj.com                                           *
	 * Copyright :  Angus Johnson 2010-2014                                         *
	 *                                                                              *
	 * License:                                                                     *
	 * Use, modification & distribution is subject to Boost Software License Ver 1. *
	 * http://www.boost.org/LICENSE_1_0.txt                                         *
	 *                                                                              *
	 * Attributions:                                                                *
	 * The code in this library is an extension of Bala Vatti's clipping algorithm: *
	 * "A generic solution to polygon clipping"                                     *
	 * Communications of the ACM, Vol 35, Issue 7 (July 1992) pp 56-63.             *
	 * http://portal.acm.org/citation.cfm?id=129906                                 *
	 *                                                                              *
	 * Computer graphics and geometric modeling: implementation and algorithms      *
	 * By Max K. Agoston                                                            *
	 * Springer; 1 edition (January 4, 2005)                                        *
	 * http://books.google.com/books?q=vatti+clipping+agoston                       *
	 *                                                                              *
	 * See also:                                                                    *
	 * "Polygon Offsetting by Computing Winding Numbers"                            *
	 * Paper no. DETC2005-85513 pp. 565-575                                         *
	 * ASME 2005 International Design Engineering Technical Conferences             *
	 * and Computers and Information in Engineering Conference (IDETC/CIE2005)      *
	 * September 24-28, 2005 , Long Beach, California, USA                          *
	 * http://www.me.berkeley.edu/~mcmains/pubs/DAC05OffsetPolygon.pdf              *
	 *                                                                              *
	 *******************************************************************************/
	/*******************************************************************************
	 *                                                                              *
	 * Author    :  Timo                                                            *
	 * Version   :  6.2.1.0                                                         *
	 * Date      :  17 June 2016                                                 *
	 *                                                                              *
	 * This is a translation of the C# Clipper library to Javascript.               *
	 * Int128 struct of C# is implemented using JSBN of Tom Wu.                     *
	 * Because Javascript lacks support for 64-bit integers, the space              *
	 * is a little more restricted than in C# version.                              *
	 *                                                                              *
	 * C# version has support for coordinate space:                                 *
	 * +-4611686018427387903 ( sqrt(2^127 -1)/2 )                                   *
	 * while Javascript version has support for space:                              *
	 * +-4503599627370495 ( sqrt(2^106 -1)/2 )                                      *
	 *                                                                              *
	 * Tom Wu's JSBN proved to be the fastest big integer library:                  *
	 * http://jsperf.com/big-integer-library-test                                   *
	 *                                                                              *
	 * This class can be made simpler when (if ever) 64-bit integer support comes.  *
	 *                                                                              *
	 *******************************************************************************/
	/*******************************************************************************
	 *                                                                              *
	 * Basic JavaScript BN library - subset useful for RSA encryption.              *
	 * http://www-cs-students.stanford.edu/~tjw/jsbn/                               *
	 * Copyright (c) 2005  Tom Wu                                                   *
	 * All Rights Reserved.                                                         *
	 * See "LICENSE" for details:                                                   *
	 * http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE                        *
	 *                                                                              *
	 *******************************************************************************/
	(function ()
	{
	  "use strict";
	  //use_int32: When enabled 32bit ints are used instead of 64bit ints. This
	  //improve performance but coordinate values are limited to the range +/- 46340
	  var use_int32 = false;
	  //use_xyz: adds a Z member to IntPoint. Adds a minor cost to performance.
	  var use_xyz = false;
	  //UseLines: Enables open path clipping. Adds a very minor cost to performance.
	  var use_lines = true;
	
	  var ClipperLib = {};
	  var isNode = false;
	  if (typeof module !== 'undefined' && module.exports)
	  {
	    module.exports = ClipperLib;
	    isNode = true;
	  }
	  else
	  {
	    if (true) {
	      !(__WEBPACK_AMD_DEFINE_FACTORY__ = (ClipperLib), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    }
	    if (typeof (document) !== "undefined") window.ClipperLib = ClipperLib;
	    else self['ClipperLib'] = ClipperLib;
	  }
	  var navigator_appName;
	  if (!isNode)
	  {
	    var nav = navigator.userAgent.toString().toLowerCase();
	    navigator_appName = navigator.appName;
	  }
	  else
	  {
	    var nav = "chrome"; // Node.js uses Chrome's V8 engine
	    navigator_appName = "Netscape"; // Firefox, Chrome and Safari returns "Netscape", so Node.js should also
	  }
	  // Browser test to speedup performance critical functions
	  var browser = {};
	  if (nav.indexOf("chrome") != -1 && nav.indexOf("chromium") == -1) browser.chrome = 1;
	  else browser.chrome = 0;
	  if (nav.indexOf("chromium") != -1) browser.chromium = 1;
	  else browser.chromium = 0;
	  if (nav.indexOf("safari") != -1 && nav.indexOf("chrome") == -1 && nav.indexOf("chromium") == -1) browser.safari = 1;
	  else browser.safari = 0;
	  if (nav.indexOf("firefox") != -1) browser.firefox = 1;
	  else browser.firefox = 0;
	  if (nav.indexOf("firefox/17") != -1) browser.firefox17 = 1;
	  else browser.firefox17 = 0;
	  if (nav.indexOf("firefox/15") != -1) browser.firefox15 = 1;
	  else browser.firefox15 = 0;
	  if (nav.indexOf("firefox/3") != -1) browser.firefox3 = 1;
	  else browser.firefox3 = 0;
	  if (nav.indexOf("opera") != -1) browser.opera = 1;
	  else browser.opera = 0;
	  if (nav.indexOf("msie 10") != -1) browser.msie10 = 1;
	  else browser.msie10 = 0;
	  if (nav.indexOf("msie 9") != -1) browser.msie9 = 1;
	  else browser.msie9 = 0;
	  if (nav.indexOf("msie 8") != -1) browser.msie8 = 1;
	  else browser.msie8 = 0;
	  if (nav.indexOf("msie 7") != -1) browser.msie7 = 1;
	  else browser.msie7 = 0;
	  if (nav.indexOf("msie ") != -1) browser.msie = 1;
	  else browser.msie = 0;
	  ClipperLib.biginteger_used = null;
	
	  // Copyright (c) 2005  Tom Wu
	  // All Rights Reserved.
	  // See "LICENSE" for details.
	  // Basic JavaScript BN library - subset useful for RSA encryption.
	  // Bits per digit
	  var dbits;
	  // JavaScript engine analysis
	  var canary = 0xdeadbeefcafe;
	  var j_lm = ((canary & 0xffffff) == 0xefcafe);
	  // (public) Constructor
	  function BigInteger(a, b, c)
	  {
	    // This test variable can be removed,
	    // but at least for performance tests it is useful piece of knowledge
	    // This is the only ClipperLib related variable in BigInteger library
	    ClipperLib.biginteger_used = 1;
	    if (a != null)
	      if ("number" == typeof a && "undefined" == typeof (b)) this.fromInt(a); // faster conversion
	      else if ("number" == typeof a) this.fromNumber(a, b, c);
	    else if (b == null && "string" != typeof a) this.fromString(a, 256);
	    else this.fromString(a, b);
	  }
	  // return new, unset BigInteger
	  function nbi()
	  {
	    return new BigInteger(null,undefined,undefined);
	  }
	  // am: Compute w_j += (x*this_i), propagate carries,
	  // c is initial carry, returns final carry.
	  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
	  // We need to select the fastest one that works in this environment.
	  // am1: use a single mult and divide to get the high bits,
	  // max digit bits should be 26 because
	  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
	  function am1(i, x, w, j, c, n)
	  {
	    while (--n >= 0)
	    {
	      var v = x * this[i++] + w[j] + c;
	      c = Math.floor(v / 0x4000000);
	      w[j++] = v & 0x3ffffff;
	    }
	    return c;
	  }
	  // am2 avoids a big mult-and-extract completely.
	  // Max digit bits should be <= 30 because we do bitwise ops
	  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
	  function am2(i, x, w, j, c, n)
	  {
	    var xl = x & 0x7fff,
	      xh = x >> 15;
	    while (--n >= 0)
	    {
	      var l = this[i] & 0x7fff;
	      var h = this[i++] >> 15;
	      var m = xh * l + h * xl;
	      l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
	      c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
	      w[j++] = l & 0x3fffffff;
	    }
	    return c;
	  }
	  // Alternately, set max digit bits to 28 since some
	  // browsers slow down when dealing with 32-bit numbers.
	  function am3(i, x, w, j, c, n)
	  {
	    var xl = x & 0x3fff,
	      xh = x >> 14;
	    while (--n >= 0)
	    {
	      var l = this[i] & 0x3fff;
	      var h = this[i++] >> 14;
	      var m = xh * l + h * xl;
	      l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
	      c = (l >> 28) + (m >> 14) + xh * h;
	      w[j++] = l & 0xfffffff;
	    }
	    return c;
	  }
	  if (j_lm && (navigator_appName == "Microsoft Internet Explorer"))
	  {
	    BigInteger.prototype.am = am2;
	    dbits = 30;
	  }
	  else if (j_lm && (navigator_appName != "Netscape"))
	  {
	    BigInteger.prototype.am = am1;
	    dbits = 26;
	  }
	  else
	  { // Mozilla/Netscape seems to prefer am3
	    BigInteger.prototype.am = am3;
	    dbits = 28;
	  }
	  BigInteger.prototype.DB = dbits;
	  BigInteger.prototype.DM = ((1 << dbits) - 1);
	  BigInteger.prototype.DV = (1 << dbits);
	  var BI_FP = 52;
	  BigInteger.prototype.FV = Math.pow(2, BI_FP);
	  BigInteger.prototype.F1 = BI_FP - dbits;
	  BigInteger.prototype.F2 = 2 * dbits - BI_FP;
	  // Digit conversions
	  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
	  var BI_RC = new Array();
	  var rr, vv;
	  rr = "0".charCodeAt(0);
	  for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
	  rr = "a".charCodeAt(0);
	  for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
	  rr = "A".charCodeAt(0);
	  for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
	
	  function int2char(n)
	  {
	    return BI_RM.charAt(n);
	  }
	
	  function intAt(s, i)
	  {
	    var c = BI_RC[s.charCodeAt(i)];
	    return (c == null) ? -1 : c;
	  }
	  // (protected) copy this to r
	  function bnpCopyTo(r)
	  {
	    for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
	    r.t = this.t;
	    r.s = this.s;
	  }
	  // (protected) set from integer value x, -DV <= x < DV
	  function bnpFromInt(x)
	  {
	    this.t = 1;
	    this.s = (x < 0) ? -1 : 0;
	    if (x > 0) this[0] = x;
	    else if (x < -1) this[0] = x + this.DV;
	    else this.t = 0;
	  }
	  // return bigint initialized to value
	  function nbv(i)
	  {
	    var r = nbi();
	    r.fromInt(i);
	    return r;
	  }
	  // (protected) set from string and radix
	  function bnpFromString(s, b)
	  {
	    var k;
	    if (b == 16) k = 4;
	    else if (b == 8) k = 3;
	    else if (b == 256) k = 8; // byte array
	    else if (b == 2) k = 1;
	    else if (b == 32) k = 5;
	    else if (b == 4) k = 2;
	    else
	    {
	      this.fromRadix(s, b);
	      return;
	    }
	    this.t = 0;
	    this.s = 0;
	    var i = s.length,
	      mi = false,
	      sh = 0;
	    while (--i >= 0)
	    {
	      var x = (k == 8) ? s[i] & 0xff : intAt(s, i);
	      if (x < 0)
	      {
	        if (s.charAt(i) == "-") mi = true;
	        continue;
	      }
	      mi = false;
	      if (sh == 0)
	        this[this.t++] = x;
	      else if (sh + k > this.DB)
	      {
	        this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
	        this[this.t++] = (x >> (this.DB - sh));
	      }
	      else
	        this[this.t - 1] |= x << sh;
	      sh += k;
	      if (sh >= this.DB) sh -= this.DB;
	    }
	    if (k == 8 && (s[0] & 0x80) != 0)
	    {
	      this.s = -1;
	      if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
	    }
	    this.clamp();
	    if (mi) BigInteger.ZERO.subTo(this, this);
	  }
	  // (protected) clamp off excess high words
	  function bnpClamp()
	  {
	    var c = this.s & this.DM;
	    while (this.t > 0 && this[this.t - 1] == c)--this.t;
	  }
	  // (public) return string representation in given radix
	  function bnToString(b)
	  {
	    if (this.s < 0) return "-" + this.negate().toString(b);
	    var k;
	    if (b == 16) k = 4;
	    else if (b == 8) k = 3;
	    else if (b == 2) k = 1;
	    else if (b == 32) k = 5;
	    else if (b == 4) k = 2;
	    else return this.toRadix(b);
	    var km = (1 << k) - 1,
	      d, m = false,
	      r = "",
	      i = this.t;
	    var p = this.DB - (i * this.DB) % k;
	    if (i-- > 0)
	    {
	      if (p < this.DB && (d = this[i] >> p) > 0)
	      {
	        m = true;
	        r = int2char(d);
	      }
	      while (i >= 0)
	      {
	        if (p < k)
	        {
	          d = (this[i] & ((1 << p) - 1)) << (k - p);
	          d |= this[--i] >> (p += this.DB - k);
	        }
	        else
	        {
	          d = (this[i] >> (p -= k)) & km;
	          if (p <= 0)
	          {
	            p += this.DB;
	            --i;
	          }
	        }
	        if (d > 0) m = true;
	        if (m) r += int2char(d);
	      }
	    }
	    return m ? r : "0";
	  }
	  // (public) -this
	  function bnNegate()
	  {
	    var r = nbi();
	    BigInteger.ZERO.subTo(this, r);
	    return r;
	  }
	  // (public) |this|
	  function bnAbs()
	  {
	    return (this.s < 0) ? this.negate() : this;
	  }
	  // (public) return + if this > a, - if this < a, 0 if equal
	  function bnCompareTo(a)
	  {
	    var r = this.s - a.s;
	    if (r != 0) return r;
	    var i = this.t;
	    r = i - a.t;
	    if (r != 0) return (this.s < 0) ? -r : r;
	    while (--i >= 0)
	      if ((r = this[i] - a[i]) != 0) return r;
	    return 0;
	  }
	  // returns bit length of the integer x
	  function nbits(x)
	  {
	    var r = 1,
	      t;
	    if ((t = x >>> 16) != 0)
	    {
	      x = t;
	      r += 16;
	    }
	    if ((t = x >> 8) != 0)
	    {
	      x = t;
	      r += 8;
	    }
	    if ((t = x >> 4) != 0)
	    {
	      x = t;
	      r += 4;
	    }
	    if ((t = x >> 2) != 0)
	    {
	      x = t;
	      r += 2;
	    }
	    if ((t = x >> 1) != 0)
	    {
	      x = t;
	      r += 1;
	    }
	    return r;
	  }
	  // (public) return the number of bits in "this"
	  function bnBitLength()
	  {
	    if (this.t <= 0) return 0;
	    return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
	  }
	  // (protected) r = this << n*DB
	  function bnpDLShiftTo(n, r)
	  {
	    var i;
	    for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
	    for (i = n - 1; i >= 0; --i) r[i] = 0;
	    r.t = this.t + n;
	    r.s = this.s;
	  }
	  // (protected) r = this >> n*DB
	  function bnpDRShiftTo(n, r)
	  {
	    for (var i = n; i < this.t; ++i) r[i - n] = this[i];
	    r.t = Math.max(this.t - n, 0);
	    r.s = this.s;
	  }
	  // (protected) r = this << n
	  function bnpLShiftTo(n, r)
	  {
	    var bs = n % this.DB;
	    var cbs = this.DB - bs;
	    var bm = (1 << cbs) - 1;
	    var ds = Math.floor(n / this.DB),
	      c = (this.s << bs) & this.DM,
	      i;
	    for (i = this.t - 1; i >= 0; --i)
	    {
	      r[i + ds + 1] = (this[i] >> cbs) | c;
	      c = (this[i] & bm) << bs;
	    }
	    for (i = ds - 1; i >= 0; --i) r[i] = 0;
	    r[ds] = c;
	    r.t = this.t + ds + 1;
	    r.s = this.s;
	    r.clamp();
	  }
	  // (protected) r = this >> n
	  function bnpRShiftTo(n, r)
	  {
	    r.s = this.s;
	    var ds = Math.floor(n / this.DB);
	    if (ds >= this.t)
	    {
	      r.t = 0;
	      return;
	    }
	    var bs = n % this.DB;
	    var cbs = this.DB - bs;
	    var bm = (1 << bs) - 1;
	    r[0] = this[ds] >> bs;
	    for (var i = ds + 1; i < this.t; ++i)
	    {
	      r[i - ds - 1] |= (this[i] & bm) << cbs;
	      r[i - ds] = this[i] >> bs;
	    }
	    if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
	    r.t = this.t - ds;
	    r.clamp();
	  }
	  // (protected) r = this - a
	  function bnpSubTo(a, r)
	  {
	    var i = 0,
	      c = 0,
	      m = Math.min(a.t, this.t);
	    while (i < m)
	    {
	      c += this[i] - a[i];
	      r[i++] = c & this.DM;
	      c >>= this.DB;
	    }
	    if (a.t < this.t)
	    {
	      c -= a.s;
	      while (i < this.t)
	      {
	        c += this[i];
	        r[i++] = c & this.DM;
	        c >>= this.DB;
	      }
	      c += this.s;
	    }
	    else
	    {
	      c += this.s;
	      while (i < a.t)
	      {
	        c -= a[i];
	        r[i++] = c & this.DM;
	        c >>= this.DB;
	      }
	      c -= a.s;
	    }
	    r.s = (c < 0) ? -1 : 0;
	    if (c < -1) r[i++] = this.DV + c;
	    else if (c > 0) r[i++] = c;
	    r.t = i;
	    r.clamp();
	  }
	  // (protected) r = this * a, r != this,a (HAC 14.12)
	  // "this" should be the larger one if appropriate.
	  function bnpMultiplyTo(a, r)
	  {
	    var x = this.abs(),
	      y = a.abs();
	    var i = x.t;
	    r.t = i + y.t;
	    while (--i >= 0) r[i] = 0;
	    for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
	    r.s = 0;
	    r.clamp();
	    if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
	  }
	  // (protected) r = this^2, r != this (HAC 14.16)
	  function bnpSquareTo(r)
	  {
	    var x = this.abs();
	    var i = r.t = 2 * x.t;
	    while (--i >= 0) r[i] = 0;
	    for (i = 0; i < x.t - 1; ++i)
	    {
	      var c = x.am(i, x[i], r, 2 * i, 0, 1);
	      if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV)
	      {
	        r[i + x.t] -= x.DV;
	        r[i + x.t + 1] = 1;
	      }
	    }
	    if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
	    r.s = 0;
	    r.clamp();
	  }
	  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
	  // r != q, this != m.  q or r may be null.
	  function bnpDivRemTo(m, q, r)
	  {
	    var pm = m.abs();
	    if (pm.t <= 0) return;
	    var pt = this.abs();
	    if (pt.t < pm.t)
	    {
	      if (q != null) q.fromInt(0);
	      if (r != null) this.copyTo(r);
	      return;
	    }
	    if (r == null) r = nbi();
	    var y = nbi(),
	      ts = this.s,
	      ms = m.s;
	    var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus
	    if (nsh > 0)
	    {
	      pm.lShiftTo(nsh, y);
	      pt.lShiftTo(nsh, r);
	    }
	    else
	    {
	      pm.copyTo(y);
	      pt.copyTo(r);
	    }
	    var ys = y.t;
	    var y0 = y[ys - 1];
	    if (y0 == 0) return;
	    var yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
	    var d1 = this.FV / yt,
	      d2 = (1 << this.F1) / yt,
	      e = 1 << this.F2;
	    var i = r.t,
	      j = i - ys,
	      t = (q == null) ? nbi() : q;
	    y.dlShiftTo(j, t);
	    if (r.compareTo(t) >= 0)
	    {
	      r[r.t++] = 1;
	      r.subTo(t, r);
	    }
	    BigInteger.ONE.dlShiftTo(ys, t);
	    t.subTo(y, y); // "negative" y so we can replace sub with am later
	    while (y.t < ys) y[y.t++] = 0;
	    while (--j >= 0)
	    {
	      // Estimate quotient digit
	      var qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
	      if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd)
	      { // Try it out
	        y.dlShiftTo(j, t);
	        r.subTo(t, r);
	        while (r[i] < --qd) r.subTo(t, r);
	      }
	    }
	    if (q != null)
	    {
	      r.drShiftTo(ys, q);
	      if (ts != ms) BigInteger.ZERO.subTo(q, q);
	    }
	    r.t = ys;
	    r.clamp();
	    if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
	    if (ts < 0) BigInteger.ZERO.subTo(r, r);
	  }
	  // (public) this mod a
	  function bnMod(a)
	  {
	    var r = nbi();
	    this.abs().divRemTo(a, null, r);
	    if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
	    return r;
	  }
	  // Modular reduction using "classic" algorithm
	  function Classic(m)
	  {
	    this.m = m;
	  }
	
	  function cConvert(x)
	  {
	    if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
	    else return x;
	  }
	
	  function cRevert(x)
	  {
	    return x;
	  }
	
	  function cReduce(x)
	  {
	    x.divRemTo(this.m, null, x);
	  }
	
	  function cMulTo(x, y, r)
	  {
	    x.multiplyTo(y, r);
	    this.reduce(r);
	  }
	
	  function cSqrTo(x, r)
	  {
	    x.squareTo(r);
	    this.reduce(r);
	  }
	  Classic.prototype.convert = cConvert;
	  Classic.prototype.revert = cRevert;
	  Classic.prototype.reduce = cReduce;
	  Classic.prototype.mulTo = cMulTo;
	  Classic.prototype.sqrTo = cSqrTo;
	  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
	  // justification:
	  //         xy == 1 (mod m)
	  //         xy =  1+km
	  //   xy(2-xy) = (1+km)(1-km)
	  // x[y(2-xy)] = 1-k^2m^2
	  // x[y(2-xy)] == 1 (mod m^2)
	  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
	  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
	  // JS multiply "overflows" differently from C/C++, so care is needed here.
	  function bnpInvDigit()
	  {
	    if (this.t < 1) return 0;
	    var x = this[0];
	    if ((x & 1) == 0) return 0;
	    var y = x & 3; // y == 1/x mod 2^2
	    y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
	    y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
	    y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
	    // last step - calculate inverse mod DV directly;
	    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
	    y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
	    // we really want the negative inverse, and -DV < y < DV
	    return (y > 0) ? this.DV - y : -y;
	  }
	  // Montgomery reduction
	  function Montgomery(m)
	  {
	    this.m = m;
	    this.mp = m.invDigit();
	    this.mpl = this.mp & 0x7fff;
	    this.mph = this.mp >> 15;
	    this.um = (1 << (m.DB - 15)) - 1;
	    this.mt2 = 2 * m.t;
	  }
	  // xR mod m
	  function montConvert(x)
	  {
	    var r = nbi();
	    x.abs().dlShiftTo(this.m.t, r);
	    r.divRemTo(this.m, null, r);
	    if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
	    return r;
	  }
	  // x/R mod m
	  function montRevert(x)
	  {
	    var r = nbi();
	    x.copyTo(r);
	    this.reduce(r);
	    return r;
	  }
	  // x = x/R mod m (HAC 14.32)
	  function montReduce(x)
	  {
	    while (x.t <= this.mt2) // pad x so am has enough room later
	      x[x.t++] = 0;
	    for (var i = 0; i < this.m.t; ++i)
	    {
	      // faster way of calculating u0 = x[i]*mp mod DV
	      var j = x[i] & 0x7fff;
	      var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
	      // use am to combine the multiply-shift-add into one call
	      j = i + this.m.t;
	      x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
	      // propagate carry
	      while (x[j] >= x.DV)
	      {
	        x[j] -= x.DV;
	        x[++j]++;
	      }
	    }
	    x.clamp();
	    x.drShiftTo(this.m.t, x);
	    if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
	  }
	  // r = "x^2/R mod m"; x != r
	  function montSqrTo(x, r)
	  {
	    x.squareTo(r);
	    this.reduce(r);
	  }
	  // r = "xy/R mod m"; x,y != r
	  function montMulTo(x, y, r)
	  {
	    x.multiplyTo(y, r);
	    this.reduce(r);
	  }
	  Montgomery.prototype.convert = montConvert;
	  Montgomery.prototype.revert = montRevert;
	  Montgomery.prototype.reduce = montReduce;
	  Montgomery.prototype.mulTo = montMulTo;
	  Montgomery.prototype.sqrTo = montSqrTo;
	  // (protected) true iff this is even
	  function bnpIsEven()
	  {
	    return ((this.t > 0) ? (this[0] & 1) : this.s) == 0;
	  }
	  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
	  function bnpExp(e, z)
	  {
	    if (e > 0xffffffff || e < 1) return BigInteger.ONE;
	    var r = nbi(),
	      r2 = nbi(),
	      g = z.convert(this),
	      i = nbits(e) - 1;
	    g.copyTo(r);
	    while (--i >= 0)
	    {
	      z.sqrTo(r, r2);
	      if ((e & (1 << i)) > 0) z.mulTo(r2, g, r);
	      else
	      {
	        var t = r;
	        r = r2;
	        r2 = t;
	      }
	    }
	    return z.revert(r);
	  }
	  // (public) this^e % m, 0 <= e < 2^32
	  function bnModPowInt(e, m)
	  {
	    var z;
	    if (e < 256 || m.isEven()) z = new Classic(m);
	    else z = new Montgomery(m);
	    return this.exp(e, z);
	  }
	  // protected
	  BigInteger.prototype.copyTo = bnpCopyTo;
	  BigInteger.prototype.fromInt = bnpFromInt;
	  BigInteger.prototype.fromString = bnpFromString;
	  BigInteger.prototype.clamp = bnpClamp;
	  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
	  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
	  BigInteger.prototype.lShiftTo = bnpLShiftTo;
	  BigInteger.prototype.rShiftTo = bnpRShiftTo;
	  BigInteger.prototype.subTo = bnpSubTo;
	  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
	  BigInteger.prototype.squareTo = bnpSquareTo;
	  BigInteger.prototype.divRemTo = bnpDivRemTo;
	  BigInteger.prototype.invDigit = bnpInvDigit;
	  BigInteger.prototype.isEven = bnpIsEven;
	  BigInteger.prototype.exp = bnpExp;
	  // public
	  BigInteger.prototype.toString = bnToString;
	  BigInteger.prototype.negate = bnNegate;
	  BigInteger.prototype.abs = bnAbs;
	  BigInteger.prototype.compareTo = bnCompareTo;
	  BigInteger.prototype.bitLength = bnBitLength;
	  BigInteger.prototype.mod = bnMod;
	  BigInteger.prototype.modPowInt = bnModPowInt;
	  // "constants"
	  BigInteger.ZERO = nbv(0);
	  BigInteger.ONE = nbv(1);
	  // Copyright (c) 2005-2009  Tom Wu
	  // All Rights Reserved.
	  // See "LICENSE" for details.
	  // Extended JavaScript BN functions, required for RSA private ops.
	  // Version 1.1: new BigInteger("0", 10) returns "proper" zero
	  // Version 1.2: square() API, isProbablePrime fix
	  // (public)
	  function bnClone()
	  {
	    var r = nbi();
	    this.copyTo(r);
	    return r;
	  }
	  // (public) return value as integer
	  function bnIntValue()
	  {
	    if (this.s < 0)
	    {
	      if (this.t == 1) return this[0] - this.DV;
	      else if (this.t == 0) return -1;
	    }
	    else if (this.t == 1) return this[0];
	    else if (this.t == 0) return 0;
	    // assumes 16 < DB < 32
	    return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
	  }
	  // (public) return value as byte
	  function bnByteValue()
	  {
	    return (this.t == 0) ? this.s : (this[0] << 24) >> 24;
	  }
	  // (public) return value as short (assumes DB>=16)
	  function bnShortValue()
	  {
	    return (this.t == 0) ? this.s : (this[0] << 16) >> 16;
	  }
	  // (protected) return x s.t. r^x < DV
	  function bnpChunkSize(r)
	  {
	    return Math.floor(Math.LN2 * this.DB / Math.log(r));
	  }
	  // (public) 0 if this == 0, 1 if this > 0
	  function bnSigNum()
	  {
	    if (this.s < 0) return -1;
	    else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
	    else return 1;
	  }
	  // (protected) convert to radix string
	  function bnpToRadix(b)
	  {
	    if (b == null) b = 10;
	    if (this.signum() == 0 || b < 2 || b > 36) return "0";
	    var cs = this.chunkSize(b);
	    var a = Math.pow(b, cs);
	    var d = nbv(a),
	      y = nbi(),
	      z = nbi(),
	      r = "";
	    this.divRemTo(d, y, z);
	    while (y.signum() > 0)
	    {
	      r = (a + z.intValue()).toString(b).substr(1) + r;
	      y.divRemTo(d, y, z);
	    }
	    return z.intValue().toString(b) + r;
	  }
	  // (protected) convert from radix string
	  function bnpFromRadix(s, b)
	  {
	    this.fromInt(0);
	    if (b == null) b = 10;
	    var cs = this.chunkSize(b);
	    var d = Math.pow(b, cs),
	      mi = false,
	      j = 0,
	      w = 0;
	    for (var i = 0; i < s.length; ++i)
	    {
	      var x = intAt(s, i);
	      if (x < 0)
	      {
	        if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
	        continue;
	      }
	      w = b * w + x;
	      if (++j >= cs)
	      {
	        this.dMultiply(d);
	        this.dAddOffset(w, 0);
	        j = 0;
	        w = 0;
	      }
	    }
	    if (j > 0)
	    {
	      this.dMultiply(Math.pow(b, j));
	      this.dAddOffset(w, 0);
	    }
	    if (mi) BigInteger.ZERO.subTo(this, this);
	  }
	  // (protected) alternate constructor
	  function bnpFromNumber(a, b, c)
	  {
	    if ("number" == typeof b)
	    {
	      // new BigInteger(int,int,RNG)
	      if (a < 2) this.fromInt(1);
	      else
	      {
	        this.fromNumber(a, c);
	        if (!this.testBit(a - 1)) // force MSB set
	          this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
	        if (this.isEven()) this.dAddOffset(1, 0); // force odd
	        while (!this.isProbablePrime(b))
	        {
	          this.dAddOffset(2, 0);
	          if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
	        }
	      }
	    }
	    else
	    {
	      // new BigInteger(int,RNG)
	      var x = new Array(),
	        t = a & 7;
	      x.length = (a >> 3) + 1;
	      b.nextBytes(x);
	      if (t > 0) x[0] &= ((1 << t) - 1);
	      else x[0] = 0;
	      this.fromString(x, 256);
	    }
	  }
	  // (public) convert to bigendian byte array
	  function bnToByteArray()
	  {
	    var i = this.t,
	      r = new Array();
	    r[0] = this.s;
	    var p = this.DB - (i * this.DB) % 8,
	      d, k = 0;
	    if (i-- > 0)
	    {
	      if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
	        r[k++] = d | (this.s << (this.DB - p));
	      while (i >= 0)
	      {
	        if (p < 8)
	        {
	          d = (this[i] & ((1 << p) - 1)) << (8 - p);
	          d |= this[--i] >> (p += this.DB - 8);
	        }
	        else
	        {
	          d = (this[i] >> (p -= 8)) & 0xff;
	          if (p <= 0)
	          {
	            p += this.DB;
	            --i;
	          }
	        }
	        if ((d & 0x80) != 0) d |= -256;
	        if (k == 0 && (this.s & 0x80) != (d & 0x80))++k;
	        if (k > 0 || d != this.s) r[k++] = d;
	      }
	    }
	    return r;
	  }
	
	  function bnEquals(a)
	  {
	    return (this.compareTo(a) == 0);
	  }
	
	  function bnMin(a)
	  {
	    return (this.compareTo(a) < 0) ? this : a;
	  }
	
	  function bnMax(a)
	  {
	    return (this.compareTo(a) > 0) ? this : a;
	  }
	  // (protected) r = this op a (bitwise)
	  function bnpBitwiseTo(a, op, r)
	  {
	    var i, f, m = Math.min(a.t, this.t);
	    for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
	    if (a.t < this.t)
	    {
	      f = a.s & this.DM;
	      for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
	      r.t = this.t;
	    }
	    else
	    {
	      f = this.s & this.DM;
	      for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
	      r.t = a.t;
	    }
	    r.s = op(this.s, a.s);
	    r.clamp();
	  }
	  // (public) this & a
	  function op_and(x, y)
	  {
	    return x & y;
	  }
	
	  function bnAnd(a)
	  {
	    var r = nbi();
	    this.bitwiseTo(a, op_and, r);
	    return r;
	  }
	  // (public) this | a
	  function op_or(x, y)
	  {
	    return x | y;
	  }
	
	  function bnOr(a)
	  {
	    var r = nbi();
	    this.bitwiseTo(a, op_or, r);
	    return r;
	  }
	  // (public) this ^ a
	  function op_xor(x, y)
	  {
	    return x ^ y;
	  }
	
	  function bnXor(a)
	  {
	    var r = nbi();
	    this.bitwiseTo(a, op_xor, r);
	    return r;
	  }
	  // (public) this & ~a
	  function op_andnot(x, y)
	  {
	    return x & ~y;
	  }
	
	  function bnAndNot(a)
	  {
	    var r = nbi();
	    this.bitwiseTo(a, op_andnot, r);
	    return r;
	  }
	  // (public) ~this
	  function bnNot()
	  {
	    var r = nbi();
	    for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
	    r.t = this.t;
	    r.s = ~this.s;
	    return r;
	  }
	  // (public) this << n
	  function bnShiftLeft(n)
	  {
	    var r = nbi();
	    if (n < 0) this.rShiftTo(-n, r);
	    else this.lShiftTo(n, r);
	    return r;
	  }
	  // (public) this >> n
	  function bnShiftRight(n)
	  {
	    var r = nbi();
	    if (n < 0) this.lShiftTo(-n, r);
	    else this.rShiftTo(n, r);
	    return r;
	  }
	  // return index of lowest 1-bit in x, x < 2^31
	  function lbit(x)
	  {
	    if (x == 0) return -1;
	    var r = 0;
	    if ((x & 0xffff) == 0)
	    {
	      x >>= 16;
	      r += 16;
	    }
	    if ((x & 0xff) == 0)
	    {
	      x >>= 8;
	      r += 8;
	    }
	    if ((x & 0xf) == 0)
	    {
	      x >>= 4;
	      r += 4;
	    }
	    if ((x & 3) == 0)
	    {
	      x >>= 2;
	      r += 2;
	    }
	    if ((x & 1) == 0)++r;
	    return r;
	  }
	  // (public) returns index of lowest 1-bit (or -1 if none)
	  function bnGetLowestSetBit()
	  {
	    for (var i = 0; i < this.t; ++i)
	      if (this[i] != 0) return i * this.DB + lbit(this[i]);
	    if (this.s < 0) return this.t * this.DB;
	    return -1;
	  }
	  // return number of 1 bits in x
	  function cbit(x)
	  {
	    var r = 0;
	    while (x != 0)
	    {
	      x &= x - 1;
	      ++r;
	    }
	    return r;
	  }
	  // (public) return number of set bits
	  function bnBitCount()
	  {
	    var r = 0,
	      x = this.s & this.DM;
	    for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
	    return r;
	  }
	  // (public) true iff nth bit is set
	  function bnTestBit(n)
	  {
	    var j = Math.floor(n / this.DB);
	    if (j >= this.t) return (this.s != 0);
	    return ((this[j] & (1 << (n % this.DB))) != 0);
	  }
	  // (protected) this op (1<<n)
	  function bnpChangeBit(n, op)
	  {
	    var r = BigInteger.ONE.shiftLeft(n);
	    this.bitwiseTo(r, op, r);
	    return r;
	  }
	  // (public) this | (1<<n)
	  function bnSetBit(n)
	  {
	    return this.changeBit(n, op_or);
	  }
	  // (public) this & ~(1<<n)
	  function bnClearBit(n)
	  {
	    return this.changeBit(n, op_andnot);
	  }
	  // (public) this ^ (1<<n)
	  function bnFlipBit(n)
	  {
	    return this.changeBit(n, op_xor);
	  }
	  // (protected) r = this + a
	  function bnpAddTo(a, r)
	  {
	    var i = 0,
	      c = 0,
	      m = Math.min(a.t, this.t);
	    while (i < m)
	    {
	      c += this[i] + a[i];
	      r[i++] = c & this.DM;
	      c >>= this.DB;
	    }
	    if (a.t < this.t)
	    {
	      c += a.s;
	      while (i < this.t)
	      {
	        c += this[i];
	        r[i++] = c & this.DM;
	        c >>= this.DB;
	      }
	      c += this.s;
	    }
	    else
	    {
	      c += this.s;
	      while (i < a.t)
	      {
	        c += a[i];
	        r[i++] = c & this.DM;
	        c >>= this.DB;
	      }
	      c += a.s;
	    }
	    r.s = (c < 0) ? -1 : 0;
	    if (c > 0) r[i++] = c;
	    else if (c < -1) r[i++] = this.DV + c;
	    r.t = i;
	    r.clamp();
	  }
	  // (public) this + a
	  function bnAdd(a)
	  {
	    var r = nbi();
	    this.addTo(a, r);
	    return r;
	  }
	  // (public) this - a
	  function bnSubtract(a)
	  {
	    var r = nbi();
	    this.subTo(a, r);
	    return r;
	  }
	  // (public) this * a
	  function bnMultiply(a)
	  {
	    var r = nbi();
	    this.multiplyTo(a, r);
	    return r;
	  }
	  // (public) this^2
	  function bnSquare()
	  {
	    var r = nbi();
	    this.squareTo(r);
	    return r;
	  }
	  // (public) this / a
	  function bnDivide(a)
	  {
	    var r = nbi();
	    this.divRemTo(a, r, null);
	    return r;
	  }
	  // (public) this % a
	  function bnRemainder(a)
	  {
	    var r = nbi();
	    this.divRemTo(a, null, r);
	    return r;
	  }
	  // (public) [this/a,this%a]
	  function bnDivideAndRemainder(a)
	  {
	    var q = nbi(),
	      r = nbi();
	    this.divRemTo(a, q, r);
	    return new Array(q, r);
	  }
	  // (protected) this *= n, this >= 0, 1 < n < DV
	  function bnpDMultiply(n)
	  {
	    this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
	    ++this.t;
	    this.clamp();
	  }
	  // (protected) this += n << w words, this >= 0
	  function bnpDAddOffset(n, w)
	  {
	    if (n == 0) return;
	    while (this.t <= w) this[this.t++] = 0;
	    this[w] += n;
	    while (this[w] >= this.DV)
	    {
	      this[w] -= this.DV;
	      if (++w >= this.t) this[this.t++] = 0;
	      ++this[w];
	    }
	  }
	  // A "null" reducer
	  function NullExp()
	  {}
	
	  function nNop(x)
	  {
	    return x;
	  }
	
	  function nMulTo(x, y, r)
	  {
	    x.multiplyTo(y, r);
	  }
	
	  function nSqrTo(x, r)
	  {
	    x.squareTo(r);
	  }
	  NullExp.prototype.convert = nNop;
	  NullExp.prototype.revert = nNop;
	  NullExp.prototype.mulTo = nMulTo;
	  NullExp.prototype.sqrTo = nSqrTo;
	  // (public) this^e
	  function bnPow(e)
	  {
	    return this.exp(e, new NullExp());
	  }
	  // (protected) r = lower n words of "this * a", a.t <= n
	  // "this" should be the larger one if appropriate.
	  function bnpMultiplyLowerTo(a, n, r)
	  {
	    var i = Math.min(this.t + a.t, n);
	    r.s = 0; // assumes a,this >= 0
	    r.t = i;
	    while (i > 0) r[--i] = 0;
	    var j;
	    for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
	    for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
	    r.clamp();
	  }
	  // (protected) r = "this * a" without lower n words, n > 0
	  // "this" should be the larger one if appropriate.
	  function bnpMultiplyUpperTo(a, n, r)
	  {
	    --n;
	    var i = r.t = this.t + a.t - n;
	    r.s = 0; // assumes a,this >= 0
	    while (--i >= 0) r[i] = 0;
	    for (i = Math.max(n - this.t, 0); i < a.t; ++i)
	      r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
	    r.clamp();
	    r.drShiftTo(1, r);
	  }
	  // Barrett modular reduction
	  function Barrett(m)
	  {
	    // setup Barrett
	    this.r2 = nbi();
	    this.q3 = nbi();
	    BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
	    this.mu = this.r2.divide(m);
	    this.m = m;
	  }
	
	  function barrettConvert(x)
	  {
	    if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
	    else if (x.compareTo(this.m) < 0) return x;
	    else
	    {
	      var r = nbi();
	      x.copyTo(r);
	      this.reduce(r);
	      return r;
	    }
	  }
	
	  function barrettRevert(x)
	  {
	    return x;
	  }
	  // x = x mod m (HAC 14.42)
	  function barrettReduce(x)
	  {
	    x.drShiftTo(this.m.t - 1, this.r2);
	    if (x.t > this.m.t + 1)
	    {
	      x.t = this.m.t + 1;
	      x.clamp();
	    }
	    this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
	    this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
	    while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
	    x.subTo(this.r2, x);
	    while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
	  }
	  // r = x^2 mod m; x != r
	  function barrettSqrTo(x, r)
	  {
	    x.squareTo(r);
	    this.reduce(r);
	  }
	  // r = x*y mod m; x,y != r
	  function barrettMulTo(x, y, r)
	  {
	    x.multiplyTo(y, r);
	    this.reduce(r);
	  }
	  Barrett.prototype.convert = barrettConvert;
	  Barrett.prototype.revert = barrettRevert;
	  Barrett.prototype.reduce = barrettReduce;
	  Barrett.prototype.mulTo = barrettMulTo;
	  Barrett.prototype.sqrTo = barrettSqrTo;
	  // (public) this^e % m (HAC 14.85)
	  function bnModPow(e, m)
	  {
	    var i = e.bitLength(),
	      k, r = nbv(1),
	      z;
	    if (i <= 0) return r;
	    else if (i < 18) k = 1;
	    else if (i < 48) k = 3;
	    else if (i < 144) k = 4;
	    else if (i < 768) k = 5;
	    else k = 6;
	    if (i < 8)
	      z = new Classic(m);
	    else if (m.isEven())
	      z = new Barrett(m);
	    else
	      z = new Montgomery(m);
	    // precomputation
	    var g = new Array(),
	      n = 3,
	      k1 = k - 1,
	      km = (1 << k) - 1;
	    g[1] = z.convert(this);
	    if (k > 1)
	    {
	      var g2 = nbi();
	      z.sqrTo(g[1], g2);
	      while (n <= km)
	      {
	        g[n] = nbi();
	        z.mulTo(g2, g[n - 2], g[n]);
	        n += 2;
	      }
	    }
	    var j = e.t - 1,
	      w, is1 = true,
	      r2 = nbi(),
	      t;
	    i = nbits(e[j]) - 1;
	    while (j >= 0)
	    {
	      if (i >= k1) w = (e[j] >> (i - k1)) & km;
	      else
	      {
	        w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
	        if (j > 0) w |= e[j - 1] >> (this.DB + i - k1);
	      }
	      n = k;
	      while ((w & 1) == 0)
	      {
	        w >>= 1;
	        --n;
	      }
	      if ((i -= n) < 0)
	      {
	        i += this.DB;
	        --j;
	      }
	      if (is1)
	      { // ret == 1, don't bother squaring or multiplying it
	        g[w].copyTo(r);
	        is1 = false;
	      }
	      else
	      {
	        while (n > 1)
	        {
	          z.sqrTo(r, r2);
	          z.sqrTo(r2, r);
	          n -= 2;
	        }
	        if (n > 0) z.sqrTo(r, r2);
	        else
	        {
	          t = r;
	          r = r2;
	          r2 = t;
	        }
	        z.mulTo(r2, g[w], r);
	      }
	      while (j >= 0 && (e[j] & (1 << i)) == 0)
	      {
	        z.sqrTo(r, r2);
	        t = r;
	        r = r2;
	        r2 = t;
	        if (--i < 0)
	        {
	          i = this.DB - 1;
	          --j;
	        }
	      }
	    }
	    return z.revert(r);
	  }
	  // (public) gcd(this,a) (HAC 14.54)
	  function bnGCD(a)
	  {
	    var x = (this.s < 0) ? this.negate() : this.clone();
	    var y = (a.s < 0) ? a.negate() : a.clone();
	    if (x.compareTo(y) < 0)
	    {
	      var t = x;
	      x = y;
	      y = t;
	    }
	    var i = x.getLowestSetBit(),
	      g = y.getLowestSetBit();
	    if (g < 0) return x;
	    if (i < g) g = i;
	    if (g > 0)
	    {
	      x.rShiftTo(g, x);
	      y.rShiftTo(g, y);
	    }
	    while (x.signum() > 0)
	    {
	      if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
	      if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
	      if (x.compareTo(y) >= 0)
	      {
	        x.subTo(y, x);
	        x.rShiftTo(1, x);
	      }
	      else
	      {
	        y.subTo(x, y);
	        y.rShiftTo(1, y);
	      }
	    }
	    if (g > 0) y.lShiftTo(g, y);
	    return y;
	  }
	  // (protected) this % n, n < 2^26
	  function bnpModInt(n)
	  {
	    if (n <= 0) return 0;
	    var d = this.DV % n,
	      r = (this.s < 0) ? n - 1 : 0;
	    if (this.t > 0)
	      if (d == 0) r = this[0] % n;
	      else
	        for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
	    return r;
	  }
	  // (public) 1/this % m (HAC 14.61)
	  function bnModInverse(m)
	  {
	    var ac = m.isEven();
	    if ((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
	    var u = m.clone(),
	      v = this.clone();
	    var a = nbv(1),
	      b = nbv(0),
	      c = nbv(0),
	      d = nbv(1);
	    while (u.signum() != 0)
	    {
	      while (u.isEven())
	      {
	        u.rShiftTo(1, u);
	        if (ac)
	        {
	          if (!a.isEven() || !b.isEven())
	          {
	            a.addTo(this, a);
	            b.subTo(m, b);
	          }
	          a.rShiftTo(1, a);
	        }
	        else if (!b.isEven()) b.subTo(m, b);
	        b.rShiftTo(1, b);
	      }
	      while (v.isEven())
	      {
	        v.rShiftTo(1, v);
	        if (ac)
	        {
	          if (!c.isEven() || !d.isEven())
	          {
	            c.addTo(this, c);
	            d.subTo(m, d);
	          }
	          c.rShiftTo(1, c);
	        }
	        else if (!d.isEven()) d.subTo(m, d);
	        d.rShiftTo(1, d);
	      }
	      if (u.compareTo(v) >= 0)
	      {
	        u.subTo(v, u);
	        if (ac) a.subTo(c, a);
	        b.subTo(d, b);
	      }
	      else
	      {
	        v.subTo(u, v);
	        if (ac) c.subTo(a, c);
	        d.subTo(b, d);
	      }
	    }
	    if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
	    if (d.compareTo(m) >= 0) return d.subtract(m);
	    if (d.signum() < 0) d.addTo(m, d);
	    else return d;
	    if (d.signum() < 0) return d.add(m);
	    else return d;
	  }
	  var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
	  var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
	  // (public) test primality with certainty >= 1-.5^t
	  function bnIsProbablePrime(t)
	  {
	    var i, x = this.abs();
	    if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1])
	    {
	      for (i = 0; i < lowprimes.length; ++i)
	        if (x[0] == lowprimes[i]) return true;
	      return false;
	    }
	    if (x.isEven()) return false;
	    i = 1;
	    while (i < lowprimes.length)
	    {
	      var m = lowprimes[i],
	        j = i + 1;
	      while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
	      m = x.modInt(m);
	      while (i < j)
	        if (m % lowprimes[i++] == 0) return false;
	    }
	    return x.millerRabin(t);
	  }
	  // (protected) true if probably prime (HAC 4.24, Miller-Rabin)
	  function bnpMillerRabin(t)
	  {
	    var n1 = this.subtract(BigInteger.ONE);
	    var k = n1.getLowestSetBit();
	    if (k <= 0) return false;
	    var r = n1.shiftRight(k);
	    t = (t + 1) >> 1;
	    if (t > lowprimes.length) t = lowprimes.length;
	    var a = nbi();
	    for (var i = 0; i < t; ++i)
	    {
	      //Pick bases at random, instead of starting at 2
	      a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
	      var y = a.modPow(r, this);
	      if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0)
	      {
	        var j = 1;
	        while (j++ < k && y.compareTo(n1) != 0)
	        {
	          y = y.modPowInt(2, this);
	          if (y.compareTo(BigInteger.ONE) == 0) return false;
	        }
	        if (y.compareTo(n1) != 0) return false;
	      }
	    }
	    return true;
	  }
	  // protected
	  BigInteger.prototype.chunkSize = bnpChunkSize;
	  BigInteger.prototype.toRadix = bnpToRadix;
	  BigInteger.prototype.fromRadix = bnpFromRadix;
	  BigInteger.prototype.fromNumber = bnpFromNumber;
	  BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
	  BigInteger.prototype.changeBit = bnpChangeBit;
	  BigInteger.prototype.addTo = bnpAddTo;
	  BigInteger.prototype.dMultiply = bnpDMultiply;
	  BigInteger.prototype.dAddOffset = bnpDAddOffset;
	  BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
	  BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
	  BigInteger.prototype.modInt = bnpModInt;
	  BigInteger.prototype.millerRabin = bnpMillerRabin;
	  // public
	  BigInteger.prototype.clone = bnClone;
	  BigInteger.prototype.intValue = bnIntValue;
	  BigInteger.prototype.byteValue = bnByteValue;
	  BigInteger.prototype.shortValue = bnShortValue;
	  BigInteger.prototype.signum = bnSigNum;
	  BigInteger.prototype.toByteArray = bnToByteArray;
	  BigInteger.prototype.equals = bnEquals;
	  BigInteger.prototype.min = bnMin;
	  BigInteger.prototype.max = bnMax;
	  BigInteger.prototype.and = bnAnd;
	  BigInteger.prototype.or = bnOr;
	  BigInteger.prototype.xor = bnXor;
	  BigInteger.prototype.andNot = bnAndNot;
	  BigInteger.prototype.not = bnNot;
	  BigInteger.prototype.shiftLeft = bnShiftLeft;
	  BigInteger.prototype.shiftRight = bnShiftRight;
	  BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
	  BigInteger.prototype.bitCount = bnBitCount;
	  BigInteger.prototype.testBit = bnTestBit;
	  BigInteger.prototype.setBit = bnSetBit;
	  BigInteger.prototype.clearBit = bnClearBit;
	  BigInteger.prototype.flipBit = bnFlipBit;
	  BigInteger.prototype.add = bnAdd;
	  BigInteger.prototype.subtract = bnSubtract;
	  BigInteger.prototype.multiply = bnMultiply;
	  BigInteger.prototype.divide = bnDivide;
	  BigInteger.prototype.remainder = bnRemainder;
	  BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
	  BigInteger.prototype.modPow = bnModPow;
	  BigInteger.prototype.modInverse = bnModInverse;
	  BigInteger.prototype.pow = bnPow;
	  BigInteger.prototype.gcd = bnGCD;
	  BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
	  // JSBN-specific extension
	  BigInteger.prototype.square = bnSquare;
	  var Int128 = BigInteger;
	  // BigInteger interfaces not implemented in jsbn:
	  // BigInteger(int signum, byte[] magnitude)
	  // double doubleValue()
	  // float floatValue()
	  // int hashCode()
	  // long longValue()
	  // static BigInteger valueOf(long val)
	  // Helper functions to make BigInteger functions callable with two parameters
	  // as in original C# Clipper
	  Int128.prototype.IsNegative = function ()
	  {
	    if (this.compareTo(Int128.ZERO) == -1) return true;
	    else return false;
	  };
	  Int128.op_Equality = function (val1, val2)
	  {
	    if (val1.compareTo(val2) == 0) return true;
	    else return false;
	  };
	  Int128.op_Inequality = function (val1, val2)
	  {
	    if (val1.compareTo(val2) != 0) return true;
	    else return false;
	  };
	  Int128.op_GreaterThan = function (val1, val2)
	  {
	    if (val1.compareTo(val2) > 0) return true;
	    else return false;
	  };
	  Int128.op_LessThan = function (val1, val2)
	  {
	    if (val1.compareTo(val2) < 0) return true;
	    else return false;
	  };
	  Int128.op_Addition = function (lhs, rhs)
	  {
	    return new Int128(lhs).add(new Int128(rhs));
	  };
	  Int128.op_Subtraction = function (lhs, rhs)
	  {
	    return new Int128(lhs).subtract(new Int128(rhs));
	  };
	  Int128.Int128Mul = function (lhs, rhs)
	  {
	    return new Int128(lhs).multiply(new Int128(rhs));
	  };
	  Int128.op_Division = function (lhs, rhs)
	  {
	    return lhs.divide(rhs);
	  };
	  Int128.prototype.ToDouble = function ()
	  {
	    return parseFloat(this.toString()); // This could be something faster
	  };
	  // end of Int128 section
	  /*
	  // Uncomment the following two lines if you want to use Int128 outside ClipperLib
	  if (typeof(document) !== "undefined") window.Int128 = Int128;
	  else self.Int128 = Int128;
	  */
	
	
	  // ---------------------------------------------
	  // Here starts the actual Clipper library:
	  // Helper function to support Inheritance in Javascript
		var Inherit = function (ce, ce2)
		{
			var p;
			if (typeof (Object.getOwnPropertyNames) == 'undefined')
			{
				for (p in ce2.prototype)
					if (typeof (ce.prototype[p]) == 'undefined' || ce.prototype[p] == Object.prototype[p]) ce.prototype[p] = ce2.prototype[p];
				for (p in ce2)
					if (typeof (ce[p]) == 'undefined') ce[p] = ce2[p];
				ce.$baseCtor = ce2;
			}
			else
			{
				var props = Object.getOwnPropertyNames(ce2.prototype);
				for (var i = 0; i < props.length; i++)
					if (typeof (Object.getOwnPropertyDescriptor(ce.prototype, props[i])) == 'undefined') Object.defineProperty(ce.prototype, props[i], Object.getOwnPropertyDescriptor(ce2.prototype, props[i]));
				for (p in ce2)
					if (typeof (ce[p]) == 'undefined') ce[p] = ce2[p];
				ce.$baseCtor = ce2;
			}
		};
	  ClipperLib.Path = function ()
	  {
	    return [];
	  };
	  ClipperLib.Paths = function ()
	  {
	    return []; // Was previously [[]], but caused problems when pushed
	  };
	  // Preserves the calling way of original C# Clipper
	  // Is essential due to compatibility, because DoublePoint is public class in original C# version
	  ClipperLib.DoublePoint = function ()
	  {
	    var a = arguments;
	    this.X = 0;
	    this.Y = 0;
	    // public DoublePoint(DoublePoint dp)
	    // public DoublePoint(IntPoint ip)
	    if (a.length == 1)
	    {
	      this.X = a[0].X;
	      this.Y = a[0].Y;
	    }
	    else if (a.length == 2)
	    {
	      this.X = a[0];
	      this.Y = a[1];
	    }
	  }; // This is internal faster function when called without arguments
	  ClipperLib.DoublePoint0 = function ()
	  {
	    this.X = 0;
	    this.Y = 0;
	  };
	  // This is internal faster function when called with 1 argument (dp or ip)
	  ClipperLib.DoublePoint1 = function (dp)
	  {
	    this.X = dp.X;
	    this.Y = dp.Y;
	  };
	  // This is internal faster function when called with 2 arguments (x and y)
	  ClipperLib.DoublePoint2 = function (x, y)
	  {
	    this.X = x;
	    this.Y = y;
	  };
	  // PolyTree & PolyNode start
	  // -------------------------------
	  ClipperLib.PolyNode = function ()
	  {
	    this.m_Parent = null;
	    this.m_polygon = new ClipperLib.Path();
	    this.m_Index = 0;
	    this.m_jointype = 0;
	    this.m_endtype = 0;
	    this.m_Childs = [];
	    this.IsOpen = false;
	  };
	  ClipperLib.PolyNode.prototype.IsHoleNode = function ()
	  {
	    var result = true;
	    var node = this.m_Parent;
	    while (node !== null)
	    {
	      result = !result;
	      node = node.m_Parent;
	    }
	    return result;
	  };
	  ClipperLib.PolyNode.prototype.ChildCount = function ()
	  {
	    return this.m_Childs.length;
	  };
	  ClipperLib.PolyNode.prototype.Contour = function ()
	  {
	    return this.m_polygon;
	  };
	  ClipperLib.PolyNode.prototype.AddChild = function (Child)
	  {
	    var cnt = this.m_Childs.length;
	    this.m_Childs.push(Child);
	    Child.m_Parent = this;
	    Child.m_Index = cnt;
	  };
	  ClipperLib.PolyNode.prototype.GetNext = function ()
	  {
	    if (this.m_Childs.length > 0)
	      return this.m_Childs[0];
	    else
	      return this.GetNextSiblingUp();
	  };
	  ClipperLib.PolyNode.prototype.GetNextSiblingUp = function ()
	  {
	    if (this.m_Parent === null)
	      return null;
	    else if (this.m_Index == this.m_Parent.m_Childs.length - 1)
	      return this.m_Parent.GetNextSiblingUp();
	    else
	      return this.m_Parent.m_Childs[this.m_Index + 1];
	  };
	  ClipperLib.PolyNode.prototype.Childs = function ()
	  {
	    return this.m_Childs;
	  };
	  ClipperLib.PolyNode.prototype.Parent = function ()
	  {
	    return this.m_Parent;
	  };
	  ClipperLib.PolyNode.prototype.IsHole = function ()
	  {
	    return this.IsHoleNode();
	  };
	  // PolyTree : PolyNode
	  ClipperLib.PolyTree = function ()
	  {
	    this.m_AllPolys = [];
	    ClipperLib.PolyNode.call(this);
	  };
	  ClipperLib.PolyTree.prototype.Clear = function ()
	  {
	    for (var i = 0, ilen = this.m_AllPolys.length; i < ilen; i++)
	      this.m_AllPolys[i] = null;
	    this.m_AllPolys.length = 0;
	    this.m_Childs.length = 0;
	  };
	  ClipperLib.PolyTree.prototype.GetFirst = function ()
	  {
	    if (this.m_Childs.length > 0)
	      return this.m_Childs[0];
	    else
	      return null;
	  };
	  ClipperLib.PolyTree.prototype.Total = function ()
	  {
			var result = this.m_AllPolys.length;
			//with negative offsets, ignore the hidden outer polygon ...
			if (result > 0 && this.m_Childs[0] != this.m_AllPolys[0]) result--;
			return result;
	  };
	  Inherit(ClipperLib.PolyTree, ClipperLib.PolyNode);
	  // -------------------------------
	  // PolyTree & PolyNode end
	  ClipperLib.Math_Abs_Int64 = ClipperLib.Math_Abs_Int32 = ClipperLib.Math_Abs_Double = function (a)
	  {
	    return Math.abs(a);
	  };
	  ClipperLib.Math_Max_Int32_Int32 = function (a, b)
	  {
	    return Math.max(a, b);
	  };
	  /*
	  -----------------------------------
	  cast_32 speedtest: http://jsperf.com/truncate-float-to-integer/2
	  -----------------------------------
	  */
	  if (browser.msie || browser.opera || browser.safari) ClipperLib.Cast_Int32 = function (a)
	  {
	    return a | 0;
	  };
	  else ClipperLib.Cast_Int32 = function (a)
	  { // eg. browser.chrome || browser.chromium || browser.firefox
	    return~~ a;
	  };
	  /*
	  --------------------------
	  cast_64 speedtests: http://jsperf.com/truncate-float-to-integer
	  Chrome: bitwise_not_floor
	  Firefox17: toInteger (typeof test)
	  IE9: bitwise_or_floor
	  IE7 and IE8: to_parseint
	  Chromium: to_floor_or_ceil
	  Firefox3: to_floor_or_ceil
	  Firefox15: to_floor_or_ceil
	  Opera: to_floor_or_ceil
	  Safari: to_floor_or_ceil
	  --------------------------
	  */
	  if (browser.chrome) ClipperLib.Cast_Int64 = function (a)
	  {
	    if (a < -2147483648 || a > 2147483647)
	      return a < 0 ? Math.ceil(a) : Math.floor(a);
	    else return~~ a;
	  };
	  else if (browser.firefox && typeof (Number.toInteger) == "function") ClipperLib.Cast_Int64 = function (a)
	  {
	    return Number.toInteger(a);
	  };
	  else if (browser.msie7 || browser.msie8) ClipperLib.Cast_Int64 = function (a)
	  {
	    return parseInt(a, 10);
	  };
	  else if (browser.msie) ClipperLib.Cast_Int64 = function (a)
	  {
	    if (a < -2147483648 || a > 2147483647)
	      return a < 0 ? Math.ceil(a) : Math.floor(a);
	    return a | 0;
	  };
	  // eg. browser.chromium || browser.firefox || browser.opera || browser.safari
	  else ClipperLib.Cast_Int64 = function (a)
	  {
	    return a < 0 ? Math.ceil(a) : Math.floor(a);
	  };
	  ClipperLib.Clear = function (a)
	  {
	    a.length = 0;
	  };
	  //ClipperLib.MaxSteps = 64; // How many steps at maximum in arc in BuildArc() function
	  ClipperLib.PI = 3.141592653589793;
	  ClipperLib.PI2 = 2 * 3.141592653589793;
	  ClipperLib.IntPoint = function ()
	  {
	    var a = arguments,
	      alen = a.length;
	    this.X = 0;
	    this.Y = 0;
	    if (use_xyz)
	    {
	      this.Z = 0;
	      if (alen == 3) // public IntPoint(cInt x, cInt y, cInt z = 0)
	      {
	        this.X = a[0];
	        this.Y = a[1];
	        this.Z = a[2];
	      }
	      else if (alen == 2) // public IntPoint(cInt x, cInt y)
	      {
	        this.X = a[0];
	        this.Y = a[1];
	        this.Z = 0;
	      }
	      else if (alen == 1)
	      {
	        if (a[0] instanceof ClipperLib.DoublePoint) // public IntPoint(DoublePoint dp)
	        {
	          var dp = a[0];
	          this.X = ClipperLib.Clipper.Round(dp.X);
	          this.Y = ClipperLib.Clipper.Round(dp.Y);
	          this.Z = 0;
	        }
	        else // public IntPoint(IntPoint pt)
	        {
	          var pt = a[0];
	          if (typeof (pt.Z) == "undefined") pt.Z = 0;
	          this.X = pt.X;
	          this.Y = pt.Y;
	          this.Z = pt.Z;
	        }
	      }
	      else // public IntPoint()
	      {
	        this.X = 0;
	        this.Y = 0;
	        this.Z = 0;
	      }
	    }
	    else // if (!use_xyz)
	    {
	      if (alen == 2) // public IntPoint(cInt X, cInt Y)
	      {
	        this.X = a[0];
	        this.Y = a[1];
	      }
	      else if (alen == 1)
	      {
	        if (a[0] instanceof ClipperLib.DoublePoint) // public IntPoint(DoublePoint dp)
	        {
	          var dp = a[0];
	          this.X = ClipperLib.Clipper.Round(dp.X);
	          this.Y = ClipperLib.Clipper.Round(dp.Y);
	        }
	        else // public IntPoint(IntPoint pt)
	        {
	          var pt = a[0];
	          this.X = pt.X;
	          this.Y = pt.Y;
	        }
	      }
	      else // public IntPoint(IntPoint pt)
	      {
	        this.X = 0;
	        this.Y = 0;
	      }
	    }
	  };
	  ClipperLib.IntPoint.op_Equality = function (a, b)
	  {
	    //return a == b;
	    return a.X == b.X && a.Y == b.Y;
	  };
	  ClipperLib.IntPoint.op_Inequality = function (a, b)
	  {
	    //return a != b;
	    return a.X != b.X || a.Y != b.Y;
	  };
	  /*
	  ClipperLib.IntPoint.prototype.Equals = function (obj)
	  {
	    if (obj === null)
	        return false;
	    if (obj instanceof ClipperLib.IntPoint)
	    {
	        var a = Cast(obj, ClipperLib.IntPoint);
	        return (this.X == a.X) && (this.Y == a.Y);
	    }
	    else
	        return false;
	  };
	*/
	  if (use_xyz)
	  {
	    ClipperLib.IntPoint0 = function ()
	    {
	      this.X = 0;
	      this.Y = 0;
	      this.Z = 0;
	    };
	    ClipperLib.IntPoint1 = function (pt)
	    {
	      this.X = pt.X;
	      this.Y = pt.Y;
	      this.Z = pt.Z;
	    };
	    ClipperLib.IntPoint1dp = function (dp)
	    {
	      this.X = ClipperLib.Clipper.Round(dp.X);
	      this.Y = ClipperLib.Clipper.Round(dp.Y);
	      this.Z = 0;
	    };
	    ClipperLib.IntPoint2 = function (x, y)
	    {
	      this.X = x;
	      this.Y = y;
	      this.Z = 0;
	    };
	    ClipperLib.IntPoint3 = function (x, y, z)
	    {
	      this.X = x;
	      this.Y = y;
	      this.Z = z;
	    };
	  }
	  else // if (!use_xyz)
	  {
	    ClipperLib.IntPoint0 = function ()
	    {
	      this.X = 0;
	      this.Y = 0;
	    };
	    ClipperLib.IntPoint1 = function (pt)
	    {
	      this.X = pt.X;
	      this.Y = pt.Y;
	    };
	    ClipperLib.IntPoint1dp = function (dp)
	    {
	      this.X = ClipperLib.Clipper.Round(dp.X);
	      this.Y = ClipperLib.Clipper.Round(dp.Y);
	    };
	    ClipperLib.IntPoint2 = function (x, y)
	    {
	      this.X = x;
	      this.Y = y;
	    };
	  }
	  ClipperLib.IntRect = function ()
	  {
	    var a = arguments,
	      alen = a.length;
	    if (alen == 4) // function (l, t, r, b)
	    {
	      this.left = a[0];
	      this.top = a[1];
	      this.right = a[2];
	      this.bottom = a[3];
	    }
	    else if (alen == 1) // function (ir)
	    {
	      this.left = ir.left;
	      this.top = ir.top;
	      this.right = ir.right;
	      this.bottom = ir.bottom;
	    }
	    else // function ()
	    {
	      this.left = 0;
	      this.top = 0;
	      this.right = 0;
	      this.bottom = 0;
	    }
	  };
	  ClipperLib.IntRect0 = function ()
	  {
	    this.left = 0;
	    this.top = 0;
	    this.right = 0;
	    this.bottom = 0;
	  };
	  ClipperLib.IntRect1 = function (ir)
	  {
	    this.left = ir.left;
	    this.top = ir.top;
	    this.right = ir.right;
	    this.bottom = ir.bottom;
	  };
	  ClipperLib.IntRect4 = function (l, t, r, b)
	  {
	    this.left = l;
	    this.top = t;
	    this.right = r;
	    this.bottom = b;
	  };
	  ClipperLib.ClipType = {
	    ctIntersection: 0,
	    ctUnion: 1,
	    ctDifference: 2,
	    ctXor: 3
	  };
	  ClipperLib.PolyType = {
	    ptSubject: 0,
	    ptClip: 1
	  };
	  ClipperLib.PolyFillType = {
	    pftEvenOdd: 0,
	    pftNonZero: 1,
	    pftPositive: 2,
	    pftNegative: 3
	  };
	  ClipperLib.JoinType = {
	    jtSquare: 0,
	    jtRound: 1,
	    jtMiter: 2
	  };
	  ClipperLib.EndType = {
	    etOpenSquare: 0,
	    etOpenRound: 1,
	    etOpenButt: 2,
	    etClosedLine: 3,
	    etClosedPolygon: 4
	  };
	  ClipperLib.EdgeSide = {
	    esLeft: 0,
	    esRight: 1
	  };
	  ClipperLib.Direction = {
	    dRightToLeft: 0,
	    dLeftToRight: 1
	  };
	  ClipperLib.TEdge = function ()
	  {
	    this.Bot = new ClipperLib.IntPoint();
	    this.Curr = new ClipperLib.IntPoint();
	    this.Top = new ClipperLib.IntPoint();
	    this.Delta = new ClipperLib.IntPoint();
	    this.Dx = 0;
	    this.PolyTyp = ClipperLib.PolyType.ptSubject;
	    this.Side = ClipperLib.EdgeSide.esLeft;
	    this.WindDelta = 0;
	    this.WindCnt = 0;
	    this.WindCnt2 = 0;
	    this.OutIdx = 0;
	    this.Next = null;
	    this.Prev = null;
	    this.NextInLML = null;
	    this.NextInAEL = null;
	    this.PrevInAEL = null;
	    this.NextInSEL = null;
	    this.PrevInSEL = null;
	  };
	  ClipperLib.IntersectNode = function ()
	  {
	    this.Edge1 = null;
	    this.Edge2 = null;
	    this.Pt = new ClipperLib.IntPoint();
	  };
	  ClipperLib.MyIntersectNodeSort = function () {};
	  ClipperLib.MyIntersectNodeSort.Compare = function (node1, node2)
	  {
	    var i = node2.Pt.Y - node1.Pt.Y;
	    if (i > 0) return 1;
	    else if (i < 0) return -1;
	    else return 0;
	  };
	
	  ClipperLib.LocalMinima = function ()
	  {
	    this.Y = 0;
	    this.LeftBound = null;
	    this.RightBound = null;
	    this.Next = null;
	  };
	  ClipperLib.Scanbeam = function ()
	  {
	    this.Y = 0;
	    this.Next = null;
	  };
	  ClipperLib.OutRec = function ()
	  {
	    this.Idx = 0;
	    this.IsHole = false;
	    this.IsOpen = false;
	    this.FirstLeft = null;
	    this.Pts = null;
	    this.BottomPt = null;
	    this.PolyNode = null;
	  };
	  ClipperLib.OutPt = function ()
	  {
	    this.Idx = 0;
	    this.Pt = new ClipperLib.IntPoint();
	    this.Next = null;
	    this.Prev = null;
	  };
	  ClipperLib.Join = function ()
	  {
	    this.OutPt1 = null;
	    this.OutPt2 = null;
	    this.OffPt = new ClipperLib.IntPoint();
	  };
	  ClipperLib.ClipperBase = function ()
	  {
	    this.m_MinimaList = null;
	    this.m_CurrentLM = null;
	    this.m_edges = new Array();
	    this.m_UseFullRange = false;
	    this.m_HasOpenPaths = false;
	    this.PreserveCollinear = false;
	    this.m_MinimaList = null;
	    this.m_CurrentLM = null;
	    this.m_UseFullRange = false;
	    this.m_HasOpenPaths = false;
	  };
	  // Ranges are in original C# too high for Javascript (in current state 2013 september):
	  // protected const double horizontal = -3.4E+38;
	  // internal const cInt loRange = 0x3FFFFFFF; // = 1073741823 = sqrt(2^63 -1)/2
	  // internal const cInt hiRange = 0x3FFFFFFFFFFFFFFFL; // = 4611686018427387903 = sqrt(2^127 -1)/2
	  // So had to adjust them to more suitable for Javascript.
	  // If JS some day supports truly 64-bit integers, then these ranges can be as in C#
	  // and biginteger library can be more simpler (as then 128bit can be represented as two 64bit numbers)
	  ClipperLib.ClipperBase.horizontal = -9007199254740992; //-2^53
	  ClipperLib.ClipperBase.Skip = -2;
	  ClipperLib.ClipperBase.Unassigned = -1;
	  ClipperLib.ClipperBase.tolerance = 1E-20;
	  if (use_int32)
	  {
	    ClipperLib.ClipperBase.loRange = 0x7FFF;
	    ClipperLib.ClipperBase.hiRange = 0x7FFF;
	  }
	  else
	  {
	    ClipperLib.ClipperBase.loRange = 47453132; // sqrt(2^53 -1)/2
	    ClipperLib.ClipperBase.hiRange = 4503599627370495; // sqrt(2^106 -1)/2
	  }
	
	  ClipperLib.ClipperBase.near_zero = function (val)
	  {
	    return (val > -ClipperLib.ClipperBase.tolerance) && (val < ClipperLib.ClipperBase.tolerance);
	  };
	  ClipperLib.ClipperBase.IsHorizontal = function (e)
	  {
	    return e.Delta.Y === 0;
	  };
	  ClipperLib.ClipperBase.prototype.PointIsVertex = function (pt, pp)
	  {
	    var pp2 = pp;
	    do {
	      if (ClipperLib.IntPoint.op_Equality(pp2.Pt, pt))
	        return true;
	      pp2 = pp2.Next;
	    }
	    while (pp2 != pp)
	    return false;
	  };
	  ClipperLib.ClipperBase.prototype.PointOnLineSegment = function (pt, linePt1, linePt2, UseFullRange)
	  {
	    if (UseFullRange)
	      return ((pt.X == linePt1.X) && (pt.Y == linePt1.Y)) ||
	        ((pt.X == linePt2.X) && (pt.Y == linePt2.Y)) ||
	        (((pt.X > linePt1.X) == (pt.X < linePt2.X)) &&
	        ((pt.Y > linePt1.Y) == (pt.Y < linePt2.Y)) &&
	        (Int128.op_Equality(Int128.Int128Mul((pt.X - linePt1.X), (linePt2.Y - linePt1.Y)),
	          Int128.Int128Mul((linePt2.X - linePt1.X), (pt.Y - linePt1.Y)))));
	    else
	      return ((pt.X == linePt1.X) && (pt.Y == linePt1.Y)) || ((pt.X == linePt2.X) && (pt.Y == linePt2.Y)) || (((pt.X > linePt1.X) == (pt.X < linePt2.X)) && ((pt.Y > linePt1.Y) == (pt.Y < linePt2.Y)) && ((pt.X - linePt1.X) * (linePt2.Y - linePt1.Y) == (linePt2.X - linePt1.X) * (pt.Y - linePt1.Y)));
	  };
	  ClipperLib.ClipperBase.prototype.PointOnPolygon = function (pt, pp, UseFullRange)
	  {
	    var pp2 = pp;
	    while (true)
	    {
	      if (this.PointOnLineSegment(pt, pp2.Pt, pp2.Next.Pt, UseFullRange))
	        return true;
	      pp2 = pp2.Next;
	      if (pp2 == pp)
	        break;
	    }
	    return false;
	  };
	  ClipperLib.ClipperBase.prototype.SlopesEqual = ClipperLib.ClipperBase.SlopesEqual = function ()
	  {
	    var a = arguments,
	      alen = a.length;
	    var e1, e2, pt1, pt2, pt3, pt4, UseFullRange;
	    if (alen == 3) // function (e1, e2, UseFullRange)
	    {
	      e1 = a[0];
	      e2 = a[1];
	      UseFullRange = a[2];
	      if (UseFullRange)
	        return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
	      else
	        return ClipperLib.Cast_Int64((e1.Delta.Y) * (e2.Delta.X)) == ClipperLib.Cast_Int64((e1.Delta.X) * (e2.Delta.Y));
	    }
	    else if (alen == 4) // function (pt1, pt2, pt3, UseFullRange)
	    {
	      pt1 = a[0];
	      pt2 = a[1];
	      pt3 = a[2];
	      UseFullRange = a[3];
	      if (UseFullRange)
	        return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
	      else
	        return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
	    }
	    else // function (pt1, pt2, pt3, pt4, UseFullRange)
	    {
	      pt1 = a[0];
	      pt2 = a[1];
	      pt3 = a[2];
	      pt4 = a[3];
	      UseFullRange = a[4];
	      if (UseFullRange)
	        return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
	      else
	        return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
	    }
	  };
	  ClipperLib.ClipperBase.SlopesEqual3 = function (e1, e2, UseFullRange)
	  {
	    if (UseFullRange)
	      return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
	    else
	      return ClipperLib.Cast_Int64((e1.Delta.Y) * (e2.Delta.X)) == ClipperLib.Cast_Int64((e1.Delta.X) * (e2.Delta.Y));
	  };
	  ClipperLib.ClipperBase.SlopesEqual4 = function (pt1, pt2, pt3, UseFullRange)
	  {
	    if (UseFullRange)
	      return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
	    else
	      return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
	  };
	  ClipperLib.ClipperBase.SlopesEqual5 = function (pt1, pt2, pt3, pt4, UseFullRange)
	  {
	    if (UseFullRange)
	      return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
	    else
	      return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
	  };
	  ClipperLib.ClipperBase.prototype.Clear = function ()
	  {
	    this.DisposeLocalMinimaList();
	    for (var i = 0, ilen = this.m_edges.length; i < ilen; ++i)
	    {
	      for (var j = 0, jlen = this.m_edges[i].length; j < jlen; ++j)
	        this.m_edges[i][j] = null;
	      ClipperLib.Clear(this.m_edges[i]);
	    }
	    ClipperLib.Clear(this.m_edges);
	    this.m_UseFullRange = false;
	    this.m_HasOpenPaths = false;
	  };
	  ClipperLib.ClipperBase.prototype.DisposeLocalMinimaList = function ()
	  {
	    while (this.m_MinimaList !== null)
	    {
	      var tmpLm = this.m_MinimaList.Next;
	      this.m_MinimaList = null;
	      this.m_MinimaList = tmpLm;
	    }
	    this.m_CurrentLM = null;
	  };
	  ClipperLib.ClipperBase.prototype.RangeTest = function (Pt, useFullRange)
	  {
	    if (useFullRange.Value)
	    {
	      if (Pt.X > ClipperLib.ClipperBase.hiRange || Pt.Y > ClipperLib.ClipperBase.hiRange || -Pt.X > ClipperLib.ClipperBase.hiRange || -Pt.Y > ClipperLib.ClipperBase.hiRange)
	        ClipperLib.Error("Coordinate outside allowed range in RangeTest().");
	    }
	    else if (Pt.X > ClipperLib.ClipperBase.loRange || Pt.Y > ClipperLib.ClipperBase.loRange || -Pt.X > ClipperLib.ClipperBase.loRange || -Pt.Y > ClipperLib.ClipperBase.loRange)
	    {
	      useFullRange.Value = true;
	      this.RangeTest(Pt, useFullRange);
	    }
	  };
	  ClipperLib.ClipperBase.prototype.InitEdge = function (e, eNext, ePrev, pt)
	  {
	    e.Next = eNext;
	    e.Prev = ePrev;
	    //e.Curr = pt;
	    e.Curr.X = pt.X;
	    e.Curr.Y = pt.Y;
	    e.OutIdx = -1;
	  };
	  ClipperLib.ClipperBase.prototype.InitEdge2 = function (e, polyType)
	  {
	    if (e.Curr.Y >= e.Next.Curr.Y)
	    {
	      //e.Bot = e.Curr;
	      e.Bot.X = e.Curr.X;
	      e.Bot.Y = e.Curr.Y;
	      //e.Top = e.Next.Curr;
	      e.Top.X = e.Next.Curr.X;
	      e.Top.Y = e.Next.Curr.Y;
	    }
	    else
	    {
	      //e.Top = e.Curr;
	      e.Top.X = e.Curr.X;
	      e.Top.Y = e.Curr.Y;
	      //e.Bot = e.Next.Curr;
	      e.Bot.X = e.Next.Curr.X;
	      e.Bot.Y = e.Next.Curr.Y;
	    }
	    this.SetDx(e);
	    e.PolyTyp = polyType;
	  };
	  ClipperLib.ClipperBase.prototype.FindNextLocMin = function (E)
	  {
	    var E2;
	    for (;;)
	    {
	      while (ClipperLib.IntPoint.op_Inequality(E.Bot, E.Prev.Bot) || ClipperLib.IntPoint.op_Equality(E.Curr, E.Top))
	        E = E.Next;
	      if (E.Dx != ClipperLib.ClipperBase.horizontal && E.Prev.Dx != ClipperLib.ClipperBase.horizontal)
	        break;
	      while (E.Prev.Dx == ClipperLib.ClipperBase.horizontal)
	        E = E.Prev;
	      E2 = E;
	      while (E.Dx == ClipperLib.ClipperBase.horizontal)
	        E = E.Next;
	      if (E.Top.Y == E.Prev.Bot.Y)
	        continue;
	      //ie just an intermediate horz.
	      if (E2.Prev.Bot.X < E.Bot.X)
	        E = E2;
	      break;
	    }
	    return E;
	  };
	  ClipperLib.ClipperBase.prototype.ProcessBound = function (E, LeftBoundIsForward)
	  {
	    var EStart;
	    var Result = E;
	    var Horz;
	
	      if (Result.OutIdx == ClipperLib.ClipperBase.Skip)
	      {
	        //check if there are edges beyond the skip edge in the bound and if so
	        //create another LocMin and calling ProcessBound once more ...
	        E = Result;
	        if (LeftBoundIsForward)
	        {
	          while (E.Top.Y == E.Next.Bot.Y) E = E.Next;
	          while (E != Result && E.Dx == ClipperLib.ClipperBase.horizontal) E = E.Prev;
	        }
	        else
	        {
	          while (E.Top.Y == E.Prev.Bot.Y) E = E.Prev;
	          while (E != Result && E.Dx == ClipperLib.ClipperBase.horizontal) E = E.Next;
	        }
	        if (E == Result)
	        {
	          if (LeftBoundIsForward) Result = E.Next;
	          else Result = E.Prev;
	        }
	        else
	        {
	          //there are more edges in the bound beyond result starting with E
	          if (LeftBoundIsForward)
	            E = Result.Next;
	          else
	            E = Result.Prev;
	          var locMin = new ClipperLib.LocalMinima();
	          locMin.Next = null;
	          locMin.Y = E.Bot.Y;
	          locMin.LeftBound = null;
	          locMin.RightBound = E;
	          E.WindDelta = 0;
	          Result = this.ProcessBound(E, LeftBoundIsForward);
	          this.InsertLocalMinima(locMin);
	        }
	        return Result;
	      }
	
	      if (E.Dx == ClipperLib.ClipperBase.horizontal)
	      {
	        //We need to be careful with open paths because this may not be a
	        //true local minima (ie E may be following a skip edge).
	        //Also, consecutive horz. edges may start heading left before going right.
	        if (LeftBoundIsForward) EStart = E.Prev;
	        else EStart = E.Next;
	        if (EStart.OutIdx != ClipperLib.ClipperBase.Skip)
	        {
	          if (EStart.Dx == ClipperLib.ClipperBase.horizontal) //ie an adjoining horizontal skip edge
	          {
	            if (EStart.Bot.X != E.Bot.X && EStart.Top.X != E.Bot.X)
	              this.ReverseHorizontal(E);
	          }
	          else if (EStart.Bot.X != E.Bot.X)
	            this.ReverseHorizontal(E);
	        }
	      }
	
	      EStart = E;
	      if (LeftBoundIsForward)
	      {
	        while (Result.Top.Y == Result.Next.Bot.Y && Result.Next.OutIdx != ClipperLib.ClipperBase.Skip)
	          Result = Result.Next;
	        if (Result.Dx == ClipperLib.ClipperBase.horizontal && Result.Next.OutIdx != ClipperLib.ClipperBase.Skip)
	        {
	          //nb: at the top of a bound, horizontals are added to the bound
	          //only when the preceding edge attaches to the horizontal's left vertex
	          //unless a Skip edge is encountered when that becomes the top divide
	          Horz = Result;
	          while (Horz.Prev.Dx == ClipperLib.ClipperBase.horizontal)
	            Horz = Horz.Prev;
	          if (Horz.Prev.Top.X == Result.Next.Top.X)
	          {
	            if (!LeftBoundIsForward)
	              Result = Horz.Prev;
	          }
	          else if (Horz.Prev.Top.X > Result.Next.Top.X)
	            Result = Horz.Prev;
	        }
	        while (E != Result)
	        {
	          E.NextInLML = E.Next;
	          if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Prev.Top.X)
	            this.ReverseHorizontal(E);
	          E = E.Next;
	        }
	        if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Prev.Top.X)
	          this.ReverseHorizontal(E);
	        Result = Result.Next;
	        //move to the edge just beyond current bound
	      }
	      else
	      {
	        while (Result.Top.Y == Result.Prev.Bot.Y && Result.Prev.OutIdx != ClipperLib.ClipperBase.Skip)
	          Result = Result.Prev;
	        if (Result.Dx == ClipperLib.ClipperBase.horizontal && Result.Prev.OutIdx != ClipperLib.ClipperBase.Skip)
	        {
	          Horz = Result;
	          while (Horz.Next.Dx == ClipperLib.ClipperBase.horizontal)
	            Horz = Horz.Next;
	          if (Horz.Next.Top.X == Result.Prev.Top.X)
	          {
	            if (!LeftBoundIsForward)
	              Result = Horz.Next;
	          }
	          else if (Horz.Next.Top.X > Result.Prev.Top.X)
	            Result = Horz.Next;
	        }
	        while (E != Result)
	        {
	          E.NextInLML = E.Prev;
	          if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Next.Top.X)
	            this.ReverseHorizontal(E);
	          E = E.Prev;
	        }
	        if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Next.Top.X)
	          this.ReverseHorizontal(E);
	        Result = Result.Prev;
	        //move to the edge just beyond current bound
	      }
	
	    return Result;
	  };
	
	  ClipperLib.ClipperBase.prototype.AddPath = function (pg, polyType, Closed)
	  {
	    if (use_lines)
	    {
	      if (!Closed && polyType == ClipperLib.PolyType.ptClip)
	        ClipperLib.Error("AddPath: Open paths must be subject.");
	    }
	    else
	    {
	      if (!Closed)
	        ClipperLib.Error("AddPath: Open paths have been disabled.");
	    }
	    var highI = pg.length - 1;
	    if (Closed)
	      while (highI > 0 && (ClipperLib.IntPoint.op_Equality(pg[highI], pg[0])))
	    --highI;
	    while (highI > 0 && (ClipperLib.IntPoint.op_Equality(pg[highI], pg[highI - 1])))
	    --highI;
	    if ((Closed && highI < 2) || (!Closed && highI < 1))
	      return false;
	    //create a new edge array ...
	    var edges = new Array();
	    for (var i = 0; i <= highI; i++)
	      edges.push(new ClipperLib.TEdge());
	    var IsFlat = true;
	    //1. Basic (first) edge initialization ...
	
	    //edges[1].Curr = pg[1];
	    edges[1].Curr.X = pg[1].X;
	    edges[1].Curr.Y = pg[1].Y;
	
	    var $1 = {Value: this.m_UseFullRange};
	    this.RangeTest(pg[0], $1);
	    this.m_UseFullRange = $1.Value;
	
	    $1.Value = this.m_UseFullRange;
	    this.RangeTest(pg[highI], $1);
	    this.m_UseFullRange = $1.Value;
	
	    this.InitEdge(edges[0], edges[1], edges[highI], pg[0]);
	    this.InitEdge(edges[highI], edges[0], edges[highI - 1], pg[highI]);
	    for (var i = highI - 1; i >= 1; --i)
	    {
	      $1.Value = this.m_UseFullRange;
	      this.RangeTest(pg[i], $1);
	      this.m_UseFullRange = $1.Value;
	
	      this.InitEdge(edges[i], edges[i + 1], edges[i - 1], pg[i]);
	    }
	
	    var eStart = edges[0];
	    //2. Remove duplicate vertices, and (when closed) collinear edges ...
	    var E = eStart,
	      eLoopStop = eStart;
	    for (;;)
	    {
	    //console.log(E.Next, eStart);
	    	//nb: allows matching start and end points when not Closed ...
	      if (E.Curr == E.Next.Curr && (Closed || E.Next != eStart))
	      {
	        if (E == E.Next)
	          break;
	        if (E == eStart)
	          eStart = E.Next;
	        E = this.RemoveEdge(E);
	        eLoopStop = E;
	        continue;
	      }
	      if (E.Prev == E.Next)
	        break;
	      else if (Closed && ClipperLib.ClipperBase.SlopesEqual(E.Prev.Curr, E.Curr, E.Next.Curr, this.m_UseFullRange) && (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(E.Prev.Curr, E.Curr, E.Next.Curr)))
	      {
	        //Collinear edges are allowed for open paths but in closed paths
	        //the default is to merge adjacent collinear edges into a single edge.
	        //However, if the PreserveCollinear property is enabled, only overlapping
	        //collinear edges (ie spikes) will be removed from closed paths.
	        if (E == eStart)
	          eStart = E.Next;
	        E = this.RemoveEdge(E);
	        E = E.Prev;
	        eLoopStop = E;
	        continue;
	      }
	      E = E.Next;
	      if ((E == eLoopStop) || (!Closed && E.Next == eStart)) break;
	    }
	    if ((!Closed && (E == E.Next)) || (Closed && (E.Prev == E.Next)))
	      return false;
	    if (!Closed)
	    {
	      this.m_HasOpenPaths = true;
	      eStart.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
	    }
	    //3. Do second stage of edge initialization ...
	    E = eStart;
	    do {
	      this.InitEdge2(E, polyType);
	      E = E.Next;
	      if (IsFlat && E.Curr.Y != eStart.Curr.Y)
	        IsFlat = false;
	    }
	    while (E != eStart)
	    //4. Finally, add edge bounds to LocalMinima list ...
	    //Totally flat paths must be handled differently when adding them
	    //to LocalMinima list to avoid endless loops etc ...
	    if (IsFlat)
	    {
	      if (Closed)
	        return false;
	      E.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
	      if (E.Prev.Bot.X < E.Prev.Top.X)
	        this.ReverseHorizontal(E.Prev);
	      var locMin = new ClipperLib.LocalMinima();
	      locMin.Next = null;
	      locMin.Y = E.Bot.Y;
	      locMin.LeftBound = null;
	      locMin.RightBound = E;
	      locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
	      locMin.RightBound.WindDelta = 0;
	      while (E.Next.OutIdx != ClipperLib.ClipperBase.Skip)
	      {
	        E.NextInLML = E.Next;
	        if (E.Bot.X != E.Prev.Top.X)
	          this.ReverseHorizontal(E);
	        E = E.Next;
	      }
	      this.InsertLocalMinima(locMin);
	      this.m_edges.push(edges);
	      return true;
	    }
	    this.m_edges.push(edges);
	    var leftBoundIsForward;
	    var EMin = null;
	
			//workaround to avoid an endless loop in the while loop below when
	    //open paths have matching start and end points ...
	    if(ClipperLib.IntPoint.op_Equality(E.Prev.Bot, E.Prev.Top))
	    	E = E.Next;
	
	    for (;;)
	    {
	      E = this.FindNextLocMin(E);
	      if (E == EMin)
	        break;
	      else if (EMin == null)
	        EMin = E;
	      //E and E.Prev now share a local minima (left aligned if horizontal).
	      //Compare their slopes to find which starts which bound ...
	      var locMin = new ClipperLib.LocalMinima();
	      locMin.Next = null;
	      locMin.Y = E.Bot.Y;
	      if (E.Dx < E.Prev.Dx)
	      {
	        locMin.LeftBound = E.Prev;
	        locMin.RightBound = E;
	        leftBoundIsForward = false;
	        //Q.nextInLML = Q.prev
	      }
	      else
	      {
	        locMin.LeftBound = E;
	        locMin.RightBound = E.Prev;
	        leftBoundIsForward = true;
	        //Q.nextInLML = Q.next
	      }
	      locMin.LeftBound.Side = ClipperLib.EdgeSide.esLeft;
	      locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
	      if (!Closed)
	        locMin.LeftBound.WindDelta = 0;
	      else if (locMin.LeftBound.Next == locMin.RightBound)
	        locMin.LeftBound.WindDelta = -1;
	      else
	        locMin.LeftBound.WindDelta = 1;
	      locMin.RightBound.WindDelta = -locMin.LeftBound.WindDelta;
	      E = this.ProcessBound(locMin.LeftBound, leftBoundIsForward);
	      if (E.OutIdx == ClipperLib.ClipperBase.Skip)
	      	E = this.ProcessBound(E, leftBoundIsForward);
	      var E2 = this.ProcessBound(locMin.RightBound, !leftBoundIsForward);
	      if (E2.OutIdx == ClipperLib.ClipperBase.Skip) E2 = this.ProcessBound(E2, !leftBoundIsForward);
	      if (locMin.LeftBound.OutIdx == ClipperLib.ClipperBase.Skip)
	        locMin.LeftBound = null;
	      else if (locMin.RightBound.OutIdx == ClipperLib.ClipperBase.Skip)
	        locMin.RightBound = null;
	      this.InsertLocalMinima(locMin);
	      if (!leftBoundIsForward)
	        E = E2;
	    }
	    return true;
	  };
	  ClipperLib.ClipperBase.prototype.AddPaths = function (ppg, polyType, closed)
	  {
	    //  console.log("-------------------------------------------");
	    //  console.log(JSON.stringify(ppg));
	    var result = false;
	    for (var i = 0, ilen = ppg.length; i < ilen; ++i)
	      if (this.AddPath(ppg[i], polyType, closed))
	        result = true;
	    return result;
	  };
	  //------------------------------------------------------------------------------
	  ClipperLib.ClipperBase.prototype.Pt2IsBetweenPt1AndPt3 = function (pt1, pt2, pt3)
	  {
	    if ((ClipperLib.IntPoint.op_Equality(pt1, pt3)) || (ClipperLib.IntPoint.op_Equality(pt1, pt2)) ||       (ClipperLib.IntPoint.op_Equality(pt3, pt2)))
	
	   //if ((pt1 == pt3) || (pt1 == pt2) || (pt3 == pt2))
	   return false;
	
	    else if (pt1.X != pt3.X)
	      return (pt2.X > pt1.X) == (pt2.X < pt3.X);
	    else
	      return (pt2.Y > pt1.Y) == (pt2.Y < pt3.Y);
	  };
	  ClipperLib.ClipperBase.prototype.RemoveEdge = function (e)
	  {
	    //removes e from double_linked_list (but without removing from memory)
	    e.Prev.Next = e.Next;
	    e.Next.Prev = e.Prev;
	    var result = e.Next;
	    e.Prev = null; //flag as removed (see ClipperBase.Clear)
	    return result;
	  };
	  ClipperLib.ClipperBase.prototype.SetDx = function (e)
	  {
	    e.Delta.X = (e.Top.X - e.Bot.X);
	    e.Delta.Y = (e.Top.Y - e.Bot.Y);
	    if (e.Delta.Y === 0) e.Dx = ClipperLib.ClipperBase.horizontal;
	    else e.Dx = (e.Delta.X) / (e.Delta.Y);
	  };
	  ClipperLib.ClipperBase.prototype.InsertLocalMinima = function (newLm)
	  {
	    if (this.m_MinimaList === null)
	    {
	      this.m_MinimaList = newLm;
	    }
	    else if (newLm.Y >= this.m_MinimaList.Y)
	    {
	      newLm.Next = this.m_MinimaList;
	      this.m_MinimaList = newLm;
	    }
	    else
	    {
	      var tmpLm = this.m_MinimaList;
	      while (tmpLm.Next !== null && (newLm.Y < tmpLm.Next.Y))
	        tmpLm = tmpLm.Next;
	      newLm.Next = tmpLm.Next;
	      tmpLm.Next = newLm;
	    }
	  };
	  ClipperLib.ClipperBase.prototype.PopLocalMinima = function ()
	  {
	    if (this.m_CurrentLM === null)
	      return;
	    this.m_CurrentLM = this.m_CurrentLM.Next;
	  };
	  ClipperLib.ClipperBase.prototype.ReverseHorizontal = function (e)
	  {
	    //swap horizontal edges' top and bottom x's so they follow the natural
	    //progression of the bounds - ie so their xbots will align with the
	    //adjoining lower edge. [Helpful in the ProcessHorizontal() method.]
	    var tmp = e.Top.X;
	    e.Top.X = e.Bot.X;
	    e.Bot.X = tmp;
	    if (use_xyz)
	    {
	      tmp = e.Top.Z;
	      e.Top.Z = e.Bot.Z;
	      e.Bot.Z = tmp;
	    }
	  };
	  ClipperLib.ClipperBase.prototype.Reset = function ()
	  {
	    this.m_CurrentLM = this.m_MinimaList;
	    if (this.m_CurrentLM == null)
	      return;
	    //ie nothing to process
	    //reset all edges ...
	    var lm = this.m_MinimaList;
	    while (lm != null)
	    {
	      var e = lm.LeftBound;
	      if (e != null)
	      {
	        //e.Curr = e.Bot;
	        e.Curr.X = e.Bot.X;
	        e.Curr.Y = e.Bot.Y;
	        e.Side = ClipperLib.EdgeSide.esLeft;
	        e.OutIdx = ClipperLib.ClipperBase.Unassigned;
	      }
	      e = lm.RightBound;
	      if (e != null)
	      {
	        //e.Curr = e.Bot;
	        e.Curr.X = e.Bot.X;
	        e.Curr.Y = e.Bot.Y;
	        e.Side = ClipperLib.EdgeSide.esRight;
	        e.OutIdx = ClipperLib.ClipperBase.Unassigned;
	      }
	      lm = lm.Next;
	    }
	  };
	  ClipperLib.Clipper = function (InitOptions) // public Clipper(int InitOptions = 0)
	  {
	    if (typeof (InitOptions) == "undefined") InitOptions = 0;
	    this.m_PolyOuts = null;
	    this.m_ClipType = ClipperLib.ClipType.ctIntersection;
	    this.m_Scanbeam = null;
	    this.m_ActiveEdges = null;
	    this.m_SortedEdges = null;
	    this.m_IntersectList = null;
	    this.m_IntersectNodeComparer = null;
	    this.m_ExecuteLocked = false;
	    this.m_ClipFillType = ClipperLib.PolyFillType.pftEvenOdd;
	    this.m_SubjFillType = ClipperLib.PolyFillType.pftEvenOdd;
	    this.m_Joins = null;
	    this.m_GhostJoins = null;
	    this.m_UsingPolyTree = false;
	    this.ReverseSolution = false;
	    this.StrictlySimple = false;
	    ClipperLib.ClipperBase.call(this);
	    this.m_Scanbeam = null;
	    this.m_ActiveEdges = null;
	    this.m_SortedEdges = null;
	    this.m_IntersectList = new Array();
	    this.m_IntersectNodeComparer = ClipperLib.MyIntersectNodeSort.Compare;
	    this.m_ExecuteLocked = false;
	    this.m_UsingPolyTree = false;
	    this.m_PolyOuts = new Array();
	    this.m_Joins = new Array();
	    this.m_GhostJoins = new Array();
	    this.ReverseSolution = (1 & InitOptions) !== 0;
	    this.StrictlySimple = (2 & InitOptions) !== 0;
	    this.PreserveCollinear = (4 & InitOptions) !== 0;
	    if (use_xyz)
	    {
	      this.ZFillFunction = null; // function (IntPoint vert1, IntPoint vert2, ref IntPoint intersectPt);
	    }
	  };
	  ClipperLib.Clipper.ioReverseSolution = 1;
	  ClipperLib.Clipper.ioStrictlySimple = 2;
	  ClipperLib.Clipper.ioPreserveCollinear = 4;
	
	  ClipperLib.Clipper.prototype.Clear = function ()
	  {
	    if (this.m_edges.length === 0)
	      return;
	    //avoids problems with ClipperBase destructor
	    this.DisposeAllPolyPts();
	    ClipperLib.ClipperBase.prototype.Clear.call(this);
	  };
	
	  ClipperLib.Clipper.prototype.DisposeScanbeamList = function ()
	  {
	    while (this.m_Scanbeam !== null)
	    {
	      var sb2 = this.m_Scanbeam.Next;
	      this.m_Scanbeam = null;
	      this.m_Scanbeam = sb2;
	    }
	  };
	  ClipperLib.Clipper.prototype.Reset = function ()
	  {
	    ClipperLib.ClipperBase.prototype.Reset.call(this);
	    this.m_Scanbeam = null;
	    this.m_ActiveEdges = null;
	    this.m_SortedEdges = null;
	
	    var lm = this.m_MinimaList;
	    while (lm !== null)
	    {
	      this.InsertScanbeam(lm.Y);
	      lm = lm.Next;
	    }
	  };
	  ClipperLib.Clipper.prototype.InsertScanbeam = function (Y)
	  {
	    if (this.m_Scanbeam === null)
	    {
	      this.m_Scanbeam = new ClipperLib.Scanbeam();
	      this.m_Scanbeam.Next = null;
	      this.m_Scanbeam.Y = Y;
	    }
	    else if (Y > this.m_Scanbeam.Y)
	    {
	      var newSb = new ClipperLib.Scanbeam();
	      newSb.Y = Y;
	      newSb.Next = this.m_Scanbeam;
	      this.m_Scanbeam = newSb;
	    }
	    else
	    {
	      var sb2 = this.m_Scanbeam;
	      while (sb2.Next !== null && (Y <= sb2.Next.Y))
	        sb2 = sb2.Next;
	      if (Y == sb2.Y)
	        return;
	      //ie ignores duplicates
	      var newSb = new ClipperLib.Scanbeam();
	      newSb.Y = Y;
	      newSb.Next = sb2.Next;
	      sb2.Next = newSb;
	    }
	  };
	  // ************************************
	  ClipperLib.Clipper.prototype.Execute = function ()
	  {
	    var a = arguments,
	      alen = a.length,
	      ispolytree = a[1] instanceof ClipperLib.PolyTree;
	    if (alen == 4 && !ispolytree) // function (clipType, solution, subjFillType, clipFillType)
	    {
	      var clipType = a[0],
	        solution = a[1],
	        subjFillType = a[2],
	        clipFillType = a[3];
	      if (this.m_ExecuteLocked)
	        return false;
	      if (this.m_HasOpenPaths)
	        ClipperLib.Error("Error: PolyTree struct is need for open path clipping.");
	      this.m_ExecuteLocked = true;
	      ClipperLib.Clear(solution);
	      this.m_SubjFillType = subjFillType;
	      this.m_ClipFillType = clipFillType;
	      this.m_ClipType = clipType;
	      this.m_UsingPolyTree = false;
	      try
	      {
	        var succeeded = this.ExecuteInternal();
	        //build the return polygons ...
	        if (succeeded) this.BuildResult(solution);
	      }
	      finally
	      {
	        this.DisposeAllPolyPts();
	        this.m_ExecuteLocked = false;
	      }
	      return succeeded;
	    }
	    else if (alen == 4 && ispolytree) // function (clipType, polytree, subjFillType, clipFillType)
	    {
	      var clipType = a[0],
	        polytree = a[1],
	        subjFillType = a[2],
	        clipFillType = a[3];
	      if (this.m_ExecuteLocked)
	        return false;
	      this.m_ExecuteLocked = true;
	      this.m_SubjFillType = subjFillType;
	      this.m_ClipFillType = clipFillType;
	      this.m_ClipType = clipType;
	      this.m_UsingPolyTree = true;
	      try
	      {
	        var succeeded = this.ExecuteInternal();
	        //build the return polygons ...
	        if (succeeded) this.BuildResult2(polytree);
	      }
	      finally
	      {
	        this.DisposeAllPolyPts();
	        this.m_ExecuteLocked = false;
	      }
	      return succeeded;
	    }
	    else if (alen == 2 && !ispolytree) // function (clipType, solution)
	    {
	      var clipType = a[0],
	        solution = a[1];
	      return this.Execute(clipType, solution, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
	    }
	    else if (alen == 2 && ispolytree) // function (clipType, polytree)
	    {
	      var clipType = a[0],
	        polytree = a[1];
	      return this.Execute(clipType, polytree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
	    }
	  };
	  ClipperLib.Clipper.prototype.FixHoleLinkage = function (outRec)
	  {
	    //skip if an outermost polygon or
	    //already already points to the correct FirstLeft ...
	    if (outRec.FirstLeft === null || (outRec.IsHole != outRec.FirstLeft.IsHole && outRec.FirstLeft.Pts !== null))
	      return;
	    var orfl = outRec.FirstLeft;
	    while (orfl !== null && ((orfl.IsHole == outRec.IsHole) || orfl.Pts === null))
	      orfl = orfl.FirstLeft;
	    outRec.FirstLeft = orfl;
	  };
	  ClipperLib.Clipper.prototype.ExecuteInternal = function ()
	  {
	    try
	    {
	      this.Reset();
	      if (this.m_CurrentLM === null)
	        return false;
	      var botY = this.PopScanbeam();
	      do {
	        this.InsertLocalMinimaIntoAEL(botY);
	        ClipperLib.Clear(this.m_GhostJoins);
	        this.ProcessHorizontals(false);
	        if (this.m_Scanbeam === null)
	          break;
	        var topY = this.PopScanbeam();
	        if (!this.ProcessIntersections(topY)) return false;
	
	        this.ProcessEdgesAtTopOfScanbeam(topY);
	        botY = topY;
	      }
	      while (this.m_Scanbeam !== null || this.m_CurrentLM !== null)
	      //fix orientations ...
	      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
	      {
	        var outRec = this.m_PolyOuts[i];
	        if (outRec.Pts === null || outRec.IsOpen)
	          continue;
	        if ((outRec.IsHole ^ this.ReverseSolution) == (this.Area(outRec) > 0))
	          this.ReversePolyPtLinks(outRec.Pts);
	      }
	      this.JoinCommonEdges();
	      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
	      {
	        var outRec = this.m_PolyOuts[i];
	        if (outRec.Pts !== null && !outRec.IsOpen)
	          this.FixupOutPolygon(outRec);
	      }
	      if (this.StrictlySimple)
	        this.DoSimplePolygons();
	      return true;
	    }
	    finally
	    {
	      ClipperLib.Clear(this.m_Joins);
	      ClipperLib.Clear(this.m_GhostJoins);
	    }
	  };
	  ClipperLib.Clipper.prototype.PopScanbeam = function ()
	  {
	    var Y = this.m_Scanbeam.Y;
	    this.m_Scanbeam = this.m_Scanbeam.Next;
	    return Y;
	  };
	
	  ClipperLib.Clipper.prototype.DisposeAllPolyPts = function ()
	  {
	    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; ++i)
	      this.DisposeOutRec(i);
	    ClipperLib.Clear(this.m_PolyOuts);
	  };
	  ClipperLib.Clipper.prototype.DisposeOutRec = function (index)
	  {
	    var outRec = this.m_PolyOuts[index];
	    outRec.Pts = null;
	    outRec = null;
	    this.m_PolyOuts[index] = null;
	  };
	
	  ClipperLib.Clipper.prototype.AddJoin = function (Op1, Op2, OffPt)
	  {
	    var j = new ClipperLib.Join();
	    j.OutPt1 = Op1;
	    j.OutPt2 = Op2;
	    //j.OffPt = OffPt;
	    j.OffPt.X = OffPt.X;
	    j.OffPt.Y = OffPt.Y;
	    this.m_Joins.push(j);
	  };
	  ClipperLib.Clipper.prototype.AddGhostJoin = function (Op, OffPt)
	  {
	    var j = new ClipperLib.Join();
	    j.OutPt1 = Op;
	    //j.OffPt = OffPt;
	    j.OffPt.X = OffPt.X;
	    j.OffPt.Y = OffPt.Y;
	    this.m_GhostJoins.push(j);
	  };
	  if (use_xyz)
	  {
	    ClipperLib.Clipper.prototype.SetZ = function (pt, e1, e2)
	    {
	      if (this.ZFillFunction !== null)
	      {
	        if (pt.Z != 0 || this.ZFillFunction === null) return;
	        else if (ClipperLib.IntPoint.op_Equality(pt, e1.Bot)) pt.Z = e1.Bot.Z;
	        else if (ClipperLib.IntPoint.op_Equality(pt, e1.Top)) pt.Z = e1.Top.Z;
	        else if (ClipperLib.IntPoint.op_Equality(pt, e2.Bot)) pt.Z = e2.Bot.Z;
	        else if (ClipperLib.IntPoint.op_Equality(pt, e2.Top)) pt.Z = e2.Top.Z;
	        else ZFillFunction(e1.Bot, e1.Top, e2.Bot, e2.Top, pt);
	      }
	    };
	
	    //------------------------------------------------------------------------------
	  }
	
	  ClipperLib.Clipper.prototype.InsertLocalMinimaIntoAEL = function (botY)
	  {
	    while (this.m_CurrentLM !== null && (this.m_CurrentLM.Y == botY))
	    {
	      var lb = this.m_CurrentLM.LeftBound;
	      var rb = this.m_CurrentLM.RightBound;
	      this.PopLocalMinima();
	      var Op1 = null;
	      if (lb === null)
	      {
	        this.InsertEdgeIntoAEL(rb, null);
	        this.SetWindingCount(rb);
	        if (this.IsContributing(rb))
	          Op1 = this.AddOutPt(rb, rb.Bot);
	      }
	      else if (rb == null)
	      {
	        this.InsertEdgeIntoAEL(lb, null);
	        this.SetWindingCount(lb);
	        if (this.IsContributing(lb))
	          Op1 = this.AddOutPt(lb, lb.Bot);
	        this.InsertScanbeam(lb.Top.Y);
	      }
	      else
	      {
	        this.InsertEdgeIntoAEL(lb, null);
	        this.InsertEdgeIntoAEL(rb, lb);
	        this.SetWindingCount(lb);
	        rb.WindCnt = lb.WindCnt;
	        rb.WindCnt2 = lb.WindCnt2;
	        if (this.IsContributing(lb))
	          Op1 = this.AddLocalMinPoly(lb, rb, lb.Bot);
	        this.InsertScanbeam(lb.Top.Y);
	      }
	      if (rb != null)
	      {
	        if (ClipperLib.ClipperBase.IsHorizontal(rb))
	          this.AddEdgeToSEL(rb);
	        else
	          this.InsertScanbeam(rb.Top.Y);
	      }
	      if (lb == null || rb == null) continue;
	      //if output polygons share an Edge with a horizontal rb, they'll need joining later ...
	      if (Op1 !== null && ClipperLib.ClipperBase.IsHorizontal(rb) && this.m_GhostJoins.length > 0 && rb.WindDelta !== 0)
	      {
	        for (var i = 0, ilen = this.m_GhostJoins.length; i < ilen; i++)
	        {
	          //if the horizontal Rb and a 'ghost' horizontal overlap, then convert
	          //the 'ghost' join to a real join ready for later ...
	          var j = this.m_GhostJoins[i];
	
						if (this.HorzSegmentsOverlap(j.OutPt1.Pt.X, j.OffPt.X, rb.Bot.X, rb.Top.X))
	            this.AddJoin(j.OutPt1, Op1, j.OffPt);
	        }
	      }
	      if (lb.OutIdx >= 0 && lb.PrevInAEL !== null &&
	        lb.PrevInAEL.Curr.X == lb.Bot.X &&
	        lb.PrevInAEL.OutIdx >= 0 &&
	        ClipperLib.ClipperBase.SlopesEqual(lb.PrevInAEL, lb, this.m_UseFullRange) &&
	        lb.WindDelta !== 0 && lb.PrevInAEL.WindDelta !== 0)
	      {
	        var Op2 = this.AddOutPt(lb.PrevInAEL, lb.Bot);
	        this.AddJoin(Op1, Op2, lb.Top);
	      }
	      if (lb.NextInAEL != rb)
	      {
	        if (rb.OutIdx >= 0 && rb.PrevInAEL.OutIdx >= 0 &&
	          ClipperLib.ClipperBase.SlopesEqual(rb.PrevInAEL, rb, this.m_UseFullRange) &&
	          rb.WindDelta !== 0 && rb.PrevInAEL.WindDelta !== 0)
	        {
	          var Op2 = this.AddOutPt(rb.PrevInAEL, rb.Bot);
	          this.AddJoin(Op1, Op2, rb.Top);
	        }
	        var e = lb.NextInAEL;
	        if (e !== null)
	          while (e != rb)
	          {
	            //nb: For calculating winding counts etc, IntersectEdges() assumes
	            //that param1 will be to the right of param2 ABOVE the intersection ...
	            this.IntersectEdges(rb, e, lb.Curr, false);
	            //order important here
	            e = e.NextInAEL;
	          }
	      }
	    }
	  };
	  ClipperLib.Clipper.prototype.InsertEdgeIntoAEL = function (edge, startEdge)
	  {
	    if (this.m_ActiveEdges === null)
	    {
	      edge.PrevInAEL = null;
	      edge.NextInAEL = null;
	      this.m_ActiveEdges = edge;
	    }
	    else if (startEdge === null && this.E2InsertsBeforeE1(this.m_ActiveEdges, edge))
	    {
	      edge.PrevInAEL = null;
	      edge.NextInAEL = this.m_ActiveEdges;
	      this.m_ActiveEdges.PrevInAEL = edge;
	      this.m_ActiveEdges = edge;
	    }
	    else
	    {
	      if (startEdge === null)
	        startEdge = this.m_ActiveEdges;
	      while (startEdge.NextInAEL !== null && !this.E2InsertsBeforeE1(startEdge.NextInAEL, edge))
	        startEdge = startEdge.NextInAEL;
	      edge.NextInAEL = startEdge.NextInAEL;
	      if (startEdge.NextInAEL !== null)
	        startEdge.NextInAEL.PrevInAEL = edge;
	      edge.PrevInAEL = startEdge;
	      startEdge.NextInAEL = edge;
	    }
	  };
	  ClipperLib.Clipper.prototype.E2InsertsBeforeE1 = function (e1, e2)
	  {
	    if (e2.Curr.X == e1.Curr.X)
	    {
	      if (e2.Top.Y > e1.Top.Y)
	        return e2.Top.X < ClipperLib.Clipper.TopX(e1, e2.Top.Y);
	      else
	        return e1.Top.X > ClipperLib.Clipper.TopX(e2, e1.Top.Y);
	    }
	    else
	      return e2.Curr.X < e1.Curr.X;
	  };
	  ClipperLib.Clipper.prototype.IsEvenOddFillType = function (edge)
	  {
	    if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
	      return this.m_SubjFillType == ClipperLib.PolyFillType.pftEvenOdd;
	    else
	      return this.m_ClipFillType == ClipperLib.PolyFillType.pftEvenOdd;
	  };
	  ClipperLib.Clipper.prototype.IsEvenOddAltFillType = function (edge)
	  {
	    if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
	      return this.m_ClipFillType == ClipperLib.PolyFillType.pftEvenOdd;
	    else
	      return this.m_SubjFillType == ClipperLib.PolyFillType.pftEvenOdd;
	  };
	  ClipperLib.Clipper.prototype.IsContributing = function (edge)
	  {
	    var pft, pft2;
	    if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
	    {
	      pft = this.m_SubjFillType;
	      pft2 = this.m_ClipFillType;
	    }
	    else
	    {
	      pft = this.m_ClipFillType;
	      pft2 = this.m_SubjFillType;
	    }
	    switch (pft)
	    {
	    case ClipperLib.PolyFillType.pftEvenOdd:
	      if (edge.WindDelta === 0 && edge.WindCnt != 1)
	        return false;
	      break;
	    case ClipperLib.PolyFillType.pftNonZero:
	      if (Math.abs(edge.WindCnt) != 1)
	        return false;
	      break;
	    case ClipperLib.PolyFillType.pftPositive:
	      if (edge.WindCnt != 1)
	        return false;
	      break;
	    default:
	      if (edge.WindCnt != -1)
	        return false;
	      break;
	    }
	    switch (this.m_ClipType)
	    {
	    case ClipperLib.ClipType.ctIntersection:
	      switch (pft2)
	      {
	      case ClipperLib.PolyFillType.pftEvenOdd:
	      case ClipperLib.PolyFillType.pftNonZero:
	        return (edge.WindCnt2 !== 0);
	      case ClipperLib.PolyFillType.pftPositive:
	        return (edge.WindCnt2 > 0);
	      default:
	        return (edge.WindCnt2 < 0);
	      }
	    case ClipperLib.ClipType.ctUnion:
	      switch (pft2)
	      {
	      case ClipperLib.PolyFillType.pftEvenOdd:
	      case ClipperLib.PolyFillType.pftNonZero:
	        return (edge.WindCnt2 === 0);
	      case ClipperLib.PolyFillType.pftPositive:
	        return (edge.WindCnt2 <= 0);
	      default:
	        return (edge.WindCnt2 >= 0);
	      }
	    case ClipperLib.ClipType.ctDifference:
	      if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
	        switch (pft2)
	        {
	        case ClipperLib.PolyFillType.pftEvenOdd:
	        case ClipperLib.PolyFillType.pftNonZero:
	          return (edge.WindCnt2 === 0);
	        case ClipperLib.PolyFillType.pftPositive:
	          return (edge.WindCnt2 <= 0);
	        default:
	          return (edge.WindCnt2 >= 0);
	        }
	      else
	        switch (pft2)
	        {
	        case ClipperLib.PolyFillType.pftEvenOdd:
	        case ClipperLib.PolyFillType.pftNonZero:
	          return (edge.WindCnt2 !== 0);
	        case ClipperLib.PolyFillType.pftPositive:
	          return (edge.WindCnt2 > 0);
	        default:
	          return (edge.WindCnt2 < 0);
	        }
	    case ClipperLib.ClipType.ctXor:
	      if (edge.WindDelta === 0)
	        switch (pft2)
	        {
	        case ClipperLib.PolyFillType.pftEvenOdd:
	        case ClipperLib.PolyFillType.pftNonZero:
	          return (edge.WindCnt2 === 0);
	        case ClipperLib.PolyFillType.pftPositive:
	          return (edge.WindCnt2 <= 0);
	        default:
	          return (edge.WindCnt2 >= 0);
	        }
	      else
	        return true;
	    }
	    return true;
	  };
	  ClipperLib.Clipper.prototype.SetWindingCount = function (edge)
	  {
	    var e = edge.PrevInAEL;
	    //find the edge of the same polytype that immediately preceeds 'edge' in AEL
	    while (e !== null && ((e.PolyTyp != edge.PolyTyp) || (e.WindDelta === 0)))
	      e = e.PrevInAEL;
	    if (e === null)
	    {
	      edge.WindCnt = (edge.WindDelta === 0 ? 1 : edge.WindDelta);
	      edge.WindCnt2 = 0;
	      e = this.m_ActiveEdges;
	      //ie get ready to calc WindCnt2
	    }
	    else if (edge.WindDelta === 0 && this.m_ClipType != ClipperLib.ClipType.ctUnion)
	    {
	      edge.WindCnt = 1;
	      edge.WindCnt2 = e.WindCnt2;
	      e = e.NextInAEL;
	      //ie get ready to calc WindCnt2
	    }
	    else if (this.IsEvenOddFillType(edge))
	    {
	      //EvenOdd filling ...
	      if (edge.WindDelta === 0)
	      {
	        //are we inside a subj polygon ...
	        var Inside = true;
	        var e2 = e.PrevInAEL;
	        while (e2 !== null)
	        {
	          if (e2.PolyTyp == e.PolyTyp && e2.WindDelta !== 0)
	            Inside = !Inside;
	          e2 = e2.PrevInAEL;
	        }
	        edge.WindCnt = (Inside ? 0 : 1);
	      }
	      else
	      {
	        edge.WindCnt = edge.WindDelta;
	      }
	      edge.WindCnt2 = e.WindCnt2;
	      e = e.NextInAEL;
	      //ie get ready to calc WindCnt2
	    }
	    else
	    {
	      //nonZero, Positive or Negative filling ...
	      if (e.WindCnt * e.WindDelta < 0)
	      {
	        //prev edge is 'decreasing' WindCount (WC) toward zero
	        //so we're outside the previous polygon ...
	        if (Math.abs(e.WindCnt) > 1)
	        {
	          //outside prev poly but still inside another.
	          //when reversing direction of prev poly use the same WC
	          if (e.WindDelta * edge.WindDelta < 0)
	            edge.WindCnt = e.WindCnt;
	          else
	            edge.WindCnt = e.WindCnt + edge.WindDelta;
	        }
	        else
	          edge.WindCnt = (edge.WindDelta === 0 ? 1 : edge.WindDelta);
	      }
	      else
	      {
	        //prev edge is 'increasing' WindCount (WC) away from zero
	        //so we're inside the previous polygon ...
	        if (edge.WindDelta === 0)
	          edge.WindCnt = (e.WindCnt < 0 ? e.WindCnt - 1 : e.WindCnt + 1);
	        else if (e.WindDelta * edge.WindDelta < 0)
	          edge.WindCnt = e.WindCnt;
	        else
	          edge.WindCnt = e.WindCnt + edge.WindDelta;
	      }
	      edge.WindCnt2 = e.WindCnt2;
	      e = e.NextInAEL;
	      //ie get ready to calc WindCnt2
	    }
	    //update WindCnt2 ...
	    if (this.IsEvenOddAltFillType(edge))
	    {
	      //EvenOdd filling ...
	      while (e != edge)
	      {
	        if (e.WindDelta !== 0)
	          edge.WindCnt2 = (edge.WindCnt2 === 0 ? 1 : 0);
	        e = e.NextInAEL;
	      }
	    }
	    else
	    {
	      //nonZero, Positive or Negative filling ...
	      while (e != edge)
	      {
	        edge.WindCnt2 += e.WindDelta;
	        e = e.NextInAEL;
	      }
	    }
	  };
	  ClipperLib.Clipper.prototype.AddEdgeToSEL = function (edge)
	  {
	    //SEL pointers in PEdge are reused to build a list of horizontal edges.
	    //However, we don't need to worry about order with horizontal edge processing.
	    if (this.m_SortedEdges === null)
	    {
	      this.m_SortedEdges = edge;
	      edge.PrevInSEL = null;
	      edge.NextInSEL = null;
	    }
	    else
	    {
	      edge.NextInSEL = this.m_SortedEdges;
	      edge.PrevInSEL = null;
	      this.m_SortedEdges.PrevInSEL = edge;
	      this.m_SortedEdges = edge;
	    }
	  };
	  ClipperLib.Clipper.prototype.CopyAELToSEL = function ()
	  {
	    var e = this.m_ActiveEdges;
	    this.m_SortedEdges = e;
	    while (e !== null)
	    {
	      e.PrevInSEL = e.PrevInAEL;
	      e.NextInSEL = e.NextInAEL;
	      e = e.NextInAEL;
	    }
	  };
	  ClipperLib.Clipper.prototype.SwapPositionsInAEL = function (edge1, edge2)
	  {
	    //check that one or other edge hasn't already been removed from AEL ...
	    if (edge1.NextInAEL == edge1.PrevInAEL || edge2.NextInAEL == edge2.PrevInAEL)
	      return;
	    if (edge1.NextInAEL == edge2)
	    {
	      var next = edge2.NextInAEL;
	      if (next !== null)
	        next.PrevInAEL = edge1;
	      var prev = edge1.PrevInAEL;
	      if (prev !== null)
	        prev.NextInAEL = edge2;
	      edge2.PrevInAEL = prev;
	      edge2.NextInAEL = edge1;
	      edge1.PrevInAEL = edge2;
	      edge1.NextInAEL = next;
	    }
	    else if (edge2.NextInAEL == edge1)
	    {
	      var next = edge1.NextInAEL;
	      if (next !== null)
	        next.PrevInAEL = edge2;
	      var prev = edge2.PrevInAEL;
	      if (prev !== null)
	        prev.NextInAEL = edge1;
	      edge1.PrevInAEL = prev;
	      edge1.NextInAEL = edge2;
	      edge2.PrevInAEL = edge1;
	      edge2.NextInAEL = next;
	    }
	    else
	    {
	      var next = edge1.NextInAEL;
	      var prev = edge1.PrevInAEL;
	      edge1.NextInAEL = edge2.NextInAEL;
	      if (edge1.NextInAEL !== null)
	        edge1.NextInAEL.PrevInAEL = edge1;
	      edge1.PrevInAEL = edge2.PrevInAEL;
	      if (edge1.PrevInAEL !== null)
	        edge1.PrevInAEL.NextInAEL = edge1;
	      edge2.NextInAEL = next;
	      if (edge2.NextInAEL !== null)
	        edge2.NextInAEL.PrevInAEL = edge2;
	      edge2.PrevInAEL = prev;
	      if (edge2.PrevInAEL !== null)
	        edge2.PrevInAEL.NextInAEL = edge2;
	    }
	    if (edge1.PrevInAEL === null)
	      this.m_ActiveEdges = edge1;
	    else if (edge2.PrevInAEL === null)
	      this.m_ActiveEdges = edge2;
	  };
	  ClipperLib.Clipper.prototype.SwapPositionsInSEL = function (edge1, edge2)
	  {
	    if (edge1.NextInSEL === null && edge1.PrevInSEL === null)
	      return;
	    if (edge2.NextInSEL === null && edge2.PrevInSEL === null)
	      return;
	    if (edge1.NextInSEL == edge2)
	    {
	      var next = edge2.NextInSEL;
	      if (next !== null)
	        next.PrevInSEL = edge1;
	      var prev = edge1.PrevInSEL;
	      if (prev !== null)
	        prev.NextInSEL = edge2;
	      edge2.PrevInSEL = prev;
	      edge2.NextInSEL = edge1;
	      edge1.PrevInSEL = edge2;
	      edge1.NextInSEL = next;
	    }
	    else if (edge2.NextInSEL == edge1)
	    {
	      var next = edge1.NextInSEL;
	      if (next !== null)
	        next.PrevInSEL = edge2;
	      var prev = edge2.PrevInSEL;
	      if (prev !== null)
	        prev.NextInSEL = edge1;
	      edge1.PrevInSEL = prev;
	      edge1.NextInSEL = edge2;
	      edge2.PrevInSEL = edge1;
	      edge2.NextInSEL = next;
	    }
	    else
	    {
	      var next = edge1.NextInSEL;
	      var prev = edge1.PrevInSEL;
	      edge1.NextInSEL = edge2.NextInSEL;
	      if (edge1.NextInSEL !== null)
	        edge1.NextInSEL.PrevInSEL = edge1;
	      edge1.PrevInSEL = edge2.PrevInSEL;
	      if (edge1.PrevInSEL !== null)
	        edge1.PrevInSEL.NextInSEL = edge1;
	      edge2.NextInSEL = next;
	      if (edge2.NextInSEL !== null)
	        edge2.NextInSEL.PrevInSEL = edge2;
	      edge2.PrevInSEL = prev;
	      if (edge2.PrevInSEL !== null)
	        edge2.PrevInSEL.NextInSEL = edge2;
	    }
	    if (edge1.PrevInSEL === null)
	      this.m_SortedEdges = edge1;
	    else if (edge2.PrevInSEL === null)
	      this.m_SortedEdges = edge2;
	  };
	  ClipperLib.Clipper.prototype.AddLocalMaxPoly = function (e1, e2, pt)
	  {
	    this.AddOutPt(e1, pt);
	    if (e2.WindDelta == 0) this.AddOutPt(e2, pt);
	    if (e1.OutIdx == e2.OutIdx)
	    {
	      e1.OutIdx = -1;
	      e2.OutIdx = -1;
	    }
	    else if (e1.OutIdx < e2.OutIdx)
	      this.AppendPolygon(e1, e2);
	    else
	      this.AppendPolygon(e2, e1);
	  };
	  ClipperLib.Clipper.prototype.AddLocalMinPoly = function (e1, e2, pt)
	  {
	    var result;
	    var e, prevE;
	    if (ClipperLib.ClipperBase.IsHorizontal(e2) || (e1.Dx > e2.Dx))
	    {
	      result = this.AddOutPt(e1, pt);
	      e2.OutIdx = e1.OutIdx;
	      e1.Side = ClipperLib.EdgeSide.esLeft;
	      e2.Side = ClipperLib.EdgeSide.esRight;
	      e = e1;
	      if (e.PrevInAEL == e2)
	        prevE = e2.PrevInAEL;
	      else
	        prevE = e.PrevInAEL;
	    }
	    else
	    {
	      result = this.AddOutPt(e2, pt);
	      e1.OutIdx = e2.OutIdx;
	      e1.Side = ClipperLib.EdgeSide.esRight;
	      e2.Side = ClipperLib.EdgeSide.esLeft;
	      e = e2;
	      if (e.PrevInAEL == e1)
	        prevE = e1.PrevInAEL;
	      else
	        prevE = e.PrevInAEL;
	    }
	    if (prevE !== null && prevE.OutIdx >= 0 && (ClipperLib.Clipper.TopX(prevE, pt.Y) == ClipperLib.Clipper.TopX(e, pt.Y)) && ClipperLib.ClipperBase.SlopesEqual(e, prevE, this.m_UseFullRange) && (e.WindDelta !== 0) && (prevE.WindDelta !== 0))
	    {
	      var outPt = this.AddOutPt(prevE, pt);
	      this.AddJoin(result, outPt, e.Top);
	    }
	    return result;
	  };
	  ClipperLib.Clipper.prototype.CreateOutRec = function ()
	  {
	    var result = new ClipperLib.OutRec();
	    result.Idx = -1;
	    result.IsHole = false;
	    result.IsOpen = false;
	    result.FirstLeft = null;
	    result.Pts = null;
	    result.BottomPt = null;
	    result.PolyNode = null;
	    this.m_PolyOuts.push(result);
	    result.Idx = this.m_PolyOuts.length - 1;
	    return result;
	  };
	  ClipperLib.Clipper.prototype.AddOutPt = function (e, pt)
	  {
	    var ToFront = (e.Side == ClipperLib.EdgeSide.esLeft);
	    if (e.OutIdx < 0)
	    {
	      var outRec = this.CreateOutRec();
	      outRec.IsOpen = (e.WindDelta === 0);
	      var newOp = new ClipperLib.OutPt();
	      outRec.Pts = newOp;
	      newOp.Idx = outRec.Idx;
	      //newOp.Pt = pt;
	      newOp.Pt.X = pt.X;
	      newOp.Pt.Y = pt.Y;
	      newOp.Next = newOp;
	      newOp.Prev = newOp;
	      if (!outRec.IsOpen)
	        this.SetHoleState(e, outRec);
	      e.OutIdx = outRec.Idx;
	      //nb: do this after SetZ !
	      return newOp;
	    }
	    else
	    {
	      var outRec = this.m_PolyOuts[e.OutIdx];
	      //OutRec.Pts is the 'Left-most' point & OutRec.Pts.Prev is the 'Right-most'
	      var op = outRec.Pts;
	      if (ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Pt))
	        return op;
	      else if (!ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Prev.Pt))
	        return op.Prev;
	      var newOp = new ClipperLib.OutPt();
	      newOp.Idx = outRec.Idx;
	      //newOp.Pt = pt;
	      newOp.Pt.X = pt.X;
	      newOp.Pt.Y = pt.Y;
	      newOp.Next = op;
	      newOp.Prev = op.Prev;
	      newOp.Prev.Next = newOp;
	      op.Prev = newOp;
	      if (ToFront)
	        outRec.Pts = newOp;
	      return newOp;
	    }
	  };
	  ClipperLib.Clipper.prototype.SwapPoints = function (pt1, pt2)
	  {
	    var tmp = new ClipperLib.IntPoint(pt1.Value);
	    //pt1.Value = pt2.Value;
	    pt1.Value.X = pt2.Value.X;
	    pt1.Value.Y = pt2.Value.Y;
	    //pt2.Value = tmp;
	    pt2.Value.X = tmp.X;
	    pt2.Value.Y = tmp.Y;
	  };
	  ClipperLib.Clipper.prototype.HorzSegmentsOverlap = function (seg1a, seg1b, seg2a, seg2b)
		{
			var tmp;
			if (seg1a > seg1b)
			{
				tmp = seg1a;
				seg1a = seg1b;
				seg1b = tmp;
			}
			if (seg2a > seg2b)
			{
				tmp = seg2a;
				seg2a = seg2b;
				seg2b = tmp;
			}
			return (seg1a < seg2b) && (seg2a < seg1b);
		}
	
	  ClipperLib.Clipper.prototype.SetHoleState = function (e, outRec)
	  {
	    var isHole = false;
	    var e2 = e.PrevInAEL;
	    while (e2 !== null)
	    {
	      if (e2.OutIdx >= 0 && e2.WindDelta != 0)
	      {
	        isHole = !isHole;
	        if (outRec.FirstLeft === null)
	          outRec.FirstLeft = this.m_PolyOuts[e2.OutIdx];
	      }
	      e2 = e2.PrevInAEL;
	    }
	    if (isHole)
	      outRec.IsHole = true;
	  };
	  ClipperLib.Clipper.prototype.GetDx = function (pt1, pt2)
	  {
	    if (pt1.Y == pt2.Y)
	      return ClipperLib.ClipperBase.horizontal;
	    else
	      return (pt2.X - pt1.X) / (pt2.Y - pt1.Y);
	  };
	  ClipperLib.Clipper.prototype.FirstIsBottomPt = function (btmPt1, btmPt2)
	  {
	    var p = btmPt1.Prev;
	    while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt)) && (p != btmPt1))
	      p = p.Prev;
	    var dx1p = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
	    p = btmPt1.Next;
	    while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt)) && (p != btmPt1))
	      p = p.Next;
	    var dx1n = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
	    p = btmPt2.Prev;
	    while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt)) && (p != btmPt2))
	      p = p.Prev;
	    var dx2p = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
	    p = btmPt2.Next;
	    while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt)) && (p != btmPt2))
	      p = p.Next;
	    var dx2n = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
	    return (dx1p >= dx2p && dx1p >= dx2n) || (dx1n >= dx2p && dx1n >= dx2n);
	  };
	  ClipperLib.Clipper.prototype.GetBottomPt = function (pp)
	  {
	    var dups = null;
	    var p = pp.Next;
	    while (p != pp)
	    {
	      if (p.Pt.Y > pp.Pt.Y)
	      {
	        pp = p;
	        dups = null;
	      }
	      else if (p.Pt.Y == pp.Pt.Y && p.Pt.X <= pp.Pt.X)
	      {
	        if (p.Pt.X < pp.Pt.X)
	        {
	          dups = null;
	          pp = p;
	        }
	        else
	        {
	          if (p.Next != pp && p.Prev != pp)
	            dups = p;
	        }
	      }
	      p = p.Next;
	    }
	    if (dups !== null)
	    {
	      //there appears to be at least 2 vertices at bottomPt so ...
	      while (dups != p)
	      {
	        if (!this.FirstIsBottomPt(p, dups))
	          pp = dups;
	        dups = dups.Next;
	        while (ClipperLib.IntPoint.op_Inequality(dups.Pt, pp.Pt))
	          dups = dups.Next;
	      }
	    }
	    return pp;
	  };
	  ClipperLib.Clipper.prototype.GetLowermostRec = function (outRec1, outRec2)
	  {
	    //work out which polygon fragment has the correct hole state ...
	    if (outRec1.BottomPt === null)
	      outRec1.BottomPt = this.GetBottomPt(outRec1.Pts);
	    if (outRec2.BottomPt === null)
	      outRec2.BottomPt = this.GetBottomPt(outRec2.Pts);
	    var bPt1 = outRec1.BottomPt;
	    var bPt2 = outRec2.BottomPt;
	    if (bPt1.Pt.Y > bPt2.Pt.Y)
	      return outRec1;
	    else if (bPt1.Pt.Y < bPt2.Pt.Y)
	      return outRec2;
	    else if (bPt1.Pt.X < bPt2.Pt.X)
	      return outRec1;
	    else if (bPt1.Pt.X > bPt2.Pt.X)
	      return outRec2;
	    else if (bPt1.Next == bPt1)
	      return outRec2;
	    else if (bPt2.Next == bPt2)
	      return outRec1;
	    else if (this.FirstIsBottomPt(bPt1, bPt2))
	      return outRec1;
	    else
	      return outRec2;
	  };
	  ClipperLib.Clipper.prototype.Param1RightOfParam2 = function (outRec1, outRec2)
	  {
	    do {
	      outRec1 = outRec1.FirstLeft;
	      if (outRec1 == outRec2)
	        return true;
	    }
	    while (outRec1 !== null)
	    return false;
	  };
	  ClipperLib.Clipper.prototype.GetOutRec = function (idx)
	  {
	    var outrec = this.m_PolyOuts[idx];
	    while (outrec != this.m_PolyOuts[outrec.Idx])
	      outrec = this.m_PolyOuts[outrec.Idx];
	    return outrec;
	  };
	  ClipperLib.Clipper.prototype.AppendPolygon = function (e1, e2)
	  {
	    //get the start and ends of both output polygons ...
	    var outRec1 = this.m_PolyOuts[e1.OutIdx];
	    var outRec2 = this.m_PolyOuts[e2.OutIdx];
	    var holeStateRec;
	    if (this.Param1RightOfParam2(outRec1, outRec2))
	      holeStateRec = outRec2;
	    else if (this.Param1RightOfParam2(outRec2, outRec1))
	      holeStateRec = outRec1;
	    else
	      holeStateRec = this.GetLowermostRec(outRec1, outRec2);
	    var p1_lft = outRec1.Pts;
	    var p1_rt = p1_lft.Prev;
	    var p2_lft = outRec2.Pts;
	    var p2_rt = p2_lft.Prev;
	    var side;
	    //join e2 poly onto e1 poly and delete pointers to e2 ...
	    if (e1.Side == ClipperLib.EdgeSide.esLeft)
	    {
	      if (e2.Side == ClipperLib.EdgeSide.esLeft)
	      {
	        //z y x a b c
	        this.ReversePolyPtLinks(p2_lft);
	        p2_lft.Next = p1_lft;
	        p1_lft.Prev = p2_lft;
	        p1_rt.Next = p2_rt;
	        p2_rt.Prev = p1_rt;
	        outRec1.Pts = p2_rt;
	      }
	      else
	      {
	        //x y z a b c
	        p2_rt.Next = p1_lft;
	        p1_lft.Prev = p2_rt;
	        p2_lft.Prev = p1_rt;
	        p1_rt.Next = p2_lft;
	        outRec1.Pts = p2_lft;
	      }
	      side = ClipperLib.EdgeSide.esLeft;
	    }
	    else
	    {
	      if (e2.Side == ClipperLib.EdgeSide.esRight)
	      {
	        //a b c z y x
	        this.ReversePolyPtLinks(p2_lft);
	        p1_rt.Next = p2_rt;
	        p2_rt.Prev = p1_rt;
	        p2_lft.Next = p1_lft;
	        p1_lft.Prev = p2_lft;
	      }
	      else
	      {
	        //a b c x y z
	        p1_rt.Next = p2_lft;
	        p2_lft.Prev = p1_rt;
	        p1_lft.Prev = p2_rt;
	        p2_rt.Next = p1_lft;
	      }
	      side = ClipperLib.EdgeSide.esRight;
	    }
	    outRec1.BottomPt = null;
	    if (holeStateRec == outRec2)
	    {
	      if (outRec2.FirstLeft != outRec1)
	        outRec1.FirstLeft = outRec2.FirstLeft;
	      outRec1.IsHole = outRec2.IsHole;
	    }
	    outRec2.Pts = null;
	    outRec2.BottomPt = null;
	    outRec2.FirstLeft = outRec1;
	    var OKIdx = e1.OutIdx;
	    var ObsoleteIdx = e2.OutIdx;
	    e1.OutIdx = -1;
	    //nb: safe because we only get here via AddLocalMaxPoly
	    e2.OutIdx = -1;
	    var e = this.m_ActiveEdges;
	    while (e !== null)
	    {
	      if (e.OutIdx == ObsoleteIdx)
	      {
	        e.OutIdx = OKIdx;
	        e.Side = side;
	        break;
	      }
	      e = e.NextInAEL;
	    }
	    outRec2.Idx = outRec1.Idx;
	  };
	  ClipperLib.Clipper.prototype.ReversePolyPtLinks = function (pp)
	  {
	    if (pp === null)
	      return;
	    var pp1;
	    var pp2;
	    pp1 = pp;
	    do {
	      pp2 = pp1.Next;
	      pp1.Next = pp1.Prev;
	      pp1.Prev = pp2;
	      pp1 = pp2;
	    }
	    while (pp1 != pp)
	  };
	  ClipperLib.Clipper.SwapSides = function (edge1, edge2)
	  {
	    var side = edge1.Side;
	    edge1.Side = edge2.Side;
	    edge2.Side = side;
	  };
	  ClipperLib.Clipper.SwapPolyIndexes = function (edge1, edge2)
	  {
	    var outIdx = edge1.OutIdx;
	    edge1.OutIdx = edge2.OutIdx;
	    edge2.OutIdx = outIdx;
	  };
	  ClipperLib.Clipper.prototype.IntersectEdges = function (e1, e2, pt)
	  {
	    //e1 will be to the left of e2 BELOW the intersection. Therefore e1 is before
	    //e2 in AEL except when e1 is being inserted at the intersection point ...
	    var e1Contributing = (e1.OutIdx >= 0);
	    var e2Contributing = (e2.OutIdx >= 0);
	
	    if (use_xyz)
	    	this.SetZ(pt, e1, e2);
	
	    if (use_lines)
	    {
	      //if either edge is on an OPEN path ...
	      if (e1.WindDelta === 0 || e2.WindDelta === 0)
	      {
	        //ignore subject-subject open path intersections UNLESS they
	        //are both open paths, AND they are both 'contributing maximas' ...
					if (e1.WindDelta == 0 && e2.WindDelta == 0) return;
	        //if intersecting a subj line with a subj poly ...
	        else if (e1.PolyTyp == e2.PolyTyp &&
	          e1.WindDelta != e2.WindDelta && this.m_ClipType == ClipperLib.ClipType.ctUnion)
	        {
	          if (e1.WindDelta === 0)
	          {
	            if (e2Contributing)
	            {
	              this.AddOutPt(e1, pt);
	              if (e1Contributing)
	                e1.OutIdx = -1;
	            }
	          }
	          else
	          {
	            if (e1Contributing)
	            {
	              this.AddOutPt(e2, pt);
	              if (e2Contributing)
	                e2.OutIdx = -1;
	            }
	          }
	        }
	        else if (e1.PolyTyp != e2.PolyTyp)
	        {
	          if ((e1.WindDelta === 0) && Math.abs(e2.WindCnt) == 1 &&
	            (this.m_ClipType != ClipperLib.ClipType.ctUnion || e2.WindCnt2 === 0))
	          {
	            this.AddOutPt(e1, pt);
	            if (e1Contributing)
	              e1.OutIdx = -1;
	          }
	          else if ((e2.WindDelta === 0) && (Math.abs(e1.WindCnt) == 1) &&
	            (this.m_ClipType != ClipperLib.ClipType.ctUnion || e1.WindCnt2 === 0))
	          {
	            this.AddOutPt(e2, pt);
	            if (e2Contributing)
	              e2.OutIdx = -1;
	          }
	        }
	        return;
	      }
	    }
	    //update winding counts...
	    //assumes that e1 will be to the Right of e2 ABOVE the intersection
	    if (e1.PolyTyp == e2.PolyTyp)
	    {
	      if (this.IsEvenOddFillType(e1))
	      {
	        var oldE1WindCnt = e1.WindCnt;
	        e1.WindCnt = e2.WindCnt;
	        e2.WindCnt = oldE1WindCnt;
	      }
	      else
	      {
	        if (e1.WindCnt + e2.WindDelta === 0)
	          e1.WindCnt = -e1.WindCnt;
	        else
	          e1.WindCnt += e2.WindDelta;
	        if (e2.WindCnt - e1.WindDelta === 0)
	          e2.WindCnt = -e2.WindCnt;
	        else
	          e2.WindCnt -= e1.WindDelta;
	      }
	    }
	    else
	    {
	      if (!this.IsEvenOddFillType(e2))
	        e1.WindCnt2 += e2.WindDelta;
	      else
	        e1.WindCnt2 = (e1.WindCnt2 === 0) ? 1 : 0;
	      if (!this.IsEvenOddFillType(e1))
	        e2.WindCnt2 -= e1.WindDelta;
	      else
	        e2.WindCnt2 = (e2.WindCnt2 === 0) ? 1 : 0;
	    }
	    var e1FillType, e2FillType, e1FillType2, e2FillType2;
	    if (e1.PolyTyp == ClipperLib.PolyType.ptSubject)
	    {
	      e1FillType = this.m_SubjFillType;
	      e1FillType2 = this.m_ClipFillType;
	    }
	    else
	    {
	      e1FillType = this.m_ClipFillType;
	      e1FillType2 = this.m_SubjFillType;
	    }
	    if (e2.PolyTyp == ClipperLib.PolyType.ptSubject)
	    {
	      e2FillType = this.m_SubjFillType;
	      e2FillType2 = this.m_ClipFillType;
	    }
	    else
	    {
	      e2FillType = this.m_ClipFillType;
	      e2FillType2 = this.m_SubjFillType;
	    }
	    var e1Wc, e2Wc;
	    switch (e1FillType)
	    {
	    case ClipperLib.PolyFillType.pftPositive:
	      e1Wc = e1.WindCnt;
	      break;
	    case ClipperLib.PolyFillType.pftNegative:
	      e1Wc = -e1.WindCnt;
	      break;
	    default:
	      e1Wc = Math.abs(e1.WindCnt);
	      break;
	    }
	    switch (e2FillType)
	    {
	    case ClipperLib.PolyFillType.pftPositive:
	      e2Wc = e2.WindCnt;
	      break;
	    case ClipperLib.PolyFillType.pftNegative:
	      e2Wc = -e2.WindCnt;
	      break;
	    default:
	      e2Wc = Math.abs(e2.WindCnt);
	      break;
	    }
	    if (e1Contributing && e2Contributing)
	    {
				if ((e1Wc != 0 && e1Wc != 1) || (e2Wc != 0 && e2Wc != 1) ||
				(e1.PolyTyp != e2.PolyTyp && this.m_ClipType != ClipperLib.ClipType.ctXor))
				{
					this.AddLocalMaxPoly(e1, e2, pt);
				}
	      else
	      {
	        this.AddOutPt(e1, pt);
	        this.AddOutPt(e2, pt);
	        ClipperLib.Clipper.SwapSides(e1, e2);
	        ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
	      }
	    }
	    else if (e1Contributing)
	    {
	      if (e2Wc === 0 || e2Wc == 1)
	      {
	        this.AddOutPt(e1, pt);
	        ClipperLib.Clipper.SwapSides(e1, e2);
	        ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
	      }
	    }
	    else if (e2Contributing)
	    {
	      if (e1Wc === 0 || e1Wc == 1)
	      {
	        this.AddOutPt(e2, pt);
	        ClipperLib.Clipper.SwapSides(e1, e2);
	        ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
	      }
	    }
			else if ( (e1Wc == 0 || e1Wc == 1) && (e2Wc == 0 || e2Wc == 1))
	    {
	      //neither edge is currently contributing ...
	      var e1Wc2, e2Wc2;
	      switch (e1FillType2)
	      {
	      case ClipperLib.PolyFillType.pftPositive:
	        e1Wc2 = e1.WindCnt2;
	        break;
	      case ClipperLib.PolyFillType.pftNegative:
	        e1Wc2 = -e1.WindCnt2;
	        break;
	      default:
	        e1Wc2 = Math.abs(e1.WindCnt2);
	        break;
	      }
	      switch (e2FillType2)
	      {
	      case ClipperLib.PolyFillType.pftPositive:
	        e2Wc2 = e2.WindCnt2;
	        break;
	      case ClipperLib.PolyFillType.pftNegative:
	        e2Wc2 = -e2.WindCnt2;
	        break;
	      default:
	        e2Wc2 = Math.abs(e2.WindCnt2);
	        break;
	      }
	      if (e1.PolyTyp != e2.PolyTyp)
	      {
	        this.AddLocalMinPoly(e1, e2, pt);
	      }
	      else if (e1Wc == 1 && e2Wc == 1)
	        switch (this.m_ClipType)
	        {
	        case ClipperLib.ClipType.ctIntersection:
	          if (e1Wc2 > 0 && e2Wc2 > 0)
	            this.AddLocalMinPoly(e1, e2, pt);
	          break;
	        case ClipperLib.ClipType.ctUnion:
	          if (e1Wc2 <= 0 && e2Wc2 <= 0)
	            this.AddLocalMinPoly(e1, e2, pt);
	          break;
	        case ClipperLib.ClipType.ctDifference:
	          if (((e1.PolyTyp == ClipperLib.PolyType.ptClip) && (e1Wc2 > 0) && (e2Wc2 > 0)) ||
	            ((e1.PolyTyp == ClipperLib.PolyType.ptSubject) && (e1Wc2 <= 0) && (e2Wc2 <= 0)))
	            this.AddLocalMinPoly(e1, e2, pt);
	          break;
	        case ClipperLib.ClipType.ctXor:
	          this.AddLocalMinPoly(e1, e2, pt);
	          break;
	        }
	      else
	        ClipperLib.Clipper.SwapSides(e1, e2);
	    }
	  };
	  ClipperLib.Clipper.prototype.DeleteFromAEL = function (e)
	  {
	    var AelPrev = e.PrevInAEL;
	    var AelNext = e.NextInAEL;
	    if (AelPrev === null && AelNext === null && (e != this.m_ActiveEdges))
	      return;
	    //already deleted
	    if (AelPrev !== null)
	      AelPrev.NextInAEL = AelNext;
	    else
	      this.m_ActiveEdges = AelNext;
	    if (AelNext !== null)
	      AelNext.PrevInAEL = AelPrev;
	    e.NextInAEL = null;
	    e.PrevInAEL = null;
	  };
	  ClipperLib.Clipper.prototype.DeleteFromSEL = function (e)
	  {
	    var SelPrev = e.PrevInSEL;
	    var SelNext = e.NextInSEL;
	    if (SelPrev === null && SelNext === null && (e != this.m_SortedEdges))
	      return;
	    //already deleted
	    if (SelPrev !== null)
	      SelPrev.NextInSEL = SelNext;
	    else
	      this.m_SortedEdges = SelNext;
	    if (SelNext !== null)
	      SelNext.PrevInSEL = SelPrev;
	    e.NextInSEL = null;
	    e.PrevInSEL = null;
	  };
	  ClipperLib.Clipper.prototype.UpdateEdgeIntoAEL = function (e)
	  {
	    if (e.NextInLML === null)
	      ClipperLib.Error("UpdateEdgeIntoAEL: invalid call");
	    var AelPrev = e.PrevInAEL;
	    var AelNext = e.NextInAEL;
	    e.NextInLML.OutIdx = e.OutIdx;
	    if (AelPrev !== null)
	      AelPrev.NextInAEL = e.NextInLML;
	    else
	      this.m_ActiveEdges = e.NextInLML;
	    if (AelNext !== null)
	      AelNext.PrevInAEL = e.NextInLML;
	    e.NextInLML.Side = e.Side;
	    e.NextInLML.WindDelta = e.WindDelta;
	    e.NextInLML.WindCnt = e.WindCnt;
	    e.NextInLML.WindCnt2 = e.WindCnt2;
	    e = e.NextInLML;
	    //    e.Curr = e.Bot;
	    e.Curr.X = e.Bot.X;
	    e.Curr.Y = e.Bot.Y;
	    e.PrevInAEL = AelPrev;
	    e.NextInAEL = AelNext;
	    if (!ClipperLib.ClipperBase.IsHorizontal(e))
	      this.InsertScanbeam(e.Top.Y);
	    return e;
	  };
	  ClipperLib.Clipper.prototype.ProcessHorizontals = function (isTopOfScanbeam)
	  {
	    var horzEdge = this.m_SortedEdges;
	    while (horzEdge !== null)
	    {
	      this.DeleteFromSEL(horzEdge);
	      this.ProcessHorizontal(horzEdge, isTopOfScanbeam);
	      horzEdge = this.m_SortedEdges;
	    }
	  };
	  ClipperLib.Clipper.prototype.GetHorzDirection = function (HorzEdge, $var)
	  {
	    if (HorzEdge.Bot.X < HorzEdge.Top.X)
	    {
	        $var.Left = HorzEdge.Bot.X;
	        $var.Right = HorzEdge.Top.X;
	        $var.Dir = ClipperLib.Direction.dLeftToRight;
	    }
	    else
	    {
	        $var.Left = HorzEdge.Top.X;
	        $var.Right = HorzEdge.Bot.X;
	        $var.Dir = ClipperLib.Direction.dRightToLeft;
	    }
	  };
	  ClipperLib.Clipper.prototype.ProcessHorizontal = function (horzEdge, isTopOfScanbeam)
	  {
	    var $var = {Dir: null, Left: null, Right: null};
	    this.GetHorzDirection(horzEdge, $var);
	    var dir = $var.Dir;
	    var horzLeft = $var.Left;
	    var horzRight = $var.Right;
	
	    var eLastHorz = horzEdge,
	      eMaxPair = null;
	    while (eLastHorz.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(eLastHorz.NextInLML))
	      eLastHorz = eLastHorz.NextInLML;
	    if (eLastHorz.NextInLML === null)
	      eMaxPair = this.GetMaximaPair(eLastHorz);
	    for (;;)
	    {
	      var IsLastHorz = (horzEdge == eLastHorz);
	      var e = this.GetNextInAEL(horzEdge, dir);
	      while (e !== null)
	      {
	        //Break if we've got to the end of an intermediate horizontal edge ...
	        //nb: Smaller Dx's are to the right of larger Dx's ABOVE the horizontal.
	        if (e.Curr.X == horzEdge.Top.X && horzEdge.NextInLML !== null && e.Dx < horzEdge.NextInLML.Dx)
	          break;
	        var eNext = this.GetNextInAEL(e, dir);
	        //saves eNext for later
	        if ((dir == ClipperLib.Direction.dLeftToRight && e.Curr.X <= horzRight) || (dir == ClipperLib.Direction.dRightToLeft && e.Curr.X >= horzLeft))
	        {
	          //so far we're still in range of the horizontal Edge  but make sure
	          //we're at the last of consec. horizontals when matching with eMaxPair
	          if (e == eMaxPair && IsLastHorz)
	          {
							if (horzEdge.OutIdx >= 0)
							{
								var op1 = this.AddOutPt(horzEdge, horzEdge.Top);
								var eNextHorz = this.m_SortedEdges;
								while (eNextHorz !== null)
								{
									if (eNextHorz.OutIdx >= 0 &&
										this.HorzSegmentsOverlap(horzEdge.Bot.X,
										horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X))
									{
										var op2 = this.AddOutPt(eNextHorz, eNextHorz.Bot);
										this.AddJoin(op2, op1, eNextHorz.Top);
									}
									eNextHorz = eNextHorz.NextInSEL;
								}
								this.AddGhostJoin(op1, horzEdge.Bot);
								this.AddLocalMaxPoly(horzEdge, eMaxPair, horzEdge.Top);
							}
							this.DeleteFromAEL(horzEdge);
							this.DeleteFromAEL(eMaxPair);
	            return;
	          }
	          else if (dir == ClipperLib.Direction.dLeftToRight)
	          {
	            var Pt = new ClipperLib.IntPoint(e.Curr.X, horzEdge.Curr.Y);
	            this.IntersectEdges(horzEdge, e, Pt);
	          }
	          else
	          {
	            var Pt = new ClipperLib.IntPoint(e.Curr.X, horzEdge.Curr.Y);
	            this.IntersectEdges(e, horzEdge, Pt);
	          }
	          this.SwapPositionsInAEL(horzEdge, e);
	        }
	        else if ((dir == ClipperLib.Direction.dLeftToRight && e.Curr.X >= horzRight) || (dir == ClipperLib.Direction.dRightToLeft && e.Curr.X <= horzLeft))
	          break;
	        e = eNext;
	      }
	      //end while
	      if (horzEdge.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(horzEdge.NextInLML))
	      {
	        horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
	        if (horzEdge.OutIdx >= 0)
	          this.AddOutPt(horzEdge, horzEdge.Bot);
	
	          var $var = {Dir: dir, Left: horzLeft, Right: horzRight};
	          this.GetHorzDirection(horzEdge, $var);
	          dir = $var.Dir;
	          horzLeft = $var.Left;
	          horzRight = $var.Right;
	      }
	      else
	        break;
	    }
	    //end for (;;)
	    if (horzEdge.NextInLML !== null)
	    {
	      if (horzEdge.OutIdx >= 0)
	      {
	        var op1 = this.AddOutPt(horzEdge, horzEdge.Top);
					if (isTopOfScanbeam) this.AddGhostJoin(op1, horzEdge.Bot);
	        horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
	        if (horzEdge.WindDelta === 0)
	          return;
	        //nb: HorzEdge is no longer horizontal here
	        var ePrev = horzEdge.PrevInAEL;
	        var eNext = horzEdge.NextInAEL;
	        if (ePrev !== null && ePrev.Curr.X == horzEdge.Bot.X &&
	          ePrev.Curr.Y == horzEdge.Bot.Y && ePrev.WindDelta !== 0 &&
	          (ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y &&
	            ClipperLib.ClipperBase.SlopesEqual(horzEdge, ePrev, this.m_UseFullRange)))
	        {
	          var op2 = this.AddOutPt(ePrev, horzEdge.Bot);
	          this.AddJoin(op1, op2, horzEdge.Top);
	        }
	        else if (eNext !== null && eNext.Curr.X == horzEdge.Bot.X &&
	          eNext.Curr.Y == horzEdge.Bot.Y && eNext.WindDelta !== 0 &&
	          eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y &&
	          ClipperLib.ClipperBase.SlopesEqual(horzEdge, eNext, this.m_UseFullRange))
	        {
	          var op2 = this.AddOutPt(eNext, horzEdge.Bot);
	          this.AddJoin(op1, op2, horzEdge.Top);
	        }
	      }
	      else horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
	    }
	  	else
	    {
	      if (horzEdge.OutIdx >= 0)
	        this.AddOutPt(horzEdge, horzEdge.Top);
	      this.DeleteFromAEL(horzEdge);
	    }
	  };
	  ClipperLib.Clipper.prototype.GetNextInAEL = function (e, Direction)
	  {
	    return Direction == ClipperLib.Direction.dLeftToRight ? e.NextInAEL : e.PrevInAEL;
	  };
	  ClipperLib.Clipper.prototype.IsMinima = function (e)
	  {
	    return e !== null && (e.Prev.NextInLML != e) && (e.Next.NextInLML != e);
	  };
	  ClipperLib.Clipper.prototype.IsMaxima = function (e, Y)
	  {
	    return (e !== null && e.Top.Y == Y && e.NextInLML === null);
	  };
	  ClipperLib.Clipper.prototype.IsIntermediate = function (e, Y)
	  {
	    return (e.Top.Y == Y && e.NextInLML !== null);
	  };
	  ClipperLib.Clipper.prototype.GetMaximaPair = function (e)
	  {
	    var result = null;
	    if ((ClipperLib.IntPoint.op_Equality(e.Next.Top, e.Top)) && e.Next.NextInLML === null)
	      result = e.Next;
	    else if ((ClipperLib.IntPoint.op_Equality(e.Prev.Top, e.Top)) && e.Prev.NextInLML === null)
	      result = e.Prev;
	    if (result !== null && (result.OutIdx == -2 || (result.NextInAEL == result.PrevInAEL && !ClipperLib.ClipperBase.IsHorizontal(result))))
	      return null;
	    return result;
	  };
	
	  ClipperLib.Clipper.prototype.ProcessIntersections = function (topY)
	  {
	    if (this.m_ActiveEdges == null)
	      return true;
	    try
	    {
	      this.BuildIntersectList(topY);
	      if (this.m_IntersectList.length == 0)
	        return true;
	      if (this.m_IntersectList.length == 1 || this.FixupIntersectionOrder())
	        this.ProcessIntersectList();
	      else
	        return false;
	    }
	    catch ($$e2)
	    {
	      this.m_SortedEdges = null;
	      this.m_IntersectList.length = 0;
	      ClipperLib.Error("ProcessIntersections error");
	    }
	    this.m_SortedEdges = null;
	    return true;
	  };
	  ClipperLib.Clipper.prototype.BuildIntersectList = function (topY)
	  {
	    if (this.m_ActiveEdges === null)
	      return;
	    //prepare for sorting ...
	    var e = this.m_ActiveEdges;
	    //console.log(JSON.stringify(JSON.decycle( e )));
	    this.m_SortedEdges = e;
	    while (e !== null)
	    {
	      e.PrevInSEL = e.PrevInAEL;
	      e.NextInSEL = e.NextInAEL;
	      e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
	      e = e.NextInAEL;
	    }
	    //bubblesort ...
	    var isModified = true;
	    while (isModified && this.m_SortedEdges !== null)
	    {
	      isModified = false;
	      e = this.m_SortedEdges;
	      while (e.NextInSEL !== null)
	      {
	        var eNext = e.NextInSEL;
	        var pt = new ClipperLib.IntPoint();
	        //console.log("e.Curr.X: " + e.Curr.X + " eNext.Curr.X" + eNext.Curr.X);
	        if (e.Curr.X > eNext.Curr.X)
	        {
						this.IntersectPoint(e, eNext, pt);
	          var newNode = new ClipperLib.IntersectNode();
	          newNode.Edge1 = e;
	          newNode.Edge2 = eNext;
	          //newNode.Pt = pt;
	          newNode.Pt.X = pt.X;
	          newNode.Pt.Y = pt.Y;
	          this.m_IntersectList.push(newNode);
	          this.SwapPositionsInSEL(e, eNext);
	          isModified = true;
	        }
	        else
	          e = eNext;
	      }
	      if (e.PrevInSEL !== null)
	        e.PrevInSEL.NextInSEL = null;
	      else
	        break;
	    }
	    this.m_SortedEdges = null;
	  };
	  ClipperLib.Clipper.prototype.EdgesAdjacent = function (inode)
	  {
	    return (inode.Edge1.NextInSEL == inode.Edge2) || (inode.Edge1.PrevInSEL == inode.Edge2);
	  };
	  ClipperLib.Clipper.IntersectNodeSort = function (node1, node2)
	  {
	    //the following typecast is safe because the differences in Pt.Y will
	    //be limited to the height of the scanbeam.
	    return (node2.Pt.Y - node1.Pt.Y);
	  };
	  ClipperLib.Clipper.prototype.FixupIntersectionOrder = function ()
	  {
	    //pre-condition: intersections are sorted bottom-most first.
	    //Now it's crucial that intersections are made only between adjacent edges,
	    //so to ensure this the order of intersections may need adjusting ...
	    this.m_IntersectList.sort(this.m_IntersectNodeComparer);
	    this.CopyAELToSEL();
	    var cnt = this.m_IntersectList.length;
	    for (var i = 0; i < cnt; i++)
	    {
	      if (!this.EdgesAdjacent(this.m_IntersectList[i]))
	      {
	        var j = i + 1;
	        while (j < cnt && !this.EdgesAdjacent(this.m_IntersectList[j]))
	          j++;
	        if (j == cnt)
	          return false;
	        var tmp = this.m_IntersectList[i];
	        this.m_IntersectList[i] = this.m_IntersectList[j];
	        this.m_IntersectList[j] = tmp;
	      }
	      this.SwapPositionsInSEL(this.m_IntersectList[i].Edge1, this.m_IntersectList[i].Edge2);
	    }
	    return true;
	  };
	  ClipperLib.Clipper.prototype.ProcessIntersectList = function ()
	  {
	    for (var i = 0, ilen = this.m_IntersectList.length; i < ilen; i++)
	    {
	      var iNode = this.m_IntersectList[i];
	      this.IntersectEdges(iNode.Edge1, iNode.Edge2, iNode.Pt);
	      this.SwapPositionsInAEL(iNode.Edge1, iNode.Edge2);
	    }
	    this.m_IntersectList.length = 0;
	  };
	  /*
	  --------------------------------
	  Round speedtest: http://jsperf.com/fastest-round
	  --------------------------------
	  */
	  var R1 = function (a)
	  {
	    return a < 0 ? Math.ceil(a - 0.5) : Math.round(a)
	  };
	  var R2 = function (a)
	  {
	    return a < 0 ? Math.ceil(a - 0.5) : Math.floor(a + 0.5)
	  };
	  var R3 = function (a)
	  {
	    return a < 0 ? -Math.round(Math.abs(a)) : Math.round(a)
	  };
	  var R4 = function (a)
	  {
	    if (a < 0)
	    {
	      a -= 0.5;
	      return a < -2147483648 ? Math.ceil(a) : a | 0;
	    }
	    else
	    {
	      a += 0.5;
	      return a > 2147483647 ? Math.floor(a) : a | 0;
	    }
	  };
	  if (browser.msie) ClipperLib.Clipper.Round = R1;
	  else if (browser.chromium) ClipperLib.Clipper.Round = R3;
	  else if (browser.safari) ClipperLib.Clipper.Round = R4;
	  else ClipperLib.Clipper.Round = R2; // eg. browser.chrome || browser.firefox || browser.opera
	  ClipperLib.Clipper.TopX = function (edge, currentY)
	  {
	    //if (edge.Bot == edge.Curr) alert ("edge.Bot = edge.Curr");
	    //if (edge.Bot == edge.Top) alert ("edge.Bot = edge.Top");
	    if (currentY == edge.Top.Y)
	      return edge.Top.X;
	    return edge.Bot.X + ClipperLib.Clipper.Round(edge.Dx * (currentY - edge.Bot.Y));
	  };
	  ClipperLib.Clipper.prototype.IntersectPoint = function (edge1, edge2, ip)
	  {
	    ip.X = 0;
	    ip.Y = 0;
	    var b1, b2;
	    //nb: with very large coordinate values, it's possible for SlopesEqual() to
	    //return false but for the edge.Dx value be equal due to double precision rounding.
	    if (edge1.Dx == edge2.Dx)
			{
				ip.Y = edge1.Curr.Y;
				ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
				return;
	    }
	    if (edge1.Delta.X === 0)
	    {
	      ip.X = edge1.Bot.X;
	      if (ClipperLib.ClipperBase.IsHorizontal(edge2))
	      {
	        ip.Y = edge2.Bot.Y;
	      }
	      else
	      {
	        b2 = edge2.Bot.Y - (edge2.Bot.X / edge2.Dx);
	        ip.Y = ClipperLib.Clipper.Round(ip.X / edge2.Dx + b2);
	      }
	    }
	    else if (edge2.Delta.X === 0)
	    {
	      ip.X = edge2.Bot.X;
	      if (ClipperLib.ClipperBase.IsHorizontal(edge1))
	      {
	        ip.Y = edge1.Bot.Y;
	      }
	      else
	      {
	        b1 = edge1.Bot.Y - (edge1.Bot.X / edge1.Dx);
	        ip.Y = ClipperLib.Clipper.Round(ip.X / edge1.Dx + b1);
	      }
	    }
	    else
	    {
	      b1 = edge1.Bot.X - edge1.Bot.Y * edge1.Dx;
	      b2 = edge2.Bot.X - edge2.Bot.Y * edge2.Dx;
	      var q = (b2 - b1) / (edge1.Dx - edge2.Dx);
	      ip.Y = ClipperLib.Clipper.Round(q);
	      if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
	        ip.X = ClipperLib.Clipper.Round(edge1.Dx * q + b1);
	      else
	        ip.X = ClipperLib.Clipper.Round(edge2.Dx * q + b2);
	    }
	    if (ip.Y < edge1.Top.Y || ip.Y < edge2.Top.Y)
	    {
	      if (edge1.Top.Y > edge2.Top.Y)
	      {
	        ip.Y = edge1.Top.Y;
	        ip.X = ClipperLib.Clipper.TopX(edge2, edge1.Top.Y);
	        return ip.X < edge1.Top.X;
	      }
	      else
	        ip.Y = edge2.Top.Y;
	      if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
	        ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
	      else
	        ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
	    }
			//finally, don't allow 'ip' to be BELOW curr.Y (ie bottom of scanbeam) ...
			if (ip.Y > edge1.Curr.Y)
			{
				ip.Y = edge1.Curr.Y;
				//better to use the more vertical edge to derive X ...
				if (Math.abs(edge1.Dx) > Math.abs(edge2.Dx))
					ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
				else
					ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
			}
	  };
	
	  ClipperLib.Clipper.prototype.ProcessEdgesAtTopOfScanbeam = function (topY)
	  {
	    var e = this.m_ActiveEdges;
	    while (e !== null)
	    {
	      //1. process maxima, treating them as if they're 'bent' horizontal edges,
	      //   but exclude maxima with horizontal edges. nb: e can't be a horizontal.
	      var IsMaximaEdge = this.IsMaxima(e, topY);
	      if (IsMaximaEdge)
	      {
	        var eMaxPair = this.GetMaximaPair(e);
	        IsMaximaEdge = (eMaxPair === null || !ClipperLib.ClipperBase.IsHorizontal(eMaxPair));
	      }
	      if (IsMaximaEdge)
	      {
	        var ePrev = e.PrevInAEL;
	        this.DoMaxima(e);
	        if (ePrev === null)
	          e = this.m_ActiveEdges;
	        else
	          e = ePrev.NextInAEL;
	      }
	      else
	      {
	        //2. promote horizontal edges, otherwise update Curr.X and Curr.Y ...
	        if (this.IsIntermediate(e, topY) && ClipperLib.ClipperBase.IsHorizontal(e.NextInLML))
	        {
	          e = this.UpdateEdgeIntoAEL(e);
	          if (e.OutIdx >= 0)
	            this.AddOutPt(e, e.Bot);
	          this.AddEdgeToSEL(e);
	        }
	        else
	        {
	          e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
	          e.Curr.Y = topY;
	        }
	        if (this.StrictlySimple)
	        {
	          var ePrev = e.PrevInAEL;
	          if ((e.OutIdx >= 0) && (e.WindDelta !== 0) && ePrev !== null &&
	            (ePrev.OutIdx >= 0) && (ePrev.Curr.X == e.Curr.X) &&
	            (ePrev.WindDelta !== 0))
	          {
	           	var ip = new ClipperLib.IntPoint(e.Curr);
	
							if(use_xyz)
							{
								this.SetZ(ip, ePrev, e);
							}
	
	            var op = this.AddOutPt(ePrev, ip);
	            var op2 = this.AddOutPt(e, ip);
	            this.AddJoin(op, op2, ip);
	            //StrictlySimple (type-3) join
	          }
	        }
	        e = e.NextInAEL;
	      }
	    }
	    //3. Process horizontals at the Top of the scanbeam ...
	    this.ProcessHorizontals(true);
	    //4. Promote intermediate vertices ...
	    e = this.m_ActiveEdges;
	    while (e !== null)
	    {
	      if (this.IsIntermediate(e, topY))
	      {
	        var op = null;
	        if (e.OutIdx >= 0)
	          op = this.AddOutPt(e, e.Top);
	        e = this.UpdateEdgeIntoAEL(e);
	        //if output polygons share an edge, they'll need joining later ...
	        var ePrev = e.PrevInAEL;
	        var eNext = e.NextInAEL;
	        if (ePrev !== null && ePrev.Curr.X == e.Bot.X &&
	          ePrev.Curr.Y == e.Bot.Y && op !== null &&
	          ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y &&
	          ClipperLib.ClipperBase.SlopesEqual(e, ePrev, this.m_UseFullRange) &&
	          (e.WindDelta !== 0) && (ePrev.WindDelta !== 0))
	        {
	          var op2 = this.AddOutPt(ePrev, e.Bot);
	          this.AddJoin(op, op2, e.Top);
	        }
	        else if (eNext !== null && eNext.Curr.X == e.Bot.X &&
	          eNext.Curr.Y == e.Bot.Y && op !== null &&
	          eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y &&
	          ClipperLib.ClipperBase.SlopesEqual(e, eNext, this.m_UseFullRange) &&
	          (e.WindDelta !== 0) && (eNext.WindDelta !== 0))
	        {
	          var op2 = this.AddOutPt(eNext, e.Bot);
	          this.AddJoin(op, op2, e.Top);
	        }
	      }
	      e = e.NextInAEL;
	    }
	  };
	  ClipperLib.Clipper.prototype.DoMaxima = function (e)
	  {
	    var eMaxPair = this.GetMaximaPair(e);
	    if (eMaxPair === null)
	    {
	      if (e.OutIdx >= 0)
	        this.AddOutPt(e, e.Top);
	      this.DeleteFromAEL(e);
	      return;
	    }
	    var eNext = e.NextInAEL;
	    var use_lines = true;
	    while (eNext !== null && eNext != eMaxPair)
	    {
	      this.IntersectEdges(e, eNext, e.Top);
	      this.SwapPositionsInAEL(e, eNext);
	      eNext = e.NextInAEL;
	    }
	    if (e.OutIdx == -1 && eMaxPair.OutIdx == -1)
	    {
	      this.DeleteFromAEL(e);
	      this.DeleteFromAEL(eMaxPair);
	    }
	    else if (e.OutIdx >= 0 && eMaxPair.OutIdx >= 0)
	    {
	    	if (e.OutIdx >= 0) this.AddLocalMaxPoly(e, eMaxPair, e.Top);
	      this.DeleteFromAEL(e);
	      this.DeleteFromAEL(eMaxPair);
	    }
	    else if (use_lines && e.WindDelta === 0)
	    {
	      if (e.OutIdx >= 0)
	      {
	        this.AddOutPt(e, e.Top);
	        e.OutIdx = -1;
	      }
	      this.DeleteFromAEL(e);
	      if (eMaxPair.OutIdx >= 0)
	      {
	        this.AddOutPt(eMaxPair, e.Top);
	        eMaxPair.OutIdx = -1;
	      }
	      this.DeleteFromAEL(eMaxPair);
	    }
	    else
	      ClipperLib.Error("DoMaxima error");
	  };
	  ClipperLib.Clipper.ReversePaths = function (polys)
	  {
	    for (var i = 0, len = polys.length; i < len; i++)
	      polys[i].reverse();
	  };
	  ClipperLib.Clipper.Orientation = function (poly)
	  {
	    return ClipperLib.Clipper.Area(poly) >= 0;
	  };
	  ClipperLib.Clipper.prototype.PointCount = function (pts)
	  {
	    if (pts === null)
	      return 0;
	    var result = 0;
	    var p = pts;
	    do {
	      result++;
	      p = p.Next;
	    }
	    while (p != pts)
	    return result;
	  };
	  ClipperLib.Clipper.prototype.BuildResult = function (polyg)
	  {
	    ClipperLib.Clear(polyg);
	    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
	    {
	      var outRec = this.m_PolyOuts[i];
	      if (outRec.Pts === null)
	        continue;
	      var p = outRec.Pts.Prev;
	      var cnt = this.PointCount(p);
	      if (cnt < 2)
	        continue;
	      var pg = new Array(cnt);
	      for (var j = 0; j < cnt; j++)
	      {
	        pg[j] = p.Pt;
	        p = p.Prev;
	      }
	      polyg.push(pg);
	    }
	  };
	  ClipperLib.Clipper.prototype.BuildResult2 = function (polytree)
	  {
	    polytree.Clear();
	    //add each output polygon/contour to polytree ...
	    //polytree.m_AllPolys.set_Capacity(this.m_PolyOuts.length);
	    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
	    {
	      var outRec = this.m_PolyOuts[i];
	      var cnt = this.PointCount(outRec.Pts);
	      if ((outRec.IsOpen && cnt < 2) || (!outRec.IsOpen && cnt < 3))
	        continue;
	      this.FixHoleLinkage(outRec);
	      var pn = new ClipperLib.PolyNode();
	      polytree.m_AllPolys.push(pn);
	      outRec.PolyNode = pn;
	      pn.m_polygon.length = cnt;
	      var op = outRec.Pts.Prev;
	      for (var j = 0; j < cnt; j++)
	      {
	        pn.m_polygon[j] = op.Pt;
	        op = op.Prev;
	      }
	    }
	    //fixup PolyNode links etc ...
	    //polytree.m_Childs.set_Capacity(this.m_PolyOuts.length);
	    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
	    {
	      var outRec = this.m_PolyOuts[i];
	      if (outRec.PolyNode === null)
	        continue;
	      else if (outRec.IsOpen)
	      {
	        outRec.PolyNode.IsOpen = true;
	        polytree.AddChild(outRec.PolyNode);
	      }
	      else if (outRec.FirstLeft !== null && outRec.FirstLeft.PolyNode != null)
	        outRec.FirstLeft.PolyNode.AddChild(outRec.PolyNode);
	      else
	        polytree.AddChild(outRec.PolyNode);
	    }
	  };
	  ClipperLib.Clipper.prototype.FixupOutPolygon = function (outRec)
	  {
	    //FixupOutPolygon() - removes duplicate points and simplifies consecutive
	    //parallel edges by removing the middle vertex.
	    var lastOK = null;
	    outRec.BottomPt = null;
	    var pp = outRec.Pts;
	    for (;;)
	    {
	      if (pp.Prev == pp || pp.Prev == pp.Next)
	      {
	        outRec.Pts = null;
	        return;
	      }
	      //test for duplicate points and collinear edges ...
	      if ((ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Next.Pt)) || (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt)) ||
	        (ClipperLib.ClipperBase.SlopesEqual(pp.Prev.Pt, pp.Pt, pp.Next.Pt, this.m_UseFullRange) &&
	          (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(pp.Prev.Pt, pp.Pt, pp.Next.Pt))))
	      {
	        lastOK = null;
	        pp.Prev.Next = pp.Next;
	        pp.Next.Prev = pp.Prev;
	        pp = pp.Prev;
	      }
	      else if (pp == lastOK)
	        break;
	      else
	      {
	        if (lastOK === null)
	          lastOK = pp;
	        pp = pp.Next;
	      }
	    }
	    outRec.Pts = pp;
	  };
	  ClipperLib.Clipper.prototype.DupOutPt = function (outPt, InsertAfter)
	  {
	    var result = new ClipperLib.OutPt();
	    //result.Pt = outPt.Pt;
	    result.Pt.X = outPt.Pt.X;
	    result.Pt.Y = outPt.Pt.Y;
	    result.Idx = outPt.Idx;
	    if (InsertAfter)
	    {
	      result.Next = outPt.Next;
	      result.Prev = outPt;
	      outPt.Next.Prev = result;
	      outPt.Next = result;
	    }
	    else
	    {
	      result.Prev = outPt.Prev;
	      result.Next = outPt;
	      outPt.Prev.Next = result;
	      outPt.Prev = result;
	    }
	    return result;
	  };
	  ClipperLib.Clipper.prototype.GetOverlap = function (a1, a2, b1, b2, $val)
	  {
	    if (a1 < a2)
	    {
	      if (b1 < b2)
	      {
	        $val.Left = Math.max(a1, b1);
	        $val.Right = Math.min(a2, b2);
	      }
	      else
	      {
	        $val.Left = Math.max(a1, b2);
	        $val.Right = Math.min(a2, b1);
	      }
	    }
	    else
	    {
	      if (b1 < b2)
	      {
	        $val.Left = Math.max(a2, b1);
	        $val.Right = Math.min(a1, b2);
	      }
	      else
	      {
	        $val.Left = Math.max(a2, b2);
	        $val.Right = Math.min(a1, b1);
	      }
	    }
	    return $val.Left < $val.Right;
	  };
	  ClipperLib.Clipper.prototype.JoinHorz = function (op1, op1b, op2, op2b, Pt, DiscardLeft)
	  {
	    var Dir1 = (op1.Pt.X > op1b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight);
	    var Dir2 = (op2.Pt.X > op2b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight);
	    if (Dir1 == Dir2)
	      return false;
	    //When DiscardLeft, we want Op1b to be on the Left of Op1, otherwise we
	    //want Op1b to be on the Right. (And likewise with Op2 and Op2b.)
	    //So, to facilitate this while inserting Op1b and Op2b ...
	    //when DiscardLeft, make sure we're AT or RIGHT of Pt before adding Op1b,
	    //otherwise make sure we're AT or LEFT of Pt. (Likewise with Op2b.)
	    if (Dir1 == ClipperLib.Direction.dLeftToRight)
	    {
	      while (op1.Next.Pt.X <= Pt.X &&
	        op1.Next.Pt.X >= op1.Pt.X && op1.Next.Pt.Y == Pt.Y)
	        op1 = op1.Next;
	      if (DiscardLeft && (op1.Pt.X != Pt.X))
	        op1 = op1.Next;
	      op1b = this.DupOutPt(op1, !DiscardLeft);
	      if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt))
	      {
	        op1 = op1b;
	        //op1.Pt = Pt;
	        op1.Pt.X = Pt.X;
	        op1.Pt.Y = Pt.Y;
	        op1b = this.DupOutPt(op1, !DiscardLeft);
	      }
	    }
	    else
	    {
	      while (op1.Next.Pt.X >= Pt.X &&
	        op1.Next.Pt.X <= op1.Pt.X && op1.Next.Pt.Y == Pt.Y)
	        op1 = op1.Next;
	      if (!DiscardLeft && (op1.Pt.X != Pt.X))
	        op1 = op1.Next;
	      op1b = this.DupOutPt(op1, DiscardLeft);
	      if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt))
	      {
	        op1 = op1b;
	        //op1.Pt = Pt;
	        op1.Pt.X = Pt.X;
	        op1.Pt.Y = Pt.Y;
	        op1b = this.DupOutPt(op1, DiscardLeft);
	      }
	    }
	    if (Dir2 == ClipperLib.Direction.dLeftToRight)
	    {
	      while (op2.Next.Pt.X <= Pt.X &&
	        op2.Next.Pt.X >= op2.Pt.X && op2.Next.Pt.Y == Pt.Y)
	        op2 = op2.Next;
	      if (DiscardLeft && (op2.Pt.X != Pt.X))
	        op2 = op2.Next;
	      op2b = this.DupOutPt(op2, !DiscardLeft);
	      if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt))
	      {
	        op2 = op2b;
	        //op2.Pt = Pt;
	        op2.Pt.X = Pt.X;
	        op2.Pt.Y = Pt.Y;
	        op2b = this.DupOutPt(op2, !DiscardLeft);
	      }
	    }
	    else
	    {
	      while (op2.Next.Pt.X >= Pt.X &&
	        op2.Next.Pt.X <= op2.Pt.X && op2.Next.Pt.Y == Pt.Y)
	        op2 = op2.Next;
	      if (!DiscardLeft && (op2.Pt.X != Pt.X))
	        op2 = op2.Next;
	      op2b = this.DupOutPt(op2, DiscardLeft);
	      if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt))
	      {
	        op2 = op2b;
	        //op2.Pt = Pt;
	        op2.Pt.X = Pt.X;
	        op2.Pt.Y = Pt.Y;
	        op2b = this.DupOutPt(op2, DiscardLeft);
	      }
	    }
	    if ((Dir1 == ClipperLib.Direction.dLeftToRight) == DiscardLeft)
	    {
	      op1.Prev = op2;
	      op2.Next = op1;
	      op1b.Next = op2b;
	      op2b.Prev = op1b;
	    }
	    else
	    {
	      op1.Next = op2;
	      op2.Prev = op1;
	      op1b.Prev = op2b;
	      op2b.Next = op1b;
	    }
	    return true;
	  };
	  ClipperLib.Clipper.prototype.JoinPoints = function (j, outRec1, outRec2)
	  {
	    var op1 = j.OutPt1,
	      op1b = new ClipperLib.OutPt();
	    var op2 = j.OutPt2,
	      op2b = new ClipperLib.OutPt();
	    //There are 3 kinds of joins for output polygons ...
	    //1. Horizontal joins where Join.OutPt1 & Join.OutPt2 are a vertices anywhere
	    //along (horizontal) collinear edges (& Join.OffPt is on the same horizontal).
	    //2. Non-horizontal joins where Join.OutPt1 & Join.OutPt2 are at the same
	    //location at the Bottom of the overlapping segment (& Join.OffPt is above).
	    //3. StrictlySimple joins where edges touch but are not collinear and where
	    //Join.OutPt1, Join.OutPt2 & Join.OffPt all share the same point.
	    var isHorizontal = (j.OutPt1.Pt.Y == j.OffPt.Y);
	    if (isHorizontal && (ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt1.Pt)) && (ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt2.Pt)))
	    {
	      //Strictly Simple join ...
				if (outRec1 != outRec2) return false;
	
	      op1b = j.OutPt1.Next;
	      while (op1b != op1 && (ClipperLib.IntPoint.op_Equality(op1b.Pt, j.OffPt)))
	        op1b = op1b.Next;
	      var reverse1 = (op1b.Pt.Y > j.OffPt.Y);
	      op2b = j.OutPt2.Next;
	      while (op2b != op2 && (ClipperLib.IntPoint.op_Equality(op2b.Pt, j.OffPt)))
	        op2b = op2b.Next;
	      var reverse2 = (op2b.Pt.Y > j.OffPt.Y);
	      if (reverse1 == reverse2)
	        return false;
	      if (reverse1)
	      {
	        op1b = this.DupOutPt(op1, false);
	        op2b = this.DupOutPt(op2, true);
	        op1.Prev = op2;
	        op2.Next = op1;
	        op1b.Next = op2b;
	        op2b.Prev = op1b;
	        j.OutPt1 = op1;
	        j.OutPt2 = op1b;
	        return true;
	      }
	      else
	      {
	        op1b = this.DupOutPt(op1, true);
	        op2b = this.DupOutPt(op2, false);
	        op1.Next = op2;
	        op2.Prev = op1;
	        op1b.Prev = op2b;
	        op2b.Next = op1b;
	        j.OutPt1 = op1;
	        j.OutPt2 = op1b;
	        return true;
	      }
	    }
	    else if (isHorizontal)
	    {
	      //treat horizontal joins differently to non-horizontal joins since with
	      //them we're not yet sure where the overlapping is. OutPt1.Pt & OutPt2.Pt
	      //may be anywhere along the horizontal edge.
	      op1b = op1;
	      while (op1.Prev.Pt.Y == op1.Pt.Y && op1.Prev != op1b && op1.Prev != op2)
	        op1 = op1.Prev;
	      while (op1b.Next.Pt.Y == op1b.Pt.Y && op1b.Next != op1 && op1b.Next != op2)
	        op1b = op1b.Next;
	      if (op1b.Next == op1 || op1b.Next == op2)
	        return false;
	      //a flat 'polygon'
	      op2b = op2;
	      while (op2.Prev.Pt.Y == op2.Pt.Y && op2.Prev != op2b && op2.Prev != op1b)
	        op2 = op2.Prev;
	      while (op2b.Next.Pt.Y == op2b.Pt.Y && op2b.Next != op2 && op2b.Next != op1)
	        op2b = op2b.Next;
	      if (op2b.Next == op2 || op2b.Next == op1)
	        return false;
	      //a flat 'polygon'
	      //Op1 -. Op1b & Op2 -. Op2b are the extremites of the horizontal edges
	
	      var $val = {Left: null, Right: null};
	      if (!this.GetOverlap(op1.Pt.X, op1b.Pt.X, op2.Pt.X, op2b.Pt.X, $val))
	        return false;
	      var Left = $val.Left;
	      var Right = $val.Right;
	
	      //DiscardLeftSide: when overlapping edges are joined, a spike will created
	      //which needs to be cleaned up. However, we don't want Op1 or Op2 caught up
	      //on the discard Side as either may still be needed for other joins ...
	      var Pt = new ClipperLib.IntPoint();
	      var DiscardLeftSide;
	      if (op1.Pt.X >= Left && op1.Pt.X <= Right)
	      {
	        //Pt = op1.Pt;
	        Pt.X = op1.Pt.X;
	        Pt.Y = op1.Pt.Y;
	        DiscardLeftSide = (op1.Pt.X > op1b.Pt.X);
	      }
	      else if (op2.Pt.X >= Left && op2.Pt.X <= Right)
	      {
	        //Pt = op2.Pt;
	        Pt.X = op2.Pt.X;
	        Pt.Y = op2.Pt.Y;
	        DiscardLeftSide = (op2.Pt.X > op2b.Pt.X);
	      }
	      else if (op1b.Pt.X >= Left && op1b.Pt.X <= Right)
	      {
	        //Pt = op1b.Pt;
	        Pt.X = op1b.Pt.X;
	        Pt.Y = op1b.Pt.Y;
	        DiscardLeftSide = op1b.Pt.X > op1.Pt.X;
	      }
	      else
	      {
	        //Pt = op2b.Pt;
	        Pt.X = op2b.Pt.X;
	        Pt.Y = op2b.Pt.Y;
	        DiscardLeftSide = (op2b.Pt.X > op2.Pt.X);
	      }
	      j.OutPt1 = op1;
	      j.OutPt2 = op2;
	      return this.JoinHorz(op1, op1b, op2, op2b, Pt, DiscardLeftSide);
	    }
	    else
	    {
	      //nb: For non-horizontal joins ...
	      //    1. Jr.OutPt1.Pt.Y == Jr.OutPt2.Pt.Y
	      //    2. Jr.OutPt1.Pt > Jr.OffPt.Y
	      //make sure the polygons are correctly oriented ...
	      op1b = op1.Next;
	      while ((ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt)) && (op1b != op1))
	        op1b = op1b.Next;
	      var Reverse1 = ((op1b.Pt.Y > op1.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange));
	      if (Reverse1)
	      {
	        op1b = op1.Prev;
	        while ((ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt)) && (op1b != op1))
	          op1b = op1b.Prev;
	        if ((op1b.Pt.Y > op1.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange))
	          return false;
	      }
	      op2b = op2.Next;
	      while ((ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt)) && (op2b != op2))
	        op2b = op2b.Next;
	      var Reverse2 = ((op2b.Pt.Y > op2.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange));
	      if (Reverse2)
	      {
	        op2b = op2.Prev;
	        while ((ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt)) && (op2b != op2))
	          op2b = op2b.Prev;
	        if ((op2b.Pt.Y > op2.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange))
	          return false;
	      }
	      if ((op1b == op1) || (op2b == op2) || (op1b == op2b) ||
	        ((outRec1 == outRec2) && (Reverse1 == Reverse2)))
	        return false;
	      if (Reverse1)
	      {
	        op1b = this.DupOutPt(op1, false);
	        op2b = this.DupOutPt(op2, true);
	        op1.Prev = op2;
	        op2.Next = op1;
	        op1b.Next = op2b;
	        op2b.Prev = op1b;
	        j.OutPt1 = op1;
	        j.OutPt2 = op1b;
	        return true;
	      }
	      else
	      {
	        op1b = this.DupOutPt(op1, true);
	        op2b = this.DupOutPt(op2, false);
	        op1.Next = op2;
	        op2.Prev = op1;
	        op1b.Prev = op2b;
	        op2b.Next = op1b;
	        j.OutPt1 = op1;
	        j.OutPt2 = op1b;
	        return true;
	      }
	    }
	  };
	  ClipperLib.Clipper.GetBounds = function (paths)
	  {
	    var i = 0,
	      cnt = paths.length;
	    while (i < cnt && paths[i].length == 0) i++;
	    if (i == cnt) return new ClipperLib.IntRect(0, 0, 0, 0);
	    var result = new ClipperLib.IntRect();
	    result.left = paths[i][0].X;
	    result.right = result.left;
	    result.top = paths[i][0].Y;
	    result.bottom = result.top;
	    for (; i < cnt; i++)
	      for (var j = 0, jlen = paths[i].length; j < jlen; j++)
	      {
	        if (paths[i][j].X < result.left) result.left = paths[i][j].X;
	        else if (paths[i][j].X > result.right) result.right = paths[i][j].X;
	        if (paths[i][j].Y < result.top) result.top = paths[i][j].Y;
	        else if (paths[i][j].Y > result.bottom) result.bottom = paths[i][j].Y;
	      }
	    return result;
	  }
	  ClipperLib.Clipper.prototype.GetBounds2 = function (ops)
	  {
	    var opStart = ops;
	    var result = new ClipperLib.IntRect();
	    result.left = ops.Pt.X;
	    result.right = ops.Pt.X;
	    result.top = ops.Pt.Y;
	    result.bottom = ops.Pt.Y;
	    ops = ops.Next;
	    while (ops != opStart)
	    {
	      if (ops.Pt.X < result.left)
	        result.left = ops.Pt.X;
	      if (ops.Pt.X > result.right)
	        result.right = ops.Pt.X;
	      if (ops.Pt.Y < result.top)
	        result.top = ops.Pt.Y;
	      if (ops.Pt.Y > result.bottom)
	        result.bottom = ops.Pt.Y;
	      ops = ops.Next;
	    }
	    return result;
	  };
	
	  ClipperLib.Clipper.PointInPolygon = function (pt, path)
	  {
	    //returns 0 if false, +1 if true, -1 if pt ON polygon boundary
			//See "The Point in Polygon Problem for Arbitrary Polygons" by Hormann & Agathos
	    //http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.88.5498&rep=rep1&type=pdf
	    var result = 0,
	      cnt = path.length;
	    if (cnt < 3)
	      return 0;
	    var ip = path[0];
	    for (var i = 1; i <= cnt; ++i)
	    {
	      var ipNext = (i == cnt ? path[0] : path[i]);
	      if (ipNext.Y == pt.Y)
	      {
	        if ((ipNext.X == pt.X) || (ip.Y == pt.Y && ((ipNext.X > pt.X) == (ip.X < pt.X))))
	          return -1;
	      }
	      if ((ip.Y < pt.Y) != (ipNext.Y < pt.Y))
	      {
	        if (ip.X >= pt.X)
	        {
	          if (ipNext.X > pt.X)
	            result = 1 - result;
	          else
	          {
	            var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
	            if (d == 0)
	              return -1;
	            else if ((d > 0) == (ipNext.Y > ip.Y))
	              result = 1 - result;
	          }
	        }
	        else
	        {
	          if (ipNext.X > pt.X)
	          {
	            var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
	            if (d == 0)
	              return -1;
	            else if ((d > 0) == (ipNext.Y > ip.Y))
	              result = 1 - result;
	          }
	        }
	      }
	      ip = ipNext;
	    }
	    return result;
	  };
	
	  ClipperLib.Clipper.prototype.PointInPolygon = function (pt, op)
	  {
	    //returns 0 if false, +1 if true, -1 if pt ON polygon boundary
			//See "The Point in Polygon Problem for Arbitrary Polygons" by Hormann & Agathos
	    //http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.88.5498&rep=rep1&type=pdf
	    var result = 0;
	    var startOp = op;
			var ptx = pt.X, pty = pt.Y;
	    var poly0x = op.Pt.X, poly0y = op.Pt.Y;
	    do
	    {
				op = op.Next;
				var poly1x = op.Pt.X, poly1y = op.Pt.Y;
	      if (poly1y == pty)
	      {
	        if ((poly1x == ptx) || (poly0y == pty && ((poly1x > ptx) == (poly0x < ptx))))
	          return -1;
	      }
	      if ((poly0y < pty) != (poly1y < pty))
	      {
	        if (poly0x >= ptx)
	        {
	          if (poly1x > ptx)
	            result = 1 - result;
	          else
	          {
	            var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
	            if (d == 0)
	              return -1;
	            if ((d > 0) == (poly1y > poly0y))
	              result = 1 - result;
	          }
	        }
	        else
	        {
	          if (poly1x > ptx)
	          {
	            var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
	            if (d == 0)
	              return -1;
	            if ((d > 0) == (poly1y > poly0y))
	              result = 1 - result;
	          }
	        }
	      }
	      poly0x = poly1x;
	      poly0y = poly1y;
	    } while (startOp != op);
	
	    return result;
	  };
	
	  ClipperLib.Clipper.prototype.Poly2ContainsPoly1 = function (outPt1, outPt2)
	  {
	    var op = outPt1;
	    do
	    {
				//nb: PointInPolygon returns 0 if false, +1 if true, -1 if pt on polygon
	      var res = this.PointInPolygon(op.Pt, outPt2);
	      if (res >= 0)
	        return res > 0;
	      op = op.Next;
	    }
	    while (op != outPt1)
	    return true;
	  };
	  ClipperLib.Clipper.prototype.FixupFirstLefts1 = function (OldOutRec, NewOutRec)
	  {
	    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
	    {
				var outRec = this.m_PolyOuts[i];
				if (outRec.Pts == null || outRec.FirstLeft == null)
					continue;
				var firstLeft = this.ParseFirstLeft(outRec.FirstLeft);
				if (firstLeft == OldOutRec)
				{
	        if (this.Poly2ContainsPoly1(outRec.Pts, NewOutRec.Pts))
	          outRec.FirstLeft = NewOutRec;
	      }
	    }
	  };
	  ClipperLib.Clipper.prototype.FixupFirstLefts2 = function (OldOutRec, NewOutRec)
	  {
	    for (var $i2 = 0, $t2 = this.m_PolyOuts, $l2 = $t2.length, outRec = $t2[$i2]; $i2 < $l2; $i2++, outRec = $t2[$i2])
	      if (outRec.FirstLeft == OldOutRec)
	        outRec.FirstLeft = NewOutRec;
	  };
	  ClipperLib.Clipper.ParseFirstLeft = function (FirstLeft)
	  {
	    while (FirstLeft != null && FirstLeft.Pts == null)
	      FirstLeft = FirstLeft.FirstLeft;
	    return FirstLeft;
	  };
	  ClipperLib.Clipper.prototype.JoinCommonEdges = function ()
	  {
	    for (var i = 0, ilen = this.m_Joins.length; i < ilen; i++)
	    {
	      var join = this.m_Joins[i];
	      var outRec1 = this.GetOutRec(join.OutPt1.Idx);
	      var outRec2 = this.GetOutRec(join.OutPt2.Idx);
	      if (outRec1.Pts == null || outRec2.Pts == null)
	        continue;
	      //get the polygon fragment with the correct hole state (FirstLeft)
	      //before calling JoinPoints() ...
	      var holeStateRec;
	      if (outRec1 == outRec2)
	        holeStateRec = outRec1;
	      else if (this.Param1RightOfParam2(outRec1, outRec2))
	        holeStateRec = outRec2;
	      else if (this.Param1RightOfParam2(outRec2, outRec1))
	        holeStateRec = outRec1;
	      else
	        holeStateRec = this.GetLowermostRec(outRec1, outRec2);
	
	      if (!this.JoinPoints(join, outRec1, outRec2)) continue;
	
	      if (outRec1 == outRec2)
	      {
	        //instead of joining two polygons, we've just created a new one by
	        //splitting one polygon into two.
	        outRec1.Pts = join.OutPt1;
	        outRec1.BottomPt = null;
	        outRec2 = this.CreateOutRec();
	        outRec2.Pts = join.OutPt2;
	        //update all OutRec2.Pts Idx's ...
	        this.UpdateOutPtIdxs(outRec2);
	        //We now need to check every OutRec.FirstLeft pointer. If it points
	        //to OutRec1 it may need to point to OutRec2 instead ...
	        if (this.m_UsingPolyTree)
	          for (var j = 0, jlen = this.m_PolyOuts.length; j < jlen - 1; j++)
	          {
	            var oRec = this.m_PolyOuts[j];
	            if (oRec.Pts == null || ClipperLib.Clipper.ParseFirstLeft(oRec.FirstLeft) != outRec1 || oRec.IsHole == outRec1.IsHole)
	              continue;
	            if (this.Poly2ContainsPoly1(oRec.Pts, join.OutPt2))
	              oRec.FirstLeft = outRec2;
	          }
	        if (this.Poly2ContainsPoly1(outRec2.Pts, outRec1.Pts))
	        {
	          //outRec2 is contained by outRec1 ...
	          outRec2.IsHole = !outRec1.IsHole;
	          outRec2.FirstLeft = outRec1;
	          //fixup FirstLeft pointers that may need reassigning to OutRec1
	          if (this.m_UsingPolyTree)
	            this.FixupFirstLefts2(outRec2, outRec1);
	          if ((outRec2.IsHole ^ this.ReverseSolution) == (this.Area(outRec2) > 0))
	            this.ReversePolyPtLinks(outRec2.Pts);
	        }
	        else if (this.Poly2ContainsPoly1(outRec1.Pts, outRec2.Pts))
	        {
	          //outRec1 is contained by outRec2 ...
	          outRec2.IsHole = outRec1.IsHole;
	          outRec1.IsHole = !outRec2.IsHole;
	          outRec2.FirstLeft = outRec1.FirstLeft;
	          outRec1.FirstLeft = outRec2;
	          //fixup FirstLeft pointers that may need reassigning to OutRec1
	          if (this.m_UsingPolyTree)
	            this.FixupFirstLefts2(outRec1, outRec2);
	          if ((outRec1.IsHole ^ this.ReverseSolution) == (this.Area(outRec1) > 0))
	            this.ReversePolyPtLinks(outRec1.Pts);
	        }
	        else
	        {
	          //the 2 polygons are completely separate ...
	          outRec2.IsHole = outRec1.IsHole;
	          outRec2.FirstLeft = outRec1.FirstLeft;
	          //fixup FirstLeft pointers that may need reassigning to OutRec2
	          if (this.m_UsingPolyTree)
	            this.FixupFirstLefts1(outRec1, outRec2);
	        }
	      }
	      else
	      {
	        //joined 2 polygons together ...
	        outRec2.Pts = null;
	        outRec2.BottomPt = null;
	        outRec2.Idx = outRec1.Idx;
	        outRec1.IsHole = holeStateRec.IsHole;
	        if (holeStateRec == outRec2)
	          outRec1.FirstLeft = outRec2.FirstLeft;
	        outRec2.FirstLeft = outRec1;
	        //fixup FirstLeft pointers that may need reassigning to OutRec1
	        if (this.m_UsingPolyTree)
	          this.FixupFirstLefts2(outRec2, outRec1);
	      }
	    }
	  };
	  ClipperLib.Clipper.prototype.UpdateOutPtIdxs = function (outrec)
	  {
	    var op = outrec.Pts;
	    do {
	      op.Idx = outrec.Idx;
	      op = op.Prev;
	    }
	    while (op != outrec.Pts)
	  };
	  ClipperLib.Clipper.prototype.DoSimplePolygons = function ()
	  {
	    var i = 0;
	    while (i < this.m_PolyOuts.length)
	    {
	      var outrec = this.m_PolyOuts[i++];
	      var op = outrec.Pts;
				if (op == null || outrec.IsOpen)
					continue;
	      do //for each Pt in Polygon until duplicate found do ...
	      {
	        var op2 = op.Next;
	        while (op2 != outrec.Pts)
	        {
	          if ((ClipperLib.IntPoint.op_Equality(op.Pt, op2.Pt)) && op2.Next != op && op2.Prev != op)
	          {
	            //split the polygon into two ...
	            var op3 = op.Prev;
	            var op4 = op2.Prev;
	            op.Prev = op4;
	            op4.Next = op;
	            op2.Prev = op3;
	            op3.Next = op2;
	            outrec.Pts = op;
	            var outrec2 = this.CreateOutRec();
	            outrec2.Pts = op2;
	            this.UpdateOutPtIdxs(outrec2);
	            if (this.Poly2ContainsPoly1(outrec2.Pts, outrec.Pts))
	            {
	              //OutRec2 is contained by OutRec1 ...
	              outrec2.IsHole = !outrec.IsHole;
	              outrec2.FirstLeft = outrec;
								if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec2, outrec);
	
	            }
	            else if (this.Poly2ContainsPoly1(outrec.Pts, outrec2.Pts))
	            {
	              //OutRec1 is contained by OutRec2 ...
	              outrec2.IsHole = outrec.IsHole;
	              outrec.IsHole = !outrec2.IsHole;
	              outrec2.FirstLeft = outrec.FirstLeft;
	              outrec.FirstLeft = outrec2;
	              if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec, outrec2);
	            }
	            else
	            {
	              //the 2 polygons are separate ...
	              outrec2.IsHole = outrec.IsHole;
	              outrec2.FirstLeft = outrec.FirstLeft;
								if (this.m_UsingPolyTree) this.FixupFirstLefts1(outrec, outrec2);
	            }
	            op2 = op;
	            //ie get ready for the next iteration
	          }
	          op2 = op2.Next;
	        }
	        op = op.Next;
	      }
	      while (op != outrec.Pts)
	    }
	  };
	  ClipperLib.Clipper.Area = function (poly)
	  {
	    var cnt = poly.length;
	    if (cnt < 3)
	      return 0;
	    var a = 0;
	    for (var i = 0, j = cnt - 1; i < cnt; ++i)
	    {
	      a += (poly[j].X + poly[i].X) * (poly[j].Y - poly[i].Y);
	      j = i;
	    }
	    return -a * 0.5;
	  };
	  ClipperLib.Clipper.prototype.Area = function (outRec)
	  {
	    var op = outRec.Pts;
	    if (op == null)
	      return 0;
	    var a = 0;
	    do {
	      a = a + (op.Prev.Pt.X + op.Pt.X) * (op.Prev.Pt.Y - op.Pt.Y);
	      op = op.Next;
	    }
	    while (op != outRec.Pts)
	    return a * 0.5;
	  };
	  ClipperLib.Clipper.SimplifyPolygon = function (poly, fillType)
	  {
	    var result = new Array();
	    var c = new ClipperLib.Clipper(0);
	    c.StrictlySimple = true;
	    c.AddPath(poly, ClipperLib.PolyType.ptSubject, true);
	    c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
	    return result;
	  };
	  ClipperLib.Clipper.SimplifyPolygons = function (polys, fillType)
	  {
	    if (typeof (fillType) == "undefined") fillType = ClipperLib.PolyFillType.pftEvenOdd;
	    var result = new Array();
	    var c = new ClipperLib.Clipper(0);
	    c.StrictlySimple = true;
	    c.AddPaths(polys, ClipperLib.PolyType.ptSubject, true);
	    c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
	    return result;
	  };
	  ClipperLib.Clipper.DistanceSqrd = function (pt1, pt2)
	  {
	    var dx = (pt1.X - pt2.X);
	    var dy = (pt1.Y - pt2.Y);
	    return (dx * dx + dy * dy);
	  };
	  ClipperLib.Clipper.DistanceFromLineSqrd = function (pt, ln1, ln2)
	  {
	    //The equation of a line in general form (Ax + By + C = 0)
	    //given 2 points (x¹,y¹) & (x²,y²) is ...
	    //(y¹ - y²)x + (x² - x¹)y + (y² - y¹)x¹ - (x² - x¹)y¹ = 0
	    //A = (y¹ - y²); B = (x² - x¹); C = (y² - y¹)x¹ - (x² - x¹)y¹
	    //perpendicular distance of point (x³,y³) = (Ax³ + By³ + C)/Sqrt(A² + B²)
	    //see http://en.wikipedia.org/wiki/Perpendicular_distance
	    var A = ln1.Y - ln2.Y;
	    var B = ln2.X - ln1.X;
	    var C = A * ln1.X + B * ln1.Y;
	    C = A * pt.X + B * pt.Y - C;
	    return (C * C) / (A * A + B * B);
	  };
	
		ClipperLib.Clipper.SlopesNearCollinear = function(pt1, pt2, pt3, distSqrd)
		{
			//this function is more accurate when the point that's GEOMETRICALLY
			//between the other 2 points is the one that's tested for distance.
			//nb: with 'spikes', either pt1 or pt3 is geometrically between the other pts
			if (Math.abs(pt1.X - pt2.X) > Math.abs(pt1.Y - pt2.Y))
			{
			if ((pt1.X > pt2.X) == (pt1.X < pt3.X))
				return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
			else if ((pt2.X > pt1.X) == (pt2.X < pt3.X))
				return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
					else
					return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
			}
			else
			{
			if ((pt1.Y > pt2.Y) == (pt1.Y < pt3.Y))
				return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
			else if ((pt2.Y > pt1.Y) == (pt2.Y < pt3.Y))
				return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
					else
				return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
			}
		}
	
	  ClipperLib.Clipper.PointsAreClose = function (pt1, pt2, distSqrd)
	  {
	    var dx = pt1.X - pt2.X;
	    var dy = pt1.Y - pt2.Y;
	    return ((dx * dx) + (dy * dy) <= distSqrd);
	  };
	  //------------------------------------------------------------------------------
	  ClipperLib.Clipper.ExcludeOp = function (op)
	  {
	    var result = op.Prev;
	    result.Next = op.Next;
	    op.Next.Prev = result;
	    result.Idx = 0;
	    return result;
	  };
	  ClipperLib.Clipper.CleanPolygon = function (path, distance)
	  {
	    if (typeof (distance) == "undefined") distance = 1.415;
	    //distance = proximity in units/pixels below which vertices will be stripped.
	    //Default ~= sqrt(2) so when adjacent vertices or semi-adjacent vertices have
	    //both x & y coords within 1 unit, then the second vertex will be stripped.
	    var cnt = path.length;
	    if (cnt == 0)
	      return new Array();
	    var outPts = new Array(cnt);
	    for (var i = 0; i < cnt; ++i)
	      outPts[i] = new ClipperLib.OutPt();
	    for (var i = 0; i < cnt; ++i)
	    {
	      outPts[i].Pt = path[i];
	      outPts[i].Next = outPts[(i + 1) % cnt];
	      outPts[i].Next.Prev = outPts[i];
	      outPts[i].Idx = 0;
	    }
	    var distSqrd = distance * distance;
	    var op = outPts[0];
	    while (op.Idx == 0 && op.Next != op.Prev)
	    {
	      if (ClipperLib.Clipper.PointsAreClose(op.Pt, op.Prev.Pt, distSqrd))
	      {
	        op = ClipperLib.Clipper.ExcludeOp(op);
	        cnt--;
	      }
	      else if (ClipperLib.Clipper.PointsAreClose(op.Prev.Pt, op.Next.Pt, distSqrd))
	      {
	        ClipperLib.Clipper.ExcludeOp(op.Next);
	        op = ClipperLib.Clipper.ExcludeOp(op);
	        cnt -= 2;
	      }
	      else if (ClipperLib.Clipper.SlopesNearCollinear(op.Prev.Pt, op.Pt, op.Next.Pt, distSqrd))
	      {
	        op = ClipperLib.Clipper.ExcludeOp(op);
	        cnt--;
	      }
	      else
	      {
	        op.Idx = 1;
	        op = op.Next;
	      }
	    }
	    if (cnt < 3)
	      cnt = 0;
	    var result = new Array(cnt);
	    for (var i = 0; i < cnt; ++i)
	    {
	      result[i] = new ClipperLib.IntPoint(op.Pt);
	      op = op.Next;
	    }
	    outPts = null;
	    return result;
	  };
	  ClipperLib.Clipper.CleanPolygons = function (polys, distance)
	  {
	    var result = new Array(polys.length);
	    for (var i = 0, ilen = polys.length; i < ilen; i++)
	      result[i] = ClipperLib.Clipper.CleanPolygon(polys[i], distance);
	    return result;
	  };
	  ClipperLib.Clipper.Minkowski = function (pattern, path, IsSum, IsClosed)
	  {
	    var delta = (IsClosed ? 1 : 0);
	    var polyCnt = pattern.length;
	    var pathCnt = path.length;
	    var result = new Array();
	    if (IsSum)
	      for (var i = 0; i < pathCnt; i++)
	      {
	        var p = new Array(polyCnt);
	        for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
	          p[j] = new ClipperLib.IntPoint(path[i].X + ip.X, path[i].Y + ip.Y);
	        result.push(p);
	      }
	    else
	      for (var i = 0; i < pathCnt; i++)
	      {
	        var p = new Array(polyCnt);
	        for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
	          p[j] = new ClipperLib.IntPoint(path[i].X - ip.X, path[i].Y - ip.Y);
	        result.push(p);
	      }
	    var quads = new Array();
	    for (var i = 0; i < pathCnt - 1 + delta; i++)
	      for (var j = 0; j < polyCnt; j++)
	      {
	        var quad = new Array();
	        quad.push(result[i % pathCnt][j % polyCnt]);
	        quad.push(result[(i + 1) % pathCnt][j % polyCnt]);
	        quad.push(result[(i + 1) % pathCnt][(j + 1) % polyCnt]);
	        quad.push(result[i % pathCnt][(j + 1) % polyCnt]);
	        if (!ClipperLib.Clipper.Orientation(quad))
	          quad.reverse();
	        quads.push(quad);
	      }
				return quads;
	  };
	
		ClipperLib.Clipper.MinkowskiSum = function(pattern, path_or_paths, pathIsClosed)
		{
			if(!(path_or_paths[0] instanceof Array))
			{
				var path = path_or_paths;
				var paths = ClipperLib.Clipper.Minkowski(pattern, path, true, pathIsClosed);
				var c = new ClipperLib.Clipper();
				c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
				c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
				return paths;
			}
			else
			{
	 			var paths = path_or_paths;
				var solution = new ClipperLib.Paths();
				var c = new ClipperLib.Clipper();
				for (var i = 0; i < paths.length; ++i)
				{
					var tmp = ClipperLib.Clipper.Minkowski(pattern, paths[i], true, pathIsClosed);
					c.AddPaths(tmp, ClipperLib.PolyType.ptSubject, true);
					if (pathIsClosed)
					{
						var path = ClipperLib.Clipper.TranslatePath(paths[i], pattern[0]);
						c.AddPath(path, ClipperLib.PolyType.ptClip, true);
					}
				}
				c.Execute(ClipperLib.ClipType.ctUnion, solution,
					ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
				return solution;
			}
		}
		//------------------------------------------------------------------------------
	
		ClipperLib.Clipper.TranslatePath = function (path, delta)
		{
			var outPath = new ClipperLib.Path();
			for (var i = 0; i < path.length; i++)
				outPath.push(new ClipperLib.IntPoint(path[i].X + delta.X, path[i].Y + delta.Y));
			return outPath;
		}
		//------------------------------------------------------------------------------
	
		ClipperLib.Clipper.MinkowskiDiff = function (poly1, poly2)
		{
			var paths = ClipperLib.Clipper.Minkowski(poly1, poly2, false, true);
			var c = new ClipperLib.Clipper();
			c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
			c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
			return paths;
		}
	
	  ClipperLib.Clipper.PolyTreeToPaths = function (polytree)
	  {
	    var result = new Array();
	    //result.set_Capacity(polytree.get_Total());
	    ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntAny, result);
	    return result;
	  };
	  ClipperLib.Clipper.AddPolyNodeToPaths = function (polynode, nt, paths)
	  {
	    var match = true;
	    switch (nt)
	    {
	    case ClipperLib.Clipper.NodeType.ntOpen:
	      return;
	    case ClipperLib.Clipper.NodeType.ntClosed:
	      match = !polynode.IsOpen;
	      break;
	    default:
	      break;
	    }
	    if (polynode.m_polygon.length > 0 && match)
	      paths.push(polynode.m_polygon);
	    for (var $i3 = 0, $t3 = polynode.Childs(), $l3 = $t3.length, pn = $t3[$i3]; $i3 < $l3; $i3++, pn = $t3[$i3])
	      ClipperLib.Clipper.AddPolyNodeToPaths(pn, nt, paths);
	  };
	  ClipperLib.Clipper.OpenPathsFromPolyTree = function (polytree)
	  {
	    var result = new ClipperLib.Paths();
	    //result.set_Capacity(polytree.ChildCount());
	    for (var i = 0, ilen = polytree.ChildCount(); i < ilen; i++)
	      if (polytree.Childs()[i].IsOpen)
	        result.push(polytree.Childs()[i].m_polygon);
	    return result;
	  };
	  ClipperLib.Clipper.ClosedPathsFromPolyTree = function (polytree)
	  {
	    var result = new ClipperLib.Paths();
	    //result.set_Capacity(polytree.Total());
	    ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntClosed, result);
	    return result;
	  };
	  Inherit(ClipperLib.Clipper, ClipperLib.ClipperBase);
	  ClipperLib.Clipper.NodeType = {
	    ntAny: 0,
	    ntOpen: 1,
	    ntClosed: 2
	  };
	  ClipperLib.ClipperOffset = function (miterLimit, arcTolerance)
	  {
	    if (typeof (miterLimit) == "undefined") miterLimit = 2;
	    if (typeof (arcTolerance) == "undefined") arcTolerance = ClipperLib.ClipperOffset.def_arc_tolerance;
	    this.m_destPolys = new ClipperLib.Paths();
	    this.m_srcPoly = new ClipperLib.Path();
	    this.m_destPoly = new ClipperLib.Path();
	    this.m_normals = new Array();
	    this.m_delta = 0;
	    this.m_sinA = 0;
	    this.m_sin = 0;
	    this.m_cos = 0;
	    this.m_miterLim = 0;
	    this.m_StepsPerRad = 0;
	    this.m_lowest = new ClipperLib.IntPoint();
	    this.m_polyNodes = new ClipperLib.PolyNode();
	    this.MiterLimit = miterLimit;
	    this.ArcTolerance = arcTolerance;
	    this.m_lowest.X = -1;
	  };
	  ClipperLib.ClipperOffset.two_pi = 6.28318530717959;
	  ClipperLib.ClipperOffset.def_arc_tolerance = 0.25;
	  ClipperLib.ClipperOffset.prototype.Clear = function ()
	  {
	    ClipperLib.Clear(this.m_polyNodes.Childs());
	    this.m_lowest.X = -1;
	  };
	  ClipperLib.ClipperOffset.Round = ClipperLib.Clipper.Round;
	  ClipperLib.ClipperOffset.prototype.AddPath = function (path, joinType, endType)
	  {
	    var highI = path.length - 1;
	    if (highI < 0)
	      return;
	    var newNode = new ClipperLib.PolyNode();
	    newNode.m_jointype = joinType;
	    newNode.m_endtype = endType;
	    //strip duplicate points from path and also get index to the lowest point ...
	    if (endType == ClipperLib.EndType.etClosedLine || endType == ClipperLib.EndType.etClosedPolygon)
	      while (highI > 0 && ClipperLib.IntPoint.op_Equality(path[0], path[highI]))
	        highI--;
	    //newNode.m_polygon.set_Capacity(highI + 1);
	    newNode.m_polygon.push(path[0]);
	    var j = 0,
	      k = 0;
	    for (var i = 1; i <= highI; i++)
	      if (ClipperLib.IntPoint.op_Inequality(newNode.m_polygon[j], path[i]))
	      {
	        j++;
	        newNode.m_polygon.push(path[i]);
	        if (path[i].Y > newNode.m_polygon[k].Y || (path[i].Y == newNode.m_polygon[k].Y && path[i].X < newNode.m_polygon[k].X))
	          k = j;
	      }
	    if (endType == ClipperLib.EndType.etClosedPolygon && j < 2) return;
	
	    this.m_polyNodes.AddChild(newNode);
	    //if this path's lowest pt is lower than all the others then update m_lowest
	    if (endType != ClipperLib.EndType.etClosedPolygon)
	      return;
	    if (this.m_lowest.X < 0)
	      this.m_lowest = new ClipperLib.IntPoint(this.m_polyNodes.ChildCount() - 1, k);
	    else
	    {
	      var ip = this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon[this.m_lowest.Y];
	      if (newNode.m_polygon[k].Y > ip.Y || (newNode.m_polygon[k].Y == ip.Y && newNode.m_polygon[k].X < ip.X))
	        this.m_lowest = new ClipperLib.IntPoint(this.m_polyNodes.ChildCount() - 1, k);
	    }
	  };
	  ClipperLib.ClipperOffset.prototype.AddPaths = function (paths, joinType, endType)
	  {
	    for (var i = 0, ilen = paths.length; i < ilen; i++)
	      this.AddPath(paths[i], joinType, endType);
	  };
	  ClipperLib.ClipperOffset.prototype.FixOrientations = function ()
	  {
	    //fixup orientations of all closed paths if the orientation of the
	    //closed path with the lowermost vertex is wrong ...
	    if (this.m_lowest.X >= 0 && !ClipperLib.Clipper.Orientation(this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon))
	    {
	      for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
	      {
	        var node = this.m_polyNodes.Childs()[i];
	        if (node.m_endtype == ClipperLib.EndType.etClosedPolygon || (node.m_endtype == ClipperLib.EndType.etClosedLine && ClipperLib.Clipper.Orientation(node.m_polygon)))
	          node.m_polygon.reverse();
	      }
	    }
	    else
	    {
	      for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
	      {
	        var node = this.m_polyNodes.Childs()[i];
	        if (node.m_endtype == ClipperLib.EndType.etClosedLine && !ClipperLib.Clipper.Orientation(node.m_polygon))
	          node.m_polygon.reverse();
	      }
	    }
	  };
	  ClipperLib.ClipperOffset.GetUnitNormal = function (pt1, pt2)
	  {
	    var dx = (pt2.X - pt1.X);
	    var dy = (pt2.Y - pt1.Y);
	    if ((dx == 0) && (dy == 0))
	      return new ClipperLib.DoublePoint(0, 0);
	    var f = 1 / Math.sqrt(dx * dx + dy * dy);
	    dx *= f;
	    dy *= f;
	    return new ClipperLib.DoublePoint(dy, -dx);
	  };
	  ClipperLib.ClipperOffset.prototype.DoOffset = function (delta)
	  {
	    this.m_destPolys = new Array();
	    this.m_delta = delta;
	    //if Zero offset, just copy any CLOSED polygons to m_p and return ...
	    if (ClipperLib.ClipperBase.near_zero(delta))
	    {
	      //this.m_destPolys.set_Capacity(this.m_polyNodes.ChildCount);
	      for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
	      {
	        var node = this.m_polyNodes.Childs()[i];
	        if (node.m_endtype == ClipperLib.EndType.etClosedPolygon)
	          this.m_destPolys.push(node.m_polygon);
	      }
	      return;
	    }
	    //see offset_triginometry3.svg in the documentation folder ...
	    if (this.MiterLimit > 2)
	      this.m_miterLim = 2 / (this.MiterLimit * this.MiterLimit);
	    else
	      this.m_miterLim = 0.5;
	    var y;
	    if (this.ArcTolerance <= 0)
	      y = ClipperLib.ClipperOffset.def_arc_tolerance;
	    else if (this.ArcTolerance > Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance)
	      y = Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance;
	    else
	      y = this.ArcTolerance;
	    //see offset_triginometry2.svg in the documentation folder ...
	    var steps = 3.14159265358979 / Math.acos(1 - y / Math.abs(delta));
	    this.m_sin = Math.sin(ClipperLib.ClipperOffset.two_pi / steps);
	    this.m_cos = Math.cos(ClipperLib.ClipperOffset.two_pi / steps);
	    this.m_StepsPerRad = steps / ClipperLib.ClipperOffset.two_pi;
	    if (delta < 0)
	      this.m_sin = -this.m_sin;
	    //this.m_destPolys.set_Capacity(this.m_polyNodes.ChildCount * 2);
	    for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
	    {
	      var node = this.m_polyNodes.Childs()[i];
	      this.m_srcPoly = node.m_polygon;
	      var len = this.m_srcPoly.length;
	      if (len == 0 || (delta <= 0 && (len < 3 || node.m_endtype != ClipperLib.EndType.etClosedPolygon)))
	        continue;
	      this.m_destPoly = new Array();
	      if (len == 1)
	      {
	        if (node.m_jointype == ClipperLib.JoinType.jtRound)
	        {
	          var X = 1,
	            Y = 0;
	          for (var j = 1; j <= steps; j++)
	          {
	            this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
	            var X2 = X;
	            X = X * this.m_cos - this.m_sin * Y;
	            Y = X2 * this.m_sin + Y * this.m_cos;
	          }
	        }
	        else
	        {
	          var X = -1,
	            Y = -1;
	          for (var j = 0; j < 4; ++j)
	          {
	            this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
	            if (X < 0)
	              X = 1;
	            else if (Y < 0)
	              Y = 1;
	            else
	              X = -1;
	          }
	        }
	        this.m_destPolys.push(this.m_destPoly);
	        continue;
	      }
	      //build m_normals ...
	      this.m_normals.length = 0;
	      //this.m_normals.set_Capacity(len);
	      for (var j = 0; j < len - 1; j++)
	        this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[j], this.m_srcPoly[j + 1]));
	      if (node.m_endtype == ClipperLib.EndType.etClosedLine || node.m_endtype == ClipperLib.EndType.etClosedPolygon)
	        this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[len - 1], this.m_srcPoly[0]));
	      else
	        this.m_normals.push(new ClipperLib.DoublePoint(this.m_normals[len - 2]));
	      if (node.m_endtype == ClipperLib.EndType.etClosedPolygon)
	      {
	        var k = len - 1;
	        for (var j = 0; j < len; j++)
	          k = this.OffsetPoint(j, k, node.m_jointype);
	        this.m_destPolys.push(this.m_destPoly);
	      }
	      else if (node.m_endtype == ClipperLib.EndType.etClosedLine)
	      {
	        var k = len - 1;
	        for (var j = 0; j < len; j++)
	          k = this.OffsetPoint(j, k, node.m_jointype);
	        this.m_destPolys.push(this.m_destPoly);
	        this.m_destPoly = new Array();
	        //re-build m_normals ...
	        var n = this.m_normals[len - 1];
	        for (var j = len - 1; j > 0; j--)
	          this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
	        this.m_normals[0] = new ClipperLib.DoublePoint(-n.X, -n.Y);
	        k = 0;
	        for (var j = len - 1; j >= 0; j--)
	          k = this.OffsetPoint(j, k, node.m_jointype);
	        this.m_destPolys.push(this.m_destPoly);
	      }
	      else
	      {
	        var k = 0;
	        for (var j = 1; j < len - 1; ++j)
	          k = this.OffsetPoint(j, k, node.m_jointype);
	        var pt1;
	        if (node.m_endtype == ClipperLib.EndType.etOpenButt)
	        {
	          var j = len - 1;
	          pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * delta));
	          this.m_destPoly.push(pt1);
	          pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X - this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y - this.m_normals[j].Y * delta));
	          this.m_destPoly.push(pt1);
	        }
	        else
	        {
	          var j = len - 1;
	          k = len - 2;
	          this.m_sinA = 0;
	          this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j].X, -this.m_normals[j].Y);
	          if (node.m_endtype == ClipperLib.EndType.etOpenSquare)
	            this.DoSquare(j, k);
	          else
	            this.DoRound(j, k);
	        }
	        //re-build m_normals ...
	        for (var j = len - 1; j > 0; j--)
	          this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
	        this.m_normals[0] = new ClipperLib.DoublePoint(-this.m_normals[1].X, -this.m_normals[1].Y);
	        k = len - 1;
	        for (var j = k - 1; j > 0; --j)
	          k = this.OffsetPoint(j, k, node.m_jointype);
	        if (node.m_endtype == ClipperLib.EndType.etOpenButt)
	        {
	          pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X - this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y - this.m_normals[0].Y * delta));
	          this.m_destPoly.push(pt1);
	          pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + this.m_normals[0].Y * delta));
	          this.m_destPoly.push(pt1);
	        }
	        else
	        {
	          k = 1;
	          this.m_sinA = 0;
	          if (node.m_endtype == ClipperLib.EndType.etOpenSquare)
	            this.DoSquare(0, 1);
	          else
	            this.DoRound(0, 1);
	        }
	        this.m_destPolys.push(this.m_destPoly);
	      }
	    }
	  };
	  ClipperLib.ClipperOffset.prototype.Execute = function ()
	  {
	    var a = arguments,
	      ispolytree = a[0] instanceof ClipperLib.PolyTree;
	    if (!ispolytree) // function (solution, delta)
	    {
	      var solution = a[0],
	        delta = a[1];
	      ClipperLib.Clear(solution);
	      this.FixOrientations();
	      this.DoOffset(delta);
	      //now clean up 'corners' ...
	      var clpr = new ClipperLib.Clipper(0);
	      clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
	      if (delta > 0)
	      {
	        clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
	      }
	      else
	      {
	        var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
	        var outer = new ClipperLib.Path();
	        outer.push(new ClipperLib.IntPoint(r.left - 10, r.bottom + 10));
	        outer.push(new ClipperLib.IntPoint(r.right + 10, r.bottom + 10));
	        outer.push(new ClipperLib.IntPoint(r.right + 10, r.top - 10));
	        outer.push(new ClipperLib.IntPoint(r.left - 10, r.top - 10));
	        clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
	        clpr.ReverseSolution = true;
	        clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
	        if (solution.length > 0)
	          solution.splice(0, 1);
	      }
	      //console.log(JSON.stringify(solution));
	    }
	    else // function (polytree, delta)
	    {
	      var solution = a[0],
	        delta = a[1];
	      solution.Clear();
	      this.FixOrientations();
	      this.DoOffset(delta);
	      //now clean up 'corners' ...
	      var clpr = new ClipperLib.Clipper(0);
	      clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
	      if (delta > 0)
	      {
	        clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
	      }
	      else
	      {
	        var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
	        var outer = new ClipperLib.Path();
	        outer.push(new ClipperLib.IntPoint(r.left - 10, r.bottom + 10));
	        outer.push(new ClipperLib.IntPoint(r.right + 10, r.bottom + 10));
	        outer.push(new ClipperLib.IntPoint(r.right + 10, r.top - 10));
	        outer.push(new ClipperLib.IntPoint(r.left - 10, r.top - 10));
	        clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
	        clpr.ReverseSolution = true;
	        clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
	        //remove the outer PolyNode rectangle ...
	        if (solution.ChildCount() == 1 && solution.Childs()[0].ChildCount() > 0)
	        {
	          var outerNode = solution.Childs()[0];
	          //solution.Childs.set_Capacity(outerNode.ChildCount);
	          solution.Childs()[0] = outerNode.Childs()[0];
	          solution.Childs()[0].m_Parent = solution;
	          for (var i = 1; i < outerNode.ChildCount(); i++)
	            solution.AddChild(outerNode.Childs()[i]);
	        }
	        else
	          solution.Clear();
	      }
	    }
	  };
	  ClipperLib.ClipperOffset.prototype.OffsetPoint = function (j, k, jointype)
	  {
			//cross product ...
			this.m_sinA = (this.m_normals[k].X * this.m_normals[j].Y - this.m_normals[j].X * this.m_normals[k].Y);
	
			if (Math.abs(this.m_sinA * this.m_delta) < 1.0)
			{
				//dot product ...
				var cosA = (this.m_normals[k].X * this.m_normals[j].X + this.m_normals[j].Y * this.m_normals[k].Y);
				if (cosA > 0) // angle ==> 0 degrees
				{
					this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
						ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
					return k;
				}
				//else angle ==> 180 degrees
			}
	    else if (this.m_sinA > 1)
	      this.m_sinA = 1.0;
	    else if (this.m_sinA < -1)
	      this.m_sinA = -1.0;
	    if (this.m_sinA * this.m_delta < 0)
	    {
	      this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
	        ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
	      this.m_destPoly.push(new ClipperLib.IntPoint(this.m_srcPoly[j]));
	      this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
	        ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
	    }
	    else
	      switch (jointype)
	      {
	      case ClipperLib.JoinType.jtMiter:
	        {
	          var r = 1 + (this.m_normals[j].X * this.m_normals[k].X + this.m_normals[j].Y * this.m_normals[k].Y);
	          if (r >= this.m_miterLim)
	            this.DoMiter(j, k, r);
	          else
	            this.DoSquare(j, k);
	          break;
	        }
	      case ClipperLib.JoinType.jtSquare:
	        this.DoSquare(j, k);
	        break;
	      case ClipperLib.JoinType.jtRound:
	        this.DoRound(j, k);
	        break;
	      }
	    k = j;
	    return k;
	  };
	  ClipperLib.ClipperOffset.prototype.DoSquare = function (j, k)
	  {
	    var dx = Math.tan(Math.atan2(this.m_sinA,
	      this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y) / 4);
	    this.m_destPoly.push(new ClipperLib.IntPoint(
	      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[k].X - this.m_normals[k].Y * dx)),
	      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[k].Y + this.m_normals[k].X * dx))));
	    this.m_destPoly.push(new ClipperLib.IntPoint(
	      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[j].X + this.m_normals[j].Y * dx)),
	      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[j].Y - this.m_normals[j].X * dx))));
	  };
	  ClipperLib.ClipperOffset.prototype.DoMiter = function (j, k, r)
	  {
	    var q = this.m_delta / r;
	    this.m_destPoly.push(new ClipperLib.IntPoint(
	      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + (this.m_normals[k].X + this.m_normals[j].X) * q),
	      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + (this.m_normals[k].Y + this.m_normals[j].Y) * q)));
	  };
	  ClipperLib.ClipperOffset.prototype.DoRound = function (j, k)
	  {
	    var a = Math.atan2(this.m_sinA,
	      this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y);
	
	    	var steps = Math.max(ClipperLib.Cast_Int32(ClipperLib.ClipperOffset.Round(this.m_StepsPerRad * Math.abs(a))), 1);
	
	    var X = this.m_normals[k].X,
	      Y = this.m_normals[k].Y,
	      X2;
	    for (var i = 0; i < steps; ++i)
	    {
	      this.m_destPoly.push(new ClipperLib.IntPoint(
	        ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + X * this.m_delta),
	        ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + Y * this.m_delta)));
	      X2 = X;
	      X = X * this.m_cos - this.m_sin * Y;
	      Y = X2 * this.m_sin + Y * this.m_cos;
	    }
	    this.m_destPoly.push(new ClipperLib.IntPoint(
	      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
	      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
	  };
	  ClipperLib.Error = function (message)
	  {
	    try
	    {
	      throw new Error(message);
	    }
	    catch (err)
	    {
	      alert(err.message);
	    }
	  };
	  // ---------------------------------
	  // JS extension by Timo 2013
	  ClipperLib.JS = {};
	  ClipperLib.JS.AreaOfPolygon = function (poly, scale)
	  {
	    if (!scale) scale = 1;
	    return ClipperLib.Clipper.Area(poly) / (scale * scale);
	  };
	  ClipperLib.JS.AreaOfPolygons = function (poly, scale)
	  {
	    if (!scale) scale = 1;
	    var area = 0;
	    for (var i = 0; i < poly.length; i++)
	    {
	      area += ClipperLib.Clipper.Area(poly[i]);
	    }
	    return area / (scale * scale);
	  };
	  ClipperLib.JS.BoundsOfPath = function (path, scale)
	  {
	    return ClipperLib.JS.BoundsOfPaths([path], scale);
	  };
	  ClipperLib.JS.BoundsOfPaths = function (paths, scale)
	  {
	    if (!scale) scale = 1;
	    var bounds = ClipperLib.Clipper.GetBounds(paths);
	    bounds.left /= scale;
	    bounds.bottom /= scale;
	    bounds.right /= scale;
	    bounds.top /= scale;
	    return bounds;
	  };
	  // Clean() joins vertices that are too near each other
	  // and causes distortion to offsetted polygons without cleaning
	  ClipperLib.JS.Clean = function (polygon, delta)
	  {
	    if (!(polygon instanceof Array)) return [];
	    var isPolygons = polygon[0] instanceof Array;
	    var polygon = ClipperLib.JS.Clone(polygon);
	    if (typeof delta != "number" || delta === null)
	    {
	      ClipperLib.Error("Delta is not a number in Clean().");
	      return polygon;
	    }
	    if (polygon.length === 0 || (polygon.length == 1 && polygon[0].length === 0) || delta < 0) return polygon;
	    if (!isPolygons) polygon = [polygon];
	    var k_length = polygon.length;
	    var len, poly, result, d, p, j, i;
	    var results = [];
	    for (var k = 0; k < k_length; k++)
	    {
	      poly = polygon[k];
	      len = poly.length;
	      if (len === 0) continue;
	      else if (len < 3)
	      {
	        result = poly;
	        results.push(result);
	        continue;
	      }
	      result = poly;
	      d = delta * delta;
	      //d = Math.floor(c_delta * c_delta);
	      p = poly[0];
	      j = 1;
	      for (i = 1; i < len; i++)
	      {
	        if ((poly[i].X - p.X) * (poly[i].X - p.X) +
	          (poly[i].Y - p.Y) * (poly[i].Y - p.Y) <= d)
	          continue;
	        result[j] = poly[i];
	        p = poly[i];
	        j++;
	      }
	      p = poly[j - 1];
	      if ((poly[0].X - p.X) * (poly[0].X - p.X) +
	        (poly[0].Y - p.Y) * (poly[0].Y - p.Y) <= d)
	        j--;
	      if (j < len)
	        result.splice(j, len - j);
	      if (result.length) results.push(result);
	    }
	    if (!isPolygons && results.length) results = results[0];
	    else if (!isPolygons && results.length === 0) results = [];
	    else if (isPolygons && results.length === 0) results = [
	      []
	    ];
	    return results;
	  }
	  // Make deep copy of Polygons or Polygon
	  // so that also IntPoint objects are cloned and not only referenced
	  // This should be the fastest way
	  ClipperLib.JS.Clone = function (polygon)
	  {
	    if (!(polygon instanceof Array)) return [];
	    if (polygon.length === 0) return [];
	    else if (polygon.length == 1 && polygon[0].length === 0) return [[]];
	    var isPolygons = polygon[0] instanceof Array;
	    if (!isPolygons) polygon = [polygon];
	    var len = polygon.length,
	      plen, i, j, result;
	    var results = new Array(len);
	    for (i = 0; i < len; i++)
	    {
	      plen = polygon[i].length;
	      result = new Array(plen);
	      for (j = 0; j < plen; j++)
	      {
	        result[j] = {
	          X: polygon[i][j].X,
	          Y: polygon[i][j].Y
	        };
	      }
	      results[i] = result;
	    }
	    if (!isPolygons) results = results[0];
	    return results;
	  };
	  // Removes points that doesn't affect much to the visual appearance.
	  // If middle point is at or under certain distance (tolerance) of the line segment between
	  // start and end point, the middle point is removed.
	  ClipperLib.JS.Lighten = function (polygon, tolerance)
	  {
	    if (!(polygon instanceof Array)) return [];
	    if (typeof tolerance != "number" || tolerance === null)
	    {
	      ClipperLib.Error("Tolerance is not a number in Lighten().")
	      return ClipperLib.JS.Clone(polygon);
	    }
	    if (polygon.length === 0 || (polygon.length == 1 && polygon[0].length === 0) || tolerance < 0)
	    {
	      return ClipperLib.JS.Clone(polygon);
	    }
	    if (!(polygon[0] instanceof Array)) polygon = [polygon];
	    var i, j, poly, k, poly2, plen, A, B, P, d, rem, addlast;
	    var bxax, byay, l, ax, ay;
	    var len = polygon.length;
	    var toleranceSq = tolerance * tolerance;
	    var results = [];
	    for (i = 0; i < len; i++)
	    {
	      poly = polygon[i];
	      plen = poly.length;
	      if (plen == 0) continue;
	      for (k = 0; k < 1000000; k++) // could be forever loop, but wiser to restrict max repeat count
	      {
	        poly2 = [];
	        plen = poly.length;
	        // the first have to added to the end, if first and last are not the same
	        // this way we ensure that also the actual last point can be removed if needed
	        if (poly[plen - 1].X != poly[0].X || poly[plen - 1].Y != poly[0].Y)
	        {
	          addlast = 1;
	          poly.push(
	          {
	            X: poly[0].X,
	            Y: poly[0].Y
	          });
	          plen = poly.length;
	        }
	        else addlast = 0;
	        rem = []; // Indexes of removed points
	        for (j = 0; j < plen - 2; j++)
	        {
	          A = poly[j]; // Start point of line segment
	          P = poly[j + 1]; // Middle point. This is the one to be removed.
	          B = poly[j + 2]; // End point of line segment
	          ax = A.X;
	          ay = A.Y;
	          bxax = B.X - ax;
	          byay = B.Y - ay;
	          if (bxax !== 0 || byay !== 0) // To avoid Nan, when A==P && P==B. And to avoid peaks (A==B && A!=P), which have lenght, but not area.
	          {
	            l = ((P.X - ax) * bxax + (P.Y - ay) * byay) / (bxax * bxax + byay * byay);
	            if (l > 1)
	            {
	              ax = B.X;
	              ay = B.Y;
	            }
	            else if (l > 0)
	            {
	              ax += bxax * l;
	              ay += byay * l;
	            }
	          }
	          bxax = P.X - ax;
	          byay = P.Y - ay;
	          d = bxax * bxax + byay * byay;
	          if (d <= toleranceSq)
	          {
	            rem[j + 1] = 1;
	            j++; // when removed, transfer the pointer to the next one
	          }
	        }
	        // add all unremoved points to poly2
	        poly2.push(
	        {
	          X: poly[0].X,
	          Y: poly[0].Y
	        });
	        for (j = 1; j < plen - 1; j++)
	          if (!rem[j]) poly2.push(
	          {
	            X: poly[j].X,
	            Y: poly[j].Y
	          });
	        poly2.push(
	        {
	          X: poly[plen - 1].X,
	          Y: poly[plen - 1].Y
	        });
	        // if the first point was added to the end, remove it
	        if (addlast) poly.pop();
	        // break, if there was not anymore removed points
	        if (!rem.length) break;
	        // else continue looping using poly2, to check if there are points to remove
	        else poly = poly2;
	      }
	      plen = poly2.length;
	      // remove duplicate from end, if needed
	      if (poly2[plen - 1].X == poly2[0].X && poly2[plen - 1].Y == poly2[0].Y)
	      {
	        poly2.pop();
	      }
	      if (poly2.length > 2) // to avoid two-point-polygons
	        results.push(poly2);
	    }
	    if (!(polygon[0] instanceof Array)) results = results[0];
	    if (typeof (results) == "undefined") results = [
	      []
	    ];
	    return results;
	  }
	  ClipperLib.JS.PerimeterOfPath = function (path, closed, scale)
	  {
	    if (typeof (path) == "undefined") return 0;
	    var sqrt = Math.sqrt;
	    var perimeter = 0.0;
	    var p1, p2, p1x = 0.0,
	      p1y = 0.0,
	      p2x = 0.0,
	      p2y = 0.0;
	    var j = path.length;
	    if (j < 2) return 0;
	    if (closed)
	    {
	      path[j] = path[0];
	      j++;
	    }
	    while (--j)
	    {
	      p1 = path[j];
	      p1x = p1.X;
	      p1y = p1.Y;
	      p2 = path[j - 1];
	      p2x = p2.X;
	      p2y = p2.Y;
	      perimeter += sqrt((p1x - p2x) * (p1x - p2x) + (p1y - p2y) * (p1y - p2y));
	    }
	    if (closed) path.pop();
	    return perimeter / scale;
	  };
	  ClipperLib.JS.PerimeterOfPaths = function (paths, closed, scale)
	  {
	    if (!scale) scale = 1;
	    var perimeter = 0;
	    for (var i = 0; i < paths.length; i++)
	    {
	      perimeter += ClipperLib.JS.PerimeterOfPath(paths[i], closed, scale);
	    }
	    return perimeter;
	  };
	  ClipperLib.JS.ScaleDownPath = function (path, scale)
	  {
	    var i, p;
	    if (!scale) scale = 1;
	    i = path.length;
	    while (i--)
	    {
	      p = path[i];
	      p.X = p.X / scale;
	      p.Y = p.Y / scale;
	    }
	  };
	  ClipperLib.JS.ScaleDownPaths = function (paths, scale)
	  {
	    var i, j, p;
	    if (!scale) scale = 1;
	    i = paths.length;
	    while (i--)
	    {
	      j = paths[i].length;
	      while (j--)
	      {
	        p = paths[i][j];
	        p.X = p.X / scale;
	        p.Y = p.Y / scale;
	      }
	    }
	  };
	  ClipperLib.JS.ScaleUpPath = function (path, scale)
	  {
	    var i, p, round = Math.round;
	    if (!scale) scale = 1;
	    i = path.length;
	    while (i--)
	    {
	      p = path[i];
	      p.X = round(p.X * scale);
	      p.Y = round(p.Y * scale);
	    }
	  };
	  ClipperLib.JS.ScaleUpPaths = function (paths, scale)
	  {
	    var i, j, p, round = Math.round;
	    if (!scale) scale = 1;
	    i = paths.length;
	    while (i--)
	    {
	      j = paths[i].length;
	      while (j--)
	      {
	        p = paths[i][j];
	        p.X = round(p.X * scale);
	        p.Y = round(p.Y * scale);
	      }
	    }
	  };
	  ClipperLib.ExPolygons = function ()
	  {
	    return [];
	  }
	  ClipperLib.ExPolygon = function ()
	  {
	    this.outer = null;
	    this.holes = null;
	  };
	  ClipperLib.JS.AddOuterPolyNodeToExPolygons = function (polynode, expolygons)
	  {
	    var ep = new ClipperLib.ExPolygon();
	    ep.outer = polynode.Contour();
	    var childs = polynode.Childs();
	    var ilen = childs.length;
	    ep.holes = new Array(ilen);
	    var node, n, i, j, childs2, jlen;
	    for (i = 0; i < ilen; i++)
	    {
	      node = childs[i];
	      ep.holes[i] = node.Contour();
	      //Add outer polygons contained by (nested within) holes ...
	      for (j = 0, childs2 = node.Childs(), jlen = childs2.length; j < jlen; j++)
	      {
	        n = childs2[j];
	        ClipperLib.JS.AddOuterPolyNodeToExPolygons(n, expolygons);
	      }
	    }
	    expolygons.push(ep);
	  };
	  ClipperLib.JS.ExPolygonsToPaths = function (expolygons)
	  {
	    var a, i, alen, ilen;
	    var paths = new ClipperLib.Paths();
	    for (a = 0, alen = expolygons.length; a < alen; a++)
	    {
	      paths.push(expolygons[a].outer);
	      for (i = 0, ilen = expolygons[a].holes.length; i < ilen; i++)
	      {
	        paths.push(expolygons[a].holes[i]);
	      }
	    }
	    return paths;
	  }
	  ClipperLib.JS.PolyTreeToExPolygons = function (polytree)
	  {
	    var expolygons = new ClipperLib.ExPolygons();
	    var node, i, childs, ilen;
	    for (i = 0, childs = polytree.Childs(), ilen = childs.length; i < ilen; i++)
	    {
	      node = childs[i];
	      ClipperLib.JS.AddOuterPolyNodeToExPolygons(node, expolygons);
	    }
	    return expolygons;
	  };
	})();


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 * 
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 * 
	 * All rights reserved.
	 * 
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	/* jshint maxcomplexity:6 */
	
	"use strict";
	
	
	/*
	 * Note
	 * ====
	 * the structure of this JavaScript version of poly2tri intentionally follows
	 * as closely as possible the structure of the reference C++ version, to make it 
	 * easier to keep the 2 versions in sync.
	 */
	
	var PointError = __webpack_require__(4);
	var Point = __webpack_require__(6);
	var Triangle = __webpack_require__(7);
	var sweep = __webpack_require__(8);
	var AdvancingFront = __webpack_require__(10);
	var Node = AdvancingFront.Node;
	
	
	// ------------------------------------------------------------------------utils
	
	/**
	 * Initial triangle factor, seed triangle will extend 30% of
	 * PointSet width to both left and right.
	 * @private
	 * @const
	 */
	var kAlpha = 0.3;
	
	
	// -------------------------------------------------------------------------Edge
	/**
	 * Represents a simple polygon's edge
	 * @constructor
	 * @struct
	 * @private
	 * @param {Point} p1
	 * @param {Point} p2
	 * @throw {PointError} if p1 is same as p2
	 */
	var Edge = function(p1, p2) {
	    this.p = p1;
	    this.q = p2;
	
	    if (p1.y > p2.y) {
	        this.q = p1;
	        this.p = p2;
	    } else if (p1.y === p2.y) {
	        if (p1.x > p2.x) {
	            this.q = p1;
	            this.p = p2;
	        } else if (p1.x === p2.x) {
	            throw new PointError('poly2tri Invalid Edge constructor: repeated points!', [p1]);
	        }
	    }
	
	    if (!this.q._p2t_edge_list) {
	        this.q._p2t_edge_list = [];
	    }
	    this.q._p2t_edge_list.push(this);
	};
	
	
	// ------------------------------------------------------------------------Basin
	/**
	 * @constructor
	 * @struct
	 * @private
	 */
	var Basin = function() {
	    /** @type {Node} */
	    this.left_node = null;
	    /** @type {Node} */
	    this.bottom_node = null;
	    /** @type {Node} */
	    this.right_node = null;
	    /** @type {number} */
	    this.width = 0.0;
	    /** @type {boolean} */
	    this.left_highest = false;
	};
	
	Basin.prototype.clear = function() {
	    this.left_node = null;
	    this.bottom_node = null;
	    this.right_node = null;
	    this.width = 0.0;
	    this.left_highest = false;
	};
	
	// --------------------------------------------------------------------EdgeEvent
	/**
	 * @constructor
	 * @struct
	 * @private
	 */
	var EdgeEvent = function() {
	    /** @type {Edge} */
	    this.constrained_edge = null;
	    /** @type {boolean} */
	    this.right = false;
	};
	
	// ----------------------------------------------------SweepContext (public API)
	/**
	 * SweepContext constructor option
	 * @typedef {Object} SweepContextOptions
	 * @property {boolean=} cloneArrays - if <code>true</code>, do a shallow copy of the Array parameters
	 *                  (contour, holes). Points inside arrays are never copied.
	 *                  Default is <code>false</code> : keep a reference to the array arguments,
	 *                  who will be modified in place.
	 */
	/**
	 * Constructor for the triangulation context.
	 * It accepts a simple polyline (with non repeating points), 
	 * which defines the constrained edges.
	 *
	 * @example
	 *          var contour = [
	 *              new poly2tri.Point(100, 100),
	 *              new poly2tri.Point(100, 300),
	 *              new poly2tri.Point(300, 300),
	 *              new poly2tri.Point(300, 100)
	 *          ];
	 *          var swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
	 * @example
	 *          var contour = [{x:100, y:100}, {x:100, y:300}, {x:300, y:300}, {x:300, y:100}];
	 *          var swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
	 * @constructor
	 * @public
	 * @struct
	 * @param {Array.<XY>} contour - array of point objects. The points can be either {@linkcode Point} instances,
	 *          or any "Point like" custom class with <code>{x, y}</code> attributes.
	 * @param {SweepContextOptions=} options - constructor options
	 */
	var SweepContext = function(contour, options) {
	    options = options || {};
	    this.triangles_ = [];
	    this.map_ = [];
	    this.points_ = (options.cloneArrays ? contour.slice(0) : contour);
	    this.edge_list = [];
	
	    // Bounding box of all points. Computed at the start of the triangulation, 
	    // it is stored in case it is needed by the caller.
	    this.pmin_ = this.pmax_ = null;
	
	    /**
	     * Advancing front
	     * @private
	     * @type {AdvancingFront}
	     */
	    this.front_ = null;
	
	    /**
	     * head point used with advancing front
	     * @private
	     * @type {Point}
	     */
	    this.head_ = null;
	
	    /**
	     * tail point used with advancing front
	     * @private
	     * @type {Point}
	     */
	    this.tail_ = null;
	
	    /**
	     * @private
	     * @type {Node}
	     */
	    this.af_head_ = null;
	    /**
	     * @private
	     * @type {Node}
	     */
	    this.af_middle_ = null;
	    /**
	     * @private
	     * @type {Node}
	     */
	    this.af_tail_ = null;
	
	    this.basin = new Basin();
	    this.edge_event = new EdgeEvent();
	
	    this.initEdges(this.points_);
	};
	
	
	/**
	 * Add a hole to the constraints
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      var hole = [
	 *          new poly2tri.Point(200, 200),
	 *          new poly2tri.Point(200, 250),
	 *          new poly2tri.Point(250, 250)
	 *      ];
	 *      swctx.addHole(hole);
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      swctx.addHole([{x:200, y:200}, {x:200, y:250}, {x:250, y:250}]);
	 * @public
	 * @param {Array.<XY>} polyline - array of "Point like" objects with {x,y}
	 */
	SweepContext.prototype.addHole = function(polyline) {
	    this.initEdges(polyline);
	    var i, len = polyline.length;
	    for (i = 0; i < len; i++) {
	        this.points_.push(polyline[i]);
	    }
	    return this; // for chaining
	};
	
	/**
	 * For backward compatibility
	 * @function
	 * @deprecated use {@linkcode SweepContext#addHole} instead
	 */
	SweepContext.prototype.AddHole = SweepContext.prototype.addHole;
	
	
	/**
	 * Add several holes to the constraints
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      var holes = [
	 *          [ new poly2tri.Point(200, 200), new poly2tri.Point(200, 250), new poly2tri.Point(250, 250) ],
	 *          [ new poly2tri.Point(300, 300), new poly2tri.Point(300, 350), new poly2tri.Point(350, 350) ]
	 *      ];
	 *      swctx.addHoles(holes);
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      var holes = [
	 *          [{x:200, y:200}, {x:200, y:250}, {x:250, y:250}],
	 *          [{x:300, y:300}, {x:300, y:350}, {x:350, y:350}]
	 *      ];
	 *      swctx.addHoles(holes);
	 * @public
	 * @param {Array.<Array.<XY>>} holes - array of array of "Point like" objects with {x,y}
	 */
	// Method added in the JavaScript version (was not present in the c++ version)
	SweepContext.prototype.addHoles = function(holes) {
	    var i, len = holes.length;
	    for (i = 0; i < len; i++) {
	        this.initEdges(holes[i]);
	    }
	    this.points_ = this.points_.concat.apply(this.points_, holes);
	    return this; // for chaining
	};
	
	
	/**
	 * Add a Steiner point to the constraints
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      var point = new poly2tri.Point(150, 150);
	 *      swctx.addPoint(point);
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      swctx.addPoint({x:150, y:150});
	 * @public
	 * @param {XY} point - any "Point like" object with {x,y}
	 */
	SweepContext.prototype.addPoint = function(point) {
	    this.points_.push(point);
	    return this; // for chaining
	};
	
	/**
	 * For backward compatibility
	 * @function
	 * @deprecated use {@linkcode SweepContext#addPoint} instead
	 */
	SweepContext.prototype.AddPoint = SweepContext.prototype.addPoint;
	
	
	/**
	 * Add several Steiner points to the constraints
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      var points = [
	 *          new poly2tri.Point(150, 150),
	 *          new poly2tri.Point(200, 250),
	 *          new poly2tri.Point(250, 250)
	 *      ];
	 *      swctx.addPoints(points);
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      swctx.addPoints([{x:150, y:150}, {x:200, y:250}, {x:250, y:250}]);
	 * @public
	 * @param {Array.<XY>} points - array of "Point like" object with {x,y}
	 */
	// Method added in the JavaScript version (was not present in the c++ version)
	SweepContext.prototype.addPoints = function(points) {
	    this.points_ = this.points_.concat(points);
	    return this; // for chaining
	};
	
	
	/**
	 * Triangulate the polygon with holes and Steiner points.
	 * Do this AFTER you've added the polyline, holes, and Steiner points
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      swctx.triangulate();
	 *      var triangles = swctx.getTriangles();
	 * @public
	 */
	// Shortcut method for sweep.triangulate(SweepContext).
	// Method added in the JavaScript version (was not present in the c++ version)
	SweepContext.prototype.triangulate = function() {
	    sweep.triangulate(this);
	    return this; // for chaining
	};
	
	
	/**
	 * Get the bounding box of the provided constraints (contour, holes and 
	 * Steinter points). Warning : these values are not available if the triangulation 
	 * has not been done yet.
	 * @public
	 * @returns {{min:Point,max:Point}} object with 'min' and 'max' Point
	 */
	// Method added in the JavaScript version (was not present in the c++ version)
	SweepContext.prototype.getBoundingBox = function() {
	    return {min: this.pmin_, max: this.pmax_};
	};
	
	/**
	 * Get result of triangulation.
	 * The output triangles have vertices which are references
	 * to the initial input points (not copies): any custom fields in the
	 * initial points can be retrieved in the output triangles.
	 * @example
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      swctx.triangulate();
	 *      var triangles = swctx.getTriangles();
	 * @example
	 *      var contour = [{x:100, y:100, id:1}, {x:100, y:300, id:2}, {x:300, y:300, id:3}];
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      swctx.triangulate();
	 *      var triangles = swctx.getTriangles();
	 *      typeof triangles[0].getPoint(0).id
	 *      // → "number"
	 * @public
	 * @returns {array<Triangle>}   array of triangles
	 */
	SweepContext.prototype.getTriangles = function() {
	    return this.triangles_;
	};
	
	/**
	 * For backward compatibility
	 * @function
	 * @deprecated use {@linkcode SweepContext#getTriangles} instead
	 */
	SweepContext.prototype.GetTriangles = SweepContext.prototype.getTriangles;
	
	
	// ---------------------------------------------------SweepContext (private API)
	
	/** @private */
	SweepContext.prototype.front = function() {
	    return this.front_;
	};
	
	/** @private */
	SweepContext.prototype.pointCount = function() {
	    return this.points_.length;
	};
	
	/** @private */
	SweepContext.prototype.head = function() {
	    return this.head_;
	};
	
	/** @private */
	SweepContext.prototype.setHead = function(p1) {
	    this.head_ = p1;
	};
	
	/** @private */
	SweepContext.prototype.tail = function() {
	    return this.tail_;
	};
	
	/** @private */
	SweepContext.prototype.setTail = function(p1) {
	    this.tail_ = p1;
	};
	
	/** @private */
	SweepContext.prototype.getMap = function() {
	    return this.map_;
	};
	
	/** @private */
	SweepContext.prototype.initTriangulation = function() {
	    var xmax = this.points_[0].x;
	    var xmin = this.points_[0].x;
	    var ymax = this.points_[0].y;
	    var ymin = this.points_[0].y;
	
	    // Calculate bounds
	    var i, len = this.points_.length;
	    for (i = 1; i < len; i++) {
	        var p = this.points_[i];
	        /* jshint expr:true */
	        (p.x > xmax) && (xmax = p.x);
	        (p.x < xmin) && (xmin = p.x);
	        (p.y > ymax) && (ymax = p.y);
	        (p.y < ymin) && (ymin = p.y);
	    }
	    this.pmin_ = new Point(xmin, ymin);
	    this.pmax_ = new Point(xmax, ymax);
	
	    var dx = kAlpha * (xmax - xmin);
	    var dy = kAlpha * (ymax - ymin);
	    this.head_ = new Point(xmax + dx, ymin - dy);
	    this.tail_ = new Point(xmin - dx, ymin - dy);
	
	    // Sort points along y-axis
	    this.points_.sort(Point.compare);
	};
	
	/** @private */
	SweepContext.prototype.initEdges = function(polyline) {
	    var i, len = polyline.length;
	    for (i = 0; i < len; ++i) {
	        this.edge_list.push(new Edge(polyline[i], polyline[(i + 1) % len]));
	    }
	};
	
	/** @private */
	SweepContext.prototype.getPoint = function(index) {
	    return this.points_[index];
	};
	
	/** @private */
	SweepContext.prototype.addToMap = function(triangle) {
	    this.map_.push(triangle);
	};
	
	/** @private */
	SweepContext.prototype.locateNode = function(point) {
	    return this.front_.locateNode(point.x);
	};
	
	/** @private */
	SweepContext.prototype.createAdvancingFront = function() {
	    var head;
	    var middle;
	    var tail;
	    // Initial triangle
	    var triangle = new Triangle(this.points_[0], this.tail_, this.head_);
	
	    this.map_.push(triangle);
	
	    head = new Node(triangle.getPoint(1), triangle);
	    middle = new Node(triangle.getPoint(0), triangle);
	    tail = new Node(triangle.getPoint(2));
	
	    this.front_ = new AdvancingFront(head, tail);
	
	    head.next = middle;
	    middle.next = tail;
	    middle.prev = head;
	    tail.prev = middle;
	};
	
	/** @private */
	SweepContext.prototype.removeNode = function(node) {
	    // do nothing
	    /* jshint unused:false */
	};
	
	/** @private */
	SweepContext.prototype.mapTriangleToNodes = function(t) {
	    for (var i = 0; i < 3; ++i) {
	        if (!t.getNeighbor(i)) {
	            var n = this.front_.locatePoint(t.pointCW(t.getPoint(i)));
	            if (n) {
	                n.triangle = t;
	            }
	        }
	    }
	};
	
	/** @private */
	SweepContext.prototype.removeFromMap = function(triangle) {
	    var i, map = this.map_, len = map.length;
	    for (i = 0; i < len; i++) {
	        if (map[i] === triangle) {
	            map.splice(i, 1);
	            break;
	        }
	    }
	};
	
	/**
	 * Do a depth first traversal to collect triangles
	 * @private
	 * @param {Triangle} triangle start
	 */
	SweepContext.prototype.meshClean = function(triangle) {
	    // New implementation avoids recursive calls and use a loop instead.
	    // Cf. issues # 57, 65 and 69.
	    var triangles = [triangle], t, i;
	    /* jshint boss:true */
	    while (t = triangles.pop()) {
	        if (!t.isInterior()) {
	            t.setInterior(true);
	            this.triangles_.push(t);
	            for (i = 0; i < 3; i++) {
	                if (!t.constrained_edge[i]) {
	                    triangles.push(t.getNeighbor(i));
	                }
	            }
	        }
	    }
	};
	
	// ----------------------------------------------------------------------Exports
	
	module.exports = SweepContext;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 * 
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 * 
	 * All rights reserved.
	 * 
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	"use strict";
	
	/*
	 * Class added in the JavaScript version (was not present in the c++ version)
	 */
	
	var xy = __webpack_require__(5);
	
	/**
	 * Custom exception class to indicate invalid Point values
	 * @constructor
	 * @public
	 * @extends Error
	 * @struct
	 * @param {string=} message - error message
	 * @param {Array.<XY>=} points - invalid points
	 */
	var PointError = function(message, points) {
	    this.name = "PointError";
	    /**
	     * Invalid points
	     * @public
	     * @type {Array.<XY>}
	     */
	    this.points = points = points || [];
	    /**
	     * Error message
	     * @public
	     * @type {string}
	     */
	    this.message = message || "Invalid Points!";
	    for (var i = 0; i < points.length; i++) {
	        this.message += " " + xy.toString(points[i]);
	    }
	};
	PointError.prototype = new Error();
	PointError.prototype.constructor = PointError;
	
	
	module.exports = PointError;


/***/ }),
/* 5 */
/***/ (function(module, exports) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 * 
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 * 
	 * All rights reserved.
	 * 
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	"use strict";
	
	/**
	 * The following functions operate on "Point" or any "Point like" object with {x,y},
	 * as defined by the {@link XY} type
	 * ([duck typing]{@link http://en.wikipedia.org/wiki/Duck_typing}).
	 * @module
	 * @private
	 */
	
	/**
	 * poly2tri.js supports using custom point class instead of {@linkcode Point}.
	 * Any "Point like" object with <code>{x, y}</code> attributes is supported
	 * to initialize the SweepContext polylines and points
	 * ([duck typing]{@link http://en.wikipedia.org/wiki/Duck_typing}).
	 *
	 * poly2tri.js might add extra fields to the point objects when computing the
	 * triangulation : they are prefixed with <code>_p2t_</code> to avoid collisions
	 * with fields in the custom class.
	 *
	 * @example
	 *      var contour = [{x:100, y:100}, {x:100, y:300}, {x:300, y:300}, {x:300, y:100}];
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *
	 * @typedef {Object} XY
	 * @property {number} x - x coordinate
	 * @property {number} y - y coordinate
	 */
	
	
	/**
	 * Point pretty printing : prints x and y coordinates.
	 * @example
	 *      xy.toStringBase({x:5, y:42})
	 *      // → "(5;42)"
	 * @protected
	 * @param {!XY} p - point object with {x,y}
	 * @returns {string} <code>"(x;y)"</code>
	 */
	function toStringBase(p) {
	    return ("(" + p.x + ";" + p.y + ")");
	}
	
	/**
	 * Point pretty printing. Delegates to the point's custom "toString()" method if exists,
	 * else simply prints x and y coordinates.
	 * @example
	 *      xy.toString({x:5, y:42})
	 *      // → "(5;42)"
	 * @example
	 *      xy.toString({x:5,y:42,toString:function() {return this.x+":"+this.y;}})
	 *      // → "5:42"
	 * @param {!XY} p - point object with {x,y}
	 * @returns {string} <code>"(x;y)"</code>
	 */
	function toString(p) {
	    // Try a custom toString first, and fallback to own implementation if none
	    var s = p.toString();
	    return (s === '[object Object]' ? toStringBase(p) : s);
	}
	
	
	/**
	 * Compare two points component-wise. Ordered by y axis first, then x axis.
	 * @param {!XY} a - point object with {x,y}
	 * @param {!XY} b - point object with {x,y}
	 * @return {number} <code>&lt; 0</code> if <code>a &lt; b</code>,
	 *         <code>&gt; 0</code> if <code>a &gt; b</code>, 
	 *         <code>0</code> otherwise.
	 */
	function compare(a, b) {
	    if (a.y === b.y) {
	        return a.x - b.x;
	    } else {
	        return a.y - b.y;
	    }
	}
	
	/**
	 * Test two Point objects for equality.
	 * @param {!XY} a - point object with {x,y}
	 * @param {!XY} b - point object with {x,y}
	 * @return {boolean} <code>True</code> if <code>a == b</code>, <code>false</code> otherwise.
	 */
	function equals(a, b) {
	    return a.x === b.x && a.y === b.y;
	}
	
	
	module.exports = {
	    toString: toString,
	    toStringBase: toStringBase,
	    compare: compare,
	    equals: equals
	};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 * 
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 * 
	 * All rights reserved.
	 * 
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	"use strict";
	
	
	/*
	 * Note
	 * ====
	 * the structure of this JavaScript version of poly2tri intentionally follows
	 * as closely as possible the structure of the reference C++ version, to make it 
	 * easier to keep the 2 versions in sync.
	 */
	
	var xy = __webpack_require__(5);
	
	// ------------------------------------------------------------------------Point
	/**
	 * Construct a point
	 * @example
	 *      var point = new poly2tri.Point(150, 150);
	 * @public
	 * @constructor
	 * @struct
	 * @param {number=} x    coordinate (0 if undefined)
	 * @param {number=} y    coordinate (0 if undefined)
	 */
	var Point = function(x, y) {
	    /**
	     * @type {number}
	     * @expose
	     */
	    this.x = +x || 0;
	    /**
	     * @type {number}
	     * @expose
	     */
	    this.y = +y || 0;
	
	    // All extra fields added to Point are prefixed with _p2t_
	    // to avoid collisions if custom Point class is used.
	
	    /**
	     * The edges this point constitutes an upper ending point
	     * @private
	     * @type {Array.<Edge>}
	     */
	    this._p2t_edge_list = null;
	};
	
	/**
	 * For pretty printing
	 * @example
	 *      "p=" + new poly2tri.Point(5,42)
	 *      // → "p=(5;42)"
	 * @returns {string} <code>"(x;y)"</code>
	 */
	Point.prototype.toString = function() {
	    return xy.toStringBase(this);
	};
	
	/**
	 * JSON output, only coordinates
	 * @example
	 *      JSON.stringify(new poly2tri.Point(1,2))
	 *      // → '{"x":1,"y":2}'
	 */
	Point.prototype.toJSON = function() {
	    return { x: this.x, y: this.y };
	};
	
	/**
	 * Creates a copy of this Point object.
	 * @return {Point} new cloned point
	 */
	Point.prototype.clone = function() {
	    return new Point(this.x, this.y);
	};
	
	/**
	 * Set this Point instance to the origo. <code>(0; 0)</code>
	 * @return {Point} this (for chaining)
	 */
	Point.prototype.set_zero = function() {
	    this.x = 0.0;
	    this.y = 0.0;
	    return this; // for chaining
	};
	
	/**
	 * Set the coordinates of this instance.
	 * @param {number} x   coordinate
	 * @param {number} y   coordinate
	 * @return {Point} this (for chaining)
	 */
	Point.prototype.set = function(x, y) {
	    this.x = +x || 0;
	    this.y = +y || 0;
	    return this; // for chaining
	};
	
	/**
	 * Negate this Point instance. (component-wise)
	 * @return {Point} this (for chaining)
	 */
	Point.prototype.negate = function() {
	    this.x = -this.x;
	    this.y = -this.y;
	    return this; // for chaining
	};
	
	/**
	 * Add another Point object to this instance. (component-wise)
	 * @param {!Point} n - Point object.
	 * @return {Point} this (for chaining)
	 */
	Point.prototype.add = function(n) {
	    this.x += n.x;
	    this.y += n.y;
	    return this; // for chaining
	};
	
	/**
	 * Subtract this Point instance with another point given. (component-wise)
	 * @param {!Point} n - Point object.
	 * @return {Point} this (for chaining)
	 */
	Point.prototype.sub = function(n) {
	    this.x -= n.x;
	    this.y -= n.y;
	    return this; // for chaining
	};
	
	/**
	 * Multiply this Point instance by a scalar. (component-wise)
	 * @param {number} s   scalar.
	 * @return {Point} this (for chaining)
	 */
	Point.prototype.mul = function(s) {
	    this.x *= s;
	    this.y *= s;
	    return this; // for chaining
	};
	
	/**
	 * Return the distance of this Point instance from the origo.
	 * @return {number} distance
	 */
	Point.prototype.length = function() {
	    return Math.sqrt(this.x * this.x + this.y * this.y);
	};
	
	/**
	 * Normalize this Point instance (as a vector).
	 * @return {number} The original distance of this instance from the origo.
	 */
	Point.prototype.normalize = function() {
	    var len = this.length();
	    this.x /= len;
	    this.y /= len;
	    return len;
	};
	
	/**
	 * Test this Point object with another for equality.
	 * @param {!XY} p - any "Point like" object with {x,y}
	 * @return {boolean} <code>true</code> if same x and y coordinates, <code>false</code> otherwise.
	 */
	Point.prototype.equals = function(p) {
	    return this.x === p.x && this.y === p.y;
	};
	
	
	// -----------------------------------------------------Point ("static" methods)
	
	/**
	 * Negate a point component-wise and return the result as a new Point object.
	 * @param {!XY} p - any "Point like" object with {x,y}
	 * @return {Point} the resulting Point object.
	 */
	Point.negate = function(p) {
	    return new Point(-p.x, -p.y);
	};
	
	/**
	 * Add two points component-wise and return the result as a new Point object.
	 * @param {!XY} a - any "Point like" object with {x,y}
	 * @param {!XY} b - any "Point like" object with {x,y}
	 * @return {Point} the resulting Point object.
	 */
	Point.add = function(a, b) {
	    return new Point(a.x + b.x, a.y + b.y);
	};
	
	/**
	 * Subtract two points component-wise and return the result as a new Point object.
	 * @param {!XY} a - any "Point like" object with {x,y}
	 * @param {!XY} b - any "Point like" object with {x,y}
	 * @return {Point} the resulting Point object.
	 */
	Point.sub = function(a, b) {
	    return new Point(a.x - b.x, a.y - b.y);
	};
	
	/**
	 * Multiply a point by a scalar and return the result as a new Point object.
	 * @param {number} s - the scalar
	 * @param {!XY} p - any "Point like" object with {x,y}
	 * @return {Point} the resulting Point object.
	 */
	Point.mul = function(s, p) {
	    return new Point(s * p.x, s * p.y);
	};
	
	/**
	 * Perform the cross product on either two points (this produces a scalar)
	 * or a point and a scalar (this produces a point).
	 * This function requires two parameters, either may be a Point object or a
	 * number.
	 * @param  {XY|number} a - Point object or scalar.
	 * @param  {XY|number} b - Point object or scalar.
	 * @return {Point|number} a Point object or a number, depending on the parameters.
	 */
	Point.cross = function(a, b) {
	    if (typeof(a) === 'number') {
	        if (typeof(b) === 'number') {
	            return a * b;
	        } else {
	            return new Point(-a * b.y, a * b.x);
	        }
	    } else {
	        if (typeof(b) === 'number') {
	            return new Point(b * a.y, -b * a.x);
	        } else {
	            return a.x * b.y - a.y * b.x;
	        }
	    }
	};
	
	
	// -----------------------------------------------------------------"Point-Like"
	/*
	 * The following functions operate on "Point" or any "Point like" object 
	 * with {x,y} (duck typing).
	 */
	
	Point.toString = xy.toString;
	Point.compare = xy.compare;
	Point.cmp = xy.compare; // backward compatibility
	Point.equals = xy.equals;
	
	/**
	 * Peform the dot product on two vectors.
	 * @public
	 * @param {!XY} a - any "Point like" object with {x,y}
	 * @param {!XY} b - any "Point like" object with {x,y}
	 * @return {number} The dot product
	 */
	Point.dot = function(a, b) {
	    return a.x * b.x + a.y * b.y;
	};
	
	
	// ---------------------------------------------------------Exports (public API)
	
	module.exports = Point;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 * 
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 *
	 * All rights reserved.
	 * 
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	/* jshint maxcomplexity:10 */
	
	"use strict";
	
	
	/*
	 * Note
	 * ====
	 * the structure of this JavaScript version of poly2tri intentionally follows
	 * as closely as possible the structure of the reference C++ version, to make it 
	 * easier to keep the 2 versions in sync.
	 */
	
	var xy = __webpack_require__(5);
	
	
	// ---------------------------------------------------------------------Triangle
	/**
	 * Triangle class.<br>
	 * Triangle-based data structures are known to have better performance than
	 * quad-edge structures.
	 * See: J. Shewchuk, "Triangle: Engineering a 2D Quality Mesh Generator and
	 * Delaunay Triangulator", "Triangulations in CGAL"
	 *
	 * @constructor
	 * @struct
	 * @param {!XY} pa  point object with {x,y}
	 * @param {!XY} pb  point object with {x,y}
	 * @param {!XY} pc  point object with {x,y}
	 */
	var Triangle = function(a, b, c) {
	    /**
	     * Triangle points
	     * @private
	     * @type {Array.<XY>}
	     */
	    this.points_ = [a, b, c];
	
	    /**
	     * Neighbor list
	     * @private
	     * @type {Array.<Triangle>}
	     */
	    this.neighbors_ = [null, null, null];
	
	    /**
	     * Has this triangle been marked as an interior triangle?
	     * @private
	     * @type {boolean}
	     */
	    this.interior_ = false;
	
	    /**
	     * Flags to determine if an edge is a Constrained edge
	     * @private
	     * @type {Array.<boolean>}
	     */
	    this.constrained_edge = [false, false, false];
	
	    /**
	     * Flags to determine if an edge is a Delauney edge
	     * @private
	     * @type {Array.<boolean>}
	     */
	    this.delaunay_edge = [false, false, false];
	};
	
	var p2s = xy.toString;
	/**
	 * For pretty printing ex. <code>"[(5;42)(10;20)(21;30)]"</code>.
	 * @public
	 * @return {string}
	 */
	Triangle.prototype.toString = function() {
	    return ("[" + p2s(this.points_[0]) + p2s(this.points_[1]) + p2s(this.points_[2]) + "]");
	};
	
	/**
	 * Get one vertice of the triangle.
	 * The output triangles of a triangulation have vertices which are references
	 * to the initial input points (not copies): any custom fields in the
	 * initial points can be retrieved in the output triangles.
	 * @example
	 *      var contour = [{x:100, y:100, id:1}, {x:100, y:300, id:2}, {x:300, y:300, id:3}];
	 *      var swctx = new poly2tri.SweepContext(contour);
	 *      swctx.triangulate();
	 *      var triangles = swctx.getTriangles();
	 *      typeof triangles[0].getPoint(0).id
	 *      // → "number"
	 * @param {number} index - vertice index: 0, 1 or 2
	 * @public
	 * @returns {XY}
	 */
	Triangle.prototype.getPoint = function(index) {
	    return this.points_[index];
	};
	
	/**
	 * For backward compatibility
	 * @function
	 * @deprecated use {@linkcode Triangle#getPoint} instead
	 */
	Triangle.prototype.GetPoint = Triangle.prototype.getPoint;
	
	/**
	 * Get all 3 vertices of the triangle as an array
	 * @public
	 * @return {Array.<XY>}
	 */
	// Method added in the JavaScript version (was not present in the c++ version)
	Triangle.prototype.getPoints = function() {
	    return this.points_;
	};
	
	/**
	 * @private
	 * @param {number} index
	 * @returns {?Triangle}
	 */
	Triangle.prototype.getNeighbor = function(index) {
	    return this.neighbors_[index];
	};
	
	/**
	 * Test if this Triangle contains the Point object given as parameter as one of its vertices.
	 * Only point references are compared, not values.
	 * @public
	 * @param {XY} point - point object with {x,y}
	 * @return {boolean} <code>True</code> if the Point object is of the Triangle's vertices,
	 *         <code>false</code> otherwise.
	 */
	Triangle.prototype.containsPoint = function(point) {
	    var points = this.points_;
	    // Here we are comparing point references, not values
	    return (point === points[0] || point === points[1] || point === points[2]);
	};
	
	/**
	 * Test if this Triangle contains the Edge object given as parameter as its
	 * bounding edges. Only point references are compared, not values.
	 * @private
	 * @param {Edge} edge
	 * @return {boolean} <code>True</code> if the Edge object is of the Triangle's bounding
	 *         edges, <code>false</code> otherwise.
	 */
	Triangle.prototype.containsEdge = function(edge) {
	    return this.containsPoint(edge.p) && this.containsPoint(edge.q);
	};
	
	/**
	 * Test if this Triangle contains the two Point objects given as parameters among its vertices.
	 * Only point references are compared, not values.
	 * @param {XY} p1 - point object with {x,y}
	 * @param {XY} p2 - point object with {x,y}
	 * @return {boolean}
	 */
	Triangle.prototype.containsPoints = function(p1, p2) {
	    return this.containsPoint(p1) && this.containsPoint(p2);
	};
	
	/**
	 * Has this triangle been marked as an interior triangle?
	 * @returns {boolean}
	 */
	Triangle.prototype.isInterior = function() {
	    return this.interior_;
	};
	
	/**
	 * Mark this triangle as an interior triangle
	 * @private
	 * @param {boolean} interior
	 * @returns {Triangle} this
	 */
	Triangle.prototype.setInterior = function(interior) {
	    this.interior_ = interior;
	    return this;
	};
	
	/**
	 * Update neighbor pointers.
	 * @private
	 * @param {XY} p1 - point object with {x,y}
	 * @param {XY} p2 - point object with {x,y}
	 * @param {Triangle} t Triangle object.
	 * @throws {Error} if can't find objects
	 */
	Triangle.prototype.markNeighborPointers = function(p1, p2, t) {
	    var points = this.points_;
	    // Here we are comparing point references, not values
	    if ((p1 === points[2] && p2 === points[1]) || (p1 === points[1] && p2 === points[2])) {
	        this.neighbors_[0] = t;
	    } else if ((p1 === points[0] && p2 === points[2]) || (p1 === points[2] && p2 === points[0])) {
	        this.neighbors_[1] = t;
	    } else if ((p1 === points[0] && p2 === points[1]) || (p1 === points[1] && p2 === points[0])) {
	        this.neighbors_[2] = t;
	    } else {
	        throw new Error('poly2tri Invalid Triangle.markNeighborPointers() call');
	    }
	};
	
	/**
	 * Exhaustive search to update neighbor pointers
	 * @private
	 * @param {!Triangle} t
	 */
	Triangle.prototype.markNeighbor = function(t) {
	    var points = this.points_;
	    if (t.containsPoints(points[1], points[2])) {
	        this.neighbors_[0] = t;
	        t.markNeighborPointers(points[1], points[2], this);
	    } else if (t.containsPoints(points[0], points[2])) {
	        this.neighbors_[1] = t;
	        t.markNeighborPointers(points[0], points[2], this);
	    } else if (t.containsPoints(points[0], points[1])) {
	        this.neighbors_[2] = t;
	        t.markNeighborPointers(points[0], points[1], this);
	    }
	};
	
	
	Triangle.prototype.clearNeighbors = function() {
	    this.neighbors_[0] = null;
	    this.neighbors_[1] = null;
	    this.neighbors_[2] = null;
	};
	
	Triangle.prototype.clearDelaunayEdges = function() {
	    this.delaunay_edge[0] = false;
	    this.delaunay_edge[1] = false;
	    this.delaunay_edge[2] = false;
	};
	
	/**
	 * Returns the point clockwise to the given point.
	 * @private
	 * @param {XY} p - point object with {x,y}
	 */
	Triangle.prototype.pointCW = function(p) {
	    var points = this.points_;
	    // Here we are comparing point references, not values
	    if (p === points[0]) {
	        return points[2];
	    } else if (p === points[1]) {
	        return points[0];
	    } else if (p === points[2]) {
	        return points[1];
	    } else {
	        return null;
	    }
	};
	
	/**
	 * Returns the point counter-clockwise to the given point.
	 * @private
	 * @param {XY} p - point object with {x,y}
	 */
	Triangle.prototype.pointCCW = function(p) {
	    var points = this.points_;
	    // Here we are comparing point references, not values
	    if (p === points[0]) {
	        return points[1];
	    } else if (p === points[1]) {
	        return points[2];
	    } else if (p === points[2]) {
	        return points[0];
	    } else {
	        return null;
	    }
	};
	
	/**
	 * Returns the neighbor clockwise to given point.
	 * @private
	 * @param {XY} p - point object with {x,y}
	 */
	Triangle.prototype.neighborCW = function(p) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        return this.neighbors_[1];
	    } else if (p === this.points_[1]) {
	        return this.neighbors_[2];
	    } else {
	        return this.neighbors_[0];
	    }
	};
	
	/**
	 * Returns the neighbor counter-clockwise to given point.
	 * @private
	 * @param {XY} p - point object with {x,y}
	 */
	Triangle.prototype.neighborCCW = function(p) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        return this.neighbors_[2];
	    } else if (p === this.points_[1]) {
	        return this.neighbors_[0];
	    } else {
	        return this.neighbors_[1];
	    }
	};
	
	Triangle.prototype.getConstrainedEdgeCW = function(p) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        return this.constrained_edge[1];
	    } else if (p === this.points_[1]) {
	        return this.constrained_edge[2];
	    } else {
	        return this.constrained_edge[0];
	    }
	};
	
	Triangle.prototype.getConstrainedEdgeCCW = function(p) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        return this.constrained_edge[2];
	    } else if (p === this.points_[1]) {
	        return this.constrained_edge[0];
	    } else {
	        return this.constrained_edge[1];
	    }
	};
	
	// Additional check from Java version (see issue #88)
	Triangle.prototype.getConstrainedEdgeAcross = function(p) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        return this.constrained_edge[0];
	    } else if (p === this.points_[1]) {
	        return this.constrained_edge[1];
	    } else {
	        return this.constrained_edge[2];
	    }
	};
	
	Triangle.prototype.setConstrainedEdgeCW = function(p, ce) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        this.constrained_edge[1] = ce;
	    } else if (p === this.points_[1]) {
	        this.constrained_edge[2] = ce;
	    } else {
	        this.constrained_edge[0] = ce;
	    }
	};
	
	Triangle.prototype.setConstrainedEdgeCCW = function(p, ce) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        this.constrained_edge[2] = ce;
	    } else if (p === this.points_[1]) {
	        this.constrained_edge[0] = ce;
	    } else {
	        this.constrained_edge[1] = ce;
	    }
	};
	
	Triangle.prototype.getDelaunayEdgeCW = function(p) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        return this.delaunay_edge[1];
	    } else if (p === this.points_[1]) {
	        return this.delaunay_edge[2];
	    } else {
	        return this.delaunay_edge[0];
	    }
	};
	
	Triangle.prototype.getDelaunayEdgeCCW = function(p) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        return this.delaunay_edge[2];
	    } else if (p === this.points_[1]) {
	        return this.delaunay_edge[0];
	    } else {
	        return this.delaunay_edge[1];
	    }
	};
	
	Triangle.prototype.setDelaunayEdgeCW = function(p, e) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        this.delaunay_edge[1] = e;
	    } else if (p === this.points_[1]) {
	        this.delaunay_edge[2] = e;
	    } else {
	        this.delaunay_edge[0] = e;
	    }
	};
	
	Triangle.prototype.setDelaunayEdgeCCW = function(p, e) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        this.delaunay_edge[2] = e;
	    } else if (p === this.points_[1]) {
	        this.delaunay_edge[0] = e;
	    } else {
	        this.delaunay_edge[1] = e;
	    }
	};
	
	/**
	 * The neighbor across to given point.
	 * @private
	 * @param {XY} p - point object with {x,y}
	 * @returns {Triangle}
	 */
	Triangle.prototype.neighborAcross = function(p) {
	    // Here we are comparing point references, not values
	    if (p === this.points_[0]) {
	        return this.neighbors_[0];
	    } else if (p === this.points_[1]) {
	        return this.neighbors_[1];
	    } else {
	        return this.neighbors_[2];
	    }
	};
	
	/**
	 * @private
	 * @param {!Triangle} t Triangle object.
	 * @param {XY} p - point object with {x,y}
	 */
	Triangle.prototype.oppositePoint = function(t, p) {
	    var cw = t.pointCW(p);
	    return this.pointCW(cw);
	};
	
	/**
	 * Legalize triangle by rotating clockwise around oPoint
	 * @private
	 * @param {XY} opoint - point object with {x,y}
	 * @param {XY} npoint - point object with {x,y}
	 * @throws {Error} if oPoint can not be found
	 */
	Triangle.prototype.legalize = function(opoint, npoint) {
	    var points = this.points_;
	    // Here we are comparing point references, not values
	    if (opoint === points[0]) {
	        points[1] = points[0];
	        points[0] = points[2];
	        points[2] = npoint;
	    } else if (opoint === points[1]) {
	        points[2] = points[1];
	        points[1] = points[0];
	        points[0] = npoint;
	    } else if (opoint === points[2]) {
	        points[0] = points[2];
	        points[2] = points[1];
	        points[1] = npoint;
	    } else {
	        throw new Error('poly2tri Invalid Triangle.legalize() call');
	    }
	};
	
	/**
	 * Returns the index of a point in the triangle. 
	 * The point *must* be a reference to one of the triangle's vertices.
	 * @private
	 * @param {XY} p - point object with {x,y}
	 * @returns {number} index 0, 1 or 2
	 * @throws {Error} if p can not be found
	 */
	Triangle.prototype.index = function(p) {
	    var points = this.points_;
	    // Here we are comparing point references, not values
	    if (p === points[0]) {
	        return 0;
	    } else if (p === points[1]) {
	        return 1;
	    } else if (p === points[2]) {
	        return 2;
	    } else {
	        throw new Error('poly2tri Invalid Triangle.index() call');
	    }
	};
	
	/**
	 * @private
	 * @param {XY} p1 - point object with {x,y}
	 * @param {XY} p2 - point object with {x,y}
	 * @return {number} index 0, 1 or 2, or -1 if errror
	 */
	Triangle.prototype.edgeIndex = function(p1, p2) {
	    var points = this.points_;
	    // Here we are comparing point references, not values
	    if (p1 === points[0]) {
	        if (p2 === points[1]) {
	            return 2;
	        } else if (p2 === points[2]) {
	            return 1;
	        }
	    } else if (p1 === points[1]) {
	        if (p2 === points[2]) {
	            return 0;
	        } else if (p2 === points[0]) {
	            return 2;
	        }
	    } else if (p1 === points[2]) {
	        if (p2 === points[0]) {
	            return 1;
	        } else if (p2 === points[1]) {
	            return 0;
	        }
	    }
	    return -1;
	};
	
	/**
	 * Mark an edge of this triangle as constrained.
	 * @private
	 * @param {number} index - edge index
	 */
	Triangle.prototype.markConstrainedEdgeByIndex = function(index) {
	    this.constrained_edge[index] = true;
	};
	/**
	 * Mark an edge of this triangle as constrained.
	 * @private
	 * @param {Edge} edge instance
	 */
	Triangle.prototype.markConstrainedEdgeByEdge = function(edge) {
	    this.markConstrainedEdgeByPoints(edge.p, edge.q);
	};
	/**
	 * Mark an edge of this triangle as constrained.
	 * This method takes two Point instances defining the edge of the triangle.
	 * @private
	 * @param {XY} p - point object with {x,y}
	 * @param {XY} q - point object with {x,y}
	 */
	Triangle.prototype.markConstrainedEdgeByPoints = function(p, q) {
	    var points = this.points_;
	    // Here we are comparing point references, not values        
	    if ((q === points[0] && p === points[1]) || (q === points[1] && p === points[0])) {
	        this.constrained_edge[2] = true;
	    } else if ((q === points[0] && p === points[2]) || (q === points[2] && p === points[0])) {
	        this.constrained_edge[1] = true;
	    } else if ((q === points[1] && p === points[2]) || (q === points[2] && p === points[1])) {
	        this.constrained_edge[0] = true;
	    }
	};
	
	
	// ---------------------------------------------------------Exports (public API)
	
	module.exports = Triangle;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 * 
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 * 
	 * All rights reserved.
	 * 
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	/* jshint latedef:nofunc, maxcomplexity:9 */
	
	"use strict";
	
	/**
	 * This 'Sweep' module is present in order to keep this JavaScript version
	 * as close as possible to the reference C++ version, even though almost all
	 * functions could be declared as methods on the {@linkcode module:sweepcontext~SweepContext} object.
	 * @module
	 * @private
	 */
	
	/*
	 * Note
	 * ====
	 * the structure of this JavaScript version of poly2tri intentionally follows
	 * as closely as possible the structure of the reference C++ version, to make it 
	 * easier to keep the 2 versions in sync.
	 */
	
	var assert = __webpack_require__(9);
	var PointError = __webpack_require__(4);
	var Triangle = __webpack_require__(7);
	var Node = __webpack_require__(10).Node;
	
	
	// ------------------------------------------------------------------------utils
	
	var utils = __webpack_require__(11);
	
	/** @const */
	var EPSILON = utils.EPSILON;
	
	/** @const */
	var Orientation = utils.Orientation;
	/** @const */
	var orient2d = utils.orient2d;
	/** @const */
	var inScanArea = utils.inScanArea;
	/** @const */
	var isAngleObtuse = utils.isAngleObtuse;
	
	
	// ------------------------------------------------------------------------Sweep
	
	/**
	 * Triangulate the polygon with holes and Steiner points.
	 * Do this AFTER you've added the polyline, holes, and Steiner points
	 * @private
	 * @param {!SweepContext} tcx - SweepContext object
	 */
	function triangulate(tcx) {
	    tcx.initTriangulation();
	    tcx.createAdvancingFront();
	    // Sweep points; build mesh
	    sweepPoints(tcx);
	    // Clean up
	    finalizationPolygon(tcx);
	}
	
	/**
	 * Start sweeping the Y-sorted point set from bottom to top
	 * @param {!SweepContext} tcx - SweepContext object
	 */
	function sweepPoints(tcx) {
	    var i, len = tcx.pointCount();
	    for (i = 1; i < len; ++i) {
	        var point = tcx.getPoint(i);
	        var node = pointEvent(tcx, point);
	        var edges = point._p2t_edge_list;
	        for (var j = 0; edges && j < edges.length; ++j) {
	            edgeEventByEdge(tcx, edges[j], node);
	        }
	    }
	}
	
	/**
	 * @param {!SweepContext} tcx - SweepContext object
	 */
	function finalizationPolygon(tcx) {
	    // Get an Internal triangle to start with
	    var t = tcx.front().head().next.triangle;
	    var p = tcx.front().head().next.point;
	    while (!t.getConstrainedEdgeCW(p)) {
	        t = t.neighborCCW(p);
	    }
	
	    // Collect interior triangles constrained by edges
	    tcx.meshClean(t);
	}
	
	/**
	 * Find closes node to the left of the new point and
	 * create a new triangle. If needed new holes and basins
	 * will be filled to.
	 * @param {!SweepContext} tcx - SweepContext object
	 * @param {!XY} point   Point
	 */
	function pointEvent(tcx, point) {
	    var node = tcx.locateNode(point);
	    var new_node = newFrontTriangle(tcx, point, node);
	
	    // Only need to check +epsilon since point never have smaller
	    // x value than node due to how we fetch nodes from the front
	    if (point.x <= node.point.x + (EPSILON)) {
	        fill(tcx, node);
	    }
	
	    //tcx.AddNode(new_node);
	
	    fillAdvancingFront(tcx, new_node);
	    return new_node;
	}
	
	function edgeEventByEdge(tcx, edge, node) {
	    tcx.edge_event.constrained_edge = edge;
	    tcx.edge_event.right = (edge.p.x > edge.q.x);
	
	    if (isEdgeSideOfTriangle(node.triangle, edge.p, edge.q)) {
	        return;
	    }
	
	    // For now we will do all needed filling
	    // TODO: integrate with flip process might give some better performance
	    //       but for now this avoid the issue with cases that needs both flips and fills
	    fillEdgeEvent(tcx, edge, node);
	    edgeEventByPoints(tcx, edge.p, edge.q, node.triangle, edge.q);
	}
	
	function edgeEventByPoints(tcx, ep, eq, triangle, point) {
	    if (isEdgeSideOfTriangle(triangle, ep, eq)) {
	        return;
	    }
	
	    var p1 = triangle.pointCCW(point);
	    var o1 = orient2d(eq, p1, ep);
	    if (o1 === Orientation.COLLINEAR) {
	        // TODO integrate here changes from C++ version
	        // (C++ repo revision 09880a869095 dated March 8, 2011)
	        throw new PointError('poly2tri EdgeEvent: Collinear not supported!', [eq, p1, ep]);
	    }
	
	    var p2 = triangle.pointCW(point);
	    var o2 = orient2d(eq, p2, ep);
	    if (o2 === Orientation.COLLINEAR) {
	        // TODO integrate here changes from C++ version
	        // (C++ repo revision 09880a869095 dated March 8, 2011)
	        throw new PointError('poly2tri EdgeEvent: Collinear not supported!', [eq, p2, ep]);
	    }
	
	    if (o1 === o2) {
	        // Need to decide if we are rotating CW or CCW to get to a triangle
	        // that will cross edge
	        if (o1 === Orientation.CW) {
	            triangle = triangle.neighborCCW(point);
	        } else {
	            triangle = triangle.neighborCW(point);
	        }
	        edgeEventByPoints(tcx, ep, eq, triangle, point);
	    } else {
	        // This triangle crosses constraint so lets flippin start!
	        flipEdgeEvent(tcx, ep, eq, triangle, point);
	    }
	}
	
	function isEdgeSideOfTriangle(triangle, ep, eq) {
	    var index = triangle.edgeIndex(ep, eq);
	    if (index !== -1) {
	        triangle.markConstrainedEdgeByIndex(index);
	        var t = triangle.getNeighbor(index);
	        if (t) {
	            t.markConstrainedEdgeByPoints(ep, eq);
	        }
	        return true;
	    }
	    return false;
	}
	
	/**
	 * Creates a new front triangle and legalize it
	 * @param {!SweepContext} tcx - SweepContext object
	 */
	function newFrontTriangle(tcx, point, node) {
	    var triangle = new Triangle(point, node.point, node.next.point);
	
	    triangle.markNeighbor(node.triangle);
	    tcx.addToMap(triangle);
	
	    var new_node = new Node(point);
	    new_node.next = node.next;
	    new_node.prev = node;
	    node.next.prev = new_node;
	    node.next = new_node;
	
	    if (!legalize(tcx, triangle)) {
	        tcx.mapTriangleToNodes(triangle);
	    }
	
	    return new_node;
	}
	
	/**
	 * Adds a triangle to the advancing front to fill a hole.
	 * @param {!SweepContext} tcx - SweepContext object
	 * @param node - middle node, that is the bottom of the hole
	 */
	function fill(tcx, node) {
	    var triangle = new Triangle(node.prev.point, node.point, node.next.point);
	
	    // TODO: should copy the constrained_edge value from neighbor triangles
	    //       for now constrained_edge values are copied during the legalize
	    triangle.markNeighbor(node.prev.triangle);
	    triangle.markNeighbor(node.triangle);
	
	    tcx.addToMap(triangle);
	
	    // Update the advancing front
	    node.prev.next = node.next;
	    node.next.prev = node.prev;
	
	
	    // If it was legalized the triangle has already been mapped
	    if (!legalize(tcx, triangle)) {
	        tcx.mapTriangleToNodes(triangle);
	    }
	
	    //tcx.removeNode(node);
	}
	
	/**
	 * Fills holes in the Advancing Front
	 * @param {!SweepContext} tcx - SweepContext object
	 */
	function fillAdvancingFront(tcx, n) {
	    // Fill right holes
	    var node = n.next;
	    while (node.next) {
	        // TODO integrate here changes from C++ version
	        // (C++ repo revision acf81f1f1764 dated April 7, 2012)
	        if (isAngleObtuse(node.point, node.next.point, node.prev.point)) {
	            break;
	        }
	        fill(tcx, node);
	        node = node.next;
	    }
	
	    // Fill left holes
	    node = n.prev;
	    while (node.prev) {
	        // TODO integrate here changes from C++ version
	        // (C++ repo revision acf81f1f1764 dated April 7, 2012)
	        if (isAngleObtuse(node.point, node.next.point, node.prev.point)) {
	            break;
	        }
	        fill(tcx, node);
	        node = node.prev;
	    }
	
	    // Fill right basins
	    if (n.next && n.next.next) {
	        if (isBasinAngleRight(n)) {
	            fillBasin(tcx, n);
	        }
	    }
	}
	
	/**
	 * The basin angle is decided against the horizontal line [1,0].
	 * @param {Node} node
	 * @return {boolean} true if angle < 3*π/4
	 */
	function isBasinAngleRight(node) {
	    var ax = node.point.x - node.next.next.point.x;
	    var ay = node.point.y - node.next.next.point.y;
	    assert(ay >= 0, "unordered y");
	    return (ax >= 0 || Math.abs(ax) < ay);
	}
	
	/**
	 * Returns true if triangle was legalized
	 * @param {!SweepContext} tcx - SweepContext object
	 * @return {boolean}
	 */
	function legalize(tcx, t) {
	    // To legalize a triangle we start by finding if any of the three edges
	    // violate the Delaunay condition
	    for (var i = 0; i < 3; ++i) {
	        if (t.delaunay_edge[i]) {
	            continue;
	        }
	        var ot = t.getNeighbor(i);
	        if (ot) {
	            var p = t.getPoint(i);
	            var op = ot.oppositePoint(t, p);
	            var oi = ot.index(op);
	
	            // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
	            // then we should not try to legalize
	            if (ot.constrained_edge[oi] || ot.delaunay_edge[oi]) {
	                t.constrained_edge[i] = ot.constrained_edge[oi];
	                continue;
	            }
	
	            var inside = inCircle(p, t.pointCCW(p), t.pointCW(p), op);
	            if (inside) {
	                // Lets mark this shared edge as Delaunay
	                t.delaunay_edge[i] = true;
	                ot.delaunay_edge[oi] = true;
	
	                // Lets rotate shared edge one vertex CW to legalize it
	                rotateTrianglePair(t, p, ot, op);
	
	                // We now got one valid Delaunay Edge shared by two triangles
	                // This gives us 4 new edges to check for Delaunay
	
	                // Make sure that triangle to node mapping is done only one time for a specific triangle
	                var not_legalized = !legalize(tcx, t);
	                if (not_legalized) {
	                    tcx.mapTriangleToNodes(t);
	                }
	
	                not_legalized = !legalize(tcx, ot);
	                if (not_legalized) {
	                    tcx.mapTriangleToNodes(ot);
	                }
	                // Reset the Delaunay edges, since they only are valid Delaunay edges
	                // until we add a new triangle or point.
	                // XXX: need to think about this. Can these edges be tried after we
	                //      return to previous recursive level?
	                t.delaunay_edge[i] = false;
	                ot.delaunay_edge[oi] = false;
	
	                // If triangle have been legalized no need to check the other edges since
	                // the recursive legalization will handles those so we can end here.
	                return true;
	            }
	        }
	    }
	    return false;
	}
	
	/**
	 * <b>Requirement</b>:<br>
	 * 1. a,b and c form a triangle.<br>
	 * 2. a and d is know to be on opposite side of bc<br>
	 * <pre>
	 *                a
	 *                +
	 *               / \
	 *              /   \
	 *            b/     \c
	 *            +-------+
	 *           /    d    \
	 *          /           \
	 * </pre>
	 * <b>Fact</b>: d has to be in area B to have a chance to be inside the circle formed by
	 *  a,b and c<br>
	 *  d is outside B if orient2d(a,b,d) or orient2d(c,a,d) is CW<br>
	 *  This preknowledge gives us a way to optimize the incircle test
	 * @param pa - triangle point, opposite d
	 * @param pb - triangle point
	 * @param pc - triangle point
	 * @param pd - point opposite a
	 * @return {boolean} true if d is inside circle, false if on circle edge
	 */
	function inCircle(pa, pb, pc, pd) {
	    var adx = pa.x - pd.x;
	    var ady = pa.y - pd.y;
	    var bdx = pb.x - pd.x;
	    var bdy = pb.y - pd.y;
	
	    var adxbdy = adx * bdy;
	    var bdxady = bdx * ady;
	    var oabd = adxbdy - bdxady;
	    if (oabd <= 0) {
	        return false;
	    }
	
	    var cdx = pc.x - pd.x;
	    var cdy = pc.y - pd.y;
	
	    var cdxady = cdx * ady;
	    var adxcdy = adx * cdy;
	    var ocad = cdxady - adxcdy;
	    if (ocad <= 0) {
	        return false;
	    }
	
	    var bdxcdy = bdx * cdy;
	    var cdxbdy = cdx * bdy;
	
	    var alift = adx * adx + ady * ady;
	    var blift = bdx * bdx + bdy * bdy;
	    var clift = cdx * cdx + cdy * cdy;
	
	    var det = alift * (bdxcdy - cdxbdy) + blift * ocad + clift * oabd;
	    return det > 0;
	}
	
	/**
	 * Rotates a triangle pair one vertex CW
	 *<pre>
	 *       n2                    n2
	 *  P +-----+             P +-----+
	 *    | t  /|               |\  t |
	 *    |   / |               | \   |
	 *  n1|  /  |n3           n1|  \  |n3
	 *    | /   |    after CW   |   \ |
	 *    |/ oT |               | oT \|
	 *    +-----+ oP            +-----+
	 *       n4                    n4
	 * </pre>
	 */
	function rotateTrianglePair(t, p, ot, op) {
	    var n1, n2, n3, n4;
	    n1 = t.neighborCCW(p);
	    n2 = t.neighborCW(p);
	    n3 = ot.neighborCCW(op);
	    n4 = ot.neighborCW(op);
	
	    var ce1, ce2, ce3, ce4;
	    ce1 = t.getConstrainedEdgeCCW(p);
	    ce2 = t.getConstrainedEdgeCW(p);
	    ce3 = ot.getConstrainedEdgeCCW(op);
	    ce4 = ot.getConstrainedEdgeCW(op);
	
	    var de1, de2, de3, de4;
	    de1 = t.getDelaunayEdgeCCW(p);
	    de2 = t.getDelaunayEdgeCW(p);
	    de3 = ot.getDelaunayEdgeCCW(op);
	    de4 = ot.getDelaunayEdgeCW(op);
	
	    t.legalize(p, op);
	    ot.legalize(op, p);
	
	    // Remap delaunay_edge
	    ot.setDelaunayEdgeCCW(p, de1);
	    t.setDelaunayEdgeCW(p, de2);
	    t.setDelaunayEdgeCCW(op, de3);
	    ot.setDelaunayEdgeCW(op, de4);
	
	    // Remap constrained_edge
	    ot.setConstrainedEdgeCCW(p, ce1);
	    t.setConstrainedEdgeCW(p, ce2);
	    t.setConstrainedEdgeCCW(op, ce3);
	    ot.setConstrainedEdgeCW(op, ce4);
	
	    // Remap neighbors
	    // XXX: might optimize the markNeighbor by keeping track of
	    //      what side should be assigned to what neighbor after the
	    //      rotation. Now mark neighbor does lots of testing to find
	    //      the right side.
	    t.clearNeighbors();
	    ot.clearNeighbors();
	    if (n1) {
	        ot.markNeighbor(n1);
	    }
	    if (n2) {
	        t.markNeighbor(n2);
	    }
	    if (n3) {
	        t.markNeighbor(n3);
	    }
	    if (n4) {
	        ot.markNeighbor(n4);
	    }
	    t.markNeighbor(ot);
	}
	
	/**
	 * Fills a basin that has formed on the Advancing Front to the right
	 * of given node.<br>
	 * First we decide a left,bottom and right node that forms the
	 * boundaries of the basin. Then we do a reqursive fill.
	 *
	 * @param {!SweepContext} tcx - SweepContext object
	 * @param node - starting node, this or next node will be left node
	 */
	function fillBasin(tcx, node) {
	    if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
	        tcx.basin.left_node = node.next.next;
	    } else {
	        tcx.basin.left_node = node.next;
	    }
	
	    // Find the bottom and right node
	    tcx.basin.bottom_node = tcx.basin.left_node;
	    while (tcx.basin.bottom_node.next && tcx.basin.bottom_node.point.y >= tcx.basin.bottom_node.next.point.y) {
	        tcx.basin.bottom_node = tcx.basin.bottom_node.next;
	    }
	    if (tcx.basin.bottom_node === tcx.basin.left_node) {
	        // No valid basin
	        return;
	    }
	
	    tcx.basin.right_node = tcx.basin.bottom_node;
	    while (tcx.basin.right_node.next && tcx.basin.right_node.point.y < tcx.basin.right_node.next.point.y) {
	        tcx.basin.right_node = tcx.basin.right_node.next;
	    }
	    if (tcx.basin.right_node === tcx.basin.bottom_node) {
	        // No valid basins
	        return;
	    }
	
	    tcx.basin.width = tcx.basin.right_node.point.x - tcx.basin.left_node.point.x;
	    tcx.basin.left_highest = tcx.basin.left_node.point.y > tcx.basin.right_node.point.y;
	
	    fillBasinReq(tcx, tcx.basin.bottom_node);
	}
	
	/**
	 * Recursive algorithm to fill a Basin with triangles
	 *
	 * @param {!SweepContext} tcx - SweepContext object
	 * @param node - bottom_node
	 */
	function fillBasinReq(tcx, node) {
	    // if shallow stop filling
	    if (isShallow(tcx, node)) {
	        return;
	    }
	
	    fill(tcx, node);
	
	    var o;
	    if (node.prev === tcx.basin.left_node && node.next === tcx.basin.right_node) {
	        return;
	    } else if (node.prev === tcx.basin.left_node) {
	        o = orient2d(node.point, node.next.point, node.next.next.point);
	        if (o === Orientation.CW) {
	            return;
	        }
	        node = node.next;
	    } else if (node.next === tcx.basin.right_node) {
	        o = orient2d(node.point, node.prev.point, node.prev.prev.point);
	        if (o === Orientation.CCW) {
	            return;
	        }
	        node = node.prev;
	    } else {
	        // Continue with the neighbor node with lowest Y value
	        if (node.prev.point.y < node.next.point.y) {
	            node = node.prev;
	        } else {
	            node = node.next;
	        }
	    }
	
	    fillBasinReq(tcx, node);
	}
	
	function isShallow(tcx, node) {
	    var height;
	    if (tcx.basin.left_highest) {
	        height = tcx.basin.left_node.point.y - node.point.y;
	    } else {
	        height = tcx.basin.right_node.point.y - node.point.y;
	    }
	
	    // if shallow stop filling
	    if (tcx.basin.width > height) {
	        return true;
	    }
	    return false;
	}
	
	function fillEdgeEvent(tcx, edge, node) {
	    if (tcx.edge_event.right) {
	        fillRightAboveEdgeEvent(tcx, edge, node);
	    } else {
	        fillLeftAboveEdgeEvent(tcx, edge, node);
	    }
	}
	
	function fillRightAboveEdgeEvent(tcx, edge, node) {
	    while (node.next.point.x < edge.p.x) {
	        // Check if next node is below the edge
	        if (orient2d(edge.q, node.next.point, edge.p) === Orientation.CCW) {
	            fillRightBelowEdgeEvent(tcx, edge, node);
	        } else {
	            node = node.next;
	        }
	    }
	}
	
	function fillRightBelowEdgeEvent(tcx, edge, node) {
	    if (node.point.x < edge.p.x) {
	        if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
	            // Concave
	            fillRightConcaveEdgeEvent(tcx, edge, node);
	        } else {
	            // Convex
	            fillRightConvexEdgeEvent(tcx, edge, node);
	            // Retry this one
	            fillRightBelowEdgeEvent(tcx, edge, node);
	        }
	    }
	}
	
	function fillRightConcaveEdgeEvent(tcx, edge, node) {
	    fill(tcx, node.next);
	    if (node.next.point !== edge.p) {
	        // Next above or below edge?
	        if (orient2d(edge.q, node.next.point, edge.p) === Orientation.CCW) {
	            // Below
	            if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
	                // Next is concave
	                fillRightConcaveEdgeEvent(tcx, edge, node);
	            } else {
	                // Next is convex
	                /* jshint noempty:false */
	            }
	        }
	    }
	}
	
	function fillRightConvexEdgeEvent(tcx, edge, node) {
	    // Next concave or convex?
	    if (orient2d(node.next.point, node.next.next.point, node.next.next.next.point) === Orientation.CCW) {
	        // Concave
	        fillRightConcaveEdgeEvent(tcx, edge, node.next);
	    } else {
	        // Convex
	        // Next above or below edge?
	        if (orient2d(edge.q, node.next.next.point, edge.p) === Orientation.CCW) {
	            // Below
	            fillRightConvexEdgeEvent(tcx, edge, node.next);
	        } else {
	            // Above
	            /* jshint noempty:false */
	        }
	    }
	}
	
	function fillLeftAboveEdgeEvent(tcx, edge, node) {
	    while (node.prev.point.x > edge.p.x) {
	        // Check if next node is below the edge
	        if (orient2d(edge.q, node.prev.point, edge.p) === Orientation.CW) {
	            fillLeftBelowEdgeEvent(tcx, edge, node);
	        } else {
	            node = node.prev;
	        }
	    }
	}
	
	function fillLeftBelowEdgeEvent(tcx, edge, node) {
	    if (node.point.x > edge.p.x) {
	        if (orient2d(node.point, node.prev.point, node.prev.prev.point) === Orientation.CW) {
	            // Concave
	            fillLeftConcaveEdgeEvent(tcx, edge, node);
	        } else {
	            // Convex
	            fillLeftConvexEdgeEvent(tcx, edge, node);
	            // Retry this one
	            fillLeftBelowEdgeEvent(tcx, edge, node);
	        }
	    }
	}
	
	function fillLeftConvexEdgeEvent(tcx, edge, node) {
	    // Next concave or convex?
	    if (orient2d(node.prev.point, node.prev.prev.point, node.prev.prev.prev.point) === Orientation.CW) {
	        // Concave
	        fillLeftConcaveEdgeEvent(tcx, edge, node.prev);
	    } else {
	        // Convex
	        // Next above or below edge?
	        if (orient2d(edge.q, node.prev.prev.point, edge.p) === Orientation.CW) {
	            // Below
	            fillLeftConvexEdgeEvent(tcx, edge, node.prev);
	        } else {
	            // Above
	            /* jshint noempty:false */
	        }
	    }
	}
	
	function fillLeftConcaveEdgeEvent(tcx, edge, node) {
	    fill(tcx, node.prev);
	    if (node.prev.point !== edge.p) {
	        // Next above or below edge?
	        if (orient2d(edge.q, node.prev.point, edge.p) === Orientation.CW) {
	            // Below
	            if (orient2d(node.point, node.prev.point, node.prev.prev.point) === Orientation.CW) {
	                // Next is concave
	                fillLeftConcaveEdgeEvent(tcx, edge, node);
	            } else {
	                // Next is convex
	                /* jshint noempty:false */
	            }
	        }
	    }
	}
	
	function flipEdgeEvent(tcx, ep, eq, t, p) {
	    var ot = t.neighborAcross(p);
	    assert(ot, "FLIP failed due to missing triangle!");
	
	    var op = ot.oppositePoint(t, p);
	
	    // Additional check from Java version (see issue #88)
	    if (t.getConstrainedEdgeAcross(p)) {
	        var index = t.index(p);
	        throw new PointError("poly2tri Intersecting Constraints",
	                [p, op, t.getPoint((index + 1) % 3), t.getPoint((index + 2) % 3)]);
	    }
	
	    if (inScanArea(p, t.pointCCW(p), t.pointCW(p), op)) {
	        // Lets rotate shared edge one vertex CW
	        rotateTrianglePair(t, p, ot, op);
	        tcx.mapTriangleToNodes(t);
	        tcx.mapTriangleToNodes(ot);
	
	        // XXX: in the original C++ code for the next 2 lines, we are
	        // comparing point values (and not pointers). In this JavaScript
	        // code, we are comparing point references (pointers). This works
	        // because we can't have 2 different points with the same values.
	        // But to be really equivalent, we should use "Point.equals" here.
	        if (p === eq && op === ep) {
	            if (eq === tcx.edge_event.constrained_edge.q && ep === tcx.edge_event.constrained_edge.p) {
	                t.markConstrainedEdgeByPoints(ep, eq);
	                ot.markConstrainedEdgeByPoints(ep, eq);
	                legalize(tcx, t);
	                legalize(tcx, ot);
	            } else {
	                // XXX: I think one of the triangles should be legalized here?
	                /* jshint noempty:false */
	            }
	        } else {
	            var o = orient2d(eq, op, ep);
	            t = nextFlipTriangle(tcx, o, t, ot, p, op);
	            flipEdgeEvent(tcx, ep, eq, t, p);
	        }
	    } else {
	        var newP = nextFlipPoint(ep, eq, ot, op);
	        flipScanEdgeEvent(tcx, ep, eq, t, ot, newP);
	        edgeEventByPoints(tcx, ep, eq, t, p);
	    }
	}
	
	/**
	 * After a flip we have two triangles and know that only one will still be
	 * intersecting the edge. So decide which to contiune with and legalize the other
	 *
	 * @param {!SweepContext} tcx - SweepContext object
	 * @param o - should be the result of an orient2d( eq, op, ep )
	 * @param t - triangle 1
	 * @param ot - triangle 2
	 * @param p - a point shared by both triangles
	 * @param op - another point shared by both triangles
	 * @return returns the triangle still intersecting the edge
	 */
	function nextFlipTriangle(tcx, o, t, ot, p, op) {
	    var edge_index;
	    if (o === Orientation.CCW) {
	        // ot is not crossing edge after flip
	        edge_index = ot.edgeIndex(p, op);
	        ot.delaunay_edge[edge_index] = true;
	        legalize(tcx, ot);
	        ot.clearDelaunayEdges();
	        return t;
	    }
	
	    // t is not crossing edge after flip
	    edge_index = t.edgeIndex(p, op);
	
	    t.delaunay_edge[edge_index] = true;
	    legalize(tcx, t);
	    t.clearDelaunayEdges();
	    return ot;
	}
	
	/**
	 * When we need to traverse from one triangle to the next we need
	 * the point in current triangle that is the opposite point to the next
	 * triangle.
	 */
	function nextFlipPoint(ep, eq, ot, op) {
	    var o2d = orient2d(eq, op, ep);
	    if (o2d === Orientation.CW) {
	        // Right
	        return ot.pointCCW(op);
	    } else if (o2d === Orientation.CCW) {
	        // Left
	        return ot.pointCW(op);
	    } else {
	        throw new PointError("poly2tri [Unsupported] nextFlipPoint: opposing point on constrained edge!", [eq, op, ep]);
	    }
	}
	
	/**
	 * Scan part of the FlipScan algorithm<br>
	 * When a triangle pair isn't flippable we will scan for the next
	 * point that is inside the flip triangle scan area. When found
	 * we generate a new flipEdgeEvent
	 *
	 * @param {!SweepContext} tcx - SweepContext object
	 * @param ep - last point on the edge we are traversing
	 * @param eq - first point on the edge we are traversing
	 * @param {!Triangle} flip_triangle - the current triangle sharing the point eq with edge
	 * @param t
	 * @param p
	 */
	function flipScanEdgeEvent(tcx, ep, eq, flip_triangle, t, p) {
	    var ot = t.neighborAcross(p);
	    assert(ot, "FLIP failed due to missing triangle");
	
	    var op = ot.oppositePoint(t, p);
	
	    if (inScanArea(eq, flip_triangle.pointCCW(eq), flip_triangle.pointCW(eq), op)) {
	        // flip with new edge op.eq
	        flipEdgeEvent(tcx, eq, op, ot, op);
	    } else {
	        var newP = nextFlipPoint(ep, eq, ot, op);
	        flipScanEdgeEvent(tcx, ep, eq, flip_triangle, ot, newP);
	    }
	}
	
	
	// ----------------------------------------------------------------------Exports
	
	exports.triangulate = triangulate;


/***/ }),
/* 9 */
/***/ (function(module, exports) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 *
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 *
	 * All rights reserved.
	 *
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	"use strict";
	
	/*
	 * Function added in the JavaScript version (was not present in the c++ version)
	 */
	
	/**
	 * assert and throw an exception.
	 *
	 * @private
	 * @param {boolean} condition   the condition which is asserted
	 * @param {string} message      the message which is display is condition is falsy
	 */
	function assert(condition, message) {
	    if (!condition) {
	        throw new Error(message || "Assert Failed");
	    }
	}
	module.exports = assert;
	
	


/***/ }),
/* 10 */
/***/ (function(module, exports) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 * 
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 * 
	 * All rights reserved.
	 * 
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	/* jshint maxcomplexity:11 */
	
	"use strict";
	
	
	/*
	 * Note
	 * ====
	 * the structure of this JavaScript version of poly2tri intentionally follows
	 * as closely as possible the structure of the reference C++ version, to make it 
	 * easier to keep the 2 versions in sync.
	 */
	
	
	// -------------------------------------------------------------------------Node
	
	/**
	 * Advancing front node
	 * @constructor
	 * @private
	 * @struct
	 * @param {!XY} p - Point
	 * @param {Triangle=} t triangle (optional)
	 */
	var Node = function(p, t) {
	    /** @type {XY} */
	    this.point = p;
	
	    /** @type {Triangle|null} */
	    this.triangle = t || null;
	
	    /** @type {Node|null} */
	    this.next = null;
	    /** @type {Node|null} */
	    this.prev = null;
	
	    /** @type {number} */
	    this.value = p.x;
	};
	
	// ---------------------------------------------------------------AdvancingFront
	/**
	 * @constructor
	 * @private
	 * @struct
	 * @param {Node} head
	 * @param {Node} tail
	 */
	var AdvancingFront = function(head, tail) {
	    /** @type {Node} */
	    this.head_ = head;
	    /** @type {Node} */
	    this.tail_ = tail;
	    /** @type {Node} */
	    this.search_node_ = head;
	};
	
	/** @return {Node} */
	AdvancingFront.prototype.head = function() {
	    return this.head_;
	};
	
	/** @param {Node} node */
	AdvancingFront.prototype.setHead = function(node) {
	    this.head_ = node;
	};
	
	/** @return {Node} */
	AdvancingFront.prototype.tail = function() {
	    return this.tail_;
	};
	
	/** @param {Node} node */
	AdvancingFront.prototype.setTail = function(node) {
	    this.tail_ = node;
	};
	
	/** @return {Node} */
	AdvancingFront.prototype.search = function() {
	    return this.search_node_;
	};
	
	/** @param {Node} node */
	AdvancingFront.prototype.setSearch = function(node) {
	    this.search_node_ = node;
	};
	
	/** @return {Node} */
	AdvancingFront.prototype.findSearchNode = function(/*x*/) {
	    // TODO: implement BST index
	    return this.search_node_;
	};
	
	/**
	 * @param {number} x value
	 * @return {Node}
	 */
	AdvancingFront.prototype.locateNode = function(x) {
	    var node = this.search_node_;
	
	    /* jshint boss:true */
	    if (x < node.value) {
	        while (node = node.prev) {
	            if (x >= node.value) {
	                this.search_node_ = node;
	                return node;
	            }
	        }
	    } else {
	        while (node = node.next) {
	            if (x < node.value) {
	                this.search_node_ = node.prev;
	                return node.prev;
	            }
	        }
	    }
	    return null;
	};
	
	/**
	 * @param {!XY} point - Point
	 * @return {Node}
	 */
	AdvancingFront.prototype.locatePoint = function(point) {
	    var px = point.x;
	    var node = this.findSearchNode(px);
	    var nx = node.point.x;
	
	    if (px === nx) {
	        // Here we are comparing point references, not values
	        if (point !== node.point) {
	            // We might have two nodes with same x value for a short time
	            if (point === node.prev.point) {
	                node = node.prev;
	            } else if (point === node.next.point) {
	                node = node.next;
	            } else {
	                throw new Error('poly2tri Invalid AdvancingFront.locatePoint() call');
	            }
	        }
	    } else if (px < nx) {
	        /* jshint boss:true */
	        while (node = node.prev) {
	            if (point === node.point) {
	                break;
	            }
	        }
	    } else {
	        while (node = node.next) {
	            if (point === node.point) {
	                break;
	            }
	        }
	    }
	
	    if (node) {
	        this.search_node_ = node;
	    }
	    return node;
	};
	
	
	// ----------------------------------------------------------------------Exports
	
	module.exports = AdvancingFront;
	module.exports.Node = Node;
	


/***/ }),
/* 11 */
/***/ (function(module, exports) {

	/*
	 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
	 * http://code.google.com/p/poly2tri/
	 * 
	 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
	 * https://github.com/r3mi/poly2tri.js
	 * 
	 * All rights reserved.
	 * 
	 * Distributed under the 3-clause BSD License, see LICENSE.txt
	 */
	
	"use strict";
	
	/**
	 * Precision to detect repeated or collinear points
	 * @private
	 * @const {number}
	 * @default
	 */
	var EPSILON = 1e-12;
	exports.EPSILON = EPSILON;
	
	/**
	 * @private
	 * @enum {number}
	 * @readonly
	 */
	var Orientation = {
	    "CW": 1,
	    "CCW": -1,
	    "COLLINEAR": 0
	};
	exports.Orientation = Orientation;
	
	
	/**
	 * Formula to calculate signed area<br>
	 * Positive if CCW<br>
	 * Negative if CW<br>
	 * 0 if collinear<br>
	 * <pre>
	 * A[P1,P2,P3]  =  (x1*y2 - y1*x2) + (x2*y3 - y2*x3) + (x3*y1 - y3*x1)
	 *              =  (x1-x3)*(y2-y3) - (y1-y3)*(x2-x3)
	 * </pre>
	 *
	 * @private
	 * @param {!XY} pa  point object with {x,y}
	 * @param {!XY} pb  point object with {x,y}
	 * @param {!XY} pc  point object with {x,y}
	 * @return {Orientation}
	 */
	function orient2d(pa, pb, pc) {
	    var detleft = (pa.x - pc.x) * (pb.y - pc.y);
	    var detright = (pa.y - pc.y) * (pb.x - pc.x);
	    var val = detleft - detright;
	    if (val > -(EPSILON) && val < (EPSILON)) {
	        return Orientation.COLLINEAR;
	    } else if (val > 0) {
	        return Orientation.CCW;
	    } else {
	        return Orientation.CW;
	    }
	}
	exports.orient2d = orient2d;
	
	
	/**
	 *
	 * @private
	 * @param {!XY} pa  point object with {x,y}
	 * @param {!XY} pb  point object with {x,y}
	 * @param {!XY} pc  point object with {x,y}
	 * @param {!XY} pd  point object with {x,y}
	 * @return {boolean}
	 */
	function inScanArea(pa, pb, pc, pd) {
	    var oadb = (pa.x - pb.x) * (pd.y - pb.y) - (pd.x - pb.x) * (pa.y - pb.y);
	    if (oadb >= -EPSILON) {
	        return false;
	    }
	
	    var oadc = (pa.x - pc.x) * (pd.y - pc.y) - (pd.x - pc.x) * (pa.y - pc.y);
	    if (oadc <= EPSILON) {
	        return false;
	    }
	    return true;
	}
	exports.inScanArea = inScanArea;
	
	
	/**
	 * Check if the angle between (pa,pb) and (pa,pc) is obtuse i.e. (angle > π/2 || angle < -π/2)
	 *
	 * @private
	 * @param {!XY} pa  point object with {x,y}
	 * @param {!XY} pb  point object with {x,y}
	 * @param {!XY} pc  point object with {x,y}
	 * @return {boolean} true if angle is obtuse
	 */
	function isAngleObtuse(pa, pb, pc) {
	    var ax = pb.x - pa.x;
	    var ay = pb.y - pa.y;
	    var bx = pc.x - pa.x;
	    var by = pc.y - pa.y;
	    return (ax * bx + ay * by) < 0;
	}
	exports.isAngleObtuse = isAngleObtuse;
	


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_LOCAL_MODULE_0__;var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*** IMPORTS FROM imports-loader ***/
	(function() {
	var fix = module.exports=0;
	
	// Snap.svg 0.5.0
	//
	// Copyright (c) 2013 – 2017 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	//
	// build: 2017-02-06
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	// 
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	// 
	// http://www.apache.org/licenses/LICENSE-2.0
	// 
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	// ┌────────────────────────────────────────────────────────────┐ \\
	// │ Eve 0.5.0 - JavaScript Events Library                      │ \\
	// ├────────────────────────────────────────────────────────────┤ \\
	// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
	// └────────────────────────────────────────────────────────────┘ \\
	
	(function (glob) {
	    var version = "0.5.0",
	        has = "hasOwnProperty",
	        separator = /[\.\/]/,
	        comaseparator = /\s*,\s*/,
	        wildcard = "*",
	        fun = function () {},
	        numsort = function (a, b) {
	            return a - b;
	        },
	        current_event,
	        stop,
	        events = {n: {}},
	        firstDefined = function () {
	            for (var i = 0, ii = this.length; i < ii; i++) {
	                if (typeof this[i] != "undefined") {
	                    return this[i];
	                }
	            }
	        },
	        lastDefined = function () {
	            var i = this.length;
	            while (--i) {
	                if (typeof this[i] != "undefined") {
	                    return this[i];
	                }
	            }
	        },
	        objtos = Object.prototype.toString,
	        Str = String,
	        isArray = Array.isArray || function (ar) {
	            return ar instanceof Array || objtos.call(ar) == "[object Array]";
	        };
	    /*\
	     * eve
	     [ method ]
	
	     * Fires event with given `name`, given scope and other parameters.
	
	     > Arguments
	
	     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
	     - scope (object) context for the event handlers
	     - varargs (...) the rest of arguments will be sent to event handlers
	
	     = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
	    \*/
	        eve = function (name, scope) {
	            var e = events,
	                oldstop = stop,
	                args = Array.prototype.slice.call(arguments, 2),
	                listeners = eve.listeners(name),
	                z = 0,
	                f = false,
	                l,
	                indexed = [],
	                queue = {},
	                out = [],
	                ce = current_event,
	                errors = [];
	            out.firstDefined = firstDefined;
	            out.lastDefined = lastDefined;
	            current_event = name;
	            stop = 0;
	            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
	                indexed.push(listeners[i].zIndex);
	                if (listeners[i].zIndex < 0) {
	                    queue[listeners[i].zIndex] = listeners[i];
	                }
	            }
	            indexed.sort(numsort);
	            while (indexed[z] < 0) {
	                l = queue[indexed[z++]];
	                out.push(l.apply(scope, args));
	                if (stop) {
	                    stop = oldstop;
	                    return out;
	                }
	            }
	            for (i = 0; i < ii; i++) {
	                l = listeners[i];
	                if ("zIndex" in l) {
	                    if (l.zIndex == indexed[z]) {
	                        out.push(l.apply(scope, args));
	                        if (stop) {
	                            break;
	                        }
	                        do {
	                            z++;
	                            l = queue[indexed[z]];
	                            l && out.push(l.apply(scope, args));
	                            if (stop) {
	                                break;
	                            }
	                        } while (l)
	                    } else {
	                        queue[l.zIndex] = l;
	                    }
	                } else {
	                    out.push(l.apply(scope, args));
	                    if (stop) {
	                        break;
	                    }
	                }
	            }
	            stop = oldstop;
	            current_event = ce;
	            return out;
	        };
	        // Undocumented. Debug only.
	        eve._events = events;
	    /*\
	     * eve.listeners
	     [ method ]
	
	     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.
	
	     > Arguments
	
	     - name (string) name of the event, dot (`.`) or slash (`/`) separated
	
	     = (array) array of event handlers
	    \*/
	    eve.listeners = function (name) {
	        var names = isArray(name) ? name : name.split(separator),
	            e = events,
	            item,
	            items,
	            k,
	            i,
	            ii,
	            j,
	            jj,
	            nes,
	            es = [e],
	            out = [];
	        for (i = 0, ii = names.length; i < ii; i++) {
	            nes = [];
	            for (j = 0, jj = es.length; j < jj; j++) {
	                e = es[j].n;
	                items = [e[names[i]], e[wildcard]];
	                k = 2;
	                while (k--) {
	                    item = items[k];
	                    if (item) {
	                        nes.push(item);
	                        out = out.concat(item.f || []);
	                    }
	                }
	            }
	            es = nes;
	        }
	        return out;
	    };
	    /*\
	     * eve.separator
	     [ method ]
	
	     * If for some reasons you don’t like default separators (`.` or `/`) you can specify yours
	     * here. Be aware that if you pass a string longer than one character it will be treated as
	     * a list of characters.
	
	     - separator (string) new separator. Empty string resets to default: `.` or `/`.
	    \*/
	    eve.separator = function (sep) {
	        if (sep) {
	            sep = Str(sep).replace(/(?=[\.\^\]\[\-])/g, "\\");
	            sep = "[" + sep + "]";
	            separator = new RegExp(sep);
	        } else {
	            separator = /[\.\/]/;
	        }
	    };
	    /*\
	     * eve.on
	     [ method ]
	     **
	     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
	     | eve.on("*.under.*", f);
	     | eve("mouse.under.floor"); // triggers f
	     * Use @eve to trigger the listener.
	     **
	     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
	     - f (function) event handler function
	     **
	     - name (array) if you don’t want to use separators, you can use array of strings
	     - f (function) event handler function
	     **
	     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
	     > Example:
	     | eve.on("mouse", eatIt)(2);
	     | eve.on("mouse", scream);
	     | eve.on("mouse", catchIt)(1);
	     * This will ensure that `catchIt` function will be called before `eatIt`.
	     *
	     * If you want to put your handler before non-indexed handlers, specify a negative value.
	     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
	    \*/
	    eve.on = function (name, f) {
	        if (typeof f != "function") {
	            return function () {};
	        }
	        var names = isArray(name) ? (isArray(name[0]) ? name : [name]) : Str(name).split(comaseparator);
	        for (var i = 0, ii = names.length; i < ii; i++) {
	            (function (name) {
	                var names = isArray(name) ? name : Str(name).split(separator),
	                    e = events,
	                    exist;
	                for (var i = 0, ii = names.length; i < ii; i++) {
	                    e = e.n;
	                    e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
	                }
	                e.f = e.f || [];
	                for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
	                    exist = true;
	                    break;
	                }
	                !exist && e.f.push(f);
	            }(names[i]));
	        }
	        return function (zIndex) {
	            if (+zIndex == +zIndex) {
	                f.zIndex = +zIndex;
	            }
	        };
	    };
	    /*\
	     * eve.f
	     [ method ]
	     **
	     * Returns function that will fire given event with optional arguments.
	     * Arguments that will be passed to the result function will be also
	     * concated to the list of final arguments.
	     | el.onclick = eve.f("click", 1, 2);
	     | eve.on("click", function (a, b, c) {
	     |     console.log(a, b, c); // 1, 2, [event object]
	     | });
	     > Arguments
	     - event (string) event name
	     - varargs (…) and any other arguments
	     = (function) possible event handler function
	    \*/
	    eve.f = function (event) {
	        var attrs = [].slice.call(arguments, 1);
	        return function () {
	            eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
	        };
	    };
	    /*\
	     * eve.stop
	     [ method ]
	     **
	     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
	    \*/
	    eve.stop = function () {
	        stop = 1;
	    };
	    /*\
	     * eve.nt
	     [ method ]
	     **
	     * Could be used inside event handler to figure out actual name of the event.
	     **
	     > Arguments
	     **
	     - subname (string) #optional subname of the event
	     **
	     = (string) name of the event, if `subname` is not specified
	     * or
	     = (boolean) `true`, if current event’s name contains `subname`
	    \*/
	    eve.nt = function (subname) {
	        var cur = isArray(current_event) ? current_event.join(".") : current_event;
	        if (subname) {
	            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(cur);
	        }
	        return cur;
	    };
	    /*\
	     * eve.nts
	     [ method ]
	     **
	     * Could be used inside event handler to figure out actual name of the event.
	     **
	     **
	     = (array) names of the event
	    \*/
	    eve.nts = function () {
	        return isArray(current_event) ? current_event : current_event.split(separator);
	    };
	    /*\
	     * eve.off
	     [ method ]
	     **
	     * Removes given function from the list of event listeners assigned to given name.
	     * If no arguments specified all the events will be cleared.
	     **
	     > Arguments
	     **
	     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
	     - f (function) event handler function
	    \*/
	    /*\
	     * eve.unbind
	     [ method ]
	     **
	     * See @eve.off
	    \*/
	    eve.off = eve.unbind = function (name, f) {
	        if (!name) {
	            eve._events = events = {n: {}};
	            return;
	        }
	        var names = isArray(name) ? (isArray(name[0]) ? name : [name]) : Str(name).split(comaseparator);
	        if (names.length > 1) {
	            for (var i = 0, ii = names.length; i < ii; i++) {
	                eve.off(names[i], f);
	            }
	            return;
	        }
	        names = isArray(name) ? name : Str(name).split(separator);
	        var e,
	            key,
	            splice,
	            i, ii, j, jj,
	            cur = [events],
	            inodes = [];
	        for (i = 0, ii = names.length; i < ii; i++) {
	            for (j = 0; j < cur.length; j += splice.length - 2) {
	                splice = [j, 1];
	                e = cur[j].n;
	                if (names[i] != wildcard) {
	                    if (e[names[i]]) {
	                        splice.push(e[names[i]]);
	                        inodes.unshift({
	                            n: e,
	                            name: names[i]
	                        });
	                    }
	                } else {
	                    for (key in e) if (e[has](key)) {
	                        splice.push(e[key]);
	                        inodes.unshift({
	                            n: e,
	                            name: key
	                        });
	                    }
	                }
	                cur.splice.apply(cur, splice);
	            }
	        }
	        for (i = 0, ii = cur.length; i < ii; i++) {
	            e = cur[i];
	            while (e.n) {
	                if (f) {
	                    if (e.f) {
	                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
	                            e.f.splice(j, 1);
	                            break;
	                        }
	                        !e.f.length && delete e.f;
	                    }
	                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
	                        var funcs = e.n[key].f;
	                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
	                            funcs.splice(j, 1);
	                            break;
	                        }
	                        !funcs.length && delete e.n[key].f;
	                    }
	                } else {
	                    delete e.f;
	                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
	                        delete e.n[key].f;
	                    }
	                }
	                e = e.n;
	            }
	        }
	        // prune inner nodes in path
	        prune: for (i = 0, ii = inodes.length; i < ii; i++) {
	            e = inodes[i];
	            for (key in e.n[e.name].f) {
	                // not empty (has listeners)
	                continue prune;
	            }
	            for (key in e.n[e.name].n) {
	                // not empty (has children)
	                continue prune;
	            }
	            // is empty
	            delete e.n[e.name];
	        }
	    };
	    /*\
	     * eve.once
	     [ method ]
	     **
	     * Binds given event handler with a given name to only run once then unbind itself.
	     | eve.once("login", f);
	     | eve("login"); // triggers f
	     | eve("login"); // no listeners
	     * Use @eve to trigger the listener.
	     **
	     > Arguments
	     **
	     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
	     - f (function) event handler function
	     **
	     = (function) same return function as @eve.on
	    \*/
	    eve.once = function (name, f) {
	        var f2 = function () {
	            eve.off(name, f2);
	            return f.apply(this, arguments);
	        };
	        return eve.on(name, f2);
	    };
	    /*\
	     * eve.version
	     [ property (string) ]
	     **
	     * Current version of the library.
	    \*/
	    eve.version = version;
	    eve.toString = function () {
	        return "You are running Eve " + version;
	    };
	    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : ( true ? (!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_LOCAL_MODULE_0__ = (function() { return eve; }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)))) : (glob.eve = eve));
	})(this);
	
	(function (glob, factory) {
	    // AMD support
	    if (true) {
	        // Define as an anonymous module
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__WEBPACK_LOCAL_MODULE_0__], __WEBPACK_AMD_DEFINE_RESULT__ = function (eve) {
	            return factory(glob, eve);
	        }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports != "undefined") {
	        // Next for Node.js or CommonJS
	        var eve = require("eve");
	        module.exports = factory(glob, eve);
	    } else {
	        // Browser globals (glob is window)
	        // Snap adds itself to window
	        factory(glob, glob.eve);
	    }
	}(window || this, function (window, eve) {
	
	// Copyright (c) 2017 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	var mina = (function (eve) {
	    var animations = {},
	    requestAnimFrame = window.requestAnimationFrame       ||
	                       window.webkitRequestAnimationFrame ||
	                       window.mozRequestAnimationFrame    ||
	                       window.oRequestAnimationFrame      ||
	                       window.msRequestAnimationFrame     ||
	                       function (callback) {
	                           setTimeout(callback, 16, new Date().getTime());
	                           return true;
	                       },
	    requestID,
	    isArray = Array.isArray || function (a) {
	        return a instanceof Array ||
	            Object.prototype.toString.call(a) == "[object Array]";
	    },
	    idgen = 0,
	    idprefix = "M" + (+new Date).toString(36),
	    ID = function () {
	        return idprefix + (idgen++).toString(36);
	    },
	    diff = function (a, b, A, B) {
	        if (isArray(a)) {
	            res = [];
	            for (var i = 0, ii = a.length; i < ii; i++) {
	                res[i] = diff(a[i], b, A[i], B);
	            }
	            return res;
	        }
	        var dif = (A - a) / (B - b);
	        return function (bb) {
	            return a + dif * (bb - b);
	        };
	    },
	    timer = Date.now || function () {
	        return +new Date;
	    },
	    sta = function (val) {
	        var a = this;
	        if (val == null) {
	            return a.s;
	        }
	        var ds = a.s - val;
	        a.b += a.dur * ds;
	        a.B += a.dur * ds;
	        a.s = val;
	    },
	    speed = function (val) {
	        var a = this;
	        if (val == null) {
	            return a.spd;
	        }
	        a.spd = val;
	    },
	    duration = function (val) {
	        var a = this;
	        if (val == null) {
	            return a.dur;
	        }
	        a.s = a.s * val / a.dur;
	        a.dur = val;
	    },
	    stopit = function () {
	        var a = this;
	        delete animations[a.id];
	        a.update();
	        eve("mina.stop." + a.id, a);
	    },
	    pause = function () {
	        var a = this;
	        if (a.pdif) {
	            return;
	        }
	        delete animations[a.id];
	        a.update();
	        a.pdif = a.get() - a.b;
	    },
	    resume = function () {
	        var a = this;
	        if (!a.pdif) {
	            return;
	        }
	        a.b = a.get() - a.pdif;
	        delete a.pdif;
	        animations[a.id] = a;
	        frame();
	    },
	    update = function () {
	        var a = this,
	            res;
	        if (isArray(a.start)) {
	            res = [];
	            for (var j = 0, jj = a.start.length; j < jj; j++) {
	                res[j] = +a.start[j] +
	                    (a.end[j] - a.start[j]) * a.easing(a.s);
	            }
	        } else {
	            res = +a.start + (a.end - a.start) * a.easing(a.s);
	        }
	        a.set(res);
	    },
	    frame = function (timeStamp) {
	        // Manual invokation?
	        if (!timeStamp) {
	            // Frame loop stopped?
	            if (!requestID) {
	                // Start frame loop...
	                requestID = requestAnimFrame(frame);
	            }
	            return;
	        }
	        var len = 0;
	        for (var i in animations) if (animations.hasOwnProperty(i)) {
	            var a = animations[i],
	                b = a.get(),
	                res;
	            len++;
	            a.s = (b - a.b) / (a.dur / a.spd);
	            if (a.s >= 1) {
	                delete animations[i];
	                a.s = 1;
	                len--;
	                (function (a) {
	                    setTimeout(function () {
	                        eve("mina.finish." + a.id, a);
	                    });
	                }(a));
	            }
	            a.update();
	        }
	        requestID = len ? requestAnimFrame(frame) : false;
	    },
	    /*\
	     * mina
	     [ method ]
	     **
	     * Generic animation of numbers
	     **
	     - a (number) start _slave_ number
	     - A (number) end _slave_ number
	     - b (number) start _master_ number (start time in general case)
	     - B (number) end _master_ number (end time in general case)
	     - get (function) getter of _master_ number (see @mina.time)
	     - set (function) setter of _slave_ number
	     - easing (function) #optional easing function, default is @mina.linear
	     = (object) animation descriptor
	     o {
	     o         id (string) animation id,
	     o         start (number) start _slave_ number,
	     o         end (number) end _slave_ number,
	     o         b (number) start _master_ number,
	     o         s (number) animation status (0..1),
	     o         dur (number) animation duration,
	     o         spd (number) animation speed,
	     o         get (function) getter of _master_ number (see @mina.time),
	     o         set (function) setter of _slave_ number,
	     o         easing (function) easing function, default is @mina.linear,
	     o         status (function) status getter/setter,
	     o         speed (function) speed getter/setter,
	     o         duration (function) duration getter/setter,
	     o         stop (function) animation stopper
	     o         pause (function) pauses the animation
	     o         resume (function) resumes the animation
	     o         update (function) calles setter with the right value of the animation
	     o }
	    \*/
	    mina = function (a, A, b, B, get, set, easing) {
	        var anim = {
	            id: ID(),
	            start: a,
	            end: A,
	            b: b,
	            s: 0,
	            dur: B - b,
	            spd: 1,
	            get: get,
	            set: set,
	            easing: easing || mina.linear,
	            status: sta,
	            speed: speed,
	            duration: duration,
	            stop: stopit,
	            pause: pause,
	            resume: resume,
	            update: update
	        };
	        animations[anim.id] = anim;
	        var len = 0, i;
	        for (i in animations) if (animations.hasOwnProperty(i)) {
	            len++;
	            if (len == 2) {
	                break;
	            }
	        }
	        len == 1 && frame();
	        return anim;
	    };
	    /*\
	     * mina.time
	     [ method ]
	     **
	     * Returns the current time. Equivalent to:
	     | function () {
	     |     return (new Date).getTime();
	     | }
	    \*/
	    mina.time = timer;
	    /*\
	     * mina.getById
	     [ method ]
	     **
	     * Returns an animation by its id
	     - id (string) animation's id
	     = (object) See @mina
	    \*/
	    mina.getById = function (id) {
	        return animations[id] || null;
	    };
	
	    /*\
	     * mina.linear
	     [ method ]
	     **
	     * Default linear easing
	     - n (number) input 0..1
	     = (number) output 0..1
	    \*/
	    mina.linear = function (n) {
	        return n;
	    };
	    /*\
	     * mina.easeout
	     [ method ]
	     **
	     * Easeout easing
	     - n (number) input 0..1
	     = (number) output 0..1
	    \*/
	    mina.easeout = function (n) {
	        return Math.pow(n, 1.7);
	    };
	    /*\
	     * mina.easein
	     [ method ]
	     **
	     * Easein easing
	     - n (number) input 0..1
	     = (number) output 0..1
	    \*/
	    mina.easein = function (n) {
	        return Math.pow(n, .48);
	    };
	    /*\
	     * mina.easeinout
	     [ method ]
	     **
	     * Easeinout easing
	     - n (number) input 0..1
	     = (number) output 0..1
	    \*/
	    mina.easeinout = function (n) {
	        if (n == 1) {
	            return 1;
	        }
	        if (n == 0) {
	            return 0;
	        }
	        var q = .48 - n / 1.04,
	            Q = Math.sqrt(.1734 + q * q),
	            x = Q - q,
	            X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
	            y = -Q - q,
	            Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
	            t = X + Y + .5;
	        return (1 - t) * 3 * t * t + t * t * t;
	    };
	    /*\
	     * mina.backin
	     [ method ]
	     **
	     * Backin easing
	     - n (number) input 0..1
	     = (number) output 0..1
	    \*/
	    mina.backin = function (n) {
	        if (n == 1) {
	            return 1;
	        }
	        var s = 1.70158;
	        return n * n * ((s + 1) * n - s);
	    };
	    /*\
	     * mina.backout
	     [ method ]
	     **
	     * Backout easing
	     - n (number) input 0..1
	     = (number) output 0..1
	    \*/
	    mina.backout = function (n) {
	        if (n == 0) {
	            return 0;
	        }
	        n = n - 1;
	        var s = 1.70158;
	        return n * n * ((s + 1) * n + s) + 1;
	    };
	    /*\
	     * mina.elastic
	     [ method ]
	     **
	     * Elastic easing
	     - n (number) input 0..1
	     = (number) output 0..1
	    \*/
	    mina.elastic = function (n) {
	        if (n == !!n) {
	            return n;
	        }
	        return Math.pow(2, -10 * n) * Math.sin((n - .075) *
	            (2 * Math.PI) / .3) + 1;
	    };
	    /*\
	     * mina.bounce
	     [ method ]
	     **
	     * Bounce easing
	     - n (number) input 0..1
	     = (number) output 0..1
	    \*/
	    mina.bounce = function (n) {
	        var s = 7.5625,
	            p = 2.75,
	            l;
	        if (n < 1 / p) {
	            l = s * n * n;
	        } else {
	            if (n < 2 / p) {
	                n -= 1.5 / p;
	                l = s * n * n + .75;
	            } else {
	                if (n < 2.5 / p) {
	                    n -= 2.25 / p;
	                    l = s * n * n + .9375;
	                } else {
	                    n -= 2.625 / p;
	                    l = s * n * n + .984375;
	                }
	            }
	        }
	        return l;
	    };
	    window.mina = mina;
	    return mina;
	})(typeof eve == "undefined" ? function () {} : eve);
	
	// Copyright (c) 2013 - 2017 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	
	var Snap = (function(root) {
	Snap.version = "0.5.1";
	/*\
	 * Snap
	 [ method ]
	 **
	 * Creates a drawing surface or wraps existing SVG element.
	 **
	 - width (number|string) width of surface
	 - height (number|string) height of surface
	 * or
	 - DOM (SVGElement) element to be wrapped into Snap structure
	 * or
	 - array (array) array of elements (will return set of elements)
	 * or
	 - query (string) CSS query selector
	 = (object) @Element
	\*/
	function Snap(w, h) {
	    if (w) {
	        if (w.nodeType) {
	            return wrap(w);
	        }
	        if (is(w, "array") && Snap.set) {
	            return Snap.set.apply(Snap, w);
	        }
	        if (w instanceof Element) {
	            return w;
	        }
	        if (h == null) {
	            // try {
	                w = glob.doc.querySelector(String(w));
	                return wrap(w);
	            // } catch (e) {
	                // return null;
	            // }
	        }
	    }
	    w = w == null ? "100%" : w;
	    h = h == null ? "100%" : h;
	    return new Paper(w, h);
	}
	Snap.toString = function () {
	    return "Snap v" + this.version;
	};
	Snap._ = {};
	var glob = {
	    win: root.window,
	    doc: root.window.document
	};
	Snap._.glob = glob;
	var has = "hasOwnProperty",
	    Str = String,
	    toFloat = parseFloat,
	    toInt = parseInt,
	    math = Math,
	    mmax = math.max,
	    mmin = math.min,
	    abs = math.abs,
	    pow = math.pow,
	    PI = math.PI,
	    round = math.round,
	    E = "",
	    S = " ",
	    objectToString = Object.prototype.toString,
	    ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i,
	    colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i,
	    bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
	    separator = Snap._.separator = /[,\s]+/,
	    whitespace = /[\s]/g,
	    commaSpaces = /[\s]*,[\s]*/,
	    hsrg = {hs: 1, rg: 1},
	    pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig,
	    tCommand = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig,
	    pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\s]*,?[\s]*/ig,
	    idgen = 0,
	    idprefix = "S" + (+new Date).toString(36),
	    ID = function (el) {
	        return (el && el.type ? el.type : E) + idprefix + (idgen++).toString(36);
	    },
	    xlink = "http://www.w3.org/1999/xlink",
	    xmlns = "http://www.w3.org/2000/svg",
	    hub = {},
	    /*\
	     * Snap.url
	     [ method ]
	     **
	     * Wraps path into `"url('<path>')"`.
	     - value (string) path
	     = (string) wrapped path
	    \*/
	    URL = Snap.url = function (url) {
	        return "url('#" + url + "')";
	    };
	
	function $(el, attr) {
	    if (attr) {
	        if (el == "#text") {
	            el = glob.doc.createTextNode(attr.text || attr["#text"] || "");
	        }
	        if (el == "#comment") {
	            el = glob.doc.createComment(attr.text || attr["#text"] || "");
	        }
	        if (typeof el == "string") {
	            el = $(el);
	        }
	        if (typeof attr == "string") {
	            if (el.nodeType == 1) {
	                if (attr.substring(0, 6) == "xlink:") {
	                    return el.getAttributeNS(xlink, attr.substring(6));
	                }
	                if (attr.substring(0, 4) == "xml:") {
	                    return el.getAttributeNS(xmlns, attr.substring(4));
	                }
	                return el.getAttribute(attr);
	            } else if (attr == "text") {
	                return el.nodeValue;
	            } else {
	                return null;
	            }
	        }
	        if (el.nodeType == 1) {
	            for (var key in attr) if (attr[has](key)) {
	                var val = Str(attr[key]);
	                if (val) {
	                    if (key.substring(0, 6) == "xlink:") {
	                        el.setAttributeNS(xlink, key.substring(6), val);
	                    } else if (key.substring(0, 4) == "xml:") {
	                        el.setAttributeNS(xmlns, key.substring(4), val);
	                    } else {
	                        el.setAttribute(key, val);
	                    }
	                } else {
	                    el.removeAttribute(key);
	                }
	            }
	        } else if ("text" in attr) {
	            el.nodeValue = attr.text;
	        }
	    } else {
	        el = glob.doc.createElementNS(xmlns, el);
	    }
	    return el;
	}
	Snap._.$ = $;
	Snap._.id = ID;
	function getAttrs(el) {
	    var attrs = el.attributes,
	        name,
	        out = {};
	    for (var i = 0; i < attrs.length; i++) {
	        if (attrs[i].namespaceURI == xlink) {
	            name = "xlink:";
	        } else {
	            name = "";
	        }
	        name += attrs[i].name;
	        out[name] = attrs[i].textContent;
	    }
	    return out;
	}
	function is(o, type) {
	    type = Str.prototype.toLowerCase.call(type);
	    if (type == "finite") {
	        return isFinite(o);
	    }
	    if (type == "array" &&
	        (o instanceof Array || Array.isArray && Array.isArray(o))) {
	        return true;
	    }
	    return  type == "null" && o === null ||
	            type == typeof o && o !== null ||
	            type == "object" && o === Object(o) ||
	            objectToString.call(o).slice(8, -1).toLowerCase() == type;
	}
	/*\
	 * Snap.format
	 [ method ]
	 **
	 * Replaces construction of type `{<name>}` to the corresponding argument
	 **
	 - token (string) string to format
	 - json (object) object which properties are used as a replacement
	 = (string) formatted string
	 > Usage
	 | // this draws a rectangular shape equivalent to "M10,20h40v50h-40z"
	 | paper.path(Snap.format("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
	 |     x: 10,
	 |     y: 20,
	 |     dim: {
	 |         width: 40,
	 |         height: 50,
	 |         "negative width": -40
	 |     }
	 | }));
	\*/
	Snap.format = (function () {
	    var tokenRegex = /\{([^\}]+)\}/g,
	        objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
	        replacer = function (all, key, obj) {
	            var res = obj;
	            key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
	                name = name || quotedName;
	                if (res) {
	                    if (name in res) {
	                        res = res[name];
	                    }
	                    typeof res == "function" && isFunc && (res = res());
	                }
	            });
	            res = (res == null || res == obj ? all : res) + "";
	            return res;
	        };
	    return function (str, obj) {
	        return Str(str).replace(tokenRegex, function (all, key) {
	            return replacer(all, key, obj);
	        });
	    };
	})();
	function clone(obj) {
	    if (typeof obj == "function" || Object(obj) !== obj) {
	        return obj;
	    }
	    var res = new obj.constructor;
	    for (var key in obj) if (obj[has](key)) {
	        res[key] = clone(obj[key]);
	    }
	    return res;
	}
	Snap._.clone = clone;
	function repush(array, item) {
	    for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
	        return array.push(array.splice(i, 1)[0]);
	    }
	}
	function cacher(f, scope, postprocessor) {
	    function newf() {
	        var arg = Array.prototype.slice.call(arguments, 0),
	            args = arg.join("\u2400"),
	            cache = newf.cache = newf.cache || {},
	            count = newf.count = newf.count || [];
	        if (cache[has](args)) {
	            repush(count, args);
	            return postprocessor ? postprocessor(cache[args]) : cache[args];
	        }
	        count.length >= 1e3 && delete cache[count.shift()];
	        count.push(args);
	        cache[args] = f.apply(scope, arg);
	        return postprocessor ? postprocessor(cache[args]) : cache[args];
	    }
	    return newf;
	}
	Snap._.cacher = cacher;
	function angle(x1, y1, x2, y2, x3, y3) {
	    if (x3 == null) {
	        var x = x1 - x2,
	            y = y1 - y2;
	        if (!x && !y) {
	            return 0;
	        }
	        return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
	    } else {
	        return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
	    }
	}
	function rad(deg) {
	    return deg % 360 * PI / 180;
	}
	function deg(rad) {
	    return rad * 180 / PI % 360;
	}
	function x_y() {
	    return this.x + S + this.y;
	}
	function x_y_w_h() {
	    return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
	}
	
	/*\
	 * Snap.rad
	 [ method ]
	 **
	 * Transform angle to radians
	 - deg (number) angle in degrees
	 = (number) angle in radians
	\*/
	Snap.rad = rad;
	/*\
	 * Snap.deg
	 [ method ]
	 **
	 * Transform angle to degrees
	 - rad (number) angle in radians
	 = (number) angle in degrees
	\*/
	Snap.deg = deg;
	/*\
	 * Snap.sin
	 [ method ]
	 **
	 * Equivalent to `Math.sin()` only works with degrees, not radians.
	 - angle (number) angle in degrees
	 = (number) sin
	\*/
	Snap.sin = function (angle) {
	    return math.sin(Snap.rad(angle));
	};
	/*\
	 * Snap.tan
	 [ method ]
	 **
	 * Equivalent to `Math.tan()` only works with degrees, not radians.
	 - angle (number) angle in degrees
	 = (number) tan
	\*/
	Snap.tan = function (angle) {
	    return math.tan(Snap.rad(angle));
	};
	/*\
	 * Snap.cos
	 [ method ]
	 **
	 * Equivalent to `Math.cos()` only works with degrees, not radians.
	 - angle (number) angle in degrees
	 = (number) cos
	\*/
	Snap.cos = function (angle) {
	    return math.cos(Snap.rad(angle));
	};
	/*\
	 * Snap.asin
	 [ method ]
	 **
	 * Equivalent to `Math.asin()` only works with degrees, not radians.
	 - num (number) value
	 = (number) asin in degrees
	\*/
	Snap.asin = function (num) {
	    return Snap.deg(math.asin(num));
	};
	/*\
	 * Snap.acos
	 [ method ]
	 **
	 * Equivalent to `Math.acos()` only works with degrees, not radians.
	 - num (number) value
	 = (number) acos in degrees
	\*/
	Snap.acos = function (num) {
	    return Snap.deg(math.acos(num));
	};
	/*\
	 * Snap.atan
	 [ method ]
	 **
	 * Equivalent to `Math.atan()` only works with degrees, not radians.
	 - num (number) value
	 = (number) atan in degrees
	\*/
	Snap.atan = function (num) {
	    return Snap.deg(math.atan(num));
	};
	/*\
	 * Snap.atan2
	 [ method ]
	 **
	 * Equivalent to `Math.atan2()` only works with degrees, not radians.
	 - num (number) value
	 = (number) atan2 in degrees
	\*/
	Snap.atan2 = function (num) {
	    return Snap.deg(math.atan2(num));
	};
	/*\
	 * Snap.angle
	 [ method ]
	 **
	 * Returns an angle between two or three points
	 - x1 (number) x coord of first point
	 - y1 (number) y coord of first point
	 - x2 (number) x coord of second point
	 - y2 (number) y coord of second point
	 - x3 (number) #optional x coord of third point
	 - y3 (number) #optional y coord of third point
	 = (number) angle in degrees
	\*/
	Snap.angle = angle;
	/*\
	 * Snap.len
	 [ method ]
	 **
	 * Returns distance between two points
	 - x1 (number) x coord of first point
	 - y1 (number) y coord of first point
	 - x2 (number) x coord of second point
	 - y2 (number) y coord of second point
	 = (number) distance
	\*/
	Snap.len = function (x1, y1, x2, y2) {
	    return Math.sqrt(Snap.len2(x1, y1, x2, y2));
	};
	/*\
	 * Snap.len2
	 [ method ]
	 **
	 * Returns squared distance between two points
	 - x1 (number) x coord of first point
	 - y1 (number) y coord of first point
	 - x2 (number) x coord of second point
	 - y2 (number) y coord of second point
	 = (number) distance
	\*/
	Snap.len2 = function (x1, y1, x2, y2) {
	    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
	};
	/*\
	 * Snap.closestPoint
	 [ method ]
	 **
	 * Returns closest point to a given one on a given path.
	 - path (Element) path element
	 - x (number) x coord of a point
	 - y (number) y coord of a point
	 = (object) in format
	 {
	    x (number) x coord of the point on the path
	    y (number) y coord of the point on the path
	    length (number) length of the path to the point
	    distance (number) distance from the given point to the path
	 }
	\*/
	// Copied from http://bl.ocks.org/mbostock/8027637
	Snap.closestPoint = function (path, x, y) {
	    function distance2(p) {
	        var dx = p.x - x,
	            dy = p.y - y;
	        return dx * dx + dy * dy;
	    }
	    var pathNode = path.node,
	        pathLength = pathNode.getTotalLength(),
	        precision = pathLength / pathNode.pathSegList.numberOfItems * .125,
	        best,
	        bestLength,
	        bestDistance = Infinity;
	
	    // linear scan for coarse approximation
	    for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
	        if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
	            best = scan;
	            bestLength = scanLength;
	            bestDistance = scanDistance;
	        }
	    }
	
	    // binary search for precise estimate
	    precision *= .5;
	    while (precision > .5) {
	        var before,
	            after,
	            beforeLength,
	            afterLength,
	            beforeDistance,
	            afterDistance;
	        if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
	            best = before;
	            bestLength = beforeLength;
	            bestDistance = beforeDistance;
	        } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
	            best = after;
	            bestLength = afterLength;
	            bestDistance = afterDistance;
	        } else {
	            precision *= .5;
	        }
	    }
	
	    best = {
	        x: best.x,
	        y: best.y,
	        length: bestLength,
	        distance: Math.sqrt(bestDistance)
	    };
	    return best;
	}
	/*\
	 * Snap.is
	 [ method ]
	 **
	 * Handy replacement for the `typeof` operator
	 - o (…) any object or primitive
	 - type (string) name of the type, e.g., `string`, `function`, `number`, etc.
	 = (boolean) `true` if given value is of given type
	\*/
	Snap.is = is;
	/*\
	 * Snap.snapTo
	 [ method ]
	 **
	 * Snaps given value to given grid
	 - values (array|number) given array of values or step of the grid
	 - value (number) value to adjust
	 - tolerance (number) #optional maximum distance to the target value that would trigger the snap. Default is `10`.
	 = (number) adjusted value
	\*/
	Snap.snapTo = function (values, value, tolerance) {
	    tolerance = is(tolerance, "finite") ? tolerance : 10;
	    if (is(values, "array")) {
	        var i = values.length;
	        while (i--) if (abs(values[i] - value) <= tolerance) {
	            return values[i];
	        }
	    } else {
	        values = +values;
	        var rem = value % values;
	        if (rem < tolerance) {
	            return value - rem;
	        }
	        if (rem > values - tolerance) {
	            return value - rem + values;
	        }
	    }
	    return value;
	};
	// Colour
	/*\
	 * Snap.getRGB
	 [ method ]
	 **
	 * Parses color string as RGB object
	 - color (string) color string in one of the following formats:
	 # <ul>
	 #     <li>Color name (<code>red</code>, <code>green</code>, <code>cornflowerblue</code>, etc)</li>
	 #     <li>#••• — shortened HTML color: (<code>#000</code>, <code>#fc0</code>, etc.)</li>
	 #     <li>#•••••• — full length HTML color: (<code>#000000</code>, <code>#bd2300</code>)</li>
	 #     <li>rgb(•••, •••, •••) — red, green and blue channels values: (<code>rgb(200,&nbsp;100,&nbsp;0)</code>)</li>
	 #     <li>rgba(•••, •••, •••, •••) — also with opacity</li>
	 #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>)</li>
	 #     <li>rgba(•••%, •••%, •••%, •••%) — also with opacity</li>
	 #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>)</li>
	 #     <li>hsba(•••, •••, •••, •••) — also with opacity</li>
	 #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
	 #     <li>hsba(•••%, •••%, •••%, •••%) — also with opacity</li>
	 #     <li>hsl(•••, •••, •••) — hue, saturation and luminosity values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;0.5)</code>)</li>
	 #     <li>hsla(•••, •••, •••, •••) — also with opacity</li>
	 #     <li>hsl(•••%, •••%, •••%) — same as above, but in %</li>
	 #     <li>hsla(•••%, •••%, •••%, •••%) — also with opacity</li>
	 # </ul>
	 * Note that `%` can be used any time: `rgb(20%, 255, 50%)`.
	 = (object) RGB object in the following format:
	 o {
	 o     r (number) red,
	 o     g (number) green,
	 o     b (number) blue,
	 o     hex (string) color in HTML/CSS format: #••••••,
	 o     error (boolean) true if string can't be parsed
	 o }
	\*/
	Snap.getRGB = cacher(function (colour) {
	    if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
	        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
	    }
	    if (colour == "none") {
	        return {r: -1, g: -1, b: -1, hex: "none", toString: rgbtoString};
	    }
	    !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
	    if (!colour) {
	        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
	    }
	    var res,
	        red,
	        green,
	        blue,
	        opacity,
	        t,
	        values,
	        rgb = colour.match(colourRegExp);
	    if (rgb) {
	        if (rgb[2]) {
	            blue = toInt(rgb[2].substring(5), 16);
	            green = toInt(rgb[2].substring(3, 5), 16);
	            red = toInt(rgb[2].substring(1, 3), 16);
	        }
	        if (rgb[3]) {
	            blue = toInt((t = rgb[3].charAt(3)) + t, 16);
	            green = toInt((t = rgb[3].charAt(2)) + t, 16);
	            red = toInt((t = rgb[3].charAt(1)) + t, 16);
	        }
	        if (rgb[4]) {
	            values = rgb[4].split(commaSpaces);
	            red = toFloat(values[0]);
	            values[0].slice(-1) == "%" && (red *= 2.55);
	            green = toFloat(values[1]);
	            values[1].slice(-1) == "%" && (green *= 2.55);
	            blue = toFloat(values[2]);
	            values[2].slice(-1) == "%" && (blue *= 2.55);
	            rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
	            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
	        }
	        if (rgb[5]) {
	            values = rgb[5].split(commaSpaces);
	            red = toFloat(values[0]);
	            values[0].slice(-1) == "%" && (red /= 100);
	            green = toFloat(values[1]);
	            values[1].slice(-1) == "%" && (green /= 100);
	            blue = toFloat(values[2]);
	            values[2].slice(-1) == "%" && (blue /= 100);
	            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
	            rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
	            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
	            return Snap.hsb2rgb(red, green, blue, opacity);
	        }
	        if (rgb[6]) {
	            values = rgb[6].split(commaSpaces);
	            red = toFloat(values[0]);
	            values[0].slice(-1) == "%" && (red /= 100);
	            green = toFloat(values[1]);
	            values[1].slice(-1) == "%" && (green /= 100);
	            blue = toFloat(values[2]);
	            values[2].slice(-1) == "%" && (blue /= 100);
	            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
	            rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
	            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
	            return Snap.hsl2rgb(red, green, blue, opacity);
	        }
	        red = mmin(math.round(red), 255);
	        green = mmin(math.round(green), 255);
	        blue = mmin(math.round(blue), 255);
	        opacity = mmin(mmax(opacity, 0), 1);
	        rgb = {r: red, g: green, b: blue, toString: rgbtoString};
	        rgb.hex = "#" + (16777216 | blue | green << 8 | red << 16).toString(16).slice(1);
	        rgb.opacity = is(opacity, "finite") ? opacity : 1;
	        return rgb;
	    }
	    return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
	}, Snap);
	/*\
	 * Snap.hsb
	 [ method ]
	 **
	 * Converts HSB values to a hex representation of the color
	 - h (number) hue
	 - s (number) saturation
	 - b (number) value or brightness
	 = (string) hex representation of the color
	\*/
	Snap.hsb = cacher(function (h, s, b) {
	    return Snap.hsb2rgb(h, s, b).hex;
	});
	/*\
	 * Snap.hsl
	 [ method ]
	 **
	 * Converts HSL values to a hex representation of the color
	 - h (number) hue
	 - s (number) saturation
	 - l (number) luminosity
	 = (string) hex representation of the color
	\*/
	Snap.hsl = cacher(function (h, s, l) {
	    return Snap.hsl2rgb(h, s, l).hex;
	});
	/*\
	 * Snap.rgb
	 [ method ]
	 **
	 * Converts RGB values to a hex representation of the color
	 - r (number) red
	 - g (number) green
	 - b (number) blue
	 = (string) hex representation of the color
	\*/
	Snap.rgb = cacher(function (r, g, b, o) {
	    if (is(o, "finite")) {
	        var round = math.round;
	        return "rgba(" + [round(r), round(g), round(b), +o.toFixed(2)] + ")";
	    }
	    return "#" + (16777216 | b | g << 8 | r << 16).toString(16).slice(1);
	});
	var toHex = function (color) {
	    var i = glob.doc.getElementsByTagName("head")[0] || glob.doc.getElementsByTagName("svg")[0],
	        red = "rgb(255, 0, 0)";
	    toHex = cacher(function (color) {
	        if (color.toLowerCase() == "red") {
	            return red;
	        }
	        i.style.color = red;
	        i.style.color = color;
	        var out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
	        return out == red ? null : out;
	    });
	    return toHex(color);
	},
	hsbtoString = function () {
	    return "hsb(" + [this.h, this.s, this.b] + ")";
	},
	hsltoString = function () {
	    return "hsl(" + [this.h, this.s, this.l] + ")";
	},
	rgbtoString = function () {
	    return this.opacity == 1 || this.opacity == null ?
	            this.hex :
	            "rgba(" + [this.r, this.g, this.b, this.opacity] + ")";
	},
	prepareRGB = function (r, g, b) {
	    if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in r) {
	        b = r.b;
	        g = r.g;
	        r = r.r;
	    }
	    if (g == null && is(r, string)) {
	        var clr = Snap.getRGB(r);
	        r = clr.r;
	        g = clr.g;
	        b = clr.b;
	    }
	    if (r > 1 || g > 1 || b > 1) {
	        r /= 255;
	        g /= 255;
	        b /= 255;
	    }
	
	    return [r, g, b];
	},
	packageRGB = function (r, g, b, o) {
	    r = math.round(r * 255);
	    g = math.round(g * 255);
	    b = math.round(b * 255);
	    var rgb = {
	        r: r,
	        g: g,
	        b: b,
	        opacity: is(o, "finite") ? o : 1,
	        hex: Snap.rgb(r, g, b),
	        toString: rgbtoString
	    };
	    is(o, "finite") && (rgb.opacity = o);
	    return rgb;
	};
	/*\
	 * Snap.color
	 [ method ]
	 **
	 * Parses the color string and returns an object featuring the color's component values
	 - clr (string) color string in one of the supported formats (see @Snap.getRGB)
	 = (object) Combined RGB/HSB object in the following format:
	 o {
	 o     r (number) red,
	 o     g (number) green,
	 o     b (number) blue,
	 o     hex (string) color in HTML/CSS format: #••••••,
	 o     error (boolean) `true` if string can't be parsed,
	 o     h (number) hue,
	 o     s (number) saturation,
	 o     v (number) value (brightness),
	 o     l (number) lightness
	 o }
	\*/
	Snap.color = function (clr) {
	    var rgb;
	    if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
	        rgb = Snap.hsb2rgb(clr);
	        clr.r = rgb.r;
	        clr.g = rgb.g;
	        clr.b = rgb.b;
	        clr.opacity = 1;
	        clr.hex = rgb.hex;
	    } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
	        rgb = Snap.hsl2rgb(clr);
	        clr.r = rgb.r;
	        clr.g = rgb.g;
	        clr.b = rgb.b;
	        clr.opacity = 1;
	        clr.hex = rgb.hex;
	    } else {
	        if (is(clr, "string")) {
	            clr = Snap.getRGB(clr);
	        }
	        if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr && !("error" in clr)) {
	            rgb = Snap.rgb2hsl(clr);
	            clr.h = rgb.h;
	            clr.s = rgb.s;
	            clr.l = rgb.l;
	            rgb = Snap.rgb2hsb(clr);
	            clr.v = rgb.b;
	        } else {
	            clr = {hex: "none"};
	            clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
	            clr.error = 1;
	        }
	    }
	    clr.toString = rgbtoString;
	    return clr;
	};
	/*\
	 * Snap.hsb2rgb
	 [ method ]
	 **
	 * Converts HSB values to an RGB object
	 - h (number) hue
	 - s (number) saturation
	 - v (number) value or brightness
	 = (object) RGB object in the following format:
	 o {
	 o     r (number) red,
	 o     g (number) green,
	 o     b (number) blue,
	 o     hex (string) color in HTML/CSS format: #••••••
	 o }
	\*/
	Snap.hsb2rgb = function (h, s, v, o) {
	    if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
	        v = h.b;
	        s = h.s;
	        o = h.o;
	        h = h.h;
	    }
	    h *= 360;
	    var R, G, B, X, C;
	    h = h % 360 / 60;
	    C = v * s;
	    X = C * (1 - abs(h % 2 - 1));
	    R = G = B = v - C;
	
	    h = ~~h;
	    R += [C, X, 0, 0, X, C][h];
	    G += [X, C, C, X, 0, 0][h];
	    B += [0, 0, X, C, C, X][h];
	    return packageRGB(R, G, B, o);
	};
	/*\
	 * Snap.hsl2rgb
	 [ method ]
	 **
	 * Converts HSL values to an RGB object
	 - h (number) hue
	 - s (number) saturation
	 - l (number) luminosity
	 = (object) RGB object in the following format:
	 o {
	 o     r (number) red,
	 o     g (number) green,
	 o     b (number) blue,
	 o     hex (string) color in HTML/CSS format: #••••••
	 o }
	\*/
	Snap.hsl2rgb = function (h, s, l, o) {
	    if (is(h, "object") && "h" in h && "s" in h && "l" in h) {
	        l = h.l;
	        s = h.s;
	        h = h.h;
	    }
	    if (h > 1 || s > 1 || l > 1) {
	        h /= 360;
	        s /= 100;
	        l /= 100;
	    }
	    h *= 360;
	    var R, G, B, X, C;
	    h = h % 360 / 60;
	    C = 2 * s * (l < .5 ? l : 1 - l);
	    X = C * (1 - abs(h % 2 - 1));
	    R = G = B = l - C / 2;
	
	    h = ~~h;
	    R += [C, X, 0, 0, X, C][h];
	    G += [X, C, C, X, 0, 0][h];
	    B += [0, 0, X, C, C, X][h];
	    return packageRGB(R, G, B, o);
	};
	/*\
	 * Snap.rgb2hsb
	 [ method ]
	 **
	 * Converts RGB values to an HSB object
	 - r (number) red
	 - g (number) green
	 - b (number) blue
	 = (object) HSB object in the following format:
	 o {
	 o     h (number) hue,
	 o     s (number) saturation,
	 o     b (number) brightness
	 o }
	\*/
	Snap.rgb2hsb = function (r, g, b) {
	    b = prepareRGB(r, g, b);
	    r = b[0];
	    g = b[1];
	    b = b[2];
	
	    var H, S, V, C;
	    V = mmax(r, g, b);
	    C = V - mmin(r, g, b);
	    H = C == 0 ? null :
	        V == r ? (g - b) / C :
	        V == g ? (b - r) / C + 2 :
	                 (r - g) / C + 4;
	    H = (H + 360) % 6 * 60 / 360;
	    S = C == 0 ? 0 : C / V;
	    return {h: H, s: S, b: V, toString: hsbtoString};
	};
	/*\
	 * Snap.rgb2hsl
	 [ method ]
	 **
	 * Converts RGB values to an HSL object
	 - r (number) red
	 - g (number) green
	 - b (number) blue
	 = (object) HSL object in the following format:
	 o {
	 o     h (number) hue,
	 o     s (number) saturation,
	 o     l (number) luminosity
	 o }
	\*/
	Snap.rgb2hsl = function (r, g, b) {
	    b = prepareRGB(r, g, b);
	    r = b[0];
	    g = b[1];
	    b = b[2];
	
	    var H, S, L, M, m, C;
	    M = mmax(r, g, b);
	    m = mmin(r, g, b);
	    C = M - m;
	    H = C == 0 ? null :
	        M == r ? (g - b) / C :
	        M == g ? (b - r) / C + 2 :
	                 (r - g) / C + 4;
	    H = (H + 360) % 6 * 60 / 360;
	    L = (M + m) / 2;
	    S = C == 0 ? 0 :
	         L < .5 ? C / (2 * L) :
	                  C / (2 - 2 * L);
	    return {h: H, s: S, l: L, toString: hsltoString};
	};
	
	// Transformations
	/*\
	 * Snap.parsePathString
	 [ method ]
	 **
	 * Utility method
	 **
	 * Parses given path string into an array of arrays of path segments
	 - pathString (string|array) path string or array of segments (in the last case it is returned straight away)
	 = (array) array of segments
	\*/
	Snap.parsePathString = function (pathString) {
	    if (!pathString) {
	        return null;
	    }
	    var pth = Snap.path(pathString);
	    if (pth.arr) {
	        return Snap.path.clone(pth.arr);
	    }
	
	    var paramCounts = {a: 7, c: 6, o: 2, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, u: 3, z: 0},
	        data = [];
	    if (is(pathString, "array") && is(pathString[0], "array")) { // rough assumption
	        data = Snap.path.clone(pathString);
	    }
	    if (!data.length) {
	        Str(pathString).replace(pathCommand, function (a, b, c) {
	            var params = [],
	                name = b.toLowerCase();
	            c.replace(pathValues, function (a, b) {
	                b && params.push(+b);
	            });
	            if (name == "m" && params.length > 2) {
	                data.push([b].concat(params.splice(0, 2)));
	                name = "l";
	                b = b == "m" ? "l" : "L";
	            }
	            if (name == "o" && params.length == 1) {
	                data.push([b, params[0]]);
	            }
	            if (name == "r") {
	                data.push([b].concat(params));
	            } else while (params.length >= paramCounts[name]) {
	                data.push([b].concat(params.splice(0, paramCounts[name])));
	                if (!paramCounts[name]) {
	                    break;
	                }
	            }
	        });
	    }
	    data.toString = Snap.path.toString;
	    pth.arr = Snap.path.clone(data);
	    return data;
	};
	/*\
	 * Snap.parseTransformString
	 [ method ]
	 **
	 * Utility method
	 **
	 * Parses given transform string into an array of transformations
	 - TString (string|array) transform string or array of transformations (in the last case it is returned straight away)
	 = (array) array of transformations
	\*/
	var parseTransformString = Snap.parseTransformString = function (TString) {
	    if (!TString) {
	        return null;
	    }
	    var paramCounts = {r: 3, s: 4, t: 2, m: 6},
	        data = [];
	    if (is(TString, "array") && is(TString[0], "array")) { // rough assumption
	        data = Snap.path.clone(TString);
	    }
	    if (!data.length) {
	        Str(TString).replace(tCommand, function (a, b, c) {
	            var params = [],
	                name = b.toLowerCase();
	            c.replace(pathValues, function (a, b) {
	                b && params.push(+b);
	            });
	            data.push([b].concat(params));
	        });
	    }
	    data.toString = Snap.path.toString;
	    return data;
	};
	function svgTransform2string(tstr) {
	    var res = [];
	    tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, function (all, name, params) {
	        params = params.split(/\s*,\s*|\s+/);
	        if (name == "rotate" && params.length == 1) {
	            params.push(0, 0);
	        }
	        if (name == "scale") {
	            if (params.length > 2) {
	                params = params.slice(0, 2);
	            } else if (params.length == 2) {
	                params.push(0, 0);
	            }
	            if (params.length == 1) {
	                params.push(params[0], 0, 0);
	            }
	        }
	        if (name == "skewX") {
	            res.push(["m", 1, 0, math.tan(rad(params[0])), 1, 0, 0]);
	        } else if (name == "skewY") {
	            res.push(["m", 1, math.tan(rad(params[0])), 0, 1, 0, 0]);
	        } else {
	            res.push([name.charAt(0)].concat(params));
	        }
	        return all;
	    });
	    return res;
	}
	Snap._.svgTransform2string = svgTransform2string;
	Snap._.rgTransform = /^[a-z][\s]*-?\.?\d/i;
	function transform2matrix(tstr, bbox) {
	    var tdata = parseTransformString(tstr),
	        m = new Snap.Matrix;
	    if (tdata) {
	        for (var i = 0, ii = tdata.length; i < ii; i++) {
	            var t = tdata[i],
	                tlen = t.length,
	                command = Str(t[0]).toLowerCase(),
	                absolute = t[0] != command,
	                inver = absolute ? m.invert() : 0,
	                x1,
	                y1,
	                x2,
	                y2,
	                bb;
	            if (command == "t" && tlen == 2){
	                m.translate(t[1], 0);
	            } else if (command == "t" && tlen == 3) {
	                if (absolute) {
	                    x1 = inver.x(0, 0);
	                    y1 = inver.y(0, 0);
	                    x2 = inver.x(t[1], t[2]);
	                    y2 = inver.y(t[1], t[2]);
	                    m.translate(x2 - x1, y2 - y1);
	                } else {
	                    m.translate(t[1], t[2]);
	                }
	            } else if (command == "r") {
	                if (tlen == 2) {
	                    bb = bb || bbox;
	                    m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
	                } else if (tlen == 4) {
	                    if (absolute) {
	                        x2 = inver.x(t[2], t[3]);
	                        y2 = inver.y(t[2], t[3]);
	                        m.rotate(t[1], x2, y2);
	                    } else {
	                        m.rotate(t[1], t[2], t[3]);
	                    }
	                }
	            } else if (command == "s") {
	                if (tlen == 2 || tlen == 3) {
	                    bb = bb || bbox;
	                    m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
	                } else if (tlen == 4) {
	                    if (absolute) {
	                        x2 = inver.x(t[2], t[3]);
	                        y2 = inver.y(t[2], t[3]);
	                        m.scale(t[1], t[1], x2, y2);
	                    } else {
	                        m.scale(t[1], t[1], t[2], t[3]);
	                    }
	                } else if (tlen == 5) {
	                    if (absolute) {
	                        x2 = inver.x(t[3], t[4]);
	                        y2 = inver.y(t[3], t[4]);
	                        m.scale(t[1], t[2], x2, y2);
	                    } else {
	                        m.scale(t[1], t[2], t[3], t[4]);
	                    }
	                }
	            } else if (command == "m" && tlen == 7) {
	                m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
	            }
	        }
	    }
	    return m;
	}
	Snap._.transform2matrix = transform2matrix;
	Snap._unit2px = unit2px;
	var contains = glob.doc.contains || glob.doc.compareDocumentPosition ?
	    function (a, b) {
	        var adown = a.nodeType == 9 ? a.documentElement : a,
	            bup = b && b.parentNode;
	            return a == bup || !!(bup && bup.nodeType == 1 && (
	                adown.contains ?
	                    adown.contains(bup) :
	                    a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
	            ));
	    } :
	    function (a, b) {
	        if (b) {
	            while (b) {
	                b = b.parentNode;
	                if (b == a) {
	                    return true;
	                }
	            }
	        }
	        return false;
	    };
	function getSomeDefs(el) {
	    var p = el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) ||
	            el.node.parentNode && wrap(el.node.parentNode) ||
	            Snap.select("svg") ||
	            Snap(0, 0),
	        pdefs = p.select("defs"),
	        defs  = pdefs == null ? false : pdefs.node;
	    if (!defs) {
	        defs = make("defs", p.node).node;
	    }
	    return defs;
	}
	function getSomeSVG(el) {
	    return el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) || Snap.select("svg");
	}
	Snap._.getSomeDefs = getSomeDefs;
	Snap._.getSomeSVG = getSomeSVG;
	function unit2px(el, name, value) {
	    var svg = getSomeSVG(el).node,
	        out = {},
	        mgr = svg.querySelector(".svg---mgr");
	    if (!mgr) {
	        mgr = $("rect");
	        $(mgr, {x: -9e9, y: -9e9, width: 10, height: 10, "class": "svg---mgr", fill: "none"});
	        svg.appendChild(mgr);
	    }
	    function getW(val) {
	        if (val == null) {
	            return E;
	        }
	        if (val == +val) {
	            return val;
	        }
	        $(mgr, {width: val});
	        try {
	            return mgr.getBBox().width;
	        } catch (e) {
	            return 0;
	        }
	    }
	    function getH(val) {
	        if (val == null) {
	            return E;
	        }
	        if (val == +val) {
	            return val;
	        }
	        $(mgr, {height: val});
	        try {
	            return mgr.getBBox().height;
	        } catch (e) {
	            return 0;
	        }
	    }
	    function set(nam, f) {
	        if (name == null) {
	            out[nam] = f(el.attr(nam) || 0);
	        } else if (nam == name) {
	            out = f(value == null ? el.attr(nam) || 0 : value);
	        }
	    }
	    switch (el.type) {
	        case "rect":
	            set("rx", getW);
	            set("ry", getH);
	        case "image":
	            set("width", getW);
	            set("height", getH);
	        case "text":
	            set("x", getW);
	            set("y", getH);
	        break;
	        case "circle":
	            set("cx", getW);
	            set("cy", getH);
	            set("r", getW);
	        break;
	        case "ellipse":
	            set("cx", getW);
	            set("cy", getH);
	            set("rx", getW);
	            set("ry", getH);
	        break;
	        case "line":
	            set("x1", getW);
	            set("x2", getW);
	            set("y1", getH);
	            set("y2", getH);
	        break;
	        case "marker":
	            set("refX", getW);
	            set("markerWidth", getW);
	            set("refY", getH);
	            set("markerHeight", getH);
	        break;
	        case "radialGradient":
	            set("fx", getW);
	            set("fy", getH);
	        break;
	        case "tspan":
	            set("dx", getW);
	            set("dy", getH);
	        break;
	        default:
	            set(name, getW);
	    }
	    svg.removeChild(mgr);
	    return out;
	}
	/*\
	 * Snap.select
	 [ method ]
	 **
	 * Wraps a DOM element specified by CSS selector as @Element
	 - query (string) CSS selector of the element
	 = (Element) the current element
	\*/
	Snap.select = function (query) {
	    query = Str(query).replace(/([^\\]):/g, "$1\\:");
	    return wrap(glob.doc.querySelector(query));
	};
	/*\
	 * Snap.selectAll
	 [ method ]
	 **
	 * Wraps DOM elements specified by CSS selector as set or array of @Element
	 - query (string) CSS selector of the element
	 = (Element) the current element
	\*/
	Snap.selectAll = function (query) {
	    var nodelist = glob.doc.querySelectorAll(query),
	        set = (Snap.set || Array)();
	    for (var i = 0; i < nodelist.length; i++) {
	        set.push(wrap(nodelist[i]));
	    }
	    return set;
	};
	
	function add2group(list) {
	    if (!is(list, "array")) {
	        list = Array.prototype.slice.call(arguments, 0);
	    }
	    var i = 0,
	        j = 0,
	        node = this.node;
	    while (this[i]) delete this[i++];
	    for (i = 0; i < list.length; i++) {
	        if (list[i].type == "set") {
	            list[i].forEach(function (el) {
	                node.appendChild(el.node);
	            });
	        } else {
	            node.appendChild(list[i].node);
	        }
	    }
	    var children = node.childNodes;
	    for (i = 0; i < children.length; i++) {
	        this[j++] = wrap(children[i]);
	    }
	    return this;
	}
	// Hub garbage collector every 10s
	setInterval(function () {
	    for (var key in hub) if (hub[has](key)) {
	        var el = hub[key],
	            node = el.node;
	        if (el.type != "svg" && !node.ownerSVGElement || el.type == "svg" && (!node.parentNode || "ownerSVGElement" in node.parentNode && !node.ownerSVGElement)) {
	            delete hub[key];
	        }
	    }
	}, 1e4);
	function Element(el) {
	    if (el.snap in hub) {
	        return hub[el.snap];
	    }
	    var svg;
	    try {
	        svg = el.ownerSVGElement;
	    } catch(e) {}
	    /*\
	     * Element.node
	     [ property (object) ]
	     **
	     * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
	     > Usage
	     | // draw a circle at coordinate 10,10 with radius of 10
	     | var c = paper.circle(10, 10, 10);
	     | c.node.onclick = function () {
	     |     c.attr("fill", "red");
	     | };
	    \*/
	    this.node = el;
	    if (svg) {
	        this.paper = new Paper(svg);
	    }
	    /*\
	     * Element.type
	     [ property (string) ]
	     **
	     * SVG tag name of the given element.
	    \*/
	    this.type = el.tagName || el.nodeName;
	    var id = this.id = ID(this);
	    this.anims = {};
	    this._ = {
	        transform: []
	    };
	    el.snap = id;
	    hub[id] = this;
	    if (this.type == "g") {
	        this.add = add2group;
	    }
	    if (this.type in {g: 1, mask: 1, pattern: 1, symbol: 1}) {
	        for (var method in Paper.prototype) if (Paper.prototype[has](method)) {
	            this[method] = Paper.prototype[method];
	        }
	    }
	}
	   /*\
	     * Element.attr
	     [ method ]
	     **
	     * Gets or sets given attributes of the element.
	     **
	     - params (object) contains key-value pairs of attributes you want to set
	     * or
	     - param (string) name of the attribute
	     = (Element) the current element
	     * or
	     = (string) value of attribute
	     > Usage
	     | el.attr({
	     |     fill: "#fc0",
	     |     stroke: "#000",
	     |     strokeWidth: 2, // CamelCase...
	     |     "fill-opacity": 0.5, // or dash-separated names
	     |     width: "*=2" // prefixed values
	     | });
	     | console.log(el.attr("fill")); // #fc0
	     * Prefixed values in format `"+=10"` supported. All four operations
	     * (`+`, `-`, `*` and `/`) could be used. Optionally you can use units for `+`
	     * and `-`: `"+=2em"`.
	    \*/
	    Element.prototype.attr = function (params, value) {
	        var el = this,
	            node = el.node;
	        if (!params) {
	            if (node.nodeType != 1) {
	                return {
	                    text: node.nodeValue
	                };
	            }
	            var attr = node.attributes,
	                out = {};
	            for (var i = 0, ii = attr.length; i < ii; i++) {
	                out[attr[i].nodeName] = attr[i].nodeValue;
	            }
	            return out;
	        }
	        if (is(params, "string")) {
	            if (arguments.length > 1) {
	                var json = {};
	                json[params] = value;
	                params = json;
	            } else {
	                return eve("snap.util.getattr." + params, el).firstDefined();
	            }
	        }
	        for (var att in params) {
	            if (params[has](att)) {
	                eve("snap.util.attr." + att, el, params[att]);
	            }
	        }
	        return el;
	    };
	/*\
	 * Snap.parse
	 [ method ]
	 **
	 * Parses SVG fragment and converts it into a @Fragment
	 **
	 - svg (string) SVG string
	 = (Fragment) the @Fragment
	\*/
	Snap.parse = function (svg) {
	    var f = glob.doc.createDocumentFragment(),
	        full = true,
	        div = glob.doc.createElement("div");
	    svg = Str(svg);
	    if (!svg.match(/^\s*<\s*svg(?:\s|>)/)) {
	        svg = "<svg>" + svg + "</svg>";
	        full = false;
	    }
	    div.innerHTML = svg;
	    svg = div.getElementsByTagName("svg")[0];
	    if (svg) {
	        if (full) {
	            f = svg;
	        } else {
	            while (svg.firstChild) {
	                f.appendChild(svg.firstChild);
	            }
	        }
	    }
	    return new Fragment(f);
	};
	function Fragment(frag) {
	    this.node = frag;
	}
	/*\
	 * Snap.fragment
	 [ method ]
	 **
	 * Creates a DOM fragment from a given list of elements or strings
	 **
	 - varargs (…) SVG string
	 = (Fragment) the @Fragment
	\*/
	Snap.fragment = function () {
	    var args = Array.prototype.slice.call(arguments, 0),
	        f = glob.doc.createDocumentFragment();
	    for (var i = 0, ii = args.length; i < ii; i++) {
	        var item = args[i];
	        if (item.node && item.node.nodeType) {
	            f.appendChild(item.node);
	        }
	        if (item.nodeType) {
	            f.appendChild(item);
	        }
	        if (typeof item == "string") {
	            f.appendChild(Snap.parse(item).node);
	        }
	    }
	    return new Fragment(f);
	};
	
	function make(name, parent) {
	    var res = $(name);
	    parent.appendChild(res);
	    var el = wrap(res);
	    return el;
	}
	function Paper(w, h) {
	    var res,
	        desc,
	        defs,
	        proto = Paper.prototype;
	    if (w && w.tagName && w.tagName.toLowerCase() == "svg") {
	        if (w.snap in hub) {
	            return hub[w.snap];
	        }
	        var doc = w.ownerDocument;
	        res = new Element(w);
	        desc = w.getElementsByTagName("desc")[0];
	        defs = w.getElementsByTagName("defs")[0];
	        if (!desc) {
	            desc = $("desc");
	            desc.appendChild(doc.createTextNode("Created with Snap"));
	            res.node.appendChild(desc);
	        }
	        if (!defs) {
	            defs = $("defs");
	            res.node.appendChild(defs);
	        }
	        res.defs = defs;
	        for (var key in proto) if (proto[has](key)) {
	            res[key] = proto[key];
	        }
	        res.paper = res.root = res;
	    } else {
	        res = make("svg", glob.doc.body);
	        $(res.node, {
	            height: h,
	            version: 1.1,
	            width: w,
	            xmlns: xmlns
	        });
	    }
	    return res;
	}
	function wrap(dom) {
	    if (!dom) {
	        return dom;
	    }
	    if (dom instanceof Element || dom instanceof Fragment) {
	        return dom;
	    }
	    if (dom.tagName && dom.tagName.toLowerCase() == "svg") {
	        return new Paper(dom);
	    }
	    if (dom.tagName && dom.tagName.toLowerCase() == "object" && dom.type == "image/svg+xml") {
	        return new Paper(dom.contentDocument.getElementsByTagName("svg")[0]);
	    }
	    return new Element(dom);
	}
	
	Snap._.make = make;
	Snap._.wrap = wrap;
	/*\
	 * Paper.el
	 [ method ]
	 **
	 * Creates an element on paper with a given name and no attributes
	 **
	 - name (string) tag name
	 - attr (object) attributes
	 = (Element) the current element
	 > Usage
	 | var c = paper.circle(10, 10, 10); // is the same as...
	 | var c = paper.el("circle").attr({
	 |     cx: 10,
	 |     cy: 10,
	 |     r: 10
	 | });
	 | // and the same as
	 | var c = paper.el("circle", {
	 |     cx: 10,
	 |     cy: 10,
	 |     r: 10
	 | });
	\*/
	Paper.prototype.el = function (name, attr) {
	    var el = make(name, this.node);
	    attr && el.attr(attr);
	    return el;
	};
	/*\
	 * Element.children
	 [ method ]
	 **
	 * Returns array of all the children of the element.
	 = (array) array of Elements
	\*/
	Element.prototype.children = function () {
	    var out = [],
	        ch = this.node.childNodes;
	    for (var i = 0, ii = ch.length; i < ii; i++) {
	        out[i] = Snap(ch[i]);
	    }
	    return out;
	};
	function jsonFiller(root, o) {
	    for (var i = 0, ii = root.length; i < ii; i++) {
	        var item = {
	                type: root[i].type,
	                attr: root[i].attr()
	            },
	            children = root[i].children();
	        o.push(item);
	        if (children.length) {
	            jsonFiller(children, item.childNodes = []);
	        }
	    }
	}
	/*\
	 * Element.toJSON
	 [ method ]
	 **
	 * Returns object representation of the given element and all its children.
	 = (object) in format
	 o {
	 o     type (string) this.type,
	 o     attr (object) attributes map,
	 o     childNodes (array) optional array of children in the same format
	 o }
	\*/
	Element.prototype.toJSON = function () {
	    var out = [];
	    jsonFiller([this], out);
	    return out[0];
	};
	// default
	eve.on("snap.util.getattr", function () {
	    var att = eve.nt();
	    att = att.substring(att.lastIndexOf(".") + 1);
	    var css = att.replace(/[A-Z]/g, function (letter) {
	        return "-" + letter.toLowerCase();
	    });
	    if (cssAttr[has](css)) {
	        return this.node.ownerDocument.defaultView.getComputedStyle(this.node, null).getPropertyValue(css);
	    } else {
	        return $(this.node, att);
	    }
	});
	var cssAttr = {
	    "alignment-baseline": 0,
	    "baseline-shift": 0,
	    "clip": 0,
	    "clip-path": 0,
	    "clip-rule": 0,
	    "color": 0,
	    "color-interpolation": 0,
	    "color-interpolation-filters": 0,
	    "color-profile": 0,
	    "color-rendering": 0,
	    "cursor": 0,
	    "direction": 0,
	    "display": 0,
	    "dominant-baseline": 0,
	    "enable-background": 0,
	    "fill": 0,
	    "fill-opacity": 0,
	    "fill-rule": 0,
	    "filter": 0,
	    "flood-color": 0,
	    "flood-opacity": 0,
	    "font": 0,
	    "font-family": 0,
	    "font-size": 0,
	    "font-size-adjust": 0,
	    "font-stretch": 0,
	    "font-style": 0,
	    "font-variant": 0,
	    "font-weight": 0,
	    "glyph-orientation-horizontal": 0,
	    "glyph-orientation-vertical": 0,
	    "image-rendering": 0,
	    "kerning": 0,
	    "letter-spacing": 0,
	    "lighting-color": 0,
	    "marker": 0,
	    "marker-end": 0,
	    "marker-mid": 0,
	    "marker-start": 0,
	    "mask": 0,
	    "opacity": 0,
	    "overflow": 0,
	    "pointer-events": 0,
	    "shape-rendering": 0,
	    "stop-color": 0,
	    "stop-opacity": 0,
	    "stroke": 0,
	    "stroke-dasharray": 0,
	    "stroke-dashoffset": 0,
	    "stroke-linecap": 0,
	    "stroke-linejoin": 0,
	    "stroke-miterlimit": 0,
	    "stroke-opacity": 0,
	    "stroke-width": 0,
	    "text-anchor": 0,
	    "text-decoration": 0,
	    "text-rendering": 0,
	    "unicode-bidi": 0,
	    "visibility": 0,
	    "word-spacing": 0,
	    "writing-mode": 0
	};
	
	eve.on("snap.util.attr", function (value) {
	    var att = eve.nt(),
	        attr = {};
	    att = att.substring(att.lastIndexOf(".") + 1);
	    attr[att] = value;
	    var style = att.replace(/-(\w)/gi, function (all, letter) {
	            return letter.toUpperCase();
	        }),
	        css = att.replace(/[A-Z]/g, function (letter) {
	            return "-" + letter.toLowerCase();
	        });
	    if (cssAttr[has](css)) {
	        this.node.style[style] = value == null ? E : value;
	    } else {
	        $(this.node, attr);
	    }
	});
	(function (proto) {}(Paper.prototype));
	
	// simple ajax
	/*\
	 * Snap.ajax
	 [ method ]
	 **
	 * Simple implementation of Ajax
	 **
	 - url (string) URL
	 - postData (object|string) data for post request
	 - callback (function) callback
	 - scope (object) #optional scope of callback
	 * or
	 - url (string) URL
	 - callback (function) callback
	 - scope (object) #optional scope of callback
	 = (XMLHttpRequest) the XMLHttpRequest object, just in case
	\*/
	Snap.ajax = function (url, postData, callback, scope){
	    var req = new XMLHttpRequest,
	        id = ID();
	    if (req) {
	        if (is(postData, "function")) {
	            scope = callback;
	            callback = postData;
	            postData = null;
	        } else if (is(postData, "object")) {
	            var pd = [];
	            for (var key in postData) if (postData.hasOwnProperty(key)) {
	                pd.push(encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]));
	            }
	            postData = pd.join("&");
	        }
	        req.open(postData ? "POST" : "GET", url, true);
	        if (postData) {
	            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	        }
	        if (callback) {
	            eve.once("snap.ajax." + id + ".0", callback);
	            eve.once("snap.ajax." + id + ".200", callback);
	            eve.once("snap.ajax." + id + ".304", callback);
	        }
	        req.onreadystatechange = function() {
	            if (req.readyState != 4) return;
	            eve("snap.ajax." + id + "." + req.status, scope, req);
	        };
	        if (req.readyState == 4) {
	            return req;
	        }
	        req.send(postData);
	        return req;
	    }
	};
	/*\
	 * Snap.load
	 [ method ]
	 **
	 * Loads external SVG file as a @Fragment (see @Snap.ajax for more advanced AJAX)
	 **
	 - url (string) URL
	 - callback (function) callback
	 - scope (object) #optional scope of callback
	\*/
	Snap.load = function (url, callback, scope) {
	    Snap.ajax(url, function (req) {
	        var f = Snap.parse(req.responseText);
	        scope ? callback.call(scope, f) : callback(f);
	    });
	};
	var getOffset = function (elem) {
	    var box = elem.getBoundingClientRect(),
	        doc = elem.ownerDocument,
	        body = doc.body,
	        docElem = doc.documentElement,
	        clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
	        top  = box.top  + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop ) - clientTop,
	        left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
	    return {
	        y: top,
	        x: left
	    };
	};
	/*\
	 * Snap.getElementByPoint
	 [ method ]
	 **
	 * Returns you topmost element under given point.
	 **
	 = (object) Snap element object
	 - x (number) x coordinate from the top left corner of the window
	 - y (number) y coordinate from the top left corner of the window
	 > Usage
	 | Snap.getElementByPoint(mouseX, mouseY).attr({stroke: "#f00"});
	\*/
	Snap.getElementByPoint = function (x, y) {
	    var paper = this,
	        svg = paper.canvas,
	        target = glob.doc.elementFromPoint(x, y);
	    if (glob.win.opera && target.tagName == "svg") {
	        var so = getOffset(target),
	            sr = target.createSVGRect();
	        sr.x = x - so.x;
	        sr.y = y - so.y;
	        sr.width = sr.height = 1;
	        var hits = target.getIntersectionList(sr, null);
	        if (hits.length) {
	            target = hits[hits.length - 1];
	        }
	    }
	    if (!target) {
	        return null;
	    }
	    return wrap(target);
	};
	/*\
	 * Snap.plugin
	 [ method ]
	 **
	 * Let you write plugins. You pass in a function with five arguments, like this:
	 | Snap.plugin(function (Snap, Element, Paper, global, Fragment) {
	 |     Snap.newmethod = function () {};
	 |     Element.prototype.newmethod = function () {};
	 |     Paper.prototype.newmethod = function () {};
	 | });
	 * Inside the function you have access to all main objects (and their
	 * prototypes). This allow you to extend anything you want.
	 **
	 - f (function) your plugin body
	\*/
	Snap.plugin = function (f) {
	    f(Snap, Element, Paper, glob, Fragment);
	};
	glob.win.Snap = Snap;
	return Snap;
	}(window || this));
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
	    var elproto = Element.prototype,
	        is = Snap.is,
	        Str = String,
	        unit2px = Snap._unit2px,
	        $ = Snap._.$,
	        make = Snap._.make,
	        getSomeDefs = Snap._.getSomeDefs,
	        has = "hasOwnProperty",
	        wrap = Snap._.wrap;
	    /*\
	     * Element.getBBox
	     [ method ]
	     **
	     * Returns the bounding box descriptor for the given element
	     **
	     = (object) bounding box descriptor:
	     o {
	     o     cx: (number) x of the center,
	     o     cy: (number) x of the center,
	     o     h: (number) height,
	     o     height: (number) height,
	     o     path: (string) path command for the box,
	     o     r0: (number) radius of a circle that fully encloses the box,
	     o     r1: (number) radius of the smallest circle that can be enclosed,
	     o     r2: (number) radius of the largest circle that can be enclosed,
	     o     vb: (string) box as a viewbox command,
	     o     w: (number) width,
	     o     width: (number) width,
	     o     x2: (number) x of the right side,
	     o     x: (number) x of the left side,
	     o     y2: (number) y of the bottom edge,
	     o     y: (number) y of the top edge
	     o }
	    \*/
	    elproto.getBBox = function (isWithoutTransform) {
	        if (this.type == "tspan") {
	            return Snap._.box(this.node.getClientRects().item(0));
	        }
	        if (!Snap.Matrix || !Snap.path) {
	            return this.node.getBBox();
	        }
	        var el = this,
	            m = new Snap.Matrix;
	        if (el.removed) {
	            return Snap._.box();
	        }
	        while (el.type == "use") {
	            if (!isWithoutTransform) {
	                m = m.add(el.transform().localMatrix.translate(el.attr("x") || 0, el.attr("y") || 0));
	            }
	            if (el.original) {
	                el = el.original;
	            } else {
	                var href = el.attr("xlink:href");
	                el = el.original = el.node.ownerDocument.getElementById(href.substring(href.indexOf("#") + 1));
	            }
	        }
	        var _ = el._,
	            pathfinder = Snap.path.get[el.type] || Snap.path.get.deflt;
	        try {
	            if (isWithoutTransform) {
	                _.bboxwt = pathfinder ? Snap.path.getBBox(el.realPath = pathfinder(el)) : Snap._.box(el.node.getBBox());
	                return Snap._.box(_.bboxwt);
	            } else {
	                el.realPath = pathfinder(el);
	                el.matrix = el.transform().localMatrix;
	                _.bbox = Snap.path.getBBox(Snap.path.map(el.realPath, m.add(el.matrix)));
	                return Snap._.box(_.bbox);
	            }
	        } catch (e) {
	            // Firefox doesn’t give you bbox of hidden element
	            return Snap._.box();
	        }
	    };
	    var propString = function () {
	        return this.string;
	    };
	    function extractTransform(el, tstr) {
	        if (tstr == null) {
	            var doReturn = true;
	            if (el.type == "linearGradient" || el.type == "radialGradient") {
	                tstr = el.node.getAttribute("gradientTransform");
	            } else if (el.type == "pattern") {
	                tstr = el.node.getAttribute("patternTransform");
	            } else {
	                tstr = el.node.getAttribute("transform");
	            }
	            if (!tstr) {
	                return new Snap.Matrix;
	            }
	            tstr = Snap._.svgTransform2string(tstr);
	        } else {
	            if (!Snap._.rgTransform.test(tstr)) {
	                tstr = Snap._.svgTransform2string(tstr);
	            } else {
	                tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || "");
	            }
	            if (is(tstr, "array")) {
	                tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
	            }
	            el._.transform = tstr;
	        }
	        var m = Snap._.transform2matrix(tstr, el.getBBox(1));
	        if (doReturn) {
	            return m;
	        } else {
	            el.matrix = m;
	        }
	    }
	    /*\
	     * Element.transform
	     [ method ]
	     **
	     * Gets or sets transformation of the element
	     **
	     - tstr (string) transform string in Snap or SVG format
	     = (Element) the current element
	     * or
	     = (object) transformation descriptor:
	     o {
	     o     string (string) transform string,
	     o     globalMatrix (Matrix) matrix of all transformations applied to element or its parents,
	     o     localMatrix (Matrix) matrix of transformations applied only to the element,
	     o     diffMatrix (Matrix) matrix of difference between global and local transformations,
	     o     global (string) global transformation as string,
	     o     local (string) local transformation as string,
	     o     toString (function) returns `string` property
	     o }
	    \*/
	    elproto.transform = function (tstr) {
	        var _ = this._;
	        if (tstr == null) {
	            var papa = this,
	                global = new Snap.Matrix(this.node.getCTM()),
	                local = extractTransform(this),
	                ms = [local],
	                m = new Snap.Matrix,
	                i,
	                localString = local.toTransformString(),
	                string = Str(local) == Str(this.matrix) ?
	                            Str(_.transform) : localString;
	            while (papa.type != "svg" && (papa = papa.parent())) {
	                ms.push(extractTransform(papa));
	            }
	            i = ms.length;
	            while (i--) {
	                m.add(ms[i]);
	            }
	            return {
	                string: string,
	                globalMatrix: global,
	                totalMatrix: m,
	                localMatrix: local,
	                diffMatrix: global.clone().add(local.invert()),
	                global: global.toTransformString(),
	                total: m.toTransformString(),
	                local: localString,
	                toString: propString
	            };
	        }
	        if (tstr instanceof Snap.Matrix) {
	            this.matrix = tstr;
	            this._.transform = tstr.toTransformString();
	        } else {
	            extractTransform(this, tstr);
	        }
	
	        if (this.node) {
	            if (this.type == "linearGradient" || this.type == "radialGradient") {
	                $(this.node, {gradientTransform: this.matrix});
	            } else if (this.type == "pattern") {
	                $(this.node, {patternTransform: this.matrix});
	            } else {
	                $(this.node, {transform: this.matrix});
	            }
	        }
	
	        return this;
	    };
	    /*\
	     * Element.parent
	     [ method ]
	     **
	     * Returns the element's parent
	     **
	     = (Element) the parent element
	    \*/
	    elproto.parent = function () {
	        return wrap(this.node.parentNode);
	    };
	    /*\
	     * Element.append
	     [ method ]
	     **
	     * Appends the given element to current one
	     **
	     - el (Element|Set) element to append
	     = (Element) the parent element
	    \*/
	    /*\
	     * Element.add
	     [ method ]
	     **
	     * See @Element.append
	    \*/
	    elproto.append = elproto.add = function (el) {
	        if (el) {
	            if (el.type == "set") {
	                var it = this;
	                el.forEach(function (el) {
	                    it.add(el);
	                });
	                return this;
	            }
	            el = wrap(el);
	            this.node.appendChild(el.node);
	            el.paper = this.paper;
	        }
	        return this;
	    };
	    /*\
	     * Element.appendTo
	     [ method ]
	     **
	     * Appends the current element to the given one
	     **
	     - el (Element) parent element to append to
	     = (Element) the child element
	    \*/
	    elproto.appendTo = function (el) {
	        if (el) {
	            el = wrap(el);
	            el.append(this);
	        }
	        return this;
	    };
	    /*\
	     * Element.prepend
	     [ method ]
	     **
	     * Prepends the given element to the current one
	     **
	     - el (Element) element to prepend
	     = (Element) the parent element
	    \*/
	    elproto.prepend = function (el) {
	        if (el) {
	            if (el.type == "set") {
	                var it = this,
	                    first;
	                el.forEach(function (el) {
	                    if (first) {
	                        first.after(el);
	                    } else {
	                        it.prepend(el);
	                    }
	                    first = el;
	                });
	                return this;
	            }
	            el = wrap(el);
	            var parent = el.parent();
	            this.node.insertBefore(el.node, this.node.firstChild);
	            this.add && this.add();
	            el.paper = this.paper;
	            this.parent() && this.parent().add();
	            parent && parent.add();
	        }
	        return this;
	    };
	    /*\
	     * Element.prependTo
	     [ method ]
	     **
	     * Prepends the current element to the given one
	     **
	     - el (Element) parent element to prepend to
	     = (Element) the child element
	    \*/
	    elproto.prependTo = function (el) {
	        el = wrap(el);
	        el.prepend(this);
	        return this;
	    };
	    /*\
	     * Element.before
	     [ method ]
	     **
	     * Inserts given element before the current one
	     **
	     - el (Element) element to insert
	     = (Element) the parent element
	    \*/
	    elproto.before = function (el) {
	        if (el.type == "set") {
	            var it = this;
	            el.forEach(function (el) {
	                var parent = el.parent();
	                it.node.parentNode.insertBefore(el.node, it.node);
	                parent && parent.add();
	            });
	            this.parent().add();
	            return this;
	        }
	        el = wrap(el);
	        var parent = el.parent();
	        this.node.parentNode.insertBefore(el.node, this.node);
	        this.parent() && this.parent().add();
	        parent && parent.add();
	        el.paper = this.paper;
	        return this;
	    };
	    /*\
	     * Element.after
	     [ method ]
	     **
	     * Inserts given element after the current one
	     **
	     - el (Element) element to insert
	     = (Element) the parent element
	    \*/
	    elproto.after = function (el) {
	        el = wrap(el);
	        var parent = el.parent();
	        if (this.node.nextSibling) {
	            this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
	        } else {
	            this.node.parentNode.appendChild(el.node);
	        }
	        this.parent() && this.parent().add();
	        parent && parent.add();
	        el.paper = this.paper;
	        return this;
	    };
	    /*\
	     * Element.insertBefore
	     [ method ]
	     **
	     * Inserts the element after the given one
	     **
	     - el (Element) element next to whom insert to
	     = (Element) the parent element
	    \*/
	    elproto.insertBefore = function (el) {
	        el = wrap(el);
	        var parent = this.parent();
	        el.node.parentNode.insertBefore(this.node, el.node);
	        this.paper = el.paper;
	        parent && parent.add();
	        el.parent() && el.parent().add();
	        return this;
	    };
	    /*\
	     * Element.insertAfter
	     [ method ]
	     **
	     * Inserts the element after the given one
	     **
	     - el (Element) element next to whom insert to
	     = (Element) the parent element
	    \*/
	    elproto.insertAfter = function (el) {
	        el = wrap(el);
	        var parent = this.parent();
	        el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
	        this.paper = el.paper;
	        parent && parent.add();
	        el.parent() && el.parent().add();
	        return this;
	    };
	    /*\
	     * Element.remove
	     [ method ]
	     **
	     * Removes element from the DOM
	     = (Element) the detached element
	    \*/
	    elproto.remove = function () {
	        var parent = this.parent();
	        this.node.parentNode && this.node.parentNode.removeChild(this.node);
	        delete this.paper;
	        this.removed = true;
	        parent && parent.add();
	        return this;
	    };
	    /*\
	     * Element.select
	     [ method ]
	     **
	     * Gathers the nested @Element matching the given set of CSS selectors
	     **
	     - query (string) CSS selector
	     = (Element) result of query selection
	    \*/
	    elproto.select = function (query) {
	        return wrap(this.node.querySelector(query));
	    };
	    /*\
	     * Element.selectAll
	     [ method ]
	     **
	     * Gathers nested @Element objects matching the given set of CSS selectors
	     **
	     - query (string) CSS selector
	     = (Set|array) result of query selection
	    \*/
	    elproto.selectAll = function (query) {
	        var nodelist = this.node.querySelectorAll(query),
	            set = (Snap.set || Array)();
	        for (var i = 0; i < nodelist.length; i++) {
	            set.push(wrap(nodelist[i]));
	        }
	        return set;
	    };
	    /*\
	     * Element.asPX
	     [ method ]
	     **
	     * Returns given attribute of the element as a `px` value (not %, em, etc.)
	     **
	     - attr (string) attribute name
	     - value (string) #optional attribute value
	     = (Element) result of query selection
	    \*/
	    elproto.asPX = function (attr, value) {
	        if (value == null) {
	            value = this.attr(attr);
	        }
	        return +unit2px(this, attr, value);
	    };
	    // SIERRA Element.use(): I suggest adding a note about how to access the original element the returned <use> instantiates. It's a part of SVG with which ordinary web developers may be least familiar.
	    /*\
	     * Element.use
	     [ method ]
	     **
	     * Creates a `<use>` element linked to the current element
	     **
	     = (Element) the `<use>` element
	    \*/
	    elproto.use = function () {
	        var use,
	            id = this.node.id;
	        if (!id) {
	            id = this.id;
	            $(this.node, {
	                id: id
	            });
	        }
	        if (this.type == "linearGradient" || this.type == "radialGradient" ||
	            this.type == "pattern") {
	            use = make(this.type, this.node.parentNode);
	        } else {
	            use = make("use", this.node.parentNode);
	        }
	        $(use.node, {
	            "xlink:href": "#" + id
	        });
	        use.original = this;
	        return use;
	    };
	    function fixids(el) {
	        var els = el.selectAll("*"),
	            it,
	            url = /^\s*url\(("|'|)(.*)\1\)\s*$/,
	            ids = [],
	            uses = {};
	        function urltest(it, name) {
	            var val = $(it.node, name);
	            val = val && val.match(url);
	            val = val && val[2];
	            if (val && val.charAt() == "#") {
	                val = val.substring(1);
	            } else {
	                return;
	            }
	            if (val) {
	                uses[val] = (uses[val] || []).concat(function (id) {
	                    var attr = {};
	                    attr[name] = Snap.url(id);
	                    $(it.node, attr);
	                });
	            }
	        }
	        function linktest(it) {
	            var val = $(it.node, "xlink:href");
	            if (val && val.charAt() == "#") {
	                val = val.substring(1);
	            } else {
	                return;
	            }
	            if (val) {
	                uses[val] = (uses[val] || []).concat(function (id) {
	                    it.attr("xlink:href", "#" + id);
	                });
	            }
	        }
	        for (var i = 0, ii = els.length; i < ii; i++) {
	            it = els[i];
	            urltest(it, "fill");
	            urltest(it, "stroke");
	            urltest(it, "filter");
	            urltest(it, "mask");
	            urltest(it, "clip-path");
	            linktest(it);
	            var oldid = $(it.node, "id");
	            if (oldid) {
	                $(it.node, {id: it.id});
	                ids.push({
	                    old: oldid,
	                    id: it.id
	                });
	            }
	        }
	        for (i = 0, ii = ids.length; i < ii; i++) {
	            var fs = uses[ids[i].old];
	            if (fs) {
	                for (var j = 0, jj = fs.length; j < jj; j++) {
	                    fs[j](ids[i].id);
	                }
	            }
	        }
	    }
	    /*\
	     * Element.clone
	     [ method ]
	     **
	     * Creates a clone of the element and inserts it after the element
	     **
	     = (Element) the clone
	    \*/
	    elproto.clone = function () {
	        var clone = wrap(this.node.cloneNode(true));
	        if ($(clone.node, "id")) {
	            $(clone.node, {id: clone.id});
	        }
	        fixids(clone);
	        clone.insertAfter(this);
	        return clone;
	    };
	    /*\
	     * Element.toDefs
	     [ method ]
	     **
	     * Moves element to the shared `<defs>` area
	     **
	     = (Element) the element
	    \*/
	    elproto.toDefs = function () {
	        var defs = getSomeDefs(this);
	        defs.appendChild(this.node);
	        return this;
	    };
	    /*\
	     * Element.toPattern
	     [ method ]
	     **
	     * Creates a `<pattern>` element from the current element
	     **
	     * To create a pattern you have to specify the pattern rect:
	     - x (string|number)
	     - y (string|number)
	     - width (string|number)
	     - height (string|number)
	     = (Element) the `<pattern>` element
	     * You can use pattern later on as an argument for `fill` attribute:
	     | var p = paper.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({
	     |         fill: "none",
	     |         stroke: "#bada55",
	     |         strokeWidth: 5
	     |     }).pattern(0, 0, 10, 10),
	     |     c = paper.circle(200, 200, 100);
	     | c.attr({
	     |     fill: p
	     | });
	    \*/
	    elproto.pattern = elproto.toPattern = function (x, y, width, height) {
	        var p = make("pattern", getSomeDefs(this));
	        if (x == null) {
	            x = this.getBBox();
	        }
	        if (is(x, "object") && "x" in x) {
	            y = x.y;
	            width = x.width;
	            height = x.height;
	            x = x.x;
	        }
	        $(p.node, {
	            x: x,
	            y: y,
	            width: width,
	            height: height,
	            patternUnits: "userSpaceOnUse",
	            id: p.id,
	            viewBox: [x, y, width, height].join(" ")
	        });
	        p.node.appendChild(this.node);
	        return p;
	    };
	// SIERRA Element.marker(): clarify what a reference point is. E.g., helps you offset the object from its edge such as when centering it over a path.
	// SIERRA Element.marker(): I suggest the method should accept default reference point values.  Perhaps centered with (refX = width/2) and (refY = height/2)? Also, couldn't it assume the element's current _width_ and _height_? And please specify what _x_ and _y_ mean: offsets? If so, from where?  Couldn't they also be assigned default values?
	    /*\
	     * Element.marker
	     [ method ]
	     **
	     * Creates a `<marker>` element from the current element
	     **
	     * To create a marker you have to specify the bounding rect and reference point:
	     - x (number)
	     - y (number)
	     - width (number)
	     - height (number)
	     - refX (number)
	     - refY (number)
	     = (Element) the `<marker>` element
	     * You can specify the marker later as an argument for `marker-start`, `marker-end`, `marker-mid`, and `marker` attributes. The `marker` attribute places the marker at every point along the path, and `marker-mid` places them at every point except the start and end.
	    \*/
	    // TODO add usage for markers
	    elproto.marker = function (x, y, width, height, refX, refY) {
	        var p = make("marker", getSomeDefs(this));
	        if (x == null) {
	            x = this.getBBox();
	        }
	        if (is(x, "object") && "x" in x) {
	            y = x.y;
	            width = x.width;
	            height = x.height;
	            refX = x.refX || x.cx;
	            refY = x.refY || x.cy;
	            x = x.x;
	        }
	        $(p.node, {
	            viewBox: [x, y, width, height].join(" "),
	            markerWidth: width,
	            markerHeight: height,
	            orient: "auto",
	            refX: refX || 0,
	            refY: refY || 0,
	            id: p.id
	        });
	        p.node.appendChild(this.node);
	        return p;
	    };
	    var eldata = {};
	    /*\
	     * Element.data
	     [ method ]
	     **
	     * Adds or retrieves given value associated with given key. (Don’t confuse
	     * with `data-` attributes)
	     *
	     * See also @Element.removeData
	     - key (string) key to store data
	     - value (any) #optional value to store
	     = (object) @Element
	     * or, if value is not specified:
	     = (any) value
	     > Usage
	     | for (var i = 0, i < 5, i++) {
	     |     paper.circle(10 + 15 * i, 10, 10)
	     |          .attr({fill: "#000"})
	     |          .data("i", i)
	     |          .click(function () {
	     |             alert(this.data("i"));
	     |          });
	     | }
	    \*/
	    elproto.data = function (key, value) {
	        var data = eldata[this.id] = eldata[this.id] || {};
	        if (arguments.length == 0){
	            eve("snap.data.get." + this.id, this, data, null);
	            return data;
	        }
	        if (arguments.length == 1) {
	            if (Snap.is(key, "object")) {
	                for (var i in key) if (key[has](i)) {
	                    this.data(i, key[i]);
	                }
	                return this;
	            }
	            eve("snap.data.get." + this.id, this, data[key], key);
	            return data[key];
	        }
	        data[key] = value;
	        eve("snap.data.set." + this.id, this, value, key);
	        return this;
	    };
	    /*\
	     * Element.removeData
	     [ method ]
	     **
	     * Removes value associated with an element by given key.
	     * If key is not provided, removes all the data of the element.
	     - key (string) #optional key
	     = (object) @Element
	    \*/
	    elproto.removeData = function (key) {
	        if (key == null) {
	            eldata[this.id] = {};
	        } else {
	            eldata[this.id] && delete eldata[this.id][key];
	        }
	        return this;
	    };
	    /*\
	     * Element.outerSVG
	     [ method ]
	     **
	     * Returns SVG code for the element, equivalent to HTML's `outerHTML`.
	     *
	     * See also @Element.innerSVG
	     = (string) SVG code for the element
	    \*/
	    /*\
	     * Element.toString
	     [ method ]
	     **
	     * See @Element.outerSVG
	    \*/
	    elproto.outerSVG = elproto.toString = toString(1);
	    /*\
	     * Element.innerSVG
	     [ method ]
	     **
	     * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
	     = (string) SVG code for the element
	    \*/
	    elproto.innerSVG = toString();
	    function toString(type) {
	        return function () {
	            var res = type ? "<" + this.type : "",
	                attr = this.node.attributes,
	                chld = this.node.childNodes;
	            if (type) {
	                for (var i = 0, ii = attr.length; i < ii; i++) {
	                    res += " " + attr[i].name + '="' +
	                            attr[i].value.replace(/"/g, '\\"') + '"';
	                }
	            }
	            if (chld.length) {
	                type && (res += ">");
	                for (i = 0, ii = chld.length; i < ii; i++) {
	                    if (chld[i].nodeType == 3) {
	                        res += chld[i].nodeValue;
	                    } else if (chld[i].nodeType == 1) {
	                        res += wrap(chld[i]).toString();
	                    }
	                }
	                type && (res += "</" + this.type + ">");
	            } else {
	                type && (res += "/>");
	            }
	            return res;
	        };
	    }
	    elproto.toDataURL = function () {
	        if (window && window.btoa) {
	            var bb = this.getBBox(),
	                svg = Snap.format('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="{x} {y} {width} {height}">{contents}</svg>', {
	                x: +bb.x.toFixed(3),
	                y: +bb.y.toFixed(3),
	                width: +bb.width.toFixed(3),
	                height: +bb.height.toFixed(3),
	                contents: this.outerSVG()
	            });
	            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
	        }
	    };
	    /*\
	     * Fragment.select
	     [ method ]
	     **
	     * See @Element.select
	    \*/
	    Fragment.prototype.select = elproto.select;
	    /*\
	     * Fragment.selectAll
	     [ method ]
	     **
	     * See @Element.selectAll
	    \*/
	    Fragment.prototype.selectAll = elproto.selectAll;
	});
	
	// Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
	    var elproto = Element.prototype,
	        is = Snap.is,
	        Str = String,
	        has = "hasOwnProperty";
	    function slice(from, to, f) {
	        return function (arr) {
	            var res = arr.slice(from, to);
	            if (res.length == 1) {
	                res = res[0];
	            }
	            return f ? f(res) : res;
	        };
	    }
	    var Animation = function (attr, ms, easing, callback) {
	        if (typeof easing == "function" && !easing.length) {
	            callback = easing;
	            easing = mina.linear;
	        }
	        this.attr = attr;
	        this.dur = ms;
	        easing && (this.easing = easing);
	        callback && (this.callback = callback);
	    };
	    Snap._.Animation = Animation;
	    /*\
	     * Snap.animation
	     [ method ]
	     **
	     * Creates an animation object
	     **
	     - attr (object) attributes of final destination
	     - duration (number) duration of the animation, in milliseconds
	     - easing (function) #optional one of easing functions of @mina or custom one
	     - callback (function) #optional callback function that fires when animation ends
	     = (object) animation object
	    \*/
	    Snap.animation = function (attr, ms, easing, callback) {
	        return new Animation(attr, ms, easing, callback);
	    };
	    /*\
	     * Element.inAnim
	     [ method ]
	     **
	     * Returns a set of animations that may be able to manipulate the current element
	     **
	     = (object) in format:
	     o {
	     o     anim (object) animation object,
	     o     mina (object) @mina object,
	     o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
	     o     status (function) gets or sets the status of the animation,
	     o     stop (function) stops the animation
	     o }
	    \*/
	    elproto.inAnim = function () {
	        var el = this,
	            res = [];
	        for (var id in el.anims) if (el.anims[has](id)) {
	            (function (a) {
	                res.push({
	                    anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
	                    mina: a,
	                    curStatus: a.status(),
	                    status: function (val) {
	                        return a.status(val);
	                    },
	                    stop: function () {
	                        a.stop();
	                    }
	                });
	            }(el.anims[id]));
	        }
	        return res;
	    };
	    /*\
	     * Snap.animate
	     [ method ]
	     **
	     * Runs generic animation of one number into another with a caring function
	     **
	     - from (number|array) number or array of numbers
	     - to (number|array) number or array of numbers
	     - setter (function) caring function that accepts one number argument
	     - duration (number) duration, in milliseconds
	     - easing (function) #optional easing function from @mina or custom
	     - callback (function) #optional callback function to execute when animation ends
	     = (object) animation object in @mina format
	     o {
	     o     id (string) animation id, consider it read-only,
	     o     duration (function) gets or sets the duration of the animation,
	     o     easing (function) easing,
	     o     speed (function) gets or sets the speed of the animation,
	     o     status (function) gets or sets the status of the animation,
	     o     stop (function) stops the animation
	     o }
	     | var rect = Snap().rect(0, 0, 10, 10);
	     | Snap.animate(0, 10, function (val) {
	     |     rect.attr({
	     |         x: val
	     |     });
	     | }, 1000);
	     | // in given context is equivalent to
	     | rect.animate({x: 10}, 1000);
	    \*/
	    Snap.animate = function (from, to, setter, ms, easing, callback) {
	        if (typeof easing == "function" && !easing.length) {
	            callback = easing;
	            easing = mina.linear;
	        }
	        var now = mina.time(),
	            anim = mina(from, to, now, now + ms, mina.time, setter, easing);
	        callback && eve.once("mina.finish." + anim.id, callback);
	        return anim;
	    };
	    /*\
	     * Element.stop
	     [ method ]
	     **
	     * Stops all the animations for the current element
	     **
	     = (Element) the current element
	    \*/
	    elproto.stop = function () {
	        var anims = this.inAnim();
	        for (var i = 0, ii = anims.length; i < ii; i++) {
	            anims[i].stop();
	        }
	        return this;
	    };
	    /*\
	     * Element.animate
	     [ method ]
	     **
	     * Animates the given attributes of the element
	     **
	     - attrs (object) key-value pairs of destination attributes
	     - duration (number) duration of the animation in milliseconds
	     - easing (function) #optional easing function from @mina or custom
	     - callback (function) #optional callback function that executes when the animation ends
	     = (Element) the current element
	    \*/
	    elproto.animate = function (attrs, ms, easing, callback) {
	        if (typeof easing == "function" && !easing.length) {
	            callback = easing;
	            easing = mina.linear;
	        }
	        if (attrs instanceof Animation) {
	            callback = attrs.callback;
	            easing = attrs.easing;
	            ms = attrs.dur;
	            attrs = attrs.attr;
	        }
	        var fkeys = [], tkeys = [], keys = {}, from, to, f, eq,
	            el = this;
	        for (var key in attrs) if (attrs[has](key)) {
	            if (el.equal) {
	                eq = el.equal(key, Str(attrs[key]));
	                from = eq.from;
	                to = eq.to;
	                f = eq.f;
	            } else {
	                from = +el.attr(key);
	                to = +attrs[key];
	            }
	            var len = is(from, "array") ? from.length : 1;
	            keys[key] = slice(fkeys.length, fkeys.length + len, f);
	            fkeys = fkeys.concat(from);
	            tkeys = tkeys.concat(to);
	        }
	        var now = mina.time(),
	            anim = mina(fkeys, tkeys, now, now + ms, mina.time, function (val) {
	                var attr = {};
	                for (var key in keys) if (keys[has](key)) {
	                    attr[key] = keys[key](val);
	                }
	                el.attr(attr);
	            }, easing);
	        el.anims[anim.id] = anim;
	        anim._attrs = attrs;
	        anim._callback = callback;
	        eve("snap.animcreated." + el.id, anim);
	        eve.once("mina.finish." + anim.id, function () {
	            eve.off("mina.*." + anim.id);
	            delete el.anims[anim.id];
	            callback && callback.call(el);
	        });
	        eve.once("mina.stop." + anim.id, function () {
	            eve.off("mina.*." + anim.id);
	            delete el.anims[anim.id];
	        });
	        return el;
	    };
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
	    var objectToString = Object.prototype.toString,
	        Str = String,
	        math = Math,
	        E = "";
	    function Matrix(a, b, c, d, e, f) {
	        if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
	            this.a = a.a;
	            this.b = a.b;
	            this.c = a.c;
	            this.d = a.d;
	            this.e = a.e;
	            this.f = a.f;
	            return;
	        }
	        if (a != null) {
	            this.a = +a;
	            this.b = +b;
	            this.c = +c;
	            this.d = +d;
	            this.e = +e;
	            this.f = +f;
	        } else {
	            this.a = 1;
	            this.b = 0;
	            this.c = 0;
	            this.d = 1;
	            this.e = 0;
	            this.f = 0;
	        }
	    }
	    (function (matrixproto) {
	        /*\
	         * Matrix.add
	         [ method ]
	         **
	         * Adds the given matrix to existing one
	         - a (number)
	         - b (number)
	         - c (number)
	         - d (number)
	         - e (number)
	         - f (number)
	         * or
	         - matrix (object) @Matrix
	        \*/
	        matrixproto.add = function (a, b, c, d, e, f) {
	            if (a && a instanceof Matrix) {
	                return this.add(a.a, a.b, a.c, a.d, a.e, a.f);
	            }
	            var aNew = a * this.a + b * this.c,
	                bNew = a * this.b + b * this.d;
	            this.e += e * this.a + f * this.c;
	            this.f += e * this.b + f * this.d;
	            this.c = c * this.a + d * this.c;
	            this.d = c * this.b + d * this.d;
	
	            this.a = aNew;
	            this.b = bNew;
	            return this;
	        };
	        /*\
	         * Matrix.multLeft
	         [ method ]
	         **
	         * Multiplies a passed affine transform to the left: M * this.
	         - a (number)
	         - b (number)
	         - c (number)
	         - d (number)
	         - e (number)
	         - f (number)
	         * or
	         - matrix (object) @Matrix
	        \*/
	        Matrix.prototype.multLeft = function (a, b, c, d, e, f) {
	            if (a && a instanceof Matrix) {
	                return this.multLeft(a.a, a.b, a.c, a.d, a.e, a.f);
	            }
	            var aNew = a * this.a + c * this.b,
	                cNew = a * this.c + c * this.d,
	                eNew = a * this.e + c * this.f + e;
	            this.b = b * this.a + d * this.b;
	            this.d = b * this.c + d * this.d;
	            this.f = b * this.e + d * this.f + f;
	
	            this.a = aNew;
	            this.c = cNew;
	            this.e = eNew;
	            return this;
	        };
	        /*\
	         * Matrix.invert
	         [ method ]
	         **
	         * Returns an inverted version of the matrix
	         = (object) @Matrix
	        \*/
	        matrixproto.invert = function () {
	            var me = this,
	                x = me.a * me.d - me.b * me.c;
	            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
	        };
	        /*\
	         * Matrix.clone
	         [ method ]
	         **
	         * Returns a copy of the matrix
	         = (object) @Matrix
	        \*/
	        matrixproto.clone = function () {
	            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
	        };
	        /*\
	         * Matrix.translate
	         [ method ]
	         **
	         * Translate the matrix
	         - x (number) horizontal offset distance
	         - y (number) vertical offset distance
	        \*/
	        matrixproto.translate = function (x, y) {
	            this.e += x * this.a + y * this.c;
	            this.f += x * this.b + y * this.d;
	            return this;
	        };
	        /*\
	         * Matrix.scale
	         [ method ]
	         **
	         * Scales the matrix
	         - x (number) amount to be scaled, with `1` resulting in no change
	         - y (number) #optional amount to scale along the vertical axis. (Otherwise `x` applies to both axes.)
	         - cx (number) #optional horizontal origin point from which to scale
	         - cy (number) #optional vertical origin point from which to scale
	         * Default cx, cy is the middle point of the element.
	        \*/
	        matrixproto.scale = function (x, y, cx, cy) {
	            y == null && (y = x);
	            (cx || cy) && this.translate(cx, cy);
	            this.a *= x;
	            this.b *= x;
	            this.c *= y;
	            this.d *= y;
	            (cx || cy) && this.translate(-cx, -cy);
	            return this;
	        };
	        /*\
	         * Matrix.rotate
	         [ method ]
	         **
	         * Rotates the matrix
	         - a (number) angle of rotation, in degrees
	         - x (number) horizontal origin point from which to rotate
	         - y (number) vertical origin point from which to rotate
	        \*/
	        matrixproto.rotate = function (a, x, y) {
	            a = Snap.rad(a);
	            x = x || 0;
	            y = y || 0;
	            var cos = +math.cos(a).toFixed(9),
	                sin = +math.sin(a).toFixed(9);
	            this.add(cos, sin, -sin, cos, x, y);
	            return this.add(1, 0, 0, 1, -x, -y);
	        };
	        /*\
	         * Matrix.skewX
	         [ method ]
	         **
	         * Skews the matrix along the x-axis
	         - x (number) Angle to skew along the x-axis (in degrees).
	        \*/
	        matrixproto.skewX = function (x) {
	            return this.skew(x, 0);
	        };
	        /*\
	         * Matrix.skewY
	         [ method ]
	         **
	         * Skews the matrix along the y-axis
	         - y (number) Angle to skew along the y-axis (in degrees).
	        \*/
	        matrixproto.skewY = function (y) {
	            return this.skew(0, y);
	        };
	        /*\
	         * Matrix.skew
	         [ method ]
	         **
	         * Skews the matrix
	         - y (number) Angle to skew along the y-axis (in degrees).
	         - x (number) Angle to skew along the x-axis (in degrees).
	        \*/
	        matrixproto.skew = function (x, y) {
	            x = x || 0;
	            y = y || 0;
	            x = Snap.rad(x);
	            y = Snap.rad(y);
	            var c = math.tan(x).toFixed(9);
	            var b = math.tan(y).toFixed(9);
	            return this.add(1, b, c, 1, 0, 0);
	        };
	        /*\
	         * Matrix.x
	         [ method ]
	         **
	         * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
	         - x (number)
	         - y (number)
	         = (number) x
	        \*/
	        matrixproto.x = function (x, y) {
	            return x * this.a + y * this.c + this.e;
	        };
	        /*\
	         * Matrix.y
	         [ method ]
	         **
	         * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
	         - x (number)
	         - y (number)
	         = (number) y
	        \*/
	        matrixproto.y = function (x, y) {
	            return x * this.b + y * this.d + this.f;
	        };
	        matrixproto.get = function (i) {
	            return +this[Str.fromCharCode(97 + i)].toFixed(4);
	        };
	        matrixproto.toString = function () {
	            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
	        };
	        matrixproto.offset = function () {
	            return [this.e.toFixed(4), this.f.toFixed(4)];
	        };
	        function norm(a) {
	            return a[0] * a[0] + a[1] * a[1];
	        }
	        function normalize(a) {
	            var mag = math.sqrt(norm(a));
	            a[0] && (a[0] /= mag);
	            a[1] && (a[1] /= mag);
	        }
	        /*\
	         * Matrix.determinant
	         [ method ]
	         **
	         * Finds determinant of the given matrix.
	         = (number) determinant
	        \*/
	        matrixproto.determinant = function () {
	            return this.a * this.d - this.b * this.c;
	        };
	        /*\
	         * Matrix.split
	         [ method ]
	         **
	         * Splits matrix into primitive transformations
	         = (object) in format:
	         o dx (number) translation by x
	         o dy (number) translation by y
	         o scalex (number) scale by x
	         o scaley (number) scale by y
	         o shear (number) shear
	         o rotate (number) rotation in deg
	         o isSimple (boolean) could it be represented via simple transformations
	        \*/
	        matrixproto.split = function () {
	            var out = {};
	            // translation
	            out.dx = this.e;
	            out.dy = this.f;
	
	            // scale and shear
	            var row = [[this.a, this.b], [this.c, this.d]];
	            out.scalex = math.sqrt(norm(row[0]));
	            normalize(row[0]);
	
	            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
	            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];
	
	            out.scaley = math.sqrt(norm(row[1]));
	            normalize(row[1]);
	            out.shear /= out.scaley;
	
	            if (this.determinant() < 0) {
	                out.scalex = -out.scalex;
	            }
	
	            // rotation
	            var sin = row[0][1],
	                cos = row[1][1];
	            if (cos < 0) {
	                out.rotate = Snap.deg(math.acos(cos));
	                if (sin < 0) {
	                    out.rotate = 360 - out.rotate;
	                }
	            } else {
	                out.rotate = Snap.deg(math.asin(sin));
	            }
	
	            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
	            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
	            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
	            return out;
	        };
	        /*\
	         * Matrix.toTransformString
	         [ method ]
	         **
	         * Returns transform string that represents given matrix
	         = (string) transform string
	        \*/
	        matrixproto.toTransformString = function (shorter) {
	            var s = shorter || this.split();
	            if (!+s.shear.toFixed(9)) {
	                s.scalex = +s.scalex.toFixed(4);
	                s.scaley = +s.scaley.toFixed(4);
	                s.rotate = +s.rotate.toFixed(4);
	                return  (s.dx || s.dy ? "t" + [+s.dx.toFixed(4), +s.dy.toFixed(4)] : E) +
	                        (s.rotate ? "r" + [+s.rotate.toFixed(4), 0, 0] : E) +
	                        (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E);
	            } else {
	                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
	            }
	        };
	    })(Matrix.prototype);
	    /*\
	     * Snap.Matrix
	     [ method ]
	     **
	     * Matrix constructor, extend on your own risk.
	     * To create matrices use @Snap.matrix.
	    \*/
	    Snap.Matrix = Matrix;
	    /*\
	     * Snap.matrix
	     [ method ]
	     **
	     * Utility method
	     **
	     * Returns a matrix based on the given parameters
	     - a (number)
	     - b (number)
	     - c (number)
	     - d (number)
	     - e (number)
	     - f (number)
	     * or
	     - svgMatrix (SVGMatrix)
	     = (object) @Matrix
	    \*/
	    Snap.matrix = function (a, b, c, d, e, f) {
	        return new Matrix(a, b, c, d, e, f);
	    };
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
	    var has = "hasOwnProperty",
	        make = Snap._.make,
	        wrap = Snap._.wrap,
	        is = Snap.is,
	        getSomeDefs = Snap._.getSomeDefs,
	        reURLValue = /^url\((['"]?)([^)]+)\1\)$/,
	        $ = Snap._.$,
	        URL = Snap.url,
	        Str = String,
	        separator = Snap._.separator,
	        E = "";
	    /*\
	     * Snap.deurl
	     [ method ]
	     **
	     * Unwraps path from `"url(<path>)"`.
	     - value (string) url path
	     = (string) unwrapped path
	    \*/
	    Snap.deurl = function (value) {
	        var res = String(value).match(reURLValue);
	        return res ? res[2] : value;
	    }
	    // Attributes event handlers
	    eve.on("snap.util.attr.mask", function (value) {
	        if (value instanceof Element || value instanceof Fragment) {
	            eve.stop();
	            if (value instanceof Fragment && value.node.childNodes.length == 1) {
	                value = value.node.firstChild;
	                getSomeDefs(this).appendChild(value);
	                value = wrap(value);
	            }
	            if (value.type == "mask") {
	                var mask = value;
	            } else {
	                mask = make("mask", getSomeDefs(this));
	                mask.node.appendChild(value.node);
	            }
	            !mask.node.id && $(mask.node, {
	                id: mask.id
	            });
	            $(this.node, {
	                mask: URL(mask.id)
	            });
	        }
	    });
	    (function (clipIt) {
	        eve.on("snap.util.attr.clip", clipIt);
	        eve.on("snap.util.attr.clip-path", clipIt);
	        eve.on("snap.util.attr.clipPath", clipIt);
	    }(function (value) {
	        if (value instanceof Element || value instanceof Fragment) {
	            eve.stop();
	            var clip,
	                node = value.node;
	            while (node) {
	                if (node.nodeName === "clipPath") {
	                    clip = new Element(node);
	                    break;
	                }
	                if (node.nodeName === "svg") {
	                    clip = undefined;
	                    break;
	                }
	                node = node.parentNode;
	            }
	            if (!clip) {
	                clip = make("clipPath", getSomeDefs(this));
	                clip.node.appendChild(value.node);
	                !clip.node.id && $(clip.node, {
	                    id: clip.id
	                });
	            }
	            $(this.node, {
	                "clip-path": URL(clip.node.id || clip.id)
	            });
	        }
	    }));
	    function fillStroke(name) {
	        return function (value) {
	            eve.stop();
	            if (value instanceof Fragment && value.node.childNodes.length == 1 &&
	                (value.node.firstChild.tagName == "radialGradient" ||
	                value.node.firstChild.tagName == "linearGradient" ||
	                value.node.firstChild.tagName == "pattern")) {
	                value = value.node.firstChild;
	                getSomeDefs(this).appendChild(value);
	                value = wrap(value);
	            }
	            if (value instanceof Element) {
	                if (value.type == "radialGradient" || value.type == "linearGradient"
	                   || value.type == "pattern") {
	                    if (!value.node.id) {
	                        $(value.node, {
	                            id: value.id
	                        });
	                    }
	                    var fill = URL(value.node.id);
	                } else {
	                    fill = value.attr(name);
	                }
	            } else {
	                fill = Snap.color(value);
	                if (fill.error) {
	                    var grad = Snap(getSomeDefs(this).ownerSVGElement).gradient(value);
	                    if (grad) {
	                        if (!grad.node.id) {
	                            $(grad.node, {
	                                id: grad.id
	                            });
	                        }
	                        fill = URL(grad.node.id);
	                    } else {
	                        fill = value;
	                    }
	                } else {
	                    fill = Str(fill);
	                }
	            }
	            var attrs = {};
	            attrs[name] = fill;
	            $(this.node, attrs);
	            this.node.style[name] = E;
	        };
	    }
	    eve.on("snap.util.attr.fill", fillStroke("fill"));
	    eve.on("snap.util.attr.stroke", fillStroke("stroke"));
	    var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
	    eve.on("snap.util.grad.parse", function parseGrad(string) {
	        string = Str(string);
	        var tokens = string.match(gradrg);
	        if (!tokens) {
	            return null;
	        }
	        var type = tokens[1],
	            params = tokens[2],
	            stops = tokens[3];
	        params = params.split(/\s*,\s*/).map(function (el) {
	            return +el == el ? +el : el;
	        });
	        if (params.length == 1 && params[0] == 0) {
	            params = [];
	        }
	        stops = stops.split("-");
	        stops = stops.map(function (el) {
	            el = el.split(":");
	            var out = {
	                color: el[0]
	            };
	            if (el[1]) {
	                out.offset = parseFloat(el[1]);
	            }
	            return out;
	        });
	        var len = stops.length,
	            start = 0,
	            j = 0;
	        function seed(i, end) {
	            var step = (end - start) / (i - j);
	            for (var k = j; k < i; k++) {
	                stops[k].offset = +(+start + step * (k - j)).toFixed(2);
	            }
	            j = i;
	            start = end;
	        }
	        len--;
	        for (var i = 0; i < len; i++) if ("offset" in stops[i]) {
	            seed(i, stops[i].offset);
	        }
	        stops[len].offset = stops[len].offset || 100;
	        seed(len, stops[len].offset);
	        return {
	            type: type,
	            params: params,
	            stops: stops
	        };
	    });
	
	    eve.on("snap.util.attr.d", function (value) {
	        eve.stop();
	        if (is(value, "array") && is(value[0], "array")) {
	            value = Snap.path.toString.call(value);
	        }
	        value = Str(value);
	        if (value.match(/[ruo]/i)) {
	            value = Snap.path.toAbsolute(value);
	        }
	        $(this.node, {d: value});
	    })(-1);
	    eve.on("snap.util.attr.#text", function (value) {
	        eve.stop();
	        value = Str(value);
	        var txt = glob.doc.createTextNode(value);
	        while (this.node.firstChild) {
	            this.node.removeChild(this.node.firstChild);
	        }
	        this.node.appendChild(txt);
	    })(-1);
	    eve.on("snap.util.attr.path", function (value) {
	        eve.stop();
	        this.attr({d: value});
	    })(-1);
	    eve.on("snap.util.attr.class", function (value) {
	        eve.stop();
	        this.node.className.baseVal = value;
	    })(-1);
	    eve.on("snap.util.attr.viewBox", function (value) {
	        var vb;
	        if (is(value, "object") && "x" in value) {
	            vb = [value.x, value.y, value.width, value.height].join(" ");
	        } else if (is(value, "array")) {
	            vb = value.join(" ");
	        } else {
	            vb = value;
	        }
	        $(this.node, {
	            viewBox: vb
	        });
	        eve.stop();
	    })(-1);
	    eve.on("snap.util.attr.transform", function (value) {
	        this.transform(value);
	        eve.stop();
	    })(-1);
	    eve.on("snap.util.attr.r", function (value) {
	        if (this.type == "rect") {
	            eve.stop();
	            $(this.node, {
	                rx: value,
	                ry: value
	            });
	        }
	    })(-1);
	    eve.on("snap.util.attr.textpath", function (value) {
	        eve.stop();
	        if (this.type == "text") {
	            var id, tp, node;
	            if (!value && this.textPath) {
	                tp = this.textPath;
	                while (tp.node.firstChild) {
	                    this.node.appendChild(tp.node.firstChild);
	                }
	                tp.remove();
	                delete this.textPath;
	                return;
	            }
	            if (is(value, "string")) {
	                var defs = getSomeDefs(this),
	                    path = wrap(defs.parentNode).path(value);
	                defs.appendChild(path.node);
	                id = path.id;
	                path.attr({id: id});
	            } else {
	                value = wrap(value);
	                if (value instanceof Element) {
	                    id = value.attr("id");
	                    if (!id) {
	                        id = value.id;
	                        value.attr({id: id});
	                    }
	                }
	            }
	            if (id) {
	                tp = this.textPath;
	                node = this.node;
	                if (tp) {
	                    tp.attr({"xlink:href": "#" + id});
	                } else {
	                    tp = $("textPath", {
	                        "xlink:href": "#" + id
	                    });
	                    while (node.firstChild) {
	                        tp.appendChild(node.firstChild);
	                    }
	                    node.appendChild(tp);
	                    this.textPath = wrap(tp);
	                }
	            }
	        }
	    })(-1);
	    eve.on("snap.util.attr.text", function (value) {
	        if (this.type == "text") {
	            var i = 0,
	                node = this.node,
	                tuner = function (chunk) {
	                    var out = $("tspan");
	                    if (is(chunk, "array")) {
	                        for (var i = 0; i < chunk.length; i++) {
	                            out.appendChild(tuner(chunk[i]));
	                        }
	                    } else {
	                        out.appendChild(glob.doc.createTextNode(chunk));
	                    }
	                    out.normalize && out.normalize();
	                    return out;
	                };
	            while (node.firstChild) {
	                node.removeChild(node.firstChild);
	            }
	            var tuned = tuner(value);
	            while (tuned.firstChild) {
	                node.appendChild(tuned.firstChild);
	            }
	        }
	        eve.stop();
	    })(-1);
	    function setFontSize(value) {
	        eve.stop();
	        if (value == +value) {
	            value += "px";
	        }
	        this.node.style.fontSize = value;
	    }
	    eve.on("snap.util.attr.fontSize", setFontSize)(-1);
	    eve.on("snap.util.attr.font-size", setFontSize)(-1);
	
	
	    eve.on("snap.util.getattr.transform", function () {
	        eve.stop();
	        return this.transform();
	    })(-1);
	    eve.on("snap.util.getattr.textpath", function () {
	        eve.stop();
	        return this.textPath;
	    })(-1);
	    // Markers
	    (function () {
	        function getter(end) {
	            return function () {
	                eve.stop();
	                var style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
	                if (style == "none") {
	                    return style;
	                } else {
	                    return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
	                }
	            };
	        }
	        function setter(end) {
	            return function (value) {
	                eve.stop();
	                var name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
	                if (value == "" || !value) {
	                    this.node.style[name] = "none";
	                    return;
	                }
	                if (value.type == "marker") {
	                    var id = value.node.id;
	                    if (!id) {
	                        $(value.node, {id: value.id});
	                    }
	                    this.node.style[name] = URL(id);
	                    return;
	                }
	            };
	        }
	        eve.on("snap.util.getattr.marker-end", getter("end"))(-1);
	        eve.on("snap.util.getattr.markerEnd", getter("end"))(-1);
	        eve.on("snap.util.getattr.marker-start", getter("start"))(-1);
	        eve.on("snap.util.getattr.markerStart", getter("start"))(-1);
	        eve.on("snap.util.getattr.marker-mid", getter("mid"))(-1);
	        eve.on("snap.util.getattr.markerMid", getter("mid"))(-1);
	        eve.on("snap.util.attr.marker-end", setter("end"))(-1);
	        eve.on("snap.util.attr.markerEnd", setter("end"))(-1);
	        eve.on("snap.util.attr.marker-start", setter("start"))(-1);
	        eve.on("snap.util.attr.markerStart", setter("start"))(-1);
	        eve.on("snap.util.attr.marker-mid", setter("mid"))(-1);
	        eve.on("snap.util.attr.markerMid", setter("mid"))(-1);
	    }());
	    eve.on("snap.util.getattr.r", function () {
	        if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
	            eve.stop();
	            return $(this.node, "rx");
	        }
	    })(-1);
	    function textExtract(node) {
	        var out = [];
	        var children = node.childNodes;
	        for (var i = 0, ii = children.length; i < ii; i++) {
	            var chi = children[i];
	            if (chi.nodeType == 3) {
	                out.push(chi.nodeValue);
	            }
	            if (chi.tagName == "tspan") {
	                if (chi.childNodes.length == 1 && chi.firstChild.nodeType == 3) {
	                    out.push(chi.firstChild.nodeValue);
	                } else {
	                    out.push(textExtract(chi));
	                }
	            }
	        }
	        return out;
	    }
	    eve.on("snap.util.getattr.text", function () {
	        if (this.type == "text" || this.type == "tspan") {
	            eve.stop();
	            var out = textExtract(this.node);
	            return out.length == 1 ? out[0] : out;
	        }
	    })(-1);
	    eve.on("snap.util.getattr.#text", function () {
	        return this.node.textContent;
	    })(-1);
	    eve.on("snap.util.getattr.fill", function (internal) {
	        if (internal) {
	            return;
	        }
	        eve.stop();
	        var value = eve("snap.util.getattr.fill", this, true).firstDefined();
	        return Snap(Snap.deurl(value)) || value;
	    })(-1);
	    eve.on("snap.util.getattr.stroke", function (internal) {
	        if (internal) {
	            return;
	        }
	        eve.stop();
	        var value = eve("snap.util.getattr.stroke", this, true).firstDefined();
	        return Snap(Snap.deurl(value)) || value;
	    })(-1);
	    eve.on("snap.util.getattr.viewBox", function () {
	        eve.stop();
	        var vb = $(this.node, "viewBox");
	        if (vb) {
	            vb = vb.split(separator);
	            return Snap._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
	        } else {
	            return;
	        }
	    })(-1);
	    eve.on("snap.util.getattr.points", function () {
	        var p = $(this.node, "points");
	        eve.stop();
	        if (p) {
	            return p.split(separator);
	        } else {
	            return;
	        }
	    })(-1);
	    eve.on("snap.util.getattr.path", function () {
	        var p = $(this.node, "d");
	        eve.stop();
	        return p;
	    })(-1);
	    eve.on("snap.util.getattr.class", function () {
	        return this.node.className.baseVal;
	    })(-1);
	    function getFontSize() {
	        eve.stop();
	        return this.node.style.fontSize;
	    }
	    eve.on("snap.util.getattr.fontSize", getFontSize)(-1);
	    eve.on("snap.util.getattr.font-size", getFontSize)(-1);
	});
	
	// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
	    var rgNotSpace = /\S+/g,
	        rgBadSpace = /[\t\r\n\f]/g,
	        rgTrim = /(^\s+|\s+$)/g,
	        Str = String,
	        elproto = Element.prototype;
	    /*\
	     * Element.addClass
	     [ method ]
	     **
	     * Adds given class name or list of class names to the element.
	     - value (string) class name or space separated list of class names
	     **
	     = (Element) original element.
	    \*/
	    elproto.addClass = function (value) {
	        var classes = Str(value || "").match(rgNotSpace) || [],
	            elem = this.node,
	            className = elem.className.baseVal,
	            curClasses = className.match(rgNotSpace) || [],
	            j,
	            pos,
	            clazz,
	            finalValue;
	
	        if (classes.length) {
	            j = 0;
	            while (clazz = classes[j++]) {
	                pos = curClasses.indexOf(clazz);
	                if (!~pos) {
	                    curClasses.push(clazz);
	                }
	            }
	
	            finalValue = curClasses.join(" ");
	            if (className != finalValue) {
	                elem.className.baseVal = finalValue;
	            }
	        }
	        return this;
	    };
	    /*\
	     * Element.removeClass
	     [ method ]
	     **
	     * Removes given class name or list of class names from the element.
	     - value (string) class name or space separated list of class names
	     **
	     = (Element) original element.
	    \*/
	    elproto.removeClass = function (value) {
	        var classes = Str(value || "").match(rgNotSpace) || [],
	            elem = this.node,
	            className = elem.className.baseVal,
	            curClasses = className.match(rgNotSpace) || [],
	            j,
	            pos,
	            clazz,
	            finalValue;
	        if (curClasses.length) {
	            j = 0;
	            while (clazz = classes[j++]) {
	                pos = curClasses.indexOf(clazz);
	                if (~pos) {
	                    curClasses.splice(pos, 1);
	                }
	            }
	
	            finalValue = curClasses.join(" ");
	            if (className != finalValue) {
	                elem.className.baseVal = finalValue;
	            }
	        }
	        return this;
	    };
	    /*\
	     * Element.hasClass
	     [ method ]
	     **
	     * Checks if the element has a given class name in the list of class names applied to it.
	     - value (string) class name
	     **
	     = (boolean) `true` if the element has given class
	    \*/
	    elproto.hasClass = function (value) {
	        var elem = this.node,
	            className = elem.className.baseVal,
	            curClasses = className.match(rgNotSpace) || [];
	        return !!~curClasses.indexOf(value);
	    };
	    /*\
	     * Element.toggleClass
	     [ method ]
	     **
	     * Add or remove one or more classes from the element, depending on either
	     * the class’s presence or the value of the `flag` argument.
	     - value (string) class name or space separated list of class names
	     - flag (boolean) value to determine whether the class should be added or removed
	     **
	     = (Element) original element.
	    \*/
	    elproto.toggleClass = function (value, flag) {
	        if (flag != null) {
	            if (flag) {
	                return this.addClass(value);
	            } else {
	                return this.removeClass(value);
	            }
	        }
	        var classes = (value || "").match(rgNotSpace) || [],
	            elem = this.node,
	            className = elem.className.baseVal,
	            curClasses = className.match(rgNotSpace) || [],
	            j,
	            pos,
	            clazz,
	            finalValue;
	        j = 0;
	        while (clazz = classes[j++]) {
	            pos = curClasses.indexOf(clazz);
	            if (~pos) {
	                curClasses.splice(pos, 1);
	            } else {
	                curClasses.push(clazz);
	            }
	        }
	
	        finalValue = curClasses.join(" ");
	        if (className != finalValue) {
	            elem.className.baseVal = finalValue;
	        }
	        return this;
	    };
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
	    var operators = {
	            "+": function (x, y) {
	                    return x + y;
	                },
	            "-": function (x, y) {
	                    return x - y;
	                },
	            "/": function (x, y) {
	                    return x / y;
	                },
	            "*": function (x, y) {
	                    return x * y;
	                }
	        },
	        Str = String,
	        reUnit = /[a-z]+$/i,
	        reAddon = /^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;
	    function getNumber(val) {
	        return val;
	    }
	    function getUnit(unit) {
	        return function (val) {
	            return +val.toFixed(3) + unit;
	        };
	    }
	    eve.on("snap.util.attr", function (val) {
	        var plus = Str(val).match(reAddon);
	        if (plus) {
	            var evnt = eve.nt(),
	                name = evnt.substring(evnt.lastIndexOf(".") + 1),
	                a = this.attr(name),
	                atr = {};
	            eve.stop();
	            var unit = plus[3] || "",
	                aUnit = a.match(reUnit),
	                op = operators[plus[1]];
	            if (aUnit && aUnit == unit) {
	                val = op(parseFloat(a), +plus[2]);
	            } else {
	                a = this.asPX(name);
	                val = op(this.asPX(name), this.asPX(name, plus[2] + unit));
	            }
	            if (isNaN(a) || isNaN(val)) {
	                return;
	            }
	            atr[name] = val;
	            this.attr(atr);
	        }
	    })(-10);
	    eve.on("snap.util.equal", function (name, b) {
	        var A, B, a = Str(this.attr(name) || ""),
	            el = this,
	            bplus = Str(b).match(reAddon);
	        if (bplus) {
	            eve.stop();
	            var unit = bplus[3] || "",
	                aUnit = a.match(reUnit),
	                op = operators[bplus[1]];
	            if (aUnit && aUnit == unit) {
	                return {
	                    from: parseFloat(a),
	                    to: op(parseFloat(a), +bplus[2]),
	                    f: getUnit(aUnit)
	                };
	            } else {
	                a = this.asPX(name);
	                return {
	                    from: a,
	                    to: op(a, this.asPX(name, bplus[2] + unit)),
	                    f: getNumber
	                };
	            }
	        }
	    })(-10);
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
	    var proto = Paper.prototype,
	        is = Snap.is;
	    /*\
	     * Paper.rect
	     [ method ]
	     *
	     * Draws a rectangle
	     **
	     - x (number) x coordinate of the top left corner
	     - y (number) y coordinate of the top left corner
	     - width (number) width
	     - height (number) height
	     - rx (number) #optional horizontal radius for rounded corners, default is 0
	     - ry (number) #optional vertical radius for rounded corners, default is rx or 0
	     = (object) the `rect` element
	     **
	     > Usage
	     | // regular rectangle
	     | var c = paper.rect(10, 10, 50, 50);
	     | // rectangle with rounded corners
	     | var c = paper.rect(40, 40, 50, 50, 10);
	    \*/
	    proto.rect = function (x, y, w, h, rx, ry) {
	        var attr;
	        if (ry == null) {
	            ry = rx;
	        }
	        if (is(x, "object") && x == "[object Object]") {
	            attr = x;
	        } else if (x != null) {
	            attr = {
	                x: x,
	                y: y,
	                width: w,
	                height: h
	            };
	            if (rx != null) {
	                attr.rx = rx;
	                attr.ry = ry;
	            }
	        }
	        return this.el("rect", attr);
	    };
	    /*\
	     * Paper.circle
	     [ method ]
	     **
	     * Draws a circle
	     **
	     - x (number) x coordinate of the centre
	     - y (number) y coordinate of the centre
	     - r (number) radius
	     = (object) the `circle` element
	     **
	     > Usage
	     | var c = paper.circle(50, 50, 40);
	    \*/
	    proto.circle = function (cx, cy, r) {
	        var attr;
	        if (is(cx, "object") && cx == "[object Object]") {
	            attr = cx;
	        } else if (cx != null) {
	            attr = {
	                cx: cx,
	                cy: cy,
	                r: r
	            };
	        }
	        return this.el("circle", attr);
	    };
	
	    var preload = (function () {
	        function onerror() {
	            this.parentNode.removeChild(this);
	        }
	        return function (src, f) {
	            var img = glob.doc.createElement("img"),
	                body = glob.doc.body;
	            img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
	            img.onload = function () {
	                f.call(img);
	                img.onload = img.onerror = null;
	                body.removeChild(img);
	            };
	            img.onerror = onerror;
	            body.appendChild(img);
	            img.src = src;
	        };
	    }());
	
	    /*\
	     * Paper.image
	     [ method ]
	     **
	     * Places an image on the surface
	     **
	     - src (string) URI of the source image
	     - x (number) x offset position
	     - y (number) y offset position
	     - width (number) width of the image
	     - height (number) height of the image
	     = (object) the `image` element
	     * or
	     = (object) Snap element object with type `image`
	     **
	     > Usage
	     | var c = paper.image("apple.png", 10, 10, 80, 80);
	    \*/
	    proto.image = function (src, x, y, width, height) {
	        var el = this.el("image");
	        if (is(src, "object") && "src" in src) {
	            el.attr(src);
	        } else if (src != null) {
	            var set = {
	                "xlink:href": src,
	                preserveAspectRatio: "none"
	            };
	            if (x != null && y != null) {
	                set.x = x;
	                set.y = y;
	            }
	            if (width != null && height != null) {
	                set.width = width;
	                set.height = height;
	            } else {
	                preload(src, function () {
	                    Snap._.$(el.node, {
	                        width: this.offsetWidth,
	                        height: this.offsetHeight
	                    });
	                });
	            }
	            Snap._.$(el.node, set);
	        }
	        return el;
	    };
	    /*\
	     * Paper.ellipse
	     [ method ]
	     **
	     * Draws an ellipse
	     **
	     - x (number) x coordinate of the centre
	     - y (number) y coordinate of the centre
	     - rx (number) horizontal radius
	     - ry (number) vertical radius
	     = (object) the `ellipse` element
	     **
	     > Usage
	     | var c = paper.ellipse(50, 50, 40, 20);
	    \*/
	    proto.ellipse = function (cx, cy, rx, ry) {
	        var attr;
	        if (is(cx, "object") && cx == "[object Object]") {
	            attr = cx;
	        } else if (cx != null) {
	            attr ={
	                cx: cx,
	                cy: cy,
	                rx: rx,
	                ry: ry
	            };
	        }
	        return this.el("ellipse", attr);
	    };
	    // SIERRA Paper.path(): Unclear from the link what a Catmull-Rom curveto is, and why it would make life any easier.
	    /*\
	     * Paper.path
	     [ method ]
	     **
	     * Creates a `<path>` element using the given string as the path's definition
	     - pathString (string) #optional path string in SVG format
	     * Path string consists of one-letter commands, followed by comma seprarated arguments in numerical form. Example:
	     | "M10,20L30,40"
	     * This example features two commands: `M`, with arguments `(10, 20)` and `L` with arguments `(30, 40)`. Uppercase letter commands express coordinates in absolute terms, while lowercase commands express them in relative terms from the most recently declared coordinates.
	     *
	     # <p>Here is short list of commands available, for more details see <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path's data attribute's format are described in the SVG specification.">SVG path string format</a> or <a href="https://developer.mozilla.org/en/SVG/Tutorial/Paths">article about path strings at MDN</a>.</p>
	     # <table><thead><tr><th>Command</th><th>Name</th><th>Parameters</th></tr></thead><tbody>
	     # <tr><td>M</td><td>moveto</td><td>(x y)+</td></tr>
	     # <tr><td>Z</td><td>closepath</td><td>(none)</td></tr>
	     # <tr><td>L</td><td>lineto</td><td>(x y)+</td></tr>
	     # <tr><td>H</td><td>horizontal lineto</td><td>x+</td></tr>
	     # <tr><td>V</td><td>vertical lineto</td><td>y+</td></tr>
	     # <tr><td>C</td><td>curveto</td><td>(x1 y1 x2 y2 x y)+</td></tr>
	     # <tr><td>S</td><td>smooth curveto</td><td>(x2 y2 x y)+</td></tr>
	     # <tr><td>Q</td><td>quadratic Bézier curveto</td><td>(x1 y1 x y)+</td></tr>
	     # <tr><td>T</td><td>smooth quadratic Bézier curveto</td><td>(x y)+</td></tr>
	     # <tr><td>A</td><td>elliptical arc</td><td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td></tr>
	     # <tr><td>R</td><td><a href="http://en.wikipedia.org/wiki/Catmull–Rom_spline#Catmull.E2.80.93Rom_spline">Catmull-Rom curveto</a>*</td><td>x1 y1 (x y)+</td></tr></tbody></table>
	     * * _Catmull-Rom curveto_ is a not standard SVG command and added to make life easier.
	     * Note: there is a special case when a path consists of only three commands: `M10,10R…z`. In this case the path connects back to its starting point.
	     > Usage
	     | var c = paper.path("M10 10L90 90");
	     | // draw a diagonal line:
	     | // move to 10,10, line to 90,90
	    \*/
	    proto.path = function (d) {
	        var attr;
	        if (is(d, "object") && !is(d, "array")) {
	            attr = d;
	        } else if (d) {
	            attr = {d: d};
	        }
	        return this.el("path", attr);
	    };
	    /*\
	     * Paper.g
	     [ method ]
	     **
	     * Creates a group element
	     **
	     - varargs (…) #optional elements to nest within the group
	     = (object) the `g` element
	     **
	     > Usage
	     | var c1 = paper.circle(),
	     |     c2 = paper.rect(),
	     |     g = paper.g(c2, c1); // note that the order of elements is different
	     * or
	     | var c1 = paper.circle(),
	     |     c2 = paper.rect(),
	     |     g = paper.g();
	     | g.add(c2, c1);
	    \*/
	    /*\
	     * Paper.group
	     [ method ]
	     **
	     * See @Paper.g
	    \*/
	    proto.group = proto.g = function (first) {
	        var attr,
	            el = this.el("g");
	        if (arguments.length == 1 && first && !first.type) {
	            el.attr(first);
	        } else if (arguments.length) {
	            el.add(Array.prototype.slice.call(arguments, 0));
	        }
	        return el;
	    };
	    /*\
	     * Paper.svg
	     [ method ]
	     **
	     * Creates a nested SVG element.
	     - x (number) @optional X of the element
	     - y (number) @optional Y of the element
	     - width (number) @optional width of the element
	     - height (number) @optional height of the element
	     - vbx (number) @optional viewbox X
	     - vby (number) @optional viewbox Y
	     - vbw (number) @optional viewbox width
	     - vbh (number) @optional viewbox height
	     **
	     = (object) the `svg` element
	     **
	    \*/
	    proto.svg = function (x, y, width, height, vbx, vby, vbw, vbh) {
	        var attrs = {};
	        if (is(x, "object") && y == null) {
	            attrs = x;
	        } else {
	            if (x != null) {
	                attrs.x = x;
	            }
	            if (y != null) {
	                attrs.y = y;
	            }
	            if (width != null) {
	                attrs.width = width;
	            }
	            if (height != null) {
	                attrs.height = height;
	            }
	            if (vbx != null && vby != null && vbw != null && vbh != null) {
	                attrs.viewBox = [vbx, vby, vbw, vbh];
	            }
	        }
	        return this.el("svg", attrs);
	    };
	    /*\
	     * Paper.mask
	     [ method ]
	     **
	     * Equivalent in behaviour to @Paper.g, except it’s a mask.
	     **
	     = (object) the `mask` element
	     **
	    \*/
	    proto.mask = function (first) {
	        var attr,
	            el = this.el("mask");
	        if (arguments.length == 1 && first && !first.type) {
	            el.attr(first);
	        } else if (arguments.length) {
	            el.add(Array.prototype.slice.call(arguments, 0));
	        }
	        return el;
	    };
	    /*\
	     * Paper.ptrn
	     [ method ]
	     **
	     * Equivalent in behaviour to @Paper.g, except it’s a pattern.
	     - x (number) @optional X of the element
	     - y (number) @optional Y of the element
	     - width (number) @optional width of the element
	     - height (number) @optional height of the element
	     - vbx (number) @optional viewbox X
	     - vby (number) @optional viewbox Y
	     - vbw (number) @optional viewbox width
	     - vbh (number) @optional viewbox height
	     **
	     = (object) the `pattern` element
	     **
	    \*/
	    proto.ptrn = function (x, y, width, height, vx, vy, vw, vh) {
	        if (is(x, "object")) {
	            var attr = x;
	        } else {
	            attr = {patternUnits: "userSpaceOnUse"};
	            if (x) {
	                attr.x = x;
	            }
	            if (y) {
	                attr.y = y;
	            }
	            if (width != null) {
	                attr.width = width;
	            }
	            if (height != null) {
	                attr.height = height;
	            }
	            if (vx != null && vy != null && vw != null && vh != null) {
	                attr.viewBox = [vx, vy, vw, vh];
	            } else {
	                attr.viewBox = [x || 0, y || 0, width || 0, height || 0];
	            }
	        }
	        return this.el("pattern", attr);
	    };
	    /*\
	     * Paper.use
	     [ method ]
	     **
	     * Creates a <use> element.
	     - id (string) @optional id of element to link
	     * or
	     - id (Element) @optional element to link
	     **
	     = (object) the `use` element
	     **
	    \*/
	    proto.use = function (id) {
	        if (id != null) {
	            if (id instanceof Element) {
	                if (!id.attr("id")) {
	                    id.attr({id: Snap._.id(id)});
	                }
	                id = id.attr("id");
	            }
	            if (String(id).charAt() == "#") {
	                id = id.substring(1);
	            }
	            return this.el("use", {"xlink:href": "#" + id});
	        } else {
	            return Element.prototype.use.call(this);
	        }
	    };
	    /*\
	     * Paper.symbol
	     [ method ]
	     **
	     * Creates a <symbol> element.
	     - vbx (number) @optional viewbox X
	     - vby (number) @optional viewbox Y
	     - vbw (number) @optional viewbox width
	     - vbh (number) @optional viewbox height
	     = (object) the `symbol` element
	     **
	    \*/
	    proto.symbol = function (vx, vy, vw, vh) {
	        var attr = {};
	        if (vx != null && vy != null && vw != null && vh != null) {
	            attr.viewBox = [vx, vy, vw, vh];
	        }
	
	        return this.el("symbol", attr);
	    };
	    /*\
	     * Paper.text
	     [ method ]
	     **
	     * Draws a text string
	     **
	     - x (number) x coordinate position
	     - y (number) y coordinate position
	     - text (string|array) The text string to draw or array of strings to nest within separate `<tspan>` elements
	     = (object) the `text` element
	     **
	     > Usage
	     | var t1 = paper.text(50, 50, "Snap");
	     | var t2 = paper.text(50, 50, ["S","n","a","p"]);
	     | // Text path usage
	     | t1.attr({textpath: "M10,10L100,100"});
	     | // or
	     | var pth = paper.path("M10,10L100,100");
	     | t1.attr({textpath: pth});
	    \*/
	    proto.text = function (x, y, text) {
	        var attr = {};
	        if (is(x, "object")) {
	            attr = x;
	        } else if (x != null) {
	            attr = {
	                x: x,
	                y: y,
	                text: text || ""
	            };
	        }
	        return this.el("text", attr);
	    };
	    /*\
	     * Paper.line
	     [ method ]
	     **
	     * Draws a line
	     **
	     - x1 (number) x coordinate position of the start
	     - y1 (number) y coordinate position of the start
	     - x2 (number) x coordinate position of the end
	     - y2 (number) y coordinate position of the end
	     = (object) the `line` element
	     **
	     > Usage
	     | var t1 = paper.line(50, 50, 100, 100);
	    \*/
	    proto.line = function (x1, y1, x2, y2) {
	        var attr = {};
	        if (is(x1, "object")) {
	            attr = x1;
	        } else if (x1 != null) {
	            attr = {
	                x1: x1,
	                x2: x2,
	                y1: y1,
	                y2: y2
	            };
	        }
	        return this.el("line", attr);
	    };
	    /*\
	     * Paper.polyline
	     [ method ]
	     **
	     * Draws a polyline
	     **
	     - points (array) array of points
	     * or
	     - varargs (…) points
	     = (object) the `polyline` element
	     **
	     > Usage
	     | var p1 = paper.polyline([10, 10, 100, 100]);
	     | var p2 = paper.polyline(10, 10, 100, 100);
	    \*/
	    proto.polyline = function (points) {
	        if (arguments.length > 1) {
	            points = Array.prototype.slice.call(arguments, 0);
	        }
	        var attr = {};
	        if (is(points, "object") && !is(points, "array")) {
	            attr = points;
	        } else if (points != null) {
	            attr = {points: points};
	        }
	        return this.el("polyline", attr);
	    };
	    /*\
	     * Paper.polygon
	     [ method ]
	     **
	     * Draws a polygon. See @Paper.polyline
	    \*/
	    proto.polygon = function (points) {
	        if (arguments.length > 1) {
	            points = Array.prototype.slice.call(arguments, 0);
	        }
	        var attr = {};
	        if (is(points, "object") && !is(points, "array")) {
	            attr = points;
	        } else if (points != null) {
	            attr = {points: points};
	        }
	        return this.el("polygon", attr);
	    };
	    // gradients
	    (function () {
	        var $ = Snap._.$;
	        // gradients' helpers
	        /*\
	         * Element.stops
	         [ method ]
	         **
	         * Only for gradients!
	         * Returns array of gradient stops elements.
	         = (array) the stops array.
	        \*/
	        function Gstops() {
	            return this.selectAll("stop");
	        }
	        /*\
	         * Element.addStop
	         [ method ]
	         **
	         * Only for gradients!
	         * Adds another stop to the gradient.
	         - color (string) stops color
	         - offset (number) stops offset 0..100
	         = (object) gradient element
	        \*/
	        function GaddStop(color, offset) {
	            var stop = $("stop"),
	                attr = {
	                    offset: +offset + "%"
	                };
	            color = Snap.color(color);
	            attr["stop-color"] = color.hex;
	            if (color.opacity < 1) {
	                attr["stop-opacity"] = color.opacity;
	            }
	            $(stop, attr);
	            var stops = this.stops(),
	                inserted;
	            for (var i = 0; i < stops.length; i++) {
	                var stopOffset = parseFloat(stops[i].attr("offset"));
	                if (stopOffset > offset) {
	                    this.node.insertBefore(stop, stops[i].node);
	                    inserted = true;
	                    break;
	                }
	            }
	            if (!inserted) {
	                this.node.appendChild(stop);
	            }
	            return this;
	        }
	        function GgetBBox() {
	            if (this.type == "linearGradient") {
	                var x1 = $(this.node, "x1") || 0,
	                    x2 = $(this.node, "x2") || 1,
	                    y1 = $(this.node, "y1") || 0,
	                    y2 = $(this.node, "y2") || 0;
	                return Snap._.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
	            } else {
	                var cx = this.node.cx || .5,
	                    cy = this.node.cy || .5,
	                    r = this.node.r || 0;
	                return Snap._.box(cx - r, cy - r, r * 2, r * 2);
	            }
	        }
	        /*\
	         * Element.setStops
	         [ method ]
	         **
	         * Only for gradients!
	         * Updates stops of the gradient based on passed gradient descriptor. See @Ppaer.gradient
	         - str (string) gradient descriptor part after `()`.
	         = (object) gradient element
	         | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
	         | g.setStops("#fff-#000-#f00-#fc0");
	        \*/
	        function GsetStops(str) {
	            var grad = str,
	                stops = this.stops();
	            if (typeof str == "string") {
	                grad = eve("snap.util.grad.parse", null, "l(0,0,0,1)" + str).firstDefined().stops;
	            }
	            if (!Snap.is(grad, "array")) {
	                return;
	            }
	            for (var i = 0; i < stops.length; i++) {
	                if (grad[i]) {
	                    var color = Snap.color(grad[i].color),
	                        attr = {"offset": grad[i].offset + "%"};
	                    attr["stop-color"] = color.hex;
	                    if (color.opacity < 1) {
	                        attr["stop-opacity"] = color.opacity;
	                    }
	                    stops[i].attr(attr);
	                } else {
	                    stops[i].remove();
	                }
	            }
	            for (i = stops.length; i < grad.length; i++) {
	                this.addStop(grad[i].color, grad[i].offset);
	            }
	            return this;
	        }
	        function gradient(defs, str) {
	            var grad = eve("snap.util.grad.parse", null, str).firstDefined(),
	                el;
	            if (!grad) {
	                return null;
	            }
	            grad.params.unshift(defs);
	            if (grad.type.toLowerCase() == "l") {
	                el = gradientLinear.apply(0, grad.params);
	            } else {
	                el = gradientRadial.apply(0, grad.params);
	            }
	            if (grad.type != grad.type.toLowerCase()) {
	                $(el.node, {
	                    gradientUnits: "userSpaceOnUse"
	                });
	            }
	            var stops = grad.stops,
	                len = stops.length;
	            for (var i = 0; i < len; i++) {
	                var stop = stops[i];
	                el.addStop(stop.color, stop.offset);
	            }
	            return el;
	        }
	        function gradientLinear(defs, x1, y1, x2, y2) {
	            var el = Snap._.make("linearGradient", defs);
	            el.stops = Gstops;
	            el.addStop = GaddStop;
	            el.getBBox = GgetBBox;
	            el.setStops = GsetStops;
	            if (x1 != null) {
	                $(el.node, {
	                    x1: x1,
	                    y1: y1,
	                    x2: x2,
	                    y2: y2
	                });
	            }
	            return el;
	        }
	        function gradientRadial(defs, cx, cy, r, fx, fy) {
	            var el = Snap._.make("radialGradient", defs);
	            el.stops = Gstops;
	            el.addStop = GaddStop;
	            el.getBBox = GgetBBox;
	            if (cx != null) {
	                $(el.node, {
	                    cx: cx,
	                    cy: cy,
	                    r: r
	                });
	            }
	            if (fx != null && fy != null) {
	                $(el.node, {
	                    fx: fx,
	                    fy: fy
	                });
	            }
	            return el;
	        }
	        /*\
	         * Paper.gradient
	         [ method ]
	         **
	         * Creates a gradient element
	         **
	         - gradient (string) gradient descriptor
	         > Gradient Descriptor
	         * The gradient descriptor is an expression formatted as
	         * follows: `<type>(<coords>)<colors>`.  The `<type>` can be
	         * either linear or radial.  The uppercase `L` or `R` letters
	         * indicate absolute coordinates offset from the SVG surface.
	         * Lowercase `l` or `r` letters indicate coordinates
	         * calculated relative to the element to which the gradient is
	         * applied.  Coordinates specify a linear gradient vector as
	         * `x1`, `y1`, `x2`, `y2`, or a radial gradient as `cx`, `cy`,
	         * `r` and optional `fx`, `fy` specifying a focal point away
	         * from the center of the circle. Specify `<colors>` as a list
	         * of dash-separated CSS color values.  Each color may be
	         * followed by a custom offset value, separated with a colon
	         * character.
	         > Examples
	         * Linear gradient, relative from top-left corner to bottom-right
	         * corner, from black through red to white:
	         | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
	         * Linear gradient, absolute from (0, 0) to (100, 100), from black
	         * through red at 25% to white:
	         | var g = paper.gradient("L(0, 0, 100, 100)#000-#f00:25-#fff");
	         * Radial gradient, relative from the center of the element with radius
	         * half the width, from black to white:
	         | var g = paper.gradient("r(0.5, 0.5, 0.5)#000-#fff");
	         * To apply the gradient:
	         | paper.circle(50, 50, 40).attr({
	         |     fill: g
	         | });
	         = (object) the `gradient` element
	        \*/
	        proto.gradient = function (str) {
	            return gradient(this.defs, str);
	        };
	        proto.gradientLinear = function (x1, y1, x2, y2) {
	            return gradientLinear(this.defs, x1, y1, x2, y2);
	        };
	        proto.gradientRadial = function (cx, cy, r, fx, fy) {
	            return gradientRadial(this.defs, cx, cy, r, fx, fy);
	        };
	        /*\
	         * Paper.toString
	         [ method ]
	         **
	         * Returns SVG code for the @Paper
	         = (string) SVG code for the @Paper
	        \*/
	        proto.toString = function () {
	            var doc = this.node.ownerDocument,
	                f = doc.createDocumentFragment(),
	                d = doc.createElement("div"),
	                svg = this.node.cloneNode(true),
	                res;
	            f.appendChild(d);
	            d.appendChild(svg);
	            Snap._.$(svg, {xmlns: "http://www.w3.org/2000/svg"});
	            res = d.innerHTML;
	            f.removeChild(f.firstChild);
	            return res;
	        };
	        /*\
	         * Paper.toDataURL
	         [ method ]
	         **
	         * Returns SVG code for the @Paper as Data URI string.
	         = (string) Data URI string
	        \*/
	        proto.toDataURL = function () {
	            if (window && window.btoa) {
	                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(this)));
	            }
	        };
	        /*\
	         * Paper.clear
	         [ method ]
	         **
	         * Removes all child nodes of the paper, except <defs>.
	        \*/
	        proto.clear = function () {
	            var node = this.node.firstChild,
	                next;
	            while (node) {
	                next = node.nextSibling;
	                if (node.tagName != "defs") {
	                    node.parentNode.removeChild(node);
	                } else {
	                    proto.clear.call({node: node});
	                }
	                node = next;
	            }
	        };
	    }());
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob) {
	    var elproto = Element.prototype,
	        is = Snap.is,
	        clone = Snap._.clone,
	        has = "hasOwnProperty",
	        p2s = /,?([a-z]),?/gi,
	        toFloat = parseFloat,
	        math = Math,
	        PI = math.PI,
	        mmin = math.min,
	        mmax = math.max,
	        pow = math.pow,
	        abs = math.abs;
	    function paths(ps) {
	        var p = paths.ps = paths.ps || {};
	        if (p[ps]) {
	            p[ps].sleep = 100;
	        } else {
	            p[ps] = {
	                sleep: 100
	            };
	        }
	        setTimeout(function () {
	            for (var key in p) if (p[has](key) && key != ps) {
	                p[key].sleep--;
	                !p[key].sleep && delete p[key];
	            }
	        });
	        return p[ps];
	    }
	    function box(x, y, width, height) {
	        if (x == null) {
	            x = y = width = height = 0;
	        }
	        if (y == null) {
	            y = x.y;
	            width = x.width;
	            height = x.height;
	            x = x.x;
	        }
	        return {
	            x: x,
	            y: y,
	            width: width,
	            w: width,
	            height: height,
	            h: height,
	            x2: x + width,
	            y2: y + height,
	            cx: x + width / 2,
	            cy: y + height / 2,
	            r1: math.min(width, height) / 2,
	            r2: math.max(width, height) / 2,
	            r0: math.sqrt(width * width + height * height) / 2,
	            path: rectPath(x, y, width, height),
	            vb: [x, y, width, height].join(" ")
	        };
	    }
	    function toString() {
	        return this.join(",").replace(p2s, "$1");
	    }
	    function pathClone(pathArray) {
	        var res = clone(pathArray);
	        res.toString = toString;
	        return res;
	    }
	    function getPointAtSegmentLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
	        if (length == null) {
	            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
	        } else {
	            return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y,
	                getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
	        }
	    }
	    function getLengthFactory(istotal, subpath) {
	        function O(val) {
	            return +(+val).toFixed(3);
	        }
	        return Snap._.cacher(function (path, length, onlystart) {
	            if (path instanceof Element) {
	                path = path.attr("d");
	            }
	            path = path2curve(path);
	            var x, y, p, l, sp = "", subpaths = {}, point,
	                len = 0;
	            for (var i = 0, ii = path.length; i < ii; i++) {
	                p = path[i];
	                if (p[0] == "M") {
	                    x = +p[1];
	                    y = +p[2];
	                } else {
	                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
	                    if (len + l > length) {
	                        if (subpath && !subpaths.start) {
	                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
	                            sp += [
	                                "C" + O(point.start.x),
	                                O(point.start.y),
	                                O(point.m.x),
	                                O(point.m.y),
	                                O(point.x),
	                                O(point.y)
	                            ];
	                            if (onlystart) {return sp;}
	                            subpaths.start = sp;
	                            sp = [
	                                "M" + O(point.x),
	                                O(point.y) + "C" + O(point.n.x),
	                                O(point.n.y),
	                                O(point.end.x),
	                                O(point.end.y),
	                                O(p[5]),
	                                O(p[6])
	                            ].join();
	                            len += l;
	                            x = +p[5];
	                            y = +p[6];
	                            continue;
	                        }
	                        if (!istotal && !subpath) {
	                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
	                            return point;
	                        }
	                    }
	                    len += l;
	                    x = +p[5];
	                    y = +p[6];
	                }
	                sp += p.shift() + p;
	            }
	            subpaths.end = sp;
	            point = istotal ? len : subpath ? subpaths : findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
	            return point;
	        }, null, Snap._.clone);
	    }
	    var getTotalLength = getLengthFactory(1),
	        getPointAtLength = getLengthFactory(),
	        getSubpathsAtLength = getLengthFactory(0, 1);
	    function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
	        var t1 = 1 - t,
	            t13 = pow(t1, 3),
	            t12 = pow(t1, 2),
	            t2 = t * t,
	            t3 = t2 * t,
	            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
	            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
	            mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
	            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
	            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
	            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
	            ax = t1 * p1x + t * c1x,
	            ay = t1 * p1y + t * c1y,
	            cx = t1 * c2x + t * p2x,
	            cy = t1 * c2y + t * p2y,
	            alpha = 90 - math.atan2(mx - nx, my - ny) * 180 / PI;
	        // (mx > nx || my < ny) && (alpha += 180);
	        return {
	            x: x,
	            y: y,
	            m: {x: mx, y: my},
	            n: {x: nx, y: ny},
	            start: {x: ax, y: ay},
	            end: {x: cx, y: cy},
	            alpha: alpha
	        };
	    }
	    function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
	        if (!Snap.is(p1x, "array")) {
	            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
	        }
	        var bbox = curveDim.apply(null, p1x);
	        return box(
	            bbox.min.x,
	            bbox.min.y,
	            bbox.max.x - bbox.min.x,
	            bbox.max.y - bbox.min.y
	        );
	    }
	    function isPointInsideBBox(bbox, x, y) {
	        return  x >= bbox.x &&
	                x <= bbox.x + bbox.width &&
	                y >= bbox.y &&
	                y <= bbox.y + bbox.height;
	    }
	    function isBBoxIntersect(bbox1, bbox2) {
	        bbox1 = box(bbox1);
	        bbox2 = box(bbox2);
	        return isPointInsideBBox(bbox2, bbox1.x, bbox1.y)
	            || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y)
	            || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2)
	            || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2)
	            || isPointInsideBBox(bbox1, bbox2.x, bbox2.y)
	            || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y)
	            || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2)
	            || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2)
	            || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x
	                || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
	            && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y
	                || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
	    }
	    function base3(t, p1, p2, p3, p4) {
	        var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
	            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
	        return t * t2 - 3 * p1 + 3 * p2;
	    }
	    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
	        if (z == null) {
	            z = 1;
	        }
	        z = z > 1 ? 1 : z < 0 ? 0 : z;
	        var z2 = z / 2,
	            n = 12,
	            Tvalues = [-.1252,.1252,-.3678,.3678,-.5873,.5873,-.7699,.7699,-.9041,.9041,-.9816,.9816],
	            Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
	            sum = 0;
	        for (var i = 0; i < n; i++) {
	            var ct = z2 * Tvalues[i] + z2,
	                xbase = base3(ct, x1, x2, x3, x4),
	                ybase = base3(ct, y1, y2, y3, y4),
	                comb = xbase * xbase + ybase * ybase;
	            sum += Cvalues[i] * math.sqrt(comb);
	        }
	        return z2 * sum;
	    }
	    function getTotLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
	        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
	            return;
	        }
	        var t = 1,
	            step = t / 2,
	            t2 = t - step,
	            l,
	            e = .01;
	        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
	        while (abs(l - ll) > e) {
	            step /= 2;
	            t2 += (l < ll ? 1 : -1) * step;
	            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
	        }
	        return t2;
	    }
	    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
	        if (
	            mmax(x1, x2) < mmin(x3, x4) ||
	            mmin(x1, x2) > mmax(x3, x4) ||
	            mmax(y1, y2) < mmin(y3, y4) ||
	            mmin(y1, y2) > mmax(y3, y4)
	        ) {
	            return;
	        }
	        var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
	            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
	            denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
	
	        if (!denominator) {
	            return;
	        }
	        var px = nx / denominator,
	            py = ny / denominator,
	            px2 = +px.toFixed(2),
	            py2 = +py.toFixed(2);
	        if (
	            px2 < +mmin(x1, x2).toFixed(2) ||
	            px2 > +mmax(x1, x2).toFixed(2) ||
	            px2 < +mmin(x3, x4).toFixed(2) ||
	            px2 > +mmax(x3, x4).toFixed(2) ||
	            py2 < +mmin(y1, y2).toFixed(2) ||
	            py2 > +mmax(y1, y2).toFixed(2) ||
	            py2 < +mmin(y3, y4).toFixed(2) ||
	            py2 > +mmax(y3, y4).toFixed(2)
	        ) {
	            return;
	        }
	        return {x: px, y: py};
	    }
	    function inter(bez1, bez2) {
	        return interHelper(bez1, bez2);
	    }
	    function interCount(bez1, bez2) {
	        return interHelper(bez1, bez2, 1);
	    }
	    function interHelper(bez1, bez2, justCount) {
	        var bbox1 = bezierBBox(bez1),
	            bbox2 = bezierBBox(bez2);
	        if (!isBBoxIntersect(bbox1, bbox2)) {
	            return justCount ? 0 : [];
	        }
	        var l1 = bezlen.apply(0, bez1),
	            l2 = bezlen.apply(0, bez2),
	            n1 = ~~(l1 / 8),
	            n2 = ~~(l2 / 8),
	            dots1 = [],
	            dots2 = [],
	            xy = {},
	            res = justCount ? 0 : [];
	        for (var i = 0; i < n1 + 1; i++) {
	            var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
	            dots1.push({x: p.x, y: p.y, t: i / n1});
	        }
	        for (i = 0; i < n2 + 1; i++) {
	            p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
	            dots2.push({x: p.x, y: p.y, t: i / n2});
	        }
	        for (i = 0; i < n1; i++) {
	            for (var j = 0; j < n2; j++) {
	                var di = dots1[i],
	                    di1 = dots1[i + 1],
	                    dj = dots2[j],
	                    dj1 = dots2[j + 1],
	                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
	                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
	                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
	                if (is) {
	                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
	                        continue;
	                    }
	                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
	                    var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
	                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
	                    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
	                        if (justCount) {
	                            res++;
	                        } else {
	                            res.push({
	                                x: is.x,
	                                y: is.y,
	                                t1: t1,
	                                t2: t2
	                            });
	                        }
	                    }
	                }
	            }
	        }
	        return res;
	    }
	    function pathIntersection(path1, path2) {
	        return interPathHelper(path1, path2);
	    }
	    function pathIntersectionNumber(path1, path2) {
	        return interPathHelper(path1, path2, 1);
	    }
	    function interPathHelper(path1, path2, justCount) {
	        path1 = path2curve(path1);
	        path2 = path2curve(path2);
	        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
	            res = justCount ? 0 : [];
	        for (var i = 0, ii = path1.length; i < ii; i++) {
	            var pi = path1[i];
	            if (pi[0] == "M") {
	                x1 = x1m = pi[1];
	                y1 = y1m = pi[2];
	            } else {
	                if (pi[0] == "C") {
	                    bez1 = [x1, y1].concat(pi.slice(1));
	                    x1 = bez1[6];
	                    y1 = bez1[7];
	                } else {
	                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
	                    x1 = x1m;
	                    y1 = y1m;
	                }
	                for (var j = 0, jj = path2.length; j < jj; j++) {
	                    var pj = path2[j];
	                    if (pj[0] == "M") {
	                        x2 = x2m = pj[1];
	                        y2 = y2m = pj[2];
	                    } else {
	                        if (pj[0] == "C") {
	                            bez2 = [x2, y2].concat(pj.slice(1));
	                            x2 = bez2[6];
	                            y2 = bez2[7];
	                        } else {
	                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
	                            x2 = x2m;
	                            y2 = y2m;
	                        }
	                        var intr = interHelper(bez1, bez2, justCount);
	                        if (justCount) {
	                            res += intr;
	                        } else {
	                            for (var k = 0, kk = intr.length; k < kk; k++) {
	                                intr[k].segment1 = i;
	                                intr[k].segment2 = j;
	                                intr[k].bez1 = bez1;
	                                intr[k].bez2 = bez2;
	                            }
	                            res = res.concat(intr);
	                        }
	                    }
	                }
	            }
	        }
	        return res;
	    }
	    function isPointInsidePath(path, x, y) {
	        var bbox = pathBBox(path);
	        return isPointInsideBBox(bbox, x, y) &&
	               interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
	    }
	    function pathBBox(path) {
	        var pth = paths(path);
	        if (pth.bbox) {
	            return clone(pth.bbox);
	        }
	        if (!path) {
	            return box();
	        }
	        path = path2curve(path);
	        var x = 0,
	            y = 0,
	            X = [],
	            Y = [],
	            p;
	        for (var i = 0, ii = path.length; i < ii; i++) {
	            p = path[i];
	            if (p[0] == "M") {
	                x = p[1];
	                y = p[2];
	                X.push(x);
	                Y.push(y);
	            } else {
	                var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
	                X = X.concat(dim.min.x, dim.max.x);
	                Y = Y.concat(dim.min.y, dim.max.y);
	                x = p[5];
	                y = p[6];
	            }
	        }
	        var xmin = mmin.apply(0, X),
	            ymin = mmin.apply(0, Y),
	            xmax = mmax.apply(0, X),
	            ymax = mmax.apply(0, Y),
	            bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
	        pth.bbox = clone(bb);
	        return bb;
	    }
	    function rectPath(x, y, w, h, r) {
	        if (r) {
	            return [
	                ["M", +x + +r, y],
	                ["l", w - r * 2, 0],
	                ["a", r, r, 0, 0, 1, r, r],
	                ["l", 0, h - r * 2],
	                ["a", r, r, 0, 0, 1, -r, r],
	                ["l", r * 2 - w, 0],
	                ["a", r, r, 0, 0, 1, -r, -r],
	                ["l", 0, r * 2 - h],
	                ["a", r, r, 0, 0, 1, r, -r],
	                ["z"]
	            ];
	        }
	        var res = [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
	        res.toString = toString;
	        return res;
	    }
	    function ellipsePath(x, y, rx, ry, a) {
	        if (a == null && ry == null) {
	            ry = rx;
	        }
	        x = +x;
	        y = +y;
	        rx = +rx;
	        ry = +ry;
	        if (a != null) {
	            var rad = Math.PI / 180,
	                x1 = x + rx * Math.cos(-ry * rad),
	                x2 = x + rx * Math.cos(-a * rad),
	                y1 = y + rx * Math.sin(-ry * rad),
	                y2 = y + rx * Math.sin(-a * rad),
	                res = [["M", x1, y1], ["A", rx, rx, 0, +(a - ry > 180), 0, x2, y2]];
	        } else {
	            res = [
	                ["M", x, y],
	                ["m", 0, -ry],
	                ["a", rx, ry, 0, 1, 1, 0, 2 * ry],
	                ["a", rx, ry, 0, 1, 1, 0, -2 * ry],
	                ["z"]
	            ];
	        }
	        res.toString = toString;
	        return res;
	    }
	    var unit2px = Snap._unit2px,
	        getPath = {
	        path: function (el) {
	            return el.attr("path");
	        },
	        circle: function (el) {
	            var attr = unit2px(el);
	            return ellipsePath(attr.cx, attr.cy, attr.r);
	        },
	        ellipse: function (el) {
	            var attr = unit2px(el);
	            return ellipsePath(attr.cx || 0, attr.cy || 0, attr.rx, attr.ry);
	        },
	        rect: function (el) {
	            var attr = unit2px(el);
	            return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height, attr.rx, attr.ry);
	        },
	        image: function (el) {
	            var attr = unit2px(el);
	            return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
	        },
	        line: function (el) {
	            return "M" + [el.attr("x1") || 0, el.attr("y1") || 0, el.attr("x2"), el.attr("y2")];
	        },
	        polyline: function (el) {
	            return "M" + el.attr("points");
	        },
	        polygon: function (el) {
	            return "M" + el.attr("points") + "z";
	        },
	        deflt: function (el) {
	            var bbox = el.node.getBBox();
	            return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
	        }
	    };
	    function pathToRelative(pathArray) {
	        var pth = paths(pathArray),
	            lowerCase = String.prototype.toLowerCase;
	        if (pth.rel) {
	            return pathClone(pth.rel);
	        }
	        if (!Snap.is(pathArray, "array") || !Snap.is(pathArray && pathArray[0], "array")) {
	            pathArray = Snap.parsePathString(pathArray);
	        }
	        var res = [],
	            x = 0,
	            y = 0,
	            mx = 0,
	            my = 0,
	            start = 0;
	        if (pathArray[0][0] == "M") {
	            x = pathArray[0][1];
	            y = pathArray[0][2];
	            mx = x;
	            my = y;
	            start++;
	            res.push(["M", x, y]);
	        }
	        for (var i = start, ii = pathArray.length; i < ii; i++) {
	            var r = res[i] = [],
	                pa = pathArray[i];
	            if (pa[0] != lowerCase.call(pa[0])) {
	                r[0] = lowerCase.call(pa[0]);
	                switch (r[0]) {
	                    case "a":
	                        r[1] = pa[1];
	                        r[2] = pa[2];
	                        r[3] = pa[3];
	                        r[4] = pa[4];
	                        r[5] = pa[5];
	                        r[6] = +(pa[6] - x).toFixed(3);
	                        r[7] = +(pa[7] - y).toFixed(3);
	                        break;
	                    case "v":
	                        r[1] = +(pa[1] - y).toFixed(3);
	                        break;
	                    case "m":
	                        mx = pa[1];
	                        my = pa[2];
	                    default:
	                        for (var j = 1, jj = pa.length; j < jj; j++) {
	                            r[j] = +(pa[j] - (j % 2 ? x : y)).toFixed(3);
	                        }
	                }
	            } else {
	                r = res[i] = [];
	                if (pa[0] == "m") {
	                    mx = pa[1] + x;
	                    my = pa[2] + y;
	                }
	                for (var k = 0, kk = pa.length; k < kk; k++) {
	                    res[i][k] = pa[k];
	                }
	            }
	            var len = res[i].length;
	            switch (res[i][0]) {
	                case "z":
	                    x = mx;
	                    y = my;
	                    break;
	                case "h":
	                    x += +res[i][len - 1];
	                    break;
	                case "v":
	                    y += +res[i][len - 1];
	                    break;
	                default:
	                    x += +res[i][len - 2];
	                    y += +res[i][len - 1];
	            }
	        }
	        res.toString = toString;
	        pth.rel = pathClone(res);
	        return res;
	    }
	    function pathToAbsolute(pathArray) {
	        var pth = paths(pathArray);
	        if (pth.abs) {
	            return pathClone(pth.abs);
	        }
	        if (!is(pathArray, "array") || !is(pathArray && pathArray[0], "array")) { // rough assumption
	            pathArray = Snap.parsePathString(pathArray);
	        }
	        if (!pathArray || !pathArray.length) {
	            return [["M", 0, 0]];
	        }
	        var res = [],
	            x = 0,
	            y = 0,
	            mx = 0,
	            my = 0,
	            start = 0,
	            pa0;
	        if (pathArray[0][0] == "M") {
	            x = +pathArray[0][1];
	            y = +pathArray[0][2];
	            mx = x;
	            my = y;
	            start++;
	            res[0] = ["M", x, y];
	        }
	        var crz = pathArray.length == 3 &&
	            pathArray[0][0] == "M" &&
	            pathArray[1][0].toUpperCase() == "R" &&
	            pathArray[2][0].toUpperCase() == "Z";
	        for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
	            res.push(r = []);
	            pa = pathArray[i];
	            pa0 = pa[0];
	            if (pa0 != pa0.toUpperCase()) {
	                r[0] = pa0.toUpperCase();
	                switch (r[0]) {
	                    case "A":
	                        r[1] = pa[1];
	                        r[2] = pa[2];
	                        r[3] = pa[3];
	                        r[4] = pa[4];
	                        r[5] = pa[5];
	                        r[6] = +pa[6] + x;
	                        r[7] = +pa[7] + y;
	                        break;
	                    case "V":
	                        r[1] = +pa[1] + y;
	                        break;
	                    case "H":
	                        r[1] = +pa[1] + x;
	                        break;
	                    case "R":
	                        var dots = [x, y].concat(pa.slice(1));
	                        for (var j = 2, jj = dots.length; j < jj; j++) {
	                            dots[j] = +dots[j] + x;
	                            dots[++j] = +dots[j] + y;
	                        }
	                        res.pop();
	                        res = res.concat(catmullRom2bezier(dots, crz));
	                        break;
	                    case "O":
	                        res.pop();
	                        dots = ellipsePath(x, y, pa[1], pa[2]);
	                        dots.push(dots[0]);
	                        res = res.concat(dots);
	                        break;
	                    case "U":
	                        res.pop();
	                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
	                        r = ["U"].concat(res[res.length - 1].slice(-2));
	                        break;
	                    case "M":
	                        mx = +pa[1] + x;
	                        my = +pa[2] + y;
	                    default:
	                        for (j = 1, jj = pa.length; j < jj; j++) {
	                            r[j] = +pa[j] + (j % 2 ? x : y);
	                        }
	                }
	            } else if (pa0 == "R") {
	                dots = [x, y].concat(pa.slice(1));
	                res.pop();
	                res = res.concat(catmullRom2bezier(dots, crz));
	                r = ["R"].concat(pa.slice(-2));
	            } else if (pa0 == "O") {
	                res.pop();
	                dots = ellipsePath(x, y, pa[1], pa[2]);
	                dots.push(dots[0]);
	                res = res.concat(dots);
	            } else if (pa0 == "U") {
	                res.pop();
	                res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
	                r = ["U"].concat(res[res.length - 1].slice(-2));
	            } else {
	                for (var k = 0, kk = pa.length; k < kk; k++) {
	                    r[k] = pa[k];
	                }
	            }
	            pa0 = pa0.toUpperCase();
	            if (pa0 != "O") {
	                switch (r[0]) {
	                    case "Z":
	                        x = +mx;
	                        y = +my;
	                        break;
	                    case "H":
	                        x = r[1];
	                        break;
	                    case "V":
	                        y = r[1];
	                        break;
	                    case "M":
	                        mx = r[r.length - 2];
	                        my = r[r.length - 1];
	                    default:
	                        x = r[r.length - 2];
	                        y = r[r.length - 1];
	                }
	            }
	        }
	        res.toString = toString;
	        pth.abs = pathClone(res);
	        return res;
	    }
	    function l2c(x1, y1, x2, y2) {
	        return [x1, y1, x2, y2, x2, y2];
	    }
	    function q2c(x1, y1, ax, ay, x2, y2) {
	        var _13 = 1 / 3,
	            _23 = 2 / 3;
	        return [
	                _13 * x1 + _23 * ax,
	                _13 * y1 + _23 * ay,
	                _13 * x2 + _23 * ax,
	                _13 * y2 + _23 * ay,
	                x2,
	                y2
	            ];
	    }
	    function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
	        // for more information of where this math came from visit:
	        // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
	        var _120 = PI * 120 / 180,
	            rad = PI / 180 * (+angle || 0),
	            res = [],
	            xy,
	            rotate = Snap._.cacher(function (x, y, rad) {
	                var X = x * math.cos(rad) - y * math.sin(rad),
	                    Y = x * math.sin(rad) + y * math.cos(rad);
	                return {x: X, y: Y};
	            });
	        if (!rx || !ry) {
	            return [x1, y1, x2, y2, x2, y2];
	        }
	        if (!recursive) {
	            xy = rotate(x1, y1, -rad);
	            x1 = xy.x;
	            y1 = xy.y;
	            xy = rotate(x2, y2, -rad);
	            x2 = xy.x;
	            y2 = xy.y;
	            var cos = math.cos(PI / 180 * angle),
	                sin = math.sin(PI / 180 * angle),
	                x = (x1 - x2) / 2,
	                y = (y1 - y2) / 2;
	            var h = x * x / (rx * rx) + y * y / (ry * ry);
	            if (h > 1) {
	                h = math.sqrt(h);
	                rx = h * rx;
	                ry = h * ry;
	            }
	            var rx2 = rx * rx,
	                ry2 = ry * ry,
	                k = (large_arc_flag == sweep_flag ? -1 : 1) *
	                    math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
	                cx = k * rx * y / ry + (x1 + x2) / 2,
	                cy = k * -ry * x / rx + (y1 + y2) / 2,
	                f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
	                f2 = math.asin(((y2 - cy) / ry).toFixed(9));
	
	            f1 = x1 < cx ? PI - f1 : f1;
	            f2 = x2 < cx ? PI - f2 : f2;
	            f1 < 0 && (f1 = PI * 2 + f1);
	            f2 < 0 && (f2 = PI * 2 + f2);
	            if (sweep_flag && f1 > f2) {
	                f1 = f1 - PI * 2;
	            }
	            if (!sweep_flag && f2 > f1) {
	                f2 = f2 - PI * 2;
	            }
	        } else {
	            f1 = recursive[0];
	            f2 = recursive[1];
	            cx = recursive[2];
	            cy = recursive[3];
	        }
	        var df = f2 - f1;
	        if (abs(df) > _120) {
	            var f2old = f2,
	                x2old = x2,
	                y2old = y2;
	            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
	            x2 = cx + rx * math.cos(f2);
	            y2 = cy + ry * math.sin(f2);
	            res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
	        }
	        df = f2 - f1;
	        var c1 = math.cos(f1),
	            s1 = math.sin(f1),
	            c2 = math.cos(f2),
	            s2 = math.sin(f2),
	            t = math.tan(df / 4),
	            hx = 4 / 3 * rx * t,
	            hy = 4 / 3 * ry * t,
	            m1 = [x1, y1],
	            m2 = [x1 + hx * s1, y1 - hy * c1],
	            m3 = [x2 + hx * s2, y2 - hy * c2],
	            m4 = [x2, y2];
	        m2[0] = 2 * m1[0] - m2[0];
	        m2[1] = 2 * m1[1] - m2[1];
	        if (recursive) {
	            return [m2, m3, m4].concat(res);
	        } else {
	            res = [m2, m3, m4].concat(res).join().split(",");
	            var newres = [];
	            for (var i = 0, ii = res.length; i < ii; i++) {
	                newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
	            }
	            return newres;
	        }
	    }
	    function findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
	        var t1 = 1 - t;
	        return {
	            x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
	            y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
	        };
	    }
	
	    // Returns bounding box of cubic bezier curve.
	    // Source: http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
	    // Original version: NISHIO Hirokazu
	    // Modifications: https://github.com/timo22345
	    function curveDim(x0, y0, x1, y1, x2, y2, x3, y3) {
	        var tvalues = [],
	            bounds = [[], []],
	            a, b, c, t, t1, t2, b2ac, sqrtb2ac;
	        for (var i = 0; i < 2; ++i) {
	            if (i == 0) {
	                b = 6 * x0 - 12 * x1 + 6 * x2;
	                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
	                c = 3 * x1 - 3 * x0;
	            } else {
	                b = 6 * y0 - 12 * y1 + 6 * y2;
	                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
	                c = 3 * y1 - 3 * y0;
	            }
	            if (abs(a) < 1e-12) {
	                if (abs(b) < 1e-12) {
	                    continue;
	                }
	                t = -c / b;
	                if (0 < t && t < 1) {
	                    tvalues.push(t);
	                }
	                continue;
	            }
	            b2ac = b * b - 4 * c * a;
	            sqrtb2ac = math.sqrt(b2ac);
	            if (b2ac < 0) {
	                continue;
	            }
	            t1 = (-b + sqrtb2ac) / (2 * a);
	            if (0 < t1 && t1 < 1) {
	                tvalues.push(t1);
	            }
	            t2 = (-b - sqrtb2ac) / (2 * a);
	            if (0 < t2 && t2 < 1) {
	                tvalues.push(t2);
	            }
	        }
	
	        var x, y, j = tvalues.length,
	            jlen = j,
	            mt;
	        while (j--) {
	            t = tvalues[j];
	            mt = 1 - t;
	            bounds[0][j] = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
	            bounds[1][j] = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
	        }
	
	        bounds[0][jlen] = x0;
	        bounds[1][jlen] = y0;
	        bounds[0][jlen + 1] = x3;
	        bounds[1][jlen + 1] = y3;
	        bounds[0].length = bounds[1].length = jlen + 2;
	
	
	        return {
	          min: {x: mmin.apply(0, bounds[0]), y: mmin.apply(0, bounds[1])},
	          max: {x: mmax.apply(0, bounds[0]), y: mmax.apply(0, bounds[1])}
	        };
	    }
	
	    function path2curve(path, path2) {
	        var pth = !path2 && paths(path);
	        if (!path2 && pth.curve) {
	            return pathClone(pth.curve);
	        }
	        var p = pathToAbsolute(path),
	            p2 = path2 && pathToAbsolute(path2),
	            attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
	            attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
	            processPath = function (path, d, pcom) {
	                var nx, ny;
	                if (!path) {
	                    return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
	                }
	                !(path[0] in {T: 1, Q: 1}) && (d.qx = d.qy = null);
	                switch (path[0]) {
	                    case "M":
	                        d.X = path[1];
	                        d.Y = path[2];
	                        break;
	                    case "A":
	                        path = ["C"].concat(a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
	                        break;
	                    case "S":
	                        if (pcom == "C" || pcom == "S") { // In "S" case we have to take into account, if the previous command is C/S.
	                            nx = d.x * 2 - d.bx;          // And reflect the previous
	                            ny = d.y * 2 - d.by;          // command's control point relative to the current point.
	                        }
	                        else {                            // or some else or nothing
	                            nx = d.x;
	                            ny = d.y;
	                        }
	                        path = ["C", nx, ny].concat(path.slice(1));
	                        break;
	                    case "T":
	                        if (pcom == "Q" || pcom == "T") { // In "T" case we have to take into account, if the previous command is Q/T.
	                            d.qx = d.x * 2 - d.qx;        // And make a reflection similar
	                            d.qy = d.y * 2 - d.qy;        // to case "S".
	                        }
	                        else {                            // or something else or nothing
	                            d.qx = d.x;
	                            d.qy = d.y;
	                        }
	                        path = ["C"].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
	                        break;
	                    case "Q":
	                        d.qx = path[1];
	                        d.qy = path[2];
	                        path = ["C"].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
	                        break;
	                    case "L":
	                        path = ["C"].concat(l2c(d.x, d.y, path[1], path[2]));
	                        break;
	                    case "H":
	                        path = ["C"].concat(l2c(d.x, d.y, path[1], d.y));
	                        break;
	                    case "V":
	                        path = ["C"].concat(l2c(d.x, d.y, d.x, path[1]));
	                        break;
	                    case "Z":
	                        path = ["C"].concat(l2c(d.x, d.y, d.X, d.Y));
	                        break;
	                }
	                return path;
	            },
	            fixArc = function (pp, i) {
	                if (pp[i].length > 7) {
	                    pp[i].shift();
	                    var pi = pp[i];
	                    while (pi.length) {
	                        pcoms1[i] = "A"; // if created multiple C:s, their original seg is saved
	                        p2 && (pcoms2[i] = "A"); // the same as above
	                        pp.splice(i++, 0, ["C"].concat(pi.splice(0, 6)));
	                    }
	                    pp.splice(i, 1);
	                    ii = mmax(p.length, p2 && p2.length || 0);
	                }
	            },
	            fixM = function (path1, path2, a1, a2, i) {
	                if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
	                    path2.splice(i, 0, ["M", a2.x, a2.y]);
	                    a1.bx = 0;
	                    a1.by = 0;
	                    a1.x = path1[i][1];
	                    a1.y = path1[i][2];
	                    ii = mmax(p.length, p2 && p2.length || 0);
	                }
	            },
	            pcoms1 = [], // path commands of original path p
	            pcoms2 = [], // path commands of original path p2
	            pfirst = "", // temporary holder for original path command
	            pcom = ""; // holder for previous path command of original path
	        for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
	            p[i] && (pfirst = p[i][0]); // save current path command
	
	            if (pfirst != "C") // C is not saved yet, because it may be result of conversion
	            {
	                pcoms1[i] = pfirst; // Save current path command
	                i && ( pcom = pcoms1[i - 1]); // Get previous path command pcom
	            }
	            p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath
	
	            if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
	            // which may produce multiple C:s
	            // so we have to make sure that C is also C in original path
	
	            fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1
	
	            if (p2) { // the same procedures is done to p2
	                p2[i] && (pfirst = p2[i][0]);
	                if (pfirst != "C") {
	                    pcoms2[i] = pfirst;
	                    i && (pcom = pcoms2[i - 1]);
	                }
	                p2[i] = processPath(p2[i], attrs2, pcom);
	
	                if (pcoms2[i] != "A" && pfirst == "C") {
	                    pcoms2[i] = "C";
	                }
	
	                fixArc(p2, i);
	            }
	            fixM(p, p2, attrs, attrs2, i);
	            fixM(p2, p, attrs2, attrs, i);
	            var seg = p[i],
	                seg2 = p2 && p2[i],
	                seglen = seg.length,
	                seg2len = p2 && seg2.length;
	            attrs.x = seg[seglen - 2];
	            attrs.y = seg[seglen - 1];
	            attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
	            attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
	            attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
	            attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
	            attrs2.x = p2 && seg2[seg2len - 2];
	            attrs2.y = p2 && seg2[seg2len - 1];
	        }
	        if (!p2) {
	            pth.curve = pathClone(p);
	        }
	        return p2 ? [p, p2] : p;
	    }
	    function mapPath(path, matrix) {
	        if (!matrix) {
	            return path;
	        }
	        var x, y, i, j, ii, jj, pathi;
	        path = path2curve(path);
	        for (i = 0, ii = path.length; i < ii; i++) {
	            pathi = path[i];
	            for (j = 1, jj = pathi.length; j < jj; j += 2) {
	                x = matrix.x(pathi[j], pathi[j + 1]);
	                y = matrix.y(pathi[j], pathi[j + 1]);
	                pathi[j] = x;
	                pathi[j + 1] = y;
	            }
	        }
	        return path;
	    }
	
	    // http://schepers.cc/getting-to-the-point
	    function catmullRom2bezier(crp, z) {
	        var d = [];
	        for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
	            var p = [
	                        {x: +crp[i - 2], y: +crp[i - 1]},
	                        {x: +crp[i],     y: +crp[i + 1]},
	                        {x: +crp[i + 2], y: +crp[i + 3]},
	                        {x: +crp[i + 4], y: +crp[i + 5]}
	                    ];
	            if (z) {
	                if (!i) {
	                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
	                } else if (iLen - 4 == i) {
	                    p[3] = {x: +crp[0], y: +crp[1]};
	                } else if (iLen - 2 == i) {
	                    p[2] = {x: +crp[0], y: +crp[1]};
	                    p[3] = {x: +crp[2], y: +crp[3]};
	                }
	            } else {
	                if (iLen - 4 == i) {
	                    p[3] = p[2];
	                } else if (!i) {
	                    p[0] = {x: +crp[i], y: +crp[i + 1]};
	                }
	            }
	            d.push(["C",
	                  (-p[0].x + 6 * p[1].x + p[2].x) / 6,
	                  (-p[0].y + 6 * p[1].y + p[2].y) / 6,
	                  (p[1].x + 6 * p[2].x - p[3].x) / 6,
	                  (p[1].y + 6*p[2].y - p[3].y) / 6,
	                  p[2].x,
	                  p[2].y
	            ]);
	        }
	
	        return d;
	    }
	
	    // export
	    Snap.path = paths;
	
	    /*\
	     * Snap.path.getTotalLength
	     [ method ]
	     **
	     * Returns the length of the given path in pixels
	     **
	     - path (string) SVG path string
	     **
	     = (number) length
	    \*/
	    Snap.path.getTotalLength = getTotalLength;
	    /*\
	     * Snap.path.getPointAtLength
	     [ method ]
	     **
	     * Returns the coordinates of the point located at the given length along the given path
	     **
	     - path (string) SVG path string
	     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
	     **
	     = (object) representation of the point:
	     o {
	     o     x: (number) x coordinate,
	     o     y: (number) y coordinate,
	     o     alpha: (number) angle of derivative
	     o }
	    \*/
	    Snap.path.getPointAtLength = getPointAtLength;
	    /*\
	     * Snap.path.getSubpath
	     [ method ]
	     **
	     * Returns the subpath of a given path between given start and end lengths
	     **
	     - path (string) SVG path string
	     - from (number) length, in pixels, from the start of the path to the start of the segment
	     - to (number) length, in pixels, from the start of the path to the end of the segment
	     **
	     = (string) path string definition for the segment
	    \*/
	    Snap.path.getSubpath = function (path, from, to) {
	        if (this.getTotalLength(path) - to < 1e-6) {
	            return getSubpathsAtLength(path, from).end;
	        }
	        var a = getSubpathsAtLength(path, to, 1);
	        return from ? getSubpathsAtLength(a, from).end : a;
	    };
	    /*\
	     * Element.getTotalLength
	     [ method ]
	     **
	     * Returns the length of the path in pixels (only works for `path` elements)
	     = (number) length
	    \*/
	    elproto.getTotalLength = function () {
	        if (this.node.getTotalLength) {
	            return this.node.getTotalLength();
	        }
	    };
	    // SIERRA Element.getPointAtLength()/Element.getTotalLength(): If a <path> is broken into different segments, is the jump distance to the new coordinates set by the _M_ or _m_ commands calculated as part of the path's total length?
	    /*\
	     * Element.getPointAtLength
	     [ method ]
	     **
	     * Returns coordinates of the point located at the given length on the given path (only works for `path` elements)
	     **
	     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
	     **
	     = (object) representation of the point:
	     o {
	     o     x: (number) x coordinate,
	     o     y: (number) y coordinate,
	     o     alpha: (number) angle of derivative
	     o }
	    \*/
	    elproto.getPointAtLength = function (length) {
	        return getPointAtLength(this.attr("d"), length);
	    };
	    // SIERRA Element.getSubpath(): Similar to the problem for Element.getPointAtLength(). Unclear how this would work for a segmented path. Overall, the concept of _subpath_ and what I'm calling a _segment_ (series of non-_M_ or _Z_ commands) is unclear.
	    /*\
	     * Element.getSubpath
	     [ method ]
	     **
	     * Returns subpath of a given element from given start and end lengths (only works for `path` elements)
	     **
	     - from (number) length, in pixels, from the start of the path to the start of the segment
	     - to (number) length, in pixels, from the start of the path to the end of the segment
	     **
	     = (string) path string definition for the segment
	    \*/
	    elproto.getSubpath = function (from, to) {
	        return Snap.path.getSubpath(this.attr("d"), from, to);
	    };
	    Snap._.box = box;
	    /*\
	     * Snap.path.findDotsAtSegment
	     [ method ]
	     **
	     * Utility method
	     **
	     * Finds dot coordinates on the given cubic beziér curve at the given t
	     - p1x (number) x of the first point of the curve
	     - p1y (number) y of the first point of the curve
	     - c1x (number) x of the first anchor of the curve
	     - c1y (number) y of the first anchor of the curve
	     - c2x (number) x of the second anchor of the curve
	     - c2y (number) y of the second anchor of the curve
	     - p2x (number) x of the second point of the curve
	     - p2y (number) y of the second point of the curve
	     - t (number) position on the curve (0..1)
	     = (object) point information in format:
	     o {
	     o     x: (number) x coordinate of the point,
	     o     y: (number) y coordinate of the point,
	     o     m: {
	     o         x: (number) x coordinate of the left anchor,
	     o         y: (number) y coordinate of the left anchor
	     o     },
	     o     n: {
	     o         x: (number) x coordinate of the right anchor,
	     o         y: (number) y coordinate of the right anchor
	     o     },
	     o     start: {
	     o         x: (number) x coordinate of the start of the curve,
	     o         y: (number) y coordinate of the start of the curve
	     o     },
	     o     end: {
	     o         x: (number) x coordinate of the end of the curve,
	     o         y: (number) y coordinate of the end of the curve
	     o     },
	     o     alpha: (number) angle of the curve derivative at the point
	     o }
	    \*/
	    Snap.path.findDotsAtSegment = findDotsAtSegment;
	    /*\
	     * Snap.path.bezierBBox
	     [ method ]
	     **
	     * Utility method
	     **
	     * Returns the bounding box of a given cubic beziér curve
	     - p1x (number) x of the first point of the curve
	     - p1y (number) y of the first point of the curve
	     - c1x (number) x of the first anchor of the curve
	     - c1y (number) y of the first anchor of the curve
	     - c2x (number) x of the second anchor of the curve
	     - c2y (number) y of the second anchor of the curve
	     - p2x (number) x of the second point of the curve
	     - p2y (number) y of the second point of the curve
	     * or
	     - bez (array) array of six points for beziér curve
	     = (object) bounding box
	     o {
	     o     x: (number) x coordinate of the left top point of the box,
	     o     y: (number) y coordinate of the left top point of the box,
	     o     x2: (number) x coordinate of the right bottom point of the box,
	     o     y2: (number) y coordinate of the right bottom point of the box,
	     o     width: (number) width of the box,
	     o     height: (number) height of the box
	     o }
	    \*/
	    Snap.path.bezierBBox = bezierBBox;
	    /*\
	     * Snap.path.isPointInsideBBox
	     [ method ]
	     **
	     * Utility method
	     **
	     * Returns `true` if given point is inside bounding box
	     - bbox (string) bounding box
	     - x (string) x coordinate of the point
	     - y (string) y coordinate of the point
	     = (boolean) `true` if point is inside
	    \*/
	    Snap.path.isPointInsideBBox = isPointInsideBBox;
	    Snap.closest = function (x, y, X, Y) {
	        var r = 100,
	            b = box(x - r / 2, y - r / 2, r, r),
	            inside = [],
	            getter = X[0].hasOwnProperty("x") ? function (i) {
	                return {
	                    x: X[i].x,
	                    y: X[i].y
	                };
	            } : function (i) {
	                return {
	                    x: X[i],
	                    y: Y[i]
	                };
	            },
	            found = 0;
	        while (r <= 1e6 && !found) {
	            for (var i = 0, ii = X.length; i < ii; i++) {
	                var xy = getter(i);
	                if (isPointInsideBBox(b, xy.x, xy.y)) {
	                    found++;
	                    inside.push(xy);
	                    break;
	                }
	            }
	            if (!found) {
	                r *= 2;
	                b = box(x - r / 2, y - r / 2, r, r)
	            }
	        }
	        if (r == 1e6) {
	            return;
	        }
	        var len = Infinity,
	            res;
	        for (i = 0, ii = inside.length; i < ii; i++) {
	            var l = Snap.len(x, y, inside[i].x, inside[i].y);
	            if (len > l) {
	                len = l;
	                inside[i].len = l;
	                res = inside[i];
	            }
	        }
	        return res;
	    };
	    /*\
	     * Snap.path.isBBoxIntersect
	     [ method ]
	     **
	     * Utility method
	     **
	     * Returns `true` if two bounding boxes intersect
	     - bbox1 (string) first bounding box
	     - bbox2 (string) second bounding box
	     = (boolean) `true` if bounding boxes intersect
	    \*/
	    Snap.path.isBBoxIntersect = isBBoxIntersect;
	    /*\
	     * Snap.path.intersection
	     [ method ]
	     **
	     * Utility method
	     **
	     * Finds intersections of two paths
	     - path1 (string) path string
	     - path2 (string) path string
	     = (array) dots of intersection
	     o [
	     o     {
	     o         x: (number) x coordinate of the point,
	     o         y: (number) y coordinate of the point,
	     o         t1: (number) t value for segment of path1,
	     o         t2: (number) t value for segment of path2,
	     o         segment1: (number) order number for segment of path1,
	     o         segment2: (number) order number for segment of path2,
	     o         bez1: (array) eight coordinates representing beziér curve for the segment of path1,
	     o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
	     o     }
	     o ]
	    \*/
	    Snap.path.intersection = pathIntersection;
	    Snap.path.intersectionNumber = pathIntersectionNumber;
	    /*\
	     * Snap.path.isPointInside
	     [ method ]
	     **
	     * Utility method
	     **
	     * Returns `true` if given point is inside a given closed path.
	     *
	     * Note: fill mode doesn’t affect the result of this method.
	     - path (string) path string
	     - x (number) x of the point
	     - y (number) y of the point
	     = (boolean) `true` if point is inside the path
	    \*/
	    Snap.path.isPointInside = isPointInsidePath;
	    /*\
	     * Snap.path.getBBox
	     [ method ]
	     **
	     * Utility method
	     **
	     * Returns the bounding box of a given path
	     - path (string) path string
	     = (object) bounding box
	     o {
	     o     x: (number) x coordinate of the left top point of the box,
	     o     y: (number) y coordinate of the left top point of the box,
	     o     x2: (number) x coordinate of the right bottom point of the box,
	     o     y2: (number) y coordinate of the right bottom point of the box,
	     o     width: (number) width of the box,
	     o     height: (number) height of the box
	     o }
	    \*/
	    Snap.path.getBBox = pathBBox;
	    Snap.path.get = getPath;
	    /*\
	     * Snap.path.toRelative
	     [ method ]
	     **
	     * Utility method
	     **
	     * Converts path coordinates into relative values
	     - path (string) path string
	     = (array) path string
	    \*/
	    Snap.path.toRelative = pathToRelative;
	    /*\
	     * Snap.path.toAbsolute
	     [ method ]
	     **
	     * Utility method
	     **
	     * Converts path coordinates into absolute values
	     - path (string) path string
	     = (array) path string
	    \*/
	    Snap.path.toAbsolute = pathToAbsolute;
	    /*\
	     * Snap.path.toCubic
	     [ method ]
	     **
	     * Utility method
	     **
	     * Converts path to a new path where all segments are cubic beziér curves
	     - pathString (string|array) path string or array of segments
	     = (array) array of segments
	    \*/
	    Snap.path.toCubic = path2curve;
	    /*\
	     * Snap.path.map
	     [ method ]
	     **
	     * Transform the path string with the given matrix
	     - path (string) path string
	     - matrix (object) see @Matrix
	     = (string) transformed path string
	    \*/
	    Snap.path.map = mapPath;
	    Snap.path.toString = toString;
	    Snap.path.clone = pathClone;
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob) {
	    var mmax = Math.max,
	        mmin = Math.min;
	
	    // Set
	    var Set = function (items) {
	        this.items = [];
		this.bindings = {};
	        this.length = 0;
	        this.type = "set";
	        if (items) {
	            for (var i = 0, ii = items.length; i < ii; i++) {
	                if (items[i]) {
	                    this[this.items.length] = this.items[this.items.length] = items[i];
	                    this.length++;
	                }
	            }
	        }
	    },
	    setproto = Set.prototype;
	    /*\
	     * Set.push
	     [ method ]
	     **
	     * Adds each argument to the current set
	     = (object) original element
	    \*/
	    setproto.push = function () {
	        var item,
	            len;
	        for (var i = 0, ii = arguments.length; i < ii; i++) {
	            item = arguments[i];
	            if (item) {
	                len = this.items.length;
	                this[len] = this.items[len] = item;
	                this.length++;
	            }
	        }
	        return this;
	    };
	    /*\
	     * Set.pop
	     [ method ]
	     **
	     * Removes last element and returns it
	     = (object) element
	    \*/
	    setproto.pop = function () {
	        this.length && delete this[this.length--];
	        return this.items.pop();
	    };
	    /*\
	     * Set.forEach
	     [ method ]
	     **
	     * Executes given function for each element in the set
	     *
	     * If the function returns `false`, the loop stops running.
	     **
	     - callback (function) function to run
	     - thisArg (object) context object for the callback
	     = (object) Set object
	    \*/
	    setproto.forEach = function (callback, thisArg) {
	        for (var i = 0, ii = this.items.length; i < ii; i++) {
	            if (callback.call(thisArg, this.items[i], i) === false) {
	                return this;
	            }
	        }
	        return this;
	    };
	    /*\
	     * Set.animate
	     [ method ]
	     **
	     * Animates each element in set in sync.
	     *
	     **
	     - attrs (object) key-value pairs of destination attributes
	     - duration (number) duration of the animation in milliseconds
	     - easing (function) #optional easing function from @mina or custom
	     - callback (function) #optional callback function that executes when the animation ends
	     * or
	     - animation (array) array of animation parameter for each element in set in format `[attrs, duration, easing, callback]`
	     > Usage
	     | // animate all elements in set to radius 10
	     | set.animate({r: 10}, 500, mina.easein);
	     | // or
	     | // animate first element to radius 10, but second to radius 20 and in different time
	     | set.animate([{r: 10}, 500, mina.easein], [{r: 20}, 1500, mina.easein]);
	     = (Element) the current element
	    \*/
	    setproto.animate = function (attrs, ms, easing, callback) {
	        if (typeof easing == "function" && !easing.length) {
	            callback = easing;
	            easing = mina.linear;
	        }
	        if (attrs instanceof Snap._.Animation) {
	            callback = attrs.callback;
	            easing = attrs.easing;
	            ms = easing.dur;
	            attrs = attrs.attr;
	        }
	        var args = arguments;
	        if (Snap.is(attrs, "array") && Snap.is(args[args.length - 1], "array")) {
	            var each = true;
	        }
	        var begin,
	            handler = function () {
	                if (begin) {
	                    this.b = begin;
	                } else {
	                    begin = this.b;
	                }
	            },
	            cb = 0,
	            set = this,
	            callbacker = callback && function () {
	                if (++cb == set.length) {
	                    callback.call(this);
	                }
	            };
	        return this.forEach(function (el, i) {
	            eve.once("snap.animcreated." + el.id, handler);
	            if (each) {
	                args[i] && el.animate.apply(el, args[i]);
	            } else {
	                el.animate(attrs, ms, easing, callbacker);
	            }
	        });
	    };
	    /*\
	     * Set.remove
	     [ method ]
	     **
	     * Removes all children of the set.
	     *
	     = (object) Set object
	    \*/
	    setproto.remove = function () {
	        while (this.length) {
	            this.pop().remove();
	        }
	        return this;
	    };
	    /*\
	     * Set.bind
	     [ method ]
	     **
	     * Specifies how to handle a specific attribute when applied
	     * to a set.
	     *
	     **
	     - attr (string) attribute name
	     - callback (function) function to run
	     * or
	     - attr (string) attribute name
	     - element (Element) specific element in the set to apply the attribute to
	     * or
	     - attr (string) attribute name
	     - element (Element) specific element in the set to apply the attribute to
	     - eattr (string) attribute on the element to bind the attribute to
	     = (object) Set object
	    \*/
	    setproto.bind = function (attr, a, b) {
	        var data = {};
	        if (typeof a == "function") {
	            this.bindings[attr] = a;
	        } else {
	            var aname = b || attr;
	            this.bindings[attr] = function (v) {
	                data[aname] = v;
	                a.attr(data);
	            };
	        }
	        return this;
	    };
	    /*\
	     * Set.attr
	     [ method ]
	     **
	     * Equivalent of @Element.attr.
	     = (object) Set object
	    \*/
	    setproto.attr = function (value) {
	        var unbound = {};
	        for (var k in value) {
	            if (this.bindings[k]) {
	                this.bindings[k](value[k]);
	            } else {
	                unbound[k] = value[k];
	            }
	        }
	        for (var i = 0, ii = this.items.length; i < ii; i++) {
	            this.items[i].attr(unbound);
	        }
	        return this;
	    };
	    /*\
	     * Set.clear
	     [ method ]
	     **
	     * Removes all elements from the set
	    \*/
	    setproto.clear = function () {
	        while (this.length) {
	            this.pop();
	        }
	    };
	    /*\
	     * Set.splice
	     [ method ]
	     **
	     * Removes range of elements from the set
	     **
	     - index (number) position of the deletion
	     - count (number) number of element to remove
	     - insertion… (object) #optional elements to insert
	     = (object) set elements that were deleted
	    \*/
	    setproto.splice = function (index, count, insertion) {
	        index = index < 0 ? mmax(this.length + index, 0) : index;
	        count = mmax(0, mmin(this.length - index, count));
	        var tail = [],
	            todel = [],
	            args = [],
	            i;
	        for (i = 2; i < arguments.length; i++) {
	            args.push(arguments[i]);
	        }
	        for (i = 0; i < count; i++) {
	            todel.push(this[index + i]);
	        }
	        for (; i < this.length - index; i++) {
	            tail.push(this[index + i]);
	        }
	        var arglen = args.length;
	        for (i = 0; i < arglen + tail.length; i++) {
	            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
	        }
	        i = this.items.length = this.length -= count - arglen;
	        while (this[i]) {
	            delete this[i++];
	        }
	        return new Set(todel);
	    };
	    /*\
	     * Set.exclude
	     [ method ]
	     **
	     * Removes given element from the set
	     **
	     - element (object) element to remove
	     = (boolean) `true` if object was found and removed from the set
	    \*/
	    setproto.exclude = function (el) {
	        for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
	            this.splice(i, 1);
	            return true;
	        }
	        return false;
	    };
	    /*\
	     * Set.insertAfter
	     [ method ]
	     **
	     * Inserts set elements after given element.
	     **
	     - element (object) set will be inserted after this element
	     = (object) Set object
	    \*/
	    setproto.insertAfter = function (el) {
	        var i = this.items.length;
	        while (i--) {
	            this.items[i].insertAfter(el);
	        }
	        return this;
	    };
	    /*\
	     * Set.getBBox
	     [ method ]
	     **
	     * Union of all bboxes of the set. See @Element.getBBox.
	     = (object) bounding box descriptor. See @Element.getBBox.
	    \*/
	    setproto.getBBox = function () {
	        var x = [],
	            y = [],
	            x2 = [],
	            y2 = [];
	        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
	            var box = this.items[i].getBBox();
	            x.push(box.x);
	            y.push(box.y);
	            x2.push(box.x + box.width);
	            y2.push(box.y + box.height);
	        }
	        x = mmin.apply(0, x);
	        y = mmin.apply(0, y);
	        x2 = mmax.apply(0, x2);
	        y2 = mmax.apply(0, y2);
	        return {
	            x: x,
	            y: y,
	            x2: x2,
	            y2: y2,
	            width: x2 - x,
	            height: y2 - y,
	            cx: x + (x2 - x) / 2,
	            cy: y + (y2 - y) / 2
	        };
	    };
	    /*\
	     * Set.insertAfter
	     [ method ]
	     **
	     * Creates a clone of the set.
	     **
	     = (object) New Set object
	    \*/
	    setproto.clone = function (s) {
	        s = new Set;
	        for (var i = 0, ii = this.items.length; i < ii; i++) {
	            s.push(this.items[i].clone());
	        }
	        return s;
	    };
	    setproto.toString = function () {
	        return "Snap\u2018s set";
	    };
	    setproto.type = "set";
	    // export
	    /*\
	     * Snap.Set
	     [ property ]
	     **
	     * Set constructor.
	    \*/
	    Snap.Set = Set;
	    /*\
	     * Snap.set
	     [ method ]
	     **
	     * Creates a set and fills it with list of arguments.
	     **
	     = (object) New Set object
	     | var r = paper.rect(0, 0, 10, 10),
	     |     s1 = Snap.set(), // empty set
	     |     s2 = Snap.set(r, paper.circle(100, 100, 20)); // prefilled set
	    \*/
	    Snap.set = function () {
	        var set = new Set;
	        if (arguments.length) {
	            set.push.apply(set, Array.prototype.slice.call(arguments, 0));
	        }
	        return set;
	    };
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob) {
	    var names = {},
	        reUnit = /[%a-z]+$/i,
	        Str = String;
	    names.stroke = names.fill = "colour";
	    function getEmpty(item) {
	        var l = item[0];
	        switch (l.toLowerCase()) {
	            case "t": return [l, 0, 0];
	            case "m": return [l, 1, 0, 0, 1, 0, 0];
	            case "r": if (item.length == 4) {
	                return [l, 0, item[2], item[3]];
	            } else {
	                return [l, 0];
	            }
	            case "s": if (item.length == 5) {
	                return [l, 1, 1, item[3], item[4]];
	            } else if (item.length == 3) {
	                return [l, 1, 1];
	            } else {
	                return [l, 1];
	            }
	        }
	    }
	    function equaliseTransform(t1, t2, getBBox) {
	        t1 = t1 || new Snap.Matrix;
	        t2 = t2 || new Snap.Matrix;
	        t1 = Snap.parseTransformString(t1.toTransformString()) || [];
	        t2 = Snap.parseTransformString(t2.toTransformString()) || [];
	        var maxlength = Math.max(t1.length, t2.length),
	            from = [],
	            to = [],
	            i = 0, j, jj,
	            tt1, tt2;
	        for (; i < maxlength; i++) {
	            tt1 = t1[i] || getEmpty(t2[i]);
	            tt2 = t2[i] || getEmpty(tt1);
	            if (tt1[0] != tt2[0] ||
	                tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3]) ||
	                tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4])
	                ) {
	                    t1 = Snap._.transform2matrix(t1, getBBox());
	                    t2 = Snap._.transform2matrix(t2, getBBox());
	                    from = [["m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f]];
	                    to = [["m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f]];
	                    break;
	            }
	            from[i] = [];
	            to[i] = [];
	            for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
	                j in tt1 && (from[i][j] = tt1[j]);
	                j in tt2 && (to[i][j] = tt2[j]);
	            }
	        }
	        return {
	            from: path2array(from),
	            to: path2array(to),
	            f: getPath(from)
	        };
	    }
	    function getNumber(val) {
	        return val;
	    }
	    function getUnit(unit) {
	        return function (val) {
	            return +val.toFixed(3) + unit;
	        };
	    }
	    function getViewBox(val) {
	        return val.join(" ");
	    }
	    function getColour(clr) {
	        return Snap.rgb(clr[0], clr[1], clr[2], clr[3]);
	    }
	    function getPath(path) {
	        var k = 0, i, ii, j, jj, out, a, b = [];
	        for (i = 0, ii = path.length; i < ii; i++) {
	            out = "[";
	            a = ['"' + path[i][0] + '"'];
	            for (j = 1, jj = path[i].length; j < jj; j++) {
	                a[j] = "val[" + k++ + "]";
	            }
	            out += a + "]";
	            b[i] = out;
	        }
	        return Function("val", "return Snap.path.toString.call([" + b + "])");
	    }
	    function path2array(path) {
	        var out = [];
	        for (var i = 0, ii = path.length; i < ii; i++) {
	            for (var j = 1, jj = path[i].length; j < jj; j++) {
	                out.push(path[i][j]);
	            }
	        }
	        return out;
	    }
	    function isNumeric(obj) {
	        return isFinite(obj);
	    }
	    function arrayEqual(arr1, arr2) {
	        if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
	            return false;
	        }
	        return arr1.toString() == arr2.toString();
	    }
	    Element.prototype.equal = function (name, b) {
	        return eve("snap.util.equal", this, name, b).firstDefined();
	    };
	    eve.on("snap.util.equal", function (name, b) {
	        var A, B, a = Str(this.attr(name) || ""),
	            el = this;
	        if (names[name] == "colour") {
	            A = Snap.color(a);
	            B = Snap.color(b);
	            return {
	                from: [A.r, A.g, A.b, A.opacity],
	                to: [B.r, B.g, B.b, B.opacity],
	                f: getColour
	            };
	        }
	        if (name == "viewBox") {
	            A = this.attr(name).vb.split(" ").map(Number);
	            B = b.split(" ").map(Number);
	            return {
	                from: A,
	                to: B,
	                f: getViewBox
	            };
	        }
	        if (name == "transform" || name == "gradientTransform" || name == "patternTransform") {
	            if (typeof b == "string") {
	                b = Str(b).replace(/\.{3}|\u2026/g, a);
	            }
	            a = this.matrix;
	            if (!Snap._.rgTransform.test(b)) {
	                b = Snap._.transform2matrix(Snap._.svgTransform2string(b), this.getBBox());
	            } else {
	                b = Snap._.transform2matrix(b, this.getBBox());
	            }
	            return equaliseTransform(a, b, function () {
	                return el.getBBox(1);
	            });
	        }
	        if (name == "d" || name == "path") {
	            A = Snap.path.toCubic(a, b);
	            return {
	                from: path2array(A[0]),
	                to: path2array(A[1]),
	                f: getPath(A[0])
	            };
	        }
	        if (name == "points") {
	            A = Str(a).split(Snap._.separator);
	            B = Str(b).split(Snap._.separator);
	            return {
	                from: A,
	                to: B,
	                f: function (val) { return val; }
	            };
	        }
	        if (isNumeric(a) && isNumeric(b)) {
	            return {
	                from: parseFloat(a),
	                to: parseFloat(b),
	                f: getNumber
	            };
	        }
	        var aUnit = a.match(reUnit),
	            bUnit = Str(b).match(reUnit);
	        if (aUnit && arrayEqual(aUnit, bUnit)) {
	            return {
	                from: parseFloat(a),
	                to: parseFloat(b),
	                f: getUnit(aUnit)
	            };
	        } else {
	            return {
	                from: this.asPX(name),
	                to: this.asPX(name, b),
	                f: getNumber
	            };
	        }
	    });
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	// 
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	// 
	// http://www.apache.org/licenses/LICENSE-2.0
	// 
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob) {
	    var elproto = Element.prototype,
	    has = "hasOwnProperty",
	    supportsTouch = "createTouch" in glob.doc,
	    events = [
	        "click", "dblclick", "mousedown", "mousemove", "mouseout",
	        "mouseover", "mouseup", "touchstart", "touchmove", "touchend",
	        "touchcancel"
	    ],
	    touchMap = {
	        mousedown: "touchstart",
	        mousemove: "touchmove",
	        mouseup: "touchend"
	    },
	    getScroll = function (xy, el) {
	        var name = xy == "y" ? "scrollTop" : "scrollLeft",
	            doc = el && el.node ? el.node.ownerDocument : glob.doc;
	        return doc[name in doc.documentElement ? "documentElement" : "body"][name];
	    },
	    preventDefault = function () {
	        this.returnValue = false;
	    },
	    preventTouch = function () {
	        return this.originalEvent.preventDefault();
	    },
	    stopPropagation = function () {
	        this.cancelBubble = true;
	    },
	    stopTouch = function () {
	        return this.originalEvent.stopPropagation();
	    },
	    addEvent = function (obj, type, fn, element) {
	        var realName = supportsTouch && touchMap[type] ? touchMap[type] : type,
	            f = function (e) {
	                var scrollY = getScroll("y", element),
	                    scrollX = getScroll("x", element);
	                if (supportsTouch && touchMap[has](type)) {
	                    for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
	                        if (e.targetTouches[i].target == obj || obj.contains(e.targetTouches[i].target)) {
	                            var olde = e;
	                            e = e.targetTouches[i];
	                            e.originalEvent = olde;
	                            e.preventDefault = preventTouch;
	                            e.stopPropagation = stopTouch;
	                            break;
	                        }
	                    }
	                }
	                var x = e.clientX + scrollX,
	                    y = e.clientY + scrollY;
	                return fn.call(element, e, x, y);
	            };
	
	        if (type !== realName) {
	            obj.addEventListener(type, f, false);
	        }
	
	        obj.addEventListener(realName, f, false);
	
	        return function () {
	            if (type !== realName) {
	                obj.removeEventListener(type, f, false);
	            }
	
	            obj.removeEventListener(realName, f, false);
	            return true;
	        };
	    },
	    drag = [],
	    dragMove = function (e) {
	        var x = e.clientX,
	            y = e.clientY,
	            scrollY = getScroll("y"),
	            scrollX = getScroll("x"),
	            dragi,
	            j = drag.length;
	        while (j--) {
	            dragi = drag[j];
	            if (supportsTouch) {
	                var i = e.touches && e.touches.length,
	                    touch;
	                while (i--) {
	                    touch = e.touches[i];
	                    if (touch.identifier == dragi.el._drag.id || dragi.el.node.contains(touch.target)) {
	                        x = touch.clientX;
	                        y = touch.clientY;
	                        (e.originalEvent ? e.originalEvent : e).preventDefault();
	                        break;
	                    }
	                }
	            } else {
	                e.preventDefault();
	            }
	            var node = dragi.el.node,
	                o,
	                next = node.nextSibling,
	                parent = node.parentNode,
	                display = node.style.display;
	            // glob.win.opera && parent.removeChild(node);
	            // node.style.display = "none";
	            // o = dragi.el.paper.getElementByPoint(x, y);
	            // node.style.display = display;
	            // glob.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
	            // o && eve("snap.drag.over." + dragi.el.id, dragi.el, o);
	            x += scrollX;
	            y += scrollY;
	            eve("snap.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
	        }
	    },
	    dragUp = function (e) {
	        Snap.unmousemove(dragMove).unmouseup(dragUp);
	        var i = drag.length,
	            dragi;
	        while (i--) {
	            dragi = drag[i];
	            dragi.el._drag = {};
	            eve("snap.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
	            eve.off("snap.drag.*." + dragi.el.id);
	        }
	        drag = [];
	    };
	    /*\
	     * Element.click
	     [ method ]
	     **
	     * Adds a click event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.unclick
	     [ method ]
	     **
	     * Removes a click event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.dblclick
	     [ method ]
	     **
	     * Adds a double click event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.undblclick
	     [ method ]
	     **
	     * Removes a double click event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.mousedown
	     [ method ]
	     **
	     * Adds a mousedown event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.unmousedown
	     [ method ]
	     **
	     * Removes a mousedown event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.mousemove
	     [ method ]
	     **
	     * Adds a mousemove event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.unmousemove
	     [ method ]
	     **
	     * Removes a mousemove event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.mouseout
	     [ method ]
	     **
	     * Adds a mouseout event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.unmouseout
	     [ method ]
	     **
	     * Removes a mouseout event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.mouseover
	     [ method ]
	     **
	     * Adds a mouseover event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.unmouseover
	     [ method ]
	     **
	     * Removes a mouseover event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.mouseup
	     [ method ]
	     **
	     * Adds a mouseup event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.unmouseup
	     [ method ]
	     **
	     * Removes a mouseup event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.touchstart
	     [ method ]
	     **
	     * Adds a touchstart event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.untouchstart
	     [ method ]
	     **
	     * Removes a touchstart event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.touchmove
	     [ method ]
	     **
	     * Adds a touchmove event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.untouchmove
	     [ method ]
	     **
	     * Removes a touchmove event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.touchend
	     [ method ]
	     **
	     * Adds a touchend event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.untouchend
	     [ method ]
	     **
	     * Removes a touchend event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    
	    /*\
	     * Element.touchcancel
	     [ method ]
	     **
	     * Adds a touchcancel event handler to the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    /*\
	     * Element.untouchcancel
	     [ method ]
	     **
	     * Removes a touchcancel event handler from the element
	     - handler (function) handler for the event
	     = (object) @Element
	    \*/
	    for (var i = events.length; i--;) {
	        (function (eventName) {
	            Snap[eventName] = elproto[eventName] = function (fn, scope) {
	                if (Snap.is(fn, "function")) {
	                    this.events = this.events || [];
	                    this.events.push({
	                        name: eventName,
	                        f: fn,
	                        unbind: addEvent(this.node || document, eventName, fn, scope || this)
	                    });
	                } else {
	                    for (var i = 0, ii = this.events.length; i < ii; i++) if (this.events[i].name == eventName) {
	                        try {
	                            this.events[i].f.call(this);
	                        } catch (e) {}
	                    }
	                }
	                return this;
	            };
	            Snap["un" + eventName] =
	            elproto["un" + eventName] = function (fn) {
	                var events = this.events || [],
	                    l = events.length;
	                while (l--) if (events[l].name == eventName &&
	                               (events[l].f == fn || !fn)) {
	                    events[l].unbind();
	                    events.splice(l, 1);
	                    !events.length && delete this.events;
	                    return this;
	                }
	                return this;
	            };
	        })(events[i]);
	    }
	    /*\
	     * Element.hover
	     [ method ]
	     **
	     * Adds hover event handlers to the element
	     - f_in (function) handler for hover in
	     - f_out (function) handler for hover out
	     - icontext (object) #optional context for hover in handler
	     - ocontext (object) #optional context for hover out handler
	     = (object) @Element
	    \*/
	    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
	        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
	    };
	    /*\
	     * Element.unhover
	     [ method ]
	     **
	     * Removes hover event handlers from the element
	     - f_in (function) handler for hover in
	     - f_out (function) handler for hover out
	     = (object) @Element
	    \*/
	    elproto.unhover = function (f_in, f_out) {
	        return this.unmouseover(f_in).unmouseout(f_out);
	    };
	    var draggable = [];
	    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
	    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
	    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
	    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
	    /*\
	     * Element.drag
	     [ method ]
	     **
	     * Adds event handlers for an element's drag gesture
	     **
	     - onmove (function) handler for moving
	     - onstart (function) handler for drag start
	     - onend (function) handler for drag end
	     - mcontext (object) #optional context for moving handler
	     - scontext (object) #optional context for drag start handler
	     - econtext (object) #optional context for drag end handler
	     * Additionaly following `drag` events are triggered: `drag.start.<id>` on start, 
	     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element is dragged over another element 
	     * `drag.over.<id>` fires as well.
	     *
	     * Start event and start handler are called in specified context or in context of the element with following parameters:
	     o x (number) x position of the mouse
	     o y (number) y position of the mouse
	     o event (object) DOM event object
	     * Move event and move handler are called in specified context or in context of the element with following parameters:
	     o dx (number) shift by x from the start point
	     o dy (number) shift by y from the start point
	     o x (number) x position of the mouse
	     o y (number) y position of the mouse
	     o event (object) DOM event object
	     * End event and end handler are called in specified context or in context of the element with following parameters:
	     o event (object) DOM event object
	     = (object) @Element
	    \*/
	    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
	        var el = this;
	        if (!arguments.length) {
	            var origTransform;
	            return el.drag(function (dx, dy) {
	                this.attr({
	                    transform: origTransform + (origTransform ? "T" : "t") + [dx, dy]
	                });
	            }, function () {
	                origTransform = this.transform().local;
	            });
	        }
	        function start(e, x, y) {
	            (e.originalEvent || e).preventDefault();
	            el._drag.x = x;
	            el._drag.y = y;
	            el._drag.id = e.identifier;
	            !drag.length && Snap.mousemove(dragMove).mouseup(dragUp);
	            drag.push({el: el, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
	            onstart && eve.on("snap.drag.start." + el.id, onstart);
	            onmove && eve.on("snap.drag.move." + el.id, onmove);
	            onend && eve.on("snap.drag.end." + el.id, onend);
	            eve("snap.drag.start." + el.id, start_scope || move_scope || el, x, y, e);
	        }
	        function init(e, x, y) {
	            eve("snap.draginit." + el.id, el, e, x, y);
	        }
	        eve.on("snap.draginit." + el.id, start);
	        el._drag = {};
	        draggable.push({el: el, start: start, init: init});
	        el.mousedown(init);
	        return el;
	    };
	    /*
	     * Element.onDragOver
	     [ method ]
	     **
	     * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id)
	     - f (function) handler for event, first argument would be the element you are dragging over
	    \*/
	    // elproto.onDragOver = function (f) {
	    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
	    // };
	    /*\
	     * Element.undrag
	     [ method ]
	     **
	     * Removes all drag event handlers from the given element
	    \*/
	    elproto.undrag = function () {
	        var i = draggable.length;
	        while (i--) if (draggable[i].el == this) {
	            this.unmousedown(draggable[i].init);
	            draggable.splice(i, 1);
	            eve.unbind("snap.drag.*." + this.id);
	            eve.unbind("snap.draginit." + this.id);
	        }
	        !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
	        return this;
	    };
	});
	
	// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob) {
	    var elproto = Element.prototype,
	        pproto = Paper.prototype,
	        rgurl = /^\s*url\((.+)\)/,
	        Str = String,
	        $ = Snap._.$;
	    Snap.filter = {};
	    /*\
	     * Paper.filter
	     [ method ]
	     **
	     * Creates a `<filter>` element
	     **
	     - filstr (string) SVG fragment of filter provided as a string
	     = (object) @Element
	     * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
	     > Usage
	     | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
	     |     c = paper.circle(10, 10, 10).attr({
	     |         filter: f
	     |     });
	    \*/
	    pproto.filter = function (filstr) {
	        var paper = this;
	        if (paper.type != "svg") {
	            paper = paper.paper;
	        }
	        var f = Snap.parse(Str(filstr)),
	            id = Snap._.id(),
	            width = paper.node.offsetWidth,
	            height = paper.node.offsetHeight,
	            filter = $("filter");
	        $(filter, {
	            id: id,
	            filterUnits: "userSpaceOnUse"
	        });
	        filter.appendChild(f.node);
	        paper.defs.appendChild(filter);
	        return new Element(filter);
	    };
	
	    eve.on("snap.util.getattr.filter", function () {
	        eve.stop();
	        var p = $(this.node, "filter");
	        if (p) {
	            var match = Str(p).match(rgurl);
	            return match && Snap.select(match[1]);
	        }
	    });
	    eve.on("snap.util.attr.filter", function (value) {
	        if (value instanceof Element && value.type == "filter") {
	            eve.stop();
	            var id = value.node.id;
	            if (!id) {
	                $(value.node, {id: value.id});
	                id = value.id;
	            }
	            $(this.node, {
	                filter: Snap.url(id)
	            });
	        }
	        if (!value || value == "none") {
	            eve.stop();
	            this.node.removeAttribute("filter");
	        }
	    });
	    /*\
	     * Snap.filter.blur
	     [ method ]
	     **
	     * Returns an SVG markup string for the blur filter
	     **
	     - x (number) amount of horizontal blur, in pixels
	     - y (number) #optional amount of vertical blur, in pixels
	     = (string) filter representation
	     > Usage
	     | var f = paper.filter(Snap.filter.blur(5, 10)),
	     |     c = paper.circle(10, 10, 10).attr({
	     |         filter: f
	     |     });
	    \*/
	    Snap.filter.blur = function (x, y) {
	        if (x == null) {
	            x = 2;
	        }
	        var def = y == null ? x : [x, y];
	        return Snap.format('\<feGaussianBlur stdDeviation="{def}"/>', {
	            def: def
	        });
	    };
	    Snap.filter.blur.toString = function () {
	        return this();
	    };
	    /*\
	     * Snap.filter.shadow
	     [ method ]
	     **
	     * Returns an SVG markup string for the shadow filter
	     **
	     - dx (number) #optional horizontal shift of the shadow, in pixels
	     - dy (number) #optional vertical shift of the shadow, in pixels
	     - blur (number) #optional amount of blur
	     - color (string) #optional color of the shadow
	     - opacity (number) #optional `0..1` opacity of the shadow
	     * or
	     - dx (number) #optional horizontal shift of the shadow, in pixels
	     - dy (number) #optional vertical shift of the shadow, in pixels
	     - color (string) #optional color of the shadow
	     - opacity (number) #optional `0..1` opacity of the shadow
	     * which makes blur default to `4`. Or
	     - dx (number) #optional horizontal shift of the shadow, in pixels
	     - dy (number) #optional vertical shift of the shadow, in pixels
	     - opacity (number) #optional `0..1` opacity of the shadow
	     = (string) filter representation
	     > Usage
	     | var f = paper.filter(Snap.filter.shadow(0, 2, .3)),
	     |     c = paper.circle(10, 10, 10).attr({
	     |         filter: f
	     |     });
	    \*/
	    Snap.filter.shadow = function (dx, dy, blur, color, opacity) {
	        if (opacity == null) {
	            if (color == null) {
	                opacity = blur;
	                blur = 4;
	                color = "#000";
	            } else {
	                opacity = color;
	                color = blur;
	                blur = 4;
	            }
	        }
	        if (blur == null) {
	            blur = 4;
	        }
	        if (opacity == null) {
	            opacity = 1;
	        }
	        if (dx == null) {
	            dx = 0;
	            dy = 2;
	        }
	        if (dy == null) {
	            dy = dx;
	        }
	        color = Snap.color(color);
	        return Snap.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>', {
	            color: color,
	            dx: dx,
	            dy: dy,
	            blur: blur,
	            opacity: opacity
	        });
	    };
	    Snap.filter.shadow.toString = function () {
	        return this();
	    };
	    /*\
	     * Snap.filter.grayscale
	     [ method ]
	     **
	     * Returns an SVG markup string for the grayscale filter
	     **
	     - amount (number) amount of filter (`0..1`)
	     = (string) filter representation
	    \*/
	    Snap.filter.grayscale = function (amount) {
	        if (amount == null) {
	            amount = 1;
	        }
	        return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>', {
	            a: 0.2126 + 0.7874 * (1 - amount),
	            b: 0.7152 - 0.7152 * (1 - amount),
	            c: 0.0722 - 0.0722 * (1 - amount),
	            d: 0.2126 - 0.2126 * (1 - amount),
	            e: 0.7152 + 0.2848 * (1 - amount),
	            f: 0.0722 - 0.0722 * (1 - amount),
	            g: 0.2126 - 0.2126 * (1 - amount),
	            h: 0.0722 + 0.9278 * (1 - amount)
	        });
	    };
	    Snap.filter.grayscale.toString = function () {
	        return this();
	    };
	    /*\
	     * Snap.filter.sepia
	     [ method ]
	     **
	     * Returns an SVG markup string for the sepia filter
	     **
	     - amount (number) amount of filter (`0..1`)
	     = (string) filter representation
	    \*/
	    Snap.filter.sepia = function (amount) {
	        if (amount == null) {
	            amount = 1;
	        }
	        return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>', {
	            a: 0.393 + 0.607 * (1 - amount),
	            b: 0.769 - 0.769 * (1 - amount),
	            c: 0.189 - 0.189 * (1 - amount),
	            d: 0.349 - 0.349 * (1 - amount),
	            e: 0.686 + 0.314 * (1 - amount),
	            f: 0.168 - 0.168 * (1 - amount),
	            g: 0.272 - 0.272 * (1 - amount),
	            h: 0.534 - 0.534 * (1 - amount),
	            i: 0.131 + 0.869 * (1 - amount)
	        });
	    };
	    Snap.filter.sepia.toString = function () {
	        return this();
	    };
	    /*\
	     * Snap.filter.saturate
	     [ method ]
	     **
	     * Returns an SVG markup string for the saturate filter
	     **
	     - amount (number) amount of filter (`0..1`)
	     = (string) filter representation
	    \*/
	    Snap.filter.saturate = function (amount) {
	        if (amount == null) {
	            amount = 1;
	        }
	        return Snap.format('<feColorMatrix type="saturate" values="{amount}"/>', {
	            amount: 1 - amount
	        });
	    };
	    Snap.filter.saturate.toString = function () {
	        return this();
	    };
	    /*\
	     * Snap.filter.hueRotate
	     [ method ]
	     **
	     * Returns an SVG markup string for the hue-rotate filter
	     **
	     - angle (number) angle of rotation
	     = (string) filter representation
	    \*/
	    Snap.filter.hueRotate = function (angle) {
	        angle = angle || 0;
	        return Snap.format('<feColorMatrix type="hueRotate" values="{angle}"/>', {
	            angle: angle
	        });
	    };
	    Snap.filter.hueRotate.toString = function () {
	        return this();
	    };
	    /*\
	     * Snap.filter.invert
	     [ method ]
	     **
	     * Returns an SVG markup string for the invert filter
	     **
	     - amount (number) amount of filter (`0..1`)
	     = (string) filter representation
	    \*/
	    Snap.filter.invert = function (amount) {
	        if (amount == null) {
	            amount = 1;
	        }
	//        <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" color-interpolation-filters="sRGB"/>
	        return Snap.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>', {
	            amount: amount,
	            amount2: 1 - amount
	        });
	    };
	    Snap.filter.invert.toString = function () {
	        return this();
	    };
	    /*\
	     * Snap.filter.brightness
	     [ method ]
	     **
	     * Returns an SVG markup string for the brightness filter
	     **
	     - amount (number) amount of filter (`0..1`)
	     = (string) filter representation
	    \*/
	    Snap.filter.brightness = function (amount) {
	        if (amount == null) {
	            amount = 1;
	        }
	        return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>', {
	            amount: amount
	        });
	    };
	    Snap.filter.brightness.toString = function () {
	        return this();
	    };
	    /*\
	     * Snap.filter.contrast
	     [ method ]
	     **
	     * Returns an SVG markup string for the contrast filter
	     **
	     - amount (number) amount of filter (`0..1`)
	     = (string) filter representation
	    \*/
	    Snap.filter.contrast = function (amount) {
	        if (amount == null) {
	            amount = 1;
	        }
	        return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>', {
	            amount: amount,
	            amount2: .5 - amount / 2
	        });
	    };
	    Snap.filter.contrast.toString = function () {
	        return this();
	    };
	});
	
	// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
	    var box = Snap._.box,
	        is = Snap.is,
	        firstLetter = /^[^a-z]*([tbmlrc])/i,
	        toString = function () {
	            return "T" + this.dx + "," + this.dy;
	        };
	    /*\
	     * Element.getAlign
	     [ method ]
	     **
	     * Returns shift needed to align the element relatively to given element.
	     * If no elements specified, parent `<svg>` container will be used.
	     - el (object) @optional alignment element
	     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
	     = (object|string) Object in format `{dx: , dy: }` also has a string representation as a transformation string
	     > Usage
	     | el.transform(el.getAlign(el2, "top"));
	     * or
	     | var dy = el.getAlign(el2, "top").dy;
	    \*/
	    Element.prototype.getAlign = function (el, way) {
	        if (way == null && is(el, "string")) {
	            way = el;
	            el = null;
	        }
	        el = el || this.paper;
	        var bx = el.getBBox ? el.getBBox() : box(el),
	            bb = this.getBBox(),
	            out = {};
	        way = way && way.match(firstLetter);
	        way = way ? way[1].toLowerCase() : "c";
	        switch (way) {
	            case "t":
	                out.dx = 0;
	                out.dy = bx.y - bb.y;
	            break;
	            case "b":
	                out.dx = 0;
	                out.dy = bx.y2 - bb.y2;
	            break;
	            case "m":
	                out.dx = 0;
	                out.dy = bx.cy - bb.cy;
	            break;
	            case "l":
	                out.dx = bx.x - bb.x;
	                out.dy = 0;
	            break;
	            case "r":
	                out.dx = bx.x2 - bb.x2;
	                out.dy = 0;
	            break;
	            default:
	                out.dx = bx.cx - bb.cx;
	                out.dy = 0;
	            break;
	        }
	        out.toString = toString;
	        return out;
	    };
	    /*\
	     * Element.align
	     [ method ]
	     **
	     * Aligns the element relatively to given one via transformation.
	     * If no elements specified, parent `<svg>` container will be used.
	     - el (object) @optional alignment element
	     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
	     = (object) this element
	     > Usage
	     | el.align(el2, "top");
	     * or
	     | el.align("middle");
	    \*/
	    Element.prototype.align = function (el, way) {
	        return this.transform("..." + this.getAlign(el, way));
	    };
	});
	
	// Copyright (c) 2017 Adobe Systems Incorporated. All rights reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	Snap.plugin(function (Snap, Element, Paper, glob) {
	    // Colours are from https://www.materialui.co
	    var red         = "#ffebee#ffcdd2#ef9a9a#e57373#ef5350#f44336#e53935#d32f2f#c62828#b71c1c#ff8a80#ff5252#ff1744#d50000",
	        pink        = "#FCE4EC#F8BBD0#F48FB1#F06292#EC407A#E91E63#D81B60#C2185B#AD1457#880E4F#FF80AB#FF4081#F50057#C51162",
	        purple      = "#F3E5F5#E1BEE7#CE93D8#BA68C8#AB47BC#9C27B0#8E24AA#7B1FA2#6A1B9A#4A148C#EA80FC#E040FB#D500F9#AA00FF",
	        deeppurple  = "#EDE7F6#D1C4E9#B39DDB#9575CD#7E57C2#673AB7#5E35B1#512DA8#4527A0#311B92#B388FF#7C4DFF#651FFF#6200EA",
	        indigo      = "#E8EAF6#C5CAE9#9FA8DA#7986CB#5C6BC0#3F51B5#3949AB#303F9F#283593#1A237E#8C9EFF#536DFE#3D5AFE#304FFE",
	        blue        = "#E3F2FD#BBDEFB#90CAF9#64B5F6#64B5F6#2196F3#1E88E5#1976D2#1565C0#0D47A1#82B1FF#448AFF#2979FF#2962FF",
	        lightblue   = "#E1F5FE#B3E5FC#81D4FA#4FC3F7#29B6F6#03A9F4#039BE5#0288D1#0277BD#01579B#80D8FF#40C4FF#00B0FF#0091EA",
	        cyan        = "#E0F7FA#B2EBF2#80DEEA#4DD0E1#26C6DA#00BCD4#00ACC1#0097A7#00838F#006064#84FFFF#18FFFF#00E5FF#00B8D4",
	        teal        = "#E0F2F1#B2DFDB#80CBC4#4DB6AC#26A69A#009688#00897B#00796B#00695C#004D40#A7FFEB#64FFDA#1DE9B6#00BFA5",
	        green       = "#E8F5E9#C8E6C9#A5D6A7#81C784#66BB6A#4CAF50#43A047#388E3C#2E7D32#1B5E20#B9F6CA#69F0AE#00E676#00C853",
	        lightgreen  = "#F1F8E9#DCEDC8#C5E1A5#AED581#9CCC65#8BC34A#7CB342#689F38#558B2F#33691E#CCFF90#B2FF59#76FF03#64DD17",
	        lime        = "#F9FBE7#F0F4C3#E6EE9C#DCE775#D4E157#CDDC39#C0CA33#AFB42B#9E9D24#827717#F4FF81#EEFF41#C6FF00#AEEA00",
	        yellow      = "#FFFDE7#FFF9C4#FFF59D#FFF176#FFEE58#FFEB3B#FDD835#FBC02D#F9A825#F57F17#FFFF8D#FFFF00#FFEA00#FFD600",
	        amber       = "#FFF8E1#FFECB3#FFE082#FFD54F#FFCA28#FFC107#FFB300#FFA000#FF8F00#FF6F00#FFE57F#FFD740#FFC400#FFAB00",
	        orange      = "#FFF3E0#FFE0B2#FFCC80#FFB74D#FFA726#FF9800#FB8C00#F57C00#EF6C00#E65100#FFD180#FFAB40#FF9100#FF6D00",
	        deeporange  = "#FBE9E7#FFCCBC#FFAB91#FF8A65#FF7043#FF5722#F4511E#E64A19#D84315#BF360C#FF9E80#FF6E40#FF3D00#DD2C00",
	        brown       = "#EFEBE9#D7CCC8#BCAAA4#A1887F#8D6E63#795548#6D4C41#5D4037#4E342E#3E2723",
	        grey        = "#FAFAFA#F5F5F5#EEEEEE#E0E0E0#BDBDBD#9E9E9E#757575#616161#424242#212121",
	        bluegrey    = "#ECEFF1#CFD8DC#B0BEC5#90A4AE#78909C#607D8B#546E7A#455A64#37474F#263238";
	    /*\
	     * Snap.mui
	     [ property ]
	     **
	     * Contain Material UI colours.
	     | Snap().rect(0, 0, 10, 10).attr({fill: Snap.mui.deeppurple, stroke: Snap.mui.amber[600]});
	     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
	    \*/
	    Snap.mui = {};
	    /*\
	     * Snap.flat
	     [ property ]
	     **
	     * Contain Flat UI colours.
	     | Snap().rect(0, 0, 10, 10).attr({fill: Snap.flat.carrot, stroke: Snap.flat.wetasphalt});
	     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
	    \*/
	    Snap.flat = {};
	    function saveColor(colors) {
	        colors = colors.split(/(?=#)/);
	        var color = new String(colors[5]);
	        color[50] = colors[0];
	        color[100] = colors[1];
	        color[200] = colors[2];
	        color[300] = colors[3];
	        color[400] = colors[4];
	        color[500] = colors[5];
	        color[600] = colors[6];
	        color[700] = colors[7];
	        color[800] = colors[8];
	        color[900] = colors[9];
	        if (colors[10]) {
	            color.A100 = colors[10];
	            color.A200 = colors[11];
	            color.A400 = colors[12];
	            color.A700 = colors[13];
	        }
	        return color;
	    }
	    Snap.mui.red = saveColor(red);
	    Snap.mui.pink = saveColor(pink);
	    Snap.mui.purple = saveColor(purple);
	    Snap.mui.deeppurple = saveColor(deeppurple);
	    Snap.mui.indigo = saveColor(indigo);
	    Snap.mui.blue = saveColor(blue);
	    Snap.mui.lightblue = saveColor(lightblue);
	    Snap.mui.cyan = saveColor(cyan);
	    Snap.mui.teal = saveColor(teal);
	    Snap.mui.green = saveColor(green);
	    Snap.mui.lightgreen = saveColor(lightgreen);
	    Snap.mui.lime = saveColor(lime);
	    Snap.mui.yellow = saveColor(yellow);
	    Snap.mui.amber = saveColor(amber);
	    Snap.mui.orange = saveColor(orange);
	    Snap.mui.deeporange = saveColor(deeporange);
	    Snap.mui.brown = saveColor(brown);
	    Snap.mui.grey = saveColor(grey);
	    Snap.mui.bluegrey = saveColor(bluegrey);
	    Snap.flat.turquoise = "#1abc9c";
	    Snap.flat.greensea = "#16a085";
	    Snap.flat.sunflower = "#f1c40f";
	    Snap.flat.orange = "#f39c12";
	    Snap.flat.emerland = "#2ecc71";
	    Snap.flat.nephritis = "#27ae60";
	    Snap.flat.carrot = "#e67e22";
	    Snap.flat.pumpkin = "#d35400";
	    Snap.flat.peterriver = "#3498db";
	    Snap.flat.belizehole = "#2980b9";
	    Snap.flat.alizarin = "#e74c3c";
	    Snap.flat.pomegranate = "#c0392b";
	    Snap.flat.amethyst = "#9b59b6";
	    Snap.flat.wisteria = "#8e44ad";
	    Snap.flat.clouds = "#ecf0f1";
	    Snap.flat.silver = "#bdc3c7";
	    Snap.flat.wetasphalt = "#34495e";
	    Snap.flat.midnightblue = "#2c3e50";
	    Snap.flat.concrete = "#95a5a6";
	    Snap.flat.asbestos = "#7f8c8d";
	    /*\
	     * Snap.importMUIColors
	     [ method ]
	     **
	     * Imports Material UI colours into global object.
	     | Snap.importMUIColors();
	     | Snap().rect(0, 0, 10, 10).attr({fill: deeppurple, stroke: amber[600]});
	     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
	    \*/
	    Snap.importMUIColors = function () {
	        for (var color in Snap.mui) {
	            if (Snap.mui.hasOwnProperty(color)) {
	                window[color] = Snap.mui[color];
	            }
	        }
	    };
	});
	
	return Snap;
	}));
	}.call(window));

/***/ })
/******/ ]);
//# sourceMappingURL=da7d7713f074a6015ba3.worker.js.map