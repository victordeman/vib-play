import React, { useState } from 'react';
import { FaFolder, FaFolderOpen, FaFileCode, FaFileAlt } from 'react-icons/fa';

interface FileTreeProps {
  projectData: any;
  onFileSelect: (filePath: string, content: string) => void;
  activeFile?: string;
}

const FileNode = ({ name, isFolder, isOpen, onClick, isActive }: {
  name: string;
  isFolder: boolean;
  isOpen?: boolean;
  onClick: () => void;
  isActive?: boolean;
}) => {
  return (
    <div
      className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-800 transition-colors rounded text-sm ${isActive ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
      onClick={onClick}
    >
      {isFolder ? (
        isOpen ? <FaFolderOpen className="text-yellow-500" /> : <FaFolder className="text-yellow-500" />
      ) : (
        name.endsWith('.md') ? <FaFileAlt className="text-gray-400" /> : <FaFileCode className="text-blue-400" />
      )}
      <span className="truncate">{name}</span>
    </div>
  );
};

const Folder = ({ name, children, defaultOpen = false }: { name: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="ml-2">
      <FileNode name={name} isFolder={true} isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      {isOpen && <div className="ml-4 border-l border-gray-700">{children}</div>}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ projectData, onFileSelect, activeFile }) => {
  if (!projectData) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 overflow-y-auto w-64 min-w-[16rem]">
      <div className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 flex justify-between items-center">
        Project Files
      </div>
      <div className="p-2 space-y-1">
        {projectData.frontend?.files && (
          <Folder name="frontend" defaultOpen={true}>
            {Object.entries(projectData.frontend.files).map(([path, content]) => (
              <FileNode
                key={`frontend/${path}`}
                name={path}
                isFolder={false}
                isActive={activeFile === `frontend/${path}`}
                onClick={() => onFileSelect(`frontend/${path}`, content as string)}
              />
            ))}
          </Folder>
        )}

        {projectData.backend?.files && (
          <Folder name="backend" defaultOpen={true}>
            {Object.entries(projectData.backend.files).map(([path, content]) => (
              <FileNode
                key={`backend/${path}`}
                name={path}
                isFolder={false}
                isActive={activeFile === `backend/${path}`}
                onClick={() => onFileSelect(`backend/${path}`, content as string)}
              />
            ))}
          </Folder>
        )}

        {projectData.rootFiles && Object.entries(projectData.rootFiles).map(([path, content]) => (
          <FileNode
            key={path}
            name={path}
            isFolder={false}
            isActive={activeFile === path}
            onClick={() => onFileSelect(path, content as string)}
          />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
