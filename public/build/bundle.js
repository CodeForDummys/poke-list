
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
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
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.3' }, detail)));
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
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

    /* src\App.svelte generated by Svelte v3.32.3 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (55:0) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Pokemon no encontrado";
    			add_location(p, file, 55, 1, 1402);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(55:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:0) {#if isValid}
    function create_if_block(ctx) {
    	let div;
    	let t0;
    	let p;
    	let t1_value = /*currentPkmn*/ ctx[0].name + "";
    	let t1;

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentPkmn*/ ctx[0].sprites.front_default != null) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			attr_dev(div, "class", "box-img svelte-184s89w");
    			add_location(div, file, 42, 1, 865);
    			add_location(p, file, 53, 1, 1367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*currentPkmn*/ 1 && t1_value !== (t1_value = /*currentPkmn*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(42:0) {#if isValid}",
    		ctx
    	});

    	return block;
    }

    // (49:2) {:else}
    function create_else_block(ctx) {
    	let img_1;
    	let img_1_src_value;
    	let img_1_alt_value;

    	const block = {
    		c: function create() {
    			img_1 = element("img");
    			if (img_1.src !== (img_1_src_value = /*currentPkmn*/ ctx[0].sprites.other["official-artwork"].front_default)) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", img_1_alt_value = /*currentPkmn*/ ctx[0].name);
    			attr_dev(img_1, "class", "svelte-184s89w");
    			add_location(img_1, file, 49, 3, 1248);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img_1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentPkmn*/ 1 && img_1.src !== (img_1_src_value = /*currentPkmn*/ ctx[0].sprites.other["official-artwork"].front_default)) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*currentPkmn*/ 1 && img_1_alt_value !== (img_1_alt_value = /*currentPkmn*/ ctx[0].name)) {
    				attr_dev(img_1, "alt", img_1_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(49:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (44:2) {#if currentPkmn.sprites.front_default != null}
    function create_if_block_1(ctx) {
    	let img0;
    	let img0_src_value;
    	let img0_alt_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let img1_alt_value;
    	let t1;
    	let img2;
    	let img2_src_value;
    	let img2_alt_value;
    	let t2;
    	let img3;
    	let img3_src_value;
    	let img3_alt_value;

    	const block = {
    		c: function create() {
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			img2 = element("img");
    			t2 = space();
    			img3 = element("img");
    			if (img0.src !== (img0_src_value = /*currentPkmn*/ ctx[0].sprites.front_default)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", img0_alt_value = /*currentPkmn*/ ctx[0].name);
    			attr_dev(img0, "class", "svelte-184s89w");
    			add_location(img0, file, 44, 3, 940);
    			if (img1.src !== (img1_src_value = /*currentPkmn*/ ctx[0].sprites.back_default)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", img1_alt_value = /*currentPkmn*/ ctx[0].name);
    			attr_dev(img1, "class", "svelte-184s89w");
    			add_location(img1, file, 45, 3, 1016);
    			if (img2.src !== (img2_src_value = /*currentPkmn*/ ctx[0].sprites.front_shiny)) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", img2_alt_value = /*currentPkmn*/ ctx[0].name);
    			attr_dev(img2, "class", "svelte-184s89w");
    			add_location(img2, file, 46, 3, 1091);
    			if (img3.src !== (img3_src_value = /*currentPkmn*/ ctx[0].sprites.back_shiny)) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", img3_alt_value = /*currentPkmn*/ ctx[0].name);
    			attr_dev(img3, "class", "svelte-184s89w");
    			add_location(img3, file, 47, 3, 1165);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, img1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, img2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, img3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentPkmn*/ 1 && img0.src !== (img0_src_value = /*currentPkmn*/ ctx[0].sprites.front_default)) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*currentPkmn*/ 1 && img0_alt_value !== (img0_alt_value = /*currentPkmn*/ ctx[0].name)) {
    				attr_dev(img0, "alt", img0_alt_value);
    			}

    			if (dirty & /*currentPkmn*/ 1 && img1.src !== (img1_src_value = /*currentPkmn*/ ctx[0].sprites.back_default)) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if (dirty & /*currentPkmn*/ 1 && img1_alt_value !== (img1_alt_value = /*currentPkmn*/ ctx[0].name)) {
    				attr_dev(img1, "alt", img1_alt_value);
    			}

    			if (dirty & /*currentPkmn*/ 1 && img2.src !== (img2_src_value = /*currentPkmn*/ ctx[0].sprites.front_shiny)) {
    				attr_dev(img2, "src", img2_src_value);
    			}

    			if (dirty & /*currentPkmn*/ 1 && img2_alt_value !== (img2_alt_value = /*currentPkmn*/ ctx[0].name)) {
    				attr_dev(img2, "alt", img2_alt_value);
    			}

    			if (dirty & /*currentPkmn*/ 1 && img3.src !== (img3_src_value = /*currentPkmn*/ ctx[0].sprites.back_shiny)) {
    				attr_dev(img3, "src", img3_src_value);
    			}

    			if (dirty & /*currentPkmn*/ 1 && img3_alt_value !== (img3_alt_value = /*currentPkmn*/ ctx[0].name)) {
    				attr_dev(img3, "alt", img3_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(img1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(img2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(img3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(44:2) {#if currentPkmn.sprites.front_default != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let form;
    	let input;
    	let t2;
    	let button;
    	let t4;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*isValid*/ ctx[2]) return create_if_block;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Pokemon elegido";
    			t1 = space();
    			form = element("form");
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "buscar";
    			t4 = space();
    			if_block.c();
    			attr_dev(h1, "class", "svelte-184s89w");
    			add_location(h1, file, 33, 0, 618);
    			attr_dev(input, "type", "text");
    			add_location(input, file, 35, 0, 714);
    			add_location(button, file, 36, 0, 759);
    			add_location(form, file, 34, 0, 643);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, input);
    			set_input_value(input, /*pkmnName*/ ctx[1]);
    			append_dev(form, t2);
    			append_dev(form, button);
    			append_dev(form, t4);
    			if_block.m(form, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(
    						form,
    						"submit",
    						prevent_default(function () {
    							if (is_function(/*searchPkmn*/ ctx[3](/*pkmnName*/ ctx[1].toLowerCase()))) /*searchPkmn*/ ctx[3](/*pkmnName*/ ctx[1].toLowerCase()).apply(this, arguments);
    						}),
    						false,
    						true,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*pkmnName*/ 2 && input.value !== /*pkmnName*/ ctx[1]) {
    				set_input_value(input, /*pkmnName*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			if_block.d();
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

    const pokeApi = "https://pokeapi.co/api/v2/pokemon";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let currentPkmn;
    	let pkmnName;
    	let img = "";
    	let isValid = false;
    	let all = "?limit=10220";

    	// const pokeApi = 'https://pokeapi.co/api/v2/pokemon/45/';
    	const searchPkmn = async pkmn => {
    		try {
    			await fetch(`${pokeApi}/${pkmn}/`).then(r => r.json()).then(data => {
    				$$invalidate(0, currentPkmn = data);
    				console.log(currentPkmn);
    				$$invalidate(2, isValid = true);
    			});
    		} catch(err) {
    			$$invalidate(0, currentPkmn = err);
    			$$invalidate(2, isValid = false);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		pkmnName = this.value;
    		$$invalidate(1, pkmnName);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		each,
    		currentPkmn,
    		pkmnName,
    		img,
    		isValid,
    		all,
    		pokeApi,
    		searchPkmn
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentPkmn" in $$props) $$invalidate(0, currentPkmn = $$props.currentPkmn);
    		if ("pkmnName" in $$props) $$invalidate(1, pkmnName = $$props.pkmnName);
    		if ("img" in $$props) img = $$props.img;
    		if ("isValid" in $$props) $$invalidate(2, isValid = $$props.isValid);
    		if ("all" in $$props) all = $$props.all;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentPkmn, pkmnName, isValid, searchPkmn, input_input_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
