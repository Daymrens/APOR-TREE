import { FamilyMember } from "@/lib/types";

export interface Connector {
  type: "parent-child" | "spouse";
  from: string;
  to: string;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
  branch: string;
}

interface TreeNode {
  id: string;
  member: FamilyMember;
  x: number;
  y: number;
  width: number;
  children: TreeNode[];
  spouse: TreeNode | null;
  parent: TreeNode | null;
  prelim: number;
  modifier: number;
  generation: number;
}

interface LayoutOptions {
  nodeWidth: number;
  nodeSpacingX: number;
  spouseGap: number;
  generationGapY: number;
}

function buildNodeTree(
  members: FamilyMember[],
  memberMap: Map<string, FamilyMember>,
  rootIds: string[],
  options: LayoutOptions
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const allMembersSet = new Set(members.map(m => m.id));

  members.forEach((member) => {
    const node: TreeNode = {
      id: member.id,
      member,
      x: 0,
      y: 0,
      width: options.nodeWidth,
      children: [],
      spouse: null,
      parent: null,
      prelim: 0,
      modifier: 0,
      generation: member.generation,
    };
    nodeMap.set(member.id, node);
  });

  members.forEach((member) => {
    const node = nodeMap.get(member.id)!;
    member.parentIds.forEach((parentId) => {
      const parent = nodeMap.get(parentId);
      if (parent && allMembersSet.has(parentId)) {
        parent.children.push(node);
        node.parent = parent;
      }
    });

    if (member.spouseId && allMembersSet.has(member.spouseId)) {
      const spouse = nodeMap.get(member.spouseId)!;
      node.spouse = spouse;
    }
  });

  const roots = rootIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is TreeNode => n !== undefined);

  return roots;
}

function firstWalk(node: TreeNode, options: LayoutOptions): void {
  if (node.children.length === 0) {
    if (node.spouse) {
      node.prelim = -node.width / 2 - options.spouseGap / 2;
    } else {
      node.prelim = 0;
    }
  } else {
    node.children.forEach((child) => firstWalk(child, options));

    const childX = node.children.map((c) => c.prelim + c.modifier);
    const minChildX = Math.min(...childX);
    const maxChildX = Math.max(...childX);
    const midpoint = (minChildX + maxChildX) / 2;

    if (node.spouse) {
      const spouseMidpoint = midpoint + node.width / 2 + options.spouseGap / 2;
      node.prelim = midpoint - node.width / 2;
    } else {
      node.prelim = midpoint;
    }
  }
}

function secondWalk(node: TreeNode, modifierSum: number, options: LayoutOptions): void {
  node.x = node.prelim + modifierSum;
  node.modifier = modifierSum;

  if (node.spouse) {
    node.spouse.x = node.x + node.width + options.spouseGap;
    node.spouse.modifier = modifierSum;
    node.spouse.prelim = node.spouse.x;
  }

  node.children.forEach((child) => {
    secondWalk(child, modifierSum + node.modifier, options);
  });
}

function assignYPositions(roots: TreeNode[], options: LayoutOptions): void {
  const generationNodes = new Map<number, TreeNode[]>();

  function collect(node: TreeNode) {
    if (!generationNodes.has(node.generation)) {
      generationNodes.set(node.generation, []);
    }
    generationNodes.get(node.generation)!.push(node);
    node.children.forEach(collect);
    if (node.spouse) collect(node.spouse);
  }

  roots.forEach(collect);

  generationNodes.forEach((nodes, gen) => {
    const y = gen * options.generationGapY;
    nodes.forEach((node) => {
      node.y = y;
      if (node.spouse) node.spouse.y = y;
    });
  });
}

function resolveOverlaps(roots: TreeNode[], options: LayoutOptions): void {
  const nodesByGen = new Map<number, TreeNode[]>();

  function collectAll(node: TreeNode) {
    if (!nodesByGen.has(node.generation)) {
      nodesByGen.set(node.generation, []);
    }
    nodesByGen.get(node.generation)!.push(node);
    if (node.spouse && node.spouse.generation === node.generation) {
      nodesByGen.get(node.generation)!.push(node.spouse);
    }
    node.children.forEach(collectAll);
  }

  roots.forEach(collectAll);

  nodesByGen.forEach((nodes) => {
    nodes.sort((a, b) => a.x - b.x);

    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      const minGap = prev.width + options.nodeSpacingX;

      if (curr.x - prev.x < minGap) {
        const shift = minGap - (curr.x - prev.x);
        shiftSubtree(curr, shift);
      }
    }
  });
}

function shiftSubtree(node: TreeNode, shift: number): void {
  node.x += shift;
  node.prelim += shift;
  node.modifier += shift;
  node.children.forEach((child) => shiftSubtree(child, shift));
  if (node.spouse) {
    node.spouse.x += shift;
    node.spouse.prelim += shift;
    node.spouse.modifier += shift;
  }
}

function collectAllNodes(node: TreeNode, collected: TreeNode[]): void {
  collected.push(node);
  if (node.spouse) collected.push(node.spouse);
  node.children.forEach((child) => collectAllNodes(child, collected));
}

export interface TreeLayoutResult {
  positions: Map<string, { x: number; y: number }>;
  connectors: Connector[];
  bounds: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    maxY: number;
  };
}

export function computeTreePositions(
  members: FamilyMember[],
  options: LayoutOptions
): TreeLayoutResult {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const roots = members
    .filter((m) => m.parentIds.length === 0 || m.generation === 0)
    .map((m) => m.id);

  const rootNodes = buildNodeTree(members, memberMap, roots, options);

  rootNodes.forEach((root) => firstWalk(root, options));
  rootNodes.forEach((root) => secondWalk(root, 0, options));

  assignYPositions(rootNodes, options);

  rootNodes.forEach((root) => {
    const allNodes: TreeNode[] = [];
    collectAllNodes(root, allNodes);
    resolveOverlaps([root], options);
  });

  const positions = new Map<string, { x: number; y: number }>();

  rootNodes.forEach((root) => {
    const allNodes: TreeNode[] = [];
    collectAllNodes(root, allNodes);
    allNodes.forEach((node) => {
      positions.set(node.id, { x: node.x, y: node.y });
      if (node.spouse) {
        positions.set(node.spouse.id, { x: node.spouse.x, y: node.spouse.y });
      }
    });
  });

  // Build connectors
  const connectors: Connector[] = [];
  const allBranches = Array.from(new Set(members.map(m => m.branch))).sort();

  members.forEach((child) => {
    const childPos = positions.get(child.id);
    if (!childPos) return;

    child.parentIds.forEach((parentId) => {
      const parentPos = positions.get(parentId);
      if (parentPos) {
        connectors.push({
          type: "parent-child",
          from: parentId,
          to: child.id,
          fromPos: { x: parentPos.x, y: parentPos.y },
          toPos: { x: childPos.x, y: childPos.y },
          branch: child.branch,
        });
      }
    });
  });

  members.forEach((member) => {
    if (member.spouseId && member.id < member.spouseId) {
      const fromPos = positions.get(member.id);
      const toPos = positions.get(member.spouseId);
      if (fromPos && toPos) {
        connectors.push({
          type: "spouse",
          from: member.id,
          to: member.spouseId,
          fromPos: { x: fromPos.x, y: fromPos.y },
          toPos: { x: toPos.x, y: toPos.y },
          branch: member.branch,
        });
      }
    }
  });

  // Calculate bounds
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;
  const NODE_RADIUS = 30;

  positions.forEach(({ x, y }) => {
    const left = x - NODE_RADIUS;
    const right = x + NODE_RADIUS;
    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, y + NODE_RADIUS);
  });

  const PADDING = 80;
  const bounds = {
    width: maxX - minX + PADDING * 2,
    height: maxY + PADDING * 2,
    minX,
    maxX,
    maxY,
  };

  return { positions, connectors, bounds };
}

export function getRootIds(members: FamilyMember[]): string[] {
  return members
    .filter((m) => m.parentIds.length === 0 || m.generation === 0)
    .map((m) => m.id);
}

export function getSpousePairs(members: FamilyMember[]): Map<string, string> {
  const pairs = new Map<string, string>();
  members.forEach((m) => {
    if (m.spouseId && !pairs.has(m.id) && !pairs.has(m.spouseId)) {
      pairs.set(m.id, m.spouseId);
    }
  });
  return pairs;
}

const BRANCH_COLORS = [
  "#C23B6E", "#E8A63D", "#1E3B2C", "#C9A876",
  "#5C5445", "#8B5E3C", "#2E6B62", "#7C3AED",
];

export function getBranchColor(branch: string, allBranches: string[]): string {
  const index = allBranches.indexOf(branch);
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}