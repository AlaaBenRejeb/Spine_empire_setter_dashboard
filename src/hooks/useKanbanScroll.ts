"use client";

import { useCallback, useRef, type WheelEvent } from "react";

const EDGE_TOLERANCE = 2;

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
};

export function useKanbanScroll() {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const panBoard = useCallback((delta: number) => {
    const board = boardRef.current;
    if (!board) return;
    board.scrollBy({ left: delta, behavior: "auto" });
  }, []);

  const handleBoardWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const target = event.target as HTMLElement | null;
      if (isInteractiveTarget(target)) return;
      const lane = target?.closest("[data-kanban-lane-scroll='true']") as HTMLElement | null;

      if (!lane) {
        event.preventDefault();
        panBoard(event.deltaY);
        return;
      }

      const canScrollVertically = lane.scrollHeight - lane.clientHeight > EDGE_TOLERANCE;
      if (!canScrollVertically) {
        event.preventDefault();
        panBoard(event.deltaY);
        return;
      }

      const maxScrollTop = Math.max(lane.scrollHeight - lane.clientHeight, 0);
      const nextScrollTop = Math.min(Math.max(lane.scrollTop + event.deltaY, 0), maxScrollTop);

      event.preventDefault();

      if (Math.abs(nextScrollTop - lane.scrollTop) > EDGE_TOLERANCE) {
        lane.scrollTop = nextScrollTop;
        return;
      }

      panBoard(event.deltaY);
    },
    [panBoard],
  );

  const handleRailWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (isInteractiveTarget(event.target)) return;
      event.preventDefault();
      panBoard(event.deltaY);
    },
    [panBoard],
  );

  return {
    boardRef,
    handleBoardWheel,
    handleRailWheel,
  };
}
