/*
* Copyright 2016 NAVER Corp.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
(function(global) {

var iron = {};

iron.markAsStatic = function(func){
    func.staticExtension = true;
    return func;
};

iron.nativeExtend = function(NATIVE, extList){
    var StaticObject = {};

    for(var key in extList) if(extList.hasOwnProperty(key)){
        var ext = extList[key],
            target = !ext.staticExtension ? NATIVE.prototype : NATIVE;

        if(!target[key]) target[key] = ext;

        StaticObject[key] = typeof ext === "function" ? !ext.staticExtension ? iron.functionalize(ext) : ext : ext;
    }

    return StaticObject;
};

/**
 * 메서드화 한다.
 * 지정한 함수에 전달되는 this가 메서드의 첫번째 인자로 전달된다.
 */
iron.methodize = function(func){
    return function(){
        var args = Array.prototype.slice.apply(arguments);
        return func.apply(null, [this].concat(args));
    };
};

/**
 * 메서드를 함수화 한다.
 * 지정한 메서드에 전달되는 첫번째 인자를 함수의 Context(this)로 지정한다.
 */
iron.functionalize = function(method){
    return function(){
        var args = Array.prototype.slice.apply(arguments),
            ctx = args.shift();
        return method.apply(ctx, args);
    };
};


iron.ns = function(pkgStr) {
    var base = window;
    var steps = pkgStr.split(".");

    for (var i = 0, il = steps.length; i < il; i++) {
        var step = steps[i];

        if (!(step in base)) {
            base[step] = {};
        }

        base = base[step];
    }

    return base;
};

iron.JSON = {};

(function () {
    "use strict";

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    iron.nativeExtend(Date, {
        toJSON : function (){
            return isFinite(this.valueOf()) ?
                this.getUTCFullYear()     + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z' : null;
        }
    });

    var primitiveJSON = function(){
        return this.valueOf();
    };
    iron.nativeExtend(String, { toJSON : primitiveJSON });
    iron.nativeExtend(Number, { toJSON : primitiveJSON });
    iron.nativeExtend(Boolean, { toJSON : primitiveJSON });

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' : gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    iron.JSON.stringify = function (value, replacer, space) {
        // The stringify method takes a value and an optional replacer, and an optional
        // space parameter, and returns a JSON text. The replacer can be a function
        // that can replace values, or an array of strings that will select the keys.
        // A default replacer method can be provided. Use of the space parameter can
        // produce text that is more easily readable.

        var i;
        gap = '';
        indent = '';

        // If the space parameter is a number, make an indent string containing that
        // many spaces.

        if (typeof space === 'number') {
            for (i = 0; i < space; i += 1) {
                indent += ' ';
            }

        // If the space parameter is a string, it will be used as the indent string.

        } else if (typeof space === 'string') {
            indent = space;
        }

        // If there is a replacer, it must be a function or an array.
        // Otherwise, throw an error.

        rep = replacer;
        if (replacer && typeof replacer !== 'function' &&
                (typeof replacer !== 'object' ||
                typeof replacer.length !== 'number')) {
            throw new Error('JSON.stringify');
        }

        // Make a fake root object containing our value under the key of ''.
        // Return the result of stringifying the value.

        return str('', {'': value});
    };

// If the JSON object does not yet have a parse method, give it one.
    iron.JSON.parse = function (text, reviver) {
// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

        var j;

        function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

            var k, v, value = holder[key];
            if (value && typeof value === 'object') {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = walk(value, k);
                        if (v !== undefined) {
                            value[k] = v;
                        } else {
                            delete value[k];
                        }
                    }
                }
            }
            return reviver.call(holder, key, value);
        }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

        text = String(text);
        cx.lastIndex = 0;
        if (cx.test(text)) {
            text = text.replace(cx, function (a) {
                return '\\u' +
                    ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            });
        }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

        if (/^[\],:{}\s]*$/
                .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                    .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                    .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

        j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

            return typeof reviver === 'function' ?
                walk({'': j}, '') : j;
        }

// If the text is not JSON parseable, then a SyntaxError is thrown.

        throw new SyntaxError('JSON.parse');
    };

    if(!window.JSON) window.JSON = {};
    if(!JSON.parse) JSON.parse = iron.JSON.parse;
    if(!JSON.stringify) JSON.stringify = iron.JSON.stringify;
}());

iron.Date = iron.nativeExtend(Date, {
    now : iron.markAsStatic(function(){
        return (new Date()).getTime();
    }),

    toISOString : (function() {
        function pad(number) {
            var r = String(number);
            if(r.length === 1) {
                r = '0' + r;
            }

            return r;
        }

        return function() {
            return this.getUTCFullYear() +
                '-' + pad( this.getUTCMonth() + 1 ) +
                '-' + pad( this.getUTCDate() ) +
                'T' + pad( this.getUTCHours() ) +
                ':' + pad( this.getUTCMinutes() ) +
                ':' + pad( this.getUTCSeconds() ) +
                '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 ) +
                'Z';
        };
    }())
});

/**
 * @fileoverview
 * 객체지향 프로그래밍을 위해 Javascript 의 함수를 래핑한 Class Facade
 *
 * members 의 initialize 메서드는 생성자로 사용된다.
 *
 * 1. iron.Class(members) - 상속받을 클래스가 없는 클래스를 생성한다.
 * 2. iron.Class(SuperClass, members) - SuperClass 를 상속받은 클래스를 생성한다.
 *
 * @param {Function} SuperClass
 * @param {Object} members
 * @return {Function}
 */
iron.Class = function(InheritOpt, members){
    var Klass;
    if(!members || !InheritOpt){
        members = InheritOpt || {},
        Klass = iron.Class.create.call(iron.Class, members);
    }else{
        var SuperClass, MixTargets,
            isSingleton = false;

        if(typeof InheritOpt === "function"){
            SuperClass = InheritOpt;
        }else{
            SuperClass = InheritOpt["inherit"];
            if(!SuperClass){
                SuperClass = function(){};
                SuperClass.__NONE_CLASS__ = true;
            }

            MixTargets = InheritOpt["mix"] || null;
            isSingleton = InheritOpt["singleton"] || false;
        }

        if(typeof SuperClass !== "function"){
            throw new TypeError(SuperClass +" is not a function.");
        }
        SuperClass.__IS_SINGLETON__ = isSingleton;

        Klass = iron.Class.create.call(iron.Class, SuperClass, members);

        if(MixTargets && MixTargets.length > 0){
            Klass = iron.Class.mix.apply(iron.Class, [Klass].concat(MixTargets));
        }
    }

    return Klass;
};

iron.Class.create = function(){
    var args = Array.prototype.slice.apply(arguments),
        members = args.pop(),
        SuperClass = args.pop(),
        isSingleton = false;

    if(typeof members === "function") SuperClass = members;

    if(!!SuperClass){
        isSingleton = SuperClass.__IS_SINGLETON__ || false;
    }

    var Klass;
    if(isSingleton){
        Klass = function(){
            var _class = arguments.callee;

            if(!_class.__SINGLETON_INSTANCE__){
                _class.prototype.initialize && _class.prototype.initialize.apply(this, arguments);
                _class.__SINGLETON_INSTANCE__ = this;

                return this;
            }else{
                return _class.__SINGLETON_INSTANCE__;
            }
        };
        Klass.getInstance = function(){
            return this.__SINGLETON_INSTANCE__ || new this();
        };
        delete SuperClass.__IS_SINGLETON__;
    }else{
        Klass = function(){
            var _class = arguments.callee;
            _class.prototype.initialize && _class.prototype.initialize.apply(this, arguments);
        };
    }

    if(!!SuperClass && !SuperClass.__NONE_CLASS__){
        Klass = iron.Class._extend(Klass, SuperClass);
    }else{
        if(!!SuperClass) delete SuperClass.__NONE_CLASS__;
    }

    for(var m in members) if(members.hasOwnProperty(m)){
        Klass.prototype[m] = members[m];
    }
    Klass.prototype.constructor = Klass;
    Klass.mix = function(){
        var args = Array.prototype.slice.apply(arguments);
        return iron.Class.mix.apply(this, [this].concat(args));
    };

    return Klass;
};

/**
 * 객체의 목록을 배열로 전달하면, 해당 클래스에 혼합시킨다.(mix-in 상속)
 *
 * @param {Function} Klass
 * @param {Array} objList
 * @return {Function}
 */
iron.Class.mix = function(/*Klass , obj1, obj2 ... */){
    var args = Array.prototype.slice.apply(arguments),
        Klass = args.shift(),
        objList = args;

    for(var i=0, ii=objList.length; i<ii; i++){
        for(var o in objList[i]) {
            if(!!Klass.prototype[o]){
                throw new Error("property '"+ o +"' is already exist.");
            }
            Klass.prototype[o] = objList[i][o];
        }
    }

    return Klass;
};

/**
 * SuperClass 를 상속받은 Klass 를 반환한다.
 *
 * @param {Function} Klass
 * @param {Function} SuperClass
 * @return {Function}
 */
iron.Class._extend = function(Klass, SuperClass){
    var _sc = function(){};

    _sc.prototype = SuperClass.prototype;
    Klass.prototype = new _sc();
    Klass.prototype.constructor = Klass;

    return Klass;
};

iron.Object = iron.nativeExtend(Object, {
    create: iron.markAsStatic(function(proto) {
        if (arguments.length === 0) {
            throw new Error("Object.create requires more than 0 arguments");
        } else if (typeof proto !== "object") {
            if (typeof proto === "string") {
                proto = '"' + proto + '"';
            }
            throw new Error(proto + ' is not an object or null');
        }

        var K = function(){};
        K.prototype = proto;

        var o = new K();
        return o;
    }),

    keys: iron.markAsStatic(function(o) {
        var keys = [];

        for (var key in o) {
            keys.push(key);
        }

        return keys;
    }),
    getPrototypeOf: iron.markAsStatic(function(o) {
        if (arguments.length === 0) {
            throw new Error("missing argument 0 when calling function Object.getPrototypeOf");
        } else if (typeof o !== "object" || o === null) {
            if (typeof o === "string") {
                o = '"' + o + '"';
            }
            throw new Error(o + ' is not an object');
        }
        return o.__proto__ || o.constructor.prototype;
    }),
    getOwnPropertyNames: iron.markAsStatic(function(o) {
        var keys = [];

        for (var key in o) {
            if (o.hasOwnProperty && o.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        return keys;
    })
});

iron.Function = iron.nativeExtend(Function, {
    bind : function(ctx) {
        var f = this;
        if(typeof f !== "function"){
            throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");
        }

        var args = Array.prototype.slice.call(arguments, 1),
            blank = function(){},
            func = function(){
                return f.apply(this instanceof blank ? this : ctx || window, args.concat(Array.prototype.slice.call(arguments)));
            };

        blank.prototype = f.prototype;
        func.prototype = new blank();

        return func;
    }
});

/**
 * reduce, reduceRight codes from http://www.tutorialspoint.com/
 *
 *   http://www.tutorialspoint.com/javascript/array_reduce.htm
 *   http://www.tutorialspoint.com/javascript/array_reduceright.htm
 */
(function(){
iron.Array = iron.nativeExtend(Array, {
    isArray : iron.markAsStatic(function(arg){
        return Object.prototype.toString.call(arg) == '[object Array]';
    }),

    indexOf : function(e, from){
        var ii = this.length || 0,
            i = (typeof from == "number" && from < 0) ? ii + from : (from || 0);

        if(ii <= 0) return -1;
        if(i < 0) i = 0;

        while(i < ii){
            if (i in this) {
                if(this[i] === e) return i;
            }
            i++;
        }

        return -1;
    },

    lastIndexOf : function(e, from){
        var i = (typeof from == "number" && from >= 0) ? from : this.length - 1;

        if(from < 0) i = this.length + from;

        if(i < 0 || typeof e === "undefined") return -1;

        while(i >= 0){
            if(this[i] === e) return i;
            i--;
        }

        return -1;
    },

    forEach : function(callback, ctx){
        checkFunction(callback);

        var i = 0,
            ii = this.length || 0;

        while(i < ii){
            if(i in this){
                if(ctx){
                    callback.call(ctx, this[i], i, this);
                }else{
                    callback(this[i], i, this);
                }
            }

            i++;
        }
    },

    every : function(callback, ctx){
        checkFunction(callback);

        var i = 0,
            ii = this.length || 0;

        while(i < ii){
            var result = ctx ? callback.call(ctx, this[i], i, this) : callback(this[i], i, this);

            if(!result) return false;
            i++;
        }

        return true;
    },

    map : function(callback, ctx) {
        checkFunction(callback);

        var i = 0,
            ii = this.length,
            ret = [];

        while (i < ii) {
            if (i in this) {
                ret[i] = ctx ? callback.call(ctx, this[i], i, this) : callback(this[i], i, this);
            }
            i++;
        }

        return ret;
    },

    filter : function(callback, ctx) {
        checkFunction(callback);

        var i = 0,
            ii = this.length,
            ret = [];

        while(i < ii) {
            if (i in this) {
                var append  = ctx ? callback.call(ctx, this[i], i, this) : callback(this[i], i, this);

                if (append) {
                    ret.push(this[i]);
                }
            }
            i++;
        }

        return ret;
    },

    reduce : function(fun /* , initial */) {
        var len = this.length;

        checkFunction(fun);

        // no value to return if no initial value and an empty array
        if (len === 0 && arguments.length == 1)
            throw new TypeError();

        var i = 0, rv;

        if (arguments.length >= 2) {
            rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);
        }

        for (; i < len; i++) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    },

    reduceRight : function(fun /* , initial */) {
        var len = this.length;

        checkFunction(fun);

        // no value to return if no initial value, empty array
        if (len === 0 && arguments.length == 1)
            throw new TypeError("reduce of empty array with no initial value");

        var i = len - 1, rv;

        if (arguments.length >= 2) {
            rv = arguments[1];

        } else {

            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError("reduce of empty array with no initial value");

            } while (true);
        }

        for (; i >= 0; i--) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    },

    some : function(callback, ctx) {
        checkFunction(callback);

        var i = 0,
            ii = this.length;

        while(i < ii) {
            if (i in this && callback.call(ctx, this[i], i, this)) {
                return true;
            }
            i++;
        }

        return false;
    }
});

function checkFunction(f) {
    if (typeof f != "function") {
        throw new TypeError(f +" is not a function");
    }
}
}());

iron.String = iron.nativeExtend(String, {
    trim: function() {
        return this.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, "");
    }
});

iron.Collection = iron.Class({
    initialize: function() {
        this.clear();
    },

    /**
     * key에 속하는 객체 리스트를 반환합니다.
     */
    get: function(key) {

        if(!(key in this._collection)){
            this._collection[key] = [];
        }

        return this._collection[key];
    },

    /**
     * key-value를 key에 등록합니다.
     * key-value 에서 targetKey가 지정되면 key를 targetKey로 지정합니다.
     */
    add: function(key, value, targetKey) {

        var obj = {
            obj: value,
            key: targetKey || key
        };

        this.get(key).push(obj);

        return obj;
    },

    /**
     * key에 속한 리스트 중 value 값을 지웁니다.
     */
    remove: function(key, value){

        var list = this._collection[key];

        for(var i = 0; i < list.length; i++){
            if(list[i].obj === value){
                return list.splice(i, 1);
            }
        }
    },

    /**
     * key에 속하는 모든 객체를 지웁니다.
     */
    removeAll: function(key){
        delete this._collection[key];
    },

    clear: function(){
        this._collection = {};
    }
});

iron.Dispatcher = iron.Class({

    addListener: function(type, listener){
        if(typeof type != 'string'){

            for(var key in type){
                this.addListener(key, type[key]);
            }

            return;
        }

        this.__getCollection().add(type, listener);
    },

    removeListener: function(type, listener){
        var listenerCollection = this.__getCollection();

        if(typeof listener == 'undefined'){
            if(typeof type == 'undefined'){
                listenerCollection.clear();
            } else if (typeof type == 'string') {
                listenerCollection.removeAll(type);
            } else{
                for(var key in type){
                    this.removeListener(key, type[key]);
                }
            }

            return;
        }

        listenerCollection.remove(type, listener);
    },

    hasListener: function(type){
        var listeners = this.__getCollection().get(type);

        return (listeners.length > 0);
    },

    dispatch: function(type){

        var args = Array.prototype.slice.call(arguments);
        args = args.slice(1);

        var listeners = this.__getCollection().get(type);

        for(var i = 0; i < listeners.length; i++){
            listeners[i].obj.apply(null, args);
        }
    },

    __getCollection: function(){
        if(!this.__collection){
            this.__collection = new iron.Collection();
        }

        return this.__collection;
    }
});

iron.KVO = iron.Class(iron.Dispatcher, {

    /**
     * @constructor
     */
    initialize: function() {
        this._targets = {};
        this._observers = new iron.Collection();
    },

    /**
     * 값을 설정합니다.
     * @param key
     * @param value
     */
    set: function(key, value){
        this[key] = value;

        var target = this._targets[key];

        if(target){
            target.obj.set(target.key, value);
        }else{
            this._update(key, value);
        }

        this.notify(key);
    },

    _update: function(key, value){
        this[key] = value;
        this.changed(key);
    },

    /**
     * 키-값 쌍의 집합을 설정합니다.
     *
     * @param values
     */
    setValues: function(values){
        var key;

        // changed 핸들러에서 모든 값이 반영된 상태로 수행되어야 한다.
        for(key in values){
            this[key] = values[key];
        }

        // changed 핸들러를 위해
        // 먼저 값을 세팅한 후 set메서드를 통해 한번 더 값을 입력한다.
        for(key in values){
            this.set(key, values[key]);
        }
    },

    /**
     * 키에 해당하는 값을 가져옵니다.
     *
     * @param key
     * @returns
     */
    get: function(key){
        return this[key];
    },

    /**
     * target에 바인딩 합니다.
     *
     * @param key
     * @param target
     * @param targetKey
     */
    bindTo: function(key, target, targetKey){
        targetKey = targetKey || key;

        if(key in this._targets){
            this.unbind(key);
        }

        this._targets[key] = {
            obj: target,
            key: targetKey
        };

        target.register(targetKey, this, key);
    },

    /**
     * 바인딩을 제거합니다.
     *
     * @param key
     */
    unbind: function(key){
        var target = this._targets[key];
        target.obj.unregister(target.key, this);

        delete this._targets[key];
    },

    /**
     * 모든 바인딩을 제거합니다.
     */
    unbindAll: function(){
        for(var key in this._targets){
            this.unbind(key);
        }
    },

    /**
     * 상태 변경에 대한 일반 핸들러입니다.
     * 파생된 클래스에서 이를 재정의 하여 임의의 상태 변경을 처리합니다.
     *
     * @param key
     */
    changed: function(key){
        var listenerType = key + '_changed';
        var value = this.get(key);

        if(this[listenerType]){
            this[listenerType](value);
        }

        if (this.changed_property) {
            this.changed_property(key, value);
        }

        this.dispatch(listenerType, value);

        this.dispatch('changed_property', {
            key: key,
            value: value
        });
    },

    /**
     * 등록된 옵저버들에게 속성이 변경되었음을 알립니다.
     */
    notify: function(key){
        var observer;
        var observerList = this._observers.get(key);

        for(var i = 0, len = observerList.length; i < len; i++){
            observer = observerList[i];
            observer.obj._update(observer.key, this.get(key));
        }
    },

    /**
     * key로 옵저버를 등록합니다.
     */
    register: function(key, observer, targetKey){
        if(key in this){
            observer._update(targetKey, this.get(key));
        }
        this._observers.add(key, observer, targetKey);
    },

    /**
     * key에 등록된 옵저버를 제거합니다.
     */
    unregister: function(key, observer){
        this._observers.remove(key, observer);
    }
});

iron.KVOArray = iron.Class(iron.KVO, {
    initialize: function(array){
        iron.KVO.apply(this);

        this._array = array || [];
        this.set('length', this._array.length);
    },

    setAt: function(index, value){
        var lastIndex = this.getLength() - 1;
        var inserted = (index > lastIndex);

        this._array[index] = value;

        if(inserted){
            var i = lastIndex + 1;

            while(i < this._array.length){
                this._changedArray('insert_at', i, this.getAt(i));
                i++;
            }

            this._changedArray('set_at', index, value);
            this._updateLength();
        }else{
            this._changedArray('set_at', index, value);
        }
    },

    getAt: function(index){
        return this._array[index];
    },

    getLength: function(){
        return this.get('length');
    },

    getArray: function(){
        return this._array;
    },

    indexOf: function(value){
        return this._array.indexOf(value);
    },

    push: function(value){
        this.insertAt(this.getLength(), value);
        return this.getLength() - 1;
    },

    pop: function(){
        var value = this.removeAt(this.getLength() - 1);
        return value;
    },

    removeAt: function(index){
        var value = this._array.splice(index, 1)[0];
        this._changedArray('remove_at', index, value);
        this._updateLength();

        return value;
    },

    insertAt: function(index, value){
        if(index > this.getLength()){
            this.push(value);
        }else{
            this._array.splice(index, 0, value);
            this._changedArray('insert_at', index, value);
            this._updateLength();
        }
    },

    clear: function(){
        while(this.getLength() > 0){
            this.pop();
        }
    },

    forEach: function(callback){
        for(var i = 0; i < this.getLength(); i++){
            callback(this.getAt(i), i);
        }
    },

    reverse: function(){
        this._array.reverse();

        for(var i = 0; i < this._array.length; i++){
            this.setAt(i, this._array[i]);
        }
    },

    changeOrder: function(fromIndex, toIndex) {
        var value = this._array.splice(fromIndex, 1)[0];
        this._array.splice(toIndex, 0, value);

        this.change_order && this.change_order(fromIndex, toIndex, value);

        this.dispatch('change_order', {
            fromIndex: fromIndex,
            toIndex: toIndex,
            value: value
        });
    },

    _updateLength: function(){
        this.set('length', this._array.length);
    },

    _changedArray: function(type, index, value){
        if(this[type]){
            this[type](index, value);
        }

        this.dispatch(type, {
            index: index,
            value: value
        });
    }
});

(function(iron) {
    iron.require = require;
    iron.require.moduleroot = "";
    iron.require.abort = preventRequire;
    iron.require.versionrule = function(x) { return x; };
    iron.require.resolve = defaultResolve;
    iron.require.postload = function() {};
    iron.require.extractState = extractState;
    iron.require.injectState = injectState;

    var _r = iron.require,
        queue = {},
        loadedModules = {};

    function extractState(){
        return {
            queue : queue,
            loadedModules : loadedModules,
            moduleroot : iron.require.moduleroot,
            versionrule : iron.require.versionrule,
            resolve : iron.require.resolve,
            tools : iron.tools
        };
    }

    function injectState(state){
        if(state.queue) queue = state.queue;
        if(state.loadedModules) loadedModules = state.loadedModules;
        if(state.moduleroot) iron.require.moduleroot = state.moduleroot;
        if(state.versionrule) iron.require.versionrule = state.versionrule;
        if(state.resolve) iron.require.resolve = state.resolve;
        if(state.tools) iron.tools = state.tools;
    }

    function defaultResolve(names) {
        //TODO : iron 에 map 구현 후 map으로 전환하기
        var ret = [];

        names.forEach(function(v) {
            ret.push(_r.moduleroot + v + ".js");
        });

        return ret;
    }


    function require(name, callback) {
        if (loadedModules[name]) {
            callback();
            return;
        } else {
            addCallback(name, callback);

            var files = (typeof name == "string") ? [name] : name;
            files = flatten(_r.resolve(files));

            loadModule(files, function() {
                _r.postload(name);

                queue[name].forEach(function(eachCallback) {
                    eachCallback();
                });

                loadedModules[name] = true;
            });
        }
    }

    function addCallback(name, callback) {
        prepareName(name);
        queue[name].push(callback);
    }

    function prepareName(name) {
        if (!(name in queue)) {
            queue[name] = [];
        }
    }

    function loadModule(srcs, callback) {
        var v = 0, p = srcs.length;

        /*
        cacheModule(srcs, function() {
            (++v == p) && appendScripts();
        });
        */

        srcs = srcs.map(_r.versionrule);

        function appendScripts() {
            if (v < p) {
                var d = document,
                    s = d.createElement("script"),
                    url = srcs[v++];

                s.type = "text/javascript";
                s.src = url;

                // IE < 9
                if ('readyState' in s) {
                    s.onreadystatechange = function() {
                        if (s.readyState == "loaded" || s.readyState == "complete") {
                            s.onreadystatechange = null;
                            appendScripts();
                        }
                    };
                // Other browsers
                } else {
                    s.onload = appendScripts;
                }

                d.body.appendChild(s);
            } else {
                callback();
            }
        }

        appendScripts();
    }

    // @JSHint - Maybe deprecated?
    //  function cacheModule(src, callback) {
    //      for (var i = 0, il = src.length; i < il; i++) {
    //          var req = new Image(),
    //              url = _r.versionrule(src[i]);

    //          req.onload = callback;
    //          req.onerror = callback;
    //          req.src = url;
    //      }
    //  }

    function preventRequire(name) {
        prepareName(name);
        queue[name].length = 0;
    }

    function flatten(arr) {
        var newarr = [];

        for (var i = 0, il = arr.length; i < il; i++) {
            if (arr[i] instanceof Array) {
                newarr = newarr.concat(flatten(arr[i]));
            } else {
                newarr.push(arr[i]);
            }
        }

        return newarr;
    }
}(iron));

iron.util = {};
iron.util.guid = function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
        var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
        return v.toString(16);
    }).toUpperCase();
};

for(var key in iron.util) {
    if(iron[key]) {
        throw new Error("Already exist property '"+ key +"' in namespace 'iron'.");
    }

    iron[key] = iron.util[key];
}

 // exports iron to global object('window in browser')
global.iron = iron;

}(this));
