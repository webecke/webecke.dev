import React from 'react';
import './index.css';
import { ReactComponent as WebeckeLogo } from './webeckedev.svg';

function HomePage() {
    return (
        <div className="App">
            <div>
                <WebeckeLogo className="logo-svg"/>
            </div>

            <div className="links" id="socialLinks">
                <a className="link" href="https://youtube.com/@DallinWebecke" target="_blank" rel="noreferrer"><i
                    className="fa fa-youtube"/></a>
                <a className="link" href="https://instagram.com/dallin.from.earth" target="_blank" rel="noreferrer"><i
                    className="fa fa-instagram"/></a>
                <a className="link" href="https://github.com/webecke" target="_blank" rel="noreferrer"><i
                    className="fa fa-github-square"/></a>
                <a className="link" href="https://www.linkedin.com/in/dallin-webecke/" target="_blank" rel="noreferrer"><i
                    className="fa fa-linkedin-square"/></a>
            </div>
            <p className={"headerName"}>Dallin Webecke</p>
            <p className={"headerName"}>Developer • Videographer • Disciple</p>
        </div>
    );
}

export default HomePage;
