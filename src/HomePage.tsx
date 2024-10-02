import React from 'react';
import './index.css';
import {Link} from "react-router-dom";

function HomePage() {
    return (
        <div className="App">
            <div className="nameHeader">
                <p className={"headerName smallHeaderName"}>DALLIN</p>
                <p className={"headerName bigHeaderName"}>WEBECKE</p>
            </div>
            {/*<div className="links" id="mainLinks">*/}
            {/*    <a className="link" href="https://isitchristmastime.com" target="_blank">Christmas</a>*/}
            {/*    <a className="link" href="https://youtube.com/@DallinWebecke" target="_blank">YouTube</a>*/}
            {/*</div>*/}
            <div className="links" id="socialLinks">
                <a className="link" href="https://youtube.com/@DallinWebecke" target="_blank" rel="noreferrer"><i
                    className="fa fa-youtube"/></a>
                <a className="link" href="https://instagram.com/dallin.from.earth" target="_blank" rel="noreferrer"><i
                    className="fa fa-instagram"/></a>
                <a className="link" href="https://github.com/DallinFromEarth" target="_blank" rel="noreferrer"><i
                    className="fa fa-github-square"/></a>
                <a className="link" href="https://www.linkedin.com/in/dallin-webecke/" target="_blank" rel="noreferrer"><i
                    className="fa fa-linkedin-square"/></a>
            </div>
        </div>
    );
}

export default HomePage;
