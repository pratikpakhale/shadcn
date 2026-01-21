"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Loader2,
  Search,
  Heart,
  BookmarkPlus,
  Library,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Trash2,
} from "lucide-react";

interface Registry {
  name: string;
  url: string;
  domain: string;
}

interface LibraryItem {
  url: string;
  title: string;
  registryName: string;
  addedAt: number;
}

interface LibraryFolder {
  id: string;
  name: string;
  items: LibraryItem[];
  collapsed?: boolean;
}

const CUSTOM_REGISTRIES = [
  {
    name: "21st.dev",
    url: "https://21st.dev/home",
    domain: "21st.dev",
  },
];

export default function RegistryPreview() {
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [filteredRegistries, setFilteredRegistries] = useState<Registry[]>([]);
  const [selectedRegistry, setSelectedRegistry] = useState<Registry | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [iframeUrl, setIframeUrl] = useState("");

  // Library management state
  const [libraries, setLibraries] = useState<LibraryFolder[]>([]);
  const [showAddToLibraryDialog, setShowAddToLibraryDialog] = useState(false);
  const [showCreateLibraryDialog, setShowCreateLibraryDialog] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState("");
  const [selectedLibraries, setSelectedLibraries] = useState<Set<string>>(
    new Set()
  );
  const [favoritesMode, setFavoritesMode] = useState(false);
  const [currentPageTitle, setCurrentPageTitle] = useState("");
  const [editableUrl, setEditableUrl] = useState("");
  const [extensionActive, setExtensionActive] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasRegistries = useMemo(() => registries.length > 0, [registries]);

  useEffect(() => {
    fetchRegistries();
    loadFavorites();
    loadLibraries();
  }, []);

  useEffect(() => {
    const filtered = registries.filter(
      (registry) =>
        registry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        registry.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedFiltered = filtered.sort((a, b) => {
      const aIsFav = favorites.has(a.domain);
      const bIsFav = favorites.has(b.domain);
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;
      return 0;
    });
    setFilteredRegistries(sortedFiltered);
  }, [registries, searchQuery, favorites]);

  useEffect(() => {
    if (selectedRegistry) {
      setIframeUrl(selectedRegistry.url);
      setCurrentPageTitle(selectedRegistry.name);
    }
  }, [selectedRegistry]);

  // Listen for messages from the browser extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from our extension
      if (event.data && event.data.type === "SHADCN_HUB_IFRAME_URL_UPDATE") {
        setIframeUrl(event.data.url);
        setExtensionActive(true);
        if (event.data.title) {
          setCurrentPageTitle(event.data.title);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem("registry-favorites");
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const saveFavorites = (newFavorites: Set<string>) => {
    try {
      localStorage.setItem(
        "registry-favorites",
        JSON.stringify(Array.from(newFavorites))
      );
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  const toggleFavorite = (domain: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(domain)) {
      newFavorites.delete(domain);
    } else {
      newFavorites.add(domain);
      const registryList = document.querySelector(".flex-1.overflow-y-auto");
      if (registryList) {
        registryList.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  // Library management functions
  const loadLibraries = () => {
    try {
      const savedLibraries = localStorage.getItem("component-libraries");
      if (savedLibraries) {
        setLibraries(JSON.parse(savedLibraries));
      }
    } catch (error) {
      console.error("Error loading libraries:", error);
    }
  };

  const saveLibraries = (newLibraries: LibraryFolder[]) => {
    try {
      localStorage.setItem("component-libraries", JSON.stringify(newLibraries));
      setLibraries(newLibraries);
    } catch (error) {
      console.error("Error saving libraries:", error);
    }
  };

  const createLibrary = () => {
    if (newLibraryName.trim()) {
      const newLibrary: LibraryFolder = {
        id: Date.now().toString(),
        name: newLibraryName.trim(),
        items: [],
        collapsed: false,
      };
      saveLibraries([...libraries, newLibrary]);
      setNewLibraryName("");
      setShowCreateLibraryDialog(false);
    }
  };

  const deleteLibrary = (libraryId: string) => {
    const updatedLibraries = libraries.filter((lib) => lib.id !== libraryId);
    saveLibraries(updatedLibraries);
  };

  const toggleLibraryCollapse = (libraryId: string) => {
    const updatedLibraries = libraries.map((lib) =>
      lib.id === libraryId ? { ...lib, collapsed: !lib.collapsed } : lib
    );
    saveLibraries(updatedLibraries);
  };

  const addToLibraries = () => {
    if (selectedLibraries.size === 0 || !editableUrl.trim()) return;

    const newItem: LibraryItem = {
      url: editableUrl.trim(),
      title: currentPageTitle,
      registryName: selectedRegistry?.name || "Unknown",
      addedAt: Date.now(),
    };

    const updatedLibraries = libraries.map((lib) => {
      if (selectedLibraries.has(lib.id)) {
        // Check if item already exists
        const exists = lib.items.some((item) => item.url === newItem.url);
        if (!exists) {
          return { ...lib, items: [...lib.items, newItem] };
        }
      }
      return lib;
    });

    saveLibraries(updatedLibraries);
    setSelectedLibraries(new Set());
    setShowAddToLibraryDialog(false);
  };

  const removeFromLibrary = (libraryId: string, itemUrl: string) => {
    const updatedLibraries = libraries.map((lib) => {
      if (lib.id === libraryId) {
        return {
          ...lib,
          items: lib.items.filter((item) => item.url !== itemUrl),
        };
      }
      return lib;
    });
    saveLibraries(updatedLibraries);
  };

  const getCurrentIframeUrl = (): string => {
    if (!iframeRef.current) return iframeUrl;

    try {
      // Try to get the actual URL from iframe (will fail for cross-origin)
      const currentUrl = iframeRef.current.contentWindow?.location.href;
      if (currentUrl && currentUrl !== "about:blank") {
        return currentUrl;
      }
    } catch (e) {
      // Cross-origin restriction - fall back to src attribute
    }

    // Fallback to src attribute
    return iframeRef.current.src || iframeUrl;
  };

  const openAddToLibraryDialog = () => {
    // Get the current iframe URL
    const currentUrl = getCurrentIframeUrl();
    setEditableUrl(currentUrl);

    // Pre-select libraries that already contain this URL
    const librariesWithUrl = new Set(
      libraries
        .filter((lib) => lib.items.some((item) => item.url === currentUrl))
        .map((lib) => lib.id)
    );
    setSelectedLibraries(librariesWithUrl);
    setShowAddToLibraryDialog(true);
  };

  const openLibraryItem = (item: LibraryItem) => {
    setIframeUrl(item.url);
    setCurrentPageTitle(item.title);
  };

  const parseRegistryDomains = (data: unknown) => {
    const entries = Array.isArray(data)
      ? data
      : data && typeof data === "object"
        ? Object.values(data as Record<string, unknown>)
        : [];

    const domains = new Set<string>();

    for (const entry of entries) {
      let registryUrl: string | null = null;

      if (typeof entry === "string") {
        registryUrl = entry;
      } else if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        if (typeof record.registry === "string") {
          registryUrl = record.registry;
        } else if (typeof record.url === "string") {
          registryUrl = record.url;
        }
      }

      if (!registryUrl) continue;

      try {
        const normalizedUrl = registryUrl.includes("{name}")
          ? registryUrl.replace("{name}", "test")
          : registryUrl;
        const parsedUrl = new URL(normalizedUrl);
        domains.add(`${parsedUrl.protocol}//${parsedUrl.host}`);
      } catch (parseError) {
        console.warn("Skipping invalid registry URL:", registryUrl, parseError);
      }
    }

    return Array.from(domains);
  };

  const fetchRegistries = async () => {
    const isInitialFetch = registries.length === 0;

    try {
      setLoading(true);
      const res = await fetch("https://ui.shadcn.com/r/registries.json");
      if (!res.ok) {
        throw new Error("Failed to fetch registries.");
      }
      const registriesData = await res.json();

      const parsedDomains = parseRegistryDomains(registriesData);
      if (parsedDomains.length === 0) {
        setRegistries(CUSTOM_REGISTRIES);
        setSelectedRegistry(CUSTOM_REGISTRIES[0] ?? null);
        setError("Unable to load registries. Showing custom defaults.");
        return;
      }

      const domains = [...parsedDomains];

      // Add custom registry
      for (const customRegistry of CUSTOM_REGISTRIES) {
        if (!domains.includes(customRegistry.url)) {
          domains.push(customRegistry.url);
        }
      }

      const registryList = domains.map((domain) => ({
        name: new URL(domain).hostname.replace("www.", ""),
        url: domain,
        domain: domain,
      }));

      const sortedRegistries = registryList.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setRegistries(sortedRegistries);
      setSelectedRegistry(sortedRegistries[0] ?? null);
      setError(null);
    } catch (err) {
      console.error("Error fetching registries:", err);
      const isFallbackOnly =
        registries.length === CUSTOM_REGISTRIES.length &&
        registries.every((registry) =>
          CUSTOM_REGISTRIES.some((custom) => custom.url === registry.url)
        );
      if (isInitialFetch || isFallbackOnly) {
        setRegistries(CUSTOM_REGISTRIES);
        setSelectedRegistry(CUSTOM_REGISTRIES[0] ?? null);
        setError("Unable to load registries. Showing custom defaults.");
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading registries...</span>
        </div>
      </div>
    );
  }

  if (error && !hasRegistries) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchRegistries} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={!favoritesMode ? "default" : "ghost"}
                onClick={() => setFavoritesMode(false)}
                className="h-7 px-2.5"
                title="Registries"
              >
                <Search className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Registries</span>
              </Button>
              <Button
                size="sm"
                variant={favoritesMode ? "default" : "ghost"}
                onClick={() => setFavoritesMode(true)}
                className="h-7 px-2.5"
                title="My Libraries"
              >
                <Library className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Libraries</span>
              </Button>
            </div>
            <Badge
              variant="outline"
              className="text-xs min-w-[3rem] justify-center"
            >
              {favoritesMode ? libraries.length : filteredRegistries.length}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={
                favoritesMode ? "Search libraries..." : "Search registries..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          {error && hasRegistries && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </div>

        <ScrollArea className="flex-1">
          {!favoritesMode ? (
            // Registries view
            <div>
              {filteredRegistries.map((registry, index) => (
                <div
                  key={index}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                    selectedRegistry?.domain === registry.domain
                      ? "bg-accent"
                      : ""
                  }`}
                  onClick={() => setSelectedRegistry(registry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {registry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(registry.domain);
                        }}
                        className="h-6 w-6 p-0 hover:bg-primary/20"
                      >
                        <Heart
                          className={`h-6 w-6 p-0 hover:bg-primary/20 text-black ${
                            favorites.has(registry.domain)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground hover:text-red-500"
                          }`}
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInNewTab(registry.url);
                        }}
                        className="h-6 w-6 p-0 hover:bg-primary/20"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <code className="text-xs text-muted-foreground block truncate">
                    {registry.domain}
                  </code>
                </div>
              ))}

              {filteredRegistries.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No registries found
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Libraries view
            <div className="p-2">
              <div className="mb-2">
                <Button
                  onClick={() => setShowCreateLibraryDialog(true)}
                  size="sm"
                  className="w-full"
                  variant="outline"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Library
                </Button>
              </div>

              {libraries.length === 0 ? (
                <div className="p-8 text-center">
                  <Library className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No libraries yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a library to organize your components
                  </p>
                </div>
              ) : (
                libraries.map((library) => (
                  <div
                    key={library.id}
                    className="mb-2 border border-border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-2 bg-accent/30 hover:bg-accent/50 cursor-pointer">
                      <div
                        className="flex items-center gap-2 flex-1"
                        onClick={() => toggleLibraryCollapse(library.id)}
                      >
                        {library.collapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="font-medium text-sm">
                          {library.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {library.items.length}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete library "${library.name}"?`)) {
                            deleteLibrary(library.id);
                          }
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>

                    {!library.collapsed && (
                      <div className="p-1">
                        {library.items.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            No items yet
                          </div>
                        ) : (
                          library.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2 hover:bg-accent/50 rounded cursor-pointer group flex items-center justify-between"
                              onClick={() => openLibraryItem(item)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.registryName}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromLibrary(library.id, item.url);
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {selectedRegistry || iframeUrl ? (
          <>
            <div className="flex-1 bg-card relative group">
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                className="w-full h-full border-0"
                title={`Preview of ${currentPageTitle}`}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              />
              {/* Floating "Add to Library" button */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={openAddToLibraryDialog}
                  size="sm"
                  className="shadow-lg"
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Add to Library
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Select a registry to preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Add to Library Dialog */}
      <Dialog
        open={showAddToLibraryDialog}
        onOpenChange={setShowAddToLibraryDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Library</DialogTitle>
            <DialogDescription>
              {!extensionActive && (
                <span className="text-purple-500">
                  <a
                    href="https://github.com/pratikpakhale/shadcn"
                    target="_blank"
                    className="underline"
                  >
                    Install the extension
                  </a>{" "}
                  for correct URL tracking.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="url-input"
                className="text-sm font-medium mb-2 block"
              >
                URL{" "}
                {extensionActive && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    Auto-tracked
                  </Badge>
                )}
              </Label>
              <Input
                id="url-input"
                value={editableUrl}
                onChange={(e) => setEditableUrl(e.target.value)}
                placeholder="Enter component URL"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Libraries
              </Label>
              {libraries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    No libraries yet. Create one first!
                  </p>
                  <Button
                    onClick={() => setShowCreateLibraryDialog(true)}
                    variant="outline"
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Library
                  </Button>
                </div>
              ) : (
                <ScrollArea className="max-h-[250px] border rounded-md p-3">
                  <div className="space-y-3">
                    {libraries.map((library) => {
                      const alreadyInLibrary = library.items.some(
                        (item) => item.url === editableUrl
                      );
                      return (
                        <div
                          key={library.id}
                          className="flex items-center space-x-3"
                        >
                          <Checkbox
                            id={library.id}
                            checked={selectedLibraries.has(library.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedLibraries);
                              if (checked) {
                                newSelected.add(library.id);
                              } else {
                                newSelected.delete(library.id);
                              }
                              setSelectedLibraries(newSelected);
                            }}
                          />
                          <Label
                            htmlFor={library.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <span>{library.name}</span>
                              {alreadyInLibrary && (
                                <Badge variant="secondary" className="text-xs">
                                  Already added
                                </Badge>
                              )}
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {libraries.length > 0 && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddToLibraryDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={addToLibraries}
                disabled={selectedLibraries.size === 0 || !editableUrl.trim()}
              >
                Add to {selectedLibraries.size}{" "}
                {selectedLibraries.size === 1 ? "Library" : "Libraries"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Library Dialog */}
      <Dialog
        open={showCreateLibraryDialog}
        onOpenChange={setShowCreateLibraryDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Library</DialogTitle>
            <DialogDescription>
              Give your library a name to organize your favorite components.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              placeholder="Library name (e.g., 'My Favorites', 'Forms', 'Buttons')"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createLibrary();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateLibraryDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createLibrary} disabled={!newLibraryName.trim()}>
              Create Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
