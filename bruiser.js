/*
A global browser for node... also an abomination (use only for testing)
*/
var bruiser = {};
var Proxy = require('node-proxy');
var fs = require('fs');
var Emitter = require('events').EventEmitter;
SetForwardingHandler = function(obj) {
	this.target = obj;
}
SetForwardingHandler.prototype = {
	has: function(name){ return name in this.target; },
	get: function(rcvr, name){
		return global[name];
	},
	set: function(rcvr, name, val){
	    console.log('SET', name);
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
	global.document = anchor.context;
	global.document.body = anchor.context('body');
	return anchor.context;
}
bruiser.inline = function(module, callback){
	fs.readFile(module, function(err, body){
        if(err) callback(err);
        //else vm.runInThisContext(body);
        else eval(body+'');
        if(callback) callback(null);
    });
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
	el.offset = function(){return {left:0, right:0, top:0, bottom:0}};
	el.outerHeight = el.innerHeight = el.height = function(event, callback){
		return el.css('height');
	}
	el.forEach = function(callback){
		el.each(function(index, item){
		    callback(item, index, el);
		})
	}
	el.map = function(callback){
	    var results = [];
		el.each(function(index, item){
		    results[index] = callback(item, index, el);
		});
		return results;
	}
	el.filter = function(callback){
	    var results = [];
		el.each(function(index, item){
		    if(callback(item, index, el)){
		        results.push(item);
		    }
		});
		return results;
	}
	el.outerWidth = el.innerWidth = el.width = function(event, callback){
		return el.css('width');
	}
	el.on = function(event, callback){
		el.each(function(index, ob){
		    if(!ob.events) ob.events = new Emitter();
		    ob.events.on(event, callback);
		});
	}
	el.once = function(event, callback){
		el.each(function(index, ob){
		    if(!ob.events) ob.events = new Emitter();
		    ob.events.once(event, callback);
		});
	}
	el.emit = function(event, callback){
		el.each(function(index, ob){
		    if(!ob.events) ob.events = new Emitter();
		    ob.events.emit(event, callback);
		});
	}
	el.fireEvent = el.emit;
	el.click = function(e){ 
	    e = e ||{ target : el };
	    if(!el.length) return;
	    el.fireEvent('click', e);
	    $(el[0].parent).click(e);
	}
	el.off = function(event, callback){
		el.each(function(index, ob){
		    if(!ob.events) ob.events = new Emitter();
		    ob.events.off(event, callback);
		});
	}
	el.animate = function(){
	}
	el.hide = function(event, callback){ };
	el.show = function(event, callback){ };
	el.resize = function(event, callback){
		
	};
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
		var addedImages = $('img', el);
		addedImages.forEach(function(image){
		    (function(){
		        eval($(image).attr('onload'));
		    }).apply(image);
		})
		return res;
	}
	//elementIndex[elSelector] = el;
	return el;
}
global.$.extend = require('node.extend');

global.$.proxy = function(fn, context){
	return function(){
		return fn.apply(context, arguments);
	}
}

global.clearTimeout = clearTimeout;
global.setTimeout = setTimeout;

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

global.document = global.$('html');

module.exports = bruiser;