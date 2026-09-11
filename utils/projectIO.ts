import { TreeNode, CamTable } from '../types';

export interface ProjectData {
  version: string;
  name: string;
  savedAt: string;
  data: TreeNode[];
  camTables: CamTable[];
}

const PROJECT_VERSION = '1.0.0';
const AUTOSAVE_KEY = 'motion-size-autosave';

export const exportProject = (data: TreeNode[], camTables: CamTable[], name: string = 'Untitled'): string => {
  const project: ProjectData = {
    version: PROJECT_VERSION,
    name,
    savedAt: new Date().toISOString(),
    data,
    camTables,
  };
  return JSON.stringify(project, null, 2);
};

export const importProject = (jsonString: string): ProjectData => {
  const parsed = JSON.parse(jsonString);
  if (!parsed.version || !parsed.data) {
    throw new Error('Invalid project file format');
  }
  return parsed as ProjectData;
};

export const downloadProjectFile = (data: TreeNode[], camTables: CamTable[], name: string = 'Untitled') => {
  const json = exportProject(data, camTables, name);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_')}.msp.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const openProjectFile = (): Promise<ProjectData> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.msp.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = importProject(ev.target?.result as string);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
};

export const autoSave = (data: TreeNode[], camTables: CamTable[]) => {
  try {
    const json = exportProject(data, camTables, 'AutoSave');
    localStorage.setItem(AUTOSAVE_KEY, json);
  } catch (e) {
    console.warn('AutoSave failed:', e);
  }
};

export const loadAutoSave = (): ProjectData | null => {
  try {
    const json = localStorage.getItem(AUTOSAVE_KEY);
    if (!json) return null;
    return importProject(json);
  } catch {
    return null;
  }
};
