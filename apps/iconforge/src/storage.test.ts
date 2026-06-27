import { parseSvg } from '@toolbox/svg-core';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createProject,
  deleteProject,
  duplicateProject,
  getCurrentProject,
  getCurrentProjectName,
  getStorageEstimate,
  importProject,
  loadProjects,
  loadScene,
  parseProjectFile,
  renameCurrentProject,
  saveScene,
  serializeProjectFile,
  setCurrentProject
} from './storage';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage =
    new MemoryStorage() as unknown as Storage;
});

const sceneFrom = (svg: string) => {
  const parsed = parseSvg(svg);
  if (!parsed.scene) throw new Error('parse failed');
  return parsed.scene;
};

describe('project storage', () => {
  it('migrates a pre-projects scene into a single default project', () => {
    localStorage.setItem(
      'iconforge.svg.v1',
      '<svg viewBox="0 0 24 24"><rect width="8" height="8" /></svg>'
    );

    const scene = loadScene();
    expect(scene.root.children[0]?.tag).toBe('rect');

    const projects = loadProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]?.name).toBe('My App Icon');
    expect(getCurrentProjectName()).toBe('My App Icon');
  });

  it('seeds the IconForge logo as the default project on a clean install', () => {
    const projects = loadProjects();
    expect(projects).toHaveLength(1);
    expect(getCurrentProjectName()).toBe('iconforge-logo');

    const scene = loadScene();
    expect(scene.root.children).toHaveLength(4);
    expect(scene.root.children.map((node) => node.attributes.id)).toEqual([
      'bg',
      'anvil',
      'star-big',
      'star-inside'
    ]);
  });

  it('saves the scene back to the current project', () => {
    saveScene(sceneFrom('<svg viewBox="0 0 24 24"><circle cx="5" cy="5" r="4" /></svg>'));
    expect(loadProjects()).toHaveLength(1);
    expect(loadScene().root.children[0]?.tag).toBe('circle');
  });

  it('renames the current project and keeps it after a reload', () => {
    loadScene();
    renameCurrentProject('Brand mark');
    expect(getCurrentProjectName()).toBe('Brand mark');
    expect(loadProjects()[0]?.name).toBe('Brand mark');
  });

  it('serializes a downloadable project file with name and svg', () => {
    const json = serializeProjectFile(
      'Podcast tile',
      sceneFrom('<svg viewBox="0 0 24 24"><rect width="4" height="4" /></svg>')
    );
    const parsed = JSON.parse(json) as { version: number; name: string; svg: string };
    expect(parsed.version).toBe(1);
    expect(parsed.name).toBe('Podcast tile');
    expect(parsed.svg).toContain('<rect');
  });
});

describe('project library actions', () => {
  it('creates a new blank project and makes it current', () => {
    loadScene();
    const created = createProject('Second');
    expect(getCurrentProject().id).toBe(created.id);
    expect(loadProjects()).toHaveLength(2);
    expect(getCurrentProjectName()).toBe('Second');
  });

  it('switches the current project', () => {
    loadScene();
    const first = getCurrentProject().id;
    const second = createProject('Second');
    setCurrentProject(first);
    expect(getCurrentProject().id).toBe(first);
    setCurrentProject(second.id);
    expect(getCurrentProject().id).toBe(second.id);
  });

  it('duplicates a project as a copy and selects it', () => {
    loadScene();
    renameCurrentProject('Original');
    const original = getCurrentProject().id;
    const copy = duplicateProject(original);
    expect(copy.name).toBe('Original copy');
    expect(getCurrentProject().id).toBe(copy.id);
    expect(loadProjects()).toHaveLength(2);
  });

  it('deletes a project but never the last one', () => {
    loadScene();
    const first = getCurrentProject().id;
    createProject('Second');
    expect(loadProjects()).toHaveLength(2);
    deleteProject(first);
    expect(loadProjects()).toHaveLength(1);
    const onlyId = getCurrentProject().id;
    deleteProject(onlyId);
    expect(loadProjects()).toHaveLength(1);
  });

  it('imports a valid project file and rejects an invalid one', () => {
    loadScene();
    const file = parseProjectFile(
      JSON.stringify({
        version: 1,
        name: 'Brought in',
        svg: '<svg viewBox="0 0 24 24"><rect width="2" height="2" /></svg>'
      })
    );
    expect(file).not.toBeNull();
    const imported = importProject(file!);
    expect(getCurrentProject().id).toBe(imported.id);
    expect(getCurrentProjectName()).toBe('Brought in');

    expect(parseProjectFile('not json')).toBeNull();
    expect(parseProjectFile(JSON.stringify({ name: 'x' }))).toBeNull();
  });

  it('reports a storage estimate that grows with projects', () => {
    loadScene();
    const before = getStorageEstimate();
    expect(before.count).toBe(1);
    createProject('Second');
    const after = getStorageEstimate();
    expect(after.count).toBe(2);
    expect(after.bytes).toBeGreaterThan(before.bytes);
  });
});
