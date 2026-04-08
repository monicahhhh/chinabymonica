/**
 * useAutoSaveDraft — Auto-saves article form data to localStorage.
 *
 * - Saves every 30 seconds when the form has changed.
 * - Provides a status indicator ("已自动保存" / "未保存更改").
 * - Offers restore/clear helpers.
 */
import { useState, useEffect, useRef, useCallback } from "react";

const DRAFT_PREFIX = "chinabymonica_draft_";
const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds

export interface DraftState {
  /** Current save status text */
  statusText: string;
  /** Whether a saved draft exists for this key */
  hasDraft: boolean;
  /** Load the saved draft data, returns null if none */
  loadDraft: <T>() => T | null;
  /** Clear the saved draft */
  clearDraft: () => void;
  /** Mark the form as dirty (content changed) */
  markDirty: () => void;
  /** Force save now */
  saveNow: () => void;
}

export function useAutoSaveDraft(
  /** Unique key: article ID or "new" for new articles */
  draftKey: string,
  /** Current form data getter — called when saving */
  getFormData: () => unknown
): DraftState {
  const storageKey = `${DRAFT_PREFIX}${draftKey}`;
  const [hasDraft, setHasDraft] = useState(false);
  const [statusText, setStatusText] = useState("");
  const isDirty = useRef(false);
  const getFormDataRef = useRef(getFormData);
  getFormDataRef.current = getFormData;

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setHasDraft(saved !== null);
    } catch {
      setHasDraft(false);
    }
  }, [storageKey]);

  const doSave = useCallback(() => {
    try {
      const data = getFormDataRef.current();
      const payload = JSON.stringify({
        data,
        savedAt: Date.now(),
      });
      localStorage.setItem(storageKey, payload);
      setHasDraft(true);
      isDirty.current = false;
      const now = new Date();
      const timeStr = now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setStatusText(`已自动保存 ${timeStr}`);
    } catch (e) {
      console.warn("Draft auto-save failed:", e);
      setStatusText("自动保存失败");
    }
  }, [storageKey]);

  // Auto-save interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirty.current) {
        doSave();
      }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [doSave]);

  const markDirty = useCallback(() => {
    isDirty.current = true;
    setStatusText("未保存更改");
  }, []);

  const loadDraft = useCallback(<T,>(): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.data as T;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setStatusText("");
    } catch {
      // ignore
    }
  }, [storageKey]);

  const saveNow = useCallback(() => {
    doSave();
  }, [doSave]);

  return {
    statusText,
    hasDraft,
    loadDraft,
    clearDraft,
    markDirty,
    saveNow,
  };
}
