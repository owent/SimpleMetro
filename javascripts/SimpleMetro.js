/// <reference path="jquery.min-vsdoc" />

(function ($) {
    $.metro = (function () {
        var _push_alert_wrapper = null;
        var _body = null;

        var _get_body = function () {
        	if (_body)
        		return _body;
        	return _body = $(document.body);
        }

        this.getAlertWrapper = function () {
        	if (_push_alert_wrapper)
        		return _push_alert_wrapper;

        	_push_alert_wrapper = $("<div></div>");
        	_push_alert_wrapper.addClass("push_alert_wrapper");
        	_get_body().append(_push_alert_wrapper);

        	return _push_alert_wrapper;
        }

        return this;
	})();

    $.fn.extend({
    	pushMessage: function (opt) {
    		var jt = $("<div></div>"), jc = $("<div></div>"), je = this;
    		opt = opt || {};
    		opt = $.extend({
    			"time": 500,
    			"standTime": 5000,
				"slideUpTime": 500
    		}, opt);

    		jc.css("clear", "both");
    		jt.addClass("push_alert_element").append(je);
    		$.metro.getAlertWrapper().append(jt).append(jc);
    		
    		jt.addClass("sys_panel").css("opacity", 0.0);
    		jt.animate({ "right": "+=100%", "opacity": 1.0 }, opt["time"], function () {
    			var killTime = parseInt(opt["standTime"]);
    			var killTimerFunc = (function () {
    				if (killTime <= 0) {
    					jt.animate({ "right": "-=100%", "opacity": 0.0 }, opt["time"], function () {
    						jt.remove();
    						jc.remove();
    					});
    					return;
    				}
    				killTime -= 200;
    				setTimeout(function () { killTimerFunc(); }, 200);
				});
    			jt.hover(function () { killTime = 1000 * 3600 * 24 * 7 }, function () { killTime = parseInt(opt["standTime"]); });
    			killTimerFunc();
    		});
    		return this;
    	}
	});

})(jQuery);

