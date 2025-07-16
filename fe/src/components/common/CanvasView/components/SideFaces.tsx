import * as THREE from "three";
import { SideMode } from "../../../../../../shared/types";
import { ClipSideFaces } from "./ClipSideFaces";
import { PreserveSideFaces } from "./PreserveSideFaces";
import { FlipSideFaces } from "./FlipSideFaces";

export function SideFaces({
  sideMode,
  texture,
  imageOffset,
}: {
  sideMode: SideMode;
  texture: THREE.Texture;
  imageOffset: { x: number; y: number };
}) {
  switch (sideMode) {
    case SideMode.CLIP:
      return <ClipSideFaces />;
    case SideMode.PRESERVE:
      return <PreserveSideFaces texture={texture} imageOffset={imageOffset} />;
    case SideMode.FLIP:
      return <FlipSideFaces texture={texture} imageOffset={imageOffset} />;
  }
}
