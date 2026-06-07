"use client";
// Drag-and-drop dashboard grid. Tiles (profile cards + widgets like Recent
// Activity) share one sortable space, so a widget can be dropped between cards.
// WHY: order persists per-user via PATCH /api/dashboard-layout (saved on User),
//      following the user across devices. Uses @dnd-kit for touch + keyboard
//      accessibility (native HTML5 drag doesn't work on touch).
//
// Tile *content* is rendered on the server and passed in as `node`; this client
// component only owns ordering + drag interaction. A dedicated drag handle (not
// the whole tile) carries the listeners so inner links/buttons stay clickable.

import { useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type Tile = { id: string; node: ReactNode };

// Honour the saved order, drop ids that no longer exist (deleted cards), and
// append any tiles missing from the saved order (newly created cards).
function reconcile(saved: string[], all: string[]): string[] {
  const present = saved.filter((id) => all.includes(id));
  const missing = all.filter((id) => !present.includes(id));
  return [...present, ...missing];
}

function SortableTile({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-80" : undefined}>
      <div className="relative h-full">
        <button
          type="button"
          aria-label="Drag to reorder tile"
          className="absolute top-2 right-2 z-10 cursor-grab touch-none rounded-md px-1.5 py-0.5 leading-none text-muted transition-colors hover:bg-slate-100 dark:hover:bg-white/10 hover:text-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        {children}
      </div>
    </div>
  );
}

export default function DashboardTiles({ tiles, initialOrder }: { tiles: Tile[]; initialOrder: string[] }) {
  const all = tiles.map((t) => t.id);
  const [order, setOrder] = useState<string[]>(() => reconcile(initialOrder, all));
  const byId = new Map(tiles.map((t) => [t.id, t.node]));

  const sensors = useSensors(
    // distance constraint so a click on inner buttons isn't swallowed by a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
      // Persist optimistically; a failed save just means the order reverts on reload.
      fetch("/api/dashboard-layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next }),
      }).catch(() => {});
      return next;
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((id) => {
            const node = byId.get(id);
            return node ? (
              <SortableTile key={id} id={id}>
                {node}
              </SortableTile>
            ) : null;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
