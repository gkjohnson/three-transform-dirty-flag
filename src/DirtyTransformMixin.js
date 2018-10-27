import { Box3, Sphere } from 'three';
import { expandBox } from './utils.js';

// TODO: This will not interop with the current THREE.Object3D object because it
// assumes that all the new fields are available

// TODO: Add a callback or list for tracking all the objects that change

const DirtyTransformMixin =
    base => class extends base {

        get boundingBox() {
            if ('geometry' in this) {
                return (this.geometry && this.geometry.boundingBox) || null;
            } else {
                return this._boundingBox;
            }
        }

        get boundingSphere() {
            if ('geometry' in this) {
                return (this.geometry && this.geometry.boundingSphere) || null;
            } else {
                return this._boundingSphere || null;
            }
        }

        constructor() {

            super(...arguments);

            const self = this;
            function bindUpdateToField(o, f) {

                const str = `_${ f }`;
                Object.defineProperty(o, f, {

                    get() {
                        return this[str];
                    },

                    set(v) {
                        this[str] = v;
                        self.setTransformDirty();
                    },

                });

            };

            // indicates that the position, scale, rotation has changed
            // and the local and world matrices need to be updated.
            this.transformDirty = false;

            // indicates that the transform has changed and the bounds are
            // out of sync
            this.boundsDirty = false;

            // Watch for dirty changes to the transform
            // Rotation
            const ogRotationChange = this.rotation.onChangeCallback.bind(this.rotation);
            this.rotation.onChange(() => {
                ogRotationChange();
                this.setTransformDirty();
            });

            // Quaternion
            const ogQuaternionChange = this.quaternion.onChangeCallback.bind(this.quaternion);
            this.quaternion.onChange(() => {
                ogQuaternionChange();
                this.setTransformDirty();
            });

            // Position
            bindUpdateToField(this.position, 'x');
            bindUpdateToField(this.position, 'y');
            bindUpdateToField(this.position, 'z');

            // Scale
            bindUpdateToField(this.scale, 'x');
            bindUpdateToField(this.scale, 'y');
            bindUpdateToField(this.scale, 'z');

            // Add this.parent override
            Object.defineProperty(this, 'parent', {

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

            });

        }

        /* Overrides */
        updateMatrix() {
            this.updateTransform();
        }

        updateMatrixWorld() {
            this.updateTransform();
        }

        updateWorldMatrix() {
            this.updateTransform();
        }

        /* Private Functions */
        setTransformDirty() {

            if (this.transformDirty === false) {

                this.transformDirty = true;
                const children = this.children;
                for (let i = 0; i < children; i++) {

                    children.setTransformDirty(false);

                }

            }

        }

        updateTransform() {

            if (this.transformDirty) {

                if (this.parent) {

                    this.parent.updateTransform();

                }

                // Update local and world matrices
                this.matrix.compose(this.position, this.quaternion, this.scale);
                this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);

                this.transformDirty = false;
                this.setBoundsDirty();

            }

        }

        setBoundsDirty() {

            if (this.boundsDirty === false) {

                this.boundsDirty = true;
                if (this.parent) {
                    this.parent.setBoundsDirty();
                }

            }

        }

        updateBounds() {

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

        }

    };

export { DirtyTransformMixin };
