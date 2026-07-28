import { useState, useEffect } from 'react';
import { UserList } from '../types';

const STORAGE_KEY_WATCHLIST = 'cineverse_watchlist';
const STORAGE_KEY_CUSTOM_LISTS = 'cineverse_custom_lists';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      return saved ? JSON.parse(saved) : ['m1', 's1', 'm3'];
    } catch {
      return ['m1', 's1', 'm3'];
    }
  });

  const [customLists, setCustomLists] = useState<UserList[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_LISTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'list_1',
        name: 'Mind-Benders',
        description: 'Films and series that force you to think',
        items: ['m1', 's1', 's7'],
        createdAt: new Date().toISOString(),
        color: 'from-purple-600 to-indigo-600'
      },
      {
        id: 'list_2',
        name: 'Must-Watch Classics',
        description: 'Top tier masterpieces',
        items: ['s5', 'm3', 'm4'],
        createdAt: new Date().toISOString(),
        color: 'from-amber-500 to-red-600'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
    } catch (e) {
      console.error(e);
    }
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_LISTS, JSON.stringify(customLists));
    } catch (e) {
      console.error(e);
    }
  }, [customLists]);

  const toggleWatchlist = (mediaId: string) => {
    setWatchlist((prev) =>
      prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]
    );
  };

  const isInWatchlist = (mediaId: string) => watchlist.includes(mediaId);

  const createCustomList = (name: string, description: string) => {
    const newList: UserList = {
      id: 'list_' + Date.now(),
      name,
      description,
      items: [],
      createdAt: new Date().toISOString(),
      color: 'from-blue-600 to-cyan-600'
    };
    setCustomLists((prev) => [...prev, newList]);
  };

  const addToList = (listId: string, mediaId: string) => {
    setCustomLists((prev) =>
      prev.map((l) =>
        l.id === listId && !l.items.includes(mediaId)
          ? { ...l, items: [...l.items, mediaId] }
          : l
      )
    );
  };

  const removeFromList = (listId: string, mediaId: string) => {
    setCustomLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, items: l.items.filter((id) => id !== mediaId) } : l
      )
    );
  };

  const deleteCustomList = (listId: string) => {
    setCustomLists((prev) => prev.filter((l) => l.id !== listId));
  };

  return {
    watchlist,
    toggleWatchlist,
    isInWatchlist,
    customLists,
    createCustomList,
    addToList,
    removeFromList,
    deleteCustomList
  };
}
