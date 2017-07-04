import React from 'react';
import ReactDOM from 'react-dom';

import { Modal, Button} from 'react-bootstrap'

import NestedFileTreeView from 'react-nested-file-tree'
import '../styles/file-manager.css'

import Splitter from './splitter'
import { AllowCapture } from './capture'

const mockupdir = {
  '_contents': [
    {
      'name': '.gitignore',
      'path': '.gitignore'
    },
    {
      'name': 'README.md',
      'path': 'README.md'
    },
    {
      'name': 'Yo Ted',
      'path': 'Yo Ted'
    },
    {
      'name': 'getCustomer.png',
      'path': 'getCustomer.png'
    },
    {
      'name': 'index.html',
      'path': 'index.html'
    }
  ],
  '_layouts': {
    '_contents': [
      {
        'name': '2016-9-10-new-file.md',
        'path': '_layouts/2016-9-10-new-file.md'
      }
    ]
  },
  '_posts': {
    '_contents': [
      {
        'name': 'new-fil-654679.md',
        'path': '_posts/new-fil-654679.md'
      },
      {
        'name': 'new-file1473154764527.md',
        'path': '_posts/new-file1473154764527.md'
      },
      {
        'name': 'new-file1473156139761.md',
        'path': '_posts/new-file1473156139761.md'
      }
    ]
  },
  '_sass': {
    '_contents': [],
    'bourbon': {
      '_contents': [
        {
          'name': 'LICENSE.md',
          'path': '_sass/bourbon/LICENSE.md'
        },
        {
          'name': 'README.md',
          'path': '_sass/bourbon/README.md'
        },
        {
          'name': 'bower.json',
          'path': '_sass/bourbon/bower.json'
        },
        {
          'name': 'eyeglass-exports.js',
          'path': '_sass/bourbon/eyeglass-exports.js'
        },
        {
          'name': 'index.js',
          'path': '_sass/bourbon/index.js'
        }
      ],
      'app': {
        '_contents': [],
        'assets': {
          '_contents': [],
          'stylesheets': {
            '_contents': [
              {
                'name': '_bourbon-deprecated-upcoming.scss',
                'path': '_sass/bourbon/app/assets/stylesheets/_bourbon-deprecated-upcoming.scss'
              },
              {
                'name': '_bourbon.scss',
                'path': '_sass/bourbon/app/assets/stylesheets/_bourbon.scss'
              }
            ],
            'addons': {
              '_contents': [
                {
                  'name': '_border-color.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/addons/_border-color.scss'
                },
                {
                  'name': '_word-wrap.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/addons/_word-wrap.scss'
                }
              ]
            },
            'css3': {
              '_contents': [
                {
                  'name': '_animation.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/css3/_animation.scss'
                },
                {
                  'name': '_appearance.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/css3/_appearance.scss'
                },
                {
                  'name': '_transition.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/css3/_transition.scss'
                },
                {
                  'name': '_user-select.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/css3/_user-select.scss'
                }
              ]
            },
            'functions': {
              '_contents': [
                {
                  'name': '_assign-inputs.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/functions/_assign-inputs.scss'
                },
                {
                  'name': '_contains-falsy.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/functions/_contains-falsy.scss'
                },
                {
                  'name': '_unpack.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/functions/_unpack.scss'
                }
              ]
            },
            'helpers': {
              '_contents': [
                {
                  'name': '_convert-units.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/helpers/_convert-units.scss'
                },
                {
                  'name': '_directional-values.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/helpers/_directional-values.scss'
                },
                {
                  'name': '_str-to-num.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/helpers/_str-to-num.scss'
                }
              ]
            },
            'settings': {
              '_contents': [
                {
                  'name': '_asset-pipeline.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/settings/_asset-pipeline.scss'
                },
                {
                  'name': '_prefixer.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/settings/_prefixer.scss'
                },
                {
                  'name': '_px-to-em.scss',
                  'path': '_sass/bourbon/app/assets/stylesheets/settings/_px-to-em.scss'
                }
              ]
            }
          }
        }
      }
    },
    'website': {
      '_contents': [
        {
          'name': 'main.scss',
          'path': '_sass/website/main.scss'
        }
      ],
      'partials': {
        '_contents': [
          {
            'name': 'README.md',
            'path': '_sass/website/partials/README.md'
          },
          {
            'name': '_notifications.scss',
            'path': '_sass/website/partials/_notifications.scss'
          },
          {
            'name': '_top.scss',
            'path': '_sass/website/partials/_top.scss'
          }
        ]
      }
    }
  }
}

function CustomFolder (props) {
    return (
        <a onClick={props.onclick}><span className='svg'
        dangerouslySetInnerHTML={{__html: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00" enable-background="new 0 0 24.00 24.00" xml:space="preserve">' +
        '<path d="M0 0h24v24H0z" fill="none"></path>' +
        '<path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"></path>' +
        '</svg>'}} />
        { props.name }
        </a>
    )
}

function CustomFile (props) {
    return (
        <a><span className='svg'
        dangerouslySetInnerHTML={{__html: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00" enable-background="new 0 0 24.00 24.00" xml:space="preserve">' +
        '<path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"></path>' +
        '</svg>'}} />
        { props.name }
        </a>
    )
}

function FileManagerModal({ modal, className, header, footer, children, ...rest }) {

    return (
        <Modal show={modal.show} onHide={modal.onHide} bsSize="large" aria-labelledby="contained-modal-title-lg" className={className}>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-lg">{header}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {children}
            </Modal.Body>
            {footer ? <Modal.Footer>{footer}</Modal.Footer> : undefined}

        </Modal>
    )

}

export class FileManagerButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { showModal: false }
        this.handleClick.bind(this)
        this.onModKey.bind(this)
        this.offModKey.bind(this)
        this.state = {}
        this.__mounted=false;
    }

    onModKey(e) {
        let { shiftKey, metaKey, ctrlKey } = e
        if (this.__mounted) this.setState({ shiftKey, metaKey, ctrlKey })
    }

    offModKey(e) {
        let { shiftKey, metaKey, ctrlKey } = e
        if (this.__mounted) this.setState({ shiftKey, metaKey, ctrlKey })
    }

    componentDidMount() {
        this.__mounted=true;
        document.addEventListener('keydown', this.onModKey.bind(this))
        document.addEventListener('keyup', this.offModKey.bind(this))
    }

    componentWillUnmount() {
        this.__mounted=false;
        document.removeEventListener('keydown', this.onModKey.bind(this))
        document.removeEventListener('keyup', this.offModKey.bind(this))
    }



    handleClick(e) {
        if (e.shiftKey) {
            e.preventDefault();
        } else {
            this.setState({ showModal: true })
        }
    }

    render() {
        let closeModal = () => this.setState({ showModal: false });
        let className = this.props.className;
        if (this.state.shiftKey) className += ' btn-warning'
        return (
            <Button bsStyle={this.props.bsStyle||'primary'} bsSize={this.props.bsSize || 'small'} className={className} onClick={(e) => this.handleClick(e)}>{this.props.children}
                <FileManager show={this.state.showModal} onHide={closeModal}  />
            </Button>
        )
    }
}

class FilesPane extends React.Component {

    constructor(props) {
        super(props);
        this.state={}
        this.handleFileClick = this.handleFileClick.bind(this)
    }

    handleFileClick (file) {
      console.log(file)
      this.setState({ selectedFile: file.path })
    }

    render()
    {
        return <div className="file-manager full-height">
            <Splitter split="vertical" initialSize={300} splitterId="filemangerFiles" resizerStyle={{ marginLeft: 2, marginRight: 2 }} >
                <div className="full-height">
                    <NestedFileTreeView
                    expended
                    maxFolderLevel={3}
                    selectedFilePath={this.state.selectedFile}
                    fileTemplate={CustomFile}
                    folderTemplate={CustomFolder}
                    fileClickHandler={this.handleFileClick}
                    directory={mockupdir} />
                </div>
            </Splitter>
        </div>
    }
}

class FileManager extends React.Component
{
    constructor(props){
        super(props)
        this.state={}
        this.handleChange.bind(this)
    }

    handleChange(key, change)
    {
       
    }

    render()
    {
        
        return <FileManagerModal modal={{ show: this.props.show, onHide: this.props.onHide }}
                header="File Manager"
            >
                 <AllowCapture className="paneSizer" >
                    <div className="paneContainer" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                        <FilesPane/>
                        <div className="full-height">aaa</div>
                    </div>
                </AllowCapture>
            </FileManagerModal>
            
    }
}