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
var anchor = {}; 
anchor.context = cheerio;
var elementIndex = {};
bruiser.load = function(html){
	anchor.context = cheerio.load(html);
}
var monitors = {};
global.$ = function(elSelector){
	var el;
	if(typeof elSelector == 'string'){
		if(elementIndex[elSelector]) return elementIndex[elSelector];
		else el = anchor.context(elSelector);
	}else{
		//if(elSelector.length !== 0 && !elSelector.length) el = elSelector;
		//else 
		el = cheerio(elSelector);
	}
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
		monitors[elSelector] = fn
		a.monitor = fn;
		Array.prototype.forEach.apply(el, [function(child, index){
			child.monitor = fn;
		}]);
	}; 
	el.html = function(){
		if(arguments.length){
			if(monitors[elSelector]) monitors[elSelector].apply(el, arguments);
			else Array.prototype.forEach.apply(el, [function(child, index){
				if(child.monitor) child.monitor(child);
			}]);
		}
		var res =  a.html.apply(el, arguments);
		return res;
	}
	//elementIndex[elSelector] = el;
	return el;
}

global.$.proxy = function(fn, context){
	return function(){
		return fn.apply(context, arguments);
	}
}

global.WebSocket = function(){
	this.onopen();
};
global.WebSocket.onmessage = function(){};
global.WebSocket.onopen = function(){};
global.WebSocket.onclose = function(){};
global.WebSocket.send = function(){};
global.WebSocket.message = function(event, options){
	this.onmessage(event, options)
};

global.document = $('html');

module.exports = bruiser;