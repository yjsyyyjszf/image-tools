import React from 'react';
import PropTypes from 'prop-types';
import {observer} from 'mobx-react';

import ReactCrop from './ReactCrop';
import ImageToolsState from './ImageToolsState';
import {
  convertCropScale,
  convertPercentToPixel,
  convertPixelToPercent,
  parseSpec
} from './utils';
import './ImageTools.css';

@observer
export default class ImageTools extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    cb: PropTypes.func.isRequired,
    aspectLock: PropTypes.bool,
    editSpec: PropTypes.string,
    partnerCrops: PropTypes.arrayOf(PropTypes.shape({
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired
    }))
  };

  static defaultProps = {
    aspectLock: false,
    editSpec: 'brt100-sat100-con0x100'
  };

  static getPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  static createReference(element) {
    return {
      element: element,
      position: ImageTools.getPosition(element)
    };
  }

  static imageHost = 'https://proxy.topixcdn.com/ipicimg/';
  static defaultGravity = {x: 0, y: 0, scale: 1};
  static defaultValues = {brt: 100, sat: 100, con: 0};
  static defaultCrop = {x: 10, y: 10, width: 80, height: 80, aspect: 4/2};

  constructor(props) {
    super(props);
    this.store = new ImageToolsState(
      this.props.id,
      parseSpec(this.props.editSpec, ImageTools.defaultValues),
      ImageTools.defaultGravity,
      ImageTools.defaultCrop
    );
    this.cropTool = this.props.partnerCrops ? this.props.partnerCrops : false;
  }

  setImagePosition = (element) => {
    this.previewImage = ImageTools.createReference(element);
  };

  setIndicatorPosition = (element) => {
    this.previewIndicator = ImageTools.createReference(element);
  };

  valuesDisplay() {
    return (
      <h3>{this.store.pixelCrop.width} x {this.store.pixelCrop.height}, {this.store.crop.aspect.toFixed(2)}</h3>
    );
  }

  scalesDisplay() {
    if (this.cropTool) {
      return (
        <div>
          <label>Scale {Math.round(this.store.gravity.scale * 100)}%</label>
          <input onChange={this.updateScale} type="range" value={this.store.gravity.scale * 100} max="500" min="100"></input>
        </div>
      );
    }
  }

  imageDisplay() {
    if (this.cropTool) {
      return (
        <div>
          <img
            className="image" ref={this.setImagePosition} src={`${ImageTools.imageHost}${this.state.id}`}
            onClick={this.updateGravityPosition} style={this.generateImageStyle()} alt="preview"
          />
          <span
            className="indicator" ref={this.setIndicatorPosition}
            onClick={this.updateGravityPosition} style={this.store.gravityStyle}>X
          </span>
        </div>
      );
    } else {
      return (
        <ReactCrop
          className="preview-image" onImageLoaded={this.onImageLoaded}
          src={`${ImageTools.imageHost}${this.store.id}`}
          crop={this.store.crop} onChange={this.cropUpdate}
          style={this.store.imageStyle()}
        />
      );
    }
  }

  updateValues = (event) => {
    const value = event.target.value;
    const type = event.target.dataset.type;
    const values = this.state.values;
    values[type] = value;
    this.store.values = values;
  }

  updateScale = () => {
    const value = event.target.value;
    const gravityObj = this.state.gravity;
    gravityObj.scale = value / 100;
    this.store.gravity = gravityObj;
    // this.calculateCropValues();
  }

  cropUpdate = (crop, pixelCrop) => {
    pixelCrop.aspect = this.props.aspectLock ? crop.aspect : undefined;
    this.store.pixelCrop = pixelCrop;
    this.store.crop = crop;
  }

  onImageLoaded = (crop, image, pixelCrop) => {
    this.imageDimensions = {
      natural: {
        width: image.naturalWidth,
        height: image.naturalHeight
      },
      display: {
        width: image.clientWidth,
        height: image.clientHeight
      },
      aspect: image.clientWidth / image.clientHeight
    }
    this.store.pixelCrop = pixelCrop;
    // this.imageLoadedResolve();
  }

  // convert to mobx
  // change gravity style to observable in state
  updateGravityPosition = (event) => {
    event.persist();
    const gravityObj = this.state.gravity;
    gravityObj.x = event.clientX - this.previewImage.position.x;
    gravityObj.y = event.clientY - this.previewImage.position.y + (event.pageY - event.clientY);
    this.setState({
      gravity: gravityObj,
      gravityStyle: {
        x: event.pageX,
        y: event.pageY
      }
    });
    this.calculateCropValues();
  }

  render() {
    return (
      <div className="test-margin">
       <div className="image-tools" ref={this.setContainerPosition}>
         <div className="menu">
           <div className="content-wrap">
             {this.valuesDisplay()}
             <div>
               <label>Brightness {this.store.values.brt}%</label>
               <input type="range" data-type="brt" onChange={this.updateValues} value={this.store.values.brt} min="100" max="300"></input>
               <label>Saturation {this.store.values.sat}%</label>
               <input type="range" data-type="sat" onChange={this.updateValues} value={this.store.values.sat} min="100" max="300"></input>
               <label>Contrast {this.store.values.con}%</label>
               <input type="range" data-type="con" onChange={this.updateValues} value={this.store.values.con} min="0" max="50"></input>
             </div>
             {this.scaleDisplay()}
             <button onClick={this.reset}>Reset</button>
             <button onClick={this.done}>Done</button>
           </div>
         </div>
         {this.imageDisplay()}
         {this.cropDisplay()}
       </div>
     </div>
    );
  }
}
