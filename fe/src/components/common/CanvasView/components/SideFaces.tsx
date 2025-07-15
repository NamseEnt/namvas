import * as THREE from "three";
import { SideMode } from "../types";
import { ClipSideFaces } from "./ClipSideFaces";
import { PreserveSideFaces } from "./PreserveSideFaces";
import { FlipSideFaces } from "./FlipSideFaces";

export function SideFaces({
  sideMode,
  texture,
  imageOffset
}: {
  sideMode: SideMode;
  texture?: THREE.Texture;
  imageOffset: { x: number; y: number };
}) {
  switch (sideMode) {
    case SideMode.CLIP:
      return <ClipSideFaces />;
    case SideMode.PRESERVE:
      return texture ? <PreserveSideFaces texture={texture} imageOffset={imageOffset} /> : null;
    case SideMode.FLIP:
      return texture ? <FlipSideFaces texture={texture} imageOffset={imageOffset} /> : null;
    default:
      return null;
  }
}