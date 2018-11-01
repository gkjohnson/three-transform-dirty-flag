const { Object3D, Scene } = require('three');

function pad(str, len) {

    let res = str;
    while (res.length < len) {

        res += ' ';

    }

    return res;

}

function runBenchmark(name, func, maxTime, maxIterations = Infinity) {

    let iterations = 0;
    const start = Date.now();
    while (Date.now() - start < maxTime) {

        func();
        iterations++;
        if (iterations >= maxIterations) break;

    }
    const elapsed = Date.now() - start;

    console.log(`${ pad(name, 25) }: ${ parseFloat((elapsed / iterations).toFixed(6)) } ms`);

}

function createHierarchy(breadth, depth = 1, root = null) {

    if (depth === 0) return;

    root = root || new Scene();

    for (let i = 0; i < breadth; i++) {

        const o = new Object3D();
        root.add(o);
        createHierarchy(breadth, depth - 1, o);

    }

    return root;

}

module.exports = { runBenchmark, pad, createHierarchy };
