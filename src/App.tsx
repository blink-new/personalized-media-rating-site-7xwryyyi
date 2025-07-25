import { useState, useEffect } from 'react'
import { Star, Search, Film, Tv, Book, LogOut } from 'lucide-react'
import { blink } from './blink/client'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog'
import { Textarea } from './components/ui/textarea'
import { Toaster } from './components/ui/toaster'
import { useToast } from './hooks/use-toast'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState([])
  const [userRatings, setUserRatings] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadMedia = async () => {
    try {
      const mediaList = await blink.db.media.list({
        orderBy: { createdAt: 'desc' },
        limit: 20
      })
      setMedia(mediaList)
    } catch (error) {
      console.error('Error loading media:', error)
    }
  }

  const loadUserRatings = async () => {
    try {
      const ratings = await blink.db.ratings.list({
        where: { userId: user.id }
      })
      
      const ratingsMap = {}
      ratings.forEach(rating => {
        ratingsMap[rating.mediaId] = rating
      })
      
      setUserRatings(ratingsMap)
    } catch (error) {
      console.error('Error loading user ratings:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadMedia()
      loadUserRatings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleRateMedia = (mediaItem) => {
    setSelectedMedia(mediaItem)
    const existingRating = userRatings[mediaItem.id]
    setRating(existingRating?.rating || 0)
    setReview(existingRating?.review || '')
    setShowRatingDialog(true)
  }

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      })
      return
    }

    try {
      const existingRating = userRatings[selectedMedia.id]
      const ratingData = {
        id: existingRating?.id || `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        mediaId: selectedMedia.id,
        rating,
        review: review.trim() || null
      }

      if (existingRating) {
        await blink.db.ratings.update(existingRating.id, {
          rating,
          review: review.trim() || null,
          updatedAt: new Date().toISOString()
        })
      } else {
        await blink.db.ratings.create(ratingData)
      }

      // Update local state
      setUserRatings(prev => ({
        ...prev,
        [selectedMedia.id]: ratingData
      }))

      toast({
        title: existingRating ? "Rating Updated" : "Rating Added",
        description: `You rated "${selectedMedia.title}" ${rating}/5 stars.`
      })

      setShowRatingDialog(false)
      setRating(0)
      setReview('')
    } catch (error) {
      console.error('Error saving rating:', error)
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />
      case 'tv': return <Tv className="w-4 h-4" />
      case 'book': return <Book className="w-4 h-4" />
      default: return <Film className="w-4 h-4" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'movie': return 'bg-blue-100 text-blue-800'
      case 'tv': return 'bg-green-100 text-green-800'
      case 'book': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredMedia = media.filter(item =>
    searchQuery === '' || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-amber-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600">Loading MediaRate...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-amber-50 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-indigo-600">MediaRate</h1>
            <p className="text-lg text-gray-600">Your personal media rating platform</p>
          </div>
          <p className="text-gray-600">Please sign in to start rating your favorite movies, TV shows, and books.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-amber-500 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-indigo-600">MediaRate</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => blink.auth.logout()}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12 bg-white/50 backdrop-blur-sm rounded-2xl">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-600">
              Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover, rate, and review your favorite movies, TV series, and books. 
              Your personal taste matters here.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search movies, TV shows, books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3"
              />
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredMedia.length} {filteredMedia.length === 1 ? 'result' : 'results'}
            {searchQuery && ` for "${searchQuery}"`}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map((item) => {
              const userRating = userRatings[item.id]
              return (
                <Card key={item.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    <img
                      src={item.coverImage || 'https://images.unsplash.com/photo-1489599735734-79b4169c4388?w=400&h=600&fit=crop'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    <div className="absolute top-3 left-3">
                      <Badge className={`${getTypeColor(item.type)} text-xs`}>
                        {getTypeIcon(item.type)}
                        <span className="ml-1 capitalize">{item.type}</span>
                      </Badge>
                    </div>
                    {userRating && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{userRating.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <span>{item.releaseYear}</span>
                          <span>•</span>
                          <span className="capitalize">{item.genre}</span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                      </div>
                      
                      <Button
                        onClick={() => handleRateMedia(item)}
                        variant={userRating ? "default" : "outline"}
                        className="w-full flex items-center space-x-2"
                      >
                        <Star className="w-4 h-4" />
                        <span>{userRating ? `Rated ${userRating.rating}/5` : 'Rate This'}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate "{selectedMedia?.title}"</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Media Info */}
            {selectedMedia && (
              <div className="flex space-x-4">
                <img
                  src={selectedMedia.coverImage || 'https://images.unsplash.com/photo-1489599735734-79b4169c4388?w=400&h=600&fit=crop'}
                  alt={selectedMedia.title}
                  className="w-16 h-24 object-cover rounded"
                />
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium">{selectedMedia.title}</h3>
                  <p className="text-sm text-gray-600">{selectedMedia.releaseYear}</p>
                  <p className="text-sm text-gray-600 capitalize">{selectedMedia.type} • {selectedMedia.genre}</p>
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 hover:scale-110 transition-transform"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating}/5 stars
                  </span>
                )}
              </div>
            </div>

            {/* Review */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Review (Optional)</label>
              <Textarea
                placeholder="Share your thoughts about this..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {review.length}/500 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRatingDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={rating === 0}
              >
                Save Rating
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default App