/* NProgress, (c) 2013, 2014 Rico Sta. Cruz - http://ricostacruz.com/nprogress
 * @license MIT */

; (function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.NProgress = factory();
  }

})(this, function () {


  // 实例状态 status
// ---------------------------------------------------------------- instance value 实例属性 -------------------------------
  var NProgress = {};

  NProgress.version = '0.2.0';

  var Settings = NProgress.settings = {
    minimum: 0.08,
    easing: 'linear',
    positionUsing: '',
    speed: 200,
    trickle: true,
    trickleSpeed: 200,
    showSpinner: true,
    barSelector: '[role="bar"]',
    spinnerSelector: '[role="spinner"]',
    parent: 'body',
    template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
  };









 
// ----------------------------------------------------- ---------------------- instance status 实例状态 -------------------------------
 

/**
   * Last number.
   */
NProgress.status = null;







  // instance methods 实例方法

// ----------------------------------------------------- ---------------------- instance methods 实例方法 -------------------------------

  /**
   * 更新配置。
   *
   *     NProgress.configure（{ 最小值： 0.1
   *     });
   */
  NProgress.configure = function (options) {
    var key, value;
    for (key in options) {
      value = options[key];
      if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
    }

    return this;
  };







  /**
   * 设置进度条状态，其中 'n' 是介于 '0.0' 到 '1.0' 之间的数字。
   *
   *     NProgress.set（0.4）;
   *     NProgress.set（1.0）;
   */

  NProgress.set = function (n) {
    var started = NProgress.isStarted();

    n = clamp(n, Settings.minimum, 1);
    NProgress.status = (n === 1 ? null : n);

    var progress = NProgress.render(!started),
      bar = progress.querySelector(Settings.barSelector),
      speed = Settings.speed,
      ease = Settings.easing;

    progress.offsetWidth; /* Repaint */

    queue(function (next) {
      // 如果尚未设置 positionUsing，则设置
      if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

      // 添加过渡
      css(bar, barPositionCSS(n, speed, ease));

      if (n === 1) {
        // 淡出
        css(progress, {
          transition: 'none',
          opacity: 1
        });
        progress.offsetWidth; /* Repaint */

        setTimeout(function () {
          css(progress, {
            transition: 'all ' + speed + 'ms linear',
            opacity: 0
          });
          setTimeout(function () {
            NProgress.remove();
            next();
          }, speed);
        }, speed);
      } else {
        setTimeout(next, speed);
      }
    });

    return this;
  };

  NProgress.isStarted = function () {
    return typeof NProgress.status === 'number';
  };

  /**
   * 显示进度条。
   * 这与将 status 设置为 0% 相同，只是它不会倒退。
   *
   *     NProgress.start（）;
   *
   */
  NProgress.start = function () {
    if (!NProgress.status) NProgress.set(0);

    var work = function () {
      setTimeout(function () {
        if (!NProgress.status) return;
        NProgress.trickle();
        work();
      }, Settings.trickleSpeed);
    };

    if (Settings.trickle) work();

    return this;
  };

  /**
   * 隐藏进度条。
   * 这与将状态设置为 100% 相同，区别在于 'done（）' 会产生一些现实运动的安慰剂效应。
   *
   *     NProgress.done（）;
   *
   * 如果传递了 'true'，则即使进度条被隐藏，它也会显示进度条。
   *
   *     NProgress.done（真）;
   */

  NProgress.done = function (force) {
    if (!force && !NProgress.status) return this;

    return NProgress.inc(0.3 + 0.5 * Math.random()).set(1);
  };

  /**
   * 按随机量递增。
   */

  NProgress.inc = function (amount) {
    var n = NProgress.status;

    if (!n) {
      return NProgress.start();
    } else if (n > 1) {
      return;
    } else {
      if (typeof amount !== 'number') {
        if (n >= 0 && n < 0.2) { amount = 0.1; }
        else if (n >= 0.2 && n < 0.5) { amount = 0.04; }
        else if (n >= 0.5 && n < 0.8) { amount = 0.02; }
        else if (n >= 0.8 && n < 0.99) { amount = 0.005; }
        else { amount = 0; }
      }

      n = clamp(n + amount, 0, 0.994);
      return NProgress.set(n);
    }
  };

  NProgress.trickle = function () {
    return NProgress.inc();
  };

  /**
   * 等待所有提供的 jQuery Promise，并在 Promise 解析时增加进度。
   *
   * @param $promise jQUery Promise
   */
  (function () {
    var initial = 0, current = 0;

    NProgress.promise = function ($promise) {
      if (!$promise || $promise.state() === "resolved") {
        return this;
      }

      if (current === 0) {
        NProgress.start();
      }

      initial++;
      current++;

      $promise.always(function () {
        current--;
        if (current === 0) {
          initial = 0;
          NProgress.done();
        } else {
          NProgress.set((initial - current) / initial);
        }
      });

      return this;
    };

  })();

  /**
   * （内部）根据 'template' 呈现进度条标记
   * 设置。
   */

  NProgress.render = function (fromStart) {
    if (NProgress.isRendered()) return document.getElementById('nprogress');

    addClass(document.documentElement, 'nprogress-busy');

    var progress = document.createElement('div');
    progress.id = 'nprogress';
    progress.innerHTML = Settings.template;



    var bar = progress.querySelector(Settings.barSelector),
      perc = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
      parent = isDOM(Settings.parent)
        ? Settings.parent
        : document.querySelector(Settings.parent),
      spinner

    css(bar, {
      transition: 'all 0 linear',
      transform: 'translate3d(' + perc + '%,0,0)'
    });

    if (!Settings.showSpinner) {
      spinner = progress.querySelector(Settings.spinnerSelector);
      spinner && removeElement(spinner);
    }

    if (parent != document.body) {
      addClass(parent, 'nprogress-custom-parent');
    }

    parent.appendChild(progress);
    return progress;
  };

  /**
   * 删除元素。与 render（） 相反。
   */

  NProgress.remove = function () {
    removeClass(document.documentElement, 'nprogress-busy');
    var parent = isDOM(Settings.parent)
      ? Settings.parent
      : document.querySelector(Settings.parent)
    removeClass(parent, 'nprogress-custom-parent')
    var progress = document.getElementById('nprogress');
    progress && removeElement(progress);
  };

  /**
   * 检查进度条是否已呈现。
   */

  NProgress.isRendered = function () {
    return !!document.getElementById('nprogress');
  };

  /**
   * 确定要使用的定位 CSS 规则。
   */

  NProgress.getPositioningCSS = function () {
    // 嗅探 document.body.style
    var bodyStyle = document.body.style;

    // 嗅探前缀
    var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
      ('MozTransform' in bodyStyle) ? 'Moz' :
        ('msTransform' in bodyStyle) ? 'ms' :
          ('OTransform' in bodyStyle) ? 'O' : '';

    if (vendorPrefix + 'Perspective' in bodyStyle) {
      // 支持 3D 的现代浏览器，例如 Webkit、IE10
      return 'translate3d';
    } else if (vendorPrefix + 'Transform' in bodyStyle) {
      // 不支持 3D 的浏览器，例如 IE9
      return 'translate';
    } else {
      // 不支持 translate（） 的浏览器，例如 IE7-8
      return 'margin';
    }
  };









//------------------------------------------------------------------ helper functions 辅助函数---------------------------------------------


  

  /**
   * Helpers
   */

  function isDOM(obj) {
    if (typeof HTMLElement === 'object') {
      return obj instanceof HTMLElement
    }
    return (
      obj &&
      typeof obj === 'object' &&
      obj.nodeType === 1 &&
      typeof obj.nodeName === 'string'
    )
  }

  /**
   * 'clamp' 函数确保给定的数字 'n' 保持在由 'min' 定义的指定范围内，并且
   * 'max' 值。
   * @param n - “clamp”函数中的参数“n”表示你想要的数字
   * 在由 'min' 和 'max' 值定义的指定范围内进行约束。
   * @param min - “clamp”函数中的“min”参数表示输入
   * 'n' 可以是。如果 'n' 小于这个 'min' 值，函数将返回 'min' 而不是 'n'。
   * @param max - “clamp”函数中的“max”参数表示输入的最大值
   * 'n' 可以是。如果 'n' 大于这个 'max' 值，该函数将返回 'max'。
   * @returns 如果 'n' 的值小于 'min' 值，则返回 'min'。如果
   * 'n' 的值大于 'max' 值，则返回 'max'。否则，将
   * 将返回 'n'。
   */

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  /**
   * （内部）将百分比 （'0..1'） 转换为条形 translateX
   * 百分比 （'-100%..0%'）。
   */

  function toBarPerc(n) {
    return (-1 + n) * 100;
  }


  /**
   * （Internal） 返回正确的 CSS 以更改栏的
   * position 给定 n 百分比，以及 Settings 中的 Speed 和 ease
   */

  function barPositionCSS(n, speed, ease) {
    var barCSS;

    if (Settings.positionUsing === 'translate3d') {
      barCSS = { transform: 'translate3d(' + toBarPerc(n) + '%,0,0)' };
    } else if (Settings.positionUsing === 'translate') {
      barCSS = { transform: 'translate(' + toBarPerc(n) + '%,0)' };
    } else {
      barCSS = { 'margin-left': toBarPerc(n) + '%' };
    }

    barCSS.transition = 'all ' + speed + 'ms ' + ease;

    return barCSS;
  }

  /**
   * （内部）将要执行的函数排队。
   */

  var queue = (function () {
    var pending = [];

    function next() {
      var fn = pending.shift();
      if (fn) {
        fn(next);
      }
    }

    return function (fn) {
      pending.push(fn);
      if (pending.length == 1) next();
    };
  })();

  /**
   * （内部）将 css 属性应用于元素，类似于 jQuery
   * CSS 方法。
   *
   * 虽然此帮助程序确实有助于使用供应商前缀的属性名称，但它不会在设置样式之前对值执行任何操作。
   */

  var css = (function () {
    var cssPrefixes = ['Webkit', 'O', 'Moz', 'ms'],
      cssProps = {};

    function camelCase(string) {
      return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function (match, letter) {
        return letter.toUpperCase();
      });
    }

    function getVendorProp(name) {
      var style = document.body.style;
      if (name in style) return name;

      var i = cssPrefixes.length,
        capName = name.charAt(0).toUpperCase() + name.slice(1),
        vendorName;
      while (i--) {
        vendorName = cssPrefixes[i] + capName;
        if (vendorName in style) return vendorName;
      }

      return name;
    }

    function getStyleProp(name) {
      name = camelCase(name);
      return cssProps[name] || (cssProps[name] = getVendorProp(name));
    }

    function applyCss(element, prop, value) {
      prop = getStyleProp(prop);
      element.style[prop] = value;
    }

    return function (element, properties) {
      var args = arguments,
        prop,
        value;

      if (args.length == 2) {
        for (prop in properties) {
          value = properties[prop];
          if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
        }
      } else {
        applyCss(element, args[1], args[2]);
      }
    }
  })();

  /**
   * （内部）确定元素或以空格分隔的类名列表是否包含类名。
   */

  function hasClass(element, name) {
    var list = typeof element == 'string' ? element : classList(element);
    return list.indexOf(' ' + name + ' ') >= 0;
  }

  /**
   * （内部）向元素添加类。
   */

  function addClass(element, name) {
    var oldList = classList(element),
      newList = oldList + name;

    if (hasClass(oldList, name)) return;

    // 修剪开口空间。
    element.className = newList.substring(1);
  }

  /**
   * （内部）从元素中删除类。
   */

  function removeClass(element, name) {
    var oldList = classList(element),
      newList;

    if (!hasClass(element, name)) return;

    // 替换类名。
    newList = oldList.replace(' ' + name + ' ', ' ');

    // 修剪开始和结束空间。
    element.className = newList.substring(1, newList.length - 1);
  }

  /**
   * （内部）获取元素上类名称的空格分隔列表。
   * 该列表的两端各用一个空格括起来，以便于在列表中查找匹配项。
   */

  function classList(element) {
    return (' ' + (element && element.className || '') + ' ').replace(/\s+/gi, ' ');
  }

  /**
   * （内部）从 DOM 中删除元素。
   */

  function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
  }

  return NProgress;
});
