/// <reference path="jquery.min-vsdoc" />
/**
* jQuery SimpleFliud v 0.8
* A dynamic layout plugin for jQuery
* @Link http://www.owent.net
* @Author OWenT
*
* Licensed under the MIT.
* Copyright 2013 OWenT
*/


/* 插件 -- 瀑布流 */
(function(window, $){
    var _this = this;
    var logs = [], log = {};

  // 控制台操作
  (function(){
		var log_cmds = ["log", "warn", "info", "error"];
		for (i = 0; i < log_cmds.length; ++i) {
			if (window.console && window.console[log_cmds[i]]) {
				log[log_cmds[i]] = (function (msg) {
					window.console[log_cmds[i]](msg);
				});
			} else {
				log[log_cmds[i]] = (function (msg) {
					var obj = {};
					obj[this.cmd_name] = msg;
					logs.push(obj);
				});
				log[log_cmds[i]].cmd_name = log_cmds[i];
			}
		}

    })();
    

    // resize事件
	var event_resize = (function (ele, timeout, callback) {
		var event_handle = (function (ele, timeout, callback) {
			var last_action_time = 0;
			var _te = this;
			this.time_proc = (function () {
				setTimeout(function () {
					if (Date.now() - last_action_time < timeout) {
						_te.time_proc();
					} else {
						last_action_time = 0;
						callback();
					}
				}, parseInt(timeout / 10));
			});

			ele.bind("resize", function () {
				if (Date.now() - last_action_time >= timeout) {
					last_action_time = Date.now();
					_te.time_proc();
				}
			});
		});
    	
		var obj = new event_handle(ele, timeout, callback);
        return obj.time_proc;
    });

	// 主函数
    var SimpleFliudType = (function (opts) {
    	if (opts && opts["container_style"])
    		opts["container_style"] = $.extend(this.SimpleFliud.options["container_style"], opts["container_style"]);

    	opts["wrapper"] = opts["wrapper"] ? opts["wrapper"] : opts["container"];

    	this._init(opts);
	});

    SimpleFliudType.prototype = ({
        // 默认配置
        options: ({
            // 数值设置
            resize_duration: 300,   // resize事件的等待时间，单位为毫秒
            duration: 500,          // 动画过渡时间（仅设置jQuery动画后有效）
            panel_width: null,      // 面板宽度，单位为像素，默认为第一个选择器元素的宽度
            margin_cols: 5,         // 列间距，单位为像素
            margin_row: 5,          // 行间距，单位为像素

            // 选择器设置
            container: null,        // 容器选择器
            wrapper: null,          // 包装器选择器，默认为容器选择器
            panel: "div",           // 内部面板选择器

        	// 其他设置
			auto_width: false,				// 自动调整宽度
			action_type: "immediately",		// 过渡效果,默认为立即，可选项为immediately, animation
			animation_easing: "swing",		// 动画名称,默认为swing(采用jQuery动画，可选项和jQuery一致)
            container_style: {				// 容器位置设置，不能为static，默认为relative
            	position: "relative"
			},

        	// 事件设置
            event_onchange: function () { },	// 开始重设布局前
            event_afterchange: function () { }	// 重设布局后
        }),

        container: null,
        wrapper: null,
        panels: [],
		maxYs: [],
		cols_num: 0,

    	// 面板包装类
        panel_wrapper: (function (ele, proc) {
        	var jpanel = $(ele);

        	jpanel.change(function () {
        		proc();
        	});

        	return jpanel;
		}),

        // 初始化
        _init: (function (opts) {
        	var _ts = this;
        	this.options = $.extend(this.options, opts);
        	this.options = this.options;
        	var opt = this.options;

        	_ts.container = $(opt["container"]);
        	_ts.wrapper = opt["wrapper"] == opt["container"] ? _ts.container : $(opt["wrapper"]);

			// 计算面板宽度
        	if (!opt["panel_width"] || isNaN(opt["panel_width"])) {
        		opt["panel_width"] = $(opt["panel"], _ts.container).filter(":first").outerWidth(true);
        	}

        	// 事件绑定
        	var time_proc = event_resize($(window), opt["resize_duration"], function () {
        		opt.event_onchange(_ts);
        		_ts._reloadContainer(opt.event_afterchange);
        	});

        	$.each($(opt["panel"], _ts.container), function () {
        		_ts.panels.push(_ts.panel_wrapper(this, time_proc));
			});

        	// 样式设置
        	_ts.container.css({ position: opt["container_style"]["position"] });
        	for (var i = 0; i < _ts.panels.length; ++i) {
        		_ts.panels[i].css({ position: "absolute" });
        	}
        	
        	// 初始化面板
        	opt.event_onchange(_ts);
        	_ts._reloadContainer(opt.event_afterchange);
        }),

		// 设置容器宽度函数
        _setContainerWidth: function (val, callback) {
        	if (this.container.width() == val)
        		return;

        	if (this.wrapper != this.container) {
        		this._action(this.options.action_type).container.width(val, callback);
			} else if (callback && typeof (callback) == "function")  {
				callback();
			}
        },

    	// 计算所占列数
        _calcColumns: function (width_in_pixel) {
        	var _ts = this;
        	return Math.min(_ts.cols_num, 
				Math.ceil((width_in_pixel - _ts.options["panel_width"]) / (_ts.options["panel_width"] + _ts.options["margin_row"])) + 1);
        },

    	// 计算列数所占宽度
        _calcWidth: function (cn) {
        	return cn * this.options["panel_width"] + (cn - 1) * this.options["margin_cols"];
        },

		// 重载入容器
        _reloadContainer: (function (callback) {
        	var _ts = this;
        	var opt = _ts.options;

        	_ts.cols_num = Math.floor((_ts.wrapper.innerWidth() - _ts.options["panel_width"]) / (_ts.options["panel_width"] + _ts.options["margin_row"]) + 1);
        	var target = _ts._calcWidth(_ts.cols_num);

        	_ts._setContainerWidth(target, function () {
        		_ts._reloadPanels(callback);

        		_ts._action(_ts.options.action_type).container.height(Math.max.apply(Math, _ts.maxYs.slice(0, _ts.maxYs.length)) - _ts.options["margin_row"]);
        	});
		}),

		// 设置面板位置
        _setPanelPosition: function (jd, val, callback) {
        	var _ts = this;

        	if (_ts.options["auto_width"])
        		jd.width(_ts._calcWidth(val.ce - val.c));

        	for (var i = val.c; i < val.ce; ++ i)
        		_ts.maxYs[i] = val.y + _ts.options["margin_row"] + jd.outerHeight();

        	_ts._action(_ts.options.action_type).panel.position(jd, {
        		left: val.c * (_ts.options["margin_cols"] + _ts.options["panel_width"]),
        		top: val.y
        	}, callback);

        	if (callback && typeof (callback) == "function")
        		callback();
        },

    	// 重新载入所有面板
        _reloadPanels: function (callback) {
        	var _ts = this;
        	_ts.maxYs = [];
        	var num = _ts.cols_num;
        	while (num--) {
        		_ts.maxYs.push(0);
        	}
        
        	var _count = 0;
        	$.each(_ts.panels, function () {
        		var cols = _ts._calcColumns(this.outerWidth());
        		var pos = _ts._getPosition(cols);
        		pos.ce = cols = pos.c + cols;

				// 设置位置，并在最后一个元素完成后回调
        		_ts._setPanelPosition(this, pos, function () {
        			_count++;
        			if (_count == _ts.panels.length && callback && typeof (callback) == "function")
        				callback();
        		});
        	});
        },

    	// 获取可用的位置
        _getPosition: function (take_cols) {
        	if (take_cols == this.cols_num)
        		return ({ c: 0, y: Math.max.apply(Math, this.maxYs) });

        	var ret = 0, ret_y = Math.max.apply( Math, this.maxYs.slice(0, take_cols) );
        	for (var i = 0; i + take_cols <= this.cols_num; ++i) {
        		var i_y = Math.max.apply( Math, this.maxYs.slice(i, i + take_cols) );
        		if (i_y < ret_y) {
        			ret = i;
        			ret_y = i_y;
        		}
        	}
        	
        	return ({ c: ret, y: ret_y });
        },

    	// 获取动作函数
        _action: (function(action_type){
        	var _ts = this;

        	var ret_map = ({
        		"immediately": {
        			container: {
        				width: function (val, callback) {
        					callback = callback || function () { };
        					_ts.container.width(val);
        					callback();
        				},

        				height: function (val, callback) {
        					callback = callback || function () { };
        					_ts.container.height(val);
        					callback();
        				}
        			},
        			panel: {
        				position: function (jd, val, callback) {
        					callback = callback || function () { };
        					jd.css({
        						left: val.left,
        						top: val.top
        					});
        					callback();
        				}
        			}
        		},
        		"animation": {
        			container: {
        				width: function (val, callback) {
        					callback = callback || function () { };
        					_ts.container.stop().animate({ "width": val }, _ts.options.duration, _ts.options.animation_easing, function () {
        						callback();
        					});
        				},

        				height: function (val, callback) {
        					callback = callback || function () { };
        					_ts.container.stop().animate({ "height": val }, _ts.options.duration, _ts.options.animation_easing, function () {
        						callback();
        					});
        				}
        			},
        			panel: {
        				position: function (jd, val, callback) {
        					callback = callback || function () { };
        					jd.stop().animate({ left: val.left, top: val.top }, _ts.options.duration, _ts.options.animation_easing, function () {
        						callback();
        					});
        					callback();
        				}
        			}
        		}
        	});

        	return ret_map[action_type];
        })
	});

    $.SimpleFliud = (function (opts) {
    	return new SimpleFliudType(opts);
	});

    $.fn.SimpleFliud = (function (opt) {
    	opt["container"] = this.selector;
    	$.SimpleFliud(opt);
    });
    
})(window, jQuery);
