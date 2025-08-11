import { uploadJSONToPinata, fetchFromPinata, testPinataConnection, checkIfFileExists, searchUserDataByIdentifier } from '../utils/pinata'

// Initialize user index from localStorage
const initializeUserIndex = () => {
  const storedIndex = localStorage.getItem('userIndex')
  if (storedIndex) {
    try {
      const parsed = JSON.parse(storedIndex)
      userIndex.clear()
      Array.from(parsed).forEach(([key, value]) => {
        userIndex.set(key, value)
      })
      console.log('User index loaded:', userIndex.size, 'users')
    } catch (error) {
      console.error('Error loading user index:', error)
    }
  }
}

// In-memory user index
const userIndex = new Map()
initializeUserIndex() // Load initial data

export const userService = {
  // Add a debug helper method
  debugUserIndex() {
    console.log('===== USER INDEX DEBUG =====')
    console.log('User index size:', userIndex.size)
    
    if (userIndex.size === 0) {
      console.log('User index is empty! This might be why login is failing.')
      const storedIndex = localStorage.getItem('userIndex')
      console.log('Raw userIndex from localStorage:', storedIndex)
      return false
    }
    
    console.log('Users in index:')
    for (const [key, value] of userIndex.entries()) {
      console.log('---')
      console.log('Key:', key)
      console.log('Name:', value.name)
      console.log('Email:', value.email)
      console.log('Mobile:', value.mobile)
      console.log('Role:', value.role)
      console.log('IPFS Hash:', value.ipfsHash)
    }
    console.log('===== END USER INDEX DEBUG =====')
    return true
  },

  async signup(userData) {
    try {
      // First, test IPFS connection
      const isPinataConnected = await testPinataConnection()
      if (!isPinataConnected) {
        throw new Error('Unable to connect to IPFS storage')
      }

      // Check if email/mobile already exists
      const identifier = userData.email || userData.mobile
      if (userIndex.has(identifier)) {
        throw new Error('User already exists with this email/mobile')
      }

      // Prepare user data for IPFS
      const userDataForIPFS = {
        name: userData.name,
        role: userData.role,
        email: userData.email,
        mobile: userData.mobile,
        password: btoa(userData.password), // Basic encryption (not for production)
        createdAt: new Date().toISOString()
      }
      
      try {
        // Upload to IPFS with metadata
        const ipfsHash = await uploadJSONToPinata(userDataForIPFS)
        console.log('Data saved to IPFS:', ipfsHash)

        // Update user index
        const indexData = {
          ipfsHash,
          password: userDataForIPFS.password,
          email: userData.email,
          mobile: userData.mobile,
          name: userData.name,
          role: userData.role
        }
        userIndex.set(identifier, indexData)

        // Also store a mapping from IPFS hash to identifier
        // This helps when we only have the IPFS hash
        userIndex.set(ipfsHash, {
          identifier,
          email: userData.email,
          mobile: userData.mobile
        })

        // Save user index to localStorage for persistence
        localStorage.setItem('userIndex', JSON.stringify(Array.from(userIndex.entries())))
        console.log('User index updated:', identifier)
        
        // Also store a separate mapping for email/mobile to IPFS hash
        try {
          // Get existing mapping or create new one
          const hashMapping = JSON.parse(localStorage.getItem('ipfsHashMapping') || '{}')
          
          // Add this user's mapping
          hashMapping[identifier] = ipfsHash
          
          // If email and mobile are different, store both
          if (userData.email && userData.mobile && userData.email !== userData.mobile) {
            hashMapping[userData.email] = ipfsHash
            hashMapping[userData.mobile] = ipfsHash
          }
          
          // Save back to localStorage
          localStorage.setItem('ipfsHashMapping', JSON.stringify(hashMapping))
          console.log('IPFS hash mapping updated')
        } catch (mappingError) {
          console.error('Error updating hash mapping:', mappingError)
          // Non-critical error, continue
        }

        return {
          ...userDataForIPFS,
          ipfsHash,
          password: undefined // Don't return password
        }
      } catch (error) {
        console.error('IPFS upload error:', error)
        throw new Error('Failed to save user data to IPFS')
      }
    } catch (error) {
      console.error('Error in signup:', error)
      throw error
    }
  },

  async login(identifier, password) {
    try {
      console.log('Attempting login with identifier:', identifier)
      
      // Reload user index to ensure latest data
      initializeUserIndex()
      
      // Debug the user index to see what's available
      this.debugUserIndex()

      // STEP 1: First try to find user data in local storage
      console.log('Checking local storage for user data...')
      
      // Find user in index
      let userData = userIndex.get(identifier)
      
      // If not found by direct identifier, try finding by email or mobile
      if (!userData) {
        console.log('User not found by direct identifier, searching by email/mobile')
        for (const [key, value] of userIndex.entries()) {
          if (value.email === identifier || value.mobile === identifier) {
            userData = value
            console.log('Found user by email/mobile:', key)
            break
          }
        }
      }
      
      // If found in local storage, verify password and return session
      if (userData) {
        console.log('Found user data in local storage:', { ...userData, password: '***' })
        
        // Verify password
        const hashedPassword = btoa(password)
        if (hashedPassword !== userData.password) {
          console.log('Password mismatch in local storage')
          throw new Error('Invalid credentials')
        }
        
        // Create session with local data first - this ensures a fast login experience
        const sessionData = {
          name: userData.name || 'User',
          email: userData.email,
          mobile: userData.mobile,
          role: userData.role || 'traveler',
          ipfsHash: userData.ipfsHash,
          isAuthenticated: true,
          createdAt: userData.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
        
        // Store session immediately to provide quick access
        localStorage.setItem('userData', JSON.stringify(sessionData))
        console.log('Login successful with local data')
        
        // OPTIONAL: If we have an IPFS hash, we can refresh data in the background
        // This doesn't block the login process but ensures data is fresh
        if (userData.ipfsHash) {
          this.refreshUserDataInBackground(userData.ipfsHash, sessionData)
        }
        
        return sessionData
      }
      
      // STEP 2: If not in local storage, attempt to find from IPFS
      console.log('User data not found in local storage, attempting to find in IPFS')
      
      // Try to search for user by identifier
      try {
        const ipfsData = await searchUserDataByIdentifier(identifier)
        
        if (!ipfsData) {
          console.log('User not found in IPFS')
          throw new Error('Invalid credentials')
        }
        
        console.log('Found user data in IPFS:', { ...ipfsData, password: '***' })
        
        // Verify password
        const hashedPassword = btoa(password)
        if (hashedPassword !== ipfsData.password) {
          console.log('Password mismatch for IPFS data')
          throw new Error('Invalid credentials')
        }
        
        // Update local storage with the found data
        const newUserData = {
          ipfsHash: ipfsData.ipfsHash,
          password: ipfsData.password,
          email: ipfsData.email || identifier,
          mobile: ipfsData.mobile || identifier,
          name: ipfsData.name || 'User',
          role: ipfsData.role || 'traveler',
          createdAt: ipfsData.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
        
        // Update user index
        const userIdentifier = ipfsData.email || ipfsData.mobile || identifier
        userIndex.set(userIdentifier, newUserData)
        localStorage.setItem('userIndex', JSON.stringify(Array.from(userIndex.entries())))
        console.log('Updated local user index with IPFS data')
        
        // Update hash mapping
        try {
          const hashMapping = JSON.parse(localStorage.getItem('ipfsHashMapping') || '{}')
          hashMapping[userIdentifier] = ipfsData.ipfsHash
          localStorage.setItem('ipfsHashMapping', JSON.stringify(hashMapping))
          console.log('Updated hash mapping with IPFS hash')
        } catch (mappingError) {
          console.error('Error updating hash mapping:', mappingError)
          // Non-critical error, continue
        }
        
        // Create session data
        const sessionData = {
          ...ipfsData,
          password: undefined,
          isAuthenticated: true,
          lastLogin: new Date().toISOString()
        }
        
        // Store session
        localStorage.setItem('userData', JSON.stringify(sessionData))
        console.log('Login successful with IPFS data')
        
        return sessionData
      } catch (ipfsError) {
        console.error('Error in IPFS login flow:', ipfsError)
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      console.error('Error in login:', error)
      throw error
    }
  },

  // Helper method to refresh user data in the background without blocking login
  async refreshUserDataInBackground(ipfsHash, currentSessionData) {
    try {
      console.log('Refreshing user data in background from IPFS:', ipfsHash)
      const ipfsData = await fetchFromPinata(ipfsHash)
      
      if (ipfsData) {
        console.log('Successfully refreshed data from IPFS')
        
        // Update session with fresh data but keep the current authentication state
        const updatedSessionData = {
          ...ipfsData,
          password: undefined,
          isAuthenticated: currentSessionData.isAuthenticated,
          lastLogin: currentSessionData.lastLogin
        }
        
        // Store updated session
        localStorage.setItem('userData', JSON.stringify(updatedSessionData))
        console.log('Updated session with fresh IPFS data')
      }
    } catch (error) {
      console.log('Background refresh failed, using existing data:', error.message)
      // Non-critical, just continue with the existing data
    }
  },

  async updateProfile(identifier, profileData) {
    try {
      // Reload user index
      initializeUserIndex()

      // Check if user exists
      const userData = userIndex.get(identifier)
      if (!userData) {
        throw new Error('User not found')
      }

      // Upload updated profile data to IPFS
      const ipfsHash = await uploadJSONToPinata({
        ...profileData,
        password: userData.password, // Preserve password
        updatedAt: new Date().toISOString()
      })

      // Update user index
      userIndex.set(identifier, {
        ...userData,
        ipfsHash,
        email: profileData.email,
        mobile: profileData.mobile
      })

      // Update localStorage
      localStorage.setItem('userIndex', JSON.stringify(Array.from(userIndex.entries())))

      return {
        ...profileData,
        password: undefined,
        ipfsHash
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  async logout() {
    try {
      localStorage.removeItem('userData')
    } catch (error) {
      console.error('Error in logout:', error)
      throw error
    }
  }
} 