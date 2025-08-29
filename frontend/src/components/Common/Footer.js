import React from 'react'

const Footer = () => {
  return (
    <footer className='bg-gray-50 border-t border-gray-200 py-6 mt-auto'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <p className='text-sm font-medium text-gray-700 mb-1 flex items-center justify-center space-x-2'>
            <img
              src='/images/logo_oa_point.webp'
              alt='OA Point Logo'
              className='h-10 w-10 object-contain'
              style={{ mixBlendMode: 'multiply' }}
            />
            <span>
              OA Point by <i>Tejas Pawar</i>
            </span>
          </p>
          {/* <p className='text-xs text-gray-500'>
            All rights reserved
          </p> */}
        </div>
      </div>
    </footer>
  )
}

export default Footer
