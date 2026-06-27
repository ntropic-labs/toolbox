export interface ExportSelection {
  readonly svg: boolean;
  readonly pngSizes: readonly number[];
  readonly favicon: boolean;
}

export interface ExportFile {
  readonly path: string;
  readonly data: Blob | string;
}

export interface ExportOptions {
  readonly inset?: number;
  readonly name?: string;
}
