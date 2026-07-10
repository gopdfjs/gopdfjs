import type { SerializedFabricObject } from "./fabricAnnotations";

/** Rescale serialized Fabric objects when the editor display scale changes. */
export function scaleSerializedFabricObjects(
    objects: SerializedFabricObject[],
    ratio: number,
): SerializedFabricObject[] {
    if (Math.abs(ratio - 1) < 0.001) return objects;

    return objects.map((obj) => ({
        ...obj,
        left: (obj.left ?? 0) * ratio,
        top: (obj.top ?? 0) * ratio,
        ...(obj.fontSize != null ? { fontSize: obj.fontSize * ratio } : {}),
        ...(obj.x1 != null ? { x1: obj.x1 * ratio } : {}),
        ...(obj.y1 != null ? { y1: obj.y1 * ratio } : {}),
        ...(obj.x2 != null ? { x2: obj.x2 * ratio } : {}),
        ...(obj.y2 != null ? { y2: obj.y2 * ratio } : {}),
        ...(obj.strokeWidth != null ? { strokeWidth: obj.strokeWidth * ratio } : {}),
        ...(obj.rx != null ? { rx: obj.rx * ratio } : {}),
        ...(obj.ry != null ? { ry: obj.ry * ratio } : {}),
    }));
}
