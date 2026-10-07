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
  var PAUSED = 1 << 8;
  var CONNECTED = 1 << 9;
  var CLEAN = 1 << 10;
  var DIRTY = 1 << 11;
  var MAYBE_DIRTY = 1 << 12;
  var INERT = 1 << 13;
  var DESTROYED = 1 << 14;
  var REACTION_RAN = 1 << 15;
  var DESTROYING = 1 << 25;
  var EFFECT_TRANSPARENT = 1 << 16;
  var EAGER_EFFECT = 1 << 17;
  var HEAD_EFFECT = 1 << 18;
  var EFFECT_PRESERVED = 1 << 19;
  var USER_EFFECT = 1 << 20;
  var EFFECT_OFFSCREEN = 1 << 25;
  var REACTION_IS_UPDATING = 1 << 21;
  var ASYNC = 1 << 22;
  var ERROR_VALUE = 1 << 23;
  var STATE_SYMBOL = Symbol("$state");
  var COMPONENT_SYMBOL = Symbol("component");
  var LEGACY_PROPS = Symbol("legacy props");
  var LOADING_ATTR_SYMBOL = Symbol("");
  var PROXY_PATH_SYMBOL = Symbol("proxy path");
  var ATTRIBUTES_CACHE = Symbol("attributes");
  var CLASS_CACHE = Symbol("class");
  var STYLE_CACHE = Symbol("style");
  var TEXT_CACHE = Symbol("text");
  var FORM_RESET_HANDLER = Symbol("form reset");
  var HMR_ANCHOR = Symbol("hmr anchor");
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

  // node_modules/svelte/src/constants.js
  var EACH_ITEM_REACTIVE = 1;
  var EACH_INDEX_REACTIVE = 1 << 1;
  var EACH_IS_CONTROLLED = 1 << 2;
  var EACH_IS_ANIMATED = 1 << 3;
  var EACH_ITEM_IMMUTABLE = 1 << 4;
  var PROPS_IS_IMMUTABLE = 1;
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
  var HYDRATION_START_FAILED = "[?";
  var HYDRATION_END = "]";
  var HYDRATION_ERROR = {};
  var ELEMENT_PRESERVE_ATTRIBUTE_CASE = 1 << 1;
  var ELEMENT_IS_INPUT = 1 << 2;
  var UNINITIALIZED = Symbol("uninitialized");
  var FILENAME = Symbol("filename");
  var HMR = Symbol("hmr");
  var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
  var NAMESPACE_SVG = "http://www.w3.org/2000/svg";
  var NAMESPACE_MATHML = "http://www.w3.org/1998/Math/MathML";

  // node_modules/svelte/src/internal/client/warnings.js
  var bold = "font-weight: bold";
  var normal = "font-weight: normal";
  function await_reactivity_loss(name) {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] await_reactivity_loss
%cDetected reactivity loss when reading \`${name}\`. This happens when state is read in an async function after an earlier \`await\`
https://svelte.dev/e/await_reactivity_loss`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/await_reactivity_loss`);
    }
  }
  function await_waterfall(name, location) {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] await_waterfall
%cAn async derived, \`${name}\` (${location}) was not read immediately after it resolved. This often indicates an unnecessary waterfall, which can slow down your app
https://svelte.dev/e/await_waterfall`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/await_waterfall`);
    }
  }
  function derived_inert() {
    if (dev_fallback_default) {
      console.warn(`%c[svelte] derived_inert
%cReading a derived belonging to a now-destroyed effect may result in stale values
https://svelte.dev/e/derived_inert`, bold, normal);
    } else {
      console.warn(`https://svelte.dev/e/derived_inert`);
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
  function hydration_html_changed(location) {
    if (dev_fallback_default) {
      console.warn(
        `%c[svelte] hydration_html_changed
%c${location ? `The value of an \`{@html ...}\` block ${location} changed between server and client renders. The client value will be ignored in favour of the server value` : "The value of an `{@html ...}` block changed between server and client renders. The client value will be ignored in favour of the server value"}
https://svelte.dev/e/hydration_html_changed`,
        bold,
        normal
      );
    } else {
      console.warn(`https://svelte.dev/e/hydration_html_changed`);
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

  // node_modules/svelte/src/internal/shared/errors.js
  function invariant_violation(message) {
    if (dev_fallback_default) {
      const error = new Error(`invariant_violation
An invariant violation occurred, meaning Svelte's internal assumptions were flawed. This is a bug in Svelte, not your app \u2014 please open an issue at https://github.com/sveltejs/svelte, citing the following message: "${message}"
https://svelte.dev/e/invariant_violation`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/invariant_violation`);
    }
  }
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
  function each_key_volatile(index2, a, b) {
    if (dev_fallback_default) {
      const error = new Error(`each_key_volatile
Keyed each block has key that is not idempotent \u2014 the key for item at index ${index2} was \`${a}\` but is now \`${b}\`. Keys must be the same each time for a given item
https://svelte.dev/e/each_key_volatile`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/each_key_volatile`);
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
  function props_invalid_value(key2) {
    if (dev_fallback_default) {
      const error = new Error(`props_invalid_value
Cannot do \`bind:${key2}={undefined}\` when \`${key2}\` has a fallback value
https://svelte.dev/e/props_invalid_value`);
      error.name = "Svelte error";
      throw error;
    } else {
      throw new Error(`https://svelte.dev/e/props_invalid_value`);
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
  function invariant(condition, message) {
    if (!dev_fallback_default) {
      throw new Error("invariant(...) was not guarded by if (DEV)");
    }
    if (!condition)
      invariant_violation(message);
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
      r: (
        /** @type {Effect} */
        active_effect
      ),
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
    return mark_as_component(component2);
  }
  function mark_as_component(component2 = {}) {
    define_property(component2, COMPONENT_SYMBOL, { value: true });
    return component2;
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
  function defer_effect(effect2, dirty_effects, maybe_dirty_effects) {
    if ((effect2.f & DIRTY) !== 0) {
      dirty_effects.add(effect2);
    } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
      maybe_dirty_effects.add(effect2);
    }
    set_signal_status(effect2, CLEAN);
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

  // node_modules/svelte/src/internal/client/reactivity/async.js
  function flatten(blockers, sync, async2, fn) {
    const d = is_runes() ? derived : derived_safe_equal;
    var pending2 = blockers.filter((b) => !b.settled);
    var deriveds = sync.map(d);
    if (dev_fallback_default) {
      deriveds.forEach((d2, i) => {
        d2.label = sync[i].toString().replace("() => ", "").replaceAll("$.eager(() => ", "$state.eager(").replace(/\$\.get\((.+?)\)/g, (_, id) => id);
      });
    }
    if (async2.length === 0 && pending2.length === 0) {
      fn(deriveds);
      return;
    }
    var parent = (
      /** @type {Effect} */
      active_effect
    );
    var restore = capture();
    var blocker_promise = pending2.length === 1 ? pending2[0].promise : pending2.length > 1 ? Promise.all(pending2.map((b) => b.promise)) : null;
    function finish(async3) {
      if ((parent.f & DESTROYED) !== 0) {
        return;
      }
      restore();
      try {
        fn([...deriveds, ...async3]);
      } catch (error) {
        invoke_error_boundary(error, parent);
      }
      unset_context();
    }
    var decrement_pending = increment_pending();
    if (async2.length === 0) {
      blocker_promise.then(() => finish([])).finally(decrement_pending);
      return;
    }
    function run3() {
      Promise.all(async2.map((expression) => async_derived(expression))).then(finish).catch((error) => invoke_error_boundary(error, parent)).finally(decrement_pending);
    }
    if (blocker_promise) {
      blocker_promise.then(() => {
        if ((parent.f & DESTROYED) !== 0) {
          decrement_pending();
          return;
        }
        restore();
        run3();
        unset_context();
      });
    } else {
      run3();
    }
  }
  function capture() {
    var previous_effect = (
      /** @type {Effect} */
      active_effect
    );
    var previous_reaction = active_reaction;
    var previous_component_context = component_context;
    var previous_batch2 = (
      /** @type {Batch} */
      current_batch
    );
    if (dev_fallback_default) {
      var previous_dev_stack = dev_stack;
    }
    return function restore(activate_batch = true) {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_component_context);
      if (activate_batch && (previous_effect.f & DESTROYED) === 0) {
        previous_batch2?.activate();
        previous_batch2?.apply();
      }
      if (dev_fallback_default) {
        set_reactivity_loss_tracker(null);
        set_dev_stack(previous_dev_stack);
      }
    };
  }
  var restored = false;
  function unset_context(deactivate_batch = true) {
    restored = false;
    set_active_effect(null);
    set_active_reaction(null);
    set_component_context(null);
    if (deactivate_batch)
      current_batch?.deactivate();
    if (dev_fallback_default) {
      set_reactivity_loss_tracker(null);
      set_dev_stack(null);
    }
  }
  function increment_pending() {
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    var boundary2 = effect2.b;
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    var blocking = !!boundary2?.is_rendered();
    boundary2?.update_pending_count(1, batch);
    batch.increment(blocking, effect2);
    return () => {
      boundary2?.update_pending_count(-1, batch);
      batch.decrement(blocking, effect2);
    };
  }

  // node_modules/svelte/src/internal/client/reactivity/deriveds.js
  var reactivity_loss_tracker = null;
  function set_reactivity_loss_tracker(v) {
    reactivity_loss_tracker = v;
  }
  var recent_async_deriveds = /* @__PURE__ */ new Set();
  // @__NO_SIDE_EFFECTS__
  function derived(fn) {
    var flags2 = DERIVED | DIRTY;
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
      parent: active_effect,
      ac: null
    };
    if (dev_fallback_default && tracing_mode_flag) {
      signal.created = get_error("created at");
    }
    return signal;
  }
  var OBSOLETE = Symbol("obsolete");
  // @__NO_SIDE_EFFECTS__
  function async_derived(fn, label, location) {
    let parent = (
      /** @type {Effect | null} */
      active_effect
    );
    if (parent === null) {
      async_derived_orphan();
    }
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
      signal.label = label ?? fn.toString();
    var should_suspend = !active_reaction;
    var deferreds = /* @__PURE__ */ new Set();
    async_effect(() => {
      var effect2 = (
        /** @type {Effect} */
        active_effect
      );
      if (dev_fallback_default) {
        reactivity_loss_tracker = { effect: effect2, effect_deps: /* @__PURE__ */ new Set(), warned: false };
      }
      var d = deferred();
      promise = d.promise;
      try {
        Promise.resolve(fn()).then(d.resolve, (e) => {
          if (e !== STALE_REACTION)
            d.reject(e);
        }).finally(unset_context);
      } catch (error) {
        d.reject(error);
        unset_context();
      }
      if (dev_fallback_default) {
        if (reactivity_loss_tracker) {
          if (effect2.deps !== null) {
            for (let i = 0; i < skipped_deps; i += 1) {
              reactivity_loss_tracker.effect_deps.add(effect2.deps[i]);
            }
          }
          if (new_deps !== null) {
            for (let i = 0; i < new_deps.length; i += 1) {
              reactivity_loss_tracker.effect_deps.add(new_deps[i]);
            }
          }
        }
        reactivity_loss_tracker = null;
      }
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      if (should_suspend) {
        if ((effect2.f & REACTION_RAN) !== 0) {
          var decrement_pending = increment_pending();
        }
        if (
          // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
          parent.b?.is_rendered()
        ) {
          batch.async_deriveds.get(effect2)?.reject(OBSOLETE);
        } else {
          for (const d2 of deferreds.values()) {
            d2.reject(OBSOLETE);
          }
        }
        deferreds.add(d);
        batch.async_deriveds.set(effect2, d);
      }
      const handler = (value, error = void 0) => {
        if (dev_fallback_default) {
          reactivity_loss_tracker = null;
        }
        decrement_pending?.();
        deferreds.delete(d);
        if (error === OBSOLETE)
          return;
        batch.activate();
        if (error) {
          signal.f |= ERROR_VALUE;
          internal_set(signal, error);
        } else {
          if ((signal.f & ERROR_VALUE) !== 0) {
            signal.f ^= ERROR_VALUE;
          }
          if (dev_fallback_default && location !== void 0 && !signal.equals(value)) {
            recent_async_deriveds.add(signal);
            setTimeout(() => {
              if (recent_async_deriveds.has(signal) && (effect2.f & DESTROYED) === 0) {
                await_waterfall(
                  /** @type {string} */
                  signal.label,
                  location
                );
                recent_async_deriveds.delete(signal);
              }
            });
          }
          internal_set(signal, value);
        }
        batch.deactivate();
      };
      d.promise.then(handler, (e) => handler(null, e || "unknown"));
    });
    teardown(() => {
      for (const d of deferreds) {
        d.reject(OBSOLETE);
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
  function execute_derived(derived2) {
    var value;
    var prev_active_effect = active_effect;
    var parent = derived2.parent;
    if (!is_destroying_effect && parent !== null && derived2.v !== UNINITIALIZED && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
    (parent.f & (DESTROYED | INERT)) !== 0) {
      derived_inert();
      return derived2.v;
    }
    set_active_effect(parent);
    if (dev_fallback_default) {
      let prev_eager_effects = eager_effects;
      set_eager_effects(/* @__PURE__ */ new Set());
      try {
        if (includes.call(stack, derived2)) {
          derived_references_self();
        }
        stack.push(derived2);
        destroy_derived_effects(derived2);
        value = update_reaction(derived2);
      } finally {
        set_active_effect(prev_active_effect);
        set_eager_effects(prev_eager_effects);
        stack.pop();
      }
    } else {
      try {
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
        if (current_batch !== null) {
          current_batch.capture(derived2, value, true);
          previous_batch?.capture(derived2, value, true);
        } else {
          derived2.v = value;
        }
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
        if (e.ac !== null) {
          without_reactive_context(() => {
            e.ac.abort(STALE_REACTION);
            e.ac = null;
          });
        }
        if (e.fn !== null)
          e.teardown = noop;
        remove_reactions(e, 0);
        destroy_effect_children(e);
      }
    }
  }
  function unfreeze_derived_effects(derived2) {
    if (derived2.effects === null)
      return;
    for (const e of derived2.effects) {
      if (e.teardown && e.fn !== null) {
        update_effect(e);
      }
    }
  }

  // node_modules/svelte/src/internal/client/reactivity/batch.js
  var first_batch = null;
  var last_batch = null;
  var current_batch = null;
  var previous_batch = null;
  var batch_values = null;
  var last_scheduled_effect = null;
  var is_flushing_sync = false;
  var is_processing = false;
  var collected_effects = null;
  var legacy_updates = null;
  var flush_count = 0;
  var source_stacks = /* @__PURE__ */ new Set();
  var uid = 1;
  var _started, _prev, _next, _commit_callbacks, _discard_callbacks, _pending, _blocking_pending, _deferred, _scheduled, _new_effects, _dirty_effects, _maybe_dirty_effects, _skipped_branches, _unskipped_branches, _decrement_queued, _is_deferred, is_deferred_fn, _resolve, resolve_fn, _process, process_fn, _traverse, traverse_fn, _find_earlier_batch, find_earlier_batch_fn, _merge, merge_fn, _defer_effects, defer_effects_fn, _commit, commit_fn, _unlink, unlink_fn;
  var _Batch = class _Batch {
    constructor() {
      __privateAdd(this, _is_deferred);
      /**
       * Convert the effects that were scheduled in this batch into the root effects
       * that need to be traversed, marking the path to each effect (by clearing the
       * `CLEAN` flag on ancestor branches) so that the traversal can find them.
       * This happens right before traversal rather than at scheduling time, so that
       * the markers left on the (shared) effect tree are created and consumed within
       * a single traversal — scheduling into other batches can never observe them
       * @returns {Effect[]}
       */
      __privateAdd(this, _resolve);
      __privateAdd(this, _process);
      /**
       * Traverse the effect tree, executing effects or stashing
       * them for later execution as appropriate
       * @param {Effect} root
       * @param {Effect[]} effects
       * @param {Effect[]} render_effects
       */
      __privateAdd(this, _traverse);
      __privateAdd(this, _find_earlier_batch);
      /**
       * @param {Batch} batch
       */
      __privateAdd(this, _merge);
      /**
       * @param {Effect[]} effects
       */
      __privateAdd(this, _defer_effects);
      __privateAdd(this, _commit);
      __privateAdd(this, _unlink);
      __publicField(this, "id", uid++);
      /** True as soon as `#process` was called */
      __privateAdd(this, _started, false);
      __publicField(this, "linked", true);
      /** @type {Batch | null} */
      __privateAdd(this, _prev, null);
      /** @type {Batch | null} */
      __privateAdd(this, _next, null);
      /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
      __publicField(this, "async_deriveds", /* @__PURE__ */ new Map());
      /**
       * The current values of any signals that are updated in this batch.
       * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
       * They keys of this map are identical to `this.#previous`
       * @type {Map<Value, [any, boolean]>}
       */
      __publicField(this, "current", /* @__PURE__ */ new Map());
      /**
       * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
       * They keys of this map are identical to `this.#current`
       * @type {Map<Value, any>}
       */
      __publicField(this, "previous", /* @__PURE__ */ new Map());
      /**
       * When the batch is committed (and the DOM is updated), we need to remove old branches
       * and append new ones by calling the functions added inside (if/each/key/etc) blocks
       * @type {Set<(batch: Batch) => void>}
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
       * Async effects that are currently in flight, _not_ inside a pending boundary
       * @type {Map<Effect, number>}
       */
      __privateAdd(this, _blocking_pending, /* @__PURE__ */ new Map());
      /**
       * A deferred that resolves when the batch is committed, used with `settled()`
       * TODO replace with Promise.withResolvers once supported widely enough
       * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
       */
      __privateAdd(this, _deferred, null);
      /**
       * Effects that were scheduled in this batch but not yet 'resolved' into the
       * root effects that need to be flushed. Resolving — the upwards traversal that
       * marks the path to each effect on the shared effect tree (see #resolve) — is
       * deferred until the batch is processed, so that the markers are created and
       * consumed within a single traversal. Scheduling into other batches (which can
       * happen concurrently, e.g. while a batch is committed) can therefore never
       * observe (and be confused by) this batch's markers.
       * May contain duplicates — deduplication happens during resolving
       * @type {Effect[]}
       */
      __privateAdd(this, _scheduled, []);
      /**
       * Effects created while this batch was active.
       * @type {Effect[]}
       */
      __privateAdd(this, _new_effects, []);
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
      /**
       * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
       * @type {Set<Effect>}
       */
      __privateAdd(this, _unskipped_branches, /* @__PURE__ */ new Set());
      __publicField(this, "is_fork", false);
      __privateAdd(this, _decrement_queued, false);
      if (last_batch === null) {
        first_batch = last_batch = this;
      } else {
        __privateSet(last_batch, _next, this);
        __privateSet(this, _prev, last_batch);
      }
      last_batch = this;
    }
    /**
     * Add an effect to the #skipped_branches map and reset its children
     * @param {Effect} effect
     */
    skip_effect(effect2) {
      if (!__privateGet(this, _skipped_branches).has(effect2)) {
        __privateGet(this, _skipped_branches).set(effect2, { d: [], m: [] });
      }
      __privateGet(this, _unskipped_branches).delete(effect2);
    }
    /**
     * Remove an effect from the #skipped_branches map and reschedule
     * any tracked dirty/maybe_dirty child effects
     * @param {Effect} effect
     * @param {(e: Effect) => void} callback
     */
    unskip_effect(effect2, callback = (e) => this.schedule(e)) {
      var tracked = __privateGet(this, _skipped_branches).get(effect2);
      if (tracked) {
        __privateGet(this, _skipped_branches).delete(effect2);
        for (var e of tracked.d) {
          set_signal_status(e, DIRTY);
          callback(e);
        }
        for (e of tracked.m) {
          set_signal_status(e, MAYBE_DIRTY);
          callback(e);
        }
      }
      __privateGet(this, _unskipped_branches).add(effect2);
    }
    /**
     * Associate a change to a given source with the current
     * batch, noting its previous and current values
     * @param {Value} source
     * @param {any} value
     * @param {boolean} [is_derived]
     */
    capture(source2, value, is_derived = false) {
      if (source2.v !== UNINITIALIZED && !this.previous.has(source2)) {
        this.previous.set(source2, source2.v);
      }
      if ((source2.f & ERROR_VALUE) === 0) {
        this.current.set(source2, [value, is_derived]);
        batch_values?.set(source2, value);
      }
      if (!this.is_fork) {
        source2.v = value;
      }
    }
    activate() {
      current_batch = this;
    }
    deactivate() {
      current_batch = null;
      batch_values = null;
    }
    flush() {
      try {
        if (dev_fallback_default) {
          source_stacks.clear();
        }
        is_processing = true;
        current_batch = this;
        __privateMethod(this, _process, process_fn).call(this);
      } finally {
        flush_count = 0;
        last_scheduled_effect = null;
        collected_effects = null;
        legacy_updates = null;
        is_processing = false;
        current_batch = null;
        batch_values = null;
        old_values.clear();
        if (dev_fallback_default) {
          for (const source2 of source_stacks) {
            source2.updated = null;
          }
        }
      }
    }
    discard() {
      for (const fn of __privateGet(this, _discard_callbacks))
        fn(this);
      __privateGet(this, _discard_callbacks).clear();
      for (const deferred2 of this.async_deriveds.values()) {
        deferred2.reject(OBSOLETE);
      }
      __privateMethod(this, _unlink, unlink_fn).call(this);
      __privateGet(this, _deferred)?.resolve();
    }
    /**
     * @param {Effect} effect
     */
    register_created_effect(effect2) {
      __privateGet(this, _new_effects).push(effect2);
    }
    /**
     * @param {boolean} blocking
     * @param {Effect} effect
     */
    increment(blocking, effect2) {
      __privateSet(this, _pending, __privateGet(this, _pending) + 1);
      if (blocking) {
        let blocking_pending_count = __privateGet(this, _blocking_pending).get(effect2) ?? 0;
        __privateGet(this, _blocking_pending).set(effect2, blocking_pending_count + 1);
      }
    }
    /**
     * @param {boolean} blocking
     * @param {Effect} effect
     */
    decrement(blocking, effect2) {
      __privateSet(this, _pending, __privateGet(this, _pending) - 1);
      if (blocking) {
        let blocking_pending_count = __privateGet(this, _blocking_pending).get(effect2) ?? 0;
        if (blocking_pending_count === 1) {
          __privateGet(this, _blocking_pending).delete(effect2);
        } else {
          __privateGet(this, _blocking_pending).set(effect2, blocking_pending_count - 1);
        }
      }
      if (__privateGet(this, _decrement_queued))
        return;
      __privateSet(this, _decrement_queued, true);
      queue_micro_task(() => {
        __privateSet(this, _decrement_queued, false);
        if (this.linked) {
          this.flush();
        }
      });
    }
    /**
     * @param {Set<Effect>} dirty_effects
     * @param {Set<Effect>} maybe_dirty_effects
     */
    transfer_effects(dirty_effects, maybe_dirty_effects) {
      for (const e of dirty_effects) {
        __privateGet(this, _dirty_effects).add(e);
      }
      for (const e of maybe_dirty_effects) {
        __privateGet(this, _maybe_dirty_effects).add(e);
      }
      dirty_effects.clear();
      maybe_dirty_effects.clear();
    }
    /** @param {(batch: Batch) => void} fn */
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
        if (!is_processing && !is_flushing_sync) {
          queue_micro_task(() => {
            if (!__privateGet(batch, _started)) {
              batch.flush();
            }
          });
        }
      }
      return current_batch;
    }
    apply() {
      if (!async_mode_flag || !this.is_fork && __privateGet(this, _prev) === null && __privateGet(this, _next) === null) {
        batch_values = null;
        return;
      }
      batch_values = /* @__PURE__ */ new Map();
      for (const [source2, [value]] of this.current) {
        batch_values.set(source2, value);
      }
      for (let batch = first_batch; batch !== null; batch = __privateGet(batch, _next)) {
        if (batch === this || batch.is_fork)
          continue;
        var intersects = false;
        if (batch.id < this.id) {
          for (const [source2, [, is_derived]] of batch.current) {
            if (is_derived)
              continue;
            if (this.current.has(source2)) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) {
          for (const [source2, previous] of batch.previous) {
            if (!batch_values.has(source2)) {
              batch_values.set(source2, previous);
            }
          }
        }
      }
    }
    /**
     *
     * @param {Effect} effect
     */
    schedule(effect2) {
      last_scheduled_effect = effect2;
      if (effect2.b?.is_pending && (effect2.f & (EFFECT | RENDER_EFFECT | MANAGED_EFFECT)) !== 0 && (effect2.f & REACTION_RAN) === 0) {
        effect2.b.defer_effect(effect2);
        return;
      }
      __privateGet(this, _scheduled).push(effect2);
    }
  };
  _started = new WeakMap();
  _prev = new WeakMap();
  _next = new WeakMap();
  _commit_callbacks = new WeakMap();
  _discard_callbacks = new WeakMap();
  _pending = new WeakMap();
  _blocking_pending = new WeakMap();
  _deferred = new WeakMap();
  _scheduled = new WeakMap();
  _new_effects = new WeakMap();
  _dirty_effects = new WeakMap();
  _maybe_dirty_effects = new WeakMap();
  _skipped_branches = new WeakMap();
  _unskipped_branches = new WeakMap();
  _decrement_queued = new WeakMap();
  _is_deferred = new WeakSet();
  is_deferred_fn = function() {
    if (this.is_fork)
      return true;
    for (const effect2 of __privateGet(this, _blocking_pending).keys()) {
      var e = effect2;
      var skipped = false;
      while (e.parent !== null) {
        if (__privateGet(this, _skipped_branches).has(e)) {
          skipped = true;
          break;
        }
        e = e.parent;
      }
      if (!skipped) {
        return true;
      }
    }
    return false;
  };
  _resolve = new WeakSet();
  resolve_fn = function() {
    var roots = [];
    for (const effect2 of __privateGet(this, _scheduled)) {
      if ((effect2.f & DESTROYED) !== 0 || (effect2.f & (DIRTY | MAYBE_DIRTY)) === 0)
        continue;
      var e = effect2;
      var covered = false;
      while (e.parent !== null) {
        e = e.parent;
        var flags2 = e.f;
        if ((flags2 & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
          if ((flags2 & CLEAN) === 0) {
            covered = true;
            break;
          }
          e.f ^= CLEAN;
        }
      }
      if (!covered) {
        roots.push(e);
      }
    }
    __privateSet(this, _scheduled, []);
    return roots;
  };
  _process = new WeakSet();
  process_fn = function() {
    var _a2, _b, _c;
    __privateSet(this, _started, true);
    if (dev_fallback_default) {
      for (const value of this.current.keys()) {
        source_stacks.add(value);
      }
    }
    for (const e of __privateGet(this, _dirty_effects)) {
      __privateGet(this, _maybe_dirty_effects).delete(e);
      set_signal_status(e, DIRTY);
      this.schedule(e);
    }
    for (const e of __privateGet(this, _maybe_dirty_effects)) {
      set_signal_status(e, MAYBE_DIRTY);
      this.schedule(e);
    }
    this.apply();
    var effects = collected_effects = [];
    var render_effects = [];
    var updates = legacy_updates = [];
    while (__privateGet(this, _scheduled).length > 0) {
      if (flush_count++ > 1e3) {
        __privateMethod(this, _unlink, unlink_fn).call(this);
        infinite_loop_guard();
      }
      for (const root7 of __privateMethod(this, _resolve, resolve_fn).call(this)) {
        try {
          __privateMethod(this, _traverse, traverse_fn).call(this, root7, effects, render_effects);
        } catch (e) {
          reset_all(root7);
          if (!__privateMethod(this, _is_deferred, is_deferred_fn).call(this))
            this.discard();
          throw e;
        }
      }
    }
    current_batch = null;
    if (updates.length > 0) {
      var batch = _Batch.ensure();
      for (const e of updates) {
        batch.schedule(e);
      }
    }
    collected_effects = null;
    legacy_updates = null;
    if (__privateMethod(this, _is_deferred, is_deferred_fn).call(this)) {
      __privateMethod(this, _defer_effects, defer_effects_fn).call(this, render_effects);
      __privateMethod(this, _defer_effects, defer_effects_fn).call(this, effects);
      for (const [e, t] of __privateGet(this, _skipped_branches)) {
        reset_branch(e, t);
      }
      if (updates.length > 0) {
        /** @type {unknown} */
        __privateMethod(_a2 = current_batch, _process, process_fn).call(_a2);
      }
      return;
    }
    const earlier_batch = __privateMethod(this, _find_earlier_batch, find_earlier_batch_fn).call(this);
    if (earlier_batch) {
      __privateMethod(this, _defer_effects, defer_effects_fn).call(this, render_effects);
      __privateMethod(this, _defer_effects, defer_effects_fn).call(this, effects);
      __privateMethod(_b = earlier_batch, _merge, merge_fn).call(_b, this);
      return;
    }
    __privateGet(this, _dirty_effects).clear();
    __privateGet(this, _maybe_dirty_effects).clear();
    for (const fn of __privateGet(this, _commit_callbacks))
      fn(this);
    __privateGet(this, _commit_callbacks).clear();
    previous_batch = this;
    flush_queued_effects(render_effects);
    flush_queued_effects(effects);
    previous_batch = null;
    __privateGet(this, _deferred)?.resolve();
    var next_batch = (
      /** @type {Batch | null} */
      /** @type {unknown} */
      current_batch
    );
    if (__privateGet(this, _pending) === 0 && (__privateGet(this, _scheduled).length === 0 || next_batch !== null)) {
      __privateMethod(this, _unlink, unlink_fn).call(this);
      if (async_mode_flag) {
        __privateMethod(this, _commit, commit_fn).call(this);
        current_batch = next_batch;
      }
    }
    if (__privateGet(this, _scheduled).length > 0) {
      if (next_batch !== null) {
        for (const e of __privateGet(this, _scheduled)) {
          __privateGet(next_batch, _scheduled).push(e);
        }
        __privateSet(this, _scheduled, []);
      } else {
        next_batch = this;
      }
    }
    if (next_batch !== null) {
      old_values.clear();
      __privateMethod(_c = next_batch, _process, process_fn).call(_c);
    }
  };
  _traverse = new WeakSet();
  traverse_fn = function(root7, effects, render_effects) {
    root7.f ^= CLEAN;
    var effect2 = root7.first;
    while (effect2 !== null) {
      var flags2 = effect2.f;
      var is_branch = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
      var is_skippable_branch = is_branch && (flags2 & CLEAN) !== 0;
      var skip = is_skippable_branch || (flags2 & INERT) !== 0 || __privateGet(this, _skipped_branches).has(effect2);
      if (!skip && effect2.fn !== null) {
        if (is_branch) {
          effect2.f ^= CLEAN;
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
        var next2 = effect2.next;
        if (next2 !== null) {
          effect2 = next2;
          break;
        }
        effect2 = effect2.parent;
      }
    }
  };
  _find_earlier_batch = new WeakSet();
  find_earlier_batch_fn = function() {
    var batch = __privateGet(this, _prev);
    while (batch !== null) {
      if (!batch.is_fork) {
        for (const [value, [, is_derived]] of this.current) {
          if (batch.current.has(value) && !is_derived) {
            return batch;
          }
        }
      }
      batch = __privateGet(batch, _prev);
    }
    return null;
  };
  _merge = new WeakSet();
  merge_fn = function(batch) {
    var _a2;
    for (const [source2, value] of batch.current) {
      if (!this.previous.has(source2) && batch.previous.has(source2)) {
        this.previous.set(source2, batch.previous.get(source2));
      }
      this.current.set(source2, value);
    }
    for (const [effect2, deferred2] of batch.async_deriveds) {
      const d = this.async_deriveds.get(effect2);
      if (d)
        deferred2.promise.then(d.resolve).catch(d.reject);
    }
    batch.async_deriveds.clear();
    this.transfer_effects(__privateGet(batch, _dirty_effects), __privateGet(batch, _maybe_dirty_effects));
    const mark = (value) => {
      var reactions = value.reactions;
      if (reactions === null)
        return;
      if ((value.f & DERIVED) !== 0 && (value.f & (DIRTY | MAYBE_DIRTY)) === 0) {
        return;
      }
      for (const reaction of reactions) {
        var flags2 = reaction.f;
        if ((flags2 & DERIVED) !== 0) {
          mark(
            /** @type {Derived} */
            reaction
          );
        } else {
          var effect2 = (
            /** @type {Effect} */
            reaction
          );
          if (flags2 & (ASYNC | BLOCK_EFFECT) && !this.async_deriveds.has(effect2)) {
            __privateGet(this, _maybe_dirty_effects).delete(effect2);
            set_signal_status(effect2, DIRTY);
            this.schedule(effect2);
          }
        }
      }
    };
    for (const source2 of this.current.keys()) {
      mark(source2);
    }
    this.oncommit(() => batch.discard());
    __privateMethod(_a2 = batch, _unlink, unlink_fn).call(_a2);
    current_batch = this;
    __privateMethod(this, _process, process_fn).call(this);
  };
  _defer_effects = new WeakSet();
  defer_effects_fn = function(effects) {
    for (var i = 0; i < effects.length; i += 1) {
      defer_effect(effects[i], __privateGet(this, _dirty_effects), __privateGet(this, _maybe_dirty_effects));
    }
  };
  _commit = new WeakSet();
  commit_fn = function() {
    var _a2, _b;
    for (let batch = first_batch; batch !== null; batch = __privateGet(batch, _next)) {
      var is_earlier = batch.id < this.id;
      var sources = [];
      for (const [source3, [value, is_derived]] of this.current) {
        if (batch.current.has(source3)) {
          var batch_value = (
            /** @type {[any, boolean]} */
            batch.current.get(source3)[0]
          );
          if (is_earlier && value !== batch_value) {
            batch.current.set(source3, [value, is_derived]);
          } else {
            continue;
          }
        }
        sources.push(source3);
      }
      if (is_earlier) {
        for (const [effect2, deferred2] of this.async_deriveds) {
          const d = batch.async_deriveds.get(effect2);
          if (d)
            deferred2.promise.then(d.resolve).catch(d.reject);
        }
      }
      var current = [...batch.current.keys()].filter(
        (source3) => !/** @type {[any, boolean]} */
        batch.current.get(source3)[1]
      );
      if (!__privateGet(batch, _started) || current.length === 0)
        continue;
      var others = current.filter((source3) => !this.current.has(source3));
      if (others.length === 0) {
        if (is_earlier) {
          batch.discard();
        }
      } else if (sources.length > 0) {
        if (dev_fallback_default && !__privateGet(batch, _decrement_queued)) {
          invariant(__privateGet(batch, _scheduled).length === 0, "Batch has scheduled effects");
        }
        if (is_earlier) {
          for (const unskipped of __privateGet(this, _unskipped_branches)) {
            batch.unskip_effect(unskipped, (e) => {
              var _a3;
              if ((e.f & (BLOCK_EFFECT | ASYNC)) !== 0) {
                batch.schedule(e);
              } else {
                __privateMethod(_a3 = batch, _defer_effects, defer_effects_fn).call(_a3, [e]);
              }
            });
          }
        }
        batch.activate();
        var marked = /* @__PURE__ */ new Set();
        var checked = /* @__PURE__ */ new Map();
        for (var source2 of sources) {
          mark_effects(source2, others, marked, checked);
        }
        checked = /* @__PURE__ */ new Map();
        var current_unequal = [...batch.current].filter(([c, v1]) => {
          const v2 = this.current.get(c);
          if (!v2)
            return true;
          return v2[0] !== v1[0] || v2[1] !== v1[1];
        }).map(([c]) => c);
        if (current_unequal.length > 0) {
          for (const effect2 of __privateGet(this, _new_effects)) {
            if ((effect2.f & (DESTROYED | INERT | EAGER_EFFECT)) === 0 && depends_on(effect2, current_unequal, checked)) {
              if ((effect2.f & (ASYNC | BLOCK_EFFECT)) !== 0) {
                set_signal_status(effect2, DIRTY);
                batch.schedule(effect2);
              } else {
                __privateGet(batch, _dirty_effects).add(effect2);
              }
            }
          }
        }
        if (__privateGet(batch, _scheduled).length > 0 && !__privateGet(batch, _decrement_queued)) {
          batch.apply();
          for (var root7 of __privateMethod(_a2 = batch, _resolve, resolve_fn).call(_a2)) {
            __privateMethod(_b = batch, _traverse, traverse_fn).call(_b, root7, [], []);
          }
        }
        batch.deactivate();
      }
    }
  };
  _unlink = new WeakSet();
  unlink_fn = function() {
    if (!this.linked)
      return;
    var prev = __privateGet(this, _prev);
    var next2 = __privateGet(this, _next);
    if (prev === null) {
      first_batch = next2;
    } else {
      __privateSet(prev, _next, next2);
    }
    if (next2 === null) {
      last_batch = prev;
    } else {
      __privateSet(next2, _prev, prev);
    }
    this.linked = false;
  };
  var Batch = _Batch;
  function flushSync(fn) {
    var was_flushing_sync = is_flushing_sync;
    var prev_previous_batch = previous_batch;
    previous_batch = null;
    is_flushing_sync = true;
    try {
      var result;
      if (fn) {
        flushSync();
        result = fn();
      }
      while (true) {
        flush_tasks();
        if (current_batch === null) {
          return (
            /** @type {T} */
            result
          );
        }
        current_batch.flush();
      }
    } finally {
      is_flushing_sync = was_flushing_sync;
      previous_batch = prev_previous_batch;
    }
  }
  function infinite_loop_guard() {
    if (dev_fallback_default) {
      var updates = /* @__PURE__ */ new Map();
      for (
        const source2 of
        /** @type {Batch} */
        current_batch.current.keys()
      ) {
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
  function schedule_effect(effect2) {
    current_batch.schedule(effect2);
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
  function reset_all(effect2) {
    set_signal_status(effect2, CLEAN);
    var e = effect2.first;
    while (e !== null) {
      reset_all(e);
      e = e.next;
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
    (!untracking || (active_reaction.f & EAGER_EFFECT) !== 0) && is_runes() && (active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | EAGER_EFFECT)) !== 0 && (current_sources === null || !current_sources.has(source2))) {
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
    return internal_set(source2, new_value, legacy_updates);
  }
  var seen = null;
  var count_deps = 0;
  function internal_set(source2, value, updated_during_traversal = null) {
    if (!source2.equals(value)) {
      if (is_destroying_effect) {
        old_values.set(source2, value);
      } else if (!old_values.has(source2)) {
        old_values.set(source2, source2.v);
      }
      var batch = Batch.ensure();
      batch.capture(source2, value);
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
        if (batch_values === null) {
          update_derived_status(derived2);
        }
      }
      source2.wv = increment_write_version();
      seen = null;
      count_deps = 0;
      mark_reactions(source2, DIRTY, updated_during_traversal);
      seen = null;
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
      let dirty;
      try {
        dirty = is_dirty(effect2);
      } catch {
        dirty = true;
      }
      if (dirty) {
        update_effect(effect2);
      }
    }
    eager_effects.clear();
  }
  function increment(source2) {
    set(source2, source2.v + 1);
  }
  function mark_reactions(signal, status, updated_during_traversal) {
    var reactions = signal.reactions;
    if (reactions === null)
      return;
    var runes = is_runes();
    var length = reactions.length;
    count_deps += length;
    if (count_deps > 1e5 && seen === null)
      seen = /* @__PURE__ */ new Set();
    if (seen !== null) {
      if (seen.has(signal))
        return;
      seen.add(signal);
    }
    for (var i = 0; i < length; i++) {
      var reaction = reactions[i];
      var flags2 = reaction.f;
      if (!runes && reaction === active_effect)
        continue;
      var not_dirty = (flags2 & DIRTY) === 0;
      if (not_dirty) {
        set_signal_status(reaction, status);
      }
      if ((flags2 & EAGER_EFFECT) !== 0) {
        eager_effects.add(
          /** @type {Effect} */
          reaction
        );
      } else if ((flags2 & DERIVED) !== 0) {
        var derived2 = (
          /** @type {Derived} */
          reaction
        );
        batch_values?.delete(derived2);
        mark_reactions(derived2, MAYBE_DIRTY, updated_during_traversal);
      } else if (not_dirty) {
        var effect2 = (
          /** @type {Effect} */
          reaction
        );
        if ((flags2 & BLOCK_EFFECT) !== 0 && eager_block_effects !== null) {
          eager_block_effects.add(effect2);
        }
        if (updated_during_traversal !== null) {
          updated_during_traversal.push(effect2);
        } else {
          schedule_effect(effect2);
        }
      }
    }
  }

  // node_modules/svelte/src/internal/client/proxy.js
  var regex_is_valid_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
  function proxy(value) {
    if (typeof value !== "object" || value === null || STATE_SYMBOL in value || COMPONENT_SYMBOL in value) {
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
          this.has?.(target, prop2);
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
          var s = sources.get(prop2);
          if (s !== void 0) {
            var value2 = get(s);
            if (value2 === UNINITIALIZED) {
              return void 0;
            }
            if (descriptor && "value" in descriptor) {
              descriptor.value = value2;
            } else {
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
      element_prototype[CLASS_CACHE] = void 0;
      element_prototype[ATTRIBUTES_CACHE] = null;
      element_prototype[STYLE_CACHE] = void 0;
      element_prototype.__e = void 0;
    }
    if (is_extensible(text_prototype)) {
      text_prototype[TEXT_CACHE] = void 0;
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
  function only_child(node, is_text = false) {
    if (!hydrating) {
      return /* @__PURE__ */ get_first_child(node);
    }
    var first = child(node, is_text);
    reset(node);
    return first;
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
    if (namespace == null || namespace === NAMESPACE_HTML) {
      return (
        /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
        is2 ? document.createElement(tag2, { is: is2 }) : document.createElement(tag2)
      );
    }
    return (
      /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
      is2 ? document.createElementNS(namespace, tag2, { is: is2 }) : document.createElementNS(namespace, tag2)
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
    if (error === HYDRATION_ERROR) {
      throw error;
    }
    if (effect2 !== null && (effect2.f & DESTROYED) !== 0) {
      return;
    }
    while (effect2 !== null) {
      if ((effect2.f & BOUNDARY_EFFECT) !== 0 && (effect2.f & (DESTROYED | DESTROYING)) === 0) {
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
  function create_effect(type, fn) {
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
    current_batch?.register_created_effect(effect2);
    var e = effect2;
    if ((type & EFFECT) !== 0) {
      if (collected_effects !== null) {
        collected_effects.push(effect2);
      } else {
        Batch.ensure().schedule(effect2);
      }
    } else if (fn !== null) {
      try {
        update_effect(effect2);
      } catch (e2) {
        destroy_effect(effect2);
        throw e2;
      }
      if (e.deps === null && e.teardown === null && e.nodes === null && e.first === e.last && // either `null`, or a singular child
      (e.f & EFFECT_PRESERVED) === 0) {
        e = e.first;
        if ((type & BLOCK_EFFECT) !== 0 && (type & EFFECT_TRANSPARENT) !== 0 && e !== null) {
          e.f |= EFFECT_TRANSPARENT;
        }
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
    const effect2 = create_effect(RENDER_EFFECT, null);
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
    var defer = !active_reaction && (flags2 & BRANCH_EFFECT) !== 0 && component_context !== null && !component_context.i;
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
    return create_effect(EFFECT | USER_EFFECT, fn);
  }
  function effect_root(fn) {
    Batch.ensure();
    const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn);
    return () => {
      destroy_effect(effect2);
    };
  }
  function component_root(fn) {
    Batch.ensure();
    const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn);
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
    return create_effect(EFFECT, fn);
  }
  function async_effect(fn) {
    return create_effect(ASYNC | EFFECT_PRESERVED, fn);
  }
  function render_effect(fn, flags2 = 0) {
    return create_effect(RENDER_EFFECT | flags2, fn);
  }
  function template_effect(fn, sync = [], async2 = [], blockers = []) {
    flatten(blockers, sync, async2, (values) => {
      create_effect(RENDER_EFFECT, () => {
        fn(...values.map(get));
      });
    });
  }
  function block(fn, flags2 = 0) {
    var effect2 = create_effect(BLOCK_EFFECT | flags2, fn);
    if (dev_fallback_default) {
      effect2.dev_stack = dev_stack;
    }
    return effect2;
  }
  function branch(fn) {
    return create_effect(BRANCH_EFFECT | EFFECT_PRESERVED, fn);
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
      } catch (error) {
        invoke_error_boundary(error, effect2.parent);
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
    effect2.f |= DESTROYING;
    destroy_effect_children(effect2, remove_dom && !removed);
    remove_reactions(effect2, 0);
    var transitions = effect2.nodes && effect2.nodes.t;
    if (transitions !== null) {
      for (const transition2 of transitions) {
        transition2.stop();
      }
    }
    execute_effect_teardown(effect2);
    effect2.f ^= DESTROYING;
    effect2.f |= DESTROYED;
    var parent = effect2.parent;
    if (parent !== null && parent.first !== null) {
      unlink_effect(effect2);
    }
    if (dev_fallback_default) {
      effect2.component_function = null;
    }
    effect2.next = effect2.prev = effect2.teardown = effect2.ctx = effect2.deps = effect2.fn = effect2.nodes = effect2.ac = effect2.b = null;
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
    effect2.f |= PAUSED;
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
      if ((child2.f & ROOT_EFFECT) === 0) {
        var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (child2.f & BRANCH_EFFECT) !== 0 && (effect2.f & BLOCK_EFFECT) !== 0;
        pause_children(child2, transitions, transparent ? local : false);
      }
      child2 = sibling2;
    }
  }
  function resume_effect(effect2) {
    effect2.f &= ~PAUSED;
    resume_children(effect2, true);
  }
  function resume_children(effect2, local) {
    if ((effect2.f & PAUSED) !== 0)
      return;
    if ((effect2.f & INERT) === 0)
      return;
    effect2.f ^= INERT;
    if ((effect2.f & CLEAN) === 0) {
      set_signal_status(effect2, DIRTY);
      Batch.ensure().schedule(effect2);
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
    if (active_reaction !== null && (!async_mode_flag && (active_reaction.f & REACTION_IS_UPDATING) !== 0 || (active_reaction.f & DERIVED) !== 0)) {
      (current_sources ?? (current_sources = /* @__PURE__ */ new Set())).add(value);
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
  function schedule_possible_effect_self_invalidation(signal, effect2, root7 = true) {
    var reactions = signal.reactions;
    if (reactions === null)
      return;
    if (!async_mode_flag && current_sources !== null && current_sources.has(signal)) {
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
        if (root7) {
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
      var deps = update_dependencies(reaction);
      if (is_runes() && untracked_writes !== null && !untracking && deps !== null && (reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0) {
        for (var i = 0; i < /** @type {Source[]} */
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
      update_dependencies(reaction);
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
  function update_dependencies(reaction) {
    var _a2;
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
    return deps;
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
      }
      if (derived2.v !== UNINITIALIZED) {
        update_derived_status(derived2);
      }
      if (derived2.ac !== null) {
        without_reactive_context(() => {
          derived2.ac.abort(STALE_REACTION);
          derived2.ac = null;
          set_signal_status(derived2, DIRTY);
        });
      }
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
    active_effect = effect2;
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
      active_effect = previous_effect;
      if (dev_fallback_default) {
        set_dev_current_component_function(previous_component_fn);
        set_dev_stack(previous_stack);
      }
    }
  }
  function get(signal) {
    var flags2 = signal.f;
    var is_derived = (flags2 & DERIVED) !== 0;
    captured_signals?.add(signal);
    if (active_reaction !== null && !untracking) {
      var destroyed = active_effect !== null && (active_effect.f & DESTROYED) !== 0;
      if (!destroyed && (current_sources === null || !current_sources.has(signal))) {
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
          active_reaction.deps ?? (active_reaction.deps = []);
          if (!includes.call(active_reaction.deps, signal)) {
            active_reaction.deps.push(signal);
          }
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
      if (!untracking && reactivity_loss_tracker && // By checking that current/previous batch are null we filter out false positives.
      // reactivity_loss_tracker is only reset after a microtask, so if a flush happens
      // before that, we get warnings for things we shouldn't warn on.
      current_batch === null && previous_batch === null && !reactivity_loss_tracker.warned && (reactivity_loss_tracker.effect.f & REACTION_IS_UPDATING) === 0 && !reactivity_loss_tracker.effect_deps.has(signal)) {
        reactivity_loss_tracker.warned = true;
        await_reactivity_loss(
          /** @type {string} */
          signal.label
        );
        var trace2 = get_error("traced at");
        if (trace2)
          console.warn(trace2);
      }
      recent_async_deriveds.delete(signal);
      if (tracing_mode_flag && !untracking && tracing_expressions !== null && active_reaction !== null && tracing_expressions.reaction === active_reaction) {
        if (signal.trace) {
          signal.trace();
        } else {
          trace2 = get_error("traced at");
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
      var should_connect = (derived2.f & CONNECTED) === 0 && !untracking && active_reaction !== null && (active_reaction.f & CONNECTED) !== 0;
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
      var reactions = dep.reactions;
      if (reactions === null) {
        dep.reactions = [derived2];
      } else if (!includes.call(reactions, derived2)) {
        reactions.push(derived2);
      }
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
  var regex_return_characters = /\r/g;
  function hash(str) {
    str = str.replace(regex_return_characters, "");
    let hash2 = 5381;
    let i = str.length;
    while (i--)
      hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
    return (hash2 >>> 0).toString(36);
  }
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
  function sanitize_location(location) {
    return (
      /** @type {T} */
      location?.replace(/\//g, "/\u200B")
    );
  }

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
      target_handler.__removed = false;
      queue_micro_task(() => {
        if (!target_handler.__removed) {
          dom.addEventListener(event_name, target_handler, options);
        }
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
        target_handler.__removed = true;
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
  var last_propagated_event_clear_scheduled = false;
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
    if (!last_propagated_event_clear_scheduled) {
      last_propagated_event_clear_scheduled = true;
      setTimeout(() => {
        last_propagated_event_clear_scheduled = false;
        last_propagated_event = null;
      });
    }
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
        if (current_target === handler_element)
          break;
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
        if (event2.cancelBubble)
          break;
        path_idx++;
        current_target = path_idx < path.length ? (
          /** @type {Element} */
          path[path_idx]
        ) : null;
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
  function create_fragment_from_html(html2) {
    var elem = create_element("template");
    elem.innerHTML = create_trusted_html(html2.replaceAll("<!>", "<!---->"));
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
        node = create_fragment_from_html(has_start ? content : "<!>" + content);
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
          create_fragment_from_html(wrapped)
        );
        var root7 = (
          /** @type {Element} */
          get_first_child(fragment)
        );
        if (is_fragment) {
          node = document.createDocumentFragment();
          while (get_first_child(root7)) {
            node.appendChild(
              /** @type {TemplateNode} */
              get_first_child(root7)
            );
          }
        } else {
          node = /** @type {Element} */
          get_first_child(root7);
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
  function boundary(node, props, children, transform_error) {
    new Boundary(node, props, children, transform_error);
  }
  var _anchor, _hydrate_open, _props, _children, _effect, _main_effect, _pending_effect, _failed_effect, _offscreen_fragment, _local_pending_count, _pending_count, _pending_count_update_queued, _dirty_effects2, _maybe_dirty_effects2, _effect_pending, _effect_pending_subscriber, _hydrate_resolved_content, hydrate_resolved_content_fn, _hydrate_failed_content, hydrate_failed_content_fn, _create_reset, create_reset_fn, _is_destroyed, is_destroyed_fn, _hydrate_pending_content, hydrate_pending_content_fn, _render, render_fn, _resolve2, resolve_fn2, _run, run_fn, _update_pending_count, update_pending_count_fn, _handle_error, handle_error_fn;
  var Boundary = class {
    /**
     * @param {TemplateNode} node
     * @param {BoundaryProps} props
     * @param {((anchor: Node) => void)} children
     * @param {((error: unknown) => unknown) | undefined} [transform_error]
     */
    constructor(node, props, children, transform_error) {
      __privateAdd(this, _hydrate_resolved_content);
      /**
       * @param {unknown} error The deserialized error from the server's hydration comment
       */
      __privateAdd(this, _hydrate_failed_content);
      /**
       * Creates the `reset` function for a failed boundary, along with a function
       * that invokes `onerror` with it (if provided)
       * @param {unknown} error
       * @returns {{ reset: () => void, invoke_onerror: () => void }}
       */
      __privateAdd(this, _create_reset);
      __privateAdd(this, _is_destroyed);
      __privateAdd(this, _hydrate_pending_content);
      __privateAdd(this, _render);
      /**
       * @param {Batch} batch
       */
      __privateAdd(this, _resolve2);
      /**
       * @template T
       * @param {() => T} fn
       */
      __privateAdd(this, _run);
      /**
       * Updates the pending count associated with the currently visible pending snippet,
       * if any, such that we can replace the snippet with content once work is done
       * @param {1 | -1} d
       * @param {Batch} batch
       */
      __privateAdd(this, _update_pending_count);
      /**
       * @param {unknown} error
       */
      __privateAdd(this, _handle_error);
      /** @type {Boundary | null} */
      __publicField(this, "parent");
      __publicField(this, "is_pending", false);
      /**
       * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
       * Inherited from parent boundary, or defaults to identity.
       * @type {(error: unknown) => unknown}
       */
      __publicField(this, "transform_error");
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
      this.transform_error = transform_error ?? this.parent?.transform_error ?? ((e) => e);
      __privateSet(this, _effect, block(() => {
        if (hydrating) {
          const comment_data = read_hydration_instruction(
            /** @type {TemplateNode} */
            __privateGet(this, _hydrate_open)
          );
          hydrate_next();
          const server_rendered_pending = comment_data === HYDRATION_START_ELSE;
          const server_rendered_failed = comment_data.startsWith(HYDRATION_START_FAILED);
          if (server_rendered_failed) {
            const serialized_error = JSON.parse(comment_data.slice(HYDRATION_START_FAILED.length));
            __privateMethod(this, _hydrate_failed_content, hydrate_failed_content_fn).call(this, serialized_error);
          } else if (server_rendered_pending) {
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
     * @param {Batch} batch
     */
    update_pending_count(d, batch) {
      __privateMethod(this, _update_pending_count, update_pending_count_fn).call(this, d, batch);
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
      if (error === HYDRATION_ERROR) {
        throw error;
      }
      if (!__privateGet(this, _props).onerror && !__privateGet(this, _props).failed) {
        throw error;
      }
      if (current_batch?.is_fork) {
        if (__privateGet(this, _main_effect))
          current_batch.skip_effect(__privateGet(this, _main_effect));
        if (__privateGet(this, _pending_effect))
          current_batch.skip_effect(__privateGet(this, _pending_effect));
        if (__privateGet(this, _failed_effect))
          current_batch.skip_effect(__privateGet(this, _failed_effect));
        current_batch.oncommit(() => {
          if (!__privateMethod(this, _is_destroyed, is_destroyed_fn).call(this))
            __privateMethod(this, _handle_error, handle_error_fn).call(this, error);
        });
      } else {
        __privateMethod(this, _handle_error, handle_error_fn).call(this, error);
      }
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
  _hydrate_failed_content = new WeakSet();
  hydrate_failed_content_fn = function(error) {
    const failed = __privateGet(this, _props).failed;
    const { reset: reset2, invoke_onerror } = __privateMethod(this, _create_reset, create_reset_fn).call(this, error);
    queue_micro_task(invoke_onerror);
    if (!failed)
      return;
    __privateSet(this, _failed_effect, branch(() => {
      failed(
        __privateGet(this, _anchor),
        () => error,
        () => reset2
      );
    }));
  };
  _create_reset = new WeakSet();
  create_reset_fn = function(error) {
    var did_reset = false;
    var calling_on_error = false;
    const reset2 = () => {
      if (__privateMethod(this, _is_destroyed, is_destroyed_fn).call(this))
        return;
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
        __privateMethod(this, _render, render_fn).call(this);
      });
    };
    const invoke_onerror = () => {
      if (__privateMethod(this, _is_destroyed, is_destroyed_fn).call(this))
        return;
      try {
        calling_on_error = true;
        __privateGet(this, _props).onerror?.(error, reset2);
        calling_on_error = false;
      } catch (err) {
        invoke_error_boundary(err, __privateGet(this, _effect) && __privateGet(this, _effect).parent);
      }
    };
    return { reset: reset2, invoke_onerror };
  };
  _is_destroyed = new WeakSet();
  is_destroyed_fn = function() {
    return (__privateGet(this, _effect).f & (DESTROYED | DESTROYING)) !== 0;
  };
  _hydrate_pending_content = new WeakSet();
  hydrate_pending_content_fn = function() {
    const pending2 = __privateGet(this, _props).pending;
    if (!pending2)
      return;
    this.is_pending = true;
    __privateSet(this, _pending_effect, branch(() => pending2(__privateGet(this, _anchor))));
    queue_micro_task(() => {
      if (__privateMethod(this, _is_destroyed, is_destroyed_fn).call(this))
        return;
      var fragment = __privateSet(this, _offscreen_fragment, document.createDocumentFragment());
      var anchor = create_text();
      var handled = false;
      fragment.append(anchor);
      __privateSet(this, _main_effect, __privateMethod(this, _run, run_fn).call(this, () => {
        try {
          return branch(() => __privateGet(this, _children).call(this, anchor));
        } catch (error) {
          try {
            this.error(error);
            handled = true;
          } catch (error2) {
            invoke_error_boundary(error2, __privateGet(this, _effect).parent);
          }
          return null;
        }
      }));
      if (__privateGet(this, _main_effect) === null) {
        __privateSet(this, _offscreen_fragment, null);
        if (handled)
          __privateMethod(this, _resolve2, resolve_fn2).call(
            this,
            /** @type {Batch} */
            current_batch
          );
        return;
      }
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
        __privateMethod(this, _resolve2, resolve_fn2).call(
          this,
          /** @type {Batch} */
          current_batch
        );
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
        __privateMethod(this, _resolve2, resolve_fn2).call(
          this,
          /** @type {Batch} */
          current_batch
        );
      }
    } catch (error) {
      this.error(error);
    }
  };
  _resolve2 = new WeakSet();
  resolve_fn2 = function(batch) {
    this.is_pending = false;
    batch.transfer_effects(__privateGet(this, _dirty_effects2), __privateGet(this, _maybe_dirty_effects2));
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
      Batch.ensure();
      return fn();
    } finally {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_ctx);
    }
  };
  _update_pending_count = new WeakSet();
  update_pending_count_fn = function(d, batch) {
    var _a2;
    if (!this.has_pending_snippet()) {
      if (this.parent) {
        __privateMethod(_a2 = this.parent, _update_pending_count, update_pending_count_fn).call(_a2, d, batch);
      }
      return;
    }
    __privateSet(this, _pending_count, __privateGet(this, _pending_count) + d);
    if (__privateGet(this, _pending_count) === 0) {
      __privateMethod(this, _resolve2, resolve_fn2).call(this, batch);
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
  _handle_error = new WeakSet();
  handle_error_fn = function(error) {
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
    let failed = __privateGet(this, _props).failed;
    const handle_error_result = (transformed_error) => {
      if (__privateMethod(this, _is_destroyed, is_destroyed_fn).call(this))
        return;
      const { reset: reset2, invoke_onerror } = __privateMethod(this, _create_reset, create_reset_fn).call(this, transformed_error);
      invoke_onerror();
      if (failed && !__privateMethod(this, _is_destroyed, is_destroyed_fn).call(this)) {
        __privateSet(this, _failed_effect, __privateMethod(this, _run, run_fn).call(this, () => {
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
                () => transformed_error,
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
    };
    queue_micro_task(() => {
      if (__privateMethod(this, _is_destroyed, is_destroyed_fn).call(this))
        return;
      var result;
      try {
        result = this.transform_error(error);
      } catch (e) {
        invoke_error_boundary(e, __privateGet(this, _effect) && __privateGet(this, _effect).parent);
        return;
      }
      if (result !== null && typeof result === "object" && typeof /** @type {any} */
      result.then === "function") {
        result.then(
          handle_error_result,
          /** @param {unknown} e */
          (e) => invoke_error_boundary(e, __privateGet(this, _effect) && __privateGet(this, _effect).parent)
        );
      } else {
        handle_error_result(result);
      }
    });
  };

  // node_modules/svelte/src/internal/client/render.js
  var should_intro = true;
  function set_text(text2, value) {
    var _a2;
    var str = value == null ? "" : typeof value === "object" ? `${value}` : value;
    if (str !== /** @type {any} */
    (text2[_a2 = TEXT_CACHE] ?? (text2[_a2] = text2.nodeValue))) {
      text2[TEXT_CACHE] = str;
      text2.nodeValue = `${str}`;
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
  function _mount(Component, { target, anchor, props = {}, events, context, intro = true, transformError }) {
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
          component2 = Component(anchor_node2, props) || mark_as_component();
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
        },
        transformError
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
      lifecycle_double_unmount();
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
      /**
       * @param {Batch} batch
       */
      __privateAdd(this, _commit2, (batch) => {
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
            resume_effect(offscreen.effect);
            __privateGet(this, _onscreen).set(key2, offscreen.effect);
            __privateGet(this, _offscreen).delete(key2);
            if (dev_fallback_default) {
              offscreen.fragment.lastChild[HMR_ANCHOR] = this.anchor;
            }
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
        __privateGet(this, _commit2).call(this, batch);
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
    var marker;
    if (hydrating) {
      marker = hydrate_node;
      hydrate_next();
    }
    var branches = new BranchManager(node);
    var flags2 = elseif ? EFFECT_TRANSPARENT : 0;
    function update_branch(key2, fn2) {
      if (hydrating) {
        var data = read_hydration_instruction(
          /** @type {TemplateNode} */
          marker
        );
        if (key2 !== parseInt(data.substring(1))) {
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
        update_branch(-1, null);
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
              destroy_effects(state2, array_from(group.done));
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
      var fast_path = transitions.length === 0 && controlled_anchor !== null && state2.pending.size === 0;
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
      destroy_effects(state2, to_destroy, !fast_path);
    } else {
      group = {
        pending: new Set(to_destroy),
        done: /* @__PURE__ */ new Set()
      };
      (state2.outrogroups ?? (state2.outrogroups = /* @__PURE__ */ new Set())).add(group);
    }
  }
  function destroy_effects(state2, to_destroy, remove_dom = true) {
    var preserved_effects;
    if (state2.pending.size > 0) {
      preserved_effects = /* @__PURE__ */ new Set();
      for (const keys of state2.pending.values()) {
        for (const key2 of keys) {
          preserved_effects.add(
            /** @type {EachItem} */
            state2.items.get(key2).e
          );
        }
      }
    }
    for (var i = 0; i < to_destroy.length; i++) {
      var e = to_destroy[i];
      if (preserved_effects?.has(e)) {
        e.f |= EFFECT_OFFSCREEN;
        const fragment = document.createDocumentFragment();
        move_effect(e, fragment);
      } else {
        destroy_effect(to_destroy[i], remove_dom);
      }
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
      return (
        /** @type {V[]} */
        is_array(collection) ? collection : collection == null ? [] : array_from(collection)
      );
    });
    if (dev_fallback_default) {
      tag(each_array, "{#each ...}");
    }
    var pending2 = /* @__PURE__ */ new Map();
    var first_run = true;
    function commit(batch) {
      if ((state2.effect.f & DESTROYED) !== 0) {
        return;
      }
      state2.pending.delete(batch);
      var array = get(each_array);
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
    function discard(batch) {
      state2.pending.delete(batch);
    }
    var effect2 = block(() => {
      var array = (
        /** @type {V[]} */
        get(each_array)
      );
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
        if (dev_fallback_default) {
          var key_again = get_key(value, index2);
          if (key2 !== key_again) {
            each_key_volatile(String(index2), String(key2), String(key_again));
          }
        }
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
        pending2.set(batch, keys);
        if (defer) {
          for (const [key3, item2] of items) {
            if (!keys.has(key3)) {
              batch.skip_effect(item2.e);
            }
          }
          batch.oncommit(commit);
          batch.ondiscard(discard);
        } else {
          commit(batch);
        }
      }
      if (mismatch) {
        set_hydrating(true);
      }
      get(each_array);
    });
    var state2 = { effect: effect2, flags: flags2, items, pending: pending2, outrogroups: null, fallback: fallback2 };
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
    var seen2;
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
      if ((effect2.f & INERT) !== 0) {
        resume_effect(effect2);
        if (is_animated) {
          effect2.nodes?.a?.unfix();
          (to_animate ?? (to_animate = /* @__PURE__ */ new Set())).delete(effect2);
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
      if (effect2 !== current) {
        if (seen2 !== void 0 && seen2.has(effect2)) {
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
              seen2.delete(stashed[j]);
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
            seen2.delete(effect2);
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
          (seen2 ?? (seen2 = /* @__PURE__ */ new Set())).add(current);
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
          destroy_effects(state2, array_from(group.done));
          state2.outrogroups?.delete(group);
        }
      }
      if (state2.outrogroups.size === 0) {
        state2.outrogroups = null;
      }
    }
    if (current !== null || seen2 !== void 0) {
      var to_destroy = [];
      if (seen2 !== void 0) {
        for (effect2 of seen2) {
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

  // node_modules/svelte/src/internal/client/dom/blocks/html.js
  function check_hash(element2, server_hash, value) {
    if (!server_hash || server_hash === hash(String(value ?? "")))
      return;
    let location;
    const loc = element2.__svelte_meta?.loc;
    if (loc) {
      location = `near ${loc.file}:${loc.line}:${loc.column}`;
    } else if (dev_current_component_function?.[FILENAME]) {
      location = `in ${dev_current_component_function[FILENAME]}`;
    }
    hydration_html_changed(sanitize_location(location));
  }
  function html(node, get_value, is_controlled = false, svg = false, mathml = false, skip_warning = false) {
    var anchor = node;
    var value = "";
    if (is_controlled) {
      var parent_node = (
        /** @type {Element} */
        node
      );
      if (hydrating) {
        anchor = set_hydrate_node(get_first_child(parent_node));
      }
    }
    template_effect(() => {
      var effect2 = (
        /** @type {Effect} */
        active_effect
      );
      if (value === (value = get_value() ?? "")) {
        if (hydrating)
          hydrate_next();
        return;
      }
      if (is_controlled && !hydrating) {
        effect2.nodes = null;
        parent_node.innerHTML = /** @type {string} */
        value;
        if (value !== "") {
          assign_nodes(
            /** @type {TemplateNode} */
            get_first_child(parent_node),
            /** @type {TemplateNode} */
            parent_node.lastChild
          );
        }
        return;
      }
      if (effect2.nodes !== null) {
        remove_effect_dom(
          effect2.nodes.start,
          /** @type {TemplateNode} */
          effect2.nodes.end
        );
        effect2.nodes = null;
      }
      if (value === "")
        return;
      if (hydrating) {
        var hash2 = (
          /** @type {Comment} */
          hydrate_node.data
        );
        var next2 = hydrate_next();
        var last = next2;
        while (next2 !== null && (next2.nodeType !== COMMENT_NODE || /** @type {Comment} */
        next2.data !== "")) {
          last = next2;
          next2 = get_next_sibling(next2);
        }
        if (next2 === null) {
          hydration_mismatch();
          throw HYDRATION_ERROR;
        }
        if (dev_fallback_default && !skip_warning) {
          check_hash(
            /** @type {Element} */
            next2.parentNode,
            hash2,
            value
          );
        }
        assign_nodes(hydrate_node, last);
        anchor = set_hydrate_node(next2);
        return;
      }
      var ns = svg ? NAMESPACE_SVG : mathml ? NAMESPACE_MATHML : void 0;
      var wrapper = (
        /** @type {HTMLTemplateElement | SVGElement | MathMLElement} */
        create_element(svg ? "svg" : mathml ? "math" : "template", ns)
      );
      wrapper.innerHTML = /** @type {any} */
      value;
      var node2 = svg || mathml ? wrapper : (
        /** @type {HTMLTemplateElement} */
        wrapper.content
      );
      assign_nodes(
        /** @type {TemplateNode} */
        get_first_child(node2),
        /** @type {TemplateNode} */
        node2.lastChild
      );
      if (svg || mathml) {
        while (get_first_child(node2)) {
          anchor.before(
            /** @type {TemplateNode} */
            get_first_child(node2)
          );
        }
      } else {
        anchor.before(node2);
      }
    });
  }

  // node_modules/svelte/src/internal/client/dom/css.js
  function append_styles(anchor, css) {
    effect(() => {
      anchor = active_effect?.parent?.nodes?.start ?? anchor;
      var root7 = anchor.getRootNode();
      var target = (
        /** @type {ShadowRoot} */
        root7.host ? (
          /** @type {ShadowRoot} */
          root7
        ) : (
          /** @type {Document} */
          root7.head ?? /** @type {Document} */
          root7.ownerDocument.head
        )
      );
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
      for (var key2 of Object.keys(directives)) {
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
    for (var key2 of Object.keys(styles)) {
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
        value = String(value).replaceAll(/\/\*.*?\*\//g, "").trim();
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
    var prev = (
      /** @type {any} */
      dom[CLASS_CACHE]
    );
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
      dom[CLASS_CACHE] = value;
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
    var prev = (
      /** @type {any} */
      dom[STYLE_CACHE]
    );
    if (hydrating || prev !== value) {
      var next_style_attr = to_style(value, next_styles);
      if (!hydrating || next_style_attr !== dom.getAttribute("style")) {
        if (next_style_attr == null) {
          dom.removeAttribute("style");
        } else {
          dom.style.cssText = next_style_attr;
        }
      }
      dom[STYLE_CACHE] = value;
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
    } else if (typeof value !== "string" && get_setters(element2).has(attribute)) {
      element2[attribute] = value;
    } else {
      element2.setAttribute(attribute, value);
    }
  }
  function get_attributes(element2) {
    var _a2;
    return (
      /** @type {Record<string | symbol, unknown>} **/
      /** @type {any} */
      element2[_a2 = ATTRIBUTES_CACHE] ?? (element2[_a2] = {
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
    setters_cache.set(cache_key, setters = /* @__PURE__ */ new Set());
    var descriptors;
    var proto = element2;
    var element_proto = Element.prototype;
    while (element_proto !== proto) {
      descriptors = get_descriptors(proto);
      for (var key2 in descriptors) {
        if (descriptors[key2].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
        key2 !== "innerHTML" && key2 !== "textContent" && key2 !== "innerText") {
          setters.add(key2);
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

  // node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
  function is_bound_this(bound_value, element_or_component) {
    return bound_value === element_or_component || bound_value?.[STATE_SYMBOL] === element_or_component;
  }
  function bind_this(element_or_component = mark_as_component(), update2, get_value, get_parts) {
    var component_effect = (
      /** @type {ComponentContext} */
      component_context.r
    );
    var parent = (
      /** @type {Effect} */
      active_effect
    );
    effect(() => {
      var old_parts;
      var parts;
      render_effect(() => {
        old_parts = parts;
        parts = get_parts?.() || [];
        untrack(() => {
          if (!is_bound_this(get_value(...parts), element_or_component)) {
            update2(element_or_component, ...parts);
            if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) {
              update2(null, ...old_parts);
            }
          }
        });
      });
      return () => {
        let p = parent;
        while (p !== component_effect && p.parent !== null && p.parent.f & DESTROYING) {
          p = p.parent;
        }
        const teardown2 = () => {
          if (parts && is_bound_this(get_value(...parts), element_or_component)) {
            update2(null, ...parts);
          }
        };
        const original_teardown = p.teardown;
        p.teardown = () => {
          teardown2();
          original_teardown?.();
        };
      };
    });
    return element_or_component;
  }

  // node_modules/svelte/src/internal/client/reactivity/store.js
  var is_store_binding = false;
  var IS_UNMOUNTED = Symbol("unmounted");
  function capture_store_binding(fn) {
    var previous_is_store_binding = is_store_binding;
    try {
      is_store_binding = false;
      return [fn(), is_store_binding];
    } finally {
      is_store_binding = previous_is_store_binding;
    }
  }

  // node_modules/svelte/src/internal/client/reactivity/props.js
  function prop(props, key2, flags2, fallback2) {
    var runes = !legacy_mode_flag || (flags2 & PROPS_IS_RUNES) !== 0;
    var bindable = (flags2 & PROPS_IS_BINDABLE) !== 0;
    var lazy = (flags2 & PROPS_IS_LAZY_INITIAL) !== 0;
    var fallback_value = (
      /** @type {V} */
      fallback2
    );
    var fallback_dirty = true;
    var fallback_signal = (
      /** @type {Derived<V> | undefined} */
      void 0
    );
    var get_fallback = () => {
      if (lazy && runes) {
        fallback_signal ?? (fallback_signal = derived(
          /** @type {() => V} */
          fallback2
        ));
        return get(fallback_signal);
      }
      if (fallback_dirty) {
        fallback_dirty = false;
        fallback_value = lazy ? untrack(
          /** @type {() => V} */
          fallback2
        ) : (
          /** @type {V} */
          fallback2
        );
      }
      return fallback_value;
    };
    let setter;
    if (bindable) {
      var is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
      setter = get_descriptor(props, key2)?.set ?? (is_entry_props && key2 in props ? (v) => props[key2] = v : void 0);
    }
    var initial_value;
    var is_store_sub = false;
    if (bindable) {
      [initial_value, is_store_sub] = capture_store_binding(() => (
        /** @type {V} */
        props[key2]
      ));
    } else {
      initial_value = /** @type {V} */
      props[key2];
    }
    if (initial_value === void 0 && fallback2 !== void 0) {
      initial_value = get_fallback();
      if (setter) {
        if (runes)
          props_invalid_value(key2);
        setter(initial_value);
      }
    }
    var getter;
    if (runes) {
      getter = () => {
        var value = (
          /** @type {V} */
          props[key2]
        );
        if (value === void 0)
          return get_fallback();
        fallback_dirty = true;
        return value;
      };
    } else {
      getter = () => {
        var value = (
          /** @type {V} */
          props[key2]
        );
        if (value !== void 0) {
          fallback_value = /** @type {V} */
          void 0;
        }
        return value === void 0 ? fallback_value : value;
      };
    }
    if (runes && (flags2 & PROPS_IS_UPDATED) === 0) {
      return getter;
    }
    if (setter) {
      var legacy_parent = props.$$legacy;
      return (
        /** @type {() => V} */
        function(value, mutation) {
          if (arguments.length > 0) {
            if (!runes || !mutation || legacy_parent || is_store_sub) {
              setter(mutation ? getter() : value);
            }
            return value;
          }
          return getter();
        }
      );
    }
    var overridden = false;
    var d = ((flags2 & PROPS_IS_IMMUTABLE) !== 0 ? derived : derived_safe_equal)(() => {
      overridden = false;
      return getter();
    });
    if (dev_fallback_default) {
      d.label = key2;
    }
    if (bindable)
      get(d);
    var parent_effect = (
      /** @type {Effect} */
      active_effect
    );
    return (
      /** @type {() => V} */
      function(value, mutation) {
        if (arguments.length > 0) {
          const new_value = mutation ? get(d) : runes && bindable ? proxy(value) : value;
          set(d, new_value);
          overridden = true;
          if (fallback_value !== void 0) {
            fallback_value = new_value;
          }
          return value;
        }
        if (is_destroying_effect && overridden || (parent_effect.f & DESTROYED) !== 0) {
          return d.v;
        }
        return get(d);
      }
    );
  }

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
        recover: options.recover,
        transformError: options.transformError
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
  var api = null;
  function getVsCodeApi() {
    if (!api && typeof acquireVsCodeApi === "function") {
      api = acquireVsCodeApi();
    }
    return api;
  }
  function postMessage(type, payload) {
    const vscode = getVsCodeApi();
    if (vscode) {
      vscode.postMessage({ type, payload });
    }
  }
  function onMessage(handler) {
    const listener = (event2) => {
      handler(event2.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }
  function escapePushHtml(str) {
    if (!str)
      return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    if (!str)
      return "";
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function getPushFileIcon(filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "dart") {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4.5 12L12 4.5L19.5 12L12 19.5L4.5 12Z" stroke="#4fc3f7" stroke-width="2.5" fill="#0288d1"/><circle cx="12" cy="12" r="3" fill="#ffffff"/></svg>';
    }
    if (ext === "xml") {
      return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#e57373"><path d="M8 2L13 6L8 14L3 6L8 2Z" stroke="#ef5350" stroke-width="1.2" fill="#c62828"/></svg>';
    }
    if (ext === "json") {
      return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#ce93d8"><text x="2" y="12" fill="#ab47bc" font-size="12" font-weight="bold">{ }</text></svg>';
    }
    return '<svg width="15" height="15" viewBox="0 0 16 16" fill="#90a4ae"><path d="M3 2h7l3 3v9H3V2z" fill="#37474f" stroke="#78909c" stroke-width="1.2"/><path d="M10 2v3h3" fill="none" stroke="#78909c" stroke-width="1.2"/></svg>';
  }
  function openCreateBranchDialog(startPoint) {
    const existing = document.querySelector(".as-branch-dialog-overlay");
    if (existing)
      existing.remove();
    const overlay = document.createElement("div");
    overlay.className = "as-branch-dialog-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(1px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
    const baseName = startPoint || "HEAD";
    const displayBase = baseName.length > 30 ? baseName.slice(0, 27) + "..." : baseName;
    const card = document.createElement("div");
    card.className = "as-dialog-card";
    card.style.cssText = "background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:460px;max-width:92vw;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);";
    card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));user-select:none;">
      <span class="as-cb-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
      </span>
      <button class="as-dialog-close-btn as-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div style="padding:18px 20px 14px 20px;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <label for="as-cb-name" style="font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);white-space:nowrap;font-weight:500;">Branch Name:</label>
        <input type="text" id="as-cb-name" style="flex:1;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-focusBorder,#3574f0);border-radius:4px;padding:5px 8px;font-size:13px;outline:none;font-family:inherit;">
      </div>
      <div style="display:flex;align-items:center;gap:20px;padding-left:102px;">
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;color:var(--vscode-editor-foreground,#dfe1e5);user-select:none;">
          <input type="checkbox" id="as-cb-checkout" class="as-custom-chk" checked style="width:14px;height:14px;cursor:pointer;margin:0;">
          <span>Checkout branch</span>
        </label>
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;color:var(--vscode-editor-foreground,#dfe1e5);user-select:none;">
          <input type="checkbox" id="as-cb-overwrite" class="as-custom-chk" style="width:14px;height:14px;cursor:pointer;margin:0;">
          <span>Overwrite existing branch</span>
        </label>
      </div>
    </div>
    <div style="padding:10px 20px 16px 20px;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));">
      <button class="as-dialog-btn" id="as-cb-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
      <button class="as-dialog-btn" id="as-cb-create" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-radius:4px;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Create</button>
    </div>
  `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const titleEl = card.querySelector(".as-cb-title");
    titleEl.textContent = "Create Branch from " + displayBase;
    const nameInput = card.querySelector("#as-cb-name");
    nameInput.value = baseName;
    const checkoutBox = card.querySelector("#as-cb-checkout");
    const overwriteBox = card.querySelector("#as-cb-overwrite");
    const btnCancel = card.querySelector("#as-cb-cancel");
    const btnCreate = card.querySelector("#as-cb-create");
    const dotClose = card.querySelector(".as-dot-close");
    const closeDialog = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
    };
    const submitDialog = () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        return;
      }
      const checkout = checkoutBox.checked;
      const force = overwriteBox.checked;
      postMessage("createBranch", { name, startPoint: baseName, checkout, force });
      closeDialog();
    };
    btnCancel.addEventListener("click", closeDialog);
    if (dotClose)
      dotClose.addEventListener("click", closeDialog);
    btnCreate.addEventListener("click", submitDialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        closeDialog();
    });
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog();
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitDialog();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 50);
  }
  function openRenameBranchDialog(oldName) {
    const existing = document.querySelector(".as-branch-dialog-overlay");
    if (existing)
      existing.remove();
    const overlay = document.createElement("div");
    overlay.className = "as-branch-dialog-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(1px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
    const card = document.createElement("div");
    card.className = "as-dialog-card";
    card.style.cssText = "background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:460px;max-width:92vw;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);";
    card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));user-select:none;">
      <span class="as-rb-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
      </span>
      <button class="as-dialog-close-btn as-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div style="padding:18px 20px 14px 20px;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <label for="as-rb-name" style="font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);white-space:nowrap;font-weight:500;">Branch Name:</label>
        <input type="text" id="as-rb-name" style="flex:1;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-focusBorder,#3574f0);border-radius:4px;padding:5px 8px;font-size:13px;outline:none;font-family:inherit;">
      </div>
    </div>
    <div style="padding:10px 20px 16px 20px;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));">
      <button class="as-dialog-btn" id="as-rb-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
      <button class="as-dialog-btn" id="as-rb-ok" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-radius:4px;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Rename</button>
    </div>
  `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const titleEl = card.querySelector(".as-rb-title");
    titleEl.textContent = "Rename Branch '" + (oldName || "") + "'";
    const nameInput = card.querySelector("#as-rb-name");
    nameInput.value = oldName || "";
    const btnCancel = card.querySelector("#as-rb-cancel");
    const btnOk = card.querySelector("#as-rb-ok");
    const dotClose = card.querySelector(".as-dot-close");
    const closeDialog = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
    };
    const submitDialog = () => {
      const newName = nameInput.value.trim();
      if (!newName) {
        nameInput.focus();
        return;
      }
      if (newName !== oldName) {
        postMessage("renameBranch", { oldName, newName });
      }
      closeDialog();
    };
    btnCancel.addEventListener("click", closeDialog);
    if (dotClose)
      dotClose.addEventListener("click", closeDialog);
    btnOk.addEventListener("click", submitDialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        closeDialog();
    });
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog();
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitDialog();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 50);
  }
  function openCreateTagDialog(hash2) {
    const existing = document.querySelector(".as-branch-dialog-overlay");
    if (existing)
      existing.remove();
    const overlay = document.createElement("div");
    overlay.className = "as-branch-dialog-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(1px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
    const shortHash = hash2 ? hash2.slice(0, 8) : "";
    const card = document.createElement("div");
    card.className = "as-dialog-card";
    card.style.cssText = "background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:460px;max-width:92vw;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);";
    card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));user-select:none;">
      <span class="as-tag-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
      </span>
      <button class="as-dialog-close-btn as-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
      </button>
    </div>
    <div style="padding:18px 20px 14px 20px;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <label for="as-tag-name" style="font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);white-space:nowrap;font-weight:500;">Tag Name:</label>
        <input type="text" id="as-tag-name" placeholder="v1.0.0" style="flex:1;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-focusBorder,#3574f0);border-radius:4px;padding:5px 8px;font-size:13px;outline:none;font-family:inherit;">
      </div>
    </div>
    <div style="padding:10px 20px 16px 20px;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));">
      <button class="as-dialog-btn" id="as-tag-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
      <button class="as-dialog-btn" id="as-tag-ok" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-radius:4px;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Create</button>
    </div>
  `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const titleEl = card.querySelector(".as-tag-title");
    titleEl.textContent = "Create Tag at " + shortHash;
    const nameInput = card.querySelector("#as-tag-name");
    const btnCancel = card.querySelector("#as-tag-cancel");
    const btnOk = card.querySelector("#as-tag-ok");
    const dotClose = card.querySelector(".as-dot-close");
    const closeDialog = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
    };
    const submitDialog = () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        return;
      }
      postMessage("createTag", { name, hash: hash2 });
      closeDialog();
    };
    btnCancel.addEventListener("click", closeDialog);
    if (dotClose)
      dotClose.addEventListener("click", closeDialog);
    btnOk.addEventListener("click", submitDialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        closeDialog();
    });
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog();
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitDialog();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 50);
  }
  if (typeof window !== "undefined") {
    window.openCreateBranchDialog = openCreateBranchDialog;
    window.openRenameBranchDialog = openRenameBranchDialog;
    window.openCreateTagDialog = openCreateTagDialog;
  }
  var activeAuthDialog = null;
  function openGitAuthDialog(authInfo) {
    if (activeAuthDialog) {
      activeAuthDialog.remove();
      activeAuthDialog = null;
    }
    const overlay = document.createElement("div");
    overlay.className = "as-branch-dialog-overlay as-auth-dialog-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(1px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
    const remote = authInfo?.remote || "origin";
    const rawUrl = authInfo?.url || "";
    let hostName = authInfo?.host || remote;
    if (!authInfo?.host && rawUrl) {
      try {
        hostName = new URL(rawUrl).host;
      } catch {
      }
    }
    const defaultUsername = authInfo?.defaultUsername || "phucdnh";
    const card = document.createElement("div");
    card.className = "as-dialog-card";
    card.style.cssText = "background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:490px;max-width:92vw;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);";
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));user-select:none;">
        <span class="as-auth-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
          Log In to ${escapePushHtml(hostName)}
        </span>
        <button class="as-dialog-close-btn as-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
        </button>
      </div>
      <div style="padding:16px 20px 12px 20px;display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:12.5px;color:var(--vscode-descriptionForeground,#9aa0a6);line-height:1.4;">
          Authentication required for remote <strong style="color:var(--vscode-editor-foreground,#dfe1e5);">${escapePushHtml(remote)}</strong>:
          <div style="color:var(--vscode-textLink-foreground,#56a8f5);font-family:monospace;font-size:11.5px;margin-top:3px;word-break:break-all;user-select:text;">${escapePushHtml(rawUrl)}</div>
        </div>

        <div style="display:flex;border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));gap:16px;margin-top:2px;">
          <button id="as-auth-tab-token" type="button" style="background:none;border:none;border-bottom:2px solid var(--vscode-button-background,#3574f0);color:var(--vscode-editor-foreground,#dfe1e5);font-weight:600;font-size:13px;padding:6px 2px;cursor:pointer;outline:none;">
            Token
          </button>
          <button id="as-auth-tab-password" type="button" style="background:none;border:none;border-bottom:2px solid transparent;color:var(--vscode-descriptionForeground,#8c9199);font-weight:500;font-size:13px;padding:6px 2px;cursor:pointer;outline:none;">
            Username / Password
          </button>
        </div>

        <div id="as-auth-token-pane" style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label for="as-auth-token-input" style="font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);font-weight:500;">Personal Access Token:</label>
              <span style="font-size:11.5px;color:var(--vscode-descriptionForeground,#8c9199);">(scope: read/write repository)</span>
            </div>
            <div style="position:relative;display:flex;align-items:center;">
              <input type="password" id="as-auth-token-input" placeholder="e.g. glpat-... or ghp_..." style="width:100%;box-sizing:border-box;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-input-border,#4e5157);border-radius:4px;padding:6px 30px 6px 8px;font-size:13px;outline:none;font-family:monospace;">
              <span id="as-auth-token-toggle" title="Show/Hide" style="position:absolute;right:8px;cursor:pointer;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));display:flex;align-items:center;">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3c-4 0-7 5-7 5s3 5 7 5 7-5 7-5-3-5-7-5zm0 8.5A3.5 3.5 0 1 1 8 4.5a3.5 3.5 0 0 1 0 7zm0-5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>
              </span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label for="as-auth-token-username" style="font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);font-weight:500;">Username:</label>
            <input type="text" id="as-auth-token-username" value="${escapeAttr(defaultUsername)}" placeholder="e.g. phucdnh" style="background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-input-border,#4e5157);border-radius:4px;padding:6px 8px;font-size:13px;outline:none;font-family:inherit;">
          </div>
        </div>

        <div id="as-auth-password-pane" style="display:none;flex-direction:column;gap:10px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label for="as-auth-user-input" style="font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);font-weight:500;">Username:</label>
            <input type="text" id="as-auth-user-input" value="${escapeAttr(defaultUsername)}" placeholder="Username" style="background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-input-border,#4e5157);border-radius:4px;padding:6px 8px;font-size:13px;outline:none;font-family:inherit;">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label for="as-auth-pass-input" style="font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);font-weight:500;">Password:</label>
            <div style="position:relative;display:flex;align-items:center;">
              <input type="password" id="as-auth-pass-input" placeholder="Password" style="width:100%;box-sizing:border-box;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#dfe1e5);border:1px solid var(--vscode-input-border,#4e5157);border-radius:4px;padding:6px 30px 6px 8px;font-size:13px;outline:none;font-family:inherit;">
              <span id="as-auth-pass-toggle" title="Show/Hide" style="position:absolute;right:8px;cursor:pointer;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));display:flex;align-items:center;">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3c-4 0-7 5-7 5s3 5 7 5 7-5 7-5-3-5-7-5zm0 8.5A3.5 3.5 0 1 1 8 4.5a3.5 3.5 0 0 1 0 7zm0-5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>
              </span>
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;margin-top:2px;">
          <label style="display:inline-flex;align-items:center;gap:7px;font-size:12.5px;cursor:pointer;color:var(--vscode-editor-foreground,#dfe1e5);user-select:none;">
            <input type="checkbox" id="as-auth-remember" class="as-custom-chk" checked style="width:14px;height:14px;cursor:pointer;margin:0;">
            <span>Remember credentials (save into repository remote configuration)</span>
          </label>
        </div>

        <div id="as-auth-error-msg" style="display:none;color:var(--vscode-inputValidation-errorForeground,#ff5252);font-size:12px;line-height:1.35;padding:6px 10px;background:var(--vscode-inputValidation-errorBackground,rgba(255,82,82,0.12));border-radius:4px;border-left:3px solid var(--vscode-inputValidation-errorBorder,#ff5252);"></div>
      </div>
      <div style="padding:10px 20px 16px 20px;display:flex;align-items:center;justify-content:flex-end;gap:10px;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#393b40));">
        <button class="as-dialog-btn" id="as-auth-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
        <button class="as-dialog-btn" id="as-auth-submit" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-radius:4px;padding:6px 22px;font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
          <span id="as-auth-spinner" style="display:none;width:12px;height:12px;border:2px solid var(--vscode-button-foreground,#fff);border-top-color:transparent;border-radius:50%;animation:asAuthSpin 0.7s linear infinite;"></span>
          <span id="as-auth-btn-text">Log In</span>
        </button>
      </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    activeAuthDialog = overlay;
    if (!document.getElementById("as-checkbox-transparent-style")) {
      const cs = document.createElement("style");
      cs.id = "as-checkbox-transparent-style";
      cs.textContent = `
        input[type="checkbox"],
        .as-custom-chk {
          appearance: none !important;
          -webkit-appearance: none !important;
          width: 14px !important;
          height: 14px !important;
          min-width: 14px !important;
          min-height: 14px !important;
          border: 1px solid var(--vscode-checkbox-border, var(--vscode-input-border, #6C707E)) !important;
          border-radius: 2.5px !important;
          background: transparent !important;
          background-color: transparent !important;
          cursor: pointer !important;
          position: relative !important;
          outline: none !important;
          margin: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
          transition: border-color 0.12s ease, background-color 0.12s ease !important;
          flex-shrink: 0 !important;
        }
        input[type="checkbox"]:hover,
        .as-custom-chk:hover {
          border-color: var(--vscode-focusBorder, #CED0D6) !important;
          background-color: rgba(255, 255, 255, 0.06) !important;
        }
        input[type="checkbox"]:checked,
        .as-custom-chk:checked {
          background: transparent !important;
          background-color: transparent !important;
          border-color: var(--vscode-focusBorder, #CED0D6) !important;
        }
        input[type="checkbox"]:checked::after,
        .as-custom-chk:checked::after {
          content: '' !important;
          position: absolute !important;
          top: 1px !important;
          left: 4px !important;
          width: 3.5px !important;
          height: 7px !important;
          border: solid var(--vscode-editor-foreground, #CED0D6) !important;
          border-width: 0 1.8px 1.8px 0 !important;
          transform: rotate(45deg) !important;
        }
        input[type="checkbox"]:indeterminate,
        .as-custom-chk:indeterminate {
          background: transparent !important;
          background-color: transparent !important;
          border-color: var(--vscode-focusBorder, #CED0D6) !important;
        }
        input[type="checkbox"]:indeterminate::after,
        .as-custom-chk:indeterminate::after {
          content: '' !important;
          position: absolute !important;
          top: 5px !important;
          left: 3px !important;
          width: 6px !important;
          height: 2px !important;
          background: var(--vscode-editor-foreground, #CED0D6) !important;
        }
      `;
      document.head.appendChild(cs);
    }
    if (!document.getElementById("as-auth-spin-style")) {
      const s = document.createElement("style");
      s.id = "as-auth-spin-style";
      s.textContent = "@keyframes asAuthSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
      document.head.appendChild(s);
    }
    let currentAuthMode = "token";
    const tabToken = card.querySelector("#as-auth-tab-token");
    const tabPassword = card.querySelector("#as-auth-tab-password");
    const paneToken = card.querySelector("#as-auth-token-pane");
    const panePassword = card.querySelector("#as-auth-password-pane");
    const tokenInput = card.querySelector("#as-auth-token-input");
    const tokenUserInput = card.querySelector("#as-auth-token-username");
    const userInput = card.querySelector("#as-auth-user-input");
    const passInput = card.querySelector("#as-auth-pass-input");
    const rememberBox = card.querySelector("#as-auth-remember");
    const errorMsg = card.querySelector("#as-auth-error-msg");
    const btnCancel = card.querySelector("#as-auth-cancel");
    const btnSubmit = card.querySelector("#as-auth-submit");
    const btnText = card.querySelector("#as-auth-btn-text");
    const spinner = card.querySelector("#as-auth-spinner");
    const dotClose = card.querySelector(".as-dot-close");
    const tokenToggle = card.querySelector("#as-auth-token-toggle");
    const passToggle = card.querySelector("#as-auth-pass-toggle");
    if (dotClose) {
      dotClose.onmouseenter = () => {
        dotClose.style.background = "var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2))";
        dotClose.style.color = "var(--vscode-editor-foreground, #dfe1e5)";
      };
      dotClose.onmouseleave = () => {
        dotClose.style.background = "none";
        dotClose.style.color = "var(--vscode-icon-foreground, var(--vscode-descriptionForeground, #8c9199))";
      };
    }
    btnCancel.onmouseenter = () => {
      btnCancel.style.background = "var(--vscode-button-secondaryHoverBackground, #35383d)";
    };
    btnCancel.onmouseleave = () => {
      btnCancel.style.background = "var(--vscode-button-secondaryBackground, #2b2d30)";
    };
    btnSubmit.onmouseenter = () => {
      btnSubmit.style.background = "var(--vscode-button-hoverBackground, #4682f7)";
    };
    btnSubmit.onmouseleave = () => {
      btnSubmit.style.background = "var(--vscode-button-background, #3574f0)";
    };
    tabToken.onclick = () => {
      currentAuthMode = "token";
      tabToken.style.borderBottomColor = "var(--vscode-button-background, #3574f0)";
      tabToken.style.color = "var(--vscode-editor-foreground, #dfe1e5)";
      tabToken.style.fontWeight = "600";
      tabPassword.style.borderBottomColor = "transparent";
      tabPassword.style.color = "var(--vscode-descriptionForeground, #8c9199)";
      tabPassword.style.fontWeight = "500";
      paneToken.style.display = "flex";
      panePassword.style.display = "none";
      tokenInput.focus();
    };
    tabPassword.onclick = () => {
      currentAuthMode = "password";
      tabPassword.style.borderBottomColor = "var(--vscode-button-background, #3574f0)";
      tabPassword.style.color = "var(--vscode-editor-foreground, #dfe1e5)";
      tabPassword.style.fontWeight = "600";
      tabToken.style.borderBottomColor = "transparent";
      tabToken.style.color = "var(--vscode-descriptionForeground, #8c9199)";
      tabToken.style.fontWeight = "500";
      panePassword.style.display = "flex";
      paneToken.style.display = "none";
      userInput.focus();
    };
    tokenToggle.onclick = () => {
      tokenInput.type = tokenInput.type === "password" ? "text" : "password";
    };
    passToggle.onclick = () => {
      passInput.type = passInput.type === "password" ? "text" : "password";
    };
    const closeDialog = () => {
      overlay.remove();
      activeAuthDialog = null;
      document.removeEventListener("keydown", onKeyDown);
    };
    btnCancel.onclick = closeDialog;
    if (dotClose)
      dotClose.onclick = closeDialog;
    overlay.onclick = (e) => {
      if (e.target === overlay)
        closeDialog();
    };
    const submit = () => {
      errorMsg.style.display = "none";
      let username = "";
      let secret = "";
      if (currentAuthMode === "token") {
        secret = tokenInput.value.trim();
        username = tokenUserInput.value.trim();
        if (!secret) {
          tokenInput.style.borderColor = "#ff5252";
          tokenInput.focus();
          return;
        }
      } else {
        username = userInput.value.trim();
        secret = passInput.value.trim();
        if (!username) {
          userInput.style.borderColor = "#ff5252";
          userInput.focus();
          return;
        }
        if (!secret) {
          passInput.style.borderColor = "#ff5252";
          passInput.focus();
          return;
        }
      }
      btnSubmit.disabled = true;
      spinner.style.display = "inline-block";
      btnText.textContent = "Verifying...";
      postMessage("saveGitCredentials", {
        remote,
        url: rawUrl,
        authType: currentAuthMode,
        username,
        token: currentAuthMode === "token" ? secret : void 0,
        password: currentAuthMode === "password" ? secret : void 0,
        remember: rememberBox.checked
      });
    };
    btnSubmit.onclick = submit;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog();
      } else if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    setTimeout(() => {
      tokenInput.focus();
    }, 50);
  }
  window.openGitAuthDialog = openGitAuthDialog;
  var activePushDialog = null;
  function openPushDialog(pushInfo) {
    if (activePushDialog) {
      activePushDialog.remove();
      activePushDialog = null;
    }
    if (!pushInfo)
      return;
    const overlay = document.createElement("div");
    overlay.className = "as-push-dialog-overlay";
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(2px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    const card = document.createElement("div");
    card.className = "as-push-dialog-card";
    card.style.cssText = "background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));border:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#43454a));border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,0.55);width:760px;max-width:95vw;height:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;color:var(--vscode-editor-foreground,#dfe1e5);";
    const commits = pushInfo.commits || [];
    const totalFiles = pushInfo.totalFiles || [];
    let selectedCommitHash = "ALL";
    let currentRemote = pushInfo.remote;
    let currentTargetBranch = pushInfo.remoteBranch || pushInfo.currentBranch;
    const availableRemotes = pushInfo.remotes && pushInfo.remotes.length > 0 ? pushInfo.remotes : [currentRemote];
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#323438));user-select:none;">
        <span id="push-dialog-title" style="font-weight:600;font-size:13px;color:var(--vscode-editor-foreground,#dfe1e5);">
          Push Commits to ${escapePushHtml(currentRemote)}
        </span>
        <button class="as-dialog-close-btn as-push-dot-close" title="Close" type="button" style="background:none;border:none;color:var(--vscode-icon-foreground,var(--vscode-descriptionForeground,#8c9199));width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;padding:0;outline:none;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
        </button>
      </div>
      <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
        <!-- Left Column: Branches & Commits -->
        <div style="width:44%;border-right:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#323438));display:flex;flex-direction:column;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));overflow-y:auto;">
          <div id="push-branch-header" style="display:flex;align-items:center;padding:7px 12px;background:var(--vscode-button-background,#2675bf);color:var(--vscode-button-foreground,#ffffff);font-size:12.5px;font-weight:500;cursor:pointer;user-select:none;gap:4px;overflow:hidden;position:relative;">
            <span style="font-weight:600;white-space:nowrap;">${escapePushHtml(pushInfo.currentBranch)}</span>
            <span style="opacity:0.7;margin:0 2px;">&rarr;</span>
            <div style="display:inline-flex;align-items:center;gap:2px;position:relative;">
              <span id="push-remote-label" title="Click to change remote" style="color:var(--vscode-button-foreground,#ffffff);font-weight:600;cursor:pointer;border-bottom:1px dashed rgba(255,255,255,0.6);">${escapePushHtml(currentRemote)}</span>
              <div id="push-remote-dropdown" style="display:none;position:absolute;top:22px;left:0;background:var(--vscode-dropdown-background,var(--vscode-editorWidget-background,#2b2d30));border:1px solid var(--vscode-dropdown-border,var(--vscode-widget-border,#43454a));border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.8);z-index:200;min-width:110px;padding:4px 0;"></div>
            </div>
            <span style="opacity:0.7;margin:0 2px;">:</span>
            <span id="push-target-branch-display" title="Click to edit remote branch name" style="color:var(--vscode-textLink-activeForeground,#d0e3ff);text-decoration:underline;cursor:pointer;font-weight:500;white-space:nowrap;padding:1px 4px;border-radius:3px;">${escapePushHtml(currentTargetBranch)}</span>
            <input id="push-target-branch-input" type="text" value="${escapeAttr(currentTargetBranch)}" style="display:none;background:var(--vscode-input-background,#1e1f22);color:var(--vscode-input-foreground,#ffffff);border:1.5px solid var(--vscode-focusBorder,#3574f0);border-radius:3px;padding:2px 6px;font-size:12px;font-family:inherit;outline:none;width:150px;">
            <span id="push-new-badge" style="background:rgba(255,255,255,0.22);color:#ffffff;font-size:10.5px;padding:1px 5px;border-radius:3px;margin-left:auto;white-space:nowrap;${pushInfo.isNew ? "" : "display:none;"}">New</span>
          </div>
          <div id="push-commits-container" style="flex:1;overflow-y:auto;padding:4px 0;">
          </div>
        </div>

        <!-- Right Column: Files Tree -->
        <div style="width:56%;display:flex;flex-direction:column;background:var(--vscode-editorWidget-background,var(--vscode-editor-background,#1e1f22));overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#26282b));border-bottom:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#323438));user-select:none;">
            <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--vscode-editor-foreground,#dfe1e5);">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="#c49000"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
              <span>${escapePushHtml(pushInfo.repoName)}</span>
              <span id="push-files-count" style="color:var(--vscode-descriptionForeground,#808080);font-size:11.5px;font-weight:normal;"></span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;color:var(--vscode-icon-foreground,#9aa0a6);">
              <span title="View Options" style="cursor:pointer;font-size:12px;">\u{1F441}</span>
            </div>
          </div>
          <div id="push-files-container" style="flex:1;overflow-y:auto;padding:6px 8px;">
          </div>
        </div>
      </div>

      <!-- Footer Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--vscode-sideBar-background,var(--vscode-editorWidget-background,#2b2d30));border-top:1px solid var(--vscode-widget-border,var(--vscode-panel-border,#323438));user-select:none;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:1px solid var(--vscode-widget-border,#5c6164);color:var(--vscode-descriptionForeground,#adb0b8);font-size:11.5px;cursor:pointer;" title="Help">?</span>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);cursor:pointer;">
            <input type="checkbox" id="chk-push-tags" class="as-custom-chk" style="width:14px;height:14px;cursor:pointer;">
            <span>Push tags:</span>
          </label>
          <select id="sel-push-tags" style="background:var(--vscode-dropdown-background,var(--vscode-input-background,#1e1f22));color:var(--vscode-dropdown-foreground,var(--vscode-input-foreground,#dfe1e5));border:1px solid var(--vscode-dropdown-border,var(--vscode-input-border,#4e5157));border-radius:3px;padding:3px 6px;font-size:12px;outline:none;">
            <option value="all">All</option>
            <option value="current">Current branch</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:10px;position:relative;">
          <button id="btn-push-cancel" style="background:var(--vscode-button-secondaryBackground,#2b2d30);color:var(--vscode-button-secondaryForeground,#dfe1e5);border:1px solid var(--vscode-widget-border,var(--vscode-input-border,#4e5157));border-radius:4px;padding:6px 16px;font-size:12.5px;cursor:pointer;">Cancel</button>
          <div style="display:inline-flex;border-radius:4px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
            <button id="btn-push-submit" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;padding:6px 18px;font-size:12.5px;font-weight:600;cursor:pointer;">Push</button>
            <button id="btn-push-menu-trigger" style="background:var(--vscode-button-background,#3574f0);color:var(--vscode-button-foreground,#ffffff);border:none;border-left:1px solid rgba(255,255,255,0.25);padding:6px 8px;font-size:11px;cursor:pointer;" title="Push Options">\u25BC</button>
          </div>
          <div id="push-dropdown-menu" style="display:none;position:absolute;bottom:36px;right:0;background:var(--vscode-dropdown-background,var(--vscode-editorWidget-background,#2b2d30));border:1px solid var(--vscode-dropdown-border,var(--vscode-widget-border,#43454a));border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.7);padding:4px 0;z-index:100;min-width:180px;">
            <div id="btn-force-push-opt" style="padding:6px 14px;font-size:12.5px;color:var(--vscode-editor-foreground,#dfe1e5);cursor:pointer;">Force Push (no-verify)...</div>
          </div>
        </div>
      </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    activePushDialog = overlay;
    const titleEl = card.querySelector("#push-dialog-title");
    const branchHeader = card.querySelector("#push-branch-header");
    const remoteLabel = card.querySelector("#push-remote-label");
    const remoteDropdown = card.querySelector("#push-remote-dropdown");
    const branchDisplay = card.querySelector("#push-target-branch-display");
    const branchInput = card.querySelector("#push-target-branch-input");
    const newBadge = card.querySelector("#push-new-badge");
    const commitsContainer = card.querySelector("#push-commits-container");
    const filesContainer = card.querySelector("#push-files-container");
    const filesCountEl = card.querySelector("#push-files-count");
    const btnCancel = card.querySelector("#btn-push-cancel");
    const btnSubmit = card.querySelector("#btn-push-submit");
    const btnMenuTrigger = card.querySelector("#btn-push-menu-trigger");
    const dropdownMenu = card.querySelector("#push-dropdown-menu");
    const btnForcePush = card.querySelector("#btn-force-push-opt");
    const chkTags = card.querySelector("#chk-push-tags");
    const dotClose = card.querySelector(".as-push-dot-close");
    if (availableRemotes.length > 0) {
      remoteDropdown.innerHTML = availableRemotes.map((r2) => `
        <div class="as-remote-opt" data-remote="${escapeAttr(r2)}" style="padding:5px 12px;font-size:12px;color:#dfe1e5;cursor:pointer;${r2 === currentRemote ? "background:#3574f0;color:#fff;" : ""}">${escapePushHtml(r2)}</div>
      `).join("");
      remoteDropdown.querySelectorAll(".as-remote-opt").forEach((opt) => {
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          currentRemote = opt.getAttribute("data-remote");
          remoteLabel.textContent = currentRemote;
          if (titleEl)
            titleEl.textContent = "Push Commits to " + currentRemote;
          remoteDropdown.style.display = "none";
        });
      });
    }
    remoteLabel.addEventListener("click", (e) => {
      e.stopPropagation();
      if (availableRemotes.length > 1) {
        remoteDropdown.style.display = remoteDropdown.style.display === "none" ? "block" : "none";
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#push-remote-dropdown") && e.target !== remoteLabel) {
        remoteDropdown.style.display = "none";
      }
    });
    branchDisplay.addEventListener("click", (e) => {
      e.stopPropagation();
      branchDisplay.style.display = "none";
      branchInput.style.display = "inline-block";
      branchInput.value = currentTargetBranch;
      branchInput.focus();
      branchInput.select();
    });
    function finishEditBranch() {
      const val = branchInput.value.trim();
      if (val) {
        currentTargetBranch = val;
        branchDisplay.textContent = currentTargetBranch;
        if (currentTargetBranch !== pushInfo.currentBranch || pushInfo.isNew) {
          newBadge.style.display = "inline-block";
        }
      }
      branchInput.style.display = "none";
      branchDisplay.style.display = "inline-block";
    }
    branchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        finishEditBranch();
        e.stopPropagation();
      } else if (e.key === "Escape") {
        branchInput.value = currentTargetBranch;
        branchInput.style.display = "none";
        branchDisplay.style.display = "inline-block";
        e.stopPropagation();
      }
    });
    branchInput.addEventListener("blur", () => {
      finishEditBranch();
    });
    function renderCommits() {
      if (commits.length === 0) {
        commitsContainer.innerHTML = '<div style="padding:16px 12px;color:#808080;font-size:12px;">No unpushed commits on this branch.</div>';
        return;
      }
      let html2 = "";
      commits.forEach((c) => {
        const isSel = selectedCommitHash === c.hash;
        const bg = isSel ? "#2d4b73" : "transparent";
        const textColor = isSel ? "#ffffff" : "#dfe1e5";
        html2 += `
          <div class="as-push-commit-item" data-hash="${escapePushHtml(c.hash)}" style="display:flex;align-items:center;padding:5px 12px 5px 22px;background:${bg};color:${textColor};font-size:12.5px;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            <span style="overflow:hidden;text-overflow:ellipsis;" title="${escapePushHtml(c.message)}">${escapePushHtml(c.message)}</span>
          </div>
        `;
      });
      commitsContainer.innerHTML = html2;
      commitsContainer.querySelectorAll(".as-push-commit-item").forEach((el) => {
        el.addEventListener("click", () => {
          selectedCommitHash = el.getAttribute("data-hash");
          branchHeader.style.background = "#203248";
          renderCommits();
          renderFiles();
        });
      });
    }
    function renderFiles() {
      let currentFiles = [];
      if (selectedCommitHash === "ALL") {
        currentFiles = totalFiles;
      } else {
        const c = commits.find((x) => x.hash === selectedCommitHash);
        currentFiles = c ? c.files : [];
      }
      filesCountEl.textContent = `${currentFiles.length} files`;
      if (currentFiles.length === 0) {
        filesContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#808080;font-size:12px;">No files changed.</div>';
        return;
      }
      const groups = /* @__PURE__ */ new Map();
      currentFiles.forEach((f) => {
        const d = f.dir || "";
        if (!groups.has(d))
          groups.set(d, []);
        groups.get(d).push(f);
      });
      let html2 = "";
      for (const [dir, fList] of groups.entries()) {
        html2 += `
          <div style="display:flex;align-items:center;gap:6px;padding:3px 6px;color:#9aa0a6;font-size:11.5px;cursor:pointer;font-weight:500;">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.92 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/></svg>
            <span style="color:#dfe1e5;">${escapePushHtml(dir || "root")}</span>
            <span style="color:#808080;font-size:11px;">${fList.length} file${fList.length > 1 ? "s" : ""}</span>
          </div>
        `;
        fList.forEach((file) => {
          let statusBadge = "";
          if (file.status === "M") {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #499c54;border-radius:2px;font-size:9.5px;color:#499c54;font-weight:bold;margin-right:2px;">M</span>';
          } else if (file.status === "A") {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #62b543;border-radius:2px;font-size:9.5px;color:#62b543;font-weight:bold;margin-right:2px;">A</span>';
          } else if (file.status === "D") {
            statusBadge = '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #e05555;border-radius:2px;font-size:9.5px;color:#e05555;font-weight:bold;margin-right:2px;">D</span>';
          }
          html2 += `
            <div class="as-push-file-item" data-path="${escapePushHtml(file.path)}" style="display:flex;align-items:center;gap:6px;padding:3px 8px 3px 26px;font-size:12.5px;color:#dfe1e5;cursor:pointer;user-select:none;">
              ${statusBadge}
              ${getPushFileIcon(file.name)}
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapePushHtml(file.name)}</span>
            </div>
          `;
        });
      }
      filesContainer.innerHTML = html2;
      filesContainer.querySelectorAll(".as-push-file-item").forEach((el) => {
        el.addEventListener("dblclick", () => {
          const filePath = el.getAttribute("data-path");
          if (filePath) {
            postMessage("openReviewInCenter", { filePath, jumpDiff: true, fromFileList: true });
          }
        });
      });
    }
    branchHeader.addEventListener("click", (e) => {
      if (e.target.closest("#push-remote-label") || e.target.closest("#push-remote-dropdown") || e.target.closest("#push-target-branch-display") || e.target.closest("#push-target-branch-input")) {
        return;
      }
      selectedCommitHash = "ALL";
      branchHeader.style.background = "#2675bf";
      renderCommits();
      renderFiles();
    });
    function close() {
      overlay.remove();
      activePushDialog = null;
    }
    function doPush(force) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Pushing...";
      btnSubmit.style.opacity = "0.7";
      showToast("Pushing '" + (pushInfo.currentBranch || "branch") + "'...");
      postMessage("executePush", {
        branch: pushInfo.currentBranch,
        targetBranch: currentTargetBranch,
        force: !!force,
        setUpstream: pushInfo.isNew || currentTargetBranch !== pushInfo.currentBranch,
        remote: currentRemote,
        tags: chkTags.checked
      });
    }
    btnSubmit.addEventListener("click", () => doPush(false));
    btnCancel.addEventListener("click", close);
    if (dotClose) {
      dotClose.addEventListener("click", close);
      dotClose.onmouseenter = () => {
        dotClose.style.background = "var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2))";
        dotClose.style.color = "var(--vscode-editor-foreground, #dfe1e5)";
      };
      dotClose.onmouseleave = () => {
        dotClose.style.background = "none";
        dotClose.style.color = "var(--vscode-icon-foreground, var(--vscode-descriptionForeground, #8c9199))";
      };
    }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay)
        close();
    });
    btnMenuTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === "none" ? "block" : "none";
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#push-dropdown-menu") && e.target !== btnMenuTrigger) {
        dropdownMenu.style.display = "none";
      }
    });
    btnForcePush.addEventListener("click", () => {
      dropdownMenu.style.display = "none";
      doPush(true);
    });
    renderCommits();
    renderFiles();
  }
  if (typeof window !== "undefined") {
    window.openGitAuthDialog = openGitAuthDialog;
    window.openPushDialog = openPushDialog;
  }

  // webview/graph/FilterBar.svelte
  var root = from_html(`<div class="filter-bar svelte-51df0s"></div>`);
  var $$css = {
    hash: "svelte-51df0s",
    code: ".filter-bar.svelte-51df0s {display:flex;gap:12px;padding:0 12px;background:var(--vscode-editor-background);border-bottom:1px solid var(--vscode-panel-border);align-items:center;height:34px;min-height:34px;box-sizing:border-box;font-size:12px;position:relative;z-index:100;user-select:none;}"
  };
  function FilterBar($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css);
    let activeBranch = prop($$props, "activeBranch", 3, ""), branchData = prop($$props, "branchData", 19, () => ({ branches: [], currentBranch: "" })), commits = prop($$props, "commits", 19, () => []), selectedHash = prop($$props, "selectedHash", 3, null);
    let bar;
    let updateLabelsFn;
    let curBranch = "";
    onMount(() => {
      let curQuery = "";
      curBranch = activeBranch() || "";
      let curUser = "";
      let curDate = "";
      let curAfter = "";
      let curBefore = "";
      let curPath = "";
      let isRegex = false;
      let isCase = false;
      let sortMode = "date";
      let isFirstParent = false;
      let isNoMerges = false;
      let viewCompactRefs = true;
      let viewTagNames = false;
      let viewLongEdges = false;
      let viewCommitTimestamp = false;
      let viewRefsOnLeft = false;
      let colAuthor = true;
      let colHash = false;
      let colDate = true;
      let colGpg = false;
      let hlMyCommits = true;
      let hlMergeCommits = true;
      let hlCurrentBranch = true;
      let hlNotCherryPicked = false;
      try {
        if (localStorage.getItem("intellij_git_hl_my_commits") !== null) {
          hlMyCommits = localStorage.getItem("intellij_git_hl_my_commits") === "true";
        }
        if (localStorage.getItem("intellij_git_hl_merge_commits") !== null) {
          hlMergeCommits = localStorage.getItem("intellij_git_hl_merge_commits") === "true";
        }
        if (localStorage.getItem("intellij_git_hl_current_branch") !== null) {
          hlCurrentBranch = localStorage.getItem("intellij_git_hl_current_branch") === "true";
        }
      } catch {
      }
      let graphOptionPopup = null;
      let viewOptionPopup = null;
      let tooltipEl = document.querySelector(".app-tooltip");
      if (!tooltipEl && typeof document !== "undefined") {
        tooltipEl = document.createElement("div");
        tooltipEl.className = "app-tooltip";
        document.body.appendChild(tooltipEl);
      }
      function attachTooltip(el, text2, shortcut = "", side = "bottom") {
        if (!el)
          return;
        el.dataset.tooltip = text2;
        if (shortcut)
          el.dataset.shortcut = shortcut;
        el.title = text2 + (shortcut ? " (" + shortcut + ")" : "");
        let timer;
        el.addEventListener("mouseenter", () => {
          const currentText = el.dataset.tooltip || el.title;
          const currentShortcut = el.dataset.shortcut || "";
          if (!currentText)
            return;
          timer = setTimeout(
            () => {
              if (!tooltipEl) {
                tooltipEl = document.querySelector(".app-tooltip");
                if (!tooltipEl) {
                  tooltipEl = document.createElement("div");
                  tooltipEl.className = "app-tooltip";
                  document.body.appendChild(tooltipEl);
                }
              }
              tooltipEl.innerHTML = currentText + (currentShortcut ? '<span class="tooltip-shortcut">' + currentShortcut + "</span>" : "");
              tooltipEl.style.visibility = "hidden";
              tooltipEl.style.display = "block";
              tooltipEl.style.left = "-9999px";
              tooltipEl.style.top = "-9999px";
              tooltipEl.style.transform = "none";
              tooltipEl.classList.add("visible");
              const tipWidth = tooltipEl.offsetWidth || 100;
              const tipHeight = tooltipEl.offsetHeight || 24;
              const rect = el.getBoundingClientRect();
              const pad = 6;
              const viewWidth = window.innerWidth || document.documentElement.clientWidth;
              const viewHeight = window.innerHeight || document.documentElement.clientHeight;
              let tipLeft;
              let tipTop;
              if (side === "bottom") {
                tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
                tipTop = rect.bottom + 6;
                if (tipTop + tipHeight > viewHeight - pad && rect.top - tipHeight - 6 >= pad) {
                  tipTop = rect.top - tipHeight - 6;
                  tooltipEl.classList.remove("side-bottom");
                  tooltipEl.classList.add("side-top");
                } else {
                  tooltipEl.classList.remove("side-top");
                  tooltipEl.classList.add("side-bottom");
                }
              } else if (side === "right") {
                tipLeft = rect.right + 7;
                tipTop = rect.top + rect.height / 2 - tipHeight / 2;
                if (tipLeft + tipWidth > viewWidth - pad && rect.left - tipWidth - 7 >= pad) {
                  tipLeft = rect.left - tipWidth - 7;
                  tooltipEl.classList.remove("side-right");
                  tooltipEl.classList.add("side-left");
                } else {
                  tooltipEl.classList.remove("side-left");
                  tooltipEl.classList.add("side-right");
                }
              } else {
                tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
                tipTop = rect.bottom + 6;
              }
              if (tipLeft < pad) {
                tipLeft = pad;
              } else if (tipLeft + tipWidth > viewWidth - pad) {
                tipLeft = Math.max(pad, viewWidth - tipWidth - pad);
              }
              if (tipTop < pad) {
                tipTop = pad;
              } else if (tipTop + tipHeight > viewHeight - pad) {
                tipTop = Math.max(pad, viewHeight - tipHeight - pad);
              }
              tooltipEl.style.left = Math.round(tipLeft) + "px";
              tooltipEl.style.top = Math.round(tipTop) + "px";
              tooltipEl.style.transform = "none";
              tooltipEl.style.visibility = "visible";
            },
            90
          );
        });
        el.addEventListener("mouseleave", () => {
          clearTimeout(timer);
          if (tooltipEl)
            tooltipEl.classList.remove("visible");
        });
        el.addEventListener("click", () => {
          clearTimeout(timer);
          if (tooltipEl)
            tooltipEl.classList.remove("visible");
        });
      }
      function applyViewOptions() {
        if (typeof document !== "undefined" && document.body) {
          document.body.classList.toggle("hide-col-author", !colAuthor);
          document.body.classList.toggle("hide-col-date", !colDate);
          document.body.classList.toggle("show-col-hash", colHash);
          document.body.classList.toggle("compact-refs", viewCompactRefs);
          document.body.classList.toggle("refs-on-left", viewRefsOnLeft);
          document.body.classList.toggle("hl-my-commits", hlMyCommits);
          document.body.classList.toggle("hl-merge-commits", hlMergeCommits);
          document.body.classList.toggle("hl-current-branch", hlCurrentBranch);
        }
      }
      applyViewOptions();
      function applyFilter() {
        $$props.onFilter({
          query: curQuery || void 0,
          branch: curBranch || void 0,
          author: curUser || void 0,
          after: curAfter || void 0,
          before: curBefore || void 0,
          path: curPath || void 0,
          order: sortMode,
          firstParent: isFirstParent,
          noMerges: isNoMerges
        });
        updateLabels();
      }
      function createMenuItem(label, isChecked, onClick, hasSubmenu = false) {
        const item = document.createElement("div");
        item.className = "as-menu-item" + (hasSubmenu ? " has-submenu" : "");
        const checkSpan = document.createElement("span");
        checkSpan.className = "as-menu-check";
        if (isChecked) {
          checkSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>';
        }
        item.appendChild(checkSpan);
        const labelSpan = document.createElement("span");
        labelSpan.className = "as-menu-label";
        labelSpan.textContent = label;
        item.appendChild(labelSpan);
        if (hasSubmenu) {
          const arrowSpan = document.createElement("span");
          arrowSpan.className = "as-menu-arrow";
          arrowSpan.innerHTML = "\u203A";
          item.appendChild(arrowSpan);
        }
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          onClick(e);
        });
        return item;
      }
      function createSectionHeader(title) {
        const hdr = document.createElement("div");
        hdr.className = "as-menu-section-header";
        hdr.textContent = title;
        return hdr;
      }
      function createDivider() {
        const d = document.createElement("div");
        d.className = "as-menu-divider";
        return d;
      }
      const searchBox = document.createElement("div");
      searchBox.className = "as-search-box";
      searchBox.innerHTML = '<span class="as-search-icon" title="Search commits"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14.5" y2="14.5"/></svg></span>';
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.className = "as-search-input";
      searchInput.placeholder = "Text or hash";
      let searchDebounceTimer;
      searchInput.addEventListener("input", () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(
          () => {
            const val = searchInput.value.trim();
            if (val !== curQuery) {
              curQuery = val;
              applyFilter();
            }
          },
          300
        );
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
        if (graphOptionPopup)
          graphOptionPopup.style.display = "none";
        if (viewOptionPopup)
          viewOptionPopup.style.display = "none";
      }
      document.addEventListener("click", (e) => {
        if (!bar.contains(e.target)) {
          closeAllPopups();
        }
      });
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
        const bData = branchData() || { branches: [], currentBranch: "" };
        const branches = bData.branches || [];
        const allItem = document.createElement("div");
        allItem.className = "filter-popup-item" + (!curBranch ? " selected" : "");
        allItem.textContent = "All Branches";
        allItem.addEventListener("click", () => {
          curBranch = "";
          if ($$props.setActiveBranch)
            $$props.setActiveBranch("");
          closeAllPopups();
          applyFilter();
        });
        branchItemsContainer.appendChild(allItem);
        if (bData.currentBranch && (!search || bData.currentBranch.toLowerCase().includes(search))) {
          const headItem = document.createElement("div");
          headItem.className = "filter-popup-item" + (curBranch === "HEAD" ? " selected" : "");
          headItem.innerHTML = "<span>HEAD (" + bData.currentBranch + ")</span>";
          headItem.addEventListener("click", () => {
            curBranch = "HEAD";
            if ($$props.setActiveBranch)
              $$props.setActiveBranch("HEAD");
            closeAllPopups();
            applyFilter();
          });
          branchItemsContainer.appendChild(headItem);
        }
        const localList = branches.filter((b) => !b.remote && (!search || b.name.toLowerCase().includes(search)));
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
              if ($$props.setActiveBranch)
                $$props.setActiveBranch(b.name);
              closeAllPopups();
              applyFilter();
            });
            branchItemsContainer.appendChild(item);
          }
        }
        const remoteList = branches.filter((b) => b.remote && (!search || b.name.toLowerCase().includes(search)));
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
              if ($$props.setActiveBranch)
                $$props.setActiveBranch(b.name);
              closeAllPopups();
              applyFilter();
            });
            branchItemsContainer.appendChild(item);
          }
        }
      }
      branchLabel.addEventListener("click", (e) => {
        e.stopPropagation();
        if (branchPopup && !branchContainer.contains(branchPopup)) {
          branchContainer.appendChild(branchPopup);
        }
        const open = branchPopup.style.display === "flex";
        closeAllPopups();
        if (!open) {
          renderBranchItems();
          branchPopup.style.display = "flex";
          setTimeout(() => branchSearchInput.focus(), 20);
        }
      });
      bar.appendChild(branchContainer);
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
        const commitsList = commits() || [];
        const authorCounts = {};
        for (const c of commitsList) {
          if (c.author)
            authorCounts[c.author] = (authorCounts[c.author] || 0) + 1;
        }
        const authorNames = Object.keys(authorCounts).sort();
        const filtered = authorNames.filter((name) => !search || name.toLowerCase().includes(search));
        if (filtered.length > 0) {
          const hdr = document.createElement("div");
          hdr.className = "filter-popup-header";
          hdr.textContent = "Authors in repo";
          userItemsContainer.appendChild(hdr);
          for (const name of filtered) {
            const item = document.createElement("div");
            item.className = "filter-popup-item" + (curUser === name ? " selected" : "");
            item.innerHTML = "<span>" + name + '</span> <span style="opacity:0.6;font-size:11px;">(' + authorCounts[name] + ")</span>";
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
        if (userPopup && !userContainer.contains(userPopup)) {
          userContainer.appendChild(userPopup);
        }
        const open = userPopup.style.display === "flex";
        closeAllPopups();
        if (!open) {
          renderUserItems();
          userPopup.style.display = "flex";
          setTimeout(() => userSearchInput.focus(), 20);
        }
      });
      bar.appendChild(userContainer);
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
            const now = /* @__PURE__ */ new Date();
            now.setHours(0, 0, 0, 0);
            curAfter = now.toISOString();
            curBefore = "";
          } else if (opt.key === "yesterday") {
            curDate = "Yesterday";
            const now = /* @__PURE__ */ new Date();
            now.setHours(0, 0, 0, 0);
            const y = new Date(now.getTime() - 864e5);
            curAfter = y.toISOString();
            curBefore = now.toISOString();
          } else if (opt.key === "7days") {
            curDate = "Last 7 Days";
            curAfter = new Date(Date.now() - 7 * 864e5).toISOString();
            curBefore = "";
          } else if (opt.key === "30days") {
            curDate = "Last 30 Days";
            curAfter = new Date(Date.now() - 30 * 864e5).toISOString();
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
        if (datePopup && !dateContainer.contains(datePopup)) {
          dateContainer.appendChild(datePopup);
        }
        const open = datePopup.style.display === "flex";
        closeAllPopups();
        if (!open) {
          datePopup.style.display = "flex";
        }
      });
      bar.appendChild(dateContainer);
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
        if (pathPopup && !pathContainer.contains(pathPopup)) {
          pathContainer.appendChild(pathPopup);
        }
        const open = pathPopup.style.display === "flex";
        closeAllPopups();
        if (!open) {
          pathPopup.style.display = "flex";
          setTimeout(() => pathInput.focus(), 20);
        }
      });
      bar.appendChild(pathContainer);
      const graphOptionContainer = document.createElement("div");
      graphOptionContainer.style.position = "relative";
      const graphOptionBtn = document.createElement("div");
      graphOptionBtn.className = "as-filter-label as-tool-icon";
      graphOptionBtn.title = "Graph Options";
      graphOptionBtn.style.padding = "2px 4px";
      graphOptionBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <line x1="4.5" y1="2.5" x2="4.5" y2="13.5"/>
        <polyline points="2.5,10.5 4.5,13.5 6.5,10.5"/>
        <line x1="11.5" y1="2.5" x2="11.5" y2="13.5"/>
        <polygon points="11.5,3.5 13.5,5.5 11.5,7.5 9.5,5.5" fill="var(--vscode-editor-background, #1e1f22)" stroke="currentColor" stroke-width="1.2"/>
        <polygon points="11.5,8.5 13.5,10.5 11.5,12.5 9.5,10.5" fill="var(--vscode-editor-background, #1e1f22)" stroke="currentColor" stroke-width="1.2"/>
        <polygon points="12,15 15,15 15,12" fill="currentColor" stroke="none"/>
      </svg>
    `;
      graphOptionContainer.appendChild(graphOptionBtn);
      graphOptionPopup = document.createElement("div");
      graphOptionPopup.className = "as-dropdown-menu";
      graphOptionPopup.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
      graphOptionContainer.appendChild(graphOptionPopup);
      function renderGraphOptionMenu() {
        graphOptionPopup.innerHTML = "";
        graphOptionPopup.appendChild(createSectionHeader("Sort"));
        graphOptionPopup.appendChild(createMenuItem("By Commit Date", sortMode === "date", () => {
          sortMode = "date";
          renderGraphOptionMenu();
          applyFilter();
        }));
        graphOptionPopup.appendChild(createMenuItem("Topologically", sortMode === "topo", () => {
          sortMode = "topo";
          renderGraphOptionMenu();
          applyFilter();
        }));
        graphOptionPopup.appendChild(createDivider());
        graphOptionPopup.appendChild(createSectionHeader("Options"));
        graphOptionPopup.appendChild(createMenuItem("First Parent", isFirstParent, () => {
          isFirstParent = !isFirstParent;
          renderGraphOptionMenu();
          applyFilter();
        }));
        graphOptionPopup.appendChild(createMenuItem("No Merges", isNoMerges, () => {
          isNoMerges = !isNoMerges;
          renderGraphOptionMenu();
          applyFilter();
        }));
        graphOptionPopup.appendChild(createDivider());
        graphOptionPopup.appendChild(createSectionHeader("Branch Actions"));
        graphOptionPopup.appendChild(createMenuItem("Collapse Linear Branches", false, () => {
          closeAllPopups();
          postMessage("collapseLinearBranches");
          showToast("Collapsed linear branches");
        }));
        graphOptionPopup.appendChild(createMenuItem("Expand Linear Branches", false, () => {
          closeAllPopups();
          postMessage("expandLinearBranches");
          showToast("Expanded linear branches");
        }));
      }
      graphOptionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (graphOptionPopup && !graphOptionContainer.contains(graphOptionPopup)) {
          graphOptionContainer.appendChild(graphOptionPopup);
        }
        const open = graphOptionPopup.style.display === "flex";
        closeAllPopups();
        if (!open) {
          renderGraphOptionMenu();
          graphOptionPopup.style.display = "flex";
        }
      });
      bar.appendChild(graphOptionContainer);
      const tbRight = document.createElement("div");
      tbRight.className = "as-toolbar-right";
      const btnRefresh = document.createElement("span");
      btnRefresh.className = "as-tool-icon";
      btnRefresh.title = "Refresh";
      btnRefresh.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" style="display:block;">
        <path fill-rule="evenodd" d="M12.5747152,11.8852806 C11.4741474,13.1817355 9.83247882,14.0044386 7.99865879,14.0044386 C5.03907292,14.0044386 2.57997332,11.8615894 2.08820756,9.0427473 L3.94774327,9.10768372 C4.43372186,10.8898575 6.06393114,12.2000519 8.00015362,12.2000519 C9.30149237,12.2000519 10.4645985,11.6082097 11.2349873,10.6790094 L9.05000019,8.71167959 L14.0431479,8.44999981 L14.3048222,13.4430431 L12.5747152,11.8852806 Z M3.42785637,4.11741586 C4.52839138,2.82452748 6.16775464,2.00443857 7.99865879,2.00443857 C10.918604,2.00443857 13.3513802,4.09026967 13.8882946,6.8532307 L12.0226389,6.78808057 C11.5024872,5.05935553 9.89838095,3.8000774 8.00015362,3.8000774 C6.69867367,3.8000774 5.53545628,4.39204806 4.76506921,5.32142241 L6.95482203,7.29304326 L1.96167436,7.55472304 L1.70000005,2.56167973 L3.42785637,4.11741586 Z" transform="rotate(3 8.002 8.004)"/>
      </svg>
    `;
      btnRefresh.addEventListener("click", () => {
        postMessage("refresh");
      });
      tbRight.appendChild(btnRefresh);
      const btnCherry = document.createElement("span");
      btnCherry.className = "as-tool-icon";
      btnCherry.title = "Cherry-Pick Commit";
      btnCherry.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.5 11C6.5 12.1046 5.60457 13 4.5 13C3.39543 13 2.5 12.1046 2.5 11C2.5 9.89543 3.39543 9 4.5 9C5.60457 9 6.5 9.89543 6.5 11ZM4.5 14C6.15685 14 7.5 12.6569 7.5 11C7.5 9.34315 6.15685 8 4.5 8C2.84315 8 1.5 9.34315 1.5 11C1.5 12.6569 2.84315 14 4.5 14ZM13.5 11C13.5 12.1046 12.6046 13 11.5 13C10.3954 13 9.5 12.1046 9.5 11C9.5 9.89543 10.3954 9 11.5 9C12.6046 9 13.5 9.89543 13.5 11ZM11.5 14C13.1569 14 14.5 12.6569 14.5 11C14.5 9.34315 13.1569 8 11.5 8C9.84315 8 8.5 9.34315 8.5 11C8.5 12.6569 9.84315 14 11.5 14Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.8537 1.14647C11.7934 1.08617 11.7216 1.04449 11.6453 1.02143C11.5869 1.00372 11.5244 0.996452 11.46 1.00164L11.4585 1.00175L11.4577 1.00183C8.89299 1.21581 7.10682 2.51359 5.92996 4.03112C4.76214 5.53699 4.18349 7.26955 4.00588 8.424C3.9639 8.69693 4.15111 8.95222 4.42404 8.99421C4.69697 9.0362 4.95227 8.84899 4.99426 8.57606C5.14998 7.56384 5.67133 5.9964 6.72018 4.64394C7.43375 3.72381 8.38624 2.9082 9.6361 2.42686L10.8329 1.87283L10.1507 2.48553C9.63716 3.45813 9.48624 4.482 9.53842 5.42758C9.61459 6.8079 10.1221 8.0385 10.5761 8.76503C10.7225 8.9992 11.031 9.07038 11.2651 8.92403C11.4993 8.77767 11.5705 8.4692 11.4241 8.23503C11.0449 7.62822 10.6024 6.55883 10.5369 5.37248C10.4723 4.20114 10.7737 2.93361 11.8537 1.85358C12.049 1.65832 12.049 1.34174 11.8537 1.14647Z" fill="currentColor"/>
      </svg>
    `;
      btnCherry.addEventListener("click", () => {
        const selHash = selectedHash();
        if (selHash) {
          postMessage("cherryPick", { hash: selHash });
        } else {
          showToast("Select a commit from the log to cherry-pick");
        }
      });
      tbRight.appendChild(btnCherry);
      const viewOptionContainer = document.createElement("div");
      viewOptionContainer.style.position = "relative";
      viewOptionContainer.style.display = "inline-flex";
      const btnViewOption = document.createElement("span");
      btnViewOption.className = "as-tool-icon";
      btnViewOption.title = "View Options";
      btnViewOption.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <path d="M1.5 8C3 4.5 7 2.8 8 2.8C9 2.8 13 4.5 14.5 8C13 11.5 9 13.2 8 13.2C7 13.2 3 11.5 1.5 8Z"/>
        <circle cx="8" cy="8" r="2.2"/>
        <polygon points="12,15 15,15 15,12" fill="currentColor" stroke="none"/>
      </svg>
    `;
      viewOptionContainer.appendChild(btnViewOption);
      viewOptionPopup = document.createElement("div");
      viewOptionPopup.className = "as-dropdown-menu";
      viewOptionPopup.style.right = "0";
      viewOptionPopup.style.left = "auto";
      viewOptionPopup.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
      viewOptionContainer.appendChild(viewOptionPopup);
      function renderViewOptionMenu() {
        viewOptionPopup.innerHTML = "";
        viewOptionPopup.appendChild(createSectionHeader("Show"));
        viewOptionPopup.appendChild(createMenuItem("Compact References View", viewCompactRefs, () => {
          viewCompactRefs = !viewCompactRefs;
          applyViewOptions();
          renderViewOptionMenu();
        }));
        viewOptionPopup.appendChild(createMenuItem("Tag Names", viewTagNames, () => {
          viewTagNames = !viewTagNames;
          applyViewOptions();
          renderViewOptionMenu();
        }));
        viewOptionPopup.appendChild(createMenuItem("Long Edges", viewLongEdges, () => {
          viewLongEdges = !viewLongEdges;
          applyViewOptions();
          renderViewOptionMenu();
        }));
        viewOptionPopup.appendChild(createMenuItem("Commit Timestamp", viewCommitTimestamp, () => {
          viewCommitTimestamp = !viewCommitTimestamp;
          applyViewOptions();
          renderViewOptionMenu();
        }));
        viewOptionPopup.appendChild(createMenuItem("References on the Left", viewRefsOnLeft, () => {
          viewRefsOnLeft = !viewRefsOnLeft;
          applyViewOptions();
          renderViewOptionMenu();
        }));
        const columnsItem = createMenuItem(
          "Columns",
          false,
          (ev) => {
          },
          true
        );
        const subMenu = document.createElement("div");
        subMenu.className = "as-dropdown-menu as-submenu";
        subMenu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
        function renderColumnsSubMenu() {
          subMenu.innerHTML = "";
          subMenu.appendChild(createMenuItem("Author", colAuthor, () => {
            colAuthor = !colAuthor;
            applyViewOptions();
            renderColumnsSubMenu();
          }));
          subMenu.appendChild(createMenuItem("Hash", colHash, () => {
            colHash = !colHash;
            applyViewOptions();
            renderColumnsSubMenu();
          }));
          subMenu.appendChild(createMenuItem("Date", colDate, () => {
            colDate = !colDate;
            applyViewOptions();
            renderColumnsSubMenu();
          }));
          subMenu.appendChild(createMenuItem("GPG Signature", colGpg, () => {
            colGpg = !colGpg;
            applyViewOptions();
            renderColumnsSubMenu();
          }));
        }
        renderColumnsSubMenu();
        columnsItem.addEventListener("mouseenter", () => {
          const rect = columnsItem.getBoundingClientRect();
          if (rect.right + 150 > window.innerWidth) {
            subMenu.style.left = "auto";
            subMenu.style.right = "100%";
            subMenu.style.marginLeft = "0";
            subMenu.style.marginRight = "2px";
          } else {
            subMenu.style.left = "100%";
            subMenu.style.right = "auto";
            subMenu.style.marginLeft = "2px";
            subMenu.style.marginRight = "0";
          }
        });
        columnsItem.appendChild(subMenu);
        viewOptionPopup.appendChild(columnsItem);
        viewOptionPopup.appendChild(createDivider());
        viewOptionPopup.appendChild(createSectionHeader("Highlight"));
        viewOptionPopup.appendChild(createMenuItem("My Commits", hlMyCommits, () => {
          hlMyCommits = !hlMyCommits;
          try {
            localStorage.setItem("intellij_git_hl_my_commits", hlMyCommits ? "true" : "false");
          } catch {
          }
          applyViewOptions();
          renderViewOptionMenu();
        }));
        viewOptionPopup.appendChild(createMenuItem("Merge Commits", hlMergeCommits, () => {
          hlMergeCommits = !hlMergeCommits;
          try {
            localStorage.setItem("intellij_git_hl_merge_commits", hlMergeCommits ? "true" : "false");
          } catch {
          }
          applyViewOptions();
          renderViewOptionMenu();
        }));
        viewOptionPopup.appendChild(createMenuItem("Current Branch", hlCurrentBranch, () => {
          hlCurrentBranch = !hlCurrentBranch;
          try {
            localStorage.setItem("intellij_git_hl_current_branch", hlCurrentBranch ? "true" : "false");
          } catch {
          }
          applyViewOptions();
          renderViewOptionMenu();
        }));
        viewOptionPopup.appendChild(createMenuItem("Not Cherry-Picked Commits", hlNotCherryPicked, () => {
          hlNotCherryPicked = !hlNotCherryPicked;
          applyViewOptions();
          renderViewOptionMenu();
        }));
      }
      btnViewOption.addEventListener("click", (e) => {
        e.stopPropagation();
        if (viewOptionPopup && !viewOptionContainer.contains(viewOptionPopup)) {
          viewOptionContainer.appendChild(viewOptionPopup);
        }
        const open = viewOptionPopup.style.display === "flex";
        closeAllPopups();
        if (!open) {
          renderViewOptionMenu();
          viewOptionPopup.style.display = "flex";
        }
      });
      tbRight.appendChild(viewOptionContainer);
      const btnSearch = document.createElement("span");
      btnSearch.className = "as-tool-icon";
      btnSearch.title = "Search Commits (/)";
      btnSearch.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <circle cx="6.5" cy="6.5" r="4.5"/>
        <line x1="10" y1="10" x2="14.5" y2="14.5"/>
      </svg>
    `;
      btnSearch.addEventListener("click", () => {
        searchInput.focus();
        searchInput.select();
      });
      tbRight.appendChild(btnSearch);
      bar.appendChild(tbRight);
      attachTooltip(btnRefresh, "Refresh", "Cmd+R", "bottom");
      attachTooltip(btnCherry, "Cherry-Pick Commit", "", "bottom");
      attachTooltip(btnViewOption, "View Options", "", "bottom");
      attachTooltip(btnSearch, "Search Commits", "/", "bottom");
      attachTooltip(graphOptionBtn, "Graph Options", "", "bottom");
      attachTooltip(regexBtn, "Regex", "", "bottom");
      attachTooltip(caseBtn, "Match Case", "", "bottom");
      const asSearchIcon = searchBox.querySelector(".as-search-icon");
      if (asSearchIcon)
        attachTooltip(asSearchIcon, "Search commits by text or hash", "", "bottom");
      attachTooltip(branchLabel, "Filter by Branch", "", "bottom");
      attachTooltip(userLabel, "Filter by User", "", "bottom");
      attachTooltip(dateLabel, "Filter by Date", "", "bottom");
      attachTooltip(pathLabel, "Filter by Structure / Path", "", "bottom");
      updateLabelsFn = function updateLabels2() {
        if (curBranch) {
          branchLabel.className = "as-filter-label active";
          branchLabel.innerHTML = '<span class="lbl-prefix">Branch:</span> <span class="lbl-val">' + curBranch + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
          branchLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
            e.stopPropagation();
            curBranch = "";
            if ($$props.setActiveBranch)
              $$props.setActiveBranch("");
            applyFilter();
          });
        } else {
          branchLabel.className = "as-filter-label";
          branchLabel.innerHTML = '<span class="lbl-prefix">Branch</span> <span class="lbl-arrow">&#9662;</span>';
        }
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
        if (curPath) {
          pathLabel.className = "as-filter-label active";
          pathLabel.innerHTML = '<span class="lbl-prefix">Paths:</span> <span class="lbl-val">' + curPath + '</span> <span class="lbl-clear" title="Clear">&times;</span>';
          pathLabel.querySelector(".lbl-clear").addEventListener("click", (e) => {
            e.stopPropagation();
            curPath = "";
            applyFilter();
          });
        } else {
          pathLabel.className = "as-filter-label";
          pathLabel.innerHTML = '<span class="lbl-prefix">Paths</span> <span class="lbl-arrow">&#9662;</span>';
        }
      };
      updateLabels();
    });
    user_effect(() => {
      const extBranch = activeBranch();
      if (extBranch !== void 0 && extBranch !== curBranch) {
        curBranch = extBranch || "";
        if (updateLabelsFn)
          updateLabelsFn();
      }
    });
    var div = root();
    bind_this(div, ($$value) => bar = $$value, () => bar);
    append($$anchor, div);
    pop();
  }

  // webview/shared/theme.ts
  var GRAPH_COLORS = [
    "#a6823c",
    // Android Studio gold/ocher
    "#399478",
    // Android Studio teal
    "#4a67a8",
    // Android Studio indigo/blue
    "#4e8e52",
    // Android Studio green
    "#7d57a6",
    // Android Studio purple
    "#b36939",
    // Android Studio amber/brown
    "#327e99",
    // Android Studio cerulean/cyan
    "#9c4949",
    // Android Studio muted red
    "#857930",
    // Android Studio olive
    "#4f728c"
    // Android Studio slate
  ];
  function branchColor(index2) {
    return GRAPH_COLORS[index2 % GRAPH_COLORS.length];
  }

  // webview/graph/CommitGraph.svelte
  var root2 = from_svg(`<line stroke-width="1.8" stroke-linecap="round"></line>`);
  var root_1 = from_svg(`<path fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>`);
  var root_2 = from_svg(`<circle r="6.5" fill="none" stroke-width="1.5"></circle>`);
  var root_3 = from_svg(`<!><circle stroke="var(--vscode-editor-background)" stroke-width="1.5"></circle>`, 1);
  var root_4 = from_svg(`<svg class="graph-svg svelte-154okp0"><!><!></svg>`);
  var $$css2 = {
    hash: "svelte-154okp0",
    code: ".graph-svg.svelte-154okp0 {flex-shrink:0;}"
  };
  function CommitGraph($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css2);
    let nodes = prop($$props, "nodes", 19, () => []), startIndex = prop($$props, "startIndex", 3, 0), visibleCount = prop($$props, "visibleCount", 3, 0), rowHeight = prop($$props, "rowHeight", 3, 28), graphWidth = prop($$props, "graphWidth", 3, 1);
    const COL_WIDTH = 16;
    const DOT_RADIUS = 3.8;
    const PADDING = 10;
    function computeAngularPath(x1, y1, x2, y2) {
      if (x1 === void 0 || y1 === void 0 || x2 === void 0 || y2 === void 0)
        return "";
      const dx = x2 - x1;
      if (Math.abs(dx) < 0.5) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      }
      const midY = (y1 + y2) / 2;
      return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    }
    let svgWidth = user_derived(() => Math.max(4, graphWidth() || 1) * COL_WIDTH + PADDING * 2);
    let svgHeight = user_derived(() => visibleCount() * rowHeight());
    function cx(col) {
      return PADDING + col * COL_WIDTH + COL_WIDTH / 2;
    }
    function cy(row) {
      return (row - startIndex()) * rowHeight() + rowHeight() / 2;
    }
    let visibleLines = user_derived(() => {
      const result = [];
      const endIndex = startIndex() + visibleCount() + 1;
      for (let i = Math.max(0, startIndex() - 1); i < Math.min(nodes().length, endIndex + 1); i++) {
        const node = nodes()[i];
        if (!node || !node.lines)
          continue;
        for (const line of node.lines) {
          result.push({ line, color: branchColor(line.color) });
        }
      }
      return result;
    });
    let visibleDots = user_derived(() => {
      const endIndex = startIndex() + visibleCount();
      const result = [];
      for (let i = startIndex(); i < Math.min(nodes().length, endIndex); i++) {
        const node = nodes()[i];
        if (!node)
          continue;
        result.push({
          x: cx(node.column),
          y: cy(i),
          color: branchColor(node.color),
          hash: node.hash,
          isHead: i === 0
        });
      }
      return result;
    });
    var svg = root_4();
    var node_1 = child(svg);
    each(node_1, 17, () => get(visibleLines), index, ($$anchor2, item) => {
      var fragment = comment();
      var node_2 = first_child(fragment);
      {
        var consequent = ($$anchor3) => {
          var line_1 = root2();
          template_effect(
            ($0, $1, $2, $3) => {
              set_attribute2(line_1, "x1", $0);
              set_attribute2(line_1, "y1", $1);
              set_attribute2(line_1, "x2", $2);
              set_attribute2(line_1, "y2", $3);
              set_attribute2(line_1, "stroke", get(item).color);
            },
            [
              () => cx(get(item).line.fromColumn),
              () => cy(get(item).line.fromRow),
              () => cx(get(item).line.toColumn),
              () => cy(get(item).line.toRow)
            ]
          );
          append($$anchor3, line_1);
        };
        var alternate = ($$anchor3) => {
          var path = root_1();
          template_effect(
            ($0) => {
              set_attribute2(path, "d", $0);
              set_attribute2(path, "stroke", get(item).color);
            },
            [
              () => computeAngularPath(cx(get(item).line.fromColumn), cy(get(item).line.fromRow), cx(get(item).line.toColumn), cy(get(item).line.toRow))
            ]
          );
          append($$anchor3, path);
        };
        if_block(node_2, ($$render) => {
          if (get(item).line.fromColumn === get(item).line.toColumn)
            $$render(consequent);
          else
            $$render(alternate, -1);
        });
      }
      append($$anchor2, fragment);
    });
    var node_3 = sibling(node_1);
    each(node_3, 17, () => get(visibleDots), index, ($$anchor2, dot) => {
      var fragment_1 = root_3();
      var node_4 = first_child(fragment_1);
      {
        var consequent_1 = ($$anchor3) => {
          var circle = root_2();
          template_effect(() => {
            set_attribute2(circle, "cx", get(dot).x);
            set_attribute2(circle, "cy", get(dot).y);
            set_attribute2(circle, "stroke", get(dot).color);
          });
          append($$anchor3, circle);
        };
        if_block(node_4, ($$render) => {
          if (get(dot).isHead)
            $$render(consequent_1);
        });
      }
      var circle_1 = sibling(node_4);
      set_attribute2(circle_1, "r", DOT_RADIUS);
      template_effect(() => {
        set_attribute2(circle_1, "cx", get(dot).x);
        set_attribute2(circle_1, "cy", get(dot).y);
        set_attribute2(circle_1, "fill", get(dot).color);
      });
      append($$anchor2, fragment_1);
    });
    reset(svg);
    template_effect(() => {
      set_attribute2(svg, "width", get(svgWidth));
      set_attribute2(svg, "height", get(svgHeight));
    });
    append($$anchor, svg);
    pop();
  }

  // webview/graph/BranchLabels.svelte
  var root3 = from_html(`<span><!> <span> </span></span>`);
  var root_12 = from_html(`<span class="labels svelte-et0zx2"></span>`);
  var $$css3 = {
    hash: "svelte-et0zx2",
    code: ".labels.svelte-et0zx2 {order:5;margin-left:16px;display:inline-flex;gap:5px;flex-shrink:0;padding-right:16px;min-width:max-content;overflow:visible;align-items:center;}.label.svelte-et0zx2 {display:inline-flex;align-items:center;gap:3px;padding:0 5px;border-radius:3px;font-size:0.8em;font-weight:500;line-height:1.3;white-space:nowrap;flex-shrink:0;background:transparent;}.label-icon {display:inline-flex;align-items:center;vertical-align:-1px;margin-right:2px;}.branch.svelte-et0zx2 {color:#3fb950;border:1px solid #238636;}.remote.svelte-et0zx2 {color:#bc8cff;border:1px solid #8957e5;}.tag.svelte-et0zx2 {color:#d29922;border:1px solid #9e6a03;}.head.svelte-et0zx2 {color:#e5a50a;border:1px solid #e5a50a;font-weight:600;}"
  };
  function BranchLabels($$anchor, $$props) {
    append_styles($$anchor, $$css3);
    let refs = prop($$props, "refs", 19, () => []);
    function labelClass(ref) {
      if (ref.startsWith("tag: "))
        return "label tag";
      if (ref.startsWith("HEAD") || ref === "HEAD")
        return "label head";
      if (ref.includes("/"))
        return "label remote";
      return "label branch";
    }
    function labelText(ref) {
      if (ref.startsWith("HEAD -> "))
        return ref.slice(8);
      if (ref.startsWith("tag: "))
        return ref.slice(5);
      return ref;
    }
    function labelIcon(ref) {
      if (ref.startsWith("tag: ")) {
        return '<span class="label-icon"><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.70708 2.29289L1.29497 8.705C0.904444 9.09553 0.904444 9.72869 1.29497 10.1192L5.88075 14.705C6.27128 15.0955 6.90444 15.0955 7.29497 14.705L13.7071 8.29289C13.8946 8.10536 14 7.851 14 7.58579V3C14 2.44772 13.5523 2 13 2H8.41418C8.14897 2 7.89461 2.10536 7.70708 2.29289ZM10 8C11.1046 8 12 7.10457 12 6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6C8 7.10457 8.89543 8 10 8Z" fill="#F2C55C"/></svg></span>';
      }
      return '<span class="label-icon"><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="4.5" cy="4.5" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="10.8" cy="6.2" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="4.5" y1="6.3" x2="4.5" y2="14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M4.5 9.8H9.3C10.13 9.8 10.8 9.13 10.8 8.3V8.0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></span>';
    }
    var span = root_12();
    each(span, 21, refs, index, ($$anchor2, ref) => {
      var span_1 = root3();
      var node = child(span_1);
      html(node, () => labelIcon(get(ref)));
      var span_2 = sibling(node, 2);
      var text2 = only_child(span_2, true);
      reset(span_1);
      template_effect(
        ($0, $1) => {
          set_class(span_1, 1, $0, "svelte-et0zx2");
          set_text(text2, $1);
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
  var root4 = from_html(`<div role="row" tabindex="0" style="height: 25px;"><span class="hash svelte-1rusxbg"></span> <!> <span class="subject svelte-1rusxbg"> </span> <span> </span> <span class="date svelte-1rusxbg"> </span></div>`);
  var root_13 = from_html(`<div class="context-menu svelte-1rusxbg"><button class="context-item svelte-1rusxbg">Interactively Rebase from Here...</button></div>`);
  var root_22 = from_html(`<div class="commit-list-container svelte-1rusxbg"><div class="scroll-content svelte-1rusxbg"><div class="visible-rows svelte-1rusxbg"><div class="graph-column svelte-1rusxbg"><!></div> <div class="rows-column svelte-1rusxbg"></div></div></div></div> <!>`, 1);
  var $$css4 = {
    hash: "svelte-1rusxbg",
    code: ".commit-list-container.svelte-1rusxbg {position:absolute;top:0;left:0;right:0;bottom:0;overflow-y:auto;overflow-x:auto;}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar {width:6px;height:6px;}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar-track {background:transparent;}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar-thumb {background:rgba(255,255,255,0.18);border-radius:3px;}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35);}.commit-list-container.svelte-1rusxbg::-webkit-scrollbar-corner {background:transparent;}.scroll-content.svelte-1rusxbg {min-width:100%;width:max-content;}.visible-rows.svelte-1rusxbg {position:relative;display:block;min-width:100%;width:max-content;}.graph-column.svelte-1rusxbg {position:absolute;top:0;left:244px;pointer-events:none;z-index:1;}.rows-column.svelte-1rusxbg {min-width:100%;width:max-content;}.commit-row.svelte-1rusxbg {box-sizing:border-box !important;height:25px !important;min-height:25px !important;max-height:25px !important;line-height:25px !important;display:flex;align-items:center;gap:8px;padding:0 8px;cursor:pointer;white-space:nowrap;position:relative;border-bottom:none;min-width:100%;width:max-content;}.commit-row.svelte-1rusxbg :where(.svelte-1rusxbg) {box-sizing:border-box;}.commit-row.svelte-1rusxbg:hover {background:var(--vscode-list-hoverBackground);}.commit-row.selected.svelte-1rusxbg {background:var(--vscode-list-activeSelectionBackground) !important;color:var(--vscode-list-activeSelectionForeground, #ffffff) !important;box-shadow:inset 0 0 0 999px rgba(255,255,255,0.08) !important;}.commit-row.selected.svelte-1rusxbg:hover {background:var(--vscode-list-activeSelectionBackground) !important;filter:brightness(1.18);box-shadow:inset 0 0 0 999px rgba(255,255,255,0.14) !important;}.commit-row.selected.svelte-1rusxbg .author:where(.svelte-1rusxbg),\n  .commit-row.selected.svelte-1rusxbg .date:where(.svelte-1rusxbg),\n  .commit-row.selected.svelte-1rusxbg .subject:where(.svelte-1rusxbg),\n  .commit-row.selected.svelte-1rusxbg .hash:where(.svelte-1rusxbg),\n  .commit-row.selected.svelte-1rusxbg :where(.svelte-1rusxbg) {color:var(--vscode-list-activeSelectionForeground, #ffffff) !important;}.author.svelte-1rusxbg {order:1;flex-shrink:0;font-weight:400;color:#9aa0a6;font-size:0.92em;width:95px;min-width:95px;overflow:hidden;text-overflow:ellipsis;}.date.svelte-1rusxbg {order:2;flex-shrink:0;color:#8c8c8c;font-size:0.88em;width:125px;min-width:125px;overflow:hidden;text-overflow:ellipsis;}.hash.svelte-1rusxbg {order:3;flex-shrink:0;color:transparent;user-select:none;font-size:0;}.subject.svelte-1rusxbg {order:4;flex:0 0 auto;min-width:max-content;white-space:nowrap;color:#dfe1e5;font-size:0.92em;}body.hl-my-commits .author.is-my-commit.svelte-1rusxbg {font-weight:700 !important;color:#ffffff !important;}body.hl-merge-commits .commit-row.is-merge.svelte-1rusxbg .subject:where(.svelte-1rusxbg) {color:#8c8c8c !important;font-weight:400;}body.hl-merge-commits .commit-row.is-merge.svelte-1rusxbg .author:where(.svelte-1rusxbg) {color:#8c8c8c !important;font-weight:400;}body.hl-merge-commits .commit-row.selected.svelte-1rusxbg .subject:where(.svelte-1rusxbg),\n  body.hl-merge-commits .commit-row.selected.svelte-1rusxbg .author:where(.svelte-1rusxbg) {color:var(--vscode-list-activeSelectionForeground, #ffffff) !important;}body.hl-current-branch .commit-row.is-current-branch.svelte-1rusxbg:not(.selected) {background:rgba(255,255,255,0.038) !important;box-shadow:none !important;}body.hl-current-branch .commit-row.is-current-branch.svelte-1rusxbg:not(.selected):hover {background:var(--vscode-list-hoverBackground) !important;box-shadow:none !important;}body.hl-current-branch .commit-row.selected.svelte-1rusxbg {background:var(--vscode-list-activeSelectionBackground) !important;}body.hl-current-branch .commit-row.selected.svelte-1rusxbg:hover {background:var(--vscode-list-activeSelectionBackground) !important;filter:brightness(1.18);}.context-menu.svelte-1rusxbg {position:fixed;background:var(--vscode-menu-background, #252526);border:1px solid var(--vscode-menu-border, #454545);border-radius:4px;padding:4px 0;z-index:1000;box-shadow:0 2px 8px rgba(0,0,0,0.3);}.context-item.svelte-1rusxbg {display:block;width:100%;padding:6px 20px;border:none;background:none;color:var(--vscode-menu-foreground, #ccc);font-size:inherit;text-align:left;cursor:pointer;}.context-item.svelte-1rusxbg:hover {background:var(--vscode-menu-selectionBackground, #094771);color:var(--vscode-menu-selectionForeground, #fff);}"
  };
  function CommitList($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css4);
    let commits = prop($$props, "commits", 19, () => []), selectedHash = prop($$props, "selectedHash", 3, null), graphWidth = prop($$props, "graphWidth", 3, 1), scrollToIndex = prop($$props, "scrollToIndex", 19, () => -1);
    const ROW_HEIGHT = 25;
    const OVERSCAN = 5;
    let containerEl = state(void 0);
    let scrollTop = state(0);
    let containerHeight = state(600);
    let contextMenuHash = state(null);
    let contextMenuPos = proxy({ x: 0, y: 0 });
    let showContextMenu = state(false);
    function showToast2(text2) {
      const old = document.querySelector(".as-mini-toast");
      if (old)
        old.remove();
      const t = document.createElement("div");
      t.className = "as-mini-toast";
      t.innerText = text2;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add("visible"), 10);
      setTimeout(
        () => {
          t.classList.remove("visible");
          setTimeout(() => t.remove(), 250);
        },
        2e3
      );
    }
    if (typeof window !== "undefined") {
      window.showToast = showToast2;
    }
    user_effect(() => {
      if (!get(containerEl))
        return;
      window.__commitListContainer__ = get(containerEl);
      window.__commitListSetScrollTop__ = (st) => {
        set(scrollTop, st, true);
      };
      const obs = new ResizeObserver((entries) => {
        if (!entries || !entries.length)
          return;
        window.requestAnimationFrame(() => {
          if (!entries[0])
            return;
          const h = entries[0].contentRect.height;
          if (h && Math.abs(h - get(containerHeight)) > 1) {
            set(containerHeight, h, true);
          }
        });
      });
      obs.observe(get(containerEl));
      return () => {
        obs.disconnect();
        if (window.__commitListContainer__ === get(containerEl)) {
          window.__commitListContainer__ = null;
          window.__commitListSetScrollTop__ = null;
        }
      };
    });
    let isLoadingMore = false;
    let hasReachedEnd = false;
    let prevCommitCount = 0;
    function onScroll(e) {
      const el = e.target;
      set(scrollTop, el.scrollTop, true);
      const curCount = commits() ? commits().length : 0;
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
    let endIndex = user_derived(() => Math.min(commits().length, Math.ceil((get(scrollTop) + get(containerHeight)) / ROW_HEIGHT) + OVERSCAN));
    let visibleCommits = user_derived(() => commits().slice(get(startIndex), get(endIndex)));
    let graphNodes = user_derived(() => commits().map((c) => c.graph));
    function formatDate(iso) {
      const d = new Date(iso);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1e3 * 60));
      if (diffMins < 1)
        return "Just now";
      if (diffMins < 60)
        return `${diffMins} minutes ago`;
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      const isToday = d.toDateString() === now.toDateString();
      if (isToday)
        return `Today ${timeStr}`;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString())
        return `Yesterday ${timeStr}`;
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}, ${timeStr}`;
    }
    const ICON_COPY = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/></svg>';
    const ICON_PLUS = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M12.1232 2.67714C11.7828 2.33692 11.3696 2.16676 10.8834 2.16676C10.3975 2.16676 9.98427 2.33682 9.64395 2.67714C9.30375 3.01737 9.13366 3.43051 9.13366 3.91672C9.13366 4.23268 9.21242 4.52588 9.37041 4.79626C9.52838 5.06666 9.74087 5.27787 10.0084 5.42971C10.0084 5.74567 9.98273 6.02377 9.93118 6.26375C9.87939 6.50373 9.79441 6.71478 9.67597 6.8972C9.55721 7.07953 9.43442 7.23436 9.30672 7.36203C9.17899 7.4897 8.99973 7.60961 8.76885 7.72208C8.538 7.83449 8.32366 7.92857 8.12624 8.00464C7.92881 8.08047 7.66288 8.17008 7.32869 8.27342C6.72097 8.46187 6.25317 8.63491 5.92501 8.793V4.26292C6.19238 4.11111 6.40507 3.89993 6.56303 3.62953C6.72097 3.35912 6.79995 3.06589 6.79995 2.74993C6.79995 2.26388 6.62988 1.85064 6.28956 1.51042C5.94937 1.17022 5.53623 1 5.05005 1C4.56383 1 4.15069 1.1701 3.81037 1.51042C3.47018 1.85064 3.29999 2.26388 3.29999 2.74993C3.29999 3.06589 3.37897 3.35912 3.5369 3.62953C3.69487 3.89993 3.90752 4.11111 4.17492 4.26292V11.7371C3.90752 11.8888 3.69487 12.1002 3.5369 12.3705C3.37897 12.641 3.29999 12.9343 3.29999 13.2501C3.29999 13.7362 3.47005 14.1494 3.81037 14.4896C4.15069 14.8298 4.56393 15 5.05005 15C5.53614 15 5.94937 14.8298 6.28956 14.4896C6.62979 14.1494 6.79995 13.7362 6.79995 13.2501C6.79995 12.9343 6.72097 12.641 6.56303 12.3705C6.40504 12.1002 6.19238 11.8888 5.92501 11.7371V11.5001C5.92501 11.0809 6.05109 10.7772 6.30323 10.5888C6.55537 10.4003 7.07035 10.1846 7.84823 9.94163C8.66867 9.68029 9.28553 9.43405 9.6987 9.20307C11.0598 8.43155 11.7464 7.17367 11.7585 5.42968C12.0261 5.27787 12.2386 5.06663 12.3965 4.79622C12.5544 4.52582 12.6335 4.23265 12.6335 3.91669C12.6336 3.4306 12.4634 3.01746 12.1232 2.67714Z"/></svg>';
    const ICON_CHERRY = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="display:block;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.5 11C6.5 12.1046 5.60457 13 4.5 13C3.39543 13 2.5 12.1046 2.5 11C2.5 9.89543 3.39543 9 4.5 9C5.60457 9 6.5 9.89543 6.5 11ZM4.5 14C6.15685 14 7.5 12.6569 7.5 11C7.5 9.34315 6.15685 8 4.5 8C2.84315 8 1.5 9.34315 1.5 11C1.5 12.6569 2.84315 14 4.5 14ZM13.5 11C13.5 12.1046 12.6046 13 11.5 13C10.3954 13 9.5 12.1046 9.5 11C9.5 9.89543 10.3954 9 11.5 9C12.6046 9 13.5 9.89543 13.5 11ZM11.5 14C13.1569 14 14.5 12.6569 14.5 11C14.5 9.34315 13.1569 8 11.5 8C9.84315 8 8.5 9.34315 8.5 11C8.5 12.6569 9.84315 14 11.5 14Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.8537 1.14647C11.7934 1.08617 11.7216 1.04449 11.6453 1.02143C11.5869 1.00372 11.5244 0.996452 11.46 1.00164L11.4585 1.00175L11.4577 1.00183C8.89299 1.21581 7.10682 2.51359 5.92996 4.03112C4.76214 5.53699 4.18349 7.26955 4.00588 8.424C3.9639 8.69693 4.15111 8.95222 4.42404 8.99421C4.69697 9.0362 4.95227 8.84899 4.99426 8.57606C5.14998 7.56384 5.67133 5.9964 6.72018 4.64394C7.43375 3.72381 8.38624 2.9082 9.6361 2.42686L10.8329 1.87283L10.1507 2.48553C9.63716 3.45813 9.48624 4.482 9.53842 5.42758C9.61459 6.8079 10.1221 8.0385 10.5761 8.76503C10.7225 8.9992 11.031 9.07038 11.2651 8.92403C11.4993 8.77767 11.5705 8.4692 11.4241 8.23503C11.0449 7.62822 10.6024 6.55883 10.5369 5.37248C10.4723 4.20114 10.7737 2.93361 11.8537 1.85358C12.049 1.65832 12.049 1.34174 11.8537 1.14647Z" fill="currentColor"/></svg>';
    const ICON_RESET = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><g fill-rule="evenodd" transform="translate(2 1)"><polygon points="0 0 4 4 0 8" transform="matrix(-1 0 0 1 4 0)"/><path d="M4.15058343,11 L8.06891179,11 C9.72576604,11 11.0689118,9.65685425 11.0689118,8 C11.0689118,6.34314575 9.72576604,5 8.06891179,5 L4.03764586,5 L4,3 L8,3 C10.7614237,3 13,5.23857625 13,8 C13,10.7614237 10.7614237,13 8,13 L4.18822929,13 L4.15058343,11 Z"/></g></svg>';
    const ICON_WEB = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
    function closeCommitContextMenu() {
      const menus = document.querySelectorAll(".commit-context-menu");
      menus.forEach((m) => m.remove());
    }
    function closeBranchContextMenu() {
      const old = document.querySelector(".branch-context-menu");
      if (old)
        old.remove();
    }
    function openEditCommitMessageDialog(commit) {
      if (!commit)
        return;
      const existing = document.querySelector(".as-dialog-overlay");
      if (existing)
        existing.remove();
      const overlay = document.createElement("div");
      overlay.className = "as-dialog-overlay";
      const card = document.createElement("div");
      card.className = "as-dialog-card";
      const shortHash = commit.hash ? commit.hash.slice(0, 8) : "";
      card.innerHTML = `
      <div class="as-dialog-header">
        <span>Edit Commit Message (${shortHash})</span>
        <span class="as-dialog-close">\u2715</span>
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
        const fullMessage = desc ? title + "\n\n" + desc : title;
        postMessage("editCommitMessage", { hash: commit.hash, message: fullMessage });
        closeDialog();
      };
      btnCancel.addEventListener("click", closeDialog);
      btnClose.addEventListener("click", closeDialog);
      btnOk.addEventListener("click", submitDialog);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay)
          closeDialog();
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
      setTimeout(
        () => {
          summaryInput.focus();
          summaryInput.select();
        },
        50
      );
    }
    function showCommitContextMenu(e, commit) {
      e.preventDefault();
      e.stopPropagation();
      closeCommitContextMenu();
      const oldBranch = document.querySelector(".branch-context-menu");
      if (oldBranch)
        oldBranch.remove();
      const commitList = commits() || [];
      const isHead = commitList.length > 0 && commitList[0].hash === commit.hash;
      const menu = document.createElement("div");
      menu.className = "commit-context-menu";
      menu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
      menu.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      });
      function addItem(label, shortcut, iconSvg, onClick, disabled = false) {
        const it = document.createElement("div");
        it.className = "ccm-item" + (disabled ? " disabled" : "");
        const iconSpan = document.createElement("span");
        iconSpan.className = "ccm-icon";
        if (iconSvg)
          iconSpan.innerHTML = iconSvg;
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
      addItem("Copy Revision Number", "\u2325\u21E7\u2318C", ICON_COPY, () => {
        navigator.clipboard.writeText(commit.hash);
        showToast2("Copied " + commit.hash.slice(0, 8) + " to clipboard");
      });
      addItem("Create Patch...", "", ICON_PLUS, () => {
        postMessage("createPatch", { hash: commit.hash });
      });
      addItem("Cherry-Pick", "", ICON_CHERRY, () => {
        postMessage("cherryPick", { hash: commit.hash });
      });
      addDivider();
      addItem("Checkout Revision", "", "", () => {
        postMessage("checkout", commit.hash);
      });
      addItem("Show Repository at Revision", "", "", () => {
        postMessage("showRepoAtRevision", { hash: commit.hash });
      });
      addItem("Compare with Local", "", "", () => {
        postMessage("compareWithLocal", { hash: commit.hash });
      });
      addDivider();
      addItem("Reset Current Branch to Here...", "", ICON_RESET, () => {
        postMessage("resetToCommit", { hash: commit.hash });
      });
      addItem("Revert Commit", "", "", () => {
        postMessage("revertCommit", { hash: commit.hash });
      });
      addItem(
        "Undo Commit...",
        "",
        "",
        () => {
          postMessage("undoCommit", { hash: commit.hash });
        },
        !isHead
      );
      addDivider();
      addItem("Edit Commit Message...", "F2", "", () => {
        openEditCommitMessageDialog(commit);
      });
      addItem("Fixup...", "", "", () => {
        postMessage("rebaseFromHere", commit.hash);
      });
      addItem("Squash Into...", "", "", () => {
        postMessage("rebaseFromHere", commit.hash);
      });
      addItem("Drop Commit", "", "", () => {
        postMessage("dropCommit", { hash: commit.hash });
      });
      addItem("Interactively Rebase from Here...", "", "", () => {
        postMessage("rebaseFromHere", commit.hash);
      });
      addItem("Push All up to Here...", "", "", () => {
        showToast2("Pushing up to " + commit.hash.slice(0, 8) + "...");
        postMessage("pushUpToHere", { hash: commit.hash });
      });
      addDivider();
      const branchRef = (commit.refs || []).find((r2) => !r2.startsWith("tag: ") && r2 !== "HEAD") || commit.refs && commit.refs[0];
      if (branchRef) {
        let addSubItem = function(label, onClick) {
          const it = document.createElement("div");
          it.className = "ccm-item";
          it.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">${label}</span>`;
          it.addEventListener("click", (ev) => {
            ev.stopPropagation();
            closeCommitContextMenu();
            onClick();
          });
          subMenu.appendChild(it);
        }, hideSubMenu = function() {
          clearTimeout(subMenuTimer);
          subMenuTimer = setTimeout(
            () => {
              subMenu.remove();
            },
            150
          );
        }, showSubMenu = function() {
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
        };
        const cleanBranch = branchRef.replace(/^HEAD -> /, "");
        const branchItem = document.createElement("div");
        branchItem.className = "ccm-item has-submenu";
        branchItem.innerHTML = `<span class="ccm-icon"></span><span class="ccm-label">Branch '${cleanBranch}'</span><span class="ccm-arrow">\u203A</span>`;
        const subMenu = document.createElement("div");
        subMenu.className = "commit-context-menu ccm-submenu";
        addSubItem("Checkout", () => postMessage("checkout", cleanBranch));
        addSubItem("Show Diff with Working Tree", () => postMessage("showDiff", { branch: cleanBranch }));
        addSubItem("Update", () => {
          showToast2("Updating '" + cleanBranch + "'...");
          postMessage("pull", cleanBranch);
        });
        addSubItem("Push...", () => postMessage("push", cleanBranch));
        addSubItem("Rename...", () => {
          openRenameBranchDialog(cleanBranch);
        });
        let subMenuTimer;
        branchItem.addEventListener("mouseenter", showSubMenu);
        branchItem.addEventListener("mouseleave", hideSubMenu);
        subMenu.addEventListener("mouseenter", () => clearTimeout(subMenuTimer));
        subMenu.addEventListener("mouseleave", hideSubMenu);
        menu.appendChild(branchItem);
      }
      addItem("New Branch...", "\u2325\u2318N", "", () => {
        openCreateBranchDialog(commit.hash);
      });
      addItem("New Tag...", "", "", () => {
        openCreateTagDialog(commit.hash);
      });
      addDivider();
      let childCommit = commitList.find((c) => c.parents && c.parents.includes(commit.hash));
      addItem(
        "Go to Child Commit",
        "\u2190",
        "",
        () => {
          if (childCommit)
            $$props.onSelectCommit(childCommit.hash);
        },
        !childCommit
      );
      const hasParent = commit.parents && commit.parents.length > 0;
      addItem(
        "Go to Parent Commit",
        "\u2192",
        "",
        () => {
          if (hasParent)
            $$props.onSelectCommit(commit.parents[0]);
        },
        !hasParent
      );
      addDivider();
      addItem("View in browser", "", ICON_WEB, () => {
        postMessage("openInBrowser", { hash: commit.hash });
      });
      document.body.appendChild(menu);
      let x = e.clientX;
      let y = e.clientY;
      const rect = menu.getBoundingClientRect();
      if (x + rect.width > window.innerWidth - 8)
        x = Math.max(8, window.innerWidth - rect.width - 8);
      if (y + rect.height > window.innerHeight - 8) {
        const yAbove = e.clientY - rect.height;
        if (yAbove >= 8) {
          y = yAbove;
        } else {
          y = Math.max(4, window.innerHeight - rect.height - 8);
        }
      }
      menu.style.left = Math.max(0, x) + "px";
      menu.style.top = Math.max(0, y) + "px";
    }
    function onContextMenu(e, commit) {
      if (commit && commit.hash) {
        $$props.onSelectCommit(commit.hash);
      }
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
      if (scrollToIndex() >= 0 && get(containerEl)) {
        const targetY = scrollToIndex() * ROW_HEIGHT;
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
        if (!target || !target.closest?.(".commit-context-menu") && !target.closest?.(".branch-context-menu")) {
          closeAllMenus();
        }
      };
      const keydownHandler = (ev) => {
        if (ev.key === "Escape") {
          closeAllMenus();
          return;
        }
        if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA"))
          return;
        const selHash = selectedHash();
        if (!selHash)
          return;
        const commitList = commits() || [];
        const commit = commitList.find((c) => c.hash === selHash);
        if (!commit)
          return;
        if (ev.key === "F2") {
          ev.preventDefault();
          openEditCommitMessageDialog(commit);
        } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === "c" || ev.key === "C") && !window.getSelection()?.toString()) {
          ev.preventDefault();
          navigator.clipboard.writeText(commit.hash);
          showToast2("Copied " + commit.hash.slice(0, 8) + " to clipboard");
        } else if (ev.key === "ArrowLeft") {
          const childCommit = commitList.find((c) => c.parents && c.parents.includes(commit.hash));
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
    function isMyCommit(commit) {
      const cUser = typeof window !== "undefined" ? window.__GIT_CURRENT_USER__ : null;
      if (!cUser)
        return false;
      const ca = (commit.author || "").trim().toLowerCase();
      const ce = (commit.authorEmail || "").trim().toLowerCase();
      const un = (cUser.name || "").trim().toLowerCase();
      const ue = (cUser.email || "").trim().toLowerCase();
      if (un && ca && (ca === un || ca.includes(un) || un.includes(ca)))
        return true;
      if (ue && ce && (ce === ue || ce.includes(ue) || ue.includes(ce)))
        return true;
      if (ue && ca && ca === ue.split("@")[0])
        return true;
      return false;
    }
    function computeGraphWidth(commit) {
      const g = commit.graph;
      let maxCol = g ? g.column : 0;
      if (g && g.lines) {
        for (let li = 0; li < g.lines.length; li++) {
          const l = g.lines[li];
          if (l.fromColumn > maxCol)
            maxCol = l.fromColumn;
          if (l.toColumn > maxCol)
            maxCol = l.toColumn;
        }
      }
      const rowBranches = Math.max(4, maxCol + 1);
      return rowBranches * 16 + 20;
    }
    var fragment = root_22();
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
          return graphWidth();
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
    each(div_4, 21, () => get(visibleCommits), (commit) => commit.hash, ($$anchor2, commit) => {
      const isMerge = user_derived(() => get(commit).parents && get(commit).parents.length > 1 || get(commit).subject && get(commit).subject.startsWith("Merge "));
      const isCur = user_derived(() => get(commit).isCurrentBranch !== false);
      const isMy = user_derived(() => isMyCommit(get(commit)));
      const gw = user_derived(() => computeGraphWidth(get(commit)));
      var div_5 = root4();
      let classes;
      var span = child(div_5);
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
          if (get(commit).refs && get(commit).refs.length > 0)
            $$render(consequent);
        });
      }
      var span_1 = sibling(node_1, 2);
      var text_1 = only_child(span_1, true);
      var span_2 = sibling(span_1, 2);
      let classes_1;
      var text_2 = only_child(span_2, true);
      var span_3 = sibling(span_2, 2);
      var text_3 = only_child(span_3, true);
      reset(div_5);
      template_effect(
        ($0) => {
          classes = set_class(div_5, 1, "commit-row svelte-1rusxbg", null, classes, {
            "is-merge": get(isMerge),
            "is-current-branch": get(isCur),
            selected: get(commit).hash === selectedHash()
          });
          set_style(span, `width: ${get(gw) ?? ""}px; min-width: ${get(gw) ?? ""}px;`);
          set_attribute2(span_1, "title", get(commit).subject);
          set_text(text_1, get(commit).subject);
          classes_1 = set_class(span_2, 1, "author svelte-1rusxbg", null, classes_1, { "is-my-commit": get(isMy) });
          set_text(text_2, get(commit).author);
          set_text(text_3, $0);
        },
        [() => formatDate(get(commit).authorDate)]
      );
      delegated("click", div_5, () => $$props.onSelectCommit(get(commit).hash));
      delegated("contextmenu", div_5, (e) => onContextMenu(e, get(commit)));
      delegated("keydown", div_5, (e) => {
        if (e.key === "Enter")
          $$props.onSelectCommit(get(commit).hash);
      });
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
        var div_6 = root_13();
        var button = only_child(div_6);
        template_effect(() => set_style(div_6, `left: ${contextMenuPos.x ?? ""}px; top: ${contextMenuPos.y ?? ""}px;`));
        delegated("click", button, handleRebase);
        append($$anchor2, div_6);
      };
      if_block(node_2, ($$render) => {
        if (get(showContextMenu))
          $$render(consequent_1);
      });
    }
    template_effect(() => {
      set_style(div_1, `height: ${commits().length * ROW_HEIGHT}px; position: relative; min-width: 100%; width: max-content;`);
      set_style(div_2, `transform: translateY(${get(startIndex) * ROW_HEIGHT}px); min-width: 100%; width: max-content;`);
    });
    event("scroll", div, onScroll);
    append($$anchor, fragment);
    pop();
  }
  delegate(["click", "contextmenu", "keydown"]);

  // webview/graph/CommitDetail.svelte
  var root5 = from_html(`<div class="body svelte-ctw68d"> </div>`);
  var root_14 = from_html(`<div class="meta-row svelte-ctw68d"><span class="meta-label svelte-ctw68d">Parents</span> <span class="meta-value mono svelte-ctw68d"> </span></div>`);
  var root_23 = from_html(`<div class="loading-files svelte-ctw68d">Loading...</div>`);
  var root_32 = from_html(`<button class="file-row svelte-ctw68d" type="button"><span> </span> <span class="file-path svelte-ctw68d"><span class="file-dir svelte-ctw68d"> </span> <span class="file-name svelte-ctw68d"> </span></span></button>`);
  var root_42 = from_html(`<div class="files-list svelte-ctw68d"></div>`);
  var root_5 = from_html(`<div class="detail svelte-ctw68d"><div class="header svelte-ctw68d"><div class="subject svelte-ctw68d"> </div> <!> <div class="meta svelte-ctw68d"><div class="meta-row svelte-ctw68d"><span class="meta-label svelte-ctw68d">Hash</span> <span class="meta-value mono svelte-ctw68d"> </span></div> <div class="meta-row svelte-ctw68d"><span class="meta-label svelte-ctw68d">Author</span> <span class="meta-value svelte-ctw68d"> </span></div> <div class="meta-row svelte-ctw68d"><span class="meta-label svelte-ctw68d">Date</span> <span class="meta-value svelte-ctw68d"> </span></div> <!></div></div> <div class="files-header svelte-ctw68d"> </div> <!></div>`);
  var $$css5 = {
    hash: "svelte-ctw68d",
    code: ".detail.svelte-ctw68d {padding:12px;position:relative;}.header.svelte-ctw68d {padding-bottom:12px;border-bottom:1px solid var(--vscode-panel-border);padding-right:24px;}.subject.svelte-ctw68d {font-weight:600;margin-bottom:4px;}.body.svelte-ctw68d {white-space:pre-wrap;color:var(--vscode-descriptionForeground);font-size:0.9em;margin-bottom:8px;}.meta.svelte-ctw68d {font-size:0.85em;}.meta-row.svelte-ctw68d {display:flex;gap:8px;padding:2px 0;}.meta-label.svelte-ctw68d {color:var(--vscode-descriptionForeground);width:50px;flex-shrink:0;}.meta-value.svelte-ctw68d {overflow:hidden;text-overflow:ellipsis;word-break:break-all;}.mono.svelte-ctw68d {font-family:var(--vscode-editor-font-family, monospace);font-size:0.95em;}.files-header.svelte-ctw68d {padding:8px 0 4px;font-weight:600;font-size:0.9em;color:var(--vscode-descriptionForeground);}.loading-files.svelte-ctw68d {padding:8px 0;color:var(--vscode-descriptionForeground);font-size:0.9em;}.files-list.svelte-ctw68d {display:flex;flex-direction:column;}.file-row.svelte-ctw68d {display:flex;align-items:center;gap:6px;padding:3px 4px;cursor:pointer;border-radius:3px;background:none;border:none;color:inherit;font:inherit;text-align:left;width:100%;}.file-row.svelte-ctw68d:hover {background:var(--vscode-list-hoverBackground);}.file-status.svelte-ctw68d {flex-shrink:0;width:16px;text-align:center;font-weight:600;font-size:0.85em;}.status-added.svelte-ctw68d {color:#73c991;}.status-modified.svelte-ctw68d {color:#e2c08d;}.status-deleted.svelte-ctw68d {color:#c74e39;}.status-renamed.svelte-ctw68d {color:#569cd6;}.file-path.svelte-ctw68d {overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.9em;}.file-dir.svelte-ctw68d {color:var(--vscode-descriptionForeground);}.file-name.svelte-ctw68d {color:var(--vscode-foreground);}"
  };
  function CommitDetail($$anchor, $$props) {
    push($$props, true);
    append_styles($$anchor, $$css5);
    let commit = prop($$props, "commit", 3, null), files = prop($$props, "files", 19, () => []);
    function handleFileClick(file) {
      if (!commit())
        return;
      postMessage("openDiff", {
        hash: commit().hash,
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
        var div = root_5();
        var div_1 = child(div);
        var div_2 = child(div_1);
        var text2 = only_child(div_2, true);
        var node_1 = sibling(div_2, 2);
        {
          var consequent = ($$anchor3) => {
            var div_3 = root5();
            var text_1 = only_child(div_3, true);
            template_effect(() => set_text(text_1, commit().body));
            append($$anchor3, div_3);
          };
          if_block(node_1, ($$render) => {
            if (commit().body)
              $$render(consequent);
          });
        }
        var div_4 = sibling(node_1, 2);
        var div_5 = child(div_4);
        var span = sibling(child(div_5), 2);
        var text_2 = only_child(span, true);
        reset(div_5);
        var div_6 = sibling(div_5, 2);
        var span_1 = sibling(child(div_6), 2);
        var text_3 = only_child(span_1);
        reset(div_6);
        var div_7 = sibling(div_6, 2);
        var span_2 = sibling(child(div_7), 2);
        var text_4 = only_child(span_2, true);
        reset(div_7);
        var node_2 = sibling(div_7, 2);
        {
          var consequent_1 = ($$anchor3) => {
            var div_8 = root_14();
            var span_3 = sibling(child(div_8), 2);
            var text_5 = only_child(span_3, true);
            reset(div_8);
            template_effect(($0) => set_text(text_5, $0), [() => commit().parents.map((p) => p.slice(0, 7)).join(", ")]);
            append($$anchor3, div_8);
          };
          if_block(node_2, ($$render) => {
            if (commit().parents && commit().parents.length > 0)
              $$render(consequent_1);
          });
        }
        reset(div_4);
        reset(div_1);
        var div_9 = sibling(div_1, 2);
        var text_6 = only_child(div_9);
        var node_3 = sibling(div_9, 2);
        {
          var consequent_2 = ($$anchor3) => {
            var div_10 = root_23();
            append($$anchor3, div_10);
          };
          var alternate = ($$anchor3) => {
            var div_11 = root_42();
            each(div_11, 21, files, index, ($$anchor4, file) => {
              var button = root_32();
              var span_4 = child(button);
              var text_7 = only_child(span_4, true);
              var span_5 = sibling(span_4, 2);
              var span_6 = child(span_5);
              var text_8 = only_child(span_6, true);
              var span_7 = sibling(span_6, 2);
              var text_9 = only_child(span_7, true);
              reset(span_5);
              reset(button);
              template_effect(
                ($0, $1, $2, $3) => {
                  set_class(span_4, 1, $0, "svelte-ctw68d");
                  set_attribute2(span_4, "title", $1);
                  set_text(text_7, get(file).status);
                  set_attribute2(span_5, "title", get(file).path);
                  set_text(text_8, $2);
                  set_text(text_9, $3);
                },
                [
                  () => `file-status ${statusClass(get(file).status)}`,
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
            if (files().length === 0)
              $$render(consequent_2);
            else
              $$render(alternate, -1);
          });
        }
        reset(div);
        template_effect(
          ($0) => {
            set_text(text2, commit().subject);
            set_text(text_2, commit().hash);
            set_text(text_3, `${commit().author ?? ""} <${commit().authorEmail ?? ""}>`);
            set_text(text_4, $0);
            set_text(text_6, `Changed Files (${files().length ?? ""})`);
          },
          [() => formatFullDate(commit().authorDate)]
        );
        append($$anchor2, div);
      };
      if_block(node, ($$render) => {
        if (commit())
          $$render(consequent_3);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  delegate(["click"]);

  // webview/graph/branchSidebar.ts
  function renderSidebarContent(container, getBranchData, getActiveBranch, setActiveBranch) {
    if (!container)
      return;
    if (container._selectedTreeBranch === void 0) {
      container._selectedTreeBranch = getActiveBranch() || "";
    }
    const data = getBranchData();
    const currentActive = getActiveBranch();
    const { branches = [], tags = [], currentBranch = "" } = data;
    function getFavorites() {
      try {
        const raw = localStorage.getItem("intellij_git_fav_branches");
        if (raw)
          return new Set(JSON.parse(raw));
      } catch {
      }
      return /* @__PURE__ */ new Set(["develop", "main", "master"]);
    }
    function saveFavorites(favSet) {
      try {
        localStorage.setItem("intellij_git_fav_branches", JSON.stringify(Array.from(favSet)));
      } catch {
      }
    }
    function isBranchFavorite(name) {
      if (!name)
        return false;
      const favs = getFavorites();
      return favs.has(name);
    }
    function toggleBranchFavorite(name) {
      if (!name)
        return;
      const favs = getFavorites();
      if (favs.has(name)) {
        favs.delete(name);
      } else {
        favs.add(name);
      }
      saveFavorites(favs);
    }
    const getCurrentBranchName = () => getBranchData() && getBranchData().currentBranch || window.__GIT_CURRENT_BRANCH__ || "";
    function closeBranchContextMenu() {
      const old = document.querySelector(".branch-context-menu");
      if (old)
        old.remove();
      const oldCommit = document.querySelectorAll(".commit-context-menu");
      oldCommit.forEach((m) => m.remove());
    }
    function showBranchContextMenu(e, branchName) {
      e.preventDefault();
      e.stopPropagation();
      closeBranchContextMenu();
      const isCurrent = branchName === currentBranch;
      const menu = document.createElement("div");
      menu.className = "branch-context-menu";
      menu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
      menu.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      });
      function addItem(label, shortcut, onClick, disabled = false) {
        const it = document.createElement("div");
        it.className = "bcm-item" + (disabled ? " disabled" : "");
        if (disabled) {
          it.style.pointerEvents = "none";
          it.style.opacity = "0.45";
        }
        it.innerHTML = "<span>" + label + "</span>" + (shortcut ? '<span class="bcm-shortcut">' + shortcut + "</span>" : "");
        it.addEventListener("click", (ev) => {
          if (disabled)
            return;
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
      const isRemote = branchInfo ? !!branchInfo.remote || branchName.startsWith("origin/") : branchName.startsWith("origin/");
      if (isCurrent) {
        addItem("New Branch from '" + branchName + "'...", "", () => {
          openCreateBranchDialog(branchName);
        });
        addItem("Show Diff with Working Tree", "", () => {
          postMessage("showDiff", { branch: branchName });
        });
        addDivider();
        addItem("Update", "", () => {
          showToast("Updating '" + branchName + "'...");
          postMessage("pull", branchName);
        });
        addItem("Push...", "", () => {
          postMessage("push", branchName);
        });
        if (branchInfo && branchInfo.upstream) {
          addItem("Unset Tracked Branch (" + branchInfo.upstream + ")", "", () => {
            showToast("Unsetting tracked branch for '" + branchName + "'...");
            postMessage("unsetUpstream", { branch: branchName });
          });
        }
        addDivider();
        addItem("Rename...", "F2", () => {
          openRenameBranchDialog(branchName);
        });
      } else if (isRemote) {
        addItem("Checkout", "", () => {
          postMessage("checkout", branchName);
        });
        addItem("Fetch Branch", "", () => {
          showToast("Fetching '" + branchName + "'...");
          postMessage("fetchSingleBranch", { branch: branchName });
        });
        const curBranchInfo = currentBranch ? branches.find((b) => b.name === currentBranch && !b.remote) : null;
        const isAlreadyTrackingThis = curBranchInfo && curBranchInfo.upstream === branchName;
        if (currentBranch) {
          const trackLabel = "Track into '" + currentBranch + "'" + (isAlreadyTrackingThis ? " (already tracked)" : "");
          addItem(trackLabel, "", () => {
            showToast("Tracking '" + currentBranch + "' -> '" + branchName + "'...");
            postMessage("setUpstream", { branch: currentBranch, upstream: branchName });
          }, isAlreadyTrackingThis);
        }
        addItem("New Branch from '" + branchName + "'...", "", () => {
          openCreateBranchDialog(branchName);
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
          openCreateBranchDialog(branchName);
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
          showToast("Updating '" + branchName + "'...");
          postMessage("pull", branchName);
        });
        addItem("Push...", "", () => {
          postMessage("push", branchName);
        });
        if (branchInfo && branchInfo.upstream) {
          addItem("Unset Tracked Branch (" + branchInfo.upstream + ")", "", () => {
            showToast("Unsetting tracked branch for '" + branchName + "'...");
            postMessage("unsetUpstream", { branch: branchName });
          });
        }
        addDivider();
        addItem("Rename...", "F2", () => {
          openRenameBranchDialog(branchName);
        });
        addItem("Delete", "", () => {
          postMessage("deleteBranch", branchName);
        });
      }
      document.body.appendChild(menu);
      let x = e.clientX;
      let y = e.clientY;
      const rect = menu.getBoundingClientRect();
      if (x + rect.width > window.innerWidth - 8)
        x = Math.max(8, window.innerWidth - rect.width - 8);
      if (y + rect.height > window.innerHeight - 8) {
        const yAbove = e.clientY - rect.height;
        if (yAbove >= 8) {
          y = yAbove;
        } else {
          y = Math.max(4, window.innerHeight - rect.height - 8);
        }
      }
      menu.style.left = Math.max(0, x) + "px";
      menu.style.top = Math.max(0, y) + "px";
    }
    function showGeneralBranchContextMenu(e) {
      e.preventDefault();
      e.stopPropagation();
      closeBranchContextMenu();
      const menu = document.createElement("div");
      menu.className = "branch-context-menu";
      menu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
      menu.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      });
      function addItem(label, shortcut, onClick) {
        const it = document.createElement("div");
        it.className = "bcm-item";
        it.innerHTML = "<span>" + label + "</span>" + (shortcut ? '<span class="bcm-shortcut">' + shortcut + "</span>" : "");
        it.addEventListener("click", (ev) => {
          ev.stopPropagation();
          closeBranchContextMenu();
          onClick();
        });
        menu.appendChild(it);
      }
      addItem("New Branch...", "", () => {
        openCreateBranchDialog(currentBranch || "HEAD");
      });
      addItem("Refresh Branches", "", () => {
        postMessage("refreshBranches");
      });
      document.body.appendChild(menu);
      let x = e.clientX;
      let y = e.clientY;
      const rect = menu.getBoundingClientRect();
      if (x + rect.width > window.innerWidth - 8)
        x = Math.max(8, window.innerWidth - rect.width - 8);
      if (y + rect.height > window.innerHeight - 8) {
        const yAbove = e.clientY - rect.height;
        if (yAbove >= 8) {
          y = yAbove;
        } else {
          y = Math.max(4, window.innerHeight - rect.height - 8);
        }
      }
      menu.style.left = Math.max(0, x) + "px";
      menu.style.top = Math.max(0, y) + "px";
    }
    let tooltipEl = document.querySelector(".app-tooltip");
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "app-tooltip";
      document.body.appendChild(tooltipEl);
    }
    function updateTooltip(el, text2, shortcut = "") {
      el.dataset.tooltip = text2;
      if (shortcut)
        el.dataset.shortcut = shortcut;
      el.title = text2 + (shortcut ? " (" + shortcut + ")" : "");
    }
    function attachTooltip(el, text2, shortcut = "", side = "right") {
      updateTooltip(el, text2, shortcut);
      let timer;
      el.addEventListener("mouseenter", () => {
        const currentText = el.dataset.tooltip || el.title;
        const currentShortcut = el.dataset.shortcut || "";
        if (!currentText)
          return;
        timer = setTimeout(() => {
          tooltipEl.innerHTML = currentText + (currentShortcut ? '<span class="tooltip-shortcut">' + currentShortcut + "</span>" : "");
          tooltipEl.style.visibility = "hidden";
          tooltipEl.style.display = "block";
          tooltipEl.style.left = "-9999px";
          tooltipEl.style.top = "-9999px";
          tooltipEl.style.transform = "none";
          tooltipEl.classList.add("visible");
          const tipWidth = tooltipEl.offsetWidth || 100;
          const tipHeight = tooltipEl.offsetHeight || 24;
          const rect = el.getBoundingClientRect();
          const pad = 6;
          const viewWidth = window.innerWidth || document.documentElement.clientWidth;
          const viewHeight = window.innerHeight || document.documentElement.clientHeight;
          let tipLeft;
          let tipTop;
          if (side === "bottom") {
            tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
            tipTop = rect.bottom + 6;
            if (tipTop + tipHeight > viewHeight - pad && rect.top - tipHeight - 6 >= pad) {
              tipTop = rect.top - tipHeight - 6;
              tooltipEl.classList.remove("side-bottom");
              tooltipEl.classList.add("side-top");
            } else {
              tooltipEl.classList.remove("side-top");
              tooltipEl.classList.add("side-bottom");
            }
          } else if (side === "right") {
            tipLeft = rect.right + 7;
            tipTop = rect.top + rect.height / 2 - tipHeight / 2;
            if (tipLeft + tipWidth > viewWidth - pad && rect.left - tipWidth - 7 >= pad) {
              tipLeft = rect.left - tipWidth - 7;
              tooltipEl.classList.remove("side-right");
              tooltipEl.classList.add("side-left");
            } else {
              tooltipEl.classList.remove("side-left");
              tooltipEl.classList.add("side-right");
            }
          } else {
            tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
            tipTop = rect.bottom + 6;
          }
          if (tipLeft < pad) {
            tipLeft = pad;
          } else if (tipLeft + tipWidth > viewWidth - pad) {
            tipLeft = Math.max(pad, viewWidth - tipWidth - pad);
          }
          if (tipTop < pad) {
            tipTop = pad;
          } else if (tipTop + tipHeight > viewHeight - pad) {
            tipTop = Math.max(pad, viewHeight - tipHeight - pad);
          }
          tooltipEl.style.left = Math.round(tipLeft) + "px";
          tooltipEl.style.top = Math.round(tipTop) + "px";
          tooltipEl.style.transform = "none";
          tooltipEl.style.visibility = "visible";
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
    if (!container._repoFolderStates) {
      container._repoFolderStates = /* @__PURE__ */ new Map();
    }
    if (!container._sectionCollapseState) {
      container._sectionCollapseState = /* @__PURE__ */ new Map();
    }
    const sectionCollapseState = container._sectionCollapseState;
    const svgArrowRight = '<svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M6 3.5L10.5 8L6 12.5"/></svg>';
    const svgArrowDown = '<svg class="tree-arrow-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M3.5 6L8 10.5L12.5 6"/></svg>';
    const svgTagIcon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;color:#dfe1e5;"><path d="M7.707 2.293L1.295 8.705C0.904 9.096 0.904 9.729 1.295 10.119L5.881 14.705C6.271 15.096 6.904 15.096 7.295 14.705L13.707 8.293C13.895 8.105 14 7.851 14 7.586V3C14 2.448 13.552 2 13 2H8.414C8.149 2 7.895 2.105 7.707 2.293Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="10.2" cy="5.8" r="1.3" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>';
    const svgCheckoutYellow = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.70708 2.29289L1.29497 8.705C0.904444 9.09553 0.904444 9.72869 1.29497 10.1192L5.88075 14.705C6.27128 15.0955 6.90444 15.0955 7.29497 14.705L13.7071 8.29289C13.8946 8.10536 14 7.851 14 7.58579V3C14 2.44772 13.5523 2 13 2H8.41418C8.14897 2 7.89461 2.10536 7.70708 2.29289ZM10 8C11.1046 8 12 7.10457 12 6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6C8 7.10457 8.89543 8 10 8Z" fill="#F2C55C"/></svg>';
    const svgBranchWhite = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;color:#dfe1e5;"><circle cx="4.5" cy="4.5" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="10.8" cy="6.2" r="1.8" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="4.5" y1="6.3" x2="4.5" y2="14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M4.5 9.8H9.3C10.13 9.8 10.8 9.13 10.8 8.3V8.0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
    function populateTree(searchQuery) {
      if (!treeContent)
        return;
      treeContent.innerHTML = "";
      const currentActive2 = container._selectedTreeBranch !== void 0 && container._selectedTreeBranch !== null ? container._selectedTreeBranch : getActiveBranch() || "";
      const latestData = getBranchData() || {};
      const branches2 = latestData.branches || [];
      const tags2 = latestData.tags || [];
      const currentBranch2 = latestData.currentBranch || "";
      const currentRepoKey = latestData.repoPath || window.__GIT_REPO_PATH__ || "default_repo";
      if (!container._repoFolderStates.has(currentRepoKey)) {
        const repoMap = /* @__PURE__ */ new Map();
        try {
          const raw = localStorage.getItem("intellij_git_folders_" + currentRepoKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            Object.keys(parsed).forEach((k) => repoMap.set(k, parsed[k]));
          }
        } catch {
        }
        container._repoFolderStates.set(currentRepoKey, repoMap);
      }
      const folderCollapseState2 = container._repoFolderStates.get(currentRepoKey);
      const query = (searchQuery !== void 0 ? searchQuery : sInput ? sInput.value : "").toLowerCase().trim();
      const filterFn = (name) => {
        if (query && !name.toLowerCase().includes(query))
          return false;
        return true;
      };
      function createSec(title, isOpenDefault = true) {
        const sec = document.createElement("div");
        sec.className = "tree-section";
        const hdr = document.createElement("div");
        hdr.className = "tree-section-header";
        const isCollapsed = sectionCollapseState.has(title) ? sectionCollapseState.get(title) : !isOpenDefault;
        hdr.innerHTML = '<span class="arrow">' + (isCollapsed ? svgArrowRight : svgArrowDown) + '</span> <span style="color:#ffffff;">' + title + "</span>";
        const bdy = document.createElement("div");
        bdy.className = "tree-section-body";
        bdy.style.display = isCollapsed ? "none" : "block";
        hdr.addEventListener("click", (e) => {
          e.stopPropagation();
          const isNowCollapsed = bdy.style.display !== "none";
          bdy.style.display = isNowCollapsed ? "none" : "block";
          const arrow = hdr.querySelector(".arrow");
          if (arrow)
            arrow.innerHTML = isNowCollapsed ? svgArrowRight : svgArrowDown;
          sectionCollapseState.set(title, isNowCollapsed);
        });
        sec.appendChild(hdr);
        sec.appendChild(bdy);
        return { sec, bdy };
      }
      function selectBranch(name) {
        container._selectedTreeBranch = name;
        if (container._updateStarBtn) {
          container._updateStarBtn();
        }
        populateTree();
      }
      function openBranchLog(name) {
        container._selectedTreeBranch = name;
        setActiveBranch(name);
        onFilter({ branch: name });
        if (container._updateStarBtn) {
          container._updateStarBtn();
        }
        populateTree();
      }
      function getTrackingHtml(b) {
        if (!b)
          return "";
        let trackHtml = "";
        if (b.behind || b.ahead) {
          trackHtml = '<span class="branch-track" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;font-size:11px;font-family:var(--vscode-editor-font-family, monospace);">';
          if (b.behind) {
            const behindTxt = "Behind remote by " + b.behind + " commit" + (b.behind > 1 ? "s" : "");
            trackHtml += '<span class="track-badge behind" style="color:#58a6ff;display:inline-flex;align-items:center;gap:1px;cursor:default;" data-tooltip="' + behindTxt + '" title="' + behindTxt + '">\u2199 ' + b.behind + "</span>";
          }
          if (b.ahead) {
            const aheadTxt = "Ahead of remote by " + b.ahead + " commit" + (b.ahead > 1 ? "s" : "");
            trackHtml += '<span class="track-badge ahead" style="color:#3fb950;display:inline-flex;align-items:center;gap:1px;cursor:default;" data-tooltip="' + aheadTxt + '" title="' + aheadTxt + '">\u2197 ' + b.ahead + "</span>";
          }
          trackHtml += "</span>";
        }
        return trackHtml;
      }
      if (currentBranch2 && (!query || currentBranch2.toLowerCase().includes(query) || "head (current branch)".includes(query))) {
        const headBox = document.createElement("div");
        headBox.className = "head-branch-box" + (currentActive2 === "HEAD" ? " active" : "");
        const curInfo = branches2.find((b) => b.name === currentBranch2);
        headBox.innerHTML = '<span class="head-title" style="display:inline-flex;align-items:center;gap:4px;">HEAD (Current Branch)</span>';
        headBox.title = "HEAD (" + currentBranch2 + ")";
        headBox.addEventListener("click", () => selectBranch("HEAD"));
        headBox.addEventListener("dblclick", () => openBranchLog("HEAD"));
        headBox.addEventListener("contextmenu", (e) => {
          selectBranch("HEAD");
          showBranchContextMenu(e, currentBranch2);
        });
        treeContent.appendChild(headBox);
      }
      function createTreeNode(name = "", fullPath = "") {
        return { name, fullPath, folders: {}, branches: [] };
      }
      function insertBranchIntoTree(root7, parts, branchObj) {
        if (branchObj.name.startsWith("(") || branchObj.name.startsWith("HEAD")) {
          root7.branches.push({ ...branchObj, leafName: branchObj.name });
          return;
        }
        let current = root7;
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
      function hasCurrentBranchInNode(n) {
        if (!n || !currentBranch2)
          return false;
        if (n.branches && n.branches.some((b) => b.name === currentBranch2))
          return true;
        if (n.folders) {
          for (const k in n.folders) {
            if (hasCurrentBranchInNode(n.folders[k]))
              return true;
          }
        }
        return false;
      }
      function hasFavoriteInNode(n) {
        if (!n)
          return false;
        if (n.branches && n.branches.some((b) => isBranchFavorite(b.name)))
          return true;
        if (n.folders) {
          for (const k in n.folders) {
            if (hasFavoriteInNode(n.folders[k]))
              return true;
          }
        }
        return false;
      }
      function renderTreeLevel(lvlContainer, node, isRemoteTree = false) {
        const hasSiblingFolders = !!(node.folders && Object.keys(node.folders).length > 0);
        function renderBranchItem(b) {
          const item = document.createElement("div");
          item.className = "tree-item" + (currentActive2 === b.name ? " active" : "") + (b.name === currentBranch2 ? " current-head" : "");
          const isCur = b.name === currentBranch2;
          const isFav = isBranchFavorite(b.name);
          let icon = "";
          if (isFav) {
            icon = '<span class="tree-item-icon tree-item-star-slot is-fav" title="Favorite" style="cursor:pointer;color:#e5a50a;font-size:14px;line-height:1;display:inline-flex;align-items:center;justify-content:center;">\u2605</span>';
          } else if (isCur) {
            icon = '<span class="tree-item-icon">' + svgCheckoutYellow + "</span>";
          } else {
            icon = '<span class="tree-item-icon">' + svgBranchWhite + "</span>";
          }
          const spacer = hasSiblingFolders ? '<span class="arrow spacer" style="visibility:hidden;pointer-events:none;width:16px;height:16px;min-width:16px;display:inline-flex;flex-shrink:0;"></span>' : "";
          const trackHtml = getTrackingHtml(b);
          item.innerHTML = spacer + icon + '<span class="branch-name" style="' + (isCur ? "font-weight:600;" : "") + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + b.leafName + "</span>" + trackHtml;
          item.title = b.name;
          item.addEventListener("click", () => selectBranch(b.name));
          item.addEventListener("dblclick", () => openBranchLog(b.name));
          item.addEventListener("contextmenu", (e) => {
            selectBranch(b.name);
            showBranchContextMenu(e, b.name);
          });
          const starEl = item.querySelector(".tree-item-star-slot");
          if (starEl) {
            starEl.addEventListener("click", (e) => {
              e.stopPropagation();
              toggleBranchFavorite(b.name);
              if (container && container._updateStarBtn)
                container._updateStarBtn();
              populateTree();
            });
          }
          lvlContainer.appendChild(item);
        }
        function renderFolderItem(fk) {
          const subNode = node.folders[fk];
          const fDiv = document.createElement("div");
          fDiv.className = "tree-folder";
          const fHdr = document.createElement("div");
          fHdr.className = "tree-folder-header";
          const folderIconSvg = '<span class="tree-item-icon"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block;"><path d="M8.10584 4.34613L8.25344 4.5H8.46667H13C13.8284 4.5 14.5 5.17157 14.5 6V12.1333C14.5 12.9529 13.932 13.5 13.3667 13.5H2.63333C2.06804 13.5 1.5 12.9529 1.5 12.1333V3.86667C1.5 3.04707 2.06804 2.5 2.63333 2.5H6.1217C6.25792 2.5 6.38824 2.55557 6.48253 2.65387L8.10584 4.34613Z" fill="#43454A" stroke="#FFFFFF" stroke-width="1.1"/></svg></span>';
          const isFolderCollapsed = query ? false : folderCollapseState2.has(subNode.fullPath) ? folderCollapseState2.get(subNode.fullPath) : !hasCurrentBranchInNode(subNode);
          fHdr.innerHTML = '<span class="arrow">' + (isFolderCollapsed ? svgArrowRight : svgArrowDown) + "</span>" + folderIconSvg + '<span class="folder-name" style="color:#ffffff;">' + fk + "</span>";
          const fBdy = document.createElement("div");
          fBdy.className = "tree-folder-body";
          fBdy.style.display = isFolderCollapsed ? "none" : "block";
          fHdr.addEventListener("click", (e) => {
            e.stopPropagation();
            const isNowCollapsed = fBdy.style.display !== "none";
            fBdy.style.display = isNowCollapsed ? "none" : "block";
            const arrow = fHdr.querySelector(".arrow");
            if (arrow)
              arrow.innerHTML = isNowCollapsed ? svgArrowRight : svgArrowDown;
            folderCollapseState2.set(subNode.fullPath, isNowCollapsed);
            try {
              const obj = {};
              folderCollapseState2.forEach((val, key2) => {
                obj[key2] = val;
              });
              localStorage.setItem("intellij_git_folders_" + currentRepoKey, JSON.stringify(obj));
            } catch {
            }
          });
          if (isRemoteTree) {
            fHdr.addEventListener("contextmenu", (e) => {
              e.preventDefault();
              e.stopPropagation();
              closeBranchContextMenu();
              const locals = branches2.filter((b) => !b.remote && !b.name.startsWith("("));
              const slashIdx = subNode.fullPath.indexOf("/");
              const isRootRemote = slashIdx === -1;
              const remoteName = isRootRemote ? subNode.fullPath : subNode.fullPath.slice(0, slashIdx);
              const folderSubPath = isRootRemote ? "" : subNode.fullPath.slice(slashIdx + 1);
              const targetLocals = isRootRemote ? locals : locals.filter((b) => b.name === folderSubPath || b.name.startsWith(folderSubPath + "/"));
              const allTracked = targetLocals.length > 0 && targetLocals.every((b) => {
                const expectedUpstream = remoteName + "/" + b.name;
                return b.upstream === expectedUpstream;
              });
              const menu = document.createElement("div");
              menu.className = "branch-context-menu";
              menu.setAttribute("data-vscode-context", JSON.stringify({ preventDefaultContextMenuItems: true }));
              menu.addEventListener("contextmenu", (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
              });
              if (isRootRemote) {
                const itFetch = document.createElement("div");
                itFetch.className = "bcm-item";
                itFetch.innerHTML = "<span>Fetch '" + remoteName + "'</span>";
                itFetch.addEventListener("click", (ev) => {
                  ev.stopPropagation();
                  closeBranchContextMenu();
                  showToast("Fetching remote '" + remoteName + "'...");
                  postMessage("fetchRemote", { remote: remoteName });
                });
                menu.appendChild(itFetch);
              }
              const itAll = document.createElement("div");
              itAll.className = "bcm-item" + (allTracked ? " disabled" : "");
              if (allTracked) {
                itAll.style.pointerEvents = "none";
                itAll.style.opacity = "0.45";
              }
              const labelText = isRootRemote ? "Track All Local Branches to '" + remoteName + "'" : "Track '" + subNode.fullPath + "' for '" + folderSubPath + "'";
              itAll.innerHTML = "<span>" + labelText + (allTracked ? " (already tracked)" : "") + "</span>";
              itAll.addEventListener("click", (ev) => {
                if (allTracked)
                  return;
                ev.stopPropagation();
                closeBranchContextMenu();
                showToast("Tracking " + (isRootRemote ? "all local branches" : "'" + folderSubPath + "'") + " to '" + remoteName + "'...");
                postMessage("trackAllBranchesToRemote", { remote: remoteName, prefix: folderSubPath || void 0 });
              });
              menu.appendChild(itAll);
              document.body.appendChild(menu);
              let x = e.clientX;
              let y = e.clientY;
              const rect = menu.getBoundingClientRect();
              if (x + rect.width > window.innerWidth - 8)
                x = Math.max(8, window.innerWidth - rect.width - 8);
              if (y + rect.height > window.innerHeight - 8) {
                const yAbove = e.clientY - rect.height;
                if (yAbove >= 8)
                  y = yAbove;
                else
                  y = Math.max(4, window.innerHeight - rect.height - 8);
              }
              menu.style.left = Math.max(0, x) + "px";
              menu.style.top = Math.max(0, y) + "px";
            });
          }
          fDiv.appendChild(fHdr);
          renderTreeLevel(fBdy, subNode, isRemoteTree);
          fDiv.appendChild(fBdy);
          lvlContainer.appendChild(fDiv);
        }
        const curBranchObj = node.branches.find((b) => b.name === currentBranch2);
        if (curBranchObj) {
          renderBranchItem(curBranchObj);
        }
        const allFolderKeys = Object.keys(node.folders);
        const curFolders = allFolderKeys.filter((k) => hasCurrentBranchInNode(node.folders[k])).sort((a, b) => a.localeCompare(b));
        for (const fk of curFolders) {
          renderFolderItem(fk);
        }
        const favBranches = node.branches.filter((b) => isBranchFavorite(b.name) && b.name !== currentBranch2).sort((a, b) => a.leafName.localeCompare(b.leafName));
        for (const b of favBranches) {
          renderBranchItem(b);
        }
        const favFolders = allFolderKeys.filter((k) => !hasCurrentBranchInNode(node.folders[k]) && hasFavoriteInNode(node.folders[k])).sort((a, b) => a.localeCompare(b));
        for (const fk of favFolders) {
          renderFolderItem(fk);
        }
        const otherFolders = allFolderKeys.filter((k) => !hasCurrentBranchInNode(node.folders[k]) && !hasFavoriteInNode(node.folders[k])).sort((a, b) => a.localeCompare(b));
        for (const fk of otherFolders) {
          renderFolderItem(fk);
        }
        const nonFavBranches = node.branches.filter((b) => !isBranchFavorite(b.name) && b.name !== currentBranch2).sort((a, b) => a.leafName.localeCompare(b.leafName));
        for (const b of nonFavBranches) {
          renderBranchItem(b);
        }
      }
      const localList = branches2.filter((b) => !b.remote && !b.name.startsWith("origin/") && !b.name.startsWith("(") && !b.name.includes("detached") && filterFn(b.name));
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
      const configuredRemotes = latestData.remotes || [];
      const remoteList = branches2.filter((b) => (b.remote || b.name.startsWith("origin/") || configuredRemotes.some((r2) => b.name.startsWith(r2 + "/"))) && b.name.includes("/") && !b.name.endsWith("/HEAD")).filter((b) => filterFn(b.name));
      if (remoteList.length > 0) {
        const remoteSec = createSec("Remote", true);
        const remoteTree = createTreeNode();
        for (const b of remoteList) {
          const parts = b.name.split("/");
          insertBranchIntoTree(remoteTree, parts, { ...b, remote: true });
        }
        renderTreeLevel(remoteSec.bdy, remoteTree, true);
        treeContent.appendChild(remoteSec.sec);
      }
      if (tags2.length > 0) {
        const tagSec = createSec("Tags", false);
        for (const t of tags2.filter((t2) => filterFn(t2.name))) {
          const item = document.createElement("div");
          item.className = "tree-item" + (currentActive2 === t.name ? " active" : "");
          item.innerHTML = '<span class="arrow spacer" style="visibility:hidden;pointer-events:none;"></span><span class="tree-item-icon">' + svgTagIcon + "</span><span>" + t.name + "</span>";
          item.addEventListener("click", () => selectBranch(t.name));
          item.addEventListener("dblclick", () => openBranchLog(t.name));
          tagSec.bdy.appendChild(item);
        }
        treeContent.appendChild(tagSec.sec);
      }
      if (localList.length === 0 && remoteList.length === 0 && (!tags2 || tags2.filter((t) => filterFn(t.name)).length === 0) && (!currentBranch2 || !filterFn(currentBranch2))) {
        const emptyEl = document.createElement("div");
        emptyEl.style.cssText = "padding:16px 12px;text-align:center;color:var(--vscode-descriptionForeground);font-size:12px;";
        emptyEl.textContent = query ? 'No branches matching "' + query + '"' : "No branches";
        treeContent.appendChild(emptyEl);
      }
      treeContent.querySelectorAll(".track-badge").forEach((badge) => {
        attachTooltip(badge, badge.dataset.tooltip || badge.title || "", "", "bottom");
      });
      if (container._updateStarBtn)
        container._updateStarBtn();
      if (container._updateExitBtn)
        container._updateExitBtn();
      container._populateTree = populateTree;
    }
    if (!strip || !mainArea || !sInput || !treeContent) {
      let addStripBtn = function(iconSvg, title, onClick, extraClass = "", shortcut = "") {
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
      }, updateStarBtn = function() {
        if (!starBtn)
          return;
        const sel = container._selectedTreeBranch || getActiveBranch();
        const target = sel === "HEAD" ? getCurrentBranchName() : sel || getCurrentBranchName();
        const fav = isBranchFavorite(target);
        starBtn.innerHTML = fav ? starFilledSvg : starOutlineSvg;
        starBtn.classList.toggle("active", fav);
        if (target) {
          updateTooltip(starBtn, fav ? "Remove '" + target + "' from Favorites (\u2605)" : "Add '" + target + "' to Favorites (\u2605)");
        } else {
          updateTooltip(starBtn, "Favorite / Unfavorite Selected Branch (\u2605)");
        }
      }, updateExitBtn = function() {
        if (!exitRepoBtn)
          return;
        const latestData = getBranchData() || {};
        const isSub = !!(latestData.isSubRepo || window.__IS_SUB_REPO__);
        exitRepoBtn.style.display = isSub ? "flex" : "none";
      };
      container.innerHTML = "";
      strip = document.createElement("div");
      strip.className = "sidebar-strip";
      const collapseSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      const expandSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
      const isCollapsed = container.classList.contains("collapsed");
      const collapseBtn = addStripBtn(isCollapsed ? expandSvg : collapseSvg, isCollapsed ? "Expand Branches" : "Collapse Branches", (btn) => {
        container.classList.toggle("collapsed");
        const coll = container.classList.contains("collapsed");
        btn.innerHTML = coll ? expandSvg : collapseSvg;
        updateTooltip(btn, coll ? "Expand Branches" : "Collapse Branches");
      });
      addStripBtn('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>', "New Branch...", () => {
        const base = container._selectedTreeBranch || getActiveBranch() || getCurrentBranchName() || "HEAD";
        openCreateBranchDialog(base);
      }, "", "+");
      addStripBtn('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>', "Update Selected Branch", () => {
        const target = container._selectedTreeBranch || getActiveBranch() || getCurrentBranchName();
        if (target) {
          showToast("Updating '" + target + "'...");
          postMessage("pull", target);
        }
      }, "", "Fetch/Pull");
      addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>', "Delete Selected Branch", () => {
        const target = container._selectedTreeBranch || getActiveBranch();
        if (target && target !== getCurrentBranchName()) {
          postMessage("deleteBranch", target);
        }
      }, "", "Delete");
      addStripBtn('<svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.85355 8.14645C5.65829 7.95118 5.34171 7.95118 5.14645 8.14645C4.95118 8.34171 4.95118 8.65829 5.14645 8.85355L7.29289 11H0.5C0.223858 11 0 11.2239 0 11.5C0 11.7761 0.223858 12 0.5 12H7.29289L5.14645 14.1464C4.95118 14.3417 4.95118 14.6583 5.14645 14.8536C5.34171 15.0488 5.65829 15.0488 5.85355 14.8536L8.85355 11.8536L9.20711 11.5L8.85355 11.1464L5.85355 8.14645Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.1464 1.14645C10.3417 0.951184 10.6583 0.951184 10.8536 1.14645C11.0488 1.34171 11.0488 1.65829 10.8536 1.85355L8.70711 4H15.5C15.7761 4 16 4.22386 16 4.5C16 4.77614 15.7761 5 15.5 5H8.70711L10.8536 7.14645C11.0488 7.34171 11.0488 7.65829 10.8536 7.85355C10.6583 8.04882 10.3417 8.04882 10.1464 7.85355L7.14645 4.85355L6.79289 4.5L7.14645 4.14645L10.1464 1.14645Z" fill="currentColor"/></svg>', "Compare with Current Branch", () => {
        const target = container._selectedTreeBranch || getActiveBranch();
        const cur = getCurrentBranchName();
        if (target) {
          postMessage("compareBranch", { branch: target, withBranch: cur });
        }
      }, "", "Compare");
      addStripBtn('<svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="display:block;"><path d="M12.8536 3.14645C13.0488 3.34171 13.0488 3.65829 12.8536 3.85355L11.4393 5.26777C11.2441 5.46303 10.9275 5.46303 10.7322 5.26777C10.537 5.0725 10.537 4.75592 10.7322 4.56066L12.1464 3.14645C12.3417 2.95118 12.6583 2.95118 12.8536 3.14645Z" fill="currentColor"/><path d="M10.0251 5.97487C10.2204 6.17014 10.2204 6.48672 10.0251 6.68198L8.61091 8.09619C8.41565 8.29146 8.09907 8.29146 7.90381 8.09619C7.70854 7.90093 7.70854 7.58435 7.90381 7.38909L9.31802 5.97487C9.51328 5.77961 9.82986 5.77961 10.0251 5.97487Z" fill="currentColor"/><path d="M7.1967 8.8033C7.39196 8.99856 7.39196 9.31515 7.1967 9.51041L5.78249 10.9246C5.58722 11.1199 5.27064 11.1199 5.07538 10.9246C4.88012 10.7294 4.88012 10.4128 5.07538 10.2175L6.48959 8.8033C6.68485 8.60804 7.00144 8.60804 7.1967 8.8033Z" fill="currentColor"/><path d="M3.5 5C3.77614 5 4 5.22386 4 5.5V7.5C4 7.77614 3.77614 8 3.5 8C3.22386 8 3 7.77614 3 7.5V5.5C3 5.22386 3.22386 5 3.5 5Z" fill="currentColor"/><path d="M3.5 9C3.77614 9 4 9.22386 4 9.5V12H6.5C6.77614 12 7 12.2239 7 12.5C7 12.7761 6.77614 13 6.5 13H3.5C3.22386 13 3 12.7761 3 12.5V9.5C3 9.22386 3.22386 9 3.5 9Z" fill="currentColor"/><path d="M8 12.5C8 12.2239 8.22386 12 8.5 12H10.5C10.7761 12 11 12.2239 11 12.5C11 12.7761 10.7761 13 10.5 13H8.5C8.22386 13 8 12.7761 8 12.5Z" fill="currentColor"/></svg>', "Fetch All Remotes", () => {
        postMessage("fetchAll");
      }, "", "git fetch --all");
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
      addStripBtn('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>', "Expand / Collapse All Folders", () => {
        const bodies = treeContent.querySelectorAll(".tree-section-body, .tree-folder-body");
        let anyOpen = false;
        bodies.forEach((b) => {
          if (b.style.display !== "none")
            anyOpen = true;
        });
        const shouldOpen = !anyOpen;
        bodies.forEach((b) => {
          b.style.display = shouldOpen ? "block" : "none";
        });
        treeContent.querySelectorAll(".arrow").forEach((a) => {
          a.innerHTML = shouldOpen ? svgArrowDown : svgArrowRight;
        });
        folderCollapseState.forEach((_, k) => folderCollapseState.set(k, !shouldOpen));
        sectionCollapseState.forEach((_, k) => sectionCollapseState.set(k, !shouldOpen));
      });
      const starOutlineSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
      const starFilledSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#e5a50a" stroke="#e5a50a" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
      let starBtn = addStripBtn(starOutlineSvg, "Favorite / Unfavorite Selected Branch (\u2605)", () => {
        const sel = container._selectedTreeBranch || getActiveBranch();
        const target = sel === "HEAD" ? getCurrentBranchName() : sel || getCurrentBranchName();
        if (!target)
          return;
        toggleBranchFavorite(target);
        updateStarBtn();
        populateTree();
      }, "", "Favorite");
      container._updateStarBtn = updateStarBtn;
      updateStarBtn();
      const keyOutlinedSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 2.5 2.5"></path><path d="m18.5 4.5 2.5 2.5"></path><circle cx="7.5" cy="15.5" r="1.5"></circle></svg>';
      addStripBtn(keyOutlinedSvg, "Git Remote Logins & Credentials", () => {
        postMessage("openAuthDialog");
      }, "", "Git Log In");
      const exitDoorSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';
      const exitRepoBtn = addStripBtn(exitDoorSvg, "Exit Repository (Choose Another Repo)", () => {
        postMessage("exitSubRepo");
      }, "exit-subrepo-btn", "Exit");
      exitRepoBtn.style.marginTop = "auto";
      container._updateExitBtn = updateExitBtn;
      updateExitBtn();
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
      treeContent.addEventListener("contextmenu", (e) => {
        const item = e.target.closest(".tree-item, .head-branch-box");
        if (!item) {
          e.preventDefault();
          e.stopPropagation();
          showGeneralBranchContextMenu(e);
        }
      });
      mainArea.appendChild(treeContent);
      mainArea.addEventListener("contextmenu", (e) => {
        const item = e.target.closest(".tree-item, .head-branch-box");
        if (!item) {
          e.preventDefault();
          e.stopPropagation();
          showGeneralBranchContextMenu(e);
        }
      });
      container.appendChild(mainArea);
    }
    populateTree();
  }

  // webview/graph/App.svelte
  var root6 = from_html(`<div class="loading svelte-1lrl78g">Loading commits...</div>`);
  var root_15 = from_html(`<button class="no-git-btn primary" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 16px;border-radius:4px;background:#2e436e;color:#ffffff;border:1px solid #3e5b94;font-size:12px;font-weight:500;cursor:pointer;width:100%;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v12"></path><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg> </button>`);
  var root_24 = from_html(`<div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:0.5px;">Detected Git repository in subfolder:</div> <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;width:100%;max-width:360px;"></div>`, 1);
  var root_33 = from_html(`<div class="no-git-container svelte-1lrl78g"><div style="display:flex;flex-direction:column;align-items:center;width:100%;max-width:440px;margin:auto 0;padding:12px 0;flex-shrink:0;"><div><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d29922" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div> <div style="font-size:16px;font-weight:600;margin:14px 0 6px;">No Git Repository Found</div> <div style="font-size:12px;color:var(--vscode-descriptionForeground);max-width:440px;line-height:1.5;margin-bottom:20px;"> </div> <!> <button class="no-git-btn secondary" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:4px;background:var(--vscode-button-secondaryBackground, #3a3d41);color:var(--vscode-button-secondaryForeground, #ffffff);border:1px solid rgba(255,255,255,0.1);font-size:12px;cursor:pointer;flex-shrink:0;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Initialize Git Repository Here (git init)</button></div></div>`);
  var root_43 = from_html(`<div class="empty svelte-1lrl78g">No commits found.</div>`);
  var root_52 = from_html(`<div class="detail-splitter svelte-1lrl78g"></div> <div class="detail-panel svelte-1lrl78g"><button class="detail-close-btn svelte-1lrl78g" title="Close Details (Esc)"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5L10.5 10.5M1.5 10.5L10.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button> <!></div>`, 1);
  var root_6 = from_html(`<div class="app svelte-1lrl78g"><!> <div class="main-area svelte-1lrl78g"><div class="branch-sidebar svelte-1lrl78g"></div> <div class="branch-splitter svelte-1lrl78g"></div> <div class="center-area svelte-1lrl78g"><!></div> <!></div></div>`);
  var $$css6 = {
    hash: "svelte-1lrl78g",
    code: `.app.svelte-1lrl78g {position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;overflow:hidden;}.loading.svelte-1lrl78g, .empty.svelte-1lrl78g {padding:20px;text-align:center;color:var(--vscode-descriptionForeground);}.main-area.svelte-1lrl78g {display:flex;flex:1;min-height:0;overflow:hidden;position:relative;}.branch-sidebar.svelte-1lrl78g {width:260px;min-width:140px;background:var(--vscode-sideBar-background, #1e1e1e);overflow:hidden;display:flex;flex-direction:row;flex-shrink:0;user-select:none;font-size:1em;transition:width 0.12s ease;}.branch-splitter.svelte-1lrl78g {width:1px;cursor:col-resize;flex-shrink:0;background:transparent;z-index:10;user-select:none;position:relative;}.branch-splitter.svelte-1lrl78g::before {content:'';position:absolute;top:0;bottom:0;left:-4px;right:-4px;cursor:col-resize;z-index:1;}.branch-splitter.svelte-1lrl78g:hover {background:transparent !important;}.center-area.svelte-1lrl78g {flex:1;min-height:0;position:relative;}.detail-panel.svelte-1lrl78g {position:relative;width:300px;min-width:180px;overflow-y:auto;flex-shrink:0;box-sizing:border-box;}.detail-panel.svelte-1lrl78g::-webkit-scrollbar {width:6px;height:6px;}.detail-panel.svelte-1lrl78g::-webkit-scrollbar-track {background:transparent;}.detail-panel.svelte-1lrl78g::-webkit-scrollbar-thumb {background:rgba(255,255,255,0.18);border-radius:3px;}.detail-panel.svelte-1lrl78g::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35);}.detail-splitter.svelte-1lrl78g {width:1px;cursor:col-resize;flex-shrink:0;background:var(--vscode-panel-border, #393b40);z-index:10;user-select:none;position:relative;transition:background 0.15s ease;}.detail-splitter.svelte-1lrl78g::before {content:"";position:absolute;top:0;bottom:0;left:-3px;right:-3px;cursor:col-resize;z-index:1;}.detail-splitter.svelte-1lrl78g:hover {background:var(--vscode-focusBorder, #3574f0) !important;}.detail-close-btn.svelte-1lrl78g {position:absolute;top:8px;right:8px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:4px;color:var(--vscode-foreground, #cccccc);opacity:0.7;cursor:pointer;z-index:10;transition:all 0.15s ease;padding:0;}.detail-close-btn.svelte-1lrl78g:hover {opacity:1;background:var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.12));}.no-git-container.svelte-1lrl78g {position:absolute;top:0;left:0;right:0;bottom:0;background:var(--vscode-editor-background);z-index:50;display:flex;flex-direction:column;align-items:center;overflow-y:auto;overflow-x:hidden;height:100%;box-sizing:border-box;user-select:none;padding:32px 16px;text-align:center;color:var(--vscode-foreground);scrollbar-color:rgb(70, 62, 62) transparent !important;}.no-git-container.svelte-1lrl78g::-webkit-scrollbar {width:8px !important;height:8px !important;background:transparent !important;}.no-git-container.svelte-1lrl78g::-webkit-scrollbar-thumb {background:rgb(70, 62, 62) !important;border-radius:4px !important;}.no-git-container.svelte-1lrl78g::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.35) !important;}`
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
    let branchData = state(proxy({ branches: [], tags: [], currentBranch: "" }));
    let activeBranch = state("");
    let noGitData = state(null);
    let hasInitializedActiveBranch = false;
    let selectedCommit = user_derived(() => get(commits).find((c) => c.hash === get(selectedHash)) || null);
    let branchSidebarEl;
    let branchSplitterEl;
    let detailPanelEl;
    let detailSplitterEl;
    let unsubscribe;
    function onSelectCommit(hash2) {
      set(selectedHash, hash2, true);
      set(selectedFiles, [], true);
      postMessage("selectCommit", hash2);
    }
    function onFilter2(filter) {
      set(loading, true);
      postMessage("filter", filter);
    }
    function onLoadMore() {
      postMessage("loadMore");
    }
    function onRebaseFromHere(hash2) {
      postMessage("rebaseFromHere", hash2);
    }
    onMount(() => {
      postMessage("ready");
      unsubscribe = onMessage((msg) => {
        switch (msg.type) {
          case "noGitRepo": {
            window.__IS_SUB_REPO__ = false;
            hasInitializedActiveBranch = false;
            set(loading, false);
            set(commits, [], true);
            set(selectedHash, null);
            set(selectedFiles, [], true);
            set(activeBranch, "");
            set(branchData, { branches: [], tags: [], currentBranch: "" }, true);
            set(noGitData, msg.payload, true);
            break;
          }
          case "showPushDialog": {
            openPushDialog(msg.payload);
            break;
          }
          case "pushSuccess": {
            if (activePushDialog) {
              activePushDialog.remove();
            }
            break;
          }
          case "showAuthDialog": {
            openGitAuthDialog(msg.payload);
            break;
          }
          case "authSuccess": {
            if (activeAuthDialog) {
              activeAuthDialog.remove();
            }
            break;
          }
          case "authError": {
            if (activeAuthDialog) {
              const errEl = activeAuthDialog.querySelector("#as-auth-error-msg");
              const submitBtn = activeAuthDialog.querySelector("#as-auth-submit");
              const spinner = activeAuthDialog.querySelector("#as-auth-spinner");
              const btnText = activeAuthDialog.querySelector("#as-auth-btn-text");
              if (errEl) {
                errEl.style.display = "block";
                errEl.textContent = msg.payload?.error || "Authentication failed. Please verify credentials.";
              }
              if (submitBtn)
                submitBtn.disabled = false;
              if (spinner)
                spinner.style.display = "none";
              if (btnText)
                btnText.textContent = "Log In";
            }
            break;
          }
          case "commits": {
            const p = msg.payload;
            if (p.currentUser) {
              window.__GIT_CURRENT_USER__ = p.currentUser;
            }
            if (p.currentBranch !== void 0) {
              window.__GIT_CURRENT_BRANCH__ = p.currentBranch;
            }
            if (p.isSubRepo !== void 0) {
              window.__IS_SUB_REPO__ = !!p.isSubRepo;
            }
            if (p.repoPath) {
              window.__GIT_REPO_PATH__ = p.repoPath;
            }
            document.querySelectorAll(".no-git-container").forEach((el) => el.remove());
            const seen2 = /* @__PURE__ */ new Set();
            const unique = [];
            if (p.commits) {
              for (const c of p.commits) {
                if (!seen2.has(c.hash)) {
                  seen2.add(c.hash);
                  unique.push(c);
                }
              }
            }
            const cEl = window.__commitListContainer__ || document.querySelector(".commit-list-container");
            const oldCommits = get(commits) || [];
            const ROW_HEIGHT = 25;
            let anchorHash = null;
            let anchorOffset = 0;
            const curSelected = get(selectedHash);
            if (cEl && oldCommits.length > 0) {
              const curScrollTop = cEl.scrollTop;
              const anchorRow = Math.max(0, Math.floor(curScrollTop / ROW_HEIGHT));
              if (oldCommits[anchorRow]) {
                anchorHash = oldCommits[anchorRow].hash;
                anchorOffset = curScrollTop - anchorRow * ROW_HEIGHT;
              }
            }
            let newIndex = -1;
            if (anchorHash) {
              newIndex = unique.findIndex((c) => c.hash === anchorHash);
            }
            if (newIndex === -1 && curSelected) {
              newIndex = unique.findIndex((c) => c.hash === curSelected);
              anchorOffset = 0;
            }
            set(noGitData, null);
            set(commits, unique, true);
            set(graphWidth, p.graphWidth, true);
            set(loading, false);
            if (cEl && unique.length > 0) {
              if (newIndex !== -1) {
                const targetScrollTop = newIndex * ROW_HEIGHT + anchorOffset;
                cEl.scrollTop = targetScrollTop;
                if (window.__commitListSetScrollTop__) {
                  window.__commitListSetScrollTop__(targetScrollTop);
                }
                requestAnimationFrame(() => {
                  if (cEl)
                    cEl.scrollTop = targetScrollTop;
                  if (window.__commitListSetScrollTop__) {
                    window.__commitListSetScrollTop__(targetScrollTop);
                  }
                });
              } else if (oldCommits.length > 0) {
                cEl.scrollTop = 0;
                if (window.__commitListSetScrollTop__) {
                  window.__commitListSetScrollTop__(0);
                }
                if (curSelected && !unique.some((c) => c.hash === curSelected) && unique[0]) {
                  onSelectCommit(unique[0].hash);
                }
              }
            }
            const sideEl = document.querySelector(".branch-sidebar");
            if (sideEl && sideEl._updateExitBtn)
              sideEl._updateExitBtn();
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
            if (msg.payload && msg.payload.currentUser) {
              window.__GIT_CURRENT_USER__ = msg.payload.currentUser;
            }
            if (msg.payload && msg.payload.currentBranch !== void 0) {
              window.__GIT_CURRENT_BRANCH__ = msg.payload.currentBranch;
            }
            if (msg.payload && msg.payload.isSubRepo !== void 0) {
              window.__IS_SUB_REPO__ = !!msg.payload.isSubRepo;
            }
            if (msg.payload && msg.payload.repoPath) {
              window.__GIT_REPO_PATH__ = msg.payload.repoPath;
            }
            set(branchData, msg.payload, true);
            if (!hasInitializedActiveBranch) {
              hasInitializedActiveBranch = true;
              if (msg.payload && msg.payload.activeBranch) {
                set(activeBranch, msg.payload.activeBranch, true);
              }
            }
            const sideEl = document.querySelector(".branch-sidebar");
            if (sideEl && sideEl._updateExitBtn)
              sideEl._updateExitBtn();
            if (sideEl && sideEl._updateStarBtn)
              sideEl._updateStarBtn();
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
      try {
        const savedW = localStorage.getItem("intellij_git_branch_sidebar_width");
        if (savedW && branchSidebarEl) {
          const w = parseInt(savedW, 10);
          if (w >= 140 && w <= 700) {
            branchSidebarEl.style.width = w + "px";
            branchSidebarEl.style.minWidth = w + "px";
          }
        }
      } catch (e) {
      }
      let isDraggingBranchSplitter = false;
      let startX = 0;
      let startWidth = 260;
      const onBranchSplitterDown = (e) => {
        if (!branchSidebarEl || branchSidebarEl.classList.contains("collapsed"))
          return;
        isDraggingBranchSplitter = true;
        startX = e.clientX;
        startWidth = branchSidebarEl.getBoundingClientRect().width;
        branchSplitterEl?.classList.add("active");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        branchSidebarEl.style.transition = "none";
        e.preventDefault();
      };
      const onBranchSplitterMove = (e) => {
        if (!isDraggingBranchSplitter || !branchSidebarEl)
          return;
        const dx = e.clientX - startX;
        const newWidth = Math.max(140, Math.min(700, startWidth + dx));
        branchSidebarEl.style.width = newWidth + "px";
        branchSidebarEl.style.minWidth = newWidth + "px";
        try {
          localStorage.setItem("intellij_git_branch_sidebar_width", String(newWidth));
        } catch (err) {
        }
      };
      const onBranchSplitterUp = () => {
        if (isDraggingBranchSplitter && branchSidebarEl) {
          isDraggingBranchSplitter = false;
          branchSplitterEl?.classList.remove("active");
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          branchSidebarEl.style.transition = "";
        }
      };
      branchSplitterEl?.addEventListener("mousedown", onBranchSplitterDown);
      window.addEventListener("mousemove", onBranchSplitterMove);
      window.addEventListener("mouseup", onBranchSplitterUp);
      const onKeyEscape = (e) => {
        if (e.key === "Escape" && get(selectedHash)) {
          set(selectedHash, null);
        }
      };
      window.addEventListener("keydown", onKeyEscape);
      return () => {
        branchSplitterEl?.removeEventListener("mousedown", onBranchSplitterDown);
        window.removeEventListener("mousemove", onBranchSplitterMove);
        window.removeEventListener("mouseup", onBranchSplitterUp);
        window.removeEventListener("keydown", onKeyEscape);
      };
    });
    onDestroy(() => {
      unsubscribe?.();
    });
    user_effect(() => {
      if (!branchSidebarEl)
        return;
      if (get(noGitData)) {
        branchSidebarEl.style.display = "none";
        if (branchSplitterEl)
          branchSplitterEl.style.display = "none";
      } else {
        branchSidebarEl.style.display = "";
        if (branchSplitterEl) {
          branchSplitterEl.style.display = branchSidebarEl.classList.contains("collapsed") ? "none" : "";
        }
        renderSidebarContent(branchSidebarEl, () => get(branchData), () => get(activeBranch), (b) => {
          set(activeBranch, b, true);
        });
      }
    });
    user_effect(() => {
      if (!get(selectedHash) || !detailSplitterEl || !detailPanelEl)
        return;
      try {
        const savedDW = localStorage.getItem("intellij_git_detail_panel_width");
        if (savedDW) {
          const dw = parseInt(savedDW, 10);
          if (dw >= 180 && dw <= 800) {
            detailPanelEl.style.width = dw + "px";
            detailPanelEl.style.minWidth = dw + "px";
          }
        }
      } catch (e) {
      }
      let isDraggingDetailSplitter = false;
      let startXDetail = 0;
      let startWidthDetail = 300;
      const onMouseMoveDetail = (e) => {
        if (!isDraggingDetailSplitter || !detailPanelEl)
          return;
        const dx = startXDetail - e.clientX;
        const newWidth = Math.max(180, Math.min(800, startWidthDetail + dx));
        detailPanelEl.style.width = newWidth + "px";
        detailPanelEl.style.minWidth = newWidth + "px";
        try {
          localStorage.setItem("intellij_git_detail_panel_width", String(newWidth));
        } catch (err) {
        }
      };
      const onMouseUpDetail = () => {
        if (isDraggingDetailSplitter && detailPanelEl) {
          isDraggingDetailSplitter = false;
          detailSplitterEl?.classList.remove("active");
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          detailPanelEl.style.transition = "";
          window.removeEventListener("mousemove", onMouseMoveDetail);
          window.removeEventListener("mouseup", onMouseUpDetail);
        }
      };
      const onMouseDownDetail = (e) => {
        isDraggingDetailSplitter = true;
        startXDetail = e.clientX;
        startWidthDetail = detailPanelEl.getBoundingClientRect().width;
        detailSplitterEl?.classList.add("active");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        detailPanelEl.style.transition = "none";
        window.addEventListener("mousemove", onMouseMoveDetail);
        window.addEventListener("mouseup", onMouseUpDetail);
        e.preventDefault();
      };
      detailSplitterEl.addEventListener("mousedown", onMouseDownDetail);
      return () => {
        detailSplitterEl?.removeEventListener("mousedown", onMouseDownDetail);
        window.removeEventListener("mousemove", onMouseMoveDetail);
        window.removeEventListener("mouseup", onMouseUpDetail);
      };
    });
    var div = root_6();
    var node = child(div);
    FilterBar(node, {
      get activeBranch() {
        return get(activeBranch);
      },
      get branchData() {
        return get(branchData);
      },
      get commits() {
        return get(commits);
      },
      get selectedHash() {
        return get(selectedHash);
      },
      onFilter: onFilter2,
      onRefresh: () => postMessage("refresh")
    });
    var div_1 = sibling(node, 2);
    var div_2 = child(div_1);
    bind_this(div_2, ($$value) => branchSidebarEl = $$value, () => branchSidebarEl);
    var div_3 = sibling(div_2, 2);
    bind_this(div_3, ($$value) => branchSplitterEl = $$value, () => branchSplitterEl);
    var div_4 = sibling(div_3, 2);
    var node_1 = child(div_4);
    {
      var consequent = ($$anchor2) => {
        var div_5 = root6();
        append($$anchor2, div_5);
      };
      var consequent_2 = ($$anchor2) => {
        var div_6 = root_33();
        var div_7 = child(div_6);
        var div_8 = sibling(child(div_7), 4);
        var text2 = only_child(div_8);
        var node_2 = sibling(div_8, 2);
        {
          var consequent_1 = ($$anchor3) => {
            var fragment = root_24();
            var div_9 = sibling(first_child(fragment), 2);
            each(div_9, 21, () => get(noGitData).subRepos, index, ($$anchor4, r2) => {
              var button = root_15();
              var text_1 = sibling(child(button));
              reset(button);
              template_effect(() => set_text(text_1, ` Open repository in "${get(r2).name ?? ""}"`));
              delegated("click", button, () => {
                window.__IS_SUB_REPO__ = true;
                set(noGitData, null);
                set(loading, true);
                postMessage("switchRepo", get(r2).path);
              });
              append($$anchor4, button);
            });
            reset(div_9);
            append($$anchor3, fragment);
          };
          if_block(node_2, ($$render) => {
            if (get(noGitData).subRepos && get(noGitData).subRepos.length > 0)
              $$render(consequent_1);
          });
        }
        var button_1 = sibling(node_2, 2);
        reset(div_7);
        reset(div_6);
        template_effect(() => set_text(text2, `The folder "${(get(noGitData).currentPath || "") ?? ""}" is not a Git repository.`));
        delegated("click", button_1, () => {
          set(noGitData, null);
          set(loading, true);
          postMessage("initRepo");
        });
        append($$anchor2, div_6);
      };
      var consequent_3 = ($$anchor2) => {
        var div_10 = root_43();
        append($$anchor2, div_10);
      };
      var alternate = ($$anchor2) => {
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
          get scrollToIndex() {
            return get(scrollToIndex);
          },
          onSelectCommit,
          onLoadMore,
          onRebaseFromHere
        });
      };
      if_block(node_1, ($$render) => {
        if (get(loading) && get(commits).length === 0)
          $$render(consequent);
        else if (get(noGitData))
          $$render(consequent_2, 1);
        else if (get(commits).length === 0 && !get(loading))
          $$render(consequent_3, 2);
        else
          $$render(alternate, -1);
      });
    }
    reset(div_4);
    var node_3 = sibling(div_4, 2);
    {
      var consequent_4 = ($$anchor2) => {
        var fragment_2 = root_52();
        var div_11 = first_child(fragment_2);
        bind_this(div_11, ($$value) => detailSplitterEl = $$value, () => detailSplitterEl);
        var div_12 = sibling(div_11, 2);
        var button_2 = child(div_12);
        var node_4 = sibling(button_2, 2);
        CommitDetail(node_4, {
          get commit() {
            return get(selectedCommit);
          },
          get files() {
            return get(selectedFiles);
          }
        });
        reset(div_12);
        bind_this(div_12, ($$value) => detailPanelEl = $$value, () => detailPanelEl);
        delegated("click", button_2, () => {
          set(selectedHash, null);
        });
        append($$anchor2, fragment_2);
      };
      if_block(node_3, ($$render) => {
        if (get(selectedHash))
          $$render(consequent_4);
      });
    }
    reset(div_1);
    reset(div);
    append($$anchor, div);
    pop();
  }
  delegate(["click"]);

  // webview/graph/main.ts
  var app = mount(App, {
    target: document.getElementById("app")
  });
  var main_default = app;
})();
