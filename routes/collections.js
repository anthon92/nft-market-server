const express = require('express')
const router = express.Router()

// Get collections
router.get('/collections', async (req, res) => {
  // Return mock data with proper structure matching frontend expectations
  const mockCollections = [
    {
      id: '1',
      name: 'Space Walking',
      images: [
        { 
          picture: 'https://via.placeholder.com/600x400/6366f1/ffffff?text=Space+Walking',
          name: 'Space Walking #1',
          price: '1.63',
          bidHistory: ['1.5', '1.4']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/8b5cf6/ffffff?text=NFT+2',
          name: 'Space Walking #2',
          price: '2.5',
          bidHistory: ['2.3']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/a855f7/ffffff?text=NFT+3',
          name: 'Space Walking #3',
          price: '0.8',
          bidHistory: ['0.75']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/ec4899/ffffff?text=NFT+4',
          name: 'Space Walking #4',
          price: '3.2',
          bidHistory: ['3.0']
        }
      ],
      author: {
        username: 'Animakid',
        avatar: 'https://via.placeholder.com/40x40/10b981/ffffff?text=A'
      },
      floorPrice: '0.5',
      volume: '100'
    },
    {
      id: '2',
      name: 'Distant Galaxy',
      images: [
        { 
          picture: 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Distant+Galaxy+1',
          name: 'Distant Galaxy #1',
          price: '2.1',
          bidHistory: ['2.0']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/06b6d4/ffffff?text=NFT+2',
          name: 'Distant Galaxy #2',
          price: '1.8',
          bidHistory: ['1.7']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/14b8a6/ffffff?text=NFT+3',
          name: 'Distant Galaxy #3',
          price: '2.5',
          bidHistory: ['2.4']
        }
      ],
      author: {
        username: 'MoonDancer',
        avatar: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=M'
      },
      floorPrice: '1.5',
      volume: '250'
    },
    {
      id: '3',
      name: 'Life On Edena',
      images: [
        { 
          picture: 'https://via.placeholder.com/600x400/ef4444/ffffff?text=Life+On+Edena',
          name: 'Life On Edena #1',
          price: '3.5',
          bidHistory: ['3.3', '3.2']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/f97316/ffffff?text=NFT+2',
          name: 'Life On Edena #2',
          price: '2.8',
          bidHistory: ['2.6']
        }
      ],
      author: {
        username: 'NebulaKid',
        avatar: 'https://via.placeholder.com/40x40/6366f1/ffffff?text=N'
      },
      floorPrice: '2.0',
      volume: '180'
    },
    {
      id: '4',
      name: 'AstroFiction',
      images: [
        { 
          picture: 'https://via.placeholder.com/600x400/10b981/ffffff?text=AstroFiction+1',
          name: 'AstroFiction #1',
          price: '1.2',
          bidHistory: ['1.1']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/84cc16/ffffff?text=NFT+2',
          name: 'AstroFiction #2',
          price: '1.9',
          bidHistory: ['1.8']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/65a30d/ffffff?text=NFT+3',
          name: 'AstroFiction #3',
          price: '2.3',
          bidHistory: ['2.2']
        }
      ],
      author: {
        username: 'Spaceone',
        avatar: 'https://via.placeholder.com/40x40/ec4899/ffffff?text=S'
      },
      floorPrice: '1.0',
      volume: '150'
    },
    {
      id: '5',
      name: 'CryptoPunks',
      images: [
        { 
          picture: 'https://via.placeholder.com/600x400/8b5cf6/ffffff?text=CryptoPunks+1',
          name: 'CryptoPunks #1',
          price: '5.0',
          bidHistory: ['4.8', '4.5']
        },
        { 
          picture: 'https://via.placeholder.com/600x400/a855f7/ffffff?text=NFT+2',
          name: 'CryptoPunks #2',
          price: '4.2',
          bidHistory: ['4.0']
        }
      ],
      author: {
        username: 'CryptoArtist',
        avatar: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=C'
      },
      floorPrice: '3.5',
      volume: '500'
    }
  ]
  
  const { limit } = req.query
  const result = limit ? mockCollections.slice(0, parseInt(limit)) : mockCollections
  
  res.status(200).json(result)
})

module.exports = router