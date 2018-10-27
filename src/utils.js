import { Vector3 } from 'three';

const v = new Vector3();
function expandBox(tg, box, matrix) {

    for (let x = 0; x <= 1; x++) {
        for (let y = 0; y <= 1; y++) {
            for (let z = 0; z <= 1; z++) {

                const bmin = box.min;
                const bmax = box.max;
                v.x = x * bmin.x + (1 - x) * bmax.x;
                v.y = y * bmin.y + (1 - y) * bmax.y;
                v.z = z * bmin.z + (1 - z) * bmax.z;

                v.applyMatrix4(matrix);

                tg.min.x = Math.min(v.x, tg.min.x);
                tg.min.y = Math.min(v.y, tg.min.y);
                tg.min.z = Math.min(v.z, tg.min.z);

                tg.max.x = Math.max(v.x, tg.max.x);
                tg.max.y = Math.max(v.y, tg.max.y);
                tg.max.z = Math.max(v.z, tg.max.z);

            }
        }
    }
}

export { expandBox };
