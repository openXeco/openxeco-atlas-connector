'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { Taxonomy } from '@/types/taxonomy'

interface TaxonomyTreeProps {
  taxonomies: Taxonomy[]
}

interface TreeNode extends Taxonomy {
  children: TreeNode[]
}

function buildTree(taxonomies: Taxonomy[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  taxonomies.forEach((taxonomy) => {
    map.set(taxonomy.id, { ...taxonomy, children: [] })
  })

  taxonomies.forEach((taxonomy) => {
    const node = map.get(taxonomy.id)!
    if (taxonomy.parentId && map.has(taxonomy.parentId)) {
      const parent = map.get(taxonomy.parentId)!
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

function TreeNodeComponent({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div className={`flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent ${level > 0 ? 'ml-6' : ''}`}>
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent-foreground/10"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <div className="flex-1">
          <div className="font-medium">{node.name}</div>
          {node.description && <div className="text-sm text-muted-foreground">{node.description}</div>}
        </div>
        {hasChildren && (
          <span className="text-xs text-muted-foreground">
            {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
          </span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TaxonomyTree({ taxonomies }: TaxonomyTreeProps) {
  const tree = buildTree(taxonomies)

  if (tree.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">No hierarchical data available</div>
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeNodeComponent key={node.id} node={node} />
      ))}
    </div>
  )
}
