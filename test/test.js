global.THREE = require('three');
const {

    DirtyTracker,
    DefaultDirtyTracker,
    setActiveDirtyTracker,
    getActiveDirtyTracker,

    DirtyTransformMixin,
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
        obj.setTransformDirty();

        expect(calledTransformDirty).toBeTruthy();
        expect(dt.dirtyTransforms.length).toEqual(1);
        expect(calledBoundsDirty).not.toBeTruthy();
        expect(dt.dirtyBounds.length).toEqual(0);

        obj.setBoundsDirty();
        expect(calledTransformDirty).toBeTruthy();
        expect(dt.dirtyTransforms.length).toEqual(1);
        expect(calledBoundsDirty).toBeTruthy();
        expect(dt.dirtyBounds.length).toEqual(1);

        dt.updateAll();
        expect(dt.dirtyTransforms.length).toEqual(0);
        expect(dt.dirtyBounds.length).toEqual(0);

    });

});

// describe('DirtyObject3d', () => {

//     // should be marked as dirty if the transform is changed
//     // bounds should be marked as dirty once the transforms are updated
//     // bounds should be marked as dirty if the children move
//     // child transforms should be dirty if the parent moves

// });

// describe('Global Override', () => {

// });

// describe('Object3D Interoperability', () => {

// });
