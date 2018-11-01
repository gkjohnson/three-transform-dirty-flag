const { Object3D } = require('three');
const { pad, runBenchmark, createHierarchy } = require('./utils.js');
const { ApplyDirtyTransform, DefaultDirtyTracker } = require('../umd/index.js');

let scene = null;
let children = null;

// Static Scene
console.log('10000 static objects');
scene = createHierarchy(10000);

runBenchmark('Default', () => {

    scene.updateMatrixWorld();

}, 1000);

scene.traverse(c => c.matrixAutoUpdate = false);
runBenchmark('MatrixAutoUpdate Disabled', () => {

    scene.updateMatrixWorld();

}, 1000);

runBenchmark('Manual Matrix Updates', () => {}, 1000);

ApplyDirtyTransform(scene);
DefaultDirtyTracker.updateAllTransforms();
runBenchmark('DirtyTransform', () => {

    DefaultDirtyTracker.updateAllTransforms();

}, 1000);

// 1000 Dynamic Objects
console.log('1000 dynamic objects');
scene = createHierarchy(10000);
children = scene.children;
runBenchmark('Default', () => {

    for (let i = 0; i < 1000; i++) children[i].position.x += 1;
    scene.updateMatrixWorld();

}, 1000);

scene.traverse(c => c.matrixAutoUpdate = false);
runBenchmark('MatrixAutoUpdate Disabled', () => {

    for (let i = 0; i < 1000; i++) children[i].position.x += 1;
    for (let i = 0; i < 1000; i++) children[i].position.x += 1;
    scene.updateMatrixWorld();

}, 1000);

runBenchmark('Manual Matrix Updates', () => {

    for (let i = 0; i < 1000; i++) {
        const c = children[i];
        c.position.x += 1;
        c.updateMatrixWorld(true);
    }
    for (let i = 0; i < 1000; i++) {
        const c = children[i];
        c.position.x += 1;
        c.updateMatrixWorld(true);
    }
    for (let i = 0; i < 1000; i++) {
        const c = children[i];
        c.position.x += 1;
        c.updateMatrixWorld(true);
    }

}, 1000);

ApplyDirtyTransform(scene);
DefaultDirtyTracker.updateAllTransforms();
runBenchmark('DirtyTransform', () => {

    for (let i = 0; i < 1000; i++) children[i].position.x += 1;
    for (let i = 0; i < 1000; i++) children[i].position.x += 1;
    for (let i = 0; i < 1000; i++) children[i].position.x += 1;
    DefaultDirtyTracker.updateAllTransforms();

}, 1000);
