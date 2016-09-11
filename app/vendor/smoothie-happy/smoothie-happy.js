/**
* Smoothie-Happy - A SmoothieBoard network communication API.
* @author   Sébastien Mischler (skarab) <sebastien@onlfait.ch>
* @see      {@link https://github.com/lautr3k/Smoothie-Happy}
* @build    461d6acadbb43da1f14554634d77e958
* @date     Sun, 11 Sep 2016 06:40:55 +0000
* @version  0.2.0-dev
* @license  MIT
* @namespace
*/
var sh = sh || {};

(function () {
    'use strict';

    /**
    * @default
    * @readonly
    * @property {String} version API version.
    */
    sh.version = '0.2.0-dev';

    /**
    * @default
    * @readonly
    * @property {String} build API build hash.
    */
    sh.build = '461d6acadbb43da1f14554634d77e958';

    /**
    * @default
    * @readonly
    * @property {String} id API id.
    */
    sh.id = 'smoothie-happy';

    /**
    * @default
    * @readonly
    * @property {String} name API name.
    */
    sh.name = 'Smoothie-Happy';

    /**
    * @default
    * @readonly
    * @property {String} description API description.
    */
    sh.description = 'A SmoothieBoard network communication API';

    /**
    * @default
    * @readonly
    * @property {String} gitURL API repository url.
    */
    sh.gitURL = 'git://github.com/lautr3k/Smoothie-Happy.git';

    /**
    * Network module.
    * @namespace
    */
    sh.network = {};

    /**
    * XMLHttpRequest response abstraction class.
    *
    * @class
    * @param  {XMLHttpRequest}  xhr   An `XMLHttpRequest` instance.
    */
    sh.network.Response = function(xhr) {
        // instance factory
        if (! (this instanceof sh.network.Response)) {
            return new sh.network.Response(xhr);
        }

        /** @property  {Integer}  -  Response status code. */
        this.code = xhr.status;

        /** @property  {String}  -  Respons status text. */
        this.message = xhr.statusText;

        /** @property  {String}  -  Response type. */
        this.type = xhr.responseType;

        /** @property  {String}  -  Response url. */
        this.url = xhr.responseURL;

        /** @property  {String}  -  Response XML. */
        this.xml = xhr.responseXML;

        /** @property  {String}  -  Response text. */
        this.text = xhr.responseText;

        /** @property  {Mixed}  -  Raw response. */
        this.raw = xhr.response;
    };

    /**
    * Custom request event.
    *
    * @class
    * @param  {String}              name      Event name, possible values is `[upload.]load`, `[upload.]timeout`, `[upload.]abort` or `[upload.]error`.
    * @param  {sh.network.Request}  request   Original `sh.network.Request` instance.
    */
    sh.network.RequestEvent = function(name, request) {
        // instance factory
        if (! (this instanceof sh.network.RequestEvent)) {
            return new sh.network.RequestEvent(name, request);
        }

        /** @property  {String}  -  Possible values is `[upload.]load`, `[upload.]timeout`, `[upload.]abort` or `[upload.]error`. */
        this.name = name;

        /** @property  {sh.network.Request}  -  Request instance. */
        this.request = request;

        /** @property  {sh.network.Response}  -  Response instance. */
        this.response = sh.network.Response(request._xhr);
    };

    /**
    * Custom progress event.
    *
    * @class
    * @extends  sh.network.RequestEvent
    * @param    {String}              name     Event name, possible values is `progress` or `upload.progress`.
    * @param    {sh.network.Request}  request  Original `sh.network.Request`.
    * @param    {ProgressEvent}       source   Original `ProgressEvent`.
    */
    sh.network.ProgressEvent = function(name, request, source) {
        // instance factory
        if (! (this instanceof sh.network.ProgressEvent)) {
            return new sh.network.ProgressEvent(name, request, source);
        }

        // call parent constructor
        sh.network.RequestEvent.call(this, name, request);

        /** @property  {String}  -  Possible values is `progress` or `upload.progress`. */
        this.name = name;

        /** @property  {ProgressEvent}  -  `ProgressEvent` instance. */
        this.source = source;

        /** @property  {Boolean}  -  If computable length. */
        this.computable = source.lengthComputable;

        /** @property  {Integer}  -  Total bytes. */
        this.total = this.computable ? source.total : null;

        /** @property  {Integer}  -  Loaded bytes. */
        this.loaded = this.computable ? source.loaded : null;

        /** @property  {Integer}  -  Loaded bytes as percent. */
        this.percent = this.computable ? (this.loaded / this.total) * 100 : null;
    };

    // extends sh.network.RequestEvent
    sh.network.ProgressEvent.prototype = Object.create(sh.network.RequestEvent.prototype);
    sh.network.ProgressEvent.prototype.constructor = sh.network.ProgressEvent;

    /**
    * `XMLHttpRequest` wrapper with `Promise` logic.
    *
    * @class
    * @param   {Object}   settings                    Request settings.
    * @param   {String}   settings.url                URL with protocol.
    * @param   {String}   [settings.method  = 'GET']  'GET', 'POST', 'DELETE', ...
    * @param   {Mixed}    [settings.data    = null]   Data to send with the request.
    * @param   {Object}   [settings.headers = null]   Headers to send with the request.
    * @param   {Integer}  [settings.timeout = 5000]   Timeout for this request in milliseconds.
    * @param   {Object}   [settings.xhr     = null]   An `XMLHttpRequest` instance or an collection of `XMLHttpRequest` properties/methods to overwrite.
    *
    * @see Please read {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise|this} and {@link https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html|that} to learn more about promises.
    *
    * @example
    * ### Single request
    * ```
    * sh.network.Request({
    *      url: 'index.html'
    *  })
    *  .onProgress(function(event) {
    *      // notify progression
    *      console.info(event.request._url, '>> progress >>',  event.percent, '%');
    *  })
    *  .then(function(event) {
    *      // index.html is loaded
    *      console.info(event.request._url, '>> loaded >>', event.response);
    *
    *      // return result for final then
    *      return { event: event, error: false };
    *  })
    *  .catch(function(event) {
    *      // error loading index.html
    *      console.warn(event.request._url, '>> error >>', event.response);
    *
    *      // return error for final then
    *      return { event: event, error: true };
    *  })
    *  .then(function(result) {
    *      // finaly ...
    *      var event    = result.event;
    *      var logType  = result.error ? 'error' : 'info';
    *      var logLabel = result.error ? 'error' : 'loaded';
    *
    *      console[logType](event.request._url, '>>', logLabel, '>>', event.response);
    *  });
    * ```
    *
    * @example
    * ### Chaining requests
    * ```
    * sh.network.Request({
    *      url: 'index.html'
    *  })
    *  .onProgress(function(event) {
    *      // notify progression
    *      console.info(event.request._url, '>> progress >>',  event.percent, '%');
    *  })
    *  .then(function(event) {
    *      // index.html is loaded
    *      console.info(event.request._url, '>> loaded >>', event.response);
    *
    *      // return another request
    *      return sh.network.Request({
    *          url: 'not_found.html'
    *      })
    *      .onProgress(function(event) {
    *          // notify progression
    *          console.info(event.request._url, '>> progress >>',  event.percent, '%');
    *      });
    *  })
    *  .then(function(event) {
    *      // not_found.html is loaded
    *      console.info(event.request._url, '>> loaded >>', event.response);
    *
    *      // return result for final then
    *      return { event: event, error: false };
    *  })
    *  .catch(function(event) {
    *      // error loading index.html or not_found.html
    *      console.warn(event.request._url, '>> error >>', event.response);
    *
    *      // return error for final then
    *      return { event: event, error: true };
    *  })
    *  .then(function(result) {
    *      // finaly ...
    *      var event    = result.event;
    *      var logType  = result.error ? 'error' : 'info';
    *      var logLabel = result.error ? 'error' : 'loaded';
    *
    *      console[logType](event.request._url, '>>', logLabel, '>>', event.response);
    *  });
    * ```
    */
    sh.network.Request = function(settings) {
        // instance factory
        if (! (this instanceof sh.network.Request)) {
            return new sh.network.Request(settings);
        }

        // default settings
        var settings = settings || {};

        /**
        * @protected
        * @property  {String}  -  Request url.
        * @default   ''
        */
        this._url = (settings.url || '').trim();

        /**
        * @protected
        * @property  {String}  -  Request method.
        * @default   'GET'
        */
        this._method = (settings.method  || 'GET').trim().toUpperCase();

        /**
        * @protected
        * @property  {Mixed}  -  Request data.
        * @default   null
        */
        this._data = settings.data || null;

        // append data to url if not a POST method
        if (this._method !== 'POST' && this._data) {
            // stringify data object
            if (typeof this._data === 'object') {
                this._data = Object.keys(this._data).map(function(key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(this._data[key]);
                }).join('&');
            }

            // trim data string
            this._data = this._data.trim();

            // remove the first char if it is an '?'
            if (this._data.indexOf('?') === 0) {
                this._data = this._data.substr(1);
            }

            // append '?' or '&' to the uri if not already set
            this._url += (this._url.indexOf('?') === -1) ? '?' : '&';

            // append data to uri
            this._url += this._data;

            // reset data
            this._data = null;
        }

        /**
        * @protected
        * @property  {Object}  -  Request headers.
        * @default   {}
        */
        this._headers = settings.headers || {};

        /**
        * @protected
        * @property  {Integer}  -  Request timeout in milliseconds.
        * @default   5000
        */
        this._timeout = settings.timeout === undefined ? 5000 : settings.timeout;

        /**
        * @protected
        * @property  {XMLHttpRequest}  -  XMLHttpRequest instance.
        */
        this._xhr = settings.xhr || null;

        // create XMLHttpRequest instance
        var xhrOptions = {};

        if (! (this._xhr instanceof XMLHttpRequest)) {
            // maybe properties/methods to overwrite
            if (this._xhr && typeof this._xhr === 'object') {
                xhrOptions = this._xhr;
            }

            // create http request object
            this._xhr = new XMLHttpRequest();
        }

        // overwrite properties/methods
        for (var option in xhrOptions) {
            if (option === 'upload') {
                for (var event in xhrOptions[option]) {
                    if (this._xhr.upload[event] !== undefined) {
                        this._xhr.upload[event] = xhrOptions[option][event];
                    }
                }
            }
            else if (this._xhr[option] !== undefined) {
                this._xhr[option] = xhrOptions[option];
            }
        }

        /**
        * @protected
        * @property  {Promise}  -  Promise instance.
        */
        this._promise = this._execute();
    };

    /**
    * Execute the request and return a Promise.
    *
    * @protected
    * @method
    * @return {Promise}
    */
    sh.network.Request.prototype._execute = function() {
        // self alias
        var self = this;

        // create and return the Promise
        return new Promise(function(resolve, reject) {
            // open the request (async)
            self._xhr.open(self._method, self._url, true);

            // force timeout
            self._xhr.timeout = self._timeout;

            // on load
            self._xhr.onload = function () {
                if (self._xhr.status >= 200 && self._xhr.status < 300) {
                    resolve(sh.network.RequestEvent('load', self));
                }
                else {
                    reject(sh.network.RequestEvent('load', self));
                }
            };

            // on error
            self._xhr.onerror = function () {
                reject(sh.network.RequestEvent('error', self));
            };

            // on timeout
            self._xhr.ontimeout = function () {
                reject(sh.network.RequestEvent('timeout', self));
            };

            // on abort
            self._xhr.onabort = function () {
                reject(sh.network.RequestEvent('abort', self));
            };

            // on upload.load
            // self._xhr.upload.onload = function () {
            //     if (self._xhr.status >= 200 && self._xhr.status < 300) {
            //         resolve(sh.network.RequestEvent('upload.load', self));
            //     }
            //     else {
            //         reject(sh.network.RequestEvent('upload.load', self));
            //     }
            // };

            // on upload.error
            self._xhr.upload.onerror = function () {
                reject(sh.network.RequestEvent('upload.error', self));
            };

            // on upload.timeout
            self._xhr.upload.ontimeout = function () {
                reject(sh.network.RequestEvent('upload.timeout', self));
            };

            // on upload.abort
            self._xhr.upload.onabort = function () {
                reject(sh.network.RequestEvent('upload.abort', self));
            };

            // set request headers
            for (var header in self._headers) {
                self._xhr.setRequestHeader(header, self._headers[key]);
            }

            // send the request
            self._xhr.send(self._method === 'POST' ? self._data : null);
        });
    };

    /**
    * Register progress event handler.
    *
    * @method
    * @param   {Function}  progressHandler  An function receiving an {@link sh.network.ProgressEvent} as first parameter.
    * @return  {self}
    */
    sh.network.Request.prototype.onProgress = function(progressHandler) {
        // self alias
        var self = this;

        // register progress event
        this._xhr.onprogress = function(event) {
            if (event.lengthComputable) {
                progressHandler.call(this, sh.network.ProgressEvent('progress', self, event));
            }
        };

        // return the promise
        return this;
    };

    /**
    * Register upload progress event handler.
    *
    * @method
    * @param   {Function}  progressHandler  An function receiving an {@link sh.network.ProgressEvent} as first parameter.
    * @return  {self}
    */
    sh.network.Request.prototype.onUploadProgress = function(progressHandler) {
        // self alias
        var self = this;

        // register upload progress event
        this._xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                progressHandler.call(this, sh.network.ProgressEvent('upload.progress', self, event));
            }
        };

        // return the promise
        return this;
    };

    /**
    * Appends fulfillment and rejection handlers to the promise.
    *
    * @method
    * @param   {Function}  onFulfilled  Fulfillment callback.
    * @param   {Function}  onRejected   Rejection callback.
    * @return  {Promise}
    */
    sh.network.Request.prototype.then = function(onFulfilled, onRejected) {
        return this._promise.then(onFulfilled, onRejected);
    };

    /**
    * Appends a rejection handler callback to the promise.
    *
    * @method
    * @param   {Function}  onRejected  Rejection callback.
    * @return  {Promise}
    */
    sh.network.Request.prototype.catch = function(onRejected) {
        return this._promise.catch(onRejected);
    };

    /**
    * Make and return an GET `sh.network.Request`.
    *
    * @class
    * @extends  {sh.network.Request}
    * @param    {Object}   settings                    Request settings.
    * @param    {String}   settings.url                URL with protocol.
    * @param    {Mixed}    [settings.data    = null]   Data to send with the request.
    * @param    {Object}   [settings.headers = null]   Headers to send with the request.
    * @param    {Integer}  [settings.timeout = 5000]   Timeout for this request in milliseconds.
    * @param    {Object}   [settings.xhr     = null]   An `XMLHttpRequest` instance or an collection of `XMLHttpRequest` properties/methods to overwrite.
    *
    * @see Please see {@link sh.network.Request} for uses examples.
    */
    sh.network.Get = function(settings) {
        // instance factory
        if (! (this instanceof sh.network.Get)) {
            return new sh.network.Get(settings);
        }

        settings = settings || {};
        settings.method = 'GET';
        return sh.network.Request.call(this, settings);
    };

    // extends sh.network.Request
    sh.network.Get.prototype = Object.create(sh.network.Request.prototype);
    sh.network.Get.prototype.constructor = sh.network.Get;

    /**
    * Make and return an POST `sh.network.Request`.
    *
    * @class
    * @extends  {sh.network.Request}
    * @param    {Object}   settings                    Request settings.
    * @param    {String}   settings.url                URL with protocol.
    * @param    {Mixed}    [settings.data    = null]   Data to send with the request.
    * @param    {Object}   [settings.headers = null]   Headers to send with the request.
    * @param    {Integer}  [settings.timeout = 5000]   Timeout for this request in milliseconds.
    * @param    {Object}   [settings.xhr     = null]   An `XMLHttpRequest` instance or an collection of `XMLHttpRequest` properties/methods to overwrite.
    *
    * @see Please see {@link sh.network.Request} for uses examples.
    */
    sh.network.Post = function(settings) {
        // instance factory
        if (! (this instanceof sh.network.Post)) {
            return new sh.network.Post(settings);
        }

        settings = settings || {};
        settings.method = 'POST';
        return sh.network.Request.call(this, settings);
    };

    // extends sh.network.Request
    sh.network.Post.prototype = Object.create(sh.network.Request.prototype);
    sh.network.Post.prototype.constructor = sh.network.Post;

    /**
    * Custom board event.
    *
    * @class
    * @param  {String}                   name   Event name.
    * @param  {sh.Board}                 board  Board instance.
    * @param  {sh.network.RequestEvent}  event  Original `sh.network.RequestEvent` instance.
    * @param  {Object|null}              data   Event data (depending on the command).
    */
    sh.BoardEvent = function(name, board, event, data) {
        // instance factory
        if (! (this instanceof sh.BoardEvent)) {
            return new sh.BoardEvent(name, board, event, data);
        }

        /** @property  {String}  -  Event name. */
        this.name = name;

        /** @property  {sh.Board}  -  Board instance. */
        this.board = board;

        /** @property  {Object|null}  -  Event data (depending on the command). */
        this.data = data || null;

        /** @property  {sh.network.RequestEvent}  -  Original `sh.network.RequestEvent` instance. */
        this.originalEvent = event;
    };

    /**
    * Board class.
    *
    * @class
    * @param  {String|Object}  address|settings          Board ip or hostname.
    * @param  {Object}         [settings]                Board settings.
    * @param  {String}         [settings.address]        Board ip or hostname.
    * @param  {Integer}        [settings.timeout]        Response timeout in milliseconds.
    * @param  {Integer}        [settings.watchInterval]  Watch interval in milliseconds.
    * @param  {Integer}        [settings.watchTimeout]   Watch timeout in milliseconds.
    *
    * @example
    * ### Board class usage
    * ```
    * // create the board instance
    *  var board = sh.Board('192.168.1.102');
    *
    *  // get board version (raw)
    *  board.Command('version').then(function(event) {
    *      console.info('board:', event.board);
    *      console.info('version:', event.originalEvent.response.raw);
    *  })
    *  .catch(function(event) {
    *      console.error('version:', event.name, event);
    *  });
    *
    *  // get board version (parsed)
    *  board.Version().then(function(event) {
    *      console.info('board:', event.board);
    *      console.info('info:', event.data);
    *  })
    *  .catch(function(event) {
    *      console.error('version:', event.name, event);
    *  });
    * ```
    *
    * @example
    * ### Board connection
    * ```
    * create the board instance
    * var board = sh.Board('192.168.1.102');
    *
    *  register some callbacks
    * board.on('connect', function(event) {
    *     console.info('on.connect:', event.board);
    * })
    * .on('disconnect', function(event) {
    *     console.info('on.disconnect:', event.board);
    * })
    * .on('reconnect', function(event) {
    *     console.info('on.reconnect:', event.board);
    * })
    * .on('redisconnect', function(event) {
    *     console.info('on.redisconnect:', event.board);
    * })
    * .on('reconnectAttempt', function(event) {
    *     console.info('on.reconnectAttempt:', event.data.attempts, event.board);
    *     // disconnect the board after 5 attempts
    *     if (this.reconnectAttempts == 2) {
    *         this.Disconnect().then(function(event) {
    *             console.info('disconnect:', event.board);
    *         })
    *         .catch(function(event) {
    *             console.error('disconnect:', event.name, event);
    *         });
    *     }
    * })
    * .on('watch', function(event) {
    *     console.info('on.watch:', event.board);
    * })
    * .on('response', function(event) {
    *     console.info('on.response:', event.board);
    * })
    * .on('error', function(event) {
    *     console.error('on.error:', event.board);
    * });
    *
    *  connect the board
    * board.Connect().then(function(event) {
    *     console.info('connect:', event.board);
    * })
    * .catch(function(event) {
    *     console.error('connect:', event.name, event);
    * });
    *
    *  // disconnect the board after 15 seconds
    *  setTimeout(function() {
    *
    *      board.Disconnect().then(function(event) {
    *          console.info('disconnect:', event.board);
    *      })
    *      .catch(function(event) {
    *          console.error('disconnect:', event.name, event);
    *      });
    *
    *  }, 15000); // 15 sec.
    * ```
    */
    sh.Board = function(address, settings) {
        // defaults settings
        settings = settings || {};

        // settings provided on first argument
        if (typeof address === 'object') {
            settings = address;
            address  = settings.address;
        }

        // invalid address type
        if (typeof address !== 'string') {
            throw new Error('Address must be a string.');
        }

        // Trim whitespaces
        address = address.trim();

        // address not provided or too short
        if (!address || address.length <= 4) {
            throw new Error('Address too short [min.: 4].');
        }

        // instance factory
        if (! (this instanceof sh.Board)) {
            return new sh.Board(address, settings);
        }

        /**
        * @readonly
        * @property  {String}  address  Board ip or hostname.
        */
        this.address = address;

        /**
        * @readonly
        * @property  {String}  id  Board ip or hostname as DOM id.
        */
        this.id = address.replace(/[^0-9a-z_\-]+/gi, '-');

        /**
        * @readonly
        * @property  {Integer}  timeout  Default response timeout in milliseconds.
        * @default   5000
        */
        this.timeout = settings.timeout !== undefined ? settings.timeout : 5000;

        /**
        * @readonly
        * @property  {Object|null}  info         Board info parsed from version command.
        * @property  {String}       info.branch  Firmware branch.
        * @property  {String}       info.hash    Firmware hash.
        * @property  {String}       info.date    Firmware date.
        * @property  {String}       info.mcu     Board MCU.
        * @property  {String}       info.clock   Board clock freqency.
        * @default   null
        */
        this.info = null;

        /**
        * @readonly
        * @property  {Boolean}  online  Is board online.
        * @default   false
        */
        this.online = false;

        /**
        * @readonly
        * @property  {Integer}  lastOnlineTime Last time the board was seen online.
        * @default   null
        */
        this.lastOnlineTime = null;

        /**
        * @readonly
        * @property  {Boolean}  online  Is board connected.
        * @default   false
        */
        this.connected = false;

        /**
        * @readonly
        * @property  {Integer}  watchTimeoutId Connection timer id.
        * @default   null
        */
        this.watchTimeoutId = null;

        /**
        * @readonly
        * @property  {Integer}  watchInterval Connection timer interval.
        * @default   5000
        */
        this.watchInterval = settings.watchInterval || 5000;

        /**
        * @readonly
        * @property  {Integer}  watchInterval Connection timeout interval.
        * @default   5000
        */
        this.watchTimeout = settings.watchTimeout || 2000;

        /**
        * @readonly
        * @property  {Integer}  reconnectAttempts Number of reconnection attempts.
        * @default   0
        */
        this.reconnectAttempts = 0;

        /**
        * @readonly
        * @property  {Integer}  connections Number of successful connections from the first connection.
        * @default   0
        */
        this.connections = 0;

        /**
        * @readonly
        * @property  {Integer}  reconnections Number of successful reconnections from the last connection.
        * @default   0
        */
        this.reconnections = 0;

        /**
        * @protected
        * @property  {Object}  -  Registred callbacks.
        */
        this._on = {};
    };

    // -------------------------------------------------------------------------

    /**
    * On request response.
    *
    * @callback sh.Board~onResponse
    * @param  {sh.BoardEvent}  event  Board event.
    */

    /**
    * On request error.
    *
    * @callback sh.Board~onError
    * @param  {sh.BoardEvent}  event  Board event.
    */

    /**
    * On board connect.
    *
    * @callback sh.Board~onConnect
    * @param  {sh.BoardEvent}  event  Board event.
    */

    /**
    * On board disconnect.
    *
    * @callback sh.Board~onDisconnect
    * @param  {sh.BoardEvent}  event  Board event.
    */

    /**
    * On board reconnect.
    *
    * @callback sh.Board~onReconnect
    * @param  {sh.BoardEvent}  event  Board event.
    */

    /**
    * On board redisconnect.
    *
    * @callback sh.Board~onRedisconnect
    * @param  {sh.BoardEvent}  event  Board event.
    */

    /**
    * On watch board.
    *
    * @callback sh.Board~onWatch
    * @param  {sh.BoardEvent}  event  Board event.
    */

    // -------------------------------------------------------------------------

    /**
    * Register an event callback.
    *
    * @method
    * @param  {String}    event     Event name.
    * @param  {Function}  callback  Function to call on event is fired.
    * @return {self}
    *
    * @callbacks
    * | Name | Type | Description |
    * | ---- | ---- | ----------- |
    * | response      | {@link sh.Board~onResponse|onResponse}         | Called on request response.   |
    * | error         | {@link sh.Board~onError|onError}               | Called on request error.      |
    * | connect       | {@link sh.Board~onConnect|onConnect}           | Called on board connect.      |
    * | disconnect    | {@link sh.Board~onDisconnect|onDisconnect}     | Called on board disconnect.   |
    * | reconnect     | {@link sh.Board~onReconnect|onReconnect}       | Called on board reconnect.    |
    * | redisconnect  | {@link sh.Board~onRedisconnect|onRedisconnect} | Called on board redisconnect. |
    * | watch         | {@link sh.Board~onWatch|onWatch}               | Called on watch board.        |
    */
    sh.Board.prototype.on = function(event, callback) {
        // register callback
        this._on[event] = callback;

        // chainable
        return this;
    };

    /**
    * Trigger an user defined callback with the scope of this class.
    *
    * @method
    * @protected
    * @param  {String}  name   Event name.
    * @param  {String}  event  Original event.
    * @param  {Mixed}   data   Event data.
    * @return {sh.BoardEvent}
    */
    sh.Board.prototype._trigger = function(name, event, data) {
        // to board event
        event = sh.BoardEvent(name, this, event, data);

        // if defined, call user callback with the scope of this instance
        this._on[name] && this._on[name].call(this, event);

        // return the board event
        return event;
    };

    // -------------------------------------------------------------------------

    /**
    * Send a command to the board.
    *
    * @method
    * @param   {String}           command  Command to send.
    * @param   {Integer}          timeout  Response timeout.
    * @return  {sh.network.Post}  Promise
    */
    sh.Board.prototype.Command = function(command, timeout) {
        // default response timeout
        if (timeout === undefined) {
            timeout = this.timeout;
        }

        // self alias
        var self = this;

        // return Post request (promise)
        return sh.network.Post({
            url    : 'http://' + this.address + '/command',
            data   : command.trim() + '\n',
            timeout: timeout
        })
        .then(function(event) {
            // set online flag
            self.online = true;

            // set last online time
            self.lastOnlineTime = Date.now();

            // trigger event
            var board_event = self._trigger('response', event);

            // resolve the promise
            return Promise.resolve(board_event);
        })
        .catch(function(event) {
            // unset online flag
            self.online = false;

            // trigger event
            var board_event = self._trigger('error', event);

            // reject the promise
            return Promise.reject(board_event);
        });
    };

    // -------------------------------------------------------------------------

    /**
    * Send ping command (ok).
    *
    * @method
    * @param   {Integer}          timeout  Response timeout.
    * @return  {sh.network.Post}  Promise
    */
    sh.Board.prototype.Ping = function(timeout) {
        return this.Command('ok', timeout);
    };

    /**
    * Get the board version.
    *
    * @method
    * @param   {Integer}          timeout  Response timeout.
    * @return  {sh.network.Post}  Promise
    */
    sh.Board.prototype.Version = function(timeout) {
        // self alias
        var self = this;

        // get board version (raw)
        return this.Command('version').then(function(event) {
            // raw version string
            // expected : Build version: edge-94de12c, Build date: Oct 28 2014 13:24:47, MCU: LPC1769, System Clock: 120MHz
            var raw_version = event.originalEvent.response.raw;

            // version pattern
            var version_pattern = /Build version: (.*), Build date: (.*), MCU: (.*), System Clock: (.*)/;

            // test the pattern
            var info = raw_version.match(version_pattern);

            if (info) {
                // split branch-hash on dash
                var branch = info[1].split('-');

                // update board info
                self.info = {
                    branch: branch[0].trim(),
                    hash  : branch[1].trim(),
                    date  : info[2].trim(),
                    mcu   : info[3].trim(),
                    clock : info[4].trim()
                };
            }

            // resolve the promise
            return Promise.resolve(sh.BoardEvent('version', self, event, self.info));
        });
    };

    // -------------------------------------------------------------------------

    /**
    * Watch periodicaly if the board is online.
    *
    * @protected
    * @method
    */
    sh.Board.prototype._watchConnection = function() {
        // not connected
        if (! this.connected) {
            throw new Error('Not connected.');
        }

        // next interval offset
        var intervalOffset = Date.now() - this.lastOnlineTime;

        // next interval timeout
        var nextInterval = this.watchInterval;

        // adjust interval (save some request, anti flood)
        if (intervalOffset < this.watchInterval) {
            nextInterval += intervalOffset;
        }

        // self alias
        var self = this;

        // new timeout
        this.watchTimeoutId = setTimeout(function() {
            // board online status before ping
            var online = self.online;

            // send ping command
            self.Ping(self.watchTimeout).then(function(event) {
                // if online flag as changed
                if (! online) {
                    // reset reconnection attempts
                    self.reconnectAttempts = 0;

                    // increment reconnections counter
                    self.reconnections++;

                    // trigger events
                    self._trigger('connect', event);
                    self._trigger('reconnect', event);
                }

                // return the event
                return event;
            })
            .catch(function(event) {
                // if online flag as changed
                if (! online) {
                    // increment reconnection attempts
                    self.reconnectAttempts++;
                    self._trigger('reconnectAttempt', event, {
                        attempts: self.reconnectAttempts
                    });
                }
                else {
                    // trigger events
                    self._trigger('disconnect', event);

                    if (self.reconnections > 0) {
                        self._trigger('redisconnect', event);
                    }
                }

                // return the event
                return event;
            })
            .then(function(event) {
                // not connected
                if (! self.connected) {
                    // stop watching
                    return null;
                }

                // trigger watch event
                self._trigger('watch', event);

                // next connection watch
                self._watchConnection();
            });

        }, nextInterval);
    };

    /**
    * Connect the board (watch periodicaly if the board is online).
    *
    * @method
    * @param   {Integer}          timeout  Connection timeout.
    * @return  {sh.network.Post}  Promise
    */
    sh.Board.prototype.Connect = function(timeout) {
        // already connected
        if (this.connected) {
            throw new Error('Already connected.');
        }

        // reset reconnection attempts
        this.reconnectAttempts = 0;

        // self alias
        var self = this;

        // get board version
        return this.Version(timeout).then(function(event) {
            // set connected flag
            self.connected = true;

            // reset reconnection counter
            self.reconnections = 0;

            // increment connections counter
            self.connections++;

            // start watching
            self._watchConnection();

            // trigger event
            var board_event = self._trigger('connect', event);

            // resolve the promise
            return Promise.resolve(board_event);
        });
    };

    /**
    * Disconnect the board (stop watching periodicaly if the board is online).
    *
    * @method
    * @return
    */
    sh.Board.prototype.Disconnect = function() {
        // not connected
        if (! this.connected) {
            throw new Error('Not connected.');
        }

        // stop watching the connection
        clearTimeout(this.watchTimeoutId);
        this.watchTimeoutId = null;

        // set connected flag
        this.connected = false;

        // trigger event
        var board_event = this._trigger('disconnect');

        // resolve the promise
        return Promise.resolve(board_event);
    };

    /**
    * Network scanner.
    *
    * @class
    * @param  {Object}        settings          Scanner settings.
    * @param  {String|Array}  settings.input    Ip's scan pattern. See {@link sh.network.Scanner#setInput|setInput} for details.
    * @param  {Integer}       settings.timeout  Scan timeout in milliseconds. See {@link sh.network.Scanner#setTimeout|setTimeout} for details.
    *
    * @example
    * ### Scanne the network
    * ```
    * // create the scanner instance
    *  var scanner = sh.network.Scanner();
    *
    *  // register events callbacks
    *  scanner.on('start', function(scan) {
    *      console.log('scan:', 'start:', scan.total);
    *  });
    *
    *  scanner.on('pause', function(scan) {
    *      console.log('scan:', 'pause:', scan.scanned, '/', scan.total);
    *  });
    *
    *  scanner.on('resume', function(scan) {
    *      console.log('scan:', 'resume:', scan.scanned, '/', scan.total);
    *  });
    *
    *  scanner.on('stop', function(scan) {
    *      console.log('scan:', 'stop:', scan.scanned, '/', scan.total);
    *  });
    *
    *  scanner.on('progress', function(scan) {
    *      console.log('scan:', 'progress:', scan.scanned, '/', scan.total);
    *  });
    *
    *  scanner.on('board', function(scan, board) {
    *      console.log('scan:', 'board:', board);
    *  });
    *
    *  scanner.on('end', function(scan) {
    *      console.log('scan:', 'end:', scan.scanned, '/', scan.total);
    *      console.log('scan:', 'found:', scan.found, '/', scan.total);
    *  });
    *
    *  // start scan
    *  scanner.start('192.168.1.100-115');
    * ```
    */
    sh.network.Scanner = function(settings) {
        // instance factory
        if (! (this instanceof sh.network.Scanner)) {
            return new sh.network.Scanner(settings);
        }

        // defaults settings
        settings = settings || {};

        /**
        * @protected
        * @property  {Object}  -  Registred callbacks.
        */
        this._on = {};

        /**
        * @readonly
        * @property  {String}  input  Input to scan.
        * @default   192.168.1.*.
        */
        this.input = settings.input || '192.168.1.*';

        /**
        * @readonly
        * @property  {Array}  queue  Ip's queue to scann.
        */
        this.queue = [];

        /**
        * @readonly
        * @property  {Integer}  timeout  Default scan response timeout in milliseconds.
        * @default 1000
        */
        this.timeout = settings.timeout === undefined ? 1000 : settings.timeout;

        /**
        * @readonly
        * @property  {Integer}  boardTimeout  Default board response timeout in milliseconds.
        * @default 1000
        */
        this.boardTimeout = settings.boardTimeout === undefined ? 5000 : settings.boardTimeout;

        /**
        * @readonly
        * @property  {Boolean}  scanning  Is scanning.
        */
        this.scanning = false;

        /**
        * @readonly
        * @property  {Boolean}  aborted  Aborted scann status.
        */
        this.aborted = false;

        /**
        * @readonly
        * @property  {Integer}  total  Total number of ip to scan.
        */
        this.total = 0;

        /**
        * @readonly
        * @property  {Integer}  scanned Number of ip scanned.
        */
        this.scanned = 0;

        /**
        * @readonly
        * @property  {Integer}  found  Number of boards found.
        */
        this.found = 0;

        /**
        * @readonly
        * @property  {Object}  boards  Known boards list.
        */
        this.boards = {};

    };

    // -------------------------------------------------------------------------

    /**
    * On scan start callback.
    *
    * @callback sh.network.Scanner~onStart
    * @param  {sh.network.Scanner}  scanner  Scanner instance.
    */

    /**
    * On scan pause callback.
    *
    * @callback sh.network.Scanner~onPause
    * @param  {sh.network.Scanner}  scanner  Scanner instance.
    */

    /**
    * On scan resume callback.
    *
    * @callback sh.network.Scanner~onResume
    * @param  {sh.network.Scanner}  scanner  Scanner instance.
    */

    /**
    * On scan stop callback.
    *
    * @callback sh.network.Scanner~onStop
    * @param  {sh.network.Scanner}  scanner  Scanner instance.
    */

    /**
    * On board found callback.
    *
    * @callback sh.network.Scanner~onBoard
    * @param  {sh.network.Scanner}  scanner  Scanner instance.
    * @param  {sh.Board}            board    Board instance.
    */

    /**
    * On scan end callback.
    *
    * @callback sh.network.Scanner~onEnd
    * @param  {sh.network.Scanner}  scanner  Scanner instance.
    */

    // -------------------------------------------------------------------------

    /**
    * Register an event callback.
    *
    * @method
    * @param  {String}    event     Event name.
    * @param  {Function}  callback  Function to call on event is fired.
    * @return {self}
    *
    * @callbacks
    * | Name | Type | Description |
    * | -----| ---- | ----------- |
    * | start  | {@link sh.network.Scanner~onStart|onStart}   | Called before scan start.  |
    * | pause  | {@link sh.network.Scanner~onPause|onPause}   | Called after scan pause.   |
    * | resume | {@link sh.network.Scanner~onResume|onResume} | Called before scan resume. |
    * | stop   | {@link sh.network.Scanner~onStop|onStop}     | Called after scan stop.    |
    * | stop   | {@link sh.network.Scanner~onBoard|onBoard}   | Called after board found.  |
    * | stop   | {@link sh.network.Scanner~onEnd|onEnd}       | Called after scan end.     |
    */
    sh.network.Scanner.prototype.on = function(event, callback) {
        // register callback
        this._on[event] = callback;

        // chainable
        return this;
    };

    /**
    * Trigger an user defined callback with the scope of this class.
    *
    * @method
    * @protected
    * @param  {String}  event  Event name.
    * @param  {Array}   args   Arguments to pass to the callback.
    * @return {self}
    */
    sh.network.Scanner.prototype._trigger = function(name, args) {
        // if defined, call user callback
        this._on[name] && this._on[name].apply(this, args || []);

        // chainable
        return this;
    };

    // -------------------------------------------------------------------------

    /**
    * Set the input and compute the scan queue.
    *
    * **Allowed inputs :**
    * ```
    * - Wildcard  : '192.168.1.*'
    * - Single IP : '192.168.1.100'
    * - IP Range  : '192.168.1.100-120'
    * - Hostname  : 'my.smoothie.board'
    * - Mixed     : '192.168.1.100, my.smoothie.board'
    * - Array     : ['192.168.1.100-120', 'my.smoothie.board']
    * ```
    *
    * @method
    * @param  {String|Array}  input  Ip's scan pattern.
    * @return {self}
    */
    sh.network.Scanner.prototype.setInput = function(input) {
        // Not alowed in scan mode.
        if (this.scanning) {
            throw new Error('Already in scan mode.');
        }

        // reset queue
        this.queue = [];

        // input array
        var inputArray = input;

        // split input on comma if not an array
        if (typeof inputArray === 'string') {
            inputArray = inputArray.split(',');
        }

        // too short or not defined
        if (! inputArray || inputArray.length === 0) {
            throw new Error('Invalid input.');
        }

        // trim input parts
        inputArray = inputArray.map(function(part) {
            return part.trim();
        });

        // for each parts
        for (var y = 0, yl = inputArray.length; y < yl; y++) {
            // current part
            var currentInput = inputArray[y];

            // Wildcard | ex.: [192.168.1.*]
            if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.\*$/.test(currentInput)) {
                var currentInputParts = currentInput.split('.');
                currentInputParts.pop(); // remove last part (*)
                var baseIp = currentInputParts.join('.');
                for (var i = 0; i <= 255; i++) {
                    this.queue.push(baseIp + '.' + i);
                }
            }

            // Single ip | ex.: [192.168.1.55]
            else if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(currentInput)) {
                this.queue.push(currentInput);
            }

            // Ip's range | ex.: [192.168.1.50-100]
            else if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\-[0-9]{1,3}$/.test(currentInput)) {
                var currentInputParts = currentInput.split('.');
                var currentInputRange = currentInputParts.pop().split('-'); // last part (xxx-xxx)
                var baseIp     = currentInputParts.join('.');
                for (var i = currentInputRange[0], il = currentInputRange[1]; i <= il; i++) {
                    this.queue.push(baseIp + '.' + i);
                }
            }

            // Hostname | ex.: [www.host.name]
            else if (/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/.test(currentInput)) {
                this.queue.push(currentInput);
            }

            // Invalid...
            else {
                throw new Error('Invalid input.');
            }
        }

        // update input
        this.input = input;

        // return self
        return this;
    };

    /**
    * Set scan timeout.
    * @method
    * @param  {Integer}  timeout  Scan timeout in milliseconds [min: 100, max: 2000].
    * @return {self}
    */
    sh.network.Scanner.prototype.setTimeout = function(timeout) {
        // out of range test
        if (timeout < 100 || timeout > 2000) {
            throw new Error('Timeout is out of range [100, 2000].');
        }

        // set the timeout
        this.timeout = timeout;

        // return self
        return this;
    };

    // -------------------------------------------------------------------------

    /**
    * Shift and scan an ip from the queue looking for a SmoothieBoard.
    * @method
    * @protected
    * @return {Boolean|null}
    */
    sh.network.Scanner.prototype._processQueue = function() {
        // not in scan mode
        if (! this.scanning) {
            return false;
        }

        // shift first address from the queue
        var address = this.queue.shift();

        // end of queue
        if (! address) {
            this._trigger('end', [this]);
            this.scanning = false;
            return true;
        }

        // increment scanned counter
        this.scanned++;

        // self alias
        var self  = this;

        try {
            // create board instance
            var board = sh.Board({
                address: address,
                timeout: this.timeout
            });

            // get board version
            board.Version().then(function(event) {
                // increment counters
                self.found++;

                // add the board
                self.boards[address] = event.board;

                // set board default timeout
                event.board.timeout = self.boardTimeout;

                // trigger board event
                self._trigger('board', [self, event.board]);
            })
            .catch(function(event) {
                // return event
                return event;
            })
            .then(function(event) {
                // trigger progress event
                self._trigger('progress', [self]);

                // process queue
                self._processQueue();
            });
        }
        catch(error) {
            // trigger progress event
            self._trigger('progress', [self]);

            // process queue
            self._processQueue();
        }

        // return null
        return null;
    };

    // -------------------------------------------------------------------------

    /**
    * Start new scan.
    *
    * @method
    * @param  {String|Array}  input    Ip's scan pattern. See {@link sh.network.Scanner#setInput|setInput} for details.
    * @param  {Integer}       timeout  Scan timeout in milliseconds. See {@link sh.network.Scanner#setTimeout|setTimeout} for details.
    * @return {self}
    */
    sh.network.Scanner.prototype.start = function(input, timeout) {
        // set the input
        this.setInput(input || this.input);

        // set the timeout
        timeout && this.setTimeout(timeout);

        // set scan status
        this.scanning = true;
        this.aborted  = false;
        this.total    = this.queue.length;
        this.scanned  = 0;
        this.found    = 0;
        this.boards   = {};

        // call user callback
        this._trigger('start', [this]);

        // process queue
        this._processQueue();

        // chainable
        return this;
    };

    /**
    * Stop current scan.
    *
    * @method
    * @return {self}
    */
    sh.network.Scanner.prototype.stop = function() {
        if (this.scanning || this.aborted) {
            // set scan status
            this.scanning = false;
            this.aborted  = false;

            // call user callback
            this._trigger('stop', [this]);
        }

        // chainable
        return this;
    };

    /**
    * Pause current scan.
    *
    * @method
    * @return {self}
    */
    sh.network.Scanner.prototype.pause = function() {
        if (this.scanning) {
            // set scan status
            this.scanning = false;
            this.aborted  = true;

            // call user callback
            this._trigger('pause', [this]);
       }

        // chainable
        return this;
    };

    /**
    * Resume current scan.
    *
    * @method
    * @return {self}
    */
    sh.network.Scanner.prototype.resume = function() {
        if (this.aborted) {
            // set scan status
            this.aborted  = false;
            this.scanning = true;

            // call user callback
            this._trigger('resume', [this]);

            // process queue
            this._processQueue();
        }

        // chainable
        return this;
    };

})();
