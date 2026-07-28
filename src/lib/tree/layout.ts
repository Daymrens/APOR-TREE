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
  height: number;
  children: TreeNode[];
  spouse: TreeNode | null;
  parent: TreeNode | null;
  subtreeWidth: number;
  generation: number;
}

interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
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
  const allMembersSet = new Set(members.map((m) => m.id));

  members.forEach((member) => {
    const node: TreeNode = {
      id: member.id,
      member,
      x: 0,
      y: 0,
      width: options.nodeWidth,
      height: options.nodeHeight,
      children: [],
      spouse: null,
      parent: null,
      subtreeWidth: 0,
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
      if (member.id < member.spouseId) {
        const spouse = nodeMap.get(member.spouseId)!;
        node.spouse = spouse;
      }
    }
  });

  // Sort children by birthOrder
  nodeMap.forEach((node) => {
    node.children.sort((a, b) => a.member.birthOrder - b.member.birthOrder);
  });

  const roots = rootIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is TreeNode => n !== undefined);

  return roots;
}

function computeSubtreeWidth(node: TreeNode, options: LayoutOptions, visited: Set<string>): number {
  if (visited.has(node.id)) {
    node.subtreeWidth = 0;
    return 0;
  }

  // Width of this node + spouse side-by-side
  let selfWidth = node.width;
  if (node.spouse && !visited.has(node.spouse.id)) {
    selfWidth += options.spouseGap + node.spouse.width;
  }

  // Filter children that will actually be positioned
  const activeChildren = node.children.filter(
    (c) => !visited.has(c.id)
  );

  if (activeChildren.length === 0) {
    node.subtreeWidth = selfWidth;
    return node.subtreeWidth;
  }

  // Compute total children width
  let childrenWidth = 0;
  for (let i = 0; i < activeChildren.length; i++) {
    if (i > 0) childrenWidth += options.nodeSpacingX;
    childrenWidth += computeSubtreeWidth(activeChildren[i], options, visited);
  }

  node.subtreeWidth = Math.max(selfWidth, childrenWidth);
  return node.subtreeWidth;
}

function positionSubtree(
  node: TreeNode,
  centerX: number,
  y: number,
  options: LayoutOptions,
  visited: Set<string>
): void {
  if (visited.has(node.id)) return;
  visited.add(node.id);

  node.x = centerX;
  node.y = y;

  // Position spouse to the right
  if (node.spouse && !visited.has(node.spouse.id)) {
    node.spouse.x = node.x + node.width + options.spouseGap;
    node.spouse.y = y;
    visited.add(node.spouse.id);
  }

  // Filter children that will actually be positioned
  const activeChildren = node.children.filter(
    (c) => !visited.has(c.id)
  );

  if (activeChildren.length === 0) return;

  // Compute total children width
  let childrenTotalWidth = 0;
  for (let i = 0; i < activeChildren.length; i++) {
    if (i > 0) childrenTotalWidth += options.nodeSpacingX;
    childrenTotalWidth += activeChildren[i].subtreeWidth;
  }

  // Position children, centered under parent
  let childX = centerX - childrenTotalWidth / 2;
  for (const child of activeChildren) {
    const childCenterX = childX + child.subtreeWidth / 2;
    positionSubtree(child, childCenterX, y + options.generationGapY, options, visited);
    childX += child.subtreeWidth + options.nodeSpacingX;
  }
}

function assignYByGeneration(roots: TreeNode[], options: LayoutOptions): void {
  const visited = new Set<string>();

  function assign(node: TreeNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    const y = node.generation * options.generationGapY;
    node.y = y;

    if (node.spouse && !visited.has(node.spouse.id)) {
      node.spouse.y = y;
      visited.add(node.spouse.id);
    }

    node.children.forEach(assign);
  }

  roots.forEach(assign);
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

  // Compute subtree widths bottom-up (skip visited to avoid duplicates from spouse links)
  const visitedWidths = new Set<string>();
  rootNodes.forEach((root) => computeSubtreeWidth(root, options, visitedWidths));

  // Assign Y positions by generation
  assignYByGeneration(rootNodes, options);

  // Position nodes top-down, centering parents over children
  const visitedPositions = new Set<string>();
  // Start roots at x = 0, they'll be shifted to positive coordinates later
  rootNodes.forEach((root) => {
    positionSubtree(root, 0, root.generation * options.generationGapY, options, visitedPositions);
  });

  // Shift all nodes so minX is at 0
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;

  const allNodes: TreeNode[] = [];
  const visitedCollect = new Set<string>();

  function collect(node: TreeNode) {
    if (visitedCollect.has(node.id)) return;
    visitedCollect.add(node.id);
    allNodes.push(node);
    if (node.spouse && !visitedCollect.has(node.spouse.id)) {
      allNodes.push(node.spouse);
      visitedCollect.add(node.spouse.id);
    }
    node.children.forEach(collect);
  }

  rootNodes.forEach(collect);

  allNodes.forEach((node) => {
    minX = Math.min(minX, node.x - node.width / 2);
    maxX = Math.max(maxX, node.x + node.width / 2);
    maxY = Math.max(maxY, node.y + node.height / 2);
  });

  // Shift all nodes so minX = 0
  const offsetX = -minX;
  allNodes.forEach((node) => {
    node.x += offsetX;
  });

  // Recalculate bounds after shift
  minX = 0;
  maxX = 0;
  maxY = 0;
  allNodes.forEach((node) => {
    maxX = Math.max(maxX, node.x + node.width / 2);
    maxY = Math.max(maxY, node.y + node.height / 2);
  });

  // Build positions map
  const positions = new Map<string, { x: number; y: number }>();
  allNodes.forEach((node) => {
    positions.set(node.id, { x: node.x, y: node.y });
  });

  // Build connectors
  const connectors: Connector[] = [];

  // Parent-child connectors: bottom-center of parent to top-center of child
  members.forEach((child) => {
    const childPos = positions.get(child.id);
    if (!childPos) return;

    child.parentIds.forEach((parentId) => {
      const parentPos = positions.get(parentId);
      if (parentPos) {
        const parentMember = memberMap.get(parentId);
        connectors.push({
          type: "parent-child",
          from: parentId,
          to: child.id,
          fromPos: {
            x: parentPos.x,
            y: parentPos.y + options.nodeHeight / 2,
          },
          toPos: {
            x: childPos.x,
            y: childPos.y - options.nodeHeight / 2,
          },
          branch: child.branch,
        });
      }
    });
  });

  // Spouse connectors: right-center of left card to left-center of right card
  members.forEach((member) => {
    if (member.spouseId && member.id < member.spouseId) {
      const fromPos = positions.get(member.id);
      const toPos = positions.get(member.spouseId);
      if (fromPos && toPos) {
        connectors.push({
          type: "spouse",
          from: member.id,
          to: member.spouseId,
          fromPos: {
            x: fromPos.x + options.nodeWidth / 2,
            y: fromPos.y,
          },
          toPos: {
            x: toPos.x - options.nodeWidth / 2,
            y: toPos.y,
          },
          branch: member.branch,
        });
      }
    }
  });

  // Final bounds with padding
  const PADDING = 80;
  const bounds = {
    width: maxX + PADDING * 2,
    height: maxY + PADDING * 2,
    minX: 0,
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
