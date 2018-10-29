const path = require('path');

export default
Object.entries({
    index: 'index.js',
}).map(([name, file]) => {

    const inputPath = path.join(__dirname, `./src/${ file }`);
    const outputPath = path.join(__dirname, `./umd/${ file }`);

    return {

        input: inputPath,
        treeshake: false,
        external: p => p === 'three',

        output: {

            name,
            extend: true,
            format: 'umd',
            file: outputPath,
            sourcemap: true,

            globals: path => /^three/.test(path) ? 'THREE' : null,

        },

    };
});
