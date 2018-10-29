class DirtyBin {

    constructor() {
        this.dirtyTransforms = [];
        this.dirtyBounds = [];
    }

    /* Public Functions */
    updateAllTransforms() {
        const dt = this.dirtyTransforms;
        for (let i = 0; i < dt.length; i++) {
            this.updateTransform(dt[i]);
        }
        this.dirtyTransforms.length = 0;
    }

    updateAllBounds() {
        const db = this.dirtyBounds;
        for (let i = 0; i < db.length; i++) {
            this.updateBounds(db[i]);
        }
        this.dirtyBounds.length = 0;
    }

    updateAll() {
        this.updateAllTransforms();
        this.updateAllBounds();
    }

    /* Override-able Functions */
    onTransformDirty(obj) {
        this.dirtyTransforms.push(obj);
    }

    updateTransform(obj) {
        obj.updateTransform();
    }

    onBoundsDirty(obj) {
        this.dirtyBounds.push(obj);
    }

    updateBounds(obj) {
        obj.updateBounds();
    }

}

const DefaultDirtyBin = new DirtyBin();
let currentDirtyBin = DefaultDirtyBin;

function setActiveDirtyBin(db) {
    currentDirtyBin = db;
}

function getActiveDirtyBin() {
    return currentDirtyBin;
}

export { DirtyBin, DefaultDirtyBin, setActiveDirtyBin, getActiveDirtyBin };
