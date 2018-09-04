import 'mocha';
import 'ts-node';

import { assert } from "chai";
import { vueToSan } from "..";

export interface transpileTestCases  {
    [k: string]: {
        vueCode: string,
        sanCode: string,
    }
};


describe('template transform', function () {

    const tests: transpileTestCases = {
        '转译空文件': {
            vueCode: `<template>
</template>
<script>
</script>
<style>
</style>`,
            sanCode: `<template>
</template>
<script></script>
<style>
</style>`
        },
        '基本转换': {
            vueCode: `<template>
</template>
<script>
    var a = 'seom';
    var b = 1;
</script>
<style>
    .symbol {
        height: 30px;   
    }
</style>
`,
            sanCode: `<template>
</template>
<script>var a = 'seom';
var b = 1;
</script>
<style>
    .symbol {
        height: 30px;   
    }
</style>
`
        },
        'template v-if': {
            vueCode: `<template><div v-if="some.test"></div></template>`,
            sanCode: `<template><div s-if="some.test"></div></template>`,
        },
        'template \:attr': {
            vueCode: `<template><div :href="some.test"></div></template>`,
            sanCode: `<template><div href="{{ some.test }}"></div></template>`,
        },
        'template v-bind': {
            vueCode: `<template><div v-bind:href="some.test"></div></template>`,
            sanCode: `<template><div href="{{ some.test }}"></div></template>`,
        },
        'template v-model': {
            vueCode: `<template><input v-model="some.test"></template>`,
            sanCode: `<template><input value="{= some.test =}"></template>`,
        },
        'template v-on': {
            vueCode: `<template><input @click="some.test"></template>`,
            sanCode: `<template><input on-click="some.test"></template>`,
        },
        'template v-for': {
            vueCode: `<template><div v-for="some in topList"></div></template>`,
            sanCode: `<template><div s-for="some in topList"></div></template>`,
        },
        'template v-for with index': {
            vueCode: `<template><div v-for="(some, i) in topList"></div></template>`,
            sanCode: `<template><div s-for="some, i in topList"></div></template>`,
        },
        'template v-for with key': {
            vueCode: `<template><div v-for="(some, i) in topList" :key="some.key"></div></template>`,
            sanCode: `<template><div s-for="some, i in topList trackBy some.key"></div></template>`,
        },
        'template v-for with if': {
            vueCode: `<template><div v-for="(some, i) in topList" :key="some.key" v-if="some.data == 1"></div></template>`,
            sanCode: `<template><template s-for="some, i in topList trackBy some.key"><div s-if="some.data == 1"></div></template></template>`,
        },
        'template class obj': {
            vueCode: `<template><div :class="{className: isClass}"></div></template>`,
            sanCode: `<template><div class="{{ isClass ? 'className' : '' }}"></div></template>`,
        },
        'template class arr': {
            vueCode: `<template><div :class="[className]"></div></template>`,
            sanCode: `<template><div class="{{ className }}"></div></template>`,
        },
        'template class composite': {
            vueCode: `<template><div :class="[className]" class="fixed-class"></div></template>`,
            sanCode: `<template><div class="fixed-class {{ className }}"></div></template>`,
        },
        'template style obj': {
            vueCode: `<template><div :style="{ border: width + 'px', height: '30px' }"></div></template>`,
            sanCode: `<template><div style="border: {{ width + 'px' }};height: 30px;"></div></template>`,
        },
        'template style camalcase': {
            vueCode: `<template><div :style="{ borderWidth: width + 'px'}"></div></template>`,
            sanCode: `<template><div style="border-width: {{ width + 'px' }};"></div></template>`,
        },
        'template style dashed': {
            vueCode: `<template><div :style="{ 'border-width': width + 'px'}"></div></template>`,
            sanCode: `<template><div style="border-width: {{ width + 'px' }};"></div></template>`,
        },
        'template style composite': {
            vueCode: `<template><div :style="{ border: width + 'px'}" style="fixed-style: value"></div></template>`,
            sanCode: `<template><div style="fixed-style: value;border: {{ width + 'px' }};"></div></template>`,
        },
        'script initData': {
            vueCode: `<template>
</template>
<script>
export default {
    data: function() {
        return {

        };
    }
};
</script>
<style>
</style>`,
            sanCode: `<template>
</template>
<script>export default {
    initData: function() {
        return {};
    }
};
</script>
<style>
</style>`
        },
        'script methods': {
            vueCode: `<template>
</template>
<script>
export default {
    methods: {
        test() {

        }
    }
};
</script>
<style>
</style>`,
            sanCode: `<template>
</template>
<script>export default {
    test() {}
};
</script>
<style>
</style>`
        },
        'script methods this data get': {
            vueCode: `<template>
</template>
<script>
export default {
    methods: {
        test() {
            console.log(this.some);
        }
    }
};
</script>
<style>
</style>`,
            sanCode: `<template>
</template>
<script>export default {
    test() {
        console.log(this.data.get('some'));
    }
};
</script>
<style>
</style>`
        },
        'script methods this data set': {
            vueCode: `<template>
</template>
<script>
export default {
    methods: {
        test() {
            this.some = 1;
        }
    }
};
</script>
<style>
</style>`,
            sanCode: `<template>
</template>
<script>export default {
    test() {
        this.data.set('some', 1);
    }
};
</script>
<style>
</style>`
        },
        'script methods this data array 1': {
            vueCode: `<template>
</template>
<script>
export default {
    methods: {
        test() {
            this.some.push(1);
        }
    }
};
</script>
<style>
</style>`,
            sanCode: `<template>
</template>
<script>export default {
    test() {
        this.data.push('some', 1);
    }
};
</script>
<style>
</style>`
        },
        'script methods this data array 2': {
            vueCode: `<template>
</template>
<script>
export default {
    methods: {
        test() {
            this.some['test'].unshift(1);
        }
    }
};
</script>
<style>
</style>`,
            sanCode: `<template>
</template>
<script>export default {
    test() {
        this.data.unshift('some.test', 1);
    }
};
</script>
<style>
</style>`
        },
        'script computed': {
            vueCode: `<template>
</template>
<script>
export default {
    computed: {
        test() {
            return this.some['test'];
        }
    }
};
</script>
<style>
</style>`,
            sanCode: `<template>
</template>
<script>export default {
    computed: {
        test() {
            return this.data.get('some.test');
        }
    }
};
</script>
<style>
</style>`
        },
    };

    for (const k in tests) {
        it(k, function () {
            const sanCode = vueToSan(tests[k].vueCode);
            if (sanCode !== tests[k].sanCode) {
                console.log(JSON.stringify(sanCode));
                console.log(JSON.stringify(tests[k].sanCode));

            }
            assert.equal(sanCode, tests[k].sanCode);
        })
    }
});

