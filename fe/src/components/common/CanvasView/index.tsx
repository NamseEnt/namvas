import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { calculateCameraDistance } from "./utils/textureOptimization";
import { useTextureLoader } from "./hooks/useTextureLoader";
import { SideMode } from "../../../../../shared/types";
import * as THREE from "three";
import { getUvBounds } from "./getUvBounds";
import { canvasProductSizeM } from "./constants";
import {
  FACE_DIRECTIONS,
  SIDE_FACE_POSITIONS,
  SIDE_FACE_ROTATIONS,
  SIDE_FACE_SIZES,
} from "./types";
import {
  calculateFlipModeUV,
  calculatePreserveModeUV,
} from "./utils/uvCalculations";

const workers: CanvasViewWorker[] = [];

export function CanvasView({
  imageSource,
  rotation,
  sideMode,
  imageOffset,
}: {
  imageSource: string | File;
  rotation: { x: number; y: number };
  sideMode: SideMode;
  imageOffset: { x: number; y: number };
}) {
  const id = useId();
  const textureResult = useTextureLoader(imageSource);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const seqRef = useRef<number>(0);

  useEffect(() => {
    if (workers.length > 0) {
      return;
    }

    for (let i = 0; i < 4; i += 1) {
      const worker = new CanvasViewWorker();
      worker.run();
      workers.push(worker);
    }

    return () => {
      const disposedWorkers = workers.splice(0, workers.length);
      disposedWorkers.forEach((worker) => worker.dispose());
    };
  }, []);

  useEffect(() => {
    if (textureResult.type !== "success") {
      return;
    }
    if (size.width === 0 || size.height === 0) {
      return;
    }
    const seq = seqRef.current++;
    queue[id] = {
      texture: textureResult.texture,
      rotation,
      sideMode,
      imageOffset,
      canvasSize: size,
      callback: (bitmap) => {
        if (seqRef.current !== seq + 1) {
          return;
        }
        const context = canvasRef.current?.getContext("bitmaprenderer");
        if (!context) {
          return;
        }
        context.transferFromImageBitmap(bitmap);
      },
    };
  }, [imageSource, rotation, sideMode, imageOffset, id, textureResult, size]);

  useLayoutEffect(() => {
    if (textureResult.type !== "success") {
      return;
    }
    const target = canvasRef.current;
    if (!target) {
      return;
    }

    setSize({ width: target.clientWidth, height: target.clientHeight });

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === target) {
          const { width, height } = entry.contentRect;
          setSize({ width, height });
        }
      }
    });

    resizeObserver.observe(target);

    return () => {
      resizeObserver.unobserve(target);
    };
  }, [textureResult.type]);

  if (textureResult.type === "loading") {
    return <div>Loading...</div>;
  }
  if (textureResult.type === "error") {
    return <div>Error: {textureResult.error.message}</div>;
  }

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

const queue: {
  [key: string]: {
    texture: THREE.Texture;
    rotation: { x: number; y: number };
    sideMode: SideMode;
    imageOffset: { x: number; y: number };
    canvasSize: { width: number; height: number };
    callback: (bitmap: ImageBitmap) => void;
  };
} = {};

class CanvasViewWorker {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  disposed = false;
  canvasTexture = new THREE.TextureLoader().load("/canvas-texture.jpg");
  constructor() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }
  resetScene() {
    this.scene.clear();
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const directionalLightProps = [
      { position: [-1, 1, 1], intensity: 1.5, castShadow: true },
      { position: [0, 0, 1], intensity: 1.0 },
      { position: [2, 1, 0], intensity: 0.8, color: "#fffacd" },
      { position: [1, 2, 0], intensity: 0.6, color: "#f0f8ff" },
    ];
    directionalLightProps.forEach((props) => {
      const light = new THREE.DirectionalLight(props.color, props.intensity);
      light.position.set(
        props.position[0],
        props.position[1],
        props.position[2]
      );
      light.castShadow = props.castShadow || false;
      this.scene.add(light);
    });
  }
  async run() {
    if (this.disposed) {
      return;
    }

    const key = Object.keys(queue)[0];
    if (!key) {
      setTimeout(() => this.run(), 0);
      return;
    }

    this.resetScene();

    const { callback, imageOffset, rotation, sideMode, texture, canvasSize } =
      queue[key];
    delete queue[key];

    this.renderer.setSize(canvasSize.width, canvasSize.height);

    const cameraDistance = calculateCameraDistance(rotation);
    this.camera.position.setZ(cameraDistance);

    const uvBounds = getUvBounds({
      imageWh: {
        width: texture.image.width,
        height: texture.image.height,
      },
      imageOffset,
      sideMode,
    });

    const group = new THREE.Group();
    group.rotation.set(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      group.rotation.z
    );
    this.scene.add(group);

    const frontMesh = getFrontMesh({
      texture,
      uvBounds,
    });
    group.add(frontMesh);

    const sideMeshes = (() => {
      switch (sideMode) {
        case SideMode.CLIP:
          return getSideClipMeshes({
            canvasTexture: this.canvasTexture,
          });
        case SideMode.PRESERVE:
          return getSidePreserveMeshes({
            texture,
            imageOffset,
          });
        case SideMode.FLIP:
          return getSideFlipMeshes({
            texture,
            imageOffset,
          });
      }
    })();
    group.add(...sideMeshes);

    this.renderer.render(this.scene, this.camera);
    callback(await createImageBitmap(this.renderer.domElement));

    this.run();
  }
  dispose() {
    this.disposed = true;
  }
}

function getFrontMesh({
  texture,
  uvBounds,
}: {
  texture: THREE.Texture;
  uvBounds: { uMin: number; uMax: number; vMin: number; vMax: number };
}) {
  const frontGeometry = new THREE.PlaneGeometry(
    canvasProductSizeM.widthM,
    canvasProductSizeM.heightM
  );
  const uvs = new Float32Array([
    uvBounds.uMin,
    uvBounds.vMax,
    uvBounds.uMax,
    uvBounds.vMax,
    uvBounds.uMin,
    uvBounds.vMin,
    uvBounds.uMax,
    uvBounds.vMin,
  ]);
  frontGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

  const frontMesh = new THREE.Mesh(
    frontGeometry,
    new THREE.MeshStandardMaterial({ map: texture })
  );
  frontMesh.position.set(0, 0, canvasProductSizeM.thicknessM / 2);
  return frontMesh;
}

function getSideClipMeshes({
  canvasTexture,
}: {
  canvasTexture: THREE.Texture;
}) {
  const geos = FACE_DIRECTIONS.reduce(
    (acc, edge) => {
      acc[edge] = new THREE.PlaneGeometry(
        SIDE_FACE_SIZES[edge][0],
        SIDE_FACE_SIZES[edge][1]
      );
      return acc;
    },
    {} as Record<(typeof FACE_DIRECTIONS)[number], THREE.PlaneGeometry>
  );

  const meshes = FACE_DIRECTIONS.map((edge) => {
    const mesh = new THREE.Mesh(
      geos[edge],
      new THREE.MeshStandardMaterial({ map: canvasTexture })
    );
    mesh.position.set(
      SIDE_FACE_POSITIONS[edge][0],
      SIDE_FACE_POSITIONS[edge][1],
      SIDE_FACE_POSITIONS[edge][2]
    );
    mesh.rotation.set(
      SIDE_FACE_ROTATIONS[edge][0],
      SIDE_FACE_ROTATIONS[edge][1],
      SIDE_FACE_ROTATIONS[edge][2]
    );
    return mesh;
  });

  return meshes;
}

function getSidePreserveMeshes({
  texture,
  imageOffset,
}: {
  texture: THREE.Texture;
  imageOffset: { x: number; y: number };
}) {
  const preserveUV = calculatePreserveModeUV({
    imageWidthPx: texture.image.width,
    imageHeightPx: texture.image.height,
    imageOffset,
  });
  const uvs = {
    left: new Float32Array([
      preserveUV.left.uMin,
      preserveUV.left.vMax, // 좌상
      preserveUV.left.uMax,
      preserveUV.left.vMax, // 우상
      preserveUV.left.uMin,
      preserveUV.left.vMin, // 좌하
      preserveUV.left.uMax,
      preserveUV.left.vMin, // 우하
    ]),
    right: new Float32Array([
      preserveUV.right.uMin,
      preserveUV.right.vMax,
      preserveUV.right.uMax,
      preserveUV.right.vMax,
      preserveUV.right.uMin,
      preserveUV.right.vMin,
      preserveUV.right.uMax,
      preserveUV.right.vMin,
    ]),
    top: new Float32Array([
      preserveUV.top.uMin,
      preserveUV.top.vMax,
      preserveUV.top.uMax,
      preserveUV.top.vMax,
      preserveUV.top.uMin,
      preserveUV.top.vMin,
      preserveUV.top.uMax,
      preserveUV.top.vMin,
    ]),
    bottom: new Float32Array([
      preserveUV.bottom.uMin,
      preserveUV.bottom.vMax,
      preserveUV.bottom.uMax,
      preserveUV.bottom.vMax,
      preserveUV.bottom.uMin,
      preserveUV.bottom.vMin,
      preserveUV.bottom.uMax,
      preserveUV.bottom.vMin,
    ]),
  };
  const geos = FACE_DIRECTIONS.reduce(
    (acc, edge) => {
      acc[edge] = new THREE.PlaneGeometry(
        SIDE_FACE_SIZES[edge][0],
        SIDE_FACE_SIZES[edge][1]
      );
      acc[edge].setAttribute("uv", new THREE.BufferAttribute(uvs[edge], 2));
      return acc;
    },
    {} as Record<(typeof FACE_DIRECTIONS)[number], THREE.PlaneGeometry>
  );

  const meshes = FACE_DIRECTIONS.map((edge) => {
    const mesh = new THREE.Mesh(
      geos[edge],
      new THREE.MeshStandardMaterial({ map: texture })
    );
    mesh.position.set(
      SIDE_FACE_POSITIONS[edge][0],
      SIDE_FACE_POSITIONS[edge][1],
      SIDE_FACE_POSITIONS[edge][2]
    );
    mesh.rotation.set(
      SIDE_FACE_ROTATIONS[edge][0],
      SIDE_FACE_ROTATIONS[edge][1],
      SIDE_FACE_ROTATIONS[edge][2]
    );
    return mesh;
  });

  return meshes;
}

function getSideFlipMeshes({
  texture,
  imageOffset,
}: {
  texture: THREE.Texture;
  imageOffset: { x: number; y: number };
}) {
  const flipUV = calculateFlipModeUV({
    imageWidthPx: texture.image.width,
    imageHeightPx: texture.image.height,
    imageOffset,
  });
  const uvs = {
    left: applyFlipUV(flipUV.left),
    right: applyFlipUV(flipUV.right),
    top: applyFlipUV(flipUV.top),
    bottom: applyFlipUV(flipUV.bottom),
  };
  const geos = FACE_DIRECTIONS.reduce(
    (acc, edge) => {
      acc[edge] = new THREE.PlaneGeometry(
        SIDE_FACE_SIZES[edge][0],
        SIDE_FACE_SIZES[edge][1]
      );
      acc[edge].setAttribute("uv", new THREE.BufferAttribute(uvs[edge], 2));
      return acc;
    },
    {} as Record<(typeof FACE_DIRECTIONS)[number], THREE.PlaneGeometry>
  );

  const meshes = FACE_DIRECTIONS.map((edge) => {
    const mesh = new THREE.Mesh(
      geos[edge],
      new THREE.MeshStandardMaterial({ map: texture })
    );
    mesh.position.set(
      SIDE_FACE_POSITIONS[edge][0],
      SIDE_FACE_POSITIONS[edge][1],
      SIDE_FACE_POSITIONS[edge][2]
    );
    mesh.rotation.set(
      SIDE_FACE_ROTATIONS[edge][0],
      SIDE_FACE_ROTATIONS[edge][1],
      SIDE_FACE_ROTATIONS[edge][2]
    );
    return mesh;
  });

  return meshes;

  function applyFlipUV(uv: {
    uMin: number;
    uMax: number;
    vMin: number;
    vMax: number;
    flipX?: boolean;
    flipY?: boolean;
  }) {
    const { uMin, uMax, vMin, vMax, flipX, flipY } = uv;

    if (flipX && !flipY) {
      // X축 뒤집기 (좌우 바뀜)
      return new Float32Array([
        uMax,
        vMax, // Vertex 0 (좌상) → 우상 UV
        uMin,
        vMax, // Vertex 1 (우상) → 좌상 UV
        uMax,
        vMin, // Vertex 2 (좌하) → 우하 UV
        uMin,
        vMin, // Vertex 3 (우하) → 좌하 UV
      ]);
    } else if (!flipX && flipY) {
      // Y축 뒤집기 (상하 바뀜)
      return new Float32Array([
        uMin,
        vMin, // Vertex 0 (좌상) → 좌하 UV
        uMax,
        vMin, // Vertex 1 (우상) → 우하 UV
        uMin,
        vMax, // Vertex 2 (좌하) → 좌상 UV
        uMax,
        vMax, // Vertex 3 (우하) → 우상 UV
      ]);
    } else {
      // 뒤집기 없음 (기본)
      return new Float32Array([
        uMin,
        vMax, // Vertex 0 (좌상)
        uMax,
        vMax, // Vertex 1 (우상)
        uMin,
        vMin, // Vertex 2 (좌하)
        uMax,
        vMin, // Vertex 3 (우하)
      ]);
    }
  }
}
