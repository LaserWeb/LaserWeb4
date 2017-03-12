/**
 * About module.
 * @module
 */

// React
import React from 'react'
import { connect } from 'react-redux';
import { ButtonToolbar, Button } from 'react-bootstrap'
import Icon from './font-awesome'
import marked from 'marked';
/**
 * About component.
 *
 * @extends module:react~React~Component
 * @param {Object} props Component properties.
 */
class About extends React.Component {
    /**
     * Render the component.
     * @return {String}
     */
    render() {

        let machineAbout;
        if (this.props.settings.__selectedProfile && this.props.profiles.hasOwnProperty(this.props.settings.__selectedProfile)){
          let aboutFile=this.props.profiles[this.props.settings.__selectedProfile].machineAbout
          if (aboutFile) {
            machineAbout=<div dangerouslySetInnerHTML={{__html: marked(require('raw-loader!../data/lw.machines/'+aboutFile))}}></div>
          }
        }

        return (
            <div>

                {machineAbout}

                <h3>Versions</h3>
                  <dl>
                    <dt><Icon name="cubes"/> Frontend: {this.props.settings.__version}</dt><dd></dd><p/>
                    <dt><Icon name="usb"/> Backend: {this.props.settings.comServerVersion}</dt><dd></dd><p/>
                  </dl>
                <h3>Support Communities</h3>
                  <dl>
                    <dt><Icon name="users"/> <a href="https://github.com/LaserWeb">LaserWeb Github Organisation</a></dt>
                    <dd><small>- developer community</small></dd><p/>
                    <dt><Icon name="users"/> <a href="https://plus.google.com/communities/115879488566665599508">LaserWeb G+ Community</a></dt>
                    <dd><small>- support Community for this software itself</small></dd><p/>
                    <dt><Icon name="users"/> <a href="https://plus.google.com/communities/118113483589382049502">K40 Laser G+ Community</a></dt>
                    <dd><small>- support community for popular K40 CO2 Lasers</small></dd><p/>
                    <dt><Icon name="users"/> <a href="https://plus.google.com/communities/109476961016291692936">Eleksmaker G+ Community</a></dt>
                    <dd><small>- support community for chinese diode engravers</small></dd><p/>
                  </dl>
                <h3>Developers</h3>
                  <dl>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/101442607030198502072">Todd Fleming</a> <a target="_blank" href="https://paypal.me/tbfleming"><Icon name="paypal"/></a></dt>
                    <dd><small>- G-Code Generation, 3D viewer, Simulator</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/+S%C3%A9bastienMischler-Skarab">Sebastien Mischler</a> <a target="_blank" href="https://paypal.me/skarab"><Icon name="paypal"/></a></dt>
                    <dd><small>- Backend + Dev environment</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/113562432484049167641">Jorge Robles</a> <a target="_blank" href="https://paypal.me/JorgeDiegoRobles"><Icon name="paypal"/></a></dt>
                    <dd><small>- Settings modules, UI tweaks, Workspace Export</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/+ClaudioPrezzi">Claudio Prezzi</a> <a target="_blank" href="https://paypal.me/cprezzi"><Icon name="paypal"/></a></dt>
                    <dd><small>- Communications</small></dd><p/>
                    <dt><Icon name="user"/> <a href="https://plus.google.com/+PetervanderWalt">Peter van der Walt</a> <a target="_blank" href="https://paypal.me/openhardwarecoza"><Icon name="paypal"/></a></dt>
                    <dd><small>- Support + User Interface</small></dd><p/>
                  </dl>
                <div><i>LaserWeb and CNCWeb is <kbd>free software</kbd>. The team of developers have spent countless hours coding, testing and supporting this application. If you enjoy using this application, consider donating a coffee or a beer towards the developers to show your appreciation, by clicking the <Icon name="paypal"/> icon next to the developers you want to support</i></div>

            </div>
        )
    }
}

About = connect(
    state => ({ settings: state.settings, profiles: state.machineProfiles })
)(About);

// Exports
export default About
