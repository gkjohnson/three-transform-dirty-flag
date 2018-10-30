import { Object3D } from 'three';
import { getActiveDirtyTracker, setActiveDirtyTracker } from './DirtyTracker.js';
import { applyDirtyMembers } from './ExtensionMethods.js';

const DirtyTransformMixin =
    base => class extends base {

        constructor() {

            super(...arguments);

            applyDirtyMembers(this);

            this.updateBounds();
        }

    };

const ApplyDirtyTransform = (obj, dirtyTracker = null) => {

    const ogDt = getActiveDirtyTracker();
    dirtyTracker = dirtyTracker || ogDt();

    setActiveDirtyTracker(dirtyTracker);

    obj.traverse(c => {
        applyDirtyMembers(c);
    });

    setActiveDirtyTracker(ogDt);

};

const DirtyObject3D = DirtyTransformMixin(Object3D);

export { DirtyTransformMixin, DirtyObject3D, ApplyDirtyTransform };
