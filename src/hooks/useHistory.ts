
"use client";

import { useState, useCallback } from 'react';

export const useHistoryState = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const setState = useCallback((action: T | ((prevState: T) => T)) => {
    const newState = typeof action === 'function' 
        ? (action as (prevState: T) => T)(history[index]) 
        : action;
        
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);
    
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  }, [index, history]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prevIndex => prevIndex - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prevIndex => prevIndex + 1);
    }
  }, [index, history.length]);
  
  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const resetHistory = useCallback((state: T) => {
      setHistory([state]);
      setIndex(0);
  }, []);

  return { 
    state: history[index], 
    setState, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    resetHistory 
  };
};
