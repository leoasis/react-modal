(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');
var Modal = require('../../lib/index');

var appElement = document.getElementById('example');

Modal.setAppElement(appElement);
Modal.injectCSS();

var App = React.createClass({displayName: 'App',

  getInitialState: function() {
    return { modalIsOpen: true };
  },

  openModal: function() {
    this.setState({modalIsOpen: true});
  },

  closeModal: function() {
    this.setState({modalIsOpen: false});
  },

  handleModalCloseRequest: function() {
    // opportunity to validate something and keep the modal open even if it
    // requested to be closed
    this.setState({modalIsOpen: false});
  },

  render: function() {
    return (
      React.DOM.div(null, 
        React.DOM.button({onClick: this.openModal}, "Open Modal"), 
        Modal({
          closeTimeoutMS: 150, 
          isOpen: this.state.modalIsOpen, 
          onRequestClose: this.handleModalCloseRequest
        }, 
          React.DOM.h1(null, "Hello"), 
          React.DOM.button({onClick: this.closeModal}, "close"), 
          React.DOM.div(null, "I am a modal"), 
          React.DOM.form(null, 
            React.DOM.input(null), 
            React.DOM.input(null), 
            React.DOM.input(null), 
            React.DOM.input(null), 
            React.DOM.input(null), 
            React.DOM.br(null), 
            React.DOM.button(null, "hi"), 
            React.DOM.button(null, "hi"), 
            React.DOM.button(null, "hi"), 
            React.DOM.button(null, "hi")
          )
        )
      )
    );
  }
});

React.renderComponent(App(null), appElement);

},{"../../lib/index":9,"react":"M6d2gk"}],2:[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');
var ModalPortal = require('./ModalPortal');
var ariaAppHider = require('../helpers/ariaAppHider');
var injectCSS = require('../helpers/injectCSS');

var Modal = module.exports = React.createClass({

  displayName: 'Modal',

  statics: {
    setAppElement: ariaAppHider.setElement,
    injectCSS: injectCSS
  },

  propTypes: {
    isOpen: React.PropTypes.bool.isRequired,
    onRequestClose: React.PropTypes.func,
    appElement: React.PropTypes.instanceOf(HTMLElement),
    closeTimeoutMS: React.PropTypes.number,
    ariaHideApp: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      isOpen: false,
      ariaHideApp: true,
      closeTimeoutMS: 0
    };
  },

  componentDidMount: function() {
    this.node = document.createElement('div');
    this.node.className = 'ReactModalPortal';
    document.body.appendChild(this.node);
    this.renderPortal(this.props);
  },

  componentWillReceiveProps: function(newProps) {
    this.renderPortal(newProps);
  },

  componentWillUnmount: function() {
    React.unmountComponentAtNode(this.node);
    document.body.removeChild(this.node);
  },

  renderPortal: function(props) {
    if (props.ariaHideApp) {
      ariaAppHider.toggle(props.isOpen, props.appElement);
    }
    this.portal = React.renderComponent(ModalPortal(props), this.node);
  },

  render: function () {
    return null;
  }
});


},{"../helpers/ariaAppHider":4,"../helpers/injectCSS":6,"./ModalPortal":3,"react":"M6d2gk"}],3:[function(require,module,exports){
/** @jsx React.DOM */

var React = require('react');
var focusManager = require('../helpers/focusManager');
var scopeTab = require('../helpers/scopeTab');

function stopPropagation(event) {
  event.stopPropagation();
}

var ModalPortal = module.exports = React.createClass({

  displayName: 'ModalPortal',

  getInitialState: function() {
    return {
      afterOpen: false,
      beforeClose: false
    };
  },

  componentDidMount: function() {
    this.handleProps(this.props);
    this.maybeFocus();
  },

  componentWillReceiveProps: function(newProps) {
    this.handleProps(newProps);
  },

  handleProps: function(props) {
    if (props.isOpen === true)
      this.open();
    else if (props.isOpen === false)
      this.close();
  },

  open: function() {
    focusManager.setupScopedFocus(this.getDOMNode());
    focusManager.markForFocusLater();
    this.setState({isOpen: true}, function() {
      this.setState({afterOpen: true});
    }.bind(this));
  },

  close: function() {
    if (!this.ownerHandlesClose())
      return;
    if (this.props.closeTimeoutMS > 0)
      this.closeWithTimeout();
    else
      this.closeWithoutTimeout();
  },

  componentDidUpdate: function() {
    this.maybeFocus();
  },

  maybeFocus: function() {
    if (this.props.isOpen)
      this.focusContent();
  },

  focusContent: function() {
    this.refs.content.getDOMNode().focus();
  },

  closeWithTimeout: function() {
    this.setState({beforeClose: true}, function() {
      setTimeout(this.closeWithoutTimeout, this.props.closeTimeoutMS);
    }.bind(this));
  },

  closeWithoutTimeout: function() {
    this.setState({
      afterOpen: false,
      beforeClose: false
    }, this.afterClose);
  },

  afterClose: function() {
    focusManager.returnFocus();
    focusManager.teardownScopedFocus();
  },

  keepTabNavInside: function(event) {
    var node = this.getDOMNode();
    scopeTab(node, event);
  },

  handleKeyDown: function(event) {
    if (event.keyCode == 9 /*tab*/) this.keepTabNavInside(event);
    if (event.keyCode == 27 /*esc*/) this.requestClose();
  },

  handleOverlayClick: function() {
    if (this.ownerHandlesClose())
      this.requestClose();
    else
      this.focusContent();
  },

  requestClose: function() {
    if (this.ownerHandlesClose)
      this.props.onRequestClose();
  },

  ownerHandlesClose: function() {
    return this.props.onRequestClose;
  },

  shouldBeClosed: function() {
    return !this.props.isOpen && !this.state.beforeClose;
  },

  render: function() {
    if (this.shouldBeClosed()) {
      return React.DOM.div(null);
    }
    else {
      var style = {position: 'fixed', left: 0, right: 0, top: 0, bottom: 0};
      var overlayClassName = 'ReactModal__Overlay';
      var contentClassName = 'ReactModal__Content';
      if (this.state.afterOpen) {
        overlayClassName += ' ReactModal__Overlay--after-open';
        contentClassName += ' ReactModal__Content--after-open';
      }
      if (this.state.beforeClose) {
        overlayClassName += ' ReactModal__Overlay--before-close';
        contentClassName += ' ReactModal__Content--before-close';
      }
      return (
        React.DOM.div({
          className: overlayClassName, 
          style: style, 
          onClick: this.handleOverlayClick
        }, 
          React.DOM.div({
            onClick: stopPropagation, 
            ref: "content", 
            onKeyDown: this.handleKeyDown, 
            className: contentClassName, 
            tabIndex: "-1"
          }, 
            this.props.children
          )
        )
      );
    }
  }

});


},{"../helpers/focusManager":5,"../helpers/scopeTab":7,"react":"M6d2gk"}],4:[function(require,module,exports){
var _element = null;

function setElement(element) {
  _element = element;
}

function hide(appElement) {
  validateElement();
  (appElement || _element).setAttribute('aria-hidden', 'true');
}

function show(appElement) {
  validateElement();
  (appElement || _element).removeAttribute('aria-hidden');
}

function toggle(shouldHide, appElement) {
  if (shouldHide) hide(appElement); else show(appElement);
}

function validateElement() {
  if (!_element)
    throw new Error('react-modal: You must set an element with `Modal.setAppElement(el)` to make this accessible');
}

exports.toggle = toggle;
exports.setElement = setElement;
exports.show = show;
exports.hide = hide;


},{}],5:[function(require,module,exports){
var findTabbable = require('../helpers/tabbable');
var modalElement = null;
var focusLaterElement = null;
var needToFocus = false;

function handleBlur(event) {
  needToFocus = true;
}

function handleFocus(event) {
  if (needToFocus) {
    needToFocus = false;
    // need to see how jQuery shims document.on('focusin') so we don't need the
    // setTimeout, firefox doesn't support focusin, if it did, we could focus
    // the the element outisde of a setTimeout. Side-effect of this
    // implementation is that the document.body gets focus, and then we focus
    // our element right after, seems fine.
    setTimeout(function() {
      if (modalElement.contains(document.activeElement))
        return;
      var el = (findTabbable(modalElement)[0] || modalElement);
      el.focus();
    }, 0);
  }
}

exports.markForFocusLater = function() {
  focusLaterElement = document.activeElement;
};

exports.returnFocus = function() {
  try {
    focusLaterElement.focus();
  }
  catch (e) {
    console.warn('You tried to return focus to '+focusLaterElement+' but it is not in the DOM anymore');
  }
  focusLaterElement = null;
};

exports.setupScopedFocus = function(element) {
  modalElement = element;
  window.addEventListener('blur', handleBlur, false);
  document.addEventListener('focus', handleFocus, true);
};

exports.teardownScopedFocus = function() {
  modalElement = null;
  window.removeEventListener('blur', handleBlur);
  document.removeEventListener('focus', handleFocus);
};


},{"../helpers/tabbable":8}],6:[function(require,module,exports){
module.exports = function() {
  injectStyle([
    '.ReactModal__Overlay {',
    '  background-color: rgba(255, 255, 255, 0.75);',
    '}',
    '.ReactModal__Content {',
    '  position: absolute;',
    '  top: 40px;',
    '  left: 40px;',
    '  right: 40px;',
    '  bottom: 40px;',
    '  border: 1px solid #ccc;',
    '  background: #fff;',
    '  overflow: auto;',
    '  -webkit-overflow-scrolling: touch;',
    '  border-radius: 4px;',
    '  outline: none;',
    '  padding: 20px;',
    '}',
    '@media (max-width: 768px) {',
    '  .ReactModal__Content {',
    '    top: 10px;',
    '    left: 10px;',
    '    right: 10px;',
    '    bottom: 10px;',
    '    padding: 10px;',
    '  }',
    '}'
  ].join('\n'));
};

function injectStyle(css) {
  var style = document.getElementById('rackt-style');
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('id', 'rackt-style');
    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(style, head.firstChild);
  }
  style.innerHTML = style.innerHTML+'\n'+css;
}


},{}],7:[function(require,module,exports){
var findTabbable = require('../helpers/tabbable');

module.exports = function(node, event) {
  var tabbable = findTabbable(node);
  var finalTabbable = tabbable[event.shiftKey ? 0 : tabbable.length - 1];
  var leavingFinalTabbable = (
    finalTabbable === document.activeElement ||
    // handle immediate shift+tab after opening with mouse
    node === document.activeElement
  );
  if (!leavingFinalTabbable) return;
  event.preventDefault();
  var target = tabbable[event.shiftKey ? tabbable.length - 1 : 0];
  target.focus();
};

},{"../helpers/tabbable":8}],8:[function(require,module,exports){
/*!
 * Adapted from jQuery UI core
 *
 * http://jqueryui.com
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/category/ui-core/
 */

function focusable(element, isTabIndexNotNaN) {
  var nodeName = element.nodeName.toLowerCase();
  return (/input|select|textarea|button|object/.test(nodeName) ?
    !element.disabled :
    "a" === nodeName ?
      element.href || isTabIndexNotNaN :
      isTabIndexNotNaN) && visible(element);
}

function hidden(el) {
  return (el.offsetWidth <= 0 && el.offsetHeight <= 0) ||
    el.style.display === 'none';
}

function visible(element) {
  while (element) {
    if (element === document.body) break;
    if (hidden(element)) return false;
    element = element.parentNode;
  }
  return true;
}

function tabbable(element) {
  var tabIndex = element.getAttribute('tabindex');
  if (tabIndex === null) tabIndex = undefined;
  var isTabIndexNaN = isNaN(tabIndex);
  return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
}

function findTabbableDescendants(element) {
  return [].slice.call(element.querySelectorAll('*'), 0).filter(function(el) {
    return tabbable(el);
  });
}

module.exports = findTabbableDescendants;


},{}],9:[function(require,module,exports){
module.exports = require('./components/Modal');


},{"./components/Modal":2}]},{},[1])