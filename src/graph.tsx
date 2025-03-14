import React, { useEffect, useRef } from "react";

import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";

import Sigma from "sigma";

export default function SigmaGraph(props: any) {
  const ref = useRef(null);

  useEffect(() => {
    const graph = new Graph();

    const { nodes = [], edges = [] } = props;

    nodes.forEach((node: any) => {
      graph.addNode(node.id, {
        ...node,
        x: node.x || Math.random(),
        y: node.y || Math.random(),
        size: node.size || 5,
      });
    });

    edges.forEach((edge: any) => {
      graph.addEdge(edge.source, edge.target, edge);
    });

    const layout = new ForceSupervisor(graph, {
      isNodeFixed: (_, attr) => attr.highlighted,
      settings: {
        attraction: 0.000125, // Increase attraction to pull connected nodes closer
        repulsion: 0.5, // Decrease repulsion to allow nodes to be closer
        // gravity: .00000002, // Increase gravity to pull all nodes towards the center
        // inertia: 0.5, // Keep inertia as is for smooth transitions
        // maxMove: 200, // Reduce maxMove to limit node travel per step
      },
    });
    layout.start();

    const state: any = {};

    // Create the sigma
    const renderer = new Sigma(graph, ref.current as any, {
      minCameraRatio: 0.25,
      maxCameraRatio: 2,
      labelRenderedSizeThreshold: 4,
      renderEdgeLabels: true,
      edgeLabelSize: 12,
    });

    function setSelectedNode(node?: string) {
      if (node) {
        state.selectedNode = node;
      } else {
        state.selectedNode = undefined;
      }

      // Refresh rendering
      renderer.refresh({
        skipIndexation: true,
      });
    }

    renderer.on("clickNode", ({ node }) => {
      setSelectedNode(node);
    });

    renderer.on("clickStage", () => {
      setSelectedNode(undefined);
    });

    function setHoveredNode(node?: string) {
      if (node) {
        state.hoveredNode = node;
        state.hoveredNeighbors = new Set(graph.neighbors(node));
      }

      if (!node) {
        state.hoveredNode = undefined;
        state.hoveredNeighbors = undefined;
      }

      // Refresh rendering
      renderer.refresh({
        // We don't touch the graph data so we can skip its reindexation
        skipIndexation: true,
      });
    }

    renderer.on("enterNode", ({ node }) => {
      setHoveredNode(node);
    });
    renderer.on("leaveNode", () => {
      setHoveredNode(undefined);
    });

    renderer.setSetting("edgeReducer", (edge, data) => {
      const res: any = { ...data };

      if (
        (state.hoveredNode || state.selectedNode) &&
        !graph
          .extremities(edge)
          .every(
            (n) =>
              n === state.hoveredNode ||
              n === state.selectedNode ||
              graph.areNeighbors(n, state.hoveredNode) ||
              graph.areNeighbors(n, state.selectedNode)
          )
      ) {
        res.hidden = true;
      }

      if (
        state.suggestions &&
        (!state.suggestions.has(graph.source(edge)) ||
          !state.suggestions.has(graph.target(edge)))
      ) {
        res.hidden = true;
      }

      return res;
    });

    renderer.setSetting("nodeReducer", (node, data) => {
      const res: any = { ...data };

      if (
        (state.hoveredNeighbors || state.selectedNode) &&
        !state.hoveredNeighbors?.has(node) &&
        state.hoveredNode !== node &&
        state.selectedNode !== node &&
        !graph.areNeighbors(node, state.selectedNode)
      ) {
        res.label = "";
        res.color = "#f6f6f6";
      }

      if (state.selectedNode === node || state.hoveredNode === node) {
        res.highlighted = true;
      } else if (state.suggestions) {
        if (state.suggestions.has(node)) {
          res.forceLabel = true;
        } else {
          res.label = "";
          res.color = "#f6f6f6";
        }
      }

      return res;
    });

    // State for drag'n'drop
    let draggedNode: string | null = null;
    let isDragging = false;

    // On mouse down on a node
    //  - we enable the drag mode
    //  - save in the dragged node in the state
    //  - highlight the node
    //  - disable the camera so its state is not updated
    renderer.on("downNode", (e) => {
      isDragging = true;
      draggedNode = e.node;
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
    });

    // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
    renderer.on("moveBody", ({ event }) => {
      if (!isDragging || !draggedNode) return;

      // Get new position of node
      const pos = renderer.viewportToGraph(event);

      graph.setNodeAttribute(draggedNode, "x", pos.x);
      graph.setNodeAttribute(draggedNode, "y", pos.y);

      // Prevent sigma to move camera:
      event.preventSigmaDefault();
      event.original.preventDefault();
      event.original.stopPropagation();
    });

    // On mouse up, we reset the dragging mode
    const handleUp = () => {
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, "highlighted");
      }
      isDragging = false;
      draggedNode = null;
    };
    renderer.on("upNode", handleUp);
    renderer.on("upStage", handleUp);
  }, [props.nodes, props.edges, ref]);

  return <div className="w-full h-screen" ref={ref} />;
}
