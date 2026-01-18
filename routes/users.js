const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { success } = require('../lib/response')

// Get users
router.get('/', async (req, res) => {
  // Return mock data with proper structure
  const mockUsers = [
    {
      id: '1',
      username: 'Sample User',
      avatar: 'https://via.placeholder.com/150',
      totalSales: '50'
    }
  ]
  
  res.status(200).json(mockUsers)
})

// Get user inventory (protected route)
router.get('/inventory', authenticateToken, async (req, res) => {
  const { sort } = req.query
  
  // Mock inventory data based on sort type
  let inventoryData = []
  
  switch (sort) {
    case 'collections':
      inventoryData = [
        {
          id: '1',
          name: 'My Space Collection',
          image: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Space+Collection',
          nftCount: 5,
          floorPrice: '0.5',
          totalValue: '2.5'
        },
        {
          id: '2',
          name: 'Digital Art Collection',
          image: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Digital+Art',
          nftCount: 3,
          floorPrice: '1.2',
          totalValue: '3.6'
        }
      ]
      break
      
    case 'nfts':
      inventoryData = [
        {
          id: '1',
          name: 'Space Walker #001',
          image: 'https://via.placeholder.com/300x300/6366f1/ffffff?text=Space+Walker',
          collection: 'Space Collection',
          price: '1.5',
          rarity: 'Rare'
        },
        {
          id: '2',
          name: 'Digital Sunset',
          image: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=Digital+Sunset',
          collection: 'Digital Art',
          price: '2.1',
          rarity: 'Epic'
        }
      ]
      break
      
    case 'favorited':
      inventoryData = [
        {
          id: '1',
          name: 'Favorite NFT #1',
          image: 'https://via.placeholder.com/300x300/10b981/ffffff?text=Favorite+1',
          collection: 'Popular Collection',
          price: '3.2',
          owner: 'CryptoArtist'
        },
        {
          id: '2',
          name: 'Favorite NFT #2',
          image: 'https://via.placeholder.com/300x300/f59e0b/ffffff?text=Favorite+2',
          collection: 'Trending Collection',
          price: '1.8',
          owner: 'DigitalCreator'
        }
      ]
      break
      
    default:
      inventoryData = []
  }
  
  return success(res, inventoryData, `User ${sort || 'inventory'} retrieved successfully`)
})

// Get user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params
  // Add user details logic here
  res.status(501).json({ message: `Get user ${id} not implemented yet` })
})

// Update user
router.put('/:id', async (req, res) => {
  const { id } = req.params
  // Add user update logic here
  res.status(501).json({ message: `Update user ${id} not implemented yet` })
})

module.exports = router