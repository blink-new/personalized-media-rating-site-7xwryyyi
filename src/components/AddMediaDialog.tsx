import { useState } from 'react'
import { Plus, Film, Tv, Book } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { useToast } from '../hooks/use-toast'

interface AddMediaDialogProps {
  onMediaAdded: () => void
}

export function AddMediaDialog({ onMediaAdded }: AddMediaDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    genre: '',
    releaseYear: '',
    description: '',
    coverImage: '',
    country: ''
  })
  const { toast } = useToast()

  const mediaTypes = [
    { value: 'movie', label: 'Movie', icon: Film },
    { value: 'tv', label: 'TV Series/Drama', icon: Tv },
    { value: 'book', label: 'Book', icon: Book }
  ]

  const genres = {
    movie: [
      'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
      'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
      'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
    ],
    tv: [
      'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
      'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
      'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
      'K-Drama', 'C-Drama', 'J-Drama', 'Thai Drama', 'Historical Drama',
      'Medical Drama', 'Legal Drama', 'School Drama', 'Romantic Comedy',
      'Slice of Life', 'Melodrama', 'Makjang'
    ],
    book: [
      'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
      'Fantasy', 'Biography', 'History', 'Self-Help', 'Business',
      'Philosophy', 'Poetry', 'Young Adult', 'Children', 'Thriller',
      'Horror', 'Adventure', 'Classic Literature', 'Contemporary Fiction'
    ]
  }

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia',
    'South Korea', 'China', 'Japan', 'Thailand', 'Taiwan', 'Hong Kong',
    'India', 'France', 'Germany', 'Italy', 'Spain', 'Brazil',
    'Mexico', 'Russia', 'Other'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset genre when type changes
      ...(field === 'type' && { genre: '' })
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.type || !formData.genre || !formData.releaseYear) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const mediaData = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title.trim(),
        type: formData.type,
        genre: formData.genre,
        releaseYear: parseInt(formData.releaseYear),
        description: formData.description.trim() || null,
        coverImage: formData.coverImage.trim() || null,
        country: formData.country || null,
        createdAt: new Date().toISOString()
      }

      await blink.db.media.create(mediaData)

      toast({
        title: "Media Added Successfully!",
        description: `"${formData.title}" has been added to the database.`
      })

      // Reset form
      setFormData({
        title: '',
        type: '',
        genre: '',
        releaseYear: '',
        description: '',
        coverImage: '',
        country: ''
      })

      setOpen(false)
      onMediaAdded()
    } catch (error) {
      console.error('Error adding media:', error)
      toast({
        title: "Error",
        description: "Failed to add media. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Media</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Media</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter title (e.g., Squid Game, Parasite, Your Name)"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          {/* Type and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent>
                  {mediaTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country/Origin</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
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

          {/* Genre and Release Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select 
                value={formData.genre} 
                onValueChange={(value) => handleInputChange('genre', value)}
                disabled={!formData.type}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.type ? "Select genre" : "Select type first"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.type && genres[formData.type as keyof typeof genres]?.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseYear">Release Year *</Label>
              <Select value={formData.releaseYear} onValueChange={(value) => handleInputChange('releaseYear', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
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
              placeholder="https://example.com/image.jpg"
              value={formData.coverImage}
              onChange={(e) => handleInputChange('coverImage', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Paste a direct link to an image. Leave empty to use a default placeholder.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description or synopsis..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Popular Examples */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Popular Examples:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>K-Dramas:</strong> Squid Game, Crash Landing on You, Goblin, Descendants of the Sun</p>
              <p><strong>C-Dramas:</strong> The Untamed, Meteor Garden, Love O2O, Eternal Love</p>
              <p><strong>J-Dramas:</strong> Your Name, Spirited Away, Attack on Titan, Death Note</p>
              <p><strong>Thai Dramas:</strong> 2gether, F4 Thailand, Bad Buddy, I Told Sunset About You</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.type || !formData.genre || !formData.releaseYear}
            >
              {loading ? 'Adding...' : 'Add Media'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}