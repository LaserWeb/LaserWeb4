/**
 * About module.
 * @module
 */

// React
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { ButtonToolbar, Button } from 'react-bootstrap'
import Icon from './font-awesome'
import { marked } from 'marked';
import { version } from '../reducers/settings'
import { confirm } from './laserweb'
import { fetchRelease } from '../lib/releases';
import { LOCALSTORAGE_KEY, getDebug, setDebug } from '../index'
import Toggle from 'react-toggle'

// FIXME: Does the below still work in newer Electron versions that do context isolation?
let isElectron = (window.require != null);

function About() {
    let settings = useSelector((state) => state.settings);

    return (
        <div>
            <img style={{ width: 66 + '%', borderRadius: 14, }} src={require('../lw-logo.png').default} alt="Logo"/>

            <h3>LaserWeb Versions</h3>
                <dl>
                    <dt><Icon name="cubes"/> Frontend: {version}</dt><dd></dd><p/>
                    <dt><Icon name="usb"/> Backend: {settings.comServerVersion} (API: {settings.comApiVersion}) </dt><dd></dd><p/>
                </dl>
                <Releases/>
            <h3>Documentation</h3>
                <dl>
                    <dt><Icon name="home"/> <a href="https://laserweb.yurl.ch/">LaserWeb Homepage</a></dt>
                    <dd><small>- Start Here</small></dd><p/>
                </dl>
            <h3>Support</h3>
                <dl>
                    <dt><Icon name="hashtag"/> <a href="https://forum.makerforums.info/c/laserweb-cncweb/">LaserWeb Community on MakerForums</a></dt>
                    <dd><small>- support Community for this software</small></dd>
                    <dd><small>- this is the place to visit for support questions and answers</small></dd><p/>
                </dl>
            <h4>Communities</h4>
                <dl>
                    <dt><Icon name="anchor"/> <a href="https://forum.makerforums.info/">MakerForums Communities</a></dt>
                    <dd><small>- support communities for Makers</small></dd><p/>
                    <dt><Icon name="users"/> <a href="https://forum.makerforums.info/c/k40/">K40 Laser MakerForum Community</a></dt>
                    <dd><small>- support community for popular K40 CO2 Lasers</small></dd><p/>
                    <dt><Icon name="sitemap"/> <a href="https://forum.makerforums.info/c/halfnormal-toolbox/">HalfNormal's Toolbox</a></dt>
                    <dd><small>- curated links to the best online tools and ideas</small></dd><p/>
                    <dt><Icon name="github"/> <a href="https://github.com/LaserWeb">LaserWeb Github Organisation</a></dt>
                    <dd><small>- developer community</small></dd><p/>
                </dl>
            <h4>Former Developers</h4>
                <dl>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/101442607030198502072">Todd Fleming</a>&nbsp;<a target="_blank" href="https://paypal.me/tbfleming"><Icon name="paypal"/></a></dt>
                    <dd><small>- G-Code Generation, 3D viewer, Simulator</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/+S%C3%A9bastienMischler-Skarab">Sebastien Mischler</a>&nbsp;<a target="_blank" href="https://paypal.me/skarab"><Icon name="paypal"/></a></dt>
                    <dd><small>- Backend + Dev environment</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/+PetervanderWalt">Peter van der Walt</a>&nbsp;<a target="_blank" href="https://paypal.me/openhardwarecoza"><Icon name="paypal"/></a></dt>
                    <dd><small>- Support + User Interface</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/+ArielYahni">Ariel Yahni</a></dt>
                    <dd><small>- Beta testing</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/113562432484049167641">Jorge Robles</a>&nbsp;<a target="_blank" href="https://paypal.me/JorgeDredd"><Icon name="paypal"/></a></dt>
                    <dd><small>- Settings modules, UI tweaks, Workspace Export</small></dd><p/>
                </dl>
            <h4>Current Developers</h4>
                <dl>
                    <dt><Icon name="user"/> <a href="https://forum.makerforums.info/u/cprezzi">Claudio Prezzi</a>&nbsp;<a target="_blank" href="https://paypal.me/cprezzi"><Icon name="paypal"/></a></dt>
                    <dd><small>- Communications server, documentation</small></dd>
                    <dd><small>- Maintenance of both the software and the community for many years</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://forum.makerforums.info/u/easytarget">Owen Carter</a>&nbsp;<a target="_blank" href="https://paypal.me/easytargetorg"><Icon name="paypal"/></a></dt>
                    <dd><small>- v4.1 Frontend improvements, build and packaging maintenance</small></dd>
                    <dd><small>- Currently looking for interesting work.<br/>find me on <a target="_blank" href="https://www.linkedin.com/in/easytarget/"><Icon name="linkedin-square"/>&nbsp;LinkedIN</a></small></dd><p/>
                </dl>

            <div>
                If you would like to assist with the future development of Laserweb please find us on <a target="_blank" href="https://github.com/LaserWeb"><Icon name="github"/>&nbsp;GitHub</a>; we are especially looking for contributors with strong Javascript, React and Redux skills to help with core architecture upgrades
            </div>
            <hr/>
            <div>
                <i>LaserWeb and CNCWeb is <kbd>free software</kbd>. The team of developers have spent countless hours coding, testing and supporting this application. If you enjoy using this application, consider donating a coffee or a beer towards the developers to show your appreciation, by clicking the <Icon name="paypal"/> icon next to the developers you want to support</i>
            </div>

            <hr/>
            <div className="well">
                <h5>Application reset and debug</h5>
                <Lifesaver/>
            </div>

        </div>
    )
}

// Exports
export default About

function toggleDevTools() {
    if (isElectron) {
        const electron = window.require('electron');
        const app = electron.remote;
        var focusedWindow = app.BrowserWindow.getFocusedWindow()
        // focusedWindow.openDevTools();
        if (app.BrowserWindow.getFocusedWindow) {
            // var focusedWindow = app.BrowserWindow.getFocusedWindow()
            if (focusedWindow.isDevToolsOpened()) {
                focusedWindow.closeDevTools();
            } else {
                focusedWindow.openDevTools();
            }
        }
    } else {
        console.warn("Can't do that, pal")
    }
}

function refreshApp() {
    confirm("Are you sure? This will destroy unsaved work", (accepted) => {
        if (accepted) {
            location.reload();
        }
    })
}

function factoryReset() {
    confirm("All data will be zapped!", (accepted) => {
        if (accepted) {
            window.localStorage.removeItem(LOCALSTORAGE_KEY)
            location.reload();
        }
    });
}

function Lifesaver() {
    let button = isElectron
        ? <Button bsSize="xs" bsStyle="warning" onClick={toggleDevTools}><Icon name="gear" /> Toggle Dev tools</Button>
        : null;

    return <ButtonToolbar>
        {button}
        <div className="form-group toggle-right">
            <Toggle defaultChecked={getDebug()} onChange={(e) => setDebug(e.target.checked)} />
            <label>Enable debug logger</label>
        </div>
        <Button bsSize="xs" bsStyle="warning" onClick={refreshApp}>
            <Icon name="refresh" /> Refresh window
        </Button>
        <Button bsSize="xs" bsStyle="danger" onClick={factoryReset}>
            <Icon name="bolt" /> Reset to factory defaults
        </Button>
    </ButtonToolbar>
}

function Releases() {
    let [ release, setRelease ] = React.useState();
    
    useEffect(() => {
        // FIXME(REFACTOR): Proper mechanism for async data fetching, with error handling?
        fetchRelease().then(setRelease);
    }, []);

    // FIXME(SECURITY): The below allows arbitrary HTML to be inserted from the releases page on the repository, which can lead to XSS
    return <div className="releases">
        {release?.tag_name != null ? <h4>Latest release: <a href={release.html_url} target="__blank">{release.tag_name}</a></h4> : null }
        {release?.body != null ? <div dangerouslySetInnerHTML={{__html: marked(release.body)}}/> : null }
    </div>;
}
