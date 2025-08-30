import React from 'react'
import Wrapper from '../components/layout/Wrapper'
import Navbar from '../components/layout/Navbar'
import HomePage from '../pages/Home/HomePage'

const App = () => {
  return (
    <div>
       <Wrapper>
          <Navbar />
          <HomePage />
       </Wrapper>
    </div>
  )
}

export default App
