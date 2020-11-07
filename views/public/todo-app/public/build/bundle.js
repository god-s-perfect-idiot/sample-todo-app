
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\AddTodo.svelte generated by Svelte v3.29.4 */
    const file = "src\\components\\AddTodo.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let form;
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let div1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			form = element("form");
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "+";
    			attr_dev(input, "id", "todoBox");
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "input-card svelte-ydda8h");
    			add_location(input, file, 38, 16, 865);
    			attr_dev(div0, "class", "todo-input svelte-ydda8h");
    			add_location(div0, file, 37, 12, 823);
    			attr_dev(button, "class", "plus-btn svelte-ydda8h");
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 41, 16, 1037);
    			attr_dev(div1, "class", "add-btn svelte-ydda8h");
    			add_location(div1, file, 40, 12, 998);
    			attr_dev(div2, "class", "add-card row col-sm-12");
    			add_location(div2, file, 36, 8, 773);
    			add_location(form, file, 35, 4, 722);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file, 34, 0, 693);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, form);
    			append_dev(form, div2);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*data*/ ctx[0].todo_body);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[2]),
    					listen_dev(form, "submit", prevent_default(/*addToDo*/ ctx[1]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1 && input.value !== /*data*/ ctx[0].todo_body) {
    				set_input_value(input, /*data*/ ctx[0].todo_body);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const addToDoAPI = "http://localhost:3000/addToDo";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AddTodo", slots, []);
    	const dispatch = createEventDispatcher();
    	let data = { todo_body: "" };

    	let addToDo = async () => {
    		if (data.todo_body.trim() === "") {
    			return;
    		}

    		const res = await fetch(`${addToDoAPI}`, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(data)
    		});

    		const post = res.json();
    		dispatch("Entry Added!", post);
    		let todoBox = document.getElementById("todoBox");
    		todoBox.value = "";
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AddTodo> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		data.todo_body = this.value;
    		$$invalidate(0, data);
    	}

    	$$self.$capture_state = () => ({
    		text,
    		createEventDispatcher,
    		dispatch,
    		data,
    		addToDoAPI,
    		addToDo
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("addToDo" in $$props) $$invalidate(1, addToDo = $$props.addToDo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, addToDo, input_input_handler];
    }

    class AddTodo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddTodo",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\components\TodoList.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\TodoList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (72:20) {#if todo.todo_checked === false}
    function create_if_block_1(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let label;
    	let input;
    	let input_id_value;
    	let input_checked_value;
    	let t0_value = /*todo*/ ctx[6].todo_body + "";
    	let t0;
    	let t1;
    	let div3_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(input, "id", input_id_value = /*todo*/ ctx[6].todo_id);
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = /*todo*/ ctx[6].todo_checked;
    			attr_dev(input, "class", "svelte-1blzpup");
    			add_location(input, file$1, 77, 40, 2241);
    			attr_dev(label, "class", "content svelte-1blzpup");
    			attr_dev(label, "for", "check");
    			add_location(label, file$1, 76, 36, 2164);
    			attr_dev(div0, "class", "todo-card svelte-1blzpup");
    			add_location(div0, file$1, 75, 32, 2102);
    			attr_dev(div1, "class", "todo col-sm-12 svelte-1blzpup");
    			add_location(div1, file$1, 74, 28, 2040);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$1, 73, 24, 1993);
    			attr_dev(div3, "class", "container");
    			attr_dev(div3, "id", div3_id_value = /*todo*/ ctx[6].holder);
    			add_location(div3, file$1, 72, 20, 1927);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(label, input);
    			append_dev(label, t0);
    			append_dev(div3, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todos*/ 1 && input_id_value !== (input_id_value = /*todo*/ ctx[6].todo_id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*todos*/ 1 && input_checked_value !== (input_checked_value = /*todo*/ ctx[6].todo_checked)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[6].todo_body + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && div3_id_value !== (div3_id_value = /*todo*/ ctx[6].holder)) {
    				attr_dev(div3, "id", div3_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(72:20) {#if todo.todo_checked === false}",
    		ctx
    	});

    	return block;
    }

    // (71:16) {#each todos as todo}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*todo*/ ctx[6].todo_checked === false && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*todo*/ ctx[6].todo_checked === false) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(71:16) {#each todos as todo}",
    		ctx
    	});

    	return block;
    }

    // (94:20) {#if todo.todo_checked === true}
    function create_if_block(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let label;
    	let input;
    	let input_id_value;
    	let input_checked_value;
    	let t0_value = /*todo*/ ctx[6].todo_body + "";
    	let t0;
    	let t1;
    	let div3_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(input, "id", input_id_value = /*todo*/ ctx[6].todo_id);
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = /*todo*/ ctx[6].todo_checked;
    			attr_dev(input, "class", "svelte-1blzpup");
    			add_location(input, file$1, 99, 40, 3207);
    			attr_dev(label, "class", "content done svelte-1blzpup");
    			attr_dev(label, "for", "check");
    			add_location(label, file$1, 98, 36, 3125);
    			attr_dev(div0, "class", "todo-card svelte-1blzpup");
    			add_location(div0, file$1, 97, 32, 3064);
    			attr_dev(div1, "class", "todo col-sm-12 svelte-1blzpup");
    			add_location(div1, file$1, 96, 28, 3002);
    			attr_dev(div2, "class", "row done svelte-1blzpup");
    			add_location(div2, file$1, 95, 24, 2950);
    			attr_dev(div3, "class", "container");
    			attr_dev(div3, "id", div3_id_value = /*todo*/ ctx[6].holder);
    			add_location(div3, file$1, 94, 20, 2884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(label, input);
    			append_dev(label, t0);
    			append_dev(div3, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*click_handler_1*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todos*/ 1 && input_id_value !== (input_id_value = /*todo*/ ctx[6].todo_id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*todos*/ 1 && input_checked_value !== (input_checked_value = /*todo*/ ctx[6].todo_checked)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[6].todo_body + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && div3_id_value !== (div3_id_value = /*todo*/ ctx[6].holder)) {
    				attr_dev(div3, "id", div3_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(94:20) {#if todo.todo_checked === true}",
    		ctx
    	});

    	return block;
    }

    // (93:16) {#each todos as todo}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*todo*/ ctx[6].todo_checked === true && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*todo*/ ctx[6].todo_checked === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(93:16) {#each todos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div9;
    	let div0;
    	let p0;
    	let p1;
    	let t1;
    	let div8;
    	let div1;
    	let addtodo;
    	let t2;
    	let div4;
    	let div2;
    	let p2;
    	let p3;
    	let t4;
    	let div3;
    	let t5;
    	let div7;
    	let div5;
    	let p4;
    	let p5;
    	let t7;
    	let div6;
    	let current;
    	addtodo = new AddTodo({ $$inline: true });
    	let each_value_1 = /*todos*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*todos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "To Do App";
    			p1 = element("p");
    			t1 = space();
    			div8 = element("div");
    			div1 = element("div");
    			create_component(addtodo.$$.fragment);
    			t2 = space();
    			div4 = element("div");
    			div2 = element("div");
    			p2 = element("p");
    			p2.textContent = "Pending:";
    			p3 = element("p");
    			t4 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			div7 = element("div");
    			div5 = element("div");
    			p4 = element("p");
    			p4.textContent = "Completed:";
    			p5 = element("p");
    			t7 = space();
    			div6 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(p0, file$1, 59, 8, 1527);
    			add_location(p1, file$1, 59, 20, 1539);
    			attr_dev(div0, "class", "app-title svelte-1blzpup");
    			add_location(div0, file$1, 58, 4, 1494);
    			attr_dev(div1, "class", "add-card svelte-1blzpup");
    			add_location(div1, file$1, 62, 8, 1603);
    			add_location(p2, file$1, 67, 16, 1745);
    			add_location(p3, file$1, 67, 27, 1756);
    			attr_dev(div2, "class", "title svelte-1blzpup");
    			add_location(div2, file$1, 66, 12, 1708);
    			attr_dev(div3, "id", "pending");
    			add_location(div3, file$1, 69, 12, 1793);
    			attr_dev(div4, "class", "todos svelte-1blzpup");
    			add_location(div4, file$1, 65, 8, 1675);
    			add_location(p4, file$1, 89, 16, 2699);
    			add_location(p5, file$1, 89, 29, 2712);
    			attr_dev(div5, "class", "title svelte-1blzpup");
    			add_location(div5, file$1, 88, 12, 2662);
    			attr_dev(div6, "id", "completed");
    			add_location(div6, file$1, 91, 12, 2749);
    			add_location(div7, file$1, 87, 8, 2643);
    			attr_dev(div8, "class", "container todo-list svelte-1blzpup");
    			add_location(div8, file$1, 61, 4, 1560);
    			attr_dev(div9, "class", "container app-card svelte-1blzpup");
    			add_location(div9, file$1, 57, 0, 1456);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div0);
    			append_dev(div0, p0);
    			append_dev(div0, p1);
    			append_dev(div9, t1);
    			append_dev(div9, div8);
    			append_dev(div8, div1);
    			mount_component(addtodo, div1, null);
    			append_dev(div8, t2);
    			append_dev(div8, div4);
    			append_dev(div4, div2);
    			append_dev(div2, p2);
    			append_dev(div2, p3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div3, null);
    			}

    			append_dev(div8, t5);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, p4);
    			append_dev(div5, p5);
    			append_dev(div7, t7);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*todos, change*/ 3) {
    				each_value_1 = /*todos*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*todos, change*/ 3) {
    				each_value = /*todos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div6, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addtodo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addtodo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_component(addtodo);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const updateToDoAPI = "http://localhost:3000/updateToDO";
    const todolistAPI = "http://localhost:3000/";

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodoList", slots, []);
    	let data = { todo_id: "", todo_status: "" };
    	let todos = [];

    	onMount(async () => {
    		let res = await fetch(todolistAPI);
    		$$invalidate(0, todos = await res.json());
    		console.log(todos);
    	});

    	const updateUI = event => {
    		let pendingBlock = document.getElementById("pending");
    		let completeBlock = document.getElementById("completed");
    		let current = document.getElementById(event.target.id + "Holder");
    		current.remove();

    		if (event.target.checked === true) {
    			completeBlock.innerHTML += current.innerHTML;
    		} else {
    			console.log(false);
    		}
    	};

    	const change = async event => {
    		data.todo_id = event.target.id;
    		data.todo_status = event.target.checked;
    		let s = document.getElementById(data.todo_id);
    		data.todo_status = s.checked;

    		const res = await fetch(`${updateToDoAPI}`, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(data)
    		});

    		const post = res.json();
    		updateUI(event);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TodoList> was created with unknown prop '${key}'`);
    	});

    	const click_handler = event => change(event);
    	const click_handler_1 = event => change(event);

    	$$self.$capture_state = () => ({
    		onMount,
    		AddTodo,
    		data,
    		updateToDoAPI,
    		todolistAPI,
    		todos,
    		updateUI,
    		change
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) data = $$props.data;
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [todos, change, click_handler, click_handler_1];
    }

    class TodoList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.4 */

    function create_fragment$2(ctx) {
    	let todolist;
    	let current;
    	todolist = new TodoList({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(todolist.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(todolist, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todolist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todolist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todolist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ TodoList });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
