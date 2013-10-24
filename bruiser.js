/*
A global browser for node... also an abomination (use only for testing)
*/
var bruiser = {};
var Proxy = require('node-proxy');
SetForwardingHandler = function(obj) {
	this.target = obj;
}
SetForwardingHandler.prototype = {
	has: function(name){ return name in this.target; },
	get: function(rcvr, name){
		return global[name];
	},
	set: function(rcvr, name, val){
		global[name] = val;
		return true;
	},
	'delete': function(name){ return delete this.target[name]; },
	enumerate: function(){
		var res = [];
		for(var key in this.target.ordering) res.push(key);
			return res;
	},
	iterate: function() {
		var props = this.enumerate(), i = 0;
		return {
			next: function() {
				if (i === props.length) throw StopIteration;
				return props[i++];
			}
		};
	},
	keys: function() { return Object.keys(this.target); },
};
SetForwardingHandler.wrap = function(obj) {
	return Proxy.create(new SetForwardingHandler(obj), Object.getPrototypeOf(obj));
};
global.window = function(){};
SetForwardingHandler.wrap(global.window);

var cheerio = require('cheerio');
global.$ = function(el){
	var el = cheerio(el);
	el.ready = function(fn){
		setTimeout(function(){
			fn();
		}, 0);
	}
	el.on = function(event, callback){
		
	}
	el.off = function(event, callback){
		
	}
	el.resize = function(event, callback){
		
	}
	var a = {
		html : el.html,
		monitor : function(){}
	};
	el.monitor = function(fn){
		a.monitor = fn;
	};
	el.html = function(){
		a.monitor.apply(el, arguments);
		a.html.apply(el, arguments);
	}
	return el;
}

global.$.proxy = function(fn, context){
	return function(){
		return fn.apply(context, arguments);
	}
}

global.document = {};

module.exports = bruiser;