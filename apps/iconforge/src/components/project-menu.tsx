import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@toolbox/ui';
import { parseProjectFile, type IconforgeProject, type ProjectFile } from '../storage';
import { thumbnailUri, tightThumbnailUri } from './project-thumb';

export function ProjectMenu({
  projects,
  currentId,
  estimate,
  onBeforeOpen,
  onOpen,
  onNew,
  onDuplicate,
  onDelete,
  onImport
}: {
  readonly projects: readonly IconforgeProject[];
  readonly currentId: string;
  readonly estimate: { readonly count: number; readonly bytes: number };
  readonly onBeforeOpen?: () => void;
  readonly onOpen: (id: string) => void;
  readonly onNew: () => void;
  readonly onDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onImport: (file: ProjectFile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thumbs = useMemo(() => {
    const map = new Map<string, string>();
    if (open) for (const project of projects) map.set(project.id, tightThumbnailUri(project.svg));
    return map;
  }, [open, projects]);

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void file.text().then((text) => {
      const parsed = parseProjectFile(text);
      if (!parsed) {
        setImportError('That file is not a valid IconForge project.');
        return;
      }
      setImportError(null);
      onImport(parsed);
      setOpen(false);
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onBeforeOpen?.();
        else setImportError(null);
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className="if-button if-button-secondary if-open-trigger">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="if-open-icon">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          </svg>
          Open
          <span className="if-add-caret" aria-hidden="true">
            ▾
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="if-project-popover" align="start" aria-label="Open a project">
        <div className="if-menu-head">Stored in this browser</div>
        <div className="if-project-list">
          {projects.map((project) => {
            const active = project.id === currentId;
            return (
              <div key={project.id} className="if-proj" data-active={active || undefined}>
                <button
                  type="button"
                  className="if-proj-open"
                  onClick={() => {
                    onOpen(project.id);
                    setOpen(false);
                  }}
                >
                  <img
                    className="if-proj-thumb"
                    src={thumbs.get(project.id) ?? thumbnailUri(project.svg)}
                    alt=""
                  />
                  <span className="if-proj-meta">
                    <b>{project.name}</b>
                    <span>Edited {formatEdited(project.updatedAt)}</span>
                  </span>
                </button>
                <div className="if-proj-end">
                  {active ? (
                    <span className="if-proj-check" title="Current project">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </span>
                  ) : null}
                  <div className="if-proj-actions">
                    <button
                      type="button"
                      className="if-proj-act"
                      aria-label={`Duplicate ${project.name}`}
                      title="Duplicate"
                      onClick={() => {
                        onDuplicate(project.id);
                        setOpen(false);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="8" y="8" width="11" height="11" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="if-proj-act if-proj-act-danger"
                      aria-label={`Delete ${project.name}`}
                      title="Delete"
                      disabled={projects.length <= 1}
                      onClick={() => {
                        onDelete(project.id);
                        setOpen(false);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="if-menu-sep" />
        <button type="button" className="if-menu-row" onClick={() => fileInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M4 21h16" />
          </svg>
          Import from file…
        </button>
        <button
          type="button"
          className="if-menu-row"
          onClick={() => {
            onNew();
            setOpen(false);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          New project
        </button>
        {importError ? (
          <p className="if-note" role="alert">
            {importError}
          </p>
        ) : null}

        <div className="if-menu-sep" />
        <div className="if-menu-foot">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
            <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
          </svg>
          {estimate.count} project{estimate.count === 1 ? '' : 's'} · {formatBytes(estimate.bytes)}{' '}
          used
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="if-file-input"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleImportFile}
        />
      </PopoverContent>
    </Popover>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatEdited(updatedAt: number): string {
  const minutes = Math.round((Date.now() - updatedAt) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  return `${Math.round(days / 7)} weeks ago`;
}
