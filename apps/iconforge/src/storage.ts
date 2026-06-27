import { parseSvg, serializeSvg, type SvgScene } from '@toolbox/svg-core';

const projectsStorageKey = 'iconforge.projects.v1';
const legacySceneKey = 'iconforge.svg.v1';
export const exportInsetStorageKey = 'iconforge.export-inset';
export const maxExportInsetPct = 40;

const defaultSvg =
  '<svg viewBox="0 0 1024 1024"><rect x="160" y="160" width="704" height="704" rx="176" fill="#1f2a24"/></svg>';
const defaultProjectName = 'My App Icon';

const defaultProject: ProjectFile = {
  version: 1,
  name: 'iconforge-logo',
  svg: `<svg fill="none" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#fff" height="680" id="bg" rx="55" transform="translate(161 166)" width="680" x="11" y="6" />
  <path d="m3 11 6-2.8h11.4q.6 0 .6.6v1.6q0 .6-.6.6h-4.8q-.3 2-2.2 3.1h.6q.7 0 .6.7l-.3 2.2H16q.7 0 .7.7v.9q0 .6-.7.6H8q-.7 0-.7-.6v-.9q0-.7.7-.7h1.7l-.3-2.2q-.1-.7.6-.7h.6Q8.7 13 8.5 11v-.4Z" fill="#050609" id="anvil" transform="translate(173.872 -26.345) scale(35) rotate(12)" />
  <path d="M17.8 2.6c0 1.4.6 2 2 2-1.4 0-2 .6-2 2 0-1.4-.6-2-2-2 1.4 0 2-.6 2-2" fill="#ff7a66" id="star-big" transform="translate(-279 92) scale(55)" />
  <path d="M17.8 2.6c0 1.4.6 2 2 2-1.4 0-2 .6-2 2 0-1.4-.6-2-2-2 1.4 0 2-.6 2-2" fill="#fff" id="star-inside" transform="translate(343.999 253) scale(20)" />
</svg>`
};

export interface IconforgeProject {
  readonly id: string;
  readonly name: string;
  readonly svg: string;
  readonly updatedAt: number;
}

interface ProjectStore {
  currentId: string;
  projects: IconforgeProject[];
}

export interface ProjectFile {
  readonly version: 1;
  readonly name: string;
  readonly svg: string;
}

function newId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `p-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function readStore(): ProjectStore | null {
  try {
    const raw = localStorage.getItem(projectsStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProjectStore;
    if (!parsed || !Array.isArray(parsed.projects) || parsed.projects.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStore(store: ProjectStore): void {
  localStorage.setItem(projectsStorageKey, JSON.stringify(store));
}

function migrate(): ProjectStore {
  const legacySvg = localStorage.getItem(legacySceneKey);
  const project: IconforgeProject = legacySvg
    ? { id: newId(), name: defaultProjectName, svg: legacySvg, updatedAt: Date.now() }
    : { id: newId(), name: defaultProject.name, svg: defaultProject.svg, updatedAt: Date.now() };
  const store: ProjectStore = { currentId: project.id, projects: [project] };
  writeStore(store);
  return store;
}

function ensureStore(): ProjectStore {
  return readStore() ?? migrate();
}

function currentOf(store: ProjectStore): IconforgeProject {
  return store.projects.find((project) => project.id === store.currentId) ?? store.projects[0]!;
}

export function loadProjects(): readonly IconforgeProject[] {
  return ensureStore().projects;
}

export function getCurrentProject(): IconforgeProject {
  return currentOf(ensureStore());
}

export function getCurrentProjectName(): string {
  return getCurrentProject().name;
}

export function renameCurrentProject(name: string): void {
  const store = ensureStore();
  store.projects = store.projects.map((project) =>
    project.id === store.currentId ? { ...project, name, updatedAt: Date.now() } : project
  );
  writeStore(store);
}

export function loadScene(): SvgScene {
  const parsed = parseSvg(getCurrentProject().svg);
  if (parsed.scene) return parsed.scene;
  const fallback = parseSvg(defaultSvg);
  if (fallback.scene) return fallback.scene;
  throw new Error('Default SVG scene could not be parsed.');
}

export function saveScene(scene: SvgScene): void {
  const store = ensureStore();
  const svg = serializeSvg(scene, { pretty: true });
  store.projects = store.projects.map((project) =>
    project.id === store.currentId ? { ...project, svg, updatedAt: Date.now() } : project
  );
  writeStore(store);
}

export function serializeProjectFile(name: string, scene: SvgScene): string {
  const file: ProjectFile = { version: 1, name, svg: serializeSvg(scene, { pretty: true }) };
  return JSON.stringify(file, null, 2);
}

export function projectFileBase(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'icon'
  );
}

export function setCurrentProject(id: string): void {
  const store = ensureStore();
  if (!store.projects.some((project) => project.id === id)) return;
  store.currentId = id;
  writeStore(store);
}

export function createProject(name = 'Untitled icon'): IconforgeProject {
  const store = ensureStore();
  const project: IconforgeProject = { id: newId(), name, svg: defaultSvg, updatedAt: Date.now() };
  store.projects = [project, ...store.projects];
  store.currentId = project.id;
  writeStore(store);
  return project;
}

export function duplicateProject(id: string): IconforgeProject {
  const store = ensureStore();
  const source = store.projects.find((project) => project.id === id) ?? currentOf(store);
  const project: IconforgeProject = {
    id: newId(),
    name: `${source.name} copy`,
    svg: source.svg,
    updatedAt: Date.now()
  };
  const index = store.projects.findIndex((candidate) => candidate.id === source.id);
  store.projects = [
    ...store.projects.slice(0, index + 1),
    project,
    ...store.projects.slice(index + 1)
  ];
  store.currentId = project.id;
  writeStore(store);
  return project;
}

export function deleteProject(id: string): void {
  const store = ensureStore();
  if (store.projects.length <= 1) return;
  store.projects = store.projects.filter((project) => project.id !== id);
  if (!store.projects.some((project) => project.id === store.currentId)) {
    store.currentId = store.projects[0]!.id;
  }
  writeStore(store);
}

export function parseProjectFile(raw: string): ProjectFile | null {
  try {
    const data = JSON.parse(raw) as Partial<ProjectFile>;
    if (typeof data?.svg !== 'string' || !parseSvg(data.svg).scene) return null;
    return {
      version: 1,
      name: typeof data.name === 'string' ? data.name : 'Imported icon',
      svg: data.svg
    };
  } catch {
    return null;
  }
}

export function importProject(file: ProjectFile): IconforgeProject {
  const store = ensureStore();
  const project: IconforgeProject = {
    id: newId(),
    name: file.name || 'Imported icon',
    svg: file.svg,
    updatedAt: Date.now()
  };
  store.projects = [project, ...store.projects];
  store.currentId = project.id;
  writeStore(store);
  return project;
}

export function getStorageEstimate(): { readonly count: number; readonly bytes: number } {
  const store = ensureStore();
  const bytes = new TextEncoder().encode(JSON.stringify(store)).length;
  return { count: store.projects.length, bytes };
}

export function loadExportInset(): number {
  const stored = Number(localStorage.getItem(exportInsetStorageKey));
  if (!Number.isFinite(stored)) return 0;
  return clampInset(stored);
}

export function clampInset(value: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), maxExportInsetPct) : 0;
}
