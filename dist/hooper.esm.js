/**
  * Hopper 0.0.8
  * (c) 2019
    * @license MIT
    */
function getInRange (value, min, max) {
  return Math.max(Math.min(value, max), min)
}

function now () {
  return Date.now();
}

function Timer (callback, time) {
  this.create = function createTimer () {
    return window.setInterval(callback, time);
  };

  this.stop = function stopTimer () {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  };

  this.start = function startTimer () {
    if (!this.timer) {
      this.timer = this.create();
    }
  };

  this.restart = function restartTimer (newTime) {
    time = newTime || time;
    this.stop();
    this.start();
  };
  this.timer = this.create();

}

function camelCaseToString (camelCase) {
  camelCase = camelCase.replace(/([A-Z]+)/g, ' $1');
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}


function normalizeSlideIndex (index, slidesCount) {
  if (index < 0) {
    return (index + slidesCount) % slidesCount;
  }
  return index % slidesCount;
}

//

var script = {
  name: 'Hooper',
  provide () {
    return {
      $hooper: this
    }
  },
  props: {
    // count of items to showed per view
    itemsToShow: {
      default: 1,
      type: Number
    },
    // count of items to slide when use navigation buttons
    itemsToSlide: {
      default: 1,
      type: Number
    },
    // index number of initial slide
    initialSlide: {
      default: 0,
      type: Number
    },
    // control infinite scrolling mode
    infiniteScroll: {
      default: false,
      type: Boolean
    },
    // control center mode
    centerMode: {
      default: false,
      type: Boolean
    },
    // vertical sliding mode
    vertical: {
      default: false,
      type: Boolean
    },
    // enable rtl mode
    rtl: {
      default: false,
      type: Boolean
    },
    // enable auto sliding to carousel
    autoPlay: {
      default: false,
      type: Boolean
    },
    // speed of auto play to trigger slide
    playSpeed: {
      default: 2000,
      type: Number
    },
    // toggle mouse dragging
    mouseDrag: {
      default: true,
      type: Boolean
    },
    // toggle touch dragging
    touchDrag: {
      default: true,
      type: Boolean
    },
    // toggle mouse wheel sliding
    wheelControl: {
      default: false,
      type: Boolean
    },
    // toggle keyboard control
    keysControl: {
      default: false,
      type: Boolean
    },
    // enable any move to commit a slide
    shortDrag: {
      default: true,
      type: Boolean
    },
    // sliding transition time in ms
    transition: {
      default: 300,
      type: Number
    },
    // sync two carousels to slide together
    sync: {
      default: '',
      type: String
    },
    // an object to pass all settings
    settings: {
      default() {
        return {};
      },
      type: Object
    }
  },
  data () {
    return {
      isDragging: false,
      isSliding: false,
      isTouch: false,
      isHover: false,
      isFocus: false,
      slideWidth: 0,
      slideHeight: 0,
      slidesCount: 0,
      currentSlide: 0,
      trackOffset: 0,
      timer: null,
      slides: [],
      allSlides: [],
      defaults: {},
      breakpoints:{},
      delta: { x: 0, y: 0 },
      $settings: {}
    }
  },
  computed: {
    trackTransform () {
      const { infiniteScroll, vertical, rtl, centerMode } = this.$settings;
      const direction = rtl ? -1 : 1;
      let clonesSpace = 0;
      let centeringSpace = 0;
      let translate = 0;
      if (centerMode) {
        centeringSpace = vertical
        ? (this.containerHeight - this.slideHeight) / 2
        : (this.containerWidth - this.slideWidth) / 2;
      }
      if (infiniteScroll) {
        clonesSpace = vertical
        ? this.slideHeight * this.slidesCount
        : this.slideWidth * this.slidesCount * direction;
      }
      if (vertical) {
        translate = this.delta.y + direction * (centeringSpace - this.trackOffset * this.slideHeight);
        return `transform: translate(0, ${translate - clonesSpace}px);`
      }
      if (!vertical) {
        translate = this.delta.x + direction * (centeringSpace - this.trackOffset * this.slideWidth);
        return `transform: translate(${translate - clonesSpace}px, 0);`
      }
    }
  },
  watch: {
    trackOffset (val) {
      this.updateSlidesStatus(val);
    }
  },
  methods: {
    // controlling methods
    slideTo (slideIndex, mute = false) {
      const previousSlide = this.currentSlide;
      const index = this.$settings.infiniteScroll
        ? slideIndex
        : getInRange(slideIndex, 0, this.slidesCount - 1);

      this.$emit('beforeSlide', {
        currentSlide: this.currentSlide,
        slideTo: index
      });
      if (this.syncEl && !mute) {
        this.syncEl.slideTo(slideIndex, true);
      }
      this.$refs.track.style.transition = `${this.$settings.transition}ms`;
      this.trackOffset = index;
      this.currentSlide = normalizeSlideIndex(index, this.slidesCount);
      this.isSliding = true;
      window.setTimeout(() => {
        this.$refs.track.style.transition = '';
        this.isSliding = false;
      }, this.$settings.transition);

      // show the original slide instead of the cloned one
      if (this.$settings.infiniteScroll) {
        const temp = () => {
          this.trackOffset = normalizeSlideIndex(this.currentSlide, this.slidesCount);
          this.$refs.track.removeEventListener('transitionend', temp);
        };
        this.$refs.track.addEventListener('transitionend', temp);
      }

      this.$emit('slide', {
        currentSlide: this.currentSlide,
        slideFrom: previousSlide
      });
    },
    slideNext () {
      this.slideTo(this.currentSlide + this.$settings.itemsToSlide);
    },
    slidePrev () {
      this.slideTo(this.currentSlide - this.$settings.itemsToSlide);
    },

    // init methods
    init () {
      // get the element direction if not explicitly set
      if (this.defaults.rtl === null) {
        this.defaults.rtl = getComputedStyle(this.$el).direction === 'rtl';
      }
      this.slides = Array.from(this.$refs.track.children);
      this.allSlides = Array.from(this.slides);
      this.slidesCount = this.slides.length;
      if (this.$settings.infiniteScroll) {
        this.initClones();
      }
      if (this.$settings.autoPlay) {
        this.initAutoPlay();
      }
      if (this.$settings.mouseDrag) {
        this.$refs.track.addEventListener('mousedown', this.onDragStart);
      }
      if (this.$settings.touchDrag) {
        this.$refs.track.addEventListener('touchstart', this.onDragStart, { passive: true });
      }
      if (this.$settings.keysControl) {
        this.$el.addEventListener('keydown', this.onKeypress);
      }
      if (this.$settings.wheelControl) {
        this.lastScrollTime = now();
        this.$el.addEventListener('wheel', this.onWheel, { passive: false });
      }
      if (this.$settings.sync) {
        const el = this.$parent.$refs[this.$settings.sync];

        if (!el) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`Hooper: expects an element with attribute ref="${this.$settings.sync}", but found none.`);
          }
          return;
        }
        this.syncEl = this.$parent.$refs[this.$settings.sync];
        this.syncEl.syncEl = this;
      }
      window.addEventListener('resize', this.update);
    },
    initClones () {
      const slidesBefore = document.createDocumentFragment();
      const slidesAfter = document.createDocumentFragment();
      let before = [];
      let after = [];

      this.slides.forEach((slide) => {
        const elBefore = slide.cloneNode(true);
        const elAfter = slide.cloneNode(true);
        elBefore.classList.add('hooper-clone');
        elAfter.classList.add('hooper-clone');
        slidesBefore.appendChild(elBefore);
        slidesAfter.appendChild(elAfter);
        before.push(elBefore);
        after.push(elAfter);
      });
      this.allSlides.push(...after);
      this.allSlides.unshift(...before);
      this.$refs.track.appendChild(slidesAfter);
      this.$refs.track.insertBefore(slidesBefore, this.$refs.track.firstChild);
    },
    initAutoPlay () {
      this.timer = new Timer(() => {
        if (
          this.isSliding ||
          this.isDragging ||
          this.isHover ||
          this.isFocus
        ) {
          return;
        }
        if (
          this.currentSlide === this.slidesCount - 1 &&
          !this.$settings.infiniteScroll
        ) {
          this.slideTo(0);
          return;
        }
        this.slideNext();
      }, this.$settings.playSpeed);
    },
    initDefaults () {
      this.breakpoints = this.settings.breakpoints;
      this.defaults = this.$props, this.settings;
      this.$settings = this.defaults;
    },

    // updating methods
    update () {
      this.updateBreakpoints();
      this.updateWidth();
      this.updateSlidesStatus(this.currentSlide);
      this.$emit('updated', {
        containerWidth: this.containerWidth,
        containerHeight: this.containerHeight,
        slideWidth: this.slideWidth,
        slideHeight: this.slideHeight,
        settings: this.$settings
      });
    },
    updateWidth () {
      const rect = this.$el.getBoundingClientRect();
      this.containerWidth = rect.width;
      this.containerHeight = rect.height;
      this.slideWidth = (this.containerWidth / this.$settings.itemsToShow);
      this.slideHeight = (this.containerHeight / this.$settings.itemsToShow);
      this.allSlides.forEach(slide => {
        if (this.$settings.vertical) {
          slide.style.height = `${this.slideHeight}px`;
          return;
        }
        slide.style.width = `${this.slideWidth}px`;
      });
    },
    updateBreakpoints () {
      if (!this.breakpoints) {
        return;
      }
      const breakpoints = Object.keys(this.breakpoints).sort((a, b) => a - b);
      let matched;
      breakpoints.forEach(breakpoint => {
        if (window.matchMedia(`(min-width: ${breakpoint}px)`).matches) {
          this.$settings = Object.assign({}, this.defaults, this.breakpoints[breakpoint]);
          matched = breakpoint;
          return;
        }
      });
      if (!matched) {
        this.$settings = this.defaults;
      }
    },
    updateSlidesStatus (index) {
      const indexShift = this.$settings.infiniteScroll ? this.slidesCount : 0;
      const current = index + indexShift;
      const siblings = this.$settings.itemsToShow;

      this.allSlides.forEach((slide, index) => {
        const lower = this.$settings.centerMode ? Math.ceil(current - siblings / 2) : current;
        const upper = this.$settings.centerMode ? Math.floor(current + siblings / 2) : Math.floor(current + siblings - 1);
        if (index >= lower  && index <= upper) {
          slide.classList.remove('is-prev', 'is-next');
          slide.classList.add('is-active');
          slide.removeAttribute('aria-hidden');
          return;
        }
        slide.classList.remove('is-active', 'is-prev', 'is-next');
        slide.setAttribute('aria-hidden', true);
        if (index <= lower - 1) {
          slide.classList.add('is-prev');
        }
        if (index >= upper + 1) {
          slide.classList.add('is-next');
        }
      });
    },
    restartTimer () {
      if (this.timer) {
        this.timer.restart();
      }
    },

    // events handlers
    onDragStart (event) {
      this.isTouch = event.type === 'touchstart';
      if (!this.isTouch && event.button !== 0) {
        return;
      }

      this.startPosition = { x: 0, y: 0 };
      this.endPosition = { x: 0, y: 0 };
      this.isDragging = true;
      this.startPosition.x = this.isTouch ? event.touches[0].clientX : event.clientX;
      this.startPosition.y = this.isTouch ? event.touches[0].clientY : event.clientY;

      document.addEventListener(
        this.isTouch ? 'touchmove' : 'mousemove',
        this.onDrag
      );
      document.addEventListener(
        this.isTouch ? 'touchend' : 'mouseup',
        this.onDragEnd
      );
    },
    onDrag (event) {
      if (this.isSliding) {
        return;
      }
      this.endPosition.x = this.isTouch ? event.touches[0].clientX : event.clientX;
      this.endPosition.y = this.isTouch ? event.touches[0].clientY : event.clientY;
      this.delta.x = this.endPosition.x - this.startPosition.x;
      this.delta.y = this.endPosition.y - this.startPosition.y;
    },
    onDragEnd () {
      const tolerance = this.$settings.shortDrag ? 0.5 : 0.15;
      if (this.$settings.vertical) {
        const draggedSlides = Math.round(Math.abs(this.delta.y / this.slideHeight) + tolerance);
        this.slideTo(this.currentSlide - Math.sign(this.delta.y) * draggedSlides);
      }
      if (!this.$settings.vertical) {
        const direction = (this.$settings.rtl ? -1 : 1) * Math.sign(this.delta.x);
        const draggedSlides = Math.round(Math.abs(this.delta.x / this.slideWidth) + tolerance);
        this.slideTo(this.currentSlide - direction * draggedSlides);
      }
      this.isDragging = false;
      this.delta.x = 0;
      this.delta.y = 0;
      document.removeEventListener(
        this.isTouch ? 'touchmove' : 'mousemove',
        this.onDrag
      );
      document.removeEventListener(
        this.isTouch ? 'touchend' : 'mouseup',
        this.onDragEnd
      );
      this.restartTimer();
    },
    onTransitionend () {
      this.$refs.track.style.transition = '';
      this.isSliding = false;
      this.$emit('afterSlide', {
        currentSlide: this.currentSlide
      });
    },
    onKeypress (event) {
      const key = event.key;
      if (key.startsWith('Arrow')) {
        event.preventDefault();
      }
      if (this.$settings.vertical) {
        if (key === 'ArrowUp') {
          this.slidePrev();
        }
        if (key === 'ArrowDown') {
          this.slideNext();
        }
        return;
      }
      if (this.$settings.rtl) {
        if (key === 'ArrowRight') {
          this.slidePrev();
        }
        if (key === 'ArrowLeft') {
          this.slideNext();
        }
        return;
      }
      if (key === 'ArrowRight') {
        this.slideNext();
      }
      if (key === 'ArrowLeft') {
        this.slidePrev();
      }
    },
    onWheel (event) {
      event.preventDefault();
      if (now() - this.lastScrollTime < 200) {
        return;
      }
      // get wheel direction
      this.lastScrollTime = now();
      const value = event.wheelDelta || -event.deltaY;
      const delta = Math.sign(value);
      if (delta === -1) {
        this.slideNext();
      }
      if (delta === 1) {
        this.slidePrev();
      }
    }
  },
  created () {
    this.initDefaults();
  },
  mounted () {
    this.init();
    this.$nextTick(() => {
      this.update();
      this.slideTo(this.initialSlide);
      this.slides[this.currentSlide].classList.add('is-active');
      this.$emit('loaded');
    });
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.update);
    if (this.timer) {
      this.timer.stop();
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
/* server only */
, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  var options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  var hook;

  if (moduleIdentifier) {
    // server build
    hook = function hook(context) {
      // 2.3 injection
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function () {
      style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      var originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}

var normalizeComponent_1 = normalizeComponent;

/* script */
const __vue_script__ = script;
/* template */
var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('section',{staticClass:"hooper",class:{
    'is-vertical': _vm.$settings.vertical,
    'is-rtl': _vm.$settings.rtl,
  },attrs:{"tabindex":"0"},on:{"mouseover":function($event){_vm.isHover = true;},"mouseleave":function($event){_vm.isHover = false;},"focusin":function($event){_vm.isFocus = true;},"focusout":function($event){_vm.isFocus = false;}}},[_c('div',{staticClass:"hooper-list"},[_c('ul',{ref:"track",staticClass:"hooper-track",class:{ 'is-dragging': _vm.isDragging },style:(_vm.trackTransform),on:{"transitionend":_vm.onTransitionend}},[_vm._t("default")],2)]),_vm._v(" "),_vm._t("hooper-addons"),_vm._v(" "),_c('div',{staticClass:"hooper-liveregion hooper-sr-only",attrs:{"aria-live":"polite","aria-atomic":"true"}},[_vm._v("\n    "+_vm._s(("Item " + (_vm.currentSlide + 1) + " of " + _vm.slidesCount))+"\n  ")])],2)};
var __vue_staticRenderFns__ = [];

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var Hooper = normalizeComponent_1(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    undefined,
    undefined
  );

//
//
//
//
//
//

var script$1 = {
  name: 'HooperSlide'
};

/* script */
const __vue_script__$1 = script$1;
/* template */
var __vue_render__$1 = function (_h,_vm) {var _c=_vm._c;return _c('li',{staticClass:"hooper-slide",attrs:{"tabindex":"-1"}},[_vm._t("default")],2)};
var __vue_staticRenderFns__$1 = [];

  /* style */
  const __vue_inject_styles__$1 = undefined;
  /* scoped */
  const __vue_scope_id__$1 = undefined;
  /* module identifier */
  const __vue_module_identifier__$1 = undefined;
  /* functional template */
  const __vue_is_functional_template__$1 = true;
  /* style inject */
  
  /* style inject SSR */
  

  
  var Slide = normalizeComponent_1(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    undefined,
    undefined
  );

var Mixin = {
  inject: ['$hooper']
};

const icons  = {
  arrowUp: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  arrowDown: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
  arrowRight: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z',
  arrowLeft: 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z'
};

var Icons = {
  name: 'HooperIcon',
  functional: true,
  inheritAttrs: true,
  props: {
    name: {
      type: String,
      required: true,
      validator: val => val in icons
    }
  },
  render(createElement, { props }) {
    const icon = icons[props.name];
    const children = [];
  

    children.push(
      createElement('title', camelCaseToString(props.name))
    );

    children.push(
      createElement('path', {
        attrs: {
          d: 'M0 0h24v24H0z',
          fill: 'none'
        }
      })
    );

    children.push(
      createElement('path', {
        attrs: {
          d: icon
        }
      })
    );

    return createElement(
      'svg',
      {
        attrs: {
          class: `icon icon-${props.name}`,
          viewBox: '0 0 24 24',
          width: '24px',
          height: '24px'
        }
      },
      children
    );
  }
};

//
//
//
//
//
//
//
//
//
//

var script$2 = {
  inject: ['$hooper'],
  name: 'HooperProgress'
};

/* script */
const __vue_script__$2 = script$2;
/* template */
var __vue_render__$2 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"hooper-progress"},[_c('div',{staticClass:"hooper-progress-inner",style:(("width: " + (_vm.$hooper.currentSlide * 100 / (_vm.$hooper.slidesCount - 1)) + "%"))})])};
var __vue_staticRenderFns__$2 = [];

  /* style */
  const __vue_inject_styles__$2 = undefined;
  /* scoped */
  const __vue_scope_id__$2 = undefined;
  /* module identifier */
  const __vue_module_identifier__$2 = undefined;
  /* functional template */
  const __vue_is_functional_template__$2 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var Progress = normalizeComponent_1(
    { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
    __vue_inject_styles__$2,
    __vue_script__$2,
    __vue_scope_id__$2,
    __vue_is_functional_template__$2,
    __vue_module_identifier__$2,
    undefined,
    undefined
  );

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var script$3 = {
  inject: ['$hooper'],
  name: 'HooperPagination',
  props: {
    mode: {
      default: 'indicator',
      type: String
    }
  },
};

/* script */
const __vue_script__$3 = script$3;
/* template */
var __vue_render__$3 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"hooper-pagination",class:{ 'is-vertical': _vm.$hooper.$settings.vertical }},[(_vm.mode === 'indicator')?_c('ol',{staticClass:"hooper-indicators"},_vm._l((_vm.$hooper.slides),function(slide,index){return _c('li',{key:index},[_c('button',{staticClass:"hooper-indicator",class:{ 'is-active': _vm.$hooper.currentSlide === index },on:{"click":function($event){return _vm.$hooper.slideTo(index)}}},[_c('span',{staticClass:"hooper-sr-only"},[_vm._v("item "+_vm._s(index))])])])}),0):_vm._e(),_vm._v(" "),(_vm.mode === 'fraction')?[_c('span',[_vm._v(_vm._s(_vm.$hooper.currentSlide + 1))]),_vm._v(" "),_c('span',[_vm._v("/")]),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.$hooper.slidesCount))])]:_vm._e()],2)};
var __vue_staticRenderFns__$3 = [];

  /* style */
  const __vue_inject_styles__$3 = undefined;
  /* scoped */
  const __vue_scope_id__$3 = undefined;
  /* module identifier */
  const __vue_module_identifier__$3 = undefined;
  /* functional template */
  const __vue_is_functional_template__$3 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var Pagination = normalizeComponent_1(
    { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
    __vue_inject_styles__$3,
    __vue_script__$3,
    __vue_scope_id__$3,
    __vue_is_functional_template__$3,
    __vue_module_identifier__$3,
    undefined,
    undefined
  );

//

var script$4 = {
  inject: ['$hooper'],
  name: 'HooperNavigation',
  components: {
    Icons
  },
  computed: {
    isPrevDisabled () {
      if (this.$hooper.$settings.infiniteScroll) {
        return false;
      }
      return this.$hooper.currentSlide === 0;
    },
    isNextDisabled () {
      if (this.$hooper.$settings.infiniteScroll) {
        return false;
      }
      return this.$hooper.currentSlide === this.$hooper.slidesCount - 1;
    },
    isRTL () {
      return this.$hooper.$settings.rtl;
    },
    isVertical () {
      return this.$hooper.$settings.vertical;
    }
  },
  methods: {
    slideNext () {
      this.$hooper.slideNext();
      this.$hooper.restartTimer();
    },
    slidePrev () {
      this.$hooper.slidePrev();
      this.$hooper.restartTimer();
    }
  }
};

/* script */
const __vue_script__$4 = script$4;
/* template */
var __vue_render__$4 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"hooper-navigation",class:{
    'is-vertical': _vm.$hooper.$settings.vertical,
    'is-rtl': _vm.$hooper.$settings.rtl,
  }},[_c('button',{staticClass:"hooper-prev",class:{ 'is-disabled': _vm.isPrevDisabled },attrs:{"type":"button"},on:{"click":_vm.slidePrev}},[_vm._t("hooper-prev",[_c('icons',{attrs:{"name":_vm.isVertical ? 'arrowUp' : _vm.isRTL ? 'arrowRight' : 'arrowLeft'}})])],2),_vm._v(" "),_c('button',{staticClass:"hooper-next",class:{ 'is-disabled': _vm.isNextDisabled  },attrs:{"type":"button"},on:{"click":_vm.slideNext}},[_vm._t("hooper-next",[_c('icons',{attrs:{"name":_vm.isVertical ? 'arrowDown' : _vm.isRTL ? 'arrowLeft' : 'arrowRight'}})])],2)])};
var __vue_staticRenderFns__$4 = [];

  /* style */
  const __vue_inject_styles__$4 = undefined;
  /* scoped */
  const __vue_scope_id__$4 = undefined;
  /* module identifier */
  const __vue_module_identifier__$4 = undefined;
  /* functional template */
  const __vue_is_functional_template__$4 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var Navigation = normalizeComponent_1(
    { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
    __vue_inject_styles__$4,
    __vue_script__$4,
    __vue_scope_id__$4,
    __vue_is_functional_template__$4,
    __vue_module_identifier__$4,
    undefined,
    undefined
  );

export default Hooper;
export { Hooper, Slide, Progress, Pagination, Navigation, Icons, Mixin as addonMixin };
