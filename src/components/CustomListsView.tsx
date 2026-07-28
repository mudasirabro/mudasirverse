import React, { useState } from 'react';
import { Plus, Trash2, ListPlus, Film, FolderHeart, FolderCheck, ChevronRight } from 'lucide-react';
import { UserList, MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface CustomListsViewProps {
  customLists: UserList[];
  createCustomList: (name: string, description: string) => void;
  deleteCustomList: (listId: string) => void;
  removeFromList: (listId: string, mediaId: string) => void;
  catalog: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onOpenTrailer: (youtubeId: string, title: string) => void;
  isInWatchlist: (id: string) => boolean;
  toggleWatchlist: (id: string) => void;
}

export const CustomListsView: React.FC<CustomListsViewProps> = ({
  customLists,
  createCustomList,
  deleteCustomList,
  removeFromList,
  catalog,
  onSelectMedia,
  onOpenTrailer,
  isInWatchlist,
  toggleWatchlist
}) => {
  const [selectedListId, setSelectedListId] = useState<string>(customLists[0]?.id || '');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  const currentList = customLists.find((l) => l.id === selectedListId) || customLists[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createCustomList(newListName.trim(), newListDesc.trim());
    setNewListName('');
    setNewListDesc('');
    setShowNewModal(false);
  };

  const listItems = currentList
    ? currentList.items
        .map((id) => catalog.find((m) => m.id === id))
        .filter((m): m is MediaItem => m !== undefined)
    : [];

  return (
    <div className="space-y-8 py-4" id="custom-lists-view">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ListPlus className="w-6 h-6 text-blue-400" />
            My Custom Curated Lists
          </h2>
          <p className="text-xs text-zinc-400">
            Organize your favorite movies and series into custom thematic collections
          </p>
        </div>

        <button
          id="create-new-list-btn"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Create New List
        </button>
      </div>

      {/* Lists Tabs & Active List Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: List Sidebar Tabs */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
            All Collections ({customLists.length})
          </h3>

          <div className="space-y-2">
            {customLists.map((list) => (
              <div
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`group flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedListId === list.id
                    ? 'bg-zinc-800 text-white border-blue-500/60 shadow-lg'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/60 hover:text-white'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm truncate">{list.name}</h4>
                  <p className="text-[11px] text-zinc-500 truncate">{list.items.length} titles</p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete list "${list.name}"?`)) deleteCustomList(list.id);
                    }}
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-800"
                    title="Delete list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Items in Active List */}
        <div className="lg:col-span-3 space-y-6">
          {currentList ? (
            <div className="space-y-6">
              
              {/* List Header Card */}
              <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-indigo-950/40 border border-blue-500/30 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{currentList.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{currentList.description || 'Custom collection'}</p>
                </div>

                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-xs">
                  {listItems.length} Titles
                </span>
              </div>

              {/* Items Grid */}
              {listItems.length === 0 ? (
                <div className="py-12 px-4 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                  <Film className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm font-medium">No titles in this collection yet.</p>
                  <p className="text-zinc-500 text-xs mt-1">Explore titles and click "Add to List" from media details.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {listItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <MediaCard
                        item={item}
                        onSelect={onSelectMedia}
                        onOpenTrailer={onOpenTrailer}
                        isInWatchlist={isInWatchlist(item.id)}
                        toggleWatchlist={toggleWatchlist}
                      />
                      <button
                        onClick={() => removeFromList(currentList.id, item.id)}
                        className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-zinc-950/90 text-rose-400 hover:text-white border border-rose-500/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Select or create a list to view titles.</p>
          )}
        </div>

      </div>

      {/* Modal: Create New List */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderHeart className="w-5 h-5 text-blue-400" />
              Create Custom List
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">List Name</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Sci-Fi Masterpieces"
                className="w-full bg-zinc-900 text-xs text-white p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Description (Optional)</label>
              <input
                type="text"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder="e.g. Movies with deep philosophical mind twists"
                className="w-full bg-zinc-900 text-xs text-white p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newListName.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
              >
                Create Collection
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
