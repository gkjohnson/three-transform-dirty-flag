/* global
    jest
    describe it beforeAll afterAll beforeEach afterEach expect
*/

global.THREE = require('three');
const {

    DirtyTracker,
    DefaultDirtyTracker,
    setActiveDirtyTracker,
    getActiveDirtyTracker,

    DirtyObject3D,

} = require('../umd/index.js');

describe('DirtyTracker', () => {

    it('should initialize to the default tracker', () => {

        expect(getActiveDirtyTracker()).toEqual(DefaultDirtyTracker);

        const obj = new DirtyObject3D();
        expect(obj.dirtyTracker).toEqual(DefaultDirtyTracker);

    });

    it('should allow setting the dirty tracker', () => {

        const dt = new DirtyTracker();
        setActiveDirtyTracker(dt);
        expect(getActiveDirtyTracker()).toEqual(dt);

        const obj = new DirtyObject3D();
        expect(obj.dirtyTracker).toEqual(dt);
        setActiveDirtyTracker(DefaultDirtyTracker);

    });

    it('should track the dirtying of objects', () => {

        let calledTransformDirty = false;
        let calledBoundsDirty = false;
        let obj = null;
        const dt =
            new (class extends DirtyTracker {

                onBoundsDirty(o) {
                    super.onBoundsDirty(o);
                    calledBoundsDirty = true;
                }

                onTransformDirty(o) {
                    super.onTransformDirty(o);
                    calledTransformDirty = true;
                }

            })();

        setActiveDirtyTracker(dt);
        obj = new DirtyObject3D();
        obj.setWorldTransformDirty();

        expect(calledTransformDirty).toBeTruthy();
        expect(dt.dirtyTransforms.length).toEqual(1);
        expect(calledBoundsDirty).toBeFalsy();
        expect(dt.dirtyBounds.length).toEqual(0);

        obj.setBoundsDirty();
        expect(calledTransformDirty).toBeTruthy();
        expect(dt.dirtyTransforms.length).toEqual(1);
        expect(calledBoundsDirty).toBeTruthy();
        expect(dt.dirtyBounds.length).toEqual(1);

        dt.updateAll();
        expect(dt.dirtyTransforms.length).toEqual(0);
        expect(dt.dirtyBounds.length).toEqual(0);
        setActiveDirtyTracker(DefaultDirtyTracker);
    });

    it('should not add an object to the list more than once', () => {

        const dt = new DirtyTracker();
        setActiveDirtyTracker(dt);

        const obj = new DirtyObject3D();
        expect(dt.dirtyTransforms.length).toEqual(0);

        obj.position.x = 1;
        obj.position.y = 2;
        obj.position.x = 3;

        obj.scale.x = 1;
        obj.scale.y = 2;
        obj.scale.z = 3;

        expect(dt.dirtyTransforms.length).toEqual(1);

    });

});

describe('DirtyObject3d', () => {

    it('should have all the expected fields', () => {

        const o = new DirtyObject3D();
        expect(o).toHaveProperty('worldTransformDirty');
        expect(o).toHaveProperty('localTransformDirty');
        expect(o).toHaveProperty('boundsDirty');
        expect(o).toHaveProperty('dirtyTracker');

        expect(o.boundingSphere).toBeTruthy();
        expect(o.boundingBox).toBeTruthy();

    });

    it('should be marked as dirty if a field changes', () => {

        const fields = ['x', 'y', 'z'];
        const o = new DirtyObject3D();
        expect(o.localTransformDirty).toBeFalsy();
        expect(o.worldTransformDirty).toBeFalsy();

        // Test Rotation
        o.rotation.set(1, 1, 1);
        expect(o.localTransformDirty).toBeTruthy();
        expect(o.worldTransformDirty).toBeTruthy();

        o.updateTransform();

        // Test Quaternion
        o.quaternion.set(1, 0, 0, 0);
        expect(o.localTransformDirty).toBeTruthy();
        expect(o.worldTransformDirty).toBeTruthy();

        o.updateTransform();

        // Test position fields
        fields.forEach(f => {

            o.position[f] = 10;
            expect(o.localTransformDirty).toBeTruthy();
            expect(o.worldTransformDirty).toBeTruthy();

            o.updateTransform();

        });

        // Test scale fields
        fields.forEach(f => {

            o.scale[f] = 10;
            expect(o.localTransformDirty).toBeTruthy();
            expect(o.worldTransformDirty).toBeTruthy();

            o.updateTransform();

        });

    });

    it('should mark bounds as dirty once the transform is updated', () => {

        const o = new DirtyObject3D();
        expect(o.localTransformDirty).toBeFalsy();
        expect(o.worldTransformDirty).toBeFalsy();
        expect(o.boundsDirty).toBeFalsy();

        o.position.x = 1;
        expect(o.localTransformDirty).toBeTruthy();
        expect(o.worldTransformDirty).toBeTruthy();
        expect(o.boundsDirty).toBeFalsy();

        o.updateTransform();
        expect(o.localTransformDirty).toBeFalsy();
        expect(o.worldTransformDirty).toBeFalsy();
        expect(o.boundsDirty).toBeFalsy();

    });

    describe('hierarchy changes', () => {

        let root = null;
        let ca1 = null;
        let ca2 = null;
        let cb1 = null;
        let cb2 = null;
        let tracker = null;
        beforeEach(() => {

            tracker = new DirtyTracker();
            setActiveDirtyTracker(tracker);

            root = new DirtyObject3D();
            ca1 = new DirtyObject3D();
            ca2 = new DirtyObject3D();
            cb1 = new DirtyObject3D();
            cb2 = new DirtyObject3D();

            root.add(ca1);
            ca1.add(ca2);

            root.add(cb1);
            cb1.add(cb2);

            // The objects should be dirtied after being added to an object
            expect(root.boundsDirty).toBeTruthy();
            root.traverse(c => {

                if (c !== root) {

                    expect(c.worldTransformDirty).toBeTruthy();
                    expect(c.localTransformDirty).toBeFalsy();

                }

            });

            tracker.updateAll();

            expect(root.boundsDirty).toBeFalsy();
            root.traverse(c => {

                if (c !== root) {

                    expect(c.boundsDirty).toBeFalsy();
                    expect(c.worldTransformDirty).toBeFalsy();
                    expect(c.localTransformDirty).toBeFalsy();

                }

            });
        });

        afterEach(() => {

            setActiveDirtyTracker(DefaultDirtyTracker);

        });

        it('should dirty child transforms when the parent moves', () => {

            root.traverse(c => {

                expect(c.worldTransformDirty).toBeFalsy();
                expect(c.localTransformDirty).toBeFalsy();

            });
            root.position.x = 10;
            root.position.y = 10;
            root.position.z = 10;
            root.traverse(c => {

                expect(c.worldTransformDirty).toBeTruthy();

                if (c === root) {

                    expect(c.localTransformDirty).toBeTruthy();

                } else {

                    expect(c.localTransformDirty).toBeFalsy();

                }

            });
            expect(tracker.dirtyTransforms.length).toEqual(5);

            // Update one child
            ca2.updateTransform();
            // A-leg
            expect(ca2.boundsDirty).toBeFalsy();
            expect(ca2.worldTransformDirty).toBeFalsy();
            expect(ca2.localTransformDirty).toBeFalsy();

            expect(ca1.boundsDirty).toBeFalsy();
            expect(ca1.worldTransformDirty).toBeFalsy();
            expect(ca1.localTransformDirty).toBeFalsy();

            expect(root.boundsDirty).toBeFalsy();
            expect(root.worldTransformDirty).toBeFalsy();
            expect(root.localTransformDirty).toBeFalsy();

            // B-leg
            expect(cb2.boundsDirty).toBeFalsy();
            expect(cb2.worldTransformDirty).toBeTruthy();
            expect(cb2.localTransformDirty).toBeFalsy();

            expect(cb1.boundsDirty).toBeFalsy();
            expect(cb1.worldTransformDirty).toBeTruthy();
            expect(cb1.localTransformDirty).toBeFalsy();

            // move the root so world transforms are out of date
            ca2.position.x = -5;
            expect(ca2.boundsDirty).toBeFalsy();
            expect(ca2.worldTransformDirty).toBeTruthy();
            expect(ca2.localTransformDirty).toBeTruthy();

            expect(ca1.boundsDirty).toBeTruthy();
            expect(ca1.worldTransformDirty).toBeFalsy();
            expect(ca1.localTransformDirty).toBeFalsy();

            expect(root.boundsDirty).toBeTruthy();
            expect(root.worldTransformDirty).toBeFalsy();
            expect(root.localTransformDirty).toBeFalsy();

            // B-leg
            expect(cb2.boundsDirty).toBeFalsy();
            expect(cb2.worldTransformDirty).toBeTruthy();
            expect(cb2.localTransformDirty).toBeFalsy();

            expect(cb1.boundsDirty).toBeFalsy();
            expect(cb1.worldTransformDirty).toBeTruthy();
            expect(cb1.localTransformDirty).toBeFalsy();

        });

        it.skip('more complex tree updates', () => {});

    });

});

describe('Bounds', () => {

    it.skip('should properly encapsulate the children', () => {});

});

// describe('Global Override', () => {

// });
