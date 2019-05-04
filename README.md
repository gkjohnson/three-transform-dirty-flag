# three-transform-dirty-flag

[![travis build](https://img.shields.io/travis/gkjohnson/threejs-transform-dirty-flag.svg?style=flat-square)](https://travis-ci.org/gkjohnson/threejs-transform-dirty-flag)
[![lgtm code quality](https://img.shields.io/lgtm/grade/javascript/g/gkjohnson/threejs-transform-dirty-flag.svg?style=flat-square&label=code-quality)](https://lgtm.com/projects/g/gkjohnson/threejs-transform-dirty-flag/)

**In Progress: Does not improve performance (yet?).**

**Adding setters and getters to the position and scale fields dramaticly decreases the performance of modifying the vectors, so that approach cannot be used. It's possible that adding an OnChange field to the fields (similar to the rotation and quaternion fields) could help with this.**

Experimental extension for efficiently keeping matrices and bounds up to date.

## Use

```js
import { Object3D } from '.../three.js';
import { DirtyObject3D, DefaultDirtyTracker, ApplyDirtyTransform } from '.../dirty-transform-flag.js';

const scene, renderer, camera;

// ... instantiate a complex scene ...

// Disable auto updating of transforms (even though it won't get
// called anyway because the functions have been overridden).
Object3D.DefaultMatrixAutoUpdate = false;
scene.autoUpdate = false;

// convert the tree into tracked DirtyObject3D instances
ApplyDirtyTransform(scene);

// ... move a few objects ...

(function render() {

  // update anything that relies on object positions
  // oct trees, etc.
  DefaultDirtyTracker
    .dirtyTransforms
    .forEach(o => { /* ... */ });

  // Update the transforms and bounds of every changed
  // and affected object.
  DefaultDirtyTracker.updateAll();

  renderer.render(scene, camera);
  requestAnimationFrame(render);

})();
```

## API

### DirtyObject3D

Object that tracks changes to its own position, rotation, and scale and appropriately marks the child and parent bounds and transforms dirty as appropriate.

#### Members
##### boundingSphere : THREE.Sphere, boundingBox : THREE.Box3

A bounding shapes describing the containment of the children.

If the object has a `geometry` field on it then the geometry bounding shapes are returned.

If there are no children then they bounds will be centered at `0, 0, 0` and size `0`.

##### transformDirty : Boolean, boundsDirty : Boolean

Whether or not the transform or bounds are considered dirty. The transform is dirtied when the position, rotation, or scale are updated and the bounds are dirtied when the transform has been updated.

If a parent is moved then all child transforms are dirty. If a child moves then all parent bounds are dirty.

##### dirtyTracker : DirtyTracker

The `DirtyTracker` that is tracking the changes to this object.

#### Methods
##### constructor()

Same as the `Object3D` constructor.

##### updateTransform()

Update the world matrix of the object _if_ it's been changed. Guarantees that all the parent's are up to date, as well.

##### updateBounds()

Update the bounding shapes of the object.

### DirtyTracker

A manager class used to track the currently dirty objects in a scene.

#### Members
##### dirtyTransforms : Array(DirtyObject3D)

List of objects that have had their transforms dirtied.

##### dirtyBounds : Array(DirtyObject3D)

List of objects that have had their bounds dirtied.

#### Methods
##### updateAll()

Updates the transforms and bounds of the dirty objects.

##### updateAllTransforms()

Updates the transforms of all objects with a dirty transform matrix.

##### updateAllBounds()

Updates the bounds of all objects with dirty bounds.

#### Override-able Methods
##### onTransformDirty(obj)

Called when an object transform is marked as dirty. Adds the object to the `dirtyTransforms` list by default.

##### updateTransform(obj)

Called when updating a transform via `updateAllTransforms`. Updates the objects transform by default.

##### onBoundsDirty(obj)

Called when an object bounds is marked as dirty. Adds the object to the `dirtyBounds` list by default.

##### updateBounds(obj)

Called when updating a bounds via `updateAllBounds`. Updates the objects bounds by default.

### Other

#### Methods
##### DirtyTransformMixin(class)

Returns a version of the provided class that includes the `DirtyObject3D` behavior. It is expected that the provided class inherits from `Object3D`.

##### ApplyDirtyTransform(obj, tracker = null)

Adds the `DirtyObject3D` behavior to the provided object and child hierarchy to be tracked by the given tracker. If not provided the current active `DirtyTracker` is used.

##### setActiveTracker(tracker)

Sets the tracker to use when instantiating or applying `DirtyObject3D` behavior.

##### getActiveTracker() : DirtyTracker

Returns the currently set DirtyTracker.

#### Objects
##### DefaultDirtyTracker

The default dirty tracker used.
