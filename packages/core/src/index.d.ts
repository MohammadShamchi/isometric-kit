export interface Point {
  x: number;
  y: number;
}

export interface IsoEngineType {
  A: number;
  HH: number;
  H: number;
  ORIGIN: Point;
  project(u: number, v: number, z?: number): Point;
}

export const IsoEngine: IsoEngineType;

export interface ThemeState {
  top: string;
  left: string;
  right: string;
  stroke: string;
  strokeWidth: number;
  dasharray?: string;
}

export const SURFACE: ThemeState;
export const ACCENT: ThemeState;
export const GHOST: ThemeState;

export interface RenderNodeConfig {
  u: number;
  v: number;
  z?: number;
  height?: number;
  theme: ThemeState;
}

export function renderServiceCube(config: RenderNodeConfig): string;
export function renderDatastore(config: RenderNodeConfig): string;
export function renderLayerStack(
  config: RenderNodeConfig & { layers?: number },
): string;

export function renderFlowMarkerDefs(): string;

export type NodeType = 'service' | 'cylinder' | 'stack';
export type LinkType = 'axial' | 'dogleg';

export interface SceneNode {
  id: string;
  u: number;
  v: number;
  type: NodeType;
  z?: number;
  height?: number;
  layers?: number;
  theme?: ThemeState;
  label?: string;
}

export interface SceneLink {
  from: string;
  to: string;
  type: LinkType;
  axisFirst?: 'u' | 'v';
}

export interface SceneConfig {
  nodes: SceneNode[];
  links?: SceneLink[];
}

export function renderNode(node: SceneNode): string;
export function renderLink(link: SceneLink, nodeById: Map<string, SceneNode>): string;
export function renderScene(scene: SceneConfig): string;

export function renderAxialLink(
  nodeA: Pick<SceneNode, 'u' | 'v' | 'z' | 'height'>,
  nodeB: Pick<SceneNode, 'u' | 'v' | 'z' | 'height'>,
): string;

export function renderDoglegLink(
  nodeA: Pick<SceneNode, 'u' | 'v' | 'z' | 'height'>,
  nodeB: Pick<SceneNode, 'u' | 'v' | 'z' | 'height'>,
  axisFirst?: 'u' | 'v',
): string;

export type BoundsNodeType = NodeType;

export interface BoundsNode {
  type: BoundsNodeType;
  u: number;
  v: number;
  z?: number;
  height?: number;
  layers?: number;
  label?: string;
}

export interface BoundsRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function getNodeBounds(
  node: BoundsNode,
  options?: { includeLabels?: boolean },
): BoundsRect;

export function getSceneBounds(
  nodes: BoundsNode[],
  options?: { padding?: number; includeLabels?: boolean },
): BoundsRect | null;

export interface BuildArchitectureSvgOptions {
  padding?: number;
  background?: string | null;
  width?: number;
  height?: number;
  includeLabels?: boolean;
}

export function buildArchitectureSvg(
  scene: SceneConfig,
  options?: BuildArchitectureSvgOptions,
): string;
