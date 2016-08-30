var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

rollup.rollup({
    entry: 'app/laserweb/main.js',
    plugins: [
        babel({
        exclude: 'node_modules/**'
        })
    ]
}).then( function (bundle) {
    // Generate bundle + sourcemap
    var result = bundle.generate({
        // output format - 'amd', 'cjs', 'es', 'iife', 'umd'
        format: 'cjs'
    });

    bundle.write({
        format: 'cjs',
        dest: 'app/bundle.js',
        //sourceMap: true
    });
});