export interface EditorNotice {
  readonly kind: 'error' | 'info' | 'success';
  readonly title: string;
  readonly body?: string;
}

export function getSvgUploadFailedNotice(): EditorNotice {
  return {
    kind: 'error',
    title: 'SVG upload failed',
    body: 'The SVG could not be read. Choose a valid SVG file and try again.'
  };
}

export function getSvgUploadedNotice(layerName: string): EditorNotice {
  return {
    kind: 'success',
    title: 'SVG layer added',
    body: `${layerName} is selected and ready to adjust.`
  };
}

export function getExportFailedNotice(): EditorNotice {
  return {
    kind: 'error',
    title: 'Export failed',
    body: 'The export could not be generated. Try downloading again.'
  };
}

export function getExportReadyNotice(fileCount: number, filename: string): EditorNotice {
  return {
    kind: 'success',
    title: 'Export ready',
    body:
      fileCount === 1
        ? `${filename} downloaded.`
        : `${fileCount} files downloaded as ${filename}.`
  };
}

export function getExportTextWarningNotice(count: number): EditorNotice {
  return {
    kind: 'info',
    title: 'Text exported without outlining',
    body:
      count === 1
        ? 'One text layer had no loaded font, so it was exported as-is.'
        : `${count} text layers had no loaded font, so they were exported as-is.`
  };
}

export function getLayerDeletedNotice(layerName: string): EditorNotice {
  return {
    kind: 'info',
    title: 'Layer deleted',
    body: `${layerName} was removed. Use Undo to restore it.`
  };
}
