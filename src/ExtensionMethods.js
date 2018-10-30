import { Box3, Sphere } from 'three';
import { getActiveDirtyTracker } from './DirtyTracker.js';
import { expandBox } from './utils.js';

// TODO: This will not interop with the current THREE.Object3D object because it
// assumes that all the new fields are available

function bindUpdateToField(self, obj, field) {

    const str = `_${ field }`;
    Object.defineProperty(obj, field, {

        get() {
            return this[str];
        },

        set(v) {
            this[str] = v;
            self.setTransformDirty();
        },

    });

};

const dirtyTransformFunctions = {

    /* Overrides */
    updateMatrix: function() {
        this.updateTransform();
    },

    updateMatrixWorld: function() {
        this.updateTransform();
    },

    updateWorldMatrix: function() {
        this.updateTransform();
    },

    /* Private Functions */
    setTransformDirty: function() {

        if (this.transformDirty === false) {

            this.transformDirty = true;
            this.dirtyTracker.onTransformDirty(this);

            const children = this.children;
            for (let i = 0; i < children; i++) {

                children.setTransformDirty(false);

            }

        }

    },

    updateTransform: function() {

        if (this.transformDirty) {

            if (this.parent) {

                this.parent.updateTransform();

            }

            // Update local and world matrices
            this.matrix.compose(this.position, this.quaternion, this.scale);

            if (this.parent) {
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
            } else {
                this.matrixWorld.copy(this.matrix);
            }

            this.transformDirty = false;
            this.setBoundsDirty();

        }

    },

    setBoundsDirty: function() {

        if (this.boundsDirty === false) {

            this.boundsDirty = true;
            this.dirtyTracker.onBoundsDirty(this);

            if (this.parent) {
                this.parent.setBoundsDirty();
            }

        }

    },

    updateBounds: function() {

        if (!('geometry' in this) && this.boundsDirty) {

            const children = this.children;
            const bb = this._boundingBox || new Box3();
            const sp = this._boundingSphere || new Sphere();

            if (children.length !== 0) {
                bb.min.set(1, 1, 1).multiplyScalar(Infinity);
                bb.max.set(1, 1, 1).multiplyScalar(-Infinity);

                for (let i = 0; i < children; i++) {
                    const c = children[i];
                    c.updateBounds();

                    expandBox(bb, c.boundingBox, c.matrix);
                }

                bb.getBoundingSphere(sp);
            } else {
                bb.min.set(0, 0, 0);
                bb.max.set(0, 0, 0);
                sp.radius = 0;
                sp.center.set(0, 0, 0);
            }

        }

        this.boundsDirty = false;

    },

};

const applyDirtyMembers =
    obj => {

        // Define getters and setters
        obj._parent = obj.parent;
        Object.defineProperties(obj, {

            boundingBox: {
                get() {
                    if ('geometry' in this) {
                        return (this.geometry && this.geometry.boundingBox) || null;
                    } else {
                        return this._boundingBox;
                    }
                },
            },

            boundingSphere: {
                get() {
                    if ('geometry' in this) {
                        return (this.geometry && this.geometry.boundingSphere) || null;
                    } else {
                        return this._boundingSphere || null;
                    }
                },
            },

            parent: {
                get() {
                    return this._parent;
                },

                set(p) {
                    if (this._parent !== p) {
                        this._parent.setBoundsDirty();
                        this._parent = p;
                        this.setTransformDirty();
                    }
                },
            },

        });

        // Define member variables
        // The dirty tracker this object is being tracked by.
        obj.dirtyTracker = getActiveDirtyTracker();

        // indicates that the position, scale, rotation has changed
        // and the local and world matrices need to be updated.
        obj.transformDirty = false;

        // indicates that the transform has changed and the bounds are
        // out of sync
        obj.boundsDirty = false;

        // Add change callbacks
        // Watch for dirty changes to the transform
        // Rotation
        const ogRotationChange = obj.rotation.onChangeCallback.bind(obj.rotation);
        obj.rotation.onChange(() => {
            ogRotationChange();
            obj.setTransformDirty();
        });

        // Quaternion
        const ogQuaternionChange = obj.quaternion.onChangeCallback.bind(obj.quaternion);
        obj.quaternion.onChange(() => {
            ogQuaternionChange();
            obj.setTransformDirty();
        });

        // Position
        bindUpdateToField(obj, obj.position, 'x');
        bindUpdateToField(obj, obj.position, 'y');
        bindUpdateToField(obj, obj.position, 'z');

        // Scale
        bindUpdateToField(obj, obj.scale, 'x');
        bindUpdateToField(obj, obj.scale, 'y');
        bindUpdateToField(obj, obj.scale, 'z');

        Object.assign(obj, dirtyTransformFunctions);

    };

export { applyDirtyMembers };
