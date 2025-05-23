import React, { useState, useEffect } from 'react';
import { mcpServices } from '../services/mcp-integration';

const McpDashboard: React.FC = () => {
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [fileContent, setFileContent] = useState('');
  const [filePath, setFilePath] = useState('/tmp/test.txt');
  const [memoryKey, setMemoryKey] = useState('test-memory');
  const [memoryValue, setMemoryValue] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');

  // Check MCP server connections
  useEffect(() => {
    const checkConnections = async () => {
      const results = await mcpServices.checkConnections();
      setConnections(results);
    };

    checkConnections();
    const interval = setInterval(checkConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filesystem operations
  const handleReadFile = async () => {
    try {
      const result = await mcpServices.filesystem.readFile(filePath);
      if (result) {
        setFileContent(result.content[0].text);
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleWriteFile = async () => {
    try {
      await mcpServices.filesystem.writeFile(filePath, fileContent);
      alert('File written successfully!');
    } catch (error) {
      console.error('Error writing file:', error);
    }
  };

  // Memory operations
  const handleSaveMemory = async () => {
    try {
      await mcpServices.memory.saveMemory(memoryKey, { value: memoryValue });
      alert('Memory saved!');
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  const handleLoadMemory = async () => {
    try {
      const result = await mcpServices.memory.getMemory(memoryKey);
      if (result) {
        setMemoryValue(result.value);
      }
    } catch (error) {
      console.error('Error loading memory:', error);
    }
  };

  // GitHub operations
  const handleCreateIssue = async () => {
    try {
      await mcpServices.github.createIssue(githubRepo, issueTitle, issueBody);
      alert('Issue created!');
    } catch (error) {
      console.error('Error creating issue:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">MCP Services Dashboard</h1>

      {/* Connection Status */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Server Connections</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(connections).map(([server, connected]) => (
            <div
              key={server}
              className={`p-3 rounded text-white text-center ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {server}: {connected ? 'Connected' : 'Disconnected'}
            </div>
          ))}
        </div>
      </div>

      {/* Filesystem Operations */}
      <div className="mb-8 p-6 bg-amber-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Filesystem Operations</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">File Path:</label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">File Content:</label>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full p-2 border rounded"
              rows={5}
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleReadFile}
              className="bg-amber-500 text-white px-4 py-2 rounded"
              disabled={!connections.filesystem}
            >
              Read File
            </button>
            <button
              onClick={handleWriteFile}
              className="bg-orange-500 text-white px-4 py-2 rounded"
              disabled={!connections.filesystem}
            >
              Write File
            </button>
          </div>
        </div>
      </div>

      {/* Memory Operations */}
      <div className="mb-8 p-6 bg-rose-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Memory Operations</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Memory Key:</label>
            <input
              type="text"
              value={memoryKey}
              onChange={(e) => setMemoryKey(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Memory Value:</label>
            <input
              type="text"
              value={memoryValue}
              onChange={(e) => setMemoryValue(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleSaveMemory}
              className="bg-rose-500 text-white px-4 py-2 rounded"
              disabled={!connections.memory}
            >
              Save Memory
            </button>
            <button
              onClick={handleLoadMemory}
              className="bg-rose-600 text-white px-4 py-2 rounded"
              disabled={!connections.memory}
            >
              Load Memory
            </button>
          </div>
        </div>
      </div>

      {/* GitHub Operations */}
      <div className="mb-8 p-6 bg-amber-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">GitHub Operations</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Repository:</label>
            <input
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="owner/repo"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Issue Title:</label>
            <input
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Issue Body:</label>
            <textarea
              value={issueBody}
              onChange={(e) => setIssueBody(e.target.value)}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>
          <button
            onClick={handleCreateIssue}
            className="bg-amber-500 text-white px-4 py-2 rounded"
            disabled={!connections.github}
          >
            Create Issue
          </button>
        </div>
      </div>
    </div>
  );
};

export default McpDashboard;