import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { render } from 'react-dom'
import App from './App'

const root = document.getElementById('root')

if (root) {
    render(
        <BrowserRouter>
            <App />
        </BrowserRouter>,
        root,
    )
}
