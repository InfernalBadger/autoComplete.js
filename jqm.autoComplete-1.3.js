/*
	Name: autoComplete
	Author: Raymond Camden & Andy Matthews
	Contributors: Jim Pease (@jmpease)
	Website: http://raymondcamden.com/
			http://andyMatthews.net
	Packed With: http://jsutility.pjoneil.net/
	Version: 1.3
 */
(function($) {

	"use strict";
	
	// setup Array filter
	if (!Array.prototype.filter)
	{
	  Array.prototype.filter = function(fun /*, thisp */)
	  {
		"use strict";

		if (this == null)
		  throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun != "function")
		  throw new TypeError();

		var res = [];
		var thisp = arguments[1];
		for (var i = 0; i < len; i++)
		{
		  if (i in t)
		  {
			var val = t[i]; // in case fun mutates this
			if (fun.call(thisp, val, i, t))
			  res.push(val);
		  }
		}

		return res;
	  };
	}
	
	var defaults = {
		target: $(),
		source: null,
		callback: null,
		link: null,
		minLength: 0,
		transition: 'fade',
		showRightArrow: true,
		itemLimit: 0 // 0 means no limit
	},
	buildItems = function($this, data, settings) {
		var str = [];
		$.each(data, function(index, value) {
			// end loop when item limit is hit
			if (settings.itemLimit > 0 && index >= settings.itemLimit) {
				return false;
		        }
			var urlParam, text;
			// are we working with objects or strings?
			if ($.isPlainObject(value)) {
				urlParam = encodeURIComponent(value.value);
				text = value.label;
			} else {
				urlParam = encodeURIComponent(value);
				text = value;
			}
			urlParam = urlParam.replace('\'', '%27').replace('(', '%28').replace(')', '%29');
			str.push('<li' + (settings.showRightArrow ? '' : ' data-icon="false"') + '><a href="' + settings.link + urlParam + '" data-transition="' + settings.transition + '">' + text + '</a></li>');
		});
		var target = $(settings.target).html(str.join('')).listview("refresh");
	    	// if not showing the right arrow, remove the class ui-btn-icon-right from the li's as this adds unclickable padding on the right of the li
	    	if (!settings.showRightArrow) {
	        	target.find('li.ui-li').removeClass('ui-btn-icon-right');
	    	}

		// is there a callback?
		if (settings.callback !== null && $.isFunction(settings.callback)) {
			attachCallback(settings);
		}

		if (str.length > 0) {
			$this.trigger("targetUpdated.autocomplete");
		} else {
			$this.trigger("targetCleared.autocomplete");
		}
	},
	attachCallback = function(settings) {
		$('li a', $(settings.target)).bind('click.autocomplete',function(e){
			e.stopPropagation();
			e.preventDefault();
			settings.callback(e);
		});
	},
	clearTarget = function($this, $target) {
		$target.html('').listview('refresh');
		$this.trigger("targetCleared.autocomplete");
	},
	handleInput = function(e) {
		var $this = $(this), text, data, settings = $this.jqmData("autocomplete");
		if (settings) {
			// get the current text of the input field
			text = $this.val();
			// if we don't have enough text zero out the target
			if (text.length < settings.minLength) {
				clearTarget($this, $(settings.target));
			} else {
				// are we looking at a source array or remote data?
				if ($.isArray(settings.source)) {
					data = settings.source.sort().filter(function(element) {
						var element_text, re = new RegExp('^' + text, 'i');
						if ($.isPlainObject(element)) {
							element_text = element.label;
						} else {
							element_text = element;
						}
						return re.test(element_text);
					});
					buildItems($this, data, settings);
				} else {
					$.get(settings.source, { term: text }, function(data) {
						buildItems($this, data, settings);
					},"json");
				}
			}
		}
	},
	methods = {
		init: function(options) {
			this.jqmData("autocomplete", $.extend({}, defaults, options));
			return this.unbind("keyup.autocomplete").bind("keyup.autocomplete", handleInput);
		},
		// Allow dynamic update of source and link
		update: function(options) {
			var settings = this.jqmData("autocomplete");
			if (settings) {
				this.jqmData("autocomplete", $.extend(settings, options));
			}
			return this;
		},
		// Method to forcibly clear our target
		clear: function() {
			var settings = this.jqmData("autocomplete");
			if (settings) {
				clearTarget(this, $(settings.target));
			}
			return this;
		},
		// Method to destroy (cleanup) plugin
		destroy: function() {
			var settings = this.jqmData("autocomplete");
			if (settings) {
				clearTarget(this, $(settings.target));
				this.jqmRemoveData("autocomplete");
				this.unbind(".autocomplete");
			}
			return this;
		}
	};

	$.fn.autocomplete = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		}
	};

})(jQuery);
