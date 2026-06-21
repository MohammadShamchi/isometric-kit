import {
  ACCENT,
  buildArchitectureSvg,
  GHOST,
  SURFACE,
  type BuildArchitectureSvgOptions,
  type SceneConfig,
} from '@isometric-design/core';
import { applyAutoLayout } from './applyLayout';
import type {
  ArchitectureGraphData,
  CoordinatedGraphData,
} from './types/graph';
import type { ThemeName } from './themes';

const THEME_MAP: Record<ThemeName, SceneConfig['nodes'][number]['theme']> = {
  surface: SURFACE,
  accent: ACCENT,
  ghost: { ...GHOST, dasharray: '4 4' },
};

export interface ExportOptions extends BuildArchitectureSvgOptions {
  scale?: number;
}

function toSceneConfig(data: CoordinatedGraphData): SceneConfig {
  return {
    nodes: data.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      u: node.u,
      v: node.v,
      z: node.z,
      height: node.height,
      layers: node.layers,
      label: node.label,
      theme: THEME_MAP[node.theme ?? 'surface'],
    })),
    links: data.links,
  };
}

export function exportArchitectureSvg(
  data: ArchitectureGraphData,
  options?: ExportOptions,
): string {
  const { scale: _scale, ...svgOptions } = options ?? {};
  return buildArchitectureSvg(toSceneConfig(applyAutoLayout(data)), svgOptions);
}

function assertBrowser(): void {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    throw new Error(
      'PNG export requires a browser environment with document and Image APIs',
    );
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseViewBoxSize(svg: string): { width: number; height: number } {
  const match = svg.match(/viewBox="([^"]+)"/);
  if (!match) {
    return { width: 800, height: 600 };
  }

  const parts = match[1].split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return { width: 800, height: 600 };
  }

  return { width: parts[2], height: parts[3] };
}

export function downloadArchitectureSvg(
  data: ArchitectureGraphData,
  filename = 'architecture.svg',
  options?: ExportOptions,
): void {
  assertBrowser();

  const svg = exportArchitectureSvg(data, options);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename);
}

export async function downloadArchitecturePng(
  data: ArchitectureGraphData,
  filename = 'architecture.png',
  options?: ExportOptions,
): Promise<void> {
  assertBrowser();

  const { scale = 2, ...svgOptions } = options ?? {};
  const svg = exportArchitectureSvg(data, svgOptions);
  const { width, height } = parseViewBoxSize(svg);

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve();
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG for PNG export'));
    };
    image.src = url;
  });

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) {
        reject(new Error('Failed to encode PNG'));
        return;
      }

      triggerDownload(pngBlob, filename);
      resolve();
    }, 'image/png');
  });
}

export interface ArchitectureExportHandle {
  exportSvg: () => string;
  downloadSvg: (filename?: string) => void;
  downloadPng: (filename?: string) => Promise<void>;
}

export function createArchitectureExportHandle(
  data: ArchitectureGraphData,
  options?: ExportOptions,
): ArchitectureExportHandle {
  return {
    exportSvg: () => exportArchitectureSvg(data, options),
    downloadSvg: (filename) => downloadArchitectureSvg(data, filename, options),
    downloadPng: (filename) => downloadArchitecturePng(data, filename, options),
  };
}
