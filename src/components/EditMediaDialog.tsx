import { useState } from 'react'
import { Edit, Save, X, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'

interface EditMediaDialogProps {
  media: any
  onMediaUpdated: () => void
}

export function EditMediaDialog({ media, onMediaUpdated }: EditMediaDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    title: media.title || '',
    type: media.type || 'movie',
    genre: media.genre || '',
    releaseYear: media.releaseYear || new Date().getFullYear(),
    country: media.country || '',
    description: media.description || '',
    coverImage: media.coverImage || ''
  })
  const { toast } = useToast()

  const movieGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
    'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 
    'Sci-Fi', 'Thriller', 'War', 'Western'
  ]

  const tvGenres = [
    'Action & Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
    'Drama', 'Family', 'Kids', 'Mystery', 'News', 'Reality', 'Sci-Fi & Fantasy', 
    'Soap', 'Talk', 'War & Politics', 'Western',
    // Asian Drama specific genres
    'K-Drama', 'C-Drama', 'J-Drama', 'Thai Drama', 'Historical Drama', 
    'Medical Drama', 'Romantic Comedy', 'Melodrama', 'Makjang', 'BL Drama'
  ]

  const bookGenres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 
    'Biography', 'History', 'Self-Help', 'Business', 'Health', 'Travel', 
    'Cooking', 'Art', 'Religion', 'Philosophy', 'Poetry', 'Young Adult', 
    'Children', 'Manga', 'Light Novel'
  ]

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'France', 'Germany', 
    'Italy', 'Spain', 'Japan', 'South Korea', 'China', 'Hong Kong', 'Taiwan', 
    'Thailand', 'India', 'Brazil', 'Mexico', 'Russia', 'Netherlands', 'Sweden', 
    'Norway', 'Denmark', 'Other'
  ]

  const getGenreOptions = () => {
    switch (formData.type) {
      case 'movie': return movieGenres
      case 'tv': return tvGenres
      case 'book': return bookGenres
      default: return movieGenres
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the media.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const updatedData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        coverImage: formData.coverImage.trim() || null,
        updatedAt: new Date().toISOString()
      }

      await blink.db.media.update(media.id, updatedData)

      toast({
        title: "Media Updated",
        description: `"${formData.title}" has been updated successfully.`
      })

      setOpen(false)
      onMediaUpdated()
    } catch (error) {
      console.error('Error updating media:', error)
      toast({
        title: "Error",
        description: "Failed to update media. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    
    try {
      // First delete all ratings for this media
      const ratings = await blink.db.ratings.list({
        where: { mediaId: media.id }
      })
      
      for (const rating of ratings) {
        await blink.db.ratings.delete(rating.id)
      }
      
      // Then delete the media itself
      await blink.db.media.delete(media.id)

      toast({
        title: "Media Deleted",
        description: `"${media.title}" has been deleted successfully.`
      })

      setOpen(false)
      setShowDeleteConfirm(false)
      onMediaUpdated()
    } catch (error) {
      console.error('Error deleting media:', error)
      toast({
        title: "Error",
        description: "Failed to delete media. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: media.title || '',
      type: media.type || 'movie',
      genre: media.genre || '',
      releaseYear: media.releaseYear || new Date().getFullYear(),
      country: media.country || '',
      description: media.description || '',
      coverImage: media.coverImage || ''
    })
    setShowDeleteConfirm(false)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-1 text-xs"
        >
          <Edit className="w-3 h-3" />
          <span>Edit</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="w-5 h-5" />
            <span>Edit Media</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter the title..."
              required
            />
          </div>

          {/* Type and Genre Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="tv">TV Series/Drama</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => handleInputChange('genre', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select genre..." />
                </SelectTrigger>
                <SelectContent>
                  {getGenreOptions().map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Year and Country Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Release Year</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                value={formData.releaseYear}
                onChange={(e) => handleInputChange('releaseYear', parseInt(e.target.value) || new Date().getFullYear())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country/Origin</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country..." />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cover Image URL */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
            <Input
              id="coverImage"
              type="url"
              value={formData.coverImage}
              onChange={(e) => handleInputChange('coverImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500">
              Provide a direct link to an image. Leave empty for default placeholder.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description or synopsis..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 text-right">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600">Delete this media?</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="w-3 h-3 mr-1" />
                    )}
                    {loading ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title.trim()}
              >
                {loading ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Updating...' : 'Update Media'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}