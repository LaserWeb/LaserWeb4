/******/ (function(modules) { // webpackBootstrap
/******/ 	var parentHotUpdateCallback = this["webpackHotUpdate"];
/******/ 	this["webpackHotUpdate"] = 
/******/ 	function webpackHotUpdateCallback(chunkId, moreModules) { // eslint-disable-line no-unused-vars
/******/ 		hotAddUpdateChunk(chunkId, moreModules);
/******/ 		if(parentHotUpdateCallback) parentHotUpdateCallback(chunkId, moreModules);
/******/ 	} ;
/******/ 	
/******/ 	function hotDownloadUpdateChunk(chunkId) { // eslint-disable-line no-unused-vars
/******/ 		importScripts(__webpack_require__.p + "" + chunkId + "." + hotCurrentHash + ".hot-update.js");
/******/ 	}
/******/ 	
/******/ 	function hotDownloadManifest(callback) { // eslint-disable-line no-unused-vars
/******/ 		return new Promise(function(resolve, reject) {
/******/ 			if(typeof XMLHttpRequest === "undefined")
/******/ 				return reject(new Error("No browser support"));
/******/ 			try {
/******/ 				var request = new XMLHttpRequest();
/******/ 				var requestPath = __webpack_require__.p + "" + hotCurrentHash + ".hot-update.json";
/******/ 				request.open("GET", requestPath, true);
/******/ 				request.timeout = 10000;
/******/ 				request.send(null);
/******/ 			} catch(err) {
/******/ 				return reject(err);
/******/ 			}
/******/ 			request.onreadystatechange = function() {
/******/ 				if(request.readyState !== 4) return;
/******/ 				if(request.status === 0) {
/******/ 					// timeout
/******/ 					reject(new Error("Manifest request to " + requestPath + " timed out."));
/******/ 				} else if(request.status === 404) {
/******/ 					// no update available
/******/ 					resolve();
/******/ 				} else if(request.status !== 200 && request.status !== 304) {
/******/ 					// other failure
/******/ 					reject(new Error("Manifest request to " + requestPath + " failed."));
/******/ 				} else {
/******/ 					// success
/******/ 					try {
/******/ 						var update = JSON.parse(request.responseText);
/******/ 					} catch(e) {
/******/ 						reject(e);
/******/ 						return;
/******/ 					}
/******/ 					resolve(update);
/******/ 				}
/******/ 			};
/******/ 		});
/******/ 	}
/******/ 	
/******/ 	function hotDisposeChunk(chunkId) { //eslint-disable-line no-unused-vars
/******/ 		delete installedChunks[chunkId];
/******/ 	}
/******/
/******/ 	
/******/ 	
/******/ 	var hotApplyOnUpdate = true;
/******/ 	var hotCurrentHash = "511861a0ff06e28ca886"; // eslint-disable-line no-unused-vars
/******/ 	var hotCurrentModuleData = {};
/******/ 	var hotCurrentChildModule; // eslint-disable-line no-unused-vars
/******/ 	var hotCurrentParents = []; // eslint-disable-line no-unused-vars
/******/ 	var hotCurrentParentsTemp = []; // eslint-disable-line no-unused-vars
/******/ 	
/******/ 	function hotCreateRequire(moduleId) { // eslint-disable-line no-unused-vars
/******/ 		var me = installedModules[moduleId];
/******/ 		if(!me) return __webpack_require__;
/******/ 		var fn = function(request) {
/******/ 			if(me.hot.active) {
/******/ 				if(installedModules[request]) {
/******/ 					if(installedModules[request].parents.indexOf(moduleId) < 0)
/******/ 						installedModules[request].parents.push(moduleId);
/******/ 				} else {
/******/ 					hotCurrentParents = [moduleId];
/******/ 					hotCurrentChildModule = request;
/******/ 				}
/******/ 				if(me.children.indexOf(request) < 0)
/******/ 					me.children.push(request);
/******/ 			} else {
/******/ 				console.warn("[HMR] unexpected require(" + request + ") from disposed module " + moduleId);
/******/ 				hotCurrentParents = [];
/******/ 			}
/******/ 			return __webpack_require__(request);
/******/ 		};
/******/ 		var ObjectFactory = function ObjectFactory(name) {
/******/ 			return {
/******/ 				configurable: true,
/******/ 				enumerable: true,
/******/ 				get: function() {
/******/ 					return __webpack_require__[name];
/******/ 				},
/******/ 				set: function(value) {
/******/ 					__webpack_require__[name] = value;
/******/ 				}
/******/ 			};
/******/ 		};
/******/ 		for(var name in __webpack_require__) {
/******/ 			if(Object.prototype.hasOwnProperty.call(__webpack_require__, name) && name !== "e") {
/******/ 				Object.defineProperty(fn, name, ObjectFactory(name));
/******/ 			}
/******/ 		}
/******/ 		fn.e = function(chunkId) {
/******/ 			if(hotStatus === "ready")
/******/ 				hotSetStatus("prepare");
/******/ 			hotChunksLoading++;
/******/ 			return __webpack_require__.e(chunkId).then(finishChunkLoading, function(err) {
/******/ 				finishChunkLoading();
/******/ 				throw err;
/******/ 			});
/******/ 	
/******/ 			function finishChunkLoading() {
/******/ 				hotChunksLoading--;
/******/ 				if(hotStatus === "prepare") {
/******/ 					if(!hotWaitingFilesMap[chunkId]) {
/******/ 						hotEnsureUpdateChunk(chunkId);
/******/ 					}
/******/ 					if(hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 						hotUpdateDownloaded();
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
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
/******/ 			_main: hotCurrentChildModule !== moduleId,
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
/******/ 						hot._acceptedDependencies[dep[i]] = callback || function() {};
/******/ 				else
/******/ 					hot._acceptedDependencies[dep] = callback || function() {};
/******/ 			},
/******/ 			decline: function(dep) {
/******/ 				if(typeof dep === "undefined")
/******/ 					hot._selfDeclined = true;
/******/ 				else if(typeof dep === "object")
/******/ 					for(var i = 0; i < dep.length; i++)
/******/ 						hot._declinedDependencies[dep[i]] = true;
/******/ 				else
/******/ 					hot._declinedDependencies[dep] = true;
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
/******/ 		hotCurrentChildModule = undefined;
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
/******/ 	var hotAvailableFilesMap = {};
/******/ 	var hotDeferred;
/******/ 	
/******/ 	// The update info
/******/ 	var hotUpdate, hotUpdateNewHash;
/******/ 	
/******/ 	function toModuleId(id) {
/******/ 		var isNumber = (+id) + "" === id;
/******/ 		return isNumber ? +id : id;
/******/ 	}
/******/ 	
/******/ 	function hotCheck(apply) {
/******/ 		if(hotStatus !== "idle") throw new Error("check() is only allowed in idle status");
/******/ 		hotApplyOnUpdate = apply;
/******/ 		hotSetStatus("check");
/******/ 		return hotDownloadManifest().then(function(update) {
/******/ 			if(!update) {
/******/ 				hotSetStatus("idle");
/******/ 				return null;
/******/ 			}
/******/ 			hotRequestedFilesMap = {};
/******/ 			hotWaitingFilesMap = {};
/******/ 			hotAvailableFilesMap = update.c;
/******/ 			hotUpdateNewHash = update.h;
/******/ 	
/******/ 			hotSetStatus("prepare");
/******/ 			var promise = new Promise(function(resolve, reject) {
/******/ 				hotDeferred = {
/******/ 					resolve: resolve,
/******/ 					reject: reject
/******/ 				};
/******/ 			});
/******/ 			hotUpdate = {};
/******/ 			var chunkId = 0;
/******/ 			{ // eslint-disable-line no-lone-blocks
/******/ 				/*globals chunkId */
/******/ 				hotEnsureUpdateChunk(chunkId);
/******/ 			}
/******/ 			if(hotStatus === "prepare" && hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 				hotUpdateDownloaded();
/******/ 			}
/******/ 			return promise;
/******/ 		});
/******/ 	}
/******/ 	
/******/ 	function hotAddUpdateChunk(chunkId, moreModules) { // eslint-disable-line no-unused-vars
/******/ 		if(!hotAvailableFilesMap[chunkId] || !hotRequestedFilesMap[chunkId])
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
/******/ 		if(!hotAvailableFilesMap[chunkId]) {
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
/******/ 		var deferred = hotDeferred;
/******/ 		hotDeferred = null;
/******/ 		if(!deferred) return;
/******/ 		if(hotApplyOnUpdate) {
/******/ 			hotApply(hotApplyOnUpdate).then(function(result) {
/******/ 				deferred.resolve(result);
/******/ 			}, function(err) {
/******/ 				deferred.reject(err);
/******/ 			});
/******/ 		} else {
/******/ 			var outdatedModules = [];
/******/ 			for(var id in hotUpdate) {
/******/ 				if(Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 					outdatedModules.push(toModuleId(id));
/******/ 				}
/******/ 			}
/******/ 			deferred.resolve(outdatedModules);
/******/ 		}
/******/ 	}
/******/ 	
/******/ 	function hotApply(options) {
/******/ 		if(hotStatus !== "ready") throw new Error("apply() is only allowed in ready status");
/******/ 		options = options || {};
/******/ 	
/******/ 		var cb;
/******/ 		var i;
/******/ 		var j;
/******/ 		var module;
/******/ 		var moduleId;
/******/ 	
/******/ 		function getAffectedStuff(updateModuleId) {
/******/ 			var outdatedModules = [updateModuleId];
/******/ 			var outdatedDependencies = {};
/******/ 	
/******/ 			var queue = outdatedModules.slice().map(function(id) {
/******/ 				return {
/******/ 					chain: [id],
/******/ 					id: id
/******/ 				};
/******/ 			});
/******/ 			while(queue.length > 0) {
/******/ 				var queueItem = queue.pop();
/******/ 				var moduleId = queueItem.id;
/******/ 				var chain = queueItem.chain;
/******/ 				module = installedModules[moduleId];
/******/ 				if(!module || module.hot._selfAccepted)
/******/ 					continue;
/******/ 				if(module.hot._selfDeclined) {
/******/ 					return {
/******/ 						type: "self-declined",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				if(module.hot._main) {
/******/ 					return {
/******/ 						type: "unaccepted",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				for(var i = 0; i < module.parents.length; i++) {
/******/ 					var parentId = module.parents[i];
/******/ 					var parent = installedModules[parentId];
/******/ 					if(!parent) continue;
/******/ 					if(parent.hot._declinedDependencies[moduleId]) {
/******/ 						return {
/******/ 							type: "declined",
/******/ 							chain: chain.concat([parentId]),
/******/ 							moduleId: moduleId,
/******/ 							parentId: parentId
/******/ 						};
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
/******/ 					queue.push({
/******/ 						chain: chain.concat([parentId]),
/******/ 						id: parentId
/******/ 					});
/******/ 				}
/******/ 			}
/******/ 	
/******/ 			return {
/******/ 				type: "accepted",
/******/ 				moduleId: updateModuleId,
/******/ 				outdatedModules: outdatedModules,
/******/ 				outdatedDependencies: outdatedDependencies
/******/ 			};
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
/******/ 	
/******/ 		var warnUnexpectedRequire = function warnUnexpectedRequire() {
/******/ 			console.warn("[HMR] unexpected require(" + result.moduleId + ") to disposed module");
/******/ 		};
/******/ 	
/******/ 		for(var id in hotUpdate) {
/******/ 			if(Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 				moduleId = toModuleId(id);
/******/ 				var result;
/******/ 				if(hotUpdate[id]) {
/******/ 					result = getAffectedStuff(moduleId);
/******/ 				} else {
/******/ 					result = {
/******/ 						type: "disposed",
/******/ 						moduleId: id
/******/ 					};
/******/ 				}
/******/ 				var abortError = false;
/******/ 				var doApply = false;
/******/ 				var doDispose = false;
/******/ 				var chainInfo = "";
/******/ 				if(result.chain) {
/******/ 					chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
/******/ 				}
/******/ 				switch(result.type) {
/******/ 					case "self-declined":
/******/ 						if(options.onDeclined)
/******/ 							options.onDeclined(result);
/******/ 						if(!options.ignoreDeclined)
/******/ 							abortError = new Error("Aborted because of self decline: " + result.moduleId + chainInfo);
/******/ 						break;
/******/ 					case "declined":
/******/ 						if(options.onDeclined)
/******/ 							options.onDeclined(result);
/******/ 						if(!options.ignoreDeclined)
/******/ 							abortError = new Error("Aborted because of declined dependency: " + result.moduleId + " in " + result.parentId + chainInfo);
/******/ 						break;
/******/ 					case "unaccepted":
/******/ 						if(options.onUnaccepted)
/******/ 							options.onUnaccepted(result);
/******/ 						if(!options.ignoreUnaccepted)
/******/ 							abortError = new Error("Aborted because " + moduleId + " is not accepted" + chainInfo);
/******/ 						break;
/******/ 					case "accepted":
/******/ 						if(options.onAccepted)
/******/ 							options.onAccepted(result);
/******/ 						doApply = true;
/******/ 						break;
/******/ 					case "disposed":
/******/ 						if(options.onDisposed)
/******/ 							options.onDisposed(result);
/******/ 						doDispose = true;
/******/ 						break;
/******/ 					default:
/******/ 						throw new Error("Unexception type " + result.type);
/******/ 				}
/******/ 				if(abortError) {
/******/ 					hotSetStatus("abort");
/******/ 					return Promise.reject(abortError);
/******/ 				}
/******/ 				if(doApply) {
/******/ 					appliedUpdate[moduleId] = hotUpdate[moduleId];
/******/ 					addAllToSet(outdatedModules, result.outdatedModules);
/******/ 					for(moduleId in result.outdatedDependencies) {
/******/ 						if(Object.prototype.hasOwnProperty.call(result.outdatedDependencies, moduleId)) {
/******/ 							if(!outdatedDependencies[moduleId])
/******/ 								outdatedDependencies[moduleId] = [];
/******/ 							addAllToSet(outdatedDependencies[moduleId], result.outdatedDependencies[moduleId]);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 				if(doDispose) {
/******/ 					addAllToSet(outdatedModules, [result.moduleId]);
/******/ 					appliedUpdate[moduleId] = warnUnexpectedRequire;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// Store self accepted outdated modules to require them later by the module system
/******/ 		var outdatedSelfAcceptedModules = [];
/******/ 		for(i = 0; i < outdatedModules.length; i++) {
/******/ 			moduleId = outdatedModules[i];
/******/ 			if(installedModules[moduleId] && installedModules[moduleId].hot._selfAccepted)
/******/ 				outdatedSelfAcceptedModules.push({
/******/ 					module: moduleId,
/******/ 					errorHandler: installedModules[moduleId].hot._selfAccepted
/******/ 				});
/******/ 		}
/******/ 	
/******/ 		// Now in "dispose" phase
/******/ 		hotSetStatus("dispose");
/******/ 		Object.keys(hotAvailableFilesMap).forEach(function(chunkId) {
/******/ 			if(hotAvailableFilesMap[chunkId] === false) {
/******/ 				hotDisposeChunk(chunkId);
/******/ 			}
/******/ 		});
/******/ 	
/******/ 		var idx;
/******/ 		var queue = outdatedModules.slice();
/******/ 		while(queue.length > 0) {
/******/ 			moduleId = queue.pop();
/******/ 			module = installedModules[moduleId];
/******/ 			if(!module) continue;
/******/ 	
/******/ 			var data = {};
/******/ 	
/******/ 			// Call dispose handlers
/******/ 			var disposeHandlers = module.hot._disposeHandlers;
/******/ 			for(j = 0; j < disposeHandlers.length; j++) {
/******/ 				cb = disposeHandlers[j];
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
/******/ 			for(j = 0; j < module.children.length; j++) {
/******/ 				var child = installedModules[module.children[j]];
/******/ 				if(!child) continue;
/******/ 				idx = child.parents.indexOf(moduleId);
/******/ 				if(idx >= 0) {
/******/ 					child.parents.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// remove outdated dependency from module children
/******/ 		var dependency;
/******/ 		var moduleOutdatedDependencies;
/******/ 		for(moduleId in outdatedDependencies) {
/******/ 			if(Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)) {
/******/ 				module = installedModules[moduleId];
/******/ 				if(module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					for(j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 						dependency = moduleOutdatedDependencies[j];
/******/ 						idx = module.children.indexOf(dependency);
/******/ 						if(idx >= 0) module.children.splice(idx, 1);
/******/ 					}
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
/******/ 		for(moduleId in appliedUpdate) {
/******/ 			if(Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
/******/ 				modules[moduleId] = appliedUpdate[moduleId];
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// call accept handlers
/******/ 		var error = null;
/******/ 		for(moduleId in outdatedDependencies) {
/******/ 			if(Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)) {
/******/ 				module = installedModules[moduleId];
/******/ 				moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 				var callbacks = [];
/******/ 				for(i = 0; i < moduleOutdatedDependencies.length; i++) {
/******/ 					dependency = moduleOutdatedDependencies[i];
/******/ 					cb = module.hot._acceptedDependencies[dependency];
/******/ 					if(callbacks.indexOf(cb) >= 0) continue;
/******/ 					callbacks.push(cb);
/******/ 				}
/******/ 				for(i = 0; i < callbacks.length; i++) {
/******/ 					cb = callbacks[i];
/******/ 					try {
/******/ 						cb(moduleOutdatedDependencies);
/******/ 					} catch(err) {
/******/ 						if(options.onErrored) {
/******/ 							options.onErrored({
/******/ 								type: "accept-errored",
/******/ 								moduleId: moduleId,
/******/ 								dependencyId: moduleOutdatedDependencies[i],
/******/ 								error: err
/******/ 							});
/******/ 						}
/******/ 						if(!options.ignoreErrored) {
/******/ 							if(!error)
/******/ 								error = err;
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// Load self accepted modules
/******/ 		for(i = 0; i < outdatedSelfAcceptedModules.length; i++) {
/******/ 			var item = outdatedSelfAcceptedModules[i];
/******/ 			moduleId = item.module;
/******/ 			hotCurrentParents = [moduleId];
/******/ 			try {
/******/ 				__webpack_require__(moduleId);
/******/ 			} catch(err) {
/******/ 				if(typeof item.errorHandler === "function") {
/******/ 					try {
/******/ 						item.errorHandler(err);
/******/ 					} catch(err2) {
/******/ 						if(options.onErrored) {
/******/ 							options.onErrored({
/******/ 								type: "self-accept-error-handler-errored",
/******/ 								moduleId: moduleId,
/******/ 								error: err2,
/******/ 								orginalError: err
/******/ 							});
/******/ 						}
/******/ 						if(!options.ignoreErrored) {
/******/ 							if(!error)
/******/ 								error = err2;
/******/ 						}
/******/ 						if(!error)
/******/ 							error = err;
/******/ 					}
/******/ 				} else {
/******/ 					if(options.onErrored) {
/******/ 						options.onErrored({
/******/ 							type: "self-accept-errored",
/******/ 							moduleId: moduleId,
/******/ 							error: err
/******/ 						});
/******/ 					}
/******/ 					if(!options.ignoreErrored) {
/******/ 						if(!error)
/******/ 							error = err;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// handle errors in accept handlers and self accepted module load
/******/ 		if(error) {
/******/ 			hotSetStatus("fail");
/******/ 			return Promise.reject(error);
/******/ 		}
/******/ 	
/******/ 		hotSetStatus("idle");
/******/ 		return new Promise(function(resolve) {
/******/ 			resolve(outdatedModules);
/******/ 		});
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {},
/******/ 			hot: hotCreateModule(moduleId),
/******/ 			parents: (hotCurrentParentsTemp = hotCurrentParents, hotCurrentParents = [], hotCurrentParentsTemp),
/******/ 			children: []
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, hotCreateRequire(moduleId));
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
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
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// __webpack_hash__
/******/ 	__webpack_require__.h = function() { return hotCurrentHash; };
/******/
/******/ 	// Load entry module and return exports
/******/ 	return hotCreateRequire(3)(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RasterToGcode = undefined;

var _canvasGrid = __webpack_require__(2);

var _canvasGrid2 = _interopRequireDefault(_canvasGrid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// RasterToGcode class
let RasterToGcode = class RasterToGcode extends _canvasGrid2.default {
    // Class constructor...
    constructor(settings) {
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
        super(settings);

        // Milling settings
        if (this.milling) {
            if (this.zSafe < this.zSurface) {
                throw new Error('"zSafe" must be greater to "zSurface"');
            }

            this.passes = Math.abs(Math.floor(this.zDepth / this.passDepth));
        }

        // Negative beam size ?
        if (this.toolDiameter <= 0) {
            throw new Error('"toolDiameter" must be positive');
        }

        // Uniforme ppi
        if (!this.ppi.x) {
            this.ppi = { x: this.ppi, y: this.ppi };
        }

        // Calculate PPM = Pixel Per Millimeters
        this.ppm = {
            x: parseFloat((2540 / (this.ppi.x * 100)).toFixed(10)),
            y: parseFloat((2540 / (this.ppi.y * 100)).toFixed(10))

            // Calculate scale ratio
        };this.scaleRatio = {
            x: this.ppm.x / this.toolDiameter,
            y: this.ppm.y / this.toolDiameter

            // State...
        };this.running = false;
        this.gcode = null;
        this.gcodes = null;
        this.currentLine = null;
        this.lastCommands = null;

        // Output size in millimeters
        this.outputSize = { width: 0, height: 0

            // G0 command
        };this.G1 = ['G', 1];
        this.G0 = ['G', this.burnWhite ? 1 : 0];

        // Calculate beam offset
        this.beamOffset = this.toolDiameter * 1000 / 2000;

        // Calculate real beam range
        this.realBeamRange = {
            min: this.beamRange.max / 100 * this.beamPower.min,
            max: this.beamRange.max / 100 * this.beamPower.max

            // Adjuste feed rate to mm/min
        };if (this.rateUnit === 'mm/sec') {
            this.feedRate *= 60;

            if (this.rapidRate) {
                this.rapidRate *= 60;
            }
        }

        // Register user callbacks
        this._registerUserCallbacks(this);
    }

    // Register user callbacks
    _registerUserCallbacks(callbacks) {
        // Register user callbacks
        callbacks.onProgress && this.on('progress', callbacks.onProgress, callbacks.onProgressContext);
        callbacks.onAbort && this.on('abort', callbacks.onAbort, callbacks.onAbortContext);
        callbacks.onDone && this.on('done', callbacks.onDone, callbacks.onDoneContext);
    }

    // Process image
    _processImage() {
        // Call parent method
        super._processImage();

        // Calculate output size
        this.outputSize = {
            width: this.size.width * (this.toolDiameter * 1000) / 1000,
            height: this.size.height * (this.toolDiameter * 1000) / 1000
        };
    }

    // Abort job
    abort() {
        this.running = false;
    }

    // Process image and return gcode string
    run(settings) {
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
        let nonBlocking = this.nonBlocking;

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

    _addHeader() {
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
        let options = ['smoothing', 'trimLine', 'joinPixel', 'burnWhite', 'verboseG', 'diagonal'];

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
    _mapPixelPower(value) {
        let range = this.milling ? { min: 0, max: this.zDepth } : this.realBeamRange;
        return value * (range.max - range.min) / 255 + range.min;
    }

    // Compute and return a command, return null if not changed
    _command(name, value) {
        // If the value argument is an object
        if (typeof value === 'object') {
            // Computed commands line
            let commands = Array.prototype.slice.call(arguments);
            let command,
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
    _getPixelPower(x, y, defaultValue) {
        try {
            // Reverse Y value since canvas as top/left origin
            y = this.size.height - y - 1;

            // Get pixel info
            let pixel = this.getPixel(x, y);

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
    _getPoint(index) {
        // Get the point object from the current line
        let point = this.currentLine[index];

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
    _trimCurrentLine() {
        // Remove white spaces from the left
        let point = this.currentLine[0];

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
    _reduceCurrentLine() {
        // Line too short to be reduced
        if (this.currentLine.length < 3) {
            return this.currentLine.length;
        }

        // Extract all points exept the first one
        let points = this.currentLine.splice(1);

        // Get current power
        let power = this.currentLine[0].p;

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
    _overscanCurrentLine(reversed) {
        // Number of pixels to add on each side
        let pixels = this.overscan / this.ppm.x;

        // Get first/last point
        let firstPoint = this.currentLine[0];
        let lastPoint = this.currentLine[this.currentLine.length - 1];

        // Is last white/colored point ?
        firstPoint.s && (firstPoint.lastWhite = true);
        lastPoint.s && (lastPoint.lastColored = true);

        // Reversed line ?
        reversed ? lastPoint.s = 0 : firstPoint.s = 0;

        // Create left/right points
        let rightPoint = { x: lastPoint.x + pixels, y: lastPoint.y, s: 0, p: 0 };
        let leftPoint = { x: firstPoint.x - pixels, y: firstPoint.y, s: 0, p: 0 };

        if (this.diagonal) {
            leftPoint.y += pixels;
            rightPoint.y -= pixels;
        }

        // Add left/right points to current line
        this.currentLine.unshift(leftPoint);
        this.currentLine.push(rightPoint);
    }

    // Process current line and return an array of GCode text lines
    _processCurrentLine(reversed) {
        if (this.milling) {
            return this._processMillingLine(reversed);
        }

        return this._processLaserLine(reversed);
    }

    // Process current line and return an array of GCode text lines
    _processMillingLine(reversed) {
        var _this = this;

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
        let point,
            index = 0;

        // Init loop vars...
        let command,
            gcode = [];

        let addCommand = function () {
            command = _this._command(...arguments);
            command && gcode.push(command);
        };

        // Get first point
        point = this._getPoint(index);

        let plung = false;
        let Z, zMax;

        let pass = passNum => {
            // Move to start of the line
            addCommand(['G', 0], ['Z', this.zSafe]);
            addCommand(['G', 0], ['X', point.X], ['Y', point.Y]);
            addCommand(['G', 0], ['Z', this.zSurface]);

            // For each point on the line
            while (point) {
                if (point.S) {
                    if (plung) {
                        addCommand(['G', 0], ['Z', this.zSurface]);
                        plung = false;
                    }

                    Z = point.S;
                    zMax = this.passDepth * passNum;

                    // Last pass
                    if (passNum < this.passes) {
                        Z = Math.max(Z, -zMax);
                    }

                    addCommand(['G', 1], ['Z', this.zSurface + Z]);
                    addCommand(['G', 1], ['X', point.X], ['Y', point.Y]);
                } else {
                    if (plung) {
                        addCommand(['G', 1], ['Z', this.zSurface]);
                        plung = false;
                    }

                    addCommand(['G', 0], ['Z', this.zSafe]);
                    addCommand(['G', 0], ['X', point.X], ['Y', point.Y]);
                }

                if (point.lastWhite || point.lastColored) {
                    plung = true;
                }

                // Get next point
                point = this._getPoint(++index);
            }

            // Move to Z safe
            addCommand(['G', 1], ['Z', this.zSurface]);
            addCommand(['G', 0], ['Z', this.zSafe]);
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
    _processLaserLine(reversed) {
        var _this2 = this;

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
        let point,
            index = 0;

        // Init loop vars...
        let command,
            gcode = [];

        let addCommand = function () {
            command = _this2._command(...arguments);
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
    _scanHorizontally(nonBlocking) {
        // Init loop vars
        let x = 0,
            y = 0;
        let s, p, point, gcode;
        let w = this.size.width;
        let h = this.size.height;

        let reversed = false;
        let lastWhite = false;
        let lastColored = false;

        let computeCurrentLine = () => {
            // Reset current line
            this.currentLine = [];

            // Reset point object
            point = null;

            // For each pixel on the line
            for (x = 0; x <= w; x++) {
                // Get pixel power
                s = p = this._getPixelPower(x, y, p);

                // Is last white/colored pixel
                lastWhite = point && !point.p && p;
                lastColored = point && point.p && !p;

                // Pixel color from last one on normal line
                if (!reversed && point) {
                    s = point.p;
                }

                // Create point object
                point = { x: x, y: y, s: s, p: p

                    // Set last white/colored pixel
                };lastWhite && (point.lastWhite = true);
                lastColored && (point.lastColored = true);

                // Add point to current line
                this.currentLine.push(point);
            }
        };

        let percent = 0;
        let lastPercent = 0;

        let processCurrentLine = () => {
            // Process pixels line
            gcode = this._processCurrentLine(reversed);

            // Call progress callback
            percent = Math.round(y / h * 100);

            if (percent > lastPercent) {
                this._onProgress({ gcode, percent });
            }

            lastPercent = percent;

            // Skip empty gcode line
            if (!gcode) {
                return;
            }

            // Toggle line state
            reversed = !reversed;

            // Concat line
            this.gcode.push.apply(this.gcode, gcode);
        };

        let processNextLine = () => {
            // Aborted ?
            if (!this.running) {
                return this._onAbort();
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
                if (this.milling) {
                    this.gcodes.forEach(gcode => {
                        this.gcode.push.apply(this.gcode, gcode);
                    });
                }

                this._onDone({ gcode: this.gcode });
                this.running = false;
            }
        };

        processNextLine();
    }

    // Parse diagonally
    _scanDiagonally(nonBlocking) {
        // Init loop vars
        let x = 0,
            y = 0;
        let s, p, point, gcode;
        let w = this.size.width;
        let h = this.size.height;

        let totalLines = w + h - 1;
        let lineNum = 0;
        let reversed = false;
        let lastWhite = false;
        let lastColored = false;

        let computeCurrentLine = (x, y) => {
            // Reset current line
            this.currentLine = [];

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
                s = p = this._getPixelPower(x, y, p);

                // Is last white/colored pixel
                lastWhite = point && !point.p && p;
                lastColored = point && point.p && !p;

                // Pixel color from last one on normal line
                if (!reversed && point) {
                    s = point.p;
                }

                // Create point object
                point = { x: x, y: y, s: s, p: p

                    // Set last white/colored pixel
                };lastWhite && (point.lastWhite = true);
                lastColored && (point.lastColored = true);

                // Add the new point
                this.currentLine.push(point);

                // Next coords
                x++;
                y--;
            }
        };

        let percent = 0;
        let lastPercent = 0;

        let processCurrentLine = () => {
            // Process pixels line
            gcode = this._processCurrentLine(reversed);

            // Call progress callback
            percent = Math.round(lineNum / totalLines * 100);

            if (percent > lastPercent) {
                this._onProgress({ gcode, percent });
            }

            lastPercent = percent;

            // Skip empty gcode line
            if (!gcode) {
                return;
            }

            // Toggle line state
            reversed = !reversed;

            // Concat line
            this.gcode.push.apply(this.gcode, gcode);
        };

        let processNextLine = () => {
            // Aborted ?
            if (!this.running) {
                return this._onAbort();
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
                this._onDone({ gcode: this.gcode });
                this.running = false;
            }
        };

        processNextLine();
    }

    _onProgress(event) {
        //console.log('progress:', event.percent)
    }

    _onDone(event) {
        //console.log('done:', event.gcode.length)
    }

    _onAbort() {
        //console.log('abort')
    }

    on(event, callback, context) {
        let method = '_on' + event[0].toUpperCase() + event.slice(1);

        if (!this[method] || typeof this[method] !== 'function') {
            throw new Error('Undefined event: ' + event);
        }

        this[method] = event => callback.call(context || this, event);

        return this;
    }

    // Return the bitmap height-map
    getHeightMap(settings) {
        if (this.running) {
            return;
        }

        // Init loop vars
        this.running = true;
        let heightMap = [];

        let x = 0;
        let y = 0;
        let w = this.size.width;
        let h = this.size.height;

        let percent = 0;
        let lastPercent = 0;

        // Defaults settings
        settings = settings || {};

        // Register user callbacks
        this._registerUserCallbacks(settings);

        // Non blocking mode ?
        let nonBlocking = this.nonBlocking;

        if (settings.nonBlocking !== undefined) {
            nonBlocking = settings.nonBlocking;
        }

        let computeCurrentLine = () => {
            // Reset current line
            let pixels = [];

            // For each pixel on the line
            for (x = 0; x < w; x++) {
                pixels.push(this._mapPixelPower(this._getPixelPower(x, y)));
            }

            // Call progress callback
            percent = Math.round(y / h * 100);

            if (percent > lastPercent) {
                //onProgress.call(settings.progressContext || this, { pixels, percent })
                this._onProgress({ pixels, percent });
            }

            lastPercent = percent;

            // Add pixels line
            heightMap.push(pixels);
        };

        let processNextLine = () => {
            // Aborted ?
            if (!this.running) {
                return this._onAbort();
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
                this._onDone({ heightMap });
                this.running = false;
            }
        };

        processNextLine();

        if (!nonBlocking) {
            return heightMap;
        }
    }
};

// Exports

exports.RasterToGcode = RasterToGcode;
const _default = RasterToGcode;
exports.default = _default;
;

var _temp = function () {
    if (typeof __REACT_HOT_LOADER__ === 'undefined') {
        return;
    }

    __REACT_HOT_LOADER__.register(RasterToGcode, 'RasterToGcode', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/raster-to-gcode.js');

    __REACT_HOT_LOADER__.register(_default, 'default', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/raster-to-gcode.js');
}();

;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.canvasFilters = undefined;

var _floydSteinberg = __webpack_require__(4);

var _floydSteinberg2 = _interopRequireDefault(_floydSteinberg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Grayscale algorithms
const grayscaleAlgorithms = ['none', 'average', 'desaturation', 'decomposition-min', 'decomposition-max', 'luma', 'luma-601', 'luma-709', 'luma-240', 'red-chanel', 'green-chanel', 'blue-chanel'];

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
    let gray;
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

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
        invertColor: false, // Invert color...
        dithering: false
    }, settings || {});

    // Get canvas 2d context
    let context = canvas.getContext('2d');

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
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    let contrastFactor, brightnessOffset, gammaCorrection, shadesOfGrayFactor;

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
    for (let i = 0, il = data.length; i < il; i += 4) {
        // Apply filters
        invertColor(data, i, settings.invertColor);
        brightness(data, i, brightnessOffset);
        contrast(data, i, contrastFactor);
        gamma(data, i, gammaCorrection);
        grayscale(data, i, settings.grayscale, shadesOfGrayFactor);
    }

    if (settings.dithering) {
        imageData = (0, _floydSteinberg2.default)(imageData);
    }

    // Write new image data on the context
    context.putImageData(imageData, 0, 0);
}

// Exports
exports.canvasFilters = canvasFilters;
const _default = canvasFilters;
exports.default = _default;
;

var _temp = function () {
    if (typeof __REACT_HOT_LOADER__ === 'undefined') {
        return;
    }

    __REACT_HOT_LOADER__.register(grayscaleAlgorithms, 'grayscaleAlgorithms', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');

    __REACT_HOT_LOADER__.register(color, 'color', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');

    __REACT_HOT_LOADER__.register(invertColor, 'invertColor', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');

    __REACT_HOT_LOADER__.register(brightness, 'brightness', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');

    __REACT_HOT_LOADER__.register(contrast, 'contrast', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');

    __REACT_HOT_LOADER__.register(gamma, 'gamma', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');

    __REACT_HOT_LOADER__.register(grayscale, 'grayscale', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');

    __REACT_HOT_LOADER__.register(canvasFilters, 'canvasFilters', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');

    __REACT_HOT_LOADER__.register(_default, 'default', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-filters.js');
}();

;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CanvasGrid = undefined;

var _canvasFilters = __webpack_require__(1);

var _canvasFilters2 = _interopRequireDefault(_canvasFilters);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// CanvasGrid class
let CanvasGrid = class CanvasGrid {
    // Class constructor...
    constructor(settings) {
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
    load(input) {
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
    _loadImage(src, reject, resolve) {
        // Create Image object
        let image = new Image();

        // Register for load and error events
        image.onload = event => {
            this.loadFromImage(image).then(resolve).catch(reject);
        };

        image.onerror = event => {
            reject(new Error('An error occurred while loading the image : ' + src));
        };

        // Load the image from File url
        image.src = src;
    }

    // Load from File object
    loadFromFile(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (!(input instanceof File)) {
                reject(new Error('Input param must be a File object.'));
            }

            // Set input file
            this.file = input;

            // Load image
            this._loadImage(URL.createObjectURL(input), reject, resolve);
        });
    }

    // Load from URL object or string
    loadFromURL(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (!(input instanceof URL) && typeof input !== 'string') {
                reject(new Error('Input param must be a URL string or object.'));
            }

            // Create url object
            let url = input instanceof URL ? input : new URL(input);

            // Set url
            this.url = url;

            // Load image
            this._loadImage(url, reject, resolve);
        });
    }

    // Load from Image object
    loadFromImage(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (!(input instanceof Image)) {
                reject(new Error('Input param must be a Image object.'));
            }

            // Set input image
            this.image = input;

            // Process image
            this._processImage();

            // Resolve the promise
            resolve(this);
        });
    }

    _processImage() {
        // Reset canvas grid
        this.canvas = [];
        this.pixels = [];

        // Calculate grid size
        let width = Math.round(this.image.width * this.scaleRatio.x);
        let height = Math.round(this.image.height * this.scaleRatio.y);
        let cols = Math.ceil(width / this.cellSize);
        let rows = Math.ceil(height / this.cellSize);

        this.size = { width, height, cols, rows

            // Create canvas grid
        };let line = null;
        let canvas = null;
        let pixels = null;
        let context = null;

        let x = null; // cols
        let y = null; // rows
        let sx = null; // scaled cols
        let sy = null; // scaled rows
        let sw = null; // scaled width
        let sh = null; // scaled height

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
                (0, _canvasFilters2.default)(canvas, this.filters);

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

    getPixel(x, y) {
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
        let col = parseInt(x / this.cellSize);
        let row = parseInt(y / this.cellSize);

        // Adjuste x/y values relative to canvas origin
        col && (x -= this.cellSize * col);
        row && (y -= this.cellSize * row);

        // Get pixel data
        let cellSize = this.cellSize;

        if (this.size.width < cellSize) {
            cellSize = this.size.width;
        } else if (this.size.width < cellSize * (col + 1)) {
            cellSize = this.size.width % cellSize;
        }

        let i = y * (cellSize * 4) + x * 4;
        let pixels = this.pixels[row][col];
        let pixelData = pixels.slice(i, i + 4);

        return {
            color: { r: pixelData[0], g: pixelData[1], b: pixelData[2], a: pixelData[3] },
            gray: (pixelData[0] + pixelData[1] + pixelData[2]) / 3,
            grid: { col, row },
            coords: { x, y }
        };
    }
};

// Exports

exports.CanvasGrid = CanvasGrid;
const _default = CanvasGrid;
exports.default = _default;
;

var _temp = function () {
    if (typeof __REACT_HOT_LOADER__ === 'undefined') {
        return;
    }

    __REACT_HOT_LOADER__.register(CanvasGrid, 'CanvasGrid', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-grid.js');

    __REACT_HOT_LOADER__.register(_default, 'default', '/Users/jorgerobles/repos/LaserWeb4/src/lib/lw.raster2gcode/canvas-grid.js');
}();

;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _rasterToGcode = __webpack_require__(0);

// On messsage received
self.onmessage = function (event) {
    if (event.data.cmd === 'start') {
        start(event.data);
    }
};

// Start job
function start(data) {

    // Create RasterToGcode object
    var rasterToGcode = new _rasterToGcode.RasterToGcode(data.settings);
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
;

var _temp = function () {
    if (typeof __REACT_HOT_LOADER__ === 'undefined') {
        return;
    }

    __REACT_HOT_LOADER__.register(start, 'start', '/Users/jorgerobles/repos/LaserWeb4/src/lib/workers/cam-raster.js');
}();

;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

/*
 * floyd-steinberg
 *
 * Using 2D error diffusion formula published by Robert Floyd and Louis Steinberg in 1976
 *
 * Javascript implementation of Floyd-Steinberg algorithm thanks to Forrest Oliphant @forresto and @meemoo 
 * via iFramework https://github.com/meemoo/iframework/blob/master/src/nodes/image-monochrome-worker.js
 *
 * Accepts an object that complies with the HTML5 canvas imageData spec https://developer.mozilla.org/en-US/docs/Web/API/ImageData
 * In particular, it makes use of the width, height, and data properties
 *
 * License: MIT
*/

module.exports = floyd_steinberg;

function floyd_steinberg(image) {
  var imageData = image.data;
  var imageDataLength = imageData.length;
  var w = image.width;
  var lumR = [],
      lumG = [],
      lumB = [];

  var newPixel, err;

  for (var i = 0; i < 256; i++) {
    lumR[i] = i * 0.299;
    lumG[i] = i * 0.587;
    lumB[i] = i * 0.110;
  }

  // Greyscale luminance (sets r pixels to luminance of rgb)
  for (var i = 0; i <= imageDataLength; i += 4) {
    imageData[i] = Math.floor(lumR[imageData[i]] + lumG[imageData[i+1]] + lumB[imageData[i+2]]);
  }

  for (var currentPixel = 0; currentPixel <= imageDataLength; currentPixel += 4) {
    // threshold for determining current pixel's conversion to a black or white pixel
    newPixel = imageData[currentPixel] < 150 ? 0 : 255;
    err = Math.floor((imageData[currentPixel] - newPixel) / 23);
    imageData[currentPixel] = newPixel;
    imageData[currentPixel + 4         ] += err * 7;
    imageData[currentPixel + 4 * w - 4 ] += err * 3;
    imageData[currentPixel + 4 * w     ] += err * 5;
    imageData[currentPixel + 4 * w + 4 ] += err * 1;
    // Set g and b pixels equal to r (effectively greyscales the image fully)
    imageData[currentPixel + 1] = imageData[currentPixel + 2] = imageData[currentPixel];
  }

  return image;
}

/***/ })
/******/ ]);
//# sourceMappingURL=511861a0ff06e28ca886.worker.js.map