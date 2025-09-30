"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, Loader2, Search, Heart, BookmarkPlus, Folder, FolderOpen, ChevronDown, ChevronRight, Library } from "lucide-react"

interface Registry {
  name: string
  url: string
  domain: string
}

interface ComponentLink {
  id: string
  url: string
  title: string
  domain: string
  timestamp: number
}

interface Library {
  id: string
  name: string
  components: ComponentLink[]
  created: number
}

export default function RegistryPreview() {
  const [registries, setRegistries] = useState<Registry[]>([])
  const [filteredRegistries, setFilteredRegistries] = useState<Registry[]>([])
  const [selectedRegistry, setSelectedRegistry] = useState<Registry | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  // New state for component-level favorites
  const [libraries, setLibraries] = useState<Library[]>([])
  const [isLibraryMode, setIsLibraryMode] = useState(false)
  const [expandedLibraries, setExpandedLibraries] = useState<Set<string>>(new Set())
  const [showAddToLibrary, setShowAddToLibrary] = useState(false)
  const [selectedComponentUrl, setSelectedComponentUrl] = useState("")
  const [newLibraryName, setNewLibraryName] = useState("")
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchRegistries()
    loadFavorites()
    loadLibraries()
  }, [])

  useEffect(() => {
    const filtered = registries.filter(
      (registry) =>
        registry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        registry.domain.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    const sortedFiltered = filtered.sort((a, b) => {
      const aIsFav = favorites.has(a.domain)
      const bIsFav = favorites.has(b.domain)
      if (aIsFav && !bIsFav) return -1
      if (!aIsFav && bIsFav) return 1
      return 0
    })
    setFilteredRegistries(sortedFiltered)
  }, [registries, searchQuery, favorites])

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem("registry-favorites")
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      }
    } catch (error) {
      console.error("Error loading favorites:", error)
    }
  }

  const saveFavorites = (newFavorites: Set<string>) => {
    try {
      localStorage.setItem("registry-favorites", JSON.stringify(Array.from(newFavorites)))
    } catch (error) {
      console.error("Error saving favorites:", error)
    }
  }

  const loadLibraries = () => {
    try {
      const savedLibraries = localStorage.getItem("component-libraries")
      if (savedLibraries) {
        setLibraries(JSON.parse(savedLibraries))
      }
    } catch (error) {
      console.error("Error loading libraries:", error)
    }
  }

  const saveLibraries = (newLibraries: Library[]) => {
    try {
      localStorage.setItem("component-libraries", JSON.stringify(newLibraries))
    } catch (error) {
      console.error("Error saving libraries:", error)
    }
  }

  const createLibrary = (name: string) => {
    const newLibrary: Library = {
      id: Date.now().toString(),
      name,
      components: [],
      created: Date.now(),
    }
    const newLibraries = [...libraries, newLibrary]
    setLibraries(newLibraries)
    saveLibraries(newLibraries)
    return newLibrary
  }

  const addComponentToLibrary = (libraryId: string, component: ComponentLink) => {
    const newLibraries = libraries.map(lib => {
      if (lib.id === libraryId) {
        // Check if component already exists
        const exists = lib.components.some(c => c.url === component.url)
        if (!exists) {
          return { ...lib, components: [...lib.components, component] }
        }
      }
      return lib
    })
    setLibraries(newLibraries)
    saveLibraries(newLibraries)
  }

  const removeComponentFromLibrary = (libraryId: string, componentId: string) => {
    const newLibraries = libraries.map(lib => {
      if (lib.id === libraryId) {
        return { ...lib, components: lib.components.filter(c => c.id !== componentId) }
      }
      return lib
    })
    setLibraries(newLibraries)
    saveLibraries(newLibraries)
  }

  const toggleLibraryExpansion = (libraryId: string) => {
    const newExpanded = new Set(expandedLibraries)
    if (newExpanded.has(libraryId)) {
      newExpanded.delete(libraryId)
    } else {
      newExpanded.add(libraryId)
    }
    setExpandedLibraries(newExpanded)
  }

  const handleAddToLibrary = () => {
    if (!selectedRegistry || !selectedComponentUrl) return

    const component: ComponentLink = {
      id: Date.now().toString(),
      url: selectedComponentUrl,
      title: `${selectedRegistry.name} Component`,
      domain: selectedRegistry.domain,
      timestamp: Date.now(),
    }

    // Add to selected libraries
    selectedLibraryIds.forEach(libraryId => {
      addComponentToLibrary(libraryId, component)
    })

    // Create new library if name provided
    if (newLibraryName.trim()) {
      const newLibrary = createLibrary(newLibraryName.trim())
      addComponentToLibrary(newLibrary.id, component)
    }

    // Reset form
    setShowAddToLibrary(false)
    setSelectedLibraryIds(new Set())
    setNewLibraryName("")
    setSelectedComponentUrl("")
  }

  const toggleLibrarySelection = (libraryId: string) => {
    const newSelected = new Set(selectedLibraryIds)
    if (newSelected.has(libraryId)) {
      newSelected.delete(libraryId)
    } else {
      newSelected.add(libraryId)
    }
    setSelectedLibraryIds(newSelected)
  }

  const toggleFavorite = (domain: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(domain)) {
      newFavorites.delete(domain)
    } else {
      newFavorites.add(domain)
      const registryList = document.querySelector(".flex-1.overflow-y-auto")
      if (registryList) {
        registryList.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
    setFavorites(newFavorites)
    saveFavorites(newFavorites)
  }

  const fetchRegistries = async () => {
    try {
      setLoading(true)
      
      // Try to fetch from remote, fallback to mock data
      let registryList: Registry[] = []
      
      try {
        const res = await fetch("https://ui.shadcn.com/r/registries.json")
        const registriesData = await res.json()

        const domains = [
          ...new Set(
            Object.values(registriesData).map((url: string) => {
              const u = new URL(url.replace("{name}", "test"))
              return u.protocol + "//" + u.host
            }),
          ),
        ]

        registryList = domains.map((domain, index) => ({
          name: new URL(domain).hostname.replace("www.", ""),
          url: domain,
          domain: domain,
        }))
      } catch (fetchError) {
        console.warn("Failed to fetch from remote, using mock data:", fetchError)
        // Mock data for development including 21st.dev
        registryList = [
          {
            name: "21st.dev",
            url: "https://21st.dev/",
            domain: "https://21st.dev",
          },
          {
            name: "ui.shadcn.com",
            url: "https://ui.shadcn.com",
            domain: "https://ui.shadcn.com",
          },
          {
            name: "ui.aceternity.com",
            url: "https://ui.aceternity.com",
            domain: "https://ui.aceternity.com",
          },
          {
            name: "magicui.design",
            url: "https://magicui.design",
            domain: "https://magicui.design",
          },
          {
            name: "ui.ibelick.com",
            url: "https://ui.ibelick.com",
            domain: "https://ui.ibelick.com",
          },
        ]
      }

      // Always add 21st.dev if not already present
      const has21stDev = registryList.some(r => r.domain.includes("21st.dev"))
      if (!has21stDev) {
        registryList.unshift({
          name: "21st.dev",
          url: "https://21st.dev/",
          domain: "https://21st.dev",
        })
      }

      setRegistries(registryList)
      if (registryList.length > 0) {
        setSelectedRegistry(registryList[0])
      }
    } catch (err) {
      console.error("Error fetching registries:", err)
      setError("Failed to fetch registries")
    } finally {
      setLoading(false)
    }
  }

  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading registries...</span>
        </div>
      </div>
    )
  }

  if (error) {
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
    )
  }

  return (
    <div className="h-screen bg-background flex">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">Shadcn Hub</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isLibraryMode ? "default" : "ghost"}
                onClick={() => setIsLibraryMode(!isLibraryMode)}
                className="h-6 px-2 text-xs"
              >
                <Library className="h-3 w-3 mr-1" />
                Libraries
              </Button>
              <Badge variant="outline" className="text-xs">
                {isLibraryMode ? libraries.length : `${filteredRegistries.length}/${registries.length}`}
              </Badge>
            </div>
          </div>
          {!isLibraryMode && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search registries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {!isLibraryMode ? (
            // Registry mode
            <>
              {filteredRegistries.map((registry, index) => (
                <div
                  key={index}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                    selectedRegistry?.domain === registry.domain ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedRegistry(registry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{registry.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(registry.domain)
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
                          e.stopPropagation()
                          openInNewTab(registry.url)
                        }}
                        className="h-6 w-6 p-0 hover:bg-primary/20"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <code className="text-xs text-muted-foreground block truncate">{registry.domain}</code>
                </div>
              ))}

              {filteredRegistries.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No registries found</p>
                </div>
              )}
            </>
          ) : (
            // Library mode
            <>
              {libraries.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No libraries yet</p>
                  <p className="text-xs text-muted-foreground">Add components to create your first library</p>
                </div>
              ) : (
                libraries.map((library) => (
                  <div key={library.id} className="border-b border-border">
                    <div
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors flex items-center gap-2"
                      onClick={() => toggleLibraryExpansion(library.id)}
                    >
                      {expandedLibraries.has(library.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      {expandedLibraries.has(library.id) ? (
                        <FolderOpen className="h-4 w-4 text-primary" />
                      ) : (
                        <Folder className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <span className="font-medium text-sm">{library.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {library.components.length} component{library.components.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {expandedLibraries.has(library.id) && (
                      <div className="pl-8 pb-2">
                        {library.components.map((component) => (
                          <div
                            key={component.id}
                            className="py-2 px-2 hover:bg-accent/30 rounded cursor-pointer transition-colors flex items-center justify-between group"
                            onClick={() => {
                              // Find registry and set it
                              const registry = registries.find(r => r.domain === component.domain)
                              if (registry) {
                                setSelectedRegistry(registry)
                                setIsLibraryMode(false)
                              }
                              // Navigate to component URL
                              window.open(component.url, '_blank')
                            }}
                          >
                            <div className="flex-1">
                              <p className="text-sm text-foreground truncate">{component.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{component.url}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeComponentFromLibrary(library.id, component.id)
                              }}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        {library.components.length === 0 && (
                          <p className="text-xs text-muted-foreground py-2 px-2">No components in this library</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedRegistry ? (
          <>
            <div className="border-b border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedRegistry.name}</span>
                <code className="text-xs text-muted-foreground">{selectedRegistry.domain}</code>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedComponentUrl(selectedRegistry.url)
                  setShowAddToLibrary(true)
                }}
                className="h-8 px-3 text-xs"
              >
                <BookmarkPlus className="h-3 w-3 mr-1" />
                Add to Library
              </Button>
            </div>
            <div className="flex-1 bg-card">
              <iframe
                src={selectedRegistry.url}
                className="w-full h-full border-0"
                title={`Preview of ${selectedRegistry.name}`}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
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
      <Dialog open={showAddToLibrary} onOpenChange={setShowAddToLibrary}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add to Library</DialogTitle>
            <DialogDescription>
              Add this component to your libraries. You can create a new library or add to existing ones.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {libraries.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Existing Libraries</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {libraries.map((library) => (
                    <div key={library.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={library.id}
                        checked={selectedLibraryIds.has(library.id)}
                        onCheckedChange={() => toggleLibrarySelection(library.id)}
                      />
                      <Label htmlFor={library.id} className="text-sm cursor-pointer">
                        {library.name} ({library.components.length} components)
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-library" className="text-sm font-medium">Create New Library</Label>
              <Input
                id="new-library"
                placeholder="Library name"
                value={newLibraryName}
                onChange={(e) => setNewLibraryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddToLibrary(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAddToLibrary}
              disabled={selectedLibraryIds.size === 0 && !newLibraryName.trim()}
            >
              Add to Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
