import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import HomePage from "./HomePage";
import ForestBlue from "./ForestBlue";
import {BrowserRouter, Route, Routes} from "react-router-dom";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="" element={<HomePage/>}/>
                <Route path="forestblue" element={<ForestBlue/>}/>
            </Routes>
        </BrowserRouter>
    );
};

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

export default App;
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
