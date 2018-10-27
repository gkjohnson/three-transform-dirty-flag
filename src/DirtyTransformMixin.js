const DirtyTransformMixin =
    base => class extends base {

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

            if (this.boundsDirty) {

                // TODO: Each object3d needs a boundingSphere and a boundingBox
                // Meshes should probably derive their bounding shapes from the geometry
                // and assume they're up to date.
                // Otherwise if bounding shapes aren't available then they should be created
                // here? Raycasting will need to be updated to account for the new bounds

            }

        }

    };

export { DirtyTransformMixin };
