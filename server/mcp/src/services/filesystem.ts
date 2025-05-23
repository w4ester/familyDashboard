import fs from 'fs-extra';
import path from 'path';
import { FileInfo, FileContent, FileSystemError } from '../types';
import { logger } from '../utils/logger';

class FileSystemService {
  private rootDir: string;
  private allowedDirs: string[];
  private readOnly: boolean;

  constructor() {
    this.rootDir = process.env.ROOT_DIR || './';
    this.allowedDirs = (process.env.ALLOWED_DIRS || './data,./uploads').split(',');
    this.readOnly = process.env.READ_ONLY === 'true';
    
    // Ensure directories exist
    this.allowedDirs.forEach(dir => {
      const fullPath = path.join(this.rootDir, dir);
      fs.ensureDirSync(fullPath);
    });
  }

  /**
   * Validate if a path is within allowed directories
   */
  private isPathAllowed(filePath: string): boolean {
    try {
      // Normalize and resolve the path
      const normalized = path.normalize(filePath);
      const absolute = path.resolve(this.rootDir, normalized);
      
      // Check if it starts with any allowed directory
      return this.allowedDirs.some(dir => {
        const allowedPath = path.resolve(this.rootDir, dir);
        return absolute.startsWith(allowedPath);
      });
    } catch (error) {
      logger.error('Path validation error:', error);
      return false;
    }
  }

  /**
   * Get full path from relative path
   */
  private getFullPath(relativePath: string): string {
    return path.join(this.rootDir, relativePath);
  }

  /**
   * List files and directories in a directory
   */
  async listDirectory(dirPath: string): Promise<FileInfo[]> {
    if (!this.isPathAllowed(dirPath)) {
      throw { 
        code: 'EACCES', 
        message: `Access denied: ${dirPath} is outside allowed directories` 
      } as FileSystemError;
    }

    try {
      const fullPath = this.getFullPath(dirPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      return Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(dirPath, entry.name);
        const fullEntryPath = this.getFullPath(entryPath);
        const stats = await fs.stat(fullEntryPath);
        
        return {
          name: entry.name,
          path: entryPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entry.isFile() ? stats.size : undefined,
          modified: stats.mtime,
          created: stats.birthtime
        };
      }));
    } catch (error: any) {
      logger.error(`Error listing directory ${dirPath}:`, error);
      throw { 
        code: error.code || 'ENOENT',
        message: `Error listing directory: ${error.message}`,
        path: dirPath
      } as FileSystemError;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<FileContent> {
    if (!this.isPathAllowed(filePath)) {
      throw { 
        code: 'EACCES', 
        message: `Access denied: ${filePath} is outside allowed directories` 
      } as FileSystemError;
    }

    try {
      const fullPath = this.getFullPath(filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      return {
        path: filePath,
        content,
        encoding: 'utf8'
      };
    } catch (error: any) {
      logger.error(`Error reading file ${filePath}:`, error);
      throw { 
        code: error.code || 'ENOENT',
        message: `Error reading file: ${error.message}`,
        path: filePath
      } as FileSystemError;
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    if (this.readOnly) {
      throw { 
        code: 'EACCES', 
        message: 'Server is in read-only mode' 
      } as FileSystemError;
    }

    if (!this.isPathAllowed(filePath)) {
      throw { 
        code: 'EACCES', 
        message: `Access denied: ${filePath} is outside allowed directories` 
      } as FileSystemError;
    }

    try {
      const fullPath = this.getFullPath(filePath);
      // Ensure parent directory exists
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, 'utf8');
    } catch (error: any) {
      logger.error(`Error writing file ${filePath}:`, error);
      throw { 
        code: error.code || 'EIO',
        message: `Error writing file: ${error.message}`,
        path: filePath
      } as FileSystemError;
    }
  }

  /**
   * Create a new directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    if (this.readOnly) {
      throw { 
        code: 'EACCES', 
        message: 'Server is in read-only mode' 
      } as FileSystemError;
    }

    if (!this.isPathAllowed(dirPath)) {
      throw { 
        code: 'EACCES', 
        message: `Access denied: ${dirPath} is outside allowed directories` 
      } as FileSystemError;
    }

    try {
      const fullPath = this.getFullPath(dirPath);
      await fs.ensureDir(fullPath);
    } catch (error: any) {
      logger.error(`Error creating directory ${dirPath}:`, error);
      throw { 
        code: error.code || 'EIO',
        message: `Error creating directory: ${error.message}`,
        path: dirPath
      } as FileSystemError;
    }
  }

  /**
   * Delete a file or directory
   */
  async delete(itemPath: string, recursive = false): Promise<void> {
    if (this.readOnly) {
      throw { 
        code: 'EACCES', 
        message: 'Server is in read-only mode' 
      } as FileSystemError;
    }

    if (!this.isPathAllowed(itemPath)) {
      throw { 
        code: 'EACCES', 
        message: `Access denied: ${itemPath} is outside allowed directories` 
      } as FileSystemError;
    }

    try {
      const fullPath = this.getFullPath(itemPath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        if (recursive) {
          await fs.remove(fullPath);
        } else {
          await fs.rmdir(fullPath);
        }
      } else {
        await fs.unlink(fullPath);
      }
    } catch (error: any) {
      logger.error(`Error deleting ${itemPath}:`, error);
      throw { 
        code: error.code || 'EIO',
        message: `Error deleting item: ${error.message}`,
        path: itemPath
      } as FileSystemError;
    }
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService();