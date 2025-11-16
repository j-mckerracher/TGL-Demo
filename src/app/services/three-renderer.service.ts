import { Injectable } from '@angular/core';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  LineBasicMaterial,
  BufferGeometry,
  Line,
  Vector3,
  Color,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { NetworkState } from '../models/network-state.model';
import { Node, NodeState } from '../models/node.model';
import { Edge } from '../models/edge.model';
import { Transfer } from '../models/transfer.model';

/**
 * Internal context for a single Three.js scene instance
 */
interface SceneContext {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  controls: OrbitControls;
  canvas: HTMLCanvasElement;
  nodeMeshes: Map<string, Mesh>;
  edgeLines: Map<string, Line>;
  particleMeshes: Map<string, Mesh>;
  networkType: 'p2p' | 'tgl';
}

/**
 * Service for managing Three.js rendering across multiple canvases
 * Handles scene creation, updates, resize, and cleanup for P2P/TGL visualizations
 */
@Injectable({
  providedIn: 'root',
})
export class ThreeRendererService {
  private scenes: Map<string, SceneContext> = new Map();
  private nextSceneId = 0;

  /**
   * Creates a new Three.js scene on the provided canvas
   * @param canvas HTMLCanvasElement to render into
   * @param networkType Type of network visualization (p2p or tgl)
   * @returns Scene ID string for future operations
   * @throws Error if WebGL is not supported
   */
  createScene(canvas: HTMLCanvasElement, networkType: 'p2p' | 'tgl'): string {
    // WebGL feature detection
    const gl =
      canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      throw new Error('WebGL is not supported in this browser');
    }

    // Generate unique scene ID
    const sceneId = `scene-${this.nextSceneId++}`;

    // Initialize scene
    const scene = new Scene();
    scene.background = new Color(0x0a0e1a);

    // Initialize camera
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const camera = new PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 0, 50);

    // Initialize renderer
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Store context
    const context: SceneContext = {
      scene,
      camera,
      renderer,
      controls,
      canvas,
      nodeMeshes: new Map(),
      edgeLines: new Map(),
      particleMeshes: new Map(),
      networkType,
    };

    this.scenes.set(sceneId, context);

    return sceneId;
  }

  /**
   * Updates the scene with the current network state
   * @param sceneId Scene identifier
   * @param state Current network state
   */
  updateScene(sceneId: string, state: NetworkState): void {
    const context = this.scenes.get(sceneId);
    if (!context) {
      console.warn(`Scene ${sceneId} not found`);
      return;
    }

    // Update nodes
    this.updateNodes(context, state.nodes);

    // Update edges
    this.updateEdges(context, state.edges, state.nodes);

    // Update particles (transfers)
    this.updateParticles(context, state.transfers, state.nodes);

    // Update controls and render
    context.controls.update();
    context.renderer.render(context.scene, context.camera);
  }

  /**
   * Handles canvas resize events
   * @param sceneId Scene identifier
   */
  handleResize(sceneId: string): void {
    const context = this.scenes.get(sceneId);
    if (!context) {
      return;
    }

    const width = context.canvas.clientWidth;
    const height = context.canvas.clientHeight;

    context.camera.aspect = width / height;
    context.camera.updateProjectionMatrix();
    context.renderer.setSize(width, height);
  }

  /**
   * Destroys a scene and cleans up all resources
   * @param sceneId Scene identifier
   */
  destroyScene(sceneId: string): void {
    const context = this.scenes.get(sceneId);
    if (!context) {
      return;
    }

    // Dispose all node meshes
    context.nodeMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      if (mesh.material instanceof MeshBasicMaterial) {
        mesh.material.dispose();
      }
      context.scene.remove(mesh);
    });
    context.nodeMeshes.clear();

    // Dispose all edge lines
    context.edgeLines.forEach((line) => {
      line.geometry.dispose();
      if (line.material instanceof LineBasicMaterial) {
        line.material.dispose();
      }
      context.scene.remove(line);
    });
    context.edgeLines.clear();

    // Dispose all particle meshes
    context.particleMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      if (mesh.material instanceof MeshBasicMaterial) {
        mesh.material.dispose();
      }
      context.scene.remove(mesh);
    });
    context.particleMeshes.clear();

    // Dispose controls
    context.controls.dispose();

    // Dispose renderer
    context.renderer.dispose();

    // Remove from map
    this.scenes.delete(sceneId);
  }

  /**
   * Updates node meshes based on current node states
   */
  private updateNodes(context: SceneContext, nodes: Node[]): void {
    const currentNodeIds = new Set(nodes.map((n) => n.id));

    // Remove deleted nodes
    const nodesToRemove: string[] = [];
    context.nodeMeshes.forEach((mesh, nodeId) => {
      if (!currentNodeIds.has(nodeId)) {
        mesh.geometry.dispose();
        if (mesh.material instanceof MeshBasicMaterial) {
          mesh.material.dispose();
        }
        context.scene.remove(mesh);
        nodesToRemove.push(nodeId);
      }
    });
    nodesToRemove.forEach((id) => context.nodeMeshes.delete(id));

    // Create or update nodes
    nodes.forEach((node) => {
      let mesh = context.nodeMeshes.get(node.id);

      if (!mesh) {
        mesh = this.createNodeMesh(node);
        context.nodeMeshes.set(node.id, mesh);
        context.scene.add(mesh);
      } else {
        // Update position
        mesh.position.set(node.position.x, node.position.y, node.position.z);

        // Update color based on state
        if (mesh.material instanceof MeshBasicMaterial) {
          mesh.material.color = this.getNodeColor(node.state);
        }
      }
    });
  }

  /**
   * Updates edge lines based on current edge states
   */
  private updateEdges(context: SceneContext, edges: Edge[], nodes: Node[]): void {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const currentEdgeIds = new Set(edges.map((e) => `${e.sourceId}-${e.targetId}`));

    // Remove deleted edges
    const edgesToRemove: string[] = [];
    context.edgeLines.forEach((line, edgeId) => {
      if (!currentEdgeIds.has(edgeId)) {
        line.geometry.dispose();
        if (line.material instanceof LineBasicMaterial) {
          line.material.dispose();
        }
        context.scene.remove(line);
        edgesToRemove.push(edgeId);
      }
    });
    edgesToRemove.forEach((id) => context.edgeLines.delete(id));

    // Create or update edges
    edges.forEach((edge) => {
      const edgeId = `${edge.sourceId}-${edge.targetId}`;
      const sourceNode = nodeMap.get(edge.sourceId);
      const targetNode = nodeMap.get(edge.targetId);

      if (!sourceNode || !targetNode) {
        return;
      }

      let line = context.edgeLines.get(edgeId);

      if (!line) {
        line = this.createEdgeLine(edge, sourceNode, targetNode);
        context.edgeLines.set(edgeId, line);
        context.scene.add(line);
      } else {
        // Update line positions
        const positions = line.geometry.attributes['position'];
        positions.setXYZ(0, sourceNode.position.x, sourceNode.position.y, sourceNode.position.z);
        positions.setXYZ(1, targetNode.position.x, targetNode.position.y, targetNode.position.z);
        positions.needsUpdate = true;

        // Update color based on active state
        if (line.material instanceof LineBasicMaterial) {
          line.material.color = edge.active ? new Color(0x60a5fa) : new Color(0x334155);
          line.material.opacity = edge.active ? 0.9 : 0.35;
        }
      }
    });
  }

  /**
   * Updates particle meshes for active transfers
   */
  private updateParticles(context: SceneContext, transfers: Transfer[], nodes: Node[]): void {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const currentTransferIds = new Set(transfers.map((t) => t.id));

    // Remove completed transfers
    const transfersToRemove: string[] = [];
    context.particleMeshes.forEach((mesh, transferId) => {
      if (!currentTransferIds.has(transferId)) {
        mesh.geometry.dispose();
        if (mesh.material instanceof MeshBasicMaterial) {
          mesh.material.dispose();
        }
        context.scene.remove(mesh);
        transfersToRemove.push(transferId);
      }
    });
    transfersToRemove.forEach((id) => context.particleMeshes.delete(id));

    // Create or update particles
    transfers.forEach((transfer) => {
      const sourceNode = nodeMap.get(transfer.sourceId);
      const targetNode = nodeMap.get(transfer.targetId);

      if (!sourceNode || !targetNode) {
        return;
      }

      let mesh = context.particleMeshes.get(transfer.id);

      if (!mesh) {
        mesh = this.createParticleMesh(transfer);
        context.particleMeshes.set(transfer.id, mesh);
        context.scene.add(mesh);
      }

      // Update particle position using lerp
      const startPos = new Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z);
      const endPos = new Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z);
      const currentPos = startPos.lerp(endPos, transfer.progress);
      mesh.position.copy(currentPos);
    });
  }

  /**
   * Creates a mesh for a node
   */
  private createNodeMesh(node: Node): Mesh {
    const geometry = new SphereGeometry(0.35, 24, 24);
    const material = new MeshBasicMaterial({
      color: this.getNodeColor(node.state),
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(node.position.x, node.position.y, node.position.z);
    return mesh;
  }

  /**
   * Creates a line for an edge
   */
  private createEdgeLine(edge: Edge, sourceNode: Node, targetNode: Node): Line {
    const points = [
      new Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
      new Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z),
    ];
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({
      color: edge.active ? 0x60a5fa : 0x334155,
      linewidth: 1,
      opacity: edge.active ? 0.9 : 0.35,
      transparent: true,
    });
    return new Line(geometry, material);
  }

  /**
   * Creates a mesh for a particle (transfer)
   */
  private createParticleMesh(_transfer: Transfer): Mesh {
    const geometry = new SphereGeometry(0.3, 8, 8);
    const material = new MeshBasicMaterial({
      color: 0x60a5fa,
    });
    return new Mesh(geometry, material);
  }

  /**
   * Maps node state to color
   */
  private getNodeColor(state: NodeState): Color {
    switch (state) {
      case NodeState.IDLE:
        return new Color(0x1d4ed8); // Blue
      case NodeState.ACTIVE:
        return new Color(0x22c55e); // Green
      case NodeState.RECEIVING:
        return new Color(0xfbbf24); // Amber
      case NodeState.SENDING:
        return new Color(0xfbbf24); // Amber
      case NodeState.COMPLETED:
        return new Color(0x22c55e); // Green
      case NodeState.FAILED:
        return new Color(0xef4444); // Red
      default:
        return new Color(0x1d4ed8); // Default blue
    }
  }
}
