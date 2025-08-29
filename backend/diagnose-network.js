const dns = require('dns').promises
const net = require('net')

const diagnoseNetwork = async () => {
  console.log('🔍 Network Diagnostics for MongoDB Atlas Connection\n')
  
  const mongoHost = 'cluster0.85sutjb.mongodb.net'
  const mongoPort = 27017
  
  try {
    // Test DNS resolution
    console.log('1. Testing DNS resolution...')
    const addresses = await dns.lookup(mongoHost)
    console.log('✅ DNS resolution successful:', addresses.address)
    
    // Test multiple DNS lookups
    const allAddresses = await dns.resolve4(mongoHost)
    console.log('✅ All resolved IPs:', allAddresses.join(', '))
    
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message)
    console.log('\n🔧 Possible solutions:')
    console.log('- Check internet connection')
    console.log('- Try using Google DNS: 8.8.8.8, 8.8.4.4')
    console.log('- Check firewall/antivirus settings')
    return
  }
  
  try {
    // Test TCP connection
    console.log('\n2. Testing TCP connection...')
    const socket = new net.Socket()
    
    const connectPromise = new Promise((resolve, reject) => {
      socket.setTimeout(10000) // 10 second timeout
      
      socket.on('connect', () => {
        console.log('✅ TCP connection successful')
        socket.destroy()
        resolve()
      })
      
      socket.on('timeout', () => {
        console.error('❌ TCP connection timeout')
        socket.destroy()
        reject(new Error('Connection timeout'))
      })
      
      socket.on('error', (error) => {
        console.error('❌ TCP connection failed:', error.message)
        reject(error)
      })
      
      socket.connect(mongoPort, mongoHost)
    })
    
    await connectPromise
    
  } catch (error) {
    console.error('❌ TCP connection failed:', error.message)
    console.log('\n🔧 Possible solutions:')
    console.log('- Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)')
    console.log('- Verify cluster is running and accessible')
    console.log('- Check corporate firewall blocking port 27017')
    console.log('- Try connecting from a different network')
    return
  }
  
  // Test SRV record (used by MongoDB connection string)
  try {
    console.log('\n3. Testing SRV record...')
    const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${mongoHost}`)
    console.log('✅ SRV records found:', srvRecords.length)
    srvRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.name}:${record.port} (priority: ${record.priority})`)
    })
  } catch (error) {
    console.error('❌ SRV record lookup failed:', error.message)
  }
  
  console.log('\n✅ Network diagnostics completed')
  console.log('\nIf all tests pass but MongoDB still fails to connect:')
  console.log('- Check MongoDB Atlas cluster status')
  console.log('- Verify database user credentials')
  console.log('- Check database name in connection string')
}

diagnoseNetwork().catch(console.error)