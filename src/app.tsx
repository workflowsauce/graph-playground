"use client";

import { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import SigmaGraph
 from "./graph";
import Sigma from "sigma";

export default function Home() {
  const [code, setCode] = useState(() => {
    // Load code from localStorage on initial render
    const savedCode = localStorage.getItem("graphCode");
    return savedCode || `
    // Define nodes and edges
    const nodes = [
      { id: "abc", label: "A, B, and C" },
      { id: "xyz", label: "X, Y, and Z" }
    ];
    
    const edges = [
      { id: "abc-xyz", source: "abc", target: "xyz" }
    ];
    
    // Define config
    const config = {
      drawEdges: false,
      renderer: "webgl"
    };
    
    // Export graph data
    return { nodes, edges, config };
    `;
  });

  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [config, setConfig] = useState({ drawEdges: true, renderer: "webgl" });

  const runGraph = () => {
    try {
      const func = new Function(code);
      const { nodes, edges, config } = func();

      setGraph({ nodes, edges });
      setConfig(config || {});

      localStorage.setItem("graphCode", code);

    } catch (error) {
      console.error("Error executing code", error);
    }
  };

  useEffect(() => {
    runGraph();
  }, []);

  const resetGraph = () => {
    setCode(`
    // Define nodes and edges
    const nodes = [
      { id: "abc", label: "A, B, and C" },
      { id: "xyz", label: "X, Y, and Z" }
    ];
    
    const edges = [
      { id: "abc-xyz", source: "abc", target: "xyz" }
    ];
    
    // Define config
    const config = {
      drawEdges: false,
      renderer: "webgl"
    };
    
    // Export graph data
    return { nodes, edges, config };
    `);
    runGraph();
  };

  console.log({ graph, config });

  return (
    <div className="flex bg-blue-100">
      <div className="w-1/3">
        <MonacoEditor
          height="90vh"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => setCode(value || "")}
        />
        <button className="mr-2" onClick={runGraph}>
          Run
        </button>
        <button onClick={resetGraph}>Reset</button>
      </div>
      <div className="w-2/3 h-screen" id="sigma-container">
        <SigmaGraph nodes={graph.nodes} edges={graph.edges} />
      </div>
    </div>
  );
}
