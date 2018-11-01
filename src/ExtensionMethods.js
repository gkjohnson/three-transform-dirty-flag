import { Box3, Sphere } from 'three';
import { getActiveDirtyTracker } from './DirtyTracker.js';
import { expandBox } from './utils.js';

const uniqueKey = '__dirtyObject3D__';

const bindUpdateToField = (self, obj, field) => {

    const str = `_${ field }`;
    Object.defineProperty(obj, field, {

        get() {
            return this[str];
        },

        set(v) {
            this[str] = v;
            self.setLocalTransformDirty();
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

    /* Public Functions */
    updateTransform: function() {

        if (this.localTransformDirty) {

            // Update local and world matrices
            this.matrix.compose(this.position, this.quaternion, this.scale);
            this.localTransformDirty = false;

        }

        if (this.worldTransformDirty) {

            if (this.parent) {

                this.parent.updateTransform();
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);

            } else {

                this.matrixWorld.copy(this.matrix);

            }

            this.worldTransformDirty = false;

        }

    },

    updateBounds: function() {

        if (!('geometry' in this) && this.boundsDirty) {

            const children = this.children;
            this._boundingBox = this._boundingBox || new Box3();
            this._boundingSphere = this._boundingSphere || new Sphere();

            const bb = this._boundingBox;
            const sp = this._boundingSphere;

            if (children.length !== 0) {
                bb.min.set(1, 1, 1).multiplyScalar(Infinity);
                bb.max.set(1, 1, 1).multiplyScalar(-Infinity);

                for (let i = 0; i < children.length; i++) {
                    const c = children[i];
                    c.updateTransform();
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

    /* Private Functions */
    setLocalTransformDirty: function() {

        if (this.localTransformDirty === false) {

            this.localTransformDirty = true;
            this.setWorldTransformDirty();

            if (this.parent) {

                this.parent.setBoundsDirty();

            }

        }

    },

    setWorldTransformDirty: function() {

        if (this.worldTransformDirty === false) {

            this.worldTransformDirty = true;
            this.dirtyTracker.onTransformDirty(this);

            const children = this.children;
            for (let i = 0; i < children.length; i++) {

                children[i].setWorldTransformDirty();

            }

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

};

const applyDirtyMembers =
    obj => {

        if (obj[uniqueKey]) {
            console.warn('DirtyObject3D: Object has already had dirty transform members applied.', obj);
            return;
        }

        obj[uniqueKey] = true;

        // Add the member functions
        Object.assign(obj, dirtyTransformFunctions);

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
                    if (this.parent !== p) {
                        if (this._parent) {
                            this._parent.setBoundsDirty();
                        }

                        if (p) {
                            p.setBoundsDirty();
                        }

                        this._parent = p;
                        this.setWorldTransformDirty();
                    }
                },
            },

            transformDirty: {
                get() {
                    return this.worldTransformDirty || this.localTransformDirty;
                },
            },

        });

        // Define member variables
        // The dirty tracker this object is being tracked by.
        obj.dirtyTracker = getActiveDirtyTracker();

        // indicates that the position, scale, rotation has changed
        // and the local and world matrices need to be updated.
        obj.localTransformDirty = false;
        obj.worldTransformDirty = false;

        // indicates that the transform has changed and the bounds are
        // out of sync
        obj.boundsDirty = false;
        obj._boundingBox = new Box3();
        obj._boundingSphere = new Sphere();

        // Add change callbacks
        // Watch for dirty changes to the transform
        // Rotation
        const ogRotationChange = obj.rotation.onChangeCallback.bind(obj.rotation);
        obj.rotation.onChange(() => {
            ogRotationChange();
            obj.setLocalTransformDirty();
        });

        // Quaternion
        const ogQuaternionChange = obj.quaternion.onChangeCallback.bind(obj.quaternion);
        obj.quaternion.onChange(() => {
            ogQuaternionChange();
            obj.setLocalTransformDirty();
        });

        // Position
        bindUpdateToField(obj, obj.position, 'x');
        bindUpdateToField(obj, obj.position, 'y');
        bindUpdateToField(obj, obj.position, 'z');

        // Scale
        bindUpdateToField(obj, obj.scale, 'x');
        bindUpdateToField(obj, obj.scale, 'y');
        bindUpdateToField(obj, obj.scale, 'z');

    };

export { applyDirtyMembers };
