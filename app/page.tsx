"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Loader2, Search, Heart } from "lucide-react"

interface Registry {
  name: string
  url: string
  domain: string
}

export default function RegistryPreview() {
  const [registries, setRegistries] = useState<Registry[]>([])
  const [filteredRegistries, setFilteredRegistries] = useState<Registry[]>([])
  const [selectedRegistry, setSelectedRegistry] = useState<Registry | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchRegistries()
    loadFavorites()
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

      const registryList = domains.map((domain, index) => ({
        name: new URL(domain).hostname.replace("www.", ""),
        url: domain,
        domain: domain,
      }))

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
            <Badge variant="outline" className="text-xs">
              {filteredRegistries.length}/{registries.length}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search registries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
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
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedRegistry ? (
          <>
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
    </div>
  )
}
