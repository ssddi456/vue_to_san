import 'mocha';
import 'ts-node';

import { assert } from "chai";
import { modifyVueJsSource } from '../modes/javascript';
import { transpileTestCases } from './test';


describe('js transform', function () {
    const tests: transpileTestCases = {
        'basic js': {
            vueCode: `var a = 1;
`,
            sanCode: `var a = 1;
`
        },
        'basic new 1': {
            vueCode: `new B()
`,
            sanCode: `new B();
`
        },
        'basic new 2': {
            vueCode: `new B(1)
`,
            sanCode: `new B(1);
`
        },
        'basic vue 1': {
            vueCode: `new Vue({
    data: {
        test: 1
    }
})
`,
            sanCode: `new San.defineComponent({
    initData: function() {
        return {
            test: 1
        };
    }
});
`
        },
        'basic vue 2': {
            vueCode: `new Vue({
    data: {
        test: 1
    },
    methods: {
        test2(){
            this.test = 2
        }
    }
})
`,
            sanCode: `new San.defineComponent({
    initData: function() {
        return {
            test: 1
        };
    },
    test2() {
        this.data.set('test', 2);
    }
});
`
        },
        'basic vue 3': {
            vueCode: `const test = new Vue({
    data: {
        test: 1
    },
    methods: {
        test2(){
            this.test = 2
        }
    }
})
`,
            sanCode: `const test = new San.defineComponent({
    initData: function() {
        return {
            test: 1
        };
    },
    test2() {
        this.data.set('test', 2);
    }
});
`
        },
        'basic vue 4': {
            vueCode: `// app Vue instance
var app = new Vue({
    // watch todos change for localStorage persistence
    watch: {
        todos: {
            handler: function(todos) {
                todoStorage.save(todos);
            },
            deep: true
        }
    },
    // computed properties
    // http://vuejs.org/guide/computed.html
    computed: {
        filteredTodos: function() {
            return filters[this.visibility](this.todos);
        },
    },
})
`,
            sanCode: `// app Vue instance
var app = new San.defineComponent({
    // watch todos change for localStorage persistence
    watch: {
        todos: {
            handler: function(todos) {
                todoStorage.save(todos);
            },
            deep: true
        }
    },
    // computed properties
    // http://vuejs.org/guide/computed.html
    computed: {
        filteredTodos: function() {
            return filters[this.data.get('visibility')](this.data.get('todos'));
        }
    }
});
`
        },
        'basic vue 5': {
            vueCode: `// app Vue instance
var app = new Vue({
    // watch todos change for localStorage persistence
    watch: {
        todos: {
            handler: function(todos) {
                todoStorage.save(todos);
            },
            deep: true
        }
    },
    // computed properties
    // http://vuejs.org/guide/computed.html
    computed: {
        filteredTodos: function() {
            return filters[this.visibility](this.todos);
        },
    },
})
`,
            sanCode: `// app Vue instance
var app = new San.defineComponent({
    // watch todos change for localStorage persistence
    watch: {
        todos: {
            handler: function(todos) {
                todoStorage.save(todos);
            },
            deep: true
        }
    },
    // computed properties
    // http://vuejs.org/guide/computed.html
    computed: {
        filteredTodos: function() {
            return filters[this.data.get('visibility')](this.data.get('todos'));
        }
    }
});
`
        }
    };

    for (const k in tests) {
        it(k, function () {
            const sanCode = modifyVueJsSource(tests[k].vueCode);
            if (sanCode !== tests[k].sanCode) {
                console.log(JSON.stringify(sanCode));
                console.log(JSON.stringify(tests[k].sanCode));
            }

            assert.equal(sanCode, tests[k].sanCode);
        })
    }
});
