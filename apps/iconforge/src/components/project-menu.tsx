import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@toolbox/ui';
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
        <Button variant="secondary" className="w-full gap-[7px]">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          </svg>
          Open
          <span className="text-[11px] leading-none text-muted-foreground" aria-hidden="true">
            ▾
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="grid w-[min(320px,calc(100vw_-_36px))] gap-0.5 rounded-[10px] border-border-strong bg-popover p-1.5 shadow-[0_18px_40px_-16px_rgb(0_0_0_/_55%)]"
        align="start"
        aria-label="Open a project"
      >
        <div className="px-[9px] pb-[5px] pt-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Stored in this browser
        </div>
        <div className="grid max-h-[280px] gap-0.5 overflow-auto">
          {projects.map((project) => {
            const active = project.id === currentId;
            return (
              <div
                key={project.id}
                className="group flex items-center gap-1 rounded-lg border border-transparent pr-1.5 hover:border-border hover:bg-secondary focus-within:border-border focus-within:bg-secondary data-[active]:border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] data-[active]:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
                data-active={active || undefined}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-auto cursor-pointer items-center gap-[10px] rounded-[7px] border-0 bg-transparent px-2 py-[7px] text-left text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px]"
                  onClick={() => {
                    onOpen(project.id);
                    setOpen(false);
                  }}
                >
                  <img
                    className="h-[30px] w-[30px] flex-none rounded-[7px] border border-border bg-canvas"
                    src={thumbs.get(project.id) ?? thumbnailUri(project.svg)}
                    alt=""
                  />
                  <span className="grid min-w-0 gap-px [&_b]:overflow-hidden [&_b]:text-ellipsis [&_b]:whitespace-nowrap [&_b]:text-[12.5px] [&_b]:font-semibold [&_span]:text-[10.5px] [&_span]:text-muted-foreground">
                    <b>{project.name}</b>
                    <span>Edited {formatEdited(project.updatedAt)}</span>
                  </span>
                </button>
                <div className="flex min-w-[26px] flex-none items-center justify-end gap-0.5">
                  {active ? (
                    <span
                      className="grid place-items-center text-primary group-hover:hidden group-focus-within:hidden [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2.6]"
                      title="Current project"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </span>
                  ) : null}
                  <div className="pointer-events-none flex gap-px opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                    <button
                      type="button"
                      className="grid h-[24px] w-[24px] cursor-pointer place-items-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:1.9]"
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
                      className="grid h-[24px] w-[24px] cursor-pointer place-items-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-destructive focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:1.9]"
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

        <div className="mx-1 my-[5px] h-px bg-border" />
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-[9px] rounded-lg border-0 bg-transparent p-2 text-left text-[12.5px] text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:1.9]"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M4 21h16" />
          </svg>
          Import from file…
        </button>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-[9px] rounded-lg border-0 bg-transparent p-2 text-left text-[12.5px] text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:1.9]"
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
          <p
            className="m-0 text-[11px] leading-[1.45] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground"
            role="alert"
          >
            {importError}
          </p>
        ) : null}

        <div className="mx-1 my-[5px] h-px bg-border" />
        <div className="flex items-center gap-[7px] px-[9px] pb-[3px] pt-[5px] text-[10px] tracking-[0.04em] text-muted-foreground [&_svg]:h-[13px] [&_svg]:w-[13px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-width:1.7]">
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
          className="pointer-events-none absolute h-px w-px opacity-0"
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
