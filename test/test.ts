import 'mocha';
import 'ts-node';

import { assert } from "chai";
import { vueToSan } from "..";




describe('template transform', function () {

    const tests: {
        [k: string]: {
            vueCode: string,
            sanCode: string,
        }
    } = {
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

        'script initData': {
            vueCode: `<template>
</template>
<script>
export default {
    data() {
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
    initData() {
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
        'script methods this data array': {
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

