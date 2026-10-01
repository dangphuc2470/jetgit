window.onerror = function(msg, url, line, col, error) {
  if (typeof msg === 'string' && msg.includes('ResizeObserver loop')) {
    return true;
  }
  var d = document.createElement('div');
  d.style.cssText = 'color:#ff6b6b;background:#1e1e1e;padding:20px;font-family:monospace;white-space:pre-wrap;font-size:13px;position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;overflow:auto;border:2px solid #e51400;';
  d.innerHTML = '<h3 style="color:#f48771;margin-top:0;">Git Log Webview Error</h3><p><b>' + msg + '</b></p><p>Line ' + line + ':' + col + '</p><pre style="background:#252526;padding:10px;border-radius:4px;">' + (error ? error.stack : '') + '</pre>';
  document.body.appendChild(d);
};
window.addEventListener('error', function(e) {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
  var __publicField = (obj, key2, value) => {
    __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);
    return value;
  };
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateSet = (obj, member, value, setter) => {
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
  };
  var __privateMethod = (obj, member, method) => {
    __accessCheck(obj, member, "access private method");
    return method;
  };

  // node_modules/esm-env/dev-fallback.js
  var node_env = globalThis.process?.env?.NODE_ENV;
  var dev_fallback_default = node_env && !node_env.toLowerCase().startsWith("prod");

  // node_modules/svelte/src/internal/shared/utils.js
  var is_array = Array.isArray;
  var index_of = Array.prototype.indexOf;
  var includes = Array.prototype.includes;
  var array_from = Array.from;
  var object_keys = Object.keys;
  var define_property = Object.defineProperty;
  var get_descriptor = Object.getOwnPropertyDescriptor;
  var get_descriptors = Object.getOwnPropertyDescriptors;
  var object_prototype = Object.prototype;
  var array_prototype = Array.prototype;
  var get_prototype_of = Object.getPrototypeOf;
  var is_extensible = Object.isExtensible;
  var noop = () => {
  };
  function run_all(arr) {
    for (var i = 0; i < arr.length; i++) {
      arr[i]();
    }
  }
  function deferred() {
    var resolve;
    var reject;
    var promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  // node_modules/svelte/src/internal/client/constants.js
  var DERIVED = 1 << 1;
  var EFFECT = 1 << 2;
  var RENDER_EFFECT = 1 << 3;
  var MANAGED_EFFECT = 1 << 24;
  var BLOCK_EFFECT = 1 << 4;
  var BRANCH_EFFECT = 1 << 5;
  var ROOT_EFFECT = 1 << 6;
  var BOUNDARY_EFFECT = 1 << 7;
  var CONNECTED = 1 << 9;
  var CLEAN = 1 << 10;
  var DIRTY = 1 << 11;
  var MAYBE_DIRTY = 1 << 12;
  var INERT = 1 << 13;
  var DESTROYED = 1 << 14;
  var REACTION_RAN = 1 << 15;
  var EFFECT_TRANSPARENT = 1 << 16;
  var EAGER_EFFECT = 1 << 17;
  var HEAD_EFFECT = 1 << 18;
  var EFFECT_PRESERVED = 1 << 19;
  var USER_EFFECT = 1 << 20;
  var EFFECT_OFFSCREEN = 1 << 25;
  var WAS_MARKED = 1 << 16;
  var REACTION_IS_UPDATING = 1 << 21;
  var ASYNC = 1 << 22;
  var ERROR_VALUE = 1 << 23;
  var STATE_SYMBOL = Symbol("$state");
  var LEGACY_PROPS = Symbol("legacy props");
  var LOADING_ATTR_SYMBOL = Symbol("");
  var PROXY_PATH_SYMBOL = Symbol("proxy path");
  var STALE_REACTION = new class StaleReactionError extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "StaleReactionError");
      __publicField(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
    }
  }();
  var IS_XHTML = (
    // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
    !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml")
  );
  var TEXT_NODE = 3;
  var COMMENT_NODE = 8;

  // node_modules/svelte/src/internal/shared/errors.js
  function lifecycle_outside_component(name) {
    if (dev_fallback_default) {
      const error = new Error(`lifecycle_outside_component
\`${name}(...)\` can only be used during component initialisation
https://svelte.dev/e/lifecycle_outside_component`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/lifecycle_outside_component`);
    }
  }

  // node_modules/svelte/src/internal/client/errors.js
  function async_derived_orphan() {
    if (dev_fallback_default) {
      const error = new Error(`async_derived_orphan
Cannot create a \`$derived(...)\` with an \`await\` expression outside of an effect tree
https://svelte.dev/e/async_derived_orphan`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/async_derived_orphan`);
    }
  }
  function bind_invalid_checkbox_value() {
    if (dev_fallback_default) {
      const error = new Error(`bind_invalid_checkbox_value
Using \`bind:value\` together with a checkbox input is not allowed. Use \`bind:checked\` instead
https://svelte.dev/e/bind_invalid_checkbox_value`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/bind_invalid_checkbox_value`);
    }
  }
  function derived_references_self() {
    if (dev_fallback_default) {
      const error = new Error(`derived_references_self
A derived value cannot reference itself recursively
https://svelte.dev/e/derived_references_self`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/derived_references_self`);
    }
  }
  function each_key_duplicate(a, b, value) {
    if (dev_fallback_default) {
      const error = new Error(`each_key_duplicate
${value ? `Keyed each block has duplicate key \`${value}\` at indexes ${a} and ${b}` : `Keyed each block has duplicate key at indexes ${a} and ${b}`}
https://svelte.dev/e/each_key_duplicate`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/each_key_duplicate`);
    }
  }
  function effect_in_teardown(rune) {
    if (dev_fallback_default) {
      const error = new Error(`effect_in_teardown
\`${rune}\` cannot be used inside an effect cleanup function
https://svelte.dev/e/effect_in_teardown`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/effect_in_teardown`);
    }
  }
  function effect_in_unowned_derived() {
    if (dev_fallback_default) {
      const error = new Error(`effect_in_unowned_derived
Effect cannot be created inside a \`$derived\` value that was not itself created inside an effect
https://svelte.dev/e/effect_in_unowned_derived`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/effect_in_unowned_derived`);
    }
  }
  function effect_orphan(rune) {
    if (dev_fallback_default) {
      const error = new Error(`effect_orphan
\`${rune}\` can only be used inside an effect (e.g. during component initialisation)
https://svelte.dev/e/effect_orphan`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/effect_orphan`);
    }
  }
  function effect_update_depth_exceeded() {
    if (dev_fallback_default) {
      const error = new Error(`effect_update_depth_exceeded
Maximum update depth exceeded. This typically indicates that an effect reads and writes the same piece of state
https://svelte.dev/e/effect_update_depth_exceeded`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
    }
  }
  function hydration_failed() {
    if (dev_fallback_default) {
      const error = new Error(`hydration_failed
Failed to hydrate the application
https://svelte.dev/e/hydration_failed`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/hydration_failed`);
    }
  }
  function rune_outside_svelte(rune) {
    if (dev_fallback_default) {
      const error = new Error(`rune_outside_svelte
The \`${rune}\` rune is only available inside \`.svelte\` and \`.svelte.js/ts\` files
https://svelte.dev/e/rune_outside_svelte`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/rune_outside_svelte`);
    }
  }
  function state_descriptors_fixed() {
    if (dev_fallback_default) {
      const error = new Error(`state_descriptors_fixed
Property descriptors defined on \`$state\` objects must contain \`value\` and always be \`enumerable\`, \`configurable\` and \`writable\`.
https://svelte.dev/e/state_descriptors_fixed`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/state_descriptors_fixed`);
    }
  }
  function state_prototype_fixed() {
    if (dev_fallback_default) {
      const error = new Error(`state_prototype_fixed
Cannot set prototype of \`$state\` object
https://svelte.dev/e/state_prototype_fixed`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/state_prototype_fixed`);
    }
  }
  function state_unsafe_mutation() {
    if (dev_fallback_default) {
      const error = new Error(`state_unsafe_mutation
Updating state inside \`$derived(...)\`, \`$inspect(...)\` or a template expression is forbidden. If the value should not be reactive, declare it without \`$state\`
https://svelte.dev/e/state_unsafe_mutation`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/state_unsafe_mutation`);
    }
  }
  function svelte_boundary_reset_onerror() {
    if (dev_fallback_default) {
      const error = new Error(`svelte_boundary_reset_onerror
A \`<svelte:boundary>\` \`reset\` function cannot be called while an error is still being handled
https://svelte.dev/e/svelte_boundary_reset_onerror`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
    }
  }

  // node_modules/svelte/src/constants.js
  var EACH_ITEM_REACTIVE = 1;
  var EACH_INDEX_REACTIVE = 1 << 1;
  var EACH_IS_CONTROLLED = 1 << 2;
  var EACH_IS_ANIMATED = 1 << 3;
  var EACH_ITEM_IMMUTABLE = 1 << 4;
  var PROPS_IS_RUNES = 1 << 1;
  var PROPS_IS_UPDATED = 1 << 2;
  var PROPS_IS_BINDABLE = 1 << 3;
  var PROPS_IS_LAZY_INITIAL = 1 << 4;
  var TRANSITION_OUT = 1 << 1;
  var TRANSITION_GLOBAL = 1 << 2;
  var TEMPLATE_FRAGMENT = 1;
  var TEMPLATE_USE_IMPORT_NODE = 1 << 1;
  var TEMPLATE_USE_SVG = 1 << 2;
  var TEMPLATE_USE_MATHML = 1 << 3;
  var HYDRATION_START = "[";
  var HYDRATION_START_ELSE = "[!";
  var HYDRATION_END = "]";
  var HYDRATION_ERROR = {};
  var ELEMENT_PRESERVE_ATTRIBUTE_CASE = 1 << 1;
  var ELEMENT_IS_INPUT = 1 << 2;
  var UNINITIALIZED = Symbol();
  var FILENAME = Symbol("filename");
  var HMR = Symbol("hmr");
  var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";

  // node_modules/svelte/src/internal/client/warnings.js
  var bold = "font-weight: bold";
  var normal = "font-weight: normal";
  function await_waterfall(name, location) {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] await_waterfall
%cAn async derived, \`${name}\` (${location}) was not read immediately after it resolved. This often indicates an unnecessary waterfall, which can slow down your app
https://svelte.dev/e/await_waterfall`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/await_waterfall`);
    }
  }
  function hydration_attribute_changed(attribute, html2, value) {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] hydration_attribute_changed
%cThe \`${attribute}\` attribute on \`${html2}\` changed its value between server and client renders. The client value, \`${value}\`, will be ignored in favour of the server value
https://svelte.dev/e/hydration_attribute_changed`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/hydration_attribute_changed`);
    }
  }
  function hydration_mismatch(location) {
    if (dev_fallback_default) {
      console.warn(
        `%c[svelte] hydration_mismatch
%c${location ? `Hydration failed because the initial UI does not match what was rendered on the server. The error occurred near ${location}` : "Hydration failed because the initial UI does not match what was rendered on the server"}
https://svelte.dev/e/hydration_mismatch`,
        bold,
        normal
      );
    } else {
      console.warn(`https://svelte.dev/e/hydration_mismatch`);
    }
  }
  function lifecycle_double_unmount() {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] lifecycle_double_unmount
%cTried to unmount a component that was not mounted
https://svelte.dev/e/lifecycle_double_unmount`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/lifecycle_double_unmount`);
    }
  }
  function state_proxy_equality_mismatch(operator) {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] state_proxy_equality_mismatch
%cReactive \`$state(...)\` proxies and the values they proxy have different identities. Because of this, comparisons with \`${operator}\` will produce unexpected results
https://svelte.dev/e/state_proxy_equality_mismatch`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/state_proxy_equality_mismatch`);
    }
  }
  function state_proxy_unmount() {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] state_proxy_unmount
%cTried to unmount a state proxy, rather than a component
https://svelte.dev/e/state_proxy_unmount`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/state_proxy_unmount`);
    }
  }
  function svelte_boundary_reset_noop() {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] svelte_boundary_reset_noop
%cA \`<svelte:boundary>\` \`reset\` function only resets the boundary the first time it is called
https://svelte.dev/e/svelte_boundary_reset_noop`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
    }
  }

  // node_modules/svelte/src/internal/client/dom/hydration.js
  var hydrating = false;
  function set_hydrating(value) {
    hydrating = value;
  }
  var hydrate_node;
  function set_hydrate_node(node) {
    if (node === null) {
      hydration_mismatch();
      throw HYDRATION_ERROR;
    }
    return hydrate_node = node;
  }
  function hydrate_next() {
    return set_hydrate_node(get_next_sibling(hydrate_node));
  }
  function reset(node) {
    if (!hydrating)
      return;
    if (get_next_sibling(hydrate_node) !== null) {
      hydration_mismatch();
      throw HYDRATION_ERROR;
    }
    hydrate_node = node;
  }
  function next(count = 1) {
    if (hydrating) {
      var i = count;
      var node = hydrate_node;
      while (i--) {
        node = /** @type {TemplateNode} */
        get_next_sibling(node);
      }
      hydrate_node = node;
    }
  }
  function skip_nodes(remove = true) {
    var depth = 0;
    var node = hydrate_node;
    while (true) {
      if (node.nodeType === COMMENT_NODE) {
        var data = (
          /** @type {Comment} */
          node.data
        );
        if (data === HYDRATION_END) {
          if (depth === 0)
            return node;
          depth -= 1;
        } else if (data === HYDRATION_START || data === HYDRATION_START_ELSE || // "[1", "[2", etc. for if blocks
        data[0] === "[" && !isNaN(Number(data.slice(1)))) {
          depth += 1;
        }
      }
      var next2 = (
        /** @type {TemplateNode} */
        get_next_sibling(node)
      );
      if (remove)
        node.remove();
      node = next2;
    }
  }
  function read_hydration_instruction(node) {
    if (!node || node.nodeType !== COMMENT_NODE) {
      hydration_mismatch();
      throw HYDRATION_ERROR;
    }
    return (
      /** @type {Comment} */
      node.data
    );
  }

  // node_modules/svelte/src/internal/client/reactivity/equality.js
  function equals(value) {
    return value === this.v;
  }
  function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || a !== null && typeof a === "object" || typeof a === "function";
  }
  function safe_equals(value) {
    return !safe_not_equal(value, this.v);
  }

  // node_modules/svelte/src/internal/flags/index.js
  var async_mode_flag = false;
  var legacy_mode_flag = false;
  var tracing_mode_flag = false;

  // node_modules/svelte/src/internal/client/dev/tracing.js
  var tracing_expressions = null;
  function tag(source2, label) {
    source2.label = label;
    tag_proxy(source2.v, label);
    return source2;
  }
  function tag_proxy(value, label) {
    value?.[PROXY_PATH_SYMBOL]?.(label);
    return value;
  }

  // node_modules/svelte/src/internal/shared/dev.js
  function get_error(label) {
    const error = new Error();
    const stack2 = get_stack();
    if (stack2.length === 0) {
      return null;
    }
    stack2.unshift("\n");
    define_property(error, "stack", {
      value: stack2.join("\n")
    });
    define_property(error, "name", {
      value: label
    });
    return (
      /** @type {Error & { stack: string }} */
      error
    );
  }
  function get_stack() {
    const limit = Error.stackTraceLimit;
    Error.stackTraceLimit = Infinity;
    const stack2 = new Error().stack;
    Error.stackTraceLimit = limit;
    if (!stack2)
      return [];
    const lines = stack2.split("\n");
    const new_lines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const posixified = line.replaceAll("\\", "/");
      if (line.trim() === "Error") {
        continue;
      }
      if (line.includes("validate_each_keys")) {
        return [];
      }
      if (posixified.includes("svelte/src/internal") || posixified.includes("node_modules/.vite")) {
        continue;
      }
      new_lines.push(line);
    }
    return new_lines;
  }

  // node_modules/svelte/src/internal/client/context.js
  var component_context = null;
  function set_component_context(context) {
    component_context = context;
  }
  var dev_stack = null;
  function set_dev_stack(stack2) {
    dev_stack = stack2;
  }
  var dev_current_component_function = null;
  function set_dev_current_component_function(fn) {
    dev_current_component_function = fn;
  }
  function push(props, runes = false, fn) {
    component_context = {
      p: component_context,
      i: false,
      c: null,
      e: null,
      s: props,
      x: null,
      l: legacy_mode_flag && !runes ? { s: null, u: null, $: [] } : null
    };
    if (dev_fallback_default) {
      component_context.function = fn;
      dev_current_component_function = fn;
    }
  }
  function pop(component2) {
    var context = (
      /** @type {ComponentContext} */
      component_context
    );
    var effects = context.e;
    if (effects !== null) {
      context.e = null;
      for (var fn of effects) {
        create_user_effect(fn);
      }
    }
    if (component2 !== void 0) {
      context.x = component2;
    }
    context.i = true;
    component_context = context.p;
    if (dev_fallback_default) {
      dev_current_component_function = component_context?.function ?? null;
    }
    return component2 ?? /** @type {T} */
    {};
  }
  function is_runes() {
    return !legacy_mode_flag || component_context !== null && component_context.l === null;
  }

  // node_modules/svelte/src/internal/client/dom/task.js
  var micro_tasks = [];
  function run_micro_tasks() {
    var tasks = micro_tasks;
    micro_tasks = [];
    run_all(tasks);
  }
  function queue_micro_task(fn) {
    if (micro_tasks.length === 0 && !is_flushing_sync) {
      var tasks = micro_tasks;
      queueMicrotask(() => {
        if (tasks === micro_tasks)
          run_micro_tasks();
      });
    }
    micro_tasks.push(fn);
  }
  function flush_tasks() {
    while (micro_tasks.length > 0) {
      run_micro_tasks();
    }
  }

  // node_modules/svelte/src/internal/client/error-handling.js
  var adjustments = /* @__PURE__ */ new WeakMap();
  function handle_error(error) {
    var effect2 = active_effect;
    if (effect2 === null) {
      active_reaction.f |= ERROR_VALUE;
      return error;
    }
    if (dev_fallback_default && error instanceof Error && !adjustments.has(error)) {
      adjustments.set(error, get_adjustments(error, effect2));
    }
    if ((effect2.f & REACTION_RAN) === 0 && (effect2.f & EFFECT) === 0) {
      if (dev_fallback_default && !effect2.parent && error instanceof Error) {
        apply_adjustments(error);
      }
      throw error;
    }
    invoke_error_boundary(error, effect2);
  }
  function invoke_error_boundary(error, effect2) {
    while (effect2 !== null) {
      if ((effect2.f & BOUNDARY_EFFECT) !== 0) {
        if ((effect2.f & REACTION_RAN) === 0) {
          throw error;
        }
        try {
          effect2.b.error(error);
          return;
        } catch (e) {
          error = e;
        }
      }
      effect2 = effect2.parent;
    }
    if (dev_fallback_default && error instanceof Error) {
      apply_adjustments(error);
    }
    console.error("EXACT ERROR STACK:", error && error.stack);
    throw error;
  }
  function get_adjustments(error, effect2) {
    const message_descriptor = get_descriptor(error, "message");
    if (message_descriptor && !message_descriptor.configurable)
      return;
    var indent = is_firefox ? "  " : "	";
    var component_stack = `
${indent}in ${effect2.fn?.name || "<unknown>"}`;
    var context = effect2.ctx;
    while (context !== null) {
      component_stack += `
${indent}in ${context.function?.[FILENAME].split("/").pop()}`;
      context = context.p;
    }
    return {
      message: error.message + `
${component_stack}
`,
      stack: error.stack?.split("\n").filter((line) => !line.includes("svelte/src/internal")).join("\n")
    };
  }
  function apply_adjustments(error) {
    const adjusted = adjustments.get(error);
    if (adjusted) {
      define_property(error, "message", {
        value: adjusted.message
      });
      define_property(error, "stack", {
        value: adjusted.stack
      });
    }
  }

  // node_modules/svelte/src/internal/client/reactivity/status.js
  var STATUS_MASK = ~(DIRTY | MAYBE_DIRTY | CLEAN);
  function set_signal_status(signal, status) {
    signal.f = signal.f & STATUS_MASK | status;
  }
  function update_derived_status(derived2) {
    if ((derived2.f & CONNECTED) !== 0 || derived2.deps === null) {
      set_signal_status(derived2, CLEAN);
    } else {
      set_signal_status(derived2, MAYBE_DIRTY);
    }
  }

  // node_modules/svelte/src/internal/client/reactivity/utils.js
  function clear_marked(deps) {
    if (deps === null)
      return;
    for (const dep of deps) {
      if ((dep.f & DERIVED) === 0 || (dep.f & WAS_MARKED) === 0) {
        continue;
      }
      dep.f ^= WAS_MARKED;
      clear_marked(
        /** @type {Derived} */
        dep.deps
      );
    }
  }
  function defer_effect(effect2, dirty_effects, maybe_dirty_effects) {
    if ((effect2.f & DIRTY) !== 0) {
      dirty_effects.add(effect2);
    } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
      maybe_dirty_effects.add(effect2);
    }
    clear_marked(effect2.deps);
    set_signal_status(effect2, CLEAN);
  }

  // node_modules/svelte/src/internal/client/reactivity/batch.js
  var batches = /* @__PURE__ */ new Set();
  var current_batch = null;
  var previous_batch = null;
  var batch_values = null;
  var queued_root_effects = [];
  var last_scheduled_effect = null;
  var is_flushing = false;
  var is_flushing_sync = false;
  var _commit_callbacks, _discard_callbacks, _pending, _blocking_pending, _deferred, _dirty_effects, _maybe_dirty_effects, _skipped_branches, _decrement_queued, _traverse_effect_tree, traverse_effect_tree_fn, _defer_effects, defer_effects_fn, _commit, commit_fn;
  var _Batch = class _Batch {
    constructor() {
      /**
       * Traverse the effect tree, executing effects or stashing
       * them for later execution as appropriate
       * @param {Effect} root
       * @param {Effect[]} effects
       * @param {Effect[]} render_effects
       */
      __privateAdd(this, _traverse_effect_tree);
      /**
       * @param {Effect[]} effects
       */
      __privateAdd(this, _defer_effects);
      __privateAdd(this, _commit);
      __publicField(this, "committed", false);
      /**
       * The current values of any sources that are updated in this batch
       * They keys of this map are identical to `this.#previous`
       * @type {Map<Source, any>}
       */
      __publicField(this, "current", /* @__PURE__ */ new Map());
      /**
       * The values of any sources that are updated in this batch _before_ those updates took place.
       * They keys of this map are identical to `this.#current`
       * @type {Map<Source, any>}
       */
      __publicField(this, "previous", /* @__PURE__ */ new Map());
      /**
       * When the batch is committed (and the DOM is updated), we need to remove old branches
       * and append new ones by calling the functions added inside (if/each/key/etc) blocks
       * @type {Set<() => void>}
       */
      __privateAdd(this, _commit_callbacks, /* @__PURE__ */ new Set());
      /**
       * If a fork is discarded, we need to destroy any effects that are no longer needed
       * @type {Set<(batch: Batch) => void>}
       */
      __privateAdd(this, _discard_callbacks, /* @__PURE__ */ new Set());
      /**
       * The number of async effects that are currently in flight
       */
      __privateAdd(this, _pending, 0);
      /**
       * The number of async effects that are currently in flight, _not_ inside a pending boundary
       */
      __privateAdd(this, _blocking_pending, 0);
      /**
       * A deferred that resolves when the batch is committed, used with `settled()`
       * TODO replace with Promise.withResolvers once supported widely enough
       * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
       */
      __privateAdd(this, _deferred, null);
      /**
       * Deferred effects (which run after async work has completed) that are DIRTY
       * @type {Set<Effect>}
       */
      __privateAdd(this, _dirty_effects, /* @__PURE__ */ new Set());
      /**
       * Deferred effects that are MAYBE_DIRTY
       * @type {Set<Effect>}
       */
      __privateAdd(this, _maybe_dirty_effects, /* @__PURE__ */ new Set());
      /**
       * A map of branches that still exist, but will be destroyed when this batch
       * is committed — we skip over these during `process`.
       * The value contains child effects that were dirty/maybe_dirty before being reset,
       * so they can be rescheduled if the branch survives.
       * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
       */
      __privateAdd(this, _skipped_branches, /* @__PURE__ */ new Map());
      __publicField(this, "is_fork", false);
      __privateAdd(this, _decrement_queued, false);
    }
    is_deferred() {
      return this.is_fork || __privateGet(this, _blocking_pending) > 0;
    }
    /**
     * Add an effect to the #skipped_branches map and reset its children
     * @param {Effect} effect
     */
    skip_effect(effect2) {
      if (!__privateGet(this, _skipped_branches).has(effect2)) {
        __privateGet(this, _skipped_branches).set(effect2, { d: [], m: [] });
      }
    }
    /**
     * Remove an effect from the #skipped_branches map and reschedule
     * any tracked dirty/maybe_dirty child effects
     * @param {Effect} effect
     */
    unskip_effect(effect2) {
      var tracked = __privateGet(this, _skipped_branches).get(effect2);
      if (tracked) {
        __privateGet(this, _skipped_branches).delete(effect2);
        for (var e of tracked.d) {
          set_signal_status(e, DIRTY);
          schedule_effect(e);
        }
        for (e of tracked.m) {
          set_signal_status(e, MAYBE_DIRTY);
          schedule_effect(e);
        }
      }
    }
    /**
     *
     * @param {Effect[]} root_effects
     */
    process(root_effects) {
      queued_root_effects = [];
      this.apply();
      var effects = [];
      var render_effects = [];
      for (const root6 of root_effects) {
        __privateMethod(this, _traverse_effect_tree, traverse_effect_tree_fn).call(this, root6, effects, render_effects);
      }
      if (this.is_deferred()) {
        __privateMethod(this, _defer_effects, defer_effects_fn).call(this, render_effects);
        __privateMethod(this, _defer_effects, defer_effects_fn).call(this, effects);
        for (const [e, t] of __privateGet(this, _skipped_branches)) {
          reset_branch(e, t);
        }
      } else {
        for (const fn of __privateGet(this, _commit_callbacks))
          fn();
        __privateGet(this, _commit_callbacks).clear();
        if (__privateGet(this, _pending) === 0) {
          __privateMethod(this, _commit, commit_fn).call(this);
        }
        previous_batch = this;
        current_batch = null;
        flush_queued_effects(render_effects);
        flush_queued_effects(effects);
        previous_batch = null;
        __privateGet(this, _deferred)?.resolve();
      }
      batch_values = null;
    }
    /**
     * Associate a change to a given source with the current
     * batch, noting its previous and current values
     * @param {Source} source
     * @param {any} value
     */
    capture(source2, value) {
      if (value !== UNINITIALIZED && !this.previous.has(source2)) {
        this.previous.set(source2, value);
      }
      if ((source2.f & ERROR_VALUE) === 0) {
        this.current.set(source2, source2.v);
        batch_values?.set(source2, source2.v);
      }
    }
    activate() {
      current_batch = this;
      this.apply();
    }
    deactivate() {
      if (current_batch !== this)
        return;
      current_batch = null;
      batch_values = null;
    }
    flush() {
      this.activate();
      if (queued_root_effects.length > 0) {
        flush_effects();
        if (current_batch !== null && current_batch !== this) {
          return;
        }
      } else if (__privateGet(this, _pending) === 0) {
        this.process([]);
      }
      this.deactivate();
    }
    discard() {
      for (const fn of __privateGet(this, _discard_callbacks))
        fn(this);
      __privateGet(this, _discard_callbacks).clear();
    }
    /**
     *
     * @param {boolean} blocking
     */
    increment(blocking) {
      __privateSet(this, _pending, __privateGet(this, _pending) + 1);
      if (blocking)
        __privateSet(this, _blocking_pending, __privateGet(this, _blocking_pending) + 1);
    }
    /**
     *
     * @param {boolean} blocking
     */
    decrement(blocking) {
      __privateSet(this, _pending, __privateGet(this, _pending) - 1);
      if (blocking)
        __privateSet(this, _blocking_pending, __privateGet(this, _blocking_pending) - 1);
      if (__privateGet(this, _decrement_queued))
        return;
      __privateSet(this, _decrement_queued, true);
      queue_micro_task(() => {
        __privateSet(this, _decrement_queued, false);
        if (!this.is_deferred()) {
          this.revive();
        } else if (queued_root_effects.length > 0) {
          this.flush();
        }
      });
    }
    revive() {
      for (const e of __privateGet(this, _dirty_effects)) {
        __privateGet(this, _maybe_dirty_effects).delete(e);
        set_signal_status(e, DIRTY);
        schedule_effect(e);
      }
      for (const e of __privateGet(this, _maybe_dirty_effects)) {
        set_signal_status(e, MAYBE_DIRTY);
        schedule_effect(e);
      }
      this.flush();
    }
    /** @param {() => void} fn */
    oncommit(fn) {
      __privateGet(this, _commit_callbacks).add(fn);
    }
    /** @param {(batch: Batch) => void} fn */
    ondiscard(fn) {
      __privateGet(this, _discard_callbacks).add(fn);
    }
    settled() {
      return (__privateGet(this, _deferred) ?? __privateSet(this, _deferred, deferred())).promise;
    }
    static ensure() {
      if (current_batch === null) {
        const batch = current_batch = new _Batch();
        batches.add(current_batch);
        if (!is_flushing_sync) {
          queue_micro_task(() => {
            if (current_batch !== batch) {
              return;
            }
            batch.flush();
          });
        }
      }
      return current_batch;
    }
    apply() {
      if (!async_mode_flag || !this.is_fork && batches.size === 1)
        return;
      batch_values = new Map(this.current);
      for (const batch of batches) {
        if (batch === this)
          continue;
        for (const [source2, previous] of batch.previous) {
          if (!batch_values.has(source2)) {
            batch_values.set(source2, previous);
          }
        }
      }
    }
  };
  _commit_callbacks = new WeakMap();
  _discard_callbacks = new WeakMap();
  _pending = new WeakMap();
  _blocking_pending = new WeakMap();
  _deferred = new WeakMap();
  _dirty_effects = new WeakMap();
  _maybe_dirty_effects = new WeakMap();
  _skipped_branches = new WeakMap();
  _decrement_queued = new WeakMap();
  _traverse_effect_tree = new WeakSet();
  traverse_effect_tree_fn = function(root6, effects, render_effects) {
    root6.f ^= CLEAN;
    var effect2 = root6.first;
    var pending_boundary = null;
    while (effect2 !== null) {
      var flags2 = effect2.f;
      var is_branch = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
      var is_skippable_branch = is_branch && (flags2 & CLEAN) !== 0;
      var skip = is_skippable_branch || (flags2 & INERT) !== 0 || __privateGet(this, _skipped_branches).has(effect2);
      if (async_mode_flag && pending_boundary === null && (flags2 & BOUNDARY_EFFECT) !== 0 && effect2.b?.is_pending) {
        pending_boundary = effect2;
      }
      if (!skip && effect2.fn !== null) {
        if (is_branch) {
          effect2.f ^= CLEAN;
        } else if (pending_boundary !== null && (flags2 & (EFFECT | RENDER_EFFECT | MANAGED_EFFECT)) !== 0) {
          pending_boundary.b.defer_effect(effect2);
        } else if ((flags2 & EFFECT) !== 0) {
          effects.push(effect2);
        } else if (async_mode_flag && (flags2 & (RENDER_EFFECT | MANAGED_EFFECT)) !== 0) {
          render_effects.push(effect2);
        } else if (is_dirty(effect2)) {
          if ((flags2 & BLOCK_EFFECT) !== 0)
            __privateGet(this, _maybe_dirty_effects).add(effect2);
          update_effect(effect2);
        }
        var child2 = effect2.first;
        if (child2 !== null) {
          effect2 = child2;
          continue;
        }
      }
      while (effect2 !== null) {
        if (effect2 === pending_boundary) {
          pending_boundary = null;
        }
        var next2 = effect2.next;
        if (next2 !== null) {
          effect2 = next2;
          break;
        }
        effect2 = effect2.parent;
      }
    }
  };
  _defer_effects = new WeakSet();
  defer_effects_fn = function(effects) {
    for (var i = 0; i < effects.length; i += 1) {
      defer_effect(effects[i], __privateGet(this, _dirty_effects), __privateGet(this, _maybe_dirty_effects));
    }
  };
  _commit = new WeakSet();
  commit_fn = function() {
    var _a2;
    if (batches.size > 1) {
      this.previous.clear();
      var previous_batch_values = batch_values;
      var is_earlier = true;
      for (const batch of batches) {
        if (batch === this) {
          is_earlier = false;
          continue;
        }
        const sources = [];
        for (const [source2, value] of this.current) {
          if (batch.current.has(source2)) {
            if (is_earlier && value !== batch.current.get(source2)) {
              batch.current.set(source2, value);
            } else {
              continue;
            }
          }
          sources.push(source2);
        }
        if (sources.length === 0) {
          continue;
        }
        const others = [...batch.current.keys()].filter((s) => !this.current.has(s));
        if (others.length > 0) {
          var prev_queued_root_effects = queued_root_effects;
          queued_root_effects = [];
          const marked = /* @__PURE__ */ new Set();
          const checked = /* @__PURE__ */ new Map();
          for (const source2 of sources) {
            mark_effects(source2, others, marked, checked);
          }
          if (queued_root_effects.length > 0) {
            current_batch = batch;
            batch.apply();
            for (const root6 of queued_root_effects) {
              __privateMethod(_a2 = batch, _traverse_effect_tree, traverse_effect_tree_fn).call(_a2, root6, [], []);
            }
            batch.deactivate();
          }
          queued_root_effects = prev_queued_root_effects;
        }
      }
      current_batch = null;
      batch_values = previous_batch_values;
    }
    this.committed = true;
    batches.delete(this);
  };
  var Batch = _Batch;
  function flushSync(fn) {
    var was_flushing_sync = is_flushing_sync;
    is_flushing_sync = true;
    try {
      var result;
      if (fn) {
        if (current_batch !== null) {
          flush_effects();
        }
        result = fn();
      }
      while (true) {
        flush_tasks();
        if (queued_root_effects.length === 0) {
          current_batch?.flush();
          if (queued_root_effects.length === 0) {
            last_scheduled_effect = null;
            return (
              /** @type {T} */
              result
            );
          }
        }
        flush_effects();
      }
    } finally {
      is_flushing_sync = was_flushing_sync;
    }
  }
  function flush_effects() {
    is_flushing = true;
    var source_stacks = dev_fallback_default ? /* @__PURE__ */ new Set() : null;
    try {
      var flush_count = 0;
      while (queued_root_effects.length > 0) {
        var batch = Batch.ensure();
        if (flush_count++ > 1e3) {
          if (dev_fallback_default) {
            var updates = /* @__PURE__ */ new Map();
            for (const source2 of batch.current.keys()) {
              for (const [stack2, update2] of source2.updated ?? []) {
                var entry = updates.get(stack2);
                if (!entry) {
                  entry = { error: update2.error, count: 0 };
                  updates.set(stack2, entry);
                }
                entry.count += update2.count;
              }
            }
            for (const update2 of updates.values()) {
              if (update2.error) {
                console.error(update2.error);
              }
            }
          }
          infinite_loop_guard();
        }
        batch.process(queued_root_effects);
        old_values.clear();
        if (dev_fallback_default) {
          for (const source2 of batch.current.keys()) {
            source_stacks.add(source2);
          }
        }
      }
    } finally {
      queued_root_effects = [];
      is_flushing = false;
      last_scheduled_effect = null;
      if (dev_fallback_default) {
        for (
          const source2 of
          /** @type {Set<Source>} */
          source_stacks
        ) {
          source2.updated = null;
        }
      }
    }
  }
  function infinite_loop_guard() {
    try {
      effect_update_depth_exceeded();
    } catch (error) {
      if (dev_fallback_default) {
        define_property(error, "stack", { value: "" });
      }
      invoke_error_boundary(error, last_scheduled_effect);
    }
  }
  var eager_block_effects = null;
  function flush_queued_effects(effects) {
    var length = effects.length;
    if (length === 0)
      return;
    var i = 0;
    while (i < length) {
      var effect2 = effects[i++];
      if ((effect2.f & (DESTROYED | INERT)) === 0 && is_dirty(effect2)) {
        eager_block_effects = /* @__PURE__ */ new Set();
        update_effect(effect2);
        if (effect2.deps === null && effect2.first === null && effect2.nodes === null && effect2.teardown === null && effect2.ac === null) {
          unlink_effect(effect2);
        }
        if (eager_block_effects?.size > 0) {
          old_values.clear();
          for (const e of eager_block_effects) {
            if ((e.f & (DESTROYED | INERT)) !== 0)
              continue;
            const ordered_effects = [e];
            let ancestor = e.parent;
            while (ancestor !== null) {
              if (eager_block_effects.has(ancestor)) {
                eager_block_effects.delete(ancestor);
                ordered_effects.push(ancestor);
              }
              ancestor = ancestor.parent;
            }
            for (let j = ordered_effects.length - 1; j >= 0; j--) {
              const e2 = ordered_effects[j];
              if ((e2.f & (DESTROYED | INERT)) !== 0)
                continue;
              update_effect(e2);
            }
          }
          eager_block_effects.clear();
        }
      }
    }
    eager_block_effects = null;
  }
  function mark_effects(value, sources, marked, checked) {
    if (marked.has(value))
      return;
    marked.add(value);
    if (value.reactions !== null) {
      for (const reaction of value.reactions) {
        const flags2 = reaction.f;
        if ((flags2 & DERIVED) !== 0) {
          mark_effects(
            /** @type {Derived} */
            reaction,
            sources,
            marked,
            checked
          );
        } else if ((flags2 & (ASYNC | BLOCK_EFFECT)) !== 0 && (flags2 & DIRTY) === 0 && depends_on(reaction, sources, checked)) {
          set_signal_status(reaction, DIRTY);
          schedule_effect(
            /** @type {Effect} */
            reaction
          );
        }
      }
    }
  }
  function depends_on(reaction, sources, checked) {
    const depends = checked.get(reaction);
    if (depends !== void 0)
      return depends;
    if (reaction.deps !== null) {
      for (const dep of reaction.deps) {
        if (includes.call(sources, dep)) {
          return true;
        }
        if ((dep.f & DERIVED) !== 0 && depends_on(
          /** @type {Derived} */
          dep,
          sources,
          checked
        )) {
          checked.set(
            /** @type {Derived} */
            dep,
            true
          );
          return true;
        }
      }
    }
    checked.set(reaction, false);
    return false;
  }
  function schedule_effect(signal) {
    var effect2 = last_scheduled_effect = signal;
    while (effect2.parent !== null) {
      effect2 = effect2.parent;
      var flags2 = effect2.f;
      if (is_flushing && effect2 === active_effect && (flags2 & BLOCK_EFFECT) !== 0 && (flags2 & HEAD_EFFECT) === 0) {
        return;
      }
      if ((flags2 & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
        if ((flags2 & CLEAN) === 0)
          return;
        effect2.f ^= CLEAN;
      }
    }
    queued_root_effects.push(effect2);
  }
  function reset_branch(effect2, tracked) {
    if ((effect2.f & BRANCH_EFFECT) !== 0 && (effect2.f & CLEAN) !== 0) {
      return;
    }
    if ((effect2.f & DIRTY) !== 0) {
      tracked.d.push(effect2);
    } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
      tracked.m.push(effect2);
    }
    set_signal_status(effect2, CLEAN);
    var e = effect2.first;
    while (e !== null) {
      reset_branch(e, tracked);
      e = e.next;
    }
  }

  // node_modules/svelte/src/reactivity/create-subscriber.js
  function createSubscriber(start) {
    let subscribers = 0;
    let version = source(0);
    let stop;
    if (dev_fallback_default) {
      tag(version, "createSubscriber version");
    }
    return () => {
      if (effect_tracking()) {
        get(version);
        render_effect(() => {
          if (subscribers === 0) {
            stop = untrack(() => start(() => increment(version)));
          }
          subscribers += 1;
          return () => {
            queue_micro_task(() => {
              subscribers -= 1;
              if (subscribers === 0) {
                stop?.();
                stop = void 0;
                increment(version);
              }
            });
          };
        });
      }
    };
  }

  // node_modules/svelte/src/internal/client/dom/blocks/boundary.js
  var flags = EFFECT_TRANSPARENT | EFFECT_PRESERVED;
  function boundary(node, props, children) {
    new Boundary(node, props, children);
  }
  var _anchor, _hydrate_open, _props, _children, _effect, _main_effect, _pending_effect, _failed_effect, _offscreen_fragment, _local_pending_count, _pending_count, _pending_count_update_queued, _dirty_effects2, _maybe_dirty_effects2, _effect_pending, _effect_pending_subscriber, _hydrate_resolved_content, hydrate_resolved_content_fn, _hydrate_pending_content, hydrate_pending_content_fn, _render, render_fn, _run, run_fn, _update_pending_count, update_pending_count_fn;
  var Boundary = class {
    /**
     * @param {TemplateNode} node
     * @param {BoundaryProps} props
     * @param {((anchor: Node) => void)} children
     */
    constructor(node, props, children) {
      __privateAdd(this, _hydrate_resolved_content);
      __privateAdd(this, _hydrate_pending_content);
      __privateAdd(this, _render);
      /**
       * @template T
       * @param {() => T} fn
       */
      __privateAdd(this, _run);
      /**
       * Updates the pending count associated with the currently visible pending snippet,
       * if any, such that we can replace the snippet with content once work is done
       * @param {1 | -1} d
       */
      __privateAdd(this, _update_pending_count);
      /** @type {Boundary | null} */
      __publicField(this, "parent");
      __publicField(this, "is_pending", false);
      /** @type {TemplateNode} */
      __privateAdd(this, _anchor, void 0);
      /** @type {TemplateNode | null} */
      __privateAdd(this, _hydrate_open, hydrating ? hydrate_node : null);
      /** @type {BoundaryProps} */
      __privateAdd(this, _props, void 0);
      /** @type {((anchor: Node) => void)} */
      __privateAdd(this, _children, void 0);
      /** @type {Effect} */
      __privateAdd(this, _effect, void 0);
      /** @type {Effect | null} */
      __privateAdd(this, _main_effect, null);
      /** @type {Effect | null} */
      __privateAdd(this, _pending_effect, null);
      /** @type {Effect | null} */
      __privateAdd(this, _failed_effect, null);
      /** @type {DocumentFragment | null} */
      __privateAdd(this, _offscreen_fragment, null);
      __privateAdd(this, _local_pending_count, 0);
      __privateAdd(this, _pending_count, 0);
      __privateAdd(this, _pending_count_update_queued, false);
      /** @type {Set<Effect>} */
      __privateAdd(this, _dirty_effects2, /* @__PURE__ */ new Set());
      /** @type {Set<Effect>} */
      __privateAdd(this, _maybe_dirty_effects2, /* @__PURE__ */ new Set());
      /**
       * A source containing the number of pending async deriveds/expressions.
       * Only created if `$effect.pending()` is used inside the boundary,
       * otherwise updating the source results in needless `Batch.ensure()`
       * calls followed by no-op flushes
       * @type {Source<number> | null}
       */
      __privateAdd(this, _effect_pending, null);
      __privateAdd(this, _effect_pending_subscriber, createSubscriber(() => {
        __privateSet(this, _effect_pending, source(__privateGet(this, _local_pending_count)));
        if (dev_fallback_default) {
          tag(__privateGet(this, _effect_pending), "$effect.pending()");
        }
        return () => {
          __privateSet(this, _effect_pending, null);
        };
      }));
      __privateSet(this, _anchor, node);
      __privateSet(this, _props, props);
      __privateSet(this, _children, (anchor) => {
        var effect2 = (
          /** @type {Effect} */
          active_effect
        );
        effect2.b = this;
        effect2.f |= BOUNDARY_EFFECT;
        children(anchor);
      });
      this.parent = /** @type {Effect} */
      active_effect.b;
      __privateSet(this, _effect, block(() => {
        if (hydrating) {
          const comment2 = (
            /** @type {Comment} */
            __privateGet(this, _hydrate_open)
          );
          hydrate_next();
          if (comment2.data === HYDRATION_START_ELSE) {
            __privateMethod(this, _hydrate_pending_content, hydrate_pending_content_fn).call(this);
          } else {
            __privateMethod(this, _hydrate_resolved_content, hydrate_resolved_content_fn).call(this);
          }
        } else {
          __privateMethod(this, _render, render_fn).call(this);
        }
      }, flags));
      if (hydrating) {
        __privateSet(this, _anchor, hydrate_node);
      }
    }
    /**
     * Defer an effect inside a pending boundary until the boundary resolves
     * @param {Effect} effect
     */
    defer_effect(effect2) {
      defer_effect(effect2, __privateGet(this, _dirty_effects2), __privateGet(this, _maybe_dirty_effects2));
    }
    /**
     * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
     * @returns {boolean}
     */
    is_rendered() {
      return !this.is_pending && (!this.parent || this.parent.is_rendered());
    }
    has_pending_snippet() {
      return !!__privateGet(this, _props).pending;
    }
    /**
     * Update the source that powers `$effect.pending()` inside this boundary,
     * and controls when the current `pending` snippet (if any) is removed.
     * Do not call from inside the class
     * @param {1 | -1} d
     */
    update_pending_count(d) {
      __privateMethod(this, _update_pending_count, update_pending_count_fn).call(this, d);
      __privateSet(this, _local_pending_count, __privateGet(this, _local_pending_count) + d);
      if (!__privateGet(this, _effect_pending) || __privateGet(this, _pending_count_update_queued))
        return;
      __privateSet(this, _pending_count_update_queued, true);
      queue_micro_task(() => {
        __privateSet(this, _pending_count_update_queued, false);
        if (__privateGet(this, _effect_pending)) {
          internal_set(__privateGet(this, _effect_pending), __privateGet(this, _local_pending_count));
        }
      });
    }
    get_effect_pending() {
      __privateGet(this, _effect_pending_subscriber).call(this);
      return get(
        /** @type {Source<number>} */
        __privateGet(this, _effect_pending)
      );
    }
    /** @param {unknown} error */
    error(error) {
      var onerror = __privateGet(this, _props).onerror;
      let failed = __privateGet(this, _props).failed;
      if (!onerror && !failed) {
        throw error;
      }
      if (__privateGet(this, _main_effect)) {
        destroy_effect(__privateGet(this, _main_effect));
        __privateSet(this, _main_effect, null);
      }
      if (__privateGet(this, _pending_effect)) {
        destroy_effect(__privateGet(this, _pending_effect));
        __privateSet(this, _pending_effect, null);
      }
      if (__privateGet(this, _failed_effect)) {
        destroy_effect(__privateGet(this, _failed_effect));
        __privateSet(this, _failed_effect, null);
      }
      if (hydrating) {
        set_hydrate_node(
          /** @type {TemplateNode} */
          __privateGet(this, _hydrate_open)
        );
        next();
        set_hydrate_node(skip_nodes());
      }
      var did_reset = false;
      var calling_on_error = false;
      const reset2 = () => {
        if (did_reset) {
          svelte_boundary_reset_noop();
          return;
        }
        did_reset = true;
        if (calling_on_error) {
          svelte_boundary_reset_onerror();
        }
        if (__privateGet(this, _failed_effect) !== null) {
          pause_effect(__privateGet(this, _failed_effect), () => {
            __privateSet(this, _failed_effect, null);
          });
        }
        __privateMethod(this, _run, run_fn).call(this, () => {
          Batch.ensure();
          __privateMethod(this, _render, render_fn).call(this);
        });
      };
      queue_micro_task(() => {
        try {
          calling_on_error = true;
          onerror?.(error, reset2);
          calling_on_error = false;
        } catch (error2) {
          invoke_error_boundary(error2, __privateGet(this, _effect) && __privateGet(this, _effect).parent);
        }
        if (failed) {
          __privateSet(this, _failed_effect, __privateMethod(this, _run, run_fn).call(this, () => {
            Batch.ensure();
            try {
              return branch(() => {
                var effect2 = (
                  /** @type {Effect} */
                  active_effect
                );
                effect2.b = this;
                effect2.f |= BOUNDARY_EFFECT;
                failed(
                  __privateGet(this, _anchor),
                  () => error,
                  () => reset2
                );
              });
            } catch (error2) {
              invoke_error_boundary(
                error2,
                /** @type {Effect} */
                __privateGet(this, _effect).parent
              );
              return null;
            }
          }));
        }
      });
    }
  };
  _anchor = new WeakMap();
  _hydrate_open = new WeakMap();
  _props = new WeakMap();
  _children = new WeakMap();
  _effect = new WeakMap();
  _main_effect = new WeakMap();
  _pending_effect = new WeakMap();
  _failed_effect = new WeakMap();
  _offscreen_fragment = new WeakMap();
  _local_pending_count = new WeakMap();
  _pending_count = new WeakMap();
  _pending_count_update_queued = new WeakMap();
  _dirty_effects2 = new WeakMap();
  _maybe_dirty_effects2 = new WeakMap();
  _effect_pending = new WeakMap();
  _effect_pending_subscriber = new WeakMap();
  _hydrate_resolved_content = new WeakSet();
  hydrate_resolved_content_fn = function() {
    try {
      __privateSet(this, _main_effect, branch(() => __privateGet(this, _children).call(this, __privateGet(this, _anchor))));
    } catch (error) {
      this.error(error);
    }
  };
  _hydrate_pending_content = new WeakSet();
  hydrate_pending_content_fn = function() {
    const pending2 = __privateGet(this, _props).pending;
    if (!pending2)
      return;
    this.is_pending = true;
    __privateSet(this, _pending_effect, branch(() => pending2(__privateGet(this, _anchor))));
    queue_micro_task(() => {
      var fragment = __privateSet(this, _offscreen_fragment, document.createDocumentFragment());
      var anchor = create_text();
      fragment.append(anchor);
      __privateSet(this, _main_effect, __privateMethod(this, _run, run_fn).call(this, () => {
        Batch.ensure();
        return branch(() => __privateGet(this, _children).call(this, anchor));
      }));
      if (__privateGet(this, _pending_count) === 0) {
        __privateGet(this, _anchor).before(fragment);
        __privateSet(this, _offscreen_fragment, null);
        pause_effect(
          /** @type {Effect} */
          __privateGet(this, _pending_effect),
          () => {
            __privateSet(this, _pending_effect, null);
          }
        );
        this.is_pending = false;
      }
    });
  };
  _render = new WeakSet();
  render_fn = function() {
    try {
      this.is_pending = this.has_pending_snippet();
      __privateSet(this, _pending_count, 0);
      __privateSet(this, _local_pending_count, 0);
      __privateSet(this, _main_effect, branch(() => {
        __privateGet(this, _children).call(this, __privateGet(this, _anchor));
      }));
      if (__privateGet(this, _pending_count) > 0) {
        var fragment = __privateSet(this, _offscreen_fragment, document.createDocumentFragment());
        move_effect(__privateGet(this, _main_effect), fragment);
        const pending2 = (
          /** @type {(anchor: Node) => void} */
          __privateGet(this, _props).pending
        );
        __privateSet(this, _pending_effect, branch(() => pending2(__privateGet(this, _anchor))));
      } else {
        this.is_pending = false;
      }
    } catch (error) {
      this.error(error);
    }
  };
  _run = new WeakSet();
  run_fn = function(fn) {
    var previous_effect = active_effect;
    var previous_reaction = active_reaction;
    var previous_ctx = component_context;
    set_active_effect(__privateGet(this, _effect));
    set_active_reaction(__privateGet(this, _effect));
    set_component_context(__privateGet(this, _effect).ctx);
    try {
      return fn();
    } catch (e) {
      handle_error(e);
      return null;
    } finally {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_ctx);
    }
  };
  _update_pending_count = new WeakSet();
  update_pending_count_fn = function(d) {
    var _a2;
    if (!this.has_pending_snippet()) {
      if (this.parent) {
        __privateMethod(_a2 = this.parent, _update_pending_count, update_pending_count_fn).call(_a2, d);
      }
      return;
    }
    __privateSet(this, _pending_count, __privateGet(this, _pending_count) + d);
    if (__privateGet(this, _pending_count) === 0) {
      this.is_pending = false;
      for (const e of __privateGet(this, _dirty_effects2)) {
        set_signal_status(e, DIRTY);
        schedule_effect(e);
      }
      for (const e of __privateGet(this, _maybe_dirty_effects2)) {
        set_signal_status(e, MAYBE_DIRTY);
        schedule_effect(e);
      }
      __privateGet(this, _dirty_effects2).clear();
      __privateGet(this, _maybe_dirty_effects2).clear();
      if (__privateGet(this, _pending_effect)) {
        pause_effect(__privateGet(this, _pending_effect), () => {
          __privateSet(this, _pending_effect, null);
        });
      }
      if (__privateGet(this, _offscreen_fragment)) {
        __privateGet(this, _anchor).before(__privateGet(this, _offscreen_fragment));
        __privateSet(this, _offscreen_fragment, null);
      }
    }
  };

  // node_modules/svelte/src/internal/client/reactivity/async.js
  function flatten(blockers, sync, async2, fn) {
    const d = is_runes() ? derived : derived_safe_equal;
    var pending2 = blockers.filter((b) => !b.settled);
    if (async2.length === 0 && pending2.length === 0) {
      fn(sync.map(d));
      return;
    }
    var batch = current_batch;
    var parent = (
      /** @type {Effect} */
      active_effect
    );
    var restore = capture();
    var blocker_promise = pending2.length === 1 ? pending2[0].promise : pending2.length > 1 ? Promise.all(pending2.map((b) => b.promise)) : null;
    function finish(values) {
      restore();
      try {
        fn(values);
      } catch (error) {
        if ((parent.f & DESTROYED) === 0) {
          invoke_error_boundary(error, parent);
        }
      }
      batch?.deactivate();
      unset_context();
    }
    if (async2.length === 0) {
      blocker_promise.then(() => finish(sync.map(d)));
      return;
    }
    function run3() {
      restore();
      Promise.all(async2.map((expression) => async_derived(expression))).then((result) => finish([...sync.map(d), ...result])).catch((error) => invoke_error_boundary(error, parent));
    }
    if (blocker_promise) {
      blocker_promise.then(run3);
    } else {
      run3();
    }
  }
  function capture() {
    var previous_effect = active_effect;
    var previous_reaction = active_reaction;
    var previous_component_context = component_context;
    var previous_batch2 = current_batch;
    if (dev_fallback_default) {
      var previous_dev_stack = dev_stack;
    }
    return function restore(activate_batch = true) {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_component_context);
      if (activate_batch)
        previous_batch2?.activate();
      if (dev_fallback_default) {
        set_from_async_derived(null);
        set_dev_stack(previous_dev_stack);
      }
    };
  }
  function unset_context() {
    set_active_effect(null);
    set_active_reaction(null);
    set_component_context(null);
    if (dev_fallback_default) {
      set_from_async_derived(null);
      set_dev_stack(null);
    }
  }

  // node_modules/svelte/src/internal/client/reactivity/deriveds.js
  var current_async_effect = null;
  function set_from_async_derived(v) {
    current_async_effect = v;
  }
  var recent_async_deriveds = /* @__PURE__ */ new Set();
  // @__NO_SIDE_EFFECTS__
  function derived(fn) {
    var flags2 = DERIVED | DIRTY;
    var parent_derived = active_reaction !== null && (active_reaction.f & DERIVED) !== 0 ? (
      /** @type {Derived} */
      active_reaction
    ) : null;
    if (active_effect !== null) {
      active_effect.f |= EFFECT_PRESERVED;
    }
    const signal = {
      ctx: component_context,
      deps: null,
      effects: null,
      equals,
      f: flags2,
      fn,
      reactions: null,
      rv: 0,
      v: (
        /** @type {V} */
        UNINITIALIZED
      ),
      wv: 0,
      parent: parent_derived ?? active_effect,
      ac: null
    };
    if (dev_fallback_default && tracing_mode_flag) {
      signal.created = get_error("created at");
    }
    return signal;
  }
  // @__NO_SIDE_EFFECTS__
  function async_derived(fn, label, location) {
    let parent = (
      /** @type {Effect | null} */
      active_effect
    );
    if (parent === null) {
      async_derived_orphan();
    }
    var boundary2 = (
      /** @type {Boundary} */
      parent.b
    );
    var promise = (
      /** @type {Promise<V>} */
      /** @type {unknown} */
      void 0
    );
    var signal = source(
      /** @type {V} */
      UNINITIALIZED
    );
    if (dev_fallback_default)
      signal.label = label;
    var should_suspend = !active_reaction;
    var deferreds = /* @__PURE__ */ new Map();
    async_effect(() => {
      if (dev_fallback_default)
        current_async_effect = active_effect;
      var d = deferred();
      promise = d.promise;
      try {
        Promise.resolve(fn()).then(d.resolve, d.reject).then(() => {
          if (batch === current_batch && batch.committed) {
            batch.deactivate();
          }
          unset_context();
        });
      } catch (error) {
        d.reject(error);
        unset_context();
      }
      if (dev_fallback_default)
        current_async_effect = null;
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      if (should_suspend) {
        var blocking = boundary2.is_rendered();
        boundary2.update_pending_count(1);
        batch.increment(blocking);
        deferreds.get(batch)?.reject(STALE_REACTION);
        deferreds.delete(batch);
        deferreds.set(batch, d);
      }
      const handler = (value, error = void 0) => {
        current_async_effect = null;
        batch.activate();
        if (error) {
          if (error !== STALE_REACTION) {
            signal.f |= ERROR_VALUE;
            internal_set(signal, error);
          }
        } else {
          if ((signal.f & ERROR_VALUE) !== 0) {
            signal.f ^= ERROR_VALUE;
          }
          internal_set(signal, value);
          for (const [b, d2] of deferreds) {
            deferreds.delete(b);
            if (b === batch)
              break;
            d2.reject(STALE_REACTION);
          }
          if (dev_fallback_default && location !== void 0) {
            recent_async_deriveds.add(signal);
            setTimeout(() => {
              if (recent_async_deriveds.has(signal)) {
                await_waterfall(
                  /** @type {string} */
                  signal.label,
                  location
                );
                recent_async_deriveds.delete(signal);
              }
            });
          }
        }
        if (should_suspend) {
          boundary2.update_pending_count(-1);
          batch.decrement(blocking);
        }
      };
      d.promise.then(handler, (e) => handler(null, e || "unknown"));
    });
    teardown(() => {
      for (const d of deferreds.values()) {
        d.reject(STALE_REACTION);
      }
    });
    if (dev_fallback_default) {
      signal.f |= ASYNC;
    }
    return new Promise((fulfil) => {
      function next2(p) {
        function go() {
          if (p === promise) {
            fulfil(signal);
          } else {
            next2(promise);
          }
        }
        p.then(go, go);
      }
      next2(promise);
    });
  }
  // @__NO_SIDE_EFFECTS__
  function user_derived(fn) {
    const d = /* @__PURE__ */ derived(fn);
    if (!async_mode_flag)
      push_reaction_value(d);
    return d;
  }
  // @__NO_SIDE_EFFECTS__
  function derived_safe_equal(fn) {
    const signal = /* @__PURE__ */ derived(fn);
    signal.equals = safe_equals;
    return signal;
  }
  function destroy_derived_effects(derived2) {
    var effects = derived2.effects;
    if (effects !== null) {
      derived2.effects = null;
      for (var i = 0; i < effects.length; i += 1) {
        destroy_effect(
          /** @type {Effect} */
          effects[i]
        );
      }
    }
  }
  var stack = [];
  function get_derived_parent_effect(derived2) {
    var parent = derived2.parent;
    while (parent !== null) {
      if ((parent.f & DERIVED) === 0) {
        return (parent.f & DESTROYED) === 0 ? (
          /** @type {Effect} */
          parent
        ) : null;
      }
      parent = parent.parent;
    }
    return null;
  }
  function execute_derived(derived2) {
    var value;
    var prev_active_effect = active_effect;
    set_active_effect(get_derived_parent_effect(derived2));
    if (dev_fallback_default) {
      let prev_eager_effects = eager_effects;
      set_eager_effects(/* @__PURE__ */ new Set());
      try {
        if (includes.call(stack, derived2)) {
          derived_references_self();
        }
        stack.push(derived2);
        derived2.f &= ~WAS_MARKED;
        destroy_derived_effects(derived2);
        value = update_reaction(derived2);
      } finally {
        set_active_effect(prev_active_effect);
        set_eager_effects(prev_eager_effects);
        stack.pop();
      }
    } else {
      try {
        derived2.f &= ~WAS_MARKED;
        destroy_derived_effects(derived2);
        value = update_reaction(derived2);
      } finally {
        set_active_effect(prev_active_effect);
      }
    }
    return value;
  }
  function update_derived(derived2) {
    var value = execute_derived(derived2);
    if (!derived2.equals(value)) {
      derived2.wv = increment_write_version();
      if (!current_batch?.is_fork || derived2.deps === null) {
        derived2.v = value;
        if (derived2.deps === null) {
          set_signal_status(derived2, CLEAN);
          return;
        }
      }
    }
    if (is_destroying_effect) {
      return;
    }
    if (batch_values !== null) {
      if (effect_tracking() || current_batch?.is_fork) {
        batch_values.set(derived2, value);
      }
    } else {
      update_derived_status(derived2);
    }
  }
  function freeze_derived_effects(derived2) {
    if (derived2.effects === null)
      return;
    for (const e of derived2.effects) {
      if (e.teardown || e.ac) {
        e.teardown?.();
        e.ac?.abort(STALE_REACTION);
        e.teardown = noop;
        e.ac = null;
        remove_reactions(e, 0);
        destroy_effect_children(e);
      }
    }
  }
  function unfreeze_derived_effects(derived2) {
    if (derived2.effects === null)
      return;
    for (const e of derived2.effects) {
      if (e.teardown) {
        update_effect(e);
      }
    }
  }

  // node_modules/svelte/src/internal/client/reactivity/sources.js
  var eager_effects = /* @__PURE__ */ new Set();
  var old_values = /* @__PURE__ */ new Map();
  function set_eager_effects(v) {
    eager_effects = v;
  }
  var eager_effects_deferred = false;
  function set_eager_effects_deferred() {
    eager_effects_deferred = true;
  }
  function source(v, stack2) {
    var signal = {
      f: 0,
      // TODO ideally we could skip this altogether, but it causes type errors
      v,
      reactions: null,
      equals,
      rv: 0,
      wv: 0
    };
    if (dev_fallback_default && tracing_mode_flag) {
      signal.created = stack2 ?? get_error("created at");
      signal.updated = null;
      signal.set_during_effect = false;
      signal.trace = null;
    }
    return signal;
  }
  // @__NO_SIDE_EFFECTS__
  function state(v, stack2) {
    const s = source(v, stack2);
    push_reaction_value(s);
    return s;
  }
  // @__NO_SIDE_EFFECTS__
  function mutable_source(initial_value, immutable = false, trackable = true) {
    var _a2;
    const s = source(initial_value);
    if (!immutable) {
      s.equals = safe_equals;
    }
    if (legacy_mode_flag && trackable && component_context !== null && component_context.l !== null) {
      ((_a2 = component_context.l).s ?? (_a2.s = [])).push(s);
    }
    return s;
  }
  function set(source2, value, should_proxy = false) {
    if (active_reaction !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
    // to ensure we error if state is set inside an inspect effect
    (!untracking || (active_reaction.f & EAGER_EFFECT) !== 0) && is_runes() && (active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | EAGER_EFFECT)) !== 0 && (current_sources === null || !includes.call(current_sources, source2))) {
      state_unsafe_mutation();
    }
    let new_value = should_proxy ? proxy(value) : value;
    if (dev_fallback_default) {
      tag_proxy(
        new_value,
        /** @type {string} */
        source2.label
      );
    }
    return internal_set(source2, new_value);
  }
  function internal_set(source2, value) {
    if (!source2.equals(value)) {
      var old_value = source2.v;
      if (is_destroying_effect) {
        old_values.set(source2, value);
      } else {
        old_values.set(source2, old_value);
      }
      source2.v = value;
      var batch = Batch.ensure();
      batch.capture(source2, old_value);
      if (dev_fallback_default) {
        if (tracing_mode_flag || active_effect !== null) {
          source2.updated ?? (source2.updated = /* @__PURE__ */ new Map());
          const count = (source2.updated.get("")?.count ?? 0) + 1;
          source2.updated.set("", { error: (
            /** @type {any} */
            null
          ), count });
          if (tracing_mode_flag || count > 5) {
            const error = get_error("updated at");
            if (error !== null) {
              let entry = source2.updated.get(error.stack);
              if (!entry) {
                entry = { error, count: 0 };
                source2.updated.set(error.stack, entry);
              }
              entry.count++;
            }
          }
        }
        if (active_effect !== null) {
          source2.set_during_effect = true;
        }
      }
      if ((source2.f & DERIVED) !== 0) {
        const derived2 = (
          /** @type {Derived} */
          source2
        );
        if ((source2.f & DIRTY) !== 0) {
          execute_derived(derived2);
        }
        update_derived_status(derived2);
      }
      source2.wv = increment_write_version();
      mark_reactions(source2, DIRTY);
      if (is_runes() && active_effect !== null && (active_effect.f & CLEAN) !== 0 && (active_effect.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0) {
        if (untracked_writes === null) {
          set_untracked_writes([source2]);
        } else {
          untracked_writes.push(source2);
        }
      }
      if (!batch.is_fork && eager_effects.size > 0 && !eager_effects_deferred) {
        flush_eager_effects();
      }
    }
    return value;
  }
  function flush_eager_effects() {
    eager_effects_deferred = false;
    for (const effect2 of eager_effects) {
      if ((effect2.f & CLEAN) !== 0) {
        set_signal_status(effect2, MAYBE_DIRTY);
      }
      if (is_dirty(effect2)) {
        update_effect(effect2);
      }
    }
    eager_effects.clear();
  }
  function increment(source2) {
    set(source2, source2.v + 1);
  }
  function mark_reactions(signal, status) {
    var reactions = signal.reactions;
    if (reactions === null)
      return;
    var runes = is_runes();
    var length = reactions.length;
    for (var i = 0; i < length; i++) {
      var reaction = reactions[i];
      var flags2 = reaction.f;
      if (!runes && reaction === active_effect)
        continue;
      if (dev_fallback_default && (flags2 & EAGER_EFFECT) !== 0) {
        eager_effects.add(reaction);
        continue;
      }
      var not_dirty = (flags2 & DIRTY) === 0;
      if (not_dirty) {
        set_signal_status(reaction, status);
      }
      if ((flags2 & DERIVED) !== 0) {
        var derived2 = (
          /** @type {Derived} */
          reaction
        );
        batch_values?.delete(derived2);
        if ((flags2 & WAS_MARKED) === 0) {
          if (flags2 & CONNECTED) {
            reaction.f |= WAS_MARKED;
          }
          mark_reactions(derived2, MAYBE_DIRTY);
        }
      } else if (not_dirty) {
        if ((flags2 & BLOCK_EFFECT) !== 0 && eager_block_effects !== null) {
          eager_block_effects.add(
            /** @type {Effect} */
            reaction
          );
        }
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }

  // node_modules/svelte/src/internal/client/proxy.js
  var regex_is_valid_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
  function proxy(value) {
    if (typeof value !== "object" || value === null || STATE_SYMBOL in value) {
      return value;
    }
    const prototype = get_prototype_of(value);
    if (prototype !== object_prototype && prototype !== array_prototype) {
      return value;
    }
    var sources = /* @__PURE__ */ new Map();
    var is_proxied_array = is_array(value);
    var version = state(0);
    var stack2 = dev_fallback_default && tracing_mode_flag ? get_error("created at") : null;
    var parent_version = update_version;
    var with_parent = (fn) => {
      if (update_version === parent_version) {
        return fn();
      }
      var reaction = active_reaction;
      var version2 = update_version;
      set_active_reaction(null);
      set_update_version(parent_version);
      var result = fn();
      set_active_reaction(reaction);
      set_update_version(version2);
      return result;
    };
    if (is_proxied_array) {
      sources.set("length", state(
        /** @type {any[]} */
        value.length,
        stack2
      ));
      if (dev_fallback_default) {
        value = /** @type {any} */
        inspectable_array(
          /** @type {any[]} */
          value
        );
      }
    }
    var path = "";
    let updating = false;
    function update_path(new_path) {
      if (updating)
        return;
      updating = true;
      path = new_path;
      tag(version, `${path} version`);
      for (const [prop2, source2] of sources) {
        tag(source2, get_label(path, prop2));
      }
      updating = false;
    }
    return new Proxy(
      /** @type {any} */
      value,
      {
        defineProperty(_, prop2, descriptor) {
          if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) {
            state_descriptors_fixed();
          }
          var s = sources.get(prop2);
          if (s === void 0) {
            with_parent(() => {
              var s2 = state(descriptor.value, stack2);
              sources.set(prop2, s2);
              if (dev_fallback_default && typeof prop2 === "string") {
                tag(s2, get_label(path, prop2));
              }
              return s2;
            });
          } else {
            set(s, descriptor.value, true);
          }
          return true;
        },
        deleteProperty(target, prop2) {
          var s = sources.get(prop2);
          if (s === void 0) {
            if (prop2 in target) {
              const s2 = with_parent(() => state(UNINITIALIZED, stack2));
              sources.set(prop2, s2);
              increment(version);
              if (dev_fallback_default) {
                tag(s2, get_label(path, prop2));
              }
            }
          } else {
            set(s, UNINITIALIZED);
            increment(version);
          }
          return true;
        },
        get(target, prop2, receiver) {
          if (prop2 === STATE_SYMBOL) {
            return value;
          }
          if (dev_fallback_default && prop2 === PROXY_PATH_SYMBOL) {
            return update_path;
          }
          var s = sources.get(prop2);
          var exists = prop2 in target;
          if (s === void 0 && (!exists || get_descriptor(target, prop2)?.writable)) {
            s = with_parent(() => {
              var p = proxy(exists ? target[prop2] : UNINITIALIZED);
              var s2 = state(p, stack2);
              if (dev_fallback_default) {
                tag(s2, get_label(path, prop2));
              }
              return s2;
            });
            sources.set(prop2, s);
          }
          if (s !== void 0) {
            var v = get(s);
            return v === UNINITIALIZED ? void 0 : v;
          }
          return Reflect.get(target, prop2, receiver);
        },
        getOwnPropertyDescriptor(target, prop2) {
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
          if (descriptor && "value" in descriptor) {
            var s = sources.get(prop2);
            if (s)
              descriptor.value = get(s);
          } else if (descriptor === void 0) {
            var source2 = sources.get(prop2);
            var value2 = source2?.v;
            if (source2 !== void 0 && value2 !== UNINITIALIZED) {
              return {
                enumerable: true,
                configurable: true,
                value: value2,
                writable: true
              };
            }
          }
          return descriptor;
        },
        has(target, prop2) {
          if (prop2 === STATE_SYMBOL) {
            return true;
          }
          var s = sources.get(prop2);
          var has = s !== void 0 && s.v !== UNINITIALIZED || Reflect.has(target, prop2);
          if (s !== void 0 || active_effect !== null && (!has || get_descriptor(target, prop2)?.writable)) {
            if (s === void 0) {
              s = with_parent(() => {
                var p = has ? proxy(target[prop2]) : UNINITIALIZED;
                var s2 = state(p, stack2);
                if (dev_fallback_default) {
                  tag(s2, get_label(path, prop2));
                }
                return s2;
              });
              sources.set(prop2, s);
            }
            var value2 = get(s);
            if (value2 === UNINITIALIZED) {
              return false;
            }
          }
          return has;
        },
        set(target, prop2, value2, receiver) {
          var s = sources.get(prop2);
          var has = prop2 in target;
          if (is_proxied_array && prop2 === "length") {
            for (var i = value2; i < /** @type {Source<number>} */
            s.v; i += 1) {
              var other_s = sources.get(i + "");
              if (other_s !== void 0) {
                set(other_s, UNINITIALIZED);
              } else if (i in target) {
                other_s = with_parent(() => state(UNINITIALIZED, stack2));
                sources.set(i + "", other_s);
                if (dev_fallback_default) {
                  tag(other_s, get_label(path, i));
                }
              }
            }
          }
          if (s === void 0) {
            if (!has || get_descriptor(target, prop2)?.writable) {
              s = with_parent(() => state(void 0, stack2));
              if (dev_fallback_default) {
                tag(s, get_label(path, prop2));
              }
              set(s, proxy(value2));
              sources.set(prop2, s);
            }
          } else {
            has = s.v !== UNINITIALIZED;
            var p = with_parent(() => proxy(value2));
            set(s, p);
          }
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
          if (descriptor?.set) {
            descriptor.set.call(receiver, value2);
          }
          if (!has) {
            if (is_proxied_array && typeof prop2 === "string") {
              var ls = (
                /** @type {Source<number>} */
                sources.get("length")
              );
              var n = Number(prop2);
              if (Number.isInteger(n) && n >= ls.v) {
                set(ls, n + 1);
              }
            }
            increment(version);
          }
          return true;
        },
        ownKeys(target) {
          get(version);
          var own_keys = Reflect.ownKeys(target).filter((key3) => {
            var source3 = sources.get(key3);
            return source3 === void 0 || source3.v !== UNINITIALIZED;
          });
          for (var [key2, source2] of sources) {
            if (source2.v !== UNINITIALIZED && !(key2 in target)) {
              own_keys.push(key2);
            }
          }
          return own_keys;
        },
        setPrototypeOf() {
          state_prototype_fixed();
        }
      }
    );
  }
  function get_label(path, prop2) {
    if (typeof prop2 === "symbol")
      return `${path}[Symbol(${prop2.description ?? ""})]`;
    if (regex_is_valid_identifier.test(prop2))
      return `${path}.${prop2}`;
    return /^\d+$/.test(prop2) ? `${path}[${prop2}]` : `${path}['${prop2}']`;
  }
  function get_proxied_value(value) {
    try {
      if (value !== null && typeof value === "object" && STATE_SYMBOL in value) {
        return value[STATE_SYMBOL];
      }
    } catch {
    }
    return value;
  }
  var ARRAY_MUTATING_METHODS = /* @__PURE__ */ new Set([
    "copyWithin",
    "fill",
    "pop",
    "push",
    "reverse",
    "shift",
    "sort",
    "splice",
    "unshift"
  ]);
  function inspectable_array(array) {
    return new Proxy(array, {
      get(target, prop2, receiver) {
        var value = Reflect.get(target, prop2, receiver);
        if (!ARRAY_MUTATING_METHODS.has(
          /** @type {string} */
          prop2
        )) {
          return value;
        }
        return function(...args) {
          set_eager_effects_deferred();
          var result = value.apply(this, args);
          flush_eager_effects();
          return result;
        };
      }
    });
  }

  // node_modules/svelte/src/internal/client/dev/equality.js
  function init_array_prototype_warnings() {
    const array_prototype2 = Array.prototype;
    const cleanup = Array.__svelte_cleanup;
    if (cleanup) {
      cleanup();
    }
    const { indexOf, lastIndexOf, includes: includes2 } = array_prototype2;
    array_prototype2.indexOf = function(item, from_index) {
      const index2 = indexOf.call(this, item, from_index);
      if (index2 === -1) {
        for (let i = from_index ?? 0; i < this.length; i += 1) {
          if (get_proxied_value(this[i]) === item) {
            state_proxy_equality_mismatch("array.indexOf(...)");
            break;
          }
        }
      }
      return index2;
    };
    array_prototype2.lastIndexOf = function(item, from_index) {
      const index2 = lastIndexOf.call(this, item, from_index ?? this.length - 1);
      if (index2 === -1) {
        for (let i = 0; i <= (from_index ?? this.length - 1); i += 1) {
          if (get_proxied_value(this[i]) === item) {
            state_proxy_equality_mismatch("array.lastIndexOf(...)");
            break;
          }
        }
      }
      return index2;
    };
    array_prototype2.includes = function(item, from_index) {
      const has = includes2.call(this, item, from_index);
      if (!has) {
        for (let i = 0; i < this.length; i += 1) {
          if (get_proxied_value(this[i]) === item) {
            state_proxy_equality_mismatch("array.includes(...)");
            break;
          }
        }
      }
      return has;
    };
    Array.__svelte_cleanup = () => {
      array_prototype2.indexOf = indexOf;
      array_prototype2.lastIndexOf = lastIndexOf;
      array_prototype2.includes = includes2;
    };
  }

  // node_modules/svelte/src/internal/client/dom/operations.js
  var $window;
  var $document;
  var is_firefox;
  var first_child_getter;
  var next_sibling_getter;
  function init_operations() {
    if ($window !== void 0) {
      return;
    }
    $window = window;
    $document = document;
    is_firefox = /Firefox/.test(navigator.userAgent);
    var element_prototype = Element.prototype;
    var node_prototype = Node.prototype;
    var text_prototype = Text.prototype;
    first_child_getter = get_descriptor(node_prototype, "firstChild").get;
    next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
    if (is_extensible(element_prototype)) {
      element_prototype.__click = void 0;
      element_prototype.__className = void 0;
      element_prototype.__attributes = null;
      element_prototype.__style = void 0;
      element_prototype.__e = void 0;
    }
    if (is_extensible(text_prototype)) {
      text_prototype.__t = void 0;
    }
    if (dev_fallback_default) {
      element_prototype.__svelte_meta = null;
      init_array_prototype_warnings();
    }
  }
  function create_text(value = "") {
    return document.createTextNode(value);
  }
  // @__NO_SIDE_EFFECTS__
  function get_first_child(node) {
    return (
      /** @type {TemplateNode | null} */
      first_child_getter.call(node)
    );
  }
  // @__NO_SIDE_EFFECTS__
  function get_next_sibling(node) {
    return (
      /** @type {TemplateNode | null} */
      next_sibling_getter.call(node)
    );
  }
  function child(node, is_text) {
    if (!hydrating) {
      return /* @__PURE__ */ get_first_child(node);
    }
    var child2 = /* @__PURE__ */ get_first_child(hydrate_node);
    if (child2 === null) {
      child2 = hydrate_node.appendChild(create_text());
    } else if (is_text && child2.nodeType !== TEXT_NODE) {
      var text2 = create_text();
      child2?.before(text2);
      set_hydrate_node(text2);
      return text2;
    }
    if (is_text) {
      merge_text_nodes(
        /** @type {Text} */
        child2
      );
    }
    set_hydrate_node(child2);
    return child2;
  }
  function first_child(node, is_text = false) {
    if (!hydrating) {
      var first = /* @__PURE__ */ get_first_child(node);
      if (first instanceof Comment && first.data === "")
        return /* @__PURE__ */ get_next_sibling(first);
      return first;
    }
    if (is_text) {
      if (hydrate_node?.nodeType !== TEXT_NODE) {
        var text2 = create_text();
        hydrate_node?.before(text2);
        set_hydrate_node(text2);
        return text2;
      }
      merge_text_nodes(
        /** @type {Text} */
        hydrate_node
      );
    }
    return hydrate_node;
  }
  function sibling(node, count = 1, is_text = false) {
    let next_sibling = hydrating ? hydrate_node : node;
    var last_sibling;
    while (count--) {
      last_sibling = next_sibling;
      next_sibling = /** @type {TemplateNode} */
      /* @__PURE__ */ get_next_sibling(next_sibling);
    }
    if (!hydrating) {
      return next_sibling;
    }
    if (is_text) {
      if (next_sibling?.nodeType !== TEXT_NODE) {
        var text2 = create_text();
        if (next_sibling === null) {
          last_sibling?.after(text2);
        } else {
          next_sibling.before(text2);
        }
        set_hydrate_node(text2);
        return text2;
      }
      merge_text_nodes(
        /** @type {Text} */
        next_sibling
      );
    }
    set_hydrate_node(next_sibling);
    return next_sibling;
  }
  function clear_text_content(node) {
    node.textContent = "";
  }
  function should_defer_append() {
    if (!async_mode_flag)
      return false;
    if (eager_block_effects !== null)
      return false;
    var flags2 = (
      /** @type {Effect} */
      active_effect.f
    );
    return (flags2 & REACTION_RAN) !== 0;
  }
  function create_element(tag2, namespace, is2) {
    let options = is2 ? { is: is2 } : void 0;
    return (
      /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
      document.createElementNS(namespace ?? NAMESPACE_HTML, tag2, options)
    );
  }
  function merge_text_nodes(text2) {
    if (
      /** @type {string} */
      text2.nodeValue.length < 65536
    ) {
      return;
    }
    let next2 = text2.nextSibling;
    while (next2 !== null && next2.nodeType === TEXT_NODE) {
      next2.remove();
      text2.nodeValue += /** @type {string} */
      next2.nodeValue;
      next2 = text2.nextSibling;
    }
  }

  // node_modules/svelte/src/internal/client/dom/elements/misc.js
  var listening_to_form_reset = false;
  function add_form_reset_listener() {
    if (!listening_to_form_reset) {
      listening_to_form_reset = true;
      document.addEventListener(
        "reset",
        (evt) => {
          Promise.resolve().then(() => {
            if (!evt.defaultPrevented) {
              for (
                const e of
                /**@type {HTMLFormElement} */
                evt.target.elements
              ) {
                e.__on_r?.();
              }
            }
          });
        },
        // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
        { capture: true }
      );
    }
  }

  // node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
  function without_reactive_context(fn) {
    var previous_reaction = active_reaction;
    var previous_effect = active_effect;
    set_active_reaction(null);
    set_active_effect(null);
    try {
      return fn();
    } finally {
      set_active_reaction(previous_reaction);
      set_active_effect(previous_effect);
    }
  }
  function listen_to_event_and_reset_event(element2, event2, handler, on_reset = handler) {
    element2.addEventListener(event2, () => without_reactive_context(handler));
    const prev = element2.__on_r;
    if (prev) {
      element2.__on_r = () => {
        prev();
        on_reset(true);
      };
    } else {
      element2.__on_r = () => on_reset(true);
    }
    add_form_reset_listener();
  }

  // node_modules/svelte/src/internal/client/reactivity/effects.js
  function validate_effect(rune) {
    if (active_effect === null) {
      if (active_reaction === null) {
        effect_orphan(rune);
      }
      effect_in_unowned_derived();
    }
    if (is_destroying_effect) {
      effect_in_teardown(rune);
    }
  }
  function push_effect(effect2, parent_effect) {
    var parent_last = parent_effect.last;
    if (parent_last === null) {
      parent_effect.last = parent_effect.first = effect2;
    } else {
      parent_last.next = effect2;
      effect2.prev = parent_last;
      parent_effect.last = effect2;
    }
  }
  function create_effect(type, fn, sync) {
    var parent = active_effect;
    if (dev_fallback_default) {
      while (parent !== null && (parent.f & EAGER_EFFECT) !== 0) {
        parent = parent.parent;
      }
    }
    if (parent !== null && (parent.f & INERT) !== 0) {
      type |= INERT;
    }
    var effect2 = {
      ctx: component_context,
      deps: null,
      nodes: null,
      f: type | DIRTY | CONNECTED,
      first: null,
      fn,
      last: null,
      next: null,
      parent,
      b: parent && parent.b,
      prev: null,
      teardown: null,
      wv: 0,
      ac: null
    };
    if (dev_fallback_default) {
      effect2.component_function = dev_current_component_function;
    }
    if (sync) {
      try {
        update_effect(effect2);
      } catch (e2) {
        destroy_effect(effect2);
        throw e2;
      }
    } else if (fn !== null) {
      schedule_effect(effect2);
    }
    var e = effect2;
    if (sync && e.deps === null && e.teardown === null && e.nodes === null && e.first === e.last && // either `null`, or a singular child
    (e.f & EFFECT_PRESERVED) === 0) {
      e = e.first;
      if ((type & BLOCK_EFFECT) !== 0 && (type & EFFECT_TRANSPARENT) !== 0 && e !== null) {
        e.f |= EFFECT_TRANSPARENT;
      }
    }
    if (e !== null) {
      e.parent = parent;
      if (parent !== null) {
        push_effect(e, parent);
      }
      if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0 && (type & ROOT_EFFECT) === 0) {
        var derived2 = (
          /** @type {Derived} */
          active_reaction
        );
        (derived2.effects ?? (derived2.effects = [])).push(e);
      }
    }
    return effect2;
  }
  function effect_tracking() {
    return active_reaction !== null && !untracking;
  }
  function teardown(fn) {
    const effect2 = create_effect(RENDER_EFFECT, null, false);
    set_signal_status(effect2, CLEAN);
    effect2.teardown = fn;
    return effect2;
  }
  function user_effect(fn) {
    validate_effect("$effect");
    if (dev_fallback_default) {
      define_property(fn, "name", {
        value: "$effect"
      });
    }
    var flags2 = (
      /** @type {Effect} */
      active_effect.f
    );
    var defer = !active_reaction && (flags2 & BRANCH_EFFECT) !== 0 && (flags2 & REACTION_RAN) === 0;
    if (defer) {
      var context = (
        /** @type {ComponentContext} */
        component_context
      );
      (context.e ?? (context.e = [])).push(fn);
    } else {
      return create_user_effect(fn);
    }
  }
  function create_user_effect(fn) {
    return create_effect(EFFECT | USER_EFFECT, fn, false);
  }
  function effect_root(fn) {
    Batch.ensure();
    const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn, true);
    return () => {
      destroy_effect(effect2);
    };
  }
  function component_root(fn) {
    Batch.ensure();
    const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn, true);
    return (options = {}) => {
      return new Promise((fulfil) => {
        if (options.outro) {
          pause_effect(effect2, () => {
            destroy_effect(effect2);
            fulfil(void 0);
          });
        } else {
          destroy_effect(effect2);
          fulfil(void 0);
        }
      });
    };
  }
  function effect(fn) {
    return create_effect(EFFECT, fn, false);
  }
  function async_effect(fn) {
    return create_effect(ASYNC | EFFECT_PRESERVED, fn, true);
  }
  function render_effect(fn, flags2 = 0) {
    return create_effect(RENDER_EFFECT | flags2, fn, true);
  }
  function template_effect(fn, sync = [], async2 = [], blockers = []) {
    flatten(blockers, sync, async2, (values) => {
      create_effect(RENDER_EFFECT, () => fn(...values.map(get)), true);
    });
  }
  function block(fn, flags2 = 0) {
    var effect2 = create_effect(BLOCK_EFFECT | flags2, fn, true);
    if (dev_fallback_default) {
      effect2.dev_stack = dev_stack;
    }
    return effect2;
  }
  function branch(fn) {
    return create_effect(BRANCH_EFFECT | EFFECT_PRESERVED, fn, true);
  }
  function execute_effect_teardown(effect2) {
    var teardown2 = effect2.teardown;
    if (teardown2 !== null) {
      const previously_destroying_effect = is_destroying_effect;
      const previous_reaction = active_reaction;
      set_is_destroying_effect(true);
      set_active_reaction(null);
      try {
        teardown2.call(null);
      } finally {
        set_is_destroying_effect(previously_destroying_effect);
        set_active_reaction(previous_reaction);
      }
    }
  }
  function destroy_effect_children(signal, remove_dom = false) {
    var effect2 = signal.first;
    signal.first = signal.last = null;
    while (effect2 !== null) {
      const controller = effect2.ac;
      if (controller !== null) {
        without_reactive_context(() => {
          controller.abort(STALE_REACTION);
        });
      }
      var next2 = effect2.next;
      if ((effect2.f & ROOT_EFFECT) !== 0) {
        effect2.parent = null;
      } else {
        destroy_effect(effect2, remove_dom);
      }
      effect2 = next2;
    }
  }
  function destroy_block_effect_children(signal) {
    var effect2 = signal.first;
    while (effect2 !== null) {
      var next2 = effect2.next;
      if ((effect2.f & BRANCH_EFFECT) === 0) {
        destroy_effect(effect2);
      }
      effect2 = next2;
    }
  }
  function destroy_effect(effect2, remove_dom = true) {
    var removed = false;
    if ((remove_dom || (effect2.f & HEAD_EFFECT) !== 0) && effect2.nodes !== null && effect2.nodes.end !== null) {
      remove_effect_dom(
        effect2.nodes.start,
        /** @type {TemplateNode} */
        effect2.nodes.end
      );
      removed = true;
    }
    destroy_effect_children(effect2, remove_dom && !removed);
    remove_reactions(effect2, 0);
    set_signal_status(effect2, DESTROYED);
    var transitions = effect2.nodes && effect2.nodes.t;
    if (transitions !== null) {
      for (const transition2 of transitions) {
        transition2.stop();
      }
    }
    execute_effect_teardown(effect2);
    var parent = effect2.parent;
    if (parent !== null && parent.first !== null) {
      unlink_effect(effect2);
    }
    if (dev_fallback_default) {
      effect2.component_function = null;
    }
    effect2.next = effect2.prev = effect2.teardown = effect2.ctx = effect2.deps = effect2.fn = effect2.nodes = effect2.ac = null;
  }
  function remove_effect_dom(node, end) {
    while (node !== null) {
      var next2 = node === end ? null : get_next_sibling(node);
      node.remove();
      node = next2;
    }
  }
  function unlink_effect(effect2) {
    var parent = effect2.parent;
    var prev = effect2.prev;
    var next2 = effect2.next;
    if (prev !== null)
      prev.next = next2;
    if (next2 !== null)
      next2.prev = prev;
    if (parent !== null) {
      if (parent.first === effect2)
        parent.first = next2;
      if (parent.last === effect2)
        parent.last = prev;
    }
  }
  function pause_effect(effect2, callback, destroy = true) {
    var transitions = [];
    pause_children(effect2, transitions, true);
    var fn = () => {
      if (destroy)
        destroy_effect(effect2);
      if (callback)
        callback();
    };
    var remaining = transitions.length;
    if (remaining > 0) {
      var check = () => --remaining || fn();
      for (var transition2 of transitions) {
        transition2.out(check);
      }
    } else {
      fn();
    }
  }
  function pause_children(effect2, transitions, local) {
    if ((effect2.f & INERT) !== 0)
      return;
    effect2.f ^= INERT;
    var t = effect2.nodes && effect2.nodes.t;
    if (t !== null) {
      for (const transition2 of t) {
        if (transition2.is_global || local) {
          transitions.push(transition2);
        }
      }
    }
    var child2 = effect2.first;
    while (child2 !== null) {
      var sibling2 = child2.next;
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || // If this is a branch effect without a block effect parent,
      // it means the parent block effect was pruned. In that case,
      // transparency information was transferred to the branch effect.
      (child2.f & BRANCH_EFFECT) !== 0 && (effect2.f & BLOCK_EFFECT) !== 0;
      pause_children(child2, transitions, transparent ? local : false);
      child2 = sibling2;
    }
  }
  function resume_effect(effect2) {
    resume_children(effect2, true);
  }
  function resume_children(effect2, local) {
    if ((effect2.f & INERT) === 0)
      return;
    effect2.f ^= INERT;
    if ((effect2.f & CLEAN) === 0) {
      set_signal_status(effect2, DIRTY);
      schedule_effect(effect2);
    }
    var child2 = effect2.first;
    while (child2 !== null) {
      var sibling2 = child2.next;
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
      resume_children(child2, transparent ? local : false);
      child2 = sibling2;
    }
    var t = effect2.nodes && effect2.nodes.t;
    if (t !== null) {
      for (const transition2 of t) {
        if (transition2.is_global || local) {
          transition2.in();
        }
      }
    }
  }
  function move_effect(effect2, fragment) {
    if (!effect2.nodes)
      return;
    var node = effect2.nodes.start;
    var end = effect2.nodes.end;
    while (node !== null) {
      var next2 = node === end ? null : get_next_sibling(node);
      fragment.append(node);
      node = next2;
    }
  }

  // node_modules/svelte/src/internal/client/legacy.js
  var captured_signals = null;

  // node_modules/svelte/src/internal/client/runtime.js
  var is_updating_effect = false;
  var is_destroying_effect = false;
  function set_is_destroying_effect(value) {
    is_destroying_effect = value;
  }
  var active_reaction = null;
  var untracking = false;
  function set_active_reaction(reaction) {
    active_reaction = reaction;
  }
  var active_effect = null;
  function set_active_effect(effect2) {
    active_effect = effect2;
  }
  var current_sources = null;
  function push_reaction_value(value) {
    if (active_reaction !== null && (!async_mode_flag || (active_reaction.f & DERIVED) !== 0)) {
      if (current_sources === null) {
        current_sources = [value];
      } else {
        current_sources.push(value);
      }
    }
  }
  var new_deps = null;
  var skipped_deps = 0;
  var untracked_writes = null;
  function set_untracked_writes(value) {
    untracked_writes = value;
  }
  var write_version = 1;
  var read_version = 0;
  var update_version = read_version;
  function set_update_version(value) {
    update_version = value;
  }
  function increment_write_version() {
    return ++write_version;
  }
  function is_dirty(reaction) {
    var flags2 = reaction.f;
    if ((flags2 & DIRTY) !== 0) {
      return true;
    }
    if (flags2 & DERIVED) {
      reaction.f &= ~WAS_MARKED;
    }
    if ((flags2 & MAYBE_DIRTY) !== 0) {
      var dependencies = (
        /** @type {Value[]} */
        reaction.deps
      );
      var length = dependencies.length;
      for (var i = 0; i < length; i++) {
        var dependency = dependencies[i];
        if (is_dirty(
          /** @type {Derived} */
          dependency
        )) {
          update_derived(
            /** @type {Derived} */
            dependency
          );
        }
        if (dependency.wv > reaction.wv) {
          return true;
        }
      }
      if ((flags2 & CONNECTED) !== 0 && // During time traveling we don't want to reset the status so that
      // traversal of the graph in the other batches still happens
      batch_values === null) {
        set_signal_status(reaction, CLEAN);
      }
    }
    return false;
  }
  function schedule_possible_effect_self_invalidation(signal, effect2, root6 = true) {
    var reactions = signal.reactions;
    if (reactions === null)
      return;
    if (!async_mode_flag && current_sources !== null && includes.call(current_sources, signal)) {
      return;
    }
    for (var i = 0; i < reactions.length; i++) {
      var reaction = reactions[i];
      if ((reaction.f & DERIVED) !== 0) {
        schedule_possible_effect_self_invalidation(
          /** @type {Derived} */
          reaction,
          effect2,
          false
        );
      } else if (effect2 === reaction) {
        if (root6) {
          set_signal_status(reaction, DIRTY);
        } else if ((reaction.f & CLEAN) !== 0) {
          set_signal_status(reaction, MAYBE_DIRTY);
        }
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
  function update_reaction(reaction) {
    var _a2;
    var previous_deps = new_deps;
    var previous_skipped_deps = skipped_deps;
    var previous_untracked_writes = untracked_writes;
    var previous_reaction = active_reaction;
    var previous_sources = current_sources;
    var previous_component_context = component_context;
    var previous_untracking = untracking;
    var previous_update_version = update_version;
    var flags2 = reaction.f;
    new_deps = /** @type {null | Value[]} */
    null;
    skipped_deps = 0;
    untracked_writes = null;
    active_reaction = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
    current_sources = null;
    set_component_context(reaction.ctx);
    untracking = false;
    update_version = ++read_version;
    if (reaction.ac !== null) {
      without_reactive_context(() => {
        reaction.ac.abort(STALE_REACTION);
      });
      reaction.ac = null;
    }
    try {
      reaction.f |= REACTION_IS_UPDATING;
      var fn = (
        /** @type {Function} */
        reaction.fn
      );
      var result = fn();
      reaction.f |= REACTION_RAN;
      var deps = reaction.deps;
      var is_fork = current_batch?.is_fork;
      if (new_deps !== null) {
        var i;
        if (!is_fork) {
          remove_reactions(reaction, skipped_deps);
        }
        if (deps !== null && skipped_deps > 0) {
          deps.length = skipped_deps + new_deps.length;
          for (i = 0; i < new_deps.length; i++) {
            deps[skipped_deps + i] = new_deps[i];
          }
        } else {
          reaction.deps = deps = new_deps;
        }
        if (effect_tracking() && (reaction.f & CONNECTED) !== 0) {
          for (i = skipped_deps; i < deps.length; i++) {
            ((_a2 = deps[i]).reactions ?? (_a2.reactions = [])).push(reaction);
          }
        }
      } else if (!is_fork && deps !== null && skipped_deps < deps.length) {
        remove_reactions(reaction, skipped_deps);
        deps.length = skipped_deps;
      }
      if (is_runes() && untracked_writes !== null && !untracking && deps !== null && (reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0) {
        for (i = 0; i < /** @type {Source[]} */
        untracked_writes.length; i++) {
          schedule_possible_effect_self_invalidation(
            untracked_writes[i],
            /** @type {Effect} */
            reaction
          );
        }
      }
      if (previous_reaction !== null && previous_reaction !== reaction) {
        read_version++;
        if (previous_reaction.deps !== null) {
          for (let i2 = 0; i2 < previous_skipped_deps; i2 += 1) {
            previous_reaction.deps[i2].rv = read_version;
          }
        }
        if (previous_deps !== null) {
          for (const dep of previous_deps) {
            dep.rv = read_version;
          }
        }
        if (untracked_writes !== null) {
          if (previous_untracked_writes === null) {
            previous_untracked_writes = untracked_writes;
          } else {
            previous_untracked_writes.push(.../** @type {Source[]} */
            untracked_writes);
          }
        }
      }
      if ((reaction.f & ERROR_VALUE) !== 0) {
        reaction.f ^= ERROR_VALUE;
      }
      return result;
    } catch (error) {
      return handle_error(error);
    } finally {
      reaction.f ^= REACTION_IS_UPDATING;
      new_deps = previous_deps;
      skipped_deps = previous_skipped_deps;
      untracked_writes = previous_untracked_writes;
      active_reaction = previous_reaction;
      current_sources = previous_sources;
      set_component_context(previous_component_context);
      untracking = previous_untracking;
      update_version = previous_update_version;
    }
  }
  function remove_reaction(signal, dependency) {
    let reactions = dependency.reactions;
    if (reactions !== null) {
      var index2 = index_of.call(reactions, signal);
      if (index2 !== -1) {
        var new_length = reactions.length - 1;
        if (new_length === 0) {
          reactions = dependency.reactions = null;
        } else {
          reactions[index2] = reactions[new_length];
          reactions.pop();
        }
      }
    }
    if (reactions === null && (dependency.f & DERIVED) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
    // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
    // allows us to skip the expensive work of disconnecting and immediately reconnecting it
    (new_deps === null || !includes.call(new_deps, dependency))) {
      var derived2 = (
        /** @type {Derived} */
        dependency
      );
      if ((derived2.f & CONNECTED) !== 0) {
        derived2.f ^= CONNECTED;
        derived2.f &= ~WAS_MARKED;
      }
      update_derived_status(derived2);
      freeze_derived_effects(derived2);
      remove_reactions(derived2, 0);
    }
  }
  function remove_reactions(signal, start_index) {
    var dependencies = signal.deps;
    if (dependencies === null)
      return;
    for (var i = start_index; i < dependencies.length; i++) {
      remove_reaction(signal, dependencies[i]);
    }
  }
  function update_effect(effect2) {
    var flags2 = effect2.f;
    if ((flags2 & DESTROYED) !== 0) {
      return;
    }
    set_signal_status(effect2, CLEAN);
    var previous_effect = active_effect;
    var was_updating_effect = is_updating_effect;
    active_effect = effect2;
    is_updating_effect = true;
    if (dev_fallback_default) {
      var previous_component_fn = dev_current_component_function;
      set_dev_current_component_function(effect2.component_function);
      var previous_stack = (
        /** @type {any} */
        dev_stack
      );
      set_dev_stack(effect2.dev_stack ?? dev_stack);
    }
    try {
      if ((flags2 & (BLOCK_EFFECT | MANAGED_EFFECT)) !== 0) {
        destroy_block_effect_children(effect2);
      } else {
        destroy_effect_children(effect2);
      }
      execute_effect_teardown(effect2);
      var teardown2 = update_reaction(effect2);
      effect2.teardown = typeof teardown2 === "function" ? teardown2 : null;
      effect2.wv = write_version;
      if (dev_fallback_default && tracing_mode_flag && (effect2.f & DIRTY) !== 0 && effect2.deps !== null) {
        for (var dep of effect2.deps) {
          if (dep.set_during_effect) {
            dep.wv = increment_write_version();
            dep.set_during_effect = false;
          }
        }
      }
    } finally {
      is_updating_effect = was_updating_effect;
      active_effect = previous_effect;
      if (dev_fallback_default) {
        set_dev_current_component_function(previous_component_fn);
        set_dev_stack(previous_stack);
      }
    }
  }
  async function tick() {
    if (async_mode_flag) {
      return new Promise((f) => {
        requestAnimationFrame(() => f());
        setTimeout(() => f());
      });
    }
    await Promise.resolve();
    flushSync();
  }
  function get(signal) {
    var flags2 = signal.f;
    var is_derived = (flags2 & DERIVED) !== 0;
    captured_signals?.add(signal);
    if (active_reaction !== null && !untracking) {
      var destroyed = active_effect !== null && (active_effect.f & DESTROYED) !== 0;
      if (!destroyed && (current_sources === null || !includes.call(current_sources, signal))) {
        var deps = active_reaction.deps;
        if ((active_reaction.f & REACTION_IS_UPDATING) !== 0) {
          if (signal.rv < read_version) {
            signal.rv = read_version;
            if (new_deps === null && deps !== null && deps[skipped_deps] === signal) {
              skipped_deps++;
            } else if (new_deps === null) {
              new_deps = [signal];
            } else {
              new_deps.push(signal);
            }
          }
        } else {
          (active_reaction.deps ?? (active_reaction.deps = [])).push(signal);
          var reactions = signal.reactions;
          if (reactions === null) {
            signal.reactions = [active_reaction];
          } else if (!includes.call(reactions, active_reaction)) {
            reactions.push(active_reaction);
          }
        }
      }
    }
    if (dev_fallback_default) {
      recent_async_deriveds.delete(signal);
      if (tracing_mode_flag && !untracking && tracing_expressions !== null && active_reaction !== null && tracing_expressions.reaction === active_reaction) {
        if (signal.trace) {
          signal.trace();
        } else {
          var trace2 = get_error("traced at");
          if (trace2) {
            var entry = tracing_expressions.entries.get(signal);
            if (entry === void 0) {
              entry = { traces: [] };
              tracing_expressions.entries.set(signal, entry);
            }
            var last = entry.traces[entry.traces.length - 1];
            if (trace2.stack !== last?.stack) {
              entry.traces.push(trace2);
            }
          }
        }
      }
    }
    if (is_destroying_effect && old_values.has(signal)) {
      return old_values.get(signal);
    }
    if (is_derived) {
      var derived2 = (
        /** @type {Derived} */
        signal
      );
      if (is_destroying_effect) {
        var value = derived2.v;
        if ((derived2.f & CLEAN) === 0 && derived2.reactions !== null || depends_on_old_values(derived2)) {
          value = execute_derived(derived2);
        }
        old_values.set(derived2, value);
        return value;
      }
      var should_connect = (derived2.f & CONNECTED) === 0 && !untracking && active_reaction !== null && (is_updating_effect || (active_reaction.f & CONNECTED) !== 0);
      var is_new = (derived2.f & REACTION_RAN) === 0;
      if (is_dirty(derived2)) {
        if (should_connect) {
          derived2.f |= CONNECTED;
        }
        update_derived(derived2);
      }
      if (should_connect && !is_new) {
        unfreeze_derived_effects(derived2);
        reconnect(derived2);
      }
    }
    if (batch_values?.has(signal)) {
      return batch_values.get(signal);
    }
    if ((signal.f & ERROR_VALUE) !== 0) {
      throw signal.v;
    }
    return signal.v;
  }
  function reconnect(derived2) {
    derived2.f |= CONNECTED;
    if (derived2.deps === null)
      return;
    for (const dep of derived2.deps) {
      (dep.reactions ?? (dep.reactions = [])).push(derived2);
      if ((dep.f & DERIVED) !== 0 && (dep.f & CONNECTED) === 0) {
        unfreeze_derived_effects(
          /** @type {Derived} */
          dep
        );
        reconnect(
          /** @type {Derived} */
          dep
        );
      }
    }
  }
  function depends_on_old_values(derived2) {
    if (derived2.v === UNINITIALIZED)
      return true;
    if (derived2.deps === null)
      return false;
    for (const dep of derived2.deps) {
      if (old_values.has(dep)) {
        return true;
      }
      if ((dep.f & DERIVED) !== 0 && depends_on_old_values(
        /** @type {Derived} */
        dep
      )) {
        return true;
      }
    }
    return false;
  }
  function untrack(fn) {
    var previous_untracking = untracking;
    try {
      untracking = true;
      return fn();
    } finally {
      untracking = previous_untracking;
    }
  }

  // node_modules/svelte/src/utils.js
  var DOM_BOOLEAN_ATTRIBUTES = [
    "allowfullscreen",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "disabled",
    "formnovalidate",
    "indeterminate",
    "inert",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "seamless",
    "selected",
    "webkitdirectory",
    "defer",
    "disablepictureinpicture",
    "disableremoteplayback"
  ];
  var DOM_PROPERTIES = [
    ...DOM_BOOLEAN_ATTRIBUTES,
    "formNoValidate",
    "isMap",
    "noModule",
    "playsInline",
    "readOnly",
    "value",
    "volume",
    "defaultValue",
    "defaultChecked",
    "srcObject",
    "noValidate",
    "allowFullscreen",
    "disablePictureInPicture",
    "disableRemotePlayback"
  ];
  var PASSIVE_EVENTS = ["touchstart", "touchmove"];
  function is_passive_event(name) {
    return PASSIVE_EVENTS.includes(name);
  }
  var STATE_CREATION_RUNES = (
    /** @type {const} */
    [
      "$state",
      "$state.raw",
      "$derived",
      "$derived.by"
    ]
  );
  var RUNES = (
    /** @type {const} */
    [
      ...STATE_CREATION_RUNES,
      "$state.eager",
      "$state.snapshot",
      "$props",
      "$props.id",
      "$bindable",
      "$effect",
      "$effect.pre",
      "$effect.tracking",
      "$effect.root",
      "$effect.pending",
      "$inspect",
      "$inspect().with",
      "$inspect.trace",
      "$host"
    ]
  );

  // node_modules/svelte/src/internal/client/dev/css.js
  var all_styles = /* @__PURE__ */ new Map();
  function register_style(hash2, style) {
    var styles = all_styles.get(hash2);
    if (!styles) {
      styles = /* @__PURE__ */ new Set();
      all_styles.set(hash2, styles);
    }
    styles.add(style);
  }

  // node_modules/svelte/src/internal/client/dom/elements/events.js
  var event_symbol = Symbol("events");
  var all_registered_events = /* @__PURE__ */ new Set();
  var root_event_handles = /* @__PURE__ */ new Set();
  function create_event(event_name, dom, handler, options = {}) {
    function target_handler(event2) {
      if (!options.capture) {
        handle_event_propagation.call(dom, event2);
      }
      if (!event2.cancelBubble) {
        return without_reactive_context(() => {
          return handler?.call(this, event2);
        });
      }
    }
    if (event_name.startsWith("pointer") || event_name.startsWith("touch") || event_name === "wheel") {
      queue_micro_task(() => {
        dom.addEventListener(event_name, target_handler, options);
      });
    } else {
      dom.addEventListener(event_name, target_handler, options);
    }
    return target_handler;
  }
  function event(event_name, dom, handler, capture2, passive2) {
    var options = { capture: capture2, passive: passive2 };
    var target_handler = create_event(event_name, dom, handler, options);
    if (dom === document.body || // @ts-ignore
    dom === window || // @ts-ignore
    dom === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
    dom instanceof HTMLMediaElement) {
      teardown(() => {
        dom.removeEventListener(event_name, target_handler, options);
      });
    }
  }
  function delegated(event_name, element2, handler) {
    (element2[event_symbol] ?? (element2[event_symbol] = {}))[event_name] = handler;
  }
  function delegate(events) {
    for (var i = 0; i < events.length; i++) {
      all_registered_events.add(events[i]);
    }
    for (var fn of root_event_handles) {
      fn(events);
    }
  }
  var last_propagated_event = null;
  function handle_event_propagation(event2) {
    var handler_element = this;
    var owner_document = (
      /** @type {Node} */
      handler_element.ownerDocument
    );
    var event_name = event2.type;
    var path = event2.composedPath?.() || [];
    var current_target = (
      /** @type {null | Element} */
      path[0] || event2.target
    );
    last_propagated_event = event2;
    var path_idx = 0;
    var handled_at = last_propagated_event === event2 && event2[event_symbol];
    if (handled_at) {
      var at_idx = path.indexOf(handled_at);
      if (at_idx !== -1 && (handler_element === document || handler_element === /** @type {any} */
      window)) {
        event2[event_symbol] = handler_element;
        return;
      }
      var handler_idx = path.indexOf(handler_element);
      if (handler_idx === -1) {
        return;
      }
      if (at_idx <= handler_idx) {
        path_idx = at_idx;
      }
    }
    current_target = /** @type {Element} */
    path[path_idx] || event2.target;
    if (current_target === handler_element)
      return;
    define_property(event2, "currentTarget", {
      configurable: true,
      get() {
        return current_target || owner_document;
      }
    });
    var previous_reaction = active_reaction;
    var previous_effect = active_effect;
    set_active_reaction(null);
    set_active_effect(null);
    try {
      var throw_error;
      var other_errors = [];
      while (current_target !== null) {
        var parent_element = current_target.assignedSlot || current_target.parentNode || /** @type {any} */
        current_target.host || null;
        try {
          var delegated2 = current_target[event_symbol]?.[event_name];
          if (delegated2 != null && (!/** @type {any} */
          current_target.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          event2.target === current_target)) {
            delegated2.call(current_target, event2);
          }
        } catch (error) {
          if (throw_error) {
            other_errors.push(error);
          } else {
            throw_error = error;
          }
        }
        if (event2.cancelBubble || parent_element === handler_element || parent_element === null) {
          break;
        }
        current_target = parent_element;
      }
      if (throw_error) {
        for (let error of other_errors) {
          queueMicrotask(() => {
            throw error;
          });
        }
        throw throw_error;
      }
    } finally {
      event2[event_symbol] = handler_element;
      delete event2.currentTarget;
      set_active_reaction(previous_reaction);
      set_active_effect(previous_effect);
    }
  }

  // node_modules/svelte/src/internal/client/dom/reconciler.js
  var policy = (
    // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
    globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
      /** @param {string} html */
      createHTML: (html2) => {
        return html2;
      }
    })
  );
  function create_trusted_html(html2) {
    return (
      /** @type {string} */
      policy?.createHTML(html2) ?? html2
    );
  }
  function create_fragment_from_html(html2, trusted2 = false) {
    var elem = create_element("template");
    html2 = html2.replaceAll("<!>", "<!---->");
    elem.innerHTML = trusted2 ? create_trusted_html(html2) : html2;
    return elem.content;
  }

  // node_modules/svelte/src/internal/client/dom/template.js
  function assign_nodes(start, end) {
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    if (effect2.nodes === null) {
      effect2.nodes = { start, end, a: null, t: null };
    }
  }
  // @__NO_SIDE_EFFECTS__
  function from_html(content, flags2) {
    var is_fragment = (flags2 & TEMPLATE_FRAGMENT) !== 0;
    var use_import_node = (flags2 & TEMPLATE_USE_IMPORT_NODE) !== 0;
    var node;
    var has_start = !content.startsWith("<!>");
    return () => {
      if (hydrating) {
        assign_nodes(hydrate_node, null);
        return hydrate_node;
      }
      if (node === void 0) {
        node = create_fragment_from_html(has_start ? content : "<!>" + content, true);
        if (!is_fragment)
          node = /** @type {TemplateNode} */
          get_first_child(node);
      }
      var clone = (
        /** @type {TemplateNode} */
        use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true)
      );
      if (is_fragment) {
        var start = (
          /** @type {TemplateNode} */
          get_first_child(clone)
        );
        var end = (
          /** @type {TemplateNode} */
          clone.lastChild
        );
        assign_nodes(start, end);
      } else {
        assign_nodes(clone, clone);
      }
      return clone;
    };
  }
  // @__NO_SIDE_EFFECTS__
  function from_namespace(content, flags2, ns = "svg") {
    var has_start = !content.startsWith("<!>");
    var is_fragment = (flags2 & TEMPLATE_FRAGMENT) !== 0;
    var wrapped = `<${ns}>${has_start ? content : "<!>" + content}</${ns}>`;
    var node;
    return () => {
      if (hydrating) {
        assign_nodes(hydrate_node, null);
        return hydrate_node;
      }
      if (!node) {
        var fragment = (
          /** @type {DocumentFragment} */
          create_fragment_from_html(wrapped, true)
        );
        var root6 = (
          /** @type {Element} */
          get_first_child(fragment)
        );
        if (is_fragment) {
          node = document.createDocumentFragment();
          while (get_first_child(root6)) {
            node.appendChild(
              /** @type {TemplateNode} */
              get_first_child(root6)
            );
          }
        } else {
          node = /** @type {Element} */
          get_first_child(root6);
        }
      }
      var clone = (
        /** @type {TemplateNode} */
        node.cloneNode(true)
      );
      if (is_fragment) {
        var start = (
          /** @type {TemplateNode} */
          get_first_child(clone)
        );
        var end = (
          /** @type {TemplateNode} */
          clone.lastChild
        );
        assign_nodes(start, end);
      } else {
        assign_nodes(clone, clone);
      }
      return clone;
    };
  }
  // @__NO_SIDE_EFFECTS__
  function from_svg(content, flags2) {
    return /* @__PURE__ */ from_namespace(content, flags2, "svg");
  }
  function comment() {
    if (hydrating) {
      assign_nodes(hydrate_node, null);
      return hydrate_node;
    }
    var frag = document.createDocumentFragment();
    var start = document.createComment("");
    var anchor = create_text();
    frag.append(start, anchor);
    assign_nodes(start, anchor);
    return frag;
  }
  function append(anchor, dom) {
    if (hydrating) {
      var effect2 = (
        /** @type {Effect & { nodes: EffectNodes }} */
        active_effect
      );
      if ((effect2.f & REACTION_RAN) === 0 || effect2.nodes.end === null) {
        effect2.nodes.end = hydrate_node;
      }
      hydrate_next();
      return;
    }
    if (anchor === null) {
      return;
    }
    anchor.before(
      /** @type {Node} */
      dom
    );
  }

  // node_modules/svelte/src/internal/client/render.js
  var should_intro = true;
  function set_text(text2, value) {
    var str = value == null ? "" : typeof value === "object" ? value + "" : value;
    if (str !== (text2.__t ?? (text2.__t = text2.nodeValue))) {
      text2.__t = str;
      text2.nodeValue = str + "";
    }
  }
  function mount(component2, options) {
    return _mount(component2, options);
  }
  function hydrate(component2, options) {
    init_operations();
    options.intro = options.intro ?? false;
    const target = options.target;
    const was_hydrating = hydrating;
    const previous_hydrate_node = hydrate_node;
    try {
      var anchor = get_first_child(target);
      while (anchor && (anchor.nodeType !== COMMENT_NODE || /** @type {Comment} */
      anchor.data !== HYDRATION_START)) {
        anchor = get_next_sibling(anchor);
      }
      if (!anchor) {
        throw HYDRATION_ERROR;
      }
      set_hydrating(true);
      set_hydrate_node(
        /** @type {Comment} */
        anchor
      );
      const instance = _mount(component2, { ...options, anchor });
      set_hydrating(false);
      return (
        /**  @type {Exports} */
        instance
      );
    } catch (error) {
      if (error instanceof Error && error.message.split("\n").some((line) => line.startsWith("https://svelte.dev/e/"))) {
        throw error;
      }
      if (error !== HYDRATION_ERROR) {
        console.warn("Failed to hydrate: ", error);
      }
      if (options.recover === false) {
        hydration_failed();
      }
      init_operations();
      clear_text_content(target);
      set_hydrating(false);
      return mount(component2, options);
    } finally {
      set_hydrating(was_hydrating);
      set_hydrate_node(previous_hydrate_node);
    }
  }
  var listeners = /* @__PURE__ */ new Map();
  function _mount(Component, { target, anchor, props = {}, events, context, intro = true }) {
    init_operations();
    var component2 = void 0;
    var unmount2 = component_root(() => {
      var anchor_node = anchor ?? target.appendChild(create_text());
      boundary(
        /** @type {TemplateNode} */
        anchor_node,
        {
          pending: () => {
          }
        },
        (anchor_node2) => {
          push({});
          var ctx = (
            /** @type {ComponentContext} */
            component_context
          );
          if (context)
            ctx.c = context;
          if (events) {
            props.$$events = events;
          }
          if (hydrating) {
            assign_nodes(
              /** @type {TemplateNode} */
              anchor_node2,
              null
            );
          }
          should_intro = intro;
          component2 = Component(anchor_node2, props) || {};
          should_intro = true;
          if (hydrating) {
            active_effect.nodes.end = hydrate_node;
            if (hydrate_node === null || hydrate_node.nodeType !== COMMENT_NODE || /** @type {Comment} */
            hydrate_node.data !== HYDRATION_END) {
              hydration_mismatch();
              throw HYDRATION_ERROR;
            }
          }
          pop();
        }
      );
      var registered_events = /* @__PURE__ */ new Set();
      var event_handle = (events2) => {
        for (var i = 0; i < events2.length; i++) {
          var event_name = events2[i];
          if (registered_events.has(event_name))
            continue;
          registered_events.add(event_name);
          var passive2 = is_passive_event(event_name);
          for (const node of [target, document]) {
            var counts = listeners.get(node);
            if (counts === void 0) {
              counts = /* @__PURE__ */ new Map();
              listeners.set(node, counts);
            }
            var count = counts.get(event_name);
            if (count === void 0) {
              node.addEventListener(event_name, handle_event_propagation, { passive: passive2 });
              counts.set(event_name, 1);
            } else {
              counts.set(event_name, count + 1);
            }
          }
        }
      };
      event_handle(array_from(all_registered_events));
      root_event_handles.add(event_handle);
      return () => {
        for (var event_name of registered_events) {
          for (const node of [target, document]) {
            var counts = (
              /** @type {Map<string, number>} */
              listeners.get(node)
            );
            var count = (
              /** @type {number} */
              counts.get(event_name)
            );
            if (--count == 0) {
              node.removeEventListener(event_name, handle_event_propagation);
              counts.delete(event_name);
              if (counts.size === 0) {
                listeners.delete(node);
              }
            } else {
              counts.set(event_name, count);
            }
          }
        }
        root_event_handles.delete(event_handle);
        if (anchor_node !== anchor) {
          anchor_node.parentNode?.removeChild(anchor_node);
        }
      };
    });
    mounted_components.set(component2, unmount2);
    return component2;
  }
  var mounted_components = /* @__PURE__ */ new WeakMap();
  function unmount(component2, options) {
    const fn = mounted_components.get(component2);
    if (fn) {
      mounted_components.delete(component2);
      return fn(options);
    }
    if (dev_fallback_default) {
      if (STATE_SYMBOL in component2) {
        state_proxy_unmount();
      } else {
        lifecycle_double_unmount();
      }
    }
    return Promise.resolve();
  }

  // node_modules/svelte/src/internal/client/dom/blocks/branches.js
  var _batches, _onscreen, _offscreen, _outroing, _transition, _commit2, _discard;
  var BranchManager = class {
    /**
     * @param {TemplateNode} anchor
     * @param {boolean} transition
     */
    constructor(anchor, transition2 = true) {
      /** @type {TemplateNode} */
      __publicField(this, "anchor");
      /** @type {Map<Batch, Key>} */
      __privateAdd(this, _batches, /* @__PURE__ */ new Map());
      /**
       * Map of keys to effects that are currently rendered in the DOM.
       * These effects are visible and actively part of the document tree.
       * Example:
       * ```
       * {#if condition}
       * 	foo
       * {:else}
       * 	bar
       * {/if}
       * ```
       * Can result in the entries `true->Effect` and `false->Effect`
       * @type {Map<Key, Effect>}
       */
      __privateAdd(this, _onscreen, /* @__PURE__ */ new Map());
      /**
       * Similar to #onscreen with respect to the keys, but contains branches that are not yet
       * in the DOM, because their insertion is deferred.
       * @type {Map<Key, Branch>}
       */
      __privateAdd(this, _offscreen, /* @__PURE__ */ new Map());
      /**
       * Keys of effects that are currently outroing
       * @type {Set<Key>}
       */
      __privateAdd(this, _outroing, /* @__PURE__ */ new Set());
      /**
       * Whether to pause (i.e. outro) on change, or destroy immediately.
       * This is necessary for `<svelte:element>`
       */
      __privateAdd(this, _transition, true);
      __privateAdd(this, _commit2, () => {
        var batch = (
          /** @type {Batch} */
          current_batch
        );
        if (!__privateGet(this, _batches).has(batch))
          return;
        var key2 = (
          /** @type {Key} */
          __privateGet(this, _batches).get(batch)
        );
        var onscreen = __privateGet(this, _onscreen).get(key2);
        if (onscreen) {
          resume_effect(onscreen);
          __privateGet(this, _outroing).delete(key2);
        } else {
          var offscreen = __privateGet(this, _offscreen).get(key2);
          if (offscreen) {
            __privateGet(this, _onscreen).set(key2, offscreen.effect);
            __privateGet(this, _offscreen).delete(key2);
            offscreen.fragment.lastChild.remove();
            this.anchor.before(offscreen.fragment);
            onscreen = offscreen.effect;
          }
        }
        for (const [b, k] of __privateGet(this, _batches)) {
          __privateGet(this, _batches).delete(b);
          if (b === batch) {
            break;
          }
          const offscreen2 = __privateGet(this, _offscreen).get(k);
          if (offscreen2) {
            destroy_effect(offscreen2.effect);
            __privateGet(this, _offscreen).delete(k);
          }
        }
        for (const [k, effect2] of __privateGet(this, _onscreen)) {
          if (k === key2 || __privateGet(this, _outroing).has(k))
            continue;
          const on_destroy = () => {
            const keys = Array.from(__privateGet(this, _batches).values());
            if (keys.includes(k)) {
              var fragment = document.createDocumentFragment();
              move_effect(effect2, fragment);
              fragment.append(create_text());
              __privateGet(this, _offscreen).set(k, { effect: effect2, fragment });
            } else {
              destroy_effect(effect2);
            }
            __privateGet(this, _outroing).delete(k);
            __privateGet(this, _onscreen).delete(k);
          };
          if (__privateGet(this, _transition) || !onscreen) {
            __privateGet(this, _outroing).add(k);
            pause_effect(effect2, on_destroy, false);
          } else {
            on_destroy();
          }
        }
      });
      /**
       * @param {Batch} batch
       */
      __privateAdd(this, _discard, (batch) => {
        __privateGet(this, _batches).delete(batch);
        const keys = Array.from(__privateGet(this, _batches).values());
        for (const [k, branch2] of __privateGet(this, _offscreen)) {
          if (!keys.includes(k)) {
            destroy_effect(branch2.effect);
            __privateGet(this, _offscreen).delete(k);
          }
        }
      });
      this.anchor = anchor;
      __privateSet(this, _transition, transition2);
    }
    /**
     *
     * @param {any} key
     * @param {null | ((target: TemplateNode) => void)} fn
     */
    ensure(key2, fn) {
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      var defer = should_defer_append();
      if (fn && !__privateGet(this, _onscreen).has(key2) && !__privateGet(this, _offscreen).has(key2)) {
        if (defer) {
          var fragment = document.createDocumentFragment();
          var target = create_text();
          fragment.append(target);
          __privateGet(this, _offscreen).set(key2, {
            effect: branch(() => fn(target)),
            fragment
          });
        } else {
          __privateGet(this, _onscreen).set(
            key2,
            branch(() => fn(this.anchor))
          );
        }
      }
      __privateGet(this, _batches).set(batch, key2);
      if (defer) {
        for (const [k, effect2] of __privateGet(this, _onscreen)) {
          if (k === key2) {
            batch.unskip_effect(effect2);
          } else {
            batch.skip_effect(effect2);
          }
        }
        for (const [k, branch2] of __privateGet(this, _offscreen)) {
          if (k === key2) {
            batch.unskip_effect(branch2.effect);
          } else {
            batch.skip_effect(branch2.effect);
          }
        }
        batch.oncommit(__privateGet(this, _commit2));
        batch.ondiscard(__privateGet(this, _discard));
      } else {
        if (hydrating) {
          this.anchor = hydrate_node;
        }
        __privateGet(this, _commit2).call(this);
      }
    }
  };
  _batches = new WeakMap();
  _onscreen = new WeakMap();
  _offscreen = new WeakMap();
  _outroing = new WeakMap();
  _transition = new WeakMap();
  _commit2 = new WeakMap();
  _discard = new WeakMap();

  // node_modules/svelte/src/internal/client/dom/blocks/if.js
  function if_block(node, fn, elseif = false) {
    if (hydrating) {
      hydrate_next();
    }
    var branches = new BranchManager(node);
    var flags2 = elseif ? EFFECT_TRANSPARENT : 0;
    function update_branch(key2, fn2) {
      if (hydrating) {
        const data = read_hydration_instruction(node);
        var hydrated_key;
        if (data === HYDRATION_START) {
          hydrated_key = 0;
        } else if (data === HYDRATION_START_ELSE) {
          hydrated_key = false;
        } else {
          hydrated_key = parseInt(data.substring(1));
        }
        if (key2 !== hydrated_key) {
          var anchor = skip_nodes();
          set_hydrate_node(anchor);
          branches.anchor = anchor;
          set_hydrating(false);
          branches.ensure(key2, fn2);
          set_hydrating(true);
          return;
        }
      }
      branches.ensure(key2, fn2);
    }
    block(() => {
      var has_branch = false;
      fn((fn2, key2 = 0) => {
        has_branch = true;
        update_branch(key2, fn2);
      });
      if (!has_branch) {
        update_branch(false, null);
      }
    }, flags2);
  }

  // node_modules/svelte/src/internal/client/dom/blocks/key.js
  var NAN = Symbol("NaN");

  // node_modules/svelte/src/internal/client/dom/blocks/each.js
  function index(_, i) {
    return i;
  }
  function pause_effects(state2, to_destroy, controlled_anchor) {
    var transitions = [];
    var length = to_destroy.length;
    var group;
    var remaining = to_destroy.length;
    for (var i = 0; i < length; i++) {
      let effect2 = to_destroy[i];
      pause_effect(
        effect2,
        () => {
          if (group) {
            group.pending.delete(effect2);
            group.done.add(effect2);
            if (group.pending.size === 0) {
              var groups = (
                /** @type {Set<EachOutroGroup>} */
                state2.outrogroups
              );
              destroy_effects(array_from(group.done));
              groups.delete(group);
              if (groups.size === 0) {
                state2.outrogroups = null;
              }
            }
          } else {
            remaining -= 1;
          }
        },
        false
      );
    }
    if (remaining === 0) {
      var fast_path = transitions.length === 0 && controlled_anchor !== null;
      if (fast_path) {
        var anchor = (
          /** @type {Element} */
          controlled_anchor
        );
        var parent_node = (
          /** @type {Element} */
          anchor.parentNode
        );
        clear_text_content(parent_node);
        parent_node.append(anchor);
        state2.items.clear();
      }
      destroy_effects(to_destroy, !fast_path);
    } else {
      group = {
        pending: new Set(to_destroy),
        done: /* @__PURE__ */ new Set()
      };
      (state2.outrogroups ?? (state2.outrogroups = /* @__PURE__ */ new Set())).add(group);
    }
  }
  function destroy_effects(to_destroy, remove_dom = true) {
    for (var i = 0; i < to_destroy.length; i++) {
      destroy_effect(to_destroy[i], remove_dom);
    }
  }
  var offscreen_anchor;
  function each(node, flags2, get_collection, get_key, render_fn2, fallback_fn = null) {
    var anchor = node;
    var items = /* @__PURE__ */ new Map();
    var is_controlled = (flags2 & EACH_IS_CONTROLLED) !== 0;
    if (is_controlled) {
      var parent_node = (
        /** @type {Element} */
        node
      );
      anchor = hydrating ? set_hydrate_node(get_first_child(parent_node)) : parent_node.appendChild(create_text());
    }
    if (hydrating) {
      hydrate_next();
    }
    var fallback2 = null;
    var each_array = derived_safe_equal(() => {
      var collection = get_collection();
      return is_array(collection) ? collection : collection == null ? [] : array_from(collection);
    });
    var array;
    var first_run = true;
    function commit() {
      state2.fallback = fallback2;
      reconcile(state2, array, anchor, flags2, get_key);
      if (fallback2 !== null) {
        if (array.length === 0) {
          if ((fallback2.f & EFFECT_OFFSCREEN) === 0) {
            resume_effect(fallback2);
          } else {
            fallback2.f ^= EFFECT_OFFSCREEN;
            move(fallback2, null, anchor);
          }
        } else {
          pause_effect(fallback2, () => {
            fallback2 = null;
          });
        }
      }
    }
    var effect2 = block(() => {
      array = /** @type {V[]} */
      get(each_array);
      var length = array.length;
      let mismatch = false;
      if (hydrating) {
        var is_else = read_hydration_instruction(anchor) === HYDRATION_START_ELSE;
        if (is_else !== (length === 0)) {
          anchor = skip_nodes();
          set_hydrate_node(anchor);
          set_hydrating(false);
          mismatch = true;
        }
      }
      var keys = /* @__PURE__ */ new Set();
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      var defer = should_defer_append();
      for (var index2 = 0; index2 < length; index2 += 1) {
        if (hydrating && hydrate_node.nodeType === COMMENT_NODE && /** @type {Comment} */
        hydrate_node.data === HYDRATION_END) {
          anchor = /** @type {Comment} */
          hydrate_node;
          mismatch = true;
          set_hydrating(false);
        }
        var value = array[index2];
        var key2 = get_key(value, index2);
        var item = first_run ? null : items.get(key2);
        if (item) {
          if (item.v)
            internal_set(item.v, value);
          if (item.i)
            internal_set(item.i, index2);
          if (defer) {
            batch.unskip_effect(item.e);
          }
        } else {
          item = create_item(
            items,
            first_run ? anchor : offscreen_anchor ?? (offscreen_anchor = create_text()),
            value,
            key2,
            index2,
            render_fn2,
            flags2,
            get_collection
          );
          if (!first_run) {
            item.e.f |= EFFECT_OFFSCREEN;
          }
          items.set(key2, item);
        }
        keys.add(key2);
      }
      if (length === 0 && fallback_fn && !fallback2) {
        if (first_run) {
          fallback2 = branch(() => fallback_fn(anchor));
        } else {
          fallback2 = branch(() => fallback_fn(offscreen_anchor ?? (offscreen_anchor = create_text())));
          fallback2.f |= EFFECT_OFFSCREEN;
        }
      }
      if (length > keys.size) {
        if (dev_fallback_default) {
          validate_each_keys(array, get_key);
        } else {
          each_key_duplicate("", "", "");
        }
      }
      if (hydrating && length > 0) {
        set_hydrate_node(skip_nodes());
      }
      if (!first_run) {
        if (defer) {
          for (const [key3, item2] of items) {
            if (!keys.has(key3)) {
              batch.skip_effect(item2.e);
            }
          }
          batch.oncommit(commit);
          batch.ondiscard(() => {
          });
        } else {
          commit();
        }
      }
      if (mismatch) {
        set_hydrating(true);
      }
      get(each_array);
    });
    var state2 = { effect: effect2, flags: flags2, items, outrogroups: null, fallback: fallback2 };
    first_run = false;
    if (hydrating) {
      anchor = hydrate_node;
    }
  }
  function skip_to_branch(effect2) {
    while (effect2 !== null && (effect2.f & BRANCH_EFFECT) === 0) {
      effect2 = effect2.next;
    }
    return effect2;
  }
  function reconcile(state2, array, anchor, flags2, get_key) {
    var is_animated = (flags2 & EACH_IS_ANIMATED) !== 0;
    var length = array.length;
    var items = state2.items;
    var current = skip_to_branch(state2.effect.first);
    var seen;
    var prev = null;
    var to_animate;
    var matched = [];
    var stashed = [];
    var value;
    var key2;
    var effect2;
    var i;
    if (is_animated) {
      for (i = 0; i < length; i += 1) {
        value = array[i];
        key2 = get_key(value, i);
        effect2 = /** @type {EachItem} */
        items.get(key2).e;
        if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
          effect2.nodes?.a?.measure();
          (to_animate ?? (to_animate = /* @__PURE__ */ new Set())).add(effect2);
        }
      }
    }
    for (i = 0; i < length; i += 1) {
      value = array[i];
      key2 = get_key(value, i);
      effect2 = /** @type {EachItem} */
      items.get(key2).e;
      if (state2.outrogroups !== null) {
        for (const group of state2.outrogroups) {
          group.pending.delete(effect2);
          group.done.delete(effect2);
        }
      }
      if ((effect2.f & EFFECT_OFFSCREEN) !== 0) {
        effect2.f ^= EFFECT_OFFSCREEN;
        if (effect2 === current) {
          move(effect2, null, anchor);
        } else {
          var next2 = prev ? prev.next : current;
          if (effect2 === state2.effect.last) {
            state2.effect.last = effect2.prev;
          }
          if (effect2.prev)
            effect2.prev.next = effect2.next;
          if (effect2.next)
            effect2.next.prev = effect2.prev;
          link(state2, prev, effect2);
          link(state2, effect2, next2);
          move(effect2, next2, anchor);
          prev = effect2;
          matched = [];
          stashed = [];
          current = skip_to_branch(prev.next);
          continue;
        }
      }
      if ((effect2.f & INERT) !== 0) {
        resume_effect(effect2);
        if (is_animated) {
          effect2.nodes?.a?.unfix();
          (to_animate ?? (to_animate = /* @__PURE__ */ new Set())).delete(effect2);
        }
      }
      if (effect2 !== current) {
        if (seen !== void 0 && seen.has(effect2)) {
          if (matched.length < stashed.length) {
            var start = stashed[0];
            var j;
            prev = start.prev;
            var a = matched[0];
            var b = matched[matched.length - 1];
            for (j = 0; j < matched.length; j += 1) {
              move(matched[j], start, anchor);
            }
            for (j = 0; j < stashed.length; j += 1) {
              seen.delete(stashed[j]);
            }
            link(state2, a.prev, b.next);
            link(state2, prev, a);
            link(state2, b, start);
            current = start;
            prev = b;
            i -= 1;
            matched = [];
            stashed = [];
          } else {
            seen.delete(effect2);
            move(effect2, current, anchor);
            link(state2, effect2.prev, effect2.next);
            link(state2, effect2, prev === null ? state2.effect.first : prev.next);
            link(state2, prev, effect2);
            prev = effect2;
          }
          continue;
        }
        matched = [];
        stashed = [];
        while (current !== null && current !== effect2) {
          (seen ?? (seen = /* @__PURE__ */ new Set())).add(current);
          stashed.push(current);
          current = skip_to_branch(current.next);
        }
        if (current === null) {
          continue;
        }
      }
      if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
        matched.push(effect2);
      }
      prev = effect2;
      current = skip_to_branch(effect2.next);
    }
    if (state2.outrogroups !== null) {
      for (const group of state2.outrogroups) {
        if (group.pending.size === 0) {
          destroy_effects(array_from(group.done));
          state2.outrogroups?.delete(group);
        }
      }
      if (state2.outrogroups.size === 0) {
        state2.outrogroups = null;
      }
    }
    if (current !== null || seen !== void 0) {
      var to_destroy = [];
      if (seen !== void 0) {
        for (effect2 of seen) {
          if ((effect2.f & INERT) === 0) {
            to_destroy.push(effect2);
          }
        }
      }
      while (current !== null) {
        if ((current.f & INERT) === 0 && current !== state2.fallback) {
          to_destroy.push(current);
        }
        current = skip_to_branch(current.next);
      }
      var destroy_length = to_destroy.length;
      if (destroy_length > 0) {
        var controlled_anchor = (flags2 & EACH_IS_CONTROLLED) !== 0 && length === 0 ? anchor : null;
        if (is_animated) {
          for (i = 0; i < destroy_length; i += 1) {
            to_destroy[i].nodes?.a?.measure();
          }
          for (i = 0; i < destroy_length; i += 1) {
            to_destroy[i].nodes?.a?.fix();
          }
        }
        pause_effects(state2, to_destroy, controlled_anchor);
      }
    }
    if (is_animated) {
      queue_micro_task(() => {
        if (to_animate === void 0)
          return;
        for (effect2 of to_animate) {
          effect2.nodes?.a?.apply();
        }
      });
    }
  }
  function create_item(items, anchor, value, key2, index2, render_fn2, flags2, get_collection) {
    var v = (flags2 & EACH_ITEM_REACTIVE) !== 0 ? (flags2 & EACH_ITEM_IMMUTABLE) === 0 ? mutable_source(value, false, false) : source(value) : null;
    var i = (flags2 & EACH_INDEX_REACTIVE) !== 0 ? source(index2) : null;
    if (dev_fallback_default && v) {
      v.trace = () => {
        get_collection()[i?.v ?? index2];
      };
    }
    return {
      v,
      i,
      e: branch(() => {
        render_fn2(anchor, v ?? value, i ?? index2, get_collection);
        return () => {
          items.delete(key2);
        };
      })
    };
  }
  function move(effect2, next2, anchor) {
    if (!effect2.nodes)
      return;
    var node = effect2.nodes.start;
    var end = effect2.nodes.end;
    var dest = next2 && (next2.f & EFFECT_OFFSCREEN) === 0 ? (
      /** @type {EffectNodes} */
      next2.nodes.start
    ) : anchor;
    while (node !== null) {
      var next_node = (
        /** @type {TemplateNode} */
        get_next_sibling(node)
      );
      dest.before(node);
      if (node === end) {
        return;
      }
      node = next_node;
    }
  }
  function link(state2, prev, next2) {
    if (prev === null) {
      state2.effect.first = next2;
    } else {
      prev.next = next2;
    }
    if (next2 === null) {
      state2.effect.last = prev;
    } else {
      next2.prev = prev;
    }
  }
  function validate_each_keys(array, key_fn) {
    const keys = /* @__PURE__ */ new Map();
    const length = array.length;
    for (let i = 0; i < length; i++) {
      const key2 = key_fn(array[i], i);
      if (keys.has(key2)) {
        const a = String(keys.get(key2));
        const b = String(i);
        let k = String(key2);
        if (k.startsWith("[object "))
          k = null;
        each_key_duplicate(a, b, k);
      }
      keys.set(key2, i);
    }
  }

  // node_modules/svelte/src/internal/client/dom/css.js
  function append_styles(anchor, css) {
    effect(() => {
      var root6 = (anchor && anchor.getRootNode) ? anchor.getRootNode() : document;
      var target = (root6 && root6.host) ? root6 : ((root6 && root6.head) ?? (root6 && root6.ownerDocument && root6.ownerDocument.head) ?? document.head);
      if (!target) target = document.head;
      if (!target.querySelector("#" + css.hash)) {
        const style = create_element("style");
        style.id = css.hash;
        style.textContent = css.code;
        target.appendChild(style);
        if (dev_fallback_default) {
          register_style(css.hash, style);
        }
      }
    });
  }

  // node_modules/clsx/dist/clsx.mjs
  function r(e) {
    var t, f, n = "";
    if ("string" == typeof e || "number" == typeof e)
      n += e;
    else if ("object" == typeof e)
      if (Array.isArray(e)) {
        var o = e.length;
        for (t = 0; t < o; t++)
          e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
      } else
        for (f in e)
          e[f] && (n && (n += " "), n += f);
    return n;
  }
  function clsx() {
    for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++)
      (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
    return n;
  }

  // node_modules/svelte/src/internal/shared/attributes.js
  function clsx2(value) {
    if (typeof value === "object") {
      return clsx(value);
    } else {
      return value ?? "";
    }
  }
  var whitespace = [..." 	\n\r\f\xA0\v\uFEFF"];
  function to_class(value, hash2, directives) {
    var classname = value == null ? "" : "" + value;
    if (hash2) {
      classname = classname ? classname + " " + hash2 : hash2;
    }
    if (directives) {
      for (var key2 in directives) {
        if (directives[key2]) {
          classname = classname ? classname + " " + key2 : key2;
        } else if (classname.length) {
          var len = key2.length;
          var a = 0;
          while ((a = classname.indexOf(key2, a)) >= 0) {
            var b = a + len;
            if ((a === 0 || whitespace.includes(classname[a - 1])) && (b === classname.length || whitespace.includes(classname[b]))) {
              classname = (a === 0 ? "" : classname.substring(0, a)) + classname.substring(b + 1);
            } else {
              a = b;
            }
          }
        }
      }
    }
    return classname === "" ? null : classname;
  }
  function append_styles2(styles, important = false) {
    var separator = important ? " !important;" : ";";
    var css = "";
    for (var key2 in styles) {
      var value = styles[key2];
      if (value != null && value !== "") {
        css += " " + key2 + ": " + value + separator;
      }
    }
    return css;
  }
  function to_css_name(name) {
    if (name[0] !== "-" || name[1] !== "-") {
      return name.toLowerCase();
    }
    return name;
  }
  function to_style(value, styles) {
    if (styles) {
      var new_style = "";
      var normal_styles;
      var important_styles;
      if (Array.isArray(styles)) {
        normal_styles = styles[0];
        important_styles = styles[1];
      } else {
        normal_styles = styles;
      }
      if (value) {
        value = String(value).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
        var in_str = false;
        var in_apo = 0;
        var in_comment = false;
        var reserved_names = [];
        if (normal_styles) {
          reserved_names.push(...Object.keys(normal_styles).map(to_css_name));
        }
        if (important_styles) {
          reserved_names.push(...Object.keys(important_styles).map(to_css_name));
        }
        var start_index = 0;
        var name_index = -1;
        const len = value.length;
        for (var i = 0; i < len; i++) {
          var c = value[i];
          if (in_comment) {
            if (c === "/" && value[i - 1] === "*") {
              in_comment = false;
            }
          } else if (in_str) {
            if (in_str === c) {
              in_str = false;
            }
          } else if (c === "/" && value[i + 1] === "*") {
            in_comment = true;
          } else if (c === '"' || c === "'") {
            in_str = c;
          } else if (c === "(") {
            in_apo++;
          } else if (c === ")") {
            in_apo--;
          }
          if (!in_comment && in_str === false && in_apo === 0) {
            if (c === ":" && name_index === -1) {
              name_index = i;
            } else if (c === ";" || i === len - 1) {
              if (name_index !== -1) {
                var name = to_css_name(value.substring(start_index, name_index).trim());
                if (!reserved_names.includes(name)) {
                  if (c !== ";") {
                    i++;
                  }
                  var property = value.substring(start_index, i).trim();
                  new_style += " " + property + ";";
                }
              }
              start_index = i + 1;
              name_index = -1;
            }
          }
        }
      }
      if (normal_styles) {
        new_style += append_styles2(normal_styles);
      }
      if (important_styles) {
        new_style += append_styles2(important_styles, true);
      }
      new_style = new_style.trim();
      return new_style === "" ? null : new_style;
    }
    return value == null ? null : String(value);
  }

  // node_modules/svelte/src/internal/client/dom/elements/class.js
  function set_class(dom, is_html, value, hash2, prev_classes, next_classes) {
    var prev = dom.__className;
    if (hydrating || prev !== value || prev === void 0) {
      var next_class_name = to_class(value, hash2, next_classes);
      if (!hydrating || next_class_name !== dom.getAttribute("class")) {
        if (next_class_name == null) {
          dom.removeAttribute("class");
        } else if (is_html) {
          dom.className = next_class_name;
        } else {
          dom.setAttribute("class", next_class_name);
        }
      }
      dom.__className = value;
    } else if (next_classes && prev_classes !== next_classes) {
      for (var key2 in next_classes) {
        var is_present = !!next_classes[key2];
        if (prev_classes == null || is_present !== !!prev_classes[key2]) {
          dom.classList.toggle(key2, is_present);
        }
      }
    }
    return next_classes;
  }

  // node_modules/svelte/src/internal/client/dom/elements/style.js
  function update_styles(dom, prev = {}, next2, priority) {
    for (var key2 in next2) {
      var value = next2[key2];
      if (prev[key2] !== value) {
        if (next2[key2] == null) {
          dom.style.removeProperty(key2);
        } else {
          dom.style.setProperty(key2, value, priority);
        }
      }
    }
  }
  function set_style(dom, value, prev_styles, next_styles) {
    var prev = dom.__style;
    if (hydrating || prev !== value) {
      var next_style_attr = to_style(value, next_styles);
      if (!hydrating || next_style_attr !== dom.getAttribute("style")) {
        if (next_style_attr == null) {
          dom.removeAttribute("style");
        } else {
          dom.style.cssText = next_style_attr;
        }
      }
      dom.__style = value;
    } else if (next_styles) {
      if (Array.isArray(next_styles)) {
        update_styles(dom, prev_styles?.[0], next_styles[0]);
        update_styles(dom, prev_styles?.[1], next_styles[1], "important");
      } else {
        update_styles(dom, prev_styles, next_styles);
      }
    }
    return next_styles;
  }

  // node_modules/svelte/src/internal/client/dom/elements/attributes.js
  var CLASS = Symbol("class");
  var STYLE = Symbol("style");
  var IS_CUSTOM_ELEMENT = Symbol("is custom element");
  var IS_HTML = Symbol("is html");
  var LINK_TAG = IS_XHTML ? "link" : "LINK";
  function remove_input_defaults(input) {
    if (!hydrating)
      return;
    var already_removed = false;
    var remove_defaults = () => {
      if (already_removed)
        return;
      already_removed = true;
      if (input.hasAttribute("value")) {
        var value = input.value;
        set_attribute2(input, "value", null);
        input.value = value;
      }
      if (input.hasAttribute("checked")) {
        var checked = input.checked;
        set_attribute2(input, "checked", null);
        input.checked = checked;
      }
    };
    input.__on_r = remove_defaults;
    queue_micro_task(remove_defaults);
    add_form_reset_listener();
  }
  function set_attribute2(element2, attribute, value, skip_warning) {
    var attributes = get_attributes(element2);
    if (hydrating) {
      attributes[attribute] = element2.getAttribute(attribute);
      if (attribute === "src" || attribute === "srcset" || attribute === "href" && element2.nodeName === LINK_TAG) {
        if (!skip_warning) {
          check_src_in_dev_hydration(element2, attribute, value ?? "");
        }
        return;
      }
    }
    if (attributes[attribute] === (attributes[attribute] = value))
      return;
    if (attribute === "loading") {
      element2[LOADING_ATTR_SYMBOL] = value;
    }
    if (value == null) {
      element2.removeAttribute(attribute);
    } else if (typeof value !== "string" && get_setters(element2).includes(attribute)) {
      element2[attribute] = value;
    } else {
      element2.setAttribute(attribute, value);
    }
  }
  function get_attributes(element2) {
    return (
      /** @type {Record<string | symbol, unknown>} **/
      // @ts-expect-error
      element2.__attributes ?? (element2.__attributes = {
        [IS_CUSTOM_ELEMENT]: element2.nodeName.includes("-"),
        [IS_HTML]: element2.namespaceURI === NAMESPACE_HTML
      })
    );
  }
  var setters_cache = /* @__PURE__ */ new Map();
  function get_setters(element2) {
    var cache_key = element2.getAttribute("is") || element2.nodeName;
    var setters = setters_cache.get(cache_key);
    if (setters)
      return setters;
    setters_cache.set(cache_key, setters = []);
    var descriptors;
    var proto = element2;
    var element_proto = Element.prototype;
    while (element_proto !== proto) {
      descriptors = get_descriptors(proto);
      for (var key2 in descriptors) {
        if (descriptors[key2].set) {
          setters.push(key2);
        }
      }
      proto = get_prototype_of(proto);
    }
    return setters;
  }
  function check_src_in_dev_hydration(element2, attribute, value) {
    if (!dev_fallback_default)
      return;
    if (attribute === "srcset" && srcset_url_equal(element2, value))
      return;
    if (src_url_equal(element2.getAttribute(attribute) ?? "", value))
      return;
    hydration_attribute_changed(
      attribute,
      element2.outerHTML.replace(element2.innerHTML, element2.innerHTML && "..."),
      String(value)
    );
  }
  function src_url_equal(element_src, url) {
    if (element_src === url)
      return true;
    return new URL(element_src, document.baseURI).href === new URL(url, document.baseURI).href;
  }
  function split_srcset(srcset) {
    return srcset.split(",").map((src) => src.trim().split(" ").filter(Boolean));
  }
  function srcset_url_equal(element2, srcset) {
    var element_urls = split_srcset(element2.srcset);
    var urls = split_srcset(srcset);
    return urls.length === element_urls.length && urls.every(
      ([url, width], i) => width === element_urls[i][1] && // We need to test both ways because Vite will create an a full URL with
      // `new URL(asset, import.meta.url).href` for the client when `base: './'`, and the
      // relative URLs inside srcset are not automatically resolved to absolute URLs by
      // browsers (in contrast to img.src). This means both SSR and DOM code could
      // contain relative or absolute URLs.
      (src_url_equal(element_urls[i][0], url) || src_url_equal(url, element_urls[i][0]))
    );
  }

  // node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
  function bind_value(input, get3, set2 = get3) {
    var batches2 = /* @__PURE__ */ new WeakSet();
    listen_to_event_and_reset_event(input, "input", async (is_reset) => {
      if (dev_fallback_default && input.type === "checkbox") {
        bind_invalid_checkbox_value();
      }
      var value = is_reset ? input.defaultValue : input.value;
      value = is_numberlike_input(input) ? to_number(value) : value;
      set2(value);
      if (current_batch !== null) {
        batches2.add(current_batch);
      }
      await tick();
      if (value !== (value = get3())) {
        var start = input.selectionStart;
        var end = input.selectionEnd;
        var length = input.value.length;
        input.value = value ?? "";
        if (end !== null) {
          var new_length = input.value.length;
          if (start === end && end === length && new_length > length) {
            input.selectionStart = new_length;
            input.selectionEnd = new_length;
          } else {
            input.selectionStart = start;
            input.selectionEnd = Math.min(end, new_length);
          }
        }
      }
    });
    if (
      // If we are hydrating and the value has since changed,
      // then use the updated value from the input instead.
      hydrating && input.defaultValue !== input.value || // If defaultValue is set, then value == defaultValue
      // TODO Svelte 6: remove input.value check and set to empty string?
      untrack(get3) == null && input.value
    ) {
      set2(is_numberlike_input(input) ? to_number(input.value) : input.value);
      if (current_batch !== null) {
        batches2.add(current_batch);
      }
    }
    render_effect(() => {
      if (dev_fallback_default && input.type === "checkbox") {
        bind_invalid_checkbox_value();
      }
      var value = get3();
      if (input === document.activeElement) {
        var batch = (
          /** @type {Batch} */
          previous_batch ?? current_batch
        );
        if (batches2.has(batch)) {
          return;
        }
      }
      if (is_numberlike_input(input) && value === to_number(input.value)) {
        return;
      }
      if (input.type === "date" && !value && !input.value) {
        return;
      }
      if (value !== input.value) {
        input.value = value ?? "";
      }
    });
  }
  function is_numberlike_input(input) {
    var type = input.type;
    return type === "number" || type === "range";
  }
  function to_number(value) {
    return value === "" ? null : +value;
  }

  // node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
  function is_bound_this(bound_value, element_or_component) {
    return bound_value === element_or_component || bound_value?.[STATE_SYMBOL] === element_or_component;
  }
  function bind_this(element_or_component = {}, update2, get_value, get_parts) {
    effect(() => {
      var old_parts;
      var parts;
      render_effect(() => {
        old_parts = parts;
        parts = get_parts?.() || [];
        untrack(() => {
          if (element_or_component !== get_value(...parts)) {
            update2(element_or_component, ...parts);
            if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) {
              update2(null, ...old_parts);
            }
          }
        });
      });
      return () => {
        queue_micro_task(() => {
          if (parts && is_bound_this(get_value(...parts), element_or_component)) {
            update2(null, ...parts);
          }
        });
      };
    });
    return element_or_component;
  }

  // node_modules/svelte/src/internal/client/reactivity/store.js
  var IS_UNMOUNTED = Symbol();

  // node_modules/svelte/src/legacy/legacy-client.js
  function createClassComponent(options) {
    return new Svelte4Component(options);
  }
  var _events, _instance;
  var Svelte4Component = class {
    /**
     * @param {ComponentConstructorOptions & {
     *  component: any;
     * }} options
     */
    constructor(options) {
      /** @type {any} */
      __privateAdd(this, _events, void 0);
      /** @type {Record<string, any>} */
      __privateAdd(this, _instance, void 0);
      var sources = /* @__PURE__ */ new Map();
      var add_source = (key2, value) => {
        var s = mutable_source(value, false, false);
        sources.set(key2, s);
        return s;
      };
      const props = new Proxy(
        { ...options.props || {}, $$events: {} },
        {
          get(target, prop2) {
            return get(sources.get(prop2) ?? add_source(prop2, Reflect.get(target, prop2)));
          },
          has(target, prop2) {
            if (prop2 === LEGACY_PROPS)
              return true;
            get(sources.get(prop2) ?? add_source(prop2, Reflect.get(target, prop2)));
            return Reflect.has(target, prop2);
          },
          set(target, prop2, value) {
            set(sources.get(prop2) ?? add_source(prop2, value), value);
            return Reflect.set(target, prop2, value);
          }
        }
      );
      __privateSet(this, _instance, (options.hydrate ? hydrate : mount)(options.component, {
        target: options.target,
        anchor: options.anchor,
        props,
        context: options.context,
        intro: options.intro ?? false,
        recover: options.recover
      }));
      if (!async_mode_flag && (!options?.props?.$$host || options.sync === false)) {
        flushSync();
      }
      __privateSet(this, _events, props.$$events);
      for (const key2 of Object.keys(__privateGet(this, _instance))) {
        if (key2 === "$set" || key2 === "$destroy" || key2 === "$on")
          continue;
        define_property(this, key2, {
          get() {
            return __privateGet(this, _instance)[key2];
          },
          /** @param {any} value */
          set(value) {
            __privateGet(this, _instance)[key2] = value;
          },
          enumerable: true
        });
      }
      __privateGet(this, _instance).$set = /** @param {Record<string, any>} next */
      (next2) => {
        Object.assign(props, next2);
      };
      __privateGet(this, _instance).$destroy = () => {
        unmount(__privateGet(this, _instance));
      };
    }
    /** @param {Record<string, any>} props */
    $set(props) {
      __privateGet(this, _instance).$set(props);
    }
    /**
     * @param {string} event
     * @param {(...args: any[]) => any} callback
     * @returns {any}
     */
    $on(event2, callback) {
      __privateGet(this, _events)[event2] = __privateGet(this, _events)[event2] || [];
      const cb = (...args) => callback.call(this, ...args);
      __privateGet(this, _events)[event2].push(cb);
      return () => {
        __privateGet(this, _events)[event2] = __privateGet(this, _events)[event2].filter(
          /** @param {any} fn */
          (fn) => fn !== cb
        );
      };
    }
    $destroy() {
      __privateGet(this, _instance).$destroy();
    }
  };
  _events = new WeakMap();
  _instance = new WeakMap();

  // node_modules/svelte/src/internal/client/dom/elements/custom-element.js
  var SvelteElement;
  if (typeof HTMLElement === "function") {
    SvelteElement = class extends HTMLElement {
      /**
       * @param {*} $$componentCtor
       * @param {*} $$slots
       * @param {ShadowRootInit | undefined} shadow_root_init
       */
      constructor($$componentCtor, $$slots, shadow_root_init) {
        super();
        /** The Svelte component constructor */
        __publicField(this, "$$ctor");
        /** Slots */
        __publicField(this, "$$s");
        /** @type {any} The Svelte component instance */
        __publicField(this, "$$c");
        /** Whether or not the custom element is connected */
        __publicField(this, "$$cn", false);
        /** @type {Record<string, any>} Component props data */
        __publicField(this, "$$d", {});
        /** `true` if currently in the process of reflecting component props back to attributes */
        __publicField(this, "$$r", false);
        /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
        __publicField(this, "$$p_d", {});
        /** @type {Record<string, EventListenerOrEventListenerObject[]>} Event listeners */
        __publicField(this, "$$l", {});
        /** @type {Map<EventListenerOrEventListenerObject, Function>} Event listener unsubscribe functions */
        __publicField(this, "$$l_u", /* @__PURE__ */ new Map());
        /** @type {any} The managed render effect for reflecting attributes */
        __publicField(this, "$$me");
        /** @type {ShadowRoot | null} The ShadowRoot of the custom element */
        __publicField(this, "$$shadowRoot", null);
        this.$$ctor = $$componentCtor;
        this.$$s = $$slots;
        if (shadow_root_init) {
          this.$$shadowRoot = this.attachShadow(shadow_root_init);
        }
      }
      /**
       * @param {string} type
       * @param {EventListenerOrEventListenerObject} listener
       * @param {boolean | AddEventListenerOptions} [options]
       */
      addEventListener(type, listener, options) {
        this.$$l[type] = this.$$l[type] || [];
        this.$$l[type].push(listener);
        if (this.$$c) {
          const unsub = this.$$c.$on(type, listener);
          this.$$l_u.set(listener, unsub);
        }
        super.addEventListener(type, listener, options);
      }
      /**
       * @param {string} type
       * @param {EventListenerOrEventListenerObject} listener
       * @param {boolean | AddEventListenerOptions} [options]
       */
      removeEventListener(type, listener, options) {
        super.removeEventListener(type, listener, options);
        if (this.$$c) {
          const unsub = this.$$l_u.get(listener);
          if (unsub) {
            unsub();
            this.$$l_u.delete(listener);
          }
        }
      }
      async connectedCallback() {
        this.$$cn = true;
        if (!this.$$c) {
          let create_slot = function(name) {
            return (anchor) => {
              const slot2 = create_element("slot");
              if (name !== "default")
                slot2.name = name;
              append(anchor, slot2);
            };
          };
          await Promise.resolve();
          if (!this.$$cn || this.$$c) {
            return;
          }
          const $$slots = {};
          const existing_slots = get_custom_elements_slots(this);
          for (const name of this.$$s) {
            if (name in existing_slots) {
              if (name === "default" && !this.$$d.children) {
                this.$$d.children = create_slot(name);
                $$slots.default = true;
              } else {
                $$slots[name] = create_slot(name);
              }
            }
          }
          for (const attribute of this.attributes) {
            const name = this.$$g_p(attribute.name);
            if (!(name in this.$$d)) {
              this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
            }
          }
          for (const key2 in this.$$p_d) {
            if (!(key2 in this.$$d) && this[key2] !== void 0) {
              this.$$d[key2] = this[key2];
              delete this[key2];
            }
          }
          this.$$c = createClassComponent({
            component: this.$$ctor,
            target: this.$$shadowRoot || this,
            props: {
              ...this.$$d,
              $$slots,
              $$host: this
            }
          });
          this.$$me = effect_root(() => {
            render_effect(() => {
              this.$$r = true;
              for (const key2 of object_keys(this.$$c)) {
                if (!this.$$p_d[key2]?.reflect)
                  continue;
                this.$$d[key2] = this.$$c[key2];
                const attribute_value = get_custom_element_value(
                  key2,
                  this.$$d[key2],
                  this.$$p_d,
                  "toAttribute"
                );
                if (attribute_value == null) {
                  this.removeAttribute(this.$$p_d[key2].attribute || key2);
                } else {
                  this.setAttribute(this.$$p_d[key2].attribute || key2, attribute_value);
                }
              }
              this.$$r = false;
            });
          });
          for (const type in this.$$l) {
            for (const listener of this.$$l[type]) {
              const unsub = this.$$c.$on(type, listener);
              this.$$l_u.set(listener, unsub);
            }
          }
          this.$$l = {};
        }
      }
      // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
      // and setting attributes through setAttribute etc, this is helpful
      /**
       * @param {string} attr
       * @param {string} _oldValue
       * @param {string} newValue
       */
      attributeChangedCallback(attr2, _oldValue, newValue) {
        if (this.$$r)
          return;
        attr2 = this.$$g_p(attr2);
        this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, "toProp");
        this.$$c?.$set({ [attr2]: this.$$d[attr2] });
      }
      disconnectedCallback() {
        this.$$cn = false;
        Promise.resolve().then(() => {
          if (!this.$$cn && this.$$c) {
            this.$$c.$destroy();
            this.$$me();
            this.$$c = void 0;
          }
        });
      }
      /**
       * @param {string} attribute_name
       */
      $$g_p(attribute_name) {
        return object_keys(this.$$p_d).find(
          (key2) => this.$$p_d[key2].attribute === attribute_name || !this.$$p_d[key2].attribute && key2.toLowerCase() === attribute_name
        ) || attribute_name;
      }
    };
  }
  function get_custom_element_value(prop2, value, props_definition, transform) {
    const type = props_definition[prop2]?.type;
    value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
    if (!transform || !props_definition[prop2]) {
      return value;
    } else if (transform === "toAttribute") {
      switch (type) {
        case "Object":
        case "Array":
          return value == null ? null : JSON.stringify(value);
        case "Boolean":
          return value ? "" : null;
        case "Number":
          return value == null ? null : value;
        default:
          return value;
      }
    } else {
      switch (type) {
        case "Object":
        case "Array":
          return value && JSON.parse(value);
        case "Boolean":
          return value;
        case "Number":
          return value != null ? +value : value;
        default:
          return value;
      }
    }
  }
  function get_custom_elements_slots(element2) {
    const result = {};
    element2.childNodes.forEach((node) => {
      result[
        /** @type {Element} node */
        node.slot || "default"
      ] = true;
    });
    return result;
  }

  // node_modules/svelte/src/index-client.js
  if (dev_fallback_default) {
    let throw_rune_error = function(rune) {
      if (!(rune in globalThis)) {
        let value;
        Object.defineProperty(globalThis, rune, {
          configurable: true,
          // eslint-disable-next-line getter-return
          get: () => {
            if (value !== void 0) {
              return value;
            }
            rune_outside_svelte(rune);
          },
          set: (v) => {
            value = v;
          }
        });
      }
    };
    throw_rune_error("$state");
    throw_rune_error("$effect");
    throw_rune_error("$derived");
    throw_rune_error("$inspect");
    throw_rune_error("$props");
    throw_rune_error("$bindable");
  }
  function onMount(fn) {
    if (component_context === null) {
      lifecycle_outside_component("onMount");
    }
    if (legacy_mode_flag && component_context.l !== null) {
      init_update_callbacks(component_context).m.push(fn);
    } else {
      user_effect(() => {
        const cleanup = untrack(fn);
        if (typeof cleanup === "function")
          return (
            /** @type {() => void} */
            cleanup
          );
      });
    }
  }
  function onDestroy(fn) {
    if (component_context === null) {
      lifecycle_outside_component("onDestroy");
    }
    onMount(() => () => untrack(fn));
  }
  function init_update_callbacks(context) {
    var l = (
      /** @type {ComponentContextLegacy} */
      context.l
    );
    return l.u ?? (l.u = { a: [], b: [], m: [] });
  }

  // node_modules/svelte/src/version.js
  var PUBLIC_VERSION = "5";

  // node_modules/svelte/src/internal/disclose-version.js
  var _a;
  if (typeof window !== "undefined") {
    ((_a = window.__svelte ?? (window.__svelte = {})).v ?? (_a.v = /* @__PURE__ */ new Set())).add(PUBLIC_VERSION);
  }

  // webview/shared/vscodeApi.ts
  var api;
  function getVsCodeApi() {
    if (!api) {
      api = acquireVsCodeApi();
    }
    return api;
  }
  function postMessage(type, payload) {
    getVsCodeApi().postMessage({ type, payload });
  }
  function onMessage(handler) {
    const listener = (event2) => {
      handler(event2.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }

  // webview/shared/theme.ts
  var GRAPH_COLORS = [
    "#a6823c", // Android Studio gold/ocher
    "#399478", // Android Studio teal
    "#4a67a8", // Android Studio indigo/blue
    "#4e8e52", // Android Studio green
    "#7d57a6", // Android Studio purple
    "#b36939", // Android Studio amber/brown
    "#327e99", // Android Studio cerulean/cyan
    "#9c4949", // Android Studio muted red
    "#857930", // Android Studio olive
    "#4f728c"  // Android Studio slate
  ];
  function branchColor(index2) {
    return GRAPH_COLORS[index2 % GRAPH_COLORS.length];
  }

  // webview/graph/CommitGraph.svelte
  function computeAngularPath(x1, y1, x2, y2) {
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return "";
    const dx = x2 - x1;
    if (Math.abs(dx) < 0.5) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }



  var root_2 = from_svg(`<line stroke-width="1.8" stroke-linecap="round"></line>`);
  var root_3 = from_svg(`<path fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>`);
  var root_4 = from_svg(`<circle stroke="var(--vscode-editor-background)" stroke-width="1.5"></circle>`);
  var root = from_svg(`<svg class="graph-svg svelte-154okp0"><!><!></svg>`);
  var $$css = {
    hash: "svelte-154okp0",
    code: ".graph-svg.svelte-154okp0 {flex-shrink:0;}"
  };
  function CommitGraph($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css);
    const COL_WIDTH = 16;
    const DOT_RADIUS = 3.8;
    const PADDING = 10;
    function svgWidth() {
      return Math.max(4, $$props.graphWidth || 1) * COL_WIDTH + PADDING * 2;
    }
    function svgHeight() {
      return $$props.visibleCount * $$props.rowHeight;
    }
    function cx(col) {
      return PADDING + col * COL_WIDTH + COL_WIDTH / 2;
    }
    function cy(row) {
      return (row - $$props.startIndex) * $$props.rowHeight + $$props.rowHeight / 2;
    }
    function visibleLines() {
      const result = [];
      const endIndex = $$props.startIndex + $$props.visibleCount + 1;
      for (let i = Math.max(0, $$props.startIndex - 1); i < Math.min($$props.nodes.length, endIndex + 1); i++) {
        const node = $$props.nodes[i];
        if (!node || !node.lines) continue;
        for (const line of node.lines) {
          result.push({ line, color: branchColor(line.color) });
        }
      }
      return result;
    }
    function visibleDots() {
      const endIndex = $$props.startIndex + $$props.visibleCount;
      const result = [];
      for (let i = $$props.startIndex; i < Math.min($$props.nodes.length, endIndex); i++) {
        const node = $$props.nodes[i];
        result.push({
          x: cx(node.column),
          y: cy(i),
          color: branchColor(node.color),
          hash: node.hash,
          isHead: (i === 0)
        });
      }
      return result;
    }
    var svg = root();
    var node_1 = child(svg);
    each(node_1, 17, visibleLines, index, ($$anchor2, $$item) => {
      let line = () => get($$item).line;
      let color = () => get($$item).color;
      var fragment = comment();
      var node_2 = first_child(fragment);
      {
        var consequent = ($$anchor3) => {
          var line_1 = root_2();
          template_effect(
            ($0, $1, $2, $3) => {
              set_attribute2(line_1, "x1", $0);
              set_attribute2(line_1, "y1", $1);
              set_attribute2(line_1, "x2", $2);
              set_attribute2(line_1, "y2", $3);
              set_attribute2(line_1, "stroke", color());
            },
            [
              () => cx(line().fromColumn),
              () => cy(line().fromRow),
              () => cx(line().toColumn),
              () => cy(line().toRow)
            ]
          );
          append($$anchor3, line_1);
        };
        var alternate = ($$anchor3) => {
          var path = root_3();
          template_effect(
            ($0, $1, $2, $3) => {
              set_attribute2(path, "d", computeAngularPath($0, $1, $2, $3));
              set_attribute2(path, "stroke", color());
            },
            [
              () => cx(line().fromColumn),
              () => cy(line().fromRow),
              () => cx(line().toColumn),
              () => cy(line().toRow)
            ]
          );
          append($$anchor3, path);
        };
        if_block(node_2, ($$render) => {
          if (line().fromColumn === line().toColumn)
            $$render(consequent);
          else
            $$render(alternate, false);
        });
      }
      append($$anchor2, fragment);
    });
    var node_3 = sibling(node_1);
    each(node_3, 17, visibleDots, index, ($$anchor2, dot) => {
      var circle = root_4();
      set_attribute2(circle, "r", DOT_RADIUS);
      var ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke-width", "1.5");
      ring.setAttribute("r", "6.5");
      template_effect(() => {
        set_attribute2(circle, "cx", get(dot).x);
        set_attribute2(circle, "cy", get(dot).y);
        set_attribute2(circle, "fill", get(dot).color);
        if (get(dot).isHead) {
          ring.setAttribute("cx", get(dot).x);
          ring.setAttribute("cy", get(dot).y);
          ring.setAttribute("stroke", get(dot).color);
          ring.style.display = "";
        } else {
          ring.style.display = "none";
        }
      });
      append($$anchor2, ring);
      append($$anchor2, circle);
    });
    reset(svg);
    template_effect(
      ($0, $1) => {
        set_attribute2(svg, "width", $0);
        set_attribute2(svg, "height", $1);
      },
      [svgWidth, svgHeight]
    );
    append($$anchor, svg);
    pop();
  }

  // webview/graph/BranchLabels.svelte
  var root_1 = from_html(`<span> </span>`);
  var root2 = from_html(`<span class="labels svelte-et0zx2"></span>`);
  var $$css2 = {
    hash: "svelte-et0zx2",
    code: ".labels.svelte-et0zx2 {order:5;margin-left:16px;display:inline-flex;gap:5px;flex-shrink:0;padding-right:16px;min-width:max-content;overflow:visible;align-items:center;}.label.svelte-et0zx2 {display:inline-flex;align-items:center;gap:3px;padding:0 5px;border-radius:3px;font-size:0.8em;font-weight:500;line-height:1.3;white-space:nowrap;flex-shrink:0;background:transparent;}.label-icon {display:inline-flex;align-items:center;vertical-align:-1px;margin-right:2px;}.branch.svelte-et0zx2 {color:#3fb950;border:1px solid #238636;}.remote.svelte-et0zx2 {color:#bc8cff;border:1px solid #8957e5;}.tag.svelte-et0zx2 {color:#d29922;border:1px solid #9e6a03;}.head.svelte-et0zx2 {color:#e5a50a;border:1px solid #e5a50a;font-weight:600;}"
  };
  function BranchLabels($$anchor, $$props) {
    append_styles($$anchor, $$css2);
    function labelClass(ref) {
      if (ref.startsWith("tag: ")) return "label tag";
      if (ref.startsWith("HEAD") || ref === "HEAD") return "label head";
      if (ref.includes("/")) return "label remote";
      return "label branch";
    }
    function labelText(ref) {
      if (ref.startsWith("HEAD -> ")) return ref.slice(8);
      if (ref.startsWith("tag: ")) return ref.slice(5);
      return ref;
    }
    var span = root2();
    each(span, 21, () => $$props.refs, index, ($$anchor2, ref) => {
      var span_1 = root_1();
      var text2 = child(span_1, true);
      reset(span_1);
      template_effect(
        ($0, $1) => {
          set_class(span_1, 1, $0, "svelte-et0zx2");
          span_1.innerHTML = '<span class="label-icon"><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M1 7.7V2a1 1 0 0 1 1-1h5.7a1 1 0 0 1 .7.3l7.3 7.3a1 1 0 0 1 0 1.4l-5.7 5.7a1 1 0 0 1-1.4 0L1.3 8.4a1 1 0 0 1-.3-.7zm2.5-3.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg></span> <span>' + $1 + '</span>';
        },
        [
          () => clsx2(labelClass(get(ref))),
          () => labelText(get(ref))
        ]
      );
      append($$anchor2, span_1);
    });
    reset(span);
    append($$anchor, span);
  }

  // webview/graph/CommitList.svelte
  var root_12 = from_html(`<div role="row" tabindex="0"><span class="hash svelte-1rusxbg"> </span> <!> <span class="subject svelte-1rusxbg"> </span> <span class="author svelte-1rusxbg"> </span> <span class="date svelte-1rusxbg"> </span></div>`);
  var root_32 = from_html(`<div class="context-menu svelte-1rusxbg"><button class="context-item svelte-1rusxbg">Interactively Rebase from Here...</button></div>`);
  var root3 = from_html(`<div class="commit-list-container svelte-1rusxbg"><div class="scroll-content"><div class="visible-rows svelte-1rusxbg"><div class="graph-column svelte-1rusxbg"><!></div> <div class="rows-column svelte-1rusxbg"></div></div></div></div> <!>`, 1);
  var $$css3 = {
    hash: "svelte-1rusxbg",
    code: ".commit-list-container.svelte-1rusxbg {position:absolute;top:0;left:0;right:0;bottom:0;overflow-y:auto;overflow-x:auto;}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar {width:6px;height:6px;}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar-track {background:transparent;}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar-thumb {background:rgba(255,255,255,0.18);border-radius:3px;}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35);}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar-corner {background:transparent;}.scroll-content {min-width:100%;width:max-content;}.visible-rows.svelte-1rusxbg {position:relative;display:block;min-width:100%;width:max-content;}.graph-column.svelte-1rusxbg {position:absolute;top:0;left:244px;pointer-events:none;z-index:1;}.rows-column.svelte-1rusxbg {min-width:100%;width:max-content;}.commit-row.svelte-1rusxbg {box-sizing:border-box !important;height:25px !important;min-height:25px !important;max-height:25px !important;line-height:25px !important;display:flex;align-items:center;gap:8px;padding:0 8px;cursor:pointer;white-space:nowrap;position:relative;border-bottom:none;min-width:100%;width:max-content;}.commit-row.svelte-1rusxbg * {box-sizing:border-box;}.commit-row.svelte-1rusxbg:hover {background:var(--vscode-list-hoverBackground);}.commit-row.selected.svelte-1rusxbg {background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground);}.author.svelte-1rusxbg {order:1;flex-shrink:0;font-weight:600;color:#ffffff;font-size:0.92em;width:95px;min-width:95px;overflow:hidden;text-overflow:ellipsis;}.date.svelte-1rusxbg {order:2;flex-shrink:0;color:#8c8c8c;font-size:0.88em;width:125px;min-width:125px;overflow:hidden;text-overflow:ellipsis;}.hash.svelte-1rusxbg {order:3;flex-shrink:0;color:transparent;user-select:none;font-size:0;}.subject.svelte-1rusxbg {order:4;flex:0 0 auto;min-width:max-content;white-space:nowrap;color:#dfe1e5;font-size:0.92em;}.commit-row.is-merge.svelte-1rusxbg .subject {color:#8c8c8c !important;font-weight:400;}.commit-row.is-merge.svelte-1rusxbg .author {color:#9aa0a6 !important;font-weight:400;}.context-menu.svelte-1rusxbg {position:fixed;background:var(--vscode-menu-background, #252526);border:1px solid var(--vscode-menu-border, #454545);border-radius:4px;padding:4px 0;z-index:1000;box-shadow:0 2px 8px rgba(0,0,0,0.3);}.context-item.svelte-1rusxbg {display:block;width:100%;padding:6px 20px;border:none;background:none;color:var(--vscode-menu-foreground, #ccc);font-size:inherit;text-align:left;cursor:pointer;}.context-item.svelte-1rusxbg:hover {background:var(--vscode-menu-selectionBackground, #094771);color:var(--vscode-menu-selectionForeground, #fff);}"
  };
  function CommitList($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css3);
    const ROW_HEIGHT = 25;
    const OVERSCAN = 5;
    let containerEl = state(void 0);
    let scrollTop = state(0);
    let containerHeight = state(600);
    let contextMenuHash = state(null);
    let contextMenuPos = state(proxy({ x: 0, y: 0 }));
    let showContextMenu = state(false);
    user_effect(() => {
      if (!get(containerEl))
        return;
      const obs = new ResizeObserver((entries) => {
        if (!entries || !entries.length) return;
        window.requestAnimationFrame(() => {
          if (!entries[0]) return;
          const h = entries[0].contentRect.height;
          if (h && Math.abs(h - get(containerHeight)) > 1) {
            set(containerHeight, h, true);
          }
        });
      });
      obs.observe(get(containerEl));
      return () => obs.disconnect();
    });
    let isLoadingMore = false;
    let hasReachedEnd = false;
    let prevCommitCount = 0;
    function onScroll(e) {
      const el = e.target;
      set(scrollTop, el.scrollTop, true);
      const curCount = ($$props.commits ? $$props.commits.length : 0);
      if (curCount !== prevCommitCount) {
        isLoadingMore = false;
        hasReachedEnd = false;
        prevCommitCount = curCount;
      }
      const totalHeight = curCount * ROW_HEIGHT;
      if (!isLoadingMore && !hasReachedEnd && curCount >= 50 && el.scrollTop + get(containerHeight) > totalHeight - 350) {
        isLoadingMore = true;
        $$props.onLoadMore();
      }
    }
    let startIndex = user_derived(() => Math.max(0, Math.floor(get(scrollTop) / ROW_HEIGHT) - OVERSCAN));
    let endIndex = user_derived(() => Math.min($$props.commits.length, Math.ceil((get(scrollTop) + get(containerHeight)) / ROW_HEIGHT) + OVERSCAN));
    let visibleCommits = user_derived(() => $$props.commits.slice(get(startIndex), get(endIndex)));
    let graphNodes = user_derived(() => $$props.commits.map((c) => c.graph));
    function formatDate(iso) {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) return `Today ${timeStr}`;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${timeStr}`;
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}, ${timeStr}`;
    }
    const ICON_COPY = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/></svg>`;
    const ICON_PLUS = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2z"/></svg>`;
    const ICON_CHERRY = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><circle cx="4.5" cy="11.5" r="2.5"/><circle cx="11.5" cy="11.5" r="2.5"/><path d="M5.5 9.5C6.5 6 9 3 13 2c-1.5 3-1.5 6-1.5 7"/></svg>`;
    const ICON_RESET = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`;
    const ICON_WEB = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;

    function showToast(text) {
      const old = document.querySelector(".as-mini-toast");
      if (old) old.remove();
      const t = document.createElement("div");
      t.className = "as-mini-toast";
      t.innerText = text;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add("visible"), 10);
      setTimeout(() => {
        t.classList.remove("visible");
        setTimeout(() => t.remove(), 250);
      }, 2000);
    }

    function closeCommitContextMenu() {
      const menus = document.querySelectorAll(".commit-context-menu");
      menus.forEach(m => m.remove());
    }

    function closeBranchContextMenu() {
      const old = document.querySelector(".branch-context-menu");
      if (old) old.remove();
    }

    function openEditCommitMessageDialog(commit) {
      if (!commit) return;
      const existing = document.querySelector(".as-dialog-overlay");
      if (existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.className = "as-dialog-overlay";

      const card = document.createElement("div");
      card.className = "as-dialog-card";

      const shortHash = commit.hash ? commit.hash.slice(0, 8) : "";
      card.innerHTML = `
        <div class="as-dialog-header">
          <span>Edit Commit Message (${shortHash})</span>
          <span class="as-dialog-close">✕</span>
        </div>
        <div class="as-dialog-body">
          <div class="as-dialog-field-label">Summary (Title)</div>
          <input type="text" class="as-dialog-input" id="as-edit-summary" placeholder="Commit summary...">
          <div class="as-dialog-field-label">Description (Details)</div>
          <textarea class="as-dialog-textarea" id="as-edit-desc" placeholder="Detailed commit description (optional)..."></textarea>
        </div>
        <div class="as-dialog-footer">
          <div style="margin-right:auto;font-size:11px;opacity:0.6;">Ctrl+Enter to save, Esc to cancel</div>
          <button class="as-dialog-btn as-dialog-btn-secondary" id="as-edit-cancel">Cancel</button>
          <button class="as-dialog-btn as-dialog-btn-primary" id="as-edit-ok">Save</button>
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const summaryInput = card.querySelector("#as-edit-summary");
      const descInput = card.querySelector("#as-edit-desc");
      const btnCancel = card.querySelector("#as-edit-cancel");
      const btnOk = card.querySelector("#as-edit-ok");
      const btnClose = card.querySelector(".as-dialog-close");

      summaryInput.value = commit.subject || "";
      descInput.value = commit.body ? commit.body.trim() : "";

      const closeDialog = () => {
        overlay.remove();
        document.removeEventListener("keydown", onKeyDown);
      };

      const submitDialog = () => {
        const title = summaryInput.value.trim();
        if (!title) {
          summaryInput.focus();
          return;
        }
        const desc = descInput.value.trim();
        const fullMessage = desc ? (title + "\\n\\n" + desc) : title;
        postMessage("editCommitMessage", { hash: commit.hash, message: fullMessage });
        closeDialog();
      };

      btnCancel.addEventListener("click", closeDialog);
      btnClose.addEventListener("click", closeDialog);
      btnOk.addEventListener("click", submitDialog);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeDialog();
      });

      const onKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeDialog();
        } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          submitDialog();
        }
      };

      document.addEventListener("keydown", onKeyDown);

      summaryInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          descInput.focus();
        }
      });

      setTimeout(() => {
        summaryInput.focus();
        summaryInput.select();
      }, 50);
    }

    function showCommitContextMenu(e, commit) {
      e.preventDefault();
      e.stopPropagation();
      closeCommitContextMenu();
      const oldBranch = document.querySelector(".branch-context-menu");
      if (oldBranch) oldBranch.remove();

      $$props.onSelectCommit(commit.hash);

      const commits = $$props.commits || [];
      const isHead = commits.length > 0 && commits[0].hash === commit.hash;
      const menu = document.createElement("div");
      menu.className = "commit-context-menu";

      function addItem(label, shortcut, iconSvg, onClick, disabled = false) {
        const it = document.createElement("div");
        it.className = "ccm-item" + (disabled ? " disabled" : "");

        const iconSpan = document.createElement("span");
        iconSpan.className = "ccm-icon";
        if (iconSvg) iconSpan.innerHTML = iconSvg;
        it.appendChild(iconSpan);

        const lblSpan = document.createElement("span");
        lblSpan.className = "ccm-label";
        lblSpan.innerText = label;
        it.appendChild(lblSpan);

        if (shortcut) {
          const scSpan = document.createElement("span");
          scSpan.className = "ccm-shortcut";
          scSpan.innerText = shortcut;
          it.appendChild(scSpan);
        }

        if (!disabled && onClick) {
          it.addEventListener("click", (ev) => {
            ev.stopPropagation();
            closeCommitContextMenu();
            onClick();
          });
        }
        menu.appendChild(it);
        return it;
      }

      function addDivider() {
        const d = document.createElement("div");
        d.className = "ccm-divider";
        menu.appendChild(d);
      }

      // 1. Copy Revision Number
      addItem("Copy Revision Number", "⌥⇧⌘C", ICON_COPY, () => {
        navigator.clipboard.writeText(commit.hash);
        showToast("Copied " + commit.hash.slice(0, 8) + " to clipboard");
      });

      // 2. Create Patch...
      addItem("Create Patch...", "", ICON_PLUS, () => {
        postMessage("createPatch", { hash: commit.hash });
      });

      // 3. Cherry-Pick
      addItem("Cherry-Pick", "", ICON_CHERRY, () => {
        postMessage("cherryPick", { hash: commit.hash });
      });

      addDivider();

      // 4. Checkout Revision
      addItem("Checkout Revision", "", "", () => {
        postMessage("checkout", commit.hash);
      });

      // 5. Show Repository at Revision
      addItem("Show Repository at Revision", "", "", () => {
        postMessage("showRepoAtRevision", { hash: commit.hash });
      });

      // 6. Compare with Local
      addItem("Compare with Local", "", "", () => {
        postMessage("compareWithLocal", { hash: commit.hash });
      });

      addDivider();

      // 7. Reset Current Branch to Here...
      addItem("Reset Current Branch to Here...", "", ICON_RESET, () => {
        postMessage("resetToCommit", { hash: commit.hash });
      });

      // 8. Revert Commit
      addItem("Revert Commit", "", "", () => {
        postMessage("revertCommit", { hash: commit.hash });
      });

      // 9. Undo Commit... (enabled only if HEAD)
      addItem("Undo Commit...", "", "", () => {
        postMessage("undoCommit", { hash: commit.hash });
      }, !isHead);

      addDivider();

      // 10. Edit Commit Message...
      addItem("Edit Commit Message...", "F2", "", () => {
        openEditCommitMessageDialog(commit);
      });

      // 11. Fixup...
      addItem("Fixup...", "", "", () => {
        postMessage("rebaseFromHere", commit.hash);
      });

      // 12. Squash Into...
      addItem("Squash Into...", "", "", () => {
        postMessage("rebaseFromHere", commit.hash);
      });

      // 13. Drop Commit
      addItem("Drop Commit", "", "", () => {
        postMessage("dropCommit", { hash: commit.hash });
      });

      // 14. Interactively Rebase from Here...
      addItem("Interactively Rebase from Here...", "", "", () => {
        postMessage("rebaseFromHere", commit.hash);
      });

      // 15. Push All up to Here...
      addItem("Push All up to Here...", "", "", () => {
        postMessage("pushUpToHere", { hash: commit.hash });
      });

      addDivider();

      // 16. Branch '<name>' Submenu
      const branchRef = (commit.refs || []).find(r => !r.startsWith("tag: ") && r !== "HEAD") || (commit.refs && commit.refs[0]);
      if (branchRef) {
        const cleanBranch = branchRef.replace(/^HEAD -> /, '');
        const branchItem = document.createElement("div");
        branchItem.className = "ccm-item has-submenu";
        branchItem.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">Branch '${cleanBranch}'</span><span class="ccm-arrow">›</span>`;

        const subMenu = document.createElement("div");
        subMenu.className = "commit-context-menu ccm-submenu";

        function addSubItem(label, onClick) {
          const it = document.createElement("div");
          it.className = "ccm-item";
          it.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">${label}</span>`;
          it.addEventListener("click", (ev) => {
            ev.stopPropagation();
            closeCommitContextMenu();
            onClick();
          });
          subMenu.appendChild(it);
        }

        addSubItem("Checkout", () => postMessage("checkout", cleanBranch));
        addSubItem("Show Diff with Working Tree", () => postMessage("showDiff", { branch: cleanBranch }));
        addSubItem("Update", () => postMessage("pull", cleanBranch));
        addSubItem("Push...", () => postMessage("push", cleanBranch));
        addSubItem("Rename...", () => {
          const newName = prompt("Rename branch '" + cleanBranch + "' to:", cleanBranch);
          if (newName && newName !== cleanBranch) postMessage("renameBranch", { oldName: cleanBranch, newName });
        });

        let subMenuTimer;
        function hideSubMenu() {
          clearTimeout(subMenuTimer);
          subMenuTimer = setTimeout(() => {
            subMenu.remove();
          }, 150);
        }
        function showSubMenu() {
          clearTimeout(subMenuTimer);
          document.body.appendChild(subMenu);
          subMenu.style.display = "block";
          const bRect = branchItem.getBoundingClientRect();
          let sx = bRect.right + 2;
          let sy = bRect.top;
          const sRect = subMenu.getBoundingClientRect();
          if (sx + sRect.width > window.innerWidth) {
            sx = bRect.left - sRect.width - 2;
          }
          if (sy + sRect.height > window.innerHeight) {
            sy = window.innerHeight - sRect.height - 8;
          }
          subMenu.style.left = Math.max(0, sx) + "px";
          subMenu.style.top = Math.max(0, sy) + "px";
        }

        branchItem.addEventListener("mouseenter", showSubMenu);
        branchItem.addEventListener("mouseleave", hideSubMenu);
        subMenu.addEventListener("mouseenter", () => clearTimeout(subMenuTimer));
        subMenu.addEventListener("mouseleave", hideSubMenu);
        menu.appendChild(branchItem);
      }

      // 17. New Branch...
      addItem("New Branch...", "⌥⌘N", "", () => {
        const name = prompt("New branch name:", "");
        if (name && name.trim()) postMessage("createBranch", { name: name.trim(), startPoint: commit.hash });
      });

      // 18. New Tag...
      addItem("New Tag...", "", "", () => {
        const name = prompt("New tag name:", "");
        if (name && name.trim()) postMessage("createTag", { name: name.trim(), hash: commit.hash });
      });

      addDivider();

      // 19. Go to Child Commit
      let childCommit = commits.find(c => c.parents && c.parents.includes(commit.hash));
      addItem("Go to Child Commit", "←", "", () => {
        if (childCommit) $$props.onSelectCommit(childCommit.hash);
      }, !childCommit);

      // 20. Go to Parent Commit
      const hasParent = commit.parents && commit.parents.length > 0;
      addItem("Go to Parent Commit", "→", "", () => {
        if (hasParent) $$props.onSelectCommit(commit.parents[0]);
      }, !hasParent);

      addDivider();

      // 21. View in browser
      addItem("View in browser", "", ICON_WEB, () => {
        postMessage("openInBrowser", { hash: commit.hash });
      });

      document.body.appendChild(menu);
      let x = e.clientX;
      let y = e.clientY;
      const rect = menu.getBoundingClientRect();
      if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 8;
      if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8;
      menu.style.left = Math.max(0, x) + "px";
      menu.style.top = Math.max(0, y) + "px";
    }

    function onContextMenu(e, commit) {
      showCommitContextMenu(e, commit);
    }
    function closeContextMenu() {
      set(showContextMenu, false);
      set(contextMenuHash, null);
    }
    function handleRebase() {
      if (get(contextMenuHash)) {
        $$props.onRebaseFromHere(get(contextMenuHash));
      }
      closeContextMenu();
    }
    user_effect(() => {
      if ($$props.scrollToIndex >= 0 && get(containerEl)) {
        const targetY = $$props.scrollToIndex * ROW_HEIGHT;
        get(containerEl).scrollTo({
          top: targetY - get(containerHeight) / 2 + ROW_HEIGHT,
          behavior: "smooth"
        });
      }
    });
    onMount(() => {
      const closeAllMenus = () => {
        closeContextMenu();
        closeCommitContextMenu();
        closeBranchContextMenu();
      };

      const mousedownHandler = (ev) => {
        const target = ev.target && ev.target.nodeType === 1 ? ev.target : ev.target?.parentElement;
        if (!target || (!target.closest?.(".commit-context-menu") && !target.closest?.(".branch-context-menu"))) {
          closeAllMenus();
        }
      };

      const keydownHandler = (ev) => {
        if (ev.key === "Escape") {
          closeAllMenus();
          return;
        }
        if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) return;
        const selHash = $$props.selectedHash;
        if (!selHash) return;
        const commits = $$props.commits || [];
        const commit = commits.find(c => c.hash === selHash);
        if (!commit) return;

        if (ev.key === "F2") {
          ev.preventDefault();
          openEditCommitMessageDialog(commit);
        } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === "c" || ev.key === "C") && !window.getSelection()?.toString()) {
          ev.preventDefault();
          navigator.clipboard.writeText(commit.hash);
          showToast("Copied " + commit.hash.slice(0, 8) + " to clipboard");
        } else if (ev.key === "ArrowLeft") {
          const childCommit = commits.find(c => c.parents && c.parents.includes(commit.hash));
          if (childCommit) {
            ev.preventDefault();
            $$props.onSelectCommit(childCommit.hash);
          }
        } else if (ev.key === "ArrowRight") {
          if (commit.parents && commit.parents.length > 0) {
            ev.preventDefault();
            $$props.onSelectCommit(commit.parents[0]);
          }
        }
      };

      document.addEventListener("mousedown", mousedownHandler);
      window.addEventListener("keydown", keydownHandler);

      return () => {
        document.removeEventListener("mousedown", mousedownHandler);
        window.removeEventListener("keydown", keydownHandler);
      };
    });
    var fragment = root3();
    var div = first_child(fragment);
    var div_1 = child(div);
    var div_2 = child(div_1);
    var div_3 = child(div_2);
    var node = child(div_3);
    {
      let $0 = user_derived(() => get(endIndex) - get(startIndex));
      CommitGraph(node, {
        get nodes() {
          return get(graphNodes);
        },
        get graphWidth() {
          return $$props.graphWidth;
        },
        get startIndex() {
          return get(startIndex);
        },
        get visibleCount() {
          return get($0);
        },
        rowHeight: ROW_HEIGHT
      });
    }
    reset(div_3);
    var div_4 = sibling(div_3, 2);
    each(div_4, 21, () => get(visibleCommits), index, ($$anchor2, commit, i) => {
      const rowIdx = user_derived(() => get(startIndex) + i);
      var div_5 = root_12();
      let classes;
      set_style(div_5, "height: 25px;");
      var span = child(div_5);
      var text2 = child(span, true);
      reset(span);
      var node_1 = sibling(span, 2);
      {
        var consequent = ($$anchor3) => {
          BranchLabels($$anchor3, {
            get refs() {
              return get(commit).refs;
            }
          });
        };
        if_block(node_1, ($$render) => {
          if (get(commit).refs.length > 0)
            $$render(consequent);
        });
      }
      var span_1 = sibling(node_1, 2);
      var text_1 = child(span_1, true);
      reset(span_1);
      var span_2 = sibling(span_1, 2);
      var text_2 = child(span_2, true);
      reset(span_2);
      var span_3 = sibling(span_2, 2);
      var text_3 = child(span_3, true);
      reset(span_3);
      reset(div_5);
      template_effect(
        ($0) => {
          const isMerge = (get(commit).parents && get(commit).parents.length > 1) || (get(commit).subject && get(commit).subject.startsWith("Merge "));
          classes = set_class(div_5, 1, "commit-row svelte-1rusxbg" + (isMerge ? " is-merge" : ""), null, classes, { selected: get(commit).hash === $$props.selectedHash });
          const g = get(commit).graph;
          let maxCol = g ? g.column : 0;
          if (g && g.lines) {
            for (let li = 0; li < g.lines.length; li++) {
              const l = g.lines[li];
              if (l.fromColumn > maxCol) maxCol = l.fromColumn;
              if (l.toColumn > maxCol) maxCol = l.toColumn;
            }
          }
          const rowBranches = Math.max(4, maxCol + 1);
          const gw = rowBranches * 16 + 20;
          set_style(span, `width: ${gw}px; min-width: ${gw}px;`);
          set_text(text2, "");
          set_attribute2(span_1, "title", get(commit).subject);
          set_text(text_1, get(commit).subject);
          set_text(text_2, get(commit).author);
          set_text(text_3, $0);
        },
        [() => formatDate(get(commit).authorDate)]
      );
      delegated("click", div_5, () => $$props.onSelectCommit(get(commit).hash));
      delegated("contextmenu", div_5, (e) => onContextMenu(e, get(commit)));
      append($$anchor2, div_5);
    });
    reset(div_4);
    reset(div_2);
    reset(div_1);
    reset(div);
    bind_this(div, ($$value) => set(containerEl, $$value), () => get(containerEl));
    var node_2 = sibling(div, 2);
    {
      var consequent_1 = ($$anchor2) => {
        var div_6 = root_32();
        var button = child(div_6);
        reset(div_6);
        template_effect(() => set_style(div_6, `left: ${get(contextMenuPos).x ?? ""}px; top: ${get(contextMenuPos).y ?? ""}px;`));
        delegated("click", button, handleRebase);
        append($$anchor2, div_6);
      };
      if_block(node_2, ($$render) => {
        if (get(showContextMenu))
          $$render(consequent_1);
      });
    }
    template_effect(() => {
      set_style(div_1, `height: ${$$props.commits.length * ROW_HEIGHT}px; position: relative; min-width: 100%; width: max-content;`);
      set_style(div_2, `transform: translateY(${get(startIndex) * ROW_HEIGHT}px); min-width: 100%; width: max-content;`);
    });
    event("scroll", div, onScroll);
    append($$anchor, fragment);
    pop();
  }
  delegate(["click", "contextmenu"]);

  // webview/graph/CommitDetail.svelte
  var root_22 = from_html(`<div class="body svelte-ctw68d"> </div>`);
  var root_33 = from_html(`<div class="meta-row svelte-ctw68d"><span class="meta-label svelte-ctw68d">Parents</span> <span class="meta-value mono svelte-ctw68d"> </span></div>`);
  var root_42 = from_html(`<div class="loading-files svelte-ctw68d">Loading...</div>`);
  var root_6 = from_html(`<button class="file-row svelte-ctw68d" type="button"><span> </span> <span class="file-path svelte-ctw68d"><span class="file-dir svelte-ctw68d"> </span> <span class="file-name svelte-ctw68d"> </span></span></button>`);
  var root_5 = from_html(`<div class="files-list svelte-ctw68d"></div>`);
  var root_13 = from_html(`<div class="detail svelte-ctw68d"><div class="header svelte-ctw68d"><div class="subject svelte-ctw68d"> </div> <!> <div class="meta svelte-ctw68d"><div class="meta-row svelte-ctw68d"><span class="meta-label svelte-ctw68d">Hash</span> <span class="meta-value mono svelte-ctw68d"> </span></div> <div class="meta-row svelte-ctw68d"><span class="meta-label svelte-ctw68d">Author</span> <span class="meta-value svelte-ctw68d"> </span></div> <div class="meta-row svelte-ctw68d"><span class="meta-label svelte-ctw68d">Date</span> <span class="meta-value svelte-ctw68d"> </span></div> <!></div></div> <div class="files-header svelte-ctw68d"> </div> <!></div>`);
  var $$css4 = {
    hash: "svelte-ctw68d",
    code: ".detail.svelte-ctw68d {padding:12px;position:relative;}.header.svelte-ctw68d {padding-bottom:12px;border-bottom:1px solid var(--vscode-panel-border);padding-right:24px;}.subject.svelte-ctw68d {font-weight:600;margin-bottom:4px;}.body.svelte-ctw68d {white-space:pre-wrap;color:var(--vscode-descriptionForeground);font-size:0.9em;margin-bottom:8px;}.meta.svelte-ctw68d {font-size:0.85em;}.meta-row.svelte-ctw68d {display:flex;gap:8px;padding:2px 0;}.meta-label.svelte-ctw68d {color:var(--vscode-descriptionForeground);width:50px;flex-shrink:0;}.meta-value.svelte-ctw68d {overflow:hidden;text-overflow:ellipsis;word-break:break-all;}.mono.svelte-ctw68d {font-family:var(--vscode-editor-font-family, monospace);font-size:0.95em;}.files-header.svelte-ctw68d {padding:8px 0 4px;font-weight:600;font-size:0.9em;color:var(--vscode-descriptionForeground);}.loading-files.svelte-ctw68d {padding:8px 0;color:var(--vscode-descriptionForeground);font-size:0.9em;}.files-list.svelte-ctw68d {display:flex;flex-direction:column;}.file-row.svelte-ctw68d {display:flex;align-items:center;gap:6px;padding:3px 4px;cursor:pointer;border-radius:3px;background:none;border:none;color:inherit;font:inherit;text-align:left;width:100%;}.file-row.svelte-ctw68d:hover {background:var(--vscode-list-hoverBackground);}.file-status.svelte-ctw68d {flex-shrink:0;width:16px;text-align:center;font-weight:600;font-size:0.85em;}.status-added.svelte-ctw68d {color:#73c991;}.status-modified.svelte-ctw68d {color:#e2c08d;}.status-deleted.svelte-ctw68d {color:#c74e39;}.status-renamed.svelte-ctw68d {color:#569cd6;}.file-path.svelte-ctw68d {overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.9em;}.file-dir.svelte-ctw68d {color:var(--vscode-descriptionForeground);}.file-name.svelte-ctw68d {color:var(--vscode-foreground);}"
  };
  function CommitDetail($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css4);
    function handleFileClick(file) {
      if (!$$props.commit)
        return;
      postMessage("openDiff", {
        hash: $$props.commit.hash,
        file: { path: file.path, status: file.status, oldPath: file.oldPath }
      });
    }
    function statusLabel(status) {
      switch (status) {
        case "A":
          return "Added";
        case "M":
          return "Modified";
        case "D":
          return "Deleted";
        case "R":
          return "Renamed";
        case "C":
          return "Copied";
        default:
          return status;
      }
    }
    function statusClass(status) {
      switch (status) {
        case "A":
          return "status-added";
        case "M":
          return "status-modified";
        case "D":
          return "status-deleted";
        case "R":
          return "status-renamed";
        default:
          return "";
      }
    }
    function fileName(path) {
      return path.split("/").pop() || path;
    }
    function dirName(path) {
      const parts = path.split("/");
      if (parts.length <= 1)
        return "";
      return parts.slice(0, -1).join("/") + "/";
    }
    function formatFullDate(iso) {
      return new Date(iso).toLocaleString();
    }
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent_3 = ($$anchor2) => {
        var div = root_13();
        var div_1 = child(div);
        var div_2 = child(div_1);
        var text2 = child(div_2, true);
        reset(div_2);
        var node_1 = sibling(div_2, 2);
        {
          var consequent = ($$anchor3) => {
            var div_3 = root_22();
            var text_1 = child(div_3, true);
            reset(div_3);
            template_effect(() => set_text(text_1, $$props.commit.body));
            append($$anchor3, div_3);
          };
          if_block(node_1, ($$render) => {
            if ($$props.commit.body)
              $$render(consequent);
          });
        }
        var div_4 = sibling(node_1, 2);
        var div_5 = child(div_4);
        var span = sibling(child(div_5), 2);
        var text_2 = child(span, true);
        reset(span);
        reset(div_5);
        var div_6 = sibling(div_5, 2);
        var span_1 = sibling(child(div_6), 2);
        var text_3 = child(span_1);
        reset(span_1);
        reset(div_6);
        var div_7 = sibling(div_6, 2);
        var span_2 = sibling(child(div_7), 2);
        var text_4 = child(span_2, true);
        reset(span_2);
        reset(div_7);
        var node_2 = sibling(div_7, 2);
        {
          var consequent_1 = ($$anchor3) => {
            var div_8 = root_33();
            var span_3 = sibling(child(div_8), 2);
            var text_5 = child(span_3, true);
            reset(span_3);
            reset(div_8);
            template_effect(($0) => set_text(text_5, $0), [
              () => $$props.commit.parents.map((p) => p.slice(0, 7)).join(", ")
            ]);
            append($$anchor3, div_8);
          };
          if_block(node_2, ($$render) => {
            if ($$props.commit.parents.length > 0)
              $$render(consequent_1);
          });
        }
        reset(div_4);
        reset(div_1);
        var div_9 = sibling(div_1, 2);
        var text_6 = child(div_9);
        reset(div_9);
        var node_3 = sibling(div_9, 2);
        {
          var consequent_2 = ($$anchor3) => {
            var div_10 = root_42();
            append($$anchor3, div_10);
          };
          var alternate = ($$anchor3) => {
            var div_11 = root_5();
            each(div_11, 21, () => $$props.files, index, ($$anchor4, file) => {
              var button = root_6();
              var span_4 = child(button);
              var text_7 = child(span_4, true);
              reset(span_4);
              var span_5 = sibling(span_4, 2);
              var span_6 = child(span_5);
              var text_8 = child(span_6, true);
              reset(span_6);
              var span_7 = sibling(span_6, 2);
              var text_9 = child(span_7, true);
              reset(span_7);
              reset(span_5);
              reset(button);
              template_effect(
                ($0, $1, $2, $3) => {
                  set_class(span_4, 1, `file-status ${$0 ?? ""}`, "svelte-ctw68d");
                  set_attribute2(span_4, "title", $1);
                  set_text(text_7, get(file).status);
                  set_attribute2(span_5, "title", get(file).path);
                  set_text(text_8, $2);
                  set_text(text_9, $3);
                },
                [
                  () => statusClass(get(file).status),
                  () => statusLabel(get(file).status),
                  () => dirName(get(file).path),
                  () => fileName(get(file).path)
                ]
              );
              delegated("click", button, () => handleFileClick(get(file)));
              append($$anchor4, button);
            });
            reset(div_11);
            append($$anchor3, div_11);
          };
          if_block(node_3, ($$render) => {
            if ($$props.files.length === 0)
              $$render(consequent_2);
            else
              $$render(alternate, false);
          });
        }
        reset(div);
        template_effect(
          ($0) => {
            set_text(text2, $$props.commit.subject);
            set_text(text_2, $$props.commit.hash);
            set_text(text_3, `${$$props.commit.author ?? ""} <${$$props.commit.authorEmail ?? ""}>`);
            set_text(text_4, $0);
            set_text(text_6, `Changed Files (${$$props.files.length ?? ""})`);
          },
          [() => formatFullDate($$props.commit.authorDate)]
        );
        append($$anchor2, div);
      };
      if_block(node, ($$render) => {
        if ($$props.commit)
          $$render(consequent_3);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  delegate(["click"]);

  // webview/graph/FilterBar.svelte
  var root4 = from_html(`<div class="filter-bar svelte-51df0s"><input type="text" placeholder="Branch..." class="filter-input svelte-51df0s"/> <input type="text" placeholder="Author..." class="filter-input svelte-51df0s"/> <input type="date" placeholder="After..." class="filter-input date-input svelte-51df0s"/> <input type="date" placeholder="Before..." class="filter-input date-input svelte-51df0s"/> <input type="text" placeholder="File path..." class="filter-input svelte-51df0s"/> <button class="filter-btn svelte-51df0s">Filter</button> <button class="filter-btn clear svelte-51df0s">Clear</button></div>`);
  var $$css5 = {
    hash: "svelte-51df0s",
    code: ".filter-bar.svelte-51df0s {display:flex;gap:12px;padding:0 12px;background:var(--vscode-editor-background);border-bottom:1px solid var(--vscode-panel-border);align-items:center;height:34px;min-height:34px;box-sizing:border-box;font-size:12px;position:relative;z-index:100;user-select:none;}.as-search-box {display:flex;align-items:center;background:var(--vscode-input-background, #3c3c3c);border:1px solid rgba(128,128,128,0.25);border-radius:4px;padding:0 6px;height:24px;width:200px;gap:4px;flex-shrink:0;}.as-search-box:focus-within {border-color:var(--vscode-focusBorder, #007acc);}.as-search-input {background:transparent;border:none;outline:none;color:var(--vscode-input-foreground);font-size:12px;flex:1;min-width:60px;}.as-search-icon {color:#8c8c8c;font-size:11px;display:flex;align-items:center;}.as-search-opt {font-size:11px;color:#8c8c8c;padding:1px 3px;border-radius:2px;cursor:pointer;user-select:none;font-family:monospace;}.as-search-opt:hover {color:#ffffff;background:rgba(255,255,255,0.1);}.as-search-opt.active {color:#58a6ff;background:rgba(56,139,253,0.2);}.as-filter-label {display:inline-flex;align-items:center;gap:3px;height:24px;padding:0 5px;border-radius:3px;cursor:pointer;font-size:12px;color:#cccccc;position:relative;flex-shrink:0;white-space:nowrap;}.as-filter-label:hover {background:rgba(255, 255, 255, 0.08);color:#ffffff;}.as-filter-label .lbl-prefix {color:#8c8c8c;}.as-filter-label .lbl-val {color:#ffffff;font-weight:500;}.as-filter-label .lbl-arrow {font-size:9px;color:#8c8c8c;margin-left:2px;}.as-filter-label .lbl-clear {color:#8c8c8c;margin-left:3px;font-size:12px;padding:0 2px;border-radius:50%;line-height:1;}.as-filter-label .lbl-clear:hover {color:#ffffff;background:rgba(255,255,255,0.2);}.as-toolbar-right {margin-left:auto;display:flex;align-items:center;gap:10px;color:#8c8c8c;}.as-tool-icon {cursor:pointer;display:flex;align-items:center;padding:2px 4px;border-radius:3px;}.as-tool-icon:hover {color:#ffffff;background:rgba(255,255,255,0.1);}.filter-popup {position:absolute;top:calc(100% + 4px);left:0;background:var(--vscode-menu-background, #2b2d30);border:1px solid var(--vscode-menu-border, #393b40);border-radius:6px;box-shadow:0 8px 24px rgba(0, 0, 0, 0.65);min-width:230px;max-width:340px;max-height:360px;overflow-y:auto;z-index:1000;padding:4px;display:none;flex-direction:column;}.filter-popup-search {padding:4px 6px 6px;border-bottom:1px solid var(--vscode-menu-border, #393b40);flex-shrink:0;}.filter-popup-search input {width:100%;box-sizing:border-box;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:3px 6px;font-size:11px;outline:none;}.filter-popup-item {padding:4px 12px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--vscode-menu-foreground, #dfe1e5);cursor:pointer;font-size:12px;white-space:nowrap;margin:1px 0;}.filter-popup-item:hover {background:var(--vscode-menu-selectionBackground, #2e436e);color:var(--vscode-menu-selectionForeground, #ffffff);}.filter-popup-item.selected {font-weight:600;color:var(--vscode-terminal-ansiYellow, #e5a50a);}.filter-popup-header {padding:6px 10px 2px;font-size:10px;font-weight:600;color:var(--vscode-descriptionForeground, #7f858e);text-transform:uppercase;letter-spacing:0.5px;}.filter-popup-divider {height:1px;background:var(--vscode-menu-separatorBackground, var(--vscode-menu-border, #393b40));margin:4px 0;}.filter-custom-date {padding:8px 12px;display:flex;flex-direction:column;gap:6px;}.filter-custom-date label {font-size:11px;color:var(--vscode-descriptionForeground, #7f858e);}.filter-custom-date input {background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:3px 6px;font-size:11px;outline:none;}.filter-apply-btn {margin-top:4px;background:var(--vscode-button-background, #2e436e);color:var(--vscode-button-foreground, #ffffff);border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;align-self:flex-end;}.filter-apply-btn:hover {background:var(--vscode-button-hoverBackground, #355389);}.branch-context-menu, .commit-context-menu {position:fixed;background:var(--vscode-menu-background, #2b2d30);border:1px solid var(--vscode-menu-border, #393b40);border-radius:6px;box-shadow:0 8px 24px rgba(0, 0, 0, 0.65);padding:4px;z-index:2000;min-width:270px;max-height:calc(100vh - 16px);overflow-y:auto;box-sizing:border-box;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;font-size:12px;user-select:none;color:var(--vscode-menu-foreground, #dfe1e5);}.commit-context-menu::-webkit-scrollbar, .branch-context-menu::-webkit-scrollbar {width:5px;}.commit-context-menu::-webkit-scrollbar-thumb, .branch-context-menu::-webkit-scrollbar-thumb {background:rgba(255, 255, 255, 0.2);border-radius:3px;}.commit-context-menu::-webkit-scrollbar-thumb:hover, .branch-context-menu::-webkit-scrollbar-thumb:hover {background:rgba(255, 255, 255, 0.35);}.bcm-item, .ccm-item {padding:4px 10px;border-radius:4px;display:flex;align-items:center;justify-content:flex-start;gap:8px;color:var(--vscode-menu-foreground, #dfe1e5);cursor:pointer;white-space:nowrap;margin:1px 0;height:24px;box-sizing:border-box;}.bcm-item:hover, .ccm-item:hover {background:var(--vscode-menu-selectionBackground, #2e436e);color:var(--vscode-menu-selectionForeground, #ffffff);}.ccm-item.disabled {opacity:0.38;cursor:default;pointer-events:none;}.ccm-icon {width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:inherit;opacity:0.85;}.ccm-label {flex:1;text-align:left;}.bcm-shortcut, .ccm-shortcut {font-size:11px;color:var(--vscode-descriptionForeground, #8c8c8c);opacity:0.65;margin-left:auto;padding-left:16px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;}.bcm-item:hover .bcm-shortcut, .ccm-item:hover .ccm-shortcut {color:var(--vscode-menu-selectionForeground, #ffffff);opacity:0.9;}.bcm-divider, .ccm-divider {height:1px;background:var(--vscode-menu-separatorBackground, var(--vscode-menu-border, #393b40));margin:4px 0;}.ccm-arrow {margin-left:auto;font-size:12px;opacity:0.65;}.has-submenu {position:relative;}.ccm-submenu {display:none;position:absolute;left:100%;top:-4px;margin-left:2px;}.as-mini-toast {position:fixed;bottom:24px;right:24px;background:var(--vscode-notifications-background, #2b2d30);color:var(--vscode-notifications-foreground, #dfe1e5);border:1px solid var(--vscode-notifications-border, #393b40);border-radius:6px;padding:8px 14px;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,0.5);z-index:9999;opacity:0;transform:translateY(8px);transition:all 0.2s ease;pointer-events:none;}.as-mini-toast.visible {opacity:1;transform:translateY(0);}.as-dialog-overlay {position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(1px);}.as-dialog-card {background:var(--vscode-editor-background, #1e1f22);border:1px solid var(--vscode-panel-border, #393b40);border-radius:8px;box-shadow:0 16px 48px rgba(0,0,0,0.75);width:560px;max-width:92vw;display:flex;flex-direction:column;color:var(--vscode-editor-foreground, #dfe1e5);font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;overflow:hidden;box-sizing:border-box;}.as-dialog-header {padding:10px 16px;font-size:13px;font-weight:600;background:var(--vscode-titleBar-activeBackground, #2b2d30);border-bottom:1px solid var(--vscode-panel-border, #393b40);display:flex;align-items:center;justify-content:space-between;user-select:none;}.as-dialog-close {cursor:pointer;padding:2px 6px;border-radius:4px;opacity:0.7;}.as-dialog-close:hover {opacity:1;background:rgba(255,255,255,0.1);}.as-dialog-body {padding:14px 16px;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;}.as-dialog-field-label {font-size:11px;font-weight:600;color:var(--vscode-descriptionForeground, #8c8c8c);text-transform:uppercase;letter-spacing:0.5px;}.as-dialog-input {width:100%;box-sizing:border-box;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:7px 10px;font-size:13px;outline:none;font-family:inherit;}.as-dialog-input:focus, .as-dialog-textarea:focus {border-color:var(--vscode-focusBorder, #3574f0);}.as-dialog-textarea {width:100%;box-sizing:border-box;background:var(--vscode-input-background, #1e1f22);color:var(--vscode-input-foreground, #dfe1e5);border:1px solid var(--vscode-input-border, #4e5157);border-radius:4px;padding:8px 10px;font-size:12px;min-height:140px;max-height:320px;resize:vertical;outline:none;font-family:inherit;line-height:1.45;}.as-dialog-footer {padding:10px 16px;background:var(--vscode-editor-background, #1e1f22);border-top:1px solid var(--vscode-panel-border, #393b40);display:flex;align-items:center;justify-content:flex-end;gap:8px;box-sizing:border-box;}.as-dialog-btn {padding:6px 16px;font-size:12px;border-radius:4px;cursor:pointer;border:none;font-weight:500;user-select:none;}.as-dialog-btn-primary {background:var(--vscode-button-background, #2e436e);color:var(--vscode-button-foreground, #ffffff);}.as-dialog-btn-primary:hover {background:var(--vscode-button-hoverBackground, #355389);}.as-dialog-btn-secondary {background:transparent;color:var(--vscode-menu-foreground, #dfe1e5);border:1px solid var(--vscode-panel-border, #4e5157);}.as-dialog-btn-secondary:hover {background:rgba(255,255,255,0.08);}"
  };
      function FilterBar($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css5);

    var bar = document.createElement("div");
    bar.className = "filter-bar svelte-51df0s";

    let curQuery = "";
    let curBranch = $$props.activeBranch || "";
    let curUser = "";
    let curDate = "";
    let curAfter = "";
    let curBefore = "";
    let curPath = "";
    let isRegex = false;
    let isCase = false;

    function applyFilter() {
      $$props.onFilter({
        query: curQuery || void 0,
        branch: curBranch || void 0,
        author: curUser || void 0,
        after: curAfter || void 0,
        before: curBefore || void 0,
        path: curPath || void 0
      });
      updateLabels();
    }

    // 1. Search Box with Q icon and .* Cc options
    const searchBox = document.createElement("div");
    searchBox.className = "as-search-box";
    searchBox.innerHTML = '<span class="as-search-icon"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 0-1.06 1.06l3.79 3.79a.75.75 0 1 0 1.06-1.06l-3.79-3.79z"/></svg></span>';
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "as-search-input";
    searchInput.placeholder = "Text or hash";
    let searchDebounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        const val = searchInput.value.trim();
        if (val !== curQuery) {
          curQuery = val;
          applyFilter();
        }
      }, 300);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        clearTimeout(searchDebounceTimer);
        curQuery = searchInput.value.trim();
        applyFilter();
      }
    });
    searchBox.appendChild(searchInput);

    const regexBtn = document.createElement("span");
    regexBtn.className = "as-search-opt";
    regexBtn.textContent = ".*";
    regexBtn.title = "Regex";
    regexBtn.addEventListener("click", () => {
      isRegex = !isRegex;
      regexBtn.className = "as-search-opt" + (isRegex ? " active" : "");
    });
    searchBox.appendChild(regexBtn);

    const caseBtn = document.createElement("span");
    caseBtn.className = "as-search-opt";
    caseBtn.textContent = "Cc";
    caseBtn.title = "Match Case";
    caseBtn.addEventListener("click", () => {
      isCase = !isCase;
      caseBtn.className = "as-search-opt" + (isCase ? " active" : "");
    });
    searchBox.appendChild(caseBtn);

    bar.appendChild(searchBox);

    function closeAllPopups() {
      branchPopup.style.display = "none";
      userPopup.style.display = "none";
      datePopup.style.display = "none";
      pathPopup.style.display = "none";
    }

    document.addEventListener("click", (e) => {
      if (!bar.contains(e.target)) {
        closeAllPopups();
      }
    });

    // 2. Branch Dropdown
    const branchContainer = document.createElement("div");
    branchContainer.style.position = "relative";
    const branchLabel = document.createElement("div");
    branchLabel.className = "as-filter-label";
    branchContainer.appendChild(branchLabel);

    const branchPopup = document.createElement("div");
    branchPopup.className = "filter-popup";
    branchPopup.innerHTML = '<div class="filter-popup-search"><input type="text" placeholder="Search branch..." /></div><div class="branch-popup-items" style="overflow-y:auto;flex:1;"></div>';
    branchContainer.appendChild(branchPopup);
    const branchSearchInput = branchPopup.querySelector("input");
    const branchItemsContainer = branchPopup.querySelector(".branch-popup-items");

    branchSearchInput.addEventListener("input", () => {
      renderBranchItems(branchSearchInput.value.toLowerCase());
    });

    function renderBranchItems(search = "") {
      branchItemsContainer.innerHTML = "";
      const bData = $$props.branchData || { branches: [], currentBranch: "" };
      const branches = bData.branches || [];

      const allItem = document.createElement("div");
      allItem.className = "filter-popup-item" + (!curBranch ? " selected" : "");
      allItem.textContent = "All Branches";
      allItem.addEventListener("click", () => {
        curBranch = "";
        if ($$props.setActiveBranch) $$props.setActiveBranch("");
        closeAllPopups();
        applyFilter();
      });
      branchItemsContainer.appendChild(allItem);

      if (bData.currentBranch && (!search || bData.currentBranch.toLowerCase().includes(search))) {
        const headItem = document.createElement("div");
        headItem.className = "filter-popup-item" + (curBranch === "HEAD" ? " selected" : "");
        headItem.innerHTML = '<span>HEAD (' + bData.currentBranch + ')</span>';
        headItem.addEventListener("click", () => {
          curBranch = "HEAD";
          if ($$props.setActiveBranch) $$props.setActiveBranch("HEAD");
          closeAllPopups();
          applyFilter();
        });
        branchItemsContainer.appendChild(headItem);
      }

      const localList = branches.filter(b => !b.remote && (!search || b.name.toLowerCase().includes(search)));
      if (localList.length > 0) {
        const hdr = document.createElement("div");
        hdr.className = "filter-popup-header";
        hdr.textContent = "Local";
        branchItemsContainer.appendChild(hdr);
        for (const b of localList) {
          const item = document.createElement("div");
          item.className = "filter-popup-item" + (curBranch === b.name ? " selected" : "");
          item.textContent = b.name;
          item.addEventListener("click", () => {
            curBranch = b.name;
            if ($$props.setActiveBranch) $$props.setActiveBranch(b.name);
            closeAllPopups();
            applyFilter();
          });
          branchItemsContainer.appendChild(item);
        }
      }

      const remoteList = branches.filter(b => b.remote && (!search || b.name.toLowerCase().includes(search)));
      if (remoteList.length > 0) {
        const hdr = document.createElement("div");
        hdr.className = "filter-popup-header";
        hdr.textContent = "Remote";
        branchItemsContainer.appendChild(hdr);
        for (const b of remoteList) {
          const item = document.createElement("div");
          item.className = "filter-popup-item" + (curBranch === b.name ? " selected" : "");
          item.textContent = b.name;
          item.addEventListener("click", () => {
            curBranch = b.name;
            if ($$props.setActiveBranch) $$props.setActiveBranch(b.name);
            closeAllPopups();
            applyFilter();
          });
          branchItemsContainer.appendChild(item);
        }
      }
    }

    branchLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = branchPopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        renderBranchItems();
        branchPopup.style.display = "flex";
        setTimeout(() => branchSearchInput.focus(), 20);
      }
    });

    bar.appendChild(branchContainer);

    // 3. User Dropdown
    const userContainer = document.createElement("div");
    userContainer.style.position = "relative";
    const userLabel = document.createElement("div");
    userLabel.className = "as-filter-label";
    userContainer.appendChild(userLabel);

    const userPopup = document.createElement("div");
    userPopup.className = "filter-popup";
    userPopup.innerHTML = '<div class="filter-popup-search"><input type="text" placeholder="Type user name or email..." /></div><div class="user-popup-items" style="overflow-y:auto;flex:1;"></div>';
    userContainer.appendChild(userPopup);
    const userSearchInput = userPopup.querySelector("input");
    const userItemsContainer = userPopup.querySelector(".user-popup-items");

    userSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && userSearchInput.value.trim()) {
        curUser = userSearchInput.value.trim();
        closeAllPopups();
        applyFilter();
      }
    });
    userSearchInput.addEventListener("input", () => {
      renderUserItems(userSearchInput.value.toLowerCase());
    });

    function renderUserItems(search = "") {
      userItemsContainer.innerHTML = "";
      const allItem = document.createElement("div");
      allItem.className = "filter-popup-item" + (!curUser ? " selected" : "");
      allItem.textContent = "All Users";
      allItem.addEventListener("click", () => {
        curUser = "";
        closeAllPopups();
        applyFilter();
      });
      userItemsContainer.appendChild(allItem);

      const commitsList = $$props.commits || [];
      const authorCounts = {};
      for (const c of commitsList) {
        if (c.author) authorCounts[c.author] = (authorCounts[c.author] || 0) + 1;
      }
      const authorNames = Object.keys(authorCounts).sort();
      const filtered = authorNames.filter(name => !search || name.toLowerCase().includes(search));

      if (filtered.length > 0) {
        const hdr = document.createElement("div");
        hdr.className = "filter-popup-header";
        hdr.textContent = "Authors in repo";
        userItemsContainer.appendChild(hdr);

        for (const name of filtered) {
          const item = document.createElement("div");
          item.className = "filter-popup-item" + (curUser === name ? " selected" : "");
          item.innerHTML = '<span>' + name + '</span> <span style="opacity:0.6;font-size:11px;">(' + authorCounts[name] + ')</span>';
          item.addEventListener("click", () => {
            curUser = name;
            closeAllPopups();
            applyFilter();
          });
          userItemsContainer.appendChild(item);
        }
      }
    }

    userLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = userPopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        renderUserItems();
        userPopup.style.display = "flex";
        setTimeout(() => userSearchInput.focus(), 20);
      }
    });

    bar.appendChild(userContainer);

    // 4. Date Dropdown
    const dateContainer = document.createElement("div");
    dateContainer.style.position = "relative";
    const dateLabel = document.createElement("div");
    dateLabel.className = "as-filter-label";
    dateContainer.appendChild(dateLabel);

    const datePopup = document.createElement("div");
    datePopup.className = "filter-popup";
    const dateOptions = [
      { label: "All", key: "" },
      { label: "Today", key: "today" },
      { label: "Yesterday", key: "yesterday" },
      { label: "Last 7 Days", key: "7days" },
      { label: "Last 30 Days", key: "30days" }
    ];
    for (const opt of dateOptions) {
      const item = document.createElement("div");
      item.className = "filter-popup-item";
      item.textContent = opt.label;
      item.addEventListener("click", () => {
        if (!opt.key) {
          curDate = "";
          curAfter = "";
          curBefore = "";
        } else if (opt.key === "today") {
          curDate = "Today";
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          curAfter = now.toISOString();
          curBefore = "";
        } else if (opt.key === "yesterday") {
          curDate = "Yesterday";
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const y = new Date(now.getTime() - 86400000);
          curAfter = y.toISOString();
          curBefore = now.toISOString();
        } else if (opt.key === "7days") {
          curDate = "Last 7 Days";
          curAfter = new Date(Date.now() - 7 * 86400000).toISOString();
          curBefore = "";
        } else if (opt.key === "30days") {
          curDate = "Last 30 Days";
          curAfter = new Date(Date.now() - 30 * 86400000).toISOString();
          curBefore = "";
        }
        closeAllPopups();
        applyFilter();
      });
      datePopup.appendChild(item);
    }
    const divdr = document.createElement("div");
    divdr.className = "filter-popup-divider";
    datePopup.appendChild(divdr);

    const customDateBox = document.createElement("div");
    customDateBox.className = "filter-custom-date";
    customDateBox.innerHTML = '<label>Custom Range:</label><input type="date" id="c-after" /><input type="date" id="c-before" /><button class="filter-apply-btn">Apply</button>';
    const cAfter = customDateBox.querySelector("#c-after");
    const cBefore = customDateBox.querySelector("#c-before");
    const cApply = customDateBox.querySelector("button");
    cApply.addEventListener("click", () => {
      if (cAfter.value || cBefore.value) {
        curDate = (cAfter.value || "...") + " - " + (cBefore.value || "...");
        curAfter = cAfter.value ? new Date(cAfter.value).toISOString() : "";
        curBefore = cBefore.value ? new Date(cBefore.value).toISOString() : "";
      } else {
        curDate = "";
        curAfter = "";
        curBefore = "";
      }
      closeAllPopups();
      applyFilter();
    });
    datePopup.appendChild(customDateBox);
    dateContainer.appendChild(datePopup);

    dateLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = datePopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        datePopup.style.display = "flex";
      }
    });

    bar.appendChild(dateContainer);

    // 5. Path Dropdown (>)
    const pathContainer = document.createElement("div");
    pathContainer.style.position = "relative";
    const pathLabel = document.createElement("div");
    pathLabel.className = "as-filter-label";
    pathContainer.appendChild(pathLabel);

    const pathPopup = document.createElement("div");
    pathPopup.className = "filter-popup";
    pathPopup.style.padding = "8px 12px";
    pathPopup.innerHTML = '<input type="text" placeholder="e.g. lib/models or file.dart" style="width:100%;box-sizing:border-box;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border, rgba(128,128,128,0.3));border-radius:3px;padding:3px 6px;font-size:11px;outline:none;margin-bottom:6px;" /><button class="filter-apply-btn">Apply</button>';
    const pathInput = pathPopup.querySelector("input");
    const pathBtn = pathPopup.querySelector("button");

    pathBtn.addEventListener("click", () => {
      curPath = pathInput.value.trim();
      closeAllPopups();
      applyFilter();
    });
    pathInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        curPath = pathInput.value.trim();
        closeAllPopups();
        applyFilter();
      }
    });
    pathContainer.appendChild(pathPopup);

    pathLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = pathPopup.style.display === "flex";
      closeAllPopups();
      if (!open) {
        pathPopup.style.display = "flex";
        setTimeout(() => pathInput.focus(), 20);
      }
    });

    bar.appendChild(pathContainer);

    // 6. Right toolbar actions (matching Android Studio icons)
    const tbRight = document.createElement("div");
    tbRight.className = "as-toolbar-right";
    tbRight.innerHTML = `
      <span class="as-tool-icon" title="Fetch / Run"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5L4 2.5z"/></svg></span>
      <span class="as-tool-icon" title="Refresh"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 8a6.5 6.5 0 1 1-1.9-4.6l1.4-1.4A8.5 8.5 0 1 0 16 8h-1.5z"/><path d="M16 2v5h-5l2-2 3-3z"/></svg></span>
      <span class="as-tool-icon" title="Go to Hash / Current Revision"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06z"/></svg></span>
      <span class="as-tool-icon" title="Presentation Options"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3c-4.5 0-7.5 4.5-7.5 5s3 5 7.5 5 7.5-4.5 7.5-5-3-5-7.5-5zm0 8.5A3.5 3.5 0 1 1 8 4.5a3.5 3.5 0 0 1 0 7zm0-5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg></span>
      <span class="as-tool-icon" title="Settings"><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M9.1 1.5a1.5 1.5 0 0 0-2.2 0l-.3.3a1.5 1.5 0 0 1-1.8.3l-.4-.2a1.5 1.5 0 0 0-2.1.8l-.1.4a1.5 1.5 0 0 1-1.3 1.3l-.4.1a1.5 1.5 0 0 0-.8 2.1l.2.4a1.5 1.5 0 0 1-.3 1.8l-.3.3a1.5 1.5 0 0 0 0 2.2l.3.3a1.5 1.5 0 0 1 .3 1.8l-.2.4a1.5 1.5 0 0 0 .8 2.1l.4.1a1.5 1.5 0 0 1 1.3 1.3l.1.4a1.5 1.5 0 0 0 2.1.8l.4-.2a1.5 1.5 0 0 1 1.8.3l.3.3a1.5 1.5 0 0 0 2.2 0l.3-.3a1.5 1.5 0 0 1 1.8-.3l.4.2a1.5 1.5 0 0 0 2.1-.8l.1-.4a1.5 1.5 0 0 1 1.3-1.3l.4-.1a1.5 1.5 0 0 0 .8-2.1l-.2-.4a1.5 1.5 0 0 1 .3-1.8l.3-.3a1.5 1.5 0 0 0 0-2.2l-.3-.3a1.5 1.5 0 0 1-.3-1.8l.2-.4a1.5 1.5 0 0 0-.8-2.1l-.4-.1a1.5 1.5 0 0 1-1.3-1.3l-.1-.4a1.5 1.5 0 0 0-2.1-.8l-.4.2a1.5 1.5 0 0 1-1.8-.3l-.3-.3zM8 10.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg></span>
    `;
    const refreshBtn = tbRight.querySelectorAll(".as-tool-icon")[1];
    refreshBtn.addEventListener("click", () => {
      postMessage("refresh");
    });
    bar.appendChild(tbRight);

    function updateLabels() {
      // Branch Label
      if (curBranch) {
        branchLabel.className = "as-filter-label active";
        branchLabel.innerHTML = '<span class="lbl-prefix">Branch:</span> <span class="lbl-val">' + curBranch + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
        branchLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
          e.stopPropagation();
          curBranch = "";
          if ($$props.setActiveBranch) $$props.setActiveBranch("");
          applyFilter();
        });
      } else {
        branchLabel.className = "as-filter-label";
        branchLabel.innerHTML = '<span class="lbl-prefix">Branch</span> <span class="lbl-arrow">&#9662;</span>';
      }

      // User Label
      if (curUser) {
        userLabel.className = "as-filter-label active";
        userLabel.innerHTML = '<span class="lbl-prefix">User:</span> <span class="lbl-val">' + curUser + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
        userLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
          e.stopPropagation();
          curUser = "";
          applyFilter();
        });
      } else {
        userLabel.className = "as-filter-label";
        userLabel.innerHTML = '<span class="lbl-prefix">User</span> <span class="lbl-arrow">&#9662;</span>';
      }

      // Date Label
      if (curDate) {
        dateLabel.className = "as-filter-label active";
        dateLabel.innerHTML = '<span class="lbl-prefix">Date:</span> <span class="lbl-val">' + curDate + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
        dateLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
          e.stopPropagation();
          curDate = "";
          curAfter = "";
          curBefore = "";
          applyFilter();
        });
      } else {
        dateLabel.className = "as-filter-label";
        dateLabel.innerHTML = '<span class="lbl-prefix">Date</span> <span class="lbl-arrow">&#9662;</span>';
      }

      // Path Label
      if (curPath) {
        pathLabel.className = "as-filter-label active";
        pathLabel.innerHTML = '<span class="lbl-prefix">Path:</span> <span class="lbl-val">' + curPath + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
        pathLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
          e.stopPropagation();
          curPath = "";
          applyFilter();
        });
      } else {
        pathLabel.className = "as-filter-label";
        pathLabel.innerHTML = '<span class="lbl-prefix">&gt;</span>';
      }
    }

    user_effect(() => {
      const extBranch = $$props.activeBranch;
      if (extBranch !== undefined && extBranch !== curBranch) {
        curBranch = extBranch || "";
        updateLabels();
      }
    });

    updateLabels();
    append($$anchor, bar);
    pop();
  }

  // webview/graph/App.svelte
  var root_14 = from_html(`<div class="loading svelte-1lrl78g">Loading commits...</div>`);
  var root_23 = from_html(`<div class="empty svelte-1lrl78g">No commits found.</div>`);
  var root_43 = from_html(`<div class="detail-panel svelte-1lrl78g"><!></div>`);
  var root5 = from_html(`<div class="app svelte-1lrl78g"><!> <div class="main-area svelte-1lrl78g"><div class="center-area svelte-1lrl78g"><!></div> <!></div></div>`);
  var $$css6 = {
    hash: "svelte-1lrl78g",
    code: "html, body {margin:0;padding:0;height:100%;overflow:hidden;font-family:var(--vscode-font-family, system-ui, sans-serif);font-size:var(--vscode-font-size, 13px);color:var(--vscode-foreground);background:var(--vscode-editor-background);}.app.svelte-1lrl78g {position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;overflow:hidden;}.loading.svelte-1lrl78g, .empty.svelte-1lrl78g {padding:20px;text-align:center;color:var(--vscode-descriptionForeground);}.main-area.svelte-1lrl78g {display:flex;flex:1;min-height:0;overflow:hidden;position:relative;}.branch-sidebar.svelte-1lrl78g {width:260px;min-width:140px;background:var(--vscode-sideBar-background, #1e1e1e);overflow:hidden;display:flex;flex-direction:row;flex-shrink:0;user-select:none;font-size:1em;transition:width 0.12s ease;}.branch-splitter {width:1px;cursor:col-resize;flex-shrink:0;background:var(--vscode-panel-border, #393b40);z-index:10;user-select:none;position:relative;transition:background 0.15s ease;}.branch-splitter::before {content:\"\";position:absolute;top:0;bottom:0;left:-3px;right:-3px;cursor:col-resize;z-index:1;}.branch-splitter:hover, .branch-splitter.active {background:var(--vscode-focusBorder, #3574f0) !important;}.branch-sidebar.collapsed + .branch-splitter {display:none !important;}.branch-sidebar.collapsed {width:34px !important;min-width:34px !important;}.sidebar-strip {width:34px;background:var(--vscode-sideBar-background, #1e1e1e);border-right:1px solid var(--vscode-panel-border);display:flex;flex-direction:column;align-items:center;padding:6px 0;gap:3px;flex-shrink:0;box-sizing:border-box;}.sidebar-strip-btn {width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;color:var(--vscode-foreground);opacity:0.8;border-radius:4px;cursor:pointer;padding:0;transition:all 0.1s ease;}.sidebar-strip-btn:hover {opacity:1;background:var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.12));}.sidebar-strip-btn.active {background:var(--vscode-toolbar-activeBackground, rgba(255,255,255,0.2));opacity:1;color:#e5a50a;}.sidebar-main {flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;}.branch-sidebar.collapsed .sidebar-main {display:none;}.branch-search-box {padding:6px;border-bottom:1px solid var(--vscode-panel-border);flex-shrink:0;}.branch-search-input {width:100%;box-sizing:border-box;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border, transparent);border-radius:3px;padding:4px 6px;font-size:0.95em;outline:none;}.branch-search-input:focus {border-color:var(--vscode-focusBorder);}.branch-tree-content {flex:1;overflow-y:auto;padding:4px 0;}.branch-tree-content::-webkit-scrollbar {width:6px;height:6px;}.branch-tree-content::-webkit-scrollbar-track {background:transparent;}.branch-tree-content::-webkit-scrollbar-thumb {background:rgba(255,255,255,0.18);border-radius:3px;}.branch-tree-content::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35);}.tree-section-header {padding:4px 8px;font-weight:600;color:var(--vscode-sideBarTitle-foreground, #ccc);cursor:pointer;display:flex;align-items:center;gap:5px;font-size:1em;}.tree-section-header:hover {background:var(--vscode-list-hoverBackground);}.tree-folder-header {padding:3px 6px;font-weight:400;color:#9aa0a6;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:1em;border-radius:3px;margin:1px 4px;user-select:none;}.tree-folder-header:hover {background:var(--vscode-list-hoverBackground);color:#dfe1e5;}.tree-folder-header:hover .tree-item-icon {color:#dfe1e5 !important;}.tree-item-icon {width:16px;height:16px;min-width:16px;max-width:16px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:4px;}.tree-item {display:flex;align-items:center;gap:4px;padding:3px 6px;cursor:pointer;border-radius:3px;margin:1px 4px;white-space:nowrap;overflow:hidden;color:var(--vscode-foreground);font-size:1em;user-select:none;}.tree-folder-body {padding-left:20px;}.tree-section-body {padding-left:8px;}.arrow.spacer {visibility:hidden !important;pointer-events:none;}.tree-item:hover {background:var(--vscode-list-hoverBackground);}.tree-item.active {background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground);font-weight:600;}.tree-item.current-head {color:var(--vscode-foreground,#dfe1e5);font-weight:600;}.head-branch-box {display:flex;align-items:center;justify-content:space-between;padding:4px 8px;margin:2px 4px 4px 4px;background:transparent;border-radius:4px;cursor:pointer;user-select:none;font-size:1em;font-weight:600;color:var(--vscode-foreground,#dfe1e5);transition:background 0.12s ease;}.head-branch-box:hover {background:var(--vscode-list-hoverBackground, rgba(255,255,255,0.08));}.head-branch-box.active {background:var(--vscode-list-activeSelectionBackground,#04395e);color:var(--vscode-list-activeSelectionForeground,#ffffff);}.branch-icon {color:#dfe1e5;}.branch-icon.remote {color:#dfe1e5;}.star-icon {color:#e5a50a;}.folder-icon {color:#8c8c8c;}.arrow {color:var(--vscode-descriptionForeground, #8c8c8c);width:16px;height:16px;min-width:16px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;opacity:0.85;transition:opacity 0.1s ease, color 0.1s ease;}.arrow:hover {opacity:1;color:var(--vscode-foreground, #dfe1e5);}.center-area.svelte-1lrl78g {flex:1;min-height:0;position:relative;}.detail-panel.svelte-1lrl78g {position:relative;width:300px;min-width:180px;overflow-y:auto;flex-shrink:0;box-sizing:border-box;}.detail-panel.svelte-1lrl78g::-webkit-scrollbar {width:6px;height:6px;}.detail-panel.svelte-1lrl78g::-webkit-scrollbar-track {background:transparent;}.detail-panel.svelte-1lrl78g::-webkit-scrollbar-thumb {background:rgba(255,255,255,0.18);border-radius:3px;}.detail-panel.svelte-1lrl78g::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35);}.detail-splitter {width:1px;cursor:col-resize;flex-shrink:0;background:var(--vscode-panel-border, #393b40);z-index:10;user-select:none;position:relative;transition:background 0.15s ease;}.detail-splitter::before {content:\"\";position:absolute;top:0;bottom:0;left:-3px;right:-3px;cursor:col-resize;z-index:1;}.detail-splitter:hover, .detail-splitter.active {background:var(--vscode-focusBorder, #3574f0) !important;}.detail-close-btn {position:absolute;top:8px;right:8px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:4px;color:var(--vscode-foreground, #cccccc);opacity:0.7;cursor:pointer;z-index:10;transition:all 0.15s ease;padding:0;}.detail-close-btn:hover {opacity:1;background:var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.12));}.no-git-container {position:absolute;top:0;left:0;right:0;bottom:0;background:var(--vscode-editor-background);z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:320px;padding:32px;text-align:center;color:var(--vscode-foreground);box-sizing:border-box;user-select:none;}.app-tooltip {position:fixed;z-index:99999;pointer-events:none;background:var(--vscode-editorHoverWidget-background, #252526);color:var(--vscode-editorHoverWidget-foreground, #cccccc);border:1px solid var(--vscode-editorHoverWidget-border, #454545);box-shadow:0 4px 14px rgba(0,0,0,0.45);padding:4px 8px;border-radius:4px;font-size:11px;font-family:var(--vscode-font-family, system-ui, sans-serif);line-height:1.4;white-space:nowrap;opacity:0;visibility:hidden;transition:opacity 0.12s ease, visibility 0.12s ease;}.app-tooltip.visible {opacity:1;visibility:visible;}.app-tooltip .tooltip-shortcut {margin-left:6px;opacity:0.65;font-size:10px;background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;border:1px solid rgba(255,255,255,0.1);}.app-tooltip::before {content:\"\";position:absolute;top:50%;left:-5px;transform:translateY(-50%);width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-right:5px solid var(--vscode-editorHoverWidget-border, #454545);}"
  };
  function App($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css6);
    let commits = state(proxy([]));
    let graphWidth = state(1);
    let selectedHash = state(null);
    let selectedFiles = state(proxy([]));
    let loading = state(true);
    let scrollToIndex = state(-1);
    let unsubscribe;
    let branchData = state({ branches: [], tags: [], currentBranch: "" });
    let activeBranch = state("");
    let branchSearch = state("");
    let noGitData = state(null);
    let hasInitializedActiveBranch = false;

    onMount(() => {
      postMessage("ready");
      unsubscribe = onMessage((msg) => {
        switch (msg.type) {
          case "noGitRepo": {
            hasInitializedActiveBranch = false;
            set(loading, false);
            set(noGitData, msg.payload, true);
            break;
          }
          case "commits": {
            const p = msg.payload;
            document.querySelectorAll(".no-git-container").forEach(el => el.remove());
            const seen = new Set();
            const unique = [];
            if (p.commits) {
              for (const c of p.commits) {
                if (!seen.has(c.hash)) {
                  seen.add(c.hash);
                  unique.push(c);
                }
              }
            }
            set(noGitData, null, true);
            set(commits, unique, true);
            set(graphWidth, p.graphWidth, true);
            set(loading, false);
            break;
          }
          case "reachedEnd": {
            break;
          }
          case "error": {
            set(loading, false);
            break;
          }
          case "branches": {
            set(branchData, msg.payload, true);
            if (!hasInitializedActiveBranch) {
              hasInitializedActiveBranch = true;
              if (msg.payload && msg.payload.activeBranch) {
                set(activeBranch, msg.payload.activeBranch, true);
              }
            }
            break;
          }
          case "commitFiles": {
            const p = msg.payload;
            if (p.hash === get(selectedHash)) {
              set(selectedFiles, p.files, true);
            }
            break;
          }
          case "scrollToCommit": {
            const hash2 = msg.payload;
            set(selectedHash, hash2, true);
            set(selectedFiles, [], true);
            postMessage("selectCommit", hash2);
            const idx = get(commits).findIndex((c) => c.hash === hash2 || c.hash.startsWith(hash2) || hash2.startsWith(c.abbreviatedHash));
            if (idx >= 0) {
              set(scrollToIndex, idx, true);
            }
            break;
          }
        }
      });
    });
    onDestroy(() => unsubscribe?.());
    function onSelectCommit(hash2) {
      set(selectedHash, hash2, true);
      set(selectedFiles, [], true);
      postMessage("selectCommit", hash2);
    }
    function onFilter(filter) {
      set(loading, true);
      postMessage("filter", filter);
    }
    function onLoadMore() {
      postMessage("loadMore");
    }
    function onRebaseFromHere(hash2) {
      postMessage("rebaseFromHere", hash2);
    }
    function renderSidebarContent(container) {
      if (!container) return;
      const data = get(branchData);
      const currentActive = get(activeBranch);
      const { branches = [], tags = [], currentBranch = "" } = data;

      // Close any open context menu
      function closeBranchContextMenu() {
        const old = document.querySelector(".branch-context-menu");
        if (old) old.remove();
        const oldCommit = document.querySelectorAll(".commit-context-menu");
        oldCommit.forEach(m => m.remove());
      }

      function showBranchContextMenu(e, branchName) {
        e.preventDefault();
        e.stopPropagation();
        closeBranchContextMenu();

        const isCurrent = (branchName === currentBranch);
        const menu = document.createElement("div");
        menu.className = "branch-context-menu";

        function addItem(label, shortcut, onClick) {
          const it = document.createElement("div");
          it.className = "bcm-item";
          it.innerHTML = '<span>' + label + '</span>' + (shortcut ? '<span class="bcm-shortcut">' + shortcut + '</span>' : '');
          it.addEventListener("click", (ev) => {
            ev.stopPropagation();
            closeBranchContextMenu();
            onClick();
          });
          menu.appendChild(it);
        }

        function addDivider() {
          const d = document.createElement("div");
          d.className = "bcm-divider";
          menu.appendChild(d);
        }

        const branchInfo = branches.find((b) => b.name === branchName);
        const isRemote = branchInfo ? (!!branchInfo.remote || branchName.startsWith("origin/")) : branchName.startsWith("origin/");

        if (isCurrent) {
          addItem("New Branch from '" + branchName + "'...", "", () => {
            const name = prompt("New branch name:");
            if (name) postMessage("createBranch", { name, startPoint: branchName });
          });
          addItem("Show Diff with Working Tree", "", () => {
            postMessage("showDiff", { branch: branchName });
          });
          addDivider();
          addItem("Update", "", () => {
            postMessage("pull", branchName);
          });
          addItem("Push...", "", () => {
            postMessage("push", branchName);
          });
          addDivider();
          addItem("Rename...", "F2", () => {
            const newName = prompt("Rename branch '" + branchName + "' to:", branchName);
            if (newName && newName !== branchName) postMessage("renameBranch", { oldName: branchName, newName });
          });
        } else if (isRemote) {
          addItem("Checkout", "", () => {
            postMessage("checkout", branchName);
          });
          addItem("New Branch from '" + branchName + "'...", "", () => {
            const name = prompt("New branch name:");
            if (name) postMessage("createBranch", { name, startPoint: branchName });
          });
          addItem("Checkout and Rebase onto '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("checkoutAndRebase", { branch: branchName, onto: currentBranch });
          });
          addDivider();
          addItem("Compare with '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("compareBranch", { branch: branchName, withBranch: currentBranch });
          });
          addItem("Show Diff with Working Tree", "", () => {
            postMessage("showDiff", { branch: branchName });
          });
          addDivider();
          addItem("Rebase '" + (currentBranch || "HEAD") + "' onto '" + branchName + "'", "", () => {
            postMessage("rebase", branchName);
          });
          addItem("Merge '" + branchName + "' into '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("mergeBranch", branchName);
          });
          addDivider();
          addItem("Delete Remote Branch...", "", () => {
            postMessage("deleteBranch", branchName);
          });
        } else {
          addItem("Checkout", "", () => {
            postMessage("checkout", branchName);
          });
          addItem("New Branch from '" + branchName + "'...", "", () => {
            const name = prompt("New branch name:");
            if (name) postMessage("createBranch", { name, startPoint: branchName });
          });
          addItem("Checkout and Rebase onto '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("checkoutAndRebase", { branch: branchName, onto: currentBranch });
          });
          addDivider();
          addItem("Compare with '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("compareBranch", { branch: branchName, withBranch: currentBranch });
          });
          addItem("Show Diff with Working Tree", "", () => {
            postMessage("showDiff", { branch: branchName });
          });
          addDivider();
          addItem("Rebase '" + (currentBranch || "HEAD") + "' onto '" + branchName + "'", "", () => {
            postMessage("rebase", branchName);
          });
          addItem("Merge '" + branchName + "' into '" + (currentBranch || "HEAD") + "'", "", () => {
            postMessage("mergeBranch", branchName);
          });
          addDivider();
          addItem("Update", "", () => {
            postMessage("pull", branchName);
          });
          addItem("Push...", "", () => {
            postMessage("push", branchName);
          });
          addDivider();
          addItem("Rename...", "F2", () => {
            const newName = prompt("Rename branch '" + branchName + "' to:", branchName);
            if (newName && newName !== branchName) postMessage("renameBranch", { oldName: branchName, newName });
          });
          addItem("Delete", "", () => {
            postMessage("deleteBranch", branchName);
          });
        }

        document.body.appendChild(menu);
        let x = e.clientX;
        let y = e.clientY;
        const rect = menu.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 8;
        if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8;
        menu.style.left = Math.max(0, x) + "px";
        menu.style.top = Math.max(0, y) + "px";
      }

      document.addEventListener("click", closeBranchContextMenu);

      // 1. Tooltip system attached to document.body
      let tooltipEl = document.querySelector(".app-tooltip");
      if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.className = "app-tooltip";
        document.body.appendChild(tooltipEl);
      }

      function updateTooltip(el, text, shortcut = "") {
        el.dataset.tooltip = text;
        if (shortcut) el.dataset.shortcut = shortcut;
        el.title = text + (shortcut ? " (" + shortcut + ")" : "");
      }

      function attachTooltip(el, text, shortcut = "", side = "right") {
        updateTooltip(el, text, shortcut);
        let timer;
        el.addEventListener("mouseenter", () => {
          const currentText = el.dataset.tooltip || el.title;
          const currentShortcut = el.dataset.shortcut || "";
          if (!currentText) return;
          timer = setTimeout(() => {
            const rect = el.getBoundingClientRect();
            tooltipEl.innerHTML = currentText + (currentShortcut ? '<span class="tooltip-shortcut">' + currentShortcut + '</span>' : '');
            if (side === "bottom") {
              let left = rect.left + (rect.width / 2);
              let top = rect.bottom + 6;
              tooltipEl.style.left = left + "px";
              tooltipEl.style.top = top + "px";
              tooltipEl.style.transform = "translateX(-50%)";
            } else {
              let left = rect.right + 7;
              let top = rect.top + (rect.height / 2);
              tooltipEl.style.left = left + "px";
              tooltipEl.style.top = top + "px";
              tooltipEl.style.transform = "translateY(-50%)";
            }
            tooltipEl.classList.add("visible");
          }, 80);
        });
        el.addEventListener("mouseleave", () => {
          clearTimeout(timer);
          tooltipEl.classList.remove("visible");
        });
        el.addEventListener("click", () => {
          clearTimeout(timer);
          tooltipEl.classList.remove("visible");
        });
      }

      let strip = container.querySelector(".sidebar-strip");
      let mainArea = container.querySelector(".sidebar-main");
      let sInput = container.querySelector(".branch-search-input");
      let treeContent = container.querySelector(".branch-tree-content");

      if (!container._folderCollapseState) {
        container._folderCollapseState = new Map();
      }
      if (!container._sectionCollapseState) {
        container._sectionCollapseState = new Map();
      }
      const folderCollapseState = container._folderCollapseState;
      const sectionCollapseState = container._sectionCollapseState;

      const svgArrowRight = '<svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M6 3.5L10.5 8L6 12.5"/></svg>';
      const svgArrowDown = '<svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M3.5 6L8 10.5L12.5 6"/></svg>';
      const svgTagIcon = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="display:block;"><path d="M1.5 7.5V2.5C1.5 1.95 1.95 1.5 2.5 1.5H7.5L14.5 8.5C15.1 9.1 15.1 10.1 14.5 10.7L10.7 14.5C10.1 15.1 9.1 15.1 8.5 14.5L1.5 7.5Z" stroke="#e5a50a" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="5" cy="5" r="1.2" fill="#e5a50a"/></svg>';
      const svgBranchWhite = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style="display:block;color:#dfe1e5;"><path d="M11.75 2.5a1.75 1.75 0 1 0-2.45 1.6 4.75 4.75 0 0 0-4.05 4.65v.5a2.5 2.5 0 1 0 1.5 0v-.5c0-1.8 1.45-3.25 3.25-3.25h.25a1.75 1.75 0 0 0 1.5-3zM4 12.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm7-9a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>';

      function populateTree(searchQuery) {
        if (!treeContent) return;
        treeContent.innerHTML = "";
        const latestData = get(branchData) || {};
        const branches = latestData.branches || [];
        const tags = latestData.tags || [];
        const currentBranch = latestData.currentBranch || "";
        const currentActive = get(activeBranch);
        const favOnly = container.dataset.favOnly === "true";
        const query = (searchQuery !== undefined ? searchQuery : (sInput ? sInput.value : "")).toLowerCase().trim();
        const isFavoriteBranch = (name) => name === currentBranch || name === "develop" || name === "main" || name === "master" || name.endsWith("/develop") || name.endsWith("/main");
        const filterFn = (name) => {
          if (query && !name.toLowerCase().includes(query)) return false;
          if (favOnly && !isFavoriteBranch(name)) return false;
          return true;
        };

        function createSec(title, isOpenDefault = true) {
          const sec = document.createElement("div");
          sec.className = "tree-section";
          const hdr = document.createElement("div");
          hdr.className = "tree-section-header";
          const isCollapsed = sectionCollapseState.has(title)
            ? sectionCollapseState.get(title)
            : !isOpenDefault;
          hdr.innerHTML = '<span class="arrow">' + (isCollapsed ? svgArrowRight : svgArrowDown) + '</span> <span>' + title + '</span>';
          const bdy = document.createElement("div");
          bdy.className = "tree-section-body";
          bdy.style.paddingLeft = "8px";
          bdy.style.display = isCollapsed ? "none" : "block";
          hdr.addEventListener("click", (e) => {
            e.stopPropagation();
            const isNowCollapsed = bdy.style.display !== "none";
            bdy.style.display = isNowCollapsed ? "none" : "block";
            const arrow = hdr.querySelector(".arrow");
            if (arrow) arrow.innerHTML = isNowCollapsed ? svgArrowRight : svgArrowDown;
            sectionCollapseState.set(title, isNowCollapsed);
          });
          sec.appendChild(hdr);
          sec.appendChild(bdy);
          return { sec, bdy };
        }

        function handleBranchClick(name) {
          if (get(activeBranch) === name) {
            set(activeBranch, "", true);
            onFilter({});
          } else {
            set(activeBranch, name, true);
            onFilter({ branch: name });
          }
        }

        function getTrackingHtml(b) {
          if (!b) return "";
          let trackHtml = "";
          if (b.behind || b.ahead) {
            trackHtml = '<span class="branch-track" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;font-size:11px;font-family:var(--vscode-editor-font-family, monospace);">';
            if (b.behind) {
              const behindTxt = "Behind remote by " + b.behind + " commit" + (b.behind > 1 ? "s" : "");
              trackHtml += '<span class="track-badge behind" style="color:#58a6ff;display:inline-flex;align-items:center;gap:1px;cursor:default;" data-tooltip="' + behindTxt + '" title="' + behindTxt + '">↙ ' + b.behind + '</span>';
            }
            if (b.ahead) {
              const aheadTxt = "Ahead of remote by " + b.ahead + " commit" + (b.ahead > 1 ? "s" : "");
              trackHtml += '<span class="track-badge ahead" style="color:#3fb950;display:inline-flex;align-items:center;gap:1px;cursor:default;" data-tooltip="' + aheadTxt + '" title="' + aheadTxt + '">↗ ' + b.ahead + '</span>';
            }
            trackHtml += '</span>';
          }
          return trackHtml;
        }

        if (currentBranch && (!query || currentBranch.toLowerCase().includes(query) || "head (current branch)".includes(query))) {
          const headBox = document.createElement("div");
          headBox.className = "head-branch-box" + (currentActive === "HEAD" ? " active" : "");
          const curInfo = branches.find((b) => b.name === currentBranch);
          const trackHtml = getTrackingHtml(curInfo);
          headBox.innerHTML = '<span class="head-title">HEAD (Current Branch)</span>' + trackHtml;
          headBox.title = "HEAD (" + currentBranch + ")";
          headBox.addEventListener("click", () => handleBranchClick("HEAD"));
          headBox.addEventListener("contextmenu", (e) => showBranchContextMenu(e, currentBranch));
          treeContent.appendChild(headBox);
        }

        function createTreeNode(name = "", fullPath = "") {
          return { name, fullPath, folders: {}, branches: [] };
        }

        function insertBranchIntoTree(root, parts, branchObj) {
          if (branchObj.name.startsWith("(") || branchObj.name.startsWith("HEAD")) {
            root.branches.push({ ...branchObj, leafName: branchObj.name });
            return;
          }
          let current = root;
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current.folders[part]) {
              const nextPath = current.fullPath ? current.fullPath + "/" + part : part;
              current.folders[part] = createTreeNode(part, nextPath);
            }
            current = current.folders[part];
          }
          const leafName = parts[parts.length - 1];
          current.branches.push({ ...branchObj, leafName });
        }

        function renderTreeLevel(lvlContainer, node) {
          const curBranchObj = node.branches.find((b) => b.name === currentBranch);
          const otherBranches = node.branches
            .filter((b) => b.name !== currentBranch)
            .sort((a, b) => a.leafName.localeCompare(b.leafName));

          function renderBranchItem(b) {
            const item = document.createElement("div");
            item.className = "tree-item" + (currentActive === b.name ? " active" : "") + (b.name === currentBranch ? " current-head" : "");

            const isCur = (b.name === currentBranch);
            const isStar = b.leafName === "develop" || b.leafName === "main" || b.leafName === "master";

            let icon = '<span class="tree-item-icon">' + svgBranchWhite + '</span>';
            if (isCur) icon = '<span class="tree-item-icon">' + svgTagIcon + '</span>';
            else if (isStar) icon = '<span class="tree-item-icon"><span style="color:#e5a50a;font-size:13px;line-height:1;">★</span></span>';

            const trackHtml = getTrackingHtml(b);
            const spacer = '<span class="arrow spacer" style="visibility:hidden;pointer-events:none;"></span>';
            item.innerHTML = spacer + icon + '<span class="branch-name" style="' + (isCur ? 'font-weight:600;' : '') + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + b.leafName + '</span>' + trackHtml;
            item.title = b.name;
            item.addEventListener("click", () => handleBranchClick(b.name));
            item.addEventListener("contextmenu", (e) => showBranchContextMenu(e, b.name));
            lvlContainer.appendChild(item);
          }

          // 1. Nhánh hiện tại trước
          if (curBranchObj) {
            renderBranchItem(curBranchObj);
          }

          // 2. Đến folder từ A đến Z
          const folderKeys = Object.keys(node.folders).sort((a, b) => a.localeCompare(b));
          for (const fk of folderKeys) {
            const subNode = node.folders[fk];
            const fDiv = document.createElement("div");
            fDiv.className = "tree-folder";

            const fHdr = document.createElement("div");
            fHdr.className = "tree-folder-header";
            const folderIconSvg = '<span class="tree-item-icon" style="color:#8c8c8c;"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M1.5 3.5C1.5 2.67 2.17 2 3 2H6.2C6.6 2 6.98 2.16 7.26 2.44L8.56 3.74C8.84 4.02 9.22 4.18 9.62 4.18H13C13.83 4.18 14.5 4.85 14.5 5.68V12.5C14.5 13.33 13.83 14 13 14H3C2.17 14 1.5 13.33 1.5 12.5V3.5Z"/></svg></span>';

            const isFolderCollapsed = folderCollapseState.has(subNode.fullPath)
              ? folderCollapseState.get(subNode.fullPath)
              : false;

            fHdr.innerHTML = '<span class="arrow">' + (isFolderCollapsed ? svgArrowRight : svgArrowDown) + '</span>' + folderIconSvg + '<span>' + fk + '</span>';

            const fBdy = document.createElement("div");
            fBdy.className = "tree-folder-body";
            fBdy.style.paddingLeft = "20px";
            fBdy.style.display = isFolderCollapsed ? "none" : "block";

            fHdr.addEventListener("click", (e) => {
              e.stopPropagation();
              const isNowCollapsed = fBdy.style.display !== "none";
              fBdy.style.display = isNowCollapsed ? "none" : "block";
              const arrow = fHdr.querySelector(".arrow");
              if (arrow) arrow.innerHTML = isNowCollapsed ? svgArrowRight : svgArrowDown;
              folderCollapseState.set(subNode.fullPath, isNowCollapsed);
            });

            fDiv.appendChild(fHdr);
            renderTreeLevel(fBdy, subNode);
            fDiv.appendChild(fBdy);
            lvlContainer.appendChild(fDiv);
          }

          // 3. Mới tới các nhánh còn lại từ A đến Z
          for (const b of otherBranches) {
            renderBranchItem(b);
          }
        }

        const localList = branches.filter((b) => !b.remote && !b.name.startsWith("origin/") && !b.name.startsWith("(") && !b.name.includes("detached") && filterFn(b.name));
        if (localList.length > 0) {
          const localSec = createSec("Local", true);
          const localTree = createTreeNode();
          for (const b of localList) {
            const parts = b.name.split("/");
            insertBranchIntoTree(localTree, parts, b);
          }
          renderTreeLevel(localSec.bdy, localTree);
          treeContent.appendChild(localSec.sec);
        }

        const remoteList = branches.filter((b) => b.remote || b.name.startsWith("origin/")).filter((b) => filterFn(b.name));
        if (remoteList.length > 0) {
          const remoteSec = createSec("Remote", true);
          const remoteTree = createTreeNode();
          for (const b of remoteList) {
            const parts = b.name.split("/");
            insertBranchIntoTree(remoteTree, parts, { ...b, remote: true });
          }
          renderTreeLevel(remoteSec.bdy, remoteTree);
          treeContent.appendChild(remoteSec.sec);
        }

        if (tags.length > 0) {
          const tagSec = createSec("Tags", false);
          for (const t of tags.filter((t) => filterFn(t.name))) {
            const item = document.createElement("div");
            item.className = "tree-item";
            item.innerHTML = '<span class="arrow spacer" style="visibility:hidden;pointer-events:none;"></span><span class="tree-item-icon"><svg width="13" height="13" viewBox="0 0 16 16" fill="#d29922" style="display:block;"><path d="M1 7.7V2a1 1 0 0 1 1-1h5.7a1 1 0 0 1 .7.3l7.3 7.3a1 1 0 0 1 0 1.4l-5.7 5.7a1 1 0 0 1-1.4 0L1.3 8.4a1 1 0 0 1-.3-.7zm2.5-3.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg></span><span>' + t.name + '</span>';
            item.addEventListener("click", () => handleBranchClick(t.name));
            tagSec.bdy.appendChild(item);
          }
          treeContent.appendChild(tagSec.sec);
        }

        if (localList.length === 0 && remoteList.length === 0 && (!tags || tags.filter(t => filterFn(t.name)).length === 0) && (!currentBranch || !filterFn(currentBranch))) {
          const emptyEl = document.createElement("div");
          emptyEl.style.cssText = "padding:16px 12px;text-align:center;color:var(--vscode-descriptionForeground);font-size:12px;";
          emptyEl.textContent = query ? ('No branches matching "' + query + '"') : "No branches";
          treeContent.appendChild(emptyEl);
        }

        treeContent.querySelectorAll(".track-badge").forEach((badge) => {
          attachTooltip(badge, badge.dataset.tooltip || badge.title || "", "", "bottom");
        });
        container._populateTree = populateTree;
      }

      if (!strip || !mainArea || !sInput || !treeContent) {
        container.innerHTML = "";

        strip = document.createElement("div");
        strip.className = "sidebar-strip";

        function addStripBtn(iconSvg, title, onClick, extraClass = "", shortcut = "") {
          const btn = document.createElement("button");
          btn.className = "sidebar-strip-btn " + extraClass;
          btn.innerHTML = iconSvg;
          attachTooltip(btn, title, shortcut);
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            onClick(btn);
          });
          strip.appendChild(btn);
          return btn;
        }

        const collapseSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
        const expandSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        const isCollapsed = container.classList.contains("collapsed");
        const collapseBtn = addStripBtn(isCollapsed ? expandSvg : collapseSvg, isCollapsed ? "Expand Branches" : "Collapse Branches", (btn) => {
          container.classList.toggle("collapsed");
          const coll = container.classList.contains("collapsed");
          btn.innerHTML = coll ? expandSvg : collapseSvg;
          updateTooltip(btn, coll ? "Expand Branches" : "Collapse Branches");
        });

        // New branch (+)
        addStripBtn('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>', "New Branch...", () => {
          const base = get(activeBranch) || currentBranch || "HEAD";
          const name = prompt("New branch name (from '" + base + "'):");
          if (name && name.trim()) postMessage("createBranch", { name: name.trim(), startPoint: base });
        }, "", "+");

        // Fetch / Update Selected Branch (↙)
        addStripBtn('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>', "Update Selected Branch", () => {
          const target = get(activeBranch) || currentBranch;
          if (target) {
            postMessage("pull", target);
          }
        }, "", "Fetch/Pull");

        // Delete Selected Branch (🗑)
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>', "Delete Selected Branch", () => {
          const target = get(activeBranch);
          if (!target) {
            alert("Please select a branch to delete");
          } else if (target === currentBranch) {
            alert("Cannot delete the currently checked out branch '" + target + "'");
          } else if (confirm("Delete branch '" + target + "'?")) {
            postMessage("deleteBranch", target);
          }
        }, "", "Delete");

        // Fetch All (⇄)
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="20" y1="17" x2="4" y2="17"></line><polyline points="10 11 4 17 10 23"></polyline><line x1="4" y1="7" x2="20" y2="7"></line><polyline points="14 1 20 7 14 13"></polyline></svg>', "Fetch All Remotes", () => {
          postMessage("fetchAll");
        }, "", "git fetch --all");

        // Search (Q)
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>', "Search Branches", () => {
          if (container.classList.contains("collapsed")) {
            container.classList.remove("collapsed");
            collapseBtn.innerHTML = collapseSvg;
            updateTooltip(collapseBtn, "Collapse Branches");
          }
          if (sInput) {
            sInput.focus();
            sInput.select();
          }
        }, "", "Search");

        // Expand / Collapse all
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>', "Expand / Collapse All Folders", () => {
          const bodies = treeContent.querySelectorAll(".tree-section-body, .tree-folder-body");
          let anyOpen = false;
          bodies.forEach(b => { if (b.style.display !== "none") anyOpen = true; });
          const shouldOpen = !anyOpen;
          bodies.forEach(b => { b.style.display = shouldOpen ? "block" : "none"; });
          treeContent.querySelectorAll(".arrow").forEach(a => { a.innerHTML = shouldOpen ? svgArrowDown : svgArrowRight; });
          folderCollapseState.forEach((_, k) => folderCollapseState.set(k, !shouldOpen));
          sectionCollapseState.forEach((_, k) => sectionCollapseState.set(k, !shouldOpen));
        });

        // Star / Favorites Filter
        const favOnly = container.dataset.favOnly === "true";
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="' + (favOnly ? "#e5a50a" : "none") + '" stroke="' + (favOnly ? "#e5a50a" : "currentColor") + '" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>', favOnly ? "Show All Branches" : "Filter Favorite Branches (★)", (btn) => {
          const nowFav = container.dataset.favOnly !== "true";
          container.dataset.favOnly = nowFav ? "true" : "false";
          btn.classList.toggle("active", nowFav);
          btn.querySelector("svg").setAttribute("fill", nowFav ? "#e5a50a" : "none");
          btn.querySelector("svg").setAttribute("stroke", nowFav ? "#e5a50a" : "currentColor");
          populateTree();
        }, favOnly ? "active" : "");

        // Locate Current Branch (HEAD)
        addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>', "Locate Current Branch (HEAD)", () => {
          if (currentBranch) {
            handleBranchClick(currentBranch);
          }
        });

        container.appendChild(strip);

        mainArea = document.createElement("div");
        mainArea.className = "sidebar-main";

        const searchBox = document.createElement("div");
        searchBox.className = "branch-search-box";
        sInput = document.createElement("input");
        sInput.type = "text";
        sInput.className = "branch-search-input";
        sInput.placeholder = "Search branches...";
        sInput.addEventListener("input", (e) => {
          if (container._populateTree) {
            container._populateTree(e.target.value);
          } else {
            populateTree(e.target.value);
          }
        });
        searchBox.appendChild(sInput);
        mainArea.appendChild(searchBox);

        treeContent = document.createElement("div");
        treeContent.className = "branch-tree-content";
        mainArea.appendChild(treeContent);
        container.appendChild(mainArea);
      }

      populateTree();
    }

    var div = root5();
    var node = child(div);
    FilterBar(node, {
      onFilter,
      get branchData() {
        return get(branchData);
      },
      get commits() {
        return get(commits);
      },
      get activeBranch() {
        return get(activeBranch);
      },
      setActiveBranch(name) {
        set(activeBranch, name, true);
      }
    });
    var div_1 = sibling(node, 2);



    var div_2 = child(div_1);
    var node_1 = child(div_2);
    {
      var consequent = ($$anchor2) => {
        document.querySelectorAll(".no-git-container").forEach(el => el.remove());
        var div_3 = root_14();
        append($$anchor2, div_3);
      };
      var consequent_1 = ($$anchor2) => {
        document.querySelectorAll(".no-git-container").forEach(el => el.remove());
        if (get(noGitData)) {
          var div = document.createElement("div");
          div.className = "no-git-container";
          div.style.cssText = "position:absolute;top:0;left:0;right:0;bottom:0;background:var(--vscode-editor-background);z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:320px;padding:32px;text-align:center;color:var(--vscode-foreground);box-sizing:border-box;user-select:none;";
          
          var icon = document.createElement("div");
          icon.innerHTML = '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d29922" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
          div.appendChild(icon);

          var title = document.createElement("div");
          title.style.cssText = "font-size:16px;font-weight:600;margin:14px 0 6px;";
          title.textContent = "No Git Repository Found";
          div.appendChild(title);

          var desc = document.createElement("div");
          desc.style.cssText = "font-size:12px;color:var(--vscode-descriptionForeground);max-width:440px;line-height:1.5;margin-bottom:20px;";
          const data = get(noGitData) || {};
          desc.textContent = "The folder \"" + (data.currentPath || "") + "\" is not a Git repository.";
          div.appendChild(desc);

          if (data.subRepos && data.subRepos.length > 0) {
            var subTitle = document.createElement("div");
            subTitle.style.cssText = "font-size:12px;font-weight:600;margin-bottom:10px;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:0.5px;";
            subTitle.textContent = "Detected Git repository in subfolder:";
            div.appendChild(subTitle);

            var list = document.createElement("div");
            list.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-bottom:20px;width:100%;max-width:360px;";
            data.subRepos.forEach(r => {
              var btn = document.createElement("button");
              btn.className = "no-git-btn primary";
              btn.style.cssText = "display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 16px;border-radius:4px;background:#2e436e;color:#ffffff;border:1px solid #3e5b94;font-size:12px;font-weight:500;cursor:pointer;width:100%;";
              btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg> Open repository in \"' + r.name + '\"';
              btn.addEventListener("click", () => {
                div.remove();
                document.querySelectorAll(".no-git-container").forEach(el => el.remove());
                set(noGitData, null, true);
                set(loading, true);
                postMessage("switchRepo", r.path);
              });
              list.appendChild(btn);
            });
            div.appendChild(list);
          }

          var initBtn = document.createElement("button");
          initBtn.className = "no-git-btn secondary";
          initBtn.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:4px;background:var(--vscode-button-secondaryBackground, #3a3d41);color:var(--vscode-button-secondaryForeground, #ffffff);border:1px solid rgba(255,255,255,0.1);font-size:12px;cursor:pointer;";
          initBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Initialize Git Repository Here (git init)';
          initBtn.addEventListener("click", () => {
            div.remove();
            document.querySelectorAll(".no-git-container").forEach(el => el.remove());
            set(noGitData, null, true);
            set(loading, true);
            postMessage("initRepo");
          });
          div.appendChild(initBtn);

          append($$anchor2, div);
        } else {
          var div_4 = root_23();
          append($$anchor2, div_4);
        }
      };
      var alternate = ($$anchor2) => {
        document.querySelectorAll(".no-git-container").forEach(el => el.remove());
        CommitList($$anchor2, {
          get commits() {
            return get(commits);
          },
          get graphWidth() {
            return get(graphWidth);
          },
          get selectedHash() {
            return get(selectedHash);
          },
          onSelectCommit,
          onLoadMore,
          onRebaseFromHere,
          get scrollToIndex() {
            return get(scrollToIndex);
          }
        });
      };
      if_block(node_1, ($$render) => {
        if (get(loading))
          $$render(consequent);
        else if (get(commits).length === 0)
          $$render(consequent_1, 1);
        else
          $$render(alternate, false);
      });
    }
    reset(div_2);
    var node_2 = sibling(div_2, 2);
    {
      var consequent_2 = ($$anchor2) => {
        var div_5 = root_43();
        var node_3 = child(div_5);
        {
          let $0 = user_derived(() => get(commits).find((c) => c.hash === get(selectedHash)));
          CommitDetail(node_3, {
            get commit() {
              return get($0);
            },
            get files() {
              return get(selectedFiles);
            }
          });
        }
        reset(div_5);

        // Close button inside detail panel
        var closeBtn = document.createElement("button");
        closeBtn.className = "detail-close-btn";
        closeBtn.title = "Close Details (Esc)";
        closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5L10.5 10.5M1.5 10.5L10.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
        closeBtn.addEventListener("click", () => {
          set(selectedHash, null, true);
        });
        div_5.prepend(closeBtn);

        // Resizable splitter for detail panel
        var detail_splitter = document.createElement("div");
        detail_splitter.className = "detail-splitter";

        try {
          const savedDW = localStorage.getItem("intellij_git_detail_panel_width");
          if (savedDW) {
            const dw = parseInt(savedDW, 10);
            if (dw >= 180 && dw <= 800) {
              div_5.style.width = dw + "px";
              div_5.style.minWidth = dw + "px";
            }
          }
        } catch (e) {}

        let isDraggingDetailSplitter = false;
        let startXDetail = 0;
        let startWidthDetail = 300;

        const onMouseMoveDetail = (e) => {
          if (!isDraggingDetailSplitter) return;
          const dx = startXDetail - e.clientX;
          const newWidth = Math.max(180, Math.min(800, startWidthDetail + dx));
          div_5.style.width = newWidth + "px";
          div_5.style.minWidth = newWidth + "px";
          try {
            localStorage.setItem("intellij_git_detail_panel_width", newWidth);
          } catch (err) {}
        };

        const onMouseUpDetail = () => {
          if (isDraggingDetailSplitter) {
            isDraggingDetailSplitter = false;
            detail_splitter.classList.remove("active");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            div_5.style.transition = "";
            window.removeEventListener("mousemove", onMouseMoveDetail);
            window.removeEventListener("mouseup", onMouseUpDetail);
          }
        };

        detail_splitter.addEventListener("mousedown", (e) => {
          isDraggingDetailSplitter = true;
          startXDetail = e.clientX;
          startWidthDetail = div_5.getBoundingClientRect().width;
          detail_splitter.classList.add("active");
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
          div_5.style.transition = "none";
          window.addEventListener("mousemove", onMouseMoveDetail);
          window.addEventListener("mouseup", onMouseUpDetail);
          e.preventDefault();
        });

        append($$anchor2, detail_splitter);
        append($$anchor2, div_5);
      };
      if_block(node_2, ($$render) => {
        if (get(selectedHash))
          $$render(consequent_2);
      });
    }
    reset(div_1);
    var branch_sidebar = document.createElement("div");
    branch_sidebar.className = "branch-sidebar svelte-1lrl78g";
    div_1.prepend(branch_sidebar);

    var branch_splitter = document.createElement("div");
    branch_splitter.className = "branch-splitter";
    branch_sidebar.after(branch_splitter);

    try {
      const savedW = localStorage.getItem("intellij_git_branch_sidebar_width");
      if (savedW) {
        const w = parseInt(savedW, 10);
        if (w >= 140 && w <= 700) {
          branch_sidebar.style.width = w + "px";
          branch_sidebar.style.minWidth = w + "px";
        }
      }
    } catch (e) {}

    let isDraggingBranchSplitter = false;
    let startX = 0;
    let startWidth = 260;

    branch_splitter.addEventListener("mousedown", (e) => {
      if (branch_sidebar.classList.contains("collapsed")) return;
      isDraggingBranchSplitter = true;
      startX = e.clientX;
      startWidth = branch_sidebar.getBoundingClientRect().width;
      branch_splitter.classList.add("active");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      branch_sidebar.style.transition = "none";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDraggingBranchSplitter) return;
      const dx = e.clientX - startX;
      const newWidth = Math.max(140, Math.min(700, startWidth + dx));
      branch_sidebar.style.width = newWidth + "px";
      branch_sidebar.style.minWidth = newWidth + "px";
      try {
        localStorage.setItem("intellij_git_branch_sidebar_width", newWidth);
      } catch (err) {}
    });

    window.addEventListener("mouseup", () => {
      if (isDraggingBranchSplitter) {
        isDraggingBranchSplitter = false;
        branch_splitter.classList.remove("active");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        branch_sidebar.style.transition = "";
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && get(selectedHash)) {
        set(selectedHash, null, true);
      }
    });

    user_effect(() => {
      if (get(noGitData)) {
        branch_sidebar.style.display = "none";
        branch_splitter.style.display = "none";
      } else {
        branch_sidebar.style.display = "";
        branch_splitter.style.display = branch_sidebar.classList.contains("collapsed") ? "none" : "";
        renderSidebarContent(branch_sidebar);
      }
    });
    reset(div);
    append($$anchor, div);
    pop();
  }

  // webview/graph/main.ts
  var app = mount(App, { target: document.getElementById("app") });
  var main_default = app;
})();
