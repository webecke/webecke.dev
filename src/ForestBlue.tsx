import logoSrc from './ForestBlue.svg';
import './index.css';
import React from "react";
import { Link } from 'react-router-dom';

function ForestBlue() {
    return (
        <div className="App ForestBluePage">
            <Link className="backLink link" to="/" rel="noreferrer"><i
                className="fa fa-arrow-left"/> back to home page</Link>
            <img id="ForestBlueLogo" src={logoSrc} alt="Logo"/>
            <div className="About">
                <p>As a computer science major at BYU, and a problem solver,
                    I've decided to start making coding projects, to practice
                    building things and to solve problems for me and others
                    in my life. Thus, I've started ForestBlue Development.</p>
                <p>ForestBlue Development (at least currently) is not an actual
                    legal entity. Its just me, Dallin Webecke, putting a brand
                    on my coding projects that I put out there.</p>

                <hr/>

                <h2>Projects</h2>
                <h3>JolleyBites - Recipe Cost Calculator</h3>
                <p>JolleyBites is a simple tool to help you calculate how much
                    it costs to cook or bake the recipes that you have.</p>
                <p>You enter in all the ingredients you buy at the store, just
                    what you see on the receipt, then you enter the recipe,
                    and it will tell you how much it all costs. Including
                    ingredients, electricity, taxes, and time. You can then
                    put together meals and it will calculate that cost for
                    you as well.</p>
                <p><a className="standardLink link" href="https://github.com/DallinFromEarth/JolleyBites" target="_blank" rel="noreferrer">View the GitHub</a>
                    <span>  |  </span><a className="standardLink link" href="https://jolleybites.webecke.dev" target="_blank" rel="noreferrer">View it Live</a>
                </p>
                <hr/>

                <p>That's all the projects for now. I'll put more on here as I make them.</p>

            </div>
        </div>
    )
}

export default ForestBlue